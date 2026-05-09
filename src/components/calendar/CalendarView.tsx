'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import type { Task, Project, RetrospectiveEntry, RetroScope } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import RetroInput from '@/components/retrospective/RetroInput';
import WeeklyTimelineView from './WeeklyTimelineView';
import { calculateDailyXP } from '@/lib/xp';
import { getToday } from '@/lib/date';

interface CalendarViewProps {
  tasks: Task[];
  routines?: never[];
  routineInstances?: never[];
  projects: Project[];
  onEditRoutine?: () => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onCreateTask?: (title: string, date: string, projectId: string | null) => void;
  onUpdateTask?: (taskId: string, updates: { scheduledStartTime?: string; scheduledEndTime?: string; date?: string }) => void;
  retrospectives?: RetrospectiveEntry[];
  onSaveRetro?: (scope: RetroScope, scopeKey: string, content: string) => void;
}

type ViewMode = 'week' | 'month';

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateStringYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** ISO week key: YYYY-Www (월요일 기준 주차) */
function getWeekScopeKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  // ISO week: Thursday-based
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const diff = d.getTime() - startOfWeek1.getTime();
  const week = Math.floor(diff / (7 * 86400000)) + 1;
  const year = d.getFullYear();
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dayOfWeek);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(sunday);
    cur.setDate(sunday.getDate() + i);
    dates.push(toDateString(cur));
  }
  return dates;
}

// 슬롯 시간 순서
const PERIOD_ORDER = { morning: 0, afternoon: 1, evening: 2 } as const;

interface DayData {
  todos: Task[];
  routineList: never[];
  xp: number;
}

/** 날짜 셀 인라인 입력 */
function DayCellInput({
  date,
  projects,
  onSubmit,
  onClose,
}: {
  date: string;
  projects: Project[];
  onSubmit: (title: string, date: string, projectId: string | null) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjects = projects.filter((p) => !p.archived);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 외부 클릭 시 커밋
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      commit();
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 50);
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selectedProject]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed, date, selectedProject?.id ?? null);
    onClose();
  };

  const openDropdown = useCallback(() => {
    if (!tagRef.current) return;
    const rect = tagRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setDropdownOpen(true);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-1 mt-1">
      <button
        ref={tagRef}
        onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
        className={[
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full self-start',
          'text-[10px] font-medium transition-colors duration-100',
          'border border-[var(--border)] hover:border-[var(--foreground)]',
          'cursor-pointer',
          selectedProject ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
        ].join(' ')}
      >
        <ColorDot color={selectedProject?.color ?? '#8A8A8A'} size="sm" />
        <span className="truncate max-w-[60px]">{selectedProject?.name ?? '미분류'}</span>
      </button>

      {dropdownOpen && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-44 rounded-[calc(var(--radius)*1.4)] border border-[var(--border)] bg-[var(--popover)] shadow-xl overflow-hidden animate-[status-appear_0.12s_ease_forwards]"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProject(p); setDropdownOpen(false); inputRef.current?.focus(); }}
              className={[
                'w-full flex items-center gap-2 px-3 py-1.5',
                'text-[var(--fs-tag)] text-left transition-colors duration-100',
                selectedProject?.id === p.id
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
              ].join(' ')}
            >
              <ColorDot color={p.color} size="sm" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
          {activeProjects.length > 0 && <div className="border-t border-[var(--border)]" />}
          <button
            onClick={() => { setSelectedProject(null); setDropdownOpen(false); inputRef.current?.focus(); }}
            className={[
              'w-full flex items-center gap-2 px-3 py-1.5',
              'text-[var(--fs-tag)] text-left transition-colors duration-100',
              !selectedProject
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]',
            ].join(' ')}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] inline-block" />
            <span>미분류</span>
          </button>
        </div>,
        document.body,
      )}

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) commit();
          if (e.key === 'Escape') onClose();
        }}
        placeholder="할 일 입력..."
        className="w-full text-[12px] text-[var(--foreground)] bg-transparent outline-none border-b border-[var(--border)] focus:border-[var(--foreground)] placeholder:text-[var(--muted-foreground)] py-0.5"
      />
    </div>
  );
}

