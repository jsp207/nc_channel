// @ts-nocheck
// 상품 전시 검사 · 운영 상태 규칙. product-v021.html(상품 전시 등록/수정)과 display-list2.html(상품 전시 목록)이 함께 쓴다.
// 섹션별 필수 검사(sectionState · blocking)로 '작성 중' 여부를 정하고, 전시 여부 · 기간으로 운영 상태(status)를 정한다.
import { TODAY, NOW, poBy, hasSel, psBy, MSG2, FLOWS, GIFT, TDP, DISPLAYS, CHS, ptOf, APP_CH, ordKind } from "./display-data";

// 전시 시작·종료 일시. 종료일없음이면 종료는 빈 값
export const endOf=d=>d.noEnd?'':d.to;
export const startAt=d=>d.from?`${d.from}T${d.fromTime||'00:00'}`:'';
export const endAt=d=>endOf(d)?`${d.to}T${d.toTime||'23:59'}`:'';

// 상세 설명 본문이 채워졌는지(글자 또는 이미지)
export const htmlText=h=>new DOMParser().parseFromString(`<body>${h}</body>`,'text/html').body.textContent.trim();
export const htmlHasImg=h=>/<img\b/i.test(h);
export const descFilled=d=>d.descMode==='image'?d.descImgs.length>0:d.descMode==='html'&&(!!htmlText(d.descHtml)||htmlHasImg(d.descHtml));

export function combos(a){const os=a.opts.filter(o=>o.name.trim()&&o.vals.length);if(!os.length)return[];return os.reduce((acc,o)=>acc.flatMap(c=>o.vals.map(v=>c.concat(v))),[[]]).map(c=>c.join('|'));}
export const areaHasSel=a=>a.pos.some(id=>hasSel(poBy(id)));
export function rng(a){ if(a.mode!=='list') return null; return {lo:a.opt0?0:a.q, hi:a.useMax?a.mx:a.q}; }
export const usedIn=id=>DISPLAYS.filter(d=>d.kind==='po'&&d.conn.includes(id)).length;
export const connPOs=d=>d.kind==='po'?d.conn.map(poBy):[...new Set(d.conn.map(k=>psBy(k).po))];
export const activeFlows=d=>d.kind!=='po'?[]:Object.entries(FLOWS).filter(([k,f])=>d.conn.some(id=>f.types.includes(poBy(id).type)));
// ---------- 상품 유형 · 채널 연동 ----------
// 통합 APP · WEB 중 하나라도 고르면 주문 단계(가입 유형 · 할부 · 배송)를 이 화면에서 정한다
export const appOn=d=>APP_CH.some(c=>d.channels.includes(c));
// 섹션을 쓰는지: 상품 판매 전시 + 통합 APP · WEB + 상품 유형이 그 단계를 쓸 때 (k = join | inst | ship)
export const needs=(d,k)=>d.kind==='po'&&appOn(d)&&!!ptOf(d)&&ptOf(d).need.includes(k);
// 상품 유형과 연결 상품이 맞지 않으면 경고 (예: 기기서비스인데 기기 상품이 없음)
export function ptWarn(d){ const p=ptOf(d); if(!p||!p.kinds||!d.conn.length) return ''; return connPOs(d).some(x=>p.kinds.includes(x.type))?'':`연결 상품에 ${p.kn} 상품이 없어요. 상품 유형을 다시 확인하세요`; }
// v023 대표 상품(repPo)을 쓰는 전시인지. product-v022에서 저장한 전시만 이 값을 가진다
export const usesRep=d=>d.repPo!==undefined;
// 연결한 주문 구성안이 지금 상품 유형의 주문 유형과 다른지
export const planMismatch=d=>!!(d.orderPlan&&ptOf(d)&&ordKind(d.orderPlan.name)!==ptOf(d).ord);
// 받침 유무로 을/를을 고른다
export const eul=w=>{ const c=String(w).charCodeAt(String(w).length-1); return w+(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'을':'를'); };

