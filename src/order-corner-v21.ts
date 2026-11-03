// @ts-nocheck
// 주문 코너 등록 v0.2.1: ref/order_mockup_1029.html(코너 유형 관리 목록 · 상세)을 product-v022.html 화면 스타일로 옮긴 버전.
// 상세의 기본 정보는 조회 전용이고, BO 운영 설정(문구 · 노출 순서 · 노출 개수 · 데이터 노출 규칙 · 원천 데이터 연결)은 여기서 편집해 저장한다.
// 코너 · 화면 · 주문 프로세스 데이터와 FO 미리보기 렌더러는 목업 그대로, 목록/상세 화면은 공통 LNB · list.css 목록 규칙을 따른다.
import "./style.css";
import "./list.css";
import { requireAuthentication } from "./auth";
// 코너 데이터(PAGES · CORNERS)는 주문 프로세스 화면과 함께 쓴다. BO 운영 설정(문구 · 순서 · 개수 · 규칙 · 원천 데이터)은 corner-bo.ts
import { PAGES, CORNERS } from "./order-corner-data";
import { boSpec, boGet, boSave, boReset, boHtml, boBind, boApply, boSummary } from "./corner-bo";

requireAuthentication();

const KIND_D = { '주문': '주문 정보를 선택하거나 입력받는 코너입니다.', '상품 연동': '상품·요금제·사은품 등 상품 데이터를 불러와 노출하는 코너입니다.' };

// 주문 프로세스(역참조용): 주문 프로세스 관리 v46 목록 기준(상품 대상 주문 유형 프로세스는 기능 삭제로 뺐다). 구성(STR)은 화면별 코너 순서
const STR = {
 full:[['P1',['CN-ORD-0001','CN-ORD-0002','CN-ORD-0003','CN-ORD-0004','CN-ORD-0005','CN-ORD-0084','CN-ORD-0006','CN-ORD-0007','CN-ORD-0008','CN-PRD-0004']],['P2',['CN-ORD-0009','CN-ORD-0010','CN-ORD-0011','CN-PAY-0001','CN-PAY-0002']],['P3',['CN-ORD-0340','CN-ORD-0049','CN-ORD-0071','CN-PAY-0004','CN-PAY-0032','CN-PAY-0033','CN-PAY-0006']],['P4',['CN-PAY-0020']],['P5',['CN-ORD-0052']]],
 tab:[['P1',['CN-ORD-0005','CN-ORD-0006','CN-ORD-0004']],['P3',['CN-ORD-0340','CN-ORD-0049','CN-PAY-0006']],['P5',['CN-ORD-0052']]],
 sim:[['USIM 가입하기',['CN-ORD-0006','CN-ORD-0005']],['P5',['CN-ORD-0052']]]
};
const PROCS = [
 ['TP-ORD-007','부가서비스','부가서비스 기본 프로세스','승인 완료','Y','sim'],
 ['TP-ORD-006','요금제','요금제 기본 프로세스','임시 저장','Y','sim'],
 ['TP-ORD-005','단말','단말 기기변경 기본 프로세스','임시 저장','Y','full'],
 ['TP-ORD-004','단말','단말 번호이동 기본 프로세스','임시 저장','Y','full'],
 ['TP-ORD-003','단말','단말 신규가입 기본 프로세스','반려','N','full']
];
// 선·후행 코너: rel=관계 설명, src=근거(req 요청 반영 · v46 조건 예시 · tbd 가안)
const LINKS = [
 {a:'CN-ORD-0003',b:'CN-ORD-0004',rel:'가입 방식 값에 따라 선택 가능한 납부 방식이 달라짐 (예: 신규가입이면 일시불)',src:'req'},
 {a:'CN-ORD-0005',b:'CN-ORD-0084',rel:'선택한 요금제에 따라 할인 방법별 할인 금액이 달라짐',src:'tbd'},
 {a:'CN-PAY-0032',b:'CN-PAY-0033',rel:'선택한 결제 수단에 따라 현금영수증 신청 영역 노출이 달라짐',src:'tbd'}
];
// 선택지가 있는 미리보기 유형 (선택 항목 표시 대상)
const SELUI = ['list', 'card', 'grid', 'chip', 'radio', 'color', 'nv'];

// ---------- 공통 ----------
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
}
// 목업 샘플 값: 사용여부 · 최근 수정일시
CORNERS.forEach((c, i) => {
  c.use = 'Y';
  c.dt = `2026-10-${26 - (i % 5)} ${String(9 + i % 8).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}`;
});
const cById = id => CORNERS.find(c => c.id === id) || null;
const pgName = k => PAGES[k] ? PAGES[k].n : k;
const pgScr = k => PAGES[k] ? PAGES[k].s : '';

