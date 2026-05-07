'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import type {
  AppState,
  Task,
  Routine,
  RoutineInstance,
  Project,
  Note,
  SlotCoord,
} from '@/lib/types';
import { resolveColor, hexToColorIndex, DEFAULT_THEME } from '@/lib/colors';

const STORAGE_KEY = '9block_state';
const CONSENT_KEY = '9block_storage_consent';

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
  lastUsedProjectId: null,
  activeProjectFilter: null,
  projectFirstMode: true,
  colorTheme: DEFAULT_THEME,
};

export function hasStorageConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'true';
}

export function grantStorageConsent(): void {
  localStorage.setItem(CONSENT_KEY, 'true');
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
  return resolveProjectColors(JSON.parse(json) as AppState);
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
        setState(resolveProjectColors(JSON.parse(raw) as AppState));
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
        continueCount: 0,
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

  // 진행하기: 원본의 슬롯을 해제하고 백로그로 (continueCount 증가)
  const continueTask = useCallback(
    (taskId: string, _today: string) => {
      update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                slot: null,
                completedAt: null,
                continueCount: Math.min((t.continueCount ?? 0) + 1, 9),
                origin: 'repeated' as const,
              }
            : t,
        ),
      }));
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
    // misc
    batchUpdate,
    setActiveProjectFilter,
    setColorTheme,
  };
}
