import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateConversionEventTypeDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  displayLabel: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  countsAsConversion?: boolean;
}

export class UpdateConversionEventTypeDto {
  @IsOptional()
  @IsString()
  displayLabel?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  countsAsConversion?: boolean;
}
