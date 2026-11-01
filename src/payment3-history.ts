// @ts-nocheck
// 결제이력 관리 목록 (payment-history3.html): 거래 한 건이 한 행이다. 주문번호를 누르면 결제 상세 페이지로 이동한다.
// 합계는 머리줄 바로 아래 행에 두고, 페이지와 상관없이 조회 조건 전체를 더한다(결제실패 제외, V20). 체크한 행은 엑셀로 내려받는다.
import "./style.css";
import "./list.css";
import "./payment3-list.css";
import "./payment3-history-list.css";
import { requireAuthentication } from "./auth";
import { METHODS, PGS, esc, pagerHtml, redraw } from "./payment3-store";
import { BSSST, PAYST, TODAY, TX, nextAct, txUrl, won } from "./payment3-history-store";
import { toast } from "./payment3-status";

requireAuthentication();

const $ = s => document.querySelector(s);
const DEF = () => ({ from: '2026-10-01', to: TODAY, group: '', order: '', tid: '', pg: '', mid: '', method: '', pay: '', bss: '' });
const st = { f: DEF(), a: DEF(), page: 1, size: 10, sel: new Set() };
// 상세에 다녀와도 조회 조건과 페이지를 유지한다
const LKEY = 'nova-payment-history3-list';
try { const s = JSON.parse(sessionStorage.getItem(LKEY) || 'null'); if (s) Object.assign(st, s); } catch {}
const keep = () => { try { sessionStorage.setItem(LKEY, JSON.stringify({ f: st.f, a: st.a, page: st.page, size: st.size })); } catch {} };

// ---------- 조회 ----------
const has = (v, q) => !q || v.toLowerCase().includes(q.trim().toLowerCase());
function filtered() {
  const a = st.a;
  return TX.txs.filter(t => {
    const d = t.at.slice(0, 10);
    return (!a.from || d >= a.from) && (!a.to || d <= a.to) && has(t.group, a.group) && has(t.order, a.order) && has(t.id, a.tid)
      && (!a.pg || t.snap.pgId === a.pg) && has(t.snap.mid, a.mid) && (!a.method || t.snap.method === a.method)
      && (!a.pay || t.st === a.pay)
      && (!a.bss || (a.bss === 'bad' ? ['반영실패', '불일치'].includes(t.bss) : t.bss === a.bss));
  }).sort((x, y) => y.at.localeCompare(x.at) || y.id.localeCompare(x.id));
}
const search = () => { st.a = { ...st.f }; st.page = 1; st.sel.clear(); render(); };
const reset = () => { st.f = DEF(); search(); };

