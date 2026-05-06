'use client';

import { SkipForward, Repeat } from 'lucide-react';

interface BadgeProps {
  count: number;
  variant?: 'default' | 'warning' | 'danger';
  origin?: 'deferred' | 'repeated';
  className?: string;
}

export default function Badge({ count, variant = 'default', origin, className = '' }: BadgeProps) {
  if (count <= 0 && !origin) return null;

  // 미룬 일: 빨간색 + SkipForward 아이콘
  if (origin === 'deferred' || (count > 0 && origin !== 'repeated')) {
    return (
      <span
        className={[
          'inline-flex items-center gap-0.5',
          'h-[18px] px-1.5 rounded-full',
          'text-[10px] font-semibold',
          'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          className,
        ].join(' ')}
        title={`${count}번 미룸`}
      >
        <SkipForward size={10} />
        {count > 0 && <span>{count > 99 ? '99+' : count}</span>}
      </span>
    );
  }

  // 진행할 일 (반복): 파란색 + Repeat 아이콘
  if (origin === 'repeated') {
    return (
      <span
        className={[
          'inline-flex items-center gap-0.5',
          'h-[18px] px-1.5 rounded-full',
          'text-[10px] font-semibold',
          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
          className,
        ].join(' ')}
        title="진행중"
      >
        <Repeat size={10} />
        <span>진행중</span>
      </span>
    );
  }

  // Default fallback
  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'text-[11px] font-semibold rounded-full',
        'bg-[var(--muted)] text-[var(--muted-foreground)]',
        className,
      ].join(' ')}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
