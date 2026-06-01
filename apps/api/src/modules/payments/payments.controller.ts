import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { GenerateRentDto } from './dto/generate-rent.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('generate')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  generateMonthlyRent(@Body() dto: GenerateRentDto, @Req() req: any) {
    return this.paymentsService.generateMonthlyRent(dto, req.user.organizationId, req.user.sub);
  }

  @Patch(':id/pay')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  recordPayment(@Param('id') id: string, @Body() dto: RecordPaymentDto, @Req() req: any) {
    return this.paymentsService.recordPayment(id, dto, req.user.organizationId, req.user.sub);
  }

  @Post('trigger-overdue-check')
  @Roles(UserRole.OWNER)
  triggerOverdueCheck() {
    return this.paymentsService.checkOverdueRent();
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.TENANT)
  findAll(@Req() req: any) {
    if (req.user.role === UserRole.TENANT) {
      return this.paymentsService.findTenantPayments(req.user.organizationId, req.user.email);
    }
    return this.paymentsService.findAll(req.user.organizationId);
  }
}
