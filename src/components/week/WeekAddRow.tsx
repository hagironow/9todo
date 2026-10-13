'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Project, WeekPriority } from '@/lib/types';
import ColorDot from '@/components/ui/ColorDot';
import WeekPriorityPicker from './WeekPriorityPicker';
import WeekDayPicker from './WeekDayPicker';
import { useLocale } from '@/i18n/context';
import { useImeEnterSubmit } from '@/hooks/useImeEnterSubmit';

interface WeekAddRowProps {
  projects: Project[];
  lastUsedProjectId?: string | null;
  onAdd: (
    title: string,
    projectId: string | null,
    priority: WeekPriority,
    weekDay: number | null,
  ) => void;
  defaultPriority?: WeekPriority;
  /** 오늘 요일 인덱스 (0=월) */
  todayIndex: number;
}

/**
 * 이번 주에 태스크를 바로 만드는 줄.
 * 평소엔 입력 한 줄만 보이고, Enter를 치면 카테고리·우선순위·요일 선택이 펼쳐진다.
 * 한 번 더 Enter(또는 추가)를 누르면 생성된다.
 */
export default function WeekAddRow({
  projects,
  lastUsedProjectId,
  onAdd,
  defaultPriority = 'normal',
  todayIndex,
}: WeekAddRowProps) {
  const { t } = useLocale();

  const [stage, setStage] = useState<'input' | 'options'>('input');
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<WeekPriority>(defaultPriority);
  const [weekDay, setWeekDay] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(
    projects.find((p) => p.id === lastUsedProjectId) ?? null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  // 선택지가 열린 직후 같은 Enter가 한 번 더 들어와 바로 생성되는 것을 막는다
  const openedAtRef = useRef(0);

  const reset = () => {
    setDraft('');
    setStage('input');
    setPriority(defaultPriority);
    setWeekDay(null);
    inputRef.current?.focus();
  };

  const commit = (value: string = draft) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed, project?.id ?? null, priority, weekDay);
    reset(); // 프로젝트는 그대로 둬서 연속 입력이 편하게
  };

  /** 1단계에선 선택지를 펼치고, 2단계에선 생성한다 */
  const handleEnter = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (stage === 'input') {
      setDraft(trimmed);
      setStage('options');
      openedAtRef.current = Date.now();
      return;
    }
    if (Date.now() - openedAtRef.current < 200) return;
    commit(trimmed);
  };

  const ime = useImeEnterSubmit<HTMLInputElement>(handleEnter);

  const activeChip =
    'border-[var(--foreground)] text-[var(--foreground)] font-medium';
  const idleChip =
    'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]';

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative flex flex-col gap-2 px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] cursor-text"
    >
      {/* 입력 */}
      <div className="flex items-center gap-2">
        <ColorDot color={project?.color ?? '#8A8A8A'} size="sm" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              if (stage === 'options') setStage('input');
              else setDraft('');
              return;
            }
            ime.onKeyDown(e);
          }}
          onCompositionEnd={ime.onCompositionEnd}
          placeholder={t.weekAddPlaceholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
        />
        <button
          onClick={(e) => { e.stopPropagation(); handleEnter(draft); }}
          disabled={!draft.trim()}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-30"
          aria-label={t.add}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Enter 후에만 — 카테고리 / 우선순위 / 요일 */}
      {stage === 'options' && (
        <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setProject(null); }}
              className={[
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[12px] transition-colors',
                !project ? activeChip : idleChip,
              ].join(' ')}
            >
              <ColorDot color="#8A8A8A" size="sm" />
              {t.uncategorized}
            </button>
            {projects.filter((p) => !p.archived).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => { e.stopPropagation(); setProject(p); }}
                className={[
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[12px] transition-colors',
                  project?.id === p.id ? activeChip : idleChip,
                ].join(' ')}
              >
                <ColorDot color={p.color} size="sm" />
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <WeekPriorityPicker size="sm" value={priority} onChange={setPriority} />
            <span className="w-px h-4 bg-[var(--border)] flex-shrink-0" aria-hidden />
            <WeekDayPicker
              value={weekDay ?? undefined}
              onChange={setWeekDay}
              todayIndex={todayIndex}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="px-2.5 py-1 rounded-[var(--radius-sm)] text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); commit(); }}
              className="px-3 py-1 rounded-[var(--radius-sm)] text-[13px] font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-opacity"
            >
              {t.add}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
