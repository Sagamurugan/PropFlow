import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getSummary(organizationId);
  }

  @Get('revenue')
  async getRevenue(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getRevenueAnalytics(organizationId);
  }

  @Get('occupancy')
  async getOccupancy(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getOccupancyAnalytics(organizationId);
  }

  @Get('leases')
  async getLeases(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getLeaseAnalytics(organizationId);
  }

  @Get('maintenance')
  async getMaintenance(@Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getMaintenanceAnalytics(organizationId);
  }

  @Get('properties/:id/score')
  async getPropertyScore(@Param('id') propertyId: string, @Req() req: any) {
    const { organizationId } = req.user;
    return this.analyticsService.getPropertyScore(propertyId, organizationId);
  }
}
