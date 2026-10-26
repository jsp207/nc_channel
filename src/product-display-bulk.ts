// @ts-nocheck
// 상품 전시 일괄 관리 v0.2 (product-display-bulk.html)
// 네이버 스마트스토어의 Multi Select + Bulk Action, 카페24의 일괄 변경·엑셀 대량 관리를 참고한 프로토타입.
// 데이터는 display-create2.html 상품 전시 목록과 같은 저장소(display-data.ts)를 쓴다. 여기서 바꾸면 상품 전시 목록에도 그대로 보인다.
// 엑셀은 Excel에서 바로 열리는 CSV로 주고받는다.
import "./style.css";
import "./list.css";
import "./product-display-bulk.css";
import { requireAuthentication } from "./auth";
import { DISPLAYS, SVCS, CHS, TODAY, saveList, reloadList, norm, newDisplay, nameText, dispId, nextDisplayId, nowStamp, EDITOR } from "./display-data";

requireAuthentication();

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 기준값 ----------
const SALE = { live: '판매중', wait: '판매대기', soldout: '품절', stop: '판매중지' };
const DISP = { Y: '전시', N: '미전시' };
const FIELD = { sale: '판매상태', disp: '전시여부', ch: '전시 채널', period: '전시기간', rank: '노출순위' };
const SALE_KEYS = Object.keys(SALE);
const pad = n => String(n).padStart(2, '0');
const clone = o => JSON.parse(JSON.stringify(o));
const chText = l => !l.length ? '-' : CHS.every(c => l.includes(c)) ? 'All 채널' : l[0] + (l.length > 1 ? ` 외 ${l.length - 1}` : '');

// ---------- 전시 → 목록 행 ----------
// 행은 상품 전시(DISPLAYS)를 그대로 읽고 쓰는 창이다. 전시명 · 전시 유형 · 전시 채널 · 전시여부 · 전시기간은 상품 전시 관리와 같은 값,
// 판매상태 · 노출순위는 일괄 관리에서 정하는 값으로 전시에 함께 저장한다.
const views = new WeakMap();
function view(d) {
  if (views.has(d)) return views.get(d);
  const p = (get, set) => ({ get, set, enumerable: true });
  const v = Object.defineProperties({}, {
    _d: { value: d },
    id: { get: () => dispId(d.id), enumerable: true },
    name: p(() => nameText(d.name), x => { if (x !== nameText(d.name)) d.name = x; }),
    area: p(() => d.svc || '', x => d.svc = x),
    ch: p(() => d.channels.slice(), x => d.channels = CHS.filter(c => x.includes(c))),
    sale: p(() => d.sale || 'live', x => d.sale = x),
    disp: p(() => d.show ? 'Y' : 'N', x => d.show = x === 'Y'),
    rank: p(() => d.rank || Math.min(999, d.id), x => d.rank = x),
    from: p(() => d.from || '', x => d.from = x),
    to: p(() => d.noEnd ? '' : d.to || '', x => { d.to = x; d.noEnd = !x; }),
    upd: { get: () => (d.updatedAt || `${d.from || TODAY} 09:00:00`).slice(0, 16), enumerable: true },
    by: { get: () => d.editor || '김등록(P123456)', enumerable: true },
  });
  views.set(d, v);
  return v;
}
const rowsAll = () => DISPLAYS.map(view);
const byId = id => rowsAll().find(d => d.id === id);
// 되돌리기용 사본은 전시 전체를 남긴다(연결 상품 · 콘텐츠 등 일괄 관리에 안 보이는 값까지).
const snap = r => clone(r._d);
// 바꾼 전시는 버전을 올리고 최종등록(수정) 정보를 남긴다. 상품 전시 목록의 저장과 같은 규칙
const touch = d => { d.ver = (d.ver || 1) + 1; d.updatedAt = nowStamp(); d.editor = EDITOR; };
function commit() { if (!saveList()) toast('브라우저 저장소를 쓸 수 없어 새로고침하면 변경이 사라집니다'); }

// ---------- 상태 ----------
const st = { key: 'all', q: '', dateType: 'upd', from: '', to: '', area: '', ch: '', sale: '', disp: '', sort: 'upd', dir: 'desc', page: 1, size: 20 };
const selected = new Set();

