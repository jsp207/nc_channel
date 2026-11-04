// @ts-nocheck
// 주문 코너 그룹 관리 v0.2.2: ref/order-corner-group-v22.html(목업)의 화면 로직을 옮겼다. 정책은 ref/order-corner-group-policy.html
// 목록(조회 · 사용 위치) · 상세(기본 정보 · 구성 코너 · 외부 의존 · 사용 위치, 운영/작업 버전 전환) · 등록/수정(드래그 순서, 타이틀 재정의, 노출, 최신 버전 적용) · 승인 요청 검증 · 변경/승인 이력 · 코너 추가 팝업
// 코너 원본은 주문 코너 관리와 같은 데이터(./order-corner-v22-data)를 쓴다. 코너 추가 팝업에는 주문 코너 관리 목록이 그대로 나온다
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import { CORNERS, PROCS, PKEYS, esc, pvCorner } from "./order-corner-v22-data";

requireAuthentication();
/* ================= 주문 코너 그룹 관리 v0.2.2 =================
   정책 기준: object_policy_summary, 주문 코너 그룹 관리 정책서(order-corner-group-policy.html)
   - 그룹은 코너를 복제하지 않고 [코너 ID + 참조 버전]으로 연결한다. 그룹 안 배치 ID는 별도
   - 그룹에서 바꿀 수 있는 값: 노출 순서, 타이틀 재정의, 노출 여부 (필수 코너는 숨김 불가)
   - 저장: 작업 버전(Draft) → 승인 → 신규 버전 발행. 사용 중인 프로세스는 기존 버전 유지
   - 사용 중인 그룹은 폐기 불가(프로세스 연결 해제 선행). 발행 이력이 없는 작업 버전만 삭제
*/
const $=id=>document.getElementById(id);
const clone=x=>JSON.parse(JSON.stringify(x));
const pad=n=>('0'+n).slice(-2);
function now(sec){const d=new Date(),s=sec?'.':'-';return d.getFullYear()+s+pad(d.getMonth()+1)+s+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+(sec?':'+pad(d.getSeconds()):'');}
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2400);}
const ME='김운영 (P031001)',APR='정지솔 (SSP12344)';

/* ===== 코너 원본 : 주문 코너 관리(src/order-corner-v22-data.ts)와 같은 데이터 =====
   코너 추가 목록, 구성 코너의 이름 · 최신 버전 · 사용 여부 · 필수 여부 · 노출 조건, 미리보기가 모두 여기서 온다 */
const C=id=>CORNERS.find(c=>c.id===id);
/* 코너 원본의 노출 조건 (주문 코너 관리 소유, 그룹에서 수정 불가) */
const condOf=c=>c&&c.cond&&c.cond.mode==='cond'?c.cond.list:[];
const PRODK=k=>PKEYS[k]?PKEYS[k].s:k;
/* 조건 상태 판정: in 그룹 내 충족 / ext 외부 의존 / ord 순서 오류 / hid 참조 코너 숨김 / prd 상품 정보 조건 */
function condRows(ms,i){const c=C(ms[i].cid);if(!c)return[];
  return condOf(c).map(x=>{if(x.kind==='product')return{x:x,st:'prd'};const j=ms.findIndex(y=>y.cid===x.key);return{x:x,st:j<0?'ext':j>i?'ord':!ms[j].show?'hid':'in'};});}
const CST={in:['tg-in','그룹 내 충족'],ext:['tg-ext','외부 의존'],ord:['tg-bad','순서 오류'],hid:['tg-bad','참조 코너 숨김'],prd:['tg-off','상품 정보']};
function condCell(ms,i){const r=condRows(ms,i);if(!r.length)return '<span class="faint">없음</span>';
  return '<div class="cnds">'+r.map(o=>{const x=o.x,lab=x.kind==='corner'?(C(x.key)||{n:x.key}).n:PRODK(x.key);
    return '<div class="cnd"><span class="cv2"'+(x.kind==='corner'?' title="'+x.key+'"':'')+'>'+esc(lab)+' = '+esc(x.values.join(', '))+'</span><span class="ctag2 '+CST[o.st][0]+'">'+CST[o.st][1]+'</span></div>';}).join('')+'</div>';}
function extDeps(ms){const out=[];ms.forEach((m,i)=>condRows(ms,i).forEach(o=>{if(o.st==='ext'&&!out.some(z=>z.key===o.x.key))out.push({key:o.x.key,by:C(m.cid).n});}));return out;}
function extNote(ms){const e=extDeps(ms);if(!e.length)return'';
  return '<div class="extd"><p><b>외부 의존 '+e.length+'건</b><span>아래 코너가 프로세스에서 이 그룹보다 앞에 있어야 합니다. 주문 프로세스 관리에서 그룹을 배치할 때 검증합니다.</span></p>'
   +e.map(z=>'<div><span class="mono">'+z.key+'</span>'+esc((C(z.key)||{n:''}).n)+'<span class="kd1">'+esc(z.by)+'의 노출 조건</span></div>').join('')+'</div>';}

/* ===== 주문 프로세스 (주문 코너 관리와 같은 프로세스 목록) ===== */
const PROC={};PROCS.forEach(p=>{PROC[p[0]]=[p[1],p[2]];});


/* ===== 코너 그룹 =====
   live : 운영 버전(발행됨). draft : 작업 버전 {ver, st(임시 저장|승인 대기|반려), data}
   member : {bid 배치 ID, cid 코너 ID, cv 참조 버전, show 노출, title 타이틀 재정의('' = 코너 기본값)} */
