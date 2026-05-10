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
  onUpdateProject?: (item: ScheduledItem, projectId: string | null) => void;
  onCreateInSlot?: (title: string, coord: SlotCoord, projectId?: string | null) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  onCreateRoutine?: (title: string, coord: SlotCoord) => void;
  onEditRoutine?: (item: ScheduledItem) => void;
  projectFirstMode?: boolean;
  projects?: Project[];
  isReadOnly?: boolean;
  onItemSelect?: (item: ScheduledItem) => void;
  onEditRecurrence?: (item: ScheduledItem) => void;
}

const PRIORITIES: Priority[] = [1, 2, 3];

function getLineColor(status: RowStatus, firstSlot: ScheduledItem | null, hasAnyItem: boolean): string {
  // 행에 태스크가 하나도 없으면 항상 그레이
  if (!hasAnyItem) return 'var(--border-subtle)';
  // 1st 완료 → 그린, 그 외(현재/과거 미완료) → 코랄, 미래 → 그레이
  if (firstSlot?.completedAt) return 'var(--g-success)';
  if (status === 'active') return 'var(--accent)';
  if (status === 'past') return 'var(--accent)';
  return 'var(--border-subtle)';
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
  onUpdateProject,
  onCreateInSlot,
  onUncomplete,
  onCreateRoutine,
  onEditRoutine,
  projectFirstMode,
  projects,
  isReadOnly,
  onItemSelect,
  onEditRecurrence,
}: TimetableRowProps) {

  const isActive = status === 'active';
  const hasAnyItem = PRIORITIES.some((p) => slots[p] != null);
  const lineColor = getLineColor(status, slots[1], hasAnyItem);

  return (
    <div
      className="relative rounded-[var(--radius)] bg-[var(--card)]"
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
                onUpdateProject={onUpdateProject}
                onCreateInSlot={onCreateInSlot}
                onUncomplete={onUncomplete}
                projectFirstMode={projectFirstMode}
                projects={projects}
                isReadOnly={isReadOnly}
                onItemSelect={onItemSelect}
                onEditRecurrence={onEditRecurrence}
                onCreateRoutine={onCreateRoutine}
                isHighlighted={isActive && priority === 1}
              />
            ))}
          </div>

          {/* Routine row 제거 — 반복 투두는 일반 슬롯에 통합 */}
        </div>
      </div>
    </div>
  );
}
