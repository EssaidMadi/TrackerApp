import { randomUUID } from 'crypto';

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

export function buildVisitorCookie(visitorId: string, secure = false): string {
  const maxAge = 365 * 24 * 60 * 60;
  const secureFlag = secure ? '; Secure' : '';
  return `${VISITOR_COOKIE_NAME}=${encodeURIComponent(visitorId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secureFlag}`;
}
