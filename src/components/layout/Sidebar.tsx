'use client';

import { useState, useRef, useEffect } from 'react';
import { LayoutGrid, CalendarClock, Repeat, MoreHorizontal, Plus, Download } from 'lucide-react';
import { Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Avatar from '@/components/ui/Avatar';

interface SidebarProps {
  projects: Project[];
  activeFilter: string | null;
  onFilterChange: (projectId: string | null) => void;
  onCreateProject: () => void;
  onThemeToggle: () => void;
  isDark: boolean;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onArchiveProject?: (projectId: string) => void;
  onLoginClick?: () => void;
  onExport?: () => void;
  projectFirstMode: boolean;
  onProjectFirstModeChange: (enabled: boolean) => void;
  className?: string;
}

const FILTERS = [
  { id: null, label: '전체', Icon: LayoutGrid },
  { id: '__today__', label: '오늘 마감', Icon: CalendarClock },
  { id: '__routine__', label: '루틴', Icon: Repeat },
] as const;

function ProjectMenu({
  project,
  onEdit,
  onDelete,
  onArchive,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onArchive: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-100 w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0"
        aria-label="프로젝트 메뉴"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 min-w-[120px] bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(project); }}
            className="w-full text-left px-3 py-1.5 text-[var(--fs-item)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            이름 변경
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onArchive(project.id); }}
            className="w-full text-left px-3 py-1.5 text-[var(--fs-item)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            아카이브
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(project.id); }}
            className="w-full text-left px-3 py-1.5 text-[var(--fs-item)] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  projects,
  activeFilter,
  onFilterChange,
  onCreateProject,
  onThemeToggle,
  isDark,
  onEditProject,
  onDeleteProject,
  onArchiveProject,
  onLoginClick,
  onExport,
  projectFirstMode,
  onProjectFirstModeChange,
  className = '',
}: SidebarProps) {
  const activeProjects = projects.filter((p) => !p.archived);
  return (
    <aside
      className={[
        'w-60 flex-shrink-0 flex flex-col h-full min-h-screen',
        'bg-[var(--card)] border-r border-[var(--border)]',
        className,
      ].join(' ')}
    >
      {/* 로고 */}
      <div className="h-14 flex items-center px-5 border-b border-[var(--border)]">
        <span className="font-heading font-bold text-lg tracking-tight text-[var(--accent)]">
          todoslot
        </span>
      </div>

      {/* 내용 */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2">
        {/* 기본 필터 */}
        <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          뷰
        </p>
        {FILTERS.map((f) => (
          <button
            key={String(f.id)}
            onClick={() => onFilterChange(f.id as string | null)}
            className={[
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-[var(--fs-item)] text-left transition-colors duration-100',
              activeFilter === f.id
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
            ].join(' ')}
          >
            <f.Icon size={16} strokeWidth={1.8} />
            {f.label}
          </button>
        ))}

        {/* 프로젝트 목록 */}
        <div className="px-3 pt-4 pb-1 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            프로젝트
          </p>
          <button
            onClick={() => onProjectFirstModeChange(!projectFirstMode)}
            className="flex-shrink-0"
            style={{
              position: 'relative',
              width: 28,
              height: 16,
              borderRadius: 8,
              backgroundColor: projectFirstMode ? 'var(--accent)' : 'var(--border)',
              transition: 'background-color 0.2s',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label="프로젝트 우선 지정 모드"
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: projectFirstMode ? 14 : 2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>
        {activeProjects.length === 0 && (
          <p className="px-3 py-2 text-[var(--fs-tag)] text-[var(--muted-foreground)]">
            프로젝트를 추가하세요
          </p>
        )}
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className={[
              'group w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] text-[var(--fs-item)] transition-colors duration-100',
              activeFilter === project.id
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-semibold'
                : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
            ].join(' ')}
          >
            <button
              onClick={() => onFilterChange(project.id)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
            >
              <ColorDot color={project.color} size="sm" />
              <span className="truncate">{project.name}</span>
            </button>

            {(onEditProject || onDeleteProject || onArchiveProject) && (
              <ProjectMenu
                project={project}
                onEdit={onEditProject ?? (() => {})}
                onDelete={onDeleteProject ?? (() => {})}
                onArchive={onArchiveProject ?? (() => {})}
              />
            )}
          </div>
        ))}

        {/* 프로젝트 추가 */}
        <button
          onClick={onCreateProject}
          className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-[var(--radius)] text-[var(--fs-tag)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Plus size={14} strokeWidth={1.8} />
          프로젝트 이름
        </button>
      </nav>

      {/* 하단: 로그인 + 내보내기 */}
      <div className="p-3 border-t border-[var(--border)] flex flex-col gap-1">
        <button
          onClick={onLoginClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-[var(--fs-item)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Avatar size="md" />
          <span className="truncate text-left">로그인 하세요</span>
        </button>
        <button
          onClick={onExport}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius)] text-[var(--fs-tag)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Download size={14} strokeWidth={1.8} />
          <span>데이터 내보내기</span>
        </button>
      </div>
    </aside>
  );
}
