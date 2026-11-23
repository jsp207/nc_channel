// @ts-nocheck
// 결제수단 기준정보 관리 v0.2.3 (2026-11-20 재구성). v0.2.2(payment4.ts)의 정책 · 구조를 따르지 않고 새로 짰다.
//  - 목록 단위는 "PG사 × 결제수단" 조합 1건. 시안(목록 이미지)의 컬럼 그대로: No. · PG사 · 결제 수단 · 사용 여부 · 등록 가맹점수 · 최종 수정 일시 · 최근 수정자
//  - 상세는 ref/payment.html 상세 구성: 기준정보 → 가맹점(MID) 등록정보 → 결제 프로모션 → 변경 이력
//  - 가맹점(MID)은 한 번에 여러 건 등록하고, 적용 수수료는 MID 바로 옆에 묶어서 보여 준다
// PG 관리 v0.2.3도 이 파일이 그린다. PG사 마스터(S.pgs)를 결제수단 기준정보와 같은 저장소에 두어,
//  PG사에 체크한 "제공 결제수단"만 결제수단 등록에서 고를 수 있고, 기준정보가 있는 결제수단은 PG사에서 빼거나 PG사를 지울 수 없다.
//  인증키는 v0.2.3부터 MID 단위(결제수단 상세 > 가맹점)로 옮겼고, PG사 화면에서는 MID별 등록 현황만 보여 준다.
// 화면 = HTML 파일 6개(body data-page: list · detail · create · pgList · pgDetail · pgForm). 데이터는 sessionStorage로 화면 사이에 이어 받는다. 모두 가상값이다.
import "./admin-shell.css";
import "./payment2.css";
import "./payment4.css";
import "./list-unified.css";
import "./payment5.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

/* ================= 기준값 ================= */
const USER = '김결제(P000010)';
const SKEY = 'nova-payment-method5-v023';
const FILES = { list: 'payment-method5.html', detail: 'payment-method5-detail.html', create: 'payment-method5-create.html', pgList: 'payment-pg5.html', pgDetail: 'payment-pg5-detail.html', pgForm: 'payment-pg5-form.html' };
/* 결제수단 표준 목록(PG사 등록 화면의 체크 항목 순서). PG사 등록에서 직접 추가한 결제수단은 뒤에 붙는다 */
const METHOD_CATALOG = ['신용카드', '계좌이체', '가상계좌', '휴대폰결제', '카카오페이', '네이버페이', '토스페이', 'SK Pay', '페이코'];
const LINK_TYPES = [['API', 'API'], ['SFTP', 'SFTP 파일'], ['수동 파일', '수동 파일 등록']];
const recOf = lt => lt === '수동 파일' ? '수동' : '자동';
/* PG사 목록 · 결제수단은 PG사 관리(S.pgs)에서 온다 */
const pgNames = () => S.pgs.map(p => p.name);
const pgOf = name => S.pgs.find(p => p.name === name);
const pgById = id => S.pgs.find(p => p.id === id);
const allMethods = () => { const s = new Set(S.pgs.flatMap(p => p.methods)); return [...METHOD_CATALOG.filter(m => s.has(m)), ...[...s].filter(m => !METHOD_CATALOG.includes(m))]; };
const combosOfPg = name => S.combos.filter(c => c.pg === name);
const PRODUCTS = ['단말', '액세서리', '구독', '요금납부', '멤버십 커머스'];
const FEE_TYPES = [['정률', '정률(%)'], ['정액', '정액(원/건)'], ['혼합', '혼합(% + 원/건)']];
const PAGE_SIZE = 10;

/* ================= 유틸 ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const clone = o => JSON.parse(JSON.stringify(o));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const nowStr = () => { const d = new Date(); return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
/* 2026-09-30 17:45 → 26.09.30 17:45 (시안 표기) */
const dt = s => s ? s.slice(2, 16).replace(/-/g, '.') : '-';
const opts = (arr, v, all) => (all != null ? `<option value="">${esc(all)}</option>` : '') + arr.map(o => { const [val, lab, dis] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''} ${dis ? 'disabled' : ''}>${esc(lab)}</option>`; }).join('');
const radios = (path, arr, v) => `<div class="ck-g">${arr.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<label><input type="radio" name="${path}" value="${esc(val)}" data-b="${path}" data-r ${String(v) === String(val) ? 'checked' : ''}>${esc(lab)}</label>`; }).join('')}</div>`;
const yn = v => `<span class="bdg ${v === 'Y' ? 'ok' : 'gray'}">${v === 'Y' ? '사용' : '미사용'}</span>`;
const feeTxt = m => m.feeType === '정액' ? `${Number(m.flat).toLocaleString()}원/건` : m.feeType === '혼합' ? `${m.rate}% + ${Number(m.flat).toLocaleString()}원/건` : `${m.rate}%`;
const maskAcct = a => { const s = String(a || ''); return s.length <= 4 ? '••••' : `•••• ${s.slice(-4)}`; };
const crumb = a => `<nav class="crumb" aria-label="현재 위치">${a.map((c, i) => i === a.length - 1 ? `<b>${esc(c)}</b>` : esc(c)).join('<span aria-hidden="true">›</span>')}</nav>`;
function errBox(e) { return e && e.length ? `<div class="call bad errbox" role="alert"><div><b>저장할 수 없습니다. 아래 항목을 확인하세요.</b><ul>${e.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : ''; }
function get(p) { return p.split('.').reduce((o, k) => o == null ? o : o[k], S); }
function set(p, v) { const ks = p.split('.'); let o = S; ks.slice(0, -1).forEach(k => o = o[k]); o[ks[ks.length - 1]] = v; }
function toast(msg) { const r = $('#toast-root'); r.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span></div>`; clearTimeout(toast.t); toast.t = setTimeout(() => r.innerHTML = '', 4500); }
/* 페이지 번호: 처음 · 이전 · 번호 최대 9개 · … 마지막 번호 · 다음 · 마지막 (v0.2.2 목록과 같은 모양) */
function paginate(rows, cur) {
  const tot = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); cur = Math.min(Math.max(1, cur || 1), tot);
  const B = (p, l, lab, dis) => `<button type="button" data-a="page" data-p="${p}" ${dis ? 'disabled' : ''} aria-label="${lab}">${l}</button>`;
  const N = i => `<button type="button" class="pg${i === cur ? ' on' : ''}" data-a="page" data-p="${i}" ${i === cur ? 'aria-current="page"' : ''}>${i}</button>`;
  let a = 1, b = tot; if (tot > 10) { a = Math.max(1, Math.min(cur - 4, tot - 8)); b = a + 8; }
  let h = `<nav class="pager" aria-label="페이지">${B(1, '|‹', '처음', cur <= 1)}${B(cur - 1, '‹', '이전', cur <= 1)}`;
  for (let i = a; i <= b; i++) h += N(i);
  if (b < tot) h += `<span class="el">…</span>${N(tot)}`;
  h += `${B(cur + 1, '›', '다음', cur >= tot)}${B(tot, '›|', '마지막', cur >= tot)}</nav>`;
  return { rows: rows.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE), html: h, cur };
}

