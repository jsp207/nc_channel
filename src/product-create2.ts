// @ts-nocheck
// 상품등록2: product-create.ts에서 디바이스형 옵션선택만 바꾼 버전. 옵션값을 버튼으로 고르지 않고 콤마로 구분해 입력한다.
// 상품 = 기본정보 + 기준 단품(디바이스형은 옵션목록·EPC 매칭) + 슬롯 0~N개. 섹션은 헤더를 눌러 접고 펼친다.
import "./style.css";
import { requireAuthentication } from "./auth";
import { POLICY, AREAS, ITEMS, ITEM_BY_ID, $, el, esc, nameText, nameHtml, toast, joinKey, variants, TODAY, TYPES, tdef, CATS, poRange, loadDisplays, saveDisplays } from "./product-display-store";

requireAuthentication();

// ---------- SKU 옵션 (EPC 가격·재고는 목업) ----------
const hash=str=>{let h=0;for(const c of str)h=(h*31+c.charCodeAt(0))>>>0;return h;};
function skuParts(i){ const p=i.name.split(' / ').map(x=>x.trim()); if(p.length>=3) return {a:['색상','용량'],v:{'색상':p[2],'용량':p[1]}}; if(p.length===2){ const m=i.name.match(/\(([^)]*)\)/); return {a:['색상','사양'],v:{'색상':p[1],'사양':m?m[1]:'-'}}; } return null; }
const CAPW={'128G':0,'256G':0,'512G':300000,'1T':900000,'2T':1800000};
function skuPrice(i){ const p=skuParts(i); const base=1200000+(hash(i.key)%9)*150000; return base+(p&&CAPW[p.v['용량']]!=null?CAPW[p.v['용량']]:(hash(i.name)%4)*250000); }
const skuOut=i=>hash(i.name)%6===0;
const COLORS={'블랙':'#222','화이트':'#f2f2f2','실버':'#d8d8dc','골드':'#d9b98a','블루':'#7aa7e8','핑크':'#f0a7c0','크림':'#efe6d2','그린':'#8fbf9a','라벤더':'#c3b6e8','그라파이트':'#5a5d66','버건디':'#5a1d2b','글레이서':'#dbe6f5','티타늄':'#9a9aa0','오렌지':'#f2934a','민트':'#a9e0d0','네이비':'#2b3a67','레드':'#c93b3b','스카이블루':'#9ed3f5','실버쉐도우':'#c9c9cf','제트블랙':'#111','블루섀도우':'#4b6b9a','아이스블루':'#cfe6f6','코럴레드':'#e2645c','스타라이트':'#ece5d8','미드나이트':'#2a2f38'};
const JOIN=[['기기변경','휴대폰만 새로 구매하고 싶어요'],['번호이동','다른 통신사에서 SK텔레콤으로 이동하고 싶어요'],['신규가입','새로 가입하고 싶어요']];
const DISC=[['공시지원','단말 지원금'],['선택약정','요금 25% 할인']];

// ---------- 상태 ----------
// F: 폼 전체, M: 디바이스형 옵션 상태
const F={}; const M={};
let SEQ=0;
function resetM(){ Object.assign(M,{soldout:'show',ax:null,rows:null,dirty:false,rowSel:new Set(),sel:null,join:{allow:new Set(['기기변경','번호이동','신규가입']),def:'번호이동'},disc:{allow:new Set(['공시지원','선택약정']),def:'선택약정'}}); }
function newSlot(o){ return Object.assign({id:++SEQ,req:true,area:'부가서비스',ptypes:new Set(),max:1,sel:new Set(),order:[],best:new Set(),def:null,more:3,grp:true,tab:'all',locked:false,q:'',closed:false},o||{}); }
const planSlot=()=>newSlot({req:true,area:'이동전화',ptypes:new Set(['요금제형']),max:1,locked:true});
function resetForm(){ Object.assign(F,{editId:null,name:'',type:'device',ch:'T다이렉트샵',cat:'',catAuto:true,from:'',to:'',show:true,use:true,head:null,noBase:false,hq:'',slots:[planSlot()],media:emptyMedia(),noticeOn:false,reviewOn:false,badgeOn:false,seoOn:false,spec:emptySpec(),badges:[],sim:emptySim(),seo:emptySeo(),srch:emptySrch(),faq:emptyFaq(),links:{order:false,pay:false}}); resetM(); }
// 주요정보. 조건(미성년자 구매)을 사용하면 나이 범위(ageFrom~ageTo)를 받는다. 빈칸은 제한 없음.
// 유사한 상품 영역 문구. mode가 default면 SIM_DEF를, custom이면 직접 입력한 문구(최대 30자)를 쓴다.
const SIM_DEF={title:'방금 보신 상품과 유사한 상품',sub:'동일한 조건으로 비교한 다른 기기도 확인해보세요'}, SIM_MAX=30;
const emptySim=()=>({on:false,mode:'default',title:'',sub:''});
// 검색(SEO/GEO): 태그 최대 10개, Page Title 25자, Description 200자.
const SEO_MAX={tags:10,title:25,desc:200};
const emptySeo=()=>({tags:[],title:'',desc:''});
// 검색정보: 검색노출 Y/N(show, 미선택은 null)과 검색키워드 최대 10개. 빈 입력칸 하나로 시작한다.
const SRCH_MAX=10;
const emptySrch=()=>({on:false,show:null,kws:['']});
// 자주묻는질문: 질문·답변 묶음 최대 20개. 빈 묶음 하나로 시작한다.
const FAQ_MAX=20;
const emptyFaq=()=>({on:false,items:[{q:'',a:''}]});
const emptySpec=()=>({model:'',product:'',brand:'',maker:'',minor:false,ageFrom:'',ageTo:''});
// 이미지·상품정보. 이미지는 줄인 data URL로 들고 있다가 상품과 함께 저장한다.
const emptyMedia=()=>({main:null,subs:[],detail:{mode:'image',images:[],html:''}});
const copyMedia=m=>({main:m.main,subs:[...m.subs],detail:{mode:m.detail.mode,images:[...m.detail.images],html:m.detail.html}});
const isDev=()=>F.type==='device';

