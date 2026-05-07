'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, SkipForward, RefreshCw, Trash2 } from 'lucide-react';
import type { Project, Task, ScheduledItem, RoutineInstance, Routine, Note } from '@/lib/types';
import { COLOR_THEMES, resolveColor } from '@/lib/colors';

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

/** 프로젝트 상세 — 태스크 목록 + 투입 시간 + XP + 노트 */
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
  const [expanded, setExpanded] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const dotRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const theme = COLOR_THEMES.find((t) => t.id === colorTheme) ?? COLOR_THEMES[0];

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

  // 이 프로젝트에 속한 태스크만
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id),
    [tasks, project.id],
  );

  // 이 프로젝트에 속한 루틴/인스턴스
  const projectRoutines = useMemo(
    () => routines.filter((r) => r.projectId === project.id),
    [routines, project.id],
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
        .filter((n) => n.projectId === project.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, project.id],
  );

  // 통계
  const stats = useMemo(() => {
    const completed = projectTasks.filter((t) => t.completedAt);

    const totalSeconds = projectTasks.reduce(
      (acc, t) => acc + (t.timerSeconds ?? 0),
      0,
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    let xp = 0;
    for (const t of completed) {
      if (t.slot) {
        xp += t.slot.priority === 1 ? 3 : t.slot.priority === 2 ? 2 : 1;
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

  // 최근순 정렬 (미완료 먼저, 날짜 역순)
  const sortedTasks = useMemo(() => {
    return [...projectTasks].sort((a, b) => {
      if (!a.completedAt && b.completedAt) return -1;
      if (a.completedAt && !b.completedAt) return 1;
      return b.date.localeCompare(a.date);
    });
  }, [projectTasks]);

  const visibleTasks = expanded
    ? sortedTasks
    : sortedTasks.slice(0, TASK_PAGE_SIZE);
  const hasMore = sortedTasks.length > TASK_PAGE_SIZE;

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
          title="컬러 변경"
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
          label="완료 / 전체"
          value={`${stats.completed} / ${stats.total}`}
          sub={
            stats.total > 0
              ? `${Math.round((stats.completed / stats.total) * 100)}%`
              : undefined
          }
        />
        <StatCard
          label="투입 시간"
          value={formatTime(stats.hours, stats.minutes)}
        />
        <StatCard label="획득 XP" value={`${stats.xp}`} accent />
      </div>

      {/* 태스크 목록 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          태스크 ({sortedTasks.length})
        </h3>

        {sortedTasks.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-6 text-center">
            아직 태스크가 없습니다
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
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
              ? '접기'
              : `더보기 (+${sortedTasks.length - TASK_PAGE_SIZE})`}
          </button>
        )}

        {stats.routineCompletedCount > 0 && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            + 루틴 {stats.routineCompletedCount}회 완료
          </p>
        )}
      </div>

      {/* 노트 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          노트 ({projectNotes.length})
        </h3>

        {/* 노트 입력 */}
        <div className="flex gap-2">
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAddNote();
            }}
            placeholder="노트를 입력하세요..."
            className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-transparent text-[var(--foreground)] outline-none focus:border-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteInput.trim()}
            className="px-3 py-2 text-sm font-medium rounded-[var(--radius-sm)] border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            저장
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
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] p-4 flex flex-col gap-1">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span
        className={`text-xl font-bold ${accent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}
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
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUncomplete,
}: {
  task: Task;
  onComplete?: (item: ScheduledItem) => void;
  onDefer?: (item: ScheduledItem) => void;
  onRepeat?: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
}) {
  const done = !!task.completedAt;
  const timeLabel = task.slot
    ? `${task.slot.period === 'morning' ? '오전' : task.slot.period === 'afternoon' ? '오후' : '저녁'} P${task.slot.priority}`
    : '백로그';

  const timer = task.timerSeconds
    ? `${Math.floor(task.timerSeconds / 60)}m`
    : null;

  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] ${
        done ? 'bg-[var(--card)] opacity-60' : 'bg-[var(--card)]'
      }`}
    >
      <span className="text-sm w-5 text-center shrink-0">
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
      </span>
      <span className="text-xs text-[var(--muted-foreground)] shrink-0">
        {task.date}
      </span>
      <span className="text-xs text-[var(--muted-foreground)] shrink-0 w-16 text-right">
        {timeLabel}
      </span>
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
              완료 취소
            </button>
          )
        ) : (
          <>
            {onDefer && (
              <button
                onClick={() => onDefer(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
                title="미루기"
              >
                <SkipForward size={14} />
              </button>
            )}
            {onComplete && (
              <button
                onClick={() => onComplete(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity pointer-events-auto"
                title="완료"
              >
                <Check size={14} strokeWidth={2.5} />
              </button>
            )}
            {onRepeat && (
              <button
                onClick={() => onRepeat(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors pointer-events-auto"
                title="또하기"
              >
                <RefreshCw size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-red-100 hover:text-red-500 transition-colors pointer-events-auto"
                title="삭제"
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

/* ── 노트 행 ── */
function NoteRow({
  note,
  onRemove,
}: {
  note: Note;
  onRemove: (id: string) => void;
}) {
  const dateStr = new Date(note.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group flex items-start gap-3 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--card)]">
      <span className="flex-1 text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
        {note.content}
      </span>
      <span className="text-xs text-[var(--muted-foreground)] shrink-0 pt-0.5">
        {dateStr}
      </span>
      <button
        onClick={() => onRemove(note.id)}
        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5"
      >
        ×
      </button>
    </div>
  );
}
