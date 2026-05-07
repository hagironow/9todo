'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, CirclePause, Pause, Check, SkipForward, Settings, Sun, Moon, StickyNote, Timer, ArrowUp } from 'lucide-react';
import { ScheduledItem, Project, Note } from '@/lib/types';
import Dialog from '@/components/ui/Dialog';
import RepeatCountIcon from '@/components/ui/RepeatCountIcon';

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


function useTimer(itemId: string | undefined, durationMin: number) {
  const durationSec = durationMin * 60;
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [itemId]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const reset = useCallback(() => { setPlaying(false); setElapsed(0); }, []);

  const cycle = Math.floor(elapsed / durationSec);
  const cycleElapsed = elapsed % durationSec;
  const remaining = durationSec - cycleElapsed;

  return { playing, elapsed, cycle, cycleElapsed, remaining, setElapsed, play, pause, reset };
}

type ConfirmType = 'defer' | 'continue';

function ConfirmModal({ type, onConfirm, onCancel }: { type: ConfirmType; onConfirm: () => void; onCancel: () => void }) {
  const isDefer = type === 'defer';
  return (
    <Dialog open onClose={onCancel} title={isDefer ? '이 태스크를 미루시겠어요?' : '아직 완료되지 않았나요?'} width="sm">
      <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
        {isDefer ? '백로그에 미룬 일과 미룬 횟수가 저장돼요.' : '백로그에 진행할 일과 진행 횟수가 저장돼요.'}
      </p>
      <div className="flex items-center gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">취소</button>
        <button onClick={onConfirm} className={['flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-opacity hover:opacity-85', isDefer ? 'bg-[var(--g-error)] text-white' : 'bg-blue-500 text-white'].join(' ')}>
          {isDefer ? '미루기' : '또하기'}
        </button>
      </div>
    </Dialog>
  );
}

