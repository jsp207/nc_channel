// @ts-nocheck
// 상품등록(product-create)·상품목록(product-list)이 같이 쓰는 데이터, 전시유형, 저장소.
import ITEMS_V3 from "./data/items-v3.json";

// ---------- 마스터 정책 ----------
export const POLICY = [
 {area:'기기서비스',type:'약정형',solo:false},
 {area:'기기서비스',type:'액세서리형',solo:true},
 {area:'이동전화',type:'요금제형',solo:true},
 {area:'부가서비스',type:'월정액형',solo:true},
 {area:'부가서비스',type:'무료형',solo:true},
 {area:'부가서비스',type:'종량/충전형',solo:true},
 {area:'부가서비스',type:'제휴 보험형',solo:true},
 {area:'부가서비스',type:'제휴 클럽형',solo:true},
 {area:'로밍',type:'로밍 요금제형',solo:true},
 {area:'로밍',type:'로밍 옵션형',solo:true},
 {area:'로밍',type:'로밍 충전형',solo:true},
 {area:'플랫폼(T우주)',type:'단일 구독형',solo:true},
 {area:'플랫폼(T우주)',type:'결합 구독형',solo:true},
 {area:'플랫폼(T우주)',type:'이용권형',solo:true},
];
export const AREAS = ['기기서비스','이동전화','부가서비스','로밍','플랫폼(T우주)'];
const pol = t => POLICY.find(p=>p.type===t);
// svc: 서비스 키(정책 4), inc: 포함 서비스, dev: 기종, net: 네트워크, seg: 세그먼트, req: 전제 상품
export const ITEMS = ITEMS_V3.map(i=>{ const p=pol(i.type); return {...i, solo:p?p.solo:true}; });
export const ITEM_BY_ID = new Map(ITEMS.map(i=>[i.id,i]));

// ---------- 공통 ----------
export const $ = s=>document.querySelector(s);
export const el = (t,c,h)=>{const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e;};
export const esc = s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 상품명은 <br>만 줄바꿈으로 허용한다. 화면 표시는 nameHtml, 목록·안내 문구처럼 한 줄로 쓸 때는 nameText.
export const nameText = s=>String(s==null?'':s).replace(/<br\s*\/?>/gi,' ').replace(/\s+/g,' ').trim();
export const nameHtml = s=>esc(s).replace(/&lt;br\s*\/?&gt;/gi,'<br>');
export function toast(m){const t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('on'),2000);}
export const joinKey = i => i.line==='무관' ? '무관' : (i.net && i.net!=='-' ? `${i.line}-${i.net}` : i.line);
const VAR={}; ITEMS.forEach(i=>{const k=i.area+'|'+i.type+'|'+i.key; (VAR[k]=VAR[k]||[]).push(i);});
export const variants = i => VAR[i.area+'|'+i.type+'|'+i.key]||[i];
export const byName = n=>ITEMS.find(i=>i.name===n);
export const TODAY = new Date().toISOString().slice(0,10);

