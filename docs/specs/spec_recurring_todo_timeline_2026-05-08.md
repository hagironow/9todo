# Spec: 반복 투두 통합 + 위클리 타임라인 뷰

> 작성일: 2026-05-08
> 작성: planner
> 상태: 검토 중
> 범위: MVP
> 페르소나: 지호 (1차 타겟 — 바이브 코더), 수민 (2차 타겟 — 사이드 프로젝트 메이커)

---

## 0. Non-Goals 충돌 고지

이 사양은 기존 `non-goals.md`의 두 항목과 직접 충돌한다. 구현 전 해당 항목을 `non-goals.md`에서 제거해야 한다.

| Non-Goal 항목 | 충돌 이유 | 조치 |
|---|---|---|
| 타임라인 시각화 ("재고하지 않음") | 위클리 타임라인 뷰가 이 항목에 해당 | non-goals.md에서 제거, 재고 사유 기록 |
| 분 단위 시간 블록 ("재고하지 않음") | 타임라인 뷰에서 시간 축(HH:mm)을 사용 | 동일 |

또한 `core-concepts.md`의 용어 규칙 — "타임라인은 사용하지 않는다. 9todo은 시간표(격자)다." — 도 이번 변경으로 갱신이 필요하다.

결정 사유 (기록용): 반복 투두에 시작/종료 시간이 생기면서, 위클리 뷰에서 시간 기반 레이아웃이 자연스럽게 요구됨. 데이 뷰(3x3 격자)는 그대로 유지하며, 캘린더 섹션의 위클리 뷰만 타임라인으로 대체하는 제한적 도입.

---

## 1. 한 줄 요약

루틴(Routine)을 별도 개념으로 분리하던 방식을 폐기하고, 투두(Task)에 반복(recurrence) 속성을 추가해 통합하며, 반복 투두의 시간 정보를 위클리 캘린더에서 타임라인으로 시각화한다.

---

## 2. 배경

### 페르소나의 좌절
- 지호: "매일 반복하는 배포 루틴을 매번 새로 적음" (personas.md — 수민의 좌절이기도 함)
- 루틴과 투두가 별도 개념으로 분리되어 있어 관리 포인트가 두 곳. 루틴 삭제 시 RoutineInstance도 별도 관리 필요.
- 반복 투두의 시간(예: 오전 9시 스탠드업)이 캘린더 뷰에서 보이지 않아 주간 계획 수립이 어려움.

### 매칭 시나리오
- **시나리오 E**: "루틴 등록과 자동 재생성" — 이번 변경으로 루틴 대신 반복 투두로 동일 흐름을 처리.
- **시나리오 A**: "아침에 오늘의 시간표 세팅하기" — QuickInput에서 반복 설정을 바로 할 수 있어 세팅 속도 향상.

### 관련 vision/positioning
- vision.md: "태스크(일회성)와 루틴(반복)을 반복 여부로 자동 분류" — 분류 로직은 유지하되 데이터 구조를 통합.
- positioning.md: "반복 여부 = 자동 분류: 태스크(일회성) vs 루틴(반복)" — Task.recurrence 유무로 동일하게 자동 분류 가능.

---

## 3. 기능 상세

### 3-1. 반복 투두 설정 UX

#### 진입점
QuickInput 컴포넌트 (`src/components/quick-input/QuickInput.tsx`) 내부, 프로젝트 도트 버튼 오른쪽에 Repeat 아이콘 버튼 추가.

#### UX 흐름
1. 사용자가 QuickInput에 제목 입력
2. Repeat 아이콘(lucide-react `Repeat`) 클릭
3. RecurrenceSetupModal 오픈 (기존 RoutineSetupModal을 재활용/리네이밍)
4. 모달에서 설정:
   - 반복 주기: 매일 / 매주 / 2주마다 / 매월
   - 요일 선택 (매주/2주마다일 때)
   - 시작 시간 (HH:mm, 선택)
   - 종료 시간 (HH:mm, 선택)
   - 기본 슬롯 (오전/오후/저녁 + 1~3순위)
   - 시작일
   - 프로젝트
