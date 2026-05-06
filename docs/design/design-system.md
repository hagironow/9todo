# Design System

> 플로디(flowdy)와 동일한 디자인 토큰 세팅

## 컬러 시스템

### 포인트 컬러 (코랄)
- **Point Pastel**: `var(--g-point)` — `#FFB0B5`
- **Point Vivid (CTA)**: `var(--g-point-vivid)` — `#FF5C65`
- **Error**: `var(--g-error)` — `#F87060`

### 시맨틱 토큰

| 용도 | 변수 | 라이트 | 다크 |
|---|---|---|---|
| 페이지 배경 | `--background` | #FFFFFF | #0f0f0f |
| 기본 텍스트 | `--foreground` | #1A1A1A | #e0e0e0 |
| 카드/서피스 | `--card` | #F0F0F0 | #181818 |
| 보조 텍스트 | `--muted-foreground` | #8A8A8A | #666 |
| 보조 배경 | `--muted` | #F0F0F0 | #181818 |
| 테두리 | `--border` | #E0E0E0 | #1f1f1f |
| 입력 필드 | `--input` | #E0E0E0 | #2a2a2a |
| CTA/강조 | `--accent` | #FF5C65 | #FF5C65 |
| 포커스 링 | `--ring` | #FFB0B5 | #FFB0B5 |
| Primary | `--primary` | #1A1A1A | #FFFFFF |

### 색상 사용 규칙
- **하드코딩 금지**: `color: #ff0000` 대신 `color: var(--destructive)`
- **시맨틱 우선**: 용도에 맞는 변수 사용
- **다크 모드 자동 대응**: `.dark` 클래스만으로 전환

## 타이포그래피

```css
--fs-step: 16px    /* 스텝명 */
--fs-item: 15px    /* 항목명 */
--fs-tag:  14px    /* 태그·상태 */
--fs-row-py: 16px  /* 리스트 행 세로 패딩 */
```

- 기본 폰트: `var(--font-sans)` — Pretendard + 시스템 폰트
- 코드 폰트: `var(--font-mono)` — SF Mono, Fira Code
- 헤딩 폰트: `var(--font-heading)` — Poppins
- `.font-small` 클래스로 소형 폰트 스케일 활성화

## Radius

`--radius: 0.375rem (6px)` 기준 계산:

```
--radius-sm:  3.6px   (0.6x)
--radius-md:  4.8px   (0.8x)
--radius-lg:  6px     (1.0x)
--radius-xl:  8.4px   (1.4x)
--radius-2xl: 10.8px  (1.8x)
--radius-3xl: 13.2px  (2.2x)
--radius-4xl: 15.6px  (2.6x)
```

## 태그 시스템

```html
<span class="tag tag-amber">대기</span>
<span class="tag tag-blue">진행 중</span>
<span class="tag tag-violet">기능</span>
<span class="tag tag-green">완료</span>
<span class="tag tag-red">긴급</span>
<span class="tag tag-orange">경고</span>
<span class="tag tag-gray">보류</span>
<span class="tag tag-gray-stroke">스트로크</span>
<span class="tag tag-gray-coral">코랄 강조</span>
```

## 애니메이션

- `animate-fade-out` — 2초 페이드 아웃
- `animate-result-pop` — 0.35초 바운스 팝
- `animate-result-shake` — 0.4초 좌우 흔들기

## 스택

- Tailwind CSS v4 (`@theme inline`)
- shadcn/ui (base-nova 스타일)
- tw-animate-css

## 접근성
- 포커스 상태: `outline: 2px solid var(--ring)`
- 색상 대비: WCAG AA 이상
- 인터랙티브 요소: 최소 44x44px 터치 영역
