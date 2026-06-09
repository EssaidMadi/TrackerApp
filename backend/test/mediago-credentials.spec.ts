import {
  buildMediagoBasicAuth,
  parseMediagoCredentials,
  sanitizeMediagoCredentialsForResponse,
} from '../src/platform-sync/mediago/mediago-credentials';

describe('mediago credentials', () => {
  it('uses base64 token for Basic auth', () => {
    const header = buildMediagoBasicAuth({
      apiTokenBase64: 'YWJjZGVmZzEyMw==',
    });
    expect(header).toBe('Basic YWJjZGVmZzEyMw==');
  });

  it('strips existing Basic prefix from base64 token', () => {
    const header = buildMediagoBasicAuth({
      apiTokenBase64: 'Basic YWJjZGVmZzEyMw==',
    });
    expect(header).toBe('Basic YWJjZGVmZzEyMw==');
  });

  it('base64-encodes raw token', () => {
    const header = buildMediagoBasicAuth({ apiToken: 'my-raw-token' });
    expect(header).toBe(`Basic ${Buffer.from('my-raw-token', 'utf8').toString('base64')}`);
  });

  it('parses credential aliases', () => {
    const parsed = parseMediagoCredentials({
      api_token_base64: 'abc',
      account_name: 'demo',
      timezone: 'utc8',
    });
    expect(parsed.apiTokenBase64).toBe('abc');
    expect(parsed.accountName).toBe('demo');
    expect(parsed.timezone).toBe('utc8');
  });

  it('masks tokens in API responses', () => {
    const out = sanitizeMediagoCredentialsForResponse({
      apiTokenBase64: 'secret',
      timezone: 'utc0',
    });
    expect(out.apiTokenBase64).toBe('••••••••');
    expect(out.timezone).toBe('utc0');
  });
});
