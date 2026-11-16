// @ts-nocheck
// 주문 코너 유형 관리 v0.3 (order-corner-type-v30.html)
// 2026-11-10 : 주문 코너 등록 v0.3(order-corner-v30)을 복사해 '코너 유형' 메뉴로 분리
// 2026-11-10 : ref/order_mockup_corner_1110.html 반영
//   - 코너 유형 5종(바코드형 제외) · 유형별 목적 문구 · 유형별 배열(배너형 단일/스와이프, 업무 진입형 5종, 콘텐츠 안내형 6종)과 기본 배열
//   - 코너 속성은 '유형|배열' 정의표(ATTR_DATA)로 그린다. 형태 속성(형태 · 선택 방식 · 리스트 형태)은 한 줄 전체, Y/N 속성은 두 개씩 한 줄
//   - 정의가 없는 배열은 안내, 카테고리형은 기본 배열 속성으로 대체, 배너형은 배너 캠페인 관리 안내
//   - 미리보기는 배열별 렌더러(가로/세로/카테고리 · 리스트 · 프로필 · 상태 안내 · 입력 · 텍스트 · 스텝 · 아코디언 · 비교 · 후기 · 배너)
// 목록은 전시 코너 유형 관리 목록 시안 기준 : 업무 영역 탭(주문 · 결제 · 상품) · 체크박스 조건(건수) · 유형 상세 · 카드/리스트 보기 · 미리보기 썸네일
import "./list-unified.css";
import "./order-corner-type-v30.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