function filtered() {
  const q = st.q.toLowerCase();
  const hitQ = d => !q || (st.key !== 'id' && d.name.toLowerCase().includes(q)) || (st.key !== 'name' && d.id.includes(q));
  // 조회기간: 등록일/수정일은 최종 수정일이 기간 안, 전시 기간은 기간과 겹치는 전시
  const hitDate = d => {
    if (!st.from && !st.to) return true;
    if (st.dateType === 'upd') { const u = d.upd.slice(0, 10); return (!st.from || u >= st.from) && (!st.to || u <= st.to); }
    return (!st.to || d.from <= st.to) && (!st.from || !d.to || d.to >= st.from);
  };
  return rowsAll().filter(d => hitQ(d) && hitDate(d)
    && (!st.area || d.area === st.area) && (!st.ch || d.ch.includes(st.ch))
    && (!st.sale || d.sale === st.sale) && (!st.disp || d.disp === st.disp));
}
function sorted(list) {
  const k = st.sort, m = st.dir === 'asc' ? 1 : -1;
  const v = d => k === 'sale' ? SALE_KEYS.indexOf(d.sale) : k === 'rank' ? d.rank : k === 'ch' ? d.ch.join(',') : String(d[k] ?? '');
  return [...list].sort((a, b) => (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * m);
}

// ---------- 필터 ----------
const fill = (sel, list, label = x => x) => list.forEach(x => sel.appendChild(new Option(label(x), x)));
fill($('#fArea'), SVCS); fill($('#fCh'), CHS);
fill($('#eArea'), SVCS); fill($('#eSale'), SALE_KEYS, k => SALE[k]);
const chBoxes = (name, cur) => CHS.map(c => `<label class="pb-ck"><input type="checkbox" name="${name}" value="${esc(c)}" ${cur.includes(c) ? 'checked' : ''}> ${esc(c)}</label>`).join('');
const checkedCh = name => $$(`input[name="${name}"]:checked`).map(x => x.value);

// 조회 조건은 display-create2.html 목록처럼 [조회]를 눌러야 반영된다.
const FILTERS = { fKey: 'key', fQ: 'q', fDate: 'dateType', fFrom: 'from', fTo: 'to', fSale: 'sale', fDisp: 'disp', fArea: 'area', fCh: 'ch' };
function applyFilter() {
  Object.entries(FILTERS).forEach(([id, k]) => st[k] = $('#' + id).value.trim());
  if (st.from && st.to && st.from > st.to) [st.from, st.to] = [st.to, st.from];
  st.page = 1;
  // 검색 조건이 바뀌면 목록에 보이지 않는 선택은 풀어 둔다(숨은 항목이 함께 바뀌지 않도록).
  const ids = new Set(filtered().map(d => d.id));
  [...selected].forEach(id => ids.has(id) || selected.delete(id));
  render();
}
function resetFilter() {
  $('#fKey').value = 'all'; $('#fDate').value = 'upd';
  ['fQ', 'fFrom', 'fTo', 'fSale', 'fDisp', 'fArea', 'fCh'].forEach(id => $('#' + id).value = '');
  applyFilter();
}
$('#lFilter').addEventListener('submit', e => { e.preventDefault(); applyFilter(); });
$('#lFilter').addEventListener('reset', e => { e.preventDefault(); resetFilter(); });

// 판매상태 · 전시여부 선택: 항목마다 건수를 보여 주고, 고른 값은 [조회] 때 반영한다.
const STATES = {
  fSale: { k: 'sale', opts: [['', '전체'], ...SALE_KEYS.map(k => [k, SALE[k]])] },
  fDisp: { k: 'disp', opts: [['', '전체'], ['Y', '전시'], ['N', '미전시']] },
};
function renderStates() {
  const all = rowsAll();
  Object.entries(STATES).forEach(([id, { k, opts }]) => {
    const sel = $(`#${id}`), cur = sel.options.length ? sel.value : st[k];
    sel.innerHTML = opts.map(([v, l]) => `<option value="${v}">${l} (${v ? all.filter(d => d[k] === v).length : all.length})</option>`).join('');
    sel.value = cur;
  });
}
$('#pageSize').addEventListener('change', e => { st.size = +e.target.value; st.page = 1; render(); });
$$('.pb-sort').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.sort;
  st.dir = st.sort === k && st.dir === 'asc' ? 'desc' : 'asc'; st.sort = k; render();
}));

// ---------- 목록 ----------
function periodHtml(d) {
  const today = TODAY;
  const tag = d.to && d.to < today ? '<span class="tag bad">종료</span>' : d.from > today ? '<span class="tag warn">예약</span>' : '';
  return `${esc(d.from) || '-'} ~ ${d.to ? esc(d.to) : '<small>상시</small>'}${tag}`;
}
function rowHtml(d) {
  const on = selected.has(d.id);
  return `<tr data-id="${d.id}" class="${on ? 'sel' : ''}">
    <td class="pb-chk"><input type="checkbox" class="rowChk" ${on ? 'checked' : ''} aria-label="${esc(d.name)} 선택"></td>
    <td><div class="pb-mng"><button class="btn sm" type="button" data-act="edit">수정</button><button class="btn sm" type="button" data-act="copy">복사</button></div></td>
    <td class="pb-id">${d.id}</td>
    <td class="pb-name"><b>${esc(d.name) || '이름 없음'}</b><small>${esc(d.area) || '전시 유형 미선택'}</small></td>
    <td title="${esc(d.ch.join(', '))}">${esc(chText(d.ch))}</td>
    <td><select class="pb-inline s-${d.sale}" data-act="sale" aria-label="판매상태">${SALE_KEYS.map(k => `<option value="${k}" ${k === d.sale ? 'selected' : ''}>${SALE[k]}</option>`).join('')}</select></td>
    <td><button type="button" class="pb-switch" role="switch" data-act="disp" aria-checked="${d.disp === 'Y'}" aria-label="전시 여부"></button><span class="pb-switch-l">${DISP[d.disp]}</span></td>
    <td><input type="text" class="pb-rank" data-act="rank" value="${d.rank}" inputmode="numeric" aria-label="노출순위"></td>
    <td class="pb-period">${periodHtml(d)}</td>
    <td class="pb-upd">${esc(d.upd)}<br>${esc(d.by)}</td>
  </tr>`;
}
let flashIds = new Set();
function render() {
  const list = sorted(filtered());
  const pages = Math.max(1, Math.ceil(list.length / st.size));
  st.page = Math.min(st.page, pages);
  const rows = list.slice((st.page - 1) * st.size, st.page * st.size);
  $('#grid tbody').innerHTML = rows.length ? rows.map(rowHtml).join('')
    : '<tr><td colspan="10" class="empty" style="border:0">조건에 맞는 전시가 없습니다. 검색 조건을 바꾸거나 초기화하세요.</td></tr>';
  flashIds.forEach(id => $(`#grid tr[data-id="${id}"]`)?.classList.add('flash'));
  flashIds = new Set();

  $$('.pb-sort').forEach(b => b.dataset.sort === st.sort ? b.dataset.dir = st.dir : delete b.dataset.dir);
  $$('#grid th').forEach(th => { const b = th.querySelector('.pb-sort'); if (b) th.setAttribute('aria-sort', b.dataset.dir ? (b.dataset.dir === 'asc' ? 'ascending' : 'descending') : 'none'); });

  // 페이지네이션
  const btn = (p, label, dis, cur) => `<button type="button" data-p="${p}" ${dis ? 'disabled' : ''} ${cur ? 'aria-current="page"' : ''} ${label.length > 2 ? `aria-label="${label}"` : ''}>${label.length > 2 ? { first: '«', prev: '‹', next: '›', last: '»' }[label] : label}</button>`;
  const start = Math.max(1, Math.min(st.page - 2, pages - 4)), end = Math.min(pages, start + 4);
  let h = btn(1, 'first', st.page === 1) + btn(st.page - 1, 'prev', st.page === 1);
  for (let p = start; p <= end; p++) h += btn(p, String(p), false, p === st.page);
  h += btn(st.page + 1, 'next', st.page === pages) + btn(pages, 'last', st.page === pages);
  $('#pager').innerHTML = h;
  $('#lCount').textContent = list.length;

  renderStates();
  renderSelection(rows, list);
}
$('#pager').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; st.page = +b.dataset.p; render(); });

