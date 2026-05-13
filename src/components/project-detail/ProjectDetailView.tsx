'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, SkipForward, RefreshCw, Trash2, Repeat } from 'lucide-react';
import type { Project, Task, ScheduledItem, RoutineInstance, Routine, Note } from '@/lib/types';
import { COLOR_THEMES, resolveColor } from '@/lib/colors';
import { useLocale } from '@/i18n/context';

const TASK_PAGE_SIZE = 10;

interface ProjectDetailViewProps {
  project: Project;
  tasks: Task[];
  routines: Routine[];
  routineInstances: RoutineInstance[];
  notes: Note[];
  onAddNote: (projectId: string, content: string) => void;
  onRemoveNote: (noteId: string) => void;
  colorTheme?: string;
  onUpdateColor?: (projectId: string, colorIndex: number) => void;
  onComplete?: (item: ScheduledItem) => void;
  onDefer?: (item: ScheduledItem) => void;
  onRepeat?: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
}

/** 프로젝트 상세 — 태스크 목록 + 포커스 타임 + XP + 노트 */
export default function ProjectDetailView({
  project,
  tasks,
  routines,
  routineInstances,
  notes,
  onAddNote,
  onRemoveNote,
  colorTheme = 'vivid',
  onUpdateColor,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUncomplete,
}: ProjectDetailViewProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const dotRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const theme = COLOR_THEMES.find((th) => th.id === colorTheme) ?? COLOR_THEMES[0];

  const openColorPicker = () => {
    if (!dotRef.current || !onUpdateColor) return;
    const rect = dotRef.current.getBoundingClientRect();
    setPickerPos({ top: rect.bottom + 6, left: rect.left });
    setColorPickerOpen(true);
  };

  useEffect(() => {
    if (!colorPickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
          dotRef.current && !dotRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [colorPickerOpen]);

  const isUnassigned = project.id === '__unassigned__';

  // 이 프로젝트에 속한 태스크만
  const projectTasks = useMemo(
    () => tasks.filter((task) => isUnassigned ? !task.projectId : task.projectId === project.id),
    [tasks, project.id, isUnassigned],
  );

  // 이 프로젝트에 속한 루틴/인스턴스
  const projectRoutines = useMemo(
    () => isUnassigned ? [] : routines.filter((r) => r.projectId === project.id),
    [routines, project.id, isUnassigned],
  );
  const projectRoutineIds = useMemo(
    () => new Set(projectRoutines.map((r) => r.id)),
    [projectRoutines],
  );
  const projectInstances = useMemo(
    () => routineInstances.filter((ri) => projectRoutineIds.has(ri.routineId)),
    [routineInstances, projectRoutineIds],
  );

  // 이 프로젝트의 노트 (최신순)
  const projectNotes = useMemo(
    () =>
      (notes ?? [])
        .filter((n) => isUnassigned ? n.projectId === '__unassigned__' : n.projectId === project.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, project.id, isUnassigned],
  );

  // 통계
  const stats = useMemo(() => {
    const completed = projectTasks.filter((task) => task.completedAt);

    const totalSeconds = projectTasks.reduce(
      (acc, task) => acc + (task.timerSeconds ?? 0),
      0,
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let xp = 0;
    for (const task of completed) {
      if (task.slot) {
        xp += task.slot.priority === 1 ? 3 : task.slot.priority === 2 ? 2 : 1;
      }
    }
    for (const ri of projectInstances) {
      if (ri.completedAt) xp += 1;
    }

    const routineCompletedCount = projectInstances.filter(
      (ri) => ri.completedAt,
    ).length;

    return {
      total: projectTasks.length,
      completed: completed.length,
      hours,
      minutes,
      xp,
      routineCompletedCount,
    };
  }, [projectTasks, projectInstances]);

  // 그룹핑: lineageId + recurrenceParentId 기준 — 대표 1개만 표시
  const groupedTasks = useMemo(() => {
    // 반복 부모 태스크(recurrence 설정 있음)는 대표로 직접 표시, 인스턴스는 숨김
    const recurringParentIds = new Set(
      projectTasks.filter((t) => t.recurrence).map((t) => t.id),
    );
    // 반복 인스턴스별 완료 횟수 집계
    const recurringCompletedMap = new Map<string, number>();
    for (const t of projectTasks) {
      if (!t.recurrenceParentId || !recurringParentIds.has(t.recurrenceParentId)) continue;
      if (t.completedAt) {
        recurringCompletedMap.set(t.recurrenceParentId, (recurringCompletedMap.get(t.recurrenceParentId) ?? 0) + 1);
      }
    }

    // 반복 인스턴스 제외한 태스크만 그룹핑
    const nonInstanceTasks = projectTasks.filter(
      (t) => !t.recurrenceParentId || !recurringParentIds.has(t.recurrenceParentId),
    );

    const lineageMap = new Map<string, Task[]>();
    const standalone: Task[] = [];
    for (const task of nonInstanceTasks) {
      if (task.lineageId) {
        const arr = lineageMap.get(task.lineageId) ?? [];
        arr.push(task);
        lineageMap.set(task.lineageId, arr);
      } else {
        standalone.push(task);
      }
    }
    const result: { task: Task; lineageCount: number; recurringCompleted?: number }[] = [];
    for (const task of standalone) {
      result.push({
        task,
        lineageCount: 0,
        recurringCompleted: recurringCompletedMap.get(task.id),
      });
    }
    for (const [, group] of lineageMap) {
      const sorted = [...group].sort((a, b) => {
        if (!a.completedAt && b.completedAt) return -1;
        if (a.completedAt && !b.completedAt) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      result.push({ task: sorted[0], lineageCount: group.length });
    }
    result.sort((a, b) => {
      // 반복 부모는 상단에
      const aRecur = !!a.task.recurrence;
      const bRecur = !!b.task.recurrence;
      if (aRecur !== bRecur) return aRecur ? -1 : 1;
      if (!a.task.completedAt && b.task.completedAt) return -1;
      if (a.task.completedAt && !b.task.completedAt) return 1;
      return (b.task.date ?? '').localeCompare(a.task.date ?? '');
    });
    return result;
  }, [projectTasks]);

  // 완료 필터 적용
  const filteredTasks = useMemo(
    () => hideCompleted ? groupedTasks.filter(({ task }) => !task.completedAt) : groupedTasks,
    [groupedTasks, hideCompleted],
  );

  const visibleTasks = expanded
    ? filteredTasks
    : filteredTasks.slice(0, TASK_PAGE_SIZE);
  const hasMore = filteredTasks.length > TASK_PAGE_SIZE;

  const formatTime = (h: number, m: number) => {
    if (h === 0 && m === 0) return '0m';
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const handleAddNote = () => {
    const trimmed = noteInput.trim();
    if (!trimmed) return;
    onAddNote(project.id, trimmed);
    setNoteInput('');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          ref={dotRef}
          onClick={openColorPicker}
          className="w-4 h-4 rounded-full shrink-0 cursor-pointer hover:scale-125 transition-transform"
          style={{ backgroundColor: project.color }}
          title={t.changeColor}
        />
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {project.name}
        </h2>

        {/* 컬러 피커 팝오버 */}
        {colorPickerOpen && pickerPos && createPortal(
          <div
            ref={pickerRef}
            className="fixed z-[9999] flex gap-2 p-2.5 rounded-[var(--radius)] bg-[var(--popover)] border border-[var(--border)] shadow-xl animate-[status-appear_0.12s_ease_forwards]"
            style={{ top: pickerPos.top, left: pickerPos.left }}
          >
            {theme.colors.map((_, idx) => {
              const hex = resolveColor(idx, colorTheme);
              const isActive = project.colorIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onUpdateColor?.(project.id, idx);
                    setColorPickerOpen(false);
                  }}
                  className={[
                    'w-7 h-7 rounded-full transition-all duration-150',
                    isActive
                      ? 'ring-2 ring-offset-2 ring-offset-[var(--popover)] ring-[var(--foreground)] scale-110'
                      : 'hover:scale-110',
                  ].join(' ')}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>,
          document.body,
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={t.completionRatio}
          value={`${stats.completed} / ${stats.total}`}
          sub={
            stats.total > 0
              ? `${Math.round((stats.completed / stats.total) * 100)}%`
              : undefined
          }
        />
        <StatCard
          label={t.focusTime}
          value={formatTime(stats.hours, stats.minutes)}
        />
        <StatCard label={t.earnedXP} value={`${stats.xp}`} color="var(--g-success)" />
      </div>

      {/* 태스크 목록 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            {t.tasks} ({filteredTasks.length})
          </h3>
          {groupedTasks.some(({ task }) => task.completedAt) && (
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {hideCompleted ? t.showCompleted : t.hideCompleted}
            </button>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-6 text-center">
            {t.noTasksYet}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {visibleTasks.map(({ task, lineageCount, recurringCompleted }) => (
              <TaskRow
                key={task.id}
                task={task}
                lineageCount={lineageCount}
                recurringCompleted={recurringCompleted}
                onComplete={onComplete}
                onDefer={onDefer}
                onRepeat={onRepeat}
                onDelete={onDelete}
                onUncomplete={onUncomplete}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-[var(--accent)] hover:underline self-start mt-1"
          >
            {expanded
              ? t.collapse
              : t.showMore(filteredTasks.length - TASK_PAGE_SIZE)}
          </button>
        )}

      </div>

      {/* 루틴 목록 */}
      {projectRoutines.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            {t.routines} ({projectRoutines.length})
          </h3>
          <div className="flex flex-col gap-1">
            {projectRoutines.map((routine) => {
              const instanceCount = projectInstances.filter(
                (ri) => ri.routineId === routine.id,
              ).length;
              const completedCount = projectInstances.filter(
                (ri) => ri.routineId === routine.id && ri.completedAt,
              ).length;
              return (
                <RoutineRow
                  key={routine.id}
                  routine={routine}
                  instanceCount={instanceCount}
                  completedCount={completedCount}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 노트 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          {t.notes} ({projectNotes.length})
        </h3>

        {/* 노트 입력 */}
        <div className="flex gap-2">
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={t.noteInputPlaceholderProject}
            rows={2}
            className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent text-[var(--foreground)] outline-none focus:border-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteInput.trim()}
            className="px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)] border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] disabled:opacity-40 hover:opacity-90 transition-opacity self-end"
          >
            {t.save}
          </button>
        </div>

        {/* 노트 목록 */}
        {projectNotes.length > 0 && (
          <div className="flex flex-col gap-1">
            {projectNotes.map((note) => (
              <NoteRow key={note.id} note={note} onRemove={onRemoveNote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 통계 카드 ── */
function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] p-4 flex flex-col gap-1">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span
        className="text-xl font-bold"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs text-[var(--muted-foreground)]">{sub}</span>
      )}
    </div>
  );
}

/* ── 태스크 행 ── */
function TaskRow({
  task,
  lineageCount,
  recurringCompleted,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUncomplete,
}: {
  task: Task;
  lineageCount: number;
  recurringCompleted?: number;
  onComplete?: (item: ScheduledItem) => void;
  onDefer?: (item: ScheduledItem) => void;
  onRepeat?: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
}) {
  const { t } = useLocale();
  const done = !!task.completedAt;
  const isRecurring = !!task.recurrence;
  const timeLabel = isRecurring
    ? t.recurringTask
    : task.slot
    ? `${task.slot.period === 'morning' ? t.morningAbbr : task.slot.period === 'afternoon' ? t.afternoonAbbr : t.eveningAbbr} P${task.slot.priority}`
    : t.backlog;

  const timer = task.timerSeconds
    ? `${Math.floor(task.timerSeconds / 60)}m`
    : null;

  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] ${
        done ? 'bg-[var(--card)] opacity-60' : 'bg-[var(--card)]'
      }`}
    >
      <span
        className="text-sm w-5 text-center shrink-0"
        style={done ? { color: 'var(--g-success)' } : undefined}
      >
        {done ? '✓' : '○'}
      </span>
      <span
        className={`flex-1 text-sm truncate ${
          done
            ? 'line-through text-[var(--muted-foreground)]'
            : 'text-[var(--foreground)]'
        }`}
      >
        {task.title}
        {lineageCount > 1 && (
          <span className="ml-1.5 text-xs text-[var(--muted-foreground)] font-medium">
            ({lineageCount})
          </span>
        )}
      </span>
      {isRecurring ? (
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] shrink-0">
          <Repeat size={11} strokeWidth={1.8} />
          {timeLabel}
          {(recurringCompleted ?? 0) > 0 && (
            <span className="text-[var(--accent)]">
              {recurringCompleted}{t.completionCount(recurringCompleted!).replace(String(recurringCompleted), '')}
            </span>
          )}
        </span>
      ) : (
        <>
          <span className="text-xs text-[var(--muted-foreground)] shrink-0">
            {task.date ?? t.backlog}
          </span>
          <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-16 text-right">
            {timeLabel}
          </span>
        </>
      )}
      {timer && (
        <span className="text-xs text-[var(--accent)] shrink-0 w-10 text-right">
          {timer}
        </span>
      )}

      {/* 호버 액션 오버레이 */}
      <div
        className={[
          'absolute inset-0 rounded-[var(--radius-sm)]',
          'flex items-center justify-center gap-1.5',
          'bg-[var(--card)]/95 backdrop-blur-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'pointer-events-none',
        ].join(' ')}
      >
        {done ? (
          onUncomplete && (
            <button
              onClick={() => onUncomplete(task)}
              className="px-3 py-1 text-[12px] font-medium text-[var(--muted-foreground)] rounded-full bg-[var(--muted)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
            >
              {t.undoComplete}
            </button>
          )
        ) : (
          <>
            {onDefer && (
              <button
                onClick={() => onDefer(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
                title={t.defer}
                aria-label={t.defer}
              >
                <SkipForward size={14} />
              </button>
            )}
            {onComplete && (
              <button
                onClick={() => onComplete(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity pointer-events-auto"
                title={t.complete}
                aria-label={t.complete}
              >
                <Check size={14} strokeWidth={2.5} />
              </button>
            )}
            {onRepeat && (
              <button
                onClick={() => onRepeat(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
                title={t.redo}
                aria-label={t.redo}
              >
                <RefreshCw size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--g-error)]/10 hover:text-[var(--g-error)] transition-colors pointer-events-auto"
                title={t.delete}
                aria-label={t.delete}
              >
                <Trash2 size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── 루틴 행 ── */
function RoutineRow({
  routine,
  instanceCount,
  completedCount,
}: {
  routine: Routine;
  instanceCount: number;
  completedCount: number;
}) {
  const { t } = useLocale();
  const recurrenceLabel =
    routine.recurrence === 'daily'
      ? t.frequency.daily
      : routine.recurrence === 'weekly'
        ? routine.daysOfWeek?.length
          ? `${t.frequency.weekly} ${routine.daysOfWeek.map((d) => t.weekdaysSingle[d]).join('·')}`
          : t.frequency.weekly
        : routine.recurrence === 'biweekly'
          ? t.frequency.biweekly
          : t.frequency.monthly;

  const slotLabel = `${routine.defaultSlot.period === 'morning' ? t.morningAbbr : routine.defaultSlot.period === 'afternoon' ? t.afternoonAbbr : t.eveningAbbr} P${routine.defaultSlot.priority}`;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--card)]">
      <span
        className="text-sm w-5 text-center shrink-0"
        style={{ color: routine.isActive ? 'var(--g-success)' : 'var(--muted-foreground)' }}
      >
        {routine.isActive ? '↻' : '—'}
      </span>
      <span className="flex-1 text-sm text-[var(--foreground)] truncate">
        {routine.title}
      </span>
      <span className="text-xs text-[var(--muted-foreground)] shrink-0">
        {recurrenceLabel}
      </span>
      <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-16 text-right">
        {slotLabel}
      </span>
      {completedCount > 0 && (
        <span className="text-xs shrink-0 w-10 text-right" style={{ color: 'var(--g-success)' }}>
          {t.completionCount(completedCount)}
        </span>
      )}
    </div>
  );
}

/* ── 노트 행 ── */
function NoteRow({
  note,
  onRemove,
}: {
  note: Note;
  onRemove: (id: string) => void;
}) {
  const { t } = useLocale();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dateStr = new Date(note.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="group flex items-start gap-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--card)]">
        <span className="flex-1 text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
          {note.content}
        </span>
        <span className="text-xs text-[var(--muted-foreground)] shrink-0 pt-0.5">
          {dateStr}
        </span>
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5"
        >
          ×
        </button>
      </div>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-xl w-72 flex flex-col gap-3">
            <p className="font-semibold text-[var(--foreground)]">{t.deleteNoteConfirm}</p>
            <p className="text-sm text-[var(--muted-foreground)]">{t.deleteNoteWarning}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
              <button onClick={() => { onRemove(note.id); setConfirmDelete(false); }} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85">{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
