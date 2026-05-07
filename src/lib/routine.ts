import { nanoid } from 'nanoid';
import type { Routine, RoutineInstance } from './types';

// YYYY-MM-DD 파싱 (UTC 기준, timezone drift 방지)
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 루틴 인스턴스 생성
export function createRoutineInstance(routine: Routine, date: string): RoutineInstance {
  return {
    id: `ri_${nanoid()}`,
    routineId: routine.id,
    date,
    slot: { ...routine.defaultSlot },
    deferCount: 0,
    completedAt: null,
  };
}

// 다음 발생일 계산
export function getNextOccurrence(routine: Routine, fromDate: string): string {
  const base = parseDate(fromDate);

  switch (routine.recurrence) {
    case 'daily': {
      const next = new Date(base);
      next.setUTCDate(next.getUTCDate() + 1);
      return formatDate(next);
    }
    case 'weekly': {
      const next = new Date(base);
      next.setUTCDate(next.getUTCDate() + 7);
      return formatDate(next);
    }
    case 'biweekly': {
      const next = new Date(base);
      next.setUTCDate(next.getUTCDate() + 14);
      return formatDate(next);
    }
    case 'monthly': {
      const next = new Date(base);
      next.setUTCMonth(next.getUTCMonth() + 1);
      return formatDate(next);
    }
    default:
      throw new Error(`Unknown recurrence type: ${routine.recurrence}`);
  }
}

// 오늘 인스턴스 생성 필요 여부 판단
export function shouldCreateInstance(
  routine: Routine,
  existingInstances: RoutineInstance[],
  date: string,
): boolean {
  if (!routine.isActive) return false;

  // startDate 이전이면 생성 안 함
  const start = parseDate(routine.startDate);
  const target = parseDate(date);
  if (target < start) return false;

  // 이미 해당 날짜 인스턴스가 있으면 생성 안 함
  const alreadyExists = existingInstances.some(
    (ri) => ri.routineId === routine.id && ri.date === date,
  );
  if (alreadyExists) return false;

  // 요일 필터: daysOfWeek가 설정되어 있으면 해당 요일만 허용
  const hasDaysFilter = routine.daysOfWeek && routine.daysOfWeek.length > 0;
  if (hasDaysFilter && !routine.daysOfWeek!.includes(target.getUTCDay())) {
    return false;
  }

  // 발생 주기 확인: startDate부터 date까지 간격이 recurrence 배수인지 확인
  const startMs = start.getTime();
  const targetMs = target.getTime();
  const diffDays = Math.round((targetMs - startMs) / (1000 * 60 * 60 * 24));

  switch (routine.recurrence) {
    case 'daily':
      return true;
    case 'weekly': {
      if (hasDaysFilter) {
        // 요일 필터가 있으면 매주 해당 요일에 발생
        return true;
      }
      return diffDays % 7 === 0;
    }
    case 'biweekly': {
      if (hasDaysFilter) {
        // 2주 간격: startDate 기준 짝수 주에만 발생
        const weekNum = Math.floor(diffDays / 7);
        return weekNum % 2 === 0;
      }
      return diffDays % 14 === 0;
    }
    case 'monthly': {
      // 같은 날짜(일) 이면서 월이 startDate 기준 정수 배수
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
