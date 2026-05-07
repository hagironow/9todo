/** 로컬 시간 기준 YYYY-MM-DD 문자열 반환 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 오늘 날짜 (로컬 시간 기준).
 * 새벽 5시 이전이면 전날로 취급.
 */
export function getToday(): string {
  const now = new Date();
  if (now.getHours() < 5) {
    now.setDate(now.getDate() - 1);
  }
  return formatLocalDate(now);
}

/** 로컬 시간 기준 오늘 (새벽 5시 보정 없는 순수 오늘) */
export function getRealToday(): string {
  return formatLocalDate(new Date());
}