// 상품 전시 관리(다른 탭)에서 저장하면 다시 읽는다. 지워진 전시는 선택에서 뺀다
window.addEventListener('storage', e => {
  if (!reloadList(e)) return;
  const ids = new Set(rowsAll().map(d => d.id));
  [...selected].forEach(id => ids.has(id) || selected.delete(id));
  render();
});

// ---------- 선택 ----------
function renderSelection(rows = currentRows(), list = filtered()) {
  const n = selected.size;
  $('#selCount').textContent = `선택 ${n}건`;
  $('#bulkBar').classList.toggle('on', n > 0);
  $$('#bulkBar [data-bulk], #bulkDelete, #bulkClear').forEach(b => b.disabled = n === 0);
  const pageSel = rows.filter(d => selected.has(d.id)).length;
  const all = $('#chkAll');
  all.checked = rows.length > 0 && pageSel === rows.length;
  all.indeterminate = pageSel > 0 && pageSel < rows.length;
  // 현재 페이지를 모두 골랐을 때 검색 결과 전체 선택을 제안한다.
  const bar = $('#selAllBar');
  const allSel = list.length > 0 && list.every(d => selected.has(d.id));
  if (all.checked && list.length > rows.length && !allSel) {
    bar.innerHTML = `현재 페이지 ${rows.length}건을 선택했습니다.<button type="button" class="pb-link" data-sel="all">검색 결과 ${list.length}건 모두 선택</button>`; bar.hidden = false;
  } else if (allSel && list.length > rows.length) {
    bar.innerHTML = `검색 결과 ${list.length}건을 모두 선택했습니다.<button type="button" class="pb-link" data-sel="none">선택 해제</button>`; bar.hidden = false;
  } else bar.hidden = true;
}
function currentRows() { const ids = $$('#grid tbody tr[data-id]').map(tr => tr.dataset.id); return ids.map(byId).filter(Boolean); }
$('#selAllBar').addEventListener('click', e => {
  const b = e.target.closest('[data-sel]'); if (!b) return;
  if (b.dataset.sel === 'all') filtered().forEach(d => selected.add(d.id)); else selected.clear();
  render();
});
$('#chkAll').addEventListener('change', e => {
  currentRows().forEach(d => e.target.checked ? selected.add(d.id) : selected.delete(d.id));
  render();
});
$('#bulkClear').addEventListener('click', () => { selected.clear(); render(); });

