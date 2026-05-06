'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import type {
  AppState,
  Task,
  Routine,
  RoutineInstance,
  Project,
  SlotCoord,
} from '@/lib/types';

const EMPTY_STATE: AppState = {
  projects: [],
  tasks: [],
  routines: [],
  routineInstances: [],
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
  lastUsedProjectId: null,
  activeProjectFilter: null,
  projectFirstMode: true,
};

export function useAppData() {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기 로드
  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AppState>;
      })
      .then((data) => {
        setState(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useAppData] fetch error', err);
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // debounce 300ms PUT 저장
  const persist = useCallback((nextState: AppState) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState),
      }).catch((err) => console.error('[useAppData] persist error', err));
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
    (name: string, color: string) => {
      const project: Project = {
        id: `proj_${nanoid()}`,
        name,
        color,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        projects: [...prev.projects, project],
        lastUsedProjectId: project.id,
      }));
      return project;
    },
    [update],
  );

  const removeProject = useCallback(
    (projectId: string) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        // 해당 프로젝트에 속한 태스크/루틴의 projectId를 null로
        tasks: prev.tasks.map((t) =>
          t.projectId === projectId ? { ...t, projectId: null } : t,
        ),
        routines: prev.routines.map((r) =>
          r.projectId === projectId ? { ...r, projectId: null } : r,
        ),
        lastUsedProjectId:
          prev.lastUsedProjectId === projectId ? null : prev.lastUsedProjectId,
        activeProjectFilter:
          prev.activeProjectFilter === projectId ? null : prev.activeProjectFilter,
      }));
    },
    [update],
  );

  const updateProject = useCallback(
    (projectId: string, updates: Partial<Pick<Project, 'name' | 'color' | 'archived'>>) => {
      update((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, ...updates } : p,
        ),
      }));
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
      date: string,
      options?: { slot?: SlotCoord; projectId?: string | null },
    ) => {
      const task: Task = {
        id: `item_${nanoid()}`,
        type: 'task',
        title,
        projectId: options?.projectId ?? null,
        slot: options?.slot ?? null,
        deferCount: 0,
        completedAt: null,
        date,
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({
        ...prev,
        tasks: [...prev.tasks, task],
        lastUsedProjectId: task.projectId ?? prev.lastUsedProjectId,
      }));
      return task;
    },
    [update],
  );

  const completeTask = useCallback(
    (taskId: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, completedAt: new Date().toISOString() } : t,
        ),
      }));
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
            ? { ...t, slot: null, deferCount: t.deferCount + 1, origin: 'deferred' as const }
            : t,
        ),
      }));
    },
    [update],
  );

  // 진행중: 원본 유지, 복사본을 백로그에 추가
  const continueTask = useCallback(
    (taskId: string, today: string) => {
      update((prev) => {
        const original = prev.tasks.find((t) => t.id === taskId);
        if (!original) return prev;
        const copy: Task = {
          ...original,
          id: `item_${nanoid()}`,
          slot: null,
          deferCount: 0,
          completedAt: null,
          date: today,
          createdAt: new Date().toISOString(),
          origin: 'repeated' as const,
        };
        return { ...prev, tasks: [...prev.tasks, copy] };
      });
    },
    [update],
  );

  const assignTaskSlot = useCallback(
    (taskId: string, coord: SlotCoord) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, slot: coord } : t,
        ),
      }));
    },
    [update],
  );

  const removeTask = useCallback(
    (taskId: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }));
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

  // ── Batch update (rollover 등) ──────────────────────────────
  const batchUpdate = useCallback(
    (updater: (prev: AppState) => AppState) => {
      update(updater);
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
    updateTaskTitle,
    // routine
    addRoutine,
    toggleRoutineActive,
    removeRoutine,
    // routineInstance
    completeRoutineInstance,
    uncompleteRoutineInstance,
    deferRoutineInstance,
    continueRoutineInstance,
    assignRoutineInstanceSlot,
    removeRoutineInstance,
    // misc
    batchUpdate,
    setActiveProjectFilter,
  };
}
