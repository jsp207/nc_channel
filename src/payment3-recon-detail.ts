// @ts-nocheck
// 대사 상세 (payment-recon3-detail.html?id=RA...): Fail 건만 연다. 결제이력 관리 상세와 같은 스타일을 쓴다.
// 대사 정보 / 금액 정보 / 불일치 내역 / 처리 / 처리 이력 표를 차례로 두고, 버튼은 맨 아래다. id가 없으면 최근 Fail 건을 보여준다(히스토리 바로가기용).
import "./admin-shell.css";
import "./payment2.css";
import "./payment3-history.css";
import { requireAuthentication } from "./auth";
import { ME, esc, midById, pgOf, redraw, stamp } from "./payment3-store";
import { FEED, PAGES, RC, diffOf, misCsv, recOf, saveRc, typeName, won } from "./payment3-recon-store";
import { toast } from "./payment3-status";

requireAuthentication();

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const rec = params.has('id') ? recOf(params.get('id')) : RC.recs.filter(r => r.res === 'Fail').sort((a, b) => b.date.localeCompare(a.date))[0];
const ui = { memo: '', err: '' };

const TONE = { Pass: 'ok', Fail: 'bad', 대기: 'warn', 미처리: 'warn', 처리완료: 'ok' };
const badge = s => (s ? `<span class="bdg ${TONE[s]}">${esc(s)}</span>` : '');
const DASH = '<span class="dim-t">-</span>';
const money = v => (v == null ? DASH : `${won(v)}원`);
const signed = v => (v == null ? DASH : v === 0 ? '0원' : `<b style="color:${v > 0 ? 'var(--bad)' : 'var(--ac)'}">${v > 0 ? '+' : ''}${won(v)}원</b>`);

