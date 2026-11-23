// 결제관리 v0.2.3 공유 데이터: PG 관리 · 결제수단 기준정보(payment5-base.ts)와 결제 이력 · 대사 · 수수료(payment5-ops.ts)가 같은 PG사 › 계약 › 결제수단 › MID 데이터를 쓴다. 모든 데이터는 가상값이다.
import CODES from "./data/epc-codes.json";

export type Use = '사용' | '미사용';
export type Mode = 'contract' | 'own';
export type FeeType = '정률' | '정액' | '혼합';
export type Recv = 'API' | '엑셀';
// recv: PG 거래 · 입금 내역을 받는 방식. API(인증키 연동, 자동 수신) 또는 엑셀(운영자가 파일 업로드)
export interface Pg { id: string; name: string; code: string; bizNo: string; recv: Recv }
export const RECV_LABEL: Record<Recv, string> = { API: 'API 자동 수신', 엑셀: '엑셀 업로드' };
export interface Method { name: string; code: string }
export interface Mid {
  id: string; method: string; name: string; mid: string; products: string[];
  feeType: FeeType; rate: number; flat: number; vat: '별도' | '포함'; owner: string;
  accMode: Mode; bank: string; holder: string; account: string;
  reconMode: Mode; reconUrl: string; from: string; to: string; keyTail: string;
}
export interface Promo {
  id: string; name: string; type: '정률' | '정액'; value: number; min: number;
  from: string; to: string; use: Use; method: string; mid: string; products: string[]; // mid '' = 전체 MID
}
export interface Contract {
  no: string; pg: string; party: string; corpNo: string; purpose: string;
  bank: string; holder: string; account: string; reconUrl: string;
  methods: Method[]; status: Use; mids: Mid[]; promos: Promo[]; upd: string; by: string;
}
export interface Store { pgs: Pg[]; cts: Contract[]; seq: number; midSeq: number; promoSeq: number; easyAdded: [string, string][] } // easyAdded: PG 관리에서 추가한 간편결제 [이름, 코드]

export const TODAY = '2026-11-21';
export const USER = '김결제(P000010)';
// 허용 상품: EPC 코드표(src/data/epc-codes.json)의 LV2 · LV3로 고른다. 값은 'LV2 > LV3', LV2 전체면 'LV2 > 전체'
export const LV2S: string[] = CODES.lv2;
export const lv3Of = (lv2: string) => Object.entries(CODES.lv3 as Record<string, { lv2: string }>).filter(([, v]) => v.lv2 === lv2).map(([k]) => k);
export const ALL = '전체';
// 제공 결제수단 기준값: 직접 입력하지 않고 체크 박스로 고른다(오타 · 표기 불일치 방지). 원천 코드는 기준값을 따른다
export const METHOD_GROUPS: { label: string; items: [string, string][] }[] = [
  { label: '일반결제', items: [['신용카드', 'CARD'], ['휴대폰결제', 'MOBILE'], ['계좌이체', 'BANK'], ['가상계좌', 'VBANK']] },
  { label: '간편결제', items: [['카카오페이', 'KAKAOPAY'], ['네이버페이', 'NAVERPAY'], ['토스페이', 'TOSSPAY']] },
];
// 간편결제는 PG 관리 폼에서 운영자가 추가할 수 있다. 추가한 값은 기준 목록 뒤에 붙는다
export const methodGroups = () => METHOD_GROUPS.map(g => g.label === '간편결제' ? { ...g, items: [...g.items, ...D.easyAdded] } : g);
export const methodCode = (n: string) => Object.fromEntries(methodGroups().flatMap(g => g.items))[n] as string | undefined;
export const methodOrder = () => methodGroups().flatMap(g => g.items.map(([n]) => n));
// 이름 비교는 공백 · 대소문자를 무시한다 (예: '카카오 페이' = '카카오페이')
export const normName = (n: string) => n.replace(/\s+/g, '').toLowerCase();
export const URLS = { pgm: 'payment-pg5.html', pgD: 'payment-pg5-detail.html', pgForm: 'payment-pg5-form.html', base: 'payment-method5.html', ctr: 'payment-method5-detail.html',
  pay: 'payment-history5.html', payD: 'payment-history5-detail.html', recon: 'payment-recon5.html', reconD: 'payment-recon5-detail.html', fee: 'payment-fee5.html', feeD: 'payment-fee5-detail.html' };
export const KEY = 'nova-payment5-base-v5';
export const TKEY = 'nova-payment5-base-toast';

