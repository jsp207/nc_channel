// @ts-nocheck
// 거래내역 대사관리 목록 (payment-recon3.html): 일대사 한 건(대사일 · MID)이 한 행이다. 결제이력 관리 목록과 같은 스타일을 쓴다.
// 거래(승인)대사와 입금대사는 위 탭으로 나눈다. Fail 건만 대사번호를 눌러 상세로 가고 불일치 내역을 내려받는다. 대기 건은 대사 파일을 직접 올려 대사를 돌린다(수동 병행).
// 합계는 머리줄 바로 아래 행에 두고, 페이지와 상관없이 조회 조건 전체를 더한다. 실제수수료 · 차액은 PG 데이터가 있는 건만 더한다.
import "./style.css";
import "./list.css";
import "./payment3-list.css";
import "./payment3-modal.css";
import "./payment3-recon-list.css";
import { requireAuthentication } from "./auth";
import { ME, PGS, esc, midById, pagerHtml, pgOf, redraw, stamp } from "./payment3-store";
import { FEED, MODES, PROCS, RC, RESULTS, TODAY, TYPES, applyFile, diffOf, misCsv, recUrl, saveRc, typeName, won } from "./payment3-recon-store";
import { toast } from "./payment3-status";

requireAuthentication();

const $ = s => document.querySelector(s);
const DEF = () => ({ from: '2026-10-20', to: TODAY, pg: '', mode: '', res: '', proc: '', mid: '', id: '' });
const st = { type: 'appr', f: DEF(), a: DEF(), page: 1, size: 10 };
// 상세에 다녀와도 탭 · 조회 조건 · 페이지를 유지한다
const LKEY = 'nova-payment-recon3-list';
try { const s = JSON.parse(sessionStorage.getItem(LKEY) || 'null'); if (s) Object.assign(st, s); } catch {}
const keep = () => { try { sessionStorage.setItem(LKEY, JSON.stringify({ type: st.type, f: st.f, a: st.a, page: st.page, size: st.size })); } catch {} };
let md = null;

// ---------- 조회 ----------
const has = (v, q) => !q || v.toLowerCase().includes(q.trim().toLowerCase());
function filtered(type = st.type) {
  const a = st.a;
  return RC.recs.filter(r => r.type === type && (!a.from || r.date >= a.from) && (!a.to || r.date <= a.to)
    && (!a.pg || r.pg === a.pg) && (!a.mode || r.mode === a.mode) && (!a.res || r.res === a.res) && (!a.proc || r.proc === a.proc)
    && has(midById(r.mid).code, a.mid) && has(r.id, a.id))
    .sort((x, y) => y.date.localeCompare(x.date) || x.id.localeCompare(y.id));
}
const search = () => { st.a = { ...st.f }; st.page = 1; render(); };
const reset = () => { st.f = DEF(); search(); };

