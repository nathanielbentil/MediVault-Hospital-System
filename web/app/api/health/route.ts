import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT NOW() as server_time, count(*) as patient_count FROM patients;');
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      cluster: 'AWS London (eu-west-2)',
      timestamp: new Date().toISOString(),
      server_time: result.rows[0].server_time,
      patient_count: parseInt(result.rows[0].patient_count, 10),
      keep_alive: 'active',
      message: 'Supabase PostgreSQL activity verified successfully',
    });
  } catch (error: any) {
    const sanitize = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');
    const user = sanitize(process.env.DB_USER) || 'default-fallback';
    const host = sanitize(process.env.DB_HOST) || 'default-fallback';
    const pass = sanitize(process.env.DB_PASSWORD);
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message: error.message || 'Database ping failed',
        debug: {
          has_env_db_user: !!process.env.DB_USER,
          user,
          host,
          has_env_db_pass: !!process.env.DB_PASSWORD,
          pass_len: pass.length,
          pass_first_char: pass.length > 0 ? pass[0] : null,
          pass_last_char: pass.length > 0 ? pass[pass.length - 1] : null,
        }
      },
      { status: 500 }
    );
  }
}
