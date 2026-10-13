'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, Check } from 'lucide-react';
import type { Task, Project, WeekPriority } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import ProjectDotLabel from './ProjectDotLabel';
import WeekItemDialog from './WeekItemDialog';
import WeekAddRow from './WeekAddRow';
import {
  buildWeekPool,
  groupByPriority,
  getWeekDates,
  getWeekDayIndex,
  WEEK_PRIORITY_COLOR,
} from '@/lib/week';
import { useLocale } from '@/i18n/context';

interface WeekBoardViewProps {
  tasks: Task[];
  projects: Project[];
  today: string;
  lastUsedProjectId?: string | null;
  /** 이번 주에 바로 태스크 생성 */
  onAdd: (
    title: string,
    projectId: string | null,
    priority: WeekPriority,
    weekDay: number | null,
  ) => void;
  onSetPriority: (taskId: string, priority: WeekPriority) => void;
  onSetWeekDay: (taskId: string, weekDay: number | null) => void;
  onSetProject: (taskId: string, projectId: string | null) => void;
  onUpdateTitle: (taskId: string, title: string) => void;
  onSendToBacklog: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onPlaceInSlot: (task: Task) => void;
}

/**
 * 주 단위 세팅 화면이자 태스크를 만드는 기본 자리.
 * 개수 상한은 없고, 긴급/중요/보통으로 줄을 세운다.
 */
export default function WeekBoardView({
  tasks,
  projects,
  today,
  lastUsedProjectId,
  onAdd,
  onSetPriority,
  onSetWeekDay,
  onSetProject,
  onUpdateTitle,
  onSendToBacklog,
  onDelete,
  onPlaceInSlot,
}: WeekBoardViewProps) {
  const { t } = useLocale();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pool = useMemo(() => buildWeekPool(tasks, today), [tasks, today]);
  const groups = useMemo(() => groupByPriority(pool.items), [pool.items]);
  const weekDates = useMemo(() => getWeekDates(today), [today]);
  const todayIndex = useMemo(() => getWeekDayIndex(today), [today]);
  const selected = useMemo(
    () => tasks.find((x) => x.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  const rangeLabel = useMemo(() => {
    const fmt = (d: string) => {
      const [, m, day] = d.split('-');
      return `${parseInt(m, 10)}/${parseInt(day, 10)}`;
    };
    return t.weekRange(fmt(weekDates[0]), fmt(weekDates[6]));
  }, [weekDates, t]);

  // 프로젝트 쏠림 — 아직 안 끝낸 것 기준
  const byProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { task, status } of pool.items) {
      if (status === 'done') continue;
      const key = task.projectId ?? '__none__';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([id, count]) => ({
        count,
        project: id === '__none__' ? null : projects.find((p) => p.id === id) ?? null,
      }))
      .sort((a, b) => b.count - a.count);
  }, [pool.items, projects]);

  const paceText = pool.pace.toFixed(pool.pace % 1 === 0 ? 0 : 1);

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} strokeWidth={1.8} className="text-[var(--foreground)]" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">{t.weekView}</h2>
          <span className="text-[13px] text-[var(--muted-foreground)]">{rangeLabel}</span>
        </div>
        <span className="text-[13px] text-[var(--muted-foreground)]">
          {t.weekRemaining(pool.remaining, pool.doneCount)}
          {pool.remaining > 0 &&
            ` · ${t.weekDaysLeft(pool.daysLeft)} · ${t.weekPacePerDay(paceText)}`}
        </span>
      </div>

      {/* 추가 — 이번 주가 태스크를 만드는 기본 자리 */}
      <WeekAddRow
        projects={projects}
        lastUsedProjectId={lastUsedProjectId}
        onAdd={onAdd}
        todayIndex={todayIndex}
      />

      {/* 프로젝트 쏠림 */}
      {byProject.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {byProject.map(({ project, count }) => (
            <span
              key={project?.id ?? '__none__'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--muted)] text-[13px] text-[var(--muted-foreground)]"
            >
              <ColorDot color={project?.color ?? '#8A8A8A'} size="sm" />
              {project?.name ?? t.uncategorized}
              <span className="font-semibold text-[var(--foreground)]">{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {pool.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
          <CalendarCheck size={32} strokeWidth={1.2} className="mb-3 opacity-40" />
          <p className="text-sm">{t.weekEmpty}</p>
        </div>
      )}

      {/* 우선순위 그룹 — 완료 항목도 자기 그룹에 남는다 */}
      {groups
        .filter((g) => g.items.length > 0)
        .map(({ priority, items }) => (
          <section key={priority} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: WEEK_PRIORITY_COLOR[priority] }}
              />
              <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
                {t.weekPriorities[priority]}
              </h3>
              <span className="text-[12px] text-[var(--muted-foreground)]">
                {items.filter((x) => x.status !== 'done').length}
              </span>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
              {items.map(({ task, status, dayPassed }) => {
                const project = task.projectId
                  ? projects.find((p) => p.id === task.projectId) ?? null
                  : null;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedId(task.id)}
                    className={[
                      'group w-full flex items-center gap-2 px-3 py-2.5 text-left',
                      'border-b border-[var(--border)] last:border-b-0',
                      'hover:bg-[var(--muted)] transition-colors',
                      status === 'scheduled' ? 'opacity-50' : '',
                      status === 'done' ? 'opacity-60' : '',
                    ].join(' ')}
                    title={status === 'scheduled' ? t.weekScheduledToday : undefined}
                  >
                    {status === 'done' ? (
                      <Check
                        size={13}
                        strokeWidth={2.4}
                        className="flex-shrink-0 text-[var(--g-success)]"
                      />
                    ) : (
                      <ProjectDotLabel project={project} />
                    )}
                    <span
                      className={[
                        'flex-1 min-w-0 truncate text-[15px] text-[var(--foreground)]',
                        status === 'done' ? 'line-through text-[var(--muted-foreground)]' : '',
                      ].join(' ')}
                    >
                      {task.title}
                    </span>
                    {status !== 'done' && (
                      <span
                        className={[
                          'flex-shrink-0 px-1.5 py-0.5 rounded-full text-[11px] border',
                          task.weekDay === undefined
                            ? 'border-dashed border-[var(--border)] text-[var(--muted-foreground)]/60'
                            : dayPassed
                              ? 'border-transparent bg-[var(--muted)] text-[var(--muted-foreground)]'
                              : 'border-[var(--border)] text-[var(--muted-foreground)]',
                        ].join(' ')}
                        title={dayPassed ? t.weekDayPassed : t.weekWhen}
                      >
                        {task.weekDay === undefined ? t.weekWhen : t.weekdayShortMon[task.weekDay]}
                      </span>
                    )}
                    {status === 'scheduled' && (
                      <span className="flex-shrink-0 text-[11px] text-[var(--muted-foreground)]">
                        {t.weekScheduledToday}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      <WeekItemDialog
        task={selected}
        projects={projects}
        onClose={() => setSelectedId(null)}
        onUpdateTitle={onUpdateTitle}
        onSetPriority={onSetPriority}
        onSetWeekDay={onSetWeekDay}
        onSetProject={onSetProject}
        todayIndex={todayIndex}
        onPlaceInSlot={onPlaceInSlot}
        onSendToBacklog={onSendToBacklog}
        onDelete={onDelete}
      />
    </div>
  );
}