/* ================= 목업 데이터 ================= */
let midSeq = 0;
function M(name, mid, feeType, rate, flat, vat, settle, bank, acct, from, to = '', use = 'Y') {
  return { id: 'M' + String(++midSeq).padStart(4, '0'), name, mid, feeType, rate, flat, vat, settle, bank, holder: settle === 'SK텔레콤' ? '에스케이텔레콤(주)' : settle, acct, from, to, keyTail: mid.slice(-4), use };
}
function seed() {
  midSeq = 0;
  // 시안 목록 8건. id 순서 = 등록 순서(No.)
  const C = (n, pg, m, upd, by, prods, mids, use = 'Y') => ({ id: 'PM-' + String(n).padStart(4, '0'), no: n, pg, m, use, prods, mids, promos: [], upd, by, hist: [{ at: upd, by, item: '기준정보', desc: `${pg} / ${m} 등록` }] });
  const list = [
    C(1, 'KG 이니시스', '신용카드', '2026-09-28 16:05', '정도현(P033121)', ['단말', '액세서리'], [M('SKT 단말결제', 'INIpayTD01', '정률', 2.1, 0, '별도', 'SK텔레콤', '신한은행', '110-000-000101', '2026-01-01', '2027-12-31'), M('SKT 액세서리', 'INIpayAC02', '정률', 2.3, 0, '별도', 'SK텔레콤', '하나은행', '110-000-000102', '2026-03-01', '2027-12-31')]),
    C(2, 'NHN KCP', '휴대폰결제', '2026-09-28 16:05', '정도현(P033121)', ['액세서리'], [M('SKT 휴대폰결제', 'KCPhp0201', '정률', 3.5, 0, '포함', 'SK텔레콤', '국민은행', '110-000-000201', '2026-01-01', '2026-12-31')]),
    C(3, 'KG 이니시스', '계좌이체', '2026-09-28 16:05', '정도현(P033121)', ['단말', '액세서리'], [M('SKT 계좌결제', 'INIpayBK03', '혼합', 1.0, 200, '별도', 'SK텔레콤', '국민은행', '110-000-000301', '2026-01-01')]),
    C(4, 'KG 이니시스', '카카오페이', '2026-09-28 16:05', '정도현(P033121)', ['구독', '멤버십 커머스'], [M('T멤버십 카카오페이', 'INIpayKK04', '정률', 2.2, 0, '별도', 'SK텔레콤', '신한은행', '110-000-000401', '2026-01-01', '2027-12-31')]),
    C(5, 'SK Pay', 'SK Pay', '2026-09-29 14:35', '최유진(P033121)', ['단말', '액세서리', '구독'], [M('SK pay 일반', 'SKPAY0501', '정률', 1.9, 0, '별도', 'SK텔레콤', '우리은행', '110-000-000501', '2026-02-01'), M('SK pay 구독', 'SKPAY0502', '정률', 2.0, 0, '별도', 'SK텔레콤', '우리은행', '110-000-000502', '2026-02-01'), M('SK pay 액세서리', 'SKPAY0503', '정률', 2.0, 0, '별도', '에스케이피에스앤마케팅(주)', '하나은행', '110-000-000503', '2026-07-01')]),
    C(6, '토스페이먼츠', '토스페이', '2026-09-29 18:10', '박지훈(P033121)', ['구독'], [M('T우주 토스페이', 'tossTP0601', '정률', 2.3, 0, '별도', '에스케이엠앤서비스(주)', '하나은행', '110-000-000601', '2026-09-01')]),
    C(7, 'NHN KCP', '계좌이체', '2026-09-30 15:20', '이서연(P033121)', ['단말', '액세서리'], [M('TDS 액세서리 계좌', 'KCPbk0701', '정률', 1.5, 0, '별도', '에스케이피에스앤마케팅(주)', '국민은행', '110-000-000701', '2026-07-01', '2027-06-30')]),
    C(8, 'NHN KCP', '신용카드', '2026-09-30 17:45', '김민준(P033121)', ['단말', '액세서리', '구독'], [M('TDS 액세서리 카드', 'KCPacc0801', '정률', 2.2, 0, '별도', '에스케이피에스앤마케팅(주)', '국민은행', '110-000-000801', '2026-07-01', '2027-06-30'), M('TDS 액세서리 에스크로', 'KCPesc0802', '정액', 0, 300, '포함', '에스케이피에스앤마케팅(주)', '국민은행', '110-000-000802', '2026-07-01', '2027-06-30', 'N')]),
  ];
  list.find(c => c.id === 'PM-0008').promos.push({ id: 'PR-0001', name: '신한카드 5% 즉시할인', type: '정률', value: 5, from: '2026-11-01', to: '2026-11-30', min: 30000, prods: ['액세서리'], mid: '', use: 'Y' });
  return { combos: list, pgs: seedPgs(), midSeq, ui: { f: { pg: '', m: '', use: '' }, fa: { pg: '', m: '', use: '' }, page: 1 }, pgUi: emptyPgUi() };
}
const emptyPgUi = () => ({ f: { pg: '', rec: '', use: '' }, fa: { pg: '', rec: '', use: '' }, page: 1 });
/* PG사 마스터. 나이스페이는 채널이 등록만 하고 아직 기준정보가 없는 예시 */
function seedPgs() {
  const P = (no, name, code, reg, methods, lt, lc, lp, regAt, upd, by) => ({ id: 'PG-' + String(no).padStart(3, '0'), no, name, code, reg, use: 'Y', methods, lt, lc, lp, regAt, upd, by, hist: [{ at: upd, by, item: 'PG사', desc: `${name}(${code}) 등록 · 제공 결제수단 ${methods.join(', ')}` }] });
  return [
    P(1, 'KG 이니시스', 'INICIS', '기본', ['신용카드', '계좌이체', '가상계좌', '휴대폰결제', '카카오페이', '네이버페이'], 'API', '매일 07:00', '(가상) INI 대사 조회 API', '2026-01-01', '2026-09-28 16:05', '정도현(P033121)'),
    P(2, 'NHN KCP', 'KCP', '기본', ['신용카드', '계좌이체', '가상계좌', '휴대폰결제', '카카오페이'], '수동 파일', '운영자 등록', 'PG 관리자 화면 다운로드 (CSV)', '2026-01-01', '2026-09-28 16:05', '정도현(P033121)'),
    P(3, '토스페이먼츠', 'TOSS', '기본', ['신용카드', '계좌이체', '가상계좌', '토스페이'], 'API', '매일 07:00', '(가상) 토스 정산·거래 조회 API', '2026-01-01', '2026-09-29 18:10', '박지훈(P033121)'),
    P(4, 'SK Pay', 'SKPAY', '기본', ['SK Pay'], 'SFTP', '매일 06:30', '(가상) sftp://recon.skpay/T', '2026-01-01', '2026-09-29 14:35', '최유진(P033121)'),
    P(5, '나이스페이', 'NICE', '채널 등록', ['신용카드', '계좌이체', '가상계좌'], 'API', '매일 07:00', '', '2026-10-31', '2026-10-31 15:20', USER),
  ];
}

/* ================= 상태 ================= */
const PAGE = document.body.dataset.page || 'list';
let S;
function load() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
    if (s && Array.isArray(s.combos)) {
      midSeq = s.midSeq || 0;
      // PG 관리를 붙이기 전에 저장된 상태: PG사 마스터를 채우고, 기준정보에만 있는 PG사 · 결제수단도 빠짐없이 넣는다
      if (!Array.isArray(s.pgs)) s.pgs = seedPgs();
      s.pgUi = s.pgUi || emptyPgUi();
      s.combos.forEach(c => { let p = s.pgs.find(x => x.name === c.pg); if (!p) { p = { id: 'PG-' + String(s.pgs.length + 1).padStart(3, '0'), no: s.pgs.length + 1, name: c.pg, code: c.pg.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 10) || 'PG', reg: '채널 등록', use: 'Y', methods: [], lt: 'API', lc: '', lp: '', regAt: today(), upd: nowStr(), by: USER, hist: [] }; s.pgs.push(p); } if (!p.methods.includes(c.m)) p.methods.push(c.m); });
      return s;
    }
  } catch { }
  return seed();
}
function persist() { try { const { modal, edit, draft, err, pgDraft, pgErr, ...keep } = S; sessionStorage.setItem(SKEY, JSON.stringify({ ...keep, midSeq })); } catch { } }
const combo = id => S.combos.find(c => c.id === id);
const go = (k, q = '') => { persist(); location.href = FILES[k] + q; };
function touch(c, item, desc) { const at = nowStr(); c.upd = at; c.by = USER; c.hist.unshift({ at, by: USER, item, desc }); }
/* PG사 변경이력: 결제수단 기준정보가 생기거나 지워져도 PG사 이력에 남긴다 */
function pgHist(name, item, desc, touchPg = false) { const p = pgOf(name); if (!p) return; const at = nowStr(); p.hist.unshift({ at, by: USER, item, desc }); if (touchPg) { p.upd = at; p.by = USER; } }

/* ================= MID 입력 블록 (등록 화면 · 가맹점 등록 팝업 공통) =================
   한 블록 = MID 1건. 왼쪽 MID 정보, 오른쪽 그 MID의 적용 수수료 */
