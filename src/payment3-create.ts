// @ts-nocheck
// 결제수단 등록 (payment-method3-create.html): 기존 결제수단 등록 화면처럼 한 페이지에서 PG → 결제수단 → MID → 인증키 → 계약 조건 순서로 입력한다.
// 입력 규칙은 ref/payment-admin-prototype-v3.html 신규 등록 위저드(V01~V12)를 따르고, 결제수단 · 키 확인 방식은 v4 기준이다.
import "./admin-shell.css";
import "./payment2.css";
import "./payment3-form.css";
import { requireAuthentication } from "./auth";
import { CHANNELS, DB, KEYST, ME, OWNERS, PAGES, PGS, SETTLES, TODAY, detailUrl, dupContract, esc, feeValErr, fmtFee, keyOk, log, mask, midById, midEnd, nextFeeId, periodTxt, pgOf, redraw, save, setFlash, stamp, subsOf, verifyKey } from "./payment3-store";

requireAuthentication();

const $ = s => document.querySelector(s);
const blankMid = () => ({ code: '', purpose: '', biz: '', settle: '', owner: '', chs: [], from: TODAY, to: '', keys: {}, ks: 'none', kmsg: '', kbusy: false, kerr: false });
const d = { pg: '', method: '', subs: [], mode: 'new', mid: '', nm: blankMid(), feeFrom: TODAY, feeType: 'rate', feeVal: '', status: '사용', err: [] };

