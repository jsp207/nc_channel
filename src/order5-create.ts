// @ts-nocheck
// 주문 프로세스 관리 v0.2.3 (order4-create.html 복사본). 화면 로직 대부분은 페이지 안 인라인 스크립트에 있고,
// 이 모듈은 그 위에 두 가지를 더한다 (인라인 스크립트의 전역 함수를 감싼다):
// 1) 상품 매핑 · 상속 규칙: 상품 일괄 매핑 대신, 상품 전시에서 이 프로세스를 불러와 매핑한 전시를 보여 주고
//    원 프로세스를 고쳤을 때 매핑된 상품 전시에 어떻게 반영할지 정한다 (종속 기준은 모 상품 전시 ID)
// 2) 코너 상세의 BO 운영 설정: 코너 관리 기본값 중 허용된 항목만 이 프로세스 값으로 덮어쓰고, 상품 전시에서 고칠 수 있는 항목을 정한다
import { requireAuthentication } from "./auth";
import { boSpec, boGet, boHtml, boBind, ITEMS } from "./corner-bo";

requireAuthentication();

const W = window;
const $ = s => document.querySelector(s);
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 1. 상품 매핑 · 상속 규칙 ----------
// [값, 이름, 권장 여부, 설명]
const APPLY = [
  ['auto', '자동 반영', 1, '새 버전이 승인되면 매핑된 상품 전시에 바로 반영해요. 상품에서 덮어쓴 값은 그대로 둬요'],
  ['confirm', '확인 후 반영', 0, '새 버전이 승인되면 매핑된 상품 전시에 업데이트 알림을 띄우고, 상품 담당자가 반영해요'],
  ['pin', '버전 고정', 0, '매핑할 때의 버전을 계속 써요. 새 버전은 상품 전시에서 직접 바꿔야 해요'],
];
const KEEP = [
  ['keep', '상품 값 유지', 1, '상품이 덮어쓴 값은 새 버전에서도 유지해요. 단, 이 프로세스에서 그 항목의 상품 수정 허용을 끄면 프로세스 값으로 돌아가요'],
  ['reset', '프로세스 값으로 초기화', 0, '새 버전이 반영되면 상품이 덮어쓴 값을 지우고 프로세스 값을 다시 써요'],
];
const DERIVE = [
  ['follow', '모 상품 전시를 따름', 1, '복사 · 채널별로 만든 파생 전시는 모 상품 전시 ID의 매핑과 덮어쓴 값을 그대로 이어받아요. 파생 전시에서는 바꿀 수 없어요'],
  ['own', '파생 전시에서 개별 수정', 0, '파생 전시도 허용 항목을 따로 덮어쓸 수 있어요. 모 상품 전시를 바꾸면 덮어쓰지 않은 항목만 따라가요'],
];
const INH_DEF = { apply: 'auto', keep: 'keep', derive: 'follow' };
const nameOf = (L, v) => (L.find(x => x[0] === v) || L[0])[1];
let INH = clone(INH_DEF), INHKEY = '';

