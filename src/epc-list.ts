// @ts-nocheck
// EPC 상품 조회 (epc-list.html): EPC에서 내려오는 상품을 조회 조건으로 찾는 읽기 전용 목록.
// 연결 상품은 상품 전시와 같은 샘플(display-data.ts PO)이고, 전시 상품수는 그 상품을 연결한 전시 수다. 나머지 행은 화면 확인용 샘플이다.
import "./style.css";
import "./list.css";
import "./epc-list.css";
import { requireAuthentication } from "./auth";
import { PO, poBy, seedNum } from "./display-data";
import { usedIn } from "./display-rules";

requireAuthentication();

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 샘플 데이터 ----------
const TOTAL = 100, SIZE = 10;
const ST_CLS = { 출시: 'wait', 검증: 'chk', 운영: 'ok', 가입중단: 'stop', 퇴출: 'off' };
const ORD_LINE = '요금제/부가서비스 주문', ORD_DEV = '단말 주문';
// EPC 상품 구분(PO.type) → 상품 구분 · 상품 유형 · 주문 유형
const PO_KIND = {
  기기서비스: p => ['기기서비스', p.cat || '단말', ORD_DEV],
  액세서리: () => ['기기서비스', '액세서리', ORD_DEV],
  요금제: () => ['이동전화', '요금제', ORD_LINE],
  부가서비스: () => ['이동전화', '부가서비스', ORD_LINE],
  보험: () => ['이동전화', '보험', ORD_LINE],
  구독서비스: () => ['구독서비스', '구독', '구독 주문'],
  제휴: () => ['제휴서비스', '제휴', '제휴 주문'],
};
const stamp = name => { const h = seedNum(name), p = n => String(n).padStart(2, '0'); return `2026.${p(1 + h % 10)}.${p(1 + h % 28)} ${p(h % 24)}:${p(h % 60)}:${p((h >>> 3) % 60)}`; };
let genNo = 4000;
const row = (name, ver, group, type, st, n, ord, po) => { const epc = po ? po.epc : String(++genNo).padStart(6, '0'); return { epc, ver, name, group, type, st, n, ord, po: po ? po.id : `PO-${epc}`, spec: `SPEC-${epc}`, at: stamp(name) }; };
const poRow = p => { const [group, type, ord] = PO_KIND[p.type](p); return row(p.name, p.ver, group, type, '운영', () => usedIn(p.id), ord, p); };
// 전시에 연결되지 않은 샘플 상품. 상태는 이름으로 정해 새로고침해도 같게 둔다
const GEN_ST = ['운영', '운영', '운영', '운영', '출시', '검증', '가입중단', '퇴출'];
const gen = (group, type, ord, names) => names.map(n => { const h = seedNum(n), st = GEN_ST[h % GEN_ST.length]; return row(n, `v1.${h % 4}`, group, type, st, st === '퇴출' ? 0 : 1 + h % 6, ord); });
const combos = (models, caps, colors) => models.flatMap(m => caps.flatMap(c => colors.map(k => `${m} ${c} ${k}`)));

// 첫 페이지는 상태별 행을 한 번에 볼 수 있는 순서로 둔다
const HEAD_PO = ['DEV-001', 'DEV-002', 'DEV-003', 'ADD-001'];
const ROWS = [
  row('5G 프리미엄', 'v1.2', '이동전화', '요금제', '출시', 3, '없음'),
  row('5G 스탠다드', 'v1.0', '이동전화', '요금제', '검증', 4, ORD_LINE),
  row('5G 라이트', 'v1.1', '이동전화', '요금제', '운영', 2, ORD_LINE),
  ...HEAD_PO.map(id => poRow(poBy(id))),
  row('갤럭시 탭 S10 FE 128GB 그레이', 'v1.0', '기기서비스', '태블릿', '가입중단', 1, ORD_DEV),
  row('T플랜 스몰', 'v2.3', '이동전화', '요금제', '퇴출', 0, ORD_LINE),
  row('컬러링 클래식', 'v1.4', '이동전화', '부가서비스', '퇴출', 0, ORD_LINE),
  ...PO.filter(p => !HEAD_PO.includes(p.id)).map(poRow),
  ...gen('이동전화', '요금제', ORD_LINE, ['5GX 레귤러', '5GX 레귤러플러스', 'T플랜 세이브', 'T플랜 안심', 'T플랜 에센스', '0틴 5G', '0청년 5G', '0플랜 라지', '시니어 안심', '다이렉트 5G 27', '다이렉트 5G 48', '다이렉트 5G 69']),
  ...gen('이동전화', '부가서비스', ORD_LINE, ['T끼리 데이터 선물', '안심문자', '데이터 안심옵션', '스팸차단 플러스', '로밍 baro', '콜키퍼', 'T전화 프리미엄', '링투유', '듀얼넘버', '캐치콜']),
  ...gen('기기서비스', '단말', ORD_DEV, combos(['갤럭시 S26', '갤럭시 S26+', '갤럭시 S26 Ultra', 'iPhone 18', 'iPhone 18 Air', '갤럭시 Z 폴드8'], ['256GB', '512GB'], ['블랙', '화이트', '블루'])),
  ...gen('기기서비스', '태블릿', ORD_DEV, ['갤럭시 탭 S11+ 256GB 그레이', '갤럭시 탭 S11 Ultra 512GB 그레이', 'iPad mini 7 128GB 스타라이트', 'iPad 11 128GB 실버']),
  ...gen('기기서비스', '웨어러블', ORD_DEV, ['갤럭시 워치8 44mm 그라파이트', '갤럭시 워치 FE 40mm 블랙', 'Apple Watch SE 3 44mm 미드나이트', '갤럭시 링2 10호 티타늄']),
].slice(0, TOTAL);
const count = r => typeof r.n === 'function' ? r.n() : r.n;