// 역참조: 코너 ID → 이 코너를 쓰는 프로세스 · 화면 · 화면 안 순서
const REF = {};
PROCS.forEach(([pid, cat, pn, ap, u, str]) => {
  STR[str].forEach(([pg, ids]) => ids.forEach((cid, ix) => {
    (REF[cid] = REF[cid] || []).push({ pid, cat, pn, ap, u, page: pgName(pg), scr: pgScr(pg), pos: ix + 1, tot: ids.length });
  }));
});
const refsOf = id => REF[id] || [];
const procCnt = id => new Set(refsOf(id).map(r => r.pid)).size;
const preOf = id => LINKS.filter(l => l.b === id);
const postOf = id => LINKS.filter(l => l.a === id);

// 배지 (list.css .lb)
const kindBadge = t => `<span class="lb ${t === '상품 연동' ? 'ok' : 'live'}">${esc(t)}</span>`;
const useBadge = u => `<span class="lb ${u === 'Y' ? 'ok' : 'off'}">${u === 'Y' ? '사용' : '미사용'}</span>`;
const apBadge = a => `<span class="lb ${a === '승인 완료' ? 'live' : a === '반려' ? 'stop' : 'off'}">${esc(a)}</span>`;

// ---------- FO 미리보기 렌더러 (목업 그대로) ----------
const IC = {
 tip:'<svg class="fo-ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01" stroke-linecap="round"/></svg>',
 chev:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
 img:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>',
 chk:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>'
};
const has = (c, k) => c.it.includes(k);
function foHead(c) {
  if (!c.q) return '';
  let h = `<div class="fo-h"><div><b>${esc(c.q)}${has(c, 'I') ? IC.tip : ''}</b>${c.sub && has(c, 'S') ? `<p>${esc(c.sub)}</p>` : ''}</div>`;
  if (has(c, 'A')) h += '<a class="fo-all">전체보기</a>'; else if (c.link) h += `<a class="fo-all">${esc(c.link)}</a>`;
  return h + '</div>';
}
function foBadge(b) {
  if (!b) return '';
  const cls = b === 'BEST' ? 'bd-pu' : (b === '이용중' || b === '최근 사용' || b === '최대할인') ? 'bd-dk' : (b === 'AI PICK' || b === '추천') ? 'bd-sk' : 'bd-gy';
  return `<span class="fo-bd ${cls}">${esc(b)}</span>`;
}
function logoBox(n) {
  const col = ['#e5242b', '#1b1b1b', '#4bb04f', '#1f46d9'];
  return `<span class="fo-logo" style="background:${col[n.charCodeAt(0) % 4]}">${esc(n.slice(0, 2))}</span>`;
}
function foBody(c) {
  const O = c.opts;
  switch (c.ui) {
  case 'info':
    return `<div class="fo-pimg"><div class="fo-phone"></div></div><div class="fo-note">해당 상품은 11월 16일 이후 신규 가입 중단될 예정입니다.</div><div class="fo-pinfo"><p class="fo-cp">${esc(c.sub)}</p><b class="fo-pn">${esc(c.q)}</b><div class="fo-tags"><span class="fo-bd bd-dk">장기고객 혜택</span><span class="fo-bd bd-sk">신규</span><span class="fo-bd bd-gy">바로보상</span><span class="fo-bd bd-gy">무료배송</span></div><div class="fo-warn">만 18세 이상 만 34세 미만의 고객님만 가입할 수 있는 상품이에요</div></div>`;
  case 'color':
    return foHead(c) + `<p class="fo-sm">${esc(O[0].n)}</p><div class="fo-sw">` + O.map((x, i) => `<i class="${i ? '' : 'on'}${x.b ? ' so' : ''}" style="background:${x.x}" title="${esc(x.n + (x.b ? ` (${x.b})` : ''))}"></i>`).join('') + '</div>';
  case 'list': {
    const lim = c.more || 99;
    return foHead(c) + '<div class="fo-ls">' + O.map((x, i) => {
      if (i >= lim) return '';
      const none = x.x === 'none', sold = x.b === '품절' || x.b === '일시품절';
      return `<div class="fo-op${i === 0 && !c.chev ? ' on' : ''}${sold ? ' sold' : ''}${none ? ' none' : ''}${c.chev ? ' row' : ''}"><div class="fo-l"><b>${esc(x.n)}${c.chev && x.b ? ` <span class="fo-lb">${esc(x.b)}</span>` : ''}${!c.chev && x.b && !sold ? ' ' + foBadge(x.b) : ''}</b>${x.p && !c.chev ? `<strong>${esc(x.p)}</strong>` : ''}${x.d ? `<small>${esc(x.d)}</small>` : ''}</div>${sold ? `<span class="fo-sold">${esc(x.b)}</span>` : ''}${c.chev ? `<span class="fo-r">${x.p ? `<small>${esc(x.p)}</small>` : ''}${none ? '' : IC.chev}</span>` : ''}</div>`;
    }).join('') + (O.length > lim ? '<div class="fo-op more">더보기</div>' : '') + '</div>';
  }
  case 'card':
    return foHead(c) + '<div class="fo-ls">' + O.map((x, i) => {
      if (x.x === 'none') return `<div class="fo-op none"><div class="fo-l"><b>${esc(x.n)}</b></div></div>`;
      return `<div class="fo-op card${i === 0 ? ' on' : ''}"><div class="fo-l">${foBadge(x.b)}<b>${esc(x.n)}</b>${x.d ? `<small>${esc(x.d)}</small>` : ''}${x.p ? `<strong>${esc(x.p)}</strong>` : ''}${has(c, 'L') ? '<a class="fo-lk">자세히 보기</a>' : ''}</div>${c.logo ? logoBox(x.n) : ''}</div>`;
    }).join('') + (c.moreBtn ? `<div class="fo-morebtn">${esc(c.moreBtn)}</div>` : '') + '</div>';
  case 'grid':
    return foHead(c) + '<div class="fo-gd">' + O.map(x => `<div class="fo-gi"><div class="fo-gimg"><i class="fo-rd"></i>${IC.img}</div><small>${esc(x.d)}</small><b>${esc(x.n)}</b><span class="fo-gb">자세히 보기</span></div>`).join('') + '</div>';
  case 'hscroll':
    return foHead(c) + '<div class="fo-hs">' + O.map(x => `<div class="fo-hi"><div class="fo-gimg">${IC.img}</div><b>${esc(x.n)}</b><strong>${esc(x.p)}</strong><small>${esc(x.d)}</small>${x.b ? `<span class="fo-bd bd-gy">${esc(x.b)}</span>` : ''}</div>`).join('') + '</div>';
  case 'chip':
    return foHead(c) + '<div class="fo-ch">' + O.map((x, i) => `<span class="${i ? '' : 'on'}">${esc(x.n)}</span>`).join('') + '</div><p class="fo-sm">사용 중인 번호</p><div class="fo-in">010-1234-5678<em>확인</em></div>';
  case 'radio':
    return foHead(c) + '<div class="fo-rl">' + O.map((x, i) => `<div class="fo-ri"><i class="${i ? '' : 'on'}"></i><span>${esc(x.n)}</span>${foBadge(x.b)}</div>${x.d && has(c, 'D') ? `<p class="fo-rd2">${esc(x.d)}</p>` : ''}`).join('') + '</div>';
  case 'form':
    return foHead(c) + O.map(x => {
      if (x.x === 'check') return `<p class="fo-ck">${IC.chk}${esc(x.n)}</p>`;
      return `<p class="fo-sm">${esc(x.n)}</p><div class="fo-in${x.n === '주소' || x.n === '상세주소' ? ' ph' : ''}">${esc(x.d)}${x.n === '주소' ? '<em>우편번호 찾기</em>' : ''}</div>`;
    }).join('');
  case 'sum':
    return foHead(c) + '<div class="fo-sum">' + (c.id === 'CN-ORD-0340' ? '<div class="fo-sp"><i></i><b>iPhone 17 Pro</b><strong>999,999원</strong></div>' : '') + O.map((x, i) => {
      const last = i === O.length - 1 && c.id !== 'CN-ORD-0340';
      return `<div class="fo-sr${last ? ' tot' : ''}"><span>${esc(x.n)}</span><em>${esc(x.d)}</em></div>`;
    }).join('') + '</div>';
  case 'terms':
    return `<div class="fo-sheet"><div class="fo-h"><div><b>${esc(c.q)}</b></div><span class="fo-x">✕</span></div><p class="fo-ck all"><i></i>전체 동의</p>` + O.map(x => `<p class="fo-tl">${IC.chk}<span>${esc(x.n)}</span>${IC.chev}</p>`).join('') + '<button type="button" class="fo-btn pri">동의하고 주문하기</button></div>';
  case 'done':
    return `<div class="fo-done"><span class="fo-ok">${IC.chk}</span><b>${esc(c.q)}</b><p>${esc(c.sub)}</p><div class="fo-pimg sm"><div class="fo-phone"></div></div><div class="fo-ch">` + O.map((x, i) => `<span class="${i ? 'pri' : ''}">${esc(x.n)}</span>`).join('') + '</div></div>';
  }
  return '';
}
const foCard = c => `<div class="fo${c.ui === 'terms' ? ' bs' : ''}">${foBody(c)}</div>`;

