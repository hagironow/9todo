'use client';

interface ColorDotProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap: Record<string, string> = {
  sm: 'w-1.5 h-1.5',   // 6px
  md: 'w-2 h-2',        // 8px
  lg: 'w-3 h-3',        // 12px
};

export default function ColorDot({ color, size = 'md', className = '' }: ColorDotProps) {
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${sizeMap[size]} ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}
