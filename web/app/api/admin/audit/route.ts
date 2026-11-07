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
    const isAuthorized = role.includes('admin') || role.includes('chief') || role.includes('auditor') || role.includes('manager');
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Access Denied: Security Audit is restricted to Executives, Auditors, and Administrators.' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const verification = await AuditLogService.verifyChain();

    let query = `
      SELECT a.id, a.event_type, a.description, a.severity, a.ip_address, a.created_at,
             u.name as user_name, u.email as user_email, u.id as user_id
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (userId && userId !== 'all') {
      params.push(userId);
      conditions.push(`a.user_id = $${params.length}`);
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR a.description ILIKE $${params.length} OR a.event_type ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY a.id DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const recentLogs = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      chain_intact: verification.intact,
      verified_records: verification.verifiedCount,
      broken_at_id: verification.brokenAt || null,
      logs: recentLogs.rows,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('Audit GET route error:', err);
    return NextResponse.json({ success: false, message: 'Could not fetch audit records.', error: err.message }, { status: 500 });
  }
}
