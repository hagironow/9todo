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
    const tasks = state.tasks.filter(
      (t) =>
        t.slot !== null &&
        t.slot.period === period &&
        t.date === date &&
        t.completedAt === null,
    );

    if (tasks.length === 0) return null;

    // priority 1 → 2 → 3 폴백
    const priorities: Priority[] = [1, 2, 3];
    for (const priority of priorities) {
      const found = tasks.find((item) => item.slot?.priority === priority);
      if (found) return found;
    }

    return null;
  }, [state, period, date]);
}