const newMid = () => ({ name: '', mid: '', feeType: '정률', rate: '', flat: '', vat: '별도', settle: '', bank: '', holder: '', acct: '', from: today(), to: '', key: '', use: 'Y' });
function midBlock(base, x, i, n, canAdd) {
  const P = `${base}.${i}`;
  const inp = (k, ph = '', type = 'text', extra = '') => `<input class="inp" type="${type}" data-b="${P}.${k}" value="${esc(x[k])}" placeholder="${esc(ph)}" ${extra}>`;
  const row = (label, req, body) => `<tr><th class="${req ? 'req' : ''}">${label}</th><td>${body}</td></tr>`;
  return `<article class="p5-mid" aria-label="MID ${i + 1}">
   <header class="p5-mid-h"><span class="p5-no">MID ${i + 1}</span><b>${esc(x.name.trim() || '가맹점명 미입력')}${x.mid.trim() ? ' · ' + esc(x.mid.trim()) : ''}</b>${x.rate !== '' || x.flat !== '' ? `<span class="p5-fee">${esc(x.feeType)} ${esc(feeTxt(x))} · VAT ${esc(x.vat)}</span>` : ''}<span class="sp"></span>
    ${n > 1 ? `<button type="button" class="btn sm" data-a="midDel" data-p="${base}" data-i="${i}">MID 삭제</button>` : ''}</header>
   <div class="p5-mid-b">
    <div class="p5-col"><h4>MID 정보</h4><table class="ft"><tbody>
     ${row('가맹점명', 1, inp('name', '예: SKT 단말결제'))}
     ${row('가맹점번호 (MID)', 1, inp('mid', 'PG가 발급한 MID'))}
     ${row('정산주체', 1, inp('settle', '예: SK텔레콤'))}
     ${row('입금은행 · 예금주', 1, `<div class="p5-2">${inp('bank', '예: 신한은행')}${inp('holder', '예: 에스케이텔레콤(주)')}</div>`)}
     ${row('입금계좌', 1, inp('acct', '샘플 계좌만 입력'))}
     ${row('유효기간', 1, `<span class="rng">${inp('from', '', 'date', 'aria-label="유효시작일"')}~${inp('to', '', 'date', 'aria-label="유효종료일"')}</span><div class="sub">종료일을 비우면 무기한</div>`)}
     ${row('인증키', 0, `${inp('key', x._keyTail ? `등록됨 (•••• ${x._keyTail}) · 비우면 유지` : '신규 등록 시 입력', 'password', 'autocomplete="new-password"')}`)}
     ${row('사용 여부', 0, radios(`${P}.use`, [['Y', '사용'], ['N', '미사용']], x.use))}
    </tbody></table></div>
    <div class="p5-col"><h4>적용 수수료</h4><table class="ft"><tbody>
     ${row('수수료 유형', 1, radios(`${P}.feeType`, FEE_TYPES, x.feeType))}
     ${row('수수료율', x.feeType !== '정액', `<span class="unit">${inp('rate', '예: 2.1', 'number', `min="0" max="100" step="0.001" ${x.feeType === '정액' ? 'disabled' : ''}`)}<em>%</em></span>`)}
     ${row('건당 수수료', x.feeType !== '정률', `<span class="unit">${inp('flat', '예: 200', 'number', `min="0" step="1" ${x.feeType === '정률' ? 'disabled' : ''}`)}<em>원/건</em></span>`)}
     ${row('VAT 기준', 1, radios(`${P}.vat`, [['별도', 'VAT 별도'], ['포함', 'VAT 포함']], x.vat))}
    </tbody></table>
    <div class="p5-note">수수료는 MID별 계약 기준으로 입력합니다. 인증키는 끝 4자리만 보관하는 샘플입니다.</div></div>
   </div></article>${canAdd && i === n - 1 ? `<button type="button" class="p5-add" data-a="midAdd" data-p="${base}">+ MID 추가</button>` : ''}`;
}
/* MID 입력값 검사. others = 이 결제수단에 이미 등록된 MID(수정 중인 건 제외) */
function midErrors(list, others) {
  const e = [], many = list.length > 1, seen = {};
  list.forEach((x, i) => {
    const T = many ? `[MID ${i + 1}] ` : '', E = t => e.push(T + t);
    if (!x.name.trim()) E('가맹점명을 입력하세요.');
    const mid = x.mid.trim().toLowerCase();
    if (!mid) E('가맹점번호(MID)를 입력하세요.');
    else if (others.some(o => o.mid.toLowerCase() === mid)) E(`이미 등록된 MID입니다 (${x.mid.trim()}).`);
    else if (seen[mid] != null) E(`MID ${seen[mid] + 1}과(와) 같은 MID입니다. 한 번만 입력하세요.`);
    else seen[mid] = i;
    if (!x.settle.trim()) E('정산주체를 입력하세요.');
    if (!x.bank.trim() || !x.holder.trim()) E('입금은행과 예금주를 입력하세요.');
    if (!x.acct.trim()) E('입금계좌를 입력하세요.');
    if (!x.from) E('유효시작일을 입력하세요.'); else if (x.to && x.to < x.from) E('유효종료일은 유효시작일보다 빠를 수 없습니다.');
    const r = Number(x.rate), f = Number(x.flat);
    if (x.feeType !== '정액' && (x.rate === '' || isNaN(r) || r <= 0 || r > 100)) E('수수료율을 0 초과 100 이하로 입력하세요.');
    if (x.feeType !== '정률' && (x.flat === '' || isNaN(f) || f <= 0)) E('건당 수수료를 0보다 크게 입력하세요.');
  });
  return e;
}
function toMid(x, keep) {
  const m = { id: keep?.id || 'M' + String(++midSeq).padStart(4, '0'), name: x.name.trim(), mid: x.mid.trim(), feeType: x.feeType, rate: x.feeType === '정액' ? 0 : Number(x.rate), flat: x.feeType === '정률' ? 0 : Number(x.flat), vat: x.vat, settle: x.settle.trim(), bank: x.bank.trim(), holder: x.holder.trim(), acct: x.acct.trim(), from: x.from, to: x.to, keyTail: x.key ? x.key.slice(-4) : (keep?.keyTail || ''), use: x.use };
  return m;
}
const midDraftOf = m => ({ ...newMid(), ...m, rate: m.feeType === '정액' ? '' : m.rate, flat: m.feeType === '정률' ? '' : m.flat, key: '', _keyTail: m.keyTail });

