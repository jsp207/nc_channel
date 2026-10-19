// @ts-nocheck
// 상품 전시 관리 v0.2.1 (display-create1.ts 복사본). 원본 v0.2: ref/display-admin-prototype-v3.html의 전시 등록 흐름(전시 유형 → 연결 상품 → 고객 선택 방식 → 기본 정보 → 상세 설명 → 추가 정보 → 검색 노출 → 주문 구성)을
// product-create3 화면 구성(왼쪽 모바일 미리보기, 접히는 섹션, 하단 검사 바)으로 옮긴 버전.
import "./style.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

// ---------- EPC 샘플 데이터 (EPC 상품 조회 화면에서 내려오는 값으로 가정) ----------
// PO: 판매 단위. dt = Delivery type(PS 목록), base = Price policy 기본가, 후보 add = 추가금
const TODAY=new Date().toISOString().slice(0,10);
// 전시 시작·종료 일시 비교용 지금 시각 (YYYY-MM-DDTHH:MM, 브라우저 시간대)
const NOW=(d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16))(new Date());
const TYPES=['기기서비스','액세서리','요금제','부가서비스','구독서비스','보험'];
const ONCE=new Set(['기기서비스','액세서리']);
function seedNum(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
// T우주 편의점&카페의 선택 혜택 후보 50개와 추가금
const PS3_NAMES=['YouTube Premium','디즈니+','Netflix 스탠다드','티빙 스탠다드','웨이브 베이직','쿠팡플레이','밀리의서재','윌라 오디오북','FLO 무제한','멜론 스트리밍','지니뮤직','Google One 100GB','네이버플러스 멤버십','배달의민족 쿠폰팩','요기요 쿠폰팩','파리바게뜨 할인','배스킨라빈스 할인','도미노피자 쿠폰','CGV 예매 할인','메가박스 예매 할인','교보문고 sam','리디셀렉트','클래스101','야놀자 할인','여기어때 할인','카카오T 블루 할인','쏘카 할인','GS25 할인','CU 할인','이마트24 할인'];
for(let i=PS3_NAMES.length+1;i<=50;i++) PS3_NAMES.push('제휴 쿠폰팩 '+String(i-30).padStart(2,'0'));
const PS3_ADD=n=>n==='YouTube Premium'||n==='디즈니+'?7900:[0,1000,2000,3900,4900,5900][seedNum(n)%6];
let EPCN=3370;
const mk=o=>Object.assign({epc:String(++EPCN).padStart(6,'0'),ver:'v1.0',sale:'판매중',img:[o.id.toLowerCase()+'_main.png']},o);
// 단말 세트: 용량 × 색상 조합마다 PO 하나
const devSet=(start,model,file,rows,ver,desc)=>rows.map(([c,k,p],i)=>mk({id:'DEV-'+String(start+i).padStart(3,'0'),name:`${model} ${c} ${k}`,type:'기기서비스',ver,base:p,desc:`${desc} ${c} 모델입니다`,img:[`${file}_${k==='블루'?'blue':'silver'}_front.png`],dt:[{id:'PS1',name:'단말',req:true,desc:`${c} · ${k}`},{id:'PS2',name:'기본 구성품',req:true,desc:'USB-C 케이블 · 유심핀'}]}));
const PO=[
 // 갤럭시 Z 플립 세트
 ...devSet(1,'갤럭시 Z 플립8','flip8',[['256GB','블루',1485000],['256GB','실버',1485000],['512GB','블루',1643000],['512GB','실버',1643000]],'v1.1','반으로 접는 갤럭시 Z 플립8'),
 // 아이폰 18 프로 세트
 ...devSet(5,'iPhone 18 Pro','ip18p',[['256GB','실버',1900000],['256GB','블루',1900000],['512GB','실버',2200000],['512GB','블루',2200000]],'v1.0','프로 카메라 시스템을 갖춘 iPhone 18 Pro'),
 // 베스트 요금제
 ...[['5GX 플래티넘',125000,'무제한 + 쉐어링 50GB'],['5GX 프라임',89000,'무제한']].map(([n,p,d],i)=>mk({id:'PLN-00'+(i+1),name:n,type:'요금제',base:p,desc:`데이터 ${d}를 쓰는 5G 베스트 요금제입니다`,dt:[{id:'PS1',name:'데이터',req:true,desc:d},{id:'PS2',name:'음성·문자',req:true,desc:'기본 제공'}]})),
 // 액세서리 2
 mk({id:'ACC-001',name:'정품 실리콘 케이스',type:'액세서리',base:39000,desc:'갤럭시 Z 플립8 · iPhone 18 Pro 전용 실리콘 케이스입니다',dt:[{id:'PS1',name:'케이스',req:true,desc:'기종별 전용'}]}),
 mk({id:'ACC-002',name:'25W 충전기',type:'액세서리',base:25000,desc:'USB-C PD 25W 고속 충전기입니다',dt:[{id:'PS1',name:'충전기',req:true,desc:'USB-C PD 25W'}]}),
 // 부가서비스 2
 mk({id:'ADD-001',name:'V컬러링',type:'부가서비스',base:3300,desc:'통화 연결음 대신 영상을 보여주는 부가서비스입니다',dt:[{id:'PS1',name:'통화연결음 설정',req:true,desc:'영상 컬러링'}]}),
 mk({id:'ADD-002',name:'FLO 앤 데이터',type:'부가서비스',base:7900,desc:'FLO 무제한 듣기와 전용 데이터를 함께 주는 부가서비스입니다',dt:[{id:'PS1',name:'FLO 무제한',req:true,desc:'음악 무제한 듣기'},{id:'PS2',name:'전용 데이터',req:true,desc:'FLO 전용 데이터'}]}),
 // 구독: 유튜브 · 넷플릭스 · 디즈니 · 구글 1개
 mk({id:'SUB-001',name:'YouTube Premium',type:'구독서비스',base:14900,desc:'광고 없이 영상과 음악을 즐기는 구독 서비스입니다',dt:[{id:'PS1',name:'YouTube Premium 이용',req:true,desc:'광고 없는 재생 · 오프라인 저장'}]}),
 mk({id:'SUB-002',name:'Netflix 스탠다드',type:'구독서비스',base:13500,desc:'동시 시청 2명, FHD 화질의 넷플릭스 이용권입니다',dt:[{id:'PS1',name:'Netflix 이용',req:true,desc:'동시 시청 2명 · FHD'}]}),
 mk({id:'SUB-003',name:'디즈니+ 스탠다드',type:'구독서비스',base:9900,desc:'디즈니·픽사·마블 콘텐츠를 보는 구독 서비스입니다',dt:[{id:'PS1',name:'디즈니+ 이용',req:true,desc:'동시 시청 2명 · FHD'}]}),
 mk({id:'SUB-004',name:'Google One 100GB',type:'구독서비스',base:2400,desc:'구글 드라이브·포토·지메일에서 함께 쓰는 100GB 저장공간입니다',dt:[{id:'PS1',name:'클라우드 저장공간',req:true,desc:'100GB'}]}),
 // 보험 1: 상품명 앞에 [보험] 구분자
 mk({id:'INS-001',name:'[보험] T ALL케어 플러스 파손형',type:'보험',base:7900,desc:'파손 시 수리비를 보상하는 휴대폰 보험입니다',dt:[{id:'PS1',name:'파손 보상',req:true,desc:'자기부담금 25%'}]}),
 // PS 선택 옵션이 있는 구독 (고객이 혜택을 직접 고름). 기존 상품의 EPC 상품ID가 바뀌지 않도록 맨 뒤에 붙인다
 mk({id:'SUB-005',name:'T우주 편의점&카페',type:'구독서비스',ver:'v2.0',base:9900,desc:'세븐일레븐·투썸플레이스 할인에 원하는 혜택 1개를 더하는 T우주 구독 상품입니다',dt:[
   {id:'PS1',name:'세븐일레븐',req:true,desc:'1천원당 300원 · 1일 1회 · 회당 9천원'},
   {id:'PS2',name:'투썸플레이스',req:true,desc:'최대 30% · 1일 1회 · 회당 9천원'},
   {id:'PS3',name:'선택 혜택',req:false,min:1,max:1,cands:PS3_NAMES.map(n=>({n,add:PS3_ADD(n)}))}]}),
 mk({id:'SUB-006',name:'T 우주패스 DIY',type:'구독서비스',base:9900,desc:'기본 혜택 2개와 추가 혜택 1~2개를 골라 만드는 구독 상품입니다',dt:[
   {id:'PS1',name:'기본 혜택',req:false,min:2,max:2,cands:['Google One 100GB','세븐일레븐 할인','투썸플레이스 할인','밀리의서재','파리바게뜨 할인','배스킨라빈스 할인','CU 할인','GS25 할인','교보문고 sam','FLO 무제한'].map(n=>({n,add:0}))},
   {id:'PS2',name:'추가 혜택',req:false,min:1,max:2,cands:['YouTube Premium','Netflix 스탠다드','티빙 스탠다드','디즈니+','웨이브 베이직','배달의민족 쿠폰팩','도미노피자 쿠폰','CGV 예매 할인'].map(n=>({n,add:n==='YouTube Premium'?7900:4900}))}]}),
 // 베스트 요금제: 기본 포함 혜택 + OTT 1개를 고객이 고른다 (PS 선택 옵션)
 mk({id:'PLN-004',name:'베스트 Max(Google AI)',type:'요금제',base:115000,desc:'데이터 무제한에 Google AI를 기본으로 주고, OTT 하나를 더 고르는 베스트 요금제입니다',dt:[
   {id:'PS1',name:'데이터',req:true,desc:'무제한'},
   {id:'PS2',name:'Google AI',req:true,desc:'Google AI Pro 이용'},
   {id:'PS3',name:'OTT 택1',req:false,min:1,max:1,cands:['YouTube Premium','Netflix 스탠다드','디즈니+','티빙 스탠다드','웨이브 베이직'].map(n=>({n,add:0}))}]}),
 mk({id:'PLN-005',name:'베스트 Pro(넷플릭스)',type:'요금제',base:99000,desc:'데이터 무제한에 넷플릭스를 기본으로 주고, OTT 하나를 더 고르는 베스트 요금제입니다',dt:[
   {id:'PS1',name:'데이터',req:true,desc:'무제한'},
   {id:'PS2',name:'넷플릭스',req:true,desc:'Netflix 스탠다드 이용'},
   {id:'PS3',name:'OTT 택1',req:false,min:1,max:1,cands:['YouTube Premium','티빙 스탠다드','디즈니+','웨이브 베이직'].map(n=>({n,add:0}))}]}),
 // 태블릿 3 · 웨어러블 3: 상품 구분은 기기서비스, cat = 상품유형
 ...[['갤럭시 탭 S11 256GB 그레이','gtabs11',1298000,'11인치 AMOLED 화면의 갤럭시 탭 S11 그레이 모델입니다','갤럭시 탭 S11 · 256GB','S펜 · USB-C 케이블'],
     ['iPad Pro 13 M5 256GB 실버','ipadpro13',2299000,'M5 칩을 탑재한 13인치 iPad Pro 실버 모델입니다','iPad Pro 13 · 256GB','USB-C 케이블'],
     ['iPad Air 11 M3 128GB 블루','ipadair11',1049000,'가볍게 들고 다니는 11인치 iPad Air 블루 모델입니다','iPad Air 11 · 128GB','USB-C 케이블']]
  .map(([n,f,p,d,s,c],i)=>mk({id:'DEV-'+String(9+i).padStart(3,'0'),name:n,type:'기기서비스',cat:'태블릿',base:p,desc:d,img:[f+'_front.png'],dt:[{id:'PS1',name:'단말',req:true,desc:s},{id:'PS2',name:'기본 구성품',req:true,desc:c}]})),
 ...[['갤럭시 워치8 클래식 46mm 블랙','gwatch8c',599000,'회전 베젤을 갖춘 갤럭시 워치8 클래식 블랙 모델입니다','갤럭시 워치8 클래식 · 46mm · LTE','무선 충전기'],
     ['Apple Watch Series 11 46mm 실버','aws11',749000,'건강 기능을 강화한 Apple Watch Series 11 실버 모델입니다','Apple Watch Series 11 · 46mm · 셀룰러','마그네틱 고속 충전 케이블'],
     ['Apple Watch Ultra 3 49mm 블랙','awu3',1249000,'아웃도어용 티타늄 케이스의 Apple Watch Ultra 3 블랙 모델입니다','Apple Watch Ultra 3 · 49mm · 셀룰러','마그네틱 고속 충전 케이블']]
  .map(([n,f,p,d,s,c],i)=>mk({id:'DEV-'+String(12+i).padStart(3,'0'),name:n,type:'기기서비스',cat:'웨어러블',base:p,desc:d,img:[f+'_front.png'],dt:[{id:'PS1',name:'단말',req:true,desc:s},{id:'PS2',name:'기본 구성품',req:true,desc:c}]})),
];
const poBy=id=>PO.find(p=>p.id===id);
const selPS=po=>po.dt.filter(p=>!p.req);
const hasSel=po=>selPS(po).length>0;
// PS 개별 전시용: PO의 PS를 펼친 목록
const PSLIST=PO.flatMap(po=>po.dt.flatMap(ps=>ps.req?[{key:po.id+'|'+ps.id,name:ps.name,desc:ps.desc,po,kind:'필수 PS'}]:ps.cands.map((c,ci)=>({key:po.id+'|'+ps.id+'|'+ci,name:c.n,desc:`${ps.name} 후보 · ${c.add?'+'+c.add.toLocaleString()+'원':'추가금 없음'}`,po,kind:'선택 PS 후보'}))));
const psBy=k=>PSLIST.find(x=>x.key===k);

const COLOR={블랙:'#1f2228',실버:'#c9ccd2',화이트:'#f4f4f2',블루:'#3a6fd8',그린:'#3f8f5b',핑크:'#e9a3b8',퍼플:'#7a5bd6',골드:'#d4b06a',그레이:'#8a8f98'};
const BCOL=[['보라','#4320d4'],['파랑','#1f5fa8'],['초록','#1f8a5b'],['주황','#d4612a'],['빨강','#c0392b'],['핑크','#a8326a'],['검정','#2c2c2a']];
const MSG1='이 상품은 고객이 직접 선택하는 항목이 있어, 고정으로 등록해도 고객 화면에 선택 항목이 표시됩니다.';
const MSG2='선택 항목이 EPC 상품에 포함되어 있어 옵션을 만들 수 없습니다.';

// 템플릿 관리 샘플
const TPL=[
 {id:'TPL-0001',n:'휴대폰 이용안내',t:'이용안내',v:'v1',use:12,body:'상품 수령 후 구성품과 외관을 확인해 주세요\n개통 및 서비스 이용 조건은 선택한 상품의 안내를 확인해 주세요'},
 {id:'TPL-0002',n:'구매 전 유의사항',t:'유의사항',v:'v3',use:8,body:'개통 후 14일 이내 단순 변심 철회가 가능해요\n약정 할인 반환금이 발생할 수 있어요'},
 {id:'TPL-0003',n:'이동전화 이용약관',t:'약관',v:'v5',use:31,body:'이동전화 서비스 이용약관 전문\n개인정보 처리방침'},
 {id:'TPL-0004',n:'SK텔레콤 판매자 정보',t:'판매자 정보',v:'v1',use:40,body:'상호 SK텔레콤(주)\n사업자등록번호 104-81-37225'},
 {id:'TPL-0005',n:'T우주 구독 FAQ',t:'자주 묻는 질문',v:'v2',use:5,body:'Q. 선택 혜택은 언제 바꿀 수 있나요?\nA. 매월 1회 변경할 수 있어요'},
 {id:'TPL-0006',n:'10월 프로모션 안내',t:'마케팅 정보',v:'v1',use:3,body:'10월 가입 고객에게 커피 쿠폰을 드려요'},
 {id:'TPL-0007',n:'구매후기 작성 안내',t:'구매후기',v:'v1',use:9,body:'상품을 받은 뒤 30일 안에 구매후기를 남길 수 있어요\n사진과 함께 작성하면 T포인트를 드려요'},
];
const tplBy=id=>TPL.find(t=>t.id===id);
// 상품이 가진 템플릿 (EPC 상품 정보에서 온다고 가정. 프로토타입은 상품 구분별로 정함)
const TYPE_TPL={기기서비스:['TPL-0001','TPL-0002','TPL-0004'],요금제:['TPL-0003','TPL-0004'],부가서비스:['TPL-0003','TPL-0004'],구독서비스:['TPL-0005','TPL-0004'],액세서리:['TPL-0001','TPL-0004'],보험:['TPL-0002','TPL-0004']};
const poTpls=p=>TYPE_TPL[p.type]||[];

// 주문 구성 (주문 구성 관리에서 정의된 흐름으로 가정). 연결 상품 유형으로 자동 결정
const FLOWS={
 dev:{types:['기기서비스'],name:'휴대폰 주문',sub:'이동전화 계약 + 단말 구매',fields:[['join','가입 유형',['신규가입','번호이동','기기변경']],['disc','할인 방법',['공시지원','선택약정']],['pay','단말 결제',['일시불','24개월 할부','36개월 할부']]]},
 mob:{types:['요금제','부가서비스','보험'],name:'요금제/부가서비스 주문',sub:'이동전화 계약 가입·변경',fields:[['pjoin','가입 유형',['신규가입','번호이동','요금제 변경']],['sim','유심',['USIM 배송','eSIM']]]},
 sub:{types:['구독서비스'],name:'구독 주문',sub:'T우주 구독 가입',fields:[['cycle','결제 주기',['월간','연간']]]},
 acc:{types:['액세서리'],name:'배송 상품 주문',sub:'액세서리 구매',fields:[['ship','수령 방법',['택배','매장 픽업']]]}
};

// ---------- 전시 데이터 ----------
let SEQ=100; const nid=()=>++SEQ;
// 오퍼링 문구(CVM): 기본 개수 · 최대 개수(1~5개 버튼) · 문구 최대 글자 수
const CVM_DEF=5, CVM_MAX=5, CVM_LEN=40;
// 옵션 값 표시 방식
const ODISP=[['text','텍스트'],['chip','컬러칩'],['img','이미지']];
function newArea(n,mode){return {id:nid(),name:n||'',mode:mode||'fixed',pos:[],q:1,useMax:false,mx:2,opt0:false,opts:[{name:'',vals:[],disp:'text'}],map:{},def:[],cond:'always',parent:null,trig:[],rel:{}};}
// ---------- v4-8 반영: 주문 조건(가입 유형·할부) 기본값, 사은품·티다팩 샘플 ----------
// 가입 유형·할부는 기기 상품을 연결했을 때만 쓴다. 노출 여부·순서·기본 선택을 전시마다 정한다
const JOIN_DEF=()=>[{k:'신규가입',d:'SKT에 새로운 번호로 가입해요',on:true},{k:'번호이동',d:'지금 번호 그대로 다른 통신사에서 SKT로 이동해요',on:true},{k:'기기변경',d:'지금 번호 그대로 기기만 바꿔요',on:true}];
const INST_DEF=()=>['24개월','30개월','일시불','6개월','12개월','18개월','36개월','48개월'].map(k=>({k,on:true}));
// 사은품은 사은품·혜택 관리에서 만든다(샘플). cond.model = 연결 상품명 앞부분, cond.pos = 연결 상품 코드, own = 이 전시 전용(직접 연결)
const GIFT=[
 {id:'GFT-0101',n:'AirTag 1개',ic:'📍',mode:'고정 지급',cond:{model:'iPhone 18 Pro',join:['번호이동']},from:'2026-10-01',to:'2026-11-30',total:1000,left:412,ship:'개통 후 7일 이내 발송'},
 {id:'GFT-0102',n:'맥세이프 케이스 · 충전기 중 택1',ic:'🔌',mode:'고객 택1',cond:{model:'iPhone 18 Pro'},from:'2026-10-10',to:'2026-10-31',total:500,left:38,ship:'개통 시 동봉'},
 {id:'GFT-0103',n:'T 우주 3개월 이용권',ic:'🎟',mode:'고정 지급',cond:{pos:['PLN-001']},from:'2026-10-01',to:'2026-12-31',total:null,left:null,ship:'개통 다음 날 쿠폰 발급'},
 {id:'GFT-0104',n:'스타벅스 아메리카노 기프티콘',ic:'☕',mode:'고정 지급',cond:{model:'iPhone 18 Pro'},from:'2026-09-01',to:'2026-10-31',total:300,left:0,ship:'개통 다음 날 문자 발송'},
 {id:'GFT-0105',n:'갤럭시 버즈3',ic:'🎧',mode:'고정 지급',cond:{model:'갤럭시 Z 플립8'},from:'2026-10-01',to:'2026-11-30',total:800,left:640,ship:'개통 후 7일 이내 발송'},
 {id:'GFT-0106',n:'정품 스포츠 밴드 추가 증정',ic:'⌚',mode:'고정 지급',cond:{model:'갤럭시 워치8'},from:'2026-10-15',to:'2026-12-31',total:400,left:400,ship:'개통 시 동봉'},
 {id:'GFT-0201',n:'가을 기획전 한정 무선충전 거치대',ic:'🍂',mode:'고정 지급',own:true,cond:{},from:'2026-10-15',to:'2026-11-15',total:300,left:300,ship:'개통 시 동봉'},
 {id:'GFT-0202',n:'사전예약 감사 굿즈 세트',ic:'🎁',mode:'고객 택1',own:true,cond:{},from:'2026-11-01',to:'2026-11-10',total:200,left:200,ship:'개통 후 14일 이내 발송'},
 {id:'GFT-0203',n:'신세계 상품권 1만원',ic:'💳',mode:'고정 지급',own:true,cond:{},from:'2026-08-01',to:'2026-09-30',total:500,left:120,ship:'개통 다음 달 발송'}
];
// 티다팩: 대상 요금제를 12개월 약정하면 1년간 매월 받는 제휴 쿠폰(쿠폰 관리 시스템 샘플). tag = 쿠폰 관리 시스템의 추천 태그
const TDP=[
 {id:'TDP-0001',brand:'다이소',logo:'daiso',lc:'#e60012',benefit:'매월 10,000원 할인 쿠폰',tag:'AI PICK',valid:'발급일부터 30일',use:'1만원 이상 결제 시',issue:'T 멤버십 앱 쿠폰함',cond:{pos:['PLN-001','PLN-004']},from:'2026-10-01',to:'2026-12-31',total:5000,left:3120},
 {id:'TDP-0002',brand:'무신사 머니',logo:'MUSINSA',lc:'#000000',benefit:'매월 10,000원 적립',tag:'추천',valid:'적립일부터 60일',use:'무신사 앱 결제 시',issue:'무신사 계정 연동',cond:{pos:['PLN-001']},from:'2026-10-01',to:'2027-03-31',total:null,left:null},
 {id:'TDP-0003',brand:'올리브영',logo:'O',lc:'#8dc63f',benefit:'매월 10,000원 할인 쿠폰',tag:'추천',valid:'발급일부터 30일',use:'2만원 이상 결제 시',issue:'CJ ONE 앱 쿠폰함',cond:{pos:['PLN-001','PLN-004']},from:'2026-10-01',to:'2026-12-31',total:3000,left:240},
 {id:'TDP-0004',brand:'CGV',logo:'CGV',lc:'#c4161c',benefit:'매월 영화 1편 관람권',tag:'',valid:'발급일부터 30일',use:'2D 일반관 한정',issue:'문자 발송',cond:{pos:['PLN-001']},from:'2026-11-01',to:'2027-04-30',total:2000,left:2000},
 {id:'TDP-0005',brand:'배달의민족',logo:'배민',lc:'#2ac1bc',benefit:'매월 5,000원 할인 쿠폰',tag:'',valid:'발급일부터 14일',use:'1.5만원 이상 주문 시',issue:'배민 앱 쿠폰함',cond:{pos:['PLN-001']},from:'2026-04-01',to:'2026-09-30',total:4000,left:900},
 {id:'TDP-0006',brand:'투썸플레이스',logo:'TWOSOME',lc:'#c8102e',benefit:'매월 음료 1잔',tag:'',valid:'발급일부터 30일',use:'아메리카노 R 기준',issue:'문자 발송',cond:{pos:['PLN-002','PLN-005']},from:'2026-10-01',to:'2026-12-31',total:null,left:null},
 {id:'TDP-0101',brand:'GS25',logo:'GS25',lc:'#0a8fd6',benefit:'기획전 한정 매월 3,000원 쿠폰',tag:'',valid:'발급일부터 30일',use:'5천원 이상 결제 시',issue:'우리동네GS 앱',own:true,cond:{},from:'2026-10-15',to:'2026-11-30',total:1000,left:1000}
];
const TD_TOP=3; // 티다팩은 처음 3개만 보이고 나머지는 전체보기 (티다팩 공통 정책)
function orderDefaults(){ const o={}; Object.values(FLOWS).forEach(f=>f.fields.forEach(([k,,v])=>o[k]=v.slice())); return o; }
function newDisplay(){ return {id:null,kind:'po',conn:[],method:'fixed',areas:[newArea('','fixed')],name:'',from:TODAY,fromTime:'00:00',to:'',toTime:'23:59',noEnd:true,show:false,channels:[],main:null,mainAlt:'',subs:[],subAlt:'',badges:[],descMode:'image',descImgs:[],descHtml:'',descNote:'',extras:[],search:{on:false,kw:[],title:'',desc:'',og:null},cvm:{on:false,n:CVM_DEF,lines:[]},order:orderDefaults(),orderPlan:null,rep:[],review:true,sim:{on:true,mode:'def',t:'',s:''},join:JOIN_DEF(),joinDef:'번호이동',inst:INST_DEF(),instDef:'24개월',instTop:3,gifts:[],giftBadge:true,tds:[],tdBadge:true}; }
// 이미지: n = 파일명, u = 업로드한 이미지 주소(EPC에서 불러온 이미지는 파일명만 있다)
const img=n=>({n,u:null});
const PLANS=['PLN-001','PLN-002','PLN-004','PLN-005'];
// 단말 옵션 영역: 용량(텍스트) × 색상(컬러칩) → PO 매핑
const devArea=(n,ids,colors)=>Object.assign(newArea(n,'opt'),{pos:ids,opts:[{name:'용량',vals:['256GB','512GB'],disp:'text'},{name:'색상',vals:colors,disp:'chip'}],map:Object.fromEntries(ids.map((id,i)=>[`${i<2?'256GB':'512GB'}|${colors[i%2]}`,id]))});
const FLIP=['DEV-001','DEV-002','DEV-003','DEV-004'], IP18=['DEV-005','DEV-006','DEV-007','DEV-008'];
// 예전 구조(한 줄 소개, images 배열)를 지금 구조로 맞춘다. 전시 여부가 없던 예전 저장본·샘플은 전시(Y)로 본다
function norm(d){
 // EPC 샘플에서 지운 상품(예: 0 청년 69)을 가리키면 연결·영역·옵션 매핑에서 뺀다
 const ok=k=>d.kind==='ps'?!!psBy(k):!!poBy(k);
 d.conn=(d.conn||[]).filter(ok); (d.areas||[]).forEach(a=>{ a.pos=(a.pos||[]).filter(ok); a.def=(a.def||[]).filter(ok); Object.keys(a.map||{}).forEach(k=>{ if(!ok(a.map[k])) delete a.map[k]; }); });
 if(d.images){ d.main=d.images[0]||null; d.subs=d.images.slice(1); delete d.images; } d.main=d.main||null; d.mainAlt=d.mainAlt||''; d.subs=d.subs||[]; d.subAlt=d.subAlt||''; d.fromTime=d.fromTime||'00:00'; d.toTime=d.toTime||'23:59'; d.channels=[...new Set((d.channels||[]).map(c=>({웹:'통합 WEB',앱:'통합 APP',BSS:'BSS(TBD)'}[c]||c)))]; delete d.summary;
 if(d.desc!=null){ const t=String(d.desc).trim(); if(t&&!d.descHtml){ const e=x=>x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); d.descHtml=t.split(/\n{2,}/).map(p=>`<p>${e(p).replace(/\n/g,'<br>')}</p>`).join(''); if(!(d.descImgs&&d.descImgs.length)) d.descMode='html'; } delete d.desc; }
 d.descMode=d.descMode||'image'; d.descImgs=d.descImgs||[]; d.descHtml=d.descHtml||''; d.descNote=d.descNote||''; (d.areas||[]).forEach(a=>{ if(a.name==='고객 선택 방식'||/^구성 영역( d+)?$/.test(a.name)) a.name=''; a.cond=a.cond||'always'; if(a.parent===undefined) a.parent=null; a.trig=a.trig||[]; a.rel=a.rel||{}; }); if(d.orderPlan===undefined) d.orderPlan=null;
 const sr=d.search=Object.assign({on:false,kw:[]},d.search); if(sr.title==null) sr.title=String(sr.line||'').slice(0,25); delete sr.line; sr.desc=sr.desc||''; sr.og=sr.og||null; d.cvm=Object.assign({n:CVM_DEF,lines:[]},d.cvm); d.cvm.n=Math.min(CVM_MAX,Math.max(1,d.cvm.n)); if(d.cvm.on==null) d.cvm.on=d.cvm.lines.some(x=>x&&x.trim()); if(d.noEnd==null) d.noEnd=!d.to; if(d.show==null) d.show=true;
 d.rep=(d.rep||[]).filter(id=>d.conn.includes(id)); if(d.review==null) d.review=true; d.sim=Object.assign({on:true,mode:'def',t:'',s:''},d.sim); if(!d.join) d.join=JOIN_DEF(); if(d.joinDef===undefined) d.joinDef='번호이동'; if(!d.inst) d.inst=INST_DEF(); if(d.instDef===undefined) d.instDef='24개월'; d.instTop=d.instTop||3; d.gifts=d.gifts||[]; if(d.giftBadge==null) d.giftBadge=true; d.tds=d.tds||[]; d.tdCut=d.tdCut||[]; if(d.tdBadge==null) d.tdBadge=true; return d; }