// ---------- 화면 ----------
// 정보 표는 결제이력 상세와 같은 4칸(라벨 · 값 · 라벨 · 값)이라 세로줄이 맞는다
const COLS = '<colgroup><col class="pm3h-k"><col><col class="pm3h-k"><col></colgroup>';
const ft = rows => `<table class="ft pm3h-grid">${COLS}<tbody>${rows}</tbody></table>`;
const sec = (title, inner, hint = '', tool = '') => `<section class="sec"><div class="sec-h"><h3>${title}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}${tool ? `<span class="sp"></span>${tool}` : ''}</div>${inner}</section>`;
function sections() {
  const r = rec, m = midById(r.mid), feed = FEED[r.pg], dep = r.type === 'dep', d = diffOf(r);
  const recv = r.file ? `${esc(r.file)} <span class="dim-t">(${r.mode === '수동' && feed.mode === '자동' ? 'PG 데이터 미수신으로 수동 등록' : '수동 업로드'})</span>` : esc(feed.how);
  return sec('대사 정보', ft(`<tr><th>대사번호</th><td class="pm3h-mono"><b>${esc(r.id)}</b></td><th>${dep ? '입금일' : '대사일'}</th><td>${r.date}</td></tr>
    <tr><th>대사 구분</th><td>${esc(typeName(r.type))}</td><th>대상 결제일</th><td>${r.base}</td></tr>
    <tr><th>PG</th><td>${esc(pgOf(r.pg).name)}</td><th>MID</th><td><span class="pm3h-mono">${esc(m.code)}</span> · ${esc(m.purpose)}</td></tr>
    <tr><th>대사결과</th><td>${badge(r.res)} <span class="dim-t">불일치 ${r.mis.length}건</span></td><th>처리상태</th><td>${badge(r.proc)}</td></tr>
    <tr><th>수집 방식</th><td>${esc(r.mode)}</td><th>수신 일시</th><td>${esc(r.recvAt) || DASH}</td></tr>
    <tr><th>수신 데이터</th><td colspan="3">${recv}</td></tr>`))
  + sec('금액 정보', ft(`<tr><th>거래건수</th><td class="num">${won(r.cnt)}건</td><th>PG 거래건수</th><td class="num">${r.pgCnt == null ? DASH : `${won(r.pgCnt)}건`}</td></tr>
    <tr><th>거래금액</th><td class="num"><b>${won(r.amt)}원</b></td><th>PG 거래금액</th><td class="num">${money(r.pgAmt)}</td></tr>
    <tr><th>예상수수료</th><td class="num">${won(r.exp)}원</td><th>실제수수료</th><td class="num">${money(r.act)}</td></tr>
    ${dep ? `<tr><th>입금예정금액</th><td class="num">${won(r.amt - r.exp)}원</td><th>실제입금액</th><td class="num">${r.pgAmt == null ? DASH : `<b>${won(r.pgAmt - r.act)}원</b>`}</td></tr>` : ''}
    <tr><th>차액</th><td class="num" colspan="3">${signed(d)} <span class="dim-t">(실제수수료 - 예상수수료)</span></td></tr>`))
  + sec('불일치 내역', `<div class="tw"><table class="tbl"><thead><tr><th>구분</th><th>결제번호</th><th>주문번호</th><th>결제일시</th><th class="r">내부 금액</th><th class="r">PG 금액</th><th class="r">예상수수료</th><th class="r">실제수수료</th></tr></thead>
    <tbody>${r.mis.map(x => `<tr><td><span class="bdg bad">${esc(x.kind)}</span></td><td class="pm3h-mono">${esc(x.tid)}</td><td class="pm3h-mono">${esc(x.order)}</td><td class="num">${x.at}</td><td class="r num">${x.inAmt == null ? DASH : won(x.inAmt)}</td><td class="r num">${x.pgAmt == null ? DASH : won(x.pgAmt)}</td><td class="r num">${x.exp == null ? DASH : won(x.exp)}</td><td class="r num">${x.act == null ? DASH : won(x.act)}</td></tr>`).join('')}</tbody></table></div>`,
    `${r.mis.length}건`, '<button type="button" class="btn sm" data-a="dl">불일치 내역 다운로드</button>')
  + sec('처리', r.proc === '처리완료'
    ? ft(`<tr><th>처리자</th><td>${esc(r.by)}</td><th>처리 일시</th><td>${esc(r.doneAt)}</td></tr><tr><th>처리 내용</th><td colspan="3">${esc(r.memo)}</td></tr>`)
    : ft(`<tr><th class="req">처리 내용</th><td colspan="3"><textarea class="inp" id="memo" maxlength="200" aria-label="처리 내용" placeholder="예) PG사 확인 결과 익일 정정 반영 예정">${esc(ui.memo)}</textarea>${ui.err ? `<div class="pm3h-err">${esc(ui.err)}</div>` : ''}</td></tr>`))
  + sec('처리 이력', `<div class="tw"><table class="tbl pm3h-grid">${COLS}<thead><tr><th class="l">일시</th><th class="l">처리자</th><th class="l">처리</th><th class="l">결과</th></tr></thead><tbody>${r.logs.slice().reverse().map(l => `<tr><td class="l num">${esc(l.at)}</td><td class="l">${esc(l.by)}</td><td class="l"><b>${esc(l.t)}</b></td><td class="l" style="${l.bad ? 'color:var(--bad)' : ''}">${esc(l.res)}</td></tr>`).join('')}</tbody></table></div>`, `${r.logs.length}건`);
}
function render() {
  const r = rec;
  redraw($('#view'), `<nav class="crumb" aria-label="현재 위치">홈<span aria-hidden="true">›</span>결제 관리<span aria-hidden="true">›</span>거래내역 대사관리<span aria-hidden="true">›</span><b>대사 상세</b></nav>
  <div class="ph"><h1 class="h1"><span class="pm3h-mono">${esc(r.id)}</span> ${badge(r.res)} ${badge(r.proc)}</h1><span class="dim-t">${esc(typeName(r.type))} · ${r.date}</span></div>
  ${sections()}
  <div class="foot pm3h-foot"><a class="btn lg" href="${PAGES.list}" style="text-decoration:none">목록</a><button type="button" class="btn lg" data-a="dl">불일치 내역 다운로드</button>${r.proc === '미처리' ? '<button type="button" class="btn lg pri" data-a="done">처리 완료</button>' : ''}</div>`);
}

// ---------- 처리 ----------
function done() {
  const memo = ui.memo.trim();
  if (!memo) { ui.err = '처리 내용을 입력해 주세요.'; render(); $('#memo')?.focus(); return; }
  const at = stamp();
  Object.assign(rec, { proc: '처리완료', memo, by: ME, doneAt: at });
  rec.logs.push({ at, by: ME, t: '처리완료', res: memo });
  ui.memo = ''; ui.err = '';
  saveRc(); render(); toast('처리완료로 바꿨어요.');
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a]')?.dataset.a;
  if (a === 'dl') { const n = misCsv([rec], `불일치내역_${rec.id}.csv`); toast(`불일치 내역 ${n}행을 내려받았어요.`); }
  else if (a === 'done') done();
});
document.addEventListener('input', e => { if (e.target.id === 'memo') { ui.memo = e.target.value; if (ui.err && ui.memo.trim()) { ui.err = ''; e.target.parentElement.querySelector('.pm3h-err')?.remove(); } } });

if (rec && rec.res === 'Fail') render();
else $('#view').innerHTML = rec
  ? `<div class="emptybox"><h4>Fail 건만 상세를 볼 수 있어요</h4><p>${esc(rec.id)}의 대사결과는 ${esc(rec.res)}예요.</p><a class="btn" href="${PAGES.list}" style="text-decoration:none">목록으로</a></div>`
  : `<div class="emptybox"><h4>대사 결과를 찾을 수 없어요</h4><p>주소의 대사번호(${esc(params.get('id'))})를 확인해 주세요.</p><a class="btn" href="${PAGES.list}" style="text-decoration:none">목록으로</a></div>`;
