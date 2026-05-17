'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import '@/styles/landing.css';
import { trackEvent } from '@/lib/analytics';
import { useLocale, type Locale } from '@/i18n/context';
import type { Translations } from '@/i18n/ko';

/* Demo components — dynamic import to avoid SSR issues */
const HeroDemo = dynamic(() => import('@/components/landing/HeroDemo'), { ssr: false });
const TodayViewDemo = dynamic(() => import('@/components/landing/TodayViewDemo'), { ssr: false });
const GoalCompassDemo = dynamic(() => import('@/components/landing/GoalCompassDemo'), { ssr: false });
const CalendarViewDemo = dynamic(() => import('@/components/landing/CalendarViewDemo'), { ssr: false });
const ProjectViewDemo = dynamic(() => import('@/components/landing/ProjectViewDemo'), { ssr: false });
const ReviewDemo = dynamic(() => import('@/components/landing/ReviewDemo'), { ssr: false });
const WaitlistModal = dynamic(() => import('@/components/modals/WaitlistModal'), { ssr: false });

/* ── Nav ── */
function Nav({
  onCtaClick,
  t,
  locale,
  setLocale,
}: {
  onCtaClick?: () => void;
  t: Translations;
  locale: Locale;
  setLocale: (l: Locale) => void;
}) {
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
        <a href="/" style={{ textDecoration: 'none' }}>
          <img src="/9todo.svg" alt="9todo" style={{ height: 32, width: 'auto' }} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
            style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', marginRight: 24 }}
          >
            {locale === 'ko' ? 'EN' : '한국어'}
          </button>
          <a href="/dashboard" className="btn-primary" onClick={onCtaClick} style={{
            height: 36, padding: '0 var(--space-4)', fontSize: 'var(--font-size-small)',
          }}>
            {t.startNow}
          </a>
        </div>
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
function Hero({ onCtaClick, onWaitlistClick, t }: { onCtaClick?: () => void; onWaitlistClick?: () => void; t: Translations }) {
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
          <span style={{ fontWeight: 300, color: 'var(--color-text-secondary)' }}>Stop planning.</span>
          <br />
          <span>Start finishing.</span>
        </h1>
        <p className="keep-all" data-hero-sub style={{
          fontSize: '16px',
          fontWeight: 'var(--font-weight-regular)',
          lineHeight: 'var(--line-height-body)',
          color: 'var(--color-text-tertiary)',
          margin: 'var(--space-4) 0 0', maxWidth: 480,
        }}>
          {t.heroSub}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
          <a href="/dashboard" className="btn-primary" onClick={onCtaClick}>
            {t.startNow}
          </a>
          <button onClick={onWaitlistClick} className="btn-waitlist">
            {t.joinWaitlist}
          </button>
        </div>
      </div>

      {/* Dashboard — width matches GNB container, emerges from darkness */}
      <div data-hero-visual className="hero-float" style={{
        position: 'relative', zIndex: 1, width: '100%',
        maxWidth: 'var(--container-max, 1200px)',
        paddingInline: 'var(--container-padding)', marginInline: 'auto',
      }}>
        {/* Single outline stroke around entire dashboard */}
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
        }}>
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
function Empathy({ t }: { t: Translations }) {
  return (
    <section data-section="empathy" style={{ background: 'var(--color-bg-void)', paddingBlock: 'var(--space-12, 3rem)' }}>
      <div className="container" style={{ paddingBlock: 'var(--space-10, 2.5rem)' }}>
        <p className="keep-all reveal" style={{
          maxWidth: 900, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          fontWeight: 'var(--font-weight-regular)', lineHeight: 1.4,
          letterSpacing: '-0.05em', color: 'var(--color-text-tertiary)', margin: 0,
        }}>
          <span style={{ fontWeight: 300, color: 'var(--color-text-tertiary)' }}>{t.empathy1}</span>{' '}
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            {t.empathy2}
          </span>{' '}
          {t.empathy3}{' '}
          <span style={{ whiteSpace: 'nowrap' }}>
            <img src="/9todo.svg" alt="9todo" style={{ display: 'inline', height: '1.6em', width: 'auto', verticalAlign: 'middle', marginInline: '0.05em' }} />{t.empathy4}
          </span>
        </p>
      </div>
    </section>
  );
}

