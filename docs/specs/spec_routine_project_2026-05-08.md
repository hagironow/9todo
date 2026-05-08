# Spec: 루틴에 프로젝트 연결

> 작성일: 2026-05-08
> 작성: planner
> 상태: 검토 중
> 범위: MVP
> 페르소나: 지호 (1차), 수민 (2차)

---

## 1. 한 줄 요약

루틴 생성/편집 시 프로젝트를 연결하고, 프로젝트 상세 뷰에서 태스크와 루틴을 분리된 섹션으로 표시하며, 프로젝트 필터링 시 루틴도 함께 포함한다.

---

## 2. 배경

### 페르소나의 좌절
- 지호: 3-4개 프로젝트를 병렬 진행하면서 루틴("매일 쓰레드 배포")이 어느 프로젝트에 속하는지 분류가 안 되어 있다. 프로젝트 상세를 클릭해도 루틴이 보이지 않고 "루틴 N회 완료"라는 숫자 한 줄만 있다.
- 수민: 사이드 프로젝트별로 뭘 해야 하는지 한눈에 안 보임 (personas.md 인용). 태스크는 보이지만 반복 루틴은 어디 프로젝트 것인지 알 수 없다.

### 매칭 시나리오
- **시나리오 G**: 프로젝트 클릭 시 해당 프로젝트의 항목만 보이도록 필터링. 현재 태스크만 필터링되고 루틴은 항상 전체 표시 (`page.tsx` L359: "루틴은 프로젝트 필터와 무관하게 항상 표시"). 이번 기능으로 루틴도 포함.
- **시나리오 E**: 루틴 생성 시 시간대/우선순위/반복주기를 설정. 여기에 프로젝트 선택을 추가.

### 관련 vision/positioning
> "프로젝트는 이름 + 색 하나로 생성하고, 컬러 도트로 시각적 구분을 제공한다." (vision.md)
> "저녁 시간에 어떤 프로젝트의 어떤 작업을 해야 하는지 바로 꺼내볼 수 있으면 좋겠다." (personas.md, 수민 JTBD)

---

## 3. UX 흐름

### 3-1. 루틴 생성 시 프로젝트 선택

1. 사용자가 루틴 슬롯의 `+` 버튼을 클릭하거나 루틴 이름을 입력 후 엔터.
2. `RoutineSetupModal`이 열린다.
3. 기존 섹션(반복 주기, 요일, 기본 슬롯, 시작일, 시간) 아래에 **"프로젝트"** 섹션이 추가된다.
4. 현재 `activeProjectFilter`가 실제 프로젝트 ID이면 해당 프로젝트가 기본 선택된 상태로 열린다. 그 외에는 "미분류"가 기본값.
5. 사용자가 프로젝트 버튼을 탭하면 `ProjectSelectModal`이 열린다.
6. 프로젝트 선택 또는 "미분류로 유지" 선택 후 `ProjectSelectModal`이 닫힌다.
7. `RoutineSetupModal`의 "프로젝트" 섹션에 선택된 프로젝트 컬러 도트 + 이름이 표시된다. (미분류이면 회색 도트 + "미분류")
8. 저장 버튼 클릭 → `RoutineSetupData`에 `projectId` 포함하여 `onSave` 호출.

### 3-2. 루틴 편집 시 프로젝트 변경

1. 루틴 슬롯 셀 호버 → 수정(연필) 아이콘 클릭 → `RoutineSetupModal` 편집 모드로 열림.
2. "프로젝트" 섹션에 현재 루틴의 `projectId`에 해당하는 프로젝트가 미리 선택된 상태로 표시.
3. 탭 → `ProjectSelectModal` 열림 → 변경 가능.
4. 저장 시 `updateRoutine`에 `projectId` 포함하여 업데이트.

### 3-3. RoutineSlotCell 컬러 도트 표시

1. 루틴 인스턴스가 슬롯에 표시될 때, 해당 루틴의 `projectId`로 프로젝트를 조회한다.
2. 프로젝트가 있으면 셀 내 제목 텍스트 왼쪽에 `ColorDot` (size="sm")을 표시.
   - `SlotCell` → `ItemCard` 패턴과 동일한 위치 및 크기.
3. 프로젝트가 없으면 (미분류) 도트 없음. 현재와 동일.