// ---------- 화면 ----------
const opts = (list, v) => `<option value="">전체</option>${list.map(o => { const [val, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}`;
const sel = (k, label, list) => `<span class="lf-g"><label class="lf-l" for="f-${k}">${label}</label><select id="f-${k}">${opts(list, st.f[k])}</select></span>`;
const inp = (k, label, ph) => `<span class="lf-g"><label class="lf-l" for="f-${k}">${label}</label><input type="text" id="f-${k}" data-enter value="${esc(st.f[k])}" placeholder="${esc(ph)}"></span>`;
function searchBox() {
  const f = st.f;
  return `<form class="lst-filter" autocomplete="off">
    <div class="lf-row">${sel('pg', 'PG', PGS.map(p => [p.id, p.name]))}${sel('mode', '수집 방식', MODES)}${sel('res', '대사결과', RESULTS)}${sel('proc', '처리상태', PROCS)}</div>
    <div class="lf-row">${inp('mid', 'MID', 'MID 코드')}${inp('id', '대사번호', st.type === 'appr' ? 'RA로 시작' : 'RD로 시작')}</div>
    <div class="lf-row"><span class="lf-g lf-wide"><label class="lf-l" for="f-from">${st.type === 'appr' ? '대사일' : '입금일'}</label><span class="lf-range"><input type="date" id="f-from" value="${esc(f.from)}" aria-label="시작일"><span aria-hidden="true">~</span><input type="date" id="f-to" value="${esc(f.to)}" aria-label="종료일"></span></span>
      <span class="lf-acts"><button type="button" class="btn dark" data-a="reset">초기화</button><button type="button" class="btn primary" data-a="search">조회</button></span></div>
  </form>`;
}
const LB_CLS = { Pass: 'ok', Fail: 'stop', 대기: 'wait', 미처리: 'wait', 처리완료: 'ok', 자동: 'live', 수동: 'chk' };
const DASH = '<span class="pm3h-dim">-</span>';
const lb = s => (s ? `<span class="lb ${LB_CLS[s]}">${esc(s)}</span>` : DASH);
const money = v => (v == null ? DASH : won(v));
const diffHtml = v => (v == null ? DASH : v === 0 ? '<span class="pm3h-dim">0</span>' : `<span class="${v > 0 ? 'pm3h-bad' : 'pm3r-neg'}">${v > 0 ? '+' : ''}${won(v)}</span>`);
const rowHtml = r => {
  const m = midById(r.mid), fail = r.res === 'Fail';
  return `<tr data-id="${r.id}">
    <td>${r.date}</td>
    <td>${fail ? `<a class="lid pm3-mid" href="${recUrl(r.id)}">${r.id}</a>` : `<span class="pm3-mid">${r.id}</span>`}</td>
    <td title="${esc(pgOf(r.pg).name)}">${esc(pgOf(r.pg).name)}</td>
    <td title="${esc(m.purpose)}">${esc(m.code)}</td>
    <td class="c">${lb(r.mode)}</td>
    <td class="r">${won(r.cnt)}</td><td class="r">${won(r.amt)}</td><td class="r">${won(r.exp)}</td><td class="r">${money(r.act)}</td><td class="r">${diffHtml(diffOf(r))}</td>
    <td class="c">${lb(r.res)}</td>
    <td class="c">${r.res === '대기' ? `<button type="button" class="btn sm" data-up="${r.id}">파일 등록</button>` : lb(r.proc)}</td>
    <td class="c">${fail ? `<button type="button" class="btn sm" data-dl="${r.id}" aria-label="${r.id} 불일치 내역 다운로드">다운로드</button>` : DASH}</td>
  </tr>`;
};
function render() {
  const list = filtered(), pages = Math.max(1, Math.ceil(list.length / st.size));
  st.page = Math.min(st.page, pages);
  const rows = list.slice((st.page - 1) * st.size, st.page * st.size);
  const got = list.filter(r => r.act != null), sum = k => list.reduce((a, r) => a + r[k], 0);
  const act = got.reduce((a, r) => a + r.act, 0), diff = got.reduce((a, r) => a + diffOf(r), 0), fails = list.filter(r => r.res === 'Fail');
  const all = RC.recs.filter(r => r.type === st.type).length;
  redraw($('#v-list'), `<div class="breadcrumb" aria-label="현재 위치">홈 <span aria-hidden="true">›</span> 결제 관리 <span aria-hidden="true">›</span> <strong>거래내역 대사관리</strong></div>
  <h1 class="lst-title">거래내역 대사관리</h1>
  <div class="pm3r-tabs" role="tablist" aria-label="대사 구분">${TYPES.map(([k, l]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === st.type}" class="${k === st.type ? 'on' : ''}">${l}</button>`).join('')}</div>
  ${searchBox()}
  <div class="pm3-bar">
    <h2 class="lst-count">조회 결과 <span><b>${list.length.toLocaleString()}</b>건 / 전체 <span>${all.toLocaleString()}</span>건</span></h2>
    <div class="pm3-tools">
      <button type="button" class="btn" data-a="dlAll" ${fails.length ? '' : 'disabled'}>Fail 건 다운로드</button>
      <select id="lSize" aria-label="페이지당 행 수">${[10, 20, 50].map(n => `<option value="${n}" ${n === st.size ? 'selected' : ''}>${n}개씩</option>`).join('')}</select>
    </div>
  </div>
  <div class="lst-tw"><table class="lst-table" id="listTable">
    <colgroup><col class="w-dt"><col class="w-id"><col class="w-pg"><col class="w-mi"><col class="w-md"><col class="w-cn"><col class="w-am"><col class="w-ex"><col class="w-ac"><col class="w-df"><col class="w-rs"><col class="w-pr"><col class="w-dl"></colgroup>
    <thead><tr><th>${st.type === 'appr' ? '대사일' : '입금일'}</th><th>대사번호</th><th>PG</th><th>MID</th><th class="c">수집 방식</th><th class="r">거래건수</th><th class="r">거래금액</th><th class="r">예상수수료</th><th class="r">실제수수료</th><th class="r">차액</th><th class="c">대사결과</th><th class="c">처리상태</th><th class="c">불일치 내역</th></tr>
      <tr class="tot"><td colspan="5"></td><td class="r">${won(sum('cnt'))}</td><td class="r">${won(sum('amt'))}</td><td class="r">${won(sum('exp'))}</td><td class="r">${won(act)}</td><td class="r">${diffHtml(diff)}</td><td colspan="3"></td></tr></thead>
    <tbody>${rows.length ? rows.map(rowHtml).join('') : '<tr><td colspan="13" class="empty">조건에 맞는 대사 결과가 없어요. 기간을 넓히거나 초기화해 보세요.</td></tr>'}</tbody>
  </table></div>
  <nav class="lst-pager" aria-label="페이지">${pagerHtml(st.page, pages)}</nav>`);
  keep();
}

// ---------- 다운로드 ----------
function dl(recs, file) {
  const n = misCsv(recs, file);
  toast(`Fail ${recs.length}건의 불일치 내역 ${n}행을 내려받았어요.`);
}
const ymd = d => d.replace(/-/g, '');

// ---------- 대사 파일 등록 (수동) ----------
const root = () => $('#modal-root');
function openUp(id) { md = { id, file: '', busy: false, focus: document.activeElement }; drawUp(); root().querySelector('.pm-x')?.focus(); }
function closeUp() { const f = md?.focus; md = null; root().innerHTML = ''; f?.focus?.(); }
function drawUp() {
  const r = RC.recs.find(x => x.id === md.id), m = midById(r.mid), feed = FEED[r.pg], g = md.file ? '' : '대사 파일을 선택해 주세요.';
  root().innerHTML = `<div class="pm-dim"><div class="pm-box" role="dialog" aria-modal="true" aria-labelledby="upTitle">
    <div class="pm-h"><div><h2 id="upTitle">대사 파일 등록</h2><p>${esc(r.id)} · ${esc(typeName(r.type))} · ${r.date}</p></div><button type="button" class="pm-x" data-close aria-label="닫기">×</button></div>
    <div class="pm-b">${md.busy ? '<p class="pm3h-dim" style="text-align:center;padding:30px 0">파일을 읽고 대사를 실행하고 있어요…</p>' : `
      <div class="pm-form">
        <div class="pm-l">PG / MID</div><div class="pm-c">${esc(pgOf(r.pg).name)} · <span class="pm-mono">${esc(m.code)}</span> ${esc(m.purpose)}</div>
        <div class="pm-l">수집 방식</div><div class="pm-c">${feed.mode === '수동' ? '수동 (PG 자동 제공 안 됨)' : `자동 (${esc(feed.how)}) · PG 데이터 미수신으로 수동 등록`}</div>
        <div class="pm-l"><label for="upFile">대사 파일 <i>*</i></label></div><div class="pm-c"><input type="file" id="upFile" accept=".csv,.xlsx,.xls"></div>
      </div>
      <div class="pm-info" style="margin-top:14px">PG 관리자 화면에서 받은 ${r.type === 'appr' ? '승인' : '입금'} 내역 파일(CSV, Excel)을 올리면 바로 대사를 실행해요.</div>`}</div>
    <div class="pm-f"><span class="pm-why">${md.busy ? '' : esc(g)}</span><button type="button" class="btn" data-close ${md.busy ? 'disabled' : ''}>취소</button><button type="button" class="btn primary" id="upOk" ${g || md.busy ? 'disabled' : ''}>등록 후 대사 실행</button></div>
  </div></div>`;
}
async function doUp() {
  if (!md || !md.file || md.busy) return;
  const r = RC.recs.find(x => x.id === md.id);
  md.busy = true; drawUp();
  await new Promise(res => setTimeout(res, 900));
  applyFile(r, md.file, stamp(), ME);
  saveRc(); closeUp(); render();
  toast(r.res === 'Pass' ? `${r.id} 대사 결과 Pass예요.` : `${r.id} 대사 결과 Fail이에요. 불일치 ${r.mis.length}건을 확인해 주세요.`, r.res === 'Fail');
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  const t = e.target, p = t.closest('[data-p]');
  if (md) {
    if (md.busy) return;
    if (t.closest('[data-close]') || t.classList.contains('pm-dim')) closeUp();
    else if (t.closest('#upOk')) doUp();
    return;
  }
  if (p) { if (!p.disabled) { st.page = +p.dataset.p; render(); } return; }
  const tab = t.closest('[data-t]');
  if (tab) { if (tab.dataset.t !== st.type) { st.type = tab.dataset.t; st.page = 1; render(); } return; }
  const up = t.closest('[data-up]');
  if (up) { openUp(up.dataset.up); return; }
  const d = t.closest('[data-dl]');
  if (d) { const r = RC.recs.find(x => x.id === d.dataset.dl); dl([r], `불일치내역_${r.id}.csv`); return; }
  const a = t.closest('[data-a]');
  if (a && !a.disabled) ({ search, reset, dlAll: () => dl(filtered().filter(r => r.res === 'Fail'), `불일치내역_${typeName(st.type).replace(/[()]/g, '')}_${ymd(st.a.from || '')}-${ymd(st.a.to || '')}.csv`) })[a.dataset.a]();
});
document.addEventListener('change', e => {
  const t = e.target, k = t.id.replace(/^f-/, '');
  if (t.id === 'upFile') { md.file = t.files[0]?.name || ''; const ok = $('#upOk'); ok.disabled = !md.file; root().querySelector('.pm-why').textContent = md.file ? '' : '대사 파일을 선택해 주세요.'; }
  else if (t.id === 'lSize') { st.size = +t.value; st.page = 1; render(); }
  else if (k in st.f) st.f[k] = t.value;
});
document.addEventListener('input', e => { const k = e.target.id?.replace(/^f-/, ''); if (e.target.hasAttribute?.('data-enter') && k in st.f) st.f[k] = e.target.value; });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && md && !md.busy) closeUp();
  else if (e.key === 'Enter' && e.target.hasAttribute?.('data-enter')) { e.preventDefault(); search(); }
});

render();
