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
  date: string; // "YYYY-MM-DD"
  origin?: 'deferred' | 'repeated'; // 미루기/진행하기로 백로그에 온 경우
  timerSeconds?: number; // 완료 시점의 타이머 기록 (초)
  continueCount: number; // 진행하기 횟수
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
}

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

export interface AppState {
  projects: Project[];
  tasks: Task[];
  routines: Routine[];
  routineInstances: RoutineInstance[];
  notes: Note[];
  goalCompass: GoalCompass;
  goalCompletedDates: string[]; // 오늘 목표 완료한 날짜 목록
  lastUsedProjectId: string | null;
  activeProjectFilter: string | null;
  projectFirstMode: boolean;
  colorTheme: string; // 'vivid' | 'pastel' | ...
}

// 화면에서 사용하는 통합 타입
export type ScheduledItem = (Task | RoutineInstance) & { routineDetails?: Routine };
