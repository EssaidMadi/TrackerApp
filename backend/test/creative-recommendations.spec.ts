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
    totalEvents: 50,
    metricLabel: 'Call Click rate',
    totalSpend: 100,
    avgCpv: 0.1,
    avgCostPerEvent: 2,
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
    spend: 10,
    cpv: 0.2,
    costPerEvent: 2,
    profit: 15,
    quality: 'good',
    ...overrides,
  });

  it('scores excellent when CR well above average', () => {
    expect(scoreCreativeQuality(50, 8, 15, benchmarks)).toBe('excellent');
  });

  it('recommends scaling top image with event metric label', () => {
    const recs = buildCreativeRecommendations(
      [row({ key: 'img1', label: 'creative-1', crNum: 10 })],
      [],
      [],
      benchmarks,
    );
    const scale = recs.find((r) => r.category === 'image' && r.severity === 'success');
    expect(scale).toBeDefined();
    expect(scale?.message).toContain('Call Click rate');
    expect(scale?.message).toContain('spend');
  });

  it('returns zero-event diagnostic when no events recorded', () => {
    const recs = buildCreativeRecommendations([], [], [], {
      ...benchmarks,
      totalEvents: 0,
    });
    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe('no-events');
    expect(recs[0].message).toContain('LP Funnel');
  });

  it('returns sent-mode diagnostic when no sent postbacks', () => {
    const recs = buildCreativeRecommendations([], [], [], {
      ...benchmarks,
      totalEvents: 0,
    }, 'sent');
    expect(recs[0].message).toContain('Recorded');
  });

  it('warns on spend with no events', () => {
    const recs = buildCreativeRecommendations(
      [row({ key: 'img-waste', label: 'waste-img', conversions: 0, convertingVisits: 0, crNum: 0, cr: '0.00', spend: 20 })],
      [],
      [],
      benchmarks,
    );
    expect(recs.some((r) => r.id.startsWith('waste-spend-image-'))).toBe(true);
  });
});
