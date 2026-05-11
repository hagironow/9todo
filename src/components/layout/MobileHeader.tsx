'use client';

import { Menu, Timer } from 'lucide-react';
import { useLocale } from '@/i18n/context';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onTimerOpen?: () => void;
}

export default function MobileHeader({ onMenuOpen, onTimerOpen }: MobileHeaderProps) {
  const { t } = useLocale();
  return (
    <header className="md:hidden flex items-center justify-between h-12 px-4 border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-30">
      <button
        onClick={onMenuOpen}
        className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        aria-label={t.openMenu}
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/9todo.svg" alt="9todo" className="h-6" style={{ width: 'auto' }} />

      {onTimerOpen ? (
        <button
          onClick={onTimerOpen}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          aria-label={t.openTimer}
        >
          <Timer size={18} strokeWidth={1.5} />
        </button>
      ) : (
        <div className="w-8" aria-hidden="true" />
      )}
    </header>
  );
}
