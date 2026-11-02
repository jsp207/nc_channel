// @ts-nocheck
// 결제수단 기준정보 관리 목록 (payment-method3.html): 결제수단 계약 한 건이 한 행이다. MID를 누르면 상세 페이지로 이동한다.
import "./style.css";
import "./list.css";
import "./payment3-list.css";
import { requireAuthentication } from "./auth";
import { CHANNELS, DB, KEYST, METHODS, OWNERS, PGS, STATUSES, TODAY, cornersOf, curFee, curSubFees, detailUrl, esc, expSoon, fmtFee, keyOk, livePromos, midEnd, midOf, pagerHtml, pgOf, takeFlash } from "./payment3-store";
import { toast } from "./payment3-status";

requireAuthentication();

const $ = s => document.querySelector(s);

// ---------- 조회 조건 ----------
// 조회 조건은 [조회]를 눌러야 반영된다.
const FILTERS = { fPg: 'pg', fMethod: 'method', fStatus: 'status', fKey: 'key', fMid: 'mid', fPurpose: 'purpose', fCh: 'ch', fOwner: 'owner', fQuick: 'quick', fFrom: 'from', fTo: 'to' };
const ST_DEF = () => ({ pg: '', method: '', status: '', key: '', mid: '', purpose: '', ch: '', owner: '', quick: '', from: '', to: '' });
const st = { ...ST_DEF(), page: 1, size: 10, flash: '' };
const QUICK = { keybad: '키 미확인·확인실패', sched: '적용 예정 요율 있음', exp: 'MID 만료 임박', promo: '프로모션 진행중', nocn: '코너 미사용' };
const fill = (id, list) => { $(`#${id}`).innerHTML = [['', '전체'], ...list.map(v => (Array.isArray(v) ? v : [v, v]))].map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join(''); };
fill('fPg', PGS.map(p => [p.id, p.name])); fill('fMethod', METHODS); fill('fStatus', STATUSES); fill('fKey', Object.entries(KEYST));
fill('fCh', CHANNELS); fill('fOwner', OWNERS); fill('fQuick', Object.entries(QUICK));

function quickHit(c, q) {
  const m = midOf(c);
  return !q || (q === 'keybad' ? !keyOk(m) : q === 'sched' ? c.fees.some(f => f.from > TODAY) : q === 'exp' ? expSoon(m) : q === 'promo' ? livePromos(c).length > 0 : !cornersOf(c).length);
}
function filtered() {
  return DB.contracts.filter(c => {
    const m = midOf(c);
    return (!st.pg || m.pg === st.pg) && (!st.method || c.method === st.method) && (!st.status || c.status === st.status) && (!st.key || m.ks === st.key)
      && (!st.mid || m.code.toLowerCase().includes(st.mid.toLowerCase())) && (!st.purpose || m.purpose.toLowerCase().includes(st.purpose.toLowerCase()))
      && (!st.ch || m.chs.includes(st.ch)) && (!st.owner || m.owner === st.owner) && quickHit(c, st.quick)
      // 적용기간은 MID 유효기간과 하루라도 겹치면 결과에 넣는다
      && (!st.from || midEnd(m) >= st.from) && (!st.to || m.from <= st.to);
  });
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
const KS_CLS = { ok: 'ok', manual: 'chk', none: 'wait', fail: 'stop' }, OP_CLS = { 사용: 'ok', 일시중지: 'wait', 미사용: 'off' };
const rowHtml = c => {
  const m = midOf(c), cf = curFee(c), kn = cornersOf(c).length, lp = livePromos(c).length, sf = curSubFees(c);
  return `<tr data-id="${c.id}" class="${st.flash === c.id ? 'flash' : ''}">
  <td>${esc(pgOf(m.pg).name)}</td>
  <td>${esc(c.method)}</td>
  <td class="c">${lp ? `<a class="lid" href="${detailUrl(c.id, 'promo')}" title="진행중 프로모션 ${lp}건">${lp}건</a>` : '<span style="color:var(--muted)">-</span>'}</td>
  <td><a class="lid pm3-mid" href="${detailUrl(c.id)}">${esc(m.code)}</a></td>
  <td title="${esc(m.purpose)}">${esc(m.purpose)}</td>
  <td title="${esc(m.settle)}">${esc(m.settle)}</td>
  <td><a class="pm3-fee" href="${detailUrl(c.id, 'fee')}" style="color:inherit;text-decoration:none">${cf ? fmtFee(cf) : '-'}</a>${sf.map(f => `<span class="pm3-sub" title="${esc(f.sub)}">${esc(f.sub)} ${fmtFee(f)}</span>`).join('')}</td>
  <td class="c"><span class="lb ${KS_CLS[m.ks]}">${KEYST[m.ks]}</span></td>
  <td class="c"><span class="lb ${OP_CLS[c.status]}">${c.status}</span></td>
  <td class="c">${kn ? `<a class="lid" href="${detailUrl(c.id, 'corner')}">${kn}개</a>` : '<span style="color:var(--muted)">0</span>'}</td>
  <td>${c.upd.slice(0, 10)}</td>
  <td title="${esc(c.by)}">${esc(c.by)}</td>
</tr>`;
};
function render() {
  // 최근 수정한 계약이 위로 온다. 같은 시각이면 나중에 만든 계약이 먼저다
  const list = filtered().sort((a, b) => b.upd.localeCompare(a.upd) || b.id.localeCompare(a.id));
  const pages = Math.max(1, Math.ceil(list.length / st.size));
  st.page = Math.min(st.page, pages);
  const rows = list.slice((st.page - 1) * st.size, st.page * st.size);
  $('#listTable tbody').innerHTML = rows.length ? rows.map(rowHtml).join('')
    : `<tr><td colspan="12" class="empty">조회 조건에 맞는 계약이 없어요. 검색 조건을 바꾸거나 초기화하세요.</td></tr>`;
  $('#lCount').textContent = list.length.toLocaleString();
  $('#lTotal').textContent = DB.contracts.length.toLocaleString();
  $('#pager').innerHTML = pagerHtml(st.page, pages);
  st.flash = '';
}

// ---------- 이벤트 ----------
$('#pager').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; st.page = +b.dataset.p; render(); });
$('#lSize').addEventListener('change', e => { st.size = +e.target.value; st.page = 1; render(); });

const flash = takeFlash();
if (flash) { st.flash = flash.id; toast(flash.msg); }
render();