// ---------- 목록 ----------
const PS = 10;
const Q = { use: '', kind: '', key: 'n', kw: '', page: 1 };
function readForm() {
  Q.use = ($('input[name=fUse]:checked') || {}).value || '';
  Q.kind = $('#fKind').value; Q.key = $('#fKey').value; Q.kw = $('#fKw').value.trim().toLowerCase(); Q.page = 1;
}
const filtered = () => CORNERS.filter(c =>
  (!Q.use || c.use === Q.use) && (!Q.kind || c.t === Q.kind) && (!Q.kw || String(Q.key === 'i' ? c.id : c.n).toLowerCase().includes(Q.kw)));
function linkCell(id) {
  const a = preOf(id).length, b = postOf(id).length;
  if (!a && !b) return '<span class="faint">-</span>';
  return `<span class="lks">${a ? `<span class="lb new">선행 ${a}</span>` : ''}${b ? `<span class="lb chk">후행 ${b}</span>` : ''}</span>`;
}
// 페이지 번호 (display-list2와 같은 모양)
const ARR = { prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>', next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>' };
function pagerHtml(page, pages) {
  let h = `<button type="button" data-p="${page - 1}" aria-label="이전 페이지"${page <= 1 ? ' disabled' : ''}>${ARR.prev}</button>`;
  for (let i = 1; i <= pages; i++) h += `<button type="button" data-p="${i}"${i === page ? ' aria-current="page"' : ''}>${i}</button>`;
  return h + `<button type="button" data-p="${page + 1}" aria-label="다음 페이지"${page >= pages ? ' disabled' : ''}>${ARR.next}</button>`;
}
function renderList() {
  const L = filtered(), pages = Math.max(1, Math.ceil(L.length / PS));
  if (Q.page > pages) Q.page = pages;
  const off = (Q.page - 1) * PS;
  $('#cCount').textContent = L.length;
  $('#tabCnt').textContent = CORNERS.length;
  $('#cWrap').hidden = !L.length;
  $('#cEmpty').hidden = !!L.length;
  $('#cBody').innerHTML = L.slice(off, off + PS).map((c, i) => {
    const pc = procCnt(c.id);
    return `<tr data-id="${c.id}"><td class="c">${off + i + 1}</td><td class="c"><div class="thumb">${foCard(c)}</div></td><td class="c">${kindBadge(c.t)}</td><td class="c mono">${c.id}</td><td><span class="cn">${esc(c.n)}</span></td><td class="c">${linkCell(c.id)}</td><td class="c">${pc ? `<span class="pcnt">${pc}</span>` : '<span class="faint">0</span>'}</td><td class="c">${c.use}</td><td class="c dt">${boGet(c.id)?.dt || c.dt}</td></tr>`;
  }).join('');
  $('#pager').innerHTML = L.length ? pagerHtml(Q.page, pages) : '';
}

