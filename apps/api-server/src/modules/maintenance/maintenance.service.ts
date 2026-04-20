import { Injectable, NotFoundException } from "@nestjs/common";
import { MaintenanceStatus, UserRole } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CreateMaintenanceRequestDto } from "./dto/create-maintenance-request.dto";
import { UpdateMaintenanceRequestDto } from "./dto/update-maintenance-request.dto";

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.maintenanceRequest.findMany({
      include: {
        unit: {
          include: {
            property: true
          }
        },
        tenant: {
          include: {
            user: true
          }
        },
        assignedTechnician: true
      }
    });
  }

  findOne(id: string) {
    return this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        unit: {
          include: {
            property: true
          }
        },
        tenant: {
          include: {
            user: true
          }
        },
        assignedTechnician: true,
        reportedByUser: true
      }
    });
  }

  async create(dto: CreateMaintenanceRequestDto) {
    const [unit, tenant, reporter] = await Promise.all([
      this.prisma.unit.findUnique({ where: { id: dto.unitId } }),
      dto.tenantId ? this.prisma.tenant.findUnique({ where: { id: dto.tenantId } }) : null,
      dto.reportedByUserId
        ? this.prisma.user.findUnique({ where: { id: dto.reportedByUserId } })
        : null
    ]);

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (dto.tenantId && !tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (dto.reportedByUserId && !reporter) {
      throw new NotFoundException("Reporting user not found");
    }

    return this.prisma.maintenanceRequest.create({
      data: dto
    });
  }

  async update(id: string, dto: UpdateMaintenanceRequestDto) {
    const existingRequest = await this.prisma.maintenanceRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      throw new NotFoundException("Maintenance request not found");
    }

    if (dto.assignedTechnicianId) {
      const technician = await this.prisma.user.findUnique({
        where: { id: dto.assignedTechnicianId }
      });

      if (!technician || technician.role !== UserRole.TECHNICIAN) {
        throw new NotFoundException("Technician not found");
      }
    }

    return this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...dto,
        assignedAt: dto.assignedTechnicianId ? existingRequest.assignedAt ?? new Date() : undefined,
        resolvedAt:
          dto.status === MaintenanceStatus.RESOLVED || dto.status === MaintenanceStatus.CLOSED
            ? existingRequest.resolvedAt ?? new Date()
            : undefined
      }
    });
  }

  async remove(id: string) {
    const existingRequest = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingRequest) {
      throw new NotFoundException("Maintenance request not found");
    }

    await this.prisma.maintenanceRequest.delete({
      where: { id }
    });

    return { success: true };
  }
}
