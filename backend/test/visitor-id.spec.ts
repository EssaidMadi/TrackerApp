import {
  buildVisitorCookie,
  fingerprintVisitorId,
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

  it('fingerprints same campaign+ip+ua to same visitor id', () => {
    const a = fingerprintVisitorId('camp-1', '41.200.1.23', 'Mozilla/5.0 Chrome');
    const b = fingerprintVisitorId('camp-1', '41.200.1.23', 'Mozilla/5.0 Chrome');
    const c = fingerprintVisitorId('camp-1', '92.92.128.234', 'Mozilla/5.0 Chrome');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^fp_/);
  });
});
