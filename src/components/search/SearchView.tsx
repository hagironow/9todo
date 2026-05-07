'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Task, Note, Project } from '@/lib/types';

interface SearchViewProps {
  tasks: Task[];
  notes: Note[];
  projects: Project[];
  onClose: () => void;
}

export default function SearchView({ tasks, notes, projects, onClose }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const matchedTasks = useMemo(() => {
    if (!q) return [];
    return tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  }, [tasks, q]);

  const matchedNotes = useMemo(() => {
    if (!q) return [];
    return (notes ?? [])
      .filter((n) => n.content.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  }, [notes, q]);

  const getProject = (pid: string | null) =>
    pid ? projects.find((p) => p.id === pid) ?? null : null;

  const totalResults = matchedTasks.length + matchedNotes.length;

  return (
    <div className="flex flex-col gap-4">
      {/* 검색 인풋 */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 flex items-center gap-2 px-4 py-3 rounded-[var(--radius)] border transition-colors bg-[var(--background)] border-[var(--border)] focus-within:border-[var(--foreground)]"
        >
          <Search size={16} className="text-[var(--muted-foreground)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="태스크, 노트 검색..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          취소
        </button>
      </div>

      {/* 결과 */}
      {q ? (
        <div className="flex flex-col gap-4">
          {totalResults === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-10">
              검색 결과가 없습니다
            </p>
          )}

          {/* 태스크 결과 */}
          {matchedTasks.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] px-1 pb-1">
                태스크 ({matchedTasks.length})
              </p>
              {matchedTasks.map((task) => {
                const proj = getProject(task.projectId);
                const done = !!task.completedAt;
                return (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--card)] transition-colors">
                    <span className="text-sm w-5 text-center shrink-0">
                      {done ? '✓' : '○'}
                    </span>
                    <span className={`flex-1 text-sm truncate ${done ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                      {task.title}
                    </span>
                    {proj && (
                      <span className="flex items-center gap-1 shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
                        <span className="text-[10px] text-[var(--muted-foreground)]">{proj.name}</span>
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)] shrink-0">{task.date}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 노트 결과 */}
          {matchedNotes.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] px-1 pb-1">
                노트 ({matchedNotes.length})
              </p>
              {matchedNotes.map((note) => {
                const proj = getProject(note.projectId);
                const dateStr = new Date(note.createdAt).toLocaleDateString('ko-KR', {
                  year: '2-digit',
                  month: '2-digit',
                  day: '2-digit',
                });
                return (
                  <div key={note.id} className="flex items-start gap-3 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--card)] transition-colors">
                    {proj && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: proj.color }} />
                    )}
                    <span
                      className="flex-1 text-sm text-[var(--foreground)] whitespace-pre-wrap break-words"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {note.content}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] shrink-0 pt-0.5">{dateStr}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-10">
          키워드를 입력하세요
        </p>
      )}
    </div>
  );
}
