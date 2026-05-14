'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocale } from '@/i18n/context';
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
  GoalCompass as GoalCompassType,
  Project,
} from '@/lib/types';
import { UNCATEGORIZED_ID } from '@/lib/types';
import { useAppData } from '@/hooks/useAppData';
import { useCurrentPeriod } from '@/hooks/useCurrentPeriod';
// useNowFocus replaced by inline playItems memo
import { useDailyRollover } from '@/hooks/useDailyRollover';
import AppShell from '@/components/layout/AppShell';
import GoalCompass from '@/components/goal-compass/GoalCompass';
import NowFocus, { getActiveTimerItemId } from '@/components/now-focus/NowFocus';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import MobileTimetableList from '@/components/timetable/MobileTimetableList';
import DateNav from '@/components/date-nav/DateNav';
import BacklogPanel from '@/components/backlog/BacklogPanel';
import SlotPickerModal from '@/components/modals/SlotPickerModal';
import ProjectCreateModal from '@/components/modals/ProjectCreateModal';
import ProjectSelectModal from '@/components/modals/ProjectSelectModal';
import LoginModal from '@/components/modals/LoginModal';
import CalendarModal from '@/components/modals/CalendarModal';
import RecurrenceSetupModal from '@/components/modals/RecurrenceSetupModal';
import type { RecurrenceSetupData } from '@/components/modals/RecurrenceSetupModal';
import { timeToPeriod } from '@/components/modals/RecurrenceSetupModal';
import CalendarView from '@/components/calendar/CalendarView';
import DailyRetro from '@/components/retrospective/DailyRetro';
import RetrospectiveListView from '@/components/retrospective/RetrospectiveListView';
import ReadOnlyBanner from '@/components/date-nav/ReadOnlyBanner';
import { triggerConfetti } from '@/components/effects/ParticleBurst';
import { exportToJSON, downloadFile } from '@/lib/export';
import { trackEvent, trackExport, trackSearch, trackLoginClick } from '@/lib/analytics';
import { calculateDailyXP, calculateTotalXP } from '@/lib/xp';
import { getToday, formatLocalDate, getWeekKey, getMonthKey } from '@/lib/date';
import { shouldCreateRecurringInstance, createRecurringInstance } from '@/lib/recurrence';
import StorageConsentBanner from '@/components/modals/StorageConsentBanner';
import ProjectDetailView from '@/components/project-detail/ProjectDetailView';
import SearchView from '@/components/search/SearchView';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { importStateFromJSON, EMPTY_STATE } from '@/hooks/useAppData';
// import MarketingInjector from '@/components/dev/MarketingInjector';

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
  const { t } = useLocale();
  const [value, setValue] = useState(project.name);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-xl w-80 flex flex-col gap-4">
        <p className="font-semibold text-[var(--foreground)]">{t.projectRename}</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { const trimmed = value.trim(); if (trimmed) onSave(trimmed); }
            if (e.key === 'Escape') onClose();
          }}
          className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t.cancel}</Button>
          <Button variant="primary" size="sm" onClick={() => { const trimmed = value.trim(); if (trimmed) onSave(trimmed); }} disabled={!value.trim()}>{t.save}</Button>
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
    uncompleteTask,
    deferTask,
    continueTask,
    assignTaskSlot,
    removeTask,
    removeTaskWithRecurrence,
    updateTaskTitle,
    updateTaskTitleWithRecurrence,
    setActiveProjectFilter,
    setColorTheme,
    batchUpdate,
    archiveProject,
    setProjectFirstMode,
    addNote,
    removeNote,
    updateNoteContent,
    completeGoal,
    addGoalTask,
    completeGoalTask,
    uncompleteGoalTask,
    updateGoalTaskTitle,
    removeGoalTask,
    upsertRetrospective,
    removeRetrospective,
  } = useAppData();

  const { t } = useLocale();
  const currentPeriod = useCurrentPeriod();
  const [today, setToday] = useState<string>(getToday);
  const [searchOpen, setSearchOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importErrorOpen, setImportErrorOpen] = useState(false);

  const handlePrevDay = useCallback(() => {
    setToday((prev) => {
      const [y, m, d] = prev.split('-').map(Number);
      const date = new Date(y, m - 1, d - 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setToday((prev) => {
      const [y, m, d] = prev.split('-').map(Number);
      const date = new Date(y, m - 1, d + 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
  }, []);

  const handleGoToday = useCallback(() => {
    setToday(getToday());
  }, []);

  const isToday = today === getToday();
  const isPast = today < getToday();
  const isReadOnly = false; // 과거 데이터도 수정 가능

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

    // 타이머가 활성인 태스크가 다른 시간대에 있으면 1순위로 고정
    const activeTimerId = getActiveTimerItemId();
    if (activeTimerId) {
      const alreadyShown = items.some((it) => it && it.id === activeTimerId);
      if (!alreadyShown) {
        const timerTask = state.tasks.find(
          (t) => t.id === activeTimerId && t.date === today && !t.completedAt && t.slot
        );
        if (timerTask) {
          // 빈 슬롯에 넣거나, 없으면 1순위에 고정
          const emptyIdx = items.indexOf(null);
          if (emptyIdx !== -1) {
            items[emptyIdx] = timerTask;
          } else {
            items[0] = timerTask;
          }
        }
      }
    }

    return items;
  }, [state.tasks, currentPeriod, today]);

  // GoalTask 기간 키 계산
  const currentPeriodKeys = useMemo(() => ({
    today: today,
    week: getWeekKey(today),
    month: getMonthKey(today),
  }), [today]);

  // Theme
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    if (!localStorage.getItem('9todo_first_use')) {
      localStorage.setItem('9todo_first_use', new Date().toISOString());
    }
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
  const [slotPickerIsRepeat, setSlotPickerIsRepeat] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledItem | null>(null);
  const [recurrenceEditTarget, setRecurrenceEditTarget] = useState<{ item: ScheduledItem; title: string } | null>(null);

  // 프로젝트 이름 변경 모달
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  // 태스크 생성 후 프로젝트 선택 모달
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [projectSelectTargetId, setProjectSelectTargetId] = useState<string | null>(null);

  // 로그인 모달
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // 캘린더 모달
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState<'week' | 'month'>('week');

  // 반복 투두 생성 모달
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [routineModalTitle, setRoutineModalTitle] = useState('');
  const [routineModalCoord, setRoutineModalCoord] = useState<SlotCoord | null>(null);
  const [editingRecurrenceTask, setEditingRecurrenceTask] = useState<Task | null>(null);

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
      (t) => t.date === today && t.slot !== null
    );

    for (const task of todayTasks) {
      if (task.slot) {
        map[task.slot.period][task.slot.priority] = task;
      }
    }

    return map;
  }, [state.tasks, today]);


  // Backlog items (태스크만 — 슬롯 없거나 null, 미완료, 날짜 무관, 반복 부모/인스턴스 제외)
  const backlogItems = useMemo(() => {
    return state.tasks.filter(
      (t) => t.slot === null && t.completedAt === null && !t.recurrence && !t.recurrenceParentId
    );
  }, [state.tasks]);

  // XP 계산
  const dailyXP = useMemo(
    () => calculateDailyXP(state.tasks, [], today, state.goalCompletedDates, state.goalTasks),
    [state.tasks, today, state.goalCompletedDates, state.goalTasks]
  );

  const totalXP = useMemo(
    () => calculateTotalXP(state.tasks, [], state.goalCompletedDates, state.goalTasks),
    [state.tasks, state.goalCompletedDates, state.goalTasks]
  );

  // 캘린더 dot indicator — 데이터 있는 날짜들
  const datesWithData = useMemo(() => {
    const set = new Set<string>();
    for (const t of state.tasks) if (t.date) set.add(t.date);
    return set;
  }, [state.tasks]);

  // Filter
  const filteredSlots = useMemo(() => {
    if (!state.activeProjectFilter) return slots;
    const filter = state.activeProjectFilter;
    const isUnassigned = filter === '__unassigned__';
    const result: Record<TimePeriod, Record<Priority, ScheduledItem | null>> = {
      morning: { 1: null, 2: null, 3: null },
      afternoon: { 1: null, 2: null, 3: null },
      evening: { 1: null, 2: null, 3: null },
    };
    for (const period of ['morning', 'afternoon', 'evening'] as TimePeriod[]) {
      for (const p of [1, 2, 3] as Priority[]) {
        const item = slots[period][p];
        if (!item) continue;
        const pid = 'projectId' in item ? item.projectId : null;
        if (isUnassigned ? !pid : pid === filter) {
          result[period][p] = item;
        }
      }
    }
    return result;
  }, [slots, state.activeProjectFilter]);

  const filteredBacklog = useMemo(() => {
    if (!state.activeProjectFilter) return backlogItems;
    const filter = state.activeProjectFilter;
    const isUnassigned = filter === '__unassigned__';
    return backlogItems.filter((item) => {
      const pid = 'projectId' in item ? item.projectId : null;
      return isUnassigned ? !pid : pid === filter;
    });
  }, [backlogItems, state.activeProjectFilter]);


  // Handlers
  const handleComplete = useCallback(
    (item: ScheduledItem, timerSeconds?: number) => {
      completeTask(item.id, timerSeconds);
      const color = item.projectId
        ? state.projects.find((p) => p.id === item.projectId)?.color
        : undefined;
      triggerConfetti({ color });
    },
    [completeTask, state.projects]
  );

  const handleUncomplete = useCallback(
    (item: ScheduledItem) => {
      uncompleteTask(item.id);
    },
    [uncompleteTask]
  );

  const [deferTarget, setDeferTarget] = useState<ScheduledItem | null>(null);

  const handleDefer = useCallback(
    (item: ScheduledItem) => {
      setDeferTarget(item);
    },
    []
  );

  const handleSendToBacklog = useCallback(
    (item: ScheduledItem) => {
      batchUpdate((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === item.id ? { ...t, slot: null, date: null } : t,
        ),
      }));
    },
    [batchUpdate]
  );

  const handleRepeat = useCallback(
    (item: ScheduledItem) => {
      setSlotPickerTarget(item.id);
      setSlotPickerIsRepeat(true);
      setSlotPickerOpen(true);
    },
    []
  );

  const handleDelete = useCallback(
    (item: ScheduledItem) => {
      setDeleteTarget(item);
    },
    []
  );

  const handleUpdateTitle = useCallback(
    (item: ScheduledItem, title: string) => {
      if (item.recurrenceParentId || item.recurrence) {
        setRecurrenceEditTarget({ item, title });
      } else {
        updateTaskTitle(item.id, title);
      }
    },
    [updateTaskTitle]
  );

  const handleUpdateProject = useCallback(
    (item: ScheduledItem, projectId: string | null) => {
      if ('type' in item && item.type === 'task') {
        batchUpdate((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === item.id ? { ...t, projectId } : t
          ),
        }));
      }
    },
    [batchUpdate]
  );

  const handleCreateInSlot = useCallback(
    (title: string, coord: SlotCoord, projectId?: string | null) => {
      // 슬롯에 이미 태스크가 있으면 생성 불가 (필터로 숨겨진 태스크 포함)
      const existing = slots[coord.period][coord.priority];
      if (existing) return;
      // 프로젝트 필터가 켜져 있으면 자동으로 해당 프로젝트 할당 (__unassigned__는 null 취급)
      const activeFilter = state.activeProjectFilter === '__unassigned__' ? null : state.activeProjectFilter;
      const resolvedProjectId = projectId ?? activeFilter ?? null;
      if (resolvedProjectId) {
        addTask(title, today, { slot: coord, projectId: resolvedProjectId });
      } else {
        const task = addTask(title, today, { slot: coord, projectId: null });
        setProjectSelectTargetId(task.id);
        setProjectSelectOpen(true);
      }
    },
    [addTask, today, state.activeProjectFilter, slots]
  );

  // 반복 투두 생성 — 슬롯에서 제목 입력 후 RecurrenceSetupModal 열기
  const handleCreateRoutine = useCallback(
    (title: string, coord: SlotCoord) => {
      setEditingRecurrenceTask(null);
      setRoutineModalTitle(title);
      setRoutineModalCoord(coord);
      setRoutineModalOpen(true);
    },
    []
  );

  // 반복 투두 편집 — recurrence가 있는 Task의 부모를 찾아 RecurrenceSetupModal 열기
  const handleEditRoutine = useCallback(
    (item: ScheduledItem) => {
      // 반복 인스턴스(recurrenceParentId 있음)이면 부모 Task 조회
      const parentTask = item.recurrenceParentId
        ? state.tasks.find((t) => t.id === item.recurrenceParentId) ?? null
        : item;
      if (!parentTask) return;
      setEditingRecurrenceTask(parentTask);
      setRoutineModalTitle('');
      setRoutineModalCoord(null);
      setRoutineModalOpen(true);
    },
    [state.tasks]
  );

  // RecurrenceSetupModal 저장 핸들러 (생성 + 편집 겸용)
  const handleRoutineSetupSave = useCallback(
    (data: RecurrenceSetupData) => {
      if (editingRecurrenceTask) {
        batchUpdate((prev) => {
          const parentId = editingRecurrenceTask.id;
          let nextTasks = prev.tasks.map((t) =>
            t.id === parentId
              ? {
                  ...t,
                  title: data.title,
                  recurrence: data.recurrence,
                  daysOfWeek: data.daysOfWeek,
                  defaultSlot: data.defaultSlot,
                  startDate: data.startDate,
                  scheduledStartTime: data.scheduledStartTime,
                  scheduledEndTime: data.scheduledEndTime,
                  projectId: data.projectId,
                  isRecurrenceActive: true,
                  slot: null,
                  date: null,
                }
              : t
          );
          const updatedParent = nextTasks.find((t) => t.id === parentId)!;

          // startDate 범위 밖 미완료 인스턴스 정리
          nextTasks = nextTasks.filter((t) => {
            if (t.recurrenceParentId !== parentId) return true;
            if (t.completedAt) return true;
            if (t.date && t.date < data.startDate) return false;
            return true;
          });

          // 오늘 인스턴스가 필요하면 생성
          if (shouldCreateRecurringInstance(updatedParent, nextTasks, today)) {
            nextTasks = [...nextTasks, createRecurringInstance(updatedParent, today)];
          }

          return { ...prev, tasks: nextTasks };
        });
      } else {
        // 신규: addTask에 recurrence 옵션 전달
        addTask(data.title, today, {
          recurrence: data.recurrence,
          daysOfWeek: data.daysOfWeek,
          startDate: data.startDate,
          scheduledStartTime: data.scheduledStartTime,
          scheduledEndTime: data.scheduledEndTime,
          defaultSlot: routineModalCoord ?? data.defaultSlot,
          projectId: data.projectId ?? undefined,
        });
      }
      setRoutineModalOpen(false);
      setRoutineModalTitle('');
      setRoutineModalCoord(null);
      setEditingRecurrenceTask(null);
    },
    [editingRecurrenceTask, routineModalTitle, routineModalCoord, addTask, today, batchUpdate]
  );

  // 반복 해제: 부모를 일반 투두로 복원 + 인스턴스 전부 삭제
  const handleDeleteRoutine = useCallback(() => {
    if (editingRecurrenceTask) {
      const parentId = editingRecurrenceTask.id;
      batchUpdate((prev) => ({
        ...prev,
        tasks: prev.tasks
          // 인스턴스 전부 삭제
          .filter((t) => t.recurrenceParentId !== parentId)
          // 부모를 일반 투두로 복원
          .map((t) =>
            t.id === parentId
              ? {
                  ...t,
                  slot: t.defaultSlot ?? null,
                  date: today,
                  recurrence: undefined,
                  daysOfWeek: undefined,
                  startDate: undefined,
                  isRecurrenceActive: undefined,
                  defaultSlot: undefined,
                  skippedDates: undefined,
                }
              : t
          ),
      }));
      setRoutineModalOpen(false);
      setEditingRecurrenceTask(null);
    }
  }, [editingRecurrenceTask, batchUpdate, today]);

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
    (name: string, colorIndex: number) => {
      const project = addProject(name, colorIndex);
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

      // 백로그 드롭 — 슬롯에서 백로그로 이동 (미루기 아님, 단순 계획 수정)
      if (over.id === 'backlog-drop') {
        const draggedItem = active.data.current?.item as ScheduledItem | undefined;
        if (draggedItem) handleSendToBacklog(draggedItem);
        return;
      }

      const coord = over.data.current?.coord as SlotCoord | undefined;
      if (!coord) return;

      // 반복 슬롯에는 일반 투두 드롭 차단
      if (over.data.current?.isRoutineSlot) return;

      const itemId = String(active.id);
      const itemData = active.data.current;

      // 드래그된 아이템의 현재 슬롯을 data에서 직접 가져옴 (state 재탐색 불필요)
      const draggedItem = itemData?.item as ScheduledItem | undefined;
      const draggedCurrentSlot: SlotCoord | null =
        draggedItem && 'slot' in draggedItem ? (draggedItem.slot as SlotCoord | null) : null;

      // 반복 인스턴스는 드래그 이동 차단 — 반복 설정에서 슬롯 변경
      const isRecurring = draggedItem && ('recurrenceParentId' in draggedItem && draggedItem.recurrenceParentId || 'recurrence' in draggedItem && draggedItem.recurrence);
      if (isRecurring) return;

      const targetItem = slots[coord.period][coord.priority];

      if (!targetItem) {
        // 빈 슬롯 — 단순 배정
        assignTaskSlot(itemId, coord, today);
      } else if (targetItem.id !== itemId) {
        // 채워진 슬롯 — 두 아이템 슬롯 교환 (스왑)
        if (draggedCurrentSlot) {
          assignTaskSlot(targetItem.id, draggedCurrentSlot, today);
        } else {
          deferTask(targetItem.id);
        }
        // 드래그된 아이템을 타겟 슬롯으로 이동
        assignTaskSlot(itemId, coord, today);
      }
    },
    [slots, assignTaskSlot, deferTask, today, handleSendToBacklog]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = event.active.data.current?.item as ScheduledItem | undefined;
    if (item) setActiveItem(item);
  }, []);

  const handlePlaceInSlot = useCallback(
    (item: Task) => {
      setSlotPickerTarget(item.id);
      setSlotPickerOpen(true);
    },
    []
  );

  const handleSlotPick = useCallback(
    (coord: SlotCoord) => {
      if (!slotPickerTarget) return;
      if (slotPickerIsRepeat) {
        continueTask(slotPickerTarget, today, coord);
      } else {
        assignTaskSlot(slotPickerTarget, coord, today);
      }
      setSlotPickerOpen(false);
      setSlotPickerTarget(null);
      setSlotPickerIsRepeat(false);
    },
    [slotPickerTarget, slotPickerIsRepeat, assignTaskSlot, continueTask, today]
  );

  // 프로젝트 편집/삭제/아카이브
  const handleEditProject = useCallback((project: Project) => {
    setRenamingProject(project);
  }, []);

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      setDeleteProjectId(projectId);
    },
    []
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
      batchUpdate((prev) => {
        const updated = {
          ...prev,
          goalCompass: {
            ...prev.goalCompass,
            goals: { ...prev.goalCompass.goals, [key]: value },
          },
        };
        // 오늘 목표 작성 시 날짜 기록 (리셋 판단용)
        if (key === 'today') {
          updated.goalTodayDate = value ? getToday() : undefined;
        }
        return updated;
      });
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
    (item: Task) => item.title,
    []
  );

  const isRoutineInstanceFn = useCallback(
    (_item: Task) => false,
    []
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted-foreground)]">{t.loading}</p>
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
        onUnarchiveProject={(id) => updateProject(id, { archived: false })}
        onSearchClick={() => { trackSearch(0); setSearchOpen(true); }}
        onLoginClick={() => { trackLoginClick(); setLoginModalOpen(true); }}
        onExport={() => {
          trackExport('json');
          const json = exportToJSON(state);
          const todayStr = formatLocalDate(new Date());
          downloadFile(json, `9todo_${todayStr}.json`, 'application/json');
        }}
        onImport={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              try {
                const imported = importStateFromJSON(ev.target?.result as string);
                batchUpdate(() => imported);
              } catch {
                setImportErrorOpen(true);
              }
            };
            reader.readAsText(file);
          };
          input.click();
        }}
        onResetData={() => setResetConfirmOpen(true)}
        projectFirstMode={state.projectFirstMode}
        onProjectFirstModeChange={(enabled) => {
          setProjectFirstMode(enabled);
          // 토글 OFF 시 프로젝트 필터 해제
          if (!enabled) setActiveProjectFilter(null);
        }}
        rightPanelAccentColor={
          playItems[0] && 'projectId' in playItems[0] && (playItems[0] as { projectId?: string | null }).projectId
            ? state.projects.find((p) => p.id === (playItems[0] as { projectId: string }).projectId)?.color
            : undefined
        }
        rightPanel={
          <NowFocus
            items={playItems}
            projects={state.projects}
            onComplete={handleComplete}
            onDefer={handleDefer}
            onRepeat={handleRepeat}
            isReadOnly={isReadOnly}
            notes={state.notes ?? []}
            onAddNote={addNote}
            onRemoveNote={removeNote}
            onUpdateNote={updateNoteContent}
            lastUsedProjectId={state.lastUsedProjectId}
          />
        }
      >
        <div className="w-full max-w-5xl px-4 md:px-8 py-6 flex flex-col gap-5">
          <h1 className="sr-only">{t.dashboardTitle}</h1>
          {searchOpen ? (
            <SearchView
              tasks={state.tasks}
              notes={state.notes ?? []}
              projects={state.projects}
              onClose={() => setSearchOpen(false)}
            />
          ) : (
          <>
          {/* Goal Compass — 프로젝트 상세 뷰, 회고 뷰에서는 숨김 */}
          {!(state.activeProjectFilter
            && state.activeProjectFilter !== '__calendar__'
            && state.activeProjectFilter !== '__retrospective__'
            && (state.activeProjectFilter === '__unassigned__' || state.projects.some((p) => p.id === state.activeProjectFilter))
          ) && state.activeProjectFilter !== '__retrospective__' && (
            <GoalCompass
              data={state.goalCompass}
              onSaveIdentity={handleSaveIdentity}
              onSaveGoal={handleSaveGoal}
              onSaveAffirmation={handleSaveAffirmation}
              totalXP={totalXP}
              previewKey={state.activeProjectFilter === '__calendar__' ? calendarViewMode === 'week' ? 'week' : 'month' : 'today'}
              onCompleteGoal={() => { completeGoal(today); triggerConfetti({}); }}
              isGoalCompleted={(state.goalCompletedDates ?? []).includes(today)}
              goalTasks={state.goalTasks ?? []}
              currentPeriodKeys={currentPeriodKeys}
              onAddGoalTask={addGoalTask}
              onCompleteGoalTask={(id) => { completeGoalTask(id); triggerConfetti({}); }}
              onUncompleteGoalTask={uncompleteGoalTask}
              onUpdateGoalTaskTitle={updateGoalTaskTitle}
              onRemoveGoalTask={removeGoalTask}
            />
          )}

          {state.activeProjectFilter === '__retrospective__' ? (
            /* 회고 뷰 */
            <RetrospectiveListView
              retrospectives={state.retrospectives ?? []}
              onSave={upsertRetrospective}
              onDelete={removeRetrospective}
            />
          ) : state.activeProjectFilter === '__calendar__' ? (
            /* 캘린더 뷰 */
            <CalendarView
              tasks={state.tasks}
              routines={[]}
              routineInstances={[]}
              projects={state.projects}
              onEditRoutine={() => {}}
              onViewModeChange={setCalendarViewMode}
              onCreateTask={(title, date, projectId) => addTask(title, date, { projectId })}
              onUpdateTask={(taskId, updates) => {
                batchUpdate((prev) => {
                  const task = prev.tasks.find((t) => t.id === taskId);
                  if (!task) return prev;

                  const finalUpdates: Record<string, unknown> = { ...updates };

                  // 시간 변경 시 슬롯 동기화
                  if (updates.scheduledStartTime && task.slot) {
                    const newPeriod = timeToPeriod(updates.scheduledStartTime);
                    const targetDate = updates.date ?? task.date;

                    if (newPeriod !== task.slot.period) {
                      // 다른 시간대로 이동 — 빈 우선순위 찾기
                      const occupiedPriorities = prev.tasks
                        .filter((t) => t.id !== taskId && t.date === targetDate && t.slot?.period === newPeriod)
                        .map((t) => t.slot!.priority);

                      const freePriority = ([1, 2, 3] as Priority[]).find((p) => !occupiedPriorities.includes(p));
                      if (!freePriority) return prev; // 자리 없으면 이동 거부

                      finalUpdates.slot = { period: newPeriod, priority: freePriority };
                    }
                  }

                  // 날짜만 변경된 경우에도 해당 날짜의 같은 슬롯이 차있으면 빈 슬롯으로 배치
                  if (updates.date && updates.date !== task.date && task.slot && !updates.scheduledStartTime) {
                    const occupiedPriorities = prev.tasks
                      .filter((t) => t.id !== taskId && t.date === updates.date && t.slot?.period === task.slot!.period)
                      .map((t) => t.slot!.priority);

                    if (occupiedPriorities.includes(task.slot.priority)) {
                      const freePriority = ([1, 2, 3] as Priority[]).find((p) => !occupiedPriorities.includes(p));
                      if (!freePriority) return prev;
                      finalUpdates.slot = { period: task.slot.period, priority: freePriority };
                    }
                  }

                  return {
                    ...prev,
                    tasks: prev.tasks.map((t) =>
                      t.id === taskId ? { ...t, ...finalUpdates } : t
                    ),
                  };
                });
              }}
              onEditRecurrence={handleEditRoutine}
              retrospectives={state.retrospectives ?? []}
              onSaveRetro={upsertRetrospective}
            />
          ) : (() => {
            // 실제 프로젝트 ID인지 확인
            const selectedProject = state.activeProjectFilter
              && state.activeProjectFilter !== '__unassigned__'
              ? state.projects.find((p) => p.id === state.activeProjectFilter)
              : null;

            // 미분류 가상 프로젝트
            const isUnassignedView = state.activeProjectFilter === '__unassigned__';

            if (selectedProject || isUnassignedView) {
              const proj = selectedProject ?? {
                id: '__unassigned__' as string,
                name: t.uncategorized,
                color: '#8A8A8A',
                colorIndex: 0,
                archived: false,
                createdAt: '',
              };
              return (
                <ProjectDetailView
                  project={proj}
                  tasks={state.tasks}
                  routines={[]}
                  routineInstances={[]}
                  notes={state.notes ?? []}
                  onAddNote={addNote}
                  onRemoveNote={removeNote}
                  colorTheme={state.colorTheme}
                  onUpdateColor={isUnassignedView ? undefined : (pid, idx) => updateProject(pid, { colorIndex: idx })}
                  onComplete={handleComplete}
                  onDefer={handleDefer}
                  onRepeat={handleRepeat}
                  onDelete={handleDelete}
                  onUncomplete={handleUncomplete}
                />
              );
            }

            return (
              <>
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

                {/* Timetable Grid — desktop */}
                <div className="hidden md:block">
                  <TimetableGrid
                    currentPeriod={currentPeriod}
                    slots={filteredSlots}
                    onComplete={handleComplete}
                    onDefer={handleDefer}
                    onRepeat={handleRepeat}
                    onSlotClick={handleSlotClick}
                    onDelete={handleDelete}
                    onUpdateTitle={handleUpdateTitle}
                    onUpdateProject={handleUpdateProject}
                    onCreateInSlot={handleCreateInSlot}
                    onUncomplete={handleUncomplete}
                    onCreateRoutine={handleCreateRoutine}
                    projectFirstMode={state.projectFirstMode}
                    projects={state.projects}
                    isReadOnly={isReadOnly}
                    isToday={isToday}
                    onItemSelect={() => {}}
                    onEditRecurrence={handleEditRoutine}
                  />
                </div>

                {/* Timetable List — mobile */}
                <MobileTimetableList
                  currentPeriod={currentPeriod}
                  slots={filteredSlots}
                  onComplete={handleComplete}
                  onDefer={handleDefer}
                  onRepeat={handleRepeat}
                  onSlotClick={handleSlotClick}
                  onDelete={handleDelete}
                  onUpdateTitle={handleUpdateTitle}
                  onUpdateProject={handleUpdateProject}
                  onCreateInSlot={handleCreateInSlot}
                  onUncomplete={handleUncomplete}
                  projects={state.projects}
                  isReadOnly={isReadOnly}
                  isToday={isToday}
                  onItemSelect={() => {}}
                  onSendToBacklog={handleSendToBacklog}
                />

                {/* Backlog */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <BacklogPanel
                  items={filteredBacklog as any}
                  projects={state.projects}
                  getTitleForItem={getTitleForItem as any}
                  isRoutineInstance={isRoutineInstanceFn as any}
                  onPlaceInSlot={handlePlaceInSlot as any}
                  onUpdateTitle={handleUpdateTitle as any}
                  onDelete={handleDelete as any}
                  onAdd={(title, projectId) => addTask(title, today, { projectId })}
                  lastUsedProjectId={state.lastUsedProjectId}
                  isReadOnly={isReadOnly}
                />

                {/* 일간 회고 */}
                <DailyRetro
                  date={today}
                  retrospectives={state.retrospectives ?? []}
                  onSave={upsertRetrospective}
                />
              </>
            );
          })()}
          </>
          )}
        </div>
      </AppShell>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="px-3 py-2 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--accent)] shadow-lg text-sm font-medium text-[var(--foreground)] max-w-[240px] whitespace-pre-wrap break-words">
            {activeItem.title}
          </div>
        )}
      </DragOverlay>

      {/* 미루기 확인 */}
      <Dialog open={!!deferTarget} onClose={() => setDeferTarget(null)} title={t.defer} width="sm">
        <p className="text-[13px] text-[var(--muted-foreground)] mb-4">
          {t.deferConfirm(deferTarget?.title ?? '')}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDeferTarget(null)}
            className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => { if (deferTarget) { deferTask(deferTarget.id); setDeferTarget(null); } }}
            className="px-4 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-semibold bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity"
          >
            {t.defer}
          </button>
        </div>
      </Dialog>

      {/* Modals */}
      <SlotPickerModal
        open={slotPickerOpen}
        onClose={() => { setSlotPickerOpen(false); setSlotPickerIsRepeat(false); }}
        slots={slots}
        onSelect={handleSlotPick}
        onBacklog={slotPickerIsRepeat ? () => {
          if (!slotPickerTarget) return;
          continueTask(slotPickerTarget, today, null);
          setSlotPickerOpen(false);
          setSlotPickerTarget(null);
          setSlotPickerIsRepeat(false);
        } : undefined}
        title={slotPickerIsRepeat ? t.redoSlotTitle : undefined}
        description={slotPickerIsRepeat ? t.redoSlotDesc : undefined}
      />

      <ProjectCreateModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={({ name, colorIndex }) => addProject(name, colorIndex)}
        colorTheme={state.colorTheme}
        onThemeChange={setColorTheme}
      />

      <ProjectSelectModal
        open={projectSelectOpen}
        onClose={() => { setProjectSelectOpen(false); setProjectSelectTargetId(null); }}
        projects={state.projects}
        onSelect={handleProjectSelectDone}
        onCreateAndSelect={handleProjectCreateAndSelect}
        onSkip={() => { setProjectSelectOpen(false); setProjectSelectTargetId(null); }}
        colorTheme={state.colorTheme}
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

      <RecurrenceSetupModal
        open={routineModalOpen}
        onClose={() => { setRoutineModalOpen(false); setRoutineModalTitle(''); setRoutineModalCoord(null); setEditingRecurrenceTask(null); }}
        initialTitle={routineModalTitle}
        initialCoord={routineModalCoord}
        editingTask={editingRecurrenceTask}
        onSave={handleRoutineSetupSave}
        onDelete={handleDeleteRoutine}
        projects={state.projects}
        colorTheme={state.colorTheme}
        initialProjectId={
          editingRecurrenceTask?.projectId ??
          (state.activeProjectFilter && state.activeProjectFilter !== '__unassigned__' && state.activeProjectFilter !== '__calendar__' && state.activeProjectFilter !== '__retrospective__'
            ? state.activeProjectFilter
            : state.lastUsedProjectId ?? null)
        }
        onCreateProject={(name, colorIndex) => addProject(name, colorIndex)}
        occupiedSlots={
          state.tasks
            .filter((t) => t.recurrence && t.isRecurrenceActive !== false && t.defaultSlot)
            .map((t) => t.defaultSlot!)
        }
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
      <StorageConsentBanner />

      {/* 태스크 삭제 확인 */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t.deleteConfirm} width="sm">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {t.deleteCannotRecover}
        </p>
        {deleteTarget && (deleteTarget.recurrenceParentId || deleteTarget.recurrence) ? (
          <div className="flex flex-col gap-2 pt-1">
            <button onClick={() => {
              removeTask(deleteTarget.id);
              setDeleteTarget(null);
            }} className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">{t.deleteThisOnly}</button>
            <button onClick={() => {
              removeTaskWithRecurrence(deleteTarget.id);
              setDeleteTarget(null);
            }} className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85">{t.deleteAllRecurrence}</button>
            <button onClick={() => setDeleteTarget(null)} className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
            <button onClick={() => {
              if (deleteTarget) {
                removeTask(deleteTarget.id);
              }
              setDeleteTarget(null);
            }} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85">{t.delete}</button>
          </div>
        )}
      </Dialog>

      {/* 반복 투두 제목 수정 범위 선택 */}
      <Dialog open={!!recurrenceEditTarget} onClose={() => setRecurrenceEditTarget(null)} title={t.editTitle} width="sm">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {t.editTitleDesc}
        </p>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={() => {
            if (recurrenceEditTarget) {
              updateTaskTitle(recurrenceEditTarget.item.id, recurrenceEditTarget.title);
              setRecurrenceEditTarget(null);
            }
          }} className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">{t.editThisOnly}</button>
          <button onClick={() => {
            if (recurrenceEditTarget) {
              updateTaskTitleWithRecurrence(recurrenceEditTarget.item.id, recurrenceEditTarget.title);
              setRecurrenceEditTarget(null);
            }
          }} className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] transition-opacity hover:opacity-85">{t.editAllRecurrence}</button>
          <button onClick={() => setRecurrenceEditTarget(null)} className="w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
        </div>
      </Dialog>

      {/* 프로젝트 삭제 확인 */}
      <Dialog open={!!deleteProjectId} onClose={() => setDeleteProjectId(null)} title={t.deleteConfirm} width="sm">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {t.deleteProjectConfirm.split('\n').map((line, i) => (<span key={i}>{line}{i === 0 ? <br/> : null}</span>))}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => setDeleteProjectId(null)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
          <button onClick={() => {
            if (deleteProjectId) removeProject(deleteProjectId);
            setDeleteProjectId(null);
          }} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85">{t.delete}</button>
        </div>
      </Dialog>

      {/* 데이터 삭제 확인 */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} title={t.resetDataTitle} width="sm">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {t.resetDataDesc}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => setResetConfirmOpen(false)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
          <button onClick={() => { localStorage.removeItem('9todo_state'); batchUpdate(() => EMPTY_STATE); setResetConfirmOpen(false); }} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85">{t.delete}</button>
        </div>
      </Dialog>

      {/* 가져오기 오류 */}
      <Dialog open={importErrorOpen} onClose={() => setImportErrorOpen(false)} title={t.importFailed} width="sm">
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {t.importFailedDesc}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={() => setImportErrorOpen(false)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] transition-opacity hover:opacity-85">{t.confirm}</button>
        </div>
      </Dialog>
      {/* <MarketingInjector /> */}
    </DndContext>
  );
}
