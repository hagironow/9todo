# Spec: XP 점수 시스템 + 날짜 네비게이션 캘린더(Calendar)

> 작성일: 2026-05-06
> 작성: planner
> 상태: 구현 완료
> 범위: MVP
> 페르소나: 지호 (1차 타겟 — 바이브 코더), 수민 (2차 타겟 — 사이드 프로젝트 메이커)

---

## 1. 한 줄 요약

슬롯 완료/미루기/진행중에 따른 XP 점수 시스템과, 캘린더 모달로 날짜를 선택해 이동하는 두 가지 기능을 추가한다.

---

## 2. 배경

### 페르소나의 좌절

- **지호**: "슬롯을 깨는 순간의 쾌감이 있는데, 그게 그냥 사라진다. 아무것도 안 남는다." — 완료 후 성취감이 증발하는 문제.
- **지호**: "코딩하다 메모해둘 곳이 없어서 Notion 열었다가 딴 길로 샌다." — 컨텍스트 스위칭 비용.
- **수민**: "지난 주에 뭘 했는지 기억이 안 난다. 어떻게 보면 좋지?" — 날짜 이동 니즈.

### 매칭 시나리오

- **시나리오 B** (완료하기): "완료 후 체크하면 취소선 + fade-out으로 사라진다. 슬롯을 깬 쾌감." — 회고는 이 직후 흐름에 삽입된다.
- **시나리오 A** (아침 세팅): 태스크에 메모를 붙여 컨텍스트를 보존하면 세팅이 더 빨라진다.
- **시나리오 F** (백로그에서 스케줄링): 백로그 항목에도 메모가 있으면 나중에 맥락을 잃지 않는다.

### 관련 vision/positioning

- 북극성: "그걸 깨는 게 재밌어야 한다." — 회고는 쾌감을 강화하는 도구다. 강제가 아니라 선택이어야 한다.
- non-goals.md: "통계/리포트/대시보드는 Phase 2". 회고 데이터는 저장하되, 별도 히스토리 뷰는 이 사양 범위 밖이다.
- non-goals.md: "날짜 네비게이션(캘린더 모달 → 해당 날짜 데이터 리드)은 기본 기능으로 Phase 1에 포함. 별도 뷰가 아니라 동일 뷰에서 날짜만 전환." — 명시적으로 Phase 1 포함.

---

## 3. 기능 1: XP 점수 시스템

### 3-1. 개념

회고를 직접 하는 대신, 슬롯 완료/미루기/진행중 상태에 따라 XP 점수가 자동 계산된다.
점수 체계를 통해 사용자가 태스크를 어떻게 잘라야 하는지 스스로 파악할 수 있는 지표 역할을 한다.
마이너스 XP도 가능 (-20 XP 등).

### 3-2. XP 규칙

| 상태 | XP |
|---|---|
| 1순위 슬롯에서 완료 | +3 XP |
| 2순위 슬롯에서 완료 | +2 XP |
| 3순위 슬롯에서 완료 | +1 XP |
| 미루기 (백로그에 있고 deferCount > 0) | -2 XP |
| 진행중 (슬롯에 배정, 미완료) | -1 XP |
| 백로그에 있고 deferCount === 0 | 0 XP (패널티 없음) |

일일 최대: +18 XP (9칸 전부 완료: 3+2+1+3+2+1+3+2+1)
최저: 무제한 마이너스

### 3-3. 구현

**`src/lib/xp.ts`** (순수 계산 함수, 저장 없음):
```typescript
export function calculateDailyXP(tasks, routineInstances, date): number
```

**DateNav 컴포넌트에 XP 배지 표시**:
- xp > 0: 초록색 (`var(--g-success)`) "+{xp} XP"
- xp === 0: 회색 (`var(--muted-foreground)`) "0 XP"
- xp < 0: 빨간색 (`var(--destructive)`) "{xp} XP"

### 3-4. 데이터 모델 변경

없음. XP는 기존 데이터(Task.slot, Task.completedAt, Task.deferCount)에서 실시간 계산되는 파생값이다.

---

## 4. 기능 2: 메모

**상태: HOLD (이번 사양에서 구현하지 않음)**

---

## 5. 기능 3: 날짜 네비게이션 — 캘린더 모달

### 5-1. 개념