// ---------- 기본정보 ----------
// 전시유형 버튼 아이콘 (24×24 선 아이콘)
const TYPE_ICONS={
 device:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
 acc:'<path d="M9 3h6v4H9zM7 7h10v14H7z"/><path d="M10 12h4"/>',
 plan:'<path d="M4 20h3v-5H4zM10.5 20h3V10h-3zM17 20h3V4h-3z"/>',
 addon:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
 roam:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/>',
 sub:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m10 10 5 2.5-5 2.5z"/><path d="M8 3h8"/>',
};
(function(){
  const seg=$('#typeSeg'); TYPES.forEach(t=>{const b=el('button','type-tile',`<svg viewBox="0 0 24 24" aria-hidden="true">${TYPE_ICONS[t.k]}</svg><span>${t.label}</span>`); b.type='button'; b.dataset.t=t.k; b.addEventListener('click',()=>{ if(F.type===t.k) return; setType(t.k); }); seg.appendChild(b);});
  $('#fName').addEventListener('input',e=>{F.name=e.target.value; renderPanel();});
  $('#showSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{F.show=b.dataset.t==='1'; renderInfo(); renderPanel();}));
  $('#useSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{F.use=b.dataset.t==='1'; renderInfo(); renderPanel();}));
})();
function setType(k){
  const t=tdef(k); F.type=k; F.ch=t.ch; F.head=null; F.noBase=false; F.hq=''; F.catAuto=true; F.cat='';
  F.slots = k==='device'?[planSlot()]:[]; resetM();
  renderAll(); toast(`${t.label}으로 바꿨습니다. ${t.base} 선택과 슬롯을 비웠습니다`);
}
// 노출채널·카테고리 입력은 화면에서 뺐다. 채널은 전시유형 기본값, 카테고리는 기준 단품으로 자동 지정해 저장한다.
function autoCat(){ if(!F.catAuto) return; const h=F.head; const c=h?CATS.find(c=>c.ch===F.ch&&c.cond(h)):null; F.cat=c?c.name:''; }
function renderInfo(){
  $('#typeSeg').querySelectorAll('button').forEach(b=>{ const on=b.dataset.t===F.type; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
  $('#fName').value=F.name;
  $('#showSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(b.dataset.t==='1')===F.show));
  $('#useSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(b.dataset.t==='1')===F.use));
}

// ---------- 기준 단품 ----------
function headPool(){ const t=tdef(F.type); return ITEMS.filter(i=>i.area===t.area&&(!t.types||t.types.includes(i.type))); }
function renderBase(){
  const t=tdef(F.type);
  $('#baseTitle').textContent=`${t.base} 선택`; $('#baseWhy').textContent=t.why;
  $('#noBaseRow').hidden = F.type!=='sub'; $('#noBase').checked=F.noBase;
  $('#hWrap').hidden = F.noBase;
  $('#hQ').value=F.hq; drawHeadList(); renderHeadInfo();
}
function drawHeadList(){
  const q=F.hq.trim(); const tb=$('#hList'); tb.innerHTML=''; const seen=new Set(); const rows=[];
  headPool().forEach(i=>{ if(q&&!i.name.includes(q)&&!i.key.includes(q)) return; if(isDev()){ const k=i.key; if(seen.has(k)) return; seen.add(k); } rows.push(i); });
  rows.slice(0,200).forEach(i=>{
    const v=isDev()?variants(i):[i]; const on=F.head&&(isDev()?F.head.key===i.key:F.head.id===i.id);
    const tr=el('tr',on?'on':''); tr.innerHTML=`<td class="c"><input type="radio" name="head" ${on?'checked':''} aria-label="${esc(i.name)}"></td><td>${esc(isDev()?i.key:i.name)}</td><td>${i.type}</td><td><span class="chip">${joinKey(i)}</span></td><td>${v.length>1?v.length+'종':'-'}</td>`;
    const r=tr.querySelector('input'); r.addEventListener('change',()=>pickHead(i));
    tr.addEventListener('click',e=>{ if(e.target.tagName!=='INPUT') r.click(); });
    tb.appendChild(tr);
  });
  const onTr=tb.querySelector('tr.on'); if(onTr){ const w=tb.closest('.cl'); w.scrollTop=Math.max(0,onTr.offsetTop-40); }
  if(!rows.length) tb.innerHTML='<tr><td colspan="5" style="color:var(--muted)">검색 결과가 없습니다. 검색어를 줄여 보세요</td></tr>';
  $('#hCnt').textContent=`(${rows.length}개${rows.length>200?' 중 200개 표시. 검색으로 좁히세요':''})`;
}
function renderHeadInfo(){
  const h=F.head, box=$('#hInfo');
  if(isDev()) $('#baseWhy').textContent=h?h.key:'';
  if(!h){ box.textContent='목록에서 1개를 고르세요'; return; }
  box.innerHTML = isDev() ? '' : `선택: <b>${esc(h.name)}</b> · ${h.type} · 결합 키 <span class="chip">${joinKey(h)}</span>`;
}
function pickHead(i){
  F.head=i; Object.assign(M,{ax:null,rows:null,dirty:false,rowSel:new Set(),sel:null}); autoCat(); pruneSlots();
  drawHeadList(); renderHeadInfo(); renderInfo(); renderMatrix(); renderSlots();
}
$('#hEpc').addEventListener('click',()=>{ drawHeadList(); toast('EPC에서 상품을 가져왔습니다'); });
$('#hQ').addEventListener('input',e=>{F.hq=e.target.value; drawHeadList();});
$('#noBase').addEventListener('change',e=>{ F.noBase=e.target.checked; F.head=null; pruneSlots(); autoCat(); renderInfo(); renderBase(); renderSlots(); });

// ---------- 디바이스 옵션 ----------
function renderCond(){
  const mk=(box,title,list,st)=>{
    const all=list.map(([k])=>k);
    box.innerHTML=`<div class="an">${title}<span class="ar"><button type="button" class="btn sm" data-all="1" ${st.allow.size===all.length?'disabled':''}>모두 선택</button><button type="button" class="btn sm" data-all="0" ${st.allow.size?'':'disabled'}>해제</button></span></div>`;
    box.querySelectorAll('[data-all]').forEach(b=>b.addEventListener('click',()=>{ if(b.dataset.all==='1'){ all.forEach(k=>st.allow.add(k)); if(!st.def) st.def=all[0]; } else { st.allow.clear(); st.def=null; } renderMatrix(); }));
    const chips=el('div','axchips'); box.appendChild(chips);
    list.forEach(([k])=>{
    const on=st.allow.has(k); const l=el('label','axchip'+(on?' on':'')); l.title='더블클릭하면 기본값';
    l.innerHTML=`<input type="checkbox" ${on?'checked':''}>${k}${st.def===k?' · 기본':''}`;
    l.querySelector('input').addEventListener('change',e=>{ e.target.checked?st.allow.add(k):st.allow.delete(k); if(!st.allow.has(st.def)) st.def=[...st.allow][0]||null; renderMatrix(); });
    l.addEventListener('dblclick',()=>{ if(st.allow.has(k)){ st.def=k; renderMatrix(); } });
    chips.appendChild(l); }); };
  mk($('#joinOpts'),'가입 유형',JOIN,M.join); mk($('#discOpts'),'할인 방법',DISC,M.disc);
}
const devParts=()=>F.head?variants(F.head).map(i=>({i,p:skuParts(i)})).filter(x=>x.p):[];
function devAxes(){
  const parts=devParts();
  if(parts.length){ const axes=parts[0].p.a; return {axes,rows:parts.filter(x=>x.p.a.join()===axes.join()).map(x=>({i:x.i,v:x.p.v}))}; }
  return {axes:['모델'],rows:(F.head?variants(F.head):[]).map(i=>({i,v:{'모델':i.name}}))};
}
// 옵션선택: 축(색상·용량 등)마다 옵션값을 콤마(,)로 구분해 입력한다. M.ax[축]은 입력한 글자 그대로다.
// 옵션목록 적용을 누르면 축끼리 모든 조합을 만들어 옵션목록에 넣는다. 예) 색상 화이트,블랙 × 용량 128,256,512 = 6개
const splitVals=s=>[...new Set(String(s||'').split(',').map(x=>x.trim()).filter(Boolean))];
// 128, 128G, 128GB를 같은 값으로 본다
const normV=v=>{ const x=String(v).replace(/\s+/g,'').toUpperCase().replace(/B$/,''); return /^\d+$/.test(x)?x+'G':x; };
function initAx(){ const {axes,rows}=devAxes(); M.ax={}; axes.forEach(k=>M.ax[k]=[...new Set(rows.map(r=>r.v[k]))].join(',')); }
// 입력값의 조합. EPC 단품과 값이 맞으면 그 단품(i)을 붙이고, 없으면 i:null(EPC 미연동 옵션)
function axCombos(){
  const {axes,rows}=devAxes(); const lists=axes.map(k=>splitVals(M.ax[k]));
  if(lists.some(l=>!l.length)) return {axes,combos:[]};
  let vs=[{}]; axes.forEach((k,n)=>{ vs=vs.flatMap(c=>lists[n].map(v=>({...c,[k]:v}))); });
  const seen=new Set(), combos=[];
  vs.forEach(v=>{ const r=rows.find(r=>axes.every(k=>normV(r.v[k])===normV(v[k]))); const c=r?{i:r.i,v:r.v}:{i:null,v}; const id=c.i?c.i.id:'N:'+axes.map(k=>v[k]).join('/'); if(seen.has(id)) return; seen.add(id); combos.push({...c,id}); });
  return {axes,combos};
}
const dot=(k,v)=>k==='색상'?`<span class="dot" style="background:${COLORS[v]||'#bbb'}"></span>`:'';
const AX_PH={'색상':'예: 화이트,블랙','용량':'예: 128,256,512'};
function renderMatrix(){
  const h=F.head;
  if(!isDev()||!h){ $('#devBox').hidden=true; renderPanel(); return; }
  $('#devBox').hidden=false; renderCond();
  if(!M.ax) initAx();
  const {axes,rows}=devAxes();
  const box=$('#axBox'); box.innerHTML='';
  axes.forEach((k,n)=>{
    if(M.ax[k]==null) M.ax[k]='';
    const ref=[...new Set(rows.map(r=>r.v[k]))], refN=new Set(ref.map(normV));
    const row=el('div','axis'); row.innerHTML=`<div class="an"><label for="ax${n}">${k}</label><span class="pill"></span><span class="ar"><button type="button" class="btn sm" data-fill>EPC 값으로 채우기</button><button type="button" class="btn sm" data-clear>지우기</button></span></div>
      <input type="text" class="axin" id="ax${n}" value="${esc(M.ax[k])}" placeholder="${AX_PH[k]||'콤마(,)로 구분해 입력'}" autocomplete="off">
      <div class="axpv"></div>`;
    const inp=row.querySelector('input'), pv=row.querySelector('.axpv'), cnt=row.querySelector('.pill');
    const sync=()=>{ const vals=splitVals(M.ax[k]); cnt.textContent=`${vals.length}개`;
      pv.innerHTML=vals.map(v=>{ const out=!refN.has(normV(v)); return `<span class="axchip on${out?' new':''}"${out?' title="EPC에 없는 값. 미연동 옵션으로 추가됩니다"':''}>${dot(k,v)}${esc(v)}</span>`; }).join(''); };
    const set=v=>{ M.ax[k]=v; M.dirty=M.rows!=null; sync(); applyState(); };
    inp.addEventListener('input',()=>set(inp.value));
    inp.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing){ e.preventDefault(); if(!$('#applyOpt').disabled) applyOpt(); } });
    row.querySelector('[data-fill]').addEventListener('click',()=>{ inp.value=ref.join(','); set(inp.value); });
    row.querySelector('[data-clear]').addEventListener('click',()=>{ inp.value=''; set(''); inp.focus(); });
    sync(); box.appendChild(row);
  });
  applyState(); drawOpt(); renderPanel();
}
// 적용 버튼·안내문만 다시 그린다. 입력 중에 renderMatrix를 부르면 포커스가 빠지므로 따로 둔다.
function applyState(){
  const {axes,combos}=axCombos(), miss=combos.filter(c=>!c.i).length;
  const hint=$('#applyHint');
  hint.className='pill'+(M.dirty?' dirty':'');
  hint.textContent = !combos.length ? `${axes.join('·')}을 1개 이상 입력하세요`
    : (M.dirty?'입력이 바뀌었습니다. 다시 적용하세요':`적용하면 옵션 ${combos.length}개${miss?` (EPC 미연동 ${miss}개)`:''}`);
  $('#applyOpt').disabled=!combos.length;
}
function applyOpt(silent){
  const {axes,combos}=axCombos(); const prev=new Map((M.rows||[]).map(r=>[r.id,r]));
  const base=F.head?1200000+(hash(F.head.key)%9)*150000:0;
  // 목업: EPC 단품이 있는 새 옵션은 자동 연결하고 4개 중 1개만 미연결(불일치)로 둔다. EPC에 없는 조합은 미연동으로 넣는다
  M.rows=combos.map((c,n)=>prev.get(c.id)||(c.i
    ?{id:c.id,name:axes.join(' / '),val:axes.map(k=>c.v[k]).join(' / '),v:c.v,use:true,price:skuPrice(c.i),sale:!skuOut(c.i),epc:n%4===3?null:epcOf(c.i)}
    :{id:c.id,name:axes.join(' / '),val:axes.map(k=>c.v[k]).join(' / '),v:c.v,use:true,price:base+(CAPW[normV(c.v['용량'])]||0),sale:true,epc:null}));
  M.dirty=false; M.rowSel=new Set(); M.sel=null;
  if(!silent){ renderMatrix(); const miss=combos.filter(c=>!c.i).length; toast(`옵션 ${M.rows.length}개를 옵션목록에 적용했습니다${miss?`. EPC에 없는 ${miss}개는 미연동으로 넣었습니다`:''}`); }
}
$('#applyOpt').addEventListener('click',()=>applyOpt());
$('#epcLoad').addEventListener('click',()=>{ initAx(); applyOpt(); });
function drawOpt(){
  const tb=$('#optTable tbody'); tb.innerHTML=''; const rows=M.rows||[];
  rows.forEach(r=>{
    const tr=el('tr',r.use?'':'unused'); const k0=r.name.split(' / ');
    tr.innerHTML=`<td class="c"><input type="checkbox" class="rs" ${M.rowSel.has(r.id)?'checked':''} aria-label="${esc(r.val)} 선택"></td><td>${esc(r.name)}</td><td><span style="display:inline-flex;gap:6px;align-items:center">${k0[0]==='색상'?dot('색상',r.v['색상']):''}${esc(r.val)}</span></td>
      <td><span class="seg"><button type="button" data-u="1" class="${r.use?'on':''}">사용</button><button type="button" data-u="0" class="${r.use?'':'on'}">미사용</button></span></td>
      <td style="white-space:nowrap;text-align:right">${r.price.toLocaleString()} 원</td>
      <td><span class="chip ${r.sale?'ok':'warn'}">${r.sale?'판매중':'품절'}</span></td>
      <td>${epcCell(r)}</td>
      <td><button type="button" class="btn sm del">삭제</button></td>`;
    const ev=tr.querySelector('.ev'); if(ev) ev.addEventListener('click',()=>openEpcView(r.id));
    const ee=tr.querySelector('.ee'); if(ee) ee.addEventListener('click',()=>openEpcMatch([r.id]));
    tr.querySelector('.rs').addEventListener('change',e=>{ e.target.checked?M.rowSel.add(r.id):M.rowSel.delete(r.id); drawOpt(); });
    tr.querySelectorAll('.seg button').forEach(bt=>bt.addEventListener('click',()=>{ r.use=bt.dataset.u==='1'; drawOpt(); renderPanel(); }));
    tr.querySelector('.del').addEventListener('click',()=>{ M.rows=M.rows.filter(x=>x!==r); M.rowSel.delete(r.id); drawOpt(); renderPanel(); toast(`${r.val} 옵션을 삭제했습니다. 다시 적용하면 복구됩니다`); });
    tb.appendChild(tr);
  });
  if(!M.rows) tb.innerHTML='<tr><td colspan="8" style="color:var(--muted)">위에서 옵션값을 콤마(,)로 구분해 입력하고 옵션목록 적용을 누르면 여기에 나온다</td></tr>';
  else if(!rows.length) tb.innerHTML='<tr><td colspan="8" style="color:var(--muted)">옵션이 모두 삭제됐습니다. 옵션목록 적용을 다시 누르세요</td></tr>';
  const all=$('#optAll'); const n=rows.filter(r=>M.rowSel.has(r.id)).length;
  all.checked=rows.length>0&&n===rows.length; all.indeterminate=n>0&&n<rows.length; all.disabled=!rows.length;
  $('#optCnt').textContent=M.rows?`${rows.length}개`:'';
  $('#epcBtn').hidden=!M.rows; $('#optBulk').hidden=!n; $('#optBulk').style.display=n?'inline-flex':'';
  $('#optSelTxt').textContent=`선택 ${n}개`;
}
$('#optAll').addEventListener('change',e=>{ (M.rows||[]).forEach(r=>e.target.checked?M.rowSel.add(r.id):M.rowSel.delete(r.id)); drawOpt(); });
$('#optBulk').querySelectorAll('button').forEach(bt=>bt.addEventListener('click',()=>{
  const act=bt.dataset.a, n=M.rowSel.size;
  if(act==='del'){ M.rows=M.rows.filter(r=>!M.rowSel.has(r.id)); toast(`옵션 ${n}개를 삭제했습니다`); }
  else { M.rows.forEach(r=>{ if(M.rowSel.has(r.id)) r.use=act==='on'; }); toast(`옵션 ${n}개를 ${act==='on'?'사용':'미사용'}으로 바꿨습니다`); }
  M.rowSel=new Set(); drawOpt(); renderPanel();
}));

// ---------- EPC 연동 (목업) ----------
const EPC_POOL=ITEMS.filter(i=>i.area==='기기서비스'&&i.type==='약정형');
const epcCode=i=>'PO'+String(1000000+hash('epc'+i.name)%9000000);
const epcOf=i=>({code:epcCode(i),id:i.id,name:i.name,key:i.key,price:skuPrice(i),sale:!skuOut(i),join:joinKey(i),at:TODAY});
function epcCheck(r){
  const e=r.epc; if(!e) return {st:'none',t:'미연동'};
  const it=ITEM_BY_ID.get(e.id); const p=it&&skuParts(it);
  if(!F.head||e.key!==F.head.key) return {st:'bad',t:'모델 불일치'};
  const diff=Object.keys(r.v).filter(k=>!p||p.v[k]!==r.v[k]);
  if(diff.length) return {st:'bad',t:`${diff.join('·')} 불일치`};
  return {st:'ok',t:'일치'};
}
function epcCell(r){
  const ok=r.epc&&epcCheck(r).st==='ok';
  const code=r.epc?`<button type="button" class="linkbtn ev" title="EPC 상품 조회">${r.epc.code}</button>`:'';
  return `<div class="epcc">${code}<span class="chip ${ok?'ok':'bad2'}">${ok?'일치':'불일치'}</span>${ok?'':'<button type="button" class="btn sm ee">연동</button>'}</div>`;
}
const MD={mode:null,ids:[],draft:new Map(),act:null,q:'',same:true};
function openModal(){ const m=$('#epcModal'); m.hidden=false; MD.prevFocus=document.activeElement; m.querySelector('.mbox').focus(); }
function closeModal(){ $('#epcModal').hidden=true; MD.mode=null; if(MD.prevFocus) MD.prevFocus.focus({preventScroll:true}); }
$('#mClose').addEventListener('click',closeModal);
$('#epcModal').addEventListener('click',e=>{ if(e.target.id==='epcModal') closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!$('#epcModal').hidden) closeModal(); });
$('#epcBtn').addEventListener('click',()=>{ const ids=(M.rows||[]).filter(r=>M.rowSel.has(r.id)).map(r=>r.id); if(!ids.length){ toast('EPC에 연결할 옵션을 옵션목록에서 먼저 선택하세요'); return; } openEpcMatch(ids); });
const rowById=id=>(M.rows||[]).find(r=>r.id===id);
function openEpcMatch(ids){
  MD.mode='match'; $('#epcModal .mbox').classList.remove('narrow'); MD.ids=ids; MD.draft=new Map(ids.map(id=>{const r=rowById(id); return [id,r&&r.epc?r.epc:null];})); MD.act=ids.find(id=>!MD.draft.get(id))||ids[0]; MD.q=''; MD.same=true;
  drawMatch(); openModal();
}
function draftCheck(id){ const r=rowById(id); return epcCheck(Object.assign({},r,{epc:MD.draft.get(id)})); }
function drawMatch(){
  const n=MD.ids.length, lk=MD.ids.filter(id=>MD.draft.get(id)).length, ok=MD.ids.filter(id=>draftCheck(id).st==='ok').length;
  $('#mTitle').textContent='EPC 상품 매칭'; $('#mSub').textContent=`${F.head?F.head.key:''} · 옵션 ${n}개 · 연결 ${lk} · 일치 ${ok}`;
  const left=MD.ids.map(id=>{ const r=rowById(id), e=MD.draft.get(id), c=draftCheck(id);
    return `<tr data-id="${id}" class="${id===MD.act?'act':''}"><td>${dot('색상',r.v['색상'])} ${esc(r.val)}</td><td>${e?`<b>${e.code}</b><br><small style="color:var(--muted)">${esc(e.name)}</small>`:'<span style="color:var(--muted)">오른쪽에서 고르세요</span>'}</td><td><span class="chip ${c.st==='ok'?'ok':c.st==='none'?'':'bad2'}">${c.t}</span></td><td>${e?'<button type="button" class="btn sm un">해제</button>':''}</td></tr>`; }).join('');
  const q=MD.q.trim(); const act=rowById(MD.act);
  const pool=EPC_POOL.filter(i=>(!MD.same||!F.head||i.key===F.head.key)&&(!q||i.name.includes(q)||epcCode(i).includes(q)));
  const used=new Map(); MD.ids.forEach(id=>{const e=MD.draft.get(id); if(e) used.set(e.id,id);});
  const right=pool.slice(0,200).map(i=>{ const p=skuParts(i); const fit=act&&p&&i.key===(F.head&&F.head.key)&&Object.keys(act.v).every(k=>p.v[k]===act.v[k]); const u=used.get(i.id);
    return `<tr data-e="${i.id}"><td>${epcCode(i)}</td><td>${esc(i.name)}${fit?' <span class="chip ok">추천</span>':''}</td><td style="white-space:nowrap">${skuPrice(i).toLocaleString()}원</td><td><span class="chip ${skuOut(i)?'warn':'ok'}">${skuOut(i)?'품절':'판매중'}</span></td><td>${u&&u!==MD.act?'<span class="pill">다른 옵션에 연결됨</span>':`<button type="button" class="btn sm pk" ${act?'':'disabled'}>${u===MD.act?'연결됨':'연결'}</button>`}</td></tr>`; }).join('');
  $('#mBody').innerHTML=`<div class="toolbar"><button type="button" class="btn sm" id="mAuto">옵션값으로 자동 매칭</button><button type="button" class="btn sm" id="mClear">전체 해제</button><span class="pill">왼쪽에서 옵션을 고르고 오른쪽 EPC 상품의 연결을 누른다. 연결하면 다음 미연결 옵션으로 넘어간다</span></div>
  <div class="mgrid">
    <div><h3>선택한 옵션 <span class="pill">${n}개</span></h3><div class="cl" style="max-height:420px"><table><thead><tr><th>옵션값</th><th>EPC 상품</th><th>결과</th><th></th></tr></thead><tbody id="mLeft">${left}</tbody></table></div></div>
    <div><h3>EPC 상품 <span class="pill">${act?esc(act.val)+'에 연결':'옵션을 먼저 고르세요'}</span></h3>
      <div class="toolbar"><input type="text" id="mQ" placeholder="EPC 코드·상품명 검색" value="${esc(MD.q)}" style="flex:1;min-width:160px" aria-label="EPC 코드·상품명 검색"><label class="chkl"><input type="checkbox" id="mSame" ${MD.same?'checked':''}> 같은 모델만</label></div>
      <div class="cl" style="max-height:380px"><table><thead><tr><th>EPC 코드</th><th>상품명</th><th>출고가</th><th>재고</th><th></th></tr></thead><tbody id="mRight">${right||'<tr><td colspan="5" style="color:var(--muted)">검색 결과가 없습니다. 검색어를 줄이거나 같은 모델만을 끄세요</td></tr>'}</tbody></table></div>
      <div class="pill" style="margin-top:6px">${pool.length}개${pool.length>200?' 중 200개 표시':''}</div></div>
  </div>`;
  $('#mFoot').innerHTML=`<span class="pill" style="margin-right:auto">${MD.ids.some(id=>MD.draft.get(id)&&draftCheck(id).st!=='ok')?'불일치로 연결된 옵션이 있습니다. 적용은 되지만 검사에서 경고가 뜬다':''}</span><button type="button" class="btn" id="mCancel">취소</button><button type="button" class="btn primary" id="mApply">적용 (${lk}개 연결)</button>`;
  $('#mLeft').querySelectorAll('tr').forEach(tr=>tr.addEventListener('click',e=>{ if(e.target.classList.contains('un')){ MD.draft.set(tr.dataset.id,null); } MD.act=tr.dataset.id; drawMatch(); }));
  $('#mRight').querySelectorAll('.pk').forEach(bt=>bt.addEventListener('click',()=>{ const i=ITEM_BY_ID.get(bt.closest('tr').dataset.e); MD.draft.set(MD.act,epcOf(i)); MD.act=MD.ids.find(id=>!MD.draft.get(id))||MD.act; drawMatch(); }));
  $('#mQ').addEventListener('input',e=>{ MD.q=e.target.value; drawMatch(); const n2=$('#mQ'); n2.focus(); n2.setSelectionRange(n2.value.length,n2.value.length); });
  $('#mSame').addEventListener('change',e=>{ MD.same=e.target.checked; drawMatch(); });
  $('#mAuto').addEventListener('click',()=>{ let c=0; MD.ids.forEach(id=>{ const i=ITEM_BY_ID.get(id); if(i&&!MD.draft.get(id)){ MD.draft.set(id,epcOf(i)); c++; } }); drawMatch(); toast(c?`${c}개 옵션을 자동 매칭했습니다`:'자동 매칭할 미연결 옵션이 없습니다'); });
  $('#mClear').addEventListener('click',()=>{ MD.ids.forEach(id=>MD.draft.set(id,null)); drawMatch(); });
  $('#mCancel').addEventListener('click',closeModal);
  $('#mApply').addEventListener('click',()=>{ MD.ids.forEach(id=>{ const r=rowById(id); if(r) r.epc=MD.draft.get(id); }); const c=MD.ids.filter(id=>MD.draft.get(id)).length; M.rowSel=new Set(); closeModal(); drawOpt(); renderPanel(); toast(`옵션 ${MD.ids.length}개 중 ${c}개를 EPC에 연결했습니다`); });
}
function openEpcView(id){
  const r=rowById(id); if(!r||!r.epc) return; MD.mode='view'; $('#epcModal .mbox').classList.add('narrow'); const e=r.epc, c=epcCheck(r);
  $('#mTitle').textContent='EPC 상품 조회'; $('#mSub').textContent=e.code;
  $('#mBody').innerHTML=`<dl class="dl">
    <dt>EPC 코드</dt><dd><b>${e.code}</b></dd><dt>EPC 상품명</dt><dd>${esc(e.name)}</dd><dt>모델</dt><dd>${esc(e.key)}</dd>
    <dt>출고가 (EPC)</dt><dd>${e.price.toLocaleString()}원${e.price!==r.price?` <span class="chip warn">옵션목록 가격 ${r.price.toLocaleString()}원과 다름</span>`:''}</dd>
    <dt>재고 (EPC)</dt><dd><span class="chip ${e.sale?'ok':'warn'}">${e.sale?'판매중':'품절'}</span></dd><dt>결합 키</dt><dd><span class="chip">${e.join}</span></dd>
    <dt>연결한 옵션</dt><dd>${esc(r.name)} = ${esc(r.val)}</dd><dt>매칭 결과</dt><dd><span class="chip ${c.st==='ok'?'ok':'bad2'}">${c.t}</span></dd><dt>연동일</dt><dd>${e.at}</dd></dl>`;
  $('#mFoot').innerHTML=`<button type="button" class="btn" id="vDel" style="margin-right:auto">연동 삭제</button><button type="button" class="btn" id="vClose">닫기</button><button type="button" class="btn primary" id="vEdit">수정</button>`;
  $('#vClose').addEventListener('click',closeModal);
  $('#vEdit').addEventListener('click',()=>openEpcMatch([id]));
  $('#vDel').addEventListener('click',()=>{ if(!confirm(`${r.val}의 EPC 연동을 해제할까요?`)) return; r.epc=null; closeModal(); drawOpt(); renderPanel(); toast(`${r.val} EPC 연동을 해제했습니다`); });
  openModal();
}

// ---------- 슬롯 ----------
// ref/product-admin-prototype-v4-6.html 기준. 후보 전체 탭에서 고르고, 선택됨 탭에서 노출 순서·BEST·기본 선택·처음 노출 수를 정한다.
function candidates(si){
  const h=F.head, s=F.slots[si];
  const others=F.slots.filter((x,i)=>i!==si).flatMap(x=>[...x.sel]);
  return ITEMS.filter(i=>i.area===s.area&&(!s.ptypes.size||s.ptypes.has(i.type))).map(o=>{
    let off='';
    if(h){
      if(o.area===h.area&&o.type===h.type&&o.key===h.key) off='기준 단품과 같은 모델';
      else if(o.svc&&h.svc&&o.svc===h.svc) off='정책 4: 기준 단품과 같은 서비스';
      else if(h.inc&&o.svc&&h.inc.includes(o.svc)) off='정책 4: 기준 단품에 이미 포함';
      else if(o.inc&&h.svc&&o.inc.includes(h.svc)) off='정책 4: 기준 단품을 포함하는 결합 상품';
      else if(o.type==='요금제형'&&h.type==='약정형'){ if(o.line!==h.line) off=`정책 2: 결합 키 불일치 (${joinKey(o)} ≠ ${joinKey(h)})`; else if(h.net==='LTE'&&o.net==='5G') off='정책 2: LTE 단말에는 LTE 요금제만'; else if(o.seg==='키즈'&&h.seg!=='키즈') off='키즈 요금제는 키즈폰만'; else if(h.seg==='키즈'&&o.seg!=='키즈') off='키즈폰에는 키즈 요금제만'; }
      else if(o.svc==='ins'&&h.dev&&o.dev&&o.dev!==h.dev) off='보험 대상 기종 불일치';
    }
    if(!off&&o.req){ const pool=h?[h,...others]:others; const ok=pool.some(x=>x.key===o.req||x.name===o.req||x.name.startsWith(o.req)); if(!ok) off=`전제: ${o.req}가 같은 상품에 있어야 함`; }
    if(!off&&others.includes(o)) off='다른 슬롯에서 이미 선택';
    if(!off&&others.some(x=>(x.svc&&o.svc&&x.svc===o.svc)||(x.inc&&o.svc&&x.inc.includes(o.svc)))) off='정책 4: 다른 슬롯 선택값과 같은 서비스';
    return {o,off};
  });
}
function pruneSlots(){ F.slots.forEach((s,i)=>{ const off=new Set(candidates(i).filter(x=>x.off).map(x=>x.o)); [...s.sel].forEach(o=>{ if(off.has(o)) s.sel.delete(o); }); }); }
function slotDesc(s){ return s.locked?'디바이스형 고정: 요금제 필수 택1':(s.max===1?(s.req?'필수 · 택1':'선택 · 택1, 건너뛸 수 있음'):(s.req?`필수 · 1~${s.max}개`:`선택 · 최대 ${s.max}개, 건너뛸 수 있음`)); }
// 선택됨 탭의 노출 순서. 고른 순서대로 쌓이고 ▲▼로 바꾼다.
function ordered(s){ const arr=s.order.filter(o=>s.sel.has(o)); [...s.sel].forEach(o=>{ if(!arr.includes(o)) arr.push(o); }); s.order=arr; return arr; }
function cardsOf(s){ return ordered(s).map(o=>({ck:'i:'+o.id,kind:'single',item:o})); }
function renderSlots(){
  const box=$('#slots'); box.innerHTML='';
  F.slots.forEach((s,i)=>{
    const st=el('div','step'+(s.closed?' closed':'')); st.dataset.sid=s.id;
    const types=POLICY.filter(p=>p.area===s.area);
    st.innerHTML=`<header><b>슬롯 ${i+1}</b><span class="chip ${s.req?'acc':''}">${s.req?'필수':'선택'}</span><span class="why">${slotDesc(s)}</span>${s.locked?'':'<button type="button" class="btn sm del">삭제</button>'}${foldBtn(s.closed)}</header>
    <div class="body">
      <div class="row"><label>유형</label><span class="seg"><button type="button" data-t="1" class="${s.req?'on':''}" ${s.locked?'disabled':''}>필수</button><button type="button" data-t="0" class="${s.req?'':'on'}" ${s.locked?'disabled':''}>선택</button></span>
        <label>영역</label><select class="sArea" ${s.locked?'disabled':''} aria-label="영역"></select>
        <label>최대 선택</label><input class="num sMax" type="number" min="1" value="${s.max}" ${s.locked?'disabled':''} aria-label="최대 선택 수"><span class="pill">${s.max===1?'고객 화면은 택1(라디오)':'고객 화면은 복수 선택(체크)'}</span></div>
      <div class="row"><label>상품유형</label><span class="optv">${types.map(p=>`<label class="chip ${s.ptypes.has(p.type)?'acc':''}"><input type="checkbox" class="pt" data-t="${p.type}" ${s.ptypes.has(p.type)?'checked':''} ${s.locked?'disabled':''}>${p.type}</label>`).join('')}</span><span class="pill">${s.locked?'요금제형 고정':'비우면 영역 전체. 고객 화면 카드 형태가 유형을 따른다'}</span></div>
      <div class="row" style="margin-bottom:8px"><span class="tabs" role="tablist"><button type="button" role="tab" data-tab="all" class="${s.tab==='all'?'on':''}" aria-selected="${s.tab==='all'}">후보 전체 <b class="tc-all"></b></button><button type="button" role="tab" data-tab="sel" class="${s.tab==='sel'?'on':''}" aria-selected="${s.tab==='sel'}">선택됨 <b class="tc-sel"></b></button></span>
        <input type="text" class="q" placeholder="상품명 검색" value="${esc(s.q)}" style="min-width:180px;margin-left:auto" aria-label="후보 상품명 검색"></div>
      <div class="selopt row" ${s.tab==='sel'?'':'hidden'}><label>처음 노출</label><input type="number" class="num smore" min="1" value="${s.more}" aria-label="처음 노출 카드 수"><span class="pill">개, 나머지는 더보기</span></div>
      <div class="cl"><table><thead></thead><tbody></tbody></table></div>
    </div>`;
    const sa=st.querySelector('.sArea'); AREAS.forEach(a=>sa.appendChild(new Option(a,a))); sa.value=s.area;
    sa.addEventListener('change',()=>{ s.area=sa.value; s.ptypes=new Set(); s.sel.clear(); s.order=[]; s.best=new Set(); s.def=null; renderSlots(); });
    st.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ if(b.disabled) return; s.req=b.dataset.t==='1'; renderSlots(); }));
    st.querySelector('.sMax').addEventListener('change',e=>{ s.max=Math.max(1,parseInt(e.target.value)||1); renderSlots(); });
    st.querySelectorAll('.pt').forEach(cb=>cb.addEventListener('change',()=>{ cb.checked?s.ptypes.add(cb.dataset.t):s.ptypes.delete(cb.dataset.t); if(s.ptypes.size) [...s.sel].forEach(o=>{ if(!s.ptypes.has(o.type)) s.sel.delete(o); }); renderSlots(); }));
    st.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{ s.tab=b.dataset.tab; renderSlots(); }));
    st.querySelector('.q').addEventListener('input',e=>{ s.q=e.target.value; drawSlot(i); });
    st.querySelector('.smore').addEventListener('change',e=>{ s.more=Math.max(1,parseInt(e.target.value)||1); e.target.value=s.more; renderPanel(); });
    const del=st.querySelector('.del'); if(del) del.addEventListener('click',()=>{ F.slots.splice(i,1); renderSlots(); toast(`슬롯 ${i+1}을 삭제했습니다`); });
    box.appendChild(st);
  });
  F.slots.forEach((s,i)=>drawSlot(i));
  renderPanel();
}
const qOk=(s,o)=>!s.q.trim()||o.name.includes(s.q.trim());
function slotList(i){ const s=F.slots[i]; return candidates(i).filter(({o})=>qOk(s,o)); }
function drawSlot(i){
  const s=F.slots[i]; const st=document.querySelector(`[data-sid="${s.id}"]`); if(!st) return;
  const th=st.querySelector('thead'), tb=st.querySelector('tbody'); tb.innerHTML=''; th.parentElement.classList.toggle('seltab',s.tab==='sel');
  const all=candidates(i);
  st.querySelector('.tc-all').textContent=all.length; st.querySelector('.tc-sel').textContent=s.sel.size;
  if(s.tab==='all'){
    th.innerHTML='<tr><th class="c"><input type="checkbox" class="all" aria-label="보이는 후보 전체 선택"></th><th>상품명</th><th>상품유형</th><th>결합 키</th><th>비고</th></tr>';
    const list=slotList(i);
    list.slice(0,600).forEach(({o,off})=>{
      const on=s.sel.has(o); const tr=el('tr',(off?'off ':'')+(on?'on':''));
      tr.innerHTML=`<td class="c"><input type="checkbox" data-id="${o.id}" ${on?'checked':''} ${off?'disabled':''} aria-label="${esc(o.name)}"></td><td>${esc(o.name)}</td><td>${o.type}</td><td><span class="chip">${joinKey(o)}</span></td><td class="r">${off}</td>`;
      const cb=tr.querySelector('input');
      cb.addEventListener('change',()=>{ if(cb.checked){ s.sel.add(o); s.order.push(o); } else { s.sel.delete(o); if(s.def===o.id) s.def=null; } afterPick(o.id,s.id); });
      tr.addEventListener('click',e=>{ if(e.target.tagName!=='INPUT'&&!off) cb.click(); });
      tb.appendChild(tr);
    });
    if(!list.length) tb.innerHTML='<tr><td colspan="5" style="color:var(--muted)">조건에 맞는 후보가 없습니다. 상품유형이나 검색어를 바꿔 보세요</td></tr>';
    const en=list.filter(x=>!x.off), n=en.filter(x=>s.sel.has(x.o)).length, ca=th.querySelector('.all');
    ca.checked=en.length>0&&n===en.length; ca.indeterminate=n>0&&n<en.length; ca.disabled=!en.length;
    ca.addEventListener('change',e=>{ en.forEach(({o})=>{ if(e.target.checked){ if(!s.sel.has(o)){ s.sel.add(o); s.order.push(o);} } else { s.sel.delete(o); if(s.def===o.id) s.def=null; } }); afterPick(); });
  } else {
    th.innerHTML='<tr><th style="width:70px">순서</th><th>카드</th><th>상품명</th><th style="width:60px">BEST</th><th style="width:60px">기본</th><th style="width:60px"></th></tr>';
    const arr=ordered(s), cards=cardsOf(s);
    const vis=arr.filter(o=>qOk(s,o));
    vis.forEach(o=>{
      const c=cards.find(c=>c.item===o); const idx=arr.indexOf(o);
      const tr=el('tr'); const bn=benOf(o).length; const grpTxt=bn?`<span class="chip acc">혜택 택1 · ${bn}종</span>`:'<span class="chip">단일</span>';
      tr.innerHTML=`<td><button type="button" class="btn sm up" ${idx===0?'disabled':''} aria-label="위로">▲</button> <button type="button" class="btn sm dn" ${idx===arr.length-1?'disabled':''} aria-label="아래로">▼</button></td><td>${grpTxt}</td><td>${esc(o.name)}</td>
        <td class="c"><input type="checkbox" class="bst" ${s.best.has(c.ck)?'checked':''} aria-label="BEST 표시"></td><td class="c"><input type="radio" name="def-${s.id}" class="df" ${s.def===o.id?'checked':''} aria-label="기본 선택"></td><td><button type="button" class="btn sm rm">해제</button></td>`;
      const mv=d=>{ const j=idx+d; [arr[idx],arr[j]]=[arr[j],arr[idx]]; s.order=arr; drawSlot(i); renderPanel(); };
      tr.querySelector('.up').addEventListener('click',()=>mv(-1)); tr.querySelector('.dn').addEventListener('click',()=>mv(1));
      tr.querySelector('.bst').addEventListener('change',e=>{ e.target.checked?s.best.add(c.ck):s.best.delete(c.ck); drawSlot(i); renderPanel(); });
      tr.querySelector('.df').addEventListener('change',()=>{ s.def=o.id; delete PV[s.id]; renderPanel(); });
      tr.querySelector('.rm').addEventListener('click',()=>{ s.sel.delete(o); if(s.def===o.id) s.def=null; afterPick(); });
      tb.appendChild(tr);
    });
    if(!vis.length) tb.innerHTML=`<tr><td colspan="6" style="color:var(--muted)">${s.sel.size?'검색 결과가 없습니다':'후보 전체 탭에서 상품을 고르세요'}</td></tr>`;
  }
}

