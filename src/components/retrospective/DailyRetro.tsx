'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type {
  RetrospectiveEntry,
  RetroScope,
  RetroFields,
  RetroBlocker,
  RetroActionNote,
  EnergyLevel,
  Task,
} from '@/lib/types';
import EnergyLevelInput from './EnergyLevelInput';
import Badge from '@/components/ui/Badge';
import { getNextDay, formatLocalDate } from '@/lib/date';
import { useLocale } from '@/i18n/context';

const BLOCKERS: RetroBlocker[] = ['time', 'focus', 'waiting', 'toobig', 'condition'];

const AUTOSAVE_MS = 600;

interface ActionEntry {
  reason: RetroBlocker | null;
  note: string;
}

interface Draft {
  win: string;
  learned: string;
  nextFirst: string;
  /** taskId → 사유. 오늘 실제로 미루기/또하기 한 건에 대해서만 존재한다 */
  actions: Record<string, ActionEntry>;
}

const EMPTY_DRAFT: Draft = { win: '', learned: '', nextFirst: '', actions: {} };

/** 키 순서에 흔들리지 않는 직렬화 — 자동 저장 변경 감지용 */
function serializeDraft(d: Draft): string {
  const actions = Object.keys(d.actions)
    .sort()
    .map((id) => [id, d.actions[id].reason, d.actions[id].note]);
  return JSON.stringify([d.win, d.learned, d.nextFirst, actions]);
}

function toActionNotes(d: Draft): RetroActionNote[] {
  return Object.entries(d.actions)
    .filter(([, v]) => v.reason || v.note.trim())
    .map(([taskId, v]) => ({ taskId, reason: v.reason, note: v.note.trim() }));
}

interface DailyRetroProps {
  date: string; // YYYY-MM-DD
  retrospectives: RetrospectiveEntry[];
  tasks: Task[];
  onSave: (
    scope: RetroScope,
    scopeKey: string,
    content: string,
    energyLevel?: EnergyLevel,
    fields?: RetroFields,
  ) => void;
  /** 내일 첫 칸에 태스크를 실제로 배치 */
  onPlanTomorrow?: (title: string) => void;
}

/** 높이가 내용만큼 늘어나는 테두리 없는 textarea */
function GrowField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      // 16px — 모바일 포커스 시 자동 확대를 막는 최소 크기
      className="w-full bg-transparent border-0 outline-none resize-none overflow-hidden text-[16px] leading-[1.65] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50"
    />
  );
}

