'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Repeat } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SlotCoord, ScheduledItem, Project } from '@/lib/types';
import ItemCard from './ItemCard';
import ColorDot from '@/components/ui/ColorDot';
import { useLocale } from '@/i18n/context';

interface SlotCellProps {
  coord: SlotCoord;
  item: ScheduledItem | null;
  onComplete: (item: ScheduledItem) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  onDelete?: (item: ScheduledItem) => void;
  onUpdateTitle?: (item: ScheduledItem, title: string) => void;
  onUpdateProject?: (item: ScheduledItem, projectId: string | null) => void;
  onCreateInSlot?: (title: string, coord: SlotCoord, projectId?: string | null) => void;
  onUncomplete?: (item: ScheduledItem) => void;
  projectFirstMode?: boolean;
  projects?: Project[];
  isReadOnly?: boolean;
  onItemSelect?: (item: ScheduledItem) => void;
  onEditRecurrence?: (item: ScheduledItem) => void;
  onCreateRoutine?: (title: string, coord: SlotCoord) => void;
  isHighlighted?: boolean;
}

export default function SlotCell({
  coord,
  item,
  onComplete,
  onDefer,
  onRepeat,
  onDelete,
  onUpdateTitle,
  onUpdateProject,
  onCreateInSlot,
  onUncomplete,
  projectFirstMode,
  projects,
  isReadOnly,
  onItemSelect,
  onEditRecurrence,
  onCreateRoutine,
  isHighlighted,
}: SlotCellProps) {
  const { t } = useLocale();
  const droppableId = `${coord.period}-${coord.priority}`;
  const { isOver, setNodeRef } = useDroppable({ id: droppableId, data: { coord }, disabled: isReadOnly });

  const [inputting, setInputting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjects = (projects ?? []).filter((p) => !p.archived);

  // item에 연결된 프로젝트 찾기
  const itemProject = item && 'projectId' in item && item.projectId
    ? activeProjects.find((p) => p.id === item.projectId) ?? null
    : null;

  const openInput = () => {
    if (item) return;
    if (isReadOnly) return;
    setSelectedProject(null); // 기본: uncategorized
    setInputValue('');
    setInputting(true);
    setDropdownOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitInput = () => {
    const trimmed = inputValue.trim();
    setInputting(false);
    setInputValue('');
    setDropdownOpen(false);
    if (trimmed && onCreateInSlot) {
      onCreateInSlot(trimmed, coord, selectedProject?.id ?? null);
    }
    setSelectedProject(null);
  };

  // 외부 클릭 effect에서 최신 commitInput을 참조하기 위한 ref
  const commitRef = useRef(commitInput);
  commitRef.current = commitInput;

  const cancelInput = () => {
    setInputting(false);
    setInputValue('');
    setSelectedProject(null);
    setDropdownOpen(false);
  };

  // 외부 클릭 시 dropdown 닫기
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // 외부 클릭 시 입력 커밋 (포탈 드롭다운 클릭은 제외)
  useEffect(() => {
    if (!inputting) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // 컨테이너 또는 포탈 드롭다운 내부 클릭이면 무시
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      commitRef.current();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputting]);

  const openDropdown = useCallback(() => {
    if (!tagRef.current) return;
    const rect = tagRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    setDropdownOpen(true);
  }, []);

  const selectProject = (project: Project | null) => {
    setSelectedProject(project);
    setDropdownOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={[
        'relative min-h-[80px] rounded-lg transition-all duration-150',
        isOver
          ? 'ring-2 ring-[var(--foreground)] bg-[var(--foreground)]/8 scale-[1.02]'
          : item?.completedAt ? 'bg-transparent' : 'bg-[var(--surface-inset)]',
      ].join(' ')}
    >
      {item ? (
        <ItemCard
          item={item}
          project={itemProject}
          projects={projects}
          onComplete={onComplete}
          onDefer={onDefer}
          onRepeat={onRepeat}
          onDelete={onDelete}
          onUpdateTitle={onUpdateTitle}
          onUpdateProject={onUpdateProject}
          onUncomplete={onUncomplete}
          isReadOnly={isReadOnly}
          onItemSelect={onItemSelect}
          onEditRecurrence={onEditRecurrence}
          isHighlighted={isHighlighted}
        />
      ) : inputting ? (
        /* 통합 입력 모드: 상단 프로젝트 태그 + 하단 텍스트 입력 */
        <div className="w-full h-full min-h-[80px] flex flex-col justify-between p-2 gap-1">
          {/* 상단: 프로젝트 선택 태그 */}
          <div className="relative">
            <button
              ref={tagRef}
              onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
              onMouseEnter={openDropdown}
              className={[
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
                'text-[11px] font-medium transition-colors duration-100',
                'border border-[var(--border)] hover:border-[var(--foreground)]',
                'hover:bg-[var(--muted)] cursor-pointer',
                selectedProject
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--muted-foreground)]',
              ].join(' ')}
            >
              <ColorDot
                color={selectedProject?.color ?? '#8A8A8A'}
                size="sm"
              />
              <span className="truncate max-w-[80px]">
                {selectedProject?.name ?? t.uncategorized}
              </span>
            </button>

            {/* 프로젝트 드롭다운 — Portal로 렌더 (잘림 방지) */}
            {dropdownOpen && dropdownPos && createPortal(
              <div
                ref={dropdownRef}
                className={[
                  'fixed z-[9999]',
                  'w-44 rounded-[calc(var(--radius)*1.4)] border border-[var(--border)]',
                  'bg-[var(--popover)] shadow-xl overflow-hidden',
                  'animate-[status-appear_0.12s_ease_forwards]',
                ].join(' ')}
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
                onMouseLeave={() => setDropdownOpen(false)}
                role="listbox"
                aria-label={t.selectProject}
              >
                {activeProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p)}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-1.5',
                      'text-[var(--fs-tag)] text-left transition-colors duration-100',
                      selectedProject?.id === p.id
                        ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                        : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                    ].join(' ')}
                    role="option"
                    aria-selected={selectedProject?.id === p.id}
                  >
                    <ColorDot color={p.color} size="sm" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                {activeProjects.length > 0 && (
                  <div className="border-t border-[var(--border)]" />
                )}
                <button
                  onClick={() => selectProject(null)}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-1.5',
                    'text-[var(--fs-tag)] text-left transition-colors duration-100',
                    selectedProject === null
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]',
                  ].join(' ')}
                  role="option"
                  aria-selected={selectedProject === null}
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] inline-block" />
                  <span>{t.uncategorized}</span>
                </button>
              </div>,
              document.body,
            )}
          </div>

          {/* 하단: 텍스트 입력 + 반복 아이콘 */}
          <div className="flex items-center gap-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); commitInput(); }
                if (e.key === 'Escape') cancelInput();
              }}
              rows={1}
              onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }}
              placeholder={t.taskInputPlaceholder}
              className="flex-1 text-[var(--fs-item)] text-[var(--foreground)] bg-transparent outline-none border-b border-[var(--accent)] placeholder:text-[var(--muted-foreground)] py-1 resize-none"
            />
            {onCreateRoutine && (
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => {
                  e.stopPropagation();
                  const title = inputValue.trim();
                  // 입력 초기화 먼저 — 모달 열릴 때 commitInput 방지
                  setInputting(false);
                  setInputValue('');
                  setSelectedProject(null);
                  setDropdownOpen(false);
                  onCreateRoutine(title, coord);
                }}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                title={t.recurrenceSettings}
              >
                <Repeat size={13} strokeWidth={2} />
              </button>
            )}
          </div>
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
          aria-label={t.addToSlot}
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