export default function CalendarView({
  tasks,
  projects,
  onViewModeChange,
  onCreateTask,
  onUpdateTask,
  retrospectives = [],
  onSaveRetro,
}: CalendarViewProps) {
  const todayStr = getToday();
  const [todayY, todayM] = todayStr.split('-').map(Number);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM - 1);
  const [weekAnchor, setWeekAnchor] = useState(todayStr);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [inputDate, setInputDate] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);

  function buildDayData(dateStr: string): DayData {
    const todos = tasks
      .filter((t) => t.date === dateStr && !t.recurrence) // 반복 부모 제외
      .sort((a, b) => {
        const pa = a.slot ? PERIOD_ORDER[a.slot.period] * 10 + a.slot.priority : 99;
        const pb = b.slot ? PERIOD_ORDER[b.slot.period] * 10 + b.slot.priority : 99;
        return pa - pb;
      });
    const xp = calculateDailyXP(tasks, [], dateStr);
    return { todos, routineList: [], xp };
  }

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const weekData = useMemo(() => {
    const map: Record<string, DayData> = {};
    for (const d of weekDates) map[d] = buildDayData(d);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, tasks]);

  const monthData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const map: Record<string, DayData> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStringYMD(viewYear, viewMonth, day);
      map[dateStr] = buildDayData(dateStr);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, tasks]);

  // 네비게이션
  const prevWeek = () => {
    const d = new Date(weekAnchor + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setWeekAnchor(toDateString(d));
  };
  const nextWeek = () => {
    const d = new Date(weekAnchor + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setWeekAnchor(toDateString(d));
  };
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => {
    setWeekAnchor(getToday());
    const [y, m] = getToday().split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  };

  const isCurrentPeriod = viewMode === 'week'
    ? weekDates.includes(todayStr)
    : viewYear === todayY && viewMonth === todayM - 1;

  const weekLabel = useMemo(() => {
    const start = new Date(weekDates[0] + 'T00:00:00');
    const end = new Date(weekDates[6] + 'T00:00:00');
    const sM = start.getMonth() + 1;
    const sD = start.getDate();
    const eM = end.getMonth() + 1;
    const eD = end.getDate();
    if (sM === eM) return `${start.getFullYear()}년 ${sM}월 ${sD}일 ~ ${eD}일`;
    return `${sM}월 ${sD}일 ~ ${eM}월 ${eD}일`;
  }, [weekDates]);

  // 투두 아이템 렌더
  function renderTodoItem(t: Task) {
    const isDone = !!t.completedAt;
    const project = t.projectId ? projects.find((p) => p.id === t.projectId) : null;
    return (
      <div
        key={`t-${t.id}`}
        className={[
          'flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[14px] leading-tight truncate',
          isDone ? 'text-[var(--g-success)]' : 'bg-[var(--muted)] text-[var(--foreground)]',
        ].join(' ')}
        title={t.title}
      >
        {isDone && <Check size={8} strokeWidth={3} className="flex-shrink-0" />}
        {project && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
        )}
        <span className="truncate">{t.title}</span>
      </div>
    );
  }

  // 투두 렌더 (compact = 먼슬리에서 자르기)
  function renderDaySections(data: DayData, dateStr: string, compact: boolean) {
    const todoItems = data.todos;
    if (todoItems.length === 0) return null;

    const isExpanded = expandedDate === dateStr;
    const unlimitedCompact = compact && showAll;
    const maxTodos = compact ? (unlimitedCompact || isExpanded ? todoItems.length : 2) : todoItems.length;
    const visibleTodos = todoItems.slice(0, maxTodos);
    const hiddenCount = compact ? Math.max(0, todoItems.length - 2) : 0;

    return (
      <div className="flex flex-col gap-0 flex-1">
        {visibleTodos.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {visibleTodos.map((t) => renderTodoItem(t))}
          </div>
        )}

        {compact && hiddenCount > 0 && !isExpanded && (
          <button
            onClick={() => setExpandedDate(dateStr)}
            className="text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-1 text-left transition-colors mt-0.5"
          >
            +{hiddenCount}
          </button>
        )}
        {compact && isExpanded && hiddenCount > 0 && (
          <button
            onClick={() => setExpandedDate(null)}
            className="text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-1 text-left transition-colors mt-0.5"
          >
            접기
          </button>
        )}
      </div>
    );
  }

  // XP 뱃지
  function renderXP(xp: number) {
    if (xp === 0) return null;
    return (
      <span className={[
        'text-[10px] font-semibold leading-none',
        xp > 0 ? 'text-[var(--g-success)]' : 'text-[var(--muted-foreground)]',
      ].join(' ')}>
        {xp > 0 ? `+${xp}` : xp}
      </span>
    );
  }

  // 먼슬리 그리드 계산
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const trailingBlanks = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더: 날짜 네비게이션 + 필터/뷰 토글 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={viewMode === 'week' ? prevWeek : prevMonth}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <span className="text-sm font-semibold text-[var(--foreground)] min-w-[180px] text-center">
            {viewMode === 'week' ? weekLabel : `${viewYear}년 ${viewMonth + 1}월`}
          </span>
          <button
            onClick={viewMode === 'week' ? nextWeek : nextMonth}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
          {!isCurrentPeriod && (
            <button
              onClick={goToday}
              className="ml-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              오늘
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 전체 보기 토글 (먼슬리만) */}
          {viewMode === 'month' && (
            <div className="flex items-center bg-[var(--card)] rounded-[var(--radius-sm)] p-0.5">
              <button
                onClick={() => setShowAll(!showAll)}
                className={[
                  'w-7 h-4 rounded-full transition-colors duration-200 relative shrink-0',
                  showAll ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
                ].join(' ')}
                title={showAll ? '4개만 보기' : '전체 보기'}
              >
                <span
                  className={[
                    'absolute top-[3px] w-[10px] h-[10px] rounded-full bg-white shadow-sm transition-transform duration-200',
                    showAll ? 'left-[14px]' : 'left-[3px]',
                  ].join(' ')}
                />
              </button>
            </div>
          )}

          {/* 뷰 토글 */}
          <div className="flex items-center bg-[var(--card)] rounded-[var(--radius-sm)] p-0.5">
            <button
              onClick={() => { setViewMode('week'); onViewModeChange?.('week'); }}
              className={[
                'px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              이번주
            </button>
            <button
              onClick={() => { setViewMode('month'); onViewModeChange?.('month'); }}
              className={[
                'px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              이번달
            </button>
          </div>
        </div>
      </div>

      {/* 위클리 타임라인 뷰 */}
      {viewMode === 'week' && (
        <>
          <WeeklyTimelineView
            tasks={tasks}
            projects={projects}
            weekDates={weekDates}
            onUpdateTask={onUpdateTask}
          />
          {/* 주간 회고 */}
          {onSaveRetro && (() => {
            const weekKey = getWeekScopeKey(weekAnchor);
            const existing = retrospectives.find((r) => r.scope === 'week' && r.scopeKey === weekKey);
            return (
              <div className="bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] p-4">
                <RetroInput
                  scope="week"
                  scopeKey={weekKey}
                  initialContent={existing?.content ?? ''}
                  onSave={onSaveRetro}
                  label="이번 주 회고"
                  placeholder="이번 주는 어떤 한 주였나요?"
                  compact
                />
              </div>
            );
          })()}
        </>
      )}

      {/* 먼슬리 뷰 */}
      {viewMode === 'month' && (
        <div className="bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {KO_WEEKDAYS.map((day) => (
              <div
                key={day}
                className="flex items-center justify-center py-2.5 text-[14px] font-semibold text-[var(--muted-foreground)]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`prev-${i}`} className="min-h-[96px] border-b border-r border-[var(--border)] last:border-r-0" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateStringYMD(viewYear, viewMonth, day);
              const isToday = dateStr === todayStr;
              const data = monthData[dateStr];
              const dayOfWeek = (firstDayOfMonth + i) % 7;

              return (
                <div
                  key={day}
                  className={[
                    'group/cell min-h-[96px] p-1.5 flex flex-col gap-1',
                    'border-r border-b border-[var(--border)]',
                    dayOfWeek === 6 ? 'border-r-0' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={[
                        'text-[14px] leading-none',
                        isToday
                          ? 'w-6 h-6 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] font-bold'
                          : 'text-[var(--muted-foreground)]',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                    <div className="flex items-center gap-1">
                      {data && renderXP(data.xp)}
                      {onCreateTask && inputDate !== dateStr && (
                        <button
                          onClick={() => setInputDate(dateStr)}
                          className="text-[var(--muted-foreground)] opacity-0 group-hover/cell:opacity-100 transition-opacity duration-150 hover:text-[var(--foreground)]"
                        >
                          <Plus size={12} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                  {data && renderDaySections(data, dateStr, true)}
                  {inputDate === dateStr && onCreateTask && (
                    <DayCellInput
                      date={dateStr}
                      projects={projects}
                      onSubmit={onCreateTask}
                      onClose={() => setInputDate(null)}
                    />
                  )}
                </div>
              );
            })}

            {Array.from({ length: trailingBlanks }).map((_, i) => (
              <div
                key={`next-${i}`}
                className={[
                  'min-h-[96px] border-r border-[var(--border)]',
                  i === trailingBlanks - 1 ? 'border-r-0' : '',
                ].join(' ')}
              />
            ))}
          </div>

          {/* 월간 회고 */}
          {onSaveRetro && (() => {
            const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
            const existing = retrospectives.find((r) => r.scope === 'month' && r.scopeKey === monthKey);
            return (
              <div className="border-t border-[var(--border)] p-4">
                <RetroInput
                  scope="month"
                  scopeKey={monthKey}
                  initialContent={existing?.content ?? ''}
                  onSave={onSaveRetro}
                  label="이번 달 회고"
                  placeholder="이번 달은 어떤 한 달이었나요?"
                  compact
                />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
