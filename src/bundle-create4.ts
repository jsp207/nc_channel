// @ts-nocheck
// 번들 생성 4: 번들 생성 3(bundle-create3.ts)을 복사해 시작한 화면.
// 실제 상품 1,549개, 대표 변형 체크, 구성별 선택 수(min~max), 후보 검색·표시 상한, 플랫폼 커스텀 대표를 쓴다.
import "./style.css";
import { requireAuthentication } from "./auth";
import ITEMS_V3 from "./data/items-v3.json";

requireAuthentication();

// ---------- 마스터 정책 ----------
const SOLO_TYPES = new Set(['액세서리형','요금제형','월정액형','무료형','종량/충전형','제휴 보험형','제휴 클럽형','로밍 요금제형','로밍 옵션형','로밍 충전형','단일 구독형','결합 구독형','이용권형']);
const AREAS = ['기기서비스','이동전화','부가서비스','로밍','플랫폼(T우주)'];
// svc: 서비스 키(정책 4), inc: 포함 서비스, dev: 기종, net: 네트워크, seg: 세그먼트, req: 전제 상품
const ITEMS = ITEMS_V3.map(i=>({...i, solo:SOLO_TYPES.has(i.type)}));
const CAND_LIMIT = 100;

// ---------- 공통 ----------
const $ = s=>document.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e;};
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(m){const t=$('#toast'); t.textContent=m; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),1800);}
const joinKey = i => i.line==='무관' ? '무관' : (i.net && i.net!=='-' ? `${i.line}-${i.net}` : i.line);
const modelKey = i => i.area+'|'+i.type+'|'+i.key;
const VAR = {}; ITEMS.forEach(i=>(VAR[modelKey(i)]=VAR[modelKey(i)]||[]).push(i));
const variants = i => VAR[modelKey(i)]||[i];
const lower = v => String(v||'').trim().toLocaleLowerCase();
const kindOf = s => s.min===0 ? '선택' : '필수';
const autoIncluded = s => s.min>0 && s.min===s.max && s.sel.size===s.max;
// 커스텀 대표는 PO가 아니므로 대표 몫(1)을 더하지 않는다.
function poRange(head,slots){ const base=head?.custom?0:1; const lo=base+slots.reduce((a,s)=>a+s.min,0), hi=base+slots.reduce((a,s)=>a+s.max,0); return lo===hi?String(lo):`${lo}~${hi}`; }

// ---------- 대표 상품 ----------
const B={head:null,slots:[],variantIds:new Set()};
const bArea=$('#bArea'), bHead=$('#bHead');
AREAS.forEach(a=>bArea.appendChild(new Option(`${a} (${ITEMS.filter(i=>i.area===a).length})`,a)));

// 플랫폼(T우주): 커스텀 대표와 우주패스(결합 구독형)를 단품 목록 맨 위에 둔다.
const PLATFORM='플랫폼(T우주)';
const isPass = i => i.area===PLATFORM && i.type==='결합 구독형';
function fillHeads(){
  const seen=new Set(); const heads=[];
  bHead.innerHTML='';
  ITEMS.filter(i=>i.area===bArea.value).forEach(i=>{
    const k=modelKey(i); if(seen.has(k)) return; seen.add(k); heads.push(i);
  });
  if(bArea.value===PLATFORM) bHead.appendChild(new Option('＋ 커스텀 대표 만들기 (제목만 입력)','CUSTOM'));
  [...heads.filter(isPass),...heads.filter(i=>!isPass(i))].forEach(i=>{
    const n=variants(i).length; bHead.appendChild(new Option(n>1?`${i.key} (${n}종 선택 가능)`:i.name,i.id));
  });
  // 커스텀이 맨 위에 있어도 기본 선택은 첫 번째 실제 단품
  if(bHead.options[0]?.value==='CUSTOM'&&bHead.options.length>1) bHead.selectedIndex=1;
  setHead();
}
// 커스텀 대표: EPC 단품이 아닌 제목·가격만 있는 컨테이너. PO에 포함되지 않고, 가격은 번들에 직접 건다.
const parsePrice = v => { const d=String(v).replace(/[^0-9]/g,''); return d?Number(d):null; };
const formatPrice = n => n==null?'':n.toLocaleString('ko-KR');
// 단위: month(월 금액) / year(연 금액)
const priceLabel = h => h.price==null?'':`${h.priceUnit==='year'?'년':'월'} ${formatPrice(h.price)}원`;
function customHead(){
  const t=$('#bCustomTitle').value.trim();
  return {id:'CUSTOM',name:t,area:bArea.value,type:'커스텀 컨테이너',line:'무관',net:'-',key:t||'커스텀 대표',solo:true,custom:true,price:parsePrice($('#bCustomPrice').value),priceUnit:$('#bCustomUnit').value};
}
function setHead(){
  const custom=bHead.value==='CUSTOM';
  if(custom){ $('#bCustomTitle').value=''; $('#bCustomPrice').value=''; $('#bCustomUnit').value='month'; }
  $('#bCustomRow').hidden=!custom;
  B.head=custom?customHead():(ITEMS.find(i=>i.id===bHead.value)||null);
  onHead();
}
bArea.addEventListener('change',fillHeads);
bHead.addEventListener('change',setHead);
$('#bCustomTitle').addEventListener('input',()=>{
  if(!B.head?.custom) return;
  const t=$('#bCustomTitle').value.trim(); B.head.name=t; B.head.key=t||'커스텀 대표'; check();
});
// 숫자만 받아 천 단위 쉼표로 보여준다.
$('#bCustomPrice').addEventListener('input',e=>{
  if(!B.head?.custom) return;
  B.head.price=parsePrice(e.target.value); e.target.value=formatPrice(B.head.price); check();
});
$('#bCustomUnit').addEventListener('change',e=>{ if(!B.head?.custom) return; B.head.priceUnit=e.target.value; check(); });

