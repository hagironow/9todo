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
    if (lastRolloverDate.current === today) return;
    lastRolloverDate.current = today;

    const realToday = formatLocalDate(new Date());

    batchUpdate((prev) => {
      let changed = false;
      let nextTasks = prev.tasks;

      // 1. 어제 이전 미완료 태스크 → 백로그 이동 — 실제 오늘일 때만
      if (today === realToday) {
        nextTasks = nextTasks.map((t) => {
          if (t.date && t.date < today && t.completedAt === null && t.slot !== null && !t.recurrenceParentId) {
            // 미뤄진 태스크는 이미 복제본이 백로그에 있으므로 백로그로 다시 이동하지 않고 원본 자리에 보존
            if (t.isDeferred) return t;
            changed = true;
            return { ...t, slot: null, date: null };
          }
          return t;
        });
      }

      // 2. 반복 투두 정리: 고아 + 과거 미완료(realToday 기준) + 중복
      const parentIds = new Set(nextTasks.filter((t) => t.recurrence).map((t) => t.id));
      const instanceKeys = new Set<string>();
      const removeIds: string[] = [];
      for (const t of nextTasks) {
        if (!t.recurrenceParentId) continue;
        if (!parentIds.has(t.recurrenceParentId)) {
          removeIds.push(t.id); changed = true; continue;
        }
        if (t.date && t.date < realToday && !t.completedAt) {
          // 미뤄진 반복 인스턴스는 어제 타임테이블에 기록으로 남겨둠
          if (t.isDeferred) continue;
          removeIds.push(t.id); changed = true; continue;
        }
        if (t.date) {
          const key = `${t.recurrenceParentId}__${t.date}`;
          if (instanceKeys.has(key)) { removeIds.push(t.id); changed = true; }
          else instanceKeys.add(key);
        }
      }
      if (removeIds.length > 0) {
        nextTasks = nextTasks.filter((t) => !removeIds.includes(t.id));
      }

      // 3. 반복 투두 인스턴스 생성 — shouldCreateRecurringInstance가 중복/startDate 전부 판단
      const recurringParents = nextTasks.filter((t) => t.recurrence && t.isRecurrenceActive !== false);
      for (const parent of recurringParents) {
        if (shouldCreateRecurringInstance(parent, nextTasks, today)) {
          nextTasks = [...nextTasks, createRecurringInstance(parent, today)];
          changed = true;
        }
      }

      if (!changed) return prev;
      return { ...prev, tasks: nextTasks };
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
