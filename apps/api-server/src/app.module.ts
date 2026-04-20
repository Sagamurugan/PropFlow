import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RolesGuard } from "./common/guards/roles.guard";
import { envConfig } from "./config/env";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { LeasesModule } from "./modules/leases/leases.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { PropertiesModule } from "./modules/properties/properties.module";
import { TenantsModule } from "./modules/tenants/tenants.module";
import { UnitsModule } from "./modules/units/units.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig]
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    TenantsModule,
    LeasesModule,
    PaymentsModule,
    MaintenanceModule,
    AnalyticsModule,
    AiModule
  ],
  providers: [RolesGuard]
})
export class AppModule {}