function onHead(){
  const h=B.head;
  if(!h){ $('#bOptionPicker').hidden=true; B.slots=[]; B.variantIds=new Set(); renderSlots(); check(); return; }
  B.slots=[]; if(!h.solo) B.slots.push({area:'이동전화',min:1,max:1,sel:new Set(),query:'',locked:true});
  setupOptions(); renderSlots(); renderAutoCats(); check();
}

// ---------- 대표 상품 옵션 ----------
// 모델을 고르면 그 모델의 실제 SKU에서 옵션(색상·용량, 워치는 사이즈·소재·색상)을 만든다.
// 옵션 칩으로 값을 넓게 고르고, SKU 매트릭스에서 SKU 단위로 빼거나 기본 SKU를 정한다.
// 적용 SKU = 고른 옵션 값의 조합 중 실제로 있는 SKU - 매트릭스에서 뺀 SKU. (없는 조합은 생기지 않음)
// 옵션 축 순서는 채널 화면 설정: 카테고리 기본값(AXIS_ORDER_BY_CAT)을 두고 운영자가 바꿀 수 있다.
const AXIS_ORDER_BY_CAT = [
  {test:cat=>/워치/.test(cat), order:['사이즈','소재','색상','용량']},
  {test:()=>true,             order:['색상','용량','소재','사이즈']}, // 휴대폰·태블릿 등
];
// SKU 이름 "모델[ (소재, 사이즈)] / 용량 / 색상"에서 옵션 값을 뽑는다.
function skuOptions(i){
  if(i.type!=='약정형') return {'상품':i.name};
  const [model='',cap='',color='']=i.name.split(' / ');
  const o={};
  const m=model.match(/\(([^,()]+),\s*([^()]+)\)\s*$/);
  if(m){ o['소재']=m[1].trim(); o['사이즈']=m[2].trim(); }
  if(cap&&cap!=='-') o['용량']=cap;
  if(color) o['색상']=color;
  return o;
}
// 모델 안에서 값이 2개 이상인 옵션만 고를 대상이다. 값 순서는 SKU 목록에 처음 나온 순서.
function modelAxes(h){
  const vals={};
  variants(h).forEach(i=>Object.entries(skuOptions(i)).forEach(([k,v])=>{ const a=(vals[k]=vals[k]||[]); if(!a.includes(v)) a.push(v); }));
  const base=AXIS_ORDER_BY_CAT.find(r=>r.test(h.cat||'')).order;
  return Object.keys(vals).filter(k=>vals[k].length>1)
    .sort((a,b)=>(base.indexOf(a)+1||99)-(base.indexOf(b)+1||99))
    .map(k=>({name:k,values:vals[k]}));
}

// 가격·재고: EPC 값 자리의 예시 (ref v3-3과 같은 계산)
const hash=str=>{let h=0;for(const c of str)h=(h*31+c.charCodeAt(0))>>>0;return h;};
const CAPW={'128G':0,'256G':0,'512G':300000,'1T':900000,'2T':1800000};
function skuPrice(i){ const cap=skuOptions(i)['용량']; const base=1200000+(hash(i.key)%9)*150000; return base+(CAPW[cap]!=null?CAPW[cap]:(hash(i.name)%4)*250000); }
const skuOut=i=>hash(i.name)%6===0;
const won=n=>n.toLocaleString('ko-KR')+'원';
const COLORS={'블랙':'#222','화이트':'#f2f2f2','실버':'#d8d8dc','골드':'#d9b98a','블루':'#7aa7e8','핑크':'#f0a7c0','크림':'#efe6d2','그린':'#8fbf9a','라벤더':'#c3b6e8','그라파이트':'#5a5d66','그래파이트':'#5a5d66','버건디':'#5a1d2b','글레이서':'#dbe6f5','글레이셔':'#dbe6f5','티타늄':'#9a9aa0','오렌지':'#f2934a','민트':'#a9e0d0','네이비':'#2b3a67','레드':'#c93b3b','스카이블루':'#9ed3f5','스타라이트':'#ece5d8','미드나이트':'#2a2f38','그레이':'#8a8d93','퍼플':'#b9a3d9','옐로':'#f3dc6b','브론즈':'#8a6a4a','슬레이트':'#6b7078','내추럴':'#c9c2b5','문스톤':'#9aa0a8','스페이스 블랙':'#2b2c30','스페이스 그레이':'#6e7076'};
// 정확한 이름이 없으면 이름에 들어 있는 가장 긴 색 이름으로 찾는다 (예: "내추럴 티타늄" → 내추럴)
const swatch=c=>COLORS[c]||COLORS[Object.keys(COLORS).filter(k=>c.includes(k)).sort((a,b)=>b.length-a.length)[0]]||'#bbb';

// 가입 유형·할인 방법: 주문 조건이며 PO가 아니다. 공시지원·선택약정은 MP.
const JOIN=[['기기변경','휴대폰만 새로 구매하고 싶어요'],['번호이동','다른 통신사에서 SK텔레콤으로 이동하고 싶어요'],['신규가입','새로 가입하고 싶어요']];
const DISC=[['공시지원','단말 지원금'],['선택약정','요금 25% 할인']];
const M={soldout:'show',exclude:new Set(),def:null,sel:null,join:{allow:new Set(['기기변경','번호이동','신규가입']),def:'번호이동'},disc:{allow:new Set(['공시지원','선택약정']),def:'선택약정'}};

const isDevice = () => !!B.head && !B.head.custom && B.head.type==='약정형' && B.axes.length>0;
const orderedAxes = () => B.axisOrder.map(n=>B.axes.find(a=>a.name===n));
const chipMatch = o => B.axes.every(a=>B.optSel[a.name].has(o[a.name]));

