'use client';

import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
} as const;

const ICON_SIZES = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;

function getInitial(name?: string) {
  if (!name) return null;
  return name.charAt(0).toUpperCase();
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = SIZES[size];
  const iconSize = ICON_SIZES[size];
  const initial = getInitial(name);

  return (
    <div
      className={[
        sizeClass,
        'rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden',
        'bg-[var(--muted)] text-[var(--muted-foreground)]',
        className,
      ].join(' ')}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : initial ? (
        <span className="text-xs font-semibold">{initial}</span>
      ) : (
        <User size={iconSize} strokeWidth={1.5} />
      )}
    </div>
  );
}
