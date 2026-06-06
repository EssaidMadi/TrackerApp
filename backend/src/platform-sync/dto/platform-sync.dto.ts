import { AdPlatform, PlatformConnectionStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePlatformConnectionDto {
  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(PlatformConnectionStatus)
  status?: PlatformConnectionStatus;
}

export class CreateCampaignMappingDto {
  @IsString()
  campaignId: string;

  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @IsString()
  externalCampaignId: string;
}

export class ManualSpendDto {
  @IsString()
  campaignId: string;

  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @IsString()
  date: string;

  @IsOptional()
  @IsNumber()
  hour?: number;

  @IsOptional()
  @IsNumber()
  impressions?: number;

  @IsOptional()
  @IsNumber()
  clicks?: number;

  @IsOptional()
  @IsNumber()
  spend?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class ImportCsvDto {
  @IsString()
  csv: string;
}
