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
    try {
      const json = JSON.parse(text) as { message?: string | string[] };
      const msg = json.message;
      if (typeof msg === 'string') throw new Error(msg);
      if (Array.isArray(msg)) throw new Error(msg.join(', '));
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
    }
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
  /** GET URL template to fire when a lead converts (uses this campaign's tracking domain) */
  incomingConversionUrl?: string;
  incomingConversionUrlAlt?: string;
  postbackConfig?: PostbackConfig;
  createdAt: string;
}

export interface PostbackConfig {
  mediagoConversionType: number;
  mediagoEnabled: boolean;
  mediagoAccountName?: string;
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
  visitorId?: string;
  isNewVisitor?: boolean;
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

export interface VisitStats {
  clicks: number;
  visits: number;
  uniqueVisits: number;
  newVisitors: number;
  returningVisitors: number;
  conversions: number;
  sentConversions: number;
  conversionRate: string;
  impressions?: number;
  revenue?: number;
  cost?: number;
  profit?: number;
  suspiciousVisits?: number;
}

export interface EventColumnDef {
  slug: string;
  countLabel: string;
  revenueLabel: string;
}

export interface CampaignReportRow {
  campaignId: string;
  campaignName: string;
  marker: string;
  cpc: number;
  visits: number;
  uniqueVisits: number;
  suspiciousVisits: number;
  suspiciousPct: string;
  conversions: number;
  cost: number;
  revenue: number;
  profit: number;
  roi: number;
  cv: number;
  epv: number;
  cpv: number;
  ecpc: number;
  errors: number;
  txTransfo: number;
  impressions: number;
  platformClicks: number;
  countByEvent: Record<string, number>;
  revenueByEvent: Record<string, number>;
}

export interface TimeseriesPoint {
  bucket: string;
  impressions: number;
  visits: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ConversionEventType {
  id: string;
  slug: string;
  displayLabel: string;
  sortOrder: number;
  active: boolean;
  countsAsConversion: boolean;
  isSystem: boolean;
}

export interface PlatformConnection {
  id: string;
  platform: string;
  label: string;
  accountId?: string;
  credentials: Record<string, unknown>;
  status: string;
  lastSyncAt?: string;
  lastError?: string;
}

export interface CampaignPlatformMapping {
  id: string;
  campaignId: string;
  platform: string;
  externalCampaignId: string;
  campaign?: { id: string; name: string; slug: string };
}

export interface BreakdownRow {
  name: string;
  clicks: number;
  conversions: number;
  cr: string;
}

export interface VisitSummary {
  visits: number;
  uniqueVisits: number;
  newVisitors: number;
  returningVisitors: number;
  botVisits: number;
  humanVisits: number;
  botPct: string;
  humanPct: string;
  conversions: number;
  conversionRate: string;
  revenue: number;
}

export type VisitBreakdownDimension =
  | 'publisher'
  | 'ad'
  | 'site'
  | 'content'
  | 'platform'
  | 'country'
  | 'device'
  | 'campaign';

export interface VisitBreakdownRow {
  key: string;
  label: string;
  visits: number;
  uniqueVisitors: number;
  botVisits: number;
  humanVisits: number;
  botPct: string;
  newVisitors: number;
  convertingVisits: number;
  conversions: number;
  cr: string;
  revenue: number;
}

export type CreativeQuality = 'excellent' | 'good' | 'average' | 'poor' | 'risk' | 'low_data';

export interface CreativePerformanceRow {
  key: string;
  label: string;
  visits: number;
  uniqueVisitors: number;
  botVisits: number;
  humanVisits: number;
  botPct: string;
  convertingVisits: number;
  conversions: number;
  cr: string;
  crNum: number;
  revenue: number;
  epc: number;
  quality: CreativeQuality;
  topHeadline?: string;
  topHeadlineCr?: string;
  topImage?: string;
  topImageCr?: string;
}

export interface CreativePairRow extends CreativePerformanceRow {
  imageKey: string;
  imageLabel: string;
  headlineKey: string;
  headlineLabel: string;
}

export interface CreativeRecommendation {
  id: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
  category: 'image' | 'headline' | 'combo' | 'publisher' | 'general';
  title: string;
  message: string;
  action: string;
  entityKey?: string;
  entityLabel?: string;
  metric?: string;
}

export interface CreativeReport {
  benchmarks: {
    avgCr: number;
    avgBotPct: number;
    avgEpc: number;
    totalVisits: number;
    minSample: number;
  };
  recommendations: CreativeRecommendation[];
  images: CreativePerformanceRow[];
  headlines: CreativePerformanceRow[];
  pairs: CreativePairRow[];
  summary: {
    trackedImages: number;
    trackedHeadlines: number;
    trackedPairs: number;
    totalVisits: number;
  };
}

export interface FunnelStepMetrics {
  stepId: string;
  label: string;
  kind: 'visit' | 'event';
  mediagoCode?: number;
  mediagoLabel?: string;
  eventSlugs: string[];
  totalEvents: number;
  uniqueVisitors: number;
  rateFromVisitsPct: string;
  dropOffFromPrevPct: string;
  postbacksSent: number;
  postbacksFailed: number;
  postbacksPending: number;
  revenue: number;
}

export interface FunnelReport {
  visits: number;
  uniqueVisits: number;
  steps: FunnelStepMetrics[];
  discoveredEvents: { slug: string; count: number; uniqueVisitors: number }[];
}

export interface FunnelPostbackRow {
  id: string;
  createdAt: string;
  eventType: string;
  stepLabel: string;
  mediagoCode?: number;
  clickId: string;
  campaignName: string;
  network: string;
  success: boolean;
  httpStatus: number | null;
  url: string;
  conversionStatus: string;
  revenue: number;
}

export interface Lander {
  id: string;
  name: string;
  slug: string;
  campaignId: string;
  rootDomain?: string | null;
  publicUrl: string;
  storagePath: string;
  entryFile: string;
  injectTracker: boolean;
  trackerAttrs?: { noViewContent?: boolean } | null;
  status: 'draft' | 'ready';
  fileCount: number;
  processedCount: number;
  hasFiles: boolean;
  deployCommand: string;
  createdAt: string;
  updatedAt: string;
  campaign: {
    id: string;
    name: string;
    slug: string;
    externalId?: string | null;
    trackingMode: string;
    destinationUrl: string;
    domain?: { hostname: string; rootDomain: string; status: string } | null;
  };
}

export interface LanderSuggestion {
  slug: string;
  rootDomain: string;
  publicUrl: string;
  trackerSnippet: string;
  verifiedDomains: { id: string; label: string; rootDomain: string; hostname: string }[];
}

async function adminRaw(path: string, options: RequestInit = {}) {
  const proxyPath = path.startsWith('/api/') ? path.slice(5) : path.replace(/^\//, '');
  const res = await fetch(`/api/admin/${proxyPath}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
    api<VisitStats>(`/api/campaigns/${id}/stats`),
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
    return api<VisitStats>(`/api/analytics/overview${qs}`);
  },
  getBreakdown: (dimension: string, params?: Record<string, string>) => {
    const qs = new URLSearchParams({ dimension, ...params });
    return api<BreakdownRow[]>(`/api/analytics/breakdown?${qs}`);
  },
  getVisitSummary: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<VisitSummary>(`/api/analytics/visits/summary${qs}`);
  },
  getVisitBreakdown: (dimension: VisitBreakdownDimension, params?: Record<string, string>) => {
    const qs = new URLSearchParams({ dimension, ...params });
    return api<VisitBreakdownRow[]>(`/api/analytics/visits/breakdown?${qs}`);
  },
  getCreativeReport: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<CreativeReport>(`/api/analytics/creatives${qs}`);
  },
  getLiveTraffic: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<Click[]>(`/api/analytics/live${qs}`);
  },
  getFunnel: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<FunnelReport>(`/api/analytics/funnel${qs}`);
  },
  getFunnelPostbacks: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<FunnelPostbackRow[]>(`/api/analytics/funnel/postbacks${qs}`);
  },
  getCampaignReport: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    const { normalizeCampaignReport } = await import('./normalize-campaign-report');
    const report = await api<{
      rows: Array<Partial<CampaignReportRow> & Record<string, unknown>>;
      eventColumns: Array<Record<string, unknown>>;
    }>(`/api/analytics/campaigns${qs}`);
    return normalizeCampaignReport(report);
  },
  getTimeseries: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<TimeseriesPoint[]>(`/api/analytics/timeseries${qs}`);
  },
  exportCampaignReportCsv: async (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    const res = await fetch(`/api/admin/analytics/campaigns/export/csv${qs}`);
    if (!res.ok) throw new Error(await res.text());
    return res.text();
  },
  getConversionEventTypes: (includeInactive = false) =>
    api<ConversionEventType[]>(
      `/api/conversion-event-types${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  createConversionEventType: (data: {
    slug?: string;
    displayLabel: string;
    sortOrder?: number;
    countsAsConversion?: boolean;
  }) =>
    api<ConversionEventType>('/api/conversion-event-types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateConversionEventType: (id: string, data: Partial<ConversionEventType>) =>
    api<ConversionEventType>(`/api/conversion-event-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteConversionEventType: (id: string) =>
    api<{ deleted: boolean }>(`/api/conversion-event-types/${id}`, { method: 'DELETE' }),
  getPlatformConnections: () => api<PlatformConnection[]>('/api/integrations/connections'),
  createPlatformConnection: (data: {
    platform: string;
    label: string;
    accountId?: string;
    credentials?: Record<string, unknown>;
  }) =>
    api<PlatformConnection>('/api/integrations/connections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlatformConnection: (id: string, data: Partial<PlatformConnection>) =>
    api<PlatformConnection>(`/api/integrations/connections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePlatformConnection: (id: string) =>
    api<{ deleted: boolean }>(`/api/integrations/connections/${id}`, { method: 'DELETE' }),
  testPlatformConnection: (id: string) =>
    api<{
      ok: boolean;
      message?: string;
      accounts?: { accountId: string; accountName: string }[];
    }>(`/api/integrations/connections/${id}/test`, { method: 'POST' }),
  getMediagoAccounts: (connectionId: string) =>
    api<{ accountId: string; accountName: string }[]>(
      `/api/integrations/connections/${connectionId}/mediago/accounts`,
    ),
  getMediagoCampaigns: (connectionId: string) =>
    api<{ campaignId: string; campaignName: string; accountId?: string }[]>(
      `/api/integrations/connections/${connectionId}/mediago/campaigns`,
    ),
  autoMapMediagoCampaigns: (connectionId: string) =>
    api<{ mapped: number; total: number; alreadyMapped?: number; unmatched?: number }>(
      `/api/integrations/connections/${connectionId}/mediago/auto-map`,
      { method: 'POST' },
    ),
  syncAllPlatforms: () => api<{ synced: number }>('/api/integrations/sync', { method: 'POST' }),
  syncPlatformConnection: (id: string) =>
    api<number>(`/api/integrations/connections/${id}/sync`, { method: 'POST' }),
  getCampaignMappings: () => api<CampaignPlatformMapping[]>('/api/integrations/mappings'),
  createCampaignMapping: (data: {
    campaignId: string;
    platform: string;
    externalCampaignId: string;
  }) =>
    api<CampaignPlatformMapping>('/api/integrations/mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCampaignMapping: (id: string) =>
    api<{ deleted: boolean }>(`/api/integrations/mappings/${id}`, { method: 'DELETE' }),
  upsertManualSpend: (data: {
    campaignId: string;
    platform: string;
    date: string;
    impressions?: number;
    clicks?: number;
    spend?: number;
  }) =>
    api<unknown>('/api/integrations/spend/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  importSpendCsv: (csv: string) =>
    api<{ imported: number }>('/api/integrations/spend/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    }),
  getLanders: () => api<Lander[]>('/api/landers'),
  getLander: (id: string) => api<Lander>(`/api/landers/${id}`),
  suggestLander: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return api<LanderSuggestion>(`/api/landers/suggest${qs}`);
  },
  createLander: (data: {
    name: string;
    campaignId: string;
    slug?: string;
    rootDomain?: string;
    publicUrl?: string;
    entryFile?: string;
    injectTracker?: boolean;
    trackerAttrs?: { noViewContent?: boolean };
  }) =>
    api<Lander>('/api/landers', { method: 'POST', body: JSON.stringify(data) }),
  updateLander: (
    id: string,
    data: Partial<{
      name: string;
      campaignId: string;
      slug: string;
      rootDomain: string;
      publicUrl: string;
      entryFile: string;
      injectTracker: boolean;
      trackerAttrs: { noViewContent?: boolean };
      status: 'draft' | 'ready';
    }>,
  ) => api<Lander>(`/api/landers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLander: (id: string) =>
    api<{ deleted: boolean; id: string }>(`/api/landers/${id}`, { method: 'DELETE' }),
  uploadLanderFile: async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await adminRaw(`landers/${id}/upload`, { method: 'POST', body: fd });
    return res.json() as Promise<Lander>;
  },
  uploadLanderFiles: async (id: string, files: File[]) => {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    const res = await adminRaw(`landers/${id}/upload-files`, { method: 'POST', body: fd });
    return res.json() as Promise<Lander>;
  },
  reprocessLander: (id: string) =>
    api<Lander>(`/api/landers/${id}/reprocess`, { method: 'POST' }),
  downloadLanderRaw: async (id: string, filename: string) => {
    const res = await adminRaw(`landers/${id}/download`);
    const blob = await res.blob();
    downloadBlob(blob, filename);
  },
  downloadLanderDeployBundle: async (id: string, filename: string) => {
    const res = await adminRaw(`landers/${id}/deploy-bundle`);
    const blob = await res.blob();
    downloadBlob(blob, filename);
  },
};
