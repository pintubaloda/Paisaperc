import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../common/enums';

export class CreateCommissionDto {
  @IsEnum(UserRole)
  userType: UserRole; // Profile/User Type

  @IsString()
  operatorId: string;

  @IsString()
  service: string; // mobile, dth, bill_payment

  @IsOptional()
  @IsNumber()
  chargePercent?: number; // Surcharge percentage

  @IsOptional()
  @IsNumber()
  chargeValue?: number; // Surcharge flat amount

  @IsOptional()
  @IsNumber()
  commissionPercent?: number; // Commission percentage

  @IsOptional()
  @IsNumber()
  commissionValue?: number; // Commission flat amount

  @IsOptional()
  @IsString()
  isSlab?: string; // For slab-based commission
}

export class UpdateCommissionDto {
  @IsOptional()
  @IsNumber()
  chargePercent?: number;

  @IsOptional()
  @IsNumber()
  chargeValue?: number;

  @IsOptional()
  @IsNumber()
  commissionPercent?: number;

  @IsOptional()
  @IsNumber()
  commissionValue?: number;
}
