import { HttpService } from '@nestjs/axios';
import { AdPlatform } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class TaboolaSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.taboola;

  constructor(private readonly http: HttpService) {}

  async testConnection(credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return Boolean(credentials.clientId && credentials.clientSecret && credentials.accountId);
  }

  async fetchMetrics(
    credentials: Record<string, unknown>,
    accountId: string | null,
    from: Date,
    to: Date,
  ): Promise<SpendMetricRow[]> {
    const clientId = String(credentials.clientId || '');
    const clientSecret = String(credentials.clientSecret || '');
    const acct = accountId || String(credentials.accountId || '');
    if (!clientId || !clientSecret || !acct) return [];

    try {
      const tokenRes = await firstValueFrom(
        this.http.post('https://backstage.taboola.com/backstage/oauth/token', null, {
          params: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          },
        }),
      );
      const token = tokenRes.data?.access_token;
      if (!token) return [];

      const { data } = await firstValueFrom(
        this.http.get(
          `https://backstage.taboola.com/backstage/api/1.0/${acct}/reports/campaign-summary/dimensions/campaign_day_breakdown`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              start_date: from.toISOString().slice(0, 10),
              end_date: to.toISOString().slice(0, 10),
            },
          },
        ),
      );

      const rows: SpendMetricRow[] = [];
      for (const item of data?.results || []) {
        rows.push({
          externalCampaignId: String(item.campaign || item.campaign_id || ''),
          date: new Date(item.date || from),
          impressions: Number(item.impressions || 0),
          clicks: Number(item.clicks || 0),
          spend: Number(item.spent || item.spend || 0),
          currency: 'EUR',
        });
      }
      return rows;
    } catch {
      return [];
    }
  }
}
