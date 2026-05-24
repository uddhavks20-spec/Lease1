# CampusRent – Student Rental Marketplace (Kanpur-first, multi-city ready)

Production-grade, mobile‑first managed rental marketplace for students. Frontend on Next.js (App Router), backend on Node.js/Express, PostgreSQL database, JWT auth, Razorpay payments with escrow logic, RBAC, disputes, and analytics.

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, next-themes, lucide-react
- Backend: Node.js + Express, TypeScript
- Database: PostgreSQL (UUID PKs, FKs, indexed)
- Auth: JWT with RBAC
- Payments: Razorpay (orders + webhook verification)
- Hosting: Vercel (frontend), Railway/Render/Fly.io (backend)

## Monorepo Structure

```
lease/
├── frontend/        # Next.js app
├── backend/         # Express API
└── database/        # SQL schema & seeds
```

## Prerequisites

- Node.js 18+ and pnpm/npm/yarn
- PostgreSQL 14+ with `uuid-ossp` extension
- Razorpay account (Key ID/Secret + Webhook secret)

## Database Setup

1. Create a database:
   ```sql
   CREATE DATABASE campusrent;
   ```
2. Enable extension and load schema:
   ```bash
   psql -d campusrent -f database/schema.sql
   ```
   The schema creates roles, categories, default city (Kanpur), and indexes/triggers.

## Backend Setup

1. Copy and configure environment:
   ```bash
   cd backend
   cp .env.example .env
   # Update DATABASE_URL, JWT_SECRET, RAZORPAY_* secrets
   ```
2. Install deps and run:
   ```bash
   pnpm i    # or npm i / yarn
   pnpm dev  # or npm run dev / yarn dev
   ```
3. Verify health:
   - API: http://localhost:4000/health

## Frontend Setup

1. Copy env:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Set API_BASE_URL to your backend /api, RAZORPAY_KEY_ID to public key
   ```
2. Install deps and run:
   ```bash
   pnpm i    # or npm i / yarn
   pnpm dev  # or npm run dev / yarn dev
   ```
3. Visit http://localhost:3000

## API Routes (REST)

- /auth – register, login
- /users – current user profile
- /items – listing browse/create/pause
- /rentals – create rental, list rentals
- /payments – Razorpay webhook
- /deposits – escrow status
- /disputes – open disputes
- /admin – approvals and lifecycle controls
- /analytics – admin metrics
- /notifications – user notifications

## Financial & Escrow Logic (Summary)

- Checkout collects: deposit + first-month rent + platform commission on first month.
- Escrow: deposit recorded as `held` in `deposits`.
- Subsequent months tracked in `monthly_payments` with due dates and late-fee field.
- Webhook verifies signature and marks payments as completed.
- Admin marks delivery → rental becomes `active`.
- Return flow adjusts deposit (deduction/refund) and completes rental.

## Production Notes

- Set strict CORS origins in production (`FRONTEND_ORIGIN`).
- Use secure secrets in hosting provider settings.
- Configure Razorpay webhooks to `/api/payments/webhook`.
- Add a background worker for monthly reminders and late fee handling.
- Monitor with structured logs and database alerts.

## License

Proprietary – All rights reserved.

