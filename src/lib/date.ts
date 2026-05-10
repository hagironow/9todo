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

/** ISO 주차 키 반환: "YYYY-Www" (예: "2026-W19") */
export function getWeekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // ISO 8601: 목요일이 속한 주 = 해당 주의 주차
  const dayOfWeek = date.getDay() || 7; // 0(일) → 7
  const thursday = new Date(date);
  thursday.setDate(date.getDate() + 4 - dayOfWeek);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** 월 키 반환: "YYYY-MM" (예: "2026-05") */
export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** 다음 날짜 반환 */
export function getNextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + 1);
  return formatLocalDate(date);
}

/** 다음 주 월요일 키 반환 */
export function getNextWeekMondayKey(weekKey: string): { dateStr: string; weekKey: string } {
  // weekKey: "YYYY-Www"
  const [yearStr, wStr] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  // ISO 주의 월요일 계산: 1월 4일이 속한 주 = W01
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7 + 7); // 다음 주 월요일
  const dateStr = formatLocalDate(monday);
  return { dateStr, weekKey: getWeekKey(dateStr) };
}

/** 다음 달 1일 키 반환 */
export function getNextMonthKey(monthKey: string): { dateStr: string; monthKey: string } {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m, 1); // m은 이미 1-indexed → next month
  const dateStr = formatLocalDate(date);
  return { dateStr, monthKey: getMonthKey(dateStr) };
}
