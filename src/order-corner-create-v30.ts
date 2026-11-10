// @ts-nocheck
// 주문 코너 등록 v0.3 (주문 코너 관리 v0.3 안에서 여는 등록 · 수정 · 상세)
// 기준: ref/order_mockup_1110.html (주문 코너 유형 등록 목업)
//  - 기본 정보 : 코너 유형(5개) + 배열·레이아웃 조합이 코너 속성 목록을 정한다 (DATA['유형|배열'])
//  - 코너 속성 : 목업과 같은 표(코너(카드) / 컴포넌트(요소), 이름 · 고정/옵션 태그 · 키). 목업의 Y/N 라디오 대신 항목마다 입력란 · 셀렉트 · 버튼으로 값을 설정한다.
//    고정 항목은 늘 노출(값 필수), 옵션 항목은 값을 비우거나 '미사용'을 고르면 노출하지 않는다. 형태(없음/단일/복수 등)처럼 Y/N이 아닌 항목은 목업 그대로 라디오로 고른다.
//  - 설정 권한 · 연결 화면 · 선행 코너 · 코너 조건(노출 목록)은 v0.3 이전 구성을 그대로 둔다
// 저장 : FO 렌더러 · 주문 프로세스가 쓰는 필드(ui · q · opts · ctas · olist · perm · pre · scr)와 등록 상태 원본(form, m2=1)을 함께 남긴다.
// 예전 모델로 저장된 코너(form 없음 · 예전 form)는 열 때 가장 가까운 유형 · 배열로 바꿔 읽는다.
import "./order-corner-create-v30.css";
import { CORNERS, CORNER_EDITOR, esc, persistCorner } from "./order-corner-v22-data";
import { TYPES as OLD_TYPES, UI2V } from "./order-corner-types";

/* ===== 목업 정의 : 유형 · 배열 · 코너 속성 ===== */
const DATA={"상품형|세로형": [{"area": "c", "name": "배너", "key": "Banner", "g": "옵션", "src": "ref"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "ref"}, {"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 서브 타이틀", "key": "CornerSubTitle", "g": "옵션", "src": "new"}, {"area": "c", "name": "버튼 텍스트", "key": "ButtonText", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 선택 방식", "key": "SelectType", "g": "형태(없음/단일/복수)", "src": "new"}, {"area": "i", "name": "컴포넌트 이미지", "key": "ImageSrc", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 서브 타이틀", "key": "SubTitle", "g": "옵션", "src": "new"}, {"area": "i", "name": "컴포넌트 배지", "key": "BadgeGroup", "g": "옵션", "src": "new"}, {"area": "i", "name": "가격", "key": "TextPriceGroup", "g": "옵션", "src": "ref"}, {"area": "i", "name": "할인율", "key": "Discount", "g": "옵션", "src": "ref"}, {"area": "i", "name": "기간", "key": "Period", "g": "옵션", "src": "ref"}, {"area": "i", "name": "컴포넌트 캡션", "key": "Caption01", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 캡션2", "key": "Caption02", "g": "옵션", "src": "chg"}], "상품형|가로형": [{"area": "c", "name": "배너", "key": "Banner", "g": "옵션", "src": "ref"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "ref"}, {"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 서브 타이틀", "key": "CornerSubTitle", "g": "옵션", "src": "new"}, {"area": "c", "name": "버튼 텍스트", "key": "ButtonText", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 형태", "key": "Variants", "g": "형태(Small/Medium/Large)", "src": "ref"}, {"area": "i", "name": "컴포넌트 선택 방식", "key": "SelectType", "g": "형태(없음/단일/복수)", "src": "new"}, {"area": "i", "name": "컴포넌트 이미지", "key": "ImageSrc", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "고정", "src": "ref"}, {"area": "i", "name": "가격", "key": "Price", "g": "옵션", "src": "ref"}, {"area": "i", "name": "할인율", "key": "DiscountRate", "g": "옵션", "src": "ref"}, {"area": "i", "name": "컴포넌트 서브 텍스트", "key": "SubText", "g": "옵션", "src": "chg"}], "혜택·오퍼형|세로형": [{"area": "c", "name": "배너", "key": "Banner", "g": "옵션", "src": "ref"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "ref"}, {"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 서브 타이틀", "key": "CornerSubTitle", "g": "옵션", "src": "new"}, {"area": "c", "name": "버튼 텍스트", "key": "ButtonText", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 선택 방식", "key": "SelectType", "g": "형태(없음/단일/복수)", "src": "new"}, {"area": "i", "name": "컴포넌트 이미지", "key": "ImageSrc", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 서브 타이틀", "key": "SubTitle", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 배지", "key": "BadgeGroup", "g": "옵션", "src": "new"}, {"area": "i", "name": "가격", "key": "Price", "g": "옵션", "src": "new"}], "배너형|스와이프형": [], "업무 진입형|리스트형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 서브 타이틀", "key": "CornerSubTitle", "g": "옵션", "src": "new"}, {"area": "c", "name": "코너 안내 문구", "key": "Notice", "g": "옵션", "src": "new"}, {"area": "c", "name": "코너 전체 동의", "key": "AllAgree", "g": "옵션", "src": "new"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "new"}, {"area": "i", "name": "리스트 형태", "key": "ListVariants", "g": "형태(기본/항목·값)", "src": "new"}, {"area": "i", "name": "컴포넌트 선택 방식", "key": "SelectType", "g": "형태(없음/단일/복수)", "src": "new"}, {"area": "i", "name": "리스트", "key": "List", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 그룹 타이틀", "key": "GroupTitle", "g": "옵션", "src": "new"}, {"area": "i", "name": "컴포넌트 서브 타이틀", "key": "SubTitle", "g": "옵션", "src": "new"}, {"area": "i", "name": "컴포넌트 배지", "key": "BadgeGroup", "g": "옵션", "src": "new"}, {"area": "i", "name": "컴포넌트 상세 펼침", "key": "Detail", "g": "옵션", "src": "new"}], "업무 진입형|카테고리형": [{"area": "i", "name": "컴포넌트 선택 방식", "key": "SelectType", "g": "형태(없음/단일/복수)", "src": "new"}, {"area": "i", "name": "컴포넌트 아이콘", "key": "Icon", "g": "옵션", "src": "chg"}, {"area": "i", "name": "컴포넌트 라벨", "key": "Label", "g": "고정", "src": "ref"}], "업무 진입형|상태 안내형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 서브 타이틀", "key": "SubTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 배지", "key": "BadgeItem", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 아이콘", "key": "IconItem", "g": "고정", "src": "ref"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "new"}, {"area": "i", "name": "컴포넌트 정보 행", "key": "InfoRow", "g": "옵션", "src": "new"}], "업무 진입형|입력형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "arr"}, {"area": "c", "name": "코너 서브 타이틀", "key": "CornerSubTitle", "g": "옵션", "src": "arr"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 입력 필드", "key": "InputField", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 도움말", "key": "HelpText", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 등록 목록", "key": "RegisteredList", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 빈 상태 안내", "key": "Empty", "g": "옵션", "src": "arr"}], "콘텐츠 안내형|텍스트형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "arr"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 본문", "key": "Body", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 아이콘", "key": "Icon", "g": "옵션", "src": "arr"}], "콘텐츠 안내형|스텝형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "arr"}, {"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 스텝 번호", "key": "StepNo", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 본문", "key": "Body", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 이미지", "key": "ImageSrc", "g": "옵션", "src": "arr"}], "콘텐츠 안내형|아코디언형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "옵션", "src": "arr"}, {"area": "c", "name": "버튼 텍스트", "key": "ButtonText", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 탭", "key": "Tab", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 본문", "key": "Body", "g": "고정", "src": "arr"}], "콘텐츠 안내형|비교형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 비교 항목", "key": "CompareItem", "g": "고정", "src": "arr"}, {"area": "i", "name": "컴포넌트 그래프", "key": "Graph", "g": "옵션", "src": "arr"}, {"area": "i", "name": "컴포넌트 본문", "key": "Body", "g": "옵션", "src": "arr"}], "콘텐츠 안내형|후기형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "arr"}, {"area": "i", "name": "후기 구성", "key": "Review", "g": "TBD", "src": "arr"}], "업무 진입형|프로필형": [{"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 서브 타이틀", "key": "SubTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 프로필 이미지", "key": "ImageSrc", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 고객명", "key": "CustomerName", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 휴대폰 번호", "key": "Caption", "g": "고정", "src": "ref"}, {"area": "c", "name": "코너 버튼", "key": "Button", "g": "고정", "src": "ref"}], "콘텐츠 안내형|가로형": [{"area": "c", "name": "CTA", "key": "CallToAction", "g": "옵션", "src": "ref"}, {"area": "c", "name": "코너 타이틀", "key": "CornerTitle", "g": "고정", "src": "ref"}, {"area": "c", "name": "버튼 텍스트", "key": "ButtonText", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 이미지 형태", "key": "Variants", "g": "형태(Small/Medium/Large)", "src": "ref"}, {"area": "i", "name": "컴포넌트 이미지", "key": "ImageSrc", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 타이틀", "key": "ItemTitle", "g": "고정", "src": "ref"}, {"area": "i", "name": "컴포넌트 캡션·평점", "key": "Caption01", "g": "고정", "src": "ref"}], "배너형|단일형": []};
const MTYPES=[
 {t:'상품형',p:'판매해 수익이 나는 상품(요금제, 단말, 부가서비스, 보험, 충전 데이터 등) 후보를 탐색·선택하게 한다.',arr:['가로형','세로형','가로형(카테고리형)','세로형(카테고리형)']},
 {t:'혜택·오퍼형',p:'고객에게 주는 혜택(쿠폰, 할인, 제휴카드, 사은품, 요금제 포함 혜택)을 제안·선택하게 한다.',arr:['가로형','세로형','가로형(카테고리형)','세로형(카테고리형)']},
 {t:'배너형',p:'배너 캠페인 관리에서 등록한 배너를 불러와 노출한다. 단일형=배너 1개, 스와이프형=배너 여러 개.',arr:['단일형','스와이프형']},
 {t:'업무 진입형',p:'조회·변경·신청·납부 업무로 바로 이동시키거나 처리하고, 고객 상태·보유 정보를 안내한다.',arr:['카테고리형','리스트형','프로필형','상태 안내형','입력형']},
 {t:'콘텐츠 안내형',p:'이용 가이드, 설명, 유의사항, 추천 콘텐츠를 제공한다.',arr:['가로형','텍스트형','스텝형','아코디언형','비교형','후기형']},
];
const DEF_ARR={'상품형':'세로형','혜택·오퍼형':'세로형','배너형':'단일형','업무 진입형':'리스트형','콘텐츠 안내형':'텍스트형'};
const GRPDESC={c:'카드 전체에 1개 (배너·타이틀·버튼)',i:'리스트에서 반복되는 카드 1개'};
const PF=[['all','전체'],['mo','모바일'],['pc','데스크탑']];

