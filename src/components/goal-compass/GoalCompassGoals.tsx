'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { GoalCompass } from '@/lib/types';

type GoalKey = keyof GoalCompass['goals'];

interface GoalRow {
  key: GoalKey;
  label: string;
  placeholder: string;
}

const GOAL_ROWS: GoalRow[] = [
  { key: 'today',    label: '오늘',   placeholder: '오늘의 핵심 목표는?' },
  { key: 'week',     label: '이번주', placeholder: '이번 주에 꼭 끝낼 것은?' },
  { key: 'month',    label: '이번달', placeholder: '이번 달 목표는?' },
  { key: 'quarter',  label: '분기',   placeholder: '이번 분기 집중할 것은?' },
  { key: 'oneYear',  label: '1년',    placeholder: '올해 반드시 이루어야 할 것은?' },
  { key: 'fiveYear', label: '5년',    placeholder: '5년 안에 달성할 것은?' },
];

interface GoalCompassGoalsProps {
  goals: GoalCompass['goals'];
  onSave: (key: GoalKey, value: string) => void;
}

function GoalRowItem({
  row,
  value,
  onSave,
}: {
  row: GoalRow;
  value: string;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  };

  const isToday = row.key === 'today';

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={[
          'w-8 text-right text-[11px] font-semibold shrink-0',
          isToday ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]',
        ].join(' ')}
      >
        {row.label}
      </span>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={[
            'flex-1 px-2 py-0.5 rounded-[var(--radius)]',
            'bg-[var(--muted)] text-[var(--foreground)]',
            'text-[var(--fs-item)]',
            'outline-none focus:ring-2 focus:ring-[var(--ring)]',
            'border border-[var(--accent)]',
          ].join(' ')}
          placeholder={row.placeholder}
        />
      ) : (
        <span
          onClick={startEdit}
          className={[
            'flex-1 px-2 py-0.5 rounded-[var(--radius)] -mx-2 ml-1',
            'text-[var(--fs-item)] cursor-text',
            'hover:bg-[var(--muted)] transition-colors duration-100',
            value
              ? isToday
                ? 'text-[var(--foreground)] font-semibold'
                : 'text-[var(--foreground)]'
              : 'text-[var(--muted-foreground)]',
          ].join(' ')}
        >
          {value || row.placeholder}
        </span>
      )}
    </div>
  );
}

export default function GoalCompassGoals({ goals, onSave }: GoalCompassGoalsProps) {
  return (
    <div className="px-4 py-2 flex flex-col">
      {GOAL_ROWS.map((row) => (
        <GoalRowItem
          key={row.key}
          row={row}
          value={goals[row.key]}
          onSave={(val) => onSave(row.key, val)}
        />
      ))}
    </div>
  );
}
