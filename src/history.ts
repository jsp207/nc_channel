// @ts-nocheck
// 히스토리: 작업한 화면 파일 목록(index.html). 목록은 HTML에 직접 작성합니다.
import "./style.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

// 상품 / 결제 탭. 고른 탭은 주소(#pay)에 남겨 새로고침·공유해도 유지된다.
const tabs=[...document.querySelectorAll('.h-tabs [role="tab"]')];
function showTab(k){
  tabs.forEach(t=>{ const on=t.dataset.tab===k; t.setAttribute('aria-selected',String(on)); t.tabIndex=on?0:-1; document.getElementById(t.getAttribute('aria-controls')).hidden=!on; });
}
tabs.forEach((t,i)=>{
  t.addEventListener('click',()=>{ showTab(t.dataset.tab); history.replaceState(null,'',t.dataset.tab==='prod'?location.pathname:'#'+t.dataset.tab); });
  t.addEventListener('keydown',e=>{ if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight') return; const n=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length]; n.click(); n.focus(); });
});
showTab(location.hash==='#pay'?'pay':'prod');
