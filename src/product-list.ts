// @ts-nocheck
// 상품목록: ref/product-admin-prototype-v4-2.html의 상품전시 목록 화면. 수정은 product-create.html?edit=<id>
import "./style.css";
import { requireAuthentication } from "./auth";
import { $, el, esc, nameText, toast, variants, TYPES, tdef, CHANNELS, poRange, stOf, ST, loadDisplays } from "./product-display-store";

requireAuthentication();

const DISPLAYS=loadDisplays();

TYPES.forEach(t=>$('#lType').appendChild(new Option(t.label,t.k))); CHANNELS.forEach(c=>$('#lCh').appendChild(new Option(c,c)));
function renderList(){
  const q=$('#lQ').value.trim(), ty=$('#lType').value, ch=$('#lCh').value, st=$('#lSt').value;
  const list=DISPLAYS.filter(d=>(!ty||d.type===ty)&&(!ch||d.ch===ch)&&(!st||stOf(d)===st)&&(!q||nameText(d.name).includes(q)||(d.head&&d.head.name.includes(q))||d.slots.some(s=>s.sel.some(o=>o.name.includes(q)))));
  const tb=$('#listTable tbody'); tb.innerHTML='';
  list.forEach(d=>{
    const t=tdef(d.type); const s=stOf(d);
    const head=d.noBase?'<span style="color:var(--muted)">없음 (패스형)</span>':(d.head?esc(d.type==='device'?d.head.key+' (옵션 '+(d.dev&&d.dev.rows?d.dev.rows.filter(r=>r.use).length:variants(d.head).length)+'개)':d.head.name):'-');
    const slots=d.slots.length?d.slots.map((x,i)=>`${i+1}. ${x.req?'필수':'선택'} ${x.locked?'요금제':x.area} · 최대 ${x.max} · 후보 ${x.sel.length}`).join('<br>'):'<span style="color:var(--muted)">없음</span>';
    const tr=el('tr'); tr.dataset.id=d.id;
    tr.innerHTML=`<td><b>${esc(nameText(d.name))||'<span style="color:var(--muted)">(상품명 없음)</span>'}</b></td><td>${t.label}</td><td>${d.ch} · ${esc(d.cat)||'-'}</td><td>${head}</td><td style="font-size:12px">${slots}</td><td>${poRange(d)}</td><td style="white-space:nowrap">${d.from?`${esc(d.from)} ~ ${esc(d.to)||'상시'}`:'상시'}</td><td style="white-space:nowrap"><span class="status ${s}"></span>${ST[s]}</td><td><a class="btn sm" href="product-create.html?edit=${encodeURIComponent(d.id)}">수정</a></td>`;
    tb.appendChild(tr);
  });
  if(!list.length) tb.innerHTML='<tr><td colspan="9" style="color:var(--muted)">조건에 맞는 상품이 없습니다. 필터를 풀거나 새 상품을 등록하세요</td></tr>';
  $('#lCnt').textContent=`${list.length}개 / 전체 ${DISPLAYS.length}개`;
}
$('#lQ').addEventListener('input',renderList); ['#lType','#lCh','#lSt'].forEach(s=>$(s).addEventListener('change',renderList));
renderList();

// 등록 화면에서 저장하고 넘어오면 ?saved=<id>&mode=new|edit로 저장한 행을 강조한다.
const params=new URLSearchParams(location.search), saved=params.get('saved');
if(saved){
  const tr=document.querySelector(`#listTable tr[data-id="${CSS.escape(saved)}"]`);
  if(tr){ tr.classList.add('flash'); tr.scrollIntoView({block:'nearest'}); setTimeout(()=>tr.classList.remove('flash'),2200); }
  toast(params.get('mode')==='edit'?'상품을 수정했습니다':'상품을 저장했습니다');
  history.replaceState(null,'',location.pathname);
}