/* 배열 → 속성 목록. (카테고리형) 배열은 목업에 따로 정의가 없으면 기본 배열 속성을 쓴다 */
function tplInfo(t,a){
  const k=t+'|'+a;if(DATA[k])return {list:DATA[k],note:''};
  const base=String(a||'').replace('(카테고리형)','');
  if(base!==a&&DATA[t+'|'+base])return {list:DATA[t+'|'+base],note:a+' 속성은 참고 화면 미확인으로, '+base+' 속성 기준으로 표시합니다.'};
  return {list:null,note:''};
}
const tplOf=(s=st)=>tplInfo(s.t,s.a).list;
const isForm=e=>e.g.indexOf('형태')===0;
const formOpts=e=>e.g.match(/\((.*)\)/)[1].split('/');

/* ===== 항목별 설정 방식 (목업 Y/N 대신) =====
   t : txt 입력란 · area 여러 줄 · sel 셀렉트 · cta 버튼(문구 + 동작) · badge 배지(문구 + 색) · img 이미지 등록 버튼 · list 반복 항목 목록 · tbd
   d : 기본값, o : 셀렉트 보기, n : 최대 글자 수. 옵션 셀렉트는 맨 앞에 '미사용'을 붙인다 */
const OFF='미사용';
const ACTS=['다음 단계로 이동','링크 이동','팝업 열기'];
const CT={
 Banner:{t:'sel',o:['주문 프로세스에서 선택','신규 가입 혜택 배너','기기변경 사은품 배너'],h:'배너 소재는 배너 캠페인 관리에서 등록해요'},
 CallToAction:{t:'cta',d:'다음',o:ACTS},Button:{t:'cta',d:'정보 변경',o:ACTS},
 CornerTitle:{t:'txt',d:'코너 타이틀',n:30},CornerSubTitle:{t:'txt',d:'코너 서브 타이틀',n:40},ButtonText:{t:'txt',d:'전체보기',n:20},
 Notice:{t:'txt',d:'안내 문구를 입력해 주세요',n:60},AllAgree:{t:'txt',d:'전체 동의',n:20},
 SubTitle:{t:'txt',d:'서브 타이틀',n:40},GroupTitle:{t:'txt',d:'그룹 타이틀',n:20},SubText:{t:'txt',d:'서브 텍스트',n:30},
 Caption01:{t:'txt',d:'캡션',n:30},Caption02:{t:'txt',d:'캡션2',n:30},HelpText:{t:'txt',d:'도움말 문구',n:40},Empty:{t:'txt',d:'등록된 내용이 없어요',n:30},
 Tab:{t:'txt',d:'전체, 추천',n:40,h:'쉼표로 구분'},Body:{t:'area',d:'본문 내용을 입력해 주세요',n:200},
 TextPriceGroup:{t:'txt',d:'99,999원',n:20},Price:{t:'txt',d:'99,999원',n:20},Discount:{t:'txt',d:'10%',n:6},DiscountRate:{t:'txt',d:'10%',n:6},
 Period:{t:'sel',o:['/월','/년','/일']},
 BadgeGroup:{t:'badge',d:'BEST',o:['기본','강조','회색']},BadgeItem:{t:'badge',d:'이용중',o:['기본','강조','회색']},
 ImageSrc:{t:'img',size:'1000×1000px'},
 Icon:{t:'sel',o:['기본','체크','정보','경고']},IconItem:{t:'sel',o:['기본','체크','정보','경고']},
 Detail:{t:'sel',o:['아코디언 펼침','상세 화면 이동']},InfoRow:{t:'sel',o:['3행','1행','2행','4행','5행']},
 RegisteredList:{t:'sel',o:['최대 3개','최대 1개','최대 5개','최대 10개']},Graph:{t:'sel',o:['막대','게이지']},
 StepNo:{t:'sel',o:['1, 2, 3','STEP 01','①, ②, ③']},
 CustomerName:{t:'sel',o:['홍*동 (마스킹)','홍길동']},Caption:{t:'sel',o:['010-****-5678 (마스킹)','010-1234-5678']},
 ItemTitle:{t:'list'},List:{t:'list'},Label:{t:'list'},CompareItem:{t:'list'},InputField:{t:'list'},
 Review:{t:'tbd'}
};
const ctOf=e=>CT[e.key]||{t:'txt',d:e.name,n:30};
// 반복 항목 목록(컴포넌트마다 하나씩)으로 쓰는 키. 한 조합에 하나만 쓴다(처음 나온 키). 노출 목록 · 선택지의 이름이 된다
const LISTK=['ItemTitle','List','Label','CompareItem','InputField'];
const listKey=(s=st)=>{const t=tplOf(s)||[];const e=t.find(x=>x.area==='i'&&LISTK.indexOf(x.key)>-1);return e?e.key:'';};
function sampleNames(s){
  const k=listKey(s);
  if(k==='ItemTitle')return s.t==='상품형'?['5GX 프라임','5GX 플래티넘','0 청년 69']:s.t==='혜택·오퍼형'?['쿠폰 할인','T 멤버십 할인','제휴카드 할인']:s.a==='스텝형'?['신청서 작성','본인 인증','개통 완료']:['이용 안내 1','이용 안내 2','이용 안내 3'];
  if(k==='List')return ['항목 1','항목 2','항목 3','항목 4'];
  if(k==='Label')return ['카테고리 1','카테고리 2','카테고리 3','카테고리 4','카테고리 5'];
  if(k==='CompareItem')return ['월 요금','데이터'];
  if(k==='InputField')return ['이름','휴대폰 번호'];
  return [];
}
const ITEM_MAX=20;

/* ===== 상태 ===== */
let st=null,opts=null;
const $=id=>document.getElementById(id);
const newUid=()=>'i'+Math.random().toString(36).slice(2,9);
/* 속성 기본값 : 목업 defaults()와 같다 (형태는 첫 값, 선택 방식은 단일, 나머지는 기본값으로 채워 노출) */
function defaults(s=st){
  s.v={};
  (tplOf(s)||[]).forEach(e=>{
    if(isForm(e)){const o=formOpts(e);s.v[e.key]=e.key==='SelectType'?'단일':o[0];return;}
    const c=ctOf(e);
    if(c.t==='cta'||c.t==='badge')s.v[e.key]={l:c.d,a:c.o[0]};
    else if(c.t==='sel')s.v[e.key]=c.o[0];
    else if(c.t==='img')s.v[e.key]={list:[{n:'sample.png',u:''}],alt:''};
    else if(c.t==='txt'||c.t==='area')s.v[e.key]=c.d;
  });
  s.items=sampleNames(s).map(n=>({uid:newUid(),n}));s.def=0;
}
function setTA(t,a){st.t=t;st.a=a||DEF_ARR[t];defaults();}
function fresh(){st={m2:1,name:'',markup:'',pf:{all:false,mo:true,pc:false},use:'N',t:'상품형',a:'세로형',perm:PERM_DEF,scr0:'',scr:[],pre:[]};defaults();}
/* 노출 여부 : 고정 · 형태는 늘, 옵션은 값이 있을 때(셀렉트는 '미사용'이 아닐 때) */
function hasVal(e,s){
  const c=ctOf(e),v=s.v[e.key];
  if(c.t==='list')return (s.items||[]).length>0;
  if(c.t==='cta'||c.t==='badge')return !!(v&&String(v.l||'').trim());
  if(c.t==='sel')return !!v&&v!==OFF;
  if(c.t==='tbd')return true;
  if(c.t==='img')return imgOf(v).list.length>0;
  return !!String(v==null?'':v).trim();
}
function onK(k,s=st){const e=(tplOf(s)||[]).find(x=>x.key===k);if(!e)return false;if(e.g!=='옵션')return true;return hasVal(e,s);}
/* 이미지 값 : {list:[{n 파일명, u 데이터 URL}], alt 대체 텍스트}. 첫 장이 대표. 예전 값(파일명 문자열)도 읽는다 */
const IMG_MAX=4,ALT_MAX=20;
function imgOf(v){if(v&&typeof v==='object'&&Array.isArray(v.list))return v;return {list:v?[{n:String(v),u:''}]:[],alt:''};}
const pvImg=(s,cls,ph)=>{const m=imgOf(s.v.ImageSrc).list[0];return '<div class="mk-ph '+cls+'">'+(m&&m.u?'<img src="'+m.u+'" alt="'+esc(imgOf(s.v.ImageSrc).alt||'')+'">':ph)+'</div>';};
const tx=(k,s=st)=>{const v=s.v[k];return v&&typeof v==='object'?v.l:v;};
const selType=(s=st)=>s.v.SelectType||'';

