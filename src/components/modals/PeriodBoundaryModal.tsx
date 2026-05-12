'use client';

import { useState } from 'react';
import type { TimePeriod } from '@/lib/types';
import { loadBoundaries, saveBoundaries, type PeriodBoundaries } from '@/lib/periods';
import Dialog from '@/components/ui/Dialog';
import { useLocale } from '@/i18n/context';

interface PeriodBoundaryModalProps {
  open: boolean;
  onClose: () => void;
  editingPeriod: TimePeriod;
  onSave: (boundaries: PeriodBoundaries) => void;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

export default function PeriodBoundaryModal({
  open,
  onClose,
  editingPeriod,
  onSave,
}: PeriodBoundaryModalProps) {
  const { t } = useLocale();
  const [boundaries, setBoundaries] = useState<PeriodBoundaries>(loadBoundaries);

  const periodConfig: Record<TimePeriod, { label: string; startKey: keyof PeriodBoundaries; endKey: keyof PeriodBoundaries }> = {
    morning:   { label: t.morning,   startKey: 'morningStart',   endKey: 'afternoonStart' },
    afternoon: { label: t.afternoon, startKey: 'afternoonStart', endKey: 'eveningStart' },
    evening:   { label: t.evening,   startKey: 'eveningStart',   endKey: 'morningStart' },
  };

  const config = periodConfig[editingPeriod];
  const startHour = boundaries[config.startKey];
  const endHour = boundaries[config.endKey];

  const handleStartChange = (hour: number) => {
    setBoundaries((prev) => ({ ...prev, [config.startKey]: hour }));
  };

  const handleEndChange = (hour: number) => {
    setBoundaries((prev) => ({ ...prev, [config.endKey]: hour }));
  };

  const handleSave = () => {
    saveBoundaries(boundaries);
    onSave(boundaries);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={t.editPeriodBoundary} width="sm">
      <div className="flex flex-col gap-4">
        {/* 현재 편집 중인 시간대 표시 */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm font-semibold text-[var(--foreground)]">{config.label}</span>
          <span className="text-xs text-[var(--muted-foreground)]">{t.periodRange}</span>
        </div>

        {/* 시작/종료 시간 선택 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 시작 시간 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">{t.start}</label>
            <div className="grid grid-cols-4 gap-1">
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => handleStartChange(h)}
                  className={[
                    'px-1.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
                    h === startHour
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
                  ].join(' ')}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* 종료 시간 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">{t.end}</label>
            <div className="grid grid-cols-4 gap-1">
              {HOUR_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => handleEndChange(h)}
                  className={[
                    'px-1.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
                    h === endHour
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]',
                  ].join(' ')}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--radius)] bg-[var(--surface-inset)]">
          <span className="text-sm font-medium text-[var(--foreground)]">{config.label}</span>
          <span className="text-sm text-[var(--muted-foreground)]">
            {formatHour(startHour)} ~ {formatHour(endHour)}
          </span>
        </div>

        {/* 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--accent)] text-white transition-opacity hover:opacity-85"
          >
            {t.save}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
