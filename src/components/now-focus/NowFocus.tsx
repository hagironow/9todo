'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, CirclePause, Pause, Check, SkipForward, Settings, Sun, Moon, StickyNote, Timer, ArrowUp, X } from 'lucide-react';
import { ScheduledItem, Project, Note } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import RepeatCountIcon from '@/components/ui/RepeatCountIcon';
import { useLocale } from '@/i18n/context';

interface NowFocusProps {
  items: (ScheduledItem | null)[];
  projects: Project[];
  onComplete: (item: ScheduledItem, timerSeconds?: number) => void;
  onDefer: (item: ScheduledItem) => void;
  onRepeat: (item: ScheduledItem) => void;
  isReadOnly?: boolean;
  notes?: Note[];
  onAddNote?: (projectId: string, content: string) => void;
  onRemoveNote?: (noteId: string) => void;
  onUpdateNote?: (noteId: string, content: string) => void;
  lastUsedProjectId?: string | null;
  onClose?: () => void;
}

type PanelMode = 'timer' | 'note';

const DURATION_OPTIONS = [15, 20, 25, 30, 45, 50, 60];
const LS_KEY = '9todo_timer_duration';

function getStoredDuration(): number {
  if (typeof window === 'undefined') return 25;
  const v = localStorage.getItem(LS_KEY);
  return v ? parseInt(v, 10) || 25 : 25;
}

function formatTime(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


const TIMER_STATE_KEY = '9todo_timer_state';

interface PersistedTimerState {
  itemId: string;
  startedAt: number;      // Date.now() when play was pressed
  pausedElapsed: number;   // elapsed seconds accumulated before current play
  playing: boolean;
}

function loadTimerState(itemId: string): PersistedTimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_STATE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PersistedTimerState;
    return s.itemId === itemId ? s : null;
  } catch { return null; }
}

function saveTimerState(s: PersistedTimerState | null) {
  if (s) localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(s));
  else localStorage.removeItem(TIMER_STATE_KEY);
}

