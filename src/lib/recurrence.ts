import { nanoid } from 'nanoid';
import type { Task } from './types';

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** 반복 투두의 오늘 인스턴스 생성 필요 여부 */
export function shouldCreateRecurringInstance(
  task: Task,
  allTasks: Task[],
  date: string,
): boolean {
  if (!task.recurrence) return false;
  if (task.isRecurrenceActive === false) return false;

  const startDate = task.startDate;
  if (!startDate) return false;

  const start = parseDate(startDate);
  const target = parseDate(date);
  if (target < start) return false;

  // "이 날만 삭제"로 건너뛴 날짜면 생성 안 함
  if (task.skippedDates?.includes(date)) return false;

  // 이미 해당 날짜에 이 반복 투두의 인스턴스가 있으면 생성 안 함
  const alreadyExists = allTasks.some(
    (t) => t.recurrenceParentId === task.id && t.date === date,
  );
  if (alreadyExists) return false;

  // 요일 필터
  const hasDaysFilter = task.daysOfWeek && task.daysOfWeek.length > 0;
  if (hasDaysFilter && !task.daysOfWeek!.includes(target.getUTCDay())) {
    return false;
  }

  const startMs = start.getTime();
  const targetMs = target.getTime();
  const diffDays = Math.round((targetMs - startMs) / (1000 * 60 * 60 * 24));

  switch (task.recurrence) {
    case 'daily':
      return true;
    case 'weekly':
      return hasDaysFilter ? true : diffDays % 7 === 0;
    case 'biweekly': {
      if (hasDaysFilter) {
        const weekNum = Math.floor(diffDays / 7);
        return weekNum % 2 === 0;
      }
      return diffDays % 14 === 0;
    }
    case 'monthly': {
      const startDay = start.getUTCDate();
      const targetDay = target.getUTCDate();
      if (startDay !== targetDay) return false;
      const monthDiff =
        (target.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        (target.getUTCMonth() - start.getUTCMonth());
      return monthDiff >= 0;
    }
    default:
      return false;
  }
}

/** 반복 투두 인스턴스(일반 Task) 생성 — 기본 슬롯에 자동 배치 */
export function createRecurringInstance(parent: Task, date: string): Task {
  return {
    id: `item_${nanoid()}`,
    type: 'task',
    title: parent.title,
    projectId: parent.projectId,
    slot: parent.defaultSlot ?? null,
    deferCount: 0,
    continueCount: 0,
    completedAt: null,
    date,
    createdAt: new Date().toISOString(),
    recurrenceParentId: parent.id,
    scheduledStartTime: parent.scheduledStartTime,
    scheduledEndTime: parent.scheduledEndTime,
  };
}
