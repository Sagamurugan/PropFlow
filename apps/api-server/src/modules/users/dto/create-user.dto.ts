import { UserRole } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  firstName!: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber("IN")
  phone?: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