function setupOptions(){
  const h=B.head;
  B.axes=h.custom?[]:modelAxes(h);
  B.axisOrder=B.axes.map(a=>a.name);
  B.optSel=Object.fromEntries(B.axes.map(a=>[a.name,new Set()]));
  M.exclude=new Set(); M.def=null; M.sel=null;
  // 고를 옵션이 없으면(단일 SKU) 그 SKU를 그대로 쓴다.
  B.variantIds=new Set(!h.custom&&!B.axes.length?variants(h).map(x=>x.id):[]);
  $('#bOptionPicker').hidden=h.custom||!B.axes.length;
  $('#bDevice').hidden=!isDevice();
  $('#bPvSection').hidden=!isDevice();
  $('#bJoinRow').hidden=$('#bDiscRow').hidden=h.solo;
  renderAxisOrder(); renderCond(); renderOptions();
}
function applyOptions(){
  const ready=B.axes.every(a=>B.optSel[a.name].size>0);
  B.variantIds=new Set(ready?variants(B.head).filter(i=>chipMatch(skuOptions(i))&&!M.exclude.has(i.id)).map(i=>i.id):[]);
}
// 적용 SKU를 옵션 축 순서대로 정렬한 목록
function appliedSkus(){
  const axes=orderedAxes();
  const idx=(a,v)=>a.values.indexOf(v);
  return variants(B.head).filter(i=>B.variantIds.has(i.id)).sort((x,y)=>{ const a=skuOptions(x), b=skuOptions(y); for(const ax of axes){ const d=idx(ax,a[ax.name])-idx(ax,b[ax.name]); if(d) return d; } return 0; });
}
const defaultSku = () => { const list=appliedSkus(); return list.find(i=>i.id===M.def)||list[0]||null; };

// 옵션 축 순서 전환: 축 2개면 버튼 2개, 3개(워치)면 6가지 순서 선택
const permutations = a => a.length<=1?[a]:a.flatMap((x,i)=>permutations([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]));
function renderAxisOrder(){
  const box=$('#bAxisCtl'); box.innerHTML='';
  $('#bAxisRow').hidden=B.axes.length<2;
  if(B.axes.length<2) return;
  const perms=permutations(B.axes.map(a=>a.name));
  if(perms.length===2){
    const seg=el('span','seg'); seg.setAttribute('role','group'); seg.setAttribute('aria-label','옵션 축 순서');
    perms.forEach(p=>{ const b=el('button',p.join('|')===B.axisOrder.join('|')?'on':'',escapeHtml(p.join(' → '))); b.type='button';
      b.addEventListener('click',()=>{ B.axisOrder=p; renderAxisOrder(); renderOptions(); }); seg.appendChild(b); });
    box.appendChild(seg);
  } else {
    const sel=document.createElement('select'); sel.setAttribute('aria-label','옵션 축 순서');
    perms.forEach(p=>sel.appendChild(new Option(p.join(' → '),p.join('|'))));
    sel.value=B.axisOrder.join('|');
    sel.addEventListener('change',()=>{ B.axisOrder=sel.value.split('|'); renderOptions(); });
    box.appendChild(sel);
  }
}

// 받침 유무로 목적격 조사(을/를)를 고른다.
const objParticle = w => { const c=w.charCodeAt(w.length-1)-0xAC00; return c>=0&&c<11172&&c%28?'을':'를'; };
function renderOptions(){
  const box=$('#bOptions'); box.innerHTML='';
  orderedAxes().forEach(a=>{
    const row=el('div','option-axis'); row.appendChild(el('b','',escapeHtml(a.name)));
    const vals=el('div','option-values'); vals.setAttribute('role','group'); vals.setAttribute('aria-label',a.name);
    // 옵션별 전체 선택
    const picked=B.optSel[a.name].size;
    const allLab=el('label','option-value option-all'); const all=document.createElement('input'); all.type='checkbox';
    all.checked=picked===a.values.length; all.indeterminate=picked>0&&picked<a.values.length;
    all.setAttribute('aria-label',`${a.name} 전체 선택`);
    all.addEventListener('change',()=>{ B.optSel[a.name]=new Set(all.checked?a.values:[]); renderOptions(); });
    allLab.append(all,el('span','','전체')); vals.appendChild(allLab);
    a.values.forEach(v=>{
      // 다른 옵션에서 고른 값과 맞는 SKU가 없으면 흐리게 표시(선택은 가능)
      const others=B.axes.filter(x=>x.name!==a.name&&B.optSel[x.name].size);
      const avail=variants(B.head).some(i=>{ const o=skuOptions(i); return o[a.name]===v&&others.every(x=>B.optSel[x.name].has(o[x.name])); });
      const lab=el('label','option-value'+(avail?'':' off')); if(!avail) lab.title='선택한 다른 옵션과 맞는 SKU가 없습니다';
      const input=document.createElement('input'); input.type='checkbox'; input.checked=B.optSel[a.name].has(v);
      input.addEventListener('change',()=>{ input.checked?B.optSel[a.name].add(v):B.optSel[a.name].delete(v); renderOptions(); });
      lab.append(input,el('span','',escapeHtml(v))); vals.appendChild(lab);
    });
    row.appendChild(vals); box.appendChild(row);
  });
  applyOptions();
  const empty=orderedAxes().filter(a=>!B.optSel[a.name].size).map(a=>a.name);
  const ex=[...M.exclude].filter(id=>variants(B.head).some(i=>i.id===id&&chipMatch(skuOptions(i)))).length;
  $('#bOptionResult').innerHTML=empty.length
    ? `${empty.join(' · ')}${objParticle(empty[empty.length-1])} 1개 이상 선택하세요`
    : `적용 SKU <b>${B.variantIds.size}개</b> / 전체 ${variants(B.head).length}개${ex?` · 매트릭스에서 제외 ${ex}개`:''}`;
  renderMatrix(); renderPreview(); check();
}

