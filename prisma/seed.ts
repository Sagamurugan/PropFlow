import { PrismaClient, UserRole, PropertyType, UnitType, UnitStatus, TenantStatus, LeaseStatus, PaymentStatus, MaintenanceCategory, MaintenancePriority, MaintenanceStatus, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Organization (Tenant Context)
  const org = await prisma.organization.create({
    data: {
      name: 'PropFlow Premier Management Group',
      slug: 'propflow-premier',
    },
  });
  console.log(`Created Organization: ${org.name} (${org.id})`);

  // 2. Create Owner User
  const owner = await prisma.user.create({
    data: {
      email: 'owner@propflow.ai',
      firstName: 'John',
      lastName: 'Landlord',
      passwordHash: '8b704c7df76f1839c4f52e5b60281efd:a5b4fc7df76f1839c4f52e5b60281efda5b4fc7df76f1839c4f52e5b60281efd', // secure hash mockup
      role: UserRole.OWNER,
      organizationId: org.id,
    },
  });
  console.log(`Created Property Owner: ${owner.email}`);

  // 3. Create Property Manager User
  const manager = await prisma.user.create({
    data: {
      email: 'manager@propflow.ai',
      firstName: 'Sarah',
      lastName: 'Operator',
      passwordHash: '8b704c7df76f1839c4f52e5b60281efd:a5b4fc7df76f1839c4f52e5b60281efda5b4fc7df76f1839c4f52e5b60281efd',
      role: UserRole.MANAGER,
      organizationId: org.id,
    },
  });
  console.log(`Created Property Manager: ${manager.email}`);

  // 4. Create Property
  const property = await prisma.property.create({
    data: {
      name: 'Skyline Heights Apartments',
      propertyCode: 'PROP-SKYLINE',
      propertyType: PropertyType.APARTMENT,
      addressLine1: '100 Modern Parkway',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      totalFloors: 5,
      totalUnits: 10,
      yearBuilt: 2022,
      managerName: 'Sarah Operator',
      organizationId: org.id,
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
    },
  });
  console.log(`Created Property: ${property.name}`);

  // 5. Create Units (501B and 502B)
  const unit1 = await prisma.unit.create({
    data: {
      unitNumber: '501B',
      floorNumber: 5,
      unitType: UnitType.BHK2,
      areaSqFt: 950,
      bedrooms: 2,
      bathrooms: 2,
      rentAmount: 2200.00,
      depositAmount: 1500.00,
      status: UnitStatus.OCCUPIED,
      organizationId: org.id,
      propertyId: property.id,
    },
  });
  const unit2 = await prisma.unit.create({
    data: {
      unitNumber: '502B',
      floorNumber: 5,
      unitType: UnitType.BHK1,
      areaSqFt: 650,
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 1600.00,
      depositAmount: 1200.00,
      status: UnitStatus.VACANT,
      organizationId: org.id,
      propertyId: property.id,
    },
  });
  console.log('Seeded Units');

  // 6. Create Tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      firstName: 'Jane',
      lastName: 'Renter',
      email: 'tenant@propflow.ai',
      phone: '+1-555-0192',
      emergencyContact: 'Mark Renter (+1-555-0199)',
      occupation: 'Graphic Designer',
      nationalId: 'PASSPORT-A99120',
      status: TenantStatus.ACTIVE,
      unitId: unit1.id,
      moveInDate: new Date('2026-01-01'),
      organizationId: org.id,
    },
  });
  console.log(`Created Tenant: ${tenant1.firstName} ${tenant1.lastName}`);

  // 7. Create Lease
  const lease = await prisma.lease.create({
    data: {
      leaseNumber: 'L-501B-2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      monthlyRent: 2200.00,
      securityDeposit: 1500.00,
      status: LeaseStatus.ACTIVE,
      organizationId: org.id,
      tenantId: tenant1.id,
      unitId: unit1.id,
    },
  });
  console.log(`Created Lease: ${lease.leaseNumber}`);

  // 8. Create Rent Records
  await prisma.rentRecord.create({
    data: {
      month: '2026-05',
      amountDue: 2200.00,
      amountPaid: 2200.00,
      balance: 0.00,
      dueDate: new Date('2026-05-05'),
      paymentStatus: PaymentStatus.PAID,
      reference: 'BANK-TRANSFER-992',
      paidAt: new Date('2026-05-04'),
      tenantId: tenant1.id,
      leaseId: lease.id,
    },
  });

  await prisma.rentRecord.create({
    data: {
      month: '2026-06',
      amountDue: 2200.00,
      amountPaid: 0.00,
      balance: 2200.00,
      dueDate: new Date('2026-06-05'),
      paymentStatus: PaymentStatus.PENDING,
      tenantId: tenant1.id,
      leaseId: lease.id,
    },
  });
  console.log('Seeded Rent Records');

  // 9. Create Technicians
  const tech1 = await prisma.technician.create({
    data: {
      name: 'Bob the Plumber',
      phone: '+1-555-0811',
      specialization: 'Plumbing & Drainage',
    },
  });

  const tech2 = await prisma.technician.create({
    data: {
      name: 'Alice Sparks',
      phone: '+1-555-0822',
      specialization: 'Electrical Circuits',
    },
  });
  console.log('Seeded Technicians');

  // 10. Create Maintenance Requests
  await prisma.maintenanceRequest.create({
    data: {
      ticketNumber: 'TKT-101',
      category: MaintenanceCategory.PLUMBING,
      priority: MaintenancePriority.MEDIUM,
      description: 'Slow leak underneath the kitchen basin. Pipe washer needs replacement.',
      status: MaintenanceStatus.ASSIGNED,
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'],
      technicianId: tech1.id,
      tenantId: tenant1.id,
      unitId: unit1.id,
      propertyId: property.id,
      organizationId: org.id,
    },
  });
  console.log('Seeded Maintenance Request');

  // 11. Create Notifications
  await prisma.notification.create({
    data: {
      title: 'Welcome to PropFlow',
      message: 'PropFlow AI system loaded successfully. Your multi-tenant boundary checks are active.',
      type: NotificationType.SYSTEM,
      userId: owner.id,
    },
  });
  console.log('Seeded Notification');

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
