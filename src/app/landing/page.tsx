'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import '@/styles/landing.css';
import { trackEvent } from '@/lib/analytics';

/* Demo components — dynamic import to avoid SSR issues */
const HeroDemo = dynamic(() => import('@/components/landing/HeroDemo'), { ssr: false });
const TodayViewDemo = dynamic(() => import('@/components/landing/TodayViewDemo'), { ssr: false });
const GoalCompassDemo = dynamic(() => import('@/components/landing/GoalCompassDemo'), { ssr: false });
const CalendarViewDemo = dynamic(() => import('@/components/landing/CalendarViewDemo'), { ssr: false });
const ProjectViewDemo = dynamic(() => import('@/components/landing/ProjectViewDemo'), { ssr: false });
const ReviewDemo = dynamic(() => import('@/components/landing/ReviewDemo'), { ssr: false });

/* ── Nav ── */
function Nav({ onCtaClick }: { onCtaClick?: () => void }) {
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
        <a href="#cta" className="btn-primary" onClick={onCtaClick} style={{
          height: 36, padding: '0 var(--space-4)', fontSize: 'var(--font-size-small)',
        }}>
          지금 시작하기
        </a>
      </div>
    </nav>
  );
}

/* ── Hero ── */
/* ── ShaderGradient (shared) ── */
const ShaderGradientLazy = dynamic(
  () => import('shadergradient').then((mod) => {
    const { ShaderGradientCanvas, ShaderGradient } = mod;
    function SG() {
      return (
        <ShaderGradientCanvas style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <ShaderGradient
            type="waterPlane"
            animate="on"
            uTime={0}
            uSpeed={0.04}
            uStrength={1.2}
            uDensity={0.8}
            uFrequency={2}
            uAmplitude={2}
            positionX={0}
            positionY={0.2}
            positionZ={0}
            rotationX={15}
            rotationY={0}
            rotationZ={-5}
            color1="#141414"
            color2="#555555"
            color3="#050505"
            reflection={0.3}
            wireframe={false}
            cAzimuthAngle={200}
            cPolarAngle={80}
            cDistance={2.5}
            cameraZoom={1}
            lightType="3d"
            brightness={1.2}
            envPreset="city"
            grain="on"
            grainBlending={0.2}
          />
        </ShaderGradientCanvas>
      );
    }
    return { default: SG };
  }),
  { ssr: false },
);