function DurationSettingModal({ current, onSelect, onClose }: { current: number; onSelect: (min: number) => void; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} title="타이머 시간 설정" width="sm">
      <div className="grid grid-cols-4 gap-2">
        {DURATION_OPTIONS.map((min) => (
          <button key={min} onClick={() => onSelect(min)}
            className={['px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-colors', min === current ? 'bg-[var(--accent)] text-white' : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-hover)]'].join(' ')}>
            {min}분
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

  const slicePath = remainingAngle > 0.3
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
        {slicePath && (
          <path d={slicePath} fill={accentColor} />
        )}

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

      {/* 호버 재생/정지 */}
      {enabled && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {playing
            ? <CirclePause size={40} style={{ color: 'var(--timer-fg)' }} />
            : <Play size={40} fill="currentColor" style={{ color: 'var(--timer-fg)' }} />
          }
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
  const [projectId, setProjectId] = useState(lastUsedProjectId ?? '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const activeProjects = projects.filter((p) => !p.archived);

  const recentNotes = [...notes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || !projectId) return;
    onAdd(projectId, trimmed);
    setContent('');
  };

  const getProject = (pid: string) => projects.find((p) => p.id === pid);
  const selectedProject = getProject(projectId);
  const canSubmit = content.trim() && projectId;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 노트 목록 — 라인 구분, 스크롤 */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 min-h-0">
        {recentNotes.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: 'var(--timer-muted)' }}>
            아직 노트가 없습니다
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
                    <div className="h-px" style={{ backgroundColor: timerDark ? '#1e1e1e' : '#f0f0f0' }} />
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
                        className="text-xs ml-1 opacity-0 group-hover/note:opacity-100 transition-opacity"
                        style={{ color: 'var(--timer-muted)' }}
                      >
                        ×
                      </button>
                    </div>
                    {/* 본문 — 클릭 시 인라인 편집 */}
                    {editingId === note.id ? (
                      <textarea
                        autoFocus
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={() => {
                          const trimmed = editContent.trim();
                          if (trimmed && trimmed !== note.content) onUpdate(note.id, trimmed);
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            const trimmed = editContent.trim();
                            if (trimmed && trimmed !== note.content) onUpdate(note.id, trimmed);
                            setEditingId(null);
                          }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="text-sm leading-relaxed w-full bg-transparent outline-none resize-none"
                        style={{ color: 'var(--timer-fg)', minHeight: '2.5em' }}
                        rows={3}
                      />
                    ) : (
                      <p
                        onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                        className="text-sm leading-relaxed whitespace-pre-wrap break-words cursor-text"
                        style={{
                          color: 'var(--timer-fg)',
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {note.content}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 인풋 — 메시지 전송 스타일 */}
      <div className="px-5 pt-2 pb-4">
        <div
          className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors"
          style={{
            backgroundColor: timerDark ? '#1a1a1a' : '#f5f5f5',
            border: `1px solid ${timerDark ? '#2a2a2a' : '#e8e8e8'}`,
          }}
        >
          <div className="relative shrink-0">
            <span
              className="block w-3 h-3 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ backgroundColor: selectedProject?.color ?? (timerDark ? '#444' : '#ccc') }}
            />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none bg-transparent text-xs pl-6 pr-1 py-1 outline-none cursor-pointer"
              style={{ color: 'var(--timer-muted)', width: '24px' }}
            >
              <option value=""></option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSubmit();
            }}
            placeholder="메모를 남겨보세요..."
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
            style={{ color: 'var(--timer-fg)' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-opacity disabled:opacity-20"
            style={{
              backgroundColor: timerDark ? '#fff' : '#1a1a1a',
              color: timerDark ? '#1a1a1a' : '#fff',
            }}
          >
            <ArrowUp size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteTargetId && (
        <Dialog open onClose={() => setDeleteTargetId(null)} title="노트를 삭제할까요?" width="sm">
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            삭제한 노트는 복구할 수 없습니다.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => setDeleteTargetId(null)} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors">취소</button>
            <button onClick={() => { onRemove(deleteTargetId); setDeleteTargetId(null); }} className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--g-error)] text-white transition-opacity hover:opacity-85">삭제</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ── Main ──
export default function NowFocus({ items, projects, onComplete, onDefer, onRepeat, isReadOnly, notes, onAddNote, onRemoveNote, onUpdateNote, lastUsedProjectId }: NowFocusProps) {
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
        className="flex flex-col group rounded-[40px] lg:rounded-[40px] max-lg:rounded-none overflow-hidden transition-colors duration-200 max-lg:min-h-full"
        style={{
          ...(timerDark
            ? { '--timer-bg': '#111111', '--timer-fg': '#e0e0e0', '--timer-muted': '#888', '--timer-muted-bg': '#1a1a1a', '--timer-hover': '#1f1f1f', '--timer-btn': '#2a2a2a', '--timer-btn-fg': '#aaa' }
            : { '--timer-bg': '#ffffff', '--timer-fg': '#1a1a1a', '--timer-muted': '#8a8a8a', '--timer-muted-bg': '#f0f0f0', '--timer-hover': '#e8e8e8', '--timer-btn': '#e8e8e8', '--timer-btn-fg': '#888' }
          ) as React.CSSProperties,
          backgroundColor: timerDark ? '#111111' : '#ffffff',
        }}
      >
        {/* 상단 탭 바 */}
        <div className="flex items-center px-5 pt-4 pb-1 gap-1">
          <div className="flex-1 flex items-center gap-1 rounded-full p-0.5" style={{ backgroundColor: 'var(--timer-muted-bg)' }}>
            <button
              onClick={() => setMode('timer')}
              className="flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: mode === 'timer' ? (timerDark ? '#333' : '#fff') : 'transparent',
                color: mode === 'timer' ? 'var(--timer-fg)' : 'var(--timer-muted)',
                boxShadow: mode === 'timer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Timer size={12} />타이머
            </button>
            <button
              onClick={() => setMode('note')}
              className="flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: mode === 'note' ? (timerDark ? '#333' : '#fff') : 'transparent',
                color: mode === 'note' ? 'var(--timer-fg)' : 'var(--timer-muted)',
                boxShadow: mode === 'note' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <StickyNote size={12} />노트
            </button>
          </div>
          <button
            onClick={() => setTimerDark((v) => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:opacity-80 shrink-0"
            style={{ color: 'var(--timer-muted)', backgroundColor: 'var(--timer-muted-bg)' }}
            title={timerDark ? '라이트 모드' : '다크 모드'}
          >
            {timerDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* 컨텐츠: 타이머가 높이를 결정하고, 노트는 같은 높이를 공유 */}
        <div className="relative flex-1 min-h-0">
          {/* 타이머 — 항상 렌더링하여 높이 결정 (노트 모드일 때는 숨김) */}
          <div className={mode === 'timer' ? '' : 'hidden'} aria-hidden={mode !== 'timer'}>
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
                  <p className="text-sm" style={{ color: 'var(--timer-muted)' }}>1순위 슬롯에 배치하세요</p>
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
                  title="타이머 설정">
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
                  <span className="text-[11px] ml-1" style={{ color: 'var(--timer-muted)', fontFamily: "'Poppins', sans-serif" }}>{primaryTimer.cycle}사이클</span>
                </div>
              )}

              {/* 액션 바 */}
              {primary ? (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <ExpandButton icon={<SkipForward size={18} />} label="미루기" badge={deferCount} badgeColor="var(--g-error)" onClick={() => setConfirm('defer')} disabled={isReadOnly} />
                  <button
                    onClick={() => { const t = primaryTimer.elapsed; primaryTimer.reset(); onComplete(primary, t > 0 ? t : undefined); }}
                    disabled={isReadOnly}
                    className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: accentColor }}>
                    <Check size={16} strokeWidth={2.5} />완료
                  </button>
                  <ExpandButton icon={<RepeatCountIcon count={continueCount} size={18} />} label="또하기" onClick={() => setConfirm('continue')} disabled={isReadOnly} />
                </div>
              ) : (
                <div className="mt-4">
                  <span className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm"
                    style={{ backgroundColor: 'var(--timer-muted-bg)', color: 'var(--timer-muted)' }}>
                    <Play size={13} fill="currentColor" />대기 중
                  </span>
                </div>
              )}
            </div>

            {secondary && <SecondaryBar item={secondary} project={getProject(secondary)} durationMin={durationMin} onComplete={onComplete} onDefer={onDefer} onRepeat={onRepeat} isReadOnly={isReadOnly} />}
            {tertiary && <SecondaryBar item={tertiary} project={getProject(tertiary)} durationMin={durationMin} onComplete={onComplete} onDefer={onDefer} onRepeat={onRepeat} isReadOnly={isReadOnly} />}
          </div>

          {/* 노트 — 데스크탑: 오버레이 / 모바일: 자연 플로우 */}
          {mode === 'note' && onAddNote && onRemoveNote && (
            <div className="lg:absolute lg:inset-0 flex flex-col min-h-[400px]" style={{ backgroundColor: timerDark ? '#111111' : '#ffffff' }}>
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
