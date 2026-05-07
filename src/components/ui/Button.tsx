'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-[var(--radius)] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]';

  const variants: Record<string, string> = {
    primary:
      'bg-[var(--foreground)] hover:opacity-85 active:scale-[0.97]',
    ghost:
      'bg-transparent hover:bg-[var(--muted)] active:scale-[0.97]',
    danger:
      'bg-[var(--destructive)] text-white hover:opacity-90 active:scale-[0.97]',
  };

  const variantColors: Record<string, string> = {
    primary: 'var(--background)',
    ghost: 'var(--foreground)',
    danger: '#fff',
  };

  const sizes: Record<string, string> = {
    sm: 'h-7 px-3',
    md: 'h-9 px-4',
    lg: 'h-11 px-6',
  };

  const fontSizes: Record<string, string> = {
    sm: 'var(--fs-tag)',
    md: 'var(--fs-item)',
    lg: '16px',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ color: variantColors[variant], fontSize: fontSizes[size] }}
      {...props}
    >
      {children}
    </button>
  );
}
