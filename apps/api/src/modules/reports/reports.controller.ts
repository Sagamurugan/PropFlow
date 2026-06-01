import { Controller, Get, UseGuards, Req, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  async getMonthlyReport(@Req() req: any) {
    const { organizationId } = req.user;
    return this.reportsService.getMonthlyData(organizationId);
  }

  @Get('export')
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