/* ===== 미리보기 : 목업 pv()와 같은 구성, 키 이름 대신 설정한 값을 보여준다 ===== */
function pvM(s){
  const t=tplOf(s),a=s.a,ty=s.t,on=k=>onK(k,s),T=k=>esc(tx(k,s)||''),its=(s.items||[]).filter(it=>!(s._hide||[]).includes(it.uid));
  const nm=(it,i)=>esc(it.n||('항목 '+(i+1)));
  if(t===null)return '<div class="mk-na">참고 화면 미확인</div>';
  const ctl=i=>{const x=selType(s);return x==='단일'?'<span class="mk-ctl r'+(i===s.def?' on':'')+'"></span>':x==='복수'?'<span class="mk-ctl c'+(i===s.def?' on':'')+'"></span>':'';};
  const bdg=()=>on('BadgeGroup')||on('BadgeItem')?'<span class="mk-bdg '+({강조:'hi',회색:'gr'}[(s.v.BadgeGroup||s.v.BadgeItem||{}).a]||'')+'">'+esc((s.v.BadgeGroup||s.v.BadgeItem||{}).l||'')+'</span>':'';
  const head=()=>{let h='';
    if(on('Banner'))h+='<div class="mk-ph mk-banner">'+T('Banner')+'</div>';
    if(on('CornerTitle'))h+='<div class="mk-ct">'+T('CornerTitle')+'</div>';
    if(on('CornerSubTitle'))h+='<div class="mk-cs">'+T('CornerSubTitle')+'</div>';
    if(on('ButtonText'))h+='<div class="mk-bt">'+T('ButtonText')+' ›</div>';
    if(on('Notice'))h+='<div class="mk-nt">'+T('Notice')+'</div>';
    if(on('AllAgree'))h+='<div class="mk-row b"><span class="mk-ctl c on"></span>'+T('AllAgree')+'</div>';
    return h;};
  const cta=()=>on('CallToAction')?'<div class="mk-cta">'+T('CallToAction')+' ›</div>':'';
  const price=()=>(on('TextPriceGroup')||on('Price'))?'<div class="mk-pr">'+(on('Discount')||on('DiscountRate')?'<em>'+T(on('Discount')?'Discount':'DiscountRate')+'</em>':'')+T(on('TextPriceGroup')?'TextPriceGroup':'Price')+(on('Period')?' <span>'+T('Period')+'</span>':'')+'</div>':'';
  const vItem=(it,i)=>{
    let b='<div class="mk-it">'+nm(it,i)+bdg()+'</div>';
    if(on('SubTitle'))b+='<div class="mk-st">'+T('SubTitle')+'</div>';
    b+=price();
    if(on('Caption01'))b+='<div class="mk-cap">'+T('Caption01')+(on('Caption02')?' | '+T('Caption02'):'')+'</div>';
    return '<div class="mk-row">'+ctl(i)+(on('ImageSrc')?pvImg(s,'mk-img','▣'):'')+'<div class="mk-body">'+b+'</div></div>';};
  if(ty==='배너형')return '<div class="mk-ph mk-banner tall">배너 캠페인 관리 배너</div>'+(a==='스와이프형'?'<div class="mk-cap r">1 / 3</div>':'');
  if(a==='프로필형')return '<div class="mk-row c">'+(on('ImageSrc')?pvImg(s,'mk-ico','◯'):'')+'<div class="mk-body"><div class="mk-it">'+T('CornerTitle')+' <span class="mk-st n">'+T('SubTitle')+'</span></div><div class="mk-st">'+esc(String(tx('CustomerName',s)||'').replace(/ \(.*\)/,''))+' · '+esc(String(tx('Caption',s)||'').replace(/ \(.*\)/,''))+'</div></div>'+(on('Button')?'<span class="mk-chp">'+T('Button')+'</span>':'')+'</div>';
  if(a==='상태 안내형'){let h='<div class="mk-row c"><div class="mk-body"><div class="mk-ct">'+T('CornerTitle')+bdg()+'</div><div class="mk-st">'+T('SubTitle')+'</div></div><div class="mk-ph mk-ico">'+T('IconItem')+'</div></div>';
    if(on('InfoRow')){const n=parseInt(tx('InfoRow',s),10)||3;h+=Array.from({length:n},(_,i)=>'<div class="mk-kv"><span>Label 0'+(i+1)+'</span><span>Value</span></div>').join('');}
    return h+cta();}
  if(a==='카테고리형'){const x=selType(s);return '<div class="mk-chips">'+its.map((it,i)=>'<span class="mk-chp'+(x!=='없음'&&(i===s.def||(x==='복수'&&i===2))?' on':'')+'">'+(on('Icon')?'<i></i>':'')+nm(it,i)+'</span>').join('')+'</div>';}
  if(a.indexOf('가로형')===0){const z=String(tx('Variants',s)||'Small')[0];
    return head()+(a.indexOf('카테고리')>-1?'<div class="mk-chips"><span class="mk-chp on">카테고리 1</span><span class="mk-chp">카테고리 2</span></div>':'')
      +'<div class="mk-hs">'+its.map((it,i)=>'<div class="mk-card '+z+'">'+(on('ImageSrc')?pvImg(s,'','▣'):'')+'<div class="mk-it s">'+nm(it,i)+'</div>'+(on('Price')?'<div class="mk-pr s">'+(on('DiscountRate')?'<em>'+T('DiscountRate')+'</em>':'')+T('Price')+'</div>':'')+(on('SubText')?'<div class="mk-cap">'+T('SubText')+'</div>':'')+(on('Caption01')&&ty==='콘텐츠 안내형'?'<div class="mk-cap">'+T('Caption01')+'</div>':'')+'</div>').join('')+'</div>'+cta();}
  if(a==='입력형'){let h=head();its.forEach((it,i)=>{h+='<div class="mk-lbl">'+nm(it,i)+'</div><div class="mk-input">'+nm(it,i)+josa(it.n||'항목','을','를')+' 입력해 주세요</div>';if(i===its.length-1&&on('HelpText'))h+='<div class="mk-cap up">'+T('HelpText')+'</div>';});
    if(on('RegisteredList'))h+='<div class="mk-lbl">등록 목록 · '+T('RegisteredList')+'</div><div class="mk-kv"><span>010-1234-5678</span><span>삭제</span></div>';
    if(on('Empty'))h+='<div class="mk-cap ctr">'+T('Empty')+'</div>';return h+cta();}
  if(a==='텍스트형'){const rows=its.length?its:[{n:''}];return head()+rows.map((it,i)=>'<div class="mk-body">'+(on('ItemTitle')&&it.n?'<div class="mk-it">'+(on('Icon')?'● ':'')+esc(it.n)+'</div>':'')+'<div class="mk-st">'+T('Body')+'</div></div>').join('')+cta();}
  if(a==='스텝형'){const f=tx('StepNo',s)||'';const no=i=>f.indexOf('STEP')===0?'STEP 0'+(i+1):f.indexOf('①')===0?'①②③④⑤⑥⑦⑧⑨⑩'[i]||(i+1):String(i+1);
    return head()+its.map((it,i)=>'<div class="mk-step"><b class="'+(f.indexOf('STEP')===0?'w':'')+'">'+no(i)+'</b><div class="mk-body"><div class="mk-it">'+nm(it,i)+'</div>'+(on('Body')?'<div class="mk-st">'+T('Body')+'</div>':'')+(on('ImageSrc')&&i===0?pvImg(s,'mk-simg','▣'):'')+'</div></div>').join('')+cta();}
  if(a==='아코디언형')return head()+(on('Tab')?'<div class="mk-tbs">'+String(tx('Tab',s)).split(',').map(x=>'<span>'+esc(x.trim())+'</span>').join('')+'</div>':'')+its.map((it,i)=>'<div class="mk-acc"><span>'+nm(it,i)+'</span><span>'+(i===0?'︿':'﹀')+'</span></div>'+(i===0?'<div class="mk-st">'+T('Body')+'</div>':'')).join('');
  if(a==='비교형')return head()+its.map((it,i)=>'<div class="mk-lbl">'+nm(it,i)+'</div>'+(on('Graph')?(tx('Graph',s)==='게이지'?'<div class="mk-gauge"><i style="width:'+(i?55:85)+'%"></i></div>':'<div class="mk-bar" style="width:'+(i?55:85)+'%"></div>'):'')+'<div class="mk-kv"><span>Before → After</span><span>Value</span></div>').join('')+(on('Body')?'<div class="mk-st">'+T('Body')+'</div>':'');
  if(a==='후기형')return head()+'<div class="mk-na">후기 구성 TBD</div>';
  if(a==='리스트형'){let h=head();
    if(tx('ListVariants',s)==='항목·값'){h+=its.map((it,i)=>'<div class="mk-kv"><span>'+nm(it,i)+'</span><span>Value</span></div>').join('');if(on('Detail'))h+='<div class="mk-acc"><span>'+T('Detail')+'</span><span>﹀</span></div>';}
    else{if(on('GroupTitle'))h+='<div class="mk-lbl b">'+T('GroupTitle')+'</div>';
      h+=its.map((it,i)=>'<div class="mk-row">'+ctl(i)+'<div class="mk-body"><div class="mk-it n">'+nm(it,i)+bdg()+'</div>'+(on('SubTitle')?'<div class="mk-st">'+T('SubTitle')+'</div>':'')+'</div>'+(on('Detail')?'<span class="mk-cap">›</span>':'')+'</div>').join('');}
    return h+cta();}
  let h=head();if(a.indexOf('카테고리')>-1)h+='<div class="mk-chips"><span class="mk-chp on">카테고리 1</span><span class="mk-chp">카테고리 2</span></div>';
  return h+its.map(vItem).join('')+cta();
}
function pvHTML(){return '<div class="mk-pv">'+pvM(st)+'</div>';}
function renderPv(){$('ccPv').innerHTML=pvView(pvHTML);}
/* 코너 조건 > 노출 목록(항상 노출)에서 숨긴 항목은 미리보기에서 뺀다 */
function pvView(fn){
  if(!(st.ol&&st.ol.mode==='always'&&st.ol.hide.length))return fn();
  st._hide=st.ol.hide;try{return fn();}finally{delete st._hide;}
}

/* ===== 폼 공통 ===== */
const req='<i class="cc-req">*</i>';
const tr=(th,td,cls)=>'<div class="cc-tr'+(cls?' '+cls:'')+'"><div class="cc-th">'+th+'</div><div class="cc-td">'+td+'</div></div>';
const radios=(name,list,val,dis)=>'<div class="cc-rg">'+list.map(x=>'<label class="'+(x[0]===val?'on':'')+(dis?' dis':'')+'"><input type="radio" name="'+name+'" value="'+esc(x[0])+'"'+(x[0]===val?' checked':'')+(dis?' disabled':'')+'>'+esc(x[1])+'</label>').join('')+'</div>';
const tr2=(a,b,c,d)=>'<div class="cc-tr two"><div class="cc-th">'+a+'</div><div class="cc-td">'+b+'</div><div class="cc-th">'+c+'</div><div class="cc-td">'+d+'</div></div>';
const hint=t=>'<p class="cc-hint">'+t+'</p>';
const val=v=>String(v==null?'':v).trim()?'<span class="cc-val">'+esc(v)+'</span>':'<span class="cc-val none">-</span>';
const apOf=()=>EDIT?(EDIT.pending?'승인 대기':'승인 완료'):'임시저장';

/* 코너 마크업 ID : 저장할 때 유형 · 배열 코드 + 코너 번호로 만든다 (예: OC_PRD_V_0341). 수정할 때 유형 · 배열이 그대로면 처음 값을 유지한다 */
const MK_T={'상품형':'PRD','혜택·오퍼형':'OFR','배너형':'BNR','업무 진입형':'TSK','콘텐츠 안내형':'CNT'};
const MK_A={'가로형':'H','세로형':'V','가로형(카테고리형)':'HC','세로형(카테고리형)':'VC','단일형':'SG','스와이프형':'SW','카테고리형':'CAT','리스트형':'LST','프로필형':'PRF','상태 안내형':'STS','입력형':'INP','텍스트형':'TXT','스텝형':'STP','아코디언형':'ACC','비교형':'CMP','후기형':'RVW'};
const markupOf=(id,s=st)=>'OC_'+(MK_T[s.t]||'ETC')+'_'+(MK_A[s.a]||'X')+'_'+String(id).replace(/\D/g,'').slice(-4);
const markupKeep=()=>!!(EDIT&&EDIT.markup&&EDIT.markup.indexOf('OC_'+(MK_T[st.t]||'ETC')+'_'+(MK_A[st.a]||'X')+'_')===0);
/* ===== 기본 정보 : 목업 항목 (코너 ID · 마크업 ID · 유형 · 배열·레이아웃 · 운영 플랫폼 | 사용 여부 · 승인상태) + 코너명. 목적 · 배열 안내 · 코너 설명은 뺐다 ===== */
function basicCard(){
  const ty=MTYPES.find(x=>x.t===st.t);
  // 코너 ID | 코너 마크업 ID 한 줄 (둘 다 저장할 때 자동 생성)
  let h=tr2('코너 ID','<span class="cc-auto">'+(EDIT?esc(EDIT.id):'( 자동 생성 )')+'</span>','코너 마크업 ID','<span class="cc-auto">'+(EDIT&&EDIT.markup&&markupKeep()?esc(EDIT.markup):'( 자동 생성 )')+'</span>');
  h+=tr('코너명'+req,'<input class="cc-inp cc-name" data-f="name" maxlength="30" value="'+esc(st.name)+'" placeholder="코너명을 입력해 주세요">');
  h+=tr('코너 유형'+req,radios('ccType',MTYPES.map(x=>[x.t,x.t]),st.t));
  h+=tr('배열·레이아웃',radios('ccArr',ty.arr.map(a=>[a,a]),st.a));
  // 운영 플랫폼 | 사용 여부 한 줄
  h+=tr('운영 플랫폼','<div class="cc-rg">'+PF.map(p=>'<label class="'+(st.pf[p[0]]?'on':'')+'"><input type="checkbox" data-pf="'+p[0]+'"'+(st.pf[p[0]]?' checked':'')+'>'+p[1]+'</label>').join('')+'</div>');
  // 사용 여부 | 설정 권한 한 줄 (설정 권한은 별도 영역 없이 기본 정보에 둔다 · 설명 문구 없음)
  h+=tr2('사용 여부'+req,radios('ccUse',[['Y','사용'],['N','미사용']],st.use),'설정 권한',radios('ccPerm',PERM.map(p=>[p[0],p[1]]),permOf()));
  h+=tr('승인상태','<span class="cc-appill">'+esc(apOf())+'</span><span class="cc-ro">(읽기 전용)</span>');
  return acc('basic','기본 정보','<div class="cc-tb">'+h+'</div>','<span class="cc-on">'+esc(st.t+(st.a?' · '+st.a:''))+'</span>');
}

