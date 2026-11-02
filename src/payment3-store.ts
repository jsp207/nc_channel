// @ts-nocheck
// 결제수단 기준정보 관리 v0.2.1: 목록 · 등록 · 상세 화면이 함께 쓰는 데이터와 규칙.
// 기준은 ref/payment-admin-prototype-v4.html이고, 데이터는 모두 가상값이다. 화면을 옮겨도 이어지도록 세션에 저장한다.

export const TODAY = '2026-11-01', ME = '김태리(P000100)';
export const PAGES = { list: 'payment-method3.html', create: 'payment-method3-create.html', detail: 'payment-method3-detail.html' };
export const detailUrl = (id, tab) => `${PAGES.detail}?id=${encodeURIComponent(id)}${tab ? `&tab=${tab}` : ''}`;

// ---------- 유틸 ----------
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
export const addDays = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const diffDays = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
export const stamp = () => { const d = new Date(); return `${TODAY} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const mask = v => { const s = String(v || ''); return '••••••••' + (s.length >= 4 ? s.slice(-4).toUpperCase() : '****'); };
const num = n => Number(n).toLocaleString('ko-KR');
export const mmdd = d => (d ? d.slice(5).replace('-', '/') : '');
// 목록 페이지 번호(.lst-pager 안에 넣는다)는 9개까지 보이고, 넘치면 … 뒤에 마지막 페이지
const PG_IC = { first: '<path d="M7 6v12M17 6l-6 6 6 6"/>', prev: '<path d="m15 6-6 6 6 6"/>', next: '<path d="m9 6 6 6-6 6"/>', last: '<path d="M17 6v12M7 6l6 6-6 6"/>' };
export function pagerHtml(page, pages) {
  const b = (p, label, ic, dis) => `<button type="button" data-p="${p}" aria-label="${label}" ${dis ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${PG_IC[ic]}</svg></button>`;
  let nums;
  if (pages <= 9) nums = Array.from({ length: pages }, (_, i) => i + 1);
  else { const s = Math.max(1, Math.min(page - 4, pages - 9)); nums = [...Array.from({ length: 9 }, (_, i) => s + i), '…', pages]; }
  return b(1, '첫 페이지', 'first', page === 1) + b(page - 1, '이전 페이지', 'prev', page === 1)
    + nums.map(n => n === '…' ? '<button type="button" disabled aria-hidden="true">…</button>' : `<button type="button" data-p="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`).join('')
    + b(page + 1, '다음 페이지', 'next', page === pages) + b(pages, '마지막 페이지', 'last', page === pages);
}
// 화면을 다시 그려도 포커스가 있던 입력을 잃지 않게 한다
const FOCUS_ATTRS = ['id', 'name', 'data-a', 'data-v', 'data-fid', 'data-f', 'data-key', 'data-ch', 'data-sub'];
export function redraw(el, html) {
  const a = document.activeElement;
  const sel = a && el.contains(a) ? FOCUS_ATTRS.filter(k => a.hasAttribute(k)).map(k => `[${k}="${CSS.escape(a.getAttribute(k))}"]`).join('') + (a.type === 'radio' ? `[value="${CSS.escape(a.value)}"]` : '') : '';
  el.innerHTML = html;
  if (sel) el.querySelector(sel)?.focus();
}

// ---------- 기준 데이터 ----------
export const PGS = [
  { id: 'ini', name: 'KG이니시스', verify: 'api', methods: ['신용카드', '계좌이체', '가상계좌', '휴대폰결제', '카카오페이', '네이버페이'], keys: [{ k: 'signKey', l: 'SignKey (PC 웹표준)' }, { k: 'hashKey', l: 'HashKey (모바일)' }, { k: 'iniapiKey', l: 'INIAPI KEY' }, { k: 'iniapiIv', l: 'INIAPI IV' }] },
  { id: 'kcp', name: 'NHN KCP', verify: 'manual', methods: ['신용카드', '계좌이체', '가상계좌', 'SK Pay', '카카오페이', '네이버페이'], keys: [{ k: 'siteKey', l: '사이트 키' }] },
  { id: 'toss', name: '토스페이먼츠', verify: 'api', methods: ['신용카드', '계좌이체', '가상계좌', 'SK Pay', '카카오페이', '네이버페이'], keys: [{ k: 'clientKey', l: '클라이언트 키' }, { k: 'secretKey', l: '시크릿 키' }] },
];
export const METHODS = ['신용카드', '계좌이체', '가상계좌', 'SK Pay', '카카오페이', '네이버페이', '휴대폰결제'];
const SUBS = { 'SK Pay': ['카드 간편결제', 'SK Pay 머니'], 카카오페이: ['카드 간편결제', '카카오페이 머니'], 네이버페이: ['카드 간편결제', '네이버페이 머니/포인트'] };
export const subsOf = method => SUBS[method] || []; // 간편결제만 세부수단을 계약한다
export const CHANNELS = ['통합 App', '통합 Web', 'T-Gate', '스마트플래너'];
export const OWNERS = ['T멤버십', 'TDS', 'T우주', 'T다이렉트샵'];
export const SETTLES = ['SKT', 'PS&M', 'M&S'];
export const STATUSES = ['사용', '일시중지', '미사용'];
export const KEYST = { ok: '확인완료', manual: '수동확인', none: '미확인', fail: '확인실패' };
// 결제 코너는 결제 BO 밖의 데이터라 읽기 전용으로만 참조한다
const K = (id, where, name, items) => ({ id, where, name, items: items.map(([method, mid]) => ({ method, mid })) });
export const CORNERS = [
  K('CN-001', 'TDS 액세서리', '액세서리 결제', [['신용카드', 'MID-0003'], ['계좌이체', 'MID-0003'], ['가상계좌', 'MID-0004'], ['SK Pay', 'MID-0003']]),
  K('CN-002', 'T다이렉트샵 단말', '휴대폰 할부 결제', [['신용카드', 'MID-0006'], ['SK Pay', 'MID-0006'], ['계좌이체', 'MID-0006'], ['가상계좌', 'MID-0006']]),
  K('CN-003', 'T다이렉트샵 단말', '태블릿 결제', [['신용카드', 'MID-0002'], ['계좌이체', 'MID-0002'], ['가상계좌', 'MID-0002']]),
  K('CN-004', 'T우주 이용권', '이용권 결제', [['SK Pay', 'MID-0005'], ['신용카드', 'MID-0005'], ['카카오페이', 'MID-0005'], ['네이버페이', 'MID-0005']]),
  K('CN-005', 'T우주 일반', '일반 상품 결제', [['신용카드', 'MID-0010'], ['네이버페이', 'MID-0010']]),
  K('CN-006', 'T멤버십', '멤버십 결제', [['신용카드', 'MID-0001'], ['계좌이체', 'MID-0001'], ['카카오페이', 'MID-0001'], ['휴대폰결제', 'MID-0007']]),
];
// 프로모션 수신 원천: PG별 카드사 피드와 결제사 피드(PG 경유, 키가 *)
export const PROMO_SRC = { 'KG이니시스|신용카드': 'KG이니시스 카드사 무이자·할인 피드', 'NHN KCP|신용카드': 'NHN KCP 카드사 무이자 피드', '토스페이먼츠|신용카드': '토스페이먼츠 카드사 프로모션 피드', '*|카카오페이': '카카오페이 프로모션 피드 (PG 경유)', '*|네이버페이': '네이버페이 프로모션 피드 (PG 경유)', '*|SK Pay': 'SK Pay 프로모션 피드 (PG 경유)' };

// ---------- 저장 데이터 ----------
function seed() {
  let fseq = 100, cseq = 0;
  const maskKeys = (pg, code) => Object.fromEntries(PGS.find(p => p.id === pg).keys.map((k, i) => [k.k, mask(`${code}${'A7F3C9D2'.slice(i, i + 4)}`)]));
  const M = (id, pg, code, purpose, biz, settle, owner, chs, from, to, ops, ks = 'ok', upd = '2026-09-24 14:12') => ({ id, pg, code, purpose, biz, settle, owner, chs, from, to, ops, ks, keyAt: ks === 'none' ? '' : '2026-09-20', keys: maskKeys(pg, code), upd });
  const mids = [
    M('MID-0001', 'ini', 'INIpayTM01', 'T멤버십 커머스', '에스케이텔레콤(주)', 'SKT', 'T멤버십', ['통합 App', '통합 Web'], '2026-01-01', '2027-12-31', '사용'),
    M('MID-0002', 'ini', 'INIpayTD02', 'TDS 태블릿', '에스케이피에스앤마케팅(주)', 'PS&M', 'TDS', ['통합 App', '통합 Web', 'T-Gate'], '2026-03-01', '2028-02-29', '사용', 'ok', '2026-09-11 10:40'),
    M('MID-0003', 'kcp', 'KCPacc0301', 'TDS 액세서리', '에스케이피에스앤마케팅(주)', 'PS&M', 'TDS', ['통합 App', '통합 Web'], '2026-07-01', '2027-06-30', '사용', 'manual', '2026-10-29 16:40'),
    M('MID-0004', 'kcp', 'KCPesc0302', 'TDS 액세서리 에스크로', '에스케이피에스앤마케팅(주)', 'PS&M', 'TDS', ['통합 Web'], '2026-07-01', '2027-06-30', '일시중지', 'manual', '2026-09-30 09:12'),
    M('MID-0005', 'toss', 'tosstu0401', 'T우주 이용권', '에스케이엠앤서비스(주)', 'M&S', 'T우주', ['통합 App', '통합 Web'], '2026-02-01', '', '사용', 'ok', '2026-09-25 09:30'),
    M('MID-0006', 'toss', 'tosstd0402', 'TDS 휴대폰', '에스케이피에스앤마케팅(주)', 'PS&M', 'T다이렉트샵', ['통합 App', '통합 Web', '스마트플래너'], '2026-02-01', '', '사용', 'ok', '2026-09-18 17:05'),
    M('MID-0007', 'ini', 'INIpayHP07', 'T멤버십 휴대폰결제', '에스케이텔레콤(주)', 'SKT', 'T멤버십', ['통합 App'], '2026-01-01', '2026-11-20', '사용', 'ok', '2026-09-20 08:30'),
    M('MID-0009', 'kcp', 'KCPacc0201', 'TDS 액세서리 (구 계약)', '에스케이피에스앤마케팅(주)', 'PS&M', 'TDS', ['통합 Web'], '2025-07-01', '2026-06-30', '미사용', 'manual', '2026-07-01 09:00'),
    M('MID-0010', 'toss', 'tosstu0402', 'T우주 일반', '에스케이엠앤서비스(주)', 'M&S', 'T우주', ['통합 App', '통합 Web'], '2026-10-15', '', '사용', 'none', '2026-10-30 11:20'),
  ];
  const F = (type, val, from, sub = '') => ({ id: 'f' + fseq++, sub, from, type, val, at: from > TODAY ? '2026-10-29' : from });
  const R = (val, from, sub) => F('rate', val, from, sub), X = (val, from) => F('fixed', val, from);
  const C = (mid, method, fees, subs = []) => {
    const m = mids.find(x => x.id === mid);
    // 계약 상태는 MID 상태를 따른다. 키 미확인 MID는 사용으로 둘 수 없다(V12)
    return { id: `C-${String(++cseq).padStart(3, '0')}`, mid, method, subs, status: m.ks === 'none' ? '미사용' : m.ops, fees, upd: m.upd, by: ME };
  };
  const contracts = [
    C('MID-0001', '신용카드', [R(1.5, '2026-01-01')]), C('MID-0001', '계좌이체', [R(1.0, '2026-01-01')]),
    C('MID-0001', '카카오페이', [R(2.2, '2026-01-01')], ['카드 간편결제']),
    C('MID-0001', '네이버페이', [R(2.2, '2026-01-01'), R(1.5, '2026-01-01', '네이버페이 머니/포인트')], ['카드 간편결제', '네이버페이 머니/포인트']),
    C('MID-0002', '신용카드', [R(1.9, '2026-03-01')]), C('MID-0002', '계좌이체', [R(1.2, '2026-03-01')]), C('MID-0002', '가상계좌', [X(250, '2026-03-01')]),
    C('MID-0003', '신용카드', [R(2.2, '2026-07-01'), R(2.1, '2026-12-01')]), C('MID-0003', '계좌이체', [R(1.5, '2026-07-01')]),
    C('MID-0003', 'SK Pay', [R(2.0, '2026-07-01')], ['카드 간편결제']),
    C('MID-0004', '가상계좌', [X(300, '2026-07-01')]),
    C('MID-0005', '신용카드', [R(2.5, '2026-02-01')]), C('MID-0005', 'SK Pay', [R(2.2, '2026-02-01')], ['카드 간편결제', 'SK Pay 머니']),
    C('MID-0005', '카카오페이', [R(2.4, '2026-02-01')], ['카드 간편결제']), C('MID-0005', '네이버페이', [R(2.4, '2026-02-01')], ['카드 간편결제']),
    C('MID-0006', '신용카드', [R(1.8, '2026-02-01')]), C('MID-0006', '계좌이체', [R(1.3, '2026-02-01')]), C('MID-0006', '가상계좌', [X(200, '2026-02-01')]),
    C('MID-0006', 'SK Pay', [R(1.9, '2026-02-01')], ['카드 간편결제']),
    C('MID-0007', '휴대폰결제', [R(3.5, '2026-01-01')]),
    C('MID-0009', '신용카드', [R(2.4, '2025-07-01')]), C('MID-0009', '계좌이체', [R(1.9, '2025-07-01')]),
    C('MID-0010', '신용카드', [R(2.5, '2026-11-15')]),
    C('MID-0010', '네이버페이', [R(2.4, '2026-11-15'), R(1.6, '2026-11-15', '네이버페이 머니/포인트')], ['카드 간편결제', '네이버페이 머니/포인트']),
  ];
  const conId = (mid, method) => contracts.find(c => c.mid === mid && c.method === method).id;
  const A = (at, t) => ({ at, by: ME, t });
  const P = (id, pg, m, kind, target, benefit, cond, from, to, scope, rcv, sub = '') => ({ id, pg, m, kind, target, benefit, cond, from, to, scope, rcv, sub });
  const OK_LOG = [A('2026-11-01 06:00', '성공'), A('2026-10-31 06:00', '성공')];
  return {
    mids, contracts,
    audit: {
      [conId('MID-0003', '신용카드')]: [A('2026-10-29 16:40', '수수료 이력 추가 · 2.10% (2026-12-01~)')],
      [conId('MID-0004', '가상계좌')]: [A('2026-09-30 09:12', '사용 → 일시중지 (사유: 에스크로 정산 점검)')],
      [conId('MID-0009', '신용카드')]: [A('2026-07-01 09:00', '사용 → 미사용 (KCPacc0301로 교체)')],
      [conId('MID-0010', '신용카드')]: [A('2026-10-30 11:20', '계약 등록 (신규 MID tosstu0402) · 2.50% (2026-11-15~)')],
    },
    // 프로모션은 수신 데이터라 BO에서 고치지 않는다(V15). 수동 재수신 이력만 쌓인다
    promos: [
      P('PR-INI-2611-01', 'KG이니시스', '신용카드', '무이자 할부', '신한카드(가상)', '2~6개월 무이자', '5만원 이상', '2026-11-01', '2026-11-30', 'all', '신규'),
      P('PR-INI-2611-02', 'KG이니시스', '신용카드', '부분 무이자', 'KB국민카드(가상)', '10개월 (1~3회차 고객 부담)', '30만원 이상', '2026-11-01', '2026-11-30', 'all', '신규'),
      P('PR-INI-2610-03', 'KG이니시스', '신용카드', '즉시할인', '현대카드(가상)', '5% 즉시할인 (최대 1만원)', '3만원 이상', '2026-10-01', '2026-10-31', ['MID-0001'], '종료'),
      P('PR-INI-2612-01', 'KG이니시스', '신용카드', '무이자 할부', '삼성카드(가상)', '2~3개월 무이자', '5만원 이상', '2026-12-01', '2026-12-31', 'all', '신규'),
      P('PR-KCP-2611-01', 'NHN KCP', '신용카드', '무이자 할부', '롯데카드(가상)', '2~5개월 무이자', '5만원 이상', '2026-11-01', '2026-11-30', 'all', '변경'),
      P('PR-TOS-2611-01', '토스페이먼츠', '신용카드', '청구할인', '하나카드(가상)', '3천원 청구할인', '2만원 이상', '2026-10-15', '2026-11-15', ['MID-0005'], '유지'),
      P('PR-TOS-2611-02', '토스페이먼츠', '신용카드', '무이자 할부', 'BC카드(가상)', '2~6개월 무이자', '5만원 이상', '2026-11-01', '2026-11-30', 'all', '신규'),
      P('PR-KKO-2611-01', '*', '카카오페이', '즉시할인', '카카오페이 (전체)', '첫 결제 1천원 즉시할인', '1만원 이상', '2026-11-01', '2026-11-30', 'all', '신규'),
      P('PR-KKO-2610-02', '*', '카카오페이', '적립', '카드 간편결제', '결제금액 1% 포인트 적립', '제한 없음', '2026-10-01', '2026-10-31', 'all', '종료', '카드 간편결제'),
      P('PR-NAV-2611-01', '*', '네이버페이', '적립', '네이버페이 머니/포인트', '최대 3% 적립', '1만원 이상', '2026-11-01', '2026-11-30', 'all', '신규', '네이버페이 머니/포인트'),
      P('PR-SKP-2611-01', '*', 'SK Pay', '즉시할인', 'SK Pay 머니', '2천원 즉시할인', '2만원 이상', '2026-11-01', '2026-11-30', 'all', '신규', 'SK Pay 머니'),
    ],
    psync: Object.fromEntries(Object.keys(PROMO_SRC).map(k => {
      const late = k === 'NHN KCP|신용카드';
      return [k, { last: '2026-11-01 06:00', next: '2026-11-02 06:00', res: late ? '지연 후 성공' : '성공', log: late ? [A('2026-11-01 06:00', '1차 응답 지연, 06:05 재시도 성공'), OK_LOG[1]] : OK_LOG.map(x => ({ ...x })) }];
    })),
    fseq,
  };
}
const SKEY = 'nova-payment-method3-v4', FLASHKEY = 'nova-payment-method3-flash';
function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
    if (saved && Array.isArray(saved.mids) && Array.isArray(saved.contracts)) return saved;
  } catch {}
  return seed();
}
export const DB = load();
export const save = () => { try { sessionStorage.setItem(SKEY, JSON.stringify(DB)); } catch {} };
export const nextFeeId = () => 'f' + DB.fseq++;
export const log = (cid, t) => { (DB.audit[cid] = DB.audit[cid] || []).push({ at: stamp(), by: ME, t }); };
// 다음 화면에서 한 번만 띄울 안내(등록 후 목록 등)
export const setFlash = o => { try { sessionStorage.setItem(FLASHKEY, JSON.stringify(o)); } catch {} };
export const takeFlash = () => { try { const v = JSON.parse(sessionStorage.getItem(FLASHKEY) || 'null'); sessionStorage.removeItem(FLASHKEY); return v; } catch { return null; } };

