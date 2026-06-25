export type CreativeQuality = 'excellent' | 'good' | 'average' | 'poor' | 'risk' | 'low_data';

export type CreativePerformanceRow = {
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
};

export type CreativePairRow = CreativePerformanceRow & {
  imageKey: string;
  imageLabel: string;
  headlineKey: string;
  headlineLabel: string;
};

export type CreativeRecommendation = {
  id: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
  category: 'image' | 'headline' | 'combo' | 'publisher' | 'general';
  title: string;
  message: string;
  action: string;
  entityKey?: string;
  entityLabel?: string;
  metric?: string;
};

export type CreativeBenchmarks = {
  avgCr: number;
  avgBotPct: number;
  avgEpc: number;
  totalVisits: number;
  minSample: number;
};

export function scoreCreativeQuality(
  visits: number,
  crNum: number,
  botPct: number,
  benchmarks: CreativeBenchmarks,
): CreativeQuality {
  if (visits < benchmarks.minSample) return 'low_data';
  if (botPct >= 40) return 'risk';
  if (crNum >= benchmarks.avgCr * 1.25 && botPct < 25) return 'excellent';
  if (crNum >= benchmarks.avgCr && botPct < 30) return 'good';
  if (crNum < benchmarks.avgCr * 0.5 && visits >= benchmarks.minSample * 2) return 'poor';
  return 'average';
}

export function buildCreativeRecommendations(
  images: CreativePerformanceRow[],
  headlines: CreativePerformanceRow[],
  pairs: CreativePairRow[],
  benchmarks: CreativeBenchmarks,
): CreativeRecommendation[] {
  const recs: CreativeRecommendation[] = [];
  const min = benchmarks.minSample;

  const eligibleImages = images.filter((r) => r.visits >= min && r.key !== '(unknown)');
  const eligibleHeadlines = headlines.filter((r) => r.visits >= min && r.key !== '(unknown)');
  const eligiblePairs = pairs.filter((r) => r.visits >= min);

  const bestImage = [...eligibleImages].sort((a, b) => b.crNum - a.crNum || b.visits - a.visits)[0];
  if (bestImage && bestImage.crNum > benchmarks.avgCr) {
    recs.push({
      id: `scale-image-${bestImage.key}`,
      severity: 'success',
      category: 'image',
      title: `Scale image: ${bestImage.label}`,
      message: `CR ${bestImage.cr}% vs campaign avg ${benchmarks.avgCr.toFixed(2)}% on ${bestImage.visits} visits. Bot traffic ${bestImage.botPct}%.`,
      action: 'Increase budget on this creative asset.',
      entityKey: bestImage.key,
      entityLabel: bestImage.label,
      metric: `${bestImage.cr}% CR`,
    });
  }

  const worstImage = [...eligibleImages]
    .filter((r) => r.visits >= min * 2)
    .sort((a, b) => a.crNum - b.crNum || b.botPct.localeCompare(a.botPct))[0];
  if (worstImage && worstImage.crNum < benchmarks.avgCr * 0.6) {
    recs.push({
      id: `pause-image-${worstImage.key}`,
      severity: 'danger',
      category: 'image',
      title: `Pause or replace image: ${worstImage.label}`,
      message: `CR ${worstImage.cr}% with ${worstImage.visits} visits. ${worstImage.botPct}% bot traffic.`,
      action: 'Reduce spend or swap this creative.',
      entityKey: worstImage.key,
      entityLabel: worstImage.label,
      metric: `${worstImage.cr}% CR`,
    });
  }

  const bestHeadline = [...eligibleHeadlines].sort((a, b) => b.crNum - a.crNum || b.visits - a.visits)[0];
  if (bestHeadline && bestHeadline.crNum > benchmarks.avgCr) {
    recs.push({
      id: `scale-headline-${bestHeadline.key}`,
      severity: 'success',
      category: 'headline',
      title: `Winning headline: "${bestHeadline.label}"`,
      message: `CR ${bestHeadline.cr}% on ${bestHeadline.visits} visits. Reuse this angle on other images.`,
      action: 'Duplicate headline across top images.',
      entityKey: bestHeadline.key,
      entityLabel: bestHeadline.label,
      metric: `${bestHeadline.cr}% CR`,
    });
  }

  const worstHeadline = [...eligibleHeadlines]
    .filter((r) => r.visits >= min * 2)
    .sort((a, b) => a.crNum - b.crNum)[0];
  if (worstHeadline && worstHeadline.crNum < benchmarks.avgCr * 0.6) {
    recs.push({
      id: `pause-headline-${worstHeadline.key}`,
      severity: 'warning',
      category: 'headline',
      title: `Weak headline: "${worstHeadline.label}"`,
      message: `Only ${worstHeadline.cr}% CR from ${worstHeadline.visits} visits.`,
      action: 'Test a new headline variant.',
      entityKey: worstHeadline.key,
      entityLabel: worstHeadline.label,
      metric: `${worstHeadline.cr}% CR`,
    });
  }

  const bestPair = [...eligiblePairs].sort((a, b) => b.crNum - a.crNum || b.revenue - a.revenue)[0];
  if (bestPair && bestPair.crNum >= benchmarks.avgCr) {
    recs.push({
      id: `best-combo-${bestPair.key}`,
      severity: 'success',
      category: 'combo',
      title: 'Best image + headline combo',
      message: `"${bestPair.headlineLabel}" on ${bestPair.imageLabel} — ${bestPair.cr}% CR, $${bestPair.revenue.toFixed(2)} revenue.`,
      action: 'Make this your primary ad combination.',
      entityKey: bestPair.key,
      entityLabel: `${bestPair.imageLabel} × ${bestPair.headlineLabel}`,
      metric: `${bestPair.cr}% CR`,
    });
  }

  for (const img of eligibleImages.filter((r) => parseFloat(r.botPct) >= 35).slice(0, 3)) {
    recs.push({
      id: `bot-image-${img.key}`,
      severity: 'danger',
      category: 'image',
      title: `High bot traffic on image ${img.label}`,
      message: `${img.botPct}% bots on ${img.visits} visits — quality may be inflated.`,
      action: 'Review publisher sources for this creative.',
      entityKey: img.key,
      entityLabel: img.label,
      metric: `${img.botPct}% bots`,
    });
  }

  const lowData = images.filter((r) => r.visits > 0 && r.visits < min).length;
  if (lowData > 0) {
    recs.push({
      id: 'low-sample-images',
      severity: 'info',
      category: 'general',
      title: `${lowData} image(s) need more data`,
      message: `Wait for at least ${min} visits per creative before pausing.`,
      action: 'Let tests run or increase budget slightly.',
    });
  }

  if (recs.length === 0 && benchmarks.totalVisits > 0) {
    recs.push({
      id: 'no-signal',
      severity: 'info',
      category: 'general',
      title: 'Not enough signal yet',
      message: 'Collect more visits with asset_id and ad_title macros in your click URL.',
      action: 'Ensure Mediago passes ${ASSET_ID} and ${AD_TITLE}.',
    });
  }

  return recs.slice(0, 12);
}
