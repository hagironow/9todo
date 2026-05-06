'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateNavProps {
  date: string; // "YYYY-MM-DD"
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenCalendar?: () => void;
  xp?: number;
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);
  // Use UTC to avoid timezone shift when constructing a date from year/month/day
  const d = new Date(Date.UTC(year, month - 1, day));
  const weekday = KO_WEEKDAYS[d.getUTCDay()];
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`;
}

function XpBadge({ xp }: { xp: number }) {
  const isPositive = xp > 0;
  const isZero = xp === 0;

  const colorClass = isPositive
    ? 'text-[var(--g-success)] bg-[var(--g-success)]/10'
    : isZero
    ? 'text-[var(--muted-foreground)] bg-[var(--muted)]'
    : 'text-[var(--destructive)] bg-[var(--destructive)]/10';

  const label = isPositive ? `+${xp} XP` : `${xp} XP`;

  return (
    <span
      className={[
        'inline-flex items-center',
        'px-2 py-0.5 rounded-full',
        'text-[12px] font-bold',
        'leading-none',
        colorClass,
      ].join(' ')}
    >
      {label}
    </span>
  );
}

export default function DateNav({
  date,
  isToday,
  onPrev,
  onNext,
  onToday,
  onOpenCalendar,
  xp,
}: DateNavProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {/* 이전 날짜 버튼 */}
      <button
        onClick={onPrev}
        aria-label="이전 날짜"
        className={[
          'flex items-center justify-center w-7 h-7',
          'rounded-[var(--radius-sm)]',
          'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          'hover:bg-[var(--muted)] transition-colors duration-150',
        ].join(' ')}
      >
        <ChevronLeft size={14} strokeWidth={1.8} />
      </button>

      {/* 날짜 + XP 배지 + 오늘 버튼 */}
      <div className="flex items-center gap-2">
        <span
          onClick={onOpenCalendar}
          className={[
            'text-sm font-semibold text-[var(--foreground)]',
            onOpenCalendar ? 'cursor-pointer hover:underline' : '',
          ].join(' ')}
        >
          {formatDate(date)}
        </span>
        {xp !== undefined && <XpBadge xp={xp} />}
      </div>

      {/* 다음 날짜 버튼 */}
      <button
        onClick={onNext}
        aria-label="다음 날짜"
        className={[
          'flex items-center justify-center w-7 h-7',
          'rounded-[var(--radius-sm)]',
          'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          'hover:bg-[var(--muted)] transition-colors duration-150',
        ].join(' ')}
      >
        <ChevronRight size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}
