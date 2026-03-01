import { IsString, IsArray, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class OperatorCodeMappingDto {
  @IsString()
  operatorId: string;

  @IsString()
  providerCode: string;

  @IsOptional()
  @IsString()
  optional1?: string;

  @IsOptional()
  @IsString()
  optional2?: string;

  @IsOptional()
  @IsString()
  optional3?: string;
}

export class ResponseMappingDto {
  @IsString()
  keyMessage: string;

  @IsString()
  responseType: string;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  txnIdStart?: string;

  @IsOptional()
  @IsString()
  txnIdEnd?: string;

  @IsOptional()
  @IsString()
  opidStart?: string;

  @IsOptional()
  @IsString()
  opidEnd?: string;

  @IsOptional()
  @IsString()
  balanceStart?: string;

  @IsOptional()
  @IsString()
  balanceEnd?: string;

  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @IsOptional()
  @IsString()
  alertType?: string;
}

export class UpdateOperatorCodesDto {
  @IsArray()
  operatorCodes: OperatorCodeMappingDto[];
}

export class UpdateResponseMappingsDto {
  @IsArray()
  responseMappings: ResponseMappingDto[];

  @IsOptional()
  @IsString()
  sampleRequest?: string;

  @IsOptional()
  @IsString()
  sampleResponse?: string;
}