/* ================= 목업 데이터 ================= */
export function seed(): Store {
  const pgs: Pg[] = [
    { id: 'pg-ini', name: 'KG이니시스', code: 'INI', bizNo: '000-00-00001', recv: 'API' },
    { id: 'pg-kcp', name: 'NHN KCP', code: 'KCP', bizNo: '000-00-00002', recv: '엑셀' },
    { id: 'pg-tos', name: '토스페이먼츠', code: 'TOS', bizNo: '000-00-00003', recv: 'API' },
    { id: 'pg-nic', name: '나이스페이', code: 'NIC', bizNo: '000-00-00004', recv: '엑셀' },
  ];
  const M = (id: string, method: string, name: string, mid: string, products: string[], fee: [FeeType, number, number], vat: '별도' | '포함', owner: string, from: string, to: string, o: Partial<Mid> = {}): Mid =>
    ({ id, method, name, mid, products, feeType: fee[0], rate: fee[1], flat: fee[2], vat, owner, accMode: 'contract', bank: '', holder: '', account: '', reconMode: 'contract', reconUrl: '', from, to, keyTail: id.slice(-4), ...o });
  const P = (id: string, name: string, type: '정률' | '정액', value: number, min: number, from: string, to: string, method: string, mid: string, products: string[]): Promo =>
    ({ id, name, type, value, min, from, to, use: '사용', method, mid, products });
  const C = (no: string, pg: string, party: string, corpNo: string, purpose: string, bank: string, account: string, reconUrl: string, methods: [string, string][], mids: Mid[], promos: Promo[] = [], status: Use = '사용', upd = '2026-11-03 10:00'): Contract =>
    ({ no, pg, party, corpNo, purpose, bank, holder: party, account, reconUrl, methods: methods.map(([name, code]) => ({ name, code })), status, mids, promos, upd, by: USER });
  const cts: Contract[] = [
    C('PGC-000001', 'pg-ini', '에스케이텔레콤(주)', '000000-0000001', 'T멤버십 커머스 결제', '신한은행', '000-000-000001', 'https://recon.example.com/ini/membership',
      [['신용카드', 'CARD'], ['계좌이체', 'BANK'], ['휴대폰결제', 'MOBILE'], ['카카오페이', 'KAKAOPAY']],
      [M('MID-0001', '신용카드', 'T멤버십 커머스', 'INIpayTM01', ['제휴 > 쿠폰형'], ['정률', 1.5, 0], '포함', 'SKT', '2026-01-01', '2027-12-31'),
       M('MID-0007', '휴대폰결제', 'T멤버십 휴대폰결제', 'INIpayHP07', ['제휴 > 쿠폰형'], ['정률', 3.5, 0], '포함', 'SKT', '2026-01-01', '2026-12-10'),
       M('MID-0011', '카카오페이', 'T멤버십 카카오페이', 'INIpayKK11', ['제휴 > 쿠폰형'], ['정률', 2.2, 0], '포함', 'SKT', '2026-01-01', '2027-12-31',
         { accMode: 'own', bank: '우리은행', holder: '에스케이텔레콤(주)', account: '000-000-000011' })],
      [P('PR-0001', '카카오페이 3% 즉시할인', '정률', 3, 30000, '2026-11-01', '2027-01-31', '카카오페이', '', ['제휴 > 쿠폰형'])]),
    C('PGC-000002', 'pg-ini', '에스케이피에스앤마케팅(주)', '000000-0000002', 'TDS 태블릿 판매', '신한은행', '000-000-000002', 'https://recon.example.com/ini/tds',
      [['신용카드', 'CARD'], ['계좌이체', 'BANK'], ['가상계좌', 'VBANK']],
      [M('MID-0002', '신용카드', 'TDS 태블릿', 'INIpayTD02', ['기기 > 태블릿형'], ['정률', 1.9, 0], '포함', 'PS&M', '2026-03-01', '2028-02-29'),
       M('MID-0013', '계좌이체', 'TDS 태블릿 계좌이체', 'INIpayTD13', ['기기 > 태블릿형'], ['혼합', 1.0, 200], '포함', 'PS&M', '2026-03-01', '2028-02-29'),
       M('MID-0014', '가상계좌', 'TDS 태블릿 가상계좌', 'INIpayTD14', ['기기 > 태블릿형'], ['정액', 0, 250], '포함', 'PS&M', '2026-03-01', '2028-02-29')], [], '사용', '2026-09-11 10:40'),
    C('PGC-000003', 'pg-kcp', '에스케이피에스앤마케팅(주)', '000000-0000002', 'TDS 액세서리 판매', '국민은행', '000-000-000003', 'https://recon.example.com/kcp/accessory',
      [['신용카드', 'CARD'], ['계좌이체', 'BANK'], ['가상계좌', 'VBANK']],
      [M('MID-0003', '신용카드', 'TDS 액세서리', 'KCPacc0301', ['기기 > 액세서리형'], ['정률', 2.2, 0], '별도', 'PS&M', '2026-07-01', '2027-06-30'),
       M('MID-0009', '신용카드', 'TDS 액세서리 (구 계약)', 'KCPacc0201', ['기기 > 액세서리형'], ['정률', 2.4, 0], '별도', 'PS&M', '2025-07-01', '2026-06-30'),
       M('MID-0004', '가상계좌', 'TDS 액세서리 에스크로', 'KCPesc0302', ['기기 > 액세서리형'], ['정액', 0, 300], '별도', 'PS&M', '2026-07-01', '2027-06-30',
         { reconMode: 'own', reconUrl: 'https://recon.example.com/kcp/escrow' })],
      [P('PR-0002', '신용카드 액세서리 2천원 할인', '정액', 2000, 20000, '2026-12-01', '2026-12-31', '신용카드', 'KCPacc0301', ['기기 > 액세서리형'])], '사용', '2026-10-29 16:40'),
    C('PGC-000004', 'pg-tos', '에스케이엠앤서비스(주)', '000000-0000003', 'T우주 구독 정기결제', '하나은행', '000-000-000004', 'https://recon.example.com/toss/subscription',
      [['신용카드', 'CARD'], ['네이버페이', 'NAVERPAY'], ['토스페이', 'TOSSPAY']],
      [M('MID-0005', '신용카드', 'T우주 이용권', 'tosstu0401', ['범용 > 앱서비스형'], ['정률', 2.5, 0], '별도', 'M&S', '2026-02-01', ''),
       M('MID-0010', '네이버페이', 'T우주 일반', 'tosstu0402', ['범용 > 앱서비스형'], ['혼합', 1.6, 50], '별도', 'M&S', '2026-12-01', '')],
      [P('PR-0003', '신용카드 5% 즉시할인', '정률', 5, 10000, '2026-09-01', '2026-10-31', '신용카드', 'tosstu0401', ['범용 > 앱서비스형'])], '사용', '2026-10-30 11:20'),
    C('PGC-000005', 'pg-tos', '에스케이피에스앤마케팅(주)', '000000-0000002', 'T다이렉트샵 단말 판매', '하나은행', '000-000-000005', '',
      [['신용카드', 'CARD'], ['계좌이체', 'BANK']],
      [M('MID-0006', '신용카드', 'TDS 휴대폰', 'tosstd0402', ['기기 > 휴대폰형'], ['정률', 1.8, 0], '포함', 'PS&M', '2026-02-01', '')], [], '사용', '2026-09-18 17:05'),
    C('PGC-000006', 'pg-nic', '에스케이텔레콤(주)', '000000-0000001', '요금납부 신규 PG 계약 (검토 중)', '신한은행', '000-000-000006', '',
      [['신용카드', 'CARD']], [], [], '미사용', '2026-10-31 15:20'),
  ];
  return { pgs, cts, seq: 6, midSeq: 14, promoSeq: 3, easyAdded: [] };
}

