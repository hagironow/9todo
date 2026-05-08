# Spec: 루틴 슬롯 드래그 교환 (Routine Drag Swap)

> 작성일: 2026-05-08
> 작성: planner
> 상태: 검토 중
> 범위: MVP
> 페르소나: 지호 (바이브 코더), 수민 (사이드 프로젝트 메이커)

---

## 1. 한 줄 요약

루틴 행(row)의 인스턴스를 드래그해서 당일 한정으로 다른 루틴 슬롯과 교환하거나 빈 루틴 슬롯으로 이동한다. `Routine.defaultSlot`은 건드리지 않으므로 내일 자동 배치에는 영향 없다.

---

## 2. 배경

### 페르소나의 좌절
- **지호**: 매일 고정된 루틴 슬롯 배치가 오늘 컨디션/컨텍스트와 맞지 않을 때 수동 조정 수단이 없다. "오늘은 아침에 쓰레드 배포 먼저 하고, SNS 리뷰를 오후로 밀고 싶다"는 요구가 생긴다.
- **수민**: 퇴근 후 루틴 순서를 오늘 기분에 맞게 빠르게 재배치하고 싶다. 설정을 바꾸지 않고도 오늘만 바꾸는 방법이 필요하다.

### 매칭 시나리오
- **시나리오 A (아침에 오늘의 시간표 세팅하기)**: 백로그에서 슬롯으로 끼워 넣는 것과 동일한 손감각으로 루틴도 재배치.
- **시나리오 E (루틴 등록과 자동 재생성)**: 루틴의 핵심 가치인 "내일도 원래 슬롯에 자동 배치"를 유지하면서 오늘만 조정.

### 관련 vision/positioning
- vision: "드래그 앤 드랍 — 슬롯 배정의 기본 인터랙션. 손으로 직접 끼우는 촉감."
- positioning: "드래그 앤 드랍 배치: 백로그에서 슬롯으로 끼워 넣는 행위 자체가 게임처럼 느껴진다."

---

## 3. UX 흐름

### 3-1. 루틴끼리 슬롯 교환

```
1. 사용자가 루틴 행(RoutineSlotCell)의 루틴 카드를 길게 누르거나 그립 핸들을 드래그한다.
2. 드래그 오버레이가 나타나 카드가 들려 있음을 표시한다.
3. 다른 루틴 슬롯 위로 드래그하면 대상 슬롯에 강조 테두리(ring)가 표시된다.
4. 드롭하면:
   - 드래그한 루틴 인스턴스의 slot → 대상 슬롯 좌표로 변경
   - 대상 슬롯에 있던 루틴 인스턴스의 slot → 드래그 출발 슬롯 좌표로 변경 (교환)
5. 두 루틴 카드의 위치가 즉시 교환된다.
6. Routine.defaultSlot은 변경하지 않는다.
```

### 3-2. 빈 루틴 슬롯으로 이동

```
1. 루틴 카드를 드래그한다.
2. 빈 루틴 슬롯(점선 테두리) 위로 드래그하면 강조 표시된다.
3. 드롭하면:
   - 드래그한 루틴 인스턴스의 slot → 대상 슬롯 좌표로 변경
   - 출발 슬롯은 비워짐 (빈 루틴 슬롯 상태)
4. Routine.defaultSlot은 변경하지 않는다.
```

### 3-3. 태스크 슬롯으로 드래그 — 허용하지 않음

```
1. 루틴 카드를 태스크 슬롯(SlotCell) 위로 드래그한다.
2. 태스크 슬롯은 루틴 드롭 대상으로 등록되지 않으므로 드롭이 무시된다.
3. 카드가 원래 위치로 스냅백된다.
```

### 3-4. 완료된 루틴 — 드래그 불가

```
완료(completedAt != null)된 루틴 인스턴스는 draggable disabled 처리.
그립 핸들 미표시 또는 opacity 처리로 드래그 불가임을 시각적으로 암시.
```

### 화면/상태 변화

