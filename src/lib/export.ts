import type { AppState, Task, RoutineInstance, Project } from './types';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function findProject(projects: Project[], id: string | null): Project | undefined {
  return projects.find((p) => p.id === id);
}

const PERIOD_LABELS: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

/**
 * AppState → Markdown 문자열로 변환
 */
export function exportToMarkdown(state: AppState): string {
  const today = getToday();
  const lines: string[] = [];

  lines.push(`# 9block 내보내기`);
  lines.push(`> 내보낸 날짜: ${today}`);
  lines.push('');

  // Goal Compass
  const gc = state.goalCompass;
  if (gc.identity || gc.affirmation) {
    lines.push('## Goal Compass');
    if (gc.identity) lines.push(`- 나는: ${gc.identity}`);
    if (gc.goals.fiveYear) lines.push(`- 5년: ${gc.goals.fiveYear}`);
    if (gc.goals.oneYear) lines.push(`- 1년: ${gc.goals.oneYear}`);
    if (gc.goals.quarter) lines.push(`- 분기: ${gc.goals.quarter}`);
    if (gc.goals.month) lines.push(`- 이번달: ${gc.goals.month}`);
    if (gc.goals.week) lines.push(`- 이번주: ${gc.goals.week}`);
    if (gc.goals.today) lines.push(`- 오늘: ${gc.goals.today}`);
    if (gc.affirmation) lines.push(`- 확언: "${gc.affirmation}"`);
    lines.push('');
  }

  // 오늘 시간표
  const todayTasks = state.tasks.filter((t) => t.date === today && t.slot);
  const todayInstances = state.routineInstances.filter((ri) => ri.date === today && ri.slot);

  if (todayTasks.length > 0 || todayInstances.length > 0) {
    lines.push(`## 오늘의 시간표 (${today})`);
    lines.push('');
    lines.push('| 시간대 | 1순위 | 2순위 | 3순위 |');
    lines.push('|--------|-------|-------|-------|');

    for (const period of ['morning', 'afternoon', 'evening'] as const) {
      const row = [PERIOD_LABELS[period]];
      for (const priority of [1, 2, 3] as const) {
        const task = todayTasks.find((t) => t.slot?.period === period && t.slot?.priority === priority);
        const inst = todayInstances.find((ri) => ri.slot?.period === period && ri.slot?.priority === priority);
        const item = task || inst;
        if (item) {
          const title = 'title' in item ? item.title : state.routines.find((r) => r.id === (item as RoutineInstance).routineId)?.title || '?';
          const done = item.completedAt ? ' ~~' : '';
          const doneEnd = item.completedAt ? '~~' : '';
          row.push(`${done}${title}${doneEnd}`);
        } else {
          row.push('-');
        }
      }
      lines.push(`| ${row.join(' | ')} |`);
    }
    lines.push('');
  }

  // 백로그
  const backlog = state.tasks.filter((t) => !t.slot && !t.completedAt);
  if (backlog.length > 0) {
    lines.push('## 백로그');
    for (const task of backlog) {
      const proj = findProject(state.projects, task.projectId);
      const projLabel = proj ? ` (${proj.name})` : '';
      const defer = task.deferCount > 0 ? ` [미룸 ${task.deferCount}회]` : '';
      lines.push(`- [ ] ${task.title}${projLabel}${defer}`);
    }
    lines.push('');
  }

  // 프로젝트
  if (state.projects.length > 0) {
    lines.push('## 프로젝트');
    for (const p of state.projects) {
      const taskCount = state.tasks.filter((t) => t.projectId === p.id && !t.completedAt).length;
      lines.push(`- ${p.name} (${taskCount}개 진행 중)`);
    }
    lines.push('');
  }

  // 루틴
  const activeRoutines = state.routines.filter((r) => r.isActive);
  if (activeRoutines.length > 0) {
    lines.push('## 활성 루틴');
    for (const r of activeRoutines) {
      const proj = findProject(state.projects, r.projectId);
      const projLabel = proj ? ` (${proj.name})` : '';
      lines.push(`- ${r.title}${projLabel} — ${r.recurrence}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * AppState → JSON 문자열로 변환 (정렬된 포맷)
 */
export function exportToJSON(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * 문자열을 파일로 다운로드
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
