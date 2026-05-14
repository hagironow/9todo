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

function isAdmin() {
  return typeof window !== 'undefined' && localStorage.getItem('9todo_admin') === 'true';
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== 'undefined' && window.gtag && !isAdmin()) {
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

/** 태스크 생성 */
export const trackTaskCreate = (hasSlot: boolean, hasProject: boolean) =>
  trackEvent('task_create', { has_slot: hasSlot, has_project: hasProject });

/** 회고 저장 */
export const trackRetroSave = (scope: string) =>
  trackEvent('retro_save', { scope });

// ── 리텐션 코호트 추적 ──

const FIRST_VISIT_KEY = '9todo_first_visit';

/** 첫 방문일 기록 + D1/D3/D7 재방문 이벤트 발송 */
export function trackReturnVisit() {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const stored = localStorage.getItem(FIRST_VISIT_KEY);

  if (!stored) {
    localStorage.setItem(FIRST_VISIT_KEY, String(now));
    return;
  }

  const firstVisit = Number(stored);
  const daysSince = Math.floor((now - firstVisit) / (1000 * 60 * 60 * 24));

  // 같은 세션에서 중복 발송 방지
  const sentKey = `9todo_rv_sent_d${daysSince}`;
  if (sessionStorage.getItem(sentKey)) return;

  if (daysSince === 1) {
    trackEvent('return_visit', { day: 1 });
    sessionStorage.setItem(sentKey, '1');
  } else if (daysSince === 3) {
    trackEvent('return_visit', { day: 3 });
    sessionStorage.setItem(sentKey, '1');
  } else if (daysSince === 7) {
    trackEvent('return_visit', { day: 7 });
    sessionStorage.setItem(sentKey, '1');
  }
}
