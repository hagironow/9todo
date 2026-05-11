# QA Report: 9todo

> 검사일: 2026-05-11
> 빌드: 성공 (Next.js 16.2.4 Turbopack, 컴파일 2.3s, TypeScript 4.2s, 정적 페이지 5개)

## 요약
- 통과: 12개
- 실패: 8개
- 경고: 7개

---

## STEP 1: 빌드 검증

### 통과
- [x] `npm run build` 성공 — 에러 0, TypeScript 통과
- [x] 정적 페이지 5개 생성: `/`, `/_not-found`, `/dashboard`, `/sitemap.xml`

---

## STEP 2: 토큰 준수

### 실패 (수정 필요)
- [ ] **NowFocus.tsx 하드코딩 색상 다수** — **문제:** `#111111`, `#1a1a1a`, `#e0e0e0`, `#888`, `#333`, `#fff`, `#f0f0f0`, `#2a2a2a`, `#e8e8e8`, `#1e1e1e` 등 약 20개 이상의 hex/rgba 값이 인라인 style에 직접 사용됨 (타이머 다크/라이트 모드 분기). — **수정:** CSS 변수(`--timer-bg`, `--timer-fg` 등)를 tokens.css에 정의하고 `var()` 참조로 교체. 현재 컴포넌트 내에서 인라인으로 CSS 변수를 설정하는 패턴이 있으나 값 자체가 하드코딩됨.
- [ ] **GoalCompassDemo.tsx 하드코딩 색상** — **문제:** 컴포넌트 상단 `T` 객체에 `#0a0a0a`, `#111113`, `#e0e0e0` 등 10여 개 토큰 값이 하드코딩. 프로젝트 데모 데이터에도 `#60A5FA`, `#A78BFA` 등 색상 직접 사용. — **수정:** 랜딩 데모 컴포넌트이므로 경감 사유가 있으나, 최소한 `T` 객체는 landing-tokens.css의 `var()` 참조로 교체 권장.
- [ ] **CalendarViewDemo.tsx 하드코딩 색상** — **문제:** GoalCompassDemo와 동일한 패턴. `T` 객체 및 데모 데이터에 hex 색상 직접 사용. — **수정:** 동일하게 `var()` 참조로 교체 권장.
- [ ] **landing/page.tsx 하드코딩 rgba** — **문제:** `rgba(10,10,11,0.92)`, `rgba(255,255,255,0.08)`, `#F97066`, `#1a1a1a` 등 인라인 스타일에 약 15개 색상 하드코딩. — **수정:** landing-tokens.css 변수 참조로 교체.
- [ ] **CalendarView.tsx / WeeklyTimelineView.tsx rgba 하드코딩** — **문제:** 완료율 배경색 `rgba(34, 197, 94, 0.10)` 등 조건별 색상이 하드코딩. — **수정:** `--g-success` 기반 CSS 변수 + opacity 조합 또는 별도 시맨틱 토큰 정의.
- [ ] **EnergyLevelInput.tsx rgba 하드코딩** — **문제:** 에너지 레벨별 배경색 `rgba(255, 107, 107, 0.15)`, `rgba(81, 207, 102, 0.15)` 등. — **수정:** 시맨틱 토큰 `--energy-low-bg`, `--energy-high-bg` 등 정의.

### 경고 (권장)
- [ ] **프로젝트 색상 폴백 `#8A8A8A`** — **권장:** `ItemCard.tsx`, `SlotCell.tsx`, `BacklogItem.tsx`, `QuickInput.tsx`, `CalendarView.tsx`, `BacklogPanel.tsx`, `dashboard/page.tsx` 등 7개 파일에서 `project?.color ?? '#8A8A8A'` 패턴 사용. 이는 사용자 데이터 기반 동적 값이므로 허용 가능하나, `var(--g-text-muted)` 등 토큰 참조로 통일 권장.
- [ ] **ParticleBurst.tsx 하드코딩** — **권장:** 파티클 이펙트 색상 `#FFB0B5`, `#FF6E6E`, `#ffffff`, `#1A1A1A` 하드코딩. Canvas API 특성상 CSS 변수 직접 참조가 어려우므로 `getComputedStyle`로 런타임 해결 권장.
- [ ] **Button.tsx danger 색상 `#fff`** — **권장:** 하드코딩된 `'#fff'` 값을 토큰 참조로 교체.

---

## STEP 3: 접근성 (a11y)

### 통과
- [x] 모든 `<img>` 태그에 `alt` 속성 존재 (`alt="9todo"`, `alt="Playke"`, `alt={name ?? ''}`)
- [x] `<html lang="ko">` 설정 완료 (`src/app/layout.tsx:82`)
- [x] 주요 인터랙티브 요소에 `aria-label` 존재 — MobileHeader, QuickInput, Sidebar ProjectMenu, CalendarModal, SlotPickerModal, DateNav 등 30개 이상
- [x] focus 스타일 존재 — `focus:border-[var(--accent)]`, `focus:border-[var(--foreground)]`, `focus-visible:ring-2 ring-[var(--ring)]` 등 다수 컴포넌트에서 구현

