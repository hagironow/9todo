'use client';

import { useEffect, useState, useRef } from "react";

type Lang = "ko" | "en";
const lang: Lang = "ko";

const PROJECTS: Record<Lang, { name: string; color: string }[]> = {
  ko: [
    { name: "AI 챗봇 앱", color: "#60A5FA" },
    { name: "포트폴리오...", color: "#A78BFA" },
    { name: "운동 트래커", color: "#34D399" },
    { name: "유튜브 채널", color: "#FBBF24" },
  ],
  en: [
    { name: "AI Chat App", color: "#60A5FA" },
    { name: "Portfolio", color: "#A78BFA" },
    { name: "Fitness App", color: "#34D399" },
    { name: "YouTube", color: "#FBBF24" },
  ],
};

type SlotItem = { title: string; project: { name: string; color: string }; deferCount?: number; completed?: boolean; xp: number; timer?: string };
type RoutineItem = { title: string; time?: string; completed?: boolean } | null;

const SLOTS: Record<Lang, (SlotItem | null)[][]> = {
  ko: [
    [
      { title: "GPT API 연동 테스트", project: PROJECTS.ko[0], xp: 3, timer: "45m", completed: true },
      { title: "채팅 UI 스크롤 버그 수정", project: PROJECTS.ko[0], xp: 2, timer: "30m", completed: true },
      { title: "프로젝트 섹션 반응형 수정", project: PROJECTS.ko[1], xp: 1 },
    ],
    [
      { title: "스트리밍 응답 구현", project: PROJECTS.ko[0], xp: 3 },
      { title: "히어로 섹션 카피 작성", project: PROJECTS.ko[1], xp: 2, deferCount: 1 },
      { title: "영상 편집 — EP.12 인트로", project: PROJECTS.ko[3], xp: 1 },
    ],
    [
      { title: "프롬프트 튜닝 실험", project: PROJECTS.ko[0], xp: 3 },
      { title: "운동 앱 대시보드 와이어프레임", project: PROJECTS.ko[2], xp: 2 },
      { title: "썸네일 디자인 — EP.12", project: PROJECTS.ko[3], xp: 1 },
    ],
  ],
  en: [
    [
      { title: "GPT API integration test", project: PROJECTS.en[0], xp: 3, timer: "45m", completed: true },
      { title: "Fix chat UI scroll bug", project: PROJECTS.en[0], xp: 2, timer: "30m", completed: true },
      { title: "Fix project section responsive", project: PROJECTS.en[1], xp: 1 },
    ],
    [
      { title: "Implement streaming response", project: PROJECTS.en[0], xp: 3 },
      { title: "Write hero section copy", project: PROJECTS.en[1], xp: 2, deferCount: 1 },
      { title: "Edit video — EP.12 intro", project: PROJECTS.en[3], xp: 1 },
    ],
    [
      { title: "Prompt tuning experiment", project: PROJECTS.en[0], xp: 3 },
      { title: "Fitness app dashboard wireframe", project: PROJECTS.en[2], xp: 2 },
      { title: "Thumbnail design — EP.12", project: PROJECTS.en[3], xp: 1 },
    ],
  ],
};

const ROUTINES: Record<Lang, RoutineItem[][]> = {
  ko: [
    [null, null, { title: "GitHub 이슈 체크", time: "AM 9:00" }],
    [null, null, { title: "코드 리뷰 30분" }],
    [null, null, null],
  ],
  en: [
    [null, null, { title: "GitHub issue check", time: "AM 9:00" }],
    [null, null, { title: "Code review 30min" }],
    [null, null, null],
  ],
};

const PERIODS: Record<Lang, { label: string; time: string }[]> = {
  ko: [
    { label: "오전", time: "9:00 ~ 12:00" },
    { label: "오후", time: "12:00 ~ 18:00" },
    { label: "저녁", time: "18:00 ~ 새벽 5:00" },
  ],
  en: [
    { label: "AM", time: "9:00 ~ 12:00" },
    { label: "PM", time: "12:00 ~ 18:00" },
    { label: "EVE", time: "18:00 ~ 5:00" },
  ],
};

const SIDEBAR_NAV: Record<Lang, string[]> = { ko: ["오늘", "캘린더", "회고"], en: ["Today", "Calendar", "Retrospective"] };
const SIDEBAR_LABELS: Record<Lang, { views: string; projects: string; unassigned: string; addProject: string }> = {
  ko: { views: "뷰", projects: "프로젝트", unassigned: "미분류", addProject: "프로젝트 이름" },
  en: { views: "Views", projects: "Projects", unassigned: "Unassigned", addProject: "Project name" },
};
const GOAL_PREVIEW: Record<Lang, string> = { ko: "오늘 끝내야 할 일을 정해보세요", en: "Set what you must finish today" };
const ROW_LINE_COLORS = ["#4ADE80", "#F97066", "#F59E0B"];

