import { resolveClientIp, isPrivateOrLoopback } from '../src/shared/tracking/ip-resolver';
import { isUnreplacedMacro, sanitizeParam } from '../src/shared/tracking/params';

describe('resolveClientIp', () => {
  it('prefers Cloudflare and proxy headers over socket IP', () => {
    const ip = resolveClientIp({
      headers: {
        'cf-connecting-ip': '109.52.221.77',
        'x-forwarded-for': '127.0.0.1',
      },
      fallbackIp: '::1',
      socketIp: '::1',
    });
    expect(ip).toBe('109.52.221.77');
  });

  it('normalizes IPv6 loopback to 127.0.0.1', () => {
    const ip = resolveClientIp({
      headers: {},
      fallbackIp: '::1',
    });
    expect(ip).toBe('127.0.0.1');
    expect(isPrivateOrLoopback(ip)).toBe(true);
  });

  it('uses dev override IP when provided', () => {
    const ip = resolveClientIp({
      headers: {},
      fallbackIp: '::1',
      devOverrideIp: '2a01:e0a:8f3:c350:1495:1ba7:8ad1:c5aa',
    });
    expect(ip).toBe('2a01:e0a:8f3:c350:1495:1ba7:8ad1:c5aa');
  });
});

describe('macro sanitization', () => {
  it('ignores unreplaced Mediago macros', () => {
    expect(isUnreplacedMacro('${TRACKING_ID}')).toBe(true);
    expect(sanitizeParam('${PUBLISHER_NAME}')).toBeUndefined();
    expect(sanitizeParam('msn.com')).toBe('msn.com');
  });
});