| 상태 | 시각 표현 |
|---|---|
| 드래그 중 (출발 슬롯) | 카드 opacity 0.35, 자리 유지 |
| 드래그 오버레이 | 카드 미니 복사본이 커서를 따라 이동, 점선 테두리 유지 |
| 드롭 가능한 빈 루틴 슬롯 hover | ring-2 + 배경 강조 (기존 SlotCell isOver 스타일과 동일하게) |
| 드롭 가능한 루틴 카드 hover | 카드에 ring-2 강조 |
| 드롭 불가 슬롯 hover | 강조 없음, 커서 not-allowed 또는 기본 상태 유지 |
| 드롭 완료 | 즉시 위치 교환, 애니메이션 없음 (데이터 업데이트로 자연스럽게 리렌더) |

---

## 4. 데이터 모델

### 타입 변경

없음. 기존 `RoutineInstance.slot: SlotCoord | null`을 그대로 사용한다.

```ts
// 이미 존재하는 구조 — 변경 없음
interface RoutineInstance {
  id: string;
  routineId: string;
  date: string;
  slot: SlotCoord | null;   // ← 이 필드만 조작
  deferCount: number;
  completedAt: string | null;
}
```

### 슬롯 결정 로직 (기존 코드 확인)

`page.tsx`의 `routineSlots` memo에서 위치 결정 우선순위:
```ts
const coord = ri.slot ?? ri.routineDetails?.defaultSlot;
```

드래그 교환 후에는 `ri.slot`이 항상 존재하므로 `defaultSlot`은 fallback으로만 사용된다.
내일 새 인스턴스는 `createRoutineInstance(routine, date)`로 생성되어 `slot: { ...routine.defaultSlot }`을 쓰므로, 오늘 변경한 `ri.slot`은 내일에 전파되지 않는다.

### API 변경

없음. 기존 `assignRoutineInstanceSlot(instanceId, coord)` 함수로 충분하다.

#### 교환 로직 (원자적 처리)

두 인스턴스의 슬롯을 동시에 변경해야 데이터 꼬임이 없다. `batchUpdate`를 사용한다.

```ts
// 루틴 A (드래그됨): slot A → slot B
// 루틴 B (대상):    slot B → slot A
batchUpdate((prev) => ({
  ...prev,
  routineInstances: prev.routineInstances.map((ri) => {
    if (ri.id === draggedId) return { ...ri, slot: targetCoord };
    if (ri.id === targetId)  return { ...ri, slot: draggedCoord };
    return ri;
  }),
}));
```

단순 이동(빈 슬롯)은 기존 `assignRoutineInstanceSlot` 하나로 충분하다.

---

## 5. UI 변경

### 5-1. RoutineSlotCell — 드래그블 추가

현재 `RoutineSlotCell`은 `useDraggable`이 없다. 아이템이 있을 때 `useDraggable` 적용.

```ts
// RoutineSlotCell 내부
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
  id: item.id,
  data: { item, isRoutineInstance: true, currentSlot: coord },
  disabled: isReadOnly || !!item.completedAt,
});
```

그립 핸들: 기존 `ItemCard`의 `GripVertical` 아이콘과 동일한 패턴 적용. 호버 시에만 노출.

드래그 오버레이: 기존 `DragOverlay` (page.tsx)에서 이미 `activeItem`을 표시하므로, `RoutineSlotCell`에서 드래그 시작 시 `activeItem`에 루틴 인스턴스 아이템을 설정하면 된다. 기존 `handleDragStart`가 `event.active.data.current?.item`을 읽으므로 `data`에 `item`을 넣으면 자동 연동된다.

### 5-2. RoutineSlotCell — 드롭 대상 추가

현재 `RoutineSlotCell`은 `useDroppable`이 없다. 빈 슬롯과 채워진 슬롯 모두 드롭 대상으로 등록.

```ts
// RoutineSlotCell 내부 (빈 슬롯 + 채워진 슬롯 공통)
const droppableId = `routine-${coord.period}-${coord.priority}`;
const { isOver, setNodeRef: setDropRef } = useDroppable({
  id: droppableId,
  data: { coord, isRoutineSlot: true },
  disabled: isReadOnly,
});
```

드롭 존 식별자에 `routine-` 접두어를 붙여 태스크 슬롯(`morning-1` 등)과 구분한다.

isOver 시 스타일: 기존 `SlotCell`과 동일하게 `ring-2 ring-[var(--foreground)] bg-[var(--foreground)]/8`.

