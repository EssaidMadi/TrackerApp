import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversionEventTypesService } from '../conversion-event-types/conversion-event-types.service';
import { getVisitStats } from './visit-stats';

type BreakdownDimension =
  | 'publisherName'
  | 'platform'
  | 'device'
  | 'os'
  | 'countryCode'
  | 'browser';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventTypes: ConversionEventTypesService,
  ) {}

  async getOverview(campaignId?: string, from?: string, to?: string) {
    const clickWhere = this.dateFilter(campaignId, from, to);
    const convWhere = {
      ...(campaignId ? { campaignId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };
    const convCountWhere = await this.eventTypes.applyConversionCountFilter(convWhere);

    const [visitStats, conversions, sentConversions] = await Promise.all([
      getVisitStats(this.prisma, campaignId, from, to),
      this.prisma.conversion.count({ where: convCountWhere }),
      this.prisma.conversion.count({ where: { ...convCountWhere, status: 'sent' } }),
    ]);

    const { visits, uniqueVisits, newVisitors, returningVisitors } = visitStats;

    return {
      clicks: visits,
      visits,
      uniqueVisits,
      newVisitors,
      returningVisitors,
      conversions,
      sentConversions,
      conversionRate: visits > 0 ? ((conversions / visits) * 100).toFixed(2) : '0',
    };
  }

  async getBreakdown(
    dimension: 'publisher' | 'platform' | 'device' | 'os' | 'country' | 'browser',
    campaignId?: string,
    from?: string,
    to?: string,
  ) {
    const fieldMap: Record<string, BreakdownDimension> = {
      publisher: 'publisherName',
      platform: 'platform',
      device: 'device',
      os: 'os',
      country: 'countryCode',
      browser: 'browser',
    };

    const field = fieldMap[dimension] || 'publisherName';
    const where = this.dateFilter(campaignId, from, to);
    const conversionSlugs = await this.eventTypes.getConversionCountSlugs();

    const clicks = await this.prisma.click.findMany({ where });

    const groups = new Map<string, { clicks: number; clickIds: string[] }>();

    for (const click of clicks) {
      const value = this.getDimensionValue(click, field);
      const key = value || '(unknown)';
      const g = groups.get(key) || { clicks: 0, clickIds: [] };
      g.clicks++;
      g.clickIds.push(click.clickId);
      groups.set(key, g);
    }

    const results = await Promise.all(
      Array.from(groups.entries()).map(async ([name, stats]) => {
        const conversions = await this.prisma.conversion.count({
          where: {
            clickId: { in: stats.clickIds },
            status: 'sent',
            ...(conversionSlugs.length > 0
              ? { eventType: { in: conversionSlugs } }
              : { eventType: { in: ['__no_conversion_slugs__'] } }),
          },
        });

        return {
          name,
          clicks: stats.clicks,
          conversions,
          cr: stats.clicks > 0 ? ((conversions / stats.clicks) * 100).toFixed(2) : '0',
        };
      }),
    );

    return results.sort((a, b) => b.clicks - a.clicks);
  }

  async getLiveTraffic(campaignId?: string, limit = 50) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.click.findMany({
      where: {
        createdAt: { gte: since },
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        campaign: { select: { name: true, slug: true } },
        conversions: { select: { id: true, status: true, eventType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private getDimensionValue(
    click: Record<string, unknown>,
    field: BreakdownDimension,
  ): string | null {
    const v = click[field];
    return typeof v === 'string' ? v : null;
  }

  private dateFilter(campaignId?: string, from?: string, to?: string) {
    return {
      ...(campaignId ? { campaignId } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };
  }
}
