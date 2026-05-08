'use client';

import { useState, useMemo } from 'react';
import { Trash2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RetrospectiveEntry, RetroScope } from '@/lib/types';
import RetroInput from './RetroInput';
import Dialog from '@/components/ui/Dialog';

interface RetrospectiveListViewProps {
  retrospectives: RetrospectiveEntry[];
  onSave: (scope: RetroScope, scopeKey: string, content: string) => void;
  onDelete: (retroId: string) => void;
}

const SCOPE_LABELS: Record<RetroScope, string> = {
  day: '일간',
  week: '주간',
  month: '월간',
};

function formatScopeKey(scope: RetroScope, scopeKey: string): string {
  if (scope === 'day') {
    const [y, m, d] = scopeKey.split('-');
    return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
  }
  if (scope === 'week') {
    // YYYY-Www
    const [y, w] = scopeKey.split('-W');
    return `${y}년 ${parseInt(w)}주차`;
  }
  // month: YYYY-MM
  const [y, m] = scopeKey.split('-');
  return `${y}년 ${parseInt(m)}월`;
}

export default function RetrospectiveListView({
  retrospectives,
  onSave,
  onDelete,
}: RetrospectiveListViewProps) {
  const [filterScope, setFilterScope] = useState<RetroScope | 'all'>('all');
  const [deleteTarget, setDeleteTarget] = useState<RetrospectiveEntry | null>(null);

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
          <h2 className="text-base font-semibold text-[var(--foreground)]">회고</h2>
          <span className="text-[12px] text-[var(--muted-foreground)]">{filtered.length}개</span>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center bg-[var(--card)] rounded-[var(--radius-sm)] p-0.5 self-start border border-[var(--border)]">
        {([
          { key: 'all', label: '전체' },
          { key: 'day', label: '일간' },
          { key: 'week', label: '주간' },
          { key: 'month', label: '월간' },
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
          <p className="text-sm">아직 작성된 회고가 없습니다</p>
          <p className="text-[12px] mt-1 opacity-60">대시보드나 캘린더에서 회고를 남겨보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((retro) => (
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
                </div>
                <button
                  onClick={() => setDeleteTarget(retro)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--g-error)]"
                  title="삭제"
                >
                  <Trash2 size={13} strokeWidth={1.8} />
                </button>
              </div>
              <p className="text-[13px] text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">
                {retro.content}
              </p>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {new Date(retro.updatedAt).toLocaleDateString('ko-KR')} 수정
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="회고를 삭제할까요?"
        width="sm"
      >
        {deleteTarget && (
          <>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              <span className="font-medium text-[var(--foreground)]">
                {formatScopeKey(deleteTarget.scope, deleteTarget.scopeKey)}
              </span>
              의 {SCOPE_LABELS[deleteTarget.scope]} 회고를 삭제합니다. 삭제한 회고는 복구할 수 없습니다.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-semibold bg-[var(--destructive)] text-white transition-opacity hover:opacity-85"
              >
                삭제
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
