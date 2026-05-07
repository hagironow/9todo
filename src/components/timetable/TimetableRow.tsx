'use client';

import { TimePeriod, Priority, ScheduledItem, SlotCoord, Project, Routine } from '@/lib/types';
import SlotCell from './SlotCell';
import RoutineSlotCell from './RoutineSlotCell';

type RowStatus = 'active' | 'past' | 'future';

interface TimetableRowProps {
  period: TimePeriod;
  label: string;
  timeLabel?: string;
  status: RowStatus;
  slots: Record<Priority, ScheduledItem | null>;
  routineSlots?: Record<Priority, ScheduledItem | null>;
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

const PRIORITIES: Priority[] = [1, 2, 3];

function getLineColor(status: RowStatus, firstSlot: ScheduledItem | null): string {
  // 현재 = 노랑, 완료 = 그린, 미완료(아이템 있음) = 프라이머리, 없음 = 그레이
  if (status === 'active') return '#F59E0B'; // 노랑 — 진행 중 시간대
  if (!firstSlot) return 'var(--border-subtle)'; // 없음 — 그레이
  if (firstSlot.completedAt) return 'var(--g-success)'; // 완료 — 그린
  return 'var(--accent)'; // 미완료 — 프라이머리
}

export default function TimetableRow({
  period,
  label,
  timeLabel,
  status,
  slots,
  routineSlots,
  onComplete,
  onDefer,
  onRepeat,
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
}: TimetableRowProps) {

  const isActive = status === 'active';
  const lineColor = getLineColor(status, slots[1]);

  return (
    <div
      className={[
        'relative rounded-[var(--radius)]',
        'bg-[var(--card)]',
      ].join(' ')}
    >
      {/* Header — no border-b stroke, just label */}
      <div className="flex items-center">
        {/* Inner left bar */}
        <div
          className="w-[2px] self-stretch flex-shrink-0 ml-3 transition-colors duration-300"
          style={{ backgroundColor: lineColor }}
        />
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span
            className={[
              'text-[13px] font-semibold',
              isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
            ].join(' ')}
          >
            {label}
          </span>
          {timeLabel && (
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {timeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        <div
          className="w-[2px] flex-shrink-0 ml-3 transition-colors duration-300"
          style={{ backgroundColor: lineColor }}
        />

        <div className="flex-1 p-3 pt-0">
          {/* Task slots */}
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((priority) => (
              <SlotCell
                key={priority}
                coord={{ period, priority }}
                item={slots[priority]}
                onComplete={onComplete}
                onDefer={onDefer}
                onRepeat={onRepeat}
                onDelete={onDelete}
                onUpdateTitle={onUpdateTitle}
                onCreateInSlot={onCreateInSlot}
                onUncomplete={onUncomplete}
                projectFirstMode={projectFirstMode}
                projects={projects}
                isReadOnly={isReadOnly}
                onItemSelect={onItemSelect}
              />
            ))}
          </div>

          {/* Routine row — 항상 표시 */}
          <div className="mt-2">
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((priority) => (
                <RoutineSlotCell
                  key={priority}
                  coord={{ period, priority }}
                  item={routineSlots?.[priority] ?? null}
                  onComplete={onComplete}
                  onDefer={onDefer}
                  onUncomplete={onUncomplete}
                  onCreateRoutine={onCreateRoutine}
                  onEditRoutine={onEditRoutine}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
