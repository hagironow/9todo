// 브라우저 콘솔(F12 → Console)에서 실행
// 기존 데이터를 유지하면서 마케팅 태스크를 추가합니다

(function() {
  const STORAGE_KEY = '9todo_state';
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) { alert('9todo 데이터가 없습니다. 앱을 먼저 한 번 열어주세요.'); return; }

  const state = JSON.parse(raw);

  // 프로젝트 추가 (이미 있으면 스킵)
  const newProjects = [
    { id: 'proj_marketing', name: 'PMF 마케팅', colorIndex: 0, color: '#FF6E6E', createdAt: '2026-05-11T10:00:00.000Z', archived: false },
    { id: 'proj_setup', name: '세팅/인프라', colorIndex: 2, color: '#4ECDC4', createdAt: '2026-05-11T10:00:00.000Z', archived: false },
  ];

  newProjects.forEach(p => {
    if (!state.projects.find(ep => ep.id === p.id)) {
      state.projects.push(p);
    }
  });

  // 마케팅 태스크 48개
  const tasks = [
    // === 5/12 (월) — 세팅 + 초기 유입 ===
    { id: 'item_setup_01', title: 'GA4 이벤트 트래킹 5개 작동 확인', projectId: 'proj_setup', date: '2026-05-12', slot: { period: 'morning', priority: 1 } },
    { id: 'item_setup_02', title: 'UTM 링크 7종 생성', projectId: 'proj_setup', date: '2026-05-12', slot: { period: 'morning', priority: 2 } },
    { id: 'item_setup_03', title: '메타 광고 크리에이티브 3종 Canva 제작', projectId: 'proj_setup', date: '2026-05-12', slot: { period: 'morning', priority: 3 } },
    { id: 'item_mkt_0512_01', title: '메타 광고 캠페인 세팅 + 라이브 (일 1만원)', projectId: 'proj_marketing', date: '2026-05-12', slot: { period: 'afternoon', priority: 1 } },
    { id: 'item_mkt_0512_02', title: '디스콰이엇 제품 등록', projectId: 'proj_marketing', date: '2026-05-12', slot: { period: 'afternoon', priority: 2 } },
    { id: 'item_mkt_0512_03', title: '쓰레드 D1: 빌딩일지 포스트', projectId: 'proj_marketing', date: '2026-05-12', slot: { period: 'afternoon', priority: 3 } },
    { id: 'item_mkt_0512_04', title: '인플루언서 DM 2명 발송', projectId: 'proj_marketing', date: '2026-05-12', slot: { period: 'evening', priority: 1 } },
    { id: 'item_mkt_0512_05', title: '지인 1:1 DM 5명 발송', projectId: 'proj_marketing', date: '2026-05-12', slot: { period: 'evening', priority: 2 } },

    // === 5/13 (화) ===
    { id: 'item_mkt_0513_01', title: '쓰레드 D2: 공감/고통 포스트', projectId: 'proj_marketing', date: '2026-05-13', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0513_02', title: '링크드인 글 1개: 시간관리 개인스토리', projectId: 'proj_marketing', date: '2026-05-13', slot: { period: 'morning', priority: 2 } },
    { id: 'item_mkt_0513_03', title: '링크드인 DM 3명 발송', projectId: 'proj_marketing', date: '2026-05-13', slot: { period: 'morning', priority: 3 } },
    { id: 'item_mkt_0513_04', title: '인플루언서 DM 2명 발송', projectId: 'proj_marketing', date: '2026-05-13', slot: { period: 'afternoon', priority: 1 } },
    { id: 'item_mkt_0513_05', title: '레딧 r/productivity 포스트 작성+발행', projectId: 'proj_marketing', date: '2026-05-13', slot: { period: 'afternoon', priority: 2 } },
    { id: 'item_mkt_0513_06', title: 'GA4 대시보드 확인 (유입 수, 소스별)', projectId: 'proj_setup', date: '2026-05-13', slot: { period: 'evening', priority: 1 } },

    // === 5/14 (수) ===
    { id: 'item_mkt_0514_01', title: '메타 광고 3일 데이터 → CTR 최하위 1개 끄기', projectId: 'proj_marketing', date: '2026-05-14', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0514_02', title: '쓰레드 D3: 인사이트 포스트', projectId: 'proj_marketing', date: '2026-05-14', slot: { period: 'morning', priority: 2 } },
    { id: 'item_mkt_0514_03', title: '링크드인 DM 3명 발송', projectId: 'proj_marketing', date: '2026-05-14', slot: { period: 'morning', priority: 3 } },
    { id: 'item_mkt_0514_04', title: '인플루언서 DM 2명 발송', projectId: 'proj_marketing', date: '2026-05-14', slot: { period: 'afternoon', priority: 1 } },
    { id: 'item_mkt_0514_05', title: '지인 1:1 DM 5명 발송', projectId: 'proj_marketing', date: '2026-05-14', slot: { period: 'afternoon', priority: 2 } },
    { id: 'item_mkt_0514_06', title: '레딧 댓글 전부 답변', projectId: 'proj_marketing', date: '2026-05-14', slot: { period: 'evening', priority: 1 } },

    // === 5/15 (목) ===
    { id: 'item_mkt_0515_01', title: '쓰레드 D4: 앱 스크린샷 기능소개', projectId: 'proj_marketing', date: '2026-05-15', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0515_02', title: '디스콰이엇 메이커 로그 1개 작성', projectId: 'proj_marketing', date: '2026-05-15', slot: { period: 'morning', priority: 2 } },
    { id: 'item_mkt_0515_03', title: '링크드인 DM 3명 발송', projectId: 'proj_marketing', date: '2026-05-15', slot: { period: 'afternoon', priority: 1 } },
    { id: 'item_mkt_0515_04', title: '인플루언서 DM 2명 + 응답자 팔로업', projectId: 'proj_marketing', date: '2026-05-15', slot: { period: 'afternoon', priority: 2 } },

    // === 5/16 (금) ===
    { id: 'item_mkt_0516_01', title: '메타 광고 5일 → 승리 크리에이티브 1개 집중', projectId: 'proj_marketing', date: '2026-05-16', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0516_02', title: '쓰레드 D5: 질문형 포스트', projectId: 'proj_marketing', date: '2026-05-16', slot: { period: 'morning', priority: 2 } },
    { id: 'item_mkt_0516_03', title: '링크드인 글 2개째: 인사이트+앱언급', projectId: 'proj_marketing', date: '2026-05-16', slot: { period: 'morning', priority: 3 } },
    { id: 'item_mkt_0516_04', title: '링크드인 DM 3명 발송', projectId: 'proj_marketing', date: '2026-05-16', slot: { period: 'afternoon', priority: 1 } },
    { id: 'item_mkt_0516_05', title: '레딧 r/SideProject 포스트 작성+발행', projectId: 'proj_marketing', date: '2026-05-16', slot: { period: 'afternoon', priority: 2 } },
    { id: 'item_mkt_0516_06', title: '1주차 중간 점검: CTR/CPC/D1리텐션 기록', projectId: 'proj_setup', date: '2026-05-16', slot: { period: 'evening', priority: 1 } },

    // === 5/17 (토) ===
    { id: 'item_mkt_0517_01', title: '쓰레드 D6: 1주차 회고 포스트', projectId: 'proj_marketing', date: '2026-05-17', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0517_02', title: 'GA4 주간 리포트 + D1 리텐션 확인', projectId: 'proj_setup', date: '2026-05-17', slot: { period: 'morning', priority: 2 } },

    // === 5/18 (일) ===
    { id: 'item_mkt_0518_01', title: '쓰레드 D7: 개인 스토리 포스트', projectId: 'proj_marketing', date: '2026-05-18', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0518_02', title: '2주차 콘텐츠 초안 작성', projectId: 'proj_marketing', date: '2026-05-18', slot: { period: 'afternoon', priority: 1 } },

    // === 5/19 (월) — 2주차 시작 ===
    { id: 'item_mkt_0519_01', title: '메타 광고 일예산 6000원으로 조정', projectId: 'proj_marketing', date: '2026-05-19', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0519_02', title: '쓰레드 D8 포스트', projectId: 'proj_marketing', date: '2026-05-19', slot: { period: 'morning', priority: 2 } },
    { id: 'item_mkt_0519_03', title: 'D7 리텐션 데이터 확인 (5/12 유입자)', projectId: 'proj_setup', date: '2026-05-19', slot: { period: 'morning', priority: 3 } },

    // === 5/20 (화) ===
    { id: 'item_mkt_0520_01', title: '쓰레드 D9 포스트', projectId: 'proj_marketing', date: '2026-05-20', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0520_02', title: '레딧 r/ADHD 포스트 작성+발행', projectId: 'proj_marketing', date: '2026-05-20', slot: { period: 'afternoon', priority: 1 } },

    // === 5/21 (수) ===
    { id: 'item_mkt_0521_01', title: '쓰레드 D10 포스트', projectId: 'proj_marketing', date: '2026-05-21', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0521_02', title: '링크드인 글 3개째: PMF 빌딩일지', projectId: 'proj_marketing', date: '2026-05-21', slot: { period: 'morning', priority: 2 } },

    // === 5/22 (목) ===
    { id: 'item_mkt_0522_01', title: '쓰레드 D11 포스트', projectId: 'proj_marketing', date: '2026-05-22', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0522_02', title: '디스콰이엇 메이커 로그 2개째', projectId: 'proj_marketing', date: '2026-05-22', slot: { period: 'afternoon', priority: 1 } },

    // === 5/23 (금) ===
    { id: 'item_mkt_0523_01', title: '쓰레드 D12 포스트', projectId: 'proj_marketing', date: '2026-05-23', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0523_02', title: '메타 광고 완전 중단 (자연 재방문 측정)', projectId: 'proj_marketing', date: '2026-05-23', slot: { period: 'morning', priority: 2 } },

    // === 5/24 (토) ===
    { id: 'item_mkt_0524_01', title: '쓰레드 D13 포스트', projectId: 'proj_marketing', date: '2026-05-24', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0524_02', title: 'GA4: 광고 없이 자발적 접속 수 확인', projectId: 'proj_setup', date: '2026-05-24', slot: { period: 'evening', priority: 1 } },

    // === 5/25 (일) ===
    { id: 'item_mkt_0525_01', title: '쓰레드 D14 포스트 (2주 마무리)', projectId: 'proj_marketing', date: '2026-05-25', slot: { period: 'morning', priority: 1 } },
    { id: 'item_mkt_0525_02', title: 'GA4 최종 데이터 수집 + 리텐션 정리', projectId: 'proj_setup', date: '2026-05-25', slot: { period: 'afternoon', priority: 1 } },

    // === 5/26 (월) — 판단일 ===
    { id: 'item_mkt_0526_01', title: 'PMF 최종 판단: D7리텐션/DAU/완료율 기록', projectId: 'proj_setup', date: '2026-05-26', slot: { period: 'morning', priority: 1 } },
  ];

  // 충돌 감지: 해당 날짜+슬롯에 이미 태스크가 있는지 확인
  function isSlotOccupied(date, slot) {
    return state.tasks.some(t =>
      t.date === date &&
      t.slot &&
      t.slot.period === slot.period &&
      t.slot.priority === slot.priority &&
      t.completedAt === null
    );
  }

  // 해당 날짜에서 빈 슬롯 찾기
  function findEmptySlot(date, preferredSlot) {
    const periods = ['morning', 'afternoon', 'evening'];
    const priorities = [1, 2, 3];

    // 1) 같은 period 내 다른 priority 시도
    for (const p of priorities) {
      const candidate = { period: preferredSlot.period, priority: p };
      if (!isSlotOccupied(date, candidate)) return candidate;
    }

    // 2) 다른 period 시도
    for (const period of periods) {
      for (const p of priorities) {
        const candidate = { period, priority: p };
        if (!isSlotOccupied(date, candidate)) return candidate;
      }
    }

    // 3) 9칸 다 찼으면 → 백로그 (slot: null)
    return null;
  }

  const existingIds = new Set(state.tasks.map(t => t.id));
  let added = 0;
  let movedToAlt = 0;
  let movedToBacklog = 0;

  tasks.forEach(t => {
    if (existingIds.has(t.id)) return;

    let finalSlot = t.slot;

    if (isSlotOccupied(t.date, t.slot)) {
      finalSlot = findEmptySlot(t.date, t.slot);
      if (finalSlot) {
        movedToAlt++;
      } else {
        movedToBacklog++;
      }
    }

    state.tasks.push({
      ...t,
      slot: finalSlot,
      date: finalSlot ? t.date : null, // 백로그면 날짜도 null
      type: 'task',
      createdAt: new Date().toISOString(),
      deferCount: 0,
      completedAt: null,
      continueCount: 0,
    });
    added++;
  });

  // 저장
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  alert(`완료! ${added}개 추가 (${movedToAlt}개 다른 슬롯 배치, ${movedToBacklog}개 백로그). 새로고침합니다.`);
  location.reload();
})();
