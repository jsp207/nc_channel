// @ts-nocheck
// 주문 코너 등록 v0.2.2: ref/order_mockup_1103.html(코너 유형 관리 통합안)의 화면 로직을 그대로 옮겼다.
// 목록(조회 · 사용 위치) · 상세(기본 정보 · 코너 구성 · CTA 버튼 · 조건 설정 · 사용 위치) · 수정(승인 요청) · 변경/승인 이력 · 상품 조회 팝업(EPC 요금제 · T 기프트 · 티다팩 · 단말 · 부가서비스)
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import { PAGES, UI, KIND_D_OLD, ITEMS, o, CORNERS, STR, PROCS, CONDREF, COMP, LINKS, LSRC, PSUB, KIND_D, GROUPS, DS_OVR, CAT, SORTS, PKEYS, EPC, epcOpt, GIFT, TDP, DEVICE, ADDON, CATS, catOpt, pick, esc, IC, has, foHead, badge, logoBox, foBody, foCard, ctaN, ctaList, pvCorner } from "./order-corner-v22-data";
import { openCornerCreate, specOf, setFold } from "./order-corner-create-v22";

requireAuthentication();

function $(id){return document.getElementById(id)}
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(function(){t.classList.remove('show')},2200)}
function cById(id){for(var i=0;i<CORNERS.length;i++)if(CORNERS[i].id===id)return CORNERS[i];return null}
function pgName(k){return PAGES[k]?PAGES[k].n:k}
function pgScr(k){return PAGES[k]?PAGES[k].s:''}
/* 역참조 */
var REF={};
PROCS.forEach(function(p){
  STR[p[5]].forEach(function(pg){
    pg[1].forEach(function(cid,ix){
      (REF[cid]=REF[cid]||[]).push({pid:p[0],cat:p[1],pn:p[2],ap:p[3],u:p[4],page:pgName(pg[0]),scr:pgScr(pg[0]),pos:ix+1,tot:pg[1].length});
    });
  });
});
function refsOf(id){return REF[id]||[]}
function procCnt(id){var s={};refsOf(id).forEach(function(r){s[r.pid]=1});return Object.keys(s).length}
/* 선·후행 */
function preOf(id){return LINKS.filter(function(l){return l.b===id})}
function postOf(id){return LINKS.filter(function(l){return l.a===id})}
var SELUI=['list','card','grid','chip','radio','color','nv'];

/* ===== 통합안 공통 ===== */
function anyById(id){return cById(id)||PSUB.filter(function(x){return x.id===id})[0]||GROUPS.filter(function(g){return g.id===id})[0]||null}
function isGrp(x){return !!x&&x.t==='코너 그룹'}
function catOf(id){var m=id.split('-')[1];return CAT[m]||m}
function grpOf(id){return GROUPS.filter(function(g){return g.members.indexOf(id)>-1})}
function refsAny(x){return isGrp(x)?refsOf(x.members[0]):refsOf(x.id)}
var EXT='<svg class="ext" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
var DEFN='<span class="defn">정의 중</span>';
function kindPill(t){var cls=t==='상품 연동'?'p-gr':(t==='코너 그룹'?'p-grp':(t==='결제'?'p-pay':'p-bl'));return '<span class="pill '+cls+'">'+t+'</span>'}
function dsPill(ds){if(!ds)return '<span class="faint">-</span>';var m={'직접 입력':'ds-in','상품 시스템':'ds-ps','주문 정보':'ds-or','혼합':'ds-mx'};return '<span class="dsp '+m[ds]+'">'+ds+'</span>'}
function apPill(s){var m={'승인 완료':'ok','임시 저장':'tmp','반려':'no','승인 대기':'wt','요청 취소':'tmp'};return '<span class="ap '+(m[s]||'tmp')+'">'+s+'</span>'}
function pad(n){return ('0'+n).slice(-2)}
function nowStr(full){var d=new Date();return full?d.getFullYear()+'.'+pad(d.getMonth()+1)+'.'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()):d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
function clone(o){return JSON.parse(JSON.stringify(o))}
function setCrumb(arr){$('crumb').innerHTML=arr.map(function(s){return '<span>'+s+'</span>'}).join('')}

/* ===== 목록 ===== */
var Q={use:'',kind:'',ds:'',key:'n',kw:'',page:1};
var PS=10;
function allItems(){return CORNERS}
function readForm(){
  var u=document.querySelector('input[name=fuse]:checked');Q.use=u?u.value:'';
  Q.kind='';Q.ds='';Q.key=$('fKey').value;Q.kw=$('fKw').value.trim().toLowerCase();Q.page=1;
}
function baseList(){
  return allItems().filter(function(c){
    if(Q.use&&c.use!==Q.use) return false;
    if(Q.kind&&c.t!==Q.kind) return false;
    if(Q.ds&&c.ds!==Q.ds) return false;
    if(Q.kw&&String(Q.key==='i'?c.id:c.n).toLowerCase().indexOf(Q.kw)<0) return false;
    return true;
  });
}
function renderList(){
  var L=baseList(), tp=Math.max(1,Math.ceil(L.length/PS)); if(Q.page>tp) Q.page=tp;
  var off=(Q.page-1)*PS, rows=L.slice(off,off+PS);
  $('rCnt').textContent=L.length;
  $('vList').hidden=!L.length;
  $('lBody').innerHTML=rows.map(function(c,i){
    var nm='<b class="lnk">'+esc(c.n)+'</b>'+(isGrp(c)?DEFN+'<small class="q">구성 코너 '+c.members.length+'개</small>':'');
    // 코너 그룹은 유형 칸에 '코너 그룹'만, 비화면 코너처럼 맞는 표시 방식이 없으면 '-'
    var sp=isGrp(c)?{type:'코너 그룹',form:'-',mode:'-'}:specOf(c)||{type:'-',form:'-',mode:'-'};
    return '<tr data-id="'+c.id+'"><td class="mono"><a class="cid" href="#" data-id="'+c.id+'">'+c.id+'</a></td><td class="l">'+nm+'</td><td>'+esc(sp.type)+'</td><td>'+esc(sp.form)+'</td><td>'+esc(sp.mode)+'</td><td class="vr">'+c.ver+'</td><td>'+c.use+'</td><td class="dt">'+String(c.dt).slice(0,10)+'</td><td class="mb">'+esc(c.mby)+'</td></tr>';
  }).join('');
  $('lEmpty').hidden=!!L.length;
  $('pager').innerHTML=pagerHTML(L.length,Q.page);
}
function pagerHTML(n,p){var tp=Math.max(1,Math.ceil(n/PS)),h='';for(var i=1;i<=tp;i++)h+='<button type="button" class="'+(i===p?'on':'')+'" data-g="'+i+'">'+i+'</button>';return h}

