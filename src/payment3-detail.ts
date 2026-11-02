// @ts-nocheck
// 결제수단 계약 상세 (payment-method3-detail.html?id=C-1001&tab=fee): 프로토타입의 상세 드로어 내용을 기존 상세 화면처럼 페이지로 옮겼다.
// 탭: 기본 정보 / 수수료 이력 / 프로모션 / 연결 코너 / 변경 이력. id가 없으면 첫 계약을 보여준다(히스토리 바로가기용).
import "./admin-shell.css";
import "./payment2.css";
import "./payment3-form.css";
import { requireAuthentication } from "./auth";
import { CHANNELS, DB, KEYST, ME, OWNERS, PAGES, PROMO_SRC, SETTLES, TODAY, addDays, conOf, cornersOf, curFee, curSubFees, detailUrl, diffDays, dupContract, esc, expSoon, feeRowErr, feeState, feesSorted, fmtFee, keyOk, livePromos, log, mask, midById, midEnd, midOf, nextFee, nextFeeId, periodTxt, pgOf, promoSrcKey, promoSt, promosOf, redraw, save, stamp, subsOf, verifyKey } from "./payment3-store";
import { openStatus, toast } from "./payment3-status";

requireAuthentication();

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const TABS = ['base', 'fee', 'promo', 'corner', 'audit'];
const con = params.has('id') ? conOf(params.get('id')) : DB.contracts[0];
const ui = { tab: TABS.includes(params.get('tab')) ? params.get('tab') : 'base', edit: false, draft: null, feeForm: null, feeEditId: null, feeEdit: null, block: '', err: [], promoF: '', psBusy: false };

