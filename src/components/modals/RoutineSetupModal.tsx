'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RecurrenceType, TimePeriod, Priority, SlotCoord, Routine } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';

export interface RoutineSetupData {
  recurrence: RecurrenceType;
  defaultSlot: SlotCoord;
  startDate: string;
  scheduledTime?: string;
}

interface RoutineSetupModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  editingRoutine?: Routine | null;
  onSave: (data: RoutineSetupData) => void;
  onDelete?: () => void;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'daily',    label: '매일' },
  { value: 'weekly',   label: '매주' },
  { value: 'biweekly', label: '2주마다' },
  { value: 'monthly',  label: '매월' },
];

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'morning',   label: '오전' },
  { value: 'afternoon', label: '오후' },
  { value: 'evening',   label: '저녁' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 1, label: '1순위' },
  { value: 2, label: '2순위' },
  { value: 3, label: '3순위' },
];

/* ── 공통 스타일 ── */

const CHIP_BASE = [
  'px-4 py-2.5 rounded-[var(--radius)] text-[var(--fs-item)] font-medium',
  'border transition-all duration-150 cursor-pointer',
].join(' ');

const CHIP_DEFAULT = [
  CHIP_BASE,
  'bg-[var(--surface-raised)] border-transparent text-[var(--foreground)]',
  'hover:bg-[var(--background)] hover:border-[var(--accent)] hover:shadow-md',
].join(' ');

const CHIP_ACTIVE = [
  CHIP_BASE,
  'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]',
].join(' ');

const INPUT_CLASS = [
  'w-full px-4 py-3 rounded-[var(--radius)]',
  'bg-[var(--surface-raised)] border border-transparent',
  'text-[var(--foreground)] text-[var(--fs-item)]',
  'focus:outline-none focus:bg-[var(--background)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]',
  'transition-all',
].join(' ');

// 대시보드 오전/오후/저녁 레이블과 동일: text-[13px] font-semibold
const SECTION_LABEL = 'text-[13px] font-semibold text-[var(--muted-foreground)]';

export default function RoutineSetupModal({
  open,
  onClose,
  initialTitle = '',
  editingRoutine,
  onSave,
  onDelete,
}: RoutineSetupModalProps) {
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [period, setPeriod] = useState<TimePeriod>('morning');
  const [priority, setPriority] = useState<Priority>(1);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (!open) return;
    if (editingRoutine) {
      setRecurrence(editingRoutine.recurrence);
      setPeriod(editingRoutine.defaultSlot.period);
      setPriority(editingRoutine.defaultSlot.priority);
      setScheduledTime(editingRoutine.scheduledTime ?? '09:00');
      setStartDate(editingRoutine.startDate);
    } else {
      setRecurrence('daily');
      setPeriod('morning');
      setPriority(1);
      setScheduledTime('09:00');
      setStartDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, editingRoutine]);

  const isEditing = !!editingRoutine;
  const displayTitle = isEditing ? editingRoutine.title : initialTitle;

  const handleSave = () => {
    onSave({
      recurrence,
      defaultSlot: { period, priority },
      startDate,
      scheduledTime,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} width="sm">
      {/* 헤더 + X 버튼 */}
      <div className="flex items-start justify-between pt-1">
        <div className="flex-1">
          {displayTitle && (
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {displayTitle}
            </h2>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
          aria-label="닫기"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* 반복 주기 */}
      <div className="flex flex-col gap-2.5 mt-4">
        <span className={SECTION_LABEL}>반복 주기</span>
        <div className="flex flex-wrap gap-2">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRecurrence(opt.value)}
              className={recurrence === opt.value ? CHIP_ACTIVE : CHIP_DEFAULT}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 기본 슬롯 */}
      <div className="flex flex-col gap-2.5 mt-4">
        <span className={SECTION_LABEL}>기본 슬롯</span>

        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={period === opt.value ? CHIP_ACTIVE : CHIP_DEFAULT}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriority(opt.value)}
              className={priority === opt.value ? CHIP_ACTIVE : CHIP_DEFAULT}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 시작일 */}
      <div className="flex flex-col gap-2.5 mt-4">
        <span className={SECTION_LABEL}>시작일</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {/* 시간 */}
      <div className="flex flex-col gap-2.5 mt-4">
        <span className={SECTION_LABEL}>시간</span>
        <input
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col gap-2 mt-6 pb-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button variant="primary" size="lg" onClick={handleSave} className="flex-1">
            저장
          </Button>
        </div>
        {isEditing && onDelete && (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="w-full py-2.5 text-[var(--fs-item)] font-medium text-[#ef4444] hover:opacity-80 transition-opacity cursor-pointer"
          >
            루틴 삭제
          </button>
        )}
      </div>
    </Dialog>
  );
}