/* ================= 목록 ================= */
function listRows() {
  const f = S.ui.fa;
  return S.combos.filter(c => (!f.pg || c.pg === f.pg) && (!f.m || c.m === f.m) && (!f.use || c.use === f.use)).sort((a, b) => b.no - a.no);
}
function vList() {
  const f = S.ui.f, rows = listRows(), pg = paginate(rows, S.ui.page); S.ui.page = pg.cur;
  const lf = (l, c) => `<span class="lf-g"><label class="lf-l">${l}</label>${c}</span>`;
  return `${crumb(['홈', '결제 관리', '결제 수단 기준정보 관리'])}<h1 class="lst-title">결제 수단 기준정보 관리</h1>
  <form class="lst-filter" autocomplete="off" onsubmit="return false"><div class="lf-row">
   ${lf('PG사', `<select data-b="ui.f.pg" aria-label="PG사">${opts(pgNames(), f.pg, '전체')}</select>`)}
   ${lf('결제 수단', `<select data-b="ui.f.m" aria-label="결제 수단">${opts(allMethods(), f.m, '전체')}</select>`)}
   ${lf('사용 여부', `<select data-b="ui.f.use" aria-label="사용 여부">${opts([['Y', 'Y'], ['N', 'N']], f.use, '전체')}</select>`)}
   <span class="lf-acts"><button type="button" class="btn dark" data-a="reset">초기화</button><button type="button" class="btn pri" data-a="search">조회</button></span></div></form>
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}건</b></span></h2></div>
  <div class="tw"><table class="tbl lst-table p5-list"><thead><tr><th>No.</th><th>PG사</th><th>결제 수단</th><th>사용 여부</th><th>등록 가맹점수</th><th>최종 수정 일시</th><th>최근 수정자</th></tr></thead><tbody>
  ${pg.rows.map(c => `<tr class="click ${S.flash === c.id ? 'flash' : ''}" data-a="open" data-id="${c.id}" tabindex="0" title="상세 보기"><td>${c.no}</td><td>${esc(c.pg)}</td><td><a class="p4-id" href="${FILES.detail}?id=${c.id}" data-a="open" data-id="${c.id}">${esc(c.m)}</a></td><td>${c.use}</td><td>${c.mids.length}건</td><td>${dt(c.upd)}</td><td>${esc(c.by)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">조회 결과가 없습니다.</td></tr>'}
  </tbody></table></div>
  <div class="lst-bottom">${pg.html}<div class="lst-foot"><button class="btn lg" data-a="csv">엑셀 다운로드</button><button class="btn pri lg" data-a="create">등록</button></div></div>`;
}

/* ================= 상세 ================= */
function vDetail() {
  const c = combo(S.id); if (!c) return `<div class="call warn"><div>결제수단을 찾을 수 없습니다. <a href="${FILES.list}">목록으로</a></div></div>`;
  const e = S.edit;
  const base = `<section class="sec"><div class="sec-h"><h3>결제수단 기준정보</h3><span class="hint">PG사 · 결제 수단은 바꿀 수 없습니다.</span><span class="sp"></span>${e ? '' : '<button class="btn sm" data-a="editBase">수정</button>'}</div>
   <table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>
   <tr><th>PG사</th><td><a class="p5-link" href="${FILES.pgDetail}?id=${pgOf(c.pg)?.id || ''}">${esc(c.pg)}</a>${pgOf(c.pg)?.use === 'N' ? ' <span class="bdg gray">PG 미사용</span>' : ''}</td><th>결제 수단</th><td><b>${esc(c.m)}</b></td></tr>
   <tr><th class="${e ? 'req' : ''}">사용 여부</th><td>${e ? radios('edit.use', [['Y', 'Y (사용)'], ['N', 'N (미사용)']], e.use) : `${c.use} ${yn(c.use)}`}</td><th>등록 가맹점수</th><td>${c.mids.length}건 <span class="dim-t">(사용 ${c.mids.filter(m => m.use === 'Y').length}건)</span></td></tr>
   <tr><th>허용 상품</th><td colspan="3">${e ? `<div class="ck-g">${PRODUCTS.map(p => `<label><input type="checkbox" data-a="editProd" data-v="${esc(p)}" ${e.prods.includes(p) ? 'checked' : ''}>${esc(p)}</label>`).join('')}</div>` : esc(c.prods.join(', ') || '미설정')}</td></tr>
   <tr><th>최종 수정 일시</th><td>${dt(c.upd)}</td><th>최근 수정자</th><td>${esc(c.by)}</td></tr></tbody></table>
   ${e ? `${errBox(e.err)}<div class="p5-inline-acts"><button class="btn" data-a="editCancel">취소</button><button class="btn pri" data-a="editSave">저장</button></div>` : ''}</section>`;
  // 가맹점(MID): 가맹점번호(MID)와 적용 수수료를 붙은 두 칸으로 묶는다 (머리글 "MID · 적용 수수료")
  const mids = `<section class="sec"><div class="sec-h"><h3>가맹점(MID) 등록정보</h3><span class="hint">MID와 적용 수수료를 함께 봅니다. 여러 MID를 한 번에 등록할 수 있습니다.</span><span class="sp"></span><button class="btn sm pri" data-a="midNew">+ 가맹점 등록</button></div>
   <div class="tw"><table class="tbl p5-midtbl"><thead><tr><th rowspan="2">No.</th><th rowspan="2" class="l">가맹점명</th><th colspan="2" class="p5-grp">MID · 적용 수수료</th><th rowspan="2" class="l">정산주체</th><th rowspan="2" class="l">입금계좌</th><th rowspan="2">유효기간</th><th rowspan="2">인증키</th><th rowspan="2">사용 여부</th><th rowspan="2">관리</th></tr>
   <tr><th class="l p5-grp-l">가맹점번호 (MID)</th><th class="l p5-grp-r">수수료</th></tr></thead><tbody>
   ${c.mids.map((m, i) => { const exp = m.to && m.to < today(); return `<tr class="${m.use === 'N' ? 'off' : ''} ${S.flashMids?.includes(m.id) ? 'flash' : ''}"><td>${i + 1}</td><td class="l"><b>${esc(m.name)}</b></td>
    <td class="l mid p5-grp-l">${esc(m.mid)}</td><td class="l p5-grp-r"><b>${esc(m.feeType)} ${esc(feeTxt(m))}</b><div class="sub">VAT ${esc(m.vat)}</div></td>
    <td class="l">${esc(m.settle)}</td><td class="l">${esc(m.bank)}<div class="sub">${esc(maskAcct(m.acct))} · ${esc(m.holder)}</div></td>
    <td class="num">${esc(m.from)} ~ ${esc(m.to || '무기한')}${exp ? '<div class="sub" style="color:var(--bad)">기간 만료</div>' : ''}</td>
    <td>${m.keyTail ? `<span class="bdg ok">등록</span> <span class="dim-t">•••• ${esc(m.keyTail)}</span>` : '<span class="bdg gray">미등록</span>'}</td><td>${m.use}</td>
    <td class="acts"><button class="lk" data-a="midEdit" data-id="${m.id}">수정</button><button class="lk dng" data-a="midRemove" data-id="${m.id}">삭제</button></td></tr>`; }).join('') || '<tr><td colspan="10" class="empty">등록된 가맹점이 없습니다. [+ 가맹점 등록]으로 추가하세요.</td></tr>'}
   </tbody></table></div>
   <p class="p5-foot-note">※ 입금계좌는 조회 시 끝 4자리만 보입니다. 인증키는 실제 비밀값 대신 키 식별정보(끝 4자리)만 보관하는 샘플 화면입니다.</p></section>`;
  const pst = p => p.use === 'N' ? '미사용' : today() < p.from ? '예정' : today() > p.to ? '종료' : '진행중';
  const promo = `<section class="sec"><div class="sec-h"><h3>결제 프로모션</h3><span class="hint">이 PG사 · 결제 수단에 적용하는 할인 프로모션입니다.</span><span class="sp"></span><button class="btn sm" data-a="promoNew">+ 프로모션 등록</button></div>
   <div class="tw"><table class="tbl"><thead><tr><th class="l">프로모션명</th><th class="l">혜택</th><th class="l">대상 상품</th><th>적용 MID</th><th>적용 기간</th><th>상태</th><th>관리</th></tr></thead><tbody>
   ${c.promos.map(p => `<tr><td class="l"><b>${esc(p.name)}</b></td><td class="l">${p.type === '정률' ? p.value + '% 즉시할인' : Number(p.value).toLocaleString() + '원 즉시할인'}<div class="sub">최소 ${Number(p.min || 0).toLocaleString()}원</div></td><td class="l">${esc(p.prods.join(', ') || '-')}</td><td>${esc(p.mid || '전체 MID')}</td><td class="num">${p.from} ~ ${p.to}</td><td><span class="bdg ${pst(p) === '진행중' ? 'ok' : pst(p) === '예정' ? 'ac' : 'gray'}">${pst(p)}</span></td><td class="acts"><button class="lk" data-a="promoEdit" data-id="${p.id}">수정</button><button class="lk dng" data-a="promoRemove" data-id="${p.id}">삭제</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">등록된 프로모션이 없습니다.</td></tr>'}
   </tbody></table></div></section>`;
  // 변경이력은 [변경이력] 탭으로 분리한다. 결제 이력 상세(payment-history4-detail.html)의 [결제 정보 | 변경이력 N] 탭 · 표와 같은 모양
  const hist = `<section class="sec"><table class="tbl"><thead><tr><th>일시</th><th>처리자</th><th class="l">처리</th><th class="l">결과</th></tr></thead><tbody>
   ${c.hist.map(h => `<tr><td class="num">${esc(h.at)}</td><td>${esc(h.by)}</td><td class="l"><b>${esc(h.item)}</b></td><td class="l">${esc(h.desc)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">변경이력이 없습니다.</td></tr>'}</tbody></table></section>`;
  const tab = S.tab === 'hist' ? 'hist' : 'info';
  const tabs = `<div class="tabs small" role="tablist">${[['info', '기본 정보'], ['hist', `변경이력 ${c.hist.length}`]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>`;
  return `${crumb(['홈', '결제 관리', '결제 수단 기준정보 관리', '상세'])}<div class="ph"><h1 class="h1">결제 수단 기준정보 상세</h1></div>
  ${tabs}${tab === 'hist' ? hist : base + mids + promo}
  <div class="p4-bbar-sp"></div><div class="p4-bbar"><div class="bb-l"><span class="bb-k">${esc(c.pg)} › ${esc(c.m)}</span><span class="bb-k">가맹점<b>${c.mids.length}</b>건</span></div>
  <div class="bb-r"><button class="btn dng" data-a="comboRemove">삭제</button><button class="btn" data-a="toList">목록</button></div></div>`;
}

/* ================= 등록 ================= */
function initDraft() { S.draft = { pg: '', m: '', use: 'Y', prods: [], mids: [newMid()] }; S.err = []; }
function vCreate() {
  if (!S.draft) initDraft();
  const d = S.draft, taken = m => S.combos.some(c => c.pg === d.pg && c.m === m);
  return `${crumb(['홈', '결제 관리', '결제 수단 기준정보 관리', '등록'])}<div class="ph"><h1 class="h1">결제 수단 기준정보 등록</h1></div>
  <p class="desc">PG사와 결제 수단을 고르고, 이 결제 수단으로 결제받을 가맹점(MID)을 등록합니다. MID는 여러 건을 한 번에 넣을 수 있고, 나중에 상세 화면에서 더 추가할 수도 있습니다.</p>
  <section class="sec"><div class="sec-h"><h3>① 결제수단 기준정보</h3></div><table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>
   <tr><th class="req">PG사</th><td><select class="sel w200" data-b="draft.pg" data-r aria-label="PG사">${opts(S.pgs.map(p => [p.name, p.use === 'Y' ? p.name : `${p.name} (미사용)`, p.use !== 'Y']), d.pg, '선택')}</select></td>
   <th class="req">결제 수단</th><td><select class="sel w200" data-b="draft.m" data-r aria-label="결제 수단" ${d.pg ? '' : 'disabled'}>${opts((pgOf(d.pg)?.methods || []).map(m => [m, taken(m) ? `${m} (등록됨)` : m, taken(m)]), d.m, d.pg ? '선택' : 'PG사를 먼저 선택')}</select></td></tr>
   <tr><th class="req">사용 여부</th><td colspan="3">${radios('draft.use', [['Y', 'Y (사용)'], ['N', 'N (미사용)']], d.use)}</td></tr>
   <tr><th>허용 상품</th><td colspan="3"><div class="ck-g">${PRODUCTS.map(p => `<label><input type="checkbox" data-a="draftProd" data-v="${esc(p)}" ${d.prods.includes(p) ? 'checked' : ''}>${esc(p)}</label>`).join('')}</div></td></tr>
  </tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>② 가맹점(MID) · 적용 수수료</h3><span class="hint">MID마다 적용 수수료를 옆에 함께 입력합니다.</span><span class="sp"></span><span class="dim-t" style="font-size:12px">총 <b>${d.mids.length}</b>건</span></div>
   ${d.mids.length ? `<div class="p5-mids">${d.mids.map((x, i) => midBlock('draft.mids', x, i, d.mids.length, true)).join('')}</div>` : `<div class="p5-empty">MID 없이 기준정보만 등록합니다. <button type="button" class="p5-add" data-a="midAdd" data-p="draft.mids">+ MID 추가</button></div>`}
   ${d.mids.length ? `<p class="p5-foot-note">MID 없이 기준정보만 먼저 등록하려면 MID 블록을 모두 지우세요. <button class="lk" data-a="midClear">MID 입력 비우기</button></p>` : ''}
  </section>
  ${errBox(S.err)}
  <div class="foot"><button class="btn lg" data-a="toList">취소</button><button class="btn lg pri" data-a="createSave">저장</button></div>`;
}

/* ================= PG 관리 v0.2.3 ================= */
const midCountOfPg = name => combosOfPg(name).reduce((a, c) => a + c.mids.length, 0);
function pgRows() {
  const f = S.pgUi.fa;
  return S.pgs.filter(p => (!f.pg || p.name === f.pg) && (!f.rec || recOf(p.lt) === f.rec) && (!f.use || p.use === f.use)).sort((a, b) => b.no - a.no);
}
/* 목록: 결제수단 기준정보 목록(시안)과 같은 모양 · 같은 하단 버튼 */
function vPgList() {
  const f = S.pgUi.f, rows = pgRows(), pg = paginate(rows, S.pgUi.page); S.pgUi.page = pg.cur;
  const lf = (l, c) => `<span class="lf-g"><label class="lf-l">${l}</label>${c}</span>`;
  return `${crumb(['홈', '결제 관리', 'PG사 관리'])}<h1 class="lst-title">PG사 관리</h1>
  <form class="lst-filter" autocomplete="off" onsubmit="return false"><div class="lf-row">
   ${lf('PG사', `<select data-b="pgUi.f.pg" aria-label="PG사">${opts(pgNames(), f.pg, '전체')}</select>`)}
   ${lf('대사 수집', `<select data-b="pgUi.f.rec" aria-label="대사 수집">${opts(['자동', '수동'], f.rec, '전체')}</select>`)}
   ${lf('사용 여부', `<select data-b="pgUi.f.use" aria-label="사용 여부">${opts([['Y', 'Y'], ['N', 'N']], f.use, '전체')}</select>`)}
   <span class="lf-acts"><button type="button" class="btn dark" data-a="pgReset">초기화</button><button type="button" class="btn pri" data-a="pgSearch">조회</button></span></div></form>
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}건</b></span></h2></div>
  <div class="tw"><table class="tbl lst-table p5-list"><thead><tr><th>No.</th><th>PG사</th><th>PG 코드</th><th>제공 결제수단</th><th>결제수단 기준정보</th><th>등록 가맹점수</th><th>대사 수집</th><th>사용 여부</th><th>최종 수정 일시</th><th>최근 수정자</th></tr></thead><tbody>
  ${pg.rows.map(p => { const cs = combosOfPg(p.name); return `<tr class="click" data-a="pgOpen" data-id="${p.id}" tabindex="0" title="상세 보기"><td>${p.no}</td><td><a class="p4-id" href="${FILES.pgDetail}?id=${p.id}" data-a="pgOpen" data-id="${p.id}">${esc(p.name)}</a></td><td class="mid">${esc(p.code)}</td><td>${p.methods.length}개</td><td>${cs.length}건</td><td>${midCountOfPg(p.name)}건</td><td>${recOf(p.lt)}</td><td>${p.use}</td><td>${dt(p.upd)}</td><td>${esc(p.by)}</td></tr>`; }).join('') || '<tr><td colspan="10" class="empty">조회 결과가 없습니다.</td></tr>'}
  </tbody></table></div>
  <div class="lst-bottom">${pg.html}<div class="lst-foot"><button class="btn pri lg" data-a="pgCreate">등록</button></div></div>`;
}
/* 상세: [기본 정보 | 변경이력] 탭. 제공 결제수단마다 결제수단 기준정보 연결 상태를 보여 주고 바로 등록 · 이동한다 */
function vPgDetail() {
  const p = pgById(S.pgId); if (!p) return `<div class="call warn"><div>PG사를 찾을 수 없습니다. <a href="${FILES.pgList}">목록으로</a></div></div>`;
  const cs = combosOfPg(p.name), tab = S.tab === 'hist' ? 'hist' : 'info';
  const tabs = `<div class="tabs small" role="tablist">${[['info', '기본 정보'], ['hist', `변경이력 ${p.hist.length}`]].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${l}</button>`).join('')}</div>`;
  const info = `<section class="sec"><div class="sec-h"><h3>기본 정보</h3></div><table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>
    <tr><th>PG사명</th><td>${esc(p.name)}</td><th>PG 코드</th><td class="mid">${esc(p.code)}</td></tr>
    <tr><th>등록 구분</th><td>${esc(p.reg)}</td><th>사용 여부</th><td>${p.use} ${yn(p.use)}</td></tr>
    <tr><th>등록일</th><td>${esc(p.regAt)}</td><th>사용 현황</th><td>결제수단 기준정보 ${cs.length}건 · 가맹점(MID) ${midCountOfPg(p.name)}건</td></tr>
    <tr><th>최종 수정 일시</th><td>${dt(p.upd)}</td><th>최근 수정자</th><td>${esc(p.by)}</td></tr></tbody></table>
    ${p.use === 'N' && cs.length ? `<div class="call warn"><div>미사용 PG사입니다. 연결된 결제수단 기준정보 ${cs.length}건은 그대로 남아 있지만, 이 PG사로 새 결제수단은 등록할 수 없습니다.</div></div>` : ''}</section>
   <section class="sec"><div class="sec-h"><h3>대사 연동 정보</h3></div><table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>
    <tr><th>연동 방식</th><td>${esc(p.lt)}</td><th>대사 수집</th><td>${recOf(p.lt)}</td></tr>
    <tr><th>수신 주기</th><td>${esc(p.lc || '-')}</td><th>연동 경로</th><td>${esc(p.lp || '-')}</td></tr></tbody></table></section>
   <section class="sec"><div class="sec-h"><h3>제공 결제수단</h3><span class="hint">여기 있는 결제수단만 결제수단 기준정보 등록에서 고를 수 있습니다.</span></div>
    <table class="tbl"><thead><tr><th class="l">결제 수단</th><th>결제수단 기준정보</th><th>사용 여부</th><th>등록 가맹점수</th><th>인증키 등록</th><th>바로가기</th></tr></thead><tbody>
    ${p.methods.map(m => { const c = cs.find(x => x.m === m); if (!c) return `<tr class="off"><td class="l"><b>${esc(m)}</b></td><td><span class="bdg gray">미등록</span></td><td>-</td><td>-</td><td>-</td><td>${p.use === 'Y' ? `<button class="lk" data-a="comboCreateFor" data-v="${esc(m)}">+ 기준정보 등록</button>` : '<span class="dim-t">PG 미사용</span>'}</td></tr>`;
      const k = c.mids.filter(x => x.keyTail).length; return `<tr><td class="l"><b>${esc(m)}</b></td><td><span class="bdg ok">등록</span></td><td>${c.use}</td><td>${c.mids.length}건</td><td>${c.mids.length ? `${k} / ${c.mids.length} MID${k < c.mids.length ? ' <span class="bdg warn">미등록 있음</span>' : ''}` : '-'}</td><td><a class="lk" href="${FILES.detail}?id=${c.id}">상세 보기</a></td></tr>`; }).join('')}
    </tbody></table>
    <p class="p5-foot-note">※ 인증키는 v0.2.3부터 MID 단위로 관리합니다. 키 입력 · 교체는 결제수단 기준정보 상세 > 가맹점(MID) 등록정보에서 합니다.</p></section>`;
  const hist = `<section class="sec"><table class="tbl"><thead><tr><th>일시</th><th>처리자</th><th class="l">처리</th><th class="l">결과</th></tr></thead><tbody>
   ${p.hist.map(h => `<tr><td class="num">${esc(h.at)}</td><td>${esc(h.by)}</td><td class="l"><b>${esc(h.item)}</b></td><td class="l">${esc(h.desc)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">변경이력이 없습니다.</td></tr>'}</tbody></table></section>`;
  return `${crumb(['홈', '결제 관리', 'PG사 관리', '상세'])}<div class="ph"><h1 class="h1">PG사 상세</h1></div>${tabs}${tab === 'hist' ? hist : info}
  <div class="p4-bbar-sp"></div><div class="p4-bbar"><div class="bb-l"><span class="bb-k">${esc(p.name)} <span class="dim-t">${esc(p.code)}</span></span><span class="bb-k">결제수단<b>${cs.length}</b>건</span></div>
  <div class="bb-r"><button class="btn dng" data-a="pgRemove">삭제</button><button class="btn" data-a="pgToList">목록</button><button class="btn pri" data-a="pgEditGo">수정</button></div></div>`;
}
/* 등록 · 수정: 기준정보가 있는 결제수단은 체크를 풀 수 없다(먼저 기준정보를 지워야 함). PG사명 · 코드는 등록 후 바꾸지 않는다 */
function initPgDraft(p) {
  S.pgDraft = p ? { isNew: false, id: p.id, name: p.name, code: p.code, reg: p.reg, use: p.use, lt: p.lt, lc: p.lc, lp: p.lp, methods: [...p.methods], custom: '' }
    : { isNew: true, name: '', code: '', reg: '채널 등록', use: 'Y', lt: 'API', lc: '매일 07:00', lp: '', methods: [], custom: '' };
  S.pgErr = [];
}
function vPgForm() {
  if (!S.pgDraft) initPgDraft(null);
  const d = S.pgDraft, used = d.isNew ? [] : combosOfPg(d.name).map(c => c.m), activeCnt = d.isNew ? 0 : combosOfPg(d.name).filter(c => c.use === 'Y').length;
  const cat = [...METHOD_CATALOG, ...d.methods.filter(m => !METHOD_CATALOG.includes(m))];
  return `${crumb(['홈', '결제 관리', 'PG사 관리', d.isNew ? '등록' : '수정'])}<div class="ph"><h1 class="h1">${d.isNew ? 'PG사 등록' : `PG사 수정: ${esc(d.name)}`}</h1></div>
  <section class="sec"><div class="sec-h"><h3>① 기본 정보</h3></div><table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>
   <tr><th class="req">PG사명</th><td>${d.isNew ? `<input class="inp" data-b="pgDraft.name" value="${esc(d.name)}" placeholder="예: 다날" maxlength="40">` : `<b>${esc(d.name)}</b> <span class="dim-t">(변경 불가)</span>`}</td>
   <th class="req">PG 코드</th><td>${d.isNew ? `<input class="inp" style="width:140px" data-b="pgDraft.code" value="${esc(d.code)}" placeholder="예: DANAL" maxlength="10">` : `<span class="mid">${esc(d.code)}</span> <span class="dim-t">(변경 불가)</span>`}<div class="sub">영문 대문자 · 숫자 2~10자. 거래번호와 대사 파일명 접두어로 씁니다.</div></td></tr>
   <tr><th>사용 여부</th><td colspan="3">${radios('pgDraft.use', [['Y', 'Y (사용)'], ['N', 'N (미사용)']], d.use)}${d.use === 'N' && activeCnt ? `<div class="sub" style="color:var(--warn)">사용 중인 결제수단 기준정보 ${activeCnt}건이 있습니다. 미사용으로 바꿔도 기준정보는 남고, 이 PG사로 새 결제수단만 등록할 수 없게 됩니다.</div>` : ''}</td></tr></tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>② 제공 결제수단</h3><span class="hint">결제수단 기준정보 등록에서 이 PG사를 고르면 여기 체크한 결제수단만 나옵니다.</span></div><table class="ft"><colgroup><col class="k"><col></colgroup><tbody>
   <tr><th class="req">결제 수단</th><td><div class="ck-g">${cat.map(m => { const lock = used.includes(m); return `<label class="${lock ? 'off' : ''}" title="${lock ? '결제수단 기준정보가 있어 해제할 수 없습니다' : ''}"><input type="checkbox" data-a="pgMethod" data-v="${esc(m)}" ${d.methods.includes(m) ? 'checked' : ''} ${lock ? 'disabled' : ''}>${esc(m)}${lock ? ' <span class="dim-t" style="font-size:11px">(기준정보 있음)</span>' : ''}</label>`; }).join('')}</div>
    <div class="p5-custom"><input class="inp" data-b="pgDraft.custom" value="${esc(d.custom)}" placeholder="목록에 없는 결제수단 직접 추가 (예: 휴대폰 소액결제)" maxlength="30"><button type="button" class="btn sm" data-a="pgMethodAdd">추가</button></div>
    ${used.length ? `<div class="sub">기준정보가 있는 결제수단(${used.map(esc).join(', ')})은 결제수단 기준정보 상세에서 먼저 삭제해야 뺄 수 있습니다.</div>` : ''}</td></tr></tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>③ 대사 연동 정보</h3><span class="hint">PG사 단위로 거래 · 정산 데이터를 받는 방식입니다.</span></div><table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>
   <tr><th class="req">연동 방식</th><td>${radios('pgDraft.lt', LINK_TYPES, d.lt)}</td><th>대사 수집</th><td>${recOf(d.lt)} <span class="dim-t">연동 방식에 따라 정해집니다</span></td></tr>
   <tr><th>수신 주기</th><td><input class="inp" data-b="pgDraft.lc" value="${esc(d.lc)}" placeholder="예: 매일 07:00"></td><th>연동 경로</th><td><input class="inp wide" data-b="pgDraft.lp" value="${esc(d.lp)}" placeholder="API 엔드포인트, SFTP 경로 또는 파일 받는 곳"></td></tr></tbody></table>
   <p class="p5-foot-note">※ 인증키는 PG사가 아니라 MID 단위로 관리합니다 (결제수단 기준정보 상세 > 가맹점 등록).</p></section>
  ${errBox(S.pgErr)}
  <div class="foot"><button class="btn lg" data-a="pgCancel">취소</button><button class="btn lg pri" data-a="pgSave">저장</button></div>`;
}

/* ================= 팝업 ================= */
function vModal() {
  const md = S.modal; if (!md) return '';
  let t, b, f, w = 'w9';
  if (md.type === 'mid') {
    t = md.editId ? '가맹점 등록정보 수정' : '가맹점 등록';
    b = `<p class="desc" style="margin-top:0">${esc(combo(S.id).pg)} › ${esc(combo(S.id).m)}에 ${md.editId ? '등록된 가맹점을 수정합니다.' : '가맹점(MID)을 연결합니다. [+ MID 추가]로 여러 건을 한 번에 등록할 수 있습니다.'}</p>
     <div class="p5-mids">${md.list.map((x, i) => midBlock('modal.list', x, i, md.list.length, !md.editId)).join('')}</div>${errBox(md.err)}`;
    f = `<button class="btn" data-a="closeModal">취소</button><button class="btn pri" data-a="midSave">${md.editId ? '저장' : `MID ${md.list.length}건 등록`}</button>`;
    w = 'w9 p5-wide';
  }
  if (md.type === 'promo') {
    const c = combo(S.id), p = md.p, P = 'modal.p';
    t = md.editId ? '프로모션 수정' : '프로모션 등록';
    b = `<p class="desc" style="margin-top:0">${esc(c.pg)} › ${esc(c.m)}에 자동 연결됩니다.</p><table class="ft"><colgroup><col class="k"><col></colgroup><tbody>
     <tr><th class="req">프로모션명</th><td><input class="inp wide" data-b="${P}.name" value="${esc(p.name)}" placeholder="예: 신용카드 5% 즉시할인"></td></tr>
     <tr><th class="req">혜택</th><td>${radios(`${P}.type`, [['정률', '정률 할인(%)'], ['정액', '정액 할인(원)']], p.type)}<span class="unit" style="margin-top:8px"><input class="inp num" type="number" data-b="${P}.value" value="${esc(p.value)}" min="0"><em>${p.type === '정률' ? '%' : '원'}</em></span></td></tr>
     <tr><th class="req">적용 기간</th><td><span class="rng"><input type="date" class="inp" data-b="${P}.from" value="${esc(p.from)}" aria-label="시작일">~<input type="date" class="inp" data-b="${P}.to" value="${esc(p.to)}" aria-label="종료일"></span></td></tr>
     <tr><th>최소 결제금액</th><td><span class="unit"><input class="inp num" type="number" data-b="${P}.min" value="${esc(p.min)}" min="0"><em>원</em></span></td></tr>
     <tr><th class="req">대상 상품</th><td><div class="ck-g">${(c.prods.length ? c.prods : PRODUCTS).map(x => `<label><input type="checkbox" data-a="promoProd" data-v="${esc(x)}" ${p.prods.includes(x) ? 'checked' : ''}>${esc(x)}</label>`).join('')}</div></td></tr>
     <tr><th>적용 MID</th><td><select class="sel" data-b="${P}.mid">${opts(c.mids.map(m => [m.mid, `${m.mid} (${m.name})`]), p.mid, '전체 MID')}</select></td></tr>
     <tr><th>사용 여부</th><td>${radios(`${P}.use`, [['Y', '사용'], ['N', '미사용']], p.use)}</td></tr></tbody></table>${errBox(md.err)}`;
    f = `<button class="btn" data-a="closeModal">취소</button><button class="btn pri" data-a="promoSave">저장</button>`;
  }
  return `<div class="dimbg" data-a="dimClose"><div class="mdl ${w}" role="dialog" aria-modal="true" aria-labelledby="mdl-t"><div class="mdl-h"><h2 id="mdl-t">${t}</h2><button class="x" data-a="closeModal" aria-label="닫기">×</button></div><div class="mdl-b">${b}</div><div class="mdl-f">${f}</div></div></div>`;
}

/* ================= 렌더 ================= */
function render() {
  const h = PAGE === 'detail' ? vDetail() : PAGE === 'create' ? vCreate() : PAGE === 'pgList' ? vPgList() : PAGE === 'pgDetail' ? vPgDetail() : PAGE === 'pgForm' ? vPgForm() : vList();
  $('#view').innerHTML = h;
  const r = $('#modal-root'), sc = r.querySelector('.mdl-b')?.scrollTop || 0;
  r.innerHTML = vModal(); const mb = r.querySelector('.mdl-b'); if (mb) mb.scrollTop = sc;
  persist();
}
const toggle = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
const scrollErr = () => setTimeout(() => document.querySelector('.errbox')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 0);

/* ================= 동작 ================= */
const A = {
  /* 목록 */
  search() { S.ui.fa = { ...S.ui.f }; S.ui.page = 1; render(); },
  reset() { S.ui.f = { pg: '', m: '', use: '' }; S.ui.fa = { ...S.ui.f }; S.ui.page = 1; render(); },
  page(el) { (PAGE === 'pgList' ? S.pgUi : S.ui).page = +el.dataset.p; render(); },
  open(el, e) { e?.preventDefault(); go('detail', '?id=' + el.dataset.id); },
  create() { S.draft = null; go('create'); },
  toList() { go('list'); },
  csv() {
    const rows = listRows(); const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const t = '﻿' + [['No.', 'PG사', '결제 수단', '사용 여부', '등록 가맹점수', '최종 수정 일시', '최근 수정자'], ...rows.map(c => [c.no, c.pg, c.m, c.use, c.mids.length, dt(c.upd), c.by])].map(r => r.map(q).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = `결제수단기준정보_${today().replace(/-/g, '')}.csv`; document.body.appendChild(a); a.click(); a.remove();
    toast(`엑셀 파일을 내려받았습니다. (${rows.length}건)`);
  },
  /* 상세 · 탭: 고른 탭은 주소(&tab=hist)에 남겨 새로고침 · 공유해도 같은 탭이 열린다 */
  tab(el) { S.tab = el.dataset.v; S.edit = null; history.replaceState(null, '', `${PAGE === 'pgDetail' ? FILES.pgDetail : FILES.detail}?id=${PAGE === 'pgDetail' ? S.pgId : S.id}${S.tab === 'hist' ? '&tab=hist' : ''}`); render(); window.scrollTo(0, 0); },
  /* 상세 · 기준정보 */
  editBase() { const c = combo(S.id); S.edit = { use: c.use, prods: [...c.prods], err: [] }; render(); },
  editProd(el) { S.edit.prods = toggle(S.edit.prods, el.dataset.v); render(); },
  editCancel() { S.edit = null; render(); },
  editSave() {
    const c = combo(S.id), e = S.edit, ch = [];
    if (c.use !== e.use) ch.push(`사용 여부 ${c.use} → ${e.use}`);
    if (c.prods.join() !== e.prods.join()) ch.push(`허용 상품 ${c.prods.join(', ') || '미설정'} → ${e.prods.join(', ') || '미설정'}`);
    S.edit = null;
    if (!ch.length) { render(); toast('바뀐 내용이 없습니다.'); return; }
    c.use = e.use; c.prods = e.prods; touch(c, '기준정보', ch.join(' / ')); render(); toast('결제수단 기준정보를 저장했습니다.');
  },
  comboRemove() {
    const c = combo(S.id);
    if (!confirm(`${c.pg} › ${c.m}을(를) 삭제할까요?${c.mids.length ? `\n연결된 가맹점 ${c.mids.length}건과 프로모션 ${c.promos.length}건도 함께 삭제됩니다.` : ''}`)) return;
    S.combos = S.combos.filter(x => x.id !== c.id); pgHist(c.pg, '결제수단 기준정보', `${c.m} 기준정보 삭제 (가맹점 ${c.mids.length}건 포함)`); go('list');
  },
  /* 가맹점(MID) */
  midNew() { S.modal = { type: 'mid', list: [newMid()], err: [] }; render(); },
  midEdit(el) { const m = combo(S.id).mids.find(x => x.id === el.dataset.id); S.modal = { type: 'mid', editId: m.id, list: [midDraftOf(m)], err: [] }; render(); },
  midAdd(el) { const list = get(el.dataset.p), last = list[list.length - 1], x = newMid(); if (last) Object.assign(x, { feeType: last.feeType, vat: last.vat, settle: last.settle, bank: last.bank, holder: last.holder, from: last.from, to: last.to }); list.push(x); render(); setTimeout(() => { const all = document.querySelectorAll(el.dataset.p.startsWith('modal') ? '#modal-root .p5-mid' : '#view .p5-mid'); all[all.length - 1]?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 0); },
  midDel(el) { const list = get(el.dataset.p), i = +el.dataset.i, x = list[i]; if ((x.name.trim() || x.mid.trim()) && !confirm(`MID ${i + 1}에 입력한 내용을 지울까요?`)) return; list.splice(i, 1); render(); },
  midClear() { if (confirm('입력한 MID를 모두 지울까요?')) { S.draft.mids = []; render(); } },
  midSave() {
    const c = combo(S.id), md = S.modal;
    md.err = midErrors(md.list, c.mids.filter(m => m.id !== md.editId)); if (md.err.length) { render(); setTimeout(() => document.querySelector('#modal-root .errbox')?.scrollIntoView({ block: 'center' }), 0); return; }
    if (md.editId) { const i = c.mids.findIndex(m => m.id === md.editId); const old = c.mids[i]; const m = toMid(md.list[0], old); c.mids[i] = m; touch(c, '가맹점', `${m.mid} 수정 (${old.feeType} ${feeTxt(old)} → ${m.feeType} ${feeTxt(m)}, VAT ${m.vat})`); S.flashMids = [m.id]; toast(`${m.mid} 가맹점을 저장했습니다.`); }
    else { const ms = md.list.map(x => toMid(x)); c.mids.push(...ms); touch(c, '가맹점', `MID ${ms.length}건 등록: ${ms.map(m => `${m.mid}(${m.feeType} ${feeTxt(m)})`).join(', ')}`); S.flashMids = ms.map(m => m.id); toast(`가맹점 ${ms.length}건을 등록했습니다.`); }
    S.modal = null; render();
  },
  midRemove(el) { const c = combo(S.id), m = c.mids.find(x => x.id === el.dataset.id); if (!confirm(`${m.name} (${m.mid}) 가맹점을 삭제할까요?`)) return; c.mids = c.mids.filter(x => x.id !== m.id); c.promos.forEach(p => { if (p.mid === m.mid) p.mid = ''; }); touch(c, '가맹점', `${m.mid} 삭제`); render(); toast('가맹점을 삭제했습니다.'); },
  /* 프로모션 */
  promoNew() { const c = combo(S.id); S.modal = { type: 'promo', p: { name: '', type: '정률', value: '', from: today(), to: '', min: 0, prods: [...c.prods], mid: '', use: 'Y' }, err: [] }; render(); },
  promoEdit(el) { const p = combo(S.id).promos.find(x => x.id === el.dataset.id); S.modal = { type: 'promo', editId: p.id, p: clone(p), err: [] }; render(); },
  promoProd(el) { S.modal.p.prods = toggle(S.modal.p.prods, el.dataset.v); render(); },
  promoSave() {
    const c = combo(S.id), md = S.modal, p = md.p, e = [], v = Number(p.value);
    if (!p.name.trim()) e.push('프로모션명을 입력하세요.');
    if (p.value === '' || isNaN(v) || v <= 0 || (p.type === '정률' && v > 100)) e.push('할인 값을 확인하세요. 정률은 0% 초과 100% 이하입니다.');
    if (!p.from || !p.to) e.push('적용 시작일과 종료일을 입력하세요.'); else if (p.to < p.from) e.push('종료일은 시작일보다 빠를 수 없습니다.');
    if (!p.prods.length) e.push('대상 상품을 1개 이상 선택하세요.');
    md.err = e; if (e.length) { render(); return; }
    const x = { ...p, name: p.name.trim(), value: v, min: Number(p.min || 0), id: md.editId || 'PR-' + Date.now().toString(36) };
    if (md.editId) c.promos[c.promos.findIndex(q => q.id === md.editId)] = x; else c.promos.push(x);
    touch(c, '프로모션', `${x.name} ${md.editId ? '수정' : '등록'}`); S.modal = null; render(); toast('프로모션을 저장했습니다.');
  },
  promoRemove(el) { const c = combo(S.id), p = c.promos.find(x => x.id === el.dataset.id); if (!confirm(`${p.name} 프로모션을 삭제할까요?`)) return; c.promos = c.promos.filter(x => x.id !== p.id); touch(c, '프로모션', `${p.name} 삭제`); render(); },
  /* 등록 */
  draftProd(el) { S.draft.prods = toggle(S.draft.prods, el.dataset.v); render(); },
  createSave() {
    const d = S.draft, e = [];
    if (!d.pg) e.push('PG사를 선택하세요.');
    if (d.pg && pgOf(d.pg)?.use !== 'Y') e.push(`${d.pg}는 PG 관리에서 미사용이라 새 결제수단을 등록할 수 없습니다.`);
    if (!d.m) e.push('결제 수단을 선택하세요.'); else if (S.combos.some(c => c.pg === d.pg && c.m === d.m)) e.push(`${d.pg} › ${d.m}은(는) 이미 등록되어 있습니다. 목록에서 상세로 들어가 가맹점을 추가하세요.`);
    e.push(...midErrors(d.mids, []));
    S.err = e; if (e.length) { render(); scrollErr(); return; }
    const at = nowStr(), no = Math.max(0, ...S.combos.map(c => c.no)) + 1, mids = d.mids.map(x => toMid(x));
    const c = { id: 'PM-' + String(no).padStart(4, '0'), no, pg: d.pg, m: d.m, use: d.use, prods: [...d.prods], mids, promos: [], upd: at, by: USER, hist: [{ at, by: USER, item: '기준정보', desc: `${d.pg} / ${d.m} 등록${mids.length ? ` · MID ${mids.length}건(${mids.map(m => m.mid).join(', ')})` : ''}` }] };
    S.combos.push(c); pgHist(d.pg, '결제수단 기준정보', `${d.m} 기준정보 등록${mids.length ? ` · MID ${mids.length}건` : ''}`); S.draft = null; S.flashMids = mids.map(m => m.id);
    try { sessionStorage.setItem(SKEY + '-toast', `${d.pg} › ${d.m}을(를) 등록했습니다.${mids.length ? ` (MID ${mids.length}건)` : ''}`); } catch { }
    go('detail', '?id=' + c.id);
  },
  /* PG 관리 */
  pgSearch() { S.pgUi.fa = { ...S.pgUi.f }; S.pgUi.page = 1; render(); },
  pgReset() { S.pgUi = emptyPgUi(); render(); },
  pgOpen(el, e) { e?.preventDefault(); go('pgDetail', '?id=' + el.dataset.id); },
  pgToList() { go('pgList'); },
  pgCreate() { go('pgForm'); },
  pgEditGo() { go('pgForm', '?id=' + S.pgId); },
  pgCancel() { const d = S.pgDraft; if (d && !d.isNew) go('pgDetail', '?id=' + d.id); else go('pgList'); },
  pgMethod(el) { S.pgDraft.methods = toggle(S.pgDraft.methods, el.dataset.v); render(); },
  pgMethodAdd() { const d = S.pgDraft, v = (d.custom || '').trim(); if (!v) return; if (!d.methods.includes(v)) d.methods.push(v); d.custom = ''; render(); },
  pgSave() {
    const d = S.pgDraft, e = [], name = d.name.trim(), code = d.code.trim().toUpperCase();
    if (d.isNew) {
      if (!name) e.push('PG사명을 입력하세요.'); else if (S.pgs.some(p => p.name.toLowerCase() === name.toLowerCase())) e.push(`이미 등록된 PG사명입니다 (${name}).`);
      if (!/^[A-Z0-9]{2,10}$/.test(code)) e.push('PG 코드는 영문 대문자 · 숫자 2~10자로 입력하세요.'); else if (S.pgs.some(p => p.code === code)) e.push(`이미 쓰고 있는 PG 코드입니다 (${code}).`);
    }
    if (!d.methods.length) e.push('제공 결제수단을 1개 이상 선택하세요.');
    if (!d.isNew) { const miss = combosOfPg(d.name).map(c => c.m).filter(m => !d.methods.includes(m)); if (miss.length) e.push(`기준정보가 있는 결제수단은 뺄 수 없습니다: ${miss.join(', ')}`); }
    if (d.lt !== '수동 파일' && !d.lc.trim()) e.push('자동 수집(API · SFTP)은 수신 주기를 입력하세요.');
    S.pgErr = e; if (e.length) { render(); scrollErr(); return; }
    const at = nowStr();
    if (d.isNew) {
      const no = Math.max(0, ...S.pgs.map(p => p.no)) + 1;
      const p = { id: 'PG-' + String(no).padStart(3, '0'), no, name, code, reg: d.reg, use: d.use, methods: [...d.methods], lt: d.lt, lc: d.lc.trim(), lp: d.lp.trim(), regAt: today(), upd: at, by: USER, hist: [{ at, by: USER, item: 'PG사', desc: `${name}(${code}) 등록 · 제공 결제수단 ${d.methods.join(', ')}` }] };
      S.pgs.push(p); S.pgDraft = null;
      try { sessionStorage.setItem(SKEY + '-toast', `${name} PG사를 등록했습니다.`); } catch { }
      go('pgDetail', '?id=' + p.id); return;
    }
    const p = pgById(d.id), ch = [];
    if (p.use !== d.use) ch.push(['사용 여부', `${p.use} → ${d.use}`]);
    const add = d.methods.filter(m => !p.methods.includes(m)), del = p.methods.filter(m => !d.methods.includes(m));
    if (add.length || del.length) ch.push(['제공 결제수단', [add.length ? `추가 ${add.join(', ')}` : '', del.length ? `제외 ${del.join(', ')}` : ''].filter(Boolean).join(' / ')]);
    if (p.lt !== d.lt || p.lc !== d.lc.trim() || p.lp !== d.lp.trim()) ch.push(['대사 연동', `${p.lt} · ${p.lc || '-'} → ${d.lt} · ${d.lc.trim() || '-'}${p.lp !== d.lp.trim() ? ' (연동 경로 변경)' : ''}`]);
    if (ch.length) { Object.assign(p, { use: d.use, methods: [...d.methods], lt: d.lt, lc: d.lc.trim(), lp: d.lp.trim(), upd: at, by: USER }); ch.forEach(([item, desc]) => p.hist.unshift({ at, by: USER, item, desc })); }
    S.pgDraft = null;
    try { sessionStorage.setItem(SKEY + '-toast', ch.length ? 'PG사 정보를 저장했습니다.' : '바뀐 내용이 없습니다.'); } catch { }
    go('pgDetail', '?id=' + p.id);
  },
  pgRemove() {
    const p = pgById(S.pgId), cs = combosOfPg(p.name);
    if (cs.length) { alert(`${p.name}에 결제수단 기준정보 ${cs.length}건(${cs.map(c => c.m).join(', ')})이 있어 삭제할 수 없습니다.\n기준정보를 먼저 삭제하거나, PG사를 미사용으로 바꾸세요.`); return; }
    if (!confirm(`${p.name} PG사를 삭제할까요?`)) return;
    S.pgs = S.pgs.filter(x => x.id !== p.id);
    try { sessionStorage.setItem(SKEY + '-toast', `${p.name} PG사를 삭제했습니다.`); } catch { }
    go('pgList');
  },
  comboCreateFor(el) { const p = pgById(S.pgId); go('create',`?pg=${encodeURIComponent(p.name)}&m=${encodeURIComponent(el.dataset.v)}`); },
  /* 팝업 */
  closeModal() { S.modal = null; render(); },
  dimClose(el, e) { if (e.target === el) A.closeModal(); },
};

/* ================= 이벤트 ================= */
document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el || el.disabled) return; if (el.tagName === 'A') e.preventDefault(); const f = A[el.dataset.a]; if (f) { e.stopPropagation(); f(el, e); } });
document.addEventListener('change', e => {
  const el = e.target; if (!el.dataset.b) return;
  if (el.type === 'checkbox') return;
  set(el.dataset.b, el.value);
  if (el.dataset.b === 'draft.pg') S.draft.m = '';
  if (el.dataset.r !== undefined) render();
});
document.addEventListener('input', e => { const el = e.target; if (el.dataset.b && ['text', 'number', 'password', 'date'].includes(el.type)) set(el.dataset.b, el.value); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.modal) { A.closeModal(); return; }
  if (e.key === 'Enter' && e.target.tagName === 'TR' && e.target.dataset.a) A[e.target.dataset.a](e.target, e);
});
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

/* ================= 시작 ================= */
S = load();
S.modal = null; S.edit = null; S.err = [];
if (PAGE === 'detail') {
  const QP = new URLSearchParams(location.search), q = QP.get('id');
  S.id = q && combo(q) ? q : (S.id && combo(S.id) ? S.id : S.combos[0]?.id);
  S.tab = QP.get('tab') === 'hist' ? 'hist' : 'info';
  if (S.id && q !== S.id) history.replaceState(null, '', `${FILES.detail}?id=${S.id}${S.tab === 'hist' ? '&tab=hist' : ''}`);
}
if (PAGE === 'create') {
  // PG사 상세 [+ 기준정보 등록]에서 오면 ?pg=&m= 로 PG사 · 결제 수단을 미리 고른다
  const QP = new URLSearchParams(location.search), pg = pgOf(QP.get('pg') || ''), m = QP.get('m');
  initDraft();
  if (pg && pg.use === 'Y') { S.draft.pg = pg.name; if (m && pg.methods.includes(m) && !S.combos.some(c => c.pg === pg.name && c.m === m)) S.draft.m = m; }
}
if (PAGE === 'pgDetail') {
  const QP = new URLSearchParams(location.search), q = QP.get('id');
  S.pgId = q && pgById(q) ? q : (S.pgId && pgById(S.pgId) ? S.pgId : S.pgs[0]?.id);
  S.tab = QP.get('tab') === 'hist' ? 'hist' : 'info';
  if (S.pgId && q !== S.pgId) history.replaceState(null, '', `${FILES.pgDetail}?id=${S.pgId}${S.tab === 'hist' ? '&tab=hist' : ''}`);
}
if (PAGE === 'pgForm') { const p = pgById(new URLSearchParams(location.search).get('id') || ''); initPgDraft(p || null); }
render();
S.flashMids = null; persist();
try { const t = sessionStorage.getItem(SKEY + '-toast'); if (t) { sessionStorage.removeItem(SKEY + '-toast'); toast(t); } } catch { }
