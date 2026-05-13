'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, SkipForward, RefreshCw, Trash2, Plus, Repeat, Inbox } from 'lucide-react';
import { TimePeriod, Priority, ScheduledItem, SlotCoord, Project } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import ColorDot from '@/components/ui/ColorDot';
import { useLocale } from '@/i18n/context';

interface MobileTimetableListProps {
  currentPeriod: TimePeriod;
  slots: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
  routineSlots?: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
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
  isToday?: boolean;
  onItemSelect?: (item: ScheduledItem) => void;
  onSendToBacklog?: (item: ScheduledItem) => void;
}

type RowStatus = 'active' | 'past' | 'future';

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];
const PRIORITIES: Priority[] = [1, 2, 3];

function getStatus(period: TimePeriod, current: TimePeriod): RowStatus {
  const pIdx = PERIOD_ORDER.indexOf(period);
  const cIdx = PERIOD_ORDER.indexOf(current);
  if (pIdx === cIdx) return 'active';
  if (pIdx < cIdx) return 'past';
  return 'future';
}

function getXpForPriority(priority: Priority): number {
  return priority === 1 ? 3 : priority === 2 ? 2 : 1;
}

function getItemTitle(item: ScheduledItem): string {
  return item.title;
}

// ─── Collected item with metadata ─────────────────────────────────────────────

interface CardItem {
  item: ScheduledItem;
  period: TimePeriod;
  priority: Priority;
  isRoutine: boolean;
}

// ─── Item Card (tap to reveal actions) ────────────────────────────────────────

function MobileCard({
  card,
  currentPeriod,
  projects,
  isReadOnly,
  tappedId,
  onTap,
  onComplete,
  onDefer,
  isToday,
  onRepeat,
  onDelete,
  onUncomplete,
  onSendToBacklog,
}: {
  card: CardItem;
  currentPeriod: TimePeriod;
  projects?: Project[];
  isReadOnly?: boolean;
  tappedId: string | null;
  onTap: (id: string | null) => void;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  onSendToBacklog?: (item: ScheduledItem) => void;
  isToday?: boolean;
}) {
  const { t } = useLocale();
  const { item, period, priority, isRoutine } = card;
  const isCompleted = !!item.completedAt;
  const title = getItemTitle(item);
  const xp = getXpForPriority(priority);
  const isTapped = tappedId === item.id;

  const getPeriodLabel = (p: TimePeriod) =>
    p === 'morning' ? t.morning : p === 'afternoon' ? t.afternoon : t.evening;
  const getPriorityLabel = (p: Priority) =>
    p === 1 ? t.priority1 : p === 2 ? t.priority2 : t.priority3;

  const deferCount = 'deferCount' in item ? item.deferCount : 0;
  const continueCount = 'continueCount' in item ? (item as { continueCount?: number }).continueCount ?? 0 : 0;
  const origin = item.origin;

  const itemProjectId = 'projectId' in item ? (item as { projectId?: string | null }).projectId : null;
  const proj = itemProjectId ? (projects ?? []).find((p) => p.id === itemProjectId) ?? null : null;

  // Left bar color
  const status = isToday !== false ? getStatus(period, currentPeriod) : 'future';
  const lineColor = isCompleted
    ? 'var(--g-success)'
    : status === 'active' || status === 'past'
    ? 'var(--accent)'
    : 'var(--border-subtle)';

  const handleTap = () => {
    if (isReadOnly || isCompleted) return;
    onTap(isTapped ? null : item.id);
  };

  return (
    <div
      className={[
        'relative rounded-[var(--radius)] overflow-hidden transition-all duration-150 flex',
        isCompleted ? 'bg-[var(--grid-bg)]' : 'bg-[var(--card)]',
        isToday !== false && period === currentPeriod && priority === 1 && !isCompleted ? 'animate-highlight' : '',
      ].join(' ')}
      style={isRoutine ? { border: '1px dashed var(--border-subtle)' } : undefined}
      onClick={handleTap}
    >
      {/* Left color bar — indented, no vertical padding */}
      <div className="flex-shrink-0 pl-3 flex items-stretch">
        <div
          className="w-[2px] transition-colors duration-300"
          style={{ backgroundColor: lineColor }}
        />
      </div>

      {/* Main content */}
      <div className={['flex-1 px-3.5 py-3.5 flex items-center gap-3', isCompleted ? 'opacity-60' : ''].join(' ')}>
        {/* Left: period + priority — vertically centered */}
        <div className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 w-14 whitespace-nowrap">
          <span className="text-[10px] text-[var(--muted-foreground)] leading-none text-center">
            {getPeriodLabel(period)}
          </span>
          <span
            className={[
              'text-[12px] font-bold leading-none text-center',
              priority === 1 ? 'text-[var(--accent)]'
                : priority === 2 ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)]',
            ].join(' ')}
          >
            {getPriorityLabel(priority)}
          </span>
        </div>

        {/* Center: content */}
        <div className="flex-1 min-w-0">
          {/* Project tag */}
          <div className="flex items-center gap-1.5 mb-1">
            {isRoutine ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                <Repeat size={10} strokeWidth={1.8} />
                {t.routine}
              </span>
            ) : proj ? (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: 'var(--surface-hover)', color: proj.color }}
              >
                <ColorDot color={proj.color} size="sm" />
                <span className="truncate max-w-[100px]">{proj.name}</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-[var(--muted-foreground)]"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <span className="w-[6px] h-[6px] rounded-full bg-[var(--muted-foreground)] inline-block" />
                {t.uncategorized}
              </span>
            )}
          </div>
          {/* Title */}
          <p
            className={[
              'text-[15px] font-medium leading-snug',
              isCompleted
                ? 'line-through text-[var(--muted-foreground)]'
                : 'text-[var(--card-foreground)]',
            ].join(' ')}
          >
            {title}
          </p>
        </div>

        {/* Right: badges + xp — vertically centered */}
        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
          {(deferCount > 0 || continueCount > 0 || origin) && (
            <Badge count={deferCount} continueCount={continueCount} origin={origin} />
          )}
          {origin === 'continued' ? null : isCompleted ? (
            <span className="text-[11px] font-bold" style={{ color: 'var(--g-success)' }}>+{xp}xp</span>
          ) : !isRoutine ? (
            <span className="text-[11px] font-medium opacity-40" style={{ color: 'var(--primary)' }}>{xp}xp</span>
          ) : null}
        </div>
      </div>

      {/* Tap action overlay */}
      {isTapped && !isCompleted && !isReadOnly && (
        <div className="absolute inset-0 rounded-[var(--radius)] bg-[var(--surface-inset)]/95 backdrop-blur-sm flex items-center justify-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(item); onTap(null); }}
            className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)]"
          >
            <Check size={18} strokeWidth={2.5} />
          </button>
          {!isRoutine && (
            <button
              onClick={(e) => { e.stopPropagation(); onDefer(item); onTap(null); }}
              className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)]"
            >
              <SkipForward size={16} />
            </button>
          )}
          {!isRoutine && (
            <button
              onClick={(e) => { e.stopPropagation(); onRepeat(item); onTap(null); }}
              className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)]"
            >
              <RefreshCw size={15} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); onTap(null); }}
              className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
            >
              <Trash2 size={15} />
            </button>
          )}
          {onSendToBacklog && !isRoutine && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendToBacklog(item); onTap(null); }}
              className="w-10 h-10 flex flex-col items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]"
            >
              <Inbox size={15} />
            </button>
          )}
        </div>
      )}

      {/* Completed: tap to uncomplete */}
      {isCompleted && !isReadOnly && onUncomplete && (
        <button
          onClick={(e) => { e.stopPropagation(); onUncomplete(item); }}
          className="absolute top-2 right-3 text-[11px] text-[var(--muted-foreground)]"
        >
          {t.undoComplete}
        </button>
      )}
    </div>
  );
}

