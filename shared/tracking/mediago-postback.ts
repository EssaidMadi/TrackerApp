type ClickLike = {
  trackingId?: string | null;
  externalClickId?: string | null;
  adId?: string | null;
  rawParams?: unknown;
};

export function resolveMediagoTrackingId(click: ClickLike): string {
  if (click.trackingId?.trim()) return click.trackingId.trim();
  if (click.externalClickId?.trim()) return click.externalClickId.trim();

  const raw = click.rawParams as Record<string, string> | null;
  if (raw && typeof raw === 'object') {
    for (const key of ['trackingid', 'tracking_id', 'click_id', 'subid']) {
      const v = raw[key] ?? raw[key.toLowerCase()];
      if (v && String(v).trim()) return String(v).trim();
    }
  }
  return '';
}

export function resolveMediagoAccountName(
  config?: { mediagoAccountName?: string | null } | null,
  profileDefaults?: Record<string, unknown> | null,
  envAccountName?: string,
): string {
  const fromConfig = config?.mediagoAccountName?.trim();
  if (fromConfig) return fromConfig;
  const fromProfile = String(profileDefaults?.mediagoAccountName ?? '').trim();
  if (fromProfile) return fromProfile;
  const fromEnv = (envAccountName || '').trim();
  return fromEnv;
}

export function resolveMediagoAdId(click: ClickLike): string {
  if (click.adId?.trim()) return click.adId.trim();
  const raw = click.rawParams as Record<string, string> | null;
  if (raw) {
    const v = raw.adid ?? raw.ad_id;
    if (v) return String(v).trim();
  }
  return '';
}
