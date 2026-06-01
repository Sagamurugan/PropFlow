import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateTenantDto, @Req() req: any) {
    return this.tenantsService.create(dto, req.user.organizationId, req.user.sub);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAll(@Req() req: any) {
    return this.tenantsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.tenantsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @Req() req: any) {
    return this.tenantsService.update(id, dto, req.user.organizationId, req.user.sub);
  }

  @Patch(':id/move-out')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  moveOut(@Param('id') id: string, @Req() req: any) {
    return this.tenantsService.moveOut(id, req.user.organizationId, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tenantsService.remove(id, req.user.organizationId, req.user.sub);
  }
}
