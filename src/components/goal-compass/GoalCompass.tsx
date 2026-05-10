'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { GoalCompass as GoalCompassType, GoalTask, GoalPeriod } from '@/lib/types';
import { GOAL_COMPLETE_XP } from '@/lib/xp';
import GoalCompassIdentity from './GoalCompassIdentity';
import GoalCompassGoals from './GoalCompassGoals';
import GoalCompassAffirmation from './GoalCompassAffirmation';

type GoalKey = keyof GoalCompassType['goals'];

interface GoalCompassProps {
  data: GoalCompassType;
  onSaveIdentity: (value: string) => void;
  onSaveGoal: (key: GoalKey, value: string) => void;
  onSaveAffirmation: (value: string) => void;
  totalXP?: number;
  previewKey?: GoalKey;
  // 레거시 (today 전용)
  onCompleteGoal?: () => void;
  isGoalCompleted?: boolean;
  // GoalTask 관련
  goalTasks: GoalTask[];
  currentPeriodKeys: { today: string; week: string; month: string };
  onAddGoalTask: (title: string, goalPeriod: GoalPeriod, periodKey: string) => void;
  onCompleteGoalTask: (id: string) => void;
  onUncompleteGoalTask: (id: string) => void;
  onUpdateGoalTaskTitle: (id: string, title: string) => void;
  onRemoveGoalTask: (id: string) => void;
}

const PREVIEW_CONFIG: Record<GoalKey, { prefix: string; empty: string }> = {
  today: { prefix: '오늘 끝낼 일은', empty: '오늘 끝내야 할 일을 정해보세요' },
  week: { prefix: '이번 주에 꼭 끝낼 것은', empty: '이번 주에 꼭 끝낼 것을 정해보세요' },
  month: { prefix: '이번 달 집중 방향은', empty: '이번 달 집중 방향을 정해보세요' },
  quarter: { prefix: '이번 분기,', empty: '이번 분기 방향을 정해보세요' },
  oneYear: { prefix: '올해,', empty: '올해 방향을 정해보세요' },
  fiveYear: { prefix: '5년 뒤,', empty: '북극성을 정해보세요' },
};

const TASK_BASED_KEYS: GoalKey[] = ['today', 'week', 'month'];

export default function GoalCompass({
  data,
  onSaveIdentity,
  onSaveGoal,
  onSaveAffirmation,
  totalXP = 0,
  previewKey = 'week',
  onCompleteGoal,
  isGoalCompleted,
  goalTasks,
  currentPeriodKeys,
  onAddGoalTask,
  onCompleteGoalTask,
  onUncompleteGoalTask,
  onUpdateGoalTaskTitle,
  onRemoveGoalTask,
}: GoalCompassProps) {
  const [expanded, setExpanded] = useState(false);

  const config = PREVIEW_CONFIG[previewKey];

  // Task-based keys: goalTasks에서 가져옴, 나머지: goalCompass.goals에서
  const isTaskBased = TASK_BASED_KEYS.includes(previewKey);
  let goalValue = '';
  let previewGoalTask: GoalTask | undefined;
  let previewIsCompleted = false;

  if (isTaskBased) {
    const goalPeriod = previewKey as GoalPeriod;
    const periodKey = currentPeriodKeys[goalPeriod];
    previewGoalTask = goalTasks.find((gt) => gt.goalPeriod === goalPeriod && gt.periodKey === periodKey);
    goalValue = previewGoalTask?.title ?? '';
    previewIsCompleted = !!previewGoalTask?.completedAt;
  } else {
    goalValue = data.goals[previewKey];
  }

  const preview = goalValue
    ? `${config.prefix} ${goalValue}`
    : config.empty;

  return (
    <section className="rounded-[calc(var(--radius)*1.4)] overflow-hidden bg-[var(--card)]">
      {/* 헤더 — 프리뷰 목표 + 전체 XP */}
      <div
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-col items-start px-5 py-3 hover:bg-[var(--muted)] transition-colors duration-100 cursor-pointer"
        role="button"
        aria-expanded={expanded}
        aria-controls="goal-compass-body"
      >
        <div className="w-full flex items-center justify-between">
          <span
            className={[
              'text-[14px] md:text-[16px] font-normal truncate text-left',
              goalValue ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
            ].join(' ')}
          >
            {goalValue ? (
              <>
                {config.prefix}{' '}
                <span className={[
                  'font-semibold',
                  previewIsCompleted ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--accent)]',
                ].join(' ')}>
                  {goalValue}
                </span>
              </>
            ) : config.empty}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {/* 목표 완료 버튼 (task-based) */}
            <div className="flex items-center justify-end" style={{ minHeight: '32px' }}>
              {isTaskBased && previewGoalTask && !previewIsCompleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                      navigator.vibrate(40);
                    }
                    onCompleteGoalTask(previewGoalTask!.id);
                  }}
                  className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:scale-95 transition-all duration-150 cursor-pointer"
                  title={`완료 (+${GOAL_COMPLETE_XP}xp)`}
                >
                  <span className="text-[12px] font-semibold">{GOAL_COMPLETE_XP}xp</span>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="white" />
                    <path d="m9 12 2 2 4-4" stroke="#888" strokeWidth="2" />
                  </svg>
                </button>
              )}
              {isTaskBased && previewIsCompleted && (
                <span className="text-[12px] font-bold" style={{ color: 'var(--g-success)' }}>+{GOAL_COMPLETE_XP}xp</span>
              )}
            </div>

            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={`text-[var(--muted-foreground)] transition-transform duration-250 ${expanded ? 'rotate-180' : ''}`}
            >
              <path
                d="M2 5L7 10L12 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* 전체 XP */}
        <span className="font-heading text-[24px] font-bold leading-none tracking-tight text-[var(--foreground)] mt-2">
          {totalXP}
          <span className="text-[14px] font-semibold text-[var(--muted-foreground)] ml-0.5">xp</span>
        </span>
      </div>

      {/* 접힘/펼침 본문 */}
      <div
        id="goal-compass-body"
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{ maxHeight: expanded ? '600px' : '0px' }}
      >
        <div className="border-t border-[var(--border)]">
          <GoalCompassIdentity identity={data.identity} onSave={onSaveIdentity} />
          <GoalCompassGoals
            goals={data.goals}
            onSave={onSaveGoal}
            goalTasks={goalTasks}
            currentPeriodKeys={currentPeriodKeys}
            onAddGoalTask={onAddGoalTask}
            onCompleteGoalTask={onCompleteGoalTask}
            onUncompleteGoalTask={onUncompleteGoalTask}
            onUpdateGoalTaskTitle={onUpdateGoalTaskTitle}
            onRemoveGoalTask={onRemoveGoalTask}
          />
          <GoalCompassAffirmation affirmation={data.affirmation} onSave={onSaveAffirmation} />
        </div>
      </div>
    </section>
  );
}