// ---------- SKU 매트릭스 (v3-3) ----------
// 열 = 마지막 옵션 축, 행 = 나머지 축의 조합. 칸 = SKU(가격·재고). 없는 조합은 "없음".
function renderMatrix(){
  if(!isDevice()) return;
  const axes=orderedAxes(), col=axes[axes.length-1], rowAxes=axes.slice(0,-1);
  const skus=variants(B.head).map(i=>({i,o:skuOptions(i)}));
  const rowKey=o=>rowAxes.map(a=>o[a.name]).join(' · ');
  const rowKeys=[]; skus.forEach(({o})=>{ const k=rowKey(o); if(!rowKeys.includes(k)) rowKeys.push(k); });
  const idx=(a,v)=>a.values.indexOf(v);
  rowKeys.sort((x,y)=>{ const a=x.split(' · '), b=y.split(' · '); for(let n=0;n<rowAxes.length;n++){ const d=idx(rowAxes[n],a[n])-idx(rowAxes[n],b[n]); if(d) return d; } return 0; });
  const def=defaultSku();
  let html=`<tr><th>${escapeHtml(rowAxes.map(a=>a.name).join(' · ')||'모델')} \\ ${escapeHtml(col.name)}</th>${col.values.map(v=>`<th>${escapeHtml(v)}</th>`).join('')}</tr>`;
  rowKeys.forEach(rk=>{
    html+=`<tr><th>${escapeHtml(rk||B.head.key)}</th>`+col.values.map(cv=>{
      const x=skus.find(({o})=>rowKey(o)===rk&&o[col.name]===cv);
      if(!x) return '<td class="none">없음</td>';
      const inSel=chipMatch(x.o), ex=M.exclude.has(x.i.id), out=skuOut(x.i), isDef=def&&def.id===x.i.id;
      return `<td class="${inSel?'':'dim'} ${ex?'ex':''} ${out?'out':''} ${isDef?'def':''}" data-id="${x.i.id}" ${inSel?'':'title="위 옵션에서 먼저 선택하세요"'}><label><input type="checkbox" data-id="${x.i.id}" ${inSel&&!ex?'checked':''} ${inSel?'':'disabled'}> ${won(skuPrice(x.i))}<small>${out?'품절':'판매중'}${isDef?' · 기본':''}</small></label></td>`;
    }).join('')+'</tr>';
  });
  const t=$('#mxTable'); t.innerHTML=html;
  t.querySelectorAll('input').forEach(cb=>cb.addEventListener('change',()=>{ cb.checked?M.exclude.delete(cb.dataset.id):M.exclude.add(cb.dataset.id); renderOptions(); }));
  // 더블클릭 = 기본 SKU (고객 화면의 첫 선택)
  t.querySelectorAll('td[data-id]').forEach(td=>td.addEventListener('dblclick',()=>{ if(B.variantIds.has(td.dataset.id)){ M.def=td.dataset.id; M.sel=null; renderOptions(); } }));
}
$('#soSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  $('#soSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); M.soldout=b.dataset.t; renderPreview(); check();
}));

// ---------- 가입 유형·할인 방법 (v3-3) ----------
function renderCond(){
  const mk=(box,list,st)=>{
    box.innerHTML='';
    list.forEach(([k])=>{
      const l=el('label','chip cond '+(st.allow.has(k)?(st.def===k?'acc':''):'no'));
      l.innerHTML=`<input type="checkbox" ${st.allow.has(k)?'checked':''}> ${k}${st.def===k?' · 기본':''}`;
      l.querySelector('input').addEventListener('change',e=>{ e.target.checked?st.allow.add(k):st.allow.delete(k); if(!st.allow.has(st.def)) st.def=[...st.allow][0]||null; renderCond(); renderPreview(); check(); });
      l.addEventListener('dblclick',()=>{ if(st.allow.has(k)){ st.def=k; renderCond(); renderPreview(); } });
      box.appendChild(l);
    });
    box.appendChild(el('span','pill','더블클릭 = 기본값'));
  };
  mk($('#joinOpts'),JOIN,M.join); mk($('#discOpts'),DISC,M.disc);
}

