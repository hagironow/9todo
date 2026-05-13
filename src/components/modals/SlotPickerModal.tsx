'use client';

import { TimePeriod, Priority, ScheduledItem, SlotCoord } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import { useLocale } from '@/i18n/context';

interface SlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  slots: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
  onSelect: (coord: SlotCoord) => void;
  onBacklog?: () => void;
  title?: string;
  description?: string;
}

const PRIORITIES: Priority[] = [1, 2, 3];

export default function SlotPickerModal({
  open,
  onClose,
  slots,
  onSelect,
  onBacklog,
  title,
  description,
}: SlotPickerModalProps) {
  const { t } = useLocale();

  const PERIODS: { period: TimePeriod; label: string }[] = [
    { period: 'morning',   label: t.morning },
    { period: 'afternoon', label: t.afternoon },
    { period: 'evening',   label: t.evening },
  ];

  return (
    <Dialog open={open} onClose={onClose} title={title ?? t.slotPickerTitle} width="md">
      <p className="text-[var(--fs-tag)] text-[var(--muted-foreground)]">
        {description ?? t.slotPickerDesc}
      </p>

      {/* 우선순위 헤더 */}
      <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-2 items-center">
        <div />
        {PRIORITIES.map((p) => (
          <div
            key={p}
            className="text-center text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider"
          >
            {p === 1 ? t.priority1 : p === 2 ? t.priority2 : t.priority3}
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
                aria-label={`${label} ${priority === 1 ? t.priority1 : priority === 2 ? t.priority2 : t.priority3} ${occupied ? `(${t.inUse})` : `(${t.empty})`}`}
              >
                {occupied ? t.inUse : '+'}
              </button>
            );
          })}
        </div>
      ))}

      {onBacklog && (
        <button
          onClick={() => { onBacklog(); onClose(); }}
          className="w-full mt-2 py-2.5 rounded-[var(--radius)] border border-dashed border-[var(--border)] text-[var(--fs-tag)] font-medium text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-all duration-150"
        >
          {t.backlog}
        </button>
      )}
    </Dialog>
  );
}
