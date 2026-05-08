'use client';

import { TimePeriod, Priority, ScheduledItem, SlotCoord } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';

interface SlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  slots: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
  onSelect: (coord: SlotCoord) => void;
  title?: string;
  description?: string;
}

const PERIODS: { period: TimePeriod; label: string }[] = [
  { period: 'morning',   label: '오전' },
  { period: 'afternoon', label: '오후' },
  { period: 'evening',   label: '저녁' },
];

const PRIORITIES: Priority[] = [1, 2, 3];

export default function SlotPickerModal({
  open,
  onClose,
  slots,
  onSelect,
  title,
  description,
}: SlotPickerModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title ?? '슬롯 배치'} width="md">
      <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
        {description ?? '배치할 슬롯을 선택하세요'}
      </p>

      {/* 우선순위 헤더 */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center">
        <div />
        {PRIORITIES.map((p) => (
          <div
            key={p}
            className="text-center text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider"
          >
            {p === 1 ? '1순위' : p === 2 ? '2순위' : '3순위'}
          </div>
        ))}
      </div>

      {/* 슬롯 격자 */}
      {PERIODS.map(({ period, label }) => (
        <div key={period} className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center">
          <span className="text-[var(--fs-tag)] font-medium text-[var(--muted-foreground)] text-right pr-2">
            {label}
          </span>
          {PRIORITIES.map((priority) => {
            const occupied = !!slots[period][priority];
            return (
              <button
                key={priority}
                disabled={occupied}
                onClick={() => { onSelect({ period, priority }); onClose(); }}
                className={[
                  'h-14 rounded-[var(--radius)] border transition-all duration-150',
                  'text-[var(--fs-tag)] font-medium',
                  occupied
                    ? 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50'
                    : 'border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] cursor-pointer',
                ].join(' ')}
                aria-label={`${label} ${priority}순위 ${occupied ? '(사용 중)' : '(비어 있음)'}`}
              >
                {occupied ? '사용 중' : '+'}
              </button>
            );
          })}
        </div>
      ))}
    </Dialog>
  );
}
