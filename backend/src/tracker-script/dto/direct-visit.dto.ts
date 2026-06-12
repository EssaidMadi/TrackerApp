import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class DirectVisitDto {
  @IsString()
  campaign: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, string>;

  @IsOptional()
  @IsString()
  visitorId?: string;

  /** LP script data-no-viewcontent — skip Mediago viewcontent (optimize for click_button). */
  @IsOptional()
  @IsBoolean()
  noViewContent?: boolean;
}
