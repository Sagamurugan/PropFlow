import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { LeaseStatus, UnitStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";

@Injectable()
export class LeasesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.lease.findMany({
      include: {
        tenant: {
          include: {
            user: true
          }
        },
        unit: {
          include: {
            property: true
          }
        }
      }
    });
  }

  findOne(id: string) {
    return this.prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            user: true
          }
        },
        unit: {
          include: {
            property: true
          }
        },
        payments: true
      }
    });
  }

  async create(dto: CreateLeaseDto) {
    await this.validateLeaseDates(dto.startDate, dto.endDate);
    await this.ensureUnitAndTenantExist(dto.unitId, dto.tenantId);
    await this.ensureNoActiveLeaseOnUnit(dto.unitId);

    return this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          unitId: dto.unitId,
          tenantId: dto.tenantId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit,
          rentDueDay: dto.rentDueDay,
          status: LeaseStatus.ACTIVE
        }
      });

      await tx.unit.update({
        where: { id: dto.unitId },
        data: {
          status: UnitStatus.OCCUPIED,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit
        }
      });

      return lease;
    });
  }

  async update(id: string, dto: UpdateLeaseDto) {
    const existingLease = await this.prisma.lease.findUnique({
      where: { id }
    });

    if (!existingLease) {
      throw new NotFoundException("Lease not found");
    }

    await this.validateLeaseDates(
      dto.startDate ?? existingLease.startDate.toISOString(),
      dto.endDate ?? existingLease.endDate.toISOString()
    );

    if (dto.status === LeaseStatus.ACTIVE) {
      await this.ensureNoActiveLeaseOnUnit(existingLease.unitId, id);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedLease = await tx.lease.update({
        where: { id },
        data: {
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit,
          rentDueDay: dto.rentDueDay,
          status: dto.status
        }
      });

      const shouldOccupyUnit = updatedLease.status === LeaseStatus.ACTIVE;

      await tx.unit.update({
        where: { id: existingLease.unitId },
        data: {
          status: shouldOccupyUnit ? UnitStatus.OCCUPIED : UnitStatus.VACANT,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit
        }
      });

      return updatedLease;
    });
  }

  async remove(id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id }
    });

    if (!lease) {
      throw new NotFoundException("Lease not found");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.lease.delete({
        where: { id }
      });

      const remainingActiveLease = await tx.lease.findFirst({
        where: {
          unitId: lease.unitId,
          status: LeaseStatus.ACTIVE
        }
      });

      await tx.unit.update({
        where: { id: lease.unitId },
        data: {
          status: remainingActiveLease ? UnitStatus.OCCUPIED : UnitStatus.VACANT
        }
      });

      return { success: true };
    });
  }

  private async ensureUnitAndTenantExist(unitId: string, tenantId: string) {
    const [unit, tenant] = await Promise.all([
      this.prisma.unit.findUnique({ where: { id: unitId } }),
      this.prisma.tenant.findUnique({ where: { id: tenantId } })
    ]);

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
  }

  private async ensureNoActiveLeaseOnUnit(unitId: string, excludeLeaseId?: string) {
    const existingActiveLease = await this.prisma.lease.findFirst({
      where: {
        unitId,
        status: LeaseStatus.ACTIVE,
        id: excludeLeaseId
          ? {
              not: excludeLeaseId
            }
          : undefined
      }
    });

    if (existingActiveLease) {
      throw new ConflictException("Unit already has an active lease");
    }
  }

  private async validateLeaseDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid lease dates");
    }

    if (end <= start) {
      throw new BadRequestException("Lease end date must be after start date");
    }
  }
}