// 샘플은 종료일이 있으면 '종료일없음'을 끈다
const seed=o=>norm(Object.assign(newDisplay(),{show:true,channels:['통합 APP','통합 WEB'],noEnd:!o.to},o));
// 샘플 전시가 쓰는 주문 구성안 (주문 구성안 선택 목록 ORD_TPL과 같은 번호·버전 규칙)
const planOf=(i,name)=>{ const h=seedNum(name); return {id:'CTN-ORD-'+String(i).padStart(3,'0'),ver:`v${1+h%2}.${h%4}`,name,cat:'상품 유형 템플릿'}; };
const SEEDS=()=>[
 seed({id:1,name:'YouTube Premium',from:'2026-10-01',conn:['SUB-001'],method:'fixed',areas:[Object.assign(newArea('YouTube Premium','fixed'),{pos:['SUB-001']})],images:[img('sub-001_main.png')],badges:[{t:'광고 없이',c:'#4320d4',s:'f'}],desc:'광고 없이 영상과 음악을 즐기고, 오프라인 저장도 할 수 있어요.',extras:[{id:1,t:'판매자 정보',mode:'link',src:'TPL-0004',show:true,txt:''}],search:{on:true,kw:['유튜브','YouTube','구독'],line:'광고 없는 YouTube'},orderPlan:planOf(6,'구독 기본 템플릿'),rep:['SUB-001']}),
 seed({id:2,name:'갤럭시 Z 플립8',from:'2026-10-01',conn:FLIP,method:'select',areas:[devArea('모델 선택',FLIP,['블루','실버'])],images:[img('flip8_blue_front.png'),img('flip8_silver_front.png')],badges:[{t:'신규',c:'#d4612a',s:'f'}],desc:'반으로 접어 주머니에 쏙 들어가는 갤럭시 Z 플립8.',extras:[{id:1,t:'유의사항',mode:'link',src:'TPL-0002',show:true,txt:''}],search:{on:true,kw:['갤럭시','플립'],line:''},orderPlan:planOf(1,'기기서비스 / 기본'),rep:FLIP}),
 seed({id:3,name:'iPhone 18 Pro + 베스트요금제 + 구독',from:'2026-10-15',to:'2026-12-31',conn:[...IP18,...PLANS,'SUB-001','SUB-002','SUB-003'],method:'complex',areas:[devArea('단말',IP18,['실버','블루']),Object.assign(newArea('요금제','list'),{pos:PLANS,q:1}),Object.assign(newArea('구독 혜택','list'),{pos:['SUB-001','SUB-002','SUB-003'],q:1})],images:[img('ip18p_silver_front.png')],badges:[{t:'온라인 전용',c:'#1f8a5b',s:'l'}],desc:'iPhone 18 Pro와 베스트 요금제, 원하는 구독 하나를 함께 가입하는 온라인 전용 구성입니다.',extras:[{id:1,t:'유의사항',mode:'link',src:'TPL-0002',show:true,txt:''},{id:2,t:'이용약관',mode:'link',src:'TPL-0003',show:true,txt:''}],search:{on:true,kw:['아이폰','요금제'],line:''},orderPlan:planOf(13,'휴대폰 + 요금제 + 구독 / 통합형'),rep:[...IP18,...PLANS]}),
 seed({id:4,name:'베스트 요금제',from:'2026-09-01',conn:PLANS,method:'select',areas:[Object.assign(newArea('요금제를 골라 주세요','list'),{pos:PLANS,q:1})],search:{on:false,kw:[],line:''},desc:'데이터 걱정 없는 5G 베스트 요금제를 비교하고 골라 보세요.',orderPlan:planOf(2,'요금제 / 기본')}),
 seed({id:5,name:'액세서리 모음',from:'2026-09-01',to:'2026-09-30',conn:['ACC-001','ACC-002'],method:'fixed',areas:[Object.assign(newArea('액세서리','fixed'),{pos:['ACC-001','ACC-002']})],desc:'갤럭시 Z 플립8 · iPhone 18 Pro와 함께 쓰기 좋은 정품 액세서리입니다.',orderPlan:planOf(19,'액세서리 / 택배'),rep:['ACC-001','ACC-002']}),
 seed({id:6,name:'YouTube Premium 혜택 소개',from:'2026-10-01',kind:'ps',conn:['SUB-001|PS1'],method:'fixed',areas:[],desc:'YouTube Premium에 포함된 광고 없는 재생 · 오프라인 저장 혜택을 소개합니다.'}),
];
// 저장한 전시는 이 브라우저에만 남긴다. 저장소를 못 쓰면 샘플로 시작한다
const STORE_KEY='nova.display-create2.v2'; // v4-8 반영(사은품·티다팩·대표 전시 등 샘플 추가)으로 저장소를 새로 쓴다
function loadList(){ try { const s=localStorage.getItem(STORE_KEY); if(s){ const l=JSON.parse(s); if(Array.isArray(l)){ l.forEach(norm); SEQ=Math.max(SEQ,...l.flatMap(d=>[...d.areas.map(a=>a.id),...d.extras.map(x=>x.id)])); return l; } } } catch {} return SEEDS(); }
function saveList(){ try { localStorage.setItem(STORE_KEY,JSON.stringify(DISPLAYS)); return true; } catch { return false; } }
let DISPLAYS=loadList();
const METHOD={fixed:'고정형',select:'선택형',complex:'복합형'};
const MODE={fixed:'고정',list:'목록에서 선택',opt:'옵션 선택'};

