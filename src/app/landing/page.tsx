'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@/styles/landing.css';

/* Demo components — dynamic import to avoid SSR issues */
const HeroDemo = dynamic(() => import('@/components/landing/HeroDemo'), { ssr: false });
const TodayViewDemo = dynamic(() => import('@/components/landing/TodayViewDemo'), { ssr: false });
const GoalCompassDemo = dynamic(() => import('@/components/landing/GoalCompassDemo'), { ssr: false });
const CalendarViewDemo = dynamic(() => import('@/components/landing/CalendarViewDemo'), { ssr: false });
const ProjectViewDemo = dynamic(() => import('@/components/landing/ProjectViewDemo'), { ssr: false });

/* ── Nav ── */
function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--nav-height)',
      background: 'rgba(10, 10, 11, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border-subtle)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%',
      }}>
        <a href="/landing" style={{ textDecoration: 'none' }}>
          <img src="/9todo.svg" alt="9todo" style={{ height: 32, width: 'auto' }} />
        </a>
        <a href="#cta" className="btn-primary" style={{
          height: 36, padding: '0 var(--space-4)', fontSize: 'var(--font-size-small)',
        }}>
          지금 시작하기
        </a>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function Hero() {
  return (
    <section style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--color-bg-void)', overflow: 'hidden', paddingTop: 'var(--nav-height)',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 40%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
        animation: 'hero-glow 16s ease-in-out infinite alternate',
      }} />

      {/* Title */}
      <div className="container" data-hero-label style={{
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', paddingTop: 'clamp(64px, 10vh, 120px)', paddingBottom: 'var(--space-12)',
      }}>
        <h1 data-hero-title style={{
          fontSize: 'var(--font-size-h1)', fontWeight: 'var(--font-weight-semibold)',
          lineHeight: 'var(--line-height-heading)', color: 'var(--color-text-primary)',
          margin: 0, wordBreak: 'keep-all', maxWidth: 700,
        }}>
          <span style={{ fontWeight: 300 }}>Priority by constraints,</span><br />for multitaskers.
        </h1>
        <p className="keep-all" data-hero-sub style={{
          fontSize: 'var(--font-size-body-lg)', fontWeight: 'var(--font-weight-regular)',
          lineHeight: 'var(--line-height-body)', color: 'var(--color-text-secondary)',
          margin: 'var(--space-3) 0 0', maxWidth: 600,
        }}>
          제약이 세우는 우선순위. 멀티태스커를 위한 타임 박스 플래너 시스템.
        </p>
        <div data-hero-cta style={{ marginTop: 'var(--space-8)' }}>
          <a href="#cta" className="btn-primary">지금 시작하기</a>
        </div>
      </div>

      {/* Dashboard */}
      <div data-hero-visual style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 'var(--container-wide, 1400px)',
        paddingInline: 'var(--container-padding)', marginInline: 'auto',
      }}>
        <HeroDemo />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, transparent, var(--color-bg-void))',
          pointerEvents: 'none', zIndex: 2,
        }} />
      </div>
    </section>
  );
}

/* ── Empathy ── */
function Empathy() {
  return (
    <section style={{ background: 'var(--color-bg-void)', paddingBlock: 'var(--space-12, 3rem)' }}>
      <div className="container" style={{ paddingBlock: 'var(--space-10, 2.5rem)' }}>
        <p className="keep-all" style={{
          maxWidth: 900, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          fontWeight: 'var(--font-weight-regular)', lineHeight: 1.4,
          letterSpacing: '-0.05em', color: 'var(--color-text-tertiary)', margin: 0,
        }}>
          <span style={{ fontWeight: 300, color: 'var(--color-text-tertiary)' }}>더 많은 일을 하는 게 아니라.</span>{' '}
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            진짜 중요한 일에 집중할 수 있도록,
          </span>{' '}
          우선순위를 바로 잡고 오늘 하루에 몰입하게 도와줘요.{' '}
          <span style={{ whiteSpace: 'nowrap' }}>
            이것이 <img src="/9todo.svg" alt="9todo" style={{ display: 'inline', height: '1.6em', width: 'auto', verticalAlign: 'middle', marginInline: '0.05em' }} />의 약속이에요.
          </span>
        </p>
      </div>
    </section>
  );
}

