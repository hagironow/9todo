'use client';

import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/context";

/* ── Theme — landing-tokens.css 참조 ── */
const T = {
  bg: "var(--color-bg-void)",
  card: "var(--color-bg-elevated)",
  fg: "var(--color-text-primary)",
  fgDim: "var(--color-text-tertiary)",
  muted: "var(--color-bg-surface)",
  mutedFg: "var(--color-text-ghost)",
  accent: "var(--color-accent)",
  border: "var(--color-border-subtle)",
  surfaceInset: "var(--color-bg-primary)",
  success: "var(--color-success)",
};

function Dot({ color, size = 5 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

const PHASE_MS = 5000; // total per preset
const DROPDOWN_OPEN_AT = 800; // dropdown appears
const SELECT_AT = 2200; // item selected, dropdown closes
const DROPDOWN_CLOSE_AT = 2800; // fully closed, form updates

/* ══════════════════════════════════════
   Left: RecurrenceSetupModal + animated dropdown
   ══════════════════════════════════════ */
function RecurrenceModal({ presetIdx, phase }: {
  presetIdx: number;
  phase: "idle" | "dropdown-open" | "selecting" | "selected";
}) {
  const { locale } = useLocale();
  const ko = locale === 'ko';

  const PRESETS = [
    {
      title: ko ? "아이 등원" : "School drop-off",
      project: { name: ko ? "일상/육아" : "Life/Parenting", color: "#34D399" },
      recurrence: 1, days: [true,true,true,true,true,false,false],
      period: 0, priority: 1, startTime: "08:30", endTime: "09:00", startDate: "2026-05-05",
    },
    {
      title: ko ? "독서 30분" : "Read 30min",
      project: { name: ko ? "사이드 프로젝트" : "Side Project", color: "#A78BFA" },
      recurrence: 0, days: [true,true,true,true,true,true,true],
      period: 2, priority: 2, startTime: "22:00", endTime: "22:30", startDate: "2026-05-01",
    },
    {
      title: ko ? "데일리 스크럼" : "Daily standup",
      project: { name: ko ? "회사" : "Company", color: "#60A5FA" },
      recurrence: 1, days: [true,true,true,true,true,false,false],
      period: 0, priority: 0, startTime: "09:00", endTime: "09:30", startDate: "2026-05-05",
    },
  ];

  const ALL_PROJECTS = [
    { name: ko ? "일상/육아" : "Life/Parenting", color: "#34D399" },
    { name: ko ? "사이드 프로젝트" : "Side Project", color: "#A78BFA" },
    { name: ko ? "회사" : "Company", color: "#60A5FA" },
  ];

  const REC_LABELS = ko
    ? ["매일", "매주", "2주마다", "매월"]
    : ["Daily", "Weekly", "Biweekly", "Monthly"];
  const PERIOD_LABELS = ko ? ["오전", "오후", "저녁"] : ["AM", "PM", "EVE"];
  const DAY_LABELS = ko
    ? ["월", "화", "수", "목", "금", "토", "일"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const preset = PRESETS[presetIdx];
  const dropdownVisible = phase === "dropdown-open" || phase === "selecting";
  const selectedIdx = ALL_PROJECTS.findIndex(p => p.name === preset.project.name);

  const ROW: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 0", borderBottom: `1px solid ${T.border}`,
  };
  const LABEL: React.CSSProperties = { fontSize: 13, color: T.fgDim, flexShrink: 0, minWidth: 48 };

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        width: 400, borderRadius: 14,
        backgroundColor: T.card, border: `1px solid ${T.border}`,
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        display: "flex", flexDirection: "column", padding: "24px 28px",
      }}>
        {/* Title — animates */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: T.fg, transition: "opacity 0.3s ease", opacity: phase === "selecting" ? 0.5 : 1 }}>{preset.title}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        {/* Project row — trigger */}
        <div style={{ ...ROW, position: "relative" }}>
          <span style={LABEL}>{ko ? "프로젝트" : "Project"}</span>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 8,
            border: dropdownVisible ? `1px solid ${T.fg}` : `1px solid ${T.border}`,
            backgroundColor: "transparent",
            fontSize: 13, color: T.fg, cursor: "pointer",
            transition: "border-color 0.2s ease",
          }}>
            <Dot color={preset.project.color} size={7} />
            <span style={{ transition: "color 0.3s ease" }}>{preset.project.name}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.fg} strokeWidth="2"
              style={{ transition: "transform 0.2s ease", transform: dropdownVisible ? "rotate(180deg)" : "rotate(0)" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Recurrence */}
        <div style={ROW}>
          <span style={LABEL}>{ko ? "주기" : "Period"}</span>
          <div style={{ display: "flex", gap: 3 }}>
            {REC_LABELS.map((l, i) => (
              <span key={l} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, backgroundColor: i === preset.recurrence ? "rgba(255,255,255,0.12)" : "transparent", color: i === preset.recurrence ? T.fg : T.mutedFg }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Days */}
        <div style={ROW}>
          <span style={LABEL}>{ko ? "요일" : "Days"}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={d} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, backgroundColor: preset.days[i] ? "rgba(255,255,255,0.12)" : "transparent", color: preset.days[i] ? T.fg : T.mutedFg }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Slot */}
        <div style={ROW}>
          <span style={LABEL}>{ko ? "슬롯" : "Slot"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {PERIOD_LABELS.map((l, i) => (
              <span key={l} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, backgroundColor: i === preset.period ? "rgba(255,255,255,0.12)" : "transparent", color: i === preset.period ? T.fg : T.mutedFg }}>{l}</span>
            ))}
            <div style={{ width: 1, height: 18, backgroundColor: T.border, margin: "0 6px" }} />
            {["1", "2", "3"].map((l, i) => (
              <span key={l} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, backgroundColor: i === preset.priority ? "rgba(255,255,255,0.12)" : "transparent", color: i === preset.priority ? T.fg : T.mutedFg }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Time */}
        <div style={ROW}>
          <span style={LABEL}>{ko ? "시간" : "Time"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "5px 14px", borderRadius: 8, backgroundColor: T.muted, fontSize: 13, color: T.fg }}>{preset.startTime}</span>
            <span style={{ fontSize: 12, color: T.mutedFg }}>~</span>
            <span style={{ padding: "5px 14px", borderRadius: 8, backgroundColor: T.muted, fontSize: 13, color: T.fg }}>{preset.endTime}</span>
          </div>
        </div>

        {/* Start date */}
        <div style={{ ...ROW, borderBottom: "none" }}>
          <span style={LABEL}>{ko ? "시작일" : "Start date"}</span>
          <span style={{ padding: "5px 14px", borderRadius: 8, backgroundColor: T.muted, fontSize: 13, color: T.fg }}>{preset.startDate}</span>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <span style={{ padding: "9px 18px", borderRadius: 8, fontSize: 14, color: T.mutedFg }}>{ko ? "취소" : "Cancel"}</span>
          <span style={{ padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, backgroundColor: T.fg, color: T.bg }}>{ko ? "저장" : "Save"}</span>
        </div>
      </div>

      {/* Dropdown — animated open/close */}
      <div style={{
        position: "absolute",
        top: 76, right: -8,
        width: 180, borderRadius: 12,
        border: `1px solid ${T.border}`,
        backgroundColor: T.card,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        overflow: "hidden", zIndex: 20,
        opacity: dropdownVisible ? 1 : 0,
        transform: dropdownVisible ? "translateY(0) scale(1)" : "translateY(-4px) scale(0.98)",
        transformOrigin: "top right",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        pointerEvents: dropdownVisible ? "auto" : "none",
      }}>
        {ALL_PROJECTS.map((p, i) => {
          const isHovered = phase === "selecting" && i === selectedIdx;
          return (
            <div key={p.name} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", fontSize: 12, cursor: "pointer",
              backgroundColor: isHovered ? "rgba(255,110,110,0.06)" : (phase === "dropdown-open" && i === selectedIdx) ? "rgba(255,255,255,0.04)" : "transparent",
              color: isHovered ? T.accent : (phase === "dropdown-open" && i === selectedIdx) ? T.fg : T.fgDim,
              fontWeight: isHovered ? 600 : (phase === "dropdown-open" && i === selectedIdx) ? 500 : 400,
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}>
              <Dot color={p.color} size={7} />
              <span>{p.name}</span>
            </div>
          );
        })}
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 12, color: T.mutedFg }}>
            <Dot color="#666" size={7} />
            <span>{ko ? "미분류" : "Uncategorized"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Right: Monthly Calendar — sparse, clear
   ══════════════════════════════════════ */
function MonthlyCalendar() {
  const { locale } = useLocale();
  const ko = locale === 'ko';

  const WEEKDAYS = ko
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const FD = 4, DIM = 31, TODAY = 11;

  type Tag = { color: string; title: string; done?: boolean; recurring?: boolean };
  type DI = { xp?: number; tags?: Tag[] };

  // Sparse data: some days empty, clear distinction between recurring/one-off/past/future
  const DATA: Record<number, DI> = {
    // Past — completed
    2: { xp: 3, tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", done: true, recurring: true }, { color: "#60A5FA", title: ko ? "데일리 스크럼" : "Daily standup", done: true, recurring: true }] },
    5: { xp: 6, tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", done: true, recurring: true }, { color: "#60A5FA", title: ko ? "데일리 스크럼" : "Daily standup", done: true, recurring: true }, { color: "#A78BFA", title: ko ? "독서 30분" : "Read 30min", done: true, recurring: true }] },
    6: { xp: 4, tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", done: true, recurring: true }, { color: "#FBBF24", title: ko ? "랜딩 카피 수정" : "Landing copy revision", done: true }] },
    7: { xp: 5, tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", done: true, recurring: true }, { color: "#60A5FA", title: ko ? "API 리뷰" : "API review", done: true }] },
    8: { xp: 3, tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", done: true, recurring: true }, { color: "#60A5FA", title: ko ? "데일리 스크럼" : "Daily standup", done: true, recurring: true }] },
    9: { xp: 2, tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", done: true, recurring: true }] },
    10: { xp: 1, tags: [{ color: "#A78BFA", title: ko ? "독서 30분" : "Read 30min", done: true, recurring: true }] },
    // Today — mixed
    11: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }, { color: "#FBBF24", title: ko ? "영상 편집 EP.12" : "Edit video EP.12" }] },
    // Future — recurring only (sparse)
    12: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }, { color: "#60A5FA", title: ko ? "데일리 스크럼" : "Daily standup", recurring: true }] },
    13: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }] },
    14: { tags: [{ color: "#A78BFA", title: ko ? "독서 30분" : "Read 30min", recurring: true }] },
    15: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }, { color: "#60A5FA", title: ko ? "데일리 스크럼" : "Daily standup", recurring: true }] },
    16: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }] },
    19: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }, { color: "#60A5FA", title: ko ? "데일리 스크럼" : "Daily standup", recurring: true }] },
    20: { tags: [{ color: "#34D399", title: ko ? "아이 등원" : "School drop-off", recurring: true }] },
    21: { tags: [{ color: "#A78BFA", title: ko ? "독서 30분" : "Read 30min", recurring: true }] },
  };

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < FD; i++) cells.push(<div key={`e-${i}`} style={{ minHeight: 76 }} />);

  for (let d = 1; d <= DIM; d++) {
    const data = DATA[d];
    const isToday = d === TODAY;
    const isPast = d < TODAY;
    const isFuture = d > TODAY;
    const hasDone = data?.tags?.some(t => t.done);

    cells.push(
      <div key={d} style={{
        minHeight: 76, padding: 5,
        borderRight: (FD + d - 1) % 7 === 6 ? "none" : `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        backgroundColor: hasDone ? "rgba(34,197,94,0.04)" : undefined,
        display: "flex", flexDirection: "column", gap: 3,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 11, fontWeight: isToday ? 700 : 400,
            color: isToday ? T.bg : isPast ? T.fgDim : "#444",
            ...(isToday ? { width: 20, height: 20, borderRadius: "50%", backgroundColor: T.fg, display: "flex", alignItems: "center", justifyContent: "center" } : {}),
          }}>{d}</span>
          {data?.xp && <span style={{ fontSize: 8, fontWeight: 600, color: T.success }}>+{data.xp}</span>}
        </div>
        {data?.tags && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.tags.map((tag, i) => {
              const isDone = !!tag.done;
              const isRecurring = !!tag.recurring;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 5px", borderRadius: 3,
                  backgroundColor: isDone ? "transparent"
                    : isFuture && isRecurring ? `${tag.color}08`
                    : `${tag.color}15`,
                  fontSize: 9, lineHeight: 1.4,
                  color: isDone ? T.success
                    : isFuture ? `${tag.color}` : T.fg,
                  opacity: isFuture ? 0.5 : 1,
                }}>
                  {isDone ? (
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="3" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                  ) : isRecurring ? (
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                    </svg>
                  ) : (
                    <Dot color={tag.color} size={4} />
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag.title}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, backgroundColor: T.card, padding: "32px 32px 32px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{ko ? "2026년 5월" : "May 2026"}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
        <div style={{ display: "flex", gap: 2, padding: 2, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, color: T.mutedFg }}>{ko ? "이번주" : "This week"}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)", color: T.fg }}>{ko ? "이번달" : "This month"}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.border}`, marginTop: 12 }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0", fontSize: 11, fontWeight: 600, color: T.mutedFg }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>{cells}</div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN — dropdown animation cycle
   ══════════════════════════════════════ */
export default function CalendarViewDemo() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "dropdown-open" | "selecting" | "selected">("idle");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    function runCycle() {
      // 1. idle → dropdown opens
      timeout = setTimeout(() => {
        setPhase("dropdown-open");

        // 2. hover/selecting effect
        timeout = setTimeout(() => {
          setPhase("selecting");

          // 3. selected → close
          timeout = setTimeout(() => {
            setPhase("selected");

            // 4. close dropdown, update preset
            timeout = setTimeout(() => {
              setPhase("idle");

              // 5. wait, then advance to next preset and restart
              timeout = setTimeout(() => {
                setPresetIdx(prev => (prev + 1) % 3);
                runCycle();
              }, 1200);
            }, 400);
          }, 800);
        }, 1000);
      }, DROPDOWN_OPEN_AT);
    }

    runCycle();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ width: "100%", position: "relative", fontFamily: "var(--font-sans)" }}>
      <div style={{ position: "relative", minHeight: 580 }}>
        {/* LEFT: Modal — elevated, floats above calendar */}
        <div style={{ position: "absolute", top: 0, left: 0, zIndex: 10 }}>
          <RecurrenceModal presetIdx={presetIdx} phase={phase} />
        </div>

        {/* RIGHT: Calendar — behind, shifted down + generous left padding */}
        <div style={{
          marginLeft: 340,
          paddingTop: 40,
          position: "relative", zIndex: 1,
          maxHeight: 600, overflow: "hidden",
          maskImage: "linear-gradient(to bottom, black 65%, transparent 96%), linear-gradient(to right, transparent 0%, black 3%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 96%), linear-gradient(to right, transparent 0%, black 3%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in" as React.CSSProperties["WebkitMaskComposite"],
        }}>
          <MonthlyCalendar />
        </div>
      </div>
    </div>
  );
}
