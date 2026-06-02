import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { BulkGenerateUnitDto } from './dto/bulk-generate-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  private async ensurePropertyOwnership(propertyId: string, organizationId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId, isDeleted: false },
      select: { id: true },
    });

    if (!property) {
      throw new NotFoundException('Selected property does not exist in your organization');
    }
  }

  async create(dto: CreateUnitDto, organizationId: string, userId: string) {
    await this.ensurePropertyOwnership(dto.propertyId, organizationId);

    // Check if unit number is already registered inside property
    const existing = await this.prisma.unit.findUnique({
      where: {
        propertyId_unitNumber: {
          propertyId: dto.propertyId,
          unitNumber: dto.unitNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Unit number '${dto.unitNumber}' already exists in this property`);
    }

    return this.prisma.unit.create({
      data: {
        ...dto,
        organizationId,
        createdBy: userId,
      },
    });
  }

  async bulkGeneratePreview(dto: BulkGenerateUnitDto) {
    const list: Array<{ floorNumber: number; unitNumber: string }> = [];

    for (let floor = dto.startFloor; floor <= dto.endFloor; floor++) {
      for (let index = 1; index <= dto.unitsPerFloor; index++) {
        const unitNumber = `${floor}${index.toString().padStart(2, '0')}`;
        list.push({
          floorNumber: floor,
          unitNumber,
        });
      }
    }

    return {
      propertyId: dto.propertyId,
      unitsCount: list.length,
      preview: list,
    };
  }

  async bulkGenerate(dto: BulkGenerateUnitDto, organizationId: string, userId: string) {
    await this.ensurePropertyOwnership(dto.propertyId, organizationId);

    const { preview } = await this.bulkGeneratePreview(dto);

    // Verify no code collision in db
    const unitNumbers = preview.map((p) => p.unitNumber);
    const collisions = await this.prisma.unit.findMany({
      where: {
        propertyId: dto.propertyId,
        unitNumber: { in: unitNumbers },
      },
      select: { unitNumber: true },
    });

    if (collisions.length > 0) {
      const list = collisions.map((c) => c.unitNumber).join(', ');
      throw new ConflictException(`Duplicate units detected already in Database: [${list}]`);
    }

    // Insert inside a transaction
    const operations = preview.map((p) =>
      this.prisma.unit.create({
        data: {
          unitNumber: p.unitNumber,
          floorNumber: p.floorNumber,
          unitType: dto.unitType,
          areaSqFt: dto.areaSqFt,
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          rentAmount: dto.rentAmount,
          depositAmount: dto.depositAmount,
          propertyId: dto.propertyId,
          organizationId,
          createdBy: userId,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    // Increment property total units counter
    await this.prisma.property.update({
      where: { id: dto.propertyId },
      data: {
        totalUnits: {
          increment: operations.length,
        },
      },
    });

    return {
      message: `Successfully scaffolded ${operations.length} units in a single atomic pass`,
      count: operations.length,
    };
  }

  async findAll(organizationId: string, propertyId?: string) {
    return this.prisma.unit.findMany({
      where: {
        organizationId,
        ...(propertyId ? { propertyId } : {}),
      },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, organizationId },
      include: {
        property: true,
        tenants: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found within your organization context');
    }

    return unit;
  }

  async update(id: string, dto: UpdateUnitDto, organizationId: string, userId: string) {
    const unit = await this.findOne(id, organizationId);

    if (dto.unitNumber && dto.unitNumber !== unit.unitNumber) {
      const codeCheck = await this.prisma.unit.findUnique({
        where: {
          propertyId_unitNumber: {
            propertyId: unit.propertyId,
            unitNumber: dto.unitNumber,
          },
        },
      });
      if (codeCheck) {
        throw new ConflictException(`Unit number '${dto.unitNumber}' already exists in this property`);
      }
    }

    return this.prisma.unit.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const unit = await this.findOne(id, organizationId);

    await this.prisma.unit.delete({
      where: { id },
    });

    // Decrement property counter
    await this.prisma.property.update({
      where: { id: unit.propertyId },
      data: {
        totalUnits: {
          decrement: 1,
        },
      },
    });

    return { success: true, message: 'Unit successfully deleted' };
  }
}
