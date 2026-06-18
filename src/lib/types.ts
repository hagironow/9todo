export type TimePeriod = 'morning' | 'afternoon' | 'evening';
export type Priority = 1 | 2 | 3;

export interface SlotCoord {
  period: TimePeriod;
  priority: Priority;
}

export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Project {
  id: string;
  name: string;
  colorIndex: number;  // 0~7, 테마별 색상 인덱스
  color: string;       // resolved hex (런타임 전용, 저장 시 제외 가능)
  createdAt: string;
  archived?: boolean;
}

export interface ItemBase {
  id: string;
  title: string;
  projectId: string | null;
  createdAt: string;
}

export interface Task extends ItemBase {
  type: 'task';
  slot: SlotCoord | null; // null = 백로그
  deferCount: number;
  completedAt: string | null;
  date: string | null; // "YYYY-MM-DD" — 슬롯 배치 시 날짜 지정, 백로그는 null
  origin?: 'deferred' | 'repeated' | 'continued' | string; // 미루기/또하기 복제/또하기 원본 완료
  timerSeconds?: number; // 완료 시점의 타이머 기록 (초)
  continueCount: number; // 진행하기 횟수
  lineageId?: string; // 또하기 계보 ID (같은 계보끼리 공유)
  // 반복 투두 필드 (선택)
  recurrence?: RecurrenceType;
  daysOfWeek?: number[]; // 0=일 ~ 6=토
  startDate?: string; // 반복 시작일 "YYYY-MM-DD"
  isRecurrenceActive?: boolean; // false면 반복 비활성화
  scheduledStartTime?: string; // "HH:mm"
  scheduledEndTime?: string; // "HH:mm"
  recurrenceParentId?: string; // 반복 원본 Task ID
  defaultSlot?: SlotCoord; // 반복 투두의 기본 슬롯
  skippedDates?: string[]; // "이 날만 삭제"한 날짜 목록
  isDeferred?: boolean; // 미루기 후 원본 자리에 남겨두기 위한 플래그
}

export interface Routine extends ItemBase {
  type: 'routine';
  recurrence: RecurrenceType;
  daysOfWeek?: number[]; // 0=일 1=월 2=화 3=수 4=목 5=금 6=토 (JS Date.getDay())
  defaultSlot: SlotCoord;
  startDate: string;
  isActive: boolean;
  scheduledTime?: string; // "HH:mm" 형식 (예: "09:00")
}

export interface RoutineInstance {
  id: string;
  routineId: string;
  date: string;
  slot: SlotCoord | null; // null = 백로그
  deferCount: number;
  completedAt: string | null;
  isDeferred?: boolean; // 미루기 후 원본 자리에 남겨두기 위한 플래그
}

export const UNCATEGORIZED_ID = '__uncategorized__';

export interface Note {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
}

export interface GoalCompass {
  identity: string;
  goals: {
    today: string;
    week: string;
    month: string;
    quarter: string;
    oneYear: string;
    fiveYear: string;
  };
  affirmation: string;
}

export type GoalPeriod = 'today' | 'week' | 'month';

export interface GoalTask {
  id: string;
  title: string;
  goalPeriod: GoalPeriod;
  periodKey: string;        // "YYYY-MM-DD" | "YYYY-Www" | "YYYY-MM"
  completedAt: string | null;
  createdAt: string;
  carriedFrom?: string;     // 이관된 원본 GoalTask ID
}

export type RetroScope = 'day' | 'week' | 'month';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface RetrospectiveEntry {
  id: string;
  scope: RetroScope;
  scopeKey: string; // 'day': "YYYY-MM-DD", 'week': "YYYY-Www", 'month': "YYYY-MM"
  content: string;
  energyLevel?: EnergyLevel; // 1~5 에너지 레벨
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  projects: Project[];
  tasks: Task[];
  routines: Routine[];
  routineInstances: RoutineInstance[];
  notes: Note[];
  goalCompass: GoalCompass;
  goalCompletedDates: string[]; // (레거시) 오늘 목표 완료한 날짜 목록
  goalTasks: GoalTask[];        // 오늘/이번주/이번달 목표 태스크
  lastUsedProjectId: string | null;
  activeProjectFilter: string | null;
  projectFirstMode: boolean;
  colorTheme: string; // 'vivid' | 'pastel' | ...
  retrospectives: RetrospectiveEntry[];
  goalTodayDate?: string; // (레거시) 오늘 목표가 작성된 날짜 (리셋 판단용)
}

// 화면에서 사용하는 통합 타입 (Task로 통합)
export type ScheduledItem = Task;
