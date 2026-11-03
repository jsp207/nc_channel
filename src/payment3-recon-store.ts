// @ts-nocheck
// 거래내역 대사관리 v0.2.1: 목록과 상세가 함께 쓰는 일대사 데이터와 규칙.
// 일대사는 MID마다 하루에 한 건씩 자동으로 쌓이고 결과는 Pass / Fail로만 남긴다(PG 데이터가 아직 없으면 대기). 상세 · 다운로드는 Fail 건만 제공한다.
// 거래(승인)대사는 결제일 기준으로 승인 내역을, 입금대사는 입금일 기준으로 입금액 · 수수료를 맞춘다. PG 자동 제공이 안 되면 대사 파일을 직접 올린다(수동). 데이터는 모두 가상값이다.
import { DB, TODAY, addDays, feeAt, midById, pgOf } from "./payment3-store";

export const PAGES = { list: 'payment-recon3.html', detail: 'payment-recon3-detail.html', tx: 'payment-history3-detail.html' };
export const recUrl = id => `${PAGES.detail}?id=${encodeURIComponent(id)}`;
export const won = n => Number(n).toLocaleString('ko-KR');
export const TYPES = [['appr', '거래(승인)대사'], ['dep', '입금대사']];
export const typeName = k => TYPES.find(t => t[0] === k)[1];
export const RESULTS = ['Pass', 'Fail', '대기'];
export const PROCS = ['미처리', '처리완료'];
export const MODES = ['자동', '수동'];
// PG별 대사 데이터 제공 방식. 자동 제공이 안 되는 PG는 운영자가 PG 관리자 화면에서 받은 파일을 올린다
export const FEED = { ini: { mode: '자동', how: 'PG API 자동 수신' }, toss: { mode: '자동', how: 'SFTP 자동 수신' }, kcp: { mode: '수동', how: '대사 파일 업로드' } };
export const KINDS = { appr: ['PG에만 있음', '내부에만 있음', '금액 불일치', '수수료 불일치'], dep: ['입금 누락', '입금액 불일치', '수수료 불일치'] };

// ---------- 샘플 데이터 ----------
const MIDS = ['MID-0001', 'MID-0002', 'MID-0003', 'MID-0005', 'MID-0006', 'MID-0007'];
const FROM = '2026-10-20', LAST = addDays(TODAY, -1);
const pad = n => String(n).padStart(2, '0');
// 수수료는 이 MID 계약 중 정률 요율을 쓴다(가상 데이터라 결제수단별로 나누지 않는다)
const rateOf = (mid, d) => { for (const c of DB.contracts.filter(x => x.mid === mid)) { const f = feeAt(c, d); if (f && f.type === 'rate') return Number(f.val); } return 2.5; };
const fee = (amt, r) => Math.round(amt * r / 100);
function seed() {
  let sd = 20261031;
  const rnd = () => { sd = (sd * 48271) % 2147483647; return sd / 2147483647; };
  const list = [];
  let txn = 0;
  for (let d = FROM; d <= LAST; d = addDays(d, 1)) {
    MIDS.forEach((mid, mi) => {
      const m = midById(mid), feed = FEED[m.pg], r = rateOf(mid, d);
      TYPES.forEach(([type]) => {
        // 입금대사는 입금일(결제일 + 2일) 기준이라 최근 이틀은 아직 없다
        if (type === 'dep' && d > addDays(LAST, -2)) return;
        const cnt = 6 + Math.floor(rnd() * 40), amt = Math.round(cnt * (12000 + rnd() * 90000) / 100) * 100, exp = fee(amt, r);
        const ymd = d.slice(2).replace(/-/g, ''), id = `${type === 'appr' ? 'RA' : 'RD'}${ymd}-${pad(mi + 1)}`;
        const rec = { id, type, date: d, base: type === 'dep' ? addDays(d, -2) : d, mid, pg: m.pg, mode: feed.mode, cnt, amt, exp, act: exp, pgCnt: cnt, pgAmt: amt, res: 'Pass', mis: [], proc: '', memo: '', file: '', recvAt: `${addDays(d, 1)} 0${4 + (mi % 3)}:${pad(10 + mi * 7)}`, by: '', doneAt: '', logs: [] };
        // 수동 PG는 최근 이틀 파일이 아직 없고, 자동 PG도 하루는 PG 데이터가 늦게 온다
        const wait = (feed.mode === '수동' && d >= addDays(LAST, type === 'dep' ? -3 : -1)) || (mid === 'MID-0006' && type === 'appr' && d === LAST);
        if (wait) { Object.assign(rec, { res: '대기', act: null, pgCnt: null, pgAmt: null, recvAt: '' }); list.push(rec); return; }
        if (feed.mode === '수동') rec.file = `KCP_${type === 'appr' ? 'APPROVAL' : 'DEPOSIT'}_${m.code}_${d.replace(/-/g, '')}.csv`;
        if (rnd() < 0.13) {
          const k = KINDS[type], n = 1 + Math.floor(rnd() * 3);
          for (let i = 0; i < n; i++) {
            const kind = k[Math.floor(rnd() * k.length)], a = Math.round((15000 + rnd() * 180000) / 100) * 100, e = fee(a, r);
            const it = { kind, tid: `TX${ymd}${7000 + ++txn}`, order: `OD${ymd}-${8000 + txn}`, at: `${rec.base} ${pad(9 + Math.floor(rnd() * 12))}:${pad(Math.floor(rnd() * 60))}:${pad(Math.floor(rnd() * 60))}`, inAmt: a, pgAmt: a, exp: e, act: e };
            if (kind === 'PG에만 있음') { it.inAmt = null; it.exp = null; rec.pgCnt += 1; rec.pgAmt += a; rec.act += e; }
            else if (kind === '내부에만 있음') { it.pgAmt = null; it.act = null; rec.pgCnt -= 1; rec.pgAmt -= a; rec.act -= e; }
            else if (kind === '입금 누락') { it.pgAmt = null; it.act = null; rec.pgAmt -= a; rec.act -= e; }
            else if (kind === '금액 불일치' || kind === '입금액 불일치') { const g = 1000 * (1 + Math.floor(rnd() * 5)); it.pgAmt = a - g; rec.pgAmt -= g; }
            else { const g = 10 * (5 + Math.floor(rnd() * 90)); it.act = e + g; rec.act += g; }
            rec.mis.push(it);
          }
          rec.res = 'Fail'; rec.proc = '미처리';
          // 앞쪽 날짜의 Fail 일부는 이미 처리를 끝냈다
          if (d < '2026-10-26' && rnd() < 0.6) Object.assign(rec, { proc: '처리완료', memo: 'PG사 확인 결과 익일 정정 반영 예정', by: '정산 담당 B', doneAt: `${addDays(d, 2)} 15:20` });
        }
        rec.logs.push({ at: rec.recvAt, by: '시스템', t: `${feed.how}`, res: rec.file || `${pgOf(m.pg).name} 대사 데이터 수신` });
        rec.logs.push({ at: rec.recvAt, by: '시스템', t: '일대사 실행', res: rec.res === 'Pass' ? 'Pass' : `Fail · 불일치 ${rec.mis.length}건`, bad: rec.res === 'Fail' });
        if (rec.proc === '처리완료') rec.logs.push({ at: rec.doneAt, by: rec.by, t: '처리완료', res: rec.memo });
        list.push(rec);
      });
    });
  }
  return { recs: list };
}
const SKEY = 'nova-payment-recon3-v1';
function load() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SKEY) || 'null');
    if (saved && Array.isArray(saved.recs)) return saved;
  } catch {}
  return seed();
}
export const RC = load();
export const saveRc = () => { try { sessionStorage.setItem(SKEY, JSON.stringify(RC)); } catch {} };
export const recOf = id => RC.recs.find(r => r.id === id);
export const diffOf = r => (r.act == null ? null : r.act - r.exp);
export { TODAY };