// ---------- 행 안의 개별 작업 ----------
const tbody = $('#grid tbody');
tbody.addEventListener('change', e => {
  const tr = e.target.closest('tr[data-id]'); if (!tr) return;
  const d = byId(tr.dataset.id);
  if (e.target.classList.contains('rowChk')) {
    e.target.checked ? selected.add(d.id) : selected.delete(d.id);
    tr.classList.toggle('sel', e.target.checked); renderSelection(); return;
  }
  if (e.target.dataset.act === 'sale') {
    const before = snap(d);
    update([d], x => x.sale = e.target.value);
    toast(`${d.name} · 판매상태를 ${SALE[d.sale]}(으)로 바꿨습니다`, () => restore([before]));
  }
  if (e.target.dataset.act === 'rank') {
    const v = +e.target.value;
    if (!Number.isInteger(v) || v < 1 || v > 999) { e.target.value = d.rank; toast('노출순위는 1~999 사이 숫자로 입력하세요'); return; }
    if (v === d.rank) return;
    const before = snap(d);
    update([d], x => x.rank = v);
    toast(`${d.name} · 노출순위를 ${v}(으)로 바꿨습니다`, () => restore([before]));
  }
});
tbody.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset.act === 'rank') e.target.blur(); });
tbody.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); const tr = e.target.closest('tr[data-id]');
  if (!b || !tr) return;
  const d = byId(tr.dataset.id);
  if (b.dataset.act === 'disp') {
    const before = snap(d);
    update([d], x => x.disp = x.disp === 'Y' ? 'N' : 'Y');
    toast(`${d.name} · ${DISP[d.disp]}(으)로 바꿨습니다`, () => restore([before]));
  }
  if (b.dataset.act === 'edit') openEdit(d);
  if (b.dataset.act === 'copy') {
    // 상품 전시 목록의 [복사]와 같다: 전시 전체를 복사하고 미전시 · V1로 만든다. 대표 전시 지정은 가져오지 않는다
    const c = clone(d._d);
    Object.assign(c, { id: nextDisplayId(), name: d.name + ' (복사)', show: false, rep: [], ver: 1, sale: 'wait', updatedAt: nowStamp(), editor: EDITOR });
    DISPLAYS.splice(DISPLAYS.indexOf(d._d) + 1, 0, c); commit();
    const cid = dispId(c.id);
    flashIds.add(cid); render();
    toast(`${cid}로 복사했습니다 (판매대기 · 미전시)`, () => { removeDisplays(new Set([cid])); selected.delete(cid); commit(); render(); });
  }
});

// 변경을 적용하고 수정 이력·강조를 남긴 뒤 저장한다.
function update(list, fn) {
  list.forEach(d => { fn(d); touch(d._d); flashIds.add(d.id); });
  commit(); render();
}
const removeDisplays = ids => { for (let i = DISPLAYS.length - 1; i >= 0; i--) if (ids.has(dispId(DISPLAYS[i].id))) DISPLAYS.splice(i, 1); };
// 되돌리기: 변경 전 사본으로 바꿔 넣는다. 삭제된 전시는 원래 자리에 다시 넣는다.
function restore(snaps) {
  snaps.forEach(s => {
    const i = DISPLAYS.findIndex(x => x.id === s.id), at = s._idx; delete s._idx;
    if (i >= 0) DISPLAYS[i] = s; else DISPLAYS.splice(Math.min(at ?? DISPLAYS.length, DISPLAYS.length), 0, s);
    flashIds.add(dispId(s.id));
  });
  commit(); render(); toast('변경 전으로 되돌렸습니다');
}

// ---------- 개별 수정 팝업 ----------
let editing = null;
function openEdit(d) {
  editing = d;
  $('#eTitle').textContent = `전시 수정 · ${d.id}`;
  $('#eName').value = d.name; $('#eArea').value = d.area; $('#eCh').innerHTML = chBoxes('eCh', d.ch);
  $('#eSale').value = d.sale; $('#eDisp').value = d.disp; $('#eRank').value = d.rank; $('#eFrom').value = d.from; $('#eTo').value = d.to;
  $('#eErr').textContent = '';
  $('#dlgEdit').showModal();
}
$('#eForm').addEventListener('submit', e => {
  const name = $('#eName').value.trim(), rank = +$('#eRank').value, from = $('#eFrom').value, to = $('#eTo').value, ch = checkedCh('eCh');
  const err = !name ? '전시명을 입력하세요' : !ch.length ? '전시 채널을 1개 이상 선택하세요' : (!Number.isInteger(rank) || rank < 1 || rank > 999) ? '노출순위는 1~999 사이 숫자로 입력하세요'
    : !from ? '전시 시작일을 입력하세요' : (to && to < from) ? '종료일은 시작일 이후여야 합니다' : '';
  if (err) { e.preventDefault(); $('#eErr').textContent = err; return; }
  const before = snap(editing);
  update([editing], x => Object.assign(x, { name, area: $('#eArea').value, ch, sale: $('#eSale').value, disp: $('#eDisp').value, rank, from, to }));
  toast(`${editing.id}을(를) 저장했습니다`, () => restore([before]));
});