/* ── WhyNine (Views) ── */
const VIEWS = [
  {
    num: '01', label: 'Today View', title: 'The essence of a day.',
    body: '하루의 본질만 남기는 9칸의 그리드.\n아침, 오후, 저녁의 우선순위를 명확히 규정합니다. 물리적인 제약은 선택을 강요하며, 그 강제된 선택이 당신의 몰입을 완성합니다. 9칸을 넘어서는 일은 내일의 영역으로 과감히 밀어내세요.',
    demo: 'today-view',
  },
  {
    num: '02', label: 'Identity & Goal', title: '나침반이 없는 실행은 방황일 뿐입니다.',
    body: '단순히 \'할 일\'을 나열하는 것에서 벗어나세요. todoslot 상단의 골 컴파스(Goal Compass)는 당신이 도달하려는 목표와 정체성을 끊임없이 상기시킵니다. 내가 누구인지, 어디로 가는지 잊지 않을 때 비로소 진짜 몰입이 시작됩니다.',
    demo: 'goal-compass',
  },
  {
    num: '03', label: 'Integrated Rhythm', title: '일과 삶이 하나의 시간표로 정리됩니다.',
    body: '아침 독서, 아이 등원, 운동 — 매일 반복되는 투두가 타임 박스를 먼저 채웁니다. 남은 칸에 오늘만의 업무를 넣으세요. 9칸이라는 물리적 제약 안에서, 일과 삶의 우선순위를 정리할 수 있어요.',
    demo: 'calendar-view',
  },
  {
    num: '04', label: 'Contextual Clarity', title: '프로젝트 단위로 에너지를 배분하세요.',
    body: '개인적인 탐구부터 업무의 핵심 프로젝트까지, 모든 태스크를 맥락에 맞게 그룹화합니다. 지금 내 시간이 어디에 얼마나 쓰이고 있는지 투명하게 확인하세요. 복잡하게 얽힌 일들이 프로젝트별로 선명하게 정리됩니다.',
    demo: 'project-view',
  },
  {
    num: '05', label: 'Feedback Loop', title: '데이터는 거짓말을 하지 않습니다.',
    body: '매일, 매주 쌓이는 회고 아카이브는 성장을 위한 가장 정교한 데이터가 됩니다. 단순히 \'했다\'는 기록을 넘어 완료율, 집중 시간, 미루는 패턴까지 분석하세요. todoslot을 쓸수록 당신은 스스로를 더 잘 통제하게 됩니다.',
    demo: 'review-view',
  },
];

function DemoComponent({ type }: { type: string }) {
  switch (type) {
    case 'today-view': return <TodayViewDemo />;
    case 'goal-compass': return <GoalCompassDemo />;
    case 'calendar-view': return <CalendarViewDemo />;
    case 'project-view': return <ProjectViewDemo />;
    default: return (
      <div style={{
        width: '100%', aspectRatio: '16 / 10',
        background: 'var(--color-bg-elevated)', border: 'var(--card-border)',
        borderRadius: 'var(--radius-xl)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-label)',
          textTransform: 'uppercase',
        }}>Feedback Loop UI</span>
      </div>
    );
  }
}

