'use client';

import { TimePeriod, Priority, ScheduledItem, SlotCoord, Project, Routine } from '@/lib/types';
import TimetableRow from './TimetableRow';

type RowStatus = 'active' | 'past' | 'future';

interface TimetableGridProps {
  currentPeriod: TimePeriod;
  slots: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
  routineSlots?: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onSlotClick: (period: TimePeriod, priority: Priority) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUpdateTitle?: (item: ScheduledItem, title: string) => void;
  onCreateInSlot?: (title: string, coord: SlotCoord, projectId?: string | null) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  onCreateRoutine?: (title: string, coord: SlotCoord) => void;
  onEditRoutine?: (item: ScheduledItem) => void;
  projectFirstMode?: boolean;
  projects?: Project[];
  isReadOnly?: boolean;
  onItemSelect?: (item: ScheduledItem) => void;
}

const PERIODS: { period: TimePeriod; label: string }[] = [
  { period: 'morning',   label: '오전' },
  { period: 'afternoon', label: '오후' },
  { period: 'evening',   label: '저녁' },
];

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];

function getStatus(period: TimePeriod, current: TimePeriod): RowStatus {
  const pIdx = PERIOD_ORDER.indexOf(period);
  const cIdx = PERIOD_ORDER.indexOf(current);
  if (pIdx === cIdx) return 'active';
  if (pIdx < cIdx)  return 'past';
  return 'future';
}

export default function TimetableGrid({
  currentPeriod,
  slots,
  routineSlots,
  onComplete,
  onDefer,
  onRepeat,
  onSlotClick,
  onDelete,
  onUpdateTitle,
  onCreateInSlot,
  onUncomplete,
  onCreateRoutine,
  onEditRoutine,
  projectFirstMode,
  projects,
  isReadOnly,
  onItemSelect,
}: TimetableGridProps) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]">
      {/* Priority header */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4 pb-2">
        {([1, 2, 3] as Priority[]).map((p) => {
          const color =
            p === 1 ? 'text-[var(--accent)]'
            : p === 2 ? 'text-[var(--foreground)]'
            : 'text-[var(--muted-foreground)]';
          return (
            <div key={p} className="text-center">
              <span className={`font-heading text-[32px] font-bold leading-none tracking-tight ${color}`}>
                {p}
              </span>
              <span className={`font-heading text-[13px] font-semibold ${color}`}>
                {p === 1 ? 'st' : p === 2 ? 'nd' : 'rd'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Period rows — 내부 간격만, 각 row의 외곽 border 제거 */}
      <div className="flex flex-col gap-0 px-2 pb-2">
        {PERIODS.map(({ period, label }) => (
          <TimetableRow
            key={period}
            period={period}
            label={label}
            status={getStatus(period, currentPeriod)}
            slots={slots[period]}
            routineSlots={routineSlots?.[period]}
            onComplete={onComplete}
            onDefer={onDefer}
            onRepeat={onRepeat}
            onSlotClick={onSlotClick}
            onDelete={onDelete}
            onUpdateTitle={onUpdateTitle}
            onCreateInSlot={onCreateInSlot}
            onUncomplete={onUncomplete}
            onCreateRoutine={onCreateRoutine}
            onEditRoutine={onEditRoutine}
            projectFirstMode={projectFirstMode}
            projects={projects}
            isReadOnly={isReadOnly}
            onItemSelect={onItemSelect}
          />
        ))}
      </div>
    </div>
  );
}
