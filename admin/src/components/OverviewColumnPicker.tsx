'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui';
import {
  buildOverviewColumns,
  DEFAULT_VISIBLE_COLUMNS,
  saveVisibleColumns,
  type OverviewColumnDef,
  type OverviewColumnId,
} from '@/lib/overview-columns';
import type { EventColumnDef } from '@/lib/api';

export function OverviewColumnPicker({
  eventColumns,
  visible,
  onChange,
}: {
  eventColumns: EventColumnDef[];
  visible: Set<OverviewColumnId>;
  onChange: (next: Set<OverviewColumnId>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allColumns = useMemo(() => buildOverviewColumns(eventColumns), [eventColumns]);
  const grouped = useMemo(() => {
    const groups: Record<string, OverviewColumnDef[]> = {
      core: [],
      metrics: [],
      events: [],
    };
    for (const c of allColumns) {
      groups[c.group].push(c);
    }
    return groups;
  }, [allColumns]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = (id: OverviewColumnId) => {
    const next = new Set(visible);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
    saveVisibleColumns(next);
  };

  const selectAll = () => {
    const next = new Set(allColumns.map((c) => c.id));
    onChange(next);
    saveVisibleColumns(next);
  };

  const resetDefault = () => {
    const ids = allColumns.map((c) => c.id);
    const next = new Set(
      [...DEFAULT_VISIBLE_COLUMNS, ...ids.filter((id) => id.startsWith('event:'))].filter((id) =>
        ids.includes(id),
      ),
    );
    onChange(next);
    saveVisibleColumns(next);
  };

  const renderGroup = (title: string, cols: OverviewColumnDef[]) => (
    <div key={title} className="mb-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1.5">{title}</p>
      <div className="grid grid-cols-2 gap-1">
        {cols.map((c) => (
          <label
            key={c.id}
            className="flex items-center gap-2 text-xs text-zinc-700 hover:bg-zinc-50 rounded px-1 py-0.5 cursor-pointer"
          >
            <input type="checkbox" checked={visible.has(c.id)} onChange={() => toggle(c.id)} />
            <span className="truncate">{c.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
        Columns ({visible.size}/{allColumns.length})
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[420px] max-h-[70vh] overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-zinc-900">Visible columns</p>
            <div className="flex gap-2">
              <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={selectAll}>
                All
              </button>
              <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={resetDefault}>
                Default
              </button>
            </div>
          </div>
          {renderGroup('Campaign', grouped.core)}
          {renderGroup('Metrics', grouped.metrics)}
          {grouped.events.length > 0 && renderGroup('Events', grouped.events)}
        </div>
      )}
    </div>
  );
}
