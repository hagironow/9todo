'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, SkipForward, Repeat, Plus, Undo2 } from 'lucide-react';
import { ScheduledItem, SlotCoord, Routine, RecurrenceType, TimePeriod } from '@/lib/types';

interface RoutineSlotCellProps {
  coord: SlotCoord;
  item: ScheduledItem | null;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  onCreateRoutine?: (title: string, coord: SlotCoord) => void;
  onEditRoutine?: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: '매일',
  weekly: '매주',
  biweekly: '격주',
  monthly: '매월',
};

const PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

function getTitleForItem(item: ScheduledItem): string {
  if ('title' in item) return item.title;
  if ('routineDetails' in item && item.routineDetails) return item.routineDetails.title;
  return '';
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${ampm} ${h12}:${String(m).padStart(2, '0')}`;
}

function getRecurrenceLabel(item: ScheduledItem): string | null {
  const routine: Routine | undefined =
    'routineDetails' in item ? (item.routineDetails as Routine | undefined) : undefined;
  if (!routine) return null;
  const recLabel = RECURRENCE_LABELS[routine.recurrence] ?? '';
  if (routine.scheduledTime) {
    return `${recLabel} ${formatTime(routine.scheduledTime)}`;
  }
  const periodLabel = PERIOD_LABELS[routine.defaultSlot.period] ?? '';
  return `${recLabel} · ${periodLabel}`;
}

export default function RoutineSlotCell({
  coord,
  item,
  onComplete,
  onDefer,
  onUncomplete,
  onCreateRoutine,
  onEditRoutine,
  isReadOnly,
}: RoutineSlotCellProps) {
  const [inputting, setInputting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const openInput = () => {
    if (item || isReadOnly) return;
    setInputValue('');
    setInputting(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitInput = () => {
    const trimmed = inputValue.trim();
    setInputting(false);
    setInputValue('');
    if (trimmed && onCreateRoutine) {
      onCreateRoutine(trimmed, coord);
    }
  };

  const cancelInput = () => {
    setInputting(false);
    setInputValue('');
  };

  // 외부 클릭 시 commit
  useEffect(() => {
    if (!inputting) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        commitInput();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputting, inputValue]);

  // 빈 슬롯 — 입력 모드 또는 + 버튼
  if (!item) {
    return (
      <div ref={containerRef} className="min-h-[40px] rounded-lg" style={{ border: '1px dashed var(--border-subtle)' }}>
        {inputting ? (
          <div className="flex items-center gap-1.5 px-2 min-h-[40px]">
            <Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)] flex-shrink-0" />
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitInput();
                if (e.key === 'Escape') cancelInput();
              }}
              placeholder="루틴 입력..."
              className="flex-1 text-[var(--fs-item)] text-[var(--foreground)] bg-transparent outline-none placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        ) : isReadOnly ? (
          <div className="min-h-[40px]" />
        ) : (
          <button
            onClick={openInput}
            className="w-full min-h-[40px] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors duration-150 cursor-pointer"
            aria-label="루틴 추가"
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    );
  }

  const title = getTitleForItem(item);
  const isCompleted = item.completedAt !== null;
  const recurrenceLabel = getRecurrenceLabel(item);
  const routine: Routine | undefined =
    'routineDetails' in item ? (item.routineDetails as Routine | undefined) : undefined;

  const handleCellClick = () => {
    if (onEditRoutine && !isReadOnly) {
      onEditRoutine(item);
    }
  };

  return (
    <div
      onClick={handleCellClick}
      className={[
        'group relative flex items-center gap-1.5 px-2 min-h-[40px]',
        'rounded-lg bg-[var(--surface-inset)]',
        'transition-colors duration-100',
        isCompleted ? 'opacity-50' : '',
        onEditRoutine && !isReadOnly ? 'cursor-pointer hover:bg-[var(--muted)]' : '',
      ].join(' ')}
      style={{ border: '1px dashed var(--border-subtle)' }}
    >
      <Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)] flex-shrink-0 select-none" />

      <div className="flex-1 min-w-0 flex flex-col gap-0.5 py-1">
        <span
          className={[
            'text-[var(--fs-item)] text-[var(--foreground)] truncate leading-tight',
            isCompleted ? 'line-through text-[var(--muted-foreground)]' : '',
          ].join(' ')}
        >
          {title}
        </span>
        {recurrenceLabel && (
          <span className="text-[10px] text-[var(--muted-foreground)] leading-tight truncate">
            {recurrenceLabel}
          </span>
        )}
      </div>

      {isCompleted ? (
        onUncomplete && !isReadOnly && (
          <button
            onClick={(e) => { e.stopPropagation(); onUncomplete(item); }}
            className="w-5 h-5 flex items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            title="완료 취소"
          >
            <Undo2 size={10} />
          </button>
        )
      ) : (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item); }}
            className="w-5 h-5 flex items-center justify-center rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity pointer-events-auto"
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
