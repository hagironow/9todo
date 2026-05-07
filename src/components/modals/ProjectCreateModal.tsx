'use client';

import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { COLOR_THEMES, resolveColor } from '@/lib/colors';

interface ProjectCreateData {
  name: string;
  colorIndex: number;
}

interface ProjectCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectCreateData) => void;
  colorTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ProjectCreateModal({
  open,
  onClose,
  onSave,
  colorTheme,
  onThemeChange,
}: ProjectCreateModalProps) {
  const [name, setName] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [nameError, setNameError] = useState('');

  const theme = COLOR_THEMES.find((t) => t.id === colorTheme) ?? COLOR_THEMES[0];
  const previewColor = resolveColor(colorIndex, colorTheme);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('프로젝트 이름을 입력하세요');
      return;
    }
    onSave({ name: trimmed, colorIndex });
    setName('');
    setColorIndex(0);
    setNameError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setColorIndex(0);
    setNameError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="새 프로젝트" width="sm">
      {/* 프로젝트 이름 */}
      <Input
        label="프로젝트 이름"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (nameError) setNameError('');
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        placeholder="프로젝트 이름"
        error={nameError}
        autoFocus
      />

      {/* 컬러 테마 */}
      <div className="flex flex-col gap-3">
        <p className="text-[var(--fs-tag)] font-semibold text-[var(--foreground)]">
          컬러
        </p>

        {/* 테마 탭 */}
        <div className="flex gap-1.5">
          {COLOR_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={[
                'px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-medium',
                'transition-all duration-150 cursor-pointer',
                colorTheme === t.id
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 팔레트 */}
        <div className="flex gap-2.5 flex-wrap">
          {theme.colors.map((hex, idx) => (
            <button
              key={idx}
              onClick={() => setColorIndex(idx)}
              className={[
                'w-8 h-8 rounded-full transition-all duration-150',
                'focus-visible:outline-none',
                colorIndex === idx
                  ? 'ring-2 ring-offset-2 ring-offset-[var(--card)] ring-[var(--foreground)] scale-110'
                  : 'hover:scale-105',
              ].join(' ')}
              style={{ backgroundColor: hex }}
              aria-label={`컬러 ${idx + 1}`}
              aria-pressed={colorIndex === idx}
            />
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-[var(--muted)]">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: previewColor }}
        />
        <span className="text-[var(--fs-item)] text-[var(--foreground)] truncate">
          {name.trim() || '프로젝트 이름'}
        </span>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={handleClose}>취소</Button>
        <Button variant="primary" onClick={handleSave}>만들기</Button>
      </div>
    </Dialog>
  );
}
