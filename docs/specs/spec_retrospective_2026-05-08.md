# Spec: 회고 (Retrospective)

> 작성일: 2026-05-08
> 작성: planner
> 상태: 검토 중
> 범위: 다음 단계 (Phase 1.5 — MVP 이후 첫 확장)
> 페르소나: 지호 (1차), 수민 (2차)

---

## 1. 한 줄 요약

태스크/루틴에 메모를 남기고, 일간/주간/월간 단위로 회고를 작성할 수 있는 반성·성장 루프 기능.

---

## 2. 배경

### 현재 상태 (코드베이스 기반)

- **Note** 타입이 존재하지만 `projectId` 단위로만 연결됨. 태스크/루틴 인스턴스에는 메모를 붙일 수 없다.
- **GoalCompass**는 오늘/주간/월간/분기/1년/5년 목표를 작성하는 칸이 있지만, 회고(돌아보기) 텍스트를 저장하는 필드는 없다.
- **ProjectDetailView**는 프로젝트 단위의 태스크 이력 + 노트를 볼 수 있지만, 태스크 단건 상세 뷰는 없다.
- 사이드바 FILTERS 배열에는 `null`(오늘)과 `__calendar__`(캘린더)만 있다. `__retrospective__` 같은 전용 뷰 슬롯이 없다.

### 왜 필요한가

**지호의 좌절 (personas.md 인용):**
> "할 일이 20개인데 실제로 끝내는 건 2개."

완료 체크 후 아무것도 남지 않는다. "왜 이게 3번 미뤄졌지?", "이번 주 실제로 뭘 했지?"를 돌아볼 곳이 없다. 게임처럼 슬롯을 깨는 쾌감은 있지만, **깨고 나서 쌓이는 것**이 없다.

**수민의 좌절 (personas.md 인용):**
> "퇴근 후 '뭐부터 하지?' 고민하다 넷플릭스 시청."

주간 회고가 있으면 "지난주에 이 프로젝트를 놓쳤다"를 인식하고 이번 주 슬롯 배치에 반영할 수 있다.

### 목표

1. 태스크/루틴 인스턴스 단건에 메모(회고 기록)를 남길 수 있다.
2. 일간/주간/월간 단위 회고 텍스트를 작성하고 보관할 수 있다.
3. 사이드바에서 "회고" 뷰로 바로 진입할 수 있다.

### 성공 기준

- 지호가 태스크 완료 직후 "이게 왜 어려웠는지" 한 줄 메모를 남길 수 있다.
- 일요일 저녁에 사이드바 → "회고" → 주간 회고 탭을 열어 이번 주 완료/미뤄진 항목을 보며 회고 텍스트를 작성할 수 있다.
- GoalCompass의 주간 목표 칸과 주간 회고 칸이 나란히 보여, "목표 vs 실제"를 한눈에 비교할 수 있다.

---

## 3. 기능 상세 설계

### 3-1. 태스크/루틴 상세 뷰 (항목 메모)

#### 진입점

- 시간표 슬롯 카드, 백로그 행, ProjectDetailView의 TaskRow 등 항목이 표시되는 곳에서 **항목 제목을 클릭(또는 길게 탭)** 하면 상세 패널이 열린다.
- 현재 완료/미루기/또하기 액션 버튼과 충돌하지 않도록, 제목 텍스트 영역 클릭을 진입점으로 사용한다.
- 모바일에서는 스와이프업 시트(bottom sheet), 데스크탑에서는 우측 슬라이드인 패널 또는 모달.

#### 상세 패널 표시 정보

| 항목 | 표시 방식 |
|---|---|
| 제목 | 인라인 편집 가능 텍스트 |
| 유형 | 태스크 / 루틴 뱃지 |
| 날짜 | YYYY-MM-DD, 슬롯 배치된 날짜 (없으면 "백로그") |
| 시간대 + 우선순위 | "오전 1순위" 형태 |
| 프로젝트 | 컬러 도트 + 이름, 탭하면 프로젝트 변경 |
| 상태 | 완료됨 / 미완료 / 미뤄짐 (deferCount 표시) |
| 투입 시간 | timerSeconds 기반, "25m" 형태 |
| 메모 | 자유 텍스트, 여러 줄 가능 |

#### 메모 기능

- 메모는 항목(태스크 또는 루틴 인스턴스)에 직접 연결되는 자유 텍스트 필드.
- 저장은 자동(blur 시) 또는 저장 버튼.
- 루틴 인스턴스 메모는 인스턴스별로 독립 저장 (날짜가 다른 같은 루틴은 각자의 메모를 가짐).
- 메모 입력창 플레이스홀더: "오늘 이 작업은 어땠나요?"

