import { detectBot } from '../src/shared/tracking/bot-detector';

describe('detectBot', () => {
  it('flags known crawlers', () => {
    const result = detectBot({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' });
    expect(result.isBot).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('flags missing user agent', () => {
    const result = detectBot({});
    expect(result.isBot).toBe(true);
    expect(result.reasons).toContain('missing_user_agent');
  });

  it('treats normal mobile chrome as human', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    const result = detectBot({
      userAgent: ua,
      acceptLanguage: 'fr-FR,fr;q=0.9',
      hasSecFetchHeaders: true,
    });
    expect(result.isBot).toBe(false);
  });

  it('increases score for proxy and hosting IPs', () => {
    const result = detectBot({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      acceptLanguage: 'en-US',
      isProxy: true,
      isHosting: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(50);
  });
});
