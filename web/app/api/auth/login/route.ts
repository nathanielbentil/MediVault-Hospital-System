import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PasswordService } from '@/lib/password';
import { AuthService } from '@/lib/auth';
import { AuditLogService } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Fetch user from PostgreSQL
    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.password, u.pepper_version, u.failed_login_attempts, 
              u.lockout_until, u.two_factor_secret, u.two_factor_confirmed_at,
              r.name as role_name
       FROM users u
       LEFT JOIN role_user ru ON ru.user_id = u.id
       LEFT JOIN roles r ON r.id = ru.role_id
       WHERE LOWER(u.email) = $1
       LIMIT 1`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials provided.' },
        { status: 401 }
      );
    }

    const user = userRes.rows[0];

    // 2. Check Brute-Force Lockout (15 mins after 5 attempts)
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.lockout_until).getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: `Account is temporarily locked due to consecutive failed attempts. Try again in ${remainingMinutes} minute(s).`,
        },
        { status: 423 }
      );
    }

    // 3. Verify Argon2id + HMAC Pepper Password
    const isValid = await PasswordService.verify(password, user.password, user.pepper_version || 'v1');

    if (!isValid) {
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      let lockoutDate = null;
      if (newAttempts >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60000);
      }

      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3',
        [newAttempts, lockoutDate, user.id]
      );

      await AuditLogService.record({
        eventType: 'auth.password_mismatch',
        description: `Failed login attempt for [${user.email}]. Attempts left before lockout: ${Math.max(0, 5 - newAttempts)}.`,
        userId: user.id,
        severity: 'warning',
        payload: { ip: clientIp, attempts: newAttempts },
        ipAddress: clientIp,
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials provided.',
          attempts_left: Math.max(0, 5 - newAttempts),
        },
        { status: 401 }
      );
    }

    // Reset failed login attempts on valid password
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    const userRole = user.role_name || 'Doctor';

    // 4. Two-Factor Authentication Check
    if (user.two_factor_confirmed_at) {
      const tempToken = AuthService.signTemp2FAToken(user.id);

      await AuditLogService.record({
        eventType: 'auth.2fa_prompted',
        description: `User [${user.email}] prompted for 2FA TOTP code.`,
        userId: user.id,
        severity: 'info',
        payload: { ip: clientIp },
        ipAddress: clientIp,
      });

      return NextResponse.json({
        success: true,
        two_factor_required: true,
        message: 'Two-Factor Authentication is required.',
        temp_token: tempToken,
      });
    }

    // 5. Generate Bearer Token
    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: userRole,
      name: user.name,
    });

    await AuditLogService.record({
      eventType: 'auth.login_success',
      description: `User [${user.email}] successfully authenticated.`,
      userId: user.id,
      severity: 'info',
      payload: { ip: clientIp },
      ipAddress: clientIp,
    });

    const response = NextResponse.json({
      success: true,
      two_factor_required: false,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        roles: [userRole],
        is_admin: userRole.includes('Admin') || userRole.includes('Chief'),
        two_factor_enabled: false,
      },
    });

    // Set HTTP-Only Cookie for seamless web portal usage
    response.cookies.set('medivault_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('API /api/auth/login error:', err);
    return NextResponse.json(
      { success: false, message: 'Server authentication error.' },
      { status: 500 }
    );
  }
}
