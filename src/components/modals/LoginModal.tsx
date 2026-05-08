'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';

/**
 * 사보이어 Fake Door + SITG 계단식 검증
 */

type Step = 'ask' | 'price' | 'regret' | 'profile' | 'commit' | 'thanks-yes' | 'thanks-no';

const STEP_ORDER: Step[] = ['ask', 'price', 'regret', 'profile', 'commit'];

const PRICE_OPTIONS = [
  { value: '4500_monthly', price: '₩4,500/월',           features: '클라우드 동기화, AI 비서, 모바일 앱, 통계 — 모든 기능 포함', badge: null },
  { value: '29800_yearly',  price: '₩29,800/년',          features: '월간 대비 45% 할인, 모든 기능 동일',                      badge: '추천' },
  { value: '35500_lifetime', price: '₩35,500 평생 결제',   features: '개인 클라우드 동기화, 업데이트 포함',                      badge: null },
] as const;

const REGRET_OPTIONS = [
  { value: 'very',        label: '매우 아쉬울 것 같아요', emoji: '😢' },
  { value: 'somewhat',    label: '조금 아쉬워요',         emoji: '😐' },
  { value: 'alternative', label: '다른 대안이 있어요',     emoji: '🤷' },
] as const;

const AGE_OPTIONS = ['10대', '20대', '30대', '40대', '50대+'] as const;
const JOB_OPTIONS = ['개발자', '디자이너', '기획자/PM', '마케터', '학생', '프리랜서/1인 창업', '기타'] as const;

interface SurveyData {
  interest: 'yes' | 'maybe' | 'no';
  price: string;
  regret: string;
  ageGroup: string;
  job: string;
  jobCustom: string;
  email: string;
  interview: boolean;
}

const EMPTY_SURVEY: SurveyData = {
  interest: 'yes',
  price: '',
  regret: '',
  ageGroup: '',
  job: '',
  jobCustom: '',
  email: '',
  interview: false,
};

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = '9todo_survey';
const SESSION_KEY = '9todo_survey_session';

function getDaysSinceFirstUse() {
  const first = localStorage.getItem('9todo_first_use');
  if (!first) return 0;
  return Math.floor((Date.now() - new Date(first).getTime()) / 86400000);
}

/** 세션(진행 중 설문)을 localStorage에 중간 저장 */
function saveSession(data: SurveyData, step: Step) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, lastStep: step, updatedAt: new Date().toISOString() }));
}

/** 세션 복구 — 이전에 중단한 설문이 있으면 반환 */
function loadSession(): { data: SurveyData; step: Step } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { lastStep, updatedAt, ...data } = parsed;
    // 24시간 지난 세션은 폐기
    if (updatedAt && Date.now() - new Date(updatedAt).getTime() > 86400000) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { data: { ...EMPTY_SURVEY, ...data }, step: lastStep || 'ask' };
  } catch {
    return null;
  }
}

/** 앱 상태에서 태스크/루틴 생성 수를 읽어옴 */
function getUsageCounts() {
  try {
    const raw = localStorage.getItem('9todo_state');
    if (!raw) return { taskCount: 0, routineCount: 0 };
    const state = JSON.parse(raw);
    return {
      taskCount: Array.isArray(state.tasks) ? state.tasks.length : 0,
      routineCount: Array.isArray(state.routines) ? state.routines.length : 0,
    };
  } catch {
    return { taskCount: 0, routineCount: 0 };
  }
}

/** 최종 제출 — 배열에 추가 + 세션 삭제 */
function saveSurvey(data: Partial<SurveyData> & { interest: string }, completed: boolean) {
  const entry = {
    ...data,
    completed,
    submittedAt: new Date().toISOString(),
    daysSinceFirstUse: getDaysSinceFirstUse(),
    ...getUsageCounts(),
  };
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  localStorage.removeItem(SESSION_KEY);
}

/*
 * 공통 스타일 — surface-raised (#333 dark / #DCDCDC light)
 */
const LIST_BTN = [
  'w-full flex items-center justify-center h-12 px-5 text-center',
  'rounded-[var(--radius)]',
  'bg-[var(--surface-btn)] border border-transparent',
  'hover:border-[var(--foreground)]',
  'transition-all duration-150 cursor-pointer',
].join(' ');

/* 가격 리스트용 — 2줄 (가격 + 설명) */
const LIST_BTN_MULTI = [
  'w-full flex flex-col items-center justify-center gap-1 px-5 py-3.5 text-center',
  'rounded-[var(--radius)]',
  'bg-[var(--surface-btn)] border border-transparent',
  'hover:border-[var(--foreground)]',
  'transition-all duration-150 cursor-pointer',
].join(' ');

const CHIP_BASE = [
  'px-4 py-2.5 rounded-[var(--radius)] text-[var(--fs-item)] font-medium',
  'transition-all duration-150 cursor-pointer',
].join(' ');

const CHIP_DEFAULT = [
  CHIP_BASE,
  'bg-[var(--surface-raised)] text-[var(--foreground)]',
  'hover:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
].join(' ');