---

### 3-2. 주기별 회고 뷰

#### 진입점

사이드바 뷰 섹션에 "회고" 항목 추가 → `activeFilter = '__retrospective__'` 로 진입.
GoalCompass 섹션 내 회고 탭도 선택적으로 지원 (GoalCompass 연계 — 3-3 참고).

#### 탭 구성

회고 뷰는 3개 탭으로 구성:

| 탭 | 범위 | 요약 데이터 |
|---|---|---|
| 오늘 | 선택된 날짜 (기본값: 오늘) | 완료된 항목 목록, 미뤄진 항목 목록 |
| 이번 주 | ISO 월요일~일요일 기준 | 날짜별 완료 수, 총 완료/총 미룸 |
| 이번 달 | 1일~말일 | 주별 완료 수 집계 |

#### 각 탭 레이아웃

```
[탭: 오늘 | 이번 주 | 이번 달]

── 요약 카드 ──────────────────────────
 완료  |  미룸  |  투입 시간
  5    |   2    |   1h 40m
──────────────────────────────────────

── 완료된 항목 ────────────────────────
 ✓ 플로디 사이드바 리팩터링    [프로젝트 도트] [메모 아이콘]
 ✓ 쓰레드 배포 (루틴)          [프로젝트 도트]
──────────────────────────────────────

── 미뤄진 항목 ────────────────────────
 → 랜딩 페이지 작성 (3회 미룸)
──────────────────────────────────────

── 회고 메모 ──────────────────────────
 [오늘 회고를 남겨보세요...           ]
 [                                   ]
                              [저장]
──────────────────────────────────────
```

#### 주간 탭 추가 요소

- 날짜별 완료 수를 바 차트(간단한 CSS 높이 비율) 또는 도트 표시로 시각화.
- "이번 주 목표 (GoalCompass.goals.week)" 가 상단에 표시되어 목표 vs 실제 대조.

#### 월간 탭 추가 요소

- 주별 완료 수 집계 (1주차, 2주차, ...).
- "이번 달 목표 (GoalCompass.goals.month)" 상단 표시.

---

### 3-3. GoalCompass 연계

현재 GoalCompass는 목표를 **작성**하는 곳이다. 회고는 **돌아보는** 행위로, GoalCompass 확장 내에 회고 텍스트 필드를 추가한다.

GoalCompass 펼침 패널(현재 identity → goals → affirmation 순)에 회고 섹션을 추가:

```
── GoalCompass 펼침 내부 ───────────────
 [기존: 정체성 / 목표 계층 / 확언]

 ── 회고 ──────────────────────────────
 오늘  이번 주  이번 달
 [오늘 돌아보기를 작성해보세요...      ]
──────────────────────────────────────
```

- GoalCompass 내 회고는 미니멀 버전. 탭 전환으로 오늘/주간/월간 회고 텍스트만 입력.
- 전체 회고 뷰(완료 목록, 요약 통계 포함)는 사이드바 → 회고로 진입.

---

### 3-4. 사이드바 회고 메뉴

현재 FILTERS 배열:
```ts
const FILTERS = [
  { id: null, label: '오늘' },
  { id: '__calendar__', label: '캘린더' },
];
```

변경 후:
```ts
const FILTERS = [
  { id: null, label: '오늘' },
  { id: '__calendar__', label: '캘린더' },
  { id: '__retrospective__', label: '회고' },
];
```

- 아이콘: `BookOpen` (lucide-react) 또는 텍스트만.
- 클릭 시 메인 영역이 RetrospectiveView로 전환 (ProjectDetailView / CalendarView와 동일한 패턴).

---

## 4. 데이터 모델

### 4-1. 타입 추가/변경

#### Task에 memo 필드 추가

```ts
export interface Task extends ItemBase {
  type: 'task';
  slot: SlotCoord | null;
  deferCount: number;
  completedAt: string | null;
  date: string | null;
  origin?: 'deferred' | 'repeated';
  timerSeconds?: number;
  continueCount: number;
  memo?: string;                // 신규: 항목별 메모 (회고 기록)
}
```

#### RoutineInstance에 memo 필드 추가

```ts
export interface RoutineInstance {
  id: string;
  routineId: string;
  date: string;
  slot: SlotCoord | null;
  deferCount: number;
  completedAt: string | null;
  memo?: string;                // 신규: 인스턴스별 메모
}
```

#### RetrospectiveEntry (신규 타입)

주기별 회고 텍스트를 저장하는 독립 타입. GoalCompass 내의 목표 텍스트와 분리.

