import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { BulkGenerateUnitDto } from './dto/bulk-generate-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateUnitDto, @Req() req: any) {
    return this.unitsService.create(dto, req.user.organizationId, req.user.sub);
  }

  @Post('bulk-preview')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  bulkPreview(@Body() dto: BulkGenerateUnitDto) {
    return this.unitsService.bulkGeneratePreview(dto);
  }

  @Post('bulk')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  bulkGenerate(@Body() dto: BulkGenerateUnitDto, @Req() req: any) {
    return this.unitsService.bulkGenerate(dto, req.user.organizationId, req.user.sub);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAll(@Req() req: any, @Query('propertyId') propertyId?: string) {
    return this.unitsService.findAll(req.user.organizationId, propertyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.unitsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @Req() req: any) {
    return this.unitsService.update(id, dto, req.user.organizationId, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.unitsService.remove(id, req.user.organizationId);
  }
}
