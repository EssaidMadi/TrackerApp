import { IsString, IsOptional, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { LanderStatus } from '@prisma/client';

export class UpdateLanderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  rootDomain?: string;

  @IsOptional()
  @IsString()
  publicUrl?: string;

  @IsOptional()
  @IsString()
  entryFile?: string;

  @IsOptional()
  @IsBoolean()
  injectTracker?: boolean;

  @IsOptional()
  @IsObject()
  trackerAttrs?: { noViewContent?: boolean };

  @IsOptional()
  @IsEnum(LanderStatus)
  status?: LanderStatus;
}
