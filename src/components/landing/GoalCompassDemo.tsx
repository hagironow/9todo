'use client';

/**
 * GoalCompassDemo — 실제 9todo GoalCompass 컴포넌트를 충실히 재현
 *
 * 구조:
 * - 뒤(딤): 전체 앱 그리드가 흐릿하게 깔림 (오버플로 하단 잘림)
 * - 앞(스포트라이트): 골 컴파스가 펼쳐진 상태로 밝게 강조
 *
 * 실제 코드 참조:
 * /Users/sara/Desktop/9todo/src/components/goal-compass/
 */

import { useEffect, useState } from "react";

/* ── 실제 앱 토큰 (dark theme) ── */
const T = {
  bg: "#0a0a0a",
  card: "#111111",
  fg: "#e0e0e0",
  muted: "#1a1a1a",
  mutedFg: "#888",
  accent: "#FF5C65",
  border: "#191919",
  success: "#22C55E",
  radius: 12,
};

/* ── 실제 앱 데이터 구조 기반 샘플 ── */
const SAMPLE_GOALS = {
  today: "시간표 UI 완성",
  week: "MVP 빌드 + 3명 사용성 테스트",
  month: "베타 런칭",
  quarter: "유료 전환 구조 검증",
  oneYear: "MAU 1,000명",
  fiveYear: "자체 생산성 SaaS 3개 운영",
};

const GOAL_ROWS: { key: keyof typeof SAMPLE_GOALS; label: string }[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번주" },
  { key: "month", label: "이번달" },
  { key: "quarter", label: "분기" },
  { key: "oneYear", label: "1년" },
  { key: "fiveYear", label: "5년" },
];

const SAMPLE_IDENTITY = "세상에 쓸모 있는 도구를 만드는 메이커";
const SAMPLE_AFFIRMATION = "출시하지 않으면 아무것도 아니다.\n완벽보다 완료.";
const TOTAL_XP = 847;

/* ── 뒷배경 그리드 데이터 (최소한만) ── */
const PROJECTS = [
  { name: "AI 챗봇 앱", color: "#60A5FA" },
  { name: "포트폴리오", color: "#A78BFA" },
  { name: "유튜브 채널", color: "#FBBF24" },
];

type MiniTask = { title: string; project: typeof PROJECTS[0]; completed?: boolean };
const GRID_SLOTS: (MiniTask | null)[][] = [
  [
    { title: "GPT API 연동 테스트", project: PROJECTS[0], completed: true },
    { title: "채팅 UI 스크롤 버그", project: PROJECTS[0], completed: true },
    { title: "반응형 수정", project: PROJECTS[1] },
  ],
  [
    { title: "스트리밍 응답 구현", project: PROJECTS[0] },
    { title: "히어로 섹션 카피", project: PROJECTS[1] },
    { title: "영상 편집 — EP.12", project: PROJECTS[2] },
  ],
  [
    { title: "프롬프트 튜닝", project: PROJECTS[0] },
    { title: "대시보드 와이어프레임", project: PROJECTS[1] },
    null,
  ],
];

const PERIODS = ["오전", "오후", "저녁"];
const LINE_COLORS = ["#4ADE80", "#F97066", "#F59E0B"];

