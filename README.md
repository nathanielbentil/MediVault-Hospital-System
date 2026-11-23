# MediVault Hospital Management System & EHR

A secure, multi-tier Hospital Management System (HMS) and Electronic Health Record (EHR) platform built with Next.js 16, React 19, and PostgreSQL. Designed for clinical governance, patient record management, role-based access control, cryptographic password security compliant with NIST SP 800-63B, and sequential Merkle hash-chained audit logging.

**Live Demo:** [https://medivault-hospital-system.vercel.app](https://medivault-hospital-system.vercel.app)  
**Source Repository:** [https://github.com/nathanielbentil/MediVault-Hospital-System](https://github.com/nathanielbentil/MediVault-Hospital-System)  
**Author:** Nathaniel Bentil

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Cryptographic Security Architecture](#cryptographic-security-architecture)
- [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
- [Immutable Audit Trail](#immutable-audit-trail)
- [Disaster Recovery & 3-2-1 Backups](#disaster-recovery--3-2-1-backups)
- [Clinical Workstations & RBAC Modules](#clinical-workstations--rbac-modules)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Compliance & Standards](#compliance--standards)
- [License](#license)

---

## Overview

MediVault provides a unified digital infrastructure for inpatient and outpatient clinical administration. It connects admissions, medical diagnostics, bedside nursing observations, pharmacy fulfillment, and administrative oversight within a single zero-trust system.

Key capabilities include:
- **Three-Layer Password Defense:** Combines server-side HMAC-SHA256 peppering, individual 128-bit CSPRNG salts, and memory-hard Argon2id key derivation.
- **Self-Service & Admin Registration:** Dual-mode portal supporting self-registration for clinical staff and administrative onboarding.
- **Two-Factor Authentication:** RFC 6238 Time-Based One-Time Password (TOTP) pairing with local QR code generation and emergency single-use recovery keys.
- **Merkle Hash-Chained Audit Logging:** Cryptographic sequential block hashing where each event binds to the preceding record digest to ensure tamper detection.
- **Role-Based Access Control (RBAC):** Strict operational boundaries for Chief Administrators, Managing Directors, Physicians, Nurses, Pharmacists, and Compliance Auditors.
- **3-2-1 Disaster Recovery:** Automated multi-tier database backups with SHA-256 digest validation and verifiable recovery SLAs.

---

## System Architecture

MediVault follows a 3-tier decoupled architecture:

```
[ Client Workstations ]
    │  (HTTPS / TLS 1.3 - Browser UI on Desktop & Tablet)
    ▼
[ Next.js 16 Application Server (Vercel / Node.js Runtime) ]
    ├── App Router & Serverless API Routes (/api/*)
    ├── RBAC Gateway & Session Management (HTTP-Only Signed JWT)
    ├── Cryptographic Engine (Argon2id + HMAC Pepper + CSPRNG Salt)
    ├── AuditLogService (Sequential Merkle Hash Chaining)
    └── Backup & Recovery Manager (Snapshot & Digest Verification)
    │
    │  (Encrypted TCP Pooler - Port 6543)
    ▼
[ PostgreSQL Database Cluster (AWS London eu-west-2) ]
    ├── users (credentials, salts, status, failed attempts)
    ├── roles & role_user (RBAC mappings)
    ├── patients (demographics, triage, EHR, allergy records)
    ├── audit_logs (cryptographic chained event entries)
    └── backups (snapshot metadata and SHA-256 checksums)
```

### Technology Stack

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 16.4.5 | Full-stack application architecture and serverless API endpoints |
| **Frontend Library** | React | 19.3.0 | Component rendering, state synchronization, and UI lifecycle |
| **Language** | TypeScript | 5.x | End-to-end type safety across client and server |
| **Styling** | Tailwind CSS | 4.x | Utility-first styling with responsive dark theme |
| **Database** | PostgreSQL | 16.x | Relational data persistence hosted on AWS London (`eu-west-2`) |
| **DB Client** | `pg` (Node-Postgres) | 8.13.x | Connection pooling with SSL validation |
| **Key Derivation** | `@node-rs/argon2` | 2.0.x | Rust-compiled Argon2id hashing engine |
| **Icons** | Lucide React | 1.16.x | Interface iconography |

---

## Cryptographic Security Architecture

MediVault implements password storage following **NIST SP 800-63B** guidelines. Rather than relying on simple hashing, passwords undergo a three-layer cryptographic pipeline before database persistence.

```
Plaintext Password
       │
       ▼
[ Layer 1: Server-Side HMAC-SHA256 Pepper ]
       │  Key: 256-bit secret stored strictly in server process memory (PEPPER_V1)
       │  Never stored in database tables or backups.
       ▼
[ Layer 2: Per-User 128-bit CSPRNG Salt ]
       │  Unique 16-byte cryptographically secure random salt generated per user.
       │  Stored in users.salt and encoded into Modular Crypt Format (MCF).
       ▼
[ Layer 3: Argon2id Memory-Hard Key Derivation ]
       │  Cost Parameters:
       │    - Memory (m): 65536 KB (64 MB RAM per hash)
       │    - Time (t):   4 iterations
       │    - Threads (p): 2 parallel lanes
       │    - Algorithm:  Argon2id (RFC 9106)
       ▼
Stored Database Hash ($argon2id$v=19$m=65536,t=4,p=2$<salt>$<digest>)
```

### Defense Benefits
1. **Database Dump Immunity:** If the PostgreSQL database is compromised via an SQL injection or backup leak, the attacker cannot crack the password hashes without the server-side pepper key, which resides strictly in server environment memory.
2. **Rainbow Table Resistance:** Individual 128-bit CSPRNG salts guarantee that two users with identical passwords produce entirely different database hashes.
3. **GPU / ASIC Resistance:** The 64 MB memory requirement per hash calculation neutralizes high-speed parallel GPU cracking equipment.
4. **Brute-Force Account Protection:** Five consecutive failed authentication attempts automatically lock the target account for 15 minutes, with full telemetry logged to the audit ledger.

---

## Two-Factor Authentication (2FA)

MediVault enforces **RFC 6238 Time-Based One-Time Password (TOTP)** authentication.

- **Enrollment Flow:** Users generate a shared secret, displayed both as an inline SVG QR code and a plain base32 key for import into Google Authenticator, Microsoft Authenticator, or Apple Passwords.
- **Zero Third-Party Leaks:** QR codes are rendered locally inside the client using native SVG vector paths; no credential data or secret seeds are ever transmitted to third-party QR generation APIs.
- **Verification Window:** Employs a 30-second time-step with a ±1 step drift tolerance to accommodate client clock divergence.
- **Emergency Recovery Keys:** Generates an array of single-use, cryptographically random recovery codes for emergency access if the mobile authenticator is lost.

---

## Immutable Audit Trail

Every clinical transaction, administrative action, and authentication attempt is recorded through an unbroken, sequential SHA-256 hash chain:

$$\text{Block Digest}_n = \text{SHA-256}\left(\text{Block Digest}_{n-1} \parallel \text{Timestamp} \parallel \text{User ID} \parallel \text{Event Type} \parallel \text{Severity} \parallel \text{Payload}\right)$$

### Chain Properties
- **Forward Integrity:** Altering or deleting any past audit row invalidates the SHA-256 digests of all subsequent records in the database.
- **Live Verification:** The Compliance & Auditor module recalculates the entire Merkle chain in real time, reporting whether the ledger is verified or flagging the exact row index of any unauthorized modification.
- **HIPAA Compliance:** Fulfills the technical audit control mandates specified under 45 CFR § 164.312(b).

---

## Disaster Recovery & 3-2-1 Backups

The administrative backup engine implements the industry-standard **3-2-1 Backup Strategy**:
- **3 Copies of Data:** Primary production volume, secondary local point-in-time snapshot, and offsite cold cloud storage.
- **2 Different Media Types:** Active relational database volume and compressed gzip SQL archival bundles.
- **1 Offsite Replica:** Encrypted snapshot archive stored in an independent availability zone.

### Disaster Recovery Metrics
- **Recovery Point Objective (RPO):** < 15 minutes.
- **Recovery Time Objective (RTO):** < 5 minutes.
- **Integrity Validation:** Each snapshot computes a standalone SHA-256 digest upon generation, verified during restoration routines.

---

## Clinical Workstations & RBAC Modules

MediVault enforces strict Role-Based Access Control (RBAC) across six institutional roles:

| Role | Primary User / Title | Clinical Access Scope | Available Actions |
| :--- | :--- | :--- | :--- |
| **Chief Administrator** | Dr. Prof. Nathaniel Bentil | System governance, personnel credentials, security inspection | Staff registration, Salt & Pepper inspection, 3-2-1 backups, 2FA administration |
| **Hospital Operations Manager** | Dr. Bright Ainoo (MD) | Operational bed census, ward logistics, admission throughput | Bed allocation, transfer authorization, census reporting |
| **Attending Physician** | Dr. Isaac Donkoh | Clinical diagnosis, EHR documentation, electronic prescriptions | Diagnostic charting, drug interaction analysis, prescription issuing |
| **Ward Nurse** | Nurse Beatrice Mensah, RN | Bedside observations, vital signs monitoring, triage | Vitals capture (BP, SpO2, HR, Temp), patient status update, triage routing |
| **Hospital Pharmacist** | Pharm. Kwabena Appiah | Formulatory management, dispensary verification, dispensing | Order fulfillment, dosage checks, contraindication review |
| **Compliance Auditor** | Auditor Samuel Osei | Forensic audit log review, regulatory compliance, chain validation | Merkle hash chain verification, export audit logs, security anomaly tracking |

---

## Database Schema

The PostgreSQL database contains the following core tables:

```sql
-- Core Accounts
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    pepper_version VARCHAR(32) DEFAULT 'v1',
    status VARCHAR(50) DEFAULT 'active',
    failed_login_attempts INT DEFAULT 0,
    lockout_until TIMESTAMP,
    two_factor_secret TEXT,
    two_factor_recovery_codes TEXT[],
    two_factor_confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Role-Based Access Control
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE role_user (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Clinical Electronic Health Records
CREATE TABLE patients (
    id BIGSERIAL PRIMARY KEY,
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    ward_room VARCHAR(100) NOT NULL,
    admission_status VARCHAR(50) NOT NULL,
    diagnosis TEXT,
    allergies TEXT[],
    prescriptions JSONB,
    vitals JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cryptographic Merkle Audit Ledger
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    payload JSONB,
    ip_address VARCHAR(45),
    prev_hash VARCHAR(64),
    log_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Backup Archives
CREATE TABLE backups (
    id BIGSERIAL PRIMARY KEY,
    snapshot_name VARCHAR(255) NOT NULL,
    storage_tier VARCHAR(50) NOT NULL,
    record_count INT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Reference

### Authentication Endpoints
- `POST /api/auth/login` - Authenticates user credentials against Argon2id hash + server pepper. Returns JWT cookie and 2FA challenge status.
- `POST /api/auth/register` - Public self-service registration. Computes 128-bit salt and Argon2id hash, records audit entry, and returns an authenticated session.
- `POST /api/auth/logout` - Terminates user session and clears the HTTP-only cookie.
- `POST /api/auth/two-factor-setup` - Generates a new TOTP secret and local SVG QR code.
- `POST /api/auth/two-factor-challenge` - Validates the 6-digit TOTP code during sign-in.

### Clinical & Patient Endpoints
- `GET /api/patients` - Retrieves the patient directory with admission and triage status.
- `POST /api/patients` - Admits a new patient and assigns a sequential `MED-XXXX` identifier.
- `PATCH /api/patients` - Updates patient diagnosis, bedside vitals, or discharge status.

### Security & Governance Endpoints
- `GET /api/admin/security/salt-pepper` - Administrative live view of user database salts, pepper version, and MCF hash digests.
- `POST /api/admin/security/salt-pepper` - Live interactive simulator showing step-by-step password transformation through the cryptographic pipeline.
- `GET /api/admin/audit` - Retrieves the audit ledger and validates sequential Merkle chain integrity.
- `GET /api/admin/backups` - Retrieves the disaster recovery snapshot inventory.
- `POST /api/admin/backups` - Initiates a new point-in-time database snapshot with SHA-256 verification.
- `GET /api/admin/users` - Lists personnel for administrative credential management.
- `POST /api/admin/users` - Provisions new hospital personnel with assigned roles.
- `GET /api/health` - Health check endpoint reporting database connectivity and server latency.

---

## Getting Started

### Prerequisites
- **Node.js:** v18.18.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **PostgreSQL Database:** Compatible with version 14 through 16

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nathanielbentil/MediVault-Hospital-System.git
   cd MediVault-Hospital-System/web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the environment:**
   Create `.env.local` inside the `web` directory (see [Environment Configuration](#environment-configuration) below).

4. **Compile and start the production server:**
   ```bash
   npm run build
   npm run start
   ```

   The application will be accessible at `http://localhost:3000`.

---

## Environment Configuration

Create a `.env.local` file inside the `web/` directory with the following template variables (do not commit real secrets or credentials to source control):

```ini
# PostgreSQL Connection Parameters
DB_HOST="your_database_host"
DB_PORT="5432"
DB_NAME="your_database_name"
DB_USER="your_database_user"
DB_PASSWORD="your_database_password"

# Cryptographic Keys (Loaded strictly into process memory)
PEPPER_V1="your_256_bit_server_pepper_secret_hex"
JWT_SECRET="your_256_bit_jwt_signing_secret_hex"

# Node Environment
NODE_ENV="production"
```

---

## Deployment

### Vercel Deployment

MediVault is configured for deployment on the Vercel edge network:

1. Import the repository `nathanielbentil/MediVault-Hospital-System` on [Vercel](https://vercel.com).
2. Set the **Root Directory** to `web`.
3. In the project **Environment Variables** panel, add the 8 keys listed in [Environment Configuration](#environment-configuration).
4. Deploy. Vercel automatically compiles the Next.js App Router application and assigns a production HTTPS domain.

---

## Compliance & Standards

- **NIST Special Publication 800-63B:** Digital Identity Guidelines (Authentication and Lifecycle Management).
- **HIPAA Security Rule (45 CFR Part 160 & Part 164 Subparts A and C):** Implementation of administrative, physical, and technical safeguards.
- **OWASP Top 10 Web Application Security:** Zero SQL injection exposure via parameterized queries and cross-site scripting (XSS) prevention through React sanitization.
- **RFC 9106:** Argon2 Memory-Hard Password Hashing Function.
- **RFC 6238:** TOTP: Time-Based One-Time Password Algorithm.

---

## License

Copyright (c) 2026 Nathaniel Bentil. All rights reserved.  
Developed for academic, research, and institutional evaluation.