/* ── Hero ── */
function Hero() {
  return (
    <section data-section="hero" style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--color-bg-void)', overflow: 'hidden', paddingTop: 'var(--nav-height)',
    }}>
      <ShaderGradientLazy />
      {/* Title — large, generous whitespace above */}
      <div className="container" data-hero-label style={{
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        paddingTop: 'clamp(100px, 18vh, 220px)',
        paddingBottom: 'clamp(48px, 6vh, 80px)',
      }}>
        <h1 data-hero-title style={{
          fontSize: 'clamp(44px, 6vw, 72px)',
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--font-weight-semibold)',
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          color: 'var(--color-text-primary)',
          margin: 0, wordBreak: 'keep-all', maxWidth: 800,
        }}>
          <span style={{ fontWeight: 300, color: 'var(--color-text-secondary)' }}>Priority by constraints,</span>
          <br />
          <span>for multitaskers.</span>
        </h1>
        <p className="keep-all" data-hero-sub style={{
          fontSize: '16px',
          fontWeight: 'var(--font-weight-regular)',
          lineHeight: 'var(--line-height-body)',
          color: 'var(--color-text-tertiary)',
          margin: 'var(--space-4) 0 0', maxWidth: 480,
        }}>
          제약이 세우는 우선순위. 멀티태스커를 위한 타임 박스 플래너 시스템.
        </p>
      </div>

      {/* Dashboard — width matches GNB container, emerges from darkness */}
      <div data-hero-visual style={{
        position: 'relative', zIndex: 1, width: '100%',
        maxWidth: 'var(--container-max, 1200px)',
        paddingInline: 'var(--container-padding)', marginInline: 'auto',
      }}>
        {/* Single outline stroke around entire dashboard */}
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Top edge highlight — gradient for 3D */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.12) 50%, transparent 95%)',
            zIndex: 3,
          }} />
          <HeroDemo />
        </div>

        {/* Deep bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to bottom, transparent 0%, var(--color-bg-void) 100%)',
          pointerEvents: 'none', zIndex: 2,
        }} />
      </div>
    </section>
  );
}

/* ── Empathy ── */
function Empathy() {
  return (
    <section data-section="empathy" style={{ background: 'var(--color-bg-void)', paddingBlock: 'var(--space-12, 3rem)' }}>
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
    case 'review-view': return <ReviewDemo />;
    default: return null;
  }
}

function WhyNine() {
  return (
    <section data-section="why-nine" style={{ background: 'var(--color-bg-void)', paddingBlock: 'var(--section-gap)' }}>
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
            <article key={view.num} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 4vw, 56px)' }}>
              {/* Top — two-column: big title left, desc right */}
              <div className="view-header" style={{ display: 'flex', gap: 'clamp(32px, 5vw, 80px)', alignItems: 'flex-start' }}>
                {/* Left — number + title */}
                <div style={{ flex: '1 1 50%', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                    <span style={{
                      fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-accent)', letterSpacing: 'var(--tracking-label)',
                      textTransform: 'uppercase', fontFamily: 'var(--font-display)',
                    }}>{view.num}</span>
                    <span style={{
                      fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-tertiary)', letterSpacing: 'var(--tracking-label)',
                      textTransform: 'uppercase', fontFamily: 'var(--font-display)',
                    }}>{view.label}</span>
                  </div>
                  <h3 className="keep-all" style={{
                    fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)', lineHeight: 1.2,
                    letterSpacing: '-0.02em', margin: 0,
                    fontFamily: 'var(--font-display)',
                  }}>{view.title}</h3>
                </div>
                {/* Right — description */}
                <div style={{ flex: '1 1 50%', minWidth: 0, paddingTop: 'var(--space-10, 2.5rem)' }}>
                  <p className="keep-all" style={{
                    fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--line-height-body)', margin: 0,
                  }}>{view.body}</p>
                </div>
              </div>
              {/* Bottom — full-width demo */}
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

/* ── Tools — split white / dark-glass, phone center ── */

function PhoneTimerScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
      <div style={{ display: 'flex', borderRadius: 99, backgroundColor: '#f0f0f0', padding: 2, width: 160 }}>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, padding: '4px 0', borderRadius: 99, backgroundColor: '#fff', color: '#1a1a1a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>타이머</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, padding: '4px 0', color: '#8a8a8a' }}>노트</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>스트리밍 응답 구현</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#60A5FA', display: 'inline-block' }} />
        <span style={{ fontSize: 8, color: '#8a8a8a' }}>AI 챗봇 앱</span>
      </div>
      <svg width="120" height="120" viewBox="0 0 200 200">
        <path d={(() => { const cx=100,cy=100,r=78,angle=(17.4/60)*360,sr=-Math.PI/2,er=sr+(angle*Math.PI)/180; return `M ${cx} ${cy} L ${cx+r*Math.cos(sr)} ${cy+r*Math.sin(sr)} A ${r} ${r} 0 ${angle>180?1:0} 1 ${cx+r*Math.cos(er)} ${cy+r*Math.sin(er)} Z`; })()} fill="#F97066" />
        {Array.from({length:12},(_,i)=>{ const v=i*5,a=((v*6)-90)*(Math.PI/180); return <text key={v} x={100+90*Math.cos(a)} y={100+90*Math.sin(a)} textAnchor="middle" dominantBaseline="central" style={{fill:'#F97066',fontSize:9,fontWeight:600}}>{v}</text>; })}
      </svg>
      <span style={{ fontSize: 16, fontWeight: 600, color: '#F97066', fontVariantNumeric: 'tabular-nums', fontFamily: "'Poppins', sans-serif" }}>17:24</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0,1,2,3].map(j=><div key={j} style={{width:4,height:4,borderRadius:'50%',backgroundColor:j<2?'#F97066':'#e0e0e0'}}/>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <span style={{width:28,height:28,borderRadius:'50%',backgroundColor:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </span>
        <span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'6px 14px',borderRadius:99,backgroundColor:'#F97066',color:'#fff',fontSize:10,fontWeight:600}}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>완료
        </span>
        <span style={{width:28,height:28,borderRadius:'50%',backgroundColor:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </span>
      </div>
      <div style={{ width: '100%', marginTop: 6 }}>
        {[{c:'#A78BFA',t:'히어로 섹션 카피 작성'},{c:'#34D399',t:'아이 하원 + 놀이터'}].map((s,i)=>(
          <div key={i} style={{padding:'6px 0',borderTop:'1px solid #f0f0f0',display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:4,height:4,borderRadius:'50%',backgroundColor:s.c,display:'inline-block'}}/>
            <span style={{fontSize:10,color:'#1a1a1a',fontWeight:500}}>{s.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneNoteScreen() {
  const notes = [
    {project:'AI 챗봇 앱',color:'#60A5FA',date:'10:24',content:'streaming 응답 시 chunk 사이즈 조절 필요. 현재 4KB → 1KB로.'},
    {project:'포트폴리오',color:'#A78BFA',date:'14:12',content:'히어로 카피 수정 — 타겟에 맞게.'},
    {project:'독서',color:'#F472B6',date:'16:45',content:'"습관은 정체성의 변화." 골 컴파스에 반영.'},
  ];
  return (
    <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:0}}>
      <div style={{display:'flex',borderRadius:99,backgroundColor:'#f0f0f0',padding:2,width:160,marginInline:'auto',marginBottom:12}}>
        <span style={{flex:1,textAlign:'center',fontSize:9,fontWeight:600,padding:'4px 0',color:'#8a8a8a'}}>타이머</span>
        <span style={{flex:1,textAlign:'center',fontSize:9,fontWeight:600,padding:'4px 0',borderRadius:99,backgroundColor:'#fff',color:'#1a1a1a',boxShadow:'0 1px 2px rgba(0,0,0,0.06)'}}>노트</span>
      </div>
      {notes.map((n,i)=>(
        <div key={i}>
          {i>0&&<div style={{height:1,backgroundColor:'#f0f0f0'}}/>}
          <div style={{padding:'8px 0',display:'flex',flexDirection:'column',gap:3}}>
            <div style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:5,height:5,borderRadius:'50%',backgroundColor:n.color,display:'inline-block'}}/>
              <span style={{fontSize:9,fontWeight:600,color:n.color}}>{n.project}</span>
              <span style={{flex:1}}/>
              <span style={{fontSize:8,color:'#8a8a8a'}}>{n.date}</span>
            </div>
            <p style={{fontSize:11,lineHeight:1.5,color:'#1a1a1a',margin:0}}>{n.content}</p>
          </div>
        </div>
      ))}
      <div style={{marginTop:8,borderRadius:10,padding:'7px 10px',backgroundColor:'#f5f5f5',border:'1px solid #e8e8e8',display:'flex',alignItems:'center',gap:6}}>
        <span style={{fontSize:11,color:'#bbb',flex:1}}>메모를 남겨보세요...</span>
        <div style={{width:22,height:22,borderRadius:'50%',backgroundColor:'#1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',opacity:0.2}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        </div>
      </div>
    </div>
  );
}

function ToolsPhone() {
  const [screen, setScreen] = useState(0);
  useEffect(() => { const t = setInterval(() => setScreen(p=>(p+1)%2), 4000); return () => clearInterval(t); }, []);
  return (
    <div style={{
      width: 260, height: 540,
      borderRadius: 40, border: '1.5px solid rgba(0,0,0,0.08)',
      overflow: 'hidden', backgroundColor: '#fff',
      boxShadow: '0 32px 100px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{height:32,display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:4}}>
        <div style={{width:72,height:22,borderRadius:12,backgroundColor:'#1a1a1a'}}/>
      </div>
      <div style={{flex:1,overflow:'hidden'}}>
        {screen===0?<PhoneTimerScreen/>:<PhoneNoteScreen/>}
      </div>
      <div style={{height:20,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{height:4,width:100,borderRadius:2,backgroundColor:'#e0e0e0'}}/>
      </div>
    </div>
  );
}

const FEATURES = [
  { title: '타이머 누르고, 몰입', desc: '뽀모도로 타이머로 하나에 집중. 완료하면 자동 체크.', featured: false },
  { title: '생각이 날 때, 바로 메모', desc: '작업 중 떠오른 아이디어를 그 자리에서 기록.', featured: true },
  { title: '앱을 열면, 지금 할 일', desc: '현재 시간대의 1순위가 바로 보여요.', featured: false },
  { title: '3초면 끝나는 배치', desc: '드래그 몇 번이면 하루가 정리돼요.', featured: false },
];

function Tools() {
  return (
    <section data-section="tools" style={{
      position: 'relative', overflow: 'hidden', height: 680,
    }}>
      {/* Left — white */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
        backgroundColor: '#FAFAFA',
      }} />
      {/* Right — dark glass */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%',
        background: 'linear-gradient(160deg, rgba(24,24,27,0.94), rgba(10,10,11,0.98))',
        backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)',
      }}>
        {/* Subtle accent glow on glass */}
        <div style={{
          position: 'absolute', top: '15%', left: '-20%', width: '70%', height: '50%',
          background: 'radial-gradient(ellipse at center, rgba(249,112,102,0.05), transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Content */}
      <div className="container" style={{
        position: 'relative', zIndex: 1,
        height: '100%', display: 'flex', alignItems: 'center',
      }}>
        {/* Left — text on white */}
        <div style={{ flex: 1, paddingRight: 160 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: '#F97066',
            letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px',
          }}>Focus Tools</p>
          <h2 className="keep-all" style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600,
            letterSpacing: '-0.03em', color: '#1a1a1a',
            lineHeight: 1.2, margin: '0 0 16px',
          }}>
            집중할 수밖에 없는<br />환경을 만들어요.
          </h2>
          <p className="keep-all" style={{
            fontSize: 15, color: '#71717A', lineHeight: 1.6, margin: 0, maxWidth: 300,
          }}>
            타이머로 몰입하고, 메모로 기록하세요.<br />
            실행에만 집중할 수 있는 도구들.
          </p>
        </div>

        {/* Right — cards on glass */}
        <div style={{ flex: 1, paddingLeft: 160, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              borderRadius: 14, padding: '20px 22px',
              backgroundColor: f.featured ? '#F97066' : 'rgba(255,255,255,0.04)',
              border: f.featured ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{
                fontSize: 15, fontWeight: 600, margin: '0 0 4px',
                color: f.featured ? '#fff' : '#e0e0e0', lineHeight: 1.3,
              }}>{f.title}</h3>
              <p className="keep-all" style={{
                fontSize: 13, lineHeight: 1.5, margin: 0,
                color: f.featured ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
              }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Phone — absolute center */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 10,
        }}>
          <ToolsPhone />
        </div>
      </div>
    </section>
  );
}

/* ── Persona ── */
function Persona() {
  return (
    <section data-section="persona" className="section-pad" style={{ background: 'var(--color-bg-void)' }}>
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

/* ── Impact ── */

function MarqueeStrip({ position, reverse }: { position: 'top' | 'bottom'; reverse?: boolean }) {
  const items = [
    '가입 없이 바로 시작',
    '로컬 저장 · 무료 · 오픈소스',
    '일과 삶의 우선순위를 한눈에',
    '9칸으로 하루를 설계하세요',
    '데이터는 내 브라우저에 저장',
    '가입 없이 바로 시작',
    '로컬 저장 · 무료 · 오픈소스',
    '일과 삶의 우선순위를 한눈에',
    '9칸으로 하루를 설계하세요',
    '데이터는 내 브라우저에 저장',
  ];
  return (
    <div style={{
      position: 'absolute',
      ...(position === 'top' ? { top: 0 } : { bottom: 0 }),
      left: 0, right: 0, zIndex: 4,
      overflow: 'hidden',
      backgroundColor: '#0A0A0B',
      ...(position === 'top'
        ? { borderBottom: '1px solid rgba(255,255,255,0.08)' }
        : { borderTop: '1px solid rgba(255,255,255,0.08)' }),
      padding: '10px 0',
    }}>
      <div className={reverse ? 'marquee-track-reverse' : 'marquee-track'} style={{
        display: 'flex', gap: 0, whiteSpace: 'nowrap',
        width: 'max-content',
      }}>
        {items.map((text, i) => (
          <span key={i} style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'var(--color-text-tertiary)',
            padding: '0 24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 24,
          }}>
            {text}
            <span style={{
              width: 4, height: 4, borderRadius: '50%',
              backgroundColor: 'var(--color-text-tertiary)', opacity: 0.3,
              flexShrink: 0,
            }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function Impact({ onCtaClick }: { onCtaClick?: () => void }) {
  return (
    <section data-section="impact" id="cta" style={{
      position: 'relative', height: '100vh', minHeight: 600,
      background: '#0A0A0B', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <ShaderGradientLazy />
      {/* Headline */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none',
        padding: 'var(--container-padding)',
      }}>
        <h2 style={{
          fontSize: 'clamp(36px, 7vw, 80px)',
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--font-weight-semibold)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          margin: 0,
          textAlign: 'center',
          color: '#FAFAFA',
        }}>
          not everything.
          <br />
          just today.
        </h2>
        {/* CTA button below headline */}
        <a href="/" className="btn-primary" onClick={onCtaClick} style={{
          marginTop: 'var(--space-8)',
          height: 'var(--form-height-lg)',
          padding: '0 var(--space-12)', fontSize: 'var(--font-size-body-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          pointerEvents: 'auto',
        }}>
          지금 시작하기
        </a>
      </div>
      {/* Marquee strip at bottom */}
      <MarqueeStrip position="bottom" />
    </section>
  );
}

/* ── CTA ── */
function Cta({ onCtaClick }: { onCtaClick?: () => void }) {
  return (
    <section data-section="cta" id="cta" className="section-pad-lg" style={{
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
        <a href="/" className="btn-primary" onClick={onCtaClick} style={{
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
  const currentSectionRef = useRef('hero');
  const firedDepths = useRef(new Set<number>());

  // 섹션 진입 추적 + "현재 보고 있는 섹션" 업데이트
  useEffect(() => {
    document.body.style.overflow = '';

    const sections = document.querySelectorAll<HTMLElement>('[data-section]');
    const seen = new Set<string>();

    const sectionObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const name = (e.target as HTMLElement).dataset.section!;
          if (e.isIntersecting) {
            currentSectionRef.current = name;
            if (!seen.has(name)) {
              seen.add(name);
              trackEvent('landing_section_view', { section: name });
            }
          }
        }
      },
      { threshold: 0.3 },
    );
    sections.forEach((s) => sectionObs.observe(s));

    // 스크롤 깊이 추적 (25/50/75/100%)
    const handleScroll = () => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollH <= 0) return;
      const pct = Math.round((window.scrollY / scrollH) * 100);
      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !firedDepths.current.has(milestone)) {
          firedDepths.current.add(milestone);
          trackEvent('landing_scroll_depth', { percent: milestone });
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      sectionObs.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // CTA 클릭 시 현재 섹션 포함
  const handleCtaClick = useCallback((location: string) => {
    trackEvent('landing_cta_click', {
      location,
      viewing_section: currentSectionRef.current,
    });
  }, []);

  return (
    <>
      <GlobalKeyframes />
      <Nav onCtaClick={() => handleCtaClick('nav')} />
      <main>
        <Hero />
        <Empathy />
        <WhyNine />
        {/* <Tools /> */}
        <Impact onCtaClick={() => handleCtaClick('bottom')} />
      </main>
      <Footer />
    </>
  );
}