const TONE = { 사용: 'ok', 일시중지: 'warn', 미사용: 'gray', ok: 'ok', manual: 'ac', none: 'warn', fail: 'bad', cur: 'ok', sched: 'ac', end: 'gray', 진행중: 'ok', 예정: 'ac', 종료: 'gray', 신규: 'ac', 변경: 'warn', 유지: 'gray' };
const opBadge = s => `<span class="bdg ${TONE[s]}">${s}</span>`;
const ksBadge = ks => `<span class="bdg ${TONE[ks]}">${KEYST[ks]}</span>`;
const fsBadge = s => `<span class="bdg ${TONE[s]}">${{ sched: '적용예정', cur: '적용중', end: '종료' }[s]}</span>`;
const opts = (list, v) => list.map(o => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('');
const checks = (attr, list, on) => `<div class="ck-g">${list.map(x => `<label><input type="checkbox" ${attr}="${esc(x)}" ${on.includes(x) ? 'checked' : ''}>${esc(x)}</label>`).join('')}</div>`;
const feeTypeRadios = (name, v) => `<div class="ck-g rd"><label><input type="radio" name="${name}" value="rate" ${v === 'rate' ? 'checked' : ''}>정률(%)</label><label><input type="radio" name="${name}" value="fixed" ${v === 'fixed' ? 'checked' : ''}>정액(원)</label></div>`;
const dirty = () => ui.edit || ui.feeEditId || ui.feeForm?.touched;

// ---------- 기본 정보 ----------
function baseView(c, m, p) {
  const same = DB.contracts.filter(x => x.mid === m.id), cf = curFee(c), nf = nextFee(c), sf = curSubFees(c);
  return `<section class="sec"><div class="sec-h"><h3>MID 정보</h3><span class="hint">같은 MID의 계약 ${same.length}건에 공통이에요.</span><span class="sp"></span><button type="button" class="btn sm" data-a="status">상태 변경</button><button type="button" class="btn sm pri" data-a="edit">수정</button></div>
    <table class="ft"><tbody>
      <tr><th>PG</th><td>${esc(p.name)}</td><th>MID</th><td class="pm3-mono">${esc(m.code)} <span class="dim-t">(변경 불가)</span></td></tr>
      <tr><th>가맹점 용도명</th><td>${esc(m.purpose)}</td><th>PG 등록 상호</th><td>${esc(m.biz)}</td></tr>
      <tr><th>정산주체</th><td>${esc(m.settle)}</td><th>사업주체 · 채널</th><td>${esc(m.owner)} · ${esc(m.chs.join(', '))}</td></tr>
      <tr><th>유효기간</th><td colspan="3">${periodTxt(m)} ${expSoon(m) ? `<span class="bdg warn">만료 D-${diffDays(TODAY, m.to)}</span>` : ''}</td></tr>
      <tr><th>인증키</th><td colspan="3">${p.keys.map(k => `<div class="pm3-keyline"><span>${esc(k.l)}</span><span class="pm3-mono">${esc(m.keys[k.k] || '')}</span></div>`).join('')}<div class="pm3-keyrow">${ksBadge(m.ks)}<span class="dim-t">${m.keyAt ? `마지막 확인 ${m.keyAt}` : '확인 이력 없음'}</span></div></td></tr>
      <tr><th>이 MID의 계약</th><td colspan="3"><div class="pm3-cps">${same.map(x => `<a class="pm3-cp ${x.id === c.id ? 'on' : ''}" href="${detailUrl(x.id)}" data-leave>${esc(x.method)} · ${x.status}</a>`).join('')}</div></td></tr>
    </tbody></table>
    ${!keyOk(m) ? `<div class="call ${m.ks === 'fail' ? 'bad' : 'warn'}"><div>키가 <b>${KEYST[m.ks]}</b> 상태예요. 키를 확인하기 전에는 이 MID의 계약을 사용으로 바꿀 수 없어요. 수정에서 키를 바꾸고 유효성 확인을 진행해 주세요.</div></div>` : ''}</section>
  <section class="sec"><div class="sec-h"><h3>계약 정보</h3><span class="hint">MID 코드, PG, 결제수단은 계약 식별값이라 바꿀 수 없어요.</span></div>
    <table class="ft"><tbody>
      <tr><th>계약 ID</th><td class="pm3-mono">${c.id}</td><th>결제수단</th><td>${esc(c.method)}</td></tr>
      <tr><th>세부수단</th><td colspan="3">${c.subs.length ? `<div class="pm3-cps">${c.subs.map(s => `<span class="pm3-cp">${esc(s)}</span>`).join('')}</div>` : '<span class="dim-t">-</span>'}</td></tr>
      <tr><th>현재 수수료</th><td colspan="3">${cf ? fmtFee(cf) : '<span class="dim-t">없음</span>'}${sf.map(f => ` <span class="dim-t">· ${esc(f.sub)} ${fmtFee(f)}</span>`).join('')} ${nf ? `<span class="bdg ac">예정 ${fmtFee(nf)} · ${nf.from}~</span>` : ''}</td></tr>
      <tr><th>운영상태</th><td>${opBadge(c.status)}</td><th>최종 수정</th><td>${c.upd} / ${esc(c.by)}</td></tr>
    </tbody></table></section>`;
}
function kstHtml() {
  const d = ui.draft;
  const cls = keyOk(d) ? 'ok' : d.ks === 'fail' || d.kerr ? 'bad' : '';
  return d.kbusy ? '<span class="bdg gray">확인 중</span>' : `${ksBadge(d.ks)}<span class="pm3-kmsg ${cls}">${esc(d.kmsg || '새 키를 넣고 확인해 주세요.')}</span>`;
}
function baseEdit(c, m, p) {
  const d = ui.draft, same = DB.contracts.filter(x => x.mid === m.id).length;
  return `<section class="sec"><div class="sec-h"><h3>MID 정보 수정</h3>${same > 1 ? `<span class="bdg warn">같은 MID 계약 ${same}건에 함께 반영돼요</span>` : ''}</div>
    <table class="ft"><tbody>
      <tr><th>PG</th><td>${esc(p.name)}</td><th>MID</th><td class="pm3-mono">${esc(m.code)} <span class="dim-t">(변경 불가)</span></td></tr>
      <tr><th class="req">가맹점 용도명</th><td><input class="inp wide" data-d="purpose" value="${esc(d.purpose)}" maxlength="30" aria-label="가맹점 용도명"></td><th class="req">PG 등록 상호</th><td><input class="inp wide" data-d="biz" value="${esc(d.biz)}" maxlength="40" aria-label="PG 등록 상호"></td></tr>
      <tr><th class="req">정산주체</th><td><select class="sel w200" data-d="settle" aria-label="정산주체">${opts(SETTLES, d.settle)}</select></td><th class="req">사업주체</th><td><select class="sel" data-d="owner" aria-label="사업주체">${opts(OWNERS, d.owner)}</select></td></tr>
      <tr><th class="req">채널</th><td colspan="3">${checks('data-ch', CHANNELS, d.chs)}</td></tr>
      <tr><th class="req">유효기간</th><td colspan="3"><span class="rng"><input type="date" class="inp" data-d="from" value="${esc(d.from)}" aria-label="시작일">~<input type="date" class="inp" data-d="to" value="${esc(d.to)}" aria-label="종료일"></span></td></tr>
      <tr><th>인증키</th><td colspan="3">${d.keyChange
        ? `${p.keys.map(k => `<div style="margin-bottom:6px"><input class="inp wide" type="password" autocomplete="off" data-key="${k.k}" value="${esc(d.keys[k.k] || '')}" placeholder="새 ${esc(k.l)}" aria-label="새 ${esc(k.l)}"></div>`).join('')}
           <div class="pm3-keyrow">${p.verify === 'manual'
             ? `<label class="ck"><input type="checkbox" id="dManual" ${d.ks === 'manual' ? 'checked' : ''}>PG 관리자 화면에서 키를 직접 확인했어요</label><span class="pm3-kst" id="dKst">${ksBadge(d.ks)}</span>`
             : `<button type="button" class="btn sm" data-a="verify" id="dVerify" ${d.kbusy ? 'disabled' : ''}>${d.kbusy ? '확인 중…' : d.kerr ? '재시도' : '키 유효성 확인'}</button><span class="pm3-kst" id="dKst">${kstHtml()}</span>`}<button type="button" class="btn sm" data-a="keyCancel">키 변경 취소</button></div>`
        : `<div class="pm3-keyrow"><span class="pm3-mono">${p.keys.map(k => esc(m.keys[k.k])).join(' / ')}</span><button type="button" class="btn sm" data-a="keyOpen">키 변경</button></div><div class="sub">키를 바꾸면 미확인으로 돌아가고, 저장 전에 다시 확인해야 해요.</div>`}</td></tr>
    </tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>계약 정보 수정</h3><span class="hint">수수료는 수수료 이력 탭에서, 운영상태는 상태 변경에서 바꿔요.</span></div>
    ${subsOf(c.method).length ? `<table class="ft"><tbody><tr><th class="req">세부수단</th><td>${checks('data-sub', subsOf(c.method), d.subs)}</td></tr></tbody></table>` : `<p class="desc dim-t">${esc(c.method)}는 세부수단을 계약하지 않아요.</p>`}</section>
  ${ui.err.length ? `<div class="call bad errbox" role="alert"><div><b>저장할 수 없어요. 아래 항목을 확인하세요.</b><ul>${ui.err.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : ''}
  <div class="foot" style="margin-top:24px"><button type="button" class="btn" data-a="editCancel">취소</button><button type="button" class="btn pri" data-a="editSave">저장</button></div>`;
}
function startEdit(c, m) {
  ui.edit = true; ui.err = [];
  ui.draft = { purpose: m.purpose, biz: m.biz, settle: m.settle, owner: m.owner, chs: [...m.chs], from: m.from, to: m.to, subs: [...c.subs], keyChange: false, keys: {}, ks: 'none', kmsg: '', kbusy: false, kerr: false };
}
function saveEdit(c, m, p) {
  const d = ui.draft, errs = [];
  if (!d.purpose.trim() || !d.biz.trim()) errs.push('용도명과 PG 등록 상호는 필수예요.');
  if (!d.chs.length) errs.push('채널을 1개 이상 골라 주세요.');
  if (!d.from || (d.to && d.from > d.to)) errs.push('유효기간 시작일이 없거나 종료일보다 늦어요. (V09)');
  else if (d.to && d.to < TODAY) errs.push('유효기간 종료일은 오늘 이후여야 해요. (V09)');
  if (subsOf(c.method).length && !d.subs.length) errs.push('세부수단을 1개 이상 골라 주세요. (V11)');
  if (DB.contracts.filter(x => x.mid === m.id).some(x => x.fees.some(f => f.from > TODAY && (f.from < d.from || f.from > midEnd(d))))) errs.push('적용 예정 요율의 시작일이 바뀐 유효기간 밖으로 나가요. (V10)');
  if (d.keyChange && !keyOk(d)) errs.push(d.ks === 'fail' ? '키 확인에 실패했어요. 키를 고치고 다시 확인해 주세요. (V03)' : '바꾼 키의 유효성 확인이 필요해요. (V03, V04)');
  ui.err = errs;
  if (errs.length) { render(); $('.errbox')?.scrollIntoView({ block: 'center' }); return; }
  const ch = [];
  ['purpose', 'biz', 'settle', 'owner', 'from', 'to'].forEach(k => { if (m[k] !== d[k]) ch.push(k); });
  if ([...d.chs].sort().join() !== [...m.chs].sort().join()) ch.push('chs');
  Object.assign(m, { purpose: d.purpose.trim(), biz: d.biz.trim(), settle: d.settle, owner: d.owner, from: d.from, to: d.to, chs: [...d.chs] });
  if (d.keyChange) {
    const k = {};
    p.keys.forEach(x => k[x.k] = mask(d.keys[x.k]));
    m.keys = k; m.ks = d.ks; m.keyAt = TODAY; ch.push('key');
  }
  const nextSubs = subsOf(c.method).filter(x => d.subs.includes(x)), subCh = nextSubs.join() !== c.subs.join();
  c.subs = nextSubs;
  const lab = { purpose: '용도명', biz: '상호', settle: '정산주체', owner: '사업주체', from: '유효기간', to: '유효기간', chs: '채널', key: '인증키(재확인 완료)' };
  const txt = [...new Set(ch.map(k => lab[k]))].concat(subCh ? ['세부수단'] : []);
  ui.edit = false; ui.draft = null;
  if (!txt.length) { render(); toast('바뀐 내용이 없어요.'); return; }
  DB.contracts.filter(x => x.mid === m.id).forEach(x => {
    if (x.id === c.id || ch.length) { x.upd = stamp(); x.by = ME; log(x.id, `수정 · ${txt.join(', ')}${x.id !== c.id ? ' (같은 MID 공통 반영)' : ''}`); }
  });
  save(); render(); toast('저장했어요.');
}
async function runVerify(m, p) {
  const d = ui.draft, miss = p.keys.filter(k => !(d.keys[k.k] || '').trim());
  if (miss.length) { d.kmsg = `${miss.map(k => k.l).join(', ')}을(를) 입력해 주세요.`; paintKey(); return; }
  d.kbusy = true; d.kerr = false; paintKey();
  const snap = JSON.stringify(d.keys), r = await verifyKey({ ...d.keys });
  if (ui.draft !== d) return; // 확인 중 수정을 취소했다
  d.kbusy = false;
  if (JSON.stringify(d.keys) !== snap) { d.ks = 'none'; d.kmsg = '확인 중 키가 바뀌었어요.'; }
  else if (r.result === 'ok') { d.ks = 'ok'; d.kmsg = r.msg; }
  else if (r.result === 'fail') { d.ks = 'fail'; d.kmsg = r.msg; }
  else { d.ks = 'none'; d.kerr = true; d.kmsg = r.msg; }
  paintKey();
}
function paintKey() {
  const d = ui.draft, b = $('#dVerify'), k = $('#dKst'), mc = $('#dManual');
  if (d && mc) { mc.checked = d.ks === 'manual'; if (k) k.innerHTML = ksBadge(d.ks); return; }
  if (!d || !b || !k) return;
  b.disabled = d.kbusy;
  b.textContent = d.kbusy ? '확인 중…' : d.kerr ? '재시도' : '키 유효성 확인';
  k.innerHTML = kstHtml();
}

// ---------- 수수료 이력 ----------
function feeView(c, m) {
  const rows = feesSorted(c);
  const latestOf = sub => rows.filter(x => (x.sub || '') === sub).pop();
  const subOpts = (v) => ['', ...c.subs].map(s => `<option value="${esc(s)}" ${s === v ? 'selected' : ''}>${esc(s || '기본')}</option>`).join('');
  const editRow = fe => `<tr><td colspan="7" style="padding:12px;background:var(--th)"><table class="ft"><tbody>
      <tr><th class="req">적용시작일</th><td><input type="date" class="inp" data-fe="from" value="${esc(fe.from)}" min="${addDays(TODAY, 1)}" aria-label="적용시작일"></td></tr>
      <tr><th class="req">유형</th><td>${feeTypeRadios('feType', fe.type)}</td></tr>
      <tr><th class="req">수수료</th><td><span class="unit"><input class="inp num" inputmode="decimal" data-fe="val" value="${esc(fe.val)}" aria-label="수수료"><em>${fe.type === 'rate' ? '%' : '원 / 건'}</em></span><div class="pm3-err" id="feErr"></div></td></tr>
    </tbody></table><div class="foot" style="margin-top:10px"><button type="button" class="btn sm" data-a="feEditCancel">취소</button><button type="button" class="btn sm pri" data-a="feEditSave">저장</button></div></td></tr>`;
  const row = f => {
    if (ui.feeEditId === f.id) return editRow(ui.feeEdit);
    const s = feeState(c, f), nx = rows.find(x => (x.sub || '') === (f.sub || '') && x.from > f.from);
    return `<tr class="${s}"><td>${esc(f.sub || '기본')}</td><td class="num">${f.from}</td><td class="num">${nx ? addDays(nx.from, -1) : '-'}</td><td><b>${fmtFee(f)}</b></td><td>${fsBadge(s)}</td><td class="num">${f.at || f.from}</td>
      <td class="acts">${s === 'sched' ? `<button type="button" class="lk" data-a="feEdit" data-fid="${f.id}">수정</button><button type="button" class="lk dng" data-a="feDel" data-fid="${f.id}">삭제</button>` : `<span class="lock">잠김</span><button type="button" class="lk" data-a="feLocked" data-fid="${f.id}">수정</button>`}</td></tr>`;
  };
  const ff = ui.feeForm;
  return `${ui.block ? `<div class="call bad"><div><b>직접 수정할 수 없어요 (V06)</b><br>${esc(ui.block)}</div></div>` : ''}
    <div class="call">적용 시작된 요율은 잠겨 있어요. 요율을 바꾸려면 새 적용시작일로 이력을 추가해 주세요. 결제 건에는 결제 시점 요율이 Snapshot으로 남아요.</div>
    <div class="tw"><table class="tbl"><thead><tr><th>적용 대상</th><th>적용시작일</th><th>적용종료일</th><th>수수료</th><th>상태</th><th>등록일</th><th>관리</th></tr></thead><tbody>${rows.map(row).join('')}</tbody></table></div>
    <p class="desc dim-t">적용 대상마다 한 시점에 적용되는 요율은 하나예요. 다음 이력 시작 전날이 이전 이력의 종료일이에요.</p>
    <section class="sec"><div class="sec-h"><h3>새 이력 추가</h3></div>${ff ? `<table class="ft"><tbody>
      ${c.subs.length ? `<tr><th>적용 대상</th><td><select class="sel w200" id="ffSub" aria-label="적용 대상">${subOpts(ff.sub)}</select></td></tr>` : ''}
      <tr><th class="req">적용시작일</th><td><input type="date" class="inp" data-ff="from" value="${esc(ff.from)}" min="${addDays(TODAY, 1)}" aria-label="적용시작일"><span class="help">내일 이후, 최신 이력(${latestOf(ff.sub)?.from || '-'})보다 뒤 · MID 유효기간 ${periodTxt(m)}</span></td></tr>
      <tr><th class="req">수수료 유형</th><td>${feeTypeRadios('ffType', ff.type)}</td></tr>
      <tr><th class="req">수수료</th><td><span class="unit"><input class="inp num" inputmode="decimal" data-ff="val" value="${esc(ff.val)}" aria-label="수수료"><em>${ff.type === 'rate' ? '%' : '원 / 건'}</em></span><span class="help">VAT 포함 여부와 반올림 기준은 확인이 필요해요.</span><div class="pm3-err" id="ffErr"></div></td></tr>
    </tbody></table><div class="foot" style="margin-top:12px"><button type="button" class="btn" data-a="ffCancel">취소</button><button type="button" class="btn pri" data-a="ffSave">이력 추가</button></div>` : '<button type="button" class="btn" data-a="ffOpen">+ 새 적용시작일로 이력 추가</button>'}</section>`;
}
const defaultFrom = (c, sub = '') => { const l = feesSorted(c).filter(x => (x.sub || '') === sub).pop(); return addDays(l && l.from > TODAY ? l.from : TODAY, 1); };

// ---------- 프로모션 ----------
// PG·결제사 피드에서 받은 건을 그대로 보여준다(읽기 전용, V15). [지금 다시 받기]로 수동 재수신만 한다
const PROMO_ORDER = ['진행중', '예정', '종료'];
function promoView(c, m, pr) {
  const src = promoSrcKey(c), sy = DB.psync[src], pf = ui.promoF, p = pgOf(m.pg);
  const list = pr.filter(x => !pf || promoSt(x) === pf).sort((a, b) => PROMO_ORDER.indexOf(promoSt(a)) - PROMO_ORDER.indexOf(promoSt(b)) || a.from.localeCompare(b.from));
  const cnt = k => pr.filter(x => promoSt(x) === k).length;
  const pb = (t, tone) => `<span class="bdg ${tone ?? TONE[t] ?? ''}">${esc(t)}</span>`;
  return `<section class="sec"><div class="sec-h"><h3>프로모션 수신 현황</h3><span class="hint">PG·결제사가 보내는 프로모션을 주기적으로 받아 결제수단 계약에 연결해요. BO에서 내용을 고치지 않아요.</span><span class="sp"></span><button type="button" class="btn sm" data-a="promoSync" ${ui.psBusy ? 'disabled' : ''}>${ui.psBusy ? '받는 중…' : '지금 다시 받기'}</button></div>
    <table class="ft"><tbody>
      <tr><th>수신 원천</th><td>${esc(PROMO_SRC[src])}</td><th>수신 주기</th><td>매일 06:00 <span class="dim-t">(가정, 확인필요)</span></td></tr>
      <tr><th>최근 수신</th><td>${sy.last} ${pb(sy.res, sy.res === '성공' ? 'ok' : 'warn')}</td><th>다음 수신 예정</th><td>${sy.next}</td></tr>
      <tr><th>연결 기준</th><td colspan="3">PG ${src.startsWith('*') ? '무관 (결제사 피드)' : esc(p.name)} · 결제수단 ${esc(c.method)}${c.subs.length ? ` · 계약 세부수단(${esc(c.subs.join(', '))})` : ''} · 적용 범위가 '전체 MID'이거나 ${esc(m.code)}를 지정한 건</td></tr>
    </tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>${esc(c.method)} 프로모션</h3><span class="sp"></span><div class="ck-g rd">${[['', '전체', pr.length], ...PROMO_ORDER.map(k => [k, k, cnt(k)])].map(([v, l, n]) => `<label><input type="radio" name="promoF" value="${v}" ${pf === v ? 'checked' : ''}>${l} ${n}</label>`).join('')}</div></div>
    <div class="tw"><table class="tbl"><thead><tr><th>프로모션 ID</th><th>유형</th><th class="l">대상</th><th class="l">혜택</th><th>조건</th><th>기간</th><th>상태</th><th>적용 범위</th><th>최근 수신</th></tr></thead><tbody>
    ${list.map(x => `<tr class="${promoSt(x) === '종료' ? 'off' : ''}"><td class="pm3-mono">${esc(x.id)}</td><td>${esc(x.kind)}</td><td class="l">${esc(x.target)}</td><td class="l"><b>${esc(x.benefit)}</b></td><td>${esc(x.cond)}</td><td class="num">${x.from} ~ ${x.to}</td><td>${pb(promoSt(x))}</td><td>${x.scope === 'all' ? '전체 MID' : `<span title="${esc(x.scope.join(', '))}">MID 지정 ${x.scope.length}</span>`}</td><td>${pb(x.rcv)}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">선택한 상태의 프로모션이 없어요.</td></tr>'}
    </tbody></table></div>
    <div class="call warn"><div>프로모션은 수신 데이터를 그대로 보여줘요(읽기 전용). 고객 화면에 어떤 문구로 노출할지, 노출 여부를 누가 정할지는 확인이 필요해요.</div></div></section>
  <section class="sec"><div class="sec-h"><h3>수신 이력</h3></div><div class="tw"><table class="tbl"><thead><tr><th>수신 일시</th><th class="l">결과</th></tr></thead><tbody>${sy.log.slice(0, 6).map(l => `<tr><td class="num">${l.at}</td><td class="l">${esc(l.t)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function promoSync(c) {
  const k = promoSrcKey(c);
  if (!k || ui.psBusy) return;
  ui.psBusy = true;
  render();
  setTimeout(() => {
    const y = DB.psync[k], at = stamp();
    y.last = at; y.res = '성공';
    y.log.unshift({ at, by: ME, t: `수동 재수신 성공 · ${promosOf(c).length}건 확인, 변경 없음` });
    ui.psBusy = false;
    save(); render(); toast('프로모션을 다시 받았어요. 변경된 내용은 없어요.');
  }, 800);
}

// ---------- 연결 코너 · 변경 이력 ----------
function cornerView(c) {
  const ks = cornersOf(c);
  return `<div class="call warn"><div>결제 코너는 결제 BO가 관리하지 않아요. 관리 주체가 정해지지 않아 외부 도메인 데이터를 읽기 전용으로 보여줘요. (확인필요)</div></div>
    ${ks.length ? ks.map(k => `<div class="pm3-corner"><div class="pm3-corner-h"><b>${esc(k.name)}</b><span class="pm3-cp">${k.id}</span><small>${esc(k.where)} · 항목 ${k.items.length}개</small></div>
      <div class="tw"><table class="tbl"><thead><tr><th>결제수단</th><th>PG</th><th>MID</th><th class="l">가맹점 용도명</th><th>운영상태</th><th>구분</th></tr></thead><tbody>
      ${k.items.map(i => { const mm = midById(i.mid), cc = dupContract(i.mid, i.method), me = i.mid === c.mid && i.method === c.method; return `<tr class="${me ? 'me' : ''}"><td>${esc(i.method)}</td><td>${esc(pgOf(mm.pg).name)}</td><td class="pm3-mono">${esc(mm.code)}</td><td class="l">${esc(mm.purpose)}</td><td>${cc ? opBadge(cc.status) : '-'}</td><td>${me ? '<span class="bdg ac">이 계약</span>' : ''}</td></tr>`; }).join('')}
      </tbody></table></div></div>`).join('') : '<p class="emptybox">이 계약을 쓰는 결제 코너가 없어요.</p>'}
    <p class="desc dim-t">코너 항목은 결제수단 + MID예요. 한 코너에 다른 PG의 MID가 섞일 수 있고, 같은 코너 안에서 같은 결제수단은 한 번만 써요.</p>`;
}
function auditView(c) {
  const L = (DB.audit[c.id] || []).slice().reverse();
  return `<div class="tw"><table class="tbl"><thead><tr><th>변경일시</th><th>변경자</th><th class="l">변경 내용</th></tr></thead><tbody>${L.length
    ? L.map(a => `<tr><td class="num">${a.at}</td><td>${esc(a.by)}</td><td class="l">${esc(a.t)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="empty">기록된 변경 이력이 없어요. (Mock 초기 데이터)</td></tr>'}</tbody></table></div>`;
}

// ---------- 화면 ----------
function view() {
  const c = con, m = midOf(c), p = pgOf(m.pg), kn = cornersOf(c).length, an = (DB.audit[c.id] || []).length, pr = promosOf(c), cf = curFee(c);
  // 연결된 프로모션이 없으면 프로모션 탭을 비활성으로 둔다(V16)
  if (ui.tab === 'promo' && !pr.length) ui.tab = 'base';
  const T = [['base', '기본 정보'], ['fee', '수수료 이력', c.fees.length], ['promo', '프로모션', pr.length, !pr.length], ['corner', '연결 코너', kn], ['audit', '변경 이력', an]];
  const body = ui.tab === 'base' ? (ui.edit ? baseEdit(c, m, p) : baseView(c, m, p)) : ui.tab === 'fee' ? feeView(c, m) : ui.tab === 'promo' ? promoView(c, m, pr) : ui.tab === 'corner' ? cornerView(c) : auditView(c);
  return `<nav class="crumb" aria-label="현재 위치">홈<span aria-hidden="true">›</span>결제 관리<span aria-hidden="true">›</span>결제수단 기준정보 관리<span aria-hidden="true">›</span><b>결제수단 계약 상세</b></nav>
  <div class="ph"><h1 class="h1">${esc(m.purpose)} ${opBadge(c.status)} ${ksBadge(m.ks)}</h1><div class="ph-r"><a class="btn sm" href="${PAGES.list}" data-leave style="text-decoration:none">목록</a></div></div>
  <div class="path" aria-label="계위">${[p.name, c.method, m.code, m.purpose].map((t, i) => `<span class="n ${i >= 2 ? 'on' : ''}">${esc(t)}</span>`).join('<i>›</i>')}</div>
  <div class="strip">${[['PG', p.name], ['결제수단', c.method], ['MID', m.code], ['오늘 수수료', cf ? fmtFee(cf) : '-'], ['키검증', KEYST[m.ks]], ['진행중 프로모션', pr.length ? `${livePromos(c).length}건` : '없음']].map(([a, b]) => `<div><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div>
  <div class="tabs small" role="tablist">${T.map(([k, l, n, dis]) => `<button type="button" role="tab" aria-selected="${ui.tab === k}" class="${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}" ${dis ? `disabled title="${promoSrcKey(c) ? '수신된 프로모션이 없어요' : '이 결제수단은 프로모션 수신 대상이 아니에요'}"` : ''}>${l}${dis ? ' <span style="font-size:11px;font-weight:500">(없음)</span>' : n != null ? `<em>${n}</em>` : ''}</button>`).join('')}</div>
  <div class="pm3-tabbody" role="tabpanel">${body}</div>`;
}
function render() { redraw($('#view'), view()); }
function setTab(k) {
  ui.tab = k;
  const q = new URLSearchParams(location.search);
  q.set('id', con.id);
  if (k === 'base') q.delete('tab'); else q.set('tab', k);
  history.replaceState(null, '', `${location.pathname}?${q}`);
  render();
}

// ---------- 이벤트 ----------
document.addEventListener('click', e => {
  // 입력 중에 다른 화면으로 나갈 때만 확인한다
  const leave = e.target.closest('[data-leave]');
  if (leave) { if (dirty() && !confirm('저장하지 않은 변경이 있어요. 나갈까요?')) e.preventDefault(); return; }
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled || !con) return;
  const c = con, m = midOf(c), p = pgOf(m.pg), a = el.dataset.a, f = c.fees.find(x => x.id === el.dataset.fid);
  if (a === 'tab') setTab(el.dataset.v);
  else if (a === 'status') openStatus(c.id, render);
  else if (a === 'edit') { startEdit(c, m); render(); }
  else if (a === 'editCancel') { ui.edit = false; ui.draft = null; ui.err = []; render(); }
  else if (a === 'editSave') saveEdit(c, m, p);
  else if (a === 'keyOpen') { Object.assign(ui.draft, { keyChange: true, ks: 'none', kmsg: '키를 바꾸면 미확인 상태가 돼요. (V04)' }); render(); }
  else if (a === 'keyCancel') { Object.assign(ui.draft, { keyChange: false, keys: {}, ks: 'none', kmsg: '', kerr: false, kbusy: false }); render(); }
  else if (a === 'verify') runVerify(m, p);
  else if (a === 'promoSync') promoSync(c);
  else if (a === 'feLocked') {
    ui.block = `${f.from}부터 ${feeState(c, f) === 'cur' ? '적용 중인' : '적용이 끝난'} 요율(${fmtFee(f)})이에요. 이미 결제 건에 쓰였을 수 있어 값을 바꾸면 수수료 검증 근거가 깨져요. 같은 값을 채운 새 이력 입력란을 열었어요. 적용시작일을 정해 추가해 주세요.`;
    ui.feeForm = { sub: f.sub || '', from: defaultFrom(c, f.sub || ''), type: f.type, val: String(f.val), touched: false };
    render();
    const v = $('[data-ff="val"]');
    v?.focus(); v?.select();
  }
  else if (a === 'ffOpen') { ui.feeForm = { sub: '', from: defaultFrom(c), type: 'rate', val: '', touched: false }; render(); }
  else if (a === 'ffCancel') { ui.feeForm = null; ui.block = ''; render(); }
  else if (a === 'ffSave') {
    const ff = ui.feeForm, err = feeRowErr(c, ff, null);
    if (err) { $('#ffErr').textContent = err; return; }
    const nf = { id: nextFeeId(), sub: ff.sub, from: ff.from, type: ff.type, val: Number(ff.val), at: TODAY };
    c.fees.push(nf); c.upd = stamp(); c.by = ME;
    log(c.id, `수수료 이력 추가 · ${nf.sub ? `${nf.sub} ` : ''}${fmtFee(nf)} (${nf.from}~)`);
    ui.feeForm = null; ui.block = '';
    save(); render(); toast(`${nf.from}부터 ${fmtFee(nf)} 이력을 추가했어요.`);
  }
  else if (a === 'feEdit') { ui.feeEditId = f.id; ui.feeEdit = { sub: f.sub || '', from: f.from, type: f.type, val: String(f.val) }; render(); }
  else if (a === 'feEditCancel') { ui.feeEditId = null; render(); }
  else if (a === 'feEditSave') {
    const fe = ui.feeEdit, err = feeRowErr(c, fe, ui.feeEditId);
    if (err) { $('#feErr').textContent = err; return; }
    const ff = c.fees.find(x => x.id === ui.feeEditId), before = `${fmtFee(ff)} (${ff.from}~)`;
    Object.assign(ff, { from: fe.from, type: fe.type, val: Number(fe.val) });
    c.upd = stamp(); c.by = ME;
    log(c.id, `적용예정 이력 수정 · ${before} → ${fmtFee(ff)} (${ff.from}~)`);
    ui.feeEditId = null;
    save(); render(); toast('적용예정 이력을 수정했어요.');
  }
  else if (a === 'feDel') {
    // 기본 요율은 지울 수 없게 최소 1건을 남긴다. 세부수단 요율은 지워도 기본 요율이 남는다
    if (!f.sub && c.fees.filter(x => !x.sub).length <= 1) { toast('계약에는 기본 수수료 이력이 최소 1건 있어야 해요.', true); return; }
    if (!confirm(`${f.from} 적용예정 이력(${fmtFee(f)})을 삭제할까요?`)) return;
    c.fees = c.fees.filter(x => x.id !== f.id); c.upd = stamp(); c.by = ME;
    log(c.id, `적용예정 이력 삭제 · ${fmtFee(f)} (${f.from}~)`);
    save(); render(); toast('적용예정 이력을 삭제했어요.');
  }
});
// 저장에 실패한 뒤 값을 고치면 지난 오류 목록을 치운다
const clearErr = () => { if (ui.err.length) { ui.err = []; $('.errbox')?.remove(); } };
document.addEventListener('change', e => {
  const t = e.target, d = ui.draft;
  if (d) clearErr();
  if (d && t.dataset.d) d[t.dataset.d] = t.value;
  else if (d && t.dataset.ch) d.chs = t.checked ? [...d.chs, t.dataset.ch] : d.chs.filter(x => x !== t.dataset.ch);
  else if (d && t.dataset.sub) d.subs = t.checked ? [...d.subs, t.dataset.sub] : d.subs.filter(x => x !== t.dataset.sub);
  if (t.name === 'promoF') { ui.promoF = t.value; render(); }
  else if (d && t.id === 'dManual') { d.ks = t.checked ? 'manual' : 'none'; d.kmsg = ''; paintKey(); }
  else if (t.id === 'ffSub') { Object.assign(ui.feeForm, { sub: t.value, from: defaultFrom(con, t.value), touched: true }); render(); }
  else if (t.name === 'ffType') { Object.assign(ui.feeForm, { type: t.value, val: '', touched: true }); render(); }
  else if (t.name === 'feType') { Object.assign(ui.feeEdit, { type: t.value, val: '' }); render(); }
});
document.addEventListener('input', e => {
  const t = e.target, d = ui.draft;
  if (d) clearErr();
  if (d && t.dataset.d) d[t.dataset.d] = t.value;
  else if (d && t.dataset.key) {
    d.keys[t.dataset.key] = t.value;
    // 키를 고치면 미확인으로 돌아간다(V04)
    if (d.ks !== 'none' || d.kerr) { Object.assign(d, { ks: 'none', kerr: false, kmsg: '키가 바뀌어 미확인으로 돌아갔어요. (V04)' }); paintKey(); }
  }
  else if (t.dataset.ff) { ui.feeForm[t.dataset.ff] = t.value.trim(); ui.feeForm.touched = true; $('#ffErr').textContent = ''; }
  else if (t.dataset.fe) { ui.feeEdit[t.dataset.fe] = t.value.trim(); $('#feErr').textContent = ''; }
});

if (con) render();
else $('#view').innerHTML = `<div class="emptybox"><h4>계약을 찾을 수 없어요</h4><p>주소의 계약 ID(${esc(params.get('id'))})를 확인해 주세요.</p><a class="btn" href="${PAGES.list}" style="text-decoration:none">목록으로</a></div>`;
