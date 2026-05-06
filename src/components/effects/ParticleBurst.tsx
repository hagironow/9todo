'use client';

import confetti from 'canvas-confetti';

interface TriggerOptions {
  color?: string;
  origin?: { x: number; y: number };
}

/**
 * canvas-confetti 래퍼.
 * triggerConfetti(color, origin) 함수를 직접 사용하거나
 * 컴포넌트를 마운트하여 ref를 통해 호출할 수 있습니다.
 */
export function triggerConfetti({ color, origin }: TriggerOptions = {}) {
  confetti({
    particleCount: 80,
    spread: 60,
    startVelocity: 30,
    gravity: 1,
    origin: origin ?? { x: 0.5, y: 0.6 },
    colors: color
      ? [color, '#FFB0B5', '#FF5C65', '#ffffff']
      : ['#FF5C65', '#FFB0B5', '#ffffff', '#1A1A1A'],
    scalar: 0.9,
    ticks: 200,
  });
}

/**
 * 완료 버튼 클릭 위치에서 confetti를 터뜨리는 헬퍼.
 * element의 getBoundingClientRect를 사용하여 화면 좌표를 계산합니다.
 */
export function triggerConfettiFromElement(
  element: HTMLElement,
  color?: string
) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  triggerConfetti({ color, origin: { x, y } });
}

// 컴포넌트 형태 (필요 시 마운트 즉시 발동)
interface ParticleBurstProps {
  trigger?: boolean;
  color?: string;
  origin?: { x: number; y: number };
}

export default function ParticleBurst({
  trigger,
  color,
  origin,
}: ParticleBurstProps) {
  if (trigger) {
    triggerConfetti({ color, origin });
  }
  return null;
}
