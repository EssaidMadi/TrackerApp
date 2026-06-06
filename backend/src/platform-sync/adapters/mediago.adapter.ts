import { HttpService } from '@nestjs/axios';
import { AdPlatform } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class MediagoSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.mediago;

  constructor(private readonly http: HttpService) {}

  async testConnection(credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return Boolean(credentials.apiKey || credentials.accountName);
  }

  async fetchMetrics(
    credentials: Record<string, unknown>,
    _accountId: string | null,
    from: Date,
    to: Date,
  ): Promise<SpendMetricRow[]> {
    const apiKey = String(credentials.apiKey || '');
    const baseUrl = String(credentials.reportingUrl || '');
    if (!apiKey || !baseUrl) return [];

    try {
      const { data } = await firstValueFrom(
        this.http.get(baseUrl, {
          params: {
            api_key: apiKey,
            from: from.toISOString().slice(0, 10),
            to: to.toISOString().slice(0, 10),
          },
        }),
      );
      const rows: SpendMetricRow[] = [];
      for (const item of data?.campaigns || data?.data || []) {
        rows.push({
          externalCampaignId: String(item.campaign_id || item.id || ''),
          date: new Date(item.date || from),
          impressions: Number(item.impressions || 0),
          clicks: Number(item.clicks || 0),
          spend: Number(item.spend || item.cost || 0),
          currency: item.currency || 'EUR',
        });
      }
      return rows;
    } catch {
      return [];
    }
  }
}