/* ── Authority ── */
const AUTHORITY_NAMES = [
  'Harvard Business Review',
  'Elon Musk',
  'Bill Gates',
  'Cal Newport',
];

function Authority({ t }: { t: Translations }) {
  return (
    <section data-section="authority" style={{ background: 'var(--color-bg-void)', paddingBlock: 'clamp(3rem, 8vw, 6rem)' }}>
      <div className="container" style={{
        display: 'flex', flexDirection: 'column', gap: 'clamp(2.5rem, 5vw, 4rem)',
      }}>
        {/* Name strip */}
        <div className="reveal" style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(2rem, 5vw, 4rem)', flexWrap: 'wrap',
        }}>
          {AUTHORITY_NAMES.map((name, i) => (
            <span key={name} className="reveal" style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)',
              fontWeight: 600, letterSpacing: '0.02em',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap', userSelect: 'none',
              transitionDelay: `${i * 0.15}s`,
            }}>
              {name}
            </span>
          ))}
        </div>

        {/* Statement */}
        <p className="keep-all reveal" style={{
          fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
          lineHeight: 1.35, letterSpacing: '-0.03em',
          margin: 0, maxWidth: 900,
          transitionDelay: '0.5s',
        }}>
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
            {t.authorityTitle.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </span>{' '}
          <span style={{ fontWeight: 'var(--font-weight-regular)', color: 'var(--color-text-tertiary)' }}>
            {t.authoritySub}
          </span>
        </p>

        {/* Small citation */}
        <p className="reveal" style={{
          fontSize: 'var(--font-size-small)', color: 'var(--color-text-quaternary, rgba(255,255,255,0.35))',
          margin: 0, letterSpacing: '0.02em',
          transitionDelay: '0.8s',
        }}>
          {t.authorityBadge}
        </p>
      </div>
    </section>
  );
}

/* ── WhyNine (Views) ── */
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

function WhyNine({ t }: { t: Translations }) {
  const VIEWS = [
    {
      num: '01', label: 'Today View', title: t.views01Title,
      body: t.views01Body,
      demo: 'today-view',
    },
    {
      num: '02', label: 'Identity & Goal', title: t.views02Title,
      body: t.views02Body,
      demo: 'goal-compass',
    },
    {
      num: '03', label: 'Integrated Rhythm', title: t.views03Title,
      body: t.views03Body,
      demo: 'calendar-view',
    },
    {
      num: '04', label: 'Contextual Clarity', title: t.views04Title,
      body: t.views04Body,
      demo: 'project-view',
    },
    {
      num: '05', label: 'Feedback Loop', title: t.views05Title,
      body: t.views05Body,
      demo: 'review-view',
    },
  ];

  return (
    <section data-section="why-nine" style={{ background: 'var(--color-bg-void)', paddingBlock: 'var(--section-gap)' }}>
      <div className="container">
        {t.whyNineTitle && (
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <h2 className="keep-all" style={{
              fontSize: 'var(--font-size-h2)', fontWeight: 'var(--font-weight-semibold)',
              letterSpacing: 'var(--tracking-h2)', color: 'var(--color-text-primary)',
              lineHeight: 'var(--line-height-heading)', margin: 0,
            }}>
              {t.whyNineTitle.split('\n').map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
              ))}
            </h2>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
          {VIEWS.map((view) => (
            <article key={view.num} className="reveal" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 4vw, 56px)' }}>
              {/* Divider line */}
              <div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: 0 }} />
                <div style={{ height: 30 }} />
              </div>
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
                  {view.title && (
                    <h3 className="keep-all" style={{
                      fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)', lineHeight: 1.2,
                      letterSpacing: '-0.02em', margin: 0,
                      fontFamily: 'var(--font-display)',
                    }}>{view.title.split('\n').map((line, i, arr) => (
                      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                    ))}</h3>
                  )}
                </div>
                {/* Right — description */}
                <div style={{ flex: '1 1 50%', minWidth: 0, paddingTop: 'var(--space-10, 2.5rem)' }}>
                  <p className="keep-all" style={{
                    fontSize: 'var(--font-size-body)', color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--line-height-body)', margin: 0,
                  }}>
                    {view.body.split('\n').map((line, i, arr) => (
                      <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                    ))}
                  </p>
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

