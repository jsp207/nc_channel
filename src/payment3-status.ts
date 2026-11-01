// @ts-nocheck
// 결제수단 기준정보 관리 v0.2.1: 목록과 상세가 함께 쓰는 운영상태 변경 모달 · 토스트.
import "./payment3-modal.css";
import { CORNERS, DB, KEYST, STATUSES, conOf, dupContract, esc, expSoon, keyOk, log, midById, midOf, midValidToday, pgOf, save, stamp, ME } from "./payment3-store";

let toastTimer;
export function toast(msg, bad) {
  let el = document.querySelector('.pm-toast');
  if (!el) { el = document.createElement('div'); el.className = 'pm-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.toggle('bad', !!bad);
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2800);
}

const stCls = { 사용: 'ok', 일시중지: 'warn', 미사용: 'off' };
const stBadge = s => `<span class="pm-st ${stCls[s]}">${esc(s)}</span>`;
const info = (h, k = '') => `<div class="pm-info ${k}">${h}</div>`;

let md = null, onDone = null, lastFocus = null;
const root = () => document.getElementById('modal-root');

// id: 변경할 계약. '이 계약만 / 이 MID의 모든 계약' 범위를 고를 수 있다.
export function openStatus(id, done) {
  md = { id, scope: 'one', to: conOf(id).status === '사용' ? '일시중지' : '사용', reason: '', ack: false };
  onDone = done;
  lastFocus = document.activeElement;
  draw();
  root().querySelector('.pm-x').focus();
}
function close() {
  md = null;
  root().innerHTML = '';
  lastFocus?.focus?.();
}
const targets = () => (md.scope === 'mid' ? DB.contracts.filter(c => c.mid === conOf(md.id).mid) : [conOf(md.id)]);
function evaluate() {
  const to = md.to, change = [], skip = [];
  targets().forEach(c => {
    const m = midOf(c);
    if (c.status === to) skip.push({ c, why: `이미 ${to} 상태` });
    else if (to === '사용' && !keyOk(m)) skip.push({ c, why: `키 ${KEYST[m.ks]} (V12)` });
    else if (to === '사용' && !midValidToday(m)) skip.push({ c, why: 'MID 유효기간 밖 (V12)' });
    else change.push(c);
  });
  const impact = [];
  if (to !== '사용') {
    const ids = new Set(change.map(c => c.id)), mids = new Set(change.map(c => c.mid));
    CORNERS.forEach(k => {
      const hit = k.items.filter(i => { const cc = dupContract(i.mid, i.method); return cc && ids.has(cc.id); });
      if (hit.length) impact.push({ k, items: hit.map(i => ({ i, alt: DB.contracts.filter(x => x.method === i.method && x.status === '사용' && !ids.has(x.id) && !mids.has(x.mid) && keyOk(midOf(x)) && midValidToday(midOf(x))) })) });
    });
  }
  return { change, skip, impact };
}
function gate() {
  const ev = evaluate();
  return !ev.change.length ? '변경할 계약이 없어요.' : !md.reason.trim() ? '변경 사유를 입력해 주세요. (V13)' : ev.impact.length && !md.ack ? '영향 범위 확인에 체크해 주세요. (V14)' : '';
}
function syncGate() {
  const g = gate();
  root().querySelector('#stWhy').textContent = g;
  root().querySelector('#stOk').disabled = !!g;
}
function draw() {
  const first = conOf(md.id), m = midOf(first), ev = evaluate(), sameMid = DB.contracts.filter(c => c.mid === first.mid).length, g = gate();
  const row = c => `<tr><td class="pm-mono">${esc(midOf(c).code)}</td><td>${esc(c.method)}</td><td>${stBadge(c.status)} → ${stBadge(md.to)}</td></tr>`;
  const skipRow = x => `<tr class="pm-skip"><td class="pm-mono">${esc(midOf(x.c).code)}</td><td>${esc(x.c.method)}</td><td>제외 · ${esc(x.why)}</td></tr>`;
  const altHtml = r => r.alt.length
    ? `대체 MID 후보 ${r.alt.map(a => { const am = midOf(a); return `<span class="pm-cp">${esc(pgOf(am.pg).name)} ${esc(am.code)} · ${esc(am.purpose)}${expSoon(am) ? ' · 만료 임박' : ''}</span>`; }).join(' ')}`
    : `<span class="pm-bad">대체 후보가 없어요. 이 코너에서 ${esc(r.i.method)}가 빠질 수 있어요. (확인필요)</span>`;
  const impactHtml = md.to === '사용'
    ? info('사용으로 바꾸려면 MID 키가 확인완료 또는 수동확인이고 유효기간 안이어야 해요. (V12)')
    : ev.impact.length
      ? `<h3>결제 코너 영향</h3>${info('아래 코너에서 이 계약을 쓰고 있어요. 코너 반영은 코너 관리 도메인에서 해요. 결제 BO는 영향과 대체 후보만 안내해요.', 'warn')}
         ${ev.impact.map(x => `<div class="pm-corner"><div class="pm-corner-h"><b>${esc(x.k.name)}</b><span class="pm-cp">${x.k.id}</span><small>${esc(x.k.where)}</small></div>
           ${x.items.map(r => { const mm = midById(r.i.mid); return `<div class="pm-corner-i"><b>${esc(r.i.method)}</b> <span class="pm-mono">${esc(mm.code)}</span> ${esc(mm.purpose)}<div class="pm-alt">${altHtml(r)}</div></div>`; }).join('')}</div>`).join('')}
         <label class="pm-ck"><input type="checkbox" id="stAck" ${md.ack ? 'checked' : ''}>영향받는 코너와 대체 MID 안내를 확인했어요.</label>`
      : info('이 변경으로 영향받는 결제 코너가 없어요.', 'ok');
  root().innerHTML = `<div class="pm-dim"><div class="pm-box" role="dialog" aria-modal="true" aria-labelledby="pmTitle">
    <div class="pm-h"><div><h2 id="pmTitle">운영상태 변경</h2><p>${esc(pgOf(m.pg).name)} · ${esc(first.method)} · ${esc(m.code)} (${esc(m.purpose)})</p></div><button type="button" class="pm-x" data-close aria-label="닫기">×</button></div>
    <div class="pm-b">
      <div class="pm-form">
        <div class="pm-l">변경 범위</div><div class="pm-c"><label class="pm-ck"><input type="radio" name="stScope" value="one" ${md.scope === 'one' ? 'checked' : ''}>이 계약만</label><label class="pm-ck"><input type="radio" name="stScope" value="mid" ${md.scope === 'mid' ? 'checked' : ''}>이 MID의 모든 계약 (${sameMid}건)</label></div>
        <div class="pm-l">변경할 상태 <i>*</i></div><div class="pm-c">${STATUSES.map(s => `<label class="pm-ck"><input type="radio" name="stTo" value="${s}" ${md.to === s ? 'checked' : ''}>${stBadge(s)}</label>`).join('')}</div>
        <div class="pm-l"><label for="stReason">변경 사유 <i>*</i></label></div><div class="pm-c"><textarea id="stReason" rows="2" maxlength="200" placeholder="예) PG 정기 점검으로 11/3~11/5 일시중지">${esc(md.reason)}</textarea></div>
      </div>
      <h3>대상 <small>변경 ${ev.change.length}건 · 제외 ${ev.skip.length}건</small></h3>
      <table class="pm-t"><tbody>${ev.change.map(row).join('')}${ev.skip.map(skipRow).join('')}</tbody></table>
      <div class="pm-impact">${impactHtml}</div>
    </div>
    <div class="pm-f"><span class="pm-why" id="stWhy">${esc(g)}</span><button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary pri" id="stOk" ${g ? 'disabled' : ''}>${ev.change.length}건 ${md.to}(으)로 변경</button></div>
  </div></div>`;
}
function confirmChange() {
  if (gate()) return;
  const ev = evaluate(), to = md.to, reason = md.reason.trim();
  ev.change.forEach(c => {
    const b = c.status;
    c.status = to; c.upd = stamp(); c.by = ME;
    log(c.id, `${b} → ${to} (사유: ${reason})${ev.impact.length ? ` · 영향 코너 ${ev.impact.length}개 안내 확인` : ''}`);
  });
  save();
  const done = onDone;
  close();
  toast(`${ev.change.length}건을 ${to}(으)로 바꿨어요.`);
  done?.();
}
document.addEventListener('click', e => {
  if (!md) return;
  if (e.target.closest('[data-close]') || e.target.classList.contains('pm-dim')) close();
  else if (e.target.id === 'stOk') confirmChange();
});
document.addEventListener('change', e => {
  if (!md) return;
  const t = e.target;
  if (t.name === 'stScope') { md.scope = t.value; md.ack = false; draw(); }
  else if (t.name === 'stTo') { md.to = t.value; md.ack = false; draw(); }
  else if (t.id === 'stAck') { md.ack = t.checked; syncGate(); }
});
document.addEventListener('input', e => {
  if (md && e.target.id === 'stReason') { md.reason = e.target.value; syncGate(); }
});
document.addEventListener('keydown', e => { if (md && e.key === 'Escape') close(); });
