import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type VisitStats = {
  visits: number;
  uniqueVisits: number;
  newVisitors: number;
  returningVisitors: number;
};

export async function getVisitStats(
  prisma: PrismaService,
  campaignId?: string,
  from?: string,
  to?: string,
): Promise<VisitStats> {
  const where: Prisma.ClickWhereInput = {
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

  const [visits, newVisitors, visitorGroups, legacyVisits] = await Promise.all([
    prisma.click.count({ where }),
    prisma.click.count({ where: { ...where, isNewVisitor: true } }),
    prisma.click.groupBy({
      by: ['visitorId'],
      where: { ...where, visitorId: { not: null } },
    }),
    prisma.click.count({ where: { ...where, visitorId: null } }),
  ]);

  const uniqueVisits = visitorGroups.length + legacyVisits;
  const returningVisitors = Math.max(0, visits - newVisitors);

  return { visits, uniqueVisits, newVisitors, returningVisitors };
}
