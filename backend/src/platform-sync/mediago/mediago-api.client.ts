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

export function extractMediagoRecordBatch(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['results', 'data', 'list', 'campaigns', 'items', 'records']) {
      const val = obj[key];
      if (Array.isArray(val)) return val as Record<string, unknown>[];
    }
  }
  return [];
}

export function parseMediagoCampaignItem(item: Record<string, unknown>): MediagoCampaign | null {
  const campaignId = String(item.campaign_id || item.campaignId || item.id || '').trim();
  const campaignName = String(
    item.campaign_name || item.campaignName || item.name || '',
  ).trim();
  if (!campaignId) return null;
  const itemAccountId = String(item.account_id || item.accountId || '').trim();
  return {
    campaignId,
    campaignName,
    accountId: itemAccountId || undefined,
  };
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
    const byId = new Map<string, MediagoCampaign>();

    const addBatch = (batch: Record<string, unknown>[]) => {
      for (const item of batch) {
        const parsed = parseMediagoCampaignItem(item);
        if (!parsed) continue;
        if (accountId && parsed.accountId && parsed.accountId !== accountId) continue;
        byId.set(parsed.campaignId, parsed);
      }
    };

    // page_type=0 returns full array at once (documented response shape)
    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(`${BASE_URL}/manage/v1/campaign`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
          params: { page_type: '0', auth_level: 'r' },
        }),
      );
      addBatch(extractMediagoRecordBatch(data));
    } catch (err) {
      this.logger.warn(`Mediago campaign list (page_type=0) failed: ${String(err)}`);
    }

    // Paginated fallback
    if (byId.size === 0) {
      let page = 1;
      const pageSize = 100;
      for (;;) {
        const { data } = await firstValueFrom(
          this.http.get<unknown>(`${BASE_URL}/manage/v1/campaign`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
            params: {
              page_type: '1',
              page_size: pageSize,
              current_page: page,
              auth_level: 'r',
            },
          }),
        );
        const batch = extractMediagoRecordBatch(data);
        addBatch(batch);
        if (batch.length < pageSize) break;
        page += 1;
        if (page > 50) break;
      }
    }

    // Report API fallback — campaigns with recent spend (manage list can be empty)
    if (byId.size === 0) {
      const fromReport = await this.listCampaignsFromReport(credentials, 30);
      for (const c of fromReport) byId.set(c.campaignId, c);
    }

    return [...byId.values()];
  }

  /** Discover campaigns from daily report (only campaigns with spend in range). */
  async listCampaignsFromReport(
    credentials: Record<string, unknown>,
    daysBack = 30,
  ): Promise<MediagoCampaign[]> {
    const to = new Date();
    const from = new Date(to.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const rows = await this.fetchDailyCampaignMetrics(credentials, from, to, null, {
      skipAccountFilter: true,
    });
    const byId = new Map<string, MediagoCampaign>();
    for (const row of rows) {
      if (!byId.has(row.campaignId)) {
        byId.set(row.campaignId, {
          campaignId: row.campaignId,
          campaignName: row.campaignName,
        });
      }
    }
    return [...byId.values()];
  }

  async fetchDailyCampaignMetrics(
    credentials: Record<string, unknown>,
    from: Date,
    to: Date,
    accountId?: string | null,
    options?: { skipAccountFilter?: boolean },
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

    if (accountId && !options?.skipAccountFilter) {
      const allowed = new Set(
        (await this.listCampaigns(credentials, accountId)).map((c) => c.campaignId),
      );
      if (allowed.size > 0) {
        return rows.filter((r) => allowed.has(r.campaignId));
      }
      this.logger.warn(
        `Mediago accountId=${accountId} set but manage campaign list empty — using all report rows`,
      );
    }

    return rows;
  }

  /** Best-effort write — requires Mediago write token scope. */
  async pauseCampaign(
    credentials: Record<string, unknown>,
    externalCampaignId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const token = await this.authenticate(credentials);
    try {
      await firstValueFrom(
        this.http.put(
          `${BASE_URL}/manage/v1/campaign`,
          { campaign_id: externalCampaignId, status: 0 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            params: { auth_level: 'w' },
          },
        ),
      );
      return { ok: true, message: 'Campaign pause request sent' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mediago pause failed';
      this.logger.warn(`Mediago pauseCampaign failed: ${msg}`);
      return { ok: false, message: msg };
    }
  }

  async setDailyBudget(
    credentials: Record<string, unknown>,
    externalCampaignId: string,
    budget: number,
  ): Promise<{ ok: boolean; message: string }> {
    const token = await this.authenticate(credentials);
    try {
      await firstValueFrom(
        this.http.put(
          `${BASE_URL}/manage/v1/campaign`,
          { campaign_id: externalCampaignId, daily_cap: budget },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            params: { auth_level: 'w' },
          },
        ),
      );
      return { ok: true, message: 'Budget update request sent' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mediago budget update failed';
      this.logger.warn(`Mediago setDailyBudget failed: ${msg}`);
      return { ok: false, message: msg };
    }
  }
}
