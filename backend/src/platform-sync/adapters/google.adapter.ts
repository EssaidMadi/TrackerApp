import { AdPlatform } from '@prisma/client';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

/** Google Ads API requires OAuth + developer token — returns empty until fully configured */
export class GoogleSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.google;

  async testConnection(credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return Boolean(credentials.customerId && credentials.developerToken);
  }

  async fetchMetrics(
    _credentials: Record<string, unknown>,
    _accountId: string | null,
    _from: Date,
    _to: Date,
  ): Promise<SpendMetricRow[]> {
    return [];
  }
}
