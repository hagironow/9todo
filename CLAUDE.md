# Agent Starter Pack

프로젝트 초기 방향 설정에 특화된 에이전트 팩.

## 에이전트 구성

| 에이전트 | 역할 | 호출 시점 |
|---------|------|----------|
| **po** | 제품 방향 설정 + 게이트키퍼 + 회의 소집 | "방향 잡아줘", 새 기능 요청 시 |
| **planner** | 기능 사양/UX 흐름 작성 | po 게이트 통과 후 |
| **developer** | 데이터/API/로직 구현 | planner 사양 산출 후 |
| **design** | 디자인 토큰 세팅 + UI 구현 | "디자인 토큰 세팅해줘", UI 작업 시 |

## 표준 워크플로우

```
새 프로젝트 시작
  ↓
PO 에이전트 (초기 설정 모드)
  → 6개 질문 인터뷰
  → docs/product/ 문서 6종 자동 생성
  ↓
Design 에이전트 (토큰 세팅 모드)
  → 프라이머리 컬러 1개만 질문
  → tokens.css 자동 생성
  ↓
[개발 시작]
  ↓
새 기능 요청 → PO (게이트키퍼) → Planner (사양) → Developer + Design (구현)
```

## 제품 컨텍스트 (에이전트 판단 근거)

모든 에이전트는 의사결정 전 반드시 docs/product/ 파일을 읽는다:

```
docs/product/vision.md        — 비전 + 북극성
docs/product/positioning.md   — 포지셔닝 + 타겟
docs/product/personas.md      — 페르소나 정의
docs/product/non-goals.md     — 안 할 것 목록 (게이트키퍼)
docs/product/scenarios.md     — 핵심 시나리오
docs/product/core-concepts.md — 도메인 용어
```

## 디자인 토큰

- 파일: `tokens.css`
- 가이드: `docs/design/design-system.md`
- 색상 하드코딩 금지 — 반드시 `var(--primary)` 등 CSS 변수 사용
- 라이트/다크 모드 지원

## 사양 산출물

planner가 생성하는 사양 파일:
```
docs/specs/spec_{slug}_{YYYY-MM-DD}.md
```

## 핵심 규칙

1. **PRE-FLIGHT 필수** — developer/design 에이전트는 작업 전 반드시 grep으로 기존 코드 검색
2. **컨텍스트 로드 필수** — po/planner는 docs/product/ 파일 전부 읽고 시작
3. **컨펌 필수** — 큰 결정은 사용자 확인 후 진행
4. **프레임워크 무관** — 특정 프레임워크에 의존하지 않음
