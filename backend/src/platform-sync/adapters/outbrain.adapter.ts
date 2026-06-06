import { HttpService } from '@nestjs/axios';
import { AdPlatform } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class OutbrainSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.outbrain;

  constructor(private readonly http: HttpService) {}

  async testConnection(credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return Boolean(credentials.token && credentials.marketerId);
  }

  async fetchMetrics(
    credentials: Record<string, unknown>,
    accountId: string | null,
    from: Date,
    to: Date,
  ): Promise<SpendMetricRow[]> {
    const token = String(credentials.token || '');
    const marketerId = accountId || String(credentials.marketerId || '');
    if (!token || !marketerId) return [];

    try {
      const { data } = await firstValueFrom(
        this.http.get(
          `https://api.outbrain.com/amplify/v0.1/reports/marketers/${marketerId}/campaigns`,
          {
            headers: { OB_TOKEN_V1: token },
            params: {
              from: from.toISOString().slice(0, 10),
              to: to.toISOString().slice(0, 10),
            },
          },
        ),
      );
      const rows: SpendMetricRow[] = [];
      for (const item of data?.campaigns || []) {
        rows.push({
          externalCampaignId: String(item.id || item.campaignId || ''),
          date: new Date(item.date || from),
          impressions: Number(item.impressions || 0),
          clicks: Number(item.clicks || 0),
          spend: Number(item.spend || item.cost || 0),
          currency: 'EUR',
        });
      }
      return rows;
    } catch {
      return [];
    }
  }
}
