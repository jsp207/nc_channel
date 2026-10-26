// @ts-nocheck
// 상품 콘텐츠 관리 v0.1 (product-content.html)
// 안내 템플릿 · 컬러 · 용량 · 사이즈 · 기타 옵션 마스터의 목록과 상세(등록·수정) 화면.
// 데이터는 display-data.ts의 CONTENT(브라우저 저장소)를 쓰고, 사용 전시 수는 상품 전시(DISPLAYS)에서 센다.
// 목록 · 조회 조건 모양은 display-create2.html 상품 전시 목록 · product-display-bulk.html 일괄 관리와 같다.
import "./style.css";
import "./list.css";
import "./product-content.css";
import { requireAuthentication } from "./auth";
import { CONTENT, TPL_TYPES, TYPE_TPL, saveContent, reloadContent, reloadList, tplUsers, optUsers, nameText, dispId, nowStamp, EDITOR, CHS } from "./display-data";

requireAuthentication();

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dotD = s => String(s || '').replace(/-/g, '.');
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); }

// ---------- 탭별 정의 ----------
// cols: 목록 칸 [머리글, 폭(px, 비우면 남는 폭), 정렬 class, 값]
// fields: 상세 입력 항목. type: ro(읽기 전용) · text · code(저장 후 고정) · select · on(사용여부) · area · hex · num · epc
const ON_OPTS = [['Y', '사용'], ['N', '미사용']];
const isLight = hex => { const n = parseInt(String(hex).slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 225; };
const chip = hex => `<span class="pc-chip ${isLight(hex) ? 'light' : ''}" style="background:${esc(hex)}" title="${esc(hex)}"></span>`;
const epcCell = v => v ? esc(v) : '<span class="pc-dim">-</span>';
const nUse = r => `${users(TAB, r).length}개 전시`;
const onBadge = r => r.on ? '<span class="lb ok">사용</span>' : '<span class="lb off">미사용</span>';
const UPD = ['최종등록(수정)일시', 160, 'c', r => dotD(r.upd)];
const ON_COL = ['사용여부', 84, 'c', onBadge];
const EPC_F = { k: 'epc', label: 'EPC 속성값', type: 'epc', ph: '예: COLOR_BLACK', help: 'EPC 상품의 속성값과 연결해요. 연결할 값이 없으면 비워 두세요 (영문 대문자 · 숫자 · _)' };
const ON_F = { k: 'on', label: '사용여부', type: 'on', help: '미사용으로 바꾸면 새 전시에서 고를 수 없어요. 이미 쓰는 전시에는 그대로 남아요' };
const codeF = (label, prefix, ex) => ({ k: 'code', label, type: 'code', prefix, req: true, ph: `예: ${ex}`, help: `${prefix} 뒤에 영문 대문자 · 숫자 · - 를 1~12자로 입력하세요. 저장한 뒤에는 바꿀 수 없어요` });
const nameF = (label, ph, max = 20) => ({ k: 'n', label, type: 'text', req: true, max, ph, lockUsed: true });

const TABS = {
  tpl: {
    // 템플릿은 읽기 전용: 등록 · 삭제 · 저장 없음. 사용여부만 바꿀 수 있고 바꾸는 즉시 저장한다
    label: '안내 템플릿', noun: '템플릿', store: 'tpl', key: 'id', idLabel: '템플릿ID', nameLabel: '템플릿명', readOnly: true,
    filters: [{ id: 'fType', label: '콘텐츠 유형', opts: TPL_TYPES.map(t => [t, t]), test: (r, v) => r.t === v }],
    cols: [
      ['템플릿ID', 110, '', r => r.id], ['버전', 72, 'c', r => esc(r.v)], ['템플릿명', 0, '', r => esc(r.n)], ['콘텐츠 유형', 130, '', r => esc(r.t)],
      ['완전 매핑', 100, 'c', r => `${tplUsers(r.id, 'link').length}개 전시`], ['1회 매핑', 100, 'c', r => `${tplUsers(r.id, 'copy').length}개 전시`], ON_COL, UPD],
    fields: [
      { k: 'id', label: '템플릿ID', type: 'ro' },
      { k: 'v', label: '버전', type: 'ro' },
      { k: 'n', label: '템플릿명', type: 'ro' },
      { k: 't', label: '콘텐츠 유형', type: 'ro' },
      { ...ON_F, help: '바꾸면 바로 저장돼요. 미사용으로 바꾸면 새 전시에서 고를 수 없고, 이미 쓰는 전시에는 그대로 남아요' },
      { k: 'body', label: '내용', type: 'roarea', help: '완전 매핑한 전시에는 템플릿 내용이 그대로 보이고, 1회 매핑한 전시는 복사한 당시 내용을 써요' },
    ],
  },
  color: {
    label: '컬러 관리', noun: '컬러', store: 'color', key: 'code', idLabel: '컬러코드', nameLabel: '컬러명', chipOnly: true,
    cols: [['컬러코드', 120, '', r => r.code], ['컬러칩', 72, 'c', r => chip(r.hex)], ['컬러명', 0, '', r => esc(r.n)], ['HEX', 110, '', r => `<span class="pc-mono">${esc(r.hex)}</span>`],
      ['EPC 속성값', 170, 'c', r => epcCell(r.epc)], ['사용 전시', 100, 'c', nUse], ON_COL, UPD],
    fields: [codeF('컬러코드', 'CLR-', 'CLR-BK'), nameF('컬러명', '예: 블랙, 내추럴 티타늄'), { k: 'hex', label: '컬러값(HEX)', type: 'hex', req: true, help: '# 뒤 6자리. 옵션 선택 화면의 컬러칩을 이 색으로 그려요' }, EPC_F, ON_F],
    blank: () => ({ code: 'CLR-', n: '', hex: '#000000', epc: '', on: true }),
  },
  cap: {
    label: '용량 관리', noun: '용량', store: 'cap', key: 'code', idLabel: '용량코드', nameLabel: '용량명', sort: (a, b) => a.gb - b.gb,
    cols: [['용량코드', 120, '', r => r.code], ['환산값(GB)', 110, 'r', r => Number(r.gb).toLocaleString()], ['용량명', 0, '', r => esc(r.n)], ['단위', 80, 'c', r => esc(r.unit)],
      ['EPC 속성값', 170, 'c', r => epcCell(r.epc)], ['사용 전시', 100, 'c', nUse], ON_COL, UPD],
    fields: [codeF('용량코드', 'CAP-', 'CAP-128G'), nameF('용량명', '예: 128GB, 1TB'), { k: 'unit', label: '단위', type: 'select', req: true, opts: [['GB', 'GB'], ['TB', 'TB']] },
      { k: 'gb', label: '환산값(GB)', type: 'num', req: true, suffix: 'GB', help: 'GB로 바꾼 값이에요. 목록 정렬과 용량 비교에 써요 (예: 1TB → 1024)' }, EPC_F, ON_F],
    blank: () => ({ code: 'CAP-', n: '', unit: 'GB', gb: '', epc: '', on: true }),
  },
  size: {
    label: '사이즈 관리', noun: '사이즈', store: 'size', key: 'code', idLabel: '사이즈코드', nameLabel: '사이즈명',
    filters: [{ id: 'fGroup', label: '구분', opts: () => groups('size'), test: (r, v) => r.group === v }],
    cols: [['사이즈코드', 120, '', r => r.code], ['구분', 130, '', r => esc(r.group)], ['사이즈명', 0, '', r => esc(r.n)], ['값', 100, 'r', r => r.val === '' ? '<span class="pc-dim">-</span>' : `${r.val} ${esc(r.unit)}`],
      ['EPC 속성값', 170, 'c', r => epcCell(r.epc)], ['사용 전시', 100, 'c', nUse], ON_COL, UPD],
    fields: [codeF('사이즈코드', 'SIZ-', 'SIZ-W44'), { k: 'group', label: '구분', type: 'text', req: true, max: 20, list: () => groups('size'), ph: '예: 워치 케이스, 태블릿 화면, 밴드' }, nameF('사이즈명', '예: 44mm, 11인치, S/M'),
      { k: 'val', label: '값', type: 'num', unitKey: 'unit', units: ['', 'mm', 'cm', 'inch'], help: '숫자로 비교할 수 있는 사이즈만 입력하세요 (S/M 같은 사이즈는 비워 두세요)' }, EPC_F, ON_F],
    blank: () => ({ code: 'SIZ-', group: '', n: '', val: '', unit: 'mm', epc: '', on: true }),
  },
  etc: {
    label: '기타 옵션 관리', noun: '기타 옵션', store: 'etc', key: 'code', idLabel: '옵션코드', nameLabel: '옵션값',
    filters: [{ id: 'fGroup', label: '옵션 그룹', opts: () => groups('etc'), test: (r, v) => r.group === v }],
    cols: [['옵션코드', 130, '', r => r.code], ['옵션 그룹', 140, '', r => esc(r.group)], ['옵션값', 0, '', r => esc(r.n)],
      ['EPC 속성값', 170, 'c', r => epcCell(r.epc)], ['사용 전시', 100, 'c', nUse], ON_COL, UPD],
    fields: [codeF('옵션코드', 'OPT-', 'OPT-LTE'), { k: 'group', label: '옵션 그룹', type: 'text', req: true, max: 20, list: () => groups('etc'), ph: '예: 연결 방식, 케이스 소재' }, nameF('옵션값', '예: LTE, 티타늄'), EPC_F, ON_F],
    blank: () => ({ code: 'OPT-', group: '', n: '', epc: '', on: true }),
  },
};
const TAB_KEYS = Object.keys(TABS);
const groups = store => [...new Set(CONTENT[store].map(r => r.group).filter(Boolean))].map(g => [g, g]);
const rowsOf = k => CONTENT[TABS[k].store];
const idOf = (k, r) => r[TABS[k].key];
// 이 콘텐츠를 쓰는 전시 [{d, kind}]. 템플릿은 완전 매핑 · 1회 매핑을 함께 보여 준다
function users(k, r) {
  if (k === 'tpl') return [...tplUsers(r.id, 'link').map(d => ({ d, kind: '완전 매핑' })), ...tplUsers(r.id, 'copy').map(d => ({ d, kind: '1회 매핑' }))];
  return optUsers(r.n, !!TABS[k].chipOnly).map(d => ({ d, kind: '옵션 선택' }));
}

// ---------- 화면 상태 · 주소 ----------
let TAB = 'tpl', DID = null, PAGE = 1;
const PAGE_SIZE = 10;
const F_DEF = () => ({ key: 'all', q: '', from: '', to: '', on: '', x: '' });
let F = F_DEF();
const url = (tab, id) => `${location.pathname}?tab=${tab}${id ? `&id=${encodeURIComponent(id)}` : ''}`;
function go(tab, id, replace) {
  if (tab !== TAB) { F = F_DEF(); PAGE = 1; }
  TAB = tab; DID = id || null;
  history[replace ? 'replaceState' : 'pushState'](null, '', url(tab, id));
  draw();
}
function fromUrl() {
  const p = new URLSearchParams(location.search), t = p.get('tab');
  if (t !== TAB) { F = F_DEF(); PAGE = 1; }
  TAB = TABS[t] ? t : 'tpl'; DID = p.get('id');
}
window.addEventListener('popstate', () => { fromUrl(); draw(); });
function draw() {
  const detail = DID != null;
  $('#v-list').classList.toggle('on', !detail); $('#v-detail').classList.toggle('on', detail);
  if (detail) drawDetail(); else drawList();
  window.scrollTo(0, 0);
}

// ---------- 목록 ----------
function drawTabs() {
  $('#pcTabs').innerHTML = TAB_KEYS.map(k => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === TAB}">${TABS[k].label}</button>`).join('');
}
$('#pcTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b && b.dataset.tab !== TAB) go(b.dataset.tab); });

const opt = (list, v) => ['<option value="">전체</option>', ...list.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`)].join('');
function drawFilter() {
  const T = TABS[TAB], xs = T.filters || [];
  const extra = xs.map(x => `<span class="lf-g"><label class="lf-l" for="${x.id}">${x.label}</label><select id="${x.id}">${opt(typeof x.opts === 'function' ? x.opts() : x.opts, F.x)}</select></span>`).join('');
  $('#lFilter').innerHTML = `
    <div class="lf-row">
      <span class="lf-g">
        <label class="lf-l" for="fKey">검색어</label>
        <select id="fKey"><option value="all">전체</option><option value="name">${T.nameLabel}</option><option value="id">${T.idLabel}</option></select>
        <input type="text" id="fQ" placeholder="${T.nameLabel} 또는 ${T.idLabel} 입력" aria-label="검색어" value="${esc(F.q)}">
      </span>
      <span class="lf-g">
        <label class="lf-l" for="fFrom">조회 기간</label>
        <span class="lf-range"><input type="date" id="fFrom" aria-label="최종등록(수정)일 시작" value="${F.from}"><span aria-hidden="true">-</span><input type="date" id="fTo" aria-label="최종등록(수정)일 끝" value="${F.to}"></span>
      </span>
    </div>
    <div class="lf-row">
      ${extra}
      <span class="lf-g"><label class="lf-l" for="fOn">사용여부</label><select id="fOn">${opt(ON_OPTS, F.on)}</select></span>
      <span class="lf-acts"><button type="reset" class="btn dark">초기화</button><button type="submit" class="btn primary">조회</button></span>
    </div>`;
  $('#fKey').value = F.key;
}
// 검색어 입력 후 Enter도 [조회]와 같다(form submit)
$('#lFilter').addEventListener('submit', e => {
  e.preventDefault();
  F = { key: $('#fKey').value, q: $('#fQ').value.trim(), from: $('#fFrom').value, to: $('#fTo').value, on: $('#fOn').value, x: $('#lFilter [id^="fType"], #lFilter #fGroup')?.value || '' };
  if (F.from && F.to && F.from > F.to) [F.from, F.to] = [F.to, F.from];
  PAGE = 1; drawList();
});
$('#lFilter').addEventListener('reset', e => { e.preventDefault(); F = F_DEF(); PAGE = 1; drawList(); });

function listRows() {
  const T = TABS[TAB], q = F.q.toLowerCase(), x = (T.filters || [])[0];
  return rowsOf(TAB).filter(r => {
    const id = String(idOf(TAB, r)).toLowerCase(), nm = String(r.n).toLowerCase();
    if (q && !(F.key !== 'id' && nm.includes(q) || F.key !== 'name' && id.includes(q))) return false;
    const day = String(r.upd).slice(0, 10);
    if (F.from && day < F.from || F.to && day > F.to) return false;
    if (F.on && (F.on === 'Y') !== !!r.on) return false;
    if (x && F.x && !x.test(r, F.x)) return false;
    return true;
  }).sort(T.sort || ((a, b) => String(b.upd).localeCompare(String(a.upd))));
}
const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const PG_IC = { first: '<path d="M7 6v12M17 6l-6 6 6 6"/>', prev: '<path d="m15 6-6 6 6 6"/>', next: '<path d="m9 6 6 6-6 6"/>', last: '<path d="M17 6v12M7 6l6 6-6 6"/>' };
// 처음 / 이전 / 페이지 번호(10개 단위) / 다음 / 마지막. 10건 이하면 1페이지
function pagerHtml(pages) {
  const b = (p, label, inner, dis) => `<button type="button" data-pg="${p}" aria-label="${label}" ${dis ? 'disabled' : ''}>${inner}</button>`;
  const s = Math.floor((PAGE - 1) / 10) * 10 + 1, e = Math.min(pages, s + 9);
  const nums = Array.from({ length: e - s + 1 }, (_, i) => s + i).map(n => `<button type="button" data-pg="${n}" ${n === PAGE ? 'aria-current="page"' : ''}>${n}</button>`).join('');
  return b(1, '첫 페이지', svg(PG_IC.first), PAGE === 1) + b(PAGE - 1, '이전 페이지', svg(PG_IC.prev), PAGE === 1) + nums
    + (e < pages ? `<button type="button" disabled aria-hidden="true">…</button><button type="button" data-pg="${pages}">${pages}</button>` : '')
    + b(PAGE + 1, '다음 페이지', svg(PG_IC.next), PAGE === pages) + b(pages, '마지막 페이지', svg(PG_IC.last), PAGE === pages);
}
function drawList() {
  const T = TABS[TAB];
  // 조회 조건 칸은 지금 적용된 값(F)으로 다시 그린다
  drawTabs(); drawFilter();
  const rows = listRows(), pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); PAGE = Math.min(PAGE, pages);
  $('#lCount').textContent = rows.length.toLocaleString();
  const head = `<colgroup>${T.cols.map(([, w]) => `<col${w ? ` style="width:${w}px"` : ''}>`).join('')}</colgroup>
    <thead><tr>${T.cols.map(([h, , c]) => `<th class="${c}">${h}</th>`).join('')}</tr></thead>`;
  const body = rows.length ? rows.slice((PAGE - 1) * PAGE_SIZE, PAGE * PAGE_SIZE).map(r => `<tr>${T.cols.map(([, , c, v], i) => {
    const html = v(r);
    return i === 0 ? `<td><button type="button" class="lid" data-id="${esc(html)}">${esc(html)}</button></td>` : `<td class="${c}" ${c === '' ? `title="${esc(String(html).replace(/<[^>]+>/g, ''))}"` : ''}>${html}</td>`;
  }).join('')}</tr>`).join('')
    : `<tr><td class="empty" colspan="${T.cols.length}">등록 및 검색 결과가 없습니다.</td></tr>`;
  $('#lTable').innerHTML = head + `<tbody>${body}</tbody>`;
  $('#lPager').innerHTML = pagerHtml(pages);
  $('#lNew').textContent = `${T.noun} 등록`; $('#lNew').hidden = !!T.readOnly;
}
$('#lTable').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) go(TAB, b.dataset.id); });
$('#lPager').addEventListener('click', e => { const b = e.target.closest('[data-pg]'); if (!b || b.disabled) return; PAGE = +b.dataset.pg; drawList(); });
$('#lNew').addEventListener('click', () => go(TAB, 'new'));

// ---------- 상세 · 등록 ----------
let CUR = null, IS_NEW = false, SNAP = '';
const fieldVal = f => {
  if (f.type === 'on') return $(`input[name="f-on"]:checked`)?.value === 'Y';
  const el = $(`#f-${f.k}`); if (!el || f.type === 'ro') return CUR[f.k];
  return el.value.trim();
};
const formState = () => JSON.stringify(TABS[TAB].fields.map(f => [f.k, fieldVal(f), f.unitKey ? $(`#f-${f.unitKey}`).value : null]));
function fieldHtml(f, r, used) {
  const v = r[f.k] ?? '', lock = !IS_NEW && (f.type === 'code' || f.lockUsed && used.length), id = `f-${f.k}`;
  let ctl = '';
  if (f.type === 'ro') ctl = `<input type="text" id="${id}" value="${esc(IS_NEW ? f.newText : v)}" readonly>`;
  else if (f.type === 'roarea') ctl = `<textarea id="${id}" readonly>${esc(v)}</textarea>`;
  else if (f.type === 'select') ctl = `<select id="${id}"><option value="">선택하세요</option>${f.opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (f.type === 'on') ctl = `<div class="pc-radios" role="radiogroup" aria-label="${f.label}">${ON_OPTS.map(([k, l]) => `<label><input type="radio" name="f-on" value="${k}" ${(k === 'Y') === !!r.on ? 'checked' : ''}> ${l}</label>`).join('')}</div>`;
  else if (f.type === 'area') ctl = `<textarea id="${id}" maxlength="${f.max}" placeholder="${esc(f.ph || '')}">${esc(v)}</textarea>`;
  else if (f.type === 'hex') ctl = `<div class="pc-hex"><input type="color" id="f-hexpick" value="${esc(/^#[0-9a-f]{6}$/i.test(v) ? v : '#000000')}" aria-label="색 고르기"><input type="text" id="${id}" value="${esc(v)}" maxlength="7" class="pc-mono" placeholder="#1E2533"></div>`;
  else if (f.type === 'num') ctl = `<div class="pc-num"><input type="text" id="${id}" value="${esc(v)}" inputmode="numeric" placeholder="숫자">${f.unitKey ? `<select id="f-${f.unitKey}" aria-label="단위" style="width:110px;min-width:0">${f.units.map(u => `<option value="${u}" ${u === (r[f.unitKey] ?? '') ? 'selected' : ''}>${u || '단위 없음'}</option>`).join('')}</select>` : `<span>${f.suffix || ''}</span>`}</div>`;
  else {
    const list = f.list ? f.list() : null;
    ctl = `<input type="text" id="${id}" value="${esc(v)}" ${f.max ? `maxlength="${f.max}"` : ''} placeholder="${esc(f.ph || '')}" ${lock ? 'readonly' : ''} ${list ? `list="${id}-l"` : ''} class="${f.type === 'epc' || f.type === 'code' ? 'pc-mono' : ''}">${list ? `<datalist id="${id}-l">${list.map(([g]) => `<option value="${esc(g)}">`).join('')}</datalist>` : ''}`;
  }
  const help = lock && f.lockUsed ? `사용 중인 전시 ${used.length}건의 옵션 값과 이름으로 연결돼 있어 바꿀 수 없어요` : lock ? '저장한 뒤에는 바꿀 수 없어요' : f.help;
  return `<tr data-f="${f.k}"><th scope="row"><label for="${id}">${f.label}</label>${f.req && !lock && f.type !== 'ro' ? '<i class="pc-req" aria-label="필수">*</i>' : ''}</th>
    <td>${ctl}${help ? `<p class="pc-help">${esc(help)}</p>` : ''}<p class="pc-err" hidden></p></td></tr>`;
}
function useHtml(k, list) {
  const T = TABS[k];
  const note = k === 'tpl' ? '완전 매핑은 이 템플릿을 연결해 쓰는 전시로, 템플릿 내용이 바뀌면 함께 바뀌어요. 1회 매핑은 복사해 간 전시라 바뀌지 않아요.' : `이 ${T.noun}을(를) 옵션 값으로 쓰는 전시예요. 사용 중이면 ${T.nameLabel}을(를) 바꾸거나 삭제할 수 없어요.`;
  const rows = list.map(({ d, kind }) => `<tr><td><a class="lid" href="display-create2.html?id=${d.id}">${dispId(d.id)}</a></td><td title="${esc(nameText(d.name))}">${esc(nameText(d.name)) || '이름 없음'}</td>${k === 'tpl' ? `<td class="c">${kind}</td>` : ''}
    <td title="${esc(d.channels.join(', '))}">${esc(d.channels.length && CHS.every(c => d.channels.includes(c)) ? 'All 채널' : d.channels[0] ? d.channels[0] + (d.channels.length > 1 ? ` 외 ${d.channels.length - 1}` : '') : '-')}</td>
    <td class="c">${d.from ? `${dotD(d.from)} ~ ${d.noEnd || !d.to ? '기한없음' : dotD(d.to)}` : '-'}</td><td class="c">${d.show ? '<span class="lb live">전시</span>' : '<span class="lb off">미전시</span>'}</td></tr>`).join('');
  return `<section class="pc-sec pc-use"><h2 class="pc-h">사용 전시 <b>${list.length}건</b></h2><p class="pc-note">${note}</p>
    <div class="lst-tw"><table class="lst-table"><colgroup><col style="width:100px"><col>${k === 'tpl' ? '<col style="width:110px">' : ''}<col style="width:150px"><col style="width:200px"><col style="width:90px"></colgroup>
    <thead><tr><th>전시ID</th><th>전시명</th>${k === 'tpl' ? '<th class="c">매핑 구분</th>' : ''}<th>전시 채널</th><th class="c">전시 기간</th><th class="c">전시여부</th></tr></thead>
    <tbody>${rows || `<tr><td class="empty" colspan="${k === 'tpl' ? 6 : 5}">이 ${T.noun}을(를) 쓰는 전시가 없습니다.</td></tr>`}</tbody></table></div></section>`;
}
// 삭제할 수 없는 이유. 없으면 ''
function delBlock(k, r) {
  const n = users(k, r).length;
  if (n) return `사용 중인 전시 ${n}건이 있어 삭제할 수 없어요. 미사용으로 바꿔 주세요`;
  if (k === 'tpl' && Object.values(TYPE_TPL).some(l => l.includes(r.id))) return 'EPC 상품 유형의 기본 템플릿이라 삭제할 수 없어요. 미사용으로 바꿔 주세요';
  return '';
}
function drawDetail() {
  const T = TABS[TAB];
  IS_NEW = DID === 'new';
  if (IS_NEW && T.readOnly) { go(TAB, null, true); return; }
  const found = IS_NEW ? null : rowsOf(TAB).find(r => String(idOf(TAB, r)) === DID);
  if (!IS_NEW && !found) { toast(`${T.noun}을(를) 찾을 수 없어요. 목록으로 돌아갑니다`); go(TAB, null, true); return; }
  CUR = IS_NEW ? T.blank() : found;
  const used = IS_NEW ? [] : users(TAB, CUR);
  $('#dCrumb').textContent = `${T.label} ${IS_NEW ? '등록' : '상세'}`;
  $('#dTitle').textContent = IS_NEW ? `${T.noun} 등록` : `${T.noun} 상세 · ${idOf(TAB, CUR)}`;
  $('#dFields').innerHTML = T.fields.map(f => fieldHtml(f, CUR, used)).join('');
  $('#dUse').innerHTML = IS_NEW ? '' : useHtml(TAB, used);
  const why = IS_NEW ? '' : delBlock(TAB, CUR);
  $('#dDel').hidden = IS_NEW || !!T.readOnly; $('#dDel').disabled = !!why; $('#dDel').title = why;
  $('#dSave').hidden = !!T.readOnly; $('#dReqHint').hidden = !!T.readOnly; $('#dSave').textContent = IS_NEW ? '등록' : '저장';
  SNAP = formState();
}
// 컬러: 색 고르기와 HEX 입력을 서로 맞춘다. EPC 속성값 · 코드는 대문자로
// 읽기 전용 탭(안내 템플릿): 사용여부를 바꾸면 바로 저장한다. 내용이 바뀐 게 아니라서 버전은 그대로
$('#dFields').addEventListener('change', e => {
  const T = TABS[TAB];
  if (!T.readOnly || e.target.name !== 'f-on') return;
  const on = e.target.value === 'Y', used = users(TAB, CUR).length;
  if (!on && used && !confirm(`사용 중인 전시 ${used}건에는 그대로 남고, 새 전시에서는 고를 수 없게 됩니다. 미사용으로 바꿀까요?`)) {
    $$('input[name="f-on"]').forEach(x => x.checked = x.value === 'Y'); return;
  }
  Object.assign(CUR, { on, upd: nowStamp(), editor: EDITOR });
  const ok = saveContent(); SNAP = formState();
  toast(`${T.noun} ${idOf(TAB, CUR)}을(를) ${on ? '사용' : '미사용'}으로 바꿨어요` + (ok ? '' : ' (브라우저 저장소를 쓸 수 없어 새로고침하면 사라져요)'));
});
$('#dFields').addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'f-hexpick') $('#f-hex').value = t.value.toUpperCase();
  if (t.id === 'f-hex' && /^#[0-9a-f]{6}$/i.test(t.value)) $('#f-hexpick').value = t.value;
  if ((t.id === 'f-epc' || t.id === 'f-code') && t.value !== t.value.toUpperCase()) { const p = t.selectionStart; t.value = t.value.toUpperCase(); t.setSelectionRange(p, p); }
  const tr = t.closest('tr[data-f]'); if (tr) { tr.classList.remove('bad'); tr.querySelector('.pc-err').hidden = true; }
});

function validate() {
  const T = TABS[TAB], errs = {}, v = {};
  T.fields.forEach(f => {
    if (f.type === 'ro') return;
    const x = fieldVal(f); v[f.k] = x;
    if (f.unitKey) v[f.unitKey] = $(`#f-${f.unitKey}`).value;
    if (f.type === 'on') return;
    if (f.req && !x) { errs[f.k] = `${f.label}을(를) 입력하세요`; return; }
    if (!x) return;
    if (f.max && x.length > f.max) errs[f.k] = `${f.max}자 이내로 입력하세요`;
    if (f.type === 'code' && IS_NEW) {
      if (!new RegExp(`^${f.prefix}[A-Z0-9-]{1,12}$`).test(x)) errs[f.k] = `${f.prefix} 뒤에 영문 대문자 · 숫자 · - 를 1~12자로 입력하세요`;
      else if (rowsOf(TAB).some(r => r.code === x)) errs[f.k] = `이미 쓰고 있는 ${f.label}예요`;
    }
    if (f.type === 'hex' && !/^#[0-9A-Fa-f]{6}$/.test(x)) errs[f.k] = '#과 16진수 6자리로 입력하세요 (예: #1E2533)';
    if (f.type === 'num' && !(/^\d+(\.\d+)?$/.test(x) && +x > 0)) errs[f.k] = '0보다 큰 숫자로 입력하세요';
    if (f.type === 'epc' && !/^[A-Z0-9_]+$/.test(x)) errs[f.k] = '영문 대문자 · 숫자 · _ 만 쓸 수 있어요';
  });
  // 같은 이름은 옵션 값이 겹치므로 막는다(템플릿 제외)
  if (TAB !== 'tpl' && v.n && !errs.n && rowsOf(TAB).some(r => r !== CUR && r.n === v.n && (TAB === 'size' || TAB === 'etc' ? r.group === v.group : true)))
    errs.n = `이미 등록된 ${TABS[TAB].nameLabel}이에요`;
  return { errs, v };
}
$('#dForm').addEventListener('submit', e => {
  e.preventDefault();
  if (TABS[TAB].readOnly) return;
  const T = TABS[TAB], { errs, v } = validate();
  $$('#dFields tr[data-f]').forEach(tr => { const m = errs[tr.dataset.f], p = tr.querySelector('.pc-err'); tr.classList.toggle('bad', !!m); p.hidden = !m; p.textContent = m || ''; });
  const first = Object.keys(errs)[0];
  if (first) { $(`#f-${first}`)?.focus(); toast('입력 내용을 확인해 주세요'); return; }
  if (!IS_NEW && formState() === SNAP) { toast('바뀐 내용이 없어요'); return; }
  const used = IS_NEW ? [] : users(TAB, CUR);
  if (!IS_NEW && CUR.on && v.on === false && used.length && !confirm(`사용 중인 전시 ${used.length}건에는 그대로 남고, 새 전시에서는 고를 수 없게 됩니다. 미사용으로 바꿀까요?`)) return;
  if (v.hex) v.hex = v.hex.toUpperCase();
  if (v.gb !== undefined) v.gb = +v.gb;
  if (v.val !== undefined) v.val = v.val === '' ? '' : +v.val;
  const stamp = { upd: nowStamp(), editor: EDITOR };
  let label;
  if (IS_NEW) {
    const r = { ...T.blank(), ...v, ...stamp };
    rowsOf(TAB).unshift(r); label = idOf(TAB, r);
  } else {
    Object.assign(CUR, v, stamp);
    label = idOf(TAB, CUR);
  }
  const ok = saveContent();
  F = F_DEF(); PAGE = 1; go(TAB, null);
  toast(`${T.noun} ${label}을(를) ${IS_NEW ? '등록' : '저장'}했어요` + (ok ? '' : ' (브라우저 저장소를 쓸 수 없어 새로고침하면 사라져요)'));
});
$('#dBack').addEventListener('click', () => {
  if (formState() !== SNAP && !confirm('저장하지 않은 내용이 있어요. 목록으로 갈까요?')) return;
  go(TAB, null);
});
$('#dDel').addEventListener('click', () => {
  const T = TABS[TAB], why = delBlock(TAB, CUR);
  if (why) { toast(why); return; }
  if (!confirm(`${T.noun} ${idOf(TAB, CUR)}을(를) 삭제할까요? 삭제하면 되돌릴 수 없어요`)) return;
  const l = rowsOf(TAB); l.splice(l.indexOf(CUR), 1); saveContent();
  const id = idOf(TAB, CUR); go(TAB, null); toast(`${T.noun} ${id}을(를) 삭제했어요`);
});

// 다른 탭에서 콘텐츠 · 전시를 바꾸면 목록을 다시 그린다(상세를 보고 있으면 입력 중인 내용을 지키려고 그대로 둔다)
window.addEventListener('storage', e => {
  const changed = reloadContent(e) | reloadList(e);
  if (changed && DID == null) drawList();
});

fromUrl();
history.replaceState(null, '', url(TAB, DID));
draw();
