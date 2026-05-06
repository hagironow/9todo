'use client';

interface CheckAnimationProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * SVG 체크 애니메이션 — 원 + 체크 드로우 (400ms)
 */
export default function CheckAnimation({
  size = 40,
  color = 'var(--accent)',
  className = '',
}: CheckAnimationProps) {
  const r = (size / 2) * 0.9;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <style>{`
        @keyframes check-circle {
          from { stroke-dashoffset: ${circumference}; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes check-mark {
          from { stroke-dashoffset: 30; opacity: 0; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>

      {/* 원 드로우 */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          animation: 'check-circle 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0s forwards',
        }}
      />

      {/* 체크 마크 드로우 */}
      <path
        d={`M${cx * 0.55} ${cy} L${cx * 0.85} ${cy * 1.28} L${cx * 1.42} ${cy * 0.65}`}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="30"
        strokeDashoffset="30"
        style={{
          animation:
            'check-mark 0.18s cubic-bezier(0.4, 0, 0.2, 1) 0.22s forwards',
          opacity: 0,
        }}
      />
    </svg>
  );
}
