'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { shouldCreateRecurringInstance, createRecurringInstance } from '@/lib/recurrence';
import type {
  AppState,
  Task,
  Routine,
  RoutineInstance,
  Project,
  Note,
  SlotCoord,
  RecurrenceType,
  RetrospectiveEntry,
  RetroScope,
  EnergyLevel,
  GoalTask,
  GoalPeriod,
} from '@/lib/types';
import { resolveColor, hexToColorIndex, DEFAULT_THEME } from '@/lib/colors';
import { trackSlotFill, trackTaskComplete, trackRoutineComplete } from '@/lib/analytics';
import { getToday, getWeekKey, getMonthKey } from '@/lib/date';

const STORAGE_KEY = '9todo_state';
const CONSENT_KEY = '9todo_storage_consent';

export const EMPTY_STATE: AppState = {
  projects: [],
  tasks: [],
  routines: [],
  routineInstances: [],
  notes: [],
  goalCompass: {
    identity: '',
    goals: {
      today: '',
      week: '',
      month: '',
      quarter: '',
      oneYear: '',
      fiveYear: '',
    },
    affirmation: '',
  },
  goalCompletedDates: [],
  goalTasks: [],
  lastUsedProjectId: null,
  activeProjectFilter: null,
  projectFirstMode: true,
  colorTheme: DEFAULT_THEME,
  retrospectives: [],
};

export function hasStorageConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function grantStorageConsent(): void {
  localStorage.setItem(CONSENT_KEY, 'true');
}

/** 마이그레이션: Routine → Task 반복 투두로 변환 */
function migrateRoutinesToTasks(state: AppState): AppState {
  if (!state.routines?.length && !state.routineInstances?.length) return state;

  const newTasks: Task[] = [];

  // Routine → Task (반복 부모)
  for (const r of (state.routines ?? [])) {
    const task: Task = {
      id: r.id, // 기존 ID 유지 (인스턴스 참조 보존)
      type: 'task',
      title: r.title,
      projectId: r.projectId,
      slot: null, // 부모는 슬롯 없음 (인스턴스가 슬롯 차지)
      deferCount: 0,
      continueCount: 0,
      completedAt: null,
      date: null,
      createdAt: r.createdAt,
      recurrence: r.recurrence,
      daysOfWeek: r.daysOfWeek,
      startDate: r.startDate,
      isRecurrenceActive: r.isActive,
      scheduledStartTime: r.scheduledTime,
      defaultSlot: r.defaultSlot,
    };
    newTasks.push(task);
  }

  // RoutineInstance → Task (반복 인스턴스)
  for (const ri of (state.routineInstances ?? [])) {
    const parent = (state.routines ?? []).find((r) => r.id === ri.routineId);
    const task: Task = {
      id: ri.id,
      type: 'task',
      title: parent?.title ?? '(마이그레이션)',
      projectId: parent?.projectId ?? null,
      slot: ri.slot,
      deferCount: ri.deferCount,
      continueCount: 0,
      completedAt: ri.completedAt,
      date: ri.date,
      createdAt: ri.date + 'T00:00:00.000Z',
      recurrenceParentId: ri.routineId,
      scheduledStartTime: parent?.scheduledTime,
    };
    newTasks.push(task);
  }

  return {
    ...state,
    tasks: [...state.tasks, ...newTasks],
    routines: [],
    routineInstances: [],
  };
}

/** 마이그레이션: 백로그 태스크(slot=null)의 date를 null로 변환 */
function migrateBacklogDates(state: AppState): AppState {
  const needsMigration = state.tasks.some((t) => t.slot === null && t.date !== null);
  if (!needsMigration) return state;
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.slot === null && t.completedAt === null ? { ...t, date: null } : t,
    ),
  };
}

