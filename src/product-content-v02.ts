// @ts-nocheck
// 상품 콘텐츠 관리 v0.2 — 안내 템플릿 목록 · 상세 · 변경이력조회
//  - product-content-v02.html          : 목록, ?id=템플릿ID 이면 상세(상세보기 탭)
//  - product-content-v02-history.html  : ?id=템플릿ID 변경이력조회 탭 (data-page="hist")
// 콘텐츠 구분 탭(컬러 · 용량 · 사이즈 · 옵션)은 없앴다. 이 메뉴는 안내 템플릿만 다룬다.
// v0.2: 안내 템플릿마다 '적용 상품유형'을 정한다. 공통(모든 상품유형) · 상품유형 선택(LV3, 여러 개) · 자동 적용 안 함
//  상품 전시 등록 v0.3이 이 값으로 연결 상품에 맞는 템플릿을 자동으로 붙인다.
// 상세 · 변경이력조회 모양은 결제관리 상세(payment-method4-merchant.html · payment-history4-detail.html)와 같다:
//  위치 표시 → 제목 → [상세보기 | 변경이력조회] 탭 → 섹션 → 하단 고정 바([목록] [수정] / [취소] [저장])
// 데이터는 display-data.ts의 CONTENT.tpl(브라우저 저장소), 사용 전시 수는 상품 전시(DISPLAYS)에서 센다.
// 변경이력은 HIST_KEY 저장소에 남기고, 기본 템플릿의 등록 · 버전 이력은 아래 seedHist가 만든다.
import "./style.css";
import "./list.css";
import "./product-content.css";
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import { CONTENT, TPL_TYPES, LV3S, tplPtype, saveContent, reloadContent, reloadList, tplUsers, nameText, dispId, nowStamp, EDITOR, CHS } from "./display-data";

requireAuthentication();

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dotD = s => String(s || '').replace(/-/g, '.');
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); }

const IS_HIST = document.body.dataset.page === 'hist';
const MAIN_URL = 'product-content-v02.html', HIST_URL = 'product-content-v02-history.html';
const ROWS = CONTENT.tpl;
const byId = id => ROWS.find(r => r.id === id);
const users = r => [...new Set([...tplUsers(r.id, 'link'), ...tplUsers(r.id, 'copy')])];

// ---------- 적용 상품유형 ----------
const ON_OPTS = [['Y', '사용'], ['N', '미사용']];
const PT_SCOPES = [['all', '공통 (모든 상품유형)'], ['type', '상품유형 선택'], ['none', '자동 적용 안 함']];
const LV3_BY_LV2 = () => { const g = {}; Object.entries(LV3S).forEach(([k, s]) => (g[s.lv2] = g[s.lv2] || []).push(k)); return g; };
const ptShort = p => p.scope === 'all' ? '공통' : p.scope === 'type' ? (p.lv3.length > 1 ? `${p.lv3[0]} 외 ${p.lv3.length - 1}` : p.lv3[0] || '-') : '자동 적용 안 함';
const ptFull = p => p.scope === 'all' ? '공통 (모든 상품유형)' : p.scope === 'type' ? `상품유형 선택: ${p.lv3.join(', ')}` : '자동 적용 안 함';
const ptCell = r => { const p = tplPtype(r); return p.scope === 'all' ? '<span class="lb ok">공통</span>' : p.scope === 'type' ? `<span title="${esc(p.lv3.join(', '))}">${esc(ptShort(p))}</span>` : '<span class="pc-dim">자동 적용 안 함</span>'; };
function ptEdit(p) {
  const g = LV3_BY_LV2();
  return `<div class="pc-radios" role="radiogroup" aria-label="적용 상품유형">${PT_SCOPES.map(([k, l]) => `<label><input type="radio" name="f-pts" value="${k}" ${p.scope === k ? 'checked' : ''}> ${l}</label>`).join('')}</div>
    <div class="pc-pt" id="f-ptype" ${p.scope === 'type' ? '' : 'hidden'}>${Object.keys(g).map(l2 => `<div class="pc-pt-g"><b>${esc(l2)}</b><span>${g[l2].map(l3 => `<label><input type="checkbox" data-l3="${esc(l3)}" ${p.lv3.includes(l3) ? 'checked' : ''}> ${esc(l3)}</label>`).join('')}</span></div>`).join('')}</div>`;
}
const ptVal = () => { const scope = $('input[name="f-pts"]:checked')?.value || 'none'; return { scope, lv3: scope === 'type' ? $$('#f-ptype [data-l3]:checked').map(c => c.dataset.l3) : [] }; };

