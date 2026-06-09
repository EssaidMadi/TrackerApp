import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  buildMediagoBasicAuth,
  parseMediagoCredentials,
  type MediagoCredentials,
} from './mediago-credentials';

const BASE_URL = 'https://api.mediago.io';

export type MediagoAccount = {
  accountId: string;
  accountName: string;
};

export type MediagoCampaign = {
  campaignId: string;
  campaignName: string;
  accountId?: string;
};

export type MediagoDailyRow = {
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
};

type TokenCacheEntry = { accessToken: string; expiresAt: number };

const tokenCache = new Map<string, TokenCacheEntry>();

function cacheKey(creds: MediagoCredentials): string {
  return createHash('sha256').update(buildMediagoBasicAuth(creds)).digest('hex');
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class MediagoApiClient {
  private readonly logger = new Logger(MediagoApiClient.name);

  constructor(private readonly http: HttpService) {}

  async authenticate(credentials: Record<string, unknown>): Promise<string> {
    const creds = parseMediagoCredentials(credentials);
    const key = cacheKey(creds);
    const cached = tokenCache.get(key);
    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.accessToken;
    }

    const authHeader = buildMediagoBasicAuth(creds);
    const { data } = await firstValueFrom(
      this.http.post<{ access_token: string; expires_in?: number }>(
        `${BASE_URL}/data/v1/authentication`,
        null,
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        },
      ),
    );

    if (!data?.access_token) {
      throw new Error('Mediago authentication failed: no access_token in response');
    }

    const expiresIn = Number(data.expires_in || 3500);
    tokenCache.set(key, {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    });
    return data.access_token;
  }

  async listAccounts(credentials: Record<string, unknown>): Promise<MediagoAccount[]> {
    const token = await this.authenticate(credentials);
    const { data } = await firstValueFrom(
      this.http.get<unknown>(`${BASE_URL}/manage/v1/account`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const items = Array.isArray(data) ? data : [];
    return items.map((item: Record<string, unknown>) => ({
      accountId: String(item.account_id || ''),
      accountName: String(item.account_name || ''),
    }));
  }

  async listCampaigns(
    credentials: Record<string, unknown>,
    accountId?: string | null,
  ): Promise<MediagoCampaign[]> {
    const token = await this.authenticate(credentials);
    const results: MediagoCampaign[] = [];
    let page = 1;
    const pageSize = 100;

    for (;;) {
      const { data } = await firstValueFrom(
        this.http.get<{
          results?: unknown[];
          data?: unknown[];
          total?: number;
        }>(`${BASE_URL}/manage/v1/campaign`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page_type: '1',
            page_size: pageSize,
            current_page: page,
            auth_level: 'r',
          },
        }),
      );

      const batch = (data?.results || data?.data || (Array.isArray(data) ? data : [])) as Record<
        string,
        unknown
      >[];

      for (const item of batch) {
        const campaignId = String(item.campaign_id || item.id || '');
        const campaignName = String(item.campaign_name || item.name || '');
        const itemAccountId = String(item.account_id || '');
        if (!campaignId) continue;
        if (accountId && itemAccountId && itemAccountId !== accountId) continue;
        results.push({
          campaignId,
          campaignName,
          accountId: itemAccountId || undefined,
        });
      }

      if (batch.length < pageSize) break;
      page += 1;
      if (page > 50) break;
    }

    return results;
  }

  async fetchDailyCampaignMetrics(
    credentials: Record<string, unknown>,
    from: Date,
    to: Date,
    accountId?: string | null,
  ): Promise<MediagoDailyRow[]> {
    const creds = parseMediagoCredentials(credentials);
    const token = await this.authenticate(credentials);
    const timezone = creds.timezone || 'utc0';
    const rows: MediagoDailyRow[] = [];
    let page = 1;
    const pageSize = 100;

    for (;;) {
      const { data } = await firstValueFrom(
        this.http.get<{
          results?: Record<string, unknown>[];
          total?: number;
        }>(`${BASE_URL}/data/v1/report/day/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          params: {
            start_date: formatDate(from),
            end_date: formatDate(to),
            timezone,
            page_size: pageSize,
            current_page: page,
            sort_field: 'date',
            sort_val: 'asc',
          },
        }),
      );

      const batch = data?.results || [];
      for (const item of batch) {
        const campaignId = String(item.id || '');
        if (!campaignId) continue;
        rows.push({
          campaignId,
          campaignName: String(item.name || ''),
          date: String(item.date || formatDate(from)),
          impressions: Number(item.impression || 0),
          clicks: Number(item.click || 0),
          spend: Number(item.spend || 0),
        });
      }

      if (batch.length < pageSize) break;
      page += 1;
      if (page > 100) {
        this.logger.warn('Mediago report pagination stopped at page 100');
        break;
      }
    }

    if (accountId) {
      const allowed = new Set(
        (await this.listCampaigns(credentials, accountId)).map((c) => c.campaignId),
      );
      return rows.filter((r) => allowed.has(r.campaignId));
    }

    return rows;
  }
}
