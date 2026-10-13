// @ts-nocheck
// 주문 템플릿 관리 공용: 코너·템플릿 샘플 데이터, 저장(localStorage), 목록·등록 화면이 함께 쓰는 작은 도우미.
// 원본: ref/template-register-3pane-start-mockup-v20.html (한 파일 안의 조회/등록 화면을 order1.html · order1-create.html로 나눴다)

/* ---------- 코너 ---------- */
// u: 화면 안에서 코너를 구분하는 일련번호. 저장된 구성을 불러오면 가장 큰 값 뒤부터 이어서 매긴다.
let uid=0;
export function nextUid(){return ++uid}
export function C(n,id,t,o){var c={u:++uid,n:n,id:id,t:t,p:0,mode:'always',cg:[{conds:[]}],omode:'always',rules:[],oelse:null};for(var k in (o||{}))c[k]=o[k]; if(c.opts&&!c.oelse)c.oelse=c.opts.map(function(){return true}); if(c.opts&&!c.sv)c.sv=c.opts.slice(); return c;}

var PAYOPTS=['일시불','12개월','24개월','36개월'];
export function mk4(){return [
 {name:'주문 상세',corners:[
  C('상품 기본 정보 표시','CN-PRD-0001','상품',{epc:1,k:'info'}),
  C('상품 옵션·옵션별 가격 선택','CN-PRD-0002','상품',{epc:1,k:'opt',opts:['그라파이트','실버','256G','512G','1T','2T']}),
  C('배송방법 탐색·주소 경로 결정','CN-ORD-0001','주문',{opts:['바로도착','행복배송','일반배송','바로픽업'],screens:['배송방법 선택','배송주소·수취인 확인 (바텀시트)','배송가능여부 확인']}),
  C('대리 가입 여부 선택','CN-ORD-0002','주문',{opts:['직접 사용','다른 사람이 사용']}),
  C('주문 관계 확인','CN-ORD-0021','비화면',{nv:true}),
  C('가입 방식 선택','CN-ORD-0003','주문',{opts:['신규가입','번호이동','기기변경']}),
  C('기기 납부 방식 선택','CN-ORD-0004','주문',{opts:PAYOPTS.slice(),omode:'cond',rules:[{groups:[{conds:[{src:'CN-ORD-0003',ex:false,vals:['신규가입']}]}],opts:PAYOPTS.map(function(x){return x==='일시불'})}]}),
  C('요금제 선택','CN-ORD-0005','주문',{opts:['무제한 베스트 Pro','5GX 플래티넘','0 청년 69']}),
  C('SIM 유형 선택','CN-ORD-0006','주문',{opts:['eSIM','새 USIM 구매','가지고 있는 USIM 사용','내장 USIM 사용']}),
  C('T 기프트 선택','CN-ORD-0007','주문',{opts:['알로 휴대용 미니 공기청정기','Galaxy Buds Live Pro 16']}),
  C('티다팩 쿠폰 선택','CN-ORD-0008','주문',{opts:['다이소','무신사 머니','올리브영','티다팩 없이 주문 진행']}),
  C('바로보상 신청','CN-ORD-0009','주문',{opts:['바로보상 신청','신청 없이 주문 진행']}),
  C('보험 선택','CN-ORD-0018','주문',{opts:['T ALL케어 플러스 파손형','보험 없이 주문 진행']}),
  C('부가서비스 선택','CN-ORD-0019','주문',{opts:['Wavve 앤 데이터','부가서비스 없이 주문 진행']}),
  C('제휴카드 선택','CN-PAY-0001','결제',{opts:['요금 할인 카드','휴대폰 할인 카드','제휴카드 없이 주문 진행']}),
  C('보유 쿠폰·포인트 조회·적용','CN-PAY-0003','결제',{opts:['쿠폰·이용권 선택','T 모아 제휴 포인트 적용','추가 할인 없이 주문 진행'],screens:['쿠폰·포인트 선택','쿠폰번호 직접 입력']}),
  C('주문 정보 확인','CN-ORD-0020','주문')]},
 {name:'주문 확인',corners:[C('주문 상품','CN-ORD-0010','주문'),C('배송 정보 입력','CN-ORD-0011','주문'),C('통합 청구 선택','CN-ORD-0012','주문'),C('요금 할인 제휴카드 안내 및 정보 입력','CN-PAY-0002','결제')]},
 {name:'주문 완료',corners:[C('주문 완료 안내','CN-ORD-0013','주문'),C('가입 서류 안내','CN-ORD-0014','주문')]},
 {name:'사후 관리',corners:[C('사후 관리 안내','CN-ORD-0015','주문')]}
];}
function mkTab(){return [
   {name:'주문 상세',corners:[C('요금제 선택','CN-ORD-0005','주문',{opts:['무제한 베스트 Pro','5GX 플래티넘','0 청년 69']}),C('SIM 유형 선택','CN-ORD-0006','주문',{opts:['eSIM','새 USIM 구매','가지고 있는 USIM 사용','내장 USIM 사용']}),C('기기 납부 방식 선택','CN-ORD-0004','주문',{opts:PAYOPTS.slice()})]},
   {name:'주문 확인',corners:[C('주문 상품','CN-ORD-0010','주문'),C('배송 정보 입력','CN-ORD-0011','주문')]},
   {name:'주문 완료',corners:[C('주문 완료 안내','CN-ORD-0013','주문')]}];}
