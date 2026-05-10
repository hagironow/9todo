'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useState as useLocalState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { Task, Project, TimePeriod, Priority } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import { getToday } from '@/lib/date';
import { getDefaultStartTime, getDefaultEndTime } from '@/components/modals/RecurrenceSetupModal';

interface WeeklyTimelineViewProps {
  tasks: Task[];
  projects: Project[];
  weekDates: string[];
  timeRange?: { startHour: number; endHour: number };
  onUpdateTask?: (taskId: string, updates: { scheduledStartTime?: string; scheduledEndTime?: string; date?: string }) => void;
  onCreateTask?: (title: string, date: string, projectId: string | null) => void;
}

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const STORAGE_KEY = '9todo_timeline_range';
const HOUR_HEIGHT = 60;
const SNAP_MINUTES = 15;

function getStoredRange(): { startHour: number; endHour: number } {
  if (typeof window === 'undefined') return { startHour: 6, endHour: 24 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startHour: 6, endHour: 24 };
}

function timeToHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

function hoursToTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function snapHour(hour: number): number {
  const step = SNAP_MINUTES / 60;
  return Math.round(hour / step) * step;
}

function getTaskTimeBlock(task: Task): { startHour: number; durationHours: number } | null {
  if (task.scheduledStartTime) {
    const start = timeToHours(task.scheduledStartTime);
    if (task.scheduledEndTime) {
      const end = timeToHours(task.scheduledEndTime);
      return { startHour: start, durationHours: Math.max(end - start, 0.25) };
    }
    if (task.timerSeconds && task.timerSeconds > 0) {
      return { startHour: start, durationHours: Math.max(task.timerSeconds / 3600, 0.25) };
    }
    return { startHour: start, durationHours: 1 };
  }
  if (task.slot) {
    const defaultStart = getDefaultStartTime(task.slot.period, task.slot.priority);
    const defaultEnd = getDefaultEndTime(task.slot.period, task.slot.priority);
    const start = timeToHours(defaultStart);
    const end = timeToHours(defaultEnd);
    const duration = task.timerSeconds && task.timerSeconds > 0
      ? Math.max(task.timerSeconds / 3600, 0.25)
      : end - start;
    return { startHour: start, durationHours: duration };
  }
  return null;
}

type DragMode = 'move' | 'resize';