// ---------- 일괄 변경 팝업 ----------
const fmt = (f, d) => f === 'sale' ? SALE[d.sale] : f === 'disp' ? DISP[d.disp] : f === 'period' ? `${d.from} ~ ${d.to || '상시'}` : f === 'ch' ? (d.ch.join(', ') || '-') : String(d[f]);
let bulkVal = {};
function valueUi(f) {
  const seg = (opts, cur) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button type="button" role="radio" data-v="${v}" class="${v === cur ? 'on' : ''}" aria-checked="${v === cur}">${l}</button>`).join('')}</div>`;
  if (f === 'sale') { bulkVal = { v: bulkVal.f === f ? bulkVal.v : 'live' }; return seg(SALE_KEYS.map(k => [k, SALE[k]]), bulkVal.v); }
  if (f === 'disp') { bulkVal = { v: bulkVal.f === f ? bulkVal.v : 'Y' }; return seg([['Y', '전시'], ['N', '미전시']], bulkVal.v); }
  if (f === 'ch') { bulkVal = { v: [CHS[0]] }; return `<div class="pb-cks">${chBoxes('bCh', bulkVal.v)}</div>`; }
  if (f === 'period') {
    bulkVal = { from: TODAY, to: '', always: true };
    return `<input type="date" id="bFrom" value="${TODAY}" aria-label="시작일"> ~ <input type="date" id="bTo" disabled aria-label="종료일"><label><input type="checkbox" id="bAlways" checked> 상시 (종료일 없음)</label>`;
  }
  if (f === 'rank') {
    bulkVal = { v: 1, mode: 'same' };
    return `${seg([['same', '같은 값으로'], ['seq', '목록 순서대로 1씩 증가']], 'same')}<input type="text" class="pb-rank" id="bRank" value="1" inputmode="numeric" aria-label="노출순위 값"><small id="bRankHint" style="color:var(--muted)">선택한 항목에 같은 순위를 지정합니다</small>`;
  }
}
function targets() {
  // 목록에 보이는 순서(정렬 반영)대로 변경한다.
  return sorted(rowsAll().filter(d => selected.has(d.id)));
}
function nextValue(f, d, i) {
  if (f === 'period') return { from: bulkVal.from, to: bulkVal.always ? '' : bulkVal.to };
  if (f === 'rank') return { rank: bulkVal.mode === 'seq' ? bulkVal.v + i : bulkVal.v };
  if (f === 'ch') return { ch: CHS.filter(c => bulkVal.v.includes(c)) };
  return { [f]: bulkVal.v };
}
function bulkError(f) {
  if (f === 'period') return !bulkVal.from ? '시작일을 입력하세요' : (!bulkVal.always && !bulkVal.to) ? '종료일을 입력하거나 상시를 선택하세요' : (!bulkVal.always && bulkVal.to < bulkVal.from) ? '종료일은 시작일 이후여야 합니다' : '';
  if (f === 'rank') return (!Number.isInteger(bulkVal.v) || bulkVal.v < 1 || bulkVal.v > 999) ? '노출순위는 1~999 사이 숫자로 입력하세요' : '';
  if (f === 'ch') return bulkVal.v.length ? '' : '전시 채널을 1개 이상 선택하세요';
  return '';
}
// 미리보기는 행의 값을 바꾸지 않고 바뀔 값만 겹쳐 본다.
const peek = (d, f, i) => ({ ch: d.ch, sale: d.sale, disp: d.disp, rank: d.rank, from: d.from, to: d.to, ...nextValue(f, d, i) });
function renderPreview() {
  const f = $('#bField').value, list = targets(), err = bulkError(f);
  let changed = 0;
  $('#bPrev').innerHTML = list.map((d, i) => {
    const a = fmt(f, peek(d, f, i)), b = fmt(f, d), same = a === b;
    if (!same) changed++;
    return `<tr><td class="pb-id">${d.id}</td><td>${esc(d.name)}</td><td>${esc(b)}</td><td class="arrow">→</td><td class="${same ? 'same' : 'to'}">${err ? '-' : same ? '변경 없음' : esc(a)}</td></tr>`;
  }).join('');
  $('#bSum').textContent = err || `선택 ${list.length}건 중 ${changed}건 변경${list.length - changed ? ` · ${list.length - changed}건은 이미 같은 값` : ''}`;
  $('#bSum').style.color = err ? 'var(--bad)' : '';
  $('#bApply').disabled = !!err || changed === 0;
  $('#bApply').textContent = changed ? `${changed}건 변경` : '변경';
  $('#bNote').innerHTML = `선택한 <b>${list.length}건</b>의 <b>${FIELD[f]}</b>을(를) 한 번에 바꿉니다. 변경 전 아래 미리보기에서 대상과 결과를 확인하세요.`;
}
function setField(f) {
  $('#bField').value = f; bulkVal = { f: null };
  $('#bVal').innerHTML = valueUi(f); bulkVal.f = f;
  $('#bValLabel').textContent = `변경할 ${FIELD[f]}`;
  renderPreview();
}
$('#bField').addEventListener('change', e => setField(e.target.value));
$('#bVal').addEventListener('click', e => {
  const b = e.target.closest('.seg button'); if (!b) return;
  b.parentElement.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); });
  if ($('#bField').value === 'rank') {
    bulkVal.mode = b.dataset.v;
    $('#bRankHint').textContent = b.dataset.v === 'seq' ? '목록 순서대로 입력값부터 1씩 늘려 지정합니다' : '선택한 항목에 같은 순위를 지정합니다';
  } else bulkVal.v = b.dataset.v;
  renderPreview();
});
$('#bVal').addEventListener('input', e => {
  const t = e.target;
  if (t.name === 'bCh') bulkVal.v = checkedCh('bCh');
  if (t.id === 'bFrom') bulkVal.from = t.value;
  if (t.id === 'bTo') bulkVal.to = t.value;
  if (t.id === 'bAlways') { bulkVal.always = t.checked; $('#bTo').disabled = t.checked; }
  if (t.id === 'bRank') bulkVal.v = t.value.trim() === '' ? NaN : +t.value;
  renderPreview();
});
$$('#bulkBar [data-bulk]').forEach(b => b.addEventListener('click', () => { setField(b.dataset.bulk); $('#bKeep').checked = false; $('#dlgBulk').showModal(); }));
$('#bForm').addEventListener('submit', () => {
  const f = $('#bField').value, list = targets();
  const vals = new Map(list.map((d, i) => [d.id, nextValue(f, d, i)]));
  const changed = list.filter((d, i) => fmt(f, peek(d, f, i)) !== fmt(f, d));
  const before = changed.map(snap);
  if (!$('#bKeep').checked) selected.clear();
  update(changed, d => Object.assign(d, vals.get(d.id)));
  toast(`${changed.length}건의 ${FIELD[f]}을(를) 변경했습니다`, () => restore(before));
});

