import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { PropertyHealthService } from '../services/property-health.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/properties')
export class PropertyHealthController {
  constructor(private readonly propertyHealthService: PropertyHealthService) {}

  @Get(':id/health')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getHealth(@Param('id') id: string, @Req() req: any) {
    const apiKey =
      (req.headers['x-ai-api-key'] as string | undefined) ||
      (req.headers['x-groq-api-key'] as string | undefined) ||
      (req.headers['x-gemini-api-key'] as string | undefined);
    return this.propertyHealthService.calculatePropertyHealth(id, req.user.organizationId, apiKey);
  }

  @Get(':id/health-history')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getHealthHistory(@Param('id') id: string, @Req() req: any) {
    return this.propertyHealthService.getHealthHistory(id, req.user.organizationId);
  }
}