### 실패 (수정 필요)
- [ ] **Sidebar 검색 버튼 aria-label 누락** — **문제:** `src/components/layout/Sidebar.tsx:138-143` 검색 아이콘 버튼에 `aria-label` 없음. — **수정:** `aria-label={t.search}` 추가.
- [ ] **ProjectDetailView 아이콘 버튼 aria-label 누락** — **문제:** `src/components/project-detail/ProjectDetailView.tsx:479-512` 미루기/완료/반복/삭제 아이콘 버튼 4개에 `title`만 있고 `aria-label` 없음. — **수정:** 각 버튼에 `aria-label` 추가 (title과 동일 값).
- [ ] **CalendarView 네비게이션 버튼 aria-label 누락** — **문제:** `src/components/calendar/CalendarView.tsx:563-577` 이전/다음 월/주 이동 버튼에 aria-label 없음. — **수정:** `aria-label={t.prevMonth}` / `aria-label={t.nextMonth}` 추가.
- [ ] **BacklogItem 편집/삭제 버튼 aria-label 누락** — **문제:** `src/components/backlog/BacklogItem.tsx:142-157` 편집(Pencil) 및 삭제(Trash2) 아이콘 버튼에 `title`만 있고 `aria-label` 없음. — **수정:** `aria-label` 추가.
- [ ] **RetrospectiveListView 삭제 버튼 aria-label 누락** — **문제:** `src/components/retrospective/RetrospectiveListView.tsx:133` 삭제 아이콘 버튼에 aria-label 없음. — **수정:** `aria-label` 추가.

### 경고 (권장)
- [ ] **`userScalable: false` 접근성 위반** — **권장:** `src/app/layout.tsx:10` `userScalable: false` 설정은 WCAG 2.1 SC 1.4.4 위반 (확대 차단). 저시력 사용자 접근성 저해. 줌 방지가 필요하다면 CSS `touch-action: manipulation`(이미 적용됨)만으로 충분.

---

## STEP 4: SEO 검증

### 통과
- [x] **title 태그** — root: "9todo — 9칸 타임박스 플래너" (19자), landing: "하루를 9개의 타임박스로 설계하세요 — 9todo" (25자). 60자 이내 통과.
- [x] **meta description** — root: 45자, landing: 59자. 158자 이내 통과.
- [x] **OG 태그 완전** — title, description, image(1200x630), url, siteName, locale 모두 존재. Twitter Card도 설정됨.
- [x] **robots.txt** — `public/robots.txt` 존재. `Allow: /`, `Disallow: /api/`, Sitemap URL 포함.
- [x] **sitemap.xml** — `src/app/sitemap.ts` 존재. `/`와 `/dashboard` 2개 URL 포함. `force-static` 설정.
- [x] **html lang="ko"** — `src/app/layout.tsx:82` 확인.
- [x] **canonical** — root layout에 `alternates.canonical: "/"` 설정.

### 실패 (수정 필요)
- [ ] **dashboard 페이지 h1 없음** — **문제:** `src/app/dashboard/page.tsx`에 `<h1>` 태그가 없음. 앱 페이지이므로 SEO 영향은 적으나, 접근성/구조 측면에서 페이지 제목 역할의 h1 필요. — **수정:** 화면 상단 또는 `sr-only`로 h1 추가 (예: `<h1 className="sr-only">오늘의 시간표</h1>`).

### 경고 (권장)
- [ ] **landing layout에 canonical 미설정** — **권장:** `src/app/(landing)/layout.tsx`에 `alternates.canonical` 없음. root layout에서 상속될 수 있으나, 랜딩이 메인 페이지이므로 명시적 설정 권장.
- [ ] **OG image 파일 크기** — **권장:** `og_9todo.jpg`는 54KB로 적절하나, WebP 전환 시 추가 최적화 가능.

---

## STEP 5: 성능

### 통과
- [x] 빌드 결과물 정상 — 정적 페이지 5개, 컴파일 2.3초

### 실패 (수정 필요)
- [ ] **next/image 미사용** — **문제:** 프로젝트 전체에서 `next/image` import가 0건. 모든 이미지가 `<img>` 태그 사용 (Sidebar, MobileHeader, landing Nav, HeroDemo, Avatar 등 7곳). — **수정:** `next/image`의 `<Image>` 컴포넌트로 교체하여 자동 최적화(WebP 변환, lazy loading, srcset) 활용. 특히 landing 페이지의 로고와 OG 이미지.

