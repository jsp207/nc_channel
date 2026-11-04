// @ts-nocheck
// 주문 코너 등록 (주문 코너 관리 v0.2.2 안에서 여는 등록 화면)
// 기준: FO 코너 유형 매트릭스(35개 배열 × 26개 속성). 유형은 고객 행동(선택 · 입력 · 확인) 3개로 줄이고, UI가 같거나 일부만 다른 배열은
// 하나의 '코너 형태'로 묶었다. 원래 배열은 '표시 방식'으로 남겨 속성 기본값을 그대로 가져온다. 35개 배열 → 3개 유형 · 12개 형태 · 35개 표시 방식
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
  L('card','카드 선택','카드 라디오형 · 카드 체크형 · 오퍼형을 묶었습니다. 카드 한 장에 타이틀, 설명, 가격이 들어가는 구조가 같고 선택 방식과 CTA 여부만 다릅니다.','select',[
   V('radio','단일 선택','카드 라디오형','ROOO--OO--- --ROOD-O-O---RV','card','card'),
   V('check','복수 선택','카드 체크형','ROOO--OO--- -ORRR-ROOO----V','check','card'),
   V('offer','오퍼','오퍼형','RO-------R- -RRRR-----O--O-','offer','card',{s:'reco'})]),
  L('thumb','이미지 카드','썸네일 카드형 · 상품 카드형 · 비교형을 묶었습니다. 이미지가 있는 카드를 2열로 나열하는 구조가 같습니다.','reco',[
   V('thumb','썸네일 카드','썸네일 카드형','RO-O------- -RRRR--O-O----V','thumb','grid'),
   V('pcard','상품 추천','상품 카드형','RO-----O-O- -RROR---------V','pcard','card'),
   V('compare','비교','비교형','RO--------- -OR-O-----R---V','compare','card')]),
  L('list','리스트 선택','텍스트 리스트형 · 검색 리스트형 · 필터 리스트형 · 약관 리스트형을 묶었습니다. 한 줄짜리 행을 나열하고 상단 도구(검색란, 탭)와 전체 동의만 다릅니다.','select',[
   V('tlist','텍스트 리스트','텍스트 리스트형','OO----O---- VOR----------OV','tlist','radio',{vars:['라디오','체크박스']}),
   V('search','검색 리스트','검색 리스트형','OO--OR-OR-O --RO----------V','slist','list',{s:'search'}),
   V('filter','필터 리스트','필터 리스트형','O---R--OR-- -ORO---O------V','slist','list',{s:'search'}),
   V('terms','약관 동의','약관 리스트형','O---------- V-RO-----O---RV','terms','terms',{s:'terms',vars:['전체 동의 사용','전체 동의 미사용']})]),
  L('simple','간단 선택','칩형 · 드롭다운형을 묶었습니다. 색상, 용량처럼 짧은 값을 고르고 펼침 방식만 다릅니다.','short',[
   V('chip','칩','칩형','RO--------- --R----------RV','chip','chip'),
   V('drop','드롭다운','드롭다운형','O---------- --R----------RV','drop','list')])]},
 {k:'input',n:'입력형',d:'고객이 값을 직접 입력하거나 등록합니다.',ls:[
  L('field','입력란','기본 입력란형 · 인증형 · 일정 선택형 · 조회 폼형을 묶었습니다. 입력란에 버튼, 도움말, 캘린더, 조회 버튼이 붙는지만 다릅니다.','input',[
   V('basic','기본 입력','기본 입력란형','OOO-------O V-R------O-RO-V','input','form',{vars:['텍스트','셀렉트','아이템']}),
   V('auth','인증','인증형','OO--------- --R------R-RROV','auth','form'),
   V('date','일정 선택','일정 선택형','R---------- --R--------RO--','date','form'),
   V('query','조회','조회 폼형','RO-------RO --R--------R--V','query','form')]),
  L('addr','주소 입력','주소형입니다. 주소 검색 버튼, 상세 주소 입력란, 등록된 주소 목록으로 구성합니다.','addr',[
   V('addr','주소','주소형','ROO-----O-- --R------ROR-O-','addr','form')]),
  L('reg','등록·첨부 리스트','등록 리스트형 · 첨부 리스트형을 묶었습니다. 항목마다 버튼(삭제, 파일 찾기)이 붙는 목록 구조가 같습니다.','input',[
   V('reg','등록 리스트','등록 리스트형','ROOO----R-- --R------RRO--V','reg','form'),
   V('file','파일 첨부','첨부 리스트형','R---------O --RR-----RR---V','file','form',{s:'file'})])]},
 {k:'info',n:'정보·안내형',d:'고객이 고르거나 입력하지 않고 내용을 확인만 합니다. 기존 정보 요약형 · 금액 확인형 · 결과 안내형 · 안내형을 합쳤습니다.',ls:[
  L('kv','항목·값 요약','테이블형 · 최종 금액형 · 정산 안내형을 묶었습니다. 항목명 : 값 행을 나열하고, 금액 방식은 마지막 행(합계)을 강조합니다.','summary',[
   V('table','테이블','테이블형','RO--------O ----O-----R---V','table','sum'),
   V('final','최종 금액','최종 금액형','R---------O ---OR---O-R---V','amount','sum',{s:'amount'}),
   V('settle','정산 안내','정산 안내형','RR--------O ----R---O-O----','amount','sum',{s:'amount'})]),
  L('prod','상품 정보','주문 상품형 · 상품 기본 정보형을 묶었습니다. 상품 대표 정보 아래 항목명 : 값을 붙이는 구조가 같습니다.','prod',[
   V('order','주문 상품','주문 상품형','R---------- -OR-R---R-O--R-','prod','sum'),
   V('base','상품 기본 정보','상품 기본 정보형','R---------O -RR-R---O-O----','prod','sum')]),
  L('ilist','안내 목록','텍스트형 · 아코디언형 · 스텝형 · 링크 리스트형 · 고객센터형 · 등록 내역형을 묶었습니다. 타이틀과 설명 행을 나열하고 표시 방식만 다릅니다.','guide',[
   V('bullet','불릿 텍스트','텍스트형','O---------- -O-R----------V','text','list'),
   V('accordion','아코디언','아코디언형','O---O------ --RR-----O----V','accordion','list'),
   V('step','스텝','스텝형','RO--O------ -ORR-----O----V','step','list'),
   V('link','링크','링크 리스트형','O---------- --RO----O-----V','link','list'),
   V('call','고객센터','고객센터형','R---------- --RO----RO----V','call','list'),
   V('hist','등록 내역','등록 내역형','R-------R-O --RO-----O-----','hist','list',{s:'hist'})]),
  L('result','결과 안내','완료형 · 진행형 · 결과 분기형을 묶었습니다. 아이콘 + 타이틀 + 설명 구조가 같고 아이콘과 버튼만 다릅니다.','result',[
   V('done','완료','완료형','---------O- -ORO----R-O----','result','done'),
   V('ing','진행 중','진행형','----------O --RR----R------','result','done'),
   V('branch','결과 분기','결과 분기형','---------O- VORR----R------','result','done',{vars:['성공','실패','보류']})]),
  L('media','배너·HTML','배너형 · html형을 묶었습니다. 이미지 한 장 또는 HTML 본문 하나만 노출합니다.','guide',[
   V('banner','배너','배너형','----------- -R------------V','banner','grid'),
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
function fresh(){st={name:'',desc:'',use:'Y',plat:{mo:true,pc:false},type:'select'};setType('select');}

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
function renderPv(){
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
  $('ccPv').innerHTML='<div class="pv'+(f==='result'?' ctr':'')+'">'+(h||'<p class="pv-sub">노출할 속성을 켜 주세요.</p>')+'</div>';
}

/* ===== 폼 ===== */
const req='<i class="cc-req">*</i>';
const tr=(th,td,cls)=>'<div class="cc-tr'+(cls?' '+cls:'')+'"><div class="cc-th">'+th+'</div><div class="cc-td">'+td+'</div></div>';
const radios=(name,list,val,dis)=>'<div class="cc-rg">'+list.map(x=>'<label class="'+(x[0]===val?'on':'')+(dis?' dis':'')+'"><input type="radio" name="'+name+'" value="'+esc(x[0])+'"'+(x[0]===val?' checked':'')+(dis?' disabled':'')+'>'+esc(x[1])+'</label>').join('')+'</div>';
const hint=t=>'<p class="cc-hint">'+t+'</p>';

function basicCard(){
  const t=tOf(),l=lOf();
  let h='<div class="cc-tr two"><div class="cc-th">코너 ID</div><div class="cc-td"><input class="cc-inp" placeholder="자동 채번" disabled></div>'
   +'<div class="cc-th">코너명'+req+'</div><div class="cc-td"><input class="cc-inp" data-f="name" maxlength="30" value="'+esc(st.name)+'" placeholder="코너명을 입력해 주세요"></div></div>';
  h+=tr('코너 유형'+req,radios('ccType',TYPES.map(x=>[x.k,x.n]),st.type)+hint(esc(t.d)));
  h+=tr('코너 형태'+req,radios('ccLayout',t.ls.map(x=>[x.k,x.n]),st.layout)+hint(esc(l.note)+' 표시 방식과 속성은 아래 코너 속성 정보에서, 상세 콘텐츠는 코너 콘텐츠에서 설정해 주세요.'));
  const pl=st.plat,all=pl.mo&&pl.pc,cb=(k,n,c)=>'<label class="'+(c?'on':'')+'"><input type="checkbox" data-plat="'+k+'"'+(c?' checked':'')+'>'+n+'</label>';
  h+='<div class="cc-tr two"><div class="cc-th">운영 플랫폼'+req+'</div><div class="cc-td"><div class="cc-rg">'+cb('all','전체',all)+cb('mo','모바일',pl.mo)+cb('pc','PC',pl.pc)+'</div></div><div class="cc-th">사용 여부'+req+'</div><div class="cc-td">'+radios('ccUse',[['Y','Y'],['N','N']],st.use)+'</div></div>';
  h+=tr('코너 설명','<textarea class="cc-ta" data-f="desc" maxlength="100" placeholder="100자 이내로 설명을 입력해 주세요">'+esc(st.desc)+'</textarea>');
  return '<section class="cc-card"><h2>코너 기본 정보</h2><div class="cc-tb">'+h+'</div></section>';
}
function attrRow(a){
  const k=a[0],m=mark(k);if(m==='-')return '';
  const lab=esc(a[1])+(m==='R'?req:'')+'<small>('+esc(a[2])+')</small>';
  if(k==='count')return tr(lab,'<div class="cc-cnt"><input class="cc-inp sm" type="number" min="1" max="20" data-cnt="0" value="'+st.cnt[0]+'"'+(SINGLE.indexOf(vOf().fam)>-1?' disabled':'')+'><span>-</span><input class="cc-inp sm" type="number" min="1" max="20" data-cnt="1" value="'+st.cnt[1]+'"'+(SINGLE.indexOf(vOf().fam)>-1?' disabled':'')+'><span>개</span></div>');
  if(k==='var'){const vs=vOf().vars||['기본'];return tr(lab,radios('ccVopt',vs.map(x=>[x,x]),st.vopt||vs[0]));}
  const dep=DEP[k],lock=m==='R'||(m==='D'&&!on(dep));
  const val=m==='R'?'Y':lock?'N':st.attrs[k];
  return tr(lab,'<div data-attr="'+k+'">'+radios('at_'+k,[['Y','Y'],['N','N']],val,lock)+'</div>'+(m==='D'?'<span class="cc-sub">'+(lock?'가격을 Y로 켜면 선택할 수 있어요':'가격에 종속된 속성')+'</span>':''));
}
function attrCard(){
  const c=ATTRS.filter(a=>a[3]==='c').map(attrRow).join(''),i=ATTRS.filter(a=>a[3]==='i').map(attrRow).join('');
  const l=lOf(),v=vOf();
  const mode=tr('표시 방식'+req,(l.vs.length>1?radios('ccVar',l.vs.map(x=>[x.k,x.n]),st.variant):'<b class="cc-one">'+esc(v.n)+'</b>')+hint('원본 배열: '+esc(v.src)+(l.vs.length>1?' · 표시 방식을 바꾸면 아래 속성 기본값이 이 배열 기준으로 다시 설정됩니다.':'')));
  return '<section class="cc-card"><h2>코너 속성 정보<span class="cc-legend">필수 항목은 Y로 고정 · 표시 방식에 없는 속성은 나오지 않습니다</span></h2>'
   +'<div class="cc-tb">'+mode+'</div>'
   +'<h3>코너(카드)<small>카드 전체에 1개 (타이틀 · 미선택 옵션 · 더보기 등)</small></h3><div class="cc-tb">'+(c||'<div class="cc-empty">이 배열은 코너 단위 속성이 없습니다.</div>')+'</div>'
   +'<h3>아이템(요소)<small>리스트에서 반복되는 요소 1개 (타이틀 · 서브 타이틀 · 가격 등)</small></h3><div class="cc-tb">'+(i||'<div class="cc-empty">이 배열은 아이템 속성이 없습니다.</div>')+'</div></section>';
}
const CF=[['title','코너 메인 타이틀',30],['sub','서브 타이틀',40],['tip','툴팁 문구',60],['link','우측 링크 문구',12],['tab','탭 · 필터 (쉼표로 구분)',60],['search','검색란 안내 문구',30],
  ['none','미선택 옵션 문구',20],['more','더보기 버튼 문구',20],['empty','빈 상태 문구',30],['cta','버튼 문구',12],['cap','하단 안내 문구',60]];
const IF=[['ititle','타이틀','w1'],['isub','서브 타이틀','w2'],['price','가격','w1'],['pcap','가격 캡션','w1'],['icap','캡션','w1'],['badge','배지','ws'],['btn','버튼 라벨','ws'],['input','입력 안내 문구','w2'],['help','도움말','w2']];
function contentCard(){
  const c=st.c,v=vOf();
  let ch=CF.filter(x=>on(x[0])).map(x=>tr(esc(x[1])+(mark(x[0])==='R'?req:''),'<div class="cc-cin"><input class="cc-inp" data-c="'+x[0]+'" maxlength="'+x[2]+'" value="'+esc(c[x[0]])+'"><span class="cc-len" id="len_'+x[0]+'">'+String(c[x[0]]).length+'/'+x[2]+'</span></div>')).join('');
  let ih='';
  if(v.fam==='html')ih=tr('본문 HTML'+req,'<textarea class="cc-ta tall" data-c="html">'+esc(c.html)+'</textarea>'+hint('본문은 HTML 에디터로 입력합니다. (에디터 연동은 개발 시 적용)'));
  else if(v.m.slice(11).replace(/-/g,'').length){
    const max=st.cnt[1],min=st.cnt[0];
    ih=st.items.map((it,i)=>{
      let f=IF.filter(x=>on(x[0])).map(x=>'<input class="cc-inp '+x[2]+'" data-it="'+i+'" data-k="'+x[0]+'" value="'+esc(it[x[0]])+'" placeholder="'+esc(x[1])+'" title="'+esc(x[1])+'">').join('');
      if(on('lv'))f+='<input class="cc-inp w1" data-it="'+i+'" data-k="label" value="'+esc(it.label)+'" placeholder="항목명" title="항목명"><input class="cc-inp w1" data-it="'+i+'" data-k="value" value="'+esc(it.value)+'" placeholder="값" title="값">';
      if(on('img'))f+='<input class="cc-inp w1" data-it="'+i+'" data-k="img" value="'+esc(it.img)+'" placeholder="이미지 경로" title="이미지 경로">';
      if(on('state'))f+='<select class="cc-sel" data-it="'+i+'" data-k="state" title="상태">'+STATES.map(s=>'<option value="'+s[0]+'"'+(it.state===s[0]?' selected':'')+'>'+s[1]+'</option>').join('')+'</select>';
      if(isSel())f+='<label class="cc-def'+(st.def===i?' on':'')+'"><input type="radio" name="ccDef" value="'+i+'"'+(st.def===i?' checked':'')+'>기본 선택</label>';
      const ctl='<span class="cc-mv"><button type="button" data-mv="'+i+':-1"'+(i?'':' disabled')+' aria-label="위로">↑</button><button type="button" data-mv="'+i+':1"'+(i<st.items.length-1?'':' disabled')+' aria-label="아래로">↓</button></span><button type="button" class="cc-xs" data-del="'+i+'"'+(st.items.length>min?'':' disabled')+'>삭제</button>';
      return tr('아이템 '+(i+1)+(i<min?req:''),'<div class="cc-item"><div class="cc-if">'+f+'</div>'+ctl+'</div>');}).join('')
     +tr('','<button type="button" class="cc-xs add" data-cc="add"'+(st.items.length<max?'':' disabled')+'>+ 아이템 추가</button>'+(st.items.length>=max?'<span class="cc-sub">노출 개수 범위 최대 '+max+'개에 도달했어요</span>':''));
  }
  return '<section class="cc-card"><h2>코너 콘텐츠</h2>'
   +(ch?'<h3>코너(카드)</h3><div class="cc-tb">'+ch+'</div>':'')
   +(ih?'<h3>아이템(요소)<small>노출 개수 범위 내에서 추가 ('+st.cnt[0]+' ~ '+st.cnt[1]+'개)</small></h3><div class="cc-tb">'+ih+'</div>':'')+'</section>';
}
function render(){$('ccForm').innerHTML=basicCard()+attrCard()+contentCard();renderPv();}

/* ===== 저장 : 주문 코너 관리 목록에 바로 추가 ===== */
function validate(){
  if(!st.name.trim())return '코너명을 입력해 주세요.';
  if(!st.plat.mo&&!st.plat.pc)return '운영 플랫폼을 하나 이상 선택해 주세요.';
  if(mark('title')==='R'&&!st.c.title.trim())return '코너 메인 타이틀을 입력해 주세요.';
  if(mark('cta')==='R'&&!st.c.cta.trim())return '버튼 문구를 입력해 주세요.';
  if(vOf().fam!=='html'&&vOf().m.slice(11).replace(/-/g,'').length){
    if(st.items.length<st.cnt[0])return '아이템을 '+st.cnt[0]+'개 이상 등록해 주세요.';
    if(on('ititle')&&mark('ititle')==='R'&&st.items.some(x=>!x.ititle.trim()))return '아이템 타이틀을 모두 입력해 주세요.';
  }
  return '';
}
function nextId(){let n=0;CORNERS.forEach(c=>{const m=c.id.match(/^CN-ORD-(\d+)$/);if(m)n=Math.max(n,+m[1]);});return 'CN-ORD-'+String(n+1).padStart(4,'0');}
function pad(n){return ('0'+n).slice(-2)}
function save(){
  const err=validate();if(err){opts.toast(err);return;}
  const v=vOf(),tpl=CORNERS.find(c=>c.ui===v.ui)||CORNERS[0],c=JSON.parse(JSON.stringify(tpl)),d=new Date();
  ['cat','subs','epcMode','more','chev','logo','link','btn','src','screens','note','qs','req'].forEach(k=>{delete c[k];});
  const its=v.fam==='html'?[]:st.items.slice(0,st.cnt[1]);
  c.id=nextId();c.n=st.name.trim();c.t='주문';c.ui=v.ui;c.q=on('title')?st.c.title:'';c.sub=on('sub')?st.c.sub:'';
  c.it='T'+(on('sub')?'S':'')+(on('tip')?'I':'')+(on('isub')||on('lv')?'D':'')+(on('price')?'P':'')+(on('badge')?'B':'')+(on('img')?'M':'')+(on('none')?'N':'')+(on('more')?'R':'');
  c.opts=its.map((x,i)=>({n:on('lv')&&!on('ititle')?x.label:x.ititle,d:on('lv')?x.value:on('input')?x.input:(on('isub')?x.isub:''),p:on('price')?x.price:'',b:on('badge')?x.badge:'',x:'',lk:false,k:c.id+'-'+i}));
  if(on('none'))c.opts.push({n:st.c.none,d:'',p:'',b:'',x:'none',lk:false,k:c.id+'-n'});
  c.moreBtn=on('more')?st.c.more:'';c.ctas=on('cta')?[{on:true,label:st.c.cta,link:''}]:[];c.ctaType=on('cta')?1:0;
  c.sel=v.k==='check'||st.vopt==='체크박스'?'복수 선택':'단일 선택';c.lim=Math.max(1,c.opts.length);c.ds='직접 입력';c.cond={mode:'none',list:[]};
  c.ver='v1.0';c.use=st.use;c.dt=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes());c.mby='김운영 (P031001)';
  // 등록 설정 원본 : 유형 · 형태 · 표시 방식 · 속성 ON/OFF · 노출 개수 · 플랫폼 · 설명
  c.spec={type:tOf().n,form:lOf().n,mode:v.n,src:v.src,attrs:Object.fromEntries(AK.filter(k=>mark(k)!=='-').map(k=>[k,k==='count'?st.cnt.join('~'):k==='var'?st.vopt:on(k)?'Y':'N'])),plat:st.plat,desc:st.desc};
  delete c.hist;
  CORNERS.unshift(c);
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
    if(t.dataset.plat){const k=t.dataset.plat;if(k==='all'){st.plat.mo=st.plat.pc=t.checked;}else st.plat[k]=t.checked;render();return;}
    if(t.name&&t.name.indexOf('at_')===0){const k=t.name.slice(3);st.attrs[k]=t.value;Object.keys(DEP).forEach(d=>{if(DEP[d]===k&&t.value==='N')st.attrs[d]='N';});render();return;}
    if(t.dataset.cnt!=null){let a=Math.max(1,Math.min(20,parseInt(t.value,10)||1));const i=+t.dataset.cnt;st.cnt[i]=a;if(st.cnt[0]>st.cnt[1]){if(i)st.cnt[0]=a;else st.cnt[1]=a;}fitItems();render();return;}
    if(t.dataset.it!=null&&t.tagName==='SELECT'){st.items[+t.dataset.it][t.dataset.k]=t.value;renderPv();}});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.mv){const p=b.dataset.mv.split(':'),i=+p[0],j=i+(+p[1]);const x=st.items.splice(i,1)[0];st.items.splice(j,0,x);if(st.def===i)st.def=j;else if(st.def===j)st.def=i;render();return;}
    if(b.dataset.del!=null){const i=+b.dataset.del;st.items.splice(i,1);if(st.def>=st.items.length)st.def=0;else if(st.def>i)st.def--;render();return;}
    const a=b.dataset.cc;
    if(a==='add'){st.items.push(sampleItems(st.items.length+1).pop());render();}
    else if(a==='reset'){const keep={name:st.name,desc:st.desc,use:st.use,plat:st.plat};setVariant(st.variant);resetContent();Object.assign(st,keep);render();opts.toast('속성과 콘텐츠를 이 배열의 기본값으로 되돌렸어요.');}
    else if(a==='cancel'){if(st&&(st.name||st.desc)&&!confirm('작성 중인 내용이 있습니다. 저장하지 않고 나갈까요?'))return;st=null;opts.onClose();}
    else if(a==='save')save();
  });
}

/* 주문 코너 관리에서 호출 : opts = {onClose, onSaved(corner), toast, setCrumb} */
export function openCornerCreate(o){
  opts=o;fresh();bind();
  $('pCreate').hidden=false;
  o.setCrumb(['홈','주문 관리','주문 코너 관리','주문 코너 등록']);
  render();window.scrollTo(0,0);
}
