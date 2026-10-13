'use client';

import { useState } from 'react';
import { Inbox, CalendarDays, Trash2 } from 'lucide-react';
import type { Task, Project, WeekPriority } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import ColorDot from '@/components/ui/ColorDot';
import WeekPriorityPicker from './WeekPriorityPicker';
import WeekDayPicker from './WeekDayPicker';
import { useLocale } from '@/i18n/context';

interface WeekItemDialogProps {
  task: Task | null;
  projects: Project[];
  onClose: () => void;
  onUpdateTitle: (taskId: string, title: string) => void;
  onSetPriority: (taskId: string, priority: WeekPriority) => void;
  onSetWeekDay: (taskId: string, weekDay: number | null) => void;
  /** 오늘 요일 인덱스 (0=월) */
  todayIndex: number;
  onSetProject: (taskId: string, projectId: string | null) => void;
  onPlaceInSlot: (task: Task) => void;
  onSendToBacklog: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

/** 이번 주 항목을 눌렀을 때 뜨는 상세 모달. 백로그로 내보내는 출구가 여기 있다. */
export default function WeekItemDialog({ task, ...rest }: WeekItemDialogProps) {
  // task.id를 key로 줘서 항목이 바뀌면 본문이 새로 마운트된다 (초기값 동기화용 effect 불필요)
  if (!task) return null;
  return <WeekItemDialogBody key={task.id} task={task} {...rest} />;
}

function WeekItemDialogBody({
  task,
  projects,
  onClose,
  onUpdateTitle,
  onSetPriority,
  onSetWeekDay,
  onSetProject,
  onPlaceInSlot,
  onSendToBacklog,
  onDelete,
  todayIndex,
}: WeekItemDialogProps & { task: Task }) {
  const { t } = useLocale();
  const [title, setTitle] = useState(task.title);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) onUpdateTitle(task.id, trimmed);
  };

  const isDone = !!task.completedAt;

  return (
    <Dialog open onClose={() => { commitTitle(); onClose(); }} width="sm">
      <div className="flex flex-col gap-4">
        {/* 제목 */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          rows={1}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }}
          className="w-full bg-transparent border-0 outline-none resize-none text-[17px] font-medium leading-snug text-[var(--foreground)]"
        />

        {/* 우선순위 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
            {t.weekView}
          </span>
          <WeekPriorityPicker
            size="sm"
            value={task.weekPriority ?? 'normal'}
            onChange={(p) => onSetPriority(task.id, p)}
          />
        </div>

        {/* 요일 — 마감이 아니라 메모 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
            {t.weekWhen}
          </span>
          <WeekDayPicker
            value={task.weekDay}
            onChange={(d) => onSetWeekDay(task.id, d)}
            todayIndex={todayIndex}
          />
        </div>

        {/* 프로젝트 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
            {t.projects}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSetProject(task.id, null)}
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[13px] transition-colors',
                !task.projectId
                  ? 'border-[var(--foreground)] text-[var(--foreground)] font-medium'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              <ColorDot color="#8A8A8A" size="sm" />
              {t.uncategorized}
            </button>
            {projects.filter((p) => !p.archived).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSetProject(task.id, p.id)}
                className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[13px] transition-colors',
                  task.projectId === p.id
                    ? 'border-[var(--foreground)] text-[var(--foreground)] font-medium'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                ].join(' ')}
              >
                <ColorDot color={p.color} size="sm" />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 액션 */}
        <div className="flex flex-col gap-1 pt-1 border-t border-[var(--border)]">
          {!isDone && (
            <button
              type="button"
              onClick={() => { commitTitle(); onPlaceInSlot(task); onClose(); }}
              className="flex items-center gap-2.5 px-2 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-left"
            >
              <CalendarDays size={15} strokeWidth={1.8} className="text-[var(--muted-foreground)]" />
              {t.weekPlaceToday}
            </button>
          )}
          <button
            type="button"
            onClick={() => { commitTitle(); onSendToBacklog(task.id); onClose(); }}
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-left"
          >
            <Inbox size={15} strokeWidth={1.8} className="text-[var(--muted-foreground)]" />
            {t.weekSendToBacklog}
          </button>
          <button
            type="button"
            onClick={() => { onDelete(task.id); onClose(); }}
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-[var(--radius-sm)] text-[14px] text-[var(--g-error)] hover:bg-[var(--g-error)]/10 transition-colors text-left"
          >
            <Trash2 size={15} strokeWidth={1.8} />
            {t.delete}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
