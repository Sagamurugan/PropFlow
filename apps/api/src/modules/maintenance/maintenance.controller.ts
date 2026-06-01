import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TENANT)
  create(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.maintenanceService.createTicket(dto, req.user.organizationId, req.user.sub);
  }

  @Post('technicians')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  createTechnician(@Body() dto: CreateTechnicianDto) {
    return this.maintenanceService.createTechnician(dto);
  }

  @Get('technicians')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAllTechnicians() {
    return this.maintenanceService.findAllTechnicians();
  }

  @Patch(':id/assign')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @Req() req: any) {
    return this.maintenanceService.assignTicket(id, dto, req.user.organizationId, req.user.sub);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  resolve(@Param('id') id: string, @Body() dto: ResolveTicketDto, @Req() req: any) {
    return this.maintenanceService.resolveTicket(id, dto, req.user.organizationId, req.user.sub);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TENANT)
  findAll(@Req() req: any) {
    if (req.user.role === UserRole.TENANT) {
      return this.maintenanceService.findTenantAll(req.user.organizationId, req.user.email);
    }
    return this.maintenanceService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TENANT)
  async findOne(@Param('id') id: string, @Req() req: any) {
    const ticket = await this.maintenanceService.findOne(id, req.user.organizationId);
    if (req.user.role === UserRole.TENANT && ticket.tenant.email !== req.user.email) {
      throw new UnauthorizedException('Access denied to this ticket resource');
    }
    return ticket;
  }
}