function useTimer(itemId: string | undefined, durationMin: number) {
  const durationSec = durationMin * 60;
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 복원 시 startedAt과 pausedElapsed를 추적
  const startedAtRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);

  // 마운트 시 또는 itemId 변경 시 localStorage에서 복원
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!itemId) { setPlaying(false); setElapsed(0); return; }

    const saved = loadTimerState(itemId);
    if (saved) {
      if (saved.playing) {
        // 재생 중이었으면 경과 시간 계산해서 복원
        const now = Date.now();
        const liveElapsed = saved.pausedElapsed + Math.floor((now - saved.startedAt) / 1000);
        pausedElapsedRef.current = saved.pausedElapsed;
        startedAtRef.current = saved.startedAt;
        setElapsed(liveElapsed);
        setPlaying(true);
      } else {
        pausedElapsedRef.current = saved.pausedElapsed;
        startedAtRef.current = 0;
        setElapsed(saved.pausedElapsed);
        setPlaying(false);
      }
    } else {
      pausedElapsedRef.current = 0;
      startedAtRef.current = 0;
      setPlaying(false);
      setElapsed(0);
    }
  }, [itemId]);

  // interval로 매초 elapsed 갱신
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current > 0) {
          const now = Date.now();
          setElapsed(pausedElapsedRef.current + Math.floor((now - startedAtRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const play = useCallback(() => {
    const now = Date.now();
    startedAtRef.current = now;
    setPlaying(true);
    if (itemId) saveTimerState({ itemId, startedAt: now, pausedElapsed: pausedElapsedRef.current, playing: true });
  }, [itemId]);

  const pause = useCallback(() => {
    if (startedAtRef.current > 0) {
      const now = Date.now();
      pausedElapsedRef.current += Math.floor((now - startedAtRef.current) / 1000);
    }
    startedAtRef.current = 0;
    setPlaying(false);
    if (itemId) saveTimerState({ itemId, startedAt: 0, pausedElapsed: pausedElapsedRef.current, playing: false });
  }, [itemId]);

  const reset = useCallback(() => {
    setPlaying(false);
    setElapsed(0);
    pausedElapsedRef.current = 0;
    startedAtRef.current = 0;
    saveTimerState(null);
  }, []);

  const cycle = Math.floor(elapsed / durationSec);
  const cycleElapsed = elapsed % durationSec;
  const remaining = durationSec - cycleElapsed;

  return { playing, elapsed, cycle, cycleElapsed, remaining, setElapsed, play, pause, reset };
}

type ConfirmType = 'defer' | 'continue';

function ConfirmModal({ type, onConfirm, onCancel }: { type: ConfirmType; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLocale();
  const isDefer = type === 'defer';
  return (
    <Dialog open onClose={onCancel} title={isDefer ? t.deferDialogTitle : t.continueDialogTitle} width="sm">
      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
        {isDefer ? t.deferDialogDesc : t.continueDialogDesc}
      </p>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
        <button onClick={onConfirm} className={['flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-opacity hover:opacity-85', isDefer ? 'bg-[var(--g-error)] text-white' : 'bg-blue-500 text-white'].join(' ')}>
          {isDefer ? t.defer : t.redo}
        </button>
      </div>
    </Dialog>
  );
}

function DurationSettingModal({ current, onSelect, onClose }: { current: number; onSelect: (min: number) => void; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onClose={onClose} title={t.timerSetting} width="sm">
      <div className="grid grid-cols-4 gap-2">
        {DURATION_OPTIONS.map((min) => (
          <button key={min} onClick={() => onSelect(min)}
            className={['px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors', min === current ? 'bg-[var(--accent)] text-white' : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'].join(' ')}>
            {t.minutes(min)}
          </button>
        ))}
      </div>
    </Dialog>
  );
}

// ── 아날로그 뽀모도로 시계 ──
function AnalogTimer({
  remaining,
  playing,
  accentColor,
  onToggle,
  enabled,
}: {
  remaining: number;
  playing: boolean;
  accentColor: string;
  onToggle: () => void;
  enabled: boolean;
}) {
  const vb = 300;
  const cx = vb / 2;
  const cy = vb / 2;

  const numR = 134;
  const tickOut = 120;
  const majorTickLen = 18;
  const minorTickLen = 10;
  const pieR = 118;

  const remainingMin = Math.round(remaining) / 60;
  const remainingAngle = (remainingMin / 60) * 360;

  const startRad = -Math.PI / 2;
  const endRad = startRad + (remainingAngle * Math.PI) / 180;

  const sX = cx + pieR * Math.cos(startRad);
  const sY = cy + pieR * Math.sin(startRad);
  const eX = cx + pieR * Math.cos(endRad);
  const eY = cy + pieR * Math.sin(endRad);
  const large = remainingAngle > 180 ? 1 : 0;

  const isFull = remainingAngle >= 359.9;
  const slicePath = !isFull && remainingAngle > 0.3
    ? `M ${cx} ${cy} L ${sX} ${sY} A ${pieR} ${pieR} 0 ${large} 1 ${eX} ${eY} Z`
    : '';

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = ((i * 6) - 90) * (Math.PI / 180);
    const isMajor = i % 5 === 0;
    const len = isMajor ? majorTickLen : minorTickLen;
    return {
      x1: cx + tickOut * Math.cos(angle), y1: cy + tickOut * Math.sin(angle),
      x2: cx + (tickOut - len) * Math.cos(angle), y2: cy + (tickOut - len) * Math.sin(angle),
      isMajor,
    };
  });

  const numbers = Array.from({ length: 12 }, (_, i) => {
    const val = i * 5;
    const angle = ((val * 6) - 90) * (Math.PI / 180);
    return { val, x: cx + numR * Math.cos(angle), y: cy + numR * Math.sin(angle) };
  });

  return (
    <div className="relative w-full max-w-[320px] select-none mx-auto cursor-pointer"
      onClick={enabled ? onToggle : undefined}>
      <svg width="100%" viewBox={`0 0 ${vb} ${vb}`} className="block">
        {/* 파이 — 플랫 */}
        {isFull ? (
          <circle cx={cx} cy={cy} r={pieR} fill={accentColor} />
        ) : slicePath ? (
          <path d={slicePath} fill={accentColor} />
        ) : null}

        {/* 눈금 */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            strokeWidth={t.isMajor ? 2 : 1} strokeLinecap="butt" style={{ stroke: accentColor }} />
        ))}

        {/* 숫자 */}
        {numbers.map((n) => (
          <text key={n.val} x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
            style={{ fill: accentColor, fontSize: '15px', fontWeight: 600, fontFamily: "'Poppins', var(--font-heading), sans-serif" }}
          >{n.val}</text>
        ))}
      </svg>

      {/* 호버 재생/정지 — frosted glass */}
      {enabled && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            {playing
              ? <Pause size={24} fill="white" style={{ color: 'white' }} />
              : <Play size={24} fill="white" style={{ color: 'white', marginLeft: 2 }} />
            }
          </div>
        </div>
      )}
    </div>
  );
}

// RepeatCountIcon — shared from @/components/ui/RepeatCountIcon

function ExpandButton({ icon, label, badge, badgeColor, onClick, disabled }: {
  icon: React.ReactNode; label: string; badge?: number; badgeColor?: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="relative group/btn h-11 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-40 w-11 hover:w-auto hover:px-4 hover:gap-2 overflow-hidden"
      style={{ backgroundColor: 'var(--timer-btn)', color: 'var(--timer-btn-fg)' }}>
      <span className="flex-shrink-0 flex items-center">{icon}</span>
      <span className="text-sm font-semibold whitespace-nowrap max-w-0 group-hover/btn:max-w-[80px] overflow-hidden transition-all duration-200 opacity-0 group-hover/btn:opacity-100" style={{ color: 'var(--timer-fg)' }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none px-0.5"
          style={{ backgroundColor: badgeColor ?? 'var(--g-error)' }}>{badge}</span>
      )}
    </button>
  );
}

