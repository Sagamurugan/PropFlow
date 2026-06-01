import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { GeminiProvider } from './providers/gemini.provider';
import { LeaseIntelligenceService } from './services/lease-intelligence.service';
import { LeaseIntelligenceController } from './controllers/lease-intelligence.controller';
import { PropertyHealthService } from './services/property-health.service';
import { PropertyHealthController } from './controllers/property-health.controller';
import { AssistantService } from './services/assistant.service';
import { AssistantController } from './controllers/assistant.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    LeaseIntelligenceController,
    PropertyHealthController,
    AssistantController,
  ],
  providers: [
    GeminiProvider,
    LeaseIntelligenceService,
    PropertyHealthService,
    AssistantService,
  ],
  exports: [
    GeminiProvider,
    LeaseIntelligenceService,
    PropertyHealthService,
    AssistantService,
  ],
})
export class AiModule {}
