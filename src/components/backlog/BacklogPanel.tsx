'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CalendarCheck, ChevronDown, Clock, Inbox, Plus } from 'lucide-react';
import RepeatCountIcon from '@/components/ui/RepeatCountIcon';
import { Task, RoutineInstance, Project } from '@/lib/types';
import BacklogItem from './BacklogItem';
import ColorDot from '@/components/ui/ColorDot';
import ProjectPicker from '@/components/quick-input/ProjectPicker';
import { useLocale } from '@/i18n/context';

type BacklogEntry = Task | RoutineInstance;

interface BacklogPanelProps {
  items: BacklogEntry[];
  projects: Project[];
  getTitleForItem: (item: BacklogEntry) => string;
  isRoutineInstance: (item: BacklogEntry) => boolean;
  onPlaceInSlot: (item: BacklogEntry) => void;
  onUpdateTitle?: (item: BacklogEntry, title: string) => void;
  onUpdateProject?: (item: BacklogEntry, projectId: string | null) => void;
  onDelete?: (item: BacklogEntry) => void;
  onAdd?: (title: string, projectId: string | null) => void;
  lastUsedProjectId?: string | null;
  isReadOnly?: boolean;
  /** 현재 주 키 ("YYYY-Www") — 이 값과 일치하는 항목만 '이번주 할일'로 묶인다 */
  currentWeekKey?: string;
  /** '이번주 할일' 토글 */
  onToggleWeek?: (item: BacklogEntry) => void;
}

type GroupKey = 'week' | 'deferred' | 'repeated' | 'normal';

function isInWeek(item: BacklogEntry, currentWeekKey?: string): boolean {
  if (!currentWeekKey || !('weekKey' in item)) return false;
  return (item as Task).weekKey === currentWeekKey;
}

function getOriginGroup(item: BacklogEntry, currentWeekKey?: string): GroupKey {
  // '이번주 할일'로 직접 표시한 항목이 최우선 — 지난 주 키는 자동으로 풀린다
  if (isInWeek(item, currentWeekKey)) return 'week';
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

export default function BacklogPanel({
  items,
  projects,
  getTitleForItem,
  isRoutineInstance,
  onPlaceInSlot,
  onUpdateTitle,
  onUpdateProject,
  onDelete,
  onAdd,
  lastUsedProjectId,
  isReadOnly,
  currentWeekKey,
  onToggleWeek,
}: BacklogPanelProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    projects.find((p) => p.id === lastUsedProjectId) ?? null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerAnchorRef = useRef<HTMLButtonElement>(null);

  const GROUP_CONFIG: Record<GroupKey, { label: string; icon: typeof Clock | typeof Inbox | null; order: number }> = {
    week:     { label: t.weekTodoItems, icon: CalendarCheck, order: 0 },
    deferred: { label: t.deferredItems, icon: Clock,         order: 1 },
    repeated: { label: t.redoItems,     icon: null,          order: 2 },
    normal:   { label: t.todoItems,     icon: Inbox,         order: 3 },
  };

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
  const grouped: Record<GroupKey, BacklogEntry[]> = { week: [], deferred: [], repeated: [], normal: [] };
  for (const item of items) {
    const group = getOriginGroup(item, currentWeekKey);
    grouped[group].push(item);
  }

  const orderedGroups = (['week', 'deferred', 'repeated', 'normal'] as GroupKey[]).filter(
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
            {t.backlog}
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
                {t.backlogEmpty}
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
                          projects={projects}
                          onUpdateProject={onUpdateProject}
                          onPlaceInSlot={onPlaceInSlot}
                          onUpdateTitle={onUpdateTitle}
                          onDelete={onDelete}
                          isReadOnly={isReadOnly}
                          inWeek={key === 'week'}
                          onToggleWeek={onToggleWeek}
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
                ref={pickerAnchorRef}
                onClick={() => setPickerOpen((v) => !v)}
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors"
                aria-label={t.selectProject}
              >
                <ColorDot color={selectedProject?.color ?? '#8A8A8A'} size="sm" />
              </button>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.addToBacklog}
                className="flex-1 bg-transparent text-[var(--foreground)] text-[var(--fs-item)] placeholder:text-[var(--muted-foreground)] outline-none"
              />
              <button
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-[var(--radius)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
                aria-label={t.add}
              >
                <Plus size={14} />
              </button>
              {pickerOpen && (
                <ProjectPicker
                  projects={projects}
                  selectedId={selectedProject?.id ?? null}
                  onSelect={(project) => setSelectedProject(project)}
                  onClose={() => setPickerOpen(false)}
                  anchorRef={pickerAnchorRef}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