function prevVer(v){const p=v.slice(1).split('.');return +p[1]>0?'v'+p[0]+'.'+(+p[1]-1):v;}
/* 참조 버전은 코너 최신 버전으로 둔다. 'old'면 한 단계 이전 버전을 참조하는 예시 (최신 버전 적용 안내 확인용) */
const M=(cid,cv,show,title)=>{const c=C(cid),v=c?c.ver:'v1.0';return {cid:cid,cv:cv==='old'?prevVer(v):v,show:show!==false,title:title||''};};
let GROUPS=[
{id:'CG-ORD-0001',live:{ver:'v1.1',n:'요금제·할인 방법 묶음',desc:'요금제 선택 바로 다음에 할인 방법 선택을 이어서 노출',use:'Y',members:[M('CN-ORD-0005',''),M('CN-ORD-0084','')]},procs:[['TP-ORD-012','v1.1'],['TP-ORD-011','v1.1'],['TP-ORD-010','v1.0'],['TP-ORD-006','v1.0']],dt:'2026-10-30 14:20',mby:'김지훈 (P032210)'},
{id:'CG-ORD-0002',live:{ver:'v1.2',n:'가입 조건 선택',desc:'사용자, 가입 방식, 단말 납부 기간을 한 영역에서 받는다',use:'Y',members:[M('CN-ORD-0002',''),M('CN-ORD-0003','old'),M('CN-ORD-0004','')]},procs:[['TP-ORD-010','v1.2'],['TP-ORD-009','v1.2'],['TP-ORD-005','v1.1'],['TP-ORD-004','v1.1'],['TP-ORD-013','v1.2']],dt:'2026-10-29 10:05',mby:'이서연 (P031187)'},
{id:'CG-ORD-0003',live:{ver:'v1.0',n:'배송·개통 옵션',desc:'배송 방법과 SIM 유형을 연속 노출',use:'Y',members:[M('CN-ORD-0001','old'),M('CN-ORD-0006','')]},procs:[['TP-ORD-014','v1.0'],['TP-ORD-007','v1.0']],dt:'2026-10-21 16:40',mby:'박민서 (P034410)'},
{id:'CG-ORD-0004',live:{ver:'v1.0',n:'단말 혜택 선택',desc:'T 기프트, 티다팩, 바로 보상을 한 묶음으로 노출',use:'Y',members:[M('CN-ORD-0007','old'),M('CN-ORD-0008',''),M('CN-ORD-0009','')]},procs:[['TP-ORD-010','v1.0'],['TP-ORD-009','v1.0'],['TP-ORD-013','v1.0']],dt:'2026-11-03 15:20',mby:'이서연 (P031187)'},
{id:'CG-ORD-0005',live:{ver:'v1.0',n:'단말 부가 상품 선택',desc:'단말 보험과 부가서비스를 이어서 노출',use:'Y',members:[M('CN-ORD-0010',''),M('CN-ORD-0011','',true,'함께 쓰면 좋은 부가서비스')]},procs:[['TP-ORD-012','v1.0'],['TP-ORD-011','v1.0']],dt:'2026-10-18 11:10',mby:'김지훈 (P032210)'},
{id:'CG-ORD-0006',live:{ver:'v1.0',n:'주문 확인·약관 동의',desc:'최종 금액 확인 후 약관 동의를 노출',use:'Y',members:[M('CN-PAY-0006',''),M('CN-PAY-0020','')]},procs:[['TP-ORD-008','v1.0'],['TP-ORD-015','v1.0']],dt:'2026-11-02 11:00',mby:'박민서 (P034410)'},
{id:'CG-ORD-0007',disc:true,live:{ver:'v1.1',n:'구 배송 정보 묶음',desc:'배송 정보 입력과 통합 청구 (2026.09 주문서 개편 전)',use:'N',members:[M('CN-ORD-0049',''),M('CN-ORD-0071','')]},procs:[],dt:'2026-10-02 09:30',mby:'김지훈 (P032210)'},
{id:'CG-PAY-0001',live:{ver:'v1.2',n:'결제 정보 입력',desc:'요금 납부, 결제수단, 증빙 수단을 순서대로 노출',use:'Y',members:[M('CN-PAY-0004',''),M('CN-PAY-0032','old'),M('CN-PAY-0033','')]},procs:[['TP-ORD-012','v1.2'],['TP-ORD-011','v1.2'],['TP-ORD-010','v1.1'],['TP-ORD-009','v1.2'],['TP-ORD-008','v1.2'],['TP-ORD-014','v1.1']],dt:'2026-10-27 13:00',mby:'이서연 (P031187)'},
{id:'CG-PAY-0002',live:null,draft:{ver:'v1.0',st:'임시 저장',data:{n:'추가 할인 수단',desc:'제휴카드와 쿠폰·포인트 할인을 묶어 노출',use:'Y',members:[M('CN-PAY-0001',''),M('CN-PAY-0002','')]}},procs:[],dt:'2026-11-04 09:40',mby:'김운영 (P031001)'}
];
const G=id=>GROUPS.find(g=>g.id===id);
let BSEQ=1000;
const gData=g=>g.draft?g.draft.data:g.live;
const gStatus=g=>g.disc?'폐기':g.draft?g.draft.st:'운영중';
const ST={'운영중':'live','임시 저장':'tmp','승인 대기':'wt','반려':'no','폐기':'dc','승인 완료':'ok','요청 취소':'tmp'};
const stBadge=s=>'<span class="ap '+(ST[s]||'tmp')+'">'+s+'</span>';
function nextVer(v){const p=v.slice(1).split('.');return 'v'+p[0]+'.'+(+p[1]+1);}
function nextId(){let n=0;GROUPS.forEach(g=>{const m=g.id.match(/^CG-ORD-(\d+)$/);if(m)n=Math.max(n,+m[1]);});return 'CG-ORD-'+String(n+1).padStart(4,'0');}

/* 운영 버전 대비 변경 내용 */
function diff(a,b){
  const out=[];
  if(a.n!==b.n)out.push('그룹명');if(a.desc!==b.desc)out.push('설명');if(a.use!==b.use)out.push('사용 여부');
  const ai=a.members.map(m=>m.cid),bi=b.members.map(m=>m.cid);
  const add=bi.filter(x=>ai.indexOf(x)<0),del=ai.filter(x=>bi.indexOf(x)<0);
  if(add.length)out.push('코너 추가 '+add.length+'개');if(del.length)out.push('연결 해제 '+del.length+'개');
  if(bi.filter(x=>ai.indexOf(x)>-1).join()!==ai.filter(x=>bi.indexOf(x)>-1).join())out.push('노출 순서');
  let tt=0,ss=0,vv=0;
  b.members.forEach(m=>{const p=a.members.find(x=>x.cid===m.cid);if(!p)return;if(p.title!==m.title)tt++;if(p.show!==m.show)ss++;if(p.cv!==m.cv)vv++;});
  if(tt)out.push('타이틀 재정의 '+tt+'건');if(ss)out.push('노출 여부 '+ss+'건');if(vv)out.push('참조 버전 '+vv+'건');
  return out;
}