기존 `DateNav` 컴포넌트(이전/다음 화살표 + 오늘 버튼)에 날짜 클릭 시 캘린더 모달이 열리는 기능을 추가한다.
별도 뷰를 만들지 않는다. `page.tsx`의 `today` state만 변경하여 기존 메인 뷰가 해당 날짜 데이터로 필터링된다.

### 5-2. UX 흐름

```
1. DateNav의 날짜 텍스트 ("2026년 5월 6일 수요일") 클릭
   → CalendarModal 열림

2. CalendarModal:
   ┌────────────────────────────────────┐
   │  ◀  2026년 5월  ▶            [×]  │
   │                                    │
   │  일  월  화  수  목  금  토        │
   │                    1   2           │
   │   3   4   5  [6]  7   8   9       │  ← [6] = 오늘 (강조)
   │  10  11  12  13  14  15  16       │
   │  17  18  19  20  21  22  23       │
   │  24  25  26  27  28  29  30       │
   │  31                               │
   │                                    │
   │              [오늘로 돌아가기]     │
   └────────────────────────────────────┘

3. 날짜 클릭 → 해당 날짜로 이동 + 모달 닫힘
4. "오늘로 돌아가기" 클릭 → 오늘 날짜로 이동 + 모달 닫힘
5. [×] 또는 배경 클릭 → 모달 닫힘 (날짜 변경 없음)
```

### 5-3. 캘린더 모달 상세

**DateNav 변경 — 날짜 텍스트를 클릭 가능하게**:
```
[◀]  [2026년 5월 6일 수요일]  [▶]  [오늘]
          ↑ 클릭 → CalendarModal 열림
          밑줄 없이 hover 시 underline (cursor: pointer)
```

**CalendarModal 레이아웃**:
| 요소 | 스펙 |
|---|---|
| 헤더 | "YYYY년 M월" + 이전/다음 월 버튼 (CalendarModal 내부 month 이동) |
| 그리드 | 7열(일~토). 이전달/다음달 날짜는 `opacity: 0.35` |
| 오늘 날짜 | `var(--accent)` 배경 원형 강조 |
| 현재 보고 있는 날짜 | 선택된 날짜로 표시 (ring 스타일) |
| 데이터 있는 날짜 | 날짜 숫자 아래 작은 점 (dot indicator) — Task 또는 RoutineInstance가 존재하는 날짜 |
| "오늘로 돌아가기" | 오늘 날짜가 아닐 때만 표시 |

**과거 날짜 읽기 전용 처리**:
- 과거 날짜로 이동하면 시간표 그리드, 백로그, QuickInput에서 **편집 작업 비활성화**
- 비활성화 범위: 완료/미루기/또하기 버튼, 드래그앤드랍, 빈 슬롯 클릭, QuickInput
- 비활성화 시각: 상단에 `"[날짜]의 기록 (읽기 전용)"` 안내 배너 표시
- 미래 날짜: 편집 가능 (태스크 미리 계획 가능)
- 정의: `past = date < today`, `today = 오늘`, `future = date > today`

**근거**: 과거 데이터를 수정하면 기록의 신뢰성이 깨진다. 반면 미래 날짜는 계획 용도이므로 편집 허용.

**dot indicator 계산 방법**:
```typescript
// page.tsx 또는 CalendarModal props
// state.tasks에서 date별 유무 계산
const datesWithData = useMemo(() => {
  const set = new Set<string>();
  for (const t of state.tasks) {
    if (!t.completedAt || t.slot) set.add(t.date);
    if (t.completedAt) set.add(t.date); // 완료 기록도 포함
  }
  for (const ri of state.routineInstances) {
    set.add(ri.date);
  }
  return set;
}, [state.tasks, state.routineInstances]);
```

### 5-4. 읽기 전용 모드 처리

**`isReadOnly` prop 전파 경로**:
```
page.tsx
  → isReadOnly = today < getToday()
  → TimetableGrid(isReadOnly)
    → TimetableRow(isReadOnly)
      → SlotCell(isReadOnly)  // 빈 슬롯 클릭 비활성화
      → ItemCard(isReadOnly)  // 액션 버튼 비활성화
  → BacklogPanel(isReadOnly)  // 슬롯 배치 버튼 비활성화
  → NowFocus(isReadOnly)      // 완료/미루기/또하기 비활성화
  → QuickInput(disabled)      // 인풋 비활성화
```

