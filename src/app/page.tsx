'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  TimePeriod,
  Priority,
  SlotCoord,
  ScheduledItem,
  Task,
  RoutineInstance,
  Routine,
  GoalCompass as GoalCompassType,
  Project,
} from '@/lib/types';
import { useAppData } from '@/hooks/useAppData';
import { useCurrentPeriod } from '@/hooks/useCurrentPeriod';
// useNowFocus replaced by inline playItems memo
import { useDailyRollover } from '@/hooks/useDailyRollover';
import AppShell from '@/components/layout/AppShell';
import GoalCompass from '@/components/goal-compass/GoalCompass';
import GoalCompassAffirmation from '@/components/goal-compass/GoalCompassAffirmation';
import NowFocus from '@/components/now-focus/NowFocus';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import DateNav from '@/components/date-nav/DateNav';
import BacklogPanel from '@/components/backlog/BacklogPanel';
import SlotPickerModal from '@/components/modals/SlotPickerModal';
import ProjectCreateModal from '@/components/modals/ProjectCreateModal';
import ProjectSelectModal from '@/components/modals/ProjectSelectModal';
import LoginModal from '@/components/modals/LoginModal';
import CalendarModal from '@/components/modals/CalendarModal';
import ReadOnlyBanner from '@/components/date-nav/ReadOnlyBanner';
import { triggerConfetti } from '@/components/effects/ParticleBurst';
import { exportToMarkdown, downloadFile } from '@/lib/export';
import { calculateDailyXP, calculateTotalXP } from '@/lib/xp';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// PERIOD_LABELS removed — Play Section에서 시간대 레이블 불필요