/* ── Dot ── */
function Dot({ color, size = 4 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ══════════════════════════════════════
   GoalCompass — 실제 UI 충실 재현
   ══════════════════════════════════════ */
function GoalCompassPanel({ expanded }: { expanded: boolean }) {
  return (
    <div style={{
      borderRadius: T.radius * 1.4,
      overflow: "hidden",
      backgroundColor: T.card,
      position: "relative",
      zIndex: 10,
      boxShadow: "0 0 60px rgba(255,92,101,0.06), 0 8px 40px rgba(0,0,0,0.6)",
      border: `1px solid ${T.border}`,
    }}>
      {/* ── 헤더: 프리뷰 + XP (실제 GoalCompass.tsx 51~120 재현) ── */}
      <div style={{
        padding: "12px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        cursor: "pointer",
      }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 400, color: T.fg }}>
            오늘 끝낼 일은 <span style={{ color: T.accent, fontWeight: 600 }}>{SAMPLE_GOALS.today}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
            {/* 완료 버튼 */}
            <span style={{ fontSize: 12, fontWeight: 600, color: T.mutedFg }}>10xp</span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke={T.fg} strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {/* 화살표 */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ color: T.mutedFg, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }}>
              <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 전체 XP */}
        <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: T.fg, marginTop: 8, fontFamily: "'Poppins', var(--font-sans)" }}>
          {TOTAL_XP}<span style={{ fontSize: 14, fontWeight: 600, color: T.mutedFg, marginLeft: 2 }}>xp</span>
        </span>
      </div>

      {/* ── 펼쳐진 본문 (GoalCompassIdentity + GoalCompassGoals + GoalCompassAffirmation 재현) ── */}
      <div style={{
        maxHeight: expanded ? 500 : 0,
        overflow: "hidden",
        transition: "max-height 0.4s ease-in-out",
      }}>
        <div style={{ borderTop: `1px solid ${T.border}` }}>

          {/* 정체성: "나는 ___ 이다" */}
          <div style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.mutedFg, whiteSpace: "nowrap" }}>나는</span>
            <span style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 600,
              color: T.accent,
              padding: "2px 8px",
              borderRadius: T.radius,
            }}>
              {SAMPLE_IDENTITY}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, color: T.mutedFg, whiteSpace: "nowrap" }}>이다</span>
          </div>

          {/* 6계층 목표 */}
          <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column" }}>
            {GOAL_ROWS.map((row) => {
              const val = SAMPLE_GOALS[row.key];
              const isToday = row.key === "today";
              const isFiveYear = row.key === "fiveYear";
              return (
                <div key={row.key} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "6px 0",
                }}>
                  <span style={{
                    width: 40,
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 600,
                    flexShrink: 0,
                    color: isToday ? T.accent : T.mutedFg,
                  }}>
                    {row.label}
                  </span>
                  <span style={{
                    flex: 1,
                    fontSize: 15,
                    color: T.fg,
                    fontWeight: isFiveYear ? 600 : 400,
                    padding: "2px 8px",
                    borderRadius: T.radius,
                  }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 확언 */}
          <div style={{
            padding: "8px 16px 14px",
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "6px 0" }}>
              <span style={{
                width: 40,
                textAlign: "right",
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
                color: T.mutedFg,
                paddingTop: 2,
              }}>
                확언
              </span>
              <p style={{
                flex: 1,
                fontSize: 15,
                color: T.fg,
                margin: 0,
                padding: "2px 8px",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
              }}>
                {SAMPLE_AFFIRMATION}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Background grid (dimmed) ── */
function DimmedGrid() {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.04)",
      backgroundColor: T.bg,
      overflow: "hidden",
      maxHeight: 300,
      maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
      opacity: 0.5,
    }}>
      {/* Date header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#52525B" }}>2026년 5월 8일 금요일</span>
      </div>

      {/* Priority */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, padding: "6px 40px" }}>
        {[1, 2, 3].map((p) => (
          <div key={p} style={{ textAlign: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: p === 1 ? "#F97066" : "#3F3F46" }}>{p}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: p === 1 ? "#F97066" : "#3F3F46" }}>
              {p === 1 ? "st" : p === 2 ? "nd" : "rd"}
            </span>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {PERIODS.map((label, rowIdx) => (
          <div key={label} style={{ borderRadius: 8, backgroundColor: "#111113" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 2, alignSelf: "stretch", backgroundColor: LINE_COLORS[rowIdx], marginLeft: 8, borderRadius: 2, opacity: 0.35 }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#52525B", padding: "6px 8px" }}>{label}</span>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ width: 2, backgroundColor: LINE_COLORS[rowIdx], marginLeft: 8, borderRadius: 2, opacity: 0.35 }} />
              <div style={{ flex: 1, padding: "0 8px 6px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                  {GRID_SLOTS[rowIdx].map((task, i) =>
                    task ? (
                      <div key={i} style={{
                        padding: "5px 7px", borderRadius: 6,
                        backgroundColor: task.completed ? "rgba(39,39,42,0.2)" : "rgba(39,39,42,0.4)",
                        minHeight: 40,
                      }}>
                        <span style={{ fontSize: 7, color: task.project.color, display: "flex", alignItems: "center", gap: 2 }}>
                          <Dot color={task.project.color} size={3} />{task.project.name}
                        </span>
                        <p style={{
                          fontSize: 9, fontWeight: 500, lineHeight: 1.3, margin: "2px 0 0",
                          color: task.completed ? "#3F3F46" : "#71717A",
                          textDecoration: task.completed ? "line-through" : "none",
                        }}>{task.title}</p>
                      </div>
                    ) : (
                      <div key={i} style={{ minHeight: 40, borderRadius: 6, backgroundColor: "rgba(39,39,42,0.12)" }} />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Main
   ══════════════════════════════════════ */
export default function GoalCompassDemo() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // 1.5초 후 자동 펼침
    const openTimer = setTimeout(() => setExpanded(true), 1500);
    // 6초 후 접기 → 반복
    const loop = setInterval(() => {
      setExpanded(false);
      setTimeout(() => setExpanded(true), 2000);
    }, 8000);
    return () => { clearTimeout(openTimer); clearInterval(loop); };
  }, []);

  return (
    <div style={{
      width: "100%",
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#08080A",
      fontFamily: "var(--font-sans)",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "80%",
        height: "30%",
        background: "radial-gradient(ellipse at center, rgba(255,92,101,0.05), transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{ position: "relative", padding: "20px 16px 0", zIndex: 1 }}>
        {/* ── Spotlight: GoalCompass ── */}
        <GoalCompassPanel expanded={expanded} />

        {/* ── 연결 간격 ── */}
        <div style={{ height: 12 }} />

        {/* ── Background: Grid (dimmed, fading) ── */}
        <DimmedGrid />
      </div>

      {/* Bottom fade */}
      <div style={{
        height: 24,
        background: "linear-gradient(to bottom, #08080A, transparent)",
        position: "relative",
        zIndex: 2,
      }} />
    </div>
  );
}
