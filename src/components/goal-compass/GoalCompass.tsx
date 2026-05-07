'use client';

import { useState } from 'react';
import { GoalCompass as GoalCompassType } from '@/lib/types';
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
}

const PREVIEW_CONFIG: Record<GoalKey, { prefix: string; empty: string }> = {
  today: { prefix: '오늘 끝낼 일은', empty: '오늘 끝내야 할 일을 정해보세요' },
  week: { prefix: '이번 주에 꼭 끝낼 것은', empty: '이번 주에 꼭 끝낼 것을 정해보세요' },
  month: { prefix: '이번 달 집중 방향은', empty: '이번 달 집중 방향을 정해보세요' },
  quarter: { prefix: '이번 분기,', empty: '이번 분기 방향을 정해보세요' },
  oneYear: { prefix: '올해,', empty: '올해 방향을 정해보세요' },
  fiveYear: { prefix: '5년 뒤,', empty: '북극성을 정해보세요' },
};

export default function GoalCompass({
  data,
  onSaveIdentity,
  onSaveGoal,
  onSaveAffirmation,
  totalXP = 0,
  previewKey = 'week',
}: GoalCompassProps) {
  const [expanded, setExpanded] = useState(false);

  const config = PREVIEW_CONFIG[previewKey];
  const goalValue = data.goals[previewKey];
  const preview = goalValue
    ? `${config.prefix} ${goalValue}`
    : config.empty;

  return (
    <section className="rounded-[calc(var(--radius)*1.4)] overflow-hidden bg-[var(--card)]">
      {/* 헤더 — 프리뷰 목표 + 전체 XP */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-col items-start px-5 py-5 hover:bg-[var(--muted)] transition-colors duration-100"
        aria-expanded={expanded}
        aria-controls="goal-compass-body"
      >
        <div className="w-full flex items-center justify-between">
          <span
            className={[
              'text-[17px] font-semibold truncate text-left',
              goalValue ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
            ].join(' ')}
          >
            {preview}
          </span>

          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`flex-shrink-0 ml-3 text-[var(--muted-foreground)] transition-transform duration-250 ${expanded ? 'rotate-180' : ''}`}
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

        {/* 전체 XP — Poppins 48px */}
        <span className="font-heading text-[48px] font-bold leading-none tracking-tight text-[var(--foreground)] mt-3">
          {totalXP}
          <span className="text-[20px] font-semibold text-[var(--muted-foreground)] ml-0.5">xp</span>
        </span>
      </button>

      {/* 접힘/펼침 본문 */}
      <div
        id="goal-compass-body"
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{ maxHeight: expanded ? '600px' : '0px' }}
      >
        <div className="border-t border-[var(--border)]">
          <GoalCompassIdentity identity={data.identity} onSave={onSaveIdentity} />
          <GoalCompassGoals goals={data.goals} onSave={onSaveGoal} />
          <GoalCompassAffirmation affirmation={data.affirmation} onSave={onSaveAffirmation} />
        </div>
      </div>
    </section>
  );
}
