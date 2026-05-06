import type { Task, RoutineInstance } from './types';

/** 전체 누적 XP (모든 날짜 합산) */
export function calculateTotalXP(
  tasks: Task[],
  routineInstances: RoutineInstance[],
): number {
  let xp = 0;

  for (const task of tasks) {
    if (task.completedAt && task.slot) {
      xp += task.slot.priority === 1 ? 3 : task.slot.priority === 2 ? 2 : 1;
    } else if (task.slot && !task.completedAt) {
      xp -= 1;
    } else if (!task.slot && task.deferCount > 0) {
      xp -= 2;
    }
  }

  for (const ri of routineInstances) {
    if (ri.completedAt && ri.slot) {
      xp += ri.slot.priority === 1 ? 3 : ri.slot.priority === 2 ? 2 : 1;
    } else if (ri.slot && !ri.completedAt) {
      xp -= 1;
    } else if (!ri.slot && ri.deferCount > 0) {
      xp -= 2;
    }
  }

  return xp;
}

/** 특정 날짜의 XP */
export function calculateDailyXP(
  tasks: Task[],
  routineInstances: RoutineInstance[],
  date: string
): number {
  let xp = 0;

  const dateTasks = tasks.filter((t) => t.date === date);
  const dateInstances = routineInstances.filter((ri) => ri.date === date);

  for (const task of dateTasks) {
    if (task.completedAt && task.slot) {
      xp += task.slot.priority === 1 ? 3 : task.slot.priority === 2 ? 2 : 1;
    } else if (task.slot && !task.completedAt) {
      xp -= 1;
    } else if (!task.slot && task.deferCount > 0) {
      xp -= 2;
    }
  }

  for (const ri of dateInstances) {
    if (ri.completedAt && ri.slot) {
      xp += ri.slot.priority === 1 ? 3 : ri.slot.priority === 2 ? 2 : 1;
    } else if (ri.slot && !ri.completedAt) {
      xp -= 1;
    } else if (!ri.slot && ri.deferCount > 0) {
      xp -= 2;
    }
  }

  return xp;
}
