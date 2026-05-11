'use client';

import type { RetrospectiveEntry, RetroScope, EnergyLevel } from '@/lib/types';
import RetroInput from './RetroInput';
import { useLocale } from '@/i18n/context';

interface DailyRetroProps {
  date: string; // YYYY-MM-DD
  retrospectives: RetrospectiveEntry[];
  onSave: (scope: RetroScope, scopeKey: string, content: string, energyLevel?: EnergyLevel) => void;
}

export default function DailyRetro({ date, retrospectives, onSave }: DailyRetroProps) {
  const { t } = useLocale();

  const existing = (retrospectives ?? []).find(
    (r) => r.scope === 'day' && r.scopeKey === date
  );

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <RetroInput
        scope="day"
        scopeKey={date}
        initialContent={existing?.content ?? ''}
        initialEnergyLevel={existing?.energyLevel}
        onSave={onSave}
        label={t.dailyRetroTitle}
        placeholder={t.dailyRetroPlaceholder}
        compact
      />
    </div>
  );
}
