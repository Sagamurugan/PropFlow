import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  async getLogs(@Req() req: any) {
    const { organizationId } = req.user;
    return this.activityLogService.findAll(organizationId);
  }
}
