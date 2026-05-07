'use client';

import { ReactNode, useState } from 'react';
import { X } from 'lucide-react';
import { Project } from '@/lib/types';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

interface AppShellProps {
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
  rightPanel?: ReactNode;
  children: ReactNode;
}

export default function AppShell({
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
  onLoginClick,
  onExport,
  onImport,
  onResetData,
  projectFirstMode,
  onProjectFirstModeChange,
  onSearchClick,
  rightPanel,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNowFocusOpen, setMobileNowFocusOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen bg-[var(--background)]">
      {/* 데스크탑 사이드바 */}
      <Sidebar
        projects={projects}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        onCreateProject={onCreateProject}
        onThemeToggle={onThemeToggle}
        isDark={isDark}
        onEditProject={onEditProject}
        onDeleteProject={onDeleteProject}
        onArchiveProject={onArchiveProject}
            onUnarchiveProject={onUnarchiveProject}
            onSearchClick={onSearchClick}
        onLoginClick={onLoginClick}
        onExport={onExport}
        onImport={onImport}
        onResetData={onResetData}
        projectFirstMode={projectFirstMode}
        onProjectFirstModeChange={onProjectFirstModeChange}
        className="hidden md:flex"
      />

      {/* 모바일 사이드바 드로어 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* 백드롭 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* 사이드바 패널 — 뷰포트 높이 보장 */}
          <div className="relative z-10 flex h-full">
            <Sidebar
              projects={projects}
              activeFilter={activeFilter}
              onFilterChange={(id) => {
                onFilterChange(id);
                setSidebarOpen(false);
              }}
              onCreateProject={() => {
                onCreateProject();
                setSidebarOpen(false);
              }}
              onThemeToggle={onThemeToggle}
              isDark={isDark}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
              onArchiveProject={onArchiveProject}
            onUnarchiveProject={onUnarchiveProject}
            onSearchClick={onSearchClick}
              onLoginClick={() => {
                onLoginClick?.();
                setSidebarOpen(false);
              }}
              onExport={() => {
                onExport?.();
                setSidebarOpen(false);
              }}
              onImport={() => {
                onImport?.();
                setSidebarOpen(false);
              }}
              onResetData={() => {
                onResetData?.();
                setSidebarOpen(false);
              }}
              projectFirstMode={projectFirstMode}
              onProjectFirstModeChange={onProjectFirstModeChange}
            />
          </div>
        </div>
      )}

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 모바일 헤더 */}
        <MobileHeader
          onMenuOpen={() => setSidebarOpen(true)}
          onTimerOpen={rightPanel ? () => setMobileNowFocusOpen(true) : undefined}
        />

        {/* 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 플로팅 타이머 — 데스크탑 */}
      {rightPanel && (
        <div className="hidden lg:block fixed bottom-5 right-5 z-50 w-[360px] max-h-[calc(100vh-40px)] rounded-[40px] shadow-2xl overflow-hidden">
          {rightPanel}
        </div>
      )}

      {/* 모바일 NowFocus — 풀스크린 레이어 (사이드바 드로어와 동일 패턴) */}
      {rightPanel && (
        <div
          className={[
            'lg:hidden fixed inset-0 z-50 flex flex-col bg-[var(--background)] transition-transform duration-300',
            mobileNowFocusOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none',
          ].join(' ')}
        >
          {/* 닫기 버튼 — 우상단 */}
          <div className="flex items-center justify-end px-4 py-2 flex-shrink-0">
            <button
              onClick={() => setMobileNowFocusOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightPanel}
          </div>
        </div>
      )}
    </div>
  );
}
