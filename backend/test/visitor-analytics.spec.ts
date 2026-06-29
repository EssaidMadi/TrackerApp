import { getVisitStats } from '../src/analytics/visit-stats';

describe('getVisitStats', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRaw.mockResolvedValue([
      { visits: 5, new_visitors: 3, unique_visits: 3 },
    ]);
  });

  it('returns visit and unique visitor counts', async () => {
    const stats = await getVisitStats(prisma as never, 'camp-1');

    expect(stats.visits).toBe(5);
    expect(stats.newVisitors).toBe(3);
    expect(stats.returningVisitors).toBe(2);
    expect(stats.uniqueVisits).toBe(3);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});
