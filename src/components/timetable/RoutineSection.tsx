'use client';

import { Repeat } from 'lucide-react';
import { ScheduledItem, TimePeriod } from '@/lib/types';

interface RoutineSectionProps {
  items: ScheduledItem[];
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];

function getPeriodForItem(item: ScheduledItem): TimePeriod | null {
  if ('slot' in item && item.slot) return item.slot.period;
  // routineDetails의 defaultSlot 사용
  if ('routineDetails' in item && item.routineDetails) {
    return item.routineDetails.defaultSlot.period;
  }
  return null;
}

function getTitleForItem(item: ScheduledItem): string {
  if ('title' in item) return item.title;
  if ('routineDetails' in item && item.routineDetails) return item.routineDetails.title;
  return '';
}

export default function RoutineSection({
  items,
  onComplete,
  onDefer,
}: RoutineSectionProps) {
  if (items.length === 0) return null;

  // 시간대별 그룹핑
  const grouped: Partial<Record<TimePeriod, ScheduledItem[]>> = {};
  for (const item of items) {
    const period = getPeriodForItem(item) ?? 'morning';
    if (!grouped[period]) grouped[period] = [];
    grouped[period]!.push(item);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[var(--foreground)]">루틴</span>
        <span className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1"><Repeat size={11} strokeWidth={1.8} /> 오늘의 반복 항목</span>
      </div>

      <div className="flex flex-col gap-2">
        {PERIOD_ORDER.filter((p) => grouped[p]).map((period) => (
          <div key={period} className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] px-1">
              {PERIOD_LABELS[period]}
            </p>
            <div className="flex flex-col gap-1.5">
              {grouped[period]!.map((item) => {
                const title = getTitleForItem(item);
                const isCompleted = item.completedAt !== null;
                return (
                  <div
                    key={item.id}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-[var(--radius)]',
                      'border border-dashed border-[var(--border)] bg-[var(--card)]',
                      'group transition-colors duration-100',
                      isCompleted ? 'opacity-50' : '',
                    ].join(' ')}
                  >
                    <Repeat size={11} strokeWidth={1.8} className="text-[var(--muted-foreground)] flex-shrink-0" />
                    <span
                      className={[
                        'flex-1 text-[var(--fs-item)] text-[var(--foreground)] truncate',
                        isCompleted ? 'line-through text-[var(--muted-foreground)]' : '',
                      ].join(' ')}
                    >
                      {title}
                    </span>

                    {/* 액션 버튼 (hover 시 표시) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {!isCompleted && (
                        <>
                          <button
                            onClick={() => onComplete(item)}
                            className="h-6 px-2 rounded-[var(--radius-sm)] bg-[var(--foreground)] text-[var(--background)] text-[10px] font-semibold hover:opacity-85 transition-opacity"
                          >
                            완료
                          </button>
                          <button
                            onClick={() => onDefer(item)}
                            className="h-6 px-2 rounded-[var(--radius-sm)] bg-[var(--muted)] text-[var(--foreground)] text-[10px] font-semibold hover:bg-[var(--border)] transition-colors"
                          >
                            미루기
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
