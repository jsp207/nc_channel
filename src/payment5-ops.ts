// 결제관리 v0.2.3 · 결제 이력 · 거래내역 대사 · PG 수수료 조회. 모든 데이터는 가상값이다.
// PG 관리 · 결제수단 기준정보와 같은 데이터(payment5-store.ts: PG사 › 계약 › 결제수단 › MID)를 쓴다.
// 결제 건은 등록된 MID(사용 계약 · 유효기간 안)에서 날마다 만들어 낸다. 기준정보에서 MID를 바꾸면 이 화면들도 따라 바뀐다.
// 대사는 계약 단위(대사 URL이 계약에 있음), 수수료는 MID 단위(수수료 조건이 MID에 있음)로 집계한다.
import "./admin-shell.css";
import "./payment2.css";
import "./payment4.css";
import "./payment5.css";
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import type { Contract, Mid } from "./payment5-store";
import {
  TODAY, USER, URLS, RECV_LABEL, D, $, esc, pad, won, opts, badge, crumb, ph, sec, ft, lf, errBox, pgOf, ctOf, feeTxt, lv3Of, toast, TONE, methodOrder,
} from "./payment5-store";

requireAuthentication();
Object.assign(TONE, { 결제완료: 'ok', 부분취소: 'warn', 승인취소: 'bad', 결제실패: 'gray', Pass: 'ok', Fail: 'bad', 입금대기: 'gray', 일치: 'ok', 불일치: 'bad', 미수신: 'warn', '청구 전': 'gray' });