/* ===== 상세 / 수정 ===== */
var cur=null,mode='view',dr=null,DT='info';
var U={st:'',kw:'',raw:'',page:1},UPS=5;
function cv(){return mode==='edit'?dr:cur}
function histOf(c){
  if(isGrp(c)) return [{st:'임시 저장',req:'김지훈 (SSP2332)',rqt:'2026.10.27 10:20:00',why:'코너 그룹 정의 중 (설정 예시)',chg:'최초 등록',apr:'-',apt:'',ar:'',ver:''}];
  var mj=c.ver.split('.')[0];
  return [
    {st:'승인 완료',req:'이서연 (SSP1187)',rqt:'2026.10.20 10:00:00',why:'선택지 설명 문구 수정',chg:'선택지',apr:'정지솔 (SSP12344)',apt:'2026.10.20 16:30:00',ar:'',ver:c.ver},
    {st:'반려',req:'박민서 (SSP4410)',rqt:'2026.10.12 14:00:00',why:'노출 조건 변경',chg:'노출 조건',apr:'정지솔 (SSP12344)',apt:'2026.10.13 09:10:00',ar:'조건 값 재확인 필요',ver:''},
    {st:'승인 완료',req:'김지훈 (SSP2332)',rqt:'2026.10.05 10:00:00',why:'코너 최초 등록',chg:'최초 등록',apr:'정지솔 (SSP12344)',apt:'2026.10.05 18:00:00',ar:'',ver:mj+'.0'}
  ];
}
function row(k,v,col){return '<div class="kv"><div class="k">'+k+'</div><div class="v'+(col==='cta'?' ctav':(col?' col':''))+'">'+v+'</div></div>'}
/* 상세 영역 : 코너 등록(order-corner-create-v22)과 같은 아코디언 섹션. 접힘 상태는 다시 그려도 유지 */
var DF={};
function card(t,inner,sub,id,bodyCls){var k=id||t;return '<section class="cc-acc'+(DF[k]?' closed':'')+'"'+(id?' id="'+id+'"':'')+'><header data-dfold="'+esc(k)+'"><b>'+t+'</b>'+(sub?'<span class="cc-hsub">'+sub+'</span>':'')+'<button type="button" class="cc-fold" aria-expanded="'+!DF[k]+'" aria-label="접기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>'+'</header><div class="cc-accb'+(bodyCls?' '+bodyCls:'')+'">'+inner+'</div></section>'}
function kvs(inner){return '<div class="kvs">'+inner+'</div>'}
function inp(f,val,ph){return '<input class="inp" data-f="'+f+'" value="'+esc(val)+'" placeholder="'+esc(ph||'')+'" maxlength="40">'}
function optNames(c){return c.opts.map(function(x){return esc(x.n)}).join('<span class="sl"> / </span>')}
function dsDesc(c){
  if(c.ds==='상품 시스템') return '<span class="kd1">연동 대상 : '+esc(c.src||'상품 마스터')+'</span>';
  if(c.ds==='혼합') return '<span class="kd1">연동 항목('+esc(c.src||'상품 마스터')+')과 고정 항목을 함께 사용</span>';
  if(c.ds==='주문 정보') return '<span class="kd1">앞 단계 코너 선택값과 계산값을 모아 표시</span>';
  return '<span class="kd1">운영자가 입력한 고정 선택지 사용</span>';
}
function isLinkedDs(ds){return ds==='상품 시스템'||ds==='혼합'}
var LOCKI='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
/* 단말 상품 기본 정보 : 하위 코너(색상, 용량)별 타이틀 수정 + 연동 항목 순서 변경 */
function subBlock(c){
  var ed=mode==='edit',lkTag='<span class="lkt">연동</span>';
  var h='<div class="chb"><div class="chh"><span class="exv" style="margin-left:0">연동 항목 값은 단말 상품 마스터 기준 예시 값</span>'+(ed?'<span class="dh">드래그로 순서 변경</span>':'')+'</div><div class="subs">';
  h+=c.subs.map(function(x,si){
    var head='<div class="subh"><b>'+(x.ui==='color'?'색상':'용량')+'</b><span class="mono">'+x.id+'</span><span class="faint">'+esc(x.n)+'</span></div>';
    var tt='<div class="subt2"><span class="lb">메인 타이틀</span>'+(ed?'<input class="inp sm" data-si="'+si+'" data-sf="q" value="'+esc(x.q)+'" placeholder="메인 타이틀을 입력하세요" maxlength="40">':'<span>'+esc(x.q)+'</span>')+'</div>'+
      '<div class="subt2"><span class="lb">서브 타이틀</span>'+(ed?'<input class="inp sm" data-si="'+si+'" data-sf="sub" value="'+esc(x.sub||'')+'" placeholder="메인 타이틀 아래 보조 설명 (선택)" maxlength="40">':(x.sub?'<span>'+esc(x.sub)+'</span>':'<span class="faint">없음</span>'))+'</div>';
    var rows='<div class="orows">'+x.opts.map(function(o,i){
      var st=o.b?' · '+esc(o.b):'';
      if(ed) return '<div class="orow lk" data-si="'+si+'" data-oi="'+i+'"><span class="hdl" title="드래그로 순서 변경">⋮⋮</span><span class="no">'+(i+1)+'</span><span class="lkn">'+esc(o.n)+lkTag+'</span><span class="lkd">'+esc(o.d||'')+(o.p?' · '+esc(o.p):'')+st+'</span><span class="lock" title="연동 항목은 수정, 삭제할 수 없습니다">'+LOCKI+'</span></div>';
      return '<div class="orow ro lk"><span class="no">'+(i+1)+'</span><span class="nm">'+esc(o.n)+lkTag+'</span><span class="ds">'+esc(o.d||'')+(o.p?' · '+esc(o.p):'')+st+'</span></div>';
    }).join('')+'</div>';
    return '<div class="subc">'+head+tt+rows+'</div>';
  }).join('');
  h+='</div><p class="hint">색상, 용량, 가격, 재고 상태는 단말 상품 마스터 값을 그대로 쓰므로 수정, 삭제할 수 없고 순서만 바꿀 수 있습니다. 하위 코너별 메인 타이틀과 서브 타이틀은 수정할 수 있습니다.</p></div>';
  return h;
}
/* 선택 항목 : 직접 입력 항목 수정, 고객 값은 비활성 */
var CVTAG='<span class="cvt">고객 값</span>';
function optBlock(c){
  var ed=mode==='edit';
  if(c.ui==='pinfo') return subBlock(c);
  if(c.cat) return catBlock(c);
  if(!c.opts.length) return '<span class="faint">없음</span>';
  var hasCv=c.opts.some(function(x){return x.cv});
  var h='<div class="chb">';
  if(!ed){
    h+='<div class="orows">'+c.opts.map(function(x,i){return '<div class="orow ro"><span class="no">'+(i+1)+'</span><span class="nm">'+esc(x.n)+'</span><span class="ds">'+(x.cv?CVTAG:'')+esc(x.d||'')+(x.p?' · '+esc(x.p):'')+'</span></div>'}).join('')+'</div>';
  }else{
    h+='<div class="orows">'+c.opts.map(function(x,i){
      return '<div class="orow" data-oi="'+i+'"><span class="hdl" title="드래그로 순서 변경">⋮⋮</span><span class="no">'+(i+1)+'</span><input class="inp sm" data-o="'+i+'" data-k="n" value="'+esc(x.n)+'" placeholder="항목명" maxlength="20">'+
        (x.cv?'<input class="inp sm cvin" value="'+esc(x.d)+'" disabled title="고객 선택 값, 입력 값은 수정할 수 없습니다">':'<input class="inp sm" data-o="'+i+'" data-k="d" value="'+esc(x.d)+'" placeholder="설명 (선택)" maxlength="40">')+
        (x.cv?'<span></span>':'<button type="button" class="xbtn" data-odel="'+i+'" aria-label="삭제">✕</button>')+'</div>';
    }).join('')+'</div>';
  }
  if(hasCv) h+='<p class="hint">고객 값은 주문 시 고객이 선택하거나 입력한 값으로 채워지며 수정할 수 없습니다. 항목명과 순서만 바꿀 수 있습니다.</p>';
  return h+'</div>';
}
/* 상품 추가형 코너 : 조회 팝업에서 선택해 구성 */
function catBlock(c){
  var ed=mode==='edit',conf=CATS[c.cat],hc=!!conf.cta,ni=!!conf.noInfo;
  var h='<div class="chb">'+(ed?'<div class="chh"><span class="sp"></span><button type="button" class="obtn" id="catOpen">＋ 상품 추가</button></div>':'');
  if(!c.opts.length) h+='<div class="infobox">추가된 상품이 없습니다.'+(ed?' [상품 추가]로 상품을 선택하세요.':'')+'</div>';
  else{
    if(hc) h+='<div class="orhd'+(ed?' ed':'')+(ni?' ni':'')+'"><span></span><span>상품</span>'+(ni?'':'<span>정보</span>')+'<span>상품 버튼명</span></div>';
    h+='<div class="orows">'+c.opts.map(function(x,i){
      var tag='';
      var desc=esc(x.d||'')+(x.p?' · '+esc(x.p):'');
      var cls='orow'+(hc?' ct':' ep')+(ni?' ni':'')+(ed?'':' ro');
      if(!ed) return '<div class="'+cls+'"><span class="no">'+(i+1)+'</span><span class="nm">'+esc(x.n)+tag+'</span>'+(ni?'':'<span class="ds">'+desc+'</span>')+(hc?'<span class="ds">'+(x.cid?esc(x.cl||''):'')+'</span>':'')+'</div>';
      var name=x.cid?'<span class="lkn">'+esc(x.n)+tag+'</span>'+(ni?'':'<span class="lkd">'+desc+'</span>'):'<input class="inp sm" data-o="'+i+'" data-k="n" value="'+esc(x.n)+'" placeholder="항목명" maxlength="20">'+(ni?'':'<span class="lkd faint">고정 항목</span>');
      var cta=hc?(x.cid?'<input class="inp sm" data-ocl="'+i+'" value="'+esc(x.cl||'')+'" placeholder="상품 버튼명" maxlength="12">':'<span></span>'):'';
      return '<div class="'+cls+'" data-oi="'+i+'"><span class="hdl" title="드래그로 순서 변경">⋮⋮</span><span class="no">'+(i+1)+'</span>'+name+cta+'<button type="button" class="xbtn" data-odel="'+i+'" aria-label="삭제">✕</button></div>';
    }).join('')+'</div>';
  }
  h+='<div class="vrow"><span class="lb">노출 개수</span>'+(ed?'<input class="inp num" type="number" min="1" max="20" data-f="lim" value="'+c.lim+'">':c.lim+'개')+'<span class="faint" style="font-size:12px">초과 항목은 더보기로 노출됩니다.</span></div>';
  return h+'</div>';
}
/* CTA 버튼 : 버튼 유형(1단/2단) + 버튼별 버튼명, URL, 노출 여부 */
function ctaBlock(c){
  var ed=mode==='edit',n=ctaN(c),L=ctaList(c),req=ed?'<i class="req">•</i>':'';
  var rows=[['버튼 유형',ed?'<div class="rgrp"><label><input type="radio" name="ctaType" value="0"'+(n===0?' checked':'')+'>없음</label><label><input type="radio" name="ctaType" value="1"'+(n===1?' checked':'')+'>1단</label><label><input type="radio" name="ctaType" value="2"'+(n===2?' checked':'')+'>2단</label></div>':(n?n+'단':'없음')]];
  L.forEach(function(a,i){
    var pre=n===2?(i?'우측 ':'좌측 '):'';
    rows.push([pre+'버튼명'+req,ed?'<input class="inp sm" data-cta="label" data-ci="'+i+'" value="'+esc(a.label)+'" placeholder="버튼명을 입력해주세요" maxlength="20">':(a.label?esc(a.label):'없음')]);
    rows.push([pre+'URL'+req,ed?'<input class="inp sm" data-cta="link" data-ci="'+i+'" value="'+esc(a.link)+'" placeholder="이동할 화면 ID 또는 URL을 입력해주세요" maxlength="200">':(a.link?esc(a.link):'없음')]);
    rows.push([pre+'노출 여부',ed?'<div class="rgrp"><label><input type="radio" name="ctaon'+i+'" data-ctaon="'+i+'" value="Y"'+(a.on?' checked':'')+'>Y</label><label><input type="radio" name="ctaon'+i+'" data-ctaon="'+i+'" value="N"'+(a.on?'':' checked')+'>N</label></div>':(a.on?'Y':'N')]);
  });
  return '<table class="ctt"><tbody>'+rows.map(function(r){return '<tr><th>'+r[0]+'</th><td>'+r[1]+'</td></tr>'}).join('')+'</tbody></table>';
}
function tbdTag(){return '<span class="tbd">미확정</span>'}
/* 조건 설정 : 초안 방식 (코너별 수동 조건) */
function condSources(selfId){return CORNERS.filter(function(c){return c.id!==selfId&&SELUI.indexOf(c.ui)>-1&&c.opts.length})}
function condVals(c){if(c.kind==='corner'){var o=cById(c.key);return o?o.opts.filter(function(x){return x.x!=='none'}).map(function(x){return x.n}):[]}return (PKEYS[c.key]||PKEYS.ordertype).v}
function condName(c){if(c.kind==='corner'){var o=cById(c.key);return esc(o?o.n:c.key)+'<span class="ctag">'+c.key+' 선택값</span>'}return esc((PKEYS[c.key]||PKEYS.ordertype).s)}
function condOpts(c,selfId){
  return '<optgroup label="선행 코너 선택값">'+condSources(selfId).map(function(o){return '<option value="corner:'+o.id+'"'+(c.kind==='corner'&&c.key===o.id?' selected':'')+'>'+o.id+' '+esc(o.n)+'</option>'}).join('')+'</optgroup>'+
    '<optgroup label="상품 정보">'+Object.keys(PKEYS).map(function(k){return '<option value="product:'+k+'"'+(c.kind==='product'&&c.key===k?' selected':'')+'>'+PKEYS[k].l+'</option>'}).join('')+'</optgroup>';
}
function whenHTML(cd){
  if(cd.mode!=='cond') return '';
  if(!cd.list.length||cd.list.some(function(c){return !c.values.length})) return '<div class="when"><p class="warn">조건 값을 선택해 주세요.</p></div>';
  return '<div class="when"><p>'+(cd.list.length>1?'아래 조건을 모두 만족할 때만':'아래 조건일 때만')+' 이 코너를 보여줍니다. 그 외에는 건너뜁니다.</p><ul>'+cd.list.map(function(c){return '<li>'+condName(c)+' : <b>'+c.values.map(esc).join(', ')+'</b>'+(c.values.length>1?' 중 하나':'')+'</li>'}).join('')+'</ul></div>';
}
function condBlock(c){
  var cd=c.cond,ed=mode==='edit';
  if(!ed){
    if(cd.mode!=='cond') return '<span>조건 없음</span>';
    return '<span>조건 있음 (조건을 만족할 때만 보여요)</span>'+whenHTML(cd);
  }
  var h='<select class="sel cmode" id="cMode"><option value="none"'+(cd.mode!=='cond'?' selected':'')+'>조건 없음</option><option value="cond"'+(cd.mode==='cond'?' selected':'')+'>조건 있음 (조건을 만족할 때만 보여요)</option></select>';
  if(cd.mode==='cond'){
    h+='<div class="clines">'+cd.list.map(function(x,i){
      var vs=condVals(x);
      return (i?'<div class="cand">그리고</div>':'')+'<div class="cline"><select class="sel" data-csel="'+i+'">'+condOpts(x,c.id)+'</select><div class="cvals">'+(vs.length?vs.map(function(v){return '<label><input type="checkbox" data-cval="'+i+'" value="'+esc(v)+'"'+(x.values.indexOf(v)>-1?' checked':'')+'>'+esc(v)+'</label>'}).join(''):'<span class="hint" style="margin:0">이 코너에 등록된 선택지가 없습니다.</span>')+'</div><button type="button" class="xbtn" data-cdel="'+i+'" aria-label="조건 삭제">✕</button></div>';
    }).join('')+'</div>';
    h+='<div class="cadd"><button type="button" class="obtn" id="cAdd">＋ 조건 추가</button><p class="hint">조건을 여러 개 넣으면 모두 만족해야 보여요. 선행 코너 선택값은 프로세스에서 이 코너보다 앞에 있는 코너만 쓸 수 있어요.</p></div>';
    h+=whenHTML(cd);
  }
  return h;
}
function cornerRight(){
  var c=cv(),ed=mode==='edit',g=grpOf(c.id);
  var t=c.t==='결제'?'결제':(isLinkedDs(c.ds)?'상품 연동':'주문');
  var base=
    row('코너명',ed?inp('n',c.n,'코너명을 입력하세요'):'<b>'+esc(c.n)+'</b>')+
    row('코너 ID','<span class="mono">'+c.id+'</span>')+
    row('사용 여부',ed?'<div class="rgrp"><label><input type="radio" name="fuse2" value="Y"'+(c.use==='Y'?' checked':'')+'>Y</label><label><input type="radio" name="fuse2" value="N"'+(c.use==='N'?' checked':'')+'>N</label></div>':c.use)+
    row('코너 그룹',g.length?'<div class="chips">'+g.map(function(x){return '<a class="lc" data-go="'+x.id+'"><span class="mono">'+x.id+'</span>'+esc(x.n)+DEFN+EXT+'</a>'}).join('')+'</div>':'<span class="faint">없음</span>')+
    row('버전',c.ver);
  var title=c.ui==='pinfo'?row('메인 타이틀',esc(c.q)+'<span class="kd1">단말 상품 마스터 상품명 · 하위 코너 타이틀은 선택 항목에서 설정</span>')
    :(c.q&&c.ui!=='info'?row('메인 타이틀',ed?inp('q',c.q,'메인 타이틀을 입력하세요'):esc(c.q)):row('메인 타이틀','<span class="faint">없음</span>'));
  var sub=c.ui==='pinfo'?row('서브 타이틀',esc(c.sub||'')+'<span class="kd1">단말 상품 마스터 문구</span>'):(c.q&&!c.qs)?row('서브 타이틀',ed?inp('sub',c.sub||'','메인 타이틀 아래 보조 설명 (선택)'):(c.sub?esc(c.sub):'<span class="faint">없음</span>')):'';
  var scr=title+sub+row('선택 항목',optBlock(c),1)+
    row('CTA 버튼',ctaBlock(c),'cta')+
    (c.screens?row('연결 화면','<span>'+c.screens.map(esc).join('<span class="sl"> → </span>')+'</span>'):'');
  var h=card('기본 정보',kvs(base))+card('코너 구성',kvs(scr),'FO에 보이는 값 · 미리보기에 반영')+card('조건 설정',kvs(row('노출 조건',condBlock(c),1)),'이 코너를 보여줄 조건');
  return h;
}
function groupRight(){
  var gr=cur;
  var base=
    row('그룹명','<b>'+esc(gr.n)+'</b>'+DEFN)+
    row('그룹 ID','<span class="mono">'+gr.id+'</span>')+
    row('설명',esc(gr.desc)+'<p class="kd" style="width:100%">기존 선·후행 설정 예시를 코너 그룹으로 옮긴 값입니다. 코너 그룹 기준은 정의 중입니다.</p>')+
    row('버전',gr.ver);
  var mt='<table class="ot mt"><thead><tr><th style="width:48px">순서</th><th style="width:120px">코너 ID</th><th>코너명</th></tr></thead><tbody>'+
    gr.members.map(function(id,i){var o=anyById(id);return '<tr><td>'+(i+1)+'</td><td class="mono">'+o.id+'</td><td class="l"><a class="lnk2" data-go="'+o.id+'">'+esc(o.n)+'</a>'+(cById(id)?'':'<span class="kd1">하위 코너</span>')+'</td></tr>'}).join('')+'</tbody></table>';
  return card('기본 정보',kvs(base))+card('구성 코너',mt,'그룹 안의 노출 순서');
}
function renderPreview(){
  var el=$('dPv');
  if(isGrp(cur)){
    var ms=cur.members.filter(function(id){return cById(id)});
    el.innerHTML='<div class="grpv">'+ms.map(function(id){var c=cById(id);return '<div><p class="gl">'+c.id+' '+esc(c.n)+'</p>'+pvCorner(c)+'</div>'}).join('')+'</div>';
    return;
  }
  el.innerHTML=pvCorner(cv());
}
function useRefs(){var seen={},R=[];refsAny(cur).forEach(function(r){if(!seen[r.pid]){seen[r.pid]=1;R.push(r)}});return R}
function useHTML(){
  var R=useRefs();
  var tp=Math.max(1,Math.ceil(R.length/UPS));if(U.page>tp)U.page=tp;
  var rows=R.slice((U.page-1)*UPS,U.page*UPS);
  var head='<header><b>사용 위치<em>'+R.length+'개 프로세스</em></b><span class="cc-hsub">이 코너를 쓰는 주문 프로세스</span></header>';
  if(!R.length) return head+'<div class="cc-accb"><div class="empty sm">이 코너를 사용 중인 주문 프로세스가 없습니다.</div></div>';
  var h=head+'<div class="cc-accb"><div class="utw"><table class="ut"><colgroup><col style="width:140px"><col style="width:100px"><col><col style="width:110px"><col style="width:90px"></colgroup><thead><tr><th>프로세스 ID</th><th>구분</th><th>프로세스명</th><th>승인 상태</th><th>사용여부</th></tr></thead><tbody>'+
    rows.map(function(r){return '<tr><td class="mono">'+r.pid+'</td><td>'+esc(r.cat)+'</td><td class="l">'+esc(r.pn)+'</td><td>'+apPill(r.ap)+'</td><td>'+r.u+'</td></tr>'}).join('')+
    '</tbody></table></div>';
  if(tp>1){
    var pg='<button type="button" data-up="'+(U.page-1)+'"'+(U.page===1?' disabled':'')+' aria-label="이전">‹</button>';
    for(var i=1;i<=tp;i++)pg+='<button type="button" data-up="'+i+'" class="'+(i===U.page?'on':'')+'">'+i+'</button>';
    pg+='<button type="button" data-up="'+(U.page+1)+'"'+(U.page===tp?' disabled':'')+' aria-label="다음">›</button>';
    h+='<div class="ufoot" style="justify-content:center"><div class="upg">'+pg+'</div></div>';
  }
  return h+'</div>';
}
function renderUse(){var el=$('useBox');if(el)el.innerHTML=useHTML()}
function reasonHTML(){
  return '<div class="card-h"><b>변경 요청</b><span>저장하면 승인 요청이 올라갑니다</span></div><div class="card-b"><div class="reason"><label for="rsn">변경 요청 사유<i>*</i></label><input class="inp" id="rsn" type="text" maxlength="100" placeholder="승인 담당자가 확인할 변경 사유를 입력하세요 (최대 100자)"><div class="chg" id="chgSum"></div><div class="err" id="rsnErr" hidden></div></div></div>';
}
function renderRight(){
  $('dRight').innerHTML=isGrp(cur)?groupRight():cornerRight();
  renderUse();
}
function renderHead(){
  $('dId').textContent=cur.id;$('dName').textContent=cur.n;
  var t=isGrp(cur)?cur.t:(cur.t==='결제'?'결제':(isLinkedDs(cur.ds)?'상품 연동':'주문'));
  $('dPills').innerHTML='<span class="pill '+(cur.use==='Y'?'p-gr':'p-gy')+'">'+(cur.use==='Y'?'사용':'미사용')+'</span> <span class="ver">'+cur.ver+'</span>'+(cur.pending?' '+apPill('승인 대기'):'')+(mode==='edit'?' <span class="pill p-pu">수정 중</span>':'');
  $('hCnt').textContent=' '+cur.hist.length;$('uCnt').textContent=' '+useRefs().length;
  [].forEach.call(document.querySelectorAll('#dTabs .dtab'),function(b){b.classList.toggle('on',b.getAttribute('data-dt')===DT)});
  $('tInfo').hidden=DT!=='info';$('tUse').hidden=DT!=='use';$('tHist').hidden=DT!=='hist';
  $('pDetail').classList.toggle('hist',DT==='hist');
  setCrumb(['홈','주문 관리','코너 유형 관리',mode==='edit'?'코너 유형 수정':'코너 유형 상세']);
}
function renderFoot(){
  var b='';
  if(!isGrp(cur)&&DT==='info'){
    if(mode==='edit') b='<button type="button" class="btn-list" id="bCancel">취소</button><button type="button" class="btn-pri" id="bSave">저장</button>';
    else b=cur.pending?'<button type="button" class="btn-list" disabled style="opacity:.5;cursor:default">승인 대기 중</button>':'<button type="button" class="btn-pri" id="bEdit">수정</button>';
  }
  $('fBtns').innerHTML=b;
  $('bList').textContent=mode==='edit'?'목록으로':'목록';
}
function renderHist(){
  $('hBody').innerHTML=cur.hist.map(function(r,i){
    return '<tr><td>'+(cur.hist.length-i)+'</td><td>'+apPill(r.st)+'</td><td>'+esc(r.req)+'</td><td>'+r.rqt+'</td><td class="l">'+esc(r.why)+'</td><td class="l">'+esc(r.chg)+'</td><td>'+esc(r.apr)+'</td><td>'+(r.apt||'-')+'</td><td class="l">'+(r.ar?esc(r.ar):'<span class="faint">-</span>')+'</td><td>'+(r.ver||'<span class="faint">-</span>')+'</td></tr>';
  }).join('');
}
function diffs(){
  var d=[],L={n:'코너명',q:'메인 타이틀',sub:'서브 타이틀',use:'사용 여부',ds:'데이터 출처',sort:'정렬 기준',lim:'노출 개수'};
  Object.keys(L).forEach(function(k){if(String(cur[k]==null?'':cur[k])!==String(dr[k]==null?'':dr[k]))d.push(L[k])});
  if(JSON.stringify(cur.opts)!==JSON.stringify(dr.opts)||JSON.stringify(cur.subs||null)!==JSON.stringify(dr.subs||null))d.push('선택 항목');
  if(JSON.stringify(cur.cond)!==JSON.stringify(dr.cond))d.push('노출 조건');
  if(cur.ctaType!==dr.ctaType||JSON.stringify(ctaList(cur))!==JSON.stringify(ctaList(dr)))d.push('CTA 버튼');
  return d;
}
function renderChg(){
  if(mode!=='edit'||!$('chgSum'))return;
  var d=diffs();
  $('chgSum').innerHTML=d.length?'변경 항목 <b>'+d.length+'건</b> : '+d.join(', '):'변경된 항목이 없습니다.';
}
function renderDetail(){renderHead();renderPreview();renderRight();renderHist();renderFoot()}
function showPage(p){$('pList').hidden=p!=='list';$('pDetail').hidden=p!=='detail';$('pCreate').hidden=p!=='create'}
function openDetail(id,opt){
  cur=anyById(id);mode='view';dr=null;DT=opt==='use'?'use':'info';U={st:'',kw:'',raw:'',page:1};DF={};
  if(!cur.hist)cur.hist=histOf(cur);
  renderDetail();showPage('detail');window.scrollTo(0,0);
}
function openList(){showPage('list');setCrumb(['홈','주문 관리','코너 유형 관리']);renderList();window.scrollTo(0,0)}
function startEdit(){mode='edit';dr=clone(cur);delete dr.hist;renderDetail()}
function cancelEdit(){mode='view';dr=null;renderDetail();toast('수정을 취소했습니다.')}
function save(){
  var d=diffs();
  var bad=dr.cond.mode==='cond'&&(!dr.cond.list.length||dr.cond.list.some(function(c){return !c.values.length}));
  if(!d.length){toast('변경된 항목이 없습니다.');return}
  if(dr.opts.some(function(o){return !String(o.n).trim()})){toast('항목명이 비어 있는 선택 항목이 있습니다.');return}
  if(bad){toast('노출 조건 값을 선택하세요.');return}
  if(ctaList(dr).some(function(a){return a.on&&!String(a.label).trim()})){toast('노출할 CTA 버튼명을 입력하세요.');return}
  var h=cur.hist;for(var k in dr)cur[k]=dr[k];cur.hist=h;
  cur.pending=true;cur.dt=nowStr();cur.mby='김운영 (P031001)';
  cur.hist.unshift({st:'승인 대기',req:'김운영 (SSP1001)',rqt:nowStr(true),why:'코너 정보 수정',chg:d.join(', '),apr:'정지솔 (SSP12344)',apt:'',ar:'',ver:''});
  mode='view';dr=null;renderDetail();window.scrollTo(0,0);
  toast('승인을 요청했습니다.');
}
function refreshEdit(full){if(full)renderRight();renderPreview();renderChg()}

