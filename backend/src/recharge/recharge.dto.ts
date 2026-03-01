import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRechargeDto {
  @IsString()
  operatorId: string;

  @IsString()
  mobile: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  circle?: string;
}
