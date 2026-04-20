import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";

import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateMaintenanceRequestDto } from "./dto/create-maintenance-request.dto";
import { UpdateMaintenanceRequestDto } from "./dto/update-maintenance-request.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { MaintenanceService } from "./maintenance.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TENANT, UserRole.TECHNICIAN)
@Controller("maintenance")
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaintenanceRequestDto) {
    return this.maintenanceService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMaintenanceRequestDto) {
    return this.maintenanceService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.maintenanceService.remove(id);
  }
}
