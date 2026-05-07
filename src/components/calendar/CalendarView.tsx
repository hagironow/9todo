'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Task, Routine, RoutineInstance, Project, RecurrenceType } from '@/lib/types';
import { shouldCreateInstance } from '@/lib/routine';
import { calculateDailyXP } from '@/lib/xp';

interface CalendarViewProps {
  tasks: Task[];
  routines: Routine[];
  routineInstances: RoutineInstance[];
  projects: Project[];
  onEditRoutine?: (routine: Routine) => void;
}

type ViewMode = 'week' | 'month';
type FilterMode = 'all' | 'todo' | 'routine';

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function getToday(): string {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateStringYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
  routineList: { routine: Routine; completed: boolean }[];
  xp: number;
}

export default function CalendarView({
  tasks,
  routines,
  routineInstances,
  projects,
  onEditRoutine,
}: CalendarViewProps) {
  const todayStr = getToday();
  const [todayY, todayM] = todayStr.split('-').map(Number);

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM - 1);
  const [weekAnchor, setWeekAnchor] = useState(todayStr);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const activeRoutines = routines.filter((r) => r.isActive);

  function buildDayData(dateStr: string): DayData {
    const todos = tasks
      .filter((t) => t.date === dateStr)
      .sort((a, b) => {
        const pa = a.slot ? PERIOD_ORDER[a.slot.period] * 10 + a.slot.priority : 99;
        const pb = b.slot ? PERIOD_ORDER[b.slot.period] * 10 + b.slot.priority : 99;
        return pa - pb;
      });
    const rList: { routine: Routine; completed: boolean }[] = [];
    for (const routine of activeRoutines) {
      if (shouldCreateInstance(routine, [], dateStr)) {
        const instance = routineInstances.find(
          (ri) => ri.routineId === routine.id && ri.date === dateStr
        );
        rList.push({ routine, completed: !!instance?.completedAt });
      }
    }
    // 루틴도 시간대 순 정렬
    rList.sort((a, b) => {
      const pa = PERIOD_ORDER[a.routine.defaultSlot.period] * 10 + a.routine.defaultSlot.priority;
      const pb = PERIOD_ORDER[b.routine.defaultSlot.period] * 10 + b.routine.defaultSlot.priority;
      return pa - pb;
    });
    const xp = calculateDailyXP(tasks, routineInstances, dateStr);
    return { todos, routineList: rList, xp };
  }

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const weekData = useMemo(() => {
    const map: Record<string, DayData> = {};
    for (const d of weekDates) map[d] = buildDayData(d);
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, tasks, activeRoutines, routineInstances]);

  const monthData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const map: Record<string, DayData> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStringYMD(viewYear, viewMonth, day);
      map[dateStr] = buildDayData(dateStr);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, tasks, activeRoutines, routineInstances]);

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

  // 루틴 아이템 렌더
  function renderRoutineItem(r: { routine: Routine; completed: boolean }) {
    return (
      <button
        key={`r-${r.routine.id}`}
        onClick={() => onEditRoutine?.(r.routine)}
        className={[
          'flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[14px] leading-tight truncate w-full text-left transition-colors',
          r.completed
            ? 'text-[var(--g-success)]'
            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
        ].join(' ')}
        title={r.routine.title}
      >
        {r.completed && <Check size={8} strokeWidth={3} className="flex-shrink-0" />}
        <span className="truncate">{r.routine.title}</span>
      </button>
    );
  }

  // 투두+루틴 분리 렌더 (compact = 먼슬리에서 자르기)
  function renderDaySections(data: DayData, dateStr: string, compact: boolean) {
    const showTodos = filter === 'all' || filter === 'todo';
    const showRoutines = filter === 'all' || filter === 'routine';

    const todoItems = showTodos ? data.todos : [];
    const routineItems = showRoutines ? data.routineList : [];

    if (todoItems.length === 0 && routineItems.length === 0) return null;

    const isExpanded = expandedDate === dateStr;
    const maxTodos = compact ? (isExpanded ? todoItems.length : 2) : todoItems.length;
    const maxRoutines = compact ? (isExpanded ? routineItems.length : 2) : routineItems.length;
    const visibleTodos = todoItems.slice(0, maxTodos);
    const visibleRoutines = routineItems.slice(0, maxRoutines);
    const hiddenCount = compact
      ? Math.max(0, todoItems.length - 2) + Math.max(0, routineItems.length - 2)
      : 0;

    return (
      <div className="flex flex-col gap-0 flex-1">
        {/* 투두 섹션 */}
        {visibleTodos.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {visibleTodos.map((t) => renderTodoItem(t))}
          </div>
        )}

        {/* 구분선 — 투두와 루틴 모두 있을 때만 */}
        {visibleTodos.length > 0 && visibleRoutines.length > 0 && (
          <div className="my-1 border-t border-[var(--border)]" />
        )}

        {/* 루틴 섹션 */}
        {visibleRoutines.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {visibleRoutines.map((r) => renderRoutineItem(r))}
          </div>
        )}

        {/* +N 접기/펼치기 (먼슬리만) */}
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
          {/* 필터 탭 */}
          <div className="flex items-center bg-[var(--card)] rounded-[var(--radius-sm)] p-0.5">
            {([
              { key: 'all', label: '전체' },
              { key: 'todo', label: '투두' },
              { key: 'routine', label: '루틴' },
            ] as { key: FilterMode; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={[
                  'px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
                  filter === key
                    ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 뷰 토글 */}
          <div className="flex items-center bg-[var(--card)] rounded-[var(--radius-sm)] p-0.5">
            <button
              onClick={() => setViewMode('week')}
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
              onClick={() => setViewMode('month')}
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

      {/* 위클리 뷰 */}
      {viewMode === 'week' && (
        <div className="bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
          {/* 요일 + 날짜 헤더 */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {weekDates.map((dateStr, i) => {
              const d = new Date(dateStr + 'T00:00:00');
              const isToday = dateStr === todayStr;
              const dayData = weekData[dateStr];
              return (
                <div
                  key={dateStr}
                  className="flex flex-col items-center py-2.5 gap-1"
                >
                  <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                    {KO_WEEKDAYS[i]}
                  </span>
                  <span
                    className={[
                      'text-[14px] leading-none',
                      isToday
                        ? 'w-6 h-6 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] font-bold'
                        : 'text-[var(--muted-foreground)]',
                    ].join(' ')}
                  >
                    {d.getDate()}
                  </span>
                  {dayData && renderXP(dayData.xp)}
                </div>
              );
            })}
          </div>

          {/* 각 날짜의 아이템 — 전부 보이기 */}
          <div className="grid grid-cols-7">
            {weekDates.map((dateStr, i) => {
              const data = weekData[dateStr];
              return (
                <div
                  key={dateStr}
                  className={[
                    'min-h-[120px] p-2 flex flex-col',
                    i < 6 ? 'border-r border-[var(--border)]' : '',
                  ].join(' ')}
                >
                  {data && renderDaySections(data, dateStr, false)}
                </div>
              );
            })}
          </div>
        </div>
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
                    'min-h-[96px] p-1.5 flex flex-col gap-1',
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
                    {data && renderXP(data.xp)}
                  </div>
                  {data && renderDaySections(data, dateStr, true)}
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
        </div>
      )}
    </div>
  );
}
