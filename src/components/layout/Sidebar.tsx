'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Plus, Download, Upload, Trash2, Settings, X, ShieldCheck, Archive, ArchiveRestore, Search } from 'lucide-react';
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

const FILTERS = [
  { id: null, label: '오늘' },
  { id: '__calendar__', label: '캘린더' },
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
  const activeProjects = projects.filter((p) => !p.archived);
  const archivedProjects = projects.filter((p) => p.archived);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  return (
    <aside
      className={[
        'w-60 flex-shrink-0 flex flex-col h-screen sticky top-0',
        'bg-[var(--card)] border-r border-[var(--border)]',
        className,
      ].join(' ')}
    >
      {/* 로고 */}
      <div className="h-14 flex items-center px-5 border-b border-[var(--border)]">
        <svg viewBox="5 8 95 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 flex-shrink-0" style={{ width: 'auto' }}>
          <path d="M12.6545 35L18.7985 25.752C18.3078 26.1573 17.7745 26.4453 17.1985 26.616C16.6225 26.7867 16.0252 26.872 15.4065 26.872C13.8065 26.872 12.4305 26.552 11.2785 25.912C10.1265 25.2507 9.24117 24.3653 8.6225 23.256C8.02517 22.1467 7.7265 20.9413 7.7265 19.64C7.7265 18.3173 8.0465 17.0907 8.6865 15.96C9.3265 14.8293 10.2652 13.9227 11.5025 13.24C12.7398 12.5573 14.2332 12.216 15.9825 12.216C17.5825 12.216 19.0012 12.5253 20.2385 13.144C21.4972 13.7627 22.4785 14.6373 23.1825 15.768C23.9078 16.8773 24.2705 18.1787 24.2705 19.672C24.2705 20.5893 24.1425 21.4747 23.8865 22.328C23.6518 23.1813 23.2998 24.0347 22.8305 24.888C22.3825 25.72 21.8385 26.6053 21.1985 27.544L16.2065 35H12.6545ZM15.9505 24.248C16.9532 24.248 17.8492 24.056 18.6385 23.672C19.4492 23.2667 20.0785 22.7227 20.5265 22.04C20.9745 21.3573 21.1985 20.568 21.1985 19.672C21.1985 18.6907 20.9745 17.848 20.5265 17.144C20.0785 16.4187 19.4598 15.864 18.6705 15.48C17.8812 15.096 16.9852 14.904 15.9825 14.904C14.8305 14.904 13.8705 15.128 13.1025 15.576C12.3345 16.024 11.7478 16.6107 11.3425 17.336C10.9585 18.04 10.7665 18.7973 10.7665 19.608C10.7665 20.4187 10.9585 21.176 11.3425 21.88C11.7265 22.584 12.3025 23.16 13.0705 23.608C13.8385 24.0347 14.7985 24.248 15.9505 24.248Z" fill="#FF8585"/>
          <path d="M30.9099 12.6426L32.8787 11.8633H33.699V21.6387C33.9269 21.2467 34.2231 20.873 34.5877 20.5176C34.9614 20.1621 35.3624 19.8568 35.7908 19.6016C36.2283 19.3372 36.6795 19.1276 37.1443 18.9727C37.6183 18.8177 38.0694 18.7402 38.4978 18.7402C39.309 18.7402 40.0564 18.9043 40.74 19.2324C41.4236 19.5605 42.0115 20.0072 42.5037 20.5723C42.9959 21.1374 43.3787 21.7982 43.6521 22.5547C43.9347 23.3021 44.0759 24.1042 44.0759 24.9609C44.0759 26.1185 43.8709 27.2031 43.4607 28.2148C43.0597 29.2266 42.5037 30.1107 41.7927 30.8672C41.0909 31.6146 40.266 32.207 39.3181 32.6445C38.3702 33.082 37.3585 33.3008 36.283 33.3008C35.2439 33.3008 34.2641 33.1641 33.3435 32.8906C32.4321 32.6172 31.6209 32.2025 30.9099 31.6465V12.6426ZM33.699 30.7168C33.8722 30.8809 34.059 31.0495 34.2595 31.2227C34.4692 31.3958 34.7016 31.5553 34.9568 31.7012C35.212 31.8379 35.4946 31.9518 35.8045 32.043C36.1235 32.125 36.4789 32.166 36.8709 32.166C37.518 32.166 38.1059 32.0111 38.6345 31.7012C39.1632 31.3822 39.6144 30.9447 39.988 30.3887C40.3709 29.8236 40.6625 29.1582 40.863 28.3926C41.0727 27.6178 41.1775 26.7747 41.1775 25.8633C41.1775 25.1706 41.0681 24.5234 40.8494 23.9219C40.6397 23.3112 40.3481 22.7826 39.9744 22.3359C39.6098 21.8802 39.1769 21.5247 38.6755 21.2695C38.1834 21.0052 37.6547 20.873 37.0896 20.873C36.7706 20.873 36.4425 20.9186 36.1052 21.0098C35.7771 21.1009 35.4627 21.224 35.1619 21.3789C34.8611 21.5339 34.5831 21.7161 34.3279 21.9258C34.0727 22.1263 33.863 22.3451 33.699 22.582V30.7168ZM49.7235 33H46.9345V12.6562L48.9169 11.8633H49.7235V33ZM59.9785 33.3008C58.903 33.3008 57.9141 33.1139 57.0117 32.7402C56.1094 32.3665 55.3301 31.8607 54.6738 31.2227C54.0176 30.5755 53.5026 29.8236 53.1289 28.9668C52.7643 28.1009 52.582 27.1758 52.582 26.1914C52.582 25.1615 52.7643 24.1953 53.1289 23.293C53.5026 22.3815 54.0176 21.5885 54.6738 20.9141C55.3301 20.2396 56.1094 19.7109 57.0117 19.3281C57.9141 18.9362 58.903 18.7402 59.9785 18.7402C61.0449 18.7402 62.0247 18.918 62.918 19.2734C63.8203 19.6289 64.5996 20.1165 65.2559 20.7363C65.9121 21.3561 66.4225 22.0853 66.7871 22.9238C67.1608 23.7533 67.3477 24.6465 67.3477 25.6035C67.3477 26.6608 67.1608 27.6589 66.7871 28.5977C66.4225 29.5273 65.9121 30.3431 65.2559 31.0449C64.5996 31.7376 63.8203 32.2891 62.918 32.6992C62.0247 33.1003 61.0449 33.3008 59.9785 33.3008ZM60.5117 32.2754C61.0586 32.2754 61.5599 32.1341 62.0156 31.8516C62.4714 31.569 62.8633 31.1908 63.1914 30.7168C63.5195 30.2337 63.7747 29.6777 63.957 29.0488C64.1393 28.4199 64.2305 27.7546 64.2305 27.0527C64.2305 26.041 64.1439 25.0931 63.9707 24.209C63.7975 23.3249 63.515 22.5547 63.123 21.8984C62.7311 21.2422 62.2207 20.7272 61.5918 20.3535C60.9629 19.9707 60.1973 19.7793 59.2949 19.7793C58.8301 19.7793 58.3789 19.916 57.9414 20.1895C57.5039 20.4538 57.1165 20.8184 56.7793 21.2832C56.4512 21.748 56.1869 22.2949 55.9863 22.9238C55.7858 23.5436 55.6855 24.2044 55.6855 24.9062C55.6855 25.9271 55.7904 26.8841 56 27.7773C56.2188 28.6706 56.5332 29.4499 56.9434 30.1152C57.3626 30.7806 57.8685 31.3092 58.4609 31.7012C59.0625 32.084 59.7461 32.2754 60.5117 32.2754ZM79.3663 22.9375C79.2661 22.5729 79.1294 22.2038 78.9562 21.8301C78.783 21.4564 78.5597 21.1191 78.2863 20.8184C78.0219 20.5085 77.7075 20.2578 77.3429 20.0664C76.9783 19.875 76.5499 19.7793 76.0577 19.7793C75.4288 19.7793 74.8637 19.9069 74.3624 20.1621C73.8611 20.4173 73.4373 20.7637 73.0909 21.2012C72.7446 21.6387 72.4803 22.1491 72.298 22.7324C72.1157 23.3158 72.0245 23.9355 72.0245 24.5918C72.0245 25.485 72.1385 26.3327 72.3663 27.1348C72.6033 27.9277 72.9314 28.625 73.3507 29.2266C73.7791 29.8281 74.2895 30.3066 74.882 30.6621C75.4835 31.0085 76.1534 31.1816 76.8917 31.1816C77.5389 31.1816 78.0994 31.0814 78.5734 30.8809C79.0564 30.6712 79.4711 30.3932 79.8175 30.0469C80.173 29.7005 80.4783 29.2995 80.7335 28.8438C80.9887 28.3789 81.2166 27.8913 81.4171 27.3809L82.2511 27.7227C82.0141 28.5977 81.6951 29.3815 81.2941 30.0742C80.893 30.7669 80.4191 31.3548 79.8722 31.8379C79.3344 32.3118 78.7238 32.6764 78.0402 32.9316C77.3657 33.1777 76.632 33.3008 75.839 33.3008C74.9184 33.3008 74.0571 33.123 73.255 32.7676C72.4529 32.403 71.7557 31.9062 71.1632 31.2773C70.5708 30.6484 70.1014 29.9147 69.755 29.0762C69.4086 28.2376 69.2355 27.3398 69.2355 26.3828C69.2355 25.681 69.3221 25.0065 69.4952 24.3594C69.6684 23.7031 69.9099 23.0924 70.2198 22.5273C70.5389 21.9622 70.9171 21.4473 71.3546 20.9824C71.8012 20.5176 72.2934 20.1211 72.8312 19.793C73.3689 19.4557 73.9432 19.196 74.5538 19.0137C75.1736 18.8314 75.8162 18.7402 76.4816 18.7402C77.0376 18.7402 77.5708 18.804 78.0812 18.9316C78.5916 19.0592 79.061 19.2415 79.4894 19.4785C79.9178 19.7064 80.296 19.9935 80.6241 20.3398C80.9523 20.6771 81.2075 21.0553 81.3898 21.4746L79.3663 22.9375ZM87.5979 24.6465L94.6252 19H96.4299L90.1545 24.0996L97.9065 33H94.2424L87.5979 25.3438V33H84.8088V12.6562L86.8049 11.8633H87.5979V24.6465Z" fill="currentColor"/>
        </svg>
        <span className="flex-1" />
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          >
            <Search size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* 내용 */}
      <nav className="flex-1 overflow-y-auto py-3 flex flex-col px-2">
        {/* 기본 필터 */}
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ opacity: 0.5 }}>
          뷰
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
            프로젝트
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
          미분류
        </button>

        {/* 프로젝트 추가 */}
        <button
          onClick={onCreateProject}
          className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 rounded-[var(--radius-sm)] text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Plus size={14} strokeWidth={1.8} />
          프로젝트 이름
        </button>

        {/* 보관함 */}
        {archivedProjects.length > 0 && (
          <>
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-1.5 mt-4 rounded-[var(--radius-sm)] text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
            >
              <Archive size={13} strokeWidth={1.8} />
              <span>보관함 ({archivedProjects.length})</span>
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
                        title="복원"
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
      <div className="p-3 border-t border-[var(--border)] flex flex-col gap-0">
        <button
          onClick={onLoginClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Avatar size="md" />
          <span className="truncate text-left">로그인 하세요</span>
        </button>

        {/* 구분선 — 반듯한 직선 */}
        <div className="mx-3 my-1 border-t border-[var(--border)]" />

        {/* 데이터 관리 */}
        <button
          onClick={() => setDataMenuOpen(!dataMenuOpen)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors duration-100"
        >
          <Settings size={14} strokeWidth={1.8} />
          <span>데이터 관리</span>
        </button>

        {/* 데이터 관리 패널 */}
        {dataMenuOpen && (
          <div className="mt-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] overflow-hidden">
            {/* 안내 문구 */}
            <div className="px-3 py-3 border-b border-[var(--border)] flex items-start gap-2">
              <ShieldCheck size={14} className="text-[var(--g-success)] flex-shrink-0 mt-0.5" />
              <p className="text-[14px] leading-snug text-[var(--muted-foreground)]">
                투두슬롯은 데이터를 서버에 저장하지 않아요. 모든 데이터는 이 브라우저에만 보관됩니다. 소중한 기록은 직접 백업해 주세요.
              </p>
            </div>

            {/* 액션 버튼들 */}
            <button
              onClick={() => { onExport?.(); setDataMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--fs-tag)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-100"
            >
              <Download size={13} strokeWidth={1.8} />
              <span>내보내기</span>
            </button>
            <button
              onClick={() => { onImport?.(); setDataMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--fs-tag)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors duration-100"
            >
              <Upload size={13} strokeWidth={1.8} />
              <span>가져오기</span>
            </button>
            <button
              onClick={() => { onResetData?.(); setDataMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[var(--fs-tag)] text-[var(--g-error)] hover:bg-[var(--g-error)]/10 transition-colors duration-100"
            >
              <Trash2 size={13} strokeWidth={1.8} />
              <span>삭제하기</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
