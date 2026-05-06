'use client';

import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ProjectCreateData {
  name: string;
  color: string;
}

interface ProjectCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectCreateData) => void;
}

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#FF5C65', // Coral
  '#6B7280', // Gray
];

export default function ProjectCreateModal({
  open,
  onClose,
  onSave,
}: ProjectCreateModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [nameError, setNameError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('프로젝트 이름을 입력하세요');
      return;
    }
    onSave({ name: trimmed, color });
    setName('');
    setColor(COLOR_PRESETS[0]);
    setNameError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setColor(COLOR_PRESETS[0]);
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

      {/* 컬러 팔레트 */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[var(--fs-tag)] font-semibold text-[var(--foreground)]">
          컬러
        </p>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setColor(preset)}
              className={[
                'w-8 h-8 rounded-full transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                color === preset
                  ? 'ring-2 ring-offset-2 ring-offset-[var(--card)] scale-110'
                  : 'hover:scale-105',
              ].join(' ')}
              style={{ backgroundColor: preset }}
              aria-label={`컬러 ${preset}`}
              aria-pressed={color === preset}
            />
          ))}
        </div>
      </div>

      {/* 미리보기 */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-[var(--muted)]">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
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
