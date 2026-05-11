'use client';

/**
 * ReviewDemo — Section 05: "데이터는 거짓말을 하지 않습니다"
 *
 * Left (floating): Retrospective list — stacked retro cards
 * Right (behind): Project stats pie chart + completion bars + mini calendar heatmap
 */

import { useLocale } from "@/i18n/context";

const T = {
  bg: "#0a0a0a",
  card: "#111113",
  fg: "#e0e0e0",
  fgDim: "#71717A",
  muted: "#1a1a1a",
  mutedFg: "#52525B",
  accent: "#FF6E6E",
  border: "#1c1c1f",
  surfaceInset: "#161618",
  success: "#22C55E",
  warning: "#FBBF24",
};

function Dot({ color, size = 5 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ── Energy bar (read-only) ── */
function EnergyBar({ level, size = "sm" }: { level: number; size?: "sm" | "xs" }) {
  const h = size === "xs" ? 6 : 8;
  const w = size === "xs" ? 2 : 3;
  const color = level >= 4 ? T.success : level >= 3 ? T.warning : T.accent;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((l) => (
        <div key={l} style={{ width: w, height: h, borderRadius: 1, backgroundColor: l <= level ? color : "rgba(255,255,255,0.06)" }} />
      ))}
      {size === "sm" && <span style={{ fontSize: 9, color: T.fgDim, marginLeft: 2 }}>{level}</span>}
    </div>
  );
}

/* ══════════════════════════════════════
   Left: Retrospective List
   ══════════════════════════════════════ */
