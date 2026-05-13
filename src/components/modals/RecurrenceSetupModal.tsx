'use client';

import { useState, useEffect } from 'react';
import { useRef, useEffect as useLayoutEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { RecurrenceType, TimePeriod, Priority, SlotCoord, Task, Project } from '@/lib/types';
import { formatLocalDate } from '@/lib/date';
import { hourToPeriod } from '@/lib/periods';
import Dialog from '@/components/ui/Dialog';
import ColorDot from '@/components/ui/ColorDot';
import InlineDatePicker from '@/components/ui/InlineDatePicker';
import { useLocale } from '@/i18n/context';

export interface RecurrenceSetupData {
  title: string;
  recurrence: RecurrenceType;
  daysOfWeek?: number[];
  defaultSlot: SlotCoord;
  startDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  projectId: string | null;
}

interface RecurrenceSetupModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialCoord?: SlotCoord | null;
  editingTask?: Task | null;
  onSave: (data: RecurrenceSetupData) => void;
  onDelete?: () => void;
  projects?: Project[];
  colorTheme?: string;
  initialProjectId?: string | null;
  onCreateProject?: (name: string, colorIndex: number) => Project;
  /** 이미 반복 투두가 차지한 슬롯 목록 (충돌 감지용) */
  occupiedSlots?: SlotCoord[];
}


/* ── 슬롯 → 기본 시간 매핑 ── */
const SLOT_DEFAULT_HOURS: Record<TimePeriod, Record<Priority, number>> = {
  morning:   { 1: 9,  2: 10, 3: 11 },
  afternoon: { 1: 13, 2: 14, 3: 15 },
  evening:   { 1: 18, 2: 19, 3: 20 },
};

/** 시간(HH:mm) → 시간대 매핑 */
export function timeToPeriod(time: string): TimePeriod {
  const h = Number(time.split(':')[0]);
  return hourToPeriod(h);
}

export function getDefaultStartTime(period: TimePeriod, priority: Priority): string {
  const h = SLOT_DEFAULT_HOURS[period][priority];
  return `${String(h).padStart(2, '0')}:00`;
}

export function getDefaultEndTime(period: TimePeriod, priority: Priority): string {
  const h = SLOT_DEFAULT_HOURS[period][priority] + 1;
  return `${String(h).padStart(2, '0')}:00`;
}

/** 시작 시간에 분 단위 duration을 더한 종료 시간 */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.min(Math.floor(total / 60), 23);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** 시작~종료 사이 분 계산 */
function diffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

/* ── 미니멀 스타일 ── */

const PILL = [
  'px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer',
  'transition-colors duration-100',
].join(' ');

