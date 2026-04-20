import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { LeaseStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        leases: true
      }
    });
  }

  findOne(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        user: true,
        leases: {
          include: {
            unit: {
              include: {
                property: true
              }
            }
          }
        }
      }
    });
  }

  async create(dto: CreateTenantDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.tenant.create({
      data: dto,
      include: {
        user: true
      }
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.ensureExists(id);

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
      include: {
        user: true
      }
    });
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
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

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    if (tenant.leases.length > 0) {
      throw new ConflictException("Tenant with an active lease cannot be deleted");
    }

    await this.prisma.tenant.delete({
      where: { id }
    });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }
  }
}
