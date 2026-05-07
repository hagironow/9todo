export interface ColorTheme {
  id: string;
  label: string;
  colors: string[];
  locked?: boolean;
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'vivid',
    label: '비비드',
    colors: [
      '#4F46E5', // Indigo
      '#8B5CF6', // Violet
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#FF66B2', // Hot Pink
      '#FF5C65', // Coral
      '#6B7280', // Gray
    ],
  },
  {
    id: 'pastel',
    label: '파스텔',
    colors: [
      '#9B97F2', // Indigo
      '#B5A3F7', // Violet
      '#7DD3B4', // Emerald
      '#F7CC7D', // Amber
      '#F7A0A0', // Red
      '#F7A0D0', // Hot Pink
      '#F7A8AB', // Coral
      '#A8B0BA', // Gray
    ],
  },
];

export const DEFAULT_THEME = 'vivid';
export const COLOR_COUNT = 8;

/** colorIndex + themeId → hex */
export function resolveColor(colorIndex: number, themeId: string): string {
  const theme = COLOR_THEMES.find((t) => t.id === themeId) ?? COLOR_THEMES[0];
  return theme.colors[colorIndex % theme.colors.length];
}

/** hex → 가장 가까운 colorIndex (마이그레이션용) */
export function hexToColorIndex(hex: string, themeId?: string): number {
  // 모든 테마에서 정확히 일치하는 색상 먼저 찾기
  for (const theme of COLOR_THEMES) {
    const idx = theme.colors.findIndex(
      (c) => c.toLowerCase() === hex.toLowerCase()
    );
    if (idx !== -1) return idx;
  }

  // 정확히 일치 없으면 색상 거리(RGB)로 가장 가까운 인덱스
  const target = hexToRgb(hex);
  if (!target) return 0;

  const ref = COLOR_THEMES.find((t) => t.id === (themeId ?? DEFAULT_THEME)) ?? COLOR_THEMES[0];
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < ref.colors.length; i++) {
    const c = hexToRgb(ref.colors[i]);
    if (!c) continue;
    const dist = (target.r - c.r) ** 2 + (target.g - c.g) ** 2 + (target.b - c.b) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
