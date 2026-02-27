-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'DOCTOR', 'PHARMACIST', 'LAB_TECHNICIAN', 'RECEPTIONIST');
CREATE TYPE "AppointmentStatus" AS ENUM ('BOOKED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "SampleStatus" AS ENUM ('PENDING', 'COLLECTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE', 'SALE');
CREATE TYPE "InvoiceType" AS ENUM ('OPD', 'IPD', 'LAB', 'PHARMACY');
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY,
  "name" "RoleName" NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Doctor" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "specialization" TEXT NOT NULL,
  "availability" JSONB NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Patient" (
  "id" TEXT PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "cnic" TEXT NOT NULL UNIQUE,
  "dob" TIMESTAMP(3) NOT NULL,
  "bloodGroup" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "assignedDoctorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Appointment" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "appointmentDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "visitNotes" TEXT,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'BOOKED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Medicine" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "genericName" TEXT,
  "batchNo" TEXT NOT NULL,
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "stock" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PharmacyTransaction" (
  "id" TEXT PRIMARY KEY,
  "medicineId" TEXT NOT NULL,
  "patientId" TEXT,
  "type" "TransactionType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LabTest" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "LabOrder" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "orderedById" TEXT,
  "sampleStatus" "SampleStatus" NOT NULL DEFAULT 'PENDING',
  "resultFileUrl" TEXT,
  "resultText" TEXT,
  "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resultAt" TIMESTAMP(3)
);

CREATE TABLE "Invoice" (
  "id" TEXT PRIMARY KEY,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT,
  "type" "InvoiceType" NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Setting" (
  "id" TEXT PRIMARY KEY,
  "hospitalName" TEXT NOT NULL,
  "hospitalEmail" TEXT NOT NULL,
  "hospitalPhone" TEXT NOT NULL,
  "hospitalAddress" TEXT NOT NULL,
  "rolesConfig" JSONB NOT NULL,
  "permissionsConfig" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "entityId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PharmacyTransaction" ADD CONSTRAINT "PharmacyTransaction_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PharmacyTransaction" ADD CONSTRAINT "PharmacyTransaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_testId_fkey" FOREIGN KEY ("testId") REFERENCES "LabTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
