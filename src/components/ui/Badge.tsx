'use client';

import { SkipForward } from 'lucide-react';
import RepeatCountIcon from './RepeatCountIcon';

interface BadgeProps {
  count: number;
  continueCount?: number;
  variant?: 'default' | 'warning' | 'danger';
  origin?: 'deferred' | 'repeated';
  className?: string;
}

export default function Badge({ count, continueCount = 0, variant = 'default', origin, className = '' }: BadgeProps) {
  const showDefer = count > 0 || origin === 'deferred';
  const showContinue = continueCount > 0 || origin === 'repeated';

  if (!showDefer && !showContinue) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 미룬 횟수: 스킵 아이콘 */}
      {showDefer && (
        <span
          className="inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          title={`${count}번 미룸`}
        >
          <SkipForward size={8} />
          {count > 0 && <span>{count > 99 ? '99+' : count}</span>}
        </span>
      )}

      {/* 또하기 횟수: 통일 아이콘 */}
      {showContinue && (
        <span
          className="inline-flex items-center h-[18px] px-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          title={`${continueCount}번 또하기`}
        >
          <RepeatCountIcon count={Math.min(continueCount, 9)} size={14} />
        </span>
      )}
    </div>
  );
}
