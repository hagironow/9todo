'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { createRoutineInstance, shouldCreateInstance } from '@/lib/routine';

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

      // 1. 어제 미완료 태스크 → slot=null (백로그 이동) — 실제 오늘일 때만
      const realToday = new Date().toISOString().split('T')[0];
      if (today === realToday) {
        const yesterday = getPreviousDay(today);
        nextTasks = nextTasks.map((t) => {
          if (t.date === yesterday && t.completedAt === null && t.slot !== null) {
            changed = true;
            return { ...t, slot: null };
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

      if (!changed) return prev;
      return {
        ...prev,
        tasks: nextTasks,
        routineInstances: nextRoutineInstances,
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