// ---------- 검사 ----------
export function areaIssues(a,d){ const e=[];
 if(!a.pos.length) e.push(d.method!=='complex'?'연결 상품을 추가하세요':'PO를 1개 이상 배정하세요');
 if(a.mode==='list'&&a.pos.length){ const r=rng(a); if(r.hi>a.pos.length) e.push(`선택 수량(${r.hi}개)이 배정 PO 수(${a.pos.length}개)보다 많아요`); if(!a.opt0&&r.lo===a.pos.length&&r.hi===a.pos.length) e.push('배정 PO를 전부 골라야 해요. 고정으로 바꾸는 걸 권해요'); }
 if(a.mode==='opt'){ if(areaHasSel(a)) e.push(MSG2); if(!a.opts.some(o=>o.name.trim()&&o.vals.length)) e.push('옵션명과 값을 1개 이상 넣으세요'); if(a.opts.some(o=>o.name.trim()&&!o.vals.length)) e.push('값이 없는 옵션이 있어요'); const c=combos(a),un=c.filter(k=>!a.map[k]||!a.pos.includes(a.map[k])); if(c.length&&un.length) e.push(`조합 ${un.length}개가 PO에 매핑되지 않았어요`); }
 if(d.method==='complex'&&a.cond&&a.cond!=='always'){ const i=d.areas.indexOf(a), p=d.areas.slice(0,i).find(x=>x.id===a.parent);
  if(!i) e.push('첫 번째 영역은 제공 조건을 쓸 수 없어요');
  else if(!p) e.push('기준 영역을 고르세요');
  else if(p.mode==='fixed') e.push(`기준 영역(${d.areas.indexOf(p)+1}번 ${p.name||'영역'})이 고정이라 조건을 걸 수 없어요`);
  else if(a.cond==='only'&&!(a.trig||[]).some(v=>p.pos.includes(v))) e.push('어떤 선택일 때 보여줄지 고르세요'); }
 return e; }