// 수동 대사 파일을 올리면 PG 값으로 채우고 바로 대사를 돌린다. 파일 내용은 보지 않고, 같은 대사번호면 늘 같은 결과가 나온다
export function applyFile(r, name, at, by) {
  const h = [...r.id].reduce((a, c) => a + c.charCodeAt(0), 0), r2 = r.exp / r.amt * 100;
  Object.assign(r, { file: name, recvAt: at, mode: '수동', act: r.exp, pgCnt: r.cnt, pgAmt: r.amt });
  if (h % 3 === 0) {
    const a = Math.round(r.amt / r.cnt / 100) * 100, e = fee(a, r2), ymd = r.base.slice(2).replace(/-/g, '');
    const kind = r.type === 'appr' ? 'PG에만 있음' : '입금 누락';
    r.mis = [{ kind, tid: `TX${ymd}${9000 + (h % 900)}`, order: `OD${ymd}-${9500 + (h % 400)}`, at: `${r.base} 14:${pad(h % 60)}:08`, inAmt: kind === 'PG에만 있음' ? null : a, pgAmt: kind === 'PG에만 있음' ? a : null, exp: kind === 'PG에만 있음' ? null : e, act: kind === 'PG에만 있음' ? e : null }];
    if (kind === 'PG에만 있음') { r.pgCnt += 1; r.pgAmt += a; r.act += e; } else { r.pgAmt -= a; r.act -= e; }
    r.res = 'Fail'; r.proc = '미처리';
  } else { r.mis = []; r.res = 'Pass'; r.proc = ''; }
  r.logs.push({ at, by, t: '대사 파일 업로드', res: name });
  r.logs.push({ at, by: '시스템', t: '일대사 실행', res: r.res === 'Pass' ? 'Pass' : `Fail · 불일치 ${r.mis.length}건`, bad: r.res === 'Fail' });
}

// Fail 건의 불일치 내역을 CSV로 내려받는다. 여러 건을 고르면 한 파일에 대사번호 열을 붙여 합친다
export function misCsv(recs, file) {
  const head = ['대사번호', '대사 구분', '대사일', 'PG', 'MID', '불일치 구분', '결제번호', '주문번호', '결제일시', '내부 금액', 'PG 금액', '예상수수료', '실제수수료'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = recs.flatMap(r => r.mis.map(x => [r.id, typeName(r.type), r.date, pgOf(r.pg).name, midById(r.mid).code, x.kind, x.tid, x.order, x.at, x.inAmt, x.pgAmt, x.exp, x.act]));
  const text = '﻿' + [head, ...rows].map(r => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  a.download = file;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
  return rows.length;
}
