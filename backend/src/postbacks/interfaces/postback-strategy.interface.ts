import { Click, Conversion, ConversionMethod, PostbackConfig } from '@prisma/client';

export interface PostbackResult {
  success: boolean;
  method: string;
  url: string;
  requestBody?: string;
  httpStatus?: number;
  response?: string;
}

export type CampaignPostbackContext = {
  trafficSourceProfile?: {
    conversionMethod: ConversionMethod;
    postbackDefaults: unknown;
  } | null;
};

export interface PostbackStrategy {
  getNetwork(): string;
  canHandle(config: PostbackConfig, campaign?: CampaignPostbackContext): boolean;
  send(
    click: Click,
    conversion: Conversion,
    config: PostbackConfig,
    campaign?: CampaignPostbackContext,
  ): Promise<PostbackResult>;
}
