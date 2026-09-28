// @ts-nocheck
// 번들 생성 3: ref/product-admin-prototype-v3.html의 번들 만들기를 옮긴 화면.
// 실제 상품 1,545개, 대표 검색, 슬롯별 선택 수(min~max), 후보 검색·표시 상한을 쓴다.
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
  $('.variant-picker').hidden=!h||h.custom;
  if(!h){ B.slots=[]; B.variantIds=new Set(); renderSlots(); check(); return; }
  B.variantIds=new Set(h.custom?[]:variants(h).map(x=>x.id));
  $('#bVariantSearch').value='';
  B.slots=[]; if(!h.solo) B.slots.push({area:'이동전화',min:1,max:1,sel:new Set(),query:'',locked:true});
  renderVariantList(); renderSlots(); check();
}

function visibleVariants(){ const q=lower($('#bVariantSearch').value); return variants(B.head).filter(i=>lower(i.name).includes(q)); }
function updateVariantSelection(){
  const visible=visibleVariants(); const count=visible.filter(i=>B.variantIds.has(i.id)).length; const all=$('#bVariantAll');
  all.checked=visible.length>0&&count===visible.length;
  all.indeterminate=count>0&&count<visible.length;
  all.disabled=visible.length===0;
  $('#bVariantAllLabel').textContent=`${$('#bVariantSearch').value.trim()?'검색 결과 전체 선택':'전체 선택'} (${B.variantIds.size}/${variants(B.head).length})`;
  check();
}
function renderVariantList(){
  const box=$('#bVariants'), allRow=$('#bVariantAllRow');
  Array.from(box.children).forEach(child=>{ if(child!==allRow) child.remove(); });
  const visible=visibleVariants();
  visible.forEach(item=>{
    const row=el('label','variant-row'); const input=document.createElement('input');
    input.type='checkbox'; input.checked=B.variantIds.has(item.id);
    const name=el('span'); name.textContent=item.name;
    input.addEventListener('change',()=>{ input.checked?B.variantIds.add(item.id):B.variantIds.delete(item.id); updateVariantSelection(); });
    row.append(input,name); box.appendChild(row);
  });
  if(!visible.length) box.appendChild(el('p','variant-empty','검색 결과가 없습니다.'));
  updateVariantSelection();
}
$('#bVariantSearch').addEventListener('input',renderVariantList);
$('#bVariantAll').addEventListener('change',e=>{ visibleVariants().forEach(i=>e.target.checked?B.variantIds.add(i.id):B.variantIds.delete(i.id)); renderVariantList(); });

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
    st.innerHTML=`<header><span class="n">${i+2}</span><b>추가 상품 ${i+1}</b><span class="chip ${s.min===0?'':'acc'}">${kindOf(s)}</span><span class="why">${slotWhy(s)}</span></header>
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
  } else R(B.variantIds.size>0,'대표 1개 이상 선택',`${B.variantIds.size}개 선택 · 고객 선택지`);
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
  if(B.slots.some(s=>!s.locked)){
    R(true,'정책 2 · 결합 키','안 맞는 후보는 회색');
    R(true,'정책 3 · 후보는 단품만','후보 목록에 단품만 표시');
    R(true,'정책 4 · 같은 서비스·포함 상품 제외','해당 후보는 회색');
  }
  $('#poCount').innerHTML=poRange(h,B.slots)+'<small>PO</small>';
  const total=variants(h).length;
  const headLabel=h.custom?`${escapeHtml(h.name||'제목 없음')} <span class="chip">커스텀</span>`:`${escapeHtml(total>1?h.key:h.name)} (${B.variantIds.size}/${total}종)`;
  $('#bSummary').innerHTML=`<div><span>대표</span>${headLabel}</div>${h.custom?`<div><span>가격</span>${h.price!=null?priceLabel(h):'미입력'}</div>`:''}${B.slots.map(slotSummary).join('')}${B.slots.length?'':'<div><span>구성</span>없음 (대표만 판매)</div>'}`;
  const ul=$('#ruleList'); ul.innerHTML='';
  rules.forEach(r=>{const li=el('li'); li.innerHTML=`<span class="m ${r.ok?'ok':'bad'}">${r.ok?'O':'X'}</span><span class="t">${r.t}<span class="d">${escapeHtml(r.d)}</span></span>`; ul.appendChild(li);});
  $('#bSave').disabled=!rules.every(r=>r.ok);
}

// ---------- 저장 ----------
// 기존 화면의 목록(nova-bundles-v1)과 별도 키에 저장하고, main.ts가 목록을 읽을 때 합친다.
const STORE_KEY='nova-bundles-v3';
function loadSaved(){ try { const v=JSON.parse(localStorage.getItem(STORE_KEY)); return Array.isArray(v)?v:[]; } catch { return []; } }
$('#bReset').addEventListener('click',onHead);
$('#bSave').addEventListener('click',()=>{
  if($('#bSave').disabled) return;
  const h=B.head; const chosen=h.custom?[]:variants(h).filter(i=>B.variantIds.has(i.id));
  const bundle={
    id:'V3'+Date.now().toString(36),
    name:h.custom?h.name:`${variants(h).length>1?h.key:h.name} 번들`,
    head:h.custom?{...h,id:'C'+Date.now().toString(36)}:chosen[0],
    variantIds:chosen.map(i=>i.id),
    variantNames:chosen.map(i=>i.name),
    slots:B.slots.map(s=>({type:kindOf(s),area:s.area,min:s.min,max:s.max,sel:[...s.sel]})),
    auto:false, status:'wait', source:'bundle-create3',
  };
  try { localStorage.setItem(STORE_KEY, JSON.stringify([bundle,...loadSaved()])); }
  catch { toast('저장하지 못했습니다. 브라우저 저장 공간과 설정을 확인하세요.'); return; }
  window.location.assign('bundle-list.html');
});

fillHeads();
