import { AdPlatform } from '@prisma/client';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class BingSyncAdapter implements PlatformSyncAdapter {
  platform = AdPlatform.bing;

  async testConnection(credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return Boolean(credentials.developerToken && credentials.customerId);
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
