export type MediagoCredentials = {
  apiTokenBase64?: string;
  apiToken?: string;
  apiTokenRaw?: string;
  /** @deprecated legacy stub field */
  apiKey?: string;
  accountName?: string;
  timezone?: string;
};

export function parseMediagoCredentials(raw: Record<string, unknown>): MediagoCredentials {
  return {
    apiTokenBase64: String(raw.apiTokenBase64 || raw.api_token_base64 || '').trim() || undefined,
    apiToken: String(raw.apiToken || raw.api_token || raw.apiTokenRaw || '').trim() || undefined,
    apiTokenRaw: String(raw.apiTokenRaw || '').trim() || undefined,
    apiKey: String(raw.apiKey || '').trim() || undefined,
    accountName: String(raw.accountName || raw.account_name || '').trim() || undefined,
    timezone: String(raw.timezone || 'utc0').trim() || 'utc0',
  };
}

/** Build `Authorization: Basic …` header value for Mediago authentication API. */
export function buildMediagoBasicAuth(creds: MediagoCredentials): string {
  const b64 = (creds.apiTokenBase64 || '').trim();
  const raw = (creds.apiToken || creds.apiTokenRaw || creds.apiKey || '').trim();

  if (b64) {
    const token = b64.replace(/^Basic\s+/i, '');
    return `Basic ${token}`;
  }
  if (raw) {
    return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
  }
  throw new Error('Mediago API token is required (paste Base64-encoded token or raw token)');
}

export function sanitizeMediagoCredentialsForResponse(
  creds: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = parseMediagoCredentials(creds);
  const out: Record<string, unknown> = { ...creds };
  if (parsed.apiTokenBase64) out.apiTokenBase64 = '••••••••';
  if (parsed.apiToken || parsed.apiTokenRaw) {
    out.apiToken = '••••••••';
    out.apiTokenRaw = '••••••••';
  }
  if (parsed.apiKey) out.apiKey = '••••••••';
  return out;
}
