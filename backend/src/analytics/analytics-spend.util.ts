import type { PrismaService } from '../prisma/prisma.service';
import type { VisitAnalyticsFilters } from './visit-filters';

export async function fetchCampaignSpend(
  prisma: PrismaService,
  filters: VisitAnalyticsFilters,
  campaignIds: string[],
): Promise<number> {
  if (!filters.from || campaignIds.length === 0) return 0;

  const fromDate = new Date(filters.from);
  const toDate = filters.to ? new Date(filters.to) : new Date();

  const agg = await prisma.campaignSpendSnapshot.aggregate({
    where: {
      campaignId: { in: campaignIds },
      date: { gte: fromDate, lte: toDate },
    },
    _sum: { spend: true },
  });

  return agg._sum.spend || 0;
}

export function allocateSpend(totalSpend: number, visits: number, totalVisits: number): number {
  if (totalVisits <= 0 || totalSpend <= 0) return 0;
  return totalSpend * (visits / totalVisits);
}

export function computeBotWastedSpend(
  totalSpend: number,
  botVisits: number,
  totalVisits: number,
): number {
  return allocateSpend(totalSpend, botVisits, totalVisits);
}

export function computeRoi(revenue: number, spend: number): number {
  if (spend <= 0) return revenue > 0 ? 100 : 0;
  return ((revenue - spend) / spend) * 100;
}

export function computeCpa(spend: number, events: number): number {
  return events > 0 ? spend / events : 0;
}