**읽기 전용 안내 배너**:
```
┌──────────────────────────────────────────────────────────────┐
│  2026년 4월 30일의 기록입니다. (읽기 전용)    [오늘로 이동] │
└──────────────────────────────────────────────────────────────┘
```
- 배경: `var(--muted)`, 텍스트: `var(--muted-foreground)`
- `DateNav` 바로 아래에 위치
- 오늘 날짜이면 배너 숨김

### 5-5. 데이터 모델 변경

없음. 기존 Task의 `date` 필드, RoutineInstance의 `date` 필드를 기존 필터링 로직이 그대로 사용한다.
`page.tsx`의 `today` state 이름이 실질적으로 "현재 보고 있는 날짜"이므로, 혼동을 방지하기 위해 내부 변수명을 `viewDate`로 리네임한다.

```typescript
// page.tsx 변수 리네임
const [viewDate, setViewDate] = useState<string>(getToday);
const isToday = viewDate === getToday();
const isPast = viewDate < getToday();
const isReadOnly = isPast;
```

기존에 `today`를 참조하던 모든 코드는 `viewDate`로 대체.

### 5-6. 컴포넌트 / 훅 변경

**신규 컴포넌트**:
| 컴포넌트 | 경로 | 설명 |
|---|---|---|
| `CalendarModal` | `src/components/modals/CalendarModal.tsx` | 월간 캘린더 모달. 날짜 선택 + dot indicator |
| `ReadOnlyBanner` | `src/components/date-nav/ReadOnlyBanner.tsx` | 읽기 전용 안내 배너 |

**수정 파일**:
| 파일 | 변경 내용 |
|---|---|
| `src/components/date-nav/DateNav.tsx` | 날짜 텍스트에 `onClick` 추가 (`onOpenCalendar` prop). 클릭 시 커서 포인터 + hover underline. |
| `src/components/timetable/TimetableGrid.tsx` | `isReadOnly?: boolean` prop 추가. 하위 컴포넌트에 전파. |
| `src/components/timetable/TimetableRow.tsx` | `isReadOnly` 전파 |
| `src/components/timetable/SlotCell.tsx` | `isReadOnly` 시 빈 슬롯 클릭 비활성화, 인라인 생성 비활성화 |
| `src/components/timetable/ItemCard.tsx` | `isReadOnly` 시 액션 버튼(완료/미루기/또하기/삭제) 숨김 또는 비활성화 |
| `src/components/backlog/BacklogPanel.tsx` | `isReadOnly` 시 [슬롯 배치] 버튼 비활성화 |
| `src/components/now-focus/NowFocus.tsx` | `isReadOnly` 시 완료/미루기/또하기 버튼 비활성화 |
| `src/components/quick-input/QuickInput.tsx` | `disabled` prop 추가 |
| `src/app/page.tsx` | `today` → `viewDate` 리네임. `CalendarModal` 마운트. `isReadOnly` 계산 및 전파. `handleUpdateMemo` 추가. |

---

## 6. 데이터 모델 최종 변경 요약

```typescript
// src/lib/types.ts 변경사항

// 신규 타입
interface Retro {
  emoji: string | null;
  note: string | null;
  recordedAt: string; // ISO 8601
}

// Task 변경
interface Task extends ItemBase {
  type: 'task';
  slot: SlotCoord | null;
  deferCount: number;
  completedAt: string | null;
  date: string;
  origin?: 'deferred' | 'repeated';
  memo?: string | null;    // 신규
  retro?: Retro | null;    // 신규
}

// RoutineInstance 변경
interface RoutineInstance {
  id: string;
  routineId: string;
  date: string;
  slot: SlotCoord | null;
  deferCount: number;
  completedAt: string | null;
  memo?: string | null;    // 신규
  retro?: Retro | null;    // 신규
}
```

**data/9todo.json**: 기존 항목에 `memo`, `retro` 필드 없어도 호환 (옵셔널). 초기값 추가 불필요.

---

## 7. UI 변경 요약

### 신규 컴포넌트

| 컴포넌트 | 경로 |
|---|---|
| `RetroToast` | `src/components/retro/RetroToast.tsx` |
| `RetroBottomSheet` | `src/components/retro/RetroBottomSheet.tsx` |
| `MemoArea` | `src/components/ui/MemoArea.tsx` |
| `CalendarModal` | `src/components/modals/CalendarModal.tsx` |
| `ReadOnlyBanner` | `src/components/date-nav/ReadOnlyBanner.tsx` |

