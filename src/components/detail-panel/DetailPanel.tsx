'use client';

import { X, Check, SkipForward, Repeat, Trash2, Clock, FolderOpen } from 'lucide-react';
import { ScheduledItem, Project } from '@/lib/types';

interface DetailPanelProps {
  item: ScheduledItem | null;
  projects: Project[];
  onClose: () => void;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete: (item: ScheduledItem) => void;
  onUpdateTitle: (item: ScheduledItem, title: string) => void;
  isReadOnly?: boolean;
}

const PERIOD_LABELS: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

export default function DetailPanel({
  item,
  projects,
  onClose,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUpdateTitle,
  isReadOnly,
}: DetailPanelProps) {
  if (!item) return null;

  const title = 'title' in item ? item.title : '';
  const projectId = 'projectId' in item ? item.projectId : null;
  const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null;
  const slot = 'slot' in item ? item.slot : null;
  const isCompleted = !!item.completedAt;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup — 우측 하단 고정 */}
      <div className="fixed bottom-4 right-4 z-50 w-[320px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">상세</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => onUpdateTitle(item, e.target.value)}
            disabled={isReadOnly}
            className="w-full text-base font-semibold text-[var(--foreground)] bg-transparent border-none outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-60"
            placeholder="태스크 제목"
          />

          {/* Properties */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <FolderOpen size={13} className="text-[var(--muted-foreground)]" />
              {project ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="text-[var(--foreground)]">{project.name}</span>
                </div>
              ) : (
                <span className="text-[var(--muted-foreground)]">프로젝트 없음</span>
              )}
            </div>
            {slot && (
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-[var(--muted-foreground)]" />
                <span className="text-[var(--foreground)]">
                  {PERIOD_LABELS[slot.period]} · {slot.priority}순위
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border)]">
            <button
              onClick={() => { onComplete(item); onClose(); }}
              disabled={isReadOnly || isCompleted}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              <Check size={13} /> 완료
            </button>
            <button
              onClick={() => { onDefer(item); onClose(); }}
              disabled={isReadOnly}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-40"
            >
              <SkipForward size={13} /> 미루기
            </button>
            <button
              onClick={() => { onDelete(item); onClose(); }}
              disabled={isReadOnly}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:bg-[var(--g-error)]/10 hover:text-[var(--g-error)] transition-colors disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
