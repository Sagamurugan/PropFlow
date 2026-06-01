import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePropertyDto, organizationId: string, userId: string) {
    const existingCode = await this.prisma.property.findUnique({
      where: { propertyCode: dto.propertyCode },
    });

    if (existingCode) {
      throw new ConflictException(`Property code '${dto.propertyCode}' is already registered`);
    }

    return this.prisma.property.create({
      data: {
        ...dto,
        organizationId,
        createdBy: userId,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.property.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        organizationId,
        isDeleted: false,
      },
      include: {
        _count: {
          select: { units: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found within your organization context');
    }

    return property;
  }

  async update(id: string, dto: UpdatePropertyDto, organizationId: string, userId: string) {
    const property = await this.findOne(id, organizationId);

    if (dto.propertyCode && dto.propertyCode !== property.propertyCode) {
      const codeCheck = await this.prisma.property.findUnique({
        where: { propertyCode: dto.propertyCode },
      });
      if (codeCheck) {
        throw new ConflictException(`Property code '${dto.propertyCode}' is already registered`);
      }
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, organizationId: string, userId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.property.update({
      where: { id },
      data: {
        isDeleted: true,
        updatedBy: userId,
      },
    });

    return { success: true, message: 'Property successfully soft-deleted' };
  }
}
