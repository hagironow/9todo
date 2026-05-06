'use client';

import { useState } from 'react';
import { RecurrenceType, TimePeriod, Priority, SlotCoord } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface RoutineSetupData {
  recurrence: RecurrenceType;
  defaultSlot: SlotCoord;
  startDate: string;
}

interface RoutineSetupModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  onSave: (data: RoutineSetupData) => void;
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

export default function RoutineSetupModal({
  open,
  onClose,
  initialTitle = '',
  onSave,
}: RoutineSetupModalProps) {
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [period, setPeriod] = useState<TimePeriod>('morning');
  const [priority, setPriority] = useState<Priority>(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleSave = () => {
    onSave({
      recurrence,
      defaultSlot: { period, priority },
      startDate,
    });
    onClose();
  };

  const selectClass = (active: boolean) =>
    [
      'px-3 py-1.5 rounded-[var(--radius)] border text-[var(--fs-tag)] font-medium transition-all duration-100 cursor-pointer',
      active
        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
        : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]',
    ].join(' ');

  return (
    <Dialog open={open} onClose={onClose} title="루틴 설정" width="sm">
      {initialTitle && (
        <p className="text-[var(--fs-item)] font-semibold text-[var(--foreground)] -mt-1">
          {initialTitle}
        </p>
      )}

      {/* 반복 주기 */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[var(--fs-tag)] font-semibold text-[var(--foreground)]">
          반복 주기
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {RECURRENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRecurrence(opt.value)}
              className={selectClass(recurrence === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 기본 슬롯 */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[var(--fs-tag)] font-semibold text-[var(--foreground)]">
          기본 슬롯
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={selectClass(period === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriority(opt.value)}
              className={selectClass(priority === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 시작일 */}
      <Input
        type="date"
        label="시작일"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button variant="primary" onClick={handleSave}>저장</Button>
      </div>
    </Dialog>
  );
}
