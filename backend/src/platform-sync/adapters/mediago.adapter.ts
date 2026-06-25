import { HttpService } from '@nestjs/axios';
import { AdPlatform } from '@prisma/client';
import { MediagoApiClient } from '../mediago/mediago-api.client';
import { parseMediagoCredentials } from '../mediago/mediago-credentials';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class MediagoSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.mediago;
  private readonly client: MediagoApiClient;

  constructor(http: HttpService) {
    this.client = new MediagoApiClient(http);
  }

  getClient(): MediagoApiClient {
    return this.client;
  }

  async testConnection(
    credentials: Record<string, unknown>,
    accountId: string | null,
  ): Promise<boolean> {
    try {
      parseMediagoCredentials(credentials);
      await this.client.authenticate(credentials);
      const accounts = await this.client.listAccounts(credentials);
      if (accountId) {
        return accounts.some((a) => a.accountId === accountId);
      }
      return accounts.length > 0;
    } catch {
      return false;
    }
  }

  async fetchMetrics(
    credentials: Record<string, unknown>,
    accountId: string | null,
    from: Date,
    to: Date,
  ): Promise<SpendMetricRow[]> {
    const daily = await this.client.fetchDailyCampaignMetrics(
      credentials,
      from,
      to,
      accountId,
    );

    return daily.map((row) => ({
      externalCampaignId: row.campaignId,
      date: new Date(row.date + 'T12:00:00.000Z'),
      impressions: row.impressions,
      clicks: row.clicks,
      spend: row.spend,
      currency: 'USD',
    }));
  }

  pauseCampaign(credentials: Record<string, unknown>, externalCampaignId: string) {
    return this.client.pauseCampaign(credentials, externalCampaignId);
  }

  setDailyBudget(
    credentials: Record<string, unknown>,
    externalCampaignId: string,
    budget: number,
  ) {
    return this.client.setDailyBudget(credentials, externalCampaignId, budget);
  }
}
