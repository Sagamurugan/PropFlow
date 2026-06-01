import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { RenewLeaseDto } from './dto/renew-lease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leases')
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateLeaseDto, @Req() req: any) {
    return this.leasesService.create(dto, req.user.organizationId, req.user.sub);
  }

  @Post(':id/renew')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  renew(@Param('id') id: string, @Body() dto: RenewLeaseDto, @Req() req: any) {
    return this.leasesService.renew(id, dto, req.user.organizationId, req.user.sub);
  }

  @Post('trigger-expiry-check')
  @Roles(UserRole.OWNER)
  triggerExpiryCheck() {
    return this.leasesService.checkExpiringLeases();
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAll(@Req() req: any) {
    return this.leasesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.leasesService.findOne(id, req.user.organizationId);
  }
}
