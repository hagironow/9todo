---
name: 커밋 시 반드시 /commit 스킬 사용
description: 커밋 요청 시 직접 git commit 하지 말고 반드시 /commit 스킬을 사용할 것
type: feedback
---

커밋 요청 시 반드시 `/commit` 스킬을 사용할 것. 절대 main에 직접 git commit 하지 않는다.

**Why:** 멀티 세션 병렬 작업 시, main에 직접 커밋하면 다른 세션의 변경사항을 덮어쓰는 사고가 발생. /commit 스킬은 pull → 브랜치 생성 → commit → push → PR → squash merge 플로우를 따르므로, merge 시점에 충돌이 감지되어 덮어쓰기를 방지할 수 있다.

**How to apply:** 사용자가 "커밋해줘", "커밋", "반영해줘" 등 커밋 관련 요청을 하면, 직접 git 명령어를 쓰지 말고 `/commit` 스킬을 호출한다.
