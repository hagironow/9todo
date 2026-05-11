'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Download, Upload, Trash2, Settings, X, ShieldCheck, Archive, ArchiveRestore, Search } from 'lucide-react';
import { Project } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import Avatar from '@/components/ui/Avatar';
import { useLocale, type Locale } from '@/i18n/context';

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
  onUnarchiveProject?: (projectId: string) => void;
  onLoginClick?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onResetData?: () => void;
  projectFirstMode: boolean;
  onProjectFirstModeChange: (enabled: boolean) => void;
  onSearchClick?: () => void;
  className?: string;
}

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
  const { t } = useLocale();

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
        aria-label={t.projectMenu}
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-50 min-w-[120px] bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(project); }}
            className="w-full text-left px-3 py-1.5 text-[var(--fs-item)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {t.rename}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onArchive(project.id); }}
            className="w-full text-left px-3 py-1.5 text-[var(--fs-item)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {t.archive}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(project.id); }}
            className="w-full text-left px-3 py-1.5 text-[var(--fs-item)] text-[var(--g-error)] hover:bg-[var(--g-error)]/5 dark:hover:bg-[var(--g-error)]/10 transition-colors"
          >
            {t.delete}
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
  onUnarchiveProject,
  onSearchClick,
  onLoginClick,
  onExport,
  onImport,
  onResetData,
  projectFirstMode,
  onProjectFirstModeChange,
  className = '',
}: SidebarProps) {
  const { locale, setLocale, t } = useLocale();
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);

  const FILTERS = [
    { id: null, label: t.today },
    { id: '__calendar__', label: t.calendar },
    { id: '__retrospective__', label: t.retrospective },
  ] as const;
  return (
    <aside
      className={[
        'w-60 flex-shrink-0 flex flex-col h-screen max-h-dvh sticky top-0',
        'bg-[var(--card)] border-r border-[var(--border)]',
        className,
      ].join(' ')}
    >
      {/* 로고 */}
      <div className="h-14 flex items-center px-5 border-b border-[var(--border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/9todo.svg" alt="9todo" className="h-6 flex-shrink-0" style={{ width: 'auto' }} />
        <span className="flex-1" />
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
            aria-label={t.searchPlaceholder}
          >
            <Search size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* 내용 */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col px-2">
        {/* 기본 필터 */}
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ opacity: 0.5 }}>
          {t.views}
        </p>
        <div className="flex flex-col gap-0.5">
          {FILTERS.map((f) => (
            <button
              key={String(f.id)}
              onClick={() => onFilterChange(f.id as string | null)}
              className={[
                'w-full flex items-center px-3 rounded-[var(--radius-sm)] text-[13px] text-left transition-colors duration-100',
                activeFilter === f.id
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
              ].join(' ')}
              style={{ paddingTop: 8, paddingBottom: 8 }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 프로젝트 목록 */}
        <div className="px-3 pb-2 flex items-center justify-between" style={{ paddingTop: 40 }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ opacity: 0.5 }}>
            {t.projects}
          </p>
        </div>
        {activeProjects.map((project) => (
          <div
            key={project.id}
            className={[
              'group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] transition-colors duration-100',
              activeFilter === project.id
                ? 'bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
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

        {/* 미분류 */}
        <button
          onClick={() => onFilterChange('__unassigned__')}
          className={[
            'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] text-left transition-colors duration-100',
            activeFilter === '__unassigned__'
              ? 'bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
          ].join(' ')}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] inline-block flex-shrink-0" />
          {t.uncategorized}
        </button>

        {/* 프로젝트 추가 */}
        <button
          onClick={onCreateProject}
          className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 rounded-[var(--radius-sm)] text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Plus size={14} strokeWidth={1.8} />
          {t.projectName}
        </button>

        {/* 보관함 */}
        {archivedProjects.length > 0 && (
          <>
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-1.5 mt-4 rounded-[var(--radius-sm)] text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
            >
              <Archive size={13} strokeWidth={1.8} />
              <span>{t.archiveBox} ({archivedProjects.length})</span>
              <svg
                width="10" height="10" viewBox="0 0 10 10"
                className={`ml-auto transition-transform ${archiveOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--muted-foreground)' }}
              >
                <path d="M2 4 L5 7 L8 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {archiveOpen && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {archivedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] text-[var(--muted-foreground)]"
                  >
                    <ColorDot color={project.color} size="sm" />
                    <span className="truncate flex-1 opacity-50">{project.name}</span>
                    {onUnarchiveProject && (
                      <button
                        onClick={() => onUnarchiveProject(project.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t.restore}
                      >
                        <ArchiveRestore size={13} strokeWidth={1.8} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </nav>

      {/* 하단 */}
      <div className="p-3 border-t border-[var(--border)] flex flex-col gap-0 flex-shrink-0">
        <button
          onClick={onLoginClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Avatar size="md" />
          <span className="truncate text-left">{t.login}</span>
        </button>

        {/* 구분선 — 반듯한 직선 */}
        <div className="mx-3 my-1 border-t border-[var(--border)]" />

        {/* 데이터 관리 */}
        <button
          onClick={() => setDataMenuOpen(!dataMenuOpen)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Settings size={14} strokeWidth={1.8} />
          <span>{t.dataManagement}</span>
        </button>

        {/* 데이터 관리 패널 */}
        {dataMenuOpen && (
          <div className="mt-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] overflow-hidden">
            {/* 안내 문구 */}
            <div className="px-3 py-3 border-b border-[var(--border)] flex items-start gap-2">
              <ShieldCheck size={14} className="text-[var(--g-success)] flex-shrink-0 mt-0.5" />
              <p className="text-[14px] leading-snug text-[var(--muted-foreground)]">
                {t.dataDisclaimer}
              </p>
            </div>

            {/* 액션 버튼들 */}
            <button
              onClick={() => { onExport?.(); setDataMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--fs-tag)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-100"
            >
              <Download size={13} strokeWidth={1.8} />
              <span>{t.exportData}</span>
            </button>
            <button
              onClick={() => { onImport?.(); setDataMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--fs-tag)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-100"
            >
              <Upload size={13} strokeWidth={1.8} />
              <span>{t.importData}</span>
            </button>
            <button
              onClick={() => { onResetData?.(); setDataMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--fs-tag)] text-[var(--g-error)] hover:bg-[var(--g-error)]/10 transition-colors duration-100"
            >
              <Trash2 size={13} strokeWidth={1.8} />
              <span>{t.deleteData}</span>
            </button>
          </div>
        )}

        {/* Language switcher */}
        <div className="mx-3 my-1 border-t border-[var(--border)]" />
        <div className="flex items-center gap-1 px-3 py-1.5">
          <button
            onClick={() => setLocale('ko')}
            className={`px-2 py-1 text-[12px] rounded-[var(--radius-sm)] transition-colors ${locale === 'ko' ? 'font-semibold text-[var(--foreground)] bg-[var(--muted)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            한국어
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-2 py-1 text-[12px] rounded-[var(--radius-sm)] transition-colors ${locale === 'en' ? 'font-semibold text-[var(--foreground)] bg-[var(--muted)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
          >
            EN
          </button>
        </div>
      </div>
    </aside>
  );
}
