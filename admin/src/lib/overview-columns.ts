import type { EventColumnDef } from './api';

export type OverviewColumnId = string;

export type OverviewColumnDef = {
  id: OverviewColumnId;
  label: string;
  group: 'core' | 'metrics' | 'events';
};

const CORE_COLUMNS: OverviewColumnDef[] = [
  { id: 'campaignName', label: 'Campaign name', group: 'core' },
  { id: 'cpc', label: 'CPC', group: 'core' },
  { id: 'visits', label: 'Visits', group: 'core' },
  { id: 'uniqueVisits', label: 'Unique visits', group: 'core' },
  { id: 'suspiciousVisits', label: 'Suspicious visits', group: 'core' },
  { id: 'conversions', label: 'Conversions', group: 'core' },
  { id: 'cost', label: 'Cost', group: 'core' },
  { id: 'revenue', label: 'Revenue', group: 'core' },
  { id: 'profit', label: 'Profit', group: 'core' },
  { id: 'roi', label: 'ROI', group: 'metrics' },
  { id: 'cv', label: 'CV', group: 'metrics' },
  { id: 'epv', label: 'EPV', group: 'metrics' },
  { id: 'cpv', label: 'CPV', group: 'metrics' },
  { id: 'errors', label: 'Errors', group: 'metrics' },
  { id: 'ecpc', label: 'eCPC', group: 'metrics' },
  { id: 'txTransfo', label: 'Tx Transfo', group: 'metrics' },
];

const STORAGE_KEY = 'overview-visible-columns';

export const DEFAULT_VISIBLE_COLUMNS: OverviewColumnId[] = [
  'campaignName',
  'cpc',
  'visits',
  'uniqueVisits',
  'suspiciousVisits',
  'conversions',
  'cost',
  'revenue',
  'profit',
  'roi',
  'cv',
  'epv',
  'cpv',
  'errors',
  'ecpc',
  'txTransfo',
];

export function eventCountColumnId(slug: string) {
  return `event:${slug}:count`;
}

export function eventRevenueColumnId(slug: string) {
  return `event:${slug}:revenue`;
}

export function buildOverviewColumns(eventColumns: EventColumnDef[]): OverviewColumnDef[] {
  const eventCols: OverviewColumnDef[] = [];
  for (const e of eventColumns) {
    eventCols.push({
      id: eventCountColumnId(e.slug),
      label: e.countLabel,
      group: 'events',
    });
    eventCols.push({
      id: eventRevenueColumnId(e.slug),
      label: e.revenueLabel,
      group: 'events',
    });
  }
  return [...CORE_COLUMNS, ...eventCols];
}

export function loadVisibleColumns(allColumnIds: OverviewColumnId[]): Set<OverviewColumnId> {
  if (typeof window === 'undefined') {
    return new Set(DEFAULT_VISIBLE_COLUMNS.filter((id) => allColumnIds.includes(id)));
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = new Set(
        [...DEFAULT_VISIBLE_COLUMNS, ...allColumnIds.filter((id) => id.startsWith('event:'))].filter((id) =>
          allColumnIds.includes(id),
        ),
      );
      return defaults;
    }
    const parsed = JSON.parse(raw) as OverviewColumnId[];
    const valid = parsed.filter((id) => allColumnIds.includes(id));
    return valid.length > 0 ? new Set(valid) : new Set(allColumnIds);
  } catch {
    return new Set(allColumnIds);
  }
}

export function saveVisibleColumns(visible: Set<OverviewColumnId>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...visible]));
}