function WhyNine() {
  return (
    <section style={{ background: 'var(--color-bg-void)', paddingBlock: 'var(--section-gap)' }}>
      <div className="container">
        <div style={{ marginBottom: 'var(--space-24)' }}>
          <h2 className="keep-all" style={{
            fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-semibold)',
            letterSpacing: 'var(--tracking-h2)', color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-heading)', margin: 0,
          }}>
            복잡한 머릿속을<br />9칸으로 라벨링해 드려요.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
          {VIEWS.map((view) => (
            <article key={view.num} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
                <span style={{
                  fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-accent)', letterSpacing: 'var(--tracking-label)',
                  textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-1)',
                }}>{view.num}</span>
                <span style={{
                  fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-label)',
                  textTransform: 'uppercase', marginBottom: 'var(--space-6)',
                }}>{view.label}</span>
                <h3 className="keep-all" style={{
                  fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)', lineHeight: 'var(--line-height-sub)',
                  letterSpacing: 'var(--tracking-h3)', margin: '0 0 var(--space-4)',
                  fontFamily: 'var(--font-sans)',
                }}>{view.title}</h3>
                <p className="keep-all" style={{
                  fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-body)', margin: 0, whiteSpace: 'pre-line',
                }}>{view.body}</p>
              </div>
              <div style={{ width: '100%' }}>
                <DemoComponent type={view.demo} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Tools ── */
const TOOLS = [
  { num: '01', title: '앱을 열면, 지금 할 일', body: '현재 시간대의 1순위가 바로 보여요. "다음엔 뭐 하지?" 고민할 시간에 바로 시작하세요.' },
  { num: '02', title: '타이머 누르고, 몰입', body: '뽀모도로 타이머로 하나에 집중하세요. 15분~60분, 원하는 만큼. 완료하면 자동 체크 + XP 획득.' },
  { num: '03', title: '생각이 날 때, 바로 메모', body: '타임 박스에 붙는 퀵 노트예요. 작업 중 떠오른 아이디어, 회고, 메모를 그 자리에서 적으세요.' },
  { num: '04', title: '3초면 끝나는 배치', body: '클릭 몇 번으로 타임 박스에 쏙 넣으세요. 언제 할지 정하는 게 세상에서 제일 쉬워져요.' },
  { num: '05', title: '태그 없이 자동 분류', body: '일회성 태스크와 매일 하는 루틴, 알아서 분류해 드려요. 귀찮은 카테고리 설정 없이 핵심에만 집중하세요.' },
  { num: '06', title: '주간·월간으로 돌아보기', body: '완료한 태스크를 캘린더에서 날짜별로 시각화해요. 쌓인 기록이 성장의 증거가 돼요.' },
];

