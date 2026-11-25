// @ts-nocheck
// 상품 전시 관리 v0.3.1 최종 (product-v031.html). 11-25: v0.3.1 · v0.3.2를 하나로 합쳐 v0.3.1로 관리한다(v0.3.2 파일은 지웠다).
// - 목록 · 등록을 한 파일로 합쳤다. 화면 선택은 src/page-product-v031.ts · src/unify.ts, 목록 스크립트는 src/display-list2.ts
// - 11-25 시안 반영: 섹션 머리줄(상태 배지 → 필수 배지, 제목 옆), 전시 유형 표, 연결 상품 표 열 · 버튼 위치, 공제항목 반영 행 제외,
//   타이틀 표, 대상 상품 없음 안내, 노출 채널 표기(전시 채널 · 통합 App · 통합 Web · T-Gate)
// 이전 v0.3.2 작업분 (display-create-v32.ts였던 내용). 바뀐 점:
// - 전시 정보 이미지: 모바일 · 데스크탑 구분을 없애고 v0.2.0(product-v020.html)처럼 대표이미지(1장) · 추가이미지(최대 4장)로 나눈다
// - 공통 속성(노출 채널 섹션 안, 노출 채널 표 아래 · 채널별 탭 위. 읽기 전용이라 별도 섹션 없이 병합): 자상품 그룹명 · SIM 구분 · 유심 필수구매 · 사전예약 · 색상/용량(보기) · 약정(상담신청 대상은 제외).
//   EPC 기본 설정값을 공통으로 쓰며 수정 불가(보기만)
// - 채널별 노출 제어(노출 채널 섹션의 노출 채널 표 아래): 노출 채널마다 탭으로 모상품 그룹명 · 채널별 재고 · 가입유형(1개 이상 필수) · 할부개월수(가입유형별) · 배송방식(일반배송 · 행복배송 · 바로도착 · 바로픽업 등) · 바로주문(단말만) · 기프트 · 티다팩.
//   EPC 설정값을 기본으로 불러오고 필요한 항목만 수정(E.chset[채널].ov), 항목별 · 채널별 EPC 값으로 복원
//   가입유형 · 할부 · 노출 서비스는 연결 상품에 휴대폰 또는 요금제가 있을 때만
// - 주문 프로세스 연동의 '채널 관리 항목 노출'(E.chHide)은 채널별 노출 제어로 옮겨 뺐다. 미리보기의 가입 · 할부 · 배송 코너는 미리보기 채널의 채널별 설정을 따른다
// - T기프트 · 티다팩 섹션 재적용(v0.2.4에서 뺀 섹션, 주문 프로세스 연동 바로 위): 단말기(기기서비스)를 연결하면 T기프트, 요금제를 연결하면 티다팩.
//   목록은 CVM이 아니라 EPC에서 조회한다. 연결 상품 조건에 맞는 항목은 자동으로 올라오고([T기프트 조회] · [티다팩 조회]로 기획전 전용 항목 추가),
//   여기서는 순서 · 연결 해제 · 자동 배지만 정한다. 채널별 노출 여부는 채널별 노출 제어의 T기프트 · 티다팩(Y/N)을 따른다
// 이전: 상품 전시 관리 v0.3.1 (display-create-v30.ts v0.3 복사본, product-v031.html). 바뀐 점:
// - 화면을 두 영역으로 나눈다: 공통(모든 채널) · 통합 앱 전용(통합 APP · WEB에만 적용)
//   · T-gate · 스마트플래너는 공통 영역의 전시 정보 · 콘텐츠 정보만 쓴다. 노출 제어 조건(후기 · 연관 상품 · 주문 · 채널 관리 항목)은 통합 앱에만 적용
//   · 노출 채널(전시 설정 → 노출 채널)은 전시 정보 위. 통합 APP · WEB을 고를 때만 맨 아래 통합 앱 전용 영역(구매 후기 → 전문가 리뷰 → 연관 및 유사 상품 → 주문 프로세스 연동)이 보인다.
//     고르지 않으면 영역째 숨기고 검사하지 않는다(값은 남는다). 예: 스마트플래너만 고르면 전시 정보 · 콘텐츠 정보까지만 보인다
//   · 공제항목 반영은 노출 채널에서 연결 상품 섹션 맨 아래로 옮겼다
// - 주문 프로세스 연동: 프로세스 · 코너 조건(컨테이너 · 코너 설정, 문구 · 노출 목록 덮어쓰기 orderOv)을 뺐다.
//   주문 받기 ON/OFF · 프로세스 선택 팝업(주문 유형 바인딩) · [주문 프로세스에서 확인 ↗](order7-create.html?id=…)만 남긴다
// - 채널에서만 관리하는 항목(가입 유형 · 할부 유형 · 배송 유형)은 노출 여부만 체크한다. 값은 연결 상품(EPC)이 가진 값의 합집합(복합형은 모든 구성 영역),
//   기본 모두 노출 · 숨길 값만 체크 해제(E.chHide). 값 정의는 src/data/epc-codes.json chItems
// 이전: 상품 전시 관리 v0.3 (display-create-v25.ts v0.2.4 복사본). ref/product-admin-prototype-v30.html 검토 후 '연관 및 유사 상품' 영역 변경:
// - 머리줄 노출 스위치를 빼고, 문구 위 표 첫 줄에 '사용 여부' 라디오(N/Y, 기본 N)를 둔다. N이면 아래 항목을 숨긴다
// - '수급' 라디오: CVM 데이터 연동(기본) · 운영자 설정. 예전 '문구(기본 문구 · 직접 입력)'와 '노출 방식(자동 노출 · 직접 지정)'을 이 하나로 합쳤다
//   · CVM 데이터 연동: 타이틀은 '이런 상품은 어떠세요?'로 고정. 노출 결과의 [CVM 불러오기]를 누르면 CVM이 보내 주는 상품(예시)을 받아 E.rel.cvm에 둔다
//   · 운영자 설정: 타이틀(최대 20자)을 고칠 수 있다. 노출 결과에서 상품을 조회해 추가하고 끌어서 순서를 바꾼다(v0.2.4 직접 지정과 같음)
//   · v0.3: 소타이틀은 뺐다
//   값: E.related(사용 여부), E.rel.mode('auto'=CVM · 'manual'=운영자), E.sim.mode('def' · 'custom', E.rel.mode에 맞춘다)
// 상품 전시 관리 v0.2.4 (display-create-v24.ts v0.2.3 복사본). ref/product-admin-prototype-v024.html 반영 + 주문 프로세스 관리 v0.2.4(order6-create.html) 연동 (처음엔 v0.2.3 order5와 연동):
// - 주문 구성 방식의 '사용할 주문 구성안'은 주문 프로세스 관리 목록(order-process-data.ts)에서 고른다. 승인 완료 · 사용 Y 프로세스만 연결할 수 있다.
// - 코너의 문구 · 노출 목록은 이 전시에서 덮어쓸 수 있다(orderOv). 요금제 코너는 고객 선택 방식(연결 상품) 기준이라 읽기 전용.
// - 가입 유형 · 할부 설정 · 배송 유형 섹션(통합 APP · WEB 주문 단계)은 이 화면에서 뺐다(E.noSteps). 주문 프로세스 관리에서 가져와 정할 예정.
// - 원 프로세스를 고치면 승인된 새 버전이 자동 반영된다(order5 상속 정책): 열 때마다 저장소의 최신 프로세스로 컨테이너 · 코너를 다시 읽는다.
// - 고객 선택 방식: 상품 유형은 LV3 조합 배지만 보여 준다(주문 유형 · 프로세스 수 안내는 뺐다).
// - T기프트 · 티다팩 섹션(자동 배지 · 미리보기 포함)도 뺐다. 주문(주문 프로세스의 코너)에서 다시 적용할 예정.
// - 구성안을 연결하면 주문 구성 방식 아래에 order5-create.html과 같은 '컨테이너·코너 설정' 카드가 생긴다. 컨테이너는 아코디언(한 번에 하나), 펼치면 왼쪽 코너 목록 · 오른쪽 코너 설정.
// - 주문 받기 OFF: 대체 버튼 · 버튼 문구 · 이동할 전시만 정한다(안내 문구 · 주문 자동 시작 · 고객 화면 하단 미리보기는 뺐다).
// v0.2.3: ref/product-admin-prototype-v024-1.html 반영:
// EPC 상품을 LV2(서비스 도메인) · LV3(서비스 유형) · Product Spec으로 조회하고, 연결 상품 목록도 같은 기준으로 보여 준다. 상세 팝업에 LV3 계약 · 회선 · 가입 속성을 보여 준다.
// 대표 상품을 없앴다: 화면의 상품 유형은 연결 상품 LV3의 조합으로 보여 주고, 주문 구성안 · 주문 단계를 정하는 값(svc)은 연결 상품 구성에서 계산한다.
// v0.2.2: ref/product-admin-prototype-v023.html 반영:
// 고객 선택 방식에서 상품 유형을 직접 고르지 않고 대표 상품 1개를 지정한다. 상품 유형은 대표 상품의 EPC 상품 구분으로 정해지고(읽기 전용),
// 주문 구성안 종류 · 통합 APP · WEB 주문 단계(가입 유형 · 할부 · 배송)가 그에 따라 바뀐다. 복합형은 구성 영역별로 묶어 보여 주고 대표 상품이 든 영역을 대표 영역으로 표시한다.
// 원본 v0.2: ref/display-admin-prototype-v3.html의 전시 등록 흐름(전시 유형 → 연결 상품 → 고객 선택 방식 → 기본 정보 → 상세 설명 → 콘텐츠 정보 → 검색 노출 → 주문 구성)을
// product-create3 화면 구성(왼쪽 모바일 미리보기, 접히는 섹션, 하단 검사 바)으로 옮긴 버전.
import "./style.css";
// 컨테이너 · 코너 영역은 order5-create.html 스타일을 그대로 옮긴 파일을 쓴다
import "./order5-container.css";
// 코너 구성 목록은 주문 프로세스 등록(order6-create.html)과 같은 공통 모듈로 그린다
import { listHTML as pclList } from "./process-corner-list";
import { requireAuthentication } from "./auth";
// EPC 샘플 상품 · 샘플 전시 · 저장소는 display-data.ts (상품 전시 일괄 관리와 함께 쓴다)
import {
 TODAY, NOW, TYPES, ONCE, seedNum, PO, poBy, selPS, hasSel, PSLIST, psBy, COLOR, BCOL, MSG1, MSG2, TPL, tplBy, poTpls, nid, CVM_MAX, CVM_LEN, ODISP, newArea, GIFT, TDP, TD_TOP, SVCS, newDisplay, img, saveList, reloadList, DISPLAYS, CHS, nameText, nowStamp, EDITOR, tplUsers, PTYPES, ptOf, ordKind, APP_CH, recPtype, LV2S, LV3S, epcOf, tplPtype, tplsForLv3
} from "./display-data";
// 섹션 검사 · 운영 상태 규칙은 display-rules.ts (상품 전시 목록 display-list2.html과 함께 쓴다)
import {
 endOf, startAt, endAt, htmlText, htmlHasImg, descFilled, combos, areaHasSel, rng, connPOs, eul, areaIssues, hasDev, hasPlan, GM, TDM, condMatch, benefitState, joinWarn, syncList, syncBenefits, visibleGifts, visibleTd, sectionState, SECS as SECS0, STL, secHidden, blocking, status, methodLabel, OWNERS, TEAMS, appOn, needs, planMismatch, isReq as isReq0, lv3Combo as lv3ComboOf, noImg, STEP_CORNER
} from "./display-rules";
// 주문 구성안 = 주문 프로세스 관리 v0.2.4(order6-create.html) 목록
import { PROC_KEY, PROC_CATS, PROC_APS, loadProcs, procUsable, procCorners, procCornerCnt, sameCat } from "./order-process-data";
import { dispId, CONTENT } from "./display-data";
// 코너 원본 = 주문 코너 관리(order-corner-v22) 데이터. 주문 프로세스 관리 v0.2.4(order6-create.html)도 같은 원본을 쓰고, 코너 관리에서 바꾼 값(브라우저 저장소)이 열 때 반영된다
import { CORNERS } from "./order-corner-v22-data";
import { CH_GROUPS, chItemsOf } from "./data/epc";
import { planCorners } from "./display-rules";

requireAuthentication();

const METHOD={fixed:'고정형',select:'선택형',complex:'복합형'};
const MODE={fixed:'고정',list:'목록에서 선택',opt:'옵션 선택'};

// ---------- 공통 ----------
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 전시명은 <br>로 줄을 바꾼다. 미리보기는 줄바꿈, 목록·안내 문구는 띄어쓰기로 보인다
const nameHtml=s=>esc(s).replace(/&lt;br\s*\/?&gt;/gi,'<br>');
// 전시 기간 문구. 시작·종료 일시(startAt · endAt)는 display-rules.ts
const periodTxt=d=>`${d.from?`${d.from} ${d.fromTime}`:'시작일 미입력'} ~ ${endAt(d)?`${d.to} ${d.toTime}`:'상시'}`;
const won=n=>n.toLocaleString()+'원';
const priceTxt=po=>ONCE.has(po.type)?won(po.base):'월 '+won(po.base);
const clone=o=>JSON.parse(JSON.stringify(o));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200);}
const svg=(p,cls)=>`<svg ${cls?`class="${cls}" `:''}viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const IC={
 fixed:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/>',
 select:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/>',
 complex:'<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="18" height="8" rx="1.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
 warn:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17v.01"/>',
 up:'<path d="m6 15 6-6 6 6"/>', down:'<path d="m6 9 6 6 6-6"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
 spark:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
};
// 설정 결과 안내 박스: 첫 줄은 핵심(강조는 <b>), 둘째 줄은 보충 설명
const guide=(main,sub)=>`<div class="guide">${svg(IC.info)}<div><p>${main}</p>${sub?`<p class="gs">${sub}</p>`:''}</div></div>`;
const ntc=(kind,txt)=>`<div class="ntc ${kind||''}">${svg(kind==='warn'?IC.warn:IC.info)}<span>${txt}</span></div>`;
// 목록 순서 변경(드래그앤드롭): 항목을 끌어 대상 항목의 위/아래 절반에 놓는다. 손잡이에 포커스하면 위·아래 화살표로 한 칸씩 옮긴다
const gripBtn=(i,label)=>`<button type="button" class="grip" data-gi="${i}" aria-label="${label} 순서 이동 (위·아래 화살표 키)" title="끌어서 순서 변경"><svg viewBox="0 0 12 16" aria-hidden="true"><circle cx="3.5" cy="3" r="1.4"/><circle cx="8.5" cy="3" r="1.4"/><circle cx="3.5" cy="8" r="1.4"/><circle cx="8.5" cy="8" r="1.4"/><circle cx="3.5" cy="13" r="1.4"/><circle cx="8.5" cy="13" r="1.4"/></svg></button>`;
// ok(새 순서)가 false면 옮기지 않는다
function dndList(box,key,list,done,ok,sel='.ali',idOf=y=>y.id){
 let drag=null; const items=$$(`${box} ${sel}[data-${key}]`), clr=()=>items.forEach(a=>a.classList.remove('dragging','drop-b','drop-a'));
 const apply=n=>{ if(ok&&!ok(n)) return false; list.splice(0,list.length,...n); done(); return true; };
 items.forEach(el=>{
  el.draggable=true;
  // 행 안의 입력칸에서 누르면 끌기 대신 글자 선택이 되게 한다
  el.addEventListener('mousedown',e=>{ el.draggable=!e.target.closest('input,textarea,select'); });
  el.addEventListener('dragstart',e=>{ drag=el.dataset[key]; el.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',''); });
  el.addEventListener('dragend',()=>{ drag=null; clr(); });
  el.addEventListener('dragover',e=>{ if(drag==null) return; e.preventDefault(); const r=el.getBoundingClientRect(), b=e.clientY<r.top+r.height/2; el.classList.toggle('drop-b',b); el.classList.toggle('drop-a',!b); });
  el.addEventListener('dragleave',e=>{ if(!el.contains(e.relatedTarget)) el.classList.remove('drop-b','drop-a'); });
  el.addEventListener('drop',e=>{ e.preventDefault(); if(drag==null) return; const id=drag, to0=el.dataset[key], b=el.classList.contains('drop-b'); drag=null; clr(); if(id===to0) return;
   const n=list.slice(), [m]=n.splice(n.findIndex(y=>String(idOf(y))===id),1), to=n.findIndex(y=>String(idOf(y))===to0); n.splice(b?to:to+1,0,m); apply(n); });
 });
 $$(`${box} [data-gi]`).forEach(g=>g.addEventListener('keydown',e=>{ const i=+g.dataset.gi, j=e.key==='ArrowUp'?i-1:e.key==='ArrowDown'?i+1:-1; if(j<0||j>=list.length) return; e.preventDefault();
  const n=list.slice(); [n[i],n[j]]=[n[j],n[i]]; if(!apply(n)) return; const f=$(`${box} [data-gi="${j}"]`); if(f) f.focus(); }));
}
const mvBtns=(attr,i,n,label)=>`<span class="mv"><button type="button" data-${attr}u="${i}" ${i===0?'disabled':''} aria-label="${label} 위로">${svg(IC.up)}</button><button type="button" data-${attr}d="${i}" ${i===n-1?'disabled':''} aria-label="${label} 아래로">${svg(IC.down)}</button></span>`;

// ---------- 화면 전환 ----------
// v0.3.1: 목록과 등록을 한 파일(product-v031.html)로 합쳤다. 파라미터 없이 열면 목록(src/display-list2.ts), ?view=new 는 등록, ?id=N 은 상세
const LIST_URL='product-v031.html';
let E=null, cur=null, PV={}, curX=null, PVTAB='order';
function showView(){ setDock(false); window.scrollTo(0,0); fitPv(); }
// 저장 안내는 목록 화면에서 띄운다(display-list2.ts가 읽고 지운다)
function goList(msg){ if(msg) try { sessionStorage.setItem('display-list.toast',msg); } catch {} location.href=LIST_URL; }
$('#goList').addEventListener('click',()=>goList());

// ---------- 전시 등록/수정 ----------
// 화면 모드: new = 등록, view = 상세(읽기 전용), edit = 수정. 저장된 전시는 상세로 연다
let VIEW='new';
function openEdit(id,mode){
 const d=id?DISPLAYS.find(x=>x.id===id):null;
 VIEW=d?(mode==='edit'?'edit':'view'):'new';
 E=d?clone(d):newDisplay();
 // v0.2.2: 새 전시는 주문 구성 방식(주문 받기)을 꺼 둔 채로 시작한다. 저장된 전시는 저장 값을 따른다
 if(!d){ E.orderOn=false; E.off={act:'none',btn:''}; }
 // v0.2.4: 새 전시는 구매 후기를 꺼 둔 채로 시작한다
 if(!d) E.review=false;
 // v0.3: 전문가 리뷰도 새 전시는 꺼 둔 채로 시작한다
 if(!d) E.expert=false;
 // PS 상품 전시: 단수 PS · 전시 콘텐츠 등록용 섹션만
 psReset(E);
 // v0.2.4: 주문 받기 OFF 항목(이동할 전시) 기본값, 연결한 주문 프로세스는 저장소의 최신 값으로 다시 읽는다
 // 안내 문구 · 주문 자동 시작은 화면에서 뺐다. 예전에 저장한 값이 검사 · 미리보기에 남지 않도록 비운다
 E.off=Object.assign({act:'none',btn:'',go:null},E.off,{note:'',auto:false,at:''});
 // 버튼 문구 입력칸을 뺐으므로 비어 있으면 기본 문구로 채운다
 if(E.off.act!=='none'&&!E.off.btn.trim()) E.off.btn=(OFF_ACT.find(x=>x[0]===E.off.act)||[])[3]||'';
 E.noSteps=true;
 // v0.2.4: 연관 상품 노출 방식(자동 노출 · 직접 지정)
 E.rel=Object.assign(relDef(),E.rel);
 // v0.2.4: 디바이스별 이미지. 예전 전시는 대표이미지 · 추가이미지를 모바일 이미지로 옮긴다
 // v0.3: 태블릿 영역은 없앴다(모바일 이미지를 함께 쓴다). 예전에 저장한 태블릿 이미지는 버린다
 // v0.3.2: 기기 구분을 다시 없애고 v0.2.0처럼 대표이미지(1장) · 추가이미지(최대 4장)로 나눈다. 모바일 이미지가 있던 전시는 첫 장을 대표, 나머지를 추가로 옮기고 데스크탑 이미지는 버린다
 if(E.imgs&&E.imgs.mobile&&E.imgs.mobile.length&&!E.main){ E.main=E.imgs.mobile[0]; E.subs=E.imgs.mobile.slice(1); }
 E.subs=(E.subs||[]).slice(0,SUB_MAX); E.subAlt=E.subAlt||''; syncImgs();
 PROCS=loadProcs(); livePlan(); CT.open=-1; CT.sel={}; PVC=0;
 // v0.3.1: 코너 문구 · 노출 목록 덮어쓰기는 쓰지 않는다. 채널 관리 항목은 숨긴 값만 저장한다
 E.orderOv={}; E.chHide=Object.assign({join:[],inst:[],ship:[]},E.chHide);
 // v0.3.2: 채널별 노출 제어(EPC 수정값)
 E.chset=E.chset||{}; curCh=null;
 // 적용 방식(모든 채널 동일 · 채널별): 저장값이 없으면 채널마다 수정값이 다를 때만 채널별로 연다
 if(!E.chMode) E.chMode=new Set(Object.values(E.chset).map(x=>JSON.stringify((x&&x.ov)||{}))).size>1?'each':'same';
 // 추가설정(검색 노출 설정 · 오퍼링 문구)은 끄는 스위치 없이 항상 사용한다
 E.search.on=E.cvm.on=true;
 // 이전 버전에서 지정한 대표 상품은 더 쓰지 않는다
 delete E.repPo; delete E.repAuto; syncPtype();
 // 유사한 상품 문구가 연관 상품으로 옮겨 왔다. 고객 화면 노출은 연관 상품 스위치 하나로 정한다
 // v0.2.4: 새 전시는 연관 및 유사 상품을 꺼 둔 채로 시작한다
 if(!d) E.related=false;
 E.sim.on=E.related;
 // v0.3: 템플릿 콘텐츠 제목을 구분명(이용안내 등) 대신 템플릿명으로 쓴다. 구분이 같은 템플릿(이용안내 6개)이 같은 제목으로 겹쳐 보이던 문제.
 // 예전에 구분명 그대로 들어간 제목은 템플릿명으로 바꾼다
 E.extras.forEach(x=>{ const t=x.src&&tplBy(x.src); if(t&&x.t===t.t) x.t=t.n; });
 // v0.3: 수급 방식 하나로 문구 · 노출 상품을 함께 정한다(CVM = 고정 문구 · 자동 노출, 운영자 = 직접 입력 · 직접 지정). 기본 CVM 데이터 연동
 if(!d) E.rel.mode='auto';
 E.sim.mode=E.rel.mode==='auto'?'def':'custom';
 if(E.sim.mode==='custom'&&!E.sim.t) E.sim.t=SIM_DEF.t;
 // v0.3.2 MP 상품 전시: 값 정리 · 제공 혜택 문구 · 콘텐츠 정보 기본 항목
 mpNorm(E,false); delete E.bnf; syncMpExtras(); PVMP=mpPvDef();
 cur=E.areas[0]&&E.areas[0].id; curX=E.extras[0]&&E.extras[0].id; curI='basic'; PV={}; PVTAB='order'; PVPILL=false; PVX.clear(); pvLast=''; RTE_SRC.desc=RTE_SRC.note=RTE_SRC.xtx=false; XD=null;
 syncSingle(); syncBenefitsV(E);
 // 처음 열 때(새로고침 포함)는 모든 섹션을 펼친다. 섹션마다 따로 접고 편다
 $$('#v-edit .step').forEach(s=>setFold(s,true,true)); tabIdx=0;
 renderEditing(); renderAll(); showView('edit');
 history.replaceState(null,'',location.pathname+(E.id?`?id=${E.id}${VIEW==='edit'?'&mode=edit':''}`:'?view=new'));
}
function renderEditing(){
 const on=VIEW==='edit'; $('#editingBar').classList.toggle('on',on);
 $('#editTitle').textContent={new:'전시등록',view:'전시상세',edit:'전시수정'}[VIEW];
 if(on) $('#editingTxt').textContent=`"${nameText(E.name)||'이름 없음'}" 수정 중. 저장하면 목록의 같은 행이 바뀝니다`;
 // 상세: 입력 영역만 막는다(섹션 접기 · 미리보기는 그대로)
 const ro=VIEW==='view'; $('#form').classList.toggle('ro',ro); $$('#form .step>.body').forEach(b=>b.inert=ro); const od=$('#odOn'); if(od) od.disabled=ro;
 rDock();
}
// 섹션 접기: 헤더를 누르거나 화살표 버튼. 헤더 안의 스위치는 접기와 따로 동작한다
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOLD_MS=300, FOLD_EASE='cubic-bezier(.4,0,.2,1)';
function setFold(step,open,instant){
 const body=step.querySelector(':scope>.body'), was=!step.classList.contains('closed');
 const b=step.querySelector('.fold'); b.setAttribute('aria-expanded',open); b.setAttribute('aria-label',open?'접기':'펼치기');
 if(body._fold){ body._fold.cancel(); body._fold=null; body.style.display=''; body.style.overflow=''; }
 step.classList.toggle('closed',!open);
 if(instant||was===open||reduceMotion()||!body.animate) return;
 // 접을 때는 '접힘' 상태로 먼저 바꾸고, 애니메이션이 끝날 때까지 본문을 잠시 보이게 둔다
 body.style.overflow='hidden'; if(!open) body.style.display='block';
 // 본문의 위·아래 여백까지 함께 줄이고 늘려야 끝에서 툭 끊기지 않는다
 const h=body.scrollHeight, cs=getComputedStyle(body), full={height:h+'px',paddingTop:cs.paddingTop,paddingBottom:cs.paddingBottom,opacity:1}, none={height:'0px',paddingTop:'0px',paddingBottom:'0px',opacity:0};
 const a=body._fold=body.animate(open?[none,full]:[full,none],{duration:open?FOLD_MS:FOLD_MS-40,easing:FOLD_EASE});
 a.onfinish=()=>{ if(body._fold!==a) return; body._fold=null; body.style.display=''; body.style.overflow=''; };
}
// 섹션 열기: 다른 섹션은 그대로 두고(아코디언 아님) 이 섹션만 펼친 뒤, 머리줄이 보이도록 맞춘다
function openSec(step){
 setFold(step,true);
 const k=stepList().indexOf(step); if(k>=0) tabIdx=k;
 setTimeout(()=>{ const top=step.getBoundingClientRect().top; if(top<0||top>innerHeight*.5) step.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'}); },reduceMotion()?0:FOLD_MS);
}
$$('#v-edit .step>header').forEach(h=>h.addEventListener('click',e=>{ if(e.target.closest('.switch')) return; const s=h.parentElement; setFold(s,s.classList.contains('closed')); }));
// Tab 키는 섹션 이동만 한다: Tab = 다음 섹션, Shift+Tab = 이전 섹션. 들어가는 섹션이 접혀 있으면 펼치고, 다른 섹션은 그대로 둔다.
// 섹션 안의 입력칸은 Tab으로 이동하지 않는다(마우스로 선택). 팝업·연결 상품 목록이 열려 있을 때는 평소처럼 동작한다
let tabIdx=0;
// 조건이 안 맞아 숨긴 섹션(가입 유형·할부·티다팩 등)은 Tab 이동에서 건너뛴다
// v0.3.1: 숨긴 통합 앱 전용 영역 안의 섹션도 건너뛴다
const stepList=()=>$$('#v-edit .step').filter(s=>!s.hidden&&!s.closest('[hidden]'));
document.addEventListener('keydown',e=>{
 if(e.key!=='Tab'||e.altKey||e.ctrlKey||e.metaKey) return;
 if(!$('#v-edit').classList.contains('on')||!$('#md').hidden||!$('#dockSheet').hidden) return;
 e.preventDefault();
 const list=stepList(), at=document.activeElement&&document.activeElement.closest?document.activeElement.closest('#v-edit .step'):null;
 const i=at?list.indexOf(at):tabIdx, j=Math.max(0,Math.min(list.length-1,i+(e.shiftKey?-1:1)));
 setFold(list[j],true); tabIdx=j;
 list[j].querySelector('.fold').focus({preventScroll:true});
 setTimeout(()=>list[j].scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'}),reduceMotion()?0:FOLD_MS);
});
// Ctrl + 1: 모든 섹션과 컨테이너·코너 설정의 컨테이너를 한 번에 접는다 (팝업 · 연결 상품 목록이 열려 있을 때는 동작하지 않는다)
document.addEventListener('keydown',e=>{
 if(!e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||(e.key!=='1'&&e.code!=='Digit1')) return;
 if(!$('#v-edit').classList.contains('on')||!$('#md').hidden||!$('#dockSheet').hidden) return;
 e.preventDefault();
 $$('#v-edit .step').forEach(s=>setFold(s,false));
 if(CT.open>=0){ slideCtn(CT.open,false); CT.open=-1; }
 tabIdx=0; window.scrollTo({top:0,behavior:reduceMotion()?'auto':'smooth'});
 toast('모든 영역을 접었어요');
});
function goSec(k){ if(k==='info'){ curI=secState(E).basic.st==='done'?'desc':'basic'; rInfo(); } const s=$('#sec-'+k); setDock(false); openSec(s); }

function renderAll(){ rKind(); rConn(); rMethod(); rAttr(); rCh(); rChset(); rInfo(); rBasic(); rDesc(); rExtra(); rGuide(); rReview(); rExpert(); rRel(); rSim(); rGift(); rTd(); rSearch(); rCvm(); rOrder(); refresh(); }
// 섹션 상태·연결 상품 목록·미리보기 갱신
function refresh(){
 const S=secState(E);
 // v0.2.4: 가입 유형 · 할부 · 배송 섹션은 화면에 없다. v0.3.2: T기프트 · 티다팩 섹션은 다시 쓴다
 SECS.forEach(([k])=>{ const el0=$('#sec-'+k); if(!el0) return; const s=S[k], [t,c]=STL[s.st]; const ch=$('#st-'+k); if(ch){ ch.textContent=t; ch.className='chip '+c; } const el=$('#sec-'+k); el.classList.toggle('na',s.st==='na'); el.classList.toggle('off',s.st==='off'||s.st==='unused'); el.hidden=hideSec(k,E);
  // 주문 받기가 꺼지면 채널 연동 섹션(가입 유형 · 할부 · 배송)은 필수에서 빠진다
  const rq=el.querySelector(':scope>header .req'); if(rq) rq.hidden=!isReq(k,S); });
 // MP 상품 전시: 주문 프로세스 연동 헤더에 [필수]
 { const r=$('#odReq'); if(r) r.hidden=E.kind!=='mp'; }
 infoChips();
 // 하단 바: 연결 상품 수, 바텀시트: 연결한 상품 목록 (누르면 연결 상품 섹션으로 이동)
 const curMp=E.kind==='mp'&&mpDemo(E.mp);
 const items=curMp?[{n:curMp.name,m:`${curMp.id} · ${curMp.target}`,v:''}]:E.kind==='mp'?[]:E.kind!=='ps'?E.conn.map(id=>{ const p=poBy(id); return {n:p.name,m:`${p.epc} · ${p.id} · ${p.type}`,v:priceTxt(p)}; }):E.conn.map(k=>{ const x=psBy(k); return {n:x.name,m:`${x.po.name} · ${x.kind}`,v:''}; });
 $('#connList').innerHTML=items.map((x,n)=>`<li data-go="conn"><span class="m">${n+1}</span><span class="t">${esc(x.n)}<span class="d">${esc(x.m)}</span></span>${x.v?`<span class="v">${x.v}</span>`:''}</li>`).join('')||'<li class="none">연결한 상품이 없어요. 연결 상품 섹션에서 추가하세요</li>';
 $$('#connList [data-go]').forEach(li=>li.addEventListener('click',()=>goSec('conn')));
 const bl=blockingV(E).length;
 $('#poCount').innerHTML=(E.kind==='mp'?(curMp?1:0):E.conn.length)+`<small>${E.kind==='mp'?'MP':E.kind!=='ps'?'상품':'PS'}</small>`;
 const sb=$('#bAppr'); if(sb&&!sb.disabled){ sb.classList.toggle('pending',bl>0); sb.title=bl?`필수 확인 ${bl}건을 채우면 승인요청할 수 있습니다. 누르면 채울 섹션으로 이동해요. 임시저장은 지금도 됩니다`:''; }
 renderPreview();
}

// ---------- 0. 노출 채널 (v0.3.1: 전시 설정 → 노출 채널. 전시 정보 위) ----------
// 채널 · 주문 받기 · 주문 구성안이 바뀌면 주문 구성 방식과 그에 기대는 영역을 다시 그린다
function onOrderChange(){ rChset(); rBasic(); rOrder(); refresh(); }
// v0.3 공제항목 반영(정책서 8장 초안): 전시 단위 ON/OFF만 둔다. ON이면 고객 화면 금액을 할인(공제항목)을 뺀 납부 예정 금액으로 보여 준다. 계산 방식은 협의 후 정한다
//  PS 상품 전시는 금액이 없어 보이지 않는다. 값: E.deduct(true/false, 기본 false)
// v0.3.1(11-25 시안): 표 항목명은 '전시 채널', 체크 박스 표기는 통합 App · 통합 Web · T-Gate (저장값은 그대로 통합 APP · 통합 WEB · T-gate)
const CH_LB={'통합 APP':'통합 App','통합 WEB':'통합 Web','T-gate':'T-Gate'};
function rCh(){
 const all=CHS.every(c=>E.channels.includes(c));
 // v0.3.1: 채널마다 적용 범위를 붙인다. 통합 APP · WEB = 공통 + 통합 앱 전용, T-gate · 스마트플래너 = 공통(전시 정보 · 콘텐츠 정보)만
 // 전시 정보와 같은 표(왼쪽 항목명 · 오른쪽 입력). 공제항목 반영은 연결 상품 섹션 아래로 옮겼다
 $('#sb-ch').innerHTML=`<div class="ftbl">
 ${seoRow('전시 채널',null,`<div class="chg"><label class="chc all"><input type="checkbox" id="chAll" ${all?'checked':''}>전체</label>${CHS.map(c=>`<label class="chc"><input type="checkbox" data-ch="${c}" ${E.channels.includes(c)?'checked':''}>${CH_LB[c]||c}</label>`).join('')}</div>`)}
 <div id="attrBox" style="display:contents"></div>
 </div>`;
 // v0.3.2: 노출 채널 표 = 노출 채널 + 공통 속성(모든 채널 · 보기만, 제목 없이 같은 표). 채널별 노출 제어는 바로 아래 별도 섹션으로 분리
 rAttr(); rChset();
 $('#chAll').indeterminate=!all&&E.channels.length>0;
 const set=v=>{ E.channels=v; rCh(); onOrderChange(); };
 $('#chAll').addEventListener('change',e=>set(e.target.checked?CHS.slice():[]));
 $$('#sb-ch [data-ch]').forEach(c=>c.addEventListener('change',()=>{ const v=c.dataset.ch; set(CHS.filter(x=>x===v?c.checked:E.channels.includes(x))); }));
}
// 공제항목 반영: 연결 상품 섹션 맨 아래. PS 상품 전시는 금액이 없어 보이지 않는다
// 연결 상품이 없으면 비활성(기본). 상품을 추가하면 고를 수 있고, 상품을 모두 빼면 OFF로 돌아간다
// v0.3.2: 연결 상품 섹션에서 고객 선택 방식 표(상품 유형 → 공제항목 반영 → 구성 방식)로 옮겼다
function dedField(){ const off=!E.conn.length; if(off) E.deduct=false; const dis=off?'disabled':'';
 return `<span class="srch-radio" role="radiogroup" aria-label="공제 항목 반영" ${off?'aria-disabled="true" style="opacity:.5"':''}><label><input type="radio" name="dDed" value="1" ${E.deduct?'checked':''} ${dis}>Y</label><label><input type="radio" name="dDed" value="0" ${!off&&!E.deduct?'checked':''} ${dis}>N</label></span>`; }
function bindDed(){ $$('#sb-method input[name=dDed]').forEach(r=>r.addEventListener('change',()=>{ E.deduct=r.value==='1'; refresh(); toast(E.deduct?'공제항목을 반영한 금액으로 보여줘요':'정상가로 보여줘요'); })); }

// ---------- 0-1. 공통 속성 (v0.3.2) ----------
// 모든 채널 공통. 읽기 전용이라 별도 섹션 없이 노출 채널 섹션 안(노출 채널 표 아래 · 채널별 탭 위)에 둔다. EPC 기본 설정값을 그대로 쓰며 전시 · 채널에서 수정하지 않는다(보기만)
// 범위 제외: 애플워치 모회선 인증 단말 여부 · 2G 단말 지원금 대상 여부
const SIM_T={usim:'USIM',esim:'eSIM',dual:'USIM + eSIM'};
const CONTRACTS=['선택약정','공시지원금'];
const devPOs=d=>connPOs(d).filter(p=>p.lv3==='휴대폰형');
// EPC 값(예시): 휴대폰 상품명에서 모델명 + 용량 목록으로 그룹명을 만든다. 나머지는 EPC 기본값
function epcModel(d){ const D=devPOs(d); return D.length?D[0].name.replace(/\s(\d+(?:GB|TB))\b/,'').replace(/\s\S+$/,''):''; }
function epcAttr(d){
 const D=devPOs(d), model=epcModel(d), caps=[...new Set(D.map(p=>(p.name.match(/\s(\d+(?:GB|TB))\b/)||[])[1]).filter(Boolean))];
 return {child:model?`${model}${caps.length?' '+caps.join('/'):''}`:'',sim:'dual',usimReq:'N',pre:{on:'N',from:'',to:''},contract:CONTRACTS.slice()};
}
// 색상 / 용량: 고객 선택 방식 옵션 기준(없으면 연결 휴대폰 상품명에서)
function colorCap(){
 const ov=E.areas.flatMap(a=>a.opts||[]), pick=re=>[...new Set(ov.filter(o=>re.test(o.name)).flatMap(o=>o.vals))];
 let col=pick(/컬러|색상/), cap=pick(/용량/);
 const D=devPOs(E);
 if(!cap.length) cap=[...new Set(D.map(p=>(p.name.match(/(\d+(?:GB|TB))/)||[])[1]).filter(Boolean))];
 if(!col.length) col=[...new Set(D.map(p=>p.name.split(' ').pop()))];
 return [col,cap];
}
function rAttr(){
 const box=$('#attrBox'); if(!box) return;
 if(E.kind==='ps'||E.kind==='mp'){ box.innerHTML=''; return; }
 if(!E.conn.length){ box.innerHTML=seoRow('공통 속성',null,'<span class="ft-empty">연결 상품을 추가하면 공통 속성이 노출돼요</span>'); return; }
 // 11-25 시안 3: 색상 / 용량 행 제외, 약정은 쉼표로 구분
 const A=epcAttr(E);
 const pre=A.pre.on==='Y'?`Y (${A.pre.from||'-'} ~ ${A.pre.to||'-'})`:'N';
 box.innerHTML=`
 ${seoRow('공통 속성',null,esc(A.child||'-'))}
 ${seoRow('SIM 구분',null,SIM_T[A.sim])}
 ${seoRow('유심 필수구매',null,A.usimReq)}
 ${seoRow('사전예약',null,esc(pre))}
 ${seoRow('약정',null,esc(A.contract.join(', ')||'-'))}`;
}

// ---------- 0-2. 채널별 노출 제어 (v0.3.2) ----------
// 노출 채널에서 고른 통합 APP · 통합 WEB만 탭으로 따로 정한다(T-gate · 스마트플래너 · BSS는 채널 제어값 없음). EPC 설정값을 기본으로 불러오고 필요한 항목만 수정(Override)
// 저장 값: E.chset = {채널: {ov:{키:값}}} (수정한 항목만). 수정한 항목은 [EPC 값으로 복원]
// - 가입유형: 번호이동 · 기기변경 · 신규가입 중 복수 선택, 1개 이상 필수('가입 없이 구매'는 커머스 상품 유형에서 다룬다)
// - 할부개월수: 채널별로 가입유형(신규 · 번이 · 기변)마다 목록을 관리. 일시불도 목록의 한 값
// - 가입유형 · 할부 · 바로픽업 · 바로도착 · 기프트 · 티다팩: 연결 상품에 휴대폰 또는 요금제가 있을 때만
// - 바로주문: 채널별, 단말(휴대폰)이 연결됐을 때만
// - 기프트 · 티다팩: 채널별 노출 여부만. 목록과 노출 순서는 전체 채널 공통
const JOINS=['번호이동','기기변경','신규가입'];
const INST=['일시불',...CH_GROUPS.find(g=>g.k==='inst').vals.filter(v=>v!=='일시불').sort((a,b)=>parseInt(a)-parseInt(b))];
const SVC=[['order','바로주문'],['gift','T기프트'],['td','티다팩']];
// 배송방식: 연결 상품(LV3)이 가진 배송 유형을 채널 순서대로 모은 값 중에서 고른다(일반배송 · 행복배송 · 바로도착 · 바로픽업 등)
const shipOpts=()=>(chUnion().find(g=>g.k==='ship')||{vals:[]}).vals;
// 바로주문은 채널 고유 상품 속성으로 단말(휴대폰)이 연결됐을 때만 쓴다
const svcOf=d=>SVC.filter(([k])=>k!=='order'||devPOs(d).length>0);
const CH_KEYS=['grp','stock','join','months','ship','svc'];
const needPP=d=>connPOs(d).some(p=>p.lv3==='휴대폰형'||p.type==='요금제');
// 채널 제어 대상: 통합 APP · 통합 WEB
const ctlChs=d=>d.channels.filter(c=>APP_CH.includes(c));
// EPC 채널 기본값(예시): 번이 · 기변, 할부 일시불 · 12 · 24 · 30 · 36개월
function epcCh(d,ch){
 const m=['일시불','12개월','24개월','30개월','36개월'];
 return {grp:epcModel(d),stock:{t:'common',qty:''},join:['번호이동','기기변경'],
  months:{번호이동:m.slice(),기기변경:m.slice(),신규가입:m.slice()},ship:shipOpts(),svc:{order:'Y',gift:'Y',td:'Y'}};
}
const chOv=(d,ch)=>{ const s=d.chset=d.chset||{}; if(!s[ch]||!s[ch].ov) s[ch]={ov:{}}; return s[ch].ov; };
const chOf=(d,ch)=>{ const B=epcCh(d,ch), ov=chOv(d,ch); return Object.fromEntries(CH_KEYS.map(k=>[k,k in ov?ov[k]:B[k]])); };
const chMod=(d,ch,k)=>{ const ov=chOv(d,ch); return k in ov&&JSON.stringify(ov[k])!==JSON.stringify(epcCh(d,ch)[k]); };
function setCh(ch,k,v){ const ov=chOv(E,ch); if(JSON.stringify(v)===JSON.stringify(epcCh(E,ch)[k])) delete ov[k]; else ov[k]=clone(v); }
const chTxt=(k,v,B)=>k==='grp'?(v||'-'):k==='stock'?(v.t==='own'?`채널 전용 재고 ${v.qty||0}개`:'공통 재고')
 :k==='join'||k==='ship'?(v.join(' · ')||'없음'):k==='months'?B.join.map(j=>`${j} ${v[j].join('·')||'-'}`).join(' / ')
 :(svcOf(E).filter(([x])=>v[x]==='Y').map(([,t])=>t).join(' · ')||'없음');
let curCh=null;
function chIssues(d){ return ctlChs(d).flatMap(ch=>{ const c=chOf(d,ch), e=[];
 if(c.stock.t==='own'&&!(+c.stock.qty>0)) e.push(`${ch}: 채널 전용 재고 수량을 입력하세요`);
 if(needPP(d)){ if(!c.join.length) e.push(`${ch}: 가입유형을 1개 이상 고르세요`);
  c.join.forEach(j=>{ if(!c.months[j].length) e.push(`${ch}: ${j} 할부개월수를 1개 이상 고르세요`); });
  if(shipOpts().length&&!c.ship.length) e.push(`${ch}: 배송방식을 1개 이상 고르세요`); }
 return e; }); }
function rChset(){
 const box=$('#chsetBox'); if(!box) return;
 const C=ctlChs(E);
 if(E.kind==='ps'||E.kind==='mp'||!C.length){ box.innerHTML=''; return; }
 // 적용 방식: same = 모든 채널에 같은 값(탭 하나), each = 채널(탭)마다 따로. 채널이 1개면 고를 필요 없이 same
 const same=C.length<2||E.chMode!=='each';
 // 섹션 제목은 고른 채널에 따라 바뀐다: 예) 통합 APP · 통합 WEB 전용 노출
 { const t=`${C.length>1?'통합App · Web':C[0]==='통합 APP'?'통합App':'통합Web'} 노출 전용`, hb=$('#sec-chset header b'); if(hb) hb.textContent=t; const sc=SECS.find(x=>x[0]==='chset'); if(sc){ sc[1]=t; sc[3]=t; } }
 if(same){ curCh=C[0]; C.slice(1).forEach(x=>{ E.chset[x]={ov:clone(chOv(E,C[0]))}; }); }
 else if(!C.includes(curCh)) curCh=C[0];
 const T=same?C:[curCh], put=(k,v)=>T.forEach(x=>setCh(x,k,v));
 const ch=curCh, c=chOf(E,ch), B=epcCh(E,ch), pp=needPP(E), bad=x=>chIssues({...E,channels:[x]}).length>0;
 const nMod=CH_KEYS.filter(k=>chMod(E,ch,k)).length, own=c.stock.t==='own';
 const rv=k=>chMod(E,ch,k)?`<p class="ft-hint at-bss">EPC 값: ${esc(chTxt(k,B[k],B))} <button type="button" class="lnk" data-crv="${k}">EPC 값으로 복원</button></p>`:'';
 const chk=(attr,v,on,label,extra='')=>`<label class="axchip ${on?'on':''}"><input type="checkbox" data-${attr}="${v}" ${extra} ${on?'checked':''}>${label||v}</label>`;
 const radio=(name,v,opts)=>`<span class="srch-radio" role="radiogroup">${opts.map(([x,t])=>`<label><input type="radio" name="${name}" value="${x}" ${v===x?'checked':''}>${t}</label>`).join('')}</span>`;
 // 11-25 시안 3: 채널 탭은 알약형 버튼, [채널별 따로 설정]은 오른쪽, [모두 EPC 값으로 복원]은 표 오른쪽 아래
 const lb=x=>CH_LB[x]||x;
 const tabs=same?`<button type="button" role="tab" class="on" aria-selected="true">${C.length>1?'통합 App · Web':esc(lb(C[0]))}${C.some(bad)?'<small>확인 필요</small>':''}</button>`
  :C.map(x=>`<button type="button" role="tab" data-cht="${esc(x)}" class="${x===ch?'on':''}" aria-selected="${x===ch}">${esc(lb(x))}${bad(x)?'<small>확인 필요</small>':''}</button>`).join('');
 const cbx=(attr,v,on,label,extra='')=>`<label class="chkl"><input type="checkbox" data-${attr}="${v}" ${extra} ${on?'checked':''}>${label||v}</label>`;
 box.innerHTML=`
 <div class="ch-top"><div class="ch-pills" role="tablist" aria-label="노출 채널">${tabs}</div>${C.length>1?`<label class="chkl ch-each"><input type="checkbox" id="cEach" ${same?'':'checked'}>채널별 따로 설정</label>`:''}</div>
 <div class="ftbl">
 ${seoRow('모상품 그룹명',null,`<input type="text" id="cGrp" value="${esc(c.grp)}" maxlength="40" placeholder="비우면 전시명을 사용해요" aria-label="모상품 그룹명" style="width:100%">${rv('grp')}`)}
 ${seoRow('채널별 재고',null,`<div class="row">${radio('cStock',c.stock.t,[['common','공통 재고'],['own','채널 전용 재고']])}${own?`<input type="number" id="cQty" min="1" value="${esc(c.stock.qty)}" placeholder="수량" aria-label="채널 전용 재고 수량" style="width:110px;text-align:right"><span>개</span>`:''}</div>`)}
 ${!pp?'':`
 ${seoRow('가입 유형',null,`<div class="ch-cbs" role="group" aria-label="가입 유형">${JOINS.map(j=>cbx('cj',j,c.join.includes(j))).join('')}</div>${rv('join')}`)}
 <div class="ft-row ch-mset"><div class="ft-l">할부개월수</div><div class="ch-msub">${c.join.map(j=>`<div class="ch-mr"><div class="ch-ml">${j}</div><div class="ch-mv"><div class="axchips" role="group" aria-label="${j} 할부개월수">${INST.map(m=>chk('cm',m,c.months[j].includes(m),m,`data-cmj="${j}"`)).join('')}</div>${c.months[j].length?'<div class="er" hidden></div>':'<div class="er">1개 이상 고르세요</div>'}</div></div>`).join('')}${rv('months')?`<div class="ch-mr"><div class="ch-ml"></div><div class="ch-mv">${rv('months')}</div></div>`:''}</div></div>
 ${shipOpts().length?seoRow('배송방식',null,`<div class="ch-cbs" role="group" aria-label="배송방식">${shipOpts().map(v=>cbx('csh',v,c.ship.includes(v))).join('')}</div>${c.ship.length?'':'<div class="er">1개 이상 고르세요</div>'}${rv('ship')}`):''}
 ${seoRow('노출 서비스',null,`<div class="ch-cbs" role="group" aria-label="노출 서비스">${svcOf(E).map(([k,t])=>cbx('cs',k,c.svc[k]==='Y',t)).join('')}</div>${rv('svc')}`)}`}
 </div>
 <div class="cn-foot"><button type="button" class="btn sm" id="cReset" ${nMod?'':'disabled'}>모두 EPC 값으로 복원</button></div>`;
 const re=()=>{ rChset(); refresh(); };
 // 채널별 따로 설정: 체크하면 탭마다 따로, 해제하면 지금 탭의 값을 모든 채널에 같이 쓴다
 { const ce=$('#cEach'); if(ce) ce.addEventListener('change',()=>{
  if(!ce.checked){ const diff=C.some(y=>JSON.stringify(chOv(E,y))!==JSON.stringify(chOv(E,curCh)));
   if(diff&&!confirm(`${curCh} 탭의 설정을 모든 채널에 적용할까요? 다른 채널에서 따로 바꾼 값은 사라져요`)){ ce.checked=true; return; }
   const ov=clone(chOv(E,curCh)); C.forEach(y=>{ E.chset[y]={ov:clone(ov)}; }); E.chMode='same'; re(); if(diff) toast(`${curCh} 설정을 모든 채널에 적용했어요`); }
  else { E.chMode='each'; re(); toast('채널별로 따로 설정해요'); } }); }
 $$('#chsetBox [data-cht]').forEach(b=>b.addEventListener('click',()=>{ curCh=b.dataset.cht; rChset(); }));
 $('#cGrp').addEventListener('change',e=>{ put('grp',e.target.value.trim()); re(); });
 $$('#chsetBox input[name=cStock]').forEach(r=>r.addEventListener('change',()=>{ put('stock',{t:r.value,qty:r.value==='own'?c.stock.qty:''}); re(); const q=$('#cQty'); if(q) q.focus(); }));
 const q=$('#cQty'); if(q) q.addEventListener('change',e=>{ put('stock',{t:'own',qty:e.target.value}); re(); });
 $$('#chsetBox [data-cj]').forEach(x=>x.addEventListener('change',()=>{ const j=x.dataset.cj, nx=JOINS.filter(v=>v===j?x.checked:c.join.includes(v));
  if(!nx.length){ x.checked=true; toast('가입유형은 1개 이상 선택해야 해요'); return; }
  put('join',nx); re(); }));
 $$('#chsetBox [data-cm]').forEach(x=>x.addEventListener('change',()=>{ const j=x.dataset.cmj, m=x.dataset.cm, mo=clone(c.months);
  mo[j]=INST.filter(v=>v===m?x.checked:mo[j].includes(v)); put('months',mo); re(); }));
 $$('#chsetBox [data-csh]').forEach(x=>x.addEventListener('change',()=>{ const v=x.dataset.csh; put('ship',shipOpts().filter(o=>o===v?x.checked:c.ship.includes(o))); re(); }));
 $$('#chsetBox [data-cs]').forEach(x=>x.addEventListener('change',()=>{ put('svc',{...c.svc,[x.dataset.cs]:x.checked?'Y':'N'}); re(); }));
 $$('#chsetBox [data-crv]').forEach(b=>b.addEventListener('click',()=>{ T.forEach(x=>{ delete chOv(E,x)[b.dataset.crv]; }); re(); toast('EPC 값으로 복원했어요'); }));
 $('#cReset').addEventListener('click',()=>{ if(!nMod) return; T.forEach(x=>{ chOv(E,x); E.chset[x].ov={}; }); re(); toast(`${same?C.join(' · '):ch} 설정을 모두 EPC 값으로 복원했어요`); });
}
// 미리보기의 가입 · 할부 · 배송 코너는 미리보기 채널(통합 APP · WEB 중 먼저 고른 채널)의 채널별 설정을 따른다
function pvChHidden(k,v){
 if(!needPP(E)) return false;
 const ch=ctlChs(E)[0]; if(!ch) return false;
 const c=chOf(E,ch);
 if(k==='join') return !c.join.includes(v);
 if(k==='inst') return !c.join.some(j=>c.months[j].includes(v));
 if(k==='ship') return !c.ship.includes(v);
 return false;
}

// ---------- 1. 전시 유형 ----------
// v0.3: PO/MP(기본) · MP 상품 전시(원천 PO + 고정 MP, 정책서 07 MP 고정 전시) · PS 상품 전시(T우주 SKU 단위 PS 소개)
// v0.3.2 MP 상품 전시(스펙: MP 상품 전시 섹션별 동작 · FO 미리보기)
//  연결 상품 = EPC MP 상품 1개(PO 연결 없음, E.conn은 비운다) · 고객 선택 방식 = 읽기 전용 1줄(고정형 · MP 1개)
//  노출 채널 = 체크 박스만(공통 속성 숨김) · 채널별 설정 숨김 · 전시 정보 = 대표 이미지 선택, 오퍼링 문구 탭 → 제공 혜택 문구
//  콘텐츠 정보 = MP 기본 항목 8개 · 구매 후기 · 전문가 리뷰 · 연관 상품 = 기본 N · 주문 프로세스 연동 = 필수, ON 잠금, MP용 프로세스만
//  값: E.mp = MP ID(MP_DEMO), E.orderPlan = MP_PROCS 항목 + mpProc:true
const KIND_NTC={mp:'EPC의 MP 상품(혜택 · 할인) 1개를 연결해 전시합니다. MP는 고객이 보유한 회선에 가입합니다.<br>고객이 고르는 항목(결합 유형, 회선, 할인 방식, 약정 등)은 주문 프로세스의 주문 코너에서 설정합니다.',
 ps:'전시 콘텐츠 등록용입니다. PS(SKU 단위) 1개만 불러오고, 전시 설정 · 전시 정보 · 이미지 · 콘텐츠 정보(상품 고시 등)만 입력해요. 고객 선택 방식 · 구매 후기 · 전문가 리뷰 · 연관 및 유사 상품 · 주문 프로세스 연동은 쓰지 않아요.'};
// 시연 MP 목록(EPC 연동 전 예시값). bnf = EPC 상품 속성의 제공 혜택(상품을 연결하면 미리보기 '제공 혜택'에 자동 노출). desc는 [EPC 정보 불러오기]로 설명을 채울 때 쓴다(시연값)
const MP_DEMO=[
 {id:'MP-0001',bnf:['가족 모두 휴대폰 요금 할인','인터넷 · IPTV 요금 추가 할인'],ver:'v1.0',name:'요금제 가족 결합',target:'이동전화 요금제 + 인터넷·IPTV 보유 고객',from:'2026-01-01',to:'2027-12-31',sale:'판매중',cat:'결합',desc:'가족과 결합하면 요금 할인'},
 {id:'MP-0002',bnf:['휴대폰 요금 할인','인터넷 요금 할인'],ver:'v1.0',name:'나 혼자 결합 할인',target:'이동전화 요금제 + 인터넷 보유 고객',from:'2026-01-01',to:'2027-12-31',sale:'판매중',cat:'결합',desc:'휴대폰과 인터넷 결합 할인'},
 {id:'MP-0003',bnf:['기본료 · 통화료 감면'],ver:'v1.0',name:'복지 요금 감면',target:'이동전화 요금제 보유 고객',from:'',to:'',sale:'판매중',cat:'요금 감면',desc:'복지 대상 고객 요금 감면'},
 {id:'MP-0004',bnf:['월 요금 할인','데이터 추가 제공'],ver:'v1.0',name:'군 장병 요금 할인',target:'이동전화 요금제 보유 고객',from:'',to:'',sale:'판매중',cat:'요금 감면',desc:'군 복무 장병 요금 할인'},
 {id:'MP-0005',bnf:['휴대폰 요금 할인'],ver:'v1.0',name:'구 가족 결합(종료)',target:'이동전화 요금제 보유 고객',from:'2024-01-01',to:'2025-12-31',sale:'판매종료',cat:'결합',desc:'판매 종료된 가족 결합'}];
const mpDemo=id=>MP_DEMO.find(x=>x.id===id);
const mpPeriod=m=>m.from?`${m.from} ~ ${m.to}`:'상시';
// MP용 주문 프로세스(시연값). flow = 미리보기 코너 구성
const MP_PROCS=[
 {id:'TP-ORD-101',name:'결합 가입 주문 프로세스',ver:'V1',type:'결합',cat:'MP(결합)',ctn:3,cn:6,flow:'bundle'},
 {id:'TP-ORD-102',name:'복지 할인 신청 주문 프로세스',ver:'V1',type:'요금 감면',cat:'MP(요금 감면)',ctn:2,cn:3,flow:'welfare'},
 {id:'TP-ORD-103',name:'군 장병 할인 신청 주문 프로세스',ver:'V1',type:'요금 감면',cat:'MP(요금 감면)',ctn:2,cn:3,flow:'army'}];
const isMpPlan=p=>!!(p&&p.mpProc);
// 콘텐츠 정보 MP 기본 항목(템플릿 연결, 읽기 전용). 본문은 시연 문구
// 상담 · 지점 · 대리점 방문 · 정부24 · 복지로 안내는 콘텐츠 정보에서 빼고 별도 섹션(MP_GUIDE)으로 둔다
const MP_XDEF=[
 ['fee','이용 요금','<p>결합 회선 수와 요금제에 따라 할인 금액이 달라요.</p>'],
 ['use','이용 안내','<p>가입 후 다음 달 요금부터 할인이 적용돼요.</p>'],
 ['target','가입 대상','<p>이동전화 요금제를 이용 중인 고객이 가입할 수 있어요.</p>'],
 ['caution','유의 사항','<p>결합 회선을 해지하면 할인이 중단될 수 있어요.</p>'],
 ['docs','필요 서류 안내','<p>가족 관계를 확인할 수 있는 서류가 필요해요.</p>']];
// MP 상품 전시 안내 섹션: 섹션마다 노출 ON/OFF만 정한다. 문구 · 버튼은 시연값(관리 위치 미정). 값: E.mpGuide = {gcs, gshop, ggov}
const MP_GUIDE=[
 ['gcs','상담 안내','상담으로 빠르게 도와드려요',['고객센터 114 (SKT 휴대폰에서 무료)','평일 09:00 ~ 18:00 (토요일 · 공휴일 휴무)'],null,['전화 가입상담 신청','1:1 채팅 상담']],
 ['gshop','지점 · 대리점 방문 안내','지점 · 대리점 방문 가입',null,['필요 서류 확인','가까운 지점 · 대리점 방문','지점 · 대리점에서 접수'],['매장 찾기']],
 ['ggov','정부24 · 복지로 홈페이지 신청','정부24, 복지로 홈페이지 신청',['정부24 또는 복지로 홈페이지에서 신청할 수 있어요.'],null,['정부24 바로가기','복지로 바로가기']]];
const GUIDE_KEYS=MP_GUIDE.map(g=>g[0]);
function rGuide(){
 if(!E.mpGuide) E.mpGuide={gcs:true,gshop:true,ggov:true};
 MP_GUIDE.forEach(([k,,title,lines,steps,btns])=>{
  const on=!!E.mpGuide[k], sw=$(`[data-gd="${k}"]`); if(!sw) return;
  sw.checked=on; sw.disabled=VIEW==='view';
  $('#sb-'+k).innerHTML=`<div class="ftbl">${seoRow('타이틀',null,esc(title))}${lines?seoRow('안내 문구',null,lines.map(esc).join('<br>')):''}${steps?seoRow('가입 절차',null,steps.map((x,i)=>`${i+1}. ${esc(x)}`).join('<br>')):''}${seoRow('버튼',null,btns.map(b=>`<span class="pill">${esc(b)}</span>`).join(' '))}</div>`;
 });
}
$$('[data-gd]').forEach(c=>c.addEventListener('change',()=>{ E.mpGuide[c.dataset.gd]=c.checked; rGuide(); refresh(); }));
const mpTxt=h=>h.replace(/<[^>]+>/g,'');
// 기본 항목은 EPC에서 불러오거나 템플릿 불러오기로 들어오는 읽기 전용 콘텐츠다. 순서 변경 · 노출 ON/OFF만 되고 편집 · 삭제는 없다
// 유형을 MP로 바꾸면 기본 항목을 앞에 넣고, 다른 유형으로 바꾸면 뺀다. 사용자가 직접 추가한 항목은 그대로 둔다
function syncMpExtras(){
 if(E.kind!=='mp'){ E.extras=E.extras.filter(x=>!x.mpDef); return; }
 const have=new Set(E.extras.map(x=>x.mpDef).filter(Boolean));
 // 예전에 콘텐츠 정보에 넣었던 상담 · 방문 · 정부24 안내 항목은 별도 섹션으로 옮겨 뺀다
 E.extras=E.extras.filter(x=>!x.mpDef||MP_XDEF.some(([k])=>k===x.mpDef));
 const add=MP_XDEF.filter(([k])=>!have.has(k)).map(([k,t,txt])=>({id:nid(),t,mode:'epc',txt:mpTxt(txt),show:true,mpDef:k}));
 // 예전에 편집 모드(direct)로 넣은 기본 항목은 읽기 전용으로 바꾼다
 E.extras.forEach(x=>{ const d=x.mpDef&&MP_XDEF.find(([k])=>k===x.mpDef); if(d){ x.mode='epc'; x.t=d[1]; x.txt=mpTxt(d[2]); delete x.tbd; } });
 E.extras=[...add,...E.extras];
}
// MP 유형으로 열거나 바꿀 때 값 정리: PO 연결 없음 · 주문 받기 ON · MP용 프로세스만
function mpNorm(d,fresh){
 if(d.kind!=='mp') return;
 d.conn=[]; if(!mpDemo(d.mp)) d.mp='';
 d.method='fixed'; d.orderOn=true; if(d.orderPlan&&!isMpPlan(d.orderPlan)) d.orderPlan=null;
 // 구매 후기 · 전문가 리뷰는 MP 상품 전시에서 쓰지 않는다
 d.review=false; d.expert=false;
 if(fresh){ d.related=false; if(d.sim) d.sim.on=false; d.mpGuide={gcs:true,gshop:true,ggov:true}; }
}
function rKind(){
 // v0.3.1: 'PO/MP 상품 전시' → 'PO 상품 전시'
 const T=[['po','PO 상품 전시'],['mp','MP 상품 전시'],['ps','PS 상품 전시']];
 // v0.3.1(11-25 시안): 다른 섹션과 같은 표(왼쪽 항목명 · 오른쪽 입력)
 $('#sb-kind').innerHTML=`<div class="ftbl">${seoRow('무엇을 전시하나요?',null,`<span class="srch-radio" role="radiogroup" aria-label="전시 유형">${T.map(([k,l])=>`<label><input type="radio" name="dKind" value="${k}" ${E.kind===k?'checked':''}>${l}</label>`).join('')}</span>`)}</div>
 ${!KIND_NTC[E.kind]?'':ntc('',KIND_NTC[E.kind]).replace('class="ntc ','style="margin:12px 0 0" class="ntc ')}`;
 $$('#sb-kind input[name=dKind]').forEach(r=>r.addEventListener('change',()=>{ const k=r.value; if(k===E.kind) return; if((E.conn.length||E.mp)&&!confirm('전시 유형을 바꾸면 연결 상품과 고객 선택 방식이 초기화됩니다. 바꿀까요?')){ rKind(); return; } E.kind=k; E.conn=[]; E.mp=''; E.areas=k!=='ps'?[newArea('','fixed')]:[]; E.method='fixed'; psReset(E); if(isMpPlan(E.orderPlan)&&k!=='mp') E.orderPlan=null; mpNorm(E,true); syncMpExtras(); syncPtype(); cur=E.areas[0]&&E.areas[0].id; PV={}; syncConnTpls(); syncBenefitsV(E); renderAll(); }));
}

// ---------- 2. 연결 상품 ----------
function rConn(){
 if(E.kind==='mp') return rConnMp();
 const po=E.kind!=='ps';
 // v0.3.1(11-25 시안): '• 연결한 상품 총 N건' 소제목 → 표(비어 있어도 머리줄 노출) → 오른쪽 아래 [초기화] [상품 추가]
 //  PO 열: EPC ID · 버전 · 보기(상품명, 누르면 상세 팝업) · LV2 · 버전 · Product Spec · LV3 · 상세
 //  시안의 두 번째 '버전'(LV2 옆) 값은 EPC 데이터 정의 미확정이라 '-'로 둔다. 연결 해제는 상세 열에 둔다
 const rows=po?E.conn.map(id=>{ const p=poBy(id), x=epcOf(p); return `<tr><td>${p.epc}</td><td>${p.ver}</td><td class="l"><button type="button" class="lk" data-view="${id}">${esc(p.name)}</button>${hasSel(p)?' <span class="chip acc">선택 PS 있음</span>':''}</td><td>${x.lv2}</td><td>-</td><td>${esc(x.spec)}</td><td>${x.lv3}</td><td><span class="cn-acts"><button type="button" class="btn sm" data-view="${id}">보기</button><button type="button" class="btn sm" data-un="${id}">연결 해제</button></span></td></tr>`; }).join('')
  :E.conn.map(k=>{ const s=psBy(k); return `<tr><td>${s.key.split('|').slice(1).join('-')}</td><td>${s.po.ver}</td><td class="l"><b>${esc(s.name)}</b></td><td>${esc(s.desc||'-')}</td><td>상시</td><td><span class="chip ok">${s.po.sale}</span></td><td><span class="cn-acts"><button type="button" class="btn sm" data-view="${s.po.id}">보기</button><button type="button" class="btn sm" data-un="${k}">연결 해제</button></span></td></tr>`; }).join('');
 const head=po?['EPC ID','버전','보기','LV2','버전','Product Spec','LV3','상세']:['EPC 상품 ID','버전','EPC 상품명','PS Spec','유효기간','판매 상태','상세'];
 $('#sb-conn').innerHTML=`<div class="bh">연결한 상품<span>총 <b>${E.conn.length}</b>건</span></div>
 <div class="cn-tbl"><table><thead><tr>${head.map((h,i)=>`<th${i===2?' class="l"':''}>${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr class="none"><td colspan="${head.length}">${po?'연결 상품을 추가하세요.':'상품 추가로 전시할 PS 상품 1개를 연결하세요'}</td></tr>`}</tbody></table></div>
 <div class="cn-foot"><button type="button" class="btn" id="connReset" ${E.conn.length?'':'disabled'}>초기화</button>${po?'<button type="button" class="btn primary" id="connAdd">상품 추가</button>':`<span title="${E.conn.length?PS_ONE:''}"><button type="button" class="btn primary" id="connAdd" ${E.conn.length?'disabled':''}>상품 추가</button></span>`}</div>`;
 $('#connAdd').addEventListener('click',po?openConnModal:openPsModal);
 // 초기화: 연결한 상품을 모두 해제하고 구성 영역 배정·옵션 매핑에서도 뺀다
 $('#connReset').addEventListener('click',()=>{ if(!E.conn.length) return; E.conn=[]; if(po) E.areas.forEach(a=>{ a.pos=[]; a.map={}; }); onConnChange(); toast('연결 상품을 초기화했어요'); });
 $$('#sb-conn [data-view]').forEach(b=>b.addEventListener('click',()=>openPoDetail(b.dataset.view)));
 $$('#sb-conn [data-un]').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.un; E.conn=E.conn.filter(x=>x!==id); if(po) E.areas.forEach(a=>{ a.pos=a.pos.filter(x=>x!==id); Object.keys(a.map).forEach(k=>{ if(a.map[k]===id) delete a.map[k]; }); }); onConnChange(); toast('연결을 해제했어요'); }));
}
const PS_ONE='PS 상품 전시는 PS 1개만 연결합니다';
// v0.3.2 MP 상품 전시: MP 1개만 연결한다. 연결되면 [상품 추가]를 막는다
const MP_ONE='MP 상품 전시는 MP 1개만 연결합니다';
function rConnMp(){
 const m=mpDemo(E.mp);
 // v0.3.1(11-25 시안): PO와 같은 배치(소제목 → 표 → 오른쪽 아래 버튼)
 $('#sb-conn').innerHTML=`<div class="bh">연결한 상품<span>총 <b>${m?1:0}</b>건</span></div>
 <div class="cn-tbl"><table><thead><tr><th>EPC 상품 ID</th><th>버전</th><th class="l">EPC 상품명</th><th>MP Spec</th><th>유효기간</th><th>판매 상태</th><th>상세</th></tr></thead><tbody>${m?`<tr><td>${m.id}</td><td>${m.ver}</td><td class="l"><b>${esc(m.name)}</b></td><td>${esc(m.target)}</td><td>${mpPeriod(m)}</td><td><span class="chip ${m.sale==='판매중'?'ok':''}">${m.sale}</span></td><td><span class="cn-acts"><button type="button" class="btn sm" id="mpView">보기</button><button type="button" class="btn sm" id="mpUn">연결 해제</button></span></td></tr>`
 :'<tr class="none"><td colspan="7">상품 추가로 전시할 MP 상품 1개를 연결하세요</td></tr>'}</tbody></table></div>
 <div class="cn-foot"><button type="button" class="btn" id="connReset" ${m?'':'disabled'}>초기화</button><span title="${m?MP_ONE:''}"><button type="button" class="btn primary" id="connAdd" ${m?'disabled':''}>상품 추가</button></span></div>`;
 const clear=msg=>{ E.mp=''; onConnChange(); toast(msg); };
 $('#connAdd').addEventListener('click',()=>{ if(mpDemo(E.mp)){ toast(MP_ONE); return; } openMpModal(); });
 $('#connReset').addEventListener('click',()=>{ if(m) clear('연결 상품을 초기화했어요'); });
 { const u=$('#mpUn'); if(u) u.addEventListener('click',()=>clear('연결을 해제했어요')); }
 { const v=$('#mpView'); if(v) v.addEventListener('click',()=>openMpDetail(m)); }
}
function openMpDetail(m){ modal(m.name,m.id,640);
 const R=[['EPC 상품 ID',m.id],['버전',m.ver],['EPC 상품명',m.name],['MP 유형',m.cat],['MP Spec',m.target],['유효기간',mpPeriod(m)],['판매 상태',m.sale],['설명',m.desc]];
 $('#mBody').innerHTML=`<div class="ftbl">${R.map(([l,v])=>seoRow(l,null,esc(v))).join('')}</div>`;
 $('#mFoot').innerHTML='<button type="button" class="btn primary" id="mc">닫기</button>'; $('#mc').addEventListener('click',closeModal); }
// 고정형·선택형은 영역이 1개라 연결 상품이 그대로 영역의 PO가 된다
function syncSingle(){ if(E.kind==='ps'||E.method==='complex'||!E.areas[0]) return; const a=E.areas[0]; a.pos=[...a.pos.filter(id=>E.conn.includes(id)),...E.conn.filter(id=>!a.pos.includes(id))]; a.def=(a.def||[]).filter(id=>a.pos.includes(id)); Object.keys(a.map).forEach(k=>{ if(!a.pos.includes(a.map[k])) delete a.map[k]; }); if(a.mode==='opt'&&areaHasSel(a)) a.mode='list'; }
// 연결 상품이 가진 템플릿을 콘텐츠 정보에 자동으로 넣는다(템플릿 연결). 이미 있는 템플릿은 다시 넣지 않고,
// 연결 해제로 가진 상품이 없어진 자동 항목은 뺀다. 복사해 직접 수정한 항목과 사용자가 지운 템플릿은 건드리지 않는다
const connPoList=()=>E.conn.map(k=>E.kind!=='ps'?poBy(k):psBy(k).po);
function syncConnTpls(){
 // 상품 콘텐츠 관리에서 지웠거나 미사용으로 바꾼 템플릿은 자동으로 붙이지 않는다
 const off=E.tplOff||[], want=[...new Set(connPoList().flatMap(p=>tplsForLv3(epcOf(p).lv3)))].filter(id=>!off.includes(id)&&tplBy(id)&&tplBy(id).on!==false);
 const n0=E.extras.length; E.extras=E.extras.filter(x=>!(x.auto&&x.mode==='link'&&!want.includes(x.src)));
 const have=new Set(E.extras.map(x=>x.src).filter(Boolean)), add=want.filter(id=>!have.has(id));
 add.forEach(id=>E.extras.push({id:nid(),t:tplBy(id).n,mode:'link',src:id,show:true,txt:'',auto:true}));
 if(add.length||E.extras.length!==n0) rExtra();
 return add.length;
}
// 주문 구성안 · 주문 단계를 정하는 값(svc)은 연결 상품 구분에서 계산한다: 기기 → 요금제 → 부가서비스 → 구독 → 제휴 순으로 본다
function syncPtype(){
 E.svc=E.kind!=='ps'?recPtype(connPOs(E).map(p=>p.type)):''; E.svcAuto=false; E.ptByConn=true;
}
// 화면에 보이는 상품 유형: 연결 상품의 LV3를 연결한 순서대로 겹치지 않게 모은다
const lv3Combo=()=>lv3ComboOf(E);
// v0.3.2: T기프트 · 티다팩 자동 배지를 다시 쓴다. 노출 중인 항목이 있고 배지를 켰을 때만 붙고, 직접 입력 배지와 합쳐 BADGE_MAX를 넘지 않는다
const autoBadges=d=>{ const a=[]; if(d.giftBadge&&d.giftOn!==false&&visibleGifts(d).length) a.push({k:'gift',t:'사은품 증정',c:'#0F6E56',s:'f',from:'T기프트'}); if(d.tdBadge&&visibleTd(d).length) a.push({k:'td',t:'티다팩 혜택',c:'#D85A30',s:'f',from:'티다팩'}); return a.slice(0,Math.max(0,BADGE_MAX-d.badges.length)); };
// v0.3.2: T기프트는 연결한 단말기(기기서비스), 티다팩은 연결한 요금제의 EPC 값으로만 자동 매칭한다(공용 syncBenefits는 연결 상품 전체로 매칭)
const connOfType=(d,type)=>Object.assign({},d,{conn:d.conn.filter(id=>(poBy(id)||{}).type===type)});
function syncBenefitsV(d){
 d.gifts=d.gifts||[]; d.tds=d.tds||[];
 if(d.kind==='ps'||d.kind==='mp'){ d.gifts=[]; d.tds=[]; return; }
 d.gifts=syncList(d.gifts,GIFT,connOfType(d,'기기서비스')).filter(x=>!(d.giftCut||[]).includes(x.id));
 d.tds=syncList(d.tds,TDP,connOfType(d,'요금제')).filter(x=>!(d.tdCut||[]).includes(x.id));
}
// v0.2.4 섹션 이름: 구매 후기 · 연관 및 유사 상품 · 주문 프로세스 연동 (display-rules.ts의 이름은 v0.2.3 · 목록이 함께 쓰므로 여기서만 바꾼다)
const SEC_LB={ch:'노출 채널',chset:'채널별 노출 제어',review:'구매 후기',expert:'전문가 리뷰',rel:'연관 및 유사 상품',more:'추가 설정',order:'주문 프로세스 연동'};
// v0.3: 전문가 리뷰는 이 화면에만 있어 구매 후기 다음에 넣는다(이전 버전 화면은 공용 SECS를 그대로 쓴다)
// v0.3.1: 화면 순서 = 공통(전시 유형 → 연결 상품 → 고객 선택 방식 → 노출 채널 → 전시 정보 → 콘텐츠 정보) → 통합 앱 전용(구매 후기 → 전문가 리뷰 → 연관 상품 → 주문)
const SEC_ORD=['kind','conn','method','ch','chset','info','extra','gcs','gshop','ggov','review','expert','rel','gift','td','order'];
const SECS=SECS0.flatMap(s=>s[0]==='review'?[['chset','채널별 노출 제어',true,'채널별 노출 제어'],...MP_GUIDE.map(([k,n])=>[k,n,false,n]),s,['expert','전문가 리뷰',false,'전문가 리뷰']]:[s]).map(([k,l,r,sh])=>[k,SEC_LB[k]||l,r,SEC_LB[k]||sh])
 .sort((a,b)=>(SEC_ORD.indexOf(a[0])+1||99)-(SEC_ORD.indexOf(b[0])+1||99));
// 통합 앱 전용 영역의 섹션: 노출 채널에 통합 APP · WEB이 없으면 '해당 없음'으로 보고 검사하지 않는다
// v0.3.2: 통합 앱 전용 영역(구매 후기 · 전문가 리뷰 · 연관 상품 · 주문)을 노출 채널로 숨기는 기능은 쓰지 않는다. 항상 노출한다
//  채널별 노출 제어(chset)만 통합 APP · WEB을 고를 때 보인다
const APP_SECS=['chset'];
// v0.3.2 MP 상품 전시: 구매 후기 · 전문가 리뷰 · 연관 및 유사 상품 · 주문 프로세스 연동을 노출 채널과 관계없이 고정으로 보여 준다
const appScope=d=>d.kind!=='ps'&&d.kind!=='mp'&&appOn(d);
const MP_HIDE=['chset','method','review','expert','gift','td'];
// 섹션 상태: 공용 규칙(display-rules) + 이 화면에만 있는 전문가 리뷰
// PS 상품 전시: 전시 콘텐츠 등록용. 연결 PS(1개) · 전시 설정(노출 영역) · 전시 정보(이미지 포함) · 콘텐츠 정보(상품 고시 등)만 쓴다.
//  고객 선택 방식 · 구매 후기 · 전문가 리뷰 · 연관 및 유사 상품 · 주문 프로세스 연동은 화면에서 숨기고 검사에서도 뺀다
const PS_HIDE=['chset','method','review','expert','rel','gift','td','order'];
// v0.3.2: 채널별 노출 제어는 공통 영역(노출 채널 바로 아래)에 있지만 통합 APP · WEB을 고를 때만 보인다
// v0.3.1(11-25 시안 2): 구매 후기 · 전문가 리뷰 섹션은 전시 정보 기본 설정 표의 행으로 옮겨 숨긴다
const hideSec=(k,d)=>k==='review'||k==='expert'||d.kind==='ps'&&PS_HIDE.includes(k)||d.kind==='mp'&&MP_HIDE.includes(k)||GUIDE_KEYS.includes(k)&&d.kind!=='mp'||k==='chset'&&!appScope(d)||secHidden(k,d);
// PS로 바꾸거나 PS 전시를 열 때: PS는 1개만, 숨긴 섹션 값은 끈다
function psReset(d){ if(d.kind!=='ps') return; d.conn=d.conn.slice(0,1); d.areas=[]; d.method='fixed'; d.review=false; d.expert=false; d.related=false; if(d.sim) d.sim.on=false; d.orderOn=false; }
// v0.3.2: 채널별 노출 제어는 이 화면에만 있어 필수 여부를 여기서 정한다(통합 APP · WEB을 고를 때만)
const isReq=(k,S)=>k==='chset'?S[k].st!=='na':isReq0(k,S);
const secState=d=>{ const S=sectionState(d); S.expert={st:d.expert?'on':'off',e:[]};
 // v0.3.2: 기기 구분이 없어져 검사 문구를 대표이미지로 바꾼다
 Object.values(S).forEach(x=>{ if(x&&x.e) x.e=x.e.map(t=>t==='모바일 대표 이미지를 등록하세요'?'대표이미지를 등록하세요':t); });
 // 채널별 노출 제어(통합 앱 전용 영역): 채널 전용 재고 수량 등 검사
 { const e=d.kind==='ps'?[]:chIssues(d); S.chset=e.length?{st:'warn',e}:{st:'done',e:[]}; }
 if(d.kind==='ps'){ PS_HIDE.forEach(k=>S[k]={st:'na',e:[]}); S.sim={st:'na',e:[]}; if(d.conn.length>1) S.conn={st:'warn',e:['PS 상품 전시는 PS 1개만 연결할 수 있어요']}; }
 if(d.kind!=='ps'&&!appScope(d)) APP_SECS.forEach(k=>S[k]={st:'na',e:[]});
 GUIDE_KEYS.forEach(k=>S[k]=d.kind!=='mp'?{st:'na',e:[]}:{st:(d.mpGuide||{})[k]===false?'off':'on',e:[]});
 if(d.kind==='mp') mpState(d,S);
 return S; };
// MP 상품 전시 검사: 연결 MP 1개 · 고객 선택 방식은 읽기 전용(필수 아님) · 대표 이미지 선택 · 제공 혜택 문구 · 주문 프로세스 필수
function mpState(d,S){
 MP_HIDE.forEach(k=>S[k]={st:'na',e:[]});
 S.conn=mpDemo(d.mp)?{st:'done',e:[]}:{st:'todo',e:['MP를 1개 연결하세요']};
 S.method={st:'na',e:[],opt:true};
 S.basic.e=S.basic.e.filter(t=>t!=='대표이미지를 등록하세요'); if(!S.basic.e.length) S.basic.st='done';
 S.info={st:S.basic.st==='done'&&S.desc.st==='done'?'done':S.basic.st==='todo'&&S.desc.st==='todo'?'todo':'warn',e:[...S.basic.e,...S.desc.e]};
 S.order=isMpPlan(d.orderPlan)?{st:'done',e:[]}:{st:'todo',e:['MP용 주문 프로세스를 연결하세요']};
}
const blockingV=d=>{ const S=secState(d); return SECS.filter(([k])=>isReq(k,S)&&(S[k].st==='todo'||S[k].st==='warn')).flatMap(([k,l])=>S[k].e.length?S[k].e.map(x=>[k,l,x]):[[k,l,'입력이 필요해요']]); };
const lv3Text=()=>lv3Combo().join(' + ');
function onConnChange(){ syncSingle(); PV={}; syncPtype(); syncBenefitsV(E); const n=syncConnTpls(); rConn(); rMethod(); rAttr(); rChset(); rBasic(); rDesc(); rSearch(); rRel(); rGift(); rTd(); rOrder(); refresh(); return n; }

// ---------- 3. 고객 선택 방식 ----------
const curArea=()=>E.areas.find(a=>a.id===cur);
const areaLabel=a=>a.name.trim()||(E.method==='complex'?`구성 영역 ${E.areas.indexOf(a)+1}`:'고객 선택 방식');
function rMethod(){
 const box=$('#sb-method');
 if(E.kind==='ps'){ box.innerHTML=ntc('','PS 상품 전시는 판매 단위가 아니라서 고객 선택 방식을 쓰지 않아요.'); return; }
 if(E.kind==='mp'){ box.innerHTML=`<div class="ftbl">${seoRow('구성 방식',null,'고정형 · MP 1개 <span class="pill">변경 불가</span>')}</div><p class="mp-gray">MP 상품 전시에서 고객이 고르는 항목(결합 유형, 회선, 할인 방식, 약정 등)은 주문 프로세스의 주문 코너에서 설정합니다.</p>`; return; }
 const M=[['fixed','고정형','연결 상품을 모두 제공'],['select','선택형','연결 상품 중에서 목록·옵션으로 고름'],['complex','복합형','구성 영역 N개를 순서대로 조합']];
 const m=M.find(x=>x[0]===E.method);
 // 상품 유형 · 구성 방식을 한 표로 묶는다
 // v0.3.1(11-25 시안 4): 공제 항목 반영 행을 다시 둔다(연결 상품이 없으면 비활성)
 box.innerHTML=`<div class="ftbl">
 ${seoRow('상품 유형',null,ptHtml())}
 ${seoRow('공제 항목 반영',null,dedField())}
 ${seoRow('구성 방식',null,`<span class="srch-radio" role="radiogroup" aria-label="구성 방식">${M.map(([k,t])=>`<label><input type="radio" name="dMethod" value="${k}" ${E.method===k?'checked':''}>${t}</label>`).join('')}</span>`)}
 </div>
 ${E.method==='complex'?'<div class="bh cs-top">구성 영역</div>':'<div class="ae-gap"></div>'}<div id="ae"></div>`;
 // 복합형에서 바꿀 때 확인 창을 취소하면 라디오를 원래 값으로 되돌린다
 $$('#sb-method input[name=dMethod]').forEach(r=>r.addEventListener('change',()=>{ setMethod(r.value); if(E.method!==r.value) rMethod(); }));
 bindDed();
 rAreas();
}
// ---------- 3-1. 상품 유형 ----------
// 연결 상품의 LV3 조합을 제목 아래 줄에 배지로 보여 준다(직접 바꿀 수 없음)
function ptHtml(){
 const l=lv3Combo();
 const res=l.length?l.map(x=>`<span class="v">${esc(x)}</span>`).join('<span class="p" aria-hidden="true">+</span>'):'<span class="f">연결 상품을 추가하세요.</span>';
 return `<div class="ptres">${res}</div>`;
}
function setMethod(m){
 if(m===E.method) return;
 if(m!=='complex'&&E.areas.length>1&&!confirm(`구성 영역 ${E.areas.length}개 중 첫 번째 영역만 남습니다. 바꿀까요?`)) return;
 E.method=m;
 if(m!=='complex'&&E.areas[0]) Object.assign(E.areas[0],{cond:'always',parent:null});
 if(m!=='complex'){ if(!E.areas.length) E.areas=[newArea()]; E.areas=[E.areas[0]]; const a=E.areas[0]; if(m==='fixed') a.mode='fixed'; else if(a.mode==='fixed') a.mode='list'; cur=a.id; syncSingle(); }
 PV={}; rMethod(); refresh();
}
function rAreas(){
 const multi=E.method==='complex';
 if(!curArea()) cur=E.areas[0]&&E.areas[0].id;
 const full=multi&&topFull();
 $('#ae').innerHTML=`<div class="ae ${multi?'':'single'}">${multi?`<div class="cs-side"><div class="al" id="al"></div><div id="alUn"></div><div class="cs-sfoot">${full?`<p class="hl" style="margin:0 0 8px;font-size:11px;color:var(--muted)">구성 영역은 ${TOP_MAX}개까지 추가할 수 있어요. ‘특정 선택일 때만’ 나오는 하위 영역은 개수에 넣지 않아요</p>`:''}<button type="button" class="btn primary cs-add" id="addA" ${full?'disabled':''}>구성 추가</button></div></div>`:''}<div class="ad" id="ad"></div></div><div id="adOut"></div>`;
 if(multi){ rAreaList(); $('#addA').addEventListener('click',()=>{ if(topFull()) return; const a=newArea('','fixed'); E.areas.push(a); cur=a.id; rAreas(); refresh(); }); }
 rDetail();
}
// 복합형 제공 조건: 항상 제공 / 특정 선택일 때만. 기준 영역은 이 영역보다 위에 있는 영역 중에서 고른다
const CONDN=[['always','항상 제공','다른 영역과 관계없이 늘 보여줘요'],['only','특정 선택일 때만','앞 영역에서 특정 상품을 골랐을 때만 이 영역이 나와요']];
const condParent=a=>E.method==='complex'&&a.cond&&a.cond!=='always'?E.areas.slice(0,E.areas.indexOf(a)).find(x=>x.id===a.parent)||null:null;
const condKids=a=>E.areas.filter(x=>x.cond&&x.cond!=='always'&&x.parent===a.id);
// 복합형 1뎁스(항상 제공) 영역은 TOP_MAX개까지. '특정 선택일 때만' 나오는 하위 영역은 세지 않는다
const TOP_MAX=3;
const isTop=a=>!a.cond||a.cond==='always';
const topCnt=()=>E.areas.filter(isTop).length;
const topFull=()=>topCnt()>=TOP_MAX;
const topMsg=()=>toast(`항상 제공 구성 영역은 ${TOP_MAX}개까지예요. 다른 영역을 먼저 정리해 주세요`);
// 기준이 될 수 있는 영역: 고객이 고르는 영역(상품 목록·옵션 선택)만. 고정 영역은 늘 같은 상품이라 조건이 의미 없다
const canBase=x=>x.mode!=='fixed';
const condBases=a=>E.areas.slice(0,E.areas.indexOf(a)).filter(canBase);
function condDepth(a){ let n=0, x=a; while(n<3&&(x=condParent(x))) n++; return n; }
// 하위 영역은 기준이 되는 상위 영역보다 아래에 있어야 한다
function areaOrderOk(n){ const bad=n.some((a,i)=>a.cond&&a.cond!=='always'&&n.findIndex(x=>x.id===a.parent)>=i); if(bad) toast('하위 영역은 기준이 되는 상위 영역보다 위로 갈 수 없어요'); return !bad; }
function condHtml(a,i){
 const p=condParent(a), el=condBases(a);
 // 앞에 고객이 고르는 영역이 없으면 조건을 걸 수 없다 (이미 걸린 조건은 풀 수 있도록 그대로 둔다)
 const why=!i?'첫 번째 영역은 쓸 수 없어요':'앞에 고객이 고르는 영역이 없어요. 고정 영역은 기준이 될 수 없어요';
 let h=`<div class="bh dash">구성 제공 조건</div><div class="cdg" role="radiogroup" aria-label="구성 제공 조건">${CONDN.map(([k,t,s])=>{ const capA=k==='always'&&!isTop(a)&&topFull(), dis=capA||(k!=='always'&&!el.length&&a.cond!==k); return `<label class="cdc ${a.cond===k?'on':''} ${dis?'dis':''}"><input type="radio" name="cd${a.id}" data-cd="${k}" ${a.cond===k?'checked':''} ${dis?'disabled':''}><span><b>${t}</b><small>${capA?`항상 제공 영역이 이미 ${TOP_MAX}개예요`:dis?why:s}</small></span></label>`; }).join('')}</div>`;
 if(a.cond==='always'||!i) return h;
 const fixedP=p&&!canBase(p), opt=(x,j)=>`<option value="${x.id}" ${p&&p.id===x.id?'selected':''} ${canBase(x)?'':'disabled'}>${j+1}번 ${esc(areaLabel(x))}${canBase(x)?' · '+MODE[x.mode]:' (고정 · 기준 불가)'}</option>`;
 const sel=`<div class="row" style="margin-bottom:12px"><select id="cdPa" aria-label="기준 영역" style="min-width:220px">${p?'':'<option value="">기준 영역 선택</option>'}${fixedP?`<option value="${p.id}" selected>${E.areas.indexOf(p)+1}번 ${esc(areaLabel(p))} (고정 · 기준 불가)</option>`:''}${E.areas.slice(0,i).map((x,j)=>fixedP&&x.id===p.id?'':opt(x,j)).join('')}</select><b class="cond-guide">에서 아래 상품을 고르면 ‘${i+1}번 ${esc(areaLabel(a))}’가 나와요.</b></div>`;
 if(!p) return h+`<div class="rel">${sel}</div>`;
 // 기준 영역이 나중에 고정으로 바뀐 경우: 칩 대신 경고와 해결 방법
 if(fixedP) return h+`<div class="rel">${sel}<div class="fbx warn">${E.areas.indexOf(p)+1}번 ${esc(areaLabel(p))}은 <b>고정</b>이라 고객이 고르지 않아요. 구성 상품이 늘 포함되니 조건이 항상 같아집니다.<br>${el.length?'다른 기준 영역을 고르거나 ':''}<a href="#" id="cdAlways">항상 제공으로 바꾸기</a></div></div>`;

 const ps=p.pos;
 return h+`<div class="rel">${sel}<div>${ps.map(v=>`<label class="ccb"><input type="checkbox" data-tg="${v}" ${a.trig.includes(v)?'checked':''}>${esc(poBy(v).name)}</label>`).join('')||'<span class="cskip">기준 영역에 배정된 PO가 없어요</span>'}</div></div>`;
}
function rAreaList(){
 $('#al').innerHTML=E.areas.map((a,i)=>{ const p=condParent(a), pi=p&&E.areas.indexOf(p)+1, tg=(!p?'':!canBase(p)?'<span class="chip warn">기준 영역이 고정</span>':`<span class="chip acc">${pi}번에서 고르면 노출</span>`); return `<div class="ali ${a.id===cur?'on':''}" data-a="${a.id}" style="margin-left:${condDepth(a)*16}px"><span class="cs-grip" aria-hidden="true">⠿</span><span class="ix">${i+1}</span><div class="nm"><b>${esc(areaLabel(a))}</b><small>${MODE[a.mode]}</small>${tg?`<div>${tg}</div>`:''}</div></div>`; }).join('')||'<div class="empty">구성 영역을 추가하세요</div>';
 // v0.3.1: 구성 영역은 추가한 순서 그대로 둔다(끌어서 위치 이동 금지)
 $$('#al .ali[data-a]').forEach(el=>el.addEventListener('click',()=>{ cur=+el.dataset.a; rAreas(); }));
 // 어느 영역에도 배정되지 않은 연결 상품
 const un=E.conn.filter(id=>!E.areas.some(a=>a.pos.includes(id)));
 $('#alUn').innerHTML=un.length?`<div class="un warn"><b>미배정 ${un.length}</b><br>${un.map(id=>esc(poBy(id).name)).join(', ')}</div>`:E.conn.length?'<div class="un ok">연결 상품이 모두 배정됐어요</div>':'';
}
// 선택 PS가 있는 PO는 고정형 · 상품목록(목록에서 선택)에서만 쓴다. 옵션형은 잠근다(정책서 배정 단위, 11-17 확정)
function rDetail(){
 const a=curArea(); const box=$('#ad'); if(!a){ box.innerHTML='<div class="empty">구성 영역을 추가하세요</div>'; return; }
 const i=E.areas.indexOf(a), multi=E.method==='complex', sel=areaHasSel(a);
 let lg='';
 // 고정형·선택형은 위 소제목이 이미 '○○형 설정'이라 영역 번호 제목은 복합형에서만 쓴다
 const kids=multi?condKids(a):[];
 // v0.3.1(11-25 시안 4: 고객 선택 방식 케이스): 소제목은 '• 1단계' · '- 2단계', 입력은 왼쪽 항목명 표, 빈 상태는 회색 상자, 안내는 ⓘ 한 줄
 const note=t=>`<p class="cs-note"><i aria-hidden="true">!</i>${t}</p>`, empty=t=>`<div class="cs-empty">${t}</div>`;
 const modeRadios=ks=>`<span class="srch-radio" id="aMode" role="radiogroup" aria-labelledby="aModeLb">${ks.map(k=>`<label><input type="radio" name="aMode${a.id}" value="${k}" ${a.mode===k?'checked':''} ${k==='opt'&&sel?'disabled':''}>${MODE[k]}</label>`).join('')}</span>`;
 // 상품 목록 설정: 최소 ~ 최대(최대 수량 따로 설정) 또는 선택 수량 하나. 복합형은 '최소'
 const qtyField=()=>{ const n=(id,v,lb)=>`<input type="number" id="${id}" min="1" value="${v}" aria-label="${lb}">`;
  const f=a.opt0&&!multi?`<span class="cs-ql">최대</span>${n('qMx',a.useMax?a.mx:a.q,'최대 선택 수량')}<span class="cs-ql">개까지</span>`
   :a.useMax?`<span class="cs-ql">최소</span>${n('qQ',a.q,'최소 선택 수량')}<span class="cs-dash">-</span><span class="cs-ql">최대</span>${n('qMx',a.mx,'최대 선택 수량')}<span class="cs-ql">개</span>`
   :`<span class="cs-ql">${multi?'최소':'선택 수량'}</span>${n('qQ',a.q,multi?'최소 선택 수량':'선택 수량')}<span class="cs-ql">개</span>`;
  return `<div class="cs-qty">${f}<label class="chkl"><input type="checkbox" id="qUse" ${a.useMax?'checked':''}>최대 수량 따로 설정</label></div>`; };
 let h=multi?`<div class="bh">${i+1}번 구성 영역${kids.length?`<span class="chip">하위 ${kids.length}개가 이 영역을 기준으로 써요</span>`:''}${E.areas.length>1?'<button type="button" class="btn sm" id="delA" style="margin-left:auto">구성 삭제</button>':''}</div>
 <div class="ftbl">${seoRow('<label for="aName">구성명</label>',null,`<input type="text" id="aName" value="${esc(a.name)}" placeholder="고객에게 보이는 단계 이름 · 입력하면 미리보기에 노출돼요" style="width:100%">`)}
 ${seoRow('<span id="aModeLb">고객이 고르는 방법</span>',null,modeRadios(['fixed','list','opt']))}
 ${a.mode==='list'?seoRow('상품 목록 설정',null,qtyField()):''}</div>`
 // 고정형 · 선택형: '• 타이틀' 표, 선택형이면 '- 고객이 고르는 방법' 표(선택 방식 · 상품 목록 설정)
 :`<div class="bh">타이틀</div><div class="ftbl">${seoRow('<label for="aName">타이틀</label>',null,`<input type="text" id="aName" value="${esc(a.name)}" placeholder="고객 선택 방식 타이틀 · 입력하면 미리보기에 노출돼요" style="width:100%">`)}</div>
 ${E.method==='select'?`<div class="bh dash">고객이 고르는 방법</div><div class="ftbl">${seoRow('<span id="aModeLb">선택 방식</span>',null,modeRadios(['list','opt']))}${a.mode==='list'?seoRow('상품 목록 설정',null,qtyField()):''}</div>`:''}`;
 // 복합형 목록에서 선택: 선택 수량 안내는 표 바로 아래 한 줄
 if(a.mode==='list'&&multi){ a.opt0=false; a.def=[]; const r=rng(a); h+=note(`대상 상품 ${a.pos.length}개 중 ${r.lo===r.hi?r.lo:r.lo+'~'+r.hi}개를 선택합니다`); }
 if(multi){ h+=`<div class="bh dash">구성에 넣을 상품</div>
 ${a.mode==='fixed'&&sel?ntc('info',MSG1):''}
 ${E.conn.length?`<div class="pg">${E.conn.map(id=>{ const p=poBy(id), on=a.pos.includes(id), o=E.areas.filter(x=>x!==a&&x.pos.includes(id)).map(x=>E.areas.indexOf(x)+1);
  // 다른 구성에서 이미 쓰는 상품은 고를 수 없다 (이미 체크된 상품은 해제할 수 있게 둔다)
  const used=!on&&o.length>0, block=used||(!on&&a.mode==='opt'&&hasSel(p));
  return `<label class="pgr ${on?'on':''} ${block?'dis':''}" ${block?`title="${used?'다른 구성에서 사용 중인 상품이에요':MSG2}"`:''}><input type="checkbox" data-pc="${id}" ${on?'checked':''} ${block?'disabled':''}><span class="pn">${esc(p.name)}${o.length?`<small>· ${o.map(n=>`${n}번 구성 사용중`).join(', ')}</small>`:''}</span>${hasSel(p)?'<span class="chip acc">선택 PS</span>':''}<span class="chip">${p.type}</span></label>`; }).join('')}</div>`:empty('연결 상품을 먼저 추가하세요')}`; }
 // 고정 안내: 상품이 있을 때만. 고정형(영역 1개)은 설정 박스 밖(아래)에 둔다
 let fixedGuide='';
 if(a.mode==='fixed'&&a.pos.length){ const g=guide(`대상 상품 <b>${a.pos.length}개가 모두 고정으로 포함</b>됩니다`,`고객이 상품을 따로 선택하지 않습니다${sel?`<br>${MSG1}`:''}`); if(multi) h+=g; else fixedGuide=g; }
 if(a.mode==='list'&&!multi){ const r=rng(a);
  h+=`<div class="bh dash">상품 순서/기본 선택</div>
  ${a.pos.map((id,j)=>{ const p=poBy(id); return `<div class="ali fixd"><span class="ix">${j+1}</span><div class="nm"><b>${esc(p.name)}</b><small>${priceTxt(p)}${hasSel(p)?' · 선택 PS 있음':''}</small></div><label class="chkl"><input type="${r.hi===1?'radio':'checkbox'}" name="df${a.id}" data-df="${id}" ${(a.def||[]).includes(id)?'checked':''}>기본 선택값</label>${mvBtns('p',j,a.pos.length,esc(p.name))}</div>`; }).join('')||empty('연결 상품을 추가하세요')}`; }
 if(a.mode==='opt'){ const c=combos(a), ok=c.filter(k=>a.map[k]&&a.pos.includes(a.map[k])).length, cand=a.pos.filter(id=>!hasSel(poBy(id)));
  // 옵션 구성 카드: 옵션마다 이름 줄(회색) + 노출유형 · 옵션값 표. 텍스트 값은 입력 후 Enter(쉼표로 여러 개), 용량 · 컬러 · 이미지는 [+ 추가] 창
  h+=`<div class="cs-optbox"><div class="cs-opth"><b>옵션 구성</b><button type="button" class="btn sm" id="addO">옵션 추가</button></div>
  ${a.opts.map((o,k)=>{ const miss=o.disp==='img'?o.vals.filter(v=>!oImg(o,v)).length:0;
   const vals=o.vals.length?`<div class="axv cs-vals">${o.vals.map((v,j)=>`<span class="och v"><button type="button" class="ve" id="ve${a.id}_${k}_${j}" data-ve="${k}:${j}" title="눌러서 수정">${valView(o,v)}${esc(v)}</button><button type="button" class="vx" data-vx="${k}:${j}" aria-label="${esc(v)} 삭제">×</button></span>`).join('')}</div>`:'';
   const add=o.disp==='text'?`<input type="text" class="cs-vin" data-vin="${k}" placeholder="값 입력 후 Enter" aria-label="${esc(o.name)||'옵션'} 값 입력"><p class="cs-hint">*단어 입력 후 Enter, 여러 개는 쉼표(,)로 구분해 한 번에 입력하세요 (최소 1개 최대 ${VAL_MAX}개)</p>`
    :`<button type="button" class="addo" id="axAdd${a.id}_${k}" data-vadd="${k}">+ ${o.disp==='img'?'이미지':esc(o.name.trim()||'값')} 추가</button>`;
   return `<div class="cs-opt"><div class="cs-optn"><input type="text" class="axn" data-on="${k}" value="${esc(o.name)}" placeholder="옵션명 (예: 용량, 색상)" aria-label="옵션 ${k+1} 이름"><button type="button" class="btn sm cs-del" data-ox="${k}">삭제</button></div>
   <div class="ftbl">${seoRow('노출유형',null,`<span class="srch-radio" role="radiogroup" aria-label="${esc(o.name)||'옵션'} 노출유형">${DISP.map(([v,t])=>`<label><input type="radio" name="od${a.id}_${k}" data-od="${k}:${v}" ${o.disp===v?'checked':''}>${t}</label>`).join('')}</span>`)}
   ${seoRow('옵션값',null,`${vals}${add}${miss?`<div class="er">이미지가 없는 값 ${miss}개 · 값을 눌러 이미지를 등록하세요</div>`:''}`)}</div></div>`; }).join('')}</div>
  <div class="bh dash">조합별 PO 매핑<span class="cs-cnt"><b>${ok}</b>매핑</span><small class="cs-sm">${c.length}개 조합</small>${c.length&&cand.length?'<button type="button" class="btn sm" id="autoMap" style="margin-left:auto">이름으로 자동 매핑</button>':''}</div>
  ${c.length?`<div class="cl"><table><thead><tr>${a.opts.filter(o=>o.name.trim()&&o.vals.length).map(o=>`<th>${esc(o.name)}</th>`).join('')}<th style="width:50%">매핑 PO <span class="pill">(${multi?'배정한 PO':'연결 상품'} 중)</span></th></tr></thead><tbody>${c.map(k=>`<tr>${k.split('|').map(v=>`<td>${esc(v)}</td>`).join('')}<td><select data-mk="${esc(k)}" aria-label="${esc(k)} 매핑"><option value="">PO 선택</option>${cand.map(id=>`<option value="${id}" ${a.map[k]===id?'selected':''}>${esc(poBy(id).name)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:empty('옵션명과 값을 넣으면 조합이 생겨요')}
  ${!cand.length?note(`매핑할 PO가 없어요. ${multi?'위에서 PO를 먼저 배정하세요':'연결 상품을 먼저 추가하세요'}`):''}`; }
 if(multi) h+=condHtml(a,i);
 box.innerHTML=h;
 // 고정형·선택형(영역 1개)의 안내 박스는 설정 박스 밖 아래에 둔다
 const out=$('#adOut'); if(out) out.innerHTML=fixedGuide||(!multi&&lg?lg:'');
 const ch=()=>{ PV={}; rMethod(); refresh(); };
 const q=s=>box.querySelector(s), qa=s=>[...box.querySelectorAll(s)];
 q('#aName').addEventListener('input',ev=>{ a.name=ev.target.value; if(multi) rAreaList(); refresh(); });
 const dA=q('#delA'); if(dA) dA.addEventListener('click',()=>{
  // 하위 영역은 '항상 제공'으로 바뀌므로, 그러면 1뎁스가 TOP_MAX개를 넘을 때는 지우지 않는다
  if(topCnt()-(isTop(a)?1:0)+kids.length>TOP_MAX){ toast(`이 영역을 기준으로 쓰는 하위 영역이 항상 제공으로 바뀌면 ${TOP_MAX}개를 넘어요. 하위 영역을 먼저 정리해 주세요`); return; }
  if(kids.length&&!confirm(`${kids.map(areaLabel).join(', ')} 영역이 이 영역을 기준으로 쓰고 있어요. 삭제하면 그 영역의 제공 조건이 "항상 제공"으로 바뀝니다. 삭제할까요?`)) return;
  kids.forEach(k=>Object.assign(k,{cond:'always',parent:null})); E.areas.splice(i,1); cur=(E.areas[i]||E.areas[i-1]||{}).id; ch(); });
 // 제공 조건
 // 조건을 고르면 기준 영역이 없거나 고정일 때 바로 위의 고르는 영역으로 맞춘다
 qa('[data-cd]').forEach(r=>r.addEventListener('change',()=>{ if(r.dataset.cd==='always'&&!isTop(a)&&topFull()){ topMsg(); ch(); return; } a.cond=r.dataset.cd; if(a.cond!=='always'){ const p=condParent(a); if(!p||!canBase(p)){ const el=condBases(a); a.parent=el.length?el[el.length-1].id:null; a.trig=[]; } } ch(); }));
 const ca=q('#cdAlways'); if(ca) ca.addEventListener('click',e=>{ e.preventDefault(); if(topFull()){ topMsg(); return; } Object.assign(a,{cond:'always',parent:null}); ch(); });
 const pa=q('#cdPa'); if(pa) pa.addEventListener('change',()=>{ a.parent=pa.value?+pa.value:null; a.trig=[]; ch(); });
 qa('[data-tg]').forEach(b=>b.addEventListener('change',()=>{ const v=b.dataset.tg; a.trig=b.checked?[...new Set([...a.trig,v])]:a.trig.filter(x=>x!==v); ch(); }));
 qa('#aMode input').forEach(r=>r.addEventListener('change',()=>{ a.mode=r.value; if(a.mode==='fixed'&&kids.length) toast(`${kids.map(k=>E.areas.indexOf(k)+1+'번').join(', ')} 영역이 이 영역을 기준으로 써요. 고정으로 바꾸면 기준을 다시 정해야 해요`); ch(); }));
 // 구성 상품 체크: 해제하면 기본 선택·옵션 매핑에서도 뺀다
 qa('[data-pc]').forEach(c=>c.addEventListener('change',()=>{ const id=c.dataset.pc;
  if(c.checked){ if(!a.pos.includes(id)) a.pos.push(id); if(a.mode==='fixed'&&hasSel(poBy(id))) toast(MSG1); }
  else { a.pos=a.pos.filter(x=>x!==id); a.def=(a.def||[]).filter(x=>x!==id); Object.keys(a.map).forEach(k=>{ if(a.map[k]===id) delete a.map[k]; }); }
  ch(); }));
 qa('[data-pu]').forEach(b=>b.addEventListener('click',()=>{ const j=+b.dataset.pu; [a.pos[j-1],a.pos[j]]=[a.pos[j],a.pos[j-1]]; ch(); }));
 qa('[data-pd]').forEach(b=>b.addEventListener('click',()=>{ const j=+b.dataset.pd; [a.pos[j+1],a.pos[j]]=[a.pos[j],a.pos[j+1]]; ch(); }));
 qa('[data-df]').forEach(c=>c.addEventListener('change',()=>{ const id=c.dataset.df, hi=rng(a).hi; a.def=a.def||[]; if(hi===1) a.def=[id]; else if(c.checked){ if(a.def.length>=hi){ c.checked=false; toast(`기본 선택은 최대 ${hi}개예요`); return; } a.def.push(id); } else a.def=a.def.filter(x=>x!==id); ch(); }));
 const num=(id,f)=>{ const x=q(id); if(x) x.addEventListener('change',()=>{ f(Math.max(1,parseInt(x.value)||1)); ch(); }); };
 num('#qQ',v=>{ a.q=v; if(a.useMax&&a.mx<v) a.mx=v; });
 num('#qMx',v=>{ if(a.useMax) a.mx=Math.max(v,a.opt0?1:a.q); else a.q=v; });
 const qu=q('#qUse'); if(qu) qu.addEventListener('change',()=>{ a.useMax=qu.checked; if(a.useMax) a.mx=Math.max(a.q+1,2); ch(); });
 const qo=q('#qOpt'); if(qo) qo.addEventListener('change',()=>{ a.opt0=qo.checked; ch(); });
 const ao=q('#addO'); if(ao) ao.addEventListener('click',()=>{ a.opts.push({name:'',vals:[],disp:'text'}); closePop(); rDetail(); });
 qa('[data-on]').forEach(t=>t.addEventListener('change',()=>{ a.opts[+t.dataset.on].name=t.value.trim(); ch(); }));
 qa('[data-od]').forEach(b=>b.addEventListener('click',()=>{ const [k,v]=b.dataset.od.split(':'), o=a.opts[+k]; if(o.disp===v) return; o.disp=v; closePop(); ch(); toast(`${o.name.trim()||'옵션'}을(를) ${DISP.find(d=>d[0]===v)[1]}(으)로 보여줘요`); }));
 qa('[data-ox]').forEach(b=>b.addEventListener('click',()=>{ a.opts.splice(+b.dataset.ox,1); if(!a.opts.length) a.opts.push({name:'',vals:[],disp:'text'}); ch(); }));
 qa('[data-vx]').forEach(b=>b.addEventListener('click',()=>{ const [k,j]=b.dataset.vx.split(':').map(Number), o=a.opts[k], v=o.vals[j]; o.vals.splice(j,1); if(o.hex) delete o.hex[v]; if(o.img) delete o.img[v]; closePop(); ch(); }));
 // 값 추가 · 수정: 노출 방식에 따라 컬러 팝오버 · 텍스트 목록 팝오버 · 이미지 등록 대화상자. 같은 버튼을 다시 누르면 닫는다
 // 텍스트 값: 입력 후 Enter. 쉼표로 여러 개를 한 번에 넣고, 같은 값은 한 번만. 옵션마다 최대 VAL_MAX개
 qa('[data-vin]').forEach(t=>t.addEventListener('keydown',ev=>{ if(ev.key!=='Enter'||ev.isComposing) return; ev.preventDefault();
  const k=+t.dataset.vin, o=a.opts[k], nv=[...new Set(t.value.split(',').map(x=>x.trim()).filter(Boolean))].filter(x=>!o.vals.includes(x));
  if(!nv.length){ t.value=''; return; }
  const room=VAL_MAX-o.vals.length; if(room<=0){ toast(`옵션값은 최대 ${VAL_MAX}개예요`); return; }
  o.vals.push(...nv.slice(0,room)); if(nv.length>room) toast(`옵션값은 최대 ${VAL_MAX}개라 ${room}개만 넣었어요`);
  ch(); const nx=document.querySelector(`#ad [data-vin="${k}"]`); if(nx) nx.focus(); }));
 qa('[data-vadd]').forEach(b=>b.addEventListener('click',()=>{ if(popFor(b)){ closePop(); return; } addVal(a,+b.dataset.vadd,b); }));
 qa('[data-ve]').forEach(b=>b.addEventListener('click',()=>{ if(popFor(b)){ closePop(); return; } const [k,j]=b.dataset.ve.split(':').map(Number); editVal(a,k,j,b); }));
 qa('[data-mk]').forEach(s=>s.addEventListener('change',()=>{ if(s.value) a.map[s.dataset.mk]=s.value; else delete a.map[s.dataset.mk]; ch(); }));
 const am=q('#autoMap'); if(am) am.addEventListener('click',()=>{ let n=0; combos(a).forEach(k=>{ if(a.map[k]) return; const vs=k.split('|'); const p=a.pos.map(poBy).find(p=>!hasSel(p)&&vs.every(v=>p.name.includes(v))); if(p){ a.map[k]=p.id; n++; } }); ch(); toast(n?`${n}개 조합을 자동 매핑했어요`:'이름이 맞는 PO를 찾지 못했어요'); });
}

// ---------- 3-2. 선택형 옵션 값 (ref/product-admin-prototype-v026.html) ----------
// 옵션마다 고객 노출 방식(텍스트 · 컬러 · 이미지)을 고르고, 값은 주로 목록에서 고르고 없으면 직접 입력한다.
// 값 목록 기준: 상품 콘텐츠 관리(컬러 · 용량 · 사이즈 · 기타 옵션)의 사용 중인 값. 연결 상품 이름에 있는 값은 '연결 상품에 있음'으로 표시한다.
// 값은 지금처럼 문자열(조합 · 매핑 규칙과 같이 씀)로 두고, 컬러 HEX는 o.hex[값], 이미지는 o.img[값]={n,u}에 둔다
// 고객 노출 방식: 텍스트(기본) · 용량(목록에서 선택) · 컬러(컬러칩) · 이미지. 용량은 고객 화면에서 텍스트와 같이 보인다
const DISP=[['text','텍스트'],['cap','용량'],['chip','컬러'],['img','이미지']];
const VAL_MAX=300;
const COLORS=()=>CONTENT.color.filter(c=>c.on).map(c=>[c.n,c.hex]);
// 이미지 창의 최근 등록 이미지 (화면을 새로 열면 사라진다)
const RECENT={imgs:[]};
const oHex=(o,v)=>(o.hex&&o.hex[v])||(COLORS().find(c=>c[0]===v)||[])[1]||COLOR[v]||'#BBBBBB';
const oImg=(o,v)=>o.img&&o.img[v]&&o.img[v].u?o.img[v]:null;
function normHex(x){ x=(x||'').trim().replace(/^#/,''); if(/^[0-9a-f]{3}$/i.test(x)) x=x.split('').map(c=>c+c).join(''); return /^[0-9a-f]{6}$/i.test(x)?'#'+x.toUpperCase():null; }
function valView(o,v,sz=14){
 if(o.disp==='chip') return `<i class="vsw" style="width:${sz}px;height:${sz}px;background:${oHex(o,v)}"></i>`;
 if(o.disp==='img'){ const m=oImg(o,v); return m?`<img class="vimg" src="${m.u}" alt="" style="width:${sz+8}px;height:${sz+8}px">`:`<i class="vimg no" style="width:${sz+8}px;height:${sz+8}px">+</i>`; }
 return ''; }
// 옵션 이름으로 고르는 기준값 목록
function presetText(name){ const n=name.trim();
 if(/용량/.test(n)) return CONTENT.cap.filter(c=>c.on).sort((x,y)=>x.gb-y.gb).map(c=>c.n);
 if(/사이즈|크기/.test(n)) return CONTENT.size.filter(c=>c.on).map(c=>c.n);
 if(/컬러|색상/.test(n)) return COLORS().map(c=>c[0]);
 return CONTENT.etc.filter(c=>c.on&&c.group===n).map(c=>c.n); }
// 값 이름을 바꾸면 조합 매핑 키도 함께 바꾼다
function renameVal(a,o,j,n){ const old=o.vals[j]; if(old===n) return; o.vals[j]=n;
 ['hex','img'].forEach(k=>{ if(o[k]&&o[k][old]!=null){ o[k][n]=o[k][old]; delete o[k][old]; } });
 const m={}; Object.entries(a.map).forEach(([key,id])=>{ m[key.split('|').map(x=>x===old?n:x).join('|')]=id; }); a.map=m; }
const optCh=()=>{ PV={}; rMethod(); refresh(); };
// 팝오버: 누른 버튼 아래에 띄운다. 바깥을 누르거나 Esc로 닫는다
const pop=document.createElement('div'); pop.className='pop'; pop.hidden=true; pop.setAttribute('role','dialog'); document.body.appendChild(pop);
const popFor=btn=>!pop.hidden&&pop.dataset.for===btn.id;
function openPop(btn,html,bind){ if(!btn) return; pop.innerHTML=html; pop.hidden=false; const r=btn.getBoundingClientRect(), w=pop.offsetWidth||320, vw=document.documentElement.clientWidth; let x=r.left+scrollX; if(x+w>scrollX+vw-12) x=scrollX+vw-w-12; pop.style.left=Math.max(12,x)+'px'; pop.style.top=(r.bottom+scrollY+6)+'px'; pop.dataset.for=btn.id||''; bind(); }
function closePop(){ pop.hidden=true; pop.dataset.for=''; }
document.addEventListener('mousedown',e=>{ if(!pop.hidden&&!pop.contains(e.target)&&!(pop.dataset.for&&e.target.closest('#'+pop.dataset.for))) closePop(); });
const pq=s=>pop.querySelector(s);
const addBtn=(a,k)=>document.getElementById(`axAdd${a.id}_${k}`);
// 컬러: 연결 상품에 있는 컬러 · 자주 쓰는 컬러(상품 콘텐츠 관리) · 최근 사용 · 직접 지정(컬러 피커 + HEX + 컬러명)
// 값 추가 창(용량 · 컬러 · 텍스트)은 모두 같은 크기의 작은 창. 제목 · 안내 문구 없이 입력 한 줄(또는 목록)만 둔다
// 컬러: 컬러 피커 · HEX 코드 · 컬러명 · [적용] 한 줄. 추가 · 수정 모두 [적용]
function colorPop(a,k,btn,j){
 const o=a.opts[k], edit=j!=null, cur=edit?o.vals[j]:null, has=n=>o.vals.some((x,i)=>x===n&&i!==j), curHex=edit?oHex(o,cur):'#5B7CFA';
 openPop(btn,`<div class="pline"><input type="color" id="cpH" value="${curHex}" aria-label="컬러 피커"><input type="text" class="mono" id="cpX" value="${curHex}" maxlength="7" aria-label="HEX 코드"><input type="text" id="cpN" maxlength="12" value="${esc(cur||'')}" placeholder="컬러명" aria-label="컬러명"><button type="button" class="btn sm primary" id="cpOk">적용</button></div>
 <div class="er" id="cpE" hidden></div>`,()=>{
  const err=t=>{ pq('#cpE').textContent=t; pq('#cpE').hidden=!t; };
  pq('#cpH').addEventListener('input',e=>{ pq('#cpX').value=e.target.value.toUpperCase(); err(''); });
  pq('#cpX').addEventListener('input',e=>{ const h=normHex(e.target.value); if(h){ pq('#cpH').value=h; err(''); } else err(e.target.value.length>=4?'HEX 코드는 #RRGGBB 형식이에요':''); });
  pq('#cpX').addEventListener('blur',e=>{ const h=normHex(e.target.value); if(h) e.target.value=h; });
  const ok=()=>{ const n=pq('#cpN').value.trim(), h=normHex(pq('#cpX').value);
   if(!h){ err('HEX 코드를 확인하세요'); pq('#cpX').focus(); return; }
   if(!n){ err('컬러명을 입력하세요'); pq('#cpN').focus(); return; }
   if(has(n)){ err('같은 이름의 컬러가 이미 있어요'); return; }
   if(edit) renameVal(a,o,j,n); else o.vals.push(n);
   o.hex=o.hex||{}; o.hex[n]=h;
   toast(edit?`${n} 컬러를 수정했어요`:`${n} 컬러를 추가했어요`);
   closePop(); optCh(); };
  pq('#cpOk').addEventListener('click',ok);
  pq('#cpN').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing) ok(); });
  if(!edit) pq('#cpN').focus();
 });
}
// 용량: 상품 콘텐츠 관리의 용량 값(작은 것부터)을 목록에서 체크한다. 체크하면 바로 반영
function capPop(a,k,btn){
 const o=a.opts[k], all=[...new Set([...CONTENT.cap.filter(c=>c.on).sort((x,y)=>x.gb-y.gb).map(c=>c.n),...o.vals])];
 openPop(btn,`<div class="ml2">${all.map(x=>`<label><input type="checkbox" data-tv="${esc(x)}" ${o.vals.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div>`,()=>{
  pop.querySelectorAll('[data-tv]').forEach(c=>c.addEventListener('change',()=>{ const v=c.dataset.tv, st=pop.querySelector('.ml2').scrollTop;
   if(c.checked){ o.vals.push(v); o.vals.sort((x,y)=>all.indexOf(x)-all.indexOf(y)); } else o.vals=o.vals.filter(x=>x!==v);
   optCh(); capPop(a,k,addBtn(a,k)); pop.querySelector('.ml2').scrollTop=st; }));
 });
}
// 텍스트: 값 입력 · [적용] 한 줄. 이 옵션명의 기준값(상품 콘텐츠 관리 기타 옵션)이 있으면 아래에 체크 목록
function textPop(a,k,btn){
 const o=a.opts[k], all=[...new Set([...presetText(o.name),...o.vals])];
 openPop(btn,`<div class="pline"><input type="text" id="tpQ" maxlength="12" placeholder="값 입력" aria-label="값 입력"><button type="button" class="btn sm primary" id="tpAdd">적용</button></div>
 <div class="er" id="tpE" hidden></div>
 ${all.length?`<div class="ml2" style="margin-top:8px">${all.map(x=>`<label><input type="checkbox" data-tv="${esc(x)}" ${o.vals.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div>`:''}`,()=>{
  const qi=pq('#tpQ'); qi.focus();
  const add=()=>{ const v=qi.value.trim(); if(!v) return; if(o.vals.includes(v)){ pq('#tpE').textContent='같은 값이 이미 있어요'; pq('#tpE').hidden=false; return; } o.vals.push(v); optCh(); textPop(a,k,addBtn(a,k)); };
  qi.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing){ e.preventDefault(); add(); } });
  pq('#tpAdd').addEventListener('click',add);
  pop.querySelectorAll('[data-tv]').forEach(c=>c.addEventListener('change',()=>{ const v=c.dataset.tv;
   if(c.checked){ o.vals.push(v); o.vals.sort((x,y)=>all.indexOf(x)-all.indexOf(y)); } else o.vals=o.vals.filter(x=>x!==v);
   optCh(); textPop(a,k,addBtn(a,k)); }));
 });
}
// 텍스트 값 수정: 값 · [삭제] · [적용] 한 줄
function renamePop(a,k,j,btn){
 const o=a.opts[k], v=o.vals[j];
 openPop(btn,`<div class="pline"><input type="text" id="rnI" value="${esc(v)}" maxlength="12" aria-label="값 이름"><button type="button" class="btn sm" id="rnX">삭제</button><button type="button" class="btn sm primary" id="rnO">적용</button></div><div class="er" id="rnE" hidden></div>`,()=>{
  const ok=()=>{ const n=pq('#rnI').value.trim(); if(!n) return; if(o.vals.some((x,i)=>x===n&&i!==j)){ pq('#rnE').textContent='같은 값이 이미 있어요'; pq('#rnE').hidden=false; return; } renameVal(a,o,j,n); closePop(); optCh(); };
  pq('#rnI').focus(); pq('#rnI').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing) ok(); });
  pq('#rnO').addEventListener('click',ok);
  pq('#rnX').addEventListener('click',()=>{ o.vals.splice(j,1); closePop(); optCh(); });
 });
}
// EPC 상품 이미지(예시): 연결 기기 상품마다 컬러로 그린 SVG. kind = mobile(1:1) · desktop(16:9)
function epcImgSrc(hex,kind){
 const [w,h]=kind==='desktop'?[480,270]:[200,200], dw=kind==='mobile'?76:w*.18, dh=kind==='mobile'?160:h*.76, x=kind==='mobile'?62:w*.62, y=kind==='mobile'?20:h*.12;
 return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect width='${w}' height='${h}' fill='#EEF0F5'/><rect x='${x}' y='${y}' width='${dw}' height='${dh}' rx='16' fill='${hex}' stroke='rgba(0,0,0,.2)' stroke-width='2'/>${kind==='mobile'?'':`<rect x='${w*.08}' y='${h*.38}' width='${w*.4}' height='${h*.08}' rx='4' fill='rgba(0,0,0,.18)'/><rect x='${w*.08}' y='${h*.52}' width='${w*.28}' height='${h*.06}' rx='4' fill='rgba(0,0,0,.1)'/>`}</svg>`); }
const hexInName=n=>{ const c=COLORS().find(([x])=>n.split(/\s+/).includes(x)); return c?c[1]:'#9AA3B5'; };
function epcImages(kind){ const seen=new Set(); return connPOs(E).filter(p=>p.type==='기기서비스'&&!seen.has(p.name)&&seen.add(p.name)).map(p=>({src:epcImgSrc(hexInName(p.name),kind),name:p.name})); }
// 이미지 등록 대화상자 (옵션 이미지 · 기본 정보 이미지 공통): 파일 올리기(끌어 놓기) · EPC 상품 이미지 · 최근 등록 중에서 고른다
// uploadOnly: 파일 올리기만(EPC 상품 이미지 · 최근 등록 없이). 옵션 이미지 값에 쓴다
function openImgDlg({title,hint,kind='mobile',name='',needName=false,init=null,uploadOnly=false,onDone}){
 let pick=init?{src:init}:null, nm=name;
 const draw=()=>{
  const L=uploadOnly?[]:epcImages(kind);
  $('#mBody').innerHTML=`<label class="drop ${pick?'has':''}" id="dz">${pick?`<img src="${pick.src}" alt="선택한 이미지">`:''}<span><b>${pick?'다른 이미지로 바꾸기':'이미지를 끌어다 놓거나 클릭해서 선택'}</b><small>JPG · JPEG · PNG · GIF · BMP${hint?' · '+esc(hint):''}</small></span><input type="file" id="dzF" accept=".jpg,.jpeg,.png,.gif,.bmp,image/jpeg,image/png,image/gif,image/bmp" hidden></label>
  ${L.length?`<div class="pt2">EPC 상품 이미지에서 선택</div><div class="igrid">${L.map((x,i)=>`<button type="button" data-ei="${i}" class="${pick&&pick.src===x.src?'on':''}" title="${esc(x.name)}"><img src="${x.src}" alt="${esc(x.name)}"><span>${esc(x.name)}</span></button>`).join('')}</div>`:''}
  ${!uploadOnly&&RECENT.imgs.length?`<div class="pt2">최근 등록</div><div class="igrid">${RECENT.imgs.map((x,i)=>`<button type="button" data-ri="${i}" class="${pick&&pick.src===x?'on':''}"><img src="${x}" alt="최근 등록 이미지 ${i+1}"></button>`).join('')}</div>`:''}
  ${needName?`${uploadOnly?'':'<div class="pt2">이름 <span class="rq">*</span></div>'}<input type="text" id="dzN" maxlength="12" value="${esc(nm)}" placeholder="고객에게 보이는 이름 (예: 블루)" aria-label="이름" style="width:100%;${uploadOnly?'margin-top:12px':''}">`:''}`;
  $('#mFoot').innerHTML=`${uploadOnly?'':'<button type="button" class="btn" id="mc">취소</button>'}<button type="button" class="btn primary" id="mo" ${pick?'':'disabled'}>등록</button>`;
  const take=f=>{ if(!f) return; if(!/\.(jpe?g|png|gif|bmp)$/i.test(f.name)&&!/^image\/(jpeg|png|gif|bmp|x-ms-bmp)$/.test(f.type)){ toast('JPG · JPEG · PNG · GIF · BMP만 올릴 수 있어요'); return; } if(f.size>5*1024*1024){ toast('5MB 이하 이미지만 올릴 수 있어요'); return; } const r=new FileReader(); r.onload=()=>{ pick={src:r.result,up:true,n:f.name}; draw(); }; r.readAsDataURL(f); };
  $('#dzF').addEventListener('change',e=>take(e.target.files[0]));
  const dz=$('#dz'); dz.addEventListener('dragover',e=>{ e.preventDefault(); dz.classList.add('over'); }); dz.addEventListener('dragleave',()=>dz.classList.remove('over')); dz.addEventListener('drop',e=>{ e.preventDefault(); dz.classList.remove('over'); take(e.dataTransfer.files[0]); });
  $$('#mBody [data-ei]').forEach(b=>b.addEventListener('click',()=>{ const x=L[+b.dataset.ei]; pick={src:x.src,n:x.name}; if(needName&&!nm) nm=(COLORS().find(([c])=>x.name.split(/\s+/).includes(c))||[''])[0]; draw(); }));
  $$('#mBody [data-ri]').forEach(b=>b.addEventListener('click',()=>{ pick={src:RECENT.imgs[+b.dataset.ri]}; draw(); }));
  const dn=$('#dzN'); if(dn) dn.addEventListener('input',e=>{ nm=e.target.value; });
  const mc=$('#mc'); if(mc) mc.addEventListener('click',closeModal);
  $('#mo').addEventListener('click',()=>{ if(needName&&!nm.trim()){ $('#dzN').focus(); toast('이름을 입력하세요'); return; } if(pick.up) RECENT.imgs=[pick.src,...RECENT.imgs.filter(x=>x!==pick.src)].slice(0,6); closeModal(); onDone({n:pick.n||nm.trim()||'이미지',u:pick.src},nm.trim()); });
 };
 closePop(); modal(title||'','',560); draw();
}
function addVal(a,k,btn){ const o=a.opts[k];
 if(o.disp==='chip') return colorPop(a,k,btn);
 if(o.disp==='cap') return capPop(a,k,btn);
 if(o.disp==='text') return textPop(a,k,btn);
 openImgDlg({title:`${o.name.trim()||'옵션'} 이미지 등록`,hint:'200×200px 이상',needName:true,uploadOnly:true,onDone:(m,n)=>{ if(!o.vals.includes(n)) o.vals.push(n); o.img=o.img||{}; o.img[n]=m; optCh(); toast(`${n} 이미지를 등록했어요`); }});
}
function editVal(a,k,j,btn){ const o=a.opts[k], v=o.vals[j];
 if(o.disp==='chip') return colorPop(a,k,btn,j);
 if(o.disp==='cap') return capPop(a,k,btn);
 if(o.disp==='text') return renamePop(a,k,j,btn);
 const m=oImg(o,v);
 openImgDlg({title:`${v} 이미지 등록`,hint:'200×200px 이상',needName:true,uploadOnly:true,name:v,init:m&&m.u,onDone:(img,n)=>{ if(n&&n!==v){ if(o.vals.some((x,i)=>x===n&&i!==j)){ toast('같은 값이 이미 있어요'); return; } renameVal(a,o,j,n); } o.img=o.img||{}; o.img[o.vals[j]]=img; optCh(); }});
}

// ---------- 4. 기본 정보 ----------
const bstyle=b=>b.s==='f'?`background:${b.c};color:#fff;border-color:${b.c}`:`background:transparent;color:${b.c};border-color:${b.c}`;
const SUB_MAX=4;
// 이미지 아래 공통 구성: 대체 텍스트 입력 + 등록 안내
// id가 없으면 대체 텍스트 칸 없이 안내 목록만 그린다
// v0.3.1(11-25 시안 2): 대체 텍스트는 글자 수 표시 없이 최대 20자, 안내는 '권장 규격 · 권장 형식'
const imgMeta=(id,val,first,label,size='1440 * 2560',fmt='JPG, PNG')=>`${id?`<div class="alt-row"><input type="text" id="${id}" value="${esc(val)}" maxlength="20" placeholder="웹접근성 대체 Text 작성 (최대 20자 이내)" aria-label="${label} 대체 텍스트"></div>`:''}
  <ul class="img-guide">${first?`<li>${first}</li>`:''}<li>권장 규격 : ${size}</li><li>권장 형식 : ${fmt}</li></ul>`;
// ---------- 4-0. 전시 정보: 기본 정보 · 상세 설명 ----------
// 할부 설정과 같은 탭 구성. 탭을 고르면 아래에 그 항목 입력이 나온다(탭 옆은 작성 상태). 처음에는 기본 정보
// v0.2.4: 추가 설정 영역을 없애고 검색 노출 설정 · 오퍼링 문구를 상세 설명 탭 옆으로 옮겼다
// v0.3.1(11-25 시안 2): 탭 이름 · 알약형 탭. [EPC 상품 정보 가져오기]는 탭 줄에서 섹션 오른쪽 아래(#infoFoot)로 옮겼다
const INFO=[['basic','기본 설정'],['desc','상세 설정'],['search','메타 태그 정보 (SEO/GEO)'],['cvm','오퍼링 문구(CVM)']];
let curI='basic';
// 탭 옆 작성 상태: 미작성은 표시하지 않는다
function infoChips(){ const S=secState(E); INFO.forEach(([k])=>{ const ch=$('#ist-'+k); if(!ch) return; const [t,c]=STL[S[k].st]; ch.textContent=S[k].st==='todo'?'':t; ch.className=c; }); }
// MP 상품 전시: [EPC 정보 불러오기]는 연결한 MP의 이름 · 설명으로 전시명 · 설명을 채운다
const canEpcLoad=()=>E.kind==='mp'?!!mpDemo(E.mp):E.conn.length>0;
function mpEpcLoad(){ const m=mpDemo(E.mp); if(!m) return;
 if((E.name.trim()||E.brief.trim())&&!confirm('입력한 전시명 · 설명을 연결한 MP의 이름 · 설명으로 바꿀까요?')) return;
 E.name=m.name.slice(0,NAME_MAX); E.brief=m.desc.slice(0,BRIEF_MAX); curI='basic'; rInfo(); rBasic(); refresh(); toast('MP 이름 · 설명으로 전시명 · 설명을 채웠어요'); }
function rInfo(){
 $('#infoList').innerHTML=INFO.map(([k,l])=>`<button type="button" role="tab" data-ik="${k}" class="${k===curI?'on':''}" aria-selected="${k===curI}">${l}<small id="ist-${k}"></small></button>`).join('');
 // 섹션 오른쪽 아래: EPC 상품 정보 가져오기 (연결 상품이 있어야 쓸 수 있다)
 $('#infoFoot').innerHTML=`<button type="button" class="btn" id="epcLoad" ${canEpcLoad()?'':'disabled'}>EPC 상품 정보 가져오기</button>`;
 $('#epcLoad').addEventListener('click',()=>E.kind==='mp'?mpEpcLoad():openEpcLoad());
 INFO.forEach(([k])=>{ $('#sb-'+k).hidden=k!==curI; });
 infoChips();
 $$('#infoList [data-ik]').forEach(el=>el.addEventListener('click',()=>{ curI=el.dataset.ik; rInfo(); }));
}
// 순서: 전시명 → 설명 → 전시 상품 배지 → 대표이미지 → 추가이미지 → 전시 기간 → 전시 여부 (전시 채널은 전시 채널 섹션으로 이동)
function rBasic(){
 const box=$('#sb-basic');
 { const eb=$('#epcLoad'); if(eb) eb.disabled=!canEpcLoad(); }
 box.innerHTML=` <!-- v0.2.4: 기본 정보는 연관 및 유사 상품 문구와 같은 표(왼쪽 항목명 · 오른쪽 입력) -->
 <div class="ftbl binfo">
 ${seoRow('전시명',{id:'nameCnt',v:`${E.name.length}/${NAME_MAX}`},`<input type="text" id="fName" value="${esc(E.name)}" maxlength="${NAME_MAX}" placeholder="고객에게 보이는 이름" aria-label="전시명" style="width:100%">`)}
 ${seoRow('설명',{id:'briefCnt',v:`${E.brief.length}/${BRIEF_MAX}`},`<input type="text" id="fBrief" value="${esc(E.brief)}" maxlength="${BRIEF_MAX}" placeholder="고객에게 보이는 추가설명 작성" aria-label="설명" style="width:100%">`)}
 ${seoRow('전시 상품 배지',{id:'bCnt',v:`${E.badges.length}/${BADGE_MAX}`},`<div class="row" style="gap:8px;margin:0"><button type="button" class="bd-add" id="bAdd" aria-label="전시 상품 배지 추가" ${E.badges.length<BADGE_MAX?'':'disabled'}>+</button>${autoBadges(E).map(b=>`<span class="bd auto" style="${bstyle(b)}" title="${b.from} 섹션 설정으로 자동 표시">${esc(b.t)}<small>자동</small></span>`).join('')}${E.badges.map((b,i)=>`<span class="bd" style="${bstyle(b)};cursor:default">${esc(b.t)}<button type="button" class="x" data-bx="${i}" aria-label="${esc(b.t)} 삭제">×</button></span>`).join('')}${E.badges.length<BADGE_MAX?'<span class="bin-w"><input type="text" id="bIn" maxlength="10" placeholder="입력" aria-label="전시 상품 배지 추가 (최대 10자, Enter로 추가)" size="4"><button type="button" class="x" id="bInClr" aria-label="입력 지우기">×</button></span>':''}</div><div class="er" id="berr"></div>`)}
 ${E.kind==='mp'?seoRow('대표 이미지',null,ntc('info',MP_NOIMG))+seoRow('추가 이미지',null,ntc('info',MP_NOIMG)):noImg(E)?seoRow('이미지',null,ntc('info',NOIMG_MSG)):seoRow('대표 이미지',{id:'mainCnt',v:`${E.main?1:0}/1`},mainImgHtml())+seoRow('추가 이미지',{id:'subCnt',v:`${E.subs.length}/${SUB_MAX}`},subImgHtml())}
 ${seoRow('전시 기간',null,`<div class="row dtr" style="margin:0"><input type="datetime-local" id="fFrom" value="${E.from?`${E.from}T${E.fromTime||'00:00'}`:''}" aria-label="전시 시작 일시"><span class="dt-sep">-</span><input type="datetime-local" id="fTo" value="${!E.noEnd&&E.to?`${E.to}T${E.toTime||'23:59'}`:''}" aria-label="전시 종료 일시" ${E.noEnd?'disabled':''}><label class="chkl"><input type="checkbox" id="noEnd" ${E.noEnd?'checked':''}>종료일 없음</label></div>`)}
 ${seoRow('전시 여부',null,yn('dShow','전시 여부',E.show))}
 ${E.kind==='po'?seoRow('구매 후기',null,yn('rvUse','구매 후기 사용 여부',E.review))+seoRow('전문가 리뷰',null,yn('exUse','전문가 리뷰 사용 여부',E.expert)):''}
 </div>`;
 $('#fName').addEventListener('input',e=>{ E.name=e.target.value; $('#nameCnt').textContent=`(${E.name.length}/${NAME_MAX}`+')'; refresh(); });
 $('#fBrief').addEventListener('input',e=>{ E.brief=e.target.value; $('#briefCnt').textContent=`(${E.brief.length}/${BRIEF_MAX})`; refresh(); });
 // 전시 기간: 일시 한 칸(YYYY.MM.DD HH:MM). 저장값은 날짜(from · to)와 시간(fromTime · toTime)으로 나눠 둔다
 $('#fFrom').addEventListener('change',e=>{ const [d,t]=e.target.value.split('T'); E.from=d||''; E.fromTime=t||'00:00'; refresh(); });
 $('#fTo').addEventListener('change',e=>{ const [d,t]=e.target.value.split('T'); E.to=d||''; E.toTime=t||'23:59'; refresh(); });
 $('#noEnd').addEventListener('change',e=>{ E.noEnd=e.target.checked; if(E.noEnd) E.to=''; rBasic(); refresh(); if(!E.noEnd) $('#fTo').focus(); });
 $$('#sb-basic input[name=dShow]').forEach(r=>r.addEventListener('change',()=>{ E.show=r.value==='Y'; refresh(); }));
 // v0.3.1(11-25 시안 2): 구매 후기 · 전문가 리뷰는 별도 섹션 대신 기본 설정 표의 Y/N 행(PO 상품 전시만)
 $$('#sb-basic input[name=rvUse]').forEach(x=>x.addEventListener('change',()=>{ E.review=x.value==='Y'; if(!E.review&&PVTAB==='review') PVTAB='order'; refresh(); toast(E.review?'구매후기를 노출해요':'구매후기를 숨겼어요'); }));
 $$('#sb-basic input[name=exUse]').forEach(x=>x.addEventListener('change',()=>{ E.expert=x.value==='Y'; if(!E.expert&&PVTAB==='expert') PVTAB='order'; refresh(); toast(E.expert?'전문가 리뷰를 노출해요':'전문가 리뷰를 숨겼어요'); }));
 bindImgs();
 // 전시 상품 배지: 한 줄 입력. 문구를 넣고 Enter로 추가, 칩의 ×로 삭제. 색상은 순서대로 돌아가는 기본색(채움)
 $$('#sb-basic [data-bx]').forEach(b=>b.addEventListener('click',()=>{ E.badges.splice(+b.dataset.bx,1); rBasic(); refresh(); }));
 // v0.3.1(11-25 시안 2): [+]는 입력 칩에 커서를 두거나, 입력한 문구가 있으면 추가한다. 입력 칩의 ×는 입력을 지운다
 const bi=$('#bIn'); if(bi){ const fit=()=>{ bi.size=Math.max(4,bi.value.length+1); }; bi.addEventListener('input',()=>{ fit(); $('#berr').textContent=''; });
  $('#bInClr').addEventListener('click',()=>{ bi.value=''; fit(); bi.focus(); });
  $('#bAdd').addEventListener('click',()=>{ if(bi.value.trim()) bi.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'})); else bi.focus(); });
  bi.addEventListener('keydown',e=>{ if(e.key!=='Enter'||e.isComposing) return; e.preventDefault(); const t=bi.value.trim(); if(!t) return;
   if(E.badges.some(b=>b.t===t)){ $('#berr').textContent='같은 문구의 배지가 이미 있어요'; return; }
   E.badges.push({t,c:BCOL[E.badges.length%BCOL.length][1],s:'f'}); rBasic(); refresh(); const n=$('#bIn'); if(n) n.focus(); }); }
}
const readImgs=files=>Promise.all(files.map(f=>new Promise(r=>{ const rd=new FileReader(); rd.onload=()=>r({n:f.name,u:rd.result}); rd.readAsDataURL(f); })));
// 전시 상품 배지 최대 개수 · 전시명 · 설명 최대 글자 수
const BADGE_MAX=5, NAME_MAX=20, BRIEF_MAX=20;
const NOIMG_MSG='이동전화 요금제형은 대표 이미지를 쓰지 않아요';
// MP 상품 전시는 대표 · 추가 이미지를 쓰지 않는다(입력 칸 대신 안내만 보여 준다)
const MP_NOIMG='대표 이미지를 사용하지 않습니다.';
// ---------- 4-1. 이미지 (v0.3.2: v0.2.0처럼 대표이미지 1장 · 추가이미지 최대 4장. 기기 구분 없음) ----------
// 공용 검사 규칙(display-rules)은 E.imgs.mobile이 비었는지로 필수를 보므로, 대표이미지가 있을 때만 대표 + 추가를 넣는다(추가이미지만 있으면 미등록)
const syncImgs=()=>{ E.imgs={mobile:E.main?[E.main,...E.subs]:[],desktop:[]}; };
const IMG_SIZE='1000×1000px';
const thumb=(m,key)=>`<div class="img-thumb">${m.u?`<img src="${m.u}" alt="${esc(m.n)}">`:`<div class="img-ph">${svg(IC.image)}${esc(m.n)}</div>`}${key==='main'?'<span class="tag-main">대표</span>':''}<button type="button" class="x" data-imx="${key}" aria-label="${esc(m.n)} 삭제">×</button></div>`;
// v0.3.1(11-25 시안 2): 안내 문구만 바꿨다. 이미지 등록 대화상자(openImgDlg)의 허용 형식은 옵션 이미지와 같이 쓰므로 그대로 둔다
const IMG_FMT='JPG, PNG, WEBP · 5MB 이하';
const mainImgHtml=()=>`<div class="img-list">${E.main?thumb(E.main,'main'):'<button type="button" class="img-add big" id="mainAdd" aria-label="대표 이미지 등록"><b>+</b></button>'}</div>${imgMeta('mainAlt',E.mainAlt,'','대표이미지',IMG_SIZE,IMG_FMT)}`;
const subImgHtml=()=>`<div class="img-list">${E.subs.map((m,i)=>thumb(m,i)).join('')}${E.subs.length<SUB_MAX?'<button type="button" class="img-add big" id="subAdd" aria-label="추가 이미지 등록"><b>+</b></button>':''}</div>${imgMeta('subAlt',E.subAlt,'','추가이미지',IMG_SIZE,IMG_FMT)}`;
function bindImgs(){
 const re=()=>{ syncImgs(); rBasic(); refresh(); };
 $$('#sb-basic [data-imx]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.imx; if(k==='main') E.main=null; else E.subs.splice(+k,1); re(); }));
 const ma=$('#mainAdd'); if(ma) ma.addEventListener('click',()=>openImgDlg({title:'대표이미지 등록',hint:IMG_SIZE,onDone:m=>{ E.main=m; re(); toast('대표이미지를 등록했어요'); }}));
 const sa=$('#subAdd'); if(sa) sa.addEventListener('click',()=>openImgDlg({title:'추가이미지 등록',hint:IMG_SIZE,onDone:m=>{ if(E.subs.length>=SUB_MAX) return; E.subs.push(m); re(); toast(`추가이미지를 등록했어요 (${E.subs.length}/${SUB_MAX})`); }}));
 [['mainAlt','mainAlt'],['subAlt','subAlt']].forEach(([id,k])=>{ const el=$('#'+id); if(el) el.addEventListener('input',e=>{ E[k]=e.target.value; refresh(); }); });
}

// ---------- 5. 상세 설명 ----------
// 작성방식: 이미지 업로드 / HTML 수정(간단한 편집기 + HTML 코드 보기) / AI 추천 적용하기(TBD).
// 방식을 바꿔도 각 방식의 내용은 남고, 고객 화면에는 선택한 방식의 내용만 나간다.
const DESC_MAX=20;
const DESC_MODES=[['image','이미지 업로드'],['html','HTML 수정'],['ai','AI 추천 적용하기 (TBD)']];
// 붙여 넣거나 코드로 넣은 HTML에서 스크립트·외부 프레임·이벤트 속성을 걷어낸다
function sanitize(html){
 const doc=new DOMParser().parseFromString(`<body>${html}</body>`,'text/html');
 doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form,base').forEach(n=>n.remove());
 doc.body.querySelectorAll('*').forEach(n=>[...n.attributes].forEach(a=>{ if(/^on/i.test(a.name)||/^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name); }));
 return doc.body.innerHTML;
}
// 편집기 도구: [명령, 표시, 이름]. '|'는 구분선
const RT_IC={
 ul:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
 ol:'<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 4.5h1.5V9M4 9h3M4 14h3l-3 4h3"/>',
 left:'<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', center:'<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', right:'<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 clear:'<path d="M6 5h12M12 5l-3 14M5 19l14-14"/>', undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', redo:'<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
};
const RT=[['bold','<b>B</b>','굵게'],['italic','<i>I</i>','기울임'],['underline','<u>U</u>','밑줄'],['strikeThrough','<s>S</s>','취소선'],'|',
 ['formatBlock:h2','H2','제목'],['formatBlock:h3','H3','소제목'],['formatBlock:p','P','본문'],'|',
 ['insertUnorderedList',svg(RT_IC.ul),'글머리 목록'],['insertOrderedList',svg(RT_IC.ol),'번호 목록'],'|',
 ['justifyLeft',svg(RT_IC.left),'왼쪽 정렬'],['justifyCenter',svg(RT_IC.center),'가운데 정렬'],['justifyRight',svg(RT_IC.right),'오른쪽 정렬'],'|',
 ['createLink',svg(RT_IC.link),'링크'],['removeFormat',svg(RT_IC.clear),'서식 지우기'],'|',['undo',svg(RT_IC.undo),'실행 취소'],['redo',svg(RT_IC.redo),'다시 실행']];
// HTML 편집기(도구 막대 + 편집 영역 + HTML 코드 보기). 상세 설명 본문(desc)과 공통 안내 문구(note) 두 곳에서 쓴다
const RTE_SRC={desc:false,note:false,xtx:false}; // 편집기별 HTML 코드 보기 여부
const rteMarkup=(k,html,label,ph)=>`<div class="rte" data-rte="${k}"><div class="rte-bar" role="toolbar" aria-label="${label} 서식">${RT.map(t=>t==='|'?'<i aria-hidden="true"></i>':`<button type="button" data-rt="${t[0]}" title="${t[2]}" aria-label="${t[2]}" ${RTE_SRC[k]?'disabled':''}>${t[1]}</button>`).join('')}<button type="button" class="rte-code-btn ${RTE_SRC[k]?'on':''}" data-src aria-pressed="${RTE_SRC[k]}" title="HTML 코드 보기">&lt;/&gt; HTML</button></div>
  ${RTE_SRC[k]?`<textarea class="rte-code" spellcheck="false" aria-label="${label} HTML">${esc(html)}</textarea>`:`<div class="rte-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${label}" data-ph="${ph}"></div>`}</div>`;
// v0.3: 콘텐츠 정보 직접 입력(xtx)에서도 쓴다. scope = 편집기를 찾을 영역, re = HTML 코드 보기 전환 후 다시 그릴 함수
function bindRte(k,get,set,scope='#sb-desc',re=()=>rDesc()){
 const root=$(`${scope} [data-rte="${k}"]`); if(!root) return;
 root.querySelector('[data-src]').addEventListener('click',()=>{ if(RTE_SRC[k]) set(sanitize(root.querySelector('.rte-code').value)); RTE_SRC[k]=!RTE_SRC[k]; re(); refresh(); });
 if(RTE_SRC[k]){ root.querySelector('.rte-code').addEventListener('input',e=>{ set(sanitize(e.target.value)); refresh(); }); return; }
 const ed=root.querySelector('.rte-ed'); ed.innerHTML=sanitize(get());
 const empty=()=>ed.classList.toggle('is-empty',!ed.textContent.trim()&&!ed.querySelector('img'));
 const sync=()=>{ empty(); set(sanitize(ed.innerHTML)); refresh(); };
 // 굵게·목록 등 지금 커서 위치의 서식을 도구 버튼에 표시한다
 const marks=()=>root.querySelectorAll('[data-rt]').forEach(b=>{ const c=b.dataset.rt; let on=false; try{ on=c.startsWith('formatBlock:')?document.queryCommandValue('formatBlock').toLowerCase()===c.slice(12):/^(bold|italic|underline|strikeThrough|insert\w+List|justify\w+)$/.test(c)&&document.queryCommandState(c); }catch{} b.classList.toggle('on',!!on); });
 empty();
 ed.addEventListener('input',sync);
 ed.addEventListener('keyup',marks); ed.addEventListener('mouseup',marks);
 ed.addEventListener('paste',e=>{ const h=e.clipboardData&&e.clipboardData.getData('text/html'); if(!h) return; e.preventDefault(); document.execCommand('insertHTML',false,sanitize(h)); });
 root.querySelectorAll('[data-rt]').forEach(b=>{
  b.addEventListener('mousedown',e=>e.preventDefault()); // 누를 때 편집 영역의 선택을 잃지 않게
  b.addEventListener('click',()=>{ const [cmd,arg]=b.dataset.rt.split(':'); ed.focus(); document.execCommand('defaultParagraphSeparator',false,'p');
   if(cmd==='createLink'){ const u=prompt('링크 주소를 입력하세요 (https://…)','https://'); if(!u||!/^https?:\/\//i.test(u.trim())) return; document.execCommand('createLink',false,u.trim()); }
   else document.execCommand(cmd,false,arg?`<${arg}>`:null);
   sync(); marks(); });
 });
}
function rDesc(){
 const m=E.descMode, box=$('#sb-desc');
 const body=m==='image'?`<div class="desc-imgs">${E.descImgs.map((x,i)=>`<div class="img-thumb">${x.u?`<img src="${x.u}" alt="${esc(x.n)}">`:`<div class="img-ph">${svg(IC.image)}${esc(x.n)}</div>`}<button type="button" class="x" data-dx="${i}" aria-label="${esc(x.n)} 삭제">×</button></div>`).join('')}${E.descImgs.length<DESC_MAX?`<button type="button" class="img-add${E.descImgs.length?'':' full'}" id="descAdd"><b>+</b>상세 이미지 추가</button>`:''}</div>`
  :rteMarkup('desc',E.descHtml,'상세 설명','고객에게 보여줄 상세 설명을 입력하세요');
 // v0.2.4: 기본 정보와 같은 표(왼쪽 항목명 · 오른쪽 입력)
 box.innerHTML=`<div class="ftbl binfo">
 ${seoRow('작성방식',null,`<div class="row" style="margin:0"><span class="srch-radio" role="radiogroup" aria-label="작성방식">${DESC_MODES.map(([k,l])=>`<label><input type="radio" name="dMode" value="${k}" ${m===k?'checked':''}>${l}</label>`).join('')}</span>${m==='html'?`<button type="button" class="btn sm" id="dEpc" style="margin-left:auto" ${E.conn.length?'':'disabled'}>EPC 상품 소개 가져오기</button>`:''}</div>`)}
 ${seoRow('본문',null,body)}
 ${seoRow('공통 안내 문구',null,rteMarkup('note',E.descNote,'공통 안내 문구',''))}
 </div>`;
 $$('#sb-desc input[name=dMode]').forEach(r=>r.addEventListener('change',()=>{ if(r.value==='ai'){ alert('AI 추천 적용하기 TBD'); rDesc(); return; } E.descMode=r.value; rDesc(); refresh(); }));
 const ep=$('#dEpc'); if(ep) ep.addEventListener('click',()=>{ const p=connPOs(E)[0]; E.descHtml+=`<p>${esc(p.desc)}</p>`; rDesc(); refresh(); toast(`${p.name}의 EPC 소개를 붙였어요. 이어서 고칠 수 있어요`); });
 if(m==='image'){
  const da=$('#descAdd'); if(da) da.addEventListener('click',()=>$('#descFile').click());
  $$('#sb-desc [data-dx]').forEach(b=>b.addEventListener('click',()=>{ E.descImgs.splice(+b.dataset.dx,1); rDesc(); refresh(); }));
 } else bindRte('desc',()=>E.descHtml,v=>E.descHtml=v);
 bindRte('note',()=>E.descNote,v=>E.descNote=v);
}
$('#descFile').addEventListener('change',e=>{ const fs=[...e.target.files]; e.target.value=''; const room=DESC_MAX-E.descImgs.length; readImgs(fs.slice(0,room)).then(l=>{ if(!l.length) return; E.descImgs.push(...l); rDesc(); refresh(); toast(fs.length>room?`상세 이미지는 최대 ${DESC_MAX}장이라 ${l.length}장만 추가했어요`:`상세 이미지 ${l.length}장을 추가했어요`); }); });

// ---------- 6. 콘텐츠 정보 ----------
function xBadge(x){ if(x.mpDef) return '<span class="src s-link">템플릿 연결</span>'; if(x.mode==='link') return `<span class="src s-link">${x.auto?'상품 템플릿':'템플릿 연결'}</span>`; if(x.mode==='copy') return '<span class="src s-copy">템플릿 복사</span>'; return x.txt.trim()?'<span class="src s-copy">직접 입력</span>':'<span class="src s-none">미입력</span>'; }
const sw=(attr,id,on,label)=>`<label class="switch" title="노출"><input type="checkbox" ${attr}="${id}" ${on?'checked':''} aria-label="${label} 노출"><span aria-hidden="true"></span></label>`;
// v0.3: 직접 입력은 삭제 버튼 대신 저장 · 취소. 제목 · 본문(HTML 편집기)은 임시값(XD)에 고치고 저장해야 반영된다
//  - 취소: 저장한 값으로 되돌린다. 한 번도 저장하지 않은 새 콘텐츠는 목록에서 뺀다
let XD=null;
const xdOf=x=>{ if(!XD||XD.id!==x.id) XD={id:x.id,t:x.t,txt:x.txt}; return XD; };
const xdDirty=x=>XD&&XD.id===x.id&&(XD.t!==x.t||XD.txt!==x.txt);
// 저장하지 않은 새 직접 입력은 다른 콘텐츠로 옮기면 뺀다
function dropFresh(){ const x=E.extras.find(y=>y.id===curX); if(x&&x.fresh){ E.extras=E.extras.filter(y=>y!==x); XD=null; refresh(); } }
function rExtraDirect(x){
 const d=xdOf(x);
 $('#xd').innerHTML=`<div class="row"><input type="text" id="xt" value="${esc(d.t)}" placeholder="콘텐츠 제목" style="flex:1;font-weight:600" aria-label="콘텐츠 제목"></div>
 <div id="xEd">${rteMarkup('xtx',d.txt,'콘텐츠 본문','고객에게 보여줄 내용을 입력하세요')}</div>
 ${!x.fresh&&!x.txt.trim()?'<div class="er">내용이 비어 있으면 노출을 켜도 고객 화면에 나오지 않아요</div>':''}
 <div class="row x-acts"><button type="button" class="btn sm" id="xCancel">취소</button><button type="button" class="btn sm primary" id="xSave">저장</button></div>`;
 const st=()=>{ $('#xSave').disabled=!x.fresh&&!xdDirty(x); };
 $('#xt').addEventListener('input',e=>{ d.t=e.target.value; st(); });
 bindRte('xtx',()=>d.txt,v=>{ d.txt=htmlText(v)||/<img/i.test(v)?v:''; st(); },'#xEd',()=>rExtra());
 $('#xSave').addEventListener('click',()=>{
  if(!d.t.trim()){ toast('콘텐츠 제목을 입력하세요'); $('#xt').focus(); return; }
  x.t=d.t.trim(); x.txt=d.txt; delete x.fresh; XD=null; rExtra(); refresh(); toast('콘텐츠를 저장했어요'); });
 $('#xCancel').addEventListener('click',()=>{
  if(x.fresh){ E.extras=E.extras.filter(y=>y!==x); XD=null; rExtra(); refresh(); toast('새 콘텐츠 입력을 취소했어요'); return; }
  XD=null; RTE_SRC.xtx=false; rExtra(); toast('저장한 내용으로 되돌렸어요'); });
 st();
}
// v0.3 상품유형별 콘텐츠: 휴대폰 + 이동전화 요금제처럼 연결 상품의 상품유형(LV3)이 여러 개면 콘텐츠마다 어느 유형에서 왔는지 보여 준다
//  기준은 상품 콘텐츠 관리 v0.2의 템플릿 '적용 상품유형'이다
//  - 공통(모든 상품유형)으로 정한 템플릿 → '공통'
//  - 상품유형을 고른 템플릿 → 연결 상품유형 중 맞는 게 1개면 그 유형, 2개 이상이면 '공통'(중복이라 한 번만 넣고 한 번만 노출)
//  - 맞는 유형이 없는 템플릿(불러오기로 직접 넣음) · 예전 직접 입력 → 전시 전체에 붙으므로 '공통'
const ctnTypes=()=>E.kind==='ps'?[]:[...new Set(connPoList().map(p=>epcOf(p).lv3))];
const xTypes=x=>{ const t=x.src&&tplBy(x.src), pt=tplPtype(t); return pt.scope==='type'?ctnTypes().filter(l=>pt.lv3.includes(l)):[]; };
const xScope=x=>{ const t=x.src&&tplBy(x.src), pt=tplPtype(t); return !t?'전시 전체(직접 입력)':pt.scope==='all'?'공통(모든 상품유형)':pt.scope==='type'?pt.lv3.join(' · '):'자동 적용 안 함(직접 불러옴)'; };
const xGroup=x=>{ const t=xTypes(x); return t.length===1?t[0]:'공통'; };
const tyShort=g=>g.replace(/형$/,'');
function xTypeChip(x){ if(ctnTypes().length<2) return ''; const g=xGroup(x), t=xTypes(x);
 return g==='공통'?`<span class="chip acc" title="${t.length>1?esc(t.join(' · '))+'에 같이 적용되는 콘텐츠예요. 한 번만 노출돼요':'적용 상품유형: '+esc(xScope(x))}">공통</span>`:`<span class="chip">${esc(tyShort(g))}</span>`; }
function xTypeSummary(){ const ts=ctnTypes(); if(ts.length<2||!E.extras.length) return '';
 const n=g=>E.extras.filter(x=>xGroup(x)===g).length, dup=E.extras.filter(x=>xTypes(x).length>1).length;
 return `<span class="pill">${['공통',...ts].map(g=>`${g==='공통'?'공통':esc(tyShort(g))} ${n(g)}`).join(' · ')}${dup?` · 중복 ${dup}개는 공통으로 한 번만 노출`:''}</span>`; }
function rExtra(){
 if(!E.extras.find(x=>x.id===curX)) curX=E.extras[0]&&E.extras[0].id;
 // v0.3.1(11-25 시안 2): [상품 템플릿 불러오기]는 오른쪽 아래, 비어 있으면 회색 상자 안내
 $('#sb-extra').innerHTML=`${xTypeSummary()?`<div class="sec-h">${xTypeSummary()}</div>`:''}
 ${E.extras.length?`<div class="ae"><div class="al">${E.extras.map((x,i)=>`<div class="ali ${x.id===curX?'on':''} ${x.show?'':'off'}" data-x="${x.id}" draggable="true">${gripBtn(i,esc(x.t)||'제목 없음')}<div class="nm"><b>${esc(x.t)||'제목 없음'}</b><div>${xBadge(x)}${xTypeChip(x)}</div></div>${sw('data-xs',x.id,x.show,esc(x.t))}</div>`).join('')}</div><div class="ad" id="xd"></div></div>`
 :'<div class="guide plain"><p>콘텐츠를 추가하세요</p></div>'}
 <div class="cn-foot"><button type="button" class="btn" id="xTpl">상품 템플릿 불러오기</button></div>`;
 $('#xTpl').addEventListener('click',openTplModal);
 // v0.3: 새 직접 입력은 만들 수 없다(템플릿 불러오기만). 예전에 저장한 직접 입력 콘텐츠는 그대로 보여 주고 고칠 수 있다
 $$('#sb-extra .ali[data-x]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.closest('.grip,.switch')) return; if(+el.dataset.x!==curX) dropFresh(); curX=+el.dataset.x; rExtra(); }));
 $$('#sb-extra [data-xs]').forEach(c=>c.addEventListener('change',()=>{ const x=E.extras.find(y=>y.id===+c.dataset.xs); x.show=c.checked; rExtra(); refresh(); }));
 dndList('#sb-extra','x',E.extras,()=>{ rExtra(); refresh(); });
 const x=E.extras.find(y=>y.id===curX); if(!x) return;
 if(x.mode==='direct'){ rExtraDirect(x); return; }
 // MP 기본 항목(EPC): 읽기 전용. 제목 · 본문을 보기만 하고 순서 · 노출은 목록에서 바꾼다
 if(x.mode==='epc'){ $('#xd').innerHTML=`<div class="row" style="margin-bottom:10px"><span class="src s-link">템플릿 연결</span><b>${esc(x.t)}</b><span class="pill">읽기 전용 · 순서 · 노출만 바꿀 수 있어요</span></div><div class="bx">${esc(x.txt)}</div>`; return; }
 const t=x.src&&tplBy(x.src);
 let body='';
 if(x.mode==='link') body=`<div class="row" style="margin-bottom:10px"><span class="src s-link">템플릿</span><b>${esc(t.n)}</b><span class="pill">${t.id} · ${t.v} · 완전 매핑 전시 ${tplUsers(t.id,'link').length}곳</span></div>${ctnTypes().length>1?`<p class="pill" style="margin:0 0 8px">적용 상품유형(콘텐츠 관리): ${esc(xScope(x))}${xGroup(x)==='공통'?' → 이 전시에서 공통으로 한 번만 노출':` → ${esc(tyShort(xGroup(x)))} 안내`}</p>`:''}<div class="bx">${esc(t.body)}</div>`;
 else body=`${x.mode==='copy'&&t?`<p class="pill" style="margin:0 0 6px">${esc(t.n)} ${t.v}에서 복사함 · 템플릿 변경은 반영되지 않아요</p>`:''}<textarea class="ta" id="xtx" rows="6" placeholder="고객에게 보여줄 내용을 입력하세요">${esc(x.txt)}</textarea>${!x.txt.trim()?'<div class="er">내용이 비어 있으면 노출을 켜도 고객 화면에 나오지 않아요</div>':''}`;
 $('#xd').innerHTML=`<div class="row"><input type="text" id="xt" value="${esc(x.t)}" placeholder="콘텐츠 제목" style="flex:1;font-weight:600"><button type="button" class="btn sm" id="xDel">삭제</button></div>${body}`;
 $('#xt').addEventListener('input',e=>{ x.t=e.target.value; refresh(); });
 $('#xt').addEventListener('change',()=>rExtra());
 // 자동으로 넣은 상품 템플릿을 지우면 다음에 상품을 연결해도 다시 넣지 않는다
 $('#xDel').addEventListener('click',()=>{ if(x.auto&&x.src) E.tplOff=[...new Set([...(E.tplOff||[]),x.src])]; E.extras=E.extras.filter(y=>y!==x); rExtra(); refresh(); });
 const tx=$('#xtx'); if(tx){ tx.addEventListener('input',e=>{ x.txt=e.target.value; refresh(); }); tx.addEventListener('change',()=>rExtra()); }
}

// ---------- 6-1. 구매후기 · 유사한 상품 구성하기 (v4-8) ----------
// 머리줄 스위치로 고객 화면 노출을 켜고 끈다. 구매후기 내용은 리뷰 시스템에서 자동으로 온다
// v0.3: 타이틀만 쓴다(소타이틀 없음), 최대 20자
const SIM_DEF={t:'이런 상품은 어떠세요?'}, SIM_LEN=20;
const simText=d=>d.sim.mode==='def'?SIM_DEF:{t:d.sim.t};
// v0.3: 머리줄 스위치 대신 연관 및 유사 상품과 같은 표 첫 줄 '사용 여부'(N/Y, 기본 N). N이면 아래 내용을 비활성화로 보여 준다
function rReview(){
 const on=E.review;
 $('#sb-review').innerHTML=`<div class="ftbl">
 ${seoRow('사용 여부',null,`<span class="srch-radio" role="radiogroup" aria-label="구매 후기 사용 여부"><label><input type="radio" name="rvUse" value="N" ${on?'':'checked'}>N</label><label><input type="radio" name="rvUse" value="Y" ${on?'checked':''}>Y</label></span>`)}
 </div>
 <div class="ntc rv-body ${on?'':'rl-off'}" style="margin:16px 0 0" ${on?'':'inert'}><span>TBD</span></div>`;
 $$('#sb-review input[name=rvUse]').forEach(x=>x.addEventListener('change',()=>{ E.review=x.value==='Y'; if(!E.review&&PVTAB==='review') PVTAB='order'; rReview(); refresh(); toast(E.review?'구매후기를 노출해요':'구매후기를 숨겼어요'); }));
}
// v0.3 전문가 리뷰: 구매 후기와 같은 구성(사용 여부 N/Y, 기본 N). 내용은 TBD
function rExpert(){
 const on=E.expert;
 $('#sb-expert').innerHTML=`<div class="ftbl">
 ${seoRow('사용 여부',null,`<span class="srch-radio" role="radiogroup" aria-label="전문가 리뷰 사용 여부"><label><input type="radio" name="exUse" value="N" ${on?'':'checked'}>N</label><label><input type="radio" name="exUse" value="Y" ${on?'checked':''}>Y</label></span>`)}
 </div>
 <div class="ntc rv-body ${on?'':'rl-off'}" style="margin:16px 0 0" ${on?'':'inert'}><span>TBD</span></div>`;
 $$('#sb-expert input[name=exUse]').forEach(x=>x.addEventListener('change',()=>{ E.expert=x.value==='Y'; if(!E.expert&&PVTAB==='expert') PVTAB='order'; rExpert(); refresh(); toast(E.expert?'전문가 리뷰를 노출해요':'전문가 리뷰를 숨겼어요'); }));
}
// 연관 상품: 머리줄 스위치로 고객 화면 노출을 켜고 끈다.
// v0.2.4: 고객 화면 문구(rSim) → 노출 방식 → 대상 목록 순서. 섹션 이름은 '연관 및 유사 상품'
//  - 자동 노출: 기본 선정 기준(동일 상품군 최신 등록순 · 4개, relDef)으로 고른다. 기준 · 개수를 고르는 칸은 화면에서 뺐다. 연결 상품이 바뀌면 다시 계산한다
//  - 직접 지정: 운영자가 상품을 골라 순서를 정한다(예전 T기프트 · 티다팩과 같은 목록 · 연결 팝업 · 끌어서 순서 변경)
// 후보는 EPC 상품(이 전시에 연결한 상품 제외). 목록 컬럼: 이미지 · 상품명 · 가격 · 옵션 사항(1줄). 값: E.rel={mode, rule, n, items:[PO id]}
const REL_RULES=[['lv3_new','동일 상품군 최신 등록순','연결 상품과 LV3가 같은 상품 중 최근 등록한 상품부터'],['lv3_price','동일 상품군 가격 근접순','연결 상품과 LV3가 같은 상품 중 대표 상품 가격과 가까운 순'],['lv2_new','동일 서비스 도메인 최신 등록순','연결 상품과 LV2가 같은 상품 중 최근 등록한 상품부터']];
const REL_MAX=10;
// cvm = [CVM 불러오기]로 받아 둔 상품(PO id), cvmAt = 불러온 시각
const relDef=()=>({mode:'auto',rule:'lv3_new',n:4,items:[],cvm:[],cvmAt:''});
// 상품 이미지(예시): 기기는 컬러로 그린 SVG, 그 밖의 상품은 구분 글자
const relImg=p=>p.type==='기기서비스'?`<img src="${epcImgSrc(hexInName(p.name),'mobile')}" alt="">`:`<i>${esc((epcOf(p).lv3||p.type).slice(0,2))}</i>`;
// 옵션 사항 1줄: 이름의 컬러 · 용량 · 사이즈 값, 없으면 Product Spec
const relOpt=p=>{ const T=p.name.split(/\s+/), keys=new Set([...COLORS().map(c=>c[0]),...CONTENT.cap.map(c=>c.n),...CONTENT.size.map(c=>c.n)]), v=T.filter(t=>keys.has(t)); return v.length?v.join(' · '):epcOf(p).spec; };
// 등록 순서: EPC 상품ID가 클수록 최근 등록으로 본다
const relPool=()=>PO.filter(p=>!E.conn.includes(p.id));
function relAuto(){
 const r=E.rel, P=connPOs(E); if(!P.length) return [];
 const lv3=new Set(P.map(p=>epcOf(p).lv3)), lv2=new Set(P.map(p=>epcOf(p).lv2)), base=P[0].base;
 let L=relPool().filter(p=>r.rule==='lv2_new'?lv2.has(epcOf(p).lv2):lv3.has(epcOf(p).lv3));
 L=r.rule==='lv3_price'?L.sort((x,y)=>Math.abs(x.base-base)-Math.abs(y.base-base)):L.sort((x,y)=>y.epc.localeCompare(x.epc));
 return L.slice(0,r.n).map(p=>p.id);
}
const relIds=()=>E.kind==='ps'?[]:(E.rel.mode==='auto'?E.rel.cvm:E.rel.items).filter(id=>poBy(id)&&!E.conn.includes(id));
const relRow=(p,i,manual)=>`<tr class="rl-r" data-rk="${p.id}">${manual?`<td class="c">${gripBtn(i,esc(p.name))}</td>`:`<td class="c"><span class="rl-no">${i+1}</span></td>`}<td><span class="rimg">${relImg(p)}</span></td><td><b>${esc(p.name)}</b><small class="rl-id">${p.epc} · ${epcOf(p).lv3}</small></td><td class="rl-pr">${priceTxt(p)}</td><td class="rl-op" title="${esc(relOpt(p))}">${esc(relOpt(p))}</td>${manual?`<td class="c"><button type="button" class="lnk" data-rx="${p.id}">연결 해제</button></td>`:''}</tr>`;
// v0.3: CVM 데이터 연동 결과(예시). [CVM 불러오기]를 누를 때 받아 온다. 연결 상품이 있어야 하고, 같은 상품군을 먼저, 모자라면 다른 상품으로 채운다
const CVM_N=6;
function relCvm(){
 if(!connPOs(E).length) return [];
 const first=relAuto(), rest=relPool().filter(p=>!first.includes(p.id)).sort((x,y)=>y.epc.localeCompare(x.epc)).map(p=>p.id);
 return [...first,...rest].slice(0,CVM_N);
}
const cvmScore=i=>Math.max(52,94-i*5);
const relRowCvm=(p,i)=>`<tr class="rl-r"><td class="c"><span class="rl-no">${i+1}</span></td><td><span class="rimg">${relImg(p)}</span></td><td><b>${esc(p.name)}</b><small class="rl-id">${p.epc} · ${epcOf(p).lv3}</small></td><td class="rl-pr">${priceTxt(p)}</td><td class="rl-op" title="${esc(relOpt(p))}">${esc(relOpt(p))}</td><td class="c"><span class="rl-sc"><i style="width:${cvmScore(i)}%"></i></span><small class="rl-id">${cvmScore(i)}%</small></td></tr>`;
function rRel(){
 const box=$('#relList'); if(!box) return;
 if(E.kind==='ps'){ box.innerHTML=''; return; }
 // v0.3.1(11-25 시안 2): 사용 여부 N이면 노출 결과는 숨긴다(수급 · 타이틀은 비활성화로 보인다)
 const r=E.rel, auto=r.mode==='auto', ids=relIds(), off=!E.related;
 box.classList.remove('rl-off'); box.removeAttribute('inert');
 if(off){ box.innerHTML=''; return; }
 // 11-25 시안 5: CVM 연동이면 목록을 두지 않는다(CVM이 고객별로 채운다)
 if(auto){ box.innerHTML=''; return; }
 const table=ids.length?`<div class="cl gtbl rl-tbl"><table><thead><tr><th class="c">순서</th><th>이미지</th><th>상품명</th><th>가격</th><th>옵션 사항</th><th class="c">연결 해제</th></tr></thead><tbody>${ids.map((id,i)=>relRow(poBy(id),i,true)).join('')}</tbody></table></div>`
  :'<div class="empty">상품 연결을 눌러 노출할 상품을 조회 · 추가하세요.</div>';
 box.innerHTML=`<div class="sec-h" style="margin:20px 0 10px"><b>노출 결과</b><span class="chip acc">${ids.length}건</span><button type="button" class="btn sm" id="rlLink" style="margin-left:auto" ${off?'disabled':''}>상품 연결</button></div>
 ${table}
 <p class="ft-hint" style="margin-top:8px">*모든 고객에게 같은 상품을 같은 순서로 보여줘요. 끌어서 순서를 바꿀 수 있어요</p>`;
 if(off) return;
 const after=()=>{ rRel(); refresh(); };
 $('#rlLink').addEventListener('click',openRelModal);
 $$('#relList [data-rx]').forEach(b=>b.addEventListener('click',()=>{ r.items=r.items.filter(x=>x!==b.dataset.rx); after(); toast(`${poBy(b.dataset.rx).name} 연결을 해제했어요`); }));
 r.items=ids; dndList('#relList','rk',r.items,after,null,'tr.rl-r',y=>y);
}
// 연관 상품 연결: 예전 사은품 · 티다팩 연결 팝업과 같은 구성(검색 + 표 체크). 이미 적용 중인 상품은 고를 수 없다
function openRelModal(){
 const r=E.rel; let q='', g='전체', pick=new Set();
 const groups=['전체',...new Set(relPool().map(p=>epcOf(p).lv3))];
 const draw=()=>{
  const L=relPool().filter(p=>(g==='전체'||epcOf(p).lv3===g)&&(!q||p.name.includes(q)||p.epc.includes(q)||p.id.toUpperCase().includes(q.toUpperCase()))).sort((x,y)=>y.epc.localeCompare(x.epc));
  $('#mBody').innerHTML=`<div class="row" style="margin:0 0 10px"><select id="rlG" aria-label="상품군">${groups.map(x=>`<option ${x===g?'selected':''}>${x}</option>`).join('')}</select><input type="text" class="mq" id="rq" value="${esc(q)}" placeholder="상품명 · EPC 상품ID 검색" aria-label="검색" style="flex:1"></div>
  <div class="cl gtbl rl-tbl" style="max-height:440px"><table><thead><tr><th class="c"></th><th>이미지</th><th>상품명</th><th>가격</th><th>옵션 사항</th></tr></thead><tbody>${L.map(p=>{ const has=r.items.includes(p.id);
   return `<tr><td class="c"><input type="checkbox" data-rp="${p.id}" ${has||pick.has(p.id)?'checked':''} ${has?'disabled':''} aria-label="${esc(p.name)}"></td><td><span class="rimg">${relImg(p)}</span></td><td><b>${esc(p.name)}</b><small class="rl-id">${p.epc} · ${epcOf(p).lv3}</small>${has?' <span class="chip">적용 중</span>':''}</td><td class="rl-pr">${priceTxt(p)}</td><td class="rl-op">${esc(relOpt(p))}</td></tr>`; }).join('')||'<tr class="empty-row"><td colspan="5">검색 결과가 없어요</td></tr>'}</tbody></table></div>`;
  $('#mFoot').innerHTML=`<button type="button" class="btn" id="mc">취소</button><button type="button" class="btn primary" id="mo" ${pick.size?'':'disabled'}>추가</button>`;
  keepQ('#rq',v=>q=v,draw);
  $('#rlG').addEventListener('change',e=>{ g=e.target.value; draw(); });
  $$('#mBody [data-rp]').forEach(c=>c.addEventListener('change',()=>{ c.checked?pick.add(c.dataset.rp):pick.delete(c.dataset.rp); draw(); }));
  // 행 아무 곳이나 눌러도 선택된다 (고를 수 없는 행은 제외)
  $$('#mBody [data-rp]:not(:disabled)').forEach(c=>{ const tr=c.closest('tr'); tr.style.cursor='pointer'; tr.addEventListener('click',e=>{ if(e.target===c) return; c.checked=!c.checked; c.dispatchEvent(new Event('change')); }); });
  $('#mc').addEventListener('click',closeModal);
  $('#mo').addEventListener('click',()=>{ r.items.push(...pick); closeModal(); rRel(); refresh(); toast(`연관 및 유사 상품 ${pick.size}개를 추가했어요`); });
 };
 modal('연관 상품 연결','',900); draw();
}
// v0.3: 사용 여부(N/Y) → 수급(CVM 데이터 연동 · 운영자 설정) → 타이틀 → 노출 결과(rRel)
const REL_SRC=[['auto','CVM 연동'],['manual','운영자 설정']];
function rSim(){
 const m=E.sim, on=E.related, cvm=E.rel.mode==='auto', t=simText(E);
 $('#sb-sim').innerHTML=`<div class="ftbl">
 ${seoRow('사용 여부',null,yn('rlUse','연관 및 유사 상품 사용 여부',on))}
 ${seoRow('수급',null,`<span class="srch-radio" role="radiogroup" aria-label="수급">${REL_SRC.map(([k,l])=>`<label><input type="radio" name="rlSrc" value="${k}" ${E.rel.mode===k?'checked':''} ${on?'':'disabled'}>${l}</label>`).join('')}</span>`)}
 ${seoRow('타이틀',{id:'smTC',v:`${t.t.length}/${SIM_LEN}`},`<input type="text" id="smT" value="${esc(t.t)}" maxlength="${SIM_LEN}" ${cvm||!on?'disabled':''} placeholder="${SIM_DEF.t}" aria-label="타이틀" style="width:100%">`)}
 </div>`;
 // 사용 여부 N: 수급 · 타이틀을 숨기지 않고 비활성화한다
 $$('#sb-sim .ft-row').forEach((row,i)=>row.classList.toggle('rl-dis',!on&&i>0));
 $$('#sb-sim input[name=rlUse]').forEach(x=>x.addEventListener('change',()=>{ E.related=E.sim.on=x.value==='Y'; rSim(); rRel(); refresh(); toast(E.related?'연관 및 유사 상품을 노출해요':'연관 및 유사 상품을 숨겼어요'); }));
 if(!on) return;
 $$('#sb-sim input[name=rlSrc]').forEach(x=>x.addEventListener('change',()=>{
  E.rel.mode=x.value; m.mode=x.value==='auto'?'def':'custom';
  if(m.mode==='custom'&&!m.t) m.t=SIM_DEF.t;
  rSim(); rRel(); refresh();
  if(m.mode==='custom') $('#smT').focus();
  toast(m.mode==='def'?'CVM 불러오기를 누르면 CVM 데이터로 연관 상품을 채워요':'운영자가 고른 상품만 보여줘요. 상품 연결로 추가하세요');
 }));
 if(cvm) return;
 const bind=(id,k,c)=>$(id).addEventListener('input',e=>{ m[k]=e.target.value; $(c).textContent=`(${m[k].length}/${SIM_LEN})`; refresh(); });
 bind('#smT','t','#smTC');
}
// ---------- 6-2. 검색 노출 설정 · 오퍼링 문구: 전시 정보 탭(rInfo)에서 고른다 ----------

// ---------- 6-9. T기프트 / 티다팩 (v0.3.2 재적용, v0.2.3 display-create-v24.ts 7-3 구성) ----------
// 단말기를 연결하면 T기프트, 요금제를 연결하면 티다팩. 목록은 EPC에서 조회한다(CVM 아님).
// 연결 상품 조건에 맞는 항목은 자동으로 올라오고(조건 매칭), [T기프트 조회] · [티다팩 조회]로 기획전 전용 항목을 붙인다. 여기서는 순서 · 연결 해제 · 자동 배지만 정한다
const dot=d=>d.replace(/-/g,'.');
function condText(g){ if(g.own) return '<span class="gtag own">전시 전용</span> 이 전시에만 적용'; const c=[]; if(g.cond.model) c.push(`${esc(g.cond.model)} 연결 시`); if(g.cond.pos) c.push(g.cond.pos.map(id=>esc((poBy(id)||{name:id}).name)).join(', ')); if(g.cond.join) c.push(g.cond.join.join('·')+' 가입'); return c.join('<br>'); }
function stTag(st,lim){ return st.k==='out'?`<span class="gtag end">${lim?'한도 소진':'소진'} · 자동 미노출</span>`:st.k==='end'?`<span class="gtag end">${lim?'제휴 종료':'기간 종료'} · 자동 미노출</span>`:st.k==='wait'?`<span class="gtag wait">${st.t}</span>`:st.warn?`<span class="gtag st">${lim?st.warn.replace('남은 수량','발급 한도'):st.warn}</span>`:''; }
function badgeRow(k,label,on){ return `<div class="row" style="margin:14px 0 0"><label class="fl">${label}</label><span class="srch-radio" role="radiogroup" aria-label="${label}"><label><input type="radio" name="${k}" value="1" ${on?'checked':''}>자동으로 붙이기</label><label><input type="radio" name="${k}" value="0" ${on?'':'checked'}>붙이지 않기</label></span></div>`; }
// 채널별 노출 제어에서 미리보기 채널의 T기프트 · 티다팩을 N으로 두면 미리보기에서 뺀다
function svcOff(k){ if(!needPP(E)) return false; const ch=ctlChs(E)[0]; if(!ch) return false; const c=chOf(E,ch); return !!(c.svc&&c.svc[k]==='N'); }
const epcNote=k=>`<p class="pill" style="margin:0 0 10px">${k==='gift'?'연결한 단말기의 T기프트를 EPC에서 조회해 자동으로 불러와요.':'연결한 요금제의 티다팩을 EPC에서 조회해 자동으로 불러와요.'} 채널별 노출 여부는 채널별 노출 제어에서 정해요</p>`;
const GIFT_SRC=[['epc','EPC 연동'],['manual','운영자 설정']];
function rGift(){
 const box=$('#sb-gift'); if(!box) return;
 if(!hasDev(E)){ box.innerHTML=''; return; }
 const gQty=g=>g.total==null?'제한 없음':`${g.left.toLocaleString()} / ${g.total.toLocaleString()}개`;
 const rows=E.gifts.map((x,i)=>{ const g=GM(x.id), st=benefitState(g), jw=joinWarn(E,g), t=stTag(st);
  return `<tr class="gf-r ${st.auto?'dim':''}" data-gk="${x.id}"><td><div class="gnm">${gripBtn(i,esc(g.n))}<span class="gic" aria-hidden="true">${g.ic}</span><div><b>${esc(g.n)}${x.src==='own'?'<span class="gtag own">전시 전용</span>':'<span class="gtag auto">조건 매칭</span>'}</b><small>${esc(g.mode)} · ${esc(g.ship)}</small>${t?`<div>${t}</div>`:''}${jw?`<div class="gwarn">${jw}</div>`:''}</div></div></td><td>${condText(g)}</td><td>${dot(g.from)} ~<br>${dot(g.to)}</td><td><span class="qty">${gQty(g)}</span></td><td class="c"><button type="button" class="lnk" data-gx="${x.id}">연결 해제</button></td></tr>`; }).join('');
 // 11-25 시안 5: 사용 여부(Y/N) · 수급(EPC 연동 / 운영자 설정) 표. EPC 연동이면 EPC 값을 그대로 써서 목록을 두지 않는다
 const on=E.giftOn!==false, src=E.giftSrc||'epc';
 const head=`<div class="ftbl">${seoRow('사용 여부',null,yn('gUse','T기프트 사용 여부',on))}
 ${seoRow('수급',null,`<span class="srch-radio" role="radiogroup" aria-label="T기프트 수급">${GIFT_SRC.map(([k,l])=>`<label><input type="radio" name="gSrc" value="${k}" ${src===k?'checked':''} ${on?'':'disabled'}>${l}</label>`).join('')}</span>`)}</div>`;
 const bindHead=()=>{ $$('#sb-gift .ft-row').forEach((row,i)=>row.classList.toggle('rl-dis',!on&&i>0));
  $$('#sb-gift input[name=gUse]').forEach(x=>x.addEventListener('change',()=>{ E.giftOn=x.value==='Y'; rGift(); rBasic(); refresh(); toast(E.giftOn?'T기프트를 노출해요':'T기프트를 숨겼어요'); }));
  $$('#sb-gift input[name=gSrc]').forEach(x=>x.addEventListener('change',()=>{ E.giftSrc=x.value; rGift(); refresh(); toast(x.value==='epc'?'EPC에 등록된 T기프트를 그대로 보여줘요':'운영자가 정한 목록과 순서로 보여줘요'); })); };
 if(!on||src==='epc'){ box.innerHTML=head; bindHead(); return; }
 box.innerHTML=`${head}<div class="sec-h" style="margin:20px 0 10px"><b>적용 목록</b><button type="button" class="btn sm" id="gLink" style="margin-left:auto">T기프트 조회</button></div>
 ${E.gifts.length?`<div class="cl gtbl"><table><thead><tr><th>T기프트명 · 혜택</th><th>대상 조건</th><th>기간</th><th>남은 수량</th><th class="c">연결 해제</th></tr></thead><tbody>${rows}</tbody></table></div>`
 :'<div class="empty">연결한 단말기에 해당하는 T기프트가 EPC에 없어요. 기획전 전용 T기프트는 <b>T기프트 조회</b>로 붙일 수 있어요</div>'}
 ${badgeRow('gBadge','T기프트 배지',E.giftBadge)}`;
 bindHead();
 const after=()=>{ rGift(); rBasic(); refresh(); };
 dndList('#sb-gift','gk',E.gifts,after,null,'tr.gf-r');
 // 조건 매칭 항목을 해제하면 giftCut에 남겨 연결 상품이 바뀌어도 다시 올라오지 않게 한다
 $$('#sb-gift [data-gx]').forEach(b=>b.addEventListener('click',()=>{ const [x]=E.gifts.splice(E.gifts.findIndex(y=>y.id===b.dataset.gx),1); if(x.src==='auto') (E.giftCut=E.giftCut||[]).push(x.id); after(); toast(`${GM(x.id).n} 연결을 해제했어요`); }));
 $$('#sb-gift input[name=gBadge]').forEach(r=>r.addEventListener('change',()=>{ E.giftBadge=r.value==='1'; after(); }));
 $('#gLink').addEventListener('click',()=>openBenefitModal('gift'));
}
let tdMore=false; // 티다팩 목록: 처음 TD_TOP개만 보이고 나머지는 더보기
const tdQty=t=>t.total==null?'한도 없음':`잔여 ${t.left.toLocaleString()} / ${t.total.toLocaleString()}명`;
function rTd(){
 const box=$('#sb-td'); if(!box) return;
 if(!hasPlan(E)){ box.innerHTML=''; return; }
 const more=E.tds.length>TD_TOP, shown=more&&!tdMore?E.tds.slice(0,TD_TOP):E.tds;
 const rows=shown.map((x,i)=>{ const t=TDM(x.id), st=benefitState(t), tg=stTag(st,true);
  return `<tr class="td-r ${st.auto?'dim':''}" data-tk="${x.id}"><td><div class="gnm" style="min-width:0">${gripBtn(i,esc(t.brand))}<span class="tlogo" style="background:${t.lc}" aria-hidden="true">${esc(t.logo)}</span></div></td><td><div class="gnm"><div><b>${esc(t.brand)}${x.src==='own'?'<span class="gtag own">전시 전용</span>':'<span class="gtag auto">조건 매칭</span>'}</b><small>${esc(t.benefit)}</small>${tg?`<div>${tg}</div>`:''}</div></div></td><td>${t.own?condText(t):`${t.cond.pos.filter(id=>E.conn.includes(id)).map(id=>esc(poBy(id).name)).join(', ')}<br><small class="faint">12개월 약정</small>`}</td><td>매월 1회 · 12회<br><small class="faint">${esc(t.issue)}</small></td><td>${esc(t.use)}<br><small class="faint">유효 ${esc(t.valid)}</small></td><td>${dot(t.from)} ~<br>${dot(t.to)}</td><td><span class="qty">${tdQty(t)}</span></td><td class="c"><button type="button" class="lnk" data-tx="${x.id}">연결 해제</button></td></tr>`; }).join('');
 box.innerHTML=`${epcNote('td')}<div class="sec-h"><b>적용 목록</b><button type="button" class="btn sm" id="tLink" style="margin-left:auto">티다팩 조회</button></div>
 ${E.tds.length?`<div class="cl gtbl"><table><thead><tr><th>쿠폰 이미지</th><th>쿠폰명 · 쿠폰 혜택</th><th>대상 조건</th><th>발급</th><th>사용 조건</th><th>기간</th><th>발급 한도</th><th class="c">연결 해제</th></tr></thead><tbody>${rows}</tbody></table></div>${more?`<button type="button" class="btn sm" id="tMore" style="width:100%;margin:6px 0 0">${tdMore?'접기':`더보기 (${E.tds.length-TD_TOP}개)`}</button>`:''}`
 :'<div class="empty">연결한 요금제에 해당하는 티다팩이 EPC에 없어요. 기획전 전용 티다팩은 <b>티다팩 조회</b>로 붙일 수 있어요</div>'}
 ${badgeRow('tBadge','티다팩 배지',E.tdBadge)}`;
 const after=()=>{ rTd(); rBasic(); refresh(); };
 dndList('#sb-td','tk',E.tds,after,null,'tr.td-r');
 // 조건 매칭 항목을 해제하면 tdCut에 남겨 연결 상품이 바뀌어도 다시 올라오지 않게 한다
 $$('#sb-td [data-tx]').forEach(b=>b.addEventListener('click',()=>{ const [x]=E.tds.splice(E.tds.findIndex(y=>y.id===b.dataset.tx),1); if(x.src==='auto') (E.tdCut=E.tdCut||[]).push(x.id); after(); toast(`${TDM(x.id).brand} 연결을 해제했어요`); }));
 $$('#sb-td input[name=tBadge]').forEach(r=>r.addEventListener('change',()=>{ E.tdBadge=r.value==='1'; after(); }));
 if($('#tMore')) $('#tMore').addEventListener('click',()=>{ tdMore=!tdMore; rTd(); });
 $('#tLink').addEventListener('click',()=>openBenefitModal('td'));
}
// T기프트 · 티다팩 조회 팝업: EPC에 등록된 항목을 조회해 이 전시 전용으로 붙인다. 소진 · 종료된 항목과 이미 적용 중인 항목은 고를 수 없다
function openBenefitModal(kind){
 const G=kind==='gift', pool=G?GIFT:TDP, list=G?E.gifts:E.tds, nm=G?'T기프트':'티다팩'; let q='', pick=new Set();
 const draw=()=>{
  const L=pool.filter(x=>{ const n=G?x.n:x.brand; return !q||n.includes(q)||x.id.includes(q.toUpperCase()); });
  $('#mBody').innerHTML=`<input type="text" class="mq" id="bq" value="${esc(q)}" placeholder="${G?'T기프트명 · 코드 검색':'제휴사 · 쿠폰 코드 검색'}" aria-label="검색" style="width:100%"><div class="cl" style="margin-top:10px;max-height:420px"><table><thead><tr><th class="c"></th><th>${G?'T기프트':'쿠폰'}</th><th>구분</th><th>${G?'지급 방식':'대상'}</th><th>기간</th><th>${G?'남은 수량':'발급 한도'}</th></tr></thead><tbody>${L.map(x=>{ const has=list.some(y=>y.id===x.id), st=benefitState(x), dis=has||st.auto;
   return `<tr><td class="c"><input type="checkbox" data-bp="${x.id}" ${has||pick.has(x.id)?'checked':''} ${dis?'disabled':''} aria-label="${esc(G?x.n:x.brand)}"></td><td>${G?`${x.ic} ${esc(x.n)}`:`<b>${esc(x.brand)}</b> · ${esc(x.benefit)}`}<br><small class="faint">${x.id}</small>${has?' <span class="chip">적용 중</span>':''}</td><td>${x.own?'<span class="gtag own">전시 전용</span>':'<span class="gtag auto">조건 매칭</span>'}</td><td>${G?x.mode:x.own?'기획전':(x.cond.pos||[]).map(id=>esc((poBy(id)||{name:id}).name)).join(', ')+' · 12개월'}</td><td>${dot(x.from).slice(5)} ~ ${dot(x.to).slice(2)}${st.auto?` <span class="gtag end">${st.t}</span>`:st.k==='wait'?' <span class="gtag wait">시작 전</span>':''}</td><td>${x.total==null?'없음':x.left.toLocaleString()+(G?'개':'명')}</td></tr>`; }).join('')}</tbody></table></div>
  <p class="pill" style="margin:8px 0 0">EPC에 등록된 ${nm}만 고를 수 있어요. 조건 매칭 ${nm}는 대상 ${G?'단말기':'요금제'}를 연결하면 자동으로 들어와요</p>`;
  $('#mFoot').innerHTML=foot(`선택 ${pick.size}개`,pick.size,`${pick.size}개 연결`);
  keepQ('#bq',v=>q=v,draw);
  $$('#mBody [data-bp]').forEach(c=>c.addEventListener('change',()=>{ c.checked?pick.add(c.dataset.bp):pick.delete(c.dataset.bp); draw(); }));
  // 행 아무 곳이나 눌러도 선택된다 (고를 수 없는 행은 제외)
  $$('#mBody [data-bp]:not(:disabled)').forEach(c=>{ const tr=c.closest('tr'); tr.style.cursor='pointer'; tr.addEventListener('click',e=>{ if(e.target===c) return; c.checked=!c.checked; c.dispatchEvent(new Event('change')); }); });
  $('#mc').addEventListener('click',closeModal);
  $('#mo').addEventListener('click',()=>{ pick.forEach(id=>{ list.push({id,src:'own',show:true}); const k=G?'giftCut':'tdCut'; E[k]=(E[k]||[]).filter(y=>y!==id); }); closeModal(); G?rGift():rTd(); rBasic(); refresh(); toast(`${nm} ${pick.size}개를 연결했어요`); });
 };
 modal(`${nm} 조회`,`EPC에 등록된 ${nm}를 조회해 이 전시에 붙여요`,900); draw();
}

// ---------- 7. 검색 노출 설정 (SEO) ----------
// 사용여부(N/Y) · Tag(최대 10개) · Page Title(25자) · Description(200자) · Meta Image(1200×630). 항목마다 AI 추천으로 채울 수 있다
const KW_MAX=10, SEO_TITLE=25, SEO_DESC=200;
function addKw(raw){ const s=E.search; let n=0; raw.split(',').map(x=>x.trim()).filter(Boolean).forEach(v=>{ if(s.kw.length<KW_MAX&&!s.kw.includes(v)){ s.kw.push(v); n++; } }); return n; }
// AI 추천: 전시명·연결 상품·상세 설명을 바탕으로 만든다 (프로토타입용 규칙)
function seoSuggest(k){
 const P=connPOs(E), nm=nameText(E.name)||(P[0]&&P[0].name)||'';
 if(k==='kw') return [...new Set([...nm.split(/[\s:+&·]+/),...P.flatMap(p=>[p.type,...p.name.split(/[\s:]+/)])].map(x=>x.trim()).filter(x=>x.length>1&&!/^\d/.test(x)))].slice(0,5);
 if(k==='title') return nm.slice(0,SEO_TITLE);
 const body=(E.descMode==='html'?htmlText(E.descHtml):'')||(P[0]&&P[0].desc)||'';
 return (nm&&body?`${nm} - ${body}`:nm||body).slice(0,SEO_DESC);
}
// Y/N 라디오 (v0.3.1 11-25 시안 2: Y를 앞에)
const yn=(name,label,on)=>`<span class="srch-radio" role="radiogroup" aria-label="${label}"><label><input type="radio" name="${name}" value="Y" ${on?'checked':''}>Y</label><label><input type="radio" name="${name}" value="N" ${on?'':'checked'}>N</label></span>`;
const seoRow=(label,cnt,field,hint)=>`<div class="ft-row"><div class="ft-l">${label}${cnt!=null?`<br><span id="${cnt.id}">(${cnt.v})</span>`:''}</div><div class="ft-v">${field}${hint?`<p class="ft-hint">${hint}</p>`:''}</div></div>`;
function rSearch(){
 const s=E.search;
 $('#sb-search').innerHTML=`${guide('<b>네이버 · 구글 같은 검색엔진에서 이 페이지가 어떻게 보일지 설정합니다.</b>','내용을 정확히 이해할 수 있도록 작성하세요.').replace('class="guide"','class="guide" style="margin:0 0 24px"')}
 <div class="ftbl">
 ${seoRow('Tag',{id:'kwCnt',v:`${s.kw.length}/${KW_MAX}`},`<div class="ft-f"><button type="button" class="btn ai-out" data-ai="kw">AI 추천</button><div class="tag-box" id="kwBox">${s.kw.map((k,i)=>`<span class="tag-chip">${esc(k)}<button type="button" data-kx="${i}" aria-label="${esc(k)} 삭제">×</button></span>`).join('')}<input type="text" id="kwIn" placeholder="${s.kw.length<KW_MAX?'고객이 검색할 만한 단어를 입력하세요':'최대 개수에 도달했어요'}" ${s.kw.length<KW_MAX?'':'disabled'} aria-label="Tag"></div></div>`,'*콤마(,)로 구분해 입력하세요')}
 ${seoRow('Page Title',{id:'stCnt',v:`${s.title.length}/${SEO_TITLE}`},`<div class="ft-f"><button type="button" class="btn ai-out" data-ai="title">AI 추천</button><input type="text" id="sTitle" value="${esc(s.title)}" maxlength="${SEO_TITLE}" placeholder="검색결과에 보여지는 제목을 입력하세요" aria-label="Page Title"></div>`,`*최대 ${SEO_TITLE}자 이내로 작성하세요`)}
 ${seoRow('Description',{id:'sdCnt',v:`${s.desc.length}/${SEO_DESC}`},`<div class="ft-f"><button type="button" class="btn ai-out" data-ai="desc">AI 추천</button><input type="text" id="sDesc" value="${esc(s.desc)}" maxlength="${SEO_DESC}" placeholder="검색결과에 보여지는 설명을 입력하세요" aria-label="Description"></div>`,`*최대 ${SEO_DESC}자 이내로 작성하세요`)}
 ${seoRow('Meta Image',null,`<div class="img-list">${s.og?`<div class="img-thumb">${s.og.u?`<img src="${s.og.u}" alt="${esc(s.og.n)}">`:`<div class="img-ph">${svg(IC.image)}${esc(s.og.n)}</div>`}<button type="button" class="x" id="ogDel" aria-label="Meta Image 삭제">×</button></div>`:'<button type="button" class="img-add" id="ogAdd"><b>+</b>이미지 등록</button>'}</div>
  ${imgMeta(null,'','1장만 등록할 수 있습니다.','Meta Image','1200 * 630','JPG, JPEG, PNG, GIF, BMP')}`)}
 </div>`;
 $$('#sb-search [data-kx]').forEach(b=>b.addEventListener('click',()=>{ s.kw.splice(+b.dataset.kx,1); rSearch(); refresh(); }));
 $('#kwBox').addEventListener('click',e=>{ if(e.target.id==='kwBox') $('#kwIn').focus(); });
 const ki=$('#kwIn');
 const commit=()=>{ if(!ki.value.trim()) return; addKw(ki.value); rSearch(); refresh(); const n=$('#kwIn'); if(n&&!n.disabled) n.focus(); };
 ki.addEventListener('keydown',e=>{ if(e.isComposing) return; if(e.key==='Enter'){ e.preventDefault(); commit(); } else if(e.key==='Backspace'&&!ki.value&&s.kw.length){ s.kw.pop(); rSearch(); refresh(); $('#kwIn').focus(); } });
 ki.addEventListener('input',()=>{ if(ki.value.includes(',')) commit(); });
 ki.addEventListener('blur',()=>{ if(ki.value.trim()) commit(); });
 $('#sTitle').addEventListener('input',e=>{ s.title=e.target.value; $('#stCnt').textContent=`(${s.title.length}/${SEO_TITLE})`; refresh(); });
 $('#sDesc').addEventListener('input',e=>{ s.desc=e.target.value; $('#sdCnt').textContent=`(${s.desc.length}/${SEO_DESC})`; refresh(); });
 $$('#sb-search [data-ai]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.ai, v=seoSuggest(k);
  if(!(k==='kw'?v.length:v)){ toast('전시명이나 연결 상품을 먼저 입력하세요'); return; }
  if(k==='kw') s.kw=v; else if(k==='title') s.title=v; else s.desc=v;
  rSearch(); refresh(); toast(k==='kw'?`Tag ${v.length}개를 추천했어요`:`${k==='title'?'Page Title':'Description'}을 추천했어요`); }));
 const oa=$('#ogAdd'); if(oa) oa.addEventListener('click',()=>$('#ogFile').click());
 const od=$('#ogDel'); if(od) od.addEventListener('click',()=>{ s.og=null; rSearch(); refresh(); });
}
$('#ogFile').addEventListener('change',e=>{ const fs=[...e.target.files]; e.target.value=''; readImgs(fs.slice(0,1)).then(l=>{ if(!l[0]) return; E.search.og=l[0]; rSearch(); refresh(); toast('Meta Image를 등록했어요'); }); });

// ---------- 7-1. 오퍼링 문구(CVM) ----------
// 고객 맞춤 제안(CVM)에 쓸 문구. 개수만큼 입력 칸을 보이고, AI 추천은 10자 안팎의 기본 문구로 채운다 (프로토타입용 샘플)
const CVM_SAMPLE=['첫 가입 고객 특별 혜택','매달 아끼는 통신비','지금 바로 시작하세요','인기 상품 추천 조합','20대 고객 인기 1위','데이터 걱정 끝!','혜택 더 받는 방법','놓치면 아쉬운 혜택','한정 기간 특가 안내','나에게 딱 맞는 선택'];
const cvmSuggest=n=>CVM_SAMPLE.slice(0,n);
function rCvm(){
 const c=E.cvm;
 $('#sb-cvm').innerHTML=`<div class="ftbl">
 <div class="ft-row"><div class="ft-l">오퍼링 문구 설정</div><div class="ft-v">
  <div class="ft-f"><button type="button" class="btn ai-out" id="cvmAi">AI 추천</button><div class="tabs" id="cvmN" role="radiogroup" aria-label="오퍼링 문구 개수">${Array.from({length:CVM_MAX},(_,i)=>`<button type="button" role="radio" class="${c.n===i+1?'on':''}" aria-checked="${c.n===i+1}" data-cn="${i+1}">${i+1}개</button>`).join('')}</div></div>
  <div class="cvm-lines">${Array.from({length:c.n},(_,i)=>`<input type="text" data-cv="${i}" value="${esc(c.lines[i]||'')}" maxlength="${CVM_LEN}" placeholder="$제안 문구 노출 영역$" aria-label="오퍼링 문구 ${i+1}">`).join('')}</div>
 </div></div></div>`;
 $$('#cvmN [data-cn]').forEach(b=>b.addEventListener('click',()=>{ c.n=+b.dataset.cn; rCvm(); refresh(); }));
 $$('#sb-cvm [data-cv]').forEach(t=>t.addEventListener('input',()=>{ c.lines[+t.dataset.cv]=t.value; refresh(); }));
 $('#cvmAi').addEventListener('click',()=>{ const v=cvmSuggest(c.n); c.lines=v; rCvm(); refresh(); toast(`오퍼링 문구 ${v.length}개를 추천했어요`); });
}


// ---------- 8. 주문 구성 방식 ----------
// 머리줄 스위치 = 주문 받기. ON: 주문 프로세스 관리(order5)의 프로세스를 주문 구성안으로 연결한다. OFF: 주문 버튼 대신 보일 대체 버튼을 정한다
$('#odOn').addEventListener('change',e=>{ if(E.kind==='mp'){ e.target.checked=true; toast(MP_ORD_LOCK); return; } E.orderOn=e.target.checked; setFold($('#sec-order'),true); onOrderChange(); toast(E.orderOn?'주문을 다시 받아요':'주문을 받지 않아요. 주문 버튼이 대체 버튼으로 바뀌어요'); });
// [키, 이름, 설명, 기본 버튼 문구]
const OFF_ACT=[['none','버튼 없음','안내 문구만 보여요',''],['consult','상담 신청','상담 예약 화면으로 연결해요','상담 신청하기'],['notify','출시 · 입고 알림 신청','신청자에게 알림을 보내요','출시 알림 받기'],['link','다른 전시로 이동','고른 전시 상품으로 보내요','다른 상품 보러가기']];
const offBtn=o=>o.act==='none'?'':(o.btn||(OFF_ACT.find(x=>x[0]===o.act)||OFF_ACT[0])[3]);

// ---------- 8-1. 주문 프로세스 (order6-create.html 목록) ----------
let PROCS=loadProcs();
const procBy=id=>PROCS.rows.find(x=>x.id===id);
// order5 프로세스로 연결한 구성안인지 (v0.2.3 이전 구성안은 stages가 없다)
const isProcPlan=p=>!!(p&&Array.isArray(p.stages));
const planFrom=x=>({src:'order5',id:x.id,name:x.n,cat:x.cat,ap:x.ap,u:x.u,ver:x.ver||'',dt:x.dt,stages:clone(x.stages)});
// 원 프로세스를 고치면 승인된 새 버전이 매핑된 전시에 자동 반영된다: 저장소의 최신 프로세스로 바꾼다. 컨테이너 · 코너가 바뀌면 true
function livePlan(){ const p=E.orderPlan; if(!isProcPlan(p)) return false; const x=procBy(p.id); if(!x) return false;
 const n=planFrom(x), ch=JSON.stringify(n.stages)!==JSON.stringify(p.stages); E.orderPlan=n; return ch; }
// 다른 탭에서 주문 프로세스를 저장하면 목록과 연결한 프로세스를 다시 읽는다
addEventListener('storage',e=>{ if(e.key!==PROC_KEY||!E) return; PROCS=loadProcs(); const ch=livePlan(); rMethod(); onOrderChange(); if(ch) toast('연결한 주문 프로세스가 바뀌어 최신 컨테이너 · 코너를 반영했어요'); });

// 코너 → 이 화면에서 정하는 섹션. 나머지 코너는 주문 프로세스 기준(읽기 전용)
// 요금제 코너는 고객 선택 방식(연결 상품) 기준이라 선택지를 여기서 바꾸지 않는다
const CORNER_SEC={'CN-ORD-0005':'method'};
const secName=k=>(SECS.find(x=>x[0]===k)||[])[1];

// ---------- 8-2. 컨테이너 · 코너 ----------
// v0.3.1: 상품에서 프로세스 · 코너 조건(문구 · 노출 목록 덮어쓰기, E.orderOv)을 정하지 않는다. 컨테이너 · 코너는 주문 프로세스 관리에서 확인한다(연결한 프로세스 이름 · [주문 프로세스에서 확인 ↗]).
// 미리보기는 프로세스 값 그대로 그리고, 채널 관리 항목(가입 · 할부 · 배송 유형)만 이 상품의 노출 체크(E.chHide)를 반영한다
const CT={open:-1,sel:{}};
const cornerMeta=id=>CORNERS.find(c=>c.id===id)||{};
const ovGet=()=>({});
const ovTxt=()=>false;
const optOrd=c=>c.o.map((_,j)=>j);
const optOff=(c,i)=>c.off.includes(i);
function rCtn(){ const box=$('#ctnSecs'); box.innerHTML=''; box.hidden=true; }
function slideCtn(){}
// 주문 프로세스 관리 v0.3(order7-create.html)에서 연결한 프로세스 상세를 연다
const PROC_URL=id=>`/order7-create.html${id?`?id=${encodeURIComponent(id)}`:''}`;

// ---------- 8-3. 채널 관리 항목 노출 (가입 유형 · 할부 유형 · 배송 유형) ----------
// 값 · 순서 · 문구는 채널(주문 코너)에서만 관리한다. 상품은 노출 여부만 체크로 정한다.
// 값은 연결 상품(EPC)이 가진 값의 합집합(복합형이면 모든 구성 영역의 연결 상품). 기본은 모두 노출, 보여주지 않을 값만 체크를 해제한다.
// 저장 값: E.chHide = {join:[], inst:[], ship:[]} (숨긴 값만). EPC에 새 값이 생기면 기본으로 노출된다
// v0.3.2: 숨김 여부는 채널별 노출 제어(미리보기 채널)에서 정한다
const chHidden=(k,v)=>pvChHidden(k,v);
function chUnion(){ const pos=connPOs(E);
 return CH_GROUPS.map(g=>{ const by={}; pos.forEach(p=>(chItemsOf(p)[g.k]||[]).forEach(v=>(by[v]=by[v]||[]).push(p))); return {...g,vals:g.vals.filter(v=>by[v]),by}; }); }
function chxHtml(){
 const pos=connPOs(E), G=chUnion().filter(g=>g.vals.length), pc=planCorners(E);
 const src=E.method==='complex'?`복합형 구성 영역 ${E.areas.length}개 · 연결 상품 ${pos.length}개`:`연결 상품 ${pos.length}개`;
 const rows=G.map(g=>{ const on=g.vals.filter(v=>!chHidden(g.k,v)).length, miss=pc&&!pc.includes(g.corner);
  return seoRow(`${g.n}<small class="${miss?'warn':''}">${miss?'연결한 프로세스에 이 코너가 없어요':`${on} / ${g.vals.length} 노출`}</small>`,null,
   `<div class="axchips" role="group" aria-label="${g.n} 노출">${g.vals.map(v=>{ const o=!chHidden(g.k,v), ps=g.by[v];
    // 어떤 연결 상품이 이 값을 가졌는지는 마우스를 올리면 보인다
    return `<label class="axchip ${o?'on':''}" title="${esc(`${ps.length}개 상품: ${ps.map(p=>p.name).join(', ')}`)}"><input type="checkbox" data-chk="${g.k}" value="${esc(v)}" ${o?'checked':''}>${esc(v)}</label>`; }).join('')}</div>`); }).join('');
 return `<div class="chx"><div class="sub-h">채널 관리 항목 노출</div>
 <p class="chx-src">${pos.length?`<b>${src}</b>이 가진 값을 모두 모았어요. 기본은 모두 노출이고, 이 상품에서 보여주지 않을 값만 체크를 해제하세요. 값 · 순서 · 문구는 채널에서 관리해요.`:'연결 상품을 추가하면 상품이 가진 가입 · 할부 · 배송 유형이 여기에 나와요.'}</p>
 ${!pos.length?'':rows?`<div class="ftbl">${rows}</div>`:'<div class="chx-empty">연결 상품에 채널 관리 항목(가입 · 할부 · 배송 유형) 값이 없어요.</div>'}</div>`;
}
function bindChx(){
 $$('#sb-order [data-chk]').forEach(x=>x.addEventListener('change',()=>{
  const k=x.dataset.chk, v=x.value, g=chUnion().find(y=>y.k===k), h=(E.chHide[k]=E.chHide[k]||[]);
  if(!x.checked){ if(!g.vals.some(y=>y!==v&&!h.includes(y))){ x.checked=true; toast(`${g.n}은 최소 1개는 노출해야 해요`); return; } h.push(v); }
  else E.chHide[k]=h.filter(y=>y!==v);
  rOrder(); refresh(); }));
}
// v0.3.1: 연결한 프로세스 카드. 이름 · [주문 프로세스에서 확인 ↗]을 누르면 주문 프로세스 관리 화면(새 탭)에서 그 프로세스 상세가 열린다.
// [주문 프로세스 선택]은 팝업에서 상품 유형(LV3 조합)에 맞는 주문 유형의 프로세스를 골라 바인딩한다
const EXT='<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>';
// 11-25 시안 5: 연결한 프로세스는 ⓘ 안내 상자(이름 · 메타 한 줄), 버튼은 상자 아래 오른쪽 [주문 프로세스 조회] [해제]
const opBox=(name,meta)=>`<div class="op-box"><div class="op-bh"><i class="op-ic" aria-hidden="true">i</i>${name}</div>${meta?`<ul class="op-ul"><li>${meta}</li></ul>`:''}</div>`;
function planBox(){ const plan=E.orderPlan, o5=isProcPlan(plan);
 const meta=!plan?'연결한 주문 프로세스가 없어요. 주문 프로세스 조회로 연결하세요'
  :o5?`${plan.id}${plan.ver?' · '+esc(plan.ver):''} · ${esc(plan.cat)} · 컨테이너 ${plan.stages.length} · 코너 ${procCornerCnt(plan)}`
  :`${plan.id} · ${plan.ver} · ${ordKind(plan.name)} <span class="gtag st">이전 구성안 · 주문 프로세스로 다시 연결하세요</span>`;
 const name=!plan?'<b>주문 프로세스를 선택하세요</b>':o5?`<button type="button" class="op-name" data-op="go" title="주문 프로세스 관리에서 열기 (새 탭)">${esc(plan.name)}${svg(EXT)}</button>`:`<b>${esc(plan.name)}</b>`;
 return `${opBox(name,meta)}<div class="cn-foot"><button type="button" class="btn ${plan?'':'primary'}" data-op="pick">주문 프로세스 조회</button>${plan?'<button type="button" class="btn primary" data-op="rm">해제</button>':''}</div>`; }
function bindPlan(){
 $$('#sb-order [data-op]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.op; if(k==='pick') openPlanModal();
  else if(k==='rm'){ E.orderPlan=null; rMethod(); onOrderChange(); toast('프로세스 연결을 해제했어요'); }
  else if(k==='go') window.open(PROC_URL(E.orderPlan&&E.orderPlan.id),'_blank'); }));
}
// MP 상품 전시: 주문 프로세스 연결 필수. 주문 받기는 ON으로 잠그고 MP용 프로세스만 고른다
const MP_ORD_LOCK='MP 상품 전시는 주문 프로세스 연결이 필수입니다.';
function rOrderMp(box){
 const pl=isMpPlan(E.orderPlan)?E.orderPlan:null;
 box.innerHTML=`${opBox(pl?`<b>${esc(pl.name)}</b>`:'<b>주문 프로세스를 선택하세요</b>',pl?`${pl.id} · ${pl.ver} · ${pl.cat} · 컨테이너 ${pl.ctn} · 코너 ${pl.cn}`:'MP 상품 전시는 주문 프로세스 연결이 필수예요')}
 <div class="cn-foot"><button type="button" class="btn ${pl?'':'primary'}" id="mpPlanPick">주문 프로세스 조회</button>${pl?'<button type="button" class="btn primary" id="mpPlanRm">해제</button>':''}</div>`;
 $('#mpPlanPick').addEventListener('click',openMpPlanModal);
 { const r=$('#mpPlanRm'); if(r) r.addEventListener('click',()=>{ E.orderPlan=null; onOrderChange(); toast('프로세스 연결을 해제했어요'); }); }
}
function openMpPlanModal(){
 const m=mpDemo(E.mp); let f=m?m.cat:'전체', sel=isMpPlan(E.orderPlan)?E.orderPlan.id:'';
 modal('주문 프로세스 선택','MP 상품 전시용',960,'epc');
 const draw=()=>{ const L=MP_PROCS.filter(p=>f==='전체'||p.type===f);
  $('#mBody').innerHTML=`${ntc('warn','MP 프로세스 구분 기준은 협의 중입니다. 현재는 MP 유형(결합, 요금 감면)으로 거릅니다. <span class="chip warn">미정</span>').replace('class="ntc ','style="margin:0 0 14px" class="ntc ')}
  <form class="epc-search" onsubmit="return false"><div class="fields"><label class="l" for="mpT">MP 유형</label><select id="mpT">${['전체','결합','요금 감면'].map(k=>`<option ${k===f?'selected':''}>${k}</option>`).join('')}</select>${m?`<span class="pill">연결한 MP: ${esc(m.name)} (${m.cat})</span>`:''}</div></form>
  <div class="epc-head"><b>검색결과</b><span>${L.length}건</span></div>
  <div class="epc-tbl"><table><thead><tr><th class="c">선택</th><th>프로세스 ID</th><th>프로세스명</th><th>버전</th><th>주문 유형</th><th>컨테이너</th><th>코너</th></tr></thead><tbody>${L.map(p=>`<tr class="${sel===p.id?'on':''}" data-row="${p.id}"><td class="c"><input type="radio" name="mpPl" ${sel===p.id?'checked':''} aria-label="${esc(p.name)} 선택"></td><td>${p.id}</td><td class="nm">${esc(p.name)}</td><td>${p.ver}</td><td>${p.cat}</td><td>${p.ctn}</td><td>${p.cn}</td></tr>`).join('')||'<tr class="empty-row"><td colspan="7">검색 결과가 없어요</td></tr>'}</tbody></table></div>`;
  $('#mpT').addEventListener('change',e=>{ f=e.target.value; draw(); });
  $$('#mBody tr[data-row]').forEach(tr=>tr.addEventListener('click',()=>{ sel=tr.dataset.row; draw(); }));
  $('#mo').disabled=!sel||(isMpPlan(E.orderPlan)&&E.orderPlan.id===sel); };
 $('#mFoot').innerHTML='<button type="button" class="btn dark-out" id="mc">취소</button><button type="button" class="btn primary" id="mo" disabled>선택</button>';
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const p=MP_PROCS.find(x=>x.id===sel); if(!p) return; E.orderPlan={...p,mpProc:true}; E.orderOn=true; PVMP=mpPvDef(); closeModal(); onOrderChange(); toast(`${p.name}을(를) 연결했어요`); });
 draw();
}
function rOrder(){
 if(E.kind==='mp') E.orderOn=true;
 $('#odOn').checked=E.orderOn; $('#odOnT').textContent='';
 { const od=$('#odOn'), sw=$('#odSw'), mp=E.kind==='mp'; od.disabled=mp||VIEW==='view'; if(sw) sw.title=mp?MP_ORD_LOCK:'주문 받기'; }
 const box=$('#sb-order');
 if(E.kind==='mp'){ rCtn(); rOrderMp(box); return; }
 rCtn();
 if(E.kind==='ps'){ box.innerHTML=ntc('','PS 상품 전시는 주문을 받지 않아요. 고객이 주문하려면 PS가 속한 PO 전시로 이동합니다.'); return; }
 if(E.orderOn){
  const plan=E.orderPlan, e=plan?secState(E).order.e:[];
  // 순서: 확인 필요(주문 유형 불일치 등) → 연결한 주문 프로세스 → 채널 관리 항목 노출
  box.innerHTML=`${e.length?ntc('warn',e.map(esc).join('<br>')).replace('class="ntc ','style="margin:0 0 14px" class="ntc '):''}${planBox()}`;
  bindPlan(); return;
 }
 const o=E.off, others=DISPLAYS.filter(d=>d.id!==E.id);
 if(o.act==='link'&&!others.some(d=>d.id===o.go)) o.go=others[0]?others[0].id:null;
 box.innerHTML=`
 <div class="oacts" role="radiogroup" aria-label="대체 버튼">${OFF_ACT.map(([k,t,d])=>`<label class="oact"><input type="radio" name="oAct" value="${k}" ${o.act===k?'checked':''}><b>${t}</b><small>${d}</small></label>`).join('')}</div>
 ${o.act!=='none'?`<div class="ordoff">
  ${o.act==='link'?`<div class="row"><label class="fl" for="oGo">이동할 전시</label><select id="oGo" style="flex:1" ${others.length?'':'disabled'}>${others.map(d=>`<option value="${d.id}" ${o.go===d.id?'selected':''}>${esc(nameText(d.name)||'이름 없음')} · ${dispId(d.id)}</option>`).join('')||'<option>이동할 전시가 없어요</option>'}</select></div>`:''}
 </div>`:''}`;
 // v0.2.4: 버튼 문구는 따로 입력하지 않고 대체 버튼마다 기본 문구를 쓴다
 $$('#sb-order input[name=oAct]').forEach(r=>r.addEventListener('change',()=>{ o.act=r.value; o.btn=OFF_ACT.find(x=>x[0]===r.value)[3]; rOrder(); refresh(); }));
 const og=$('#oGo'); if(og) og.addEventListener('change',e=>{ o.go=+e.target.value; });
}

// ---------- 모달 공통 ----------
let mBack=null;
// cls: 모달별 모양 (예: 'epc' = EPC 상품 조회)
function modal(title,sub,width,cls){ $('#mTitle').textContent=title; $('#mSub').textContent=sub||''; const mb=$('#md .mbox'); mb.className='mbox'+(cls?' '+cls:''); mb.style.width=`min(${width||820}px,100%)`; mBack=document.activeElement; $('#md').hidden=false; $('#md .mbox').focus(); }
function closeModal(){ $('#md').hidden=true; if(mBack&&mBack.focus) mBack.focus(); }
$('#mClose').addEventListener('click',closeModal);
$('#md').addEventListener('click',e=>{ if(e.target.id==='md') closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(!pop.hidden){ closePop(); return; } if(!$('#md').hidden) closeModal(); else if(!$('#dockSheet').hidden) setDock(false); });
const filTabs=(list,curF)=>`<div class="tabs mfil" role="group" aria-label="상품 구분">${list.map(t=>`<button type="button" class="${curF===t?'on':''}" data-f="${t}">${t}</button>`).join('')}</div>`;
const foot=(txt,n,label)=>`<span class="pill" style="margin-right:auto">${txt}</span><button type="button" class="btn" id="mc">취소</button><button type="button" class="btn primary" id="mo" ${n?'':'disabled'}>${label}</button>`;
// 검색어 입력 중 다시 그려도 커서 위치를 지킨다
function keepQ(id,set,draw){ $(id).addEventListener('input',e=>{ set(e.target.value.trim()); const p=e.target.selectionStart; draw(); const n=$(id); n.focus(); n.setSelectionRange(p,p); }); }

// EPC 상품 조회(연결 상품 추가): 위 조회 조건 → 검색결과 표 → 취소/추가
// LV3 선택지는 고른 LV2에 속한 값만 보여 준다
const lv3Of=g=>Object.keys(LV3S).filter(k=>g==='전체'||LV3S[k].lv2===g);
// f: 입력 중인 조건, a: 조회 버튼으로 적용한 조건
let CM={sel:new Set(),f:{g:'전체',k:'전체',q:''},a:{g:'전체',k:'전체',q:''}};
function openConnModal(){ const z={g:'전체',k:'전체',q:''}; CM={sel:new Set(),f:{...z},a:{...z}}; modal('EPC 상품 조회',E.kind==='mp'?'전시할 EPC 상품 1개를 고르세요':'LV1 · 상품 (고정)',1200,'epc'); drawConn(); $('#cq').focus(); }
function drawConn(){
 const f=CM.f, opt=(list,v)=>['전체',...list].map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('');
 $('#mBody').innerHTML=`<form class="epc-search" id="cmForm">
  <div class="fields">
   <label class="l" for="cmG">LV2 · 서비스 도메인</label><select id="cmG">${opt(LV2S,f.g)}</select><label class="l" for="cmK">LV3 · 서비스 유형</label><select id="cmK">${opt(lv3Of(f.g),f.k)}</select>
   <label class="l" for="cq">검색어</label><input type="text" id="cq" value="${esc(f.q)}" placeholder="상품명, EPC 상품ID, 상품 코드 또는 Product Spec 입력">
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="cmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색결과</b><span id="cmCnt"></span></div>
 <div class="epc-tbl"><table><thead><tr><th class="c"><input type="checkbox" id="cmAll" aria-label="검색결과 전체 선택"></th><th>EPC 상품ID</th><th>버전</th><th>EPC 상품명</th><th>LV2</th><th>LV3</th><th>Product Spec</th><th>판매상태</th></tr></thead><tbody id="cmRows"></tbody></table></div>`;
 // LV2를 바꾸면 LV3는 전체로 돌아가고 선택지가 그 LV2 값으로 바뀐다. 검색결과는 [조회] 때 반영한다
 $('#cmG').addEventListener('change',e=>{ f.g=e.target.value; f.k='전체'; $('#cmK').innerHTML=opt(lv3Of(f.g),f.k); });
 $('#cmK').addEventListener('change',e=>{ f.k=e.target.value; });
 $('#cq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#cmForm').addEventListener('submit',e=>{ e.preventDefault(); CM.a={...f,q:f.q.trim()}; drawConnRows(); });
 $('#cmReset').addEventListener('click',()=>{ CM.f={g:'전체',k:'전체',q:''}; CM.a={...CM.f}; drawConn(); $('#cq').focus(); });
 $('#mFoot').innerHTML=`<button type="button" class="btn dark-out" id="mc">취소</button><button type="button" class="btn primary" id="mo" disabled>추가</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const add=[...CM.sel]; if(E.kind==='mp') E.conn=add.slice(0,1); else E.conn.push(...add); closeModal(); const n=onConnChange(); toast(`${add.length}개 상품을 연결했어요${n?` · 상품 템플릿 ${n}개를 콘텐츠 정보에 넣었어요`:''}`); });
 drawConnRows();
}
// 표만 다시 그린다. 체크는 행 상태만 바꿔 스크롤 위치를 지킨다
function drawConnRows(){
 const a=CM.a, q=a.q.toLowerCase();
 const L=PO.filter(p=>{ const x=epcOf(p); return (a.g==='전체'||x.lv2===a.g)&&(a.k==='전체'||x.lv3===a.k)&&(!q||[p.name,p.id,p.epc,x.spec].some(v=>v.toLowerCase().includes(q))); });
 $('#cmCnt').textContent=`${L.length}건`;
 $('#cmRows').innerHTML=L.map(p=>{ const done=E.conn.includes(p.id), on=CM.sel.has(p.id), x=epcOf(p);
  return `<tr class="${done?'done':''} ${on?'on':''}" data-row="${p.id}"><td class="c"><input type="checkbox" data-p="${p.id}" ${on||done?'checked':''} ${done?'disabled':''} aria-label="${esc(p.name)} 선택"></td><td>${p.epc}</td><td>${p.ver}</td><td class="nm">${esc(p.name)}${done?' <span class="chip">연결됨</span>':''}</td><td>${x.lv2}</td><td>${x.lv3}</td><td>${esc(x.spec)}</td><td><span class="sale-chip">${p.sale}</span></td></tr>`; }).join('')
  ||'<tr class="empty-row"><td colspan="8">검색 결과가 없어요</td></tr>';
 // 전체 선택: 지금 검색결과 중 이미 연결된 상품을 뺀 나머지를 한 번에 고르거나 푼다
 const pick=L.filter(p=>!E.conn.includes(p.id)).map(p=>p.id), all=$('#cmAll');
 const sync=()=>{ const n=CM.sel.size, b=$('#mo'); b.disabled=!n; b.textContent=n?`추가 (${n})`:'추가';
  const k=pick.filter(id=>CM.sel.has(id)).length; all.disabled=!pick.length||E.kind==='mp'; all.checked=!!pick.length&&k===pick.length; all.indeterminate=k>0&&k<pick.length; };
 all.onchange=()=>{ const on=all.checked; pick.forEach(id=>{ on?CM.sel.add(id):CM.sel.delete(id); const tr=$(`#cmRows [data-row="${id}"]`); tr.classList.toggle('on',on); tr.querySelector('input').checked=on; }); sync(); };
 // MP 상품 전시는 원천 PO 1개만: 새로 고르면 앞에서 고른 것을 푼다
 const toggle=(id,on)=>{ if(on&&E.kind==='mp') [...CM.sel].forEach(x=>{ CM.sel.delete(x); const t=$(`#cmRows [data-row="${x}"]`); if(t){ t.classList.remove('on'); t.querySelector('input').checked=false; } }); on?CM.sel.add(id):CM.sel.delete(id); const tr=$(`#cmRows [data-row="${id}"]`); tr.classList.toggle('on',on); tr.querySelector('input').checked=on; sync(); };
 $$('#cmRows [data-p]').forEach(c=>c.addEventListener('change',()=>toggle(c.dataset.p,c.checked)));
 $$('#cmRows tr[data-row]:not(.done)').forEach(tr=>tr.addEventListener('click',e=>{ if(e.target.closest('input')) return; const id=tr.dataset.row; toggle(id,!CM.sel.has(id)); }));
 sync();
}
// 주문 구성안 선택: 주문 프로세스 관리 v0.2.4(order6-create.html) 목록. 검색 조건 → 검색 결과(라디오 1개 선택, 10개씩 페이지) → 고른 프로세스의 컨테이너 · 코너 → 닫기/적용
// 승인 완료 · 사용 Y 프로세스만 고를 수 있다. 처음 조회는 지금 상품 유형과 같은 주문 유형 · 승인 완료 · 사용 Y
const PM_PER=5; // v0.3: 5개씩 보여 주고 나머지는 페이지로 넘긴다
const pmCat=()=>{ const t=lv3Text(); return t&&PROC_CATS.find(c=>sameCat(c,t))||'전체'; };
// v0.3: 검색 조건은 검색어(프로세스명 · 프로세스 ID 함께) · 주문 유형만. 승인 상태 · 사용 여부 조건은 뺐다(고를 수 없는 행은 목록에서 비활성)
const pmDef=()=>({cat:pmCat(),q:''});
let PM={};
const apChip=a=>`<span class="ap ${a==='승인 완료'?'ok':a==='반려'?'bad':a==='승인 대기'?'wait':''}">${a}</span>`;
function openPlanModal(){ PROCS=loadProcs(); const z=pmDef(); PM={sel:isProcPlan(E.orderPlan)?E.orderPlan.id:null,f:{...z},a:{...z},page:1}; modal('주문 프로세스 선택','',1200,'epc'); drawPlan(); $('#pq').focus(); }
function drawPlan(){
 const f=PM.f, sel=(id,list,v)=>`<select id="${id}">${list.map(c=>`<option ${c===v?'selected':''}>${c}</option>`).join('')}</select>`;
 $('#mBody').innerHTML=`<form class="epc-search" id="pmForm">
  <div class="fields">
   <label class="l" for="pq">검색</label><input type="text" id="pq" value="${esc(f.q)}" placeholder="프로세스명 또는 프로세스 ID 입력" aria-label="검색어" style="width:100%">
   <label class="l" for="pmCat">주문 유형</label>${sel('pmCat',['전체',...PROC_CATS],f.cat)}
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="pmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색 결과</b><span id="pmCnt"></span></div>
 <div class="epc-tbl pm-tbl"><table><thead><tr><th class="c">선택</th><th>No</th><th>프로세스 ID</th><th>주문 유형</th><th>프로세스명</th><th>승인 상태</th><th>사용 여부</th><th>컨테이너 · 코너</th><th>전시 수</th><th>최종 수정일</th><th>최종 수정자</th></tr></thead><tbody id="pmRows"></tbody></table></div>
 <nav class="pager" id="pmPager" aria-label="페이지"></nav>
 <div class="pm-pv" id="pmPv"></div>`;
 [['pmCat','cat']].forEach(([id,k])=>$('#'+id).addEventListener('change',e=>{ f[k]=e.target.value; }));
 $('#pq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#pmForm').addEventListener('submit',e=>{ e.preventDefault(); PM.a={...f,q:f.q.trim()}; PM.page=1; drawPlanRows(); });
 $('#pmReset').addEventListener('click',()=>{ PM.f=pmDef(); PM.a={...PM.f}; PM.page=1; drawPlan(); $('#pq').focus(); });
 $('#mFoot').innerHTML=`<button type="button" class="btn dark-out" id="mc">닫기</button><button type="button" class="btn primary" id="mo">적용</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const x=procBy(PM.sel); if(!procUsable(x)) return;
  if(!isProcPlan(E.orderPlan)||E.orderPlan.id!==x.id){ E.orderOv={}; CT.open=0; CT.sel={}; PVC=0; }
  E.orderPlan=planFrom(x); closeModal(); rMethod(); onOrderChange();
  toast(`'${x.n}' 프로세스를 연결했어요`); });
 drawPlanRows();
}
function drawPlanRows(){
 const a=PM.a, q=a.q.toLowerCase();
 const L=PROCS.rows.filter(t=>(a.cat==='전체'||t.cat===a.cat)&&(!q||t.n.toLowerCase().includes(q)||t.id.toLowerCase().includes(q))).sort((x,y)=>x.dt<y.dt?1:x.dt>y.dt?-1:0);
 const pages=Math.max(1,Math.ceil(L.length/PM_PER)); PM.page=Math.min(PM.page,pages);
 const off=(PM.page-1)*PM_PER, rows=L.slice(off,off+PM_PER);
 $('#pmCnt').textContent=`${L.length}건`;
 $('#pmRows').innerHTML=rows.map((t,i)=>{ const ok=procUsable(t);
  return `<tr class="${PM.sel===t.id?'on':''} ${ok?'':'dis'}" data-row="${t.id}" ${ok?'':`title="승인 완료 · 사용 Y 프로세스만 연결할 수 있어요"`}><td class="c"><input type="radio" name="pmSel" value="${t.id}" ${PM.sel===t.id?'checked':''} ${ok?'':'disabled'} aria-label="${esc(t.n)} 선택"></td><td>${L.length-off-i}</td><td>${t.id}</td><td class="nm">${esc(t.cat)}</td><td class="nm">${esc(t.n)}</td><td>${apChip(t.ap)}</td><td>${t.u?'Y':'N'}</td><td>${t.stages.length} · ${procCornerCnt(t)}</td><td>${t.cnt}건</td><td>${esc(t.dt)}</td><td>${esc(t.by)}</td></tr>`; }).join('')
  ||'<tr class="empty-row"><td colspan="11">조회된 프로세스가 없습니다</td></tr>';
 // 페이지 번호: 처음·이전 / 앞뒤 4쪽 / 다음·마지막
 const p=PM.page, from=Math.max(1,Math.min(p-4,pages-8)), to=Math.min(pages,from+8), nums=[];
 for(let i=from;i<=to;i++) nums.push(i);
 const ic=d=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
 $('#pmPager').innerHTML=`<button type="button" data-pg="1" ${p===1?'disabled':''} aria-label="처음">${ic('M17 18l-6-6 6-6M7 6v12')}</button><button type="button" data-pg="${p-1}" ${p===1?'disabled':''} aria-label="이전">${ic('m15 18-6-6 6-6')}</button>${from>1?'<i>…</i>':''}${nums.map(i=>`<button type="button" data-pg="${i}" class="${i===p?'on':''}" ${i===p?'aria-current="page"':''}>${i}</button>`).join('')}${to<pages?`<i>…</i><button type="button" data-pg="${pages}">${pages}</button>`:''}<button type="button" data-pg="${p+1}" ${p===pages?'disabled':''} aria-label="다음">${ic('m9 18 6-6-6-6')}</button><button type="button" data-pg="${pages}" ${p===pages?'disabled':''} aria-label="마지막">${ic('M7 18l6-6-6-6M17 6v12')}</button>`;
 $$('#pmPager [data-pg]').forEach(b=>b.addEventListener('click',()=>{ PM.page=+b.dataset.pg; drawPlanRows(); $('#pmRows').closest('.epc-tbl').scrollTop=0; }));
 // 고른 프로세스의 컨테이너 · 코너와 주문 유형 일치 여부
 const pv=()=>{ const x=procBy(PM.sel), t=lv3Text();
  $('#pmPv').hidden=!x;
  $('#pmPv').innerHTML=!x?'':`<b>${esc(x.n)}</b> · ${x.id} · ${esc(x.cat)}${t&&!sameCat(x.cat,t)?` <span class="gtag st">상품 유형(${esc(t)})과 주문 유형이 달라요</span>`:''}<br>${x.stages.map((s,i)=>`${i+1}. ${esc(s.name)} <span class="faint">(${s.corners.map(c=>esc(c.n)).join(', ')||'코너 없음'})</span>`).join('<br>')}`;
  $('#mo').disabled=!procUsable(x); };
 const pick=id=>{ PM.sel=id; $$('#pmRows tr[data-row]').forEach(tr=>{ const on=tr.dataset.row===id; tr.classList.toggle('on',on); tr.querySelector('input').checked=on; }); pv(); };
 $$('#pmRows tr[data-row]:not(.dis)').forEach(tr=>tr.addEventListener('click',()=>pick(tr.dataset.row)));
 pv();
}
// PS 상품 전시는 전시 콘텐츠 등록용이라 PS 1개만 불러온다(라디오 선택). 이미 연결한 PS가 있으면 바꾼다
// 레이아웃 · 스타일은 EPC 상품 조회 팝업(openConnModal)과 같다: 검색 조건(조회 · 초기화) → 검색결과 건수 → 표 → 취소/추가
// f: 입력 중인 조건, a: [조회]로 적용한 조건. 표의 칸은 연결 상품 섹션의 PS 표와 같다
const PS_KINDS=['필수 PS','선택 PS 후보'];
const psPool=()=>PSLIST.filter(s=>s.po.type==='구독서비스');
const psPos=()=>[...new Map(psPool().map(s=>[s.po.id,s.po])).values()];
function openPsModal(){ const z={k:'전체',po:'전체',q:''}; CM={sel:E.conn[0]||'',f:{...z},a:{...z}}; modal('상품 추가','PS 상품 전시는 PS 1개만 연결합니다',1200,'epc'); drawPs(); $('#cq').focus(); }
function drawPs(){
 const f=CM.f, opt=(list,v)=>[['전체','전체'],...list].map(([k,l])=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(l)}</option>`).join('');
 $('#mBody').innerHTML=`<form class="epc-search" id="cmForm">
  <div class="fields">
   <label class="l" for="cmK">PS 구분</label><select id="cmK">${opt(PS_KINDS.map(k=>[k,k]),f.k)}</select><label class="l" for="cmP">소속 PO</label><select id="cmP">${opt(psPos().map(p=>[p.id,p.name]),f.po)}</select>
   <label class="l" for="cq">검색어</label><input type="text" id="cq" value="${esc(f.q)}" placeholder="PS명, PS ID, 소속 PO명 또는 소속 PO 코드 입력">
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="cmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색결과</b><span id="cmCnt"></span></div>
 <div class="epc-tbl"><table><thead><tr><th class="c">선택</th><th>EPC 상품 ID</th><th>버전</th><th>EPC 상품명</th><th>PS Spec</th><th>유효기간</th><th>판매 상태</th></tr></thead><tbody id="cmRows"></tbody></table></div>`;
 $('#cmK').addEventListener('change',e=>{ f.k=e.target.value; });
 $('#cmP').addEventListener('change',e=>{ f.po=e.target.value; });
 $('#cq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#cmForm').addEventListener('submit',e=>{ e.preventDefault(); CM.a={...f,q:f.q.trim()}; drawPsRows(); });
 $('#cmReset').addEventListener('click',()=>{ CM.f={k:'전체',po:'전체',q:''}; CM.a={...CM.f}; drawPs(); $('#cq').focus(); });
 $('#mFoot').innerHTML=`<button type="button" class="btn dark-out" id="mc">취소</button><button type="button" class="btn primary" id="mo" disabled>${E.conn.length?'변경':'추가'}</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const x=CM.sel&&psBy(CM.sel); if(!x||E.conn[0]===CM.sel) return; const chg=!!E.conn.length; E.conn=[CM.sel]; closeModal(); const t=onConnChange(); toast(`${x.name}을(를) ${chg?'연결 PS로 바꿨어요':'연결했어요'}${t?` · 상품 템플릿 ${t}개를 콘텐츠 정보에 넣었어요`:''}`); });
 drawPsRows();
}
// 표만 다시 그린다. PS는 1개만 고르므로 라디오, 행을 눌러도 고른다. 지금 연결한 PS는 '연결됨'
function drawPsRows(){
 const a=CM.a, q=a.q.toLowerCase(), psId=s=>s.key.split('|').slice(1).join('-');
 const L=psPool().filter(s=>(a.k==='전체'||s.kind===a.k)&&(a.po==='전체'||s.po.id===a.po)&&(!q||[s.name,psId(s),s.po.name,s.po.id].some(v=>String(v).toLowerCase().includes(q))));
 $('#cmCnt').textContent=`${L.length}건`;
 $('#cmRows').innerHTML=L.map(s=>{ const on=CM.sel===s.key, done=E.conn.includes(s.key);
  return `<tr class="${on?'on':''}" data-row="${esc(s.key)}"><td class="c"><input type="radio" name="psPick" data-p="${esc(s.key)}" ${on?'checked':''} aria-label="${esc(s.name)} 선택"></td><td>${psId(s)}</td><td>${s.po.ver}</td><td class="nm">${esc(s.name)}${done?' <span class="chip">연결됨</span>':''}</td><td>${esc(s.desc||'-')}</td><td>상시</td><td><span class="sale-chip">${s.po.sale}</span></td></tr>`; }).join('')
  ||'<tr class="empty-row"><td colspan="7">검색 결과가 없어요</td></tr>';
 const sync=()=>{ const b=$('#mo'), x=CM.sel&&psBy(CM.sel); b.disabled=!x||E.conn[0]===CM.sel; };
 const pick=key=>{ CM.sel=key; $$('#cmRows tr[data-row]').forEach(tr=>{ const on=tr.dataset.row===key; tr.classList.toggle('on',on); tr.querySelector('input').checked=on; }); sync(); };
 $$('#cmRows [data-p]').forEach(c=>c.addEventListener('change',()=>{ if(c.checked) pick(c.dataset.p); }));
 $$('#cmRows tr[data-row]').forEach(tr=>tr.addEventListener('click',e=>{ if(e.target.closest('input')) return; pick(tr.dataset.row); }));
 sync();
}
// v0.3.2 MP 추가 팝업: 상품 추가 팝업 구조(검색 폼 · 결과 표 · 라디오) 재사용. 판매중이 아닌 MP는 고를 수 없다
const MP_SALE_MSG='판매중인 상품만 연결할 수 있습니다';
function openMpModal(){ const z={s:'전체',q:''}; CM={sel:'',f:{...z},a:{...z}}; modal('상품 추가','MP 상품 전시는 MP 1개만 연결합니다',1200,'epc'); drawMp(); $('#cq').focus(); }
function drawMp(){
 const f=CM.f, opt=(list,v)=>list.map(k=>`<option value="${esc(k)}" ${k===v?'selected':''}>${esc(k)}</option>`).join('');
 $('#mBody').innerHTML=`<form class="epc-search" id="cmForm">
  <div class="fields">
   <label class="l" for="cmS">판매 상태</label><select id="cmS">${opt(['전체','판매중','판매종료'],f.s)}</select>
   <label class="l" for="cq">검색어</label><input type="text" id="cq" value="${esc(f.q)}" placeholder="MP명 또는 MP ID 입력">
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="cmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색결과</b><span id="cmCnt"></span></div>
 <div class="epc-tbl"><table><thead><tr><th class="c">선택</th><th>EPC 상품 ID</th><th>EPC 상품명</th><th>MP Spec</th><th>유효기간</th><th>판매 상태</th></tr></thead><tbody id="cmRows"></tbody></table></div>`;
 $('#cmS').addEventListener('change',e=>{ f.s=e.target.value; });
 $('#cq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#cmForm').addEventListener('submit',e=>{ e.preventDefault(); CM.a={...f,q:f.q.trim()}; drawMpRows(); });
 $('#cmReset').addEventListener('click',()=>{ CM.f={s:'전체',q:''}; CM.a={...CM.f}; drawMp(); $('#cq').focus(); });
 $('#mFoot').innerHTML='<button type="button" class="btn dark-out" id="mc">취소</button><button type="button" class="btn primary" id="mo" disabled>추가</button>';
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const m=mpDemo(CM.sel); if(!m||m.sale!=='판매중') return; E.mp=m.id; closeModal(); onConnChange(); toast(`${m.name}을(를) 연결했어요`); });
 drawMpRows();
}
function drawMpRows(){
 const a=CM.a, q=a.q.toLowerCase();
 const L=MP_DEMO.filter(m=>(a.s==='전체'||m.sale===a.s)&&(!q||[m.name,m.id].some(v=>v.toLowerCase().includes(q))));
 $('#cmCnt').textContent=`${L.length}건`;
 $('#cmRows').innerHTML=L.map(m=>{ const on=CM.sel===m.id, off=m.sale!=='판매중';
  return `<tr class="${on?'on':''} ${off?'dis':''}" data-row="${m.id}" ${off?`title="${MP_SALE_MSG}" aria-disabled="true"`:''}><td class="c"><input type="radio" name="mpPick" data-p="${m.id}" ${on?'checked':''} ${off?'disabled':''} aria-label="${esc(m.name)} 선택"></td><td>${m.id}</td><td class="nm">${esc(m.name)}${off?`<small class="mp-off">${MP_SALE_MSG}</small>`:''}</td><td>${esc(m.target)}</td><td>${mpPeriod(m)}</td><td><span class="sale-chip">${m.sale}</span></td></tr>`; }).join('')
  ||'<tr class="empty-row"><td colspan="6">검색 결과가 없어요</td></tr>';
 const sync=()=>{ const m=mpDemo(CM.sel); $('#mo').disabled=!m||m.sale!=='판매중'; };
 const pick=id=>{ const m=mpDemo(id); if(!m||m.sale!=='판매중'){ toast(MP_SALE_MSG); return; } CM.sel=id; $$('#cmRows tr[data-row]').forEach(tr=>{ const on=tr.dataset.row===id; tr.classList.toggle('on',on); tr.querySelector('input').checked=on; }); sync(); };
 $$('#cmRows [data-p]').forEach(c=>c.addEventListener('change',()=>{ if(c.checked) pick(c.dataset.p); }));
 $$('#cmRows tr[data-row]').forEach(tr=>tr.addEventListener('click',e=>{ if(e.target.closest('input')) return; pick(tr.dataset.row); }));
 sync();
}
// PO 상세 보기
const EPC_ROWS=[['lv3','LV3 서비스유형'],['line','회선필수'],['contract','계약유형'],['lineKind','회선종류'],['lineState','회선상태'],['exist','기존 가입상품'],['dup','중복가입'],['combo','상품 조합'],['provider','제공주체'],['spec','Product Spec']];
// 코드 · 버전은 제목 옆 대신 표 맨 위에 둔다. 상품 설명 · Delivery type/Price policy 카드 · 대표 이미지 · 'EPC 읽기 전용' 표시는 뺐다
function openPoDetail(id){ const p=poBy(id), x=epcOf(p); modal(p.name,'',720);
 const rows=[['EPC 코드',p.epc],['PO ID',p.id],['버전',p.ver],...EPC_ROWS.map(([k,l])=>[l,x[k]])];
 $('#mBody').innerHTML=`<div class="ftbl" style="margin:0">${rows.map(([l,v])=>`<div class="ft-row"><div class="ft-l">${l}</div><div class="ft-v">${esc(v)}</div></div>`).join('')}</div>`;
 $('#mFoot').innerHTML=`<button type="button" class="btn" id="mc" style="margin-left:auto">닫기</button>`; $('#mc').addEventListener('click',closeModal); }
// EPC 정보 불러오기 (항목별 선택)
let EL={};
function openEpcLoad(){ EL={name:-1,imgs:new Set()}; modal('EPC 정보 불러오기','',720); drawEpcLoad(); }
function drawEpcLoad(){
 const P=connPOs(E), has=f=>[E.main,...E.subs].some(m=>m&&m.n===f);
 const radio=(key,label,curv,val)=>`<div class="mrow"><div class="fl">${label}${EL[key]>=0?' <span class="chip acc">변경</span>':''}</div><div><label class="op ${EL[key]<0?'on':''}"><input type="radio" name="el${key}" data-el="${key}" value="-1" ${EL[key]<0?'checked':''}><span style="flex:1;color:${curv?'inherit':'var(--muted)'}">${esc(curv)||'미입력'}</span><span class="chip">현재 값 유지</span></label>${P.map((p,i)=>`<label class="op ${EL[key]===i?'on':''}"><input type="radio" name="el${key}" data-el="${key}" value="${i}" ${EL[key]===i?'checked':''}><span style="flex:1">${esc(val(p))}</span><span class="pill">${esc(p.name)}</span></label>`).join('')}</div></div>`;
 $('#mBody').innerHTML=`<div class="mfill"><span class="pill">한 번에 채우기</span><select id="elAll"><option value="">상품 선택</option>${P.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select><span class="pill">${noImg(E)?'전시명을':'전시명·이미지를'} 그 상품 값으로</span></div>
 ${radio('name','전시명',E.name,p=>p.name)}
 ${noImg(E)?'':`<div class="mrow"><div class="fl">이미지${EL.imgs.size?` <span class="chip acc">+${EL.imgs.size}</span>`:''}</div><div><p class="pill" style="margin:0 0 6px">현재 대표 ${E.main?1:0}장 · 추가 ${E.subs.length}장 · 대표이미지가 비어 있으면 첫 장을 대표로, 나머지는 추가이미지로 넣어요</p>${P.flatMap(p=>p.img.map(f=>{ const h=has(f); return `<label class="op ${EL.imgs.has(f)?'on':''}" ${h?'style="opacity:.5"':''}><input type="checkbox" data-img="${esc(f)}" ${EL.imgs.has(f)||h?'checked':''} ${h?'disabled':''}><span style="flex:1">${esc(f)}${h?' · 이미 등록됨':''}</span><span class="pill">${esc(p.name)}</span></label>`; })).join('')}</div></div>`}`;
 $('#elAll').addEventListener('change',e=>{ const i=e.target.value; if(i==='') return; EL.name=+i; if(!noImg(E)) P[+i].img.forEach(f=>{ if(!has(f)) EL.imgs.add(f); }); drawEpcLoad(); });
 $$('#mBody [data-el]').forEach(r=>r.addEventListener('change',()=>{ EL[r.dataset.el]=+r.value; drawEpcLoad(); }));
 $$('#mBody [data-img]').forEach(c=>c.addEventListener('change',()=>{ c.checked?EL.imgs.add(c.dataset.img):EL.imgs.delete(c.dataset.img); drawEpcLoad(); }));
 const n=(EL.name>=0)+(EL.imgs.size?1:0);
 // 하단: 바뀐 항목 요약 없이 [취소] [적용]만. 바꿀 항목이 없으면 적용은 비활성
 $('#mFoot').innerHTML=`<button type="button" class="btn" id="mc" style="margin-left:auto">취소</button><button type="button" class="btn primary" id="mo" ${n?'':'disabled'}>적용</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ if(EL.name>=0) E.name=P[EL.name].name; const add=[...EL.imgs].map(img); if(!E.main&&add.length) E.main=add.shift(); E.subs.push(...add.slice(0,Math.max(0,SUB_MAX-E.subs.length))); syncImgs(); closeModal(); rBasic(); refresh(); toast(`${n}개 항목을 적용했어요`); });
}
// 템플릿 불러오기
let TM={};
// 템플릿 불러오기: EPC 상품 조회(연결 상품 추가)와 같은 구성 — 위 조회 조건(구분 · 검색어) → 검색결과 표(체크) → 취소/추가하기. 미리보기 없음
// 상품 콘텐츠 관리에서 미사용으로 바꾼 템플릿은 고를 수 없다. 이미 추가한 템플릿은 '추가됨'으로 막는다. f: 입력 중인 조건, a: [조회]로 적용한 조건
function openTplModal(){ const z={k:'전체',q:''}; TM={sel:new Set(),mode:'link',f:{...z},a:{...z}}; modal('템플릿 불러오기','',1200,'epc'); drawTpl(); $('#tq').focus(); }
function drawTpl(){
 const f=TM.f, types=['전체',...new Set(TPL.filter(t=>t.on!==false).map(t=>t.t))];
 $('#mBody').innerHTML=`<form class="epc-search" id="tmForm">
  <div class="fields">
   <label class="l" for="tmK">구분</label><select id="tmK">${types.map(x=>`<option ${x===f.k?'selected':''}>${x}</option>`).join('')}</select><input type="text" id="tq" value="${esc(f.q)}" placeholder="템플릿명 또는 템플릿 ID 입력" aria-label="검색어">
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="tmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색결과</b><span id="tmCnt"></span></div>
 <div class="epc-tbl"><table><thead><tr><th class="c"><input type="checkbox" id="tmAll" aria-label="검색결과 전체 선택"></th><th>템플릿 ID</th><th>템플릿명</th><th>구분</th><th>버전</th><th>최종 수정일</th></tr></thead><tbody id="tmRows"></tbody></table></div>`;
 $('#tmK').addEventListener('change',e=>{ f.k=e.target.value; });
 $('#tq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#tmForm').addEventListener('submit',e=>{ e.preventDefault(); TM.a={...f,q:f.q.trim()}; drawTplRows(); });
 $('#tmReset').addEventListener('click',()=>{ TM.f={k:'전체',q:''}; TM.a={...TM.f}; drawTpl(); $('#tq').focus(); });
 $('#mFoot').innerHTML=`<button type="button" class="btn dark-out" id="mc">취소</button><button type="button" class="btn primary" id="mo" disabled>추가하기</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const n=TM.sel.size; TM.sel.forEach(id=>{ const t=tplBy(id); const x={id:nid(),t:t.n,mode:TM.mode,src:id,show:true,txt:TM.mode==='copy'?t.body:''}; E.extras.push(x); curX=x.id; }); closeModal(); rExtra(); refresh(); toast(`템플릿 ${n}개를 추가했어요`); });
 drawTplRows();
}
// 표만 다시 그린다. 체크는 행 상태만 바꿔 스크롤 위치를 지킨다
function drawTplRows(){
 const a=TM.a, q=a.q.toLowerCase(), used=new Set(E.extras.map(x=>x.src).filter(Boolean));
 const L=TPL.filter(t=>t.on!==false&&(a.k==='전체'||t.t===a.k)&&(!q||t.n.toLowerCase().includes(q)||t.id.toLowerCase().includes(q)));
 $('#tmCnt').textContent=`${L.length}건`;
 $('#tmRows').innerHTML=L.map(t=>{ const done=used.has(t.id), on=TM.sel.has(t.id);
  return `<tr class="${done?'done':''} ${on?'on':''}" data-row="${t.id}"><td class="c"><input type="checkbox" data-tp="${t.id}" ${on||done?'checked':''} ${done?'disabled':''} aria-label="${esc(t.n)} 선택"></td><td>${t.id}</td><td class="nm">${esc(t.n)}${done?' <span class="chip">추가됨</span>':''}</td><td>${esc(t.t)}</td><td>${t.v}</td><td>${esc(String(t.upd||'').slice(0,10))}</td></tr>`; }).join('')
  ||'<tr class="empty-row"><td colspan="6">검색 결과가 없어요</td></tr>';
 const pick=L.filter(t=>!used.has(t.id)).map(t=>t.id), all=$('#tmAll');
 const sync=()=>{ const n=TM.sel.size, b=$('#mo'); b.disabled=!n; b.textContent=n?`추가하기 (${n})`:'추가하기';
  const k=pick.filter(id=>TM.sel.has(id)).length; all.disabled=!pick.length; all.checked=!!pick.length&&k===pick.length; all.indeterminate=k>0&&k<pick.length; };
 const toggle=(id,on)=>{ on?TM.sel.add(id):TM.sel.delete(id); const tr=$(`#tmRows [data-row="${id}"]`); tr.classList.toggle('on',on); tr.querySelector('input').checked=on; sync(); };
 all.onchange=()=>{ pick.forEach(id=>toggle(id,all.checked)); };
 $$('#tmRows [data-tp]').forEach(c=>c.addEventListener('change',()=>toggle(c.dataset.tp,c.checked)));
 $$('#tmRows tr[data-row]:not(.done)').forEach(tr=>tr.addEventListener('click',e=>{ if(e.target.closest('input')) return; const id=tr.dataset.row; toggle(id,!TM.sel.has(id)); }));
 sync();
}

// ---------- 미리보기: 고객 화면(모바일 상품 상세, product-create3과 같은 틀) ----------
// 상단 이미지 → 전시명·배지·노출 안내 → 탭(상품 주문/상품 정보) 순서. 미리보기 안에서 고르는 값은 저장되지 않는다.
const PH_IC={
 back:'<path d="m15 18-6-6 6-6"/>',
 share:'<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
 bag:'<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 device:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5v.01" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
 spark:'<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18 15l.7 1.8 1.8.7-1.8.7L18 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
};
const phIc=k=>svg(PH_IC[k]);
function pvOf(a){ let p=PV[a.id]; if(!p){ p=PV[a.id]={pick:[],opt:{},ps:{},q:{},more:{}};
  if(a.mode==='list'){ const r=rng(a), d=(a.def||[]).filter(id=>a.pos.includes(id)).slice(0,r.hi); p.pick=d.length?d:(r.lo>0?a.pos.slice(0,r.lo):[]); }
  if(a.mode==='opt') a.opts.filter(o=>o.name.trim()&&o.vals.length).forEach(o=>p.opt[o.name]=o.vals[0]); }
 p.pick=p.pick.filter(id=>a.pos.includes(id)); return p; }
// 복합형 제공 조건 반영: 기준 영역에서 지금 고른 상품에 따라 이 영역에 보일 PO. null이면 이 영역을 건너뛴다
// 기준 영역이 고정이면 조건이 성립하지 않으므로(검사에서 잡는다) 미리보기에서는 항상 제공처럼 보여 준다
function effPos(a){ const p=condParent(a); if(!p||!canBase(p)) return a.pos; const sel=activePOs(p);
 return a.cond==='only'&&!sel.some(id=>a.trig.includes(id))?null:a.pos; }
// 미리보기용 영역: 후보가 줄었으면 pos만 바꾼 사본(나머지는 원본을 따른다)
const pvArea=a=>{ const l=effPos(a); return !l?null:l===a.pos?a:Object.assign(Object.create(a),{pos:l}); };
function activePOs(a){ const l=effPos(a); if(!l) return []; const p=pvOf(a);
 if(a.mode==='fixed') return l.slice();
 if(a.mode==='list') return p.pick.filter(id=>l.includes(id));
 const os=a.opts.filter(o=>o.name.trim()&&o.vals.length); if(!os.length) return []; const id=a.map[os.map(o=>p.opt[o.name]).join('|')]; return id&&l.includes(id)?[id]:[]; }
function psPicks(a,poId,ps){ const p=pvOf(a); p.ps[poId]=p.ps[poId]||{}; if(!p.ps[poId][ps.id]) p.ps[poId][ps.id]=[]; return p.ps[poId][ps.id]; }
// 카드 안의 선택 PS: 후보가 많으면 카드 안에서 스크롤하지 않고 처음 PS_LIM개만 보인 뒤 더보기로 펼친다.
// 고른 후보는 접혀 있어도 보이고, 검색어가 있으면 맞는 후보를 모두 보인다.
const PS_LIM=8;
function psBlock(a,po){
 return selPS(po).map(ps=>{ const p=pvOf(a), picks=psPicks(a,po.id,ps), one=ps.max===1, full=picks.length>=ps.max, key=po.id+ps.id, q=(p.q[key]||'').trim().toLowerCase(), cut=ps.cands.length>PS_LIM, more=!!p.more[key];
  const lim=ci=>cut&&!more&&ci>=PS_LIM&&!picks.includes(ci), rest=ps.cands.filter((_,ci)=>lim(ci)).length;
  return `<div class="psb"><div class="psec"><b>${esc(ps.name)}</b><span>${one?'택1':`${picks.length}/${ps.max} 선택${ps.min&&ps.min!==ps.max?` · 최소 ${ps.min}개`:''}`}</span></div>
  ${cut?`<input type="text" class="pq" data-pq="${a.id}|${key}" value="${esc(p.q[key]||'')}" placeholder="${ps.cands.length}개 중 검색" aria-label="${esc(ps.name)} 검색">`:''}
  <div class="pvc">${ps.cands.map((c,ci)=>{ const on=picks.includes(ci), dis=!on&&full&&!one, hide=q?!c.n.toLowerCase().includes(q):lim(ci); return `<label class="pr ${dis?'bad':''}" data-cn="${esc(c.n)}" ${lim(ci)?'data-lim="1"':''} ${hide?'hidden':''}><input type="${one?'radio':'checkbox'}" name="r${a.id}${key}" data-ps="${a.id}|${po.id}|${ps.id}|${ci}" ${on?'checked':''} ${dis?'disabled':''}><span class="rl">${esc(c.n)}</span><span class="ra">${c.add?'+'+won(c.add):'무료'}</span></label>`; }).join('')}</div>
  ${cut&&(more||rest)?`<button type="button" class="pmore" data-pm="${a.id}|${key}" ${q?'hidden':''}>${more?'접기':`더보기 (${rest}) ›`}</button>`:''}
  ${picks.length<ps.min?`<div class="pnote">${ps.min-picks.length}개 더 골라야 해요</div>`:''}</div>`; }).join('');
}
function poPrice(a,po){ let s=po.base; selPS(po).forEach(ps=>psPicks(a,po.id,ps).forEach(ci=>s+=ps.cands[ci].add)); return s; }
const incTxt=po=>{ const r=po.dt.filter(p=>p.req); return r.length?`<div class="pd">포함: ${r.map(p=>esc(p.name)+(p.desc?` (${esc(p.desc)})`:'')).join(' · ')}</div>`:''; };
const pp=(a,po,on)=>`${ONCE.has(po.type)?'':'월 '}${won(on===false?po.base:poPrice(a,po))}`;
const pcInner=(a,po,on)=>`<div class="pt">${esc(po.name)}</div><div class="ps">${po.type}${hasSel(po)?' · 선택 항목 있음':''}</div><div class="pp">${pp(a,po,on)}</div>`;
function areaPv(a,i){
 const p=pvOf(a), r=rng(a), multi=E.areas.length>1;
 let h=a.name.trim()?`<div class="ph-h">${esc(a.name.trim())}</div>`:'';
 if(!a.pos.length) return h+'<div class="pvempty">상품을 구성하면 해당 영역에서 확인할 수 있습니다.</div>';
 if(a.mode==='fixed') return h+`<div class="pcs">${a.pos.map(id=>{ const po=poBy(id); return `<div class="pc fix"><span class="bdg">포함</span>${pcInner(a,po)}${incTxt(po)}${psBlock(a,po)}</div>`; }).join('')}</div>`;
 if(a.mode==='list'){ const one=r.hi===1, full=p.pick.length>=r.hi;
  h+=`<div class="pcs">${a.pos.map(id=>{ const po=poBy(id), on=p.pick.includes(id), dis=!on&&full&&!one; return `<div class="pc ${on?'on':''} ${dis?'dis':''}" data-lp="${a.id}|${id}" role="${one?'radio':'checkbox'}" aria-checked="${on}" tabindex="0">${pcInner(a,po,on)}${on?incTxt(po)+psBlock(a,po):(hasSel(po)?'<div class="phint">고르면 선택 항목이 열려요</div>':'')}</div>`; }).join('')}`;
  if(!r.lo) h+=`<label class="pr none"><input type="radio" data-none="${a.id}" ${p.pick.length?'':'checked'}><span class="rl">선택 안 함</span></label>`;
  h+='</div>';
  if(p.pick.length<r.lo) h+=`<div class="pvempty sm">${r.lo-p.pick.length}개 더 골라야 다음으로 넘어가요</div>`;
  return h; }
 const os=a.opts.filter(o=>o.name.trim()&&o.vals.length);
 if(!os.length) return h+'<div class="pvempty">옵션을 만들면 여기에 보인다</div>';
 const cur=os.map(o=>p.opt[o.name]);
 // 이 옵션 값을 고르면 매핑되는 PO (다른 옵션은 지금 고른 값 유지)
 const poFor=(oi,v)=>{ const id=a.map[os.map((o,j)=>j===oi?v:cur[j]).join('|')]; return id&&a.pos.includes(id)?poBy(id):null; };
 const gbOf=v=>{ const m=String(v).match(/^(\d+)\s*(GB|G|TB|T)$/i); return m?+m[1]*(/^t/i.test(m[2])?1024:1):0; };
 [...os.keys()].sort((x,y)=>(os[y].disp==='chip')-(os[x].disp==='chip')).forEach((oi,n)=>{ const o=os[oi], v0=cur[oi];
  if(n) h+='</div><div class="ph-gap"></div><div class="ph-sec">';
  if(o.disp==='chip') h+=`<div class="ph-h">원하는 ${esc(eul(o.name))} 골라 주세요</div><div class="ph-sw">${o.vals.map(v=>`<button type="button" title="${esc(v)}" aria-label="${esc(v)}" aria-pressed="${v===v0}" data-ov="${a.id}|${esc(o.name)}|${esc(v)}" class="${v===v0?'on':''}"><span style="background:${oHex(o,v)}"></span></button>`).join('')}</div>`;
  else if(o.disp==='img') h+=`<div class="ph-h">원하는 ${esc(eul(o.name))} 골라 주세요</div><div class="ph-imgs">${o.vals.map(v=>`<button type="button" aria-pressed="${v===v0}" data-ov="${a.id}|${esc(o.name)}|${esc(v)}" class="${v===v0?'on':''}"><span class="ph-imgt">${oImg(o,v)?`<img src="${oImg(o,v).u}" alt="">`:svg(IC.image)}</span><small>${esc(v)}</small></button>`).join('')}</div>`;
  else h+=`<div class="ph-h">${o.name==='용량'?'필요한 용량을 선택해 주세요':`${esc(eul(o.name))} 선택해 주세요`}</div>${o.vals.map(v=>{ const po=poFor(oi,v), out=po&&po.sale!=='판매중', gb=gbOf(v);
   return `<button type="button" class="ph-opt ${v===v0?'on':''} ${out?'out':''}" data-ov="${a.id}|${esc(o.name)}|${esc(v)}"><span class="ph-optt"><b>${esc(v)}</b>${out?'<em>일시품절</em>':''}</span><span class="ph-price">${po?po.base.toLocaleString()+' 원':'준비 중'}</span>${gb?`<small>사진 약 ${(gb*200).toLocaleString()}장을 저장할 수 있어요</small>`:''}</button>`; }).join('')}`; });
 const ap=activePOs(a);
 if(!ap.length) h+='<div class="pvempty">이 조합은 준비 중이에요 (매핑 필요)</div>';
 else if(hasSel(poBy(ap[0]))){ const po=poBy(ap[0]); h+=`<div class="pcs"><div class="pc on fix">${pcInner(a,po)}${incTxt(po)}${psBlock(a,po)}</div></div>`; }
 return h;
}
// 추천 조합 카드: 지금 고른 기기 옵션·가입 옵션·혜택 옵션을 요약한다
function comboPv(){
 const rows={};
 E.areas.forEach(a=>{ const ap=activePOs(a); if(!ap.length) return;
  const t=poBy(ap[0]).type, lb=t==='기기서비스'?'기기 옵션':t==='요금제'?'가입 옵션':'혜택 옵션';
  const one=id=>{ const po=poBy(id), ps=selPS(po).flatMap(x=>psPicks(a,id,x).map(ci=>x.cands[ci].n)); return po.name+(ps.length?` (${ps.join(', ')})`:''); };
  // 고정형은 연결 상품이 여러 개면 'OO 외 N개'로 줄인다
  const vals=a.mode==='opt'?[a.opts.filter(o=>o.name.trim()&&o.vals.length).map(o=>pvOf(a).opt[o.name]).join(' / ')]
   :a.mode==='fixed'&&ap.length>1?[`${one(ap[0])} 외 ${ap.length-1}개`]:ap.map(one);
  (rows[lb]=rows[lb]||[]).push(...vals); });
 const ks=['기기 옵션','가입 옵션','혜택 옵션'].filter(k=>rows[k]);
 if(!ks.length) return '';
 return `<div class="ph-sec"><div class="ph-ai"><b>${phIc('spark')}AI 분석 사유</b><p>고객님의 이용 패턴과 가입 조건에 가장 잘 어울리는 조합이에요. 같은 조건의 다른 조합보다 혜택이 커요.</p></div>
 <div class="ph-combo">${ks.map(k=>`<div class="ph-cr"><span>${k}</span><span>${rows[k].map(esc).join('<br>')}</span></div>`).join('')}<button type="button" class="ph-cta" data-combo>이 옵션으로 바로 선택하기</button></div></div><div class="ph-gap"></div>`;
}
// 지금 고른 상품 기준 금액: 기기·액세서리(일시불) / 월 요금, 남은 필수 선택 수
function pvTotals(){ let mon=0, once=0, left=0;
 E.areas.forEach(a=>{ if(!effPos(a)) return; activePOs(a).forEach(id=>{ const po=poBy(id), v=poPrice(a,po); ONCE.has(po.type)?once+=v:mon+=v; selPS(po).forEach(ps=>{ const n=psPicks(a,id,ps).length; if(n<ps.min) left+=ps.min-n; }); }); const r=rng(a); if(r&&pvOf(a).pick.length<r.lo) left+=r.lo-pvOf(a).pick.length; });
 return {mon,once,left}; }
// 스크롤해도 화면 아래에 떠 있는 금액 알약(누르면 금액 내역) + 내용 맨 끝의 고객 선택 안내·상품 주문하기 (스크롤 고정 아님)
let PVPILL=false;
function buyPv(){
 const {mon,once,left}=pvTotals();
 const opt=E.areas.find(a=>a.mode==='opt'&&activePOs(a).length), chip=opt&&opt.opts.find(o=>o.disp==='chip'&&o.vals.length), pick=chip&&pvOf(opt).opt[chip.name];
 const insight=pick?`40대 남성 고객님의 45%가 ${esc(eul(pick))} 선택했어요`:'40대 남성 고객님의 45%가 이 조합을 선택했어요';
 const tb=`<button type="button" class="ph-tbtn" data-tbtn aria-label="T 상담">${svg('<path d="M5 6h11M10.5 6v13"/><path d="M17 15v6M14 18h6"/>')}</button>`;
 const pill=once||mon?`<div class="ph-float"><div class="ph-pill-wrap">${PVPILL?`<div class="ph-pop" role="dialog" aria-label="예상 금액">${once?`<div><span>기기</span><b>${won(once)}</b></div>`:''}${mon?`<div><span>월 요금</span><b>${won(mon)}</b></div>`:''}${E.deduct?'<div class="ph-ded"><span>공제항목 반영</span><small>할인을 뺀 납부 예정 금액 · 계산 방식 협의 중</small></div>':''}</div>`:''}<button type="button" class="ph-pill" data-pill aria-expanded="${PVPILL}">${once?`기기 <b>${once.toLocaleString()}</b> 원`:`월 <b>${mon.toLocaleString()}</b> 원`}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button></div></div>`:'';
 // 주문 받기 OFF: 대체 버튼(버튼 없음이면 비활성)
 if(!E.orderOn){ const o=E.off; return `${pill}<div class="ph-buy"><div class="ph-buy-row">${tb}<button type="button" class="ph-cta" data-cta data-pa="cta" ${o.act==='none'?'disabled':''}>${o.act==='none'?'버튼 없음':esc(offBtn(o))}</button></div></div>`; }
 return `${pill}<div class="ph-buy"><p class="ph-insight">${insight}</p><div class="ph-buy-row">${tb}<button type="button" class="ph-cta" data-cta ${left?'disabled':''}>${left?`선택이 ${left}개 남았어요`:'상품 주문하기'}</button></div></div>`;
}
// 상품 정보·구매 후기 탭에도 금액 알약·고객 선택 안내·상품 주문하기를 둔다 (상품 주문 탭과 같은 조건: PO 전시 + 구성 영역 있음)
const tabBuyPv=()=>E.kind!=='ps'&&E.areas.length?buyPv():'';
// data-pa: 입력 섹션과 미리보기 위치를 잇는 앵커 (pvFocus 참고)
function orderPv(){
 if(E.kind==='ps'){
  if(!E.conn.length) return '<div class="ph-sec"><div class="pvempty">PS를 연결하면 여기에 보인다</div></div>';
  return `<div class="ph-sec"><div class="ph-h">이 상품에 포함된 혜택<small>소개용 전시 · 금액과 주문 버튼이 없어요</small></div><div class="pcs">${E.conn.map(k=>{ const s=psBy(k); return `<div class="pc fix"><span class="bdg">${s.kind}</span><div class="pt">${esc(s.name)}</div><div class="ps">${esc(s.po.name)}에 포함된 서비스</div><div class="pd" style="margin-top:6px">${esc(s.desc||'')}</div></div>`; }).join('')}</div><button type="button" class="ph-cta" data-cta>${esc(psBy(E.conn[0]).po.name)} 가입하러 가기 ›</button></div><div class="ph-gap"></div>${simPv()}`;
 }
 if(!E.areas.length) return '<div class="ph-sec"><div class="pvempty">구성 영역을 만들면 여기에 보인다</div></div>';
 // 제공 조건으로 건너뛰는 영역은 그리지 않는다
 let pv=comboPv()+E.areas.map((a,i)=>{ const v=pvArea(a); return v?`<div class="ph-sec" data-pa="area-${a.id}">${areaPv(v,i)}</div>`:''; }).filter(Boolean).join('<div class="ph-gap"></div>');
 // 주문을 받으면 고객 선택 영역 아래에 주문 단계를 보여 준다.
 // v0.2.4: 주문 프로세스를 연결했으면 보고 있는 컨테이너의 코너를 그대로 그린다(ctnPv). 이전 구성안은 주문서 영역 자리만
 const pt=ptOf(E), pl=E.orderPlan;
 if(E.orderOn&&isProcPlan(pl)) pv+=ctnPv(pl);
 else if(E.orderOn&&pt) pv+=`<div class="ph-gap"></div><div class="ph-sec" data-pa="flow"><div class="ph-h">주문서</div><div class="ph-order"><b>주문서 영역</b><span>${esc(pt.ord)}${pl?' · '+esc(pl.name):''}</span></div></div>`;
 return pv+giftPv()+tdPv()+simPv()+buyPv();
}
// v0.3.2 미리보기: T기프트(단말기 연결 시) · 티다팩(요금제 연결 시). 미리보기 채널에서 N이면 뺀다
function giftPv(){ if(!hasDev(E)||svcOff('gift')||E.giftOn===false) return ''; const v=visibleGifts(E);
 return `<div class="ph-gap"></div><div class="ph-sec" data-pa="gift"><div class="ph-h">함께 드리는 T기프트<small>개통 조건을 꼭 확인하세요</small></div>${v.length?v.map(x=>{ const g=GM(x.id); return `<div class="ph-gift"><span aria-hidden="true">${g.ic}</span><div><b>${esc(g.n)}</b><small>${g.mode} · ${esc(g.ship)}</small></div></div>`; }).join(''):'<div class="pvempty sm">노출 중인 T기프트가 있으면 여기에 보인다</div>'}</div>`; }
function tdPv(){ if(!hasPlan(E)||svcOff('td')) return ''; const v=visibleTd(E), first=v.slice(0,TD_TOP);
 return `<div class="ph-gap"></div><div class="ph-sec" data-pa="td"><div class="ph-h">티다팩 혜택을 골라 주세요<small>12개월 약정 시 1년간 매월 받아요</small></div>${v.length?`${first.map(x=>{ const t=TDM(x.id); return `<div class="ph-td"><span class="tlogo" style="background:${t.lc}" aria-hidden="true">${esc(t.logo)}</span><div>${t.tag?`<em>${t.tag}</em>`:''}<b>${esc(t.brand)}</b><small>${esc(t.benefit)}</small></div></div>`; }).join('')}${v.length>TD_TOP?`<div class="ph-more">전체보기 · ${v.length}개 ›</div>`:''}<div class="ph-td none">티다팩 없이 주문 진행</div>`:'<div class="pvempty sm">노출 중인 티다팩이 있으면 여기에 보인다</div>'}</div>`; }
// ---------- 미리보기: 주문 프로세스 컨테이너 · 코너 ----------
// 컨테이너 하나씩 본다(PVC). 머리에 컨테이너 이동(‹ ›)과 진행 막대, 아래로 코너를 순서대로 그린다.
// 코너 문구 · 선택지 설명 · 가격 · 배지 · 모양(ui)은 코너 관리 기준값(order-corner-v22-data.ts), 노출 순서 · 노출 여부 · 문구는 이 전시에서 바꾼 값을 쓴다
let PVC=0;
function cornerPv(c){
 const m=cornerMeta(c.id), v=ovGet(c.id), tOn=ovTxt(v), ui=m.ui||'list';
 const title=(tOn&&v.q)||m.q||c.n, sub=(tOn&&v.sub)||m.sub||'';
 const meta=n=>(m.opts||[]).find(x=>x.n===n)||{};
 // 선택지가 있는 코너는 프로세스 선택지(이 전시 순서 · 노출 반영), 요약 · 입력 · 약관처럼 선택지가 없는 코너는 코너 관리 기준값
 // v0.3.1: 채널 관리 항목 코너(가입 · 할부 · 배송 유형)는 연결 상품이 가진 값 중 이 상품에서 노출하는 값만 보인다
 const cg=chUnion().find(g=>g.corner===c.id&&g.vals.length), chOk=n=>!cg||cg.vals.includes(n)&&!chHidden(cg.k,n);
 const L=c.o.length?optOrd(c).filter(j=>!optOff(c,j)&&chOk(c.o[j])).map(j=>({n:c.o[j],...meta(c.o[j]),n2:c.o[j]})):(m.opts||[]);
 const lim=m.more&&L.length>m.more?m.more:L.length, shown=L.slice(0,lim);
 const op=x=>`<div class="ph-op ${x.x==='none'?'ph-none':''}"><span class="ph-opr"><b>${esc(x.n2||x.n)}</b>${x.b?`<em class="ph-bg">${esc(x.b)}</em>`:''}${x.p?`<span class="ph-pr">${esc(x.p)}</span>`:''}</span>${x.d?`<small>${esc(x.d)}</small>`:''}</div>`;
 let body;
 if(!L.length) body='<div class="pvempty sm">노출할 선택지가 없어요</div>';
 else if(ui==='chip') body=`<div class="ph-chips">${shown.map(x=>`<span>${esc(x.n2||x.n)}</span>`).join('')}</div>`;
 else if(ui==='sum'||ui==='form') body=`<div class="ph-combo">${shown.map(x=>`<div class="ph-cr"><span>${esc(x.n)}</span><span>${esc(x.d||x.p||'')}</span></div>`).join('')}</div>`;
 else if(ui==='terms') body=`<div class="ph-terms">${shown.map(x=>`<label><input type="checkbox" disabled>${esc(x.n)}</label>`).join('')}</div>`;
 else if(ui==='done') body=`<div class="ph-ops">${shown.map(x=>`<button type="button" class="ph-cta" disabled>${esc(x.n)}</button>`).join('')}</div>`;
 else body=`<div class="ph-ops">${shown.map(op).join('')}</div>`;
 return `<div class="ph-sec" data-pa="cn-${c.id}"><div class="ph-h">${esc(title)}${sub?`<small>${esc(sub)}</small>`:''}</div>${body}${L.length>lim?`<div class="ph-more">더보기 · ${L.length-lim}개 ›</div>`:''}${m.moreBtn?`<div class="ph-more">${esc(m.moreBtn)} ›</div>`:''}</div>`;
}
// 주문 진행 막대(컨테이너 수만큼)는 미리보기 화면 맨 위에 둔다. 주문을 받고 주문 프로세스를 연결했을 때만 보인다.
// 컨테이너 이동은 [상품 주문하기] · [다음]과 왼쪽 컨테이너 · 코너 선택으로 한다
function ctnNavPv(){
 const pl=E.orderPlan; if(E.kind==='ps'||!E.orderOn||!isProcPlan(pl)) return '';
 const n=pl.stages.length; PVC=Math.max(0,Math.min(PVC,n-1));
 return `<div class="ph-cbar"><div class="ph-prog" role="progressbar" aria-label="주문 단계" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${PVC+1}">${pl.stages.map((_,i)=>`<i class="${i<=PVC?'on':''}"></i>`).join('')}</div></div>`;
}
function ctnPv(pl){
 const n=pl.stages.length; PVC=Math.max(0,Math.min(PVC,n-1)); const st=pl.stages[PVC];
 return `<i class="ph-tabmark" data-pa="flow" aria-hidden="true"></i>${st.corners.map(c=>'<div class="ph-gap"></div>'+cornerPv(c)).join('')||'<div class="ph-sec"><div class="pvempty sm">이 컨테이너에는 코너가 없어요</div></div>'}`;
}
// 미리보기 캐러셀: 마우스로 끌어 넘기고, 놓으면 가까운 카드에 맞춘다(scroll-snap). 점은 지금 보이는 첫 카드
function bindCarousels(box){
 box.querySelectorAll('[data-car]').forEach(c=>{ const t=c.querySelector('.ph-cart'), dots=[...c.querySelectorAll('.ph-dots2 i')];
  const sync=()=>{ const w=t.firstElementChild?t.firstElementChild.offsetWidth+10:1, i=Math.min(dots.length-1,Math.round(t.scrollLeft/w)); dots.forEach((d,k)=>d.classList.toggle('on',k===i)); };
  t.addEventListener('scroll',sync,{passive:true});
  let x0=0, s0=0, drag=false;
  t.addEventListener('pointerdown',e=>{ if(e.pointerType!=='mouse') return; drag=true; x0=e.clientX; s0=t.scrollLeft; t.classList.add('drag'); t.setPointerCapture(e.pointerId); });
  t.addEventListener('pointermove',e=>{ if(drag) t.scrollLeft=s0-(e.clientX-x0); });
  const end=()=>{ if(!drag) return; drag=false; t.classList.remove('drag'); };
  t.addEventListener('pointerup',end); t.addEventListener('pointercancel',end);
 });
}
function simPv(){ if(!E.sim.on) return ''; const t=simText(E);
 return `<div class="ph-gap"></div><div class="ph-sec" data-pa="sim"><div class="ph-h">${esc(t.t)||'타이틀을 입력하세요'}</div>${(()=>{ const L=relIds().slice(0,6).map(poBy); // 캐러셀: 가로로 넘기는 카드(한 화면에 2장 남짓) + 아래 점. 끌거나 가로 스크롤로 넘긴다
 return L.length?`<div class="ph-car" data-car><div class="ph-sim ph-cart">${L.map(p=>`<div><span class="ph-simi">${relImg(p)}</span><b>${esc(p.name)}</b><em>${priceTxt(p)}</em><small>${esc(relOpt(p))}</small></div>`).join('')}</div>${L.length>2?`<div class="ph-dots2">${L.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>`:'<div class="ph-sim"><div><i></i><b>비슷한 상품</b></div><div><i></i><b>비슷한 상품</b></div></div>'; })()}</div>`; }
const reviewPv=()=>`<div class="ph-sec" data-pa="review"><div class="ph-rv"><b>★ 4.8</b><span>구매 후기 1,204개 · 리뷰 시스템 기준</span></div>${['배송이 빨라요. 색상이 사진과 같아요','개통까지 안내가 친절했어요'].map(x=>`<div class="ph-rvi"><span>★★★★★</span><p>${x}</p></div>`).join('')}</div>`;
// 전문가 리뷰 탭(예시 문구)
const expertPv=()=>`<div class="ph-sec" data-pa="expert"><div class="ph-rv"><b>전문가 리뷰</b><span>2건 · 예시</span></div>${[['IT 칼럼니스트','가볍고 화면이 밝아 야외에서도 잘 보여요'],['모바일 리뷰어','배터리 지속 시간이 전작보다 길어졌어요']].map(([w,x])=>`<div class="ph-rvi"><span>${w}</span><p>${x}</p></div>`).join('')}</div>`;
// 상품 정보 탭: 펼친 콘텐츠 정보는 다시 그려도 펼친 채로 둔다
const PVX=new Set();
function infoPv(){
 const xs=E.extras.filter(x=>x.show&&!x.fresh&&(x.mode==='link'||x.txt.trim()));
 const dOn=descFilled(E), nOn=!!htmlText(E.descNote)||htmlHasImg(E.descNote);
 if(!dOn&&!nOn&&!xs.length) return '<div class="ph-sec"><div class="pvempty">상세 설명이나 콘텐츠 정보를 입력하면 여기에 보인다</div></div>';
 return `${dOn?(E.descMode==='image'?`<div class="pv-detail" data-pa="desc">${E.descImgs.map((x,i)=>x.u?`<img src="${x.u}" alt="상세 이미지 ${i+1}">`:`<div class="ph-noimg pv-ph">${phIc('device')}<small>${esc(x.n)}</small></div>`).join('')}</div>`:`<div class="ph-sec" data-pa="desc"><div class="ph-rich">${sanitize(E.descHtml)}</div></div>`):''}${nOn?`${dOn?'<div class="ph-gap"></div>':''}<div class="ph-sec" data-pa="note"><div class="ph-rich ph-note-rich">${sanitize(E.descNote)}</div></div>`:''}${xGroups(xs).map(([g,list])=>`${g?`<div class="ph-xh">${esc(g)}</div>`:''}${list.map(x=>`<details class="ph-acc" data-pa="x-${x.id}" ${PVX.has(x.id)?'open':''}><summary>${esc(x.t)||'제목 없음'}</summary><div>${x.mode==='direct'?`<div class="ph-rich">${sanitize(x.txt)}</div>`:esc(x.mode==='link'?tplBy(x.src).body:x.txt)}</div></details>`).join('')}`).join('')}`;
}
// 상품유형이 여러 개면 공통 → 유형 순서로 묶는다(묶음 안 순서는 콘텐츠 정보 목록 순서). 한 유형이면 묶지 않는다
function xGroups(xs){ const ts=ctnTypes(); if(ts.length<2) return [['',xs]];
 return [['공통',xs.filter(x=>xGroup(x)==='공통')],...ts.map(g=>[`${tyShort(g)} 안내`,xs.filter(x=>xGroup(x)===g)])].filter(([,l])=>l.length).map(([g,l])=>[g==='공통'?'공통 안내':g,l]); }
const pvScroller=()=>$('#pv .ph-scroll');
// 탭을 바꾸면 새 탭의 처음(탭 바로 아래)으로 올린다. 이미 그보다 위에 있으면 그대로 둔다
function pvToTabs(){ const sc=pvScroller(), m=sc&&sc.querySelector('.ph-tabmark'); if(m&&sc.scrollTop>m.offsetTop) sc.scrollTop=m.offsetTop; }
// ---------- 미리보기 컨테이너 전환 (order5-create.html과 같은 방식) ----------
// 컨테이너 1개 = 미리보기 화면 1개. 첫 컨테이너는 상품 상세 화면(상품 주문 탭 안에 코너), 두 번째부터는 그 컨테이너의 주문 화면(코너 + 다음 / 주문 완료).
// 컨테이너를 바꾸면 화면 전체가 넘어간다: 뒤 컨테이너로 가면 오른쪽 → 왼쪽, 앞으로 돌아가면 왼쪽 → 오른쪽. 직전 화면은 복사본을 위에 얹어 함께 밀어 낸다
let pvLastC=null;
const pvMulti=()=>E.kind!=='ps'&&E.orderOn&&isProcPlan(E.orderPlan);
function pvSnap(box,st){
 box.querySelectorAll('.pv-ghost').forEach(x=>x.remove());
 const g=document.createElement('div'); g.className='pv-ghost'; g.setAttribute('aria-hidden','true');
 [...box.children].forEach(n=>{ const c=n.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id')); g.appendChild(c); });
 g._st=st; return g;
}
function pvSlide(box,ghost,fwd){
 const D=340, EZ='cubic-bezier(.4,0,.2,1)', inX=fwd?'100%':'-100%', outX=fwd?'-100%':'100%';
 [...box.children].forEach(n=>{ if(n._sl) n._sl.cancel(); n._sl=n.animate([{transform:`translateX(${inX})`},{transform:'none'}],{duration:D,easing:EZ}); });
 box.appendChild(ghost); const gs=ghost.querySelector('.ph-scroll'); if(gs) gs.scrollTop=ghost._st;
 const o=ghost.animate([{transform:'none'},{transform:`translateX(${outX})`}],{duration:D,easing:EZ,fill:'forwards'});
 o.onfinish=o.oncancel=()=>ghost.remove();
}
// 두 번째 컨테이너부터: 컨테이너 이동 막대 · 상단 바 · 코너 · 다음(마지막은 주문 완료)
function stepScreenPv(){
 const pl=E.orderPlan, st=pl.stages[PVC], last=PVC===pl.stages.length-1;
 return `${ctnNavPv()}<div class="ph-top">${phIc('back')}<span>${phIc('share')}${phIc('menu')}</span></div>
 <div class="ph-scroll">${st.corners.map(c=>cornerPv(c)).join('<div class="ph-gap"></div>')||'<div class="ph-sec"><div class="pvempty sm">이 컨테이너에는 코너가 없어요</div></div>'}
 <div class="ph-buy"><div class="ph-buy-row"><button type="button" class="ph-cta" data-next>${last?'주문 완료':'다음'}</button></div></div></div>`;
}
// v0.3.2 MP 상품 전시 미리보기: 기존 프레임 안의 화면만 MP 상세로 바꾼다. 상품 이미지 · 색상 · 용량 · 정가 · 판매가는 없다
//  타이틀(전시명) → 부제(설명) → 제공 혜택(연결한 MP의 EPC 상품 속성, 자동) → 주문 코너 카드(연결한 프로세스) → 콘텐츠 정보 아코디언 → 하단 바(월 999,999원 시연값 + 상품 가입하기)
//  TP-ORD-101: 결합 유형에서 '가족 결합'을 고르면 가족 정보 등록 · 가족 회선 선택 코너가 나온다. 미리보기에서 고른 값은 PVMP에 둔다
let PVMP=null;
const mpPvDef=()=>({type:'가족 결합',lines:['휴대폰'],flines:['휴대폰'],disc:'다 같이 나누어 할인',term:'24개월',doc:'공공 마이데이터로 바로 확인',army:'밀리패스로 인증하기'});
const MP_LINES=[['휴대폰','010-20**-04**','T+B'],['인터넷','보유 회선',''],['IPTV','보유 회선','']];
const MP_FLINES=[['휴대폰','010-30**-12**',''],['인터넷','보유 회선','']];
const mpOpt=(k,v,on,sub,badge)=>`<button type="button" class="mpo ${on?'on':''}" data-mpo="${k}|${esc(v)}"><span><b>${esc(v)}${badge?`<em>${esc(badge)}</em>`:''}</b>${sub?`<small>${esc(sub)}</small>`:''}</span><i class="ck" aria-hidden="true"></i></button>`;
const mpCard=(t,body)=>`<div class="ph-gap"></div><div class="ph-sec"><div class="ph-h">${t}</div>${body}</div>`;
function mpCorners(flow){
 const P=PVMP, one=(k,list)=>list.map(([v,sub,b])=>mpOpt(k,v,P[k]===v,sub,b)).join('');
 const multi=(k,list)=>list.map(([v,sub,b])=>mpOpt(k,v,P[k].includes(v),sub,b)).join('');
 const lines=mpCard('결합할 회선을 선택해 주세요',multi('lines',MP_LINES));
 const term=mpCard('약정 기간을 선택해 주세요',one('term',[['12개월'],['24개월'],['12+12개월']]));
 if(flow==='welfare') return mpCard('서류 제출 방식을 선택해 주세요',one('doc',[['공공 마이데이터로 바로 확인','','추천'],['전자증명서 발급 받기'],['발급 받은 서류 직접 제출하기']]))+lines+term;
 if(flow==='army') return mpCard('입영 일자를 등록해 주세요',one('army',[['밀리패스로 인증하기'],['서류 파일로 첨부하기']]))+lines+term;
 const fam=P.type==='가족 결합';
 return mpCard('결합 유형을 선택해 주세요',one('type',[['나 혼자 결합','내 회선끼리 결합해요'],['가족 결합','가족 회선과 함께 결합해요']]))+lines
  +(fam?mpCard('결합할 가족 정보를 등록해 주세요','<div class="mp-empty">등록된 정보가 없습니다</div><button type="button" class="mp-btn" data-mpfam>가족 동의 요청하기</button>')
   +mpCard('결합할 가족 회선을 선택해 주세요',`<div class="mp-fam"><b>김가족</b><em>배우자</em></div>${multi('flines',MP_FLINES)}`):'')
  +mpCard('휴대폰 요금 할인 방식을 선택해 주세요',one('disc',[['다 같이 나누어 할인','결합한 회선 모두 나누어 할인'],['한 명에게 집중 할인','대표 회선 1개에 할인을 모아요']]))+term;
}
function mpPagePv(stop){
 if(!PVMP) PVMP=mpPvDef();
 const pl=isMpPlan(E.orderPlan)?E.orderPlan:null, m=mpDemo(E.mp), B=m?m.bnf:[];
 const xs=E.extras.filter(x=>x.show&&!x.fresh&&(x.mode==='link'||x.txt.trim()));
 const benefit=`<div class="ph-sec" data-pa="benefit"><div class="ph-h">제공 혜택</div>${B.length?`<div class="mp-bnf">${B.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'<div class="pvempty sm">MP를 연결하면 EPC 상품 속성의 혜택이 여기에 보인다</div>'}</div>`;
 const order=`<i class="ph-tabmark" data-pa="flow" aria-hidden="true"></i>`+(pl?mpCorners(pl.flow):'<div class="ph-gap"></div><div class="ph-sec"><div class="mp-noplan">주문 프로세스를 연결하면 주문 단계가 표시됩니다</div></div>');
 const acc=xs.length?`<div class="ph-gap"></div>${xs.map(x=>`<details class="ph-acc" data-pa="x-${x.id}" ${PVX.has(x.id)?'open':''}><summary>${esc(x.t)||'제목 없음'}</summary><div>${x.mode==='direct'?`<div class="ph-rich">${sanitize(x.txt)}</div>`:esc(x.mode==='link'?tplBy(x.src).body:x.txt)}</div></details>`).join('')}`:'';
 const G=E.mpGuide||{}, guide=MP_GUIDE.filter(([k])=>G[k]!==false).map(([k,,title,lines,steps,btns])=>`<div class="ph-gap"></div><div class="ph-sec mp-gd" data-pa="${k}"><div class="ph-h">${esc(title)}</div>${lines?lines.map(x=>`<p>${esc(x)}</p>`).join(''):''}${steps?`<ol>${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}<div class="mp-gdbtns">${btns.map(b=>`<span>${esc(b)}</span>`).join('')}</div></div>`).join('');
 return `<div class="ph-top">${phIc('back')}<span>${phIc('share')}${phIc('menu')}</span></div>
 <div class="ph-scroll">${stop}
 <div class="ph-info" data-pa="top"><div class="ph-title${E.name.trim()?'':' ph-empty'}">${E.name.trim()?nameHtml(E.name.trim()):'전시명을 입력하세요'}</div>${E.brief.trim()?`<div class="ph-brief">${esc(E.brief.trim())}</div>`:''}</div>
 <div class="ph-gap"></div><i class="ph-tabmark" data-pa="tabs" aria-hidden="true"></i>
 ${benefit}${order}${guide}${acc}${simPv()}
 ${mpBuyPv()}
 </div>`;
}
// 하단: PO 전시와 같은 떠 있는 금액 알약(누르면 금액 내역) + T 상담 · 상품 가입하기. 금액은 시연값
const MP_PRICE=999999;
function mpBuyPv(){
 const tb=`<button type="button" class="ph-tbtn" data-tbtn aria-label="T 상담">${svg('<path d="M5 6h11M10.5 6v13"/><path d="M17 15v6M14 18h6"/>')}</button>`;
 const pill=`<div class="ph-float"><div class="ph-pill-wrap">${PVPILL?`<div class="ph-pop" role="dialog" aria-label="예상 금액"><div><span>월 요금</span><b>${won(MP_PRICE)}</b></div></div>`:''}<button type="button" class="ph-pill" data-pill aria-expanded="${PVPILL}">월 <b>${MP_PRICE.toLocaleString()}</b> 원<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button></div></div>`;
 return `${pill}<div class="ph-buy"><div class="ph-buy-row">${tb}<button type="button" class="ph-cta" data-cta>상품 가입하기</button></div></div>`;
}
const pvGo=i=>{ const n=E.orderPlan.stages.length; if(i<0||i>=n) return; PVC=i; renderPreview(); };
function renderPreview(){
 const box=$('#pv'); if(!E) return;
 const old=pvScroller(), st0=old?old.scrollTop:0;
 if(!pvMulti()) PVC=0;
 const changed=pvLastC!=null&&PVC!==pvLastC, fwd=PVC>pvLastC;
 const ghost=changed&&box.children.length&&!RM&&box.animate?pvSnap(box,st0):null;
 pvLastC=PVC;
 // 다른 컨테이너로 넘어가면 새 화면은 맨 위부터 보인다
 const st=changed?0:st0;
 if(pvMulti()&&PVC>0){
  box.innerHTML=stepScreenPv(); pvScroller().scrollTop=st;
  box.querySelector('[data-next]').addEventListener('click',()=>{ if(PVC<E.orderPlan.stages.length-1) pvGo(PVC+1); else toast('주문 완료 (예시)'); });
  if(ghost) pvSlide(box,ghost,fwd);
  return;
 }
 const imgs=noImg(E)?[]:[E.main,...E.subs].filter(Boolean), top=imgs[0];
 if(PVTAB==='review'&&!E.review) PVTAB='order';
 if(PVTAB==='expert'&&!E.expert) PVTAB='order';
 const tabs=[['order','상품 주문'],['info','상품 정보'],['review','구매 후기'],['expert','전문가 리뷰']].filter(([k])=>(k!=='review'||E.review)&&(k!=='expert'||E.expert));
 const BD=[...autoBadges(E),...E.badges];
 const P=connPOs(E), optVals=new Set(E.areas.flatMap(a=>a.opts.flatMap(o=>o.vals)));
 // 모델 줄은 첫 연결 상품 코드, 제품명은 첫 연결 상품 이름에서 옵션 값(용량·색상 등)을 뺀 것
 const model=P[0]?P[0].id:'모델 코드';
 const sub=P[0]?P[0].name.split(' ').filter(t=>!optVals.has(t)).join(' '):'';
 // 가입 조건 안내 (샘플 문구)
 const JOIN_NOTE='만 18세 이상 만 34세 미만의 고객님만 가입할 수 있는 상품이에요';
 const end=endAt(E), stop=end?`<div class="ph-stop">${svg(PH_IC.info)}<div><b>상품 가입 중단 안내</b><p>해당 상품은 ${+end.slice(5,7)}월 ${+end.slice(8,10)}일 이후 신규 가입 중단될 예정입니다.</p></div></div>`:'';
 box.innerHTML=E.kind==='mp'?mpPagePv(stop):`${ctnNavPv()}<div class="ph-top">${phIc('back')}<span>${phIc('share')}${phIc('menu')}</span></div>
 <div class="ph-scroll">
 ${stop}
 ${noImg(E)?'':`<div class="ph-hero${top&&top.u?' has-img':''}">
  ${top&&top.u?`<img src="${top.u}" alt="${esc(top===E.main&&E.mainAlt.trim()?E.mainAlt.trim():'대표이미지')}">`:`<div class="ph-noimg">${phIc('device')}<small>${top?esc(top.n):'대표이미지 노출영역'}</small></div>`}
  ${imgs.length>1?`<div class="ph-dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>`}
 <div class="ph-info"><div class="ph-model">${esc(model)}</div>
  <div class="ph-title${E.name.trim()?'':' ph-empty'}">${E.name.trim()?nameHtml(E.name.trim()):'전시명을 입력하세요'}</div>
  ${E.brief.trim()?`<div class="ph-brief">${esc(E.brief.trim())}</div>`:''}
  <div class="ph-sub${sub?'':' ph-empty'}">${sub?esc(sub):'제품명'}</div>
  ${BD.length?`<div class="ph-bdgs">${BD.map((b,i)=>`<span class="${b.k?'au':i?'':'dk'}" ${b.k?`style="background:${b.c}"`:''}>${esc(b.t)}</span>`).join('')}</div>`:''}
  <div class="ph-note">${JOIN_NOTE}</div></div>
 <div class="ph-gap"></div>
 <i class="ph-tabmark" data-pa="tabs" aria-hidden="true"></i>
 <div class="ph-tabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" class="${PVTAB===k?'on':''}" aria-selected="${PVTAB===k}">${l}</button>`).join('')}</div>
 ${PVTAB==='info'?infoPv()+simPv()+tabBuyPv():PVTAB==='review'?reviewPv()+simPv()+tabBuyPv():PVTAB==='expert'?expertPv()+simPv()+tabBuyPv():orderPv()}
 </div>`;
 pvScroller().scrollTop=st;
 if(ghost) pvSlide(box,ghost,fwd);
 box.querySelectorAll('.ph-tabs button').forEach(b=>b.addEventListener('click',()=>{ if(PVTAB===b.dataset.tab) return; PVTAB=b.dataset.tab; renderPreview(); pvToTabs(); }));
 bindCarousels(box);
  // MP 미리보기: 코너 선택(회선은 여러 개, 나머지는 1개)
 box.querySelectorAll('[data-mpo]').forEach(b=>b.addEventListener('click',()=>{ const [k,v]=b.dataset.mpo.split('|'), P=PVMP;
  if(Array.isArray(P[k])){ P[k]=P[k].includes(v)?P[k].filter(x=>x!==v):[...P[k],v]; } else P[k]=v; renderPreview(); }));
 box.querySelectorAll('[data-mpfam]').forEach(b=>b.addEventListener('click',()=>toast('가족에게 동의 요청을 보냈어요 (예시)')));
 box.querySelectorAll('[data-pill]').forEach(b=>b.addEventListener('click',()=>{ PVPILL=!PVPILL; renderPreview(); }));
 box.querySelectorAll('[data-tbtn]').forEach(b=>b.addEventListener('click',()=>toast('T 상담 연결 (예시)')));
 box.querySelectorAll('[data-combo]').forEach(b=>b.addEventListener('click',()=>toast('이 조합으로 주문서에 담았어요 (예시)')));
 box.querySelectorAll('[data-cta]').forEach(b=>b.addEventListener('click',()=>toast(E.kind==='ps'?'PS가 속한 PO 전시로 이동 (예시)':!E.orderOn?`${offBtn(E.off)} (예시)`:'주문서로 이동 (예시)')));
 // 주문 프로세스를 연결했으면 상품 주문하기로 다음 컨테이너 화면으로 넘어간다
 if(pvMulti()&&E.orderPlan.stages.length>1) box.querySelectorAll('.ph-buy [data-cta]').forEach(b=>b.addEventListener('click',e=>{ e.stopImmediatePropagation(); pvGo(1); },true));
 box.querySelectorAll('details[data-pa]').forEach(d=>d.addEventListener('toggle',()=>{ const id=+d.dataset.pa.slice(2); d.open?PVX.add(id):PVX.delete(id); }));
 const areaOf=id=>E.areas.find(x=>x.id===+id);
 box.querySelectorAll('[data-lp]').forEach(el=>{ const go=e=>{ if(e.target.closest('.psb')) return; const [aid,id]=el.dataset.lp.split('|'); const a=areaOf(aid), p=pvOf(a), r=rng(a);
   if(r.hi===1) p.pick=(p.pick[0]===id&&!r.lo)?[]:[id]; else if(p.pick.includes(id)) p.pick=p.pick.filter(x=>x!==id); else if(p.pick.length<r.hi) p.pick.push(id); else { toast(`최대 ${r.hi}개까지 고를 수 있어요`); return; }
   renderPreview(); };
  el.addEventListener('click',go); el.addEventListener('keydown',e=>{ if(e.target===el&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); go(e); } }); });
 box.querySelectorAll('[data-none]').forEach(el=>el.addEventListener('change',()=>{ pvOf(areaOf(el.dataset.none)).pick=[]; renderPreview(); }));
 box.querySelectorAll('[data-ov]').forEach(b=>b.addEventListener('click',()=>{ const [aid,on,v]=b.dataset.ov.split('|'); pvOf(areaOf(aid)).opt[on]=v; renderPreview(); }));
 box.querySelectorAll('[data-ps]').forEach(c=>c.addEventListener('change',()=>{ const [aid,poId,psId,ci]=c.dataset.ps.split('|'); const a=areaOf(aid), po=poBy(poId), ps=po.dt.find(x=>x.id===psId), arr=psPicks(a,poId,ps), n=+ci;
  if(ps.max===1) arr.splice(0,arr.length,n); else if(c.checked){ if(arr.length<ps.max) arr.push(n); } else arr.splice(arr.indexOf(n),1); renderPreview(); }));
 box.querySelectorAll('[data-pm]').forEach(b=>b.addEventListener('click',()=>{ const [aid,key]=b.dataset.pm.split('|'), p=pvOf(areaOf(aid)); p.more[key]=!p.more[key]; renderPreview(); }));
 // 검색은 다시 그리지 않고 행만 숨겨 입력 중 커서를 지킨다. 검색어를 지우면 접힌 상태로 돌아간다
 box.querySelectorAll('[data-pq]').forEach(t=>t.addEventListener('input',()=>{ const [aid,key]=t.dataset.pq.split('|'); pvOf(areaOf(aid)).q[key]=t.value; const q=t.value.trim().toLowerCase(), psb=t.closest('.psb');
  psb.querySelectorAll('.pr').forEach(r=>r.hidden=q?!r.dataset.cn.toLowerCase().includes(q):r.dataset.lim==='1'); const m=psb.querySelector('.pmore'); if(m) m.hidden=!!q; }));
}
// 입력 섹션 ↔ 미리보기 위치 맞추기: 섹션 안을 누르거나 포커스하면 미리보기의 해당 위치로 이동하고 잠깐 강조한다.
// [앵커, 필요한 탭]. 앵커가 없으면(예: 노출 끈 콘텐츠 정보) 탭 처음으로 간다
const PV_AT={kind:['top'],conn:['tabs','order'],basic:['top'],search:['top'],desc:['desc','info'],order:['flow','order'],join:['join','order'],inst:['inst','order'],ship:['ship','order'],gift:['gift','order'],td:['td','order'],rel:['sim'],review:['review','review'],expert:['expert','expert']};
function pvTarget(k){
 if(k.startsWith('cn:')) return [`cn-${k.slice(3)}`,'order'];
 if(k==='flow') return ['flow','order'];
 if(k==='info') k=curI;
 if(GUIDE_KEYS.includes(k)) return E.mpGuide&&E.mpGuide[k]!==false?[k,'order']:['tabs','order'];
 if(k==='method') return E.kind!=='ps'?[`area-${cur}`,'order']:['top'];
 if(k==='extra') return curX!=null?[`x-${curX}`,'info']:['tabs','info'];
 if(k==='order'&&E.kind==='ps') return ['top'];
 // 주문 받기 OFF: 주문서 영역이 없으니 대체 버튼(CTA)으로 간다
 if(k==='order'&&!E.orderOn) return ['cta','order'];
 if(k==='review'&&!E.review) return ['top'];
 if(k==='expert'&&!E.expert) return ['top'];
 if(k==='rel'&&!E.related) return ['top'];
 return PV_AT[k]||['top'];
}
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let pvLast='';
function pvFocus(k){
 const [t,tab]=pvTarget(k);
 const xid=t.startsWith('x-')?+t.slice(2):null;
 if(tab&&PVTAB!==tab){ PVTAB=tab; if(xid!=null) PVX.add(xid); renderPreview(); }
 else if(xid!=null&&!PVX.has(xid)){ PVX.add(xid); renderPreview(); }
 const sc=pvScroller(); if(!sc) return;
 const tabsEl=sc.querySelector('.ph-tabs'), th=tabsEl?tabsEl.offsetHeight:0, mark=sc.querySelector('.ph-tabmark');
 const el=t==='top'?null:(sc.querySelector(`[data-pa="${t}"]`)||mark);
 const isMark=el===mark, y=!el?0:Math.max(0,isMark?el.offsetTop:el.offsetTop-th-8);
 const rel=el?el.offsetTop-sc.scrollTop:-sc.scrollTop;
 const inView=!el?sc.scrollTop<4:rel>=(isMark?0:th)&&rel<sc.clientHeight-80;
 const changed=t!==pvLast; pvLast=t;
 if(!changed&&inView) return;
 sc.scrollTo({top:y,behavior:RM?'auto':'smooth'});
 if(el&&!isMark){ el.classList.remove('pv-flash'); void el.offsetWidth; el.classList.add('pv-flash'); }
}
// 캡처 단계에서 받는다: 섹션 안 버튼이 자기 영역을 다시 그리면 버블 단계에서는 눌린 요소가 이미 문서에서 빠져 있다.
// 상태(cur·curX)가 바뀐 뒤에 위치를 정하도록 잠깐 미루고, 포커스+클릭이 연달아 와도 한 번만 움직인다
let pvT=0;
const onForm=e=>{ const s=e.target.closest&&e.target.closest('#v-edit .step'); if(!s) return; clearTimeout(pvT); pvT=setTimeout(()=>{ if(E&&$('#v-edit').classList.contains('on')) pvFocus(s.id.slice(4)); },e.type==='click'&&e.target.closest('.step>header')?FOLD_MS+40:30); }; // 머리줄로 열고 닫을 때는 애니메이션이 끝난 뒤 미리보기를 옮긴다 (동시에 다시 그리면 끊겨 보임)
$('#v-edit .builder').addEventListener('focusin',onForm,true);
$('#v-edit .builder').addEventListener('click',onForm,true);

// 미리보기 높이를 보이는 공간에 맞춘다: 휴대폰 아래쪽 주문 바가 하단 검사 바에 가리지 않게,
// 페이지 맨 위(틀이 아래로 밀려 있을 때)부터 고정 위치에 붙을 때까지 높이를 늘린다. 최대 800px
function fitPv(){
 const p=$('#v-edit .pv-panel'); if(!$('#v-edit').classList.contains('on')) return;
 if(innerWidth<=1200){ p.style.height=''; return; } // 1200px 이하는 미리보기를 숨긴다
 const top=Math.max(20,p.parentElement.getBoundingClientRect().top), dock=$('#dockBar').offsetHeight||68;
 p.style.height=Math.max(420,Math.min(800,innerHeight-dock-top-20))+'px';
}
let fitRaf=0;
addEventListener('scroll',()=>{ cancelAnimationFrame(fitRaf); fitRaf=requestAnimationFrame(fitPv); },{passive:true});
addEventListener('resize',fitPv);
// 로그인 확인 뒤 화면이 처음 보일 때, 수정 중 안내 줄이 생기거나 사라질 때도 다시 잰다
new ResizeObserver(fitPv).observe($('#v-edit'));

// ---------- 하단 검사 바 ----------
function setDock(open){
 const sh=$('#dockSheet'), dim=$('#dockDim'), was=!sh.hidden;
 $('#dock').classList.toggle('open',open); $('#dockToggle').setAttribute('aria-expanded',open);
 if(sh._a){ sh._a.cancel(); sh._a=null; } if(dim._a){ dim._a.cancel(); dim._a=null; }
 if(was===open||reduceMotion()||!sh.animate){ sh.hidden=!open; dim.hidden=!open; return; }
 sh.hidden=false; dim.hidden=false;
 const h=sh.scrollHeight, o={duration:open?280:220,easing:FOLD_EASE};
 sh.style.overflow='hidden';
 const a=sh._a=sh.animate(open?[{height:'0px',opacity:0},{height:h+'px',opacity:1}]:[{height:h+'px',opacity:1},{height:'0px',opacity:0}],o);
 dim._a=dim.animate(open?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],o);
 a.onfinish=()=>{ if(sh._a!==a) return; sh._a=null; dim._a=null; sh.style.overflow=''; if(!open){ sh.hidden=true; dim.hidden=true; } };
}
$('#dockBar').addEventListener('click',e=>{ if(e.target.closest('.dock-acts')) return; setDock($('#dockSheet').hidden); });
$('#dockClose').addEventListener('click',()=>setDock(false));
$('#dockDim').addEventListener('click',()=>setDock(false));

// ---------- 저장 ----------
// ---------- 하단 고정 버튼 ----------
// 등록: 저장 / 취소 · 상세: 목록 / 수정 / 승인요청(승인요청 취소) / 삭제 · 수정: 저장 / 취소
// 저장은 필수 항목이 비어도 된다(목록에 '임시저장'). 승인요청은 상세에서 필수 섹션을 모두 채웠을 때만 보낸다
// appr = 목록의 상태(draft 임시저장 · req 승인요청 · done 승인완료 · reject 반려). 값이 없는 예전 전시는 목록과 같은 규칙으로 정한다
const apprOf=d=>d.appr||(blockingV(d).length?'draft':'done');
const STORE_FAIL=' (브라우저 저장소를 쓸 수 없어 새로고침하면 사라져요)';
// 저장소에 쓴다. bump = 내용을 바꿔 저장(버전 · 최종 수정 정보 갱신). 승인요청 · 취소는 상태만 바꾼다
function persist(d,bump){
 const isNew=!d.id; if(isNew){ d.id=Math.max(0,...DISPLAYS.map(x=>x.id))+1; DISPLAYS.unshift(d); } else DISPLAYS[DISPLAYS.findIndex(x=>x.id===d.id)]=d;
 // 목록의 버전 · 최종등록(수정) 정보: 새 전시는 V1, 다시 저장할 때마다 버전을 올린다
 if(bump){ d.ver=isNew?1:(d.ver||1)+1; d.updatedAt=nowStamp(); d.editor=EDITOR; if(isNew){ d.owner=OWNERS[0]; d.team=TEAMS[0]; } }
 return saveList();
}
// 저장(등록 · 수정): 저장하면 상세로 간다. 승인완료 · 반려 전시를 고치면 다시 임시저장 상태가 된다(승인요청을 새로 해야 한다)
function save(){
 const d=clone(E); d.appr='draft';
 const drop=noImg(d)?d.imgs.mobile.length+d.imgs.desktop.length:0;
 if(noImg(d)){ d.imgs={mobile:[],desktop:[]}; d.main=null; d.subs=[]; d.mainAlt=''; d.subAlt=''; }
 const stored=persist(d,true), n=blockingV(d).length;
 openEdit(d.id,'view'); toast((n?`저장했어요. 필수 확인 ${n}건이 남아 있어요`:'저장했어요')+(drop?` · 요금제형이라 등록한 이미지 ${drop}장은 저장하지 않았어요`:'')+(stored?'':STORE_FAIL));
}
function cancel(){
 if(!confirm(VIEW==='new'?'입력한 내용을 저장하지 않고 나갈까요?':'수정한 내용을 저장하지 않고 상세로 돌아갈까요?')) return;
 if(VIEW==='new') goList(); else { openEdit(E.id,'view'); toast('수정을 취소했어요'); }
}
function requestAppr(){
 const b=blockingV(E);
 if(b.length){ const ks=[...new Set(b.map(([k])=>k))], l=SECS.find(([k])=>k===ks[0])[1]; goSec(ks[0]); toast(ks.length>1?`${l} 외 ${ks.length-1}개 섹션을 채워야 승인요청할 수 있어요. 수정에서 채우세요`:`${eul(l)} 채워야 승인요청할 수 있어요. 수정에서 채우세요`); return; }
 const d=clone(E); d.appr='req'; const stored=persist(d,false); openEdit(d.id,'view'); toast('승인을 요청했어요'+(stored?'':STORE_FAIL));
}
function cancelAppr(){
 if(!confirm('승인요청을 취소할까요?')) return;
 const d=clone(E); d.appr='draft'; const stored=persist(d,false); openEdit(d.id,'view'); toast('승인요청을 취소했어요'+(stored?'':STORE_FAIL));
}
function remove(){
 const live=apprOf(E)==='done'&&E.show;
 if(!confirm(`"${nameText(E.name)||'이름 없음'}" 전시를 삭제할까요?${live?'\n승인완료 · 전시 중인 전시예요. 삭제하면 고객 화면에서 바로 사라져요.':''}`)) return;
 const i=DISPLAYS.findIndex(x=>x.id===E.id); if(i>=0) DISPLAYS.splice(i,1);
 const stored=saveList(); goList('전시를 삭제했어요'+(stored?'':STORE_FAIL));
}
function rDock(){
 const a=apprOf(E), req=a==='req';
 const B=VIEW==='view'
  ?[['bList','','목록',()=>goList()],
    ['bEdit','','수정',()=>openEdit(E.id,'edit'),req&&'승인요청 중에는 수정할 수 없어요. 승인요청을 취소한 뒤 수정하세요'],
    req?['bApprCancel','primary','승인요청 취소',cancelAppr]:['bAppr','primary','승인요청',requestAppr,a==='done'&&'이미 승인완료된 전시예요'],
    ['bDel','danger','삭제',remove]]
  :[['bSave','primary','저장',save],['bCancel','','취소',cancel]];
 $('#dockActs').innerHTML=B.map(([id,c,l,,dis])=>`<button type="button" class="btn ${c}" id="${id}" ${dis?`disabled title="${dis}"`:''}>${l}</button>`).join('');
 B.forEach(([id,,,fn])=>$('#'+id).addEventListener('click',fn));
}

// ---------- 시작: 화면 선택은 src/unify.ts가 한다. ?id=N 은 그 전시 상세(?id=N&mode=edit 는 수정), ?view=new 는 새 전시 등록 ----------
const qs=new URLSearchParams(location.search);
{ const id=+qs.get('id'); openEdit(id&&DISPLAYS.some(d=>d.id===id)?id:null,qs.get('mode')); }
