'use client';

import { useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { AppState, GoalTask } from '@/lib/types';
import { shouldCreateRecurringInstance, createRecurringInstance } from '@/lib/recurrence';
import { formatLocalDate, getWeekKey, getMonthKey } from '@/lib/date';

interface UseDailyRolloverOptions {
  state: AppState;
  today: string; // "YYYY-MM-DD"
  loading: boolean;
  batchUpdate: (updater: (prev: AppState) => AppState) => void;
}

export function useDailyRollover({
  state,
  today,
  loading,
  batchUpdate,
}: UseDailyRolloverOptions): void {
  const lastRolloverDate = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    // 같은 날짜에 대해 중복 실행 방지
    if (lastRolloverDate.current === today) return;
    lastRolloverDate.current = today;

    batchUpdate((prev) => {
      let changed = false;
      let nextTasks = prev.tasks;

      // 1. 어제 이전 미완료 태스크 → slot=null, date=null (백로그 이동) — 실제 오늘일 때만
      // 단, 반복 인스턴스(recurrenceParentId 있음)는 백로그로 보내지 않고 그대로 둠
      const realToday = formatLocalDate(new Date());
      if (today === realToday) {
        nextTasks = nextTasks.map((t) => {
          if (t.date && t.date < today && t.completedAt === null && t.slot !== null && !t.recurrenceParentId) {
            changed = true;
            return { ...t, slot: null, date: null };
          }
          return t;
        });
      }

      // 2. 반복 투두 인스턴스 자동 생성 (슬롯 자동 배치)
      const recurringParents = nextTasks.filter((t) => t.recurrence && t.isRecurrenceActive !== false);
      for (const parent of recurringParents) {
        if (shouldCreateRecurringInstance(parent, nextTasks, today)) {
          const instance = createRecurringInstance(parent, today);
          nextTasks = [...nextTasks, instance];
          changed = true;
        }
      }

      // 3. GoalTask 자동 이관 — 미완료 목표를 다음 기간으로 이관
      let nextGoalTasks = prev.goalTasks ?? [];
      if (today === realToday) {
        const currentWeekKey = getWeekKey(today);
        const currentMonthKey = getMonthKey(today);
        const newCarried: GoalTask[] = [];

        for (const gt of nextGoalTasks) {
          if (gt.completedAt) continue; // 완료된 건 이관 불필요

          let shouldCarry = false;
          let newPeriodKey = '';

          if (gt.goalPeriod === 'today' && gt.periodKey < today) {
            // 어제 이전 미완료 → 오늘로 이관
            shouldCarry = true;
            newPeriodKey = today;
          } else if (gt.goalPeriod === 'week' && gt.periodKey < currentWeekKey) {
            // 지난 주 미완료 → 이번 주로 이관
            shouldCarry = true;
            newPeriodKey = currentWeekKey;
          } else if (gt.goalPeriod === 'month' && gt.periodKey < currentMonthKey) {
            // 지난 달 미완료 → 이번 달로 이관
            shouldCarry = true;
            newPeriodKey = currentMonthKey;
          }

          if (shouldCarry) {
            // 이미 같은 기간+타입의 목표가 있으면 이관하지 않음
            const alreadyExists = nextGoalTasks.some(
              (g) => g.goalPeriod === gt.goalPeriod && g.periodKey === newPeriodKey
            ) || newCarried.some(
              (g) => g.goalPeriod === gt.goalPeriod && g.periodKey === newPeriodKey
            );
            if (!alreadyExists) {
              newCarried.push({
                id: `goal_${nanoid()}`,
                title: gt.title,
                goalPeriod: gt.goalPeriod,
                periodKey: newPeriodKey,
                completedAt: null,
                createdAt: new Date().toISOString(),
                carriedFrom: gt.id,
              });
              changed = true;
            }
          }
        }

        if (newCarried.length > 0) {
          nextGoalTasks = [...nextGoalTasks, ...newCarried];
        }
      }

      if (!changed) return prev;
      return {
        ...prev,
        tasks: nextTasks,
        goalTasks: nextGoalTasks,
      };
    });
  }, [loading, today, batchUpdate]);
}

function getPreviousDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
