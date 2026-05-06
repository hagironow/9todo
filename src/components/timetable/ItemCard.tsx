'use client';

import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, SkipForward, Repeat, Trash2, Clock } from 'lucide-react';
import { ScheduledItem, Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Badge from '@/components/ui/Badge';

interface ItemCardProps {
  item: ScheduledItem;
  project?: Project | null;
  projectColor?: string;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUpdateTitle?: (item: ScheduledItem, title: string) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
  onItemSelect?: (item: ScheduledItem) => void;
}

function getXpForPriority(priority: number): number {
  return priority === 1 ? 3 : priority === 2 ? 2 : 1;
}

export default function ItemCard({
  item,
  project,
  projectColor,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUpdateTitle,
  onUncomplete,
  isReadOnly,
  onItemSelect,
}: ItemCardProps) {
  const isRoutineInstance = 'routineDetails' in item && item.routineDetails !== undefined;
  const isCompleted = !!item.completedAt;
  const resolvedColor = project?.color ?? projectColor;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item, isRoutineInstance },
    disabled: isReadOnly || isCompleted,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const title = 'title' in item ? item.title : '';
  const deferCount = 'deferCount' in item ? item.deferCount : 0;
  const origin = 'origin' in item ? (item as { origin?: string }).origin as 'deferred' | 'repeated' | undefined : undefined;
  const slotPriority = item.slot?.priority ?? 3;
  const xp = getXpForPriority(slotPriority);
  const continueCount = 'continueCount' in item ? (item as { continueCount?: number }).continueCount ?? 0 : 0;
  const timerSeconds = 'timerSeconds' in item ? (item as { timerSeconds?: number }).timerSeconds : undefined;

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
      className={[
        'group relative p-2.5 rounded-lg h-full',
        isCompleted ? 'bg-[var(--surface-inset)]/60' : 'bg-[var(--surface-inset)]',
      ].join(' ')}
    >
      {/* Drag handle */}
      {!editing && !isCompleted && (
        <div
          {...listeners}
          {...attributes}
          className="absolute inset-0 rounded-lg cursor-grab active:cursor-grabbing"
        />
      )}

      {/* Content */}
      <div className="relative flex flex-col gap-1.5">
        {/* 상단: 프로젝트 태그 (항상 표시 — 미분류 포함) */}
        <div className="flex items-center gap-1.5 pointer-events-none">
          {project ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: `${project.color}18`,
                color: project.color,
              }}
            >
              <ColorDot color={project.color} size="sm" />
              <span className="truncate max-w-[60px]">{project.name}</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-[var(--muted-foreground)]"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <span className="w-[6px] h-[6px] rounded-full bg-[var(--muted-foreground)] inline-block" />
              <span>미분류</span>
            </span>
          )}
        </div>

        {/* 제목 */}
        <div className="flex items-start gap-2 pointer-events-none">
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
                className={[
                  'text-[var(--fs-item)] font-medium leading-snug truncate',
                  isCompleted
                    ? 'line-through text-[var(--muted-foreground)]'
                    : 'text-[var(--card-foreground)]',
                ].join(' ')}
                onClick={(e) => { e.stopPropagation(); if (onItemSelect) onItemSelect(item); }}
                onDoubleClick={(e) => { e.stopPropagation(); startEdit(); }}
                style={{ pointerEvents: 'auto', cursor: onItemSelect ? 'pointer' : undefined }}
              >
                {title}
              </p>
            )}
          </div>
        </div>

        {/* 하단: 뱃지 + XP */}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            {(deferCount > 0 || continueCount > 0 || origin) && (
              <Badge count={deferCount} continueCount={continueCount} origin={origin} />
            )}
            {isRoutineInstance && (
              <span title="루틴"><Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)]" /></span>
            )}
          </div>
          {/* 타이머 기록 + XP 표시 */}
          <div className="flex items-center gap-1.5">
            {isCompleted && timerSeconds && timerSeconds > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                <Clock size={9} />
                {Math.floor(timerSeconds / 60)}m
              </span>
            )}
            {isCompleted ? (
              <span
                className="text-[11px] font-bold"
                style={{ color: 'var(--g-success)' }}
              >
                +{xp}xp
              </span>
            ) : (
              <span
                className="text-[11px] font-medium opacity-50"
                style={{ color: 'var(--primary)' }}
              >
                {xp}xp
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 완료 상태: 클릭하면 완료 취소 */}
      {!editing && !isReadOnly && isCompleted && onUncomplete && (
        <button
          onClick={(e) => { e.stopPropagation(); onUncomplete(item); }}
          className={[
            'absolute inset-0 rounded-lg cursor-pointer',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'bg-[var(--surface-inset)]/80 backdrop-blur-sm',
          ].join(' ')}
          title="완료 취소"
        >
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
            완료 취소
          </span>
        </button>
      )}

      {/* Hover action overlay — only for non-completed items */}
      {!editing && !isReadOnly && !isCompleted && (
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
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity pointer-events-auto"
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
