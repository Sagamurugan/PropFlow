import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { LeaseStatus, UnitStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.unit.findMany({
      include: {
        property: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  findOne(id: string) {
    return this.prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
        leases: true
      }
    });
  }

  async create(dto: CreateUnitDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId }
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }

    return this.prisma.unit.create({
      data: {
        propertyId: dto.propertyId,
        unitNumber: dto.unitNumber,
        floor: dto.floor,
        monthlyRent: dto.monthlyRent,
        securityDeposit: dto.securityDeposit
      }
    });
  }

  async update(id: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        leases: {
          where: {
            status: LeaseStatus.ACTIVE
          },
          select: { id: true }
        }
      }
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (dto.status === UnitStatus.VACANT && unit.leases.length > 0) {
      throw new ConflictException("Unit with an active lease cannot be marked vacant");
    }

    return this.prisma.unit.update({
      where: { id },
      data: dto
    });
  }

  async remove(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        leases: {
          take: 1,
          select: { id: true }
        },
        maintenanceRequests: {
          take: 1,
          select: { id: true }
        }
      }
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    if (unit.leases.length > 0 || unit.maintenanceRequests.length > 0) {
      throw new ConflictException("Unit cannot be deleted while related records exist");
    }

    await this.prisma.unit.delete({
      where: { id }
    });

    return { success: true };
  }
}
