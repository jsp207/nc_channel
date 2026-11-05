// @ts-nocheck
// 주문 코너 유형 → 코너 형태 → 표시 방식 정의. 주문 코너 등록(order-corner-create-v22.ts) · 주문 코너 관리 목록 · 주문 코너 그룹 관리 코너 추가 팝업이 함께 쓴다.
// 화면 CSS를 끌어오지 않도록 등록 화면 모듈에서 분리했다

/* ===== 코너 유형 → 코너 형태 → 표시 방식 =====
   유형은 고객이 코너에서 하는 행동으로 나눈다 (고른다 · 입력한다 · 확인만 한다)
   형태는 UI 구조가 같거나 일부만 다른 원본 배열을 묶은 단위, 표시 방식은 원본 배열 그대로 (속성 기본값의 기준)
   V(키, 표시 방식명, 원본 배열명, 매트릭스(코너 11자 + 아이템 15자), 미리보기 형태, 기존 렌더러 ui, 추가 옵션 {vars 형태 선택지, s 예시 콘텐츠 키}) */
const V=(k,n,src,m,fam,ui,x)=>Object.assign({k,n,src,m:m.replace(/\s/g,''),fam,ui},x||{});
const L=(k,n,note,s,vs)=>({k,n,note,s,vs});
export const TYPES=[
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

/* 목록의 코너 유형 · 코너 형태 · 표시 방식 : 등록한 코너는 spec 그대로, 기존 코너는 FO 렌더러(ui)에 가까운 표시 방식으로 맞춘다 */
export const UI2V={pinfo:'base',info:'base',ai:'pcard',color:'chip',list:'tlist',card:'radio',grid:'thumb',hscroll:'compare',chip:'chip',radio:'tlist',form:'basic',sum:'table',terms:'terms',done:'done'};
export function specOf(c){
  if(c.spec)return {type:c.spec.type,form:c.spec.form,mode:c.spec.mode};
  const k=c.ui==='card'&&c.sel==='복수 선택'?'check':UI2V[c.ui];
  for(const t of TYPES)for(const l of t.ls)for(const v of l.vs)if(v.k===k)return {type:t.n,form:l.n,mode:v.n};
  return null;
}