// ---------- 변경이력 ----------
// 사용자가 바꾼 이력만 저장소에 남긴다. { id, at, by, field, before, after }
const HIST_KEY = 'nova.product-content.tpl-hist.v1';
const HIST_FIELDS = ['템플릿 등록', '버전', '적용 상품유형', '사용여부'];
const SYS = '템플릿 연동(시스템)', M0 = '김등록(P123456)';
const loadHist = () => { try { const l = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; } };
let UHIST = loadHist();
const saveHist = () => { try { localStorage.setItem(HIST_KEY, JSON.stringify(UHIST)); return true; } catch { return false; } };
const prevVer = v => { const m = /^v(\d+)\.(\d+)$/.exec(v || ''); if (!m) return '-'; const a = +m[1], b = +m[2]; return b > 0 ? `v${a}.${b - 1}` : `v${Math.max(1, a - 1)}.0`; };
// 기본 템플릿의 이력: 등록 → (버전이 올라갔으면) 템플릿 연동으로 버전 변경 → (v0.2 적용 상품유형 도입 시) 적용 상품유형 지정
function seedHist(r) {
  const out = [], first = r.v === 'v1.0';
  out.push({ id: r.id, at: first ? String(r.upd).slice(0, 16) : '2026-07-01 09:00', by: M0, field: '템플릿 등록', before: '-', after: `${r.n} (${first ? r.v : 'v1.0'})` });
  if (!first) out.push({ id: r.id, at: String(r.upd).slice(0, 16), by: SYS, field: '버전', before: prevVer(r.v), after: r.v });
  // 처음 지정한 적용 상품유형: 사용자가 바꾼 적이 있으면 첫 변경의 '변경 전' 값, 없으면 지금 값
  const firstEdit = UHIST.filter(h => h.id === r.id && h.field === '적용 상품유형').sort((a, b) => a.at.localeCompare(b.at))[0];
  const initPt = firstEdit ? firstEdit.before : ptFull(tplPtype(r));
  if (initPt !== '자동 적용 안 함') out.push({ id: r.id, at: '2026-11-17 10:00', by: M0, field: '적용 상품유형', before: '자동 적용 안 함', after: initPt });
  return out;
}
const histOf = r => [...seedHist(r), ...UHIST.filter(h => h.id === r.id)].sort((a, b) => b.at.localeCompare(a.at));

// ---------- 주소 ----------
let DID = null, PAGE = 1;
const PAGE_SIZE = 10;
const listUrl = () => MAIN_URL;
const detailUrl = id => `${MAIN_URL}?id=${encodeURIComponent(id)}`;
const histUrl = id => `${HIST_URL}?id=${encodeURIComponent(id)}`;
function go(id, replace) {
  DID = id || null;
  history[replace ? 'replaceState' : 'pushState'](null, '', id ? detailUrl(id) : listUrl());
  draw();
}
const fromUrl = () => { DID = new URLSearchParams(location.search).get('id'); };
window.addEventListener('popstate', () => { fromUrl(); draw(); });
function draw() {
  if (IS_HIST) { drawHist(); window.scrollTo(0, 0); return; }
  const detail = DID != null;
  $('#v-list').classList.toggle('on', !detail); $('#v-detail').classList.toggle('on', detail);
  if (detail) { EDIT = null; drawDetail(); } else drawList();
  window.scrollTo(0, 0);
}

