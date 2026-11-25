// 히스토리 데이터(src/history-data.ts) 점검
//   node scripts/check-history.mjs        → 어긋난 곳만 출력
//   node scripts/check-history.mjs --fix  → 각 HTML <title>을 히스토리 제목으로 맞춤
// 점검: 파일 존재 / 중복 / vite 입력에 있는데 히스토리에 없는 화면 / LNB href가 히스토리에 있는지 / <title> 일치
import fs from 'node:fs';
import { SCREENS, POLICIES, LEGACY_MENUS, screenTitle, policyTitle } from '../src/history-data.ts';

const FIX = process.argv.includes('--fix');
const SUFFIX = ' | NC-Channel Product Admin';
// 히스토리 대상이 아닌 화면. 상품 전시 관리의 예전 단독 목록 파일은 버전별 목록 · 등록 통합 파일로 옮겨(11-25) 히스토리에서 뺐다(파일은 다른 화면 링크 때문에 남긴다)
const NOT_HISTORY = new Set(['index.html', 'bo-intro.html', 'display-list.html', 'display-list2.html', 'product-list.html']);
const problems = [];

const entries = [
  ...SCREENS.map(s => ({ file: s.file, title: screenTitle(s) })),
  ...Object.values(POLICIES).flat().map(p => ({ file: p.file, title: policyTitle(p) })),
];

// 중복
const seen = new Set();
for (const e of entries) {
  if (seen.has(e.file)) problems.push(`중복: ${e.file}`);
  seen.add(e.file);
}

// vite 입력에 있는데 히스토리에 없는 화면
const vite = fs.readFileSync('vite.config.ts', 'utf8');
for (const [, f] of vite.matchAll(/:\s*'([^']+\.html)'/g)) {
  if (!NOT_HISTORY.has(f) && !seen.has(f)) problems.push(`히스토리 누락: ${f} (vite.config.ts에는 있음)`);
}
for (const e of entries) {
  if (!vite.includes(`'${e.file}'`)) problems.push(`vite 입력 누락: ${e.file}`);
}

// LNB: 메뉴 href가 같은 메뉴의 히스토리 화면이어야 Latest가 잡힌다
const lnb = fs.readFileSync('src/lnb.ts', 'utf8');
const lnbMenus = new Set();
for (const [, label, href] of lnb.matchAll(/label: '([^']+)', icon: '[^']+', href: '([^']*)'/g)) {
  lnbMenus.add(label);
  if (!href || NOT_HISTORY.has(href)) continue;
  if (!SCREENS.some(s => s.menu === label && s.file === href)) problems.push(`LNB '${label}' → ${href}: 히스토리에 같은 메뉴로 등록되어 있지 않아 Latest가 표시되지 않음`);
}
const legacy = new Set(Object.values(LEGACY_MENUS).flat());
for (const m of new Set(SCREENS.map(s => s.menu))) {
  if (!lnbMenus.has(m) && !legacy.has(m)) problems.push(`메뉴 이름 불일치: '${m}' (LNB에도 LEGACY_MENUS에도 없음)`);
}
for (const p of Object.values(POLICIES).flat()) {
  for (const f of p.for) {
    if (!SCREENS.some(s => s.menu === f.menu && s.ver === f.ver)) problems.push(`정책 ${p.file}: 대상 '${f.menu} v${f.ver}' 화면이 없음`);
  }
}

// 파일 존재 + <title>
let fixed = 0;
for (const e of entries) {
  if (!fs.existsSync(e.file)) { problems.push(`파일 없음: ${e.file}`); continue; }
  const html = fs.readFileSync(e.file, 'utf8');
  const m = html.match(/<title>([^<]*)<\/title>/);
  const want = e.title + SUFFIX;
  if (m && m[1] === want) continue;
  if (FIX && m) { fs.writeFileSync(e.file, html.replace(m[0], `<title>${want}</title>`)); fixed++; continue; }
  problems.push(`<title> 불일치: ${e.file}\n    현재: ${m ? m[1] : '(없음)'}\n    기대: ${want}`);
}

if (FIX) console.log(`<title> ${fixed}개 수정`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }
else console.log(`OK: 화면 ${SCREENS.length}개, 정책 ${Object.values(POLICIES).flat().length}개`);
