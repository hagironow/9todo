---
name: No shadcn/ui
description: shadcn/ui 컴포넌트 라이브러리 사용하지 않고 커스텀 컴포넌트로 직접 빌드
type: feedback
---

shadcn/ui를 사용하지 않는다. Button, Dialog, Input 등 필요한 UI 컴포넌트는 직접 만든다.

**Why:** 플로디에서도 shadcn을 많이 쓰긴 했지만, todoslot은 UI가 단순(3x3 그리드 + 카드)하므로 직접 만들기로 결정. 사용자가 선호.

**How to apply:** 패키지 설치 시 shadcn 관련 의존성 추가하지 않기. tokens.css에서 shadcn import 제거. Tailwind v4만으로 스타일링.
