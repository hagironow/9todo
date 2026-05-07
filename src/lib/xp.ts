import type { Task, RoutineInstance, TimePeriod } from './types';
import { getToday } from './date';

/**
 * 해당 시간대가 이미 지났는지 판단.
 * - 과거 날짜: 모든 시간대 지남
 * - 오늘: 현재 시각 기준 (morning < 12시, afternoon < 18시, evening < 새벽 5시)
 * - 미래 날짜: 아직 안 지남
 */
function isPeriodPassed(taskDate: string, period: TimePeriod, referenceDate: string): boolean {
  if (taskDate < referenceDate) return true;
  if (taskDate > referenceDate) return false;

  // 오늘인 경우 — 현재 시각으로 판단
  const hour = new Date().getHours();
  if (period === 'morning') return hour >= 12;
  if (period === 'afternoon') return hour >= 18;
  // evening: 다음날 새벽 5시까지이므로, 당일에는 아직 안 지남
  return false;
}

function scoreTask(task: Task, today: string): number {
  if (task.completedAt && task.slot) {
    return task.slot.priority === 1 ? 3 : task.slot.priority === 2 ? 2 : 1;
  }
  if (task.slot && !task.completedAt) {
    // 시간대가 지난 경우에만 페널티
    if (task.date && isPeriodPassed(task.date, task.slot.period, today)) return -1;
    return 0;
  }
  if (!task.slot && task.deferCount > 0) return -2;
  return 0;
}

export const GOAL_COMPLETE_XP = 10;

/** 전체 누적 XP (모든 날짜 합산) */
export function calculateTotalXP(
  tasks: Task[],
  routineInstances: RoutineInstance[],
  goalCompletedDates?: string[],
): number {
  const today = getToday();
  let xp = 0;

  for (const task of tasks) {
    xp += scoreTask(task, today);
  }

  for (const ri of routineInstances) {
    if (ri.completedAt) xp += 1;
  }

  xp += (goalCompletedDates?.length ?? 0) * GOAL_COMPLETE_XP;

  return xp;
}

/** 특정 날짜의 XP */
export function calculateDailyXP(
  tasks: Task[],
  routineInstances: RoutineInstance[],
  date: string,
  goalCompletedDates?: string[],
): number {
  const today = getToday();
  let xp = 0;

  const dateTasks = tasks.filter((t) => t.date === date);
  const dateInstances = routineInstances.filter((ri) => ri.date === date);

  for (const task of dateTasks) {
    xp += scoreTask(task, today);
  }

  for (const ri of dateInstances) {
    if (ri.completedAt) xp += 1;
  }

  if (goalCompletedDates?.includes(date)) xp += GOAL_COMPLETE_XP;

  return xp;
}