const TONE = { ok: 'ok', manual: 'ac', none: 'warn', fail: 'bad' };
const ksBadge = ks => `<span class="bdg ${TONE[ks]}">${KEYST[ks]}</span>`;
const opts = (list, v, first) => (first != null ? `<option value="">${first}</option>` : '') + list.map(o => { const [val, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
const radios = (name, list, v, dis = () => false) => `<div class="ck-g rd">${list.map(o => { const [val, l] = Array.isArray(o) ? o : [o, o]; return `<label class="${dis(val) ? 'off' : ''}"><input type="radio" name="${name}" value="${esc(val)}" ${val === v ? 'checked' : ''} ${dis(val) ? 'disabled' : ''}>${esc(l)}</label>`; }).join('')}</div>`;
const picked = () => (d.mode === 'exist' ? midById(d.mid) : null);
const midInfo = () => picked() || (d.mode === 'new' ? d.nm : {});
// 키 확인 전인 기존 MID는 계약을 사용 상태로 둘 수 없다(V12)
const useBlocked = () => { const m = picked(); return !!(m && !keyOk(m)); };

// ---------- 검증 ----------
function checks() {
  const e = [], pg = pgOf(d.pg);
  if (!pg) e.push('PG를 골라 주세요.');
  if (!pg || !pg.methods.includes(d.method)) e.push('PG가 지원하는 결제수단을 골라 주세요.');
  if (d.mode === 'exist') {
    const m = picked();
    if (!m) e.push('기존 MID를 고르거나 신규 MID로 바꿔 주세요.');
    else {
      const dup = dupContract(m.id, d.method);
      if (dup) e.push(`MID + 결제수단 중복: ${m.code}에 ${d.method} 계약(${dup.id})이 이미 있어요. (V02)`);
      if (midEnd(m) < TODAY) e.push('유효기간이 끝난 MID예요.');
    }
  } else {
    const n = d.nm;
    if (!/^[A-Za-z0-9]{6,20}$/.test(n.code)) e.push('MID 코드는 영문·숫자 6~20자로 입력해 주세요.');
    else if (DB.mids.some(m => m.pg === d.pg && m.code.toUpperCase() === n.code.toUpperCase())) e.push('이 PG에 같은 MID 코드가 이미 있어요. (V01)');
    if (!(n.purpose.trim() && n.biz.trim() && n.settle && n.owner && n.chs.length)) e.push('가맹점 용도명, PG 등록 상호, 정산주체, 사업주체, 채널을 입력해 주세요.');
    if (!(n.from && (!n.to || (n.from <= n.to && n.to >= TODAY)))) e.push('유효기간은 시작일이 필수이고, 종료일을 넣으면 시작일 이후이면서 오늘 이후여야 해요. (V09)');
    if (!keyOk(n)) e.push(n.ks === 'fail' ? '인증키 확인에 실패했어요. 키를 고치고 다시 확인해 주세요. (V03)' : '인증키 유효성 확인이 필요해요. (V03)');
  }
  if (subsOf(d.method).length && !d.subs.length) e.push('세부수단을 1개 이상 골라 주세요. (V11)');
  const fe = feeValErr(d.feeType, d.feeVal);
  if (fe) e.push(`${fe} (V08)`);
  const mf = midInfo();
  if (!(d.feeFrom && d.feeFrom >= TODAY && (!mf.from || d.feeFrom >= mf.from) && d.feeFrom <= midEnd(mf))) e.push('적용시작일은 오늘 이후, MID 유효기간 안이어야 해요. (V07, V10)');
  if (d.status === '사용' && useBlocked()) e.push('키 확인 전인 MID의 계약은 사용 상태로 둘 수 없어요. (V12)');
  return e;
}

// ---------- 화면 ----------
function kstHtml() {
  const n = d.nm;
  const msg = n.kbusy ? '확인 중이에요.' : n.kmsg || '키를 넣고 유효성 확인을 눌러 주세요.';
  const cls = keyOk(n) ? 'ok' : n.ks === 'fail' || n.kerr ? 'bad' : '';
  return `${ksBadge(n.ks)}<span class="pm3-kmsg ${cls}">${esc(msg)}</span>`;
}
function midSection() {
  const pg = pgOf(d.pg), n = d.nm, m = picked(), dup = m && d.method ? dupContract(m.id, d.method) : null;
  const mids = pg ? DB.mids.filter(x => x.pg === pg.id) : [];
  const has = x => (d.method && dupContract(x.id, d.method) ? ` · ${d.method} 계약 있음` : '');
  const ready = pg && d.method;
  let rows = `<tr><th>MID 구분</th><td colspan="3">${radios('fMode', [['new', '신규 MID 등록'], ['exist', `기존 MID에 결제수단 추가 (${mids.length})`]], d.mode, () => !ready)}</td></tr>`;
  if (d.mode === 'exist') {
    rows += `<tr><th class="req">MID 선택</th><td colspan="3"><select class="sel" style="min-width:420px" id="fMid" aria-label="기존 MID">${opts(mids.map(x => [x.id, `${x.code} · ${x.purpose} (키 ${KEYST[x.ks]})${has(x)}`]), d.mid, '선택')}</select>
      ${dup ? `<div class="call bad"><div><b>중복 계약 (V02)</b><br>${esc(m.code)}(${esc(m.purpose)})에는 ${esc(d.method)} 계약 ${dup.id}가 이미 있어요. MID + 결제수단 계약은 하나만 둘 수 있어요. 요율을 바꾸려면 기존 계약에서 수수료 이력을 추가하고, 미사용 계약이면 상태를 사용으로 바꿔 주세요.<div style="margin-top:8px"><a class="btn sm" href="${detailUrl(dup.id)}" style="text-decoration:none">기존 계약 열기</a></div></div></div>` : ''}
      ${m && !dup && !keyOk(m) ? `<div class="call warn"><div>이 MID는 키가 ${KEYST[m.ks]} 상태예요. 계약은 등록되지만 키 확인 전에는 운영상태를 사용으로 둘 수 없어요. (V12)</div></div>` : ''}</td></tr>`;
    if (m) rows += `<tr><th>가맹점 용도명</th><td>${esc(m.purpose)}</td><th>PG 등록 상호</th><td>${esc(m.biz)}</td></tr>
      <tr><th>정산주체</th><td>${esc(m.settle)}</td><th>사업주체 · 채널</th><td>${esc(m.owner)} · ${esc(m.chs.join(', '))}</td></tr>
      <tr><th>유효기간</th><td>${periodTxt(m)}</td><th>인증키</th><td>${ksBadge(m.ks)} <span class="dim-t">등록된 키를 그대로 써요. 다시 입력하지 않아요. (V05)</span></td></tr>`;
  } else {
    rows += `<tr><th class="req">MID 코드</th><td><input class="inp" data-f="code" value="${esc(n.code)}" maxlength="20" placeholder="PG에서 받은 MID (영문·숫자 6~20자)" aria-label="MID 코드"><div class="pm3-err" id="eCode"></div></td><th class="req">가맹점 용도명</th><td><input class="inp wide" data-f="purpose" value="${esc(n.purpose)}" maxlength="30" placeholder="예) T우주 이용권" aria-label="가맹점 용도명"></td></tr>
      <tr><th class="req">PG 등록 상호</th><td><input class="inp wide" data-f="biz" value="${esc(n.biz)}" maxlength="40" placeholder="PG 가맹 계약서상 상호" aria-label="PG 등록 상호"></td><th class="req">정산주체</th><td><select class="sel w200" id="fSettle" aria-label="정산주체">${opts(SETTLES, n.settle, '선택')}</select></td></tr>
      <tr><th class="req">사업주체</th><td>${radios('fOwner', OWNERS, n.owner)}</td><th class="req">채널</th><td><div class="ck-g">${CHANNELS.map(c => `<label><input type="checkbox" data-ch="${esc(c)}" ${n.chs.includes(c) ? 'checked' : ''}>${esc(c)}</label>`).join('')}</div></td></tr>
      <tr><th class="req">유효기간</th><td colspan="3"><span class="rng"><input type="date" class="inp" data-f="from" value="${esc(n.from)}" aria-label="시작일">~<input type="date" class="inp" data-f="to" value="${esc(n.to)}" aria-label="종료일"></span><div class="pm3-err" id="eDate"></div></td></tr>`;
  }
  return `<section class="sec"><div class="sec-h"><h3>MID / 가맹점 용도명</h3></div><table class="ft"><tbody>${rows}</tbody></table></section>`;
}
function keySection() {
  if (d.mode !== 'new') return '';
  const pg = pgOf(d.pg), n = d.nm;
  return `<section class="sec"><div class="sec-h"><h3>인증키</h3></div>
    ${pg ? `<table class="ft"><tbody>${pg.keys.map(k => `<tr><th class="req">${esc(k.l)}</th><td><input class="inp wide" type="password" autocomplete="off" data-key="${k.k}" value="${esc(n.keys[k.k] || '')}" placeholder="${esc(k.l)} 입력" aria-label="${esc(k.l)}"></td></tr>`).join('')}
      <tr><th>유효성 확인</th><td>${pg.verify === 'manual'
        ? `<div class="pm3-keyrow"><label class="ck"><input type="checkbox" id="fManual" ${n.ks === 'manual' ? 'checked' : ''}>PG 관리자 화면에서 키를 직접 확인했어요</label><span class="pm3-kst" id="fKst">${ksBadge(n.ks)}</span></div>
      <div class="sub">${esc(pg.name)}는 검증 호출을 제공하지 않는 것으로 가정했어요. 수동 확인자와 일시를 남겨요. 키를 고치면 다시 체크해야 해요.</div>`
        : `<div class="pm3-keyrow"><button type="button" class="btn sm" data-a="verify" id="fVerify" ${n.kbusy ? 'disabled' : ''}>${n.kbusy ? '확인 중…' : n.kerr ? '재시도' : '키 유효성 확인'}</button><span class="pm3-kst" id="fKst">${kstHtml()}</span></div>
      <div class="sub">키에 FAIL이 있으면 실패, TIMEOUT이 있으면 응답 지연, 8자 미만이면 형식 오류로 응답해요(모의). 키 원문은 확인 요청에만 쓰고 저장할 때 마스킹해요.</div>`}</td></tr></tbody></table>` : '<table class="ft"><tbody><tr><th class="req">인증키</th><td><span class="dim-t">PG를 먼저 선택하세요.</span></td></tr></tbody></table>'}</section>`;
}
const errHtml = () => (d.err.length ? `<div class="call bad errbox" role="alert"><div><b>저장할 수 없어요. 아래 항목을 확인하세요.</b><ul>${d.err.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : '');
function view() {
  const pg = pgOf(d.pg);
  if (d.status === '사용' && useBlocked()) d.status = '미사용';
  return `<nav class="crumb" aria-label="현재 위치">홈<span aria-hidden="true">›</span>결제 관리<span aria-hidden="true">›</span>결제수단 기준정보 관리<span aria-hidden="true">›</span><b>결제수단 등록</b></nav>
  <div class="ph"><h1 class="h1">결제수단 등록</h1></div>
  <section class="sec"><div class="sec-h"><h3>PG</h3></div><table class="ft"><tbody><tr><th class="req">PG</th><td><select class="sel w200" id="fPg" aria-label="PG">${opts(PGS.map(p => [p.id, p.name]), d.pg, '선택')}</select></td></tr></tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>결제수단</h3></div><table class="ft"><tbody>
    <tr><th class="req">결제수단</th><td>${pg ? `${radios('fMethod', pg.methods, d.method)}<div class="sub">${esc(pg.name)}가 지원하는 결제수단만 보여요.</div>` : '<span class="dim-t">PG를 먼저 선택하세요.</span>'}</td></tr>
    ${subsOf(d.method).length ? `<tr><th class="req">세부수단</th><td><div class="ck-g">${subsOf(d.method).map(s => `<label><input type="checkbox" data-sub="${esc(s)}" ${d.subs.includes(s) ? 'checked' : ''}>${esc(s)}</label>`).join('')}</div><div class="sub">계약된 세부수단만 체크해요.</div></td></tr>` : ''}
  </tbody></table></section>
  ${midSection()}
  ${keySection()}
  <section class="sec"><div class="sec-h"><h3>계약 조건</h3></div><table class="ft"><tbody>
    <tr><th class="req">적용시작일</th><td><input type="date" class="inp" id="fFeeFrom" min="${TODAY}" value="${esc(d.feeFrom)}" aria-label="적용시작일"><div class="pm3-err" id="eFrom"></div></td></tr>
    <tr><th class="req">수수료 유형</th><td>${radios('fFeeType', [['rate', '정률(%)'], ['fixed', '정액(원)']], d.feeType)}</td></tr>
    <tr><th class="req">수수료</th><td><span class="unit"><input class="inp num" inputmode="decimal" id="fFeeVal" value="${esc(d.feeVal)}" placeholder="${d.feeType === 'rate' ? '2.20' : '300'}" aria-label="수수료"><em>${d.feeType === 'rate' ? '%' : '원 / 건'}</em></span><div class="pm3-err" id="eFee"></div></td></tr>
    <tr><th>초기 운영상태</th><td>${radios('fStatus', ['사용', '미사용'], d.status, v => v === '사용' && useBlocked())}${useBlocked() ? '<div class="sub">키 확인 전이라 사용으로 둘 수 없어요. (V12)</div>' : ''}</td></tr>
  </tbody></table></section>
  <div id="fErr">${errHtml()}</div>
  <div class="foot"><a class="btn lg" href="${PAGES.list}" style="text-decoration:none">취소</a><button type="button" class="btn lg pri" data-a="save">저장</button></div>`;
}
function live() {
  const set = (id, t) => { const el = $(id); if (el) el.textContent = t; };
  const n = d.nm, mf = midInfo();
  set('#eCode', n.code && !/^[A-Za-z0-9]{6,20}$/.test(n.code) ? '영문·숫자 6~20자로 입력해 주세요.' : n.code && DB.mids.some(m => m.pg === d.pg && m.code.toUpperCase() === n.code.toUpperCase()) ? '이 PG에 같은 MID 코드가 이미 있어요. (V01)' : '');
  set('#eDate', n.from && n.to && n.from > n.to ? '시작일이 종료일보다 늦어요.' : n.to && n.to < TODAY ? '종료일은 오늘 이후여야 해요.' : '');
  set('#eFee', d.feeVal === '' ? '' : feeValErr(d.feeType, d.feeVal));
  set('#eFrom', !d.feeFrom ? '' : d.feeFrom < TODAY ? '오늘 이전 날짜는 고를 수 없어요.' : (mf.from && d.feeFrom < mf.from) || d.feeFrom > midEnd(mf) ? 'MID 유효기간 밖이에요. (V10)' : '');
}
// 저장에 실패한 뒤에는 고친 항목이 바로 오류 목록에서 빠지게 한다
function refreshErr() {
  if (!d.err.length) return;
  d.err = checks();
  $('#fErr').innerHTML = errHtml();
}
function render() { refreshErr(); redraw($('#view'), view()); live(); }

// ---------- 인증키 확인 ----------
async function runVerify() {
  const n = d.nm, pg = pgOf(d.pg), miss = pg.keys.filter(k => !(n.keys[k.k] || '').trim());
  if (miss.length) { n.ks = 'none'; n.kerr = false; n.kmsg = `${miss.map(k => k.l).join(', ')}을(를) 입력해 주세요.`; paintKey(); return; }
  n.kbusy = true; n.kerr = false; paintKey();
  const snap = JSON.stringify(n.keys), r = await verifyKey({ ...n.keys });
  if (d.nm !== n) return; // 확인 중 PG를 바꿨다
  n.kbusy = false;
  if (JSON.stringify(n.keys) !== snap) { n.ks = 'none'; n.kmsg = '확인 중 키가 바뀌었어요. 다시 확인해 주세요.'; }
  else if (r.result === 'ok') { n.ks = 'ok'; n.kmsg = r.msg; }
  else if (r.result === 'fail') { n.ks = 'fail'; n.kmsg = r.msg; }
  else { n.ks = 'none'; n.kerr = true; n.kmsg = r.msg; }
  paintKey();
  refreshErr();
}
function paintKey() {
  const n = d.nm, b = $('#fVerify'), k = $('#fKst'), mc = $('#fManual');
  if (mc) { mc.checked = n.ks === 'manual'; if (k) k.innerHTML = ksBadge(n.ks); return; }
  if (!b || !k) return;
  b.disabled = n.kbusy;
  b.textContent = n.kbusy ? '확인 중…' : n.kerr ? '재시도' : '키 유효성 확인';
  k.innerHTML = kstHtml();
}

// ---------- 저장 ----------
function saveForm() {
  d.err = checks();
  if (d.err.length) { render(); $('.errbox')?.scrollIntoView({ block: 'center' }); return; }
  let midId = d.mid, newMid = null;
  if (d.mode === 'new') {
    const n = d.nm, keys = {};
    pgOf(d.pg).keys.forEach(k => keys[k.k] = mask(n.keys[k.k]));
    midId = `m${DB.mids.length + 1}n`;
    newMid = { id: midId, pg: d.pg, code: n.code.toUpperCase(), purpose: n.purpose.trim(), biz: n.biz.trim(), settle: n.settle, owner: n.owner, chs: [...n.chs], from: n.from, to: n.to, ops: '사용', ks: n.ks, keyAt: TODAY, keys };
    DB.mids.push(newMid);
  }
  const id = `C-${String(DB.contracts.length + 1).padStart(3, '0')}`;
  const c = { id, mid: midId, method: d.method, subs: subsOf(d.method).filter(x => d.subs.includes(x)), status: d.status, fees: [{ id: nextFeeId(), sub: '', from: d.feeFrom, type: d.feeType, val: Number(d.feeVal), at: TODAY }], upd: stamp(), by: ME };
  DB.contracts.push(c);
  log(id, `계약 등록${newMid ? ` (신규 MID ${newMid.code})` : ''} · ${fmtFee(c.fees[0])} (${d.feeFrom}~) · ${d.status}`);
  save();
  setFlash({ id, msg: `${id} 계약을 등록했어요.` });
  location.href = PAGES.list;
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  const a = e.target.closest('[data-a]');
  if (!a || a.disabled) return;
  if (a.dataset.a === 'verify') runVerify();
  if (a.dataset.a === 'save') saveForm();
});
document.addEventListener('change', e => {
  const t = e.target, n = d.nm;
  if (t.id === 'fPg') { Object.assign(d, { pg: t.value, method: '', subs: [], mode: 'new', mid: '', nm: blankMid() }); render(); }
  else if (t.name === 'fMethod') { if (d.method !== t.value) Object.assign(d, { method: t.value, mid: '', subs: subsOf(t.value).slice(0, 1) }); render(); }
  else if (t.name === 'fMode') { d.mode = t.value; d.mid = ''; render(); }
  else if (t.id === 'fMid') { d.mid = t.value; render(); }
  else if (t.id === 'fManual') { n.ks = t.checked ? 'manual' : 'none'; paintKey(); }
  else if (t.id === 'fSettle') n.settle = t.value;
  else if (t.name === 'fOwner') n.owner = t.value;
  else if (t.name === 'fFeeType') { d.feeType = t.value; d.feeVal = ''; render(); }
  else if (t.name === 'fStatus') d.status = t.value;
  else if (t.dataset.ch) n.chs = t.checked ? [...n.chs, t.dataset.ch] : n.chs.filter(x => x !== t.dataset.ch);
  else if (t.dataset.sub) d.subs = t.checked ? [...d.subs, t.dataset.sub] : d.subs.filter(x => x !== t.dataset.sub);
  refreshErr();
});
document.addEventListener('input', e => {
  const t = e.target, n = d.nm;
  if (t.dataset.f) { n[t.dataset.f] = t.value; live(); }
  else if (t.id === 'fFeeFrom') { d.feeFrom = t.value; live(); }
  else if (t.id === 'fFeeVal') { d.feeVal = t.value.trim(); live(); }
  else if (t.dataset.key) {
    n.keys[t.dataset.key] = t.value;
    // 키를 고치면 미확인으로 돌아간다(V04)
    if (n.ks !== 'none' || n.kerr) { n.ks = 'none'; n.kerr = false; n.kmsg = '키가 바뀌어 미확인으로 돌아갔어요. 다시 확인해 주세요. (V04)'; paintKey(); }
  }
  refreshErr();
});

render();
