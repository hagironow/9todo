'use client';

import { useMemo } from 'react';
import type { Task, Project } from '@/lib/types';
import { useLocale } from '@/i18n/context';

interface ProjectStatsViewProps {
  tasks: Task[];
  projects: Project[];
  dateRange: string[];
  label: string;
}

interface ProjectStat {
  id: string;
  name: string;
  color: string;
  total: number;
  completed: number;
}

const UNCATEGORIZED_COLOR = '#888888';

export default function ProjectStatsView({ tasks, projects, dateRange, label }: ProjectStatsViewProps) {
  const { t } = useLocale();
  const stats = useMemo(() => {
    const periodTasks = tasks.filter(
      (task) => task.date && dateRange.includes(task.date) && task.slot && !task.recurrence
    );
    if (periodTasks.length === 0) return [];

    const map = new Map<string, { total: number; completed: number }>();
    for (const task of periodTasks) {
      // 반복 인스턴스의 projectId가 null이면 부모의 projectId를 폴백
      let pid = task.projectId;
      if (!pid && task.recurrenceParentId) {
        const parent = tasks.find((p) => p.id === task.recurrenceParentId);
        if (parent) pid = parent.projectId;
      }
      const key = pid ?? '__uncategorized__';
      const entry = map.get(key) ?? { total: 0, completed: 0 };
      entry.total++;
      if (task.completedAt) entry.completed++;
      map.set(key, entry);
    }

    const result: ProjectStat[] = [];
    for (const [projectId, { total, completed }] of map.entries()) {
      if (projectId === '__uncategorized__') {
        result.push({ id: '__uncategorized__', name: t.uncategorized, color: UNCATEGORIZED_COLOR, total, completed });
      } else {
        const project = projects.find((p) => p.id === projectId);
        result.push({
          id: projectId,
          name: project?.name ?? t.deletedProject,
          color: project?.color ?? UNCATEGORIZED_COLOR,
          total,
          completed,
        });
      }
    }
    result.sort((a, b) => b.total - a.total);
    return result;
  }, [tasks, projects, dateRange, t]);

  const grandTotal = stats.reduce((sum, s) => sum + s.total, 0);

  if (stats.length === 0) return null;

  // 파이 차트 데이터 계산
  const pieSegments = useMemo(() => {
    let cumulative = 0;
    return stats.map((s) => {
      const pct = s.total / grandTotal;
      const start = cumulative;
      cumulative += pct;
      return { ...s, pct, start, end: cumulative };
    });
  }, [stats, grandTotal]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
        {t.projectStats(label)}
      </h3>

      {/* 파이 차트 (중앙 배치) */}
      <div className="flex flex-col items-center gap-4">
        <svg width="180" height="180" viewBox="0 0 100 100">
          {pieSegments.map((seg) => {
            const startAngle = seg.start * 360 - 90;
            const endAngle = seg.end * 360 - 90;
            const largeArc = seg.pct > 0.5 ? 1 : 0;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const r = 42;
            const cx = 50, cy = 50;

            if (seg.pct >= 0.999) {
              return (
                <circle
                  key={seg.id}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="6"
                />
              );
            }

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            return (
              <path
                key={seg.id}
                d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke={seg.color}
                strokeWidth="6"
                strokeLinecap="butt"
              />
            );
          })}
          <text x="50" y="47" textAnchor="middle" className="fill-[var(--foreground)]" fontSize="12" fontWeight="600">
            {grandTotal}
          </text>
          <text x="50" y="58" textAnchor="middle" className="fill-[var(--muted-foreground)]" fontSize="7">
            {t.tasks}
          </text>
        </svg>

        {/* 범례 */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {pieSegments.map((seg) => (
            <div key={seg.id} className="flex items-center gap-1.5">
              <span
                className="w-[8px] h-[8px] rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[12px] text-[var(--foreground)]">
                {seg.name}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {Math.round(seg.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 프로젝트별 완료율 */}
      <div className="flex flex-col gap-2.5">
        {stats.map((s) => {
          const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
          return (
            <div key={s.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-[10px] h-[10px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[12px] text-[var(--foreground)]">
                    {s.name}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {s.completed}/{s.total} {completionRate}%
                </span>
              </div>
              {/* 완료율 막대 */}
              <div className="h-[6px] rounded-full overflow-hidden bg-[var(--muted)]">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${completionRate}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