// ---------- 고객 화면 미리보기 (v3-3) ----------
// 옵션 축 순서대로 고객이 고른다: 앞 축에서 고른 값에 맞는 SKU만 다음 축에 나온다. 마지막 선택 = SKU = PO.
function renderPreview(){
  const pv=$('#pv'); if(!isDevice()) return;
  const h=B.head, axes=orderedAxes();
  const shown=appliedSkus().filter(i=>M.soldout==='show'||!skuOut(i));
  if(!shown.length){ pv.innerHTML='<p class="pv-empty">옵션을 선택하면 고객 화면이 보입니다.</p>'; return; }
  const def=defaultSku();
  const cur=shown.find(i=>i.id===M.sel)||shown.find(i=>def&&i.id===def.id)||shown[0];
  const co=skuOptions(cur);
  let html=`<h4>${escapeHtml(h.key)}</h4><div class="pill">${axes.map(a=>escapeHtml(co[a.name])).join(' · ')} · 출고가 ${won(skuPrice(cur))}</div>`;
  axes.forEach((a,k)=>{
    const prefix=axes.slice(0,k);
    const pool=shown.filter(i=>{ const o=skuOptions(i); return prefix.every(p=>o[p.name]===co[p.name]); });
    const vals=a.values.filter(v=>pool.some(i=>skuOptions(i)[a.name]===v));
    html+=`<div class="lbl"><span>${escapeHtml(a.name)}</span><span>${escapeHtml(co[a.name])}</span></div>`;
    if(a.name==='색상') html+=`<div class="sw">${vals.map(v=>`<button type="button" title="${escapeHtml(v)}" aria-label="${escapeHtml(v)}" data-k="${k}" data-v="${escapeHtml(v)}" class="${v===co[a.name]?'on':''}" style="background:${swatch(v)}"></button>`).join('')}</div>`;
    else if(k===axes.length-1) html+=vals.map(v=>{ const x=pool.find(i=>skuOptions(i)[a.name]===v); const o=skuOut(x); return `<div class="cap ${x.id===cur.id?'on':''} ${o?'out':''}" data-k="${k}" data-v="${escapeHtml(v)}"><span>${escapeHtml(v)}</span><span>${won(skuPrice(x))}${o?' · 품절':''}</span></div>`; }).join('');
    else html+=`<div class="pv-chips">${vals.map(v=>`<button type="button" class="${v===co[a.name]?'on':''}" data-k="${k}" data-v="${escapeHtml(v)}">${escapeHtml(v)}</button>`).join('')}</div>`;
  });
  if(skuOut(cur)) html+=`<div class="warn">${axes.map(a=>escapeHtml(co[a.name])).join(', ')}는 품절이에요. 입고 알림을 신청하면 주문할 수 있을 때 알려 드려요.</div>`;
  if(!h.solo){
    html+=`<div class="lbl"><span>가입 유형</span></div>${JOIN.filter(([k])=>M.join.allow.has(k)).map(([k,d])=>`<div class="cap ${M.join.def===k?'on':''}"><span>${d} (${k})</span></div>`).join('')}`;
    html+=`<div class="lbl"><span>할인 방법</span></div>${DISC.filter(([k])=>M.disc.allow.has(k)).map(([k,d])=>`<div class="cap ${M.disc.def===k?'on':''}"><span>${k}</span><span>${d}</span></div>`).join('')}`;
  }
  html+=`<div class="lbl"><span>다음 단계</span><span>${h.solo?'담기':'요금제 구성(필수)'+(M.join.def==='기기변경'?' · 현재 요금제 유지 후보 포함(확정 필요)':'')}</span></div>`;
  pv.innerHTML=html;
  // 값을 누르면 앞 축 선택은 유지하고, 뒤 축은 지금 값과 최대한 같은 SKU로 옮긴다.
  pv.querySelectorAll('[data-k]').forEach(n=>n.addEventListener('click',()=>{
    const k=+n.dataset.k, v=n.dataset.v, prefix=axes.slice(0,k), rest=axes.slice(k+1);
    const cand=shown.filter(i=>{ const o=skuOptions(i); return o[axes[k].name]===v&&prefix.every(p=>o[p.name]===co[p.name]); });
    const score=i=>{ const o=skuOptions(i); return rest.filter(r=>o[r.name]===co[r.name]).length; };
    const pick=cand.sort((x,y)=>score(y)-score(x))[0];
    if(pick){ M.sel=pick.id; renderPreview(); }
  }));
}

// ---------- 추가 상품 (슬롯) ----------
$('#addSlot').addEventListener('click',()=>{
  if(!B.head) return;
  B.slots.push({area:B.head.area==='플랫폼(T우주)'?'플랫폼(T우주)':'부가서비스',min:1,max:1,sel:new Set(),query:''});
  renderSlots(); check();
});

function candidates(si){
  const h=B.head, s=B.slots[si];
  const others=B.slots.filter((x,i)=>i!==si).flatMap(x=>[...x.sel]);
  return ITEMS.filter(i=>i.area===s.area).map(o=>{
    let off='';
    if(modelKey(o)===modelKey(h)) off='대표와 같은 모델';
    else if(o.svc&&h.svc&&o.svc===h.svc) off='정책 4: 대표와 같은 서비스';
    else if(h.inc&&o.svc&&h.inc.includes(o.svc)) off='정책 4: 대표에 이미 포함';
    else if(o.inc&&h.svc&&o.inc.includes(h.svc)) off='정책 4: 대표를 포함하는 결합 상품';
    else if(o.type==='요금제형'&&h.type==='약정형'){
      if(o.line!==h.line) off=`정책 2: 결합 키 불일치 (${joinKey(o)} ≠ ${joinKey(h)})`;
      else if(h.net==='LTE'&&o.net==='5G') off='정책 2: LTE 단말에는 LTE 요금제만';
      else if(o.seg==='키즈'&&h.seg!=='키즈') off='키즈 요금제는 키즈폰만';
      else if(h.seg==='키즈'&&o.seg!=='키즈') off='키즈폰에는 키즈 요금제만';
    }
    else if(o.svc==='ins'&&h.dev&&o.dev&&o.dev!==h.dev) off='보험 대상 기종 불일치';
    else if(o.req){ const ok=[h,...others].some(x=>x.key===o.req||x.name===o.req||x.name.startsWith(o.req)); if(!ok) off=`전제: ${o.req} 가 같은 번들에 있어야 함`; }
    if(!off&&others.some(x=>(x.svc&&o.svc&&x.svc===o.svc)||(x.inc&&o.svc&&x.inc.includes(o.svc)))) off='정책 4: 다른 슬롯 선택값과 같은 서비스';
    return {o,off};
  });
}

function slotWhy(s){
  if(s.locked) return '정책 1: 요금제 · 필수 1개 (변경 불가)';
  if(s.min===0) return `건너뛸 수 있음 · 최대 ${s.max}개`;
  return `반드시 ${s.min}${s.max>s.min?'~'+s.max:''}개 선택`;
}

