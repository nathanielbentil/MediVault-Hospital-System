import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PasswordService } from '@/lib/password';
import { AuditLogService } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, password, confirmPassword } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and new password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user from PostgreSQL
    const userRes = await pool.query(
      'SELECT id, name, email, status FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      // OWASP Anti-User Enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email address, the password has been updated.',
      });
    }

    const user = userRes.rows[0];

    // Cryptographic Salting & Peppering Pipeline
    const hashResult = await PasswordService.hash(password, 'v1');
    const fullHash = hashResult.hash;
    const extractedSalt = PasswordService.extractSalt(fullHash);

    // Update password, reset failed attempts & lockout
    await pool.query(
      `UPDATE users 
       SET password = $1, 
           salt = $2, 
           pepper_version = 'v1', 
           failed_login_attempts = 0, 
           lockout_until = NULL, 
           updated_at = NOW() 
       WHERE id = $3`,
      [fullHash, extractedSalt, user.id]
    );

    // Record immutable audit event
    await AuditLogService.record({
      userId: user.id,
      eventType: 'auth.password_reset',
      description: `Staff member [${user.name} <${user.email}>] completed self-service password reset. Argon2id hash refreshed with HMAC pepper.`,
      severity: 'info',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name} has been successfully updated. You may now sign in.`,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('Password reset error:', err);
    return NextResponse.json(
      { success: false, message: 'Could not reset password. Please try again or contact IT administration.' },
      { status: 500 }
    );
  }
}
