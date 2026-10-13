'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import type { Task, Project, WeekPriority } from '@/lib/types';
import ProjectDotLabel from './ProjectDotLabel';
import WeekAddRow from './WeekAddRow';
import {
  buildWeekPool,
  countByWeekDay,
  getWeekDayIndex,
  groupByPriority,
  WEEK_PRIORITY_COLOR,
} from '@/lib/week';
import { useLocale } from '@/i18n/context';

interface WeekStripProps {
  tasks: Task[];
  projects: Project[];
  today: string;
  /** 칩을 누르면 오늘 슬롯으로 내려온다 */
  onPlaceInSlot: (task: Task) => void;
  /** 띠 안에서 바로 태스크 생성 */
  onAdd: (
    title: string,
    projectId: string | null,
    priority: WeekPriority,
    weekDay: number | null,
  ) => void;
  lastUsedProjectId?: string | null;
  /** 태스크 삭제 (확인 모달은 호출부가 띄운다) */
  onDelete: (task: Task) => void;
  isReadOnly?: boolean;
}

/**
 * 9칸 격자 바로 위에 상시 노출되는 '이번 주' 띠.
 * 하루를 통째로 놓쳐도 여기 남아 있으므로, 다음 날 뭘 하려 했는지 기억해낼 필요가 없다.
 * 역할은 하나 — 보고, 오늘로 끌어오기. 우선순위 편집은 '이번 주' 뷰에서 한다.
 */
export default function WeekStrip({
  tasks,
  projects,
  today,
  onPlaceInSlot,
  onAdd,
  lastUsedProjectId,
  onDelete,
  isReadOnly,
}: WeekStripProps) {
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);

  const pool = useMemo(() => buildWeekPool(tasks, today), [tasks, today]);
  const groups = useMemo(() => groupByPriority(pool.items), [pool.items]);
  const spread = useMemo(() => countByWeekDay(pool.items), [pool.items]);
  const todayIndex = useMemo(() => getWeekDayIndex(today), [today]);
  const hasAnyItem = pool.items.length > 0;

  const paceText = pool.pace.toFixed(pool.pace % 1 === 0 ? 0 : 1);

  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3 mb-3">
      {/* 헤더 — 남은 양 · 남은 날 · 하루 속도 */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 min-w-0"
          aria-expanded={!collapsed}
        >
          <span className="text-[15px] font-semibold text-[var(--foreground)] shrink-0">
            {t.weekView}
          </span>
          <ChevronDown
            size={14}
            className={`text-[var(--muted-foreground)] transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
        <span className="text-[12px] text-[var(--muted-foreground)] truncate text-right">
          {t.weekRemaining(pool.remaining, pool.doneCount)}
          {pool.remaining > 0 && (
            <>
              {` · ${t.weekDaysLeft(pool.daysLeft)} · ${t.weekPacePerDay(paceText)}`}
            </>
          )}
        </span>
      </div>

      {!collapsed && (
        <div className="mt-3 flex flex-col gap-2.5">
          {/* 요일 분산 — 어디에 몰렸는지 한 줄로 */}
          {hasAnyItem && (
            <div className="flex flex-wrap items-center gap-1 pb-0.5">
              {spread.days.map((n, i) => (
                <span
                  key={i}
                  className={[
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px]',
                    i === todayIndex
                      ? 'bg-[var(--muted)] text-[var(--foreground)] font-semibold'
                      : i < todayIndex
                        ? 'text-[var(--muted-foreground)]/60'
                        : 'text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  {t.weekdayShortMon[i]}
                  <span className={n === 0 ? 'opacity-40' : 'font-semibold'}>
                    {n === 0 ? '—' : n}
                  </span>
                </span>
              ))}
              {spread.noDay > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] text-[var(--muted-foreground)]">
                  {t.weekAnyDay}
                  <span className="font-semibold">{spread.noDay}</span>
                </span>
              )}
            </div>
          )}
          {pool.items.length === 0 ? (
            <p className="text-[14px] text-[var(--muted-foreground)] py-0.5">{t.weekEmpty}</p>
          ) : pool.remaining === 0 ? (
            <p className="text-[14px] text-[var(--muted-foreground)] py-0.5">{t.weekAllDone}</p>
          ) : (
            groups
              .filter((g) => g.items.length > 0)
              .map(({ priority, items }) => (
                <div key={priority} className="flex items-start gap-2.5">
                  <span className="flex items-center gap-1.5 shrink-0 pt-1 w-[52px]">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: WEEK_PRIORITY_COLOR[priority] }}
                    />
                    <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
                      {t.weekPriorities[priority]}
                    </span>
                  </span>

                  <div className="flex-1 min-w-0 flex flex-wrap gap-1.5">
                    {items.map(({ task, status, dayPassed }) => {
                      const project = task.projectId
                        ? projects.find((p) => p.id === task.projectId) ?? null
                        : null;
                      return (
                        <span
                          key={task.id}
                          className={[
                            'group inline-flex items-center rounded-full border',
                            'text-[14px] max-w-[300px] transition-all',
                            status === 'todo'
                              ? 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]/30'
                              : 'border-[var(--border)]/50 text-[var(--muted-foreground)]',
                            status === 'scheduled' ? 'opacity-50' : '',
                            status === 'done' ? 'opacity-60' : '',
                          ].join(' ')}
                        >
                          <button
                            type="button"
                            disabled={isReadOnly || status !== 'todo'}
                            onClick={() => onPlaceInSlot(task)}
                            title={status === 'todo' ? t.weekPlaceToday : undefined}
                            className="inline-flex items-center gap-1 min-w-0 pl-2.5 pr-1 py-1 disabled:cursor-default"
                          >
                            {status === 'done' ? (
                              <Check
                                size={11}
                                strokeWidth={2.4}
                                className="flex-shrink-0 text-[var(--g-success)]"
                              />
                            ) : (
                              <ProjectDotLabel project={project} />
                            )}
                            <span className={['truncate', status === 'done' ? 'line-through' : ''].join(' ')}>
                              {task.title}
                            </span>
                            {task.weekDay !== undefined && status !== 'done' && (
                              <span
                                className={[
                                  'flex-shrink-0 text-[11px]',
                                  dayPassed
                                    ? 'text-[var(--muted-foreground)]/60'
                                    : 'text-[var(--muted-foreground)]',
                                ].join(' ')}
                                title={dayPassed ? t.weekDayPassed : undefined}
                              >
                                {t.weekdayShortMon[task.weekDay]}
                              </span>
                            )}
                          </button>
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => onDelete(task)}
                              title={t.delete}
                              aria-label={t.delete}
                              className={[
                                'flex-shrink-0 flex items-center justify-center w-5 h-5 mr-1 rounded-full',
                                'text-[var(--muted-foreground)] hover:text-[var(--g-error)]',
                                'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
                              ].join(' ')}
                            >
                              <X size={11} strokeWidth={2.2} />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
          )}

          {/* 띠 안에서 바로 태스크 만들기 */}
          {!isReadOnly && (
            <WeekAddRow
              projects={projects}
              lastUsedProjectId={lastUsedProjectId}
              onAdd={onAdd}
              todayIndex={todayIndex}
            />
          )}
        </div>
      )}
    </section>
  );
}