5. 저장 시 해당 Task가 recurrence 속성을 가짐
6. QuickInput의 Repeat 아이콘이 활성화 상태(강조)로 표시

#### 반복 투두 표시
- 슬롯 카드(ItemCard)에서 반복 투두는 `Repeat` 아이콘 표시 (현재 루틴 인스턴스에 이미 사용 중)
- 미루기: `SkipForward` 유지
- 또하기: `RotateCcw` (RepeatCountIcon) 유지

#### 화면/상태 변화
- QuickInput: Repeat 아이콘 버튼 추가. 반복 설정 시 아이콘 강조.
- RecurrenceSetupModal: 기존 RoutineSetupModal과 동일 구조. "루틴 삭제" 대신 "반복 해제" 액션.
- ItemCard: 반복 투두 시 Repeat 아이콘 표시 (이미 루틴 인스턴스에 적용된 로직 재사용).

---

### 3-2. 위클리 타임라인 뷰

> **주의**: 데이 뷰(3x3 격자 슬롯)는 변경 없음. 캘린더 섹션의 위클리 뷰만 타임라인으로 대체.

#### 현재 상태
`src/components/calendar/CalendarView.tsx`의 위클리 뷰 — 요일 7칸 그리드에 투두/루틴 목록을 텍스트로 표시.

#### 변경 후
위클리 뷰를 시간 축 기반 타임라인으로 교체:
- 세로축: 시간 (기본 06:00~24:00, 1시간 간격 눈금)
- 가로축: 요일 7칸 (일~토)
- 시간이 설정된 반복 투두 및 일반 투두(시간 있는 경우): 해당 시간대 블록으로 표시
- 시간이 없는 투두: 상단 "시간 미지정" 구역에 목록 표시 (Google Calendar의 all-day 구역 방식)
- 현재 시간 표시선 (오늘 열에만)

#### 시간 범위 커스텀
- 사용자가 표시 시작/종료 시간을 설정 가능 (설정 패널 또는 인라인 토글)
- 기본값: 06:00~24:00
- 설정값은 localStorage에 저장

#### 화면/상태 변화
- CalendarView 내 위클리 뷰 섹션 전체 교체 (먼슬리 뷰는 변경 없음)
- 뷰 토글: "이번주" | "이번달" 유지, "이번주" 선택 시 타임라인 렌더
- 시간 블록 클릭 시 해당 투두 상세 또는 편집 (기존 클릭 인터랙션 유지)

---

## 4. 데이터 모델 변경

### 4-1. Task 타입 확장 (`src/lib/types.ts`)

```typescript
// 기존
export interface Task extends ItemBase {
  type: 'task';
  slot: SlotCoord | null;
  deferCount: number;
  completedAt: string | null;
  date: string | null;
  origin?: 'deferred' | 'repeated' | 'continued';
  timerSeconds?: number;
  continueCount: number;
  lineageId?: string;
}

// 변경 후 — recurrence 관련 필드 추가
export interface Task extends ItemBase {
  type: 'task';
  slot: SlotCoord | null;
  deferCount: number;
  completedAt: string | null;
  date: string | null;
  origin?: 'deferred' | 'repeated' | 'continued';
  timerSeconds?: number;
  continueCount: number;
  lineageId?: string;
  // --- 반복 투두 필드 (선택) ---
  recurrence?: RecurrenceType;           // 없으면 일회성 태스크
  daysOfWeek?: number[];                 // 요일 필터 (recurrence가 weekly/biweekly일 때)
  startDate?: string;                    // 반복 시작일 "YYYY-MM-DD"
  isRecurrenceActive?: boolean;          // false면 반복 비활성화 (소프트 삭제)
  scheduledStartTime?: string;           // "HH:mm" — 타임라인 표시용 시작 시간
  scheduledEndTime?: string;             // "HH:mm" — 타임라인 표시용 종료 시간
  recurrenceParentId?: string;           // 반복의 원본 Task ID (인스턴스 식별용)
}
```

### 4-2. Routine / RoutineInstance 처리 전략

기존 `Routine`, `RoutineInstance` 타입과 관련 코드는 **즉시 삭제하지 않는다.** 마이그레이션 전략:

