/**
 * CalendarViewDemo — 실제 9todo CalendarView 월간 + 모바일 타임테이블 재현
 *
 * 레이어:
 * - 좌(앞): 모바일 타임테이블 플로팅 (투두+루틴 오늘 뷰)
 * - 우(뒤): PC 월간 캘린더 (7칼럼 그리드, 하단/우측 오버플로)
 *
 * 실제 코드 참조:
 * /Users/sara/Desktop/9todo/src/components/calendar/CalendarView.tsx
 */

/* ── 실제 앱 dark theme 토큰 ── */
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
  { name: "AI 챗봇 앱", color: "#60A5FA" },
  { name: "포트폴리오", color: "#A78BFA" },
  { name: "운동 트래커", color: "#34D399" },
  { name: "유튜브 채널", color: "#FBBF24" },
];

type TodoItem = { title: string; project?: typeof PROJECTS[0]; done?: boolean };
type RoutineItem = { title: string; done?: boolean };

type DayData = {
  todos: TodoItem[];
  routines: RoutineItem[];
  xp: number;
};

/* ── 5월 캘린더 데이터 ── */
const MAY_DATA: Record<number, DayData> = {
  1: { todos: [], routines: [{ title: "GitHub 이슈 체크", done: true }], xp: 1 },
  2: { todos: [{ title: "DB 스키마 설계", project: PROJECTS[0], done: true }], routines: [{ title: "코드 리뷰 30분", done: true }], xp: 5 },
  3: { todos: [], routines: [], xp: 0 },
  5: { todos: [{ title: "API 엔드포인트 정리", project: PROJECTS[0], done: true }], routines: [{ title: "GitHub 이슈 체크", done: true }, { title: "운동 30분", done: true }], xp: 6 },
  6: { todos: [{ title: "채팅 UI 프로토타입", project: PROJECTS[0], done: true }, { title: "포트폴리오 레이아웃", project: PROJECTS[1], done: true }], routines: [{ title: "코드 리뷰 30분", done: true }], xp: 7 },
  7: { todos: [{ title: "GPT API 연동 테스트", project: PROJECTS[0], done: true }, { title: "스크롤 버그 수정", project: PROJECTS[0], done: true }], routines: [{ title: "GitHub 이슈 체크", done: true }, { title: "운동 30분", done: true }], xp: 8 },
  8: { todos: [{ title: "스트리밍 응답 구현", project: PROJECTS[0] }, { title: "히어로 카피 작성", project: PROJECTS[1] }, { title: "영상 편집 EP.12", project: PROJECTS[3] }], routines: [{ title: "GitHub 이슈 체크" }, { title: "코드 리뷰 30분" }], xp: 0 },
  9: { todos: [{ title: "프롬프트 튜닝", project: PROJECTS[0] }], routines: [{ title: "운동 30분" }], xp: 0 },
  12: { todos: [{ title: "대시보드 와이어프레임", project: PROJECTS[2] }], routines: [{ title: "GitHub 이슈 체크" }], xp: 0 },
  13: { todos: [{ title: "썸네일 디자인", project: PROJECTS[3] }], routines: [], xp: 0 },
  14: { todos: [], routines: [{ title: "코드 리뷰 30분" }, { title: "운동 30분" }], xp: 0 },
};

const KO_WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const FIRST_DAY = 4; // 2026-05-01 = 금요일 (0=일)
const DAYS_IN_MONTH = 31;
const TODAY = 8;

const LINE_COLORS = ["#4ADE80", "#F97066", "#F59E0B"];

/* ── Dot ── */
function Dot({ color, size = 4 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color, flexShrink: 0, display: "inline-block" }} />;
}

/* ── Check icon ── */
function CheckIcon({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── 투두 칩 (실제 renderTodoItem 재현) ── */
function TodoChip({ item }: { item: TodoItem }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 3,
      padding: "2px 6px",
      borderRadius: 4,
      fontSize: 10,
      lineHeight: 1.3,
      backgroundColor: item.done ? "transparent" : T.muted,
      color: item.done ? T.success : T.fg,
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    }}>
      {item.done && <CheckIcon />}
      {item.project && <Dot color={item.project.color} size={4} />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
    </div>
  );
}

/* ── 루틴 칩 (실제 renderRoutineItem 재현) ── */
function RoutineChip({ item }: { item: RoutineItem }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 3,
      padding: "2px 6px",
      borderRadius: 4,
      fontSize: 10,
      lineHeight: 1.3,
      backgroundColor: item.done ? "transparent" : T.muted,
      color: item.done ? T.success : T.fg,
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    }}>
      {item.done && <CheckIcon />}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</span>
    </div>
  );
}