// 선택 삭제: 상품 전시 목록에서도 함께 지워진다
$('#bulkDelete').addEventListener('click', async () => {
  const list = rowsAll().filter(d => selected.has(d.id));
  const live = list.filter(d => d.sale === 'live' && d.disp === 'Y').length;
  const ok = await confirmBox('선택 삭제', `선택한 <b>${list.length}건</b>을 삭제합니다. 상품 전시 목록에서도 삭제됩니다.${live ? `<br><span style="color:var(--bad)">판매중·전시 중인 전시 ${live}건이 포함되어 있습니다.</span>` : ''}<br>삭제 직후에는 되돌리기로 복구할 수 있습니다.`, '삭제');
  if (!ok) return;
  const snaps = list.map(d => ({ ...snap(d), _idx: DISPLAYS.indexOf(d._d) })).sort((a, b) => a._idx - b._idx);
  removeDisplays(selected); selected.clear(); commit(); render();
  toast(`${snaps.length}건을 삭제했습니다`, () => restore(snaps));
});
function confirmBox(title, html, okLabel = '확인') {
  const dlg = $('#dlgConfirm');
  $('#cTitle').textContent = title; $('#cMsg').innerHTML = html; $('#cOk').textContent = okLabel;
  dlg.returnValue = ''; dlg.showModal();
  return new Promise(res => dlg.addEventListener('close', () => res(dlg.returnValue === 'ok'), { once: true }));
}

// 팝업 공통 닫기
$$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
$$('dialog.pb-dlg').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

// ---------- 토스트 (되돌리기) ----------
let undoFn = null, toastTimer;
function toast(msg, undo) {
  const t = $('#toast');
  $('#toastMsg').textContent = msg;
  undoFn = undo || null; $('#toastUndo').hidden = !undo;
  t.classList.add('on'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('on'); undoFn = null; }, undo ? 6000 : 2400);
}
$('#toastUndo').addEventListener('click', () => { const f = undoFn; undoFn = null; $('#toast').classList.remove('on'); f && f(); });

// ---------- 엑셀(CSV) ----------
const COLS = [['id', '전시ID'], ['name', '전시명'], ['area', '전시 유형'], ['ch', '전시 채널'], ['sale', '판매상태'], ['disp', '전시여부(Y/N)'], ['rank', '노출순위'], ['from', '전시시작일'], ['to', '전시종료일']];
const GUIDE = ['# 비우면 신규 등록 · 있으면 수정', '# 필수 · 60자 이내', `# ${SVCS.join(' / ')}`, `# 여러 개는 / 로 구분: ${CHS.join(' / ')}`, `# ${Object.values(SALE).join(' / ')}`, '# Y / N', '# 1~999', '# YYYY-MM-DD', '# 비우면 상시'];
const csvCell = v => { const s = String(v ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = rows => '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const exportRow = d => [d.id, d.name, d.area, d.ch.join('/'), SALE[d.sale], d.disp, d.rank, d.from, d.to];
const stamp = () => nowStamp().replace(/[-: ]/g, '').slice(0, 12);
function downloadTemplate() {
  download('상품전시_일괄등록_양식.csv', toCsv([COLS.map(c => c[1]), GUIDE, ['', 'Galaxy S26 Edge 사전예약', '기기서비스', '통합 APP/통합 WEB', '판매대기', 'N', '1', '2026-11-01', ''], [rowsAll()[0]?.id || '000001', '(수정 예시) 빈 칸은 기존 값 유지', '', '', '판매중지', '', '', '', '']]));
  toast('엑셀 양식을 내려받았습니다. 예시 행은 지우고 작성하세요');
}
$('#btnTemplate').addEventListener('click', downloadTemplate);
$('#uTemplate').addEventListener('click', downloadTemplate);
$('#btnExport').addEventListener('click', () => {
  const list = selected.size ? sorted(rowsAll().filter(d => selected.has(d.id))) : sorted(filtered());
  download(`상품전시_목록_${stamp()}.csv`, toCsv([COLS.map(c => c[1]), ...list.map(exportRow)]));
  toast(`${selected.size ? '선택한' : '검색 결과'} ${list.length}건을 내려받았습니다`);
});

function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
async function readText(file) {
  const buf = await file.arrayBuffer();
  // Excel 'CSV UTF-8'은 UTF-8, 그냥 'CSV'로 저장하면 한글 Windows에서 CP949(EUC-KR)로 저장된다.
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return new TextDecoder('euc-kr').decode(buf); }
}
const normDate = s => { const m = String(s).trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/); return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null; };
const validDate = s => { const d = new Date(s + 'T00:00:00'); return !isNaN(d) && d.toISOString().slice(0, 10) === s; };
const SALE_BY_LABEL = Object.fromEntries(Object.entries(SALE).map(([k, v]) => [v, k]));

