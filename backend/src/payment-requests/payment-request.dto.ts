import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { PaymentRequestStatus } from '../common/enums';

export class CreatePaymentRequestDto {
  @IsNumber()
  amount: number;

  @IsString()
  paymentMode: string;

  @IsString()
  referenceNumber: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdatePaymentRequestDto {
  @IsEnum(PaymentRequestStatus)
  status: PaymentRequestStatus;

  @IsOptional()
  @IsString()
  adminRemarks?: string;
}