// ---------- 상세 (조회 전용) ----------
const EXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const SEP = '<span class="sep">/</span>';
const row = (k, v) => `<div class="ft-row"><div class="ft-l">${k}</div><div class="ft-v">${v}</div></div>`;
const none = '<span class="faint">없음</span>';
const tbd = t => `<span class="tbd">${t || '미확정'}</span>`;
function optText(c) {
  const J = opts => opts.map(x => esc(x.n)).join(SEP);
  if (!SELUI.includes(c.ui) || !c.opts.length) return none;
  return `<span>${J(c.opts)}${c.t === '상품 연동' ? `<span class="faint"> · ${esc(c.src)} 연동, 예시 값</span>` : ''}</span>`;
}
// 선·후행 코너는 새 탭으로 그 코너 상세를 연다 (주소 #코너ID)
function linkChips(ls, key) {
  if (!ls.length) return none;
  return '<div class="chips">' + ls.map(l => {
    const x = cById(l[key]);
    return `<a class="lc" href="#${x.id}" target="_blank" rel="noopener" title="${esc(l.rel)}"><span class="mono">${x.id}</span>${esc(x.n)}${l.src === 'tbd' ? '<span class="prov">가안</span>' : ''}${EXT}</a>`;
  }).join('') + '</div>';
}
function procChips(id) {
  const seen = new Map();
  refsOf(id).forEach(r => { if (!seen.has(r.pid)) seen.set(r.pid, r); });
  if (!seen.size) return none;
  return '<div class="chips">' + [...seen.values()].map(r => `<button type="button" class="lc" data-pid="${r.pid}"><span class="mono">${r.pid}</span>${esc(r.pn)}${EXT}</button>`).join('') + '</div>';
}
function phraseText(c) {
  if (c.qs) return c.qs.map(esc).join(SEP);
  if (c.q && c.ui !== 'info') return esc(c.q) + (c.sub ? `<p class="kd">${esc(c.sub)}</p>` : '');
  return none;
}
function useTable(id) {
  const R = refsOf(id);
  if (!R.length) return '<div class="empty">이 코너를 쓰는 주문 프로세스가 없습니다.</div>';
  return '<div class="tw"><table class="utbl"><thead><tr><th>프로세스 ID</th><th>구분</th><th>프로세스명</th><th>승인 상태</th><th>사용여부</th><th>노출 화면</th><th>화면 안 순서</th></tr></thead><tbody>'
    + R.map(r => `<tr><td class="mono">${r.pid}</td><td>${esc(r.cat)}</td><td class="l">${esc(r.pn)}</td><td>${apBadge(r.ap)}</td><td>${r.u}</td><td class="l">${esc(r.page)}${r.scr ? ` <span class="faint mono">${r.scr}</span>` : ''}</td><td><span class="ord">${r.pos}<small> / ${r.tot}</small></span></td></tr>`).join('')
    + '</tbody></table></div>';
}
function renderDetail(c) {
  $('#dName').textContent = c.n;
  $('#dId').textContent = c.id;
  $('#dBadges').innerHTML = kindBadge(c.t) + useBadge(c.use);
  $('#dPv').innerHTML = foCard(c);
  $('#dInfo').innerHTML =
    row('코너명', `<b>${esc(c.n)}</b>`) +
    row('코너 ID', `<span class="mono">${c.id}</span>`) +
    row('구분', kindBadge(c.t) + `<span class="kd1">${KIND_D[c.t]}</span>`) +
    row('표시 문구', phraseText(c)) +
    row('선택 항목', optText(c)) +
    row('선행 코너', linkChips(preOf(c.id), 'a')) +
    row('후행 코너', linkChips(postOf(c.id), 'b')) +
    row('사용 프로세스', procChips(c.id)) +
    (boSpec(c.id)?.src ? row('원천 데이터', `${esc(boSpec(c.id).src.n)}<span class="kd1">아래 BO 운영 설정 › 원천 데이터 연결에서 불러오는 방식을 정해요</span>`) : c.src ? row('연동 데이터', `${esc(c.src)} ${tbd('연동 방식 미확정')}`) : '') +
    (c.screens ? row('연결 화면', c.screens.map(esc).join('<span class="sep">→</span>')) : '');
  $('#dUse').innerHTML = useTable(c.id);
  openBo(c);
}

