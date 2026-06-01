import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AssistantService } from '../services/assistant.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('ask')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async ask(@Body('query') query: string, @Req() req: any) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query string is required.');
    }
    const apiKey = req.headers['x-gemini-api-key'] as string | undefined;
    return this.assistantService.processQuery(query, req.user.organizationId, apiKey);
  }
}
