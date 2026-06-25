import { AdPlatform } from '@prisma/client';

export type SpendMetricRow = {
  externalCampaignId: string;
  date: Date;
  hour?: number;
  impressions: number;
  clicks: number;
  spend: number;
  currency?: string;
};

export type PlatformControlAdapter = {
  pauseCampaign?(
    credentials: Record<string, unknown>,
    externalCampaignId: string,
  ): Promise<{ ok: boolean; message: string }>;
  setDailyBudget?(
    credentials: Record<string, unknown>,
    externalCampaignId: string,
    budget: number,
  ): Promise<{ ok: boolean; message: string }>;
};

export type PlatformSyncAdapter = PlatformControlAdapter & {
  platform: AdPlatform;
  fetchMetrics(
    credentials: Record<string, unknown>,
    accountId: string | null,
    from: Date,
    to: Date,
  ): Promise<SpendMetricRow[]>;
  testConnection(credentials: Record<string, unknown>, accountId: string | null): Promise<boolean>;
};
