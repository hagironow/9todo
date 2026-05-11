---
name: utm
description: UTM 단축 링크 생성, 조회, GA4 채널 성과 확인
---

# UTM 링크 관리 스킬

9todo.app 도메인에 짧은 경로로 UTM 링크를 생성/관리합니다.
예: `9todo.app/k1` → `9todo.app?utm_source=kakao&utm_medium=social&utm_campaign=pmf_w1`

## 사용법

```
/utm 채널명      # 링크 생성 또는 조회
/utm list        # 전체 링크 목록
```

---

## 명령어 상세

### 1. `/utm 채널명` - 링크 생성 또는 조회

채널명을 입력하면:
- **존재하는 경우**: 해당 링크 정보 표시
- **없는 경우**: 새 링크 생성

**실행 순서:**

1. `docs/utm-links.md` 파일 읽기
2. 채널명이 링크 목록에 있는지 확인
3. **있으면**: 해당 링크 정보 출력
4. **없으면**: 새 링크 생성
   - 네이밍 규칙에 따라 코드 생성 (첫 글자 + 다음 순번)
   - `public/_redirects` 파일에 리다이렉트 추가
   - `docs/utm-links.md` 테이블에 추가

**네이밍 규칙:**
| 소스 | 코드 접두사 | 예시 |
|------|-------------|------|
| kakao | k | k1, k2, k3 |
| threads | th | th1, th2 |
| instagram | i | i1, i2 |
| meta (광고) | m | m1, m2 |
| linkedin | l | l1, l2 |
| reddit | rd | rd1, rd2 |
| disquiet | d | d1, d2 |
| influencer | inf | inf1, inf2 |
| referral | r | r1, r2 |
| 기타 | o | o1, o2 |

**출력 예시:**
```
UTM 링크: threads

코드: th1
단축 URL: 9todo.app/th1
전체 URL: https://9todo.app?utm_source=threads&utm_medium=organic&utm_campaign=pmf_w1

_redirects 파일에 추가됨.
```

---

### 2. `/utm list` - 전체 링크 목록

**실행 순서:**
1. `docs/utm-links.md` 파일 읽기
2. 테이블 형식으로 출력

---

## 파일 위치

| 파일 | 용도 |
|------|------|
| `docs/utm-links.md` | UTM 링크 관리 문서 (마스터 테이블) |
| `public/_redirects` | Cloudflare Pages 리다이렉트 설정 |

---

## 리다이렉트 형식

`_redirects` 파일에 추가할 형식:
```
/코드 https://9todo.app?utm_source=소스&utm_medium=매체&utm_campaign=캠페인 302
```

**매체(medium) 기본값:**
| 소스 | 매체 |
|------|------|
| meta | paid |
| threads, instagram, linkedin, kakao | organic |
| reddit, disquiet | organic |
| influencer | dm |
| referral | word_of_mouth |

**캠페인 기본값:** `pmf_w1` (현재 PMF 검증 1차)

---

## 주의사항

- 코드는 중복되면 안 됨
- 링크 추가 후 배포 필요 (Cloudflare Pages가 `_redirects` 읽음)
- GA4에서 utm_source / utm_medium / utm_campaign 자동 인식됨
