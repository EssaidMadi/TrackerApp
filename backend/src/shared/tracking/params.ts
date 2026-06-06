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

import {
  DEFAULT_PARAM_MAPPINGS,
  resolveParamsFromMappings,
  type ParamMapping,
} from './param-mapping';

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
  mappings: ParamMapping[] = DEFAULT_PARAM_MAPPINGS,
): TrackingParams {
  const resolved = resolveParamsFromMappings(query, mappings, tkCid);

  return {
    utm_source: resolved.utm_source || '',
    utm_medium: resolved.utm_medium || '',
    utm_campaign: resolved.utm_campaign || '',
    utm_term: resolved.utm_term || '',
    utm_content: resolved.utm_content || '',
    utm_angle: resolved.utm_angle || '',
    utm_adset: resolved.utm_adset || '',
    tracking_id: resolved.tracking_id || '',
    external_click_id: resolved.external_click_id || '',
    fbclid: resolved.fbclid,
    click_id: resolved.click_id,
    subid: resolved.subid,
    ad_id: resolved.ad_id,
    ad_title: resolved.ad_title,
    campaign_external_id: resolved.campaign_external_id,
    publisher_name: resolved.publisher_name,
    site_id: resolved.site_id,
    content_name: resolved.content_name,
    platform: resolved.platform,
    asset_id: resolved.asset_id,
    gclid: resolved.gclid || '',
    referrer: resolved.referrer || '',
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
