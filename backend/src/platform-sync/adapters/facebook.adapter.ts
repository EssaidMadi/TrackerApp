import { HttpService } from '@nestjs/axios';
import { AdPlatform } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class FacebookSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.facebook;

  constructor(private readonly http: HttpService) {}

  async testConnection(
    credentials: Record<string, unknown>,
    accountId: string | null,
  ): Promise<boolean> {
    const token = String(credentials.accessToken || '');
    const actId = accountId || String(credentials.adAccountId || '');
    if (!token || !actId) return false;
    try {
      await firstValueFrom(
        this.http.get(`https://graph.facebook.com/v21.0/${actId}`, {
          params: { fields: 'name', access_token: token },
        }),
      );
      return true;
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
    const token = String(credentials.accessToken || '');
    const actId = accountId || String(credentials.adAccountId || '');
    if (!token || !actId) return [];

    const { data } = await firstValueFrom(
      this.http.get(`https://graph.facebook.com/v21.0/${actId}/insights`, {
        params: {
          fields: 'campaign_id,impressions,clicks,spend',
          level: 'campaign',
          time_range: JSON.stringify({
            since: from.toISOString().slice(0, 10),
            until: to.toISOString().slice(0, 10),
          }),
          time_increment: 1,
          access_token: token,
        },
      }),
    );

    const rows: SpendMetricRow[] = [];
    for (const item of data?.data || []) {
      rows.push({
        externalCampaignId: String(item.campaign_id || ''),
        date: new Date(item.date_start),
        impressions: parseInt(item.impressions || '0', 10),
        clicks: parseInt(item.clicks || '0', 10),
        spend: parseFloat(item.spend || '0'),
        currency: 'EUR',
      });
    }
    return rows;
  }
}
