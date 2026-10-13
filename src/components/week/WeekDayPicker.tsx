'use client';

import { useLocale } from '@/i18n/context';

interface WeekDayPickerProps {
  /** 0(월) ~ 6(일), undefined면 '아무 때나' */
  value?: number;
  onChange: (weekDay: number | null) => void;
  /** 오늘 요일 인덱스 — 지나간 요일을 흐리게 표시 */
  todayIndex: number;
}

/**
 * 요일 메모. 마감이 아니라 "이때 하려 했다"는 표시라서
 * 지나간 요일도 그대로 고를 수 있고, 빨간 경고를 쓰지 않는다.
 */
export default function WeekDayPicker({ value, onChange, todayIndex }: WeekDayPickerProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {t.weekdayShortMon.map((label, i) => {
        const active = value === i;
        const passed = i < todayIndex;
        return (
          <button
            key={label}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(active ? null : i); }}
            className={[
              'w-7 h-7 rounded-full text-[12px] transition-colors border',
              active
                ? 'border-[var(--foreground)] text-[var(--foreground)] font-semibold'
                : 'border-[var(--border)] hover:text-[var(--foreground)]',
              !active && (passed ? 'text-[var(--muted-foreground)]/50' : 'text-[var(--muted-foreground)]'),
              !active && i === todayIndex ? 'bg-[var(--muted)]' : '',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(null); }}
        className={[
          'px-2.5 h-7 rounded-full text-[12px] transition-colors border',
          value === undefined
            ? 'border-[var(--foreground)] text-[var(--foreground)] font-medium'
            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
        ].join(' ')}
      >
        {t.weekAnyDay}
      </button>
    </div>
  );
}
