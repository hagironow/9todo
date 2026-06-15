// 빌드 산출물(out/sw.js)의 캐시 버전을 매 빌드마다 고유 값으로 스탬프한다.
// → 서비스워커 바이트가 바뀌므로 브라우저가 새 배포를 감지하고 조용히 새로고침.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const path = 'out/sw.js';
if (!existsSync(path)) {
  console.warn('[stamp-sw] out/sw.js 없음 — 스킵');
  process.exit(0);
}

const stamp = Date.now().toString(36);
const src = readFileSync(path, 'utf8');
const out = src.replace(/9todo-v[\w.]+/g, `9todo-${stamp}`);
writeFileSync(path, out);
console.log(`[stamp-sw] cache version → 9todo-${stamp}`);