/* 시드 데이터 정리: 배치 ID, 작업 버전, 이력 */
GROUPS.forEach(g=>[g.live,g.draft&&g.draft.data].forEach(d=>{if(d)d.members.forEach(m=>{m.bid='BI-'+(++BSEQ);});}));
(function(){
  const g=G('CG-ORD-0004'),d=clone(g.live);delete d.ver;
  d.members[0].cv=C(d.members[0].cid).ver;d.members[0].title='사은품 하나를 골라 주세요';d.members.unshift(d.members.pop());
  g.draft={ver:'v1.1',st:'승인 대기',data:d,why:'T 기프트 최신 버전 반영, 바로 보상 우선 노출'};
  const h=G('CG-ORD-0006'),d2=clone(h.live);delete d2.ver;
  d2.members[0].title='결제할 금액을 확인해 주세요';
  h.draft={ver:'v1.1',st:'반려',data:d2,why:'최종 금액 타이틀 문구 변경',rej:'타이틀은 FO 문구 가이드 표현으로 맞춰 주세요'};
})();
function seedHist(g){
  const h=[],R=['김지훈 (P032210)','이서연 (P031187)','박민서 (P034410)'];
  if(g.live){const p=g.live.ver.slice(1).split('.').map(Number);
    for(let k=p[1],j=0;k>=0;k--,j++){const day=pad(28-j*5),first=k===0;
      h.push({st:'승인 완료',req:R[k%3],rqt:'2026.10.'+day+' 10:00:00',why:first?'코너 그룹 최초 등록':'구성 코너 조정',chg:first?'최초 등록':(k%2?'노출 순서, 타이틀 재정의 1건':'참조 버전 1건'),apr:APR,apt:'2026.10.'+day+' 16:30:00',ar:'',ver:'v'+p[0]+'.'+k});}}
  if(g.draft&&g.draft.st!=='임시 저장'){const rj=g.draft.st==='반려';
    h.unshift({st:g.draft.st,req:R[1],rqt:rj?'2026.11.01 17:10:00':'2026.11.03 15:20:00',why:g.draft.why,chg:diff(g.live,g.draft.data).join(', '),apr:APR,apt:rj?'2026.11.02 11:00:00':'',ar:g.draft.rej||'',ver:g.draft.ver});}
  if(g.disc)h.unshift({st:'폐기',req:R[0],rqt:'2026.10.02 09:30:00',why:'2026.09 주문서 개편으로 미사용',chg:'사용 여부 N',apr:'-',apt:'',ar:'',ver:g.live.ver});
  return h;
}
GROUPS.forEach(g=>{g.hist=seedHist(g);});

/* ===== FO 미리보기 : 주문 코너 관리 렌더러(pvCorner) 그대로 사용 ===== */
function pvHTML(d){
  if(!d.members.length)return '<div class="empty sm">구성 코너를 추가하면 FO 화면이 여기에 보입니다.</div>';
  return '<div class="grpv">'+d.members.map((m,i)=>{const c=C(m.cid);if(!c)return'';
    if(!m.show)return '<div class="pvh"><span>'+(i+1)+'. '+esc(c.n)+'</span><em>숨김</em></div>';
    const t=(m.title||'').trim();
    return '<div><p class="gl">'+(i+1)+'. '+esc(c.n)+(t?' · 타이틀 재정의':'')+'</p>'+pvCorner(Object.assign({},c,{q:t||c.q}))+'</div>';}).join('')+'</div>';
}

/* ===== 상태 ===== */
const F={use:'',st:'',key:'n',kw:'',page:1},PER=10;
let cur=null,mode='view',work=null,work0=null,tab='info',viewVer='work',pendingLeave=null,PK={t:'',kw:'',sel:{}};
const crumb=a=>{$('crumb').innerHTML=a.map(x=>'<span>'+x+'</span>').join('');};
const shownData=()=>mode!=='view'?work:(viewVer==='live'&&cur.live?cur.live:gData(cur));

/* ===== 목록 ===== */
function filtered(){
  return GROUPS.filter(g=>{const d=gData(g);
    if(F.use&&d.use!==F.use)return false;
    if(F.st&&gStatus(g)!==F.st)return false;
    if(F.kw){
      if(F.key==='n'&&d.n.toLowerCase().indexOf(F.kw)<0)return false;
      if(F.key==='i'&&g.id.toLowerCase().indexOf(F.kw)<0)return false;
      if(F.key==='c'&&!d.members.some(m=>{const c=C(m.cid);return (m.cid+' '+(c?c.n:'')).toLowerCase().indexOf(F.kw)>-1;}))return false;
    }
    return true;}).sort((a,b)=>a.dt<b.dt?1:-1);
}
function renderList(){
  const rows=filtered(),pages=Math.max(1,Math.ceil(rows.length/PER));
  if(F.page>pages)F.page=pages;
  const s=(F.page-1)*PER;
  $('rCnt').textContent=rows.length;
  $('vList').hidden=!rows.length;$('lEmpty').hidden=!!rows.length;
  $('lBody').innerHTML=rows.slice(s,s+PER).map((g,i)=>{const d=gData(g);
    return '<tr data-id="'+g.id+'"><td>'+(s+i+1)+'</td><td class="mono">'+g.id+'</td><td class="l"><b class="lnk">'+esc(d.n)+'</b><small class="q">'+esc(d.desc)+'</small></td>'
      +'<td class="l"><div class="cflow">'+d.members.map((m,k)=>{const c=C(m.cid);return (k?'<i>›</i>':'')+'<span'+(m.show?'':' class="off" title="숨김"')+'>'+esc(c?c.n:m.cid)+'</span>';}).join('')+'</div></td>'
      +'<td>'+(g.procs.length?'<span class="pc" data-use="'+g.id+'" title="사용 위치 보기">'+g.procs.length+'</span>':'<span class="faint">0</span>')+'</td>'
      +'<td class="vr">'+(g.live?g.live.ver:'-')+'</td><td>'+stBadge(gStatus(g))+(g.draft&&g.live?'<small class="q">작업 '+g.draft.ver+'</small>':'')+'</td>'
      +'<td>'+d.use+'</td><td class="dt">'+g.dt.slice(0,10)+'</td><td class="mb">'+esc(g.mby)+'</td></tr>';}).join('');
  let p='';for(let k=1;k<=pages;k++)p+='<button type="button" class="'+(k===F.page?'on':'')+'" data-g="'+k+'">'+k+'</button>';
  $('pager').innerHTML=p;
}
function goList(){
  mode='view';work=null;cur=null;
  $('pDetail').hidden=true;$('pList').hidden=false;
  crumb(['홈','주문 관리','주문 코너 그룹 관리']);renderList();window.scrollTo(0,0);
}

/* ===== 상세 / 등록 / 수정 ===== */
const kv=(k,v)=>'<div class="kv"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';
const card=(title,body,sub,act,id)=>'<div class="card"'+(id?' id="'+id+'"':'')+'><div class="card-h"><b>'+title+'</b>'+(act||(sub?'<span>'+sub+'</span>':''))+'</div><div class="card-b">'+body+'</div></div>';
const cname=c=>'<span class="cid">'+c.id+'</span><b class="cn">'+esc(c.n)+'</b>'+(c.req?'<span class="ctag2 tg-req">필수</span>':'')+(c.use==='N'?'<span class="ctag2 tg-off">미사용</span>':'');

