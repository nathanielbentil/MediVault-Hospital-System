# MediVault Web Application (Next.js 16 + React 19)

Full-Stack Clinical Portal and Electronic Health Record (EHR) system for MediVault HMS.

## Overview
This directory contains the Next.js 16 App Router application powering the MediVault clinical portal, RESTful API endpoints, cryptographic services, and PostgreSQL database queries.

## Architecture & Core Modules
- **Framework:** Next.js 16.4.5 (App Router with serverless API route handlers)
- **UI Library:** React 19.3.0
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Database:** PostgreSQL on AWS London (`eu-west-2`) via Supabase Pooler (Port 6543)
- **Password Security:** NIST SP 800-63B compliant Argon2id (`m=65536, t=4, p=2`) + HMAC-SHA256 Server-Side Pepper + 128-bit CSPRNG per-user salt
- **Two-Factor Authentication:** RFC 6238 TOTP with client-side SVG QR code generation and emergency recovery keys
- **Audit Logging:** Sequential SHA-256 Merkle hash-chained tamper-evident event ledger
- **Disaster Recovery:** 3-2-1 backup manager with point-in-time snapshots and SHA-256 checksums

## Project Structure
```
web/
├── app/
│   ├── api/                     # Serverless API routes
│   │   ├── admin/               # Admin endpoints (users, backups, audit, salt-pepper)
│   │   ├── auth/                # Auth endpoints (login, register, logout, 2FA)
│   │   ├── health/              # Database health check
│   │   └── patients/            # Clinical patient records & admissions
│   ├── layout.tsx               # Root application layout
│   └── page.tsx                 # Unified clinical portal & authentication card
├── lib/
│   ├── audit.ts                 # AuditLogService with sequential Merkle chaining
│   ├── auth.ts                  # JWT token issuance and verification
│   ├── db.ts                    # PostgreSQL connection pooler (pg)
│   └── password.ts              # PasswordService (Argon2id + HMAC pepper)
├── public/                      # Static assets and images
└── next.config.ts               # Next.js configuration
```

## Available Scripts
- `npm run dev`: Start Next.js local development server
- `npm run build`: Compile optimized production bundle
- `npm run start`: Launch production server on port 3000

For full architectural documentation, database schema definitions, and cryptographic specifications, see the root [README.md](../README.md).