// ─── Add Button Bottom Sheet ─────────────────────────────────────────────────

function AddSlotPicker({
  open,
  onClose,
  slots,
  onCreateInSlot,
}: {
  open: boolean;
  onClose: () => void;
  slots: Record<TimePeriod, Record<Priority, ScheduledItem | null>>;
  onCreateInSlot?: (title: string, coord: SlotCoord, projectId?: string | null) => void;
}) {
  const { t } = useLocale();
  const [selectedCoord, setSelectedCoord] = useState<SlotCoord | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const PERIODS: { period: TimePeriod; label: string }[] = [
    { period: 'morning',   label: t.morningShort },
    { period: 'afternoon', label: t.afternoonShort },
    { period: 'evening',   label: t.eveningShort },
  ];

  const getPeriodLabel = (p: TimePeriod) =>
    p === 'morning' ? t.morning : p === 'afternoon' ? t.afternoon : t.evening;
  const getPriorityLabel = (p: Priority) =>
    p === 1 ? t.priority1 : p === 2 ? t.priority2 : t.priority3;

  useEffect(() => {
    if (selectedCoord) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedCoord]);

  useEffect(() => {
    if (!open) {
      setSelectedCoord(null);
      setInputValue('');
    }
  }, [open]);

  if (!open) return null;

  const allFilled = PERIODS.every(({ period }) =>
    PRIORITIES.every((p) => !!slots[period][p])
  );

  const commitInput = () => {
    const trimmed = inputValue.trim();
    if (trimmed && selectedCoord && onCreateInSlot) {
      onCreateInSlot(trimmed, selectedCoord, null);
    }
    setInputValue('');
    setSelectedCoord(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-[9999] bg-[var(--card)] rounded-t-2xl p-4 pb-8 max-h-[60vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />

        {selectedCoord ? (
          /* Input mode */
          <div>
            <p className="text-[13px] text-[var(--muted-foreground)] mb-2">
              {t.addToSlotLabel(getPeriodLabel(selectedCoord.period), getPriorityLabel(selectedCoord.priority))}
            </p>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitInput();
                if (e.key === 'Escape') { setSelectedCoord(null); setInputValue(''); }
              }}
              placeholder={t.taskInputPlaceholder}
              className="w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--background)] text-[var(--foreground)] text-[15px] outline-none border border-[var(--border)] focus:border-[var(--foreground)]"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setSelectedCoord(null); setInputValue(''); }}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-[14px] text-[var(--muted-foreground)] bg-[var(--muted)]"
              >
                {t.back}
              </button>
              <button
                onClick={commitInput}
                className="flex-1 py-2.5 rounded-[var(--radius)] text-[14px] font-semibold bg-[var(--foreground)] text-[var(--background)]"
              >
                {t.add}
              </button>
            </div>
          </div>
        ) : (
          /* Slot picker */
          <div>
            <p className="text-[15px] font-semibold text-[var(--foreground)] mb-3">{t.whereToAdd}</p>
            {allFilled ? (
              <p className="text-[13px] text-[var(--muted-foreground)] text-center py-6">{t.noEmptySlots}</p>
            ) : (
              <>
                {/* Header: priority labels */}
                <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 mb-2">
                  <div />
                  {PRIORITIES.map((p) => (
                    <span
                      key={p}
                      className={[
                        'text-center text-[12px] font-bold',
                        p === 1 ? 'text-[var(--accent)]' : p === 2 ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
                      ].join(' ')}
                    >
                      {getPriorityLabel(p)}
                    </span>
                  ))}
                </div>
                {/* 3x3 grid: all 9 slots */}
                {PERIODS.map(({ period, label }) => (
                  <div key={period} className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2 mb-2">
                    <span className="text-[12px] text-[var(--muted-foreground)] font-medium flex items-center">
                      {label}
                    </span>
                    {PRIORITIES.map((priority) => {
                      const occupied = !!slots[period][priority];
                      const occupiedItem = slots[period][priority];
                      const title = occupied ? getItemTitle(occupiedItem!) : '';
                      return (
                        <button
                          key={priority}
                          onClick={() => !occupied && setSelectedCoord({ period, priority })}
                          disabled={occupied}
                          className={[
                            'py-3 px-2 rounded-[var(--radius)] text-[12px] text-center transition-colors',
                            occupied
                              ? 'bg-[var(--muted)] text-[var(--muted-foreground)] opacity-40 cursor-not-allowed'
                              : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-medium active:bg-[var(--muted)]',
                          ].join(' ')}
                        >
                          {occupied ? (
                            <span className="block whitespace-pre-wrap break-words">{title}</span>
                          ) : (
                            <Plus size={14} className="mx-auto" strokeWidth={1.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileTimetableList({
  currentPeriod,
  slots,
  routineSlots,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onCreateInSlot,
  onUncomplete,
  projects,
  isReadOnly,
  onSendToBacklog,
  isToday = true,
}: MobileTimetableListProps) {
  const { t } = useLocale();
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const PERIODS: { period: TimePeriod }[] = [
    { period: 'morning' },
    { period: 'afternoon' },
    { period: 'evening' },
  ];

  // Tap outside to deselect
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tappedId) return;
    const handler = (e: TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTappedId(null);
      }
    };
    document.addEventListener('touchstart', handler);
    return () => document.removeEventListener('touchstart', handler);
  }, [tappedId]);

  // Collect all filled items in order: morning 1,2,3 → afternoon 1,2,3 → evening 1,2,3
  const cards: CardItem[] = [];
  for (const { period } of PERIODS) {
    for (const priority of PRIORITIES) {
      const item = slots[period][priority];
      if (item) {
        cards.push({ item, period, priority, isRoutine: false });
      }
      const routineItem = routineSlots?.[period]?.[priority];
      if (routineItem) {
        cards.push({ item: routineItem, period, priority, isRoutine: true });
      }
    }
  }

  const hasEmpty = PERIODS.some(({ period }) =>
    PRIORITIES.some((p) => !slots[period][p])
  );

  return (
    <div ref={containerRef} className="md:hidden flex flex-col gap-2">
      {cards.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--muted-foreground)]">{t.addTodayTasks}</p>
        </div>
      ) : (
        cards.map((card) => (
          <MobileCard
            key={card.item.id}
            card={card}
            currentPeriod={currentPeriod}
            projects={projects}
            isReadOnly={isReadOnly}
            tappedId={tappedId}
            onTap={setTappedId}
            onComplete={onComplete}
            onDefer={onDefer}
            onRepeat={onRepeat}
            onDelete={onDelete}
            onUncomplete={onUncomplete}
            onSendToBacklog={onSendToBacklog}
            isToday={isToday}
          />
        ))
      )}

      {/* Add button */}
      {!isReadOnly && hasEmpty && (
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-[var(--radius)] border border-dashed border-[var(--border)] text-[14px] text-[var(--muted-foreground)] active:bg-[var(--muted)] transition-colors"
        >
          <Plus size={16} strokeWidth={1.5} />
          {t.addTask}
        </button>
      )}

      {/* Add slot picker bottom sheet */}
      <AddSlotPicker
        open={addOpen}
        onClose={() => setAddOpen(false)}
        slots={slots}
        onCreateInSlot={onCreateInSlot}
      />
    </div>
  );
}
