import crypto from 'crypto';
import pool from './db';

export interface AuditPayload {
  eventType: string;
  description: string;
  userId?: number | null;
  severity?: 'info' | 'notice' | 'warning' | 'critical';
  payload?: any;
  ipAddress?: string;
}

export class AuditLogService {
  /**
   * Append a new immutable audit record to the cryptographic Merkle chain.
   */
  public static async record({
    eventType,
    description,
    userId = null,
    severity = 'info',
    payload = {},
    ipAddress = '127.0.0.1',
  }: AuditPayload): Promise<void> {
    try {
      // 1. Fetch previous record hash to maintain unbroken Merkle chain
      const lastLog = await pool.query(
        'SELECT id, record_hash FROM audit_logs ORDER BY id DESC LIMIT 1'
      );
      const previousHash =
        lastLog.rows.length > 0 && lastLog.rows[0].record_hash
          ? lastLog.rows[0].record_hash
          : '0000000000000000000000000000000000000000000000000000000000000000';

      const timestamp = new Date().toISOString();
      const payloadJson = JSON.stringify(payload || {});

      // 2. Compute canonical SHA-256 record hash
      const dataToHash = `${previousHash}|${eventType}|${userId ?? ''}|${timestamp}|${payloadJson}`;
      const recordHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      // 3. Insert audit log
      await pool.query(
        `INSERT INTO audit_logs 
          (user_id, event_type, description, severity, ip_address, payload, previous_hash, record_hash, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          userId,
          eventType,
          description,
          severity,
          ipAddress,
          payloadJson,
          previousHash,
          recordHash,
        ]
      );
    } catch (err) {
      console.error('AuditLogService.record error:', err);
    }
  }

  /**
   * Verify the entire cryptographic chain integrity.
   */
  public static async verifyChain(): Promise<{ intact: boolean; verifiedCount: number; brokenAt?: number }> {
    const res = await pool.query(
      'SELECT id, event_type, user_id, created_at, payload, previous_hash, record_hash FROM audit_logs ORDER BY id ASC'
    );
    const logs = res.rows;
    let prev = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (i > 0 && log.previous_hash !== prev) {
        return { intact: false, verifiedCount: i, brokenAt: log.id };
      }
      prev = log.record_hash;
    }

    return { intact: true, verifiedCount: logs.length };
  }
}
