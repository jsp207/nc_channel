// @ts-nocheck
// 결제 상세 (payment-history3-detail.html?id=TX...): 프로토타입 v3의 상세 드로어 기능을 v4처럼 페이지로 옮겼다.
// 한 페이지에 PG 결제정보 / 금액정보 / 주문정보 / BSS 반영 / 거래 이력 / 담당자 표를 차례로 둔다. 처리 버튼은 맨 아래다. PG 재조회 · BSS 재반영 · 취소(V21~V25). id가 없으면 첫 거래를 보여준다(히스토리 바로가기용).
import "./admin-shell.css";
import "./payment2.css";
import "./payment3-history.css";
import { requireAuthentication } from "./auth";
import { ME, detailUrl, esc, redraw, stamp } from "./payment3-store";
import { PAGES, TX, api, badge, saveTx, txOf, won } from "./payment3-history-store";
import { toast } from "./payment3-status";

requireAuthentication();

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const tx = params.has('id') ? txOf(params.get('id')) : [...TX.txs].sort((a, b) => b.at.localeCompare(a.at))[0];
const ui = { busy: '' };
let md = null;

const log = (t2, res, bad) => tx.logs.push({ at: stamp(), by: ME, t: t2, res, bad });
const nre = () => tx.logs.filter(l => l.t.startsWith('BSS 반영 재요청')).length;
const opts = (list, v) => list.map(o => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('');

// ---------- 화면 ----------
function actions() {
  const t = tx, can = t.amount - t.cancel;
  if (ui.busy) return `<span class="dim-t">${ui.busy} 중…</span>`;
  let h = '';
  if (['결제완료', '부분취소'].includes(t.st) && can > 0) {
    const why = t.snap.method === '가상계좌' ? '가상계좌 환불 절차 확인 필요 (V24)' : t.bss === '반영대기' ? 'BSS 반영 확인 후 취소 (V23)' : '';
    h += `${why ? `<span class="dim-t" style="font-size:12px">${why}</span>` : ''}<button type="button" class="btn lg" data-a="cancel" ${why ? 'disabled' : ''} title="${why}">취소 처리</button>`;
  }
  if (t.st === '결과미확인') h += '<button type="button" class="btn lg pri" data-a="query">PG 재조회</button>';
  else if (['반영실패', '불일치'].includes(t.bss)) h += '<button type="button" class="btn lg pri" data-a="rebss">BSS 반영 재요청</button>';
  else if (t.bss === '반영대기' && t.st !== '결제실패') h += '<button type="button" class="btn lg pri" data-a="bsscheck">BSS 반영 확인</button>';
  return h;
}
// 모든 표가 같은 4칸(라벨 · 값 · 라벨 · 값)을 써서 세로줄이 맞는다
const COLS = '<colgroup><col class="pm3h-k"><col><col class="pm3h-k"><col></colgroup>';
const ft = rows => `<table class="ft pm3h-grid">${COLS}<tbody>${rows}</tbody></table>`;
const sec = (title, inner, hint = '') => `<section class="sec"><div class="sec-h"><h3>${title}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}</div>${inner}</section>`;
function sections() {
  const t = tx, s = t.snap, can = t.amount - t.cancel;
  return sec('PG 결제정보', ft(`<tr><th>결제번호</th><td class="pm3h-mono"><b>${esc(t.id)}</b></td><th>결제일시</th><td>${t.at}</td></tr>
    <tr><th>결제상태</th><td>${badge(t.st)} ${t.failMsg ? `<span style="color:var(--bad);margin-left:6px">${esc(t.failMsg)}</span>` : ''}</td><th>승인번호</th><td>${t.appr ? `<span class="pm3h-mono">${t.appr}</span>` : '<span class="dim-t">없음</span>'}</td></tr>
    <tr><th>PG</th><td>${esc(s.pg)}</td><th>MID</th><td><span class="pm3h-mono">${esc(s.mid)}</span> · ${esc(s.purpose)}</td></tr>
    <tr><th>결제수단</th><td>${esc(s.method)} · ${esc(t.detail)}</td><th>할부</th><td>${esc(t.inst)}</td></tr>
    <tr><th>PG 거래번호</th><td class="pm3h-mono">${esc(t.pgTid)}</td><th>결제수단 계약</th><td><a class="lk" href="${detailUrl(t.cid)}">${t.cid}</a> <span class="dim-t">현재 기준정보로 이동</span></td></tr>`)
    + (t.st === '결과미확인' ? '<div class="call warn"><div>PG에서 결과 응답을 받지 못했어요. PG 재조회로 결제 결과를 확정해 주세요. 확정 전에는 취소할 수 없어요. (V21)</div></div>' : ''))
  + sec('금액정보', ft(`<tr><th>결제금액</th><td class="num"><b>${won(t.amount)}원</b></td><th>취소금액</th><td class="num">${t.cancel ? `<span style="color:var(--bad)">${won(t.cancel)}원</span>` : '0원'}</td></tr>
    <tr><th>총금액</th><td class="num"><b style="color:var(--ac)">${won(t.st === '결제실패' ? 0 : can)}원</b></td><th>취소 가능 금액</th><td class="num">${['결제완료', '부분취소'].includes(t.st) ? `${won(can)}원` : '-'}</td></tr>
    <tr><th>적용 요율</th><td colspan="3">${esc(s.fee)} <span class="dim-t">(결제 시점)</span></td></tr>`)
    + '<div class="call warn"><div>금융수수료 계산 시 VAT 포함 여부, 반올림, 취소 수수료 처리 기준은 아직 정해지지 않았어요. (확인필요)</div></div>')
  + sec('주문정보', ft(`<tr><th>주문번호</th><td class="pm3h-mono">${esc(t.order)}</td><th>주문일시</th><td>${t.at}</td></tr>
    <tr><th>그룹 ID</th><td class="pm3h-mono">${esc(t.group)}</td><th>주문자</th><td>${esc(t.buyer)} <span class="dim-t">(가상)</span></td></tr>
    <tr><th>상품</th><td colspan="3">${esc(t.product)}</td></tr>
    <tr><th>주문 컨테이너</th><td>${esc(s.container)}</td><th>결제 코너</th><td>${esc(s.corner)} <span class="dim-t">(외부 도메인 참조)</span></td></tr>`))
  + sec('BSS 반영', ft(`<tr><th>반영상태</th><td>${badge(t.bss)}</td><th>재요청 횟수</th><td>${nre()}회</td></tr>
    <tr><th>BSS 금액</th><td>${t.bss === '불일치' ? `<b style="color:var(--bad)">${won(t.bssAmt)}원</b>` : t.bss === '반영완료' ? `${won(can)}원` : '-'}</td><th>PG 금액</th><td>${t.st === '결제실패' ? '-' : `${won(can)}원`}</td></tr>
    <tr><th>실패 사유</th><td colspan="3">${t.bss === '반영실패' && t.bssErr ? `<span style="color:var(--bad)">${esc(t.bssErr)}</span>` : '-'}</td></tr>`)
    + (t.bss === '불일치' ? '<div class="call warn"><div>BSS 금액과 PG 금액이 달라요. 반영 재요청을 하면 PG 금액 기준으로 다시 반영해요.</div></div>' : '')
    + (t.bss === '반영대기' && t.st !== '결과미확인' ? '<div class="call ac"><div>PG 처리 결과가 BSS에 아직 반영되지 않았어요. BSS 반영 확인을 눌러 주세요.</div></div>' : ''))
  + sec('거래 이력', `<div class="tw"><table class="tbl pm3h-grid">${COLS}<thead><tr><th class="l">일시</th><th class="l">처리자</th><th class="l">처리</th><th class="l">결과</th></tr></thead><tbody>${t.logs.slice().reverse().map(l => `<tr><td class="l num">${l.at}</td><td class="l">${esc(l.by)}</td><td class="l"><b>${esc(l.t)}</b></td><td class="l" style="${l.bad ? 'color:var(--bad)' : ''}">${esc(l.res)}</td></tr>`).join('')}</tbody></table></div>`, `${t.logs.length}건`)
  + sec('담당자', ft(`<tr><th>운영 담당</th><td><select class="sel" id="mgrOp" aria-label="운영 담당">${opts(['운영 담당 A', '운영 담당 B', '운영 담당 C'], t.mgr.op)}</select></td><th>정산 담당</th><td><select class="sel" id="mgrSettle" aria-label="정산 담당">${opts(['정산 담당 B', '정산 담당 C'], t.mgr.settle)}</select></td></tr>
    <tr><th>최근 처리자</th><td colspan="3">${t.mgr.last ? esc(t.mgr.last) : '<span class="dim-t">없음</span>'}</td></tr>`) + '<p class="desc dim-t">담당자를 바꾸면 거래 이력에 남아요.</p>');
}
function render() {
  const t = tx;
  redraw($('#view'), `<nav class="crumb" aria-label="현재 위치">홈<span aria-hidden="true">›</span>결제 관리<span aria-hidden="true">›</span>결제이력 관리<span aria-hidden="true">›</span><b>결제 상세</b></nav>
  <div class="ph"><h1 class="h1"><span class="pm3h-mono">${esc(t.id)}</span> ${badge(t.st)} ${t.bss === '-' ? '' : badge(t.bss)}</h1><span class="dim-t">주문번호 <span class="pm3h-mono">${esc(t.order)}</span></span></div>
  ${sections()}
  <div class="foot pm3h-foot"><a class="btn lg" href="${PAGES.list}" style="text-decoration:none">목록</a>${actions()}</div>`);
}

// ---------- 처리 ----------
async function txAction(a) {
  const t = tx;
  if (ui.busy) return;
  ui.busy = a === 'query' ? 'PG 재조회' : 'BSS 반영 요청';
  render();
  if (a === 'query') {
    const r = await api.pgInquiry(t);
    if (r.ok) { t.st = '결제완료'; t.appr = r.appr; t.bss = '반영대기'; log('PG 재조회', `승인 확인 · 승인번호 ${r.appr} · 결제완료로 확정`); toast('PG에서 승인을 확인했어요. BSS 반영을 확인해 주세요.'); }
    else { t.st = '결제실패'; t.failMsg = r.msg; t.bss = '-'; log('PG 재조회', `${r.msg} · 결제실패로 확정`, 1); toast('PG 승인 내역이 없어 결제실패로 확정했어요.', true); }
    t.qres = '';
  } else {
    const label = a === 'rebss' ? `BSS 반영 재요청 ${nre() + 1}회차` : 'BSS 반영 확인', r = await api.bssSync(t);
    if (r.ok) { t.bss = '반영완료'; t.bssAmt = null; log(label, `성공 · BSS 금액 ${won(t.amount - t.cancel)}`); toast('BSS 반영을 마쳤어요.'); }
    else { t.bssErr = r.msg; log(label, `실패 · ${r.msg}`, 1); toast('BSS 반영에 실패했어요. 다시 시도해 주세요.', true); }
  }
  ui.busy = ''; t.mgr.last = ME;
  saveTx(); render();
}

// ---------- 취소 모달 ----------
const root = () => $('#modal-root');
const partOk = () => tx.snap.method !== '휴대폰결제'; // 휴대폰결제 부분취소는 막아 둔다(V24)
function openCancel() { md = { type: 'all', amt: '', reason: '고객 요청', memo: '', busy: false, focus: document.activeElement }; drawCancel(); root().querySelector('.x')?.focus(); }
function closeCancel() { const f = md?.focus; md = null; root().innerHTML = ''; f?.focus?.(); }
function cancelGate() {
  const can = tx.amount - tx.cancel;
  if (md.type === 'part') {
    const n = Number(md.amt);
    if (!md.amt) return '취소 금액을 입력해 주세요.';
    if (!Number.isInteger(n) || n < 1) return '1원 이상 정수로 입력해 주세요. (V22)';
    if (n > can) return `취소 가능 금액(${won(can)}원)을 넘었어요. (V22)`;
    if (n === can) return '전액이면 전체취소를 골라 주세요. (V22)';
  }
  if (md.reason === '기타' && !md.memo.trim()) return '기타 사유를 적어 주세요.';
  return '';
}
const cancelAmt = () => (md.type === 'all' ? tx.amount - tx.cancel : Number(md.amt || 0));
function drawCancel() {
  const t = tx, can = t.amount - t.cancel, g = cancelGate();
  root().innerHTML = `<div class="dimbg"><div class="mdl w5" role="dialog" aria-modal="true" aria-labelledby="cTitle">
    <div class="mdl-h"><div><h2 id="cTitle">결제 취소</h2><span class="dim-t">${esc(t.id)} · ${esc(t.product)}</span></div><button type="button" class="x" data-a="cClose" aria-label="닫기">×</button></div>
    <div class="mdl-b">${md.busy ? '<p class="dim-t" style="text-align:center;padding:30px 0">PG에 취소를 요청하고 있어요…</p>' : `
      <div class="pm3h-box"><div><span>결제금액</span><b>${won(t.amount)}원</b></div><div><span>취소 가능 금액</span><b style="color:var(--ac)">${won(can)}원</b>${t.cancel ? `<span>이미 취소 ${won(t.cancel)}원</span>` : ''}</div></div>
      <table class="ft"><tbody>
        <tr><th class="req">취소 유형</th><td><div class="ck-g rd"><label><input type="radio" name="cType" value="all" ${md.type === 'all' ? 'checked' : ''}>전체취소</label><label class="${partOk() ? '' : 'off'}"><input type="radio" name="cType" value="part" ${md.type === 'part' ? 'checked' : ''} ${partOk() ? '' : 'disabled'}>부분취소</label></div>${partOk() ? '' : '<div class="sub">휴대폰결제는 부분취소를 막아 두었어요. (V24)</div>'}</td></tr>
        ${md.type === 'part' ? `<tr><th class="req">취소 금액</th><td><span class="unit"><input class="inp num" inputmode="numeric" id="cAmt" value="${esc(md.amt)}" aria-label="취소 금액"><em>원</em></span></td></tr>` : ''}
        <tr><th class="req">취소 사유</th><td><select class="sel" id="cReason" aria-label="취소 사유">${opts(['고객 요청', '중복 결제', '상품 문제', '기타'], md.reason)}</select></td></tr>
        <tr><th>메모</th><td><textarea class="inp" id="cMemo" maxlength="200" aria-label="메모" placeholder="${md.reason === '기타' ? '기타 사유를 적어 주세요' : '선택 입력'}">${esc(md.memo)}</textarea></td></tr>
      </tbody></table>
      <div class="call ac"><div>PG 취소가 끝나면 BSS 반영대기로 바뀌어요. BSS 반영 확인까지 마쳐 주세요.</div></div>`}</div>
    <div class="mdl-f"><span class="why" id="cWhy">${md.busy ? '' : esc(g)}</span><button type="button" class="btn" data-a="cClose" ${md.busy ? 'disabled' : ''}>닫기</button><button type="button" class="btn pri" data-a="cOk" id="cOk" ${g || md.busy ? 'disabled' : ''}>${won(cancelAmt())}원 취소 요청</button></div>
  </div></div>`;
}
function syncCancel() {
  const g = cancelGate();
  $('#cWhy').textContent = g;
  $('#cOk').disabled = !!g;
  $('#cOk').textContent = `${won(cancelAmt())}원 취소 요청`;
}
async function doCancel() {
  if (cancelGate()) return;
  const t = tx, amt = cancelAmt(), { reason, memo } = md;
  md.busy = true;
  drawCancel();
  const r = await api.pgCancel(t, amt);
  t.cancel += amt;
  t.st = t.cancel >= t.amount ? '전체취소' : '부분취소';
  t.bss = '반영대기';
  t.mgr.last = ME;
  log(t.st, `PG 취소 성공 · 취소번호 ${r.no} · ${won(amt)}원 · 사유 ${reason}${memo ? ` (${memo})` : ''}`);
  t.logs.push({ at: stamp(), by: '시스템', t: 'BSS 반영', res: '반영대기' });
  saveTx();
  closeCancel();
  render();
  toast('PG 취소가 끝났어요. BSS 반영을 확인해 주세요.');
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (e.target.classList?.contains('dimbg') && md && !md.busy) { closeCancel(); return; }
  if (!el || el.disabled || !tx) return;
  const a = el.dataset.a;
  if (a === 'query' || a === 'rebss' || a === 'bsscheck') txAction(a);
  else if (a === 'cancel') openCancel();
  else if (a === 'cClose') closeCancel();
  else if (a === 'cOk') doCancel();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'cType') { md.type = t.value; drawCancel(); root().querySelector('input[name=cType]:checked')?.focus(); }
  else if (t.id === 'cReason') { md.reason = t.value; drawCancel(); root().querySelector('#cReason')?.focus(); }
  else if (t.id === 'mgrOp' || t.id === 'mgrSettle') {
    const k = t.id === 'mgrOp' ? 'op' : 'settle', b = tx.mgr[k];
    tx.mgr[k] = t.value;
    log('담당자 변경', `${k === 'op' ? '운영' : '정산'} 담당 ${b} → ${t.value}`);
    saveTx(); render(); toast('담당자를 바꿨어요.');
  }
});
document.addEventListener('input', e => {
  if (!md) return;
  if (e.target.id === 'cAmt') { md.amt = e.target.value.replace(/[^0-9]/g, ''); e.target.value = md.amt; syncCancel(); }
  else if (e.target.id === 'cMemo') { md.memo = e.target.value; syncCancel(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && md && !md.busy) closeCancel(); });

if (tx) render();
else $('#view').innerHTML = `<div class="emptybox"><h4>거래를 찾을 수 없어요</h4><p>주소의 결제번호(${esc(params.get('id'))})를 확인해 주세요.</p><a class="btn" href="${PAGES.list}" style="text-decoration:none">목록으로</a></div>`;
