// @ts-nocheck
// 주문 템플릿 관리 · 조회(목록) 화면: order1.html
// 템플릿 ID → 상세(order1-create.html?id=), 복사하기 → 복사 등록(?copy=), 등록 → 신규 등록(order1-create.html)
import "./order1.css";
import { requireAuthentication } from "./auth";
import { $, esc, toast, apBadge, PS, pagerHTML, bindPager, APS, loadTemplates } from "./order1-common";

requireAuthentication();

const DATA=loadTemplates();
const CREATE='order1-create.html';

var LQ={use:'',aps:APS.slice(),cat:'',id:'',nm:'',from:'2026-09-01',to:'2026-10-31',page:1};
function readQ(){
  LQ.use=document.querySelector('input[name=luse]:checked').value;
  LQ.aps=APS.filter(function(a,i){return $('lAp'+(i+1)).checked});
  LQ.cat=$('lCat').value; LQ.id=$('lId').value.trim().toLowerCase(); LQ.nm=$('lNm').value.trim().toLowerCase();
  LQ.from=$('lFrom').value; LQ.to=$('lTo').value; LQ.page=1;
}
function resetQ(){
  document.querySelector('input[name=luse][value=""]').checked=true;
  for(var i=0;i<=5;i++) $('lAp'+i).checked=true;
  $('lCat').value='';$('lId').value='';$('lNm').value='';$('lFrom').value='2026-09-01';$('lTo').value='2026-10-31';
  readQ();
}
function dkey(s){return s.slice(0,10).replace(/\./g,'-')}
function lList(){
  return DATA.filter(function(d){
    if(LQ.use&&(d.u?'Y':'N')!==LQ.use) return false;
    if(LQ.aps.indexOf(d.ap)<0) return false;
    if(LQ.cat&&d.cat!==LQ.cat) return false;
    if(LQ.id&&d.id.toLowerCase().indexOf(LQ.id)<0) return false;
    if(LQ.nm&&d.n.toLowerCase().indexOf(LQ.nm)<0) return false;
    var k=dkey(d.dt); if(LQ.from&&k<LQ.from) return false; if(LQ.to&&k>LQ.to) return false;
    return true;
  }).sort(function(a,b){return a.dt<b.dt?1:(a.dt>b.dt?-1:0)});
}
function renderTpl(){
  var list=lList(), tp=Math.max(1,Math.ceil(list.length/PS)); if(LQ.page>tp) LQ.page=tp;
  var off=(LQ.page-1)*PS, tb=$('lBody');
  tb.innerHTML=list.slice(off,off+PS).map(function(d,i){
    var id=encodeURIComponent(d.id);
    return '<tr><td>'+(list.length-off-i)+'</td><td>'+d.cat+'</td><td><a href="'+CREATE+'?id='+id+'">'+d.id+'</a></td><td class="l">'+esc(d.n)+'</td><td>'+d.cnt+'건</td><td>'+apBadge(d.ap)+'</td><td>'+(d.u?'Y':'N')+'</td><td><a class="btn sm" href="'+CREATE+'?copy='+id+'">복사하기</a></td><td>'+d.dt+'</td><td>'+d.by+'</td></tr>';
  }).join('');
  $('lCnt').textContent=list.length; $('lEmpty').hidden=!!list.length;
  $('lPager').innerHTML=pagerHTML(list.length,LQ.page);
}

$('lAp0').onchange=function(){for(var i=1;i<=5;i++)$('lAp'+i).checked=this.checked};
for(var li=1;li<=5;li++)$('lAp'+li).onchange=function(){var all5=true;for(var k=1;k<=5;k++)if(!$('lAp'+k).checked)all5=false;$('lAp0').checked=all5};
$('lBtn').onclick=function(){readQ();renderTpl()};
$('lReset').onclick=function(){resetQ();renderTpl()};
['lId','lNm'].forEach(function(id){$(id).addEventListener('keydown',function(e){if(e.key==='Enter'){readQ();renderTpl()}})});
bindPager('lPager',function(g){LQ.page=g;renderTpl()});

resetQ();
renderTpl();

// 등록 화면에서 저장하고 돌아오면 안내를 띄우고 주소의 표시는 지운다
if(new URLSearchParams(location.search).has('saved')){
  toast('저장되었습니다. 승인 요청이 진행됩니다.');
  history.replaceState(null,'',location.pathname);
}
