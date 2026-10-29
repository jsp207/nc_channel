// @ts-nocheck
// 히스토리: 작업한 화면 파일 목록(index.html). 목록은 HTML에 직접 작성합니다.
import "./style.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

// 첫 열 상태: HTML에서 data-latest를 붙인 행에만 Latest
document.querySelectorAll('.h-tabs ~ [role="tabpanel"] tbody tr').forEach(r=>{
  r.insertCell(0).innerHTML=r.hasAttribute('data-latest')?'<span class="h-latest">Latest</span>':'';
});

// 상품 / 주문 / 결제 탭. 고른 탭은 주소(#order, #pay)에 남겨 새로고침·공유해도 유지된다.
const tabs=[...document.querySelectorAll('.h-tabs [role="tab"]')];
function showTab(k){
  tabs.forEach(t=>{ const on=t.dataset.tab===k; t.setAttribute('aria-selected',String(on)); t.tabIndex=on?0:-1; document.getElementById(t.getAttribute('aria-controls')).hidden=!on; });
}
tabs.forEach((t,i)=>{
  t.addEventListener('click',()=>{ showTab(t.dataset.tab); history.replaceState(null,'',t.dataset.tab==='prod'?location.pathname:'#'+t.dataset.tab); });
  t.addEventListener('keydown',e=>{ if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight') return; const n=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length]; n.click(); n.focus(); });
});
showTab(tabs.some(t=>'#'+t.dataset.tab===location.hash)?location.hash.slice(1):'prod');

// 상품 탭: 목록 / 상세 / 정책 버튼으로 행(data-k)을 걸러 보여 준다. 처음에는 목록
const segs=[...document.querySelectorAll('.h-seg button')];
const prodRows=[...document.querySelectorAll('#historyProd tbody tr')];
segs.forEach(b=>{ b.querySelector('.h-cnt').textContent=String(prodRows.filter(r=>r.dataset.k===b.dataset.k).length); });
function showKind(k){
  segs.forEach(b=>{ const on=b.dataset.k===k; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
  prodRows.forEach(r=>{ r.hidden=r.dataset.k!==k; });
}
segs.forEach(b=>b.addEventListener('click',()=>showKind(b.dataset.k)));
showKind('list');