/* ===== 이벤트 ===== */
$('bSearch').onclick=function(){readForm();renderList()};
$('bReset').onclick=function(){
  document.querySelector('input[name=fuse][value=""]').checked=true;
  $('fKey').value='n';$('fKw').value='';$('bClr').hidden=true;readForm();renderList();
};
$('fKw').addEventListener('input',function(){$('bClr').hidden=!this.value});
$('fKw').addEventListener('keydown',function(e){if(e.key==='Enter'){readForm();renderList()}});
$('bClr').onclick=function(){$('fKw').value='';this.hidden=true;$('fKw').focus()};
$('pager').addEventListener('click',function(e){var b=e.target.closest('[data-g]');if(!b)return;Q.page=+b.getAttribute('data-g');renderList()});
$('lBody').addEventListener('click',function(e){
  var u=e.target.closest('[data-use]');if(u){openDetail(u.getAttribute('data-use'),'use');return}
  // 행 전체가 아니라 코너 ID를 눌렀을 때만 상세로 이동
  var a=e.target.closest('a[data-id]');if(a){e.preventDefault();openDetail(a.getAttribute('data-id'))}
});
$('topTabs').addEventListener('click',function(e){var b=e.target.closest('[data-tt]');if(!b)return;if(b.getAttribute('data-tt')!=='상품')toast(b.getAttribute('data-tt')+' 탭은 전시팀 목업에서 관리합니다. 통합 시 연결됩니다.')});
function goList(){if(mode==='edit')toast('수정 중인 내용은 저장되지 않았습니다.');mode='view';dr=null;openList()}
$('bList').onclick=goList;$('bTopList').onclick=goList;
$('dTabs').addEventListener('click',function(e){
  var b=e.target.closest('[data-dt]');if(!b)return;
  if(mode==='edit'&&b.getAttribute('data-dt')!=='info'){toast('수정 중에는 다른 탭으로 이동할 수 없습니다.');return}
  DT=b.getAttribute('data-dt');renderHead();renderFoot();
});
$('fBtns').addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  if(b.id==='bEdit')startEdit();else if(b.id==='bCancel')cancelEdit();else if(b.id==='bSave')save();
});
/* 수정 입력 */
$('tUse').addEventListener('click',function(e){
  var t=e.target;
  var c=t.closest('[data-ust]');if(c){U.st=c.getAttribute('data-ust');U.page=1;renderUse();return}
  var p=t.closest('[data-up]');if(p&&!p.disabled){U.page=+p.getAttribute('data-up');renderUse();}
});
var R$=$('dRight');
R$.addEventListener('input',function(e){
  if(mode!=='edit')return;var t=e.target;
  if(t.hasAttribute('data-f')){var f=t.getAttribute('data-f');dr[f]=f==='lim'?Math.max(1,+t.value||1):t.value}
  else if(t.hasAttribute('data-cta')){var L0=ctaList(dr);dr.ctas=L0.concat((dr.ctas||[]).slice(L0.length));dr.ctas[+t.getAttribute('data-ci')][t.getAttribute('data-cta')]=t.value}
  else if(t.hasAttribute('data-ocl')){dr.opts[+t.getAttribute('data-ocl')].cl=t.value}
  else if(t.hasAttribute('data-sf')){dr.subs[+t.getAttribute('data-si')][t.getAttribute('data-sf')]=t.value}
  else if(t.hasAttribute('data-o')){dr.opts[+t.getAttribute('data-o')][t.getAttribute('data-k')]=t.value}
  else return;
  refreshEdit(false);
});
R$.addEventListener('change',function(e){
  if(mode!=='edit')return;var t=e.target;
  if(t.name==='fuse2'){dr.use=t.value;refreshEdit(false);return}
  if(t.hasAttribute('data-ctaon')){var ci=+t.getAttribute('data-ctaon');dr.ctas=ctaList(dr).concat((dr.ctas||[]).slice(ctaList(dr).length));dr.ctas[ci].on=t.value==='Y';refreshEdit(false);return}
  if(t.name==='ctaType'){dr.ctaType=+t.value;var L=ctaList(dr);dr.ctas=L.concat((dr.ctas||[]).slice(L.length));refreshEdit(true);return}
  if(t.id==='cMode'){dr.cond.mode=t.value;if(t.value==='cond'&&!dr.cond.list.length)dr.cond.list.push({kind:'product',key:'ordertype',values:[]});refreshEdit(true);return}
  if(t.hasAttribute('data-csel')){var i=+t.getAttribute('data-csel'),p=t.value.split(':');dr.cond.list[i]={kind:p[0],key:p[1],values:[]};refreshEdit(true);return}
  if(t.hasAttribute('data-cval')){var j=+t.getAttribute('data-cval'),v=t.value,a=dr.cond.list[j].values;if(t.checked){if(a.indexOf(v)<0)a.push(v)}else dr.cond.list[j].values=a.filter(function(x){return x!==v});
    var w=R$.querySelector('.when');var nw=whenHTML(dr.cond);if(w)w.outerHTML=nw;else R$.querySelector('.cadd').insertAdjacentHTML('afterend',nw);renderChg();return}
});
R$.addEventListener('click',function(e){
  var t=e.target;
  var fh=t.closest('[data-dfold]');
  if(fh){var k=fh.getAttribute('data-dfold');DF[k]=!DF[k];setFold(fh.parentNode,!DF[k]);return}
  var go=t.closest('[data-go]');
  if(go){var id=go.getAttribute('data-go');if(mode==='edit'){toast('수정 중에는 다른 코너로 이동할 수 없습니다.');return}
    if(!cById(id)&&!GROUPS.some(function(g){return g.id===id})){toast('하위 코너('+id+')는 단말 상품 기본 정보 상세에서 확인합니다.');return}
    toast('「'+anyById(id).n+'」 상세로 이동합니다.');setTimeout(function(){openDetail(id)},500);return}

  if(mode!=='edit')return;
  if(t.id==='catOpen'){openCat(dr.cat);return}
  if(t.id==='oAdd'){
    var n=$('oN').value.trim(),d=$('oD').value.trim();
    if(!n){toast('항목명을 입력하세요.');$('oN').focus();return}
    dr.opts.push({n:n,d:d,p:'',b:'',x:'',lk:false,k:'new-'+Date.now()});refreshEdit(true);return;
  }
  var del=t.closest('[data-odel]');
  if(del){if(dr.opts.length<=1){toast('선택 항목은 1개 이상 있어야 합니다.');return}dr.opts.splice(+del.getAttribute('data-odel'),1);refreshEdit(true);return}
  if(t.id==='cAdd'){dr.cond.list.push({kind:'product',key:'ordertype',values:[]});refreshEdit(true);return}
  var cdl=t.closest('[data-cdel]');
  if(cdl){dr.cond.list.splice(+cdl.getAttribute('data-cdel'),1);if(!dr.cond.list.length)dr.cond.mode='none';refreshEdit(true);return}
});
/* 선택지 드래그 (손잡이로만 시작) */
var dragFrom=-1,dragSi=-1;
R$.addEventListener('mousedown',function(e){var h=e.target.closest('.hdl');if(h)h.closest('.orow').setAttribute('draggable','true')});
R$.addEventListener('dragstart',function(e){var r=e.target.closest&&e.target.closest('.orow[data-oi]');if(!r)return;dragFrom=+r.getAttribute('data-oi');dragSi=r.hasAttribute('data-si')?+r.getAttribute('data-si'):-1;r.classList.add('dragging');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(dragFrom))}catch(x){}});
R$.addEventListener('dragover',function(e){var r=e.target.closest('.orow[data-oi]');if(!r||dragFrom<0||(r.hasAttribute('data-si')?+r.getAttribute('data-si'):-1)!==dragSi)return;e.preventDefault();[].forEach.call(R$.querySelectorAll('.drag-over'),function(x){x.classList.remove('drag-over')});r.classList.add('drag-over')});
R$.addEventListener('drop',function(e){var r=e.target.closest('.orow[data-oi]');if(!r||dragFrom<0)return;var si=r.hasAttribute('data-si')?+r.getAttribute('data-si'):-1;if(si!==dragSi)return;e.preventDefault();var to=+r.getAttribute('data-oi');var arr=si>-1?dr.subs[si].opts:dr.opts;var it=arr.splice(dragFrom,1)[0];arr.splice(to,0,it);if(si<0&&dragFrom!==to&&dr.opts.some(function(o){return o.lk}))dr.sort='운영자 지정 순서';dragFrom=-1;dragSi=-1;refreshEdit(true)});
R$.addEventListener('dragend',function(){dragFrom=-1;[].forEach.call(R$.querySelectorAll('.orow[data-oi]'),function(x){x.classList.remove('dragging','drag-over');x.removeAttribute('draggable')})});

