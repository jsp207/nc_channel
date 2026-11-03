// @ts-nocheck
// 주문 코너 BO 운영 설정 (코너 관리 · 주문 프로세스가 함께 쓴다)
// 값은 세 단계로 이어진다: 코너 관리(기본값) → 주문 프로세스(코너 관리가 허용한 항목만 덮어씀) → 상품 전시(프로세스가 허용한 항목만 덮어씀, 상품 전시 화면에서 작업 예정).
// 바꿀 수 있는 항목: 문구 · 노출 순서 · 노출 개수 · 데이터 노출 규칙. 원천 데이터 연결(어디서 · 어떤 범위로 · 언제 불러올지)은 코너 관리에서만 정한다.
import "./corner-bo.css";
import { CORNERS, PSUB } from "./order-corner-data";

export const ITEMS = [['txt', '문구'], ['order', '노출 순서'], ['cnt', '노출 개수'], ['rule', '데이터 노출 규칙']];
const LABEL = Object.fromEntries(ITEMS);

// ---------- 원천 데이터: 코너가 불러오는 마스터와 권장 처리 방식 ----------
// scopes · sorts는 첫 값이 권장값, cache는 권장 조회 시점. why = 권장 이유(화면에 그대로 보인다)
const NET = ['5G', 'LTE'], PRICE = ['100만원 미만', '100~150만원', '150만원 이상'], JOIN = ['신규가입', '번호이동', '기기변경'];
export const SOURCES = {
  device: { n: '단말 상품 마스터', api: 'EPC 단말 PO · 옵션(색상 · 용량) · 재고', scopes: ['상품 전시에 매핑된 상품'], filters: ['판매중만', '재고 상태 표시(일시품절 · 품절)'], cache: '실시간', empty: '코너 숨김',
    why: '재고와 가격이 수시로 바뀌어 주문 화면을 열 때마다 조회해요. 상품은 상품 전시에서 이 프로세스를 매핑할 때 정해져요' },
  compare: { n: '단말 상품 마스터', api: 'EPC 단말 PO 조회', scopes: ['같은 LV3 · 같은 네트워크 단말', '직접 지정'], filters: ['판매중만', '재고 있는 단말만', '지금 보는 상품 제외'], sorts: ['출고가 가까운 순', '출시일 최신순', '직접 지정 순서'], cache: '캐시 10분', empty: '코너 숨김',
    why: '비교 대상은 자주 바뀌지 않아 10분 캐시로 충분해요. 가격은 고객이 고른 조건(요금제 · 약정)으로 화면에서 다시 계산해요' },
  plan: { n: '요금제 마스터', api: 'EPC 요금제 PO 조회', scopes: ['단말과 호환되는 요금제 전체', '상품 전시에 연결된 요금제만', '직접 지정'], filters: ['단말 네트워크(5G · LTE)와 같은 요금제만', '판매중만', '고른 가입 방식으로 가입 가능한 요금제만'], sorts: ['월정액 높은 순', '월정액 낮은 순', '추천순(AI)', '직접 지정 순서'], cache: '캐시 10분', empty: '안내 문구 노출',
    rule: { conds: [['net', '네트워크', NET], ['price', '단말 출고가', PRICE]], act: '시작 요금제', hint: '조건에 맞으면 이 요금제부터 보여 주고 기본으로 선택해요',
      catalog: ['5GX 플래티넘', '베스트 Pro', '5GX 프라임', '다이렉트 69 5G', '5GX 레귤러', '5G 슬림', 'T플랜 에센스(LTE)', 'LTE 데이터 33'],
      rows: [{ c: { net: '5G', price: '150만원 이상' }, v: '5GX 플래티넘' }, { c: { net: '5G', price: '100~150만원' }, v: '5GX 프라임' }, { c: { net: '5G', price: '100만원 미만' }, v: '다이렉트 69 5G' }, { c: { net: 'LTE', price: '전체' }, v: 'T플랜 에센스(LTE)' }] },
    why: '요금제는 자주 바뀌지 않아 10분 캐시로 충분해요. 후보는 단말과 호환되는 요금제 전체로 두고, 어디서부터 보여 줄지는 아래 데이터 노출 규칙으로 정해요' },
  subsidy: { n: '지원금 · 약정 정책', api: '공시지원금 · 선택약정 할인 계산', scopes: ['고른 단말 · 요금제 기준으로 계산'], filters: ['고를 수 있는 약정만'], sorts: ['할인 금액 큰 순', '고정 순서'], cache: '실시간', empty: '안내 문구 노출',
    rule: { conds: [['join', '가입 방식', JOIN]], act: '기본 선택', hint: '조건에 맞으면 이 할인 방법을 기본으로 선택해요' },
    why: '할인 금액은 고른 단말 · 요금제에 따라 달라져 주문 화면에서 매번 계산해요' },
  gift: { n: '사은품 마스터', api: '사은품 · 혜택 관리', scopes: ['상품 전시에 연결된 사은품만', '진행 중인 사은품 전체'], filters: ['재고 있는 사은품만', '가입 방식 조건을 채운 사은품만'], sorts: ['등록 순', '재고 많은 순', '직접 지정 순서'], cache: '실시간', empty: '코너 숨김',
    rule: { conds: [['join', '가입 방식', JOIN]], act: '맨 앞에 노출', hint: '조건에 맞으면 이 사은품을 맨 앞에 보여 줘요' },
    why: '수량 한정 사은품이 많아 재고를 실시간으로 확인해요. 사은품은 상품 전시에서 연결한 것만 보여 줘요' },
  tdp: { n: '티다팩 쿠폰', api: '쿠폰 관리 시스템', scopes: ['고른 요금제가 대상인 쿠폰'], filters: ['남은 수량이 있는 쿠폰만', '기간 안의 쿠폰만'], sorts: ['추천 태그 순', '직접 지정 순서'], cache: '캐시 10분', empty: '코너 숨김',
    rule: { conds: [['plan', '고른 요금제', ['5GX 플래티넘', '5GX 프라임', '그 외']]], act: '맨 앞에 노출', hint: '조건에 맞으면 이 제휴처를 맨 앞에 보여 줘요' },
    why: '쿠폰 목록은 쿠폰 관리 시스템이 원천이에요. 고른 요금제가 바뀌면 다시 불러와요' },
  ins: { n: '부가서비스 마스터(보험)', api: 'EPC 부가서비스 PO 조회 · 보험 분류', scopes: ['단말 출고가에 맞는 보험', '직접 지정'], filters: ['판매중만', '이 단말로 가입할 수 있는 보험만'], sorts: ['추천순(AI)', '월정액 낮은 순', '직접 지정 순서'], cache: '캐시 10분', empty: '코너 숨김',
    rule: { conds: [['price', '단말 출고가', PRICE]], act: '맨 앞에 노출', hint: '조건에 맞으면 이 보험을 맨 앞에 보여 줘요' },
    why: '보험은 단말 출고가 구간에 따라 가입할 수 있는 상품이 달라 출고가 기준으로 걸러요' },
  addon: { n: '부가서비스 마스터', api: 'EPC 부가서비스 PO 조회', scopes: ['분류 지정(콘텐츠 · 데이터)', '판매중 전체', '직접 지정'], filters: ['고른 요금제와 함께 가입할 수 있는 것만', '이미 가입한 부가서비스 제외', '판매중만'], sorts: ['추천순(AI)', '월정액 낮은 순', '직접 지정 순서'], cache: '캐시 10분', empty: '코너 숨김',
    rule: { conds: [['join', '가입 방식', JOIN], ['grade', '요금제 등급', ['5GX 프라임 이상', '그 외']]], act: '맨 앞에 노출', hint: '조건에 맞으면 이 부가서비스를 맨 앞에 보여 줘요' },
    why: '부가서비스는 종류가 많아 분류로 후보를 좁히고, 고른 요금제와 함께 가입할 수 있는지 확인해요' },
};
const SRC_OF = { 'CN-PRD-0005': 'device', 'CN-PRD-0004': 'compare', 'CN-ORD-0005': 'plan', 'CN-ORD-0084': 'subsidy', 'CN-ORD-0007': 'gift', 'CN-ORD-0008': 'tdp', 'CN-ORD-0010': 'ins', 'CN-ORD-0011': 'addon' };
// 상품 전시에서 바꿀 수 있게 기본으로 여는 항목 (요구사항 예: 할부 · 가입 유형 · 요금제 노출)
const PROD_DEF = { 'CN-ORD-0003': ['order'], 'CN-ORD-0004': ['order', 'cnt'], 'CN-ORD-0005': ['order', 'cnt', 'rule'] };
export const CACHES = ['실시간', '캐시 10분', '캐시 1시간'];
export const EMPTIES = ['코너 숨김', '안내 문구 노출'];
const MORES = ['더보기 버튼', '전체보기 팝업', '나머지 숨김'];
const SELUI = ['list', 'card', 'grid', 'chip', 'radio'];