// ---------- 고객 화면 카드 (미리보기) ----------
// 슬롯 후보를 고객 화면처럼 카드로 보여 준다. 고른 카드(PV)는 미리보기 안에서만 쓰고 저장하지 않는다.
const PV={};
const INC_L={youtube:'유튜브 프리미엄 무료',netflix:'넷플릭스',disney:'디즈니+',tving:'티빙',wavve:'웨이브',tuju:'T우주'};
const won=n=>n.toLocaleString()+'원';
function feeOf(o){ const h=hash('fee'+o.name); if(o.type==='요금제형'){ const m=o.name.match(/(\d{2,3})(?!\d)/); let f=m&&+m[1]>=20&&+m[1]<=150?+m[1]*1000:(/Max/.test(o.key)?125000:/Pro/.test(o.key)?109000:49000+(h%10)*5000); return f+(o.inc?(h%3)*1000:0); } return 1000+(h%30)*500; }
function planHead(o){ const h=hash('pl'+o.key); const g=o.name.match(/(\d+)GB업/); if(g) return `기본 제공 ${g[1]}GB`; if(/Max|Pro|베스트|프라임|플래티넘|무제한/.test(o.name)) return '무제한'; return ['기본 제공 데이터','기본 제공 110GB','기본 제공 250GB'][h%3]; }
function planDesc(o){ const h=hash('pd'+o.key); return [`테더링/공유 ${[20,50,120][h%3]}GB | T 멤버십 ${['VIP','골드','실버'][h%3]} 혜택`,`스마트 기기 ${h%2+1}회선 이용 요금 무료`]; }
const BEN_SVC=[['유튜브','youtube'],['유투브','youtube'],['넷플릭스','netflix'],['디즈니','disney'],['티빙','tving'],['웨이브','wavve']];
const benSvc=l=>{ const m=BEN_SVC.find(([k])=>l.includes(k)); return m?m[1]:null; };
// 상품명이 "요금제 + A/B/C 중 택1" 꼴이면 혜택 택1 카드가 된다.
function benOf(o){ const i=o.name.indexOf(' + '); if(i<0) return []; const rest=o.name.slice(i+3); if(!/택\s*1/.test(rest)) return []; return rest.replace(/\/?\s*중\s*택\s*1.*$/,'').split('/').map(x=>x.trim()).filter(Boolean); }
const baseName=o=>{ const i=o.name.indexOf(' + '); return i>=0?o.name.slice(0,i).trim():o.name; };
const extraOf=o=>{ const i=o.name.indexOf(' + '); return i>=0&&!benOf(o).length?o.name.slice(i+3).trim():''; };
const clash=(a,b)=>a!==b&&((a.svc&&b.svc&&a.svc===b.svc)||(a.inc&&b.svc&&a.inc.includes(b.svc))||(b.inc&&a.svc&&b.inc.includes(a.svc))||(a.inc&&b.inc&&a.inc.some(x=>b.inc.includes(x))));
function pvState(s){
  let p=PV[s.id]; if(!p) p=PV[s.id]={pick:[],ben:{},more:false,touched:false,open:null};
  p.pick=p.pick.filter(id=>[...s.sel].some(o=>o.id===id));
  if(!p.touched&&!p.pick.length&&s.sel.size){ const d=[...s.sel].find(o=>o.id===s.def); if(d) p.pick=[d.id]; else if(s.req){ const c=cardsOf(s)[0]; if(c) p.pick=[c.item.id]; } }
  return p;
}
function benPick(o,p,others){ const bs=benOf(o); if(!bs.length) return null; const ok=b=>!others.some(x=>clash(x,{svc:benSvc(b)})); let cur=p.ben[o.id]; if(!cur||!bs.includes(cur)||!ok(cur)) cur=bs.find(ok)||bs[0]; p.ben[o.id]=cur; return cur; }
function cardHTML(s,c,p,others){
  const o=c.item, on=p.pick.includes(o.id);
  const dis=!on&&others.some(x=>clash(x,o));
  const full=!on&&s.max>1&&p.pick.length>=s.max;
  const plan=o.type==='요금제형', bs=benOf(o), cur=benPick(o,p,others);
  let h=`<div class="pc ${on?'on':''} ${dis||full?'dis':''} ${bs.length?'hasdd':''}" data-ck="${esc(c.ck)}" role="${s.max===1?'radio':'checkbox'}" aria-checked="${on}" ${bs.length?`aria-expanded="${p.open===o.id}"`:''} tabindex="0">`;
  if(s.best.has(c.ck)) h+='<span class="bdg">BEST</span>';
  if(plan) h+=`<div class="pt">${planHead(o)}</div><div class="ps">${esc(baseName(o))}</div><div class="pp">월 ${won(feeOf(o))}</div><div class="pd">${planDesc(o).map(esc).join('<br>')}${extraOf(o)?'<br>'+esc(extraOf(o)):''}</div>`;
  else h+=`<div class="pt">${esc(o.name)}</div><div class="ps">${o.type}</div><div class="pp">월 ${won(feeOf(o))}</div>`;
  const pm=baseName(o).match(/\(([^)]+)\)/); const chips=bs.length?(pm?[pm[1].trim()+(/유튜브|넷플릭스|디즈니|티빙|웨이브/.test(pm[1])?' 무료':'')]:[]):(o.inc||[]).map(x=>INC_L[x]||x); if(chips.length) h+=`<div class="pch">${chips.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
  h+='<button class="plink" type="button">자세히 보기</button>';
  if(bs.length){ const exp=p.open===o.id; h+=`<span class="pchev" aria-hidden="true">${exp?'▴':'▾'}</span>`; if(exp) h+=`<div class="psec">혜택 선택 · 택1</div>`+bs.map(b=>{ const bad=others.some(x=>clash(x,{svc:benSvc(b)})); return `<label class="pr ${bad?'bad':''}"><input type="radio" name="b-${s.id}-${o.id}" data-b="${esc(b)}" ${b===cur?'checked':''} ${bad?'disabled':''}><span class="rl">${esc(b)}${bad?'<small>다른 슬롯에서 고른 상품과 같은 서비스</small>':''}</span><span class="ra">무료</span></label>`; }).join(''); else h+=`<div class="phint">${on?`선택한 혜택: <b>${esc(cur)}</b> · 눌러서 변경`:`혜택 ${bs.length}종 중 택1`}</div>`; }
  if(dis) h+='<div class="pnote">다른 슬롯에서 고른 상품과 같은 서비스라 고를 수 없어요</div>';
  return h+'</div>';
}
function pickedOf(x){ const q=pvState(x); const out=[]; [...x.sel].filter(o=>q.pick.includes(o.id)).forEach(o=>{ out.push(o); const b=q.ben[o.id]; if(b&&benSvc(b)) out.push({svc:benSvc(b)}); }); return out; }
function slotPv(s,i){
  const others=[F.head,...F.slots.filter(x=>x!==s).flatMap(pickedOf)].filter(Boolean);
  const p=pvState(s), cards=cardsOf(s);
  const kind=s.max===1?'택1':`${p.pick.length}/${s.max} 선택`;
  const what=s.locked?'요금제':(s.ptypes.size===1?[...s.ptypes][0].replace(/형$/,''):s.area);
  let h=`<div class="ph-h">${esc(eul(what))} 선택해 주세요<small>${s.req?'필수':'선택'} · ${kind}</small></div>`;
  if(!cards.length) return h+'<div class="pvempty">후보를 고르면 카드로 보인다</div>';
  const vis=p.more?cards:cards.slice(0,s.more);
  h+=`<div class="pcs" data-slot="${s.id}">`+vis.map(c=>cardHTML(s,c,p,others)).join('');
  if(!s.req) h+=`<label class="pr none"><input type="radio" name="none-${s.id}" class="pnone" ${p.pick.length?'':'checked'}><span class="rl">선택 안 함</span></label>`;
  if(cards.length>s.more) h+=`<button class="pmore" type="button">${p.more?'접기':`나에게 맞는 ${s.locked||s.ptypes.has('요금제형')?'요금제':'상품'} 더보기 (${cards.length-s.more}) ›`}</button>`;
  return h+'</div>';
}
function bindSlotPv(box){
  box.querySelectorAll('.pcs').forEach(wrap=>{
    const s=F.slots.find(x=>String(x.id)===wrap.dataset.slot); if(!s) return; const p=pvState(s); const cards=cardsOf(s);
    const pickCard=(c,keep)=>{ const id=c.item.id, on=p.pick.includes(id); p.touched=true;
      if(s.max===1){ if(on&&!keep&&!s.req) p.pick=[]; else p.pick=[id]; }
      else if(on){ if(!keep) p.pick=p.pick.filter(x=>x!==id); }
      else { if(p.pick.length>=s.max){ toast(`최대 ${s.max}개까지 고를 수 있어요`); return; } p.pick.push(id); }
      renderPanel(); };
    wrap.querySelectorAll('.pc').forEach(el2=>{ const c=cards.find(c=>c.ck===el2.dataset.ck); if(!c) return;
      const blocked=()=>el2.classList.contains('dis')&&!el2.classList.contains('on');
      el2.addEventListener('click',e=>{ if(e.target.closest('label,input,button,select')) return; if(blocked()){ if(s.max>1&&p.pick.length>=s.max) toast(`최대 ${s.max}개까지 고를 수 있어요`); return; }
        const id=c.item.id, has=benOf(c.item).length>0, on=p.pick.includes(id);
        if(has&&on){ p.open=p.open===id?null:id; renderPanel(); return; }
        if(!on&&s.max>1&&p.pick.length>=s.max){ toast(`최대 ${s.max}개까지 고를 수 있어요`); return; }
        p.open=has?id:null; pickCard(c); });
      el2.addEventListener('keydown',e=>{ if(e.target===el2&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); el2.click(); } });
      el2.querySelectorAll('input[data-b]').forEach(r=>r.addEventListener('change',()=>{ p.ben[c.item.id]=r.dataset.b; renderPanel(); }));
      el2.querySelector('.plink').addEventListener('click',()=>toast('상품 상세 페이지로 이동 (예시)'));
    });
    const nn=wrap.querySelector('.pnone'); if(nn) nn.addEventListener('change',()=>{ p.pick=[]; p.open=null; p.touched=true; renderPanel(); });
    const mb=wrap.querySelector('.pmore'); if(mb) mb.addEventListener('click',()=>{ p.more=!p.more; renderPanel(); });
  });
}
function afterPick(id,sid){
  F.slots.forEach((s,i)=>drawSlot(i));
  if(id){ const f=document.querySelector(`[data-sid="${sid}"] input[data-id="${id}"]`); if(f) f.focus({preventScroll:true}); }
  renderPanel();
}
$('#addSlot').addEventListener('click',()=>{ F.slots.push(newSlot({area:tdef(F.type).slot})); renderSlots(); const last=document.querySelector('#slots .step:last-child'); if(last) last.scrollIntoView({block:'nearest',behavior:'smooth'}); });

// ---------- 섹션 접기·펼치기 ----------
function foldBtn(closed){ return `<button type="button" class="fold" aria-expanded="${!closed}" aria-label="${closed?'펼치기':'접기'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>`; }
// 헤더 빈 곳이나 화살표를 누르면 접는다. 헤더 안의 다른 버튼·입력은 제외. 슬롯은 다시 그려도 상태를 유지한다.
$('#v-edit').addEventListener('click',e=>{
  const head=e.target.closest('.step>header'); if(!head) return;
  if(!e.target.closest('.fold')&&e.target.closest('button,input,select,label,a')) return;
  const st=head.parentElement, closed=st.classList.toggle('closed'), fb=head.querySelector('.fold');
  if(fb){ fb.setAttribute('aria-expanded',String(!closed)); fb.setAttribute('aria-label',closed?'펼치기':'접기'); }
  const slot=st.dataset.sid&&F.slots.find(x=>String(x.id)===st.dataset.sid); if(slot) slot.closed=closed;
});