function membersView(d){
  if(!d.members.length)return '<div class="empty sm">구성 코너가 없습니다.</div>';
  return '<table class="ot mt2"><thead><tr><th style="width:48px">순서</th><th style="width:84px">배치 ID</th><th>코너</th><th style="width:118px">참조 버전</th><th>타이틀</th><th style="width:64px">노출</th><th style="width:200px">노출 조건</th></tr></thead><tbody>'
   +d.members.map((m,i)=>{const c=C(m.cid)||{id:m.cid,n:m.cid,ver:m.cv,q:''};
     return '<tr><td>'+(i+1)+'</td><td class="mono">'+m.bid+'</td><td class="l"><a class="lc2" href="order-corner-v22.html" title="주문 코너 관리에서 보기">'+cname(c)+'</a></td>'
       +'<td>'+m.cv+(c.ver!==m.cv?'<span class="vnew">최신 '+c.ver+'</span>':'')+'</td>'
       +'<td class="l">'+(m.title?esc(m.title)+'<span class="ctag2 tg-ovr">재정의</span>':'<span class="faint">'+esc(c.q||'-')+'</span>')+'</td>'
       +'<td>'+(m.show?'Y':'<span class="ctag2 tg-off">숨김</span>')+'</td><td class="l">'+condCell(d.members,i)+'</td></tr>';}).join('')+'</tbody></table>'+extNote(d.members);
}
function usesCard(){
  const g=cur,sub='이 그룹을 참조하는 주문 프로세스';
  if(!g.procs.length)return card('사용 위치<em>0개 프로세스</em>','<div class="empty sm">이 그룹을 쓰는 주문 프로세스가 없습니다.</div>',sub,'','useBox');
  const latest=g.live?g.live.ver:'';
  return card('사용 위치<em>'+g.procs.length+'개 프로세스</em>','<div class="utw"><table class="ut"><thead><tr><th>프로세스 ID</th><th>구분</th><th>프로세스명</th><th>참조 버전</th><th>적용 상태</th></tr></thead><tbody>'
    +g.procs.map(p=>{const pr=PROC[p[0]];return '<tr><td class="mono">'+p[0]+'</td><td>'+pr[0]+'</td><td class="l">'+esc(pr[1])+'</td><td>'+p[1]+'</td><td>'+(p[1]===latest?'<span class="ap live">최신</span>':'<span class="ap wt">이전 버전</span>')+'</td></tr>';}).join('')
    +'</tbody></table></div><p class="hint">새 버전을 발행해도 프로세스는 지금 참조 중인 버전을 계속 씁니다. 새 버전 적용은 <a href="order5-create.html">주문 프로세스 관리</a>에서 프로세스별로 합니다.</p>',sub,'','useBox');
}
function viewCards(){
  const g=cur,d=shownData(),isDraft=!!g.draft&&d===g.draft.data;
  const verTxt=isDraft?g.draft.ver+' '+stBadge(g.draft.st)+(g.live?'<span class="kd1">운영 중 '+g.live.ver+'</span>':'<span class="kd1">발행 전</span>'):d.ver+' '+stBadge(g.disc?'폐기':'운영중');
  let b=kv('그룹명','<b>'+esc(d.n)+'</b>')+kv('그룹 ID','<span class="mono">'+g.id+'</span>')+kv('설명',d.desc?esc(d.desc):'<span class="faint">없음</span>')+kv('사용 여부',d.use)+kv('버전',verTxt)+kv('최종 수정',esc(g.dt)+'<span class="kd1">'+esc(g.mby)+'</span>');
  if(isDraft&&g.draft.st==='반려')b+=kv('반려 사유','<span class="rej">'+esc(g.draft.rej)+'</span>');
  return (g.disc?'<div class="ronote">ⓘ 폐기된 그룹입니다. 조회만 할 수 있고 새 프로세스에 연결할 수 없습니다.</div>':'')
    +card('기본 정보','<div class="kvs">'+b+'</div>')
    +card('구성 코너<em>'+d.members.length+'개</em>',membersView(d),'위에서부터 FO 노출 순서')
    +usesCard();
}
function membersEdit(w){
  return '<table class="ot mt2"><colgroup><col style="width:30px"><col style="width:44px"><col><col style="width:112px"><col style="width:24%"><col style="width:86px"><col style="width:196px"><col style="width:44px"></colgroup><thead><tr><th></th><th>순서</th><th>코너</th><th>참조 버전</th><th>타이틀 재정의</th><th>노출</th><th>노출 조건</th><th>해제</th></tr></thead><tbody id="mBody">'
   +w.members.map((m,i)=>{const c=C(m.cid)||{id:m.cid,n:m.cid,ver:m.cv,q:''};
     return '<tr class="er" data-i="'+i+'"><td><span class="hdl" title="드래그로 순서 변경">⋮⋮</span></td><td>'+(i+1)+'</td><td class="l">'+cname(c)+'</td>'
       +'<td>'+m.cv+(c.ver!==m.cv?'<button type="button" class="mini" data-latest="'+i+'" title="코너 최신 버전으로 참조 변경">'+c.ver+' 적용</button>':'')+'</td>'
       +'<td><input class="inp sm" data-mt="'+i+'" value="'+esc(m.title)+'" placeholder="'+esc(c.q||'')+'" maxlength="40"></td>'
       +'<td><select class="sel" data-ms="'+i+'"'+(c.req?' disabled title="필수 코너는 숨길 수 없습니다"':'')+'><option value="Y"'+(m.show?' selected':'')+'>노출</option><option value="N"'+(m.show?'':' selected')+'>숨김</option></select></td>'
       +'<td class="l">'+condCell(w.members,i)+'</td><td><button type="button" class="xbtn" data-mdel="'+i+'" aria-label="연결 해제" title="그룹에서 연결 해제">✕</button></td></tr>';}).join('')+'</tbody></table>';
}
function formCards(){
  const w=work,isC=mode==='create',nv=isC?'v1.0':(cur.draft?cur.draft.ver:nextVer(cur.live.ver));
  const b=kv('그룹명<i class="req">•</i>','<input class="inp" data-f="n" value="'+esc(w.n)+'" placeholder="그룹명을 입력하세요" maxlength="30">')
    +kv('그룹 ID',isC?'<span class="faint">저장 시 자동 생성</span>':'<span class="mono">'+cur.id+'</span>')
    +kv('설명','<input class="inp" data-f="desc" value="'+esc(w.desc)+'" placeholder="그룹 용도를 짧게 적어 주세요 (선택)" maxlength="60">')
    +kv('사용 여부','<div class="rgrp"><label><input type="radio" name="guse" value="Y"'+(w.use==='Y'?' checked':'')+'>Y</label><label><input type="radio" name="guse" value="N"'+(w.use==='N'?' checked':'')+'>N</label></div>')
    +kv('버전',(!isC&&cur.live?cur.live.ver+'<span class="sl"> → </span>'+nv+'<span class="kd1">승인 후 발행, 기존 버전은 보존</span>':nv+'<span class="kd1">승인 후 발행</span>'));
  const out=w.members.filter(m=>{const c=C(m.cid);return c&&c.ver!==m.cv;}).length;
  const act='<div class="cardh-act">'+(out?'<button type="button" class="obtn" data-act="latestAll">최신 버전 일괄 적용 ('+out+')</button>':'')+'<button type="button" class="obtn" data-act="pick">＋ 코너 추가</button></div>';
  const mem=w.members.length?membersEdit(w)+extNote(w.members):'<div class="infobox">구성 코너가 없습니다. [코너 추가]로 묶을 코너를 선택하세요.</div>';
  let h=card('기본 정보','<div class="kvs">'+b+'</div>')
    +card('구성 코너<em>'+w.members.length+'개</em>',mem+'<p class="hint">행을 드래그해 노출 순서를 바꿉니다. 타이틀 재정의와 노출 여부는 이 그룹에만 적용되고 코너 원본은 바뀌지 않습니다. 필수 코너와 다른 코너의 조건으로 쓰이는 코너는 숨길 수 없습니다. 노출 조건은 코너 원본 설정을 그대로 따르며, 조건을 쓰는 코너는 참조 대상 코너보다 뒤에 있어야 합니다. 코너 원본 수정은 <a href="order-corner-v22.html">주문 코너 관리</a>에서 합니다.</p>','',act);
  if(!isC&&cur.procs.length)h+='<div class="ronote">ⓘ 이 그룹을 쓰는 프로세스 '+cur.procs.length+'개는 저장, 승인 후에도 기존 버전을 그대로 씁니다. 새 버전 적용은 주문 프로세스 관리에서 합니다.</div>';
  return h;
}
function renderPv(){$('dPv').innerHTML=pvHTML(shownData());$('pvTag').textContent=mode==='view'?'FO 화면':'FO 화면 · 입력 내용 반영';}
function reForm(){$('dRight').innerHTML=formCards();renderPv();}
function renderHist(){
  const h=cur.hist;
  $('hBody').innerHTML=h.length?h.map((x,i)=>'<tr><td>'+(h.length-i)+'</td><td>'+stBadge(x.st)+'</td><td>'+esc(x.req)+'</td><td>'+x.rqt+'</td><td class="l">'+esc(x.why)+'</td><td class="l">'+esc(x.chg)+'</td><td>'+esc(x.apr||'-')+'</td><td>'+(x.apt||'-')+'</td><td class="l">'+(x.ar?esc(x.ar):'<span class="faint">-</span>')+'</td><td>'+(x.ver||'-')+'</td></tr>').join('')
    :'<tr><td colspan="10" class="faint" style="padding:30px">승인 요청 이력이 없습니다. 임시 저장은 이력에 남지 않습니다.</td></tr>';
}
function renderFoot(){
  let h='';
  if(mode!=='view')h='<button type="button" class="btn-list" data-act="cancel">취소</button><button type="button" class="btn-list" data-act="saveTmp">임시 저장</button><button type="button" class="btn-pri" data-act="submit">승인 요청</button>';
  else if(tab==='info'&&!cur.disc){
    if(gStatus(cur)==='승인 대기')h='<button type="button" class="btn-list" data-act="withdraw">요청 취소</button><button type="button" class="btn-list" data-act="reject">반려<span class="demo">시연</span></button><button type="button" class="btn-pri" data-act="approve">승인<span class="demo">시연</span></button>';
    else h=(cur.live?'<button type="button" class="btn-list" data-act="discard">폐기</button>':'<button type="button" class="btn-list" data-act="del">삭제</button>')+'<button type="button" class="btn-pri" data-act="edit">수정</button>';
  }
  $('fBtns').innerHTML=h;
}
function render(){
  const form=mode!=='view';
  $('pList').hidden=true;$('pDetail').hidden=false;
  if(mode==='create'){$('dName').textContent='코너 그룹 등록';$('dId').textContent='';$('dPills').innerHTML='';}
  else{$('dName').textContent=form?(work.n||'(그룹명 없음)'):shownData().n;$('dId').textContent=cur.id;$('dPills').innerHTML=stBadge(gStatus(cur))+(form?' <span class="pill p-pu">수정 중</span>':'');}
  $('dVer').innerHTML=(!form&&cur.live&&cur.draft)?'<div class="vbar"><div class="seg"><button type="button" data-act="vlive" class="'+(viewVer==='live'?'on':'')+'">운영 '+cur.live.ver+'</button><button type="button" data-act="vwork" class="'+(viewVer!=='live'?'on':'')+'">작업 '+cur.draft.ver+' · '+cur.draft.st+'</button></div><span>'+(viewVer==='live'?'지금 프로세스가 쓰는 버전입니다.':'승인 전 작업 버전입니다. 운영에는 반영되지 않았습니다.')+'</span></div>':'';
  $('dTabs').hidden=form;
  if(cur)$('hCnt').textContent=' '+cur.hist.length;
  document.querySelectorAll('#dTabs .dtab').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  const hist=!form&&tab==='hist';
  $('tInfo').hidden=hist;$('tHist').hidden=!hist;$('pDetail').classList.toggle('hist',hist);
  crumb(['홈','주문 관리','주문 코너 그룹 관리',mode==='create'?'코너 그룹 등록':mode==='edit'?'코너 그룹 수정':'코너 그룹 상세']);
  if(hist)renderHist();else{$('dRight').innerHTML=form?formCards():viewCards();renderPv();}
  renderFoot();
}
function openDetail(id,toUse){
  cur=G(id);mode='view';work=null;tab='info';viewVer='work';render();
  if(toUse)setTimeout(()=>{const b=$('useBox');if(b)b.scrollIntoView({behavior:'smooth'});},60);else window.scrollTo(0,0);
}
function startCreate(){cur=null;mode='create';work={n:'',desc:'',use:'Y',members:[]};work0=JSON.stringify(work);tab='info';render();window.scrollTo(0,0);}
function startEdit(){
  if(gStatus(cur)==='승인 대기'){toast('승인 대기 중에는 수정할 수 없습니다. 요청을 취소한 뒤 수정하세요.');return;}
  const d=clone(gData(cur));delete d.ver;work=d;work0=JSON.stringify(work);mode='edit';tab='info';render();window.scrollTo(0,0);
}
function leave(fn){
  if(mode!=='view'&&work&&JSON.stringify(work)!==work0){pendingLeave=fn;
    confirmBox('작성 중인 내용이 있습니다','<p class="mtxt">저장하지 않고 나가면 입력한 내용이 사라집니다. 임시 저장하면 운영에 반영되지 않은 상태로 보관됩니다.</p>','<button type="button" class="btn-list" data-act="mclose">계속 작성</button><button type="button" class="btn-pri" data-act="leaveOk">나가기</button>');}
  else fn();
}
function saveWork(st,why,chg){
  work.members.forEach(m=>{m.title=(m.title||'').trim();});work.n=work.n.trim();
  if(mode==='create'){cur={id:nextId(),live:null,draft:null,procs:[],hist:[]};GROUPS.push(cur);}
  const ver=cur.draft?cur.draft.ver:(cur.live?nextVer(cur.live.ver):'v1.0');
  cur.draft={ver:ver,st:st,data:clone(work)};cur.dt=now();cur.mby=ME;
  if(st==='승인 대기')cur.hist.unshift({st:st,req:ME,rqt:now(1),why:why,chg:chg.join(', '),apr:APR,apt:'',ar:'',ver:ver});
  mode='view';work=null;viewVer='work';tab='info';render();window.scrollTo(0,0);
}

