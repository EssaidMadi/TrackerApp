import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConversionEventTypesService } from '../conversion-event-types/conversion-event-types.service';
import { getVisitStats } from './visit-stats';

export type CampaignReportRow = {
  campaignId: string;
  campaignName: string;
  marker: string;
  cpc: number;
  visits: number;
  uniqueVisits: number;
  suspiciousVisits: number;
  suspiciousPct: string;
  conversions: number;
  cost: number;
  revenue: number;
  profit: number;
  roi: number;
  cv: number;
  epv: number;
  cpv: number;
  ecpc: number;
  errors: number;
  txTransfo: number;
  impressions: number;
  platformClicks: number;
  countByEvent: Record<string, number>;
  revenueByEvent: Record<string, number>;
};

export type EventColumnDef = {
  slug: string;
  countLabel: string;
  revenueLabel: string;
};

const TRANSACTION_EVENT_SLUGS = new Set(['sale', 'sales', 'purchase']);

function countLabelFromEvent(slug: string, displayLabel: string): string {
  if (displayLabel.endsWith(' revenue')) {
    return displayLabel.slice(0, -' revenue'.length);
  }
  const known: Record<string, string> = {
    lead: 'Lead',
    sale: 'Sales',
    sales: 'Sales',
    purchase: 'Purchase',
    viewcontent: 'ViewCONTENT',
    postalcode: 'PostalCode',
    account_opening: 'account_opening',
    account_validated: 'account_validated',
    age_60: 'Age_60',
    hearing_loss: 'Hearing_loss',
    test: 'test',
  };
  return known[slug] || slug;
}

export type TimeseriesPoint = {
  bucket: string;
  impressions: number;
  visits: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  profit: number;
};

