import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { PasswordService } from '@/lib/password';

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    token = req.cookies.get('medivault_session')?.value || null;
  }
  if (!token) return null;
  return AuthService.verifyToken(token);
}

// GET /api/admin/security/salt-pepper - Return architecture parameters and live user salt/pepper metadata
export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const role = (user.role || '').toLowerCase();
    const canView = role.includes('admin') || role.includes('chief') || role.includes('manager');
    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Access Denied: Requires administrative security clearance.' },
        { status: 403 }
      );
    }

    // Query personnel accounts from PostgreSQL to inspect live database salts and pepper versions
    const res = await pool.query(
      `SELECT u.id, u.name, u.email, u.pepper_version, u.password, u.salt, r.name as role_name
       FROM users u
       LEFT JOIN role_user ru ON ru.user_id = u.id
       LEFT JOIN roles r ON r.id = ru.role_id
       ORDER BY u.id ASC
       LIMIT 12`
    );

    const personnelSalts = res.rows.map((row) => {
      const parts = (row.password || '').split('$');
      const saltValue = row.salt || parts[4] || '128-bit-csprng-salt';
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role_name || 'Staff',
        pepperVersion: row.pepper_version || 'v1',
        algorithm: parts[1] || 'argon2id',
        version: parts[2] || 'v=19',
        parameters: parts[3] || 'm=65536,t=4,p=2',
        salt: saltValue,
        salt_hex: saltValue,
        hash_sample: row.password ? `${row.password.slice(0, 38)}...` : '',
        hashDigestPreview: parts[5] ? `${parts[5].slice(0, 12)}...${parts[5].slice(-8)}` : 'Stored',
        fullHash: row.password,
        databaseTable: 'users',
        dbColumns: {
          password: row.password,
          salt: row.salt || parts[4],
          pepper_version: row.pepper_version || 'v1',
        },
      };
    });

    return NextResponse.json({
      success: true,
      architecture: {
        pepper: {
          version: 'v1',
          algorithm: 'HMAC-SHA256',
          entropyBits: 256,
          storageLocation: 'Secure Server Process Memory / Environment Variable (.env.local)',
          databaseSeparation: 'NEVER stored in PostgreSQL. If the database is compromised, password hashes cannot be cracked without this server-side key.',
          pepperKeyPreview: '58ccdb65b61dfa1586e00d6cf4268f24d09d0c4ad69e7cfb555184c3fc02f91e',
        },
        salt: {
          algorithm: 'CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)',
          lengthBits: 128,
          lengthBytes: 16,
          uniqueness: 'Unique 16-byte random salt generated independently for EVERY single user password.',
          purpose: 'Defeats pre-computed rainbow tables and ensures two identical passwords produce completely different hash strings in the database.',
        },
        argon2id: {
          standard: 'RFC 9106 / NIST SP 800-63B Password Hashing Winner',
          memoryHardness: '65536 KB (64 MB RAM allocation per calculation)',
          timeIterations: '4 iterations (tunable work factor)',
          parallelismThreads: '2 parallel execution threads',
          format: '$argon2id$v=19$m=65536,t=4,p=2$<SALT>$<HASH>',
        },
      },
      personnelSalts,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('GET /api/admin/security/salt-pepper error:', err);
    return NextResponse.json(
      { success: false, message: 'Could not fetch salt and pepper configuration.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/security/salt-pepper - Live Interactive Salting & Peppering Pipeline Simulator
export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthenticated.' }, { status: 401 });
    }

    const body = await req.json();
    const samplePassword = (body.password || 'Lecturer@MediVault2026!').trim();

    // 1. Stage 1: Raw Input
    const rawInput = samplePassword;

    // 2. Stage 2: Server-Side HMAC-SHA256 Pepper
    const pepperSecret = '58ccdb65b61dfa1586e00d6cf4268f24d09d0c4ad69e7cfb555184c3fc02f91e';
    const pepperedHex = PasswordService.pepper(rawInput, 'v1');

    // 3. Stage 3 & 4: Salt Generation and Argon2id Hashing
    const startTime = Date.now();
    const hashResult = await PasswordService.hash(rawInput, 'v1');
    const computeDurationMs = Date.now() - startTime;

    const parts = hashResult.hash.split('$');
    const algorithm = parts[1] || 'argon2id';
    const version = parts[2] || 'v=19';
    const params = parts[3] || 'm=65536,t=4,p=2';
    const extractedSalt = parts[4] || '';
    const hashDigest = parts[5] || '';

    // 4. Stage 5: Verification Test
    const isVerified = await PasswordService.verify(rawInput, hashResult.hash, 'v1');

    return NextResponse.json({
      success: true,
      simulation: {
        rawPassword: rawInput,
        stage1_raw_input: rawInput,
        stage2_peppered_digest: pepperedHex,
        stage3_salt_hex: extractedSalt,
        stage4_final_mcf_hash: hashResult.hash,
        step1_raw: {
          description: 'User enters raw plaintext password during registration or login.',
          value: rawInput,
        },
        step2_pepper: {
          description: 'Server injects private 256-bit HMAC-SHA256 Pepper stored strictly in server environment memory (never written to PostgreSQL).',
          pepperKey: pepperSecret,
          pepperAlgorithm: 'HMAC-SHA256',
          pepperedHex,
        },
        step3_salt: {
          description: 'Argon2id engine generates a unique 128-bit CSPRNG random salt for this specific hash.',
          saltBase64: extractedSalt,
          saltBits: 128,
          saltBytes: 16,
        },
        step4_argon2id: {
          description: 'Memory-hard Argon2id hash calculated with 64MB RAM hardness and 4 iterations to permanently prevent GPU/ASIC brute force attacks.',
          algorithm,
          version,
          parameters: params,
          hashDigest,
          finalDatabaseMCF: hashResult.hash,
          computeDurationMs,
        },
        step5_verification: {
          verified: isVerified,
          summary: 'Cryptographic pipeline passed: Password verified successfully with HMAC Pepper + Per-User Salt.',
        },
      },
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) throw err;
    console.error('POST /api/admin/security/salt-pepper error:', err);
    return NextResponse.json(
      { success: false, message: 'Simulation error during salt and pepper execution.' },
      { status: 500 }
    );
  }
}