function SecondaryBar({ item, project, durationMin, onComplete, onDefer, onRepeat, isReadOnly }: {
  item: ScheduledItem; project: Project | null; durationMin: number;
  onComplete: (item: ScheduledItem, timerSeconds?: number) => void; onDefer: (item: ScheduledItem) => void; onRepeat: (item: ScheduledItem) => void; isReadOnly?: boolean;
}) {
  const { playing, elapsed, play, pause, reset } = useTimer(item.id, durationMin);
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);
  const title = 'title' in item ? item.title : '';
  const deferCount = 'deferCount' in item ? (item.deferCount ?? 0) : 0;
  const continueCount = 'continueCount' in item ? (item.continueCount ?? 0) : 0;
  const accentColor = project?.color ?? 'var(--accent)';

  return (
    <>
      <div className="flex flex-col gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--timer-muted-bg)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
          <p className="flex-1 min-w-0 text-sm font-semibold leading-tight truncate" style={{ color: 'var(--timer-fg)' }}>{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={playing ? pause : play}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
            style={{ backgroundColor: 'var(--timer-muted-bg)', color: 'var(--timer-fg)' }}>
            {playing ? <CirclePause size={13} /> : <Play size={13} fill="currentColor" />}
          </button>
          <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--timer-muted)', fontFamily: "'Poppins', sans-serif" }}>{formatTime(elapsed)}</span>
          <div className="flex-1" />
          <button onClick={() => setConfirm('defer')} disabled={isReadOnly}
            className="relative w-7 h-7 flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'var(--timer-btn)', color: 'var(--timer-btn-fg)' }}>
            <SkipForward size={12} />
            {deferCount > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[var(--g-error)] text-white text-[8px] font-bold leading-none px-0.5">{deferCount}</span>}
          </button>
          <button onClick={() => { const t = elapsed; reset(); onComplete(item, t > 0 ? t : undefined); }} disabled={isReadOnly}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ backgroundColor: accentColor }}>
            <Check size={13} strokeWidth={2.5} />
          </button>
          <button onClick={() => setConfirm('continue')} disabled={isReadOnly}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'var(--timer-btn)', color: 'var(--timer-btn-fg)' }}>
            <RepeatCountIcon count={continueCount} size={14} />
          </button>
        </div>
      </div>
      {confirm && <ConfirmModal type={confirm} onConfirm={() => { if (confirm === 'defer') { reset(); onDefer(item); } else { reset(); onRepeat(item); } setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </>
  );
}

// ── 퀵 노트 패널 ──
function QuickNotePanel({
  projects,
  notes,
  onAdd,
  onRemove,
  onUpdate,
  lastUsedProjectId,
  timerDark,
}: {
  projects: Project[];
  notes: Note[];
  onAdd: (projectId: string, content: string) => void;
  onRemove: (noteId: string) => void;
  onUpdate: (noteId: string, content: string) => void;
  lastUsedProjectId?: string | null;
  timerDark: boolean;
}) {
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState(lastUsedProjectId || '__unassigned__');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const activeProjects = projects.filter((p) => !p.archived);

  const { t } = useLocale();
  const recentNotes = [...notes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onAdd(projectId, trimmed);
    setContent('');
  };

  const getProject = (pid: string) => projects.find((p) => p.id === pid);
  const selectedProject = getProject(projectId);
  const canSubmit = !!content.trim();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 노트 목록 — 라인 구분, 스크롤 */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 min-h-0">
        {recentNotes.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--timer-muted)' }}>
            {t.noNotesYet}
          </p>
        ) : (
          <div className="flex flex-col">
            {recentNotes.map((note, i) => {
              const proj = getProject(note.projectId);
              const projName = proj?.name ?? '';
              const projColor = proj?.color ?? 'var(--timer-muted)';
              const dateStr = new Date(note.createdAt).toLocaleDateString('ko-KR', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={note.id} className="group/note">
                  {i > 0 && (
                    <div className="h-px" style={{ backgroundColor: 'var(--timer-divider)' }} />
                  )}
                  <div className="py-3 flex flex-col gap-1.5">
                    {/* 헤더: 프로젝트 + 날짜 + 삭제 */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: projColor }}
                      />
                      <span className="text-[11px] font-semibold" style={{ color: projColor }}>
                        {projName}
                      </span>
                      <span className="flex-1" />
                      <span className="text-[10px]" style={{ color: 'var(--timer-muted)' }}>
                        {dateStr}
                      </span>
                      <button
                        onClick={() => setDeleteTargetId(note.id)}
                        className="text-xs ml-1"
                        style={{ color: 'var(--timer-muted)' }}
                      >
                        ×
                      </button>
                    </div>
                    {/* 본문 — 클릭 시 펼침/접힘 (드래그 선택 중에는 무시) */}
                    <p
                      onClick={() => {
                        const sel = window.getSelection();
                        if (sel && sel.toString().length > 0) return;
                        setExpandedId(expandedId === note.id ? null : note.id);
                      }}
                      className="text-[14px] leading-relaxed whitespace-pre-wrap break-words cursor-pointer"
                      style={{
                        color: 'var(--timer-fg)',
                        ...(expandedId !== note.id ? {
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        } : {}),
                      }}
                    >
                      {note.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 인풋 — 바텀 고정 */}
      <div className="px-5 pt-2 pb-4 flex-shrink-0 sticky bottom-0" style={{ backgroundColor: 'var(--timer-bg)' }}>
        <div
          className="flex flex-col gap-2 rounded-2xl px-3 py-2.5 transition-colors"
          style={{
            backgroundColor: 'var(--timer-input-bg)',
            border: '1px solid var(--timer-input-border)',
          }}
        >
          <textarea
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 160) + 'px';
              }
            }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t.noteInputPlaceholder}
            rows={1}
            className="w-full bg-transparent text-[14px] outline-none resize-none"
            style={{ color: 'var(--timer-fg)', maxHeight: '160px', overflowY: content.split('\n').length > 5 ? 'auto' : 'hidden' }}
          />
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedProject?.color ?? '#8A8A8A' }}
            />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none bg-transparent text-[12px] outline-none cursor-pointer min-w-0"
              style={{ color: 'var(--timer-muted)', fontSize: '14px' }}
            >
              <option value="__unassigned__">{t.uncategorized}</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="flex-1" />
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-opacity disabled:opacity-20"
              style={{
                backgroundColor: 'var(--timer-submit-bg)',
                color: 'var(--timer-submit-fg)',
              }}
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <Dialog open onClose={() => setDeleteTargetId(null)} title={t.deleteNoteConfirm} width="sm">
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            {t.deleteNoteWarning}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">{t.cancel}</button>
            <button onClick={() => { onRemove(deleteTargetId); setDeleteTargetId(null); }} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--g-error)] text-white transition-opacity hover:opacity-85">{t.delete}</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ── Main ──
