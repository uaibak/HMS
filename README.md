# Hospital Management System (HMS)

Monorepo layout:

- `backend/`: NestJS + Prisma + PostgreSQL
- `frontend/`: React + Vite + Ant Design

## Quick Start

### Backend

1. `cd backend`
2. `copy .env.example .env`
3. `npm install`
4. `npm run prisma:generate`
5. `npm run prisma:migrate`
6. `npm run prisma:seed`
7. `npm run start:dev`

### Frontend

1. `cd frontend`
2. `copy .env.example .env`
3. `npm install`
4. `npm run dev`

Frontend URL: `http://localhost:5173`
Backend URL: `http://localhost:3000/api`

## Seeded Users

- `admin@hms.local / Admin@123`
- `doctor@hms.local / Doctor@123`
- `doctor2@hms.local / Doctor2@123`
- `pharmacist@hms.local / Pharma@123`
- `reception@hms.local / Reception@123`