### 5-3. handleDragEnd — 루틴 간 교환 분기 추가

현재 `handleDragEnd`는 `slots` (태스크 슬롯 맵)만 보고 교환 여부를 판단한다.
루틴 드롭(`over.data.current?.isRoutineSlot === true`) 케이스를 분기로 추가.

```
handleDragEnd 분기 구조 (추가 후):

1. over.id === 'backlog-drop' → 백로그 이동 (기존 유지)
2. over.data.current?.isRoutineSlot === true
   → 루틴 슬롯 드롭 처리 (신규)
   a. draggedItem이 루틴 인스턴스인지 확인 (isRoutineInstance)
   b. 루틴 인스턴스가 아니면 무시 (태스크 → 루틴 슬롯 이동 불가)
   c. 대상 루틴 슬롯에 다른 루틴 인스턴스가 있으면 교환 (batchUpdate)
   d. 대상 루틴 슬롯이 비어 있으면 단순 이동 (assignRoutineInstanceSlot)
3. coord 있음, isRoutineSlot 없음 → 태스크 슬롯 드롭 처리 (기존 유지)
   → 루틴 인스턴스를 태스크 슬롯에 드롭하면 무시 처리 추가
```

#### 루틴 슬롯 드롭 핸들러 상세

```ts
// 루틴 교환에 필요한 추가 데이터
// draggedItem.data.current.currentSlot: 드래그 출발 좌표
// over.data.current.coord: 드롭 대상 좌표
// routineSlots[coord.period][coord.priority]: 대상 슬롯의 기존 아이템

const targetRoutineItem = routineSlots[coord.period][coord.priority];

if (!targetRoutineItem) {
  // 빈 슬롯 → 단순 이동
  assignRoutineInstanceSlot(itemId, coord);
} else if (targetRoutineItem.id !== itemId) {
  // 채워진 슬롯 → 교환
  const draggedCurrentSlot = active.data.current?.currentSlot as SlotCoord | null;
  if (draggedCurrentSlot) {
    batchUpdate((prev) => ({
      ...prev,
      routineInstances: prev.routineInstances.map((ri) => {
        if (ri.id === itemId) return { ...ri, slot: coord };
        if (ri.id === targetRoutineItem.id) return { ...ri, slot: draggedCurrentSlot };
        return ri;
      }),
    }));
  }
  // draggedCurrentSlot이 null(백로그 루틴 → 루틴 슬롯)이면:
  // 대상 루틴을 백로그로, 드래그한 루틴을 슬롯으로
  else {
    batchUpdate((prev) => ({
      ...prev,
      routineInstances: prev.routineInstances.map((ri) => {
        if (ri.id === itemId) return { ...ri, slot: coord };
        if (ri.id === targetRoutineItem.id) return { ...ri, slot: null };
        return ri;
      }),
    }));
  }
}
```

`handleDragEnd`의 `useCallback` 의존성 배열에 `routineSlots` 추가 필요.

### 5-4. 수정 컴포넌트 목록

| 컴포넌트/파일 | 변경 내용 |
|---|---|
| `RoutineSlotCell.tsx` | `useDraggable` + `useDroppable` 추가, 그립 핸들 UI 추가 |
| `page.tsx` `handleDragEnd` | 루틴 슬롯 드롭 분기 추가, `routineSlots` 의존성 추가 |
| `page.tsx` `handleDragStart` | 변경 없음 (이미 `item` 기반으로 동작) |

---

## 6. 에지 케이스 처리

### 6-1. 시간 지정된 루틴 (`scheduledTime`이 있는 루틴)

`scheduledTime`은 `Routine` 정의에 있는 표시용 메타데이터이며, 슬롯 배치 로직과 독립적이다.
드래그 교환 후에도 `scheduledTime`은 그대로 유지된다 (루틴 원본이 바뀌지 않으므로).
UI에서는 슬롯이 바뀐 루틴 카드에 기존과 동일하게 시간 레이블이 표시된다.

**정책**: 드래그를 막지 않는다. 사용자가 오늘만 위치를 바꾸는 것이므로 `scheduledTime`의 의미(알림, 정렬 등)는 현재 MVP에서 강제 적용하지 않는다. 향후 알림 기능 도입 시 재검토.

