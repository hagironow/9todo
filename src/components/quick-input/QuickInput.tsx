'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Button from '@/components/ui/Button';
import ProjectPicker from './ProjectPicker';

interface QuickInputProps {
  projects: Project[];
  lastUsedProjectId: string | null;
  onAdd: (title: string, projectId: string | null) => void;
  disabled?: boolean;
}

export default function QuickInput({
  projects,
  lastUsedProjectId,
  onAdd,
  disabled,
}: QuickInputProps) {
  const initialProject =
    projects.find((p) => p.id === lastUsedProjectId) ?? null;

  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    initialProject
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, selectedProject?.id ?? null);
    setTitle('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  const dotColor = selectedProject?.color ?? '#8A8A8A';

  return (
    <div className="relative flex items-center gap-2 px-3 py-2 rounded-[calc(var(--radius)*1.4)] border border-[var(--border)] bg-[var(--card)] shadow-sm">
      {/* 프로젝트 선택 도트 */}
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-[var(--radius)] hover:bg-[var(--muted)] transition-colors"
        aria-label="프로젝트 선택"
        aria-haspopup="listbox"
        aria-expanded={pickerOpen}
      >
        <ColorDot color={dotColor} size="md" />
      </button>

      {/* 텍스트 인풋 */}
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="새 항목 추가..."
        disabled={disabled}
        className={[
          'flex-1 bg-transparent text-[var(--foreground)]',
          'text-[var(--fs-item)] placeholder:text-[var(--muted-foreground)]',
          'outline-none disabled:opacity-40 disabled:cursor-not-allowed',
        ].join(' ')}
      />

      {/* 추가 버튼 */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleAdd}
        disabled={disabled || !title.trim()}
        className="flex-shrink-0"
      >
        추가
      </Button>

      {/* 프로젝트 피커 드롭다운 */}
      {pickerOpen && (
        <ProjectPicker
          projects={projects}
          selectedId={selectedProject?.id ?? null}
          onSelect={(project) => setSelectedProject(project)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
