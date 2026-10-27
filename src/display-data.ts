// @ts-nocheck
// 상품 전시 데이터 · 저장소. display-create2.html(상품 전시 등록/수정), display-list2.html(상품 전시 목록 · 일괄 관리 통합), product-display-bulk.html(이전 일괄 관리)이 함께 쓴다.
// EPC 샘플 상품, 샘플 전시, 브라우저 저장소(STORE_KEY) 읽기·쓰기를 이 파일에 모은다.
// ---------- EPC 샘플 데이터 (EPC 상품 조회 화면에서 내려오는 값으로 가정) ----------
// PO: 판매 단위. dt = Delivery type(PS 목록), base = Price policy 기본가, 후보 add = 추가금
export const TODAY=new Date().toISOString().slice(0,10);
// 전시 시작·종료 일시 비교용 지금 시각 (YYYY-MM-DDTHH:MM, 브라우저 시간대)
export const NOW=(d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16))(new Date());
export const TYPES=['기기서비스','액세서리','요금제','부가서비스','구독서비스','보험','제휴'];
export const ONCE=new Set(['기기서비스','액세서리']);
export function seedNum(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
// T우주 편의점&카페의 선택 혜택 후보 50개와 추가금
export const PS3_NAMES=['YouTube Premium','디즈니+','Netflix 스탠다드','티빙 스탠다드','웨이브 베이직','쿠팡플레이','밀리의서재','윌라 오디오북','FLO 무제한','멜론 스트리밍','지니뮤직','Google One 100GB','네이버플러스 멤버십','배달의민족 쿠폰팩','요기요 쿠폰팩','파리바게뜨 할인','배스킨라빈스 할인','도미노피자 쿠폰','CGV 예매 할인','메가박스 예매 할인','교보문고 sam','리디셀렉트','클래스101','야놀자 할인','여기어때 할인','카카오T 블루 할인','쏘카 할인','GS25 할인','CU 할인','이마트24 할인'];
for(let i=PS3_NAMES.length+1;i<=50;i++) PS3_NAMES.push('제휴 쿠폰팩 '+String(i-30).padStart(2,'0'));
export const PS3_ADD=n=>n==='YouTube Premium'||n==='디즈니+'?7900:[0,1000,2000,3900,4900,5900][seedNum(n)%6];
export let EPCN=3370;
export const mk=o=>Object.assign({epc:String(++EPCN).padStart(6,'0'),ver:'v1.0',sale:'판매중',img:[o.id.toLowerCase()+'_main.png']},o);
// 단말 세트: 용량 × 색상 조합마다 PO 하나
export const devSet=(start,model,file,rows,ver,desc)=>rows.map(([c,k,p],i)=>mk({id:'DEV-'+String(start+i).padStart(3,'0'),name:`${model} ${c} ${k}`,type:'기기서비스',ver,base:p,desc:`${desc} ${c} 모델입니다`,img:[`${file}_${k==='블루'?'blue':'silver'}_front.png`],dt:[{id:'PS1',name:'단말',req:true,desc:`${c} · ${k}`},{id:'PS2',name:'기본 구성품',req:true,desc:'USB-C 케이블 · 유심핀'}]}));
export const PO=[
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
 // v023 반영: 제휴 상품 1 (상품 유형 제휴서비스). 기존 EPC 상품ID가 바뀌지 않도록 맨 뒤에 붙인다
 mk({id:'PTN-001',name:'넷플릭스 프리미엄 제휴 이용권',type:'제휴',base:17000,desc:'넷플릭스 프리미엄을 SKT 회선 인증으로 이용하는 제휴 이용권입니다',dt:[{id:'PS1',name:'Netflix 프리미엄 이용',req:true,desc:'동시 시청 4명 · UHD'}]}),
];
export const poBy=id=>PO.find(p=>p.id===id);
export const selPS=po=>po.dt.filter(p=>!p.req);
export const hasSel=po=>selPS(po).length>0;
// PS 개별 전시용: PO의 PS를 펼친 목록
export const PSLIST=PO.flatMap(po=>po.dt.flatMap(ps=>ps.req?[{key:po.id+'|'+ps.id,name:ps.name,desc:ps.desc,po,kind:'필수 PS'}]:ps.cands.map((c,ci)=>({key:po.id+'|'+ps.id+'|'+ci,name:c.n,desc:`${ps.name} 후보 · ${c.add?'+'+c.add.toLocaleString()+'원':'추가금 없음'}`,po,kind:'선택 PS 후보'}))));
export const psBy=k=>PSLIST.find(x=>x.key===k);

export const BCOL=[['보라','#4320d4'],['파랑','#1f5fa8'],['초록','#1f8a5b'],['주황','#d4612a'],['빨강','#c0392b'],['핑크','#a8326a'],['검정','#2c2c2a']];
export const MSG1='이 상품은 고객이 직접 선택하는 항목이 있어, 고정으로 등록해도 고객 화면에 선택 항목이 표시됩니다.';
export const MSG2='선택 항목이 EPC 상품에 포함되어 있어 옵션을 만들 수 없습니다.';

// ---------- 상품 콘텐츠 마스터 (product-content.html 상품 콘텐츠 관리에서 등록·수정) ----------
// 안내 템플릿 · 컬러 · 용량 · 사이즈 · 기타 옵션. 이 브라우저 저장소(CONTENT_KEY)에 남기고, 전시 등록 화면이 같은 값을 쓴다.
// upd = 최종등록(수정)일시, editor = 최종등록(수정)자, on = 사용여부(미사용은 전시 등록에서 새로 고를 수 없다)
export const TPL_TYPES=['이용안내','유의사항','약관','판매자 정보','자주 묻는 질문','마케팅 정보','구매후기','혜택안내'];
const M0='김등록(P123456)';
const at=(d,t='09:00:00')=>`2026-${d} ${t}`;
const tpl=(id,n,t,v,body,upd,on=true)=>({id,n,t,v,body,on,upd,editor:M0});
const clr=(code,n,hex,epc,upd,on=true)=>({code,n,hex,epc,on,upd,editor:M0});
const cap=(code,gb,n,unit,epc,upd,on=true)=>({code,gb,n,unit,epc,on,upd,editor:M0});
const siz=(code,group,n,val,unit,epc,upd,on=true)=>({code,group,n,val,unit,epc,on,upd,editor:M0});
const opt=(code,group,n,epc,upd,on=true)=>({code,group,n,epc,on,upd,editor:M0});
const CONTENT_SEED=()=>({
 tpl:[
  tpl('TPL-0001','휴대폰 이용안내','이용안내','v1.0','상품 수령 후 구성품과 외관을 확인해 주세요\n개통 및 서비스 이용 조건은 선택한 상품의 안내를 확인해 주세요',at('09-02')),
  tpl('TPL-0002','구매 전 유의사항','유의사항','v3.0','개통 후 14일 이내 단순 변심 철회가 가능해요\n약정 할인 반환금이 발생할 수 있어요',at('10-05','14:20:00')),
  tpl('TPL-0003','이동전화 이용약관','약관','v5.0','이동전화 서비스 이용약관 전문\n개인정보 처리방침',at('08-21','11:05:00')),
  tpl('TPL-0004','SK텔레콤 판매자 정보','판매자 정보','v1.0','상호 SK텔레콤(주)\n사업자등록번호 104-81-37225',at('07-15')),
  tpl('TPL-0005','T우주 구독 FAQ','자주 묻는 질문','v2.0','Q. 선택 혜택은 언제 바꿀 수 있나요?\nA. 매월 1회 변경할 수 있어요',at('09-18','16:40:00')),
  tpl('TPL-0006','10월 프로모션 안내','마케팅 정보','v1.0','10월 가입 고객에게 커피 쿠폰을 드려요',at('10-01','10:00:00')),
  tpl('TPL-0007','구매후기 작성 안내','구매후기','v1.0','상품을 받은 뒤 30일 안에 구매후기를 남길 수 있어요\n사진과 함께 작성하면 T포인트를 드려요',at('09-10')),
  tpl('TPL-0008','공통 안내','이용안내','v2.0','주문 · 개통 · 배송 과정에서 공통으로 안내하는 내용입니다',at('10-12','13:30:00')),
  tpl('TPL-0009','지원금 안내','이용안내','v1.0','공시지원금과 추가지원금은 개통 시점 기준으로 적용돼요',at('10-08','15:10:00')),
  tpl('TPL-0010','바로도착 · 행복배송 안내','이용안내','v1.0','오늘 주문하면 지역에 따라 당일 또는 다음 날 받아 볼 수 있어요',at('09-25')),
  tpl('TPL-0011','바로픽업 안내','이용안내','v1.2','가까운 매장에서 바로 찾아갈 수 있어요. 신분증을 꼭 챙겨 주세요',at('10-14','17:45:00')),
  tpl('TPL-0012','다이렉트 플랜 혜택 안내','혜택안내','v1.3','다이렉트 플랜 가입 고객에게 드리는 혜택을 안내합니다',at('10-20','09:30:00')),
  tpl('TPL-0013','티다팩 안내','이용안내','v1.5','대상 요금제를 12개월 약정하면 1년간 매월 제휴 쿠폰을 드려요',at('10-22','11:00:00')),
 ],
 color:[
  clr('CLR-BK','블랙','#1E2533','COLOR_BLACK',at('10-02')), clr('CLR-WH','화이트','#FFFFFF','COLOR_WHITE',at('10-02')),
  clr('CLR-SV','실버','#C9CED6','COLOR_SILVER',at('10-03')), clr('CLR-GY','그레이','#6B7078','COLOR_GRAY',at('10-03')),
  clr('CLR-PK','핑크','#E8A0B5','COLOR_PINK',at('10-04')), clr('CLR-BL','블루','#3D6FD9','COLOR_BLUE',at('10-04')),
  clr('CLR-JB','제트 블랙','#0D0F12','COLOR_JETBLACK',at('10-06')), clr('CLR-NT','내추럴 티타늄','#B8AFA3','COLOR_NATURALTI',at('10-06')),
  clr('CLR-LV','라벤더','#B9A6E0','',at('10-09')), clr('CLR-DG','딥그린','#2F5D50','COLOR_DEEPGREEN',at('10-09')),
  clr('CLR-GN','그린','#3F8F5B','COLOR_GREEN',at('09-12')), clr('CLR-PP','퍼플','#7A5BD6','COLOR_PURPLE',at('09-12')),
  clr('CLR-GD','골드','#D4B06A','COLOR_GOLD',at('09-12'),false),
 ],
 cap:[
  cap('CAP-8G',8,'8GB','GB','',at('09-01'),false), cap('CAP-16G',16,'16GB','GB','STORAGE_16GB',at('09-01')),
  cap('CAP-32G',32,'32GB','GB','STORAGE_32GB',at('09-01')), cap('CAP-64G',64,'64GB','GB','STORAGE_64GB',at('09-01')),
  cap('CAP-128G',128,'128GB','GB','STORAGE_128GB',at('09-01')), cap('CAP-256G',256,'256GB','GB','STORAGE_256GB',at('09-01')),
  cap('CAP-512G',512,'512GB','GB','STORAGE_512GB',at('09-01')), cap('CAP-1T',1024,'1TB','TB','STORAGE_1TB',at('09-01')),
  cap('CAP-2T',2048,'2TB','TB','STORAGE_2TB',at('09-01')), cap('CAP-4T',4096,'4TB','TB','',at('09-01'),false),
 ],
 size:[
  siz('SIZ-W40','워치 케이스','40mm',40,'mm','SIZE_40MM',at('09-05')), siz('SIZ-W44','워치 케이스','44mm',44,'mm','SIZE_44MM',at('09-05')),
  siz('SIZ-W46','워치 케이스','46mm',46,'mm','SIZE_46MM',at('09-05')), siz('SIZ-W49','워치 케이스','49mm',49,'mm','SIZE_49MM',at('09-05')),
  siz('SIZ-T11','태블릿 화면','11인치',11,'inch','SIZE_11IN',at('09-07')), siz('SIZ-T13','태블릿 화면','13인치',13,'inch','SIZE_13IN',at('09-07')),
  siz('SIZ-BSM','밴드','S/M','','','BAND_SM',at('09-08')), siz('SIZ-BML','밴드','M/L','','','BAND_ML',at('09-08')),
 ],
 etc:[
  opt('OPT-LTE','연결 방식','LTE','CONN_LTE',at('09-11')), opt('OPT-WIFI','연결 방식','Wi-Fi','CONN_WIFI',at('09-11')),
  opt('OPT-CEL','연결 방식','셀룰러','CONN_CELLULAR',at('09-11')), opt('OPT-AL','케이스 소재','알루미늄','CASE_ALUMINUM',at('09-14')),
  opt('OPT-TI','케이스 소재','티타늄','CASE_TITANIUM',at('09-14')), opt('OPT-SS','케이스 소재','스테인리스','',at('09-14'),false),
  opt('OPT-SPEN','구성','S펜 포함','PKG_SPEN',at('09-16')), opt('OPT-NOSPEN','구성','S펜 미포함','PKG_NOSPEN',at('09-16')),
 ],
});
export const CONTENT_KEY='nova.product-content.v1';
function loadContent(){ const s=CONTENT_SEED(); try { const o=JSON.parse(localStorage.getItem(CONTENT_KEY)||'null'); if(o) Object.keys(s).forEach(k=>{ if(Array.isArray(o[k])) s[k]=o[k]; }); } catch {} return s; }
export const CONTENT=loadContent();
export function saveContent(){ try { localStorage.setItem(CONTENT_KEY,JSON.stringify(CONTENT)); return true; } catch { return false; } }
// 다른 화면(다른 탭)이 콘텐츠를 바꾸면 같은 배열에 다시 읽어 들인다. 바뀌면 true
export function reloadContent(e){ if(e&&e.key!==CONTENT_KEY) return false; const n=loadContent(); Object.keys(n).forEach(k=>CONTENT[k].splice(0,CONTENT[k].length,...n[k])); return true; }
// 전시 등록 화면이 쓰는 이름: TPL = 안내 템플릿 목록, COLOR = 사용 중인 컬러명 → HEX
export const TPL=CONTENT.tpl;
export const COLOR=Object.fromEntries(CONTENT.color.filter(c=>c.on).map(c=>[c.n,c.hex]));
export const tplBy=id=>TPL.find(t=>t.id===id);
// 상품이 가진 템플릿 (EPC 상품 정보에서 온다고 가정. 프로토타입은 상품 구분별로 정함)
export const TYPE_TPL={기기서비스:['TPL-0001','TPL-0002','TPL-0004'],요금제:['TPL-0003','TPL-0004'],부가서비스:['TPL-0003','TPL-0004'],구독서비스:['TPL-0005','TPL-0004'],액세서리:['TPL-0001','TPL-0004'],보험:['TPL-0002','TPL-0004'],제휴:['TPL-0002','TPL-0004']};
export const poTpls=p=>TYPE_TPL[p.type]||[];

// 주문 구성 (주문 구성 관리에서 정의된 흐름으로 가정). 연결 상품 유형으로 자동 결정
export const FLOWS={
 dev:{types:['기기서비스'],name:'휴대폰 주문',sub:'이동전화 계약 + 단말 구매',fields:[['join','가입 유형',['신규가입','번호이동','기기변경']],['disc','할인 방법',['공시지원','선택약정']],['pay','단말 결제',['일시불','24개월 할부','36개월 할부']]]},
 mob:{types:['요금제','부가서비스','보험'],name:'요금제/부가서비스 주문',sub:'이동전화 계약 가입·변경',fields:[['pjoin','가입 유형',['신규가입','번호이동','요금제 변경']],['sim','유심',['USIM 배송','eSIM']]]},
 sub:{types:['구독서비스'],name:'구독 주문',sub:'T우주 구독 가입',fields:[['cycle','결제 주기',['월간','연간']]]},
 acc:{types:['액세서리'],name:'배송 상품 주문',sub:'액세서리 구매',fields:[['ship','수령 방법',['택배','매장 픽업']]]}
};

// ---------- 전시 데이터 ----------
export let SEQ=100; export const nid=()=>++SEQ;
// 오퍼링 문구(CVM): 기본 개수 · 최대 개수(1~5개 버튼) · 문구 최대 글자 수
export const CVM_DEF=5, CVM_MAX=5, CVM_LEN=40;
// 옵션 값 표시 방식
export const ODISP=[['text','텍스트'],['chip','컬러칩'],['img','이미지']];
export function newArea(n,mode){return {id:nid(),name:n||'',mode:mode||'fixed',pos:[],q:1,useMax:false,mx:2,opt0:false,opts:[{name:'',vals:[],disp:'text'}],map:{},def:[],cond:'always',parent:null,trig:[]};}
// ---------- v022 반영: 상품 유형 · 채널 연동 주문 단계(가입 유형 · 할부 · 배송) 기본값, 사은품·티다팩 샘플 ----------
// 상품 유형(고객 선택 방식 섹션): 주문 구성안 종류(ord)와 필요한 주문 항목(items), 통합 APP · WEB에서 쓰는 주문 단계(need)를 정한다.
// kinds = 이 유형에 맞는 EPC 상품 구분(연결 상품에 하나도 없으면 경고), kn = 경고 문구에 쓰는 이름
export const PTYPES=[
 {k:'기기서비스',d:'휴대폰 · 태블릿 · 웨어러블',kinds:['기기서비스','액세서리'],kn:'기기',need:['join','inst','ship'],ord:'기기 주문',items:['가입 유형','할부','요금제','배송','본인 인증']},
 {k:'이동전화',d:'요금제 단독 가입',kinds:['요금제'],kn:'요금제',need:['join'],ord:'요금제 주문',items:['가입 유형','요금제','본인 인증']},
 {k:'부가서비스',d:'보험 · 컬러링 등',kinds:['부가서비스','보험'],kn:'부가서비스',need:[],ord:'부가서비스 주문',items:['회선 인증','부가서비스']},
 {k:'구독서비스',d:'우주패스 등 정기 구독',kinds:['구독서비스'],kn:'구독',need:[],ord:'구독 주문',items:['구독 상품','결제 수단']},
 {k:'제휴서비스',d:'제휴사 상품 · 이용권',kinds:['제휴'],kn:'제휴',need:[],ord:'제휴 주문',items:['회선 인증','제휴 동의']}
];
export const ptOf=d=>PTYPES.find(p=>p.k===d.svc)||null;
// 연결 상품 구분으로 추천하는 상품 유형: 기기 → 요금제 → 부가서비스 → 구독 → 제휴 순으로 본다
export function recPtype(types){ const h=t=>types.includes(t); return h('기기서비스')?'기기서비스':h('요금제')?'이동전화':h('부가서비스')||h('보험')?'부가서비스':h('구독서비스')?'구독서비스':h('액세서리')?'기기서비스':h('제휴')?'제휴서비스':''; }
// ---------- v023 반영: 대표 상품 (display-create-v23.html) ----------
// 상품 유형은 직접 고르지 않고 대표 상품의 EPC 상품 구분으로 정한다. 전시 값: repPo = 대표 상품 PO id, repAuto = 자동 지정 중인지
// 구성 우선순위(기기 > 요금제 > 부가 > 구독 > 제휴): 대표 상품을 자동 지정할 때와 '더 앞선 상품이 함께 연결됨' 경고에 쓴다
export const REP_ORDER=['기기서비스','액세서리','요금제','부가서비스','보험','구독서비스','제휴'];
export const ptypeOfPo=id=>{ const p=poBy(id); return p&&PTYPES.find(x=>x.kinds.includes(p.type))||null; };
export const repRank=id=>{ const i=REP_ORDER.indexOf((poBy(id)||{}).type); return i<0?REP_ORDER.length:i; };
// 연결 상품 중 구성 우선순위가 가장 앞인 상품 (같으면 연결 순서)
export const recRep=ids=>ids.length?ids.reduce((a,b)=>repRank(b)<repRank(a)?b:a):null;
// 주문 구성안 이름으로 주문 유형을 정한다 (주문 구성 관리의 분류로 가정)
export const ordKind=n=>/기기서비스|iPhone|갤럭시|휴대폰|태블릿|워치|악세사리|액세서리/.test(n)?'기기 주문':/요금제|유심|로밍/.test(n)?'요금제 주문':/부가서비스/.test(n)?'부가서비스 주문':/구독|T우주/.test(n)?'구독 주문':'제휴 주문';
// 가입 유형 · 할부 · 배송은 통합 APP · WEB 주문 단계라서, 이 채널을 고르고 상품 유형이 그 단계를 쓸 때만 정한다
export const APP_CH=['통합 APP','통합 WEB'];
export const JOIN_DEF=()=>[{k:'신규가입',d:'SKT에 새로운 번호로 가입해요',on:true},{k:'번호이동',d:'지금 번호 그대로 다른 통신사에서 SKT로 이동해요',on:true},{k:'기기변경',d:'지금 번호 그대로 기기만 바꿔요',on:true}];
// 할부는 가입 유형마다 쓸 개월 수 · 순서 · 처음 노출 개수가 다르다 (기본 선택 없음)
const mkInst=a=>a.map(([k,on])=>({k,on:!!on}));
export const INST_BY_DEF=()=>({
 '신규가입':mkInst([['24개월',1],['30개월',1],['일시불',1],['12개월',1],['36개월',1],['48개월',0],['6개월',0],['18개월',0]]),
 '번호이동':mkInst([['24개월',1],['30개월',1],['36개월',1],['48개월',1],['일시불',1],['12개월',1],['6개월',0],['18개월',0]]),
 '기기변경':mkInst([['24개월',1],['일시불',1],['36개월',1],['12개월',1],['30개월',0],['48개월',0],['6개월',0],['18개월',0]])
});
export const INST_TOP_DEF=()=>({'신규가입':3,'번호이동':4,'기기변경':2});
// 배송 유형: 운영 조건(c)은 배송 관리 기준이라 읽기 전용, 전시에서는 사용 여부 · 순서 · 고객 문구만 정한다
export const SHIP_DEF=()=>[
 {k:'바로도착',d:'오늘 주문하면 3시간 안에 받아요',c:'서울·경기 일부 지역 · 오후 4시 전 주문',on:true},
 {k:'행복배송',d:'원하는 날짜·장소로 찾아가 개통까지 도와드려요',c:'전국 · 방문 예약 필수',on:true},
 {k:'일반배송',d:'택배로 1~2일 안에 받아요',c:'전국',on:true},
 {k:'바로픽업',d:'가까운 매장에서 바로 받아요',c:'픽업 매장 재고 기준',on:false}
];
// 주문을 받지 않을 때(주문 구성 방식 OFF) 주문 버튼 대신 보이는 버튼과 버튼 문구
export const OFF_DEF=()=>({act:'notify',btn:'출시 알림 받기'});
// 사은품은 사은품·혜택 관리에서 만든다(샘플). cond.model = 연결 상품명 앞부분, cond.pos = 연결 상품 코드, own = 이 전시 전용(직접 연결)
export const GIFT=[
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
export const TDP=[
 {id:'TDP-0001',brand:'다이소',logo:'daiso',lc:'#e60012',benefit:'매월 10,000원 할인 쿠폰',tag:'AI PICK',valid:'발급일부터 30일',use:'1만원 이상 결제 시',issue:'T 멤버십 앱 쿠폰함',cond:{pos:['PLN-001','PLN-004']},from:'2026-10-01',to:'2026-12-31',total:5000,left:3120},
 {id:'TDP-0002',brand:'무신사 머니',logo:'MUSINSA',lc:'#000000',benefit:'매월 10,000원 적립',tag:'추천',valid:'적립일부터 60일',use:'무신사 앱 결제 시',issue:'무신사 계정 연동',cond:{pos:['PLN-001']},from:'2026-10-01',to:'2027-03-31',total:null,left:null},
 {id:'TDP-0003',brand:'올리브영',logo:'O',lc:'#8dc63f',benefit:'매월 10,000원 할인 쿠폰',tag:'추천',valid:'발급일부터 30일',use:'2만원 이상 결제 시',issue:'CJ ONE 앱 쿠폰함',cond:{pos:['PLN-001','PLN-004']},from:'2026-10-01',to:'2026-12-31',total:3000,left:240},
 {id:'TDP-0004',brand:'CGV',logo:'CGV',lc:'#c4161c',benefit:'매월 영화 1편 관람권',tag:'',valid:'발급일부터 30일',use:'2D 일반관 한정',issue:'문자 발송',cond:{pos:['PLN-001']},from:'2026-11-01',to:'2027-04-30',total:2000,left:2000},
 {id:'TDP-0005',brand:'배달의민족',logo:'배민',lc:'#2ac1bc',benefit:'매월 5,000원 할인 쿠폰',tag:'',valid:'발급일부터 14일',use:'1.5만원 이상 주문 시',issue:'배민 앱 쿠폰함',cond:{pos:['PLN-001']},from:'2026-04-01',to:'2026-09-30',total:4000,left:900},
 {id:'TDP-0006',brand:'투썸플레이스',logo:'TWOSOME',lc:'#c8102e',benefit:'매월 음료 1잔',tag:'',valid:'발급일부터 30일',use:'아메리카노 R 기준',issue:'문자 발송',cond:{pos:['PLN-002','PLN-005']},from:'2026-10-01',to:'2026-12-31',total:null,left:null},
 {id:'TDP-0101',brand:'GS25',logo:'GS25',lc:'#0a8fd6',benefit:'기획전 한정 매월 3,000원 쿠폰',tag:'',valid:'발급일부터 30일',use:'5천원 이상 결제 시',issue:'우리동네GS 앱',own:true,cond:{},from:'2026-10-15',to:'2026-11-30',total:1000,left:1000}
];
export const TD_TOP=3; // 티다팩은 처음 3개만 보이고 나머지는 전체보기 (티다팩 공통 정책)
export function orderDefaults(){ const o={}; Object.values(FLOWS).forEach(f=>f.fields.forEach(([k,,v])=>o[k]=v.slice())); return o; }
// 상품 유형 이름 목록 (예전 '전시 유형(서비스 구분)'과 같은 값)
export const SVCS=PTYPES.map(p=>p.k);
export function newDisplay(){ return {id:null,kind:'po',conn:[],method:'fixed',areas:[newArea('','fixed')],name:'',from:TODAY,fromTime:'00:00',to:'',toTime:'23:59',noEnd:true,show:false,channels:[],svc:'',svcAuto:true,main:null,mainAlt:'',subs:[],subAlt:'',badges:[],related:true,orderOn:true,descMode:'image',descImgs:[],descHtml:'',descNote:'',extras:[],search:{on:false,kw:[],title:'',desc:'',og:null},cvm:{on:false,n:CVM_DEF,lines:[]},order:orderDefaults(),orderPlan:null,off:OFF_DEF(),review:true,sim:{on:true,mode:'def',t:'',s:''},join:JOIN_DEF(),instBy:INST_BY_DEF(),instTop:INST_TOP_DEF(),ship:SHIP_DEF(),gifts:[],giftBadge:true,tds:[],tdBadge:true}; }
// 이미지: n = 파일명, u = 업로드한 이미지 주소(EPC에서 불러온 이미지는 파일명만 있다)
export const img=n=>({n,u:null});
export const PLANS=['PLN-001','PLN-002','PLN-004','PLN-005'];
// 단말 옵션 영역: 용량(텍스트) × 색상(컬러칩) → PO 매핑
export const devArea=(n,ids,colors)=>Object.assign(newArea(n,'opt'),{pos:ids,opts:[{name:'용량',vals:['256GB','512GB'],disp:'text'},{name:'색상',vals:colors,disp:'chip'}],map:Object.fromEntries(ids.map((id,i)=>[`${i<2?'256GB':'512GB'}|${colors[i%2]}`,id]))});
export const FLIP=['DEV-001','DEV-002','DEV-003','DEV-004'], IP18=['DEV-005','DEV-006','DEV-007','DEV-008'];
// 예전 구조(한 줄 소개, images 배열)를 지금 구조로 맞춘다. 전시 여부가 없던 예전 저장본·샘플은 전시(Y)로 본다
export function norm(d){
 // EPC 샘플에서 지운 상품(예: 0 청년 69)을 가리키면 연결·영역·옵션 매핑에서 뺀다
 const ok=k=>d.kind==='ps'?!!psBy(k):!!poBy(k);
 d.conn=(d.conn||[]).filter(ok); (d.areas||[]).forEach(a=>{ a.pos=(a.pos||[]).filter(ok); a.def=(a.def||[]).filter(ok); Object.keys(a.map||{}).forEach(k=>{ if(!ok(a.map[k])) delete a.map[k]; }); });
 if(d.images){ d.main=d.images[0]||null; d.subs=d.images.slice(1); delete d.images; } d.main=d.main||null; d.mainAlt=d.mainAlt||''; d.subs=d.subs||[]; d.subAlt=d.subAlt||''; d.fromTime=d.fromTime||'00:00'; d.toTime=d.toTime||'23:59'; d.channels=[...new Set((d.channels||[]).map(c=>({웹:'통합 WEB',앱:'통합 APP',BSS:'BSS(TBD)'}[c]||c)))]; d.svc=SVCS.includes(d.svc)?d.svc:''; delete d.summary;
 if(d.desc!=null){ const t=String(d.desc).trim(); if(t&&!d.descHtml){ const e=x=>x.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); d.descHtml=t.split(/\n{2,}/).map(p=>`<p>${e(p).replace(/\n/g,'<br>')}</p>`).join(''); if(!(d.descImgs&&d.descImgs.length)) d.descMode='html'; } delete d.desc; }
 d.descMode=d.descMode||'image'; d.descImgs=d.descImgs||[]; d.descHtml=d.descHtml||''; d.descNote=d.descNote||''; (d.areas||[]).forEach(a=>{ if(a.name==='고객 선택 방식'||/^구성 영역( d+)?$/.test(a.name)) a.name=''; a.cond=a.cond&&a.cond!=='relation'?a.cond:'always'; delete a.rel; if(a.parent===undefined) a.parent=null; a.trig=a.trig||[]; }); if(d.orderPlan===undefined) d.orderPlan=null;
 const sr=d.search=Object.assign({on:false,kw:[]},d.search); if(sr.title==null) sr.title=String(sr.line||'').slice(0,25); delete sr.line; sr.desc=sr.desc||''; sr.og=sr.og||null; d.cvm=Object.assign({n:CVM_DEF,lines:[]},d.cvm); d.cvm.n=Math.min(CVM_MAX,Math.max(1,d.cvm.n)); if(d.cvm.on==null) d.cvm.on=d.cvm.lines.some(x=>x&&x.trim()); if(d.noEnd==null) d.noEnd=!d.to; if(d.show==null) d.show=true;
 delete d.rep; if(d.svcAuto==null) d.svcAuto=!d.svc; if(d.review==null) d.review=true; if(d.related==null) d.related=true; if(d.orderOn==null) d.orderOn=true; d.sim=Object.assign({on:true,mode:'def',t:'',s:''},d.sim); if(!d.join) d.join=JOIN_DEF();
 // 예전 저장본: 할부 한 목록(inst) · 기본 선택(joinDef · instDef) → 가입 유형별 할부(instBy · instTop)
 { const bd=INST_BY_DEF(), td=INST_TOP_DEF(); d.instBy=Object.assign(bd,d.instBy); d.instTop=Object.assign(td,typeof d.instTop==='object'?d.instTop:{}); delete d.inst; delete d.joinDef; delete d.instDef; }
 if(!d.ship) d.ship=SHIP_DEF(); d.off=Object.assign(OFF_DEF(),d.off); d.gifts=d.gifts||[]; if(d.giftBadge==null) d.giftBadge=true; d.tds=d.tds||[]; d.tdCut=d.tdCut||[]; if(d.tdBadge==null) d.tdBadge=true; return d; }
// 샘플은 종료일이 있으면 '종료일없음'을 끈다
export const seed=o=>norm(Object.assign(newDisplay(),{show:true,channels:['통합 APP','통합 WEB'],noEnd:!o.to},o));
// 샘플 전시가 쓰는 주문 구성안 (주문 구성안 선택 목록 ORD_TPL과 같은 번호·버전 규칙)
export const planOf=(i,name)=>{ const h=seedNum(name); return {id:'CTN-ORD-'+String(i).padStart(3,'0'),ver:`v${1+h%2}.${h%4}`,name,cat:'상품 유형 템플릿'}; };
export const SEEDS=()=>[
 seed({id:1,svc:'구독서비스',name:'YouTube Premium',from:'2026-10-01',conn:['SUB-001'],method:'fixed',areas:[Object.assign(newArea('YouTube Premium','fixed'),{pos:['SUB-001']})],images:[img('sub-001_main.png')],badges:[{t:'광고 없이',c:'#4320d4',s:'f'}],desc:'광고 없이 영상과 음악을 즐기고, 오프라인 저장도 할 수 있어요.',extras:[{id:1,t:'판매자 정보',mode:'link',src:'TPL-0004',show:true,txt:''}],search:{on:true,kw:['유튜브','YouTube','구독'],line:'광고 없는 YouTube'},orderPlan:planOf(6,'구독 기본 템플릿')}),
 seed({id:2,svc:'기기서비스',name:'갤럭시 Z 플립8',from:'2026-10-01',conn:FLIP,method:'select',areas:[devArea('모델 선택',FLIP,['블루','실버'])],images:[img('flip8_blue_front.png'),img('flip8_silver_front.png')],badges:[{t:'신규',c:'#d4612a',s:'f'}],desc:'반으로 접어 주머니에 쏙 들어가는 갤럭시 Z 플립8.',extras:[{id:1,t:'유의사항',mode:'link',src:'TPL-0002',show:true,txt:''}],search:{on:true,kw:['갤럭시','플립'],line:''},orderPlan:planOf(1,'기기서비스 / 기본')}),
 seed({id:3,svc:'기기서비스',name:'iPhone 18 Pro + 베스트요금제 + 구독',from:'2026-10-15',to:'2026-12-31',conn:[...IP18,...PLANS,'SUB-001','SUB-002','SUB-003'],method:'complex',areas:[devArea('단말',IP18,['실버','블루']),Object.assign(newArea('요금제','list'),{pos:PLANS,q:1}),Object.assign(newArea('구독 혜택','list'),{pos:['SUB-001','SUB-002','SUB-003'],q:1})],images:[img('ip18p_silver_front.png')],badges:[{t:'온라인 전용',c:'#1f8a5b',s:'l'}],desc:'iPhone 18 Pro와 베스트 요금제, 원하는 구독 하나를 함께 가입하는 온라인 전용 구성입니다.',extras:[{id:1,t:'유의사항',mode:'link',src:'TPL-0002',show:true,txt:''},{id:2,t:'이용약관',mode:'link',src:'TPL-0003',show:true,txt:''}],search:{on:true,kw:['아이폰','요금제'],line:''},orderPlan:planOf(13,'휴대폰 + 요금제 + 구독 / 통합형')}),
 seed({id:4,svc:'이동전화',name:'베스트 요금제',from:'2026-09-01',conn:PLANS,method:'select',areas:[Object.assign(newArea('요금제를 골라 주세요','list'),{pos:PLANS,q:1})],search:{on:false,kw:[],line:''},desc:'데이터 걱정 없는 5G 베스트 요금제를 비교하고 골라 보세요.',orderPlan:planOf(2,'요금제 / 기본')}),
 seed({id:5,svc:'기기서비스',name:'액세서리 모음',from:'2026-09-01',to:'2026-09-30',conn:['ACC-001','ACC-002'],method:'fixed',areas:[Object.assign(newArea('액세서리','fixed'),{pos:['ACC-001','ACC-002']})],desc:'갤럭시 Z 플립8 · iPhone 18 Pro와 함께 쓰기 좋은 정품 액세서리입니다.',orderPlan:planOf(19,'액세서리 / 택배')}),
 seed({id:6,svc:'구독서비스',name:'YouTube Premium 혜택 소개',from:'2026-10-01',kind:'ps',conn:['SUB-001|PS1'],method:'fixed',areas:[],desc:'YouTube Premium에 포함된 광고 없는 재생 · 오프라인 저장 혜택을 소개합니다.'}),
];
// 저장한 전시는 이 브라우저에만 남긴다. 저장소를 못 쓰면 샘플로 시작한다
export const STORE_KEY='nova.display-create2.v2'; // v4-8 반영(사은품·티다팩 등 샘플 추가)으로 저장소를 새로 쓴다. 이후 구조 변경은 norm()이 맞춘다
export function loadList(){ try { const s=localStorage.getItem(STORE_KEY); if(s){ const l=JSON.parse(s); if(Array.isArray(l)){ l.forEach(norm); SEQ=Math.max(SEQ,...l.flatMap(d=>[...d.areas.map(a=>a.id),...d.extras.map(x=>x.id)])); return l; } } } catch {} return SEEDS(); }
export function saveList(){ try { localStorage.setItem(STORE_KEY,JSON.stringify(DISPLAYS)); return true; } catch { return false; } }
export const DISPLAYS=loadList();
// 다른 화면(다른 탭)이 저장소를 바꾸면 같은 배열에 다시 읽어 들인다. 바뀌면 true
export function reloadList(e){ if(e&&e.key!==STORE_KEY) return false; DISPLAYS.splice(0,DISPLAYS.length,...loadList()); return true; }
// 목록에 보이는 이름 · 전시ID · 최종등록(수정) 정보. 상품 전시 목록과 일괄 관리가 같은 규칙을 쓴다
export const nameText=s=>String(s==null?'':s).replace(/<br\s*\/?>/gi,' ').replace(/\s+/g,' ').trim();
export const dispId=id=>String(id).padStart(6,'0');
export const nextDisplayId=()=>Math.max(0,...DISPLAYS.map(x=>x.id))+1;
export const nowStamp=()=>{ const dt=new Date(); return new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,19).replace('T',' '); };
export const EDITOR='김수정(P123457)';
// 콘텐츠를 쓰는 전시. 템플릿: link = 완전 매핑(템플릿 수정이 바로 반영), copy = 1회 매핑(복사 당시 내용 유지)
export const tplUsers=(id,mode)=>DISPLAYS.filter(d=>(d.extras||[]).some(x=>x.src===id&&x.mode===mode));
// 옵션 값(컬러명 · 용량명 · 사이즈명 · 옵션값)을 옵션 선택에 쓰는 전시. 컬러는 컬러칩으로 보이는 옵션만 센다
export const optUsers=(name,chipOnly)=>DISPLAYS.filter(d=>(d.areas||[]).some(a=>(a.opts||[]).some(o=>(!chipOnly||o.disp==='chip')&&(o.vals||[]).includes(name))));
// 전시 채널
export const CHS=['통합 APP','통합 WEB','T-gate','스마트플래너','BSS(TBD)'];