/* ================= 저장 ================= */
export function load(): Store {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (s && Array.isArray(s.pgs) && Array.isArray(s.cts)) return { easyAdded: [], ...s };
  } catch { /* 저장소를 못 쓰면 목업으로 시작 */ }
  return seed();
}
export const D: Store = load();
export function save() { try { sessionStorage.setItem(KEY, JSON.stringify(D)); } catch { /* 저장 실패는 화면 동작에 영향 없음 */ } }

/* ================= 유틸 ================= */
export const $ = (s: string) => document.querySelector(s) as HTMLElement;
export const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ESC[c]);
export const pad = (n: number, l = 2) => String(n).padStart(l, '0');
export const won = (n: number) => Number(n).toLocaleString('ko-KR');
export const now = () => { const d = new Date(); return `${TODAY} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const diffDays = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const mask = (a: string) => a ? '**** ' + a.replace(/\D/g, '').slice(-4) : '-';
export const opts = (arr: (string | [string, string])[], v: string, all?: string) =>
  (all != null ? `<option value="">${esc(all)}</option>` : '') + arr.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(lab)}</option>`; }).join('');
export const radios = (path: string, arr: (string | [string, string])[], v: string, extra = '') =>
  `<div class="ck-g rd">${arr.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<label><input type="radio" name="${path}" value="${esc(val)}" data-b="${path}" data-r ${extra} ${val === v ? 'checked' : ''}>${esc(lab)}</label>`; }).join('')}</div>`;
export const checks = (path: string, all: string[], on: string[], extra = '') =>
  `<div class="ck-g">${all.map(x => `<label><input type="checkbox" data-c="arr" data-p="${path}" value="${esc(x)}" ${extra} ${on.includes(x) ? 'checked' : ''}>${esc(x)}</label>`).join('')}</div>`;
export const chips = (a: string[], cls = '') => a.length ? `<span class="p5-chips">${a.map(x => `<span class="p5-chip ${cls}">${esc(x)}</span>`).join('')}</span>` : '<span class="dim-t">-</span>';
export const TONE: Record<string, string> = { 사용: 'ok', 미사용: 'gray', 유효: 'ok', '적용 예정': 'ac', '만료 임박': 'warn', 만료: 'gray', 진행중: 'ok', 예정: 'ac', 종료: 'gray', 미등록: 'warn', '개별 입력': 'ac', '계약정보 사용': '' };
export const badge = (t: string, tone?: string) => `<span class="bdg ${tone ?? TONE[t] ?? ''}">${esc(t)}</span>`;
export const crumb = (a: string[]) => `<nav class="crumb" aria-label="현재 위치">${['홈', '결제 관리', ...a].map((c, i, all) => i === all.length - 1 ? `<b>${esc(c)}</b>` : esc(c)).join('<span aria-hidden="true">›</span>')}</nav>`;
export const ph = (title: string, right = '') => `<div class="ph"><h1 class="h1">${title}</h1><div class="ph-r">${right}</div></div>`;
export const sec = (t: string, body: string, hint = '', right = '') => `<section class="sec"><div class="sec-h"><h3>${t}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}${right ? `<span class="p5-r">${right}</span>` : ''}</div>${body}</section>`;
export const ft = (rows: string) => `<table class="ft"><tbody>${rows}</tbody></table>`;
export const lf = (l: string, c: string, cls = '') => `<span class="lf-g ${cls}"><label class="lf-l">${l}</label>${c}</span>`;
export const errBox = (e: string[]) => e.length ? `<div class="call bad errbox" role="alert"><div><b>저장할 수 없습니다. 아래 항목을 확인하세요.</b><ul>${e.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : '';

/* ================= 도메인 ================= */
export const pgOf = (c: Contract) => D.pgs.find(p => p.id === c.pg) as Pg;
export const ctOf = (no: string | null) => D.cts.find(c => c.no === no);
export const feeTxt = (m: Mid) => m.feeType === '정률' ? `${m.rate}%` : m.feeType === '정액' ? `${won(m.flat)}원/건` : `${m.rate}% + ${won(m.flat)}원/건`;
export const midAcc = (c: Contract, m: Mid) => m.accMode === 'contract' ? { bank: c.bank, holder: c.holder, account: c.account } : { bank: m.bank, holder: m.holder, account: m.account };
export const midRecon = (c: Contract, m: Mid) => m.reconMode === 'contract' ? c.reconUrl : m.reconUrl;
export function midState(m: Mid) {
  if (m.to && m.to < TODAY) return '만료';
  if (m.from > TODAY) return '적용 예정';
  if (m.to && diffDays(TODAY, m.to) <= 30) return '만료 임박';
  return '유효';
}
export const promoState = (p: Promo) => p.use === '미사용' ? '미사용' : TODAY < p.from ? '예정' : TODAY > p.to ? '종료' : '진행중';
export const promoBenefit = (p: Promo) => p.type === '정률' ? `${p.value}% 즉시할인` : `${won(p.value)}원 즉시할인`;
export const livePromos = (c: Contract) => c.promos.filter(p => promoState(p) === '진행중').length;
export const methodNames = () => [...new Set(D.cts.flatMap(c => c.methods.map(m => m.name)))];
// 프로모션 대상 상품 후보: 고른 MID의 허용 상품. 전체 MID면 그 결제수단 MID 허용 상품의 합집합
export function promoAllowed(c: Contract, method: string, mid: string) {
  const mids = c.mids.filter(m => m.method === method && (mid === '*' || m.mid === mid));
  return [...new Set(mids.flatMap(m => m.products))];
}

export function go(url: string, msg?: string) { if (msg) { try { sessionStorage.setItem(TKEY, msg); } catch { /* 토스트만 생략 */ } } location.href = url; }
export function toast(msg: string) {
  const r = $('#toast-root'); r.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span></div>`;
  clearTimeout((toast as any).t); (toast as any).t = setTimeout(() => r.innerHTML = '', 4000);
}