/* ================= 결제 건 만들기 ================= */
type PaySt = '결제완료' | '부분취소' | '승인취소' | '결제실패';
interface Log { at: string; by: string; t: string; amt: number }
interface Pay {
  no: string; appr: string; tid: string; at: string; ct: string; midId: string; method: string;
  cat: string; pname: string; amt: number; cancel: number; st: PaySt; inst: string; ord: string; mbr: string; failMsg: string; logs: Log[];
}
const OPS_KEY = 'nova-payment5-ops-v1';
const START = '2026-10-01';
const MBR = ['김*수', '이*영', '박*민', '최*지', '정*호', '강*은', '조*현', '윤*아'];
const NAMES: Record<string, string[]> = {
  휴대폰형: ['갤럭시 Z 폴드8 512GB(가상)', '아이폰 17 256GB(가상)', '갤럭시 S26 256GB(가상)'],
  태블릿형: ['갤럭시 탭 S11 256GB(가상)', '아이패드 에어 7세대(가상)'],
  액세서리형: ['C타입 고속충전기 45W(가상)', '갤럭시 버즈4 케이스(가상)', '맥세이프 무선충전 패드(가상)'],
  쿠폰형: ['편의점 5천원권(가상)', '아메리카노 기프티콘(가상)', 'VIP 영화 예매권(가상)'],
  앱서비스형: ['TVING+Wavve 스탠다드(가상)', '유튜브 프리미엄(가상)'],
};
const AMT: Record<string, [number, number]> = { 휴대폰형: [890000, 2100000], 태블릿형: [450000, 1300000], 액세서리형: [9900, 79000], 쿠폰형: [3000, 50000], 앱서비스형: [9900, 19900] };
const addDays = (d: string, n: number) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
function rng(seed: string) { let a = 0; for (const c of seed) a = (a * 31 + c.charCodeAt(0)) | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const live = (m: Mid, day: string) => m.from <= day && (!m.to || m.to >= day);

// 승인취소는 화면에서 바뀌므로 결제번호별로 따로 저장해 둔다
type Cancel = { amt: number; at: string; why: string };
const CANCELS: Record<string, Cancel[]> = (() => { try { return JSON.parse(sessionStorage.getItem(OPS_KEY) || '{}'); } catch { return {}; } })();
const saveCancels = () => { try { sessionStorage.setItem(OPS_KEY, JSON.stringify(CANCELS)); } catch { /* 저장 실패는 화면 동작에 영향 없음 */ } };

function genPays(): Pay[] {
  const r = rng('nova-pay-v5'), out: Pay[] = [];
  let seq = 0;
  for (let day = START; day <= TODAY; day = addDays(day, 1)) {
    D.cts.filter(c => c.status === '사용').forEach(c => c.mids.filter(m => live(m, day)).forEach(m => {
      const n = Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const cat = m.products[Math.floor(r() * m.products.length)] || '-';
        const [lv2, lv3raw] = cat.split(' > ');
        const lv3 = lv3raw === '전체' ? (lv3Of(lv2)[Math.floor(r() * lv3Of(lv2).length)] || '') : lv3raw || '';
        const names = NAMES[lv3] || [`${lv3 || lv2} 상품(가상)`];
        const [lo, hi] = AMT[lv3] || [10000, 100000];
        const amt = Math.round((lo + r() * (hi - lo)) / 100) * 100;
        const x = r(), st: PaySt = x < 0.8 ? '결제완료' : x < 0.88 ? '승인취소' : x < 0.93 ? '부분취소' : '결제실패';
        const cancel = st === '승인취소' ? amt : st === '부분취소' ? Math.round(amt * (0.2 + r() * 0.4) / 100) * 100 : 0;
        const time = `${pad(8 + Math.floor(r() * 14))}:${pad(Math.floor(r() * 60))}:${pad(Math.floor(r() * 60))}`;
        const ymd = day.replace(/-/g, '').slice(2), s4 = pad(++seq, 4);
        const at = `${day} ${time}`;
        const logs: Log[] = [{ at: at.slice(0, 16), by: '시스템', t: st === '결제실패' ? '결제 실패' : '결제 승인', amt }];
        if (cancel) logs.push({ at: `${day} ${pad(Math.min(23, +time.slice(0, 2) + 1))}:${time.slice(3, 5)}`, by: '고객 요청', t: st === '승인취소' ? '승인취소' : '부분취소', amt: -cancel });
        out.push({ no: `PY${ymd}${s4}`, appr: st === '결제실패' ? '' : String(100000 + Math.floor(r() * 899999)), tid: `${pgOf(c).code}${ymd}${s4}`, at, ct: c.no, midId: m.id, method: m.method,
          cat: lv3 ? `${lv2} > ${lv3}` : cat, pname: names[Math.floor(r() * names.length)], amt, cancel, st,
          inst: m.method === '신용카드' && amt >= 300000 ? '12개월' : m.method === '신용카드' ? '일시불' : '-',
          ord: `OD${ymd}${s4}`, mbr: MBR[Math.floor(r() * MBR.length)], failMsg: st === '결제실패' ? ['카드 한도 초과', '잔액 부족', '본인 인증 실패'][Math.floor(r() * 3)] : '', logs });
      }
    }));
  }
  // 화면에서 한 승인취소를 덧입힌다
  out.forEach(p => (CANCELS[p.no] || []).forEach(x => {
    p.cancel += x.amt; p.st = p.amt - p.cancel <= 0 ? '승인취소' : '부분취소';
    p.logs.push({ at: x.at, by: USER, t: `${p.amt - p.cancel <= 0 ? '승인취소' : '부분취소'} (BO · ${x.why})`, amt: -x.amt });
  }));
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
const PAYS = genPays();
const payOf = (no: string | null) => PAYS.find(p => p.no === no);
const ctById = (no: string) => ctOf(no) as Contract;
const midOf = (p: Pay) => ctById(p.ct).mids.find(m => m.id === p.midId) as Mid;
const net = (p: Pay) => p.st === '결제실패' ? 0 : p.amt - p.cancel;
// 예상 수수료: MID 수수료 조건(정률 · 정액 · 혼합) 적용. VAT 별도면 10% 더한다
function feeOf(p: Pay) {
  const m = midOf(p), b = net(p);
  if (!m || b <= 0) return 0;
  const f = (m.feeType === '정액' ? 0 : b * m.rate / 100) + (m.feeType === '정률' ? 0 : m.flat);
  return Math.round(m.vat === '별도' ? f * 1.1 : f);
}
const allMids = () => D.cts.flatMap(c => c.mids.map(m => ({ c, m })));
const usedMethods = () => methodOrder().filter(n => D.cts.some(c => c.mids.some(m => m.method === n)));

/* ================= 공통 ================= */
const PAGE = document.body.dataset.page || 'pay';
const QP = new URLSearchParams(location.search);
const UI: { f: any; fA: any; page: number; modal: any; tab: any } = { f: {}, fA: {}, page: 1, modal: null, tab: '' };
function setPath(o: any, path: string, v: unknown) { const ks = path.split('.'); const last = ks.pop() as string; ks.forEach(k => o = o[k]); o[last] = v; }
function pager(total: number, size: number) {
  const tot = Math.max(1, Math.ceil(total / size)), cur = Math.min(UI.page, tot);
  if (total <= size) return '';
  const B = (p: number, l: string, lab: string, dis: boolean) => `<button type="button" data-a="pg" data-p="${p}" ${dis ? 'disabled' : ''} aria-label="${lab}">${l}</button>`;
  let a = Math.max(1, Math.min(cur - 4, tot - 8)); const b = Math.min(tot, a + 8); if (b - a < 8) a = Math.max(1, b - 8);
  let h = `<nav class="pager" aria-label="페이지">${B(1, '|‹', '처음', cur <= 1)}${B(cur - 1, '‹', '이전', cur <= 1)}`;
  for (let i = a; i <= b; i++) h += `<button type="button" class="pg${i === cur ? ' on' : ''}" data-a="pg" data-p="${i}" ${i === cur ? 'aria-current="page"' : ''}>${i}</button>`;
  return h + `${B(cur + 1, '›', '다음', cur >= tot)}${B(tot, '›|', '마지막', cur >= tot)}</nav>`;
}
const slice = <T>(rows: T[], size: number) => { const tot = Math.max(1, Math.ceil(rows.length / size)); UI.page = Math.min(UI.page, tot); return rows.slice((UI.page - 1) * size, UI.page * size); };
function csv(name: string, head: string[], rows: (string | number)[][]) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const t = '﻿' + [head, ...rows].map(r => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv;charset=utf-8' })); a.download = `${name}_${TODAY.replace(/-/g, '')}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); toast(`${name} 파일을 내려받았습니다. (${rows.length}건)`);
}
const filterBox = (rows: string[]) => `<form class="lst-filter" autocomplete="off" onsubmit="return false">${rows.map(r => `<div class="lf-row">${r}</div>`).join('')}</form>`;
const acts = `<span class="lf-acts"><button type="button" class="btn dark" data-a="reset">초기화</button><button type="button" class="btn pri" data-a="search">조회</button></span>`;
const range = (a: string, b: string, label: string) => `<span class="lf-range"><input type="date" data-b="f.${a}" value="${UI.f[a] || ''}" aria-label="${label} 시작"><span aria-hidden="true">~</span><input type="date" data-b="f.${b}" value="${UI.f[b] || ''}" aria-label="${label} 종료"></span>`;
const pgOpts = (v: string) => opts(D.pgs.map(p => [p.id, p.name] as [string, string]), v, '전체');
const midOpts = (v: string) => opts(allMids().map(({ m }) => [m.id, `${m.name} · ${m.mid}`] as [string, string]), v, '전체');
const money = (n: number) => n < 0 ? `<span style="color:var(--bad)">${won(n)}</span>` : won(n);

/* ================= 결제 이력 목록 ================= */
const emptyPayF = () => ({ pg: '', m: '', mid: '', st: '', q: '', from: '2026-11-01', to: TODAY });
function payRows() {
  const f = UI.fA, q = (f.q || '').trim().toUpperCase();
  return PAYS.filter(p => { const c = ctById(p.ct); return (!f.pg || c.pg === f.pg) && (!f.m || p.method === f.m) && (!f.mid || p.midId === f.mid) && (!f.st || p.st === f.st)
    && (!f.from || p.at.slice(0, 10) >= f.from) && (!f.to || p.at.slice(0, 10) <= f.to) && (!q || [p.no, p.appr, p.ord].some(v => v.toUpperCase().includes(q))); });
}
function vPay() {
  const f = UI.f, rows = payRows(), page = slice(rows, 15), sum = rows.reduce((a, p) => a + net(p), 0);
  return `${crumb(['결제 이력 관리'])}<h1 class="lst-title">결제 이력 관리</h1>${filterBox([
    lf('PG사', `<select data-b="f.pg">${pgOpts(f.pg)}</select>`) + lf('결제수단', `<select data-b="f.m">${opts(usedMethods(), f.m, '전체')}</select>`) + lf('가맹점 / MID', `<select data-b="f.mid">${midOpts(f.mid)}</select>`) + lf('결제상태', `<select data-b="f.st">${opts(['결제완료', '부분취소', '승인취소', '결제실패'], f.st, '전체')}</select>`),
    lf('검색어', `<input type="text" data-b="f.q" data-enter="search" value="${esc(f.q)}" placeholder="결제번호, 승인번호, 주문번호">`) + lf('승인일', range('from', 'to', '승인일'), 'lf-wide') + acts])}
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 순결제금액 ${won(sum)}원</span></h2><div class="pm3-tools"><button class="btn sm" data-a="payCsv">엑셀 다운로드</button></div></div>
  <div class="tw"><table class="tbl lst-table"><thead><tr><th>결제번호</th><th>승인일시</th><th class="l">PG사</th><th>결제수단</th><th class="l">가맹점명</th><th>MID</th><th class="r">결제금액</th><th class="r">취소금액</th><th class="r">순결제금액</th><th>결제상태</th><th>주문번호</th></tr></thead><tbody>
  ${page.map(p => { const c = ctById(p.ct), m = midOf(p); return `<tr><td><a class="p4-id" href="${URLS.payD}?no=${p.no}">${p.no}</a></td><td class="num">${p.at.slice(0, 16)}</td><td class="l">${esc(pgOf(c).name)}</td><td>${esc(p.method)}</td>
   <td class="l">${esc(m?.name || '-')}</td><td class="mid">${esc(m?.mid || '-')}</td><td class="r num">${won(p.amt)}</td><td class="r num">${p.cancel ? money(-p.cancel) : '0'}</td><td class="r num">${p.st === '결제실패' ? '-' : won(net(p))}</td><td>${badge(p.st)}</td><td class="num">${p.ord}</td></tr>`; }).join('') || '<tr><td colspan="11" class="empty">조건에 맞는 결제 건이 없습니다.</td></tr>'}</tbody></table></div>
  <div class="lst-bottom">${pager(rows.length, 15)}</div>`;
}

/* ================= 결제 상세 ================= */
const cancelable = (p: Pay) => ['결제완료', '부분취소'].includes(p.st) && net(p) > 0;
function vPayD() {
  const p = payOf(QP.get('no')) || PAYS[0];
  if (!p) return `${crumb(['결제 이력 관리', '상세'])}<div class="emptybox">결제 건이 없습니다.</div>`;
  const c = ctById(p.ct), m = midOf(p);
  return `${crumb(['결제 이력 관리', '상세'])}${ph(`${p.no} ${badge(p.st)}`)}
  ${sec('결제 정보', ft(`<tr><th>결제번호</th><td class="mid">${p.no}</td><th>승인번호</th><td class="mid">${p.appr || '-'}</td></tr>
   <tr><th>승인일시</th><td>${p.at}</td><th>결제상태</th><td>${badge(p.st)}${p.failMsg ? ` <span class="dim-t">${esc(p.failMsg)}</span>` : ''}</td></tr>
   <tr><th>결제수단</th><td>${esc(p.method)}</td><th>할부</th><td>${p.inst}</td></tr>
   <tr><th>PG 거래번호</th><td class="mid">${p.tid}</td><th>주문번호</th><td class="mid">${p.ord}</td></tr>`))}
  ${sec('가맹점 정보', ft(`<tr><th>PG사</th><td>${esc(pgOf(c).name)}</td><th>계약번호</th><td><a class="p4-id" href="${URLS.ctr}?ct=${c.no}">${c.no}</a></td></tr>
   <tr><th>가맹점명</th><td>${esc(m?.name || '-')}</td><th>MID</th><td>${m ? `<a class="p4-id" href="${URLS.ctr}?ct=${c.no}&id=${m.id}">${esc(m.mid)}</a>` : '-'}</td></tr>
   <tr><th>정산주체</th><td>${esc(m?.owner || '-')}</td><th>수수료 조건</th><td>${m ? `${feeTxt(m)} <span class="dim-t">(VAT ${m.vat})</span>` : '-'}</td></tr>`))}
  ${sec('상품 정보', ft(`<tr><th>상품명</th><td>${esc(p.pname)}</td><th>상품 분류</th><td>${esc(p.cat)}</td></tr>
   <tr><th>회원</th><td colspan="3">${esc(p.mbr)}</td></tr>`))}
  ${sec('결제 금액', ft(`<tr><th>결제금액</th><td>${won(p.amt)}원</td><th>취소금액</th><td>${won(p.cancel)}원</td></tr>
   <tr><th>순결제금액</th><td><b>${p.st === '결제실패' ? '-' : won(net(p)) + '원'}</b></td><th>예상 수수료</th><td>${won(feeOf(p))}원</td></tr>`))}
  ${sec('처리 이력', `<div class="tw"><table class="tbl"><thead><tr><th>일시</th><th>처리자</th><th class="l">내용</th><th class="r">금액</th></tr></thead><tbody>
   ${p.logs.map(l => `<tr><td class="num">${l.at}</td><td>${esc(l.by)}</td><td class="l">${esc(l.t)}</td><td class="r num">${money(l.amt)}</td></tr>`).join('')}</tbody></table></div>`)}
  <div class="foot pm3h-foot"><a class="btn lg" href="${URLS.pay}">목록</a>${cancelable(p) ? `<button class="btn lg dng" data-a="cancelOpen">승인취소</button>` : ''}</div>`;
}
function mCancel() {
  const p = payOf(QP.get('no')) || PAYS[0], md = UI.modal, rest = net(p);
  return { t: '승인취소', b: `${errBox(md.err)}${ft(`<tr><th>결제번호</th><td>${p.no}</td></tr><tr><th>취소 가능 금액</th><td>${won(rest)}원</td></tr>
   <tr><th class="req">취소 구분</th><td><div class="ck-g rd">${[['all', '전체 취소'], ['part', '부분 취소']].map(([v, l]) => `<label><input type="radio" name="ckind" value="${v}" data-b="modal.kind" data-r ${md.kind === v ? 'checked' : ''}>${l}</label>`).join('')}</div></td></tr>
   <tr><th class="req">취소 금액</th><td><span class="p5-unit"><input class="inp num" type="number" min="1" step="100" data-b="modal.amt" value="${md.kind === 'all' ? rest : esc(md.amt)}" ${md.kind === 'all' ? 'disabled' : ''} aria-label="취소 금액">원</span></td></tr>
   <tr><th class="req">취소 사유</th><td><input class="inp" style="width:100%" data-b="modal.why" value="${esc(md.why)}" maxlength="50" placeholder="예: 고객 요청"></td></tr>`)}`,
    f: `<button class="btn" data-a="close">닫기</button><button class="btn pri dng" data-a="cancelSave">승인취소</button>` };
}

/* ================= 거래내역 대사: 월별 목록(대사월 × PG사) · 상세(MID별 승인대사 · 입금대사) ================= */
// 대사 방식은 MID마다 정해진다
//  - 대사 URL 없음 → 오프라인: 상세에서 내역을 내려받아 대사하고, 결과는 운영자가 상태를 바꿔 남긴다
//  - PG 수신 방식 API → API 자동: 자동 수신 · 대조해 Pass/Fail
//  - PG 수신 방식 엑셀 → 엑셀 업로드: 운영자가 파일을 올리면 대조. 올리기 전에는 업로드 대기
// 어떤 방식이든 운영자가 상태(Pass · Fail)를 바꿀 수 있고, 바꾼 일시 · 처리자 · 사유를 변경 이력에 남긴다
type RKind = '승인대사' | '입금대사';
type RMode = 'API 자동' | '엑셀 업로드' | '오프라인';
type RSt = 'Pass' | 'Fail' | '업로드 대기' | '확인 대기';
interface RItem { key: string; mon: string; kind: RKind; c: Contract; m: Mid; mode: RMode; pays: Pay[]; cnt: number; base: number; cmp: number | null; st: RSt; at: string; by: string }
interface RHist { at: string; by: string; mon: string; pg: string; mid: string; kind: RKind; before: string; after: string; why: string }
const RECON_KEY = 'nova-payment5-recon-v1';
const RS: { items: Record<string, { st: RSt; at: string; by: string }>; uploads: Record<string, string>; hist: RHist[] } =
  (() => { try { return { items: {}, uploads: {}, hist: [], ...JSON.parse(sessionStorage.getItem(RECON_KEY) || '{}') }; } catch { return { items: {}, uploads: {}, hist: [] }; } })();
const saveRS = () => { try { sessionStorage.setItem(RECON_KEY, JSON.stringify(RS)); } catch { /* 저장 실패는 화면 동작에 영향 없음 */ } };
Object.assign(TONE, { '업로드 대기': 'warn', '확인 대기': 'warn', 완료: 'ok', '처리 필요': 'warn' });
const nowAt = () => { const d = new Date(); return `${TODAY} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const depDay = (p: Pay) => addDays(p.at.slice(0, 10), 2);
function reconItems(mon: string): RItem[] {
  const out: RItem[] = [];
  allMids().forEach(({ c, m }) => {
    const ok = PAYS.filter(p => p.midId === m.id && p.st !== '결제실패');
    const sets: [RKind, Pay[]][] = [
      ['승인대사', ok.filter(p => p.at.startsWith(mon) && p.at.slice(0, 10) < TODAY)],
      ['입금대사', ok.filter(p => depDay(p).startsWith(mon) && depDay(p) < TODAY)],
    ];
    const pg = pgOf(c), url = m.reconMode === 'own' ? m.reconUrl : c.reconUrl;
    const mode: RMode = !url ? '오프라인' : pg.recv === 'API' ? 'API 자동' : '엑셀 업로드';
    sets.forEach(([kind, pays]) => {
      if (!pays.length) return;
      const key = `${mon}|${m.id}|${kind}`;
      const base = pays.reduce((a, p) => a + net(p) - (kind === '입금대사' ? feeOf(p) : 0), 0);
      const last = pays.map(p => kind === '입금대사' ? depDay(p) : p.at.slice(0, 10)).sort().pop() as string;
      const fail = rng(key)() < 0.12, up = RS.uploads[`${mon}|${pg.id}|${kind}`];
      let st: RSt, cmp: number | null = null, at = '-', by = '-';
      if (mode === '오프라인') st = '확인 대기';
      else if (mode === '엑셀 업로드' && !up) st = '업로드 대기';
      else { cmp = base - (fail ? 1000 : 0); st = fail ? 'Fail' : 'Pass'; at = mode === 'API 자동' ? `${addDays(last, 1)} 07:00` : up; by = mode === 'API 자동' ? '시스템' : USER; }
      const o = RS.items[key];
      if (o) { st = o.st; at = o.at; by = o.by; }
      out.push({ key, mon, kind, c, m, mode, pays, cnt: pays.length, base, cmp, st, at, by });
    });
  });
  return out;
}
interface RGroup { mon: string; pg: string; items: RItem[] }
function reconGroups(mon: string): RGroup[] {
  const items = reconItems(mon);
  return D.pgs.map(p => ({ mon, pg: p.id, items: items.filter(x => x.c.pg === p.id) })).filter(g => g.items.length);
}
const todo = (items: RItem[]) => items.filter(x => x.st !== 'Pass').length;
const passTxt = (items: RItem[]) => { const n = items.length; return n ? `Pass ${items.filter(x => x.st === 'Pass').length} / ${n}` : '-'; };
const lastAt = (items: RItem[]) => items.map(x => x.at).filter(x => x !== '-').sort().pop() || '-';
const reconCsvRows = (items: RItem[]) => items.map(x => [x.mon, x.kind, pgOf(x.c).name, x.c.no, x.m.name, x.m.mid, x.mode, x.cnt, x.base, x.cmp ?? '', x.cmp == null ? '' : x.cmp - x.base, x.st, x.at, x.by]);
const RECON_HEAD = ['대사월', '대사 구분', 'PG사', '계약번호', '가맹점명', 'MID', '대사 방식', '건수', '기준 금액', '대조 금액', '차이', '상태', '처리일시', '처리자'];

const emptyReconF = () => ({ mon: '2026-10', pg: '', recv: '', st: '' });
function reconFiltered() {
  const a = UI.fA;
  return reconGroups(a.mon).filter(g => { const p = D.pgs.find(x => x.id === g.pg)!; const n = todo(g.items);
    return (!a.pg || g.pg === a.pg) && (!a.recv || p.recv === a.recv) && (!a.st || (a.st === '처리 필요' ? n > 0 : n === 0)); });
}
function vRecon() {
  const f = UI.f, rows = reconFiltered(), page = slice(rows, 15);
  return `${crumb(['결제 거래내역 대사관리'])}<h1 class="lst-title">결제 거래내역 대사관리</h1>${filterBox([
    lf('대사월', `<select data-b="f.mon">${opts(MONS.map(m => [m, monLabel(m)] as [string, string]), f.mon)}</select>`) + lf('PG사', `<select data-b="f.pg">${pgOpts(f.pg)}</select>`) + lf('입금 내역 수신', `<select data-b="f.recv">${opts([['API', RECV_LABEL.API], ['엑셀', RECV_LABEL.엑셀]], f.recv, '전체')}</select>`) + lf('처리 상태', `<select data-b="f.st">${opts(['처리 필요', '완료'], f.st, '전체')}</select>`),
    acts])}
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 처리 필요 ${rows.reduce((a, g) => a + todo(g.items), 0)}건</span></h2></div>
  <div class="tw"><table class="tbl lst-table"><thead><tr><th>대사월</th><th class="l">PG사</th><th>입금 내역 수신</th><th>대상 MID</th><th>승인대사</th><th>입금대사</th><th>처리 상태</th><th>최근 처리일시</th><th>다운로드</th></tr></thead><tbody>
  ${page.map(g => { const p = D.pgs.find(x => x.id === g.pg)!, n = todo(g.items), mids = new Set(g.items.map(x => x.m.id)).size;
    return `<tr><td class="num">${g.mon}</td><td class="l"><a class="p4-id" href="${URLS.reconD}?mon=${g.mon}&pg=${g.pg}">${esc(p.name)}</a></td><td>${RECV_LABEL[p.recv]}</td><td>${mids}개</td>
     <td>${passTxt(g.items.filter(x => x.kind === '승인대사'))}</td><td>${passTxt(g.items.filter(x => x.kind === '입금대사'))}</td><td>${n ? badge(`처리 필요 ${n}건`, 'warn') : badge('완료')}</td><td class="num">${lastAt(g.items)}</td>
     <td><button class="btn sm" data-a="reconRowCsv" data-mon="${g.mon}" data-pg="${g.pg}">다운로드</button></td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">조건에 맞는 대사 결과가 없습니다.</td></tr>'}</tbody></table></div>
  <div class="lst-bottom">${pager(rows.length, 15)}</div>`;
}
function curRecon() {
  const mon = MONS.includes(QP.get('mon') || '') ? QP.get('mon') as string : '2026-10';
  const gs = reconGroups(mon);
  return gs.find(g => g.pg === QP.get('pg')) || gs[0];
}
function vReconD() {
  const g = curRecon();
  if (!g) return `${crumb(['결제 거래내역 대사관리', '상세'])}<div class="emptybox">대사 내역이 없습니다.</div><div class="foot"><a class="btn lg" href="${URLS.recon}">목록</a></div>`;
  const p = D.pgs.find(x => x.id === g.pg)!, kind: RKind = UI.tab || '승인대사', items = g.items.filter(x => x.kind === kind);
  const hist = RS.hist.filter(h => h.mon === g.mon && h.pg === g.pg);
  const upAt = RS.uploads[`${g.mon}|${g.pg}|${kind}`];
  const sum = (k: 'cnt' | 'base') => items.reduce((a, x) => a + x[k], 0);
  return `${crumb(['결제 거래내역 대사관리', '상세'])}${ph(`${esc(p.name)} · ${g.mon} ${todo(g.items) ? badge(`처리 필요 ${todo(g.items)}건`, 'warn') : badge('완료')}`)}
  ${sec('기본 정보', ft(`<tr><th>대사월</th><td>${monLabel(g.mon)}</td><th>PG사</th><td>${esc(p.name)} <span class="dim-t">(${esc(p.code)})</span></td></tr>
   <tr><th>입금 내역 수신</th><td>${RECV_LABEL[p.recv]}</td><th>대상 MID</th><td>${new Set(g.items.map(x => x.m.id)).size}개</td></tr>
   <tr><th>승인대사</th><td>${passTxt(g.items.filter(x => x.kind === '승인대사'))}</td><th>입금대사</th><td>${passTxt(g.items.filter(x => x.kind === '입금대사'))}</td></tr>`))}
  <div class="tabs small" role="tablist">${(['승인대사', '입금대사'] as RKind[]).map(k => `<button role="tab" aria-selected="${k === kind}" class="${k === kind ? 'on' : ''}" data-a="reconTab" data-v="${k}">${k} ${g.items.filter(x => x.kind === k).length}</button>`).join('')}</div>
  <section class="sec" style="margin-top:20px"><div class="sec-h"><h3>MID별 ${kind}</h3>${p.recv === '엑셀' ? `<span class="hint">${upAt ? `최근 업로드 ${upAt}` : '엑셀 미업로드'}</span>` : ''}<span class="p5-r">${p.recv === '엑셀' ? `<button class="btn sm pri" data-a="uploadOpen">엑셀 업로드</button>` : ''}<button class="btn sm" data-a="reconDCsv">내역 다운로드</button></span></div>
  <div class="tw"><table class="tbl"><thead><tr><th class="l">가맹점명</th><th>MID</th><th>계약번호</th><th>대사 방식</th><th class="r">건수</th><th class="r">기준 금액</th><th class="r">대조 금액</th><th class="r">차이</th><th>상태</th><th>처리일시</th><th>처리자</th><th>관리</th></tr></thead><tbody>
  ${items.map(x => { const diff = x.cmp == null ? null : x.cmp - x.base;
    return `<tr><td class="l">${esc(x.m.name)}</td><td class="mid">${esc(x.m.mid)}</td><td><a class="p4-id" href="${URLS.ctr}?ct=${x.c.no}">${x.c.no}</a></td><td>${x.mode}</td><td class="r num">${x.cnt}</td><td class="r num">${won(x.base)}</td>
     <td class="r num">${x.cmp == null ? '-' : won(x.cmp)}</td><td class="r num">${diff == null ? '-' : diff ? money(diff) : '0'}</td><td>${badge(x.st)}</td><td class="num">${x.at}</td><td>${esc(x.by)}</td>
     <td><button class="btn sm" data-a="stOpen" data-k="${x.key}">상태 변경</button></td></tr>`; }).join('') || '<tr><td colspan="12" class="empty">이 달의 대사 내역이 없습니다.</td></tr>'}</tbody>
  ${items.length ? `<tfoot><tr><td class="l" colspan="4">합계</td><td class="r">${won(sum('cnt'))}</td><td class="r">${won(sum('base'))}</td><td colspan="6"></td></tr></tfoot>` : ''}</table></div></section>
  ${sec('변경 이력', `<div class="tw"><table class="tbl"><thead><tr><th>일시</th><th>처리자</th><th>대사 구분</th><th>MID</th><th>변경 전</th><th>변경 후</th><th class="l">사유</th></tr></thead><tbody>
   ${hist.map(h => `<tr><td class="num">${h.at}</td><td>${esc(h.by)}</td><td>${h.kind}</td><td class="mid">${esc(h.mid)}</td><td>${esc(h.before)}</td><td>${esc(h.after)}</td><td class="l">${esc(h.why)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">변경 이력이 없습니다.</td></tr>'}</tbody></table></div>`)}
  <div class="foot pm3h-foot"><a class="btn lg" href="${URLS.recon}">목록</a></div>`;
}
function mStatus() {
  const md = UI.modal, x = curRecon().items.find(y => y.key === md.k) as RItem;
  return { t: '대사 상태 변경', b: `${errBox(md.err)}${ft(`<tr><th>MID</th><td>${esc(x.m.name)} · ${esc(x.m.mid)}</td></tr><tr><th>대사 구분</th><td>${x.kind} · ${x.mode}</td></tr>
   <tr><th>현재 상태</th><td>${badge(x.st)}</td></tr>
   <tr><th class="req">변경 상태</th><td><div class="ck-g rd">${['Pass', 'Fail'].map(v => `<label><input type="radio" name="rst" value="${v}" data-b="modal.st" ${md.st === v ? 'checked' : ''}>${v}</label>`).join('')}</div></td></tr>
   <tr><th class="req">사유</th><td><input class="inp" style="width:100%" data-b="modal.why" value="${esc(md.why)}" maxlength="80" placeholder="예: 오프라인 대사 결과 일치 확인"></td></tr>`)}`,
    f: `<button class="btn" data-a="close">취소</button><button class="btn pri" data-a="stSave">저장</button>` };
}
function mUpload() {
  const md = UI.modal, g = curRecon(), kind: RKind = UI.tab || '승인대사';
  return { t: `${kind} 엑셀 업로드`, b: `${errBox(md.err)}${ft(`<tr><th>PG사 / 대사월</th><td>${esc(pgOf(g.items[0].c).name)} / ${g.mon}</td></tr>
   <tr><th class="req">파일</th><td><input type="file" data-c="upFile" accept=".xlsx,.xls,.csv" aria-label="업로드 파일">${md.file ? `<div class="sub">${esc(md.file)}</div>` : ''}</td></tr>`)}
   <p class="p5-note">업로드한 PG ${kind === '입금대사' ? '입금' : '거래'} 내역과 MID별 기준 금액을 대조합니다. 프로토타입에서는 파일 내용을 읽지 않고 업로드한 것으로 처리합니다.</p>`,
    f: `<button class="btn" data-a="close">취소</button><button class="btn pri" data-a="uploadSave">업로드</button>` };
}

/* ================= PG 수수료 조회: 정산월 × MID ================= */
interface FeeRow { mon: string; c: Contract; m: Mid; cnt: number; amt: number; exp: number; claim: number | null; st: '일치' | '불일치' | '미수신' | '청구 전'; pays: Pay[] }
const MONS = ['2026-11', '2026-10'];
const monLabel = (m: string) => `${m.slice(0, 4)}년 ${+m.slice(5)}월${m === TODAY.slice(0, 7) ? ' (진행 중)' : ''}`;
function feeRows(mon: string): FeeRow[] {
  return allMids().map(({ c, m }) => {
    const pays = PAYS.filter(p => p.midId === m.id && p.at.startsWith(mon) && net(p) > 0);
    if (!pays.length) return null;
    const exp = pays.reduce((a, p) => a + feeOf(p), 0), r = rng(`${mon}|${m.id}`)();
    // 진행 중인 달은 PG 청구 전. 지난달은 일부 불일치 · 미수신 예시
    const claim = mon === TODAY.slice(0, 7) ? null : r < 0.1 ? null : r < 0.25 ? exp + Math.round(exp * 0.01) + 100 : exp;
    const st = mon === TODAY.slice(0, 7) ? '청구 전' : claim == null ? '미수신' : claim === exp ? '일치' : '불일치';
    return { mon, c, m, cnt: pays.length, amt: pays.reduce((a, p) => a + net(p), 0), exp, claim, st, pays } as FeeRow;
  }).filter((x): x is FeeRow => !!x);
}
const emptyFeeF = () => ({ mon: '2026-10', pg: '', m: '', st: '' });
function vFee() {
  const f = UI.f, a = UI.fA;
  const rows = feeRows(a.mon).filter(x => (!a.pg || x.c.pg === a.pg) && (!a.m || x.m.method === a.m) && (!a.st || x.st === a.st));
  const page = slice(rows, 15), sum = (k: 'cnt' | 'amt' | 'exp') => rows.reduce((s, x) => s + x[k], 0);
  return `${crumb(['PG 수수료 조회'])}<h1 class="lst-title">PG 수수료 조회</h1>${filterBox([
    lf('정산월', `<select data-b="f.mon">${opts(MONS.map(m => [m, monLabel(m)] as [string, string]), f.mon)}</select>`) + lf('PG사', `<select data-b="f.pg">${pgOpts(f.pg)}</select>`) + lf('결제수단', `<select data-b="f.m">${opts(usedMethods(), f.m, '전체')}</select>`) + lf('검증상태', `<select data-b="f.st">${opts(['일치', '불일치', '미수신', '청구 전'], f.st, '전체')}</select>`),
    acts])}
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 거래 ${won(sum('cnt'))}건 · ${won(sum('amt'))}원 · 예상 수수료 ${won(sum('exp'))}원</span></h2></div>
  <div class="tw"><table class="tbl lst-table"><thead><tr><th class="l">PG사</th><th>계약번호</th><th class="l">가맹점명</th><th>MID</th><th>결제수단</th><th class="r">거래건수</th><th class="r">거래금액</th><th>수수료(VAT)</th><th class="r">예상 수수료</th><th class="r">PG 청구 수수료</th><th class="r">차액</th><th>검증상태</th><th>다운로드</th></tr></thead><tbody>
  ${page.map(x => `<tr><td class="l">${esc(pgOf(x.c).name)}</td><td class="num">${x.c.no}</td><td class="l"><a class="p4-id" href="${URLS.feeD}?mon=${x.mon}&mid=${x.m.id}">${esc(x.m.name)}</a></td><td class="mid">${esc(x.m.mid)}</td><td>${esc(x.m.method)}</td>
   <td class="r num">${x.cnt}</td><td class="r num">${won(x.amt)}</td><td>${feeTxt(x.m)} <span class="dim-t">(VAT ${x.m.vat})</span></td><td class="r num">${won(x.exp)}</td><td class="r num">${x.claim == null ? '-' : won(x.claim)}</td>
   <td class="r num">${x.claim == null ? '-' : x.claim - x.exp ? money(x.claim - x.exp) : '0'}</td><td>${badge(x.st)}</td><td><button class="btn sm" data-a="feeRowCsv" data-mon="${x.mon}" data-mid="${x.m.id}">다운로드</button></td></tr>`).join('') || '<tr><td colspan="13" class="empty">조건에 맞는 수수료 내역이 없습니다.</td></tr>'}</tbody></table></div>
  <div class="lst-bottom">${pager(rows.length, 15)}</div>`;
}
function curFee() {
  const mon = MONS.includes(QP.get('mon') || '') ? QP.get('mon') as string : '2026-10';
  const rows = feeRows(mon);
  return rows.find(x => x.m.id === QP.get('mid')) || rows[0];
}
function vFeeD() {
  const x = curFee();
  if (!x) return `${crumb(['PG 수수료 조회', '상세'])}<div class="emptybox">수수료 내역이 없습니다.</div><div class="foot"><a class="btn lg" href="${URLS.fee}">목록</a></div>`;
  const d = (a: number, b: number | null) => b == null ? '-' : b - a ? money(b - a) : '0';
  return `${crumb(['PG 수수료 조회', '상세'])}${ph(`${esc(x.m.name)} · ${esc(x.m.mid)} ${badge(x.st)}`, `<span class="dim-t">정산월 ${x.mon}</span>`)}
  ${sec('기본 정보', ft(`<tr><th>정산월</th><td>${x.mon}</td><th>PG사 / 계약번호</th><td>${esc(pgOf(x.c).name)} / <a class="p4-id" href="${URLS.ctr}?ct=${x.c.no}">${x.c.no}</a></td></tr>
   <tr><th>가맹점명</th><td>${esc(x.m.name)}</td><th>MID</th><td><a class="p4-id" href="${URLS.ctr}?ct=${x.c.no}&id=${x.m.id}">${esc(x.m.mid)}</a></td></tr>
   <tr><th>결제수단</th><td>${esc(x.m.method)}</td><th>정산주체</th><td>${esc(x.m.owner)}</td></tr>
   <tr><th>수수료 조건</th><td>${feeTxt(x.m)} <span class="dim-t">(${x.m.feeType})</span></td><th>VAT 기준</th><td>${x.m.vat}</td></tr>`))}
  ${sec('수수료 집계', `<div class="tw"><table class="tbl"><thead><tr><th class="l">항목</th><th class="r">예상 (MID 수수료 조건)</th><th class="r">PG 청구</th><th class="r">차이</th></tr></thead><tbody>
   <tr><td class="l">거래건수</td><td class="r num">${x.cnt}</td><td class="r num">${x.claim == null ? '-' : x.cnt}</td><td class="r num">${x.claim == null ? '-' : '0'}</td></tr>
   <tr><td class="l">거래금액</td><td class="r num">${won(x.amt)}</td><td class="r num">${x.claim == null ? '-' : won(x.amt)}</td><td class="r num">${x.claim == null ? '-' : '0'}</td></tr>
   <tr><td class="l">수수료</td><td class="r num">${won(x.exp)}</td><td class="r num">${x.claim == null ? '-' : won(x.claim)}</td><td class="r num">${d(x.exp, x.claim)}</td></tr></tbody></table></div>`)}
  ${sec('건별 계산 내역', ft(`<tr><th>대상 결제</th><td>${x.pays.length}건 <span class="dim-t">(${(['결제완료', '부분취소'] as PaySt[]).map(st => `${st} ${x.pays.filter(p => p.st === st).length}건`).join(' · ')})</span></td></tr>
   <tr><th>파일 항목</th><td>정산월, MID, 결제번호, 결제일시, 결제상태, 순결제금액, 수수료 조건, 예상 수수료</td></tr>`), '', `<button class="btn sm pri" data-a="feeDCsv">다운로드</button>`)}
  <div class="foot pm3h-foot"><a class="btn lg" href="${URLS.fee}">목록</a></div>`;
}

const feeDetailCsv = (x: FeeRow) => csv(`PG수수료_${x.m.mid}_${x.mon}`, ['정산월', 'MID', '결제번호', '결제일시', '결제상태', '순결제금액', '수수료 조건', '예상 수수료'], x.pays.map(p => [x.mon, x.m.mid, p.no, p.at, p.st, net(p), feeTxt(x.m), feeOf(p)]));

/* ================= 렌더 · 모달 ================= */
function ftCols(root: HTMLElement) {
  if (!document.body.classList.contains('p4d')) return;
  root.querySelectorAll('table.ft').forEach(t => {
    const tb = t as HTMLTableElement, n = Math.max(0, ...[...tb.rows].map(r => [...r.cells].reduce((a, c) => a + c.colSpan, 0)));
    if (n === 4 && !tb.querySelector('colgroup')) tb.insertAdjacentHTML('afterbegin', '<colgroup><col class="k"><col><col class="k"><col></colgroup>');
  });
}
function renderModal() {
  const r = $('#modal-root'), md = UI.modal;
  if (!md) { r.innerHTML = ''; return; }
  const f = md.type === 'cancel' ? mCancel() : md.type === 'status' ? mStatus() : mUpload();
  r.innerHTML = `<div class="dimbg" data-a="dim"><div class="mdl w5" role="dialog" aria-modal="true" aria-labelledby="mdl-t"><div class="mdl-h"><h2 id="mdl-t">${f.t}</h2><button class="x" data-a="close" aria-label="닫기">×</button></div><div class="mdl-b">${f.b}</div><div class="mdl-f">${f.f}</div></div></div>`;
}
function render() {
  const v = PAGE === 'pay' ? vPay() : PAGE === 'payD' ? vPayD() : PAGE === 'recon' ? vRecon() : PAGE === 'reconD' ? vReconD() : PAGE === 'fee' ? vFee() : vFeeD();
  $('#view').innerHTML = v; ftCols($('#view')); renderModal();
}

const A: Record<string, (el: HTMLElement) => void> = {
  search() { UI.fA = { ...UI.f }; UI.page = 1; render(); },
  reset() { UI.f = emptyF(); UI.fA = emptyF(); UI.page = 1; render(); },
  pg(el) { UI.page = Number(el.dataset.p); render(); window.scrollTo(0, 0); },
  close() { UI.modal = null; render(); },
  dim() { /* 바깥 클릭으로는 닫지 않는다 */ },
  payCsv() { csv('결제이력', ['결제번호', '승인번호', '승인일시', 'PG사', '계약번호', '결제수단', '가맹점명', 'MID', '결제금액', '취소금액', '순결제금액', '결제상태', '주문번호'],
    payRows().map(p => { const c = ctById(p.ct), m = midOf(p); return [p.no, p.appr, p.at, pgOf(c).name, c.no, p.method, m?.name, m?.mid, p.amt, p.cancel, net(p), p.st, p.ord]; })); },
  cancelOpen() { UI.modal = { type: 'cancel', kind: 'all', amt: '', why: '', err: [] }; render(); },
  cancelSave() {
    const p = payOf(QP.get('no')) || PAYS[0], md = UI.modal, rest = net(p);
    const amt = md.kind === 'all' ? rest : Number(md.amt);
    md.err = [];
    if (!(amt > 0) || amt > rest) md.err.push(`취소 금액은 1원 이상 ${won(rest)}원 이하로 입력하세요.`);
    if (md.kind === 'part' && amt === rest) md.err.push('남은 금액 전체를 취소하려면 전체 취소를 고르세요.');
    if (!md.why.trim()) md.err.push('취소 사유를 입력하세요.');
    if (md.err.length) { render(); return; }
    const d = new Date(), at = `${TODAY} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    (CANCELS[p.no] ||= []).push({ amt, at, why: md.why.trim() }); saveCancels();
    p.cancel += amt; p.st = p.amt - p.cancel <= 0 ? '승인취소' : '부분취소';
    p.logs.push({ at, by: USER, t: `${p.st} (BO · ${md.why.trim()})`, amt: -amt });
    UI.modal = null; render(); toast(`${won(amt)}원을 승인취소했습니다.`);
  },
  reconRowCsv(el) { const g = reconGroups(el.dataset.mon as string).find(x => x.pg === el.dataset.pg); if (g) csv(`거래대사_${pgOf(g.items[0].c).name}_${g.mon}`, RECON_HEAD, reconCsvRows(g.items)); },
  // 내역 다운로드: 오프라인 대사용으로 결제 건 단위까지 내려준다
  reconDCsv() { const g = curRecon(), kind: RKind = UI.tab || '승인대사';
    csv(`거래대사_${pgOf(g.items[0].c).name}_${g.mon}_${kind}`, ['대사월', '대사 구분', 'MID', '가맹점명', '결제번호', '승인일시', '입금예정일', '순결제금액', '예상 수수료', '기준 금액'],
      g.items.filter(x => x.kind === kind).flatMap(x => x.pays.map(p => [g.mon, kind, x.m.mid, x.m.name, p.no, p.at, depDay(p), net(p), feeOf(p), net(p) - (kind === '입금대사' ? feeOf(p) : 0)]))); },
  reconTab(el) { UI.tab = el.dataset.v; render(); },
  stOpen(el) { const x = curRecon().items.find(y => y.key === el.dataset.k); UI.modal = { type: 'status', k: el.dataset.k, st: x?.st === 'Pass' ? 'Fail' : 'Pass', why: '', err: [] }; render(); },
  stSave() {
    const md = UI.modal, g = curRecon(), x = g.items.find(y => y.key === md.k) as RItem;
    md.err = [...(md.st === x.st ? ['현재 상태와 같습니다. 다른 상태를 고르세요.'] : []), ...(md.why.trim() ? [] : ['사유를 입력하세요.'])];
    if (md.err.length) { render(); return; }
    const at = nowAt();
    RS.items[x.key] = { st: md.st, at, by: USER };
    RS.hist.unshift({ at, by: USER, mon: g.mon, pg: g.pg, mid: x.m.mid, kind: x.kind, before: x.st, after: md.st, why: md.why.trim() });
    saveRS(); UI.modal = null; render(); toast(`${x.m.mid} ${x.kind} 상태를 ${md.st}(으)로 바꿨습니다.`);
  },
  uploadOpen() { UI.modal = { type: 'upload', file: '', err: [] }; render(); },
  upFile(el) { const f = (el as HTMLInputElement).files?.[0]; if (UI.modal) UI.modal.file = f ? f.name : ''; },
  uploadSave() {
    const md = UI.modal, g = curRecon(), kind: RKind = UI.tab || '승인대사';
    md.err = md.file ? [] : ['업로드할 파일을 고르세요.'];
    if (md.err.length) { render(); return; }
    const at = nowAt(); RS.uploads[`${g.mon}|${g.pg}|${kind}`] = at;
    RS.hist.unshift({ at, by: USER, mon: g.mon, pg: g.pg, mid: '-', kind, before: '업로드 대기', after: '엑셀 대조', why: `파일 업로드: ${md.file}` });
    saveRS(); UI.modal = null; render();
    const it = curRecon().items.filter(x => x.kind === kind && x.mode === '엑셀 업로드');
    toast(`${kind} ${it.length}건 대조: Pass ${it.filter(x => x.st === 'Pass').length}, Fail ${it.filter(x => x.st === 'Fail').length}`);
  },
  feeRowCsv(el) { const x = feeRows(el.dataset.mon as string).find(y => y.m.id === el.dataset.mid); if (x) feeDetailCsv(x); },
  feeDCsv() { const x = curFee(); if (x) feeDetailCsv(x); },
};
const emptyF = () => PAGE === 'pay' ? emptyPayF() : PAGE === 'recon' ? emptyReconF() : emptyFeeF();

document.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
  if (!el || (el as HTMLButtonElement).disabled) return;
  if (el.dataset.a === 'dim' && e.target !== el) return;
  A[el.dataset.a as string]?.(el);
});
document.addEventListener('change', e => { const el = e.target as HTMLInputElement; if (el.dataset.b) setPath(UI, el.dataset.b, el.value); if (el.dataset.c) A[el.dataset.c]?.(el); if (el.dataset.r !== undefined) render(); });
document.addEventListener('input', e => { const el = e.target as HTMLInputElement; if (el.dataset.b && el.type !== 'radio' && el.tagName !== 'SELECT') setPath(UI, el.dataset.b, el.value); });
document.addEventListener('keydown', e => {
  const el = e.target as HTMLInputElement;
  if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); return; }
  if (e.key === 'Enter' && el.dataset.enter) { if (el.dataset.b) setPath(UI, el.dataset.b, el.value); A[el.dataset.enter]?.(el); }
});

UI.f = emptyF(); UI.fA = emptyF();
render();
