'use client';

import { ReactNode } from 'react';
import ColorDot from '@/components/ui/ColorDot';

interface BacklogGroupProps {
  projectName: string;
  projectColor: string;
  itemCount: number;
  children: ReactNode;
}

export default function BacklogGroup({
  projectName,
  projectColor,
  itemCount,
  children,
}: BacklogGroupProps) {
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      {/* 그룹 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
        <ColorDot color={projectColor} size="sm" />
        <span className="text-[var(--fs-tag)] font-semibold text-[var(--foreground)] truncate flex-1">
          {projectName}
        </span>
        <span className="text-[11px] text-[var(--muted-foreground)] font-medium">
          {itemCount}
        </span>
      </div>

      {/* 항목 목록 */}
      <div className="bg-[var(--card)]">
        {children}
      </div>
    </div>
  );
}
