'use client';

import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between h-12 px-4 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-30">
      <button
        onClick={onMenuOpen}
        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        aria-label="메뉴 열기"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      <span className="font-heading font-bold text-base tracking-tight text-[var(--accent)]">
        todoslot
      </span>

      {/* 오른쪽 공간 균형 맞추기 */}
      <div className="w-8" aria-hidden="true" />
    </header>
  );
}