// ---------- 공통 ----------
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 전시명은 <br>로 줄을 바꾼다. 미리보기는 줄바꿈, 목록·안내 문구는 띄어쓰기로 보인다
const nameText=s=>String(s==null?'':s).replace(/<br\s*\/?>/gi,' ').replace(/\s+/g,' ').trim();
const nameHtml=s=>esc(s).replace(/&lt;br\s*\/?&gt;/gi,'<br>');
const endOf=d=>d.noEnd?'':d.to;
// 전시 시작·종료 일시. 종료일없음이면 종료는 빈 값
const startAt=d=>d.from?`${d.from}T${d.fromTime||'00:00'}`:'';
const endAt=d=>endOf(d)?`${d.to}T${d.toTime||'23:59'}`:'';
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
function dndList(box,key,list,done,ok,sel='.ali'){
 let drag=null; const items=$$(`${box} ${sel}[data-${key}]`), clr=()=>items.forEach(a=>a.classList.remove('dragging','drop-b','drop-a'));
 const apply=n=>{ if(ok&&!ok(n)) return false; list.splice(0,list.length,...n); done(); return true; };
 items.forEach(el=>{
  el.draggable=true;
  el.addEventListener('dragstart',e=>{ drag=el.dataset[key]; el.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',''); });
  el.addEventListener('dragend',()=>{ drag=null; clr(); });
  el.addEventListener('dragover',e=>{ if(drag==null) return; e.preventDefault(); const r=el.getBoundingClientRect(), b=e.clientY<r.top+r.height/2; el.classList.toggle('drop-b',b); el.classList.toggle('drop-a',!b); });
  el.addEventListener('dragleave',e=>{ if(!el.contains(e.relatedTarget)) el.classList.remove('drop-b','drop-a'); });
  el.addEventListener('drop',e=>{ e.preventDefault(); if(drag==null) return; const id=drag, to0=el.dataset[key], b=el.classList.contains('drop-b'); drag=null; clr(); if(id===to0) return;
   const n=list.slice(), [m]=n.splice(n.findIndex(y=>String(y.id)===id),1), to=n.findIndex(y=>String(y.id)===to0); n.splice(b?to:to+1,0,m); apply(n); });
 });
 $$(`${box} [data-gi]`).forEach(g=>g.addEventListener('keydown',e=>{ const i=+g.dataset.gi, j=e.key==='ArrowUp'?i-1:e.key==='ArrowDown'?i+1:-1; if(j<0||j>=list.length) return; e.preventDefault();
  const n=list.slice(); [n[i],n[j]]=[n[j],n[i]]; if(!apply(n)) return; const f=$(`${box} [data-gi="${j}"]`); if(f) f.focus(); }));
}
const mvBtns=(attr,i,n,label)=>`<span class="mv"><button type="button" data-${attr}u="${i}" ${i===0?'disabled':''} aria-label="${label} 위로">${svg(IC.up)}</button><button type="button" data-${attr}d="${i}" ${i===n-1?'disabled':''} aria-label="${label} 아래로">${svg(IC.down)}</button></span>`;
function combos(a){const os=a.opts.filter(o=>o.name.trim()&&o.vals.length);if(!os.length)return[];return os.reduce((acc,o)=>acc.flatMap(c=>o.vals.map(v=>c.concat(v))),[[]]).map(c=>c.join('|'));}
const areaHasSel=a=>a.pos.some(id=>hasSel(poBy(id)));
function rng(a){ if(a.mode!=='list') return null; return {lo:a.opt0?0:a.q, hi:a.useMax?a.mx:a.q}; }
const usedIn=id=>DISPLAYS.filter(d=>d.kind==='po'&&d.conn.includes(id)).length;
const connPOs=d=>d.kind==='po'?d.conn.map(poBy):[...new Set(d.conn.map(k=>psBy(k).po))];
const activeFlows=d=>d.kind!=='po'?[]:Object.entries(FLOWS).filter(([k,f])=>d.conn.some(id=>f.types.includes(poBy(id).type)));
// 받침 유무로 을/를을 고른다
const eul=w=>{ const c=String(w).charCodeAt(String(w).length-1); return w+(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'을':'를'); };

// ---------- 검사 ----------
function areaIssues(a,d){ const e=[];
 if(!a.pos.length) e.push(d.method!=='complex'?'연결 상품을 추가하세요':'PO를 1개 이상 배정하세요');
 if(a.mode==='list'&&a.pos.length){ const r=rng(a); if(r.hi>a.pos.length) e.push(`선택 수량(${r.hi}개)이 배정 PO 수(${a.pos.length}개)보다 많아요`); if(!a.opt0&&r.lo===a.pos.length&&r.hi===a.pos.length) e.push('배정 PO를 전부 골라야 해요. 고정으로 바꾸는 걸 권해요'); }
 if(a.mode==='opt'){ if(areaHasSel(a)) e.push(MSG2); if(!a.opts.some(o=>o.name.trim()&&o.vals.length)) e.push('옵션명과 값을 1개 이상 넣으세요'); if(a.opts.some(o=>o.name.trim()&&!o.vals.length)) e.push('값이 없는 옵션이 있어요'); const c=combos(a),un=c.filter(k=>!a.map[k]||!a.pos.includes(a.map[k])); if(c.length&&un.length) e.push(`조합 ${un.length}개가 PO에 매핑되지 않았어요`); }
 if(d.method==='complex'&&a.cond&&a.cond!=='always'){ const i=d.areas.indexOf(a), p=d.areas.slice(0,i).find(x=>x.id===a.parent);
  if(!i) e.push('첫 번째 영역은 제공 조건을 쓸 수 없어요');
  else if(!p) e.push('기준 영역을 고르세요');
  else if(p.mode==='fixed') e.push(`기준 영역(${d.areas.indexOf(p)+1}번 ${p.name||'영역'})이 고정이라 조건을 걸 수 없어요`);
  else if(a.cond==='only'&&!(a.trig||[]).some(v=>p.pos.includes(v))) e.push('어떤 선택일 때 보여줄지 고르세요');
  else if(a.cond==='relation'&&a.pos.length){ const used=new Set(p.pos.flatMap(v=>((a.rel||{})[v]||[]).filter(c=>a.pos.includes(c)))), n=a.pos.filter(c=>!used.has(c)).length;
   if(!used.size) e.push('규칙 표에서 후보를 연결하세요'); else if(n) e.push(`어떤 선택에도 안 나오는 후보 ${n}개`); } }
 return e; }
// ---------- 사은품·티다팩: 연결 상품과 조건이 맞으면 자동으로 올라오고, 전시에서는 노출 여부·순서만 정한다 ----------
const hasDev=d=>d.kind==='po'&&d.conn.some(id=>poBy(id).type==='기기서비스');
const GM=id=>GIFT.find(g=>g.id===id), TDM=id=>TDP.find(t=>t.id===id);
const condMatch=(d,c)=>{ const P=connPOs(d); if(c.model) return P.some(p=>p.name.startsWith(c.model)); if(c.pos) return P.some(p=>c.pos.includes(p.id)); return false; };
// 소진·기간 종료는 자동 미노출, 시작 전은 시작일에 자동 노출. 진행 중이면 수량 10% 미만·종료 2주 이내를 알린다
function benefitState(g){
 if(g.left===0) return {k:'out',t:'소진',auto:true};
 if(g.to<TODAY) return {k:'end',t:'기간 종료',auto:true};
 if(g.from>TODAY) return {k:'wait',t:`${+g.from.slice(5,7)}/${+g.from.slice(8,10)} 시작`,auto:false};
 const low=g.total&&g.left/g.total<0.1, soon=(new Date(g.to)-new Date(TODAY))/864e5<=14;
 return {k:'on',t:'진행 중',warn:low?'남은 수량 10% 미만':soon?'종료 2주 이내':''};
}
// 대상 가입 유형이 이 전시에서 모두 꺼져 있으면 고객에게 나오지 않는다
function joinWarn(d,g){ if(!g.cond.join||!hasDev(d)) return ''; const on=d.join.filter(j=>j.on).map(j=>j.k); return g.cond.join.some(j=>on.includes(j))?'':`대상 가입 유형(${g.cond.join.join(', ')})이 이 전시에서 꺼져 있어 고객에게 나오지 않아요`; }
// 조건 매칭 항목을 연결 상품에 맞춰 다시 맞춘다. 전시 전용(직접 연결) 항목은 그대로 둔다
function syncList(list,pool,d){ const by=id=>pool.find(x=>x.id===id); const keep=list.filter(x=>x.src==='own'||condMatch(d,by(x.id).cond)); pool.filter(g=>!g.own&&condMatch(d,g.cond)&&!keep.some(x=>x.id===g.id)).forEach(g=>keep.push({id:g.id,src:'auto',show:!benefitState(g).auto})); return keep; }
function syncBenefits(d){ d.gifts=syncList(d.gifts,GIFT,d).filter(x=>!(d.giftCut||[]).includes(x.id)); d.tds=d.kind==='po'?syncList(d.tds,TDP,d).filter(x=>!(d.tdCut||[]).includes(x.id)):[]; }
const visibleGifts=d=>d.gifts.filter(x=>{ const g=GM(x.id); return x.show&&!benefitState(g).auto&&!joinWarn(d,g); });
const visibleTd=d=>d.kind!=='po'?[]:d.tds.filter(x=>x.show&&!benefitState(TDM(x.id)).auto);
// 자동 배지: 노출 중인 사은품·티다팩이 있으면 붙는다. 직접 만든 배지를 먼저 두고 3개 한도 안에서만 붙는다
function autoBadges(d){ const a=[]; if(d.giftBadge&&visibleGifts(d).length) a.push({k:'gift',t:'사은품 증정',c:'#0F6E56',s:'f',from:'사은품·혜택'}); if(d.tdBadge&&visibleTd(d).length) a.push({k:'td',t:'티다팩 혜택',c:'#D85A30',s:'f',from:'티다팩'}); return a.slice(0,Math.max(0,3-d.badges.length)); }
// 섹션 상태: st = done | todo | warn | na | on | off, e = 이슈 목록
function sectionState(d){
 const S={};
 S.kind={st:'done',e:[]};
 S.conn=d.conn.length?{st:'done',e:[]}:{st:'todo',e:['연결 상품을 1개 이상 추가하세요']};
 if(d.kind==='ps') S.method={st:'na',e:[]};
 else { const un=d.method==='complex'?d.conn.filter(id=>!d.areas.some(a=>a.pos.includes(id))):[]; const e=[...d.areas.flatMap((a,i)=>areaIssues(a,d).map(x=>`${d.method==='complex'?(i+1)+'번 ':''}${a.name||'영역'}: ${x}`)),...(un.length?[`구성 영역에 배정되지 않은 연결 상품 ${un.length}개`]:[])]; if(!d.areas.length) e.unshift('구성 영역을 만드세요'); S.method={st:!d.areas.some(a=>a.pos.length)?'todo':(e.length?'warn':'done'),e}; }
 const be=[]; if(!d.name.trim()) be.push('전시명을 입력하세요'); if(!d.from) be.push('전시 시작일을 입력하세요'); if(!d.noEnd&&!d.to) be.push('종료일을 입력하거나 종료일없음을 선택하세요'); if(endAt(d)&&startAt(d)&&endAt(d)<=startAt(d)) be.push('전시 종료 일시가 시작 일시보다 빨라요'); if(!d.channels.length) be.push('전시 채널을 1개 이상 고르세요');
 S.basic={st:be.length?(d.name||d.main||d.subs.length?'warn':'todo'):'done',e:be};
 S.desc={st:descFilled(d)?'done':'todo',e:descFilled(d)?[]:['상세 설명 본문을 입력하세요']};
 // 전시 정보 = 기본 정보 · 상세 설명을 묶은 필수 섹션
 S.info={st:S.basic.st==='done'&&S.desc.st==='done'?'done':S.basic.st==='todo'&&S.desc.st==='todo'?'todo':'warn',e:[...S.basic.e,...S.desc.e]};
 const xe=d.extras.filter(x=>x.show&&x.mode==='direct'&&!x.txt.trim());
 S.extra={st:!d.extras.length?'todo':(xe.length?'warn':'done'),e:xe.map(x=>`${x.t||'제목 없음'}: 내용이 비어 있어요`)};
 { const sr=d.search, miss=[!sr.kw.length&&'Tag를 1개 이상 입력하세요',!sr.title.trim()&&'Page Title을 입력하세요',!sr.desc.trim()&&'Description을 입력하세요'].filter(Boolean), any=sr.kw.length||sr.title.trim()||sr.desc.trim()||sr.og;
  S.search=!sr.on?{st:any?'done':'todo',e:[]}:{st:miss.length?(miss.length===3&&!sr.og?'todo':'warn'):'done',e:miss}; }
 S.cvm={st:d.cvm.lines.slice(0,d.cvm.n).some(x=>x.trim())?'done':'todo',e:[]};
 S.review={st:d.review?'on':'off',e:[]};
 S.sim=!d.sim.on?{st:'off',e:[]}:(d.sim.mode==='def'||(d.sim.t.trim()&&d.sim.s.trim()))?{st:'on',e:[]}:{st:'warn',e:['직접 입력한 타이틀과 소타이틀을 채우세요']};
 // 부가 설정 = 유사한 상품 · 오퍼링 문구 · 검색 노출 설정을 묶은 섹션
 { const sub=[S.sim,S.cvm,S.search]; S.more={st:sub.some(s=>s.st==='warn')?'warn':sub.some(s=>s.st==='done'||s.st==='on')?'done':'todo',e:sub.flatMap(s=>s.e)}; }
 // 가입 유형·할부는 기기 상품을 연결했을 때만 쓰는 필수 섹션
 if(!hasDev(d)){ S.join={st:'na',e:[]}; S.inst={st:'na',e:[]}; }
 else { S.join={st:d.join.some(j=>j.on)?'done':'todo',e:[]}; S.inst={st:d.inst.some(j=>j.on)?'done':'todo',e:[]}; }
 { const bad=d.gifts.filter(x=>x.show&&joinWarn(d,GM(x.id))); S.gift=!d.gifts.length?{st:'todo',e:[]}:bad.length?{st:'warn',e:bad.map(x=>`${GM(x.id).n}: ${joinWarn(d,GM(x.id))}`)}:{st:visibleGifts(d).length?'done':'todo',e:[]}; }
 S.td=d.kind!=='po'?{st:'na',e:[]}:{st:visibleTd(d).length?'done':'todo',e:[]};
 // 주문 구성 방식은 필수: 주문 구성안을 연결해야 승인요청할 수 있다 (임시저장은 된다)
 if(d.kind==='ps') S.order={st:'na',e:[]};
 else S.order={st:d.orderPlan?'done':'todo',e:d.orderPlan?[]:['사용할 주문 구성안을 선택하세요']};
 return S;
}
// [키, 이름, 필수, 짧은 이름]. 화면 순서와 같다
const SECS=[['kind','전시 유형',true,'전시 유형'],['conn','연결 상품',true,'연결 상품'],['method','고객 선택 방식',true,'고객 선택 방식'],['info','전시 정보',true,'전시 정보'],['extra','추가 정보',false,'추가 정보'],['review','구매후기',false,'구매후기'],['more','부가 설정',false,'부가 설정'],['join','가입 유형',true,'가입 유형'],['inst','할부 설정',true,'할부 설정'],['gift','사은품 · 혜택',false,'사은품·혜택'],['td','티다팩',false,'티다팩'],['order','주문 구성 방식',true,'주문 구성']];
const STL={done:['완료','ok'],todo:['미작성',''],warn:['확인 필요','warn'],na:['해당 없음',''],on:['노출','ok'],off:['미노출','']};
// 조건부 섹션: 조건이 안 맞으면 섹션을 숨긴다 (가입 유형·할부 = 기기 상품 연결 시, 티다팩 = 상품 판매 전시)
const secHidden=(k,d)=>(k==='join'||k==='inst')?!hasDev(d):k==='td'?d.kind!=='po':false;
function blocking(d){ const S=sectionState(d); return SECS.filter(([k,,req])=>req&&(S[k].st==='todo'||S[k].st==='warn')).flatMap(([k,l])=>S[k].e.length?S[k].e.map(x=>[k,l,x]):[[k,l,'입력이 필요해요']]); }
function status(d){ if(blocking(d).length) return ['작성 중','warn']; if(!d.show) return ['미전시','off']; if(endAt(d)&&endAt(d)<NOW) return ['종료','off']; if(startAt(d)>NOW) return ['전시 예약','wait']; return ['전시 중','live']; }
function methodLabel(d){ if(d.kind==='ps') return '<span class="pill">해당 없음</span>'; if(d.method==='select') return '선택형 · '+(d.areas[0]&&d.areas[0].mode==='opt'?'옵션 선택':'상품 목록'); if(d.method==='complex') return `복합형 · ${d.areas.length}개 영역`; return '고정형'; }

// ---------- 화면 전환 ----------
let E=null, cur=null, PV={}, curX=null, badgeEd=null, PVTAB='order';
function showView(v){ $('#v-list').classList.toggle('on',v==='list'); $('#v-edit').classList.toggle('on',v==='edit'); setDock(false); window.scrollTo(0,0); if(v==='edit') fitPv(); }
function goList(){ renderList(); showView('list'); history.replaceState(null,'',location.pathname+'?view=list'); }
$('#goList').addEventListener('click',goList);
$('#lNew').addEventListener('click',()=>openEdit(null));

// ---------- 전시 목록 ----------
function renderList(){
 $('#listRows').innerHTML=DISPLAYS.map(d=>{ const [s,c]=status(d); return `<tr><td><b>${esc(nameText(d.name))||'이름 없음'}</b></td><td>${d.kind==='po'?'상품 판매':'상품 개별 전시(PS)'}</td><td>${methodLabel(d)}</td><td>${d.conn.length}개</td><td style="white-space:nowrap">${periodTxt(d)}</td><td style="white-space:nowrap"><span class="status ${c}"></span>${s}</td><td style="text-align:right"><button type="button" class="btn sm" data-e="${d.id}">수정</button></td></tr>`; }).join('')||'<tr><td colspan="7"><div class="empty">등록한 전시가 없어요</div></td></tr>';
 $$('#listRows [data-e]').forEach(b=>b.addEventListener('click',()=>openEdit(+b.dataset.e)));
}

// ---------- 전시 등록/수정 ----------
function openEdit(id){
 const d=id?DISPLAYS.find(x=>x.id===id):null;
 E=d?clone(d):newDisplay();
 cur=E.areas[0]&&E.areas[0].id; curX=E.extras[0]&&E.extras[0].id; curI='basic'; curM='sim'; PV={}; badgeEd=null; PVTAB='order'; PVPILL=false; PVX.clear(); pvLast=''; RTE_SRC.desc=RTE_SRC.note=false;
 syncSingle(); syncBenefits(E);
 // 처음 열 때(새로고침 포함)는 전시 유형만 펼치고 나머지 섹션은 접는다
 $$('#v-edit .step').forEach(s=>setFold(s,s.id==='sec-kind',true)); tabIdx=0;
 renderEditing(); renderAll(); showView('edit');
 history.replaceState(null,'',location.pathname+(E.id?`?id=${E.id}`:''));
}
function renderEditing(){
 const on=!!E.id; $('#editingBar').classList.toggle('on',on);
 $('#editTitle').textContent=on?'전시수정':'전시등록';
 if(on) $('#editingTxt').textContent=`"${nameText(E.name)||'이름 없음'}" 수정 중. 저장하면 목록의 같은 행이 바뀝니다`;
}
$('#editCancel').addEventListener('click',()=>openEdit(null));
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
$$('#v-edit .step>header').forEach(h=>h.addEventListener('click',e=>{ if(e.target.closest('.switch')) return; const s=h.parentElement; setFold(s,s.classList.contains('closed')); }));
// Tab 키는 섹션 이동만 한다: Tab = 다음 섹션, Shift+Tab = 이전 섹션. 들어가는 섹션만 펼치고 나머지는 접는다.
// 섹션 안의 입력칸은 Tab으로 이동하지 않는다(마우스로 선택). 팝업·연결 상품 목록이 열려 있을 때는 평소처럼 동작한다
let tabIdx=0;
const stepList=()=>$$('#v-edit .step');
document.addEventListener('keydown',e=>{
 if(e.key!=='Tab'||e.altKey||e.ctrlKey||e.metaKey) return;
 if(!$('#v-edit').classList.contains('on')||!$('#md').hidden||!$('#dockSheet').hidden) return;
 e.preventDefault();
 const list=stepList(), at=document.activeElement&&document.activeElement.closest?document.activeElement.closest('#v-edit .step'):null;
 const i=at?list.indexOf(at):tabIdx, j=Math.max(0,Math.min(list.length-1,i+(e.shiftKey?-1:1)));
 list.forEach((st,k)=>setFold(st,k===j)); tabIdx=j;
 list[j].querySelector('.fold').focus({preventScroll:true});
 setTimeout(()=>list[j].scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'}),reduceMotion()?0:FOLD_MS);
});
// 마우스로 섹션을 열면 그 섹션부터 Tab 이동을 이어 간다
$$('#v-edit .step>header').forEach((h,k)=>h.addEventListener('click',()=>{ tabIdx=k; }));
function goSec(k){ if(k==='info'){ curI=sectionState(E).basic.st==='done'?'desc':'basic'; rInfo(); } const s=$('#sec-'+k); setDock(false); setFold(s,true); s.scrollIntoView({behavior:reduceMotion()?'auto':'smooth',block:'start'}); }

function renderAll(){ rKind(); rConn(); rMethod(); rInfo(); rBasic(); rDesc(); rExtra(); rReview(); rMore(); rSim(); rSearch(); rCvm(); rJoin(); rInst(); rGift(); rTd(); rOrder(); refresh(); }
// 섹션 상태·연결 상품 목록·미리보기 갱신
function refresh(){
 const S=sectionState(E);
 SECS.forEach(([k])=>{ const s=S[k], [t,c]=STL[s.st]; const ch=$('#st-'+k); ch.textContent=t; ch.className='chip '+c; const el=$('#sec-'+k); el.classList.toggle('na',s.st==='na'); el.classList.toggle('off',s.st==='off'); el.hidden=secHidden(k,E); });
 moreChips(); infoChips();
 rSummary(S);
 // 하단 바: 연결 상품 수, 바텀시트: 연결한 상품 목록 (누르면 연결 상품 섹션으로 이동)
 const items=E.kind==='po'?E.conn.map(id=>{ const p=poBy(id); return {n:p.name,m:`${p.epc} · ${p.id} · ${p.type}`,v:priceTxt(p)}; }):E.conn.map(k=>{ const x=psBy(k); return {n:x.name,m:`${x.po.name} · ${x.kind}`,v:''}; });
 $('#connList').innerHTML=items.map((x,n)=>`<li data-go="conn"><span class="m">${n+1}</span><span class="t">${esc(x.n)}<span class="d">${esc(x.m)}</span></span>${x.v?`<span class="v">${x.v}</span>`:''}</li>`).join('')||'<li class="none">연결한 상품이 없어요. 연결 상품 섹션에서 추가하세요</li>';
 $$('#connList [data-go]').forEach(li=>li.addEventListener('click',()=>goSec('conn')));
 const bl=blocking(E).length;
 $('#poCount').innerHTML=E.conn.length+`<small>${E.kind==='po'?'상품':'PS'}</small>`;
 const sb=$('#bSave'); sb.disabled=false; sb.classList.toggle('pending',bl>0); sb.title=bl?`필수 확인 ${bl}건을 채우면 승인요청할 수 있습니다. 누르면 채울 섹션으로 이동해요. 임시저장은 지금도 됩니다`:'';
 renderPreview();
}

// 하단 바: 보이는 필수 섹션 중 완료한 수
function rSummary(S){
 const req=SECS.filter(([k,,r])=>r&&!secHidden(k,E)&&S[k].st!=='na'), done=req.filter(([k])=>S[k].st==='done').length;
 $('#dockMsg').innerHTML=`필수 <b>${done}</b>/${req.length} 완료`;
}

// ---------- 1. 전시 유형 ----------
function rKind(){
 const T=[['po','상품 판매'],['ps','[TBD] 상품 개별 전시 (PS · 주문 없음)']];
 $('#sb-kind').innerHTML=`<div class="row"><label class="fl">무엇을 전시하나요?</label><span class="srch-radio" role="radiogroup" aria-label="전시 유형">${T.map(([k,l])=>`<label><input type="radio" name="dKind" value="${k}" ${E.kind===k?'checked':''}>${l}</label>`).join('')}</span></div>
 ${ntc('',E.kind==='po'?'EPC 상품(PO)을 연결해 판매합니다. 고객 선택 방식과 주문 구성을 설정해요.':'PO 안의 서비스(PS) 하나를 소개용으로 전시합니다. 주문은 PS가 속한 PO 전시에서 진행되므로 고객 선택 방식·가입 유형·할부·티다팩·주문 구성은 쓰지 않아요.').replace('class="ntc ','style="margin:0" class="ntc ')}`;
 $$('#sb-kind input[name=dKind]').forEach(r=>r.addEventListener('change',()=>{ const k=r.value; if(k===E.kind) return; if(E.conn.length&&!confirm('전시 유형을 바꾸면 연결 상품과 고객 선택 방식이 초기화됩니다. 바꿀까요?')){ rKind(); return; } E.kind=k; E.conn=[]; E.rep=[]; E.areas=k==='po'?[newArea('','fixed')]:[]; E.method='fixed'; cur=E.areas[0]&&E.areas[0].id; PV={}; syncConnTpls(); syncBenefits(E); renderAll(); }));
}

// ---------- 2. 연결 상품 ----------
function rConn(){
 const po=E.kind==='po';
 const rows=po?E.conn.map(id=>{ const p=poBy(id); return `<tr><td>${p.epc}</td><td>${p.ver}</td><td><b>${esc(p.name)}</b>${hasSel(p)?' <span class="chip acc">선택 PS 있음</span>':''}</td><td>${p.id}</td><td>${p.type}</td><td><button type="button" class="lnk" data-rl="${id}">${linkedDsp(id).length+1}개 보기</button></td><td>${repCell(id)}</td><td><span class="chip ok">${p.sale}</span></td><td><button type="button" class="btn sm" data-view="${id}">보기</button></td><td><button type="button" class="btn sm" data-un="${id}">연결 해제</button></td></tr>`; }).join('')
  :E.conn.map(k=>{ const s=psBy(k); return `<tr><td>${s.key.split('|').slice(1).join('-')}</td><td>${s.po.ver}</td><td><b>${esc(s.name)}</b></td><td>${s.po.id}</td><td>${s.kind}</td><td>${esc(s.po.name)}</td><td><span class="chip ok">${s.po.sale}</span></td><td><button type="button" class="btn sm" data-view="${s.po.id}">보기</button></td><td><button type="button" class="btn sm" data-un="${k}">연결 해제</button></td></tr>`; }).join('');
 $('#sb-conn').innerHTML=`<div class="sec-h"><b>연결한 ${po?'상품':'PS'}</b><span class="chip acc">${E.conn.length}건</span><button type="button" class="btn sm" id="connReset" style="margin-left:auto" ${E.conn.length?'':'disabled'}>초기화</button><button type="button" class="btn primary sm" id="connAdd">${po?'+ 상품 추가':'+ PS 추가'}</button></div>
 ${po&&E.conn.length?repBar():''}
 ${E.conn.length?`<div class="cl"><table><thead><tr>${po?'<th>EPC 상품ID</th><th>버전</th><th>EPC 상품명</th><th>상품 코드</th><th>상품 구분</th><th>연결된 전시</th><th>대표 전시</th><th>판매 상태</th><th>상세</th><th>삭제</th>':'<th>PS ID</th><th>버전</th><th>PS명</th><th>소속 PO 코드</th><th>구분</th><th>소속 PO</th><th>판매 상태</th><th>상세</th><th>삭제</th>'}</tr></thead><tbody>${rows}</tbody></table></div>`
 :`<div class="empty">${po?'상품 추가로 EPC 상품을 조회해 연결하세요. 연결한 상품만 고객 선택 방식에 배정할 수 있어요':'PS 추가로 소개할 PS를 고르세요'}</div>`}`;
 $('#connAdd').addEventListener('click',po?openConnModal:openPsModal);
 // 초기화: 연결한 상품을 모두 해제하고 구성 영역 배정·옵션 매핑에서도 뺀다
 $('#connReset').addEventListener('click',()=>{ if(!E.conn.length) return; E.conn=[]; if(po) E.areas.forEach(a=>{ a.pos=[]; a.map={}; }); onConnChange(); toast('연결 상품을 초기화했어요'); });
 $$('#sb-conn [data-view]').forEach(b=>b.addEventListener('click',()=>openPoDetail(b.dataset.view)));
 $$('#sb-conn [data-rs]').forEach(b=>b.addEventListener('click',()=>setRep(b.dataset.rs,true)));
 $$('#sb-conn [data-ru]').forEach(b=>b.addEventListener('click',()=>setRep(b.dataset.ru,false)));
 $$('#sb-conn [data-rl]').forEach(b=>b.addEventListener('click',()=>openRepModal(b.dataset.rl)));
 const ra=$('#repAll'); if(ra) ra.addEventListener('click',()=>{ const n=E.conn.filter(id=>!E.rep.includes(id)&&repOf(id)).length; E.rep=E.conn.slice(); rConn(); refresh(); toast(n?`대표 전시 ${n}건이 이 전시로 바뀌어요 (저장하면 반영)`:'모든 상품의 대표를 이 전시로 지정했어요'); });
 $$('#sb-conn [data-un]').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.un; E.conn=E.conn.filter(x=>x!==id); if(po) E.areas.forEach(a=>{ a.pos=a.pos.filter(x=>x!==id); Object.keys(a.map).forEach(k=>{ if(a.map[k]===id) delete a.map[k]; }); }); onConnChange(); toast('연결을 해제했어요'); }));
}
// 대표 전시: EPC 상품마다 대표 전시를 1개 지정한다. 이 전시를 대표로 지정하면 저장할 때 기존 대표 전시는 일반 전시로 바뀐다
const dspCode=d=>`DSP-${String(d.id).padStart(4,'0')}`;
const linkedDsp=id=>DISPLAYS.filter(d=>d.id!==E.id&&d.kind==='po'&&d.conn.includes(id));
const repOf=id=>linkedDsp(id).find(d=>(d.rep||[]).includes(id))||null;
function repBar(){ const n=E.conn.filter(id=>E.rep.includes(id)).length;
 return `<div class="repbar"><div><b>대표 전시</b><span>EPC 상품마다 대표 전시를 1개 지정해요. 이 전시를 대표로 지정한 상품 <em>${n}</em> / ${E.conn.length}개</span></div><button type="button" class="btn sm" id="repAll" ${n===E.conn.length?'disabled':''}>전체를 이 전시로 지정</button></div>`; }
function repCell(id){
 if(E.rep.includes(id)) return `<div class="repc"><span class="rep me">이 전시</span><button type="button" class="lnk" data-ru="${id}">해제</button></div>`;
 const r=repOf(id);
 return `<div class="repc"><div class="repn">${r?`<span title="${esc(nameText(r.name))}">${esc(nameText(r.name))}</span><small>${dspCode(r)}${r.show?'':' · 미전시'}</small>`:'<span class="faint">지정 안 됨</span>'}</div><button type="button" class="btn sm" data-rs="${id}">이 전시로 지정</button></div>`;
}
function setRep(id,on){ const r=repOf(id), p=poBy(id);
 if(on){ E.rep=[...new Set([...E.rep,id])]; toast(r?`${p.name} 대표가 "${nameText(r.name)}"에서 이 전시로 바뀌어요 (저장하면 반영)`:'이 전시를 대표로 지정했어요'); }
 else { E.rep=E.rep.filter(x=>x!==id); toast(r?'기존 대표 전시로 돌아가요':'대표 지정을 해제했어요'); }
 rConn(); refresh(); }
