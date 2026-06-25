import { Injectable } from '@nestjs/common';
import { PlacementAnalyticsService } from './placement-analytics.service';
import { CreativeAnalyticsService } from './creative-analytics.service';
import { CampaignReportService } from './campaign-report.service';
import type { VisitAnalyticsFilters } from './visit-filters';

export type DigestItem = {
  id: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
  category: 'scale' | 'pause' | 'block' | 'budget' | 'general';
  title: string;
  message: string;
  action: string;
  estimatedImpact?: number;
  entityKey?: string;
};

@Injectable()
export class DigestService {
  constructor(
    private readonly placements: PlacementAnalyticsService,
    private readonly creatives: CreativeAnalyticsService,
    private readonly campaignReport: CampaignReportService,
  ) {}

  async getDigest(filters: VisitAnalyticsFilters, eventType = 'call_click') {
    const [placementReport, creativeReport, campaignData] = await Promise.all([
      this.placements.getPlacements(filters, 'site', eventType, 'recorded'),
      this.creatives.getCreativeReport(filters, { eventType, countMode: 'recorded' }),
      this.campaignReport.getCampaignReport(filters.from, filters.to),
    ]);

    const items: DigestItem[] = [];

    for (const row of placementReport.rows.filter((r) => r.verdict === 'kill').slice(0, 5)) {
      items.push({
        id: `block-site-${row.key}`,
        severity: 'danger',
        category: 'block',
        title: `Block site: ${row.label}`,
        message: `$${row.spend.toFixed(2)} spend, ${row.events} events, ${row.botPct}% bots.`,
        action: 'Add to blocklist and paste into Mediago.',
        estimatedImpact: row.spend,
        entityKey: row.key,
      });
    }

    for (const rec of creativeReport.recommendations.filter((r) => r.severity === 'success').slice(0, 3)) {
      items.push({
        id: rec.id,
        severity: 'success',
        category: 'scale',
        title: rec.title,
        message: rec.message,
        action: rec.action,
        entityKey: rec.entityKey,
      });
    }

    for (const rec of creativeReport.recommendations.filter((r) => r.severity === 'danger').slice(0, 3)) {
      items.push({
        id: rec.id,
        severity: 'danger',
        category: 'pause',
        title: rec.title,
        message: rec.message,
        action: rec.action,
        entityKey: rec.entityKey,
      });
    }

    for (const row of campaignData.rows.filter((r) => r.cost > 20 && r.profit < 0).slice(0, 3)) {
      items.push({
        id: `pause-campaign-${row.campaignId}`,
        severity: 'warning',
        category: 'budget',
        title: `Review campaign: ${row.campaignName}`,
        message: `ROI ${row.roi.toFixed(1)}%, $${row.cost.toFixed(2)} spend, $${row.profit.toFixed(2)} profit.`,
        action: 'Reduce budget or pause underperforming placements.',
        estimatedImpact: Math.abs(row.profit),
        entityKey: row.campaignId,
      });
    }

    if (creativeReport.summary.wastedBotSpend && creativeReport.summary.wastedBotSpend > 5) {
      items.push({
        id: 'bot-waste',
        severity: 'info',
        category: 'general',
        title: 'Bot traffic wasting spend',
        message: `~$${creativeReport.summary.wastedBotSpend.toFixed(2)} allocated to bot visits. Enable "Exclude bots" for cleaner metrics.`,
        action: 'Review suspicious visits and block high-bot publishers.',
        estimatedImpact: creativeReport.summary.wastedBotSpend,
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        blockCandidates: placementReport.summary.killCount,
        scaleCandidates: placementReport.summary.scaleCount,
        totalDecisions: items.length,
      },
      items: items.slice(0, 15),
    };
  }
}
