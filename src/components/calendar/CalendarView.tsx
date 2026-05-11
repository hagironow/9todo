'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Check, Plus, Settings } from 'lucide-react';
import type { Task, Project, RetrospectiveEntry, RetroScope, EnergyLevel } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import RetroInput from '@/components/retrospective/RetroInput';
import { EnergyBadge } from '@/components/retrospective/EnergyLevelInput';
import WeeklyTimelineView from './WeeklyTimelineView';
import ProjectStatsView from './ProjectStatsView';
import { shouldCreateRecurringInstance, createRecurringInstance } from '@/lib/recurrence';
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
  onEditRecurrence?: (task: Task) => void;
  retrospectives?: RetrospectiveEntry[];
  onSaveRetro?: (scope: RetroScope, scopeKey: string, content: string, energyLevel?: EnergyLevel) => void;
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

/** weekStartDay: 0=일요일, 1=월요일 */
function getWeekDates(dateStr: string, weekStartDay: 0 | 1 = 1): string[] {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const diff = (dayOfWeek - weekStartDay + 7) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - diff);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    dates.push(toDateString(cur));
  }
  return dates;
}

// 슬롯 시간 순서
const PERIOD_ORDER = { morning: 0, afternoon: 1, evening: 2 } as const;

// ── 게이미피케이션 헬퍼 ──
type SlotStatus = 'done' | 'missed' | 'pending' | 'empty';

function getDayStats(todos: Task[], dateStr: string, today: string) {
  const periods = ['morning', 'afternoon', 'evening'] as const;
  const priorities = [1, 2, 3] as const;
  const grid: SlotStatus[][] = periods.map(period =>
    priorities.map(priority => {
      const task = todos.find(t => t.slot?.period === period && t.slot?.priority === priority);
      if (!task) return 'empty';
      if (task.completedAt) return 'done';
      if (dateStr < today) return 'missed';
      return 'pending';
    })
  );
  const slotted = todos.filter(t => t.slot);
  const completed = slotted.filter(t => t.completedAt).length;
  const total = slotted.length;
  const rate = total > 0 ? completed / total : -1;
  return { grid, total, completed, rate };
}

function getHeatmapBg(rate: number, dateStr: string, today: string): string | undefined {
  if (rate === -1 || dateStr > today) return undefined;
  if (rate === 1) return 'rgba(34, 197, 94, 0.10)';
  if (rate >= 0.8) return 'rgba(34, 197, 94, 0.06)';
  if (rate >= 0.5) return 'rgba(34, 197, 94, 0.03)';
  if (rate === 0) return 'rgba(255, 110, 110, 0.06)';
  return undefined;
}

