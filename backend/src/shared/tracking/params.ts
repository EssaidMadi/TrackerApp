export interface NetworkParams {
  tracking_id?: string;
  external_click_id?: string;
  fbclid?: string;
  click_id?: string;
  subid?: string;
  ad_id?: string;
  ad_title?: string;
  campaign_external_id?: string;
  publisher_name?: string;
  site_id?: string;
  content_name?: string;
  platform?: string;
  asset_id?: string;
}

export interface TrackingParams extends NetworkParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  utm_angle: string;
  utm_adset: string;
  gclid: string;
  referrer: string;
}

export interface LeadEventData {
  user_email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  is_test_lead?: boolean;
}

const LEAD_TRACKING_ALLOWED_EMAIL = 'lead@hipto.com';

/** Mediago/Voluum macros left unreplaced when URL is opened directly in a browser */
export function isUnreplacedMacro(value?: string): boolean {
  if (!value) return false;
  return /^\$\{[^}]+\}$/.test(value.trim());
}

export function sanitizeParam(value?: string): string | undefined {
  if (!value || isUnreplacedMacro(value)) return undefined;
  return value;
}

/** Normalize query keys to lowercase for consistent lookup */
function normalizeQuery(
  query: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(query)) {
    const v = Array.isArray(val) ? val[0] : val;
    if (v) out[key.toLowerCase()] = v;
  }
  return out;
}

export function getTrackingParamsFromQuery(
  query: Record<string, string | string[] | undefined>,
  tkCid?: string | null,
): TrackingParams {
  const q = normalizeQuery(query);
  const get = (...keys: string[]) => {
    for (const k of keys) {
      if (q[k]) return q[k];
    }
    return '';
  };

  const raw = (...keys: string[]) => sanitizeParam(get(...keys));

  const networkClickId = raw('click_id', 'tracking_id', 'subid');
  const trackingId = raw('tracking_id') || networkClickId;

  const gclid =
    raw('gclid') ||
    raw('fbclid') ||
    networkClickId ||
    sanitizeParam(tkCid || undefined) ||
    raw('subid') ||
    '';

  return {
    utm_source: raw('utm_source') || '',
    utm_medium: raw('utm_medium') || '',
    utm_campaign: raw('utm_campaign', 'campaignid', 'campaign_id') || '',
    utm_term: raw('utm_term', 'assetid', 'asset_id') || '',
    utm_content: raw('utm_content', 'adtitle', 'ad_title') || '',
    utm_angle: raw('utm_angle') || '',
    utm_adset: raw('utm_adset') || '',
    tracking_id: trackingId,
    external_click_id: networkClickId,
    fbclid: raw('fbclid'),
    click_id: raw('click_id'),
    subid: raw('subid'),
    ad_id: raw('ad_id', 'adid'),
    ad_title: raw('ad_title', 'adtitle'),
    campaign_external_id: raw('campaign_external_id', 'campaignid', 'campaign_id'),
    publisher_name: raw('publisher_name', 'publishername'),
    site_id: raw('site_id', 'siteid'),
    content_name: raw('content_name', 'contentname'),
    platform: raw('platform'),
    asset_id: raw('asset_id', 'assetid'),
    gclid,
    referrer: raw('referrer') || '',
  };
}

export function extractRawParams(
  query: Record<string, string | string[] | undefined>,
): Record<string, string> {
  return normalizeQuery(query);
}

export function isTestLeadFromQuestionnaireData(data?: LeadEventData): boolean {
  if (!data) return false;
  if (data.is_test_lead === true) return true;

  const email = (data.user_email || '').trim().toLowerCase();
  if (email === LEAD_TRACKING_ALLOWED_EMAIL) return false;

  const firstName = (data.firstName || '').trim().toLowerCase();
  const lastName = (data.lastName || '').trim().toLowerCase();

  const isTestEmail =
    email.includes('@hipto.com') ||
    email.includes('test') ||
    email.includes('fake') ||
    email.includes('demo') ||
    email.includes('qa');

  const isTestName =
    firstName.includes('test') ||
    firstName.includes('fake') ||
    firstName.includes('demo') ||
    firstName.includes('qa') ||
    lastName.includes('test') ||
    lastName.includes('fake') ||
    lastName.includes('demo') ||
    lastName.includes('qa');

  return isTestEmail || isTestName;
}
