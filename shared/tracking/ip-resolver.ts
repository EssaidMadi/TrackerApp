const LOOPBACK = new Set(['127.0.0.1', '::1', '0:0:0:0:0:0:0:1']);

export function normalizeIp(ip: string): string {
  const clean = ip.trim().replace(/^::ffff:/i, '');
  if (clean === '::1' || clean === '0:0:0:0:0:0:0:1') return '127.0.0.1';
  return clean;
}

export function isPrivateOrLoopback(ip?: string): boolean {
  if (!ip) return true;
  const n = normalizeIp(ip);
  if (LOOPBACK.has(n)) return true;
  if (n.startsWith('10.')) return true;
  if (n.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(n)) return true;
  if (n.startsWith('fe80:') || n.startsWith('fc') || n.startsWith('fd')) return true;
  return false;
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseForwardedChain(header?: string): string[] {
  if (!header) return [];
  return header.split(',').map((part) => part.trim()).filter(Boolean);
}

/** Pick the first public IP in X-Forwarded-For, else the left-most client IP */
function pickForwardedIp(header?: string): string | undefined {
  const chain = parseForwardedChain(header);
  if (chain.length === 0) return undefined;

  for (const ip of chain) {
    const normalized = normalizeIp(ip);
    if (!isPrivateOrLoopback(normalized)) return normalized;
  }

  return normalizeIp(chain[0]);
}

export function resolveClientIp(options: {
  headers: Record<string, string | string[] | undefined>;
  fallbackIp?: string;
  socketIp?: string;
  devOverrideIp?: string;
}): string | undefined {
  const candidates = [
    options.devOverrideIp,
    getHeader(options.headers, 'cf-connecting-ip'),
    getHeader(options.headers, 'true-client-ip'),
    getHeader(options.headers, 'x-real-ip'),
    getHeader(options.headers, 'x-client-ip'),
    pickForwardedIp(getHeader(options.headers, 'x-forwarded-for')),
    options.fallbackIp,
    options.socketIp,
  ];

  for (const ip of candidates) {
    if (!ip) continue;
    const normalized = normalizeIp(ip);
    if (normalized) return normalized;
  }

  return undefined;
}