// 매핑된 상품 전시 (샘플): 프로세스의 매핑 전시 수(cnt)만큼 상품 전시 관리 샘플처럼 만든다. 세 번째마다 앞 전시의 파생 전시
const OVR = ['할부 · 요금제 노출', '없음', '가입 방식', '요금제 노출 규칙', '없음', '할부'];
function mapped(t) {
  const n = t && t.cnt || 0, P = (W.PRODS || []).filter(p => p.type === '단말'), ver = verOf(t), L = [];
  for (let i = 0; i < n; i++) {
    const id = String(100 + i * 7).padStart(6, '0'), p = P[i % Math.max(1, P.length)] || { n: '샘플 상품' };
    const der = i % 3 === 2, parent = der ? L[i - 1].id : id;
    L.push({ id, n: `${p.n} ${der ? '(T 다이렉트샵 파생)' : '구매 혜택'}`, parent, der, ovr: der && INH.derive === 'follow' ? L[i - 1].ovr : OVR[i % OVR.length], old: i % 4 === 1 });
  }
  return L.map(x => ({ ...x, ...applied(x, ver) }));
}
const verOf = t => (t && (t.ver || (t.det && t.det.ver))) || 'V.1';
// 반영 방식에 따른 적용 버전 · 상태 (old = 지난 버전으로 매핑한 전시)
function applied(x, ver) {
  const prev = ver + ' 이전 버전';
  if (INH.apply === 'auto' || !x.old) return { ver, st: ['ok', '최신'] };
  if (INH.apply === 'confirm') return { ver: prev, st: ['wait', '업데이트 대기'] };
  return { ver: prev, st: ['pin', '버전 고정'] };
}
const radios = (name, L, v, ro) => `<div class="mp-opts" role="radiogroup">${L.map(([k, n, rec, d]) => `<label class="mp-opt"><input type="radio" name="${name}" value="${k}"${k === v ? ' checked' : ''}${ro ? ' disabled' : ''}><b>${n}${rec ? '<em>권장</em>' : ''}</b><small>${d}</small></label>`).join('')}</div>`;
W.renderMap = function () {
  const box = $('#secMap'); if (!box) return;
  const t = W.curT, ro = !!W.RO, key = `${W.MODE}:${t ? t.id : 'new'}`;
  if (key !== INHKEY) { INHKEY = key; INH = clone((t && t.inh) || INH_DEF); }
  const L = mapped(W.MODE === 'reg' ? null : t), shown = L.slice(0, 6);
  const list = !L.length
    ? `<div class="mp-empty">${W.MODE === 'reg' ? '저장 · 승인한 뒤 상품 전시에서 이 프로세스를 불러오면 여기에 보여요.' : '이 프로세스를 매핑한 상품 전시가 없어요.'}<br>상품은 상품 전시 화면에서 상품별로 매핑해요 (이 화면에서 상품을 일괄 지정하지 않아요)</div>`
    : `<div class="mp-tw"><table class="mp-t"><thead><tr><th>전시 ID</th><th>전시명</th><th>모 상품 전시 ID</th><th>상품에서 덮어쓴 항목</th><th>적용 버전</th><th>반영 상태</th></tr></thead><tbody>${shown.map(x =>
      `<tr><td class="mono">${x.id}</td><td class="l">${esc(x.n)}</td><td class="mono">${x.parent}${x.der ? ' <span class="sub">파생</span>' : ''}</td><td>${esc(x.ovr)}${x.der && INH.derive === 'follow' ? ' <span class="sub">모 전시 값</span>' : ''}</td><td>${x.ver}</td><td><span class="mp-b ${x.st[0]}">${x.st[1]}</span></td></tr>`).join('')}</tbody></table></div>${L.length > shown.length ? `<p class="mp-more">외 ${L.length - shown.length}건 · 상품 전시 목록에서 이 프로세스로 걸러 볼 수 있어요</p>` : ''}`;
  box.innerHTML = `<p class="mp-note">상품은 <b>상품 전시에서 상품별로 이 프로세스를 불러와 매핑</b>해요. 대량 매핑 · 교체로 생기는 오류를 막으려고 이 화면에서는 상품을 지정하지 않아요.
    상품 전시는 코너 상세의 <b>상품 전시 수정 허용</b>을 켠 항목(할부 · 가입 유형 · 요금제 노출 등)만 덮어쓸 수 있어요.</p>
    <div class="mp-h">매핑된 상품 전시 <small>${L.length}건 · 종속 기준은 모 상품 전시 ID</small></div>${list}
    <div class="mp-h">원 프로세스를 고치면 <small>승인된 새 버전을 매핑된 상품 전시에 반영하는 방식</small></div>${radios('mpApply', APPLY, INH.apply, ro)}
    <div class="mp-h">상품에서 덮어쓴 값 <small>새 버전이 반영될 때</small></div>${radios('mpKeep', KEEP, INH.keep, ro)}
    <div class="mp-h">파생 상품 전시 <small>모 상품 전시 ID를 기준으로 종속</small></div>${radios('mpDerive', DERIVE, INH.derive, ro)}
    <div class="mp-h">항상 적용하는 규칙</div>
    <ul class="mp-fix"><li>매핑 단위는 모 상품 전시 ID예요. 파생 전시는 모 전시를 통해서만 이 프로세스와 이어져요</li>
      <li>컨테이너 · 코너 구성과 순서는 상품 전시에서 바꿀 수 없어요. 순서나 구성이 다르면 새 프로세스를 만들어 매핑해요</li>
      <li>코너를 삭제하면 그 코너에 상품이 덮어쓴 값도 함께 지워져요</li>
      <li>코너 관리에서 '프로세스에서 변경 허용'을 끄면 이 프로세스와 상품 전시의 덮어쓴 값은 쓰지 않고 코너 관리 값을 써요</li></ul>`;
  $('#tgSt').textContent = INH.apply === INH_DEF.apply && INH.keep === INH_DEF.keep && INH.derive === INH_DEF.derive ? '권장값' : '변경됨';
  $('#tgSt').classList.add('done');
  $('#tgSum').textContent = `매핑 전시 ${L.length}건 · ${nameOf(APPLY, INH.apply)}`;
};
$('#secMap').addEventListener('change', e => {
  const r = e.target.closest('input[type=radio]'); if (!r || W.RO) return;
  const k = { mpApply: 'apply', mpKeep: 'keep', mpDerive: 'derive' }[r.name]; if (!k) return;
  INH[k] = r.value; W.dirty && W.dirty(); W.renderMap();
});
// 저장할 때 상속 규칙을 프로세스에 함께 담는다 (snap은 저장 · 승인 요청 때 부른다)
const coreSnap = W.snap;
W.snap = function (t) { coreSnap(t); t.inh = clone(INH); };

