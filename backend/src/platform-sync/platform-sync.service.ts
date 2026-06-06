import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AdPlatform, PlatformConnectionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PlatformSyncAdapter, SpendMetricRow } from './interfaces/platform-sync.adapter';
import { FacebookSyncAdapter } from './adapters/facebook.adapter';
import { GoogleSyncAdapter } from './adapters/google.adapter';
import { MediagoSyncAdapter } from './adapters/mediago.adapter';
import { OutbrainSyncAdapter } from './adapters/outbrain.adapter';
import { TaboolaSyncAdapter } from './adapters/taboola.adapter';
import { MgidSyncAdapter } from './adapters/mgid.adapter';
import { BingSyncAdapter } from './adapters/bing.adapter';
import { ManualSyncAdapter } from './adapters/manual.adapter';
import {
  CreatePlatformConnectionDto,
  CreateCampaignMappingDto,
  ManualSpendDto,
} from './dto/platform-sync.dto';

@Injectable()
export class PlatformSyncService implements OnModuleInit {
  private readonly logger = new Logger(PlatformSyncService.name);
  private adapters = new Map<AdPlatform, PlatformSyncAdapter>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {
    this.registerAdapters();
  }

  onModuleInit() {
    const hourMs = 60 * 60 * 1000;
    setInterval(() => {
      this.syncAll().catch((err) => this.logger.error('Scheduled sync failed', err));
    }, hourMs);
  }

  private registerAdapters() {
    const list: PlatformSyncAdapter[] = [
      new FacebookSyncAdapter(this.http),
      new GoogleSyncAdapter(),
      new MediagoSyncAdapter(this.http),
      new OutbrainSyncAdapter(this.http),
      new TaboolaSyncAdapter(this.http),
      new MgidSyncAdapter(this.http),
      new BingSyncAdapter(),
      new ManualSyncAdapter(AdPlatform.powerspace),
      new ManualSyncAdapter(AdPlatform.organic),
      new ManualSyncAdapter(AdPlatform.native),
    ];
    for (const a of list) this.adapters.set(a.platform, a);
  }

  listConnections() {
    return this.prisma.platformConnection.findMany({ orderBy: { platform: 'asc' } });
  }

  createConnection(dto: CreatePlatformConnectionDto) {
    return this.prisma.platformConnection.create({
      data: {
        platform: dto.platform,
        label: dto.label,
        accountId: dto.accountId,
        credentials: (dto.credentials || {}) as Prisma.InputJsonValue,
        status: PlatformConnectionStatus.active,
      },
    });
  }