// ---------- 계산 ----------
export const midById = id => DB.mids.find(m => m.id === id);
export const midOf = c => midById(c.mid);
export const pgOf = id => PGS.find(p => p.id === id);
export const conOf = id => DB.contracts.find(c => c.id === id);
export const keyOk = m => m.ks === 'ok' || m.ks === 'manual';
// 유효기간 종료일은 비어 있을 수 있다(종료일 없음)
export const midEnd = m => m.to || '9999-12-31';
export const periodTxt = m => `${m.from} ~ ${m.to || '종료일 없음'}`;
// 수수료는 기본 요율과 세부수단 요율을 따로 이력으로 둔다. 기본이 먼저, 같은 대상은 시작일 순
const feeSub = f => f.sub || '';
export const feesSorted = c => [...c.fees].sort((a, b) => feeSub(a).localeCompare(feeSub(b)) || a.from.localeCompare(b.from));
export const feeAt = (c, d, sub = '') => feesSorted(c).filter(f => feeSub(f) === sub && f.from <= d).pop() || null;
export const curFee = c => feeAt(c, TODAY);
export const nextFee = c => feesSorted(c).find(f => !feeSub(f) && f.from > TODAY) || null;
export const curSubFees = c => [...new Set(c.fees.map(feeSub).filter(Boolean))].map(s => feeAt(c, TODAY, s)).filter(Boolean);
export const feeState = (c, f) => (f.from > TODAY ? 'sched' : feeAt(c, TODAY, feeSub(f))?.id === f.id ? 'cur' : 'end');
export const fmtFee = f => (f.type === 'rate' ? `${Number(f.val).toFixed(2)}%` : `${num(f.val)}원`);
export const cornersOf = c => CORNERS.filter(k => k.items.some(i => i.mid === c.mid && i.method === c.method));
export const expSoon = m => !!m.to && m.to >= TODAY && diffDays(TODAY, m.to) <= 30;
export const midValidToday = m => m.from <= TODAY && midEnd(m) >= TODAY;
export const dupContract = (mid, method) => DB.contracts.find(c => c.mid === mid && c.method === method);

