import { normalizeEventType } from '../src/common/utils/normalize-event-type';

describe('normalizeEventType', () => {
  it('normalizes ViewCONTENT to viewcontent', () => {
    expect(normalizeEventType('ViewCONTENT')).toBe('viewcontent');
  });

  it('defaults empty to lead', () => {
    expect(normalizeEventType('')).toBe('lead');
  });
});
