'use client';

import { useMemo } from 'react';
import type { AppState, ScheduledItem, TimePeriod, Priority } from '@/lib/types';

interface UseNowFocusOptions {
  state: AppState;
  period: TimePeriod;
  date: string; // "YYYY-MM-DD"
}

export function useNowFocus({ state, period, date }: UseNowFocusOptions): ScheduledItem | null {
  return useMemo(() => {
    // 현재 시간대의 슬롯 배정 항목 수집
    const tasks = state.tasks.filter(
      (t) =>
        t.slot !== null &&
        t.slot.period === period &&
        t.date === date &&
        t.completedAt === null,
    );
    const routineInstances = state.routineInstances.filter(
      (ri) =>
        ri.slot !== null &&
        ri.slot.period === period &&
        ri.date === date &&
        ri.completedAt === null,
    );

    const allItems: ScheduledItem[] = [
      ...tasks,
      ...routineInstances.map((ri) => {
        const routineDetails = state.routines.find((r) => r.id === ri.routineId);
        return { ...ri, routineDetails };
      }),
    ];

    if (allItems.length === 0) return null;

    // priority 1 → 2 → 3 폴백
    const priorities: Priority[] = [1, 2, 3];
    for (const priority of priorities) {
      const found = allItems.find((item) => item.slot?.priority === priority);
      if (found) return found;
    }

    return null;
  }, [state, period, date]);
}
