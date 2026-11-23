// 결제관리 v0.2.3 · PG 관리 + 결제수단 기준정보. ref/payment-admin-prototype-v5.html 검토 후 구조를 바꿨다. 모든 데이터는 가상값이다.
// 구조: PG사 › 계약(계약번호 자동 채번 · 계약주체 · 입금계좌 · 대사 URL · 제공 결제수단) › 가맹점(MID) · 결제 프로모션
// - 계약과 제공 결제수단은 PG 관리에서만 등록 · 수정한다. 결제수단 기준정보는 계약 단위로 MID · 프로모션 · 사용 상태를 관리한다
// - MID의 입금계좌 · 대사 URL은 '계약정보 사용'(계약 값 자동 반영) 또는 '개별 입력'을 고른다
// - v0.2.2의 PG 단위 인증키 · 가맹점 용도 · 채널 · 수수료 적용 이력 · 프로모션 수신(읽기 전용)은 v5 기준으로 뺐다
// 데이터 · 공통 함수는 payment5-store.ts. 결제 이력 · 대사 · 수수료(payment5-ops.ts)도 같은 데이터를 쓴다
import "./admin-shell.css";
import "./payment2.css";
import "./payment4.css";
import "./payment5.css";
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import type { Use, Mid, Promo, Contract, Recv } from "./payment5-store";
import {
  TODAY, USER, TKEY, RECV_LABEL, LV2S, lv3Of, ALL, methodGroups, methodCode, methodOrder, normName, URLS, D, save, $, esc,
  pad, won, now, mask, opts, radios, checks, chips, badge, crumb, ph, sec, ft, lf, errBox, pgOf, ctOf, feeTxt,
  midAcc, midRecon, midState, promoState, promoBenefit, livePromos, methodNames, promoAllowed, go, toast
} from "./payment5-store";

requireAuthentication();


/* ================= 화면 상태 ================= */
interface Filter { pg: string; m: string; st: string; q: string }
interface Form { isNew: boolean; no: string; pgSel: string; name: string; code: string; bizNo: string; recv: Recv; party: string; corpNo: string; purpose: string; bank: string; holder: string; account: string; reconUrl: string; sel: string[] }
interface MidDraft extends Omit<Mid, 'rate' | 'flat'> { rate: string; flat: string; key: string }
interface PromoDraft extends Omit<Promo, 'value' | 'min' | 'mid'> { value: string; min: string; mid: string } // mid '' = 미선택, '*' = 전체 MID
type Modal =
  | { type: 'mid'; view: boolean; id: string | null; d: MidDraft; err: string[]; lv2: string; lv3: string }
  | { type: 'promo'; id: string | null; d: PromoDraft; err: string[] }
  | { type: 'confirm'; title: string; body: string; ok: string; run: () => void }
  | { type: 'easy'; name: string; code: string; err: string[] };
const emptyF = (): Filter => ({ pg: '', m: '', st: '', q: '' });
const UI: { f: Filter; fA: Filter; form: Form | null; err: string[]; modal: Modal | null } = { f: emptyF(), fA: emptyF(), form: null, err: [], modal: null };

function setPath(o: any, path: string, v: unknown) { const ks = path.split('.'); const last = ks.pop() as string; ks.forEach(k => o = o[k]); o[last] = v; }
function getPath(o: any, path: string) { return path.split('.').reduce((a, k) => a?.[k], o); }

const PAGE = document.body.dataset.page || 'pgm';
const QP = new URLSearchParams(location.search);
// 상세는 ?ct=계약번호. 결제 이력 등(payment5-ops.ts)에서 오면 ?id=MID-0001 또는 ?pg=PG사명으로 온다
function curCt(): Contract | undefined {
  let c = ctOf(QP.get('ct'));
  const id = QP.get('id');
  if (!c && id) c = D.cts.find(x => x.mids.some(m => m.id === id || m.mid === id));
  const pg = QP.get('pg');
  if (!c && pg) { const p = D.pgs.find(x => x.name === pg || x.id === pg); if (p) c = D.cts.find(x => x.pg === p.id); }
  return c || D.cts[0];
}
function touch(c: Contract) { c.upd = now(); c.by = USER; save(); }

/* ================= 조회 조건 (PG 관리 · 결제수단 기준정보 공통) ================= */
function filterRows() {
  const f = UI.fA, q = f.q.trim().toLowerCase();
  return D.cts.filter(c => (!f.pg || c.pg === f.pg) && (!f.m || c.methods.some(m => m.name === f.m)) && (!f.st || c.status === f.st)
    && (!q || [c.no, c.party, c.purpose, ...c.mids.map(m => m.mid)].some(v => v.toLowerCase().includes(q))))
    .sort((a, b) => a.pg === b.pg ? a.no.localeCompare(b.no) : D.pgs.findIndex(p => p.id === a.pg) - D.pgs.findIndex(p => p.id === b.pg));
}
function filterBox(qLabel: string) {
  const f = UI.f;
  return `<form class="lst-filter" autocomplete="off" onsubmit="return false">
  <div class="lf-row">${lf('PG사', `<select data-b="f.pg">${opts(D.pgs.map(p => [p.id, p.name] as [string, string]), f.pg, '전체')}</select>`)}${lf('결제수단', `<select data-b="f.m">${opts(methodNames(), f.m, '전체')}</select>`)}${lf('상태', `<select data-b="f.st">${opts(['사용', '미사용'], f.st, '전체')}</select>`)}${lf('검색어', `<input type="text" data-b="f.q" data-enter="search" value="${esc(f.q)}" placeholder="${qLabel}">`)}</div>
  <div class="lf-row"><span class="lf-acts"><button type="button" class="btn dark" data-a="reset">초기화</button><button type="button" class="btn pri" data-a="search">조회</button></span></div></form>`;
}

/* ================= PG 관리 목록: 계약 한 건이 한 행 ================= */
function vPgm() {
  const rows = filterRows();
  return `${crumb(['PG 관리'])}<h1 class="lst-title">PG 관리</h1>${filterBox('계약번호, 계약주체')}
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 PG사 ${D.pgs.length}개 · 계약 ${D.cts.length}건</span></h2></div>
  <div class="tw"><table class="tbl lst-table"><thead><tr><th>계약번호</th><th class="l">PG사</th><th>PG 코드</th><th class="l">계약주체</th><th class="l">계약 구분</th><th class="l">입금계좌</th><th>제공 결제수단</th><th>상태</th><th>최근 수정일</th><th>최근 수정자</th></tr></thead><tbody>
  ${rows.map(c => { const p = pgOf(c); return `<tr class="${c.status === '미사용' ? 'off' : ''}"><td><a class="p4-id" href="${URLS.pgD}?ct=${c.no}">${c.no}</a></td>
   <td class="l">${esc(p.name)}</td><td class="mid">${esc(p.code)}</td><td class="l">${esc(c.party)}</td><td class="l">${esc(c.purpose || '-')}</td>
   <td class="l">${esc(c.bank || '-')} / ${mask(c.account)}</td><td title="${esc(c.methods.map(m => m.name).join(', '))}">${c.methods.length}개</td>
   <td>${badge(c.status)}</td><td class="num">${c.upd.slice(0, 10)}</td><td>${esc(c.by)}</td></tr>`; }).join('') || '<tr><td colspan="10" class="empty">조건에 맞는 계약이 없습니다.</td></tr>'}</tbody></table></div>
  <div class="lst-bottom"><div class="lst-foot"><a class="btn pri lg" href="${URLS.pgForm}">PG사 · 계약 등록</a></div></div>`;
}