function renderSlots(){
  const box=$('#slots');
  // 체크할 때마다 다시 그리므로 후보 목록 스크롤 위치를 유지한다.
  const scrolls=[...box.querySelectorAll('.cands')].map(c=>c.scrollTop);
  box.innerHTML='';
  B.slots.forEach((s,i)=>{
    const st=el('div','step');
    const dis=s.locked?'disabled':'';
    st.innerHTML=`<header><span class="n">${i+3}</span><b>추가 상품 ${i+1}</b><span class="chip ${s.min===0?'':'acc'}">${kindOf(s)}</span><span class="why">${slotWhy(s)}</span></header>
<div class="body">
  <div class="row"><label>유형</label><span class="seg"><button data-t="필수" class="${s.min>0?'on':''}" ${dis}>필수</button><button data-t="선택" class="${s.min===0?'on':''}" ${dis}>선택</button></span><label>영역</label><select ${dis}></select>${s.locked?'':'<button class="btn sm slot-del" style="margin-left:auto">상품 삭제</button>'}</div>
  <div class="row"><label>선택 수</label><input class="num" data-k="min" type="number" min="0" value="${s.min}" ${dis} aria-label="최소 선택 수"> ~ <input class="num" data-k="max" type="number" min="1" value="${s.max}" ${dis} aria-label="최대 선택 수"><span class="pill">고객이 이 칸에서 고르는 개수</span></div>
  <input type="search" class="slot-search" placeholder="상품명 검색" aria-label="추가 상품 ${i+1} 검색">
  <div class="cands"></div>
  <div class="slot-note"></div>
  <div class="slot-picked"></div>
</div>`;
    const sel=st.querySelector('select'); AREAS.forEach(a=>sel.appendChild(new Option(a,a))); sel.value=s.area;
    sel.addEventListener('change',()=>{s.area=sel.value;s.sel.clear();s.query='';renderSlots();check();});
    st.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{
      if(b.disabled) return;
      if(b.dataset.t==='필수'){ s.min=Math.max(1,s.min); if(s.max<s.min) s.max=s.min; } else s.min=0;
      renderSlots(); check();
    }));
    st.querySelectorAll('.num').forEach(n=>n.addEventListener('change',()=>{
      const v=Math.max(0,parseInt(n.value)||0);
      if(n.dataset.k==='min'){ s.min=v; if(s.max<v) s.max=Math.max(1,v); }
      else { s.max=Math.max(1,v); if(s.min>s.max) s.min=s.max; }
      renderSlots(); check();
    }));
    st.querySelector('.slot-del')?.addEventListener('click',()=>{B.slots.splice(i,1);renderSlots();check();});

    const items=candidates(i);
    const offOf=new Map(items.map(({o,off})=>[o,off]));
    const c=st.querySelector('.cands'), note=st.querySelector('.slot-note'), picked=st.querySelector('.slot-picked'), search=st.querySelector('.slot-search');
    search.value=s.query||'';
    function draw(){
      const q=lower(s.query); const list=items.filter(({o})=>!q||lower(o.name).includes(q));
      const selectable=list.filter(({off})=>!off); const selected=selectable.filter(({o})=>s.sel.has(o)).length;
      c.innerHTML='';
      const allRow=el('label','cand'); const all=document.createElement('input'); all.type='checkbox';
      all.checked=selectable.length>0&&selected===selectable.length;
      all.indeterminate=selected>0&&selected<selectable.length;
      all.disabled=selectable.length===0; allRow.classList.toggle('off',all.disabled);
      allRow.append(all,el('span','',`${q?'검색 결과 전체 선택':'전체 선택'}<small>선택 가능 ${selectable.length}개</small>`));
      all.addEventListener('change',()=>{ selectable.forEach(({o})=>all.checked?s.sel.add(o):s.sel.delete(o)); renderSlots(); check(); });
      c.appendChild(allRow);
      list.slice(0,CAND_LIMIT).forEach(({o,off})=>{
        const d=el('label','cand'+(off?' off':''));
        d.innerHTML=`<input type="checkbox" ${off?'disabled':''} ${s.sel.has(o)?'checked':''}><span>${escapeHtml(o.name)}<small>${off?'<span style="color:var(--bad)">'+off+'</span>':o.type}</small></span>`;
        d.querySelector('input').addEventListener('change',e=>{e.target.checked?s.sel.add(o):s.sel.delete(o); renderSlots(); check();});
        c.appendChild(d);
      });
      if(!list.length) c.appendChild(el('p','slot-empty','검색 결과가 없습니다.'));
      note.textContent=`후보 ${list.length}개${list.length>CAND_LIMIT?` 중 ${CAND_LIMIT}개 표시 · 검색으로 좁히세요`:''} · 체크 ${s.sel.size}개${autoIncluded(s)?' · 고객에게 묻지 않고 자동 포함':''}`;
    }
    // 목록 상한이나 검색 때문에 안 보이는 체크 항목도 여기서 확인·해제한다.
    picked.innerHTML='';
    [...s.sel].forEach(o=>{
      const off=offOf.get(o);
      const chip=el('button','chip picked'+(off?' no':''),`${escapeHtml(o.name)} <span aria-hidden="true">✕</span>`);
      chip.type='button'; chip.title=off?`${off} · 클릭해서 해제`:'클릭해서 해제';
      chip.addEventListener('click',()=>{s.sel.delete(o); renderSlots(); check();});
      picked.appendChild(chip);
    });
    search.addEventListener('input',()=>{s.query=search.value; draw();});
    draw();
    box.appendChild(st);
    c.scrollTop=scrolls[i]||0;
  });
}