// ---------- 사은품·티다팩: 연결 상품과 조건이 맞으면 자동으로 올라오고, 전시에서는 노출 여부·순서만 정한다 ----------
export const hasDev=d=>d.kind==='po'&&d.conn.some(id=>poBy(id).type==='기기서비스');
// 티다팩은 요금제를 연결했을 때만 노출한다
export const hasPlan=d=>d.kind==='po'&&d.conn.some(id=>poBy(id).type==='요금제');
export const GM=id=>GIFT.find(g=>g.id===id), TDM=id=>TDP.find(t=>t.id===id);
export const condMatch=(d,c)=>{ const P=connPOs(d); if(c.model) return P.some(p=>p.name.startsWith(c.model)); if(c.pos) return P.some(p=>c.pos.includes(p.id)); return false; };
// 소진·기간 종료는 자동 미노출, 시작 전은 시작일에 자동 노출. 진행 중이면 수량 10% 미만·종료 2주 이내를 알린다
export function benefitState(g){
 if(g.left===0) return {k:'out',t:'소진',auto:true};
 if(g.to<TODAY) return {k:'end',t:'기간 종료',auto:true};
 if(g.from>TODAY) return {k:'wait',t:`${+g.from.slice(5,7)}/${+g.from.slice(8,10)} 시작`,auto:false};
 const low=g.total&&g.left/g.total<0.1, soon=(new Date(g.to)-new Date(TODAY))/864e5<=14;
 return {k:'on',t:'진행 중',warn:low?'남은 수량 10% 미만':soon?'종료 2주 이내':''};
}
// 대상 가입 유형이 이 전시에서 모두 꺼져 있으면 고객에게 나오지 않는다
export function joinWarn(d,g){ if(!g.cond.join||!needs(d,'join')) return ''; const on=d.join.filter(j=>j.on).map(j=>j.k); return g.cond.join.some(j=>on.includes(j))?'':`대상 가입 유형(${g.cond.join.join(', ')})이 이 전시에서 꺼져 있어 고객에게 나오지 않아요`; }
// 조건 매칭 항목을 연결 상품에 맞춰 다시 맞춘다. 전시 전용(직접 연결) 항목은 그대로 둔다
export function syncList(list,pool,d){ const by=id=>pool.find(x=>x.id===id); const keep=list.filter(x=>x.src==='own'||condMatch(d,by(x.id).cond)); pool.filter(g=>!g.own&&condMatch(d,g.cond)&&!keep.some(x=>x.id===g.id)).forEach(g=>keep.push({id:g.id,src:'auto',show:!benefitState(g).auto})); return keep; }
export function syncBenefits(d){ d.gifts=syncList(d.gifts,GIFT,d).filter(x=>!(d.giftCut||[]).includes(x.id)); d.tds=d.kind==='po'?syncList(d.tds,TDP,d).filter(x=>!(d.tdCut||[]).includes(x.id)):[]; }
// T기프트는 기기 상품을 연결했을 때만 노출한다(가입 유형 · 할부 설정과 같음)
export const visibleGifts=d=>!hasDev(d)?[]:d.gifts.filter(x=>{ const g=GM(x.id); return x.show&&!benefitState(g).auto&&!joinWarn(d,g); });
export const visibleTd=d=>!hasPlan(d)?[]:d.tds.filter(x=>x.show&&!benefitState(TDM(x.id)).auto);
// 자동 배지: 노출 중인 사은품·티다팩이 있으면 붙는다. 직접 만든 배지를 먼저 두고 3개 한도 안에서만 붙는다
export function autoBadges(d){ const a=[]; if(d.giftBadge&&visibleGifts(d).length) a.push({k:'gift',t:'사은품 증정',c:'#0F6E56',s:'f',from:'T기프트'}); if(d.tdBadge&&visibleTd(d).length) a.push({k:'td',t:'티다팩 혜택',c:'#D85A30',s:'f',from:'티다팩'}); return a.slice(0,Math.max(0,3-d.badges.length)); }
// 섹션 상태: st = done | todo | warn | na | on | off, e = 이슈 목록
export function sectionState(d){
 const S={};
 // 전시 설정 = 전시 채널
 S.ch=d.channels.length?{st:'done',e:[]}:{st:'todo',e:['전시 채널을 1개 이상 고르세요']};
 S.kind={st:'done',e:[]};
 S.conn=d.conn.length?{st:'done',e:[]}:{st:'todo',e:['연결 상품을 1개 이상 추가하세요']};
 if(d.kind==='ps') S.method={st:'na',e:[]};
 else { const un=d.method==='complex'?d.conn.filter(id=>!d.areas.some(a=>a.pos.includes(id))):[]; const pw=ptWarn(d); const e=[...(!d.svc?[usesRep(d)?'대표 상품을 지정하세요':'상품 유형을 고르세요']:pw?[pw]:[]),...d.areas.flatMap((a,i)=>areaIssues(a,d).map(x=>`${d.method==='complex'?(i+1)+'번 ':''}${a.name||'영역'}: ${x}`)),...(un.length?[`구성 영역에 배정되지 않은 연결 상품 ${un.length}개`]:[])]; if(!d.areas.length) e.unshift('구성 영역을 만드세요'); S.method={st:!d.areas.some(a=>a.pos.length)&&!d.svc?'todo':(e.length?'warn':'done'),e}; }
 const be=[]; if(!d.name.trim()) be.push('전시명을 입력하세요'); if(!d.from) be.push('전시 시작일을 입력하세요'); if(!d.noEnd&&!d.to) be.push('종료일을 입력하거나 종료일없음을 선택하세요'); if(endAt(d)&&startAt(d)&&endAt(d)<=startAt(d)) be.push('전시 종료 일시가 시작 일시보다 빨라요');
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
 S.rel={st:d.related?'on':'off',e:[]};
 S.sim=!d.sim.on?{st:'off',e:[]}:(d.sim.mode==='def'||(d.sim.t.trim()&&d.sim.s.trim()))?{st:'on',e:[]}:{st:'warn',e:['직접 입력한 타이틀과 소타이틀을 채우세요']};
 // 추가설정 = 유사한 상품 · 오퍼링 문구 · 검색 노출 설정을 묶은 섹션
 { const sub=[S.sim,S.cvm,S.search]; S.more={st:sub.some(s=>s.st==='warn')?'warn':sub.some(s=>s.st==='done'||s.st==='on')?'done':'todo',e:sub.flatMap(s=>s.e)}; }
 // 가입 유형 · 할부 · 배송: 통합 APP · WEB + 상품 유형이 쓰는 단계일 때만 나오는 필수 섹션.
 // 주문 구성 방식이 꺼져 있으면 고객 화면에 나오지 않으므로 필수에서 뺀다(opt). 설정 값은 남는다
 const jOn=d.join.filter(j=>j.on), opt=!d.orderOn;
 S.join=!needs(d,'join')?{st:'na',e:[]}:{st:jOn.length?'done':'todo',e:jOn.length?[]:['가입 유형을 1개 이상 켜세요'],opt};
 { const miss=jOn.filter(j=>!(d.instBy[j.k]||[]).some(x=>x.on)); S.inst=!needs(d,'inst')?{st:'na',e:[]}:{st:miss.length?'todo':'done',e:miss.map(j=>`${j.k}: 할부 개월을 1개 이상 켜세요`),opt}; }
 S.ship=!needs(d,'ship')?{st:'na',e:[]}:{st:d.ship.some(x=>x.on)?'done':'todo',e:d.ship.some(x=>x.on)?[]:['배송 유형을 1개 이상 켜세요'],opt};
 if(!hasDev(d)) S.gift={st:'na',e:[]}; else { const bad=d.gifts.filter(x=>x.show&&joinWarn(d,GM(x.id))); S.gift=!d.gifts.length?{st:'todo',e:[]}:bad.length?{st:'warn',e:bad.map(x=>`${GM(x.id).n}: ${joinWarn(d,GM(x.id))}`)}:{st:visibleGifts(d).length?'done':'todo',e:[]}; }
 S.td=!hasPlan(d)?{st:'na',e:[]}:{st:visibleTd(d).length?'done':'todo',e:[]};
 // 주문 구성 방식은 필수. 주문 받기 ON: 주문 구성안을 연결해야 승인요청할 수 있다 (임시저장은 된다)
 // OFF: 대체 버튼 문구를 채워야 한다 (버튼 없음 제외)
 if(d.kind==='ps') S.order={st:'na',e:[]};
 else if(d.orderOn){ const e=[!d.orderPlan&&'사용할 주문 구성안을 선택하세요',planMismatch(d)&&`연결한 구성안이 ${ptOf(d).ord}용이 아니에요`].filter(Boolean); S.order={st:!d.orderPlan?'todo':e.length?'warn':'done',e}; }
 else { const o=d.off, e=[o.act!=='none'&&!o.btn.trim()&&'대체 버튼 문구를 입력하세요'].filter(Boolean); S.order={st:e.length?'warn':'done',e}; }
 return S;
}
// [키, 이름, 필수, 짧은 이름]. 화면 순서와 같다
export const SECS=[['kind','전시 유형',true,'전시 유형'],['conn','연결 상품',true,'연결 상품'],['method','고객 선택 방식',true,'고객 선택 방식'],['ch','전시 설정',true,'전시 설정'],['join','가입 유형',true,'가입 유형'],['inst','할부 설정',true,'할부 설정'],['ship','배송 유형',true,'배송 유형'],['info','전시 정보',true,'전시 정보'],['extra','콘텐츠 정보',false,'콘텐츠 정보'],['review','구매후기',false,'구매후기'],['rel','연관 상품',false,'연관 상품'],['more','추가설정',false,'추가설정'],['gift','T기프트',false,'T기프트'],['td','티다팩',false,'티다팩'],['order','주문 구성 방식',true,'주문 구성']];
export const STL={done:['완료','ok'],todo:['미작성',''],warn:['확인 필요','warn'],na:['해당 없음',''],on:['노출','ok'],off:['미노출',''],unused:['사용 안 함','']};
// 조건부 섹션: 조건이 안 맞으면 섹션을 숨긴다 (가입 유형 · 할부 · 배송 = 통합 APP · WEB + 상품 유형, T기프트 = 기기 상품 연결 시, 티다팩 = 요금제 연결 시)
export const secHidden=(k,d)=>(k==='join'||k==='inst'||k==='ship')?!needs(d,k):k==='gift'?!hasDev(d):k==='td'?!hasPlan(d):false;
// 필수 섹션인지: 주문 구성 방식이 꺼져 있으면 채널 연동 섹션(가입 유형 · 할부 · 배송)은 필수에서 빠진다
export const isReq=(k,S)=>SECS.some(([x,,r])=>x===k&&r)&&!S[k].opt;
export function blocking(d){ const S=sectionState(d); return SECS.filter(([k])=>isReq(k,S)&&(S[k].st==='todo'||S[k].st==='warn')).flatMap(([k,l])=>S[k].e.length?S[k].e.map(x=>[k,l,x]):[[k,l,'입력이 필요해요']]); }
export function status(d){ if(blocking(d).length) return ['작성 중','warn']; if(!d.show) return ['미전시','off']; if(endAt(d)&&endAt(d)<NOW) return ['종료','off']; if(startAt(d)>NOW) return ['전시 예약','wait']; return ['전시 중','live']; }
export function methodLabel(d){ if(d.kind==='ps') return '<span class="pill">해당 없음</span>'; if(d.method==='select') return '선택형 · '+(d.areas[0]&&d.areas[0].mode==='opt'?'옵션 선택':'상품 목록'); if(d.method==='complex') return `복합형 · ${d.areas.length}개 영역`; return '고정형'; }

