import { allocateSpend, computeBotWastedSpend, computeRoi } from '../src/analytics/analytics-spend.util';

describe('analytics spend utils', () => {
  it('allocates spend proportionally', () => {
    expect(allocateSpend(100, 25, 100)).toBe(25);
  });

  it('computes bot wasted spend', () => {
    expect(computeBotWastedSpend(100, 20, 100)).toBe(20);
  });

  it('computes ROI', () => {
    expect(computeRoi(150, 100)).toBe(50);
  });
});
