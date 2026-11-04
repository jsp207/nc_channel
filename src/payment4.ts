// @ts-nocheck
// 결제관리 v0.2.2: ref/payment-admin-prototype-0.2.2.html(11/3 최종 회의록 반영)을 옮겼다. 모든 데이터는 가상값이다.
// 화면마다 HTML이 따로 있고(PAGES), 상태는 sessionStorage로 이어 받는다. 다른 화면으로 가는 동작은 해당 HTML로 이동한다.
import "./admin-shell.css";
import "./payment2.css";
import "./payment4.css";
import "./list-unified.css";
import { requireAuthentication } from "./auth";

requireAuthentication();
/* =========================================================
   NOVA 결제관리 BO 프로토타입 v3 · MD v1.1 반영 (모든 데이터 가상)
   ========================================================= */
/* ================= 기준 상수 ================= */
const TODAY='2026-11-03', USER='pay_admin01';
/* PG사 기준값. 위클리(11/3): 채널이 PG사를 직접 등록하고, 인증키는 PG사 단위로 관리한다 */
const PGM0={
 'KG이니시스':{short:'이니시스',code:'INI',verify:'api',keys:[['signKey','SignKey (PC 웹표준)'],['hashKey','HashKey (모바일)'],['iniapiKey','INIAPI KEY'],['iniapiIv','INIAPI IV']],support:['신용카드','계좌이체','가상계좌','휴대폰결제','카카오페이','네이버페이'],ks:'확인완료',kAt:'2026-09-20 10:12',reg:'기본',dep:'(가상) KG이니시스 정산 · 신한은행 ***-***-1234',rec:'자동',use:'Y',regAt:'2026-01-01'},
 'NHN KCP':{short:'KCP',code:'KCP',verify:'manual',keys:[['siteKey','사이트 키']],support:['신용카드','계좌이체','가상계좌','SK Pay','카카오페이','네이버페이'],ks:'수동확인',kAt:'2026-10-29 16:40',reg:'기본',dep:'(가상) NHN KCP 정산 · 국민은행 ***-**-5678',rec:'수동',use:'Y',regAt:'2026-01-01'},
 '토스페이먼츠':{short:'토스',code:'TOS',verify:'api',keys:[['clientKey','클라이언트 키'],['secretKey','시크릿 키']],support:['신용카드','계좌이체','가상계좌','SK Pay','카카오페이','네이버페이'],ks:'확인완료',kAt:'2026-09-25 09:30',reg:'기본',dep:'(가상) 토스페이먼츠 정산 · 하나은행 ***-******-9012',rec:'자동',use:'Y',regAt:'2026-01-01'},
 '나이스페이':{short:'나이스',code:'NIC',verify:'api',keys:[['clientKey','클라이언트 키'],['secretKey','시크릿 키']],support:['신용카드','계좌이체','가상계좌','휴대폰결제'],ks:'미확인',kAt:'',reg:'채널 등록',dep:'',rec:'자동',use:'Y',regAt:'2026-10-31'}};
let PGM={},PGS=[];
/* 가맹점 용도 기준값 (위클리 11/3) */
const USES0=[['U01','이동전화 가입용','휴대폰 개통, 가입 결제'],['U02','PPS 충전용','PPS(선불폰) 요금 충전'],['U03','구독용','정기결제, 이용권'],['U04','단말 판매용','태블릿, 웨어러블 단말 판매'],['U05','액세서리 판매용','액세서리 일반·에스크로'],['U06','멤버십 커머스용','멤버십 상품, 기프티콘'],['U07','상품권 판매용','상품권 (현재 미사용)','N']];
/* 결제수단 체계: 결제유형-결제수단명. 신용카드·계좌이체·가상계좌·휴대폰결제는 일반결제의 세부수단 */
const METHODS=['간편결제-SK pay','간편결제-카카오페이','간편결제-네이버페이','간편결제-토스페이','일반결제-SK pay','일반결제-토스페이먼츠','일반결제-SK pay VAN'];
const GEN_SUBS=['신용카드','계좌이체','가상계좌','휴대폰결제'];
const GEN_OF={'KG이니시스':'일반결제-SK pay','NHN KCP':'일반결제-SK pay VAN','토스페이먼츠':'일반결제-토스페이먼츠','나이스페이':'일반결제-SK pay'};
const EASY_OF={'SK Pay':'간편결제-SK pay','카카오페이':'간편결제-카카오페이','네이버페이':'간편결제-네이버페이'};
const fixSub=x=>x==='SK Pay 머니'?'SK pay 머니':x;
const mapM=(m,pg)=>GEN_SUBS.includes(m)?GEN_OF[pg]:EASY_OF[m]||m;
const isGen=m=>String(m).startsWith('일반결제');
const SUBS={'간편결제-SK pay':['카드 간편결제','SK pay 머니'],'간편결제-카카오페이':['카드 간편결제','카카오페이 머니'],'간편결제-네이버페이':['카드 간편결제','네이버페이 머니/포인트'],'간편결제-토스페이':['카드 간편결제','토스머니'],'일반결제-SK pay':GEN_SUBS,'일반결제-토스페이먼츠':GEN_SUBS,'일반결제-SK pay VAN':['신용카드','계좌이체','가상계좌']};
const INST_OK=METHODS;
const SETTLE=['SKT','PS&M','M&S'];
const LINK0={'KG이니시스':{lt:'API',lc:'매일 07:00',lp:'(가상) INI 대사 조회 API'},'NHN KCP':{lt:'수동 파일',lc:'운영자 등록',lp:'PG 관리자 화면 다운로드 (CSV)'},'토스페이먼츠':{lt:'API',lc:'매일 07:00',lp:'(가상) 토스 정산·거래 조회 API'},'나이스페이':{lt:'SFTP',lc:'매일 06:30',lp:'(가상) sftp://recon.nicepay/T'}};
const vatTot=(c,fl)=>{const s=fl.reduce((a,b)=>a+b,0);if(!c||c.vat!=='별도')return s;return c.vatMode==='합산'?Math.round(s*1.1):fl.reduce((a,b)=>a+Math.round(b*1.1),0)};
const OWNERS=['T멤버십','TDS','T우주','T다이렉트샵'];
const CHANNELS=['통합 App','통합 Web','T-Gate','스마트플래너'];
const OPS=['사용','일시중지','미사용'];
const KEYST=['확인완료','수동확인','미확인','확인실패'];
const CATS={'커머스':['액세서리','멤버십커머스','기프티콘'],'단말':['휴대폰','태블릿'],'구독':['OTT','라이프스타일']};
const LV2S=Object.values(CATS).flat();
const lv1Of=l=>Object.keys(CATS).find(k=>CATS[k].includes(l))||'';
const JOIN=['신규가입','기기변경','번호이동'];
const PAYST=['결제완료','결과미확인','부분취소','승인취소','결제실패'];
const BSSST=['반영완료','반영대기','반영실패','불일치'];
const RECST=['일치','불일치','미수신'];
const CAUSES=['요율 적용 시점 차이','취소 수수료 처리','반올림 차이','VAT 포함 여부','청구 데이터 미수신','원인 확인 중'];

