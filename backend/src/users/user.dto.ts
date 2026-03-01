import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../common/enums';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  mobile: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateKycDto {
  panCard?: string;
  aadhaarCard?: string;
  gstNumber?: string;
}
