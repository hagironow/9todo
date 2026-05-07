'use client';

import { Check } from 'lucide-react';
import { ScheduledItem, Project } from '@/lib/types';

interface PriorityInlineProps {
  items: (ScheduledItem | null)[]; // [0]=1순위, [1]=2순위
  projects: Project[];
  onComplete: (item: ScheduledItem) => void;
  onSelect: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}

export default function PriorityInline({
  items,
  projects,
  onComplete,
  onSelect,
  isReadOnly,
}: PriorityInlineProps) {
  const primary = items[0];
  const secondary = items[1];

  const getProject = (item: ScheduledItem): Project | null => {
    const pid = 'projectId' in item ? item.projectId : null;
    return pid ? projects.find((p) => p.id === pid) ?? null : null;
  };

  if (!primary && !secondary) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius)] bg-[var(--muted)]/50 border border-dashed border-[var(--border)]">
        <span className="text-sm text-[var(--muted-foreground)]">
          현재 시간대에 배정된 태스크가 없습니다
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {primary && (
        <PriorityRow
          item={primary}
          project={getProject(primary)}
          rank={1}
          onComplete={onComplete}
          onSelect={onSelect}
          isReadOnly={isReadOnly}
        />
      )}
      {secondary && (
        <PriorityRow
          item={secondary}
          project={getProject(secondary)}
          rank={2}
          onComplete={onComplete}
          onSelect={onSelect}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}

function PriorityRow({
  item,
  project,
  rank,
  onComplete,
  onSelect,
  isReadOnly,
}: {
  item: ScheduledItem;
  project: Project | null;
  rank: number;
  onComplete: (item: ScheduledItem) => void;
  onSelect: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
}) {
  const title = 'title' in item ? item.title : '';
  const color = project?.color ?? 'var(--accent)';
  const isCompleted = !!item.completedAt;

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-[var(--radius)] border transition-all cursor-pointer hover:shadow-sm ${
        rank === 1
          ? 'border-l-[3px] bg-[var(--card)]'
          : 'border-[var(--border-subtle)] bg-[var(--card)]'
      } ${isCompleted ? 'opacity-50' : ''}`}
      style={{ borderLeftColor: rank === 1 ? color : undefined }}
      onClick={() => onSelect(item)}
    >
      {/* Complete checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onComplete(item);
        }}
        disabled={isReadOnly || isCompleted}
        className={`w-5 h-5 flex items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors ${
          isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-[var(--border)] hover:border-[var(--foreground)] text-transparent hover:text-[var(--foreground)]'
        } disabled:cursor-not-allowed`}
      >
        <Check size={11} strokeWidth={3} />
      </button>

      {/* Rank badge */}
      <span
        className="text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-md flex-shrink-0"
        style={{
          backgroundColor: rank === 1 ? color + '20' : 'var(--muted)',
          color: rank === 1 ? color : 'var(--muted-foreground)',
        }}
      >
        {rank}
      </span>

      {/* Title */}
      <span className={`flex-1 text-sm font-medium truncate ${isCompleted ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
        {title}
      </span>

      {/* Project indicator */}
      {project && (
        <span className="text-[11px] text-[var(--muted-foreground)] flex-shrink-0">
          {project.name}
        </span>
      )}
    </div>
  );
}
