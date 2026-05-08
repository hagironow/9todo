'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { createRoutineInstance, shouldCreateInstance } from '@/lib/routine';
import { formatLocalDate } from '@/lib/date';

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
      let nextRoutineInstances = prev.routineInstances;

      // 1. 어제 이전 미완료 태스크 → slot=null, date=null (백로그 이동) — 실제 오늘일 때만
      const realToday = formatLocalDate(new Date());
      if (today === realToday) {
        nextTasks = nextTasks.map((t) => {
          if (t.date && t.date < today && t.completedAt === null && t.slot !== null) {
            changed = true;
            return { ...t, slot: null, date: null };
          }
          return t;
        });
      }

      // 2. 해당 날짜의 루틴 인스턴스 자동 생성
      for (const routine of prev.routines) {
        if (shouldCreateInstance(routine, nextRoutineInstances, today)) {
          const instance = createRoutineInstance(routine, today);
          nextRoutineInstances = [...nextRoutineInstances, instance];
          changed = true;
        }
      }

      // 3. goals.today 리셋 — 어제 완료했으면 오늘은 비우기 (어제만 체크, 과거 전체 X)
      let nextGoalCompass = prev.goalCompass;
      if (today === realToday) {
        const completedDates = prev.goalCompletedDates ?? [];
        const yesterday = getPreviousDay(today);
        // 어제 완료 기록이 있고, 오늘은 아직 완료 안 했으면 리셋
        const hasYesterdayCompletion = completedDates.includes(yesterday);
        const hasTodayCompletion = completedDates.includes(today);
        if (hasYesterdayCompletion && !hasTodayCompletion && prev.goalCompass.goals.today) {
          nextGoalCompass = {
            ...prev.goalCompass,
            goals: { ...prev.goalCompass.goals, today: '' },
          };
          changed = true;
        }
      }

      if (!changed) return prev;
      return {
        ...prev,
        tasks: nextTasks,
        routineInstances: nextRoutineInstances,
        goalCompass: nextGoalCompass,
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