### 6-2. 루틴 슬롯과 태스크 슬롯이 같은 좌표에 공존

현재 구조에서 태스크 슬롯(상단 행)과 루틴 슬롯(하단 행)은 같은 `SlotCoord`를 가질 수 있다. 예: 태스크 `{ morning, 1 }` + 루틴 인스턴스 `{ morning, 1 }` 동시 존재.

드래그 드롭 대상은 `isRoutineSlot` 플래그로 구분된다. `RoutineSlotCell`만 루틴 드롭을 받는다. 따라서 루틴을 태스크 슬롯 위에 드롭해도 무시된다.

### 6-3. 태스크를 루틴 슬롯으로 드래그

`handleDragEnd`에서 `over.data.current?.isRoutineSlot === true`이고 드래그한 아이템이 루틴 인스턴스가 아니면(태스크이면) 드롭을 무시한다.

### 6-4. 같은 슬롯으로 드롭 (제자리)

`targetRoutineItem.id === itemId` 이면 아무 것도 하지 않는다. 기존 태스크 교환 로직과 동일한 패턴.

### 6-5. 완료된 루틴 인스턴스가 대상 슬롯에 있을 때

완료된 루틴은 `useDraggable` disabled이므로 드래그 못 하지만, 드롭 대상(`useDroppable`)에는 제한을 두지 않는다. 완료된 루틴이 있는 슬롯으로 드래그하면 교환이 발생한다. 완료된 루틴이 드래그한 루틴의 출발 슬롯으로 이동한다.

**정책**: 허용. 사용자가 완료 루틴과 교환하는 것은 의도적인 행위로 볼 수 있다. 단, 완료된 루틴은 그 자리에서 다시 드래그할 수 없다.

### 6-6. 읽기 전용 모드 (과거 날짜)

`isReadOnly === true`이면 `useDraggable`과 `useDroppable` 모두 `disabled: true`. 기존 태스크 드래그와 동일.

### 6-7. 루틴 인스턴스가 백로그에 있을 때 (slot === null)

백로그의 루틴 인스턴스를 루틴 슬롯으로 드래그하는 것은 현재 백로그 UI에서 지원 여부를 별도로 결정해야 한다.

**현재 범위**: `RoutineSlotCell` 기반 드래그만 구현. 백로그 루틴 → 루틴 슬롯 드래그는 이번 스펙에 포함하지 않는다 (백로그의 기존 "슬롯 배치" 버튼 사용).

---

## 7. 데이터 무결성 보장

### 7-1. 원자적 교환

두 인스턴스의 슬롯을 반드시 `batchUpdate` 하나에서 동시에 변경한다. 첫 번째 업데이트 후 두 번째 업데이트 전에 렌더가 일어나도 중간 상태가 저장되지 않도록 단일 setState를 사용한다.

### 7-2. `defaultSlot` 불변성

`Routine.defaultSlot`은 이 기능에서 절대 수정하지 않는다. `updateRoutine`을 호출하지 않는다. 오직 `RoutineInstance.slot`만 조작한다.

### 7-3. 내일 인스턴스 격리

`useDailyRollover`에서 내일 인스턴스를 생성할 때 `createRoutineInstance(routine, date)`를 호출하며, 이 함수는 `slot: { ...routine.defaultSlot }`을 사용한다. 오늘 변경된 `ri.slot`은 내일 인스턴스에 전파되지 않는다.

### 7-4. 슬롯 충돌 방지

같은 슬롯 좌표에 두 루틴이 동시에 배치되는 경우를 교환 로직이 원천 차단한다. A를 B 자리로 옮기면서 B를 A 자리로 옮기므로, 빈 슬롯 이동 시에도 출발지가 비워진다.

---

## 8. 구현 태스크

