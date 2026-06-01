import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTicketDto {
  @IsNotEmpty()
  @IsString()
  technicianId!: string;
}