function MiniSlotGrid({ grid }: { grid: SlotStatus[][] }) {
  const hasAny = grid.some(row => row.some(s => s !== 'empty'));
  if (!hasAny) return null;
  return (
    <div className="grid grid-cols-3 gap-[1.5px]">
      {grid.flat().map((status, i) => (
        <div
          key={i}
          className="w-[4px] h-[4px] rounded-[1px]"
          style={{
            backgroundColor:
              status === 'done' ? 'var(--g-success)' :
              status === 'missed' ? 'var(--g-error)' :
              status === 'pending' ? 'var(--border)' :
              'transparent',
          }}
        />
      ))}
    </div>
  );
}

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
  onEditRecurrence,
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
  const [weekStartDay, setWeekStartDay] = useState<0 | 1>(() => {
    if (typeof window === 'undefined') return 1;
    const stored = localStorage.getItem('9todo_week_start');
    return stored === '0' ? 0 : 1;
  });
  const [timeRange, setTimeRange] = useState(() => {
    if (typeof window === 'undefined') return { startHour: 6, endHour: 24 };
    try {
      const raw = localStorage.getItem('9todo_timeline_range');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { startHour: 6, endHour: 24 };
  });
  const [calSettingsOpen, setCalSettingsOpen] = useState(false);

  // 캘린더 내부 프로젝트 필터
  const [calProjectFilter, setCalProjectFilter] = useState<string | null>(null);
  const [calProjectDropOpen, setCalProjectDropOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!calProjectFilter) return tasks;
    if (calProjectFilter === '__uncategorized__') return tasks.filter((t) => !t.projectId);
    return tasks.filter((t) => t.projectId === calProjectFilter);
  }, [tasks, calProjectFilter]);

  const activeProjects = projects.filter((p) => !p.archived);
  const calFilterProject = calProjectFilter ? projects.find((p) => p.id === calProjectFilter) : null;

  function buildDayData(dateStr: string): DayData {
    const seen = new Set<string>();

    // 해당 날짜에 실제 인스턴스가 없는 반복 부모 → 가상 인스턴스 생성
    const existingDayTasks = filteredTasks.filter((t) => t.date === dateStr && !t.recurrence);
    const virtualInstances: Task[] = [];
    const recurringParents = tasks.filter((t) => t.recurrence && t.isRecurrenceActive !== false);
    for (const parent of recurringParents) {
      if (shouldCreateRecurringInstance(parent, [...tasks, ...virtualInstances], dateStr)) {
        virtualInstances.push(createRecurringInstance(parent, dateStr));
      }
    }

    // calProjectFilter 적용
    const filteredVirtual = calProjectFilter
      ? virtualInstances.filter((t) => {
          if (calProjectFilter === '__uncategorized__') return !t.projectId;
          return t.projectId === calProjectFilter;
        })
      : virtualInstances;

    const allDayTasks = [...existingDayTasks, ...filteredVirtual];

    const todos = allDayTasks
      .filter((t) => {
        // 같은 제목+프로젝트의 반복 인스턴스 중복 제거
        const titleKey = `${t.title}__${t.projectId ?? ''}`;
        if (t.recurrenceParentId && seen.has(titleKey)) return false;
        seen.add(titleKey);
        return true;
      })
      .sort((a, b) => {
        const pa = a.slot ? PERIOD_ORDER[a.slot.period] * 10 + a.slot.priority : 99;
        const pb = b.slot ? PERIOD_ORDER[b.slot.period] * 10 + b.slot.priority : 99;
        return pa - pb;
      });
    const xp = calculateDailyXP(tasks, [], dateStr);
    return { todos, routineList: [], xp };
  }

  const weekDates = useMemo(() => getWeekDates(weekAnchor, weekStartDay), [weekAnchor, weekStartDay]);
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

  // 연속 streak: 하나라도 완료한 날 기준 (어제부터 역순, 오늘은 완료 있으면 +1)
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() - 1); // 어제부터 시작
    for (let i = 0; i < 365; i++) {
      const dateStr = toDateString(d);
      const dayTasks = tasks.filter(t => t.date === dateStr && t.slot && !t.recurrence);
      if (dayTasks.length > 0) {
        if (dayTasks.some(t => t.completedAt)) count++;
        else break;
      }
      d.setDate(d.getDate() - 1);
    }
    // 오늘 하나라도 완료했으면 +1
    const todayTasks = tasks.filter(t => t.date === todayStr && t.slot && !t.recurrence);
    if (todayTasks.length > 0 && todayTasks.some(t => t.completedAt)) count++;
    return count;
  }, [tasks, todayStr]);

  // 주간 요약
  const weekSummary = useMemo(() => {
    let completed = 0, missed = 0, pending = 0;
    for (const dateStr of weekDates) {
      const dayTasks = filteredTasks.filter(t => t.date === dateStr && t.slot && !t.recurrence);
      for (const t of dayTasks) {
        if (t.completedAt) completed++;
        else if (dateStr < todayStr) missed++;
        else pending++;
      }
    }
    return { completed, missed, pending, total: completed + missed + pending };
  }, [weekDates, filteredTasks, todayStr]);

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

  // 주간/월간 에너지 평균 계산
  const weekEnergyAvg = useMemo(() => {
    const entries = weekDates
      .map((d) => (retrospectives ?? []).find((r) => r.scope === 'day' && r.scopeKey === d))
      .filter((r) => r?.energyLevel)
      .map((r) => r!.energyLevel!);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => a + b, 0) / entries.length;
  }, [weekDates, retrospectives]);

  const monthEnergyAvg = useMemo(() => {
    const daysInM = new Date(viewYear, viewMonth + 1, 0).getDate();
    const entries: number[] = [];
    for (let day = 1; day <= daysInM; day++) {
      const dateStr = toDateStringYMD(viewYear, viewMonth, day);
      const retro = (retrospectives ?? []).find((r) => r.scope === 'day' && r.scopeKey === dateStr);
      if (retro?.energyLevel) entries.push(retro.energyLevel);
    }
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => a + b, 0) / entries.length;
  }, [viewYear, viewMonth, retrospectives]);

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
    const isPastIncomplete = !isDone && t.date && t.date < todayStr;
    const project = t.projectId ? projects.find((p) => p.id === t.projectId) : null;
    return (
      <div
        key={`t-${t.id}`}
        className={[
          'flex items-start gap-1 px-1.5 py-0.5 rounded-[4px] text-[12px] leading-snug',
          isDone
            ? 'text-[var(--g-success)]'
            : isPastIncomplete
            ? 'text-[var(--g-error)] bg-[var(--g-error)]/8'
            : 'bg-[var(--muted)] text-[var(--foreground)]',
        ].join(' ')}
        title={t.title}
      >
        {isDone && <Check size={8} strokeWidth={3} className="flex-shrink-0 mt-[3px]" />}
        {project && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px]" style={{ backgroundColor: project.color }} />
        )}
        <span>{t.title}</span>
      </div>
    );
  }

  // 투두 렌더 (compact = 먼슬리에서 자르기)
  function renderDaySections(data: DayData, dateStr: string, compact: boolean) {
    const todoItems = data.todos;
    if (todoItems.length === 0) return null;

    const isExpanded = expandedDate === dateStr;
    const shouldLimit = compact && !showAll; // showAll이면 제한 없음
    const maxTodos = shouldLimit ? (isExpanded ? todoItems.length : 2) : todoItems.length;
    const visibleTodos = todoItems.slice(0, maxTodos);
    const hiddenCount = shouldLimit ? Math.max(0, todoItems.length - 2) : 0;

    return (
      <div className="flex flex-col gap-0 flex-1">
        {visibleTodos.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {visibleTodos.map((t) => renderTodoItem(t))}
          </div>
        )}

        {shouldLimit && hiddenCount > 0 && !isExpanded && (
          <button
            onClick={() => setExpandedDate(dateStr)}
            className="text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-1 text-left transition-colors mt-0.5"
          >
            +{hiddenCount}
          </button>
        )}
        {shouldLimit && isExpanded && hiddenCount > 0 && (
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

  // 먼슬리 그리드 계산 (weekStartDay 반영)
  const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay();
  const firstDayOfMonth = (rawFirstDay - weekStartDay + 7) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const trailingBlanks = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;

  // 요일 라벨 순서 (weekStartDay 반영)
  const orderedWeekdays = weekStartDay === 1
    ? ['월', '화', '수', '목', '금', '토', '일']
    : KO_WEEKDAYS;

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
          {/* 에너지 평균 뱃지 */}
          {viewMode === 'week' && weekEnergyAvg !== null && (
            <div className="ml-2">
              <EnergyBadge level={weekEnergyAvg} />
            </div>
          )}
          {viewMode === 'month' && monthEnergyAvg !== null && (
            <div className="ml-2">
              <EnergyBadge level={monthEnergyAvg} />
            </div>
          )}
          <span className={[
            'ml-2 text-[11px] font-medium',
            streak > 0 ? 'text-[var(--g-success)]' : 'text-[var(--muted-foreground)]',
          ].join(' ')}>
            {streak > 0 ? `${streak}일 연속 완주` : '연속 완주 0일'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 프로젝트 필터 */}
          <div className="relative">
            <button
              onClick={() => setCalProjectDropOpen((v) => !v)}
              className={[
                'flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
                calProjectFilter
                  ? 'text-[var(--foreground)] bg-[var(--surface-hover)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
              ].join(' ')}
            >
              {calFilterProject ? (
                <>
                  <ColorDot color={calFilterProject.color} size="sm" />
                  <span className="max-w-[60px] truncate">{calFilterProject.name}</span>
                </>
              ) : calProjectFilter === '__uncategorized__' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] inline-block" />
                  <span>미분류</span>
                </>
              ) : (
                <span>전체</span>
              )}
            </button>
            {calProjectDropOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--popover)] shadow-lg overflow-hidden animate-[status-appear_0.1s_ease_forwards]">
                <button
                  onClick={() => { setCalProjectFilter(null); setCalProjectDropOpen(false); }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                    !calProjectFilter ? 'bg-[var(--muted)] font-semibold' : 'hover:bg-[var(--muted)]',
                    'text-[var(--foreground)]',
                  ].join(' ')}
                >
                  전체
                </button>
                {activeProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setCalProjectFilter(p.id); setCalProjectDropOpen(false); }}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                      calProjectFilter === p.id ? 'bg-[var(--muted)] font-semibold' : 'hover:bg-[var(--muted)]',
                      'text-[var(--foreground)]',
                    ].join(' ')}
                  >
                    <ColorDot color={p.color} size="sm" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                <div className="border-t border-[var(--border)]" />
                <button
                  onClick={() => { setCalProjectFilter('__uncategorized__'); setCalProjectDropOpen(false); }}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                    calProjectFilter === '__uncategorized__' ? 'bg-[var(--muted)] font-semibold' : 'hover:bg-[var(--muted)]',
                    'text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] inline-block" />
                  <span>미분류</span>
                </button>
              </div>
            )}
          </div>

          {/* 캘린더 설정 */}
          <div className="relative">
            <button
              onClick={() => setCalSettingsOpen((v) => !v)}
              className={[
                'flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-[11px] transition-colors',
                calSettingsOpen
                  ? 'text-[var(--foreground)] bg-[var(--surface-hover)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
              ].join(' ')}
              title="캘린더 설정"
            >
              <Settings size={12} />
              <span>{timeRange.startHour}:00~{timeRange.endHour}:00 · {weekStartDay === 1 ? '월' : '일'}요일 시작</span>
            </button>

            {calSettingsOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--popover)] shadow-lg p-3 flex flex-col gap-3 animate-[status-appear_0.1s_ease_forwards]">
                {/* 표시 범위 */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--muted-foreground)]">표시 범위</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={timeRange.startHour}
                      onChange={(e) => {
                        const v = { ...timeRange, startHour: Number(e.target.value) };
                        setTimeRange(v);
                        localStorage.setItem('9todo_timeline_range', JSON.stringify(v));
                      }}
                      className="text-[12px] bg-[var(--muted)] text-[var(--foreground)] rounded px-1.5 py-0.5 border-none outline-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} disabled={i >= timeRange.endHour}>{String(i).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[var(--muted-foreground)]">~</span>
                    <select
                      value={timeRange.endHour}
                      onChange={(e) => {
                        const v = { ...timeRange, endHour: Number(e.target.value) };
                        setTimeRange(v);
                        localStorage.setItem('9todo_timeline_range', JSON.stringify(v));
                      }}
                      className="text-[12px] bg-[var(--muted)] text-[var(--foreground)] rounded px-1.5 py-0.5 border-none outline-none"
                    >
                      {Array.from({ length: 25 }, (_, i) => (
                        <option key={i} value={i} disabled={i <= timeRange.startHour}>{String(i).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 주 시작일 */}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--muted-foreground)]">주 시작일</span>
                  <div className="flex items-center bg-[var(--muted)] rounded-full p-0.5">
                    <button
                      onClick={() => { setWeekStartDay(1); localStorage.setItem('9todo_week_start', '1'); }}
                      className={[
                        'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors',
                        weekStartDay === 1 ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--muted-foreground)]',
                      ].join(' ')}
                    >월</button>
                    <button
                      onClick={() => { setWeekStartDay(0); localStorage.setItem('9todo_week_start', '0'); }}
                      className={[
                        'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors',
                        weekStartDay === 0 ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--muted-foreground)]',
                      ].join(' ')}
                    >일</button>
                  </div>
                </div>

                {/* 전체 보기 (먼슬리) */}
                {viewMode === 'month' && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--muted-foreground)]">전체 보기</span>
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className={[
                        'w-7 h-4 rounded-full transition-colors duration-200 relative shrink-0',
                        showAll ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
                      ].join(' ')}
                    >
                      <span className={[
                        'absolute top-[3px] w-[10px] h-[10px] rounded-full bg-white shadow-sm transition-transform duration-200',
                        showAll ? 'left-[14px]' : 'left-[3px]',
                      ].join(' ')} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
            tasks={filteredTasks}
            projects={projects}
            weekDates={weekDates}
            timeRange={timeRange}
            onUpdateTask={onUpdateTask}
            onCreateTask={onCreateTask}
            onEditRecurrence={onEditRecurrence}
          />
          {/* 주간 요약 바 */}
          {weekSummary.total > 0 && (
            <div className="flex items-center gap-3 px-1">
              <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-[var(--muted)] flex">
                {weekSummary.completed > 0 && (
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(weekSummary.completed / weekSummary.total) * 100}%`,
                      backgroundColor: 'var(--g-success)',
                    }}
                  />
                )}
                {weekSummary.missed > 0 && (
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(weekSummary.missed / weekSummary.total) * 100}%`,
                      backgroundColor: 'var(--g-error)',
                      opacity: 0.6,
                    }}
                  />
                )}
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                {weekSummary.completed}/{weekSummary.total} 완료
                {weekSummary.missed > 0 && <span className="text-[var(--g-error)]"> · {weekSummary.missed} 미완료</span>}
              </span>
            </div>
          )}
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
                  initialEnergyLevel={existing?.energyLevel}
                  onSave={onSaveRetro}
                  label="이번 주 회고"
                  placeholder="이번 주는 어떤 한 주였나요?"
                  compact
                />
              </div>
            );
          })()}
          {/* 주간 프로젝트 통계 */}
          <div className="bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] p-4">
            <ProjectStatsView
              tasks={tasks}
              projects={projects}
              dateRange={weekDates}
              label="이번 주"
            />
          </div>
        </>
      )}

      {/* 먼슬리 뷰 */}
      {viewMode === 'month' && (
        <div className="bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {orderedWeekdays.map((day) => (
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
              const stats = data ? getDayStats(data.todos, dateStr, todayStr) : null;
              const heatmapBg = stats ? getHeatmapBg(stats.rate, dateStr, todayStr) : undefined;

              return (
                <div
                  key={day}
                  className={[
                    'group/cell min-h-[96px] p-1.5 flex flex-col gap-1',
                    'border-r border-b border-[var(--border)]',
                    dayOfWeek === 6 ? 'border-r-0' : '',
                  ].join(' ')}
                  style={heatmapBg ? { backgroundColor: heatmapBg } : undefined}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
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
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const dayRetro = (retrospectives ?? []).find((r) => r.scope === 'day' && r.scopeKey === dateStr);
                        if (!dayRetro?.energyLevel) return null;
                        return <EnergyBadge level={dayRetro.energyLevel} size="xs" />;
                      })()}
                      {data && renderXP(data.xp)}
                      {/* 태스크 생성 버튼 — 비활성화 */}
                    </div>
                  </div>
                  {data && renderDaySections(data, dateStr, true)}
                  {/* 인라인 입력 — 비활성화 */}
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
                  initialEnergyLevel={existing?.energyLevel}
                  onSave={onSaveRetro}
                  label="이번 달 회고"
                  placeholder="이번 달은 어떤 한 달이었나요?"
                  compact
                />
              </div>
            );
          })()}
          {/* 월간 프로젝트 통계 */}
          {(() => {
            const daysInM = new Date(viewYear, viewMonth + 1, 0).getDate();
            const monthDates: string[] = [];
            for (let d = 1; d <= daysInM; d++) {
              monthDates.push(toDateStringYMD(viewYear, viewMonth, d));
            }
            return (
              <div className="border-t border-[var(--border)] p-4">
                <ProjectStatsView
                  tasks={tasks}
                  projects={projects}
                  dateRange={monthDates}
                  label="이번 달"
                />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
