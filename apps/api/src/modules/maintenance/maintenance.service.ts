import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { MaintenanceStatus, NotificationType } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async createTicket(dto: CreateTicketDto, organizationId: string, userId: string) {
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { ticketNumber: dto.ticketNumber },
    });

    if (existing) {
      throw new ConflictException(`Ticket number '${dto.ticketNumber}' already exists`);
    }

    const { tenantId, unitId, propertyId, ...ticketData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.maintenanceRequest.create({
        data: {
          ...ticketData,
          status: MaintenanceStatus.OPEN,
          tenantId,
          unitId,
          propertyId,
          organizationId,
          createdBy: userId,
        },
      });

      // Dispatch alert to manager
      const owners = await tx.user.findMany({
        where: { organizationId, role: 'OWNER' },
        select: { id: true },
      });

      for (const owner of owners) {
        await tx.notification.create({
          data: {
            title: 'New Maintenance Ticket',
            message: `Ticket ${dto.ticketNumber} (${dto.category.toLowerCase()}) was raised for Unit ${dto.unitId}.`,
            type: NotificationType.MAINTENANCE,
            userId: owner.id,
          },
        });
      }

      return ticket;
    });
  }

  async createTechnician(dto: CreateTechnicianDto) {
    return this.prisma.technician.create({
      data: dto,
    });
  }

  async findAllTechnicians() {
    return this.prisma.technician.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async assignTicket(id: string, dto: AssignTicketDto, organizationId: string, userId: string) {
    const ticket = await this.prisma.maintenanceRequest.findFirst({
      where: { id, organizationId },
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found within your organization context');
    }

    const tech = await this.prisma.technician.findUnique({
      where: { id: dto.technicianId },
    });

    if (!tech) {
      throw new NotFoundException('Technician profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          technicianId: dto.technicianId,
          status: MaintenanceStatus.ASSIGNED,
          updatedBy: userId,
        },
        include: { tenant: true },
      });

      // Trigger user-notification to tenant (if system account exists)
      const tenantUser = await tx.user.findFirst({
        where: { email: updated.tenant.email },
        select: { id: true },
      });

      if (tenantUser) {
        await tx.notification.create({
          data: {
            title: 'Technician Dispatched',
            message: `Technician ${tech.name} has been assigned to ticket ${ticket.ticketNumber} and is scheduled to visit soon.`,
            type: NotificationType.MAINTENANCE,
            userId: tenantUser.id,
          },
        });
      }

      return updated;
    });
  }

  async resolveTicket(id: string, dto: ResolveTicketDto, organizationId: string, userId: string) {
    const ticket = await this.prisma.maintenanceRequest.findFirst({
      where: { id, organizationId },
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found within your organization context');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          resolutionNotes: dto.resolutionNotes,
          status: MaintenanceStatus.RESOLVED,
          updatedBy: userId,
        },
        include: { tenant: true },
      });

      const tenantUser = await tx.user.findFirst({
        where: { email: updated.tenant.email },
        select: { id: true },
      });

      if (tenantUser) {
        await tx.notification.create({
          data: {
            title: 'Maintenance Ticket Resolved',
            message: `Ticket ${ticket.ticketNumber} has been resolved. Work Summary: ${dto.resolutionNotes}`,
            type: NotificationType.MAINTENANCE,
            userId: tenantUser.id,
          },
        });
      }

      return updated;
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: { organizationId },
      include: {
        tenant: true,
        unit: true,
        property: true,
        technician: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTenantAll(organizationId: string, email: string) {
    return this.prisma.maintenanceRequest.findMany({
      where: {
        organizationId,
        tenant: { email },
      },
      include: {
        tenant: true,
        unit: true,
        property: true,
        technician: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const ticket = await this.prisma.maintenanceRequest.findFirst({
      where: { id, organizationId },
      include: {
        tenant: true,
        unit: true,
        property: true,
        technician: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Maintenance ticket not found within your organization context');
    }

    return ticket;
  }
}
