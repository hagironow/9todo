import type { Task, WeekPriority } from '@/lib/types';
import { formatLocalDate, getWeekKey } from '@/lib/date';

/** 우선순위 정렬 순서 — 긴급 → 중요 → 보통 */
export const WEEK_PRIORITY_ORDER: Record<WeekPriority, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
};

/**
 * 우선순위별 색 (토큰만 사용).
 * 텍스트가 아니라 점/막대에만 쓴다 — 노란색은 본문 대비가 부족하다.
 */
export const WEEK_PRIORITY_COLOR: Record<WeekPriority, string> = {
  urgent: 'var(--g-error)',
  important: 'var(--energy-mid)',
  normal: 'var(--muted-foreground)',
};

/** 월요일 시작 기준 이번 주 날짜 7개 */
export function getWeekDates(dateStr: string): string[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.getDay() || 7; // 0(일) → 7
  const monday = new Date(date);
  monday.setDate(date.getDate() - (dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return formatLocalDate(day);
  });
}

/** 월요일 시작 기준 오늘의 요일 인덱스 (0=월 ~ 6=일) */
export function getWeekDayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return (new Date(y, m - 1, d).getDay() || 7) - 1;
}

/** 오늘 포함 이번 주에 남은 날 수 (월~일 기준) */
export function getDaysLeftInWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay() || 7;
  return 7 - dow + 1;
}

/** 풀 안에서의 상태 — 완료돼도 목록에서 사라지지 않는다 */
export type WeekItemStatus = 'todo' | 'scheduled' | 'done';

export interface WeekPoolItem {
  task: Task;
  priority: WeekPriority;
  status: WeekItemStatus;
  /** 적어둔 요일이 이미 지났는지 — 벌점이 아니라 "지금 후보"라는 표시 */
  dayPassed: boolean;
}

export interface WeekPool {
  items: WeekPoolItem[];  // 완료 포함 전부. 우선순위 → 상태 순
  remaining: number;      // 아직 안 끝낸 것
  doneCount: number;
  daysLeft: number;
  /** 남은 항목 ÷ 남은 날. 상한이 없으므로 "속도"만 알려준다. */
  pace: number;
}

const STATUS_ORDER: Record<WeekItemStatus, number> = { todo: 0, scheduled: 1, done: 2 };

/**
 * 요일 정렬 버킷.
 * 지나간 요일은 '연체'가 아니라 '지금 후보'라서 맨 위로 올린다.
 */
function dayBucket(weekDay: number | undefined, todayIdx: number): number {
  if (weekDay === undefined) return 2; // 아무 때나 — 맨 아래
  return weekDay < todayIdx ? 0 : 1;   // 지나감 → 위, 오늘/앞으로 → 다음
}

/**
 * 이번 주 풀을 만든다.
 * weekKey가 현재 주와 일치하는 항목만 들어오므로, 주가 지나면 자동으로 비워진다.
 *
 * 미루기 원본(isDeferred)은 그날 타임테이블에 흔적으로 남는 자리표시일 뿐이고
 * 실제 할 일은 복제본 쪽이다. 둘 다 weekKey를 들고 있으므로 원본을 빼지 않으면
 * 같은 일이 두 줄로 보인다.
 */
export function buildWeekPool(tasks: Task[], today: string): WeekPool {
  const weekKey = getWeekKey(today);
  const mine = (tasks ?? []).filter(
    (t) => t.weekKey === weekKey && !t.recurrence && !t.recurrenceParentId && !t.isDeferred,
  );

  const todayIdx = getWeekDayIndex(today);

  const items: WeekPoolItem[] = mine
    .map((task) => ({
      task,
      priority: task.weekPriority ?? ('normal' as WeekPriority),
      status: (task.completedAt
        ? 'done'
        : task.slot && task.date === today
          ? 'scheduled'
          : 'todo') as WeekItemStatus,
      /** 요일이 지났고 아직 안 끝낸 것 */
      dayPassed:
        task.weekDay !== undefined && task.weekDay < todayIdx && !task.completedAt,
    }))
    .sort((a, b) => {
      const p = WEEK_PRIORITY_ORDER[a.priority] - WEEK_PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      const st = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (st !== 0) return st;
      const db = dayBucket(a.task.weekDay, todayIdx) - dayBucket(b.task.weekDay, todayIdx);
      if (db !== 0) return db;
      const da = (a.task.weekDay ?? 99) - (b.task.weekDay ?? 99);
      if (da !== 0) return da;
      return (a.task.createdAt ?? '').localeCompare(b.task.createdAt ?? '');
    });

  const doneCount = items.filter((x) => x.status === 'done').length;
  const remaining = items.length - doneCount;
  const daysLeft = getDaysLeftInWeek(today);

  return {
    items,
    remaining,
    doneCount,
    daysLeft,
    pace: daysLeft > 0 ? remaining / daysLeft : remaining,
  };
}

/** 우선순위별로 묶는다 */
export function groupByPriority(
  items: WeekPoolItem[],
): { priority: WeekPriority; items: WeekPoolItem[] }[] {
  return (['urgent', 'important', 'normal'] as WeekPriority[]).map((priority) => ({
    priority,
    items: items.filter((x) => x.priority === priority),
  }));
}

/** 요일별 미완료 개수. 인덱스 0=월 ~ 6=일, noDay는 요일을 안 적은 것 */
export function countByWeekDay(items: WeekPoolItem[]): { days: number[]; noDay: number } {
  const days = [0, 0, 0, 0, 0, 0, 0];
  let noDay = 0;
  for (const { task, status } of items) {
    if (status === 'done') continue;
    if (task.weekDay === undefined) noDay += 1;
    else if (task.weekDay >= 0 && task.weekDay <= 6) days[task.weekDay] += 1;
  }
  return { days, noDay };
}
