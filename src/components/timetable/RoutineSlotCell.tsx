'use client';

import { useState, useRef, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { ScheduledItem, SlotCoord, Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';

interface RoutineSlotCellProps {
  coord: SlotCoord;
  item: ScheduledItem | null;
  onComplete: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  onCreateRoutine?: (title: string, coord: SlotCoord) => void;
  onEditRoutine?: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
  projects?: Project[];
}

function getTitleForItem(item: ScheduledItem): string {
  return item.title;
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
  projects,
}: RoutineSlotCellProps) {
  const [inputting, setInputting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCompleted = item ? item.completedAt !== null : false;

  // Droppable — both empty and filled slots accept routine drops
  const droppableId = `routine-${coord.period}-${coord.priority}`;
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: droppableId,
    data: { coord, isRoutineSlot: true },
    disabled: isReadOnly,
  });

  // Draggable — only when item exists, not completed, not read-only
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: item?.id ?? `empty-routine-${coord.period}-${coord.priority}`,
    data: { item, isRoutineInstance: true, currentSlot: coord },
    disabled: !item || isReadOnly || isCompleted,
  });

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

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

  // Click outside commits
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

  // Combine refs for drag + drop
  const setRefs = (node: HTMLDivElement | null) => {
    setDropRef(node);
    if (item) setDragRef(node);
  };

  const projectColor = (() => {
    const pid = item?.projectId;
    if (!pid || !projects) return null;
    const p = projects.find((pr) => pr.id === pid);
    return p?.color ?? null;
  })();

  // Empty slot
  if (!item) {
    return (
      <div
        ref={setDropRef}
        className={[
          'min-h-[40px] rounded-lg',
          isOver ? 'ring-2 ring-[var(--foreground)] bg-[var(--foreground)]/8' : '',
        ].join(' ')}
        style={{ border: '1px dashed var(--border-subtle)' }}
      >
        {inputting ? (
          <div ref={containerRef} className="flex items-center gap-1.5 px-2 min-h-[40px]">
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

  return (
    <div
      ref={setRefs}
      {...attributes}
      className={[
        'group relative flex items-center gap-1.5 px-2 min-h-[40px]',
        'rounded-lg bg-[var(--surface-inset)]',
        'transition-colors duration-100',
        isCompleted ? 'opacity-50' : '',
        isDragging ? 'opacity-35' : '',
        isOver ? 'ring-2 ring-[var(--foreground)] bg-[var(--foreground)]/8' : '',
      ].join(' ')}
      style={{
        border: '1px dashed var(--border-subtle)',
        ...dragStyle,
      }}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 py-1">
        {projectColor && (
          <ColorDot color={projectColor} size="sm" />
        )}
        <span
          className={[
            'flex-1 text-[var(--fs-item)] text-[var(--foreground)] truncate leading-tight',
            isCompleted ? 'line-through text-[var(--muted-foreground)]' : '',
          ].join(' ')}
        >
          {title}
        </span>
        {item?.scheduledStartTime && (
          <span className="text-[10px] text-[var(--muted-foreground)] leading-tight flex-shrink-0">
            {formatTime(item.scheduledStartTime)}
          </span>
        )}
      </div>

      {/* Completed: hover to uncomplete */}
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

      {/* Not completed: hover overlay with grip + edit/complete/delete */}
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
          {/* Grip handle for dragging */}
          <div
            {...listeners}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition-colors pointer-events-auto cursor-grab active:cursor-grabbing"
            title="드래그하여 이동"
          >
            <GripVertical size={11} />
          </div>
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
