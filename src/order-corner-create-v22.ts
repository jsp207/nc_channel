// @ts-nocheck
// 주문 코너 등록 (주문 코너 관리 v0.2.2 안에서 여는 등록 화면)
// 기준: FO 코너 유형 매트릭스(35개 배열 × 26개 속성). 유형은 고객 행동(선택 · 입력 · 확인) 3개 + 배너/HTML형으로 나누고, UI가 같거나 일부만 다른 배열은
// 하나의 '코너 형태'로 묶었다. 원래 배열은 '표시 방식'으로 남겨 속성 기본값을 그대로 가져온다. 35개 배열 → 4개 유형 · 12개 형태 · 35개 표시 방식
// 속성 표기: R 필수(Y 고정) · O 선택(ON/OFF) · D 종속(가격 Y일 때만 선택) · V 설정값(형태 선택, 노출 개수 범위) · - 해당 없음(숨김)
import "./order-corner-create-v22.css";
import { CORNERS, esc } from "./order-corner-v22-data";

/* ===== 속성 (매트릭스 행 순서) ===== */
const ATTRS=[
 ['title','코너 메인 타이틀','Title','c'],['sub','서브 타이틀','SubTitle','c'],['tip','툴팁','Tooltip','c'],['link','우측 링크','TitleRightLink','c'],
 ['tab','탭 · 필터','Tab / FilterBar','c'],['search','검색란','SearchBar','c'],['none','미선택 옵션','NoneOption','c'],['more','더보기 버튼','MoreButton','c'],
 ['empty','빈 상태 문구','EmptyState','c'],['cta','버튼','CTA','c'],['cap','하단 안내 문구','Caption','c'],
 ['var','형태','Variants','i'],['img','이미지','ImageSrc','i'],['ititle','아이템 타이틀','Title','i'],['isub','서브 타이틀','SubTitle','i'],['price','가격','Price','i'],
 ['pcap','가격 캡션','PriceCaption','i'],['icap','캡션','Caption01~03','i'],['badge','배지','BadgeItem','i'],['icon','아이콘','IconItem','i'],['btn','버튼 라벨 텍스트','ButtonText','i'],
 ['lv','항목명 / 값','Label / Value','i'],['input','입력란','InputItem','i'],['help','도움말','HelpText','i'],['state','상태','State','i'],['count','노출 개수 범위','Count','i']
];
const AK=ATTRS.map(a=>a[0]);
const DEP={pcap:'price'};   // 종속 속성 : 부모가 Y일 때만 켤 수 있다

/* ===== 코너 유형 → 코너 형태 → 표시 방식 =====
   유형은 고객이 코너에서 하는 행동으로 나눈다 (고른다 · 입력한다 · 확인만 한다)
   형태는 UI 구조가 같거나 일부만 다른 원본 배열을 묶은 단위, 표시 방식은 원본 배열 그대로 (속성 기본값의 기준)
   V(키, 표시 방식명, 원본 배열명, 매트릭스(코너 11자 + 아이템 15자), 미리보기 형태, 기존 렌더러 ui, 추가 옵션 {vars 형태 선택지, s 예시 콘텐츠 키}) */
const V=(k,n,src,m,fam,ui,x)=>Object.assign({k,n,src,m:m.replace(/\s/g,''),fam,ui},x||{});
const L=(k,n,note,s,vs)=>({k,n,note,s,vs});
const TYPES=[
 {k:'select',n:'선택형',d:'고객이 보기 중에서 하나 또는 여러 개를 고릅니다.',ls:[
  L('card','목록 선택형','카드 라디오형 · 카드 체크형 · 오퍼형 · 텍스트 리스트형 · 검색 리스트형 · 필터 리스트형 · 약관 리스트형을 묶었습니다. 보기를 위에서 아래로 나열해 고르는 구조가 같고, 카드/한 줄 행 모양과 선택 방식, 상단 도구(검색란, 탭), CTA · 전체 동의 여부만 다릅니다.','select',[
   V('radio','단일 선택','카드 라디오형','ROOO--OO--- --ROOD-O-O---RV','card','card'),
   V('check','복수 선택','카드 체크형','ROOO--OO--- -ORRR-ROOO----V','check','card'),
   V('offer','오퍼','오퍼형','RO-------R- -RRRR-----O--O-','offer','card',{s:'reco'}),
   V('tlist','텍스트 리스트','텍스트 리스트형','OO----O---- VOR----------OV','tlist','radio',{vars:['라디오','체크박스']}),
   V('search','검색 리스트','검색 리스트형','OO--OR-OR-O --RO----------V','slist','list',{s:'search'}),
   V('filter','필터 리스트','필터 리스트형','O---R--OR-- -ORO---O------V','slist','list',{s:'search'}),
   V('terms','약관 동의','약관 리스트형','O---------- V-RO-----O---RV','terms','terms',{s:'terms',vars:['전체 동의 사용','전체 동의 미사용']})]),
  L('thumb','이미지 카드형','썸네일 카드형 · 상품 카드형 · 비교형을 묶었습니다. 이미지가 있는 카드를 2열로 나열하는 구조가 같습니다.','reco',[
   V('thumb','썸네일 카드','썸네일 카드형','RO-O------- -RRRR--O-O----V','thumb','grid'),
   V('pcard','상품 추천','상품 카드형','RO-----O-O- -RROR---------V','pcard','card'),
   V('compare','비교','비교형','RO--------- -OR-O-----R---V','compare','card')]),
  L('simple','칩/드롭다운형','칩형 · 드롭다운형을 묶었습니다. 색상, 용량처럼 짧은 값을 고르고 펼침 방식만 다릅니다.','short',[
   V('chip','칩','칩형','RO--------- --R----------RV','chip','chip'),
   V('drop','드롭다운','드롭다운형','O---------- --R----------RV','drop','list')])]},
 {k:'input',n:'입력형',d:'고객이 값을 직접 입력하거나 등록합니다.',ls:[
  L('field','기본 입력형','기본 입력란형 · 인증형 · 일정 선택형 · 조회 폼형을 묶었습니다. 입력란에 버튼, 도움말, 캘린더, 조회 버튼이 붙는지만 다릅니다.','input',[
   V('basic','기본 입력','기본 입력란형','OOO-------O V-R------O-RO-V','input','form',{vars:['텍스트','셀렉트','아이템']}),
   V('auth','인증','인증형','OO--------- --R------R-RROV','auth','form'),
   V('date','일정 선택','일정 선택형','R---------- --R--------RO--','date','form'),
   V('query','조회','조회 폼형','RO-------RO --R--------R--V','query','form')]),
  L('addr','주소 입력형','주소형입니다. 주소 검색 버튼, 상세 주소 입력란, 등록된 주소 목록으로 구성합니다.','addr',[
   V('addr','주소','주소형','ROO-----O-- --R------ROR-O-','addr','form')]),
  L('reg','등록/첨부형','등록 리스트형 · 첨부 리스트형을 묶었습니다. 항목마다 버튼(삭제, 파일 찾기)이 붙는 목록 구조가 같습니다.','input',[
   V('reg','등록 리스트','등록 리스트형','ROOO----R-- --R------RRO--V','reg','form'),
   V('file','파일 첨부','첨부 리스트형','R---------O --RR-----RR---V','file','form',{s:'file'})])]},
 {k:'info',n:'콘텐츠형',d:'고객이 고르거나 입력하지 않고 내용을 확인만 합니다. 기존 정보 요약형 · 금액 확인형 · 결과 안내형 · 안내형을 합쳤습니다.',ls:[
  L('kv','정보 콘텐츠형','테이블형 · 최종 금액형 · 정산 안내형을 묶었습니다. 항목명 : 값 행을 나열하고, 금액 방식은 마지막 행(합계)을 강조합니다.','summary',[
   V('table','테이블','테이블형','RO--------O ----O-----R---V','table','sum'),
   V('final','최종 금액','최종 금액형','R---------O ---OR---O-R---V','amount','sum',{s:'amount'}),
   V('settle','정산 안내','정산 안내형','RR--------O ----R---O-O----','amount','sum',{s:'amount'})]),
  L('prod','상품 콘텐츠형','주문 상품형 · 상품 기본 정보형을 묶었습니다. 상품 대표 정보 아래 항목명 : 값을 붙이는 구조가 같습니다.','prod',[
   V('order','주문 상품','주문 상품형','R---------- -OR-R---R-O--R-','prod','sum'),
   V('base','상품 기본 정보','상품 기본 정보형','R---------O -RR-R---O-O----','prod','sum')]),
  L('ilist','안내 콘텐츠형','텍스트형 · 아코디언형 · 스텝형 · 링크 리스트형 · 고객센터형 · 등록 내역형을 묶었습니다. 타이틀과 설명 행을 나열하고 표시 방식만 다릅니다.','guide',[
   V('bullet','불릿 텍스트','텍스트형','O---------- -O-R----------V','text','list'),
   V('accordion','아코디언','아코디언형','O---O------ --RR-----O----V','accordion','list'),
   V('step','스텝','스텝형','RO--O------ -ORR-----O----V','step','list'),
   V('link','링크','링크 리스트형','O---------- --RO----O-----V','link','list'),
   V('call','고객센터','고객센터형','R---------- --RO----RO----V','call','list'),
   V('hist','등록 내역','등록 내역형','R-------R-O --RO-----O-----','hist','list',{s:'hist'})]),
  L('result','결과 콘텐츠형','완료형 · 진행형 · 결과 분기형을 묶었습니다. 아이콘 + 타이틀 + 설명 구조가 같고 아이콘과 버튼만 다릅니다.','result',[
   V('done','완료','완료형','---------O- -ORO----R-O----','result','done'),
   V('ing','진행 중','진행형','----------O --RR----R------','result','done'),
   V('branch','결과 분기','결과 분기형','---------O- VORR----R------','result','done',{vars:['성공','실패','보류']})])]},
 {k:'media',n:'배너/HTML형',d:'이미지 배너 한 장 또는 HTML 본문 하나만 노출합니다.',ls:[
  L('banner','배너','배너형입니다. 이미지 배너 한 장을 노출합니다.','guide',[
   V('banner','배너','배너형','----------- -R------------V','banner','grid')]),
  L('html','HTML','html형입니다. 본문을 HTML 에디터로 입력합니다.','guide',[
   V('html','HTML','html형','O---------- ---------------','html','list')])]}
];