const PILL_OFF = [PILL, 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'].join(' ');
const PILL_ON = [PILL, 'bg-[var(--foreground)] text-[var(--background)]'].join(' ');

const DAY_BTN = [
  'w-8 h-8 rounded-full text-[12px] font-medium cursor-pointer',
  'transition-colors duration-100 flex items-center justify-center',
].join(' ');

const ROW = 'flex items-center justify-between py-2.5 border-b border-[var(--border)]/40';
const LABEL = 'text-[13px] text-[var(--muted-foreground)]';

/* ── 시간 셀렉터 ── */
const SEL_CLASS = [
  'text-[12px] text-[var(--foreground)] bg-[var(--muted)] rounded-[var(--radius-sm)]',
  'px-1 py-1 border-none outline-none cursor-pointer appearance-none',
].join(' ');

function TimeInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [h, m] = value ? value.split(':') : ['', ''];

  const setH = (newH: string) => {
    if (newH === '') { onChange(''); return; }
    onChange(`${newH}:${m || '00'}`);
  };
  const setM = (newM: string) => {
    onChange(`${h || '00'}:${newM}`);
  };

  return (
    <div className="flex items-center gap-0.5 bg-[var(--muted)] rounded-[var(--radius-sm)] px-1 py-0.5">
      <select value={h} onChange={(e) => setH(e.target.value)} className={SEL_CLASS + ' w-[38px]'}>
        <option value="">--</option>
        {Array.from({ length: 24 }, (_, i) => {
          const v = String(i).padStart(2, '0');
          return <option key={v} value={v}>{v}</option>;
        })}
      </select>
      <span className="text-[12px] text-[var(--muted-foreground)]">:</span>
      <select value={m} onChange={(e) => setM(e.target.value)} className={SEL_CLASS + ' w-[38px]'} disabled={!h}>
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((i) => {
          const v = String(i).padStart(2, '0');
          return <option key={v} value={v}>{v}</option>;
        })}
      </select>
      {value && (
        <button onClick={() => onChange('')} className="ml-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export default function RecurrenceSetupModal({
  open,
  onClose,
  initialTitle = '',
  initialCoord,
  editingTask,
  onSave,
  onDelete,
  projects = [],
  colorTheme = 'vivid',
  initialProjectId = null,
  onCreateProject,
  occupiedSlots = [],
}: RecurrenceSetupModalProps) {
  const { t } = useLocale();

  const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
    { value: 'daily',    label: t.daily },
    { value: 'weekly',   label: t.weekly },
    { value: 'biweekly', label: t.biweekly },
    { value: 'monthly',  label: t.monthly },
  ];

  const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
    { value: 'morning',   label: t.morning },
    { value: 'afternoon', label: t.afternoon },
    { value: 'evening',   label: t.evening },
  ];

  const DAY_OPTIONS: { value: number; label: string }[] = [
    { value: 1, label: t.weekdayShortMon[0] },
    { value: 2, label: t.weekdayShortMon[1] },
    { value: 3, label: t.weekdayShortMon[2] },
    { value: 4, label: t.weekdayShortMon[3] },
    { value: 5, label: t.weekdayShortMon[4] },
    { value: 6, label: t.weekdayShortMon[5] },
    { value: 0, label: t.weekdayShortMon[6] },
  ];

  const [titleValue, setTitleValue] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('morning');
  const [priority, setPriority] = useState<Priority>(1);
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [startDate, setStartDate] = useState(formatLocalDate(new Date()));
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const projectBtnRef = useRef<HTMLButtonElement>(null);
  const projectDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingTask && editingTask.recurrence) {
      // 기존 반복 태스크 편집
      setTitleValue(editingTask.title);
      setRecurrence(editingTask.recurrence);
      setDaysOfWeek(editingTask.daysOfWeek ?? []);
      setPeriod(editingTask.defaultSlot?.period ?? 'morning');
      setPriority(editingTask.defaultSlot?.priority ?? 1);
      setScheduledStartTime(editingTask.scheduledStartTime ?? '');
      setScheduledEndTime(editingTask.scheduledEndTime ?? '');
      setStartDate(editingTask.startDate ?? formatLocalDate(new Date()));
      setProjectId(editingTask.projectId);
    } else if (editingTask) {
      // 비반복 태스크 → 반복으로 변환
      setTitleValue(editingTask.title);
      setRecurrence('daily');
      setDaysOfWeek([]);
      const p = editingTask.slot?.period ?? initialCoord?.period ?? 'morning';
      const pr = editingTask.slot?.priority ?? initialCoord?.priority ?? 1;
      setPeriod(p);
      setPriority(pr);
      setScheduledStartTime(getDefaultStartTime(p, pr));
      setScheduledEndTime(getDefaultEndTime(p, pr));
      setStartDate(editingTask.date ?? formatLocalDate(new Date()));
      setProjectId(editingTask.projectId);
    } else {
      // 신규 생성
      setTitleValue(initialTitle);
      setRecurrence('daily');
      setDaysOfWeek([]);
      const p = initialCoord?.period ?? 'morning';
      const pr = initialCoord?.priority ?? 1;
      setPeriod(p);
      setPriority(pr);
      setScheduledStartTime(getDefaultStartTime(p, pr));
      setScheduledEndTime(getDefaultEndTime(p, pr));
      setStartDate(formatLocalDate(new Date()));
      setProjectId(initialProjectId);
    }
  }, [open, editingTask, initialCoord, initialProjectId, initialTitle]);

  const isEditing = !!editingTask?.recurrence;
  const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;
  const activeProjects = projects.filter((p) => !p.archived);

  // 프로젝트 드롭다운 외부 클릭 닫기
  useLayoutEffect(() => {
    if (!projectDropdownOpen) return;
    const handle = (e: MouseEvent) => {
      if (projectDropRef.current?.contains(e.target as Node)) return;
      if (projectBtnRef.current?.contains(e.target as Node)) return;
      setProjectDropdownOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [projectDropdownOpen]);
  const showDaysOfWeek = recurrence !== 'monthly';
  // 현재 편집 중인 태스크의 슬롯은 충돌에서 제외
  const slotConflict = occupiedSlots.some(
    (s) => s.period === period && s.priority === priority
  ) && !(editingTask?.defaultSlot?.period === period && editingTask?.defaultSlot?.priority === priority);
  const canSave = titleValue.trim().length > 0 && !slotConflict;

  // 슬롯 변경 시 시간 자동 업데이트
  const handlePeriodChange = (p: TimePeriod) => {
    setPeriod(p);
    setScheduledStartTime(getDefaultStartTime(p, priority));
    setScheduledEndTime(getDefaultEndTime(p, priority));
  };
  const handlePriorityChange = (pr: Priority) => {
    setPriority(pr);
    setScheduledStartTime(getDefaultStartTime(period, pr));
    setScheduledEndTime(getDefaultEndTime(period, pr));
  };

  // duration (분) 계산
  const currentDuration = (scheduledStartTime && scheduledEndTime)
    ? diffMinutes(scheduledStartTime, scheduledEndTime)
    : 60;

  // 종료 시간의 최대값: 시간대별 경계
  const periodEndHour = period === 'morning' ? 12 : period === 'afternoon' ? 18 : 24;
  const startHourNum = scheduledStartTime ? Number(scheduledStartTime.split(':')[0]) : 0;
  const maxDuration = (periodEndHour - startHourNum) * 60;

  // duration 옵션 생성 (30분 단위)
  const durationOptions: { min: number; label: string }[] = [];
  for (let m = 30; m <= Math.max(maxDuration, 30); m += 30) {
    if (m < 60) durationOptions.push({ min: m, label: t.minutes(m) });
    else if (m % 60 === 0) durationOptions.push({ min: m, label: `${m / 60}h` });
    else durationOptions.push({ min: m, label: `${Math.floor(m / 60)}h ${m % 60}m` });
  }

  const handleDuration = (min: number) => {
    if (scheduledStartTime) {
      setScheduledEndTime(addMinutes(scheduledStartTime, min));
    }
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: titleValue.trim(),
      recurrence,
      daysOfWeek: showDaysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : undefined,
      defaultSlot: { period, priority },
      startDate,
      scheduledStartTime: scheduledStartTime || undefined,
      scheduledEndTime: scheduledEndTime || undefined,
      projectId,
    });
  };

  const recurrenceLabel = RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label ?? '';
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? '';

  return (
      <Dialog open={open} onClose={onClose} width="sm">
        <div className="flex flex-col">
          {/* 제목 입력 */}
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]/40">
            <input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              placeholder={t.recurrenceTitlePlaceholder}
              autoFocus={!titleValue}
              className="flex-1 text-[15px] font-medium text-[var(--foreground)] bg-transparent outline-none placeholder:text-[var(--muted-foreground)]"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && canSave) handleSave(); }}
            />
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
              aria-label={t.close}
            >
              <X size={14} />
            </button>
          </div>

          {/* 속성 행들 */}
          <div className="flex flex-col">
            {/* 프로젝트 */}
            {projects.length > 0 && (
              <div className={ROW + ' relative'}>
                <span className={LABEL}>{t.project}</span>
                <button
                  ref={projectBtnRef}
                  onClick={() => setProjectDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                >
                  <ColorDot color={selectedProject?.color ?? '#8A8A8A'} size="sm" />
                  <span>{selectedProject?.name ?? t.uncategorized}</span>
                  <ChevronDown size={12} className={`text-[var(--muted-foreground)] transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {projectDropdownOpen && (
                  <div
                    ref={projectDropRef}
                    className="absolute right-0 top-full mt-1 z-50 w-44 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--popover)] shadow-lg overflow-hidden animate-[status-appear_0.1s_ease_forwards]"
                  >
                    {activeProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setProjectId(p.id); setProjectDropdownOpen(false); }}
                        className={[
                          'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                          projectId === p.id
                            ? 'bg-[var(--muted)] font-semibold text-[var(--foreground)]'
                            : 'text-[var(--foreground)] hover:bg-[var(--muted)]',
                        ].join(' ')}
                      >
                        <ColorDot color={p.color} size="sm" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                    <div className="border-t border-[var(--border)]" />
                    <button
                      onClick={() => { setProjectId(null); setProjectDropdownOpen(false); }}
                      className={[
                        'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                        !projectId
                          ? 'bg-[var(--muted)] font-semibold text-[var(--foreground)]'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]',
                      ].join(' ')}
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]" />
                      <span>{t.uncategorized}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 반복 주기 */}
            <div className={ROW}>
              <span className={LABEL}>{t.period}</span>
              <div className="flex gap-0.5">
                {RECURRENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRecurrence(opt.value)}
                    className={recurrence === opt.value ? PILL_ON : PILL_OFF}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 요일 */}
            {showDaysOfWeek && (
              <div className={ROW}>
                <span className={LABEL}>{t.daysOfWeek}</span>
                <div className="flex gap-0.5">
                  {DAY_OPTIONS.map((opt) => {
                    const active = daysOfWeek.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleDay(opt.value)}
                        className={active
                          ? [DAY_BTN, 'bg-[var(--foreground)] text-[var(--background)]'].join(' ')
                          : [DAY_BTN, 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'].join(' ')
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 슬롯 */}
            <div className="flex flex-col gap-1">
              <div className={ROW + ' border-b-0'}>
                <span className={LABEL}>{t.slot}</span>
                <div className="flex gap-0.5">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handlePeriodChange(opt.value)}
                      className={period === opt.value ? PILL_ON : PILL_OFF}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="w-px h-4 bg-[var(--border)] mx-1 self-center" />
                  {([1, 2, 3] as Priority[]).map((p) => {
                    const taken = occupiedSlots.some(
                      (s) => s.period === period && s.priority === p
                    ) && !(editingTask?.defaultSlot?.period === period && editingTask?.defaultSlot?.priority === p);
                    return (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={[
                          priority === p ? PILL_ON : PILL_OFF,
                          taken ? 'ring-1 ring-[var(--g-error)]/60' : '',
                        ].join(' ')}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              {slotConflict && (
                <p className="text-[11px] text-[var(--g-error)] text-right pr-1">{t.slotInUse}</p>
              )}
            </div>

            {/* 시간 */}
            <div className={ROW}>
              <span className={LABEL}>{t.time}</span>
              <div className="flex items-center gap-1.5">
                <TimeInput value={scheduledStartTime} onChange={setScheduledStartTime} placeholder={t.start} />
                <span className="text-[11px] text-[var(--muted-foreground)]">~</span>
                <TimeInput value={scheduledEndTime} onChange={setScheduledEndTime} placeholder={t.end} />
              </div>
            </div>

            {/* 시작일 */}
            <div className={ROW + ' border-b-0'}>
              <span className={LABEL}>{t.startDate}</span>
              <InlineDatePicker value={startDate} onChange={setStartDate} />
            </div>
          </div>

          {/* 하단 액션 */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-[var(--border)]/40">
            {isEditing && onDelete ? (
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="text-[12px] font-medium text-[var(--g-error)] hover:opacity-70 transition-opacity cursor-pointer"
              >
                {t.unrecur}
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={[
                  'px-4 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-semibold transition-colors cursor-pointer',
                  canSave
                    ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-85'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed',
                ].join(' ')}
              >
                {isEditing ? t.save : t.create}
              </button>
            </div>
          </div>
        </div>
      </Dialog>
  );
}
