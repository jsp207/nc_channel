// @ts-nocheck
// 주문 프로세스 '코너 구성' 목록 공통 : 주문 프로세스 등록(order6-create.html)과 상품 전시 관리(product-v024.html)가 함께 쓴다.
// 코너 한 줄(.crow)과 코너 그룹 상자(.cgrp)의 HTML · 스타일을 여기 한 곳에서 정한다. 화면마다 다른 것(행 속성, 배지, 버튼)은 옵션으로 받는다.
// 쓰는 쪽은 목록을 감싸는 .tcol 에 'pcl' 클래스를 붙인다 (폭 · 스타일 적용 범위). 인라인 스크립트에서는 window.PCL 로 부른다.
//
// 옵션 o
//   ro          : 조회 전용 (순서 변경 손잡이 · 삭제 버튼 없음)
//   isSel(c)    : 선택한 코너인지
//   lock(c)     : 순서를 바꿀 수 없는 코너인지 (고정 코너 · 그룹 멤버)
//   rowAttrs(c,i) / grpAttrs(g) : 행 · 그룹 머리줄에 붙일 data-* 속성 문자열
//   pills(c)    : 코너명 아래 배지 줄 HTML (유형 배지는 typePill(c)로 만들 수 있다)
//   grpKey(c)   : 같은 그룹 배치를 묶는 키 (기본 c.grp.k, 없으면 c.grp.gid)
//   grpPre(g) / grpPost(g) : 그룹명 앞 · 뒤에 넣을 HTML (분기형 배지, 분기 미리보기 선택 등)
//   empty       : 코너가 없을 때 HTML
import "./process-corner-list.css";

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const XSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>';
/* 코너 유형 배지 : 상품 연동 → 연동(보라), 비화면(회색), 그 외(파랑) */
export const typePill = c => '<span class="pill ' + (c.t === '비화면' ? 'p-nv' : c.t === '상품 연동' ? 'p-green' : 'p-blue') + '">' + esc(c.t === '상품 연동' ? '연동' : c.t) + '</span>';
const fn = (f, d) => typeof f === 'function' ? f : () => d;

/* 코너 한 줄 : [손잡이 · 번호] 코너명 / 배지 줄 [삭제] */
export function rowHTML(c, i, o = {}) {
  const ro = !!o.ro, m = !!c.grp, lock = ro || fn(o.lock, false)(c) || m, sel = fn(o.isSel, false)(c);
  // 손잡이는 조회 화면 · 잠긴 코너에서도 자리를 남겨 코너명 세로줄을 맞춘다 (그룹 멤버는 CSS에서 빼고 여백으로 맞춘다)
  return '<div class="crow' + (sel ? ' sel' : '') + (c.epc ? ' fixed' : '') + (m ? ' gm' : '') + '" draggable="' + (lock ? 'false' : 'true') + '" ' + fn(o.rowAttrs, '')(c, i) + '>'
    + '<span class="ord"' + (lock ? '' : ' title="드래그하여 노출 순서 변경"') + '><i class="grip"' + (lock ? ' style="visibility:hidden"' : '') + ' aria-hidden="true">⠿</i><em>' + (i + 1) + '</em></span>'
    + '<div class="cmid"><b class="cnm">' + esc(c.n) + '</b><span class="cl2">' + (o.pills ? o.pills(c) : typePill(c)) + '</span></div>'
    + (lock ? '' : '<button class="xb" data-a="del" type="button" aria-label="삭제">' + XSVG + '</button>') + '</div>';
}

/* 목록 전체 : 같은 그룹 배치(키가 같은 연속 코너)는 그룹 상자 하나로 묶는다 */
export function listHTML(corners, o = {}) {
  const a = corners || [];
  if (!a.length) return o.empty != null ? o.empty : '<div class="tempty">코너 영역 설정</div>';
  const key = fn(o.grpKey, null), kOf = c => c.grp ? (o.grpKey ? key(c) : (c.grp.k || c.grp.gid)) : null;
  let h = '', i = 0;
  while (i < a.length) {
    const c = a[i], k = kOf(c);
    if (!k) { h += rowHTML(c, i, o); i++; continue; }
    const run = a.filter(x => kOf(x) === k), g = c.grp, ro = !!o.ro, at = fn(o.grpAttrs, '')(g);
    h += '<div class="cgrp" ' + at + '><div class="cgrp-h" draggable="' + (ro ? 'false' : 'true') + '" ' + at + (ro ? '' : ' title="드래그하여 그룹 순서 변경"') + '>'
      + '<i class="grip"' + (ro ? ' style="visibility:hidden"' : '') + ' aria-hidden="true">⠿</i>' + fn(o.grpPre, '')(g) + '<b class="cgrp-n">' + esc(g.n || g.gid || '') + '</b>' + fn(o.grpPost, '')(g)
      + (ro ? '' : '<button class="xb" data-a="gdel" data-gk="' + esc(k) + '" type="button" aria-label="그룹 삭제">' + XSVG + '</button>') + '</div>';
    run.forEach(x => { h += rowHTML(x, a.indexOf(x), o); });
    h += '</div>';
    i = a.indexOf(run[run.length - 1]) + 1;
  }
  return h;
}

if (typeof window !== 'undefined') window.PCL = { rowHTML, listHTML, typePill, XSVG };
