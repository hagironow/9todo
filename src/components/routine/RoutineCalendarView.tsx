'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Routine, RoutineInstance, RecurrenceType } from '@/lib/types';
import { shouldCreateInstance } from '@/lib/routine';
import { getToday } from '@/lib/date';

interface RoutineCalendarViewProps {
  routines: Routine[];
  routineInstances: RoutineInstance[];
  onEditRoutine?: (routine: Routine) => void;
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: '매일',
  weekly: '매주',
  biweekly: '격주',
  monthly: '매월',
};

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function RoutineCalendarView({
  routines,
  routineInstances,
  onEditRoutine,
}: RoutineCalendarViewProps) {
  const todayStr = getToday();
  const [todayY, todayM] = todayStr.split('-').map(Number);
  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM - 1); // 0-based
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const activeRoutines = routines.filter((r) => r.isActive);

  // 해당 월의 날짜별 루틴 데이터 계산
  const calendarData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const data: Record<string, { scheduled: Routine[]; completed: Set<string> }> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateString(viewYear, viewMonth, day);
      const scheduled: Routine[] = [];
      const completed = new Set<string>();

      for (const routine of activeRoutines) {
        if (shouldCreateInstance(routine, [], dateStr)) {
          scheduled.push(routine);
          // 해당 날짜에 완료된 인스턴스가 있는지 확인
          const instance = routineInstances.find(
            (ri) => ri.routineId === routine.id && ri.date === dateStr
          );
          if (instance?.completedAt) {
            completed.add(routine.id);
          }
        }
      }

      if (scheduled.length > 0) {
        data[dateStr] = { scheduled, completed };
      }
    }

    return data;
  }, [viewYear, viewMonth, activeRoutines, routineInstances]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const trailingBlanks = (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const goToday = () => {
    const [y, m] = getToday().split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  };

  const isViewingCurrentMonth =
    viewYear === todayY && viewMonth === todayM - 1;

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--foreground)]">루틴</span>
          <span className="text-sm text-[var(--muted-foreground)]">
            {activeRoutines.length}개 활성
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <span className="text-sm font-semibold text-[var(--foreground)] min-w-[100px] text-center">
            {viewYear}년 {viewMonth + 1}월
          </span>
          <button
            onClick={nextMonth}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
          {!isViewingCurrentMonth && (
            <button
              onClick={goToday}
              className="ml-1 px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              이번 달
            </button>
          )}
        </div>
      </div>

      {/* 캘린더 그리드 */}
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
          {/* 이전 달 빈 칸 */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`prev-${i}`} className="min-h-[96px] border-b border-r border-[var(--border)] last:border-r-0" />
          ))}

          {/* 이번 달 날짜 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = toDateString(viewYear, viewMonth, day);
            const isToday = dateStr === todayStr;
            const dayData = calendarData[dateStr];
            const dayOfWeek = (firstDayOfMonth + i) % 7;
            const isLastRow = Math.floor((firstDayOfMonth + i) / 7) === Math.floor((firstDayOfMonth + daysInMonth - 1 + trailingBlanks) / 7);

            return (
              <div
                key={day}
                className={[
                  'min-h-[96px] p-1.5 flex flex-col gap-1',
                  'border-r border-b border-[var(--border)]',
                  dayOfWeek === 6 ? 'border-r-0' : '',
                  isLastRow && trailingBlanks === 0 ? 'border-b-0' : '',
                  '',
                ].join(' ')}
              >
                {/* 날짜 번호 */}
                <div className="flex items-center gap-1 mb-1">
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

                {/* 루틴 칩들 */}
                {dayData && (() => {
                  const isExpanded = expandedDate === dateStr;
                  const visibleRoutines = isExpanded ? dayData.scheduled : dayData.scheduled.slice(0, 3);
                  const hiddenCount = dayData.scheduled.length - 3;

                  return (
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {visibleRoutines.map((routine) => {
                        const isDone = dayData.completed.has(routine.id);
                        return (
                          <button
                            key={routine.id}
                            onClick={() => onEditRoutine?.(routine)}
                            className={[
                              'flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[14px] leading-tight truncate w-full text-left transition-colors',
                              isDone
                                ? 'text-[var(--g-success)]'
                                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
                            ].join(' ')}
                            title={routine.title}
                          >
                            {isDone && <Check size={8} strokeWidth={3} className="flex-shrink-0" />}
                            <span className="truncate">{routine.title}</span>
                          </button>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <button
                          onClick={() => setExpandedDate(isExpanded ? null : dateStr)}
                          className="text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-1 text-left transition-colors"
                        >
                          {isExpanded ? '접기' : `+${hiddenCount}`}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* 다음 달 빈 칸 */}
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

      {/* 루틴 목록 (범례) */}
      {activeRoutines.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            활성 루틴
          </p>
          <div className="flex flex-wrap gap-2">
            {activeRoutines.map((routine) => (
              <button
                key={routine.id}
                onClick={() => onEditRoutine?.(routine)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] text-[var(--fs-tag)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <span className="truncate">{routine.title}</span>
                <span className="text-[var(--muted-foreground)] text-[11px]">
                  {RECURRENCE_LABELS[routine.recurrence]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeRoutines.length === 0 && (
        <div className="flex items-center justify-center py-12 text-[var(--muted-foreground)] text-sm">
          아직 루틴이 없어요. 타임테이블에서 루틴을 추가해 보세요.
        </div>
      )}
    </div>
  );
}
