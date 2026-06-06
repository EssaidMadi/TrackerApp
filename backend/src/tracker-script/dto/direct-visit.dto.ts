import { IsString, IsOptional, IsObject } from 'class-validator';

export class DirectVisitDto {
  @IsString()
  campaign: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, string>;

  @IsOptional()
  @IsString()
  visitorId?: string;
}