export default function NowFocus({ items, projects, onComplete, onDefer, onRepeat, isReadOnly, notes, onAddNote, onRemoveNote, onUpdateNote, lastUsedProjectId, onClose }: NowFocusProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<PanelMode>('timer');
  const [confirm, setConfirm] = useState<ConfirmType | null>(null);
  const [durationMin, setDurationMin] = useState(25);
  const [settingOpen, setSettingOpen] = useState(false);
  const [timerDark, setTimerDark] = useState(false);

  useEffect(() => { setDurationMin(getStoredDuration()); }, []);

  const handleDurationChange = (min: number) => {
    setDurationMin(min);
    localStorage.setItem(LS_KEY, String(min));
    setSettingOpen(false);
  };

  const primary = items[0];
  const secondary = items[1];
  const tertiary = items[2];
  const primaryTimer = useTimer(primary?.id, durationMin);

  const getProject = (item: ScheduledItem): Project | null => {
    const pid = 'projectId' in item ? item.projectId : null;
    return pid ? projects.find((p) => p.id === pid) ?? null : null;
  };

  const primaryProject = primary ? getProject(primary) : null;
  const primaryTitle = primary && 'title' in primary ? primary.title : '';
  const accentColor = primaryProject?.color ?? 'var(--accent)';
  const deferCount = primary && 'deferCount' in primary ? (primary.deferCount ?? 0) : 0;
  const continueCount = primary && 'continueCount' in primary ? (primary.continueCount ?? 0) : 0;
  const remainingStr = formatTime(primary ? primaryTimer.remaining : durationMin * 60);

  return (
    <>
      <div
        className={`flex flex-col group rounded-none lg:rounded-[40px] overflow-hidden transition-colors duration-200 min-h-full lg:min-h-0 ${timerDark ? 'timer-dark' : 'timer-light'}`}
        style={{ backgroundColor: 'var(--timer-bg)' }}
      >
        {/* 상단 탭 바 */}
        <div className="flex items-center px-5 pt-2 pb-1 gap-1 flex-shrink-0" style={{ backgroundColor: 'var(--timer-bg)' }}>
          <div className="flex-1 flex items-center gap-1 rounded-full p-0.5" style={{ backgroundColor: 'var(--timer-muted-bg)' }}>
            <button
              onClick={() => setMode('timer')}
              className="flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: mode === 'timer' ? 'var(--timer-tab-active-bg)' : 'transparent',
                color: mode === 'timer' ? 'var(--timer-fg)' : 'var(--timer-muted)',
                boxShadow: mode === 'timer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Timer size={12} />{t.timer}
            </button>
            <button
              onClick={() => setMode('note')}
              className="flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: mode === 'note' ? 'var(--timer-tab-active-bg)' : 'transparent',
                color: mode === 'note' ? 'var(--timer-fg)' : 'var(--timer-muted)',
                boxShadow: mode === 'note' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <StickyNote size={12} />{t.notes}
            </button>
          </div>
          <button
            onClick={() => setTimerDark((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:opacity-80 shrink-0"
            style={{ color: 'var(--timer-muted)', backgroundColor: 'var(--timer-muted-bg)' }}
            title={timerDark ? t.lightMode : t.darkMode}
          >
            {timerDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:opacity-80 shrink-0"
              style={{ color: 'var(--timer-muted)', backgroundColor: 'var(--timer-muted-bg)' }}
              title={t.close}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 컨텐츠: 타이머가 높이를 결정하고, 노트는 같은 높이를 공유 */}
        <div className="relative flex-1 min-h-0">
          {/* 타이머 — PC: visibility로 높이 유지 / 모바일: hidden으로 완전 숨김 */}
          <div
            className={mode === 'timer' ? '' : 'max-lg:hidden'}
            style={mode !== 'timer' ? { visibility: 'hidden' } : undefined}
            aria-hidden={mode !== 'timer'}
          >
            {/* 타이머 영역 */}
            <div className="flex flex-col items-center justify-center px-6 py-5 gap-2">
              {/* 타이틀 — 중앙 정렬 */}
              <div className="w-full text-center mb-2">
                {primary ? (
                  <>
                    <p className="text-base font-semibold truncate px-4" style={{ color: 'var(--timer-fg)' }}>{primaryTitle}</p>
                    {primaryProject && (
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                        <span className="text-[11px]" style={{ color: 'var(--timer-muted)' }}>{primaryProject.name}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--timer-muted)' }}>{t.placeIn1st}</p>
                )}
              </div>

              <AnalogTimer
                remaining={primary ? primaryTimer.remaining : durationMin * 60}
                playing={primaryTimer.playing}
                accentColor={primary ? accentColor : 'var(--timer-muted)'}
                onToggle={primary ? (primaryTimer.playing ? primaryTimer.pause : primaryTimer.play) : () => {}}
                enabled={!!primary}
              />

              {/* 남은 시간 + 설정 */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold tabular-nums tracking-tight" style={{ color: accentColor, fontFamily: "'Poppins', sans-serif" }}>
                  {remainingStr}
                </span>
                <button onClick={() => setSettingOpen(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
                  style={{ color: 'var(--timer-muted)', backgroundColor: 'var(--timer-muted-bg)' }}
                  title={t.timerSettings}>
                  <Settings size={20} />
                </button>
              </div>

              {/* 사이클 */}
              {primaryTimer.cycle > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {Array.from({ length: Math.min(primaryTimer.cycle, 8) }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                  ))}
                  {primaryTimer.cycle > 8 && (
                    <span className="text-[10px] ml-0.5" style={{ color: 'var(--timer-muted)' }}>+{primaryTimer.cycle - 8}</span>
                  )}
                  <span className="text-[11px] ml-1" style={{ color: 'var(--timer-muted)', fontFamily: "'Poppins', sans-serif" }}>{t.cycleCount(primaryTimer.cycle)}</span>
                </div>
              )}

              {/* 액션 바 */}
              {primary ? (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <ExpandButton icon={<SkipForward size={18} />} label={t.defer} badge={deferCount} badgeColor="var(--g-error)" onClick={() => setConfirm('defer')} disabled={isReadOnly} />
                  <button
                    onClick={() => { const t = primaryTimer.elapsed; primaryTimer.reset(); onComplete(primary, t > 0 ? t : undefined); }}
                    disabled={isReadOnly}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: accentColor }}>
                    <Check size={16} strokeWidth={2.5} />{t.complete}
                  </button>
                  <ExpandButton icon={<RepeatCountIcon count={continueCount} size={18} />} label={t.redo} onClick={() => setConfirm('continue')} disabled={isReadOnly} />
                </div>
              ) : (
                <div className="mt-4">
                  <span className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm"
                    style={{ backgroundColor: 'var(--timer-muted-bg)', color: 'var(--timer-muted)' }}>
                    <Play size={13} fill="currentColor" />{t.waiting}
                  </span>
                </div>
              )}
            </div>

            {secondary && <SecondaryBar item={secondary} project={getProject(secondary)} durationMin={durationMin} onComplete={onComplete} onDefer={onDefer} onRepeat={onRepeat} isReadOnly={isReadOnly} />}
            {tertiary && <SecondaryBar item={tertiary} project={getProject(tertiary)} durationMin={durationMin} onComplete={onComplete} onDefer={onDefer} onRepeat={onRepeat} isReadOnly={isReadOnly} />}
          </div>

          {/* 노트 — 데스크탑: 오버레이 / 모바일: 뷰포트 채움 */}
          {mode === 'note' && onAddNote && onRemoveNote && (
            <div className="lg:absolute lg:inset-0 flex flex-col lg:min-h-[400px] min-h-[calc(100dvh-44px)] lg:min-h-[400px]" style={{ backgroundColor: 'var(--timer-bg)' }}>
              <QuickNotePanel
                projects={projects}
                notes={notes ?? []}
                onAdd={onAddNote}
                onRemove={onRemoveNote}
                onUpdate={onUpdateNote ?? (() => {})}
                lastUsedProjectId={lastUsedProjectId}
                timerDark={timerDark}
              />
            </div>
          )}
        </div>
      </div>

      {confirm && primary && <ConfirmModal type={confirm}
        onConfirm={() => { if (confirm === 'defer') { primaryTimer.reset(); onDefer(primary); } else { primaryTimer.reset(); onRepeat(primary); } setConfirm(null); }}
        onCancel={() => setConfirm(null)} />}
      {settingOpen && <DurationSettingModal current={durationMin} onSelect={handleDurationChange} onClose={() => setSettingOpen(false)} />}
    </>
  );
}