/* 승인 요청 전 검증 (영향도 검증) */
function checks(w){
  const r=[],ms=w.members.map(m=>({m:m,c:C(m.cid)}));
  r.push({s:w.n.trim()?'ok':'bad',t:'그룹명 입력'});
  r.push({s:w.members.length>=2?'ok':'bad',t:'코너 2개 이상 구성',d:'현재 '+w.members.length+'개'});
  const ids=w.members.map(m=>m.cid);r.push({s:new Set(ids).size===ids.length?'ok':'bad',t:'같은 코너 중복 없음'});
  const off=ms.filter(x=>x.c&&x.c.use==='N');r.push({s:off.length?'bad':'ok',t:'사용 중지(N) 코너 미포함',d:off.length?off.map(x=>x.c.n).join(', ')+' 연결 해제 필요':''});
  const rq=ms.filter(x=>x.c&&x.c.req&&!x.m.show);r.push({s:rq.length?'bad':'ok',t:'필수 코너 노출 유지',d:rq.length?rq.map(x=>x.c.n).join(', '):''});
  r.push({s:w.members.some(m=>m.show)?'ok':'bad',t:'노출 코너 1개 이상'});
  let ord=[],hid=[];w.members.forEach((m,i)=>condRows(w.members,i).forEach(o=>{const n=C(m.cid).n;if(o.st==='ord')ord.push(n);if(o.st==='hid')hid.push(n);}));
  r.push({s:ord.length?'bad':'ok',t:'노출 조건 참조 순서 충족',d:ord.length?ord.join(', ')+'의 조건 대상 코너가 뒤에 있습니다.':''});
  r.push({s:hid.length?'bad':'ok',t:'노출 조건 참조 코너 노출 유지',d:hid.length?hid.join(', ')+'의 조건 대상 코너가 숨김 상태입니다.':''});
  const ex=extDeps(w.members);if(ex.length)r.push({s:'warn',t:'외부 의존 '+ex.length+'건',d:ex.map(z=>z.key+' '+C(z.key).n).join(', ')+' 코너가 프로세스에서 이 그룹보다 앞에 있어야 합니다.'});
  const old=ms.filter(x=>x.c&&x.c.ver!==x.m.cv);r.push({s:old.length?'warn':'ok',t:'코너 최신 버전 참조',d:old.length?old.map(x=>x.c.n+' '+x.m.cv+' → '+x.c.ver).join(', ')+' (이전 버전 그대로 요청 가능)':''});
  return r;
}
const changes=()=>cur&&cur.live?diff(cur.live,work):[];
function openSubmit(){
  work.members.forEach(m=>{m.title=(m.title||'').trim();});
  const ck=checks(work),chg=changes();
  if(cur&&cur.live&&!chg.length)ck.push({s:'bad',t:'운영 버전 대비 변경 사항',d:'운영 중인 '+cur.live.ver+'와 내용이 같습니다.'});
  const block=ck.some(x=>x.s==='bad'),ver=mode==='create'?'v1.0':(cur.draft?cur.draft.ver:nextVer(cur.live.ver)),pr=cur?cur.procs:[];
  const imp=pr.length?'이 그룹을 쓰는 프로세스 '+pr.length+'개는 승인 후에도 지금 참조 중인 버전을 그대로 씁니다. '+ver+' 적용은 주문 프로세스 관리에서 프로세스별로 선택합니다.':'이 그룹을 쓰는 프로세스가 없습니다. 승인되면 '+ver+'이 발행되고 주문 프로세스 관리에서 연결할 수 있습니다.';
  confirmBox('승인 요청 전 확인',
    '<p class="mh">검증 결과</p><ul class="cks">'+ck.map(x=>'<li class="'+x.s+'"><b>'+(x.s==='ok'?'✓':'!')+'</b><div>'+esc(x.t)+(x.d?'<small>'+esc(x.d)+'</small>':'')+'</div></li>').join('')+'</ul>'
    +'<p class="mh">변경 내용</p><p class="mtxt">'+esc(chg.length?chg.join(', '):'최초 등록')+'</p>'
    +'<p class="mh">영향 범위</p><p class="mtxt">'+imp+'</p>'
    +(block?'<p class="mtxt rej">빨간 항목을 고친 뒤 다시 요청하세요. 임시 저장은 지금도 할 수 있습니다.</p>':'<div class="rbar"><label for="sWhy">요청 사유<i>*</i></label><input class="inp" id="sWhy" maxlength="60" placeholder="승인 담당자가 볼 요청 사유를 입력하세요"></div>'),
    '<button type="button" class="btn-list" data-act="mclose">닫기</button>'+(block?'':'<button type="button" class="btn-pri" data-act="doSubmit">승인 요청</button>'));
  const w=$('sWhy');if(w)w.focus();
}

