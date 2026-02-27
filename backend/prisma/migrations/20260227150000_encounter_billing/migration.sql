CREATE TYPE "EncounterStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "InvoiceLineType" AS ENUM ('OPD', 'LAB', 'PHARMACY', 'OTHER');
CREATE TYPE "InvoiceReferenceType" AS ENUM ('APPOINTMENT', 'LAB_ORDER', 'PHARMACY_TRANSACTION', 'MANUAL');

ALTER TABLE "Invoice"
  ADD COLUMN "encounterId" TEXT,
  ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Invoice_encounterId_key" ON "Invoice"("encounterId");

CREATE TABLE "Encounter" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT,
  "appointmentId" TEXT,
  "status" "EncounterStatus" NOT NULL DEFAULT 'OPEN',
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Encounter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceLine" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "lineType" "InvoiceLineType" NOT NULL,
  "referenceType" "InvoiceReferenceType" NOT NULL,
  "referenceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "lineTotal" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InvoiceLine_invoiceId_referenceType_referenceId_key"
ON "InvoiceLine"("invoiceId", "referenceType", "referenceId");

ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_doctorId_fkey"
FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Encounter" ADD CONSTRAINT "Encounter_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_encounterId_fkey"
FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey"
FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
