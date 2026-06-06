export function normalizeEventType(raw?: string | null): string {
  if (!raw?.trim()) return 'lead';
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}