/* ===== 모달 ===== */
function openModal(html,sm){const m=$('mdl');m.className='mdl'+(sm?' sm':'');m.innerHTML=html;$('mdim').hidden=false;}
function closeModal(){$('mdim').hidden=true;$('mdl').innerHTML='';}
function confirmBox(t,body,btns){openModal('<div class="mdl-h"><h2>'+t+'</h2><button type="button" class="mdl-x" data-act="mclose" aria-label="닫기">✕</button></div><div class="mdl-b">'+body+'</div><div class="mdl-f">'+btns+'</div>',true);}

/* 코너 추가 팝업 */
function openPick(){
  PK={t:'',kw:'',sel:{}};
  openModal('<div class="mdl-h"><h2>코너 추가</h2><span>주문 코너 관리에 등록된 코너를 참조로 연결합니다</span><button type="button" class="mdl-x" data-act="mclose" aria-label="닫기">✕</button></div>'
    +'<div class="mdl-s"><div class="mrow"><label for="pT">코너 구분</label><select class="sel" id="pT"><option value="">전체</option><option>주문</option><option>결제</option><option>상품 연동</option></select></div>'
    +'<div class="mrow"><label for="pKw">검색어</label><input class="inp" id="pKw" placeholder="코너명 또는 코너 ID 입력"><span class="msp"></span><button type="button" class="sbtn" data-act="pReset">초기화</button><button type="button" class="sbtn pri" data-act="pSearch">조회</button></div></div>'
    +'<div class="mdl-r"><b>검색 결과</b><em id="pCnt">0</em><span>건</span></div>'
    +'<div class="mdl-t"><table class="et"><thead><tr><th style="width:44px"><input type="checkbox" id="pAll" aria-label="전체 선택"></th><th>코너 ID</th><th>코너명</th><th>구분</th><th>메인 타이틀</th><th>버전</th><th>사용 여부</th></tr></thead><tbody id="pBody"></tbody></table></div>'
    +'<div class="mdl-f"><button type="button" class="btn-list" data-act="mclose">취소</button><button type="button" class="btn-pri" data-act="pAdd" id="pAdd" disabled>추가하기</button></div>');
  renderPick();$('pKw').focus();
}
const pickRows=()=>CORNERS.filter(c=>(!PK.t||c.t===PK.t)&&(!PK.kw||(c.id+' '+c.n).toLowerCase().indexOf(PK.kw)>-1));
function inGroup(){const o={};work.members.forEach(m=>{o[m.cid]=1;});return o;}
function renderPick(){
  const inG=inGroup(),rows=pickRows();
  $('pCnt').textContent=rows.length;
  $('pBody').innerHTML=rows.length?rows.map(c=>{const dis=inG[c.id]||c.use==='N';
    return '<tr class="'+(dis?'dis':'')+'"><td><input type="checkbox" data-pid="'+c.id+'"'+(inG[c.id]?' checked disabled':c.use==='N'?' disabled':PK.sel[c.id]?' checked':'')+' aria-label="'+esc(c.n)+' 선택"></td><td class="mono">'+c.id+'</td><td>'+esc(c.n)+(c.req?'<span class="ctag2 tg-req">필수</span>':'')+(inG[c.id]?'<span class="kd1">추가됨</span>':'')+'</td><td>'+c.t+'</td><td>'+esc(c.q||'')+'</td><td>'+c.ver+'</td><td>'+(c.use==='Y'?'Y':'<span class="ctag2 tg-off">N · 추가 불가</span>')+'</td></tr>';}).join('')
    :'<tr><td colspan="7" class="faint" style="text-align:center;padding:30px">조회된 코너가 없습니다.</td></tr>';
  const n=Object.keys(PK.sel).length;$('pAdd').disabled=!n;$('pAdd').textContent=n?'추가하기 ('+n+')':'추가하기';
  const av=rows.filter(c=>!inG[c.id]&&c.use==='Y');$('pAll').checked=av.length>0&&av.every(c=>PK.sel[c.id]);
}