// ---------- 화면 ----------
const opts = (list, v) => `<option value="">전체</option>${list.map(o => { const [val, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}`;
const sel = (k, label, list) => `<span class="lf-g"><label class="lf-l" for="f-${k}">${label}</label><select id="f-${k}">${opts(list, st.f[k])}</select></span>`;
const inp = (k, label, ph) => `<span class="lf-g"><label class="lf-l" for="f-${k}">${label}</label><input type="text" id="f-${k}" data-enter value="${esc(st.f[k])}" placeholder="${esc(ph)}"></span>`;
// 결제수단 기준정보 목록과 같은 4칸 세 줄. 조건은 [조회]를 눌러야 반영되고, 버튼은 마지막 줄 오른쪽
function searchBox() {
  const f = st.f;
  return `<form class="lst-filter" autocomplete="off">
    <div class="lf-row">${sel('pg', 'PG', PGS.map(p => [p.id, p.name]))}${sel('method', '결제수단', METHODS)}${sel('pay', '결제상태', PAYST)}${sel('bss', 'BSS 반영', [...BSSST, ['bad', '실패·불일치']])}</div>
    <div class="lf-row">${inp('mid', 'MID', 'MID 코드')}${inp('group', '그룹 ID', '예) G-001')}${inp('order', '주문번호', 'OD로 시작')}${inp('tid', '거래번호', 'TX로 시작')}</div>
    <div class="lf-row"><span class="lf-g lf-wide"><label class="lf-l" for="f-from">결제일</label><span class="lf-range"><input type="date" id="f-from" value="${esc(f.from)}" aria-label="결제일 시작"><span aria-hidden="true">~</span><input type="date" id="f-to" value="${esc(f.to)}" aria-label="결제일 종료"></span></span>
      <span class="lf-acts"><button type="button" class="btn dark" data-a="reset">초기화</button><button type="button" class="btn primary" data-a="search">조회</button></span></div>
  </form>`;
}
// 상태 배지는 결제수단 목록과 같은 .lb를 쓴다
const LB_CLS = { 결제완료: 'ok', 부분취소: 'chk', 전체취소: 'off', 결과미확인: 'wait', 결제실패: 'stop', 반영완료: 'ok', 반영대기: 'live', 반영실패: 'stop', 불일치: 'wait' };
const DASH = '<span class="pm3h-dim">-</span>';
const lb = s => (s === '-' ? DASH : `<span class="lb ${LB_CLS[s]}">${esc(s)}</span>`);
const rowHtml = t => {
  const na = nextAct(t), fail = t.st === '결제실패', on = st.sel.has(t.id), dim = fail ? 'pm3h-dim' : '';
  return `<tr class="${on ? 'sel' : ''}" data-id="${t.id}">
    <td class="c"><input type="checkbox" id="chk-${t.id}" data-chk="${t.id}" ${on ? 'checked' : ''} aria-label="${t.id} 선택"></td>
    <td>${esc(t.group)}</td>
    <td><a class="lid pm3-mid" href="${txUrl(t.id)}">${esc(t.order)}</a></td>
    <td title="${esc(t.product)}">${esc(t.product)}</td>
    <td title="${esc(t.snap.pg)}">${esc(t.snap.pg)}</td>
    <td>${esc(t.snap.method)}</td>
    <td title="${esc(t.snap.mid)}">${esc(t.snap.mid)}</td>
    <td class="r ${dim}">${won(t.amount)}</td>
    <td class="r">${t.cancel ? `<span class="pm3h-bad">-${won(t.cancel)}</span>` : '<span class="pm3h-dim">0</span>'}</td>
    <td class="r ${dim}">${won(fail ? 0 : t.amount - t.cancel)}</td>
    <td class="c">${lb(t.st)}</td><td class="c">${lb(t.bss)}</td>
    <td>${esc(t.at)}</td>
    <td class="c">${na ? `<a class="btn sm" href="${txUrl(t.id)}">${na}</a>` : DASH}</td>
  </tr>`;
};
function render() {
  const list = filtered(), pages = Math.max(1, Math.ceil(list.length / st.size));
  st.page = Math.min(st.page, pages);
  const rows = list.slice((st.page - 1) * st.size, st.page * st.size), allOn = rows.length && rows.every(t => st.sel.has(t.id));
  const ok = list.filter(t => t.st !== '결제실패'), amt = ok.reduce((a, t) => a + t.amount, 0), can = ok.reduce((a, t) => a + t.cancel, 0);
  const picked = list.filter(t => st.sel.has(t.id)).length;
  redraw($('#v-list'), `<div class="breadcrumb" aria-label="현재 위치">홈 <span aria-hidden="true">›</span> 결제 관리 <span aria-hidden="true">›</span> <strong>결제이력 관리</strong></div>
  <h1 class="lst-title">결제이력 관리</h1>
  ${searchBox()}
  <div class="pm3-bar">
    <h2 class="lst-count">조회 결과 <span><b>${list.length.toLocaleString()}</b>건 / 전체 <span>${TX.txs.length.toLocaleString()}</span>건</span></h2>
    <div class="pm3-tools">${picked ? `<span class="pm3h-picked">선택 <b>${picked}</b>건</span><button type="button" class="pm3h-clear" data-a="clear">선택 해제</button>` : ''}
      <button type="button" class="btn" data-a="excel" ${list.length ? '' : 'disabled'}>${picked ? '선택 건 엑셀 다운로드' : '엑셀 다운로드'}</button>
      <select id="lSize" aria-label="페이지당 행 수">${[10, 20, 50].map(n => `<option value="${n}" ${n === st.size ? 'selected' : ''}>${n}개씩</option>`).join('')}</select>
    </div>
  </div>
  <div class="lst-tw"><table class="lst-table" id="listTable">
    <colgroup><col class="w-ck"><col class="w-gr"><col class="w-or"><col class="w-pd"><col class="w-pg"><col class="w-me"><col class="w-mi"><col class="w-am"><col class="w-ca"><col class="w-ne"><col class="w-st"><col class="w-bs"><col class="w-at"><col class="w-ac"></colgroup>
    <thead><tr><th class="c"><input type="checkbox" id="chkAll" ${allOn ? 'checked' : ''} aria-label="현재 페이지 전체 선택"></th><th>그룹 ID</th><th>주문번호</th><th>상품명</th><th>PG</th><th>결제수단</th><th>MID</th><th class="r">결제금액</th><th class="r">취소금액</th><th class="r">총금액</th><th class="c">결제상태</th><th class="c">BSS 반영</th><th>결제일시</th><th class="c">처리상태</th></tr>
      <tr class="tot"><td colspan="7"></td><td class="r">${won(amt)}</td><td class="r pm3h-bad">${can ? `-${won(can)}` : '0'}</td><td class="r">${won(amt - can)}</td><td colspan="4"></td></tr></thead>
    <tbody>${rows.length ? rows.map(rowHtml).join('') : '<tr><td colspan="14" class="empty">조건에 맞는 결제가 없어요. 기간을 넓히거나 초기화해 보세요.</td></tr>'}</tbody>
  </table></div>
  <nav class="lst-pager" aria-label="페이지">${pagerHtml(st.page, pages)}</nav>`);
  keep();
}