// 연결된 전시 상품 목록에서 대표를 고른다. 다른 전시를 고르면 그 전시의 대표 지정을 바로 바꾼다
function openRepModal(id){
 const p=poBy(id);
 const draw=()=>{
  const me=E.rep.includes(id), r=repOf(id), top=me?'this':r?r.id:null;
  const rows=[{this:true},...linkedDsp(id)];
  $('#mBody').innerHTML=`<div class="repbar" style="margin-bottom:12px"><div><b>대표 전시 상품</b><span class="rep-now">${me?'이 전시 (작성 중)':r?esc(nameText(r.name)):'<span class="faint">지정 안 됨</span>'}${r&&!me?` <small>${dspCode(r)}</small>`:''}</span><span>연결된 전시 상품 중 EPC 상품별로 1개를 지정해요</span></div>${top?'<button type="button" class="btn sm" id="rpOff">대표 지정 해제</button>':''}</div>
  <div class="cl" style="max-height:none"><table><thead><tr><th>전시명 / 전시 코드</th><th>전시 채널</th><th>고객 선택 방식</th><th>전시 여부</th><th>전시 기간</th><th>대표 전시</th></tr></thead><tbody>${rows.map(d=>{ const k=d.this?'this':d.id, on=k===top;
   return `<tr class="${on?'me':''}"><td><b>${d.this?'(이 전시 · 작성 중)':esc(nameText(d.name))}</b><br><small class="faint">${d.this?'저장 전 · 저장하면 반영':dspCode(d)}</small></td><td>${d.this?'-':d.channels.join('<br>')||'-'}</td><td>${d.this?METHOD[E.method]:METHOD[d.method]}</td><td>${d.this?'<span class="chip">작성 중</span>':`<span class="chip ${d.show?'ok':''}">${d.show?'전시':'미전시'}</span>`}</td><td>${d.this?'-':esc(periodTxt(d)).replace(' ~ ','<br>~ ')}</td><td>${on?'<span class="rep me">대표 전시</span>':`<button type="button" class="btn sm" data-rp="${k}">대표로 지정</button>`}</td></tr>`; }).join('')}</tbody></table></div>
  ${r&&!me&&!r.show?ntc('warn','대표 전시가 미전시 상태예요. EPC 상품에서 대표 전시로 이동하면 고객이 볼 수 없어요').replace('class="ntc ','style="margin:12px 0 0" class="ntc '):''}`;
  $('#mFoot').innerHTML=`<span class="pill" style="margin-right:auto">${esc(p.name)} · ${p.id}</span><button type="button" class="btn primary" id="mo">확인</button>`;
  $$('#mBody [data-rp]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.rp;
   if(k==='this') E.rep=[...new Set([...E.rep,id])];
   else { E.rep=E.rep.filter(x=>x!==id); DISPLAYS.forEach(d=>{ d.rep=(d.rep||[]).filter(x=>x!==id); if(d.id===+k) d.rep.push(id); }); saveList(); }
   draw(); }));
  const off=$('#rpOff'); if(off) off.addEventListener('click',()=>{ if(E.rep.includes(id)) E.rep=E.rep.filter(x=>x!==id); else { const d=repOf(id); if(d){ d.rep=d.rep.filter(x=>x!==id); saveList(); } } draw(); });
  $('#mo').addEventListener('click',()=>{ closeModal(); rConn(); refresh(); });
 };
 modal('연결된 전시 상품',`${p.name} · 저장한 전시 기준`,900); draw();
}
// 고정형·선택형은 영역이 1개라 연결 상품이 그대로 영역의 PO가 된다
function syncSingle(){ if(E.kind!=='po'||E.method==='complex'||!E.areas[0]) return; const a=E.areas[0]; a.pos=[...a.pos.filter(id=>E.conn.includes(id)),...E.conn.filter(id=>!a.pos.includes(id))]; a.def=(a.def||[]).filter(id=>a.pos.includes(id)); Object.keys(a.map).forEach(k=>{ if(!a.pos.includes(a.map[k])) delete a.map[k]; }); if(a.mode==='opt'&&areaHasSel(a)) a.mode='list'; }
// 연결 상품이 가진 템플릿을 추가 정보에 자동으로 넣는다(템플릿 연결). 이미 있는 템플릿은 다시 넣지 않고,
// 연결 해제로 가진 상품이 없어진 자동 항목은 뺀다. 복사해 직접 수정한 항목과 사용자가 지운 템플릿은 건드리지 않는다
const connPoList=()=>E.conn.map(k=>E.kind==='po'?poBy(k):psBy(k).po);
function syncConnTpls(){
 const off=E.tplOff||[], want=[...new Set(connPoList().flatMap(poTpls))].filter(id=>!off.includes(id));
 const n0=E.extras.length; E.extras=E.extras.filter(x=>!(x.auto&&x.mode==='link'&&!want.includes(x.src)));
 const have=new Set(E.extras.map(x=>x.src).filter(Boolean)), add=want.filter(id=>!have.has(id));
 add.forEach(id=>E.extras.push({id:nid(),t:tplBy(id).t,mode:'link',src:id,show:true,txt:'',auto:true}));
 if(add.length||E.extras.length!==n0) rExtra();
 return add.length;
}
function onConnChange(){ syncSingle(); PV={}; E.rep=E.rep.filter(id=>E.conn.includes(id)); syncBenefits(E); const n=syncConnTpls(); rConn(); rMethod(); rBasic(); rDesc(); rSearch(); rJoin(); rInst(); rGift(); rTd(); rOrder(); refresh(); return n; }

