'use client';

import type { RetrospectiveEntry, RetroScope } from '@/lib/types';
import RetroInput from './RetroInput';

interface DailyRetroProps {
  date: string; // YYYY-MM-DD
  retrospectives: RetrospectiveEntry[];
  onSave: (scope: RetroScope, scopeKey: string, content: string) => void;
}

export default function DailyRetro({ date, retrospectives, onSave }: DailyRetroProps) {
  const existing = (retrospectives ?? []).find(
    (r) => r.scope === 'day' && r.scopeKey === date
  );

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4">
      <RetroInput
        scope="day"
        scopeKey={date}
        initialContent={existing?.content ?? ''}
        onSave={onSave}
        label="오늘 회고"
        placeholder="오늘 하루는 어땠나요?"
        compact
      />
    </div>
  );
}
