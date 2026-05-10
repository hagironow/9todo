'use client';

import { ReactNode, ReactElement, useState, useEffect, useCallback, cloneElement, isValidElement } from 'react';
import { Timer } from 'lucide-react';
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
  rightPanelAccentColor?: string;
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
  rightPanelAccentColor,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNowFocusOpen, setMobileNowFocusOpen] = useState(false);
  const [timerCollapsed, setTimerCollapsed] = useState(false);
  const [timerManualOpen, setTimerManualOpen] = useState(false);

  // xl(1280px) 미만이면 자동 축소
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setTimerCollapsed(!e.matches);
      if (e.matches) setTimerManualOpen(false);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleTimerFabClick = useCallback(() => {
    setTimerManualOpen((v) => !v);
  }, []);

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

      {/* 플로팅 타이머 — 데스크탑 (xl 이상: 항상 표시 / lg~xl: FAB + 오버레이) */}
      {rightPanel && !timerCollapsed && (
        <div className="hidden lg:block fixed bottom-5 right-5 z-50 w-[360px] max-h-[calc(100vh-40px)] rounded-[40px] shadow-2xl overflow-hidden">
          {isValidElement(rightPanel)
            ? cloneElement(rightPanel as ReactElement<{ onClose?: () => void }>, { onClose: () => setTimerCollapsed(true) })
            : rightPanel}
        </div>
      )}

      {/* FAB — lg~xl 사이에서만 표시 */}
      {rightPanel && timerCollapsed && !timerManualOpen && (
        <button
          onClick={handleTimerFabClick}
          className="hidden lg:flex fixed bottom-5 right-5 z-50 w-14 h-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: rightPanelAccentColor || 'var(--accent)', color: 'white' }}
        >
          <Timer size={24} />
        </button>
      )}

      {/* FAB → 펼침 오버레이 */}
      {rightPanel && timerCollapsed && timerManualOpen && (
        <>
          <div
            className="hidden lg:block fixed inset-0 z-40"
            onClick={() => setTimerManualOpen(false)}
          />
          <div className="hidden lg:block fixed bottom-5 right-5 z-50 w-[360px] max-h-[calc(100vh-40px)] rounded-[40px] shadow-2xl overflow-hidden">
            {isValidElement(rightPanel)
              ? cloneElement(rightPanel as ReactElement<{ onClose?: () => void }>, { onClose: () => setTimerManualOpen(false) })
              : rightPanel}
          </div>
        </>
      )}

      {/* 모바일 NowFocus — 풀스크린 레이어 */}
      {rightPanel && (
        <div
          className={[
            'lg:hidden fixed inset-0 z-50 flex flex-col transition-transform duration-300',
            mobileNowFocusOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none',
          ].join(' ')}
        >
          <div className="flex-1 overflow-y-auto">
            {isValidElement(rightPanel)
              ? cloneElement(rightPanel as ReactElement<{ onClose?: () => void }>, { onClose: () => setMobileNowFocusOpen(false) })
              : rightPanel}
          </div>
        </div>
      )}
    </div>
  );
}
