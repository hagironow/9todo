import { nanoid } from 'nanoid';
import type { Task, RoutineInstance, SlotCoord, AppState, ScheduledItem } from './types';

// 슬롯 배정
export function assignSlot(item: Task, coord: SlotCoord): Task;
export function assignSlot(item: RoutineInstance, coord: SlotCoord): RoutineInstance;
export function assignSlot(
  item: Task | RoutineInstance,
  coord: SlotCoord,
): Task | RoutineInstance {
  return { ...item, slot: coord };
}

// 미루기: slot을 null로 (백로그 이동), deferCount +1
export function deferItem(item: Task): Task;
export function deferItem(item: RoutineInstance): RoutineInstance;
export function deferItem(item: Task | RoutineInstance): Task | RoutineInstance {
  return { ...item, slot: null, deferCount: item.deferCount + 1 };
}

// 진행중: 원본 유지, 복사본 생성 (deferCount=0, slot=null)
// Task용 — 날짜는 오늘로 유지하되 새 ID 발급
export function continueTask(item: Task, today: string): Task {
  return {
    ...item,
    id: `item_${nanoid()}`,
    slot: null,
    deferCount: 0,
    completedAt: null,
    date: today,
    createdAt: new Date().toISOString(),
  };
}

// RoutineInstance용
export function continueRoutineInstance(item: RoutineInstance): RoutineInstance {
  return {
    ...item,
    id: `ri_${nanoid()}`,
    slot: null,
    deferCount: 0,
    completedAt: null,
  };
}

// 슬롯→슬롯 이동
export function moveSlot(item: Task, _from: SlotCoord, to: SlotCoord): Task;
export function moveSlot(item: RoutineInstance, _from: SlotCoord, to: SlotCoord): RoutineInstance;
export function moveSlot(
  item: Task | RoutineInstance,
  _from: SlotCoord,
  to: SlotCoord,
): Task | RoutineInstance {
  return { ...item, slot: to };
}

// 슬롯 점유 확인 (특정 날짜 기준)
export function isSlotOccupied(
  items: ScheduledItem[],
  coord: SlotCoord,
  date: string,
): boolean {
  return items.some((item) => {
    if (!item.slot) return false;
    if (item.slot.period !== coord.period) return false;
    if (item.slot.priority !== coord.priority) return false;
    // Task는 date 필드 보유, RoutineInstance도 date 보유
    const itemDate = 'date' in item ? item.date : undefined;
    if (itemDate !== undefined && itemDate !== date) return false;
    return true;
  });
}

// 백로그 항목 추출 (날짜 무관 — 슬롯 미배치 + 미완료)
export function getBacklogItems(state: AppState, _date?: string): (Task | RoutineInstance)[] {
  const tasks = state.tasks.filter(
    (t) => t.slot === null && t.completedAt === null,
  );
  const routineInstances = state.routineInstances.filter(
    (ri) => ri.slot === null && ri.date === _date && ri.completedAt === null,
  );
  return [...tasks, ...routineInstances];
}

// 슬롯 배정된 항목 추출 (특정 날짜)
export function getSlottedItems(state: AppState, date: string): (Task | RoutineInstance)[] {
  const tasks = state.tasks.filter(
    (t) => t.slot !== null && t.date === date && t.completedAt === null,
  );
  const routineInstances = state.routineInstances.filter(
    (ri) => ri.slot !== null && ri.date === date && ri.completedAt === null,
  );
  return [...tasks, ...routineInstances];
}
