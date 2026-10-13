'use client';

import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Repeat, GripVertical, Pencil, Trash2, CalendarCheck } from 'lucide-react';
import { Task, RoutineInstance, Project, WeekPriority } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ColorDot from '@/components/ui/ColorDot';
import ProjectPicker from '@/components/quick-input/ProjectPicker';
import WeekPriorityPicker from '@/components/week/WeekPriorityPicker';
import { useLocale } from '@/i18n/context';
import { useImeEnterSubmit } from '@/hooks/useImeEnterSubmit';

type BacklogEntry = Task | RoutineInstance;

interface BacklogItemProps {
  item: BacklogEntry;
  title: string;
  deferCount: number;
  isRoutine?: boolean;
  project?: Project | null;
  /** 프로젝트 태그 클릭으로 변경할 때 필요한 전체 목록 */
  projects?: Project[];
  onUpdateProject?: (item: BacklogEntry, projectId: string | null) => void;
  onPlaceInSlot: (item: BacklogEntry) => void;
  onUpdateTitle?: (item: BacklogEntry, title: string) => void;
  onDelete?: (item: BacklogEntry) => void;
  isReadOnly?: boolean;
  /** '이번 주'에 들어있는지 */
  inWeek?: boolean;
  /** 이번 주에 담기 / 우선순위 변경 */
  onSetWeek?: (item: BacklogEntry, priority: WeekPriority) => void;
  /** 이번 주에서 빼기 */
  onRemoveWeek?: (item: BacklogEntry) => void;
}

export default function BacklogItem({
  item,
  title,
  deferCount,
  isRoutine = false,
  project,
  projects,
  onUpdateProject,
  onPlaceInSlot,
  onUpdateTitle,
  onDelete,
  isReadOnly,
  inWeek = false,
  onSetWeek,
  onRemoveWeek,
}: BacklogItemProps) {
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const projectAnchorRef = useRef<HTMLButtonElement>(null);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

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

  const commitEdit = (value: string = editValue) => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title && onUpdateTitle) {
      onUpdateTitle(item, trimmed);
    }
    setEditing(false);
  };

  const ime = useImeEnterSubmit<HTMLTextAreaElement>(commitEdit, { allowShiftNewline: true });

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
          <span title={t.routine} className="flex-shrink-0"><Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)]" /></span>
        ) : (
          <button
            ref={projectAnchorRef}
            type="button"
            disabled={!onUpdateProject || isReadOnly}
            onClick={(e) => {
              e.stopPropagation();
              setProjectPickerOpen((v) => !v);
            }}
            className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-opacity enabled:hover:opacity-70 disabled:cursor-default"
            style={project ? { backgroundColor: 'var(--surface-hover)', color: project.color } : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
            title={onUpdateProject ? t.selectProject : undefined}
          >
            <ColorDot color={project?.color ?? '#8A8A8A'} size="sm" />
            <span className="max-w-[60px] truncate">{project?.name ?? t.uncategorized}</span>
          </button>
        )}
        {projectPickerOpen && onUpdateProject && (
          <ProjectPicker
            projects={projects ?? []}
            selectedId={project?.id ?? null}
            onSelect={(selected) => onUpdateProject(item, selected?.id ?? null)}
            onClose={() => setProjectPickerOpen(false)}
            anchorRef={projectAnchorRef}
          />
        )}
        {editing ? (
          <textarea
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit()}
            onCompositionEnd={ime.onCompositionEnd}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setEditValue(title); setEditing(false); return; }
              ime.onKeyDown(e);
            }}
            rows={1}
            onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
            className="flex-1 text-[15px] text-[var(--foreground)] bg-transparent outline-none border-b border-[var(--accent)] resize-none"
          />
        ) : (
          <span className="text-[15px] text-[var(--foreground)] whitespace-pre-wrap break-words">
            {title}
          </span>
        )}
        {(deferCount > 0 || origin) && (
          <Badge count={deferCount} origin={origin} />
        )}
      </div>

      {/* 이번 주 담기 — 우선순위 선택 */}
      {weekPickerOpen && onSetWeek && (
        <div
          className="absolute left-0 right-0 top-full z-20 flex flex-wrap items-center gap-2 px-3 py-2 bg-[var(--popover)] border border-[var(--border)] rounded-[var(--radius)] shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
            {t.weekView}
          </span>
          <WeekPriorityPicker
            size="sm"
            value={inWeek ? (item as Task).weekPriority ?? 'normal' : undefined}
            onChange={(p) => { onSetWeek(item, p); setWeekPickerOpen(false); }}
            onRemove={
              inWeek && onRemoveWeek
                ? () => { onRemoveWeek(item); setWeekPickerOpen(false); }
                : undefined
            }
          />
        </div>
      )}

      {/* 호버 액션 버튼 */}
      {!isReadOnly && (
        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onSetWeek && (
            <button
              onClick={(e) => { e.stopPropagation(); setWeekPickerOpen((v) => !v); }}
              className={[
                'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
                inWeek
                  ? 'text-[var(--accent)] hover:bg-[var(--accent)]/10'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)]',
              ].join(' ')}
              title={inWeek ? t.removeFromWeek : t.addToWeek}
              aria-label={inWeek ? t.removeFromWeek : t.addToWeek}
            >
              <CalendarCheck size={13} />
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPlaceInSlot(item)}
            className="flex-shrink-0 text-[var(--fs-tag)] bg-[var(--muted)]"
          >
            {t.slotArrange}
          </Button>
          {onUpdateTitle && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditValue(title); setEditing(true); }}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              title={t.edit}
              aria-label={t.edit}
            >
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--g-error)] hover:bg-[var(--g-error)]/10 transition-colors"
              title={t.delete}
              aria-label={t.delete}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
