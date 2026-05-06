'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Check, SkipForward, Minimize2, Square } from 'lucide-react';
import { ScheduledItem, Project } from '@/lib/types';

interface NowFocusProps {
  items: (ScheduledItem | null)[];
  projects: Project[];
  onComplete: (item: ScheduledItem, timerSeconds?: number) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}

const POMODORO_DURATION = 25 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function useTimer(itemId: string | undefined) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [itemId]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const reset = useCallback(() => { setPlaying(false); setElapsed(0); }, []);

  const cycle = Math.floor(elapsed / POMODORO_DURATION);
  const cycleElapsed = elapsed % POMODORO_DURATION;
  const cycleProgress = cycleElapsed / POMODORO_DURATION;

  return { playing, elapsed, cycle, cycleElapsed, cycleProgress, play, pause, reset };
}

// ── 확인 모달 ──
type ConfirmType = 'defer' | 'continue';

function ConfirmModal({
  type,
  onConfirm,
  onCancel,
}: {
  type: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDefer = type === 'defer';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-xl w-80 flex flex-col gap-3 animate-slide-in-right">
        <p className="text-base font-semibold text-[var(--foreground)]">
          {isDefer ? '이 태스크를 미루시겠어요?' : '아직 완료되지 않았나요?'}
        </p>
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {isDefer
            ? '백로그에 미룬 일과 미룬 횟수가 저장돼요.'
            : '백로그에 진행할 일과 진행 횟수가 저장돼요.'}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={[
              'flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-opacity hover:opacity-85',
              isDefer
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white',
            ].join(' ')}
          >
            {isDefer ? '미루기' : '진행하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 원형 타이머 ──
function CircularTimer({
  elapsed,
  cycleProgress,
  playing,
  onPause,
  onPlay,
}: {
  elapsed: number;
  cycleElapsed: number;
  cycleProgress: number;
  playing: boolean;
  onPause: () => void;
  onPlay: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const radius = 70;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - cycleProgress * circumference;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={playing ? onPause : onPlay}
      title={playing ? '일시정지' : undefined}
    >
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke="white" strokeOpacity={0.15} strokeWidth={stroke} />
        <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke="white" strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
      </svg>
      <div className="absolute flex flex-col items-center">
        {hovered && playing ? (
          <Pause size={28} className="text-white" />
        ) : (
          <span className="font-heading text-xl font-bold text-white tabular-nums">
            {formatTime(elapsed)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── 2~3순위: 바 형태 ──
function SecondaryBar({
  item,
  onComplete,
  onDefer,
  onRepeat,
  isReadOnly,
}: {
  item: ScheduledItem;
  onComplete: (item: ScheduledItem, timerSeconds?: number) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}) {
  const { playing, elapsed, play, pause, reset } = useTimer(item.id);
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);
  const title = 'title' in item ? item.title : '';

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[var(--card)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)]">
        <button
          onClick={playing ? pause : play}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors flex-shrink-0"
          title={playing ? '일시정지' : '시작'}
        >
          {playing ? <Pause size={11} /> : <Play size={12} fill="currentColor" />}
        </button>

        <p className="flex-1 min-w-0 text-sm font-semibold text-[var(--foreground)] leading-tight truncate">{title}</p>

        <span className="font-heading text-sm font-bold text-[var(--muted-foreground)] tabular-nums flex-shrink-0">
          {formatTime(elapsed)}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => { const t = elapsed; reset(); onComplete(item, t > 0 ? t : undefined); }}
            disabled={isReadOnly}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="완료"
          >
            <Check size={12} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setConfirm('defer')}
            disabled={isReadOnly}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="미루기"
          >
            <Square size={10} fill="currentColor" />
          </button>
          <button
            onClick={() => setConfirm('continue')}
            disabled={isReadOnly}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="진행하기"
          >
            <SkipForward size={12} />
          </button>
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          type={confirm}
          onConfirm={() => {
            if (confirm === 'defer') { reset(); onDefer(item); }
            else { reset(); onRepeat(item); }
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── Main: 우측 하단 플로팅 위젯 ──
export default function NowFocus({
  items,
  projects,
  onComplete,
  onDefer,
  onRepeat,
  isReadOnly,
}: NowFocusProps) {
  const [minimized, setMinimized] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);

  const primary = items[0];
  const secondary = items[1];
  const tertiary = items[2];

  const primaryTimer = useTimer(primary?.id);

  const getProject = (item: ScheduledItem): Project | null => {
    const pid = 'projectId' in item ? item.projectId : null;
    return pid ? projects.find((p) => p.id === pid) ?? null : null;
  };

  if (!primary && !secondary && !tertiary) {
    return null;
  }

  const primaryProject = primary ? getProject(primary) : null;
  const primaryTitle = primary && 'title' in primary ? primary.title : '';
  const primaryBg = primaryProject?.color ?? 'var(--accent)';

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 transition-transform"
        style={{ backgroundColor: primaryBg }}
        title="타이머 열기"
      >
        <Play size={20} fill="white" />
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end animate-slide-in-right">
        {/* 1순위 — 뽀모도로 타이머 카드 (맨 위) */}
        {primary ? (
          <div
            className="w-[340px] rounded-[var(--radius)] shadow-2xl overflow-hidden"
            style={{ backgroundColor: primaryBg }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-0">
              <p className="text-base font-bold text-white truncate flex-1 mr-2">{primaryTitle}</p>
              <button
                onClick={() => setMinimized(true)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 text-white/70 hover:bg-white/25 transition-colors"
                title="최소화"
              >
                <Minimize2 size={13} />
              </button>
            </div>

            {primaryProject && (
              <span className="text-[11px] text-white/50 px-4 block">{primaryProject.name}</span>
            )}

            {/* Timer area */}
            <div className="flex items-center justify-center py-5 gap-5">
              {/* 왼쪽: 미루기 (채워진 네모) */}
              <button
                onClick={() => setConfirm('defer')}
                disabled={isReadOnly}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-40"
                title="미루기"
              >
                <Square size={18} fill="white" />
              </button>

              <CircularTimer
                elapsed={primaryTimer.elapsed}
                cycleElapsed={primaryTimer.cycleElapsed}
                cycleProgress={primaryTimer.cycleProgress}
                playing={primaryTimer.playing}
                onPause={primaryTimer.pause}
                onPlay={primaryTimer.play}
              />

              {/* 오른쪽: 진행하기 (넥스트) */}
              <button
                onClick={() => setConfirm('continue')}
                disabled={isReadOnly}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-40"
                title="진행하기"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* 사이클 표시 */}
            {primaryTimer.cycle > 0 && (
              <div className="flex items-center justify-center gap-1 pb-2">
                {Array.from({ length: Math.min(primaryTimer.cycle, 8) }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white/60" />
                ))}
                {primaryTimer.cycle > 8 && (
                  <span className="text-[10px] text-white/60 ml-0.5">+{primaryTimer.cycle - 8}</span>
                )}
                <span className="text-[11px] text-white/50 ml-1.5">{primaryTimer.cycle}사이클</span>
              </div>
            )}

            {/* 하단: 완료 */}
            <div className="flex items-center justify-center px-4 pb-4">
              <button
                onClick={() => { const t = primaryTimer.elapsed; primaryTimer.reset(); onComplete(primary, t > 0 ? t : undefined); }}
                disabled={isReadOnly}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors disabled:opacity-40"
              >
                <Check size={15} strokeWidth={2.5} />
                완료
              </button>
            </div>
          </div>
        ) : null}

        {/* 2~3순위 바 */}
        {secondary && (
          <div className="w-[340px]">
            <SecondaryBar item={secondary} onComplete={onComplete} onDefer={onDefer} onRepeat={onRepeat} isReadOnly={isReadOnly} />
          </div>
        )}
        {tertiary && (
          <div className="w-[340px]">
            <SecondaryBar item={tertiary} onComplete={onComplete} onDefer={onDefer} onRepeat={onRepeat} isReadOnly={isReadOnly} />
          </div>
        )}
      </div>

      {/* 1순위 확인 모달 */}
      {confirm && primary && (
        <ConfirmModal
          type={confirm}
          onConfirm={() => {
            if (confirm === 'defer') { primaryTimer.reset(); onDefer(primary); }
            else { primaryTimer.reset(); onRepeat(primary); }
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