/* ── Shared ── */
function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ── Card ── */
function Card({ item }: { item: SlotItem }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 8, backgroundColor: item.completed ? "#0e0e0e" : "#161616", display: "flex", flexDirection: "column", gap: 5, minHeight: 72 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 500, color: item.project.color, alignSelf: "flex-start" }}>
        <Dot color={item.project.color} size={4} />{item.project.name}
      </span>
      <p style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35, color: item.completed ? "#666" : "#e0e0e0", textDecoration: item.completed ? "line-through" : "none", margin: 0, flex: 1 }}>{item.title}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {(item.deferCount ?? 0) > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 15, height: 15, borderRadius: 8, backgroundColor: "#EF4444", color: "#fff", fontSize: 8, fontWeight: 700, padding: "0 3px" }}>{item.deferCount}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {item.completed && item.timer && (
            <span style={{ fontSize: 9, color: "#666", display: "flex", alignItems: "center", gap: 2 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              {item.timer}
            </span>
          )}
          <span style={{ fontSize: 9, fontWeight: 700, color: item.completed ? "#4ADE80" : "rgba(249,112,102,0.45)" }}>
            {item.completed ? "+" : ""}{item.xp}xp
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Empty slot with + ── */
function EmptySlot() {
  return (
    <div style={{ minHeight: 72, borderRadius: 8, backgroundColor: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    </div>
  );
}

/* ── Routine slot (dashed) ── */
function RoutineSlot({ item }: { item: RoutineItem }) {
  if (!item) {
    return (
      <div style={{ minHeight: 36, borderRadius: 8, border: "1px dashed #161616", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
      </div>
    );
  }
  return (
    <div style={{ minHeight: 36, borderRadius: 8, border: "1px dashed #161616", backgroundColor: "#0e0e0e", display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", opacity: item.completed ? 0.5 : 1 }}>
      <span style={{ flex: 1, fontSize: 11, color: item.completed ? "#666" : "#888", textDecoration: item.completed ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
      {item.time && <span style={{ fontSize: 9, color: "#333", flexShrink: 0 }}>{item.time}</span>}
    </div>
  );
}

/* ── Period Row ── */
function PeriodRow({ period, slots, routines, lineColor, isNow }: {
  period: { label: string; time: string }; slots: (SlotItem | null)[]; routines: RoutineItem[]; lineColor: string; isNow: boolean;
}) {
  return (
    <div style={{ borderRadius: 10, backgroundColor: "#111111" }}>
      {/* Header with line */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 3, alignSelf: "stretch", backgroundColor: lineColor, flexShrink: 0, marginLeft: 10, borderRadius: 2, transition: "background-color 0.5s ease" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>{period.label}</span>
          <span style={{ fontSize: 10, color: "#333" }}>{period.time}</span>
        </div>
      </div>
      {/* Content with line */}
      <div style={{ display: "flex" }}>
        <div style={{ width: 3, backgroundColor: lineColor, flexShrink: 0, marginLeft: 10, borderRadius: 2, transition: "background-color 0.5s ease" }} />
        <div style={{ flex: 1, padding: "0 10px 10px" }}>
          {/* Task slots */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {slots.map((item, i) => item ? <Card key={i} item={item} /> : <EmptySlot key={i} />)}
          </div>
          {/* Routine slots */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
            {routines.map((item, i) => <RoutineSlot key={i} item={item} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Goal mini ── */
function GoalMini({ totalXp }: { totalXp: number }) {
  return (
    <div style={{ borderRadius: 10, backgroundColor: "#111111", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{GOAL_PREVIEW[lang]}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#e0e0e0", fontFamily: "'Poppins', sans-serif" }}>{totalXp}<sub style={{ fontSize: 10, fontWeight: 600, color: "#888" }}>xp</sub></span>
      </div>
    </div>
  );
}

/* ── Sidebar ── */
function SidebarDemo() {
  const navItems = SIDEBAR_NAV[lang];
  const labels = SIDEBAR_LABELS[lang];
  const projects = PROJECTS[lang];
  return (
    <div style={{ width: 180, flexShrink: 0, display: "flex", flexDirection: "column", backgroundColor: "#111111", borderRight: "1px solid #191919" }}>
      <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #191919", gap: 8 }}>
        <img src="/9todo.svg" alt="9todo" style={{ height: 18 }} />
        <div style={{ flex: 1 }} />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </div>
      <div style={{ flex: 1, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 1, overflow: "hidden" }}>
        <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#333", padding: "3px 10px 4px", opacity: 0.5 }}>{labels.views}</p>
        {navItems.map((item, i) => (
          <div key={i} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, color: i === 0 ? "#e0e0e0" : "#888", fontWeight: i === 0 ? 600 : 400, backgroundColor: i === 0 ? "#191919" : "transparent" }}>{item}</div>
        ))}
        <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#333", padding: "20px 10px 4px", opacity: 0.5 }}>{labels.projects}</p>
        {projects.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", fontSize: 12, color: "#888" }}>
            <Dot color={p.color} size={6} />{p.name}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", fontSize: 12, color: "#666" }}>
          <Dot color="#666" size={5} />{labels.unassigned}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", fontSize: 12, color: "#333" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {labels.addProject}
        </div>
      </div>
      {/* 하단 */}
      <div style={{ padding: "8px 8px", borderTop: "1px solid #191919" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", fontSize: 12, color: "#888" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </div>
          {lang === "ko" ? "로그인 하세요" : "Sign in"}
        </div>
      </div>
    </div>
  );
}

/* ── Timer Panel (dark mode, accent cycles every 3s) ── */
const TIMER_COLORS = ["#F97066", "#60A5FA", "#A78BFA", "#34D399", "#FBBF24"];

function TimerPanel({ item }: { item: SlotItem }) {
  const [elapsed, setElapsed] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const dur = 25 * 60;
  useEffect(() => { const t = setInterval(() => setElapsed((p) => (p + 1) % dur), 1000); return () => clearInterval(t); }, [dur]);
  useEffect(() => { const t = setInterval(() => setColorIdx((p) => (p + 1) % TIMER_COLORS.length), 3000); return () => clearInterval(t); }, []);
  const rem = dur - elapsed;
  const timeStr = `${String(Math.floor(rem / 60)).padStart(2, "0")}:${String(rem % 60).padStart(2, "0")}`;
  const color = TIMER_COLORS[colorIdx];

  const vb = 200, cx = 100, cy = 100, pieR = 78;
  const angle = (rem / 60 / 60) * 360;
  const sr = -Math.PI / 2, er = sr + (angle * Math.PI) / 180;
  const sx = cx + pieR * Math.cos(sr), sy = cy + pieR * Math.sin(sr);
  const ex = cx + pieR * Math.cos(er), ey = cy + pieR * Math.sin(er);
  const path = angle > 0.3 ? `M ${cx} ${cy} L ${sx} ${sy} A ${pieR} ${pieR} 0 ${angle > 180 ? 1 : 0} 1 ${ex} ${ey} Z` : "";

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = ((i * 6) - 90) * (Math.PI / 180); const maj = i % 5 === 0;
    return { x1: cx + 80 * Math.cos(a), y1: cy + 80 * Math.sin(a), x2: cx + (80 - (maj ? 12 : 5)) * Math.cos(a), y2: cy + (80 - (maj ? 12 : 5)) * Math.sin(a), maj };
  });
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const val = i * 5, a = ((val * 6) - 90) * (Math.PI / 180);
    return { val, x: cx + 90 * Math.cos(a), y: cy + 90 * Math.sin(a) };
  });

  return (
    <div style={{ width: 280, flexShrink: 0, backgroundColor: "#111111", borderRadius: 28, display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid #191919" }}>
      {/* Tab */}
      <div style={{ display: "flex", padding: "8px 14px", gap: 4 }}>
        <div style={{ flex: 1, display: "flex", borderRadius: 99, backgroundColor: "#1a1a1a", padding: 2 }}>
          <span style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 600, padding: "5px 0", borderRadius: 99, backgroundColor: "#333", color: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {lang === "ko" ? "타이머" : "Timer"}
          </span>
          <span style={{ flex: 1, textAlign: "center", fontSize: 10, fontWeight: 600, padding: "5px 0", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="3" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
            {lang === "ko" ? "노트" : "Note"}
          </span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "4px 18px 0", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", margin: 0 }}>{item.title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 3 }}>
          <Dot color={item.project.color} size={5} />
          <span style={{ fontSize: 10, color: "#888" }}>{item.project.name}</span>
        </div>
      </div>

      {/* Analog clock */}
      <div style={{ padding: "8px 28px" }}>
        <svg width="100%" viewBox={`0 0 ${vb} ${vb}`}>
          {path && <path d={path} fill={color} style={{ transition: "fill 0.8s ease" }} />}
          {ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.maj ? 1.5 : 0.7} stroke={color} style={{ transition: "stroke 0.8s ease" }} />)}
          {numbers.map((n) => <text key={n.val} x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" style={{ fill: color, fontSize: 10, fontWeight: 600, transition: "fill 0.8s ease" }}>{n.val}</text>)}
        </svg>
      </div>

      {/* Digital + settings */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 0 8px" }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: color, fontVariantNumeric: "tabular-nums", fontFamily: "'Poppins', sans-serif", transition: "color 0.8s ease" }}>{timeStr}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "4px 0 16px" }}>
        <span style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><polyline points="13 17 18 12 13 7" /><line x1="6" y1="12" x2="18" y2="12" /></svg>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 20px", borderRadius: 99, backgroundColor: color, color: "#0a0a0a", fontSize: 12, fontWeight: 600, transition: "background-color 0.8s ease" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          {lang === "ko" ? "완료" : "Done"}
        </span>
        <span style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
        </span>
      </div>

      {/* Secondary items */}
      {SLOTS[lang][1][1] && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 6 }}>
          <Dot color={SLOTS[lang][1][1]!.project.color} size={5} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{SLOTS[lang][1][1]!.title}</span>
        </div>
      )}
      {SLOTS[lang][1][2] && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 6 }}>
          <Dot color={SLOTS[lang][1][2]!.project.color} size={5} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{SLOTS[lang][1][2]!.title}</span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN
   ══════════════════════════════════════════ */
export default function HeroDemo() {
  const [slots, setSlots] = useState(SLOTS[lang]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % 5;
        switch (next) {
          case 1: setSlots((s) => { const c = s.map((r) => [...r]); if (c[1][0]) c[1][0] = { ...c[1][0], completed: true }; return c; }); break;
          case 2: setSlots((s) => { const c = s.map((r) => [...r]); if (c[1][1]) c[1][1] = { ...c[1][1], deferCount: (c[1][1]!.deferCount || 0) + 1 }; return c; }); break;
          case 3: setSlots((s) => { const c = s.map((r) => [...r]); if (c[2][0]) c[2][0] = { ...c[2][0], completed: true }; return c; }); break;
          case 4: setSlots(SLOTS[lang]); break;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const nowItem = slots[1][0] && !slots[1][0].completed ? slots[1][0] : SLOTS[lang][1][0]!;
  const totalXp = slots.flat().filter(Boolean).reduce((sum, item) => sum + (item!.completed ? item!.xp : 0), 0);

  return (
    <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", border: "1px solid #161616", backgroundColor: "#0a0a0a", fontFamily: "var(--font-sans)", display: "flex", position: "relative", boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}>
      <SidebarDemo />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Date header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #191919" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0" }}>2026{lang === "ko" ? "년" : "."} 5{lang === "ko" ? "월" : "."} 8{lang === "ko" ? "일 금요일" : " Fri"}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#4ADE80", backgroundColor: "rgba(74,222,128,0.1)", padding: "1px 6px", borderRadius: 4 }}>+5 XP</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: 12, display: "flex", gap: 12 }}>
          {/* Left: timetable */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <GoalMini totalXp={totalXp} />

            {/* Priority header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "0 12px" }}>
              {[1, 2, 3].map((p) => (
                <div key={p} style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: p === 1 ? "#F97066" : p === 2 ? "#e0e0e0" : "#666" }}>{p}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: p === 1 ? "#F97066" : p === 2 ? "#e0e0e0" : "#666" }}>{p === 1 ? "st" : p === 2 ? "nd" : "rd"}</span>
                </div>
              ))}
            </div>

            {/* Period rows — 오후 라인은 1순위 완료 시 초록으로 전환 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PERIODS[lang].map((period, rowIdx) => {
                let lineColor = ROW_LINE_COLORS[rowIdx];
                // 오후(idx 1): 1순위 완료되면 코랄→초록
                if (rowIdx === 1 && slots[1][0]?.completed) {
                  lineColor = "#4ADE80";
                }
                return (
                  <PeriodRow key={period.label} period={period} slots={slots[rowIdx]} routines={ROUTINES[lang][rowIdx]} lineColor={lineColor} isNow={rowIdx === 2} />
                );
              })}
            </div>

            {/* Backlog hint */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              <span style={{ fontSize: 11, color: "#333" }}>{lang === "ko" ? "백로그" : "Backlog"}</span>
              <span style={{ fontSize: 10, color: "#1a1a1a" }}>3</span>
            </div>
          </div>

          {/* Right: Timer */}
          <TimerPanel item={nowItem} />
        </div>
      </div>
    </div>
  );
}
