// @ts-nocheck
// 결제이력 관리 v0.2.1: 목록과 상세가 함께 쓰는 거래 데이터와 규칙.
// 기능은 ref/payment-admin-prototype-v3.html SCREEN 02를 따르고, 결제수단 · MID는 기준정보(payment3-store)와 같은 값을 쓴다. 데이터는 모두 가상값이다.
import { CORNERS, DB, TODAY, addDays, conOf, esc, feeAt, fmtFee, midOf, pgOf } from "./payment3-store";

export const PAGES = { list: 'payment-history3.html', detail: 'payment-history3-detail.html' };
export const txUrl = id => `${PAGES.detail}?id=${encodeURIComponent(id)}`;
export const won = n => Number(n).toLocaleString('ko-KR');
export const PAYST = ['결제완료', '부분취소', '전체취소', '결과미확인', '결제실패'];
export const BSSST = ['반영완료', '반영대기', '반영실패', '불일치'];

export const nextAct = t => (t.st === '결과미확인' ? 'PG 재조회' : ['반영실패', '불일치'].includes(t.bss) ? 'BSS 반영 재요청' : t.bss === '반영대기' && t.st !== '결제실패' ? 'BSS 반영 확인' : '');

const TONE = { 결제완료: 'ok', 결과미확인: 'warn', 결제실패: 'bad', 부분취소: 'warn', 전체취소: 'gray', 반영완료: 'ok', 반영대기: 'ac', 반영실패: 'bad', 불일치: 'warn' };
export const badge = s => (s === '-' ? '<span class="dim-t">-</span>' : `<span class="bdg ${TONE[s] || ''}">${esc(s)}</span>`);

