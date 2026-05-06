'use client';

import { Check, SkipForward, Repeat } from 'lucide-react';
import { ScheduledItem } from '@/lib/types';

interface RoutineSlotCellProps {
  item: ScheduledItem | null;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
}

function getTitleForItem(item: ScheduledItem): string {
  if ('title' in item) return item.title;
  if ('routineDetails' in item && item.routineDetails) return item.routineDetails.title;
  return '';
}

export default function RoutineSlotCell({
  item,
  onComplete,
  onDefer,
}: RoutineSlotCellProps) {
  if (!item) {
    return (
      <div
        className="min-h-[40px] rounded-lg"
        style={{ border: '1px dashed var(--border-subtle)' }}
      />
    );
  }

  const title = getTitleForItem(item);
  const isCompleted = item.completedAt !== null;

  return (
    <div
      className={[
        'group relative flex items-center gap-1.5 px-2 min-h-[40px]',
        'rounded-lg bg-[var(--surface-inset)]',
        'transition-colors duration-100',
        isCompleted ? 'opacity-50' : '',
      ].join(' ')}
      style={{ border: '1px dashed var(--border-subtle)' }}
    >
      <Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)] flex-shrink-0 select-none" />

      <span
        className={[
          'flex-1 text-[11px] text-[var(--foreground)] truncate leading-tight',
          isCompleted ? 'line-through text-[var(--muted-foreground)]' : '',
        ].join(' ')}
      >
        {title}
      </span>

      {!isCompleted && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item); }}
            className="w-5 h-5 flex items-center justify-center rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity pointer-events-auto"
            title="완료"
          >
            <Check size={10} strokeWidth={3} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDefer(item); }}
            className="w-5 h-5 flex items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
            title="미루기"
          >
            <SkipForward size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