```ts
export type RetroScope = 'day' | 'week' | 'month';

export interface RetrospectiveEntry {
  id: string;
  scope: RetroScope;
  scopeKey: string;    // 'day': "YYYY-MM-DD", 'week': "YYYY-Www", 'month': "YYYY-MM"
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

`scopeKey` 예시:
- 일간: `"2026-05-08"`
- 주간: `"2026-W19"` (ISO week)
- 월간: `"2026-05"`

#### AppState에 retrospectives 필드 추가

```ts
export interface AppState {
  // 기존 필드들...
  retrospectives: RetrospectiveEntry[];  // 신규
}
```

### 4-2. API (로컬 JSON 기준 — 함수 단위)

현재 useAppData 훅에 아래 함수 추가 필요:

| 함수 | 설명 |
|---|---|
| `updateTaskMemo(taskId, memo)` | Task.memo 업데이트 |
| `updateRoutineInstanceMemo(instanceId, memo)` | RoutineInstance.memo 업데이트 |
| `upsertRetrospective(scope, scopeKey, content)` | 회고 저장 (없으면 생성, 있으면 업데이트) |
| `getRetrospective(scope, scopeKey)` | 특정 회고 조회 |

### 4-3. 마이그레이션 영향

- `memo` 필드는 optional(`?`)이므로 기존 로컬 데이터 구조 호환성 유지. 별도 마이그레이션 스크립트 불필요.
- `retrospectives` 배열은 EMPTY_STATE에 빈 배열로 추가. 기존 저장 데이터 로드 시 없으면 빈 배열로 초기화.

---

## 5. UI 변경

### 5-1. 신규 컴포넌트

| 컴포넌트 경로 | 역할 |
|---|---|
| `src/components/retrospective/RetrospectiveView.tsx` | 회고 뷰 컨테이너 (탭: 오늘/이번 주/이번 달) |
| `src/components/retrospective/RetroSummaryCards.tsx` | 완료/미룸/투입 시간 요약 카드 3개 |
| `src/components/retrospective/RetroItemList.tsx` | 완료/미뤄진 항목 목록 |
| `src/components/retrospective/RetroMemoInput.tsx` | 회고 텍스트 입력 + 저장 |
| `src/components/retrospective/WeeklyBar.tsx` | 주간 탭 날짜별 완료 수 바 시각화 |
| `src/components/item-detail/ItemDetailPanel.tsx` | 태스크/루틴 인스턴스 상세 패널 (슬라이드인/바텀시트) |
| `src/components/goal-compass/GoalCompassRetro.tsx` | GoalCompass 내 회고 미니 섹션 |

### 5-2. 재사용 컴포넌트

| 재사용 | 출처 |
|---|---|
| `Dialog` | `src/components/ui/Dialog.tsx` — 모바일 모달 기반 |
| `StatCard` | `ProjectDetailView.tsx` 내 StatCard — 동일 레이아웃 활용 가능 |
| `NoteRow` 패턴 | `ProjectDetailView.tsx` — 메모 행 UI 참고 |

### 5-3. 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `src/lib/types.ts` | Task.memo, RoutineInstance.memo, RetrospectiveEntry, AppState.retrospectives 추가 |
| `src/hooks/useAppData.ts` | updateTaskMemo, updateRoutineInstanceMemo, upsertRetrospective 추가 |
| `src/components/layout/Sidebar.tsx` | FILTERS 배열에 회고 항목 추가 |
| `src/app/page.tsx` | `activeFilter === '__retrospective__'` 분기 처리 + RetrospectiveView 렌더링 |
| `src/components/goal-compass/GoalCompass.tsx` | GoalCompassRetro 섹션 마운트 |
| `src/components/timetable/TimetableGrid.tsx` | 슬롯 카드 항목 제목 클릭 → ItemDetailPanel 열기 |
| `src/components/project-detail/ProjectDetailView.tsx` | TaskRow 클릭 → ItemDetailPanel 열기 |

---

## 6. UX 흐름

### 흐름 A: 태스크 완료 직후 메모 남기기

1. 슬롯에서 태스크 완료(체크) → 컨페티 이펙트.
2. 완료 직후 슬롯 카드가 fade-out 되기 전(또는 ProjectDetailView에서 완료 처리 후) 항목 제목 클릭 → ItemDetailPanel 열림.
3. 메모 인풋에 "GPT API 호출 지연 문제로 생각보다 오래 걸렸다" 입력 → blur 시 자동 저장.
4. 패널 닫기.

### 흐름 B: 주간 회고 작성

1. 사이드바 → "회고" 클릭.
2. RetrospectiveView 열림, 기본 탭: "이번 주".
3. 상단: 이번 주 목표(GoalCompass.goals.week) 표시.
4. 요약 카드: 완료 12 / 미룸 4 / 투입 2h 30m.
5. 완료 항목 목록 확인, 미뤄진 항목 목록 확인.
6. 하단 메모 인풋에 주간 회고 작성 후 저장.
7. 다음 주 GoalCompass.goals.week를 업데이트하러 GoalCompass로 이동.

### 흐름 C: GoalCompass 내 회고 (간이)

1. GoalCompass 펼치기.
2. 기존 목표 계층 하단에 "회고" 섹션이 있음.
3. "오늘 / 이번 주 / 이번 달" 탭 중 하나 선택.
4. 텍스트 입력 → 저장.
5. 상세 회고가 필요하면 사이드바 → 회고로 진입.

### 화면/상태 변화

| 상황 | 상태 |
|---|---|
| 항목 메모 없음 | 상세 패널에 빈 플레이스홀더 |
| 회고 뷰 오늘 탭, 완료 없음 | "오늘은 완료된 항목이 없어요" 빈 상태 메시지 |
| 회고 뷰 주간 탭, 데이터 있음 | 바 차트 + 항목 목록 + 메모 인풋 |
| 회고 텍스트 저장 중 | 버튼 비활성 (저장 중...) |
| 로컬 저장 완료 | 버튼 원복 (저장됨 토스트는 선택적) |

---

## 7. 구현 태스크

### 1단계: 데이터 모델 (Developer)

- [ ] `src/lib/types.ts` — Task.memo, RoutineInstance.memo 필드 추가
- [ ] `src/lib/types.ts` — RetrospectiveEntry, RetroScope 타입 추가
- [ ] `src/lib/types.ts` — AppState.retrospectives 필드 추가
- [ ] `src/hooks/useAppData.ts` — EMPTY_STATE에 retrospectives: [] 추가
- [ ] `src/hooks/useAppData.ts` — updateTaskMemo 함수 구현
- [ ] `src/hooks/useAppData.ts` — updateRoutineInstanceMemo 함수 구현
- [ ] `src/hooks/useAppData.ts` — upsertRetrospective 함수 구현

### 2단계: ItemDetailPanel (Developer + Design 병렬)

- [ ] `src/components/item-detail/ItemDetailPanel.tsx` 신규 컴포넌트 작성
  - Props: item (Task | RoutineInstance), routineDetails?, projects, onClose, onUpdateMemo, onComplete, onDefer, onRepeat
  - 모바일: bottom sheet (fixed, z-50, slide-up 애니메이션)
  - 데스크탑: 우측 슬라이드인 패널 또는 Dialog 사용
- [ ] `src/components/timetable/TimetableGrid.tsx` — 슬롯 카드 항목 제목 클릭 핸들러 연결
- [ ] `src/components/project-detail/ProjectDetailView.tsx` — TaskRow 클릭 핸들러 연결
- [ ] `src/app/page.tsx` — ItemDetailPanel 상태(selectedItem) 및 핸들러 추가

### 3단계: RetrospectiveView (Developer + Design 병렬)

- [ ] `src/components/retrospective/RetrospectiveView.tsx` — 탭 컨테이너
- [ ] `src/components/retrospective/RetroSummaryCards.tsx` — 요약 카드
- [ ] `src/components/retrospective/RetroItemList.tsx` — 완료/미뤄진 항목 목록
- [ ] `src/components/retrospective/RetroMemoInput.tsx` — 회고 텍스트 인풋 + 저장
- [ ] `src/components/retrospective/WeeklyBar.tsx` — 주간 바 시각화
- [ ] `src/components/layout/Sidebar.tsx` — FILTERS 배열에 `{ id: '__retrospective__', label: '회고' }` 추가
- [ ] `src/app/page.tsx` — `activeFilter === '__retrospective__'` 분기 + RetrospectiveView 렌더링

### 4단계: GoalCompass 연계 (Developer + Design 병렬)

- [ ] `src/components/goal-compass/GoalCompassRetro.tsx` — 미니 회고 섹션 신규
- [ ] `src/components/goal-compass/GoalCompass.tsx` — GoalCompassRetro 마운트, upsertRetrospective 핸들러 전달

---

## 8. 비-목표

이 기능에서 하지 않는 것:

- **통계/분석 대시보드**: 완료율 추이 그래프, 프로젝트별 비교 차트 등 — non-goals.md의 "통계/리포트/대시보드" 항목과 충돌. 바 차트는 주간 완료 수 비율 표시에 한정하며 별도 분석 뷰 없음.
- **회고 공유/내보내기**: 개인 도구이며 공유 기능은 Phase 2+.
- **AI 회고 요약**: "이번 주 이런 패턴이 있었어요" 같은 AI 분석 — Phase 2 (AI 연동) 이후.
- **회고 알림/리마인더**: non-goals.md의 "알림/리마인더" 항목과 충돌. 수동 진입만 지원.
- **루틴(Routine) 원본의 메모**: 루틴 메모는 인스턴스(날짜별)에만 저장. 루틴 원본 편집은 RoutineSetupModal을 통해 별도 진행.
- **태스크 상세에서 슬롯 재배정**: ItemDetailPanel은 조회/메모에 집중. 슬롯 변경은 기존 드래그앤드랍 또는 SlotPickerModal 유지.
- **이전 날짜 회고 수정 잠금**: 과거 회고는 읽기 전용으로 두지 않음 — 수정은 항상 가능.

---

## 9. 검증 방법

시나리오 기반 검증:

1. **태스크 메모**: 태스크를 완료 후 제목 클릭 → 상세 패널 열림 → 메모 입력 → 패널 닫기 → 다시 열기 → 메모가 유지되어 있음.

2. **루틴 인스턴스 메모**: 오늘의 루틴 인스턴스 클릭 → 메모 입력 → 내일의 같은 루틴 인스턴스에는 메모 없음 (독립 저장 확인).

3. **일간 회고**: 사이드바 → 회고 → 오늘 탭 → 완료된 항목 목록이 표시됨 → 회고 텍스트 입력 후 저장 → 다음 날 오늘 탭으로 돌아오면 전날 회고가 없음 (날짜 분리 확인).

4. **주간 회고 GoalCompass 연계**: GoalCompass.goals.week에 "MVP 출시" 입력 → 사이드바 회고 → 이번 주 탭 상단에 "이번 주에 꼭 끝낼 것은 MVP 출시" 텍스트 표시 확인.

5. **사이드바 진입**: 사이드바에서 "오늘" → "캘린더" → "회고" 순으로 클릭하며 뷰가 전환됨 확인.

6. **기존 데이터 호환**: 회고 기능 추가 전 저장된 로컬 JSON을 로드했을 때 오류 없이 동작, retrospectives는 빈 배열로 초기화됨.

---

## 10. 미해결 / 결정 필요

1. **ItemDetailPanel 진입 UX**: 슬롯 카드에서 항목 제목 클릭이 인라인 편집(기존 updateTaskTitle)과 충돌한다. 현재 카드는 제목을 클릭하면 편집 가능하게 되어 있을 가능성이 높음 — TimetableGrid 정확한 클릭 핸들러 확인 후 UX 분기 설계 필요. (예: 더블클릭=편집, 단일클릭=상세 or 우측 메뉴 아이콘 추가)

2. **주간 기준**: ISO 주(월~일) vs 일요일 시작(일~토) — 한국 사용자 기준 월요일 시작이 자연스러우나, JS Date 기본은 일요일 시작. 구현 시 명시적 결정 필요.

3. **회고 뷰에서 날짜 네비게이션**: 오늘 탭은 DateNav 연동이 자연스럽지만, 회고 뷰 자체 날짜 네비게이션을 둘지 아니면 DateNav를 공유할지 결정 필요. 독립 네비게이션 권장.

4. **GoalCompass 내 회고 탭 vs 사이드바 회고 뷰 중복**: 양쪽이 모두 회고 텍스트를 저장/보여주는 경우 UX가 분산될 수 있음. GoalCompass는 "빠른 입력", 사이드바 회고는 "풍부한 열람"으로 역할을 명확히 분리하는 것을 권장.

5. **retroScopeKey 포맷**: ISO week (`YYYY-Www`) 생성 라이브러리 없이 순수 JS로 구현 가능한지 검토 필요. `date-fns` 등 이미 프로젝트에 있는지 확인.

---

## 다음 단계

1. **developer 호출** — 1단계(데이터 모델) → 2단계(ItemDetailPanel) → 3단계(RetrospectiveView) → 4단계(GoalCompass 연계) 순으로 구현
2. **design 호출** — ItemDetailPanel UI, RetrospectiveView 레이아웃, 바 시각화 컴포넌트 (2단계와 3단계와 병렬 가능)
3. **미해결 항목 1번(진입 UX 충돌)** — developer가 TimetableGrid 실제 클릭 핸들러 확인 후 planner에 피드백 → UX 분기 방식 확정
