import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ServiceType } from '../common/enums';

export class CreateOperatorDto {
  @IsString()
  name: string;

  @IsEnum(ServiceType)
  service: ServiceType;

  @IsString()
  opCode: string;

  @IsOptional()
  @IsString()
  stateCode?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOperatorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
