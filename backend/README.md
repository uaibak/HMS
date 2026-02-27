# HMS Backend

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Seed database: `npm run prisma:seed`
6. Start API: `npm run start:dev`

Base URL: `http://localhost:3000/api`

## Demo Credentials

- Admin: `admin@hms.local` / `Admin@123`
- Doctor: `doctor@hms.local` / `Doctor@123`
- Doctor 2: `doctor2@hms.local` / `Doctor2@123`
- Pharmacist: `pharmacist@hms.local` / `Pharma@123`
- Receptionist: `reception@hms.local` / `Reception@123`

## Example Endpoints

- `POST /api/auth/login`
- `GET /api/users?page=1&limit=10`
- `GET /api/patients?search=ali&page=1&limit=10`
- `POST /api/appointments`
- `PATCH /api/appointments/:id` (Doctor can reschedule only own appointments)
- `POST /api/pharmacy/transactions`
- `POST /api/lab/orders`
- `POST /api/billing/invoices`
- `GET /api/reports/dashboard`
- `GET /api/audit/logs`