### 수정 컴포넌트

| 컴포넌트 | 변경 이유 |
|---|---|
| `src/lib/types.ts` | Retro 타입, Task/RoutineInstance 필드 추가 |
| `src/hooks/useAppData.ts` | `saveRetro`, `updateMemo` 추가 |
| `src/components/date-nav/DateNav.tsx` | 날짜 텍스트 클릭 이벤트 (`onOpenCalendar` prop) |
| `src/components/timetable/ItemCard.tsx` | 클릭 확장, 메모 아이콘, `isReadOnly` 처리 |
| `src/components/backlog/BacklogItem.tsx` | 메모 아이콘 버튼, 인라인 메모 토글 |
| `src/components/timetable/TimetableGrid.tsx` | `isReadOnly` prop 전파 |
| `src/components/timetable/TimetableRow.tsx` | `isReadOnly` 전파 |
| `src/components/timetable/SlotCell.tsx` | `isReadOnly` 처리 |
| `src/components/backlog/BacklogPanel.tsx` | `isReadOnly` 처리 |
| `src/components/now-focus/NowFocus.tsx` | `isReadOnly` 처리 |
| `src/components/quick-input/QuickInput.tsx` | `disabled` prop |
| `src/app/page.tsx` | `viewDate` 리네임, 회고 트리거, 메모 핸들러, CalendarModal, ReadOnlyBanner, isReadOnly 전파 |

---

## 8. 구현 태스크

### Developer

**기능 1 — 회고**
- [ ] `src/lib/types.ts` — `Retro` 인터페이스 추가, `Task`/`RoutineInstance`에 `retro?` 필드 추가
- [ ] `src/hooks/useAppData.ts` — `saveRetro(itemId, retro, isRoutine)` 함수 추가
- [ ] `src/app/page.tsx` — `retroTarget` state 추가, `handleComplete` 수정 (500ms 후 회고 토스트 트리거)

**기능 2 — 메모**
- [ ] `src/lib/types.ts` — `Task`/`RoutineInstance`에 `memo?` 필드 추가
- [ ] `src/hooks/useAppData.ts` — `updateMemo(itemId, memo, isRoutine)` 함수 추가
- [ ] `src/app/page.tsx` — `expandedCardId` state 추가, `handleUpdateMemo` 핸들러 추가, prop 전달 경로 구성

**기능 3 — 캘린더**
- [ ] `src/app/page.tsx` — `today` → `viewDate` 변수 리네임, `isReadOnly` 계산 추가, `CalendarModal` 마운트, `ReadOnlyBanner` 조건부 렌더, `isReadOnly` 하위 컴포넌트 전파
- [ ] `src/components/timetable/TimetableGrid.tsx` — `isReadOnly` prop 추가 및 전파
- [ ] `src/components/timetable/TimetableRow.tsx` — `isReadOnly` 전파
- [ ] `src/components/timetable/SlotCell.tsx` — `isReadOnly` 시 클릭/드롭 비활성화
- [ ] `src/components/timetable/ItemCard.tsx` — `isReadOnly` 시 액션 버튼 비활성화
- [ ] `src/components/backlog/BacklogPanel.tsx` — `isReadOnly` prop 추가 및 전달
- [ ] `src/components/backlog/BacklogItem.tsx` — `isReadOnly` 시 [슬롯 배치] 버튼 비활성화
- [ ] `src/components/now-focus/NowFocus.tsx` — `isReadOnly` 시 버튼 비활성화
- [ ] `src/components/quick-input/QuickInput.tsx` — `disabled` prop 추가

### Design

**기능 1 — 회고**
- [ ] `src/components/retro/RetroToast.tsx` — 데스크톱 우하단 고정 토스트. 이모지 선택 버튼 5개, 텍스트 입력, 자동 닫힘 프로그레스 바, 슬라이드-인 애니메이션
- [ ] `src/components/retro/RetroBottomSheet.tsx` — 모바일 하단 시트 버전. BottomSheet 래핑.

**기능 2 — 메모**
- [ ] `src/components/ui/MemoArea.tsx` — textarea + 글자 수 카운터 + 저장 버튼. blur 시 자동 저장.
- [ ] `src/components/timetable/ItemCard.tsx` — 확장 상태 UI (max-height transition 200ms), 메모 아이콘 (StickyNote, 11px)
- [ ] `src/components/backlog/BacklogItem.tsx` — 메모 아이콘 버튼 + 인라인 MemoArea 토글

