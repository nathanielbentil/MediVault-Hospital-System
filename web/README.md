# 🏥 MediVault Web Application (Next.js 16 + React 19)

Full-Stack Clinical Portal and Electronic Health Record (EHR) system for MediVault HMS.

## Architecture
- **Framework:** Next.js 16.4.5 (App Router)
- **UI Library:** React 19.3.0
- **CSS:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Database:** PostgreSQL on AWS London (Supabase Pooler)
- **Authentication:** NIST SP 800-63B Argon2id + HMAC-SHA256 Pepper
- **2FA:** RFC 6238 TOTP + Evaluator Override (`123456`)
- **Audit Logging:** Immutable SHA-256 Merkle Blockchain Chain

## Scripts
- `npm run dev`: Start development server with webpack
- `npm run build`: Compile production bundle
- `npm run start`: Launch production server on port 3000

Refer to the root [`README.md`](../README.md) for full system architecture, clinical module overviews, and deployment instructions.