/* ===== 코너 속성 : 상품 전시 관리(product-v024) '전시 정보' 표와 같은 모양 =====
   한 줄에 항목 하나 (왼쪽 항목명 · 고정/옵션 태그 · 글자 수 · 키 | 오른쪽 설정). 그룹(코너(카드) · 컴포넌트(요소))은 표 위 소제목으로 나눈다.
   입력란 · 셀렉트 · 라디오 · 버튼 · 안내 문구(*)도 상품 전시와 같은 스타일 (CSS .mk-*) */
// 항목명 : 그룹 소제목(코너 · 컴포넌트)과 겹치는 앞말은 뺀다. 고정 항목은 필수 표시(*), 키는 마우스 오버로만
const shortN=e=>e.name.replace(e.area==='i'?/^컴포넌트\s*/:/^코너\s*/,'')||e.name;
const josa=(w,a,b)=>{const ch=String(w).trim().slice(-1).charCodeAt(0)-0xAC00;return ch>=0&&ch<=11171?(ch%28?a:b):b;};
const enter=e=>{const n=shortN(e);return n+josa(n,'을','를')+' 입력하세요';};
const cntOf=(e,v)=>{if(isForm(e))return '';const c=ctOf(e);if(c.t==='txt'||c.t==='area')return String(v||'').length+'/'+c.n;if(c.t==='cta'||c.t==='badge')return String((v||{}).l||'').length+'/'+(c.t==='cta'?20:10);return '';};   // 글자 수는 문구 입력 항목만
function aLabel(e,cnt){
  return '<div class="mk-l" title="'+esc(e.name+' ('+e.key+')'+(e.g==='옵션'?' · 옵션':e.g==='고정'?' · 고정':''))+'"><span class="mk-ln">'+esc(shortN(e))+(e.g==='고정'?'<i class="mk-req" aria-label="필수">*</i>':'')+(e.g==='TBD'?' <span class="mk-tg tbd">TBD</span>':'')+'</span>'+(cnt?'<span class="mk-cnt" id="mkc_'+e.key+'">('+cnt+')</span>':'')+'</div>';
}
const selHTML=(k,list,v,opt,lab)=>'<select data-v="'+k+'" aria-label="'+esc(lab||k)+'">'+(opt?[OFF]:[]).concat(list).map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';
const fhint=t=>'<p class="mk-hint">'+t+'</p>';
function aCtl(e){
  const k=e.key,c=ctOf(e),v=st.v[k],opt=e.g==='옵션',nm=esc(e.name);
  const offH='';   // 옵션 안내는 표 위 한 줄로
  if(isForm(e))return '<span class="mk-radio" role="radiogroup" aria-label="'+nm+'">'+formOpts(e).map(x=>'<label><input type="radio" name="fv_'+k+'" value="'+esc(x)+'" data-fv="'+k+'"'+(v===x?' checked':'')+'>'+esc(x)+'</label>').join('')+'</span>';
  if(c.t==='txt')return '<input type="text" data-v="'+k+'" maxlength="'+c.n+'" value="'+esc(v||'')+'" placeholder="'+esc(enter(e))+'" aria-label="'+nm+'">'+offH+(c.h?fhint('*'+esc(c.h)):'');
  if(c.t==='area')return '<textarea class="mk-ta" data-v="'+k+'" maxlength="'+c.n+'" placeholder="'+esc(enter(e))+'" aria-label="'+nm+'">'+esc(v||'')+'</textarea>'+offH;
  if(c.t==='sel')return selHTML(k,c.o,v,opt,e.name)+(c.h?fhint('*'+esc(c.h)):'');
  if(c.t==='cta'||c.t==='badge'){const cta=c.t==='cta';
    return '<div class="mk-f"><input type="text" data-v="'+k+'.l" maxlength="'+(cta?20:10)+'" value="'+esc((v||{}).l||'')+'" placeholder="'+(cta?'버튼 문구를':'배지 문구를')+' 입력하세요" aria-label="'+nm+' 문구"><select data-v="'+k+'.a" aria-label="'+nm+(cta?' 동작':' 색')+'">'+c.o.map(x=>'<option'+(x===(v||{}).a?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>'+offH;}
  if(c.t==='img')return imgHTML(e);
  if(c.t==='list')return itemsHTML(e);
  return '<span class="mk-tbdv">구성 확정 전(TBD)이에요</span>';
}
/* 이미지 : 상품 전시 관리(product-v024) 전시 정보 '이미지'와 같은 기능
   타일(96px, 첫 장 대표 · 마우스 오버 '대표로' · × 삭제) + '대표 이미지 / 추가' 타일(최대 4장) · 등록 팝업(끌어다 놓기 · 클릭 선택 · JPG/PNG/WEBP · 5MB · 최근 등록) · 대체 텍스트 20자 · 권장 형식 안내 */
function imgHTML(e){
  const k=e.key,c=ctOf(e),v=imgOf(st.v[k]),L=v.list,req=e.g!=='옵션';
  const tile=(m,i)=>'<div class="mk-tile'+(i===0?' rep':'')+'">'+(m.u?'<img src="'+m.u+'" alt="'+esc(e.name)+' '+(i+1)+'">':'<div class="mk-tph"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5L6 20"/></svg><span>'+esc(m.n)+'</span></div>')
    +(i===0?'<span class="rb">대표</span>':'<button type="button" class="mkr" data-immain="'+k+':'+i+'">대표로</button>')
    +'<button type="button" class="rm" data-imrm="'+k+':'+i+'" aria-label="'+esc(e.name)+' '+(i+1)+' 삭제">×</button></div>';
  const add=L.length<IMG_MAX?'<button type="button" class="mk-tile add" data-imadd="'+k+'" aria-label="'+esc(e.name)+' '+(L.length?'추가':'대표')+' 이미지 등록"><b>+</b><small>'+(L.length?'추가':'대표 이미지')+'</small></button>':'';
  return '<div class="mk-dimg"><div class="mk-drow"><div class="mk-dh">'+(req?'<span class="mk-rq">필수</span>':'<span class="mk-op">선택</span>')+'<span class="cntx">'+L.length+'/'+IMG_MAX+'</span><small>'+esc(c.size||'')+'</small></div>'
    +'<div class="mk-dl">'+L.map(tile).join('')+add+'</div></div></div>'
    +'<div class="mk-alt"><input type="text" data-imalt="'+k+'" value="'+esc(v.alt||'')+'" maxlength="'+ALT_MAX+'" placeholder="웹접근성을 위한 대체 Text를 '+ALT_MAX+'자 이내로 입력하세요" aria-label="이미지 대체 텍스트"></div>'
    +'<ul class="mk-guide"><li>권장형식 : JPG, PNG, WEBP · 5MB 이하</li></ul>';
}
/* 이미지 등록 팝업 (상품 전시 openImgDlg와 같은 구성 · 문구). 저장소 용량 때문에 긴 변 800px로 줄여 담는다 */
let RECENT=[],mkBack=null;
function shrink(src,cb){const im=new Image();im.onload=()=>{const m=800,r=Math.min(1,m/Math.max(im.width,im.height));if(r>=1){cb(src);return;}const cv=document.createElement('canvas');cv.width=Math.round(im.width*r);cv.height=Math.round(im.height*r);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);cb(cv.toDataURL('image/webp',.86));};im.onerror=()=>cb(src);im.src=src;}
function imgDlg(k){
  const e=(tplOf()||[]).find(x=>x.key===k),L=imgOf(st.v[k]).list,title=shortN(e)+' '+(L.length?'추가':'대표')+' 이미지 등록';
  let md=document.getElementById('mkMd');
  if(!md){md=document.createElement('div');md.id='mkMd';md.className='mk-modal';md.hidden=true;
    md.innerHTML='<div class="mk-mbox" role="dialog" aria-modal="true" aria-labelledby="mkMdT" tabindex="-1"><header><b id="mkMdT"></b><span class="pill" id="mkMdS"></span><button type="button" class="mk-mclose" data-mkx aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header><div class="mk-mbody" id="mkMdB"></div><footer id="mkMdF"></footer></div>';
    document.body.appendChild(md);
    md.addEventListener('click',ev=>{if(ev.target===md||ev.target.closest('[data-mkx]'))closeDlg();});
    md.addEventListener('keydown',ev=>{if(ev.key==='Escape')closeDlg();});}
  let pick=null;
  const toast=m=>opts&&opts.toast&&opts.toast(m);
  const draw=()=>{
    document.getElementById('mkMdT').textContent=title;document.getElementById('mkMdS').textContent=ctOf(e).size||'';
    document.getElementById('mkMdB').innerHTML='<label class="mk-drop'+(pick?' has':'')+'" id="mkDz">'+(pick?'<img src="'+pick.u+'" alt="선택한 이미지">':'')+'<span><b>'+(pick?'다른 이미지로 바꾸기':'이미지를 끌어다 놓거나 클릭해서 선택')+'</b><small>JPG · PNG · WEBP · 5MB 이하'+(ctOf(e).size?' · '+esc(ctOf(e).size):'')+'</small></span><input type="file" id="mkDzF" accept="image/png,image/jpeg,image/webp" hidden></label>'
      +(RECENT.length?'<div class="mk-pt2">최근 등록</div><div class="mk-igrid">'+RECENT.map((x,i)=>'<button type="button" data-ri="'+i+'" class="'+(pick&&pick.u===x.u?'on':'')+'"><img src="'+x.u+'" alt="최근 등록 이미지 '+(i+1)+'"><span>'+esc(x.n)+'</span></button>').join('')+'</div>':'');
    document.getElementById('mkMdF').innerHTML='<button type="button" class="btn mk-btn" data-mkx>취소</button><button type="button" class="btn mk-btn pri" id="mkOk"'+(pick?'':' disabled')+'>등록</button>';
    const take=f=>{if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)){toast('JPG · PNG · WEBP만 올릴 수 있어요');return;}if(f.size>5*1024*1024){toast('5MB 이하 이미지만 올릴 수 있어요');return;}
      const r=new FileReader();r.onload=()=>shrink(r.result,u=>{pick={n:f.name,u,up:true};draw();});r.readAsDataURL(f);};
    document.getElementById('mkDzF').addEventListener('change',ev=>take(ev.target.files[0]));
    const dz=document.getElementById('mkDz');
    dz.addEventListener('dragover',ev=>{ev.preventDefault();dz.classList.add('over');});dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',ev=>{ev.preventDefault();dz.classList.remove('over');take(ev.dataTransfer.files[0]);});
    document.querySelectorAll('#mkMdB [data-ri]').forEach(b=>b.addEventListener('click',()=>{pick=Object.assign({},RECENT[+b.dataset.ri]);draw();}));
    document.getElementById('mkOk').addEventListener('click',()=>{if(!pick)return;
      if(pick.up)RECENT=[{n:pick.n,u:pick.u}].concat(RECENT.filter(x=>x.u!==pick.u)).slice(0,6);
      const v=imgOf(st.v[k]);v.list.push({n:pick.n,u:pick.u});st.v[k]=v;closeDlg();render();toast(shortN(e)+' '+(v.list.length===1?'대표':'추가')+' 이미지를 등록했어요');});
  };
  mkBack=document.activeElement;md.hidden=false;draw();md.querySelector('.mk-mbox').focus();
}
function closeDlg(){const md=document.getElementById('mkMd');if(md)md.hidden=true;if(mkBack&&mkBack.focus)mkBack.focus();}
/* 반복 항목 : 컴포넌트 한 개마다 이름 하나. 선택 방식이 단일 · 복수면 '기본' 선택 지정 */
function itemsHTML(e){
  const L=st.items,sel=selType()&&selType()!=='없음';
  return '<div class="mk-items">'+L.map((it,i)=>'<div class="mk-irow">'
    +'<span class="mk-ino">'+(i+1)+'</span>'
    +'<input type="text" data-it="'+i+'" data-k="n" maxlength="30" value="'+esc(it.n)+'" placeholder="'+esc(enter(e))+'" aria-label="'+esc(e.name)+' '+(i+1)+'">'
    +(sel?'<label class="mk-def'+(st.def===i?' on':'')+'"><input type="radio" name="ccDef" value="'+i+'"'+(st.def===i?' checked':'')+'>기본</label>':'')
    +'<span class="mk-mv"><button type="button" data-mv="'+i+':-1"'+(i?'':' disabled')+' aria-label="위로">↑</button><button type="button" data-mv="'+i+':1"'+(i<L.length-1?'':' disabled')+' aria-label="아래로">↓</button></span>'
    +'<button type="button" class="btn mk-btn" data-del="'+i+'"'+(L.length>1||e.g==='옵션'?'':' disabled')+'>삭제</button></div>').join('')
    +'<div class="mk-iadd"><button type="button" class="btn mk-btn add" data-cc="add"'+(L.length<ITEM_MAX?'':' disabled')+'>+ 추가</button></div></div>'
    +fhint('*샘플 항목이에요. 실제 노출 개수는 주문 프로세스에서 정해요');
}
function attrTable(ctl,s=st,ro){
  const ti=tplInfo(s.t,s.a),t=ti.list;
  if(t===null)return '<div class="mk-notice">참고 화면에 이 배열의 코너 속성 정의가 없습니다.</div>';
  if(!t.length)return '<div class="mk-notice">배너 소재(이미지·문구·랜딩)는 배너 캠페인 관리에서 등록해요. 이 코너에 어떤 배너를 노출할지는 주문 프로세스에서 선택합니다.</div>';
  let h=ti.note?'<div class="mk-notice">'+esc(ti.note)+'</div>':'';
  if(!ro&&t.some(e=>e.g==='옵션'))h+='<p class="mk-lead"><i class="mk-req">*</i> 필수 항목 · 그 밖의 항목은 값을 비우거나 \''+OFF+'\'을 고르면 고객 화면에 노출하지 않아요.</p>';
  ['c','i'].forEach(area=>{
    const list=t.filter(e=>e.area===area);if(!list.length)return;
    h+='<div class="mk-sub '+area+'">'+(area==='c'?'코너(카드)':'컴포넌트(요소)')+'</div><div class="mk-tbl">'
     +list.map(e=>'<div class="mk-r">'+aLabel(e,ro?'':cntOf(e,s.v[e.key]))+'<div class="mk-v">'+ctl(e)+'</div></div>').join('')+'</div>';
  });
  return h;
}
function attrPart(){
  return acc('attr','코너 속성<small class="cc-tsub">이 코너 유형이 쓰는 표시 항목</small>','<div class="mk-attr">'+attrTable(aCtl)+'</div>');
}

