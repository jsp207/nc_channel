// @ts-nocheck
// 상품등록: ref/product-admin-prototype-v4-2.html의 상품전시 등록 화면. 목록은 product-list.ts
// 상품 = 기본정보 + 기준 단품(디바이스형은 옵션목록·EPC 매칭) + 슬롯 0~N개. 섹션은 헤더를 눌러 접고 펼친다.
import "./style.css";
import { requireAuthentication } from "./auth";
import { POLICY, AREAS, ITEMS, ITEM_BY_ID, $, el, esc, toast, joinKey, variants, TODAY, TYPES, tdef, CHANNELS, CATS, catOf, poRange, loadDisplays, saveDisplays } from "./product-display-store";

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
function newSlot(o){ return Object.assign({id:++SEQ,req:true,area:'부가서비스',ptype:'',max:1,sel:new Set(),locked:false,q:'',only:false,closed:false},o||{}); }
const planSlot=()=>newSlot({req:true,area:'이동전화',ptype:'요금제형',max:1,locked:true});
function resetForm(){ Object.assign(F,{editId:null,name:'',type:'device',ch:'T다이렉트샵',cat:'',catAuto:true,from:'',to:'',show:true,use:true,head:null,noBase:false,hq:'',slots:[planSlot()],media:emptyMedia(),noticeOn:true}); resetM(); }
// 이미지·상세설명. 이미지는 줄인 data URL로 들고 있다가 상품과 함께 저장한다.
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
  CHANNELS.forEach(c=>$('#fCh').appendChild(new Option(c,c)));
  $('#fName').addEventListener('input',e=>{F.name=e.target.value; renderPanel();});
  $('#fCh').addEventListener('change',e=>{ F.ch=e.target.value; if(!F.catAuto&&!catOf(F.ch,F.cat)) F.cat=''; autoCat(); renderInfo(); renderPanel(); });
  $('#fCat').addEventListener('change',e=>{ F.cat=e.target.value; F.catAuto=false; renderInfo(); renderPanel(); });
  $('#showSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{F.show=b.dataset.t==='1'; renderInfo(); renderPanel();}));
  $('#useSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{F.use=b.dataset.t==='1'; renderInfo(); renderPanel();}));
})();
function setType(k){
  const t=tdef(k); F.type=k; F.ch=t.ch; F.head=null; F.noBase=false; F.hq=''; F.catAuto=true; F.cat='';
  F.slots = k==='device'?[planSlot()]:[]; resetM();
  renderAll(); toast(`${t.label}으로 바꿨습니다. ${t.base} 선택과 슬롯을 비웠습니다`);
}
function autoCat(){ if(!F.catAuto) return; const h=F.head; const c=h?CATS.find(c=>c.ch===F.ch&&c.cond(h)):null; F.cat=c?c.name:''; }
function renderInfo(){
  $('#typeSeg').querySelectorAll('button').forEach(b=>{ const on=b.dataset.t===F.type; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
  $('#fName').value=F.name; $('#fCh').value=F.ch;
  $('#showSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(b.dataset.t==='1')===F.show));
  $('#useSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(b.dataset.t==='1')===F.use));
  const s=$('#fCat'); s.innerHTML=''; s.appendChild(new Option('카테고리 선택',''));
  CATS.filter(c=>c.ch===F.ch).forEach(c=>s.appendChild(new Option(c.name,c.name))); s.value=F.cat;
  const hint=$('#catHint');
  if(F.catAuto){ hint.textContent = F.cat?'기준 단품 조건으로 자동 지정':(F.head||F.noBase?'이 채널에 맞는 자동 카테고리 없음. 직접 고르세요':''); }
  else { hint.innerHTML='직접 지정 <button type="button" class="btn sm" id="catAutoBtn">자동으로 되돌리기</button>'; $('#catAutoBtn').addEventListener('click',()=>{F.catAuto=true; autoCat(); renderInfo(); renderPanel();}); }
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
  $('#hCnt').textContent=`${rows.length}개${rows.length>200?' 중 200개 표시. 검색으로 좁히세요':''}`;
}
function renderHeadInfo(){
  const h=F.head, box=$('#hInfo');
  if(!h){ box.textContent='목록에서 1개를 고르세요'; return; }
  box.innerHTML = isDev()
    ? `선택: <b>${esc(h.key)}</b> · ${variants(h).length}종 · 결합 키 <span class="chip">${joinKey(h)}</span> · <span class="tag bad">단독 주문 불가</span> 정책 1로 슬롯 1 요금제 고정`
    : `선택: <b>${esc(h.name)}</b> · ${h.type} · 결합 키 <span class="chip">${joinKey(h)}</span>`;
}
function pickHead(i){
  F.head=i; Object.assign(M,{ax:null,rows:null,dirty:false,rowSel:new Set(),sel:null}); autoCat(); pruneSlots();
  drawHeadList(); renderHeadInfo(); renderInfo(); renderMatrix(); renderSlots();
}
$('#hQ').addEventListener('input',e=>{F.hq=e.target.value; drawHeadList();});
$('#noBase').addEventListener('change',e=>{ F.noBase=e.target.checked; F.head=null; pruneSlots(); autoCat(); renderInfo(); renderBase(); renderSlots(); });

// ---------- 디바이스 옵션 ----------
function renderCond(){
  const mk=(box,list,st)=>{ box.innerHTML=''; list.forEach(([k])=>{
    const on=st.allow.has(k); const l=el('label','chip '+(on?(st.def===k?'acc':''):'no')); l.title='더블클릭하면 기본값';
    l.innerHTML=`<input type="checkbox" ${on?'checked':''}> ${k}${st.def===k?' · 기본':''}`;
    l.querySelector('input').addEventListener('change',e=>{ e.target.checked?st.allow.add(k):st.allow.delete(k); if(!st.allow.has(st.def)) st.def=[...st.allow][0]||null; renderMatrix(); });
    l.addEventListener('dblclick',()=>{ if(st.allow.has(k)){ st.def=k; renderMatrix(); } });
    box.appendChild(l); }); };
  mk($('#joinOpts'),JOIN,M.join); mk($('#discOpts'),DISC,M.disc);
}
const devParts=()=>F.head?variants(F.head).map(i=>({i,p:skuParts(i)})).filter(x=>x.p):[];
function devAxes(){
  const parts=devParts();
  if(parts.length){ const axes=parts[0].p.a; return {axes,rows:parts.filter(x=>x.p.a.join()===axes.join()).map(x=>({i:x.i,v:x.p.v}))}; }
  return {axes:['모델'],rows:(F.head?variants(F.head):[]).map(i=>({i,v:{'모델':i.name}}))};
}
function initAx(){ const {axes,rows}=devAxes(); M.ax={}; axes.forEach(k=>M.ax[k]=new Set(rows.map(r=>r.v[k]))); }
const dot=(k,v)=>k==='색상'?`<span class="dot" style="background:${COLORS[v]||'#bbb'}"></span>`:'';
function renderMatrix(){
  const h=F.head;
  if(!isDev()||!h){ $('#devBox').hidden=true; renderPanel(); return; }
  $('#devBox').hidden=false; renderCond();
  if(!M.ax) initAx();
  const {axes,rows}=devAxes();
  const box=$('#axBox'); box.innerHTML='';
  axes.forEach(k=>{
    const vals=[...new Set(rows.map(r=>r.v[k]))]; const on=M.ax[k];
    const row=el('div','row'); row.innerHTML=`<label>${k}</label><span class="optv">${vals.map(v=>`<label class="chip ${on.has(v)?'acc':''}"><input type="checkbox" data-v="${esc(v)}" ${on.has(v)?'checked':''}>${dot(k,v)}${esc(v)}</label>`).join('')}</span><span class="pill">${on.size}/${vals.length} 선택</span><button type="button" class="btn sm">${on.size===vals.length?'모두 해제':'모두 선택'}</button>`;
    row.querySelectorAll('input').forEach(cb=>cb.addEventListener('change',()=>{ cb.checked?on.add(cb.dataset.v):on.delete(cb.dataset.v); M.dirty=M.rows!=null; renderMatrix(); }));
    row.querySelector('button').addEventListener('click',()=>{ if(on.size===vals.length) on.clear(); else vals.forEach(v=>on.add(v)); M.dirty=M.rows!=null; renderMatrix(); });
    box.appendChild(row);
  });
  const hit=rows.filter(r=>axes.every(k=>M.ax[k].has(r.v[k]))).length;
  const combos=axes.reduce((n,k)=>n*M.ax[k].size,1);
  const hint=$('#applyHint');
  hint.className='pill'+(M.dirty?' dirty':'');
  hint.textContent = !hit ? `${axes.join('·')}을 1개 이상 고르세요`
    : `${hit}개 옵션을 만든다${combos>hit?` (EPC에 없는 조합 ${combos-hit}개 제외)`:''}${M.dirty?'. 선택이 바뀌었습니다. 다시 적용하세요':(M.rows?'. 적용됨':'')}`;
  $('#applyOpt').disabled=!hit;
  drawOpt(); renderPanel();
}
function applyOpt(silent){
  const {axes,rows}=devAxes(); const prev=new Map((M.rows||[]).map(r=>[r.id,r]));
  M.rows=rows.filter(r=>axes.every(k=>M.ax[k].has(r.v[k]))).map(r=>prev.get(r.i.id)||{id:r.i.id,name:axes.join(' / '),val:axes.map(k=>r.v[k]).join(' / '),v:r.v,use:true,price:skuPrice(r.i),sale:!skuOut(r.i),epc:null});
  M.dirty=false; M.rowSel=new Set(); M.sel=null;
  if(!silent){ renderMatrix(); toast(`옵션 ${M.rows.length}개를 옵션목록에 적용했습니다`); }
}
$('#applyOpt').addEventListener('click',()=>applyOpt());
function drawOpt(){
  const tb=$('#optTable tbody'); tb.innerHTML=''; const rows=M.rows||[];
  rows.forEach(r=>{
    const tr=el('tr',r.use?'':'unused'); const k0=r.name.split(' / ');
    tr.innerHTML=`<td class="c"><input type="checkbox" class="rs" ${M.rowSel.has(r.id)?'checked':''} aria-label="${esc(r.val)} 선택"></td><td>${esc(r.name)}</td><td><span style="display:inline-flex;gap:6px;align-items:center">${k0[0]==='색상'?dot('색상',r.v['색상']):''}${esc(r.val)}</span></td>
      <td><span class="seg"><button type="button" data-u="1" class="${r.use?'on':''}">사용</button><button type="button" data-u="0" class="${r.use?'':'on'}">미사용</button></span></td>
      <td><input type="number" class="price" min="0" step="1000" value="${r.price}" aria-label="${esc(r.val)} 가격"> 원</td>
      <td><span class="chip ${r.sale?'ok':'warn'}">${r.sale?'판매중':'품절'}</span></td>
      <td>${epcCell(r)}</td>
      <td><button type="button" class="btn sm del">삭제</button></td>`;
    const ev=tr.querySelector('.ev'); if(ev) ev.addEventListener('click',()=>openEpcView(r.id));
    const ee=tr.querySelector('.ee'); if(ee) ee.addEventListener('click',()=>openEpcMatch([r.id]));
    const ed=tr.querySelector('.ed'); if(ed) ed.addEventListener('click',()=>{ if(!confirm(`${r.val}의 EPC 연동을 해제할까요?`)) return; r.epc=null; drawOpt(); renderPanel(); toast(`${r.val} EPC 연동을 해제했습니다`); });
    tr.querySelector('.rs').addEventListener('change',e=>{ e.target.checked?M.rowSel.add(r.id):M.rowSel.delete(r.id); drawOpt(); });
    tr.querySelectorAll('.seg button').forEach(bt=>bt.addEventListener('click',()=>{ r.use=bt.dataset.u==='1'; drawOpt(); renderPanel(); }));
    tr.querySelector('.price').addEventListener('change',e=>{ r.price=Math.max(0,parseInt(e.target.value)||0); e.target.value=r.price; renderPanel(); });
    tr.querySelector('.del').addEventListener('click',()=>{ M.rows=M.rows.filter(x=>x!==r); M.rowSel.delete(r.id); drawOpt(); renderPanel(); toast(`${r.val} 옵션을 삭제했습니다. 다시 적용하면 복구됩니다`); });
    tb.appendChild(tr);
  });
  if(!M.rows) tb.innerHTML='<tr><td colspan="8" style="color:var(--muted)">위에서 옵션값을 고르고 옵션목록 적용을 누르면 여기에 나온다</td></tr>';
  else if(!rows.length) tb.innerHTML='<tr><td colspan="8" style="color:var(--muted)">옵션이 모두 삭제됐습니다. 옵션목록 적용을 다시 누르세요</td></tr>';
  const all=$('#optAll'); const n=rows.filter(r=>M.rowSel.has(r.id)).length;
  all.checked=rows.length>0&&n===rows.length; all.indeterminate=n>0&&n<rows.length; all.disabled=!rows.length;
  $('#optCnt').textContent=M.rows?`${rows.length}개 · 사용 ${rows.filter(r=>r.use).length}개`:'';
  $('#optBar').hidden=!M.rows; $('#optBulk').hidden=!n; $('#optBulk').style.display=n?'inline-flex':'';
  const lk=rows.filter(r=>r.epc).length, mm=rows.filter(r=>r.epc&&epcCheck(r).st!=='ok').length;
  $('#epcSum').textContent=M.rows?`EPC 연동 ${lk}/${rows.length}${mm?` · 불일치 ${mm}`:''}`:''; $('#optSelTxt').textContent=`선택 ${n}개`;
}
$('#optAll').addEventListener('change',e=>{ (M.rows||[]).forEach(r=>e.target.checked?M.rowSel.add(r.id):M.rowSel.delete(r.id)); drawOpt(); });
$('#optBulk').querySelectorAll('button').forEach(bt=>bt.addEventListener('click',()=>{
  const act=bt.dataset.a, n=M.rowSel.size;
  if(act==='del'){ M.rows=M.rows.filter(r=>!M.rowSel.has(r.id)); toast(`옵션 ${n}개를 삭제했습니다`); }
  else { M.rows.forEach(r=>{ if(M.rowSel.has(r.id)) r.use=act==='on'; }); toast(`옵션 ${n}개를 ${act==='on'?'사용':'미사용'}으로 바꿨습니다`); }
  M.rowSel=new Set(); drawOpt(); renderPanel();
}));
function syncSoSeg(){ $('#soSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===M.soldout)); }
$('#soSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ M.soldout=b.dataset.t; syncSoSeg(); renderMatrix(); }));

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
  if(!r.epc) return `<div class="epcc"><span><span class="chip">미연동</span></span><div class="acts"><button type="button" class="btn sm ee">연결</button></div></div>`;
  const c=epcCheck(r);
  return `<div class="epcc"><span><button type="button" class="linkbtn ev" title="EPC 상품 조회">${r.epc.code}</button> <span class="chip ${c.st==='ok'?'ok':'bad2'}">${c.t}</span></span><small>${esc(r.epc.name)}</small><div class="acts"><button type="button" class="btn sm ee">수정</button><button type="button" class="btn sm ed">삭제</button></div></div>`;
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
function candidates(si){
  const h=F.head, s=F.slots[si];
  const others=F.slots.filter((x,i)=>i!==si).flatMap(x=>[...x.sel]);
  return ITEMS.filter(i=>i.area===s.area&&(!s.locked||i.type==='요금제형')).map(o=>{
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
function slotDesc(s){ return s.locked?'디바이스형 고정: 요금제 필수 1개':(s.req?`반드시 ${s.max>1?'1~'+s.max:'1'}개 선택`:`건너뛸 수 있음 · 최대 ${s.max}개`); }
function renderSlots(){
  const box=$('#slots'); box.innerHTML='';
  F.slots.forEach((s,i)=>{
    const st=el('div','step'+(s.closed?' closed':'')); st.dataset.sid=s.id;
    const types=POLICY.filter(p=>p.area===s.area&&(!s.locked||p.type==='요금제형'));
    st.innerHTML=`<header><b>슬롯 ${i+1}</b><span class="chip ${s.req?'acc':''}">${s.req?'필수':'선택'}</span><span class="why">${slotDesc(s)}</span>${s.locked?'':'<button type="button" class="btn sm del">삭제</button>'}${foldBtn(s.closed)}</header>
    <div class="body">
      <div class="row"><label>유형</label><span class="seg"><button type="button" data-t="1" class="${s.req?'on':''}" ${s.locked?'disabled':''}>필수</button><button type="button" data-t="0" class="${s.req?'':'on'}" ${s.locked?'disabled':''}>선택</button></span>
        <label>영역</label><select class="sArea" ${s.locked?'disabled':''} aria-label="영역"></select>
        <label>최대 선택</label><input class="num sMax" type="number" min="1" value="${s.max}" ${s.locked?'disabled':''} aria-label="최대 선택 수"></div>
      <div class="row"><label>후보</label><select class="sType" aria-label="상품유형"><option value="">상품유형 전체</option>${types.map(p=>`<option ${s.ptype===p.type?'selected':''}>${p.type}</option>`).join('')}</select>
        <input type="text" class="q" placeholder="상품명 검색" value="${esc(s.q)}" style="min-width:180px" aria-label="후보 상품명 검색">
        <label class="chkl"><input type="checkbox" class="only" ${s.only?'checked':''}> 선택한 것만</label><span class="pill cnt"></span></div>
      <div class="cl"><table><thead><tr><th class="c"><input type="checkbox" class="all" aria-label="보이는 후보 전체 선택"></th><th>상품명</th><th>상품유형</th><th>결합 키</th><th>비고</th></tr></thead><tbody></tbody></table></div>
    </div>`;
    const sa=st.querySelector('.sArea'); AREAS.forEach(a=>sa.appendChild(new Option(a,a))); sa.value=s.area;
    sa.addEventListener('change',()=>{ s.area=sa.value; s.ptype=''; s.sel.clear(); renderSlots(); });
    st.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ if(b.disabled) return; s.req=b.dataset.t==='1'; renderSlots(); }));
    st.querySelector('.sMax').addEventListener('change',e=>{ s.max=Math.max(1,parseInt(e.target.value)||1); renderSlots(); });
    st.querySelector('.sType').addEventListener('change',e=>{ s.ptype=e.target.value; drawSlot(i); });
    st.querySelector('.q').addEventListener('input',e=>{ s.q=e.target.value; drawSlot(i); });
    st.querySelector('.only').addEventListener('change',e=>{ s.only=e.target.checked; drawSlot(i); });
    st.querySelector('.all').addEventListener('change',e=>{ const list=slotList(i).filter(x=>!x.off); list.forEach(({o})=>e.target.checked?s.sel.add(o):s.sel.delete(o)); afterPick(); });
    const del=st.querySelector('.del'); if(del) del.addEventListener('click',()=>{ F.slots.splice(i,1); renderSlots(); toast(`슬롯 ${i+1}을 삭제했습니다`); });
    box.appendChild(st);
  });
  F.slots.forEach((s,i)=>drawSlot(i));
  renderPanel();
}
function slotList(i){ const s=F.slots[i]; return candidates(i).filter(({o})=>(!s.ptype||o.type===s.ptype)&&(!s.q.trim()||o.name.includes(s.q.trim()))&&(!s.only||s.sel.has(o))); }
function drawSlot(i){
  const s=F.slots[i]; const st=document.querySelector(`[data-sid="${s.id}"]`); if(!st) return;
  const tb=st.querySelector('tbody'); tb.innerHTML='';
  const list=slotList(i); const shown=list.slice(0,600);
  shown.forEach(({o,off})=>{
    const on=s.sel.has(o); const tr=el('tr',(off?'off ':'')+(on?'on':''));
    tr.innerHTML=`<td class="c"><input type="checkbox" data-id="${o.id}" ${on?'checked':''} ${off?'disabled':''} aria-label="${esc(o.name)}"></td><td>${esc(o.name)}</td><td>${o.type}</td><td><span class="chip">${joinKey(o)}</span></td><td class="r">${off}</td>`;
    const cb=tr.querySelector('input');
    cb.addEventListener('change',()=>{ cb.checked?s.sel.add(o):s.sel.delete(o); afterPick(o.id,s.id); });
    tr.addEventListener('click',e=>{ if(e.target.tagName!=='INPUT'&&!off) cb.click(); });
    tb.appendChild(tr);
  });
  if(!list.length) tb.innerHTML=`<tr><td colspan="5" style="color:var(--muted)">${s.only?'아직 선택한 후보가 없습니다':'조건에 맞는 후보가 없습니다. 상품유형이나 검색어를 바꿔 보세요'}</td></tr>`;
  const en=list.filter(x=>!x.off); const n=en.filter(x=>s.sel.has(x.o)).length; const all=st.querySelector('.all');
  all.checked=en.length>0&&n===en.length; all.indeterminate=n>0&&n<en.length; all.disabled=!en.length;
  st.querySelector('.cnt').textContent=`후보 ${list.length}개${list.length>600?' 중 600개 표시':''} · 선택 ${s.sel.size}개`;
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

// ---------- 상세설명 ----------
const MAX_DETAIL=20;
function renderDetail(){
  const d=F.media.detail;
  $('#detailMode').querySelectorAll('button').forEach(b=>{ const on=b.dataset.m===d.mode; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
  $('#detailImage').hidden=d.mode!=='image'; $('#detailHtml').hidden=d.mode!=='html'; $('#detailBuilder').hidden=d.mode!=='builder';
  $('#detailImgs').innerHTML=d.images.map((u,i)=>thumb(u,i,`상세 이미지 ${i+1}`)).join('')+(d.images.length<MAX_DETAIL?addTile('detailImgAdd',d.images.length?'이미지 추가':'상세 이미지 업로드 (세로로 이어 붙음)',d.images.length?'':'full'):'');
  const add=$('#detailImgAdd'); if(add) add.addEventListener('click',()=>$('#detailImgFile').click());
  $('#detailImgs').querySelectorAll('.x').forEach(b=>b.addEventListener('click',()=>{ d.images.splice(+b.dataset.i,1); renderDetail(); }));
  $('#detailHtmlInput').value=d.html;
}
$('#detailMode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ F.media.detail.mode=b.dataset.m; renderDetail(); }));
$('#detailImgFile').addEventListener('change',async e=>{ const d=F.media.detail; const us=await readImages(e.target.files,860,4000,MAX_DETAIL-d.images.length); e.target.value=''; if(us.length){ d.images.push(...us); renderDetail(); } });
$('#detailHtmlInput').addEventListener('input',e=>{ F.media.detail.html=e.target.value; });
// 미리보기는 sandbox iframe이라 입력한 HTML의 스크립트는 실행되지 않는다.
$('#htmlView').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  const pv=b.dataset.v==='preview'; $('#htmlView').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  $('#detailHtmlInput').hidden=pv; $('#detailHtmlPreview').hidden=!pv;
  if(pv) $('#detailHtmlPreview').srcdoc=`<!doctype html><meta charset="utf-8"><style>body{font:14px/1.6 system-ui,sans-serif;margin:12px;color:#20293b}img{max-width:100%}</style>${F.media.detail.html||'<p style="color:#888">입력한 HTML이 없습니다</p>'}`;
}));
// ---------- 유의사항 ----------
// 사용 여부만 저장한다. 내용 입력은 추후 추가 예정.
function renderNotice(){ $('#noticeOn').checked=F.noticeOn; $('#noticeStep').classList.toggle('off',!F.noticeOn); }
$('#noticeOn').addEventListener('change',e=>{ F.noticeOn=e.target.checked; renderNotice(); });
$('#openBuilder').addEventListener('click',()=>toast('전시빌더는 아직 연결되지 않았습니다. 연결되면 이 버튼으로 열립니다'));

// ---------- 미리보기 · 검사 ----------
function condPv(){
  return `<div class="lbl"><span>가입 유형</span></div>${JOIN.filter(([k])=>M.join.allow.has(k)).map(([k,d])=>`<div class="cap ${M.join.def===k?'on':''}"><span>${d} (${k})</span></div>`).join('')}
   <div class="lbl"><span>할인 방법</span></div>${DISC.filter(([k])=>M.disc.allow.has(k)).map(([k,d])=>`<div class="cap ${M.disc.def===k?'on':''}"><span>${k}</span><span>${d}</span></div>`).join('')}`;
}
const liveRows=()=>(M.rows||[]).filter(r=>r.use&&(r.sale||M.soldout==='show'));
function devPv(){
  if(!M.rows) return `<div class="pvempty">옵션목록을 적용하면 고객이 고르는 옵션이 여기에 보인다</div>`+condPv();
  const live=liveRows();
  if(!live.length) return `<div class="pvempty">고객에게 보일 옵션이 없다. 옵션목록에서 사용으로 바꾸세요</div>`+condPv();
  const axes=live[0].name.split(' / '), a0=axes[0], a1=axes[1];
  const cur=live.find(r=>r.id===M.sel)||live[0];
  const firsts=[...new Set(live.map(r=>r.v[a0]))];
  let h=`<div class="pill">${esc(cur.val)} · ${cur.price.toLocaleString()}원</div><div class="lbl"><span>${a0}</span><span>${esc(cur.v[a0])}</span></div>`;
  if(a0==='색상') h+=`<div class="sw">${firsts.map(c=>`<button type="button" title="${esc(c)}" aria-label="${esc(c)}" data-f="${esc(c)}" class="${c===cur.v[a0]?'on':''}" style="background:${COLORS[c]||'#bbb'}"></button>`).join('')}</div>`;
  else if(a1) h+=firsts.map(c=>`<div class="cap ${c===cur.v[a0]?'on':''}" data-f="${esc(c)}"><span>${esc(c)}</span></div>`).join('');
  const list=a1?live.filter(r=>r.v[a0]===cur.v[a0]):live;
  if(a1) h+=`<div class="lbl"><span>${a1}</span></div>`;
  h+=list.map(r=>`<div class="cap ${r.id===cur.id?'on':''} ${r.sale?'':'out'}" data-id="${r.id}"><span>${esc(a1?r.v[a1]:r.val)}</span><span>${r.price.toLocaleString()}원${r.sale?'':' · 품절'}</span></div>`).join('');
  if(!cur.sale) h+=`<div class="warn">${esc(cur.val)}는 품절이에요. 입고 알림을 신청하면 주문할 수 있을 때 알려 드려요.</div>`;
  return h+condPv();
}
function renderPanel(){
  const t=tdef(F.type), h=F.head;
  const title=F.name.trim()||(h?(isDev()?h.key:h.name):'상품명 미입력');
  let pv=`<h4>${esc(title)}</h4><div class="pill">${F.ch} · ${F.cat||'카테고리 미지정'} · ${t.label}${F.show?'':' · 미노출'}${F.use?'':' · 미사용'}</div>`;
  if(F.media.main) pv+=`<img class="pv-img" src="${F.media.main}" alt="대표이미지">`;
  if(F.media.subs.length) pv+=`<div class="pv-subs">${F.media.subs.map((u,i)=>`<img src="${u}" alt="추가이미지 ${i+1}">`).join('')}</div>`;
  if(h&&isDev()) pv+=devPv();
  else if(h) pv+=`<div class="lbl"><span>기본 상품</span></div><div class="cap on"><span>${esc(h.name)}</span><span>${h.type}</span></div>`;
  else if(F.noBase) pv+=`<div class="lbl"><span>구성</span></div><div class="pvempty">기준 단품 없이 아래 슬롯으로 구성. 가격은 상품에 직접 건다</div>`;
  else pv+=`<div class="lbl"><span>기본 상품</span></div><div class="pvempty">${t.base} 선택에서 고르면 여기에 보인다</div>`;
  F.slots.forEach((s,i)=>{
    const sel=[...s.sel]; const auto=s.req&&sel.length===1;
    const lab=s.locked?'요금제 · 필수 1개':`${s.area} · ${s.req?'필수':'선택'} ${auto?'(자동 포함)':'최대 '+(sel.length?Math.min(s.max,sel.length):s.max)+'개'}`;
    pv+=`<div class="lbl"><span>슬롯 ${i+1}</span><span>${lab}</span></div>`;
    if(!sel.length) pv+=`<div class="pvempty">후보를 고르면 여기에 보인다</div>`;
    else { sel.slice(0,4).forEach((o,j)=>pv+=`<div class="cap ${s.req&&j===0?'on':''}"><span>${esc(o.name)}</span><span>${o.type}</span></div>`); if(sel.length>4) pv+=`<div class="more">외 ${sel.length-4}개 더</div>`; }
    if(!s.req&&sel.length) pv+=`<div class="more">선택하지 않고 넘어갈 수 있음</div>`;
  });
  const box=$('#pv'); box.innerHTML=pv;
  box.querySelectorAll('[data-f]').forEach(sp=>sp.addEventListener('click',()=>{ const live=liveRows(); const a0=live[0]&&live[0].name.split(' / ')[0]; const x=live.find(r=>r.v[a0]===sp.dataset.f); if(x){M.sel=x.id; renderPanel();} }));
  box.querySelectorAll('.cap[data-id]').forEach(d=>d.addEventListener('click',()=>{ M.sel=d.dataset.id; renderPanel(); }));

  const R=[]; const add=(st,tx,d)=>R.push({st,tx,d});
  add(F.name.trim()?'ok':'bad','상품명',F.name.trim()?esc(F.name.trim()):'기본정보에서 입력하세요');
  add(F.cat?'ok':'bad','카테고리',F.cat?`${F.ch} > ${F.cat}`:'기본정보에서 고르세요');
  if(F.cat&&h){ const c=catOf(F.ch,F.cat); if(c&&!c.cond(h)) add('na','카테고리 조건 불일치',`${F.cat} 조건은 ${c.desc}. 저장은 된다`); }
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
      const nl=u.filter(r=>!r.epc).length, mm=u.filter(r=>r.epc&&epcCheck(r).st!=='ok').length;
      if(u.length) add(nl||mm?'na':'ok','EPC 연동',nl||mm?`사용 옵션 중 미연동 ${nl}개, 불일치 ${mm}개`:'사용 옵션 모두 EPC 일치');
    }
    add(M.join.allow.size&&M.disc.allow.size?'ok':'bad','가입 유형 · 할인 방법',`${[...M.join.allow].join(', ')||'없음'} / ${[...M.disc.allow].join(', ')||'없음'}`);
  }
  if(isDev()){ const s=F.slots.find(x=>x.locked); add(s&&s.sel.size?'ok':'bad','정책 1 · 디바이스형은 요금제 슬롯 필수',s&&s.sel.size?`요금제 후보 ${s.sel.size}개`:'슬롯 1에서 요금제 후보를 고르세요'); }
  F.slots.forEach((s,i)=>{ const n=s.sel.size; if(!s.locked) add(n?'ok':'bad',`슬롯 ${i+1} 후보 1개 이상`,`${s.area} · 선택 ${n}개${s.req&&n===1?' · 자동 포함':''}`); if(n&&n<s.max) add('na',`슬롯 ${i+1} 최대 선택 ${s.max}개 > 후보 ${n}개`,`고객은 ${n}개까지만 고를 수 있다`); });
  add('ok','정책 2~4 · 결합 키, 단품만, 같은 서비스 제외','해당 후보는 목록에서 회색 처리');
  const ul=$('#ruleList'); ul.innerHTML=''; R.forEach(r=>{const li=el('li'); li.innerHTML=`<span class="m ${r.st}">${r.st==='ok'?'O':r.st==='bad'?'X':'!'}</span><span class="t">${r.tx}<span class="d">${r.d}</span></span>`; ul.appendChild(li);});
  $('#poCount').innerHTML=poRange({head:h,slots:F.slots})+'<small>PO</small>';
  const bad=R.filter(r=>r.st==='bad').length;
  const sb=$('#bSave'); sb.disabled=bad>0; sb.textContent='저장하기'; sb.title=bad?`${bad}개 항목을 채우면 저장할 수 있습니다`:'';
}
function renderEditing(){
  const on=!!F.editId; $('#editingBar').classList.toggle('on',on);
  $('#editTitle').textContent=on?'상품수정':'상품등록';
  if(on){ const d=DISPLAYS.find(x=>x.id===F.editId); $('#editingTxt').textContent=d&&d.draft?`"${d.name||'상품명 없음'}" 임시저장본을 이어서 작성 중. 저장하기를 누르면 목록에 등록됩니다`:`"${d?d.name:''}" 수정 중. 저장하면 목록의 같은 행이 바뀝니다`; }
}
function renderAll(){ renderInfo(); renderBase(); syncSoSeg(); renderMatrix(); renderSlots(); renderMedia(); renderDetail(); renderNotice(); renderEditing(); }
$('#bReset').addEventListener('click',()=>{ const k=F.type, id=F.editId; if(id){ const d=DISPLAYS.find(x=>x.id===id); if(d){ loadDisplay(d); toast('저장된 값으로 되돌렸습니다'); return; } } resetForm(); if(k!=='device') setType(k); else renderAll(); });
$('#editCancel').addEventListener('click',()=>{ resetForm(); renderAll(); history.replaceState(null,'',location.pathname); });

// ---------- 저장 ----------
const DISPLAYS=loadDisplays();
function snapshot(){
  return {id:F.editId||'D'+Date.now(),draft:false,media:copyMedia(F.media),noticeOn:F.noticeOn,name:F.name.trim(),type:F.type,ch:F.ch,cat:F.cat,from:F.from,to:F.to,show:F.show,use:F.use,head:F.head,noBase:F.noBase,
    slots:F.slots.map(s=>({req:s.req,area:s.area,ptype:s.ptype,max:s.max,locked:s.locked,sel:[...s.sel]})),
    dev:isDev()?{soldout:M.soldout,ax:M.ax?Object.fromEntries(Object.entries(M.ax).map(([k,s])=>[k,[...s]])):null,rows:M.rows?M.rows.map(r=>Object.assign({},r)):null,dirty:M.dirty,join:{allow:[...M.join.allow],def:M.join.def},disc:{allow:[...M.disc.allow],def:M.disc.def}}:null,updated:TODAY};
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
  Object.assign(F,{editId:d.id,name:d.name,type:d.type,ch:d.ch,cat:d.cat,catAuto:false,from:d.from,to:d.to,show:d.show,use:d.use!==false,head:d.head,noBase:d.noBase,hq:'',media:d.media?copyMedia(d.media):emptyMedia(),noticeOn:d.noticeOn!==false,
    slots:d.slots.map(s=>newSlot({req:s.req,area:s.area,ptype:s.ptype,max:s.max,locked:s.locked,sel:new Set(s.sel)}))});
  resetM();
  if(d.dev){
    Object.assign(M,{soldout:d.dev.soldout,ax:d.dev.ax?Object.fromEntries(Object.entries(d.dev.ax).map(([k,v])=>[k,new Set(v)])):null,rows:d.dev.rows?d.dev.rows.map(r=>Object.assign({},r)):null,dirty:!!d.dev.dirty,join:{allow:new Set(d.dev.join.allow),def:d.dev.join.def},disc:{allow:new Set(d.dev.disc.allow),def:d.dev.disc.def}});
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