// ---------- 3. 고객 선택 방식 ----------
const curArea=()=>E.areas.find(a=>a.id===cur);
const areaLabel=a=>a.name.trim()||(E.method==='complex'?`구성 영역 ${E.areas.indexOf(a)+1}`:'고객 선택 방식');
function rMethod(){
 const box=$('#sb-method');
 if(E.kind==='ps'){ box.innerHTML=ntc('','상품 개별 전시(PS)는 판매 단위가 아니라서 고객 선택 방식을 쓰지 않아요.'); return; }
 const M=[['fixed','고정형','연결 상품을 모두 제공'],['select','선택형','연결 상품 중에서 목록·옵션으로 고름'],['complex','복합형','구성 영역 N개를 순서대로 조합']];
 const m=M.find(x=>x[0]===E.method);
 box.innerHTML=`${!E.conn.length?ntc('warn',`먼저 연결 상품을 추가하세요.${E.method==='complex'?' 연결한 상품을 구성 영역에 나눠 담아요.':''}`):''}
 <div class="sub-h">방식</div><div class="type-tiles" role="radiogroup" aria-label="고객 선택 방식">${M.map(([k,t])=>`<button type="button" class="type-tile ${E.method===k?'on':''}" role="radio" aria-checked="${E.method===k}" data-m="${k}">${svg(IC[k])}<span>${t}</span></button>`).join('')}</div>
 <div class="sub-h">${E.method==='complex'?'구성 영역':`${m[1]} 설정`}</div><div id="ae"></div>`;
 $$('#sb-method [data-m]').forEach(b=>b.addEventListener('click',()=>setMethod(b.dataset.m)));
 rAreas();
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
 $('#ae').innerHTML=`<div class="ae ${multi?'':'single'}">${multi?`<div><div class="al" id="al"></div><button type="button" class="btn dash-add" id="addA" style="margin-top:8px">+ 구성 추가</button><div id="alUn"></div></div>`:''}<div class="ad" id="ad"></div></div><div id="adOut"></div>`;
 if(multi){ rAreaList(); $('#addA').addEventListener('click',()=>{ const a=newArea('','fixed'); E.areas.push(a); cur=a.id; rAreas(); refresh(); }); }
 rDetail();
}
// 복합형 제공 조건: 항상 제공 / 특정 선택일 때만 / 선택에 따라 후보 바꾸기. 기준 영역은 이 영역보다 위에 있는 영역 중에서 고른다
const CONDN=[['always','항상 제공','다른 영역과 관계없이 늘 보여줘요'],['only','특정 선택일 때만','앞 영역에서 특정 상품을 골랐을 때만 이 영역이 나와요'],['relation','선택에 따라 후보 바꾸기','앞 영역 선택값마다 이 영역 후보를 따로 정해요 (A면 B, C면 D)']];
const condParent=a=>E.method==='complex'&&a.cond&&a.cond!=='always'?E.areas.slice(0,E.areas.indexOf(a)).find(x=>x.id===a.parent)||null:null;
const condKids=a=>E.areas.filter(x=>x.cond&&x.cond!=='always'&&x.parent===a.id);
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
 let h=`<div class="sub-h">구성 제공 조건</div><div class="cdg" role="radiogroup" aria-label="구성 제공 조건">${CONDN.map(([k,t,s])=>{ const dis=k!=='always'&&!el.length&&a.cond!==k; return `<label class="cdc ${a.cond===k?'on':''} ${dis?'dis':''}"><input type="radio" name="cd${a.id}" data-cd="${k}" ${a.cond===k?'checked':''} ${dis?'disabled':''}><span><b>${t}</b><small>${dis?why:s}</small></span></label>`; }).join('')}</div>`;
 if(a.cond==='always'||!i) return h;
 const fixedP=p&&!canBase(p), opt=(x,j)=>`<option value="${x.id}" ${p&&p.id===x.id?'selected':''} ${canBase(x)?'':'disabled'}>${j+1}번 ${esc(areaLabel(x))}${canBase(x)?' · '+MODE[x.mode]:' (고정 · 기준 불가)'}</option>`;
 const sel=`<div class="row" style="margin-bottom:12px"><select id="cdPa" aria-label="기준 영역" style="min-width:220px">${p?'':'<option value="">기준 영역 선택</option>'}${fixedP?`<option value="${p.id}" selected>${E.areas.indexOf(p)+1}번 ${esc(areaLabel(p))} (고정 · 기준 불가)</option>`:''}${E.areas.slice(0,i).map((x,j)=>fixedP&&x.id===p.id?'':opt(x,j)).join('')}</select><b class="cond-guide">${a.cond==='only'?`에서 아래 상품을 고르면 ‘${i+1}번 ${esc(areaLabel(a))}’가 나와요.`:`에서 고른 상품에 따라 ‘${i+1}번 ${esc(areaLabel(a))}’ 보여줄 상품을 정해요.`}</b></div>`;
 if(!p) return h+`<div class="rel">${sel}</div>`;
 // 기준 영역이 나중에 고정으로 바뀐 경우: 칩 대신 경고와 해결 방법
 if(fixedP) return h+`<div class="rel">${sel}<div class="fbx warn">${E.areas.indexOf(p)+1}번 ${esc(areaLabel(p))}은 <b>고정</b>이라 고객이 고르지 않아요. 구성 상품이 늘 포함되니 조건이 항상 같아집니다.<br>${el.length?'다른 기준 영역을 고르거나 ':''}<a href="#" id="cdAlways">항상 제공으로 바꾸기</a></div></div>`;
 const ps=p.pos, pl=esc(areaLabel(p));
 if(a.cond==='only') return h+`<div class="rel">${sel}<div>${ps.map(v=>`<label class="ccb"><input type="checkbox" data-tg="${v}" ${a.trig.includes(v)?'checked':''}>${esc(poBy(v).name)}</label>`).join('')||'<span class="cskip">기준 영역에 배정된 PO가 없어요</span>'}</div></div>`;
 const cs=a.pos, onOf=v=>(a.rel[v]||[]).filter(c=>cs.includes(c));
 const rows=ps.map(v=>{ const on=onOf(v); return `<tr><td style="width:32%"><span class="pill">${pl}</span><br><b>${esc(poBy(v).name)}</b> 고르면</td><td>${cs.map(c=>`<label class="ccb"><input type="checkbox" data-rv="${v}" data-rc="${c}" ${on.includes(c)?'checked':''}>${esc(poBy(c).name)}</label>`).join('')||'<span class="cskip">이 영역에 PO를 먼저 배정하세요</span>'}${cs.length&&!on.length?'<span class="cskip">후보 없음 · 이 영역을 건너뛰어요</span>':''}</td></tr>`; }).join('');
 const used=new Set(ps.flatMap(onOf)), unused=cs.filter(c=>!used.has(c)), empty=ps.filter(v=>!onOf(v).length);
 const fb=!cs.length||!ps.length?'':unused.length?`<div class="fbx warn">어떤 선택에도 안 나오는 후보 ${unused.length}개: ${unused.map(c=>esc(poBy(c).name)).join(', ')}</div>`:`<div class="fbx ok">모든 후보가 규칙에 연결됐어요${empty.length?` · ${empty.map(v=>esc(poBy(v).name)).join(', ')} 선택 시 이 영역은 건너뛰어요`:''}</div>`;
 return h+`<div class="rel">${sel}${ps.length?`<div class="cl"><table><thead><tr><th>기준 영역 선택값</th><th>이 영역에 보여줄 후보 (배정된 PO 중)</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<span class="cskip">기준 영역에 배정된 PO가 없어요</span>'}${fb}</div>`;
}
function rAreaList(){
 $('#al').innerHTML=E.areas.map((a,i)=>{ const p=condParent(a), pi=p&&E.areas.indexOf(p)+1, tg=!p?'':!canBase(p)?'<span class="chip warn">기준 영역이 고정</span>':`<span class="chip acc">${a.cond==='relation'?`${pi}선택에 따라`:`${pi}번에서 고르면 노출`}</span>`; return `<div class="ali ${a.id===cur?'on':''}" data-a="${a.id}" style="margin-left:${condDepth(a)*16}px"><span class="ix">${i+1}</span><div class="nm"><b>${esc(areaLabel(a))}</b><small>${MODE[a.mode]}</small>${tg?`<div>${tg}</div>`:''}</div>${gripBtn(i,esc(areaLabel(a)))}</div>`; }).join('')||'<div class="empty">구성 영역을 추가하세요</div>';
 $$('#al .ali[data-a]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.closest('.grip')) return; cur=+el.dataset.a; rAreas(); }));
 dndList('#al','a',E.areas,()=>{ rAreas(); refresh(); },areaOrderOk);
 // 어느 영역에도 배정되지 않은 연결 상품
 const un=E.conn.filter(id=>!E.areas.some(a=>a.pos.includes(id)));
 $('#alUn').innerHTML=un.length?`<div class="un warn"><b>미배정 ${un.length}</b><br>${un.map(id=>esc(poBy(id).name)).join(', ')}</div>`:E.conn.length?'<div class="un ok">연결 상품이 모두 배정됐어요</div>':'';
}
// PO 카드: EPC의 Delivery type·Price policy를 읽기 전용으로 보여 준다
function poCard(po,canRemove){
 const sp=selPS(po);
 const dtRows=po.dt.map(p=>`<div class="ps-r"><span class="chip ${p.req?'':'acc'}">${p.req?'필수':'선택'}</span><span class="nm"><b style="font-weight:600">${esc(p.name)}</b>${p.req?` <span class="poc-meta">${esc(p.desc||'')}</span>`:` <span class="poc-meta">후보 ${p.cands.length}개 · ${p.min===p.max?`${p.min}개 선택`:`${p.min}~${p.max}개 선택`}</span>`}</span></div>`).join('');
 const adds=sp.flatMap(p=>p.cands.map(c=>c.add)); const mx=adds.length?Math.max(...adds):0, mn=adds.length?Math.min(...adds):0;
 return `<div class="poc"><div class="poc-h"><b>${esc(po.name)}</b><span class="chip">${po.type}</span>${sp.length?'<span class="chip acc">선택 PS 있음</span>':''}<span class="poc-meta" style="margin-left:auto">${po.id} · ${po.ver}</span>${canRemove?`<button type="button" class="btn sm" data-rm="${po.id}" aria-label="${esc(po.name)} 배정 해제">해제</button>`:''}</div>
 <div class="poc-body"><div><div class="ro">Delivery type · EPC 읽기 전용</div>${dtRows}</div><div><div class="ro">Price policy · EPC 읽기 전용</div><div style="font-size:12px;padding:2px 0">기본가 <b>${priceTxt(po)}</b></div>${sp.length?`<div class="poc-meta">선택 PS 추가금 ${mn===mx?won(mx):won(mn)+' ~ '+won(mx)}</div>`:''}</div></div></div>`;
}
function rDetail(){
 const a=curArea(); const box=$('#ad'); if(!a){ box.innerHTML='<div class="empty">구성 영역을 추가하세요</div>'; return; }
 const i=E.areas.indexOf(a), multi=E.method==='complex', sel=areaHasSel(a);
 let lg='';
 // 고정형·선택형은 위 소제목이 이미 '○○형 설정'이라 영역 번호 제목은 복합형에서만 쓴다
 const kids=multi?condKids(a):[];
 let h=`${multi?`<div class="sec-h"><b>${i+1}번 구성 영역</b>${kids.length?`<span class="chip">하위 ${kids.length}개가 이 영역을 기준으로 써요</span>`:''}<button type="button" class="btn sm" id="delA" style="margin-left:auto">구성 삭제</button></div>`:''}
 ${multi?`<div class="sub-h"><label for="aName">구성명</label></div><input type="text" id="aName" value="${esc(a.name)}" placeholder="고객에게 보이는 단계 이름 · 입력하면 미리보기에 노출돼요" style="width:100%">
 <div class="sub-h" id="aModeLb">고객이 고르는 방법</div><span class="srch-radio" id="aMode" role="radiogroup" aria-labelledby="aModeLb">${['fixed','list','opt'].map(k=>`<label><input type="radio" name="aMode${a.id}" value="${k}" ${a.mode===k?'checked':''} ${k==='opt'&&sel?'disabled':''}>${MODE[k]}</label>`).join('')}</span>`
 :`<div class="sub-h"><label for="aName">타이틀</label></div><input type="text" id="aName" value="${esc(a.name)}" placeholder="고객 선택 방식 타이틀 · 입력하면 미리보기에 노출돼요" style="width:100%">
 ${E.method==='select'?`<div class="sub-h" id="aModeLb">고객이 고르는 방법</div><span class="srch-radio" id="aMode" role="radiogroup" aria-labelledby="aModeLb">${['list','opt'].map(k=>`<label><input type="radio" name="aMode${a.id}" value="${k}" ${a.mode===k?'checked':''} ${k==='opt'&&sel?'disabled':''}>${MODE[k]}</label>`).join('')}</span>`:''}`}
 ${(multi||E.method==='select')&&sel?ntc('warn',MSG2):''}
 ${multi?`<div class="sub-h">구성에 넣을 상품</div>
 ${a.mode==='fixed'&&sel?ntc('info',MSG1):''}
 ${E.conn.length?`<div class="pg">${E.conn.map(id=>{ const p=poBy(id), on=a.pos.includes(id), o=E.areas.filter(x=>x!==a&&x.pos.includes(id)).map(x=>E.areas.indexOf(x)+1);
  // 다른 구성에서 이미 쓰는 상품은 고를 수 없다 (이미 체크된 상품은 해제할 수 있게 둔다)
  const used=!on&&o.length>0, block=used||(!on&&a.mode==='opt'&&hasSel(p));
  return `<label class="pgr ${on?'on':''} ${block?'dis':''}" ${block?`title="${used?'다른 구성에서 사용 중인 상품이에요':MSG2}"`:''}><input type="checkbox" data-pc="${id}" ${on?'checked':''} ${block?'disabled':''}><span class="pn">${esc(p.name)}${o.length?`<small>· ${o.map(n=>`${n}번 구성 사용중`).join(', ')}</small>`:''}</span>${hasSel(p)?'<span class="chip acc">선택 PS</span>':''}<span class="chip">${p.type}</span></label>`; }).join('')}</div>`:'<div class="empty">연결 상품을 먼저 추가하세요</div>'}`:''}`;
 // 고정 안내: 선택 항목 안내(MSG1)를 한 박스에 합친다. 고정형(영역 1개)은 설정 박스 밖(아래)에 둔다
 let fixedGuide='';
 if(a.mode==='fixed'){ const g=a.pos.length?guide(`대상 상품 <b>${a.pos.length}개가 모두 고정으로 포함</b>됩니다`,`고객이 상품을 따로 선택하지 않습니다${sel?`<br>${MSG1}`:''}`):guide('대상 상품이 없습니다',multi?'PO를 배정하면 모두 고정으로 포함됩니다':'연결 상품을 추가하면 모두 고정으로 포함됩니다');
  // 복합형은 소제목 없이, 상품이 있을 때만 안내한다
  if(multi){ if(a.pos.length) h+=g; } else fixedGuide=g; }
 // 복합형 목록에서 선택: 최소 선택 수량 + (선택) 최대 선택 수량. '선택하지 않아도 됨'·상품 순서/기본 선택은 쓰지 않는다
 if(a.mode==='list'&&multi){ a.opt0=false; a.def=[]; const r=rng(a);
  lg=guide(`대상 상품 ${a.pos.length}개 중 <b>${r.lo===r.hi?r.lo:r.lo+'~'+r.hi}개를 선택</b>합니다`,'고객이 이 수만큼 골라야 다음으로 넘어갑니다');
  h+=`<div class="sub-h">최소 선택 수량</div><div class="row"><input type="number" id="qQ" min="1" value="${a.q}" aria-label="최소 선택 수량"><span class="pill">개</span>${a.useMax?`<span class="pill">~</span><input type="number" id="qMx" min="1" value="${a.mx}" aria-label="최대 선택 수량"><span class="pill">개</span>`:''}<label class="chkl" style="margin-left:12px"><input type="checkbox" id="qUse" ${a.useMax?'checked':''}>최대 선택 수량</label></div>${lg}`; }
 else if(a.mode==='list'){ const r=rng(a), N=a.pos.length;
  const f=a.opt0?`<span class="pill">최대</span><input type="number" id="qMx" min="1" value="${a.useMax?a.mx:a.q}"><span class="pill">개까지</span>`
   :(a.useMax?`<span class="pill">최소</span><input type="number" id="qQ" min="1" value="${a.q}"><span class="pill">~ 최대</span><input type="number" id="qMx" min="1" value="${a.mx}"><span class="pill">개</span>`
   :`<span class="pill">선택 수량</span><input type="number" id="qQ" min="1" value="${a.q}"><span class="pill">개</span>`);
  const t=a.opt0?[`최대 ${r.hi}개까지 선택`,'고객이 하나도 고르지 않아도 됩니다']:[`${r.lo===r.hi?r.lo:r.lo+'~'+r.hi}개를 선택`,'고객이 이 수만큼 골라야 다음으로 넘어갑니다'];
  lg=guide(`대상 상품 ${N}개 중 <b>${t[0]}</b>합니다`,t[1]);
  h+=`<div class="sub-h">상품 목록 설정</div><div class="row">${f}<label class="chkl" style="margin-left:12px"><input type="checkbox" id="qUse" ${a.useMax?'checked':''}>최대 수량 따로 설정</label></div>
  <div class="sub-h">상품 순서/기본 선택</div>
  ${a.pos.map((id,j)=>{ const p=poBy(id); return `<div class="ali fixd"><span class="ix">${j+1}</span><div class="nm"><b>${esc(p.name)}</b><small>${priceTxt(p)}${hasSel(p)?' · 선택 PS 있음':''}</small></div><label class="chkl"><input type="${r.hi===1?'radio':'checkbox'}" name="df${a.id}" data-df="${id}" ${(a.def||[]).includes(id)?'checked':''}>기본</label>${mvBtns('p',j,a.pos.length,esc(p.name))}</div>`; }).join('')||'<div class="empty">연결 상품을 추가하세요</div>'}`; }
 if(a.mode==='opt'){ const c=combos(a), ok=c.filter(k=>a.map[k]&&a.pos.includes(a.map[k])).length, cand=a.pos.filter(id=>!hasSel(poBy(id)));
  h+=`<div class="sub-h">옵션 구성<button type="button" class="btn sm" id="addO" style="margin-left:auto">옵션 추가</button></div>
  ${a.opts.map((o,k)=>`<div class="axis"><div class="an"><input type="text" data-on="${k}" value="${esc(o.name)}" placeholder="옵션명 (예: 용량, 색상)" style="flex:1;min-width:140px"><button type="button" class="btn sm" data-ox="${k}">삭제</button></div>
  <div class="adisp"><span class="srch-radio" role="radiogroup" aria-label="${esc(o.name)||'옵션'} 표시 방식">${ODISP.map(([v,t])=>`<label><input type="radio" name="od${a.id}_${k}" data-od="${k}" value="${v}" ${o.disp===v?'checked':''}>${t}</label>`).join('')}</span></div>
  <div class="axchips">${o.vals.map((v,j)=>`<span class="axchip val">${o.disp==='chip'?`<i class="dot" style="background:${COLOR[v]||'#bbb'}"></i>`:''}${esc(v)}<button type="button" data-vx="${k}:${j}" aria-label="${esc(v)} 삭제">×</button></span>`).join('')}<input type="text" data-va="${k}" placeholder="값 입력 후 Enter"></div></div>`).join('')}
  <div class="sub-h">조합별 PO 매핑<small>${c.length}개 조합</small><span class="chip ${c.length&&ok===c.length?'ok':'warn'}" style="margin-left:auto">${ok}/${c.length} 매핑</span>${c.length&&cand.length?'<button type="button" class="btn sm" id="autoMap">이름으로 자동 매핑</button>':''}</div>
  ${c.length?`<div class="cl"><table><thead><tr>${a.opts.filter(o=>o.name.trim()&&o.vals.length).map(o=>`<th>${esc(o.name)}</th>`).join('')}<th style="width:50%">매핑 PO <span class="pill">(${multi?'배정한 PO':'연결 상품'} 중)</span></th></tr></thead><tbody>${c.map(k=>`<tr>${k.split('|').map(v=>`<td>${esc(v)}</td>`).join('')}<td><select data-mk="${esc(k)}" aria-label="${esc(k)} 매핑"><option value="">PO 선택</option>${cand.map(id=>`<option value="${id}" ${a.map[k]===id?'selected':''}>${esc(poBy(id).name)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">옵션명과 값을 넣으면 조합이 생겨요</div>'}
  ${!cand.length?`<div class="er">매핑할 PO가 없어요. ${multi?'위에서 PO를 먼저 배정하세요':'연결 상품을 먼저 추가하세요'}</div>`:''}`; }
 if(multi) h+=condHtml(a,i);
 box.innerHTML=h;
 // 고정형·선택형(영역 1개)의 안내 박스는 설정 박스 밖 아래에 둔다
 const out=$('#adOut'); if(out) out.innerHTML=fixedGuide||(!multi&&lg?lg:'');
 const ch=()=>{ PV={}; rMethod(); refresh(); };
 const q=s=>box.querySelector(s), qa=s=>[...box.querySelectorAll(s)];
 q('#aName').addEventListener('input',ev=>{ a.name=ev.target.value; if(multi) rAreaList(); refresh(); });
 const dA=q('#delA'); if(dA) dA.addEventListener('click',()=>{
  if(kids.length&&!confirm(`${kids.map(areaLabel).join(', ')} 영역이 이 영역을 기준으로 쓰고 있어요. 삭제하면 그 영역의 제공 조건이 "항상 제공"으로 바뀝니다. 삭제할까요?`)) return;
  kids.forEach(k=>Object.assign(k,{cond:'always',parent:null})); E.areas.splice(i,1); cur=(E.areas[i]||E.areas[i-1]||{}).id; ch(); });
 // 제공 조건
 // 조건을 고르면 기준 영역이 없거나 고정일 때 바로 위의 고르는 영역으로 맞춘다
 qa('[data-cd]').forEach(r=>r.addEventListener('change',()=>{ a.cond=r.dataset.cd; if(a.cond!=='always'){ const p=condParent(a); if(!p||!canBase(p)){ const el=condBases(a); a.parent=el.length?el[el.length-1].id:null; a.trig=[]; a.rel={}; } } ch(); }));
 const ca=q('#cdAlways'); if(ca) ca.addEventListener('click',e=>{ e.preventDefault(); Object.assign(a,{cond:'always',parent:null}); ch(); });
 const pa=q('#cdPa'); if(pa) pa.addEventListener('change',()=>{ a.parent=pa.value?+pa.value:null; a.trig=[]; a.rel={}; ch(); });
 qa('[data-tg]').forEach(b=>b.addEventListener('change',()=>{ const v=b.dataset.tg; a.trig=b.checked?[...new Set([...a.trig,v])]:a.trig.filter(x=>x!==v); ch(); }));
 qa('[data-rc]').forEach(b=>b.addEventListener('change',()=>{ const v=b.dataset.rv, c=b.dataset.rc, l=a.rel[v]=a.rel[v]||[], j=l.indexOf(c); if(b.checked&&j<0) l.push(c); if(!b.checked&&j>=0) l.splice(j,1); ch(); }));
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
 const ao=q('#addO'); if(ao) ao.addEventListener('click',()=>{ a.opts.push({name:'',vals:[],disp:'text'}); rDetail(); });
 qa('[data-on]').forEach(t=>t.addEventListener('change',()=>{ a.opts[+t.dataset.on].name=t.value.trim(); ch(); }));
 qa('[data-od]').forEach(r=>r.addEventListener('change',()=>{ a.opts[+r.dataset.od].disp=r.value; ch(); }));
 qa('[data-ox]').forEach(b=>b.addEventListener('click',()=>{ a.opts.splice(+b.dataset.ox,1); if(!a.opts.length) a.opts.push({name:'',vals:[],disp:'text'}); ch(); }));
 qa('[data-vx]').forEach(b=>b.addEventListener('click',()=>{ const [k,j]=b.dataset.vx.split(':').map(Number); a.opts[k].vals.splice(j,1); ch(); }));
 qa('[data-va]').forEach(t=>t.addEventListener('keydown',ev=>{ if(ev.key!=='Enter'||ev.isComposing) return; ev.preventDefault(); const o=a.opts[+t.dataset.va], v=t.value.trim(); if(v&&!o.vals.includes(v)){ o.vals.push(v); ch(); const n=document.querySelector(`[data-va="${t.dataset.va}"]`); if(n) n.focus(); } else t.value=''; }));
 qa('[data-mk]').forEach(s=>s.addEventListener('change',()=>{ if(s.value) a.map[s.dataset.mk]=s.value; else delete a.map[s.dataset.mk]; ch(); }));
 const am=q('#autoMap'); if(am) am.addEventListener('click',()=>{ let n=0; combos(a).forEach(k=>{ if(a.map[k]) return; const vs=k.split('|'); const p=a.pos.map(poBy).find(p=>!hasSel(p)&&vs.every(v=>p.name.includes(v))); if(p){ a.map[k]=p.id; n++; } }); ch(); toast(n?`${n}개 조합을 자동 매핑했어요`:'이름이 맞는 PO를 찾지 못했어요'); });
}

// ---------- 4. 기본 정보 ----------
const bstyle=b=>b.s==='f'?`background:${b.c};color:#fff;border-color:${b.c}`:`background:transparent;color:${b.c};border-color:${b.c}`;
// 이미지 칸: key는 'main'(대표이미지) 또는 추가이미지 순번
const thumb=(m,key)=>`<div class="img-thumb">${m.u?`<img src="${m.u}" alt="${esc(m.n)}">`:`<div class="img-ph">${svg(IC.image)}${esc(m.n)}</div>`}${key==='main'?'<span class="tag-main">대표</span>':''}<button type="button" class="x" data-imx="${key}" aria-label="${esc(m.n)} 삭제">×</button></div>`;
const CHS=['통합 APP','통합 WEB','T-gate','스마트플래너','BSS(TBD)'], SUB_MAX=4;
// 이미지 아래 공통 구성: 대체 텍스트 입력 + 등록 안내
// id가 없으면 대체 텍스트 칸 없이 안내 목록만 그린다
const imgMeta=(id,val,first,label,size='1440 * 2560',fmt='JPG, PNG')=>`${id?`<div class="alt-row"><input type="text" id="${id}" value="${esc(val)}" maxlength="20" placeholder="웹접근성을 위한 대체 Text를 20자 이내로 입력하세요" aria-label="${label} 대체 텍스트"><span class="pill len" id="${id}Len">${val.length}/20</span></div>`:''}
  <ul class="img-guide"><li>${first}</li><li>권장규격 : ${size}</li><li>권장형식 : ${fmt}</li></ul>`;
// ---------- 4-0. 전시 정보: 기본 정보 · 상세 설명 ----------
// 추가 정보와 같은 구성. 왼쪽 목록에서 고르면 오른쪽에 그 항목 입력이 나온다. 처음에는 기본 정보
const INFO=[['basic','기본 정보'],['desc','상세 설명']];
let curI='basic';
function infoChips(){ const S=sectionState(E); INFO.forEach(([k])=>{ const ch=$('#ist-'+k); if(!ch) return; const [t,c]=STL[S[k].st]; ch.textContent=t; ch.className='chip '+c; }); }
function rInfo(){
 $('#infoList').innerHTML=INFO.map(([k,l])=>`<div class="ali ${k===curI?'on':''}" data-ik="${k}"><div class="nm"><b>${l}</b><div><span class="chip" id="ist-${k}"></span></div></div></div>`).join('');
 INFO.forEach(([k])=>{ $('#sb-'+k).hidden=k!==curI; });
 infoChips();
 $$('#infoList .ali[data-ik]').forEach(el=>el.addEventListener('click',()=>{ curI=el.dataset.ik; rInfo(); }));
}
// 순서: 전시명 → 전시 상품 배지 → 대표이미지 → 추가이미지 → 전시 채널 → 전시 기간 → 전시 여부
function rBasic(){
 const box=$('#sb-basic'), all=CHS.every(c=>E.channels.includes(c));
 box.innerHTML=`<div class="row" style="justify-content:flex-end"><button type="button" class="btn ai-btn" id="epcLoad" ${E.conn.length?'':'disabled'}>${svg(IC.spark)}EPC 정보 불러오기</button></div>
 <div class="row"><label class="fl" for="fName">전시명</label><input type="text" id="fName" value="${esc(E.name)}" maxlength="80" placeholder="고객에게 보이는 이름 (줄바꿈은 &lt;br&gt;)" style="flex:1;min-width:240px"><span class="pill len" id="nameCnt">${E.name.length}/80</span></div>
 <div class="row img-row"><label class="fl">전시 상품 배지</label><div style="flex:1;min-width:0"><div class="row" style="gap:8px;margin:4px 0 0">${autoBadges(E).map(b=>`<span class="bd auto" style="${bstyle(b)}" title="${b.from} 섹션 설정으로 자동 표시">${esc(b.t)}<small>자동</small></span>`).join('')}${E.badges.map((b,i)=>`<span class="bd ${badgeEd&&badgeEd.i===i?'sel':''}" data-bi="${i}" style="${bstyle(b)}" role="button" tabindex="0">${esc(b.t)}<button type="button" class="x" data-bx="${i}" aria-label="${esc(b.t)} 삭제">×</button></span>`).join('')}${E.badges.length<3-autoBadges(E).length?'<button type="button" class="addb" id="bAdd" aria-label="배지 추가">+</button>':''}<span class="pill">최대 3개 · 사은품·티다팩 자동 배지 포함</span></div><div id="bed"></div></div></div>
 <div class="row img-row"><label class="fl">대표이미지</label><div style="flex:1;min-width:0"><div class="img-list">${E.main?thumb(E.main,'main'):'<button type="button" class="img-add" id="mainAdd"><b>+</b>이미지 등록</button>'}</div>
  ${imgMeta('mainAlt',E.mainAlt,'1장만 등록할 수 있습니다.','대표이미지')}</div></div>
 <div class="row img-row"><label class="fl">추가이미지</label><div style="flex:1;min-width:0"><div class="img-list">${E.subs.map((m,i)=>thumb(m,i)).join('')}${E.subs.length<SUB_MAX?'<button type="button" class="img-add" id="subAdd"><b>+</b>이미지 추가</button>':''}</div>
  ${imgMeta('subAlt',E.subAlt,`최대 ${SUB_MAX}장까지 등록할 수 있습니다.`,'추가이미지')}</div></div>
 <div class="row"><label class="fl">전시 채널</label><label class="chkl"><input type="checkbox" id="chAll" ${all?'checked':''}>전체</label>${CHS.map(c=>`<label class="chkl"><input type="checkbox" data-ch="${c}" ${E.channels.includes(c)?'checked':''}>${c}</label>`).join('')}<span class="pill">전시할 채널을 선택해 주세요 (복수 선택 가능)</span></div>
 <div class="row"><label class="fl">전시 기간</label><input type="date" id="fFrom" value="${E.from}" aria-label="시작일"><input type="time" id="fFromT" value="${E.fromTime}" aria-label="시작 시간"><span class="pill">~</span><input type="date" id="fTo" value="${E.noEnd?'':E.to}" aria-label="종료일" ${E.noEnd?'disabled':''}><input type="time" id="fToT" value="${E.noEnd?'':E.toTime}" aria-label="종료 시간" ${E.noEnd?'disabled':''}><label class="chkl"><input type="checkbox" id="noEnd" ${E.noEnd?'checked':''}>종료일없음</label></div>
 <div class="row" style="margin-bottom:0"><label class="fl">전시 여부</label><span class="srch-radio" role="radiogroup" aria-label="전시 여부"><label><input type="radio" name="dShow" value="1" ${E.show?'checked':''}>전시 (Y)</label><label><input type="radio" name="dShow" value="0" ${E.show?'':'checked'}>미전시 (N)</label></span></div>`;
 $('#chAll').indeterminate=!all&&E.channels.length>0;
 $('#fName').addEventListener('input',e=>{ E.name=e.target.value; $('#nameCnt').textContent=E.name.length+'/80'; refresh(); });
 $('#mainAlt').addEventListener('input',e=>{ E.mainAlt=e.target.value; $('#mainAltLen').textContent=E.mainAlt.length+'/20'; refresh(); });
 $('#subAlt').addEventListener('input',e=>{ E.subAlt=e.target.value; $('#subAltLen').textContent=E.subAlt.length+'/20'; refresh(); });
 $('#fFromT').addEventListener('change',e=>{ E.fromTime=e.target.value||'00:00'; refresh(); });
 $('#fToT').addEventListener('change',e=>{ E.toTime=e.target.value||'23:59'; refresh(); });
 $('#fFrom').addEventListener('change',e=>{ E.from=e.target.value; refresh(); });
 $('#fTo').addEventListener('change',e=>{ E.to=e.target.value; refresh(); });
 $('#noEnd').addEventListener('change',e=>{ E.noEnd=e.target.checked; if(E.noEnd) E.to=''; rBasic(); refresh(); if(!E.noEnd) $('#fTo').focus(); });
 $('#chAll').addEventListener('change',e=>{ E.channels=e.target.checked?CHS.slice():[]; rBasic(); refresh(); });
 $$('#sb-basic [data-ch]').forEach(c=>c.addEventListener('change',()=>{ const v=c.dataset.ch; E.channels=CHS.filter(x=>x===v?c.checked:E.channels.includes(x)); rBasic(); refresh(); }));
 $$('#sb-basic input[name=dShow]').forEach(r=>r.addEventListener('change',()=>{ E.show=r.value==='1'; refresh(); }));
 $$('#sb-basic [data-imx]').forEach(b=>b.addEventListener('click',()=>{ const k=b.dataset.imx; if(k==='main') E.main=null; else E.subs.splice(+k,1); rBasic(); refresh(); }));
 const ma=$('#mainAdd'); if(ma) ma.addEventListener('click',()=>$('#imgFile').click());
 const sa=$('#subAdd'); if(sa) sa.addEventListener('click',()=>$('#subFile').click());
 $('#epcLoad').addEventListener('click',openEpcLoad);
 $$('#sb-basic [data-bi]').forEach(el=>{ const go=e=>{ if(e.target.closest('[data-bx]')) return; const i=+el.dataset.bi; badgeEd={i,d:Object.assign({},E.badges[i])}; rBasic(); }; el.addEventListener('click',go); el.addEventListener('keydown',e=>{ if(e.target===el&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); go(e); } }); });
 $$('#sb-basic [data-bx]').forEach(b=>b.addEventListener('click',()=>{ E.badges.splice(+b.dataset.bx,1); badgeEd=null; rBasic(); refresh(); }));
 const ba=$('#bAdd'); if(ba) ba.addEventListener('click',()=>{ badgeEd={i:-1,d:{t:'',c:BCOL[E.badges.length%BCOL.length][1],s:'f'}}; rBasic(); $('#bt').focus(); });
 rBadgeEd();
}
const readImgs=files=>Promise.all(files.map(f=>new Promise(r=>{ const rd=new FileReader(); rd.onload=()=>r({n:f.name,u:rd.result}); rd.readAsDataURL(f); })));
$('#imgFile').addEventListener('change',e=>{ const fs=[...e.target.files]; e.target.value=''; readImgs(fs).then(l=>{ if(!l[0]) return; E.main=l[0]; rBasic(); refresh(); toast('대표이미지를 등록했어요'); }); });
$('#subFile').addEventListener('change',e=>{ const fs=[...e.target.files]; e.target.value=''; const room=SUB_MAX-E.subs.length; readImgs(fs.slice(0,room)).then(l=>{ if(!l.length) return; E.subs.push(...l); rBasic(); refresh(); toast(fs.length>room?`추가이미지는 최대 ${SUB_MAX}장이라 ${l.length}장만 추가했어요`:`추가이미지 ${l.length}장을 추가했어요`); }); });
function rBadgeEd(){
 const box=$('#bed'); if(!badgeEd){ box.innerHTML=''; return; } const d=badgeEd.d;
 // 문구만 입력한다. 색상·스타일은 새 배지면 기본값(순서대로 돌아가는 색, 채움), 기존 배지면 그대로 둔다
 box.innerHTML=`<div class="bed"><div class="row"><span class="pill">문구</span><input type="text" id="bt" maxlength="10" value="${esc(d.t)}" placeholder="예: 장기고객혜택" style="flex:1"><span class="pill len" id="btLen">${d.t.length}/10</span></div>
 <div class="er" id="berr"></div><div class="row" style="justify-content:flex-end;gap:4px;margin:0"><button type="button" class="btn sm" id="bCancel">취소</button><button type="button" class="btn sm primary" id="bOk">${badgeEd.i<0?'추가':'적용'}</button></div></div>`;
 $('#bt').addEventListener('input',e=>{ d.t=e.target.value; $('#btLen').textContent=d.t.length+'/10'; $('#berr').textContent=''; });
 $('#bt').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing){ e.preventDefault(); $('#bOk').click(); } });
 $('#bCancel').addEventListener('click',()=>{ badgeEd=null; rBasic(); });
 $('#bOk').addEventListener('click',()=>{ const t=d.t.trim(); if(!t){ $('#berr').textContent='배지 문구를 입력하세요'; return; } if(E.badges.some((b,i)=>b.t===t&&i!==badgeEd.i)){ $('#berr').textContent='같은 문구의 배지가 이미 있어요'; return; } d.t=t; if(badgeEd.i<0) E.badges.push(Object.assign({},d)); else E.badges[badgeEd.i]=Object.assign({},d); badgeEd=null; rBasic(); refresh(); });
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
const htmlText=h=>new DOMParser().parseFromString(`<body>${h}</body>`,'text/html').body.textContent.trim();
const htmlHasImg=h=>/<img\b/i.test(h);
const descFilled=d=>d.descMode==='image'?d.descImgs.length>0:d.descMode==='html'&&(!!htmlText(d.descHtml)||htmlHasImg(d.descHtml));
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
const RTE_SRC={desc:false,note:false}; // 편집기별 HTML 코드 보기 여부
const rteMarkup=(k,html,label,ph)=>`<div class="rte" data-rte="${k}"><div class="rte-bar" role="toolbar" aria-label="${label} 서식">${RT.map(t=>t==='|'?'<i aria-hidden="true"></i>':`<button type="button" data-rt="${t[0]}" title="${t[2]}" aria-label="${t[2]}" ${RTE_SRC[k]?'disabled':''}>${t[1]}</button>`).join('')}<button type="button" class="rte-code-btn ${RTE_SRC[k]?'on':''}" data-src aria-pressed="${RTE_SRC[k]}" title="HTML 코드 보기">&lt;/&gt; HTML</button></div>
  ${RTE_SRC[k]?`<textarea class="rte-code" spellcheck="false" aria-label="${label} HTML">${esc(html)}</textarea>`:`<div class="rte-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${label}" data-ph="${ph}"></div>`}</div>`;
function bindRte(k,get,set){
 const root=$(`#sb-desc [data-rte="${k}"]`); if(!root) return;
 root.querySelector('[data-src]').addEventListener('click',()=>{ if(RTE_SRC[k]) set(sanitize(root.querySelector('.rte-code').value)); RTE_SRC[k]=!RTE_SRC[k]; rDesc(); refresh(); });
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
 box.innerHTML=`<div class="row"><label class="fl">작성방식</label><span class="srch-radio" role="radiogroup" aria-label="작성방식">${DESC_MODES.map(([k,l])=>`<label><input type="radio" name="dMode" value="${k}" ${m===k?'checked':''}>${l}</label>`).join('')}</span>${m==='html'?`<button type="button" class="btn sm" id="dEpc" style="margin-left:auto" ${E.conn.length?'':'disabled'}>EPC 상품 소개 가져오기</button>`:''}</div>
 ${body}
 <div class="sub-h">공통 안내 문구</div>
 ${rteMarkup('note',E.descNote,'공통 안내 문구','')}`;
 $$('#sb-desc input[name=dMode]').forEach(r=>r.addEventListener('change',()=>{ if(r.value==='ai'){ alert('AI 추천 적용하기 TBD'); rDesc(); return; } E.descMode=r.value; rDesc(); refresh(); }));
 const ep=$('#dEpc'); if(ep) ep.addEventListener('click',()=>{ const p=connPOs(E)[0]; E.descHtml+=`<p>${esc(p.desc)}</p>`; rDesc(); refresh(); toast(`${p.name}의 EPC 소개를 붙였어요. 이어서 고칠 수 있어요`); });
 if(m==='image'){
  const da=$('#descAdd'); if(da) da.addEventListener('click',()=>$('#descFile').click());
  $$('#sb-desc [data-dx]').forEach(b=>b.addEventListener('click',()=>{ E.descImgs.splice(+b.dataset.dx,1); rDesc(); refresh(); }));
 } else bindRte('desc',()=>E.descHtml,v=>E.descHtml=v);
 bindRte('note',()=>E.descNote,v=>E.descNote=v);
}
$('#descFile').addEventListener('change',e=>{ const fs=[...e.target.files]; e.target.value=''; const room=DESC_MAX-E.descImgs.length; readImgs(fs.slice(0,room)).then(l=>{ if(!l.length) return; E.descImgs.push(...l); rDesc(); refresh(); toast(fs.length>room?`상세 이미지는 최대 ${DESC_MAX}장이라 ${l.length}장만 추가했어요`:`상세 이미지 ${l.length}장을 추가했어요`); }); });

// ---------- 6. 추가 정보 ----------
function xBadge(x){ if(x.mode==='link') return `<span class="src s-link">${x.auto?'상품 템플릿':'템플릿 연결'}</span>`; if(x.mode==='copy') return '<span class="src s-copy">템플릿 복사</span>'; return x.txt.trim()?'<span class="src s-copy">직접 입력</span>':'<span class="src s-none">미입력</span>'; }
const sw=(attr,id,on,label)=>`<label class="switch" title="노출"><input type="checkbox" ${attr}="${id}" ${on?'checked':''} aria-label="${label} 노출"><span aria-hidden="true"></span></label>`;
function rExtra(){
 if(!E.extras.find(x=>x.id===curX)) curX=E.extras[0]&&E.extras[0].id;
 const on=E.extras.filter(x=>x.show).length;
 $('#sb-extra').innerHTML=`<div class="sec-h"><span class="pill">${E.extras.length}개 · 노출 ${on}개 · 고객 화면에 이 순서로 나와요 (끌어서 순서 변경)</span><button type="button" class="btn sm" id="xTpl" style="margin-left:auto">템플릿 불러오기</button><button type="button" class="btn sm" id="xNew">+ 직접 입력</button></div>
 ${E.extras.length?`<div class="ae"><div class="al">${E.extras.map((x,i)=>`<div class="ali ${x.id===curX?'on':''} ${x.show?'':'off'}" data-x="${x.id}" draggable="true">${gripBtn(i,esc(x.t)||'제목 없음')}<div class="nm"><b>${esc(x.t)||'제목 없음'}</b><div>${xBadge(x)}</div></div>${sw('data-xs',x.id,x.show,esc(x.t))}</div>`).join('')}</div><div class="ad" id="xd"></div></div>`
 :'<div class="empty">템플릿 불러오기나 직접 입력으로 유의사항·약관·판매자 정보 같은 콘텐츠를 추가하세요</div>'}`;
 $('#xTpl').addEventListener('click',openTplModal);
 $('#xNew').addEventListener('click',()=>{ const x={id:nid(),t:'',mode:'direct',src:'',show:true,txt:''}; E.extras.push(x); curX=x.id; rExtra(); refresh(); const t=$('#xt'); if(t) t.focus(); });
 $$('#sb-extra .ali[data-x]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.closest('.grip,.switch')) return; curX=+el.dataset.x; rExtra(); }));
 $$('#sb-extra [data-xs]').forEach(c=>c.addEventListener('change',()=>{ const x=E.extras.find(y=>y.id===+c.dataset.xs); x.show=c.checked; rExtra(); refresh(); }));
 dndList('#sb-extra','x',E.extras,()=>{ rExtra(); refresh(); });
 const x=E.extras.find(y=>y.id===curX); if(!x) return;
 const t=x.src&&tplBy(x.src);
 let body='';
 if(x.mode==='link') body=`<p class="pill" style="margin:0 0 6px">연결된 템플릿</p><div class="row" style="margin-bottom:10px"><span class="src s-link">템플릿</span><b>${esc(t.n)}</b><span class="pill">${t.id} · ${t.v} · 전시 ${t.use}곳에서 사용 중</span></div><p class="pill" style="margin:0 0 6px">불러온 내용 (템플릿 관리에서만 수정)</p><div class="bx">${esc(t.body)}</div>`;
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
const SIM_DEF={t:'이런 상품은 어떠세요?',s:'비슷한 조건의 상품을 모아봤어요'}, SIM_LEN=30;
const simText=d=>d.sim.mode==='def'?SIM_DEF:{t:d.sim.t,s:d.sim.s};
function rReview(){
 $('#rvOn').checked=E.review;
 $('#sb-review').innerHTML=`${ntc('','연결 상품의 구매후기가 고객 화면 <b>구매 후기</b> 탭에 자동으로 노출돼요. 평점 · 후기 수 · 최근 후기 순이고, 데이터는 리뷰 시스템 기준이에요.').replace('class="ntc ','style="margin:0" class="ntc ')}`;
}
$('#rvOn').addEventListener('change',e=>{ E.review=e.target.checked; if(!E.review&&PVTAB==='review') PVTAB='order'; refresh(); toast(E.review?'구매후기를 노출해요':'구매후기를 숨겼어요'); });
// ---------- 6-2. 부가 설정: 유사한 상품 · 오퍼링 문구 · 검색 노출 설정 ----------
// 추가 정보와 같은 구성. 왼쪽 목록에서 항목을 고르면 오른쪽에 그 항목 설정이 나오고, 목록의 스위치로 사용 여부를 켜고 끈다
const MORE=[['sim','유사한 상품 구성하기'],['cvm','오퍼링 문구(CVM)'],['search','검색 노출 설정 (SEO)']];
let curM='sim';
const moreObj=k=>k==='sim'?E.sim:k==='cvm'?E.cvm:E.search;
function moreChips(){ const S=sectionState(E); MORE.forEach(([k])=>{ const ch=$('#mst-'+k); if(!ch) return; const [t,c]=STL[S[k].st]; ch.textContent=t; ch.className='chip '+c; }); }
function rMore(){
 $('#moreList').innerHTML=MORE.map(([k,l])=>{ const on=!!moreObj(k).on; return `<div class="ali ${k===curM?'on':''} ${on?'':'off'}" data-mk="${k}"><div class="nm"><b>${l}</b><div><span class="chip" id="mst-${k}"></span></div></div>${sw('data-ms',k,on,l)}</div>`; }).join('');
 MORE.forEach(([k])=>{ $('#sb-'+k).hidden=k!==curM; });
 moreChips();
 $$('#moreList .ali[data-mk]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.closest('.switch')) return; curM=el.dataset.mk; rMore(); }));
 $$('#moreList [data-ms]').forEach(c=>c.addEventListener('change',()=>{ const k=c.dataset.ms; moreObj(k).on=c.checked; rMore(); refresh(); if(k==='sim') toast(c.checked?'유사한 상품을 노출해요':'유사한 상품을 숨겼어요'); }));
}
function rSim(){
 const m=E.sim, t=simText(E), def=m.mode==='def';
 $('#sb-sim').innerHTML=`<div class="ftbl">
 ${seoRow('문구',null,`<div class="tabs" id="smMode" role="radiogroup" aria-label="문구 방식">${[['def','기본 문구'],['custom','직접 입력']].map(([k,l])=>`<button type="button" role="radio" class="${m.mode===k?'on':''}" aria-checked="${m.mode===k}" data-sm="${k}">${l}</button>`).join('')}</div>`)}
 ${seoRow('타이틀',{id:'smTC',v:`${t.t.length}/${SIM_LEN}`},`<input type="text" id="smT" value="${esc(t.t)}" maxlength="${SIM_LEN}" ${def?'disabled':''} placeholder="예: 방금 보신 상품과 유사한 상품" aria-label="타이틀" style="width:100%">`)}
 ${seoRow('소타이틀',{id:'smSC',v:`${t.s.length}/${SIM_LEN}`},`<input type="text" id="smS" value="${esc(t.s)}" maxlength="${SIM_LEN}" ${def?'disabled':''} placeholder="예: 동일한 조건으로 비교한 다른 기기도 확인해보세요" aria-label="소타이틀" style="width:100%">`)}
 </div>
 <div class="simpv" aria-label="고객 화면 문구 미리보기"><b id="smPT">${esc(t.t)||'타이틀을 입력하세요'}</b><span id="smPS">${esc(t.s)||'소타이틀을 입력하세요'}</span></div>
 <p class="pill" style="margin:8px 0 0">상품은 연결 상품과 비슷한 조건의 전시에서 자동으로 골라요</p>`;
 $$('#smMode [data-sm]').forEach(b=>b.addEventListener('click',()=>{ m.mode=b.dataset.sm; if(m.mode==='custom'&&!m.t&&!m.s){ m.t=SIM_DEF.t; m.s=SIM_DEF.s; } rSim(); refresh(); if(m.mode==='custom') $('#smT').focus(); }));
 const bind=(id,k,c)=>$(id).addEventListener('input',e=>{ m[k]=e.target.value; $(c).textContent=`(${m[k].length}/${SIM_LEN})`; $(k==='t'?'#smPT':'#smPS').textContent=m[k]||(k==='t'?'타이틀을 입력하세요':'소타이틀을 입력하세요'); refresh(); });
 bind('#smT','t','#smTC'); bind('#smS','s','#smSC');
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

// ---------- 7-2. 가입 유형 · 할부 설정 (v4-8, 기기 상품 연결 시 필수) ----------
// 고객 화면 주문 단계의 선택지. 쓸 항목을 켜고, 노출 순서와 처음 들어왔을 때의 기본 선택을 정한다. 최소 1개는 켜야 한다
function oList(a,list,defKey,opt){
 return `<div class="olist" role="table" aria-label="${opt.label}"><div class="or hd" role="row"><span>사용</span><span>순서</span><span>항목</span><span>${opt.desc?'고객 화면 문구':'노출'}</span><span class="c">기본 선택</span></div>${list.map((x,i)=>`<div class="or ${x.on?'':'off'}" role="row">${sw(`data-${a}on`,i,x.on,x.k)}${mvBtns(a,i,list.length,x.k)}<b>${x.k}</b>${opt.desc?`<input type="text" data-${a}ds="${i}" value="${esc(x.d)}" maxlength="40" ${x.on?'':'disabled'} aria-label="${x.k} 고객 화면 문구">`:`<span class="pill">${x.on?'노출':'사용 안 함'}</span>`}<label class="c"><input type="radio" name="${a}Def" data-${a}df="${i}" ${E[defKey]===x.k?'checked':''} ${x.on?'':'disabled'} aria-label="${x.k} 기본 선택"></label></div>`).join('')}</div>`;
}
function bindOList(box,a,list,defKey,re){
 const after=()=>{ re(); rGift(); rBasic(); refresh(); };
 $$(`${box} [data-${a}on]`).forEach(c=>c.addEventListener('change',()=>{ const x=list[+c.dataset[a+'on']]; if(!c.checked&&list.filter(y=>y.on).length===1){ c.checked=true; toast('최소 1개는 사용해야 해요'); return; } x.on=c.checked; if(!x.on&&E[defKey]===x.k) E[defKey]=(list.find(y=>y.on)||{}).k||''; after(); }));
 $$(`${box} [data-${a}u]`).forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset[a+'u']; [list[i-1],list[i]]=[list[i],list[i-1]]; after(); }));
 $$(`${box} [data-${a}d]`).forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset[a+'d']; [list[i+1],list[i]]=[list[i],list[i+1]]; after(); }));
 $$(`${box} [data-${a}ds]`).forEach(t=>t.addEventListener('input',()=>{ list[+t.dataset[a+'ds']].d=t.value; renderPreview(); }));
 $$(`${box} [data-${a}df]`).forEach(r=>r.addEventListener('change',()=>{ E[defKey]=list[+r.dataset[a+'df']].k; re(); refresh(); }));
}
function rJoin(){
 if(!hasDev(E)){ $('#sb-join').innerHTML=''; return; }
 $('#sb-join').innerHTML=oList('j',E.join,'joinDef',{desc:true,label:'가입 유형'});
 bindOList('#sb-join','j',E.join,'joinDef',rJoin);
}
function rInst(){
 if(!hasDev(E)){ $('#sb-inst').innerHTML=''; return; }
 $('#sb-inst').innerHTML=oList('n',E.inst,'instDef',{label:'할부 개월'});
 bindOList('#sb-inst','n',E.inst,'instDef',rInst);
}

// ---------- 7-3. 사은품 · 혜택 / 티다팩 (v4-8) ----------
// 사은품은 사은품·혜택 관리, 티다팩은 쿠폰 관리 시스템에서 만든다. 연결 상품과 조건이 맞으면 자동으로 올라오고 여기서는 노출 여부와 순서만 정한다
const dot=d=>d.replace(/-/g,'.');
function condText(g){ if(g.own) return '<span class="gtag own">전시 전용</span> 이 전시에만 적용'; const c=[]; if(g.cond.model) c.push(`${esc(g.cond.model)} 연결 시`); if(g.cond.pos) c.push(g.cond.pos.map(id=>esc(poBy(id).name)).join(', ')); if(g.cond.join) c.push(g.cond.join.join('·')+' 가입'); return c.join('<br>'); }
function stTag(st,lim){ return st.k==='out'?`<span class="gtag end">${lim?'한도 소진':'소진'} · 자동 미노출</span>`:st.k==='end'?`<span class="gtag end">${lim?'제휴 종료':'기간 종료'} · 자동 미노출</span>`:st.k==='wait'?`<span class="gtag wait">${st.t}</span>`:st.warn?`<span class="gtag st">${lim?st.warn.replace('남은 수량','발급 한도'):st.warn}</span>`:''; }
function badgeRow(k,label,on,pvB,help){ return `<div class="row" style="margin:14px 0 0"><label class="fl">${label}</label><span class="srch-radio" role="radiogroup" aria-label="${label}"><label><input type="radio" name="${k}" value="1" ${on?'checked':''}>자동으로 붙이기</label><label><input type="radio" name="${k}" value="0" ${on?'':'checked'}>붙이지 않기</label></span>${on&&pvB?`<span class="bd" style="${bstyle(pvB)};cursor:default">${pvB.t}</span>`:''}</div>${help?`<p class="pill" style="margin:4px 0 0 96px">${help}</p>`:''}`; }
function rGift(){
 const gQty=g=>g.total==null?'제한 없음':`${g.left.toLocaleString()} / ${g.total.toLocaleString()}개`;
 const rows=E.gifts.map((x,i)=>{ const g=GM(x.id), st=benefitState(g), jw=joinWarn(E,g), t=stTag(st);
  return `<tr class="gf-r ${st.auto?'dim':''}" data-gk="${x.id}"><td><div class="gnm">${gripBtn(i,esc(g.n))}<span class="gic" aria-hidden="true">${g.ic}</span><div><b>${esc(g.n)}${x.src==='own'?'<span class="gtag own">전시 전용</span>':'<span class="gtag auto">조건 매칭</span>'}</b><small>${esc(g.mode)} · ${esc(g.ship)}</small>${t?`<div>${t}</div>`:''}${jw?`<div class="gwarn">${jw}</div>`:''}</div></div></td><td>${condText(g)}</td><td>${dot(g.from)} ~<br>${dot(g.to)}</td><td><span class="qty">${gQty(g)}</span></td><td class="c"><button type="button" class="lnk" data-gx="${x.id}">연결 해제</button></td></tr>`; }).join('');
 $('#sb-gift').innerHTML=`<div class="sec-h"><b>적용 목록</b><button type="button" class="btn sm" id="gLink" style="margin-left:auto">사은품 연결</button></div>
 ${E.gifts.length?`<div class="cl gtbl"><table><thead><tr><th>사은품명 · 혜택</th><th>대상 조건</th><th>기간</th><th>남은 수량</th><th class="c">연결 해제</th></tr></thead><tbody>${rows}</tbody></table></div>`
 :'<div class="empty">연결 상품에 맞는 사은품이 없어요. 기획전 전용 사은품은 <b>사은품 연결</b>로 붙일 수 있어요</div>'}
 ${badgeRow('gBadge','사은품 증정 배지',E.giftBadge,null,'')}`;
 const after=()=>{ rGift(); rBasic(); refresh(); };
 dndList('#sb-gift','gk',E.gifts,after,null,'tr.gf-r');
 // 조건 매칭 사은품을 해제하면 giftCut에 남겨 연결 상품이 바뀌어도 다시 올라오지 않게 한다
 $$('#sb-gift [data-gx]').forEach(b=>b.addEventListener('click',()=>{ const [x]=E.gifts.splice(E.gifts.findIndex(y=>y.id===b.dataset.gx),1); if(x.src==='auto') (E.giftCut=E.giftCut||[]).push(x.id); after(); toast(`${GM(x.id).n} 연결을 해제했어요`); }));
 $$('#sb-gift input[name=gBadge]').forEach(r=>r.addEventListener('change',()=>{ E.giftBadge=r.value==='1'; after(); }));
 $('#gLink').addEventListener('click',()=>openBenefitModal('gift'));
}
let tdMore=false; // 티다팩 목록: 처음 3개만 보이고 나머지는 더보기
const tdQty=t=>t.total==null?'한도 없음':`잔여 ${t.left.toLocaleString()} / ${t.total.toLocaleString()}명`;
function rTd(){
 if(E.kind!=='po'){ $('#sb-td').innerHTML=''; return; }
 const more=E.tds.length>TD_TOP, shown=more&&!tdMore?E.tds.slice(0,TD_TOP):E.tds;
 const rows=shown.map((x,i)=>{ const t=TDM(x.id), st=benefitState(t), tg=stTag(st,true);
  return `<tr class="td-r ${st.auto?'dim':''}" data-tk="${x.id}"><td><div class="gnm" style="min-width:0">${gripBtn(i,esc(t.brand))}<span class="tlogo" style="background:${t.lc}" aria-hidden="true">${esc(t.logo)}</span></div></td><td><div class="gnm"><div><b>${esc(t.brand)}${x.src==='own'?'<span class="gtag own">전시 전용</span>':'<span class="gtag auto">조건 매칭</span>'}</b><small>${esc(t.benefit)}</small>${tg?`<div>${tg}</div>`:''}</div></div></td><td>${t.own?condText(t):`${t.cond.pos.filter(id=>E.conn.includes(id)).map(id=>esc(poBy(id).name)).join(', ')}<br><small class="faint">12개월 약정</small>`}</td><td>매월 1회 · 12회<br><small class="faint">${esc(t.issue)}</small></td><td>${esc(t.use)}<br><small class="faint">유효 ${esc(t.valid)}</small></td><td>${dot(t.from)} ~<br>${dot(t.to)}</td><td><span class="qty">${tdQty(t)}</span></td><td class="c"><button type="button" class="lnk" data-tx="${x.id}">연결 해제</button></td></tr>`; }).join('');
 $('#sb-td').innerHTML=`<div class="sec-h"><b>적용 목록</b><button type="button" class="btn sm" id="tLink" style="margin-left:auto">티다팩 연결</button></div>
 ${E.tds.length?`<div class="cl gtbl"><table><thead><tr><th>쿠폰 이미지</th><th>쿠폰명 · 쿠폰 혜택</th><th>대상 조건</th><th>발급</th><th>사용 조건</th><th>기간</th><th>발급 한도</th><th class="c">연결 해제</th></tr></thead><tbody>${rows}</tbody></table></div>${more?`<button type="button" class="btn sm" id="tMore" style="width:100%;margin:6px 0 0">${tdMore?'접기':`더보기 (${E.tds.length-TD_TOP}개)`}</button>`:''}`
 :'<div class="empty">연결 상품에 티다팩 대상 요금제가 없어요. 대상 요금제를 연결하면 자동으로 올라와요. 기획전 전용 쿠폰은 <b>티다팩 연결</b>로 붙일 수 있어요</div>'}
 ${badgeRow('tBadge','티다팩 배지',E.tdBadge,null,'')}`;
 const after=()=>{ rTd(); rBasic(); refresh(); };
 dndList('#sb-td','tk',E.tds,after,null,'tr.td-r');
 // 조건 매칭 쿠폰을 해제하면 tdCut에 남겨 연결 상품이 바뀌어도 다시 올라오지 않게 한다
 $$('#sb-td [data-tx]').forEach(b=>b.addEventListener('click',()=>{ const [x]=E.tds.splice(E.tds.findIndex(y=>y.id===b.dataset.tx),1); if(x.src==='auto') (E.tdCut=E.tdCut||[]).push(x.id); after(); toast(`${TDM(x.id).brand} 연결을 해제했어요`); }));
 $$('#sb-td input[name=tBadge]').forEach(r=>r.addEventListener('change',()=>{ E.tdBadge=r.value==='1'; after(); }));
 if($('#tMore')) $('#tMore').addEventListener('click',()=>{ tdMore=!tdMore; rTd(); });
 $('#tLink').addEventListener('click',()=>openBenefitModal('td'));
}
// 사은품·티다팩 직접 연결: 기준정보에서 골라 이 전시 전용으로 붙인다. 소진·종료된 항목과 이미 적용 중인 항목은 고를 수 없다
function openBenefitModal(kind){
 const G=kind==='gift', pool=G?GIFT:TDP, list=G?E.gifts:E.tds; let q='', pick=new Set();
 const draw=()=>{
  const L=pool.filter(x=>{ const n=G?x.n:x.brand; return !q||n.includes(q)||x.id.includes(q.toUpperCase()); });
  $('#mBody').innerHTML=`<input type="text" class="mq" id="bq" value="${esc(q)}" placeholder="${G?'사은품명 · 코드 검색':'제휴사 · 쿠폰 코드 검색'}" aria-label="검색" style="width:100%"><div class="cl" style="margin-top:10px;max-height:420px"><table><thead><tr><th class="c"></th><th>${G?'사은품':'쿠폰'}</th><th>구분</th><th>${G?'지급 방식':'대상'}</th><th>기간</th><th>${G?'남은 수량':'발급 한도'}</th></tr></thead><tbody>${L.map(x=>{ const has=list.some(y=>y.id===x.id), st=benefitState(x), dis=has||st.auto;
   return `<tr><td class="c"><input type="checkbox" data-bp="${x.id}" ${has||pick.has(x.id)?'checked':''} ${dis?'disabled':''} aria-label="${esc(G?x.n:x.brand)}"></td><td>${G?`${x.ic} ${esc(x.n)}`:`<b>${esc(x.brand)}</b> · ${esc(x.benefit)}`}<br><small class="faint">${x.id}</small>${has?' <span class="chip">적용 중</span>':''}</td><td>${x.own?'<span class="gtag own">전시 전용</span>':'<span class="gtag auto">조건 매칭</span>'}</td><td>${G?x.mode:x.own?'기획전':(x.cond.pos||[]).map(id=>esc(poBy(id).name)).join(', ')+' · 12개월'}</td><td>${dot(x.from).slice(5)} ~ ${dot(x.to).slice(2)}${st.auto?` <span class="gtag end">${st.t}</span>`:st.k==='wait'?' <span class="gtag wait">시작 전</span>':''}</td><td>${x.total==null?'없음':x.left.toLocaleString()+(G?'개':'명')}</td></tr>`; }).join('')}</tbody></table></div>
  <p class="pill" style="margin:8px 0 0">${G?'사은품·혜택 관리에서 만든 사은품만 고를 수 있어요. 조건 매칭 사은품은 대상 상품을 연결하면 자동으로 들어와요':'쿠폰 관리 시스템에 등록된 티다팩만 고를 수 있어요. 조건 매칭 쿠폰은 대상 요금제를 연결하면 자동으로 들어와요'}</p>`;
  $('#mFoot').innerHTML=foot(`선택 ${pick.size}개`,pick.size,`${pick.size}개 연결`);
  keepQ('#bq',v=>q=v,draw);
  $$('#mBody [data-bp]').forEach(c=>c.addEventListener('change',()=>{ c.checked?pick.add(c.dataset.bp):pick.delete(c.dataset.bp); draw(); }));
  // 행 아무 곳이나 눌러도 선택된다 (고를 수 없는 행은 제외)
  $$('#mBody [data-bp]:not(:disabled)').forEach(c=>{ const tr=c.closest('tr'); tr.style.cursor='pointer'; tr.addEventListener('click',e=>{ if(e.target===c) return; c.checked=!c.checked; c.dispatchEvent(new Event('change')); }); });
  $('#mc').addEventListener('click',closeModal);
  $('#mo').addEventListener('click',()=>{ pick.forEach(id=>{ list.push({id,src:'own',show:true}); const k=G?'giftCut':'tdCut'; E[k]=(E[k]||[]).filter(y=>y!==id); }); closeModal(); G?rGift():rTd(); rBasic(); refresh(); toast(`${G?'사은품':'티다팩'} ${pick.size}개를 연결했어요`); });
 };
 modal(G?'사은품 연결':'티다팩 연결',G?'이 전시에 붙일 사은품을 기준정보에서 고르세요':'이 전시에 붙일 쿠폰을 쿠폰 관리 시스템에서 고르세요',900); draw();
}

// ---------- 8. 주문 구성 방식 ----------
// 사용할 주문 구성안(전체 주문 흐름) 하나를 고르고, 아래에서 연결 상품별 주문 조건을 줄인다.
// 구성안 선택·비교는 다음 단계에서 프로토타입을 만든다. 만들기는 별도 페이지로 이동할 예정이라 안내만 한다.
// 연결 상품 조합에 따른 주문 시나리오 안내
function orderScenario(fl){
 const ks=fl.map(([k])=>k), has=k=>ks.includes(k);
 if(has('dev')&&has('mob')) return ['휴대폰 + 요금제 / 같은 회선 주문','상단 요금제를 초기값으로 사용하고 주문 단계에서 EPC 허용 범위 안으로 변경할 수 있습니다'];
 if(ks.length>1) return [fl.map(([,f])=>f.name).join(' + '),'고객이 고른 상품에 필요한 주문 단계만 차례로 진행합니다'];
 const one={dev:['휴대폰 단독 주문','가입 유형·할인 방법·단말 결제를 주문 단계에서 EPC 허용 범위 안으로 고를 수 있습니다'],mob:['요금제 / 부가서비스 주문','가입 유형과 유심 방식을 주문 단계에서 EPC 허용 범위 안으로 고를 수 있습니다'],sub:['구독 주문','결제 주기를 주문 단계에서 EPC 허용 범위 안으로 고를 수 있습니다'],acc:['배송 상품 주문','수령 방법을 주문 단계에서 EPC 허용 범위 안으로 고를 수 있습니다']};
 return one[ks[0]];
}
function rOrder(){
 const box=$('#sb-order');
 if(E.kind==='ps'){ box.innerHTML=ntc('','상품 개별 전시(PS)는 주문을 받지 않아요. 고객이 주문하려면 PS가 속한 PO 전시로 이동합니다.'); return; }
 const fl=activeFlows(E), plan=E.orderPlan;
 if(!fl.length){ box.innerHTML='<div class="empty">연결 상품을 추가하면 상품 유형에 맞는 주문 구성이 자동으로 정해져요</div>'; return; }
 const [st,sd]=orderScenario(fl);
 // 순서: 주문 시나리오 안내 → 필요한 주문 항목 → 사용할 주문 구성안 → (미선택 경고)
 box.innerHTML=`${guide(`<b>${st}</b>`,sd).replace('class="guide"','class="guide" style="margin:0 0 18px"')}
 <div class="op-need"><b>필요한 주문 항목</b>${fl.map(([,f])=>`<span class="op-tag">${f.name}</span>`).join('')}</div>
 <div class="op-plan">
  <div class="op-plan-tx"><p class="op-lb">사용할 주문 구성안</p><b>${plan?esc(plan.name):'구성안을 선택해 주세요'}</b>${plan?`<p class="op-meta">${plan.id} · ${plan.ver} · ${plan.cat||''}</p>`:''}</div>
  <div class="op-acts"><button type="button" class="btn" data-op="pick">구성안 선택</button><button type="button" class="btn" data-op="make">저장하고 구성안 만들기</button></div>
 </div>
 ${plan?'':'<div class="op-err" role="alert">사용할 주문 구성안 하나를 선택해 주세요</div>'}`;
 $$('#sb-order [data-op]').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.op==='pick'){ openPlanModal(); return; } orderHandoff(); window.open('/order3-create.html?from=display','_blank'); }));
}
// 구성안 만들기(order3-create)의 미리보기 위쪽에 이 전시의 상품 상세를 그대로 보이도록 지금 값을 넘긴다
const ORDER_PV_KEY='nova.order3.product';
function orderHandoff(){
 const P=connPOs(E), optVals=new Set(E.areas.flatMap(a=>a.opts.flatMap(o=>o.vals))), imgs=[E.main,...E.subs].filter(Boolean);
 const v={name:nameText(E.name),model:P[0]?P[0].id:'',sub:P[0]?P[0].name.split(' ').filter(t=>!optVals.has(t)).join(' '):'',img:imgs[0]&&imgs[0].u||'',imgs:imgs.length,
  badges:[...autoBadges(E),...E.badges].map(b=>({t:b.t,c:b.k?b.c:''})),review:!!E.review};
 // 이미지가 커서 저장소에 안 들어가면 이미지 없이 넘긴다
 try { localStorage.setItem(ORDER_PV_KEY,JSON.stringify(v)); } catch { try { localStorage.setItem(ORDER_PV_KEY,JSON.stringify({...v,img:''})); } catch {} }
}

