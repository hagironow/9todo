'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { CheckCircle2, Circle, Plus, X } from 'lucide-react';
import type { GoalTask } from '@/lib/types';
import { useLocale } from '@/i18n/context';

/** textarea 높이를 내용에 맞춰 자동 조절 (줄바꿈은 아래로) */
function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

const TEXTAREA_CLASS =
  'flex-1 min-w-0 box-border resize-none overflow-hidden p-0 ' +
  'bg-transparent text-[var(--foreground)] text-[11px] leading-snug outline-none border-none ' +
  'whitespace-pre-wrap break-words placeholder:text-[var(--muted-foreground)]';

interface WeekDayGoalCellProps {
  /** 이 칼럼의 날짜 키 (YYYY-MM-DD) */
  dateKey: string;
  isToday: boolean;
  goalTask: GoalTask | undefined;
  onAdd: (dateKey: string, title: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}

/**
 * 위클리 각 날짜 칼럼 상단의 '그 날 끝낼 일' 셀.
 * goalPeriod 'today' + periodKey=날짜 인 GoalTask를 표시/편집 →
 * 오늘 칼럼은 나침반 today 행과 동일 데이터를 공유해 자동 동기화된다.
 */
export default function WeekDayGoalCell({
  dateKey,
  isToday,
  goalTask,
  onAdd,
  onComplete,
  onUncomplete,
  onUpdateTitle,
  onRemove,
}: WeekDayGoalCellProps) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);

  const isCompleted = !!goalTask?.completedAt;

  const handleAddSubmit = () => {
    const trimmed = draft.trim();
    if (trimmed) onAdd(dateKey, trimmed);
    setDraft('');
    setAdding(false);
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleAddSubmit(); }
    if (e.key === 'Escape') { setDraft(''); setAdding(false); }
  };

  const startEdit = () => {
    if (!goalTask || isCompleted) return;
    setEditDraft(goalTask.title);
    setEditing(true);
    setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); autoSize(editRef.current); }, 0);
  };

  const commitEdit = () => {
    if (!goalTask) return;
    const trimmed = editDraft.trim();
    if (trimmed && trimmed !== goalTask.title) onUpdateTitle(goalTask.id, trimmed);
    setEditing(false);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div
      className={[
        'group/goal min-h-[34px] px-1.5 py-1 flex items-start gap-1 border-l border-[var(--border)]',
        isToday ? 'bg-[var(--primary)]/5' : '',
      ].join(' ')}
    >
      {goalTask ? (
        <>
          <button
            onClick={() => (isCompleted ? onUncomplete(goalTask.id) : onComplete(goalTask.id))}
            className="shrink-0 mt-[1px] transition-colors duration-150 cursor-pointer"
            title={t.complete}
          >
            {isCompleted ? (
              <CheckCircle2 size={13} className="text-[var(--g-success)]" />
            ) : (
              <Circle size={13} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
            )}
          </button>

          {editing ? (
            <textarea
              ref={editRef}
              rows={1}
              value={editDraft}
              onChange={(e) => { setEditDraft(e.target.value); autoSize(e.currentTarget); }}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              className={TEXTAREA_CLASS}
            />
          ) : (
            <span
              onClick={startEdit}
              className={[
                'flex-1 min-w-0 text-[11px] leading-snug break-words cursor-text',
                isCompleted ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]',
              ].join(' ')}
            >
              {goalTask.title}
            </span>
          )}

          <button
            onClick={() => onRemove(goalTask.id)}
            className="shrink-0 mt-[1px] text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors cursor-pointer opacity-0 group-hover/goal:opacity-100"
            title={t.delete}
          >
            <X size={11} />
          </button>
        </>
      ) : adding ? (
        <textarea
          autoFocus
          rows={1}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); autoSize(e.currentTarget); }}
          onBlur={handleAddSubmit}
          onKeyDown={handleAddKeyDown}
          placeholder={t.goalPeriodPlaceholders[0]}
          className={TEXTAREA_CLASS}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex-1 min-w-0 self-stretch flex items-start gap-0.5 text-[11px] leading-snug text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-left"
        >
          <Plus size={12} className="shrink-0 mt-[1px] opacity-60 group-hover/goal:opacity-100" />
        </button>
      )}
    </div>
  );
}