function mkWear(){return [
   {name:'주문 상세',corners:[C('요금제 선택','CN-ORD-0005','주문',{opts:['무제한 베스트 Pro','5GX 플래티넘','0 청년 69']}),C('SIM 유형 선택','CN-ORD-0006','주문',{opts:['eSIM','새 USIM 구매','가지고 있는 USIM 사용','내장 USIM 사용']})]},
   {name:'주문 완료',corners:[C('주문 완료 안내','CN-ORD-0013','주문')]}];}
function mkSim(){return [
   {name:'주문 상세',corners:[C('SIM 유형 선택','CN-ORD-0006','주문',{opts:['eSIM','새 USIM 구매','가지고 있는 USIM 사용','내장 USIM 사용']}),C('요금제 선택','CN-ORD-0005','주문',{opts:['무제한 베스트 Pro','5GX 플래티넘','0 청년 69']})]},
   {name:'주문 완료',corners:[C('주문 완료 안내','CN-ORD-0013','주문')]}];}
const FACT={mk4,mkTab,mkWear,mkSim};

/* ---------- 템플릿 ---------- */
// 샘플 템플릿은 구성 함수 이름(mkKey)만 갖고, 등록·수정해 저장한 템플릿은 구성(stages)을 그대로 갖는다.
export const BY='김지훈(SSP23232)', NOW='2026.10.11 14:30';
export const APS=['임시 저장','승인 대기','승인 완료','반려','요청 취소'];
function seed(){
  const a=[];
  function T(id,n,cat,pt,cnt,ap,u,dt,mkKey,desc){a.push({id:id,n:n,cat:cat,pt:pt,t:pt,cnt:cnt,ap:ap,u:u,dt:dt,by:BY,mkKey:mkKey,desc:desc||''})}
  T('CTN-ORD-001','기기서비스 기본 템플릿','상품 유형 템플릿','기기서비스',12,'승인 완료',true,'2026.10.08 10:12','mk4','기기서비스 주문 구성에 쓰이는 기본 템플릿');
  T('CTN-ORD-002','휴대폰 주문 – 기기변경','상품 유형 템플릿','기기서비스',8,'승인 완료',true,'2026.10.02 15:40','mk4','기기변경 가입 시 사용하는 주문 구성');
  T('CTN-ORD-003','휴대폰 주문 – 번호이동','상품 유형 템플릿','기기서비스',8,'승인 완료',true,'2026.10.02 15:31','mk4','번호이동 가입 시 사용하는 주문 구성');
  T('CTN-ORD-004','태블릿 주문 – 신규가입','상품 유형 템플릿','기기서비스',5,'승인 대기',false,'2026.10.09 09:20','mkTab','태블릿 신규가입 주문 구성');
  T('CTN-ORD-005','웨어러블 주문 기본','상품 유형 템플릿','기기서비스',3,'임시 저장',false,'2026.09.30 17:05','mkWear','');
  T('CTN-ORD-006','유심 단독 주문','전시 상품 템플릿','기기서비스',4,'승인 완료',true,'2026.09.28 11:02','mkSim','유심만 주문하는 상품용 구성');
  T('CTN-ORD-007','요금제 변경 주문','상품 유형 템플릿','요금제',20,'반려',false,'2026.09.25 13:48','mkSim','요금제 변경 주문 구성');
  T('CTN-ORD-008','부가서비스 가입 주문','상품 유형 템플릿','부가서비스',15,'승인 완료',true,'2026.09.22 10:15','mkSim','부가서비스 가입 주문 구성');
  T('CTN-ORD-009','로밍 주문 기본','전시 상품 템플릿','로밍',6,'요청 취소',false,'2026.09.18 16:30','mkWear','');
  T('CTN-ORD-010','구독 주문 기본','상품 유형 템플릿','구독',9,'승인 대기',false,'2026.09.15 14:12','mkTab','구독 상품 주문 구성');
  T('CTN-ORD-011','아이폰 18 Pro Max 전용 템플릿','전시 상품 템플릿','기기서비스',1,'승인 완료',true,'2026.09.10 09:40','mk4','');
  T('CTN-ORD-012','갤럭시 Z 폴드8 전용 템플릿','전시 상품 템플릿','기기서비스',1,'임시 저장',false,'2026.09.03 18:20','mk4','');
  return a;
}
// d.mk(): 템플릿 구성을 새로 복제해 돌려준다 (원본 목업과 같은 이름)
export function withMk(d){
  d.mk=function(){
    if(!d.stages) return FACT[d.mkKey||'mk4']();
    const s=JSON.parse(JSON.stringify(d.stages));
    s.forEach(st=>st.corners.forEach(c=>{if(c.u>uid)uid=c.u}));
    return s;
  };
  return d;
}
const KEY='nova.order1.templates.v1';
export function loadTemplates(){
  try { const v=JSON.parse(localStorage.getItem(KEY)); if(Array.isArray(v)&&v.length) return v.map(withMk); } catch {}
  return seed().map(withMk);
}
export function saveTemplates(list){
  try { localStorage.setItem(KEY, JSON.stringify(list.map(({mk,...r})=>r))); } catch {}
}