// ---------- BO 운영 설정: 코너 기본값 편집 (저장하면 주문 프로세스 · 상품 전시의 기본값이 된다) ----------
let BO = null, BOSNAP = '', BOC = null;
const boDirty = () => !!BO && JSON.stringify(BO.cfg) !== BOSNAP;
function openBo(c) {
  BOC = c;
  const sp = boSpec(c.id);
  $('#stBo').hidden = !sp || !sp.has;
  $('#bBoSave').hidden = $('#bBoReset').hidden = !sp || !sp.has;
  if (!sp || !sp.has) { BO = null; return; }
  BO = { id: c.id, mode: 'corner', cfg: boGet(c.id), ov: {}, prod: {}, ro: false };
  BOSNAP = JSON.stringify(BO.cfg);
  drawBo();
}
function drawBo() {
  const sp = boSpec(BO.id);
  $('#dBo').innerHTML = `<p class="bo-head">값은 <b>코너 관리 → 주문 프로세스 → 상품 전시</b> 순서로 이어져요. '프로세스에서 변경 허용'을 끄면 주문 프로세스는 이 값을 그대로 써요. 상품 전시에서는 상품별로 언제든 고칠 수 있어요.</p>
    <div class="bo-flow" aria-hidden="true"><span class="on">코너 관리 기본값</span><i>→</i><span>주문 프로세스 (허용 항목만)</span><i>→</i><span>상품 전시 (상품별 수정)</span></div>` + boHtml(sp, BO);
  boChanged();
}
// 값이 바뀌면 미리보기 · 저장 버튼 · 머리줄 요약을 맞춘다 (입력칸은 다시 그리지 않는다)
function boChanged() {
  const sp = boSpec(BO.id);
  $('#dPv').innerHTML = foCard(boApply(BOC, BO.cfg));
  $('#bBoSave').disabled = !boDirty();
  $('#dBoSum').textContent = [boSummary(sp, BO.cfg), BO.cfg.dt ? `최근 저장 ${BO.cfg.dt}` : '저장한 적 없음 · 기본값 사용 중'].filter(Boolean).join(' · ');
}
boBind($('#dBo'), () => BO, drawBo, boChanged);
$('#bBoSave').addEventListener('click', () => {
  if (!BO || !boDirty()) return;
  const ok = boSave(BO.id, BO.cfg); BO.cfg = boGet(BO.id); BOSNAP = JSON.stringify(BO.cfg); drawBo(); renderList();
  toast(ok ? '저장했어요. 이 코너를 쓰는 주문 프로세스의 기본값이 바뀌어요 (프로세스에서 덮어쓴 값은 그대로예요)' : '브라우저 저장소를 쓸 수 없어 저장하지 못했어요');
});
$('#bBoReset').addEventListener('click', () => {
  if (!BO || !confirm('저장한 BO 운영 설정을 지우고 기본값으로 되돌릴까요?')) return;
  boReset(BO.id); BO.cfg = boGet(BO.id); BOSNAP = JSON.stringify(BO.cfg); drawBo(); renderList(); toast('기본값으로 되돌렸어요');
});

