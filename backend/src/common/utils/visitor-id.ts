import { createHash, randomUUID } from 'crypto';

export const VISITOR_COOKIE_NAME = 'tk-vid';

export function parseVisitorIdFromCookie(cookieHeader?: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function generateVisitorId(): string {
  return `v_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/** Stable per campaign + IP + browser — used when cookie is missing */
export function fingerprintVisitorId(
  campaignId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
): string {
  const raw = `${campaignId}|${ipAddress || ''}|${(userAgent || '').slice(0, 256)}`;
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `fp_${hash}`;
}

export function buildVisitorCookie(visitorId: string, secure = false): string {
  const maxAge = 365 * 24 * 60 * 60;
  const secureFlag = secure ? '; Secure' : '';
  return `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secureFlag}`;
}
