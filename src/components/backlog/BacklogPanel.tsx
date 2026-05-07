'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronDown, Clock, Inbox, Plus } from 'lucide-react';
import RepeatCountIcon from '@/components/ui/RepeatCountIcon';
import { Task, RoutineInstance, Project } from '@/lib/types';
import BacklogItem from './BacklogItem';
import ColorDot from '@/components/ui/ColorDot';
import ProjectPicker from '@/components/quick-input/ProjectPicker';

type BacklogEntry = Task | RoutineInstance;

interface BacklogPanelProps {
  items: BacklogEntry[];
  projects: Project[];
  getTitleForItem: (item: BacklogEntry) => string;
  isRoutineInstance: (item: BacklogEntry) => boolean;
  onPlaceInSlot: (item: BacklogEntry) => void;
  onAdd?: (title: string, projectId: string | null) => void;
  lastUsedProjectId?: string | null;
  isReadOnly?: boolean;
}

function getOriginGroup(item: BacklogEntry): 'deferred' | 'repeated' | 'normal' {
  if ('origin' in item) {
    const origin = (item as Task).origin;
    if (origin === 'deferred') return 'deferred';
    if (origin === 'repeated') return 'repeated';
  }
  if ('deferCount' in item && (item as Task | RoutineInstance).deferCount > 0) {
    return 'deferred';
  }
  return 'normal';
}

const GROUP_CONFIG = {
  deferred: { label: '미룬 일', icon: Clock, order: 0 },
  repeated: { label: '또하기', icon: null, order: 1 },
  normal:   { label: '할 일', icon: Inbox, order: 2 },
} as const;

type GroupKey = keyof typeof GROUP_CONFIG;

export default function BacklogPanel({
  items,
  projects,
  getTitleForItem,
  isRoutineInstance,
  onPlaceInSlot,
  onAdd,
  lastUsedProjectId,
  isReadOnly,
}: BacklogPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    projects.find((p) => p.id === lastUsedProjectId) ?? null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !onAdd) return;
    onAdd(trimmed, selectedProject?.id ?? null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd();
  };

  const { isOver, setNodeRef: setDropRef } = useDroppable({ id: 'backlog-drop' });

  const totalCount = items.length;

  // Group by origin
  const grouped: Record<GroupKey, BacklogEntry[]> = { deferred: [], repeated: [], normal: [] };
  for (const item of items) {
    const group = getOriginGroup(item);
    grouped[group].push(item);
  }

  const orderedGroups = (['deferred', 'repeated', 'normal'] as GroupKey[]).filter(
    (key) => grouped[key].length > 0
  );

  return (
    <section
      ref={setDropRef}
      className={[
        'rounded-[calc(var(--radius)*1.4)] overflow-hidden bg-[var(--card)] transition-all duration-150',
        isOver ? 'ring-2 ring-[var(--accent)] ring-inset' : '',
      ].join(' ')}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)] transition-colors duration-100"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[var(--foreground)]">
            백로그
          </span>
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 bg-[var(--muted)] rounded-full text-[11px] font-semibold text-[var(--muted-foreground)]">
              {totalCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[var(--muted-foreground)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Body */}
      <div
        className="overflow-hidden transition-all duration-250 ease-in-out"
        style={{ maxHeight: expanded ? '800px' : '0px' }}
      >
        <div className="border-t border-[var(--border)]">
          {totalCount === 0 ? (
            <div className="py-8 flex flex-col items-center gap-2 text-center px-3">
              <Inbox size={24} className="text-[var(--muted-foreground)]" />
              <p className="text-[14px] text-[var(--muted-foreground)]">
                백로그가 비어있습니다
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {orderedGroups.map((key) => {
                const config = GROUP_CONFIG[key];
                const Icon = config.icon as React.ComponentType<{ size: number; className: string }> | null;
                const groupItems = grouped[key];

                return (
                  <div key={key}>
                    {/* Group label */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
                      {key === 'repeated'
                        ? <RepeatCountIcon count={0} size={12} className="text-[var(--muted-foreground)]" />
                        : Icon ? <Icon size={12} className="text-[var(--muted-foreground)]" /> : null
                      }
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                        {config.label}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {groupItems.length}
                      </span>
                    </div>
                    {/* Items */}
                    {groupItems.map((item) => {
                      const pid = 'projectId' in item ? item.projectId : null;
                      const project = pid ? projects.find((p) => p.id === pid) ?? null : null;
                      return (
                        <BacklogItem
                          key={item.id}
                          item={item}
                          title={getTitleForItem(item)}
                          deferCount={'deferCount' in item ? item.deferCount : 0}
                          isRoutine={isRoutineInstance(item)}
                          project={project}
                          onPlaceInSlot={onPlaceInSlot}
                          isReadOnly={isReadOnly}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* 백로그 인라인 추가 */}
          {!isReadOnly && onAdd && (
            <div className="relative flex items-center gap-2 px-3 py-2 border-t border-[var(--border)]">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors"
                aria-label="프로젝트 선택"
              >
                <ColorDot color={selectedProject?.color ?? '#8A8A8A'} size="sm" />
              </button>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="백로그에 추가..."
                className="flex-1 bg-transparent text-[var(--foreground)] text-[var(--fs-item)] placeholder:text-[var(--muted-foreground)] outline-none"
              />
              <button
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-[var(--radius)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
                aria-label="추가"
              >
                <Plus size={14} />
              </button>
              {pickerOpen && (
                <ProjectPicker
                  projects={projects}
                  selectedId={selectedProject?.id ?? null}
                  onSelect={(project) => setSelectedProject(project)}
                  onClose={() => setPickerOpen(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
