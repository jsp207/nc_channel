// @ts-nocheck
// EPC 상품 조회 (epc-list.html): EPC에서 내려오는 상품을 조회 조건으로 찾는 읽기 전용 목록.
// 모든 행은 상품 전시와 같은 샘플(display-data.ts PO)이고, 컬럼은 EPC 상품ID · 버전 · EPC 상품명 · LV2 · LV3 · Product Spec · EPC 상태 · 최종등록일시.
// [다운로드]는 조회 결과를 같은 컬럼 + 상세 스펙(계약 속성 · 가격 · PS 구성 등)까지 담은 JSON으로 내려받는다(epc-export.ts).
import "./style.css";
import "./list.css";
import "./epc-list.css";
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import { PO, poBy, nowStamp, LV2S, LV3S } from "./display-data";
import { ST_LIST, epcRow, epcExport } from "./epc-export";

requireAuthentication();

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 샘플 데이터 ----------
const SIZE = 10;
const ST_CLS = { 출시: 'wait', 검증: 'chk', 운영: 'ok', 가입중단: 'stop', 퇴출: 'off' };
// 첫 페이지는 상태별 행을 한 번에 볼 수 있는 순서로 둔다
const HEAD_PO = ['PLN-020', 'PLN-021', 'PLN-022', 'DEV-001', 'DEV-002', 'DEV-003', 'ADD-001', 'DEV-030', 'PLN-023', 'ADD-008'];
const ROWS = [...HEAD_PO.map(poBy), ...PO.filter(p => !HEAD_PO.includes(p.id))].map(epcRow);

// ---------- 조회 조건 ----------
// 조회 조건은 [조회]를 눌러야 반영된다. LV3 목록은 고른 LV2에 속한 것만 보인다
const FILTERS = { fKey: 'key', fQ: 'q', fLv2: 'lv2', fLv3: 'lv3', fSt: 'st' };
const ST_DEF = () => ({ key: 'all', q: '', lv2: '', lv3: '', st: '' });
const st = { ...ST_DEF(), page: 1 };
const fill = (id, list) => { $(`#${id}`).innerHTML = ['', ...list].map(v => `<option value="${esc(v)}">${esc(v || '전체')}</option>`).join(''); };
const lv3Of = lv2 => Object.keys(LV3S).filter(k => !lv2 || LV3S[k].lv2 === lv2);
fill('fLv2', LV2S.filter(v => ROWS.some(r => r.lv2 === v))); fill('fLv3', lv3Of('')); fill('fSt', ST_LIST);
$('#fLv2').addEventListener('change', e => fill('fLv3', lv3Of(e.target.value)));

function filtered() {
  const q = st.q.toLowerCase();
  const has = v => v.toLowerCase().includes(q);
  const hitQ = r => !q || (st.key === 'name' ? has(r.name) : st.key === 'epc' ? has(r.epc) : st.key === 'spec' ? has(r.spec) || has(r.specId) : has(r.name) || has(r.epc) || has(r.spec) || has(r.specId) || has(r.po));
  return ROWS.filter(r => hitQ(r) && (!st.lv2 || r.lv2 === st.lv2) && (!st.lv3 || r.lv3 === st.lv3) && (!st.st || r.st === st.st));
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
  fill('fLv3', lv3Of(''));
  Object.entries(FILTERS).forEach(([id, k]) => $('#' + id).value = def[k]);
  applyFilter();
});

// ---------- 목록 ----------
const rowHtml = r => `<tr>
  <td><button type="button" class="lid" data-act="soon">${r.epc}</button></td>
  <td class="c">${esc(r.ver)}</td>
  <td title="${esc(r.name)}">${esc(r.name)}</td>
  <td>${esc(r.lv2)}</td>
  <td title="${esc(r.lv3)}">${esc(r.lv3)}</td>
  <td title="${esc(r.spec)}">${esc(r.spec)}</td>
  <td class="c"><span class="lb ${ST_CLS[r.st]}">${r.st}</span></td>
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
  const from = (st.page - 1) * SIZE, rows = list.slice(from, from + SIZE);
  $('#listTable tbody').innerHTML = rows.length ? rows.map(rowHtml).join('')
    : '<tr><td colspan="8" class="empty">조회 조건에 맞는 EPC 상품이 없어요. 검색 조건을 바꾸거나 초기화하세요.</td></tr>';
  $('#lCount').textContent = list.length.toLocaleString();
  $('#pager').innerHTML = pagerHtml(st.page, pages);
}
$('#pager').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; st.page = +b.dataset.p; render(); });
$('#listTable tbody').addEventListener('click', e => { if (e.target.closest('[data-act="soon"]')) alert('준비중입니다.'); });

// ---------- 다운로드 ----------
// 마지막으로 [조회]한 조건의 결과 전체(모든 페이지)를 JSON으로 내려받는다
$('#btnDown').addEventListener('click', () => {
  const list = filtered();
  if (!list.length) { alert('내려받을 EPC 상품이 없어요. 조회 조건을 바꿔 주세요.'); return; }
  const { page, ...cond } = st;
  const filter = Object.values(cond).some(v => v && v !== 'all') ? cond : null;
  const blob = new Blob([JSON.stringify(epcExport(list, filter), null, 2) + '\n'], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `EPC상품_조회결과_${nowStamp().replace(/[-: ]/g, '').slice(0, 12)}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
});

render();
