import type { CampaignReportRow, EventColumnDef } from './api';

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function countLabelFromSlug(slug: string, displayLabel: string): string {
  if (displayLabel.endsWith(' revenue')) {
    return displayLabel.slice(0, -' revenue'.length);
  }
  return displayLabel || slug;
}

/** Normalize API rows — supports older backends missing newer metric fields. */
export function normalizeCampaignRow(raw: Partial<CampaignReportRow> & Record<string, unknown>): CampaignReportRow {
  const visits = num(raw.visits);
  const conversions = num(raw.conversions);
  const cost = num(raw.cost);
  const revenue = num(raw.revenue);
  const profit = num(raw.profit, revenue - cost);
  const platformClicks = num(raw.platformClicks);

  return {
    campaignId: String(raw.campaignId ?? ''),
    campaignName: String(raw.campaignName ?? ''),
    marker: String(raw.marker ?? ''),
    cpc: num(raw.cpc, platformClicks > 0 ? cost / platformClicks : 0),
    visits,
    uniqueVisits: num(raw.uniqueVisits),
    suspiciousVisits: num(raw.suspiciousVisits),
    suspiciousPct: String(raw.suspiciousPct ?? '0.00'),
    conversions,
    cost,
    revenue,
    profit,
    roi: num(raw.roi, cost > 0 ? ((revenue - cost) / cost) * 100 : 0),
    cv: num(raw.cv, visits > 0 ? (conversions / visits) * 100 : 0),
    epv: num(raw.epv, visits > 0 ? revenue / visits : 0),
    cpv: num(raw.cpv, visits > 0 ? cost / visits : 0),
    ecpc: num(raw.ecpc, conversions > 0 ? cost / conversions : 0),
    errors: num(raw.errors),
    txTransfo: num(raw.txTransfo),
    impressions: num(raw.impressions),
    platformClicks,
    countByEvent: (raw.countByEvent as Record<string, number> | undefined) ?? {},
    revenueByEvent: (raw.revenueByEvent as Record<string, number> | undefined) ?? {},
  };
}

/** Normalize event column defs — supports legacy `{ slug, displayLabel }` shape. */
export function normalizeEventColumn(raw: Record<string, unknown>): EventColumnDef {
  const slug = String(raw.slug ?? '');
  const legacyLabel = typeof raw.displayLabel === 'string' ? raw.displayLabel : '';
  const countLabel =
    typeof raw.countLabel === 'string' && raw.countLabel
      ? raw.countLabel
      : countLabelFromSlug(slug, legacyLabel);
  const revenueLabel =
    typeof raw.revenueLabel === 'string' && raw.revenueLabel
      ? raw.revenueLabel
      : legacyLabel || `${countLabel} revenue`;

  return { slug, countLabel, revenueLabel };
}

export function normalizeCampaignReport(report: {
  rows: Array<Partial<CampaignReportRow> & Record<string, unknown>>;
  eventColumns: Array<Record<string, unknown>>;
}): { rows: CampaignReportRow[]; eventColumns: EventColumnDef[] } {
  return {
    rows: (report.rows ?? []).map(normalizeCampaignRow),
    eventColumns: (report.eventColumns ?? []).map(normalizeEventColumn),
  };
}
