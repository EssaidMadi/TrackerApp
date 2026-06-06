import { AdPlatform } from '@prisma/client';
import type { PlatformSyncAdapter, SpendMetricRow } from '../interfaces/platform-sync.adapter';

export class ManualSyncAdapter implements PlatformSyncAdapter {
  constructor(public platform: AdPlatform) {}

  async testConnection(_credentials: Record<string, unknown>, _accountId: string | null): Promise<boolean> {
    return true;
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
