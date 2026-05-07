'use client';

import { RotateCcw } from 'lucide-react';

export default function RepeatCountIcon({
  count,
  size = 18,
  className = '',
}: {
  count: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <RotateCcw size={size} strokeWidth={2} />
      {count > 0 && (
        <span style={{ fontSize: size * 0.65, fontWeight: 700, lineHeight: 1 }}>
          {Math.min(count, 9)}
        </span>
      )}
    </span>
  );
}
