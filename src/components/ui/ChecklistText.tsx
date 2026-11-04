'use client';

import { Check } from 'lucide-react';
import { parseTitle, toggleCheck } from '@/lib/checklist';

interface ChecklistTextProps {
  title: string;
  /** 없으면 체크박스는 보기 전용 */
  onToggle?: (nextTitle: string) => void;
}

/** 체크박스 줄(`- [ ] ...`)이 섞인 제목을 렌더 — 일반 줄은 그대로 보여준다 */
export default function ChecklistText({ title, onToggle }: ChecklistTextProps) {
  const lines = parseTitle(title);

  return (
    <span className="flex flex-col gap-1">
      {lines.map((line, i) =>
        line.kind === 'text' ? (
          <span key={i} className="whitespace-pre-wrap break-words">{line.text || ' '}</span>
        ) : (
          <span key={i} className="flex items-start gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={line.checked}
              disabled={!onToggle}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.(toggleCheck(title, line.index));
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              className={[
                'flex-shrink-0 mt-[0.2em] w-[1em] h-[1em] rounded-[4px] border-[1.5px]',
                'flex items-center justify-center transition-colors',
                line.checked
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'border-[var(--muted-foreground)] hover:border-[var(--foreground)]',
                onToggle ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
              style={{ pointerEvents: 'auto' }}
            >
              {line.checked && <Check size={11} strokeWidth={3} />}
            </button>
            <span
              className={[
                'min-w-0 whitespace-pre-wrap break-words',
                line.checked ? 'line-through text-[var(--muted-foreground)]' : '',
              ].join(' ')}
            >
              {line.text}
            </span>
          </span>
        ),
      )}
    </span>
  );
}