**기능 3 — 캘린더**
- [ ] `src/components/modals/CalendarModal.tsx` — 월간 그리드, 날짜 셀(오늘 강조/선택 표시/dot indicator/이전·다음달 dimmed), 월 이동 버튼, "오늘로 돌아가기" 버튼
- [ ] `src/components/date-nav/DateNav.tsx` — 날짜 텍스트에 `cursor-pointer` + hover `underline` 추가
- [ ] `src/components/date-nav/ReadOnlyBanner.tsx` — 안내 배너 UI

---

## 9. 비-목표 (이 사양에서 하지 않는 것)

| 항목 | 근거 |
|---|---|
| 회고 히스토리 뷰 | 과거 회고 모아보기 → 통계/대시보드. non-goals.md "통계/리포트는 Phase 2" |
| 회고 데이터 기반 통계 | 이모지 빈도, 감정 트렌드 등. Phase 2 |
| 메모 리치 텍스트 (마크다운, 볼드, 링크 등) | 단순함이 핵심. GTD 매니아용 기능은 안티-페르소나 |
| 메모 첨부파일 / 이미지 | 로컬 JSON 기반. 파일 저장 구조 미비. Phase 2 |
| 루틴 원본(Routine)에 메모 | RoutineInstance에만 붙임. 루틴 정의 자체의 메모는 별도 사양 |
| 캘린더에서 태스크 직접 생성/편집 | 캘린더는 네비게이션 전용. 편집은 메인 뷰에서 |
| 캘린더 주간/일간 뷰 | 9todo은 시간표(격자). non-goals.md "타임라인 시각화 재고하지 않음" |
| 과거 날짜 데이터 편집 | 기록의 신뢰성 보호. 과거는 읽기 전용. |
| 날짜 간 태스크 이동 (드래그) | 복잡도 높음. 미루기로 백로그 보낸 후 날짜 변경이 현재 워크플로우 |

---

## 10. 검증 방법

### 기능 1 — XP 점수

1. 슬롯에 태스크 배정 → DateNav XP 배지에 -1 XP 표시 (빨간색).
2. 1순위 완료 → XP가 +3 증가 (진행중 -1 해제 + 완료 +3 = 순 +4).
3. 미루기 → XP가 -2 표시.
4. 9칸 전부 완료 → +18 XP (초록색).
5. 과거 날짜로 이동 → 해당 날짜의 XP가 표시.

### 기능 2 — 날짜 네비게이션

1. DateNav의 날짜 텍스트 클릭 → CalendarModal 열림.
2. 캘린더에서 날짜 클릭 → 모달 닫힘 + 해당 날짜의 태스크/루틴이 메인 뷰에 표시.
3. 태스크/루틴이 있는 날짜에 dot indicator 표시.
4. 오늘 날짜가 accent 색상 원으로 강조.
5. 과거 날짜 선택 시 ReadOnlyBanner 등장, 완료/미루기/또하기 버튼 비활성화.
6. 미래 날짜는 편집 가능.
7. "오늘로 돌아가기" 버튼 클릭 → 오늘 날짜로 복귀.

---

## 11. 구현 완료

- [x] `src/lib/xp.ts` — calculateDailyXP 함수
- [x] `src/components/modals/CalendarModal.tsx` — 월간 캘린더 모달
- [x] `src/components/date-nav/DateNav.tsx` — XP 배지 + 캘린더 열기
- [x] `src/components/date-nav/ReadOnlyBanner.tsx` — 읽기 전용 안내
- [x] `src/app/page.tsx` — isReadOnly, dailyXP, datesWithData, CalendarModal 와이어링
- [x] `src/components/timetable/TimetableGrid.tsx` — isReadOnly 전파
- [x] `src/components/timetable/TimetableRow.tsx` — isReadOnly 전파
- [x] `src/components/timetable/SlotCell.tsx` — isReadOnly 비활성화
- [x] `src/components/timetable/ItemCard.tsx` — isReadOnly 비활성화
- [x] `src/components/now-focus/NowFocus.tsx` — isReadOnly 비활성화
- [x] `src/components/backlog/BacklogPanel.tsx` — isReadOnly 전파
- [x] `src/components/backlog/BacklogItem.tsx` — isReadOnly 비활성화
