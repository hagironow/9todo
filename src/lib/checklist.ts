// 블록 제목 안의 체크박스 — 마크다운 체크리스트 형식(`- [ ] 할 일`, `- [x] 할 일`)으로 저장한다.

const CHECK_RE = /^(\s*)- \[( |x|X)\] ?(.*)$/;
const BULLET_RE = /^(\s*)[-*•]\s+(.*)$/;
const EMPTY_CHECK = '- [ ] ';

export type TitleLine =
  | { kind: 'text'; text: string }
  | { kind: 'check'; text: string; checked: boolean; index: number };

export function parseTitle(title: string): TitleLine[] {
  return title.split('\n').map((line, index) => {
    const m = line.match(CHECK_RE);
    if (!m) return { kind: 'text', text: line };
    return { kind: 'check', text: m[3], checked: m[2] !== ' ', index };
  });
}

export function hasChecklist(title: string): boolean {
  return title.split('\n').some((line) => CHECK_RE.test(line));
}

export function checklistProgress(title: string): { done: number; total: number } {
  const checks = parseTitle(title).filter((l) => l.kind === 'check');
  return { done: checks.filter((l) => l.kind === 'check' && l.checked).length, total: checks.length };
}

/** 체크박스가 있고 전부 체크됐는지 — 블록 완료로 본다 */
export function isAllChecked(title: string): boolean {
  const { done, total } = checklistProgress(title);
  return total > 0 && done === total;
}

/** lineIndex 번째 줄의 체크 상태를 뒤집는다 */
export function toggleCheck(title: string, lineIndex: number): string {
  const lines = title.split('\n');
  const m = lines[lineIndex]?.match(CHECK_RE);
  if (!m) return title;
  lines[lineIndex] = `${m[1]}- [${m[2] === ' ' ? 'x' : ' '}] ${m[3]}`;
  return lines.join('\n');
}

/** 체크 상태만 다르고 내용은 같은지 — 반복 일정 수정 모달을 건너뛸 때 쓴다 */
export function sameIgnoringChecks(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/^(\s*)- \[(x|X)\]/gm, '$1- [ ]');
  return norm(a) === norm(b);
}

/**
 * Shift+Enter — 체크박스 줄 만들기
 * - 체크박스 줄: 커서 위치에서 다음 체크박스 줄로 나눈다
 * - 빈 체크박스 줄: 체크박스를 지워 일반 줄로 빠져나간다
 * - `- ` 로 시작하는 줄: 체크박스로 바꾸고 다음 체크박스 줄을 연다
 * - 빈 줄: 그 줄을 체크박스로 바꾼다
 * - 그 외 일반 줄(제목 등): 그대로 두고 아래에 체크박스 줄을 연다
 */
export function applyShiftEnter(
  value: string,
  selStart: number,
  selEnd: number,
): { value: string; caret: number } {
  // 선택 영역은 먼저 지운다
  value = value.slice(0, selStart) + value.slice(selEnd);
  const caret = selStart;

  const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
  const nl = value.indexOf('\n', caret);
  const lineEnd = nl === -1 ? value.length : nl;
  const line = value.slice(lineStart, lineEnd);
  const before = value.slice(0, lineStart);
  const after = value.slice(lineEnd);

  const check = line.match(CHECK_RE);
  if (check) {
    if (check[3].trim() === '') {
      return { value: before + check[1] + after, caret: lineStart + check[1].length };
    }
    const insert = `\n${check[1]}${EMPTY_CHECK}`;
    return {
      value: value.slice(0, caret) + insert + value.slice(caret),
      caret: caret + insert.length,
    };
  }

  if (line.trim() === '') {
    return { value: before + EMPTY_CHECK + after, caret: lineStart + EMPTY_CHECK.length };
  }

  const bullet = line.match(BULLET_RE);
  if (bullet) {
    const converted = `${bullet[1]}${EMPTY_CHECK}${bullet[2]}`;
    // 커서 뒤 글자 수는 그대로이므로, 바뀐 줄에서 같은 위치로 나눈다
    const splitAt = Math.max(
      lineStart + converted.length - (lineEnd - caret),
      lineStart + bullet[1].length + EMPTY_CHECK.length,
    );
    const next = before + converted + after;
    const insert = `\n${bullet[1]}${EMPTY_CHECK}`;
    return { value: next.slice(0, splitAt) + insert + next.slice(splitAt), caret: splitAt + insert.length };
  }

  const insert = `\n${EMPTY_CHECK}`;
  return {
    value: value.slice(0, caret) + insert + value.slice(caret),
    caret: caret + insert.length,
  };
}

/** 저장 전 내용 없는 체크박스 줄을 지운다 */
export function dropEmptyChecks(title: string): string {
  return title
    .split('\n')
    .filter((line) => { const m = line.match(CHECK_RE); return !m || m[3].trim() !== ''; })
    .join('\n');
}
