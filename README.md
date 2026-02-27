# Hospital Management System (HMS)

Production-style Hospital Management System with strict RBAC, modular NestJS backend, and Ant Design React frontend.

## Tech Stack

- Backend: NestJS, TypeScript, Prisma ORM, PostgreSQL, JWT Auth
- Frontend: React, TypeScript, Vite, Ant Design
- Database: PostgreSQL

## Repository Structure

- `backend/` NestJS API and Prisma
- `frontend/` React web app

## Core Functional Modules

- Auth: JWT login, bcrypt passwords, role claims in token
- Users: staff user CRUD with role assignment
- Patients: demographics CRUD + doctor assignment
- Doctors: profile CRUD + availability JSON
- Appointments: book, reschedule, cancel, complete
- Lab: test catalog + lab orders + sample lifecycle
- Pharmacy: inventory + transactions + prescription flow
- Billing: consolidated encounter-based billing (invoice header + invoice lines)
- Reports: dashboard metrics and module summaries
- Settings: hospital profile + role/permission JSON config
- Audit: tracks key actions and mutation events

## RBAC Roles

- `ADMIN`
- `DOCTOR`
- `PHARMACIST`
- `LAB_TECHNICIAN`
- `RECEPTIONIST`

### Key Enforcement Rules

- Doctors can view patients but cannot create/update/delete patients.
- Doctors can only reschedule/complete appointments assigned to them.
- Admin/Reception can manage all appointments.
- Lab test catalog management: Admin/Lab Technician.
- Medicine inventory management: Admin/Pharmacist.
- Billing operations (create/pay/close): Admin/Reception, with doctor-limited billing reads.

## Consolidated Billing Model

The system uses encounter-based billing:

- `Encounter` (`OPEN` / `CLOSED`) is the patient visit episode.
- One encounter maps to one invoice header.
- `InvoiceLine` stores OPD/LAB/PHARMACY/OTHER billable items.
- Event idempotency is enforced via unique key:
  - `(invoiceId, referenceType, referenceId)`
- Auto-billing line mapping:
  - Appointment completion -> OPD line
  - Lab completion -> LAB line
  - Pharmacy sale/prescription -> PHARMACY line

## UX and Interaction Behavior

- Interactive loading indicators are implemented across pages:
  - table loading
  - modal submit loading
  - action-button loading
  - global header network activity indicator
- Notifications are context-aware (`App.useApp`) and theme-safe.
- Dates in tables are shown in local display format:
  - `DD MMM YYYY, hh:mm A`
- IDs shown in UI are short and meaningful (e.g. `PAT-AB12CD34`, `ENC-...`) while DB keeps full UUIDs.

## Quick Start

### 1. Backend

1. `cd backend`
2. `copy .env.example .env` (or create `.env` manually)
3. `npm install`
4. `npm run prisma:generate`
5. `npx prisma migrate dev --name init`
6. `npm run prisma:seed`
7. `npm run start:dev`

### 2. Frontend

1. `cd frontend`
2. `copy .env.example .env` (optional if defaults are fine)
3. `npm install`
4. `npm run dev`

### Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`

## Environment Variables

Backend `.env` example:

```env
DATABASE_URL="postgresql://hms_user:StrongPassword123@localhost:5432/hms_dev"
SHADOW_DATABASE_URL="postgresql://hms_user:StrongPassword123@localhost:5432/hms_shadow_db"
JWT_SECRET="X7t!2qP#8zD9vLm$4rA!s3fY6uK1bNq"
JWT_EXPIRES_IN="1h"
```

Notes:

- Use URL-encoded password characters in DB URLs if password has symbols (e.g. `@` -> `%40`).
- `SHADOW_DATABASE_URL` is required by Prisma for `migrate dev` diffing.

## Seeded Credentials

- `admin@hms.local / Admin@123`
- `doctor@hms.local / Doctor@123`
- `doctor2@hms.local / Doctor2@123`
- `pharmacist@hms.local / Pharma@123`
- `reception@hms.local / Reception@123`

## Database Operations

### Reset/Clean DB

```bash
cd backend
npx prisma migrate reset --force --skip-seed
```

### Re-seed

```bash
cd backend
npm run prisma:seed
```

## API Surface (High-Level)

- Auth: `/auth/login`
- Users: `/users`
- Patients: `/patients`
- Doctors: `/doctors`
- Appointments: `/appointments`
- Lab:
  - `/lab/tests`
  - `/lab/orders`
- Pharmacy:
  - `/pharmacy/medicines`
  - `/pharmacy/transactions`
  - `/pharmacy/prescriptions`
- Billing:
  - `/billing/invoices`
  - `/billing/encounters`
- Reports: `/reports/dashboard`
- Settings: `/settings`

## Troubleshooting

### Prisma: `P1013` invalid DB URL / empty host

- Verify `DATABASE_URL` format.
- URL-encode special password characters.

### Prisma: `P3014` shadow DB permission denied

- Ensure DB user can create shadow DB, or pre-create and set `SHADOW_DATABASE_URL`.

### Prisma generate `EPERM` on Windows

- Stop running Node processes and retry:
  - `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force`
- Then rerun `npm run prisma:generate`.

### 401 after backend reset/seed

- Login again to refresh stale token/session in local storage.

## Current Status

- TypeScript compile clean on backend and frontend.
- Consolidated billing + role restrictions + interactive loading states are implemented and connected end-to-end.
