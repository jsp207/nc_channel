// @ts-nocheck
// 주문 프로세스 관리 v0.2.3 (order4-create.html 복사본). 화면 로직 대부분은 페이지 안 인라인 스크립트에 있고,
// 이 모듈은 코너 상세의 '문구'와 '노출 규칙' 영역을 채운다: 코너 관리 기본값 중 허용된 항목만 '이 프로세스에서 변경'으로 덮어쓴다.
// 코너 상세 순서는 문구 → 노출 목록(인라인 스크립트) → 노출 규칙이다 (인라인 스크립트의 전역 함수를 감싼다).
//
// 상품은 이 화면에서 지정하지 않는다. 상품 전시에서 상품별로 이 프로세스를 불러와 매핑하고 값을 덮어쓴다(상품 전시 화면에서 작업 예정).
// 상품 전시에서는 기본적으로 모든 항목을 고칠 수 있다(항목별 상품 수정 허용은 두지 않는다).
// 상속 정책(확정, 화면에서 고르지 않음):
//  - 원 프로세스를 고치면: 승인된 새 버전을 매핑된 상품 전시에 자동 반영한다
//  - 상품에서 덮어쓴 값: 새 버전에서도 유지한다
//  - 파생 상품 전시: 모 상품 전시 ID를 따른다(매핑과 덮어쓴 값을 그대로 이어받고, 파생 전시에서는 바꿀 수 없다)
import { requireAuthentication } from "./auth";
import { boSpec, boGet, boHtml, boBind } from "./corner-bo";
import { publishProcs } from "./order-process-data";

requireAuthentication();

const W = window;
const $ = s => document.querySelector(s);

// 코너 객체(c)에 이 프로세스 값을 담는다: c.bo = { ov: 덮어쓴 항목 값 }
// 컨테이너 구성은 저장할 때 JSON으로 통째로 남으므로(snap) c.bo도 함께 저장된다
// 노출 규칙은 일단 뺐다(코너 관리에는 남아 있지만 프로세스에서는 쓰지 않는다)
const SLOTS = [['slotTxt', 'txt']];
const LABELS = {};
let BOST = null;
function boState(c) {
  const cfg = boGet(c.id);
  if (!c.bo) c.bo = { ov: {} };
  delete c.bo.ov.rule;
  // 코너 관리에서 허용을 끈 항목은 덮어쓴 값을 쓰지 않는다
  Object.keys(c.bo.ov).forEach(k => { if (!cfg.allow[k]) delete c.bo.ov[k]; });
  return { id: c.id, mode: 'proc', cfg, ov: c.bo.ov, ro: !!W.RO, noSrc: true, bare: true, labels: LABELS };
}
// 조회 화면(renderDetailRO)에는 칸이 없어 만들어 넣는다: 문구는 머리줄 바로 아래
function ensureSlots(d) {
  if (d.querySelector('#slotTxt')) return;
  const mk = id => { const x = document.createElement('div'); x.className = 'dsec bo-slot'; x.id = id; x.hidden = true; return x; };
  const head = d.querySelector('.dhd');
  head ? head.after(mk('slotTxt')) : d.prepend(mk('slotTxt'));
}
function drawBo() {
  if (!BOST) return;
  const sp = boSpec(BOST.id);
  SLOTS.forEach(([id, k]) => {
    const el = $('#' + id); if (!el) return;
    const on = sp.items.includes(k);
    el.hidden = !on;
    el.innerHTML = on ? `<div class="bo flat">${boHtml(sp, { ...BOST, only: [k] })}</div>` : '';
  });
}
const coreDetail = W.renderDetail;
W.renderDetail = function () {
  coreDetail.apply(this, arguments);
  const c = W.sel, d = $('#detail'); BOST = null;
  if (!c || !d || c.nv) return;
  const sp = boSpec(c.id); if (!sp || !sp.has) return;
  BOST = boState(c);
  ensureSlots(d);
  drawBo();
};
// #detail은 컨테이너를 펼칠 때마다 다른 칸으로 옮겨지지만 같은 요소라 한 번만 묶는다
boBind($('#detail'), () => BOST, drawBo, () => { if (W.dirty) W.dirty(); });

// 모듈은 인라인 스크립트보다 늦게 읽히므로, 이미 열린 화면이 있으면 한 번 다시 그린다
if (W.sel) W.renderDetail();

// 상품 전시 관리 v0.2.4(product-v024.html)의 주문 구성안 목록으로 쓰도록 프로세스 목록을 저장소에 남긴다. 열 때 한 번, 저장할 때마다 다시 남긴다
const publish = () => { if (Array.isArray(W.DATA)) publishProcs(W.DATA, W.NOW || ''); };
const coreSave = W.doSave;
if (typeof coreSave === 'function') W.doSave = function () { const r = coreSave.apply(this, arguments); publish(); return r; };
publish();