function Tools() {
  return (
    <section className="section-pad" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="container">
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <h2 className="keep-all" style={{
            fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-semibold)',
            letterSpacing: 'var(--tracking-h2)', color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-heading)', margin: 0,
          }}>
            집중할 수밖에 없는<br />환경을 만들어요.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {TOOLS.map((tool, i) => (
            <div key={tool.num} style={{
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)',
              padding: 'var(--space-8) 0',
              borderBottom: '1px solid var(--color-border-subtle)',
              borderTop: i === 0 ? '1px solid var(--color-border-subtle)' : undefined,
            }}>
              <span style={{
                fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-ghost)', letterSpacing: 'var(--tracking-h2)',
                lineHeight: 1, minWidth: 56, fontFamily: 'var(--font-sans)',
                paddingTop: 'var(--space-1)',
              }}>{tool.num}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: 'var(--font-size-h3)', fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)',
                  lineHeight: 'var(--line-height-tight)', fontFamily: 'var(--font-sans)',
                }}>{tool.title}</h3>
                <p className="keep-all" style={{
                  fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-body)', margin: 0, maxWidth: 560,
                }}>{tool.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Persona ── */
function Persona() {
  return (
    <section className="section-pad" style={{ background: 'var(--color-bg-void)' }}>
      <div className="container">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--grid-gutter)',
        }}>
          <div style={{
            background: 'var(--color-bg-elevated)', border: 'var(--card-border)',
            borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          }}>
            <p style={{
              fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-accent)', letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase', margin: 0,
            }}>바이브 코더에게</p>
            <p className="keep-all" style={{
              fontSize: 'var(--font-size-body-lg)', color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-body)', margin: 0,
            }}>
              사이드 프로젝트 3개 돌리면서<br />
              &ldquo;오늘 뭐 하지?&rdquo; 30분 고민하다 하루가 끝나본 적 있다면 —<br />
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                9칸이면 충분해요.
              </span>
            </p>
          </div>

          <div style={{
            background: 'var(--color-bg-elevated)', border: 'var(--card-border)',
            borderRadius: 'var(--card-radius)', padding: 'var(--card-padding)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          }}>
            <p style={{
              fontSize: 'var(--font-size-label)', fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-accent)', letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase', margin: 0,
            }}>사이드 프로젝트 메이커에게</p>
            <p className="keep-all" style={{
              fontSize: 'var(--font-size-body-lg)', color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-body)', margin: 0,
            }}>
              퇴근 후 3시간.<br />
              뭐부터 할지 고민하다 넷플릭스 켠 적 있다면 —<br />
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                저녁 타임 박스 3개에 답이 있어요.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ── */
function Cta() {
  return (
    <section id="cta" className="section-pad-lg" style={{
      background: 'var(--color-bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, background: 'var(--gradient-cta)', pointerEvents: 'none',
      }} />
      <div className="container" style={{
        position: 'relative', zIndex: 1, maxWidth: 560, marginInline: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        gap: 'var(--space-6)',
      }}>
        <h2 className="keep-all" style={{
          fontSize: 'var(--font-size-h1)', fontWeight: 'var(--font-weight-semibold)',
          letterSpacing: 'var(--tracking-h1)', color: 'var(--color-text-primary)',
          lineHeight: 'var(--line-height-heading)', margin: 0,
        }}>
          오늘 하루를 9칸으로<br />시작해보세요.
        </h2>
        <p className="keep-all" style={{
          fontSize: 'var(--font-size-body-lg)', color: 'var(--color-text-secondary)',
          lineHeight: 'var(--line-height-body)', margin: 0,
        }}>
          가입 없이 바로 시작.<br />
          데이터는 내 브라우저에 저장돼요.
        </p>
        <a href="/" className="btn-primary" style={{
          marginTop: 'var(--space-4)', height: 'var(--form-height-lg)',
          padding: '0 var(--space-12)', fontSize: 'var(--font-size-body-lg)',
          fontWeight: 'var(--font-weight-semibold)',
        }}>
          지금 시작하기
        </a>
        <p style={{
          fontSize: 'var(--font-size-small)', color: 'var(--color-text-tertiary)',
          margin: 0, letterSpacing: 'var(--tracking-body)',
        }}>
          로컬 저장 · 무료 · 오픈소스
        </p>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer style={{
      background: 'var(--color-bg-void)', borderTop: '1px solid var(--color-border-subtle)',
      padding: 'var(--space-8) 0',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-tertiary)' }}>
          &copy; 2026 9todo
        </span>
        <a href="/" style={{
          fontSize: 'var(--font-size-small)', color: 'var(--color-text-tertiary)',
          textDecoration: 'none',
        }}>
          앱으로 이동 &rarr;
        </a>
      </div>
    </footer>
  );
}

/* ── Keyframes (injected via style tag) ── */
function GlobalKeyframes() {
  return (
    <style>{`
      @keyframes hero-glow {
        0%   { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.08); opacity: 0.6; }
      }
      @media (max-width: 768px) {
        .landing .persona-grid-responsive {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
  );
}

/* ══════════════════════════════════════
   Landing Page
   ══════════════════════════════════════ */
export default function LandingPage() {
  useEffect(() => {
    // GSAP animation is optional — works without it
    document.body.style.overflow = '';
  }, []);

  return (
    <>
      <GlobalKeyframes />
      <Nav />
      <main>
        <Hero />
        <Empathy />
        <WhyNine />
        <Tools />
        <Persona />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