/* ===== 예시 콘텐츠 (형태 · 표시 방식의 s 키) ===== */
const SAMPLE={
 select:['어떻게 가입할까요?',[['신규가입','SKT에 새로운 번호로 가입해요'],['번호이동','지금 번호 그대로 SKT로 이동해요'],['기기변경','지금 번호 그대로 기기만 바꿔요']]],
 short:['원하는 용량을 선택해 주세요',[['256GB',''],['512GB',''],['1TB','']]],
 input:['가입자 정보를 입력해 주세요',[['이름','이름을 입력해 주세요'],['생년월일','YYYY.MM.DD'],['휴대폰 번호','010-0000-0000']]],
 addr:['배송지를 입력해 주세요',[['주소','주소를 검색해 주세요'],['상세 주소','상세 주소를 입력해 주세요']]],
 search:['가까운 대리점을 찾아 주세요',[['T월드 강남점','서울 강남구 테헤란로 123'],['T월드 역삼점','서울 강남구 역삼로 45'],['T월드 선릉점','서울 강남구 선릉로 67']]],
 summary:['주문 정보를 확인해 주세요',[['요금제','5GX 프라임'],['약정','선택약정 24개월'],['납부 방식','24개월 할부']]],
 amount:['최종 결제 금액을 확인하세요',[['휴대폰 출고가','1,250,000원'],['총 할인 금액','- 534,600원'],['최종 결제 금액','715,400원']]],
 prod:['주문 상품을 확인해 주세요',[['iPhone 18 Pro','그라파이트 · 256GB'],['요금제','5GX 프라임'],['약정','선택약정 24개월']]],
 hist:['등록한 배송지',[['집','서울 강남구 테헤란로 123'],['회사','서울 중구 을지로 45']]],
 terms:['약관에 동의해 주세요',[['[필수] 구매 내역 확인','주문 상품과 금액을 확인했어요'],['[필수] 개인정보 수집·이용','수집 항목, 이용 목적'],['[선택] 마케팅 정보 수신','혜택 소식을 받아요']]],
 result:['주문이 완료되었어요',[['주문이 완료되었어요','택배로 빠르고 안전하게 배송해 드릴게요.']]],
 guide:['꼭 확인해 주세요',[['개통 안내','배송 받은 후 직접 개통할 수 있어요'],['반품 안내','수령 후 14일 이내 반품할 수 있어요'],['고객센터','114 (평일 09:00~18:00)']]],
 file:['증빙 서류를 첨부해 주세요',[['신분증 사본','jpg, png, pdf · 10MB 이하'],['가족관계증명서','발급일 3개월 이내']]],
 reco:['이런 상품은 어떠세요?',[['iPhone 18 Pro','그라파이트 · 256GB'],['갤럭시 S26','팬텀 블랙 · 256GB'],['갤럭시 Z 폴드8','실버 섀도우 · 512GB']]]
};
const PRICES=['월 69,000원','월 89,000원','월 99,000원','월 109,000원'];
const SINGLE=['result','html','banner'];   // 아이템 1개 고정형
const SELECT_FAM=['card','check','thumb','pcard','compare','tlist','slist','chip','drop','offer'];   // 기본 선택 지정이 있는 형태
const STATES=[['default','Default'],['disabled','Disabled'],['soldout','품절']];