### 3-4. 프로젝트 상세 뷰 — 태스크/루틴 분리 표시

현재: 태스크 목록 섹션 + "루틴 N회 완료" 한 줄.

변경 후:

```
[태스크 섹션]  ← 현재와 동일
태스크 (N)
- 태스크 목록 (미완료 먼저, 날짜 역순)

[루틴 섹션]  ← 신규
루틴 (N)
- 루틴 행 목록 (활성 루틴 먼저, 비활성 루틴 아래)
```

루틴 행 (`RoutineRow`) 표시 정보:
- 상태 아이콘: 활성 `↻` / 비활성 `—`
- 제목
- 반복 주기: "매일", "매주 월·수·금", "2주마다", "매월"
- 기본 슬롯: "오전 1순위"
- (총 완료 횟수 — 해당 루틴의 routineInstances 중 completedAt 있는 것 수)

기존 "루틴 N회 완료" 한 줄 텍스트는 제거하고 RoutineRow 목록으로 대체.

통계 카드 "완료 / 전체"는 태스크 기준 유지. XP는 태스크 + 루틴 인스턴스 모두 포함 (현재와 동일).

### 3-5. 프로젝트 필터링 시 루틴 포함

- `page.tsx`의 `filteredRoutineSlots` 로직을 수정.
- 현재: `filteredRoutineSlots = routineSlots` (항상 전체 표시).
- 변경 후: `activeProjectFilter`가 실제 프로젝트 ID이면 해당 프로젝트의 루틴만 표시. `null` 또는 `__unassigned__`이면 기존 동작 유지.

필터링 기준: `ScheduledItem`에서 `routineDetails?.projectId === filter`.

### 화면/상태 변화

| 상태 | 화면 변화 |
|---|---|
| RoutineSetupModal 열릴 때 activeProjectFilter가 프로젝트 ID | 해당 프로젝트 기본 선택 |
| RoutineSetupModal 열릴 때 filter 없음 | "미분류" 기본 선택 |
| ProjectSelectModal에서 프로젝트 선택 | RoutineSetupModal 프로젝트 섹션 업데이트 |
| 프로젝트 필터 ON | 루틴 섹션에서 다른 프로젝트 루틴 슬롯이 빈 슬롯으로 표시 |
| 프로젝트 상세 뷰 | 루틴 섹션 신규 표시 |

---

## 4. 데이터 모델

### 타입 변경

**`RoutineSetupData` (RoutineSetupModal.tsx)**

```ts
// 변경 전
export interface RoutineSetupData {
  recurrence: RecurrenceType;
  daysOfWeek?: number[];
  defaultSlot: SlotCoord;
  startDate: string;
  scheduledTime?: string;
}

// 변경 후
export interface RoutineSetupData {
  recurrence: RecurrenceType;
  daysOfWeek?: number[];
  defaultSlot: SlotCoord;
  startDate: string;
  scheduledTime?: string;
  projectId: string | null;   // 신규
}
```

`Routine` 타입 자체는 `ItemBase`에 이미 `projectId: string | null`이 있으므로 변경 없음.

### API 변경 없음 (로컬 상태)

**`handleRoutineSetupSave` (page.tsx)**

```ts
// 생성 시: projectId: null → data.projectId
addRoutine({
  title: ...,
  projectId: data.projectId,   // 변경
  ...
});

// 편집 시: updateRoutine에 projectId 추가
updateRoutine(editingRoutine.id, {
  recurrence: data.recurrence,
  daysOfWeek: data.daysOfWeek,
  defaultSlot: data.defaultSlot,
  startDate: data.startDate,
  scheduledTime: data.scheduledTime,
  projectId: data.projectId,   // 신규 추가
});
```

**`filteredRoutineSlots` (page.tsx)**

```ts
// 변경 전: filteredRoutineSlots = routineSlots (주석: "루틴은 프로젝트 필터와 무관하게 항상 표시")

// 변경 후: page.v1.tsx의 기존 로직을 포팅
const filteredRoutineSlots = useMemo(() => {
  if (!state.activeProjectFilter) return routineSlots;
  const filter = state.activeProjectFilter;
  if (filter === '__unassigned__' || filter === '__calendar__') return routineSlots;
  const result = { ... }; // 빈 슬롯 초기화
  for (각 period, priority) {
    const item = routineSlots[period][priority];
    // item.routineDetails.projectId === filter 인 것만 포함
  }
  return result;
}, [routineSlots, state.activeProjectFilter]);
```

