'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { CheckCircle2, Circle, Plus, X } from 'lucide-react';
import type { GoalCompass, GoalTask, GoalPeriod } from '@/lib/types';
import { useLocale } from '@/i18n/context';

type GoalKey = keyof GoalCompass['goals'];

interface GoalRow {
  key: GoalKey;
  label: string;
  placeholder: string;
  isTaskBased?: boolean; // today/week/month는 task 기반
  goalPeriod?: GoalPeriod;
}

// ── Task-based goal row (today/week/month) ──
function GoalTaskRow({
  row,
  goalTask,
  onAdd,
  onComplete,
  onUncomplete,
  onUpdateTitle,
  onRemove,
}: {
  row: GoalRow;
  goalTask: GoalTask | undefined;
  onAdd: (title: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const isCompleted = !!goalTask?.completedAt;
  const isToday = row.key === 'today';

  const handleAddSubmit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onAdd(trimmed);
      setDraft('');
    }
    setAdding(false);
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSubmit(); }
    if (e.key === 'Escape') { setDraft(''); setAdding(false); }
  };

  const startEdit = () => {
    if (!goalTask || isCompleted) return;
    setEditDraft(goalTask.title);
    setEditing(true);
    setTimeout(() => {
      editRef.current?.focus();
      editRef.current?.select();
    }, 0);
  };

  const commitEdit = () => {
    if (!goalTask) return;
    const trimmed = editDraft.trim();
    if (trimmed && trimmed !== goalTask.title) {
      onUpdateTitle(goalTask.id, trimmed);
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setEditing(false); }
  };

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={[
          'w-8 text-right text-[11px] font-semibold shrink-0',
          isToday ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]',
        ].join(' ')}
      >
        {row.label}
      </span>

      {goalTask ? (
        /* 목표 있음 — 체크 + 타이틀 표시 */
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <button
            onClick={() => isCompleted ? onUncomplete(goalTask.id) : onComplete(goalTask.id)}
            className="shrink-0 transition-colors duration-150 cursor-pointer"
          >
            {isCompleted ? (
              <CheckCircle2 size={18} className="text-[var(--g-success)]" />
            ) : (
              <Circle size={18} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
            )}
          </button>

          {editing ? (
            <input
              ref={editRef}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              className="flex-1 px-2 py-0.5 rounded-[var(--radius)] bg-transparent text-[var(--foreground)] text-[var(--fs-item)] outline-none border border-[var(--border)] focus:border-[var(--foreground)]"
            />
          ) : (
            <span
              onClick={startEdit}
              className={[
                'flex-1 px-1 py-0.5 rounded-[var(--radius)] truncate',
                'text-[var(--fs-item)] transition-colors duration-100',
                isCompleted
                  ? 'line-through text-[var(--muted-foreground)]'
                  : 'text-[var(--foreground)] cursor-text hover:bg-[var(--muted)]',
              ].join(' ')}
            >
              {goalTask.title}
            </span>
          )}

          {/* 삭제 버튼 */}
          <button
            onClick={() => onRemove(goalTask.id)}
            className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            style={{ opacity: undefined }}
            title={t.delete}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* 목표 없음 — 추가 UI */
        adding ? (
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleAddSubmit}
            onKeyDown={handleAddKeyDown}
            className="flex-1 px-2 py-0.5 rounded-[var(--radius)] bg-transparent text-[var(--foreground)] text-[var(--fs-item)] outline-none border border-[var(--border)] focus:border-[var(--foreground)]"
            placeholder={row.placeholder}
          />
        ) : (
          <span
            onClick={() => setAdding(true)}
            className="flex-1 flex items-center gap-1 px-1 py-0.5 text-[var(--fs-item)] text-[var(--muted-foreground)] cursor-pointer hover:bg-[var(--muted)] rounded-[var(--radius)] transition-colors duration-100"
          >
            <Plus size={14} />
            {row.placeholder}
          </span>
        )
      )}
    </div>
  );
}

// ── String-based goal row (quarter/oneYear/fiveYear) ──
function GoalStringRow({
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

  const isNorthStar = row.key === 'fiveYear';

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-8 text-right text-[11px] font-semibold shrink-0 text-[var(--muted-foreground)]">
        {row.label}
      </span>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-0.5 rounded-[var(--radius)] bg-transparent text-[var(--foreground)] text-[var(--fs-item)] outline-none border border-[var(--border)] focus:border-[var(--foreground)]"
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
              ? isNorthStar
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

interface GoalCompassGoalsProps {
  goals: GoalCompass['goals'];
  onSave: (key: GoalKey, value: string) => void;
  // GoalTask 관련
  goalTasks: GoalTask[];
  currentPeriodKeys: { today: string; week: string; month: string };
  onAddGoalTask: (title: string, goalPeriod: GoalPeriod, periodKey: string) => void;
  onCompleteGoalTask: (id: string) => void;
  onUncompleteGoalTask: (id: string) => void;
  onUpdateGoalTaskTitle: (id: string, title: string) => void;
  onRemoveGoalTask: (id: string) => void;
}

export default function GoalCompassGoals({
  goals,
  onSave,
  goalTasks,
  currentPeriodKeys,
  onAddGoalTask,
  onCompleteGoalTask,
  onUncompleteGoalTask,
  onUpdateGoalTaskTitle,
  onRemoveGoalTask,
}: GoalCompassGoalsProps) {
  const { t } = useLocale();

  const GOAL_ROWS: GoalRow[] = [
    { key: 'today',    label: t.goalPeriodLabels[0], placeholder: t.goalPeriodPlaceholders[0], isTaskBased: true, goalPeriod: 'today' },
    { key: 'week',     label: t.goalPeriodLabels[1], placeholder: t.goalPeriodPlaceholders[1], isTaskBased: true, goalPeriod: 'week' },
    { key: 'month',    label: t.goalPeriodLabels[2], placeholder: t.goalPeriodPlaceholders[2], isTaskBased: true, goalPeriod: 'month' },
    { key: 'quarter',  label: t.goalPeriodLabels[3], placeholder: t.goalPeriodPlaceholders[3] },
    { key: 'oneYear',  label: t.goalPeriodLabels[4], placeholder: t.goalPeriodPlaceholders[4] },
    { key: 'fiveYear', label: t.goalPeriodLabels[5], placeholder: t.goalPeriodPlaceholders[5] },
  ];

  const getGoalTaskForPeriod = (goalPeriod: GoalPeriod): GoalTask | undefined => {
    const periodKey = currentPeriodKeys[goalPeriod];
    return goalTasks.find((gt) => gt.goalPeriod === goalPeriod && gt.periodKey === periodKey);
  };

  return (
    <div className="px-4 py-2 flex flex-col">
      {GOAL_ROWS.map((row) => {
        if (row.isTaskBased && row.goalPeriod) {
          const goalTask = getGoalTaskForPeriod(row.goalPeriod);
          return (
            <GoalTaskRow
              key={row.key}
              row={row}
              goalTask={goalTask}
              onAdd={(title) => onAddGoalTask(title, row.goalPeriod!, currentPeriodKeys[row.goalPeriod!])}
              onComplete={onCompleteGoalTask}
              onUncomplete={onUncompleteGoalTask}
              onUpdateTitle={onUpdateGoalTaskTitle}
              onRemove={onRemoveGoalTask}
            />
          );
        }
        return (
          <GoalStringRow
            key={row.key}
            row={row}
            value={goals[row.key]}
            onSave={(val) => onSave(row.key, val)}
          />
        );
      })}
    </div>
  );
}