/* ================= PG 관리 상세 (읽기 전용) ================= */
function vPgD() {
  const c = curCt();
  if (!c) return `${crumb(['PG 관리', '상세'])}<div class="emptybox">등록된 계약이 없습니다.</div><div class="foot"><a class="btn lg" href="${URLS.pgm}">목록</a></div>`;
  const p = pgOf(c), sib = D.cts.filter(x => x.pg === p.id), linked = c.mids.filter(m => m.accMode === 'contract' || m.reconMode === 'contract').length;
  return `${crumb(['PG 관리', '상세'])}${ph(`${esc(p.name)} · ${c.no} ${badge(c.status)}`, `<a class="btn sm" href="${URLS.ctr}?ct=${c.no}">결제수단 기준정보에서 MID 관리</a>`)}
  ${sec('PG사 정보', ft(`<tr><th>PG사명</th><td>${esc(p.name)}</td><th>PG 코드</th><td class="mid">${esc(p.code)}</td></tr>
   <tr><th>입금 내역 수신</th><td colspan="3">${RECV_LABEL[p.recv]}</td></tr>
   <tr><th>사업자등록번호</th><td>${esc(p.bizNo || '미등록')}</td><th>이 PG사의 계약</th><td>${sib.map(x => x.no === c.no ? `<b>${x.no}</b>` : `<a class="p4-id" href="${URLS.pgD}?ct=${x.no}">${x.no}</a>`).join(', ')}</td></tr>`))}
  ${sec('계약 정보', ft(`<tr><th>계약번호</th><td class="mid">${c.no}</td><th>계약주체</th><td>${esc(c.party)}</td></tr>
   <tr><th>법인등록번호</th><td>${esc(c.corpNo || '-')}</td><th>계약 구분</th><td>${esc(c.purpose || '-')}</td></tr>`), '계약번호는 시스템이 자동 발급하며 삭제해도 다시 쓰지 않습니다')}
  ${sec('입금 · 대사 정보', ft(`<tr><th>입금은행</th><td>${esc(c.bank || '-')}</td><th>예금주</th><td>${esc(c.holder || '-')}</td></tr>
   <tr><th>입금계좌</th><td>${mask(c.account)}</td><th>대사 URL</th><td><span class="p5-url">${esc(c.reconUrl || '-')}</span></td></tr>`), `MID ${linked}개가 계약정보 사용 중입니다. 값을 바꾸면 해당 MID에 함께 반영됩니다`)}
  ${sec('제공 결제수단', `<div class="tw"><table class="tbl"><thead><tr><th class="l">결제수단명</th><th>원천 코드</th><th>등록 MID</th><th>진행 프로모션</th></tr></thead><tbody>
   ${c.methods.map(m => { const n = c.mids.filter(x => x.method === m.name).length; const lp = c.promos.filter(x => x.method === m.name && promoState(x) === '진행중').length;
     return `<tr><td class="l">${esc(m.name)}</td><td class="mid">${esc(m.code || '-')}</td><td>${n ? `${n}개` : badge('미등록')}</td><td>${lp || '-'}</td></tr>`; }).join('')}</tbody></table></div>`)}
  ${sec('처리 정보', ft(`<tr><th>최종 처리일시</th><td>${c.upd}</td><th>처리자</th><td>${esc(c.by)}</td></tr>`))}
  <div class="foot pm3h-foot"><a class="btn lg" href="${URLS.pgm}">목록</a><button class="btn lg dng" data-a="ctDel">삭제</button><a class="btn lg pri" href="${URLS.pgForm}?ct=${c.no}">수정</a></div>`;
}