### 마이그레이션 영향

기존 루틴 데이터의 `projectId`는 이미 `null`로 저장되어 있다. `ItemBase`에 필드가 존재하므로 별도 마이그레이션 불필요. 로드 시 `projectId: null`로 정상 동작.

---

## 5. UI 변경

### 신규 컴포넌트

**`RoutineRow`** (ProjectDetailView.tsx 내 로컬 함수 컴포넌트)
- `TaskRow`와 동일한 카드 스타일 (`bg-[var(--card)]`, `rounded-[var(--radius-sm)]`)
- 호버 액션: 없음 (루틴은 편집이 RoutineSetupModal에서만 이루어지므로 이 뷰에서는 read-only)
- 표시 정보: 상태 아이콘, 제목, 반복 주기 텍스트, 기본 슬롯 텍스트, 완료 횟수

### 재사용 컴포넌트

| 컴포넌트 | 용도 |
|---|---|
| `ProjectSelectModal` | RoutineSetupModal에서 프로젝트 선택 트리거 |
| `ColorDot` (size="sm") | RoutineSetupModal 프로젝트 섹션 + RoutineSlotCell 도트 |

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `src/components/modals/RoutineSetupModal.tsx` | `RoutineSetupData`에 `projectId` 추가, "프로젝트" 섹션 UI 추가, `ProjectSelectModal` 열기 로직, 편집 모드에서 기존 projectId 초기화 |
| `src/components/timetable/RoutineSlotCell.tsx` | props에 `projects?: Project[]` 추가, 아이템에 routineDetails.projectId 있으면 ColorDot 렌더 |
| `src/components/project-detail/ProjectDetailView.tsx` | 루틴 섹션 추가, RoutineRow 로컬 컴포넌트 추가, 기존 "루틴 N회 완료" 텍스트 제거 |
| `src/app/page.tsx` | `handleRoutineSetupSave`에서 `projectId` 전달, `filteredRoutineSlots` 필터링 로직 활성화, `RoutineSlotCell`에 `projects` prop 전달 |

---

## 6. 구현 태스크

### Developer

- [ ] `RoutineSetupData` 인터페이스에 `projectId: string | null` 추가
- [ ] `RoutineSetupModal`: `projects`, `colorTheme`, 초기 `projectId` props 추가. "프로젝트" 섹션 UI 추가 (SECTION_LABEL 스타일 통일). `ProjectSelectModal` 상태 관리 및 호출. `useEffect` 초기화에 `projectId` 추가.
- [ ] `page.tsx` `handleRoutineSetupSave`: 생성/편집 모두 `data.projectId` 전달
- [ ] `page.tsx` `filteredRoutineSlots`: `page.v1.tsx`의 필터링 로직 포팅 (`__unassigned__` 케이스 포함)
- [ ] `RoutineSlotCell`: `projects?: Project[]` prop 추가, 루틴 인스턴스의 `routineDetails.projectId`로 project 조회, ColorDot 렌더
- [ ] `TimetableGrid` / `RoutineSection` 등 RoutineSlotCell을 렌더하는 상위 컴포넌트에 `projects` prop 전달 경로 확인
- [ ] `ProjectDetailView`: 루틴 섹션 UI 추가, `RoutineRow` 로컬 컴포넌트 구현, 기존 "루틴 N회 완료" 한 줄 텍스트 제거

### Design

- [ ] RoutineSetupModal "프로젝트" 섹션: 기존 SECTION_LABEL + 선택 버튼 스타일이 다른 섹션과 통일되는지 확인
- [ ] ProjectDetailView 루틴 섹션: RoutineRow가 TaskRow와 시각적으로 구분되도록 — 점선 테두리 또는 반복 아이콘(`↻`) 추가 검토

---

## 7. 비-목표