// ---------- 검사 ----------
// 미리보기 요약: 구성마다 체크한 상품명을 보여준다.
function slotSummary(s,i){
  const names=[...s.sel].map(o=>escapeHtml(o.name)).join(', ');
  return `<div><span>구성 ${i+1}</span><span>${names||'<span class="muted">선택한 상품 없음</span>'}<small>${kindOf(s)} ${s.min}~${s.max} · ${s.area}${autoIncluded(s)?' · 자동 포함':''}</small></span></div>`;
}
function check(){
  const h=B.head; const rules=[]; const R=(ok,t,d)=>rules.push({ok,t,d});
  if(!h){ $('#poCount').innerHTML='-<small>PO</small>'; $('#bSummary').innerHTML='<div><span>대표</span>없음</div>'; $('#ruleList').innerHTML=''; $('#bSave').disabled=true; return; }
  if(h.custom){
    // 커스텀 대표는 PO가 아니므로 필수 추가 상품이 있어야 판매 단위가 된다.
    R(!!h.name,'커스텀 대표 · 제목 입력',h.name||'대표 상품 영역에 제목을 입력하세요');
    R(h.price!=null,'커스텀 대표 · 가격 입력',h.price!=null?priceLabel(h):'PO 가격이 없으므로 번들 가격을 입력하세요');
    R(B.slots.some(s=>s.min>0),'커스텀 대표 · 필수 추가 상품 1개 이상','컨테이너는 PO가 아니므로 필수 추가 상품이 있어야 판매 단위가 됨');
  } else R(B.variantIds.size>0,'대표 1개 이상 선택',B.variantIds.size?`SKU ${B.variantIds.size}개 적용 · 고객 선택지`:'옵션을 선택하세요');
  // 약정형 단말: 주문 조건(가입 유형·할인 방법)이 하나 이상 있어야 고객이 주문할 수 있다.
  if(isDevice()&&!h.solo){
    R(M.join.allow.size>0,'가입 유형 1개 이상',M.join.allow.size?`${[...M.join.allow].join(', ')} · 기본 ${M.join.def}`:'가입 유형을 체크하세요');
    R(M.disc.allow.size>0,'할인 방법 1개 이상',M.disc.allow.size?`${[...M.disc.allow].join(', ')} · 기본 ${M.disc.def}`:'할인 방법을 체크하세요');
  }
  B.slots.forEach((s,i)=>{
    const need=Math.max(1,s.max);
    const detail=`후보 ${s.sel.size}개, ${kindOf(s)} ${s.min}~${s.max}${autoIncluded(s)?' · 자동 포함':''}`;
    if(s.locked){
      // 약정형 대표의 추가 1(정책 1): 요금제 후보가 있어야 하고 후보 수도 채워야 한다.
      const hasPlan=[...s.sel].some(o=>o.type==='요금제형');
      R(hasPlan&&s.sel.size>=need,`구성 ${i+1} · 약정형 대표 상품은 요금제 필수`,hasPlan?detail:'요금제 후보를 체크하세요');
    } else R(s.sel.size>=need,`구성 ${i+1} · 후보 ≥ 최대 선택 수`,detail);
    const offs=candidates(i).filter(({o,off})=>off&&s.sel.has(o));
    if(offs.length) R(false,`구성 ${i+1} · 제외 대상 체크됨`,offs.map(({o,off})=>`${o.name} (${off})`).join(', '));
  });
  // 정책 2~4는 추가 상품 후보를 거르는 규칙이라, 운영자가 '+ 추가 상품'으로 슬롯을 붙였을 때만 보여준다.
  // (약정형 대표의 자동 고정 구성 1만 있을 때는 숨김)
  displayRules(R,h);
  if(B.slots.some(s=>!s.locked)){
    R(true,'정책 2 · 결합 키','안 맞는 후보는 회색');
    R(true,'정책 3 · 후보는 단품만','후보 목록에 단품만 표시');
    R(true,'정책 4 · 같은 서비스·포함 상품 제외','해당 후보는 회색');
  }
  $('#poCount').innerHTML=poRange(h,B.slots)+'<small>PO</small>';
  const total=variants(h).length;
  const headLabel=h.custom?`${escapeHtml(h.name||'제목 없음')} <span class="chip">커스텀</span>`:`${escapeHtml(total>1?h.key:h.name)} (${B.variantIds.size}/${total}종)`;
  const optLine=!h.custom&&B.axes?.length?`<div><span>옵션</span><span>${B.axes.map(a=>`${escapeHtml(a.name)}: ${B.optSel[a.name].size?[...B.optSel[a.name]].map(escapeHtml).join(', '):'<span class="muted">미선택</span>'}`).join('<br>')}</span></div>`:'';
  $('#bSummary').innerHTML=`<div><span>대표</span>${headLabel}</div>${optLine}${h.custom?`<div><span>가격</span>${h.price!=null?priceLabel(h):'미입력'}</div>`:''}${B.slots.map(slotSummary).join('')}${B.slots.length?'':'<div><span>구성</span>없음 (대표만 판매)</div>'}${displaySummary()}`;
  const ul=$('#ruleList'); ul.innerHTML='';
  rules.forEach(r=>{const li=el('li'); li.innerHTML=`<span class="m ${r.ok?'ok':'bad'}">${r.ok?'O':'X'}</span><span class="t">${r.t}<span class="d">${escapeHtml(r.d)}</span></span>`; ul.appendChild(li);});
  $('#bSave').disabled=!rules.every(r=>r.ok);
}