const CHIP_ACTIVE = [
  CHIP_BASE,
  'bg-[var(--surface-raised)] text-[var(--foreground)]',
  'shadow-[inset_0_0_0_1.5px_var(--foreground)]',
].join(' ');

const INPUT_CLASS = [
  'w-full px-4 py-3 rounded-[var(--radius)]',
  'bg-[var(--surface-btn)] border-none',
  'text-[var(--foreground)] text-[var(--fs-item)]',
  'focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
  'transition-all',
].join(' ');

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const [step, setStep] = useState<Step>('ask');
  const [survey, setSurvey] = useState<SurveyData>(EMPTY_SURVEY);
  const jobInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // 세션 복구 — 모달 열릴 때 1회
  useEffect(() => {
    if (open && !initialized.current) {
      initialized.current = true;
      const session = loadSession();
      if (session) {
        setSurvey(session.data);
        setStep(session.step);
      }
    }
    if (!open) {
      initialized.current = false;
    }
  }, [open]);

  const handleClose = () => {
    // 이탈 시 현재까지 입력된 데이터 저장 (thanks 스텝이 아닌 경우)
    if (!step.startsWith('thanks') && step !== 'ask') {
      saveSurvey(survey, false);
    }
    onClose();
    setTimeout(() => {
      setStep('ask');
      setSurvey(EMPTY_SURVEY);
    }, 200);
  };

  const canGoBack = STEP_ORDER.indexOf(step) > 0 && !step.startsWith('thanks');
  const handleBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const handleAnswer = (answer: 'yes' | 'maybe' | 'no') => {
    const next = { ...survey, interest: answer } as SurveyData;
    setSurvey(next);
    if (answer === 'yes') {
      saveSession(next, 'price');
      setStep('price');
    } else {
      saveSurvey({ interest: answer }, false);
      setStep('thanks-no');
    }
  };

  const handlePriceSelect = (price: string) => {
    const next = { ...survey, price };
    setSurvey(next as SurveyData);
    saveSession(next as SurveyData, 'regret');
    setStep('regret');
  };

  const handleRegretSelect = (regret: string) => {
    const next = { ...survey, regret };
    setSurvey(next as SurveyData);
    saveSession(next as SurveyData, 'profile');
    setStep('profile');
  };

  const handleProfileNext = () => {
    saveSession(survey, 'commit');
    setStep('commit');
  };

  const handleSubmit = () => {
    saveSurvey(survey, true);
    setStep('thanks-yes');
  };

  // 기타 선택 시 인풋 자동 포커스
  useEffect(() => {
    if (survey.job === '기타') {
      jobInputRef.current?.focus();
    }
  }, [survey.job]);

  const profileValid = survey.ageGroup && (survey.job === '기타' ? survey.jobCustom.trim() : survey.job);

  return (
    <Dialog open={open} onClose={handleClose} width="md">
      {/* ─── 상단 네비게이션 ─── */}
      <div className="flex items-center justify-between -mt-1 -mx-1 mb-2">
        {canGoBack ? (
          <button
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
        ) : (
          <div className="w-8" />
        )}

        {!step.startsWith('thanks') && (
          <div className="flex items-center gap-1.5">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className={[
                  'h-1 rounded-full transition-all duration-200',
                  i <= STEP_ORDER.indexOf(step) ? 'w-5 bg-[var(--accent)]' : 'w-2 bg-[var(--border)]',
                ].join(' ')}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label="닫기"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* ─── Step 1: 관심 ─── */}
      {step === 'ask' && (
        <div className="flex flex-col py-2">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              이 제품을 계속해서 사용하고 싶으신가요?
            </h2>
            <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
              아직 로그인 기능은 준비 중이에요.<br />
              여러분의 관심이 개발 우선순위를 결정합니다.
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-14">
            <button onClick={() => handleAnswer('yes')} className={LIST_BTN}>
              <span className="text-[var(--fs-item)] font-medium text-[var(--foreground)]">네, 계속 쓰고 싶어요</span>
            </button>
            <button onClick={() => handleAnswer('maybe')} className={LIST_BTN}>
              <span className="text-[var(--fs-item)] font-medium text-[var(--foreground)]">모르겠어요</span>
            </button>
            <button onClick={() => handleAnswer('no')} className={LIST_BTN}>
              <span className="text-[var(--fs-item)] font-medium text-[var(--foreground)]">아니오</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: 가격 ─── */}
      {step === 'price' && (
        <div className="flex flex-col py-2">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
              클라우드 백업, 모바일 앱,<br />AI 비서 기능이 지원된다면?
            </h2>
            <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
              월 얼마까지 내실 수 있나요?
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-14">
            {PRICE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => handlePriceSelect(opt.value)} className={LIST_BTN_MULTI}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[var(--fs-item)] font-semibold text-[var(--foreground)]">
                    {opt.price}
                  </span>
                  {opt.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <span className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
                  {opt.features}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-[var(--fs-tag)] text-[var(--muted-foreground)] mt-2">
            실제 결제가 아닙니다. 개발 방향 참고용이에요.
          </p>
        </div>
      )}

      {/* ─── Step 3: PMF ─── */}
      {step === 'regret' && (
        <div className="flex flex-col py-2">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
              만약 이 서비스가 개발되지 않는다면?
            </h2>
            <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
              얼마나 아쉬울까요?
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-14">
            {REGRET_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => handleRegretSelect(opt.value)} className={LIST_BTN}>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[var(--fs-item)] font-medium text-[var(--foreground)]">
                    {opt.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step 4: 프로필 ─── */}
      {step === 'profile' && (
        <div className="flex flex-col py-2">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
              마지막으로 두 가지만!
            </h2>
          </div>

          {/* 연령대 */}
          <div className="flex flex-col gap-2.5 mt-14">
            <span className="text-[var(--fs-tag)] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              연령대
            </span>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map((age) => (
                <button
                  key={age}
                  onClick={() => setSurvey((s) => ({ ...s, ageGroup: age }))}
                  className={survey.ageGroup === age ? CHIP_ACTIVE : CHIP_DEFAULT}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* 직업군 */}
          <div className="flex flex-col gap-2.5 mt-6">
            <span className="text-[var(--fs-tag)] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              직업군
            </span>
            <div className="flex flex-wrap gap-2">
              {JOB_OPTIONS.map((job) => (
                <button
                  key={job}
                  onClick={() => setSurvey((s) => ({ ...s, job, jobCustom: job === '기타' ? s.jobCustom : '' }))}
                  className={survey.job === job ? CHIP_ACTIVE : CHIP_DEFAULT}
                >
                  {job}
                </button>
              ))}
            </div>
            {survey.job === '기타' && (
              <input
                ref={jobInputRef}
                type="text"
                value={survey.jobCustom}
                onChange={(e) => setSurvey((s) => ({ ...s, jobCustom: e.target.value }))}
                placeholder="직업을 입력해 주세요"
                className={INPUT_CLASS}
              />
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleProfileNext}
            disabled={!profileValid}
            className="w-full mt-6"
          >
            다음
          </Button>
        </div>
      )}

      {/* ─── Step 5: 이메일 + 인터뷰 ─── */}
      {step === 'commit' && (
        <div className="flex flex-col py-2">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
              거의 다 됐어요!
            </h2>
            <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
              이메일을 남겨주시면{' '}
              <strong className="text-[var(--accent)]">3개월 이용권</strong>을 드려요.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-14">
            <label className="flex flex-col gap-1.5">
              <span className="text-[var(--fs-tag)] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                이메일
              </span>
              <input
                type="email"
                value={survey.email}
                onChange={(e) => setSurvey((s) => ({ ...s, email: e.target.value }))}
                placeholder="email@example.com"
                className={INPUT_CLASS}
              />
            </label>

            <button
              onClick={() => setSurvey((s) => ({ ...s, interview: !s.interview }))}
              className={[
                'w-full flex items-start gap-3 p-4 rounded-[var(--radius)] text-left',
                'border transition-all duration-150 cursor-pointer',
                survey.interview
                  ? 'bg-[var(--surface-raised)] border-[var(--foreground)]'
                  : 'bg-[var(--surface-raised)] border-transparent hover:border-[var(--foreground)]',
              ].join(' ')}
            >
              <div className={[
                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                survey.interview
                  ? 'border-[var(--accent)] bg-[var(--accent)]'
                  : 'border-[var(--muted-foreground)]',
              ].join(' ')}>
                {survey.interview && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="var(--accent-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-[var(--fs-item)] font-medium text-[var(--foreground)]">
                  줌 인터뷰 참여 (50분 소요 예상)
                </span>
                <span className="text-[var(--accent)] font-semibold ml-1.5">
                  1년 무료 이용권
                </span>
                <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)] mt-0.5">
                  사용 패턴과 불편한 점을 직접 들려주세요.
                </p>
              </div>
            </button>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="ghost" size="lg" onClick={handleClose} className="flex-1">
              나중에
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={!survey.email.trim()}
              className="flex-1"
            >
              완료
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 6a: 완료 ─── */}
      {step === 'thanks-yes' && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
            <span className="text-3xl">🎉</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              감사합니다!
            </h2>
            <p className="text-[var(--fs-item)] text-[var(--muted-foreground)] mb-3">
              {survey.interview
                ? '인터뷰 참여까지 감사합니다! 1년 무료 이용권을 드릴게요.'
                : '3개월 이용권이 제공될 예정이에요.'}
            </p>
            <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
              로그인 기능이 준비되면 이메일로 안내드릴게요.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={handleClose} className="w-full">
            확인
          </Button>
        </div>
      )}

      {/* ─── Step 6b: 이탈 ─── */}
      {step === 'thanks-no' && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-[var(--muted)] flex items-center justify-center">
            <span className="text-3xl">🙏</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              괜찮아요!
            </h2>
            <p className="text-[var(--fs-item)] text-[var(--muted-foreground)]">
              의견 감사합니다. 데이터 내보내기로 언제든 보관할 수 있어요.
            </p>
          </div>
          <Button variant="ghost" size="lg" onClick={handleClose} className="w-full">
            닫기
          </Button>
        </div>
      )}
    </Dialog>
  );
}
