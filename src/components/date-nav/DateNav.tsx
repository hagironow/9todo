'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from '@/i18n/context';

interface DateNavProps {
  date: string; // "YYYY-MM-DD"
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenCalendar?: () => void;
  xp?: number;
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
  const { t } = useLocale();

  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const weekday = t.weekdaysSingle[d.getUTCDay()];
  const formattedDate = t.dateFormat(year, month, day, weekday);

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {/* 이전 날짜 버튼 */}
      <button
        onClick={onPrev}
        aria-label={t.prevDate}
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
          {formattedDate}
        </span>
        {xp !== undefined && <XpBadge xp={xp} />}
      </div>

      {/* 다음 날짜 버튼 */}
      <button
        onClick={onNext}
        aria-label={t.nextDate}
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