// ---------- 이미지 ----------
const MAX_SUBS=9;
// 이미지를 캔버스로 줄여 JPEG data URL로 만든다. 투명 배경은 흰색으로 채운다.
function shrink(file,maxW,maxH){
  return new Promise((ok,fail)=>{
    if(!file.type.startsWith('image/')){ fail(new Error('type')); return; }
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{ const r=Math.min(1,maxW/img.width,maxH/img.height); const c=document.createElement('canvas'); c.width=Math.round(img.width*r); c.height=Math.round(img.height*r);
      const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg',0.82)); };
    img.onerror=()=>{ URL.revokeObjectURL(url); fail(new Error('load')); };
    img.src=url;
  });
}
async function readImages(files,maxW,maxH,limit){
  const list=[...files].slice(0,limit), out=[];
  for(const f of list){ try { out.push(await shrink(f,maxW,maxH)); } catch { toast(`${f.name}은(는) 이미지로 읽을 수 없습니다`); } }
  if(files.length>limit) toast(`최대 개수를 넘어 ${files.length-limit}개는 제외했습니다`);
  return out;
}
const thumb=(src,i,label,main)=>`<div class="img-thumb"><img src="${src}" alt="${label}"><button type="button" class="x" data-i="${i}" aria-label="${label} 삭제">×</button>${main?'<span class="tag-main">대표</span>':''}</div>`;
const addTile=(id,label,cls)=>`<button type="button" class="img-add${cls?' '+cls:''}" id="${id}"><b>+</b>${label}</button>`;
function renderMedia(){
  const m=F.media;
  $('#imgOn').hidden=!m.main;
  $('#mainImg').innerHTML=m.main?thumb(m.main,0,'대표이미지',true):addTile('mainImgAdd','대표이미지 등록');
  $('#subImgs').innerHTML=m.subs.map((u,i)=>thumb(u,i,`추가이미지 ${i+1}`)).join('')+(m.subs.length<MAX_SUBS?addTile('subImgAdd','추가이미지'):'');
  $('#subImgCnt').textContent=`${m.subs.length}/${MAX_SUBS}개`;
  const ma=$('#mainImgAdd'); if(ma) ma.addEventListener('click',()=>$('#mainImgFile').click());
  const sa=$('#subImgAdd'); if(sa) sa.addEventListener('click',()=>$('#subImgFile').click());
  $('#mainImg').querySelectorAll('.x').forEach(b=>b.addEventListener('click',()=>{ m.main=null; renderMedia(); renderPanel(); }));
  $('#subImgs').querySelectorAll('.x').forEach(b=>b.addEventListener('click',()=>{ m.subs.splice(+b.dataset.i,1); renderMedia(); renderPanel(); }));
}
$('#mainImgFile').addEventListener('change',async e=>{ const [u]=await readImages(e.target.files,1000,1000,1); e.target.value=''; if(u){ F.media.main=u; renderMedia(); renderPanel(); } });
$('#subImgFile').addEventListener('change',async e=>{ const us=await readImages(e.target.files,1000,1000,MAX_SUBS-F.media.subs.length); e.target.value=''; if(us.length){ F.media.subs.push(...us); renderMedia(); renderPanel(); } });

// ---------- 상품정보 ----------
const MAX_DETAIL=20;
function renderDetail(){
  const d=F.media.detail;
  $('#detailMode').querySelectorAll('button').forEach(b=>{ const on=b.dataset.m===d.mode; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); if(on) $('#detailModeTag').textContent=b.textContent; });
  $('#detailModeTag').hidden=!d.mode;
  $('#detailImage').hidden=d.mode!=='image'; $('#detailHtml').hidden=d.mode!=='html'; $('#detailBuilder').hidden=d.mode!=='builder';
  $('#detailImgs').innerHTML=d.images.map((u,i)=>thumb(u,i,`상세 이미지 ${i+1}`)).join('')+(d.images.length<MAX_DETAIL?addTile('detailImgAdd',d.images.length?'이미지 추가':'상세 이미지 업로드 (세로로 이어 붙음)',d.images.length?'':'full'):'');
  const add=$('#detailImgAdd'); if(add) add.addEventListener('click',()=>$('#detailImgFile').click());
  $('#detailImgs').querySelectorAll('.x').forEach(b=>b.addEventListener('click',()=>{ d.images.splice(+b.dataset.i,1); renderDetail(); renderPanel(); }));
  $('#detailHtmlInput').value=d.html;
}
$('#detailMode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ F.media.detail.mode=b.dataset.m; renderDetail(); renderPanel(); }));
$('#detailImgFile').addEventListener('change',async e=>{ const d=F.media.detail; const us=await readImages(e.target.files,860,4000,MAX_DETAIL-d.images.length); e.target.value=''; if(us.length){ d.images.push(...us); renderDetail(); renderPanel(); } });
$('#detailHtmlInput').addEventListener('input',e=>{ F.media.detail.html=e.target.value; });
// 미리보기는 sandbox iframe이라 입력한 HTML의 스크립트는 실행되지 않는다.
$('#htmlView').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  const pv=b.dataset.v==='preview'; $('#htmlView').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  $('#detailHtmlInput').hidden=pv; $('#detailHtmlPreview').hidden=!pv;
  if(pv) $('#detailHtmlPreview').srcdoc=`<!doctype html><meta charset="utf-8"><style>body{font:14px/1.6 system-ui,sans-serif;margin:12px;color:#20293b}img{max-width:100%}</style>${F.media.detail.html||'<p style="color:#888">입력한 HTML이 없습니다</p>'}`;
}));
// ---------- 영역 ON/OFF ----------
// 헤더 스위치가 있는 영역. 기본값은 모두 OFF. 켜면 펼치고 끄면 접는다. 유의사항·구매후기는 사용 여부만 저장한다(내용 입력은 추후 추가 예정).
const SWITCHES=[
 {step:'#noticeStep',inp:'#noticeOn',get:()=>F.noticeOn,set:v=>{F.noticeOn=v;}},
 {step:'#faqStep',inp:'#faqOn',get:()=>F.faq.on,set:v=>{F.faq.on=v;}},
 {step:'#reviewStep',inp:'#reviewOn',get:()=>F.reviewOn,set:v=>{F.reviewOn=v;}},
 {step:'#badgeStep',inp:'#badgeOn',get:()=>F.badgeOn,set:v=>{F.badgeOn=v;}},
 {step:'#simStep',inp:'#simOn',get:()=>F.sim.on,set:v=>{F.sim.on=v;}},
 {step:'#seoStep',inp:'#seoOn',get:()=>F.seoOn,set:v=>{F.seoOn=v;}},
 {step:'#srchStep',inp:'#srchOn',get:()=>F.srch.on,set:v=>{F.srch.on=v;}},
];
function setFold(st,closed){ st.classList.toggle('closed',closed); const fb=st.querySelector(':scope>header .fold'); if(fb){ fb.setAttribute('aria-expanded',String(!closed)); fb.setAttribute('aria-label',closed?'펼치기':'접기'); } }
// fold가 true면 ON/OFF에 맞춰 펼침 상태도 맞춘다(처음 그릴 때·불러올 때).
function renderSwitches(fold){ SWITCHES.forEach(w=>{ const on=!!w.get(), st=$(w.step); $(w.inp).checked=on; st.classList.toggle('off',!on); if(fold) setFold(st,!on); }); }
SWITCHES.forEach(w=>$(w.inp).addEventListener('change',e=>{ const on=e.target.checked; w.set(on); renderSwitches(); setFold($(w.step),!on); renderPanel(); }));
// ---------- 주요정보 ----------
function renderSpec(){
  const p=F.spec;
  $('#fModel').value=p.model; $('#fProduct').value=p.product; $('#fBrand').value=p.brand; $('#fMaker').value=p.maker;
  $('#minorSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(b.dataset.t==='1')===p.minor));
  $('#minorAge').hidden=!p.minor; $('#ageFrom').value=p.ageFrom; $('#ageTo').value=p.ageTo;
}
[['#fModel','model'],['#fProduct','product'],['#fBrand','brand'],['#fMaker','maker'],['#ageFrom','ageFrom'],['#ageTo','ageTo']].forEach(([id,k])=>$(id).addEventListener('input',e=>{ F.spec[k]=e.target.value.trim(); renderPanel(); }));
$('#minorSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ F.spec.minor=b.dataset.t==='1'; renderSpec(); renderPanel(); }));
// EPC에서 정보 불러오기(목업): 기준 단품의 모델명·제품명·브랜드·제조사를 채운다. 조건은 건드리지 않는다.
function epcSpec(h){
  const apple=h.dev==='iphone'||/^iPhone/.test(h.key), sam=/갤럭시/.test(h.key), n=hash('model'+h.key);
  return {model:apple?'A'+(3000+n%1000):sam?`SM-${'SFAM'[n%4]}${700+n%300}N`:'M'+(10000+n%90000),product:h.key,brand:apple?'애플':sam?'삼성':'',maker:apple?'Apple Inc.':sam?'삼성전자':''};
}
$('#specEpc').addEventListener('click',()=>{
  if(!F.head){ toast('기준 단품을 먼저 고르세요. EPC 정보는 기준 단품으로 불러옵니다'); return; }
  Object.assign(F.spec,epcSpec(F.head)); renderSpec(); renderPanel(); toast(`${F.head.key} 정보를 EPC에서 불러왔습니다`);
});
// ---------- 아이콘 · 뱃지 ----------
// 프로모션별 노출 여부. F.badges에는 노출을 켠 키만 BADGES 순서대로 담는다.
const BADGES=[
 {k:'loyal',label:'장기고객혜택',desc:'가입 기간이 긴 고객 대상 혜택',color:'#4320d4',icon:'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'},
 {k:'hot',label:'인기상품',desc:'판매량 상위 상품',color:'#e2453c',icon:'<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.2 2.2-5.3 3.6-7.4.4 1.8 1.3 3 2.6 3.6C11 7 12.5 4.6 14.6 3c-.2 2.8 1 4.6 2.4 6.2 1.3 1.5 2 3.1 2 5.2 0 3.8-3.1 6.6-7 6.6z"/>'},
 {k:'loc',label:'위치결합할인',desc:'인터넷·집전화 등 설치 장소 결합 할인',color:'#1f8a5b',icon:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'},
 {k:'new',label:'신상품',desc:'최근 출시 상품',color:'#2f7fd8',icon:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'},
 {k:'gift',label:'사은품증정',desc:'구매 시 사은품 제공',color:'#c26a00',icon:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 8 4.5 9 8 12 8zm0 0s1.5-5 4-3.5S15 8 12 8z"/>'},
 {k:'limited',label:'한정수량',desc:'재고 소진 시 판매 종료',color:'#5a5d66',icon:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'},
];
const badgeHtml=b=>`<span class="bdg" style="background:${b.color}"><svg viewBox="0 0 24 24" aria-hidden="true">${b.icon}</svg>${b.label}</span>`;
function renderBadges(){
  const on=new Set(F.badges);
  $('#badgeList').innerHTML=BADGES.map(b=>`<li class="badge-item${on.has(b.k)?' on':''}">${badgeHtml(b)}<span class="bi-tx"><b>${b.label}</b><small>${b.desc}</small></span><label class="switch" title="노출 여부"><input type="checkbox" data-k="${b.k}" ${on.has(b.k)?'checked':''} aria-label="${b.label} 노출"><span aria-hidden="true"></span></label></li>`).join('');
  $('#badgeCnt').textContent=`노출 ${on.size}개`; $('#badgeCnt').hidden=!on.size;
}
$('#badgeList').addEventListener('change',e=>{
  const k=e.target.dataset.k; if(!k) return;
  const on=new Set(F.badges); e.target.checked?on.add(k):on.delete(k);
  F.badges=BADGES.filter(b=>on.has(b.k)).map(b=>b.k); renderBadges(); renderPanel();
});
// ---------- 유사한 상품 ----------
const simText=()=>F.sim.mode==='custom'?{title:F.sim.title.trim(),sub:F.sim.sub.trim()}:SIM_DEF;
function renderSim(){
  const m=F.sim, t=simText();
  $('#simMode').querySelectorAll('button').forEach(b=>{ const on=b.dataset.m===m.mode; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
  $('#simCustom').hidden=m.mode!=='custom';
  $('#simTitle').value=m.title; $('#simSub').value=m.sub;
  $('#simTitle').placeholder=SIM_DEF.title; $('#simSub').placeholder=SIM_DEF.sub;
  simLen();
  $('#simPvTitle').textContent=t.title||'타이틀을 입력하세요'; $('#simPvSub').textContent=t.sub;
}
function simLen(){ $('#simTitleLen').textContent=`${F.sim.title.length}/${SIM_MAX}`; $('#simSubLen').textContent=`${F.sim.sub.length}/${SIM_MAX}`; }
// 직접 입력으로 처음 바꾸면 기본 문구를 채워 두고 고치게 한다.
$('#simMode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  const m=F.sim; m.mode=b.dataset.m;
  if(m.mode==='custom'&&!m.title&&!m.sub){ m.title=SIM_DEF.title; m.sub=SIM_DEF.sub; }
  renderSim(); renderPanel();
}));
[['#simTitle','title'],['#simSub','sub']].forEach(([id,k])=>$(id).addEventListener('input',e=>{
  F.sim[k]=e.target.value.slice(0,SIM_MAX); const t=simText(); $('#simPvTitle').textContent=t.title||'타이틀을 입력하세요'; $('#simPvSub').textContent=t.sub; simLen(); renderPanel();
}));
// ---------- 검색 (SEO/GEO) ----------
// 콤마나 Enter를 치면 앞의 글자가 태그가 된다. 붙여넣은 "a, b, c"도 한 번에 나눈다. 같은 태그는 한 번만.
function addTags(raw){
  const t=F.seo.tags; let over=0;
  raw.split(',').map(x=>x.trim().replace(/^#/,'')).filter(Boolean).forEach(x=>{ if(t.includes(x)) return; if(t.length>=SEO_MAX.tags){ over++; return; } t.push(x); });
  if(over) toast(`태그는 최대 ${SEO_MAX.tags}개까지입니다. ${over}개는 넣지 않았습니다`);
}
function renderSeo(){
  const o=F.seo, full=o.tags.length>=SEO_MAX.tags;
  $('#seoTags').innerHTML=o.tags.map((x,i)=>`<span class="tag-chip">${esc(x)}<button type="button" data-i="${i}" aria-label="${esc(x)} 태그 삭제">×</button></span>`).join('');
  const inp=$('#seoTagIn'); inp.disabled=full; inp.placeholder=full?'태그를 모두 입력했습니다':'콤마(,)로 구분해 입력';
  $('#seoTagCnt').textContent=`${o.tags.length}/${SEO_MAX.tags}개`;
  $('#seoTitle').value=o.title; $('#seoDesc').value=o.desc; seoLen();
}
function seoLen(){ $('#seoTitleLen').textContent=`${F.seo.title.length}/${SEO_MAX.title}`; $('#seoDescLen').textContent=`${F.seo.desc.length}/${SEO_MAX.desc}`; }
$('#seoTagIn').addEventListener('input',e=>{ const v=e.target.value; if(!v.includes(',')) return; const i=v.lastIndexOf(','); addTags(v.slice(0,i)); renderSeo(); const inp=$('#seoTagIn'); inp.value=inp.disabled?'':v.slice(i+1); inp.focus(); });
$('#seoTagIn').addEventListener('keydown',e=>{
  const inp=e.target;
  if(e.key==='Enter'&&!e.isComposing){ e.preventDefault(); if(inp.value.trim()){ addTags(inp.value); inp.value=''; renderSeo(); $('#seoTagIn').focus(); } }
  else if(e.key==='Backspace'&&!inp.value&&F.seo.tags.length){ F.seo.tags.pop(); renderSeo(); $('#seoTagIn').focus(); }
});
// 입력칸을 벗어나면 남은 글자도 태그로 넣는다.
$('#seoTagIn').addEventListener('blur',e=>{ if(e.target.value.trim()){ addTags(e.target.value); e.target.value=''; renderSeo(); } });
$('#seoTags').addEventListener('click',e=>{ const b=e.target.closest('button[data-i]'); if(!b) return; F.seo.tags.splice(+b.dataset.i,1); renderSeo(); $('#seoTagIn').focus(); });
$('#seoTagBox').addEventListener('click',e=>{ if(e.target.id==='seoTagBox') $('#seoTagIn').focus(); });
$('#seoTitle').addEventListener('input',e=>{ F.seo.title=e.target.value.slice(0,SEO_MAX.title); seoLen(); });
$('#seoDesc').addEventListener('input',e=>{ F.seo.desc=e.target.value.slice(0,SEO_MAX.desc); seoLen(); });
// ---------- 자주묻는질문 ----------
// 질문·답변 묶음을 추가·삭제하고 위아래로 옮긴다. 저장할 때는 질문과 답변이 모두 빈 묶음을 뺀다.
const faqItems=()=>F.faq.items.map(x=>({q:x.q.trim(),a:x.a.trim()})).filter(x=>x.q||x.a);
const FAQ_IC={up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',del:'<path d="M6 6l12 12M18 6 6 18"/>'};
function faqMeta(){
  const n=faqItems().length, all=F.faq.items.length;
  $('#faqCnt').textContent=`${n}개`; $('#faqCnt').hidden=!n;
  $('#faqAdd').disabled=all>=FAQ_MAX; $('#faqMax').textContent=`${all}/${FAQ_MAX}개`;
}
function renderFaq(){
  const it=F.faq.items, last=it.length-1;
  const btn=(a,i,lb,off)=>`<button type="button" data-a="${a}" data-i="${i}" aria-label="${i+1}번 ${lb}" ${off?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true">${FAQ_IC[a]}</svg></button>`;
  $('#faqList').innerHTML=it.map((x,i)=>`<li class="faq-item"><div class="faq-fields"><input type="text" data-k="q" data-i="${i}" value="${esc(x.q)}" maxlength="100" placeholder="질문을 입력하세요" aria-label="${i+1}번 질문"><textarea data-k="a" data-i="${i}" rows="3" maxlength="1000" placeholder="답변을 입력하세요" aria-label="${i+1}번 답변">${esc(x.a)}</textarea></div><div class="faq-acts">${btn('up',i,'위로',i===0)}${btn('down',i,'아래로',i===last)}${btn('del',i,'삭제',false)}</div></li>`).join('');
  faqMeta();
}
$('#faqList').addEventListener('input',e=>{ const t=e.target, i=t.dataset.i; if(i==null) return; F.faq.items[+i][t.dataset.k]=t.value; faqMeta(); });
$('#faqList').addEventListener('change',()=>renderPanel());
$('#faqList').addEventListener('click',e=>{
  const b=e.target.closest('button[data-a]'); if(!b) return; const it=F.faq.items, i=+b.dataset.i, a=b.dataset.a;
  if(a==='del'){ if(it.length>1) it.splice(i,1); else it[0]={q:'',a:''}; }
  else { const j=a==='up'?i-1:i+1; [it[i],it[j]]=[it[j],it[i]]; }
  renderFaq(); renderPanel();
  const f=$(`#faqList [data-a="${a}"][data-i="${a==='del'?Math.min(i,it.length-1):a==='up'?i-1:i+1}"]`); if(f&&!f.disabled) f.focus();
});
$('#faqAdd').addEventListener('click',()=>{
  const it=F.faq.items; if(it.length>=FAQ_MAX) return;
  it.push({q:'',a:''}); renderFaq(); $(`#faqList input[data-i="${it.length-1}"]`).focus();
});
// ---------- 검색정보 ----------
// 키워드는 알약 모양 입력칸 하나에 하나씩. + 로 칸을 늘리고 × 로 지운다(마지막 한 칸은 비우기만 한다).
const srchKws=()=>F.srch.kws.map(x=>x.trim()).filter(Boolean);
function srchState(){
  const s=F.srch, n=srchKws().length, st=s.show&&n?'작성완료':s.show||n?'작성중':'미작성';
  const c=$('#srchSt'); c.textContent=st; c.classList.toggle('acc',st!=='미작성');
  $('#srchAdd').disabled=s.kws.length>=SRCH_MAX;
}
function renderSrch(){
  const s=F.srch;
  $('#srchShow').querySelectorAll('input').forEach(r=>{ r.checked=r.value===s.show; });
  $('#srchKws').innerHTML=s.kws.map((x,i)=>`<span class="kw-chip"><input type="text" data-i="${i}" value="${esc(x)}" maxlength="20" placeholder="+ 입력" aria-label="검색키워드 ${i+1}"><button type="button" data-i="${i}" aria-label="검색키워드 ${i+1} 삭제"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></span>`).join('');
  srchState();
}
const srchFocus=i=>{ const inp=$(`#srchKws input[data-i="${i}"]`); if(inp) inp.focus(); };
$('#srchShow').addEventListener('change',e=>{ F.srch.show=e.target.value; srchState(); renderPanel(); });
$('#srchKws').addEventListener('input',e=>{ const i=e.target.dataset.i; if(i==null) return; F.srch.kws[+i]=e.target.value; srchState(); });
$('#srchKws').addEventListener('change',()=>renderPanel());
$('#srchKws').addEventListener('click',e=>{
  const b=e.target.closest('button[data-i]'); if(!b) return; const k=F.srch.kws, i=+b.dataset.i;
  if(k.length>1) k.splice(i,1); else k[0]='';
  renderSrch(); srchFocus(Math.min(i,k.length-1)); renderPanel();
});
// 입력칸에서 Enter를 치면 다음 칸을 만든다
$('#srchKws').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.isComposing&&e.target.matches('input')){ e.preventDefault(); if(e.target.value.trim()) $('#srchAdd').click(); } });
$('#srchAdd').addEventListener('click',()=>{
  const k=F.srch.kws; if(k.length>=SRCH_MAX){ toast(`검색태그는 최대 ${SRCH_MAX}개까지 설정할 수 있습니다`); return; }
  const empty=k.findIndex(x=>!x.trim()); if(empty>=0){ srchFocus(empty); return; } // 빈 칸이 있으면 그 칸부터 채운다
  k.push(''); renderSrch(); srchFocus(k.length-1);
});
// ---------- 주문·결제 연동 (목업) ----------
// 노드를 누르면 연동/해제를 오간다. 실제 연동 API가 붙으면 여기서 설정 화면을 연다.
function renderLinks(){ document.querySelectorAll('#linkFlow .flow-node').forEach(b=>{ const on=!!F.links[b.dataset.k]; b.classList.toggle('on',on); b.querySelector('.fn-st').textContent=on?'설정됨':'미설정'; }); }
// 노드를 누르면 설정 화면이 오른쪽에서 풀페이지로 들어온다. 설정 항목은 추후 추가 예정.
const SHEET={order:{t:'주문서 설정',sub:'주문서 · 개통 정보'},pay:{t:'결제 설정',sub:'결제수단 · 청구 정보'},builder:{t:'전시빌더',sub:'상품정보 화면 구성'}};
// ---------- 주문서 컨테이너 (목업) ----------
// 주문서 설정 레이어에서 검색·선택한다. 실제 API가 붙으면 CTN 대신 조회 결과를 쓴다.
const CTN_NAMES=['아이폰 18 pro 전용 컨테이너','상품 유형_단말 기본 컨테이너','상품 유형_단말 신규가입 기본 컨테이너','상품 유형_단말 번호이동 기본 컨테이너','상품 유형_단말 기기변경 기본 컨테이너','상품 유형_요금제 기본 컨테이너','상품 유형_부가서비스 기본 컨테이너','상품 유형_커머스 기본 컨테이너','아이폰 18 전용 컨테이너','아이폰 18 pro max 전용 컨테이너'];
const CTN_ST=['반려','반려','반려','임시 저장','임시 저장','임시 저장','승인 완료','승인 완료','승인 완료','승인 완료'];
const CTN=Array.from({length:253},(_,i)=>{
  const n=i+1, j=i%10, nm=CTN_NAMES[j], d=new Date(2026,4,1+Math.floor(i*123/252),9+i%9);
  const p=v=>String(v).padStart(2,'0');
  return { no:n, cat:nm.startsWith('상품 유형')?'상품 유형 컨테이너':'특정 전시 상품 컨테이너', id:`CTN-ORD-${String(n).padStart(3,'0')}`, nm,
    st:CTN_ST[j], use:CTN_ST[j]==='반려'?'N':'Y', ymd:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`, hm:`${p(d.getHours())}:00` };
}).reverse();
const CTN_PER=10, CTN_FROM=CTN.at(-1).ymd, CTN_TO=CTN[0].ymd;
let ctnList=CTN, ctnPage=1, ctnPick=null;
const ctnTag=s=>s==='승인 완료'?'ok':s==='반려'?'bad':'warn';
function ctnSearch(){
  const cat=$('#ctnCat').value, id=$('#ctnId').value.trim().toLowerCase(), nm=$('#ctnNm').value.trim().toLowerCase(), fr=$('#ctnFrom').value, to=$('#ctnTo').value;
  ctnList=CTN.filter(c=>(!cat||c.cat===cat)&&(!id||c.id.toLowerCase().includes(id))&&(!nm||c.nm.toLowerCase().includes(nm))&&(!fr||c.ymd>=fr)&&(!to||c.ymd<=to));
  ctnPage=1; renderCtn();
}
function ctnReset(){ $('#ctnCat').value=''; $('#ctnId').value=''; $('#ctnNm').value=''; $('#ctnFrom').value=CTN_FROM; $('#ctnTo').value=CTN_TO; ctnSearch(); }
function renderCtn(){
  const last=Math.max(1,Math.ceil(ctnList.length/CTN_PER)), rows=ctnList.slice((ctnPage-1)*CTN_PER,ctnPage*CTN_PER);
  $('#ctnCnt').textContent=`${ctnList.length.toLocaleString()}건`;
  $('#ctnRows').innerHTML=rows.length?rows.map(c=>`<tr data-id="${c.id}" class="${c.id===ctnPick?'act':''}" tabindex="0" aria-selected="${c.id===ctnPick}"><td>${c.no}</td><td>${esc(c.cat)}</td><td class="cid">${c.id}</td><td class="nm">${esc(c.nm)}</td><td><span class="tag ${ctnTag(c.st)}">${c.st}</span></td><td>${c.use}</td><td>${c.ymd.replaceAll('-','.')} ${c.hm}</td></tr>`).join('')
    :'<tr class="empty"><td colspan="7">조회 결과가 없습니다</td></tr>';
  // 현재 페이지를 가운데 두고 10개씩 보여 준다
  const s=Math.max(1,Math.min(ctnPage-4,last-9)), e=Math.min(last,s+9), nums=[];
  for(let i=s;i<=e;i++) nums.push(`<button type="button" data-p="${i}" class="${i===ctnPage?'on':''}" ${i===ctnPage?'aria-current="page"':''}>${i}</button>`);
  const arw=(p,lb,tx,off)=>`<button type="button" data-p="${p}" aria-label="${lb}" ${off?'disabled':''}>${tx}</button>`;
  $('#ctnPager').innerHTML=arw(1,'처음','«',ctnPage===1)+arw(ctnPage-1,'이전','‹',ctnPage===1)+nums.join('')+(e<last?`<i>…</i>${arw(last,`${last}페이지`,last,false)}`:'')+arw(ctnPage+1,'다음','›',ctnPage===last)+arw(last,'마지막','»',ctnPage===last);
}
function pickCtn(id){ ctnPick=ctnPick===id?null:id; const c=CTN.find(x=>x.id===ctnPick); $('#sheetSub').textContent=c?`${c.id} · ${c.nm}`:SHEET.order.sub; renderCtn(); }
$('#ctnForm').addEventListener('submit',e=>{ e.preventDefault(); ctnSearch(); });
$('#ctnReset').addEventListener('click',ctnReset);
$('#ctnPager').addEventListener('click',e=>{ const b=e.target.closest('button[data-p]'); if(!b||b.disabled) return; ctnPage=+b.dataset.p; renderCtn(); });
$('#ctnRows').addEventListener('click',e=>{ const r=e.target.closest('tr[data-id]'); if(r) pickCtn(r.dataset.id); });
$('#ctnRows').addEventListener('keydown',e=>{ const r=e.target.closest('tr[data-id]'); if(r&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); pickCtn(r.dataset.id); $(`#ctnRows tr[data-id="${r.dataset.id}"]`).focus(); } });
$('#ctnAdd').addEventListener('click',()=>toast('주문서 컨테이너 등록은 추후 추가 예정입니다'));
ctnReset();

let sheetKey=null, sheetFrom=null;
function openSheet(k,from){
  sheetKey=k; sheetFrom=from; const d=SHEET[k], sh=$('#linkSheet'), ord=k==='order';
  const c=ord&&CTN.find(x=>x.id===ctnPick);
  $('#sheetTitle').textContent=d.t; $('#sheetSub').textContent=c?`${c.id} · ${c.nm}`:d.sub; $('#sheetBody').textContent=`${d.t} 항목은 추후 추가 예정입니다`;
  // 주문서 설정은 화면 80% 크기의 모달 레이어로 띄운다
  sh.classList.toggle('pop',ord); $('#sheetCtn').hidden=!ord; $('#sheetBody').hidden=ord;
  // 가입유형·할인방법은 디바이스형 주문서에서만 고른다
  $('#sheetOrder').hidden=!(ord&&isDev()&&!!F.head);
  $('#sheetDone').textContent=k==='builder'?'저장':'설정 완료';
  $('#sheetOff').hidden=!F.links[k]; // 전시빌더는 연동 상태가 없어 해제 버튼을 쓰지 않는다
  if(ord){ renderCtn(); $('#sheetDim').classList.add('open'); }
  sh.classList.add('open'); document.body.classList.add('sheet-on'); sh.focus();
}
function closeSheet(){ $('#linkSheet').classList.remove('open'); $('#sheetDim').classList.remove('open'); document.body.classList.remove('sheet-on'); if(sheetFrom) sheetFrom.focus({preventScroll:true}); sheetKey=null; }
function setLink(on){
  const k=sheetKey, t=SHEET[k].t;
  if(k==='builder'){ closeSheet(); toast('전시빌더 내용을 저장했습니다'); return; }
  if(on&&k==='order'&&!ctnPick){ toast('목록에서 주문서 컨테이너를 선택하세요'); return; }
  if(!on&&k==='order') ctnPick=null;
  F.links[k]=on; closeSheet(); renderLinks(); toast(`${t}${on?'을 저장했습니다':'을 해제했습니다'}`);
}
$('#sheetDim').addEventListener('click',closeSheet);
document.querySelectorAll('#linkFlow .flow-node').forEach(b=>b.addEventListener('click',()=>openSheet(b.dataset.k,b)));
$('#sheetBack').addEventListener('click',closeSheet);
$('#sheetCancel').addEventListener('click',closeSheet);
$('#sheetDone').addEventListener('click',()=>setLink(true));
$('#sheetOff').addEventListener('click',()=>setLink(false));
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&sheetKey) closeSheet(); });
$('#openBuilder').addEventListener('click',e=>openSheet('builder',e.currentTarget));

// ---------- 미리보기 · 검사 ----------
const liveRows=()=>(M.rows||[]).filter(r=>r.use&&(r.sale||M.soldout==='show'));
// ---------- 미리보기: 고객 화면(모바일 상품 상세) ----------
// 상단 이미지 → 상품 정보·뱃지·가입 안내 → 탭(상품 주문/상품 정보/구매 후기) 순서. 탭 선택은 미리보기에서만 쓴다.
let PVTAB='order';
const PH_IC={
 back:'<path d="m15 18-6-6 6-6"/>',
 share:'<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
 bag:'<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 spark:'<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18 15l.7 1.8 1.8.7-1.8.7L18 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
 device:'<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
};
const phIc=(k,cls)=>`<svg class="${cls||''}" viewBox="0 0 24 24" aria-hidden="true">${PH_IC[k]}</svg>`;
// 미성년자 구매 설정을 고객 안내 문구로 바꾼다.
function minorNote(){
  const p=F.spec; if(!p.minor) return '만 19세 이상 고객님만 가입할 수 있는 상품이에요';
  const a=p.ageFrom, b=p.ageTo;
  if(a&&b) return `만 ${a}세 이상 만 ${b}세 이하 고객님도 가입할 수 있는 상품이에요`;
  if(a) return `만 ${a}세 이상이면 미성년자도 가입할 수 있는 상품이에요`;
  if(b) return `만 ${b}세 이하 미성년자도 가입할 수 있는 상품이에요`;
  return '미성년자도 가입할 수 있는 상품이에요';
}
// 받침 유무로 을/를을 고른다
const eul=w=>{ const c=String(w).charCodeAt(String(w).length-1); return w+(c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28?'을':'를'); };
const gbOf=v=>{ const m=String(v).match(/^(\d+)(G|T)$/); return m?+m[1]*(m[2]==='T'?1024:1):0; };
function devPv(){
  if(!M.rows) return `<div class="ph-sec"><div class="pvempty">옵션목록을 적용하면 고객이 고르는 옵션이 여기에 보인다</div></div>`;
  const live=liveRows();
  if(!live.length) return `<div class="ph-sec"><div class="pvempty">고객에게 보일 옵션이 없다. 옵션목록에서 사용으로 바꾸세요</div></div>`;
  const axes=live[0].name.split(' / '), a0=axes[0], a1=axes[1];
  const cur=live.find(r=>r.id===M.sel)||live[0];
  const firsts=[...new Set(live.map(r=>r.v[a0]))];
  let h='';
  if(a0==='색상') h+=`<div class="ph-sec"><div class="ph-h">원하는 색상을 골라 주세요</div><div class="ph-sw">${firsts.map(c=>`<button type="button" title="${esc(c)}" aria-label="${esc(c)}" aria-pressed="${c===cur.v[a0]}" data-f="${esc(c)}" class="${c===cur.v[a0]?'on':''}"><span style="background:${COLORS[c]||'#bbb'}"></span></button>`).join('')}</div><div class="ph-swn">${esc(cur.v[a0])}</div></div>`;
  else if(a1) h+=`<div class="ph-sec"><div class="ph-h">${esc(eul(a0))} 골라 주세요</div>${firsts.map(c=>`<button type="button" class="ph-opt ${c===cur.v[a0]?'on':''}" data-f="${esc(c)}"><b>${esc(c)}</b></button>`).join('')}</div>`;
  const list=a1?live.filter(r=>r.v[a0]===cur.v[a0]):live, ax=a1||a0;
  h+=`<div class="ph-gap"></div><div class="ph-sec"><div class="ph-h">${ax==='용량'?'필요한 용량을 선택해 주세요':`${esc(eul(ax))} 선택해 주세요`}</div>`;
  h+=list.map(r=>{ const v=a1?r.v[a1]:r.val, gb=ax==='용량'?gbOf(v):0;
    return `<button type="button" class="ph-opt ${r.id===cur.id?'on':''} ${r.sale?'':'out'}" data-id="${r.id}"><b>${esc(v)}</b><span class="ph-price">${r.price.toLocaleString()} 원${r.sale?'':' · 품절'}</span>${gb?`<small>사진 약 ${(gb*200).toLocaleString()}장을 저장할 수 있어요</small>`:''}</button>`; }).join('');
  if(!cur.sale) h+=`<div class="warn">${esc(cur.val)}는 품절이에요. 입고 알림을 신청하면 주문할 수 있을 때 알려 드려요.</div>`;
  return h+'</div>';
}
// 추천 조합 카드: 지금 고른 기기 옵션·가입 조건·슬롯 선택을 요약한다.
function comboPv(){
  const rows=[];
  if(isDev()&&M.rows){ const live=liveRows(), cur=live.find(r=>r.id===M.sel)||live[0]; if(cur) rows.push(['기기 옵션',[cur.val]]); }
  const picks=s=>{ const p=pvState(s); return [...s.sel].filter(o=>p.pick.includes(o.id)).map(o=>{ const b=p.ben[o.id]; return baseName(o)+(b?` (${b})`:''); }); };
  const plan=F.slots.find(s=>s.locked);
  if(isDev()){ const j=[`${M.join.def} / ${M.disc.def}`,...(plan?picks(plan):[])]; rows.push(['가입 옵션',j]); }
  else if(F.head) rows.push(['기본 상품',[F.head.name]]);
  const ben=F.slots.filter(s=>!s.locked).flatMap(picks); if(ben.length) rows.push([isDev()?'혜택 옵션':'구성 옵션',ben]);
  if(!rows.length) return '';
  return `<div class="ph-ai"><b>${phIc('spark')}AI 분석 사유</b><p>고객님의 이용 패턴과 가입 조건에 가장 잘 어울리는 조합이에요. 같은 조건의 다른 조합보다 혜택이 커요.</p></div>
  <div class="ph-combo">${rows.map(([k,v])=>`<div class="ph-cr"><span>${k}</span><span>${v.map(esc).join('<br>')}</span></div>`).join('')}<button type="button" class="ph-cta">이 옵션으로 바로 선택하기</button></div>`;
}
function orderPv(){
  const t=tdef(F.type), h=F.head;
  let pv=`<div class="ph-sec">${comboPv()}</div>`;
  if(h&&isDev()) pv+=devPv();
  else if(h) pv+=`<div class="ph-sec"><div class="ph-h">기본 상품</div><div class="ph-opt on"><b>${esc(h.name)}</b><small>${h.type}</small></div></div>`;
  else if(F.noBase) pv+=`<div class="ph-sec"><div class="pvempty">기준 단품 없이 아래 슬롯으로 구성. 가격은 상품에 직접 건다</div></div>`;
  else pv+=`<div class="ph-sec"><div class="pvempty">${t.base} 선택에서 고르면 여기에 보인다</div></div>`;
  F.slots.forEach((s,i)=>{ pv+=`<div class="ph-gap"></div><div class="ph-sec">${slotPv(s,i)}</div>`; });
  return pv;
}
function infoPv(){
  const d=F.media.detail;
  if(d.mode==='image'&&d.images.length) return `<div class="pv-detail">${d.images.map((u,i)=>`<img src="${u}" alt="상세 이미지 ${i+1}">`).join('')}</div>`;
  if(d.mode==='html'&&d.html.trim()) return `<iframe class="ph-html" sandbox title="상품정보 미리보기" srcdoc="${esc(`<!doctype html><meta charset="utf-8"><style>body{font:13px/1.6 system-ui,sans-serif;margin:12px;color:#20293b}img{max-width:100%}</style>${d.html}`)}"></iframe>`;
  return `<div class="ph-sec"><div class="pvempty">${d.mode==='builder'?'전시빌더로 만든 상품정보가 여기에 보인다':'상품정보를 등록하면 여기에 보인다'}</div></div>`;
}
function renderPanel(){
  const t=tdef(F.type), h=F.head;
  const title=F.name.trim()||(h?(isDev()?h.key:h.name):'상품명 미입력');
  // 상품명 아래 줄: 주요정보의 제품명, 없으면 기준 단품 이름
  const sub=F.spec.product||(h?(isDev()?h.key:h.name):'');
  const imgs=[F.media.main,...F.media.subs].filter(Boolean);
  const bdgs=F.badgeOn?BADGES.filter(b=>F.badges.includes(b.k)):[];
  if(PVTAB==='review'&&!F.reviewOn) PVTAB='order';
  const tabs=[['order','상품 주문'],['info','상품 정보'],...(F.reviewOn?[['review','구매 후기']]:[])];
  let pv=`<div class="ph-status"><b>9:41</b><span aria-hidden="true"><i class="sig"></i><i class="bat"></i></span></div>
  <div class="ph-hero"><div class="ph-nav">${phIc('back')}<span>${phIc('share')}${phIc('bag')}${phIc('menu')}</span></div>
    ${imgs.length?`<img src="${imgs[0]}" alt="대표이미지">`:`<div class="ph-noimg">${phIc('device')}<small>대표이미지를 등록하면 여기에 보인다</small></div>`}
    ${imgs.length>1?`<div class="ph-dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}</div>
  <div class="ph-info">${F.spec.model?`<div class="ph-model">${esc(F.spec.model)}</div>`:''}<div class="ph-title">${nameHtml(title)}</div>${sub&&sub!==nameText(title)?`<div class="ph-sub">${esc(sub)}</div>`:''}
    ${bdgs.length?`<div class="ph-bdgs">${bdgs.map((b,i)=>`<span class="${i?'':'dk'}">${b.label}</span>`).join('')}</div>`:''}
    <div class="ph-note">${minorNote()}</div></div>
  <div class="ph-gap"></div>
  <div class="ph-tabs" role="tablist">${tabs.map(([k,l])=>`<button type="button" role="tab" data-tab="${k}" class="${PVTAB===k?'on':''}" aria-selected="${PVTAB===k}">${l}</button>`).join('')}</div>`;
  pv+=PVTAB==='info'?infoPv():PVTAB==='review'?`<div class="ph-sec"><div class="pvempty">구매후기가 여기에 보인다</div></div>`:orderPv();
  if(F.sim.on){ const st=simText(); pv+=`<div class="ph-gap"></div><div class="ph-sec"><div class="ph-h">${esc(st.title||SIM_DEF.title)}</div>${st.sub?`<div class="ph-hs">${esc(st.sub)}</div>`:''}<div class="ph-sim"><i></i><i></i><i></i></div></div>`; }
  const box=$('#pv'); box.innerHTML=pv;
  box.querySelectorAll('.ph-tabs button').forEach(b=>b.addEventListener('click',()=>{ PVTAB=b.dataset.tab; renderPanel(); }));
  box.querySelectorAll('[data-f]').forEach(sp=>sp.addEventListener('click',()=>{ const live=liveRows(); const a0=live[0]&&live[0].name.split(' / ')[0]; const x=live.find(r=>r.v[a0]===sp.dataset.f); if(x){M.sel=x.id; renderPanel();} }));
  box.querySelectorAll('.ph-opt[data-id]').forEach(d=>d.addEventListener('click',()=>{ M.sel=d.dataset.id; renderPanel(); }));
  const cta=box.querySelector('.ph-cta'); if(cta) cta.addEventListener('click',()=>toast('주문서로 이동 (예시)'));
  bindSlotPv(box);

  const R=[]; const add=(st,tx,d)=>R.push({st,tx,d});
  add(F.name.trim()?'ok':'bad','상품명',F.name.trim()?esc(nameText(F.name)):'기본정보에서 입력하세요');
  if(!F.use) add('na','전시상태 미사용','저장은 되지만 고객 화면에 나오지 않는다');
  if(F.noBase) add(F.slots.some(s=>s.req&&s.sel.size)?'ok':'bad','기준 단품 없음 · 필수 슬롯 1개 이상','단품이 없으면 필수 슬롯이 판매 단위가 된다');
  else add(h?'ok':'bad',`${t.base} 선택`,h?esc(isDev()?h.key:h.name):`${t.base} 선택에서 고르세요`);
  if(isDev()&&h){
    if(!M.rows) add('bad','옵션목록 적용','옵션목록 적용 버튼을 누르세요');
    else if(M.dirty) add('bad','옵션목록 다시 적용','옵션값 선택이 바뀌었습니다');
    else {
      const u=M.rows.filter(r=>r.use); add(u.length?'ok':'bad','사용 옵션 1개 이상',`${M.rows.length}개 중 ${u.length}개 사용`);
      const np=u.filter(r=>!(r.price>0)).length; if(u.length) add(np?'bad':'ok','옵션 가격',np?`가격이 0원인 옵션 ${np}개`:'사용 옵션 모두 가격 있음');
      if(u.length&&!u.some(r=>r.sale)) add('na','판매 가능한 옵션 없음','사용 옵션이 모두 품절이다');
    }
  }
  if(isDev()){ const s=F.slots.find(x=>x.locked); add(s&&s.sel.size?'ok':'bad','정책 1 · 디바이스형은 요금제 슬롯 필수',s&&s.sel.size?`요금제 후보 ${s.sel.size}개`:'슬롯 1에서 요금제 후보를 고르세요'); }
  F.slots.forEach((s,i)=>{ const n=s.sel.size; if(!s.locked) add(n?'ok':'bad',`슬롯 ${i+1} 후보 1개 이상`,`${s.area} · 선택 ${n}개${s.req&&n===1?' · 자동 포함':''}`); if(n&&n<s.max) add('na',`슬롯 ${i+1} 최대 선택 ${s.max}개 > 후보 ${n}개`,`고객은 ${n}개까지만 고를 수 있다`); });
  if(F.spec.minor){ const {ageFrom:a,ageTo:b}=F.spec, bad=(a!==''&&b!==''&&+a>+b)||[a,b].some(v=>v!==''&&!(+v>=0&&+v<=18));
    add(bad?'bad':'ok','미성년자 구매 가능 나이',bad?'0~18세 사이로, 시작 나이가 끝 나이보다 크지 않게 입력하세요':`${a?a+'세':'제한 없음'} ~ ${b?b+'세':'제한 없음'}`); }
  if(F.sim.on&&F.sim.mode==='custom') add(F.sim.title.trim()?'ok':'bad','유사한 상품 타이틀',F.sim.title.trim()?esc(F.sim.title.trim()):'직접 입력을 골랐다면 타이틀을 입력하세요');
  if(F.slots.some(s=>!s.locked)) add('ok','정책 2~4 · 결합 키, 단품만, 같은 서비스 제외','해당 후보는 목록에서 회색 처리');
  const ul=$('#ruleList'); ul.innerHTML=''; R.forEach(r=>{const li=el('li'); li.innerHTML=`<span class="m ${r.st}">${r.st==='ok'?'O':r.st==='bad'?'X':'!'}</span><span class="t">${r.tx}<span class="d">${r.d}</span></span>`; ul.appendChild(li);});
  $('#poCount').innerHTML=poRange({head:h,slots:F.slots})+'<small>PO</small>';
  const bad=R.filter(r=>r.st==='bad').length;
  const sum=$('#chkSum'); sum.textContent=bad?`미통과 ${bad}`:`통과 ${R.filter(r=>r.st==='ok').length}/${R.length}`; sum.className='chip '+(bad?'bad':'ok');
  const sb=$('#bSave'); sb.disabled=bad>0; sb.textContent='저장하기'; sb.title=bad?`${bad}개 항목을 채우면 저장할 수 있습니다`:'';
}
function renderEditing(){
  const on=!!F.editId; $('#editingBar').classList.toggle('on',on);
  $('#editTitle').textContent=on?'상품수정':'상품등록';
  if(on){ const d=DISPLAYS.find(x=>x.id===F.editId); $('#editingTxt').textContent=d&&d.draft?`"${nameText(d.name)||'상품명 없음'}" 임시저장본을 이어서 작성 중. 저장하기를 누르면 목록에 등록됩니다`:`"${d?nameText(d.name):''}" 수정 중. 저장하면 목록의 같은 행이 바뀝니다`; }
}
function renderAll(){ renderInfo(); renderBase(); renderMatrix(); renderSlots(); renderMedia(); renderDetail(); renderSwitches(true); renderSpec(); renderBadges(); renderSim(); renderSeo(); renderSrch(); renderFaq(); renderLinks(); renderEditing(); }
$('#bReset').addEventListener('click',()=>{ const k=F.type, id=F.editId; if(id){ const d=DISPLAYS.find(x=>x.id===id); if(d){ loadDisplay(d); toast('저장된 값으로 되돌렸습니다'); return; } } resetForm(); if(k!=='device') setType(k); else renderAll(); });
$('#editCancel').addEventListener('click',()=>{ resetForm(); renderAll(); history.replaceState(null,'',location.pathname); });

// ---------- 저장 ----------
const DISPLAYS=loadDisplays();
function snapshot(){
  return {id:F.editId||'D'+Date.now(),draft:false,media:copyMedia(F.media),noticeOn:F.noticeOn,reviewOn:F.reviewOn,badgeOn:F.badgeOn,seoOn:F.seoOn,spec:{...F.spec},badges:[...F.badges],sim:{...F.sim},seo:{...F.seo,tags:[...F.seo.tags]},srch:{...F.srch,kws:F.srch.kws.map(x=>x.trim()).filter(Boolean)},faq:{on:F.faq.on,items:faqItems()},links:{...F.links},name:F.name.trim(),type:F.type,ch:F.ch,cat:F.cat,from:F.from,to:F.to,show:F.show,use:F.use,head:F.head,noBase:F.noBase,
    slots:F.slots.map(s=>({req:s.req,area:s.area,ptypes:[...s.ptypes],max:s.max,locked:s.locked,sel:ordered(s),best:[...s.best],def:s.def,more:s.more,grp:s.grp})),
    dev:isDev()?{soldout:M.soldout,ax:M.ax?Object.fromEntries(Object.entries(M.ax).map(([k,s])=>[k,splitVals(s)])):null,rows:M.rows?M.rows.map(r=>Object.assign({},r)):null,dirty:M.dirty,join:{allow:[...M.join.allow],def:M.join.def},disc:{allow:[...M.disc.allow],def:M.disc.def}}:null,updated:TODAY};
}
// 목록에 넣거나 같은 id의 행을 바꾼다. 저장소에 못 쓰면 되돌리고 null.
function store(d){
  const idx=DISPLAYS.findIndex(x=>x.id===d.id), prev=DISPLAYS[idx];
  if(idx>=0) DISPLAYS[idx]=d; else DISPLAYS.unshift(d);
  if(saveDisplays(DISPLAYS)) return idx>=0&&!prev.draft?'edit':'new';
  if(idx>=0) DISPLAYS[idx]=prev; else DISPLAYS.shift();
  toast('브라우저 저장소에 쓰지 못했습니다. 이미지 수를 줄이거나 사이트 데이터 설정을 확인하세요');
  return null;
}
// 저장하기: 검사를 통과해야 한다. 저장하면 목록 페이지로 이동해 저장한 행을 강조한다.
$('#bSave').addEventListener('click',()=>{
  const d=snapshot(), mode=store(d); if(!mode) return;
  location.href=`product-list.html?saved=${encodeURIComponent(d.id)}&mode=${mode}`;
});
// 임시저장: 검사 없이 지금 상태를 목록에 '임시저장'으로 남기고, 이 화면에서 계속 작성한다.
$('#bDraft').addEventListener('click',()=>{
  const d=Object.assign(snapshot(),{draft:true}); if(!store(d)) return;
  F.editId=d.id; history.replaceState(null,'',`?edit=${encodeURIComponent(d.id)}`); renderEditing(); renderPanel();
  toast('임시저장했습니다. 상품목록에서 이어서 작성할 수 있습니다');
});
function loadDisplay(d){
  Object.assign(F,{editId:d.id,name:d.name,type:d.type,ch:d.ch,cat:d.cat,catAuto:false,from:d.from,to:d.to,show:d.show,use:d.use!==false,head:d.head,noBase:d.noBase,hq:'',media:d.media?copyMedia(d.media):emptyMedia(),noticeOn:!!d.noticeOn,reviewOn:!!d.reviewOn,badgeOn:d.badgeOn!=null?!!d.badgeOn:!!(d.badges&&d.badges.length),seoOn:d.seoOn!=null?!!d.seoOn:!!(d.seo&&(d.seo.tags.length||d.seo.title||d.seo.desc)),spec:{...emptySpec(),...d.spec},badges:(d.badges||[]).filter(k=>BADGES.some(b=>b.k===k)),sim:{...emptySim(),...d.sim},seo:{...emptySeo(),...d.seo,tags:[...((d.seo&&d.seo.tags)||[])]},srch:d.srch?{...emptySrch(),...d.srch,kws:d.srch.kws&&d.srch.kws.length?[...d.srch.kws]:['']}:emptySrch(),faq:d.faq&&d.faq.items&&d.faq.items.length?{on:!!d.faq.on,items:d.faq.items.map(x=>({...x}))}:{...emptyFaq(),on:!!(d.faq&&d.faq.on)},links:{order:false,pay:false,...d.links},
    slots:d.slots.map(s=>newSlot({req:s.req,area:s.area,ptypes:new Set(s.ptypes||(s.ptype?[s.ptype]:[])),max:s.max,locked:s.locked,sel:new Set(s.sel),order:[...s.sel],best:new Set(s.best||[]),def:s.def||null,more:s.more||3,grp:s.grp!==false}))});
  resetM();
  if(d.dev){
    Object.assign(M,{soldout:'show',ax:d.dev.ax?Object.fromEntries(Object.entries(d.dev.ax).map(([k,v])=>[k,Array.isArray(v)?v.join(","):String(v)])):null,rows:d.dev.rows?d.dev.rows.map(r=>Object.assign({},r)):null,dirty:!!d.dev.dirty,join:{allow:new Set(d.dev.join.allow),def:d.dev.join.def},disc:{allow:new Set(d.dev.disc.allow),def:d.dev.disc.def}});
    // 예시 데이터처럼 옵션목록이 없으면 전체 옵션으로 채우고 EPC를 자동 연결한다.
    if(!M.rows&&d.head){ initAx(); applyOpt(true); M.rows.forEach(r=>{ const i=ITEM_BY_ID.get(r.id); if(i) r.epc=epcOf(i); }); }
  }
  renderAll();
}

// ---------- 시작 ----------
resetForm(); renderAll();
// 목록에서 수정을 누르면 ?edit=<id>로 열린다.
const editId=new URLSearchParams(location.search).get('edit');
const editTarget=editId&&DISPLAYS.find(d=>d.id===editId);
if(editTarget) loadDisplay(editTarget);
else if(editId) toast('수정할 상품을 찾지 못했습니다. 새로 만들기로 열었습니다');