/* ================= 유틸 ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const won=n=>Math.round(n).toLocaleString('ko-KR');
const pad=(n,l=2)=>String(n).padStart(l,'0');
const ordM=(a,b)=>METHODS.indexOf(a)-METHODS.indexOf(b);
const addDays=(d,n)=>{const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)};
const diffDays=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/864e5);
function rng(s){let a=0;for(const c of s)a=(a*31+c.charCodeAt(0))|0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let CLOCK=new Date('2026-11-03T10:00:00');
function now(){CLOCK=new Date(CLOCK.getTime()+120000);return `${CLOCK.getFullYear()}-${pad(CLOCK.getMonth()+1)}-${pad(CLOCK.getDate())} ${pad(CLOCK.getHours())}:${pad(CLOCK.getMinutes())}`}
function get(p){return p.split('.').reduce((o,k)=>o==null?o:o[k],S)}
function set(p,v){const ks=p.split('.');let o=S;ks.slice(0,-1).forEach(k=>o=o[k]);o[ks[ks.length-1]]=v}
function opts(arr,v,all){return (all!=null?`<option value="">${esc(all)}</option>`:'')+arr.map(o=>{const [val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`}).join('')}
const mk=n=>S.marks?`<i class="mk">${n}</i>`:'';
const TONE={'사용':'ok','일시중지':'warn','미사용':'gray','유효':'ok','적용예정':'ac','적용 예정':'ac','만료':'gray','만료 임박':'warn','결제완료':'ok','결과미확인':'warn','취소':'bad','부분취소':'warn','결제실패':'gray','반영완료':'ok','반영대기':'ac','반영실패':'bad','일치':'ok','불일치':'bad','미수신':'warn','확인완료':'ok','수동확인':'ac','미확인':'warn','확인실패':'bad','적용중':'ok','이력':'gray','노출':'','미노출':'gray','MID 미사용':'bad','계약 없음':'bad','키 미확인':'warn','할부 불가':'gray','생성완료':'ok','생성실패':'bad','미전달':'gray','전달완료':'ac','수신확인':'ok','확정':'ac','제안':'','확인필요':'warn'};
const badge=(t,tone)=>`<span class="bdg ${tone??TONE[t]??''}">${esc(t)}</span>`;
function crumb(a){return `<nav class="crumb" aria-label="현재 위치">${a.map((c,i)=>i===a.length-1?`<b>${esc(c)}</b>`:esc(c)).join('<span aria-hidden="true">›</span>')}</nav>`}
function ph(title,right=''){return `<div class="ph"><h1 class="h1">${title}</h1><div class="ph-r">${right}</div></div>`}
function th(key,k,label,cls=''){const s=S.sort[key];const on=s&&s.k===k;return `<th class="sortable ${cls}" data-a="sort" data-key="${key}" data-k="${k}" aria-sort="${on?(s.d>0?'ascending':'descending'):'none'}">${label}<span class="sa">${on?(s.d>0?'▲':'▼'):'↕'}</span></th>`}
function sortRows(rows,key,g){const s=S.sort[key];if(!s||!g[s.k])return rows;const f=g[s.k];return [...rows].sort((a,b)=>{const x=f(a),y=f(b);return (x>y?1:x<y?-1:0)*s.d})}
function paginate(rows,key,size){const tot=Math.max(1,Math.ceil(rows.length/size));const cur=Math.min(S.page[key]||1,tot);
 let h='';if(tot>1){h=`<nav class="pager" aria-label="페이지"><button data-a="pg" data-key="${key}" data-p="${cur-1}" ${cur===1?'disabled':''} aria-label="이전">‹</button>`;for(let i=1;i<=tot;i++)h+=`<button class="${i===cur?'on':''}" data-a="pg" data-key="${key}" data-p="${i}" ${i===cur?'aria-current="page"':''}>${i}</button>`;h+=`<button data-a="pg" data-key="${key}" data-p="${cur+1}" ${cur===tot?'disabled':''} aria-label="다음">›</button></nav>`}
 return {rows:rows.slice((cur-1)*size,cur*size),html:h}}
function csv(name,head,rows,fname){const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;const t='﻿'+[head,...rows].map(r=>r.map(q).join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv;charset=utf-8'}));a.download=fname||`${name}_${TODAY.replace(/-/g,'')}.csv`;document.body.appendChild(a);a.click();a.remove();toast(`${name} 파일을 내려받았습니다. (${rows.length}건)`)}
/* 다른 화면으로 이동하는 중이면 이동한 화면에서 띄운다 */
function toast(msg,act){if(leaving){try{sessionStorage.setItem(TKEY,msg)}catch{}return}const r=$('#toast-root');r.innerHTML=`<div class="toast" role="status"><span>${esc(msg)}</span>${act?`<button class="lk" data-a="${act.a}" data-id="${act.id}">${esc(act.label)}</button>`:''}</div>`;clearTimeout(toast.t);toast.t=setTimeout(()=>r.innerHTML='',4500)}
function radios(path,arr,v,all,extra=''){return `<div class="ck-g rd">${(all!=null?[['',all]]:[]).concat(arr.map(a=>Array.isArray(a)?a:[a,a])).map(([val,l])=>`<label><input type="radio" name="${path}" value="${esc(val)}" data-b="${path}" ${extra} ${String(v)===String(val)?'checked':''}>${esc(l)}</label>`).join('')}</div>`}
function searchFt(rows){return `<table class="ft"><tbody>${rows.map(r=>`<tr>${r.map(([l,c,span])=>`<th>${l}</th><td ${span?`colspan="${span}"`:''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
const errBox=e=>e&&e.length?`<div class="call bad errbox" role="alert"><div><b>저장할 수 없습니다. 아래 항목을 확인하세요.</b><ul>${e.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>`:'';
const maskKey=k=>k?'••••••••'+String(k).slice(-4):'-';
const tag=t=>`<span class="ptag ${t==='확정'?'fx':t==='제안'?'pp':'ck'}">${t}</span>`;

/* ================= 목업 데이터 ================= */
/* 인증키는 PG사 단위. MID는 소속 PG의 키 상태를 그대로 읽는다 */
function withKey(m){const g=k=>()=>{const p=PGM[m.pg]||{};return {keyStatus:p.ks,keyAt:p.kAt,keyBy:p.kBy}[k]};['keyStatus','keyAt','keyBy'].forEach(k=>Object.defineProperty(m,k,{get:g(k),set(){},enumerable:false,configurable:true}));return m}
function seed(){
 PGM=clone(PGM0);PGS=Object.keys(PGM);
 PGS.forEach(k=>{const p=PGM[k];p.name=k;Object.assign(p,LINK0[k]||{lt:'API',lc:'매일 07:00',lp:''});p.vals=Object.fromEntries(p.keys.map(([kk],j)=>[kk,`${p.code.toLowerCase()}_${kk}_${'a7f3c9d2e1'.slice(j,j+4)}`]));p.kBy=p.kAt?USER:'';p.upd=(p.kAt||p.regAt+' 09:00')});
 const uses=USES0.map(([code,name,desc,use='Y'])=>({code,name,desc,use,upd:'2026-10-31 15:00'}));
 const M=(id,pg,mid,name,use,corp,settle,owner,chs,from,to,ops,upd='2026-09-24 14:12')=>withKey({id,pg,mid,name,use,corp,settle,owner,chs,from,to,ops,updatedAt:upd,by:USER});
 const mers=[
  M('MID-0001','KG이니시스','INIpayTM01','T멤버십 커머스','U06','에스케이텔레콤(주)','SKT','T멤버십',['통합 App','통합 Web'],'2026-01-01','2027-12-31','사용'),
  M('MID-0002','KG이니시스','INIpayTD02','TDS 태블릿','U04','에스케이피에스앤마케팅(주)','PS&M','TDS',['통합 App','통합 Web','T-Gate'],'2026-03-01','2028-02-29','사용','2026-09-11 10:40'),
  M('MID-0003','NHN KCP','KCPacc0301','TDS 액세서리','U05','에스케이피에스앤마케팅(주)','PS&M','TDS',['통합 App','통합 Web'],'2026-07-01','2027-06-30','사용','2026-10-29 16:40'),
  M('MID-0004','NHN KCP','KCPesc0302','TDS 액세서리 에스크로','U05','에스케이피에스앤마케팅(주)','PS&M','TDS',['통합 Web'],'2026-07-01','2027-06-30','일시중지','2026-09-30 09:12'),
  M('MID-0005','토스페이먼츠','tosstu0401','T우주 이용권','U03','에스케이엠앤서비스(주)','M&S','T우주',['통합 App','통합 Web'],'2026-02-01','','사용','2026-09-25 09:30'),
  M('MID-0006','토스페이먼츠','tosstd0402','TDS 휴대폰','U01','에스케이피에스앤마케팅(주)','PS&M','T다이렉트샵',['통합 App','통합 Web','스마트플래너'],'2026-02-01','','사용','2026-09-18 17:05'),
  M('MID-0007','KG이니시스','INIpayHP07','T멤버십 휴대폰결제','U02','에스케이텔레콤(주)','SKT','T멤버십',['통합 App'],'2026-01-01','2026-11-20','사용','2026-09-20 08:30'),
  M('MID-0009','NHN KCP','KCPacc0201','TDS 액세서리 (구 계약)','U05','에스케이피에스앤마케팅(주)','PS&M','TDS',['통합 Web'],'2025-07-01','2026-06-30','미사용','2026-07-01 09:00'),
  M('MID-0010','토스페이먼츠','tosstu0402','T우주 일반','U03','에스케이엠앤서비스(주)','M&S','T우주',['통합 App','통합 Web'],'2026-10-15','','사용','2026-10-30 11:20')
 ];
 mers.forEach(m=>{m.acct=(PGM0[m.pg].dep||'').includes(' · ')?'(가상) '+PGM0[m.pg].dep.split(' · ').pop():''});
 const F=(type,v,start,sub='')=>({sub,type,v,start});
 let n=0;const C=(mer,m,start,fees,subs=[],ops='사용')=>({id:'C-'+pad(++n,3),mer,m,subs,start,fees,ops,upd:mers.find(x=>x.id===mer).updatedAt});
 const ctrs=[
  C('MID-0001','신용카드','2026-01-01',[F('정률',1.5,'2026-01-01')]),C('MID-0001','계좌이체','2026-01-01',[F('정률',1.0,'2026-01-01')]),
  C('MID-0001','카카오페이','2026-01-01',[F('정률',2.2,'2026-01-01')],['카드 간편결제']),
  C('MID-0001','네이버페이','2026-01-01',[F('정률',2.2,'2026-01-01'),F('정률',1.5,'2026-01-01','네이버페이 머니/포인트')],['카드 간편결제','네이버페이 머니/포인트']),
  C('MID-0002','신용카드','2026-03-01',[F('정률',1.9,'2026-03-01')]),C('MID-0002','계좌이체','2026-03-01',[F('정률',1.2,'2026-03-01')]),C('MID-0002','가상계좌','2026-03-01',[F('정액',250,'2026-03-01')]),
  C('MID-0003','신용카드','2026-07-01',[F('정률',2.2,'2026-07-01'),F('정률',2.1,'2026-12-01')]),C('MID-0003','계좌이체','2026-07-01',[F('정률',1.5,'2026-07-01')]),
  C('MID-0003','SK Pay','2026-07-01',[F('정률',2.0,'2026-07-01')],['카드 간편결제']),
  C('MID-0004','가상계좌','2026-07-01',[F('정액',300,'2026-07-01')]),
  C('MID-0005','신용카드','2026-02-01',[F('정률',2.5,'2026-02-01')]),C('MID-0005','SK Pay','2026-02-01',[F('정률',2.2,'2026-02-01')],['카드 간편결제','SK Pay 머니']),
  C('MID-0005','카카오페이','2026-02-01',[F('정률',2.4,'2026-02-01')],['카드 간편결제']),C('MID-0005','네이버페이','2026-02-01',[F('정률',2.4,'2026-02-01')],['카드 간편결제']),
  C('MID-0006','신용카드','2026-02-01',[F('정률',1.8,'2026-02-01')]),C('MID-0006','계좌이체','2026-02-01',[F('정률',1.3,'2026-02-01')]),C('MID-0006','가상계좌','2026-02-01',[F('정액',200,'2026-02-01')]),
  C('MID-0006','SK Pay','2026-02-01',[F('정률',1.9,'2026-02-01')],['카드 간편결제']),
  C('MID-0007','휴대폰결제','2026-01-01',[F('정률',3.5,'2026-01-01')]),
  C('MID-0009','신용카드','2025-07-01',[F('정률',2.4,'2025-07-01')]),C('MID-0009','계좌이체','2025-07-01',[F('정률',1.9,'2025-07-01')]),
  C('MID-0010','신용카드','2026-11-15',[F('정률',2.5,'2026-11-15')]),C('MID-0010','네이버페이','2026-11-15',[F('정률',2.4,'2026-11-15'),F('정률',1.6,'2026-11-15','네이버페이 머니/포인트')],['카드 간편결제','네이버페이 머니/포인트'])
 ];
 const P=(id,name,lv2,ctn,st='판매중')=>({id,name,lv1:lv1Of(lv2),lv2,ctn,st});
 const prod=[
  P('P10001','갤럭시 Z 폴드8 보호필름(가상)','액세서리','TDS 액세서리'),P('P10002','갤럭시 버즈4 실리콘 케이스(가상)','액세서리','TDS 액세서리'),P('P10003','C타입 고속충전기 45W(가상)','액세서리','TDS 액세서리'),P('P10004','맥세이프 무선충전 패드(가상)','액세서리','TDS 액세서리'),
  P('P11001','VIP 영화 예매권(가상)','멤버십커머스','T멤버십'),P('P11002','베이커리 교환권 1만원(가상)','멤버십커머스','T멤버십'),P('P11003','편의점 5천원권(가상)','멤버십커머스','T멤버십'),
  P('P12001','치킨 기프티콘(가상)','기프티콘','T멤버십'),P('P12002','아메리카노 기프티콘(가상)','기프티콘','T멤버십'),
  P('P20001','갤럭시 Z 폴드8 512GB(가상)','휴대폰','T다이렉트샵 단말'),P('P20002','갤럭시 Z 플립8 256GB(가상)','휴대폰','T다이렉트샵 단말'),P('P20004','아이폰 17 256GB(가상)','휴대폰','T다이렉트샵 단말'),
  P('P21001','갤럭시 탭 S11 256GB(가상)','태블릿','T다이렉트샵 단말'),P('P21002','아이패드 에어 7세대(가상)','태블릿','T다이렉트샵 단말'),
  P('P30001','TVING+Wavve 스탠다드(가상)','OTT','T우주 이용권'),P('P30002','유튜브 프리미엄(가상)','OTT','T우주 이용권'),P('P30003','디즈니+ 스탠다드(가상)','OTT','T우주 이용권')
 ];
 /* 결제 코너: 외부 도메인(관리 주체 미정) Mock. 결제 BO는 읽기만 한다 */
 const I=(m,mer,on=true)=>({m,mer,on});
 const corners=[
  {id:'CN-001',ctn:'TDS 액세서리',name:'액세서리 결제',lv2s:[],pay:{one:true,inst:false},items:[I('신용카드','MID-0003'),I('계좌이체','MID-0003'),I('가상계좌','MID-0004'),I('SK Pay','MID-0003')],use:'Y'},
  {id:'CN-002',ctn:'T다이렉트샵 단말',name:'휴대폰 할부 결제',lv2s:['휴대폰'],pay:{one:false,inst:true},items:[I('신용카드','MID-0006'),I('SK Pay','MID-0006'),I('계좌이체','MID-0006'),I('가상계좌','MID-0006',false)],use:'Y'},
  {id:'CN-003',ctn:'T다이렉트샵 단말',name:'태블릿 결제',lv2s:['태블릿'],pay:{one:true,inst:true},items:[I('신용카드','MID-0002'),I('계좌이체','MID-0002'),I('가상계좌','MID-0002')],use:'Y'},
  {id:'CN-004',ctn:'T우주 이용권',name:'이용권 결제',lv2s:[],pay:{one:true,inst:false},items:[I('SK Pay','MID-0005'),I('신용카드','MID-0005'),I('카카오페이','MID-0005'),I('네이버페이','MID-0005')],use:'Y'},
  {id:'CN-005',ctn:'T우주 일반',name:'일반 상품 결제',lv2s:[],pay:{one:true,inst:false},items:[I('신용카드','MID-0010'),I('네이버페이','MID-0010')],use:'Y'},
  {id:'CN-006',ctn:'T멤버십',name:'멤버십 결제',lv2s:[],pay:{one:true,inst:false},items:[I('신용카드','MID-0001'),I('계좌이체','MID-0001'),I('카카오페이','MID-0001'),I('휴대폰결제','MID-0007')],use:'Y'}
 ];
 const hist=[
  {at:'2026-10-31 15:20',by:USER,tid:'나이스페이',tname:'PG사 / 나이스페이',area:'PG사',field:'PG사 등록 (채널)',before:'-',after:'나이스페이 (NIC) / 인증키 미확인'},
  {at:'2026-10-31 15:00',by:USER,tid:'U01',tname:'가맹점 용도',area:'가맹점 용도',field:'기준값 등록',before:'-',after:'U01~U07 7건'},
  {at:'2026-10-30 11:20',by:USER,tid:'MID-0010',tname:'토스페이먼츠 / tosstu0402',area:'가맹점',field:'MID 등록',before:'-',after:'T우주 일반 (구독용) / 일반결제-토스페이먼츠, 간편결제-네이버페이 (적용 2026-11-15~)'},
  {at:'2026-10-29 16:40',by:USER,tid:'MID-0003',tname:'NHN KCP / KCPacc0301',area:'수수료',field:'일반결제-SK pay VAN 신용카드 수수료 추가',before:'-',after:'정률 2.1% (2026-12-01~)'},
  {at:'2026-09-30 09:12',by:USER,tid:'MID-0004',tname:'NHN KCP / KCPesc0302',area:'가맹점',field:'운영상태',before:'사용',after:'일시중지 (사유: 에스크로 정산 점검)'},
  {at:'2026-07-01 09:00',by:USER,tid:'MID-0009',tname:'NHN KCP / KCPacc0201',area:'가맹점',field:'운영상태',before:'사용',after:'미사용 (KCPacc0301로 교체)'}
 ];
 const st={mers,ctrs,prod,corners,hist,uses,
  bill:{'2026-10':{'MID-0003|신용카드':12400,'MID-0005|신용카드':-3,'MID-0007|휴대폰결제':null,'MID-0006|SK Pay':5200},'2026-09':{'MID-0006|신용카드':5200}},
  cause:{'2026-10|MID-0003|신용카드':'취소 수수료 처리','2026-10|MID-0005|신용카드':'반올림 차이','2026-10|MID-0006|SK Pay':'VAT 포함 여부','2026-09|MID-0006|신용카드':'요율 적용 시점 차이'}};
 migrateMethods(st);
 st.promos=seedPromos();st.psync=seedPsync();
 st.pays=genPays(st);
 Object.assign(st,genDR(st));
 return st;
}
function migrateMethods(st){
 const pgOf=id=>st.mers.find(x=>x.id===id).pg;const out=[];
 st.ctrs.forEach(c=>{const nm=mapM(c.m,pgOf(c.mer));
  if(!GEN_SUBS.includes(c.m)){out.push({...c,m:nm,subs:c.subs.map(fixSub),fees:c.fees.map(f=>({...f,sub:fixSub(f.sub)}))});return}
  const ex=out.find(x=>x.mer===c.mer&&x.m===nm);
  if(!ex){out.push({...c,m:nm,subs:[c.m],fees:c.fees.map(f=>({...f}))});return}
  ex.subs.push(c.m);if(c.start<ex.start)ex.start=c.start;c.fees.filter(f=>!f.sub).forEach(f=>ex.fees.push({...f,sub:c.m}))});
 out.forEach(c=>{c.vat=['MID-0003','MID-0005','MID-0006'].includes(c.mer)?'별도':'포함';c.vatMode=c.mer==='MID-0005'?'합산':'건별';if(isGen(c.m))c.subs.sort((a,b)=>GEN_SUBS.indexOf(a)-GEN_SUBS.indexOf(b))});
 out.push({id:'C-'+pad(out.length+30,3),mer:'MID-0005',m:'간편결제-토스페이',subs:['카드 간편결제','토스머니'],start:'2026-09-01',fees:[{sub:'',type:'정률',v:2.3,start:'2026-09-01'}],ops:'사용',upd:'2026-08-28 10:00',vat:'별도',vatMode:'합산'});
 st.ctrs=out;
 st.corners.forEach(cn=>{const seen=new Set();cn.items=cn.items.map(it=>({...it,m:mapM(it.m,pgOf(it.mer))})).filter(it=>{const k=it.mer+'|'+it.m;if(seen.has(k))return false;seen.add(k);return true})});
 st.corners.find(cn=>cn.id==='CN-004').items.push({m:'간편결제-토스페이',mer:'MID-0005',on:true});
 const rk=k=>{const a=k.split('|');a[a.length-1]=mapM(a[a.length-1],pgOf(a[a.length-2]));return a.join('|')};
 Object.keys(st.bill).forEach(mon=>{const o={};Object.entries(st.bill[mon]).forEach(([k,v])=>o[rk(k)]=v);st.bill[mon]=o});
 const cs={};Object.entries(st.cause).forEach(([k,v])=>cs[rk(k)]=v);st.cause=cs;
 PGS.forEach(k=>{const p=PGM[k];const sp=new Set(p.support.map(m=>mapM(m,k)));if(k==='토스페이먼츠')sp.add('간편결제-토스페이');p.support=METHODS.filter(m=>sp.has(m))})}
const AMT={'액세서리':[9900,79000],'멤버십커머스':[5000,50000],'기프티콘':[3000,50000],'휴대폰':[890000,2100000],'태블릿':[450000,1300000],'OTT':[9900,19900]};
const MBR=['김*수','이*영','박*민','최*지','정*호','강*은','조*현','윤*아','한*진','서*우'];
function genPays(d){
 const r=rng('nova-pay-v4');const out=[];const live=d.prod;let seq=0;
 const mkPay=(p,cn,it,day,time,o={})=>{const m=d.mers.find(x=>x.id===it.mer);const [lo,hi]=AMT[p.lv2];const amt=o.amt||Math.round((lo+r()*(hi-lo))/100)*100;
  const x=r();const ct=d.ctrs.find(z=>z.mer===it.mer&&z.m===it.m);const st=o.st||(x<.8?'결제완료':x<.88?'승인취소':x<.93?'부분취소':'결제실패');const cancel=st==='승인취소'?amt:st==='부분취소'?Math.round(amt*(.2+r()*.4)/100)*100:0;
  const y=r();const bss=o.bss||(st==='결제실패'?'-':y<.012?'반영실패':y<.022?'불일치':'반영완료');++seq;const sub=o.sub||(ct&&ct.subs.length?(ct.subs.length>1&&seq%3===0?ct.subs[1+seq%(ct.subs.length-1)]:ct.subs[0]):'');const ymd=day.replace(/-/g,'').slice(2);
  return {no:`PY${ymd}${pad(seq,4)}`,ord:`OD${ymd}${pad(seq,4)}`,tid:`${PGM[m.pg].code}${ymd}${pad(seq,5)}`,uid:o.uid||`U${10000000+Math.floor(r()*89999999)}`,mbr:MBR[Math.floor(r()*MBR.length)],
   pid:p.id,ctn:p.ctn,cn:cn.id,mer:m.id,pg:m.pg,mid:m.mid,mname:m.name,method:it.m,sub,amt,cancel,at:`${day} ${time}`,st,
   refund:st==='승인취소'?'환불완료':st==='부분취소'?'부분환불':'-',bss,bssAmt:bss==='불일치'?Math.round((amt-cancel)*.9/100)*100:null,bssErr:bss==='반영실패'?'BSS 응답 시간 초과':'',
   appr:['결제실패','결과미확인'].includes(st)?'':String(100000+Math.floor(r()*899999)),failMsg:st==='결제실패'?['카드 한도 초과','잔액 부족','본인 인증 실패'][Math.floor(r()*3)]:'',
   inst:['신용카드','카드 간편결제'].includes(sub)&&amt>=300000?'12개월':'일시불',qres:o.qres||'',failOnce:!!o.failOnce,busy:'',logs:null}};
 const cornerFor=p=>d.corners.find(c=>c.use==='Y'&&c.ctn===p.ctn&&(!c.lv2s.length||c.lv2s.includes(p.lv2)));
 const usable=(cn,day)=>cn.items.filter(it=>{if(!it.on)return false;const c=d.ctrs.find(x=>x.mer===it.mer&&x.m===it.m);const m=d.mers.find(x=>x.id===it.mer);
  if(!c||c.start>day||m.id==='MID-0004'||m.from>day)return false;if(cn.pay.inst&&!cn.pay.one&&!INST_OK.includes(it.m))return false;return true});
 for(let i=0;i<620;i++){
  const p=live[Math.floor(r()*live.length)];const day=new Date(Date.UTC(2026,8,1+Math.floor(r()*63))).toISOString().slice(0,10);
  const cn=cornerFor(p);if(!cn)continue;const its=usable(cn,day);if(!its.length)continue;
  const w=its.map((x,k)=>k===0?4:1);let pick=r()*w.reduce((a,b)=>a+b,0),mi=0;while(mi<w.length-1&&pick>w[mi]){pick-=w[mi];mi++}
  out.push(mkPay(p,cn,its[mi],day,`${pad(8+Math.floor(r()*14))}:${pad(Math.floor(r()*60))}:${pad(Math.floor(r()*60))}`));
 }
 /* 번들(그룹 ID): 같은 묶음 구매로 함께 결제된 건 */
 out.forEach((x,i)=>x.grp='GR'+x.no.slice(2));const base=out.length;for(let i=0;i<base;i+=9){const a=out[i];if(a.st!=='결제완료')continue;const cn=d.corners.find(c=>c.id===a.cn);const it=cn.items.find(t=>t.mer===a.mer&&t.m===a.method);const alt=d.prod.filter(q=>q.ctn===a.ctn&&q.id!==a.pid);if(!alt.length)continue;const n=Math.min(alt.length,1+(i%2));for(let k=0;k<n;k++){const b=mkPay(alt[(i+k)%alt.length],cn,it,a.at.slice(0,10),a.at.slice(11,17)+pad((+a.at.slice(17,19)+3*(k+1))%60),{st:'결제완료',sub:a.sub});b.grp=a.grp;out.push(b)}}
 /* 시나리오용 고정 건 */
 const pU=d.prod.find(x=>x.id==='P30002'),cU=cornerFor(pU);
 out.push(mkPay(pU,cU,cU.items.find(i=>i.m==='일반결제-토스페이먼츠'),'2026-11-01','09:42:10',{sub:'신용카드',st:'결과미확인',bss:'반영대기',qres:'ok',amt:14900,uid:'U20261101'}));
 const pA=d.prod.find(x=>x.id==='P10003'),cA=cornerFor(pA);
 out.push(mkPay(pA,cA,cA.items.find(i=>i.m==='간편결제-SK pay'),'2026-11-01','08:15:33',{sub:'카드 간편결제',st:'결과미확인',bss:'반영대기',qres:'none',amt:29000}));
 const pD=d.prod.find(x=>x.id==='P20001'),cD=cornerFor(pD);
 out.push(mkPay(pD,cD,cD.items[0],'2026-10-31','21:05:02',{sub:'신용카드',st:'결제완료',bss:'반영실패',failOnce:true,amt:1890000}));
 out.forEach(x=>{if(!x.grp)x.grp='GR'+x.no.slice(2)});
 /* 그룹 ID는 화면에서 짧게 보이도록 G-0001 형식으로 다시 매긴다 (오래된 결제부터) */
 const gm={};[...out].sort((a,b)=>a.at.localeCompare(b.at)).forEach(x=>{x.grp=gm[x.grp]||(gm[x.grp]='G-'+pad(Object.keys(gm).length+1,4))});
 return out.sort((a,b)=>b.at.localeCompare(a.at));
}
/* ---------- 일대사 (위클리 11/3: 자동 Pass/Fail, 승인대사·입금대사 구분, 수동 PG 병행) ---------- */
function drApprove(d,pg,list,ft){const P=PGM[pg];
 const ours={cnt:list.length,amt:list.reduce((a,p)=>a+p.amt-p.cancel,0)};const fails=[];let pc=ours.cnt,pa=ours.amt;
 list.filter(p=>p.st==='결과미확인').forEach(p=>{if(p.qres==='ok')fails.push({no:p.no,tid:p.tid,type:'상태 불일치',ourSt:'결과미확인',pgSt:'승인',our:p.amt,pg:p.amt});else{fails.push({no:p.no,tid:p.tid,type:'우리에만 있음',ourSt:'결과미확인',pgSt:'내역 없음',our:p.amt,pg:0});pc--;pa-=p.amt}});
 const pk=list.find(p=>p.st==='결제완료');const f2=ft&&ft!=='pgOnly'&&!pk?'pgOnly':ft;
 if(f2==='pgOnly'){fails.push({no:'-',tid:`${P.code}${d.replace(/-/g,'').slice(2)}99001`,type:'PG에만 있음',ourSt:'내역 없음',pgSt:'승인',our:0,pg:12900});pc++;pa+=12900}
 if(f2==='ourOnly'){fails.push({no:pk.no,tid:pk.tid,type:'우리에만 있음',ourSt:pk.st,pgSt:'내역 없음',our:pk.amt,pg:0});pc--;pa-=pk.amt}
 if(f2==='amt'){fails.push({no:pk.no,tid:pk.tid,type:'금액 불일치',ourSt:pk.st,pgSt:'승인',our:pk.amt,pg:pk.amt-1000});pa-=1000}
 if(f2==='st'){fails.push({no:pk.no,tid:pk.tid,type:'상태 불일치',ourSt:pk.st,pgSt:'승인취소',our:pk.amt,pg:0});pa-=pk.amt}
 return {id:`AR-${d.replace(/-/g,'')}-${P.code}`,kind:'승인',date:d,pg,mode:P.rec,ours,pgv:{cnt:pc,amt:pa},st:fails.length?'Fail':'Pass',fails,ft,
  ranAt:`${addDays(d,1)} ${P.rec==='수동'?'14:20':'07:00'}`,by:P.rec==='수동'?'운영 담당 A':'시스템',file:P.rec==='수동'?`${P.code}_TX_${d.replace(/-/g,'')}.csv`:''}}
function feeOfP(ctrs,p){const c=ctrs.find(x=>x.mer===p.mer&&x.m===p.method);if(!c||p.at.slice(0,10)<c.start)return 0;const f=feeAt(c,p.at.slice(0,10),p.sub||'');if(!f)return 0;const b=netAmt(p);if(b<=0)return 0;return f.type==='정률'?Math.round(b*f.v/100):f.v}
function drDepJudge(r,act,at,by){r.act=act;r.ranAt=at;r.by=by;const diff=act-r.exp;
 r.fails=diff?[{type:act===0&&r.exp>0?'미입금':diff<0?'입금 부족':'입금 초과',desc:act===0&&r.exp>0?'정산 예정액이 입금되지 않았습니다.':`정산 예정액과 ${won(Math.abs(diff))}원 차이가 납니다.`,exp:r.exp,act,diff}]:[];r.st=diff?'Fail':'Pass';return r}
function drDeposit(td,pg,list,ft,ctrs){const P=PGM[pg];const dd=addDays(td,2);
 const ok=list.filter(p=>['결제완료','부분취소'].includes(p.st));const net=ok.reduce((a,p)=>a+netAmt(p),0);const G={};ok.forEach(p=>{const k=p.mer+'|'+p.method;(G[k]=G[k]||[]).push(feeOfP(ctrs,p))});const fee=Object.entries(G).reduce((a,[k,fl])=>{const [mm,me]=k.split('|');return a+vatTot(ctrs.find(x=>x.mer===mm&&x.m===me),fl)},0);
 const r={id:`DP-${dd.replace(/-/g,'')}-${P.code}`,kind:'입금',date:dd,td,pg,mode:P.rec,acct:P.dep,cnt:ok.length,net,fee,exp:net-fee,act:null,st:'입금대기',fails:[],ranAt:'',by:'',ft};
 if(dd>=TODAY)return r;
 if(P.rec==='수동'&&dd>='2026-10-31'){r.st='수집대기';return r}
 return drDepJudge(r,ft==='short'?r.exp-3180:ft==='none'?0:r.exp,`${addDays(dd,1)} 07:10`,'시스템')}
function genDR(st){
 const dr=[],dp=[];const FA={'2026-10-12|NHN KCP':'st','2026-10-17|KG이니시스':'pgOnly','2026-10-24|토스페이먼츠':'amt','2026-10-30|KG이니시스':'ourOnly'};const FD={'2026-10-22|토스페이먼츠':'short','2026-10-29|KG이니시스':'none'};
 for(let d='2026-10-01';d<=addDays(TODAY,-1);d=addDays(d,1))PGS.forEach(pg=>{if(!st.mers.some(m=>m.pg===pg))return;const P=PGM[pg];
  const list=st.pays.filter(p=>p.pg===pg&&p.at.startsWith(d)&&p.st!=='결제실패');
  const r=drApprove(d,pg,list,FA[`${d}|${pg}`]);if(P.rec==='수동'&&d>='2026-10-30')Object.assign(r,{st:'수집대기',pgv:null,fails:[],ranAt:'',by:'',file:''});dr.push(r);
  dp.push(drDeposit(d,pg,list,FD[`${addDays(d,2)}|${pg}`],st.ctrs))});
 return {dr,dp}}

/* ================= 도메인 ================= */
const mer=id=>S.mers.find(m=>m.id===id);
const ctr=id=>S.ctrs.find(c=>c.id===id);
const ctrOf=(merId,m)=>S.ctrs.find(c=>c.mer===merId&&c.m===m)||null;
const prod=id=>S.prod.find(p=>p.id===id);
const corner=id=>S.corners.find(c=>c.id===id);
const pay=no=>S.pays.find(p=>p.no===no);
const merLabel=m=>m?`${m.name} · ${m.mid}`:'-';
const merT=m=>`${m.pg} / ${m.mid}`;
const feeTxt=f=>f?(f.type==='정률'?`${Number(f.v)}%`:`${won(f.v)}원`):'-';
const periodSt=m=>m.to&&m.to<TODAY?'만료':m.from>TODAY?'적용예정':m.to&&diffDays(TODAY,m.to)<=30?'만료 임박':'유효';
const keyOk=m=>['확인완료','수동확인'].includes((PGM[m.pg]||{}).ks);
const useName=c=>(S.uses.find(u=>u.code===c)||{}).name||'-';
const merLive=m=>m.ops!=='미사용'&&periodSt(m)!=='만료';
function feeAt(c,d,sub=''){return c.fees.filter(f=>(f.sub||'')===sub&&f.start<=d).sort((a,b)=>b.start.localeCompare(a.start))[0]||(sub?feeAt(c,d,''):null)}
function feeState(fees,f){if(f.start>TODAY)return '적용예정';return fees.some(x=>x!==f&&(x.sub||'')===(f.sub||'')&&x.start>f.start&&x.start<=TODAY)?'이력':'적용중'}
const feeSum=fees=>[...fees].sort((a,b)=>(a.sub||'').localeCompare(b.sub||'')||a.start.localeCompare(b.start)).map(f=>`${f.sub||'기본'} ${f.type} ${feeTxt({...f,v:Number(f.v)})} (${f.start}~)`).join(', ');
/* 목록 · 조회조건의 상태는 사용 / 일시중지 / 적용 예정 / 미사용 4가지로만 보인다 (MID 미사용 → 미사용) */
const ctrSt2=c=>ctrSt(c)==='MID 미사용'?'미사용':ctrSt(c);
const ctrSt=c=>{const m=mer(c.mer);if(m.ops==='미사용'||periodSt(m)==='만료')return 'MID 미사용';if(c.start>TODAY)return '적용 예정';if(m.ops==='일시중지'||c.ops==='일시중지')return '일시중지';return '사용'};
const cornerRefs=(merId,m)=>S.corners.filter(cn=>cn.items.some(it=>it.mer===merId&&(!m||it.m===m)));
const netAmt=p=>p.st==='결제완료'?p.amt:p.st==='부분취소'?p.amt-p.cancel:0;
function payFee(p){const c=ctrOf(p.mer,p.method);if(!c)return null;const f=feeAt(c,p.at.slice(0,10),p.sub||'');if(!f)return null;const b=netAmt(p);if(b<=0)return 0;return f.type==='정률'?Math.round(b*f.v/100):f.v}
function addHist(rows){const at=now();rows.forEach(r=>S.hist.unshift({at,by:USER,...r}));return at}
/* 결제 코너 항목 상태 (외부 데이터 참조) */
const instOnly=cn=>cn.pay.inst&&!cn.pay.one;
function itemState(cn,it,mers=S.mers,ctrs=S.ctrs){
 const m=mers.find(x=>x.id===it.mer);const c=ctrs.find(x=>x.mer===it.mer&&x.m===it.m);
 if(!c)return {t:'계약 없음'};if(m.ops==='미사용'||(m.to&&m.to<TODAY))return {t:'MID 미사용'};if(c.start>TODAY||m.from>TODAY)return {t:'적용 예정'};
 if(instOnly(cn)&&!INST_OK.includes(it.m))return {t:'할부 불가'};if(!it.on)return {t:'미노출'};if(m.ops==='일시중지'||c.ops==='일시중지')return {t:'일시중지'};
 if(!keyOk(m))return {t:'키 미확인'};return {t:'노출',fo:true}}
function impactOf(mers,ctrs){const out=[];S.corners.filter(cn=>cn.use==='Y').forEach(cn=>cn.items.forEach((it,i)=>{const b=itemState(cn,it),a=itemState(cn,it,mers,ctrs);if(b.fo&&!a.fo)out.push({cn,it,i,to:a.t})}));return out}
function altFor(m,excl){return S.ctrs.filter(c=>c.m===m&&c.mer!==excl&&ctrSt(c)==='사용'&&keyOk(mer(c.mer))).map(c=>mer(c.mer))}
/* 결제 이력 */
function payLogs(p){if(p.logs)return p.logs;const L=[{at:p.at.slice(0,16),by:'시스템',t:'결제 요청',res:`${p.pg} 승인 요청 · ${won(p.amt)}원`}];
 if(p.st==='결과미확인')L.push({at:p.at.slice(0,16),by:'시스템',t:'PG 응답',res:'응답 시간 초과. 결과 미확인',bad:1});
 else if(p.st==='결제실패')L.push({at:p.at.slice(0,16),by:'시스템',t:'PG 승인 실패',res:p.failMsg,bad:1});
 else L.push({at:p.at.slice(0,16),by:'시스템',t:'PG 승인',res:`승인번호 ${p.appr}`});
 if(p.bss==='반영완료'&&p.st!=='결제실패')L.push({at:p.at.slice(0,16),by:'시스템',t:'BSS 반영',res:'반영완료'});
 if(p.bss==='반영실패')L.push({at:p.at.slice(0,16),by:'시스템',t:'BSS 반영',res:`실패 · ${p.bssErr}`,bad:1});
 if(p.bss==='불일치')L.push({at:p.at.slice(0,16),by:'시스템',t:'BSS 반영',res:`불일치 · BSS ${won(p.bssAmt)}원 / PG ${won(p.amt-p.cancel)}원`,bad:1});
 if(p.cancel)L.push({at:addDays(p.at.slice(0,10),1)+' 10:12',by:'운영 담당 A',t:p.st==='승인취소'?'전체 승인취소':'부분 승인취소',res:`PG 승인취소 성공 · ${won(p.cancel)}원`});
 p.logs=L;return L}
/* 금융수수료 */
function recon(mon){
 const g={};S.pays.forEach(p=>{if(!p.at.startsWith(mon)||!['결제완료','부분취소'].includes(p.st))return;const c=ctrOf(p.mer,p.method);if(!c||p.at.slice(0,10)<c.start)return;
  const key=`${p.mer}|${p.method}`;const r=g[key]||(g[key]={key,id:p.mer,m2:p.method,cnt:0,amt:0,exp:0,fl:[],pays:[]});const fee=payFee(p);r.cnt++;r.amt+=netAmt(p);r.exp+=fee||0;r.fl.push(fee||0);r.pays.push(p)});
 const bill=S.bill[mon]||{};
 return Object.values(g).map(r=>{const m=mer(r.id);const c=ctrOf(r.id,r.m2);r.base=r.exp;r.exp=vatTot(c,r.fl);const d=bill[r.key];const act=d===null?null:r.exp+(d||0);const diff=act==null?null:act-r.exp;
  const st=act==null?'미수신':diff===0?'일치':'불일치';
  const cause=act==null?'청구 데이터 미수신':diff===0?'':(S.cause[`${mon}|${r.key}`]||'원인 확인 중');
  return {...r,m,c,pg:m.pg,act,diff,st,cause,start:c.start,fee:feeAt(c,mon+'-28')}}).sort((a,b)=>PGS.indexOf(a.pg)-PGS.indexOf(b.pg)||a.id.localeCompare(b.id)||ordM(a.m2,b.m2))}

/* ================= 상태 ================= */
let S;
const emptyBf=()=>({pg:'',m:'',q:'',mid:'',ops:'',ch:'',owner:'',key:'',quick:'',use:'',from:'',to:''});
const emptyPf=()=>({from:'2026-10-01',to:TODAY,q:'',mOn:false,mu:'',mv:'',pg:'',mer:'',m:'',st:''});
const emptyGf=()=>({q:'',reg:'',ks:'',rec:'',use:'',m:''});
const emptyDf=()=>({from:'2026-10-01',to:'',pg:'',st:'',mode:''});
const emptyRf=()=>({mon:'2026-10',pg:'',settle:'',mer:'',m:'',st:'',diff:false});
function freshState(){
 return {route:'base',baseView:'list',merId:null,detTab:'info',merEdit:null,draft:null,formErr:[],
  bf:emptyBf(),bfA:{},sel:[],bulkOps:'',csel:[],psel:[],ctrId:null,ctrTab:'info',ctrSize:10,promoF:'',psBusy:false,
  pgView:'list',pgDraft:null,pgErr:[],
  payView:'list',payNo:null,pf:emptyPf(),pfA:null,
  gf:emptyGf(),gfA:emptyGf(),
  drTab:'승인',df:emptyDf(),dfA:null,
  rf:emptyRf(),rfA:null,
  sort:{},page:{},modal:null,marks:false,note:false,flash:[],...seed()};
}

Object.assign(TONE,{Pass:'ok',Fail:'bad','수집대기':'warn','입금대기':'gray','승인취소':'bad','자동':'','수동':'warn',Y:'ok',N:'gray','기본':'gray','채널 등록':'ac'});
/* ================= 렌더 ================= */
function setHTML(el,h){try{el.innerHTML=h}catch(e){setTimeout(()=>{el.innerHTML=h},0)}}
/* 화면 = HTML 파일. 지금 상태가 가리키는 화면이 이 파일이 아니면 상태를 저장하고 그 파일로 이동한다 */
const PAGES={base:'payment-method4.html',ctr:'payment-method4-detail.html',mer:'payment-method4-merchant.html',reg:'payment-method4-create.html',pgm:'payment-pg4.html',pgForm:'payment-pg4-form.html',pay:'payment-history4.html',payD:'payment-history4-detail.html',recon:'payment-recon4.html',fee:'payment-fee4.html',ia:'payment-policy4.html'};
const PAGE=document.body.dataset.page||'base';
const SKEY='nova-payment4-state-v2',NAVKEY='nova-payment4-nav',TKEY='nova-payment4-toast';
function viewKey(){const R=S.route;if(R==='base')return S.baseView==='detail'?'mer':S.baseView==='ctr'?'ctr':'base';if(R==='pgm')return S.pgView==='form'?'pgForm':'pgm';if(R==='pay')return S.payView==='detail'?'payD':'pay';return R}
function urlOf(k){const q=k==='ctr'?'?id='+S.ctrId:k==='mer'?'?id='+S.merId:k==='payD'?'?no='+S.payNo:k==='pgForm'&&S.pgDraft&&!S.pgDraft.isNew?'?pg='+encodeURIComponent(S.pgDraft.orig):'';return PAGES[k]+q}
/* 영향 안내 모달은 저장 함수를 들고 있어 넘기지 않는다. PG사 표(PGM)와 시각(CLOCK)은 S 밖에 있어 따로 싣는다 */
function saveState(){try{const {modal,...rest}=S;sessionStorage.setItem(SKEY,JSON.stringify({...rest,modal:modal&&modal.type!=='impact'?{...modal,busy:false}:null,_pgm:PGM,_pgs:PGS,_clock:CLOCK.getTime()}))}catch{}}
let leaving=false;
function navigate(k){leaving=true;saveState();try{sessionStorage.setItem(NAVKEY,PAGES[k])}catch{}location.href=urlOf(k)}
/* v0.2.1 상세처럼 4칸 정보 표는 라벨 칸 폭을 고정한다. 첫 행이 colspan이어도 아래 행의 세로줄이 맞는다 */
function ftCols(root){if(!document.body.classList.contains('p4d'))return;root.querySelectorAll('.ft').forEach(t=>{const n=Math.max(0,...[...t.rows].map(r=>[...r.cells].reduce((a,c)=>a+c.colSpan,0)));if(n===4)t.insertAdjacentHTML('afterbegin','<colgroup><col class="k"><col><col class="k"><col></colgroup>')})}
function render(){
 const k=viewKey();if(k!==PAGE){navigate(k);return}
 saveState();let h='';const R=S.route;
 if(R==='ia')h=vIA();
 else if(R==='reg')h=vReg();
 else if(R==='pgm')h=S.pgView==='form'?vPgForm():vPgm();
 else if(R==='base')h=S.baseView==='detail'?vMer():S.baseView==='ctr'?vCtr():vBase();
 else if(R==='pay')h=S.payView==='detail'?vPayD():vPay();
 else if(R==='recon')h=vRecon();
 else if(R==='fee')h=vFee();
 setHTML($('#view'),h);ftCols($('#view'));renderModal();
 if(S.flash.length){clearTimeout(render.t);render.t=setTimeout(()=>{S.flash=[]},2700)}
}
const CR=a=>crumb(['홈','결제 관리',...a]);

/* ---------- SCR-01 결제수단 기준정보 관리 ---------- */
/* ---------- 결제수단 프로모션 (PG·결제사 수신, 읽기 전용) ---------- */
const PROMO_SRC={'KG이니시스|일반결제-SK pay':'KG이니시스 카드사 무이자·할인 피드','NHN KCP|일반결제-SK pay VAN':'NHN KCP 카드사 무이자 피드','토스페이먼츠|일반결제-토스페이먼츠':'토스페이먼츠 카드사 프로모션 피드','*|간편결제-카카오페이':'카카오페이 프로모션 피드 (PG 경유)','*|간편결제-네이버페이':'네이버페이 프로모션 피드 (PG 경유)','*|간편결제-SK pay':'SK pay 프로모션 피드 (PG 경유)','*|간편결제-토스페이':'토스페이 프로모션 피드 (PG 경유)'};
const promoSrcKey=c=>{const m=mer(c.mer);return PROMO_SRC[`${m.pg}|${c.m}`]?`${m.pg}|${c.m}`:PROMO_SRC[`*|${c.m}`]?`*|${c.m}`:null};
const promoSt=p=>p.from>TODAY?'예정':p.to<TODAY?'종료':'진행중';
function promosOf(c){const m=mer(c.mer);if(ctrSt(c)==='MID 미사용')return [];return S.promos.filter(p=>p.m===c.m&&(p.pg==='*'||p.pg===m.pg)&&(p.scope==='all'||p.scope.includes(m.id))&&(!p.sub||c.subs.includes(p.sub)))}
const livePromos=c=>promosOf(c).filter(p=>promoSt(p)==='진행중');
function seedPromos(){
 const P=(id,pg,m,kind,target,benefit,cond,from,to,scope,rcv,sub='')=>({id,pg,m,kind,target,benefit,cond,from,to,scope,rcv,sub});
 return [
  P('PR-INI-2611-01','KG이니시스','신용카드','무이자 할부','신한카드(가상)','2~6개월 무이자','5만원 이상','2026-11-01','2026-11-30','all','신규'),
  P('PR-INI-2611-02','KG이니시스','신용카드','부분 무이자','KB국민카드(가상)','10개월 (1~3회차 고객 부담)','30만원 이상','2026-11-01','2026-11-30','all','신규'),
  P('PR-INI-2610-03','KG이니시스','신용카드','즉시할인','현대카드(가상)','5% 즉시할인 (최대 1만원)','3만원 이상','2026-10-01','2026-10-31',['MID-0001'],'종료'),
  P('PR-INI-2612-01','KG이니시스','신용카드','무이자 할부','삼성카드(가상)','2~3개월 무이자','5만원 이상','2026-12-01','2026-12-31','all','신규'),
  P('PR-KCP-2611-01','NHN KCP','신용카드','무이자 할부','롯데카드(가상)','2~5개월 무이자','5만원 이상','2026-11-01','2026-11-30','all','변경'),
  P('PR-TOS-2611-01','토스페이먼츠','신용카드','청구할인','하나카드(가상)','3천원 청구할인','2만원 이상','2026-10-15','2026-11-15',['MID-0005'],'유지'),
  P('PR-TOS-2611-02','토스페이먼츠','신용카드','무이자 할부','BC카드(가상)','2~6개월 무이자','5만원 이상','2026-11-01','2026-11-30','all','신규'),
  P('PR-KKO-2611-01','*','카카오페이','즉시할인','카카오페이 (전체)','첫 결제 1천원 즉시할인','1만원 이상','2026-11-01','2026-11-30','all','신규'),
  P('PR-KKO-2610-02','*','카카오페이','적립','카드 간편결제','결제금액 1% 포인트 적립','제한 없음','2026-10-01','2026-10-31','all','종료','카드 간편결제'),
  P('PR-NAV-2611-01','*','네이버페이','적립','네이버페이 머니/포인트','최대 3% 적립','1만원 이상','2026-11-01','2026-11-30','all','신규','네이버페이 머니/포인트'),
  P('PR-SKP-2611-01','*','SK Pay','즉시할인','SK pay 머니','2천원 즉시할인','2만원 이상','2026-11-01','2026-11-30','all','신규','SK pay 머니'),
  P('PR-TSP-2611-01','*','간편결제-토스페이','즉시할인','토스머니','첫 결제 3천원 즉시할인','1만원 이상','2026-11-01','2026-11-30','all','신규','토스머니')].map(p=>GEN_SUBS.includes(p.m)?{...p,m:GEN_OF[p.pg],sub:p.sub||p.m}:{...p,m:EASY_OF[p.m]||p.m,sub:fixSub(p.sub)}).map(p=>({...p,src:'PG 전문',fo:promoSt(p)==='종료'?'N':'Y'})).concat([{id:'PR-OWN-2611-01',pg:'토스페이먼츠',m:'일반결제-토스페이먼츠',kind:'안내',target:'T우주 구독 카드 결제',benefit:'첫 구독 카드 결제 시 이용권 1개월 추가',cond:'신규 구독',from:'2026-11-01',to:'2026-11-30',scope:['MID-0005'],rcv:'자체 등록',sub:'',src:'자체',fo:'Y'}]);
}
function seedPsync(){const o={};Object.keys(PROMO_SRC).forEach(k=>{o[k]={last:TODAY+' 06:00',next:addDays(TODAY,1)+' 06:00',res:k==='NHN KCP|일반결제-SK pay VAN'?'지연 후 성공':'성공',log:[{at:'2026-11-01 06:00',res:k==='NHN KCP|일반결제-SK pay VAN'?'1차 응답 지연, 06:05 재시도 성공':'성공'},{at:'2026-10-31 06:00',res:'성공'}]}});return o}

/* ---------- SCR-01 결제수단 기준정보 관리 (첨부 payment-method3 목록 구조) ---------- */
const QUICK=[['keybad','PG 키 미확인·확인실패'],['sched','적용 예정 요율 있음'],['exp','MID 만료 임박'],['promo','프로모션 진행중']];
function qTest(c,q){const m=mer(c.mer);if(!q)return true;if(q==='keybad')return !keyOk(m);if(q==='sched')return c.fees.some(f=>f.start>TODAY);if(q==='exp')return periodSt(m)==='만료 임박';if(q==='promo')return livePromos(c).length>0;if(q==='nocn')return !cornerRefs(m.id,c.m).length;return true}
function bfMatch(m){const f=S.bfA;const q=(f.q||'').trim().toLowerCase();const mq=(f.mid||'').trim().toLowerCase();
 return (!f.pg||m.pg===f.pg)&&(!mq||m.mid.toLowerCase().includes(mq))&&(!q||m.name.toLowerCase().includes(q))&&(!f.ch||m.chs.includes(f.ch))&&(!f.owner||m.owner===f.owner)&&(!f.key||m.keyStatus===f.key)&&(!f.use||m.use===f.use)&&(!f.from||!m.to||m.to>=f.from)&&(!f.to||m.from<=f.to)}
function ctrFilter(){const f=S.bfA;return S.ctrs.filter(c=>{const m=mer(c.mer);return bfMatch(m)&&(!f.m||c.m===f.m)&&(!f.ops||ctrSt2(c)===f.ops)&&qTest(c,f.quick)})
 .sort((a,b)=>{const x=mer(a.mer),y=mer(b.mer);return PGS.indexOf(x.pg)-PGS.indexOf(y.pg)||ordM(a.m,b.m)||x.mid.localeCompare(y.mid)})}
function merFilter(){const f=S.bfA;return S.mers.filter(m=>bfMatch(m)&&(!f.m||S.ctrs.some(c=>c.mer===m.id&&c.m===f.m))).sort((a,b)=>PGS.indexOf(a.pg)-PGS.indexOf(b.pg)||a.mid.localeCompare(b.mid))}
function feeCellC(c){const cur=feeAt(c,TODAY);const subs=c.fees.filter(f=>f.sub&&f.start<=TODAY&&feeState(c.fees,f)==='적용중');const nx=c.fees.find(f=>f.start>TODAY&&!f.sub&&cur);
 if(!cur){const f=[...c.fees].sort((a,b)=>a.start.localeCompare(b.start))[0];return f?`<span class="dim-t">${f.type} ${feeTxt(f)}</span><div class="sub">${f.start}부터 적용 예정</div>`:'<span style="color:var(--bad)">미등록</span>'}
 return `${cur.type} ${feeTxt(cur)}${subs.length?`<div class="sub">${subs.map(f=>`${f.sub} ${feeTxt(f)}`).join(', ')}</div>`:''}${nx?`<div class="sub" style="color:var(--ac)">변경 예정 ${feeTxt(nx)} (${nx.start}~)</div>`:''}<div class="sub">VAT ${c.vat}${c.vat==='별도'?' · '+c.vatMode:''}</div>`}
/* 목록 수수료: 오늘 요율과 VAT 기준만 한 줄로 */
function feeLine(c){const cur=feeAt(c,TODAY)||[...c.fees].sort((a,b)=>a.start.localeCompare(b.start))[0];return cur?`${cur.type} ${feeTxt(cur)} · VAT ${c.vat}`:'<span style="color:var(--bad)">미등록</span>'}
const lf=(l,c,cls='')=>`<span class="lf-g ${cls}"><label class="lf-l">${l}</label>${c}</span>`;
function vBase(){
 const f=S.bf;const rows=ctrFilter();const pg=paginate(rows,'ctr',S.ctrSize);const allOn=pg.rows.length&&pg.rows.every(c=>S.csel.includes(c.id));
 const filt=`<form class="lst-filter" autocomplete="off" onsubmit="return false">
  <div class="lf-row">${lf(mk('1')+'PG',`<select data-b="bf.pg">${opts(PGS,f.pg,'전체')}</select>`)}${lf('결제수단',`<select data-b="bf.m">${opts(METHODS,f.m,'전체')}</select>`)}${lf('운영상태',`<select data-b="bf.ops">${opts(['사용','일시중지','적용 예정','미사용'],f.ops,'전체')}</select>`)}${lf('PG 키검증',`<select data-b="bf.key">${opts(KEYST,f.key,'전체')}</select>`)}</div>
  <div class="lf-row">${lf('MID',`<input type="text" data-b="bf.mid" data-enter="bfSearch" value="${esc(f.mid)}" placeholder="MID 코드">`)}${lf('가맹점명',`<input type="text" data-b="bf.q" data-enter="bfSearch" value="${esc(f.q)}" placeholder="예) T우주">`)}${lf('채널',`<select data-b="bf.ch">${opts(CHANNELS,f.ch,'전체')}</select>`)}${lf('사업주체',`<select data-b="bf.owner">${opts(OWNERS,f.owner,'전체')}</select>`)}</div>
  <div class="lf-row">${lf('확인 항목',`<select data-b="bf.quick">${opts(QUICK,f.quick,'전체')}</select>`)}${lf('가맹점 용도',`<select data-b="bf.use">${opts(S.uses.map(u=>[u.code,u.name]),f.use,'전체')}</select>`)}${lf('적용기간',`<span class="lf-range"><input type="date" data-b="bf.from" value="${f.from}" aria-label="적용기간 시작"><span aria-hidden="true">~</span><input type="date" data-b="bf.to" value="${f.to}" aria-label="적용기간 종료"></span>`,'lf-wide')}<span class="lf-acts"><button type="button" class="btn dark" data-a="bfReset">초기화</button><button type="button" class="btn pri" data-a="bfSearch">조회</button></span></div></form>`;
 const bulk=S.csel.length?`<span class="bulkbox"><b>${S.csel.length}건 선택</b><select class="sel" data-b="bulkOps" data-r aria-label="일괄 변경할 운영상태"><option value="">운영상태 변경</option>${opts(['사용','일시중지'],S.bulkOps)}</select><button class="btn sm" data-a="bulkCtr" ${S.bulkOps?'':'disabled'}>적용</button><button class="lk" data-a="clearCsel">선택 해제</button></span>`:'';
 return `${CR(['결제수단 기준정보 관리'])}<h1 class="lst-title">결제수단 기준정보 관리</h1>${filt}
 <div class="pm3-bar">${mk('2')}<h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 ${S.ctrs.length}건</span></h2><div class="pm3-tools">${bulk}<button class="btn sm" data-a="histModal">변경이력</button><button class="btn sm" data-a="csvCtr">엑셀 다운로드</button><select class="sel" data-b="ctrSize" data-c="ctrSize" aria-label="페이지당 행 수">${opts([[10,'10개씩'],[20,'20개씩'],[50,'50개씩']],S.ctrSize)}</select></div></div>
 <div class="tw"><table class="tbl lst-table"><thead><tr><th class="ck"><input type="checkbox" data-a="cselAll" ${allOn?'checked':''} aria-label="현재 페이지 전체 선택"></th><th>PG사</th><th>결제수단</th><th class="l">MID</th><th class="l">가맹점명</th><th class="l">정산 주체</th><th class="l">수수료</th><th>인증키 검증</th><th>상태</th><th>프로모션</th><th>${mk('3')}관리</th></tr></thead><tbody>
 ${pg.rows.map(c=>{const m=mer(c.mer);const st=ctrSt(c);const refs=cornerRefs(m.id,c.m).length;const ps=periodSt(m);const lp=livePromos(c).length;const s=S.csel.includes(c.id);
  return `<tr class="click ${s?'sel':''} ${st==='MID 미사용'?'off':''} ${S.flash.includes(c.id)?'flash':''}" data-a="ctrDetail" data-id="${c.id}" tabindex="0"><td class="ck" data-a="noop"><input type="checkbox" data-a="cselOne" data-id="${c.id}" ${s?'checked':''} aria-label="${c.id} 선택"></td><td>${m.pg}</td>
  <td><button class="lk mlink" data-a="ctrDetail" data-id="${c.id}">${c.m}</button></td>
  <td class="l"><button class="lk mid" data-a="merDetail" data-id="${m.id}">${esc(m.mid)}</button></td><td class="l">${esc(m.name)}</td><td class="l" style="font-size:12.5px">${esc(m.settle)||'<span class="dim-t">-</span>'}</td>
  <td class="l num"><button class="lk" style="color:var(--ink);padding:0;text-align:left" data-a="feeModal" data-id="${c.id}">${feeLine(c)}</button></td><td>${badge(m.keyStatus)}</td><td>${badge(ctrSt2(c))}</td>
  <td>${lp?`<button class="lk" data-a="ctrDetail" data-id="${c.id}" data-tab="promo" title="진행중 프로모션">${lp}</button>`:'<span class="dim-t">-</span>'}</td>
  <td class="acts"><button class="lk" data-a="ctrDetail" data-id="${c.id}">상세</button><button class="lk" data-a="ctrModal" data-id="${c.id}">수정</button><button class="lk" data-a="feeModal" data-id="${c.id}">수수료</button></td></tr>`}).join('')||'<tr><td colspan="11" class="empty">조건에 맞는 결제수단이 없습니다. 조회 조건을 줄여 보세요.</td></tr>'}</tbody></table></div>
 <div class="lst-bottom">${pg.html}<div class="lst-foot">${mk('4')}<button class="btn pri lg" data-a="regNew">결제수단 등록</button></div></div>`}

/* ---------- SCR-02 결제수단 계약 상세 ---------- */
function vCtr(){
 const c=ctr(S.ctrId),m=mer(c.mer),st=ctrSt(c),refs=cornerRefs(m.id,c.m),pr=promosOf(c),src=promoSrcKey(c),cur=feeAt(c,TODAY);
 if(S.ctrTab==='promo'&&!pr.length)S.ctrTab='info';
 const T=[['info','MID 계약 정보'],['fee',`수수료 이력 ${c.fees.length}`],['promo',`연결 프로모션 ${pr.length}`,!pr.length],['hist','변경 이력']];
 if(S.ctrTab==='cn')S.ctrTab='info';
 let body='';
 if(S.ctrTab==='info')body=`<section class="sec" style="margin-top:24px"><div class="sec-h"><h3>계약 정보</h3></div>
  <table class="ft"><tbody><tr><th>PG사</th><td>${m.pg}</td><th>결제수단</th><td><b>${c.m}</b></td></tr>
  <tr><th>MID</th><td><button class="lk mid" data-a="merDetail" data-id="${m.id}">${m.mid}</button> <span class="dim-t">가맹점 상세로 이동</span></td><th>가맹점 용도</th><td>${esc(useName(m.use))} <span class="dim-t">${esc(m.name)}</span></td></tr>
  <tr><th>계약 세부수단</th><td>${c.subs.join(', ')||'-'}</td><th>적용 시작일</th><td>${c.start} <span class="dim-t">(변경 불가)</span></td></tr>
  <tr><th>오늘 수수료</th><td>${cur?`${cur.type} ${feeTxt(cur)}`:'-'}</td><th>수수료 기준</th><td>VAT ${c.vat}${c.vat==='별도'?` · 부가세 ${c.vatMode} 부과`:''}</td></tr>
  <tr><th>운영상태</th><td>${badge(st)}${c.ops!==m.ops&&m.ops!=='사용'?` <span class="dim-t">MID ${m.ops}</span>`:''}</td><th>사용 코너 ${tag('확인필요')}</th><td>${refs.length?`${refs.map(cn=>esc(cn.name)).join(', ')}`:'<span class="dim-t">없음</span>'} <span class="dim-t">(참조, 필요성 재검토 Q5)</span></td></tr>
  <tr><th>계약 ID</th><td class="mid">${c.id}</td><th>최종 수정</th><td>${(c.upd||m.updatedAt)}</td></tr></tbody></table></section>
  <section class="sec"><div class="sec-h"><h3>MID 공통 정보</h3><span class="sp"></span><button class="btn sm" data-a="merDetail" data-id="${m.id}">가맹점 상세에서 수정</button></div>
  <table class="ft"><tbody><tr><th>정산 주체</th><td>${esc(m.settle)||'-'}</td><th>입금 계좌</th><td>${esc(m.acct)||'<span class="dim-t">미입력</span>'}</td></tr>
  <tr><th>PG 등록 상호</th><td>${esc(m.corp)}</td><th>사업주체 / 채널</th><td>${m.owner} · ${m.chs.join(', ')}</td></tr>
  <tr><th>MID 체계 ${tag('확인필요')}</th><td><span class="dim-t">단일 MID (상위 가맹점 ID / 서브 MID 2단 체계 검토, Q13)</span></td><th>PG 인증키</th><td>${badge(m.keyStatus)} <span class="dim-t">${m.keyAt||''} · PG사 단위</span></td></tr>
  <tr><th>유효기간</th><td colspan="3">${m.from} ~ ${m.to||'종료일 없음'} ${badge(periodSt(m))}</td></tr></tbody></table></section>`;
 if(S.ctrTab==='fee'){const fs=[...c.fees].sort((a,b)=>(a.sub||'').localeCompare(b.sub||'')||a.start.localeCompare(b.start));
  body=`<div class="bar" style="margin-top:20px"><span class="cnt">수수료 이력 <b>${c.fees.length}</b>건</span><span class="cnt dim-t">적용이 시작된 행은 수정할 수 없고, 새 적용 시작일로 추가합니다 (V06)</span><span class="sp"></span><button class="btn sm pri" data-a="feeModal" data-id="${c.id}">수수료 변경</button></div>
  <table class="tbl"><thead><tr><th>적용 대상</th><th>구분</th><th class="r">기준값</th><th>적용 시작일</th><th>적용 종료일</th><th>상태</th></tr></thead><tbody>${fs.map(f=>{const nx=fs.find(x=>(x.sub||'')===(f.sub||'')&&x.start>f.start);const s=feeState(c.fees,f);return `<tr class="${s==='이력'?'off':''}"><td>${f.sub||'기본'}</td><td>${f.type}</td><td class="r num">${feeTxt(f)}</td><td class="num">${f.start}</td><td class="num">${nx?addDays(nx.start,-1):'-'}</td><td>${badge(s)}</td></tr>`}).join('')}</tbody></table>`}
 if(S.ctrTab==='promo'){const sy=src?S.psync[src]:null;const pf=S.promoF;const list=pr.filter(p=>!pf||promoSt(p)===pf).sort((a,b)=>['진행중','예정','종료'].indexOf(promoSt(a))-['진행중','예정','종료'].indexOf(promoSt(b))||a.from.localeCompare(b.from));
  const cnt=k=>pr.filter(p=>promoSt(p)===k).length;
  body=`${sy?`<section class="sec" style="margin-top:24px"><div class="sec-h">${mk('4')}<h3>PG 프로모션 전문 수신</h3><span class="hint">PG사가 카드사별 프로모션과 무이자 할부 조건을 전문으로 보내면 항목별로 데이터화해 FO에 노출합니다</span><span class="sp"></span><button class="btn sm" data-a="promoSync" ${S.psBusy?'disabled':''}>${S.psBusy?'받는 중…':'지금 다시 받기'}</button></div>
  <table class="ft"><tbody><tr><th>수신 원천</th><td>${PROMO_SRC[src]}</td><th>수신 주기</th><td>매일 06:00 <span class="dim-t">(가정, Q11)</span></td></tr>
  <tr><th>최근 수신</th><td>${sy.last} ${badge(sy.res==='성공'?'성공':sy.res,sy.res==='성공'?'ok':'warn')}</td><th>다음 수신 예정</th><td>${sy.next}</td></tr>
  <tr><th>연결 기준</th><td colspan="3">PG ${src.startsWith('*')?'무관 (결제사 전문)':m.pg} · 결제수단 ${c.m}${c.subs.length?` · 계약 세부수단(${c.subs.join(', ')})`:''} · 적용 범위가 '전체 MID'이거나 ${m.mid}를 지정한 건</td></tr></tbody></table></section>`:''}
  <section class="sec"><div class="sec-h"><h3>${c.m} 연결 프로모션</h3><span class="hint">PG 전문 수신 건과 자체 제작 콘텐츠를 함께 관리합니다</span><span class="sp"></span><div class="ck-g rd">${[['','전체',pr.length],['진행중','진행중',cnt('진행중')],['예정','예정',cnt('예정')],['종료','종료',cnt('종료')]].map(([v,l,n])=>`<label><input type="radio" name="promoF" value="${v}" data-b="promoF" data-r ${pf===v?'checked':''}>${l} ${n}</label>`).join('')}</div><button class="btn sm pri" data-a="promoNew" data-id="${c.id}">자체 콘텐츠 등록</button></div>
  <table class="tbl"><thead><tr><th>프로모션 ID</th><th>출처</th><th>유형</th><th class="l">대상</th><th class="l">혜택</th><th>조건</th><th>기간</th><th>상태</th><th>적용 범위</th><th>FO 노출</th></tr></thead><tbody>
  ${list.map(p=>`<tr class="${promoSt(p)==='종료'?'off':''} ${S.flash.includes(p.id)?'flash':''}"><td class="mid">${p.id}</td><td>${badge(p.src,p.src==='자체'?'ac':'')}</td><td>${p.kind}</td><td class="l">${esc(p.target)}</td><td class="l"><b>${esc(p.benefit)}</b></td><td>${esc(p.cond)}</td><td class="num">${p.from} ~ ${p.to}</td><td>${badge(promoSt(p))}</td><td>${p.scope==='all'?'전체 MID':`<span title="${p.scope.join(', ')}">MID 지정 ${p.scope.length}</span>`}</td><td><button class="tgl ${p.fo==='Y'?'on':''}" role="switch" aria-checked="${p.fo==='Y'}" data-a="promoFo" data-v="${p.id}" aria-label="${p.id} FO 노출" ${promoSt(p)==='종료'?'disabled':''}></button></td></tr>`).join('')||'<tr><td colspan="10" class="empty">선택한 상태의 프로모션이 없습니다.</td></tr>'}</tbody></table>
  <div class="call warn"><div>PG 전문 건은 받은 조건을 고치지 않고 FO 노출 여부만 정합니다. 자체 제작 콘텐츠는 BO에서 등록·노출합니다. 전문 항목 구성과 수신 주기, FO 노출 영역은 확인 필요입니다 (Q11).</div></div>
  ${sy?`<section class="sec"><div class="sec-h"><h3>전문 수신 이력</h3></div><table class="tbl"><thead><tr><th>수신 일시</th><th class="l">결과</th></tr></thead><tbody>${sy.log.slice(0,6).map(l=>`<tr><td class="num">${l.at}</td><td class="l">${esc(l.res)}</td></tr>`).join('')}</tbody></table></section>`:''}`}
 if(S.ctrTab==='hist')body=`<div style="margin-top:20px">${histTable(S.hist.filter(h=>h.tid===m.id&&(String(h.field).includes(c.m)||h.area==='가맹점')),true)}</div>`;
 return `${CR(['결제수단 기준정보 관리','결제수단 상세'])}
 ${ph(`${m.pg} › ${c.m} › ${esc(m.mid)} ${badge(st)}`)}
 <div class="tabs small" role="tablist">${mk('2')}${T.map(([k,l,dis])=>`<button role="tab" aria-selected="${S.ctrTab===k}" class="${S.ctrTab===k?'on':''}" data-a="ctrTab" data-v="${k}" ${dis?`disabled title="${src?'수신된 프로모션이 없습니다':'이 결제수단은 프로모션 수신 대상이 아닙니다'}"`:''}>${l}${dis?' <span style="font-size:11px;font-weight:500">(없음)</span>':''}</button>`).join('')}</div>${body}
 <div class="foot pm3h-foot"><button class="btn lg" data-a="baseList">목록</button><button class="btn lg" data-a="promoNew" data-id="${c.id}">프로모션 콘텐츠 등록</button><button class="btn lg pri" data-a="ctrModal" data-id="${c.id}">수정</button></div>`}

/* ---------- SCR-01-1 결제수단 등록 ---------- */
function feeRows(path,fees,subs,lockable){
 return `<div class="tw"><table class="tbl"><thead><tr><th>적용 대상</th><th>수수료 구분</th><th>기준값</th><th>적용 시작일</th><th>상태</th><th>관리</th></tr></thead><tbody>
 ${fees.map((f,i)=>lockable&&f._lock?`<tr class="${feeState(fees,f)==='이력'?'off':''}"><td>${f.sub||'기본'}</td><td>${f.type}</td><td class="num">${feeTxt(f)}</td><td class="num">${f.start}</td><td>${badge(feeState(fees,f))}</td><td class="acts"><span class="dim-t" style="font-size:12px">잠김</span><button class="lk" data-a="feeLocked" data-i="${i}">수정</button></td></tr>`
 :`<tr><td><select class="sel" data-b="${path}.${i}.sub" aria-label="적용 대상">${opts([['','기본 (전체)'],...subs.map(s=>[s,s])],f.sub)}</select></td>
  <td><select class="sel" style="min-width:96px" data-b="${path}.${i}.type" data-r aria-label="수수료 구분">${opts(['정률','정액'],f.type)}</select></td>
  <td><span class="unit"><input class="inp num" type="number" min="0" step="${f.type==='정률'?'0.01':'10'}" data-b="${path}.${i}.v" value="${esc(f.v)}" aria-label="기준값"><em>${f.type==='정률'?'%':'원/건'}</em></span></td>
  <td><input type="date" class="inp" min="${lockable?addDays(TODAY,1):TODAY}" data-b="${path}.${i}.start" data-r value="${esc(f.start)}" aria-label="적용 시작일"></td><td>${f.start?badge(feeState(fees,f)):'-'}</td><td><button class="lk dng" data-a="feeDel" data-p="${path}" data-i="${i}">삭제</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">[수수료 추가]로 등록하세요.</td></tr>'}
 </tbody></table></div><div style="margin-top:10px"><button class="btn sm" data-a="feeAdd" data-p="${path}">+ 수수료 추가</button><span class="dim-t" style="font-size:12px;margin-left:10px">세부수단 요율이 다르면 적용 대상을 세부수단으로 골라 따로 등록합니다. VAT 포함 여부, 반올림 기준은 확인 필요입니다.</span></div>`}
const kOk=P=>!!P&&['확인완료','수동확인'].includes(P.ks);
const liveUses=cur=>S.uses.filter(u=>u.use==='Y'||u.code===cur).map(u=>[u.code,`${u.name} (${u.code})`]);
function vReg(){if(!S.draft)initDraft();
 const d=S.draft;const P=d.pg?PGM[d.pg]:null;const sup=P?P.support:[];const exist=d.pg?S.mers.filter(m=>m.pg===d.pg&&merLive(m)):[];const em=d.merId?mer(d.merId):null;const dup=em&&d.m?ctrOf(em.id,d.m):null;
 const sameUse=d.pg&&d.m?S.ctrs.filter(c=>c.m===d.m&&mer(c.mer).pg===d.pg).map(c=>mer(c.mer)):[];
 return `${CR(['결제수단 등록'])}${ph('결제수단 등록')}
 <p class="desc">PG사 → 결제수단 → MID → 가맹점명 순서로 등록합니다. 인증키는 PG사 단위로 관리하므로 이 화면에서 입력하지 않습니다. 원하는 PG사가 없으면 <button class="lk" data-a="pgNew">PG사 관리에서 먼저 등록</button>하세요.</p>
 <section class="sec"><div class="sec-h">${mk('1')}<h3>① PG사</h3></div><table class="ft"><tbody>
  <tr><th class="req">PG사</th><td><select class="sel w200" data-c="dPg" aria-label="PG사">${opts(PGS.filter(k=>PGM[k].use==='Y'),d.pg,'선택')}</select><span class="help">PG사 관리에 등록된 사용 PG만 나옵니다.</span></td></tr>
  <tr><th>PG 인증키</th><td>${P?`${badge(P.ks)} <span class="dim-t">${P.verify==='api'?'API 확인':'수동 확인'}${P.kAt?' · '+P.kAt:''}</span>${kOk(P)?'':`<div class="sub" style="color:var(--warn)">키 확인 전에는 MID와 계약을 사용 상태로 등록할 수 없습니다 (V12). <button class="lk" data-a="pgEdit" data-v="${esc(d.pg)}">PG사 관리에서 키 확인</button></div>`}`:'<span class="dim-t">PG사를 고르면 표시됩니다.</span>'}</td></tr></tbody></table></section>
 <section class="sec"><div class="sec-h">${mk('2')}<h3>② 결제수단</h3></div><table class="ft"><tbody>
  <tr><th class="req">결제수단</th><td>${d.pg?radios('draft.m',sup,d.m,null,'data-r'):'<span class="dim-t">PG사를 먼저 선택하세요.</span>'}${d.pg?`<div class="sub">${esc(d.pg)} 지원 결제수단만 보입니다. 지원 결제수단은 PG사 관리에서 바꿉니다.</div>`:''}</td></tr>
  ${SUBS[d.m]?`<tr><th>계약 세부수단</th><td><div class="ck-g">${SUBS[d.m].map(s=>`<label><input type="checkbox" data-a="dSub" data-v="${s}" ${d.subs.includes(s)?'checked':''}>${s}</label>`).join('')}</div><div class="sub">계약된 세부수단만 체크합니다.</div></td></tr>`:''}
  ${sameUse.length?`<tr><th>같은 결제수단 MID</th><td><span class="dim-t">${esc(d.pg)} ${d.m}에 이미 ${sameUse.map(m=>`${esc(m.name)}(${m.mid}, ${esc(useName(m.use))})`).join(', ')}가 있습니다.</span></td></tr>`:''}
 </tbody></table></section>
 <section class="sec"><div class="sec-h">${mk('3')}<h3>③ MID / 용도</h3></div><table class="ft"><tbody>
  <tr><th>MID 구분</th><td colspan="3">${radios('draft.midMode',[['new','신규 MID 등록'],['exist',`기존 MID에 결제수단 추가 (${exist.length})`]],d.midMode,null,`data-r ${d.m?'':'disabled'}`)}</td></tr>
  ${d.midMode==='exist'?`<tr><th class="req">MID 선택</th><td colspan="3"><select class="sel" style="min-width:420px" data-b="draft.merId" data-r aria-label="기존 MID">${opts(exist.map(m=>[m.id,`${m.name} · ${m.mid} (${useName(m.use)}, ${m.ops})${d.m&&ctrOf(m.id,d.m)?` [${d.m} 계약 있음]`:''}`]),d.merId,'선택')}</select>
     ${dup?`<div class="call bad" style="margin:10px 0 0"><div><b>중복 계약입니다.</b> ${esc(em.mid)}에는 ${d.m} 계약(${dup.id})이 이미 있습니다. MID + 결제수단 계약은 하나만 둘 수 있습니다. 요율을 바꾸려면 기존 계약의 수수료에 새 적용 시작일 행을 추가하세요. <button class="lk" data-a="feeModal" data-id="${dup.id}">기존 계약 수수료 열기</button></div></div>`:''}</td></tr>
   ${em?`<tr><th>가맹점 용도</th><td>${esc(useName(em.use))}</td><th>가맹점명</th><td>${esc(em.name)}</td></tr><tr><th>정산주체</th><td>${em.settle}</td><th>유효기간</th><td>${em.from} ~ ${em.to||''}</td></tr><tr><th>사업주체</th><td>${em.owner}</td><th>채널</th><td>${em.chs.join(', ')}</td></tr>`:''}`
  :`<tr><th class="req">MID</th><td><input class="inp" data-b="draft.mer.mid" value="${esc(d.mer.mid)}" placeholder="PG가 발급한 MID"></td><th class="req">가맹점 용도</th><td><select class="sel w200" data-b="draft.mer.use" aria-label="가맹점 용도">${opts(liveUses(''),d.mer.use,'선택')}</select></td></tr>
   <tr><th class="req">가맹점명</th><td><input class="inp wide" data-b="draft.mer.name" value="${esc(d.mer.name)}" placeholder="예: T우주 이용권"><div class="sub">화면 표시용 이름. 조회·집계는 가맹점 용도 기준</div></td><th>PG 등록 상호</th><td><input class="inp wide" data-b="draft.mer.corp" value="${esc(d.mer.corp)}" placeholder="계약서상 사업자 상호"></td></tr>
   <tr><th class="req">정산 주체</th><td><input class="inp wide" data-b="draft.mer.settle" value="${esc(d.mer.settle)}" placeholder="예: SKT 또는 정산대행사명"><div class="sub">관리용 텍스트로 입력합니다</div></td><th class="req">사업주체</th><td><select class="sel" data-b="draft.mer.owner">${opts(OWNERS,d.mer.owner,'선택')}</select></td></tr>
   <tr><th>입금 계좌</th><td colspan="3"><input class="inp wide" data-b="draft.mer.acct" value="${esc(d.mer.acct)}" placeholder="예: (정산대행사) 신한은행 ***-***-1234"><span class="help">관리용 텍스트. 입금대사 화면에 그대로 표시합니다</span></td></tr>
   <tr><th class="req">채널</th><td colspan="3"><div class="ck-g">${CHANNELS.map(c=>`<label><input type="checkbox" data-a="dCh" data-v="${c}" ${d.mer.chs.includes(c)?'checked':''}>${c}</label>`).join('')}</div></td></tr>
   <tr><th class="req">유효기간</th><td><span class="rng"><input type="date" class="inp" data-b="draft.mer.from" value="${esc(d.mer.from)}" aria-label="시작일">~<input type="date" class="inp" data-b="draft.mer.to" value="${esc(d.mer.to)}" aria-label="종료일"></span></td><th>운영상태</th><td>${radios('draft.mer.ops',OPS,d.mer.ops)}</td></tr>
   <tr><th>MID 체계 ${tag('확인필요')}</th><td colspan="3"><div class="ck-g"><label class="off"><input type="radio" checked disabled>단일 MID</label><label class="off"><input type="radio" disabled>서브 MID (상위 가맹점 ID 선택)</label></div><div class="sub">PG사 가맹점 ID 아래 서브 MID가 있는 2단 체계를 검토 중입니다. 기획팀의 T우주 가맹점 정리 자료를 받은 뒤 확정합니다 (Q13).</div></td></tr>`}
 </tbody></table></section>
 <section class="sec"><div class="sec-h">${mk('4')}<h3>④ 적용 시작일 / 수수료</h3></div>
  <table class="ft"><tbody><tr><th class="req">적용 시작일</th><td><input type="date" class="inp" min="${TODAY}" data-b="draft.start" data-c="dStart" value="${esc(d.start)}" aria-label="적용 시작일"><span class="help">이 날짜 이후 결제분부터 대사와 수수료 계산 대상이 됩니다. 과거 날짜는 입력할 수 없습니다.</span></td></tr>
  <tr><th>계약 운영상태</th><td>${radios('draft.ops',['사용','일시중지'],d.ops)}</td></tr>
  <tr><th class="req">수수료 VAT</th><td>${radios('draft.vat',[['포함','VAT 포함'],['별도','VAT 별도']],d.vat,null,'data-r')}</td></tr>
  <tr><th class="req">부가세 부과</th><td>${radios('draft.vatMode',[['건별','건별 부과'],['합산','합산 부과']],d.vatMode,null,d.vat==='별도'?'':'disabled')}<span class="help">VAT 별도일 때만 씁니다. 대사 예상 금액 계산에 그대로 반영됩니다</span></td></tr></tbody></table>
  <div style="margin-top:14px">${feeRows('draft.fees',d.fees,d.subs,false)}</div></section>
 ${errBox(S.formErr)}
 <div class="foot"><button class="btn lg" data-a="regCancel">취소</button><button class="btn lg pri" data-a="regSave">${mk('5')}저장</button></div>`}

/* ---------- SCR-07 PG사 관리 (위클리 11/3: 채널 직접 등록, 인증키 PG 단위) ---------- */
function pgUseCnt(pg){return {mids:S.mers.filter(m=>m.pg===pg).length,ctrs:S.ctrs.filter(c=>mer(c.mer).pg===pg).length}}
/* PG사 조회: 다른 목록과 같은 조회 조건 박스. [조회]를 눌러야 반영된다 */
function pgFilter(){const a=S.gfA||emptyGf();const q=(a.q||'').trim().toLowerCase();return PGS.map(k=>PGM[k]).filter(p=>(!q||(p.name+' '+p.code).toLowerCase().includes(q))&&(!a.reg||p.reg===a.reg)&&(!a.ks||p.ks===a.ks)&&(!a.rec||p.rec===a.rec)&&(!a.use||p.use===a.use)&&(!a.m||p.support.includes(a.m)))}
function vPgm(){const rows=pgFilter();const f=S.gf||emptyGf();
 const filt=`<form class="lst-filter" autocomplete="off" onsubmit="return false">
  <div class="lf-row">${lf('PG사',`<input type="text" data-b="gf.q" data-enter="gfSearch" value="${esc(f.q)}" placeholder="PG사명 또는 코드">`)}${lf('등록 구분',`<select data-b="gf.reg">${opts(['기본','채널 등록'],f.reg,'전체')}</select>`)}${lf('인증키',`<select data-b="gf.ks">${opts(KEYST,f.ks,'전체')}</select>`)}${lf('대사 수집',`<select data-b="gf.rec">${opts(['자동','수동'],f.rec,'전체')}</select>`)}</div>
  <div class="lf-row">${lf('결제수단',`<select data-b="gf.m">${opts(METHODS,f.m,'전체')}</select>`)}${lf('사용여부',`<select data-b="gf.use">${opts(['Y','N'],f.use,'전체')}</select>`)}<span class="lf-acts"><button type="button" class="btn dark" data-a="gfReset">초기화</button><button type="button" class="btn pri" data-a="gfSearch">조회</button></span></div></form>`;
 return `${CR(['PG사 관리'])}<h1 class="lst-title">PG사 관리</h1>${filt}
 <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 ${PGS.length}건</span></h2><span class="pm4-need">채널 등록 <b>${rows.filter(p=>p.reg==='채널 등록').length}</b> · 키 미확인 <b style="color:var(--warn)">${rows.filter(p=>!kOk(p)).length}</b> · 수동 대사 <b>${rows.filter(p=>p.rec==='수동').length}</b></span><div class="pm3-tools"><button class="btn sm" disabled title="이후 검토 (Q1)">BSS 동기화 (이후 검토)</button></div></div>
 <div class="tw"><table class="tbl"><thead><tr><th class="l">PG사</th><th>코드</th><th>등록 구분</th><th class="l">지원 결제수단</th><th>인증키</th><th>검증 방식</th><th>MID</th><th>계약</th><th class="l">대사 연동</th><th>사용</th><th>수정일</th><th>${mk('2')}관리</th></tr></thead><tbody>
 ${rows.map(p=>{const u=pgUseCnt(p.name);return `<tr class="${p.use==='N'?'off':''} ${S.flash.includes(p.name)?'flash':''}"><td class="l"><b>${esc(p.name)}</b></td><td class="mid">${p.code}</td><td>${badge(p.reg)}</td><td class="l" style="font-size:12px;white-space:normal;min-width:190px">${p.support.join(', ')}</td>
  <td>${badge(p.ks)}<div class="sub">항목 ${p.keys.length}개</div></td><td>${p.verify==='api'?'API':'수동'}</td><td>${u.mids?`<button class="lk" data-a="pgMids" data-v="${esc(p.name)}">${u.mids}개</button>`:'<span class="dim-t">0</span>'}</td><td>${u.ctrs}</td><td class="l">${badge(p.rec)}<div class="sub">${esc(p.lt)} · ${esc(p.lc)}</div></td><td>${badge(p.use)}</td><td class="num">${String(p.upd).slice(0,10)}</td><td class="acts"><button class="lk" data-a="pgEdit" data-v="${esc(p.name)}">수정</button></td></tr>`}).join('')||'<tr><td colspan="12" class="empty">조건에 맞는 PG사가 없습니다.</td></tr>'}</tbody></table></div>
 <p class="desc dim-t">PG사는 삭제하지 않습니다. MID가 있는 PG사는 미사용으로 바꿀 수 없습니다 (V17).</p>
 <div class="lst-foot"><button class="btn pri lg" data-a="pgNew">PG사 등록</button></div>`}
function vPgForm(){const d=S.pgDraft;const u=d.isNew?{mids:0,ctrs:0}:pgUseCnt(d.orig);const used=d.isNew?[]:[...new Set(S.ctrs.filter(c=>mer(c.mer).pg===d.orig).map(c=>c.m))];
 return `${CR(['PG사 관리',d.isNew?'PG사 등록':'PG사 수정'])}${ph(d.isNew?'PG사 등록':`PG사 수정: ${esc(d.orig)} ${badge(d.ks)}`,`<button class="btn sm" data-a="pgCancel">목록</button>`)}
 <section class="sec"><div class="sec-h">${mk('1')}<h3>① 기본 정보</h3></div><table class="ft"><tbody>
  <tr><th class="req">PG사명</th><td>${d.isNew?`<input class="inp" data-b="pgDraft.name" value="${esc(d.name)}" placeholder="예: 다날">`:`<b>${esc(d.name)}</b> <span class="dim-t">(변경 불가)</span>`}</td><th class="req">PG 코드</th><td>${d.isNew?`<input class="inp" style="width:110px" data-b="pgDraft.code" value="${esc(d.code)}" placeholder="예: DNL" maxlength="6">`:`<span class="mid">${d.code}</span> <span class="dim-t">(변경 불가)</span>`}<span class="help">영문 대문자·숫자 2~6자. 거래번호, 대사 파일명 접두어</span></td></tr>
  <tr><th>사용여부</th><td colspan="3">${radios('pgDraft.use',['Y','N'],d.use)}</td></tr></tbody></table>
 <div class="sec-h" style="margin-top:22px"><h3>대사 연동 정보</h3><span class="hint">PG사 등록 시 넣어 두면 매일 자동으로 대사 결과가 쌓입니다. 자동 제공이 없으면 수동 파일로 병행합니다</span></div><table class="ft"><tbody>
  <tr><th class="req">연동 방식</th><td>${radios('pgDraft.lt',[['API','API'],['SFTP','SFTP 파일'],['수동 파일','수동 파일 등록']],d.lt,null,'data-r')}</td><th>대사 수집</th><td>${badge(d.lt==='수동 파일'?'수동':'자동')} <span class="dim-t">연동 방식에 따라 정해집니다</span></td></tr>
  <tr><th>수신 주기</th><td><input class="inp" data-b="pgDraft.lc" value="${esc(d.lc)}" placeholder="예: 매일 07:00"></td><th>연동 경로</th><td><input class="inp wide" data-b="pgDraft.lp" value="${esc(d.lp)}" placeholder="API 엔드포인트, SFTP 경로 또는 파일 받는 곳"></td></tr></tbody></table>
 <p class="desc dim-t" style="margin-top:8px">PG사별 대사 데이터 제공 방식은 확인 필요입니다 (Q9). 정산 주체와 입금 계좌는 결제수단 등록·가맹점 상세에서 MID별 텍스트로 관리합니다.</p></section>
 <section class="sec"><div class="sec-h">${mk('2')}<h3>② 지원 결제수단</h3><span class="hint">결제수단 등록에서 이 PG를 고르면 여기 체크한 결제수단만 나옵니다</span></div><table class="ft"><tbody><tr><th class="req">결제수단</th><td><div class="ck-g">${METHODS.map(x=>{const lock=used.includes(x);return `<label class="${lock?'off':''}" title="${lock?'계약이 있어 해제할 수 없습니다':''}"><input type="checkbox" data-a="pgSup" data-v="${x}" ${d.support.includes(x)?'checked':''} ${lock?'disabled':''}>${x}${lock?' <span class="dim-t" style="font-size:11px">(계약 있음)</span>':''}</label>`}).join('')}</div></td></tr></tbody></table></section>
 <section class="sec"><div class="sec-h">${mk('3')}<h3>③ 인증키</h3><span class="hint">PG사 기준 1벌. 이 PG의 MID ${u.mids}개, 결제수단 계약 ${u.ctrs}건이 같은 키를 씁니다</span></div>
 <table class="ft"><tbody><tr><th>검증 방식</th><td colspan="2">${d.isNew?radios('pgDraft.verify',[['api','API 유효성 확인'],['manual','수동 확인']],d.verify,null,'data-r'):(d.verify==='api'?'API 유효성 확인':'수동 확인')}</td></tr>
 ${d.keys.map((k,i)=>`<tr><th class="req">${d.isNew?`<input class="inp" style="width:120px" data-c="pgKeyLbl" data-i="${i}" value="${esc(k.l)}" placeholder="항목명" aria-label="키 항목명">`:esc(k.l)}</th><td><input class="inp wide" type="password" autocomplete="off" data-c="pgKeyVal" data-i="${i}" value="${esc(k.v)}" aria-label="${esc(k.l)}"></td><td style="width:64px">${d.isNew&&d.keys.length>1?`<button class="lk dng" data-a="pgKeyDel" data-i="${i}">삭제</button>`:''}</td></tr>`).join('')}
 ${d.isNew?`<tr><th></th><td colspan="2"><button class="btn sm" data-a="pgKeyAdd">+ 키 항목 추가</button></td></tr>`:''}
 <tr><th>유효성 확인</th><td colspan="2"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${d.verify==='api'?`<button class="btn sm" data-a="pgVerify">유효성 확인</button>`:`<label class="ck"><input type="checkbox" data-c="pgManual" ${d.kManual?'checked':''}>PG 관리자 화면에서 키를 직접 확인했습니다</label>`}${badge(d.ks)}${d.kAt?`<span class="dim-t">${d.kAt}</span>`:''}${d.kMsg?`<span style="color:${d.ks==='확인실패'?'var(--bad)':d.ks==='미확인'?'var(--warn)':'var(--ok)'}">${esc(d.kMsg)}</span>`:''}</div>
  <div class="sub">${d.verify==='api'?'키를 입력하고 [유효성 확인]을 누르면 PG 조회 API로 인증 오류를 확인합니다. 키를 고치면 미확인으로 돌아갑니다 (V04). 데모: FAIL이 들어가거나 8자 미만이면 실패':'검증 호출을 제공하지 않는 PG로 가정했습니다. 확인자와 일시를 남깁니다 (Q3).'}</div></td></tr></tbody></table>
 ${!d.isNew&&u.mids?`<div class="call warn"><div>키를 바꾸면 확인 전까지 미확인 상태입니다. 저장하면 이 PG의 MID ${u.mids}개가 새 키를 씁니다.</div></div>`:''}</section>
 ${errBox(S.pgErr)}
 <div class="foot"><button class="btn lg" data-a="pgCancel">취소</button><button class="btn lg pri" data-a="pgSave">${mk('4')}저장</button></div>`}

/* ---------- SCR-03 가맹점(MID) 상세 ---------- */
function vMer(){
 const m=mer(S.merId);const cs=S.ctrs.filter(c=>c.mer===m.id).sort((a,b)=>ordM(a.m,b.m));const refs=cornerRefs(m.id);const pays=S.pays.filter(p=>p.mer===m.id);
 const T=[['info','기본정보'],['ctr',`결제수단 ${cs.length}`],['cn',`사용 중인 결제 코너 ${refs.length}`],['pay',`결제이력 ${pays.length}`],['hist','변경이력']];let body='';const e=S.merEdit;
 if(S.detTab==='info')body=`<section class="sec" style="margin-top:24px"><div class="sec-h"><h3>가맹점 정보</h3><span class="sp"></span>${e?'':`<button class="btn sm" data-a="merEditStart">수정</button>`}</div>
  <table class="ft"><tbody>
  <tr><th>PG사</th><td>${m.pg}</td><th>MID</th><td class="mid">${esc(m.mid)} <span class="dim-t">(변경 불가)</span></td></tr>
  <tr><th class="${e?'req':''}">가맹점 용도</th><td>${e?`<select class="sel" data-b="merEdit.use">${opts(liveUses(e.use),e.use,'선택')}</select>`:`${esc(useName(m.use))} <span class="dim-t">${m.use}</span>`}</td><th>MID 체계</th><td><span class="dim-t">단일 MID. 상위 가맹점 ID / 서브 MID 2단 체계 검토 중 (Q13)</span> ${tag('확인필요')}</td></tr>
  <tr><th class="${e?'req':''}">가맹점명</th><td>${e?`<input class="inp wide" data-b="merEdit.name" value="${esc(e.name)}">`:esc(m.name)}</td><th>PG 등록 상호</th><td>${e?`<input class="inp wide" data-b="merEdit.corp" value="${esc(e.corp)}">`:esc(m.corp)||'-'}</td></tr>
  <tr><th class="${e?'req':''}">정산 주체</th><td>${e?`<input class="inp wide" data-b="merEdit.settle" value="${esc(e.settle)}">`:esc(m.settle)}</td><th>사업주체</th><td>${e?`<select class="sel" data-b="merEdit.owner">${opts(OWNERS,e.owner)}</select>`:m.owner}</td></tr>
  <tr><th>입금 계좌</th><td colspan="3">${e?`<input class="inp wide" data-b="merEdit.acct" value="${esc(e.acct)}">`:esc(m.acct)||'<span class="dim-t">미입력</span>'} <span class="dim-t">관리용 텍스트</span></td></tr>
  <tr><th>채널</th><td colspan="3">${e?`<div class="ck-g">${CHANNELS.map(c=>`<label><input type="checkbox" data-a="eCh" data-v="${c}" ${e.chs.includes(c)?'checked':''}>${c}</label>`).join('')}</div>`:m.chs.join(', ')}</td></tr>
  <tr><th>유효기간</th><td colspan="3">${e?`<span class="rng"><input type="date" class="inp" data-b="merEdit.from" value="${e.from}">~<input type="date" class="inp" data-b="merEdit.to" value="${e.to}"></span>`:`${m.from} ~ ${m.to||'종료일 없음'} ${badge(periodSt(m))}`}</td></tr>
  <tr><th>운영상태</th><td colspan="3">${e?radios('merEdit.ops',OPS,e.ops):badge(m.ops)}</td></tr>
  ${e?`<tr><th class="${e.ops!==m.ops?'req':''}">변경 사유</th><td colspan="3"><input class="inp wide" data-b="merEdit.reason" value="${esc(e.reason)}" placeholder="운영상태를 바꿀 때 필수 (제안)"></td></tr>`:''}
  <tr><th>최종 수정</th><td colspan="3">${m.updatedAt} / ${m.by}</td></tr></tbody></table>
  ${e?`${errBox(e.err)}<div class="foot" style="margin-top:16px"><button class="btn" data-a="merEditCancel">취소</button><button class="btn pri" data-a="merEditSave">저장</button></div>`:''}</section>
  <section class="sec"><div class="sec-h"><h3>PG 인증키</h3><span class="hint">PG사 단위 (위클리 11/3). ${m.pg}의 모든 MID가 같은 키를 씁니다.</span><span class="sp"></span><button class="btn sm" data-a="pgEdit" data-v="${m.pg}">PG사 관리에서 변경</button></div>
  <table class="ft"><tbody>${PGM[m.pg].keys.map(([k,l])=>`<tr><th>${l}</th><td>${maskKey(PGM[m.pg].vals[k])}</td></tr>`).join('')}<tr><th>유효성 확인</th><td>${badge(m.keyStatus)} ${m.keyAt?`<span class="dim-t">${m.keyAt} / ${m.keyBy}</span>`:''}${!keyOk(m)?'<div class="sub" style="color:var(--warn)">확인 전에는 이 PG의 계약을 사용 상태로 운영할 수 없고, 외부 결제 코너에서도 "키 미확인"으로 빠집니다.</div>':''}</td></tr></tbody></table></section>

<p class="desc dim-t">가맹점은 삭제하지 않습니다. 거래와 정산 이력이 남아 있어 운영상태 미사용 + 유효기간 종료로 정리합니다.</p>`;
 if(S.detTab==='ctr')body=`<div class="bar" style="margin-top:20px"><span class="cnt">결제수단 계약 <b>${cs.length}</b>건</span><span class="sp"></span><button class="btn sm pri" data-a="regAdd" data-id="${m.id}">결제수단 추가</button></div>
  <table class="tbl"><thead><tr><th>결제수단</th><th class="l">세부수단</th><th class="l">수수료 (오늘)</th><th>적용 시작일</th><th>상태</th><th>사용 코너</th><th>진행중 프로모션</th><th>관리</th></tr></thead><tbody>${cs.map(c=>`<tr class="${S.flash.includes(c.id)?'flash':''}"><td><b>${c.m}</b></td><td class="l">${c.subs.join(', ')||'-'}</td><td class="l num">${feeCellC(c)}</td><td class="num">${c.start}</td><td>${badge(ctrSt(c))}</td><td>${cornerRefs(m.id,c.m).length}개</td><td>${promosOf(c).length?`<button class="lk" data-a="ctrDetail" data-id="${c.id}" data-tab="promo">${livePromos(c).length}건</button>`:'<span class="dim-t">없음</span>'}</td><td class="acts"><button class="lk" data-a="ctrDetail" data-id="${c.id}">상세</button><button class="lk" data-a="ctrModal" data-id="${c.id}">수정</button><button class="lk" data-a="feeModal" data-id="${c.id}">수수료</button></td></tr>`).join('')}</tbody></table>`;
 if(S.detTab==='cn')body=`<div class="call warn" style="margin-top:20px"><div><b>외부 도메인 데이터 (읽기 전용)</b><br>결제 코너의 관리 주체와 위치는 정해지지 않았습니다(Q5). 결제 BO는 코너를 만들거나 고치지 않고, 이 MID를 고른 항목만 Mock으로 참조해 보여줍니다.</div></div>
  <table class="tbl" style="margin-top:14px"><thead><tr><th>코너</th><th class="l">컨테이너 / 코너명</th><th>결제수단</th><th>노출 여부</th><th>항목 상태</th><th class="l">같은 코너의 다른 PG 항목</th></tr></thead><tbody>${refs.flatMap(cn=>cn.items.filter(it=>it.mer===m.id).map(it=>`<tr><td class="mid">${cn.id}</td><td class="l">${cn.ctn} / <b>${esc(cn.name)}</b></td><td>${it.m}</td><td>${it.on?'Y':'N'}</td><td>${badge(itemState(cn,it).t)}</td><td class="l" style="font-size:12px">${cn.items.filter(x=>mer(x.mer).pg!==m.pg).map(x=>`${x.m} · ${mer(x.mer).pg}`).join(', ')||'<span class="dim-t">-</span>'}</td></tr>`)).join('')||'<tr><td colspan="6" class="empty">이 MID를 쓰는 결제 코너가 없습니다.</td></tr>'}</tbody></table>`;
 if(S.detTab==='pay'){const pg=paginate(pays,'dpay',10);body=`<div class="bar" style="margin-top:20px"><span class="cnt">결제 <b>${pays.length}</b>건 (2026-09-01 ~ ${TODAY})</span><span class="sp"></span><button class="btn sm" data-a="payByMer" data-id="${m.id}">결제이력 관리에서 보기</button></div>${payTable(pg.rows,false)}${pg.html}`}
 if(S.detTab==='hist')body=`<div style="margin-top:20px">${histTable(S.hist.filter(h=>h.tid===m.id),true)}</div>`;
 return `${CR(['결제수단 기준정보 관리','가맹점 상세'])}
 ${ph(`${esc(m.name)} ${badge(m.ops)}`,`<button class="btn sm" data-a="baseList">목록</button>`)}
 <div class="path" aria-label="계위">${[m.pg,`결제수단 ${cs.length}개`,m.mid,m.name].map((t,i)=>`<span class="n ${i>=2?'on':''}">${esc(t)}</span>`).join('<i>›</i>')}</div>
 ${S.marks?`<div style="margin-top:20px">${mk('1')}</div>`:''}<div class="strip">${[['PG사',m.pg],['MID',m.mid],['정산주체',m.settle],['PG 인증키',m.keyStatus],['가맹점 용도',useName(m.use)],['유효기간',`${m.from}~${m.to||''}`],['결제 코너 (외부)',`${refs.length}개`]].map(([a,b])=>`<div><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div>
 <div class="tabs small" role="tablist">${mk('2')}${T.map(([k,l])=>`<button role="tab" aria-selected="${S.detTab===k}" class="${S.detTab===k?'on':''}" data-a="detTab" data-v="${k}">${l}</button>`).join('')}</div>${body}`}
function histTable(rows,small){const pg=paginate(rows,'hist'+(small?'s':''),10);
 return `<div class="tw"><table class="tbl"><thead><tr><th>변경일시</th><th>변경자</th><th class="l">대상</th><th>영역</th><th class="l">변경항목</th><th class="l">변경 전</th><th class="l">변경 후</th></tr></thead><tbody>
 ${pg.rows.map(h=>`<tr><td class="num">${h.at}</td><td>${h.by}</td><td class="l">${esc(h.tname)}</td><td>${h.area}</td><td class="l">${esc(h.field)}</td><td class="l dim-t">${esc(h.before)}</td><td class="l">${esc(h.after)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">변경이력이 없습니다.</td></tr>'}</tbody></table></div>${pg.html}`}

/* ---------- SCR-05 결제이력 관리 (위클리 11/3: 결제 건 중심, 결제번호 우선, 승인취소) ---------- */
function cancelWhy(p){if(!['결제완료','부분취소'].includes(p.st)||p.amt-p.cancel<=0)return '승인취소할 금액이 없습니다.';if(p.sub==='가상계좌')return '가상계좌는 환불 절차 확인 전까지 BO 승인취소를 막아 두었습니다 (V24).';if(p.bss==='반영대기')return 'BSS 반영 확인 후 승인취소할 수 있습니다 (V23).';return ''}
function payFilter(){const f=S.pfA;const q=(f.q||'').trim().toUpperCase();const mv=f.mOn?(f.mv||'').trim():'';const mu=f.mOn?(f.mu||'').trim().toUpperCase():'';return S.pays.filter(p=>{const d=p.at.slice(0,10);
 if(mu&&!p.uid.toUpperCase().includes(mu))return false;if(mv&&!(mv.length>=2&&p.mbr[0]===mv[0]&&p.mbr.slice(-1)===mv.slice(-1)))return false;
 return (!f.from||d>=f.from)&&(!f.to||d<=f.to)&&(!q||(p.no+'|'+p.appr+'|'+p.ord+'|'+p.grp).toUpperCase().includes(q))&&(!f.pg||p.pg===f.pg)&&(!f.mer||p.mer===f.mer)&&(!f.m||p.method===f.m)&&(!f.st||p.st===f.st)})}
function payTable(rows,sortable,tot){const T=(k,l,c)=>sortable?th('pay',k,l,c):`<th class="${c||''}">${l}</th>`;
 return `<div class="tw"><table class="tbl"><thead><tr>${sortable?`<th class="ck"><input type="checkbox" data-a="pselAll" ${rows.length&&rows.every(p=>S.psel.includes(p.no))?'checked':''} aria-label="현재 페이지 전체 선택"></th>`:''}<th class="l">결제번호</th><th>승인번호</th>${T('at','승인일시')}<th>결제수단</th>${T('amt','결제금액','r')}<th class="r">승인취소</th><th class="r">순결제금액</th><th>결제상태</th><th class="l">PG사 / MID</th><th class="l">회원 ${tag('확인필요')}</th><th class="l">주문번호 / 그룹 ID</th><th>${mk('4')}관리</th></tr>${tot?`<tr class="tot"><td colspan="${sortable?5:4}"></td><td>${won(tot.amt)}</td><td style="color:var(--bad)">${tot.can?'-'+won(tot.can):'0'}</td><td>${won(tot.amt-tot.can)}</td><td colspan="5"></td></tr>`:''}</thead><tbody>
 ${rows.map(p=>{const fail=p.st==='결제실패';const ok=!cancelWhy(p);return `<tr class="click ${S.flash.includes(p.no)?'flash':''} ${S.psel.includes(p.no)?'sel':''}" data-a="payDetail" data-id="${p.no}" tabindex="0">${sortable?`<td class="ck" data-a="noop"><input type="checkbox" data-a="pselOne" data-id="${p.no}" ${S.psel.includes(p.no)?'checked':''} aria-label="${p.no} 선택"></td>`:''}<td class="l"><b class="mid">${p.no}</b></td><td class="mid">${p.appr||'<span class="dim-t">-</span>'}</td><td class="num">${p.at.slice(0,16)}</td><td>${p.method}</td>
  <td class="r num ${fail?'dim-t':''}">${won(p.amt)}</td><td class="r num">${p.cancel?`<span style="color:var(--bad)">-${won(p.cancel)}</span>`:'<span class="dim-t">0</span>'}</td><td class="r num">${fail?'<span class="dim-t">-</span>':won(p.amt-p.cancel)}</td><td>${badge(p.st)}</td>
  <td class="l">${p.pg}<div class="sub mid">${p.mid}</div></td><td class="l"><span class="mid">${p.uid}</span><div class="sub">${p.mbr}</div></td><td class="l"><span class="mid" style="font-size:12px">${p.ord}</span><div class="sub mid">${p.grp}${grpCnt(p.grp)>1?` (번들 ${grpCnt(p.grp)}건)`:''}</div></td>
  <td class="acts">${p.st==='결과미확인'?`<button class="lk" data-a="payDetail" data-id="${p.no}">PG 재조회</button>`:ok?`<button class="lk dng" data-a="cancelModal" data-id="${p.no}">승인취소</button>`:'<span class="dim-t">-</span>'}</td></tr>`}).join('')||`<tr><td colspan="${sortable?13:12}" class="empty">조건에 맞는 결제가 없습니다. 기간을 넓혀 보세요.</td></tr>`}</tbody></table></div>`}
const grpCnt=g=>S.pays.filter(x=>x.grp===g).length;
function vPay(){
 const f=S.pf;const rows=sortRows(payFilter(),'pay',{amt:p=>p.amt,at:p=>p.at});const pg=paginate(rows,'pay',15);
 const ok=rows.filter(p=>p.st!=='결제실패');const tot=ok.reduce((a,p)=>a+p.amt,0),can=ok.reduce((a,p)=>a+p.cancel,0);
 const mo=S.mers.filter(x=>!f.pg||x.pg===f.pg).map(x=>[x.id,`${x.name} · ${x.mid}`]);const unk=S.pays.filter(p=>p.st==='결과미확인').length;
 const rng2=(k1,k2,l)=>`<span class="lf-range"><input type="date" data-b="${k1}" value="${get(k1)||''}" aria-label="${l} 시작"><span aria-hidden="true">~</span><input type="date" data-b="${k2}" value="${get(k2)||''}" aria-label="${l} 종료"></span>`;
 const filt=`<form class="lst-filter" autocomplete="off" onsubmit="return false">
  <div class="lf-row">${lf('PG사',`<select data-b="pf.pg" data-c="pfPg">${opts(PGS.filter(k=>S.mers.some(m=>m.pg===k)),f.pg,'전체')}</select>`)}${lf('결제수단',`<select data-b="pf.m">${opts(METHODS,f.m,'전체')}</select>`)}${lf('가맹점 / MID',`<select data-b="pf.mer">${opts(mo,f.mer,'전체')}</select>`)}${lf('결제상태',`<select data-b="pf.st">${opts(PAYST,f.st,'전체')}</select>`)}</div>
  <div class="lf-row">${lf('결제번호',`<input type="text" data-b="pf.q" data-enter="pfSearch" value="${esc(f.q)}" placeholder="결제번호, 승인번호, 주문번호, 그룹 ID">`,'lf-wide')}${lf('회원 조건',`<label class="ck"><input type="checkbox" data-b="pf.mOn" data-r ${f.mOn?'checked':''}>회원으로 조회</label>`)}</div>
  ${f.mOn?`<div class="lf-row">${lf('UID',`<input type="text" data-b="pf.mu" data-enter="pfSearch" value="${esc(f.mu||'')}" placeholder="U로 시작">`)}${lf('회원명',`<input type="text" data-b="pf.mv" data-enter="pfSearch" value="${esc(f.mv||'')}" placeholder="실명 (서버에서 일치 여부만 확인)">`)}</div>`:''}
  <div class="lf-row">${lf('승인일',rng2('pf.from','pf.to','승인일'),'lf-wide')}<span class="lf-acts"><button type="button" class="btn dark" data-a="pfReset">초기화</button><button type="button" class="btn pri" data-a="pfSearch">조회</button></span></div></form>
`;
 return `${CR(['결제이력 관리'])}<h1 class="lst-title">결제이력 관리</h1>${filt}
 <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 ${S.pays.length}건</span></h2><span class="pm4-need">처리 필요 <button class="lk" data-a="pfQuick">결과 미확인 <b>${unk}</b>건</button></span>
  <div class="pm3-tools">${S.psel.length?`<span class="bulkbox"><b>${S.psel.length}건 선택</b><button class="lk" data-a="pselClear">선택 해제</button></span>`:''}<button class="btn sm pri" data-a="csvPaySel" ${S.psel.length?'':'disabled title="다운로드할 결제를 체크하세요"'}>선택 엑셀 다운로드${S.psel.length?` (${S.psel.length})`:''}</button><button class="btn sm" data-a="csvPay">조회 결과 전체 엑셀</button></div></div>
 ${payTable(pg.rows,true,{amt:tot,can})}${pg.html}`}
function vPayD(){
 const p=pay(S.payNo);const pr=prod(p.pid);const m=mer(p.mer);const c=ctrOf(p.mer,p.method);const f=c?feeAt(c,p.at.slice(0,10),p.sub||''):null;const cn=corner(p.cn);const fee=payFee(p);const L=payLogs(p);const can=p.amt-p.cancel;const why=cancelWhy(p);
 const grp=S.pays.filter(x=>x.grp===p.grp&&x.no!==p.no);
 let acts='';if(p.busy)acts=`<span class="dim-t">${p.busy} 중…</span>`;else{if(p.st==='결과미확인')acts+=`<button class="btn lg pri" data-a="payQuery">${mk('3')}PG 재조회</button>`;if(['결제완료','부분취소'].includes(p.st)&&can>0)acts+=`<button class="btn lg ${why?'':'dng'}" data-a="cancelModal" data-id="${p.no}" ${why?`disabled title="${why}"`:''}>${mk('3')}승인취소</button>`}
 const bssAct=p.busy?'':['반영실패','불일치'].includes(p.bss)?` <button class="lk" data-a="payBss" data-v="re">반영 재요청</button>`:p.bss==='반영대기'&&p.st!=='결과미확인'?` <button class="lk" data-a="payBss" data-v="ok">반영 확인</button>`:'';
 const ops=L.filter(l=>l.by!=='시스템');const lastOp=ops[ops.length-1];const canOp=[...L].reverse().find(l=>l.t.includes('승인취소'));
 const vt=fee==null||p.st==='결과미확인'?null:c&&c.vat==='별도'?Math.round(fee*1.1):fee;
 const S2=(t,n,h,b)=>`<section class="sec"><div class="sec-h">${n?mk(n):''}<h3>${t}</h3>${h?`<span class="hint">${h}</span>`:''}</div>${b}</section>`;
 return `${CR(['결제이력 관리','결제 상세'])}${ph(`<span class="mid">${p.no}</span> ${badge(p.st)}`,`<span class="dim-t">주문번호 <span class="mid">${p.ord}</span></span>`)}
 ${p.st==='결과미확인'?'<div class="call warn"><div>PG에서 결과 응답을 받지 못했습니다. PG 재조회로 결과를 확정하세요. 확정 전에는 승인취소할 수 없고(V21), 일대사에서도 Fail로 잡힙니다.</div></div>':''}${why&&['결제완료','부분취소'].includes(p.st)&&can>0?`<div class="call ac"><div>${why}</div></div>`:''}
 ${S2('① 결제 정보','1','',`<table class="ft"><tbody>
  <tr><th>결제번호</th><td class="mid">${p.no}</td><th>승인번호</th><td class="mid">${p.appr||'<span class="dim-t">없음</span>'}</td></tr>
  <tr><th>승인일시</th><td>${p.at}</td><th>결제상태</th><td>${badge(p.st)}${p.failMsg?` <span style="color:var(--bad)">${esc(p.failMsg)}</span>`:''}</td></tr>
  <tr><th>결제수단</th><td>${p.method} · ${p.sub||'-'} · ${p.inst}</td><th>PG 거래번호</th><td class="mid">${p.tid}</td></tr>
  <tr><th>PG사 / MID</th><td>${p.pg} / <span class="mid">${p.mid}</span></td><th>가맹점 용도</th><td>${esc(useName(m.use))} <span class="dim-t">${esc(p.mname)}</span></td></tr></tbody></table>`)}
 ${S2('② 주문 정보','','',`<table class="ft"><tbody>
  <tr><th>주문번호</th><td class="mid">${p.ord}</td><th>그룹 ID</th><td><span class="mid">${p.grp}</span> <span class="dim-t">번들 묶음 구매 단위 (BSS 기준과 맞춤)</span></td></tr>
  <tr><th>상품</th><td>${esc(pr.name)}<div class="sub">${p.ctn}</div></td><th>결제 코너</th><td>${esc(cn.name)} <span class="dim-t">${cn.id} · 외부 참조</span></td></tr>
  <tr><th>회원 ${tag('확인필요')}</th><td colspan="3"><span class="mid">${p.uid}</span> · ${p.mbr}</td></tr></tbody></table>
  ${grp.length?(()=>{const all=[p,...grp].sort((a,b)=>a.at.localeCompare(b.at));const sm=all.reduce((a,x)=>a+x.amt,0),sn=all.reduce((a,x)=>a+(x.st==='결제실패'?0:x.amt-x.cancel),0);return `<div class="sec-h" style="margin-top:22px"><h3 style="font-size:15px">같이 구매한 상품 <span style="color:var(--ac)">${all.length}</span>건</h3><span class="hint">같은 그룹 ID(번들)로 함께 주문·결제된 상품입니다</span></div>
  <table class="tbl"><thead><tr><th class="l">상품</th><th>결제번호</th><th>승인번호</th><th>결제수단</th><th class="r">결제금액</th><th class="r">승인취소</th><th>결제상태</th><th>보기</th></tr></thead><tbody>${all.map(x=>{const pp=prod(x.pid);const me=x.no===p.no;return `<tr class="${me?'sel':''}"><td class="l"><b>${esc(pp.name)}</b><div class="sub">${esc(pp.lv2)}</div></td><td class="mid">${x.no}</td><td class="mid">${x.appr||'-'}</td><td>${x.method}<div class="sub">${x.sub||''}</div></td><td class="r num">${won(x.amt)}</td><td class="r num">${x.cancel?`<span style="color:var(--bad)">-${won(x.cancel)}</span>`:'0'}</td><td>${badge(x.st)}</td><td>${me?'<span class="dim-t">현재 건</span>':`<button class="lk" data-a="payDetail" data-id="${x.no}">상세</button>`}</td></tr>`}).join('')}
  <tr class="tot"><td class="l" colspan="4">번들 합계</td><td>${won(sm)}</td><td colspan="3" class="l">순결제 ${won(sn)}원</td></tr></tbody></table>`})():''}`)}
 ${S2('③ 결제 금액','','결제 시점 요율로 계산합니다. 이후 기준정보가 바뀌어도 이 결제의 기준은 바뀌지 않습니다',`<table class="ft"><tbody>
  <tr><th>결제금액</th><td class="num">${won(p.amt)}원</td><th>승인취소 금액</th><td class="num">${p.cancel?`<span style="color:var(--bad)">-${won(p.cancel)}원</span>`:'0원'}</td></tr>
  <tr><th>순결제금액</th><td class="num"><b>${p.st==='결제실패'?'-':won(can)+'원'}</b></td><th>적용 요율</th><td>${f?`${f.type} ${feeTxt(f)} <span class="dim-t">(${f.sub||'기본'}, ${f.start}~)</span>`:'-'}</td></tr>
  <tr><th>예상 수수료</th><td colspan="3">${p.st==='결과미확인'?'결과 확정 전':fee==null?'-':`${won(vt)}원 <span class="dim-t">(VAT ${c.vat}${c.vat==='별도'?` · 부가세 ${c.vatMode}${c.vatMode==='합산'?', 월 합산 시 반영':''}`:''})</span>`}</td></tr></tbody></table>`)}
 ${S2('④ BSS 반영','','',`<table class="ft"><tbody><tr><th>반영 상태</th><td>${p.bss==='-'?'<span class="dim-t">-</span>':badge(p.bss)}${bssAct}</td><th>반영 금액</th><td>${p.bss==='불일치'?`BSS ${won(p.bssAmt)}원 / PG ${won(can)}원`:p.bss==='반영완료'?won(can)+'원':'<span class="dim-t">-</span>'}</td></tr>
  ${p.bss==='반영실패'?`<tr><th>오류</th><td colspan="3" style="color:var(--bad)">${esc(p.bssErr)}</td></tr>`:''}</tbody></table>`)}
 ${S2('⑤ 결제 이력','','PG 재조회, 승인취소, BSS 반영 요청을 회차와 결과까지 남깁니다 (V25)',`<table class="tbl"><thead><tr><th>일시</th><th>처리자</th><th class="l">처리</th><th class="l">결과</th></tr></thead><tbody>${L.slice().reverse().map(l=>`<tr><td class="num">${l.at}</td><td>${l.by}</td><td class="l"><b>${esc(l.t)}</b></td><td class="l" style="${l.bad?'color:var(--bad)':''}">${esc(l.res)}</td></tr>`).join('')}</tbody></table>`)}
 ${S2(`⑥ 담당자 정보 ${tag('확인필요')}`,'','표시 항목은 확정 전 시안입니다',`<table class="ft"><tbody>
  <tr><th>최근 처리자</th><td>${lastOp?`${lastOp.by} <span class="dim-t">${lastOp.at} · ${esc(lastOp.t)}</span>`:'<span class="dim-t">BO 처리 없음</span>'}</td><th>승인취소 처리자</th><td>${canOp?`${canOp.by} <span class="dim-t">${canOp.at}</span>`:'<span class="dim-t">-</span>'}</td></tr>
  <tr><th>가맹점 운영</th><td>${m.owner} <span class="dim-t">(사업주체)</span></td><th>정산 주체</th><td>${esc(m.settle)}</td></tr></tbody></table>`)}
 <div class="foot pm3h-foot"><button class="btn lg" data-a="payList">목록</button>${acts}</div>`}

/* ---------- SCR-06 거래내역 대사 관리 (위클리 11/3: 일대사 Pass/Fail, 승인·입금 구분, 수동 병행) ---------- */
function drList(){return S.drTab==='입금'?S.dp:S.dr}
function drRows(){const f=S.dfA;return drList().filter(r=>(!f.from||r.date>=f.from)&&(!f.to||r.date<=f.to)&&(!f.pg||r.pg===f.pg)&&(!f.st||r.st===f.st)&&(!f.mode||r.mode===f.mode)).sort((a,b)=>b.date.localeCompare(a.date)||PGS.indexOf(a.pg)-PGS.indexOf(b.pg))}
const depAcct=pg=>[...new Set(S.mers.filter(m=>m.pg===pg&&m.acct).map(m=>m.acct))].join(', ');
const drFind=id=>S.dr.find(r=>r.id===id)||S.dp.find(r=>r.id===id);
function drActs(r){if(r.st==='Fail')return `<button class="lk" data-a="drFail" data-id="${r.id}">상세</button><button class="lk" data-a="drDown" data-id="${r.id}">다운로드</button>`;if(r.st==='수집대기')return `<button class="lk" data-a="drUp" data-id="${r.id}">${r.kind==='입금'?'입금 등록':'파일 등록'}</button>`;return '<span class="dim-t">-</span>'}
function vRecon(){
 const f=S.df;const dep=S.drTab==='입금';const rows=drRows();const pg=paginate(rows,'dr'+S.drTab,15);const c=k=>rows.filter(r=>r.st===k).length;const fails=rows.filter(r=>r.st==='Fail');
 const tabs=`<div class="tabs pm4-tabs" role="tablist">${[['승인','거래(승인)대사'],['입금','입금대사']].map(([k,l])=>{const n=(k==='입금'?S.dp:S.dr).filter(r=>r.st==='Fail').length;return `<button role="tab" aria-selected="${S.drTab===k}" class="${S.drTab===k?'on':''}" data-a="drTab" data-v="${k}">${l}${n?` <span class="bdg bad" style="height:20px">Fail ${n}</span>`:''}</button>`}).join('')}</div>`;
 const sts=dep?['Pass','Fail','수집대기','입금대기']:['Pass','Fail','수집대기'];
 const filt=`<form class="lst-filter" autocomplete="off" onsubmit="return false">
  <div class="lf-row">${lf('PG사',`<select data-b="df.pg">${opts(PGS.filter(k=>S.mers.some(m=>m.pg===k)),f.pg,'전체')}</select>`)}${lf('대사 결과',`<select data-b="df.st">${opts(sts,f.st,'전체')}</select>`)}${lf('수집 방식',`<select data-b="df.mode">${opts(['자동','수동'],f.mode,'전체')}</select>`)}</div>
  <div class="lf-row">${lf(dep?'입금일':'거래일',`<span class="lf-range"><input type="date" data-b="df.from" value="${f.from}" aria-label="시작일"><span aria-hidden="true">~</span><input type="date" data-b="df.to" value="${f.to}" aria-label="종료일"></span>`,'lf-wide')}<span class="lf-acts"><button type="button" class="btn dark" data-a="dfReset">초기화</button><button type="button" class="btn pri" data-a="dfSearch">조회</button></span></div></form>`;
 const head=dep?`<tr><th>입금일</th><th>거래일</th><th>PG사</th><th class="l">입금 계좌</th><th>수집</th><th class="r">거래건수</th><th class="r">정산 예정액</th><th class="r">입금액</th><th class="r">차이</th><th>결과</th><th>대사 일시</th><th>관리</th></tr>`
  :`<tr><th>거래일</th><th>PG사</th><th>수집</th><th class="r">건수 (우리 / PG)</th><th class="r">순금액 (우리)</th><th class="r">순금액 (PG)</th><th class="r">차이</th><th>결과</th><th>Fail 건</th><th>대사 일시</th><th>관리</th></tr>`;
 const body=pg.rows.map(r=>{const fl=r.st==='Fail'?'failrow':'';if(dep){const df=r.act==null?null:r.act-r.exp;return `<tr class="${fl} ${S.flash.includes(r.id)?'flash':''}"><td class="num">${r.date}</td><td class="num dim-t">${r.td}</td><td>${r.pg}</td><td class="l" style="font-size:12px;white-space:normal;min-width:160px">${esc(depAcct(r.pg))||'<span class="dim-t">미입력</span>'}</td><td>${badge(r.mode)}</td><td class="r num">${won(r.cnt)}</td><td class="r num">${won(r.exp)}</td><td class="r num">${r.act==null?'<span class="dim-t">-</span>':won(r.act)}</td><td class="r num">${diffTxt(df)}</td><td>${badge(r.st)}</td><td class="num" style="font-size:12px">${r.ranAt||'<span class="dim-t">-</span>'}</td><td class="acts">${drActs(r)}</td></tr>`}
  const df=r.pgv?r.pgv.amt-r.ours.amt:null;return `<tr class="${fl} ${S.flash.includes(r.id)?'flash':''}"><td class="num">${r.date}</td><td>${r.pg}</td><td>${badge(r.mode)}</td><td class="r num">${won(r.ours.cnt)} / ${r.pgv?won(r.pgv.cnt):'-'}</td><td class="r num">${won(r.ours.amt)}</td><td class="r num">${r.pgv?won(r.pgv.amt):'<span class="dim-t">-</span>'}</td><td class="r num">${diffTxt(df)}</td><td>${badge(r.st)}</td><td>${r.fails.length?`<b style="color:var(--bad)">${r.fails.length}</b>`:'<span class="dim-t">0</span>'}</td><td class="num" style="font-size:12px">${r.ranAt||'<span class="dim-t">-</span>'}</td><td class="acts">${drActs(r)}</td></tr>`}).join('')||`<tr><td colspan="12" class="empty">조건에 맞는 대사 결과가 없습니다.</td></tr>`;
 /* 합계 행: 결제이력 목록처럼 라벨 없이 금액만 더한다. 승인대사는 우리 건수와 순금액, 입금대사는 거래건수 · 정산 예정액 · 입금액 */
 const sum=k=>rows.reduce((a,r)=>a+(k(r)||0),0);
 const tot=!rows.length?'':dep?`<tr class="tot"><td colspan="5"></td><td class="r">${won(sum(r=>r.cnt))}</td><td class="r">${won(sum(r=>r.exp))}</td><td class="r">${won(sum(r=>r.act))}</td><td class="r">${diffTxt(sum(r=>r.act==null?0:r.act-r.exp))}</td><td colspan="3"></td></tr>`
  :`<tr class="tot"><td colspan="3"></td><td class="r">${won(sum(r=>r.ours.cnt))} / ${won(sum(r=>r.pgv&&r.pgv.cnt))}</td><td class="r">${won(sum(r=>r.ours.amt))}</td><td class="r">${won(sum(r=>r.pgv&&r.pgv.amt))}</td><td class="r">${diffTxt(sum(r=>r.pgv?r.pgv.amt-r.ours.amt:0))}</td><td colspan="4"></td></tr>`;
 return `${CR(['거래내역 대사 관리'])}<h1 class="lst-title">거래내역 대사 관리</h1>
 ${tabs}${filt}${dep?'<div class="call warn"><div>입금대사는 정산 예정액(순결제금액 - 계약 수수료)과 실제 입금액을 비교합니다. 수수료는 계약별 VAT 포함·별도, 부가세 건별·합산 설정대로 계산합니다. 정산 주기는 D+2로 가정했고(Q14), 입금 계좌는 MID별 관리용 텍스트를 그대로 보여줍니다.</div></div>':'<div class="call bad"><div><b>승인대사를 먼저 확인합니다.</b> 승인되지 않은 결제에 상품이 지급되는 위험을 막는 것이 목적입니다. Fail 중 "우리에만 있음", "상태 불일치" 건은 상품 지급 여부부터 확인하세요.</div></div>'}
 <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 ${drList().length}건</span></h2><span class="pm4-need">Pass <b style="color:var(--ok)">${c('Pass')}</b> · Fail <b style="color:var(--bad)">${c('Fail')}</b> · 수집대기 <b style="color:var(--warn)">${c('수집대기')}</b>${dep?` · 입금대기 <b>${c('입금대기')}</b>`:''}</span><div class="pm3-tools"><button class="btn sm" data-a="drDownAll" ${fails.length?'':'disabled'}>Fail 건 일괄 다운로드</button></div></div>
 <div class="tw"><table class="tbl"><thead>${head}${tot}</thead><tbody>${body}</tbody></table></div>${pg.html}
 <p class="desc dim-t">${dep?'입금대사 판정: 입금액 = 정산 예정액이면 Pass. 입금일이 오늘 이후면 입금대기.':'승인대사 판정: 건수, 순금액, 건별 상태가 모두 같으면 Pass. 자동 수집 PG는 다음 날 07:00, 수동 PG는 파일 등록 시점에 대사합니다.'}</p>`}

/* ---------- SCR-04 금융수수료 조회 (위클리 11/3: 조회 중심, PG사별 대시보드, 행별 다운로드) ---------- */
const diffTxt=v=>v==null?'<span class="dim-t">-</span>':v===0?'0':`<span class="${v>0?'pos':'neg'}">${v>0?'+':''}${won(v)}</span>`;
function feeRowsData(){const a=S.rfA;return recon(a.mon).filter(r=>(!a.pg||r.pg===a.pg)&&(!a.settle||r.m.settle===a.settle)&&(!a.mer||r.id===a.mer)&&(!a.m||r.m2===a.m)&&(!a.st||r.st===a.st)&&(!a.diff||r.diff!==0))}
function vFee(){
 const f=S.rf,a=S.rfA;let rows=sortRows(feeRowsData(),'rec',{amt:r=>r.amt,cnt:r=>r.cnt,diff:r=>Math.abs(r.diff??1e12)});
 const T={cnt:0,amt:0,exp:0,act:0,diff:0};rows.forEach(r=>{T.cnt+=r.cnt;T.amt+=r.amt;T.exp+=r.exp;if(r.act!=null){T.act+=r.act;T.diff+=r.diff}});const miss=rows.filter(r=>r.act==null).length;
 const base=recon(a.mon).filter(r=>!a.settle||r.m.settle===a.settle);
 const byPg=PGS.map(pg=>{const rs=base.filter(r=>r.pg===pg);if(!rs.length)return null;const x={pg,cnt:0,amt:0,exp:0,act:0,diff:0,bad:0,miss:0,n:rs.length};rs.forEach(r=>{x.cnt+=r.cnt;x.amt+=r.amt;x.exp+=r.exp;if(r.act!=null){x.act+=r.act;x.diff+=r.diff}else x.miss++;if(r.st==='불일치')x.bad++});return x}).filter(Boolean);
 const maxAmt=Math.max(1,...byPg.map(x=>x.amt));
 const filt=`<form class="lst-filter" autocomplete="off" onsubmit="return false">
  <div class="lf-row">${lf('정산기간(월)',`<select data-b="rf.mon">${opts([['2026-10','2026년 10월'],['2026-09','2026년 9월']],f.mon)}</select>`)}${lf('PG사',`<select data-b="rf.pg">${opts(PGS.filter(k=>S.mers.some(m=>m.pg===k)),f.pg,'전체')}</select>`)}${lf('정산 주체',`<select data-b="rf.settle">${opts([...new Set(S.mers.map(x=>x.settle).filter(Boolean))],f.settle,'전체')}</select>`)}${lf('가맹점 / MID',`<select data-b="rf.mer">${opts(S.mers.map(x=>[x.id,`${x.name} · ${x.mid}`]),f.mer,'전체')}</select>`)}</div>
  <div class="lf-row">${lf('결제수단',`<select data-b="rf.m">${opts(METHODS,f.m,'전체')}</select>`)}${lf('검증상태',`<select data-b="rf.st">${opts(RECST,f.st,'전체')}</select>`)}${lf('차액',`<label class="ck"><input type="checkbox" data-b="rf.diff" ${f.diff?'checked':''}>차액 있는 건만</label>`)}<span class="lf-acts"><button type="button" class="btn dark" data-a="rfReset">초기화</button><button type="button" class="btn pri" data-a="rfSearch">조회</button></span></div></form>
  <p class="pm4-help">정산 주체 ${tag('확인필요')} 운영 주체(PS&amp;M, M&amp;S 등)가 자기 건만 보는 구분자로 검토 중입니다. SKT 계약분 BSS 통합 여부 결정이 필요합니다 (Q15).</p>`;
 return `${CR(['PG 수수료 조회'])}<h1 class="lst-title">PG 수수료 조회</h1>${filt}
 <section class="sec"><div class="sec-h"><h3>PG사별 현황</h3><span class="hint">${a.mon.slice(0,4)}년 ${+a.mon.slice(5)}월${a.settle?` · 정산주체 ${a.settle}`:''} · 카드를 누르면 해당 PG사만 조회합니다</span></div>
 <div class="pgdash">${byPg.map(x=>`<button class="pgc ${a.pg===x.pg?'on':''}" data-a="feePg" data-v="${esc(x.pg)}"><div class="h"><b>${x.pg}</b>${x.bad?badge(`불일치 ${x.bad}`,'bad'):''}${x.miss?badge(`미수신 ${x.miss}`,'warn'):''}${!x.bad&&!x.miss?badge('모두 일치','ok'):''}</div><div class="amt">${won(x.amt)}<small>원 거래</small></div><div class="bar2"><i style="width:${Math.max(2,x.amt/maxAmt*100)}%"></i></div><dl><dt>거래건수</dt><dd>${won(x.cnt)}건</dd><dt>예상수수료</dt><dd>${won(x.exp)}</dd><dt>PG 청구수수료</dt><dd>${won(x.act)}</dd><dt>차액</dt><dd>${diffTxt(x.diff)}</dd><dt>MID × 결제수단</dt><dd>${x.n}건</dd></dl></button>`).join('')||'<div class="emptybox">해당 조건의 정산 데이터가 없습니다.</div>'}</div></section>
 <div class="pm3-bar"><h2 class="lst-count">조회 결과 <span><b>${rows.length}</b>건 / 전체 ${recon(a.mon).length}건</span></h2><span class="pm4-need">${a.mon.slice(0,4)}년 ${+a.mon.slice(5)}월 MID × 결제수단 · 불일치 <b style="color:var(--bad)">${rows.filter(r=>r.st==='불일치').length}</b> · 미수신 <b style="color:var(--warn)">${miss}</b></span><div class="pm3-tools"><button class="btn sm" data-a="csvRec">조회 결과 엑셀</button></div></div>
 <div class="tw"><table class="tbl"><thead><tr><th>PG사</th><th class="l">가맹점 / MID</th><th>정산주체</th><th>결제수단</th>${th('rec','cnt','거래건수','r')}${th('rec','amt','거래금액','r')}<th>계약요율</th><th>VAT 기준</th><th class="r">예상수수료</th><th class="r">PG 청구수수료</th>${th('rec','diff','차액','r')}<th>검증상태</th><th class="l">차이 원인 (추정)</th><th>다운로드</th></tr>${rows.length?`<tr class="tot"><td colspan="4"></td><td>${won(T.cnt)}</td><td>${won(T.amt)}</td><td colspan="2"></td><td>${won(T.exp)}</td><td>${won(T.act)}</td><td>${diffTxt(T.diff)}</td><td colspan="3"></td></tr>`:''}</thead>
 <tbody>${rows.map(r=>`<tr class="click" data-a="recModal" data-id="${r.key}" tabindex="0"><td>${r.pg}</td><td class="l">${esc(r.m.name)}<div class="sub mid">${r.m.mid}</div></td><td>${r.m.settle}</td><td>${r.m2}</td><td class="r num">${won(r.cnt)}</td><td class="r num">${won(r.amt)}</td><td>${r.fee?`${r.fee.type} ${feeTxt(r.fee)}`:'-'}</td><td style="font-size:12px">${r.c.vat}${r.c.vat==='별도'?' · '+r.c.vatMode:''}</td><td class="r num">${won(r.exp)}</td><td class="r num">${r.act==null?'<span class="dim-t">미수신</span>':won(r.act)}</td><td class="r num">${diffTxt(r.diff)}</td><td>${badge(r.st)}</td><td class="l">${r.cause?esc(r.cause):'<span class="dim-t">-</span>'}</td><td><button class="btn sm" data-a="feeRowDown" data-id="${r.key}">다운로드</button></td></tr>`).join('')||'<tr><td colspan="14" class="empty">조건에 맞는 정산 내역이 없습니다.</td></tr>'}</tbody></table></div>
 <p class="desc dim-t">행 다운로드는 해당 MID × 결제수단의 정산월 결제 건별 예상수수료 내역입니다. 계약 적용 시작일 이전 결제는 넣지 않습니다.</p>`}
/* ---------- 정책서 / IA ---------- */
function vIA(){
 const L=(r,t,sid,pop='')=>`<li><button class="lk strong" data-a="go" data-v="${r}">${t}</button><span class="sid">${sid}</span>${pop?`<span class="pop">${pop}</span>`:''}</li>`;
 const weekly=[
  ['결제 기준정보','목적: PG사·MID별 계약 수수료율 확인. 목록·상세 구성','목록 컬럼을 PG사, 결제수단, MID, 가맹점 용도, 정산 주체, 수수료, 인증키 검증, 상태, 프로모션으로 정리(사용 코너 컬럼 제외). 상세 탭은 MID 계약 정보 / 수수료 이력 / 연결 프로모션 / 변경 이력'],
  ['결제 기준정보','PG 프로모션: 카드사 프로모션·무이자 할부 전문을 데이터화해 FO 노출. 자체 콘텐츠도 노출','연결 프로모션 탭에 출처(PG 전문 / 자체)와 FO 노출 토글. [자체 콘텐츠 등록] 팝업 추가. 전문 건은 조건을 고치지 않고 노출 여부만 정함'],
  ['결제 기준정보','연결 코너: MID 매핑 구조가 아닐 수 있어 필요성 재검토','상세의 연결 코너 탭과 목록 사용 코너 컬럼 제거. 계약 정보에 참조만 남기고 확인필요 표시(Q5)'],
  ['결제 기준정보','가맹점 용도 기준값 보유 (카드사가 가맹점 번호별 용도 지정)','명칭을 "가맹점 용도"로 통일. 이동전화 가입용, PPS 충전용, 구독용 등 고정 기준값. 주문에서 실제 설정하더라도 기준정보 값과 대조해 오설정을 막는 용도'],
  ['결제 기준정보','정산 주체·입금 계좌는 관리용 텍스트','정산 주체 선택 버튼을 텍스트 입력으로 변경. MID별 입금 계좌 텍스트 추가. PG사 관리의 입금처 필드는 제거하고 입금대사는 MID 입금 계좌를 표시'],
  ['결제 기준정보','수수료 기준: VAT 포함·별도, 부가세 건별·합산 설정','결제수단 계약에 수수료 VAT와 부가세 부과 방식 추가(등록, 계약 수정). 예상수수료, 승인·입금대사 금액 계산에 반영'],
  ['결제 기준정보','PG사 등록 → 결제수단 연결. 결제수단 추가 메뉴 별도. 인증키는 PG사 기준','PG사 관리(SCR-07)와 결제수단 등록(SCR-01-1) 유지. 인증키는 PG사 관리에서만 입력. BSS 동기화는 이후 검토(Q1)'],
  ['결제 기준정보','T우주 기존 SB 참고 (등록과 기준정보 한 화면, 공통 코드 드롭다운)','가맹점 용도, 결제수단, 사업주체, 채널은 공통 코드 기반 선택값으로 둠. 목록 하단과 가맹점 상세에서 같은 등록 화면으로 연결'],
  ['결제 이력','승인 이력 중심. 승인번호 추가, 결제 항목 앞쪽','목록 순서: 결제번호, 승인번호, 승인일시, 결제수단, 금액, 상태 다음에 PG·회원·주문. 승인번호로도 검색'],
  ['결제 이력','그룹 ID = 번들 묶음 구매 단위, BSS와 맞춤','목록·상세·엑셀에 그룹 ID. 상세에 같이 구매한 상품 목록과 번들 합계. 목록 체크박스로 선택 건만 엑셀 다운로드'],
  ['결제 이력','상세: 결제 정보 → 주문 정보 → 결제 금액 → BSS 반영 → 결제 이력 → 담당자 정보','상세를 이 순서의 6개 섹션으로 재구성. 담당자 정보 항목은 시안(확인필요)'],
  ['결제 이력','승인취소 추가, 회원 조회는 BSS 가이드(체크 시 확장)','목록·상세 [승인취소]. [회원으로 조회] 체크 시 UID, 회원명 조건이 펼쳐짐. 식별 컬럼 UID + 마스킹 이름(Q17, 추후 업데이트)'],
  ['거래내역 대사','승인대사와 입금대사 모두 필요. 승인대사가 더 중요','탭 분리, 승인대사를 기본 탭으로 두고 상품 지급 위험 안내 표시'],
  ['거래내역 대사','PG사 등록 시 대사 연동 정보. 매일 자동 Pass/Fail, Fail만 확인·다운로드','PG사 등록에 대사 연동 정보(연동 방식, 수신 주기, 연동 경로). Fail 행에만 상세·다운로드'],
  ['거래내역 대사','수동 파일 흐름은 자동 미제공 PG용으로 유지(투트랙)','연동 방식이 수동 파일인 PG는 수집대기 후 파일 등록으로 대사. PG사별 제공 방식 확인 필요(Q9)'],
  ['PG 수수료','후속 처리 팝업 불필요. 상단 PG사별 현황, 하단 조회, 행별 다운로드','처리 팝업 없이 읽기 전용 상세만. PG사별 카드, 조회 결과, 행별 다운로드'],
  ['PG 수수료','메뉴명 PG 수수료 조회','메뉴명을 PG 수수료 조회로 변경 (Q16 반영)']];
 const open=[
  ['MID 체계','PG사 가맹점 ID 아래 서브 MID 2단 체계','등록·상세에 "MID 체계" 자리만 비활성으로 둠. 기획팀 T우주 가맹점 정리 자료 수령 후 확정','Q13'],
  ['PG 수수료 조회 구분','운영 주체(PS&M, M&S 등)별 자기 건 조회, SKT 계약분 BSS 통합 여부','정산 주체 조회조건을 구분자로 둠. 권한별 자동 필터는 미적용','Q15'],
  ['연결 코너','결제 코너-MID 매핑 필요성','참조 건수만 표시','Q5'],
  ['회원 조회','BSS 가이드 기준 조회 조건과 식별 컬럼','UID, 회원명만 노출하는 시안','Q17'],
  ['대사 연동','PG사별 대사 데이터 제공 방식','KCP는 수동 파일, 나머지는 API·SFTP로 가정','Q9'],
  ['VAT 계산','원 단위 반올림 기준','건별은 건마다 반올림, 합산은 월 합계에서 반올림으로 가정','Q7']];
 const prev=[['메뉴 구조','결제 관리 아래 같은 1Depth. 중간 폴더 없음','확정'],['결제 코너','결제 BO에 메뉴·화면 없음. 외부 Mock을 읽기만 함','확인필요'],['상품-MID 매핑, LV2, 노출 우선순위','결제 BO 범위에서 제외','확정'],['요율 변경','적용시작일별 이력, 적용 시작된 요율은 수정 불가','확정'],['결제수단 목록','첨부 payment-method3 구조(조회조건 3줄, 확인 항목, 하단 등록 버튼)','제안'],['결제수단 상세','기본 정보 / 수수료 이력 / 프로모션 / 연결 코너 / 변경이력','제안'],['프로모션','PG·결제사 수신, 읽기 전용, 없으면 탭 비활성','제안']];
 const rules=[['PG사 1 : N 가맹점(MID)','같은 PG에서 MID는 유일 (V01). PG사는 채널이 직접 등록'],['인증키는 PG사 단위','PG사 관리에서만 입력·확인. 같은 PG의 MID는 모두 같은 키를 씀 (V03, V05)'],['가맹점(MID) 1 : N 결제수단 계약','같은 MID에 같은 결제수단은 1건 (V02). 정산주체, 유효기간, 운영상태, 가맹점 용도는 MID 단위'],['가맹점 용도는 기준값','고정 기준값 중 사용 값에서 선택 (V11). 가맹점명은 화면 표시용'],['결제수단은 결제유형-결제수단명','간편결제 4종(SK pay, 카카오페이, 네이버페이, 토스페이), 일반결제 3종(SK pay, 토스페이먼츠, SK pay VAN). 신용카드·계좌이체·가상계좌·휴대폰결제는 일반결제의 계약 세부수단이며 일반결제는 세부수단 1개 이상 필수. 세부수단별 수수료는 수수료 행의 적용 대상으로 관리'],['수수료는 결제수단 계약 단위, 적용 시작일별 이력','적용이 시작된 요율은 수정 불가, 새 시작일로 추가 (V06)'],['결제 코너 1 : N 항목, 항목 = 결제수단 + MID','결제 BO 밖에서 관리, BO는 참조만'],['결제는 결제번호 기준, 결제 시점 값 저장','컨테이너, 코너, PG, MID, 요율을 저장. 기준정보가 바뀌어도 정산 기준은 그대로'],['일대사','승인대사(건수·순금액·건별 상태)와 입금대사(정산 예정액 vs 입금액)를 PG사 × 일 단위로 판정. Fail만 상세·다운로드'],['금융수수료','계약 적용 시작일 이후 결제만. 결제일 요율로 계산. 조회 전용']];
 const V=[['V01','같은 PG 안 MID 중복 금지','결제수단 등록','제안'],['V02','MID + 결제수단 계약은 1건','결제수단 등록','확정'],['V03','PG 인증키는 유효성 확인(또는 수동 확인) 후 저장','PG사 관리','확정'],['V04','키를 고치면 미확인으로 초기화','PG사 관리','확정'],['V05','MID 등록·결제수단 추가 시 키 입력 없음','결제수단 등록','확정'],['V06','적용 시작된 요율 직접 수정 금지, 새 행 추가','수수료','확정'],['V07','적용 시작일은 오늘 이후, 기존 행보다 뒤','등록, 수수료','제안'],['V08','정률 10% 이하, 기준값 0 초과','등록, 수수료','제안'],['V09','유효기간 종료 ≥ 시작','등록, 수정','제안'],['V10','같은 PG + 결제수단에 같은 용도명 금지','등록, 수정','제안'],['V11','가맹점 용도는 사용 중 기준값에서 필수 선택','등록, MID 수정','확정'],['V12','PG 키 미확인 PG의 MID·계약은 사용 불가','등록, 상태 변경','제안'],['V13','운영상태 변경 사유 필수','상태 변경','제안'],['V14','코너 영향이 있으면 영향·대체 MID 안내 후 확인 체크','상태 변경','확정'],['V15','프로모션은 수신 데이터 읽기 전용','결제수단 상세','제안'],['V16','연결된 프로모션이 없으면 탭 비활성','결제수단 상세','제안'],['V17','사용 중인 MID가 있는 PG사는 미사용 불가','PG사','제안'],['V18','PG 코드 영문 대문자·숫자 2~6자, 중복 불가. 계약이 있는 지원 결제수단은 해제 불가','PG사 관리','제안'],['V20','합계에서 결제실패 제외','결제이력','확정'],['V21','결과 미확인은 PG 재조회 전 승인취소 불가','결제이력','제안'],['V22','부분 승인취소 1원 이상, 취소 가능 금액 이하. 전액이면 전체 승인취소','승인취소','제안'],['V23','BSS 반영대기 거래는 반영 확인 뒤 승인취소','승인취소','제안'],['V24','가상계좌 승인취소, 휴대폰결제 부분 승인취소는 BO에서 막음','승인취소','확인필요'],['V25','재조회·승인취소·BSS 요청은 회차와 결과를 처리 이력에 기록','결제이력','확정'],['V30','승인대사: 건수, 순금액, 건별 상태가 모두 같으면 Pass','거래대사','확정'],['V31','Fail 행만 상세·다운로드, Pass는 확인 대상 아님','거래대사','확정'],['V32','수동 PG는 파일 등록 시 같은 기준으로 대사, 등록 전은 수집대기','거래대사','확정'],['V33','입금대사: 입금액 = 정산 예정액(순결제 - 계약 수수료)이면 Pass','거래대사','제안'],['V40','금융수수료는 조회 전용. 확인완료 등 후처리 없음','금융수수료','확정'],['V41','VAT, 부가세, 반올림은 확정값 없이 확인필요 표시','금융수수료','확정'],['V42','행 다운로드 단위는 MID × 결제수단 × 정산월 결제 건','금융수수료','제안'],['V43','부가세 부과 방식(건별·합산)은 VAT 별도일 때만 선택','결제수단 등록, 계약 수정','확정'],['V44','일반결제 계약은 세부수단 1개 이상','결제수단 등록, 계약 수정','확정'],['V45','정산 주체는 필수 텍스트, 입금 계좌는 선택 텍스트','결제수단 등록, 가맹점 상세','확정'],['V46','PG 전문 프로모션은 조건 수정 불가, FO 노출 여부만 변경','결제수단 상세','확정']];
 const STT=[['PG사','사용 / 미사용, 등록 구분(기본 / 채널 등록), 대사 수집(자동 / 수동)'],['인증키 (PG사)','확인완료 / 수동확인 / 미확인 / 확인실패'],['운영상태 (MID, 계약)','사용 / 일시중지 / 미사용. 계약은 MID 상태와 적용 시작일을 함께 봄 (MID 미사용, 적용 예정)'],['가맹점 용도','사용 / 미사용'],['수수료 행','적용예정 / 적용중 / 이력'],['결제상태','결제완료 / 결과미확인 / 부분취소 / 승인취소 / 결제실패'],['BSS 반영','반영완료 / 반영대기 / 반영실패 / 불일치 (상세에서만 표시)'],['일대사','Pass / Fail / 수집대기(수동 PG 미등록) / 입금대기(입금일 도래 전)'],['수수료 검증','일치 / 불일치 / 미수신']];
 const API=[['GET/POST/PATCH','/payment/pgs','PG사 조회·등록·수정 (채널 직접 등록)'],['POST','/payment/pgs/{code}/key-verify','PG 인증키 확인. 키 원문은 이 요청에만 싣고 저장·로그 금지'],['POST','/payment/pgs/sync-bss','BSS 동기화 (이후 검토, Q1)'],['GET/POST/PATCH','/payment/mid-uses','가맹점 용도 기준값'],['GET/POST/PATCH','/payment/merchants, /payment/contracts','MID, 결제수단 계약 (서버에서 V01, V02 재검증)'],['POST/PATCH','/payment/contracts/{id}/fees','수수료 행 추가. 적용예정만 수정·삭제'],['GET','/payment/contracts/{id}/promotions','계약에 연결된 프로모션 (Q11)'],['GET','/payment/payments?payNo=&memberUid=','결제이력 (결제번호 기준), 회원 조회 (Q17)'],['POST','/payment/payments/{payNo}/pg-inquiry','PG 재조회'],['POST','/payment/payments/{payNo}/approval-cancel','승인취소 (전체·부분)'],['GET','/payment/recon/approval?from=&to=&pg=','일 승인대사 결과'],['GET','/payment/recon/deposit?from=&to=&pg=','일 입금대사 결과'],['POST','/payment/recon/{id}/upload','수동 PG 파일·입금 내역 등록 후 대사'],['GET','/payment/recon/{id}/fails.csv','Fail 건 다운로드'],['GET','/payment/pg-fees?month=&settle=','금융수수료 조회, PG사별 집계'],['GET','/payment/pg-fees/{id}/rows.csv','행별 다운로드'],['GET','/external/corners?merchantId=&method=','결제 코너 참조 (외부, Q5)']];
 const DEMO=[['A','기존 MID에 결제수단 추가','결제수단 등록 › KG이니시스 › 간편결제-카카오페이 › 기존 MID INIpayHP07 › 키 입력 없음 › 수수료 › 저장'],['B','PG사 인증키 실패 후 성공','PG사 관리 › 나이스페이(채널 등록, 키 미확인) › 시크릿 키에 FAIL 입력 후 확인(저장 차단) › 키 수정(미확인) › 재확인 › 저장'],['C','적용 중 요율 수정 차단','KCPacc0301 일반결제-SK pay VAN 수수료 › 적용중 행 [수정] › 차단 안내 › 새 적용 시작일 행 저장'],['D','같은 MID + 결제수단 중복','결제수단 등록 › KG이니시스 › 일반결제-SK pay › 기존 MID INIpayTM01 선택 시 중복 오류'],['E','사용 중 MID 일시중지','tosstu0401 수정 › 운영상태 일시중지 › 사유 › 저장 › 결제 코너 영향 안내 확인'],['P','결제수단별 프로모션','tosstu0401 간편결제-SK pay 상세 › 프로모션 탭. KCPacc0301 간편결제-SK pay는 탭 비활성'],['F','결과 미확인 재조회와 승인취소','결제 상세 › PG 재조회(결제완료 확정) › 11/01 토스 승인대사 Fail → Pass 재대사 › [승인취소]'],['G','수동 PG 파일 등록 후 대사','거래대사 › NHN KCP 수집대기 행 › [파일 등록] › 대사 실행 › Fail이면 상세·다운로드'],['H','PG사별 수수료 현황','금융수수료 조회 › PG사 카드로 거르기 › 행 [다운로드] › 상세(읽기 전용)']];
 return `${CR(['정책서 / IA'])}${ph('정책서 / IA','<span class="dim-t" style="font-size:12px">v0.2.2 · 2026-11-03 최종 회의록 반영</span><button class="btn sm" data-a="resetAll">목업 데이터 초기화</button>')}
 <p class="desc">결제 BO는 PG사, 결제수단, MID, 인증키, 수수료 기준정보와 결제이력, 거래대사, PG 수수료 조회를 관리합니다. 상품에 어떤 결제수단을 어떤 MID로 보여줄지는 결제 코너가 정하며, 결제 코너의 관리 주체는 아직 정해지지 않았습니다. 이 문서는 'NOVA 결제관리 프로토타입 AI 프롬프트 v1.1'과 11/3 최종 회의록을 기준으로 합니다. 둘이 다르면 회의록을 따랐습니다.</p>
 <div class="call ac"><div>표기: ${tag('확정')} 결정된 정책 · ${tag('제안')} 기획 기준으로 정한 값 · ${tag('확인필요')} 결정 주체가 따로 있거나 미정. 화면마다 HTML이 따로 있고 스크립트는 src/payment4.ts 하나입니다. React 이관 시 화면 함수(v*) 단위로 나누면 됩니다.</div></div>
 <section class="sec"><div class="sec-h"><h3>11/3 최종 회의록 반영</h3></div><table class="tbl flowmap"><thead><tr><th>영역</th><th class="l">결정</th><th class="l">프로토타입 반영</th></tr></thead><tbody>${weekly.map(r=>`<tr><td><b>${r[0]}</b></td><td class="l">${r[1]}</td><td class="l">${r[2]}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>남은 검토 사항</h3><span class="hint">결정 전까지 화면에 자리만 두고 ${tag('확인필요')}로 표시했습니다</span></div><table class="tbl flowmap"><thead><tr><th>항목</th><th class="l">검토 내용</th><th class="l">현재 프로토타입 처리</th><th>Q</th></tr></thead><tbody>${open.map(r=>`<tr><td><b>${r[0]}</b></td><td class="l">${r[1]}</td><td class="l">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>데이터 Hierarchy</h3></div>
 <div class="hier">
  <div class="hb k"><h4>PG사</h4><span class="n">${PGS.length}개 · 채널 직접 등록</span><ul><li>인증키 (PG 단위)</li><li>지원 결제수단</li><li>대사 연동 정보 (연동 방식, 주기, 경로)</li></ul></div><div class="ha">1 : N</div>
  <div class="hb k"><h4>가맹점 (MID)</h4><span class="n">${S.mers.length}개</span><ul><li>가맹점 용도 (기준값)</li><li>가맹점명, PG 등록 상호</li><li>정산 주체·입금 계좌 (텍스트)</li><li>사업주체, 채널, 유효기간</li></ul></div><div class="ha">1 : N</div>
  <div class="hb k"><h4>결제수단 계약</h4><span class="n">${S.ctrs.length}건</span><ul><li>MID × 결제수단</li><li>세부수단, 적용 시작일</li><li>수수료 이력, VAT 기준</li><li>연결 프로모션 (PG 전문 / 자체)</li></ul></div><div class="ha">참조<small>외부</small></div>
  <div class="hb" style="border-style:dashed"><h4>결제 코너 (외부)</h4><span class="n">${S.corners.length}개 · 관리 주체 미정 · 매핑 필요성 재검토</span><ul><li>항목 = 결제수단 + MID</li><li>BO는 읽기만</li></ul></div><div class="ha">1 : N</div>
  <div class="hb"><h4>결제 / 대사 / 수수료</h4><span class="n">결제 ${S.pays.length} · 일대사 ${S.dr.length + S.dp.length}</span><ul><li>결제번호, 승인번호, 그룹 ID</li><li>PG사 × 일 Pass/Fail</li><li>계약 이력으로 수수료 계산</li></ul></div>
 </div></section>
 <section class="sec"><div class="sec-h"><h3>IA</h3></div><div class="ia-tree"><ul>
  <li class="g">결제 관리<ul>${L('base','결제수단 기준정보 관리','SCR-01','1차 · 결제수단 상세 SCR-02, 가맹점 상세 SCR-03, 계약 수정 POP-01, 수수료 POP-02, 코너 영향 안내 POP-04')}${L('reg','결제수단 등록','SCR-01-1','1차 · 기준정보 관리 목록의 [결제수단 등록]으로 진입 (메뉴 없음)')}${L('pgm','PG사 관리','SCR-07','1차 · 메뉴 신설 · 등록/수정 SCR-07-1 (인증키)')}${L('pay','결제이력 관리','SCR-05','2차 · 결제 상세 SCR-05-1, 승인취소 POP-05')}${L('recon','거래내역 대사 관리','SCR-06','2차 · 탭: 승인대사 / 입금대사 · Fail 상세 POP-06, 수동 등록 POP-07')}${L('fee','PG 수수료 조회','SCR-04','2차 · 상세 POP-09')}</ul></li>
  <li class="g" style="margin-top:8px">기획 참고<ul>${L('ia','정책서 / IA','REF')}</ul></li></ul></div>
  <p class="desc dim-t">결제 코너 관리, 상품 결제수단 노출·우선순위, 상품-MID 직접 매핑, 상품유형 LV2 매핑은 만들지 않습니다.</p></section>
 <section class="sec"><div class="sec-h"><h3>이전 반영 내역 요약</h3></div><table class="tbl"><thead><tr><th class="l">항목</th><th class="l">내용</th><th>구분</th></tr></thead><tbody>${prev.map(r=>`<tr><td class="l"><b>${r[0]}</b></td><td class="l">${r[1]}</td><td>${tag(r[2])}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>정책 규칙</h3></div><table class="tbl"><thead><tr><th style="width:60px">No</th><th class="l">규칙</th><th class="l">내용</th></tr></thead><tbody>${rules.map((r,i)=>`<tr><td>${i+1}</td><td class="l"><b>${r[0]}</b></td><td class="l">${r[1]}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>검증 규칙</h3></div><table class="tbl"><thead><tr><th style="width:64px">코드</th><th class="l">규칙</th><th>적용 화면</th><th>구분</th></tr></thead><tbody>${V.map(r=>`<tr><td class="mid">${r[0]}</td><td class="l">${r[1]}</td><td>${r[2]}</td><td>${tag(r[3])}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>상태 정의</h3></div><table class="tbl"><thead><tr><th class="l" style="width:220px">구분</th><th class="l">값</th></tr></thead><tbody>${STT.map(r=>`<tr><td class="l"><b>${r[0]}</b></td><td class="l">${r[1]}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>확인 필요 (Open Issue)</h3></div><table class="tbl"><thead><tr><th style="width:60px">No</th><th class="l">항목</th><th class="l">현재 처리</th></tr></thead><tbody>${QS.map(q=>`<tr><td>${q.n}</td><td class="l"><b>${q.t}</b></td><td class="l">${q.b}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>API 연동 포인트</h3><span class="hint">초안. 현재는 Mock으로 동작</span></div><table class="tbl"><thead><tr><th style="width:120px">Method</th><th class="l">경로</th><th class="l">용도</th></tr></thead><tbody>${API.map(r=>`<tr><td>${r[0]}</td><td class="l mid">${r[1]}</td><td class="l">${r[2]}</td></tr>`).join('')}</tbody></table></section>
 <section class="sec"><div class="sec-h"><h3>시연 시나리오</h3><span class="hint">[시연]을 누르면 시작 지점으로 이동합니다. 처음 상태로 돌리려면 [목업 데이터 초기화]</span></div><table class="tbl"><thead><tr><th style="width:60px"></th><th class="l">시나리오</th><th class="l">흐름</th><th style="width:90px"></th></tr></thead><tbody>${DEMO.map(r=>`<tr><td><b>${r[0]}</b></td><td class="l"><b>${r[1]}</b></td><td class="l">${r[2]}</td><td><button class="btn sm" data-a="demo" data-v="${r[0]}">시연</button></td></tr>`).join('')}</tbody></table></section>`}
/* ================= 모달 ================= */
function impactBody(imp){return `<div class="tw"><table class="tbl"><thead><tr><th class="l">결제 코너 (외부)</th><th>결제수단</th><th class="l">현재 가맹점</th><th>변경 후 상태</th><th class="l">대체 MID 후보 (안내)</th></tr></thead><tbody>${imp.map(x=>{const cand=altFor(x.it.m,x.it.mer);return `<tr><td class="l">${x.cn.ctn} / <b>${esc(x.cn.name)}</b><div class="sub">${x.cn.id}</div></td><td>${x.it.m}</td><td class="l">${esc(merLabel(mer(x.it.mer)))}</td><td>${badge(x.to)}</td><td class="l" style="font-size:12px">${cand.length?cand.map(m=>`<div>${esc(m.name)} · ${m.mid} <span class="dim-t">(${PGM[m.pg].short})</span></div>`).join(''):'<span style="color:var(--bad)">후보 없음. 이 결제수단이 코너에서 빠질 수 있습니다.</span>'}</td></tr>`}).join('')}</tbody></table></div>`}
const MODALS={
 fee(md){const c=ctr(md.id);const m=mer(c.mer);return {t:`수수료: ${m.pg} › ${c.m} › ${m.mid}`,w:'w9',b:`${md.block?`<div class="call bad" style="margin-top:0"><div><b>적용이 시작된 요율은 직접 수정할 수 없습니다 (V06).</b><br>${esc(md.block)}</div></div>`:''}<p class="dim-t" style="margin:0 0 12px">적용이 시작된 수수료는 이력으로 보관합니다. 요율이 바뀌면 새 적용 시작일로 행을 추가합니다. 저장하면 바로 반영되고 변경이력이 남습니다.</p>${feeRows('modal.fees',md.fees,c.subs,true)}${errBox(md.err)}`,f:`<button class="btn" data-a="closeModal">취소</button><button class="btn pri" data-a="feeSave">저장</button>`}},
 ctr(md){const c=ctr(md.id);const m=mer(c.mer);return {t:`결제수단 계약 수정: ${c.m} · ${m.mid}`,w:'w5',b:`<table class="ft"><tbody><tr><th>PG / MID</th><td>${m.pg} / ${m.mid}<div class="sub">${esc(m.name)}</div></td></tr>
  ${SUBS[c.m]?`<tr><th>계약 세부수단</th><td><div class="ck-g">${SUBS[c.m].map(s=>`<label><input type="checkbox" data-a="mSub" data-v="${s}" ${md.subs.includes(s)?'checked':''}>${s}</label>`).join('')}</div></td></tr>`:''}
  <tr><th>적용 시작일</th><td>${c.start} <span class="dim-t">(변경 불가)</span></td></tr><tr><th>수수료 VAT</th><td>${radios('modal.vat',[['포함','VAT 포함'],['별도','VAT 별도']],md.vat,null,'data-r')}</td></tr><tr><th>부가세 부과</th><td>${radios('modal.vatMode',[['건별','건별'],['합산','합산']],md.vatMode,null,md.vat==='별도'?'':'disabled')}</td></tr><tr><th>운영상태</th><td>${radios('modal.ops',['사용','일시중지'],md.ops)}</td></tr><tr><th>변경 사유</th><td><input class="inp wide" data-b="modal.reason" value="${esc(md.reason||'')}" placeholder="운영상태를 바꿀 때 필수"></td></tr></tbody></table>${errBox(md.err)}`,f:`<button class="btn" data-a="closeModal">취소</button><button class="btn pri" data-a="ctrSave">저장</button>`}},
 impact(md){return {t:'결제 코너 영향 안내',w:'w9',b:`<p style="margin:0 0 12px">${md.label} 외부 결제 코너 항목 <b>${md.imp.length}건</b>이 FO에서 빠질 수 있습니다.</p><div class="call warn" style="margin-top:0"><div>결제 코너는 결제 BO가 관리하지 않습니다(Q5). 아래 대체 MID 후보는 안내용이며, 코너 반영은 코너 관리 도메인에서 합니다.</div></div>${impactBody(md.imp)}<label class="ck" style="margin-top:14px"><input type="checkbox" data-b="modal.ack" data-r ${md.ack?'checked':''}>영향받는 코너와 대체 MID 안내를 확인했습니다 (V14)</label>`,
  f:`<button class="btn" data-a="closeModal">취소</button><button class="btn pri" data-a="impactOk" ${md.ack?'':'disabled'}>확인 후 저장</button>`}},
 hist(md){return {t:md.title,w:'w9',b:histTable(S.hist,false),f:`<button class="btn" data-a="closeModal">닫기</button>`}},
 promo(md){const c=ctr(md.id);const m=mer(c.mer);return {t:`프로모션 콘텐츠 등록: ${c.m} · ${m.mid}`,w:'w9',b:`<p class="desc" style="margin-top:0">PG 전문으로 오지 않는 자체 제작 콘텐츠를 등록합니다. 이 결제수단 계약(${esc(m.name)})에 연결돼 FO에 노출됩니다.</p><table class="ft"><tbody>
  <tr><th class="req">유형</th><td>${radios('modal.kind',['안내','즉시할인','청구할인','무이자 할부','적립'],md.kind)}</td></tr>
  <tr><th class="req">대상</th><td><input class="inp wide" data-b="modal.target" value="${esc(md.target)}" placeholder="예: T우주 구독 카드 결제"></td></tr>
  <tr><th class="req">혜택 문구</th><td><input class="inp wide" data-b="modal.benefit" value="${esc(md.benefit)}" placeholder="FO에 노출할 문구"></td></tr>
  <tr><th>조건</th><td><input class="inp wide" data-b="modal.cond" value="${esc(md.cond)}" placeholder="예: 5만원 이상"></td></tr>
  <tr><th class="req">기간</th><td><span class="rng"><input type="date" class="inp" data-b="modal.from" value="${md.from}">~<input type="date" class="inp" data-b="modal.to" value="${md.to}"></span></td></tr>
  <tr><th>FO 노출</th><td>${radios('modal.fo',['Y','N'],md.fo)}</td></tr></tbody></table>${errBox(md.err)}`,f:`<button class="btn" data-a="closeModal">취소</button><button class="btn pri" data-a="promoSave">등록</button>`}},
 cancel(md){const p=pay(md.no);const can=p.amt-p.cancel;const partOk=p.sub!=='휴대폰결제';const amt=md.ct==='all'?can:Number(md.amt||0);
  return {t:`승인취소: ${p.no}`,w:'w5',b:md.busy?'<div class="emptybox"><h4>PG에 승인취소를 요청하고 있습니다</h4>잠시 기다리세요.</div>':`<dl class="kv"><dt>결제번호</dt><dd class="mid">${p.no}</dd><dt>회원</dt><dd>${p.uid} · ${p.mbr}</dd><dt>결제금액</dt><dd>${won(p.amt)}원</dd><dt>이미 승인취소</dt><dd>${won(p.cancel)}원</dd><dt>취소 가능</dt><dd><b style="color:var(--ac)">${won(can)}원</b></dd></dl>
  <table class="ft" style="margin-top:14px"><tbody><tr><th class="req">취소 유형</th><td>${radios('modal.ct',partOk?[['all','전체 승인취소'],['part','부분 승인취소']]:[['all','전체 승인취소']],md.ct,null,'data-r')}${partOk?'':'<div class="sub">휴대폰결제는 부분 승인취소를 막아 두었습니다 (V24, Q8).</div>'}</td></tr>
  ${md.ct==='part'?`<tr><th class="req">취소 금액</th><td><span class="unit"><input class="inp num" style="width:140px" data-b="modal.amt" data-c="cAmt" value="${esc(md.amt)}"><em>원</em></span></td></tr>`:''}
  <tr><th class="req">취소 사유</th><td>${radios('modal.reason',['고객 요청','중복 결제','상품 문제','기타'],md.reason,null,'data-r')}</td></tr>
  <tr><th>메모</th><td><input class="inp wide" data-b="modal.memo" value="${esc(md.memo)}" placeholder="${md.reason==='기타'?'기타 사유 필수':'선택 입력'}"></td></tr></tbody></table>
  <p class="dim-t" style="margin-top:12px">PG에 승인취소를 요청합니다. 결과는 처리 이력에 남고, BSS 반영대기로 바뀝니다.</p>${errBox(md.err)}`,
  f:`<button class="btn" data-a="closeModal" ${md.busy?'disabled':''}>닫기</button><button class="btn pri" data-a="cancelSave" ${md.busy?'disabled':''}>${won(amt)}원 승인취소</button>`}},
 rec(md){const r=recon(md.mon).find(x=>x.key===md.id);const c=r.c;const mEnd=md.mon+'-31';
  const fs=[...c.fees].sort((a,b)=>(a.sub||'').localeCompare(b.sub||'')||a.start.localeCompare(b.start));
  const sample=r.pays.slice(0,5).map((p,i)=>{const e=payFee(p);return {p,e,b:r.act==null?null:e+(i===0?r.diff:0)}});
  const extra=r.cause==='취소 수수료 처리'?3:0;
  return {t:`수수료 상세: ${esc(r.m.name)} · ${r.m2}`,w:'w9',b:`<dl class="kv"><dt>정산월</dt><dd>${md.mon}</dd><dt>PG / MID</dt><dd>${r.pg} / ${r.m.mid}</dd><dt>정산주체</dt><dd>${r.m.settle}</dd><dt>계약 기준일</dt><dd>${r.start} 이후 결제</dd><dt>검증상태</dt><dd>${badge(r.st)}${r.cause?` <span class="dim-t">${esc(r.cause)}${r.st==='불일치'?' (추정)':''}</span>`:''}</dd></dl>
   <div class="call warn"><div>조회 전용입니다. 확인완료 같은 후처리는 하지 않습니다. VAT 포함 여부, 부가세 부과 기준, 반올림은 확인 필요입니다 (Q7).</div></div>
   <h4>계약 수수료 이력</h4><table class="tbl"><thead><tr><th>적용 대상</th><th>구분</th><th>기준값</th><th>적용 시작일</th><th>상태</th><th>이 정산월</th></tr></thead><tbody>${fs.map(f=>{const nx=fs.find(x=>(x.sub||'')===(f.sub||'')&&x.start>f.start);const hit=f.start<=mEnd&&(!nx||nx.start>md.mon+'-01');return `<tr><td>${f.sub||'기본'}</td><td>${f.type}</td><td class="num">${feeTxt(f)}</td><td class="num">${f.start}</td><td>${badge(feeState(c.fees,f))}</td><td>${hit?badge('적용','ac'):'<span class="dim-t">-</span>'}</td></tr>`}).join('')}</tbody></table>
   <h4>건별 계산 근거 <span class="dim-t" style="font-weight:400">표본 ${sample.length}건 / 전체 ${won(r.cnt)}건</span></h4><table class="tbl"><thead><tr><th>결제번호</th><th>결제일</th><th class="r">순결제금액</th><th>요율</th><th class="r">예상</th><th class="r">PG 청구</th><th class="r">차이</th></tr></thead><tbody>${sample.map(x=>{const d=x.b==null?null:x.b-x.e;return `<tr><td class="mid">${x.p.no}</td><td class="num">${x.p.at.slice(0,10)}</td><td class="r num">${won(netAmt(x.p))}</td><td>${feeTxt(feeAt(c,x.p.at.slice(0,10)))}</td><td class="r num">${won(x.e)}</td><td class="r num">${x.b==null?'<span class="dim-t">-</span>':won(x.b)}</td><td class="r num">${diffTxt(d)}</td></tr>`}).join('')}</tbody></table>
   <h4>PG 청구 데이터 비교</h4>${r.act==null?'<div class="call warn" style="margin:0"><div>PG 청구 데이터를 아직 받지 못했습니다. 수신 주기는 확인 필요입니다 (Q10).</div></div>'
   :`<table class="tbl"><thead><tr><th class="l">항목</th><th class="r">예상 (계약 기준)</th><th class="r">PG 청구</th><th class="r">차이</th></tr></thead><tbody><tr><td class="l">거래건수</td><td class="r num">${won(r.cnt)}</td><td class="r num">${won(r.cnt+extra)}</td><td class="r num">${diffTxt(extra)}</td></tr><tr><td class="l">거래금액</td><td class="r num">${won(r.amt)}</td><td class="r num">${won(r.amt)}</td><td class="r num">0</td></tr><tr><td class="l">수수료</td><td class="r num">${won(r.exp)}</td><td class="r num">${won(r.act)}</td><td class="r num">${diffTxt(r.diff)}</td></tr></tbody></table>${extra?`<p class="dim-t" style="margin:6px 0 0">PG 청구 건수가 ${extra}건 많습니다. 취소 거래에 수수료를 매긴 것으로 보입니다.</p>`:''}`}`,
   f:`<button class="btn" data-a="feeRowDown" data-id="${r.key}">이 행 다운로드</button><button class="btn" data-a="closeModal">닫기</button>`}},
 drFail(md){const r=drFind(md.id);const dep=r.kind==='입금';
  const head=`<dl class="kv"><dt>${dep?'입금일':'거래일'}</dt><dd>${r.date}${dep?` <span class="dim-t">(거래일 ${r.td})</span>`:''}</dd><dt>PG사</dt><dd>${r.pg}</dd><dt>수집 방식</dt><dd>${badge(r.mode)}${r.file?` <span class="dim-t">${esc(r.file)}</span>`:''}</dd><dt>대사 일시</dt><dd>${r.ranAt} · ${esc(r.by)}</dd>${dep?`<dt>입금 계좌</dt><dd>${esc(depAcct(r.pg))||'<span class="dim-t">미입력</span>'} ${tag('확인필요')}</dd>`:''}</dl>`;
  const body=dep?`<h4>정산 예정액 계산</h4><table class="tbl"><thead><tr><th class="l">항목</th><th class="r">금액</th></tr></thead><tbody><tr><td class="l">순결제금액 (${won(r.cnt)}건)</td><td class="r num">${won(r.net)}</td></tr><tr><td class="l">PG 수수료 (계약 기준, VAT 미반영)</td><td class="r num">-${won(r.fee)}</td></tr><tr><td class="l"><b>정산 예정액</b></td><td class="r num"><b>${won(r.exp)}</b></td></tr><tr><td class="l">실제 입금액</td><td class="r num">${won(r.act)}</td></tr><tr><td class="l"><b>차이</b></td><td class="r num">${diffTxt(r.act-r.exp)}</td></tr></tbody></table>
   <h4>Fail 내용</h4><table class="tbl"><thead><tr><th>유형</th><th class="l">설명</th><th class="r">정산 예정</th><th class="r">입금</th><th class="r">차이</th></tr></thead><tbody>${r.fails.map(x=>`<tr><td>${badge(x.type,'bad')}</td><td class="l">${esc(x.desc)}</td><td class="r num">${won(x.exp)}</td><td class="r num">${won(x.act)}</td><td class="r num">${diffTxt(x.diff)}</td></tr>`).join('')}</tbody></table>
   <p class="dim-t" style="margin-top:10px">수수료 차감 차이, 정산 보류, 입금 지연이 흔한 원인입니다. 정산 주기(Q14)와 VAT 반영 기준(Q7)이 정해지면 판정식을 다시 맞춥니다.</p>`
  :`<h4>요약</h4><table class="tbl"><thead><tr><th class="l">항목</th><th class="r">우리</th><th class="r">PG</th><th class="r">차이</th></tr></thead><tbody><tr><td class="l">건수</td><td class="r num">${won(r.ours.cnt)}</td><td class="r num">${won(r.pgv.cnt)}</td><td class="r num">${diffTxt(r.pgv.cnt-r.ours.cnt)}</td></tr><tr><td class="l">순금액</td><td class="r num">${won(r.ours.amt)}</td><td class="r num">${won(r.pgv.amt)}</td><td class="r num">${diffTxt(r.pgv.amt-r.ours.amt)}</td></tr></tbody></table>
   <h4>Fail 건 ${r.fails.length}건</h4><table class="tbl"><thead><tr><th>결제번호</th><th>PG 거래번호</th><th>유형</th><th>우리 상태</th><th>PG 상태</th><th class="r">우리 금액</th><th class="r">PG 금액</th><th class="r">차이</th></tr></thead><tbody>${r.fails.map(x=>`<tr><td>${x.no==='-'?'<span class="dim-t">없음</span>':`<button class="lk mid" data-a="payDetail" data-id="${x.no}">${x.no}</button>`}</td><td class="mid">${x.tid}</td><td>${badge(x.type,'bad')}</td><td>${x.ourSt}</td><td>${x.pgSt}</td><td class="r num">${won(x.our)}</td><td class="r num">${won(x.pg)}</td><td class="r num">${diffTxt(x.pg-x.our)}</td></tr>`).join('')}</tbody></table>
   <p class="dim-t" style="margin-top:10px">결과 미확인 건은 결제이력 관리에서 PG 재조회하면 이 일대사를 다시 맞춥니다. PG에만 있는 건은 우리 결제 생성 누락 여부를 확인합니다.</p>`;
  return {t:`${dep?'입금대사':'승인대사'} Fail 상세: ${r.date} ${r.pg}`,w:'w9',b:head+body,f:`<button class="btn" data-a="drDown" data-id="${r.id}">다운로드</button><button class="btn" data-a="closeModal">닫기</button>`}},
 drUp(md){const r=drFind(md.id);const dep=r.kind==='입금';
  return {t:`${dep?'입금 내역 등록':'PG 대사 파일 등록'}: ${r.date} ${r.pg}`,w:'w5',b:md.busy?'<div class="emptybox"><h4>대사를 실행하고 있습니다</h4>잠시 기다리세요.</div>':`<p class="dim-t" style="margin:0 0 12px">${r.pg}는 대사 데이터를 자동으로 주지 않아 ${dep?'입금 내역':'PG 관리자 화면에서 받은 거래 파일'}을 등록합니다. 등록하면 자동 대사와 같은 기준으로 Pass/Fail을 판정합니다.</p>
   <table class="ft"><tbody>${dep?`<tr><th>정산 예정액</th><td class="num">${won(r.exp)}원 <span class="dim-t">(순결제 ${won(r.net)} - 수수료 ${won(r.fee)})</span></td></tr><tr><th class="req">입금액</th><td><span class="unit"><input class="inp num" style="width:160px" data-b="modal.amt" value="${esc(md.amt)}"><em>원</em></span></td></tr><tr><th>입금 계좌</th><td>${esc(depAcct(r.pg))||'<span class="dim-t">미입력</span>'}</td></tr>`
   :`<tr><th class="req">대사 파일</th><td><input type="file" accept=".csv,.xlsx" data-c="drFile" aria-label="대사 파일"><div class="sub">${md.fname?`선택: ${esc(md.fname)}`:'파일을 고르지 않으면 데모 샘플 파일을 씁니다.'} 양식은 확인 필요 (Q9)</div></td></tr><tr><th>데모 샘플</th><td>${radios('modal.sample',[['ok','우리 데이터와 일치'],['fail','금액 불일치 1건 포함']],md.sample)}</td></tr>`}</tbody></table>${errBox(md.err)}`,
   f:`<button class="btn" data-a="closeModal" ${md.busy?'disabled':''}>취소</button><button class="btn pri" data-a="drUpSave" ${md.busy?'disabled':''}>등록 후 대사 실행</button>`}},

};
function renderModal(){const md=S.modal;const r=$('#modal-root');if(!md){r.innerHTML='';return}const f=MODALS[md.type](md);
 const had=r.querySelector('.mdl-b');const sc=had?had.scrollTop:0;
 setHTML(r,`<div class="dimbg" data-a="dimClose"><div class="mdl ${f.w||''}" role="dialog" aria-modal="true" aria-labelledby="mdl-t"><div class="mdl-h"><h2 id="mdl-t">${f.t}</h2><button class="x" data-a="closeModal" aria-label="닫기">×</button></div><div class="mdl-b">${f.b}</div><div class="mdl-f">${f.f}</div></div></div>`);
 const b=r.querySelector('.mdl-b');if(b)b.scrollTop=sc;}

/* ================= 확인 필요 (정책서 / IA) ================= */
const QS=[
 {n:'Q1',t:'BSS와 PG사 정보 동기화',b:'위클리 결정으로 PG사는 채널이 직접 등록합니다. BSS 동기화 방식과 시점은 이후 검토라 PG사 관리에 비활성 버튼만 두었습니다.'},
 {n:'Q2',t:'PG별 지원 결제수단과 세부수단 목록',b:'예시 값으로 넣었습니다. 별도 계약 대상 세부수단을 PG, 간편결제사별로 확인해야 합니다.'},
 {n:'Q3',t:'PG별 인증키 유효성 확인 방식',b:'조회 API로 인증 오류 여부를 판단하는 방식을 가정했고, KCP는 수동 확인으로 그렸습니다. 개발팀 확인이 필요합니다.'},
 {n:'Q4',t:'인증키 항목과 보관',b:'PG사 단위 1벌로 바꿨습니다. 화면에는 마스킹만 노출합니다. 서브몰 구조(Q13)에서 서브몰별 키가 따로 필요한지, BO 저장 보안 검토가 남아 있습니다.'},
 {n:'Q5',t:'연결 코너 필요성',b:'회의에서 결제 코너가 MID를 매핑하는 구조가 아닐 수 있다는 의견이 나왔습니다. 상세 탭은 빼고 목록·계약 정보에 참조 건수만 남겼습니다. 유지 여부를 정해야 합니다.'},
 {n:'Q6',t:'결과 미확인 건의 합계 포함 여부',b:'포함하고 건수를 따로 표시했습니다.'},
 {n:'Q7',t:'VAT 계산 반올림 기준',b:'VAT 포함·별도와 부가세 건별·합산은 계약별로 설정합니다. 건별은 건마다, 합산은 월 합계에서 원 단위 반올림으로 가정했습니다. PG사별 실제 기준 확인이 필요합니다.'},
 {n:'Q8',t:'휴대폰결제 부분 승인취소, 가상계좌 환불 절차',b:'BO에서 막아 두었습니다. PG별 정책 확인 후 열어야 합니다.'},
 {n:'Q9',t:'PG사별 대사 데이터 제공 방식',b:'PG사 등록에 연동 방식(API, SFTP, 수동 파일)을 둡니다. NHN KCP는 수동 파일로 가정했습니다. 실제 제공 방식과 파일 양식 확인이 필요합니다.'},
 {n:'Q10',t:'PG 청구 데이터 수신 주기와 형식',b:'월 1회 모의 수신으로 가정했습니다.'},
 {n:'Q11',t:'PG 프로모션 전문 항목과 FO 노출 영역',b:'카드사별 프로모션·무이자 할부 전문을 매일 06:00에 받는다고 가정했습니다. 전문 항목 구성, FO 노출 위치와 문구 규칙 확인이 필요합니다.'},
 {n:'Q12',t:'정산 주체·입금 계좌',b:'회의 결정으로 MID별 관리용 텍스트로 둡니다. PG사 관리의 입금처 필드는 없앴습니다. 남은 확인 사항은 없습니다.'},
 {n:'Q13',t:'MID 2단 체계',b:'PG사 가맹점 ID 아래 서브 MID가 있는 구조를 검토 중입니다. 기획팀이 T우주 가맹점 정리 자료를 주면 상위 가맹점 ID 선택 구조로 확정합니다.'},
 {n:'Q14',t:'정산 주기 (D+N)',b:'입금대사를 위해 D+2로 가정했습니다. PG·결제수단별 정산 주기를 받으면 입금일 계산을 바꿉니다.'},
 {n:'Q15',t:'PG 수수료 조회 구분과 SKT 계약분',b:'운영 주체(PS&M, M&S 등)가 자기 건만 보도록 정산 주체를 구분자로 쓰는 안을 검토 중입니다. SKT 계약분을 BSS로 통합할지 결정이 필요합니다.'},
 {n:'Q16',t:'메뉴명: PG 수수료 조회',b:'회의에서 제안된 안입니다. 확정 전까지 메뉴명은 유지하고 "명칭 검토" 표시만 했습니다.'},
 {n:'Q17',t:'결제 이력 회원 조회 조건',b:'BSS 가이드처럼 체크 시 조건이 펼쳐지는 구조로 두고 UID, 회원명만 노출했습니다. 식별 컬럼은 UID와 마스킹 이름. 추후 업데이트 예정입니다.'}
];

/* ================= 액션 ================= */
const sel=(arr,id)=>arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
const newMerDraft=()=>({mid:'',name:'',use:'',corp:'',settle:'',acct:'',owner:'',chs:[],from:TODAY,to:'',ops:'사용'});
function initDraft(){S.draft={pg:'',m:'',subs:[],midMode:'new',merId:'',mer:newMerDraft(),start:TODAY,ops:'사용',vat:'별도',vatMode:'건별',fees:[{sub:'',type:'정률',v:'',start:TODAY}],from:'menu'};S.formErr=[]}
function verifyKeyList(keys){if(keys.some(k=>!k.l.trim()||!(k.v||'').trim()))return {ok:false,msg:'키 항목명과 값을 모두 입력하세요.'};
 const f=keys.find(k=>String(k.v).toUpperCase().includes('FAIL'));if(f)return {ok:false,msg:`PG 인증 오류 (UNAUTHORIZED_KEY): ${f.l}가 맞지 않습니다.`};
 const b=keys.find(k=>k.v.trim().length<8);if(b)return {ok:false,msg:`형식 오류: ${b.l}는 8자 이상입니다.`};return {ok:true,msg:'PG 조회 API 응답 정상'}}
function drCsv(rows,name){if(!rows.length)return;
 if(rows[0].kind==='입금')csv(name,['입금일','거래일','PG사','입금 계좌','정산 예정액','입금액','차이','유형','설명'],rows.flatMap(r=>r.fails.map(x=>[r.date,r.td,r.pg,depAcct(r.pg),x.exp,x.act,x.diff,x.type,x.desc])));
 else csv(name,['거래일','PG사','결제번호','PG 거래번호','유형','우리 상태','PG 상태','우리 금액','PG 금액','차이'],rows.flatMap(r=>r.fails.map(x=>[r.date,r.pg,x.no,x.tid,x.type,x.ourSt,x.pgSt,x.our,x.pg,x.pg-x.our])))}
function withImpact(label,mers,ctrs,apply){const imp=impactOf(mers,ctrs);if(imp.length){S.modal={type:'impact',label,imp,ack:false,apply};render();return}apply();render()}
const A={
 noop(){},
 sort(el){const key=el.dataset.key,k=el.dataset.k;const s=S.sort[key];S.sort[key]=s&&s.k===k?{k,d:-s.d}:{k,d:1};render()},
 pg(el){S.page[el.dataset.key]=+el.dataset.p;render()},
 closeModal(){if(S.modal&&S.modal.busy)return;S.modal=null;render()},
 dimClose(el,e){if(e.target===el&&!(S.modal&&S.modal.busy)){S.modal=null;render()}},
 /* 기준정보 목록 */
 baseTab(el){S.baseTab=el.dataset.v;render()},
 baseList(){S.baseView='list';S.merEdit=null;render()},
 bfSearch(){if(S.bf.from&&S.bf.to&&S.bf.from>S.bf.to){toast('적용기간 시작일이 종료일보다 늦습니다.');return}S.bfA={...S.bf};S.page.ctr=1;S.page.mer=1;render()},
 ctrDetail(el){S.ctrId=el.dataset.id;S.ctrTab=el.dataset.tab||'info';S.promoF='';S.baseView='ctr';S.route='base';S.modal=null;render();window.scrollTo(0,0)},
 ctrTab(el){S.ctrTab=el.dataset.v;render()},
 cselOne(el){S.csel=sel(S.csel,el.dataset.id);render()},
 cselAll(el){const ids=paginate(ctrFilter(),'ctr',S.ctrSize).rows.map(c=>c.id);S.csel=el.checked?[...new Set([...S.csel,...ids])]:S.csel.filter(x=>!ids.includes(x));render()},
 clearCsel(){S.csel=[];S.bulkOps='';render()},
 ctrSize(el){S.ctrSize=+el.value;S.page.ctr=1;render()},
 bulkCtr(){const val=S.bulkOps;if(!val)return;const ids=S.csel.filter(id=>ctr(id).ops!==val);if(!ids.length){toast(`이미 ${val} 상태입니다.`);return}
  if(val==='사용'){const bad=ids.filter(id=>!keyOk(mer(ctr(id).mer)));if(bad.length){toast(`키 미확인 MID의 계약 ${bad.length}건은 사용으로 바꿀 수 없습니다 (V12).`);return}}
  withImpact(`계약 ${ids.length}건을 ${val}(으)로 바꾸면`,S.mers,S.ctrs.map(c=>ids.includes(c.id)?{...c,ops:val}:c),()=>{const at=now();ids.forEach(id=>{const c=ctr(id),m=mer(c.mer);S.hist.unshift({at,by:USER,tid:m.id,tname:merT(m),area:'결제수단',field:`${c.m} 운영상태 (일괄)`,before:c.ops,after:val});c.ops=val;c.upd=at});S.flash=[...ids];S.csel=[];S.bulkOps='';toast(`계약 ${ids.length}건의 운영상태를 ${val}(으)로 바꿨습니다.`)})},
 promoSync(){const c=ctr(S.ctrId);const k=promoSrcKey(c);if(!k||S.psBusy)return;S.psBusy=true;render();setTimeout(()=>{const at=now();const y=S.psync[k];y.last=at;y.res='성공';y.log.unshift({at,res:`수동 재수신 성공 · ${promosOf(c).length}건 확인, 변경 없음`});S.psBusy=false;render();toast('프로모션을 다시 받았습니다. 변경된 내용은 없습니다.')},800)},
 selOne(el){S.sel=sel(S.sel,el.dataset.id);render()},
 selAll(el){const ids=paginate(sortRows(merFilter(),'mer',{upd:m=>m.updatedAt,from:m=>m.from}),'mer',10).rows.map(m=>m.id);S.sel=el.checked?[...new Set([...S.sel,...ids])]:S.sel.filter(x=>!ids.includes(x));render()},
 bulkOps(){const ids=S.sel.filter(id=>mer(id).ops!==S.bulkOps);if(!ids.length){toast(`이미 ${S.bulkOps} 상태입니다.`);return}const val=S.bulkOps;
  if(val==='사용'){const bad=ids.filter(id=>!keyOk(mer(id)));if(bad.length){toast(`키 미확인 MID ${bad.length}개는 사용으로 바꿀 수 없습니다 (V12).`);return}}
  const mers=S.mers.map(m=>ids.includes(m.id)?{...m,ops:val}:m);
  withImpact(`MID ${ids.length}개를 ${val}(으)로 바꾸면`,mers,S.ctrs,()=>{const at=now();ids.forEach(id=>{const m=mer(id);S.hist.unshift({at,by:USER,tid:id,tname:merT(m),area:'가맹점',field:'운영상태 (일괄)',before:m.ops,after:val});m.ops=val;m.updatedAt=at});S.flash=[...ids];S.sel=[];S.bulkOps='';toast(`MID ${ids.length}개의 운영상태를 ${val}(으)로 바꿨습니다.`)})},
 impactOk(){const md=S.modal;if(!md.ack)return;S.modal=null;md.apply();render()},
 csvCtr(){csv('결제수단기준정보',['PG사','결제수단','MID','가맹점명','PG 등록 상호','정산주체','세부수단','현재 수수료','키검증','운영상태','유효기간','사용 코너 수'],ctrFilter().map(c=>{const m=mer(c.mer);const f=feeAt(c,TODAY);return [m.pg,c.m,m.mid,m.name,m.corp,m.settle,c.subs.join('/'),f?`${f.type} ${feeTxt(f)}`:'-',m.keyStatus,ctrSt(c),`${m.from}~${m.to}`,cornerRefs(m.id,c.m).length]}))},
 csvMer(){csv('가맹점MID',['PG사','MID','가맹점명','PG 등록 상호','결제수단','인증키','정산주체','사업주체','채널','유효기간','운영상태'],merFilter().map(m=>[m.pg,m.mid,m.name,m.corp,S.ctrs.filter(c=>c.mer===m.id).map(c=>c.m).join('/'),m.keyStatus,m.settle,m.owner,m.chs.join('/'),`${m.from}~${m.to}`,m.ops]))},
 histModal(){S.modal={type:'hist',title:'결제수단 기준정보 변경이력'};render()},
 /* 등록 */
 dPg(el){const d=S.draft;d.pg=el.value;d.m='';d.subs=[];d.merId='';d.mer=newMerDraft();render()},
 dSub(el){S.draft.subs=sel(S.draft.subs,el.dataset.v);render()},
 dCh(el){S.draft.mer.chs=sel(S.draft.mer.chs,el.dataset.v);render()},
 eCh(el){S.merEdit.chs=sel(S.merEdit.chs,el.dataset.v);render()},
 dStart(el){const d=S.draft;const old=d.start;d.start=el.value;d.fees.forEach(f=>{if(!f.start||f.start===old)f.start=el.value});render()},
 feeAdd(el){get(el.dataset.p).push({sub:'',type:'정률',v:'',start:el.dataset.p.startsWith('draft')?S.draft.start:addDays(TODAY,1)});render()},
 feeDel(el){get(el.dataset.p).splice(+el.dataset.i,1);render()},
 feeLocked(el){const md=S.modal;const f=md.fees[+el.dataset.i];const latest=md.fees.filter(x=>(x.sub||'')===(f.sub||'')).map(x=>x.start).sort().pop();
  md.block=`${f.start}부터 ${feeState(md.fees,f)==='적용중'?'적용 중인':'적용이 끝난'} ${f.sub||'기본'} 요율(${f.type} ${feeTxt(f)})입니다. 이미 결제 건에 쓰였을 수 있어 값을 바꾸면 수수료 검증 근거가 달라집니다. 같은 값으로 새 적용 시작일 행을 추가했습니다. 날짜와 기준값을 고쳐 저장하세요.`;
  md.fees.push({sub:f.sub,type:f.type,v:f.v,start:addDays(latest>TODAY?latest:TODAY,1)});render()},
 /* 가맹점 상세 */
 merDetail(el){S.merId=el.dataset.id;S.detTab=el.dataset.tab||'info';S.merEdit=null;S.baseView='detail';S.route='base';S.modal=null;render();window.scrollTo(0,0)},
 detTab(el){S.detTab=el.dataset.v;render()},
 merEditCancel(){S.merEdit=null;render()},
 /* 계약 수정 / 수수료 */
 ctrModal(el){const c=ctr(el.dataset.id);S.modal={type:'ctr',id:c.id,subs:[...c.subs],ops:c.ops,vat:c.vat,vatMode:c.vatMode,reason:'',err:[]};render()},
 mSub(el){S.modal.subs=sel(S.modal.subs,el.dataset.v);render()},
 ctrSave(){const md=S.modal;const c=ctr(md.id);const m=mer(c.mer);md.err=[];if(md.ops!==c.ops&&!(md.reason||'').trim())md.err.push('운영상태를 바꾸려면 변경 사유를 입력하세요 (V13).');if(md.ops==='사용'&&c.ops!=='사용'&&!keyOk(m))md.err.push('키 미확인 MID의 계약은 사용으로 바꿀 수 없습니다 (V12).');if(md.err.length){render();return}
  if(isGen(c.m)&&!md.subs.length){md.err.push('일반결제는 세부수단을 1개 이상 선택하세요.');render();return}
  const after={...c,subs:md.subs,ops:md.ops,vat:md.vat,vatMode:md.vat==='별도'?md.vatMode:'건별'};const reason=md.reason;S.modal=null;
  withImpact(`${m.mid} ${c.m}을(를) 일시중지하면`,S.mers,S.ctrs.map(x=>x.id===c.id?after:x),()=>{const at=now();if(c.ops!==after.ops)S.hist.unshift({at,by:USER,tid:m.id,tname:merT(m),area:'결제수단',field:`${c.m} 운영상태`,before:c.ops,after:`${after.ops} (사유: ${reason})`});if(c.vat!==after.vat||c.vatMode!==after.vatMode)S.hist.unshift({at,by:USER,tid:m.id,tname:merT(m),area:'수수료',field:`${c.m} 수수료 기준`,before:`VAT ${c.vat} ${c.vatMode}`,after:`VAT ${after.vat} ${after.vatMode}`});if(c.subs.join()!==after.subs.join())S.hist.unshift({at,by:USER,tid:m.id,tname:merT(m),area:'결제수단',field:`${c.m} 세부수단`,before:c.subs.join(', ')||'-',after:after.subs.join(', ')||'-'});
   Object.assign(c,after);c.upd=at;m.updatedAt=at;S.flash=[c.id];toast('결제수단 계약을 저장했습니다.')})},
 feeModal(el){const c=ctr(el.dataset.id);S.modal={type:'fee',id:c.id,fees:clone(c.fees).map(f=>({...f,_lock:f.start<=TODAY})),err:[],block:''};render()},
 feeSave(){const md=S.modal;const c=ctr(md.id);const m=mer(c.mer);const e=[];
  md.fees.forEach((f,i)=>{if(f._lock)return;const v=Number(f.v);if(f.v===''||isNaN(v)||v<=0)e.push(`${i+1}행: 기준값을 입력하세요 (V08).`);else if(f.type==='정률'&&v>10)e.push(`${i+1}행: 정률은 10% 이하 (V08).`);if(!f.start||f.start<=TODAY)e.push(`${i+1}행: 새 행의 적용 시작일은 내일 이후로 입력하세요 (V07).`);
   const lk=md.fees.filter(x=>x._lock&&(x.sub||'')===(f.sub||'')).map(x=>x.start).sort().pop();if(lk&&f.start<=lk)e.push(`${i+1}행: 기존 적용 시작일(${lk}) 이후로 입력하세요.`);if(m.to&&f.start>m.to)e.push(`${i+1}행: MID 유효기간(${m.to}) 밖입니다.`)});
  for(let i=0;i<md.fees.length;i++)for(let j=i+1;j<md.fees.length;j++)if((md.fees[i].sub||'')===(md.fees[j].sub||'')&&md.fees[i].start===md.fees[j].start)e.push(`같은 대상, 같은 적용 시작일(${md.fees[i].start})이 두 번 있습니다.`);
  if(!md.fees.some(f=>!f.sub))e.push('기본 수수료가 1건 이상 있어야 합니다.');
  if(e.length){md.err=e;render();return}const fees=md.fees.map(({_lock,...f})=>({...f,v:Number(f.v)}));
  if(feeSum(c.fees)!==feeSum(fees)){const at=addHist([{tid:m.id,tname:merT(m),area:'수수료',field:`${c.m} 수수료`,before:feeSum(c.fees),after:feeSum(fees)}]);c.fees=fees;c.upd=at;m.updatedAt=at;S.flash=[c.id];toast('수수료를 저장했습니다.')}else toast('바뀐 내용이 없습니다.');S.modal=null;render()},
 /* 메뉴 */
 go(el){const v=el.dataset.v;S.route=v;S.baseView='list';S.payView='list';S.pgView='list';S.merEdit=null;S.modal=null;if(v==='reg')initDraft();render();window.scrollTo(0,0)},
 resetAll(){const k={route:S.route};S=freshState();S.pfA={...S.pf};S.rfA={...S.rf};S.dfA={...S.df};Object.assign(S,k);render();toast('목업 데이터를 처음 상태로 되돌렸습니다.')},
 bfReset(){S.bf=emptyBf();S.bfA={};S.page.ctr=1;render()},
 /* 결제수단 등록 (메뉴) */
 regNew(){initDraft();S.route='reg';S.modal=null;render();window.scrollTo(0,0)},
 regAdd(el){const m=mer(el.dataset.id);A.regNew();Object.assign(S.draft,{pg:m.pg,midMode:'exist',merId:m.id,from:'mer'});render()},
 regCancel(){const d=S.draft;S.draft=null;S.route='base';S.baseView=d&&d.from==='mer'&&S.merId===d.merId?'detail':'list';render();window.scrollTo(0,0)},
 regSave(){const d=S.draft;const e=[];const nm=d.mer;const P=d.pg?PGM[d.pg]:null;
  if(!d.pg)e.push('PG사를 선택하세요.');if(!d.m)e.push('결제수단을 선택하세요.');
  if(d.midMode==='exist'){if(!d.merId)e.push('결제수단을 추가할 MID를 선택하세요.');else if(ctrOf(d.merId,d.m))e.push(`이 MID에 ${d.m} 계약이 이미 있습니다 (V02). 기존 계약에 수수료 행을 추가하세요.`)}
  else{if(!nm.mid.trim())e.push('MID를 입력하세요.');else if(S.mers.some(m=>m.pg===d.pg&&m.mid.toLowerCase()===nm.mid.trim().toLowerCase()))e.push(`${d.pg}에 같은 MID(${nm.mid.trim()})가 이미 있습니다 (V01). 결제수단만 추가하려면 "기존 MID에 결제수단 추가"를 고르세요.`);
   if(!nm.use)e.push('가맹점 용도를 선택하세요 (V11).');if(!nm.name.trim())e.push('가맹점명을 입력하세요.');if(!nm.settle.trim())e.push('정산 주체를 입력하세요.');if(!nm.owner)e.push('사업주체를 선택하세요.');if(!nm.chs.length)e.push('채널을 1개 이상 선택하세요.');
   if(!nm.from)e.push('유효기간 시작일을 입력하세요.');if(nm.to&&nm.to<nm.from)e.push('유효기간 종료일이 시작일보다 빠릅니다 (V09).');
   if(P&&nm.ops==='사용'&&!kOk(P))e.push(`${d.pg} 인증키가 ${P.ks} 상태라 MID를 사용으로 등록할 수 없습니다. 일시중지·미사용으로 등록하거나 PG사 관리에서 키를 먼저 확인하세요 (V12).`)}
  if(P&&d.ops==='사용'&&!kOk(P))e.push(`${d.pg} 인증키 확인 전에는 계약 운영상태를 사용으로 둘 수 없습니다 (V12).`);
  const nameNow=d.midMode==='exist'?(mer(d.merId)||{}).name:nm.name.trim();const dupName=S.ctrs.find(c=>c.m===d.m&&c.mer!==d.merId&&mer(c.mer).pg===d.pg&&mer(c.mer).name===nameNow);if(nameNow&&dupName)e.push(`${d.pg} ${d.m}에 같은 가맹점명(${nameNow})이 이미 있습니다 (V10).`);
  if(d.m&&isGen(d.m)&&!d.subs.length)e.push('일반결제는 계약 세부수단(신용카드, 계좌이체 등)을 1개 이상 선택하세요.');
  if(!d.start)e.push('적용 시작일을 입력하세요.');else if(d.start<TODAY)e.push('적용 시작일은 오늘 이후로 입력하세요 (V07).');
  const mm=d.midMode==='exist'?mer(d.merId):nm;if(mm&&d.start&&((mm.to&&d.start>mm.to)||d.start<mm.from))e.push('적용 시작일이 MID 유효기간 밖입니다.');
  if(!d.fees.some(f=>!f.sub))e.push('기본 수수료를 1건 이상 등록하세요.');
  d.fees.forEach((f,i)=>{const v=Number(f.v);if(f.v===''||isNaN(v)||v<=0)e.push(`수수료 ${i+1}행: 기준값을 0보다 크게 입력하세요 (V08).`);else if(f.type==='정률'&&v>10)e.push(`수수료 ${i+1}행: 정률은 10% 이하로 입력하세요 (V08).`);if(!f.start||f.start<d.start)e.push(`수수료 ${i+1}행: 적용 시작일은 계약 적용 시작일(${d.start}) 이후여야 합니다.`)});
  S.formErr=e;if(e.length){render();setTimeout(()=>document.querySelector('.errbox')?.scrollIntoView({block:'center',behavior:'smooth'}),0);return}
  const at=now();let merId=d.merId;
  if(d.midMode==='new'){merId='MID-'+pad(S.mers.length+20,4);const m=withKey({id:merId,pg:d.pg,mid:nm.mid.trim(),name:nm.name.trim(),use:nm.use,corp:nm.corp.trim(),settle:nm.settle.trim(),acct:nm.acct.trim(),owner:nm.owner,chs:[...nm.chs],from:nm.from,to:nm.to,ops:nm.ops,updatedAt:at,by:USER});S.mers.push(m);
   S.hist.unshift({at,by:USER,tid:merId,tname:merT(m),area:'가맹점',field:'MID 등록',before:'-',after:`${m.name} (${useName(m.use)}) / PG 인증키 ${m.keyStatus}`})}
  const c={id:'C-'+pad(S.ctrs.length+50,3),mer:merId,m:d.m,subs:[...d.subs],start:d.start,ops:d.ops,vat:d.vat,vatMode:d.vat==='별도'?d.vatMode:'건별',fees:d.fees.map(f=>({...f,v:Number(f.v)})),upd:at};S.ctrs.push(c);const m=mer(merId);m.updatedAt=at;
  S.hist.unshift({at,by:USER,tid:merId,tname:merT(m),area:'결제수단',field:`${d.m} 계약 추가`,before:'-',after:`적용 ${d.start}~ / ${feeSum(c.fees)}${c.subs.length?` / 세부수단 ${c.subs.join(', ')}`:''}`});
  S.draft=null;S.flash=[c.id];S.merId=merId;S.detTab='ctr';S.route='base';S.baseView='detail';render();window.scrollTo(0,0);toast(`${m.pg} › ${d.m} › ${m.mid} (${m.name})를 등록했습니다.`)},
 /* 가맹점 상세 */
 merEditStart(){const m=mer(S.merId);S.merEdit={name:m.name,use:m.use,corp:m.corp,settle:m.settle,acct:m.acct||'',owner:m.owner,chs:[...m.chs],from:m.from,to:m.to,ops:m.ops,reason:'',err:[]};render()},
 merEditSave(){const e=S.merEdit;const m=mer(S.merId);e.err=[];if(!e.name.trim())e.err.push('가맹점명을 입력하세요.');if(!e.use)e.err.push('가맹점 용도를 선택하세요 (V11).');if(!e.settle.trim())e.err.push('정산 주체를 입력하세요.');if(!e.chs.length)e.err.push('채널을 1개 이상 선택하세요.');if(e.to&&e.to<e.from)e.err.push('유효기간 종료일이 시작일보다 빠릅니다 (V09).');
  if(e.ops!==m.ops&&!e.reason.trim())e.err.push('운영상태를 바꾸려면 변경 사유를 입력하세요 (V13).');if(e.ops==='사용'&&m.ops!=='사용'&&!keyOk(m))e.err.push('PG 인증키를 확인하기 전에는 사용으로 바꿀 수 없습니다 (V12).');
  const myMs=S.ctrs.filter(c=>c.mer===m.id).map(c=>c.m);const dup=S.mers.find(x=>x.id!==m.id&&x.pg===m.pg&&x.name===e.name.trim()&&S.ctrs.some(c=>c.mer===x.id&&myMs.includes(c.m)));if(dup)e.err.push(`같은 PG와 결제수단에 같은 용도명(${dup.name}, ${dup.mid})이 있습니다 (V10).`);
  if(e.err.length){render();return}
  const after={...m,name:e.name.trim(),use:e.use,corp:e.corp.trim(),settle:e.settle.trim(),acct:e.acct.trim(),owner:e.owner,chs:[...e.chs],from:e.from,to:e.to,ops:e.ops};
  withImpact(`${m.mid} 변경으로`,S.mers.map(x=>x.id===m.id?after:x),S.ctrs,()=>{const F={name:'가맹점명',use:'가맹점 용도',corp:'PG 등록 상호',settle:'정산 주체',acct:'입금 계좌',owner:'사업주체',from:'유효기간 시작',to:'유효기간 종료',ops:'운영상태'};const at=now();let n=0;
   Object.keys(F).forEach(k=>{if(m[k]!==after[k]){const fmt=v=>k==='use'?`${useName(v)} (${v})`:(v||'-');S.hist.unshift({at,by:USER,tid:m.id,tname:merT(m),area:'가맹점',field:F[k],before:fmt(m[k]),after:fmt(after[k])+(k==='ops'?` (사유: ${e.reason.trim()})`:'')});n++}});
   if(m.chs.join()!==after.chs.join()){S.hist.unshift({at,by:USER,tid:m.id,tname:merT(m),area:'가맹점',field:'채널',before:m.chs.join(', '),after:after.chs.join(', ')});n++}
   ['name','use','corp','settle','acct','owner','chs','from','to','ops'].forEach(k=>m[k]=after[k]);m.updatedAt=at;S.merEdit=null;toast(n?`변경사항 ${n}건을 저장했습니다.`:'바뀐 내용이 없습니다.')})},
 /* PG사 관리 */
 pgNew(){S.pgDraft={isNew:true,orig:'',name:'',code:'',use:'Y',rec:'자동',lt:'API',lc:'매일 07:00',lp:'',support:[],verify:'api',keys:[{k:'k1',l:'클라이언트 키',v:''},{k:'k2',l:'시크릿 키',v:''}],ks:'미확인',kMsg:'',kAt:'',kManual:false};S.pgErr=[];S.route='pgm';S.pgView='form';S.modal=null;render();window.scrollTo(0,0)},
 pgEdit(el){const p=PGM[el.dataset.v];S.pgDraft={isNew:false,orig:p.name,name:p.name,code:p.code,use:p.use,rec:p.rec,lt:p.lt,lc:p.lc,lp:p.lp,support:[...p.support],verify:p.verify,keys:p.keys.map(([k,l])=>({k,l,v:p.vals[k]||''})),ks:p.ks,kMsg:'',kAt:p.kAt,kManual:p.ks==='수동확인'};S.pgErr=[];S.route='pgm';S.pgView='form';S.modal=null;render();window.scrollTo(0,0)},
 gfSearch(){S.gfA={...S.gf};render()},
 gfReset(){S.gf=emptyGf();S.gfA=emptyGf();render()},
 pgCancel(){S.pgView='list';S.pgDraft=null;render();window.scrollTo(0,0)},
 pgSup(el){S.pgDraft.support=sel(S.pgDraft.support,el.dataset.v);render()},
 pgKeyVal(el){const d=S.pgDraft;const k=d.keys[+el.dataset.i];if(k.v===el.value)return;k.v=el.value;if(d.ks!=='미확인'||d.kManual){d.ks='미확인';d.kAt='';d.kManual=false;d.kMsg='키를 수정해 미확인으로 돌아갔습니다 (V04). 다시 확인하세요.';render()}},
 pgKeyLbl(el){S.pgDraft.keys[+el.dataset.i].l=el.value},
 pgKeyAdd(){const d=S.pgDraft;d.keys.push({k:'k'+(d.keys.length+1),l:'',v:''});d.ks='미확인';d.kAt='';render()},
 pgKeyDel(el){const d=S.pgDraft;d.keys.splice(+el.dataset.i,1);d.ks='미확인';d.kAt='';render()},
 pgManual(el){const d=S.pgDraft;d.kManual=el.checked;d.ks=el.checked?'수동확인':'미확인';d.kAt=el.checked?now():'';d.kMsg=el.checked?`${USER} 수동 확인`:'';render()},
 pgVerify(){const d=S.pgDraft;const r=verifyKeyList(d.keys);d.ks=r.ok?'확인완료':'확인실패';d.kMsg=r.msg;d.kAt=r.ok?now():'';render()},
 pgSave(){const d=S.pgDraft;const e=[];const name=(d.name||'').trim(),code=(d.code||'').trim().toUpperCase();const u=d.isNew?{mids:0}:pgUseCnt(d.orig);
  if(d.isNew){if(!name)e.push('PG사명을 입력하세요.');else if(PGM[name])e.push(`같은 PG사명(${name})이 이미 있습니다.`);
   if(!/^[A-Z0-9]{2,6}$/.test(code))e.push('PG 코드는 영문 대문자·숫자 2~6자로 입력하세요 (V18).');else if(PGS.some(k=>PGM[k].code===code))e.push(`같은 PG 코드(${code})가 이미 있습니다 (V18).`)}
  if(!d.support.length)e.push('지원 결제수단을 1개 이상 선택하세요.');
  if(d.keys.some(k=>!k.l.trim()))e.push('키 항목명을 모두 입력하세요.');else if(new Set(d.keys.map(k=>k.l.trim())).size!==d.keys.length)e.push('키 항목명이 겹칩니다.');
  if(d.keys.some(k=>!(k.v||'').trim()))e.push('인증키 값을 모두 입력하세요.');
  if(d.verify==='api'&&d.ks!=='확인완료')e.push(d.ks==='확인실패'?'인증키 유효성 확인에 실패했습니다. 키를 고친 뒤 다시 확인하세요 (V03).':'인증키 유효성 확인을 완료하세요 (V03).');
  if(d.verify==='manual'&&!d.kManual)e.push('PG 관리자 화면에서 키를 확인한 뒤 수동 확인을 체크하세요 (V03).');
  if(d.use==='N'&&u.mids)e.push(`MID ${u.mids}개가 있어 미사용으로 바꿀 수 없습니다 (V17).`);
  S.pgErr=e;if(e.length){render();setTimeout(()=>document.querySelector('.errbox')?.scrollIntoView({block:'center',behavior:'smooth'}),0);return}
  const at=now();const H=(p,field,before,after)=>S.hist.unshift({at,by:USER,tid:p,tname:`PG사 / ${p}`,area:'PG사',field,before,after});
  if(d.isNew){const keys=d.keys.map((k,i)=>[`k${i+1}`,k.l.trim()]);PGM[name]={name,short:name.slice(0,4),code,verify:d.verify,keys,vals:Object.fromEntries(keys.map(([k],i)=>[k,d.keys[i].v])),support:METHODS.filter(x=>d.support.includes(x)),ks:d.verify==='manual'?'수동확인':'확인완료',kAt:d.kAt||at,kBy:USER,reg:'채널 등록',dep:'',rec:d.lt==='수동 파일'?'수동':'자동',lt:d.lt,lc:(d.lc||'').trim(),lp:(d.lp||'').trim(),use:d.use,regAt:TODAY,upd:at};PGS.push(name);
   H(name,'PG사 등록 (채널)','-',`${name} (${code}) / 결제수단 ${d.support.length}개 / 인증키 ${PGM[name].ks}`);toast(`${name}를 등록했습니다. 결제수단 등록에서 고를 수 있습니다.`)}
  else{const p=PGM[d.orig];const ch=[];const keyCh=p.keys.some(([k],i)=>p.vals[k]!==d.keys[i].v);
   if(keyCh){H(p.name,'인증키',p.keys.map(([k])=>maskKey(p.vals[k])).join(', '),d.keys.map(k=>maskKey(k.v)).join(', '));p.keys.forEach(([k],i)=>p.vals[k]=d.keys[i].v);ch.push('인증키')}
   const nks=d.verify==='manual'?'수동확인':'확인완료';if(p.ks!==nks||keyCh){H(p.name,'인증키 확인',p.ks,`${nks} (${d.kAt||at})`);p.ks=nks;p.kAt=d.kAt||at;p.kBy=USER;if(!keyCh)ch.push('키 확인')}
   d.rec=d.lt==='수동 파일'?'수동':'자동';[['use','사용여부'],['rec','대사 수집 방식'],['lt','대사 연동 방식'],['lc','대사 수신 주기'],['lp','대사 연동 경로']].forEach(([k,l])=>{const v=String(d[k]||'').trim();if((p[k]||'')!==v){H(p.name,l,p[k]||'-',v||'-');p[k]=v;ch.push(l)}});
   const sup=METHODS.filter(x=>d.support.includes(x));if(sup.join()!==p.support.join()){H(p.name,'지원 결제수단',p.support.join(', '),sup.join(', '));p.support=sup;ch.push('지원 결제수단')}
   p.upd=at;toast(ch.length?`${p.name} 변경 ${ch.length}건을 저장했습니다.`:'바뀐 내용이 없습니다.')}
  S.flash=[d.isNew?name:d.orig];S.pgView='list';S.pgDraft=null;render();window.scrollTo(0,0)},
 pgMids(el){S.route='base';S.baseView='list';S.bf={...emptyBf(),pg:el.dataset.v};S.bfA={...S.bf};S.page.ctr=1;render();window.scrollTo(0,0)},
 /* 프로모션 */
 promoNew(el){const c=ctr(el.dataset.id||S.ctrId);S.modal={type:'promo',id:c.id,kind:'안내',target:'',benefit:'',cond:'',from:TODAY,to:addDays(TODAY,29),fo:'Y',err:[]};render()},
 promoSave(){const md=S.modal;const c=ctr(md.id);const m=mer(c.mer);md.err=[];if(!(md.target||'').trim())md.err.push('대상을 입력하세요.');if(!(md.benefit||'').trim())md.err.push('혜택 문구를 입력하세요.');if(!md.from||!md.to)md.err.push('기간을 입력하세요.');else if(md.to<md.from)md.err.push('종료일이 시작일보다 빠릅니다.');if(md.err.length){render();return}
  const id='PR-OWN-'+TODAY.slice(2,4)+TODAY.slice(5,7)+'-'+pad(S.promos.filter(p=>p.src==='자체').length+1);S.promos.push({id,pg:m.pg,m:c.m,kind:md.kind,target:md.target.trim(),benefit:md.benefit.trim(),cond:(md.cond||'').trim()||'-',from:md.from,to:md.to,scope:[m.id],rcv:'자체 등록',sub:'',src:'자체',fo:md.fo});
  addHist([{tid:m.id,tname:merT(m),area:'프로모션',field:`${c.m} 자체 콘텐츠 등록`,before:'-',after:`${id} ${md.benefit.trim()} (FO 노출 ${md.fo})`}]);S.modal=null;S.ctrId=c.id;S.ctrTab='promo';S.baseView='ctr';S.route='base';S.promoF='';S.flash=[id];render();toast('자체 콘텐츠를 등록했습니다.')},
 promoFo(el){const p=S.promos.find(x=>x.id===el.dataset.v);const c=ctr(S.ctrId);const m=mer(c.mer);const b=p.fo;p.fo=b==='Y'?'N':'Y';addHist([{tid:m.id,tname:merT(m),area:'프로모션',field:`${c.m} ${p.id} FO 노출`,before:b,after:p.fo}]);render();toast(`${p.id}: FO 노출 ${p.fo}`)},
 /* 결제이력 */
 pselOne(el){S.psel=sel(S.psel,el.dataset.id);render()},
 pselAll(el){const ids=paginate(sortRows(payFilter(),'pay',{amt:p=>p.amt,at:p=>p.at}),'pay',15).rows.map(p=>p.no);S.psel=el.checked?[...new Set([...S.psel,...ids])]:S.psel.filter(x=>!ids.includes(x));render()},
 pselClear(){S.psel=[];render()},
 csvPaySel(){if(!S.psel.length)return;A.csvPay(null,null,S.pays.filter(p=>S.psel.includes(p.no)).sort((a,b)=>b.at.localeCompare(a.at)))},
 pfSearch(){S.pfA={...S.pf};S.page.pay=1;render()},
 pfReset(){S.pf=emptyPf();S.pfA={...S.pf};S.page.pay=1;render()},
 pfPg(el){S.pf.pg=el.value;S.pf.mer='';render()},
 pfQuick(){S.pf={...emptyPf(),from:'2026-09-01',st:'결과미확인'};S.pfA={...S.pf};S.page.pay=1;render()},
 payByMer(el){const m=mer(el.dataset.id);S.route='pay';S.payView='list';S.pf={...emptyPf(),from:'2026-09-01',pg:m.pg,mer:m.id};S.pfA={...S.pf};S.page.pay=1;render();window.scrollTo(0,0)},
 payDetail(el){S.payNo=el.dataset.id;S.payView='detail';S.route='pay';S.modal=null;render();window.scrollTo(0,0)},
 payList(){S.payView='list';render()},
 payQuery(){const p=pay(S.payNo);if(p.busy)return;p.busy='PG 재조회';render();setTimeout(()=>{const L=payLogs(p);p.busy='';let msg;
  if(p.qres==='ok'){p.st='결제완료';p.appr=String(400000+p.amt%99999);p.bss='반영대기';L.push({at:now(),by:USER,t:'PG 재조회',res:`승인 확인 · 승인번호 ${p.appr} · 결제완료로 확정`});L.push({at:now(),by:'시스템',t:'BSS 반영',res:'반영대기'});msg='PG에서 승인을 확인했습니다.'}
  else{p.st='결제실패';p.failMsg='PG 승인 내역 없음';p.bss='-';L.push({at:now(),by:USER,t:'PG 재조회',res:'승인 내역 없음 · 결제실패로 확정',bad:1});msg='PG 승인 내역이 없어 결제실패로 확정했습니다.'}
  p.qres='';const d=p.at.slice(0,10);const r=S.dr.find(x=>x.date===d&&x.pg===p.pg);
  if(r&&r.st!=='수집대기'){const b=r.st;Object.assign(r,drApprove(d,p.pg,S.pays.filter(x=>x.pg===p.pg&&x.at.startsWith(d)&&x.st!=='결제실패'),r.ft),{ranAt:now()+' 재대사',by:USER});L.push({at:now(),by:'시스템',t:'일대사 재대사',res:`${d} ${p.pg} 승인대사 ${b} → ${r.st}`});msg+=` ${d} ${p.pg} 승인대사 ${b} → ${r.st}.`}
  S.flash=[p.no];render();toast(msg)},800)},
 payBss(el){const p=pay(S.payNo);if(p.busy)return;const re=el.dataset.v==='re';p.busy='BSS 반영 요청';render();setTimeout(()=>{const L=payLogs(p);p.busy='';
  const n=L.filter(l=>l.t.startsWith('BSS 반영 재요청')).length+1;const label=re?`BSS 반영 재요청 ${n}회차`:'BSS 반영 확인';
  if(p.failOnce){p.failOnce=false;L.push({at:now(),by:USER,t:label,res:'실패 · BSS 응답 시간 초과',bad:1});toast('BSS 반영에 실패했습니다. 다시 시도하세요.')}
  else{p.bss='반영완료';p.bssAmt=null;L.push({at:now(),by:USER,t:label,res:`성공 · BSS 금액 ${won(p.amt-p.cancel)}원`});toast('BSS 반영을 마쳤습니다.')}render()},800)},
 cancelModal(el){const no=(el&&el.dataset.id)||S.payNo;const p=pay(no);const w=cancelWhy(p);if(w){toast(w);return}S.modal={type:'cancel',no,ct:'all',amt:'',reason:'고객 요청',memo:'',err:[],busy:false};render()},
 cAmt(el){S.modal.amt=el.value.replace(/[^0-9]/g,'');render()},
 cancelSave(){const md=S.modal;const p=pay(md.no);const can=p.amt-p.cancel;md.err=[];
  if(md.ct==='part'){const n=Number(md.amt);if(!md.amt)md.err.push('취소 금액을 입력하세요.');else if(!Number.isInteger(n)||n<1)md.err.push('1원 이상 정수로 입력하세요 (V22).');else if(n>can)md.err.push(`취소 가능 금액(${won(can)}원)을 넘었습니다 (V22).`);else if(n===can)md.ct='all'}
  if(md.reason==='기타'&&!(md.memo||'').trim())md.err.push('기타 사유를 메모에 적으세요.');if(md.err.length){render();return}
  const amt=md.ct==='all'?can:Number(md.amt);md.busy=true;render();setTimeout(()=>{const L=payLogs(p);p.cancel+=amt;p.st=p.cancel>=p.amt?'승인취소':'부분취소';p.refund=p.st==='승인취소'?'환불완료':'부분환불';p.bss='반영대기';
   L.push({at:now(),by:USER,t:p.st==='승인취소'?'전체 승인취소':'부분 승인취소',res:`PG 승인취소 성공 · 취소번호 CX${String(p.amt+amt).slice(-6)} · ${won(amt)}원 · 사유 ${md.reason}${md.memo?' ('+md.memo+')':''}`});L.push({at:now(),by:'시스템',t:'BSS 반영',res:'반영대기'});
   S.modal=null;S.flash=[p.no];render();toast(`${p.no} ${won(amt)}원을 승인취소했습니다. BSS 반영을 확인하세요.`)},900)},
 csvPay(el,e,only){const rows=only||sortRows(payFilter(),'pay',{amt:p=>p.amt,at:p=>p.at});csv(only?'결제이력_선택':'결제이력',['결제번호','승인번호','승인일시','결제수단','세부수단','결제금액','승인취소','순결제금액','결제상태','PG사','MID','UID','회원명(마스킹)','주문번호','그룹 ID'],rows.map(p=>[p.no,p.appr,p.at,p.method,p.sub,p.amt,p.cancel,p.st==='결제실패'?0:p.amt-p.cancel,p.st,p.pg,p.mid,p.uid,p.mbr,p.ord,p.grp]))},
 /* 거래대사 */
 drTab(el){S.drTab=el.dataset.v;S.df.st='';S.dfA={...S.dfA,st:''};render()},
 dfSearch(){if(S.df.from&&S.df.to&&S.df.from>S.df.to){toast('시작일이 종료일보다 늦습니다.');return}S.dfA={...S.df};S.page['dr'+S.drTab]=1;render()},
 dfReset(){S.df=emptyDf();S.dfA={...S.df};render()},
 drFail(el){S.modal={type:'drFail',id:el.dataset.id};render()},
 drDown(el){const r=drFind(el.dataset.id);drCsv([r],`${r.kind}대사_Fail_${r.date}_${PGM[r.pg].code}`)},
 drDownAll(){drCsv(drRows().filter(r=>r.st==='Fail'),`${S.drTab}대사_Fail_일괄`)},
 drUp(el){const r=drFind(el.dataset.id);S.modal={type:'drUp',id:r.id,sample:'ok',fname:'',amt:r.kind==='입금'?String(r.exp):'',err:[],busy:false};render()},
 drFile(el){S.modal.fname=el.files&&el.files[0]?el.files[0].name:'';render()},
 drUpSave(){const md=S.modal;const r=drFind(md.id);md.err=[];const v=String(md.amt||'').replace(/[^0-9]/g,'');
  if(r.kind==='입금'&&v===''){md.err.push('입금액을 입력하세요.');render();return}
  md.busy=true;render();setTimeout(()=>{const at=now();
   if(r.kind==='입금')drDepJudge(r,Number(v),at,USER);
   else{const list=S.pays.filter(p=>p.pg===r.pg&&p.at.startsWith(r.date)&&p.st!=='결제실패');Object.assign(r,drApprove(r.date,r.pg,list,md.sample==='fail'?'amt':null),{ranAt:at,by:USER,file:md.fname||`${PGM[r.pg].code}_TX_${r.date.replace(/-/g,'')}.csv`})}
   S.modal=null;S.flash=[r.id];render();toast(`${r.date} ${r.pg} ${r.kind}대사 결과: ${r.st}${r.st==='Fail'?` (${r.fails.length}건). [상세]에서 확인하세요.`:''}`)},800)},
 /* 금융수수료 */
 rfSearch(){S.rfA={...S.rf};render()},
 rfReset(){S.rf=emptyRf();S.rfA={...S.rf};render()},
 feePg(el){const v=el.dataset.v;S.rf.pg=S.rf.pg===v?'':v;S.rfA={...S.rfA,pg:S.rf.pg};render()},
 recModal(el){S.modal={type:'rec',mon:S.rfA.mon,id:el.dataset.id};render()},
 feeRowDown(el){const r=recon(S.rfA.mon).find(x=>x.key===el.dataset.id);csv(`PG수수료_${S.rfA.mon}_${r.m.mid}_${r.m2}`,['결제번호','결제일시','PG사','MID','정산주체','결제수단','세부수단','순결제금액','적용요율','예상수수료'],r.pays.map(p=>{const f=feeAt(r.c,p.at.slice(0,10),p.sub||'');return [p.no,p.at,p.pg,p.mid,r.m.settle,p.method,p.sub,netAmt(p),f?`${f.type} ${feeTxt(f)}`:'',payFee(p)]}))},
 csvRec(){const rows=feeRowsData();csv(`PG수수료_${S.rfA.mon}`,['PG사','가맹점명','MID','정산 주체','결제수단','계약 기준일','거래건수','거래금액','계약요율','VAT 기준','예상수수료','PG 청구수수료','차액','검증상태','차이 원인(추정)'],rows.map(r=>[r.pg,r.m.name,r.m.mid,r.m.settle,r.m2,r.start,r.cnt,r.amt,r.fee?`${r.fee.type} ${feeTxt(r.fee)}`:'',r.c.vat+(r.c.vat==='별도'?' '+r.c.vatMode:''),r.exp,r.act??'',r.diff??'',r.st,r.cause]))},
 /* 시연 */
 demo(el){const k=el.dataset.v;S.modal=null;
  if(k==='A'){A.regNew();Object.assign(S.draft,{pg:'KG이니시스',m:'간편결제-카카오페이',subs:['카드 간편결제'],midMode:'exist',merId:'MID-0007'});render();toast('시나리오 A: 기존 MID가 선택돼 있습니다. 키 입력 없이 수수료만 넣고 저장하세요.')}
  if(k==='B'){A.pgEdit({dataset:{v:'나이스페이'}});toast('시나리오 B: 시크릿 키에 FAIL을 넣고 [유효성 확인] 후 [저장]을 눌러 보세요.')}
  if(k==='C'){S.route='base';S.baseView='list';const cc=S.ctrs.find(c=>c.mer==='MID-0003'&&isGen(c.m));S.modal={type:'fee',id:cc.id,fees:clone(cc.fees).map(f=>({...f,_lock:f.start<=TODAY})),err:[],block:''};render();toast('시나리오 C: 적용중 행의 [수정]을 누르세요.')}
  if(k==='D'){A.regNew();Object.assign(S.draft,{pg:'KG이니시스',m:'일반결제-SK pay',subs:['신용카드'],midMode:'exist',merId:'MID-0001'});render()}
  if(k==='E'){S.route='base';S.merId='MID-0005';S.detTab='info';S.baseView='detail';S.merEdit=null;A.merEditStart();Object.assign(S.merEdit,{ops:'일시중지',reason:'PG 정기 점검'});render();toast('시나리오 E: [저장]을 누르면 결제 코너 영향 안내가 뜹니다.')}
  if(k==='P'){S.route='base';A.ctrDetail({dataset:{id:S.ctrs.find(c=>c.mer==='MID-0005'&&c.m==='간편결제-SK pay').id,tab:'promo'}});toast('시나리오 P: tosstu0401 간편결제-SK pay의 프로모션입니다. KCPacc0301의 간편결제-SK pay는 프로모션 탭이 비활성입니다.')}
  if(k==='F'){const p=S.pays.find(x=>x.st==='결과미확인'&&x.qres==='ok')||S.pays.find(x=>x.st==='결제완료');A.payDetail({dataset:{id:p.no}});toast('시나리오 F: [PG 재조회]를 누르면 11/01 승인대사가 다시 맞춰집니다. 이어서 [승인취소]도 해 보세요.')}
  if(k==='G'){S.route='recon';S.drTab='승인';S.df={...emptyDf(),pg:'NHN KCP'};S.dfA={...S.df};render();toast('시나리오 G: 수집대기 행의 [파일 등록]을 누르세요.')}
  if(k==='H'){S.route='fee';S.rf=emptyRf();S.rfA={...S.rf};render();toast('시나리오 H: PG사 카드를 눌러 걸러 보고, 행의 [다운로드]를 눌러 보세요.')}
  window.scrollTo(0,0)}
};

/* ================= 이벤트 ================= */
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el||el.disabled)return;const f=A[el.dataset.a];if(f)f(el,e)});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.c&&A[el.dataset.c]){A[el.dataset.c](el,e);return}
 if(el.dataset.b){set(el.dataset.b,el.type==='checkbox'?el.checked:el.value);if(el.dataset.r!==undefined)render()}});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset.c==='keyEdit'||el.dataset.c==='cAmt')return;if(el.dataset.b&&(el.tagName==='TEXTAREA'||['text','search','number','password'].includes(el.type)))set(el.dataset.b,el.value)});
document.addEventListener('keydown',e=>{const el=e.target;
 if(e.key==='Escape'&&S.modal&&!S.modal.busy){S.modal=null;render();return}
 if(e.key==='Enter'&&el.dataset.enter&&A[el.dataset.enter]){set(el.dataset.b,el.value);A[el.dataset.enter](el);return}
 if(e.key==='Enter'&&el.tagName==='TR'&&el.dataset.a){A[el.dataset.a](el,e)}});
/* ================= 시작 ================= */
/* 저장된 상태를 이어 받고, 이 HTML이 맡은 화면으로 맞춘다. 상세 화면은 주소의 id를 먼저 보고, 없으면 마지막으로 본 건, 그것도 없으면 첫 건이다 */
S=freshState();S.pfA={...S.pf};S.rfA={...S.rf};S.dfA={...S.df};
let continued=false;
try{
 const saved=JSON.parse(sessionStorage.getItem(SKEY)||'null');
 if(saved&&saved._pgm&&['mers','ctrs','pays','dr','dp','hist','promos','uses'].every(k=>Array.isArray(saved[k]))){const {_pgm,_pgs,_clock,...st}=saved;Object.assign(S,st);PGM=_pgm;PGS=_pgs;CLOCK=new Date(_clock);S.mers.forEach(withKey)}
 continued=sessionStorage.getItem(NAVKEY)===PAGES[PAGE];sessionStorage.removeItem(NAVKEY);
}catch{}
if(!continued)S.modal=null;
S.marks=false;S.flash=continued?S.flash:[];
const QP=new URLSearchParams(location.search);
const pick=(v,ok,last,first)=>v&&ok(v)?v:last&&ok(last)?last:first;
if(PAGE==='base'){S.route='base';S.baseView='list'}
else if(PAGE==='ctr'){S.route='base';S.baseView='ctr';S.ctrId=pick(QP.get('id'),ctr,S.ctrId,S.ctrs[0].id);if(!continued)S.ctrTab='info'}
else if(PAGE==='mer'){S.route='base';S.baseView='detail';const id=pick(QP.get('id'),mer,S.merId,S.mers[0].id);if(!continued||id!==S.merId){S.detTab='info';S.merEdit=null}S.merId=id}
else if(PAGE==='reg'){S.route='reg';if(!continued||!S.draft)initDraft()}
else if(PAGE==='pgm'){S.route='pgm';S.pgView='list'}
else if(PAGE==='pgForm'){S.route='pgm';S.pgView='form';if(!continued||!S.pgDraft){const pg=QP.get('pg');if(pg&&PGM[pg])A.pgEdit({dataset:{v:pg}});else A.pgNew()}}
else if(PAGE==='pay'){S.route='pay';S.payView='list'}
else if(PAGE==='payD'){S.route='pay';S.payView='detail';S.payNo=pick(QP.get('no'),pay,S.payNo,S.pays[0].no)}
else S.route=PAGE;
render();
try{const t=sessionStorage.getItem(TKEY);if(t){sessionStorage.removeItem(TKEY);toast(t)}}catch{}
