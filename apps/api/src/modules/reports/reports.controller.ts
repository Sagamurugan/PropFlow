import { Controller, Get, UseGuards, Req, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async getMonthlyReport(@Req() req: any) {
    const { organizationId } = req.user;
    return this.reportsService.getMonthlyData(organizationId);
  }

  @Get('export')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async exportReport(
    @Query('format') format: 'pdf' | 'excel',
    @Req() req: any,
    @Res() res: Response
  ) {
    const { organizationId } = req.user;
    const { filename, contentType, content } = await this.reportsService.exportReport(format || 'pdf', organizationId);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }
}