// ---------- 전시유형·채널·카테고리 ----------
export const TYPES=[
 {k:'device',label:'디바이스형',base:'디바이스',area:'기기서비스',types:['약정형'],ch:'T다이렉트샵',why:'모델 1개. 옵션값은 모델마다 다르게 나온다',slot:'부가서비스'},
 {k:'acc',label:'액세서리형',base:'액세서리',area:'기기서비스',types:['액세서리형'],ch:'T다이렉트샵',why:'단품 1개',slot:'기기서비스'},
 {k:'plan',label:'요금제형',base:'요금제',area:'이동전화',types:['요금제형'],ch:'T월드',why:'단품 1개',slot:'부가서비스'},
 {k:'addon',label:'부가서비스형',base:'부가서비스',area:'부가서비스',types:null,ch:'T월드',why:'단품 1개',slot:'부가서비스'},
 {k:'roam',label:'로밍형',base:'로밍 상품',area:'로밍',types:null,ch:'T월드',why:'단품 1개',slot:'로밍'},
 {k:'sub',label:'구독형',base:'구독 상품',area:'플랫폼(T우주)',types:null,ch:'T우주',why:'단품 1개. 패스형은 단품 없이 구성 가능',slot:'플랫폼(T우주)'},
];
export const tdef=k=>TYPES.find(t=>t.k===k);
export const CHANNELS=['T다이렉트샵','T월드','T우주'];
export const CATS=[
 {ch:'T다이렉트샵',name:'5G 휴대폰',desc:'약정형 · 이동전화 · 5G',cond:h=>h.type==='약정형'&&h.line==='이동전화'&&h.net==='5G'},
 {ch:'T다이렉트샵',name:'휴대폰',desc:'약정형 · 이동전화 · LTE',cond:h=>h.type==='약정형'&&h.line==='이동전화'&&h.net==='LTE'},
 {ch:'T다이렉트샵',name:'태블릿',desc:'약정형 · 태블릿',cond:h=>h.type==='약정형'&&h.line==='태블릿'},
 {ch:'T다이렉트샵',name:'스마트워치',desc:'약정형 · 웨어러블',cond:h=>h.type==='약정형'&&h.line==='웨어러블'},
 {ch:'T다이렉트샵',name:'액세서리',desc:'액세서리형',cond:h=>h.type==='액세서리형'},
 {ch:'T월드',name:'요금제',desc:'요금제형',cond:h=>h.type==='요금제형'},
 {ch:'T월드',name:'부가서비스',desc:'부가서비스 (보험·클럽 제외)',cond:h=>h.area==='부가서비스'&&!/보험|클럽/.test(h.type)},
 {ch:'T월드',name:'보험·케어',desc:'제휴 보험형 · 제휴 클럽형',cond:h=>/보험|클럽/.test(h.type)},
 {ch:'T월드',name:'로밍',desc:'로밍 전체',cond:h=>h.area==='로밍'},
 {ch:'T우주',name:'구독',desc:'단일·결합 구독형',cond:h=>h.area==='플랫폼(T우주)'&&h.type!=='이용권형'},
 {ch:'T우주',name:'쿠폰·할인',desc:'이용권형',cond:h=>h.type==='이용권형'},
];
export const catOf=(ch,name)=>CATS.find(c=>c.ch===ch&&c.name===name);

// ---------- PO·상태 ----------
const selArr=s=>s.sel instanceof Set?[...s.sel]:s.sel;
export function poRange(o){ const base=o.head?1:0; const lo=base+o.slots.filter(s=>s.req).length; const hi=base+o.slots.reduce((a,s)=>{const n=selArr(s).length; return a+(n?Math.min(s.max,n):s.max);},0); return lo===hi?String(lo):`${lo}~${hi}`; }
// 전시상태 미사용이 노출·기간보다 먼저. 예전에 저장한 데이터는 use가 없으므로 사용으로 본다.
// 임시저장은 다른 상태보다 먼저 표시한다.
export const stOf=d=>d.draft?'draft':d.use===false?'stop':!d.show?'off':(d.from>TODAY?'wait':'live');
export const ST={live:'전시 중',wait:'전시 예약',off:'미노출',stop:'미사용',draft:'임시저장'};

// ---------- 저장 (localStorage) ----------
// 저장할 때 단품 객체는 id로, 불러올 때 다시 ITEMS 객체로 바꾼다.
const STORE_KEY='nova-product-displays-v1';
const toStore=d=>({...d,head:d.head?d.head.id:null,slots:d.slots.map(s=>({...s,sel:s.sel.map(o=>o.id)}))});
const fromStore=d=>({...d,head:d.head?ITEM_BY_ID.get(d.head)||null:null,slots:d.slots.map(s=>({...s,sel:s.sel.map(id=>ITEM_BY_ID.get(id)).filter(Boolean)}))});
// 저장한 것이 없으면 예시 데이터를 돌려준다(저장소에는 쓰지 않는다).
export function loadDisplays(){
  try { const v=JSON.parse(localStorage.getItem(STORE_KEY)); if(Array.isArray(v)&&v.length) return v.map(fromStore); } catch {}
  return seed();
}
export function saveDisplays(list){ try { localStorage.setItem(STORE_KEY, JSON.stringify(list.map(toStore))); return true; } catch { return false; } }

