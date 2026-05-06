'use client';

import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, SkipForward, Repeat, Trash2 } from 'lucide-react';
import { ScheduledItem } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Badge from '@/components/ui/Badge';

interface ItemCardProps {
  item: ScheduledItem;
  projectColor?: string;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUpdateTitle?: (item: ScheduledItem, title: string) => void;
  isReadOnly?: boolean;
}

export default function ItemCard({
  item,
  projectColor,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUpdateTitle,
  isReadOnly,
}: ItemCardProps) {
  const isRoutineInstance = 'routineDetails' in item && item.routineDetails !== undefined;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item, isRoutineInstance },
    disabled: isReadOnly,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const title = 'title' in item ? item.title : '';
  const deferCount = 'deferCount' in item ? item.deferCount : 0;
  const origin = 'origin' in item ? (item as { origin?: string }).origin as 'deferred' | 'repeated' | undefined : undefined;

  // Inline title edit
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (!onUpdateTitle) return;
    setEditValue(title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title && onUpdateTitle) {
      onUpdateTitle(item, trimmed);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue(title);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative p-2.5 rounded-lg bg-[var(--surface-inset)] h-full"
    >
      {/* Drag handle */}
      {!editing && (
        <div
          {...listeners}
          {...attributes}
          className="absolute inset-0 rounded-lg cursor-grab active:cursor-grabbing"
        />
      )}

      {/* Content */}
      <div className="relative flex items-start gap-2 pointer-events-none">
        {projectColor && <ColorDot color={projectColor} size="sm" className="mt-1" />}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="w-full text-[var(--fs-item)] font-medium text-[var(--card-foreground)] leading-snug bg-transparent border-b border-[var(--accent)] outline-none pointer-events-auto"
            />
          ) : (
            <p
              className="text-[var(--fs-item)] font-medium text-[var(--card-foreground)] leading-snug truncate"
              onDoubleClick={(e) => { e.stopPropagation(); startEdit(); }}
              style={{ pointerEvents: 'auto' }}
            >
              {title}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            {(deferCount > 0 || origin) && (
              <Badge count={deferCount} origin={origin} />
            )}
            {isRoutineInstance && (
              <span title="루틴"><Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)]" /></span>
            )}
          </div>
        </div>
      </div>

      {/* Hover action overlay — icons only */}
      {!editing && !isReadOnly && (
        <div
          className={[
            'absolute inset-0 rounded-lg',
            'flex items-center justify-center gap-1.5',
            'bg-[var(--surface-inset)]/95 backdrop-blur-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'pointer-events-none',
          ].join(' ')}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--accent)] text-white hover:opacity-90 transition-opacity pointer-events-auto"
            title="완료"
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDefer(item); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
            title="미루기"
          >
            <SkipForward size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRepeat(item); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
            title="반복"
          >
            <Repeat size={14} />
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-red-100 hover:text-red-500 transition-colors pointer-events-auto"
              title="삭제"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