1. **신규 생성**: 모든 새 반복 항목은 `Task` + `recurrence` 필드로 생성
2. **기존 데이터 마이그레이션**: `useAppData.ts`의 로드 시점에 마이그레이션 함수 실행
   - 기존 `Routine`을 `Task` (recurrence 포함)로 변환
   - 기존 `RoutineInstance`를 `Task` (recurrenceParentId 포함)로 변환
   - 변환 후 `AppState.routines` / `routineInstances`를 빈 배열로 초기화
3. **타입에서 Routine/RoutineInstance 제거**: 마이그레이션 함수 완성 후 단계적 제거

### 4-3. 반복 투두 인스턴스 생성 로직

기존 `src/lib/routine.ts`의 `shouldCreateInstance` / `createRoutineInstance` 함수를 일반화.
- `shouldCreateInstance(task: Task, date: string): boolean` — `task.recurrence` 기반
- `createRecurringInstance(task: Task, date: string): Task` — `recurrenceParentId` 설정, 새 `id` 부여
- 파일명을 `src/lib/recurrence.ts`로 변경 (기존 `routine.ts`는 deprecate)

### 4-4. AppState 변경

```typescript
export interface AppState {
  projects: Project[];
  tasks: Task[];
  routines: Routine[];           // 마이그레이션 기간 중 유지, 이후 제거
  routineInstances: RoutineInstance[]; // 동일
  notes: Note[];
  goalCompass: GoalCompass;
  goalCompletedDates: string[];
  lastUsedProjectId: string | null;
  activeProjectFilter: string | null;
  projectFirstMode: boolean;
  colorTheme: string;
  retrospectives: RetrospectiveEntry[];
  goalTodayDate?: string;
  // 신규
  weeklyTimelineRange?: {         // 타임라인 표시 시간 범위
    startHour: number;            // 기본 6
    endHour: number;              // 기본 24
  };
}
```

### 4-5. ScheduledItem 타입 갱신

```typescript
// 기존
export type ScheduledItem = (Task | RoutineInstance) & { routineDetails?: Routine };

// 변경 후 — Task만으로 통합
export type ScheduledItem = Task;
```

---

## 5. UI 변경

### 5-1. 신규 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|---|---|---|
| RecurrenceSetupModal | `src/components/modals/RecurrenceSetupModal.tsx` | 기존 RoutineSetupModal 리네임 + Task 기반으로 수정. "루틴 삭제" → "반복 해제" |
| WeeklyTimelineView | `src/components/calendar/WeeklyTimelineView.tsx` | CalendarView에서 위클리 섹션을 분리한 새 컴포넌트. 시간 축 타임라인 렌더링 |

### 5-2. 수정 컴포넌트

| 컴포넌트 | 경로 | 변경 내용 |
|---|---|---|
| QuickInput | `src/components/quick-input/QuickInput.tsx` | Repeat 아이콘 버튼 추가. RecurrenceSetupModal 연결 |
| ItemCard | `src/components/timetable/ItemCard.tsx` | `isRoutineInstance` 판별 로직을 `task.recurrence !== undefined`로 교체. Repeat 아이콘 표시 조건 갱신 |
| CalendarView | `src/components/calendar/CalendarView.tsx` | 위클리 뷰 섹션을 WeeklyTimelineView로 교체. 루틴 관련 렌더 로직 제거 |
| useAppData | `src/hooks/useAppData.ts` | 마이그레이션 함수 추가. addRoutine/updateRoutine/removeRoutine 등 루틴 관련 액션을 Task 기반으로 교체 또는 deprecate |
| useDailyRollover | `src/hooks/useDailyRollover.ts` | RoutineInstance 생성 로직을 Task recurrence 기반으로 교체 |
| page.tsx | `src/app/page.tsx` | RoutineSetupModal → RecurrenceSetupModal. addRoutine/updateRoutine → addTask/updateTask. RoutineInstance 관련 핸들러 제거 |
| RoutineSection | `src/components/timetable/RoutineSection.tsx` | 삭제 또는 Task 기반으로 흡수 (루틴 섹션이 별도로 존재하지 않음) |
| RoutineSlotCell | `src/components/timetable/RoutineSlotCell.tsx` | 삭제 또는 ItemCard로 통합 |

