import { ConversionMethod, TrackingMode } from '@prisma/client';
import type { ParamMapping } from '../shared/tracking/param-mapping';
import { DEFAULT_PARAM_MAPPINGS } from '../shared/tracking/param-mapping';
import { DEFAULT_MEDIAGO_POSTBACK_URL } from '../shared/tracking/postback-url';

const MEDIAGO_CLICK_TEMPLATE =
  '{clickUrl}?adid=${AD_ID}&adtitle=${AD_TITLE}&campaignid=${CAMPAIGN_ID}&publishername=${PUBLISHER_NAME}&siteid=${SITE_ID}&contentname=${CONTENT_NAME}&platform=${PLATFORM}&assetid=${ASSET_ID}&click_id=${TRACKING_ID}';

const OUTBRAIN_MAPPINGS: ParamMapping[] = [
  { internalField: 'tracking_id', displayLabel: 'Outbrain Click ID', externalKeys: ['click_id', 'ob_click_id', 'tracking_id'], urlMacro: '${OB_CLICK_ID}', showInReports: true, priority: 1 },
  { internalField: 'utm_source', displayLabel: 'UTM Source', externalKeys: ['utm_source'], showInReports: true, priority: 2 },
  { internalField: 'utm_campaign', displayLabel: 'Campaign', externalKeys: ['utm_campaign', 'campaignid'], showInReports: true, priority: 3 },
];

const FACEBOOK_MAPPINGS: ParamMapping[] = [
  { internalField: 'fbclid', displayLabel: 'FBCLID', externalKeys: ['fbclid'], showInReports: true, priority: 1 },
  { internalField: 'utm_source', displayLabel: 'UTM Source', externalKeys: ['utm_source'], showInReports: true, priority: 2 },
  { internalField: 'utm_medium', displayLabel: 'UTM Medium', externalKeys: ['utm_medium'], showInReports: false, priority: 3 },
  { internalField: 'utm_campaign', displayLabel: 'UTM Campaign', externalKeys: ['utm_campaign'], showInReports: true, priority: 4 },
  { internalField: 'utm_content', displayLabel: 'UTM Content', externalKeys: ['utm_content'], showInReports: true, priority: 5 },
  { internalField: 'utm_term', displayLabel: 'UTM Term', externalKeys: ['utm_term'], showInReports: false, priority: 6 },
];

const GOOGLE_MAPPINGS: ParamMapping[] = [
  { internalField: 'gclid', displayLabel: 'GCLID', externalKeys: ['gclid'], showInReports: true, priority: 1 },
  { internalField: 'utm_source', displayLabel: 'UTM Source', externalKeys: ['utm_source'], showInReports: true, priority: 2 },
  { internalField: 'utm_medium', displayLabel: 'UTM Medium', externalKeys: ['utm_medium'], showInReports: false, priority: 3 },
  { internalField: 'utm_campaign', displayLabel: 'UTM Campaign', externalKeys: ['utm_campaign'], showInReports: true, priority: 4 },
  { internalField: 'utm_term', displayLabel: 'UTM Term', externalKeys: ['utm_term'], showInReports: true, priority: 5 },
];

export interface SeedProfile {
  slug: string;
  name: string;
  trackingModeDefault: TrackingMode;
  clickUrlTemplate: string | null;
  directAdUrlTemplate: string | null;
  paramMappings: ParamMapping[];
  conversionMethod: ConversionMethod;
  postbackDefaults: Record<string, unknown>;
  setupNote: string;
  isSystem: boolean;
}

