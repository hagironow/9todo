'use client';

import { Task, RoutineInstance, Project } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import ColorDot from '@/components/ui/ColorDot';
import Badge from '@/components/ui/Badge';

type BacklogEntry = Task | RoutineInstance;

interface BacklogPickerModalProps {
  open: boolean;
  onClose: () => void;
  items: BacklogEntry[];
  projects: Project[];
  getTitleForItem: (item: BacklogEntry) => string;
  onSelect: (item: BacklogEntry) => void;
}

export default function BacklogPickerModal({
  open,
  onClose,
  items,
  projects,
  getTitleForItem,
  onSelect,
}: BacklogPickerModalProps) {
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return (
    <Dialog open={open} onClose={onClose} title="백로그에서 선택" width="md">
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[var(--fs-item)] text-[var(--muted-foreground)]">
            백로그가 비어있습니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)] max-h-80 overflow-y-auto -mx-6 px-0">
          {items.map((item) => {
            const projectId = 'projectId' in item ? item.projectId : null;
            const project = projectId ? projectMap.get(projectId) : null;
            const deferCount = 'deferCount' in item ? item.deferCount : 0;
            const deferVariant =
              deferCount >= 3 ? 'danger' : deferCount >= 1 ? 'warning' : 'default';

            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item); onClose(); }}
                className="flex items-center gap-3 px-6 py-2.5 hover:bg-[var(--muted)] transition-colors duration-100 text-left w-full"
              >
                {project ? (
                  <ColorDot color={project.color} size="sm" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] inline-block flex-shrink-0" />
                )}
                <span className="flex-1 text-[var(--fs-item)] text-[var(--foreground)] truncate">
                  {getTitleForItem(item)}
                </span>
                {deferCount > 0 && (
                  <Badge count={deferCount} variant={deferVariant} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}