/* ===== 아코디언 ===== */
const fold={};
function initFold(){Object.keys(fold).forEach(k=>delete fold[k]);Object.assign(fold,{perm:true,scr:true,pre:true,cond:true});}
function toggleSec(id){const hd=$('ccForm').querySelector('[data-fold="'+id+'"]');if(!hd)return;fold[id]=!fold[id];setFold(hd.parentNode,!fold[id]);}
function foldAll(){$('ccForm').querySelectorAll('.cc-acc>header[data-fold]').forEach(h=>{const k=h.dataset.fold;if(!fold[k]){fold[k]=true;setFold(h.parentNode,false);}});}
function acc(id,title,body,aside){
  return '<section class="cc-acc'+(fold[id]?' closed':'')+'"><header data-fold="'+id+'"><b>'+title+'</b>'+(aside||'')
   +'<button type="button" class="cc-fold" aria-expanded="'+!fold[id]+'" aria-label="접기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></header>'
   +'<div class="cc-accb">'+body+'</div></section>';
}
const FOLD_MS=300,FOLD_EASE='cubic-bezier(.4,0,.2,1)';
export function setFold(sec,open){
  const body=sec.querySelector(':scope>.cc-accb'),was=!sec.classList.contains('closed');
  sec.querySelector('.cc-fold').setAttribute('aria-expanded',String(open));
  if(body._fold){body._fold.cancel();body._fold=null;body.style.display='';body.style.overflow='';}
  sec.classList.toggle('closed',!open);
  if(was===open||matchMedia('(prefers-reduced-motion: reduce)').matches||!body.animate)return;
  body.style.overflow='hidden';if(!open)body.style.display='block';
  const h=body.scrollHeight,cs=getComputedStyle(body),full={height:h+'px',paddingTop:cs.paddingTop,paddingBottom:cs.paddingBottom,opacity:1},none={height:'0px',paddingTop:'0px',paddingBottom:'0px',opacity:0};
  const a=body._fold=body.animate(open?[none,full]:[full,none],{duration:open?FOLD_MS:FOLD_MS-40,easing:FOLD_EASE});
  a.onfinish=()=>{if(body._fold!==a)return;body._fold=null;body.style.display='';body.style.overflow='';};
}

/* ===== 설정 권한 : 기본 정보의 '사용 여부' 옆 (수정 가능 · 변경 불가) ===== */
const PERM=[['edit','수정 가능','기본값을 제공하고 전시에서 수정 허용'],['lock','변경 불가','기본값을 제공하고 전시에서 수정 금지']];
const PERM_DEF='edit';
const permNorm=p=>{const v=typeof p==='string'?p:(p&&p.header);return PERM.some(x=>x[0]===v)?v:PERM_DEF;};
const permOf=()=>permNorm(st.perm);
const permName=v=>(PERM.find(p=>p[0]===v)||PERM[0])[1];

/* ===== 노출 목록 기본값 : 등록 화면에는 영역이 없다(주문 프로세스에서 설정). 저장된 값은 반복 항목 이름 기준으로 이어 저장하고, 새 코너는 전체 항목 노출 ===== */
const olDef=()=>({mode:'always',hide:[],rules:[]});
const olOf=()=>st.ol||(st.ol=olDef());
const hasOpts=()=>!!listKey()&&st.items.length>0;
const optName=it=>it.n||'(이름 없음)';
const NCOND=()=>({src:'',vals:[]});
const condSrcs=()=>CORNERS.filter(c=>c.id!==(EDIT&&EDIT.id)&&(c.opts||[]).some(o=>o.x!=='none'));
const srcVals=id=>{const c=CORNERS.find(x=>x.id===id);return c?(c.opts||[]).filter(o=>o.x!=='none').map(o=>o.n):[];};
function olOut(){
  if(!hasOpts())return null;
  const o=olOf(),nm=u=>{const it=st.items.find(x=>x.uid===u);return it?optName(it):null;},names=us=>us.map(nm).filter(Boolean);
  if(o.mode==='cond')return {mode:'cond',rules:o.rules.map(r=>({conds:r.conds.map(cd=>({src:cd.src,vals:cd.vals.slice()})),opts:names(st.items.map(x=>x.uid).filter(u=>r.show.indexOf(u)>-1))}))};
  return {mode:'always',show:st.items.filter(x=>o.hide.indexOf(x.uid)<0).map(optName)};
}
function olFrom(ol,items){   // 저장된 노출 목록(이름 기준) → 등록 상태(uid 기준)
  if(!ol)return olDef();
  const u=n=>{const it=items.find(x=>x.n===n);return it&&it.uid;};
  if(ol.mode==='cond')return {mode:'cond',hide:[],rules:(ol.rules||[]).map(r=>({conds:(r.conds||[]).map(cd=>({src:cd.src,vals:(cd.vals||[]).slice()})),show:(r.opts||[]).map(u).filter(Boolean)}))};
  return {mode:'always',hide:items.filter(it=>(ol.show||[]).indexOf(it.n)<0).map(it=>it.uid),rules:[]};
}

/* ===== 연결 화면 : 등록 화면에는 영역이 없다. 예전에 등록한 단계(c.scr)는 그대로 이어 저장한다 (주문 프로세스 미리보기에서 사용) ===== */
const SCR_FORM=[['sheet','바텀시트'],['page','전체 화면'],['result','결과 화면']];
const SCR_MAX=5;
export const scrFormName=f=>f==='base'?'기본 화면':(SCR_FORM.find(x=>x[0]===f)||SCR_FORM[0])[1];
const scrOf=()=>st.scr||(st.scr=[]);
function scrFrom(c,f){
  const a=c.scr||(c.screens||[]).map((n,i)=>({n,form:i?'sheet':'base',from:''}));
  f.scr0=a.length?a[0].n:'';
  f.scr=a.slice(1).map(x=>({uid:newUid(),n:x.n||'',form:SCR_FORM.some(y=>y[0]===x.form)?x.form:'sheet',from:x.from||''}));
}
function scrOut(){
  const L=scrOf();if(!L.length)return null;
  return [{n:(st.scr0||'').trim()||st.name.trim(),form:'base',from:''}].concat(L.map(x=>({n:x.n.trim(),form:x.form,from:x.from.trim()})));
}

