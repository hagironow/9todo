'use client';

import { useLocale } from '@/i18n/context';

interface ReadOnlyBannerProps {
  date: string; // "YYYY-MM-DD"
  onGoToday: () => void;
}

export default function ReadOnlyBanner({ date, onGoToday }: ReadOnlyBannerProps) {
  const { t } = useLocale();

  const [year, month, day] = date.split('-').map(Number);
  const formattedDate = t.dateShort(year, month, day);

  return (
    <div
      className={[
        'flex items-center justify-between gap-3',
        'px-4 py-2',
        'bg-[var(--muted)] rounded-[var(--radius)]',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm text-[var(--muted-foreground)]">
        {t.recordFrom(formattedDate)}{' '}
        <span className="font-medium">{t.readOnlyLabel}</span>
      </span>
      <button
        onClick={onGoToday}
        className={[
          'shrink-0 text-sm font-semibold',
          'text-[var(--accent)] hover:underline',
          'transition-colors duration-150',
        ].join(' ')}
      >
        {t.goTodayButton}
      </button>
    </div>
  );
}
