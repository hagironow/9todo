'use client';

import { useEffect, useRef } from 'react';
import { Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';

interface ProjectPickerProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (project: Project | null) => void;
  onClose: () => void;
}

export default function ProjectPicker({
  projects,
  selectedId,
  onSelect,
  onClose,
}: ProjectPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={[
        'absolute bottom-full left-0 mb-2 z-20',
        'w-48 rounded-[calc(var(--radius)*1.4)] border border-[var(--border)]',
        'bg-[var(--popover)] shadow-xl overflow-hidden',
        'animate-[status-appear_0.15s_ease_forwards]',
      ].join(' ')}
      role="listbox"
      aria-label="프로젝트 선택"
    >
      {/* 없음 옵션 */}
      <button
        onClick={() => { onSelect(null); onClose(); }}
        className={[
          'w-full flex items-center gap-2.5 px-3 py-2',
          'text-[var(--fs-tag)] text-left transition-colors duration-100',
          selectedId === null
            ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
            : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
        ].join(' ')}
        role="option"
        aria-selected={selectedId === null}
      >
        <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] inline-block" />
        미분류
      </button>

      {/* 구분선 */}
      {projects.length > 0 && (
        <div className="border-t border-[var(--border)]" />
      )}

      {/* 프로젝트 목록 */}
      {projects.map((project) => (
        <button
          key={project.id}
          onClick={() => { onSelect(project); onClose(); }}
          className={[
            'w-full flex items-center gap-2.5 px-3 py-2',
            'text-[var(--fs-tag)] text-left transition-colors duration-100',
            selectedId === project.id
              ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
              : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
          ].join(' ')}
          role="option"
          aria-selected={selectedId === project.id}
        >
          <ColorDot color={project.color} size="sm" />
          <span className="truncate">{project.name}</span>
        </button>
      ))}
    </div>
  );
}
