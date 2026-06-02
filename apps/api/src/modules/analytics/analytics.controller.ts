import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getSummary(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getSummary(organizationId);
  }

  @Get('revenue')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getRevenue(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getRevenueAnalytics(organizationId);
  }

  @Get('occupancy')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getOccupancy(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getOccupancyAnalytics(organizationId);
  }

  @Get('leases')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getLeases(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getLeaseAnalytics(organizationId);
  }

  @Get('maintenance')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getMaintenance(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getMaintenanceAnalytics(organizationId);
  }

  @Get('properties/:id/score')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getPropertyScore(@Param('id') propertyId: string, @Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getPropertyScore(propertyId, organizationId);
  }
}
