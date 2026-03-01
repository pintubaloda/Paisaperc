import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoutingRuleEnhancedDto {
  @IsOptional()
  @IsString()
  userId?: string; // Specific user or "all"

  @IsString()
  operatorId: string;

  @IsArray()
  apiIds: string[]; // Multiple APIs in priority order [API1, API2, API3]

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoutingRuleDto {
  @IsOptional()
  @IsArray()
  apiIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
