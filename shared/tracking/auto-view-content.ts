/** Campaigns optimized for click_button (Mediago type 12) — no auto viewcontent on visit. */
export const SKIP_AUTO_VIEW_CONTENT_SLUGS = new Set(['lp1']);

export function shouldSendAutoViewContent(campaignSlug: string): boolean {
  return !SKIP_AUTO_VIEW_CONTENT_SLUGS.has(campaignSlug);
}