function PhoneTimerScreen({ t }: { t: Translations }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
      <div style={{ display: 'flex', borderRadius: 99, backgroundColor: '#f0f0f0', padding: 2, width: 160 }}>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, padding: '4px 0', borderRadius: 99, backgroundColor: '#fff', color: '#1a1a1a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>{t.timer}</span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600, padding: '4px 0', color: '#8a8a8a' }}>{t.note}</span>
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{t.phoneTaskTitle}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#60A5FA', display: 'inline-block' }} />
        <span style={{ fontSize: 8, color: '#8a8a8a' }}>{t.phoneTaskProject}</span>
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
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{t.complete}
        </span>
        <span style={{width:28,height:28,borderRadius:'50%',backgroundColor:'#e8e8e8',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </span>
      </div>
      <div style={{ width: '100%', marginTop: 6 }}>
        {[{c:'#A78BFA',t:t.phoneQueueItem1},{c:'#34D399',t:t.phoneQueueItem2}].map((s,i)=>(
          <div key={i} style={{padding:'6px 0',borderTop:'1px solid #f0f0f0',display:'flex',alignItems:'center',gap:5}}>
            <span style={{width:4,height:4,borderRadius:'50%',backgroundColor:s.c,display:'inline-block'}}/>
            <span style={{fontSize:10,color:'#1a1a1a',fontWeight:500}}>{s.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneNoteScreen({ t }: { t: Translations }) {
  const notes = [
    {project: t.phoneNote1Project, color:'#60A5FA', date:'10:24', content: t.phoneNote1Content},
    {project: t.phoneNote2Project, color:'#A78BFA', date:'14:12', content: t.phoneNote2Content},
    {project: t.phoneNote3Project, color:'#F472B6', date:'16:45', content: t.phoneNote3Content},
  ];
  return (
    <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:0}}>
      <div style={{display:'flex',borderRadius:99,backgroundColor:'#f0f0f0',padding:2,width:160,marginInline:'auto',marginBottom:12}}>
        <span style={{flex:1,textAlign:'center',fontSize:9,fontWeight:600,padding:'4px 0',color:'#8a8a8a'}}>{t.timer}</span>
        <span style={{flex:1,textAlign:'center',fontSize:9,fontWeight:600,padding:'4px 0',borderRadius:99,backgroundColor:'#fff',color:'#1a1a1a',boxShadow:'0 1px 2px rgba(0,0,0,0.06)'}}>{t.note}</span>
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
        <span style={{fontSize:11,color:'#bbb',flex:1}}>{t.noteInputPlaceholder}</span>
        <div style={{width:22,height:22,borderRadius:'50%',backgroundColor:'#1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',opacity:0.2}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        </div>
      </div>
    </div>
  );
}

function ToolsPhone({ t }: { t: Translations }) {
  const [screen, setScreen] = useState(0);
  useEffect(() => { const timer = setInterval(() => setScreen(p=>(p+1)%2), 4000); return () => clearInterval(timer); }, []);
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
        {screen===0?<PhoneTimerScreen t={t}/>:<PhoneNoteScreen t={t}/>}
      </div>
      <div style={{height:20,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{height:4,width:100,borderRadius:2,backgroundColor:'#e0e0e0'}}/>
      </div>
    </div>
  );
}

function Tools({ t }: { t: Translations }) {
  const FEATURES = [
    { title: t.feature1Title, desc: t.feature1Desc, featured: false },
    { title: t.feature2Title, desc: t.feature2Desc, featured: true },
    { title: t.feature3Title, desc: t.feature3Desc, featured: false },
    { title: t.feature4Title, desc: t.feature4Desc, featured: false },
  ];

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
          }}>{t.focusTools}</p>
          <h2 className="keep-all" style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600,
            letterSpacing: '-0.03em', color: '#1a1a1a',
            lineHeight: 1.2, margin: '0 0 16px',
          }}>
            {t.focusToolsTitle.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h2>
          <p className="keep-all" style={{
            fontSize: 15, color: '#71717A', lineHeight: 1.6, margin: 0, maxWidth: 300,
          }}>
            {t.focusToolsSub.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
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
          <ToolsPhone t={t} />
        </div>
      </div>
    </section>
  );
}

/* ── Persona ── */
function Persona({ t }: { t: Translations }) {
  const vibeLines = t.personaVibeCoderDesc.split('\n');
  const sideLines = t.personaSideProjectDesc.split('\n');

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
            }}>{t.personaVibeCoder}</p>
            <p className="keep-all" style={{
              fontSize: 'var(--font-size-body-lg)', color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-body)', margin: 0,
            }}>
              {vibeLines.map((line, i) => (
                i < vibeLines.length - 1
                  ? <span key={i}>{line}<br /></span>
                  : <span key={i} style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>{line}</span>
              ))}
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
            }}>{t.personaSideProject}</p>
            <p className="keep-all" style={{
              fontSize: 'var(--font-size-body-lg)', color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-height-body)', margin: 0,
            }}>
              {sideLines.map((line, i) => (
                i < sideLines.length - 1
                  ? <span key={i}>{line}<br /></span>
                  : <span key={i} style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--font-weight-medium)' }}>{line}</span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Impact ── */

function MarqueeStrip({ position, reverse, t }: { position: 'top' | 'bottom'; reverse?: boolean; t: Translations }) {
  const items = [...t.marqueeItems, ...t.marqueeItems];
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

function Impact({ onCtaClick, onWaitlistClick, t }: { onCtaClick?: () => void; onWaitlistClick?: () => void; t: Translations }) {
  return (
    <section data-section="impact" id="cta" style={{
      position: 'relative', height: '100vh', minHeight: 600,
      background: '#0A0A0B', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <ShaderGradientLazy />
      {/* Headline */}
      <div className="reveal" style={{
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
        {/* CTA buttons below headline */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)', pointerEvents: 'auto' }}>
          <a href="/dashboard" className="btn-primary" onClick={onCtaClick} style={{
            height: 'var(--form-height-lg)',
            padding: '0 var(--space-12)', fontSize: 'var(--font-size-body-lg)',
            fontWeight: 'var(--font-weight-semibold)',
          }}>
            {t.startNow}
          </a>
          <button onClick={onWaitlistClick} className="btn-waitlist" style={{
            height: 'var(--form-height-lg)',
            padding: '0 var(--space-12)', fontSize: 'var(--font-size-body-lg)',
            fontWeight: 'var(--font-weight-semibold)',
          }}>
            {t.joinWaitlist}
          </button>
        </div>
      </div>
      {/* Marquee strip at bottom */}
      <MarqueeStrip position="bottom" t={t} />
    </section>
  );
}

/* ── CTA ── */
function Cta({ onCtaClick, t }: { onCtaClick?: () => void; t: Translations }) {
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
          {t.ctaTitle.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </h2>
        <p className="keep-all" style={{
          fontSize: 'var(--font-size-body-lg)', color: 'var(--color-text-secondary)',
          lineHeight: 'var(--line-height-body)', margin: 0,
        }}>
          {t.ctaSub.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>
        <a href="/dashboard" className="btn-primary" onClick={onCtaClick} style={{
          marginTop: 'var(--space-4)', height: 'var(--form-height-lg)',
          padding: '0 var(--space-12)', fontSize: 'var(--font-size-body-lg)',
          fontWeight: 'var(--font-weight-semibold)',
        }}>
          {t.startNow}
        </a>
        <p style={{
          fontSize: 'var(--font-size-small)', color: 'var(--color-text-tertiary)',
          margin: 0, letterSpacing: 'var(--tracking-body)',
        }}>
          {t.ctaLocal}
        </p>
      </div>
    </section>
  );
}

/* ── Footer (playke 공통 푸터) ── */
function Footer() {
  return (
    <footer className="playke-footer">
      <div className="container">
        {/* 상단: 로고 & 설명 */}
        <div className="footer-top">
          <div>
            <a href="https://playke.app" className="footer-logo">
              <img src="/images/playke.svg" alt="Playke" className="footer-logo-img" />
            </a>
            <p className="footer-desc">AI 네이티브 빌딩 스튜디오. 기획부터 배포까지.</p>
          </div>
        </div>

        {/* 서비스 & SNS */}
        <div className="footer-mid">
          <div className="footer-services">
            <span className="footer-mid-label">Services</span>
            <a href="https://mindplanet.app" target="_blank" rel="noopener">Mind Planet</a>
            <a href="https://9todo.app" target="_blank" rel="noopener">9todo</a>
          </div>
          <div className="footer-sns">
            <span className="footer-mid-label">SNS</span>
            <a href="https://brunch.co.kr/@sarayun" target="_blank" rel="noopener">Brunch</a>
            <a href="https://www.youtube.com/channel/UC--hf0xHdxDQfqNIn4h8k6g" target="_blank" rel="noopener">YouTube</a>
            <a href="https://www.threads.com/@hagiro_lab" target="_blank" rel="noopener">Threads</a>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="footer-business">
          <p><span className="footer-biz-label">상호명</span> playke</p>
          <p><span className="footer-biz-label">대표자</span> 윤사라</p>
          <p><span className="footer-biz-label">사업자등록번호</span> 526-01-03127</p>
          <p><span className="footer-biz-label">이메일</span> <a href="mailto:hello@playke.app">hello@playke.app</a></p>
        </div>

        {/* 저작권 */}
        <div className="footer-bottom">
          <p className="footer-copyright">&copy; 2026 Playke. All rights reserved.</p>
        </div>
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
      @keyframes hero-float {
        0%   { transform: translateY(0); }
        50%  { transform: translateY(-12px); }
        100% { transform: translateY(0); }
      }
      @keyframes hero-entrance {
        0%   { opacity: 0; transform: translateY(60px) perspective(800px) rotateX(2deg); }
        100% { opacity: 1; transform: translateY(0) perspective(800px) rotateX(0deg); }
      }
      .hero-float {
        animation: hero-entrance 1.8s cubic-bezier(0.25, 1, 0.5, 1) 0.3s both;
      }
      .reveal {
        opacity: 0;
        transform: translateY(48px);
        transition: opacity 1.8s cubic-bezier(0.25, 1, 0.5, 1),
                    transform 2s cubic-bezier(0.25, 1, 0.5, 1);
        will-change: opacity, transform;
      }
      .reveal.revealed {
        opacity: 1;
        transform: translateY(0);
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
  const { t, locale, setLocale } = useLocale();
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

    // Reveal animation — 스크롤 시 요소가 부드럽게 떠오름
    const revealEls = document.querySelectorAll<HTMLElement>('.reveal');
    const revealObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('revealed');
            revealObs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -15% 0px' },
    );
    // 페이지 로드 직후가 아닌 첫 프레임 이후 observe 시작
    // → 초기 뷰포트 밖 요소만 숨김 유지, 스크롤해야 등장
    setTimeout(() => {
      revealEls.forEach((el) => revealObs.observe(el));
    }, 100);

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
      revealObs.disconnect();
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

  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const handleWaitlistClick = useCallback((location: string) => {
    trackEvent('landing_waitlist_click', {
      location,
      viewing_section: currentSectionRef.current,
    });
    setWaitlistOpen(true);
  }, []);

  return (
    <>
      <GlobalKeyframes />
      <Nav onCtaClick={() => handleCtaClick('nav')} t={t} locale={locale} setLocale={setLocale} />
      <main>
        <Hero onCtaClick={() => handleCtaClick('hero')} onWaitlistClick={() => handleWaitlistClick('hero')} t={t} />
        <Authority t={t} />
        <WhyNine t={t} />
        {/* <Tools t={t} /> */}
        <Empathy t={t} />
        <Impact onCtaClick={() => handleCtaClick('bottom')} onWaitlistClick={() => handleWaitlistClick('bottom')} t={t} />
      </main>
      <Footer />
      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </>
  );
}