@Injectable()
export class CampaignReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventTypes: ConversionEventTypesService,
  ) {}

  private parseRange(from?: string, to?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { fromDate, toDate };
  }

  private clickWhere(campaignId?: string, from?: string, to?: string): Prisma.ClickWhereInput {
    const { fromDate, toDate } = this.parseRange(from, to);
    return {
      ...(campaignId ? { campaignId } : {}),
      createdAt: { gte: fromDate, lte: toDate },
    };
  }

  private convWhere(campaignId?: string, from?: string, to?: string): Prisma.ConversionWhereInput {
    const { fromDate, toDate } = this.parseRange(from, to);
    return {
      ...(campaignId ? { campaignId } : {}),
      createdAt: { gte: fromDate, lte: toDate },
    };
  }

  private spendWhere(campaignId?: string, from?: string, to?: string): Prisma.CampaignSpendSnapshotWhereInput {
    const { fromDate, toDate } = this.parseRange(from, to);
    return {
      ...(campaignId ? { campaignId } : {}),
      date: { gte: fromDate, lte: toDate },
    };
  }

  async getCampaignReport(from?: string, to?: string, workspace?: string): Promise<{
    rows: CampaignReportRow[];
    eventColumns: EventColumnDef[];
  }> {
    const eventTypeDefs = await this.eventTypes.findAll();
    const campaigns = await this.prisma.campaign.findMany({
      where: workspace ? { workspaceName: workspace } : undefined,
      include: { trafficSourceProfile: true },
      orderBy: { name: 'asc' },
    });

    const rows: CampaignReportRow[] = [];

    for (const campaign of campaigns) {
      const clickWhere = this.clickWhere(campaign.id, from, to);
      const convWhere = this.convWhere(campaign.id, from, to);
      const spendWhere = this.spendWhere(campaign.id, from, to);

      const [
        visits,
        suspiciousVisits,
        visitorGroups,
        legacyVisits,
        conversions,
        errors,
        revenueAgg,
        costFromConv,
        spendAgg,
      ] = await Promise.all([
        this.prisma.click.count({ where: clickWhere }),
        this.prisma.click.count({ where: { ...clickWhere, isBot: true } }),
        this.prisma.click.groupBy({
          by: ['visitorId'],
          where: { ...clickWhere, visitorId: { not: null } },
        }),
        this.prisma.click.count({ where: { ...clickWhere, visitorId: null } }),
        this.prisma.conversion.count({ where: convWhere }),
        this.prisma.conversion.count({ where: { ...convWhere, status: 'failed' } }),
        this.prisma.conversion.aggregate({
          where: convWhere,
          _sum: { revenue: true },
        }),
        this.prisma.conversion.aggregate({
          where: convWhere,
          _sum: { cost: true },
        }),
        this.prisma.campaignSpendSnapshot.aggregate({
          where: spendWhere,
          _sum: { spend: true, impressions: true, clicks: true },
        }),
      ]);

      const uniqueVisits = visitorGroups.length + legacyVisits;
      const revenue = revenueAgg._sum.revenue || 0;
      const spendCost = spendAgg._sum.spend || 0;
      const convCost = costFromConv._sum.cost || 0;
      const cost = spendCost > 0 ? spendCost : convCost;
      const impressions = spendAgg._sum.impressions || 0;
      const platformClicks = spendAgg._sum.clicks || 0;
      const profit = revenue - cost;

      const countByEventRows = await this.prisma.conversion.groupBy({
        by: ['eventType'],
        where: convWhere,
        _count: { _all: true },
        _sum: { revenue: true },
      });

      const countByEvent: Record<string, number> = {};
      const revenueByEvent: Record<string, number> = {};
      let transactionConversions = 0;
      for (const g of countByEventRows) {
        const count = g._count._all;
        countByEvent[g.eventType] = count;
        revenueByEvent[g.eventType] = g._sum.revenue || 0;
        if (TRANSACTION_EVENT_SLUGS.has(g.eventType)) {
          transactionConversions += count;
        }
      }

      const suspiciousPct =
        visits > 0 ? ((suspiciousVisits / visits) * 100).toFixed(2) : '0.00';

      rows.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        marker: campaign.trafficSourceProfile?.name || campaign.trafficSourceName || campaign.trafficSource,
        cpc: platformClicks > 0 ? cost / platformClicks : 0,
        visits,
        uniqueVisits,
        suspiciousVisits,
        suspiciousPct,
        conversions,
        cost,
        revenue,
        profit,
        roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
        cv: visits > 0 ? (conversions / visits) * 100 : 0,
        epv: visits > 0 ? revenue / visits : 0,
        cpv: visits > 0 ? cost / visits : 0,
        ecpc: conversions > 0 ? cost / conversions : 0,
        errors,
        txTransfo: visits > 0 ? (transactionConversions / visits) * 100 : 0,
        impressions,
        platformClicks,
        countByEvent,
        revenueByEvent,
      });
    }

    const discovered = new Set<string>();
    for (const row of rows) {
      for (const slug of Object.keys(row.revenueByEvent)) discovered.add(slug);
    }

    const eventColumns: EventColumnDef[] = [
      ...eventTypeDefs.map((e) => ({
        slug: e.slug,
        countLabel: countLabelFromEvent(e.slug, e.displayLabel),
        revenueLabel: e.displayLabel.endsWith(' revenue')
          ? e.displayLabel
          : `${countLabelFromEvent(e.slug, e.displayLabel)} revenue`,
      })),
      ...[...discovered]
        .filter((s) => !eventTypeDefs.some((e) => e.slug === s))
        .sort()
        .map((slug) => ({
          slug,
          countLabel: countLabelFromEvent(slug, `${slug} revenue`),
          revenueLabel: `${countLabelFromEvent(slug, `${slug} revenue`)} revenue`,
        })),
    ];

    return { rows, eventColumns };
  }

  async getTimeseries(
    from?: string,
    to?: string,
    granularity: 'hour' | 'day' = 'hour',
    campaignId?: string,
  ): Promise<TimeseriesPoint[]> {
    const { fromDate, toDate } = this.parseRange(from, to);

    const clicks = await this.prisma.click.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: { createdAt: true },
    });

    const conversions = await this.prisma.conversion.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: { createdAt: true, revenue: true, cost: true },
    });

    const spendRows = await this.prisma.campaignSpendSnapshot.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        date: { gte: fromDate, lte: toDate },
      },
      select: { date: true, hour: true, impressions: true, clicks: true, spend: true },
    });

    const buckets = new Map<string, TimeseriesPoint>();

    const bucketKey = (d: Date, hour?: number | null) => {
      if (granularity === 'day') {
        return d.toISOString().slice(0, 10);
      }
      const h = hour ?? d.getUTCHours();
      return `${d.toISOString().slice(0, 10)}T${String(h).padStart(2, '0')}:00`;
    };

    const ensure = (key: string): TimeseriesPoint => {
      let p = buckets.get(key);
      if (!p) {
        p = {
          bucket: key,
          impressions: 0,
          visits: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
        buckets.set(key, p);
      }
      return p;
    };

    for (const c of clicks) {
      const p = ensure(bucketKey(c.createdAt));
      p.visits++;
    }

    for (const c of conversions) {
      const p = ensure(bucketKey(c.createdAt));
      p.conversions++;
      p.revenue += c.revenue || 0;
      p.cost += c.cost || 0;
      p.profit = p.revenue - p.cost;
    }

    for (const s of spendRows) {
      const p = ensure(bucketKey(s.date, s.hour));
      p.impressions += s.impressions;
      p.clicks += s.clicks;
      p.cost += s.spend;
      p.profit = p.revenue - p.cost;
    }

    return [...buckets.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  }

  async getGlobalRollup(from?: string, to?: string) {
    const clickWhere = this.clickWhere(undefined, from, to);
    const convWhere = this.convWhere(undefined, from, to);
    const spendWhere = this.spendWhere(undefined, from, to);

    const [visitStats, conversions, revenueAgg, spendAgg, convCostAgg] = await Promise.all([
      getVisitStats(this.prisma, undefined, from, to),
      this.prisma.conversion.count({ where: convWhere }),
      this.prisma.conversion.aggregate({ where: convWhere, _sum: { revenue: true, cost: true } }),
      this.prisma.campaignSpendSnapshot.aggregate({
        where: spendWhere,
        _sum: { spend: true, impressions: true, clicks: true },
      }),
      this.prisma.conversion.aggregate({ where: convWhere, _sum: { cost: true } }),
    ]);

    const { visits, uniqueVisits, newVisitors, returningVisitors } = visitStats;
    const suspiciousVisits = await this.prisma.click.count({
      where: { ...clickWhere, isBot: true },
    });
    const revenue = revenueAgg._sum.revenue || 0;
    const spendCost = spendAgg._sum.spend || 0;
    const cost = spendCost > 0 ? spendCost : convCostAgg._sum.cost || 0;
    const impressions = spendAgg._sum.impressions || 0;
    const platformClicks = spendAgg._sum.clicks || 0;
    const profit = revenue - cost;

    return {
      impressions,
      visits,
      uniqueVisits,
      newVisitors,
      returningVisitors,
      suspiciousVisits,
      clicks: platformClicks,
      conversions,
      revenue,
      cost,
      profit,
      conversionRate: visits > 0 ? ((conversions / visits) * 100).toFixed(2) : '0',
      sentConversions: 0,
    };
  }

  exportCampaignReportCsv(from?: string, to?: string, workspace?: string): Promise<string> {
    return this.getCampaignReport(from, to, workspace).then(({ rows, eventColumns }) => {
      const baseHeaders = [
        'Campaign name',
        'Marker',
        'CPC',
        'Visits',
        'Unique visits',
        'Suspicious visits',
        'Suspicious %',
        'Conversions',
        'Cost',
        'Revenue',
        'Profit',
        'ROI %',
        'CV %',
        'EPV',
        'CPV',
        'Errors',
        'eCPC',
        'Tx Transfo %',
        'Impressions',
      ];
      const eventHeaders = eventColumns.flatMap((c) => [c.countLabel, c.revenueLabel]);
      const lines = [[...baseHeaders, ...eventHeaders].join(',')];

      for (const row of rows) {
        const base = [
          this.csvEscape(row.campaignName),
          this.csvEscape(row.marker),
          row.cpc.toFixed(4),
          row.visits,
          row.uniqueVisits,
          row.suspiciousVisits,
          row.suspiciousPct,
          row.conversions,
          row.cost.toFixed(4),
          row.revenue.toFixed(4),
          row.profit.toFixed(4),
          row.roi.toFixed(2),
          row.cv.toFixed(2),
          row.epv.toFixed(6),
          row.cpv.toFixed(6),
          row.errors,
          row.ecpc.toFixed(4),
          row.txTransfo.toFixed(2),
          row.impressions,
        ];
        const events = eventColumns.flatMap((c) => [
          row.countByEvent[c.slug] || 0,
          (row.revenueByEvent[c.slug] || 0).toFixed(4),
        ]);
        lines.push([...base, ...events].join(','));
      }

      return lines.join('\n');
    });
  }

  private csvEscape(value: string) {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