  async updateConnection(id: string, dto: Partial<CreatePlatformConnectionDto>) {
    return this.prisma.platformConnection.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.accountId !== undefined ? { accountId: dto.accountId } : {}),
        ...(dto.credentials !== undefined
          ? { credentials: dto.credentials as Prisma.InputJsonValue }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async deleteConnection(id: string) {
    await this.prisma.platformConnection.delete({ where: { id } });
    return { deleted: true, id };
  }

  async testConnection(id: string) {
    const conn = await this.prisma.platformConnection.findUnique({ where: { id } });
    if (!conn) throw new BadRequestException('Connection not found');
    const adapter = this.adapters.get(conn.platform);
    if (!adapter) return { ok: false };
    const ok = await adapter.testConnection(
      conn.credentials as Record<string, unknown>,
      conn.accountId,
    );
    return { ok };
  }

  listMappings() {
    return this.prisma.campaignPlatformMapping.findMany({
      include: { campaign: { select: { id: true, name: true, slug: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  createMapping(dto: CreateCampaignMappingDto) {
    return this.prisma.campaignPlatformMapping.upsert({
      where: {
        campaignId_platform: {
          campaignId: dto.campaignId,
          platform: dto.platform,
        },
      },
      create: {
        campaignId: dto.campaignId,
        platform: dto.platform,
        externalCampaignId: dto.externalCampaignId,
      },
      update: { externalCampaignId: dto.externalCampaignId },
    });
  }

  async deleteMapping(id: string) {
    await this.prisma.campaignPlatformMapping.delete({ where: { id } });
    return { deleted: true, id };
  }

  async upsertManualSpend(dto: ManualSpendDto) {
    const date = new Date(dto.date);
    const hour = dto.hour ?? -1;
    return this.prisma.campaignSpendSnapshot.upsert({
      where: {
        campaignId_platform_date_hour: {
          campaignId: dto.campaignId,
          platform: dto.platform,
          date,
          hour,
        },
      },
      create: {
        campaignId: dto.campaignId,
        platform: dto.platform,
        date,
        hour,
        impressions: dto.impressions ?? 0,
        clicks: dto.clicks ?? 0,
        spend: dto.spend ?? 0,
        currency: dto.currency || 'EUR',
        source: 'manual',
      },
      update: {
        impressions: dto.impressions ?? 0,
        clicks: dto.clicks ?? 0,
        spend: dto.spend ?? 0,
        currency: dto.currency || 'EUR',
        source: 'manual',
      },
    });
  }

  async importSpendCsv(csv: string) {
    const lines = csv.trim().split('\n').slice(1);
    let imported = 0;
    for (const line of lines) {
      const [dateStr, campaignSlug, impressions, clicks, spend, platformStr] = line
        .split(',')
        .map((s) => s.trim());
      if (!dateStr || !campaignSlug) continue;
      const campaign = await this.prisma.campaign.findFirst({
        where: { OR: [{ slug: campaignSlug }, { name: campaignSlug }] },
      });
      if (!campaign) continue;
      const platform = (platformStr as AdPlatform) || AdPlatform.native;
      await this.upsertManualSpend({
        campaignId: campaign.id,
        platform,
        date: dateStr,
        impressions: parseInt(impressions || '0', 10),
        clicks: parseInt(clicks || '0', 10),
        spend: parseFloat(spend || '0'),
      });
      imported++;
    }
    return { imported };
  }

  async syncAll(daysBack = 7) {
    const connections = await this.prisma.platformConnection.findMany({
      where: { status: PlatformConnectionStatus.active },
    });
    const to = new Date();
    const from = new Date(to.getTime() - daysBack * 24 * 60 * 60 * 1000);
    let total = 0;

    for (const conn of connections) {
      try {
        const n = await this.syncConnection(conn.id, from, to);
        total += n;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await this.prisma.platformConnection.update({
          where: { id: conn.id },
          data: { status: PlatformConnectionStatus.error, lastError: msg },
        });
      }
    }
    return { synced: total };
  }

  async syncConnection(connectionId: string, from?: Date, to?: Date) {
    const conn = await this.prisma.platformConnection.findUnique({ where: { id: connectionId } });
    if (!conn) throw new BadRequestException('Connection not found');

    const adapter = this.adapters.get(conn.platform);
    if (!adapter) return 0;

    const end = to || new Date();
    const start = from || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const metrics = await adapter.fetchMetrics(
      conn.credentials as Record<string, unknown>,
      conn.accountId,
      start,
      end,
    );

    const mappings = await this.prisma.campaignPlatformMapping.findMany({
      where: { platform: conn.platform },
    });
    const mapByExternal = new Map(mappings.map((m) => [m.externalCampaignId, m.campaignId]));

    let saved = 0;
    for (const row of metrics) {
      const campaignId = mapByExternal.get(row.externalCampaignId);
      if (!campaignId) continue;
      await this.saveSnapshot(campaignId, conn.platform, row, 'sync');
      saved++;
    }

    await this.prisma.platformConnection.update({
      where: { id: conn.id },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
        status: PlatformConnectionStatus.active,
      },
    });

    return saved;
  }

  private async saveSnapshot(
    campaignId: string,
    platform: AdPlatform,
    row: SpendMetricRow,
    source: string,
  ) {
    const hour = row.hour ?? -1;
    await this.prisma.campaignSpendSnapshot.upsert({
      where: {
        campaignId_platform_date_hour: {
          campaignId,
          platform,
          date: row.date,
          hour,
        },
      },
      create: {
        campaignId,
        platform,
        date: row.date,
        hour,
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.spend,
        currency: row.currency || 'EUR',
        source,
      },
      update: {
        impressions: row.impressions,
        clicks: row.clicks,
        spend: row.spend,
        currency: row.currency || 'EUR',
        source,
      },
    });
  }
}
