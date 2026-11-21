import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PasswordService } from '@/lib/password';
import { AuthService } from '@/lib/auth';
import { AuditLogService } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role = 'Doctor', department = 'Clinical Care' } = body;

    // 1. Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid staff email address.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 2. Check for duplicate email
    const existing = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'An account with this email address already exists. Please sign in instead.',
        },
        { status: 409 }
      );
    }

    // 3. Cryptographic Salting & Peppering Pipeline (Identical to pre-seeded hospital accounts)
    // Layer 1: 256-bit server HMAC Pepper (PEPPER_V1)
    // Layer 2: 128-bit CSPRNG Salt
    // Layer 3: Argon2id (m=65536, t=4, p=2)
    const hashResult = await PasswordService.hash(password, 'v1');
    const fullHash = hashResult.hash;
    const extractedSalt = PasswordService.extractSalt(fullHash);

    // 4. Insert into users table
    const insertRes = await pool.query(
      `INSERT INTO users (name, email, password, salt, pepper_version, status, failed_login_attempts, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'v1', 'active', 0, NOW(), NOW())
       RETURNING id, name, email, salt, pepper_version, status, created_at`,
      [cleanName, cleanEmail, fullHash, extractedSalt]
    );

    const newUser = insertRes.rows[0];

    // 5. Map and assign role in role_user
    const roleMapping: Record<string, number> = {
      doctor: 3,
      physician: 3,
      nurse: 4,
      pharmacist: 5,
      auditor: 6,
      manager: 2,
      admin: 1,
    };

    const requestedRoleKey = (role || '').toLowerCase();
    let targetRoleId = 3; // Default: Attending Physician / Doctor

    for (const [key, id] of Object.entries(roleMapping)) {
      if (requestedRoleKey.includes(key)) {
        targetRoleId = id;
        break;
      }
    }

    // Look up canonical role name from database
    const roleDb = await pool.query('SELECT id, name, slug FROM roles WHERE id = $1', [targetRoleId]);
    const canonicalRole = roleDb.rows[0] ? roleDb.rows[0].name : 'Attending Physician / Doctor';

    await pool.query(
      `INSERT INTO role_user (user_id, role_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [newUser.id, targetRoleId]
    );

    // 6. Record immutable cryptographic audit log entry
    await AuditLogService.record({
      userId: newUser.id,
      eventType: 'auth.registered',
      description: `New personnel registered: [${cleanName} <${cleanEmail}>] assigned role [${canonicalRole}]. Argon2id hash and 128-bit salt committed to security database.`,
      severity: 'info',
      payload: {
        role: canonicalRole,
        department,
        pepper_version: 'v1',
        salt_preview: extractedSalt ? `${extractedSalt.substring(0, 10)}...` : 'stored',
        ip: clientIp,
      },
      ipAddress: clientIp,
    });

    // 7. Issue JWT Session Token so user is immediately authenticated
    const token = AuthService.signToken({
      userId: newUser.id,
      email: newUser.email,
      role: canonicalRole,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      message: `Welcome to MediVault, ${cleanName}! Your account has been created and verified.`,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: canonicalRole,
        roles: [canonicalRole],
        is_admin: targetRoleId === 1,
        two_factor_enabled: false,
      },
    });

    // Set HTTP-Only Cookie for seamless web session
    response.cookies.set('medivault_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('POST /api/auth/register error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Registration service error. Please try again.',
        error_detail: err.message,
      },
      { status: 500 }
    );
  }
}