// ---------- 조회 조건 ----------
// 조회 조건은 [조회]를 눌러야 반영된다.
const FILTERS = { fKey: 'key', fQ: 'q', fGroup: 'group', fType: 'type', fSt: 'st', fOrd: 'ord' };
const ST_DEF = () => ({ key: 'all', q: '', group: '', type: '', st: '', ord: '' });
const st = { ...ST_DEF(), page: 1 };
const fill = (id, list) => { $(`#${id}`).innerHTML = ['', ...list].map(v => `<option value="${esc(v)}">${esc(v || '전체')}</option>`).join(''); };
const uniq = k => [...new Set(ROWS.map(r => r[k]))];
fill('fGroup', uniq('group')); fill('fType', uniq('type')); fill('fSt', Object.keys(ST_CLS)); fill('fOrd', uniq('ord'));

function filtered() {
  const q = st.q.toLowerCase();
  const has = v => v.toLowerCase().includes(q);
  const hitQ = r => !q || (st.key === 'name' ? has(r.name) : st.key === 'po' ? has(r.po) : st.key === 'spec' ? has(r.spec) : has(r.name) || has(r.po) || has(r.spec));
  return ROWS.filter(r => hitQ(r) && (!st.group || r.group === st.group) && (!st.type || r.type === st.type) && (!st.st || r.st === st.st) && (!st.ord || r.ord === st.ord));
}
function applyFilter() {
  Object.entries(FILTERS).forEach(([id, k]) => st[k] = $('#' + id).value.trim());
  st.page = 1;
  render();
}
$('#lFilter').addEventListener('submit', e => { e.preventDefault(); applyFilter(); });
$('#lFilter').addEventListener('reset', e => {
  e.preventDefault();
  const def = ST_DEF();
  Object.entries(FILTERS).forEach(([id, k]) => $('#' + id).value = def[k]);
  applyFilter();
});

// ---------- 목록 ----------
const rowHtml = r => `<tr>
  <td><button type="button" class="lid" data-act="soon">${r.epc}</button></td>
  <td>${esc(r.ver)}</td>
  <td title="${esc(r.name)}">${esc(r.name)}</td>
  <td>${esc(r.group)}</td>
  <td>${esc(r.type)}</td>
  <td class="c"><span class="lb ${ST_CLS[r.st]}">${r.st}</span></td>
  <td><button type="button" class="lid" data-act="soon">${count(r)}개</button></td>
  <td>${esc(r.ord)}</td>
  <td class="c">${r.at}</td>
</tr>`;
// 페이지 번호는 9개까지 보이고, 넘치면 … 뒤에 마지막 페이지
const PG_IC = { first: '<path d="M7 6v12M17 6l-6 6 6 6"/>', prev: '<path d="m15 6-6 6 6 6"/>', next: '<path d="m9 6 6 6-6 6"/>', last: '<path d="M17 6v12M7 6l6 6-6 6"/>' };
function pagerHtml(page, pages) {
  const b = (p, label, ic, dis) => `<button type="button" data-p="${p}" aria-label="${label}" ${dis ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${PG_IC[ic]}</svg></button>`;
  let nums;
  if (pages <= 9) nums = Array.from({ length: pages }, (_, i) => i + 1);
  else { const s = Math.max(1, Math.min(page - 4, pages - 9)); nums = [...Array.from({ length: 9 }, (_, i) => s + i), '…', pages]; }
  return b(1, '첫 페이지', 'first', page === 1) + b(page - 1, '이전 페이지', 'prev', page === 1)
    + nums.map(n => n === '…' ? '<button type="button" disabled aria-hidden="true">…</button>' : `<button type="button" data-p="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`).join('')
    + b(page + 1, '다음 페이지', 'next', page === pages) + b(pages, '마지막 페이지', 'last', page === pages);
}
function render() {
  const list = filtered(), pages = Math.max(1, Math.ceil(list.length / SIZE));
  st.page = Math.min(st.page, pages);
  const rows = list.slice((st.page - 1) * SIZE, st.page * SIZE);
  $('#listTable tbody').innerHTML = rows.length ? rows.map(rowHtml).join('')
    : '<tr><td colspan="9" class="empty">조회 조건에 맞는 EPC 상품이 없어요. 검색 조건을 바꾸거나 초기화하세요.</td></tr>';
  $('#lCount').textContent = list.length.toLocaleString();
  $('#pager').innerHTML = pagerHtml(st.page, pages);
}
$('#pager').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; st.page = +b.dataset.p; render(); });
$('#listTable tbody').addEventListener('click', e => { if (e.target.closest('[data-act="soon"]')) alert('준비중입니다.'); });

render();
