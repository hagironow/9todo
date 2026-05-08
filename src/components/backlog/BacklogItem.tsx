'use client';

import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Repeat, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Task, RoutineInstance, Project } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ColorDot from '@/components/ui/ColorDot';

type BacklogEntry = Task | RoutineInstance;

interface BacklogItemProps {
  item: BacklogEntry;
  title: string;
  deferCount: number;
  isRoutine?: boolean;
  project?: Project | null;
  onPlaceInSlot: (item: BacklogEntry) => void;
  onUpdateTitle?: (item: BacklogEntry, title: string) => void;
  onDelete?: (item: BacklogEntry) => void;
  isReadOnly?: boolean;
}

export default function BacklogItem({
  item,
  title,
  deferCount,
  isRoutine = false,
  project,
  onPlaceInSlot,
  onUpdateTitle,
  onDelete,
  isReadOnly,
}: BacklogItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

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

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title && onUpdateTitle) {
      onUpdateTitle(item, trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'relative flex items-center gap-2 px-3 py-2',
        'border-b border-[var(--border)] last:border-b-0',
        'hover:bg-[var(--muted)] transition-colors duration-100',
        'group',
      ].join(' ')}
      onClick={() => {
        // 모바일: 전체 영역 탭 시 슬롯 배치
        if (!isReadOnly && window.innerWidth < 768) onPlaceInSlot(item);
      }}
    >
      {/* 드래그 핸들 — 모바일 숨김 */}
      <button
        {...listeners}
        {...attributes}
        className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-grab active:cursor-grabbing hidden md:block"
        aria-label="드래그하여 이동"
      >
        <GripVertical size={14} strokeWidth={1.5} />
      </button>

      {/* 프로젝트 태그 + 제목 + 배지 */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {isRoutine ? (
          <span title="루틴" className="flex-shrink-0"><Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)]" /></span>
        ) : (
          <span
            className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
            style={project ? { backgroundColor: 'var(--surface-hover)', color: project.color } : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            <ColorDot color={project?.color ?? '#8A8A8A'} size="sm" />
            <span className="max-w-[60px] truncate">{project?.name ?? '미분류'}</span>
          </span>
        )}
        {editing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitEdit();
              if (e.key === 'Escape') { setEditValue(title); setEditing(false); }
            }}
            className="flex-1 text-[var(--fs-item)] text-[var(--foreground)] bg-transparent outline-none border-b border-[var(--accent)]"
          />
        ) : (
          <span className="text-[var(--fs-item)] text-[var(--foreground)] truncate">
            {title}
          </span>
        )}
        {(deferCount > 0 || origin) && (
          <Badge count={deferCount} origin={origin} />
        )}
      </div>

      {/* 호버 액션 버튼 */}
      {!isReadOnly && (
        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlaceInSlot(item)}
            className="flex-shrink-0 text-[var(--fs-tag)] bg-[var(--muted)]"
          >
            슬롯 배치
          </Button>
          {onUpdateTitle && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditValue(title); setEditing(true); }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              title="수정"
            >
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-100 transition-colors"
              title="삭제"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