function RetroListPanel() {
  const { locale } = useLocale();
  const ko = locale === 'ko';

  const RETROS = [
    {
      scope: ko ? "일간" : "Daily",
      scopeColor: T.accent,
      date: ko ? "2026년 5월 10일 토요일" : "Sat, May 10, 2026",
      energy: 4,
      content: ko
        ? "사이드 프로젝트 집중 데이. 오전에 API 연동 끝내고 오후에 포트폴리오 작업. 저녁에 아이랑 공원 산책 후 독서 30분. 균형 잡힌 하루."
        : "Side project focus day. Finished API integration in the morning, portfolio work in the afternoon. Evening walk with kid then 30min reading. Well-balanced day.",
      updated: ko ? "5. 10." : "5. 10.",
    },
    {
      scope: ko ? "주간" : "Weekly",
      scopeColor: T.success,
      date: ko ? "2026년 20주차" : "2026 Week 20",
      energy: 3.5,
      content: ko
        ? "MVP 빌드 거의 완료. 사용성 테스트 2명 진행. 수요일에 번아웃 기미 — 저녁 루틴(독서)을 빼먹었더니 다음 날 집중력 떨어짐. 루틴 사수가 핵심."
        : "MVP build nearly done. Ran 2 usability tests. Wednesday burnout signs — skipping evening routine (reading) dropped next day's focus. Routine discipline is key.",
      updated: ko ? "5. 11." : "5. 11.",
    },
    {
      scope: ko ? "일간" : "Daily",
      scopeColor: T.accent,
      date: ko ? "2026년 5월 9일 금요일" : "Fri, May 9, 2026",
      energy: 3,
      content: ko
        ? "오전 스크럼 후 스트리밍 응답 구현에 3시간 몰입. 오후 아이 하원 후 컨디션 저하. 저녁 프롬프트 튜닝은 내일로."
        : "Post-morning standup, 3 hours deep work on streaming response. Afternoon slump after kid pick-up. Evening prompt tuning deferred to tomorrow.",
      updated: ko ? "5. 9." : "5. 9.",
    },
    {
      scope: ko ? "월간" : "Monthly",
      scopeColor: T.warning,
      date: ko ? "2026년 4월" : "April 2026",
      energy: 3,
      content: ko
        ? "프로젝트 4개 병렬 진행은 무리. 5월부터 AI 챗봇 + 일상 두 축으로 집중하기로. 유튜브는 격주로 전환."
        : "Running 4 projects in parallel is too much. Starting May, focus on AI chatbot + daily life. YouTube goes biweekly.",
      updated: ko ? "5. 1." : "5. 1.",
    },
    {
      scope: ko ? "일간" : "Daily",
      scopeColor: T.accent,
      date: ko ? "2026년 5월 8일 목요일" : "Thu, May 8, 2026",
      energy: 4,
      content: ko
        ? "아침 등원 후 바로 코딩 돌입. 히어로 카피 미루기 1회 — 내일 반드시. 저녁 영상 편집 인트로 완료."
        : "Jumped into coding right after morning drop-off. Hero copy deferred once — must do tomorrow. Evening video editing intro done.",
      updated: ko ? "5. 8." : "5. 8.",
    },
  ];

  const filterLabels = ko
    ? ["전체", "일간", "주간", "월간"]
    : ["All", "Daily", "Weekly", "Monthly"];

  return (
    <div style={{
      width: 380, flexShrink: 0,
      borderRadius: 14,
      backgroundColor: T.card,
      border: `1px solid ${T.border}`,
      boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "18px 24px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${T.border}` }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.fg} strokeWidth="1.5">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.fg }}>{ko ? "회고" : "Retro"}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, backgroundColor: T.muted, padding: "2px 8px", borderRadius: 6 }}>{RETROS.length}</span>
        <div style={{ flex: 1 }} />
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {filterLabels.map((l, i) => (
            <span key={l} style={{
              fontSize: 10, fontWeight: 500, padding: "3px 8px", borderRadius: 5,
              backgroundColor: i === 0 ? "rgba(255,255,255,0.06)" : "transparent",
              color: i === 0 ? T.fg : T.mutedFg,
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Retro list */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {RETROS.map((retro, i) => (
          <div key={i} style={{
            padding: "16px 24px",
            borderBottom: i < RETROS.length - 1 ? `1px solid ${T.border}` : "none",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {/* Header: scope badge + date + energy */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                backgroundColor: `${retro.scopeColor}15`, color: retro.scopeColor,
              }}>{retro.scope}</span>
              <span style={{ fontSize: 11, color: T.fgDim, flex: 1 }}>{retro.date}</span>
              <EnergyBar level={retro.energy} size="xs" />
            </div>
            {/* Content preview */}
            <p style={{
              fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.5)",
              margin: 0, display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            } as React.CSSProperties}>{retro.content}</p>
            {/* Updated date */}
            <span style={{ fontSize: 10, color: T.mutedFg }}>{retro.updated} {ko ? "수정" : "edited"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Right: Stats Dashboard
   ══════════════════════════════════════ */
function StatsDashboard() {
  const { locale } = useLocale();
  const ko = locale === 'ko';

  const PROJECTS = [
    { name: ko ? "AI 챗봇 앱" : "AI Chatbot App", color: "#60A5FA", total: 24, completed: 18 },
    { name: ko ? "일상/육아" : "Life/Parenting", color: "#34D399", total: 14, completed: 12 },
    { name: ko ? "포트폴리오" : "Portfolio", color: "#A78BFA", total: 8, completed: 5 },
    { name: ko ? "독서" : "Reading", color: "#F472B6", total: 7, completed: 6 },
    { name: ko ? "유튜브 채널" : "YouTube Channel", color: "#FBBF24", total: 5, completed: 2 },
  ];
  const GRAND_TOTAL = PROJECTS.reduce((s, p) => s + p.total, 0);

  const WEEKDAYS = ko
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Pie chart
  let cumulative = 0;
  const segments = PROJECTS.map((p) => {
    const pct = p.total / GRAND_TOTAL;
    const start = cumulative;
    cumulative += pct;
    return { ...p, pct, start, end: cumulative };
  });

  // Mini calendar heatmap (simplified May)
  const FD = 4, DIM = 31, TODAY = 11;
  const HEAT: Record<number, number> = { 2: 3, 5: 5, 6: 4, 7: 6, 8: 4, 9: 2, 10: 3 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats card: pie + bars — generous internal padding so text isn't hidden behind left panel */}
      <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.card, padding: "48px 40px 48px 80px", display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{ko ? "이번 주 프로젝트 통계" : "Weekly project stats"}</span>

        {/* ── Pie group ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 20 }}>
          <svg width="160" height="160" viewBox="0 0 100 100">
            {segments.map((seg) => {
              const r = 40;
              const startAngle = seg.start * 360 - 90;
              const endAngle = seg.end * 360 - 90;
              const sr = (startAngle * Math.PI) / 180;
              const er = (endAngle * Math.PI) / 180;
              return <path key={seg.name} d={`M ${50 + r * Math.cos(sr)} ${50 + r * Math.sin(sr)} A ${r} ${r} 0 ${seg.pct > 0.5 ? 1 : 0} 1 ${50 + r * Math.cos(er)} ${50 + r * Math.sin(er)}`} fill="none" stroke={seg.color} strokeWidth="6" strokeLinecap="butt" />;
            })}
            <text x="50" y="47" textAnchor="middle" style={{ fill: T.fg, fontSize: 14, fontWeight: 700 }}>{GRAND_TOTAL}</text>
            <text x="50" y="59" textAnchor="middle" style={{ fill: T.mutedFg, fontSize: 7 }}>{ko ? "태스크" : "Tasks"}</text>
          </svg>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 14px" }}>
            {segments.map((s) => (
              <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <Dot color={s.color} size={6} />
                <span style={{ color: T.fg }}>{s.name}</span>
                <span style={{ color: T.mutedFg }}>{Math.round(s.pct * 100)}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, backgroundColor: T.border, margin: "32px 0" }} />

        {/* ── Completion bars group — narrow width ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PROJECTS.map((p) => {
            const rate = Math.round((p.completed / p.total) * 100);
            return (
              <div key={p.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.fg }}><Dot color={p.color} size={7} />{p.name}</span>
                  <span style={{ fontSize: 11, color: T.mutedFg }}>{p.completed}/{p.total} {rate}%</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: T.muted }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${rate}%`, backgroundColor: p.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly heatmap — larger, more visible */}
      <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, backgroundColor: T.card, padding: "40px 40px 40px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{ko ? "5월 활동 히트맵" : "May activity heatmap"}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.success }}>{ko ? "10일 연속" : "10-day streak"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ fontSize: 10, color: T.mutedFg, textAlign: "center", paddingBottom: 4, fontWeight: 600 }}>{d}</div>
          ))}
          {Array.from({ length: FD }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: DIM }, (_, i) => {
            const d = i + 1;
            const heat = HEAT[d] ?? 0;
            const isToday = d === TODAY;
            const isPast = d < TODAY;
            return (
              <div key={d} style={{
                aspectRatio: "1", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: isToday ? 700 : 400,
                color: isToday ? T.bg : isPast && heat > 0 ? T.fgDim : "#333",
                backgroundColor: isToday ? T.fg
                  : isPast && heat > 0 ? `rgba(34,197,94,${Math.min(0.35, 0.08 + heat * 0.05)})`
                  : "rgba(255,255,255,0.02)",
              }}>{d}</div>
            );
          })}
        </div>
      </div>

      {/* Completion summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: T.muted, display: "flex" }}>
          <div style={{ width: "74%", backgroundColor: T.success, borderRadius: 3 }} />
          <div style={{ width: "9%", backgroundColor: "rgba(255,110,110,0.6)" }} />
        </div>
        <span style={{ fontSize: 10, color: T.fgDim }}>{ko ? "43/58 완료" : "43/58 done"} <span style={{ color: "rgba(255,110,110,0.6)" }}>· {ko ? "5 미완료" : "5 missed"}</span></span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN
   ══════════════════════════════════════ */
export default function ReviewDemo() {
  return (
    <div className="review-demo-root" style={{ width: "100%", position: "relative", fontFamily: "var(--font-sans)" }}>
      <div style={{
        position: "relative",
        minHeight: 580,
      }}>
        {/* LEFT: Retro list — elevated, floats above right */}
        <div className="review-left" style={{
          position: "absolute", top: 0, left: 0,
          zIndex: 10,
        }}>
          <RetroListPanel />
        </div>

        {/* RIGHT: Stats dashboard — behind left, shifted down + right */}
        <div className="review-right" style={{
          marginLeft: 340,
          paddingTop: 40,
          position: "relative", zIndex: 1,
          maxHeight: 600, overflow: "hidden",
          maskImage: "linear-gradient(to bottom, black 65%, transparent 96%), linear-gradient(to right, transparent 0%, black 3%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 96%), linear-gradient(to right, transparent 0%, black 3%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in" as React.CSSProperties["WebkitMaskComposite"],
        }}>
          <StatsDashboard />
        </div>
      </div>

      {/* Right fade — mobile only */}
      <div className="review-right-fade" />
    </div>
  );
}
