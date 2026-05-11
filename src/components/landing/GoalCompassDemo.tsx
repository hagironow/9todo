'use client';

import { useEffect, useState } from "react";
import { useLocale } from '@/i18n/context';

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

function Dot({ color, size = 4 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

const CYCLE_KEYS = ["today", "week", "month"];
const CYCLE_MS = 4500;

/* ══════════════════════════════════════
   Left: GoalCompass Panel
   ══════════════════════════════════════ */
function GoalCompassPanel({ activeKey }: { activeKey: string }) {
  const { locale } = useLocale();

  const GOALS = locale === 'ko' ? [
    { key: "today",   label: "오늘",   value: "시간표 UI 완성" },
    { key: "week",    label: "이번주", value: "MVP 빌드 + 3명 사용성 테스트" },
    { key: "month",   label: "이번달", value: "베타 런칭" },
    { key: "quarter", label: "분기",   value: "유료 전환 구조 검증" },
    { key: "oneYear", label: "1년",    value: "MAU 1,000명" },
    { key: "fiveYear",label: "5년",    value: "자체 생산성 SaaS 3개 운영" },
  ] : [
    { key: "today",   label: "Today",     value: "Finish timetable UI" },
    { key: "week",    label: "This week",  value: "MVP build + 3 usability tests" },
    { key: "month",   label: "This month", value: "Beta launch" },
    { key: "quarter", label: "Quarter",    value: "Validate paid conversion" },
    { key: "oneYear", label: "1 Year",     value: "1,000 MAU" },
    { key: "fiveYear",label: "5 Years",    value: "Run 3 productivity SaaS products" },
  ];

  const IDENTITY = locale === 'ko'
    ? "세상에 쓸모 있는 도구를 만드는 메이커"
    : "A maker who builds useful tools for the world";

  const AFFIRMATION = locale === 'ko'
    ? "출시하지 않으면 아무것도 아니다.\n완벽보다 완료."
    : "If you don't ship, it's nothing.\nDone beats perfect.";

  const labelText = locale === 'ko'
    ? (activeKey === "today" ? "오늘 끝낼 일은" : activeKey === "week" ? "이번 주에 꼭 끝낼 것은" : "이번 달 목표는")
    : (activeKey === "today" ? "Today's focus:" : activeKey === "week" ? "Must finish this week:" : "This month's goal:");

  return (
    <div style={{
      width: 320, flexShrink: 0,
      borderRadius: 14,
      backgroundColor: T.card,
      border: `1px solid ${T.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "20px 24px 16px" }}>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: T.fgDim, display: "block" }}>
          {labelText}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.fg, display: "block", marginTop: 2, transition: "opacity 0.6s ease" }}>
          {GOALS.find(g => g.key === activeKey)?.value}
        </span>
        <span style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em", color: T.fg, marginTop: 14, display: "block", fontFamily: "'Poppins', var(--font-sans)" }}>
          847<span style={{ fontSize: 14, fontWeight: 500, color: T.mutedFg, marginLeft: 3 }}>xp</span>
        </span>
      </div>

      <div style={{ height: 1, backgroundColor: T.border }} />

      <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${T.border}` }}>
        {locale === 'ko' && <span style={{ fontSize: 13, color: T.mutedFg, flexShrink: 0 }}>나는</span>}
        {locale === 'en' && <span style={{ fontSize: 13, color: T.mutedFg, flexShrink: 0 }}>I am</span>}
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{IDENTITY}</span>
        {locale === 'ko' && <span style={{ fontSize: 13, color: T.mutedFg, flexShrink: 0 }}>이다</span>}
      </div>

      <div style={{ padding: "10px 12px" }}>
        {GOALS.map((row) => {
          const isActive = row.key === activeKey;
          return (
            <div key={row.key} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "9px 12px", borderRadius: 8,
              transition: "background-color 0.6s ease",
              backgroundColor: isActive ? "rgba(255,255,255,0.03)" : "transparent",
            }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", flexShrink: 0, backgroundColor: isActive ? T.accent : "transparent", transition: "background-color 0.6s ease" }} />
              <span style={{ width: 40, textAlign: "right", fontSize: 11, flexShrink: 0, color: isActive ? T.fgDim : T.mutedFg, fontWeight: 500, transition: "color 0.6s ease" }}>{row.label}</span>
              <span style={{ flex: 1, fontSize: 13, color: isActive ? T.fg : "rgba(255,255,255,0.25)", fontWeight: isActive ? 500 : 400, transition: "color 0.6s ease" }}>{row.value}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "6px 24px 20px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingTop: 12 }}>
          <span style={{ width: 44, textAlign: "right", fontSize: 11, fontWeight: 500, flexShrink: 0, color: T.mutedFg, paddingTop: 1 }}>
            {locale === 'ko' ? '다짐' : 'Pledge'}
          </span>
          <p style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{AFFIRMATION}</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Background View 0: Timetable Grid (Today)
   — matches actual TimetableGrid + TimetableRow
   ══════════════════════════════════════ */
function TimetableBg() {
  const { locale } = useLocale();

  const PROJECTS = locale === 'ko' ? [
    { name: "AI 챗봇 앱",  color: "#60A5FA" },
    { name: "포트폴리오",  color: "#A78BFA" },
    { name: "일상/육아",   color: "#34D399" },
    { name: "유튜브 채널", color: "#FBBF24" },
    { name: "독서",        color: "#F472B6" },
  ] : [
    { name: "AI Chatbot App", color: "#60A5FA" },
    { name: "Portfolio",      color: "#A78BFA" },
    { name: "Life/Parenting", color: "#34D399" },
    { name: "YouTube",        color: "#FBBF24" },
    { name: "Reading",        color: "#F472B6" },
  ];

  const PERIODS = locale === 'ko' ? [
    { label: "오전", time: "9:00 ~ 12:00",      color: "#4ADE80", slots: [
      { title: "GPT API 연동 테스트",         p: 0, done: true  },
      { title: "아이 등원",                   p: 2, done: true  },
      { title: "반응형 수정",                 p: 1, done: false },
    ]},
    { label: "오후", time: "12:00 ~ 18:00",     color: T.accent, slots: [
      { title: "스트리밍 응답 구현",           p: 0, done: false },
      { title: "히어로 카피 작성",             p: 1, done: false },
      { title: "아이 하원 + 놀이터",           p: 2, done: false },
    ]},
    { label: "저녁", time: "18:00 ~ 새벽 5:00", color: "#3F3F46", slots: [
      { title: "영상 편집 — EP.12",           p: 3, done: false },
      { title: "독서 30분 — 몰입의 기술",     p: 4, done: false },
      null,
    ]},
  ] : [
    { label: "AM",  time: "9:00 ~ 12:00",  color: "#4ADE80", slots: [
      { title: "GPT API integration test",  p: 0, done: true  },
      { title: "Daycare drop-off",          p: 2, done: true  },
      { title: "Fix responsive layout",     p: 1, done: false },
    ]},
    { label: "PM",  time: "12:00 ~ 18:00", color: T.accent, slots: [
      { title: "Implement streaming",       p: 0, done: false },
      { title: "Write hero copy",           p: 1, done: false },
      { title: "Pick up kids + park",       p: 2, done: false },
    ]},
    { label: "EVE", time: "18:00 ~ 5:00",  color: "#3F3F46", slots: [
      { title: "Edit video — EP.12",        p: 3, done: false },
      { title: "Read 30min — Deep Work",    p: 4, done: false },
      null,
    ]},
  ];

  const goalLabel = locale === 'ko' ? '오늘 끝낼 일은' : "Today's focus:";
  const goalValue = locale === 'ko' ? '시간표 UI 완성' : 'Finish timetable UI';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* GoalMini */}
      <div style={{ borderRadius: 10, backgroundColor: T.card, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontSize: 11, color: T.fgDim }}>{goalLabel} <span style={{ color: T.accent, fontWeight: 600 }}>{goalValue}</span></span>
        <span style={{ fontSize: 16, fontWeight: 700, color: T.fg, fontFamily: "'Poppins', sans-serif" }}>847<sub style={{ fontSize: 10, color: T.mutedFg }}>xp</sub></span>
      </div>
      {/* Priority header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "0 12px" }}>
        {[1, 2, 3].map((n) => (
          <div key={n} style={{ textAlign: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: n === 1 ? T.accent : n === 2 ? T.fg : T.mutedFg }}>{n}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: n === 1 ? T.accent : n === 2 ? T.fg : T.mutedFg }}>{n === 1 ? "st" : n === 2 ? "nd" : "rd"}</span>
          </div>
        ))}
      </div>
      {/* Period rows */}
      {PERIODS.map((period) => (
        <div key={period.label} style={{ borderRadius: 10, backgroundColor: T.card }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 2, alignSelf: "stretch", backgroundColor: period.color, marginLeft: 10, borderRadius: 2 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{period.label}</span>
              <span style={{ fontSize: 10, color: "#333" }}>{period.time}</span>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <div style={{ width: 2, backgroundColor: period.color, marginLeft: 10, borderRadius: 2 }} />
            <div style={{ flex: 1, padding: "0 10px 10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {period.slots.map((slot, i) => slot ? (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: 8, minHeight: 60, backgroundColor: slot.done ? "transparent" : T.surfaceInset, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 9, color: PROJECTS[slot.p].color, display: "flex", alignItems: "center", gap: 3 }}>
                      <Dot color={PROJECTS[slot.p].color} size={3} />{PROJECTS[slot.p].name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.3, color: slot.done ? "#555" : T.fg, textDecoration: slot.done ? "line-through" : "none" }}>{slot.title}</span>
                  </div>
                ) : (
                  <div key={i} style={{ minHeight: 60, borderRadius: 8, backgroundColor: T.surfaceInset }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   Background View 1: Weekly Timeline + Stats
   — matches actual WeeklyTimelineView + ProjectStatsView
   ══════════════════════════════════════ */
function WeeklyBg() {
  const { locale } = useLocale();

  const DAYS = locale === 'ko'
    ? ["월", "화", "수", "목", "금", "토", "일"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const DATES = [5, 6, 7, 8, 9, 10, 11];
  const TODAY_IDX = 6;

  type Block = { title: string; pIdx: number; startH: number; dur: number; done?: boolean };

  const BLOCKS: Block[][] = locale === 'ko' ? [
    [{ title: "DB 설계",      pIdx: 0, startH: 9,  dur: 2,   done: true }, { title: "아이 등원", pIdx: 2, startH: 8, dur: 0.5, done: true }],
    [{ title: "채팅 UI",      pIdx: 0, startH: 10, dur: 1.5, done: true }, { title: "독서 30분", pIdx: 4, startH: 21, dur: 0.5, done: true }],
    [{ title: "API 연동",     pIdx: 0, startH: 9,  dur: 3,   done: true }, { title: "아이 하원", pIdx: 2, startH: 17, dur: 1,   done: true }],
    [{ title: "스트리밍",     pIdx: 0, startH: 9,  dur: 2   }, { title: "카피 작성",      pIdx: 1, startH: 13, dur: 1.5 }, { title: "독서 30분", pIdx: 4, startH: 21, dur: 0.5 }],
    [{ title: "프롬프트 튜닝",pIdx: 0, startH: 10, dur: 2   }, { title: "아이 등원",      pIdx: 2, startH: 8,  dur: 0.5 }],
    [{ title: "썸네일",       pIdx: 3, startH: 11, dur: 1   }],
    [],
  ] : [
    [{ title: "DB design",       pIdx: 0, startH: 9,  dur: 2,   done: true }, { title: "School drop-off", pIdx: 2, startH: 8,  dur: 0.5, done: true }],
    [{ title: "Chat UI",         pIdx: 0, startH: 10, dur: 1.5, done: true }, { title: "Read 30min",      pIdx: 4, startH: 21, dur: 0.5, done: true }],
    [{ title: "API integration", pIdx: 0, startH: 9,  dur: 3,   done: true }, { title: "School pick-up",  pIdx: 2, startH: 17, dur: 1,   done: true }],
    [{ title: "Streaming",       pIdx: 0, startH: 9,  dur: 2   }, { title: "Write copy",      pIdx: 1, startH: 13, dur: 1.5 }, { title: "Read 30min", pIdx: 4, startH: 21, dur: 0.5 }],
    [{ title: "Prompt tuning",   pIdx: 0, startH: 10, dur: 2   }, { title: "School drop-off", pIdx: 2, startH: 8,  dur: 0.5 }],
    [{ title: "Thumbnail",       pIdx: 3, startH: 11, dur: 1   }],
    [],
  ];

  const PROJECTS = locale === 'ko' ? [
    { name: "AI 챗봇 앱",  color: "#60A5FA" },
    { name: "포트폴리오",  color: "#A78BFA" },
    { name: "일상/육아",   color: "#34D399" },
    { name: "유튜브 채널", color: "#FBBF24" },
    { name: "독서",        color: "#F472B6" },
  ] : [
    { name: "AI Chatbot App", color: "#60A5FA" },
    { name: "Portfolio",      color: "#A78BFA" },
    { name: "Life/Parenting", color: "#34D399" },
    { name: "YouTube",        color: "#FBBF24" },
    { name: "Reading",        color: "#F472B6" },
  ];

  const SH = 8, EH = 22, TH = EH - SH, RH = 22;

  /* Pie chart data */
  const PIE = locale === 'ko' ? [
    { name: "AI 챗봇 앱",  color: PROJECTS[0].color, total: 12, completed: 7 },
    { name: "일상/육아",   color: PROJECTS[2].color, total: 7,  completed: 5 },
    { name: "포트폴리오",  color: PROJECTS[1].color, total: 5,  completed: 3 },
    { name: "독서",        color: PROJECTS[4].color, total: 4,  completed: 3 },
    { name: "유튜브 채널", color: PROJECTS[3].color, total: 3,  completed: 1 },
  ] : [
    { name: "AI Chatbot App", color: PROJECTS[0].color, total: 12, completed: 7 },
    { name: "Life/Parenting", color: PROJECTS[2].color, total: 7,  completed: 5 },
    { name: "Portfolio",      color: PROJECTS[1].color, total: 5,  completed: 3 },
    { name: "Reading",        color: PROJECTS[4].color, total: 4,  completed: 3 },
    { name: "YouTube",        color: PROJECTS[3].color, total: 3,  completed: 1 },
  ];
  const pieTotal = PIE.reduce((s, p) => s + p.total, 0);

  const dateRangeLabel = locale === 'ko' ? '2026년 5월 5일 ~ 11일' : 'May 5 – 11, 2026';
  const streakLabel    = locale === 'ko' ? '5일 연속 완주' : '5-day streak';
  const doneLabel      = locale === 'ko' ? '14/24 완료' : '14/24 done';
  const missedLabel    = locale === 'ko' ? '4 미완료' : '4 missed';
  const statsTitle     = locale === 'ko' ? '이번 주 프로젝트 통계' : 'Weekly project stats';
  const tasksLabel     = locale === 'ko' ? '태스크' : 'Tasks';

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{dateRangeLabel}</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.success, marginLeft: 4 }}>{streakLabel}</span>
      </div>

      {/* Timeline */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, backgroundColor: T.card }}>
        <div style={{ display: "grid", gridTemplateColumns: "32px repeat(7, 1fr)", borderBottom: `1px solid ${T.border}` }}>
          <div />
          {DAYS.map((day, i) => (
            <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "7px 0 5px" }}>
              <span style={{ fontSize: 9, color: T.mutedFg }}>{day}</span>
              <span style={{ fontSize: 11, fontWeight: i === TODAY_IDX ? 700 : 400, color: i === TODAY_IDX ? T.bg : T.mutedFg, ...(i === TODAY_IDX ? { width: 18, height: 18, borderRadius: "50%", backgroundColor: T.fg, display: "flex", alignItems: "center", justifyContent: "center" } : { display: "flex", alignItems: "center", justifyContent: "center" }) }}>{DATES[i]}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", height: TH * RH }}>
          {Array.from({ length: TH + 1 }, (_, i) => (
            <div key={i} style={{ position: "absolute", top: i * RH, left: 0, right: 0, display: "flex", alignItems: "center" }}>
              <span style={{ width: 32, textAlign: "right", paddingRight: 5, fontSize: 8, color: "#2a2a2a", transform: "translateY(-50%)" }}>{i % 3 === 0 ? `${SH + i}` : ""}</span>
              <div style={{ flex: 1, height: 1, backgroundColor: i % 3 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)" }} />
            </div>
          ))}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(32px + ${TODAY_IDX} * ((100% - 32px) / 7))`, width: `calc((100% - 32px) / 7)`, backgroundColor: "rgba(255,110,110,0.02)" }} />
          {BLOCKS.map((dayBlocks, dayIdx) => dayBlocks.map((b, bi) => (
            <div key={`${dayIdx}-${bi}`} style={{ position: "absolute", top: (b.startH - SH) * RH, height: Math.max(b.dur * RH, 16), left: `calc(32px + ${dayIdx} * ((100% - 32px) / 7) + 1.5px)`, width: `calc((100% - 32px) / 7 - 3px)`, borderRadius: 3, overflow: "hidden", zIndex: 5, backgroundColor: b.done ? "rgba(34,197,94,0.06)" : `${PROJECTS[b.pIdx].color}10`, borderLeft: `2px solid ${b.done ? T.success : PROJECTS[b.pIdx].color}`, display: "flex", alignItems: "flex-start", padding: "1px 3px" }}>
              <span style={{ fontSize: 8, fontWeight: 500, color: b.done ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</span>
            </div>
          )))}
          <div style={{ position: "absolute", top: (14 - SH) * RH, left: `calc(32px + ${TODAY_IDX} * ((100% - 32px) / 7))`, width: `calc((100% - 32px) / 7)`, zIndex: 20, display: "flex", alignItems: "center" }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: T.accent, flexShrink: 0, marginLeft: -2 }} />
            <div style={{ flex: 1, height: 1, backgroundColor: T.accent }} />
          </div>
        </div>
      </div>

      {/* Summary bar — matches actual weekly summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: T.muted, display: "flex" }}>
          <div style={{ width: "58%", backgroundColor: T.success, borderRadius: 3 }} />
          <div style={{ width: "17%", backgroundColor: "rgba(255,110,110,0.6)" }} />
        </div>
        <span style={{ fontSize: 10, color: T.fgDim }}>{doneLabel} <span style={{ color: "rgba(255,110,110,0.6)" }}>· {missedLabel}</span></span>
      </div>

      {/* Project Stats — matches actual ProjectStatsView */}
      <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{statsTitle}</span>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            {(() => {
              let cum = 0;
              return PIE.map((seg) => {
                const pct = seg.total / pieTotal;
                const startAngle = cum * 360 - 90;
                cum += pct;
                const endAngle = cum * 360 - 90;
                const r = 38;
                const sr = (startAngle * Math.PI) / 180;
                const er = (endAngle * Math.PI) / 180;
                return <path key={seg.name} d={`M ${50 + r * Math.cos(sr)} ${50 + r * Math.sin(sr)} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${50 + r * Math.cos(er)} ${50 + r * Math.sin(er)}`} fill="none" stroke={seg.color} strokeWidth="5" strokeLinecap="butt" />;
              });
            })()}
            <text x="50" y="47" textAnchor="middle" style={{ fill: T.fg, fontSize: 13, fontWeight: 600 }}>{pieTotal}</text>
            <text x="50" y="58" textAnchor="middle" style={{ fill: T.mutedFg, fontSize: 7 }}>{tasksLabel}</text>
          </svg>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px" }}>
          {PIE.map((s) => (
            <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
              <Dot color={s.color} size={6} />
              <span style={{ color: T.fg }}>{s.name}</span>
              <span style={{ color: T.mutedFg }}>{Math.round((s.total / pieTotal) * 100)}%</span>
            </span>
          ))}
        </div>
        {/* Completion bars */}
        {PIE.map((s) => {
          const rate = Math.round((s.completed / s.total) * 100);
          return (
            <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.fg }}><Dot color={s.color} size={7} />{s.name}</span>
                <span style={{ fontSize: 10, color: T.mutedFg }}>{s.completed}/{s.total} {rate}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: T.muted }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${rate}%`, backgroundColor: s.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Background View 2: Monthly Calendar + Stats
   — matches actual CalendarView month mode
   ══════════════════════════════════════ */
function MonthlyBg() {
  const { locale } = useLocale();

  const WEEKDAYS = locale === 'ko'
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarTaskNames = locale === 'ko'
    ? ["API 연동", "채팅 UI", "DB 설계", "포트폴리오", "영상 편집"]
    : ["API integration", "Chat UI", "DB design", "Portfolio", "Edit video"];

  const FD = 4, DIM = 31, TODAY = 11;
  type DI = { xp: number; done: number; total: number; energy?: number };
  const DATA: Record<number, DI> = {
    1:{xp:1,done:1,total:1,energy:3}, 2:{xp:5,done:3,total:4,energy:4}, 5:{xp:6,done:4,total:5,energy:4},
    6:{xp:7,done:5,total:6,energy:5}, 7:{xp:8,done:6,total:7,energy:4}, 8:{xp:5,done:4,total:6,energy:3},
    9:{xp:3,done:2,total:3,energy:3}, 10:{xp:4,done:3,total:4,energy:4}, 11:{xp:0,done:0,total:3},
  };

  const monthLabel     = locale === 'ko' ? '2026년 5월' : 'May 2026';
  const thisWeekLabel  = locale === 'ko' ? '이번주' : 'This week';
  const thisMonthLabel = locale === 'ko' ? '이번달' : 'This month';
  const retroTitle     = locale === 'ko' ? '이번 달 회고' : 'Monthly retro';
  const retroPlaceholder = locale === 'ko' ? '이번 달은 어떤 한 달이었나요?' : 'How was your month?';

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < FD; i++) cells.push(<div key={`e-${i}`} style={{ minHeight: 52 }} />);
  for (let d = 1; d <= DIM; d++) {
    const data = DATA[d];
    const isToday = d === TODAY;
    const isPast = d < TODAY;
    const heat = isPast && data ? Math.min(0.1, 0.02 + (data.done) * 0.012) : 0;
    cells.push(
      <div key={d} style={{ minHeight: 52, padding: 4, borderRight: (FD+d-1)%7===6 ? "none" : `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, backgroundColor: heat > 0 ? `rgba(34,197,94,${heat})` : undefined, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: isToday ? 700 : 400, color: isToday ? T.bg : isPast ? T.fgDim : "#444", ...(isToday ? { width: 18, height: 18, borderRadius: "50%", backgroundColor: T.fg, display: "flex", alignItems: "center", justifyContent: "center" } : {}) }}>{d}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {/* Energy badge */}
            {data?.energy && (
              <div style={{ display: "flex", gap: 1 }}>
                {[1,2,3,4,5].map((l) => (
                  <div key={l} style={{ width: 2, height: 8, borderRadius: 1, backgroundColor: l <= data.energy! ? (data.energy! >= 4 ? T.success : data.energy! >= 3 ? "#FBBF24" : T.accent) : "rgba(255,255,255,0.06)" }} />
                ))}
              </div>
            )}
            {data && data.xp > 0 && <span style={{ fontSize: 8, fontWeight: 600, color: T.success }}>+{data.xp}</span>}
          </div>
        </div>
        {/* Task chips */}
        {data && data.total > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Array.from({ length: Math.min(data.done, 2) }, (_, i) => (
              <div key={`d${i}`} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 8, color: T.success }}>
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{calendarTaskNames[i % 5]}</span>
              </div>
            ))}
            {data.total > 2 && <span style={{ fontSize: 7, color: T.mutedFg, paddingLeft: 2 }}>+{data.total - 2}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}`, backgroundColor: T.card }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{monthLabel}</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[thisWeekLabel, thisMonthLabel].map((l, i) => (
              <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 5, backgroundColor: i===1 ? T.muted : "transparent", color: i===1 ? T.fg : T.mutedFg }}>{l}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.border}` }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 0", fontSize: 10, fontWeight: 600, color: T.mutedFg }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>{cells}</div>
      </div>

      {/* Monthly retro input */}
      <div style={{ borderRadius: 10, border: `1px solid ${T.border}`, backgroundColor: T.card, padding: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, display: "block", marginBottom: 8 }}>{retroTitle}</span>
        <div style={{ minHeight: 36, borderRadius: 8, backgroundColor: T.surfaceInset, padding: "8px 12px", fontSize: 12, color: "#333" }}>{retroPlaceholder}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN — no outer box, Linear-style depth
   ══════════════════════════════════════ */
const VIEW_LABELS = ["Today", "Weekly", "Monthly"];

export default function GoalCompassDemo() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % CYCLE_KEYS.length);
        setVisible(true);
      }, 600);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: "100%", position: "relative",
      fontFamily: "var(--font-sans)",
      /* NO outer box — content bleeds to edges */
    }}>
      <div style={{
        position: "relative",
        display: "flex", alignItems: "flex-start",
        gap: 0,
        minHeight: 480,
      }}>
        {/* LEFT: GoalCompass — floats above everything */}
        <div style={{
          position: "relative", zIndex: 10,
          flexShrink: 0,
          paddingTop: 24,
        }}>
          <GoalCompassPanel activeKey={CYCLE_KEYS[activeIdx]} />
        </div>

        {/* RIGHT: Background board — extends behind left panel and beyond right edge */}
        <div style={{
          flex: 1,
          marginLeft: -24,
          position: "relative", zIndex: 1,
          maxHeight: 520, overflow: "hidden",
          /* Mask: fade bottom + fade left edge (behind panel overlap) */
          maskImage: "linear-gradient(to bottom, black 45%, transparent 92%), linear-gradient(to right, transparent 0%, black 3%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 45%, transparent 92%), linear-gradient(to right, transparent 0%, black 3%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in" as React.CSSProperties["WebkitMaskComposite"],
          opacity: 0.45,
        }}>
          {/* View label + indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "28px 0 14px 40px" }}>
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: "0.1em",
              textTransform: "uppercase", color: T.fgDim,
              transition: "opacity 0.6s ease",
              opacity: visible ? 1 : 0,
            }}>{VIEW_LABELS[activeIdx]}</span>
            <div style={{ display: "flex", gap: 3 }}>
              {CYCLE_KEYS.map((_, i) => (
                <div key={i} style={{ width: i === activeIdx ? 14 : 4, height: 3, borderRadius: 1.5, backgroundColor: i === activeIdx ? T.fgDim : "#27272A", transition: "all 0.6s ease" }} />
              ))}
            </div>
          </div>

          {/* Crossfade views */}
          <div style={{ position: "relative", paddingLeft: 40 }}>
            {CYCLE_KEYS.map((_, i) => (
              <div key={i} style={{
                position: i === 0 ? "relative" : "absolute",
                top: 0, left: 0, right: 0,
                paddingLeft: i !== 0 ? 40 : 0,
                opacity: activeIdx === i ? (visible ? 1 : 0) : 0,
                transform: activeIdx === i ? (visible ? "translateY(0)" : "translateY(16px)") : "translateY(-12px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
                pointerEvents: activeIdx === i ? "auto" : "none",
              }}>
                {i === 0 && <TimetableBg />}
                {i === 1 && <WeeklyBg />}
                {i === 2 && <MonthlyBg />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
