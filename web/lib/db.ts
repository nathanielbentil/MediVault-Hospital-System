import { Pool } from 'pg';

let pool: Pool;

const sanitize = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');

if (!globalThis._pgPool) {
  const host = sanitize(process.env.DB_HOST) || 'aws-0-eu-west-2.pooler.supabase.com';
  const port = parseInt(sanitize(process.env.DB_PORT) || '6543', 10);
  const database = sanitize(process.env.DB_NAME) || 'postgres';
  let user = sanitize(process.env.DB_USER) || 'postgres.wulriexoojidlilizmps';
  if (user === 'postgres' || !user.includes('.')) {
    user = 'postgres.wulriexoojidlilizmps';
  }
  const password = sanitize(process.env.DB_PASSWORD) || 'f#_qApAc55qy54n';

  globalThis._pgPool = new Pool({
    host,
    port,
    database,
    user,
    password,
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