/* ===== 선행 코너 (주문 프로세스에서 이 코너보다 앞쪽 어디에든 있어야 하는 코너) ===== */
const preOf=()=>st.pre||(st.pre=[]);
const cornerN=id=>{const c=CORNERS.find(x=>x.id===id);return c?c.n:id;};
function preLoop(id,self,seen){
  if(!self||seen[id])return false;seen[id]=1;
  const c=CORNERS.find(x=>x.id===id);return !!c&&(c.pre||[]).some(p=>p===self||preLoop(p,self,seen));
}
/* 선행 코너 UI : 상품 전시 Tag 입력처럼 검색해서 추가하는 태그 입력 (셀렉트 대신)
   - 고른 코너는 칩으로 쌓이고 ×로 뺀다. 입력하면 코너명 · ID로 후보를 좁힌다 (입력 전에는 전체 후보)
   - ↑↓ 이동 · Enter 추가 · Esc 닫기 · 입력이 비었을 때 Backspace는 마지막 칩 삭제
   - 개수 제한 없음. 이미 고른 코너 · 서로 선행이 되는 코너는 후보에 회색으로 두고 사유를 보여 준다 (자기 자신은 뺀다) */
let PQ={q:'',i:0,open:false};
const hl=(t,q)=>{t=String(t);const k=q?t.toLowerCase().indexOf(q.toLowerCase()):-1;return k<0?esc(t):esc(t.slice(0,k))+'<mark>'+esc(t.slice(k,k+q.length))+'</mark>'+esc(t.slice(k+q.length));};
function preCands(){
  const self=EDIT&&EDIT.id,L=preOf(),q=PQ.q.trim().toLowerCase();
  return CORNERS.filter(c=>c.id!==self&&(!q||(c.n+' '+c.id).toLowerCase().indexOf(q)>-1))
    .map(c=>({c,why:L.indexOf(c.id)>-1?'추가됨':preLoop(c.id,self,{})?'이 코너를 선행으로 둔 코너':''}));
}
const preOk=x=>x&&!x.why;
function preFirst(L){const k=L.findIndex(preOk);return k<0?0:k;}
function drawSug(kb){
  const el=document.getElementById('mkPreList'),inp=$('ccForm').querySelector('[data-prein]');if(!el||!inp)return;
  if(!PQ.open){el.hidden=true;inp.setAttribute('aria-expanded','false');return;}
  const L=preCands(),q=PQ.q.trim();
  el.hidden=false;inp.setAttribute('aria-expanded','true');
  el.innerHTML=L.length?L.map((x,i)=>{let tp='';try{tp=specOf(x.c).type;}catch(e){}
    return '<button type="button" role="option" id="mkPo'+i+'" class="mk-sug-i'+(i===PQ.i?' on':'')+(x.why?' dis':'')+'" data-preadd2="'+x.c.id+'"'+(x.why?' aria-disabled="true"':'')+' aria-selected="'+(i===PQ.i)+'"><b>'+hl(x.c.n,q)+'</b><span class="id">'+hl(x.c.id,q)+'</span><span class="tp">'+esc(x.why||tp)+'</span></button>';}).join('')
    :'<div class="mk-sug-e">\''+esc(q)+'\'에 맞는 코너가 없어요</div>';
  if(L[PQ.i])inp.setAttribute('aria-activedescendant','mkPo'+PQ.i);else inp.removeAttribute('aria-activedescendant');
  if(kb){const on=el.querySelector('.on');if(on){const t=on.offsetTop,b=t+on.offsetHeight;if(t<el.scrollTop)el.scrollTop=t;else if(b>el.scrollTop+el.clientHeight)el.scrollTop=b-el.clientHeight;}}   // 키보드 이동 때만 목록 안에서 맞춘다 (페이지는 움직이지 않는다)
}
function preFocus(){const inp=$('ccForm').querySelector('[data-prein]');if(inp){inp.focus({preventScroll:true});PQ.open=true;drawSug();}}
/* 선행 코너 영역만 제자리에서 다시 그린다 : 페이지 스크롤 · 입력란 포커스 · 검색어 · 열린 목록과 목록 스크롤을 그대로 둔다 */
function redrawPre(){
  const hd=$('ccForm').querySelector('[data-fold="pre"]');if(!hd){render();return;}
  const sec=hd.parentNode,old=document.getElementById('mkPreList'),ls=old?old.scrollTop:0,y=window.scrollY,had=!!(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.prein!=null);
  const tmp=document.createElement('div');tmp.innerHTML=prePart();sec.replaceWith(tmp.firstElementChild);
  const inp=$('ccForm').querySelector('[data-prein]');
  if(inp){inp.value=PQ.q;if(had||PQ.open){inp.focus({preventScroll:true});const n=inp.value.length;try{inp.setSelectionRange(n,n);}catch(e){}}}
  drawSug();const el=document.getElementById('mkPreList');if(el)el.scrollTop=ls;
  if(window.scrollY!==y)window.scrollTo(window.scrollX,y);
}
function preAdd(id){
  const L=preOf();if(!id||L.indexOf(id)>-1)return;   // 개수 제한 없음
  const x=preCands().find(y=>y.c.id===id);if(x&&x.why)return;
  L.push(id);PQ.open=true;PQ.i=preFirst(preCands());redrawPre();   // 검색어 · 목록은 그대로 (추가한 코너는 '추가됨'으로 바뀐다)
}
function prePart(){
  const L=preOf(),full=false;
  const chips=L.map((id,i)=>'<span class="mk-chip" title="'+esc(id)+'">'+esc(cornerN(id))+'<button type="button" data-pred="'+i+'" aria-label="'+esc(cornerN(id))+' 선행 코너 삭제">×</button></span>').join('');
  const box='<div class="mk-tagw"><div class="mk-tagbox'+(full?' full':'')+'" data-pbox>'+chips
    +(full?'':'<input type="text" data-prein role="combobox" aria-expanded="false" aria-controls="mkPreList" aria-autocomplete="list" autocomplete="off" value="'+esc(PQ.q)+'" placeholder="'+(L.length?'코너 추가':'코너명 또는 코너 ID로 검색하세요')+'" aria-label="선행 코너 검색">')
    +'</div><div class="mk-sug" id="mkPreList" role="listbox" aria-label="선행 코너 후보" hidden></div></div>';
  const body='<div class="mk-attr"><div class="mk-tbl"><div class="mk-r"><div class="mk-l"><span class="mk-ln">선행 코너</span></div><div class="mk-v">'+box
    +fhint('*주문 프로세스에서 이 코너보다 앞쪽 어디에든 있어야 하는 코너예요. 바로 앞이 아니어도 되고 순서는 상관없어요')
    +'</div></div></div></div>';
  return acc('pre','선행 코너',body,'<span class="cc-on">'+(L.length?L.length+'개':'없음')+'</span>');
}
function vPre(c,DF){
  const L=c.pre||[];
  const v=L.length?'<div class="mk-tagbox mk-ro">'+L.map(id=>'<span class="mk-chip" title="'+esc(id)+'">'+esc(cornerN(id))+'</span>').join('')+'</div>':'<span class="cc-val none">-</span>';
  return vAcc('pre','선행 코너','<div class="mk-attr mk-ro"><div class="mk-tbl"><div class="mk-r"><div class="mk-l"><span class="mk-ln">선행 코너</span></div><div class="mk-v">'+v+'</div></div></div></div>',L.length?'<span class="cc-on">'+L.length+'개</span>':'',DF);
}

/* 영역 : 기본 정보(설정 권한 포함) · 코너 속성 · 선행 코너. 연결 화면 · 코너 조건(노출 목록)은 v0.3 등록 화면에서 뺐다 (저장된 값은 그대로 이어 저장하고, 노출 목록은 주문 프로세스에서 설정한다) */
function render(){olOf();$('ccForm').innerHTML=basicCard()+attrPart()+prePart();renderPv();}

