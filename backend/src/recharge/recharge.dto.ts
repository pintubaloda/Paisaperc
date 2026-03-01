import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRechargeDto {
  @IsString()
  operatorId: string;

  @IsString()
  mobile: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  circle?: string;
}
