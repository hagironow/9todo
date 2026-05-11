'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RecurrenceType, TimePeriod, Priority, SlotCoord, Routine, Project } from '@/lib/types';
import { formatLocalDate } from '@/lib/date';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import ColorDot from '@/components/ui/ColorDot';
import InlineDatePicker from '@/components/ui/InlineDatePicker';
import ProjectSelectModal from './ProjectSelectModal';

export interface RoutineSetupData {
  recurrence: RecurrenceType;
  daysOfWeek?: number[];
  defaultSlot: SlotCoord;
  startDate: string;
  scheduledTime?: string;
  projectId: string | null;
}

interface RoutineSetupModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialCoord?: SlotCoord | null;
  editingRoutine?: Routine | null;
  occupiedSlots?: Record<TimePeriod, Record<Priority, boolean>>;
  onSave: (data: RoutineSetupData) => void;
  onDelete?: () => void;
  projects?: Project[];
  colorTheme?: string;
  initialProjectId?: string | null;
  onCreateProject?: (name: string, colorIndex: number) => Project;
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'daily',    label: '매일' },
  { value: 'weekly',   label: '매주' },
  { value: 'biweekly', label: '2주마다' },
  { value: 'monthly',  label: '매월' },
];

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'morning',   label: '오전' },
  { value: 'afternoon', label: '오후' },
  { value: 'evening',   label: '저녁' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 1, label: '1순위' },
  { value: 2, label: '2순위' },
  { value: 3, label: '3순위' },
];

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];

/* ── 공통 스타일 ── */

const CHIP_BASE = [
  'py-2.5 rounded-[var(--radius)] text-[var(--fs-item)] font-medium',
  'transition-all duration-150 cursor-pointer',
].join(' ');

const CHIP_DEFAULT = [
  CHIP_BASE,
  'px-4 bg-[var(--surface-btn)] text-[var(--foreground)]',
  'hover:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
].join(' ');

const CHIP_ACTIVE = [
  CHIP_BASE,
  'px-4 bg-[var(--surface-btn)] text-[var(--foreground)]',
  'shadow-[inset_0_0_0_1.5px_var(--foreground)]',
].join(' ');

const INPUT_CLASS = [
  'w-full px-4 py-3 rounded-[var(--radius)]',
  'bg-[var(--surface-btn)] border-none',
  'text-[var(--foreground)] text-[var(--fs-item)]',
  'focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--foreground)]',
  'transition-all',
].join(' ');

// 대시보드 오전/오후/저녁 레이블과 동일: text-[13px] font-semibold
const SECTION_LABEL = 'text-[13px] font-semibold text-[var(--muted-foreground)]';

