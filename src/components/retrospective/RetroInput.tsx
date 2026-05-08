'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';
import type { RetroScope } from '@/lib/types';

interface RetroInputProps {
  scope: RetroScope;
  scopeKey: string;
  initialContent: string;
  onSave: (scope: RetroScope, scopeKey: string, content: string) => void;
  placeholder?: string;
  label?: string;
  compact?: boolean;
}

export default function RetroInput({
  scope,
  scopeKey,
  initialContent,
  onSave,
  placeholder = '회고를 남겨보세요...',
  label,
  compact = false,
}: RetroInputProps) {
  const [value, setValue] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(initialContent);
  }, [initialContent, scopeKey]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed !== initialContent.trim()) {
      onSave(scope, scopeKey, trimmed);
    }
    setEditing(false);
  };

  // 내용이 있고 편집 중이 아닌 경우 — 표시 모드
  if (!editing && value.trim()) {
    return (
      <div className={compact ? '' : 'mt-2'}>
        {label && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen size={13} strokeWidth={1.8} className="text-[var(--muted-foreground)]" />
            <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{label}</span>
          </div>
        )}
        <button
          onClick={() => setEditing(true)}
          className="w-full text-left px-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] hover:border-[var(--foreground)]/20 transition-colors"
        >
          <p className="text-[13px] text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{value}</p>
        </button>
      </div>
    );
  }

  // 편집 모드 or 빈 상태
  return (
    <div className={compact ? '' : 'mt-2'}>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <BookOpen size={13} strokeWidth={1.8} className="text-[var(--muted-foreground)]" />
          <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{label}</span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onFocus={() => setEditing(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setValue(initialContent);
              setEditing(false);
            }
          }}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="w-full px-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] resize-none leading-relaxed transition-colors"
        />
        {editing && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setValue(initialContent); setEditing(false); }}
              className="px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity"
            >
              저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