/* ---------- 화면 공용 도우미 ---------- */
export function $(id){return document.getElementById(id)}
export function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
export function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2000)}
export function apBadge(a){var m={'승인 완료':'ok','승인 대기':'wait','임시 저장':'tmp','반려':'rej','요청 취소':'can'};return '<span class="stat '+m[a]+'">'+a+'</span>'}
export const PS=10;
export function pagerHTML(total,page){
  var tp=Math.max(1,Math.ceil(total/PS)), h='<div class="pager">';
  h+='<button type="button" data-g="1"'+(page<=1?' disabled':'')+' aria-label="처음">«</button><button type="button" data-g="'+(page-1)+'"'+(page<=1?' disabled':'')+' aria-label="이전">‹</button>';
  for(var i=1;i<=tp;i++) h+='<button type="button" class="pg'+(i===page?' on':'')+'" data-g="'+i+'">'+i+'</button>';
  h+='<button type="button" data-g="'+(page+1)+'"'+(page>=tp?' disabled':'')+' aria-label="다음">›</button><button type="button" data-g="'+tp+'"'+(page>=tp?' disabled':'')+' aria-label="마지막">»</button></div>';
  return h;
}
export function bindPager(id,fn){ $(id).addEventListener('click',function(e){var b=e.target.closest('button[data-g]'); if(!b||b.disabled) return; fn(+b.getAttribute('data-g'))}); }
