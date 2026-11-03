import { Pool } from 'pg';

let pool: Pool;

if (!globalThis._pgPool) {
  globalThis._pgPool = new Pool({
    host: process.env.DB_HOST || 'aws-0-eu-west-2.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '6543'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres.wulriexoojidlilizmps',
    password: process.env.DB_PASSWORD || 'f#_qApAc55qy54n',
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

pool = globalThis._pgPool;

declare global {
  var _pgPool: Pool | undefined;
}

export default pool;

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  return res;
}
