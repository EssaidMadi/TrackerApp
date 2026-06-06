import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConversionMethod, TrackingMode } from '@prisma/client';

export class ParamMappingDto {
  @IsString()
  internalField: string;

  @IsString()
  displayLabel: string;

  @IsArray()
  @IsString({ each: true })
  externalKeys: string[];

  @IsOptional()
  @IsString()
  urlMacro?: string;

  @IsBoolean()
  showInReports: boolean;

  @IsOptional()
  priority?: number;
}

export class CreateTrafficSourceDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsEnum(TrackingMode)
  trackingModeDefault: TrackingMode;

  @IsOptional()
  @IsString()
  clickUrlTemplate?: string;

  @IsOptional()
  @IsString()
  directAdUrlTemplate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParamMappingDto)
  paramMappings: ParamMappingDto[];

  @IsEnum(ConversionMethod)
  conversionMethod: ConversionMethod;

  @IsOptional()
  @IsObject()
  postbackDefaults?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  setupNote?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTrafficSourceDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TrackingMode)
  trackingModeDefault?: TrackingMode;

  @IsOptional()
  @IsString()
  clickUrlTemplate?: string;

  @IsOptional()
  @IsString()
  directAdUrlTemplate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParamMappingDto)
  paramMappings?: ParamMappingDto[];

  @IsOptional()
  @IsEnum(ConversionMethod)
  conversionMethod?: ConversionMethod;

  @IsOptional()
  @IsObject()
  postbackDefaults?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  setupNote?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
