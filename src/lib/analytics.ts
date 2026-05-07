/**
 * GA4 커스텀 이벤트 헬퍼
 *
 * 사용법:
 *   trackEvent('slot_fill', { period: 'morning', priority: 1 })
 *   trackEvent('task_complete', { xp: 10 })
 */

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// ── 자주 쓸 이벤트 프리셋 ──

/** "시작하기" / 로그인 CTA 클릭 */
export const trackLoginClick = () =>
  trackEvent('login_cta_click');

/** 슬롯에 태스크 배치 */
export const trackSlotFill = (period: string, priority: number) =>
  trackEvent('slot_fill', { period, priority });

/** 태스크 완료 */
export const trackTaskComplete = (xp: number) =>
  trackEvent('task_complete', { xp });

/** 루틴 완료 */
export const trackRoutineComplete = () =>
  trackEvent('routine_complete');

/** 미루기 */
export const trackDefer = () =>
  trackEvent('task_defer');

/** 또하기 */
export const trackRepeat = () =>
  trackEvent('task_repeat');

/** 프로젝트 생성 */
export const trackProjectCreate = () =>
  trackEvent('project_create');

/** 데이터 내보내기 */
export const trackExport = (format: 'json' | 'markdown') =>
  trackEvent('data_export', { format });

/** 뽀모도로 완료 */
export const trackPomodoroComplete = (seconds: number) =>
  trackEvent('pomodoro_complete', { duration_seconds: seconds });

/** 검색 사용 */
export const trackSearch = (query_length: number) =>
  trackEvent('search_use', { query_length });
