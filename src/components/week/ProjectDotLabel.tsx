'use client';

import ColorDot from '@/components/ui/ColorDot';
import type { Project } from '@/lib/types';
import { useLocale } from '@/i18n/context';

/**
 * 프로젝트 색 도트. 평소엔 점만, 호버하면 이름이 옆으로 펼쳐진다.
 * (부모에 `group` 클래스가 있어야 한다)
 */
export default function ProjectDotLabel({ project }: { project: Project | null }) {
  const { t } = useLocale();
  const name = project?.name ?? t.uncategorized;

  return (
    <span className="inline-flex items-center flex-shrink-0 min-w-0">
      <ColorDot color={project?.color ?? '#8A8A8A'} size="sm" />
      <span
        className={[
          'overflow-hidden whitespace-nowrap text-[11px] font-medium',
          'max-w-0 opacity-0 group-hover:max-w-[88px] group-hover:opacity-100 group-hover:ml-1',
          'transition-all duration-150 ease-out',
        ].join(' ')}
        style={{ color: project?.color ?? 'var(--muted-foreground)' }}
      >
        {name}
      </span>
    </span>
  );
}
