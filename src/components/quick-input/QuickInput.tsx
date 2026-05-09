'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Repeat } from 'lucide-react';
import { Project, RecurrenceType, SlotCoord } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Button from '@/components/ui/Button';
import ProjectPicker from './ProjectPicker';
import RecurrenceSetupModal, { RecurrenceSetupData } from '@/components/modals/RecurrenceSetupModal';

interface QuickInputProps {
  projects: Project[];
  lastUsedProjectId: string | null;
  onAdd: (title: string, projectId: string | null, recurrenceData?: RecurrenceSetupData) => void;
  disabled?: boolean;
  colorTheme?: string;
  onCreateProject?: (name: string, colorIndex: number) => Project;
}

export default function QuickInput({
  projects,
  lastUsedProjectId,
  onAdd,
  disabled,
  colorTheme,
  onCreateProject,
}: QuickInputProps) {
  const initialProject =
    projects.find((p) => p.id === lastUsedProjectId) ?? null;

  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    initialProject
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [pendingRecurrence, setPendingRecurrence] = useState<RecurrenceSetupData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, selectedProject?.id ?? null, pendingRecurrence ?? undefined);
    setTitle('');
    setPendingRecurrence(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd();
  };

  const dotColor = selectedProject?.color ?? '#8A8A8A';
  const hasTitle = title.trim().length > 0;

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

      {/* 반복 설정 버튼 — 텍스트 입력 시에만 표시 */}
      {hasTitle && (
        <button
          onClick={() => setRecurrenceModalOpen(true)}
          className={[
            'flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-[var(--radius)] transition-colors',
            pendingRecurrence
              ? 'text-[var(--accent)] bg-[var(--accent)]/10'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
          ].join(' ')}
          aria-label="반복 설정"
          title="반복 설정"
        >
          <Repeat size={15} strokeWidth={2} />
        </button>
      )}

      {/* 추가 버튼 */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleAdd}
        disabled={disabled || !hasTitle}
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

      {/* 반복 설정 모달 */}
      <RecurrenceSetupModal
        open={recurrenceModalOpen}
        onClose={() => setRecurrenceModalOpen(false)}
        initialTitle={title || '반복 투두 설정'}
        initialProjectId={selectedProject?.id ?? null}
        onSave={(data) => {
          setPendingRecurrence(data);
          if (data.projectId) {
            const proj = projects.find((p) => p.id === data.projectId);
            if (proj) setSelectedProject(proj);
          }
          setRecurrenceModalOpen(false);
          inputRef.current?.focus();
        }}
        onDelete={pendingRecurrence ? () => {
          setPendingRecurrence(null);
          setRecurrenceModalOpen(false);
        } : undefined}
        projects={projects}
        colorTheme={colorTheme}
        onCreateProject={onCreateProject}
      />
    </div>
  );
}