// ---------- 엑셀 ----------
// 체크한 건만 내려받고, 체크가 없으면 조회 결과 전체를 내려받는다. 표 머리글과 같은 순서에 거래번호를 더한다
function excel() {
  const list = filtered(), picked = list.filter(t => st.sel.has(t.id)), rows = picked.length ? picked : list;
  const head = ['그룹 ID', '주문번호', '거래번호', '상품명', 'PG', '결제수단', 'MID', '결제금액', '취소금액', '총금액', '결제상태', 'BSS 반영', '결제일시', '처리상태'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const text = '﻿' + [head, ...rows.map(t => [t.group, t.order, t.id, t.product, t.snap.pg, t.snap.method, t.snap.mid, t.amount, t.cancel, t.st === '결제실패' ? 0 : t.amount - t.cancel, t.st, t.bss, t.at, nextAct(t)])].map(r => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = `결제이력_${TODAY.replace(/-/g, '')}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  toast(`결제이력 ${rows.length}건을 내려받았어요.`);
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  const t = e.target, p = t.closest('[data-p]');
  if (p) { if (!p.disabled) { st.page = +p.dataset.p; render(); } return; }
  const a = t.closest('[data-a]');
  if (a && !a.disabled) ({ search, reset, excel, clear: () => { st.sel.clear(); render(); } })[a.dataset.a]();
});
document.addEventListener('change', e => {
  const t = e.target, k = t.id.replace(/^f-/, '');
  if (t.id === 'chkAll') {
    const list = filtered(), rows = list.slice((st.page - 1) * st.size, st.page * st.size);
    rows.forEach(x => (t.checked ? st.sel.add(x.id) : st.sel.delete(x.id)));
    render();
  } else if (t.dataset.chk) { t.checked ? st.sel.add(t.dataset.chk) : st.sel.delete(t.dataset.chk); render(); }
  else if (t.id === 'lSize') { st.size = +t.value; st.page = 1; render(); }
  else if (k in st.f) st.f[k] = t.value;
});
document.addEventListener('input', e => { const k = e.target.id?.replace(/^f-/, ''); if (e.target.hasAttribute?.('data-enter') && k in st.f) st.f[k] = e.target.value; });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.hasAttribute?.('data-enter')) { e.preventDefault(); search(); } });

render();