// ---------- 전시 설정 (번들 저장과 함께, 선택) ----------
// 전시 객체는 번들뿐이다. 카테고리는 대표 상품 꼬리표로 자동 배정되고(아래 CATS, main.ts와 같은 조건),
// 운영자는 그 외의 수동 전시(기획전·배너·추천)만 정한다. 이미 만든 번들의 추가 전시는 전시 생성 화면에서.
const CATS=[
 {ch:'T다이렉트샵',name:'5G 휴대폰',cond:h=>h.type==='약정형'&&h.line==='이동전화'&&h.net==='5G'},
 {ch:'T다이렉트샵',name:'휴대폰',cond:h=>h.type==='약정형'&&h.line==='이동전화'&&h.net==='LTE'},
 {ch:'T다이렉트샵',name:'태블릿',cond:h=>h.type==='약정형'&&h.line==='태블릿'},
 {ch:'T다이렉트샵',name:'스마트워치',cond:h=>h.type==='약정형'&&h.line==='웨어러블'},
 {ch:'T다이렉트샵',name:'액세서리',cond:h=>h.type==='액세서리형'},
 {ch:'T월드',name:'요금제',cond:h=>h.type==='요금제형'},
 {ch:'T월드',name:'부가서비스',cond:h=>h.area==='부가서비스'&&!/보험|클럽/.test(h.type)},
 {ch:'T월드',name:'보험·케어',cond:h=>/보험|클럽/.test(h.type)},
 {ch:'T월드',name:'로밍',cond:h=>h.area==='로밍'},
 {ch:'T우주',name:'구독',cond:h=>h.area==='플랫폼(T우주)'&&h.type!=='이용권형'},
 {ch:'T우주',name:'쿠폰·할인',cond:h=>h.type==='이용권형'},
];
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const today=()=>{ const d=new Date(), p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
const displayState=()=>({on:$('#dOn').checked, ch:$('#dCh').value, sec:$('#dSection').value, order:$('#dOrder').value.trim(), title:$('#dTitle').value.trim(), from:$('#dFrom').value.trim(), to:$('#dTo').value.trim()});
function renderAutoCats(){
  const h=B.head; const cats=h?CATS.filter(c=>c.cond(h)):[];
  $('#dAuto').innerHTML=cats.length
    ? `자동 카테고리: ${cats.map(c=>`${c.ch} · <b>${c.name}</b>`).join(', ')}<br>대표 상품 꼬리표로 자동 노출됩니다. 위 설정은 그 외의 수동 전시(기획전·배너·추천)입니다.`
    : '자동 카테고리 없음 · 위 설정으로만 전시됩니다.';
}
function syncDisplay(){
  const on=$('#dOn').checked;
  $('#dStep').classList.toggle('on',on);
  $('#dStep .body').querySelectorAll('input,select').forEach(x=>x.disabled=!on);
  $('#bSave').textContent=on?'번들 저장 + 전시':'번들 저장';
  renderAutoCats(); check();
}
$('#dOn').addEventListener('change',syncDisplay);
['#dCh','#dSection'].forEach(s=>$(s).addEventListener('change',check));
['#dOrder','#dTitle','#dFrom','#dTo'].forEach(s=>$(s).addEventListener('input',check));
function displayRules(R,h){
  const d=displayState(); if(!d.on) return;
  const wrongCh=d.ch==='T우주'&&h.area!=='플랫폼(T우주)';
  R(!wrongCh,'전시 · 채널 적합',wrongCh?'T우주 채널에는 T우주 상품만':`${d.ch} · ${d.sec}`);
  R(/^\d+$/.test(d.order)&&+d.order>0,'전시 · 순서',/^\d+$/.test(d.order)&&+d.order>0?`${d.order}번째`:'1 이상의 숫자를 입력하세요');
  const okDate=DATE.test(d.from)&&(!d.to||(DATE.test(d.to)&&d.to>=d.from));
  R(okDate,'전시 · 기간',okDate?`${d.from} ~ ${d.to||'상시'}`:'시작일은 YYYY-MM-DD, 종료일은 비우거나 시작일 이후로 입력하세요');
}
function displaySummary(){
  const d=displayState();
  return `<div><span>전시</span><span>${d.on?`${escapeHtml(d.title||'번들명')}<small>${d.ch} · ${d.sec} · ${escapeHtml(d.order)}번째 · ${escapeHtml(d.from)} ~ ${escapeHtml(d.to||'상시')}</small>`:'<span class="muted">저장만 (전시 안 함)</span>'}</span></div>`;
}

// ---------- 저장 ----------
// 기존 화면의 목록(nova-bundles-v1)과 별도 키에 저장하고, main.ts가 목록을 읽을 때 합친다.
// 함께 만든 전시는 nova-displays-v3에 저장하고, 마찬가지로 main.ts가 전시 목록에 합친다.
const STORE_KEY='nova-bundles-v3';
const DISPLAY_KEY='nova-displays-v3';
function loadSaved(){ try { const v=JSON.parse(localStorage.getItem(STORE_KEY)); return Array.isArray(v)?v:[]; } catch { return []; } }
$('#bReset').addEventListener('click',onHead);
$('#bSave').addEventListener('click',()=>{
  if($('#bSave').disabled) return;
  const h=B.head; const chosen=h.custom?[]:variants(h).filter(i=>B.variantIds.has(i.id));
  const bundle={
    id:'V3'+Date.now().toString(36),
    name:h.custom?h.name:`${variants(h).length>1?h.key:h.name} 번들`,
    head:h.custom?{...h,id:'C'+Date.now().toString(36)}:(isDevice()&&defaultSku())||chosen[0],
    variantIds:chosen.map(i=>i.id),
    variantNames:chosen.map(i=>i.name),
    ...(isDevice()?{
      optionOrder:[...B.axisOrder], defaultSku:defaultSku()?.id, soldout:M.soldout,
      join:{allow:[...M.join.allow],def:M.join.def}, discount:{allow:[...M.disc.allow],def:M.disc.def},
    }:{}),
    slots:B.slots.map(s=>({type:kindOf(s),area:s.area,min:s.min,max:s.max,sel:[...s.sel]})),
    auto:false, status:'wait', source:'bundle-create4',
  };
  const d=displayState();
  const display=d.on?{
    id:'D'+Date.now().toString(36), name:d.title||bundle.name, b:bundle.name, bundleId:bundle.id,
    ch:d.ch, sec:d.sec, order:+d.order, period:`${d.from} ~ ${d.to||'상시'}`,
    status:d.from>today()?'wait':'live', source:'bundle-create4',
  }:null;
  if(display?.status==='live') bundle.status='live';
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([bundle,...loadSaved()]));
    if(display){ let list=[]; try { const v=JSON.parse(localStorage.getItem(DISPLAY_KEY)); if(Array.isArray(v)) list=v; } catch {} localStorage.setItem(DISPLAY_KEY, JSON.stringify([display,...list])); }
  }
  catch { toast('저장하지 못했습니다. 브라우저 저장 공간과 설정을 확인하세요.'); return; }
  window.location.assign(display?'display-list.html':'bundle-list.html');
});

fillHeads();
syncDisplay();
