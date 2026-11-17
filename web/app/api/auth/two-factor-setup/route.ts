import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { AuditLogService } from '@/lib/audit';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token = req.cookies.get('medivault_session')?.value || null;
  }
  if (!token) return null;
  return AuthService.verifyToken(token);
}

// GET /api/auth/two-factor-setup - Generate secret and QR code for authenticator app
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const secret = generateSecret();
    const uri = generateURI({
      issuer: 'MediVault HMS',
      label: authUser.email,
      secret,
    });

    const qrCodeUrl = await QRCode.toDataURL(uri, {
      width: 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      success: true,
      secret,
      qrCodeUrl,
      email: authUser.email,
      issuer: 'MediVault HMS',
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('GET /api/auth/two-factor-setup error:', err);
    return NextResponse.json(
      { success: false, message: 'Could not generate 2FA pairing QR code.' },
      { status: 500 }
    );
  }
}

// POST /api/auth/two-factor-setup - Confirm code from app and save secret to user account
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const body = await req.json();
    const { secret, code } = body;

    if (!secret || !code) {
      return NextResponse.json(
        { success: false, message: 'Secret and verification code are required.' },
        { status: 400 }
      );
    }

    const trimmedCode = String(code).trim();
    const trimmedSecret = String(secret).trim();

    // Verify token with 30s drift tolerance
    const result = verifySync({
      token: trimmedCode,
      secret: trimmedSecret,
      epochTolerance: 30,
    });

    if (!result || !result.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid 6-digit verification code. Please check your Google/Microsoft Authenticator app.',
        },
        { status: 400 }
      );
    }

    // Generate 8 alphanumeric recovery backup codes
    const recoveryCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const codePart = crypto.randomBytes(4).toString('hex').toUpperCase();
      recoveryCodes.push(`${codePart.slice(0, 4)}-${codePart.slice(4)}`);
    }

    // Persist real secret in PostgreSQL
    await pool.query(
      `UPDATE users 
       SET two_factor_secret = $1, 
           two_factor_recovery_codes = $2, 
           two_factor_confirmed_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $3`,
      [trimmedSecret, JSON.stringify(recoveryCodes), authUser.userId]
    );

    // Immutable forensic audit log entry
    await AuditLogService.record({
      userId: authUser.userId,
      eventType: 'auth.2fa_enabled',
      description: `User [${authUser.email}] successfully bound and verified real RFC 6238 TOTP 2FA authenticator app.`,
      severity: 'info',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Two-Factor Authentication successfully paired with your authenticator device!',
      recoveryCodes,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('POST /api/auth/two-factor-setup error:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to pair Two-Factor Authenticator.' },
      { status: 500 }
    );
  }
}
