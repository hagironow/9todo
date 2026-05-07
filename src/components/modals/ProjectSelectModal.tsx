'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Project } from '@/lib/types';
import { COLOR_THEMES, resolveColor } from '@/lib/colors';
import Dialog from '@/components/ui/Dialog';
import ColorDot from '@/components/ui/ColorDot';

interface ProjectSelectModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onSelect: (projectId: string) => void;
  onCreateAndSelect: (name: string, colorIndex: number) => void;
  onSkip: () => void;
  colorTheme: string;
}

export default function ProjectSelectModal({
  open,
  onClose,
  projects,
  onSelect,
  onCreateAndSelect,
  onSkip,
  colorTheme,
}: ProjectSelectModalProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColorIndex, setNewColorIndex] = useState(0);

  const theme = COLOR_THEMES.find((t) => t.id === colorTheme) ?? COLOR_THEMES[0];

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateAndSelect(trimmed, newColorIndex);
    setCreating(false);
    setNewName('');
    setNewColorIndex(0);
  };

  const handleClose = () => {
    setCreating(false);
    setNewName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="프로젝트 선택" width="sm">
      {!creating ? (
        <>
          {/* Skip option */}
          <button
            onClick={() => { onSkip(); handleClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors text-left"
          >
            미분류로 유지
          </button>

          {/* Existing projects */}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); handleClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-left"
            >
              <ColorDot color={p.color} size="md" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}

          {/* New project */}
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-left"
          >
            <Plus size={14} />
            <span>새 프로젝트</span>
          </button>
        </>
      ) : (
        <>
          {/* Inline create */}
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="프로젝트 이름"
            className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-[var(--fs-item)] outline-none focus:border-[var(--foreground)]"
          />
          <div className="flex gap-2 flex-wrap">
            {theme.colors.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setNewColorIndex(idx)}
                className={[
                  'w-6 h-6 rounded-full transition-all',
                  newColorIndex === idx ? 'ring-2 ring-offset-1 ring-offset-[var(--card)] ring-[var(--foreground)] scale-110' : 'hover:scale-105',
                ].join(' ')}
                style={{ backgroundColor: resolveColor(idx, colorTheme) }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity"
            >
              만들기
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