// ---------- 예시 데이터 ----------
function seed(){
  const list=[];
  const S=(area,names,req,max,locked)=>({area,ptypes:locked?['요금제형']:[],req,max,locked:!!locked,sel:names.map(byName).filter(Boolean),best:[],def:null,more:3,grp:true});
  const mk=(o)=>{ const d=Object.assign({id:'S'+list.length,to:'',show:true,noBase:false,dev:null,updated:TODAY},o); if(!d.cat&&d.head){ const c=CATS.find(c=>c.ch===d.ch&&c.cond(d.head)); d.cat=c?c.name:''; } if(d.type==='device') d.dev={soldout:'show',ax:null,rows:null,join:{allow:['기기변경','번호이동','신규가입'],def:'번호이동'},disc:{allow:['공시지원','선택약정'],def:'선택약정'}}; list.push(d); };
  mk({name:'갤럭시 Z 플립8 개통',type:'device',ch:'T다이렉트샵',from:'2026-09-01',head:byName('갤럭시 Z 플립8 / 256G / 크림'),slots:[S('이동전화',['라이트 79','라이트 69','라이트 59'],true,1,true),S('부가서비스',['T 올케어+6 스위치 플립(온라인)','분실파손6 플립(온라인)'],false,1),S('기기서비스',['삼성전자 갤럭시 Z플립8 보호필름'],true,1)]});
  mk({name:'라이트 59 데이터 팩',type:'plan',ch:'T월드',from:'2026-09-01',head:byName('라이트 59'),slots:[S('부가서비스',['V 컬러링','스마트 콜키퍼','안심클라우드'],false,1),S('로밍',['baro 요금제','OnePass 500 기본형'],false,1)]});
  mk({name:'DIY 기본 상품 택 2 + 추가 상품 1~2개 더',type:'sub',ch:'T우주',from:'2026-09-01',head:byName('T 우주패스 DIY (기본 2 + 추가 1~2)'),slots:[S('플랫폼(T우주)',['Google One 100GB 클라우드 스토리지','세븐일레븐 1,000원 당 300원 할인','투썸플레이스 30% 할인','밀리의서재 이용권'],true,2),S('플랫폼(T우주)',['YouTube Premium','Netflix 스탠다드 이용권','티빙 스탠다드','교보문고 sam 이용권','배달의민족 쿠폰팩','도미노피자 쿠폰'],true,2)]});
  mk({name:'T 우주 Big 4',type:'sub',ch:'T우주',cat:'쿠폰·할인',from:'2026-09-01',head:null,noBase:true,slots:[S('플랫폼(T우주)',['배달의민족 쿠폰팩'],true,1),S('플랫폼(T우주)',['파리바게뜨 1,000원당 300원 할인'],true,1),S('플랫폼(T우주)',['투썸플레이스 30% 할인'],true,1),S('플랫폼(T우주)',['세븐일레븐 1,000원 당 300원 할인'],true,1)]});
  mk({name:'OTT 골라담기',type:'sub',ch:'T우주',from:'2026-10-01',head:byName('Netflix 스탠다드 이용권'),slots:[S('플랫폼(T우주)',['티빙 스탠다드','티빙 프리미엄','YouTube Premium'],true,1),S('플랫폼(T우주)',['교보문고 sam 이용권','밀리의서재 이용권'],false,1)]});
  return list;
}
