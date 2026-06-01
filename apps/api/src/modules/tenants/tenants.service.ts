import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantStatus, UnitStatus } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto, organizationId: string, userId: string) {
    const { documents, unitId, ...tenantData } = dto;

    if (unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: unitId, organizationId },
      });

      if (!unit) {
        throw new NotFoundException('Selected unit does not exist in your organization');
      }

      if (unit.status !== UnitStatus.VACANT) {
        throw new ConflictException(`Selected unit is currently ${unit.status.toLowerCase()}`);
      }
    }

    const tenant = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const newTenant = await tx.tenant.create({
        data: {
          ...tenantData,
          unitId,
          organizationId,
          createdBy: userId,
          status: TenantStatus.ACTIVE,
        },
      });

      // 2. Create Tenant Documents if provided
      if (documents && documents.length > 0) {
        await tx.tenantDocument.createMany({
          data: documents.map((doc) => ({
            documentType: doc.documentType,
            documentUrl: doc.documentUrl,
            tenantId: newTenant.id,
          })),
        });
      }

      // 3. Update Unit and Log Occupancy History if assigned
      if (unitId) {
        await tx.unit.update({
          where: { id: unitId },
          data: { status: UnitStatus.OCCUPIED },
        });

        await tx.occupancyHistory.create({
          data: {
            moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : new Date(),
            tenantId: newTenant.id,
            unitId,
          },
        });
      }

      return newTenant;
    });

    return tenant;
  }

  async findAll(organizationId: string) {
    return this.prisma.tenant.findMany({
      where: { organizationId },
      include: {
        unit: {
          include: { property: true },
        },
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, organizationId },
      include: {
        unit: {
          include: { property: true },
        },
        documents: true,
        occupancies: {
          include: { unit: true },
          orderBy: { moveInDate: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found within your organization context');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, organizationId: string, userId: string) {
    const tenant = await this.findOne(id, organizationId);
    const { unitId, ...tenantData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Handle Unit Change
      if (unitId !== undefined && unitId !== tenant.unitId) {
        // Revert old unit if exists
        if (tenant.unitId) {
          await tx.unit.update({
            where: { id: tenant.unitId },
            data: { status: UnitStatus.VACANT },
          });

          // Close active occupancy history
          await tx.occupancyHistory.updateMany({
            where: {
              tenantId: tenant.id,
              unitId: tenant.unitId,
              moveOutDate: null,
            },
            data: {
              moveOutDate: new Date(),
            },
          });
        }

        // Assign new unit if provided
        if (unitId) {
          const newUnit = await tx.unit.findFirst({
            where: { id: unitId, organizationId },
          });

          if (!newUnit) {
            throw new NotFoundException('Selected unit does not exist in your organization');
          }

          if (newUnit.status !== UnitStatus.VACANT) {
            throw new ConflictException(`Selected unit is currently ${newUnit.status.toLowerCase()}`);
          }

          await tx.unit.update({
            where: { id: unitId },
            data: { status: UnitStatus.OCCUPIED },
          });

          await tx.occupancyHistory.create({
            data: {
              moveInDate: dto.moveInDate ? new Date(dto.moveInDate) : new Date(),
              tenantId: tenant.id,
              unitId,
            },
          });
        }
      }

      return tx.tenant.update({
        where: { id },
        data: {
          ...tenantData,
          unitId: unitId === undefined ? tenant.unitId : unitId,
          updatedBy: userId,
        },
      });
    });
  }

  async moveOut(id: string, organizationId: string, userId: string) {
    const tenant = await this.findOne(id, organizationId);

    if (tenant.status === TenantStatus.MOVED_OUT) {
      throw new ConflictException('Tenant is already marked as moved out');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revert unit back to vacant
      if (tenant.unitId) {
        await tx.unit.update({
          where: { id: tenant.unitId },
          data: { status: UnitStatus.VACANT },
        });

        // Close out active occupancy history
        await tx.occupancyHistory.updateMany({
          where: {
            tenantId: tenant.id,
            unitId: tenant.unitId,
            moveOutDate: null,
          },
          data: {
            moveOutDate: new Date(),
          },
        });
      }

      return tx.tenant.update({
        where: { id },
        data: {
          status: TenantStatus.MOVED_OUT,
          unitId: null,
          updatedBy: userId,
        },
      });
    });
  }

  async remove(id: string, organizationId: string, userId: string) {
    // Implement as soft-delete via status change
    await this.moveOut(id, organizationId, userId);

    await this.prisma.tenant.update({
      where: { id },
      data: {
        status: TenantStatus.INACTIVE,
        updatedBy: userId,
      },
    });

    return { success: true, message: 'Tenant successfully marked as inactive' };
  }
}