// ---------- 샘플 데이터 ----------
const PROD = {
  'MID-0001': [['VIP 영화 예매권', 10000], ['베이커리 교환권 1만원', 10000], ['치킨 기프티콘', 30000]],
  'MID-0002': [['갤럭시 탭 S11 256GB', 1090000], ['아이패드 에어 7세대', 690000]],
  'MID-0003': [['C타입 고속충전기 45W', 29000], ['맥세이프 무선충전 패드', 59000], ['갤럭시 버즈4 실리콘 케이스', 9900]],
  'MID-0005': [['TVING+Wavve 스탠다드', 14900], ['유튜브 프리미엄', 19900], ['디즈니+ 스탠다드', 9900]],
  'MID-0006': [['갤럭시 Z 폴드8 512GB', 1890000], ['아이폰 17 256GB', 1290000]],
  'MID-0007': [['편의점 5천원권', 5000], ['아메리카노 기프티콘', 4500]],
};
const BUYERS = ['김*수', '이*영', '박*민', '최*지', '정*호', '강*은', '조*현', '윤*아'], CARDCO = ['신한카드(가상)', 'KB국민카드(가상)', '현대카드(가상)', '삼성카드(가상)'];
const pad = n => String(n).padStart(2, '0');
function seed() {
  let sd = 20261101, n = 0, grp = 0, last = '';
  const rnd = () => { sd = (sd * 48271) % 2147483647; return sd / 2147483647; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const list = [];
  function mk(o) {
    o = { ...o, at: `${o.at}:${pad(((n + 1) * 37) % 60)}` };
    const c = conOf(o.cid), m = midOf(c), p = pgOf(m.pg), k = CORNERS.find(x => x.items.some(i => i.mid === c.mid && i.method === c.method)), f = feeAt(c, o.at.slice(0, 10));
    const d = o.at.slice(2, 10).replace(/-/g, ''), st = o.st || '결제완료', [name, price] = o.prod || pick(PROD[m.id]);
    n += 1;
    // 묶음 결제: 일부 거래는 앞 거래와 같은 그룹 ID를 쓴다
    const group = o.sameGroup && last ? last : `G-${String(++grp).padStart(3, '0')}`;
    last = group;
    const amount = o.amt || price, bss = o.bss || (st === '결제실패' ? '-' : '반영완료');
    const t = {
      id: `TX${d}${1000 + n}`, order: `OD${d}-${5000 + n}`, group, at: o.at, cid: c.id, amount, cancel: o.cancel || 0, st, bss, bssAmt: o.bssAmt || null, bssErr: o.bssErr || '', product: `${name}(가상)`, buyer: pick(BUYERS),
      pgTid: `${p.id.toUpperCase()}-DEMO-${70000 + n * 37}`, appr: ['결제실패', '결과미확인'].includes(st) ? '' : String(100000 + Math.floor(rnd() * 899999)),
      detail: c.method === '신용카드' ? pick(CARDCO) : c.subs[0] || (c.method === '계좌이체' ? '은행 계좌(가상)' : c.method === '가상계좌' ? '가상계좌 입금(가상)' : '휴대폰 소액결제(가상)'),
      inst: c.method === '신용카드' && amount >= 300000 ? '12개월' : '일시불', failMsg: o.failMsg || '', qres: o.qres || '', bssFailOnce: !!o.bssFailOnce,
      snap: { container: k ? k.where : '-', corner: k ? `${k.id} ${k.name}` : '-', pgId: p.id, pg: p.name, mid: m.code, purpose: m.purpose, method: c.method, fee: f ? fmtFee(f) : '-' },
      logs: [{ at: o.at, by: '시스템', t: '결제 요청', res: `${p.name} 승인 요청` }], mgr: { op: '운영 담당 A', settle: '정산 담당 B', last: '' },
    };
    const L = (t2, res, bad) => t.logs.push({ at: o.at, by: '시스템', t: t2, res, bad });
    if (['결제완료', '부분취소', '전체취소'].includes(st)) L('PG 승인', `승인번호 ${t.appr}`);
    if (st === '결과미확인') L('PG 응답', '응답 시간 초과. 결과 미확인', 1);
    if (st === '결제실패') L('PG 승인 실패', o.failMsg, 1);
    if (bss === '반영완료') L('BSS 반영', '반영완료');
    if (bss === '반영실패') L('BSS 반영', `실패 · ${t.bssErr}`, 1);
    if (bss === '불일치') L('BSS 반영', `불일치 · BSS ${won(t.bssAmt)} / PG ${won(amount)}`, 1);
    if (o.cancel) t.logs.push({ at: `${addDays(o.at.slice(0, 10), 1)} 10:12`, by: '운영 담당 B', t: st, res: `PG 취소 성공 · ${won(o.cancel)} · BSS 반영완료` });
    list.push(t);
  }
  const CS = ['C-001', 'C-001', 'C-002', 'C-003', 'C-005', 'C-006', 'C-007', 'C-008', 'C-008', 'C-009', 'C-010', 'C-012', 'C-013', 'C-014', 'C-016', 'C-016', 'C-017', 'C-019', 'C-020'];
  for (let i = 0; i < 30; i++) mk({ cid: CS[i % CS.length], at: `2026-10-${pad(1 + Math.floor(rnd() * 28))} ${pad(9 + Math.floor(rnd() * 12))}:${pad(Math.floor(rnd() * 60))}`, sameGroup: i % 6 === 5 });
  mk({ cid: 'C-012', at: '2026-11-01 09:42', st: '결과미확인', bss: '반영대기', qres: 'ok', prod: ['유튜브 프리미엄', 19900] });
  mk({ cid: 'C-010', at: '2026-11-01 08:15', st: '결과미확인', bss: '반영대기', qres: 'none', prod: ['C타입 고속충전기 45W', 29000] });
  mk({ cid: 'C-016', at: '2026-10-31 21:05', bss: '반영실패', bssErr: 'BSS 응답 시간 초과', bssFailOnce: true, prod: ['갤럭시 Z 폴드8 512GB', 1890000] });
  mk({ cid: 'C-020', at: '2026-10-31 18:30', bss: '불일치', bssAmt: 4500, prod: ['편의점 5천원권', 5000] });
  mk({ cid: 'C-013', at: '2026-10-31 11:20', bss: '반영대기', prod: ['유튜브 프리미엄', 19900] });
  mk({ cid: 'C-001', at: '2026-10-30 13:10', st: '부분취소', cancel: 10000, prod: ['치킨 기프티콘', 30000] });
  mk({ cid: 'C-009', at: '2026-10-29 11:00', st: '전체취소', cancel: 59000, prod: ['맥세이프 무선충전 패드', 59000] });
  mk({ cid: 'C-016', at: '2026-10-29 10:20', st: '결제실패', failMsg: '카드 한도 초과', prod: ['아이폰 17 256GB', 1290000] });
  mk({ cid: 'C-007', at: '2026-10-28 15:00', prod: ['아이패드 에어 7세대', 690000] });
  return { txs: list };
}
const SKEY = 'nova-payment-history3-v3';
function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
    if (saved && Array.isArray(saved.txs)) return saved;
  } catch {}
  return seed();
}
export const TX = load();
export const saveTx = () => { try { sessionStorage.setItem(SKEY, JSON.stringify(TX)); } catch {} };
export const txOf = id => TX.txs.find(t => t.id === id);
export { TODAY };

// TODO POST /payment/transactions/{id}/pg-inquiry | /bss-sync | /cancel
const wait = ms => new Promise(r => setTimeout(r, ms));
export const api = {
  pgInquiry: async t => { await wait(900); return t.qres === 'ok' ? { ok: true, appr: String(400000 + t.amount % 99999) } : { ok: false, msg: 'PG 승인 내역 없음' }; },
  bssSync: async t => { await wait(900); if (t.bssFailOnce) { t.bssFailOnce = false; return { ok: false, msg: 'BSS 응답 시간 초과' }; } return { ok: true }; },
  pgCancel: async (t, amt) => { await wait(1000); return { ok: true, no: `CX${String(t.amount + amt).slice(-6)}` }; },
};