// ---------- 모달 공통 ----------
let mBack=null;
// cls: 모달별 모양 (예: 'epc' = EPC 상품 조회)
function modal(title,sub,width,cls){ $('#mTitle').textContent=title; $('#mSub').textContent=sub||''; const mb=$('#md .mbox'); mb.className='mbox'+(cls?' '+cls:''); mb.style.width=`min(${width||820}px,100%)`; mBack=document.activeElement; $('#md').hidden=false; $('#md .mbox').focus(); }
function closeModal(){ $('#md').hidden=true; if(mBack&&mBack.focus) mBack.focus(); }
$('#mClose').addEventListener('click',closeModal);
$('#md').addEventListener('click',e=>{ if(e.target.id==='md') closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(!$('#md').hidden) closeModal(); else if(!$('#dockSheet').hidden) setDock(false); });
const filTabs=(list,curF)=>`<div class="tabs mfil" role="group" aria-label="상품 구분">${list.map(t=>`<button type="button" class="${curF===t?'on':''}" data-f="${t}">${t}</button>`).join('')}</div>`;
const foot=(txt,n,label)=>`<span class="pill" style="margin-right:auto">${txt}</span><button type="button" class="btn" id="mc">취소</button><button type="button" class="btn primary" id="mo" ${n?'':'disabled'}>${label}</button>`;
// 검색어 입력 중 다시 그려도 커서 위치를 지킨다
function keepQ(id,set,draw){ $(id).addEventListener('input',e=>{ set(e.target.value.trim()); const p=e.target.selectionStart; draw(); const n=$(id); n.focus(); n.setSelectionRange(p,p); }); }