/* ===== 기준 데이터 (ref/order_mockup_corner_1110.html) ===== */
const TYPES=[
  {t:'상품형',p:'판매해 수익이 나는 상품(요금제, 단말, 부가서비스, 보험, 충전 데이터 등) 후보를 탐색·선택하게 한다.',arr:['가로형','세로형','가로형(카테고리형)','세로형(카테고리형)']},
  {t:'혜택·오퍼형',p:'고객에게 주는 혜택(쿠폰, 할인, 제휴카드, 사은품, 요금제 포함 혜택)을 제안·선택하게 한다.',arr:['가로형','세로형','가로형(카테고리형)','세로형(카테고리형)']},
  {t:'배너형',p:'배너 캠페인 관리에서 등록한 배너를 불러와 노출한다. 단일형=배너 1개, 스와이프형=배너 여러 개.',arr:['단일형','스와이프형']},
  {t:'업무 진입형',p:'조회·변경·신청·납부 업무로 바로 이동시키거나 처리하고, 고객 상태·보유 정보를 안내한다.',arr:['카테고리형','리스트형','프로필형','상태 안내형','입력형']},
  {t:'콘텐츠 안내형',p:'이용 가이드, 설명, 유의사항, 추천 콘텐츠를 제공한다.',arr:['가로형','텍스트형','스텝형','아코디언형','비교형','후기형']}
];
const DEF_ARR={'상품형':'세로형','혜택·오퍼형':'세로형','배너형':'단일형','업무 진입형':'리스트형','콘텐츠 안내형':'텍스트형'};
const ARR_EN={'가로형':'Horizontal','세로형':'Vertical','가로형(카테고리형)':'Horizontal (Category)','세로형(카테고리형)':'Vertical (Category)','단일형':'Single','스와이프형':'Swipe','카테고리형':'Category','리스트형':'List','프로필형':'Profile','상태 안내형':'Status','입력형':'Input','텍스트형':'Text','스텝형':'Step','아코디언형':'Accordion','비교형':'Compare','후기형':'Review'};
const TYPE_CLS={'상품형':'b','혜택·오퍼형':'o','배너형':'p','업무 진입형':'g','콘텐츠 안내형':'t'};
// 코너 속성 정의 : area c 코너(카드) · i 컴포넌트(요소), g 고정 | 옵션 | 형태(선택지/…) | TBD
const A=(area,name,key,g)=>({area,name,key,g});
const ATTR_DATA={
  '상품형|세로형':[A('c','배너','Banner','옵션'),A('c','CTA','CallToAction','옵션'),A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','CornerSubTitle','옵션'),A('c','버튼 텍스트','ButtonText','옵션'),
    A('i','컴포넌트 선택 방식','SelectType','형태(없음/단일/복수)'),A('i','컴포넌트 이미지','ImageSrc','옵션'),A('i','컴포넌트 타이틀','ItemTitle','고정'),A('i','컴포넌트 서브 타이틀','SubTitle','옵션'),A('i','컴포넌트 배지','BadgeGroup','옵션'),
    A('i','가격','TextPriceGroup','옵션'),A('i','할인율','Discount','옵션'),A('i','기간','Period','옵션'),A('i','컴포넌트 캡션','Caption01','옵션'),A('i','컴포넌트 캡션2','Caption02','옵션')],
  '상품형|가로형':[A('c','배너','Banner','옵션'),A('c','CTA','CallToAction','옵션'),A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','CornerSubTitle','옵션'),A('c','버튼 텍스트','ButtonText','옵션'),
    A('i','컴포넌트 형태','Variants','형태(Small/Medium/Large)'),A('i','컴포넌트 선택 방식','SelectType','형태(없음/단일/복수)'),A('i','컴포넌트 이미지','ImageSrc','고정'),A('i','컴포넌트 타이틀','ItemTitle','고정'),
    A('i','가격','Price','옵션'),A('i','할인율','DiscountRate','옵션'),A('i','컴포넌트 서브 텍스트','SubText','옵션')],
  '혜택·오퍼형|세로형':[A('c','배너','Banner','옵션'),A('c','CTA','CallToAction','옵션'),A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','CornerSubTitle','옵션'),A('c','버튼 텍스트','ButtonText','옵션'),
    A('i','컴포넌트 선택 방식','SelectType','형태(없음/단일/복수)'),A('i','컴포넌트 이미지','ImageSrc','옵션'),A('i','컴포넌트 타이틀','ItemTitle','고정'),A('i','컴포넌트 서브 타이틀','SubTitle','고정'),A('i','컴포넌트 배지','BadgeGroup','옵션'),A('i','가격','Price','옵션')],
  '배너형|단일형':[],
  '배너형|스와이프형':[],
  '업무 진입형|리스트형':[A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','CornerSubTitle','옵션'),A('c','코너 안내 문구','Notice','옵션'),A('c','코너 전체 동의','AllAgree','옵션'),A('c','CTA','CallToAction','옵션'),
    A('i','리스트 형태','ListVariants','형태(기본/항목·값)'),A('i','컴포넌트 선택 방식','SelectType','형태(없음/단일/복수)'),A('i','리스트','List','고정'),A('i','컴포넌트 그룹 타이틀','GroupTitle','옵션'),A('i','컴포넌트 서브 타이틀','SubTitle','옵션'),A('i','컴포넌트 배지','BadgeGroup','옵션'),A('i','컴포넌트 상세 펼침','Detail','옵션')],
  '업무 진입형|카테고리형':[A('i','컴포넌트 선택 방식','SelectType','형태(없음/단일/복수)'),A('i','컴포넌트 아이콘','Icon','옵션'),A('i','컴포넌트 라벨','Label','고정')],
  '업무 진입형|상태 안내형':[A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','SubTitle','고정'),A('c','코너 배지','BadgeItem','고정'),A('c','코너 아이콘','IconItem','고정'),A('c','CTA','CallToAction','옵션'),A('i','컴포넌트 정보 행','InfoRow','옵션')],
  '업무 진입형|입력형':[A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','CornerSubTitle','옵션'),A('c','CTA','CallToAction','옵션'),A('i','컴포넌트 입력 필드','InputField','고정'),A('i','컴포넌트 도움말','HelpText','옵션'),A('i','컴포넌트 등록 목록','RegisteredList','옵션'),A('i','컴포넌트 빈 상태 안내','Empty','옵션')],
  '업무 진입형|프로필형':[A('c','코너 타이틀','CornerTitle','고정'),A('c','코너 서브 타이틀','SubTitle','고정'),A('c','코너 프로필 이미지','ImageSrc','고정'),A('c','코너 고객명','CustomerName','고정'),A('c','코너 휴대폰 번호','Caption','고정'),A('c','코너 버튼','Button','고정')],
  '콘텐츠 안내형|텍스트형':[A('c','코너 타이틀','CornerTitle','고정'),A('c','CTA','CallToAction','옵션'),A('i','컴포넌트 타이틀','ItemTitle','옵션'),A('i','컴포넌트 본문','Body','고정'),A('i','컴포넌트 아이콘','Icon','옵션')],
  '콘텐츠 안내형|스텝형':[A('c','코너 타이틀','CornerTitle','고정'),A('c','CTA','CallToAction','옵션'),A('i','컴포넌트 스텝 번호','StepNo','고정'),A('i','컴포넌트 타이틀','ItemTitle','고정'),A('i','컴포넌트 본문','Body','옵션'),A('i','컴포넌트 이미지','ImageSrc','옵션')],
  '콘텐츠 안내형|아코디언형':[A('c','코너 타이틀','CornerTitle','옵션'),A('c','버튼 텍스트','ButtonText','옵션'),A('i','컴포넌트 탭','Tab','옵션'),A('i','컴포넌트 타이틀','ItemTitle','고정'),A('i','컴포넌트 본문','Body','고정')],
  '콘텐츠 안내형|비교형':[A('c','코너 타이틀','CornerTitle','고정'),A('i','컴포넌트 비교 항목','CompareItem','고정'),A('i','컴포넌트 그래프','Graph','옵션'),A('i','컴포넌트 본문','Body','옵션')],
  '콘텐츠 안내형|후기형':[A('c','코너 타이틀','CornerTitle','고정'),A('i','후기 구성','Review','TBD')],
  '콘텐츠 안내형|가로형':[A('c','CTA','CallToAction','옵션'),A('c','코너 타이틀','CornerTitle','고정'),A('c','버튼 텍스트','ButtonText','고정'),A('i','컴포넌트 이미지 형태','Variants','형태(Small/Medium/Large)'),A('i','컴포넌트 이미지','ImageSrc','고정'),A('i','컴포넌트 타이틀','ItemTitle','고정'),A('i','컴포넌트 캡션·평점','Caption01','고정')]
};
const GRP_DESC={c:'카드 전체에 1개 (배너·타이틀·버튼)',i:'리스트에서 반복되는 카드 1개'};
const DEP={DiscountRate:'Price',Discount:'TextPriceGroup',Caption02:'Caption01'};   // 종속 옵션 : 부모가 Y일 때만 켤 수 있다
const DOMAINS=[['ORD','주문'],['PAY','결제'],['PRD','상품']];
const APS=['승인완료','승인요청','반려','임시저장'];
const AP_CLS={'승인완료':'ok','승인요청':'wt','반려':'no','임시저장':''};
const PLATS=[['M','모바일'],['P','PC']];
const EDITOR='김운영',APPROVER='정지솔';

/* 정의표 조회 : 카테고리형은 정의가 없으면 기본 배열 속성으로 대체(fb), 그래도 없으면 t:null (참고 화면 미확인) */
function tplOf(type,lay){
  const k=type+'|'+lay;if(ATTR_DATA[k])return {t:ATTR_DATA[k]};
  const m=String(lay).match(/^(.+)\(카테고리형\)$/);
  if(m&&ATTR_DATA[type+'|'+m[1]])return {t:ATTR_DATA[type+'|'+m[1]],fb:m[1]};
  return {t:null};
}
const isForm=e=>e.g.indexOf('형태')===0;
const optsOf=e=>e.g.match(/\((.*)\)/)[1].split('/');
function defaults(type,lay){const v={};(tplOf(type,lay).t||[]).forEach(e=>{v[e.key]=isForm(e)?(e.key==='SelectType'?'단일':optsOf(e)[0]):e.g==='옵션'?true:true});return v}
function attrOf(s,k){const t=tplOf(s.type,s.lay).t;return t?t.find(x=>x.key===k):null}
function depOff(s,k){return !!DEP[k]&&!!attrOf(s,DEP[k])&&!on(s,DEP[k])}
function on(s,k){const e=attrOf(s,k);if(!e)return false;if(depOff(s,k))return false;if(e.g!=='옵션')return true;return !!s.v[k]}
const val=(s,k)=>s.v[k];

/* ===== 미리보기 (ref pv() 이식, 클래스는 q- 접두어) ===== */
function pv(s){
  const t=tplOf(s.type,s.lay).t,a=s.lay,ty=s.type,O=k=>on(s,k),V=k=>val(s,k);
  const ctl=()=>{const x=V('SelectType');return x==='단일'?'<span class="q-ctl r"></span>':x==='복수'?'<span class="q-ctl c"></span>':''};
  const head=()=>{let h='';
    if(O('Banner'))h+='<div class="q-ph q-banner">Banner</div>';
    if(O('CornerTitle'))h+='<div class="q-ct">CornerTitle</div>';
    if(O('CornerSubTitle'))h+='<div class="q-cs">CornerSubTitle</div>';
    if(O('ButtonText'))h+='<div class="q-bt">ButtonText ›</div>';
    if(O('Notice'))h+='<div class="q-nt">Notice</div>';
    if(O('AllAgree'))h+='<div class="q-row b"><span class="q-ctl c"></span>AllAgree</div>';
    return h};
  const cta=()=>O('CallToAction')?'<div class="q-cta">CTA ›</div>':'';
  const cats=()=>a.indexOf('카테고리')>-1?'<div class="q-chips"><span class="q-chp on">Category1</span><span class="q-chp">Category2</span><span class="q-chp">Category3</span></div>':'';
  if(t===null)return '<div class="q-na">참고 화면 미확인</div>';
  if(ty==='배너형')return '<div class="q-ph q-bnimg">Banner</div><div class="q-bd"><div class="q-it lg">Title</div><div class="q-st">SubTitle</div></div>'+(a==='스와이프형'?'<div class="q-cap r">1 / 3</div>':'');
  if(a==='프로필형')return '<div class="q-row c"><div class="q-ph q-ico">◯</div><div class="q-bd"><div class="q-it">CornerTitle <span class="q-st">Caption</span></div></div><span class="q-chp">Button</span></div>';
  if(a==='상태 안내형'){let h='<div class="q-row c"><div class="q-bd"><div class="q-ct">CornerTitle<span class="q-bdg">Badge</span></div><div class="q-st">SubTitle</div></div><div class="q-ph q-ico">아이콘</div></div>';
    if(O('InfoRow'))h+=['Label 01','Label 02','Label 03'].map(k=>'<div class="q-kv"><span>'+k+'</span><span>Value</span></div>').join('');return h+cta()}
  if(a==='카테고리형'){const x=V('SelectType');return '<div class="q-chips">'+[1,2,3,4,5,6,7].map(i=>'<span class="q-chp'+(x!=='없음'&&(i===1||(x==='복수'&&i===3))?' on':'')+'">'+(O('Icon')?'<i></i>':'')+'Category'+i+'</span>').join('')+'</div>'}
  if(a.indexOf('가로형')===0){const z=(V('Variants')||'Small')[0];
    return head()+cats()+'<div class="q-hs">'+[1,2,3].map(()=>'<div class="q-card '+z+'">'+(O('ImageSrc')?'<div class="q-ph">▣</div>':'')+'<div class="q-it sm">ItemTitle</div>'+(O('Price')?'<div class="q-pr sm">'+(O('DiscountRate')?'<em>99%</em>':'')+'99,999원</div>':'')+(O('SubText')?'<div class="q-cap">SubText</div>':'')+(ty==='콘텐츠 안내형'?'<div class="q-cap">Caption01</div>':'')+'</div>').join('')+'</div>'+cta()}
  if(a==='입력형'){let h=head();['Label 01','Label 02'].forEach((l,i)=>{h+='<div class="q-lbl">'+l+'</div><div class="q-in">InputField</div>';if(i&&O('HelpText'))h+='<div class="q-cap up">HelpText</div>'});
    if(O('RegisteredList'))h+='<div class="q-lbl">RegisteredList</div><div class="q-kv"><span>010-1234-5678</span><span>삭제</span></div>';
    if(O('Empty'))h+='<div class="q-cap ctr">Empty</div>';return h+cta()}
  if(a==='텍스트형')return head()+[1,2].map(()=>'<div class="q-bd">'+(O('ItemTitle')?'<div class="q-it">'+(O('Icon')?'● ':'')+'ItemTitle</div>':'')+'<div class="q-st">Body</div></div>').join('')+cta();
  if(a==='스텝형')return head()+[1,2,3].map(i=>'<div class="q-step"><b>'+i+'</b><div class="q-bd"><div class="q-it">ItemTitle</div>'+(O('Body')?'<div class="q-st">Body</div>':'')+(O('ImageSrc')&&i===1?'<div class="q-ph q-stimg">▣</div>':'')+'</div></div>').join('')+cta();
  if(a==='아코디언형')return head()+(O('Tab')?'<div class="q-tbs"><span>Tab1</span><span>Tab2</span></div>':'')+[1,2,3].map(i=>'<div class="q-acc"><span>ItemTitle</span><span>'+(i===1?'︿':'﹀')+'</span></div>'+(i===1?'<div class="q-st">Body</div>':'')).join('');
  if(a==='비교형')return head()+['Before','After'].map((k,i)=>'<div class="q-lbl">'+k+'</div>'+(O('Graph')?'<div class="q-bar" style="width:'+(i?55:85)+'%"></div>':'')+'<div class="q-kv"><span>CompareItem</span><span>Value</span></div>').join('');
  if(a==='후기형')return head()+'<div class="q-na">후기 구성 TBD</div>';
  if(a==='리스트형'){let h=head();
    if(V('ListVariants')==='항목·값'){h+=['Label 01','Label 02','Label 03'].map(k=>'<div class="q-kv"><span>'+k+'</span><span>Value</span></div>').join('');if(O('Detail'))h+='<div class="q-acc"><span>Detail</span><span>﹀</span></div>'}
    else{if(O('GroupTitle'))h+='<div class="q-lbl b">GroupTitle</div>';
      h+=[1,2,3,4].map(()=>'<div class="q-row">'+ctl()+'<div class="q-bd"><div class="q-it n">List'+(O('BadgeGroup')?'<span class="q-bdg">Badge</span>':'')+'</div>'+(O('SubTitle')?'<div class="q-st">SubTitle</div>':'')+'</div>'+(O('Detail')?'<span class="q-cap">›</span>':'')+'</div>').join('')}
    return h+cta()}
  const vItem=()=>{let b='<div class="q-it">ItemTitle'+(O('BadgeGroup')?'<span class="q-bdg">Badge</span>':'')+'</div>';
    if(O('SubTitle'))b+='<div class="q-st">SubTitle</div>';
    if(O('TextPriceGroup')||O('Price'))b+='<div class="q-pr">'+(O('Discount')||O('DiscountRate')?'<em>99%</em>':'')+'99,999원'+(O('Period')?' <span>/Period</span>':'')+'</div>';
    if(O('Caption01'))b+='<div class="q-cap">Caption01'+(O('Caption02')?' | Caption02':'')+'</div>';
    return '<div class="q-row">'+ctl()+(O('ImageSrc')?'<div class="q-ph q-img">▣</div>':'')+'<div class="q-bd">'+b+'</div></div>'};
  return head()+cats()+[0,1,2].map(vItem).join('')+cta();
}

/* ===== 샘플 목록 ===== */
let seq=0;
function mk(dom,m,type,lay,plat,use,ap,mby,dt,desc,patch){seq++;return {id:'CY'+String(seq).padStart(7,'0'),dom,m,type,lay,plat,use,ap,mby,dt,desc,ver:'1.0',v:Object.assign(defaults(type,lay),patch||{})}}
const LIST=[
  mk('ORD','ct-ord-prod-h','상품형','가로형',['M'],'Y','승인완료','이서연','2026-10-20 09:10','단말 · 요금제 후보를 가로로 넘겨 보는 기본 상품 코너',{SelectType:'없음',DiscountRate:false}),
  mk('ORD','ct-ord-prod-v','상품형','세로형',['M','P'],'Y','승인완료','김지훈','2026-10-21 11:30','요금제 후보를 세로로 나열',{Period:false,Caption02:false}),
  mk('ORD','ct-ord-offer-v','혜택·오퍼형','세로형',['M','P'],'Y','승인완료','이서연','2026-10-22 14:00','제휴 카드 · 사은품 혜택 선택',{Price:false}),
  mk('ORD','ct-ord-banner-single','배너형','단일형',['M','P'],'Y','승인완료','박민서','2026-10-23 10:00','주문서 상단 이벤트 배너 1개'),
  mk('ORD','ct-ord-task-list','업무 진입형','리스트형',['M'],'Y','승인완료','김지훈','2026-10-24 16:40','가입 방식 · 대리 가입 같은 단일 선택 리스트',{Notice:false,AllAgree:false,GroupTitle:false,Detail:false}),
  mk('ORD','ct-ord-task-input','업무 진입형','입력형',['M','P'],'Y','승인완료','박민서','2026-10-27 13:20','배송 정보 · 통합 청구 번호 입력',{RegisteredList:false}),
  mk('ORD','ct-ord-content-text','콘텐츠 안내형','텍스트형',['M','P'],'Y','승인완료','이서연','2026-10-28 09:50','개통 · 반품 유의 사항'),
  mk('ORD','ct-ord-offer-vcat','혜택·오퍼형','세로형(카테고리형)',['M'],'Y','승인완료','김지훈','2026-10-29 15:10','쿠폰 · 포인트 탭으로 혜택 나눠 보기'),
  mk('ORD','ct-ord-task-status','업무 진입형','상태 안내형',['M'],'Y','승인완료','박민서','2026-10-30 10:25','주문 완료 · 진행 상태 안내'),
  mk('ORD','ct-ord-content-step','콘텐츠 안내형','스텝형',['M','P'],'N','반려','이서연','2026-10-31 17:50','셀프 개통 단계 안내',{ImageSrc:false}),
  mk('ORD','ct-ord-banner-swipe','배너형','스와이프형',['M'],'Y','승인완료','김지훈','2026-11-03 09:30','기획전 배너 여러 개'),
  mk('ORD','ct-ord-task-terms','업무 진입형','리스트형',['M','P'],'Y','승인요청','박민서','2026-11-04 14:40','약관 동의 (전체 동의 + 항목 · 상세 펼침)',{SelectType:'복수',ListVariants:'기본',BadgeGroup:false}),
  mk('ORD','ct-ord-offer-gift','혜택·오퍼형','세로형',['M'],'N','임시저장','이서연','2026-11-05 11:00','T 기프트 사은품',{SelectType:'복수',BadgeGroup:false}),
  mk('ORD','ct-ord-prod-vcat','상품형','세로형(카테고리형)',['M','P'],'Y','승인완료','김마리나','2026-11-09 10:26','카테고리 탭으로 상품군을 나눠 세로로 나열',{Caption01:false,Caption02:false}),
  mk('ORD','ct-ord-prod-hcat','상품형','가로형(카테고리형)',['M'],'Y','승인완료','김마리나','2026-11-09 10:26','카테고리 탭 + 가로 상품 카드',{Variants:'Medium'}),
  mk('ORD','ct-ord-offer-summary','혜택·오퍼형','세로형',['M','P'],'Y','승인요청','김마리나','2026-11-10 09:40','적용 혜택 요약',{SelectType:'없음',ImageSrc:false}),
  mk('PAY','ct-pay-card','혜택·오퍼형','세로형',['M','P'],'Y','승인완료','정다은','2026-10-25 10:00','제휴카드 선택'),
  mk('PAY','ct-pay-method','업무 진입형','리스트형',['M','P'],'Y','승인완료','정다은','2026-10-26 13:00','결제 수단 선택',{Notice:false,AllAgree:false,BadgeGroup:false}),
  mk('PAY','ct-pay-guide','콘텐츠 안내형','아코디언형',['M'],'Y','임시저장','정다은','2026-11-06 15:30','결제 금액 상세 펼침',{Tab:false})
];

/* ===== 공통 ===== */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>('0'+n).slice(-2);
function nowStr(full){const d=new Date();const s=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());return full?s.replace(/-/g,'.')+':'+pad(d.getSeconds()):s}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2200)}
function setCrumb(arr){$('crumb').innerHTML=arr.map(s=>'<span>'+s+'</span>').join('')}
const apPill=s=>'<span class="ct-pill '+(AP_CLS[s]||'')+'">'+esc(s)+'</span>';
const typePill=t=>'<span class="cl-tp '+(TYPE_CLS[t]||'')+'">'+esc(t)+'</span>';
const arrText=a=>esc(a)+(ARR_EN[a]?' ('+ARR_EN[a]+')':'');
const domName=d=>(DOMAINS.find(x=>x[0]===d)||[])[1]||d;
function showPage(p){$('pList').hidden=p!=='list';$('pForm').hidden=p!=='form';window.scrollTo(0,0)}
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* ===== 목록 ===== */
// F : 화면의 조건(조회 전), Q : 조회에 쓰는 조건. 탭 · 보기 방식 · 페이지는 바로 반영
const F={types:[],lay:'',use:['Y','N'],ap:APS.slice(),key:'i',kw:''};
let Q=clone(F),TAB='ORD',VIEW=store.get('ct-view')==='card'?'card':'list',PAGE=1;
const PS={list:10,card:12};
const ck=(attr,v,lab,checked,cnt)=>'<label class="cl-ck'+(checked?' on':'')+'"><input type="checkbox" '+attr+'="'+esc(v)+'"'+(checked?' checked':'')+'><span>'+esc(lab)+'</span>'+(cnt==null?'':'<em>'+cnt+'</em>')+'</label>';
function tabRows(){return LIST.filter(c=>c.dom===TAB)}
function renderTabs(){$('lTabs').innerHTML=DOMAINS.map(d=>{const n=LIST.filter(c=>c.dom===d[0]).length;return '<button type="button" role="tab" aria-selected="'+(d[0]===TAB)+'" data-tab="'+d[0]+'">'+d[1]+'<em>'+n+'</em></button>'}).join('')}
function renderFilter(){
  const R=tabRows();
  $('fTypes').innerHTML=ck('data-ty','ALL','전체',!F.types.length,R.length)+TYPES.map(t=>ck('data-ty',t.t,t.t,F.types.indexOf(t.t)>-1,R.filter(c=>c.type===t.t).length)).join('');
  const ts=F.types.length?TYPES.filter(t=>F.types.indexOf(t.t)>-1):TYPES;
  if(F.lay&&!ts.some(t=>t.arr.indexOf(F.lay)>-1))F.lay='';
  $('fLay').innerHTML='<option value="">전체</option>'+ts.map(t=>'<optgroup label="'+esc(t.t)+'">'+t.arr.map(a=>'<option value="'+esc(a)+'"'+(a===F.lay?' selected':'')+'>'+esc(a)+'</option>').join('')+'</optgroup>').join('');
  const all=(arr,full)=>arr.length===full.length;
  $('fUse').innerHTML=ck('data-use','ALL','전체',all(F.use,['Y','N']))+ck('data-use','Y','사용',F.use.indexOf('Y')>-1)+ck('data-use','N','미사용',F.use.indexOf('N')>-1);
  $('fAp').innerHTML=ck('data-ap','ALL','전체',all(F.ap,APS))+APS.map(a=>ck('data-ap',a,a,F.ap.indexOf(a)>-1)).join('');
  $('fKey').value=F.key;$('fKw').value=F.kw;$('bClr').hidden=!F.kw;
}
function filtered(){
  const kw=Q.kw.toLowerCase();
  return tabRows().filter(c=>(!Q.types.length||Q.types.indexOf(c.type)>-1)&&(!Q.lay||c.lay===Q.lay)&&Q.use.indexOf(c.use)>-1&&Q.ap.indexOf(c.ap)>-1&&(!kw||String(Q.key==='m'?c.m:c.id).toLowerCase().indexOf(kw)>-1))
    .sort((a,b)=>b.dt.localeCompare(a.dt)||b.id.localeCompare(a.id));
}
const thumb=(c,cls)=>'<div class="'+cls+'"><div class="ct-pv">'+pv(c)+'</div></div>';
function renderList(){
  const L=filtered(),ps=PS[VIEW],tp=Math.max(1,Math.ceil(L.length/ps));if(PAGE>tp)PAGE=tp;
  const off=(PAGE-1)*ps,rows=L.slice(off,off+ps);
  $('rCnt').textContent=L.length;
  [...$('lView').children].forEach(b=>{const on=b.dataset.v===VIEW;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  $('vList').hidden=VIEW!=='list'||!L.length;$('vCard').hidden=VIEW!=='card'||!L.length;$('lEmpty').hidden=!!L.length;
  if(VIEW==='list')$('lBody').innerHTML=rows.map((c,i)=>'<tr><td>'+(off+i+1)+'</td><td class="l"><a class="cl-id" href="#'+c.id+'" data-id="'+c.id+'">'+c.id+'</a><small class="cl-m">'+esc(c.m)+'</small></td><td><a href="#'+c.id+'" data-id="'+c.id+'" class="cl-tlink" aria-label="'+c.id+' 상세">'+thumb(c,'cl-thumb')+'</a></td><td class="l">'+typePill(c.type)+'</td><td class="l arr">'+arrText(c.lay)+'</td><td class="l">'+c.use+'</td><td class="l">'+apPill(c.ap)+'</td><td class="l">'+esc(c.mby)+'</td><td class="l dt">'+c.dt+'</td></tr>').join('');
  else $('vCard').innerHTML=rows.map(c=>'<article class="cl-card"><a href="#'+c.id+'" data-id="'+c.id+'" class="cl-cthumb" aria-label="'+c.id+' 상세">'+thumb(c,'cl-cpv')+'</a><div class="cl-cb"><div class="cl-cr"><a class="cl-id" href="#'+c.id+'" data-id="'+c.id+'">'+c.id+'</a>'+apPill(c.ap)+'</div><div class="cl-cr">'+typePill(c.type)+'<span class="cl-arr">'+esc(c.lay)+'</span></div><p class="cl-cm">'+esc(c.m)+'</p><div class="cl-cf"><span>사용 '+c.use+'</span><span>'+esc(c.mby)+'</span><span>'+c.dt+'</span></div></div></article>').join('');
  let h='';if(L.length){h+='<button type="button" data-g="'+(PAGE-1)+'"'+(PAGE===1?' disabled':'')+' aria-label="이전">‹</button>';for(let i=1;i<=tp;i++)h+='<button type="button" class="'+(i===PAGE?'on':'')+'" data-g="'+i+'">'+i+'</button>';h+='<button type="button" data-g="'+(PAGE+1)+'"'+(PAGE===tp?' disabled':'')+' aria-label="다음">›</button>'}
  $('pager').innerHTML=h;
}
function openList(){showPage('list');setCrumb(['홈','주문 관리','주문 코너 유형 관리']);renderTabs();renderFilter();renderList()}

/* ===== 등록 · 상세 · 수정 ===== */
let mode='create',cur=null,st=null,DT='info';
const fold={basic:false,attr:false};
const ro=()=>mode==='view';
function fresh(){const t=TYPES[0].t,l=DEF_ARR[t];return {id:'',dom:TAB,m:'',type:t,lay:l,plat:['M'],use:'Y',ap:'임시저장',desc:'',ver:'',v:defaults(t,l)}}
function renderPv(){$('ctPv').innerHTML=pv(st)}

const INFO={markup:'FO 마크업에서 이 코너 유형을 찾는 키입니다. 영문 소문자 · 숫자 · 하이픈(-)만 씁니다.',type:'고객이 이 코너에서 무엇을 하는지(목적)로 나눕니다. 유형마다 고를 수 있는 배열이 다릅니다.',lay:'아이템을 어떤 형태로 놓을지 정합니다. 노출 개수는 주문 프로세스에서 정합니다.'};
const info=k=>' <i class="ct-i" title="'+esc(INFO[k])+'">i</i>';
const REQ=' <i class="ct-req">*</i>';
const th=lab=>'<div class="ct-th"><span class="ct-thl">'+lab+'</span></div>';
const tr=(lab,td,cls)=>'<div class="ct-tr'+(cls?' '+cls:'')+'">'+th(lab)+'<div class="ct-td">'+td+'</div></div>';
function radios(name,list,val,dis){
  return '<div class="ct-rg">'+list.map(x=>'<label class="'+(x[0]===val?'on':'')+(dis?' dis':'')+'"><input type="radio" name="'+name+'" value="'+esc(x[0])+'"'+(x[0]===val?' checked':'')+(dis?' disabled':'')+'>'+esc(x[1])+'</label>').join('')+'</div>';
}
function card(id,title,body,aside){
  return '<section class="ct-card'+(fold[id]?' closed':'')+'"><header class="ct-ch"><h2>'+title+'</h2>'+(aside||'')+'<button type="button" class="ct-fold" data-fold="'+id+'" aria-expanded="'+!fold[id]+'" aria-label="'+(fold[id]?'펼치기':'접기')+'"><svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg></button></header><div class="ct-cb">'+body+'</div></section>';
}
function basicCard(){
  const t=TYPES.find(x=>x.t===st.type),dis=ro(),allOn=st.plat.length===PLATS.length;
  let h='';
  h+=tr('코너 유형 ID',st.id?'<span class="ct-auto v">'+st.id+'</span>':'<span class="ct-auto">( 자동 생성 )</span>');
  h+=tr('코너 마크업 ID'+REQ+info('markup'),'<input class="ct-inp" id="ctM" data-f="m" maxlength="50" value="'+esc(st.m)+'" placeholder="코너 마크업 ID를 입력해 주세요"'+(dis?' disabled':'')+' autocomplete="off">');
  h+=tr('코너 유형'+REQ+info('type'),radios('ctType',TYPES.map(x=>[x.t,x.t]),st.type,dis)+'<p class="ct-purp"><b>목적</b>'+esc(t.p)+'</p>');
  h+=tr('배열·레이아웃'+info('lay'),radios('ctLay',t.arr.map(a=>[a,a]),st.lay,dis)+'<p class="ct-hint">배열은 <b>형태(레이아웃)</b>만 정합니다 · 노출 개수는 주문 프로세스에서.</p>');
  const plat='<div class="ct-rg"><label class="'+(allOn?'on':'')+'"><input type="checkbox" data-plat="ALL"'+(allOn?' checked':'')+(dis?' disabled':'')+'>전체</label>'+PLATS.map(p=>{const c=st.plat.indexOf(p[0])>-1;return '<label class="'+(c?'on':'')+'"><input type="checkbox" data-plat="'+p[0]+'"'+(c?' checked':'')+(dis?' disabled':'')+'>'+p[1]+'</label>'}).join('')+'</div>';
  h+='<div class="ct-tr two">'+th('운영 플랫폼')+'<div class="ct-td">'+plat+'</div>'+th('사용 여부'+REQ)+'<div class="ct-td">'+radios('ctUse',[['Y','사용'],['N','미사용']],st.use,dis)+'</div></div>';
  h+=tr('승인상태','<div class="ct-state">'+apPill(st.ap)+'<span>(읽기 전용)</span></div>');
  h+=tr('코너 유형 설명','<input class="ct-inp wide" data-f="desc" maxlength="100" value="'+esc(st.desc)+'" placeholder="100자 이내"'+(dis?' disabled':'')+'>');
  const res='<span class="ct-res">'+(st.id?'등록 정보':'등록 결과')+' · <b>'+esc(st.type)+' · '+esc(st.lay)+'</b></span>';
  return card('basic','코너 기본 정보','<div class="ct-tb">'+h+'</div>',res);
}
function attrCell(e){
  const dis=ro(),off=depOff(st,e.key);
  const tag=e.g==='고정'?' <span class="ct-tag fix">고정</span>':e.g==='옵션'?' <span class="ct-tag opt">옵션</span>':e.g==='TBD'?' <span class="ct-tag fix">TBD</span>':'';
  const head='<div class="ct-th"><span class="ct-thl'+(off?' off':'')+'">'+esc(e.name)+tag+'</span><small class="'+(off?'off':'')+'">('+e.key+')</small></div>';
  let v;
  if(isForm(e))v=radios('ct_'+e.key,optsOf(e).map(o=>[o,o]),st.v[e.key],dis);
  else if(e.g==='TBD')v='<span class="ct-hint">구성 정의 중 (TBD)</span>';
  else if(e.g!=='옵션')v=radios('ct_'+e.key,[['Y','Y'],['N','N']],'Y',true);
  else v=radios('ct_'+e.key,[['Y','Y'],['N','N']],off?'N':(st.v[e.key]?'Y':'N'),dis||off);
  return head+'<div class="ct-td"'+(off?' title="'+esc(attrOf(st,DEP[e.key]).name)+'이(가) Y일 때만 켤 수 있습니다"':'')+'>'+v+'</div>';
}
function attrCard(){
  const T=tplOf(st.type,st.lay);let h='';
  if(T.t===null)h='<div class="ct-notice">참고 화면에 이 배열의 코너 속성 정의가 없습니다.</div>';
  else if(!T.t.length)h='<div class="ct-notice">배너 소재(이미지·문구·랜딩)는 배너 캠페인 관리에서 등록해요. 이 코너에 어떤 배너를 노출할지는 주문 프로세스에서 선택합니다.</div>';
  else{
    if(T.fb)h+='<div class="ct-notice">'+esc(st.lay)+' 속성은 참고 화면 미확인으로, '+esc(T.fb)+' 속성 기준으로 표시합니다.</div>';
    ['c','i'].forEach(area=>{
      const list=T.t.filter(e=>e.area===area);if(!list.length)return;
      h+='<div class="ct-sec '+area+'"><b>'+(area==='c'?'코너(카드)':'컴포넌트(요소)')+'</b> · '+GRP_DESC[area]+'</div><div class="ct-tb">';
      // Y/N 속성은 두 개씩 한 줄, 형태 속성은 한 줄 전체
      let buf=[];const flush=()=>{if(buf.length)h+='<div class="ct-tr'+(buf.length>1?' two':'')+'">'+buf.map(attrCell).join('')+'</div>';buf=[]};
      list.forEach(e=>{if(isForm(e)){flush();h+='<div class="ct-tr">'+attrCell(e)+'</div>'}else{buf.push(e);if(buf.length===2)flush()}});
      flush();h+='</div>';
    });
  }
  return card('attr','코너 속성','<div class="ct-attrs">'+h+'</div>','<span class="ct-chs">이 코너 유형이 쓰는 표시 항목</span>');
}
function renderForm(){$('ctForm').innerHTML=basicCard()+attrCard();renderPv()}
function renderHead(){
  const v=mode!=='create';
  $('fTitle').textContent=mode==='create'?'주문 코너 유형 등록':(st.m||cur.m);
  $('fId').textContent=v?cur.id:'';
  $('fPills').innerHTML='<span class="pill p-bl">'+domName(st.dom)+'</span>'+(v?' <span class="pill '+(cur.use==='Y'?'p-gr':'p-gy')+'">'+(cur.use==='Y'?'사용':'미사용')+'</span> <span class="ver">v'+cur.ver+'</span>'+(mode==='edit'?' <span class="pill p-pu">수정 중</span>':''):'');
  $('fTabs').hidden=!v;$('bTopList').hidden=!v;
  $('hCnt').textContent=v?' '+(cur.hist||[]).length:'';
  [...$('fTabs').children].forEach(b=>b.classList.toggle('on',b.dataset.dt===DT));
  $('tInfo').hidden=DT!=='info';$('tHist').hidden=DT!=='hist';
  $('bDefault').disabled=ro();
  setCrumb(['홈','주문 관리','주문 코너 유형 관리',mode==='create'?'코너 유형 등록':mode==='edit'?'코너 유형 수정':'코너 유형 상세']);
}
const CHK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
function renderFoot(){
  let b='';
  if(mode==='create')b='<button type="button" class="ct-btn" data-act="cancel">취소</button><button type="button" class="ct-btn pri" data-act="save">'+CHK+'등록</button>';
  else if(mode==='edit')b='<button type="button" class="ct-btn" data-act="cancelEdit">취소</button><button type="button" class="ct-btn pri" data-act="saveEdit">'+CHK+'저장</button>';
  else if(DT==='info')b='<button type="button" class="ct-btn" data-act="del">삭제</button>'+(cur.ap==='승인요청'?'<button type="button" class="ct-btn" disabled style="opacity:.5;cursor:default">승인 요청 중</button>':'<button type="button" class="ct-btn pri" data-act="edit">수정</button>');
  $('fBtns').innerHTML=b;
}
function renderHist(){
  const H=cur&&cur.hist||[],d=v=>v?esc(v):'-';
  $('hBody').innerHTML=H.length?H.map((r,i)=>'<tr><td>'+(H.length-i)+'</td><td>'+apPill(r.st)+'</td><td>'+(r.ver?'v'+esc(r.ver):'')+'</td><td>'+d(r.req)+'</td><td>'+d(r.rqt)+'</td><td class="l">'+esc(r.why||'')+'</td><td>'+d(r.apr)+'</td><td>'+d(r.apt)+'</td><td class="l">'+esc(r.ar||'')+'</td></tr>').join('')
    :'<tr><td colspan="9" class="e">변경/승인 이력이 없습니다.</td></tr>';
}
function renderAll(){renderHead();renderForm();renderHist();renderFoot()}
function histOf(c){
  const rqt=c.dt.replace(/-/g,'.')+':00',base={req:c.mby,rqt,apr:APPROVER,ver:'',apt:'',ar:'',why:'코너 유형 최초 등록'};
  if(c.ap==='임시저장')return [{...base,st:'임시저장',why:'코너 유형 임시 저장',apr:''}];
  if(c.ap==='승인요청')return [{...base,st:'승인요청'}];
  if(c.ap==='반려')return [{...base,st:'반려',apt:rqt,ar:'목적 문구와 배열 기준 재확인 필요'}];
  return [{...base,st:'승인완료',ver:c.ver,apt:rqt}];
}
function openCreate(){mode='create';cur=null;st=fresh();DT='info';fold.basic=fold.attr=false;showPage('form');renderAll()}
function openDetail(id){cur=LIST.find(c=>c.id===id);if(!cur)return;if(!cur.hist)cur.hist=histOf(cur);mode='view';st=clone(cur);delete st.hist;DT='info';fold.basic=fold.attr=false;showPage('form');renderAll()}
function markErr(){const i=$('ctM');if(i){i.classList.add('err');i.focus()}}
function validate(){
  const m=String(st.m).trim();
  if(!m){toast('코너 마크업 ID를 입력해 주세요.');markErr();return false}
  if(!/^[a-z0-9][a-z0-9-]*$/.test(m)){toast('코너 마크업 ID는 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있습니다.');markErr();return false}
  if(LIST.some(c=>c.m===m&&(!cur||c.id!==cur.id))){toast('이미 등록된 코너 마크업 ID입니다.');markErr();return false}
  if(!st.plat.length){toast('운영 플랫폼을 하나 이상 선택해 주세요.');return false}
  if(tplOf(st.type,st.lay).t===null&&!confirm('이 배열은 코너 속성 정의가 없습니다(참고 화면 미확인). 그대로 진행할까요?'))return false;
  return true;
}
function save(){
  if(!validate())return;
  if(!confirm('「'+st.m.trim()+'」 코너 유형을 등록할까요? 등록하면 승인 요청이 올라갑니다.'))return;
  seq++;const id='CY'+String(seq).padStart(7,'0');
  const c=Object.assign(clone(st),{id,m:st.m.trim(),ap:'승인요청',dt:nowStr(),mby:EDITOR,ver:'1.0'});
  c.hist=[{st:'승인요청',ver:'',req:EDITOR,rqt:nowStr(true),why:'코너 유형 최초 등록',apr:APPROVER,apt:'',ar:''}];
  LIST.push(c);TAB=c.dom;PAGE=1;openList();toast('「'+c.m+'」 코너 유형을 등록했습니다. ('+id+')');
}
function diffs(){
  const L={m:'코너 마크업 ID',type:'코너 유형',lay:'배열·레이아웃',use:'사용 여부',desc:'코너 유형 설명'},d=[];
  Object.keys(L).forEach(k=>{if(String(cur[k])!==String(st[k]))d.push(L[k])});
  if(JSON.stringify(cur.plat)!==JSON.stringify(st.plat))d.push('운영 플랫폼');
  if(JSON.stringify(cur.v)!==JSON.stringify(st.v))d.push('코너 속성');
  return d;
}
function saveEdit(){
  const d=diffs();if(!d.length){toast('변경된 항목이 없습니다.');return}
  if(!validate())return;
  if(!confirm('변경 항목 '+d.length+'건('+d.join(', ')+')을 저장하고 승인을 요청할까요?'))return;
  const h=cur.hist;Object.assign(cur,clone(st),{m:st.m.trim(),ap:'승인요청',dt:nowStr(),mby:EDITOR});cur.hist=h;
  cur.hist.unshift({st:'승인요청',ver:'',req:EDITOR,rqt:nowStr(true),why:'코너 유형 수정 : '+d.join(', '),apr:APPROVER,apt:'',ar:''});
  mode='view';st=clone(cur);delete st.hist;renderAll();window.scrollTo(0,0);toast('승인을 요청했습니다.');
}
function del(){
  if(!confirm('「'+cur.m+'」 코너 유형을 삭제할까요? 삭제하면 되돌릴 수 없습니다.'))return;
  const i=LIST.indexOf(cur);if(i>-1)LIST.splice(i,1);const m=cur.m;cur=null;openList();toast('「'+m+'」 코너 유형을 삭제했습니다.');
}
function goList(){
  if(mode==='create'&&st&&(st.m||st.desc)&&!confirm('입력한 내용이 저장되지 않습니다. 목록으로 이동할까요?'))return;
  if(mode==='edit'&&diffs().length&&!confirm('수정 중인 내용이 저장되지 않습니다. 목록으로 이동할까요?'))return;
  if(location.hash)history.replaceState(null,'',location.pathname);
  openList();
}

/* ===== 이벤트 : 목록 ===== */
$('lTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;TAB=b.dataset.tab;PAGE=1;renderTabs();renderFilter();renderList()});
// 코너 유형 : '전체'는 다른 유형을 모두 해제, 유형을 고르면 '전체' 해제, 하나도 없으면 다시 '전체'
// 사용여부 · 승인상태 : '전체'가 모든 값을 켜고 끄며, 값을 모두 켜면 '전체'도 켜진다 (하나도 안 고르면 조회 결과 0건)
$('fTypes').addEventListener('change',e=>{const v=e.target.dataset.ty;if(!v)return;if(v==='ALL')F.types=[];else{F.types=F.types.filter(x=>x!==v);if(e.target.checked)F.types.push(v);if(F.types.length===TYPES.length)F.types=[]}renderFilter()});
$('fUse').addEventListener('change',e=>{const v=e.target.dataset.use;if(!v)return;if(v==='ALL')F.use=e.target.checked?['Y','N']:[];else{F.use=F.use.filter(x=>x!==v);if(e.target.checked)F.use.push(v)}renderFilter()});
$('fAp').addEventListener('change',e=>{const v=e.target.dataset.ap;if(!v)return;if(v==='ALL')F.ap=e.target.checked?APS.slice():[];else{F.ap=F.ap.filter(x=>x!==v);if(e.target.checked)F.ap.push(v);F.ap=APS.filter(a=>F.ap.indexOf(a)>-1)}renderFilter()});
$('fLay').addEventListener('change',e=>{F.lay=e.target.value});
$('fKey').addEventListener('change',e=>{F.key=e.target.value});
$('fKw').addEventListener('input',e=>{F.kw=e.target.value.trim();$('bClr').hidden=!e.target.value});
function search(){Q=clone(F);PAGE=1;renderList()}
$('fKw').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
$('bClr').onclick=()=>{F.kw='';$('fKw').value='';$('bClr').hidden=true;$('fKw').focus()};
$('bSearch').onclick=search;
$('bReset').onclick=()=>{Object.assign(F,{types:[],lay:'',use:['Y','N'],ap:APS.slice(),key:'i',kw:''});renderFilter();search()};
$('lView').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b)return;VIEW=b.dataset.v;store.set('ct-view',VIEW);PAGE=1;renderList()});
$('pager').addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b||b.disabled)return;PAGE=+b.dataset.g;renderList();$('pList').querySelector('.cl-rh').scrollIntoView({block:'start'})});
$('pList').addEventListener('click',e=>{const a=e.target.closest('a[data-id]');if(a){e.preventDefault();openDetail(a.dataset.id)}});
$('bCreate').onclick=openCreate;

