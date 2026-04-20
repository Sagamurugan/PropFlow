import {
  AssignmentRole,
  LeaseStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  PropertyType,
  UnitStatus,
  UserRole
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const ownerPasswordHash = await bcrypt.hash("owner12345", 10);
  const managerPasswordHash = await bcrypt.hash("manager12345", 10);
  const tenantPasswordHash = await bcrypt.hash("tenant12345", 10);
  const technicianPasswordHash = await bcrypt.hash("tech12345", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@propflow.app" },
    update: {
      firstName: "Demo",
      lastName: "Owner",
      role: UserRole.OWNER,
      passwordHash: ownerPasswordHash
    },
    create: {
      email: "owner@propflow.app",
      passwordHash: ownerPasswordHash,
      firstName: "Demo",
      lastName: "Owner",
      role: UserRole.OWNER
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@propflow.app" },
    update: {
      firstName: "Demo",
      lastName: "Manager",
      role: UserRole.MANAGER,
      passwordHash: managerPasswordHash
    },
    create: {
      email: "manager@propflow.app",
      passwordHash: managerPasswordHash,
      firstName: "Demo",
      lastName: "Manager",
      role: UserRole.MANAGER
    }
  });

  const tenantUser = await prisma.user.upsert({
    where: { email: "tenant@propflow.app" },
    update: {
      firstName: "Demo",
      lastName: "Tenant",
      role: UserRole.TENANT,
      passwordHash: tenantPasswordHash
    },
    create: {
      email: "tenant@propflow.app",
      passwordHash: tenantPasswordHash,
      firstName: "Demo",
      lastName: "Tenant",
      role: UserRole.TENANT,
      phone: "9876543210"
    }
  });

  const technician = await prisma.user.upsert({
    where: { email: "technician@propflow.app" },
    update: {
      firstName: "Demo",
      lastName: "Technician",
      role: UserRole.TECHNICIAN,
      passwordHash: technicianPasswordHash
    },
    create: {
      email: "technician@propflow.app",
      passwordHash: technicianPasswordHash,
      firstName: "Demo",
      lastName: "Technician",
      role: UserRole.TECHNICIAN,
      phone: "9123456780"
    }
  });

  const tenant = await prisma.tenant.upsert({
    where: { userId: tenantUser.id },
    update: {
      emergencyContactName: "Relative Tenant",
      emergencyContactPhone: "9988776655",
      kycIdType: "Aadhaar",
      kycIdNumber: "999988887777",
      employmentStatus: "Software Engineer",
      notes: "Seeded demo tenant"
    },
    create: {
      userId: tenantUser.id,
      emergencyContactName: "Relative Tenant",
      emergencyContactPhone: "9988776655",
      kycIdType: "Aadhaar",
      kycIdNumber: "999988887777",
      employmentStatus: "Software Engineer",
      notes: "Seeded demo tenant"
    }
  });

  const property = await prisma.property.upsert({
    where: { code: "PF-DEMO-001" },
    update: {
      ownerId: owner.id,
      name: "Palm Residency",
      type: PropertyType.APARTMENT,
      addressLine1: "MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      totalUnits: 2
    },
    create: {
      ownerId: owner.id,
      name: "Palm Residency",
      code: "PF-DEMO-001",
      type: PropertyType.APARTMENT,
      addressLine1: "MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      totalUnits: 2
    }
  });

  await prisma.userPropertyAssignment.upsert({
    where: {
      userId_propertyId: {
        userId: manager.id,
        propertyId: property.id
      }
    },
    update: {
      role: AssignmentRole.MANAGER
    },
    create: {
      userId: manager.id,
      propertyId: property.id,
      role: AssignmentRole.MANAGER
    }
  });

  const occupiedUnit = await prisma.unit.upsert({
    where: {
      propertyId_unitNumber: {
        propertyId: property.id,
        unitNumber: "A-101"
      }
    },
    update: {
      floor: "1",
      bedrooms: 2,
      bathrooms: 2,
      areaSqFt: 980,
      monthlyRent: 25000,
      securityDeposit: 50000,
      status: UnitStatus.OCCUPIED
    },
    create: {
      propertyId: property.id,
      unitNumber: "A-101",
      floor: "1",
      bedrooms: 2,
      bathrooms: 2,
      areaSqFt: 980,
      monthlyRent: 25000,
      securityDeposit: 50000,
      status: UnitStatus.OCCUPIED
    }
  });

  await prisma.unit.upsert({
    where: {
      propertyId_unitNumber: {
        propertyId: property.id,
        unitNumber: "A-102"
      }
    },
    update: {
      floor: "1",
      bedrooms: 1,
      bathrooms: 1,
      areaSqFt: 620,
      monthlyRent: 18000,
      securityDeposit: 36000,
      status: UnitStatus.VACANT
    },
    create: {
      propertyId: property.id,
      unitNumber: "A-102",
      floor: "1",
      bedrooms: 1,
      bathrooms: 1,
      areaSqFt: 620,
      monthlyRent: 18000,
      securityDeposit: 36000,
      status: UnitStatus.VACANT
    }
  });

  const lease = await prisma.lease.upsert({
    where: { leaseNumber: "LEASE-DEMO-001" },
    update: {
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      monthlyRent: 25000,
      securityDeposit: 50000,
      rentDueDay: 5,
      status: LeaseStatus.ACTIVE,
      terms: "Seeded demo lease"
    },
    create: {
      leaseNumber: "LEASE-DEMO-001",
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2027-03-31"),
      monthlyRent: 25000,
      securityDeposit: 50000,
      rentDueDay: 5,
      status: LeaseStatus.ACTIVE,
      terms: "Seeded demo lease"
    }
  });

  const existingPayment = await prisma.payment.findFirst({
    where: {
      leaseId: lease.id,
      referenceNumber: "PAY-DEMO-APR-2026"
    }
  });

  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        dueDate: new Date("2026-04-05"),
        paidAt: new Date("2026-04-04"),
        amountDue: 25000,
        amountPaid: 25000,
        status: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.UPI,
        notes: "Seeded April payment"
      }
    });
  } else {
    await prisma.payment.create({
      data: {
        leaseId: lease.id,
        dueDate: new Date("2026-04-05"),
        paidAt: new Date("2026-04-04"),
        amountDue: 25000,
        amountPaid: 25000,
        status: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: "PAY-DEMO-APR-2026",
        notes: "Seeded April payment"
      }
    });
  }

  await prisma.maintenanceRequest.upsert({
    where: {
      id: "cm-demo-maintenance-001"
    },
    update: {
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      reportedByUserId: tenantUser.id,
      assignedTechnicianId: technician.id,
      title: "Water leakage in kitchen",
      description: "Small leakage under sink area",
      category: "Plumbing",
      status: MaintenanceStatus.ASSIGNED,
      priority: MaintenancePriority.MEDIUM,
      assignedAt: new Date("2026-04-10T09:00:00.000Z")
    },
    create: {
      id: "cm-demo-maintenance-001",
      unitId: occupiedUnit.id,
      tenantId: tenant.id,
      reportedByUserId: tenantUser.id,
      assignedTechnicianId: technician.id,
      title: "Water leakage in kitchen",
      description: "Small leakage under sink area",
      category: "Plumbing",
      status: MaintenanceStatus.ASSIGNED,
      priority: MaintenancePriority.MEDIUM,
      assignedAt: new Date("2026-04-10T09:00:00.000Z")
    }
  });

  await prisma.notification.deleteMany({
    where: {
      OR: [
        {
          userId: owner.id,
          title: "Demo property ready"
        },
        {
          userId: tenantUser.id,
          title: "Rent payment recorded"
        }
      ]
    }
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
        propertyId: property.id,
        title: "Demo property ready",
        message: "Palm Residency seed data is available.",
        status: "SENT"
      },
      {
        userId: tenantUser.id,
        title: "Rent payment recorded",
        message: "April rent has been marked as paid.",
        status: "SENT"
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
