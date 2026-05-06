'use client';

import { useState } from 'react';
import { ChevronDown, Clock, Repeat, Inbox } from 'lucide-react';
import { Task, RoutineInstance, Project } from '@/lib/types';
import BacklogItem from './BacklogItem';

type BacklogEntry = Task | RoutineInstance;

interface BacklogPanelProps {
  items: BacklogEntry[];
  projects: Project[];
  getTitleForItem: (item: BacklogEntry) => string;
  isRoutineInstance: (item: BacklogEntry) => boolean;
  onPlaceInSlot: (item: BacklogEntry) => void;
  isReadOnly?: boolean;
}

function getOriginGroup(item: BacklogEntry): 'deferred' | 'repeated' | 'normal' {
  if ('origin' in item) {
    const origin = (item as Task).origin;
    if (origin === 'deferred') return 'deferred';
    if (origin === 'repeated') return 'repeated';
  }
  if ('deferCount' in item && (item as Task | RoutineInstance).deferCount > 0) {
    return 'deferred';
  }
  return 'normal';
}

const GROUP_CONFIG = {
  deferred: { label: '미룬 일', icon: Clock, order: 0 },
  repeated: { label: '진행할 일', icon: Repeat, order: 1 },
  normal:   { label: '할 일', icon: Inbox, order: 2 },
} as const;

type GroupKey = keyof typeof GROUP_CONFIG;

export default function BacklogPanel({
  items,
  projects,
  getTitleForItem,
  isRoutineInstance,
  onPlaceInSlot,
  isReadOnly,
}: BacklogPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const totalCount = items.length;

  // Group by origin
  const grouped: Record<GroupKey, BacklogEntry[]> = { deferred: [], repeated: [], normal: [] };
  for (const item of items) {
    const group = getOriginGroup(item);
    grouped[group].push(item);
  }

  const orderedGroups = (['deferred', 'repeated', 'normal'] as GroupKey[]).filter(
    (key) => grouped[key].length > 0
  );

  return (
    <section className="border border-[var(--border)] rounded-[calc(var(--radius)*1.4)] overflow-hidden bg-[var(--card)]">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)] transition-colors duration-100"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--fs-item)] font-semibold text-[var(--foreground)]">
            백로그
          </span>
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 bg-[var(--muted)] rounded-full text-[11px] font-semibold text-[var(--muted-foreground)]">
              {totalCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--muted-foreground)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Body */}
      <div
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{ maxHeight: expanded ? '800px' : '0px' }}
      >
        <div className="border-t border-[var(--border)]">
          {totalCount === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center px-3">
              <Inbox size={24} className="text-[var(--muted-foreground)]" />
              <p className="text-[var(--fs-item)] text-[var(--muted-foreground)]">
                백로그가 비어있습니다
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {orderedGroups.map((key) => {
                const config = GROUP_CONFIG[key];
                const Icon = config.icon;
                const groupItems = grouped[key];

                return (
                  <div key={key}>
                    {/* Group label */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
                      <Icon size={12} className="text-[var(--muted-foreground)]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                        {config.label}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {groupItems.length}
                      </span>
                    </div>
                    {/* Items */}
                    {groupItems.map((item) => (
                      <BacklogItem
                        key={item.id}
                        item={item}
                        title={getTitleForItem(item)}
                        deferCount={'deferCount' in item ? item.deferCount : 0}
                        isRoutine={isRoutineInstance(item)}
                        onPlaceInSlot={onPlaceInSlot}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
