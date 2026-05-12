import type { TimePeriod } from './types';

/**
 * 시간대 경계 기본값
 * - morning: MORNING_START ~ AFTERNOON_START
 * - afternoon: AFTERNOON_START ~ EVENING_START
 * - evening: EVENING_START ~ MORNING_START (다음날)
 */
export const DEFAULT_MORNING_START = 5;
export const DEFAULT_AFTERNOON_START = 12;
export const DEFAULT_EVENING_START = 18;

const LS_KEY = '9todo_period_boundaries';

export interface PeriodBoundaries {
  morningStart: number;
  afternoonStart: number;
  eveningStart: number;
}

export function loadBoundaries(): PeriodBoundaries {
  if (typeof window === 'undefined') {
    return { morningStart: DEFAULT_MORNING_START, afternoonStart: DEFAULT_AFTERNOON_START, eveningStart: DEFAULT_EVENING_START };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { morningStart: DEFAULT_MORNING_START, afternoonStart: DEFAULT_AFTERNOON_START, eveningStart: DEFAULT_EVENING_START };
    const parsed = JSON.parse(raw) as PeriodBoundaries;
    return {
      morningStart: parsed.morningStart ?? DEFAULT_MORNING_START,
      afternoonStart: parsed.afternoonStart ?? DEFAULT_AFTERNOON_START,
      eveningStart: parsed.eveningStart ?? DEFAULT_EVENING_START,
    };
  } catch {
    return { morningStart: DEFAULT_MORNING_START, afternoonStart: DEFAULT_AFTERNOON_START, eveningStart: DEFAULT_EVENING_START };
  }
}

export function saveBoundaries(b: PeriodBoundaries) {
  localStorage.setItem(LS_KEY, JSON.stringify(b));
}

// 하위 호환: 기존 상수 참조하는 코드를 위한 getter
export const MORNING_START = DEFAULT_MORNING_START;
export const AFTERNOON_START = DEFAULT_AFTERNOON_START;
export const EVENING_START = DEFAULT_EVENING_START;

/** 시각(hour, 0-23) → TimePeriod 변환 */
export function hourToPeriod(hour: number, boundaries?: PeriodBoundaries): TimePeriod {
  const b = boundaries ?? loadBoundaries();
  if (hour < b.morningStart) return 'evening';
  if (hour < b.afternoonStart) return 'morning';
  if (hour < b.eveningStart) return 'afternoon';
  return 'evening';
}

/** 시간대가 끝나는 시각 (다음 시간대 시작 시각) */
export function periodEndHour(period: TimePeriod, boundaries?: PeriodBoundaries): number {
  const b = boundaries ?? loadBoundaries();
  if (period === 'morning') return b.afternoonStart;
  if (period === 'afternoon') return b.eveningStart;
  return b.morningStart;
}

/** 시간대별 시작-끝 시각 문자열 생성 */
export function periodTimeLabel(period: TimePeriod, boundaries?: PeriodBoundaries): string {
  const b = boundaries ?? loadBoundaries();
  if (period === 'morning') return `${b.morningStart}:00 ~ ${b.afternoonStart}:00`;
  if (period === 'afternoon') return `${b.afternoonStart}:00 ~ ${b.eveningStart}:00`;
  return `${b.eveningStart}:00 ~ ${b.morningStart}:00`;
}
