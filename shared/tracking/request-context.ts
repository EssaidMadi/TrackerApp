import { isPrivateOrLoopback, resolveClientIp } from './ip-resolver';

export interface VisitorHeaders {
  acceptLanguage?: string;
  acceptEncoding?: string;
  secChUa?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
  secFetchDest?: string;
  secFetchMode?: string;
  secFetchSite?: string;
  xForwardedFor?: string;
  cfConnectingIp?: string;
  xRealIp?: string;
  via?: string;
}

export interface VisitorContext {
  ipAddress?: string;
  isLocalIp?: boolean;
  userAgent?: string;
  referrer?: string;
  /** Stable cross-visit ID from tk-vid cookie */
  visitorId?: string;
  headers: VisitorHeaders;
}

const HEADER_KEYS: Array<[keyof VisitorHeaders, string]> = [
  ['acceptLanguage', 'accept-language'],
  ['acceptEncoding', 'accept-encoding'],
  ['secChUa', 'sec-ch-ua'],
  ['secChUaMobile', 'sec-ch-ua-mobile'],
  ['secChUaPlatform', 'sec-ch-ua-platform'],
  ['secFetchDest', 'sec-fetch-dest'],
  ['secFetchMode', 'sec-fetch-mode'],
  ['secFetchSite', 'sec-fetch-site'],
  ['xForwardedFor', 'x-forwarded-for'],
  ['cfConnectingIp', 'cf-connecting-ip'],
  ['xRealIp', 'x-real-ip'],
  ['via', 'via'],
];

export function extractVisitorContext(
  headers: Record<string, string | string[] | undefined>,
  options?: {
    fallbackIp?: string;
    socketIp?: string;
    devOverrideIp?: string;
  },
): VisitorContext {
  const getHeader = (name: string): string | undefined => {
    const value = headers[name];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const visitorHeaders: VisitorHeaders = {};
  for (const [key, headerName] of HEADER_KEYS) {
    const value = getHeader(headerName);
    if (value) visitorHeaders[key] = value;
  }

  const ipAddress = resolveClientIp({
    headers,
    fallbackIp: options?.fallbackIp,
    socketIp: options?.socketIp,
    devOverrideIp: options?.devOverrideIp,
  });

  return {
    ipAddress,
    isLocalIp: isPrivateOrLoopback(ipAddress),
    userAgent: getHeader('user-agent'),
    referrer: getHeader('referer') || getHeader('referrer'),
    headers: visitorHeaders,
  };
}

export function inferConnectionType(
  deviceLabel: string,
  mobileFromIp?: boolean,
  secChUaMobile?: string,
): string {
  if (mobileFromIp) return 'Mobile';
  if (secChUaMobile === '?1') return 'Mobile';
  if (deviceLabel === 'Mobile phone' || deviceLabel === 'Tablet') return 'Mobile';
  if (deviceLabel === 'Desktop') return 'Wired';
  return 'Unknown';
}
