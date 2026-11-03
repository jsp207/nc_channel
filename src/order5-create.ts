// @ts-nocheck
// 주문 프로세스 관리 v0.2.3 (order4-create.html 복사본). 화면 로직 대부분은 페이지 안 인라인 스크립트에 있고,
// 이 모듈은 코너 상세에 BO 운영 설정을 더한다: 코너 관리 기본값 중 허용된 항목만 이 프로세스 값으로 덮어쓰고,
// 상품 전시에서 고칠 수 있는 항목(상품 전시 수정 허용)을 정한다 (인라인 스크립트의 전역 함수를 감싼다).
//
// 상품은 이 화면에서 지정하지 않는다. 상품 전시에서 상품별로 이 프로세스를 불러와 매핑하고, 허용 항목만 덮어쓴다(상품 전시 화면에서 작업 예정).
// 상속 정책(확정, 화면에서 고르지 않음):
//  - 원 프로세스를 고치면: 승인된 새 버전을 매핑된 상품 전시에 자동 반영한다
//  - 상품에서 덮어쓴 값: 새 버전에서도 유지한다. 단, 프로세스에서 그 항목의 상품 수정 허용을 끄면 프로세스 값으로 돌아간다
//  - 파생 상품 전시: 모 상품 전시 ID를 따른다(매핑과 덮어쓴 값을 그대로 이어받고, 파생 전시에서는 바꿀 수 없다)
import { requireAuthentication } from "./auth";
import { boSpec, boGet, boHtml, boBind, ITEMS } from "./corner-bo";

requireAuthentication();

const W = window;
const $ = s => document.querySelector(s);
const clone = o => JSON.parse(JSON.stringify(o));

// ---------- 코너 상세의 BO 운영 설정 ----------
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
if (W.sel) W.renderDetail();