### 경고 (권장)
- [ ] **폰트 로딩 최적화 미흡** — **권장:** Poppins와 Pretendard를 외부 CDN `<link>`로 로딩 중 (`src/app/layout.tsx:84-87`). `next/font`를 사용하면 빌드 타임에 폰트를 인라인/셀프호스팅하여 레이아웃 시프트(CLS) 방지 및 로딩 성능 개선. Poppins는 `next/font/google`로, Pretendard는 `next/font/local`로 전환 권장.
- [ ] **dashboard/page.tsx와 landing/page.tsx 모두 'use client'** — **권장:** 두 메인 페이지가 모두 클라이언트 컴포넌트. dashboard는 상태 관리가 필수이므로 불가피하나, landing 페이지는 데모 컴포넌트만 dynamic import하고 나머지 정적 콘텐츠는 서버 컴포넌트로 분리하면 초기 JS 번들 절감 가능.

---

## STEP 6: 반응형/모바일

### 통과
- [x] **모바일 사이드바 전환** — `MobileHeader.tsx`에 햄버거 메뉴 (`onMenuOpen`) 구현. `md:hidden` 반응형 분기.
- [x] **MobileHeader 터치 타겟** — 메뉴/타이머 버튼 `w-8 h-8` (32px). aria-label 포함.

### 경고 (권장)
- [ ] **일부 아이콘 버튼 터치 타겟 44px 미달** — **권장:** `w-6 h-6` (24px) 버튼 다수: QuickInput 프로젝트 선택(24px), BacklogItem 편집/삭제(24px), Sidebar 프로젝트 메뉴(24px), RetrospectiveListView 삭제(24px). 디자인 시스템 가이드에서 "최소 44x44px 터치 영역" 명시. `min-h-[44px] min-w-[44px]` 또는 패딩으로 터치 영역 확대 권장.

### 수동 확인 필요
- [ ] 9칸 그리드 모바일 대응 — `MobileTimetableList.tsx` 존재하여 모바일용 리스트 뷰 제공. 실제 렌더링 확인은 브라우저 테스트 필요.

---

## STEP 7: Anti-patterns

### 실패 (수정 필요)
- [ ] **색상 하드코딩 (STEP 2와 동일)** — **문제:** NowFocus.tsx, landing 데모 컴포넌트, CalendarView.tsx, EnergyLevelInput.tsx 등에서 `var()` 대신 직접 hex/rgba 값 사용. tokens.css 외부에서 약 100개 이상의 하드코딩된 색상값 검출. — **수정:** 모두 CSS 변수 참조로 교체.

### 경고 (권장)
- [ ] **매직 넘버** — **권장:** 인라인 스타일에 `fontSize: 10`, `fontSize: 8`, `borderRadius: 99`, `paddingTop: 40` 등 매직 넘버 다수. 특히 landing 데모 컴포넌트에 집중. 디자인 토큰 스케일(`--fs-step`, `--fs-item` 등) 활용 권장.

---

## 종합 점검표

### 통과
- [x] 빌드 성공 (에러 0, 경고 0)
- [x] TypeScript 컴파일 통과
- [x] 모든 img에 alt 속성
- [x] html lang="ko" 설정
- [x] 주요 컴포넌트 aria-label 존재 (30개 이상)
- [x] focus 스타일 구현
- [x] title 60자 이내
- [x] meta description 158자 이내
- [x] OG 태그 세트 완전
- [x] robots.txt 존재
- [x] sitemap.xml 동적 생성
- [x] canonical 설정 (root)

### 실패 (수정 필요)
- [ ] 색상 하드코딩 6건 (NowFocus, GoalCompassDemo, CalendarViewDemo, landing/page, CalendarView, EnergyLevelInput)
- [ ] aria-label 누락 5건 (Sidebar 검색, ProjectDetailView 4버튼, CalendarView 네비게이션, BacklogItem 편집/삭제, RetrospectiveListView 삭제)
- [ ] next/image 미사용 (img 태그 7곳)
- [ ] dashboard 페이지 h1 없음

### 경고 (권장)
- [ ] userScalable: false 접근성 위반
- [ ] 폰트 로딩 next/font 미사용
- [ ] landing page 'use client' 서버 컴포넌트 분리 가능
- [ ] 터치 타겟 44px 미달 버튼 다수 (w-6 h-6 = 24px)
- [ ] 프로젝트 색상 폴백 #8A8A8A 토큰 미참조
- [ ] 매직 넘버 인라인 스타일 다수
- [ ] landing layout canonical 미설정

### 수동 확인 필요
- [ ] 9칸 그리드 모바일 실제 렌더링 (MobileTimetableList 존재 확인)
- [ ] 다크/라이트 모드 전환 시 하드코딩 색상 불일치 여부
- [ ] 실제 Lighthouse 성능 점수 측정
- [ ] OG 이미지 SNS 미리보기 렌더링 확인