/* ===== 상품 조회 팝업 (EPC 요금제, T 기프트, 티다팩, 단말, 부가서비스) ===== */
var EC=null,EQ={f:'',kw:''},ESEL={};
function catItems(){return CATS[EC].items}
function hadIds(){var h={};dr.opts.forEach(function(o){if(o.cid)h[o.cid]=1});return h}
function epcList(){return catItems().filter(function(p){return (!EQ.f||p.cat===EQ.f)&&(!EQ.kw||(p.id+' '+p.n+' '+(p.d||'')+' '+(p.spec||'')).toLowerCase().indexOf(EQ.kw)>-1)})}
function renderEpc(){
  var conf=CATS[EC],L=epcList(),had=hadIds();
  $('eCnt').textContent=L.length;
  $('eBody').innerHTML=L.length?L.map(function(p){var dis=had[p.id];return '<tr class="'+(dis?'dis':'')+'"><td><input type="checkbox" data-eid="'+p.id+'"'+(dis?' disabled checked':(ESEL[p.id]?' checked':''))+' aria-label="'+esc(p.n)+' 선택"></td>'+conf.cols.map(function(cl){var v=p[cl[1]]||'';if(cl[1]==='st')return '<td><span class="ap '+(v==='판매중'||v==='제공중'?'ok':'tmp')+'">'+esc(v)+'</span></td>';return '<td'+(cl[1]==='n'?' class="l"':'')+'>'+esc(v)+(cl[1]==='n'&&dis?'<span class="kd1">추가됨</span>':'')+'</td>'}).join('')+'</tr>'}).join(''):'<tr><td colspan="'+(conf.cols.length+1)+'" class="faint" style="padding:30px;text-align:center">조회된 상품이 없습니다.</td></tr>';
  var n=Object.keys(ESEL).length;$('eAdd').disabled=!n;$('eAdd').textContent=n?'추가하기 ('+n+')':'추가하기';
  var en=L.filter(function(p){return !had[p.id]});$('eAll').checked=en.length>0&&en.every(function(p){return ESEL[p.id]});
}
function openCat(cat){
  EC=cat;var conf=CATS[cat];EQ={f:'',kw:''};ESEL={};
  $('epcT').textContent=conf.t;$('epcSub').textContent=conf.s;
  $('eF1L').textContent=conf.f1[0];$('eLv2').innerHTML=conf.f1[1].map(function(o){return '<option>'+esc(o)+'</option>'}).join('');
  $('eF2L').textContent=conf.f2;
  var cats=[];conf.items.forEach(function(p){if(cats.indexOf(p.cat)<0)cats.push(p.cat)});
  $('eLv3').innerHTML='<option value="">전체</option>'+cats.map(function(o){return '<option>'+esc(o)+'</option>'}).join('');
  $('eKw').value='';$('eKw').placeholder=conf.ph;
  $('eHead').innerHTML='<th style="width:44px"><input type="checkbox" id="eAll" aria-label="전체 선택"></th>'+conf.cols.map(function(cl){return '<th>'+cl[0]+'</th>'}).join('');
  renderEpc();$('epcDim').hidden=false;$('eKw').focus();
}
function closeEpc(){$('epcDim').hidden=true}
$('epcX').onclick=closeEpc;$('eCancel').onclick=closeEpc;
$('epcDim').addEventListener('click',function(e){if(e.target===this)closeEpc()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('epcDim').hidden)closeEpc()});
$('eSearch').onclick=function(){EQ.f=$('eLv3').value;EQ.kw=$('eKw').value.trim().toLowerCase();renderEpc()};
$('eKw').addEventListener('keydown',function(e){if(e.key==='Enter')$('eSearch').onclick()});
$('eReset').onclick=function(){$('eLv3').value='';$('eKw').value='';EQ={f:'',kw:''};renderEpc()};
$('eBody').addEventListener('change',function(e){var id=e.target.getAttribute('data-eid');if(!id)return;if(e.target.checked)ESEL[id]=1;else delete ESEL[id];renderEpc()});
$('eHead').addEventListener('change',function(e){if(e.target.id!=='eAll')return;var had=hadIds(),on=e.target.checked;epcList().forEach(function(p){if(had[p.id])return;if(on)ESEL[p.id]=1;else delete ESEL[p.id]});renderEpc()});
$('eAdd').onclick=function(){
  var ids=Object.keys(ESEL);if(!ids.length)return;
  var fix=dr.opts.filter(function(o){return !o.cid&&o.x==='none'}),rest=dr.opts.filter(function(o){return !(!o.cid&&o.x==='none')});
  catItems().forEach(function(p){if(ESEL[p.id])rest.push(catOpt(EC,p))});
  dr.opts=rest.concat(fix);
  closeEpc();refreshEdit(true);toast('상품 '+ids.length+'개를 추가했습니다.');
};
/* 코너 등록 : 저장하면 목록 맨 위에 추가된다 (src/order-corner-create-v22.ts) */
$('bCreate').onclick=function(){showPage('create');openCornerCreate({setCrumb:setCrumb,toast:toast,onClose:openList,onSaved:function(c){Q.page=1;openList();toast('「'+c.n+'」 코너를 등록했습니다. ('+c.id+')')}})};
setCrumb(['홈','주문 관리','코너 유형 관리']);
renderList();