/** 마이그레이션: goalCompass 문자열 목표 → goalTasks 변환 */
function migrateGoalCompassToTasks(state: AppState): AppState {
  if (state.goalTasks?.length) return state; // 이미 마이그레이션됨
  const today = getToday();
  const newGoalTasks: GoalTask[] = [];
  const goals = state.goalCompass?.goals;
  if (!goals) return { ...state, goalTasks: [] };

  if (goals.today) {
    const gt: GoalTask = {
      id: `goal_${nanoid()}`,
      title: goals.today,
      goalPeriod: 'today',
      periodKey: today,
      completedAt: (state.goalCompletedDates ?? []).includes(today) ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    newGoalTasks.push(gt);
  }
  if (goals.week) {
    const gt: GoalTask = {
      id: `goal_${nanoid()}`,
      title: goals.week,
      goalPeriod: 'week',
      periodKey: getWeekKey(today),
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    newGoalTasks.push(gt);
  }
  if (goals.month) {
    const gt: GoalTask = {
      id: `goal_${nanoid()}`,
      title: goals.month,
      goalPeriod: 'month',
      periodKey: getMonthKey(today),
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    newGoalTasks.push(gt);
  }

  if (newGoalTasks.length === 0) return { ...state, goalTasks: [] };

  return {
    ...state,
    goalTasks: newGoalTasks,
  };
}

/** 프로젝트 색상을 현재 테마 기반으로 resolve */
function resolveProjectColors(state: AppState): AppState {
  const themeId = state.colorTheme ?? DEFAULT_THEME;
  return {
    ...state,
    colorTheme: themeId,
    projects: state.projects.map((p) => {
      // 마이그레이션: colorIndex가 없으면 기존 hex에서 추론
      const colorIndex = p.colorIndex ?? hexToColorIndex(p.color ?? '#6B7280', themeId);
      return { ...p, colorIndex, color: resolveColor(colorIndex, themeId) };
    }),
  };
}

export function importStateFromJSON(json: string): AppState {
  return migrateBacklogDates(resolveProjectColors(JSON.parse(json) as AppState));
}

export function useAppData() {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기 로드: localStorage에서 읽기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        let parsed = resolveProjectColors(JSON.parse(raw) as AppState);
        // 마케팅 테스트 데이터 정리 (일회성)
        const before = parsed.tasks.length;
        parsed = { ...parsed, tasks: parsed.tasks.filter((t) => !t.id.startsWith('item_mkt_') && !t.id.startsWith('item_setup_')) };
        if (parsed.tasks.length < before) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        setState(migrateGoalCompassToTasks(migrateBacklogDates(migrateRoutinesToTasks(parsed))));
      }
    } catch (err) {
      console.error('[useAppData] localStorage read error', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // debounce 300ms localStorage 저장
  const persist = useCallback((nextState: AppState) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      } catch (err) {
        console.error('[useAppData] localStorage write error', err);
      }
    }, 300);
  }, []);

  // 상태 업데이트 + 저장
  const update = useCallback(
    (updater: (prev: AppState) => AppState) => {
      setState((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  // ── Project CRUD ──────────────────────────────────────────────
  const addProject = useCallback(
    (name: string, colorIndex: number) => {
      const project: Project = {
        id: `proj_${nanoid()}`,
        name,
        colorIndex,
        color: '', // resolve below
        createdAt: new Date().toISOString(),
      };
      let resolved = project;
      update((prev) => {
        const themeId = prev.colorTheme ?? DEFAULT_THEME;
        resolved = { ...project, color: resolveColor(colorIndex, themeId) };
        return {
          ...prev,
          projects: [...prev.projects, resolved],
          lastUsedProjectId: project.id,
        };
      });
      return resolved;
    },
    [update],
  );

  const removeProject = useCallback(
    (projectId: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        // 해당 프로젝트에 속한 태스크/루틴도 함께 삭제
        tasks: prev.tasks.filter((t) => t.projectId !== projectId),
        routines: prev.routines.filter((r) => r.projectId !== projectId),
        lastUsedProjectId:
          prev.lastUsedProjectId === projectId ? null : prev.lastUsedProjectId,
        activeProjectFilter:
          prev.activeProjectFilter === projectId ? null : prev.activeProjectFilter,
      }));
    },
    [update],
  );

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Pick<Project, 'name' | 'colorIndex' | 'archived'>>) => {
      update((prev) => {
        const themeId = prev.colorTheme ?? DEFAULT_THEME;
        return {
          ...prev,
          projects: prev.projects.map((p) => {
            if (p.id !== projectId) return p;
            const merged = { ...p, ...updates };
            if (updates.colorIndex !== undefined) {
              merged.color = resolveColor(updates.colorIndex, themeId);
            }
            return merged;
          }),
        };
      });
    },
    [update],
  );

  const archiveProject = useCallback(
    (projectId: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, archived: true } : p,
        ),
        activeProjectFilter:
          prev.activeProjectFilter === projectId ? null : prev.activeProjectFilter,
      }));
    },
    [update],
  );

  const setProjectFirstMode = useCallback(
    (enabled: boolean) => {
      update((prev) => ({ ...prev, projectFirstMode: enabled }));
    },
    [update],
  );

  // ── Task CRUD ─────────────────────────────────────────────────
  const addTask = useCallback(
    (
      title: string,
      date: string | null,
      options?: {
        slot?: SlotCoord;
        projectId?: string | null;
        recurrence?: RecurrenceType;
        daysOfWeek?: number[];
        startDate?: string;
        scheduledStartTime?: string;
        scheduledEndTime?: string;
        defaultSlot?: SlotCoord;
      },
    ) => {
      const isRecurring = !!options?.recurrence;
      const task: Task = {
        id: `item_${nanoid()}`,
        type: 'task',
        title,
        projectId: options?.projectId ?? null,
        slot: isRecurring ? null : (options?.slot ?? null), // 반복 부모는 슬롯 없음
        deferCount: 0,
        continueCount: 0,
        completedAt: null,
        date: isRecurring ? null : (options?.slot ? date : null),
        createdAt: new Date().toISOString(),
        ...(isRecurring ? {
          recurrence: options!.recurrence,
          daysOfWeek: options!.daysOfWeek,
          startDate: options!.startDate ?? date ?? undefined,
          isRecurrenceActive: true,
          scheduledStartTime: options!.scheduledStartTime,
          scheduledEndTime: options!.scheduledEndTime,
          defaultSlot: options!.defaultSlot,
        } : {}),
      };
      update((prev) => {
        const newTasks = [...prev.tasks, task];
        // 반복 투두 생성 시 오늘 인스턴스 즉시 생성
        if (isRecurring && date && shouldCreateRecurringInstance(task, newTasks, date)) {
          newTasks.push(createRecurringInstance(task, date));
        }
        return {
          ...prev,
          tasks: newTasks,
          lastUsedProjectId: task.projectId ?? prev.lastUsedProjectId,
        };
      });
      return task;
    },
    [update],
  );

  const completeTask = useCallback(
    (taskId: string, timerSeconds?: number) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completedAt: new Date().toISOString(),
                ...(timerSeconds && timerSeconds > 0 ? { timerSeconds } : {}),
              }
            : t,
        ),
      }));
      trackTaskComplete(timerSeconds ? Math.round(timerSeconds / 60) : 0);
    },
    [update],
  );

  const uncompleteTask = useCallback(
    (taskId: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, completedAt: null } : t,
        ),
      }));
    },
    [update],
  );

  const deferTask = useCallback(
    (taskId: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? { ...t, slot: null, date: null, deferCount: t.deferCount + 1, origin: 'deferred' as const }
            : t,
        ),
      }));
    },
    [update],
  );

  // 또하기: 원본 완료 처리 + 슬롯 잔류, 복제본을 새 슬롯에 배치 (lineageId로 계보 연결)
  const continueTask = useCallback(
    (taskId: string, date: string, slot: SlotCoord) => {
      update((prev) => {
        const original = prev.tasks.find((t) => t.id === taskId);
        if (!original) return prev;
        const lineage = original.lineageId ?? original.id;
        const clone: Task = {
          ...original,
          id: `item_${nanoid()}`,
          slot,
          date,
          completedAt: null,
          continueCount: Math.min((original.continueCount ?? 0) + 1, 9),
          origin: 'repeated' as const,
          lineageId: lineage,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, completedAt: t.completedAt ?? new Date().toISOString(), lineageId: lineage, origin: 'continued' as const }
              : t,
          ).concat(clone),
        };
      });
    },
    [update],
  );

  const assignTaskSlot = useCallback(
    (taskId: string, coord: SlotCoord, date?: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, slot: coord, ...(date ? { date } : {}) } : t,
        ),
      }));
      trackSlotFill(coord.period, coord.priority);
    },
    [update],
  );

  const removeTask = useCallback(
    (taskId: string) => {
      update((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        // 반복 인스턴스 삭제 시 부모의 skippedDates에 날짜 기록 → 좀비 재생성 방지
        if (task?.recurrenceParentId && task.date) {
          const parentId = task.recurrenceParentId;
          const skippedDate = task.date;
          return {
            ...prev,
            tasks: prev.tasks
              .filter((t) => t.id !== taskId)
              .map((t) =>
                t.id === parentId
                  ? { ...t, skippedDates: [...(t.skippedDates ?? []), skippedDate] }
                  : t
              ),
          };
        }
        return { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) };
      });
    },
    [update],
  );

  /** 반복 부모 + 모든 인스턴스 일괄 삭제 */
  const removeTaskWithRecurrence = useCallback(
    (taskId: string) => {
      update((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;
        // 부모 ID 결정: 인스턴스면 recurrenceParentId, 부모면 자기 자신
        const parentId = task.recurrenceParentId ?? task.id;
        return {
          ...prev,
          tasks: prev.tasks.filter(
            (t) => t.id !== parentId && t.recurrenceParentId !== parentId
          ),
        };
      });
    },
    [update],
  );

  const updateTaskTitle = useCallback(
    (taskId: string, title: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, title } : t,
        ),
      }));
    },
    [update],
  );

  /** 반복 부모 + 모든 인스턴스 제목 일괄 수정 */
  const updateTaskTitleWithRecurrence = useCallback(
    (taskId: string, title: string) => {
      update((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId);
        if (!task) return prev;
        const parentId = task.recurrenceParentId ?? task.id;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === parentId || t.recurrenceParentId === parentId
              ? { ...t, title }
              : t,
          ),
        };
      });
    },
    [update],
  );

  // ── Routine CRUD ──────────────────────────────────────────────
  const addRoutine = useCallback(
    (routine: Omit<Routine, 'id' | 'type' | 'createdAt'>) => {
      const newRoutine: Routine = {
        ...routine,
        id: `rtn_${nanoid()}`,
        type: 'routine',
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, routines: [...prev.routines, newRoutine] }));
      return newRoutine;
    },
    [update],
  );

  const updateRoutine = useCallback(
    (routineId: string, updates: Partial<Omit<Routine, 'id' | 'type' | 'createdAt'>>) => {
      update((prev) => ({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id === routineId ? { ...r, ...updates } : r,
        ),
        // defaultSlot이 변경되면 미완료 인스턴스의 slot도 업데이트
        routineInstances: updates.defaultSlot
          ? prev.routineInstances.map((ri) =>
              ri.routineId === routineId && !ri.completedAt
                ? { ...ri, slot: updates.defaultSlot! }
                : ri,
            )
          : prev.routineInstances,
      }));
    },
    [update],
  );

  const toggleRoutineActive = useCallback(
    (routineId: string) => {
      update((prev) => ({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id === routineId ? { ...r, isActive: !r.isActive } : r,
        ),
      }));
    },
    [update],
  );

  const removeRoutine = useCallback(
    (routineId: string) => {
      update((prev) => ({
        ...prev,
        routines: prev.routines.filter((r) => r.id !== routineId),
        routineInstances: prev.routineInstances.filter(
          (ri) => ri.routineId !== routineId,
        ),
      }));
    },
    [update],
  );

  // ── RoutineInstance ───────────────────────────────────────────
  const completeRoutineInstance = useCallback(
    (instanceId: string) => {
      update((prev) => ({
        ...prev,
        routineInstances: prev.routineInstances.map((ri) =>
          ri.id === instanceId
            ? { ...ri, completedAt: new Date().toISOString() }
            : ri,
        ),
      }));
      trackRoutineComplete();
    },
    [update],
  );

  const uncompleteRoutineInstance = useCallback(
    (instanceId: string) => {
      update((prev) => ({
        ...prev,
        routineInstances: prev.routineInstances.map((ri) =>
          ri.id === instanceId ? { ...ri, completedAt: null } : ri,
        ),
      }));
    },
    [update],
  );

  const deferRoutineInstance = useCallback(
    (instanceId: string) => {
      update((prev) => ({
        ...prev,
        routineInstances: prev.routineInstances.map((ri) =>
          ri.id === instanceId
            ? { ...ri, slot: null, deferCount: ri.deferCount + 1 }
            : ri,
        ),
      }));
    },
    [update],
  );

  // 진행중: 복사본 추가
  const continueRoutineInstance = useCallback(
    (instanceId: string) => {
      update((prev) => {
        const original = prev.routineInstances.find((ri) => ri.id === instanceId);
        if (!original) return prev;
        const copy: RoutineInstance = {
          ...original,
          id: `ri_${nanoid()}`,
          slot: null,
          deferCount: 0,
          completedAt: null,
        };
        return {
          ...prev,
          routineInstances: [...prev.routineInstances, copy],
        };
      });
    },
    [update],
  );

  const assignRoutineInstanceSlot = useCallback(
    (instanceId: string, coord: SlotCoord) => {
      update((prev) => ({
        ...prev,
        routineInstances: prev.routineInstances.map((ri) =>
          ri.id === instanceId ? { ...ri, slot: coord } : ri,
        ),
      }));
    },
    [update],
  );

  const removeRoutineInstance = useCallback(
    (instanceId: string) => {
      update((prev) => ({
        ...prev,
        routineInstances: prev.routineInstances.filter(
          (ri) => ri.id !== instanceId,
        ),
      }));
    },
    [update],
  );

  // ── Note CRUD ─────────────────────────────────────────────────
  const addNote = useCallback(
    (projectId: string, content: string) => {
      const note: Note = {
        id: `note_${nanoid()}`,
        projectId,
        content,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        notes: [...(prev.notes ?? []), note],
      }));
      return note;
    },
    [update],
  );

  const removeNote = useCallback(
    (noteId: string) => {
      update((prev) => ({
        ...prev,
        notes: (prev.notes ?? []).filter((n) => n.id !== noteId),
      }));
    },
    [update],
  );

  const updateNoteContent = useCallback(
    (noteId: string, content: string) => {
      update((prev) => ({
        ...prev,
        notes: (prev.notes ?? []).map((n) =>
          n.id === noteId ? { ...n, content } : n,
        ),
      }));
    },
    [update],
  );

  // ── Batch update (rollover 등) ──────────────────────────────
  const batchUpdate = useCallback(
    (updater: (prev: AppState) => AppState) => {
      update(updater);
    },
    [update],
  );

  // ── Color Theme ───────────────────────────────────────────────
  const setColorTheme = useCallback(
    (themeId: string) => {
      update((prev) => {
        const next = { ...prev, colorTheme: themeId };
        return resolveProjectColors(next);
      });
    },
    [update],
  );

  // ── Goal (레거시) ──────────────────────────────────────────
  const completeGoal = useCallback(
    (date: string) => {
      update((prev) => {
        if ((prev.goalCompletedDates ?? []).includes(date)) return prev;
        return { ...prev, goalCompletedDates: [...(prev.goalCompletedDates ?? []), date] };
      });
    },
    [update],
  );

  // ── GoalTask CRUD ──────────────────────────────────────────
  const addGoalTask = useCallback(
    (title: string, goalPeriod: GoalPeriod, periodKey: string) => {
      const gt: GoalTask = {
        id: `goal_${nanoid()}`,
        title,
        goalPeriod,
        periodKey,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        goalTasks: [...(prev.goalTasks ?? []), gt],
      }));
      return gt;
    },
    [update],
  );

  const completeGoalTask = useCallback(
    (goalTaskId: string) => {
      update((prev) => ({
        ...prev,
        goalTasks: (prev.goalTasks ?? []).map((gt) =>
          gt.id === goalTaskId ? { ...gt, completedAt: new Date().toISOString() } : gt,
        ),
      }));
    },
    [update],
  );

  const uncompleteGoalTask = useCallback(
    (goalTaskId: string) => {
      update((prev) => ({
        ...prev,
        goalTasks: (prev.goalTasks ?? []).map((gt) =>
          gt.id === goalTaskId ? { ...gt, completedAt: null } : gt,
        ),
      }));
    },
    [update],
  );

  const updateGoalTaskTitle = useCallback(
    (goalTaskId: string, title: string) => {
      update((prev) => ({
        ...prev,
        goalTasks: (prev.goalTasks ?? []).map((gt) =>
          gt.id === goalTaskId ? { ...gt, title } : gt,
        ),
      }));
    },
    [update],
  );

  const removeGoalTask = useCallback(
    (goalTaskId: string) => {
      update((prev) => ({
        ...prev,
        goalTasks: (prev.goalTasks ?? []).filter((gt) => gt.id !== goalTaskId),
      }));
    },
    [update],
  );

  // ── Filter ────────────────────────────────────────────────────
  const setActiveProjectFilter = useCallback(
    (projectId: string | null) => {
      update((prev) => ({ ...prev, activeProjectFilter: projectId }));
    },
    [update],
  );

  // ── Retrospective ─────────────────────────────────────────────
  const upsertRetrospective = useCallback(
    (scope: RetroScope, scopeKey: string, content: string, energyLevel?: EnergyLevel) => {
      update((prev) => {
        const retros = prev.retrospectives ?? [];
        const existing = retros.find((r) => r.scope === scope && r.scopeKey === scopeKey);
        if (existing) {
          return {
            ...prev,
            retrospectives: retros.map((r) =>
              r.id === existing.id
                ? { ...r, content, ...(energyLevel !== undefined && { energyLevel }), updatedAt: new Date().toISOString() }
                : r,
            ),
          };
        }
        const newEntry: RetrospectiveEntry = {
          id: `retro_${nanoid()}`,
          scope,
          scopeKey,
          content,
          energyLevel,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { ...prev, retrospectives: [...retros, newEntry] };
      });
    },
    [update],
  );

  const removeRetrospective = useCallback(
    (retroId: string) => {
      update((prev) => ({
        ...prev,
        retrospectives: (prev.retrospectives ?? []).filter((r) => r.id !== retroId),
      }));
    },
    [update],
  );

  return {
    state,
    loading,
    error,
    // project
    addProject,
    removeProject,
    updateProject,
    archiveProject,
    setProjectFirstMode,
    // task
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
    // routine
    addRoutine,
    updateRoutine,
    toggleRoutineActive,
    removeRoutine,
    // routineInstance
    completeRoutineInstance,
    uncompleteRoutineInstance,
    deferRoutineInstance,
    continueRoutineInstance,
    assignRoutineInstanceSlot,
    removeRoutineInstance,
    // note
    addNote,
    removeNote,
    updateNoteContent,
    // goal
    completeGoal,
    // goalTask
    addGoalTask,
    completeGoalTask,
    uncompleteGoalTask,
    updateGoalTaskTitle,
    removeGoalTask,
    // retrospective
    upsertRetrospective,
    removeRetrospective,
    // misc
    batchUpdate,
    setActiveProjectFilter,
    setColorTheme,
  };
}