/* ===== 상태 ===== */
let st=null,opts=null;
const $=id=>document.getElementById(id);
const tOf=()=>TYPES.find(t=>t.k===st.type);
const lOf=()=>tOf().ls.find(l=>l.k===st.layout);
const vOf=()=>lOf().vs.find(v=>v.k===st.variant);
const mark=k=>vOf().m[AK.indexOf(k)];
const on=k=>{const m=mark(k);return m==='R'||(m!=='-'&&st.attrs[k]==='Y');};
const sKey=()=>vOf().s||lOf().s;
const isSel=()=>SELECT_FAM.indexOf(vOf().fam)>-1;

function sampleItems(n){
  const s=SAMPLE[sKey()][1];
  return Array.from({length:n},(_,i)=>{const a=s[i%s.length];
    return {ititle:a[0]+(i>=s.length?' '+(i+1):''),isub:['amount','summary','prod','short'].indexOf(sKey())>-1?'':a[1],price:PRICES[i%PRICES.length],pcap:'VAT 포함',icap:'캡션 문구',badge:i===0?'BEST':'',icon:'',btn:'자세히 보기',
      label:a[0],value:a[1],input:a[1],help:'',img:'',state:'default'};});
}
/* 속성 기본값 : 필수는 Y, 선택은 N (아이템 서브 타이틀만 Y), 형태는 첫 값, 노출 개수는 1~4 (단일형 1~1) */
function resetAttrs(){
  const v=vOf();st.attrs={};
  AK.forEach(k=>{const m=mark(k);st.attrs[k]=m==='R'?'Y':m==='O'?(k==='isub'?'Y':'N'):'N';});
  st.vopt=v.vars?v.vars[0]:'';
  st.cnt=SINGLE.indexOf(v.fam)>-1||v.k==='banner'?[1,1]:[1,4];
}
function resetContent(){
  const s=SAMPLE[sKey()];
  st.c={title:s[0],sub:'',tip:'툴팁 안내 문구',link:'자세히 보기',tab:'전체, 추천, 인기',search:'검색어를 입력해 주세요',none:'선택 없이 주문 진행',more:'더보기',
    empty:'조회된 내용이 없어요',cta:'다음',cap:'하단 안내 문구를 입력해 주세요',html:'<p>본문 HTML을 입력해 주세요.</p>'};
  st.items=sampleItems(Math.min(st.cnt[1],s[1].length));st.def=0;
}
function setType(k){st.type=k;st.layout=tOf().ls[0].k;st.variant=lOf().vs[0].k;resetAttrs();resetContent();}
/* 형태 · 표시 방식을 바꾸면 속성은 새 기준으로, 콘텐츠는 예시 종류가 바뀔 때만 다시 채운다 */
function setLayout(k){const s0=sKey();st.layout=k;st.variant=lOf().vs[0].k;resetAttrs();if(sKey()!==s0)resetContent();else fitItems();}
function setVariant(k){const s0=sKey();st.variant=k;resetAttrs();if(sKey()!==s0)resetContent();else fitItems();}
function fitItems(){if(st.items.length>st.cnt[1])st.items=st.items.slice(0,st.cnt[1]);while(st.items.length<st.cnt[0])st.items.push(sampleItems(st.items.length+1).pop());if(st.def>=st.items.length)st.def=0;}
function fresh(){st={name:'',use:'N',type:'select'};setType('select');}