### Developer
- [ ] `RoutineSlotCell.tsx`: `useDraggable` 추가 — `id: item.id`, `data: { item, isRoutineInstance: true, currentSlot: coord }`
- [ ] `RoutineSlotCell.tsx`: `useDroppable` 추가 — `id: routine-{period}-{priority}`, `data: { coord, isRoutineSlot: true }`
- [ ] `RoutineSlotCell.tsx`: `isOver` 상태에 따른 드롭 대상 강조 스타일 추가
- [ ] `RoutineSlotCell.tsx`: `isDragging` 상태에 따른 opacity 처리
- [ ] `RoutineSlotCell.tsx`: 그립 핸들(`GripVertical`) 추가 — 미완료 루틴, 호버 시 노출
- [ ] `page.tsx` `handleDragEnd`: `isRoutineSlot` 분기 추가
- [ ] `page.tsx` `handleDragEnd`: 루틴↔루틴 교환 `batchUpdate` 로직 작성
- [ ] `page.tsx` `handleDragEnd`: 태스크→루틴 슬롯 드롭 무시 처리
- [ ] `page.tsx` `handleDragEnd`: `useCallback` 의존성에 `routineSlots` 추가
- [ ] `page.tsx`: `DragOverlay`에서 루틴 인스턴스 title 표시 (`routineDetails.title` fallback 처리)

### Design
- [ ] 드래그 중 루틴 카드 스타일 (opacity 0.35 — ItemCard와 동일)
- [ ] 드롭 가능한 루틴 슬롯 hover 스타일 (ring-2, 기존 SlotCell isOver와 동일하게)
- [ ] 그립 핸들 위치: 루틴 카드 좌측 (기존 ItemCard의 GripVertical과 동일한 패턴)

---

## 9. 비-목표

- **태스크 ↔ 루틴 슬롯 교환**: 복잡도 우려, 이번 범위 제외 (PO 확정)
- **Routine.defaultSlot 변경**: 드래그로 루틴 정의를 영구 변경하는 것은 지원하지 않음
- **내일 이후 인스턴스에 전파**: 오늘 날짜 인스턴스의 slot만 변경
- **시간 지정 루틴의 드래그 제한**: MVP에서는 scheduledTime을 드래그 제약 조건으로 사용하지 않음
- **백로그 루틴 → 루틴 슬롯 직접 드래그**: 이번 스펙 제외, 기존 "슬롯 배치" 버튼 사용

---

## 10. 검증 방법

### 시나리오 기반 검증

1. **기본 교환**: 루틴 A(오전 1순위)를 루틴 B(오전 2순위) 위로 드래그 → A가 오전 2순위, B가 오전 1순위에 표시. 페이지 새로고침 후에도 유지.
2. **빈 슬롯 이동**: 루틴 A(오전 1순위)를 빈 루틴 슬롯(오후 3순위)으로 드래그 → A가 오후 3순위에 표시, 오전 1순위 슬롯 비어있음.
3. **내일 불변성**: 오늘 교환 후 날짜를 내일로 이동 → 루틴이 원래 `defaultSlot` 위치에 표시.
4. **완료된 루틴 드래그 불가**: 완료된 루틴 카드에 그립 핸들 없음, 드래그 시도 시 반응 없음.
5. **태스크 → 루틴 슬롯 드롭 무시**: 태스크 카드를 루틴 행 슬롯으로 드래그 → 드롭 되지 않음.
6. **시간 지정 루틴 교환**: `scheduledTime`이 있는 루틴 교환 후 시간 레이블이 교환된 위치에서도 정상 표시.
7. **읽기 전용**: 과거 날짜에서 루틴 카드 드래그 불가.

---

## 11. 미해결 / 결정 필요

1. **그립 핸들 vs 전체 카드 드래그**: `RoutineSlotCell`은 작은 크기(min-h-40px)이므로 전체 카드 드래그로 하면 호버 액션(완료/삭제 오버레이)과 충돌할 수 있다. `ItemCard`처럼 핸들에만 `listeners`를 붙이는 방식 권장. 개발자 판단으로 결정.
2. **시간대 간 루틴 교환**: 오전 루틴을 저녁 슬롯으로 이동하는 것도 허용할지. 현재 스펙에서는 제한 없이 허용. 추후 UX 테스트 후 재검토.
3. **교환 완료 피드백**: 슬롯 교환 후 별도 애니메이션/토스트 필요 여부. 지금은 즉시 리렌더로 충분하다고 판단, 필요시 추가.

---

## 다음 단계

1. **developer** 호출 — `RoutineSlotCell` 드래그블/드롭블 추가 + `handleDragEnd` 분기 로직 구현
2. **design** 호출 — 드롭 대상 강조 스타일 + 그립 핸들 UI (developer와 병렬 가능)