### 5-3. 삭제 대상 파일 (마이그레이션 완료 후)

- `src/components/modals/RoutineSetupModal.tsx`
- `src/components/timetable/RoutineSection.tsx`
- `src/components/timetable/RoutineSlotCell.tsx`
- `src/lib/routine.ts` (recurrence.ts로 교체)
- `src/components/routine/RoutineCalendarView.tsx`

### 5-4. 아이콘 정리 (최종 정의)

| 용도 | 아이콘 | lucide 이름 | 현재 상태 |
|---|---|---|---|
| 반복 투두 표시 (카드) | 반복 아이콘 | `Repeat` | 이미 ItemCard에서 루틴 인스턴스에 사용 중 — 조건만 교체 |
| QuickInput 반복 설정 버튼 | 반복 아이콘 | `Repeat` | 신규 추가 |
| 미루기 | 앞으로 건너뛰기 | `SkipForward` | 유지 |
| 또하기 | 시계 반대 방향 회전 | `RotateCcw` (RepeatCountIcon) | 유지 |

---

## 6. 구현 태스크

### Developer

#### Phase A: 데이터 모델 + 마이그레이션 (선행)
- [ ] `src/lib/types.ts` — Task 타입에 recurrence 필드 추가. ScheduledItem 타입 갱신
- [ ] `src/lib/recurrence.ts` 신규 작성 — shouldCreateInstance, createRecurringInstance (Task 기반)
- [ ] `src/hooks/useAppData.ts` — Routine → Task 마이그레이션 함수 작성 및 로드 시점 실행
- [ ] `src/hooks/useAppData.ts` — addTask에 recurrence 파라미터 추가. 루틴 관련 액션 교체
- [ ] `src/hooks/useDailyRollover.ts` — RoutineInstance 생성 로직을 Task recurrence 기반으로 교체

#### Phase B: 반복 설정 UX
- [ ] `src/components/modals/RecurrenceSetupModal.tsx` 신규 — RoutineSetupModal 기반, Task 타입으로 입출력 변경. "반복 해제" 액션 추가. 시작/종료 시간 필드 유지
- [ ] `src/components/quick-input/QuickInput.tsx` — Repeat 아이콘 버튼 추가. RecurrenceSetupModal 연결
- [ ] `src/components/timetable/ItemCard.tsx` — isRoutineInstance 판별 로직 교체 (recurrence 유무 기반)
- [ ] `src/app/page.tsx` — RoutineSetupModal → RecurrenceSetupModal 교체. 루틴 핸들러 정리

#### Phase C: 위클리 타임라인 뷰
- [ ] `src/components/calendar/WeeklyTimelineView.tsx` 신규 — 시간 축 세로 타임라인. 시간 있는 항목 블록 표시, 시간 없는 항목 상단 목록 표시. 현재 시간선.
- [ ] `src/components/calendar/CalendarView.tsx` — 위클리 섹션을 WeeklyTimelineView로 교체. 루틴 렌더 로직 제거
- [ ] `src/hooks/useAppData.ts` — weeklyTimelineRange 상태 추가 + 저장/로드

#### Phase D: 정리
- [ ] 마이그레이션 완료 확인 후 루틴 관련 파일 삭제
- [ ] `src/lib/types.ts`에서 Routine, RoutineInstance 타입 제거
- [ ] `docs/product/non-goals.md` — 타임라인 시각화, 분 단위 시간 블록 항목 갱신
- [ ] `docs/product/core-concepts.md` — 루틴 개념 업데이트, 타임라인 용어 규칙 갱신

### Design
- [ ] QuickInput Repeat 버튼 — 비활성/활성 상태 스타일
- [ ] RecurrenceSetupModal — 시작/종료 시간 입력 필드 디자인
- [ ] WeeklyTimelineView — 시간 축, 블록 카드, 시간 미지정 구역, 현재 시간선 디자인

---

## 7. 비-목표 (이 사양에서 하지 않는 것)

