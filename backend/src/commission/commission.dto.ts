import { IsEnum, IsString, IsNumber } from 'class-validator';
import { UserRole, CommissionType } from '../common/enums';

export class CreateCommissionDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  operatorId: string;

  @IsEnum(CommissionType)
  commissionType: CommissionType;

  @IsNumber()
  commissionValue: number;
}