/* ===== 액션 ===== */
const ACT={
  create:startCreate,
  list:()=>leave(goList),
  cancel:()=>{if(mode==='create')leave(goList);else leave(()=>{mode='view';work=null;render();});},
  leaveOk:()=>{closeModal();const f=pendingLeave;pendingLeave=null;if(f)f();},
  edit:startEdit,
  tab:a=>{tab=a.dataset.t;render();},
  vlive:()=>{viewVer='live';render();},
  vwork:()=>{viewVer='work';render();},
  saveTmp:()=>{if(!work.n.trim()){toast('그룹명을 입력하세요.');return;}saveWork('임시 저장');toast('임시 저장했습니다. 운영 중인 버전에는 반영되지 않습니다.');},
  submit:openSubmit,
  doSubmit:()=>{const why=$('sWhy').value.trim();if(!why){toast('요청 사유를 입력하세요.');$('sWhy').focus();return;}const chg=changes();closeModal();saveWork('승인 대기',why,chg.length?chg:['최초 등록']);toast('승인을 요청했습니다.');},
  withdraw:()=>{cur.draft.st='임시 저장';const h=cur.hist.find(x=>x.st==='승인 대기');if(h){h.st='요청 취소';h.apt=now(1);}render();toast('승인 요청을 취소했습니다. 작업 버전은 임시 저장 상태로 남습니다.');},
  reject:()=>{const r='타이틀 문구 재검토 필요 (시연용 반려)';cur.draft.st='반려';cur.draft.rej=r;const h=cur.hist.find(x=>x.st==='승인 대기');if(h){h.st='반려';h.apt=now(1);h.ar=r;}render();toast('반려 처리했습니다. (시연)');},
  approve:()=>{const v=cur.draft.ver;cur.live=Object.assign({ver:v},clone(cur.draft.data));const h=cur.hist.find(x=>x.st==='승인 대기');if(h){h.st='승인 완료';h.apt=now(1);}cur.draft=null;viewVer='work';render();toast(v+' 발행 완료. 사용 중인 프로세스는 기존 버전을 유지합니다.');},
  discard:()=>{
    if(cur.procs.length){confirmBox('폐기할 수 없습니다','<p class="mtxt">이 그룹을 쓰는 주문 프로세스가 '+cur.procs.length+'개 있습니다. 주문 프로세스 관리에서 연결을 해제한 뒤 폐기하세요. 사용만 멈추려면 [수정]에서 사용 여부를 N으로 바꿉니다.</p><ul class="cks">'+cur.procs.map(p=>'<li class="warn"><b>!</b><div>'+p[0]+' '+esc(PROC[p[0]][1])+'<small>참조 버전 '+p[1]+'</small></div></li>').join('')+'</ul>','<button type="button" class="btn-pri" data-act="mclose">확인</button>');return;}
    confirmBox('그룹을 폐기할까요?','<p class="mtxt">폐기한 그룹은 새 프로세스에 연결할 수 없고 다시 쓸 수 없습니다. 발행된 버전과 이력은 그대로 남습니다.</p>','<button type="button" class="btn-list" data-act="mclose">취소</button><button type="button" class="btn-pri" data-act="doDiscard">폐기</button>');
  },
  doDiscard:()=>{cur.disc=true;cur.live.use='N';cur.draft=null;cur.dt=now();cur.mby=ME;cur.hist.unshift({st:'폐기',req:ME,rqt:now(1),why:'그룹 폐기',chg:'사용 여부 N',apr:'-',apt:'',ar:'',ver:cur.live.ver});closeModal();viewVer='work';render();toast('그룹을 폐기했습니다.');},
  del:()=>confirmBox('작업 버전을 삭제할까요?','<p class="mtxt">발행된 적 없는 그룹이라 바로 삭제됩니다. 삭제하면 되돌릴 수 없습니다.</p>','<button type="button" class="btn-list" data-act="mclose">취소</button><button type="button" class="btn-pri" data-act="doDel">삭제</button>'),
  doDel:()=>{GROUPS=GROUPS.filter(g=>g!==cur);closeModal();goList();toast('삭제했습니다.');},
  pick:openPick,
  pSearch:()=>{PK.t=$('pT').value;PK.kw=$('pKw').value.trim().toLowerCase();renderPick();},
  pReset:()=>{$('pT').value='';$('pKw').value='';PK.t='';PK.kw='';renderPick();},
  pAdd:()=>{let n=0;CORNERS.forEach(c=>{if(PK.sel[c.id]){work.members.push({bid:'BI-'+(++BSEQ),cid:c.id,cv:c.ver,show:true,title:''});n++;}});closeModal();reForm();toast('코너 '+n+'개를 추가했습니다.');},
  latestAll:()=>{work.members.forEach(m=>{const c=C(m.cid);if(c)m.cv=c.ver;});reForm();toast('모든 코너를 최신 버전 참조로 바꿨습니다.');},
  mclose:closeModal
};
document.addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(!a)return;const f=ACT[a.dataset.act];if(f){e.preventDefault();f(a);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('mdim').hidden)closeModal();});