export default function RoutineSetupModal({
  open,
  onClose,
  initialTitle = '',
  initialCoord,
  editingRoutine,
  occupiedSlots,
  onSave,
  onDelete,
  projects = [],
  colorTheme = 'vivid',
  initialProjectId = null,
  onCreateProject,
}: RoutineSetupModalProps) {
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('morning');
  const [priority, setPriority] = useState<Priority>(1);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [startDate, setStartDate] = useState(
    formatLocalDate(new Date())
  );
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingRoutine) {
      setRecurrence(editingRoutine.recurrence);
      setDaysOfWeek(editingRoutine.daysOfWeek ?? []);
      setPeriod(editingRoutine.defaultSlot.period);
      setPriority(editingRoutine.defaultSlot.priority);
      setScheduledTime(editingRoutine.scheduledTime ?? '09:00');
      setStartDate(editingRoutine.startDate);
      setProjectId(editingRoutine.projectId);
    } else {
      setRecurrence('daily');
      setDaysOfWeek([]);
      setPeriod(initialCoord?.period ?? 'morning');
      setPriority(initialCoord?.priority ?? 1);
      setScheduledTime('');
      setStartDate(formatLocalDate(new Date()));
      setProjectId(initialProjectId);
    }
  }, [open, editingRoutine, initialCoord, initialProjectId]);

  const isEditing = !!editingRoutine;
  const displayTitle = isEditing ? editingRoutine.title : initialTitle;

  const selectedProject = projectId ? projects.find((p) => p.id === projectId) : null;

  // 현재 선택한 슬롯이 이미 사용 중인지 확인 (편집 모드에서 자기 자신의 슬롯은 제외)
  const isSlotOccupied = (() => {
    if (!occupiedSlots) return false;
    const occupied = occupiedSlots[period]?.[priority] ?? false;
    if (isEditing && editingRoutine.defaultSlot.period === period && editingRoutine.defaultSlot.priority === priority) {
      return false;
    }
    return occupied;
  })();

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const showDaysOfWeek = recurrence !== 'monthly';

  const handleSave = () => {
    onSave({
      recurrence,
      daysOfWeek: showDaysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : undefined,
      defaultSlot: { period, priority },
      startDate,
      scheduledTime,
      projectId,
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} width="sm">
        {/* 헤더 + X 버튼 */}
        <div className="flex items-start justify-between pt-1">
          <div className="flex-1">
            {displayTitle && (
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {displayTitle}
              </h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0"
            aria-label="닫기"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 프로젝트 */}
        {projects.length > 0 && (
          <div className="flex flex-col gap-2.5 mt-4">
            <span className={SECTION_LABEL}>프로젝트</span>
            <button
              onClick={() => setProjectSelectOpen(true)}
              className={CHIP_DEFAULT + ' flex items-center gap-2 text-left'}
            >
              {selectedProject ? (
                <>
                  <ColorDot color={selectedProject.color} size="sm" />
                  <span>{selectedProject.name}</span>
                </>
              ) : (
                <span className="text-[var(--muted-foreground)]">미분류</span>
              )}
            </button>
          </div>
        )}

        {/* 반복 주기 */}
        <div className="flex flex-col gap-2.5 mt-4">
          <span className={SECTION_LABEL}>반복 주기</span>
          <div className="flex flex-wrap gap-2">
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRecurrence(opt.value)}
                className={recurrence === opt.value ? CHIP_ACTIVE : CHIP_DEFAULT}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 요일 */}
        {showDaysOfWeek && (
          <div className="flex flex-col gap-2.5 mt-4">
            <span className={SECTION_LABEL}>요일</span>
            <div className="flex gap-1.5">
              {DAY_OPTIONS.map((opt) => {
                const base = [
                  'flex-1 py-2.5 rounded-[var(--radius)] text-[var(--fs-item)] font-medium',
                  'text-center transition-all duration-150 cursor-pointer',
                  'bg-[var(--surface-btn)] text-[var(--foreground)]',
                ].join(' ');
                const active = daysOfWeek.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleDay(opt.value)}
                    className={`${base} ${active ? 'shadow-[inset_0_0_0_1.5px_var(--foreground)]' : 'hover:shadow-[inset_0_0_0_1.5px_var(--foreground)]'}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {daysOfWeek.length === 0 && (
              <span className="text-[11px] text-[var(--muted-foreground)]">
                선택 안 하면 매일 반복
              </span>
            )}
          </div>
        )}

        {/* 기본 슬롯 */}
        <div className="flex flex-col gap-2.5 mt-4">
          <span className={SECTION_LABEL}>기본 슬롯</span>

          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={period === opt.value ? CHIP_ACTIVE : CHIP_DEFAULT}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={priority === opt.value ? CHIP_ACTIVE : CHIP_DEFAULT}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isSlotOccupied && (
            <span className="text-[11px] text-[var(--g-error)]">
              이 슬롯은 이미 사용 중이에요
            </span>
          )}
        </div>

        {/* 시작일 */}
        <div className="flex flex-col gap-2.5 mt-4">
          <span className={SECTION_LABEL}>시작일</span>
          <InlineDatePicker value={startDate} onChange={setStartDate} />
        </div>

        {/* 시간 */}
        <div className="flex flex-col gap-2.5 mt-4">
          <span className={SECTION_LABEL}>시간</span>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-2 mt-6 pb-2">
          <div className="flex gap-2">
            <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button variant="primary" size="lg" onClick={handleSave} disabled={isSlotOccupied} className="flex-1">
              저장
            </Button>
          </div>
          {isEditing && onDelete && (
            <button
              onClick={() => { onDelete(); onClose(); }}
              className="w-full py-2.5 text-[var(--fs-item)] font-medium text-[var(--g-error)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              루틴 삭제
            </button>
          )}
        </div>
      </Dialog>

      {/* 프로젝트 선택 모달 */}
      <ProjectSelectModal
        open={projectSelectOpen}
        onClose={() => setProjectSelectOpen(false)}
        projects={projects}
        onSelect={(pid) => { setProjectId(pid); setProjectSelectOpen(false); }}
        onCreateAndSelect={(name, colorIndex) => {
          if (onCreateProject) {
            const newProject = onCreateProject(name, colorIndex);
            setProjectId(newProject.id);
          }
          setProjectSelectOpen(false);
        }}
        onSkip={() => { setProjectId(null); setProjectSelectOpen(false); }}
        colorTheme={colorTheme}
      />
    </>
  );
}
