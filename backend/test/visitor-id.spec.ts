import {
  buildVisitorCookie,
  generateVisitorId,
  parseVisitorIdFromCookie,
} from '../src/common/utils/visitor-id';

describe('visitor-id', () => {
  it('parses tk-vid from cookie header', () => {
    expect(parseVisitorIdFromCookie('tk-cid=abc; tk-vid=v_abc123; path=/')).toBe('v_abc123');
  });

  it('generates stable-format visitor ids', () => {
    expect(generateVisitorId()).toMatch(/^v_[a-f0-9]{16}$/);
  });

  it('builds long-lived visitor cookie', () => {
    expect(buildVisitorCookie('v_test')).toContain('tk-vid=v_test');
    expect(buildVisitorCookie('v_test')).toContain('Max-Age=31536000');
  });
});