export const SYSTEM_TRAFFIC_SOURCE_PROFILES: SeedProfile[] = [
  {
    slug: 'mediago',
    name: 'Mediago',
    trackingModeDefault: TrackingMode.redirect,
    clickUrlTemplate: MEDIAGO_CLICK_TEMPLATE,
    directAdUrlTemplate: null,
    paramMappings: DEFAULT_PARAM_MAPPINGS,
    conversionMethod: ConversionMethod.mediago_s2s,
    postbackDefaults: {
      mediagoEnabled: true,
      mediagoConversionType: 10,
      mediagoAccountName: '',
      postbackUrlTemplate: DEFAULT_MEDIAGO_POSTBACK_URL,
      facebookEnabled: false,
      googleEnabled: false,
    },
    setupNote: 'Put the redirect Click URL in Mediago. User clicks → tracker records visit → redirects to LP.',
    isSystem: true,
  },
  {
    slug: 'native',
    name: 'Native (generic)',
    trackingModeDefault: TrackingMode.redirect,
    clickUrlTemplate: MEDIAGO_CLICK_TEMPLATE,
    directAdUrlTemplate: null,
    paramMappings: DEFAULT_PARAM_MAPPINGS,
    conversionMethod: ConversionMethod.mediago_s2s,
    postbackDefaults: {
      mediagoEnabled: true,
      mediagoConversionType: 10,
      mediagoAccountName: '',
      postbackUrlTemplate: DEFAULT_MEDIAGO_POSTBACK_URL,
      facebookEnabled: false,
      googleEnabled: false,
    },
    setupNote: 'Put the redirect Click URL in your native ad network tracking field.',
    isSystem: true,
  },
  {
    slug: 'outbrain',
    name: 'Outbrain',
    trackingModeDefault: TrackingMode.redirect,
    clickUrlTemplate: '{clickUrl}?click_id=${OB_CLICK_ID}&utm_source=outbrain',
    directAdUrlTemplate: null,
    paramMappings: OUTBRAIN_MAPPINGS,
    conversionMethod: ConversionMethod.outbrain_s2s,
    postbackDefaults: {
      mediagoEnabled: false,
      facebookEnabled: false,
      googleEnabled: false,
      postbackUrlTemplate:
        'https://tr.outbrain.com/pixel?ob_click_id={externalid}&marketerId=YOUR_ID&revenue={payout}',
      outbrainPostbackUrl: 'https://tr.outbrain.com/pixel?ob_click_id={tracking_id}&marketerId=YOUR_ID',
    },
    setupNote: 'Put the redirect Click URL in Outbrain. Uses OB_CLICK_ID macro.',
    isSystem: true,
  },
  {
    slug: 'facebook',
    name: 'Facebook',
    trackingModeDefault: TrackingMode.direct,
    clickUrlTemplate: null,
    directAdUrlTemplate:
      '{destinationUrl}?utm_source=facebook&utm_medium=paid_social&utm_campaign={campaignName}',
    paramMappings: FACEBOOK_MAPPINGS,
    conversionMethod: ConversionMethod.facebook_capi,
    postbackDefaults: {
      mediagoEnabled: false,
      facebookEnabled: true,
      googleEnabled: false,
      requiredMetadata: ['email', 'fbp', 'fbc'],
      postbackUrlTemplate: 'POST https://graph.facebook.com/v21.0/{pixelId}/events (Conversions API — configure pixel + token on campaign)',
    },
    setupNote:
      'Put the Direct Ad URL in Facebook. Facebook adds fbclid automatically. Add the LP script to your landing page.',
    isSystem: true,
  },
  {
    slug: 'google',
    name: 'Google Ads',
    trackingModeDefault: TrackingMode.direct,
    clickUrlTemplate: null,
    directAdUrlTemplate: '{destinationUrl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignName}',
    paramMappings: GOOGLE_MAPPINGS,
    conversionMethod: ConversionMethod.google_offline,
    postbackDefaults: {
      mediagoEnabled: false,
      facebookEnabled: false,
      googleEnabled: true,
      postbackUrlTemplate:
        'https://www.googleadservices.com/pagead/conversion/?gclid={gclid}&conversion_id={conversionId}&conversion_label={conversionLabel}&value={payout}&currency_code=EUR',
    },
    setupNote:
      'Put the Direct Ad URL in Google Ads (final URL). Google adds gclid automatically. Add the LP script to your landing page.',
    isSystem: true,
  },
];
