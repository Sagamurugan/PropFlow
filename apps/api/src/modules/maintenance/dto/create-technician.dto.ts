import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTechnicianDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  phone!: string;

  @IsNotEmpty()
  @IsString()
  specialization!: string;
}