export default function WeeklyTimelineView({
  tasks,
  projects,
  weekDates,
  timeRange,
  onUpdateTask,
  onCreateTask,
}: WeeklyTimelineViewProps) {
  const todayStr = getToday();
  const gridRef = useRef<HTMLDivElement>(null);

  const range = timeRange ?? getStoredRange();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { startHour, endHour } = range;
  const totalHours = endHour - startHour;

  const hourLabels = useMemo(() => {
    const labels: number[] = [];
    for (let h = startHour; h < endHour; h++) labels.push(h);
    return labels;
  }, [startHour, endHour]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const d of weekDates) {
      map[d] = tasks.filter((t) => t.date === d && t.slot !== null);
    }
    return map;
  }, [tasks, weekDates]);

  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowInRange = nowHour >= startHour && nowHour < endHour;
  const nowTop = ((nowHour - startHour) / totalHours) * 100;

  const getProject = (projectId: string | null) =>
    projectId ? projects.find((p) => p.id === projectId) : null;

  // ── 인라인 태스크 생성 ──
  const [hoverSlot, setHoverSlot] = useState<{ dateIdx: number; hour: number } | null>(null);
  const [inputSlot, setInputSlot] = useState<{ dateStr: string; hour: number } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateSubmit = useCallback(() => {
    if (!inputSlot || !inputValue.trim() || !onCreateTask) return;
    onCreateTask(inputValue.trim(), inputSlot.dateStr, null);
    setInputSlot(null);
    setInputValue('');
  }, [inputSlot, inputValue, onCreateTask]);

  // ── Drag state ──
  const [dragState, setDragState] = useState<{
    taskId: string;
    mode: DragMode;
    origStartHour: number;
    origDuration: number;
    origDateIdx: number;
    currentStartHour: number;
    currentDuration: number;
    currentDateIdx: number;
  } | null>(null);

  const dragStartY = useRef(0);
  const dragStartX = useRef(0);

  const yToHour = useCallback((clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const relY = clientY - rect.top + gridRef.current.scrollTop;
    const hour = startHour + (relY / (totalHours * HOUR_HEIGHT)) * totalHours;
    return snapHour(Math.max(startHour, Math.min(hour, endHour)));
  }, [startHour, endHour, totalHours]);

  const xToDateIdx = useCallback((clientX: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const colWidth = (rect.width - 48) / 7; // 48px = time label column
    const relX = clientX - rect.left - 48;
    const idx = Math.floor(relX / colWidth);
    return Math.max(0, Math.min(idx, 6));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, taskId: string, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const block = getTaskTimeBlock(task);
    if (!block) return;

    const dateIdx = weekDates.indexOf(task.date ?? '');
    if (dateIdx === -1) return;

    dragStartY.current = e.clientY;
    dragStartX.current = e.clientX;

    setDragState({
      taskId,
      mode,
      origStartHour: block.startHour,
      origDuration: block.durationHours,
      origDateIdx: dateIdx,
      currentStartHour: block.startHour,
      currentDuration: block.durationHours,
      currentDateIdx: dateIdx,
    });
  }, [tasks, weekDates]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;

    if (dragState.mode === 'move') {
      const hourAtCursor = yToHour(e.clientY);
      const dateIdx = xToDateIdx(e.clientX);
      // 블록 시작 = 커서 위치 - 원래 커서와 블록 시작의 차이
      const hourOffset = yToHour(dragStartY.current) - dragState.origStartHour;
      let newStart = snapHour(hourAtCursor - hourOffset);
      newStart = Math.max(startHour, Math.min(newStart, endHour - dragState.origDuration));

      setDragState((prev) => prev ? { ...prev, currentStartHour: newStart, currentDateIdx: dateIdx } : null);
    } else {
      // resize
      const hourAtCursor = yToHour(e.clientY);
      const newDuration = snapHour(Math.max(0.25, hourAtCursor - dragState.origStartHour));

      setDragState((prev) => prev ? { ...prev, currentDuration: newDuration } : null);
    }
  }, [dragState, yToHour, xToDateIdx, startHour, endHour]);

  const handlePointerUp = useCallback(() => {
    if (!dragState || !onUpdateTask) { setDragState(null); return; }

    const task = tasks.find((t) => t.id === dragState.taskId);
    const hadExplicitTime = !!task?.scheduledStartTime;

    const updates: { scheduledStartTime?: string; scheduledEndTime?: string; date?: string } = {};

    if (dragState.mode === 'move') {
      const moved = Math.abs(dragState.currentStartHour - dragState.origStartHour) > 0.01
        || dragState.currentDateIdx !== dragState.origDateIdx;

      if (moved || !hadExplicitTime) {
        // 항상 시간 저장 (기존에 시간 없던 태스크도 드래그하면 시간 확정)
        updates.scheduledStartTime = hoursToTime(dragState.currentStartHour);
        updates.scheduledEndTime = hoursToTime(dragState.currentStartHour + dragState.currentDuration);
        if (dragState.currentDateIdx !== dragState.origDateIdx) {
          updates.date = weekDates[dragState.currentDateIdx];
        }
      }
    } else {
      const resized = Math.abs(dragState.currentDuration - dragState.origDuration) > 0.01;
      if (resized || !hadExplicitTime) {
        updates.scheduledStartTime = hoursToTime(dragState.origStartHour);
        updates.scheduledEndTime = hoursToTime(dragState.origStartHour + dragState.currentDuration);
      }
    }

    if (Object.keys(updates).length > 0) {
      onUpdateTask(dragState.taskId, updates);
    }

    setDragState(null);
  }, [dragState, onUpdateTask, weekDates, tasks]);

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-[var(--card)] rounded-[var(--radius)] border border-[var(--border)] overflow-hidden">
        {/* 요일 + 날짜 헤더 */}
        <div className="grid border-b border-[var(--border)]" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
          <div />
          {weekDates.map((dateStr, i) => {
            const d = new Date(dateStr + 'T00:00:00');
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} className="flex flex-col items-center py-2.5 gap-1">
                <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
                  {KO_WEEKDAYS[d.getDay()]}
                </span>
                <span
                  className={[
                    'text-[14px] leading-none',
                    isToday
                      ? 'w-6 h-6 flex items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] font-bold'
                      : 'text-[var(--muted-foreground)]',
                  ].join(' ')}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* 타임라인 본체 */}
        <div
          ref={gridRef}
          className="relative overflow-y-auto select-none"
          style={{ maxHeight: '500px' }}
          onPointerMove={dragState ? handlePointerMove : undefined}
          onPointerUp={dragState ? handlePointerUp : undefined}
        >
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: '48px repeat(7, 1fr)',
              height: `${totalHours * HOUR_HEIGHT}px`,
            }}
          >
            {/* 시간 라벨 열 */}
            <div className="relative border-r border-[var(--border)]">
              {hourLabels.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[10px] text-[var(--muted-foreground)] leading-none"
                  style={{ top: `${((h - startHour) / totalHours) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* 시간 그리드 라인 */}
            {hourLabels.map((h) => (
              <div
                key={`line-${h}`}
                className="absolute left-[48px] right-0 border-t border-[var(--border)]"
                style={{ top: `${((h - startHour) / totalHours) * 100}%`, opacity: 0.5 }}
              />
            ))}

            {/* 요일별 칼럼 */}
            {weekDates.map((dateStr, colIdx) => {
              const dayTasks = tasksByDate[dateStr] ?? [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  className={[
                    'relative',
                    colIdx < 6 ? 'border-r border-[var(--border)]' : '',
                    isToday ? 'bg-[var(--accent)]/3' : '',
                  ].join(' ')}
                >
                  {/* 현재 시간선 */}
                  {isToday && nowInRange && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${nowTop}%` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-[var(--g-error)] -ml-1" />
                        <div className="flex-1 h-[1.5px] bg-[var(--g-error)]" />
                      </div>
                    </div>
                  )}

                  {/* Task 블록들 */}
                  {dayTasks.map((task) => {
                    // 드래그 중인 태스크는 드래그 상태 기반으로 렌더
                    const isDragging = dragState?.taskId === task.id;
                    const block = getTaskTimeBlock(task);
                    if (!block) return null;

                    let renderStart = block.startHour;
                    let renderDuration = block.durationHours;
                    let renderColIdx = colIdx;

                    if (isDragging) {
                      renderStart = dragState!.currentStartHour;
                      renderDuration = dragState!.currentDuration;
                      renderColIdx = dragState!.currentDateIdx;
                    }

                    // 드래그로 다른 날짜로 이동한 경우, 원래 열에서는 안 보이게
                    if (isDragging && renderColIdx !== colIdx) return null;
                    // 드래그로 이 열에 들어온 경우는 아래에서 처리
                    if (!isDragging && dragState?.taskId === task.id) return null;

                    if (renderStart >= endHour || renderStart + renderDuration <= startHour) return null;

                    const clampedStart = Math.max(renderStart, startHour);
                    const clampedEnd = Math.min(renderStart + renderDuration, endHour);
                    const topPct = ((clampedStart - startHour) / totalHours) * 100;
                    const heightPct = ((clampedEnd - clampedStart) / totalHours) * 100;

                    const project = getProject(task.projectId);
                    const isDone = !!task.completedAt;
                    const canDrag = !!onUpdateTask && !isDone;

                    return (
                      <div
                        key={task.id}
                        className={[
                          'absolute left-0.5 right-0.5 z-10 rounded-[4px] px-1.5 py-0.5 overflow-hidden',
                          'border-l-[3px] transition-opacity group/block',
                          isDone ? 'opacity-50' : 'opacity-100',
                          isDragging ? 'opacity-75 ring-1 ring-[var(--accent)]' : '',
                          canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
                        ].join(' ')}
                        style={{
                          top: `${topPct}%`,
                          height: `${Math.max(heightPct, 2)}%`,
                          minHeight: '18px',
                          backgroundColor: project?.color ? `${project.color}18` : 'var(--muted)',
                          borderLeftColor: project?.color ?? 'var(--muted-foreground)',
                        }}
                        title={`${task.title}${task.scheduledStartTime ? ` (${task.scheduledStartTime}${task.scheduledEndTime ? `~${task.scheduledEndTime}` : ''})` : ''}`}
                        onPointerDown={canDrag ? (e) => handlePointerDown(e, task.id, 'move') : undefined}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {isDone && <Check size={8} strokeWidth={3} className="flex-shrink-0 text-[var(--g-success)]" />}
                          {project && <ColorDot color={project.color} size="sm" />}
                          <span className={[
                            'text-[10px] leading-tight truncate',
                            isDone ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]',
                          ].join(' ')}>
                            {task.title}
                          </span>
                        </div>
                        {heightPct > 5 && (
                          <span className="text-[9px] text-[var(--muted-foreground)] leading-none">
                            {hoursToTime(renderStart)}~{hoursToTime(renderStart + renderDuration)}
                          </span>
                        )}
                        {/* 하단 리사이즈 핸들 */}
                        {canDrag && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize opacity-0 group-hover/block:opacity-100 transition-opacity"
                            style={{ background: 'linear-gradient(transparent, rgba(128,128,128,0.3))' }}
                            onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, task.id, 'resize'); }}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* 시간대별 호버 + 버튼 (태스크 생성) */}
                  {onCreateTask && !dragState && hourLabels.map((h) => {
                    const topPct = ((h - startHour) / totalHours) * 100;
                    const heightPct = (1 / totalHours) * 100;
                    const isHovered = hoverSlot?.dateIdx === colIdx && hoverSlot?.hour === h;
                    const isInputting = inputSlot?.dateStr === dateStr && inputSlot?.hour === h;

                    return (
                      <div
                        key={`hover-${h}`}
                        className="absolute left-0 right-0 z-[5]"
                        style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                        onMouseEnter={() => setHoverSlot({ dateIdx: colIdx, hour: h })}
                        onMouseLeave={() => setHoverSlot(null)}
                      >
                        {isInputting ? (
                          <div className="absolute inset-0.5 z-20 flex items-center px-1.5 bg-[var(--muted)] rounded-[4px] border border-[var(--border)]">
                            <input
                              ref={inputRef}
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleCreateSubmit();
                                if (e.key === 'Escape') { setInputSlot(null); setInputValue(''); }
                              }}
                              onBlur={() => { if (!inputValue.trim()) { setInputSlot(null); setInputValue(''); } }}
                              placeholder={`${String(h).padStart(2, '0')}:00 할 일...`}
                              className="flex-1 text-[11px] text-[var(--foreground)] bg-transparent outline-none placeholder:text-[var(--muted-foreground)]"
                              autoFocus
                            />
                          </div>
                        ) : isHovered ? (
                          <button
                            onClick={() => {
                              setInputSlot({ dateStr, hour: h });
                              setInputValue('');
                              setHoverSlot(null);
                            }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <div className="w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center hover:bg-[var(--border)] transition-colors">
                              <Plus size={12} className="text-[var(--muted-foreground)]" />
                            </div>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* 드래그로 이 열에 들어온 태스크 (다른 날짜에서 이동) */}
                  {dragState && dragState.currentDateIdx === colIdx && dragState.origDateIdx !== colIdx && (() => {
                    const task = tasks.find((t) => t.id === dragState.taskId);
                    if (!task) return null;
                    const project = getProject(task.projectId);

                    const clampedStart = Math.max(dragState.currentStartHour, startHour);
                    const clampedEnd = Math.min(dragState.currentStartHour + dragState.currentDuration, endHour);
                    if (clampedStart >= endHour || clampedEnd <= startHour) return null;
                    const topPct = ((clampedStart - startHour) / totalHours) * 100;
                    const heightPct = ((clampedEnd - clampedStart) / totalHours) * 100;

                    return (
                      <div
                        key={`ghost-${task.id}`}
                        className="absolute left-0.5 right-0.5 z-10 rounded-[4px] px-1.5 py-0.5 overflow-hidden border-l-[3px] opacity-60 ring-1 ring-[var(--accent)]"
                        style={{
                          top: `${topPct}%`,
                          height: `${Math.max(heightPct, 2)}%`,
                          minHeight: '18px',
                          backgroundColor: project?.color ? `${project.color}18` : 'var(--muted)',
                          borderLeftColor: project?.color ?? 'var(--muted-foreground)',
                        }}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {project && <ColorDot color={project.color} size="sm" />}
                          <span className="text-[10px] leading-tight truncate text-[var(--foreground)]">
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[9px] text-[var(--muted-foreground)] leading-none">
                          {hoursToTime(dragState.currentStartHour)}~{hoursToTime(dragState.currentStartHour + dragState.currentDuration)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