// ---------- 목록 표시 ----------
export const firstMore=l=>!l.length?'-':l[0]+(l.length>1?` 외 ${l.length-1}`:'');
// 담당자 · 담당팀 · 버전 · 최종등록(수정) 정보. 샘플 전시는 번호로 정해 둔다
export const OWNERS=['김담당(P123458)','이담당(P123459)','박담당(P123460)'], TEAMS=['채널상품팀','디바이스상품팀','구독상품팀'];
export const meta=d=>({ver:d.ver||1,owner:d.owner||OWNERS[d.id%3],team:d.team||TEAMS[d.id%3],editor:d.editor||'김등록(P123456)',at:d.updatedAt||`${d.from||TODAY} 09:00:00`});
export const OPST={'전시 예약':['예정','wait'],'전시 중':['전시중','live'],'종료':['종료','off'],'미전시':['미전시','off'],'작성 중':['작성중','off']};
export const opState=d=>OPST[status(d)[0]];
export function epcState(d){ const pos=connPOs(d); if(!pos.length) return null; const s=pos.find(p=>p.sale!=='판매중'); return s?[s.sale,'stop']:['운영','ok']; }
export const chText=d=>d.channels.length&&CHS.every(c=>d.channels.includes(c))?'All 채널':firstMore(d.channels);
export const connNames=d=>d.kind==='po'?d.conn.map(id=>poBy(id).name):d.conn.map(k=>psBy(k).name);
export function methodText(d){ if(d.kind==='ps') return '-'; if(d.method==='complex') return '복합형'; if(d.method==='fixed') return '고정';
 const a=d.areas[0]; return a&&a.mode==='opt'?`옵션 선택, 대상 ${a.pos.length}개`:'목록 선택'; }
