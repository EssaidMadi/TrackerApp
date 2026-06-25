import { PlacementAnalyticsService } from '../src/analytics/placement-analytics.service';

describe('PlacementAnalyticsService scoring', () => {
  const service = new PlacementAnalyticsService({} as never);

  it('kills placements with spend and no events', () => {
    expect(service.scoreVerdict(15, 0, 0, 5, 10, -100)).toBe('kill');
  });

  it('scales strong performers', () => {
    expect(service.scoreVerdict(20, 5, 8, 5, 15, 30)).toBe('scale');
  });

  it('watches mediocre placements', () => {
    expect(service.scoreVerdict(5, 2, 4, 5, 20, 10)).toBe('watch');
  });
});