// ---------- 2. 코너 상세의 BO 운영 설정 ----------
// 코너 객체(c)에 이 프로세스 값을 담는다: c.bo = { ov: 덮어쓴 항목 값, prod: 상품 전시 수정 허용 }
// 컨테이너 구성은 저장할 때 JSON으로 통째로 남으므로(snap) c.bo도 함께 저장된다
let BOST = null;
function boState(c) {
  const cfg = boGet(c.id);
  if (!c.bo) c.bo = { ov: {}, prod: clone(cfg.prod) };
  // 코너 관리에서 허용을 끈 항목은 덮어쓴 값을 쓰지 않는다
  Object.keys(c.bo.ov).forEach(k => { if (!cfg.allow[k]) delete c.bo.ov[k]; });
  return { id: c.id, mode: 'proc', cfg, ov: c.bo.ov, prod: c.bo.prod, ro: !!W.RO };
}
function drawBo() {
  const box = $('#boBox'); if (!box || !BOST) return;
  const sp = boSpec(BOST.id), n = Object.keys(BOST.ov).length, np = ITEMS.filter(([k]) => BOST.cfg.allow[k] && BOST.prod[k]).length;
  $('#boSum').textContent = `이 프로세스 값 ${n}개 · 상품 전시 수정 허용 ${np}개`;
  box.innerHTML = boHtml(sp, BOST);
}
const coreDetail = W.renderDetail;
W.renderDetail = function () {
  coreDetail.apply(this, arguments);
  const c = W.sel, d = $('#detail'); BOST = null;
  if (!c || !d) return;
  const sp = boSpec(c.id); if (!sp || !sp.has) return;
  BOST = boState(c);
  const sec = document.createElement('div');
  sec.className = 'dsec bo-sec';
  sec.innerHTML = `<h4>BO 운영 설정 <small id="boSum"></small></h4><p class="bo-head">코너 관리 기본값 위에 허용된 항목만 이 프로세스 값으로 덮어써요. '상품 전시 수정 허용'을 켠 항목은 상품 전시에서 이 프로세스를 불러온 뒤 상품별로 다시 고칠 수 있어요.</p>
    <div class="bo-flow" aria-hidden="true"><span>코너 관리 기본값</span><i>→</i><span class="on">주문 프로세스 (허용 항목만)</span><i>→</i><span>상품 전시 (허용 항목만)</span></div><div class="bo" id="boBox"></div>`;
  d.appendChild(sec);
  drawBo();
};
// #detail은 컨테이너를 펼칠 때마다 다른 칸으로 옮겨지지만 같은 요소라 한 번만 묶는다
boBind($('#detail'), () => BOST, drawBo, () => { if (W.dirty) W.dirty(); const n = $('#boSum'); if (n && BOST) n.textContent = `이 프로세스 값 ${Object.keys(BOST.ov).length}개 · 상품 전시 수정 허용 ${ITEMS.filter(([k]) => BOST.cfg.allow[k] && BOST.prod[k]).length}개`; });

// 모듈은 인라인 스크립트보다 늦게 읽히므로, 이미 열린 화면이 있으면 한 번 다시 그린다
W.renderMap();
if (W.sel) W.renderDetail();
