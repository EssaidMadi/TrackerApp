import type { Request } from 'express';
import { extractVisitorContext } from '../shared/tracking/request-context';
import { parseVisitorIdFromCookie } from '../common/utils/visitor-id';

function pickQuery(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = query[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export function buildVisitorContextFromRequest(
  req: Request,
  query?: Record<string, string | string[] | undefined>,
) {
  const devOverride =
    process.env.ALLOW_TEST_IP_OVERRIDE === 'true'
      ? pickQuery(query || (req.query as Record<string, string | string[] | undefined>), '__test_ip')
      : undefined;

  const base = extractVisitorContext(req.headers, {
    fallbackIp: req.ip,
    socketIp: req.socket?.remoteAddress,
    devOverrideIp: devOverride,
  });

  const cookieVisitorId = parseVisitorIdFromCookie(req.headers.cookie);
  const queryVisitorId = pickQuery(
    query || (req.query as Record<string, string | string[] | undefined>),
    'tk_vid',
  );

  return {
    ...base,
    visitorId: queryVisitorId || cookieVisitorId,
  };
}