// ---------- 목록 ----------
const F_DEF = () => ({ key: 'all', q: '', from: '', to: '', on: '', t: '', pt: '' });
let F = F_DEF();
const opt = (list, v) => ['<option value="">전체</option>', ...list.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`)].join('');
const PT_FILTER = () => [['@all', '공통'], ['@none', '자동 적용 안 함'], ...Object.keys(LV3S).map(k => [k, k])];
const COLS = [
  ['템플릿ID', 110, '', r => r.id], ['버전', 72, 'c', r => esc(r.v)], ['템플릿명', 0, '', r => esc(r.n)], ['콘텐츠 유형', 130, '', r => esc(r.t)],
  ['적용 상품유형', 170, '', ptCell], ['사용여부', 84, 'c', r => r.on ? '<span class="lb ok">사용</span>' : '<span class="lb off">미사용</span>'], ['최종등록(수정)일시', 160, 'c', r => dotD(r.upd)]];
function drawFilter() {
  const f = $('#lFilter'); if (!f) return;
  f.innerHTML = `
    <div class="lf-row">
      <span class="lf-g">
        <label class="lf-l" for="fKey">검색어</label>
        <select id="fKey"><option value="all">전체</option><option value="name">템플릿명</option><option value="id">템플릿ID</option></select>
        <input type="text" id="fQ" placeholder="템플릿명 또는 템플릿ID 입력" aria-label="검색어" value="${esc(F.q)}">
      </span>
      <span class="lf-g">
        <label class="lf-l" for="fFrom">조회 기간</label>
        <span class="lf-range"><input type="date" id="fFrom" aria-label="최종등록(수정)일 시작" value="${F.from}"><span aria-hidden="true">-</span><input type="date" id="fTo" aria-label="최종등록(수정)일 끝" value="${F.to}"></span>
      </span>
    </div>
    <div class="lf-row">
      <span class="lf-g"><label class="lf-l" for="fType">콘텐츠 유형</label><select id="fType">${opt(TPL_TYPES.map(t => [t, t]), F.t)}</select></span>
      <span class="lf-g"><label class="lf-l" for="fPt">적용 상품유형</label><select id="fPt">${opt(PT_FILTER(), F.pt)}</select></span>
      <span class="lf-g"><label class="lf-l" for="fOn">사용여부</label><select id="fOn">${opt(ON_OPTS, F.on)}</select></span>
      <span class="lf-acts"><button type="reset" class="btn dark">초기화</button><button type="submit" class="btn primary">조회</button></span>
    </div>`;
  $('#fKey').value = F.key;
}
function listRows() {
  const q = F.q.toLowerCase();
  return ROWS.filter(r => {
    const id = r.id.toLowerCase(), nm = String(r.n).toLowerCase();
    if (q && !(F.key !== 'id' && nm.includes(q) || F.key !== 'name' && id.includes(q))) return false;
    const day = String(r.upd).slice(0, 10);
    if (F.from && day < F.from || F.to && day > F.to) return false;
    if (F.on && (F.on === 'Y') !== !!r.on) return false;
    if (F.t && r.t !== F.t) return false;
    if (F.pt) { const p = tplPtype(r); if (F.pt === '@all' ? p.scope !== 'all' : F.pt === '@none' ? p.scope !== 'none' : !(p.scope === 'all' || p.scope === 'type' && p.lv3.includes(F.pt))) return false; }
    return true;
  }).sort((a, b) => String(b.upd).localeCompare(String(a.upd)));
}
const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const PG_IC = { first: '<path d="M7 6v12M17 6l-6 6 6 6"/>', prev: '<path d="m15 6-6 6 6 6"/>', next: '<path d="m9 6 6 6-6 6"/>', last: '<path d="M17 6v12M7 6l6 6-6 6"/>' };
function pagerHtml(pages) {
  const b = (p, label, inner, dis) => `<button type="button" data-pg="${p}" aria-label="${label}" ${dis ? 'disabled' : ''}>${inner}</button>`;
  const s = Math.floor((PAGE - 1) / 10) * 10 + 1, e = Math.min(pages, s + 9);
  const nums = Array.from({ length: e - s + 1 }, (_, i) => s + i).map(n => `<button type="button" data-pg="${n}" ${n === PAGE ? 'aria-current="page"' : ''}>${n}</button>`).join('');
  return b(1, '첫 페이지', svg(PG_IC.first), PAGE === 1) + b(PAGE - 1, '이전 페이지', svg(PG_IC.prev), PAGE === 1) + nums
    + (e < pages ? `<button type="button" disabled aria-hidden="true">…</button><button type="button" data-pg="${pages}">${pages}</button>` : '')
    + b(PAGE + 1, '다음 페이지', svg(PG_IC.next), PAGE === pages) + b(pages, '마지막 페이지', svg(PG_IC.last), PAGE === pages);
}
function drawList() {
  drawFilter();
  const rows = listRows(), pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); PAGE = Math.min(PAGE, pages);
  $('#lCount').textContent = rows.length.toLocaleString();
  const head = `<colgroup>${COLS.map(([, w]) => `<col${w ? ` style="width:${w}px"` : ''}>`).join('')}</colgroup>
    <thead><tr>${COLS.map(([h, , c]) => `<th class="${c}">${h}</th>`).join('')}</tr></thead>`;
  const body = rows.length ? rows.slice((PAGE - 1) * PAGE_SIZE, PAGE * PAGE_SIZE).map(r => `<tr>${COLS.map(([, , c, v], i) => {
    const html = v(r);
    return i === 0 ? `<td><button type="button" class="lid" data-id="${esc(html)}">${esc(html)}</button></td>` : `<td class="${c}" ${c === '' ? `title="${esc(String(html).replace(/<[^>]+>/g, ''))}"` : ''}>${html}</td>`;
  }).join('')}</tr>`).join('')
    : `<tr><td class="empty" colspan="${COLS.length}">등록 및 검색 결과가 없습니다.</td></tr>`;
  $('#lTable').innerHTML = head + `<tbody>${body}</tbody>`;
  $('#lPager').innerHTML = pagerHtml(pages);
}
if (!IS_HIST) {
  // 검색어 입력 후 Enter도 [조회]와 같다(form submit)
  $('#lFilter').addEventListener('submit', e => {
    e.preventDefault();
    F = { key: $('#fKey').value, q: $('#fQ').value.trim(), from: $('#fFrom').value, to: $('#fTo').value, on: $('#fOn').value, t: $('#fType').value, pt: $('#fPt').value };
    if (F.from && F.to && F.from > F.to) [F.from, F.to] = [F.to, F.from];
    PAGE = 1; drawList();
  });
  $('#lFilter').addEventListener('reset', e => { e.preventDefault(); F = F_DEF(); PAGE = 1; drawList(); });
  $('#lTable').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) go(b.dataset.id); });
  $('#lPager').addEventListener('click', e => { const b = e.target.closest('[data-pg]'); if (!b || b.disabled) return; PAGE = +b.dataset.pg; drawList(); });
}

// ---------- 상세 공통 (결제관리 상세 모양) ----------
const bdg = (t, tone = '') => `<span class="bdg ${tone}">${esc(t)}</span>`;
const onBdg = on => on ? bdg('사용', 'ok') : bdg('미사용', 'gray');
const sec = (t, b, h = '') => `<section class="sec"><div class="sec-h"><h3>${t}</h3>${h ? `<span class="hint">${h}</span>` : ''}</div>${b}</section>`;
const crumb = last => `<nav class="breadcrumb" aria-label="현재 위치">홈 <span aria-hidden="true">›</span> 상품관리 <span aria-hidden="true">›</span> 상품 콘텐츠 관리 <span aria-hidden="true">›</span> <strong>${last}</strong></nav>`;
function head(r, tab) {
  const n = histOf(r).length;
  return `${crumb(tab === 'hist' ? '템플릿 변경이력조회' : '템플릿 상세')}
    <div class="ph"><h1 class="h1">${esc(r.n)} ${onBdg(r.on)}</h1><div class="ph-r"><span class="dim-t">템플릿ID <span class="mid">${esc(r.id)}</span> · ${esc(r.v)}</span></div></div>
    <div class="tabs" role="tablist" aria-label="템플릿 상세 구분">${[['info', '상세보기'], ['hist', `변경이력조회 <b>${n}</b>`]].map(([k, l]) => `<button type="button" role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
}
function bbar(r, right) {
  return `<div class="pcd-sp"></div><div class="pcd-bbar">
    <div class="bb-l"><span class="bb-k">${esc(r.id)} · ${esc(r.v)}</span><span class="bb-k">사용 전시<b>${users(r).length}</b><small>건</small></span></div>
    <div class="bb-r">${right}</div></div>`;
}
function notFound() {
  toast('템플릿을 찾을 수 없어요. 목록으로 돌아갑니다');
  if (IS_HIST) setTimeout(() => location.replace(listUrl()), 800); else go(null, true);
}

// ---------- 상세보기 ----------
// 기본은 읽기 전용. [수정]을 누르면 적용 상품유형 · 사용여부만 바꿀 수 있다(템플릿 내용은 템플릿 시스템에서 관리)
let CUR = null, EDIT = null;
function useTable(list) {
  const rows = list.map(d => `<tr><td><a class="lk" href="product-v021.html?id=${d.id}">${dispId(d.id)}</a></td><td class="l">${esc(nameText(d.name)) || '이름 없음'}</td>
    <td title="${esc(d.channels.join(', '))}">${esc(d.channels.length && CHS.every(c => d.channels.includes(c)) ? 'All 채널' : d.channels[0] ? d.channels[0] + (d.channels.length > 1 ? ` 외 ${d.channels.length - 1}` : '') : '-')}</td>
    <td class="num">${d.from ? `${dotD(d.from)} ~ ${d.noEnd || !d.to ? '기한없음' : dotD(d.to)}` : '-'}</td><td>${d.show ? bdg('전시', 'ac') : bdg('미전시', 'gray')}</td></tr>`).join('');
  return `<div class="tw"><table class="tbl"><thead><tr><th>전시ID</th><th class="l">전시명</th><th>전시 채널</th><th>전시 기간</th><th>전시여부</th></tr></thead>
    <tbody>${rows || '<tr><td class="empty" colspan="5">이 템플릿을 쓰는 전시가 없습니다.</td></tr>'}</tbody></table></div>`;
}
function drawDetail() {
  const r = byId(DID);
  if (!r) { notFound(); return; }
  CUR = r;
  const p = tplPtype(r), e = EDIT, used = users(r);
  const onCtl = e ? `<div class="pc-radios" role="radiogroup" aria-label="사용여부">${ON_OPTS.map(([k, l]) => `<label><input type="radio" name="f-on" value="${k}" ${(k === 'Y') === e.on ? 'checked' : ''}> ${l}</label>`).join('')}</div>` : onBdg(r.on);
  const ptView = p.scope === 'type' ? `<div class="pt-l">${p.lv3.map(l => bdg(l)).join('')}</div>` : p.scope === 'all' ? bdg('공통 (모든 상품유형)', 'ok') : '<span class="dim-t">자동 적용 안 함</span>';
  $('#v-detail').innerHTML = `<div class="pcd">${head(r, 'info')}
    ${sec('기본 정보', `<table class="ft"><tbody>
      <tr><th>템플릿ID</th><td class="mid">${esc(r.id)}</td><th>버전</th><td>${esc(r.v)}</td></tr>
      <tr><th>템플릿명</th><td>${esc(r.n)}</td><th>콘텐츠 유형</th><td>${esc(r.t)}</td></tr>
      <tr><th class="${e ? 'req' : ''}">사용여부</th><td colspan="3">${onCtl}${e ? '<div class="sub">미사용으로 바꾸면 새 전시에서 고를 수 없어요. 이미 쓰는 전시에는 그대로 남아요</div>' : ''}</td></tr>
      <tr><th>최종 수정</th><td colspan="3">${dotD(String(r.upd).slice(0, 16))} / ${esc(r.editor || '-')}</td></tr></tbody></table>`, e ? '수정 중입니다. 아래 [저장]을 누르면 반영됩니다.' : '')}
    ${sec('적용 상품유형', `<table class="ft"><tbody><tr data-f="ptype"><th class="${e ? 'req' : ''}">적용 상품유형</th><td>${e ? ptEdit(e.ptype) : ptView}
      <div class="sub">공통은 모든 상품 전시에 자동으로 붙어요. 상품유형을 고르면 그 유형의 상품을 연결한 전시에만 붙어요. 연결 상품유형이 여러 개인 전시에서는 공통 · 유형별로 나눠 보여 줘요</div><p class="pc-err" hidden></p></td></tr></tbody></table>`)}
    ${sec('내용', `<table class="ft"><tbody><tr><th>템플릿 내용</th><td><p class="body-t">${esc(r.body)}</p></td></tr></tbody></table>`, '템플릿 내용과 버전은 템플릿 시스템에서 관리해요')}
    ${sec(`사용 전시 <em>${used.length}</em>건`, useTable(used))}
    ${bbar(r, e ? '<button type="button" class="btn" data-act="cancel">취소</button><button type="button" class="btn primary" data-act="save">저장</button>'
      : '<button type="button" class="btn" data-act="list">목록</button><button type="button" class="btn primary" data-act="edit">수정</button>')}
  </div>`;
}
const dirty = () => !!EDIT && (EDIT.on !== !!CUR.on || JSON.stringify(EDIT.ptype) !== JSON.stringify(tplPtype(CUR)));
function readEdit() { if (!EDIT) return; const on = $('input[name="f-on"]:checked'); if (on) EDIT.on = on.value === 'Y'; if ($('input[name="f-pts"]')) EDIT.ptype = ptVal(); }
function saveEdit() {
  readEdit();
  const r = CUR, e = EDIT;
  if (e.ptype.scope === 'type' && !e.ptype.lv3.length) {
    const tr = $('tr[data-f="ptype"]'); tr.classList.add('bad'); const m = tr.querySelector('.pc-err'); m.hidden = false; m.textContent = '상품유형을 1개 이상 고르세요';
    toast('입력 내용을 확인해 주세요'); return;
  }
  if (!dirty()) { toast('바뀐 내용이 없어요'); return; }
  const used = users(r).length;
  if (r.on && !e.on && used && !confirm(`사용 중인 전시 ${used}건에는 그대로 남고, 새 전시에서는 고를 수 없게 됩니다. 미사용으로 바꿀까요?`)) return;
  const at = nowStamp(), log = [];
  const bPt = ptFull(tplPtype(r)), aPt = ptFull(e.ptype);
  if (bPt !== aPt) log.push({ id: r.id, at: at.slice(0, 16), by: EDITOR, field: '적용 상품유형', before: bPt, after: aPt });
  if (!!r.on !== e.on) log.push({ id: r.id, at: at.slice(0, 16), by: EDITOR, field: '사용여부', before: r.on ? '사용' : '미사용', after: e.on ? '사용' : '미사용' });
  UHIST.push(...log); const okH = saveHist();
  Object.assign(r, { on: e.on, ptype: e.ptype, upd: at, editor: EDITOR });
  const ok = saveContent() && okH;
  EDIT = null; drawDetail();
  toast(`템플릿 ${r.id}을(를) 저장했어요` + (ok ? '' : ' (브라우저 저장소를 쓸 수 없어 새로고침하면 사라져요)'));
}

// ---------- 변경이력조회 ----------
let HF = '', HPAGE = 1;
function histPager(pages) {
  if (pages <= 1) return '';
  const B = (p, l, lab, dis) => `<button type="button" data-hpg="${p}" ${dis ? 'disabled' : ''} aria-label="${lab}">${l}</button>`;
  let h = `${B(1, '|‹', '처음', HPAGE <= 1)}${B(HPAGE - 1, '‹', '이전', HPAGE <= 1)}`;
  for (let i = 1; i <= pages; i++) h += `<button type="button" class="${i === HPAGE ? 'on' : ''}" data-hpg="${i}" ${i === HPAGE ? 'aria-current="page"' : ''}>${i}</button>`;
  return `<nav class="pager" aria-label="페이지">${h}${B(HPAGE + 1, '›', '다음', HPAGE >= pages)}${B(pages, '›|', '마지막', HPAGE >= pages)}</nav>`;
}
function drawHist() {
  const r = byId(DID);
  if (!r) { notFound(); return; }
  CUR = r;
  const all = histOf(r), rows = HF ? all.filter(h => h.field === HF) : all;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); HPAGE = Math.min(HPAGE, pages);
  const body = rows.slice((HPAGE - 1) * PAGE_SIZE, HPAGE * PAGE_SIZE).map(h => `<tr><td class="num">${dotD(h.at)}</td><td>${esc(h.by)}</td><td>${esc(h.field)}</td><td class="l dim-t">${esc(h.before)}</td><td class="l">${esc(h.after)}</td></tr>`).join('');
  $('#v-detail').innerHTML = `<div class="pcd">${head(r, 'hist')}
    <div class="bar"><span class="cnt">변경이력 <b>${rows.length}</b>건</span><span class="sp"></span>
      <label for="hField">변경항목</label><select id="hField"><option value="">전체</option>${HIST_FIELDS.map(f => `<option ${f === HF ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
    <div class="tw"><table class="tbl"><colgroup><col style="width:150px"><col style="width:180px"><col style="width:130px"><col><col></colgroup>
      <thead><tr><th>변경일시</th><th>변경자</th><th>변경항목</th><th class="l">변경 전</th><th class="l">변경 후</th></tr></thead>
      <tbody>${body || '<tr><td colspan="5" class="empty">변경이력이 없습니다.</td></tr>'}</tbody></table></div>
    ${histPager(pages)}
    <p class="desc">상품 콘텐츠 관리에서 바꾼 적용 상품유형 · 사용여부와 템플릿 시스템에서 받은 등록 · 버전 변경을 최근 순으로 보여 줘요.</p>
    ${bbar(r, '<button type="button" class="btn" data-act="list">목록</button>')}
  </div>`;
}

// ---------- 상세 · 변경이력조회 이벤트 ----------
const leaveOk = () => !dirty() || confirm('저장하지 않은 내용이 있어요. 이동할까요?');
$('#v-detail').addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) {
    const k = t.dataset.tab;
    if (k === 'hist' && !IS_HIST) { readEdit(); if (leaveOk()) { EDIT = null; location.href = histUrl(CUR.id); } }
    if (k === 'info' && IS_HIST) location.href = detailUrl(CUR.id);
    return;
  }
  const p = e.target.closest('[data-hpg]');
  if (p && !p.disabled) { HPAGE = +p.dataset.hpg; drawHist(); return; }
  const a = e.target.closest('[data-act]')?.dataset.act;
  if (a === 'list') { if (IS_HIST) location.href = listUrl(); else go(null); }
  if (a === 'edit') { EDIT = { on: !!CUR.on, ptype: JSON.parse(JSON.stringify(tplPtype(CUR))) }; drawDetail(); }
  if (a === 'cancel') { readEdit(); if (!dirty() || confirm('수정한 내용을 취소할까요?')) { EDIT = null; drawDetail(); } }
  if (a === 'save') saveEdit();
});
$('#v-detail').addEventListener('input', e => {
  const t = e.target;
  if (t.name === 'f-pts') $('#f-ptype').hidden = t.value !== 'type';
  const tr = t.closest('tr[data-f]'); if (tr) { tr.classList.remove('bad'); tr.querySelector('.pc-err').hidden = true; }
});
$('#v-detail').addEventListener('change', e => { if (e.target.id === 'hField') { HF = e.target.value; HPAGE = 1; drawHist(); } });
window.addEventListener('beforeunload', e => { readEdit(); if (dirty()) { e.preventDefault(); e.returnValue = ''; } });

// 다른 탭에서 콘텐츠 · 전시 · 이력을 바꾸면 다시 그린다(수정 중이면 입력 중인 내용을 지키려고 그대로 둔다)
window.addEventListener('storage', e => {
  if (e.key === HIST_KEY) UHIST = loadHist();
  const changed = reloadContent(e) | reloadList(e) | (e.key === HIST_KEY);
  if (!changed || EDIT) return;
  if (IS_HIST) drawHist(); else if (DID == null) drawList(); else drawDetail();
});

fromUrl();
if (IS_HIST && !DID) location.replace(listUrl());
else { history.replaceState(null, '', IS_HIST ? histUrl(DID) : DID ? detailUrl(DID) : listUrl()); draw(); }
