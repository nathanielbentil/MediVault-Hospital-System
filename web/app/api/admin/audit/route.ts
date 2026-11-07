import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/lib/audit';
import { AuthService } from '@/lib/auth';
import pool from '@/lib/db';

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token = req.cookies.get('medivault_session')?.value || null;
  }
  if (!token) return null;
  return AuthService.verifyToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const role = (user.role || '').toLowerCase();
    const isAuthorized = role.includes('admin') || role.includes('chief') || role.includes('auditor');
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Access Denied: Security Audit is restricted to Auditors and Administrators.' },
        { status: 403 }
      );
    }

    const verification = await AuditLogService.verifyChain();
    const recentLogs = await pool.query(
      `SELECT a.id, a.event_type, a.description, a.severity, a.ip_address, a.created_at,
              u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC
       LIMIT 25`
    );

    return NextResponse.json({
      success: true,
      chain_intact: verification.intact,
      verified_records: verification.verifiedCount,
      broken_at_id: verification.brokenAt || null,
      logs: recentLogs.rows,
    });
  } catch (err: any) {
    console.error('Audit GET route error:', err);
    return NextResponse.json({ success: false, message: 'Could not fetch audit records.', error: err.message }, { status: 500 });
  }
}
