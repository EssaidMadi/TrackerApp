async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const proxyPath = path.startsWith('/api/') ? path.slice(5) : path.replace(/^\//, '');
  const res = await fetch(`/api/admin/${proxyPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  return res.json();
}

export interface DnsRecord {
  type: 'CNAME' | 'A' | 'TXT';
  host: string;
  value: string;
  ttl: number;
  purpose: string;
  godaddyHint: string;
}

export interface TrackingDomain {
  id: string;
  label: string;
  subdomain: string;
  rootDomain: string;
  hostname: string;
  status: 'pending_dns' | 'verified' | 'failed';
  verificationToken: string;
  verificationHost: string;
  dnsRecords: DnsRecord[];
  lastCheckedAt?: string;
  lastCheckError?: string;
  createdAt: string;
  _count?: { campaigns: number };
}

export interface ParamMapping {
  internalField: string;
  displayLabel: string;
  externalKeys: string[];
  urlMacro?: string;
  postbackToken?: string;
  showInReports: boolean;
  priority?: number;
}

export interface TrafficSourceProfile {
  id: string;
  slug: string;
  name: string;
  trackingModeDefault: 'redirect' | 'direct';
  clickUrlTemplate?: string | null;
  directAdUrlTemplate?: string | null;
  paramMappings: ParamMapping[];
  conversionMethod: string;
  postbackDefaults?: Record<string, unknown>;
  setupNote?: string | null;
  isSystem: boolean;
  active: boolean;
  _count?: { campaigns: number };
}

export interface Campaign {
  id: string;
  externalId?: string;
  name: string;
  slug: string;
  trafficSource: string;
  trafficSourceProfileId?: string;
  trafficSourceProfile?: TrafficSourceProfile | null;
  trackingMode: 'redirect' | 'direct';
  destinationUrl: string;
  active: boolean;
  domainId?: string;
  domain?: TrackingDomain | null;
  trackerBaseUrl?: string;
  directAdUrl?: string | null;
  lpScriptSnippet?: string;
  setupNote?: string | null;
  paramMappings?: ParamMapping[];
  conversionMethod?: string | null;
  landerName?: string;
  offerName?: string;
  workspaceName?: string;
  clickUrl: string;
  trackingTemplate: string;
  postbackConfig?: PostbackConfig;
  createdAt: string;
}

export interface PostbackConfig {
  mediagoConversionType: number;
  mediagoEnabled: boolean;
  facebookPixelId?: string;
  facebookAccessToken?: string;
  facebookEnabled: boolean;
  googleConversionId?: string;
  googleConversionLabel?: string;
  googlePostbackUrl?: string;
  googleEnabled: boolean;
}

export interface Click {
  id: string;
  clickId: string;
  converted?: boolean;
  conversionStatus?: string | null;
  trackingId?: string;
  externalClickId?: string;
  gclid?: string;
  fbclid?: string;
  adId?: string;
  adTitle?: string;
  campaignExternalId?: string;
  publisherName?: string;
  siteId?: string;
  contentName?: string;
  platform?: string;
  assetId?: string;
  pathId?: string;
  landerId?: string;
  landerName?: string;
  offerId?: string;
  offerName?: string;
  affiliateNetwork?: string;
  affiliateNetworkId?: string;
  trafficSourceId?: string;
  trafficSourceName?: string;
  customVariable1?: string;
  customVariable2?: string;
  customVariable3?: string;
  customVariable4?: string;
  customVariable5?: string;
  customVariable6?: string;
  customVariable7?: string;
  customVariable8?: string;
  customVariable9?: string;
  customVariable10?: string;
  utmSource?: string;
  utmCampaign?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  device?: string;
  os?: string;
  osVersion?: string;
  brand?: string;
  model?: string;
  browser?: string;
  browserVersion?: string;
  isp?: string;
  mobileCarrier?: string;
  connectionType?: string;
  isProxy?: boolean;
  isHosting?: boolean;
  isBot?: boolean;
  botScore?: number;
  botReasons?: string[];
  acceptLanguage?: string;
  requestHeaders?: Record<string, string>;
  isLocalIp?: boolean;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  createdAt: string;
  campaign: {
    name: string;
    slug: string;
    trafficSourceProfile?: { name: string; slug: string; paramMappings?: ParamMapping[] } | null;
  };
  reportFields?: { label: string; value: string }[];
  conversions?: { id: string; status: string; eventType: string }[];
}

export interface Conversion {
  id: string;
  clickId: string;
  eventType: string;
  revenue: number;
  transactionId?: string;
  status: string;
  createdAt: string;
  campaign: { name: string; slug: string; externalId?: string };
  click?: Click;
  postbackLogs: PostbackLog[];
}

export interface PostbackLog {
  id: string;
  network: string;
  method: string;
  url: string;
  httpStatus?: number;
  success: boolean;
  response?: string;
}

export interface BreakdownRow {
  name: string;
  clicks: number;
  conversions: number;
  cr: string;
}

export const trackerApi = {
  getDomains: () => api<TrackingDomain[]>('/api/domains'),
  getDomain: (id: string) => api<TrackingDomain>(`/api/domains/${id}`),
  createDomain: (data: { label: string; rootDomain: string; subdomain?: string }) =>
    api<TrackingDomain>('/api/domains', { method: 'POST', body: JSON.stringify(data) }),
  refreshDomainDns: (id: string) =>
    api<TrackingDomain>(`/api/domains/${id}/refresh-dns`, { method: 'POST' }),
  verifyDomain: (id: string) =>
    api<{ domain: TrackingDomain; check: Record<string, unknown> }>(`/api/domains/${id}/verify`, {
      method: 'POST',
    }),
  deleteDomain: (id: string) =>
    api<{ deleted: boolean }>(`/api/domains/${id}`, { method: 'DELETE' }),
  getCampaigns: () => api<Campaign[]>('/api/campaigns'),
  getCampaign: (id: string) => api<Campaign>(`/api/campaigns/${id}`),
  getTrafficSources: (all?: boolean) =>
    api<TrafficSourceProfile[]>(`/api/traffic-sources${all ? '?all=1' : ''}`),
  getTrafficSource: (id: string) => api<TrafficSourceProfile>(`/api/traffic-sources/${id}`),
  createTrafficSource: (data: Partial<TrafficSourceProfile>) =>
    api<TrafficSourceProfile>('/api/traffic-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTrafficSource: (id: string, data: Partial<TrafficSourceProfile>) =>
    api<TrafficSourceProfile>(`/api/traffic-sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTrafficSource: (id: string) =>
    api<{ deleted: boolean }>(`/api/traffic-sources/${id}`, { method: 'DELETE' }),
  createCampaign: (data: {
    name: string;
    slug: string;
    externalId?: string;
    trafficSource?: string;
    trafficSourceProfileId?: string;
    trackingMode?: 'redirect' | 'direct';
    domainId?: string;
    destinationUrl: string;
  }) => api<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      externalId: string;
      trafficSource?: string;
      trafficSourceProfileId?: string;
      trackingMode?: 'redirect' | 'direct';
      domainId?: string;
      destinationUrl: string;
      active: boolean;
      landerName: string;
      offerName: string;
      workspaceName: string;
    }>,
  ) => api<Campaign>(`/api/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCampaign: (id: string) =>
    api<{ deleted: boolean; id: string }>(`/api/campaigns/${id}`, { method: 'DELETE' }),
  updatePostbackConfig: (id: string, data: Partial<PostbackConfig>) =>
    api<Campaign>(`/api/campaigns/${id}/postback-config`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStats: (id: string) =>
    api<{ clicks: number; conversions: number; sentConversions: number; conversionRate: string }>(
      `/api/campaigns/${id}/stats`,
    ),
  getClicks: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<{ items: Click[]; total: number }>(`/api/clicks${qs}`);
  },
  getConversions: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<{ items: Conversion[]; total: number }>(`/api/conversions${qs}`);
  },
  exportConversionsCsv: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    const res = await fetch(`/api/admin/conversions/export/csv${qs}`);
    if (!res.ok) throw new Error(await res.text());
    return res.text();
  },
  retryConversion: (id: string) =>
    api<{ success: boolean }>(`/api/conversions/${id}/retry`, { method: 'POST' }),
  getAnalyticsOverview: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<{ clicks: number; conversions: number; sentConversions: number; conversionRate: string }>(
      `/api/analytics/overview${qs}`,
    );
  },
  getBreakdown: (dimension: string, params?: Record<string, string>) => {
    const qs = new URLSearchParams({ dimension, ...params });
    return api<BreakdownRow[]>(`/api/analytics/breakdown?${qs}`);
  },
  getLiveTraffic: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<Click[]>(`/api/analytics/live${qs}`);
  },
};