/* ===== 미리보기 ===== */
const ICO={tip:'<i class="pv-tip">i</i>',chev:'<span class="pv-chev">›</span>',chk:'✓'};
function pvItem(it,i){
  const f=vOf().fam,sel=isSel()&&i===st.def,dis=on('state')&&it.state!=='default';
  const t=on('ititle')?'<b>'+esc(it.ititle)+'</b>':'',sb=on('isub')&&it.isub?'<small>'+esc(it.isub)+'</small>':'';
  const bd=on('badge')&&it.badge?'<span class="pv-bd">'+esc(it.badge)+'</span>':'';
  const pr=on('price')&&it.price?'<strong>'+esc(it.price)+(on('pcap')&&it.pcap?' <em>'+esc(it.pcap)+'</em>':'')+'</strong>':'';
  const cp=on('icap')&&it.icap?'<small class="pv-cap">'+esc(it.icap)+'</small>':'';
  const bt=on('btn')&&it.btn?'<span class="pv-ib">'+esc(it.btn)+'</span>':'';
  const im=on('img')?'<div class="pv-img">IMG</div>':'';
  const ic=on('icon')?'<span class="pv-ic">'+(f==='result'?(st.variant==='ing'?'◌':st.vopt==='실패'?'!':'✓'):f==='call'?'☎':'●')+'</span>':'';
  const lv=on('lv')?'<div class="pv-lv"><span>'+esc(it.label)+'</span><em>'+esc(it.value)+'</em></div>':'';
  const inp=on('input')?'<div class="pv-in">'+esc(it.input)+(f==='date'?'<span>📅</span>':'')+'</div>':'';
  const hp=on('help')&&it.help?'<small class="pv-help">'+esc(it.help)+'</small>':'';
  const stx=dis?'<span class="pv-st">'+(it.state==='soldout'?'품절':'선택 불가')+'</span>':'';
  const cls=(sel?' on':'')+(dis?' dis':'');
  switch(f){
  case 'card':case 'check':case 'offer':case 'pcard':
    return '<div class="pv-card'+cls+'">'+(f==='check'?'<i class="pv-cb'+(sel?' on':'')+'">'+ICO.chk+'</i>':'')+im+'<div class="pv-tx">'+bd+t+sb+pr+cp+lv+bt+'</div>'+stx+'</div>';
  case 'thumb':case 'compare':return '<div class="pv-card col'+cls+'">'+im+bd+t+sb+pr+lv+bt+stx+'</div>';
  case 'tlist':return '<div class="pv-row'+cls+'"><i class="pv-'+(st.vopt==='체크박스'?'cb':'rd')+(sel?' on':'')+'">'+(st.vopt==='체크박스'&&sel?ICO.chk:'')+'</i>'+im+'<div class="pv-tx">'+t+'</div>'+stx+'</div>';
  case 'chip':return '<span class="pv-chip'+cls+'">'+esc(it.ititle)+'</span>';
  case 'drop':return '<div class="pv-opt'+cls+'">'+esc(it.ititle)+'</div>';
  case 'input':case 'auth':case 'date':case 'query':
    return '<div class="pv-fld"><p class="pv-lb">'+esc(it.ititle)+'</p><div class="pv-inr">'+(inp||'<div class="pv-in">'+esc(it.input)+'</div>')+(bt?'<span class="pv-btn">'+esc(it.btn)+'</span>':'')+'</div>'+hp+stx+'</div>';
  case 'addr':return '<div class="pv-fld"><p class="pv-lb">'+esc(it.ititle)+'</p><div class="pv-inr">'+inp+(bt?'<span class="pv-btn">'+esc(it.btn)+'</span>':'')+'</div>'+lv+stx+'</div>';
  case 'reg':case 'hist':case 'file':
    return '<div class="pv-row bx'+cls+'"><div class="pv-tx">'+t+sb+lv+(f==='reg'?inp:'')+'</div>'+(bt?'<span class="pv-btn sm">'+esc(it.btn)+'</span>':'')+'</div>';
  case 'slist':return '<div class="pv-row bx'+cls+'">'+im+'<div class="pv-tx">'+bd+t+sb+'</div>'+ICO.chev+'</div>';
  case 'table':case 'amount':return lv+(on('price')&&!on('lv')?'<div class="pv-lv"><span>금액</span><em>'+esc(it.price)+'</em></div>':'')+(on('isub')&&it.isub?'<small>'+esc(it.isub)+'</small>':'');
  case 'prod':return '<div class="pv-prod">'+im+'<div class="pv-tx">'+t+pr+'</div>'+ic+'</div>'+lv;
  case 'terms':return '<div class="pv-row'+cls+'"><i class="pv-cb on">'+ICO.chk+'</i><div class="pv-tx">'+t+sb+'</div>'+(bt?ICO.chev:'')+'</div>';
  case 'result':return '<div class="pv-res">'+ic+im+'<b>'+esc(it.ititle)+'</b>'+sb+lv+'</div>';
  case 'text':return '<div class="pv-bul">'+im+'<span>'+esc(it.isub)+'</span></div>';
  case 'accordion':return '<div class="pv-row bx"><div class="pv-tx">'+t+(i===0?sb:'')+'</div><span class="pv-chev">'+(i===0?'⌃':'⌄')+'</span></div>';
  case 'step':return '<div class="pv-step"><span>'+(i+1)+'</span><div class="pv-tx">'+t+sb+bt+'</div></div>';
  case 'link':case 'call':return '<div class="pv-row bx">'+ic+'<div class="pv-tx">'+t+sb+'</div>'+(bt?'<span class="pv-btn sm">'+esc(it.btn)+'</span>':ICO.chev)+'</div>';
  case 'banner':return '<div class="pv-banner">배너 이미지</div>';
  }
  return '';
}
function pvHTML(){
  const v=vOf(),f=v.fam,c=st.c,its=st.items.slice(0,st.cnt[1]);let h='';
  if(on('title')&&c.title)h+='<div class="pv-h"><b>'+esc(c.title)+(on('tip')?ICO.tip:'')+'</b>'+(on('link')?'<a>'+esc(c.link)+'</a>':'')+'</div>';
  if(on('sub')&&c.sub)h+='<p class="pv-sub">'+esc(c.sub)+'</p>';
  if(on('tab'))h+='<div class="pv-tabs">'+c.tab.split(',').map((x,i)=>'<span class="'+(i?'':'on')+'">'+esc(x.trim())+'</span>').join('')+'</div>';
  if(on('search'))h+='<div class="pv-srch">'+esc(c.search)+'<span>⌕</span></div>';
  if(f==='html')h+='<div class="pv-html">'+esc(c.html.replace(/<[^>]+>/g,' ').trim()||'HTML 본문')+'</div>';
  else if(!its.length&&on('empty'))h+='<div class="pv-empty">'+esc(c.empty)+'</div>';
  else if(f==='drop')h+='<div class="pv-dd">'+esc((its[st.def]||its[0]||{}).ititle||'')+'<span>⌄</span></div><div class="pv-ddl">'+its.map(pvItem).join('')+'</div>';
  else{
    const wrap=f==='chip'?'pv-chips':f==='thumb'||f==='compare'?'pv-grid':f==='table'||f==='amount'?'pv-tbl'+(f==='amount'?' amt':''):'pv-list';
    if(f==='terms'&&st.vopt!=='전체 동의 미사용')h+='<div class="pv-row all"><i class="pv-cb on">'+ICO.chk+'</i><b>전체 동의</b></div>';
    h+='<div class="'+wrap+'">'+its.map(pvItem).join('')+'</div>';
  }
  if(on('none'))h+='<div class="pv-row bx none"><div class="pv-tx"><b>'+esc(c.none)+'</b></div></div>';
  if(on('more'))h+='<div class="pv-more">'+esc(c.more)+'</div>';
  if(on('cta'))h+='<div class="pv-cta">'+esc(c.cta)+'</div>';
  if(on('cap'))h+='<p class="pv-capt">'+esc(c.cap)+'</p>';
  return '<div class="pv'+(f==='result'?' ctr':'')+'">'+(h||'<p class="pv-sub">노출할 속성을 켜 주세요.</p>')+'</div>';
}
function renderPv(){$('ccPv').innerHTML=pvHTML();}

/* ===== 폼 ===== */
const req='<i class="cc-req">*</i>';
const tr=(th,td,cls)=>'<div class="cc-tr'+(cls?' '+cls:'')+'"><div class="cc-th">'+th+'</div><div class="cc-td">'+td+'</div></div>';
const radios=(name,list,val,dis)=>'<div class="cc-rg">'+list.map(x=>'<label class="'+(x[0]===val?'on':'')+(dis?' dis':'')+'"><input type="radio" name="'+name+'" value="'+esc(x[0])+'"'+(x[0]===val?' checked':'')+(dis?' disabled':'')+'>'+esc(x[1])+'</label>').join('')+'</div>';
const hint=t=>'<p class="cc-hint">'+t+'</p>';

