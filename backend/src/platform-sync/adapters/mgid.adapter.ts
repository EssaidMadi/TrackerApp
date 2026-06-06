import { HttpService } from '@nestjs/axios';
import { AdPlatform } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class MgidSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.mgid;

  constructor(private readonly http: HttpService) {}

  async testConnection(credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return Boolean(credentials.apiToken);
  }

  async fetchMetrics(
    credentials: Record<string, unknown>,
    _accountId: string | null,
    from: Date,
    to: Date,
  ): Promise<SpendMetricRow[]> {
    const token = String(credentials.apiToken || '');
    const baseUrl = String(credentials.apiUrl || 'https://api.mgid.com/v1');
    if (!token) return [];

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${baseUrl}/goodhits/clients/campaigns/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            dateFrom: from.toISOString().slice(0, 10),
            dateTo: to.toISOString().slice(0, 10),
          },
        }),
      );
      const rows: SpendMetricRow[] = [];
      for (const item of data?.data || data || []) {
        rows.push({
          externalCampaignId: String(item.campaignId || item.id || ''),
          date: new Date(item.date || from),
          impressions: Number(item.impressions || item.shows || 0),
          clicks: Number(item.clicks || 0),
          spend: Number(item.spent || item.cost || 0),
          currency: 'EUR',
        });
      }
      return rows;
    } catch {
      return [];
    }
  }
}