export default function DailyRetro({
  date,
  retrospectives,
  tasks,
  onSave,
  onPlanTomorrow,
}: DailyRetroProps) {
  const { t } = useLocale();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | undefined>(undefined);
  const [legacy, setLegacy] = useState('');
  const [saved, setSaved] = useState(false);
  const persistedRef = useRef(serializeDraft(EMPTY_DRAFT));

  // 오늘 실제로 일어난 미루기/또하기 액션. 체크 없이 지나간 일은 여기에 잡히지 않는다.
  const actions = useMemo(
    () =>
      (tasks ?? [])
        .filter(
          (x) =>
            (x.origin === 'deferred' || x.origin === 'repeated') &&
            !!x.createdAt &&
            formatLocalDate(new Date(x.createdAt)) === date,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((task) => ({ task, kind: task.origin as 'deferred' | 'repeated' })),
    [tasks, date],
  );

  const composeContent = useCallback(
    (d: Draft, legacyText: string) => {
      const lines: string[] = [];
      if (d.win.trim()) lines.push(`${t.retroWinLabel} · ${d.win.trim()}`);
      if (d.learned.trim()) lines.push(`${t.retroLearnedLabel} · ${d.learned.trim()}`);
      for (const [taskId, v] of Object.entries(d.actions)) {
        if (!v.reason && !v.note.trim()) continue;
        const action = actions.find((a) => a.task.id === taskId);
        const kind = action?.kind === 'repeated' ? t.retroActionRepeat : t.retroActionDefer;
        const parts = [
          action?.task.title ?? '',
          v.reason ? t.retroBlockers[v.reason] : '',
          v.note.trim(),
        ].filter(Boolean);
        lines.push(`${kind} · ${parts.join(' — ')}`);
      }
      if (d.nextFirst.trim()) lines.push(`${t.retroNextFirstLabel} · ${d.nextFirst.trim()}`);
      if (legacyText.trim()) lines.push(legacyText.trim());
      return lines.join('\n');
    },
    [t, actions],
  );

  const persist = useCallback(
    (d: Draft, energy: EnergyLevel | undefined, legacyText: string) => {
      onSave('day', date, composeContent(d, legacyText), energy, {
        win: d.win.trim(),
        learned: d.learned.trim(),
        nextFirst: d.nextFirst.trim(),
        actionNotes: toActionNotes(d),
        legacy: legacyText.trim(),
      });
    },
    [date, onSave, composeContent],
  );

  const entry = useMemo(
    () => (retrospectives ?? []).find((r) => r.scope === 'day' && r.scopeKey === date),
    [retrospectives, date],
  );
  // 자동 저장은 같은 엔트리를 계속 갱신하므로 id는 타이핑 중에 바뀌지 않는다.
  // 날짜 이동 / localStorage 지연 로드만 여기서 잡아낸다.
  const entryId = entry?.id ?? null;

  useEffect(() => {
    const next: Draft = {
      win: entry?.win ?? '',
      learned: entry?.learned ?? '',
      nextFirst: entry?.nextFirst ?? '',
      actions: Object.fromEntries(
        (entry?.actionNotes ?? []).map((a) => [
          a.taskId,
          { reason: a.reason ?? null, note: a.note ?? '' },
        ]),
      ),
    };
    const hasTemplate = !!(
      entry?.win || entry?.learned || entry?.nextFirst || entry?.actionNotes?.length
    );
    // date/entryId가 바뀔 때만 저장된 값을 폼에 밀어넣는 동기화 — 의도된 setState
    /* eslint-disable react-hooks/set-state-in-effect */
    setEnergyLevel(entry?.energyLevel);
    // 템플릿 이전에 자유 서술로 쓴 기록은 버리지 않고 따로 보존한다
    setLegacy(entry?.legacy ?? (!hasTemplate && entry?.content?.trim() ? entry.content : ''));

    const json = serializeDraft(next);
    // 방금 저장한 내용이 되돌아온 경우 — 커서와 저장 표시를 건드리지 않는다
    if (json === persistedRef.current) return;
    setDraft(next);
    persistedRef.current = json;
    setSaved(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, entryId]);

  // 자동 저장 — 저장 버튼 없음
  useEffect(() => {
    const json = serializeDraft(draft);
    if (json === persistedRef.current) return;
    const timer = setTimeout(() => {
      persistedRef.current = json;
      persist(draft, energyLevel, legacy);
      setSaved(true);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [draft, energyLevel, legacy, persist]);

  const handleEnergyChange = (level: EnergyLevel) => {
    setEnergyLevel(level);
    persist(draft, level, legacy);
    persistedRef.current = serializeDraft(draft);
    setSaved(true);
  };

  const clearLegacy = () => {
    setLegacy('');
    persist(draft, energyLevel, '');
    setSaved(true);
  };

  // ── 사실: 쓰기 전에 먼저 보여준다 ──
  const { doneTasks, openCount, spentText } = useMemo(() => {
    const dayTasks = (tasks ?? []).filter((x) => x.date === date);
    const done = dayTasks.filter((x) => x.completedAt);
    const seconds = dayTasks.reduce((sum, x) => sum + (x.timerSeconds ?? 0), 0);
    const mins = Math.round(seconds / 60);
    return {
      doneTasks: done,
      openCount: dayTasks.length - done.length,
      spentText: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : mins > 0 ? `${mins}m` : '',
    };
  }, [tasks, date]);

  const tomorrow = getNextDay(date);
  const nextFirstTitle = draft.nextFirst.trim();
  const alreadyPlanned = useMemo(
    () =>
      nextFirstTitle.length > 0 &&
      (tasks ?? []).some((x) => x.date === tomorrow && x.title.trim() === nextFirstTitle),
    [tasks, tomorrow, nextFirstTitle],
  );

  const pickWin = (title: string) => {
    setDraft((d) => ({ ...d, win: d.win.trim() ? `${d.win.trim()}, ${title}` : title }));
  };

  const setActionField = (taskId: string, patch: Partial<ActionEntry>) => {
    setDraft((d) => {
      const prev: ActionEntry = d.actions[taskId] ?? { reason: null, note: '' };
      return { ...d, actions: { ...d.actions, [taskId]: { ...prev, ...patch } } };
    });
  };

  const rowClass = 'border-t border-[var(--border)] pt-3 pb-1';
  const labelClass = 'text-[12px] font-medium text-[var(--muted-foreground)] mb-1';

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] px-4 py-3.5 mt-4">
      {/* 헤더 — 제목 + 사실 + 에너지 */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="text-[15px] font-semibold text-[var(--foreground)] shrink-0">
            {t.dailyRetroTitle}
          </h3>
          <span className="text-[12px] text-[var(--muted-foreground)] truncate">
            {t.retroFacts(doneTasks.length, openCount)}
            {spentText && ` ${t.retroTimeSpent(spentText)}`}
          </span>
        </div>
        <EnergyLevelInput value={energyLevel} onChange={handleEnergyChange} compact />
      </div>

      {/* ① 잘한 것 — 완료 항목을 탭해서 채운다 (빈칸으로 시작하지 않는다) */}
      <div className={rowClass}>
        <div className={labelClass}>{t.retroWinLabel}</div>
        {doneTasks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {doneTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => pickWin(task.title)}
                className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[13px] text-[var(--muted-foreground)] hover:border-[var(--foreground)]/30 hover:text-[var(--foreground)] transition-colors max-w-[220px] truncate"
              >
                {task.title}
              </button>
            ))}
          </div>
        )}
        <GrowField
          value={draft.win}
          onChange={(v) => setDraft((d) => ({ ...d, win: v }))}
          placeholder={t.retroWinPlaceholder}
        />
      </div>

      {/* ② 알게 된 것 */}
      <div className={rowClass}>
        <div className={labelClass}>{t.retroLearnedLabel}</div>
        <GrowField
          value={draft.learned}
          onChange={(v) => setDraft((d) => ({ ...d, learned: v }))}
          placeholder={t.retroLearnedPlaceholder}
        />
      </div>

      {/* ③ 내일 첫 칸 — 서술이 아니라 액션으로 끝낸다 */}
      <div className={rowClass}>
        <div className={labelClass}>{t.retroNextFirstLabel}</div>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <GrowField
              value={draft.nextFirst}
              onChange={(v) => setDraft((d) => ({ ...d, nextFirst: v }))}
              placeholder={t.retroNextFirstPlaceholder}
            />
          </div>
          {onPlanTomorrow && nextFirstTitle.length > 0 && (
            <button
              type="button"
              disabled={alreadyPlanned}
              onClick={() => onPlanTomorrow(nextFirstTitle)}
              className="shrink-0 px-2.5 py-1 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors disabled:cursor-default bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 disabled:bg-transparent disabled:text-[var(--muted-foreground)]"
            >
              {alreadyPlanned ? t.retroPlannedTomorrow : t.retroPlanTomorrow}
            </button>
          )}
        </div>
      </div>

      {/* 오늘 미루거나 또 한 일 — 액션이 있을 때만 나타난다.
          체크 없이 지나간 일은 묻지 않는다 (그런 날은 어차피 회고를 안 쓴다). */}
      {actions.length > 0 && (
        <div className={rowClass}>
          <div className={labelClass}>{t.retroActionsLabel}</div>
          <div className="flex flex-col gap-3.5">
            {actions.map(({ task, kind }) => {
              const entry = draft.actions[task.id] ?? { reason: null, note: '' };
              const opened = !!entry.reason || entry.note.trim().length > 0;
              return (
                <div key={task.id}>
                  <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                    <Badge
                      count={kind === 'deferred' ? task.deferCount : 0}
                      continueCount={kind === 'repeated' ? task.continueCount ?? 0 : 0}
                      origin={kind}
                    />
                    <span className="text-[15px] text-[var(--foreground)] truncate">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {BLOCKERS.map((key) => {
                      const active = entry.reason === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setActionField(task.id, { reason: active ? null : key })
                          }
                          className={[
                            'px-2.5 py-1 rounded-full text-[13px] transition-colors border',
                            active
                              ? 'border-[var(--foreground)] text-[var(--foreground)] font-medium'
                              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                          ].join(' ')}
                        >
                          {t.retroBlockers[key]}
                        </button>
                      );
                    })}
                  </div>

                  {opened && (
                    <div className="mt-1.5">
                      <GrowField
                        value={entry.note}
                        onChange={(v) => setActionField(task.id, { note: v })}
                        placeholder={t.retroActionNotePlaceholder}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 템플릿 이전 자유 서술 기록 */}
      {legacy.trim() && (
        <div className={rowClass}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
              {t.retroLegacyLabel}
            </span>
            <button
              type="button"
              onClick={clearLegacy}
              className="text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {t.retroLegacyClear}
            </button>
          </div>
          <p className="text-[14px] leading-[1.6] text-[var(--muted-foreground)] whitespace-pre-wrap">
            {legacy}
          </p>
        </div>
      )}

      {/* 저장 표시 — 저장 버튼 대신 */}
      <div className="h-4 mt-1.5 text-right">
        {saved && (
          <span className="text-[11px] text-[var(--muted-foreground)]/70">{t.retroSaved}</span>
        )}
      </div>
    </div>
  );
}
