import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      token = req.cookies.get('medivault_session')?.value || null;
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Session expired.' }, { status: 401 });
    }

    const userRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.two_factor_confirmed_at, r.name as role_name
       FROM users u
       LEFT JOIN role_user ru ON ru.user_id = u.id
       LEFT JOIN roles r ON r.id = ru.role_id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const user = userRes.rows[0];
    const role = user.role_name || payload.role;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        roles: [role],
        is_admin: role.includes('Admin') || role.includes('Chief'),
        two_factor_enabled: !user.two_factor_confirmed_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
