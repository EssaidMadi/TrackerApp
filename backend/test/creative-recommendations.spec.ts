import {
  buildCreativeRecommendations,
  scoreCreativeQuality,
  type CreativePerformanceRow,
} from '../src/analytics/creative-recommendations';

describe('creative recommendations', () => {
  const benchmarks = {
    avgCr: 5,
    avgBotPct: 20,
    avgEpc: 0.5,
    totalVisits: 1000,
    minSample: 15,
  };

  const row = (overrides: Partial<CreativePerformanceRow>): CreativePerformanceRow => ({
    key: 'k',
    label: 'l',
    visits: 50,
    uniqueVisitors: 40,
    botVisits: 5,
    humanVisits: 45,
    botPct: '10.0',
    convertingVisits: 5,
    conversions: 5,
    cr: '10.00',
    crNum: 10,
    revenue: 25,
    epc: 0.5,
    quality: 'good',
    ...overrides,
  });

  it('scores excellent when CR well above average', () => {
    expect(scoreCreativeQuality(50, 8, 15, benchmarks)).toBe('excellent');
  });

  it('recommends scaling top image', () => {
    const recs = buildCreativeRecommendations(
      [row({ key: 'img1', label: 'creative-1', crNum: 10 })],
      [],
      [],
      benchmarks,
    );
    expect(recs.some((r) => r.category === 'image' && r.severity === 'success')).toBe(true);
  });
});