const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const baseOf = id => CORNERS.find(c => c.id === id) || PSUB.find(c => c.id === id) || null;

// ---------- 코너별로 바꿀 수 있는 항목 ----------
// txt: 문구 칸 목록 · order: 'opts'(선택지 순서 · 노출) | 'sort'(원천 데이터 정렬) · cnt: 노출 개수 · rule: 데이터 노출 규칙 · src: 원천 데이터
export function boSpec(id) {
  const b = baseOf(id); if (!b) return null;
  const sk = SRC_OF[id], src = sk ? SOURCES[sk] : null;
  const real = b.opts.filter(x => x.x !== 'none' && x.x !== 'check');
  const txt = [];
  if (b.q && b.ui !== 'pinfo') txt.push(['q', '타이틀', b.q]);
  if (b.sub && b.ui !== 'pinfo') txt.push(['sub', '서브타이틀', b.sub]);
  if (b.moreBtn) txt.push(['more', '더보기 버튼', b.moreBtn]);
  const none = b.opts.find(x => x.x === 'none'); if (none) txt.push(['none', '미선택 선택지', none.n]);
  const order = src ? (src.sorts ? 'sort' : null) : SELUI.includes(b.ui) && real.length > 1 ? 'opts' : null;
  const cnt = !!(b.more || (src && ['list', 'card', 'grid', 'hscroll'].includes(b.ui)));
  const items = ITEMS.map(x => x[0]).filter(k => k === 'txt' ? txt.length : k === 'order' ? !!order : k === 'cnt' ? cnt : !!(src && src.rule));
  return { id, b, sk, src, txt, order, cnt, real, items, has: items.length > 0 || !!src };
}
// 코너 관리 기본값(저장 전)
function boDefault(sp) {
  const { b, src, txt, real } = sp;
  const c = { txt: Object.fromEntries(txt.map(([k, , v]) => [k, v])), allow: {}, prod: {} };
  if (sp.order === 'opts') c.order = { list: real.map(x => ({ n: x.n, on: true })) };
  if (sp.order === 'sort') c.order = { sort: src.sorts[0] };
  if (sp.cnt) c.cnt = { first: b.more || Math.min(3, real.length || 3), more: b.ui === 'card' || b.moreBtn ? MORES[0] : b.it.includes('A') ? MORES[1] : MORES[0] };
  if (src && src.rule) c.rule = { rows: clone(src.rule.rows || []) };
  if (src) c.src = { scope: src.scopes[0], filters: src.filters.slice(), cache: src.cache, empty: src.empty };
  sp.items.forEach(k => { c.allow[k] = true; c.prod[k] = (PROD_DEF[sp.id] || []).includes(k); });
  return c;
}

