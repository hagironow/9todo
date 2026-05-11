'use client';

/**
 * ProjectViewDemo — 실제 9todo ProjectDetailView + Sidebar 재현
 *
 * 레이어:
 * - 좌(앞, 플로팅): 프로젝트 리스트 패널 (사이드바에서 프로젝트 영역 확대)
 * - 우(뒤): 프로젝트 상세 뷰 (태스크 목록 + 통계 + 루틴)
 *
 * 참조: /Users/sara/Desktop/9todo/src/components/project-detail/ProjectDetailView.tsx
 *       /Users/sara/Desktop/9todo/src/components/layout/Sidebar.tsx
 */

import { useLocale } from "@/i18n/context";

const T = {
  bg: "#0a0a0a",
  card: "#111111",
  fg: "#e0e0e0",
  muted: "#1a1a1a",
  mutedFg: "#888",
  accent: "#FF5C65",
  border: "#191919",
  borderSubtle: "#161616",
  surfaceInset: "#161616",
  success: "#22C55E",
  gridBg: "#0e0e0e",
  radius: 12,
};

type TaskItem = {
  title: string;
  done?: boolean;
  xp: number;
  slot?: string;
  deferCount?: number;
  timerStr?: string;
};

/* ── Dot ── */
function Dot({ color, size = 5 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ══════════════════════════════════════
   좌: 프로젝트 리스트 패널
   ══════════════════════════════════════ */
function ProjectListPanel() {
  const { locale } = useLocale();
  const ko = locale === 'ko';

  const PROJECTS = [
    { name: ko ? "AI 챗봇 앱" : "AI Chatbot App", color: "#60A5FA", tasks: 12, completed: 7, xp: 42, hours: "6h 30m" },
    { name: ko ? "포트폴리오" : "Portfolio", color: "#A78BFA", tasks: 8, completed: 3, xp: 18, hours: "2h 45m" },
    { name: ko ? "운동 트래커" : "Fitness Tracker", color: "#34D399", tasks: 5, completed: 2, xp: 12, hours: "1h 20m" },
    { name: ko ? "유튜브 채널" : "YouTube Channel", color: "#FBBF24", tasks: 6, completed: 4, xp: 24, hours: "3h 15m" },
  ];

  const activeIdx = 0;

  return (
    <div style={{
      width: 260,
      borderRadius: T.radius * 1.2,
      background: "linear-gradient(180deg, #161618 0%, #111113 25%, #0e0e10 100%)",
      border: `1px solid rgba(255,255,255,0.06)`,
      overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
      flexShrink: 0,
      zIndex: 10,
      position: "relative",
    }}>
      {/* Top edge highlight */}
      <div style={{ position: "absolute", top: 0, left: 16, right: 16, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)", zIndex: 3 }} />
      {/* 헤더 */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 9,
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.1em",
          color: T.mutedFg,
        }}>{ko ? "프로젝트" : "Projects"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="1.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>

      {/* 프로젝트 목록 */}
      <div style={{ padding: "4px 6px" }}>
        {PROJECTS.map((p, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 10px",
            borderRadius: 8,
            backgroundColor: i === activeIdx ? "rgba(255,255,255,0.06)" : "transparent",
            cursor: "pointer",
          }}>
            <Dot color={p.color} size={8} />
            <span style={{
              flex: 1,
              fontSize: 13,
              fontWeight: i === activeIdx ? 600 : 400,
              color: i === activeIdx ? T.fg : T.mutedFg,
            }}>{p.name}</span>
            <span style={{
              fontSize: 11,
              color: T.mutedFg,
              fontVariantNumeric: "tabular-nums",
            }}>{p.tasks}</span>
          </div>
        ))}

        {/* 미분류 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 10px", borderRadius: 8,
        }}>
          <Dot color="#444" size={8} />
          <span style={{ flex: 1, fontSize: 13, color: T.mutedFg }}>{ko ? "미분류" : "Uncategorized"}</span>
          <span style={{ fontSize: 11, color: T.mutedFg }}>3</span>
        </div>

        {/* 추가 버튼 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 10px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span style={{ fontSize: 13, color: "#333" }}>{ko ? "프로젝트 이름" : "Project name"}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   우: 프로젝트 상세 뷰
   ══════════════════════════════════════ */
function ProjectDetailPanel() {
  const { locale } = useLocale();
  const ko = locale === 'ko';

  const PROJECTS = [
    { name: ko ? "AI 챗봇 앱" : "AI Chatbot App", color: "#60A5FA", tasks: 12, completed: 7, xp: 42, hours: "6h 30m" },
    { name: ko ? "포트폴리오" : "Portfolio", color: "#A78BFA", tasks: 8, completed: 3, xp: 18, hours: "2h 45m" },
    { name: ko ? "운동 트래커" : "Fitness Tracker", color: "#34D399", tasks: 5, completed: 2, xp: 12, hours: "1h 20m" },
    { name: ko ? "유튜브 채널" : "YouTube Channel", color: "#FBBF24", tasks: 6, completed: 4, xp: 24, hours: "3h 15m" },
  ];

  const DETAIL_TASKS: TaskItem[] = [
    { title: ko ? "GPT API 연동 테스트" : "GPT API integration test", done: true, xp: 3, slot: ko ? "오전 1st" : "AM 1st", timerStr: "45m" },
    { title: ko ? "채팅 UI 스크롤 버그 수정" : "Fix chat UI scroll bug", done: true, xp: 2, slot: ko ? "오전 2nd" : "AM 2nd", timerStr: "30m" },
    { title: ko ? "스트리밍 응답 구현" : "Implement streaming response", done: true, xp: 3, slot: ko ? "오후 1st" : "PM 1st", timerStr: "52m" },
    { title: ko ? "프롬프트 튜닝 실험" : "Prompt tuning experiment", done: true, xp: 3, slot: ko ? "저녁 1st" : "EVE 1st", timerStr: "38m" },
    { title: ko ? "멀티턴 대화 구현" : "Implement multi-turn chat", xp: 3, slot: ko ? "오후 1st" : "PM 1st" },
    { title: ko ? "히스토리 저장 기능" : "History save feature", xp: 2, deferCount: 2 },
    { title: ko ? "에러 핸들링 개선" : "Improve error handling", xp: 2, slot: ko ? "오후 2nd" : "PM 2nd" },
    { title: ko ? "모델 선택 UI" : "Model selection UI", xp: 1 },
    { title: ko ? "배포 파이프라인 세팅" : "Setup deploy pipeline", xp: 2, deferCount: 1 },
  ];

  const DETAIL_ROUTINES = [
    { title: ko ? "GitHub 이슈 체크" : "Check GitHub issues", recurrence: ko ? "매일" : "Daily", slot: ko ? "오전" : "AM" },
    { title: ko ? "코드 리뷰 30분" : "Code review 30min", recurrence: ko ? "평일" : "Weekdays", slot: ko ? "오후" : "PM" },
  ];

  const p = PROJECTS[0];
  const pct = Math.round((p.completed / p.tasks) * 100);

  return (
    <div style={{
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      background: "linear-gradient(180deg, #0e0e10 0%, #0a0a0a 15%, #080808 100%)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      paddingLeft: 48,
    }}>
      {/* 프로젝트 헤더 */}
      <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: p.color }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: T.fg }}>{p.name}</span>
        </div>
      </div>

      {/* 통계 카드 3열 (실제 StatCard 재현) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "12px 20px" }}>
        {[
          { label: ko ? "완료 / 전체" : "Done / Total", value: `${p.completed} / ${p.tasks}`, sub: `${pct}%`, color: T.fg },
          { label: ko ? "투입 시간" : "Focus Time", value: p.hours, color: T.fg },
          { label: ko ? "획득 XP" : "Earned XP", value: `${p.xp}`, color: T.success },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "10px 12px",
            borderRadius: 10,
            backgroundColor: T.card,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.mutedFg, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{stat.label}</span>
            <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: stat.color, fontFamily: "'Poppins', var(--font-sans)" }}>{stat.value}</span>
              {stat.sub && <span style={{ fontSize: 11, color: T.mutedFg }}>{stat.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* 태스크 목록 */}
      <div style={{ padding: "8px 20px 16px" }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.mutedFg,
          textTransform: "uppercase" as const, letterSpacing: "0.08em",
        }}>{ko ? "태스크" : "Tasks"} ({DETAIL_TASKS.length})</span>

        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 1 }}>
          {DETAIL_TASKS.map((task, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              backgroundColor: i % 2 === 0 ? "transparent" : T.card,
            }}>
              {/* 체크박스 */}
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: task.done ? "none" : `1.5px solid #333`,
                backgroundColor: task.done ? T.success : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {task.done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </div>

              {/* 타이틀 */}
              <span style={{
                flex: 1, fontSize: 13, fontWeight: 500,
                color: task.done ? T.mutedFg : T.fg,
                textDecoration: task.done ? "line-through" : "none",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{task.title}</span>

              {/* 미루기 뱃지 */}
              {(task.deferCount ?? 0) > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 16, height: 16, borderRadius: 8,
                  backgroundColor: "#EF4444", color: "#fff",
                  fontSize: 9, fontWeight: 700, padding: "0 4px",
                }}>{task.deferCount}</span>
              )}

              {/* 슬롯 */}
              {task.slot && (
                <span style={{ fontSize: 10, color: T.mutedFg, whiteSpace: "nowrap" }}>{task.slot}</span>
              )}

              {/* 타이머 */}
              {task.timerStr && (
                <span style={{ fontSize: 10, color: T.mutedFg, display: "flex", alignItems: "center", gap: 2 }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  {task.timerStr}
                </span>
              )}

              {/* XP */}
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: task.done ? T.success : "rgba(255,92,101,0.4)",
              }}>
                {task.done ? "+" : ""}{task.xp}xp
              </span>
            </div>
          ))}
        </div>

        {/* 더보기 */}
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 12, color: T.accent, cursor: "pointer" }}>{ko ? "더보기 (+3)" : "Show more (+3)"}</span>
        </div>
      </div>

      {/* 루틴 */}
      <div style={{ padding: "0 20px 16px" }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.mutedFg,
          textTransform: "uppercase" as const, letterSpacing: "0.08em",
        }}>{ko ? "루틴" : "Routines"} ({DETAIL_ROUTINES.length})</span>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {DETAIL_ROUTINES.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 8,
              border: `1px dashed ${T.borderSubtle}`,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="1.5">
                <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 014-4h14" />
                <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 01-4 4H3" />
              </svg>
              <span style={{ flex: 1, fontSize: 13, color: T.fg }}>{r.title}</span>
              <span style={{ fontSize: 10, color: T.mutedFg }}>{r.recurrence}</span>
              <span style={{ fontSize: 10, color: T.mutedFg }}>{r.slot}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Main
   ══════════════════════════════════════ */
export default function ProjectViewDemo() {
  return (
    <div className="project-demo-root" style={{
      width: "100%",
      position: "relative",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        position: "relative",
        minHeight: 520,
      }}>
        {/* 좌: 프로젝트 리스트 (플로팅, elevated) */}
        <div className="project-left" style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
        }}>
          <ProjectListPanel />
        </div>

        {/* 우: 프로젝트 상세 (뒤, shifted down) */}
        <div className="project-right" style={{
          marginLeft: 220,
          paddingTop: 32,
          position: "relative",
          zIndex: 1,
          maskImage: "linear-gradient(to bottom, black 60%, transparent 95%), linear-gradient(to right, transparent 0%, black 3%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 95%), linear-gradient(to right, transparent 0%, black 3%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in" as React.CSSProperties["WebkitMaskComposite"],
          maxHeight: 540,
          overflow: "hidden",
        }}>
          <ProjectDetailPanel />
        </div>
      </div>

      {/* Right fade — mobile only */}
      <div className="project-right-fade" />
    </div>
  );
}