// 프로젝트 이름 변경 모달 (인라인 구현 — 별도 컴포넌트 없이)
function ProjectRenameModal({
  project,
  onSave,
  onClose,
}: {
  project: Project;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(project.name);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-xl w-80 flex flex-col gap-4">
        <p className="font-semibold text-[var(--foreground)]">프로젝트 이름 변경</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { const t = value.trim(); if (t) onSave(t); }
            if (e.key === 'Escape') onClose();
          }}
          className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => { const t = value.trim(); if (t) onSave(t); }}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[var(--fs-item)] bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const {
    state,
    loading,
    addProject,
    removeProject,
    updateProject,
    addTask,
    completeTask,
    deferTask,
    continueTask,
    assignTaskSlot,
    removeTask,
    updateTaskTitle,
    completeRoutineInstance,
    deferRoutineInstance,
    continueRoutineInstance,
    assignRoutineInstanceSlot,
    removeRoutineInstance,
    setActiveProjectFilter,
    batchUpdate,
    archiveProject,
    setProjectFirstMode,
  } = useAppData();

  const currentPeriod = useCurrentPeriod();
  const [today, setToday] = useState<string>(getToday);

  const handlePrevDay = useCallback(() => {
    setToday((prev) => {
      const d = new Date(prev + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setToday((prev) => {
      const d = new Date(prev + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const handleGoToday = useCallback(() => {
    setToday(getToday());
  }, []);

  const isToday = today === getToday();
  const isPast = today < getToday();
  const isReadOnly = isPast;

  // Daily rollover
  useDailyRollover({ state, batchUpdate, today, loading });

  // Play Section — 현재 시간대의 모든 슬롯 아이템 (1~3순위)
  const playItems = useMemo(() => {
    const items: (ScheduledItem | null)[] = [null, null, null];
    const tasks = state.tasks.filter(
      (t) => t.slot?.period === currentPeriod && t.date === today && !t.completedAt
    );
    for (const t of tasks) {
      if (t.slot) items[t.slot.priority - 1] = t;
    }
    return items;
  }, [state.tasks, currentPeriod, today]);

  // Theme
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const handleThemeToggle = useCallback(() => {
    setIsDark((v) => {
      const next = !v;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  // Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [slotPickerOpen, setSlotPickerOpen] = useState(false);
  const [slotPickerTarget, setSlotPickerTarget] = useState<string | null>(null);
  const [slotPickerIsRoutine, setSlotPickerIsRoutine] = useState(false);

  // 프로젝트 이름 변경 모달
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);

  // 태스크 생성 후 프로젝트 선택 모달
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [projectSelectTargetId, setProjectSelectTargetId] = useState<string | null>(null);

  // 로그인 모달
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // 캘린더 모달
  const [calendarOpen, setCalendarOpen] = useState(false);

  // DnD
  const [activeItem, setActiveItem] = useState<ScheduledItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // Build slot map — 루틴 인스턴스 제외 (태스크만)
  const slots = useMemo(() => {
    const map: Record<TimePeriod, Record<Priority, ScheduledItem | null>> = {
      morning: { 1: null, 2: null, 3: null },
      afternoon: { 1: null, 2: null, 3: null },
      evening: { 1: null, 2: null, 3: null },
    };

    const todayTasks = state.tasks.filter(
      (t) => t.date === today && t.slot !== null && t.completedAt === null
    );

    for (const task of todayTasks) {
      if (task.slot) {
        map[task.slot.period][task.slot.priority] = task;
      }
    }

    return map;
  }, [state.tasks, today]);

  // 루틴 인스턴스 목록 (오늘 날짜)
  const routineItems = useMemo((): ScheduledItem[] => {
    return state.routineInstances
      .filter((ri) => ri.date === today)
      .map((ri) => {
        const routineDetails = state.routines.find((r) => r.id === ri.routineId);
        return { ...ri, routineDetails } as ScheduledItem;
      });
  }, [state.routineInstances, state.routines, today]);

  // 루틴 슬롯 맵 — 시간대별 × 우선순위별
  // 위치 결정: ri.slot이 있으면 그것, 없으면 routineDetails.defaultSlot
  const routineSlots = useMemo((): Record<TimePeriod, Record<Priority, ScheduledItem | null>> => {
    const map: Record<TimePeriod, Record<Priority, ScheduledItem | null>> = {
      morning:   { 1: null, 2: null, 3: null },
      afternoon: { 1: null, 2: null, 3: null },
      evening:   { 1: null, 2: null, 3: null },
    };
    for (const item of routineItems) {
      const ri = item as RoutineInstance & { routineDetails?: Routine };
      const coord = ri.slot ?? ri.routineDetails?.defaultSlot;
      if (!coord) continue;
      // 슬롯이 비어 있으면 배치 (먼저 온 루틴이 우선)
      if (!map[coord.period][coord.priority]) {
        map[coord.period][coord.priority] = item;
      }
    }
    return map;
  }, [routineItems]);

  // Backlog items (태스크만 — 슬롯 없거나 null, 미완료)
  const backlogItems = useMemo(() => {
    const tasks = state.tasks.filter(
      (t) => t.slot === null && t.completedAt === null && t.date === today
    );
    const instances = state.routineInstances.filter(
      (ri) => ri.slot === null && ri.completedAt === null && ri.date === today
    );
    return [...tasks, ...instances] as (Task | RoutineInstance)[];
  }, [state.tasks, state.routineInstances, today]);

  // XP 계산
  const dailyXP = useMemo(
    () => calculateDailyXP(state.tasks, state.routineInstances, today),
    [state.tasks, state.routineInstances, today]
  );

  const totalXP = useMemo(
    () => calculateTotalXP(state.tasks, state.routineInstances),
    [state.tasks, state.routineInstances]
  );

  // 캘린더 dot indicator — 데이터 있는 날짜들
  const datesWithData = useMemo(() => {
    const set = new Set<string>();
    for (const t of state.tasks) set.add(t.date);
    for (const ri of state.routineInstances) set.add(ri.date);
    return set;
  }, [state.tasks, state.routineInstances]);

  // Filter
  const filteredSlots = useMemo(() => {
    if (!state.activeProjectFilter) return slots;
    const filter = state.activeProjectFilter;
    const result: Record<TimePeriod, Record<Priority, ScheduledItem | null>> = {
      morning: { 1: null, 2: null, 3: null },
      afternoon: { 1: null, 2: null, 3: null },
      evening: { 1: null, 2: null, 3: null },
    };
    for (const period of ['morning', 'afternoon', 'evening'] as TimePeriod[]) {
      for (const p of [1, 2, 3] as Priority[]) {
        const item = slots[period][p];
        if (item && 'projectId' in item && item.projectId === filter) {
          result[period][p] = item;
        }
      }
    }
    return result;
  }, [slots, state.activeProjectFilter]);

  const filteredBacklog = useMemo(() => {
    if (!state.activeProjectFilter) return backlogItems;
    return backlogItems.filter(
      (item) => 'projectId' in item && item.projectId === state.activeProjectFilter
    );
  }, [backlogItems, state.activeProjectFilter]);

  const filteredRoutineSlots = useMemo((): Record<TimePeriod, Record<Priority, ScheduledItem | null>> => {
    if (!state.activeProjectFilter) return routineSlots;
    const filter = state.activeProjectFilter;
    const result: Record<TimePeriod, Record<Priority, ScheduledItem | null>> = {
      morning:   { 1: null, 2: null, 3: null },
      afternoon: { 1: null, 2: null, 3: null },
      evening:   { 1: null, 2: null, 3: null },
    };
    for (const period of ['morning', 'afternoon', 'evening'] as TimePeriod[]) {
      for (const p of [1, 2, 3] as Priority[]) {
        const item = routineSlots[period][p];
        if (item && 'projectId' in item && item.projectId === filter) {
          result[period][p] = item;
        }
      }
    }
    return result;
  }, [routineSlots, state.activeProjectFilter]);

  // Handlers
  const handleComplete = useCallback(
    (item: ScheduledItem) => {
      if ('type' in item && item.type === 'task') {
        completeTask(item.id);
      } else {
        completeRoutineInstance(item.id);
      }
      const color =
        'projectId' in item && item.projectId
          ? state.projects.find((p) => p.id === item.projectId)?.color
          : undefined;
      triggerConfetti({ color });
    },
    [completeTask, completeRoutineInstance, state.projects]
  );

  const handleDefer = useCallback(
    (item: ScheduledItem) => {
      if ('type' in item && item.type === 'task') {
        deferTask(item.id);
      } else {
        deferRoutineInstance(item.id);
      }
    },
    [deferTask, deferRoutineInstance]
  );

  const handleRepeat = useCallback(
    (item: ScheduledItem) => {
      if ('type' in item && item.type === 'task') {
        continueTask(item.id, today);
      } else {
        continueRoutineInstance(item.id);
      }
    },
    [continueTask, continueRoutineInstance, today]
  );

  const handleDelete = useCallback(
    (item: ScheduledItem) => {
      if ('type' in item && item.type === 'task') {
        removeTask(item.id);
      } else {
        removeRoutineInstance(item.id);
      }
    },
    [removeTask, removeRoutineInstance]
  );

  const handleUpdateTitle = useCallback(
    (item: ScheduledItem, title: string) => {
      if ('type' in item && item.type === 'task') {
        updateTaskTitle(item.id, title);
      }
      // 루틴 인스턴스는 제목 변경 미지원 (루틴 원본을 수정해야 함)
    },
    [updateTaskTitle]
  );

  const handleCreateInSlot = useCallback(
    (title: string, coord: SlotCoord, projectId?: string | null) => {
      if (projectId) {
        // 프로젝트가 이미 지정됨 — 모달 스킵
        addTask(title, today, { slot: coord, projectId });
      } else {
        // 프로젝트 미지정 — 모달로 선택
        const task = addTask(title, today, { slot: coord, projectId: null });
        setProjectSelectTargetId(task.id);
        setProjectSelectOpen(true);
      }
    },
    [addTask, today]
  );

  const handleProjectSelectDone = useCallback(
    (projectId: string) => {
      if (projectSelectTargetId) {
        batchUpdate((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === projectSelectTargetId ? { ...t, projectId } : t
          ),
          lastUsedProjectId: projectId,
        }));
      }
      setProjectSelectOpen(false);
      setProjectSelectTargetId(null);
    },
    [projectSelectTargetId, batchUpdate]
  );

  const handleProjectCreateAndSelect = useCallback(
    (name: string, color: string) => {
      const project = addProject(name, color);
      handleProjectSelectDone(project.id);
    },
    [addProject, handleProjectSelectDone]
  );

  const handleSlotClick = useCallback(
    (_period: TimePeriod, _priority: Priority) => {
      // no-op: 인라인 생성으로 대체됨
    },
    []
  );

  // DnD — 스왑 로직 포함
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over) return;

      const coord = over.data.current?.coord as SlotCoord | undefined;
      if (!coord) return;

      const itemId = String(active.id);
      const itemData = active.data.current;
      const isRoutineInstance = !!itemData?.isRoutineInstance;

      // 드래그된 아이템의 현재 슬롯을 data에서 직접 가져옴 (state 재탐색 불필요)
      const draggedItem = itemData?.item as ScheduledItem | undefined;
      const draggedCurrentSlot: SlotCoord | null =
        draggedItem && 'slot' in draggedItem ? (draggedItem.slot as SlotCoord | null) : null;

      const targetItem = slots[coord.period][coord.priority];

      if (!targetItem) {
        // 빈 슬롯 — 단순 배정
        if (isRoutineInstance) {
          assignRoutineInstanceSlot(itemId, coord);
        } else {
          assignTaskSlot(itemId, coord);
        }
      } else if (targetItem.id !== itemId) {
        // 채워진 슬롯 — 두 아이템 슬롯 교환 (스왑)
        const targetIsRoutine =
          'routineDetails' in targetItem && targetItem.routineDetails !== undefined
            ? true
            : 'type' in targetItem
            ? targetItem.type !== 'task'
            : false;

        // targetItem을 드래그된 아이템의 이전 슬롯으로 이동
        if (targetIsRoutine) {
          if (draggedCurrentSlot) {
            assignRoutineInstanceSlot(targetItem.id, draggedCurrentSlot);
          } else {
            // 백로그에서 왔으면 타겟 루틴을 백로그로
            deferRoutineInstance(targetItem.id);
          }
        } else {
          if (draggedCurrentSlot) {
            assignTaskSlot(targetItem.id, draggedCurrentSlot);
          } else {
            // 백로그에서 왔으면 타겟 태스크를 백로그로
            deferTask(targetItem.id);
          }
        }

        // 드래그된 아이템을 타겟 슬롯으로 이동
        if (isRoutineInstance) {
          assignRoutineInstanceSlot(itemId, coord);
        } else {
          assignTaskSlot(itemId, coord);
        }
      }
    },
    [slots, assignTaskSlot, assignRoutineInstanceSlot, deferTask, deferRoutineInstance]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = event.active.data.current?.item as ScheduledItem | undefined;
    if (item) setActiveItem(item);
  }, []);

  const handlePlaceInSlot = useCallback(
    (item: Task | RoutineInstance) => {
      setSlotPickerTarget(item.id);
      setSlotPickerIsRoutine(!('type' in item) || item.type !== 'task');
      setSlotPickerOpen(true);
    },
    []
  );

  const handleSlotPick = useCallback(
    (coord: SlotCoord) => {
      if (!slotPickerTarget) return;
      if (slotPickerIsRoutine) {
        assignRoutineInstanceSlot(slotPickerTarget, coord);
      } else {
        assignTaskSlot(slotPickerTarget, coord);
      }
      setSlotPickerOpen(false);
      setSlotPickerTarget(null);
    },
    [slotPickerTarget, slotPickerIsRoutine, assignTaskSlot, assignRoutineInstanceSlot]
  );

  // 프로젝트 편집/삭제/아카이브
  const handleEditProject = useCallback((project: Project) => {
    setRenamingProject(project);
  }, []);

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      removeProject(projectId);
    },
    [removeProject]
  );

  const handleArchiveProject = useCallback(
    (projectId: string) => {
      archiveProject(projectId);
    },
    [archiveProject]
  );

  // 프로젝트 우선 모드 (persisted state 사용)

  const handleRenameProjectSave = useCallback(
    (name: string) => {
      if (renamingProject) {
        updateProject(renamingProject.id, { name });
      }
      setRenamingProject(null);
    },
    [renamingProject, updateProject]
  );

  // Goal Compass handlers
  const handleSaveIdentity = useCallback(
    (value: string) => {
      batchUpdate((prev) => ({
        ...prev,
        goalCompass: { ...prev.goalCompass, identity: value },
      }));
    },
    [batchUpdate]
  );

  const handleSaveGoal = useCallback(
    (key: keyof GoalCompassType['goals'], value: string) => {
      batchUpdate((prev) => ({
        ...prev,
        goalCompass: {
          ...prev.goalCompass,
          goals: { ...prev.goalCompass.goals, [key]: value },
        },
      }));
    },
    [batchUpdate]
  );

  const handleSaveAffirmation = useCallback(
    (value: string) => {
      batchUpdate((prev) => ({
        ...prev,
        goalCompass: { ...prev.goalCompass, affirmation: value },
      }));
    },
    [batchUpdate]
  );

  // Title helper for backlog
  const getTitleForItem = useCallback(
    (item: Task | RoutineInstance) => {
      if ('title' in item) return item.title;
      const routine = state.routines.find((r) => r.id === (item as RoutineInstance).routineId);
      return routine?.title ?? '';
    },
    [state.routines]
  );

  const isRoutineInstanceFn = useCallback(
    (item: Task | RoutineInstance) => {
      return !('type' in item) || item.type !== 'task';
    },
    []
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AppShell
        projects={state.projects}
        activeFilter={state.activeProjectFilter}
        onFilterChange={setActiveProjectFilter}
        onCreateProject={() => setProjectModalOpen(true)}
        onThemeToggle={handleThemeToggle}
        isDark={isDark}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onArchiveProject={handleArchiveProject}
        onLoginClick={() => setLoginModalOpen(true)}
        onExport={() => {
          const md = exportToMarkdown(state);
          const todayStr = new Date().toISOString().split('T')[0];
          downloadFile(md, `todoslot_${todayStr}.md`, 'text/markdown');
        }}
        projectFirstMode={state.projectFirstMode}
        onProjectFirstModeChange={setProjectFirstMode}
      >
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
          {/* Goal Compass */}
          <GoalCompass
            data={state.goalCompass}
            onSaveIdentity={handleSaveIdentity}
            onSaveGoal={handleSaveGoal}
            onSaveAffirmation={handleSaveAffirmation}
            totalXP={totalXP}
          />

          {/* 날짜 네비게이션 */}
          <DateNav
            date={today}
            isToday={isToday}
            onPrev={handlePrevDay}
            onNext={handleNextDay}
            onToday={handleGoToday}
            onOpenCalendar={() => setCalendarOpen(true)}
            xp={dailyXP}
          />

          {/* 읽기 전용 배너 (과거 날짜) */}
          {isReadOnly && (
            <ReadOnlyBanner date={today} onGoToday={handleGoToday} />
          )}

          {/* Play Section */}
          <NowFocus
            items={playItems}
            projects={state.projects}
            onComplete={handleComplete}
            onDefer={handleDefer}
            onRepeat={handleRepeat}
            isReadOnly={isReadOnly}
          />

          {/* Timetable Grid */}
          <TimetableGrid
            currentPeriod={currentPeriod}
            slots={filteredSlots}
            routineSlots={filteredRoutineSlots}
            onComplete={handleComplete}
            onDefer={handleDefer}
            onRepeat={handleRepeat}
            onSlotClick={handleSlotClick}
            onDelete={handleDelete}
            onUpdateTitle={handleUpdateTitle}
            onCreateInSlot={handleCreateInSlot}
            projectFirstMode={state.projectFirstMode}
            projects={state.projects}
            isReadOnly={isReadOnly}
          />

          {/* Backlog */}
          <BacklogPanel
            items={filteredBacklog}
            projects={state.projects}
            getTitleForItem={getTitleForItem}
            isRoutineInstance={isRoutineInstanceFn}
            onPlaceInSlot={handlePlaceInSlot}
            isReadOnly={isReadOnly}
          />

        </div>
      </AppShell>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="px-3 py-2 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--accent)] shadow-lg text-sm font-medium text-[var(--foreground)] max-w-[180px] truncate">
            {'title' in activeItem ? activeItem.title : ''}
          </div>
        )}
      </DragOverlay>

      {/* Modals */}
      <SlotPickerModal
        open={slotPickerOpen}
        onClose={() => setSlotPickerOpen(false)}
        slots={slots}
        onSelect={handleSlotPick}
      />

      <ProjectCreateModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={({ name, color }) => addProject(name, color)}
      />

      <ProjectSelectModal
        open={projectSelectOpen}
        onClose={() => { setProjectSelectOpen(false); setProjectSelectTargetId(null); }}
        projects={state.projects}
        onSelect={handleProjectSelectDone}
        onCreateAndSelect={handleProjectCreateAndSelect}
        onSkip={() => { setProjectSelectOpen(false); setProjectSelectTargetId(null); }}
      />

      {renamingProject && (
        <ProjectRenameModal
          project={renamingProject}
          onSave={handleRenameProjectSave}
          onClose={() => setRenamingProject(null)}
        />
      )}

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <CalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        currentDate={today}
        todayDate={getToday()}
        datesWithData={datesWithData}
        onSelectDate={(date) => setToday(date)}
        onGoToday={handleGoToday}
      />
    </DndContext>
  );
}
