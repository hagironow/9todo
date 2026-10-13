'use client';

import type { WeekPriority } from '@/lib/types';
import { WEEK_PRIORITY_COLOR } from '@/lib/week';
import { useLocale } from '@/i18n/context';

const ORDER: WeekPriority[] = ['urgent', 'important', 'normal'];

interface WeekPriorityPickerProps {
  value?: WeekPriority;
  onChange: (priority: WeekPriority) => void;
  /** 이번 주에서 빼기 — 주면 '빼기' 버튼이 붙는다 */
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

/** 긴급 / 중요 / 보통 3단 선택. 백로그·스트립·보드에서 공통으로 쓴다. */
export default function WeekPriorityPicker({
  value,
  onChange,
  onRemove,
  size = 'md',
}: WeekPriorityPickerProps) {
  const { t } = useLocale();
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]';

  return (
    <div className="flex items-center gap-1">
      {ORDER.map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(p); }}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border transition-colors',
              pad,
              active
                ? 'border-[var(--foreground)] text-[var(--foreground)] font-medium'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: WEEK_PRIORITY_COLOR[p] }}
            />
            {t.weekPriorities[p]}
          </button>
        );
      })}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={[
            'rounded-full border border-transparent text-[var(--muted-foreground)]',
            'hover:text-[var(--g-error)] transition-colors',
            pad,
          ].join(' ')}
        >
          {t.weekRemoveFromPool}
        </button>
      )}
    </div>
  );
}
