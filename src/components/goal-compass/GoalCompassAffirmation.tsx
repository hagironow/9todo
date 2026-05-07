'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface GoalCompassAffirmationProps {
  affirmation: string;
  onSave: (value: string) => void;
}

export default function GoalCompassAffirmation({
  affirmation,
  onSave,
}: GoalCompassAffirmationProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(affirmation);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEdit = () => {
    setDraft(affirmation);
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== affirmation) onSave(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setDraft(affirmation);
      setEditing(false);
    }
  };

  return (
    <div className="px-4 py-2 border-t border-[var(--border)]">
      <div className="flex items-start gap-3 py-1.5">
        <span className="w-8 text-right text-[11px] font-semibold shrink-0 text-[var(--muted-foreground)] pt-0.5">
          확언
        </span>

        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            rows={3}
            className={[
              'flex-1 px-2 py-0.5 rounded-[var(--radius)]',
              'bg-transparent text-[var(--foreground)]',
              'text-[var(--fs-item)] resize-none',
              'outline-none',
              'border border-[var(--border)] focus:border-[var(--foreground)]',
            ].join(' ')}
            placeholder="나에게 해주고 싶은 말"
          />
        ) : (
          <p
            onClick={startEdit}
            className={[
              'flex-1 px-2 py-0.5 rounded-[var(--radius)] -mx-2 ml-1',
              'text-[var(--fs-item)] cursor-text whitespace-pre-wrap',
              'hover:bg-[var(--muted)] transition-colors duration-100',
              affirmation ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
            ].join(' ')}
          >
            {affirmation || '나에게 해주고 싶은 말'}
          </p>
        )}
      </div>
    </div>
  );
}
