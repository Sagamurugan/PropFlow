import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';
import { LeaseStatus, UnitStatus, NotificationType } from '@prisma/client';

@Injectable()
export class LeasesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeaseDto, organizationId: string, userId: string) {
    const existing = await this.prisma.lease.findUnique({
      where: { leaseNumber: dto.leaseNumber },
    });

    if (existing) {
      throw new ConflictException(`Lease number '${dto.leaseNumber}' already exists`);
    }

    // Occupancy Validation
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, organizationId },
    });

    if (!unit) {
      throw new NotFoundException('Selected unit does not exist in your organization');
    }

    if (unit.status === UnitStatus.OCCUPIED) {
      throw new ConflictException('Lease Validation Failed: This unit is already occupied by an active tenant');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Lease
      const lease = await tx.lease.create({
        data: {
          ...dto,
          organizationId,
          createdBy: userId,
          status: LeaseStatus.ACTIVE,
        },
      });

      // 2. Set Unit Status to OCCUPIED
      await tx.unit.update({
        where: { id: dto.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      // 3. Create active Occupancy History log
      await tx.occupancyHistory.create({
        data: {
          moveInDate: new Date(dto.startDate),
          tenantId: dto.tenantId,
          unitId: dto.unitId,
        },
      });

      // 4. Create System Notification
      await tx.notification.create({
        data: {
          title: 'Lease Agreement Registered',
          message: `Lease number ${dto.leaseNumber} is successfully registered and active.`,
          type: NotificationType.LEASE,
          userId,
        },
      });

      return lease;
    });
  }

  async renew(id: string, dto: RenewLeaseDto, organizationId: string, userId: string) {
    const oldLease = await this.prisma.lease.findFirst({
      where: { id, organizationId },
    });

    if (!oldLease) {
      throw new NotFoundException('Lease not found in your organization');
    }

    const existingCode = await this.prisma.lease.findUnique({
      where: { leaseNumber: dto.newLeaseNumber },
    });

    if (existingCode) {
      throw new ConflictException(`Lease number '${dto.newLeaseNumber}' already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Terminate/Mark old lease as RENEWED
      await tx.lease.update({
        where: { id },
        data: {
          status: LeaseStatus.RENEWED,
          updatedBy: userId,
        },
      });

      // 2. Create new lease linking previous ID
      const newLease = await tx.lease.create({
        data: {
          leaseNumber: dto.newLeaseNumber,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          monthlyRent: dto.monthlyRent !== undefined ? dto.monthlyRent : oldLease.monthlyRent,
          securityDeposit: dto.securityDeposit !== undefined ? dto.securityDeposit : oldLease.securityDeposit,
          signedDocumentUrl: dto.signedDocumentUrl || oldLease.signedDocumentUrl,
          tenantId: oldLease.tenantId,
          unitId: oldLease.unitId,
          previousLeaseId: id,
          organizationId,
          createdBy: userId,
          status: LeaseStatus.ACTIVE,
        },
      });

      // 3. Log System Notification
      await tx.notification.create({
        data: {
          title: 'Lease Contract Renewed',
          message: `Lease ${oldLease.leaseNumber} was successfully renewed as ${dto.newLeaseNumber}.`,
          type: NotificationType.LEASE,
          userId,
        },
      });

      return newLease;
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.lease.findMany({
      where: { organizationId },
      include: {
        tenant: true,
        unit: {
          include: { property: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { id, organizationId },
      include: {
        tenant: true,
        unit: {
          include: { property: true },
        },
        previousLease: true,
        nextLease: true,
        rentRecords: {
          orderBy: { month: 'desc' },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease agreement not found within your organization context');
    }

    return lease;
  }

  /**
   * Lease Expiry Scheduler Check method
   * Fetches leases expiring in exactly 30 days and dispatches system notifications.
   */
  async checkExpiringLeases() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    
    const startRange = new Date(targetDate);
    startRange.setHours(0, 0, 0, 0);
    
    const endRange = new Date(targetDate);
    endRange.setHours(23, 59, 59, 999);

    const expiring = await this.prisma.lease.findMany({
      where: {
        status: LeaseStatus.ACTIVE,
        endDate: {
          gte: startRange,
          lte: endRange,
        },
      },
      include: {
        tenant: true,
        organization: {
          include: {
            users: { where: { role: 'OWNER' } },
          },
        },
      },
    });

    for (const lease of expiring) {
      // Find organizational owner to alert
      const owner = lease.organization.users[0];
      if (owner) {
        await this.prisma.notification.create({
          data: {
            title: 'Lease Expiring in 30 Days',
            message: `Lease ${lease.leaseNumber} for Tenant ${lease.tenant.firstName} ${lease.tenant.lastName} in Unit ${lease.unitId} expires in 30 days.`,
            type: NotificationType.LEASE,
            userId: owner.id,
          },
        });
      }
    }

    return { checked: true, alertedCount: expiring.length };
  }
}
