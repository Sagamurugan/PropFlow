import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { CreatePropertyDto } from "./dto/create-property.dto";
import { UpdatePropertyDto } from "./dto/update-property.dto";

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.property.findMany({
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            units: true
          }
        }
      }
    });
  }

  findOne(id: string) {
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        units: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  async create(dto: CreatePropertyDto) {
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId }
    });

    if (!owner) {
      throw new NotFoundException("Owner not found");
    }

    return this.prisma.property.create({
      data: dto
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.ensureExists(id);

    return this.prisma.property.update({
      where: { id },
      data: dto
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.property.delete({
      where: { id }
    });

    return { success: true };
  }

  private async ensureExists(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!property) {
      throw new NotFoundException("Property not found");
    }
  }
}