// EPC 상품 조회(연결 상품 추가): 위 조회 조건 → 검색결과 표 → 취소/추가하기
// 상품 구분·상품유형은 EPC 상품 유형에서 나눈다 (샘플 데이터 기준)
const EPC_GRP={기기서비스:['기기서비스','휴대폰'],태블릿:['기기서비스','태블릿'],웨어러블:['기기서비스','웨어러블'],액세서리:['기기서비스','액세서리'],요금제:['이동전화','요금제'],부가서비스:['이동전화','부가서비스'],구독서비스:['플랫폼(T우주)','구독'],보험:['기기서비스','보험']};
const grpOf=p=>EPC_GRP[p.cat||p.type]||[p.type,p.type];
const GRPS=[...new Set(Object.values(EPC_GRP).map(x=>x[0]))];
const kindsOf=g=>[...new Set(Object.values(EPC_GRP).filter(x=>g==='전체'||x[0]===g).map(x=>x[1]))];
// f: 입력 중인 조건, a: 조회 버튼으로 적용한 조건
let CM={sel:new Set(),f:{g:'전체',k:'전체',q:''},a:{g:'전체',k:'전체',q:''}};
function openConnModal(){ const z={g:'전체',k:'전체',q:''}; CM={sel:new Set(),f:{...z},a:{...z}}; modal('EPC 상품 조회','',1200,'epc'); drawConn(); $('#cq').focus(); }
function drawConn(){
 const f=CM.f, opt=(list,v)=>['전체',...list].map(x=>`<option ${x===v?'selected':''}>${x}</option>`).join('');
 $('#mBody').innerHTML=`<form class="epc-search" id="cmForm">
  <div class="fields">
   <label class="l" for="cmG">상품 조회</label><select id="cmG">${opt(GRPS,f.g)}</select><input type="text" id="cq" value="${esc(f.q)}" placeholder="상품명 또는 모델코드 입력" aria-label="상품명 또는 모델코드">
   <span class="l">상품 구분</span><div id="cmK">${filTabs(['전체',...kindsOf(f.g)],f.k)}</div>
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="cmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색결과</b><span id="cmCnt"></span></div>
 <div class="epc-tbl"><table><thead><tr><th class="c"><input type="checkbox" id="cmAll" aria-label="검색결과 전체 선택"></th><th>EPC 상품ID</th><th>버전</th><th>EPC 상품명</th><th>상품 코드</th><th>상품 구분</th><th>상품유형</th><th>전시 상품수</th><th>판매상태</th></tr></thead><tbody id="cmRows"></tbody></table></div>`;
 // 상품 구분 버튼: 누르는 즉시 검색결과를 거른다 (지금 입력된 상품 조회·검색어 조건과 함께)
 const drawK=()=>{ $('#cmK').innerHTML=filTabs(['전체',...kindsOf(f.g)],f.k); };
 $('#cmG').addEventListener('change',e=>{ f.g=e.target.value; f.k='전체'; drawK(); });
 $('#cmK').addEventListener('click',e=>{ const b=e.target.closest('[data-f]'); if(!b) return; f.k=b.dataset.f; drawK(); CM.a={...f,q:f.q.trim()}; drawConnRows(); });
 $('#cq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#cmForm').addEventListener('submit',e=>{ e.preventDefault(); CM.a={...f,q:f.q.trim()}; drawConnRows(); });
 $('#cmReset').addEventListener('click',()=>{ CM.f={g:'전체',k:'전체',q:''}; CM.a={...CM.f}; drawConn(); $('#cq').focus(); });
 $('#mFoot').innerHTML=`<button type="button" class="btn dark-out" id="mc">취소</button><button type="button" class="btn primary" id="mo" disabled>추가하기</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const add=[...CM.sel]; E.conn.push(...add); closeModal(); const n=onConnChange(); toast(`${add.length}개 상품을 연결했어요${n?` · 상품 템플릿 ${n}개를 추가 정보에 넣었어요`:''}`); });
 drawConnRows();
}
// 표만 다시 그린다. 체크는 행 상태만 바꿔 스크롤 위치를 지킨다
function drawConnRows(){
 const a=CM.a, q=a.q.toLowerCase();
 const L=PO.filter(p=>{ const [g,k]=grpOf(p); return (a.g==='전체'||g===a.g)&&(a.k==='전체'||k===a.k)&&(!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)||p.epc.includes(q)); });
 $('#cmCnt').textContent=`${L.length}건`;
 $('#cmRows').innerHTML=L.map(p=>{ const done=E.conn.includes(p.id), on=CM.sel.has(p.id), [g,k]=grpOf(p);
  return `<tr class="${done?'done':''} ${on?'on':''}" data-row="${p.id}"><td class="c"><input type="checkbox" data-p="${p.id}" ${on||done?'checked':''} ${done?'disabled':''} aria-label="${esc(p.name)} 선택"></td><td>${p.epc}</td><td>${p.ver}</td><td class="nm">${esc(p.name)}${done?' <span class="chip">연결됨</span>':''}</td><td>${p.id}</td><td>${g}</td><td>${k}</td><td>${usedIn(p.id)}개</td><td><span class="sale-chip">${p.sale}</span></td></tr>`; }).join('')
  ||'<tr class="empty-row"><td colspan="9">검색 결과가 없어요</td></tr>';
 // 전체 선택: 지금 검색결과 중 이미 연결된 상품을 뺀 나머지를 한 번에 고르거나 푼다
 const pick=L.filter(p=>!E.conn.includes(p.id)).map(p=>p.id), all=$('#cmAll');
 const sync=()=>{ const n=CM.sel.size, b=$('#mo'); b.disabled=!n; b.textContent=n?`추가하기 (${n})`:'추가하기';
  const k=pick.filter(id=>CM.sel.has(id)).length; all.disabled=!pick.length; all.checked=!!pick.length&&k===pick.length; all.indeterminate=k>0&&k<pick.length; };
 all.onchange=()=>{ const on=all.checked; pick.forEach(id=>{ on?CM.sel.add(id):CM.sel.delete(id); const tr=$(`#cmRows [data-row="${id}"]`); tr.classList.toggle('on',on); tr.querySelector('input').checked=on; }); sync(); };
 const toggle=(id,on)=>{ on?CM.sel.add(id):CM.sel.delete(id); const tr=$(`#cmRows [data-row="${id}"]`); tr.classList.toggle('on',on); tr.querySelector('input').checked=on; sync(); };
 $$('#cmRows [data-p]').forEach(c=>c.addEventListener('change',()=>toggle(c.dataset.p,c.checked)));
 $$('#cmRows tr[data-row]:not(.done)').forEach(tr=>tr.addEventListener('click',e=>{ if(e.target.closest('input')) return; const id=tr.dataset.row; toggle(id,!CM.sel.has(id)); }));
 sync();
}
// 주문 구성안(템플릿) 선택: 검색 조건 → 검색 결과(라디오 1개 선택, 10개씩 페이지) → 닫기/적용
// 주문 구성 관리에 등록된 템플릿으로 가정한 샘플
const ORD_TPL=['기기서비스 / 기본','요금제 / 기본','부가서비스 / 단계형','악세사리 + 요금제 / 통합형','커머스 기본 템플릿','구독 기본 템플릿','iPhone pro 18 템플릿','iPhone pro max 18 템플릿','갤럭시 Z 폴드8 템플릿','갤럭시 Z 폴드7 템플릿','갤럭시 S26 울트라 템플릿','휴대폰 + 요금제 / 같은 회선','휴대폰 + 요금제 + 구독 / 통합형','요금제 / 번호이동 전용','요금제 / 기기변경 전용','유심 / eSIM 단독','T우주 구독 / 월간','T우주 구독 / 연간','액세서리 / 택배','액세서리 / 매장 픽업','로밍 / 기본','태블릿 + 데이터 요금제','워치 + 데이터 쉐어링']
 .map((name,i)=>{ const h=seedNum(name), spec=/iPhone|갤럭시/.test(name);
  return {id:'CTN-ORD-'+String(i+1).padStart(3,'0'),ver:`v${1+h%2}.${h%4}`,name,cat:spec?'특정 전시 상품 템플릿':'상품 유형 템플릿',set:`화면 ${3+h%4} / 코너 ${4+h%5} / 연동 ${1+h%3}`,lim:i===0?'등록된 조건별 제한 없음':['등록된 조건별 제한 없음','만 19세 이상','1인 1회선','번호이동 가입만','선택약정 불가','온라인 전용'][h%6]}; });