function basicCard(){
  const t=tOf();
  // 코너 ID는 저장 시 채번하고 상세 화면에서만 보여준다
  let h=tr('코너명','<input class="cc-inp cc-name" data-f="name" maxlength="30" value="'+esc(st.name)+'" placeholder="코너명을 입력해 주세요">');
  h+=tr('사용 여부',radios('ccUse',[['N','N'],['Y','Y']],st.use));
  h+=tr('코너 유형',radios('ccType',TYPES.map(x=>[x.k,x.n]),st.type));
  h+=tr('코너 형태',radios('ccLayout',t.ls.map(x=>[x.k,x.n]),st.layout));
  const l=lOf(),v=vOf();
  h+=tr('표시 방식',l.vs.length>1?radios('ccVar',l.vs.map(x=>[x.k,x.n]),st.variant):'<b class="cc-one">'+esc(v.n)+'</b>');
  return acc('basic','기본 정보','<div class="cc-tb">'+h+'</div>');
}
/* 아코디언 섹션 : 상품 전시 등록(product-v023.html) 전시 유형 영역과 같은 테두리 · 머리줄 · 접기. 영역마다 따로 펼치고 접는다 (처음엔 기본 정보만 펼침) */
const fold={};
function initFold(){Object.keys(fold).forEach(k=>delete fold[k]);Object.assign(fold,{header:true,contents:true,footer:true});}
function toggleSec(id){const hd=$('ccForm').querySelector('[data-fold="'+id+'"]');if(!hd)return;fold[id]=!fold[id];setFold(hd.parentNode,!fold[id]);}
function foldAll(){$('ccForm').querySelectorAll('.cc-acc>header[data-fold]').forEach(h=>{const k=h.dataset.fold;if(!fold[k]){fold[k]=true;setFold(h.parentNode,false);}});}
function acc(id,title,body,aside){
  return '<section class="cc-acc'+(fold[id]?' closed':'')+'"><header data-fold="'+id+'"><b>'+title+'</b>'+(aside||'')
   +'<button type="button" class="cc-fold" aria-expanded="'+!fold[id]+'" aria-label="접기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></header>'
   +'<div class="cc-accb">'+body+'</div></section>';
}
/* 접기/펼치기 애니메이션 : 상품 전시 등록(display-create-v25.ts) setFold와 같은 높이 · 여백 · 투명도 전환 */
const FOLD_MS=300,FOLD_EASE='cubic-bezier(.4,0,.2,1)';
export function setFold(sec,open){
  const body=sec.querySelector(':scope>.cc-accb'),was=!sec.classList.contains('closed');
  sec.querySelector('.cc-fold').setAttribute('aria-expanded',String(open));
  if(body._fold){body._fold.cancel();body._fold=null;body.style.display='';body.style.overflow='';}
  sec.classList.toggle('closed',!open);
  if(was===open||matchMedia('(prefers-reduced-motion: reduce)').matches||!body.animate)return;
  // 접을 때는 '접힘' 상태로 먼저 바꾸고, 애니메이션이 끝날 때까지 본문을 잠시 보이게 둔다
  body.style.overflow='hidden';if(!open)body.style.display='block';
  const h=body.scrollHeight,cs=getComputedStyle(body),full={height:h+'px',paddingTop:cs.paddingTop,paddingBottom:cs.paddingBottom,opacity:1},none={height:'0px',paddingTop:'0px',paddingBottom:'0px',opacity:0};
  const a=body._fold=body.animate(open?[none,full]:[full,none],{duration:open?FOLD_MS:FOLD_MS-40,easing:FOLD_EASE});
  a.onfinish=()=>{if(body._fold!==a)return;body._fold=null;body.style.display='';body.style.overflow='';};
}
/* ===== 코너 구성 : 코너 Header · 코너 Item · 코너 Footer 아코디언 (표시 방식은 기본 정보의 코너 형태 아래) =====
   속성 Y/N과 콘텐츠 입력을 같은 영역에 둔다. 예전에는 '코너 속성 정보'에서 Y/N을 바꾸고 아래 '코너 콘텐츠'로 내려가 입력해야 했다.
   Header · Footer 속성은 스위치 바로 옆 입력란이 켜지고 꺼지며(N이어도 자리는 남겨 화면이 흔들리지 않게), Contents의 아이템 속성은 칩으로 켜고 끄면 바로 아래 아이템 카드에 입력란이 생긴다.
   표시 방식에 해당 속성이 하나도 없는 영역은 그리지 않는다 */
const ALAB=Object.fromEntries(ATTRS.map(a=>[a[0],a]));
const HEAD=['title','sub','tip','link','tab','search'],FOOT=['none','more','empty','cta','cap'];   // 아이템 위(타이틀 · 탭 · 검색) / 아래(미선택 · 더보기 · 버튼 · 안내)
const CF=[['title','코너 메인 타이틀',30],['sub','서브 타이틀',40],['tip','툴팁 문구',60],['link','우측 링크 문구',12],['tab','탭 · 필터 (쉼표로 구분)',60],['search','검색란 안내 문구',30],
  ['none','미선택 옵션 문구',20],['more','더보기 버튼 문구',20],['empty','빈 상태 문구',30],['cta','버튼 문구',12],['cap','하단 안내 문구',60]];
