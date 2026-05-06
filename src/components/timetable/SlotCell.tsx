'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SlotCoord, ScheduledItem, Project } from '@/lib/types';
import ItemCard from './ItemCard';
import ColorDot from '@/components/ui/ColorDot';

interface SlotCellProps {
  coord: SlotCoord;
  item: ScheduledItem | null;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUpdateTitle?: (item: ScheduledItem, title: string) => void;
  onCreateInSlot?: (title: string, coord: SlotCoord, projectId?: string | null) => void;
  projectFirstMode?: boolean;
  projects?: Project[];
  isReadOnly?: boolean;
}

export default function SlotCell({
  coord,
  item,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUpdateTitle,
  onCreateInSlot,
  projectFirstMode,
  projects,
  isReadOnly,
}: SlotCellProps) {
  const droppableId = `${coord.period}-${coord.priority}`;
  const { isOver, setNodeRef } = useDroppable({ id: droppableId, data: { coord }, disabled: isReadOnly });

  const [inputting, setInputting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [pickingProject, setPickingProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProjects = (projects ?? []).filter((p) => !p.archived);

  const openInput = () => {
    if (item) return;
    if (isReadOnly) return;
    if (projectFirstMode && activeProjects.length > 0) {
      // 프로젝트 우선 모드 — 먼저 프로젝트 선택
      setPickingProject(true);
    } else {
      // 일반 모드 — 바로 입력
      startTextInput(null);
    }
  };

  const startTextInput = (project: Project | null) => {
    setSelectedProject(project);
    setPickingProject(false);
    setInputValue('');
    setInputting(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitInput = () => {
    const trimmed = inputValue.trim();
    setInputting(false);
    setInputValue('');
    setSelectedProject(null);
    if (trimmed && onCreateInSlot) {
      onCreateInSlot(trimmed, coord, selectedProject?.id ?? null);
    }
  };

  const cancelInput = () => {
    setInputting(false);
    setPickingProject(false);
    setInputValue('');
    setSelectedProject(null);
  };

  return (
    <div
      ref={setNodeRef}
      className={[
        'relative min-h-[80px] rounded-lg transition-all duration-150',
        isOver
          ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/8 scale-[1.02]'
          : 'bg-[var(--surface-inset)]',
      ].join(' ')}
    >
      {item ? (
        <ItemCard
          item={item}
          onComplete={onComplete}
          onDefer={onDefer}
          onRepeat={onRepeat}
          onDelete={onDelete}
          onUpdateTitle={onUpdateTitle}
          isReadOnly={isReadOnly}
        />
      ) : pickingProject ? (
        /* 프로젝트 선택 단계 */
        <div
          className="w-full h-full min-h-[80px] flex flex-col gap-0.5 p-1.5 overflow-y-auto"
          onMouseLeave={() => cancelInput()}
        >
          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => startTextInput(p)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] text-[var(--fs-tag)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-left truncate"
            >
              <ColorDot color={p.color} size="sm" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
          <button
            onClick={() => startTextInput(null)}
            className="px-2 py-1 text-[var(--fs-tag)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-left"
          >
            미분류
          </button>
        </div>
      ) : inputting ? (
        /* 텍스트 입력 단계 */
        <div className="w-full h-full min-h-[80px] flex items-center px-3 gap-2">
          {selectedProject && (
            <ColorDot color={selectedProject.color} size="sm" />
          )}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitInput();
              if (e.key === 'Escape') cancelInput();
            }}
            placeholder={selectedProject ? `${selectedProject.name}` : '할 일 입력...'}
            className="flex-1 min-w-0 text-[var(--fs-item)] text-[var(--foreground)] bg-transparent outline-none border-b border-[var(--accent)] placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      ) : isReadOnly ? (
        <div className="w-full h-full min-h-[80px]" />
      ) : (
        <button
          onClick={openInput}
          className={[
            'w-full h-full min-h-[80px] flex items-center justify-center',
            'rounded-lg',
            'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
            'transition-colors duration-150 cursor-pointer',
          ].join(' ')}
          aria-label="슬롯에 항목 추가"
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
