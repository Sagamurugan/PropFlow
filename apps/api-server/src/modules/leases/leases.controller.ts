import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";

import { UserRole } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateLeaseDto } from "./dto/create-lease.dto";
import { UpdateLeaseDto } from "./dto/update-lease.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { LeasesService } from "./leases.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller("leases")
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Get()
  findAll() {
    return this.leasesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.leasesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeaseDto) {
    return this.leasesService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateLeaseDto) {
    return this.leasesService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.leasesService.remove(id);
  }
}