// ---------- 저장 (브라우저 저장소, 코너 관리에서 저장한 값) ----------
const KEY = 'nc-corner-bo-v1';
const readAll = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
export function boGet(id) {
  const sp = boSpec(id); if (!sp) return null;
  const d = boDefault(sp), s = readAll()[id];
  if (!s) return d;
  // 저장 뒤에 코너 정의가 바뀌어도 깨지지 않게 항목별로 덮는다
  ['txt', 'allow', 'prod'].forEach(k => Object.assign(d[k], s[k] || {}));
  ['order', 'cnt', 'rule', 'src'].forEach(k => { if (d[k] && s[k]) d[k] = s[k]; });
  d.dt = s.dt || '';
  return d;
}
export const boSaved = id => !!readAll()[id];
export function boSave(id, cfg) {
  const all = readAll(), n = new Date(), p = x => String(x).padStart(2, '0');
  all[id] = { ...clone(cfg), dt: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}` };
  try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
}
export function boReset(id) { const all = readAll(); delete all[id]; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* 저장소를 못 쓰면 화면 값만 돌아간다 */ } }

// 프로세스에서 보이는 값: 코너 관리가 허용하고 프로세스가 덮어쓴 항목만 프로세스 값
export const effVal = (cfg, ov, k) => cfg.allow[k] && ov && ov[k] ? ov[k] : cfg[k];
// 미리보기용: 코너 기준 데이터에 설정 값을 입힌 사본
export function boApply(b, cfg, ov) {
  const c = clone(b), sp = boSpec(b.id); if (!sp || !cfg) return c;
  const t = effVal(cfg, ov, 'txt') || {}, od = effVal(cfg, ov, 'order'), ct = effVal(cfg, ov, 'cnt');
  if (t.q != null) c.q = t.q; if (t.sub != null) c.sub = t.sub; if (t.more != null) c.moreBtn = t.more;
  if (t.none != null) c.opts.forEach(x => { if (x.x === 'none') x.n = t.none; });
  const tail = c.opts.filter(x => x.x === 'none' || x.x === 'check');
  let body = c.opts.filter(x => !tail.includes(x));
  if (od && od.list) body = od.list.filter(x => x.on).map(x => body.find(y => y.n === x.n)).filter(Boolean);
  // 처음 노출 개수: 목록형은 '더보기' 줄로 접고, 카드형은 개수만큼 보여 준 뒤 더보기 버튼. '나머지 숨김'이면 잘라 낸다
  if (ct) {
    const hide = ct.more === MORES[2];
    if (c.ui === 'list') { c.more = ct.first; if (hide) body = body.slice(0, ct.first); }
    else { if (hide || !c.moreBtn) body = body.slice(0, ct.first); if (hide) c.moreBtn = ''; }
  }
  c.opts = body.concat(tail);
  return c;
}
// 한 줄 요약 (목록 · 상세 머리줄)
export function boSummary(sp, cfg) {
  if (!sp || !cfg) return '';
  const a = [];
  if (cfg.cnt) a.push(`처음 ${cfg.cnt.first}개`);
  if (cfg.order && cfg.order.sort) a.push(cfg.order.sort);
  if (cfg.rule) a.push(`규칙 ${cfg.rule.rows.length}개`);
  if (cfg.src) a.push(cfg.src.cache);
  return a.join(' · ');
}

// ---------- 편집 화면 ----------
// mode: 'corner'(코너 관리: 기본값 + 프로세스 변경 허용 + 상품 수정 허용 기본값) | 'proc'(주문 프로세스: 허용 항목만 덮어씀 + 상품 수정 허용)
// st = { mode, cfg, ov, prod, ro } — 편집 대상은 corner 모드면 cfg, proc 모드면 ov[k](덮어쓸 때만)
const sel = (path, list, v, dis, rec) => `<select data-bf="${path}"${dis ? ' disabled' : ''}>${list.map((x, i) => `<option value="${esc(x)}"${x === v ? ' selected' : ''}>${esc(x)}${rec != null && i === rec ? ' (권장)' : ''}</option>`).join('')}</select>`;
const chk = (attr, on, dis, label, title) => `<label class="bo-chk"${title ? ` title="${esc(title)}"` : ''}><input type="checkbox" ${attr}${on ? ' checked' : ''}${dis ? ' disabled' : ''}>${label}</label>`;
function itemBody(sp, k, v, dis) {
  const { src } = sp;
  if (k === 'txt') return `<div class="bo-grid">${sp.txt.map(([f, l, d]) => `<label class="bo-l" for="bo-${f}">${l}</label><div class="bo-v"><input type="text" id="bo-${f}" data-bf="txt.${f}" value="${esc(v[f] ?? '')}" maxlength="40" placeholder="${esc(d)}"${dis ? ' disabled' : ''}><small>기준 문구: ${esc(d)}</small></div>`).join('')}</div>`;
  if (k === 'order' && v.list) return `<ol class="bo-ord">${v.list.map((x, i) => `<li class="${x.on ? '' : 'off'}"><span class="bo-n">${i + 1}</span><b>${esc(x.n)}</b>${chk(`data-bf="order.list.${i}.on"`, x.on, dis, '노출')}<span class="bo-mv"><button type="button" data-mv="${i}|-1" aria-label="${esc(x.n)} 위로"${dis || !i ? ' disabled' : ''}>↑</button><button type="button" data-mv="${i}|1" aria-label="${esc(x.n)} 아래로"${dis || i === v.list.length - 1 ? ' disabled' : ''}>↓</button></span></li>`).join('')}</ol><p class="bo-cap">노출을 끈 선택지는 고객 화면에 보이지 않아요. 미선택 선택지(예: 없이 주문 진행)는 늘 맨 아래에 있어요</p>`;
  if (k === 'order') return `<div class="bo-grid"><span class="bo-l">정렬 기준</span><div class="bo-v">${sel('order.sort', src.sorts, v.sort, dis, 0)}<small>원천 데이터(${esc(src.n)})를 이 순서로 보여 줘요. 직접 지정 순서는 상품 전시에서 고른 순서를 따라요</small></div></div>`;
  if (k === 'cnt') return `<div class="bo-grid"><span class="bo-l">처음 노출</span><div class="bo-v bo-row"><input type="number" min="1" max="20" data-bf="cnt.first" value="${v.first}" class="bo-num"${dis ? ' disabled' : ''}>개 · 나머지는 ${sel('cnt.more', MORES, v.more, dis)}</div></div>`;
  if (k === 'rule') {
    const R = src.rule, acts = [...new Set([...(R.catalog || []), ...sp.real.map(x => x.n)])];
    const rows = v.rows.map((r, i) => `<tr><td class="bo-i">${i + 1}</td>${R.conds.map(([ck, , vals]) => `<td>${sel(`rule.rows.${i}.c.${ck}`, ['전체', ...vals], r.c[ck] || '전체', dis)}</td>`).join('')}<td>${sel(`rule.rows.${i}.v`, acts, r.v, dis)}</td><td>${dis ? '' : `<button type="button" class="bo-x" data-delrule="${i}" aria-label="${i + 1}번 규칙 삭제">✕</button>`}</td></tr>`).join('');
    return `<p class="bo-cap" style="margin-top:0">${esc(R.hint)}. 위에서부터 처음 맞는 규칙 하나만 적용하고, 맞는 규칙이 없으면 정렬 기준의 첫 항목부터 보여 줘요</p>
      <div class="bo-tw"><table class="bo-rt"><thead><tr><th>순서</th>${R.conds.map(([, l]) => `<th>${l}</th>`).join('')}<th>${R.act}</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="${R.conds.length + 3}" class="bo-empty">규칙이 없어요. 늘 정렬 기준의 첫 항목부터 보여 줘요</td></tr>`}</tbody></table></div>
      ${dis ? '' : '<button type="button" class="bo-add" data-addrule>+ 규칙 추가</button>'}`;
  }
  return '';
}
function srcBody(sp, v, dis) {
  const S = sp.src;
  return `<div class="bo-grid">
    <span class="bo-l">데이터 원천</span><div class="bo-v"><b>${esc(S.n)}</b><small>${esc(S.api)}</small></div>
    <span class="bo-l">후보 범위</span><div class="bo-v">${S.scopes.length > 1 ? sel('src.scope', S.scopes, v.scope, dis, 0) : `<span>${esc(S.scopes[0])}</span>`}</div>
    <span class="bo-l">걸러내기</span><div class="bo-v bo-row">${S.filters.map(f => chk(`data-filter="${esc(f)}"`, v.filters.includes(f), dis, esc(f))).join('')}</div>
    <span class="bo-l">불러오는 시점</span><div class="bo-v">${sel('src.cache', CACHES, v.cache, dis, CACHES.indexOf(S.cache))}<small>실시간: 주문 화면을 열 때마다 원천에서 조회 · 캐시: 정한 시간 동안 같은 결과를 써요</small></div>
    <span class="bo-l">결과가 없을 때</span><div class="bo-v">${sel('src.empty', EMPTIES, v.empty, dis, EMPTIES.indexOf(S.empty))}</div>
  </div><p class="bo-why"><b>권장 처리</b>${esc(S.why)}</p>`;
}
export function boHtml(sp, st) {
  const { mode, cfg, ov, prod, ro } = st, corner = mode === 'corner';
  let h = '';
  if (sp.src) {
    h += `<section class="bo-it"><header><b>원천 데이터 연결</b><span class="bo-st ${corner ? 'own' : 'lock'}">${corner ? '코너 관리에서만 설정' : '코너 관리 값'}</span></header>${srcBody(sp, cfg.src, ro || !corner)}</section>`;
  }
  sp.items.forEach(k => {
    const allow = cfg.allow[k], mine = !corner && allow && ov && ov[k], v = corner ? cfg[k] : effVal(cfg, ov, k);
    const dis = ro || (!corner && !mine);
    const stt = corner ? '' : !allow ? '<span class="bo-st lock">코너 관리에서 고정</span>' : mine ? '<span class="bo-st own">이 프로세스 값</span>' : '<span class="bo-st">코너 기본값</span>';
    const tg = corner
      ? chk(`data-allow="${k}"`, allow, ro, '프로세스에서 변경 허용') + chk(`data-prod="${k}"`, cfg.prod[k], ro || !allow, '상품 전시 수정 허용(기본)', '프로세스를 만들 때 이 값으로 시작해요')
      : chk(`data-ov="${k}"`, !!mine, ro || !allow, '이 프로세스에서 변경') + chk(`data-prod="${k}"`, allow && prod[k], ro || !allow, '상품 전시 수정 허용');
    h += `<section class="bo-it${dis ? ' dis' : ''}" data-it="${k}"><header><b>${LABEL[k]}</b>${stt}<span class="bo-tg">${tg}</span></header>${itemBody(sp, k, v, dis)}</section>`;
  });
  return h;
}
// 편집 이벤트. 글자 입력은 다시 그리지 않고 값만 바꾼다(커서 유지), 나머지는 다시 그린다
export function boBind(root, getSt, redraw, changed) {
  // 값이 들어 있는 객체: 코너 관리면 cfg, 프로세스면 덮어쓰는 중인 ov(원천 데이터는 늘 cfg)
  const holder = k => { const s = getSt(); return k === 'src' || s.mode === 'corner' ? s.cfg : s.ov[k] ? s.ov : null; };
  const setPath = (path, val) => {
    const [k, ...rest] = path.split('.'), h = holder(k); if (!h) return;
    let o = h[k]; for (let i = 0; i < rest.length - 1; i++) o = o[rest[i]];
    o[rest[rest.length - 1]] = val;
  };
  // 같은 칸 안의 다른 입력(예: 프로세스의 노출 옵션 설정)은 건드리지 않는다
  const mine = e => !!getSt() && !!e.target.closest('.bo');
  root.addEventListener('input', e => {
    if (!mine(e)) return;
    const f = e.target.closest('[data-bf]'); if (!f || f.type === 'checkbox' || f.tagName === 'SELECT') return;
    setPath(f.dataset.bf, f.type === 'number' ? Math.max(1, Math.min(20, +f.value || 1)) : f.value); changed();
  });
  root.addEventListener('change', e => {
    if (!mine(e)) return;
    const t = e.target, s = getSt();
    if (t.dataset.bf && (t.type === 'checkbox' || t.tagName === 'SELECT')) setPath(t.dataset.bf, t.type === 'checkbox' ? t.checked : t.value);
    else if (t.dataset.filter != null) { const L = s.cfg.src.filters, f = t.dataset.filter; s.cfg.src.filters = t.checked ? [...new Set([...L, f])] : L.filter(x => x !== f); }
    else if (t.dataset.allow) s.cfg.allow[t.dataset.allow] = t.checked;
    else if (t.dataset.prod) (s.mode === 'corner' ? s.cfg.prod : s.prod)[t.dataset.prod] = t.checked;
    else if (t.dataset.ov) { const k = t.dataset.ov; if (t.checked) s.ov[k] = clone(s.cfg[k]); else delete s.ov[k]; }
    else return;
    changed(); redraw();
  });
  root.addEventListener('click', e => {
    if (!mine(e)) return;
    const b = e.target.closest('[data-mv],[data-addrule],[data-delrule]'); if (!b) return;
    const s = getSt();
    const k = b.dataset.mv ? 'order' : 'rule', h = holder(k); if (!h) return;
    if (b.dataset.mv) { const [i, d] = b.dataset.mv.split('|').map(Number), L = h.order.list, j = i + d; [L[i], L[j]] = [L[j], L[i]]; }
    else if (b.hasAttribute('data-addrule')) { const sp = boSpec(s.id), R = sp.src.rule; h.rule.rows.push({ c: Object.fromEntries(R.conds.map(([ck]) => [ck, '전체'])), v: (R.catalog || sp.real.map(x => x.n))[0] }); }
    else h.rule.rows.splice(+b.dataset.delrule, 1);
    changed(); redraw();
  });
}
