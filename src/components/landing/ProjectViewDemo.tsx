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

const PROJECTS = [
  { name: "AI 챗봇 앱", color: "#60A5FA", tasks: 12, completed: 7, xp: 42, hours: "6h 30m" },
  { name: "포트폴리오", color: "#A78BFA", tasks: 8, completed: 3, xp: 18, hours: "2h 45m" },
  { name: "운동 트래커", color: "#34D399", tasks: 5, completed: 2, xp: 12, hours: "1h 20m" },
  { name: "유튜브 채널", color: "#FBBF24", tasks: 6, completed: 4, xp: 24, hours: "3h 15m" },
];

type TaskItem = {
  title: string;
  done?: boolean;
  xp: number;
  slot?: string;
  deferCount?: number;
  timerStr?: string;
};

const DETAIL_TASKS: TaskItem[] = [
  { title: "GPT API 연동 테스트", done: true, xp: 3, slot: "오전 1st", timerStr: "45m" },
  { title: "채팅 UI 스크롤 버그 수정", done: true, xp: 2, slot: "오전 2nd", timerStr: "30m" },
  { title: "스트리밍 응답 구현", done: true, xp: 3, slot: "오후 1st", timerStr: "52m" },
  { title: "프롬프트 튜닝 실험", done: true, xp: 3, slot: "저녁 1st", timerStr: "38m" },
  { title: "멀티턴 대화 구현", xp: 3, slot: "오후 1st" },
  { title: "히스토리 저장 기능", xp: 2, deferCount: 2 },
  { title: "에러 핸들링 개선", xp: 2, slot: "오후 2nd" },
  { title: "모델 선택 UI", xp: 1 },
  { title: "배포 파이프라인 세팅", xp: 2, deferCount: 1 },
];

const DETAIL_ROUTINES = [
  { title: "GitHub 이슈 체크", recurrence: "매일", slot: "오전" },
  { title: "코드 리뷰 30분", recurrence: "평일", slot: "오후" },
];

/* ── Dot ── */
function Dot({ color, size = 5 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ══════════════════════════════════════
   좌: 프로젝트 리스트 패널
   ══════════════════════════════════════ */
function ProjectListPanel() {
  const activeIdx = 0; // AI 챗봇 앱 선택됨

  return (
    <div style={{
      width: 260,
      borderRadius: T.radius * 1.2,
      backgroundColor: T.card,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
      boxShadow: "0 0 60px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      flexShrink: 0,
      zIndex: 10,
    }}>
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
        }}>프로젝트</span>
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
          <span style={{ flex: 1, fontSize: 13, color: T.mutedFg }}>미분류</span>
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
          <span style={{ fontSize: 13, color: "#333" }}>프로젝트 이름</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   우: 프로젝트 상세 뷰
   ══════════════════════════════════════ */
function ProjectDetailPanel() {
  const p = PROJECTS[0];
  const pct = Math.round((p.completed / p.tasks) * 100);

  return (
    <div style={{
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      backgroundColor: T.bg,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 프로젝트 헤더 */}
      <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: p.color }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: T.fg }}>{p.name}</span>
        </div>
      </div>

      {/* 통계 카드 3열 (실제 StatCard 재현) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "12px 20px" }}>
        {[
          { label: "완료 / 전체", value: `${p.completed} / ${p.tasks}`, sub: `${pct}%`, color: T.fg },
          { label: "투입 시간", value: p.hours, color: T.fg },
          { label: "획득 XP", value: `${p.xp}`, color: T.success },
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
        }}>태스크 ({DETAIL_TASKS.length})</span>

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
          <span style={{ fontSize: 12, color: T.accent, cursor: "pointer" }}>더보기 (+3)</span>
        </div>
      </div>

      {/* 루틴 */}
      <div style={{ padding: "0 20px 16px" }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: T.mutedFg,
          textTransform: "uppercase" as const, letterSpacing: "0.08em",
        }}>루틴 ({DETAIL_ROUTINES.length})</span>
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
    <div style={{
      width: "100%",
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#08080A",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        padding: "20px 0 0 16px",
        position: "relative",
      }}>
        {/* 좌: 프로젝트 리스트 (플로팅) */}
        <div style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          marginTop: 16,
        }}>
          <ProjectListPanel />
        </div>

        {/* 우: 프로젝트 상세 (뒤, 오버플로) */}
        <div style={{
          flex: 1,
          marginLeft: -16,
          position: "relative",
          zIndex: 1,
          maskImage: "linear-gradient(to bottom, black 55%, transparent 100%), linear-gradient(to left, transparent, black 3%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%), linear-gradient(to left, transparent, black 3%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in" as any,
          maxHeight: 480,
          overflow: "hidden",
        }}>
          <ProjectDetailPanel />
        </div>
      </div>

      {/* 하단 페이드 */}
      <div style={{
        height: 32,
        background: "linear-gradient(to bottom, #08080A, transparent)",
        position: "relative",
        zIndex: 2,
      }} />
    </div>
  );
}
