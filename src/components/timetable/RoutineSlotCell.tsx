'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { ScheduledItem, SlotCoord, Routine } from '@/lib/types';

interface RoutineSlotCellProps {
  coord: SlotCoord;
  item: ScheduledItem | null;
  onComplete: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  onCreateRoutine?: (title: string, coord: SlotCoord) => void;
  onEditRoutine?: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}

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

export default function RoutineSlotCell({
  coord,
  item,
  onComplete,
  onDelete,
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

  // 빈 슬롯
  if (!item) {
    return (
      <div ref={containerRef} className="min-h-[40px] rounded-lg" style={{ border: '1px dashed var(--border-subtle)' }}>
        {inputting ? (
          <div className="flex items-center gap-1.5 px-2 min-h-[40px]">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitInput();
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
  const routine: Routine | undefined =
    'routineDetails' in item ? (item.routineDetails as Routine | undefined) : undefined;

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
      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0 flex items-center gap-2 py-1">
        <span
          className={[
            'flex-1 text-[var(--fs-item)] text-[var(--foreground)] truncate leading-tight',
            isCompleted ? 'line-through text-[var(--muted-foreground)]' : '',
          ].join(' ')}
        >
          {title}
        </span>
        {routine?.scheduledTime && (
          <span className="text-[10px] text-[var(--muted-foreground)] leading-tight flex-shrink-0">
            {formatTime(routine.scheduledTime)}
          </span>
        )}
      </div>

      {/* 완료 상태: 호버 시 완료 취소 */}
      {!isReadOnly && isCompleted && onUncomplete && (
        <div
          className={[
            'absolute inset-0 rounded-lg',
            'flex items-center justify-center',
            'bg-[var(--surface-inset)]/80 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          ].join(' ')}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onUncomplete(item); }}
            className="text-[11px] font-medium text-[var(--muted-foreground)] pointer-events-auto cursor-pointer"
          >
            완료 취소
          </button>
        </div>
      )}

      {/* 미완료: 호버 시 수정/완료/삭제 오버레이 */}
      {!isReadOnly && !isCompleted && (
        <div
          className={[
            'absolute inset-0 rounded-lg',
            'flex items-center justify-center gap-1.5',
            'bg-[var(--surface-inset)]/95 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'pointer-events-none',
          ].join(' ')}
        >
          {onEditRoutine && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditRoutine(item); }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
              title="수정"
            >
              <Pencil size={11} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item); }}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity pointer-events-auto"
            title="완료"
          >
            <Check size={12} strokeWidth={2.5} />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-red-100 hover:text-red-500 transition-colors pointer-events-auto"
              title="삭제"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
