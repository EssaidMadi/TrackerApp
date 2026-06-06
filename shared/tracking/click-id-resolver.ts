/**
 * Click ID priority: gclid > fbclid > click_id > tk-cid > subid
 * Copied from poc-single-lp FlowUtils.ts
 */
export function resolvePrimaryClickId(params: {
  gclid?: string | null;
  fbclid?: string | null;
  clickId?: string | null;
  tkCid?: string | null;
  subid?: string | null;
}): string | null {
  if (params.gclid) return params.gclid;
  if (params.fbclid) return params.fbclid;
  if (params.clickId) return params.clickId;
  if (params.tkCid) return params.tkCid;
  if (params.subid) return params.subid;
  return null;
}
