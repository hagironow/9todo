'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface GoalCompassIdentityProps {
  identity: string;
  onSave: (value: string) => void;
}

export default function GoalCompassIdentity({
  identity,
  onSave,
}: GoalCompassIdentityProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(identity);
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== identity) onSave(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(identity);
      setEditing(false);
    }
  };

  return (
    <div className="px-4 py-3 flex items-center gap-2 border-b border-[var(--border)]">
      <span className="text-[var(--fs-item)] font-semibold text-[var(--muted-foreground)] whitespace-nowrap">
        나는
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
            'bg-transparent text-[var(--foreground)]',
            'text-[var(--fs-item)] font-semibold',
            'outline-none',
            'border border-[var(--border)] focus:border-[var(--foreground)]',
          ].join(' ')}
          placeholder="어떤 사람이 되고 싶나요?"

        />
      ) : (
        <span
          onClick={startEdit}
          className={[
            'flex-1 px-2 py-0.5 rounded-[var(--radius)] -mx-2',
            'text-[var(--fs-item)] font-semibold cursor-text',
            'hover:bg-[var(--muted)] transition-colors duration-100',
            identity ? 'text-[var(--accent)]' : 'text-[var(--muted-foreground)]',
          ].join(' ')}
        >
          {identity || '___'}
        </span>
      )}

      <span className="text-[var(--fs-item)] font-semibold text-[var(--muted-foreground)] whitespace-nowrap">
        이다
      </span>
    </div>
  );
}
