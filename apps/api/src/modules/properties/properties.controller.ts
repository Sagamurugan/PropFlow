import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreatePropertyDto, @Req() req: any) {
    return this.propertiesService.create(dto, req.user.organizationId, req.user.sub);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAll(@Req() req: any) {
    return this.propertiesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.propertiesService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Req() req: any) {
    return this.propertiesService.update(id, dto, req.user.organizationId, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.propertiesService.remove(id, req.user.organizationId, req.user.sub);
  }
}
