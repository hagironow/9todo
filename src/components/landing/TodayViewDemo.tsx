/**
 * TodayViewDemo — 9todo 타임테이블 오전 1행 정밀 목업
 *
 * 구조: Priority 헤더(1st/2nd/3rd) → 오전 row → 카드 2개 + 인라인 입력(3rd) → 오후/저녁 접힘
 * 루틴 행 제거 — 앱 현재 상태 반영
 */

const T = {
  bg: "#0a0a0a",
  card: "#111111",
  fg: "#e0e0e0",
  muted: "#1a1a1a",
  mutedFg: "#888",
  accent: "#FF6E6E",
  border: "#191919",
  borderSubtle: "#161616",
  surfaceInset: "#161616",
  success: "#22C55E",
  gridBg: "#0e0e0e",
};

const PROJECTS = [
  { name: "나인투두", color: "#60A5FA" },
  { name: "파티룸", color: "#A78BFA" },
];

/* ── Dot ── */
function Dot({ color, size = 5 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ── SkipForward icon ── */
function SkipForwardIcon({ size = 10, color = "#EF4444" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

/* ── Task Card ── */
function TaskCard({ title, project, xp, deferCount, done }: {
  title: string;
  project: typeof PROJECTS[0];
  xp: number;
  deferCount?: number;
  done?: boolean;
}) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      padding: "12px 14px",
      borderRadius: 10,
      backgroundColor: done ? "transparent" : T.surfaceInset,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minHeight: 90,
    }}>
      {/* Project label */}
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 12, fontWeight: 500, color: project.color,
      }}>
        <Dot color={project.color} size={5} />{project.name}
      </span>

      {/* Title */}
      <p style={{
        fontSize: 15, fontWeight: 600, lineHeight: 1.35,
        color: done ? T.mutedFg : T.fg,
        textDecoration: done ? "line-through" : "none",
        margin: 0, flex: 1,
      }}>{title}</p>

      {/* Bottom row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {(deferCount ?? 0) > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              gap: 3, height: 20, borderRadius: 10, padding: "0 6px",
              backgroundColor: "rgba(239,68,68,0.15)",
            }}>
              <SkipForwardIcon size={10} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>{deferCount}</span>
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.success }}>+{xp}xp</span>
      </div>
    </div>
  );
}

/* ── Inline Creation Slot — matches actual SlotCell input mode ── */
function InlineCreateSlot() {
  return (
    <div style={{
      minHeight: 90,
      borderRadius: 10,
      backgroundColor: T.surfaceInset,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "8px",
      gap: 4,
    }}>
      {/* 상단: 프로젝트 선택 태그 (pill) */}
      <button style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "2px 8px", borderRadius: 99, alignSelf: "flex-start",
        border: "1px solid #333",
        backgroundColor: "transparent",
        fontSize: 11, fontWeight: 500, color: T.mutedFg,
        cursor: "pointer",
      }}>
        <Dot color="#8A8A8A" size={5} />
        <span>미분류</span>
      </button>

      {/* 하단: 텍스트 입력 + 반복 아이콘 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{
          flex: 1,
          borderBottom: `1px solid ${T.accent}`,
          paddingBottom: 3,
          display: "flex", alignItems: "center",
        }}>
          <span style={{
            display: "inline-block",
            width: 1, height: 16,
            backgroundColor: T.accent,
            marginRight: 2,
            animation: "cursor-blink 1s step-end infinite",
          }} />
          <span style={{ fontSize: 14, color: T.mutedFg }}>할 일 입력...</span>
        </div>
        {/* Repeat icon button */}
        <div style={{
          width: 24, height: 24, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" />
            <path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
          </svg>
        </div>
      </div>
      <style>{`@keyframes cursor-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════
   Main
   ══════════════════════════════════════ */
export default function TodayViewDemo() {
  return (
    <div style={{
      width: "100%",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: T.bg,
      fontFamily: "var(--font-sans)",
      boxShadow: `0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px ${T.borderSubtle}`,
      padding: "24px 24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* ── Priority Header ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { n: 1, suffix: "st", color: T.accent },
          { n: 2, suffix: "nd", color: T.fg },
          { n: 3, suffix: "rd", color: T.mutedFg },
        ].map((p) => (
          <div key={p.n} style={{ textAlign: "center" }}>
            <span style={{
              fontSize: 32, fontWeight: 700, lineHeight: 1,
              letterSpacing: "-0.03em", color: p.color,
            }}>{p.n}</span>
            <span style={{
              fontSize: 14, fontWeight: 600, color: p.color,
              verticalAlign: "super",
            }}>{p.suffix}</span>
          </div>
        ))}
      </div>

      {/* ── 카드 스택: 오전(앞) → 오후(중간) → 저녁(뒤) ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>
        {/* ── 오전 (z=3, 맨 앞) ── */}
        <div style={{
          position: "relative",
          zIndex: 3,
          borderRadius: 16,
          backgroundColor: T.card,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 3, alignSelf: "stretch", backgroundColor: "#4ADE80", marginLeft: 12, borderRadius: 2 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>오전</span>
              <span style={{ fontSize: 12, color: T.mutedFg }}>9:00 ~ 12:00</span>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: 3, backgroundColor: "#4ADE80", marginLeft: 12, borderRadius: 2 }} />
            <div style={{ flex: 1, padding: "0 12px 12px" }}>
              {/* Task slots only — no routine row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <TaskCard title="랜딩 페이지 워딩 수정 완료" project={PROJECTS[0]} xp={3} deferCount={1} done />
                <TaskCard title="파티룸 청소" project={PROJECTS[1]} xp={2} />
                <InlineCreateSlot />
              </div>
            </div>
          </div>
        </div>

        {/* ── 오후 (z=2, 오전 뒤로 겹침) ── */}
        <div style={{
          position: "relative",
          zIndex: 2,
          marginTop: -12,
          marginInline: 10,
          borderRadius: 16,
          backgroundColor: "#0e0e0e",
          border: `1px solid ${T.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{ width: 3, height: 20, backgroundColor: T.accent, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>오후</span>
          <span style={{ fontSize: 12, color: T.mutedFg }}>12:00 ~ 18:00</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: T.surfaceInset }} />
            <div style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: T.surfaceInset }} />
            <div style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: T.gridBg }} />
          </div>
        </div>

        {/* ── 저녁 (z=1, 맨 뒤) ── */}
        <div style={{
          position: "relative",
          zIndex: 1,
          marginTop: -10,
          marginInline: 20,
          borderRadius: 16,
          backgroundColor: "#0c0c0c",
          border: `1px solid ${T.border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{ width: 3, height: 20, backgroundColor: "#3F3F46", borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: T.mutedFg }}>저녁</span>
          <span style={{ fontSize: 12, color: "#444" }}>18:00 ~</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: T.surfaceInset, opacity: 0.5 }} />
            <div style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: T.gridBg, opacity: 0.5 }} />
            <div style={{ width: 28, height: 8, borderRadius: 4, backgroundColor: T.gridBg, opacity: 0.5 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