// ---------- 화면 전환: 주소 #코너ID면 상세, 아니면 목록 ----------
let lastHash = location.hash;
function route() {
  // 저장하지 않은 BO 운영 설정이 있으면 확인한다 (취소하면 주소를 되돌린다)
  if (boDirty() && location.hash !== lastHash && !confirm('저장하지 않은 BO 운영 설정이 있어요. 이동할까요?')) { history.replaceState(null, '', lastHash || location.pathname + location.search); return; }
  lastHash = location.hash; BO = null;
  const c = cById(decodeURIComponent(location.hash.slice(1)));
  $('#v-list').classList.toggle('on', !c);
  $('#v-detail').classList.toggle('on', !!c);
  if (c) renderDetail(c); else renderList();
  window.scrollTo(0, 0);
}
const openDetail = id => { location.hash = id; };
const openList = () => {
  if (boDirty() && !confirm('저장하지 않은 BO 운영 설정이 있어요. 목록으로 갈까요?')) return;
  BO = null; history.pushState(null, '', location.pathname + location.search); route();
};
window.addEventListener('hashchange', route);

// ---------- 이벤트 ----------
$('#cFilter').addEventListener('submit', e => { e.preventDefault(); readForm(); renderList(); });
// 초기화: 폼 값이 기본값으로 돌아간 뒤 조회
$('#cFilter').addEventListener('reset', () => setTimeout(() => { $('#bClr').hidden = true; readForm(); renderList(); }));
$('#fKw').addEventListener('input', e => { $('#bClr').hidden = !e.target.value; });
$('#fKey').addEventListener('change', e => { $('#fKw').placeholder = e.target.value === 'i' ? '코너 ID를 입력하세요' : '코너명을 입력하세요'; });
$('#bClr').addEventListener('click', () => { $('#fKw').value = ''; $('#bClr').hidden = true; $('#fKw').focus(); });
$('#pager').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; Q.page = +b.dataset.p; renderList(); });
$('#cBody').addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) openDetail(tr.dataset.id); });
$('#topTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tt]');
  if (b && b.dataset.tt !== '상품') toast(`${b.dataset.tt} 탭은 전시팀 목업에서 관리합니다. 통합 시 연결됩니다.`);
});
$('#dInfo').addEventListener('click', e => {
  const p = e.target.closest('[data-pid]');
  if (p) toast(`주문 프로세스 관리 상세(${p.dataset.pid})를 새 탭으로 엽니다.`);
});
$('#bBack').addEventListener('click', openList);
$('#bList').addEventListener('click', openList);

route();