const ORD_CATS=[...new Set(ORD_TPL.map(t=>t.cat))], PM_PER=10;
let PM={};
function openPlanModal(){ const z={by:'name',cat:'전체',q:''}; PM={sel:E.orderPlan&&E.orderPlan.id,f:{...z},a:{...z},page:1}; modal('주문 구성안(템플릿) 선택','',1200,'epc'); drawPlan(); $('#pq').focus(); }
function drawPlan(){
 const f=PM.f;
 $('#mBody').innerHTML=`<form class="epc-search" id="pmForm">
  <div class="fields">
   <label class="l" for="pmBy">검색</label><select id="pmBy"><option value="name" ${f.by==='name'?'selected':''}>주문 템플릿명</option><option value="id" ${f.by==='id'?'selected':''}>주문 템플릿ID</option></select><input type="text" id="pq" value="${esc(f.q)}" placeholder="템플릿명 또는 주문 템플릿ID 입력" aria-label="검색어">
   <label class="l" for="pmCat">카테고리</label><select id="pmCat">${['전체',...ORD_CATS].map(c=>`<option ${c===f.cat?'selected':''}>${c}</option>`).join('')}</select>
  </div>
  <div class="acts"><button type="button" class="btn dark-out" id="pmReset">초기화</button><button type="submit" class="btn primary">조회</button></div>
 </form>
 <div class="epc-head"><b>검색 결과</b><span id="pmCnt"></span></div>
 <div class="epc-tbl pm-tbl"><table><thead><tr><th class="c">선택</th><th>주문 템플릿 ID</th><th>버전</th><th>주문 템플릿명</th><th>카테고리</th><th>주문 설정</th><th>주문 조건 제한</th></tr></thead><tbody id="pmRows"></tbody></table></div>
 <nav class="pager" id="pmPager" aria-label="페이지"></nav>`;
 $('#pmBy').addEventListener('change',e=>{ f.by=e.target.value; });
 $('#pmCat').addEventListener('change',e=>{ f.cat=e.target.value; });
 $('#pq').addEventListener('input',e=>{ f.q=e.target.value; });
 $('#pmForm').addEventListener('submit',e=>{ e.preventDefault(); PM.a={...f,q:f.q.trim()}; PM.page=1; drawPlanRows(); });
 $('#pmReset').addEventListener('click',()=>{ PM.f={by:'name',cat:'전체',q:''}; PM.a={...PM.f}; PM.page=1; drawPlan(); $('#pq').focus(); });
 $('#mFoot').innerHTML=`<button type="button" class="btn dark-out" id="mc">닫기</button><button type="button" class="btn primary" id="mo">적용</button>`;
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ const t=ORD_TPL.find(x=>x.id===PM.sel); if(!t) return; E.orderPlan={id:t.id,ver:t.ver,name:t.name,cat:t.cat}; closeModal(); rOrder(); refresh(); toast(`'${t.name}' 구성안을 적용했어요`); });
 drawPlanRows();
}
function drawPlanRows(){
 const a=PM.a, q=a.q.toLowerCase();
 const L=ORD_TPL.filter(t=>(a.cat==='전체'||t.cat===a.cat)&&(!q||(a.by==='id'?t.id:t.name).toLowerCase().includes(q)));
 const pages=Math.max(1,Math.ceil(L.length/PM_PER)); PM.page=Math.min(PM.page,pages);
 const rows=L.slice((PM.page-1)*PM_PER,PM.page*PM_PER);
 $('#pmCnt').textContent=`${L.length}건`;
 $('#pmRows').innerHTML=rows.map(t=>`<tr class="${PM.sel===t.id?'on':''}" data-row="${t.id}"><td class="c"><input type="radio" name="pmSel" value="${t.id}" ${PM.sel===t.id?'checked':''} aria-label="${esc(t.name)} 선택"></td><td>${t.id}</td><td>${t.ver}</td><td class="nm">${esc(t.name)}</td><td>${t.cat}</td><td>${t.set}</td><td>${t.lim}</td></tr>`).join('')
  ||'<tr class="empty-row"><td colspan="7">검색 결과가 없어요</td></tr>';
 // 페이지 번호: 처음·이전 / 앞뒤 4쪽 / 다음·마지막
 const p=PM.page, from=Math.max(1,Math.min(p-4,pages-8)), to=Math.min(pages,from+8), nums=[];
 for(let i=from;i<=to;i++) nums.push(i);
 const ic=d=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
 $('#pmPager').innerHTML=`<button type="button" data-pg="1" ${p===1?'disabled':''} aria-label="처음">${ic('M17 18l-6-6 6-6M7 6v12')}</button><button type="button" data-pg="${p-1}" ${p===1?'disabled':''} aria-label="이전">${ic('m15 18-6-6 6-6')}</button>${from>1?'<i>…</i>':''}${nums.map(i=>`<button type="button" data-pg="${i}" class="${i===p?'on':''}" ${i===p?'aria-current="page"':''}>${i}</button>`).join('')}${to<pages?`<i>…</i><button type="button" data-pg="${pages}">${pages}</button>`:''}<button type="button" data-pg="${p+1}" ${p===pages?'disabled':''} aria-label="다음">${ic('m9 18 6-6-6-6')}</button><button type="button" data-pg="${pages}" ${p===pages?'disabled':''} aria-label="마지막">${ic('M7 18l6-6-6-6M17 6v12')}</button>`;
 $$('#pmPager [data-pg]').forEach(b=>b.addEventListener('click',()=>{ PM.page=+b.dataset.pg; drawPlanRows(); $('#pmRows').closest('.epc-tbl').scrollTop=0; }));
 const pick=id=>{ PM.sel=id; $$('#pmRows tr[data-row]').forEach(tr=>{ const on=tr.dataset.row===id; tr.classList.toggle('on',on); tr.querySelector('input').checked=on; }); $('#mo').disabled=false; };
 $$('#pmRows tr[data-row]').forEach(tr=>tr.addEventListener('click',()=>pick(tr.dataset.row)));
 $('#mo').disabled=!PM.sel;
}
// PS 개별 전시용 조회
function openPsModal(){ CM={sel:new Set(),f:'전체',q:''}; modal('PS 조회','PO 안의 서비스(PS)를 골라 소개용으로 전시합니다'); drawPs(); $('#cq').focus(); }
function drawPs(){
 const L=PSLIST.filter(s=>(CM.f==='전체'||s.po.type===CM.f)&&(!CM.q||s.name.includes(CM.q)||s.po.name.includes(CM.q))).slice(0,80);
 $('#mBody').innerHTML=`<input type="text" class="mq" id="cq" value="${esc(CM.q)}" placeholder="PS명 · 소속 PO 검색" aria-label="PS 검색">${filTabs(['전체',...TYPES],CM.f)}
 ${L.map(s=>{ const done=E.conn.includes(s.key); return `<label class="mi ${CM.sel.has(s.key)?'on':''} ${done?'dis':''}"><input type="checkbox" data-p="${s.key}" ${CM.sel.has(s.key)||done?'checked':''} ${done?'disabled':''}><div style="flex:1;min-width:0"><div class="mt"><b>${esc(s.name)}</b><span class="chip">${s.kind}</span></div><div class="poc-meta">${esc(s.po.name)} · ${esc(s.desc||'')}</div></div></label>`; }).join('')||'<div class="empty">검색 결과가 없어요</div>'}`;
 keepQ('#cq',v=>CM.q=v,drawPs);
 $$('#mBody [data-f]').forEach(b=>b.addEventListener('click',()=>{ CM.f=b.dataset.f; drawPs(); }));
 $$('#mBody [data-p]').forEach(c=>c.addEventListener('change',()=>{ c.checked?CM.sel.add(c.dataset.p):CM.sel.delete(c.dataset.p); drawPs(); }));
 const n=CM.sel.size;
 $('#mFoot').innerHTML=foot(n?`${n}개 선택`:'PS를 고르세요',n,n?n+'개 연결':'연결');
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ E.conn.push(...CM.sel); closeModal(); const t=onConnChange(); if(t) toast(`상품 템플릿 ${t}개를 추가 정보에 넣었어요`); });
}
// PO 상세 보기
function openPoDetail(id){ const p=poBy(id); modal(p.name,`${p.epc} · ${p.id} · ${p.ver} · ${p.type}`,640); $('#mBody').innerHTML=`<p class="pill" style="margin:0 0 10px">${esc(p.desc)}</p>${poCard(p,false)}<p class="pill" style="margin:0">대표 이미지: ${p.img.join(', ')}</p>`; $('#mFoot').innerHTML=`<span class="pill" style="margin-right:auto">EPC 읽기 전용</span><button type="button" class="btn" id="mc">닫기</button>`; $('#mc').addEventListener('click',closeModal); }
// EPC 정보 불러오기 (항목별 선택)
let EL={};
function openEpcLoad(){ EL={name:-1,imgs:new Set()}; modal('EPC 정보 불러오기','항목마다 쓸 값을 고르세요. 고르지 않은 항목은 지금 값을 유지해요',720); drawEpcLoad(); }
function drawEpcLoad(){
 const P=connPOs(E), has=f=>[E.main,...E.subs].some(m=>m&&m.n===f);
 const radio=(key,label,curv,val)=>`<div class="mrow"><div class="fl">${label}${EL[key]>=0?' <span class="chip acc">변경</span>':''}</div><div><label class="op ${EL[key]<0?'on':''}"><input type="radio" name="el${key}" data-el="${key}" value="-1" ${EL[key]<0?'checked':''}><span style="flex:1;color:${curv?'inherit':'var(--muted)'}">${esc(curv)||'미입력'}</span><span class="chip">현재 값 유지</span></label>${P.map((p,i)=>`<label class="op ${EL[key]===i?'on':''}"><input type="radio" name="el${key}" data-el="${key}" value="${i}" ${EL[key]===i?'checked':''}><span style="flex:1">${esc(val(p))}</span><span class="pill">${esc(p.name)}</span></label>`).join('')}</div></div>`;
 $('#mBody').innerHTML=`<div class="mfill"><span class="pill">한 번에 채우기</span><select id="elAll"><option value="">상품 선택</option>${P.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select><span class="pill">전시명·이미지를 그 상품 값으로</span></div>
 ${radio('name','전시명',E.name,p=>p.name)}
 <div class="mrow"><div class="fl">이미지${EL.imgs.size?` <span class="chip acc">+${EL.imgs.size}</span>`:''}</div><div><p class="pill" style="margin:0 0 6px">현재 대표 ${E.main?1:0}장 · 추가 ${E.subs.length}장 · 대표이미지가 비어 있으면 첫 장을 대표로, 나머지는 추가이미지로 넣어요</p>${P.flatMap(p=>p.img.map(f=>{ const h=has(f); return `<label class="op ${EL.imgs.has(f)?'on':''}" ${h?'style="opacity:.5"':''}><input type="checkbox" data-img="${esc(f)}" ${EL.imgs.has(f)||h?'checked':''} ${h?'disabled':''}><span style="flex:1">${esc(f)}${h?' · 이미 등록됨':''}</span><span class="pill">${esc(p.name)}</span></label>`; })).join('')}</div></div>`;
 $('#elAll').addEventListener('change',e=>{ const i=e.target.value; if(i==='') return; EL.name=+i; P[+i].img.forEach(f=>{ if(!has(f)) EL.imgs.add(f); }); drawEpcLoad(); });
 $$('#mBody [data-el]').forEach(r=>r.addEventListener('change',()=>{ EL[r.dataset.el]=+r.value; drawEpcLoad(); }));
 $$('#mBody [data-img]').forEach(c=>c.addEventListener('change',()=>{ c.checked?EL.imgs.add(c.dataset.img):EL.imgs.delete(c.dataset.img); drawEpcLoad(); }));
 const n=(EL.name>=0)+(EL.imgs.size?1:0);
 $('#mFoot').innerHTML=foot(n?`<b style="color:var(--accent)">${n}개 항목</b> 바뀜${EL.imgs.size?` · 이미지 ${EL.imgs.size}장 추가`:''}`:'바뀌는 항목 없음',n,n?n+'개 항목 적용':'적용');
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ if(EL.name>=0) E.name=P[EL.name].name; const add=[...EL.imgs].map(img); if(!E.main&&add.length) E.main=add.shift(); E.subs.push(...add.slice(0,Math.max(0,SUB_MAX-E.subs.length))); closeModal(); rBasic(); refresh(); toast(`${n}개 항목을 적용했어요`); });
}
// 템플릿 불러오기
let TM={};
function openTplModal(){ TM={sel:new Set(),focus:TPL[0].id,f:new Set(),mode:'link'}; modal('템플릿 불러오기','추가 정보에 넣을 템플릿을 고르세요. 여러 개를 한 번에 고를 수 있어요',880); drawTpl(); }
function drawTpl(){
 // 구분 체크박스: 아무것도 안 고르면 '전체'. 여러 개를 함께 고를 수 있다
 const types=[...new Set(TPL.map(t=>t.t))], used=new Set(E.extras.map(x=>x.src).filter(Boolean));
 const L=TPL.filter(t=>!TM.f.size||TM.f.has(t.t));
 const chk=(k,l,on)=>`<label class="chkl"><input type="checkbox" data-f="${k}" ${on?'checked':''}>${l}</label>`;
 const f=tplBy(TM.focus)||TPL[0];
 $('#mBody').innerHTML=`<div class="tplg"><div><div class="mfil tchk" role="group" aria-label="템플릿 구분">${chk('','전체',!TM.f.size)}${types.map(t=>chk(t,t,TM.f.has(t))).join('')}</div>
 ${L.map(t=>{ const dis=used.has(t.id); return `<div class="mi ${TM.sel.has(t.id)?'on':''} ${dis?'dis':''}" data-t="${t.id}"><input type="checkbox" ${TM.sel.has(t.id)||dis?'checked':''} ${dis?'disabled':''} aria-label="${esc(t.n)}"><div style="flex:1;min-width:0"><div class="mt"><b>${esc(t.n)}</b><span class="chip">${t.t}</span></div><div class="poc-meta">${t.id} · ${t.v}${dis?' · 이미 추가됨':''}</div></div></div>`; }).join('')||'<div class="empty">해당하는 템플릿이 없어요</div>'}</div>
 <div class="tplp"><span class="pill">미리보기</span><div class="row" style="margin:4px 0 2px"><b style="font-size:15px">${esc(f.t)}</b><span class="chip">${f.id} · ${f.v}</span></div><p class="pill" style="margin:0 0 8px">전시 ${f.use}곳에서 사용 중</p><div class="bx" style="background:var(--bg)">${esc(f.body)}</div></div></div>`;
 $$('#mBody [data-f]').forEach(c=>c.addEventListener('change',()=>{ const k=c.dataset.f;
  if(!k) TM.f.clear(); else { c.checked?TM.f.add(k):TM.f.delete(k); if(TM.f.size===types.length) TM.f.clear(); }
  drawTpl(); }));
 $$('#mBody [data-t]').forEach(el=>el.addEventListener('click',e=>{ e.preventDefault(); const id=el.dataset.t; TM.focus=id; if(!used.has(id)) TM.sel.has(id)?TM.sel.delete(id):TM.sel.add(id); drawTpl(); }));
 const n=TM.sel.size;
 $('#mFoot').innerHTML=foot(n?`선택 ${n}개 · ${TM.mode==='link'?'연결':'복사'}해서 목록 끝에 붙어요`:'템플릿을 1개 이상 고르세요',n,n?n+'개 추가':'추가');
 $('#mc').addEventListener('click',closeModal);
 $('#mo').addEventListener('click',()=>{ TM.sel.forEach(id=>{ const t=tplBy(id); const x={id:nid(),t:t.t,mode:TM.mode,src:id,show:true,txt:TM.mode==='copy'?t.body:''}; E.extras.push(x); curX=x.id; }); closeModal(); rExtra(); refresh(); toast(`템플릿 ${n}개를 추가했어요`); });
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
 if(a.cond==='only') return sel.some(id=>a.trig.includes(id))?a.pos:null;
 const c=new Set(sel.flatMap(v=>a.rel[v]||[])), l=a.pos.filter(id=>c.has(id)); return l.length?l:null; }
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
  if(o.disp==='chip') h+=`<div class="ph-h">원하는 ${esc(eul(o.name))} 골라 주세요</div><div class="ph-sw">${o.vals.map(v=>`<button type="button" title="${esc(v)}" aria-label="${esc(v)}" aria-pressed="${v===v0}" data-ov="${a.id}|${esc(o.name)}|${esc(v)}" class="${v===v0?'on':''}"><span style="background:${COLOR[v]||'#bbb'}"></span></button>`).join('')}</div>`;
  else if(o.disp==='img') h+=`<div class="ph-h">원하는 ${esc(eul(o.name))} 골라 주세요</div><div class="ph-imgs">${o.vals.map(v=>`<button type="button" aria-pressed="${v===v0}" data-ov="${a.id}|${esc(o.name)}|${esc(v)}" class="${v===v0?'on':''}"><span class="ph-imgt">${svg(IC.image)}</span><small>${esc(v)}</small></button>`).join('')}</div>`;
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
 const pill=once||mon?`<div class="ph-float"><div class="ph-pill-wrap">${PVPILL?`<div class="ph-pop" role="dialog" aria-label="예상 금액">${once?`<div><span>기기</span><b>${won(once)}</b></div>`:''}${mon?`<div><span>월 요금</span><b>${won(mon)}</b></div>`:''}</div>`:''}<button type="button" class="ph-pill" data-pill aria-expanded="${PVPILL}">${once?`기기 <b>${once.toLocaleString()}</b> 원`:`월 <b>${mon.toLocaleString()}</b> 원`}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button></div></div>`:'';
 return `${pill}<div class="ph-buy"><p class="ph-insight">${insight}</p><div class="ph-buy-row"><button type="button" class="ph-tbtn" data-tbtn aria-label="T 상담">${svg('<path d="M5 6h11M10.5 6v13"/><path d="M17 15v6M14 18h6"/>')}</button><button type="button" class="ph-cta" data-cta ${left?'disabled':''}>${left?`선택이 ${left}개 남았어요`:'상품 주문하기'}</button></div></div>`;
}
// 상품 정보·구매 후기 탭에도 금액 알약·고객 선택 안내·상품 주문하기를 둔다 (상품 주문 탭과 같은 조건: PO 전시 + 구성 영역 있음)
const tabBuyPv=()=>E.kind!=='ps'&&E.areas.length?buyPv():'';
// data-pa: 입력 섹션과 미리보기 위치를 잇는 앵커 (pvFocus 참고)
function orderPv(){
 if(E.kind==='ps'){
  if(!E.conn.length) return '<div class="ph-sec"><div class="pvempty">PS를 연결하면 여기에 보인다</div></div>';
  return `<div class="ph-sec"><div class="ph-h">이 상품에 포함된 혜택<small>소개용 전시 · 금액과 주문 버튼이 없어요</small></div><div class="pcs">${E.conn.map(k=>{ const s=psBy(k); return `<div class="pc fix"><span class="bdg">${s.kind}</span><div class="pt">${esc(s.name)}</div><div class="ps">${esc(s.po.name)}에 포함된 서비스</div><div class="pd" style="margin-top:6px">${esc(s.desc||'')}</div></div>`; }).join('')}</div><button type="button" class="ph-cta" data-cta>${esc(psBy(E.conn[0]).po.name)} 가입하러 가기 ›</button></div><div class="ph-gap"></div>${giftPv()}${simPv()}`;
 }
 if(!E.areas.length) return '<div class="ph-sec"><div class="pvempty">구성 영역을 만들면 여기에 보인다</div></div>';
 // 제공 조건으로 건너뛰는 영역은 그리지 않는다
 let pv=comboPv()+E.areas.map((a,i)=>{ const v=pvArea(a); return v?`<div class="ph-sec" data-pa="area-${a.id}">${areaPv(v,i)}</div>`:''; }).filter(Boolean).join('<div class="ph-gap"></div>');
 pv+=[joinPv(),instPv(),giftPv(),tdPv()].filter(Boolean).map(x=>'<div class="ph-gap"></div>'+x).join('');
 // 주문 구성이 정해지면 미리보기 맨 아래에 주문서 영역 자리를 보여 준다
 const fl=activeFlows(E);
 if(fl.length) pv+=`<div class="ph-gap"></div><div class="ph-sec" data-pa="flow"><div class="ph-h">주문서</div><div class="ph-order"><b>주문서 영역</b><span>${fl.map(([,f])=>esc(f.name)).join(' + ')}</span></div></div>`;
 return pv+simPv()+buyPv();
}
// v4-8 반영: 주문 단계 선택지(가입 유형·할부), 사은품, 티다팩, 유사한 상품, 구매 후기 미리보기
function joinPv(){ if(!hasDev(E)) return ''; const on=E.join.filter(x=>x.on);
 return `<div class="ph-sec" data-pa="join"><div class="ph-h">어떻게 가입할까요?</div><div class="ph-ops">${on.map(x=>`<div class="ph-op ${x.k===E.joinDef?'on':''}"><b>${x.k}</b><small>${esc(x.d)}</small></div>`).join('')}</div></div>`; }
function instPv(){ if(!hasDev(E)) return ''; const on=E.inst.filter(x=>x.on);
 return `<div class="ph-sec" data-pa="inst"><div class="ph-h">단말기는 몇 달 동안 납부할까요?</div><div class="ph-chips">${on.map(x=>`<span class="${x.k===E.instDef?'on':''}">${x.k}</span>`).join('')}</div></div>`; }
function giftPv(){ const v=visibleGifts(E);
 return `<div class="ph-sec" data-pa="gift"><div class="ph-h">함께 드리는 사은품<small>개통 조건을 꼭 확인하세요</small></div>${v.length?v.map(x=>{ const g=GM(x.id); return `<div class="ph-gift"><span aria-hidden="true">${g.ic}</span><div><b>${esc(g.n)}</b><small>${g.mode} · ${esc(g.ship)}</small></div></div>`; }).join(''):'<div class="pvempty sm">노출 중인 사은품이 있으면 여기에 보인다</div>'}</div>`; }
function tdPv(){ if(E.kind!=='po') return ''; const v=visibleTd(E), first=v.slice(0,TD_TOP);
 return `<div class="ph-sec" data-pa="td"><div class="ph-h">티다팩 혜택을 골라 주세요<small>12개월 약정 시 1년간 매월 받아요</small></div>${v.length?`${first.map(x=>{ const t=TDM(x.id); return `<div class="ph-td"><span class="tlogo" style="background:${t.lc}" aria-hidden="true">${esc(t.logo)}</span><div>${t.tag?`<em>${t.tag}</em>`:''}<b>${esc(t.brand)}</b><small>${esc(t.benefit)}</small></div></div>`; }).join('')}${v.length>TD_TOP?`<div class="ph-more">전체보기 · ${v.length}개 ›</div>`:''}<div class="ph-td none">티다팩 없이 주문 진행</div>`:'<div class="pvempty sm">노출 중인 티다팩이 있으면 여기에 보인다</div>'}</div>`; }
function simPv(){ if(!E.sim.on) return ''; const t=simText(E);
 return `<div class="ph-gap"></div><div class="ph-sec" data-pa="sim"><div class="ph-h">${esc(t.t)||'타이틀을 입력하세요'}<small>${esc(t.s)||'소타이틀을 입력하세요'}</small></div><div class="ph-sim"><div><i></i><b>비슷한 상품</b></div><div><i></i><b>비슷한 상품</b></div></div></div>`; }
const reviewPv=()=>`<div class="ph-sec" data-pa="review"><div class="ph-rv"><b>★ 4.8</b><span>구매 후기 1,204개 · 리뷰 시스템 기준</span></div>${['배송이 빨라요. 색상이 사진과 같아요','개통까지 안내가 친절했어요'].map(x=>`<div class="ph-rvi"><span>★★★★★</span><p>${x}</p></div>`).join('')}</div>`;
// 상품 정보 탭: 펼친 추가 정보는 다시 그려도 펼친 채로 둔다
const PVX=new Set();
function infoPv(){
 const xs=E.extras.filter(x=>x.show&&(x.mode==='link'||x.txt.trim()));
 const dOn=descFilled(E), nOn=!!htmlText(E.descNote)||htmlHasImg(E.descNote);
 if(!dOn&&!nOn&&!xs.length) return '<div class="ph-sec"><div class="pvempty">상세 설명이나 추가 정보를 입력하면 여기에 보인다</div></div>';
 return `${dOn?(E.descMode==='image'?`<div class="pv-detail" data-pa="desc">${E.descImgs.map((x,i)=>x.u?`<img src="${x.u}" alt="상세 이미지 ${i+1}">`:`<div class="ph-noimg pv-ph">${phIc('device')}<small>${esc(x.n)}</small></div>`).join('')}</div>`:`<div class="ph-sec" data-pa="desc"><div class="ph-rich">${sanitize(E.descHtml)}</div></div>`):''}${nOn?`${dOn?'<div class="ph-gap"></div>':''}<div class="ph-sec" data-pa="note"><div class="ph-rich ph-note-rich">${sanitize(E.descNote)}</div></div>`:''}${xs.map(x=>`<details class="ph-acc" data-pa="x-${x.id}" ${PVX.has(x.id)?'open':''}><summary>${esc(x.t)||'제목 없음'}</summary><div>${esc(x.mode==='link'?tplBy(x.src).body:x.txt)}</div></details>`).join('')}`;
}
const pvScroller=()=>$('#pv .ph-scroll');
// 탭을 바꾸면 새 탭의 처음(탭 바로 아래)으로 올린다. 이미 그보다 위에 있으면 그대로 둔다
function pvToTabs(){ const sc=pvScroller(), m=sc&&sc.querySelector('.ph-tabmark'); if(m&&sc.scrollTop>m.offsetTop) sc.scrollTop=m.offsetTop; }
function renderPreview(){
 const box=$('#pv'); if(!E) return;
 const old=pvScroller(), st=old?old.scrollTop:0;
 const imgs=[E.main,...E.subs].filter(Boolean), top=imgs[0];
 if(PVTAB==='review'&&!E.review) PVTAB='order';
 const tabs=[['order','상품 주문'],['info','상품 정보'],['review','구매 후기']].filter(([k])=>k!=='review'||E.review);
 const BD=[...autoBadges(E),...E.badges];
 const P=connPOs(E), optVals=new Set(E.areas.flatMap(a=>a.opts.flatMap(o=>o.vals)));
 // 모델 줄은 첫 연결 상품 코드, 제품명은 첫 연결 상품 이름에서 옵션 값(용량·색상 등)을 뺀 것
 const model=P[0]?P[0].id:'모델 코드';
 const sub=P[0]?P[0].name.split(' ').filter(t=>!optVals.has(t)).join(' '):'';
 // 가입 조건 안내 (샘플 문구)
 const JOIN_NOTE='만 18세 이상 만 34세 미만의 고객님만 가입할 수 있는 상품이에요';
 const end=endAt(E), stop=end?`<div class="ph-stop">${svg(PH_IC.info)}<div><b>상품 가입 중단 안내</b><p>해당 상품은 ${+end.slice(5,7)}월 ${+end.slice(8,10)}일 이후 신규 가입 중단될 예정입니다.</p></div></div>`:'';
 box.innerHTML=` <div class="ph-top">${phIc('back')}<span>${phIc('share')}${phIc('menu')}</span></div>
 <div class="ph-scroll">
 ${stop}
 <div class="ph-hero${top&&top.u?' has-img':''}">
  ${top&&top.u?`<img src="${top.u}" alt="${esc(top===E.main&&E.mainAlt.trim()?E.mainAlt.trim():'대표이미지')}">`:`<div class="ph-noimg">${phIc('device')}<small>${top?esc(top.n):'대표 이미지를 등록하면 여기에 보인다'}</small></div>`}
  ${imgs.length>1?`<div class="ph-dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>
 <div class="ph-info"><div class="ph-model">${esc(model)}</div>
  <div class="ph-title${E.name.trim()?'':' ph-empty'}">${E.name.trim()?nameHtml(E.name.trim()):'전시명을 입력하세요'}</div>
  <div class="ph-sub${sub?'':' ph-empty'}">${sub?esc(sub):'제품명'}</div>
  ${BD.length?`<div class="ph-bdgs">${BD.map((b,i)=>`<span class="${b.k?'au':i?'':'dk'}" ${b.k?`style="background:${b.c}"`:''}>${esc(b.t)}</span>`).join('')}</div>`:''}
  <div class="ph-note">${JOIN_NOTE}</div></div>
 <div class="ph-gap"></div>
 <i class="ph-tabmark" data-pa="tabs" aria-hidden="true"></i>
 <div class="ph-tabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" class="${PVTAB===k?'on':''}" aria-selected="${PVTAB===k}">${l}</button>`).join('')}</div>
 ${PVTAB==='info'?infoPv()+simPv()+tabBuyPv():PVTAB==='review'?reviewPv()+simPv()+tabBuyPv():orderPv()}
 </div>`;
 pvScroller().scrollTop=st;
 box.querySelectorAll('.ph-tabs button').forEach(b=>b.addEventListener('click',()=>{ if(PVTAB===b.dataset.tab) return; PVTAB=b.dataset.tab; renderPreview(); pvToTabs(); }));
 box.querySelectorAll('[data-pill]').forEach(b=>b.addEventListener('click',()=>{ PVPILL=!PVPILL; renderPreview(); }));
 box.querySelectorAll('[data-tbtn]').forEach(b=>b.addEventListener('click',()=>toast('T 상담 연결 (예시)')));
 box.querySelectorAll('[data-combo]').forEach(b=>b.addEventListener('click',()=>toast('이 조합으로 주문서에 담았어요 (예시)')));
 box.querySelectorAll('[data-cta]').forEach(b=>b.addEventListener('click',()=>toast(E.kind==='ps'?'PS가 속한 PO 전시로 이동 (예시)':'주문서로 이동 (예시)')));
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
// [앵커, 필요한 탭]. 앵커가 없으면(예: 노출 끈 추가 정보) 탭 처음으로 간다
const PV_AT={kind:['top'],conn:['tabs','order'],basic:['top'],search:['top'],desc:['desc','info'],order:['flow','order'],join:['join','order'],inst:['inst','order'],gift:['gift','order'],td:['td','order'],sim:['sim'],review:['review','review']};
function pvTarget(k){
 if(k==='more') k=curM;
 if(k==='info') k=curI;
 if(k==='method') return E.kind==='po'?[`area-${cur}`,'order']:['top'];
 if(k==='extra') return curX!=null?[`x-${curX}`,'info']:['tabs','info'];
 if(k==='order'&&E.kind!=='po') return ['top'];
 if(k==='review'&&!E.review) return ['top'];
 if(k==='sim'&&!E.sim.on) return ['top'];
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
 if(innerWidth<=1100){ p.style.height=''; return; }
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
// 임시저장은 필수 항목이 비어도 저장되고 목록에 '작성 중'으로 남는다. 승인요청은 필수 섹션을 모두 채워야 보내지고, 비어 있으면 첫 섹션을 펼쳐 보여 준다
function save(req){
 const d=clone(E); if(!d.id){ d.id=Math.max(0,...DISPLAYS.map(x=>x.id))+1; DISPLAYS.unshift(d); } else DISPLAYS[DISPLAYS.findIndex(x=>x.id===d.id)]=d;
 // EPC 상품마다 대표 전시는 1개: 이 전시를 대표로 지정한 상품은 기존 대표 전시에서 일반 전시로 바뀐다
 DISPLAYS.forEach(x=>{ if(x!==d) x.rep=(x.rep||[]).filter(id=>!d.rep.includes(id)); });
 const stored=saveList(), n=blocking(d).length; goList();
 toast((req?'승인을 요청했어요':n?`저장했어요. 필수 확인 ${n}건이 남아 '작성 중'으로 표시돼요`:'저장했어요')+(stored?'':' (브라우저 저장소를 쓸 수 없어 새로고침하면 사라져요)'));
}
$('#bDraft').addEventListener('click',()=>save(false));
$('#bSave').addEventListener('click',()=>{ const b=blocking(E); if(!b.length){ save(true); return; }
 const ks=[...new Set(b.map(([k])=>k))], l=SECS.find(([k])=>k===ks[0])[1]; goSec(ks[0]); toast(ks.length>1?`${l} 외 ${ks.length-1}개 섹션을 채워야 승인요청할 수 있어요`:`${eul(l)} 채워야 승인요청할 수 있어요`); });
$('#bReset').addEventListener('click',()=>{ if(!confirm('입력한 내용을 처음 상태로 되돌릴까요?')) return; openEdit(E.id); toast(E.id?'저장된 값으로 되돌렸습니다':'초기화했습니다'); });

// ---------- 시작: ?view=list 는 목록, ?id=N 은 그 전시 수정, 그 외는 새 전시 등록 ----------
const qs=new URLSearchParams(location.search);
if(qs.get('view')==='list') goList();
else { const id=+qs.get('id'); openEdit(id&&DISPLAYS.some(d=>d.id===id)?id:null); }
