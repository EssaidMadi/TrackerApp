import { getVisitStats } from '../src/analytics/visit-stats';

describe('getVisitStats', () => {
  const prisma = {
    click: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.click.count.mockImplementation(({ where }: { where: { isNewVisitor?: boolean; visitorId?: unknown } }) => {
      if (where?.isNewVisitor === true) return Promise.resolve(3);
      if (where?.visitorId === null) return Promise.resolve(1);
      return Promise.resolve(5);
    });
    prisma.click.groupBy.mockResolvedValue([{ visitorId: 'v1' }, { visitorId: 'v2' }]);
  });

  it('returns visit and unique visitor counts', async () => {
    const stats = await getVisitStats(prisma as never, 'camp-1');

    expect(stats.visits).toBe(5);
    expect(stats.newVisitors).toBe(3);
    expect(stats.returningVisitors).toBe(2);
    expect(stats.uniqueVisits).toBe(3);
  });
});