- 데이 뷰(3x3 격자 슬롯)에 타임라인 적용 — 데이 뷰는 우선순위 기반 그대로 유지
- 먼슬리 뷰 변경 — 캘린더 그리드 그대로 유지
- 분 단위 드래그로 시간 조정 (Google Calendar식) — 블록 표시만, 드래그 리사이즈 없음
- 알림/리마인더 — non-goals 유지
- 서버 동기화 — non-goals 유지
- 반복 투두의 예외 날짜 지정 (특정 날 건너뛰기) — Phase 2

---

## 8. 검증 방법

### 반복 투두 생성
1. QuickInput에 "쓰레드 배포" 입력
2. Repeat 아이콘 클릭 → RecurrenceSetupModal 오픈 확인
3. 매일, 오전, 1순위, 시작 09:00, 종료 09:30 설정 후 저장
4. 해당 투두가 오늘 오전 1순위 슬롯에 배치되고 Repeat 아이콘 표시 확인
5. 내일 날짜로 이동 시 동일 투두가 자동 생성되어 있는지 확인

### 기존 루틴 마이그레이션
1. 기존에 루틴이 있는 상태에서 앱 로드
2. AppState.routines가 Task로 변환되어 있는지 확인 (로컬스토리지 확인)
3. 기존 루틴 인스턴스가 Task (recurrenceParentId 보유)로 변환되어 있는지 확인
4. 변환된 반복 투두가 슬롯에 정상 표시되는지 확인

### 위클리 타임라인 뷰
1. 캘린더 섹션에서 "이번주" 탭 클릭
2. 세로 시간 축 (06:00~24:00) 표시 확인
3. 시간이 있는 반복 투두가 해당 시간 블록으로 표시되는지 확인
4. 시간이 없는 투두가 상단 "시간 미지정" 구역에 표시되는지 확인
5. 오늘 열에 현재 시간선 표시 확인
6. "이번달" 탭 전환 시 기존 먼슬리 뷰 그대로 표시 확인

### 아이콘 정리
1. 반복 투두 카드: Repeat 아이콘 표시 확인
2. 미루기 버튼: SkipForward 아이콘 유지 확인
3. 또하기 버튼: RotateCcw 아이콘 유지 확인
4. 일반 투두 카드: Repeat 아이콘 미표시 확인

---

## 9. 미해결 / 결정 필요

1. **반복 투두의 슬롯 자동 배치 방식**: 기존 루틴은 `defaultSlot`을 가져 매일 해당 슬롯에 자동 배치됨. 반복 투두도 동일하게 `slot` 필드를 기본값으로 설정할지, 아니면 백로그에 생성 후 수동 배치할지.
   - 제안: `recurrenceDefaultSlot` 필드로 기존 방식 유지 (자동 배치)

2. **recurrenceParentId vs 독립 인스턴스**: 반복 투두가 매일 생성될 때 원본 Task를 참조하는 인스턴스 방식(현행 RoutineInstance)을 유지할지, 또는 완전히 독립적인 Task로 복제할지.
   - 현행 RoutineInstance 방식은 원본 수정 시 모든 인스턴스에 반영 가능. 독립 복제는 개별 수정에 유리.
   - 제안: recurrenceParentId 참조 방식 유지 (현행 로직 최대 재사용)

3. **위클리 타임라인에서 시간 미설정 반복 투두 표시**: 시간이 없는 반복 투두는 타임라인에서 어디에 표시할지. 슬롯(오전/오후/저녁) 기준으로 시간대 블록에 묶어 표시하는 방식도 고려 가능.

4. **RoutineSection / RoutineSlotCell 삭제 타이밍**: TimetableGrid에서 이 컴포넌트들이 어떻게 사용되는지 추가 확인 후 삭제 순서 결정 필요.

---

## 10. 다음 단계

1. **developer** 호출 — Phase A(데이터 모델 + 마이그레이션) 우선 구현
2. **developer** 호출 — Phase B(반복 설정 UX) 병렬 가능 (단, Phase A 타입 확정 후)
3. **design** 호출 — RecurrenceSetupModal 시간 필드, QuickInput Repeat 버튼, WeeklyTimelineView UI (Phase B, C와 병렬)
4. **developer** 호출 — Phase C(위클리 타임라인 뷰)
5. Phase D(정리)는 A~C 완료 후 진행