/* ===== 이벤트 : 등록 · 상세 ===== */
$('bList').onclick=goList;$('bTopList').onclick=goList;
$('fTabs').addEventListener('click',e=>{const b=e.target.closest('[data-dt]');if(!b)return;if(mode==='edit'){toast('수정 중에는 다른 탭으로 이동할 수 없습니다.');return}DT=b.dataset.dt;renderHead();renderFoot()});
$('fBtns').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='save')save();
  else if(a==='cancel')goList();
  else if(a==='edit'){mode='edit';renderAll()}
  else if(a==='cancelEdit'){if(diffs().length&&!confirm('수정한 내용을 취소할까요?'))return;mode='view';st=clone(cur);delete st.hist;renderAll();toast('수정을 취소했습니다.')}
  else if(a==='saveEdit')saveEdit();
  else if(a==='del')del();
});
$('bDefault').onclick=()=>{if(ro())return;st.v=defaults(st.type,st.lay);renderForm();toast('코너 속성을 초기 설정값으로 돌렸습니다.')};
const FM=$('ctForm');
FM.addEventListener('input',e=>{const t=e.target;if(!t.dataset.f||ro())return;st[t.dataset.f]=t.value;if(t.id==='ctM'){t.classList.remove('err');if(mode!=='create')$('fTitle').textContent=t.value||cur.m}});
FM.addEventListener('change',e=>{
  const t=e.target;if(ro())return;
  if(t.name==='ctType'){st.type=t.value;st.lay=DEF_ARR[t.value];st.v=defaults(st.type,st.lay)}
  else if(t.name==='ctLay'){st.lay=t.value;st.v=defaults(st.type,st.lay)}
  else if(t.name==='ctUse')st.use=t.value;
  else if(t.dataset.plat){const p=t.dataset.plat;if(p==='ALL')st.plat=t.checked?PLATS.map(x=>x[0]):[];else{st.plat=st.plat.filter(x=>x!==p);if(t.checked)st.plat.push(p);st.plat=PLATS.map(x=>x[0]).filter(x=>st.plat.indexOf(x)>-1)}}
  else if(t.name&&t.name.indexOf('ct_')===0){const k=t.name.slice(3),e2=attrOf(st,k);st.v[k]=isForm(e2)?t.value:t.value==='Y'}
  else return;
  renderForm();   // 입력 중인 마크업 ID · 설명은 st에 이미 있어 다시 그려도 유지된다
});
FM.addEventListener('click',e=>{
  const b=e.target.closest('[data-fold]');if(!b)return;const k=b.dataset.fold;fold[k]=!fold[k];
  const sec=b.closest('.ct-card');sec.classList.toggle('closed',fold[k]);b.setAttribute('aria-expanded',String(!fold[k]));b.setAttribute('aria-label',fold[k]?'펼치기':'접기');
});

// 주소 #create 로 열면 등록 화면, #CY0000014 처럼 열면 해당 코너 유형 상세로 바로 연다 (공유 · 리뷰용). #card 는 카드 보기
const h0=decodeURIComponent(location.hash.slice(1));
if(h0==='card'){VIEW='card'}
if(h0==='create')openCreate();else if(LIST.some(c=>c.id===h0))openDetail(h0);else openList();