/* ================= PG 관리 등록 · 수정 ================= */
function initForm(): Form {
  const c = ctOf(QP.get('ct'));
  if (c) {
    const p = pgOf(c);
    return { isNew: false, no: c.no, pgSel: p.id, name: p.name, code: p.code, bizNo: p.bizNo, recv: p.recv, party: c.party, corpNo: c.corpNo, purpose: c.purpose, bank: c.bank, holder: c.holder, account: c.account, reconUrl: c.reconUrl,
      sel: c.methods.map(m => m.name) };
  }
  const pre = D.pgs.find(p => p.id === QP.get('pg'));
  return { isNew: true, no: '', pgSel: pre ? pre.id : 'new', name: pre?.name || '', code: pre?.code || '', bizNo: pre?.bizNo || '', recv: pre?.recv || 'API', party: '', corpNo: '', purpose: '', bank: '', holder: '', account: '', reconUrl: '', sel: [] };
}
function vPgForm() {
  const d = UI.form as Form, old = d.isNew ? null : ctOf(d.no);
  const lockPg = d.isNew && d.pgSel !== 'new';
  const sib = d.isNew ? 0 : D.cts.filter(x => x.pg === d.pgSel && x.no !== d.no).length;
  const inp = (path: string, v: string, ph = '', extra = '') => `<input class="inp p5-full" data-b="form.${path}" value="${esc(v)}" placeholder="${ph}" ${extra}>`;
  const pgVal = (path: string, v: string, ph: string) => lockPg ? esc(v || '-') : inp(path, v, ph);
  // 예전에 직접 입력한 결제수단처럼 기준값에 없는 이름은 '기타'로 보여 줘서 해제할 수 있게 한다
  const etc = (old ? old.methods.map(m => m.name) : []).filter(n => !methodCode(n));
  const added = new Set(D.easyAdded.map(([n]) => n));
  const groups = [...methodGroups().map(g => ({ label: g.label, items: g.items.map(([n]) => n) })), ...(etc.length ? [{ label: '기타 (기준값 외)', items: etc }] : [])];
  return `${crumb(['PG 관리', d.isNew ? '등록' : '수정'])}${ph(d.isNew ? 'PG사 · 계약 등록' : `PG사 · 계약 수정: ${d.no}`)}
  ${sec('PG사 정보', ft(`${d.isNew ? `<tr><th>PG사 선택</th><td colspan="3"><select class="sel w200" data-b="form.pgSel" data-c="pgSel">${opts([['new', '신규 PG사 등록'], ...D.pgs.map(p => [p.id, `${p.name} (${p.code})`] as [string, string])], d.pgSel)}</select>${lockPg ? '<span class="help">기존 PG사에 계약을 추가합니다. PG사 정보는 계약 수정에서 바꿉니다</span>' : ''}</td></tr>` : ''}
   <tr><th class="${lockPg ? '' : 'req'}">PG사명</th><td>${pgVal('name', d.name, '예: NHN KCP')}</td><th class="${lockPg ? '' : 'req'}">PG 코드</th><td>${pgVal('code', d.code, '예: KCP')}</td></tr>
   <tr><th>사업자등록번호</th><td colspan="3">${pgVal('bizNo', d.bizNo, '예: 123-45-67890')}</td></tr>
   <tr><th class="${lockPg ? '' : 'req'}">입금 내역 수신</th><td colspan="3">${lockPg ? RECV_LABEL[d.recv] : radios('form.recv', [['API', RECV_LABEL.API], ['엑셀', RECV_LABEL.엑셀]], d.recv)}</td></tr>`), !d.isNew && sib ? `PG사 정보를 바꾸면 같은 PG사의 다른 계약 ${sib}건에도 반영됩니다` : '')}
  ${sec('계약 정보', ft(`<tr><th>계약번호</th><td>${d.isNew ? '<span class="dim-t">자동채번</span>' : `<span class="mid">${d.no}</span>`}</td><th class="req">계약주체</th><td>${inp('party', d.party, '예: 에스케이텔레콤(주)')}</td></tr>
   <tr><th>법인등록번호</th><td>${inp('corpNo', d.corpNo, '예: 123456-1234567')}</td><th>계약 구분</th><td>${inp('purpose', d.purpose, '예: 구독상품 신규 PG 계약')}</td></tr>`))}
  ${sec('입금 · 대사 정보', ft(`<tr><th>입금은행</th><td>${inp('bank', d.bank, '예: 신한은행')}</td><th>예금주</th><td>${inp('holder', d.holder, '예: 에스케이텔레콤(주)')}</td></tr>
   <tr><th>입금계좌</th><td colspan="3">${inp('account', d.account, '예: 000-000-000000')}</td></tr>
   <tr><th>대사 URL</th><td colspan="3">${inp('reconUrl', d.reconUrl, 'https://... (선택)')}</td></tr>`))}
  ${sec('제공 결제수단', ft(groups.map(g => `<tr><th>${g.label}</th><td><div class="ck-g">${g.items.map(n => { const cnt = old ? old.mids.filter(m => m.method === n).length : 0;
     return `<label><input type="checkbox" data-c="arr" data-p="form.sel" value="${esc(n)}" ${d.sel.includes(n) ? 'checked' : ''}>${esc(n)}${added.has(n) ? ' <span class="p5-chip gray">추가</span>' : ''}${cnt ? ` <span class="dim-t" style="font-size:12px">(MID ${cnt}개)</span>` : ''}</label>`; }).join('')}${g.label === '간편결제' ? '<button class="btn sm" data-a="easyNew">+ 간편결제 추가</button>' : ''}</div></td></tr>`).join('')))}
  ${errBox(UI.err)}
  <div class="foot"><a class="btn lg" href="${d.isNew ? URLS.pgm : `${URLS.pgD}?ct=${d.no}`}">취소</a><button class="btn lg pri" data-a="formSave">저장</button></div>`;
}
function formErrors(d: Form) {
  const e: string[] = [], t = (s: string) => s.trim();
  if (!t(d.name) || !t(d.code)) e.push('PG사명과 PG 코드를 입력하세요.');
  if (!t(d.party)) e.push('계약주체를 입력하세요.');
  if (t(d.bizNo) && !/^(\d{10}|\d{3}-\d{2}-\d{5})$/.test(t(d.bizNo))) e.push('사업자등록번호는 숫자 10자리(예: 123-45-67890)로 입력하세요.');
  if (t(d.corpNo) && !/^(\d{13}|\d{6}-\d{7})$/.test(t(d.corpNo))) e.push('법인등록번호는 숫자 13자리(예: 123456-1234567)로 입력하세요.');
  if (t(d.reconUrl) && !/^https?:\/\//i.test(t(d.reconUrl))) e.push('대사 URL은 http:// 또는 https://로 시작해야 합니다.');
  if (!d.sel.length) e.push('제공 결제수단을 1개 이상 고르세요.');
  if (d.pgSel === 'new' || !d.isNew) {
    const dup = D.pgs.find(p => p.id !== d.pgSel && (p.name.toLowerCase() === t(d.name).toLowerCase() || p.code.toLowerCase() === t(d.code).toLowerCase()));
    if (dup) e.push(`이미 등록된 PG사명 또는 코드입니다 (${dup.name} · ${dup.code}). PG사 선택에서 기존 PG사를 고르세요.`);
  }
  return e;
}
function formApply(d: Form) {
  const t = (s: string) => s.trim();
  const prev = ctOf(d.no);
  const ord = methodOrder(), order = (n: string) => { const i = ord.indexOf(n); return i < 0 ? 99 : i; };
  const methods = [...d.sel].sort((a, b) => order(a) - order(b)).map(name => ({ name, code: methodCode(name) || prev?.methods.find(m => m.name === name)?.code || '' }));
  let pg = D.pgs.find(p => p.id === d.pgSel);
  if (!pg) { pg = { id: 'pg-' + Date.now().toString(36), name: t(d.name), code: t(d.code).toUpperCase(), bizNo: t(d.bizNo), recv: d.recv }; D.pgs.push(pg); }
  else if (!d.isNew) Object.assign(pg, { name: t(d.name), code: t(d.code).toUpperCase(), bizNo: t(d.bizNo), recv: d.recv });
  const fields = { party: t(d.party), corpNo: t(d.corpNo), purpose: t(d.purpose), bank: t(d.bank), holder: t(d.holder), account: t(d.account), reconUrl: t(d.reconUrl), methods };
  let c = ctOf(d.no);
  if (!c) {
    c = { no: 'PGC-' + pad(++D.seq, 6), pg: pg.id, status: '사용', mids: [], promos: [], upd: '', by: USER, ...fields };
    D.cts.push(c);
  } else {
    const keep = new Set(d.sel);
    c.mids = c.mids.filter(m => keep.has(m.method));
    c.promos = c.promos.filter(p => keep.has(p.method));
    Object.assign(c, fields);
  }
  touch(c);
  go(`${URLS.pgD}?ct=${c.no}`, d.isNew ? `${c.no} 계약을 등록했습니다. 결제수단 기준정보에서 MID를 등록하세요.` : `${c.no} 계약을 수정했습니다.`);
}

/* ================= 결제수단 기준정보 목록: 계약 단위 ================= */
function vBase() {
  const rows = filterRows();
  return `${crumb(['결제수단 기준정보 관리'])}<h1 class="lst-title">결제수단 기준정보 관리</h1>${filterBox('계약번호, 계약주체, MID')}
  <p class="pm4-help">계약과 제공 결제수단은 PG 관리에서 등록합니다. 여기서는 계약별 가맹점(MID)과 결제 프로모션을 관리합니다. <a class="lk" href="${URLS.pgm}">PG 관리로 이동</a></p>
  <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 ${D.cts.length}건</span></h2></div>
  <div class="tw"><table class="tbl lst-table"><thead><tr><th>계약번호</th><th class="l">PG사</th><th class="l">계약주체</th><th class="l">계약 구분</th><th>제공 결제수단</th><th>등록 MID</th><th>프로모션</th><th>상태</th><th>최근 수정일</th><th>최근 수정자</th></tr></thead><tbody>
  ${rows.map(c => `<tr class="${c.status === '미사용' ? 'off' : ''}"><td><a class="p4-id" href="${URLS.ctr}?ct=${c.no}">${c.no}</a></td>
   <td class="l">${esc(pgOf(c).name)}</td><td class="l">${esc(c.party)}</td><td class="l">${esc(c.purpose || '-')}</td><td title="${esc(c.methods.map(m => m.name).join(', '))}">${c.methods.length}개</td>
   <td>${c.mids.length}건</td><td>${livePromos(c)}건</td><td>${badge(c.status)}</td><td class="num">${c.upd.slice(0, 10)}</td><td>${esc(c.by)}</td></tr>`).join('') || '<tr><td colspan="10" class="empty">조건에 맞는 계약이 없습니다.</td></tr>'}</tbody></table></div>`;
}

/* ================= 결제수단 기준정보 상세: 기준정보 · MID · 프로모션 ================= */
function vCtr() {
  const c = curCt();
  if (!c) return `${crumb(['결제수단 기준정보 관리', '상세'])}<div class="emptybox">등록된 계약이 없습니다. PG 관리에서 계약을 먼저 등록하세요.</div><div class="foot"><a class="btn lg" href="${URLS.base}">목록</a></div>`;
  const p = pgOf(c);
  const order = (m: string) => c.methods.findIndex(x => x.name === m);
  const mids = [...c.mids].sort((a, b) => order(a.method) - order(b.method) || a.mid.localeCompare(b.mid));
  // 행을 누르면 가맹점 상세 팝업. [삭제] 버튼은 버튼 자신의 동작만 한다
  const midRows = mids.map(m => { const acc = midAcc(c, m);
    return `<tr class="click ${midState(m) === '만료' ? 'off' : ''}" data-a="midView" data-id="${m.id}" tabindex="0" title="가맹점 상세 보기"><td class="l">${esc(m.method)}</td><td class="l">${esc(m.name)}</td><td class="mid">${esc(m.mid)}</td>
     <td class="l">${chips(m.products, 'gray')}</td><td>${feeTxt(m)} <span class="dim-t">(VAT ${m.vat})</span></td>
     <td class="l">${esc(acc.bank || '-')} / ${mask(acc.account)}</td><td>${m.from} ~ ${m.to || '무기한'}</td>
     <td><button class="btn sm dng" data-a="midDel" data-id="${m.id}">삭제</button></td></tr>`; }).join('');
  const promoRows = c.promos.map(x => { const target = x.mid ? x.mid : '전체 MID';
    return `<tr class="${['종료', '미사용'].includes(promoState(x)) ? 'off' : ''}"><td class="l"><button class="lk" data-a="promoEdit" data-id="${x.id}">${esc(x.name)}</button><div class="sub">${esc(x.method)}</div></td>
     <td>${promoBenefit(x)}<div class="sub">최소 ${won(x.min)}원</div></td><td class="l">${chips(x.products, 'gray')}</td><td class="mid">${esc(target)}</td><td>${x.from} ~ ${x.to}</td><td>${badge(promoState(x))}</td>
     <td><button class="btn sm dng" data-a="promoDel" data-id="${x.id}">삭제</button></td></tr>`; }).join('');
  return `${crumb(['결제수단 기준정보 관리', '상세'])}${ph(`${esc(p.name)} · ${c.no} ${badge(c.status)}`, `<a class="btn sm" href="${URLS.pgD}?ct=${c.no}">PG 관리에서 계약 보기</a>`)}
  ${sec('결제수단 기준정보', ft(`<tr><th>PG사</th><td>${esc(p.name)} <span class="dim-t">(${esc(p.code)})</span></td><th>계약번호</th><td class="mid">${c.no}</td></tr>
   <tr><th>계약주체</th><td>${esc(c.party)}</td><th>계약 구분</th><td>${esc(c.purpose || '-')}</td></tr>
   <tr><th>제공 결제수단</th><td colspan="3">${chips(c.methods.map(m => m.name))}</td></tr>
   <tr><th>상태</th><td colspan="3">${radios('ctStatus', ['사용', '미사용'], c.status, 'data-c="ctStatus"')}</td></tr>`))}
  ${sec('가맹점(MID)', `<div class="tw"><table class="tbl"><thead><tr><th class="l">결제수단</th><th class="l">가맹점명</th><th>MID</th><th class="l">허용 상품</th><th>수수료(VAT)</th><th class="l">입금계좌</th><th>유효기간</th><th>관리</th></tr></thead><tbody>
   ${midRows || '<tr><td colspan="8" class="empty">등록된 가맹점이 없습니다. [가맹점 등록]으로 추가하세요.</td></tr>'}</tbody></table></div>`,
    '', `<button class="btn sm pri" data-a="midNew">가맹점 등록</button>`)}
  ${sec('결제 프로모션', `<div class="tw"><table class="tbl"><thead><tr><th class="l">프로모션명</th><th>혜택</th><th class="l">대상 상품</th><th>적용 MID</th><th>적용 기간</th><th>상태</th><th>관리</th></tr></thead><tbody>
   ${promoRows || '<tr><td colspan="7" class="empty">등록된 프로모션이 없습니다.</td></tr>'}</tbody></table></div>`,
    '', `<button class="btn sm pri" data-a="promoNew" ${c.mids.length ? '' : 'disabled title="MID를 먼저 등록하세요"'}>프로모션 등록</button>`)}
  ${sec('처리 정보', ft(`<tr><th>최종 처리일시</th><td>${c.upd}</td><th>처리자</th><td>${esc(c.by)}</td></tr>`))}
  <div class="foot pm3h-foot"><a class="btn lg" href="${URLS.base}">목록</a></div>`;
}

/* ================= 모달: 가맹점(MID) ================= */
function midDraft(c: Contract, m?: Mid): MidDraft {
  if (m) return { ...m, products: [...m.products], rate: String(m.rate), flat: String(m.flat), key: '' };
  return { id: '', method: c.methods[0]?.name || '', name: '', mid: '', products: [], feeType: '정률', rate: '2.1', flat: '0', vat: '별도', owner: '', accMode: 'contract', bank: '', holder: '', account: '', reconMode: 'contract', reconUrl: '', from: TODAY, to: '', keyTail: '', key: '' };
}
function mMid(md: Extract<Modal, { type: 'mid' }>, c: Contract) {
  const d = md.d, acc = d.accMode === 'contract' ? { bank: c.bank, holder: c.holder, account: mask(c.account) } : d;
  if (md.view) {
    const m = c.mids.find(x => x.id === md.id) as Mid, a = midAcc(c, m), url = midRecon(c, m);
    return { t: '가맹점 상세', b: ft(`<tr><th>결제수단</th><td>${esc(m.method)}</td><th>가맹점명</th><td>${esc(m.name)}</td></tr>
      <tr><th>MID</th><td class="mid">${esc(m.mid)}</td><th>정산주체</th><td>${esc(m.owner)}</td></tr>
      <tr><th>허용 상품</th><td colspan="3">${chips(m.products, 'gray')}</td></tr>
      <tr><th>수수료</th><td>${feeTxt(m)} <span class="dim-t">(${m.feeType})</span></td><th>VAT 기준</th><td>${m.vat}</td></tr>
      <tr><th>입금계좌</th><td colspan="3"><div class="p5-line">${badge(m.accMode === 'contract' ? '계약정보 사용' : '개별 입력')}<span>${esc(a.bank || '-')} · ${esc(a.holder || '-')} · ${mask(a.account)}</span></div></td></tr>
      <tr><th>대사 URL</th><td colspan="3"><div class="p5-line">${badge(m.reconMode === 'contract' ? '계약정보 사용' : '개별 입력')}<span class="p5-url">${esc(url || '-')}</span></div></td></tr>
      <tr><th>유효기간</th><td>${m.from} ~ ${m.to || '무기한'} ${badge(midState(m))}</td><th>인증키</th><td>${m.keyTail ? `<span class="mid">•••• ${esc(m.keyTail)}</span>` : badge('미등록')}</td></tr>`),
      f: `<button class="btn" data-a="close">닫기</button><button class="btn pri" data-a="midEdit">수정</button>` };
  }
  const fee = d.feeType;
  return { t: md.id ? '가맹점 수정' : '가맹점 등록', b: `${errBox(md.err)}${ft(`<tr><th class="req">결제수단</th><td><select class="sel" data-b="modal.d.method">${opts(c.methods.map(m => m.name), d.method)}</select></td><th class="req">가맹점명</th><td><input class="inp" data-b="modal.d.name" value="${esc(d.name)}" maxlength="50"></td></tr>
    <tr><th class="req">MID</th><td><input class="inp" data-b="modal.d.mid" value="${esc(d.mid)}" maxlength="30" placeholder="가맹점번호"></td><th class="req">정산주체</th><td><input class="inp" data-b="modal.d.owner" value="${esc(d.owner)}" placeholder="예: SKT"></td></tr>
    <tr><th class="req">허용 상품</th><td colspan="3"><div class="p5-line"><select class="sel" data-b="modal.lv2" data-c="midLv2" aria-label="LV2">${opts(LV2S, md.lv2, 'LV2 선택')}</select><select class="sel" data-b="modal.lv3" aria-label="LV3" ${md.lv2 ? '' : 'disabled'}>${opts([[ALL, 'LV3 전체'] as [string, string], ...lv3Of(md.lv2)], md.lv3)}</select><button class="btn sm" data-a="midProdAdd" ${md.lv2 ? '' : 'disabled'}>추가</button></div>
     <div class="p5-chips" style="margin-top:8px">${d.products.map(x => `<span class="p5-chip gray">${esc(x)}<button class="lk" data-a="midProdDel" data-v="${esc(x)}" aria-label="${esc(x)} 빼기" style="padding:0 0 0 4px">×</button></span>`).join('') || '<span class="dim-t">추가한 상품이 없습니다</span>'}</div></td></tr>
    <tr><th>수수료</th><td colspan="3"><div class="p5-line">${radios('modal.d.feeType', ['정률', '정액', '혼합'], fee)}<span class="p5-unit"><input class="inp num" type="number" min="0" max="100" step="0.001" data-b="modal.d.rate" value="${esc(d.rate)}" ${fee === '정액' ? 'disabled' : ''} aria-label="수수료율">%</span><span class="p5-unit">+ <input class="inp num" type="number" min="0" step="1" data-b="modal.d.flat" value="${esc(d.flat)}" ${fee === '정률' ? 'disabled' : ''} aria-label="건당 수수료">원/건</span></div></td></tr>
    <tr><th>VAT 기준</th><td colspan="3">${radios('modal.d.vat', ['별도', '포함'], d.vat)}</td></tr>
    <tr><th class="req">입금계좌</th><td colspan="3">${radios('modal.d.accMode', [['contract', '계약정보 사용'], ['own', '개별 입력']], d.accMode)}
     <div class="p5-acc">${(['bank', 'holder', 'account'] as const).map((k, i) => `<input class="inp" data-b="modal.d.${k}" value="${esc(acc[k])}" placeholder="${['입금은행', '예금주', '입금계좌'][i]}" aria-label="${['입금은행', '예금주', '입금계좌'][i]}" ${d.accMode === 'contract' ? 'disabled' : ''}>`).join('')}</div></td></tr>
    <tr><th>대사 URL</th><td colspan="3">${radios('modal.d.reconMode', [['contract', '계약정보 사용'], ['own', '개별 입력']], d.reconMode)}
     <div style="margin-top:10px"><input class="inp" data-b="modal.d.reconUrl" value="${esc(d.reconMode === 'contract' ? c.reconUrl : d.reconUrl)}" placeholder="https://... (선택)" aria-label="대사 URL" ${d.reconMode === 'contract' ? 'disabled' : ''}></div></td></tr>
    <tr><th class="req">유효기간</th><td colspan="3"><span class="p5-unit"><input class="inp" type="date" data-b="modal.d.from" value="${d.from}" aria-label="유효시작일">~<input class="inp" type="date" data-b="modal.d.to" value="${d.to}" aria-label="유효종료일"></span><span class="help">종료일이 없으면 무기한</span></td></tr>
    <tr><th>인증키</th><td colspan="3"><input class="inp" type="password" autocomplete="new-password" data-b="modal.d.key" value="${esc(d.key)}" placeholder="${md.id ? '입력하지 않으면 기존 키 유지' : '인증키 입력'}" aria-label="인증키">${d.keyTail ? `<span class="help">현재 •••• ${esc(d.keyTail)}</span>` : ''}</td></tr>`)}
    <p class="p5-note">인증키는 등록 여부와 끝 4자리만 보관합니다. 운영 환경에서는 서버의 암호화 저장소를 씁니다.</p>`,
    f: `<button class="btn" data-a="close">취소</button><button class="btn pri" data-a="midSave">저장</button>` };
}
function midErrors(c: Contract, d: MidDraft) {
  const e: string[] = [], t = (s: string) => s.trim(), rate = Number(d.rate), flat = Number(d.flat);
  if (!d.method || !t(d.name) || !t(d.mid) || !t(d.owner)) e.push('결제수단, 가맹점명, MID, 정산주체를 입력하세요.');
  if (!d.products.length) e.push('허용 상품을 1개 이상 추가하세요.');
  if (d.feeType !== '정액' && (d.rate === '' || !(rate >= 0 && rate <= 100))) e.push('수수료율은 0~100% 사이로 입력하세요.');
  if (d.feeType !== '정률' && (d.flat === '' || !(flat >= 0))) e.push('건당 수수료는 0원 이상으로 입력하세요.');
  if (d.accMode === 'own' && (!t(d.bank) || !t(d.holder) || !t(d.account))) e.push('개별 입력한 입금은행, 예금주, 입금계좌를 모두 입력하세요.');
  if (d.accMode === 'contract' && !c.account) e.push('계약에 입금계좌가 없습니다. 개별 입력을 고르거나 PG 관리에서 계약 입금계좌를 등록하세요.');
  if (d.reconMode === 'own' && t(d.reconUrl) && !/^https?:\/\//i.test(t(d.reconUrl))) e.push('대사 URL은 http:// 또는 https://로 시작해야 합니다.');
  if (!d.from) e.push('유효시작일을 입력하세요.');
  if (d.to && d.to < d.from) e.push('유효종료일은 유효시작일보다 빠를 수 없습니다.');
  if (c.mids.some(m => m.id !== d.id && m.mid.toLowerCase() === t(d.mid).toLowerCase())) e.push('이 계약에 이미 등록된 MID입니다.');
  return e;
}
function midApply(c: Contract, d: MidDraft) {
  const t = (s: string) => s.trim();
  const prev = c.mids.find(m => m.id === d.id);
  const m: Mid = { id: d.id || 'MID-' + pad(++D.midSeq, 4), method: d.method, name: t(d.name), mid: t(d.mid), products: [...d.products],
    feeType: d.feeType, rate: d.feeType === '정액' ? 0 : Number(d.rate), flat: d.feeType === '정률' ? 0 : Number(d.flat), vat: d.vat, owner: t(d.owner),
    accMode: d.accMode, bank: d.accMode === 'own' ? t(d.bank) : '', holder: d.accMode === 'own' ? t(d.holder) : '', account: d.accMode === 'own' ? t(d.account) : '',
    reconMode: d.reconMode, reconUrl: d.reconMode === 'own' ? t(d.reconUrl) : '', from: d.from, to: d.to, keyTail: d.key ? d.key.slice(-4) : d.keyTail };
  if (prev) {
    // 이 MID를 지정한 프로모션은 MID 값 · 결제수단을 따라가고, 빠진 허용 상품은 대상에서 뺀다
    c.promos.forEach(p => { if (p.mid === prev.mid) { p.mid = m.mid; p.method = m.method; p.products = p.products.filter(x => m.products.includes(x)); } });
    Object.assign(prev, m);
  } else c.mids.push(m);
  touch(c); UI.modal = null; render(); toast(prev ? `${m.mid} 가맹점을 수정했습니다.` : `${m.mid} 가맹점을 등록했습니다.`);
}

/* ================= 모달: 결제 프로모션 ================= */
function promoDraft(c: Contract, p?: Promo): PromoDraft {
  if (p) return { ...p, products: [...p.products], value: String(p.value), min: String(p.min), mid: p.mid || '*' };
  const method = c.methods.find(m => c.mids.some(x => x.method === m.name))?.name || '';
  return { id: '', name: '', type: '정률', value: '5', min: '0', from: TODAY, to: '', use: '사용', method, mid: '', products: [] };
}
function mPromo(md: Extract<Modal, { type: 'promo' }>, c: Contract) {
  const d = md.d, methods = c.methods.filter(m => c.mids.some(x => x.method === m.name)).map(m => m.name);
  const mids = c.mids.filter(m => m.method === d.method);
  const allowed = d.mid ? promoAllowed(c, d.method, d.mid) : [];
  return { t: md.id ? '프로모션 수정' : '프로모션 등록', b: `${errBox(md.err)}${ft(`<tr><th class="req">프로모션명</th><td colspan="3"><input class="inp" data-b="modal.d.name" value="${esc(d.name)}" maxlength="80" placeholder="예: 신용카드 5% 즉시할인"></td></tr>
    <tr><th class="req">결제수단</th><td><select class="sel" data-b="modal.d.method" data-c="promoMethod">${opts(methods, d.method)}</select></td><th class="req">적용 MID</th><td><select class="sel" data-b="modal.d.mid" data-c="promoMid">${opts([['*', '전체 MID'], ...mids.map(m => [m.mid, `${m.mid} (${m.name})`] as [string, string])], d.mid, '선택')}</select></td></tr>
    <tr><th class="req">대상 상품</th><td colspan="3">${!d.mid ? '<span class="dim-t">적용 MID를 먼저 고르세요.</span>' : allowed.length ? checks('modal.d.products', allowed, d.products) : '<span class="p5-warn">고른 MID에 허용 상품이 없습니다.</span>'}<div class="sub">${d.mid === '*' ? '이 결제수단 MID들의 허용 상품을 합친 목록입니다.' : '고른 MID의 허용 상품만 보입니다.'}</div></td></tr>
    <tr><th>혜택</th><td colspan="3"><div class="p5-line">${radios('modal.d.type', [['정률', '정률 할인'], ['정액', '정액 할인']], d.type)}<span class="p5-unit"><input class="inp num" type="number" min="0" step="${d.type === '정률' ? '0.01' : '1'}" data-b="modal.d.value" value="${esc(d.value)}" aria-label="할인 값">${d.type === '정률' ? '%' : '원'}</span></div></td></tr>
    <tr><th>최소 결제금액</th><td><span class="p5-unit"><input class="inp num" type="number" min="0" step="1" data-b="modal.d.min" value="${esc(d.min)}" aria-label="최소 결제금액">원</span></td><th>사용 여부</th><td>${radios('modal.d.use', ['사용', '미사용'], d.use)}</td></tr>
    <tr><th class="req">적용 기간</th><td colspan="3"><span class="p5-unit"><input class="inp" type="date" data-b="modal.d.from" value="${d.from}" aria-label="적용 시작일">~<input class="inp" type="date" data-b="modal.d.to" value="${d.to}" aria-label="적용 종료일"></span></td></tr>`)}`,
    f: `<button class="btn" data-a="close">취소</button><button class="btn pri" data-a="promoSave">저장</button>` };
}
function promoErrors(c: Contract, d: PromoDraft) {
  const e: string[] = [], v = Number(d.value), min = Number(d.min || 0);
  if (!d.name.trim()) e.push('프로모션명을 입력하세요.');
  if (!d.method || !d.mid) e.push('결제수단과 적용 MID를 고르세요.');
  if (d.value === '' || !(v > 0) || (d.type === '정률' && v > 100)) e.push('할인 값을 확인하세요. 정률 할인은 0% 초과 100% 이하입니다.');
  if (!(min >= 0)) e.push('최소 결제금액은 0원 이상으로 입력하세요.');
  if (!d.from || !d.to) e.push('적용 시작일과 종료일을 모두 입력하세요.');
  else if (d.to < d.from) e.push('적용 종료일은 시작일보다 빠를 수 없습니다.');
  const allowed = d.mid ? promoAllowed(c, d.method, d.mid) : [];
  if (d.mid && (!d.products.length || d.products.some(p => !allowed.includes(p)))) e.push('고른 MID가 허용하는 대상 상품을 1개 이상 고르세요.');
  return e;
}
function promoApply(c: Contract, d: PromoDraft) {
  const p: Promo = { id: d.id || 'PR-' + pad(++D.promoSeq, 4), name: d.name.trim(), type: d.type, value: Number(d.value), min: Number(d.min || 0), from: d.from, to: d.to, use: d.use,
    method: d.method, mid: d.mid === '*' ? '' : d.mid, products: promoAllowed(c, d.method, d.mid).filter(x => d.products.includes(x)) };
  const i = c.promos.findIndex(x => x.id === p.id);
  if (i >= 0) c.promos[i] = p; else c.promos.push(p);
  touch(c); UI.modal = null; render(); toast(i >= 0 ? '프로모션을 수정했습니다.' : '프로모션을 등록했습니다.');
}

/* ================= 모달: 간편결제 추가 (PG 관리 폼) ================= */
function mEasy(md: Extract<Modal, { type: 'easy' }>) {
  return { t: '간편결제 추가', b: `${errBox(md.err)}${ft(`<tr><th class="req">결제수단명</th><td><input class="inp" data-b="modal.name" value="${esc(md.name)}" maxlength="30" placeholder="예: 삼성페이"></td></tr>
    <tr><th class="req">원천 코드</th><td><input class="inp" data-b="modal.code" value="${esc(md.code)}" maxlength="20" placeholder="예: SAMSUNGPAY"><div class="sub">영문 대문자 · 숫자 · _ 2~20자</div></td></tr>`)}
    <p class="p5-note">추가한 간편결제는 모든 계약의 간편결제 목록에 나오고, 이 계약에는 바로 체크됩니다. 원천 코드가 BSS · FO 코드와 일치하는지 확인하는 절차는 미확정입니다.</p>`,
    f: `<button class="btn" data-a="close">취소</button><button class="btn pri" data-a="easySave">추가</button>` };
}
function easyErrors(name: string, code: string) {
  const e: string[] = [];
  if (!name) e.push('결제수단명을 입력하세요.');
  if (!/^[A-Z0-9_]{2,20}$/.test(code)) e.push('원천 코드는 영문 대문자, 숫자, _ 2~20자로 입력하세요.');
  const all = methodGroups().flatMap(g => g.items);
  const sameName = all.find(([n]) => normName(n) === normName(name));
  if (name && sameName) e.push(`이미 있는 결제수단입니다 (${sameName[0]}). 목록에서 체크하세요.`);
  const sameCode = all.find(([, c]) => c === code);
  if (code && sameCode) e.push(`원천 코드 ${code}는 ${sameCode[0]}에서 쓰고 있습니다.`);
  return e;
}

/* ================= 모달 그리기 ================= */
function renderModal() {
  const r = $('#modal-root'), md = UI.modal;
  if (!md) { r.innerHTML = ''; return; }
  const c = curCt() as Contract;
  const f = md.type === 'mid' ? mMid(md, c) : md.type === 'promo' ? mPromo(md, c) : md.type === 'easy' ? mEasy(md)
    : { t: md.title, b: `<p style="margin:4px 0 8px;line-height:1.7;white-space:pre-line">${esc(md.body)}</p>`, f: `<button class="btn" data-a="close">취소</button><button class="btn pri" data-a="confirmOk">${esc(md.ok)}</button>` };
  const sc = r.querySelector('.mdl-b')?.scrollTop || 0;
  r.innerHTML = `<div class="dimbg" data-a="dim"><div class="mdl ${md.type === 'confirm' || md.type === 'easy' ? 'w5' : 'w9'}" role="dialog" aria-modal="true" aria-labelledby="mdl-t"><div class="mdl-h"><h2 id="mdl-t">${f.t}</h2><button class="x" data-a="close" aria-label="닫기">×</button></div><div class="mdl-b">${f.b}</div><div class="mdl-f">${f.f}</div></div></div>`;
  const b = r.querySelector('.mdl-b'); if (b) b.scrollTop = sc;
}
const confirmBox = (title: string, body: string, ok: string, run: () => void) => { UI.modal = { type: 'confirm', title, body, ok, run }; renderModal(); };

/* ================= 렌더 ================= */
// 상세 · 등록 화면의 4칸 정보 표는 라벨 칸 폭을 고정한다 (payment4.ts와 같음)
function ftCols(root: HTMLElement) {
  if (!document.body.classList.contains('p4d')) return;
  root.querySelectorAll('table.ft').forEach(t => {
    const tb = t as HTMLTableElement;
    const n = Math.max(0, ...[...tb.rows].map(r => [...r.cells].reduce((a, c) => a + c.colSpan, 0)));
    if (n === 4 && !tb.querySelector('colgroup')) tb.insertAdjacentHTML('afterbegin', '<colgroup><col class="k"><col><col class="k"><col></colgroup>');
  });
}
function render() {
  const v = PAGE === 'pgm' ? vPgm() : PAGE === 'pgD' ? vPgD() : PAGE === 'pgForm' ? vPgForm() : PAGE === 'base' ? vBase() : vCtr();
  $('#view').innerHTML = v; ftCols($('#view'));
  renderModal(); ftCols($('#modal-root'));
}

/* ================= 액션 ================= */
const A: Record<string, (el: HTMLElement) => void> = {
  search() { UI.fA = { ...UI.f }; render(); },
  reset() { UI.f = emptyF(); UI.fA = emptyF(); render(); },
  pgSel() { const d = UI.form!, p = D.pgs.find(x => x.id === d.pgSel); Object.assign(d, { name: p?.name || '', code: p?.code || '', bizNo: p?.bizNo || '', recv: p?.recv || 'API' }); render(); },
  formSave() {
    const d = UI.form!; UI.err = formErrors(d);
    if (UI.err.length) { render(); window.scrollTo(0, document.body.scrollHeight); return; }
    const c = ctOf(d.no);
    const keep = new Set(d.sel);
    const gone = c ? c.methods.filter(m => !keep.has(m.name)).map(m => m.name) : [];
    const lost = c ? { mids: c.mids.filter(m => gone.includes(m.method)).length, promos: c.promos.filter(p => gone.includes(p.method)).length } : { mids: 0, promos: 0 };
    if (lost.mids || lost.promos) confirmBox('결제수단 삭제 확인', `삭제하는 결제수단: ${gone.join(', ')}\n함께 삭제되는 MID ${lost.mids}개, 프로모션 ${lost.promos}건\n저장할까요?`, '삭제하고 저장', () => formApply(d));
    else formApply(d);
  },
  ctDel() {
    const c = curCt() as Contract, p = pgOf(c), last = D.cts.filter(x => x.pg === p.id).length === 1;
    confirmBox('계약 삭제', `${p.name} / ${c.no} 계약을 삭제합니다.\n결제수단 ${c.methods.length}개, MID ${c.mids.length}개, 프로모션 ${c.promos.length}건이 함께 삭제됩니다.${last ? `\n${p.name}에 남은 계약이 없어 PG사도 함께 삭제됩니다.` : ''}\n삭제한 계약번호는 다시 쓰지 않습니다.`, '삭제', () => {
      D.cts = D.cts.filter(x => x !== c); if (last) D.pgs = D.pgs.filter(x => x !== p); save(); go(URLS.pgm, `${c.no} 계약을 삭제했습니다.`);
    });
  },
  ctStatus(el) {
    const c = curCt() as Contract, v = (el as HTMLInputElement).value as Use;
    const apply = () => { c.status = v; touch(c); UI.modal = null; render(); toast(`${c.no} 상태를 ${v}(으)로 바꿨습니다.`); };
    if (v === '미사용') { render(); confirmBox('상태 변경', `${c.no} 계약을 미사용으로 바꿉니다.\nMID ${c.mids.length}개를 결제에 쓰지 않습니다.`, '미사용으로 변경', apply); }
    else apply();
  },
  midNew() { const c = curCt() as Contract; UI.modal = { type: 'mid', view: false, id: null, d: midDraft(c), err: [], lv2: '', lv3: ALL }; render(); },
  midView(el) { const c = curCt() as Contract, m = c.mids.find(x => x.id === el.dataset.id); if (!m) return; UI.modal = { type: 'mid', view: true, id: m.id, d: midDraft(c, m), err: [], lv2: '', lv3: ALL }; render(); },
  midLv2() { if (UI.modal?.type === 'mid') { UI.modal.lv3 = ALL; render(); } },
  midProdAdd() {
    const md = UI.modal; if (md?.type !== 'mid' || !md.lv2) return;
    const d = md.d, whole = `${md.lv2} > ${ALL}`, v = `${md.lv2} > ${md.lv3 || ALL}`;
    if (d.products.includes(whole) || d.products.includes(v)) { toast(`이미 추가한 상품입니다 (${d.products.includes(whole) ? whole : v}).`); return; }
    // LV2 전체를 넣으면 같은 LV2의 LV3 항목은 겹치므로 뺀다
    d.products = md.lv3 === ALL ? [...d.products.filter(x => !x.startsWith(md.lv2 + ' > ')), v] : [...d.products, v];
    render();
  },
  midProdDel(el) { if (UI.modal?.type === 'mid') { UI.modal.d.products = UI.modal.d.products.filter(x => x !== el.dataset.v); render(); } },
  midEdit() { if (UI.modal?.type === 'mid') { UI.modal.view = false; render(); } },
  midSave() { const md = UI.modal; if (md?.type !== 'mid') return; const c = curCt() as Contract; md.err = midErrors(c, md.d); if (md.err.length) { render(); return; } midApply(c, md.d); },
  midDel(el) {
    const c = curCt() as Contract, m = c.mids.find(x => x.id === el.dataset.id); if (!m) return;
    // 이 MID를 지정한 프로모션, 그리고 결제수단의 마지막 MID면 '전체 MID' 프로모션도 대상이 없어지므로 함께 지운다
    const last = !c.mids.some(x => x !== m && x.method === m.method);
    const ps = c.promos.filter(p => p.mid === m.mid || (last && !p.mid && p.method === m.method));
    confirmBox('가맹점 삭제', `${m.name} (${m.mid})을 삭제합니다.${ps.length ? `\n대상 MID가 없어지는 프로모션 ${ps.length}건도 함께 삭제됩니다.` : ''}`, '삭제', () => {
      c.mids = c.mids.filter(x => x !== m); c.promos = c.promos.filter(p => !ps.includes(p)); touch(c); UI.modal = null; render(); toast(`${m.mid} 가맹점을 삭제했습니다.`);
    });
  },
  promoNew() { const c = curCt() as Contract; UI.modal = { type: 'promo', id: null, d: promoDraft(c), err: [] }; render(); },
  promoEdit(el) { const c = curCt() as Contract, p = c.promos.find(x => x.id === el.dataset.id); if (!p) return; UI.modal = { type: 'promo', id: p.id, d: promoDraft(c, p), err: [] }; render(); },
  promoMethod() { if (UI.modal?.type === 'promo') { UI.modal.d.mid = ''; UI.modal.d.products = []; render(); } },
  promoMid() { if (UI.modal?.type === 'promo') { const d = UI.modal.d; d.products = d.mid ? promoAllowed(curCt() as Contract, d.method, d.mid) : []; render(); } },
  promoSave() { const md = UI.modal; if (md?.type !== 'promo') return; const c = curCt() as Contract; md.err = promoErrors(c, md.d); if (md.err.length) { render(); return; } promoApply(c, md.d); },
  promoDel(el) {
    const c = curCt() as Contract, p = c.promos.find(x => x.id === el.dataset.id); if (!p) return;
    confirmBox('프로모션 삭제', `${p.name}을 삭제합니다.`, '삭제', () => { c.promos = c.promos.filter(x => x !== p); touch(c); UI.modal = null; render(); toast('프로모션을 삭제했습니다.'); });
  },
  easyNew() { UI.modal = { type: 'easy', name: '', code: '', err: [] }; renderModal(); ftCols($('#modal-root')); (document.querySelector('[data-b="modal.name"]') as HTMLInputElement)?.focus(); },
  easySave() {
    const md = UI.modal; if (md?.type !== 'easy') return;
    const name = md.name.trim(), code = md.code.trim().toUpperCase();
    md.err = easyErrors(name, code); if (md.err.length) { md.name = name; md.code = code; render(); return; }
    D.easyAdded.push([name, code]); save();
    if (UI.form && !UI.form.sel.includes(name)) UI.form.sel.push(name);
    UI.modal = null; render(); toast(`간편결제 '${name}' 추가 완료. 이 계약에 체크했습니다.`);
  },
  confirmOk() { if (UI.modal?.type === 'confirm') UI.modal.run(); },
  close() { UI.modal = null; render(); },
  dim() { /* 바깥 클릭으로는 닫지 않는다 (입력 중 실수 방지) */ },
  arr(el) { const path = el.dataset.p as string, v = (el as HTMLInputElement).value, a = getPath(UI, path) as string[]; setPath(UI, path, (el as HTMLInputElement).checked ? [...a, v] : a.filter(x => x !== v)); },
};

/* ================= 이벤트 ================= */
document.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
  if (!el || (el as HTMLButtonElement).disabled) return;
  if (el.dataset.a === 'dim' && e.target !== el) return;
  A[el.dataset.a as string]?.(el);
});
document.addEventListener('change', e => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.b) setPath(UI, el.dataset.b, el.value);
  if (el.dataset.c && A[el.dataset.c]) { A[el.dataset.c](el); return; }
  if (el.dataset.r !== undefined) render();
});
document.addEventListener('input', e => { const el = e.target as HTMLInputElement; if (el.dataset.b && el.type !== 'radio' && el.type !== 'checkbox' && el.tagName !== 'SELECT') setPath(UI, el.dataset.b, el.value); });
document.addEventListener('keydown', e => {
  const el = e.target as HTMLInputElement;
  if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); return; }
  if (e.key === 'Enter' && el.tagName === 'TR' && el.dataset.a) { A[el.dataset.a]?.(el); return; }
  if (e.key === 'Enter' && el.dataset.enter) { if (el.dataset.b) setPath(UI, el.dataset.b, el.value); A[el.dataset.enter]?.(el); }
});

/* ================= 시작 ================= */
if (PAGE === 'pgForm') UI.form = initForm();
if ((PAGE === 'ctr' || PAGE === 'pgD') && D.cts.length) {
  const c = curCt() as Contract;
  if (QP.get('ct') !== c.no) history.replaceState(null, '', `${location.pathname}?ct=${c.no}`);
  // 결제 이력 등에서 MID로 들어오면 그 가맹점 상세를 바로 연다
  const m = PAGE === 'ctr' && QP.get('id') ? c.mids.find(x => x.id === QP.get('id') || x.mid === QP.get('id')) : undefined;
  if (m) UI.modal = { type: 'mid', view: true, id: m.id, d: midDraft(c, m), err: [], lv2: '', lv3: ALL };
}
render();
try { const t = sessionStorage.getItem(TKEY); if (t) { sessionStorage.removeItem(TKEY); toast(t); } } catch { /* 토스트만 생략 */ }
