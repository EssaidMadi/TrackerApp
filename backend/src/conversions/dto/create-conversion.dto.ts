import { IsString, IsOptional, IsNumber, IsObject, IsBoolean } from 'class-validator';

export class CreateConversionDto {
  @IsOptional()
  @IsString()
  clickId?: string;

  @IsOptional()
  @IsString()
  trackingId?: string;

  @IsOptional()
  @IsString()
  externalClickId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsNumber()
  revenue?: number;

  @IsOptional()
  @IsNumber()
  totalRevenue?: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  postbackParam1?: string;

  @IsOptional()
  @IsString()
  postbackParam2?: string;

  @IsOptional()
  @IsString()
  postbackParam3?: string;

  @IsOptional()
  @IsString()
  postbackParam4?: string;

  @IsOptional()
  @IsString()
  postbackParam5?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  is_test_lead?: boolean;
}
