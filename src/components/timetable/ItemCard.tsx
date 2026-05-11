'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, SkipForward, Repeat, RefreshCw, Trash2, Clock, Pencil, GripVertical } from 'lucide-react';
import { ScheduledItem, Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Badge from '@/components/ui/Badge';
import { useLocale } from '@/i18n/context';

interface ItemCardProps {
  item: ScheduledItem;
  project?: Project | null;
  projects?: Project[];
  projectColor?: string;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUpdateTitle?: (item: ScheduledItem, title: string) => void;
  onUpdateProject?: (item: ScheduledItem, projectId: string | null) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
  onItemSelect?: (item: ScheduledItem) => void;
  onEditRecurrence?: (item: ScheduledItem) => void;
  isHighlighted?: boolean;
}

function getXpForPriority(priority: number): number {
  return priority === 1 ? 3 : priority === 2 ? 2 : 1;
}

export default function ItemCard({
  item,
  project,
  projects,
  projectColor,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUpdateTitle,
  onUpdateProject,
  onUncomplete,
  isReadOnly,
  onItemSelect,
  onEditRecurrence,
  isHighlighted,
}: ItemCardProps) {
  const { t } = useLocale();
  const isRecurring = !!item.recurrenceParentId || !!item.recurrence;
  const isCompleted = !!item.completedAt;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { item, isRoutineInstance: false },
    disabled: isReadOnly || isCompleted || isRecurring,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const title = 'title' in item ? item.title : '';
  const deferCount = 'deferCount' in item ? item.deferCount : 0;
  const origin = item.origin;
  const slotPriority = item.slot?.priority ?? 3;
  const xp = getXpForPriority(slotPriority);
  const continueCount = 'continueCount' in item ? (item as { continueCount?: number }).continueCount ?? 0 : 0;
  const timerSeconds = 'timerSeconds' in item ? (item as { timerSeconds?: number }).timerSeconds : undefined;

  const activeProjects = (projects ?? []).filter((p) => !p.archived);

  // 편집 모드 (제목 + 프로젝트)
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 프로젝트 드롭다운
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const startEdit = () => {
    setEditValue(title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    setEditing(false);
    setProjectDropdownOpen(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title && onUpdateTitle) {
      onUpdateTitle(item, trimmed);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue(title);
    setProjectDropdownOpen(false);
  };

  const openProjectDropdown = useCallback(() => {
    if (!tagRef.current) return;
    const rect = tagRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setProjectDropdownOpen(true);
  }, []);

  const selectProject = (projectId: string | null) => {
    if (onUpdateProject) {
      onUpdateProject(item, projectId);
    }
    setProjectDropdownOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    if (!projectDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          tagRef.current && !tagRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [projectDropdownOpen]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'group relative p-2.5 rounded-lg h-full',
        isCompleted ? 'bg-transparent' : 'bg-[var(--surface-inset)]',
        isHighlighted && !isCompleted ? 'animate-highlight' : '',
      ].join(' ')}
    >

      {/* Content */}
      <div className={['relative flex flex-col gap-1.5', isCompleted ? 'opacity-60' : ''].join(' ')}>
        {/* 상단: 프로젝트 태그 */}
        <div className="flex items-center gap-1.5" style={{ pointerEvents: editing ? 'auto' : 'none' }}>
          {editing ? (
            /* 편집 모드 — 프로젝트 변경 가능 */
            <button
              ref={tagRef}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={(e) => { e.stopPropagation(); projectDropdownOpen ? setProjectDropdownOpen(false) : openProjectDropdown(); }}
              className={[
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                'border border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-colors',
                project ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
              ].join(' ')}
              style={project ? { backgroundColor: 'var(--surface-hover)', color: project.color } : { backgroundColor: 'var(--muted)' }}
            >
              <ColorDot color={project?.color ?? '#8A8A8A'} size="sm" />
              <span className="truncate max-w-[60px]">{project?.name ?? t.uncategorized}</span>
            </button>
          ) : project ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: 'var(--surface-hover)',
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
              <span>{t.uncategorized}</span>
            </span>
          )}

          {/* 프로젝트 드롭다운 — Portal */}
          {editing && projectDropdownOpen && dropdownPos && createPortal(
            <div
              ref={dropdownRef}
              className={[
                'fixed z-[9999]',
                'w-44 rounded-[calc(var(--radius)*1.4)] border border-[var(--border)]',
                'bg-[var(--popover)] shadow-xl overflow-hidden',
                'animate-[status-appear_0.12s_ease_forwards]',
              ].join(' ')}
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              role="listbox"
              aria-label={t.changeProject}
            >
              {activeProjects.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.stopPropagation(); selectProject(p.id); }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5',
                    'text-[var(--fs-tag)] text-left transition-colors duration-100',
                    project?.id === p.id
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                      : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                  ].join(' ')}
                  role="option"
                  aria-selected={project?.id === p.id}
                >
                  <ColorDot color={p.color} size="sm" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              {activeProjects.length > 0 && (
                <div className="border-t border-[var(--border)]" />
              )}
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); selectProject(null); }}
                className={[
                  'w-full flex items-center gap-2 px-3 py-1.5',
                  'text-[var(--fs-tag)] text-left transition-colors duration-100',
                  !project
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]',
                ].join(' ')}
                role="option"
                aria-selected={!project}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] inline-block" />
                <span>{t.uncategorized}</span>
              </button>
            </div>,
            document.body,
          )}
        </div>

        {/* 제목 */}
        <div className="flex items-start gap-2" style={{ pointerEvents: editing ? 'auto' : 'none' }}>
          <div className="flex-1 min-w-0 flex items-center gap-1">
            {editing ? (
              <>
                <textarea
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => { if (!projectDropdownOpen) commitEdit(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); commitEdit(); }
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  rows={1}
                  onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
                  className="flex-1 text-[var(--fs-item)] font-medium text-[var(--card-foreground)] leading-snug bg-transparent border-b border-[var(--accent)] outline-none resize-none"
                />
                {onEditRecurrence && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); commitEdit(); onEditRecurrence(item); }}
                    className={[
                      'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-[var(--radius)] transition-colors',
                      isRecurring
                        ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                    ].join(' ')}
                    title={t.recurrenceSettings}
                  >
                    <Repeat size={13} strokeWidth={2} />
                  </button>
                )}
              </>
            ) : (
              <p
                className={[
                  'text-[var(--fs-item)] font-medium leading-snug whitespace-pre-wrap break-words',
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
            {isRecurring && (
              <span title={t.repeat}><Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)]" /></span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isCompleted && timerSeconds && timerSeconds > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--muted-foreground)]">
                <Clock size={9} />
                {Math.floor(timerSeconds / 60)}m
              </span>
            )}
            {isCompleted && origin !== 'continued' ? (
              <span className="text-[11px] font-bold" style={{ color: 'var(--g-success)' }}>+{xp}xp</span>
            ) : origin !== 'continued' ? (
              <span className="text-[11px] font-medium opacity-50" style={{ color: 'var(--primary)' }}>{xp}xp</span>
            ) : null}
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
          title={t.undoComplete}
        >
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{t.undoComplete}</span>
        </button>
      )}

      {/* Hover action overlay */}
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
          {(onUpdateTitle || onUpdateProject) && (
            <button
              onClick={(e) => { e.stopPropagation(); startEdit(); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
              title={t.edit}
            >
              <Pencil size={13} />
            </button>
          )}
          {!isRecurring && (
            <button
              onClick={(e) => { e.stopPropagation(); onDefer(item); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
              title={t.defer}
            >
              <SkipForward size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity pointer-events-auto"
            title={t.complete}
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
          {!isRecurring && (
            <button
              onClick={(e) => { e.stopPropagation(); onRepeat(item); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
              title={t.redo}
            >
              <RefreshCw size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--g-error)]/10 hover:text-[var(--g-error)] transition-colors pointer-events-auto"
              title={t.delete}
            >
              <Trash2 size={13} />
            </button>
          )}
          {!isRecurring && (
            <div
              {...listeners}
              {...attributes}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)] transition-colors pointer-events-auto cursor-grab active:cursor-grabbing"
              title={t.dragToMove}
            >
              <GripVertical size={14} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