const IF=[['ititle','타이틀',''],['isub','서브 타이틀','w2'],['price','가격',''],['pcap','가격 캡션',''],['icap','캡션',''],['badge','배지',''],['btn','버튼 라벨',''],['input','입력 안내 문구','w2'],['help','도움말','w2']];
// 잠김 : 필수(R)는 Y 고정, 종속(D)은 부모가 N이면 N 고정
const locked=k=>{const m=mark(k);return m==='R'||(m==='D'&&!on(DEP[k]));};
const lockTip=k=>mark(k)==='R'?'필수 속성이라 항상 노출돼요':mark(k)==='D'&&!on(DEP[k])?ALAB[DEP[k]][1]+'을(를) 켜면 선택할 수 있어요':'';
function sw(k){
  const y=on(k),lk=locked(k);
  return '<label class="cc-sw'+(lk?' lock':'')+'" title="'+lockTip(k)+'"><input type="checkbox" name="at_'+k+'"'+(y?' checked':'')+(lk?' disabled':'')+' aria-label="'+esc(ALAB[k][1])+' 노출"><i></i></label>';
}
function cRow(x){
  const k=x[0],m=mark(k);if(m==='-')return '';
  const y=on(k),a=ALAB[k];
  const inp='<div class="cc-cin"><input class="cc-inp" data-c="'+k+'" maxlength="'+x[2]+'" value="'+esc(st.c[k])+'" placeholder="'+esc(x[1])+'"'+(y?'':' disabled')+'><span class="cc-len" id="len_'+k+'">'+String(st.c[k]).length+'/'+x[2]+'</span></div>';
  return tr(esc(a[1])+(m==='R'?req:'')+'<small>('+esc(a[2])+')</small>','<div class="cc-line">'+sw(k)+inp+'</div>',y?'':'off');
}
const onCnt=keys=>{const ks=keys.filter(k=>mark(k)!=='-');return ks.length?'<span class="cc-on">노출 '+ks.filter(on).length+' / '+ks.length+'</span>':'';};
function cornerPart(id,title,keys){
  const rows=CF.filter(x=>keys.indexOf(x[0])>-1).map(cRow).join('');
  return rows?acc(id,title,'<div class="cc-tb">'+rows+'</div>',onCnt(keys)):'';
}
// 라벨 글자는 두지 않고 입력란 안내 문구 · 마우스 오버로 구분한다 (lab은 이름 · 툴팁)
const fl=(lab,inner,w)=>'<div class="cc-f'+(w?' '+w:'')+'">'+inner+'</div>';
const iInp=(i,k,v,lab)=>'<input class="cc-inp" data-it="'+i+'" data-k="'+k+'" value="'+esc(v)+'" placeholder="'+esc(lab)+'" title="'+esc(lab)+'" aria-label="'+esc(lab)+'">';
/* 코너 Item 제목 : 구성 확정 전이라 TBD 표시 */
const ITEM_T='코너 Item<span class="cc-tbd">( TBD 진행중 )</span>';
const ITEM_ROW=4;   // 한 줄에 둘 입력란 수. 넘으면 두 줄로 반씩 나눈다
function itemCard(it,i){
  const min=st.cnt[0];
  const fs=IF.filter(x=>on(x[0])).map(x=>fl(x[1],iInp(i,x[0],it[x[0]],x[1]),x[2]));
  if(on('lv'))fs.push(fl('항목명',iInp(i,'label',it.label,'항목명')),fl('값',iInp(i,'value',it.value,'값')));
  if(on('img'))fs.push(fl('이미지 경로',iInp(i,'img',it.img,'이미지 경로')));
  if(on('state'))fs.push(fl('상태','<select class="cc-sel" data-it="'+i+'" data-k="state" title="상태" aria-label="상태">'+STATES.map(s=>'<option value="'+s[0]+'"'+(it.state===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select>'));
  if(fs.length>ITEM_ROW)fs.splice(Math.ceil(fs.length/2),0,'<i class="cc-ibr"></i>');
  const f=fs.join('');
  const def=isSel()?'<label class="cc-def'+(st.def===i?' on':'')+'"><input type="radio" name="ccDef" value="'+i+'"'+(st.def===i?' checked':'')+'>기본</label>':'';
  const ctl='<span class="cc-mv"><button type="button" data-mv="'+i+':-1"'+(i?'':' disabled')+' aria-label="위로">↑</button><button type="button" data-mv="'+i+':1"'+(i<st.items.length-1?'':' disabled')+' aria-label="아래로">↓</button></span><button type="button" class="cc-xs" data-del="'+i+'"'+(st.items.length>min?'':' disabled')+'>삭제</button>';
  // 기본 | 입력란(1~2줄) | 순서 · 삭제
  return '<div class="cc-it">'+def
   +(f?'<div class="cc-ifs">'+f+'</div>':'<p class="cc-sub cc-inone">켜진 구성 요소 중 입력할 문구가 없어요</p>')+'<div class="cc-ictl">'+ctl+'</div></div>';
}
function itemPart(){
  const v=vOf(),c=st.c;
  if(v.fam==='html')return acc('contents',ITEM_T,'<div class="cc-tb">'+tr('본문 HTML'+req,'<textarea class="cc-ta tall" data-c="html">'+esc(c.html)+'</textarea>'+hint('본문은 HTML 에디터로 입력합니다. (에디터 연동은 개발 시 적용)'))+'</div>');
  if(!v.m.slice(11).replace(/-/g,'').length)return '';
  const ik=ATTRS.filter(a=>a[3]==='i'&&a[0]!=='var'&&a[0]!=='count'&&mark(a[0])!=='-').map(a=>a[0]);
  const chips='<div class="cc-chips">'+ik.map(k=>{const y=on(k),lk=locked(k);
    return '<label class="cc-chip'+(y?' on':'')+(lk?' lock':'')+'" title="'+esc(ALAB[k][2])+(lockTip(k)?' · '+lockTip(k):'')+'"><input type="checkbox" name="at_'+k+'"'+(y?' checked':'')+(lk?' disabled':'')+'>'+esc(ALAB[k][1])+(mark(k)==='R'?req:'')+'</label>';}).join('')+'</div>';
  let h=tr('구성 요소',chips);
  if(mark('var')!=='-'){const vs=v.vars||['기본'];h+=tr('형태',radios('ccVopt',vs.map(x=>[x,x]),st.vopt||vs[0]));}
  if(mark('count')!=='-'){const one=SINGLE.indexOf(v.fam)>-1?' disabled':'';
    h+=tr('노출 개수 범위','<div class="cc-cnt"><input class="cc-inp sm" type="number" min="1" max="20" data-cnt="0" value="'+st.cnt[0]+'"'+one+'><span>-</span><input class="cc-inp sm" type="number" min="1" max="20" data-cnt="1" value="'+st.cnt[1]+'"'+one+'><span>개</span></div>');}
  const max=st.cnt[1];
  return acc('contents',ITEM_T,'<div class="cc-tb">'+h+'</div>'
   +'<div class="cc-items">'+st.items.map(itemCard).join('')
   +'<div class="cc-iadd"><button type="button" class="cc-xs add" data-cc="add"'+(st.items.length<max?'':' disabled')+'>+ 추가</button>'+(st.items.length>=max?'<span class="cc-sub">노출 개수 범위 최대 '+max+'개에 도달했어요</span>':'')+'</div></div>',onCnt(ik));
}
function render(){$('ccForm').innerHTML=basicCard()+cornerPart('header','코너 Header',HEAD)+itemPart()+cornerPart('footer','코너 Footer',FOOT);renderPv();}

/* ===== 저장 : 주문 코너 관리 목록에 바로 추가 ===== */
/* 오류 문구와 그 입력이 있는 영역 [문구, 영역 id] */
function validate(){
  if(!st.name.trim())return ['코너명을 입력해 주세요.','basic'];
  if(mark('title')==='R'&&!st.c.title.trim())return ['코너 메인 타이틀을 입력해 주세요.','header'];
  if(mark('cta')==='R'&&!st.c.cta.trim())return ['버튼 문구를 입력해 주세요.','footer'];
  if(vOf().fam!=='html'&&vOf().m.slice(11).replace(/-/g,'').length){
    if(st.items.length<st.cnt[0])return ['아이템을 '+st.cnt[0]+'개 이상 등록해 주세요.','contents'];
    if(on('ititle')&&mark('ititle')==='R'&&st.items.some(x=>!x.ititle.trim()))return ['아이템 타이틀을 모두 입력해 주세요.','contents'];
  }
  return null;
}
function nextId(){let n=0;CORNERS.forEach(c=>{const m=c.id.match(/^CN-ORD-(\d+)$/);if(m)n=Math.max(n,+m[1]);});return 'CN-ORD-'+String(n+1).padStart(4,'0');}
function pad(n){return ('0'+n).slice(-2)}
/* 저장할 코너 객체 : 기존 FO 렌더러(ui) · 목록 · 상세가 쓰는 필드를 등록 상태(st)로 채운다 */
function build(id){
  const v=vOf(),tpl=CORNERS.find(c=>c.ui===v.ui)||CORNERS[0],c=JSON.parse(JSON.stringify(tpl)),d=new Date();
  ['cat','subs','epcMode','more','chev','logo','link','btn','src','screens','note','qs','req'].forEach(k=>{delete c[k];});
  const its=v.fam==='html'?[]:st.items.slice(0,st.cnt[1]);
  c.id=id;c.n=st.name.trim();c.t='주문';c.ui=v.ui;c.q=on('title')?st.c.title:'';c.sub=on('sub')?st.c.sub:'';
  c.it='T'+(on('sub')?'S':'')+(on('tip')?'I':'')+(on('isub')||on('lv')?'D':'')+(on('price')?'P':'')+(on('badge')?'B':'')+(on('img')?'M':'')+(on('none')?'N':'')+(on('more')?'R':'');
  c.opts=its.map((x,i)=>({n:on('lv')&&!on('ititle')?x.label:x.ititle,d:on('lv')?x.value:on('input')?x.input:(on('isub')?x.isub:''),p:on('price')?x.price:'',b:on('badge')?x.badge:'',x:'',lk:false,k:c.id+'-'+i}));
  if(on('none'))c.opts.push({n:st.c.none,d:'',p:'',b:'',x:'none',lk:false,k:c.id+'-n'});
  c.moreBtn=on('more')?st.c.more:'';c.ctas=on('cta')?[{on:true,label:st.c.cta,link:''}]:[];c.ctaType=on('cta')?1:0;
  c.sel=v.k==='check'||st.vopt==='체크박스'?'복수 선택':'단일 선택';c.lim=Math.max(1,c.opts.length);c.ds='직접 입력';c.cond={mode:'none',list:[]};
  c.ver='v1.0';c.use=st.use;c.dt=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());c.mby='김운영 (P031001)';
  // 등록 설정 원본 : 유형 · 형태 · 표시 방식 · 속성 ON/OFF · 노출 개수 · 플랫폼 · 설명
  c.spec={type:tOf().n,form:lOf().n,mode:v.n,src:v.src,attrs:Object.fromEntries(AK.filter(k=>mark(k)!=='-').map(k=>[k,k==='count'?st.cnt.join('~'):k==='var'?st.vopt:on(k)?'Y':'N']))};
  c.form=JSON.parse(JSON.stringify(st));   // 수정 화면을 그대로 다시 열기 위한 등록 상태 원본
  delete c.hist;delete c.pending;
  return c;
}
const bump=v=>{const m=/^v(\d+)\.(\d+)$/.exec(v||'');return m?'v'+m[1]+'.'+(+m[2]+1):'v1.0';};
function save(){
  const err=validate();if(err){opts.toast(err[0]);if(fold[err[1]])toggleSec(err[1]);return;}
  if(EDIT){   // 수정 : 같은 객체를 갈아 끼워 목록 · 그룹 참조를 유지하고, 버전은 한 단계 올린다
    const old=EDIT,c=build(old.id);c.ver=bump(old.ver);c.hist=old.hist;
    Object.keys(old).forEach(k=>{delete old[k];});Object.assign(old,c);
    st=null;EDIT=null;opts.onSaved(old);return;
  }
  const c=build(nextId());CORNERS.unshift(c);
  st=null;opts.onSaved(c);
}

/* ===== 이벤트 ===== */
let bound=false;
function bind(){
  if(bound)return;bound=true;
  const root=$('pCreate');
  root.addEventListener('input',e=>{const t=e.target;
    if(t.dataset.f){st[t.dataset.f]=t.value;return;}
    if(t.dataset.c){st.c[t.dataset.c]=t.value;const l=$('len_'+t.dataset.c);if(l)l.textContent=t.value.length+'/'+t.maxLength;renderPv();return;}
    if(t.dataset.it!=null&&t.tagName==='INPUT'){st.items[+t.dataset.it][t.dataset.k]=t.value;renderPv();}});
  root.addEventListener('change',e=>{const t=e.target;
    if(t.name==='ccType'){setType(t.value);render();return;}
    if(t.name==='ccLayout'){setLayout(t.value);render();return;}
    if(t.name==='ccVar'){setVariant(t.value);render();return;}
    if(t.name==='ccUse'){st.use=t.value;render();return;}
    if(t.name==='ccVopt'){st.vopt=t.value;render();return;}
    if(t.name==='ccDef'){st.def=+t.value;render();return;}
    if(t.name&&t.name.indexOf('at_')===0){const k=t.name.slice(3),y=t.checked?'Y':'N';st.attrs[k]=y;Object.keys(DEP).forEach(d=>{if(DEP[d]===k&&y==='N')st.attrs[d]='N';});render();
      // 코너 속성을 켜면 옆 입력란으로 바로 이동
      const inp=root.querySelector('[data-c="'+k+'"]');if(y==='Y'&&inp)inp.focus();else{const s=root.querySelector('[name="at_'+k+'"]');if(s)s.focus();}return;}
    if(t.dataset.cnt!=null){let a=Math.max(1,Math.min(20,parseInt(t.value,10)||1));const i=+t.dataset.cnt;st.cnt[i]=a;if(st.cnt[0]>st.cnt[1]){if(i)st.cnt[0]=a;else st.cnt[1]=a;}fitItems();render();return;}
    if(t.dataset.it!=null&&t.tagName==='SELECT'){st.items[+t.dataset.it][t.dataset.k]=t.value;renderPv();}});
  root.addEventListener('click',e=>{
    const hd=e.target.closest('[data-fold]');
    if(hd){toggleSec(hd.dataset.fold);return;}
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.mv){const p=b.dataset.mv.split(':'),i=+p[0],j=i+(+p[1]);const x=st.items.splice(i,1)[0];st.items.splice(j,0,x);if(st.def===i)st.def=j;else if(st.def===j)st.def=i;render();return;}
    if(b.dataset.del!=null){const i=+b.dataset.del;st.items.splice(i,1);if(st.def>=st.items.length)st.def=0;else if(st.def>i)st.def--;render();return;}
    const a=b.dataset.cc;
    if(a==='add'){st.items.push(sampleItems(st.items.length+1).pop());render();}
    else if(a==='reset'){
      if(EDIT){st=JSON.parse(ST0);render();opts.toast('저장된 설정 값으로 되돌렸어요.');return;}   // 수정 : 저장된 값으로
      const keep={name:st.name,use:st.use};setVariant(st.variant);resetContent();Object.assign(st,keep);render();opts.toast('속성과 콘텐츠를 이 배열의 기본값으로 되돌렸어요.');}
    else if(a==='cancel'){
      const dirty=EDIT?JSON.stringify(st)!==ST0:!!(st&&st.name);
      if(dirty&&!confirm(EDIT?'수정한 내용이 있습니다. 저장하지 않고 나갈까요?':'작성 중인 내용이 있습니다. 저장하지 않고 나갈까요?'))return;
      st=null;EDIT=null;opts.onClose();}
    else if(a==='save')save();
  });
  // Ctrl + 1 : 모든 영역 접기
  document.addEventListener('keydown',e=>{if(root.hidden||!st||!e.ctrlKey||e.altKey||e.shiftKey||e.code!=='Digit1')return;e.preventDefault();foldAll();});
}

/* 목록의 코너 유형 · 코너 형태 · 표시 방식 : 등록한 코너는 spec 그대로, 기존 코너는 FO 렌더러(ui)에 가까운 표시 방식으로 맞춘다 */
const UI2V={pinfo:'base',info:'base',ai:'pcard',color:'chip',list:'tlist',card:'radio',grid:'thumb',hscroll:'compare',chip:'chip',radio:'tlist',form:'basic',sum:'table',terms:'terms',done:'done'};
export function specOf(c){
  if(c.spec)return {type:c.spec.type,form:c.spec.form,mode:c.spec.mode};
  const k=c.ui==='card'&&c.sel==='복수 선택'?'check':UI2V[c.ui];
  for(const t of TYPES)for(const l of t.ls)for(const v of l.vs)if(v.k===k)return {type:t.n,form:l.n,mode:v.n};
  return null;
}
/* ===== 기존 코너 → 등록 상태(st) =====
   이 화면에서 저장한 코너는 저장해 둔 등록 상태(form)를 그대로 쓰고, 처음부터 있던 코너는 FO 렌더러 값(ui · q · opts …)에서 되살린다 */
function locate(k){for(const t of TYPES)for(const l of t.ls)for(const v of l.vs)if(v.k===k)return [t.k,l.k,v.k];return ['select','card','radio'];}
function stFromCorner(c){
  if(c.form)return JSON.parse(JSON.stringify(c.form));
  const p=locate(c.ui==='card'&&c.sel==='복수 선택'?'check':UI2V[c.ui]||'radio');
  const prev=st;st={name:c.n,use:c.use||'Y',type:p[0],layout:p[1],variant:p[2]};resetAttrs();resetContent();
  const os=(c.opts||[]).filter(o=>o.x!=='none'),none=(c.opts||[]).find(o=>o.x==='none'),cta=(c.ctas||[]).find(a=>a.on&&a.label);
  const flag=(k,y)=>{if(y&&mark(k)!=='-')st.attrs[k]='Y';};
  flag('title',c.q);flag('sub',c.sub);flag('tip',(c.it||'').indexOf('I')>-1);flag('none',none);flag('more',c.moreBtn);flag('cta',cta);
  flag('isub',os.some(o=>o.d));flag('price',os.some(o=>o.p));flag('badge',os.some(o=>o.b));flag('img',(c.it||'').indexOf('M')>-1);
  Object.assign(st.c,{title:c.q||'',sub:c.sub||'',none:none?none.n:st.c.none,more:c.moreBtn||st.c.more,cta:cta?cta.label:st.c.cta});
  st.items=os.map(o=>({ititle:o.n||'',isub:o.d||'',price:o.p||'',pcap:'',icap:'',badge:o.b||'',icon:'',btn:o.cl||'',label:o.n||'',value:o.d||'',input:o.d||'',help:'',img:'',state:'default'}));
  if(SINGLE.indexOf(vOf().fam)<0)st.cnt=[1,Math.max(st.cnt[1],st.items.length,1)];
  fitItems();
  const out=st;st=prev;return out;
}

/* ===== 상세(읽기 전용) : 등록 화면과 같은 영역 · 표 구성에 저장된 값만 글자로 보여준다 ===== */
const val=v=>String(v==null?'':v).trim()?'<span class="cc-val">'+esc(v)+'</span>':'<span class="cc-val none">-</span>';
function vAcc(id,title,body,aside,DF){   // 상세 화면 접기 상태는 주문 코너 관리(DF · data-dfold)가 관리한다
  return '<section class="cc-acc'+(DF[id]?' closed':'')+'"><header data-dfold="'+id+'"><b>'+title+'</b>'+(aside||'')
   +'<button type="button" class="cc-fold" aria-expanded="'+!DF[id]+'" aria-label="접기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></header>'
   +'<div class="cc-accb">'+body+'</div></section>';
}
function vCorner(id,title,keys,DF){
  const xs=CF.filter(x=>keys.indexOf(x[0])>-1&&mark(x[0])!=='-');if(!xs.length)return '';
  const on1=xs.filter(x=>on(x[0]));
  if(!on1.length)return '';   // 상세 : 노출하는 항목이 없으면 영역을 그리지 않는다 (수정 화면에서는 항상 보인다)
  const rows=on1.map(x=>tr(esc(ALAB[x[0]][1])+'<small>('+esc(ALAB[x[0]][2])+')</small>',val(st.c[x[0]]))).join('');
  return vAcc(id,title,'<div class="cc-tb">'+rows+'</div>',onCnt(keys),DF);
}
function vItem(it,i){
  const ps=IF.filter(x=>on(x[0])).map(x=>[x[1],it[x[0]]]);
  if(on('lv'))ps.push(['항목명',it.label],['값',it.value]);
  if(on('img'))ps.push(['이미지 경로',it.img]);
  if(on('state'))ps.push(['상태',(STATES.find(s=>s[0]===it.state)||STATES[0])[1]]);
  return '<div class="cc-it view"><span class="cc-ino">'+(i+1)+'</span>'
   +'<dl class="cc-ivs">'+ps.map(p=>'<div><dt>'+esc(p[0])+'</dt><dd>'+val(p[1])+'</dd></div>').join('')+'</dl>'+(isSel()&&st.def===i?'<span class="cc-dtag">기본</span>':'')+'</div>';   // 기본 뱃지는 줄 맨 오른쪽
}
function vItems(DF){
  const v=vOf();
  if(v.fam==='html')return vAcc('contents',ITEM_T,'<div class="cc-tb">'+tr('본문 HTML','<pre class="cc-html">'+esc(st.c.html)+'</pre>')+'</div>','',DF);
  if(!v.m.slice(11).replace(/-/g,'').length)return '';
  const ik=ATTRS.filter(a=>a[3]==='i'&&a[0]!=='var'&&a[0]!=='count'&&mark(a[0])!=='-').map(a=>a[0]);
  let h=tr('구성 요소','<div class="cc-chips">'+ik.filter(on).map(k=>'<span class="cc-chip on lock">'+esc(ALAB[k][1])+'</span>').join('')+'</div>');
  if(mark('var')!=='-')h+=tr('형태',val(st.vopt||(v.vars||['기본'])[0]));
  if(mark('count')!=='-')h+=tr('노출 개수 범위',val(st.cnt[0]+' ~ '+st.cnt[1]+'개'));
  return vAcc('contents',ITEM_T,'<div class="cc-tb">'+h+'</div><div class="cc-items">'+st.items.slice(0,st.cnt[1]).map(vItem).join('')+'</div>',onCnt(ik),DF);
}
/* 주문 코너 관리 상세에서 호출 : {form 오른쪽 영역, pv 미리보기} */
export function cornerView(c,DF){
  const prev=st;st=stFromCorner(c);
  const b=tr('코너 ID',val(c.id))+tr('코너명',val(st.name))+tr('사용 여부',val(st.use))+tr('코너 유형',val(tOf().n))+tr('코너 형태',val(lOf().n))+tr('표시 방식',val(vOf().n));
  const out={form:vAcc('basic','기본 정보','<div class="cc-tb">'+b+'</div>','',DF)+vCorner('header','코너 Header',HEAD,DF)+vItems(DF)+vCorner('footer','코너 Footer',FOOT,DF),pv:pvHTML()};
  st=prev;return out;
}

/* 주문 코너 관리에서 호출 : opts = {onClose, onSaved(corner), toast, setCrumb} */
let EDIT=null,ST0='';   // 수정 중인 코너와 처음 상태 (null이면 등록)
function openForm(o,title){
  opts=o;initFold();bind();
  $('pCreate').querySelector('.ph h1').textContent=title;
  $('pCreate').hidden=false;
  o.setCrumb(['홈','주문 관리','주문 코너 관리',title]);
  render();window.scrollTo(0,0);
}
export function openCornerCreate(o){EDIT=null;fresh();openForm(o,'주문 코너 등록');}
/* 수정 : 등록 화면을 저장된 값으로 채워 연다. 처음엔 모든 영역을 펼친다 */
export function openCornerEdit(c,o){
  EDIT=c;st=stFromCorner(c);ST0=JSON.stringify(st);
  openForm(o,'주문 코너 수정');
  Object.keys(fold).forEach(k=>{fold[k]=false;});render();
}
