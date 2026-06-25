import { TargetsService } from '../src/targets/targets.service';

describe('TargetsService pacing', () => {
  const prisma = {
    campaignTarget: { findUnique: jest.fn() },
    campaignSpendSnapshot: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { spend: 50 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    conversion: {
      aggregate: jest.fn().mockResolvedValue({ _count: { _all: 10 }, _sum: { revenue: 100 } }),
    },
  };

  const service = new TargetsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.campaignTarget.findUnique.mockResolvedValue({
      campaignId: 'c1',
      dailyBudget: 100,
      cpaTarget: 5,
      roasTarget: 2,
      currency: 'USD',
    });
  });

  it('computes spend and budget percentage', async () => {
    const pacing = await service.getPacing('c1');
    expect(pacing.spendSoFar).toBe(50);
    expect(pacing.budgetPct).toBe(50);
    expect(pacing.cpaActual).toBe(5);
    expect(pacing.roasActual).toBe(2);
  });
});