// 파일 → 행별 검증 결과. 수정 행의 빈 칸은 기존 값을 유지한다.
function validate(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { fatal: '빈 파일입니다' };
  const head = rows[0].map(h => h.trim());
  const idx = Object.fromEntries(COLS.map(([k, l]) => [k, head.indexOf(l)]));
  const missing = COLS.filter(([k]) => idx[k] < 0).map(c => c[1]);
  if (missing.length) return { fatal: `양식의 열 이름이 다릅니다. 없는 열: ${missing.join(', ')} · 엑셀 양식을 내려받아 작성하세요` };
  const body = rows.slice(1).map((r, i) => ({ r, line: i + 2 })).filter(({ r }) => r.some(c => c.trim()) && !String(r[0]).trim().startsWith('#'));
  if (body.length > 1000) return { fatal: `한 번에 1,000행까지 올릴 수 있습니다 (현재 ${body.length}행)` };
  // Excel은 000001을 1로 바꿔 저장하므로 숫자 전시ID는 6자리로 맞춘다
  const idOf = r => { const s = (r[idx.id] || '').trim(); return /^\d+$/.test(s) ? dispId(+s) : s; };
  const seen = new Map();
  body.forEach(({ r }) => { const id = idOf(r); if (id) seen.set(id, (seen.get(id) || 0) + 1); });
  const out = body.map(({ r, line }) => {
    const g = k => (r[idx[k]] ?? '').trim();
    const id = idOf(r), kind = id ? '수정' : '등록', base = id ? byId(id) : null, errs = [], v = {};
    if (id && !base) errs.push(`존재하지 않는 전시ID입니다 (${id})`);
    if (id && seen.get(id) > 1) errs.push('같은 전시ID가 파일 안에 두 번 이상 있습니다');
    const need = (k, label) => { if (!g(k) && kind === '등록') errs.push(`${label}은(는) 필수입니다`); return g(k); };
    const name = need('name', '전시명'); if (name) name.length > 60 ? errs.push('전시명은 60자 이내로 입력하세요') : v.name = name;
    const area = need('area', '전시 유형'); if (area) SVCS.includes(area) ? v.area = area : errs.push(`전시 유형 '${area}'은(는) 없는 값입니다 (${SVCS.join('/')})`);
    const ch = need('ch', '전시 채널'); if (ch) {
      const l = ch.split('/').map(x => x.trim()).filter(Boolean), bad = l.filter(x => !CHS.includes(x));
      bad.length ? errs.push(`전시 채널 '${bad.join(', ')}'은(는) 없는 값입니다 (${CHS.join('/')})`) : v.ch = l;
    }
    const sale = need('sale', '판매상태'); if (sale) SALE_BY_LABEL[sale] ? v.sale = SALE_BY_LABEL[sale] : errs.push(`판매상태 '${sale}'은(는) 없는 값입니다 (${Object.values(SALE).join('/')})`);
    const disp = need('disp', '전시여부').toUpperCase(); if (disp) ['Y', 'N'].includes(disp) ? v.disp = disp : errs.push(`전시여부는 Y 또는 N으로 입력하세요 ('${disp}')`);
    const rank = need('rank', '노출순위'); if (rank) /^\d+$/.test(rank) && +rank >= 1 && +rank <= 999 ? v.rank = +rank : errs.push(`노출순위는 1~999 사이 숫자로 입력하세요 ('${rank}')`);
    const from = need('from', '전시시작일'); if (from) { const n = normDate(from); n && validDate(n) ? v.from = n : errs.push(`전시시작일 형식이 잘못됐습니다 ('${from}' → YYYY-MM-DD)`); }
    const to = g('to'); if (to) { const n = normDate(to); n && validDate(n) ? v.to = n : errs.push(`전시종료일 형식이 잘못됐습니다 ('${to}' → YYYY-MM-DD)`); }
    const f = v.from || base?.from, t = 'to' in v ? v.to : base?.to;
    if (f && t && t < f) errs.push(`전시종료일(${t})이 시작일(${f})보다 빠릅니다`);
    return { line, kind, id, name: name || base?.name || '', v, errs, ok: !errs.length, raw: COLS.map(([k]) => r[idx[k]] ?? '') };
  });
  return { rows: out };
}

