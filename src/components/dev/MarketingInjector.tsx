'use client';

import { useState } from 'react';

const MARKETING_TASKS = [
  // === 5/12 (월) ===
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
  // === 5/19 (월) ===
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
  // === 5/26 (월) ===
  { id: 'item_mkt_0526_01', title: 'PMF 최종 판단: D7리텐션/DAU/완료율 기록', projectId: 'proj_setup', date: '2026-05-26', slot: { period: 'morning', priority: 1 } },
] as const;

// 프로젝트는 생성하지 않음 — 사용자가 직접 분류

const STORAGE_KEY = '9todo_state';

export default function MarketingInjector() {
  const [show, setShow] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const inject = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { setResult('데이터 없음'); return; }
    const state = JSON.parse(raw);

    const existingIds = new Set(state.tasks.map((t: any) => t.id));
    let added = 0;

    MARKETING_TASKS.forEach(t => {
      if (existingIds.has(t.id)) return;
      state.tasks.push({
        id: t.id,
        title: t.title,
        projectId: null,
        slot: null,
        date: null,
        type: 'task',
        createdAt: new Date().toISOString(),
        deferCount: 0,
        completedAt: null,
        continueCount: 0,
      });
      added++;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setResult(`+${added}개 백로그에 추가`);
    setTimeout(() => location.reload(), 800);
  };

  const remove = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { setResult('데이터 없음'); return; }
    const state = JSON.parse(raw);
    const before = state.tasks.length;
    state.tasks = state.tasks.filter((t: any) => !t.id.startsWith('item_mkt_') && !t.id.startsWith('item_setup_'));
    const removed = before - state.tasks.length;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setResult(`-${removed}개 삭제`);
    setTimeout(() => location.reload(), 800);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-purple-600 text-white text-lg font-bold shadow-lg hover:bg-purple-700 transition-colors"
        title="마케팅 태스크 테스트"
      >
        M
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl p-4 w-64 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-[var(--foreground)]">마케팅 태스크</span>
        <button onClick={() => setShow(false)} className="text-[var(--muted)] hover:text-[var(--foreground)] text-lg">&times;</button>
      </div>
      <p className="text-xs text-[var(--muted)]">PMF 검증 2주 플랜 (48개 태스크)</p>
      <div className="flex gap-2">
        <button
          onClick={inject}
          className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
        >
          넣기
        </button>
        <button
          onClick={remove}
          className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          빼기
        </button>
      </div>
      {result && <p className="text-xs text-center text-[var(--muted)]">{result}</p>}
    </div>
  );
}