/* 목록 검색 */
function readF(){const r=document.querySelector('input[name=fuse]:checked');F.use=r?r.value:'';F.st=$('fSt').value;F.key=$('fKey').value;F.kw=$('fKw').value.trim().toLowerCase();F.page=1;}
$('bSearch').onclick=()=>{readF();renderList();};
$('bReset').onclick=()=>{document.querySelector('input[name=fuse][value=""]').checked=true;$('fSt').value='';$('fKey').value='n';$('fKw').value='';$('bClr').hidden=true;readF();renderList();};
$('fKw').addEventListener('input',function(){$('bClr').hidden=!this.value;});
$('fKw').addEventListener('keydown',e=>{if(e.key==='Enter'){readF();renderList();}});
$('bClr').onclick=()=>{$('fKw').value='';$('bClr').hidden=true;$('fKw').focus();};
$('pager').addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(b){F.page=+b.dataset.g;renderList();}});
$('lBody').addEventListener('click',e=>{const u=e.target.closest('[data-use]');if(u){openDetail(u.dataset.use,true);return;}const tr=e.target.closest('tr[data-id]');if(tr)openDetail(tr.dataset.id);});
$('topTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tt]');if(b&&b.dataset.tt!=='상품')toast(b.dataset.tt+' 탭은 전시팀 목업에서 관리합니다. 통합 시 연결됩니다.');});

/* 등록/수정 입력 */
const dR=$('dRight');
dR.addEventListener('input',e=>{if(mode==='view')return;const t=e.target;
  if(t.dataset.f){work[t.dataset.f]=t.value;if(t.dataset.f==='n'&&mode==='edit')$('dName').textContent=t.value||'(그룹명 없음)';}
  else if(t.dataset.mt!=null){work.members[+t.dataset.mt].title=t.value;renderPv();}});
dR.addEventListener('change',e=>{if(mode==='view')return;const t=e.target;
  if(t.name==='guse')work.use=t.value;
  else if(t.dataset.ms!=null){work.members[+t.dataset.ms].show=t.value==='Y';reForm();}});
dR.addEventListener('click',e=>{if(mode==='view')return;
  const l=e.target.closest('[data-latest]');if(l){const m=work.members[+l.dataset.latest];m.cv=C(m.cid).ver;reForm();return;}
  const d=e.target.closest('[data-mdel]');if(d){const m=work.members.splice(+d.dataset.mdel,1)[0];const dep=work.members.filter(x=>{const c=C(x.cid);return c&&condOf(c).some(k=>k.kind==='corner'&&k.key===m.cid);});reForm();const nm=(C(m.cid)||{n:m.cid}).n;toast(dep.length?'「'+nm+'」 연결을 해제했습니다. '+dep.map(x=>C(x.cid).n).join(', ')+'의 조건은 외부 의존으로 바뀝니다.':'「'+nm+'」 연결을 해제했습니다. 코너 원본은 그대로입니다.');}});
/* 드래그 순서 변경 */
let dragI=-1;
dR.addEventListener('mousedown',e=>{const h=e.target.closest('.hdl');if(h)h.closest('tr').setAttribute('draggable','true');});
dR.addEventListener('mouseup',()=>{if(dragI<0)dR.querySelectorAll('tr[draggable]').forEach(x=>x.removeAttribute('draggable'));});
dR.addEventListener('dragstart',e=>{const tr=e.target.closest&&e.target.closest('tr.er');if(!tr)return;dragI=+tr.dataset.i;tr.classList.add('dragging');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(dragI));}catch(_){}});
dR.addEventListener('dragover',e=>{const tr=e.target.closest&&e.target.closest('tr.er');if(!tr||dragI<0)return;e.preventDefault();dR.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));tr.classList.add('drag-over');});
dR.addEventListener('drop',e=>{const tr=e.target.closest&&e.target.closest('tr.er');if(!tr||dragI<0)return;e.preventDefault();const to=+tr.dataset.i,m=work.members.splice(dragI,1)[0];work.members.splice(to,0,m);dragI=-1;reForm();});
dR.addEventListener('dragend',()=>{dragI=-1;dR.querySelectorAll('tr.er').forEach(x=>{x.classList.remove('dragging','drag-over');x.removeAttribute('draggable');});});
/* 코너 추가 팝업 입력 */
$('mdim').addEventListener('change',e=>{const t=e.target;
  if(t.dataset.pid){if(t.checked)PK.sel[t.dataset.pid]=1;else delete PK.sel[t.dataset.pid];renderPick();}
  else if(t.id==='pAll'){const inG=inGroup();pickRows().forEach(c=>{if(inG[c.id]||c.use==='N')return;if(t.checked)PK.sel[c.id]=1;else delete PK.sel[c.id];});renderPick();}});
$('mdim').addEventListener('keydown',e=>{if(e.target.id==='pKw'&&e.key==='Enter')ACT.pSearch();});
$('mdim').addEventListener('mousedown',e=>{if(e.target===$('mdim'))closeModal();});

crumb(['홈','주문 관리','주문 코너 그룹 관리']);
renderList();

