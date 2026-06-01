import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeaseIntelligenceService } from '../services/lease-intelligence.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/leases')
export class LeaseIntelligenceController {
  constructor(private readonly leaseIntelligenceService: LeaseIntelligenceService) {}

  @Post('parse')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async parseLease(@UploadedFile() file: any, @Req() req: any) {
    if (!file) {
      throw new BadRequestException('Lease agreement PDF file is required.');
    }
    const apiKey = req.headers['x-gemini-api-key'] as string | undefined;
    return this.leaseIntelligenceService.parseLeasePdf(file.buffer, apiKey);
  }
}
