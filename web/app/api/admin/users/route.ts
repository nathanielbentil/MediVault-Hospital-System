import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { PasswordService } from '@/lib/password';
import { AuditLogService } from '@/lib/audit';

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token = req.cookies.get('medivault_session')?.value || null;
  }
  if (!token) return null;
  return AuthService.verifyToken(token);
}

// GET /api/admin/users - List personnel
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const role = (user.role || '').toLowerCase();
    const canView = role.includes('admin') || role.includes('chief') || role.includes('manager') || role.includes('auditor');
    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Access Denied: Staff directory access requires administrative clearance.' },
        { status: 403 }
      );
    }

    const res = await pool.query(
      `SELECT u.id, u.name, u.email, u.failed_login_attempts, u.two_factor_confirmed_at,
              u.created_at, r.name as role_name
       FROM users u
       LEFT JOIN role_user ru ON ru.user_id = u.id
       LEFT JOIN roles r ON r.id = ru.role_id
       ORDER BY u.id ASC`
    );

    return NextResponse.json({
      success: true,
      users: res.rows,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: 'Failed to retrieve staff directory.' }, { status: 500 });
  }
}

// POST /api/admin/users - Register new hospital staff worker
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    // RBAC: Strictly restricted to Chief Admin and Managing Director (MD)
    const role = (user.role || '').toLowerCase();
    const canRegisterWorkers = role.includes('admin') || role.includes('chief') || role.includes('manager');
    if (!canRegisterWorkers) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access Denied: Only the Chief Administrator and Hospital Managing Director (MD) are authorized to register new personnel.',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, assignedRole = 'Doctor', department = 'Clinical Care' } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Full name, email address, and initial password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: `An account with email ${cleanEmail} already exists in the system.` },
        { status: 409 }
      );
    }

    // Hash password using Argon2id + HMAC Pepper
    const hash = await PasswordService.hash(password);

    // Insert user into PostgreSQL
    const insertUserRes = await pool.query(
      `INSERT INTO users (name, email, password, pepper_version, failed_login_attempts, created_at, updated_at)
       VALUES ($1, $2, $3, 'v1', 0, NOW(), NOW())
       RETURNING id, name, email, created_at`,
      [name.trim(), cleanEmail, hash]
    );

    const newUser = insertUserRes.rows[0];

    // Find role id from roles table or fallback
    let roleId = 3; // Default doctor
    const roleSearch = await pool.query(
      'SELECT id FROM roles WHERE LOWER(name) LIKE $1 OR LOWER(slug) LIKE $1 LIMIT 1',
      [`%${assignedRole.toLowerCase()}%`]
    );
    if (roleSearch.rows.length > 0) {
      roleId = roleSearch.rows[0].id;
    }

    // Link role_user
    await pool.query(
      `INSERT INTO role_user (user_id, role_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [newUser.id, roleId]
    );

    // Record immutable audit event
    await AuditLogService.record({
      userId: user.userId,
      eventType: 'user.created',
      description: `Executive Officer [${user.email}] registered new worker [${newUser.name} <${newUser.email}>] with role [${assignedRole}] in department [${department}].`,
      severity: 'info',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: `Staff member ${newUser.name} successfully registered as ${assignedRole}.`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: assignedRole,
        department,
      },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ success: false, message: 'Could not register staff worker.', error: err.message }, { status: 500 });
  }
}
