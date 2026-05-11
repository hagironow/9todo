'use client';

import { useRef, useCallback } from 'react';
import type { EnergyLevel } from '@/lib/types';
import { useLocale } from '@/i18n/context';

interface EnergyLevelInputProps {
  value?: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
  compact?: boolean;
  readOnly?: boolean;
}

const ENERGY_COLORS: Record<EnergyLevel, string> = {
  1: '#FF6B6B',
  2: '#FF6B6B',
  3: '#FFD43B',
  4: '#51CF66',
  5: '#51CF66',
};

const ENERGY_BG: Record<EnergyLevel, string> = {
  1: 'rgba(255, 107, 107, 0.15)',
  2: 'rgba(255, 107, 107, 0.15)',
  3: 'rgba(255, 212, 59, 0.15)',
  4: 'rgba(81, 207, 102, 0.15)',
  5: 'rgba(81, 207, 102, 0.15)',
};

export function getEnergyColor(level: number): string {
  if (level <= 2) return '#FF6B6B';
  if (level <= 3) return '#FFD43B';
  return '#51CF66';
}

export function getEnergyBg(level: number): string {
  if (level <= 2) return 'rgba(255, 107, 107, 0.15)';
  if (level <= 3) return 'rgba(255, 212, 59, 0.15)';
  return 'rgba(81, 207, 102, 0.15)';
}

/** X 좌표로부터 레벨(1~5) 계산 */
function getLevelFromX(containerEl: HTMLElement, clientX: number): EnergyLevel {
  const rect = containerEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const ratio = Math.max(0, Math.min(1, x / rect.width));
  return Math.max(1, Math.min(5, Math.ceil(ratio * 5))) as EnergyLevel;
}

export default function EnergyLevelInput({
  value,
  onChange,
  compact = false,
  readOnly = false,
}: EnergyLevelInputProps) {
  const { t } = useLocale();
  const levels: EnergyLevel[] = [1, 2, 3, 4, 5];
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly || !containerRef.current) return;
      draggingRef.current = true;
      containerRef.current.setPointerCapture(e.pointerId);
      onChange(getLevelFromX(containerRef.current, e.clientX));
    },
    [readOnly, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      onChange(getLevelFromX(containerRef.current, e.clientX));
    },
    [onChange],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const barH = compact ? 12 : 16;
  const barW = compact ? 5 : 7;
  const gap = compact ? 2 : 3;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="opacity-70">
          <path d="M13 2L8.5 9H11L7 14L9.5 9H7L9 2H13Z" fill="currentColor" />
        </svg>
        {!compact && t.energy}
      </span>
      <div
        ref={containerRef}
        className={[
          'flex items-center touch-none select-none',
          readOnly ? 'cursor-default' : 'cursor-pointer',
        ].join(' ')}
        style={{ gap: `${gap}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {levels.map((level) => {
          const isActive = value !== undefined && level <= value;
          const activeColor = value !== undefined ? ENERGY_COLORS[value] : ENERGY_COLORS[level];

          return (
            <div
              key={level}
              className="rounded-[2px] transition-colors duration-100"
              style={{
                width: `${barW}px`,
                height: `${barH}px`,
                backgroundColor: isActive ? activeColor : 'var(--border)',
              }}
            />
          );
        })}
      </div>
      {value && !compact && (
        <span
          className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            color: ENERGY_COLORS[value],
            backgroundColor: ENERGY_BG[value],
          }}
        >
          {t.energyLevels[value - 1]}
        </span>
      )}
    </div>
  );
}

/** 에너지 레벨 소형 뱃지 (캘린더용) */
export function EnergyBadge({ level, size = 'sm' }: { level: number; size?: 'sm' | 'xs' }) {
  const color = getEnergyColor(level);
  const bg = getEnergyBg(level);
  const barLevels: EnergyLevel[] = [1, 2, 3, 4, 5];
  const roundedLevel = Math.round(level);

  const barH = size === 'xs' ? 6 : 8;
  const barW = size === 'xs' ? 3 : 4;
  const gap = size === 'xs' ? 1.5 : 2;

  if (size === 'xs') {
    return (
      <div className="flex items-center" style={{ gap: `${gap}px` }} title={`에너지 ${level.toFixed(1)}`}>
        {barLevels.map((l) => (
          <div
            key={l}
            className="rounded-[1px]"
            style={{
              width: `${barW}px`,
              height: `${barH}px`,
              backgroundColor: l <= roundedLevel ? color : 'var(--border)',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: bg }}
      title={`에너지 ${level.toFixed(1)}`}
    >
      <div className="flex items-center" style={{ gap: `${gap}px` }}>
        {barLevels.map((l) => (
          <div
            key={l}
            className="rounded-[1px]"
            style={{
              width: `${barW}px`,
              height: `${barH}px`,
              backgroundColor: l <= roundedLevel ? color : 'var(--border)',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold" style={{ color }}>
        {level % 1 === 0 ? level : level.toFixed(1)}
      </span>
    </div>
  );
}