// ---------- 프로모션 ----------
export const promoSrcKey = c => { const k = `${pgOf(midOf(c).pg).name}|${c.method}`; return PROMO_SRC[k] ? k : PROMO_SRC[`*|${c.method}`] ? `*|${c.method}` : null; };
export const promoSt = p => (p.from > TODAY ? '예정' : p.to < TODAY ? '종료' : '진행중');
// PG(또는 결제사) · 결제수단 · 계약 세부수단 · 적용 범위가 맞는 수신 건만 계약에 붙는다. 미사용이거나 만료된 MID에는 붙지 않는다
export function promosOf(c) {
  const m = midOf(c), pg = pgOf(m.pg).name;
  if (m.ops === '미사용' || midEnd(m) < TODAY) return [];
  return DB.promos.filter(p => p.m === c.method && (p.pg === '*' || p.pg === pg) && (p.scope === 'all' || p.scope.includes(m.id)) && (!p.sub || c.subs.includes(p.sub)));
}
export const livePromos = c => promosOf(c).filter(p => promoSt(p) === '진행중');

// ---------- 검증 ----------
export function feeValErr(type, val) {
  if (val === '' || val == null) return '수수료를 입력해 주세요.';
  const n = Number(val);
  if (isNaN(n)) return '숫자만 입력할 수 있어요.';
  if (type === 'rate') {
    if (n < 0.01 || n > 10) return '정률은 0.01~10.00% 사이예요.';
    if (!/^\d+(\.\d{1,2})?$/.test(String(val))) return '소수 둘째 자리까지 입력할 수 있어요.';
  } else {
    if (!Number.isInteger(n)) return '정액은 원 단위 정수예요.';
    if (n < 1 || n > 10000) return '정액은 1~10,000원 사이예요.';
  }
  return '';
}
export function feeRowErr(c, f, exceptId) {
  if (!f.from) return '적용시작일을 입력해 주세요.';
  if (f.from <= TODAY) return '적용시작일은 내일 이후여야 해요. 적용 중 요율은 바꿀 수 없어요.';
  const latest = c.fees.filter(x => x.id !== exceptId && feeSub(x) === feeSub(f)).reduce((a, x) => (x.from > a ? x.from : a), '');
  if (latest && f.from <= latest) return `기존 최신 이력(${latest})보다 뒤 날짜여야 해요.`;
  const m = midOf(c);
  if (f.from < m.from || f.from > midEnd(m)) return `MID 유효기간(${periodTxt(m)}) 안의 날짜여야 해요.`;
  return feeValErr(f.type, f.val);
}
// TODO POST /payment/mids/key-verify  키 원문은 이 요청에만 싣고 저장·로그 금지
export async function verifyKey(keys) {
  await new Promise(r => setTimeout(r, 900));
  const all = Object.values(keys).join('|').toUpperCase();
  if (all.includes('TIMEOUT')) return { result: 'error', msg: 'PG 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.' };
  if (all.includes('FAIL')) return { result: 'fail', msg: 'PG가 키를 거절했어요. (모의 응답: 인증 실패)' };
  if (Object.values(keys).some(v => String(v).trim().length < 8)) return { result: 'fail', msg: '키 형식이 맞지 않아요. 8자 이상 입력해 주세요.' };
  return { result: 'ok', msg: 'PG 응답 정상. 키를 확인했어요.' };
}
