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
    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        message: error.message || 'Database ping failed',
      },
      { status: 500 }
    );
  }
}
