import { LP_FUNNEL_STEPS } from '../shared/tracking/lp-funnel';

export type CreativeCountMode = 'recorded' | 'sent';

export type CreativeReportOptions = {
  eventType?: string;
  countMode?: CreativeCountMode;
};

const DEFAULT_EVENT = 'call_click';

export function resolveCreativeEventSlugs(eventType?: string): { stepId: string; label: string; slugs: string[] } {
  const id = (eventType || DEFAULT_EVENT).toLowerCase().trim();

  const step = LP_FUNNEL_STEPS.find(
    (s) => s.kind === 'event' && (s.stepId === id || s.slugs?.includes(id)),
  );

  if (step?.slugs?.length) {
    return { stepId: step.stepId, label: step.label, slugs: step.slugs };
  }

  return { stepId: id, label: id.replace(/_/g, ' '), slugs: [id] };
}

export function parseCreativeCountMode(value?: string): CreativeCountMode {
  return value === 'sent' ? 'sent' : 'recorded';
}

export function metricLabelForEvent(label: string): string {
  return `${label} rate`;
}
