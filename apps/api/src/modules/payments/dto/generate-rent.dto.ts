import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class GenerateRentDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must follow YYYY-MM format' })
  month!: string;
}