/* ── 날짜 셀 (실제 월간 캘린더 셀 재현) ── */
function DayCell({ day, data }: { day: number; data?: DayData }) {
  const isToday = day === TODAY;
  const dayOfWeek = (FIRST_DAY + day - 1) % 7;

  return (
    <div style={{
      minHeight: 72,
      padding: 6,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      borderRight: dayOfWeek === 6 ? "none" : `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
    }}>
      {/* 날짜 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{
          fontSize: 11,
          fontWeight: isToday ? 700 : 400,
          lineHeight: 1,
          color: isToday ? T.bg : T.mutedFg,
          ...(isToday ? {
            width: 20, height: 20, borderRadius: "50%",
            backgroundColor: T.fg, display: "flex", alignItems: "center", justifyContent: "center",
          } : {}),
        }}>
          {day}
        </span>
        {data && data.xp > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, color: T.success }}>+{data.xp}</span>
        )}
      </div>

      {/* 투두 + 루틴 */}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {data.todos.slice(0, 2).map((t, i) => <TodoChip key={`t${i}`} item={t} />)}
          {data.todos.length > 0 && data.routines.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.borderSubtle}`, margin: "2px 0" }} />
          )}
          {data.routines.slice(0, 2).map((r, i) => <RoutineChip key={`r${i}`} item={r} />)}
          {(data.todos.length > 2 || data.routines.length > 2) && (
            <span style={{ fontSize: 9, color: T.mutedFg, paddingLeft: 4 }}>
              +{Math.max(0, data.todos.length - 2) + Math.max(0, data.routines.length - 2)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   PC: 월간 캘린더
   ══════════════════════════════════════ */
function MonthlyCalendar() {
  const cells: React.ReactNode[] = [];

  // 빈 칸 (5/1 전)
  for (let i = 0; i < FIRST_DAY; i++) {
    cells.push(
      <div key={`prev-${i}`} style={{
        minHeight: 72,
        borderRight: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
      }} />
    );
  }

  // 날짜
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    cells.push(<DayCell key={d} day={d} data={MAY_DATA[d]} />);
  }

  return (
    <div style={{
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      backgroundColor: T.card,
      overflow: "hidden",
    }}>
      {/* 헤더 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>2026년 5월</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["전체", "투두", "루틴"].map((label, i) => (
            <span key={label} style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
              backgroundColor: i === 0 ? T.muted : "transparent",
              color: i === 0 ? T.fg : T.mutedFg,
            }}>{label}</span>
          ))}
          <span style={{ width: 1, backgroundColor: T.border, margin: "0 4px" }} />
          {["이번주", "이번달"].map((label, i) => (
            <span key={label} style={{
              fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
              backgroundColor: i === 1 ? T.muted : "transparent",
              color: i === 1 ? T.fg : T.mutedFg,
            }}>{label}</span>
          ))}
        </div>
      </div>

      {/* 요일 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.border}` }}>
        {KO_WEEKDAYS.map((day) => (
          <div key={day} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "8px 0", fontSize: 11, fontWeight: 600, color: T.mutedFg,
          }}>{day}</div>
        ))}
      </div>

      {/* 그리드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {cells}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   모바일: 오늘 타임테이블
   ══════════════════════════════════════ */
function MobileTimetable() {
  const PERIODS = [
    { label: "오전", time: "9:00 ~ 12:00" },
    { label: "오후", time: "12:00 ~ 18:00" },
  ];

  type SlotItem = { title: string; project?: typeof PROJECTS[0]; done?: boolean; isRoutine?: boolean; xp: number; time?: string };

  const MOBILE_SLOTS: SlotItem[][] = [
    [
      { title: "GPT API 연동 테스트", project: PROJECTS[0], done: true, xp: 3, time: "45m" },
      { title: "채팅 UI 스크롤 버그", project: PROJECTS[0], done: true, xp: 2, time: "30m" },
      { title: "GitHub 이슈 체크", isRoutine: true, done: true, xp: 1 },
    ],
    [
      { title: "스트리밍 응답 구현", project: PROJECTS[0], xp: 3 },
      { title: "히어로 카피 작성", project: PROJECTS[1], xp: 2 },
      { title: "코드 리뷰 30분", isRoutine: true, xp: 1 },
    ],
  ];

  return (
    <div style={{
      width: 300,
      aspectRatio: "9 / 16",
      borderRadius: 28,
      backgroundColor: T.bg,
      border: `1px solid ${T.border}`,
      overflow: "hidden",
      boxShadow: "0 0 60px rgba(0,0,0,0.6), 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
      fontFamily: "var(--font-sans)",
      flexShrink: 0,
      display: "flex",
      flexDirection: "column" as const,
      maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
    }}>
      {/* 상단 노치 */}
      <div style={{
        display: "flex", justifyContent: "center", padding: "8px 0 4px",
      }}>
        <div style={{ width: 80, height: 4, borderRadius: 4, backgroundColor: T.muted }} />
      </div>

      {/* 골 컴파스 미니 */}
      <div style={{
        margin: "6px 12px",
        padding: "10px 12px",
        borderRadius: T.radius,
        backgroundColor: T.card,
      }}>
        <span style={{ fontSize: 12, color: T.fg }}>
          오늘 끝낼 일은 <span style={{ color: T.accent, fontWeight: 600 }}>시간표 UI 완성</span>
        </span>
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: T.fg, fontFamily: "'Poppins', var(--font-sans)" }}>
            847<span style={{ fontSize: 11, fontWeight: 600, color: T.mutedFg, marginLeft: 2 }}>xp</span>
          </span>
        </div>
      </div>

      {/* 날짜 헤더 */}
      <div style={{
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>5월 8일 목</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.success }}>+5 xp</span>
      </div>

      {/* 시간대별 슬롯 */}
      <div style={{ padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        {PERIODS.map((period, rowIdx) => (
          <div key={period.label} style={{ borderRadius: 10, backgroundColor: T.card }}>
            {/* 헤더 */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 2, alignSelf: "stretch", backgroundColor: LINE_COLORS[rowIdx],
                marginLeft: 8, borderRadius: 2,
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.fg }}>{period.label}</span>
                <span style={{ fontSize: 8, color: T.mutedFg }}>{period.time}</span>
              </div>
            </div>
            {/* 슬롯 */}
            <div style={{ display: "flex" }}>
              <div style={{
                width: 2, backgroundColor: LINE_COLORS[rowIdx],
                marginLeft: 8, borderRadius: 2,
              }} />
              <div style={{ flex: 1, padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                {MOBILE_SLOTS[rowIdx].map((item, i) => (
                  <div key={i} style={{
                    padding: "6px 8px",
                    borderRadius: 8,
                    backgroundColor: item.done ? T.gridBg : T.surfaceInset,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    border: item.isRoutine ? `1px dashed ${T.borderSubtle}` : "1px solid transparent",
                  }}>
                    {item.project && (
                      <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 8, color: item.project.color }}>
                        <Dot color={item.project.color} size={3} />{item.project.name}
                      </span>
                    )}
                    {item.isRoutine && (
                      <span style={{ fontSize: 8, color: T.mutedFg }}>루틴</span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 500, lineHeight: 1.3,
                      color: item.done ? T.mutedFg : T.fg,
                      textDecoration: item.done ? "line-through" : "none",
                    }}>{item.title}</span>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      {item.done && item.time && (
                        <span style={{ fontSize: 8, color: T.mutedFg, marginRight: 4 }}>
                          {item.time}
                        </span>
                      )}
                      <span style={{
                        fontSize: 8, fontWeight: 700,
                        color: item.done ? T.success : "rgba(255,92,101,0.4)",
                      }}>
                        {item.done ? "+" : ""}{item.xp}xp
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 백로그 힌트 + 하단 여백 */}
      <div style={{ padding: "6px 14px", marginTop: "auto" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 0",
          borderTop: `1px solid ${T.border}`,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.mutedFg} strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          <span style={{ fontSize: 11, color: T.mutedFg }}>백로그</span>
          <span style={{ fontSize: 10, color: "#333" }}>3</span>
        </div>
      </div>

      {/* 하단 홈바 */}
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 8px" }}>
        <div style={{ width: 100, height: 4, borderRadius: 4, backgroundColor: T.muted }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Main
   ══════════════════════════════════════ */
export default function CalendarViewDemo() {
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
        {/* 좌: 모바일 (플로팅, 앞) */}
        <div style={{
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
          marginTop: 20,
        }}>
          <MobileTimetable />
        </div>

        {/* 우: 월간 캘린더 (뒤, 우측+하단 오버플로) */}
        <div style={{
          flex: 1,
          marginLeft: -20,
          position: "relative",
          zIndex: 1,
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%), linear-gradient(to left, transparent, black 5%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%), linear-gradient(to left, transparent, black 5%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in" as any,
          maxHeight: 520,
          overflow: "hidden",
        }}>
          <MonthlyCalendar />
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
