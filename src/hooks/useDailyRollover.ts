'use client';

import { useEffect, useRef } from 'react';
import type { AppState } from '@/lib/types';
import { shouldCreateRecurringInstance, createRecurringInstance } from '@/lib/recurrence';
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

      // 2. 반복 투두 중복 인스턴스 정리
      const instanceKeys = new Set<string>();
      const dupeIds: string[] = [];
      for (const t of nextTasks) {
        if (!t.recurrenceParentId || !t.date) continue;
        const key = `${t.recurrenceParentId}__${t.date}`;
        if (instanceKeys.has(key)) { dupeIds.push(t.id); changed = true; }
        else instanceKeys.add(key);
      }
      if (dupeIds.length > 0) {
        nextTasks = nextTasks.filter((t) => !dupeIds.includes(t.id));
      }

      // 3. 반복 투두 인스턴스 자동 생성 (슬롯 자동 배치)
      const recurringParents = nextTasks.filter((t) => t.recurrence && t.isRecurrenceActive !== false);
      for (const parent of recurringParents) {
        if (shouldCreateRecurringInstance(parent, nextTasks, today)) {
          const instance = createRecurringInstance(parent, today);
          nextTasks = [...nextTasks, instance];
          changed = true;
        }
      }

      if (!changed) return prev;
      return {
        ...prev,
        tasks: nextTasks,
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
