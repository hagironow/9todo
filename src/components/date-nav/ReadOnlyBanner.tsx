'use client';

interface ReadOnlyBannerProps {
  date: string; // "YYYY-MM-DD"
  onGoToday: () => void;
}

function formatDateKo(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

export default function ReadOnlyBanner({ date, onGoToday }: ReadOnlyBannerProps) {
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
        {formatDateKo(date)}의 기록입니다.{' '}
        <span className="font-medium">(읽기 전용)</span>
      </span>
      <button
        onClick={onGoToday}
        className={[
          'shrink-0 text-sm font-semibold',
          'text-[var(--accent)] hover:underline',
          'transition-colors duration-150',
        ].join(' ')}
      >
        오늘로 이동
      </button>
    </div>
  );
}
