import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveTicketDto {
  @IsNotEmpty()
  @IsString()
  resolutionNotes!: string;
}
