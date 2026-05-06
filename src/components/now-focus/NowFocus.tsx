'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Check, SkipForward, Repeat } from 'lucide-react';
import { ScheduledItem, Project } from '@/lib/types';

interface NowFocusProps {
  items: (ScheduledItem | null)[];
  projects: Project[];
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}

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
  const stop = useCallback(() => { setPlaying(false); setElapsed(0); }, []);

  return { playing, elapsed, play, stop };
}

// ── 1순위: 프로젝트 컬러 배경 ──
function PrimaryCard({
  item,
  project,
  onComplete,
  onDefer,
  onRepeat,
  isReadOnly,
}: {
  item: ScheduledItem;
  project: Project | null;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}) {
  const { playing, elapsed, play, stop } = useTimer(item.id);
  const title = 'title' in item ? item.title : '';
  const bg = project?.color ?? 'var(--accent)';

  return (
    <div
      className="rounded-[var(--radius)] px-6 py-5 flex items-center gap-4"
      style={{ backgroundColor: bg }}
    >
      {/* 플레이/정지 */}
      <button
        onClick={playing ? stop : play}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex-shrink-0"
        title={playing ? '정지' : '시작'}
      >
        {playing
          ? <Square size={16} fill="white" />
          : <Play size={20} fill="white" />
        }
      </button>

      {/* 제목 */}
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold text-white leading-tight truncate">
          {title}
        </p>
        {project && (
          <span className="text-[11px] text-white/60 mt-1 block">{project.name}</span>
        )}
      </div>

      {/* 타이머 — 항상 표시 */}
      <span className="font-heading text-lg font-bold text-white/90 tabular-nums flex-shrink-0">
        {formatTime(elapsed)}
      </span>

      {/* 3종 아이콘 — 항상 표시 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => { stop(); onComplete(item); }}
          disabled={isReadOnly}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="완료"
        >
          <Check size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => { stop(); onDefer(item); }}
          disabled={isReadOnly}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="미루기"
        >
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => { stop(); onRepeat(item); }}
          disabled={isReadOnly}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="반복"
        >
          <Repeat size={16} />
        </button>
      </div>
    </div>
  );
}

// ── 2~3순위: 화이트 배경 + 다크 텍스트, 좌우 패딩 동일 ──
function SecondaryCard({
  item,
  project,
  priority,
  onComplete,
  onDefer,
  onRepeat,
  isReadOnly,
}: {
  item: ScheduledItem;
  project: Project | null;
  priority: number;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}) {
  const { playing, elapsed, play, stop } = useTimer(item.id);
  const title = 'title' in item ? item.title : '';

  return (
    <div className="rounded-[var(--radius-sm)] px-6 py-3 flex items-center gap-4 bg-white dark:bg-[var(--card)] border border-[var(--border-subtle)]">
      {/* 플레이/정지 */}
      <button
        onClick={playing ? stop : play}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors flex-shrink-0"
        title={playing ? '정지' : '시작'}
      >
        {playing
          ? <Square size={12} fill="currentColor" />
          : <Play size={14} fill="currentColor" />
        }
      </button>

      {/* 제목 */}
      <p className="flex-1 min-w-0 text-sm font-semibold text-[var(--foreground)] leading-tight truncate">
        {title}
      </p>

      {/* 타이머 — 항상 표시 */}
      <span className="font-heading text-sm font-bold text-[var(--muted-foreground)] tabular-nums flex-shrink-0">
        {formatTime(elapsed)}
      </span>

      {/* 3종 아이콘 — 항상 표시 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => { stop(); onComplete(item); }}
          disabled={isReadOnly}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="완료"
        >
          <Check size={12} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => { stop(); onDefer(item); }}
          disabled={isReadOnly}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="미루기"
        >
          <SkipForward size={12} />
        </button>
        <button
          onClick={() => { stop(); onRepeat(item); }}
          disabled={isReadOnly}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="반복"
        >
          <Repeat size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Empty — 기본 UI와 동일한 레이아웃 ──
function EmptyCard() {
  return (
    <div className="rounded-[var(--radius)] px-6 py-5 flex items-center gap-4 bg-[var(--accent)]">
      {/* 비활성 플레이 버튼 */}
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white flex-shrink-0">
        <Play size={20} fill="white" />
      </div>

      {/* 제목 */}
      <p className="flex-1 text-xl font-bold text-white/60">
        지금 끝내야 할 일
      </p>

      {/* 타이머 자리 */}
      <span className="font-heading text-lg font-bold text-white/30 tabular-nums flex-shrink-0">
        00:00
      </span>

      {/* 3종 아이콘 비활성 */}
      <div className="flex items-center gap-1.5">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/30">
          <Check size={16} strokeWidth={2.5} />
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/30">
          <SkipForward size={16} />
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/30">
          <Repeat size={16} />
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export default function NowFocus({
  items,
  projects,
  onComplete,
  onDefer,
  onRepeat,
  isReadOnly,
}: NowFocusProps) {
  const getProject = (item: ScheduledItem): Project | null => {
    const pid = 'projectId' in item ? item.projectId : null;
    return pid ? projects.find((p) => p.id === pid) ?? null : null;
  };

  const primary = items[0];
  const secondary = items[1];
  const tertiary = items[2];

  if (!primary && !secondary && !tertiary) {
    return <EmptyCard />;
  }

  return (
    <div className="flex flex-col gap-2">
      {primary ? (
        <PrimaryCard
          item={primary}
          project={getProject(primary)}
          onComplete={onComplete}
          onDefer={onDefer}
          onRepeat={onRepeat}
          isReadOnly={isReadOnly}
        />
      ) : (
        <EmptyCard />
      )}

      {secondary && (
        <SecondaryCard
          item={secondary}
          project={getProject(secondary)}
          priority={2}
          onComplete={onComplete}
          onDefer={onDefer}
          onRepeat={onRepeat}
          isReadOnly={isReadOnly}
        />
      )}

      {tertiary && (
        <SecondaryCard
          item={tertiary}
          project={getProject(tertiary)}
          priority={3}
          onComplete={onComplete}
          onDefer={onDefer}
          onRepeat={onRepeat}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