/* ===== 저장 ===== */
function validate(){
  if(!st.name.trim())return ['코너명을 입력해 주세요.','basic'];
  if(!PF.some(p=>st.pf[p[0]]))return ['운영 플랫폼을 1개 이상 선택해 주세요.','basic'];
  const t=tplOf();
  if(t===null)return ['이 배열은 코너 속성 정의가 없어 등록할 수 없어요. 다른 배열을 선택해 주세요.','basic'];
  for(const e of t){
    if(e.g!=='고정')continue;const c=ctOf(e);
    if(c.t==='list'){if(!st.items.length)return ['\''+e.name+'\' 항목을 1개 이상 등록해 주세요.','attr'];if(st.items.some(x=>!x.n.trim()))return ['\''+e.name+'\' 항목 이름을 모두 입력해 주세요.','attr'];continue;}
    if(c.t==='img'&&!hasVal(e,st))return ['\''+e.name+'\'은(는) 필수 항목이라 대표 이미지를 1장 이상 등록해야 해요.','attr'];
    if(['txt','area','cta','badge'].indexOf(c.t)>-1&&!hasVal(e,st))return ['\''+e.name+'\'은(는) 고정 항목이라 값을 입력해야 해요.','attr'];
  }
  if(st.items.some(x=>!x.n.trim()))return ['반복 항목 이름을 모두 입력해 주세요.','attr'];
  {const self=EDIT&&EDIT.id,bad=preOf().find(p=>preLoop(p,self,{}));if(bad)return ['선행 코너 \''+cornerN(bad)+'\'은(는) 이 코너를 선행 코너로 두고 있어 서로 선행으로 지정할 수 없습니다.','pre'];}
  return null;
}
function nextId(){let n=0;CORNERS.forEach(c=>{const m=c.id.match(/^CN-ORD-(\d+)$/);if(m)n=Math.max(n,+m[1]);});return 'CN-ORD-'+String(n+1).padStart(4,'0');}
function pad(n){return ('0'+n).slice(-2)}
/* 유형 · 배열 → 기존 FO 렌더러(ui). 목록 · 그룹 미리보기 · 주문 프로세스가 이 값으로 그린다 */
function uiOf(s){
  const a=s.a;
  if(s.t==='배너형'||a.indexOf('가로형')===0)return 'grid';
  if(a==='카테고리형')return 'chip';
  if(a==='입력형')return 'form';
  if(a==='상태 안내형'||a==='프로필형')return 'sum';
  if(a.indexOf('세로형')===0)return 'card';
  return 'list';
}
function build(id){
  const ui=uiOf(st),tpl=CORNERS.find(c=>c.ui===ui)||CORNERS[0],c=JSON.parse(JSON.stringify(tpl)),d=new Date(),on=k=>onK(k);
  ['cat','subs','epcMode','more','chev','logo','link','btn','src','screens','scr','pre','note','qs','req','markup','desc','pf'].forEach(k=>{delete c[k];});
  const sv=k=>on(k)?String(tx(k)||''):'';
  const price=sv('TextPriceGroup')||sv('Price'),badge=on('BadgeGroup')?st.v.BadgeGroup.l:on('BadgeItem')?st.v.BadgeItem.l:'';
  c.id=id;c.n=st.name.trim();c.t='주문';c.ui=ui;c.q=sv('CornerTitle');c.sub=sv('CornerSubTitle');
  c.it='T'+(on('CornerSubTitle')?'S':'')+(on('SubTitle')?'D':'')+(price?'P':'')+(badge?'B':'')+(on('ImageSrc')?'M':'');
  c.opts=st.items.map((x,i)=>({n:x.n.trim(),d:sv('SubTitle'),p:price,b:i===0?badge:'',x:'',lk:false,k:id+'-'+i}));
  c.moreBtn=sv('ButtonText');c.ctas=on('CallToAction')?[{on:true,label:st.v.CallToAction.l,link:'',act:st.v.CallToAction.a}]:[];c.ctaType=c.ctas.length?1:0;
  c.sel=selType()==='복수'?'복수 선택':'단일 선택';c.lim=Math.max(1,c.opts.length);c.ds='직접 입력';c.cond={mode:'none',list:[]};
  c.ver='v1.0';c.use=st.use;c.dt=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());c.mby=CORNER_EDITOR;
  {const im=imgOf(st.v.ImageSrc);if(on('ImageSrc')){c.imgs=im.list.map(x=>({n:x.n,u:x.u}));c.img=(im.list[0]||{}).u||'';c.imgAlt=im.alt||'';}else{delete c.imgs;delete c.img;delete c.imgAlt;}}
  c.markup=markupKeep()?EDIT.markup:markupOf(id);st.markup=c.markup;c.pf=Object.assign({},st.pf);
  c.spec={type:st.t,form:st.a,mode:selType()||'-'};   // 목록 : 코너 유형 · 배열·레이아웃 · 선택 방식
  const sc=scrOut();if(sc){c.scr=sc;c.screens=sc.map(x=>x.n);}
  if(preOf().length)c.pre=preOf().slice();
  c.olist=olOut();c.perm=permOf();
  c.form=JSON.parse(JSON.stringify(st));   // 수정 화면을 그대로 다시 열기 위한 등록 상태 원본 (m2=1)
  delete c.hist;delete c.pending;
  return c;
}
const bump=v=>{const m=/^v(\d+)\.(\d+)$/.exec(v||'');return m?'v'+m[1]+'.'+(+m[2]+1):'v1.0';};
function save(){
  const err=validate();if(err){opts.toast(err[0]);if(fold[err[1]])toggleSec(err[1]);return;}
  if(EDIT){const old=EDIT,c=build(old.id);c.ver=bump(old.ver);c.hist=old.hist;
    Object.keys(old).forEach(k=>{delete old[k];});Object.assign(old,c);persistCorner(old);
    st=null;EDIT=null;opts.onSaved(old);return;}
  const c=build(nextId());CORNERS.unshift(c);persistCorner(c);
  st=null;opts.onSaved(c);
}

/* ===== 이벤트 ===== */
let bound=false;
function setV(path,value){const [k,sub]=path.split('.');if(sub){st.v[k]=Object.assign({},st.v[k]||{});st.v[k][sub]=value;}else st.v[k]=value;}
function bind(){
  if(bound)return;bound=true;
  const root=$('pCreate');
  root.addEventListener('input',e=>{const t=e.target;
    if(t.dataset.prein!=null){PQ.q=t.value;PQ.open=true;PQ.i=preFirst(preCands());drawSug();return;}
    if(t.dataset.imalt){const v=imgOf(st.v[t.dataset.imalt]);v.alt=t.value;st.v[t.dataset.imalt]=v;renderPv();return;}
    if(t.dataset.scr){const [i,k]=t.dataset.scr.split(':');if(+i<0)st.scr0=t.value;else scrOf()[+i][k]=t.value;return;}
    if(t.dataset.f){st[t.dataset.f]=t.value;if(t.dataset.f==='name'&&$('ccForm').querySelector('[data-scr="-1:n"]'))$('ccForm').querySelector('[data-scr="-1:n"]').placeholder=t.value||'코너명';return;}
    if(t.dataset.v&&t.tagName!=='SELECT'){setV(t.dataset.v,t.value);const k=t.dataset.v.split('.')[0],e=(tplOf()||[]).find(x=>x.key===k),ce=document.getElementById('mkc_'+k);if(e&&ce)ce.textContent='('+cntOf(e,st.v[k])+')';renderPv();return;}
    if(t.dataset.it!=null&&t.tagName==='INPUT'){st.items[+t.dataset.it][t.dataset.k]=t.value;renderPv();}});
  root.addEventListener('change',e=>{const t=e.target;
    if(t.name==='ccType'){setTA(t.value);st.ol=olDef();render();return;}
    if(t.name==='ccArr'){setTA(st.t,t.value);st.ol=olDef();render();return;}
    if(t.name==='ccUse'){st.use=t.value;render();return;}
    if(t.dataset.pf){const k=t.dataset.pf;if(k==='all'){PF.forEach(p=>{st.pf[p[0]]=t.checked;});}else{st.pf[k]=t.checked;st.pf.all=st.pf.mo&&st.pf.pc;}render();return;}
    if(t.dataset.fv){st.v[t.dataset.fv]=t.value;render();return;}
    if(t.dataset.v&&t.tagName==='SELECT'){setV(t.dataset.v,t.value);renderPv();return;}
    if(t.name==='ccDef'){st.def=+t.value;render();return;}
    if(t.name==='ccPerm'){st.perm=permNorm(t.value);render();return;}
    if(t.dataset.preadd!=null){if(t.value&&preOf().indexOf(t.value)<0)preOf().push(t.value);render();return;}
    if(t.name==='ccOlMode'){const o=olOf();o.mode=t.value;if(o.mode==='cond'&&!o.rules.length)o.rules.push({conds:[NCOND()],show:[]});render();return;}
    if(t.dataset.olh){const o=olOf(),u=t.dataset.olh,k=o.hide.indexOf(u);if(t.checked&&k>-1)o.hide.splice(k,1);else if(!t.checked&&k<0)o.hide.push(u);render();return;}
    if(t.dataset.olsrc){const [ri,ci]=t.dataset.olsrc.split(':').map(Number),cd=olOf().rules[ri].conds[ci];cd.src=t.value;cd.vals=[];render();return;}
    if(t.dataset.olval){const [ri,ci]=t.dataset.olval.split(':').map(Number),cd=olOf().rules[ri].conds[ci],k=cd.vals.indexOf(t.value);if(t.checked&&k<0)cd.vals.push(t.value);else if(!t.checked&&k>-1)cd.vals.splice(k,1);const vs=srcVals(cd.src);cd.vals.sort((a,b)=>vs.indexOf(a)-vs.indexOf(b));render();return;}
    if(t.dataset.olshow!=null){const r=olOf().rules[+t.dataset.olshow],k=r.show.indexOf(t.value);if(t.checked&&k<0)r.show.push(t.value);else if(!t.checked&&k>-1)r.show.splice(k,1);render();return;}
    if(t.dataset.it!=null||t.dataset.v)render();   // 입력을 마치면 노출 목록 · 머리줄 요약을 맞춘다
  });
  root.addEventListener('click',e=>{
    const hd=e.target.closest('[data-fold]');
    if(hd){toggleSec(hd.dataset.fold);return;}
    const b=e.target.closest('button');
    if(!b&&e.target.closest('[data-pbox]')){preFocus();return;}
    if(!b||b.disabled)return;
    if(b.dataset.ol){const p=b.dataset.ol.split(':'),o=olOf(),ri=+p[1];
      if(p[0]==='addg')o.rules.push({conds:[NCOND()],show:[]});
      else if(p[0]==='delg'){o.rules.splice(ri,1);if(!o.rules.length)o.mode='always';}
      else if(p[0]==='addc')o.rules[ri].conds.push(NCOND());
      else if(p[0]==='delc'){const cs=o.rules[ri].conds;if(cs.length>1)cs.splice(+p[2],1);else cs[0]=NCOND();}
      render();return;}
    if(b.dataset.imadd){imgDlg(b.dataset.imadd);return;}
    if(b.dataset.imrm){const [k,i]=b.dataset.imrm.split(':'),v=imgOf(st.v[k]);v.list.splice(+i,1);st.v[k]=v;render();return;}
    if(b.dataset.immain){const [k,i]=b.dataset.immain.split(':'),v=imgOf(st.v[k]);v.list.unshift(v.list.splice(+i,1)[0]);st.v[k]=v;render();opts.toast('대표 이미지를 바꿨어요');return;}
    if(b.dataset.preadd2){if(b.getAttribute('aria-disabled')!=='true')preAdd(b.dataset.preadd2);return;}
    if(b.dataset.pred!=null){preOf().splice(+b.dataset.pred,1);PQ.i=preFirst(preCands());redrawPre();return;}
    if(b.dataset.scrm){const [i,d]=b.dataset.scrm.split(':').map(Number),L=scrOf(),x=L.splice(i,1)[0];L.splice(i+d,0,x);render();return;}
    if(b.dataset.scrd!=null){scrOf().splice(+b.dataset.scrd,1);render();return;}
    if(b.dataset.mv){const p=b.dataset.mv.split(':'),i=+p[0],j=i+(+p[1]);const x=st.items.splice(i,1)[0];st.items.splice(j,0,x);if(st.def===i)st.def=j;else if(st.def===j)st.def=i;render();return;}
    if(b.dataset.del!=null){const i=+b.dataset.del,u=st.items[i].uid;st.items.splice(i,1);const o=olOf();o.hide=o.hide.filter(x=>x!==u);o.rules.forEach(r=>{r.show=r.show.filter(x=>x!==u);});if(st.def>=st.items.length)st.def=0;else if(st.def>i)st.def--;render();return;}
    const a=b.dataset.cc;
    if(a==='sadd'){scrOf().push({uid:newUid(),n:'',form:'sheet',from:''});render();const ins=root.querySelectorAll('[data-scr$=":n"]');if(ins.length)ins[ins.length-1].focus();return;}
    if(a==='add'){const k=listKey(),e=(tplOf()||[]).find(x=>x.key===k);st.items.push({uid:newUid(),n:(e?e.name:'항목')+' '+(st.items.length+1)});render();const ins=root.querySelectorAll('.mk-irow [data-it]');if(ins.length)ins[ins.length-1].select();}
    else if(a==='reset'){
      if(EDIT){st=JSON.parse(ST0);render();opts.toast('저장된 설정 값으로 되돌렸어요.');return;}
      defaults();st.ol=olDef();render();opts.toast('코너 속성을 이 배열의 기본값으로 되돌렸어요.');}
    else if(a==='cancel'){
      const dirty=EDIT?JSON.stringify(st)!==ST0:!!(st&&st.name);
      if(dirty&&!confirm(EDIT?'수정한 내용이 있습니다. 저장하지 않고 나갈까요?':'작성 중인 내용이 있습니다. 저장하지 않고 나갈까요?'))return;
      st=null;EDIT=null;opts.onClose();}
    else if(a==='save')save();
  });
  // 선행 코너 태그 입력 : 키보드 · 포커스
  root.addEventListener('keydown',e=>{const t=e.target;if(t.dataset.prein==null)return;
    const L=preCands(),mv=d=>{if(!L.length)return;let k=PQ.i;for(let n=0;n<L.length;n++){k=(k+d+L.length)%L.length;if(preOk(L[k]))break;}PQ.i=k;PQ.open=true;drawSug(true);};
    if(e.key==='ArrowDown'){e.preventDefault();mv(1);}
    else if(e.key==='ArrowUp'){e.preventDefault();mv(-1);}
    else if(e.key==='Enter'){e.preventDefault();if(e.isComposing)return;if(PQ.open&&preOk(L[PQ.i]))preAdd(L[PQ.i].c.id);}
    else if(e.key==='Escape'){if(PQ.open){e.stopPropagation();PQ.open=false;drawSug();}}
    else if(e.key==='Backspace'&&!t.value&&preOf().length){preOf().pop();PQ.open=true;PQ.i=preFirst(preCands());redrawPre();}
  });
  root.addEventListener('focusin',e=>{if(e.target.dataset&&e.target.dataset.prein!=null&&!PQ.open){PQ.open=true;PQ.i=preFirst(preCands());drawSug();}});
  root.addEventListener('focusout',e=>{if(!(e.target.dataset&&e.target.dataset.prein!=null))return;setTimeout(()=>{const a=document.activeElement;if(a&&a.dataset&&a.dataset.prein!=null)return;PQ.open=false;drawSug();},120);});
  root.addEventListener('mousedown',e=>{if(e.target.closest&&e.target.closest('[data-preadd2],.mk-sug'))e.preventDefault();});   // 후보를 눌러도 입력란 포커스 유지
  document.addEventListener('keydown',e=>{if(root.hidden||!st||!e.ctrlKey||e.altKey||e.shiftKey||e.code!=='Digit1')return;e.preventDefault();foldAll();});
}