- **루틴 인스턴스에 projectId 별도 저장하지 않는다.** RoutineInstance는 routineId로 원본 Routine을 참조하므로 중복 저장 불필요. 프로젝트 변경 시 Routine.projectId만 수정하면 모든 인스턴스에 즉시 반영된다.
- **루틴 별 프로젝트 통계 분리 (예: 프로젝트별 루틴 완료율 차트)** — Phase 2 통계 기능 범위.
- **루틴에 태그 연결** — non-goals.md의 태그 시스템은 Phase 2.
- **백로그로 이동된 루틴 인스턴스의 필터링** — 루틴 인스턴스는 현재 백로그 표시 로직이 없으므로 해당 없음.

---

## 8. 검증 방법

1. **프로젝트 연결 생성**: 루틴 생성 시 프로젝트 A를 선택 → 저장 → `Routine.projectId === projectA.id` 확인.
2. **컬러 도트 표시**: 프로젝트 A 루틴이 슬롯에 배치된 상태에서 해당 슬롯 셀에 프로젝트 A의 컬러 도트가 표시되는지 확인.
3. **필터링 포함**: 사이드바에서 프로젝트 A 클릭 → 루틴 섹션에서 프로젝트 A 루틴만 슬롯에 표시, 다른 프로젝트 루틴은 빈 슬롯으로 표시되는지 확인.
4. **프로젝트 상세 분리**: 프로젝트 A 클릭 → 상세 뷰에서 "태스크 (N)" 섹션과 "루틴 (M)" 섹션이 분리 표시. 루틴 이름, 반복 주기, 기본 슬롯이 정확한지 확인.
5. **편집 시 프로젝트 변경**: 기존 루틴(projectId=A)을 편집 모드로 열면 프로젝트 A가 기본 선택됨. 프로젝트 B로 변경 저장 → `Routine.projectId === projectB.id` 확인.
6. **미분류 유지**: 프로젝트 없이 루틴 생성 시 `projectId === null`, 컬러 도트 미표시 확인.
7. **프로젝트 삭제 후**: 프로젝트 A 삭제 시 `activeProjectFilter`가 `null`로 초기화되고, 해당 루틴의 `projectId`는 **null로 변환하지 않고 그대로 유지** → 삭제된 프로젝트 ID가 남아 있으나 `projects` 배열에 없으므로 ColorDot은 렌더되지 않음 (project 조회 결과 null). 이는 허용 가능한 상태. 향후 마이그레이션 대상으로 주석 추가 권장.

---

## 9. 미해결 / 결정 필요

### A. 프로젝트 삭제 시 Routine.projectId 처리 (에지 케이스)

**현재 태스크 동작**: `removeProject` (`useAppData.ts` L166) 실행 시 `activeProjectFilter`를 초기화하지만, 기존 태스크의 `projectId`는 그대로 유지한다. 삭제된 프로젝트 ID를 가진 태스크는 컬러 도트가 렌더되지 않을 뿐 데이터는 남아있다.

**루틴도 동일 정책 적용 권장**: `removeProject` 시 루틴의 `projectId`를 `null`로 초기화하는 클린업은 이번 범위에서 제외. 태스크와 일관된 정책 유지. 별도 티켓으로 관리.

### B. `__unassigned__` 필터와 루틴

현재 `__unassigned__` 필터는 태스크에만 적용됨. 루틴에도 "미분류 루틴만 보기"를 적용할지 결정 필요.
**제안**: 이번 MVP에서는 `__unassigned__` 필터 시 루틴은 전체 표시(현재와 동일). 루틴 필터링은 실제 프로젝트 ID가 있을 때만 동작.

### C. RoutineSetupModal에서 프로젝트 선택 UI 형태

두 가지 옵션:
1. **현재 ProjectSelectModal을 그대로 열기** — 기존 컴포넌트 재사용, 구현 단순. 단, 모달 위에 모달가 열리는 레이어 중첩 발생.
2. **SlotCell 방식의 인라인 드롭다운** — `page.tsx`의 SlotCell 프로젝트 드롭다운(L128~250) 패턴을 참조해 Portal 드롭다운으로 구현. 레이어 중첩 없음, 더 자연스러운 UX.

**제안**: 옵션 1(ProjectSelectModal 재사용)로 우선 구현. RoutineSetupModal 내 다른 섹션과 시각 통일성이 필요하면 옵션 2로 리팩터.

---

## 다음 단계

1. **developer** 호출 — 데이터/API/로직 구현 (섹션 6 Developer 태스크)
2. **design** 호출 — UI 구현 (섹션 6 Design 태스크, developer와 병렬 가능)
