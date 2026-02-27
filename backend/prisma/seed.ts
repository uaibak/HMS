import { PrismaClient, RoleName, AppointmentStatus, InvoiceStatus, InvoiceType, SampleStatus, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({
        where: { name },
        create: { name, description: `${name} role` },
        update: {},
      }),
    ),
  );

  const adminRole = roles.find((r) => r.name === RoleName.ADMIN)!;
  const doctorRole = roles.find((r) => r.name === RoleName.DOCTOR)!;
  const pharmacistRole = roles.find((r) => r.name === RoleName.PHARMACIST)!;
  const receptionistRole = roles.find((r) => r.name === RoleName.RECEPTIONIST)!;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hms.local' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@hms.local',
      password: await bcrypt.hash('Admin@123', 10),
      roleId: adminRole.id,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@hms.local' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Khan',
      email: 'doctor@hms.local',
      password: await bcrypt.hash('Doctor@123', 10),
      roleId: doctorRole.id,
    },
  });

  const doctorUser2 = await prisma.user.upsert({
    where: { email: 'doctor2@hms.local' },
    update: {},
    create: {
      firstName: 'Usman',
      lastName: 'Iqbal',
      email: 'doctor2@hms.local',
      password: await bcrypt.hash('Doctor2@123', 10),
      roleId: doctorRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'pharmacist@hms.local' },
    update: {},
    create: {
      firstName: 'Adeel',
      lastName: 'Raza',
      email: 'pharmacist@hms.local',
      password: await bcrypt.hash('Pharma@123', 10),
      roleId: pharmacistRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'reception@hms.local' },
    update: {},
    create: {
      firstName: 'Mina',
      lastName: 'Shah',
      email: 'reception@hms.local',
      password: await bcrypt.hash('Reception@123', 10),
      roleId: receptionistRole.id,
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      firstName: 'Sarah',
      lastName: 'Khan',
      specialization: 'Cardiology',
      availability: {
        slots: [
          { day: 'Monday', from: '09:00', to: '13:00' },
          { day: 'Wednesday', from: '10:00', to: '14:00' },
        ],
      },
      phone: '+92-300-1111111',
      email: 'doctor@hms.local',
    },
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { userId: doctorUser2.id },
    update: {},
    create: {
      userId: doctorUser2.id,
      firstName: 'Usman',
      lastName: 'Iqbal',
      specialization: 'Neurology',
      availability: {
        slots: [
          { day: 'Tuesday', from: '11:00', to: '15:00' },
          { day: 'Thursday', from: '09:30', to: '13:30' },
        ],
      },
      phone: '+92-300-2222222',
      email: 'doctor2@hms.local',
    },
  });

  const patient1 = await prisma.patient.upsert({
    where: { cnic: '35202-1234567-1' },
    update: {},
    create: {
      firstName: 'Ali',
      lastName: 'Hassan',
      cnic: '35202-1234567-1',
      dob: new Date('1994-06-12'),
      bloodGroup: 'A+',
      address: 'Lahore Cantt',
      phone: '+92-321-1234567',
      email: 'ali@example.com',
      assignedDoctorId: doctor.id,
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { cnic: '35202-7654321-9' },
    update: {},
    create: {
      firstName: 'Fatima',
      lastName: 'Noor',
      cnic: '35202-7654321-9',
      dob: new Date('1988-02-01'),
      bloodGroup: 'B-',
      address: 'Model Town Lahore',
      phone: '+92-322-7654321',
      email: 'fatima@example.com',
      assignedDoctorId: doctor.id,
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { cnic: '35202-5555555-3' },
    update: {},
    create: {
      firstName: 'Hamza',
      lastName: 'Naveed',
      cnic: '35202-5555555-3',
      dob: new Date('1991-09-11'),
      bloodGroup: 'O+',
      address: 'Johar Town Lahore',
      phone: '+92-333-5555555',
      email: 'hamza@example.com',
      assignedDoctorId: doctor2.id,
    },
  });

  const existingAppointments = await prisma.appointment.count();
  if (existingAppointments === 0) {
    await prisma.appointment.createMany({
      data: [
        {
          patientId: patient1.id,
          doctorId: doctor.id,
          appointmentDate: new Date(),
          reason: 'Chest pain follow-up',
          status: AppointmentStatus.BOOKED,
        },
        {
          patientId: patient2.id,
          doctorId: doctor.id,
          appointmentDate: new Date(Date.now() + 86400000),
          reason: 'Routine checkup',
          status: AppointmentStatus.BOOKED,
        },
        {
          patientId: patient3.id,
          doctorId: doctor2.id,
          appointmentDate: new Date(Date.now() + 2 * 86400000),
          reason: 'Migraine assessment',
          status: AppointmentStatus.BOOKED,
        },
      ],
    });
  }

  const cbc = await prisma.labTest.upsert({
    where: { id: 'cbc-test-id' },
    update: {},
    create: {
      id: 'cbc-test-id',
      name: 'CBC',
      description: 'Complete Blood Count',
      price: 800,
    },
  });

  await prisma.labTest.upsert({
    where: { id: 'lft-test-id' },
    update: {},
    create: {
      id: 'lft-test-id',
      name: 'LFT',
      description: 'Liver Function Test',
      price: 1500,
    },
  });

  await prisma.labTest.upsert({
    where: { id: 'lipid-test-id' },
    update: {},
    create: {
      id: 'lipid-test-id',
      name: 'Lipid Profile',
      description: 'Cholesterol and triglycerides panel',
      price: 1800,
    },
  });

  await prisma.labOrder.create({
    data: {
      patientId: patient1.id,
      testId: cbc.id,
      orderedById: doctorUser.id,
      sampleStatus: SampleStatus.COLLECTED,
      resultText: 'Values in normal range',
    },
  }).catch(() => undefined);

  const med = await prisma.medicine.upsert({
    where: { id: 'med-atorvastatin' },
    update: {},
    create: {
      id: 'med-atorvastatin',
      name: 'Atorvastatin 20mg',
      genericName: 'Atorvastatin',
      batchNo: 'AT20-2026-01',
      expiryDate: new Date('2027-12-31'),
      stock: 150,
      unitPrice: 45,
    },
  });

  await prisma.medicine.upsert({
    where: { id: 'med-paracetamol' },
    update: {},
    create: {
      id: 'med-paracetamol',
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      batchNo: 'PCM-2026-03',
      expiryDate: new Date('2028-01-31'),
      stock: 300,
      unitPrice: 12,
    },
  });

  await prisma.medicine.upsert({
    where: { id: 'med-omeprazole' },
    update: {},
    create: {
      id: 'med-omeprazole',
      name: 'Omeprazole 20mg',
      genericName: 'Omeprazole',
      batchNo: 'OMP-2026-02',
      expiryDate: new Date('2027-10-31'),
      stock: 220,
      unitPrice: 28,
    },
  });

  await prisma.pharmacyTransaction.create({
    data: {
      medicineId: med.id,
      patientId: patient1.id,
      type: TransactionType.SALE,
      quantity: 2,
      amount: 90,
    },
  }).catch(() => undefined);

  await prisma.invoice.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      type: InvoiceType.OPD,
      description: 'Cardiology consultation',
      amount: 2500,
      paidAmount: 1000,
      status: InvoiceStatus.PARTIAL,
      dueDate: new Date(Date.now() + 3 * 86400000),
    },
  }).catch(() => undefined);

  const encounter1 = await prisma.encounter.upsert({
    where: { id: 'encounter-demo-1' },
    update: {},
    create: {
      id: 'encounter-demo-1',
      patientId: patient1.id,
      doctorId: doctor.id,
      status: 'OPEN',
    },
  });

  const encounter2 = await prisma.encounter.upsert({
    where: { id: 'encounter-demo-2' },
    update: {},
    create: {
      id: 'encounter-demo-2',
      patientId: patient2.id,
      doctorId: doctor.id,
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  const encounterInvoice1 = await prisma.invoice.upsert({
    where: { encounterId: encounter1.id },
    update: {},
    create: {
      patientId: patient1.id,
      doctorId: doctor.id,
      encounterId: encounter1.id,
      type: InvoiceType.OPD,
      description: 'Consolidated encounter invoice',
      subtotal: 0,
      discount: 100,
      tax: 50,
      grandTotal: 0,
      amount: 0,
      paidAmount: 500,
      status: InvoiceStatus.PARTIAL,
    },
  });

  const encounterInvoice2 = await prisma.invoice.upsert({
    where: { encounterId: encounter2.id },
    update: {},
    create: {
      patientId: patient2.id,
      doctorId: doctor.id,
      encounterId: encounter2.id,
      type: InvoiceType.OPD,
      description: 'Closed encounter invoice',
      subtotal: 0,
      discount: 0,
      tax: 0,
      grandTotal: 0,
      amount: 0,
      paidAmount: 0,
      status: InvoiceStatus.UNPAID,
    },
  });

  await prisma.invoiceLine.upsert({
    where: {
      invoiceId_referenceType_referenceId: {
        invoiceId: encounterInvoice1.id,
        referenceType: 'APPOINTMENT',
        referenceId: 'seed-appt-line',
      },
    },
    update: {},
    create: {
      invoiceId: encounterInvoice1.id,
      lineType: 'OPD',
      referenceType: 'APPOINTMENT',
      referenceId: 'seed-appt-line',
      description: 'OPD consultation (seed)',
      quantity: 1,
      unitPrice: 1500,
      lineTotal: 1500,
    },
  });

  await prisma.invoiceLine.upsert({
    where: {
      invoiceId_referenceType_referenceId: {
        invoiceId: encounterInvoice1.id,
        referenceType: 'LAB_ORDER',
        referenceId: 'seed-lab-line',
      },
    },
    update: {},
    create: {
      invoiceId: encounterInvoice1.id,
      lineType: 'LAB',
      referenceType: 'LAB_ORDER',
      referenceId: 'seed-lab-line',
      description: 'CBC lab panel (seed)',
      quantity: 1,
      unitPrice: 800,
      lineTotal: 800,
    },
  });

  await prisma.invoiceLine.upsert({
    where: {
      invoiceId_referenceType_referenceId: {
        invoiceId: encounterInvoice1.id,
        referenceType: 'PHARMACY_TRANSACTION',
        referenceId: 'seed-pharmacy-line',
      },
    },
    update: {},
    create: {
      invoiceId: encounterInvoice1.id,
      lineType: 'PHARMACY',
      referenceType: 'PHARMACY_TRANSACTION',
      referenceId: 'seed-pharmacy-line',
      description: 'Atorvastatin dispense (seed)',
      quantity: 2,
      unitPrice: 45,
      lineTotal: 90,
    },
  });

  await prisma.invoiceLine.upsert({
    where: {
      invoiceId_referenceType_referenceId: {
        invoiceId: encounterInvoice2.id,
        referenceType: 'MANUAL',
        referenceId: 'seed-manual-line',
      },
    },
    update: {},
    create: {
      invoiceId: encounterInvoice2.id,
      lineType: 'OTHER',
      referenceType: 'MANUAL',
      referenceId: 'seed-manual-line',
      description: 'Follow-up service fee (seed)',
      quantity: 1,
      unitPrice: 1200,
      lineTotal: 1200,
    },
  });

  const subtotal1 = 1500 + 800 + 90;
  const grandTotal1 = subtotal1 + 50 - 100;
  const status1 = encounterInvoice1.paidAmount >= grandTotal1 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
  await prisma.invoice.update({
    where: { id: encounterInvoice1.id },
    data: { subtotal: subtotal1, grandTotal: grandTotal1, amount: grandTotal1, status: status1 },
  });

  await prisma.invoice.update({
    where: { id: encounterInvoice2.id },
    data: { subtotal: 1200, grandTotal: 1200, amount: 1200, status: InvoiceStatus.UNPAID },
  });

  await prisma.setting.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      hospitalName: 'HMS General Hospital',
      hospitalEmail: 'info@hms.local',
      hospitalPhone: '+92-42-0000000',
      hospitalAddress: 'Main Boulevard, Lahore',
      rolesConfig: { enabledRoles: Object.values(RoleName) },
      permissionsConfig: {
        admin: ['*'],
        doctor: ['patients.read', 'appointments.read', 'lab.orders.create'],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_BOOTSTRAP',
      module: 'SYSTEM',
      details: { createdAt: new Date().toISOString() },
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
