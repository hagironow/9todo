'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Repeat, GripVertical } from 'lucide-react';
import { Task, RoutineInstance } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type BacklogEntry = Task | RoutineInstance;

interface BacklogItemProps {
  item: BacklogEntry;
  title: string;
  deferCount: number;
  isRoutine?: boolean;
  onPlaceInSlot: (item: BacklogEntry) => void;
  isReadOnly?: boolean;
}

export default function BacklogItem({
  item,
  title,
  deferCount,
  isRoutine = false,
  onPlaceInSlot,
  isReadOnly,
}: BacklogItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item, isRoutineInstance: isRoutine, fromBacklog: true },
    disabled: isReadOnly,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  const origin = 'origin' in item ? (item as { origin?: string }).origin as 'deferred' | 'repeated' | undefined : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-2 px-3 py-2',
        'border-b border-[var(--border)] last:border-b-0',
        'hover:bg-[var(--muted)] transition-colors duration-100',
        'group',
      ].join(' ')}
    >
      {/* 드래그 핸들 */}
      <button
        {...listeners}
        {...attributes}
        className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-grab active:cursor-grabbing"
        aria-label="드래그하여 이동"
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </button>

      {/* 제목 + 배지 */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {isRoutine && (
          <span title="루틴"><Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)]" /></span>
        )}
        <span className="text-[var(--fs-item)] text-[var(--foreground)] truncate">
          {title}
        </span>
        {(deferCount > 0 || origin) && (
          <Badge count={deferCount} origin={origin} />
        )}
      </div>

      {/* 슬롯 배치 버튼 */}
      {!isReadOnly && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPlaceInSlot(item)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[var(--fs-tag)]"
        >
          슬롯 배치
        </Button>
      )}
    </div>
  );
}