// ---------- 엑셀 업로드 팝업 ----------
let pending = null, pendingFile = '';
function resetUpload() {
  pending = null; pendingFile = ''; $('#uFile').value = '';
  $('#uDropText').innerHTML = '<b>파일을 끌어다 놓거나 눌러서 선택</b><small>CSV(.csv) · 최대 1,000행 · Excel에서 ‘CSV UTF-8’ 또는 ‘CSV’로 저장</small>';
  $('#uCheck').hidden = true; $('#uApply').disabled = true; $('#uApply').textContent = '업로드';
}
async function takeFile(file) {
  if (!file) return;
  if (!/\.csv$/i.test(file.name)) { toast('CSV(.csv) 파일만 올릴 수 있습니다. Excel에서 ‘다른 이름으로 저장 → CSV’를 선택하세요'); return; }
  pendingFile = file.name;
  $('#uDropText').innerHTML = `<b>${esc(file.name)}</b><small>${(file.size / 1024).toFixed(1)}KB · 다른 파일을 올리려면 다시 누르세요</small>`;
  const res = validate(await readText(file));
  $('#uCheck').hidden = false;
  if (res.fatal) {
    pending = null;
    $('#uCheckSum').innerHTML = `<p class="pb-check-msg" style="color:var(--bad)">${esc(res.fatal)}</p>`;
    $('#uApply').disabled = true; return;
  }
  pending = res.rows;
  const ok = pending.filter(r => r.ok), fail = pending.length - ok.length;
  $('#uCheckSum').innerHTML = `<div><b>${pending.length}</b>전체 행</div><div class="ok"><b>${ok.filter(r => r.kind === '등록').length}</b>신규 등록</div><div class="ok"><b>${ok.filter(r => r.kind === '수정').length}</b>수정</div><div class="bad"><b>${fail}</b>오류</div>
    <p class="pb-check-msg">${fail ? `오류 ${fail}건은 반영하지 않습니다. 정상 ${ok.length}건만 반영하고 결과 화면에서 오류 사유를 확인할 수 있습니다.` : '모든 행이 정상입니다.'}</p>`;
  $('#uApply').disabled = !pending.length;
  $('#uApply').textContent = ok.length ? `${ok.length}건 반영` : '결과 보기';
}
$('#btnUpload').addEventListener('click', () => { resetUpload(); $('#dlgUpload').showModal(); });
$('#uFile').addEventListener('change', e => takeFile(e.target.files[0]));
const drop = $('#uDrop');
['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => takeFile(e.dataTransfer.files[0]));

// 업로드 반영 → 결과 화면. 신규 등록은 상품 전시 목록에 '작성 중' 전시로 생긴다(연결 상품 등은 상품 전시 관리에서 채운다)
let lastResult = null;
$('#uApply').addEventListener('click', () => {
  if (!pending) return;
  const t = nowStamp(), applied = [];
  pending.filter(r => r.ok).forEach(r => {
    if (r.kind === '수정') { const d = byId(r.id); Object.assign(d, r.v); touch(d._d); applied.push(r.id); }
    else {
      const d = norm(Object.assign(newDisplay(), { id: nextDisplayId(), ver: 1, updatedAt: t, editor: EDITOR }));
      Object.assign(view(d), r.v); DISPLAYS.unshift(d);
      r.id = dispId(d.id); applied.push(r.id);
    }
  });
  commit();
  lastResult = { file: pendingFile, at: t.slice(0, 16), rows: pending, applied };
  $('#dlgUpload').close();
  render();
  showResult();
});

let rTab = 'all';
function showResult() {
  const { rows, file, at } = lastResult, ok = rows.filter(r => r.ok), fail = rows.filter(r => !r.ok);
  $('#rSub').innerHTML = `<b>${esc(file)}</b> · ${esc(at)} 업로드. 정상 행은 목록에 바로 반영했고, 오류 행은 반영하지 않았습니다. 오류 사유를 확인하고 실패 항목만 내려받아 고친 뒤 다시 올리세요.`;
  $('#rCards').innerHTML = `<div><span>전체</span><b>${rows.length}</b><small>빈 행·안내 행 제외</small></div>
    <div class="ok"><span>성공</span><b>${ok.length}</b><small>등록 ${ok.filter(r => r.kind === '등록').length} · 수정 ${ok.filter(r => r.kind === '수정').length}</small></div>
    <div class="bad"><span>실패</span><b>${fail.length}</b><small>오류 사유 ${fail.reduce((n, r) => n + r.errs.length, 0)}건</small></div>
    <div><span>성공률</span><b>${rows.length ? Math.round(ok.length / rows.length * 100) : 0}%</b><small>반영 완료</small></div>`;
  $('#rcAll').textContent = rows.length; $('#rcOk').textContent = ok.length; $('#rcFail').textContent = fail.length;
  $('#rFailDown').disabled = !fail.length;
  rTab = fail.length ? 'fail' : 'all';
  renderResult();
  $('#v-list').classList.remove('on'); $('#v-result').classList.add('on'); window.scrollTo(0, 0);
}
function renderResult() {
  $$('#rTabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.r === rTab)));
  const list = lastResult.rows.filter(r => rTab === 'all' || (rTab === 'ok') === r.ok);
  $('#rGrid tbody').innerHTML = list.map(r => `<tr>
    <td>${r.line}</td><td>${r.kind === '등록' ? '<span class="chip acc">신규 등록</span>' : '<span class="chip">수정</span>'}</td>
    <td class="pb-id">${esc(r.id) || '-'}</td><td>${esc(r.name) || '<span style="color:var(--muted)">(전시명 없음)</span>'}</td>
    <td>${r.ok ? '<span class="tag ok">성공</span>' : '<span class="tag bad">실패</span>'}</td>
    <td class="pb-reason">${r.ok ? '<span style="color:var(--muted)">-</span>' : `<ul>${r.errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty" style="border:0">해당하는 행이 없습니다</td></tr>';
}
$('#rTabs').addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (!b) return; rTab = b.dataset.r; renderResult(); });
$('#rFailDown').addEventListener('click', () => {
  const fail = lastResult.rows.filter(r => !r.ok);
  // 실패 행은 올린 값 그대로 + 오류 사유 열을 붙여 내려준다.
  download(`상품전시_업로드_실패_${stamp()}.csv`, toCsv([[...COLS.map(c => c[1]), '오류 사유'], ...fail.map(r => [...(r.raw || []), r.errs.join(' / ')])]));
  toast(`실패 ${fail.length}건을 내려받았습니다. 오류 사유 열을 지우고 고쳐서 다시 올리세요`);
});
$('#rBack').addEventListener('click', () => {
  $('#v-result').classList.remove('on'); $('#v-list').classList.add('on');
  // 방금 반영한 행을 선택해 두고 강조한다.
  resetFilter();
  selected.clear(); lastResult.applied.forEach(id => { selected.add(id); flashIds.add(id); });
  st.sort = 'upd'; st.dir = 'desc'; st.page = 1;
  render();
  if (lastResult.applied.length) toast(`업로드로 반영한 ${lastResult.applied.length}건을 선택해 두었습니다`);
});
$('#rRetry').addEventListener('click', () => { resetUpload(); $('#dlgUpload').showModal(); });

render();