/* ===== 기존 코너 → 등록 상태 =====
   v0.3에서 저장한 코너(form.m2)는 그대로, 그 밖의 코너는 예전 표시 방식(fam)으로 가장 가까운 유형 · 배열을 고르고 FO 렌더러 값(q · opts · ctas)을 옮긴다 */
function oldFam(c){
  const k=c.spec&&c.spec.mode?null:(c.ui==='card'&&c.sel==='복수 선택'?'check':UI2V[c.ui]);
  for(const t of OLD_TYPES)for(const l of t.ls)for(const v of l.vs)if((k&&v.k===k)||(!k&&c.spec&&v.n===c.spec.mode&&l.n===c.spec.form))return v.fam;
  return '';
}
function taOf(c){
  const f=oldFam(c),price=(c.opts||[]).some(o=>o.p);
  if(f==='offer')return ['혜택·오퍼형','세로형'];
  if(['thumb','pcard','compare'].indexOf(f)>-1)return ['상품형','가로형'];
  if(f==='chip')return ['업무 진입형','카테고리형'];
  if(['input','auth','date','query','addr','reg','hist','file'].indexOf(f)>-1)return ['업무 진입형','입력형'];
  if(['table','amount','prod','result'].indexOf(f)>-1)return ['업무 진입형','상태 안내형'];
  if(f==='text'||f==='html')return ['콘텐츠 안내형','텍스트형'];
  if(f==='accordion')return ['콘텐츠 안내형','아코디언형'];
  if(f==='step')return ['콘텐츠 안내형','스텝형'];
  if(f==='banner')return ['배너형','단일형'];
  return price?['상품형','세로형']:['업무 진입형','리스트형'];
}
function stFromCorner(c){
  if(c.form&&c.form.m2){const f=JSON.parse(JSON.stringify(c.form));f.perm=permNorm(c.perm||f.perm);if(!f.scr)scrFrom(c,f);f.pre=(c.pre||[]).slice();return f;}
  const ta=taOf(c),s={m2:1,name:c.n||'',markup:c.markup||'',pf:c.pf||{all:false,mo:true,pc:false},use:c.use||'Y',t:ta[0],a:ta[1],perm:permNorm(c.perm)};
  defaults(s);
  const os=(c.opts||[]).filter(o=>o.x!=='none'),cta=(c.ctas||[]).find(a=>a.on&&a.label),t=tplOf(s)||[],has=k=>t.some(e=>e.key===k);
  // 옮길 값이 없는 옵션 항목은 미노출로 둔다 (샘플 값으로 켜지 않는다)
  t.forEach(e=>{if(e.g!=='옵션'||isForm(e))return;const x=ctOf(e);
    if(x.t==='sel')s.v[e.key]=OFF;else if(x.t==='cta'||x.t==='badge')s.v[e.key]={l:'',a:x.o[0]};else if(x.t==='img')s.v[e.key]={list:[],alt:''};else if(x.t!=='list'&&x.t!=='tbd')s.v[e.key]='';});
  if(has('ImageSrc')&&(String(c.it||'').indexOf('M')>-1||(t.find(e=>e.key==='ImageSrc')||{}).g!=='옵션'))s.v.ImageSrc={list:[{n:'sample.png',u:''}],alt:''};
  if(has('CornerTitle'))s.v.CornerTitle=c.q||'';
  if(has('CornerSubTitle'))s.v.CornerSubTitle=c.sub||'';
  if(has('CallToAction'))s.v.CallToAction={l:cta?cta.label:'',a:ACTS[0]};
  if(has('ButtonText'))s.v.ButtonText=c.moreBtn||'';
  if(has('SelectType'))s.v.SelectType=c.sel==='복수 선택'?'복수':os.length?'단일':'없음';
  if(has('SubTitle'))s.v.SubTitle=(os.find(o=>o.d)||{}).d||'';
  if(has('BadgeGroup'))s.v.BadgeGroup={l:(os.find(o=>o.b)||{}).b||'',a:'강조'};
  ['TextPriceGroup','Price'].forEach(k=>{if(has(k))s.v[k]=(os.find(o=>o.p)||{}).p||'';});
  if(listKey(s)&&os.length)s.items=os.map(o=>({uid:newUid(),n:o.n||''}));
  s.def=0;s.ol=olFrom(c.olist,s.items);
  scrFrom(c,s);s.pre=(c.pre||[]).slice();
  return s;
}
/* 목록 : 코너 유형 · 배열·레이아웃 · 선택 방식 */
export function specOf(c){
  const s=c.form&&c.form.m2?c.form:stFromCorner(c);
  return {type:s.t,form:s.a,mode:s.v&&s.v.SelectType?s.v.SelectType:'-'};
}

/* ===== 상세(읽기 전용) : 등록 화면과 같은 영역 · 표, 값만 글자로 ===== */
function vAcc(id,title,body,aside,DF){
  return '<section class="cc-acc'+(DF[id]?' closed':'')+'"><header data-dfold="'+id+'"><b>'+title+'</b>'+(aside||'')
   +'<button type="button" class="cc-fold" aria-expanded="'+!DF[id]+'" aria-label="접기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></header>'
   +'<div class="cc-accb">'+body+'</div></section>';
}
function vCtl(e){
  const c=ctOf(e),v=st.v[e.key];
  if(isForm(e))return val(v);
  if(c.t==='list')return '<div class="mk-vlist">'+st.items.map((it,i)=>'<span class="mk-vi">'+esc(it.n)+(selType()&&selType()!=='없음'&&st.def===i?'<em>기본</em>':'')+'</span>').join('')+'</div>';
  if(c.t==='cta'||c.t==='badge')return hasVal(e,st)?val(v.l+' · '+v.a):'<span class="cc-val none">미노출</span>';
  if(c.t==='tbd')return '<span class="cc-sub">TBD</span>';
  if(c.t==='img'){const im=imgOf(v);return im.list.length?'<div class="mk-dl">'+im.list.map((m,i)=>'<div class="mk-tile mk-ro'+(i===0?' rep':'')+'">'+(m.u?'<img src="'+m.u+'" alt="">':'<div class="mk-tph"><span>'+esc(m.n)+'</span></div>')+(i===0?'<span class="rb">대표</span>':'')+'</div>').join('')+'</div>'+(im.alt?'<p class="mk-hint">대체 텍스트 : '+esc(im.alt)+'</p>':''):'<span class="cc-val none">'+(e.g==='옵션'?'미노출':'-')+'</span>';}
  return hasVal(e,st)?val(v):'<span class="cc-val none">'+(e.g==='옵션'?'미노출':'-')+'</span>';
}
export function cornerView(c,DF){
  const prev=st;st=stFromCorner(c);
  const pf=PF.filter(p=>st.pf[p[0]]).map(p=>p[1]).join(', ');
  const b=tr2('코너 ID',val(c.id),'코너 마크업 ID',val(c.markup||''))+tr('코너명',val(st.name))+tr('코너 유형',val(st.t))+tr('배열·레이아웃',val(st.a))+tr('운영 플랫폼',val(pf))+tr2('사용 여부',val(st.use==='Y'?'사용':'미사용'),'설정 권한',val(permName(permOf())));
  const out={form:vAcc('basic','기본 정보','<div class="cc-tb">'+b+'</div>','',DF)
    +vAcc('attr','코너 속성<small class="cc-tsub">이 코너 유형이 쓰는 표시 항목</small>','<div class="mk-attr mk-ro">'+attrTable(vCtl,st,true)+'</div>','',DF)
    +vPre(c,DF),
    pv:pvView(pvHTML)};
  st=prev;return out;
}

/* 목록 미리보기(썸네일) : 등록 화면과 같은 미리보기 HTML */
export function cornerThumb(c){const prev=st;try{st=stFromCorner(c);return pvView(pvHTML);}catch(e){return '';}finally{st=prev;}}
/* ===== 열기 : opts = {onClose, onSaved(corner), toast, setCrumb} ===== */
let EDIT=null,ST0='';
function openForm(o,title){
  opts=o;PQ={q:'',i:0,open:false};initFold();bind();
  st.perm=permNorm(st.perm);
  $('pCreate').querySelector('.ph h1').textContent=title;
  $('pCreate').hidden=false;
  o.setCrumb(['홈','주문 관리','주문 코너 관리',title]);
  render();window.scrollTo(0,0);
}
export function openCornerCreate(o){EDIT=null;fresh();openForm(o,'주문 코너 등록');}
export function openCornerEdit(c,o){
  EDIT=c;st=stFromCorner(c);ST0=JSON.stringify(st);
  openForm(o,'주문 코너 수정');
  Object.keys(fold).forEach(k=>{fold[k]=false;});render();
}
