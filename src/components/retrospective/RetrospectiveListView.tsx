'use client';

import { useState, useMemo } from 'react';
import { Trash2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RetrospectiveEntry, RetroScope, EnergyLevel } from '@/lib/types';
import RetroInput from './RetroInput';
import EnergyLevelInput from './EnergyLevelInput';
import Dialog from '@/components/ui/Dialog';
import { useLocale } from '@/i18n/context';

interface RetrospectiveListViewProps {
  retrospectives: RetrospectiveEntry[];
  onSave: (scope: RetroScope, scopeKey: string, content: string, energyLevel?: EnergyLevel) => void;
  onDelete: (retroId: string) => void;
}

export default function RetrospectiveListView({
  retrospectives,
  onSave,
  onDelete,
}: RetrospectiveListViewProps) {
  const { t } = useLocale();
  const [filterScope, setFilterScope] = useState<RetroScope | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<RetrospectiveEntry | null>(null);

  const SCOPE_LABELS: Record<RetroScope, string> = {
    day: t.scopeDaily,
    week: t.scopeWeekly,
    month: t.scopeMonthly,
  };

  function formatScopeKey(scope: RetroScope, scopeKey: string): string {
    if (scope === 'day') {
      const [y, m, d] = scopeKey.split('-');
      return t.dateShort(Number(y), parseInt(m), parseInt(d));
    }
    if (scope === 'week') {
      // YYYY-Www
      const [y, w] = scopeKey.split('-W');
      return t.weekNumber(Number(y), parseInt(w));
    }
    // month: YYYY-MM
    const [y, m] = scopeKey.split('-');
    return t.monthYear(Number(y), parseInt(m));
  }

  const filtered = useMemo(() => {
    const list = (retrospectives ?? [])
      .filter((r) => r.content.trim().length > 0)
      .filter((r) => filterScope === 'all' || r.scope === filterScope);
    // 최신 순 정렬
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [retrospectives, filterScope]);

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} strokeWidth={1.8} className="text-[var(--foreground)]" />
          <h2 className="text-base font-semibold text-[var(--foreground)]">{t.retrospective}</h2>
          <span className="text-[12px] text-[var(--muted-foreground)]">{t.retroCount(filtered.length)}</span>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center bg-[var(--card)] rounded-[var(--radius-sm)] p-0.5 self-start border border-[var(--border)]">
        {([
          { key: 'all', label: t.all },
          { key: 'day', label: t.scopeDaily },
          { key: 'week', label: t.scopeWeekly },
          { key: 'month', label: t.scopeMonthly },
        ] as { key: RetroScope | 'all'; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterScope(key)}
            className={[
              'px-2.5 py-1 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors',
              filterScope === key
                ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
          <BookOpen size={32} strokeWidth={1.2} className="mb-3 opacity-40" />
          <p className="text-sm">{t.noRetroYet}</p>
          <p className="text-[12px] mt-1 opacity-60">{t.noRetroHint}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((retro) => {
            const updatedDate = new Date(retro.updatedAt);
            const [uy, um, ud] = [
              updatedDate.getFullYear(),
              updatedDate.getMonth() + 1,
              updatedDate.getDate(),
            ];
            return (
              <div
                key={retro.id}
                className="group bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={[
                      'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                      retro.scope === 'day' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                      retro.scope === 'week' ? 'bg-[var(--g-success)]/10 text-[var(--g-success)]' :
                      'bg-[var(--g-warning)]/10 text-[var(--g-warning)]',
                    ].join(' ')}>
                      {SCOPE_LABELS[retro.scope]}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--foreground)]">
                      {formatScopeKey(retro.scope, retro.scopeKey)}
                    </span>
                    {retro.energyLevel && (
                      <EnergyLevelInput
                        value={retro.energyLevel}
                        onChange={(level) => onSave(retro.scope, retro.scopeKey, retro.content, level)}
                        compact
                      />
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteTarget(retro)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 flex items-center justify-center rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--g-error)]"
                    title={t.delete}
                    aria-label={t.delete}
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                  </button>
                </div>
                <p className="text-[13px] text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                  {retro.content}
                </p>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {t.editedAt(t.dateShort(uy, um, ud))}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t.deleteRetroConfirm}
        width="sm"
      >
        {deleteTarget && (
          <>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              <span className="font-medium text-[var(--foreground)]">
                {formatScopeKey(deleteTarget.scope, deleteTarget.scopeKey)}
              </span>
              {t.deleteRetroWarning(SCOPE_LABELS[deleteTarget.scope])}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85"
              >
                {t.delete}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
