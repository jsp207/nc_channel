// @ts-nocheck
// 주문 템플릿 관리 · 등록/상세/수정 화면: order1-create.html
// ref/template-register-3pane-start-mockup-v20.html의 등록 화면(3단 구성: 코너 설정 · 미리보기 · 코너 상세 설정)을 목록과 분리한 페이지.
// 주소로 화면을 고른다: (없음) 신규 등록 · ?copy=ID 복사 등록 · ?id=ID 상세 · ?id=ID&mode=edit 수정
import "./order1.css";
import { requireAuthentication } from "./auth";
import { nextUid, mk4, BY, NOW, withMk, loadTemplates, saveTemplates, $, esc, toast, apBadge, PS, pagerHTML, bindPager } from "./order1-common";

requireAuthentication();

const DATA=loadTemplates();
const LIST='order1.html';
var POOL=[].concat.apply([],mk4().map(function(s){return s.corners}));
function cl(c){var o=JSON.parse(JSON.stringify(c)); o.u=nextUid(); o.p=0; return o}

var stages=[], cur=0, sel=null, copySel=null, vstate='before', vissues=[];
var RO=false, MODE='reg', curT=null;
function cs(){return stages[cur]?stages[cur].corners:[]}
function sname(i){return stages[i].name||'화면 '+(i+1)}
/* 선·후행 / 조건 helpers */
function flat(){var a=[];stages.forEach(function(st,si){st.corners.forEach(function(c){a.push({c:c,si:si})})});return a}
function posOf(id){var f=flat();for(var i=0;i<f.length;i++)if(f[i].c.id===id)return i;return -1}
function byId(id){var f=flat();for(var i=0;i<f.length;i++)if(f[i].c.id===id)return f[i];return null}
function groupsOf(c,ctx){return ctx==='c'?c.cg:c.rules[+ctx.slice(1)].groups}
function allConds(c){
  var o=[];
  if(c.mode==='cond') c.cg.forEach(function(g){g.conds.forEach(function(cd){o.push(cd)})});
  if(c.opts&&c.omode==='cond') c.rules.forEach(function(r){r.groups.forEach(function(g){g.conds.forEach(function(cd){o.push(cd)})})});
  return o;
}
function dependents(id){return flat().map(function(x){return x.c}).filter(function(c){return c.id!==id&&allConds(c).some(function(cd){return cd.src===id})})}
function orderViolation(){
  var f=flat();
  for(var p=0;p<f.length;p++){var cd=allConds(f[p].c);for(var k=0;k<cd.length;k++){var sp=posOf(cd[k].src);if(sp>p){var s2=byId(cd[k].src);return {c:f[p].c,srcN:s2.c.n}}}}
  return null;
}
function iga(w){var ch=w.charCodeAt(w.length-1)-0xAC00;if(ch<0||ch>11171)return '이';return ch%28?'이':'가'}
function condText(groups){
  var gs=groups.map(function(g){
    return g.conds.filter(function(cd){return byId(cd.src)&&cd.vals.length}).map(function(cd){
      var sc=byId(cd.src).c, v=cd.vals.map(function(x){return '‘'+x+'’'}).join(' 또는 ');
      var last=cd.vals[cd.vals.length-1];
      return '‘'+sc.n+'’의 선택값이 '+v+(cd.ex?(iga(last)+' 아닌 경우'):'인 경우');
    }).join(' 그리고 ');
  }).filter(Boolean);
  return gs.join(' 또는 ');
}
function resetCond(c){c.mode='always';c.cg=[{conds:[]}];c.omode='always';c.rules=[];if(c.opts)c.oelse=c.opts.map(function(){return true})}
function hasContent(){return stages.some(function(s){return s.name||s.corners.length})}
function show(id,on){$(id).classList.toggle('show',on)}
function tp(c){return '<span class="pill '+(c.t==='비화면'?'p-nv':c.t==='결제'?'p-purple':(c.t==='상품'?'p-green':'p-blue'))+'">'+c.t+'</span>'}

/* ---------- Alert ---------- */
var alOk=null;
function showAlert(o){
  $('alT').textContent=o.title; $('alB').textContent=o.body||'';
  $('alCancel').hidden=!o.cancel; alOk=o.onOk||null; show('alDim',true);
}
$('alOk').onclick=function(){show('alDim',false);var f=alOk;alOk=null;if(f)f()};
$('alCancel').onclick=function(){show('alDim',false);alOk=null};

/* ---------- 구성 검증 ---------- */
function renderVerify(flash){
  var h;
  if(vstate==='before') h='<div class="vbox before"><p class="vt">아직 검증하지 않았습니다</p><p class="vd">\'전체 구성 검증\'을 클릭하면 코너 간 조건 충돌 / 코너 상태 변경 영향 / 설정 항목을 확인합니다.</p></div>';
  else if(vstate==='ok'){
    if(vissues.length) h='<div class="vbox ok"><p class="vt">검증 완료 - 경고 '+vissues.length+'건</p><p class="vd">오류가 없어 저장할 수 있습니다. 경고 내용을 확인해주세요.</p><div class="vissues">'+vissues.map(function(x){return '<div class="vissue"><span class="vtag warn">경고</span><span>'+esc(x.m)+'</span></div>'}).join('')+'</div></div>';
    else h='<div class="vbox ok"><p class="vt">검증 완료</p><p class="vd">조건 충돌 / 코너 상태 변경 영향 / 설정 항목을 확인했습니다.</p></div>';
  }
  else if(vstate==='recheck') h='<div class="vbox recheck"><p class="vt">구성이 변경되었습니다.</p><p class="vd">이전 검증 결과는 더 이상 유효하지 않습니다. \'전체 구성 검증\'을 다시 실행해주세요.</p></div>';
  else{
    var ne=vissues.filter(function(x){return x.t==='err'}).length, nw=vissues.length-ne;
    h='<div class="vbox fail"><p class="vt">검증 실패 - 오류 '+ne+'건 / 경고 '+nw+'건</p><div class="vissues">'+vissues.map(function(x){return '<div class="vissue"><span class="vtag '+x.t+'">'+(x.t==='err'?'오류':'경고')+'</span><span>'+esc(x.m)+'</span></div>'}).join('')+'</div></div>';
  }
  $('vbox').innerHTML=h;
  if(flash){var b=$('vbox').firstChild;b.classList.add('vflash');}
}
function dirty(){ if(vstate==='ok'||vstate==='fail'){vstate='recheck';renderVerify();} }
function chkGroups(c,groups,label,is){
  var nm='\''+c.n+'\'', cnt=0, p=posOf(c.id);
  groups.forEach(function(g){cnt+=g.conds.length});
  if(!cnt){ is.push({t:'err',m:'[조건] '+nm+' 코너의 '+label+'에 조건이 설정되지 않았습니다.'}); return; }
  groups.forEach(function(g){g.conds.forEach(function(cd){
    var sc=byId(cd.src), sn=sc?'\''+sc.c.n+'\'':'';
    if(!sc||posOf(cd.src)>=p){ is.push({t:'err',m:'[선후행 오류] '+nm+' 코너의 '+label+'이 참조하는 선행 코너가 '+(sc?'뒤에 배치되어 있습니다.':'템플릿에 없습니다.')+' 선행 코너는 앞에 있어야 합니다.'}); return; }
    var n=cd.vals.length, tot=sc.c.sv.length;
    if(!n) is.push({t:'err',m:'[설정 항목] '+nm+' 코너의 '+label+'에서 '+sn+' 선택값이 선택되지 않았습니다.'});
    else if(n===tot&&cd.ex) is.push({t:'err',m:'[조건 충돌] '+nm+' 코너는 설정된 조건이 서로 충돌해 어떤 경우에도 노출되지 않습니다.'});
    else if(n===tot) is.push({t:'warn',m:'[조건] '+nm+' 코너의 조건 '+sn+'에 모든 선택값이 선택되어 항상 노출과 동일합니다.'});
  })});
}
function runVerify(){
  var is=[];
  if(!stages.length) is.push({t:'err',m:'[구성] 화면(단계)이 없습니다. 화면(단계)을 1개 이상 추가해주세요.'});
  stages.forEach(function(s,i){
    if(!s.name) is.push({t:'err',m:'[설정 항목] '+(i+1)+'번째 화면(단계)의 화면명이 입력되지 않았습니다.'});
    if(!s.corners.length) is.push({t:'err',m:'[구성] \''+sname(i)+'\' 화면(단계)에 코너가 없습니다. 코너를 1개 이상 추가해주세요.'});
    s.corners.forEach(function(c){
      var nm='\''+c.n+'\'';
      if(c.mode==='cond') chkGroups(c,c.cg,'노출 조건',is);
      if(c.opts&&c.omode==='cond'){
        if(!c.rules.length) is.push({t:'err',m:'[조건] '+nm+' 코너의 옵션 설정 규칙이 없습니다. 규칙을 추가하거나 \'항상 노출\'로 변경해주세요.'});
        c.rules.forEach(function(r,ri){
          chkGroups(c,r.groups,'규칙 '+(ri+1),is);
          if(!r.opts.some(Boolean)) is.push({t:'err',m:'[설정 항목] '+nm+' 코너 규칙 '+(ri+1)+'의 노출할 선택지가 선택되지 않았습니다.'});
          for(var q=0;q<ri;q++) if(condText(r.groups)&&condText(r.groups)===condText(c.rules[q].groups)){is.push({t:'warn',m:'[조건] '+nm+' 코너의 규칙 '+(ri+1)+'은 규칙 '+(q+1)+'과 조건이 같아 적용되지 않습니다.'});break}
        });
      }
    });
  });
  is.sort(function(a,b){return a.t===b.t?0:(a.t==='err'?-1:1)});
  vissues=is;
  vstate=is.some(function(x){return x.t==='err'})?'fail':'ok';
  renderVerify(true);
}
function requiredOk(){
  if(!$('fName').value.trim()){ showAlert({title:'필수 항목을 입력해주세요.',body:'템플릿명을 입력해주세요.'}); $('fName').focus(); return false; }
  return true;
}

/* ---------- BO progress ---------- */
function renderProg(){return;
  if(!stages.length){
    $('segs').innerHTML='<div class="seg idle"><div class="bar"></div><div class="nm">단계가 없습니다</div></div>';
    $('progPos').textContent='시작 전'; return;
  }
  $('segs').innerHTML=stages.map(function(st,i){return '<div class="seg'+(i<cur?' done':'')+(i===cur?' on':'')+'" data-s="'+i+'"><div class="bar"></div><div class="nm"><i>'+(i+1)+'</i>'+esc(sname(i))+'</div></div>'}).join('');
  $('progPos').textContent='총 '+stages.length+'단계 중 '+(cur+1)+'단계';
}

/* ---------- left ---------- */
function renderLeft(){
  if(RO) return renderLeftRO();
  var h='<div class="card-h"><h3>코너 설정</h3><span class="cnt">총 <b>'+(stages.length?cs().length:0)+'</b>건</span>';
  if(stages.length) h+='<span class="rt"><button class="btn sm" id="bCopyTop" type="button">복사하기</button></span>';
  h+='</div>';
  if(!stages.length){
    h+='<div class="est"><div class="ic">+</div><p>아직 구성된 단계가 없습니다.</p><div class="s">새로 만들거나, 기존 템플릿을 복사해서 시작하세요.</div><div class="eb"><button class="btn lineacc" id="eNew" type="button">새로 만들기</button><button class="btn primary" id="eCopy" type="button">복사하기</button></div></div>';
    $('leftCard').innerHTML=h;
    $('eNew').onclick=function(){stages=[{name:'',corners:[]}];cur=0;sel=null;dirty();all(true)};
    $('eCopy').onclick=function(){openCopy()};
    return;
  }
  h+='<div class="tabs">';
  stages.forEach(function(s,i){
    h+='<div class="tab'+(i===cur?' on':'')+'" data-s="'+i+'"><span class="tn'+(s.name?'':' ph')+'">'+esc(sname(i))+'</span><span class="tdel'+(stages.length<=1?' dis':'')+'" data-d="'+i+'" title="'+(stages.length<=1?'마지막 화면(단계)은 삭제할 수 없습니다.':'화면(단계) 삭제')+'">×</span></div>';
  });
  h+='<div class="tadd" id="tadd" title="화면(단계) 추가">+</div></div>';
  h+='<p class="flbl req">화면명</p><input type="text" class="sname" id="sname" placeholder="내용을 입력하세요." value="'+esc(stages[cur].name)+'">';
  h+='<p class="flbl">코너 설정</p><div id="list"></div>';
  h+='<button class="addbtn" id="addC" type="button">+ 코너 추가하기</button>';
  $('leftCard').innerHTML=h;
  $('bCopyTop').onclick=function(){openCopy()};
  $('tadd').onclick=function(){stages.push({name:'',corners:[]});cur=stages.length-1;sel=null;dirty();all(true);toast('화면(단계)을 추가했어요');$('sname').focus()};
  $('sname').oninput=function(){
    stages[cur].name=this.value;
    var tn=document.querySelector('.tab.on .tn');tn.textContent=sname(cur);tn.classList.toggle('ph',!this.value);
    renderProg(); dirty();
    $('pvcnt').textContent=sname(cur)+' · '+(cur+1)+'/'+stages.length;
  };
  $('addC').onclick=openAdd;
  renderList();
}

/* ---------- v17: EPC 상품(미리보기 전용) ---------- */
var CAPDESC={'256G':'사진 약 51,200장을 저장할 수 있어요','512G':'사진 약 102,400장을 저장할 수 있어요','1T':'사진 약 204,800장을 저장할 수 있어요','2T':'사진 약 409,600장을 저장할 수 있어요'};
var SAMPLE_PROD={sample:1,id:'',n:'갤럭시 Z 폴드8',type:'기기서비스',st:'전시중',model:'SM-F971NV',
  tag:'최적의 비율로 즐기는,<br>세상에서 가장 가벼운 갤럭시 Z 폴드',tags:['장기고객 혜택','인기','워치 결합 할인'],notice:'만 18세 이상 만 34세 미만의 고객님만 가입할 수 있는 상품이에요',
  colors:[{n:'그라파이트',c:'#4a4d57'},{n:'실버',c:'#d9dce3'}],
  caps:[{t:'256G',price:'1,684,000 원'},{t:'512G',price:'1,988,000 원'},{t:'1T',price:'2,557,000 원',r:'품절'},{t:'2T',price:'2,985,000 원',r:'일시품절'}]};
var IP_OPT={colors:[{n:'실버',c:'#d9dce3'},{n:'딥 블루',c:'#2f4a7a'},{n:'코스믹 오렌지',c:'#d9772b'}],
  caps:[{t:'256G',price:'1,990,000 원'},{t:'512G',price:'2,290,000 원'},{t:'1T',price:'2,690,000 원'}]};
var GX_OPT={colors:SAMPLE_PROD.colors,caps:SAMPLE_PROD.caps};
function mkP(id,n,st,model,opt,tag){return {id:id,n:n,type:'기기서비스',st:st,model:model,tag:tag||n,tags:['장기고객 혜택','인기'],notice:'',colors:opt.colors,caps:opt.caps}}
var PRODS=[
  mkP('S26091601xxxx','iPhone Pro 18','전시중','IPH-PRO18',IP_OPT,'프로를 위한 가장 강력한 iPhone'),
  mkP('S26091602xxxx','iPhone Pro Max 18','전시중','IPH-PMX18',IP_OPT,'가장 큰 화면의 iPhone Pro Max'),
  mkP('S26091603xxxx','iPhone 18','전시중','IPH-18',IP_OPT,'새로운 iPhone 18'),
  mkP('S26091604xxxx','iPhone Air 2','예정','IPH-AIR2',IP_OPT,'가장 얇은 iPhone Air 2'),
  mkP('S26091501xxxx','갤럭시 Z 폴드8','전시중','SM-F971NV',GX_OPT,SAMPLE_PROD.tag),
  mkP('S26091502xxxx','갤럭시 Z 플립8','전시중','SM-F771NV',GX_OPT,'언제나 가볍게 접는 갤럭시 Z 플립'),
  mkP('S26091401xxxx','갤럭시 S27 Ultra','전시중','SM-S948NV',GX_OPT,'갤럭시 S27 Ultra')
];
PRODS[4].tags=SAMPLE_PROD.tags; PRODS[4].notice=SAMPLE_PROD.notice;
var loadedProd=null, epcSel=null;
function P(){return loadedProd||SAMPLE_PROD}
function prodOpts(p){return p.colors.map(function(x){return x.n}).concat(p.caps.map(function(x){return x.t}))}
function syncEpc(){ /* v18: 불러온 상품은 미리보기에만 반영. 코너 옵션·조건 규칙에는 연동하지 않음 */ }
function renderPvProd(){
  var el=$('pvprod'), p=loadedProd;
  if(p) el.innerHTML='<span class="tg">미리보기 상품</span><b>'+esc(p.n)+'</b><span class="pid">'+esc(p.id)+'</span><span class="stat '+(p.st==='전시중'?'ok':'wait')+'">'+esc(p.st)+'</span><span class="nt">저장 대상 아님</span><button class="x" id="pvClear" type="button">해제</button>';
  else el.innerHTML='<span class="tg off">미리보기 상품 없음</span><span class="nt g">샘플 화면으로 표시 중 · 상품을 불러오면 실제 상품 정보가 반영됩니다. (저장 대상 아님)</span>';
  var b=$('pvClear'); if(b) b.onclick=function(){clearProd(true)};
}
function applyProd(){syncEpc(); renderPvProd(); all(false); var sc=$('scroll'); if(sc) sc.scrollTop=0;}
function clearProd(msg){ if(!loadedProd) return; loadedProd=null; applyProd(); if(msg) toast('미리보기 상품을 해제했어요. 샘플 화면으로 표시됩니다.'); }
function phoneSVG(col){
  return '<svg class="pimg" viewBox="0 0 220 250" width="170" height="195" aria-hidden="true"><rect x="62" y="14" width="96" height="222" rx="20" fill="'+col+'" stroke="#2b2e3a" stroke-opacity=".25" stroke-width="2"/><rect x="70" y="24" width="80" height="202" rx="13" fill="#fff" fill-opacity=".14"/><rect x="74" y="30" width="38" height="46" rx="11" fill="#1e2230" fill-opacity=".85"/><circle cx="85" cy="42" r="6.5" fill="#6d7488"/><circle cx="85" cy="63" r="6.5" fill="#6d7488"/><circle cx="102" cy="52" r="6.5" fill="#6d7488"/></svg>';
}
function epcOptBody(){
  var p=P(), h='<div class="fo-sec"><div class="fo-sh"><h5>원하는 색상을 골라 주세요</h5></div><div class="fo-sw">';
  p.colors.forEach(function(x,i){ h+= i===0 ? '<i class="on"><b style="background:'+x.c+'"></b></i>' : '<i class="cl" style="background:'+x.c+'"></i>'; });
  h+='</div><span class="fo-cn">선택한 색상 <b>'+esc(p.colors[0].n)+'</b></span></div>';
  h+='<div class="fo-sec" style="padding-top:6px"><div class="fo-sh"><h5>필요한 용량을 선택해 주세요</h5></div>';
  p.caps.forEach(function(x,i){ h+=fcard({t:x.t,pf:1,price:x.price,s:CAPDESC[x.t]||'',r:x.r,on:i===0}); });
  return h+'</div>';
}
function epcPanel(c){
  var p=loadedProd, h='<div class="dsec"><h4>미리보기 연동 정보<small class="d">상품관리 전시정보 기준 · 읽기 전용</small></h4>';
  if(p){
    h+='<div class="kv"><div class="k">미리보기 상품</div><div class="v">'+esc(p.n)+'</div></div><div class="kv"><div class="k">전시 코드</div><div class="v">'+esc(p.id)+'</div></div><div class="kv"><div class="k">운영 상태</div><div class="v"><span class="stat '+(p.st==='전시중'?'ok':'wait')+'">'+esc(p.st)+'</span></div></div>';
  }else h+='<p class="hint">불러온 상품이 없어 디폴트(샘플) 화면으로 표시 중입니다. 미리보기 상단의 \'EPC 상품 불러오기\'로 상품을 불러오면 실제 상품 정보가 반영됩니다.</p>';
  h+='<ul class="epcp" style="margin-top:8px"><li>표시 항목: '+(c.k==='info'?'상품 이미지 · 모델명 · 상품명 · 태그 · 안내 문구':'색상 · 용량 · 옵션별 가격 · 품절 여부')+'</li><li>불러온 상품 정보는 미리보기에만 반영되며 템플릿에 저장되지 않습니다. 저장되는 것은 코너 구성(추가한 코너와 순서·설정)입니다.</li></ul></div>';
  return h;
}
function renderList(){
  var a=cs(), h='';
  if(!a.length) h='<p class="cwarn"><b>아직 코너가 없습니다.</b><br>코너를 한 개 이상 추가해주세요.</p>';
  else h='<div class="lh"><span class="a">노출 순서</span><span class="b">코너</span></div><div class="lscroll">';
  a.forEach(function(c,i){
    var LK='<svg class="lk" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2.2" y="5.4" width="7.6" height="5.2" rx="1.2"/><path d="M4 5.4V3.9a2 2 0 0 1 4 0v1.5"/></svg>';
    h+='<div class="crow'+(c===sel?' sel':'')+'" draggable="'+(RO?'false':'true')+'" data-u="'+c.u+'"><span class="ord" title="드래그하여 노출 순서 변경">'+(RO?'':'<i class="grip">⠿</i>')+(i+1)+'</span><div class="mid"><div class="nm"><span class="t">'+esc(c.n)+'</span></div><div class="sub">'+tp(c)+(c.mode==='cond'?'<span class="pill p-orange">조건 노출</span>':'')+(c.opts&&c.omode==='cond'?'<span class="pill p-orange">옵션 설정</span>':'')+(c.screens?'<span class="pill p-sky">연결 '+c.screens.length+'</span>':'')+'<span>'+c.id+'</span></div></div><div class="btns">'+(RO?'':'<button class="ib" data-a="del">삭제</button>')+'</div></div>';
  });
  if(a.length) h+='</div>';
  if(a.length>1&&!RO) h+='<p class="lhint">⠿ 를 드래그해 노출 순서를 변경합니다. 조건에 사용 중인 선행 코너는 후행 코너보다 앞에 있어야 합니다.</p>';
  $('list').innerHTML=h;
}

/* ---------- middle: FO preview ---------- */
/* ---------- FO 화면 샘플 (실제 상품 화면 기준) ---------- */
var FOSPEC={
 'CN-ORD-0016':[{kind:'기본 화면 · 페이지',q:'원하는 색상을 골라 주세요',sw:1}],
 'CN-ORD-0017':[{kind:'기본 화면 · 페이지',q:'필요한 용량을 선택해 주세요',cards:[
   {t:'256G',pf:1,price:'1,684,000 원',s:'사진 약 51,200장을 저장할 수 있어요',on:1},
   {t:'512G',pf:1,price:'1,988,000 원',s:'사진 약 102,400장을 저장할 수 있어요'},
   {t:'1T',pf:1,price:'2,557,000 원',s:'사진 약 204,800장을 저장할 수 있어요',r:'품절'},
   {t:'2T',pf:1,price:'2,985,000 원',s:'사진 약 409,600장을 저장할 수 있어요',r:'일시품절'}]}],
 'CN-ORD-0001':[
  {kind:'기본 화면 · 페이지',q:'휴대폰을 수령할 방법을 선택해 주세요',cards:[
   {t:'바로도착',s:'평일 18시까지 주문 시 원하는 시간에 배송해 드려요'},
   {t:'행복배송',s:'평일 15시까지 주문 시 전문가가 개통까지 도와드려요'},
   {t:'일반배송',s:'월~토 14시까지 주문 시 다음날 배송해 드려요'},
   {t:'바로픽업',s:'주문하고 가까운 대리점에서 바로 찾아갈 수 있어요'}],
   btn:'배송주소·수취인 입력하기 ›',note:'주소 입력 바텀시트와 변경 주소로 배송방법 재확인은 디자인스튜디오 코너 내부 동작입니다.'},
  {kind:'배송주소 수정 · 수취인 확인 · 바텀시트',sheet:{bgT:'배송방법 탐색·주소 경로 결정',bgM:'기본 화면을 유지한 채 추가 입력창을 엽니다.',title:'배송주소·수취인 확인',desc:'동일한 배송 코너 안에서 열리는 입력 화면입니다. 주소 확정 후 지원 배송방법을 다시 확인합니다.',
    addrs:[{t:'서울 중구 을지로 65, SK-T타워 12층',sel:true},{t:'제주 서귀포시 중문관광로 20 · 바로도착 미지원 예시'}],fields:[['수취인','김티월드'],['연락처','010-0000-0000']],btn:'이 주소로 배송방법 확인',foot:'후속 화면 미리보기 · 실제 입력은 기본 화면 버튼에서 진행'}},
  {kind:'배송가능여부 확인 · 결과 · 페이지',q:'입력하신 주소로 받아보실 수 있어요',msg:'서울 중구 을지로 65, SK-T타워 12층 주소로 일반배송이 가능합니다. 평균 1~2일 내 도착해요.',note:'후속 화면 미리보기 · 배송 가능 여부 결과 화면입니다.'}
 ],
 'CN-ORD-0002':[{kind:'기본 화면 · 페이지',q:'어떤 분이 사용할 휴대폰인가요?',cards:[{t:'직접 사용',s:'가입자(본인)의 정보만 있으면 돼요'},{t:'다른 사람이 사용',s:'주문하시는 분의 정보를 함께 확인해야 해요'}]}],
 'CN-ORD-0003':[{kind:'기본 화면 · 페이지',q:'어떻게 가입할까요?',cards:[{t:'신규가입',s:'SKT에 새로운 번호로 가입해요'},{t:'번호이동',s:'지금 번호 그대로 다른 통신사에서 SKT로 이동해요'},{t:'기기변경',s:'지금 번호 그대로 기기만 바꿔요'}]}],
 'CN-ORD-0004':[{kind:'기본 화면 · 페이지',q:'단말기는 몇 달 동안 납부할까요?',cards:[{t:'일시불로 납부',c:1},{t:'12개월 동안 납부',c:1},{t:'24개월 동안 납부',c:1},{t:'36개월 동안 납부',c:1}]}],
 'CN-ORD-0005':[{kind:'기본 화면 · 페이지',q:'요금제를 선택해 주세요',link:'전체보기',cards:[
   {badge:'이용중',dk:1,t:'무제한',s:'베스트 Pro(유튜브 프리미엄)',price:'월 99,999원',s2:'테더링/공유 120GB | T 멤버십 VIP 혜택 | 스마트 기기2회선 이용 요금 무료',chips:['유튜브 프리미엄 무료','T 우주'],lnk:'자세히 보기'}]}],
 'CN-ORD-0006':[{kind:'기본 화면 · 페이지',q:'어떤 SIM으로 개통하시겠어요?',cards:[
   {t:'eSIM',s:'칩 없이 QR로 바로 개통해요',r:'2,750 원'},{t:'새 USIM 구매',s:'택배로 받아 끼우면 바로 개통돼요',r:'7,700 원'},{t:'가지고 있는 USIM 사용',s:'쓰던 USIM을 그대로 사용해요'},{t:'내장 USIM 사용',s:'쓰던 USIM을 그대로 사용해요'}],acc:'USIM 유의사항'}],
 'CN-ORD-0007':[{kind:'기본 화면 · 페이지',q:'T 기프트 하나를 선택해 주세요',link:'전체보기',sub:'원하는 단말 사은품 하나를 지정한 주소로 보내…',grid:[
   {b:'알로',n:'NEW 휴대용 미니 공기청정기 allo AP500',img:1},{b:'삼성전자',n:'Galaxy Buds Live Pro 16',img:2},{b:'알로',n:'NEW 휴대용 미니 공기청정기 allo AP500',img:1},{b:'삼성전자',n:'Galaxy Buds Live Pro 16',img:2}]}],
 'CN-ORD-0008':[{kind:'기본 화면 · 페이지',q:'원하는 티다팩 쿠폰을 골라 주세요',link:'전체보기',sub:'12개월간 할인 쿠폰 1가지를 매월 발송해드려요.',cards:[
   {badge:'AI PICK',t:'다이소',s:'매월 10,000원 할인 쿠폰',lnk:'자세히 보기 >',logo:'#e8394d',lt:'daiso'},
   {badge:'추천',t:'무신사 머니',s:'매월 10,000원 할인 쿠폰',lnk:'자세히 보기 >',logo:'#3b3b3f',lt:'MUSINSA'},
   {badge:'추천',t:'올리브영',s:'매월 10,000원 할인 쿠폰',lnk:'자세히 보기 >',logo:'#8bd24a',lt:'O'},
   {t:'티다팩 없이 주문 진행'}]}],
 'CN-ORD-0009':[{kind:'기본 화면 · 페이지',q:'바로보상 신청하고 보상금을 받아보세요',link:'바로보상이란?',sub:'쓰던 폰 반납하면 바로 현금으로 보상해…',cards:[{t:'바로보상 신청',s:'쓰던 휴대폰 모델과 상태로 예상 보상금을 확인해요'},{t:'신청 없이 주문 진행'}]}],
 'CN-ORD-0018':[{kind:'기본 화면 · 페이지',q:'소중한 휴대폰, 보험으로 지켜 보세요',link:'전체보기',sub:'떨어뜨리거나 잃어버릴 걱정 없이 쓸 수 있어요',cards:[{badge:'AI PICK',skel:1},{badge:'AI PICK',skel:1},{t:'보험 없이 주문 진행'}]}],
 'CN-ORD-0019':[{kind:'기본 화면 · 페이지',q:'원하는 부가서비스를 더해 보세요',link:'전체보기',sub:'콘텐츠·데이터 등 자주 쓰는 혜택을 추가할 수 …',cards:[
   {badge:'AI PICK',t:'Wavve 앤 데이터',s:'Wavve 무제한 감상 + 매달 데이터',price:'월 9,900 원',lnk:'자세히 보기 >',lt:'wavve',ltc:'#2c6df2'},{t:'부가서비스 없이 주문 진행'}]}],
 'CN-PAY-0001':[{kind:'기본 화면 · 페이지',q:'더 할인받을 수 있는 제휴카드를 확인해 보세요',sub:'자동이체 등록 시 매월 할인 혜택을 받을 수 있어요',cards:[{t:'요금 할인 카드',chev:1},{t:'휴대폰 할인 카드',chev:1},{t:'제휴카드 없이 주문 진행'}]}],
 'CN-PAY-0003':[
  {kind:'기본 화면 · 페이지',q:'쿠폰과 포인트로 추가 할인을 적용해 보세요',cards:[{t:'쿠폰·이용권 선택',r:'로그인 후 조회 ›'},{t:'T 모아 제휴 포인트 적용',r:'조회 ›'},{t:'추가 할인 없이 주문 진행'}],btn:'쿠폰번호 직접 입력 ›'},
  {kind:'연결 화면 · 시트',q:'쿠폰번호를 입력해주세요',input:['쿠폰번호 16자리를 입력하세요'],btn:'확인'}
 ],
 'CN-ORD-0020':[{kind:'기본 화면 · 페이지',q:'주문 정보가 맞는지 확인해 주세요',sum:[
   {big:['월 예상 납부 요금','999,999 원/월'],small:['제휴카드 할인 미적용 시','999,999 원/월']},
   {rows:[['수령 방법','바로픽업'],['지점명','을지로 입구점'],['주소','서울 중구 을지로 65 17층'],['할부 방법','일시불'],['요금제','0 청년 69'],['할인 방법','공동지원금'],['SIM 유형','기존 USIM']]},
   {rows:[['요금제 혜택','FLO 무료'],['T 기프트','NEW 휴대용 미니 공기청정기-블랙-M'],['티다팩','다이소 매월 10,000원 할인 쿠폰'],['바로보상','iPhone 12 Pro Max'],['보험','T ALL케어 플러스 파손형'],['부가서비스','Wavve 앤 데이터'],['휴대폰 할인 제휴카드','신한카드 T 라이트'],['요금 할인 제휴카드','신한카드 T 라이트']]}]}]
};
function fcard(x){
  var h='<div class="fc'+(x.on?' on':'')+(x.c?' cp':'')+(x.chev||x.r&&!x.price?' row':'')+'">';
  if(x.badge) h+='<span class="fbd'+(x.dk?' dk':'')+'">'+esc(x.badge)+'</span>';
  var body='';
  if(x.t) body+='<b>'+esc(x.t)+'</b>';
  if(x.pf&&x.price) body+='<em>'+esc(x.price)+'</em>';
  if(x.s) body+='<small>'+esc(x.s)+'</small>';
  if(x.price&&!x.pf) body+='<em>'+esc(x.price)+'</em>';
  if(x.s2) body+='<small class="s2">'+esc(x.s2)+'</small>';
  if(x.skel) body+='<span class="fsk" style="width:46%"></span><span class="fsk" style="width:70%"></span>';
  if(x.chips) body+='<div class="fchips">'+x.chips.map(function(k){return '<span><i></i>'+esc(k)+'</span>'}).join('')+'</div>';
  if(x.lnk) body+='<u>'+esc(x.lnk)+'</u>';
  h+='<div class="fmain">'+body+'</div>';
  if(x.r) h+='<span class="fr'+(x.price?' tag':'')+'">'+esc(x.r)+'</span>';
  if(x.chev) h+='<span class="fr">›</span>';
  if(x.logo) h+='<span class="flogo" style="background:'+x.logo+'">'+esc(x.lt||'')+'</span>';
  else if(x.lt) h+='<span class="flt" style="color:'+(x.ltc||'#333')+'">'+esc(x.lt)+'</span>';
  return h+'</div>';
}
function foBody(c,idx){
  if(c.epc) return c.k==='info'?prodHTML(P()):epcOptBody();
  if(c.nv) return '<div class="fo-nv"><b>'+esc(c.n)+'(비화면)</b><p>미리보기에서만 표시하는 영역입니다.</p></div>';
  var sp=FOSPEC[c.id]&&FOSPEC[c.id][idx], h='';
  if(!sp){
    var nm=c.screens?c.screens[idx]:c.n;
    return '<div class="fo-sec"><div class="fo-sh"><h5>'+esc(nm)+'</h5></div><div class="fo-sk" style="width:62%"></div><div class="fo-skc" style="margin-top:14px"></div><div class="fo-skc"></div></div>';
  }
  if(sp.sheet){
    var sh=sp.sheet;
    h='<div class="fo-sheetwrap"><div class="fo-dimbg"><b>'+esc(sh.bgT)+'</b><p>'+esc(sh.bgM)+'</p></div><div class="fo-sheet"><i class="fo-grab"></i><div class="fo-sh-h"><b>'+esc(sh.title)+'</b><span>×</span></div><p class="fo-sh-d">'+esc(sh.desc)+'</p>';
    sh.addrs.forEach(function(a){h+='<div class="fo-addr'+(a.sel?' on':'')+'">'+esc(a.t)+'</div>'});
    sh.fields.forEach(function(f){h+='<div class="fo-fld"><small>'+esc(f[0])+'</small><b>'+esc(f[1])+'</b></div>'});
    return h+'<div class="fo-btn dis" style="display:block;text-align:center">'+esc(sh.btn)+'</div><p class="fo-note" style="margin:10px 0 0">'+esc(sh.foot)+'</p></div></div>';
  }
  h='<div class="fo-sec"><div class="fo-sh"><h5>'+esc(sp.q)+'</h5>'+(sp.link?'<u>'+esc(sp.link)+'</u>':'')+'</div>';
  if(sp.sub) h+='<p class="fo-sub">'+esc(sp.sub)+'</p>';
  if(sp.sw) h+='<div class="fo-sw"><i class="on"><b></b></i><i><b></b></i></div>';
  (sp.cards||[]).forEach(function(x){h+=fcard(x)});
  if(sp.grid){h+='<div class="fo-grid">'+sp.grid.map(function(g){return '<div class="fg"><div class="fgi g'+g.img+'"><span class="rdo"></span><div class="gp"></div></div><small>'+esc(g.b)+'</small><b>'+esc(g.n)+'</b><div class="fgb">자세히 보기</div></div>'}).join('')+'</div>'}
  if(sp.acc) h+='<div class="fo-acc"><b>'+esc(sp.acc)+'</b><span>⌄</span></div>';
  (sp.input||[]).forEach(function(x){h+='<div class="fo-in">'+esc(x)+'</div>'});
  if(sp.msg) h+='<div class="fo-msg">'+esc(sp.msg)+'</div>';
  (sp.sum||[]).forEach(function(g){
    if(g.big) h+='<div class="fc sumbig"><div><b>'+esc(g.big[0])+'</b><small>'+esc(g.small[0])+'</small></div><div class="rt"><b>'+esc(g.big[1])+'</b><small>'+esc(g.small[1])+'</small></div></div>';
    else h+='<div class="fc sumrows">'+g.rows.map(function(r){return '<div class="sr"><span>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>'}).join('')+'</div>';
  });
  if(sp.btn) h+='<div class="fo-btn">'+esc(sp.btn)+'</div>';
  if(sp.note) h+='<p class="fo-note">'+esc(sp.note)+'</p>';
  return h+'</div>';
}
function foCorner(c,i){
  var n=c.screens?c.screens.length:0, h='<div class="fo-corner'+(c===sel?' sel':'')+'" data-u="'+c.u+'">';
  if(n>1){
    var sp=FOSPEC[c.id]&&FOSPEC[c.id][c.p];
    h+='<div class="fo-bar"><b>'+esc(c.n)+'</b><div class="fo-pg"><button data-p="-1"'+(c.p===0?' disabled':'')+'>‹</button><span>'+(c.p+1)+'/'+n+'</span><button data-p="1"'+(c.p===n-1?' disabled':'')+'>›</button></div></div>';
    h+='<div class="fo-band">'+esc(sp&&sp.kind?sp.kind:(c.p===0?'기본 화면 · 페이지':'연결 화면 · 페이지'))+'</div>';
  }
  h+=foBody(c,c.p)+'</div>';
  return h;
}
var TAB_SVG='<svg viewBox="0 0 220 250" width="170" height="195" aria-hidden="true"><defs><linearGradient id="tg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe3d9"/><stop offset="1" stop-color="#d8cdea"/></linearGradient><linearGradient id="tg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9c8f2"/><stop offset="1" stop-color="#b79be0"/></linearGradient></defs><rect x="14" y="8" width="192" height="234" rx="12" fill="#4a4a4f"/><rect x="21" y="15" width="178" height="220" rx="7" fill="url(#tg1)"/><circle cx="110" cy="24" r="3.5" fill="#3a3a3f"/><path d="M110 120C70 70 52 60 52 86c0 24 44 34 58 34s58-10 58-34c0-26-18-16-58 34zm0 0c40 50 58 60 58 86 0 26-44 36-58 36s-58-10-58-36c0-26 18-36 58-86z" fill="url(#tg2)" opacity=".75"/></svg>';
function prodHTML(p){
  p=p||P();
  var hero=p.sample?TAB_SVG:phoneSVG(p.colors[0].c);
  return '<div class="fo-prod">'+
  '<div class="fo-hero"><div class="fo-ico"><span>‹</span><span class="r">⇪ ▢ ≡</span></div>'+hero+'</div>'+
  '<div class="fo-pinfo"><small>'+esc(p.model)+'</small><h4>'+p.tag+'</h4><small class="m">'+esc(p.n)+'</small><div class="fo-tags">'+p.tags.map(function(t,i){return '<span'+(i===0?' class="dk"':'')+'>'+esc(t)+'</span>'}).join('')+'</div>'+(p.notice?'<div class="fo-notice">'+esc(p.notice)+'</div>':'')+'</div>'+
  '<div class="fo-tabs"><span class="on">상품 주문</span><span>상품 정보</span><span>구매 후기</span></div>'+
  '<div class="fo-ai"><b>✦ AI 분석 사유</b><p>50대 남성이신 VIP 장기고객 김동님에게 가장 잘 어울리는 조합이 있어요. 고객님과 같은 데이터 헤비유저 직장인분께 특히 유리한 조합이에요.</p></div>'+
  '<div class="fo-opts"><div class="sr"><span>기기 옵션</span><b>'+esc(p.colors[0].n)+' / '+esc(p.caps[Math.min(1,p.caps.length-1)].t)+'</b></div><div class="sr"><span>가입 옵션</span><b>12개월 할부 / 선택약정 24개월<br>5GX 플래티넘 / USIM</b></div><div class="sr"><span>혜택 옵션</span><b>정품케이스 + 25W 충전기<br>올리브영 월 10,000원 쿠폰<br>iPhone 올케어 수리 보험</b></div><div class="fo-pbtn">이 옵션으로 바로 선택하기</div></div></div>';
}
function tailHTML(){
  return '<div class="fo-prod tail"><div class="fo-sec"><div class="fo-sh"><h5>동일한 조건으로 비교한<br>다른 기기도 확인해 보세요</h5></div><p class="fo-sub">5G 프리미엄 · 선택약정 · 24개월 조건으로 적용했어요</p><div class="fo-cmp"><div><div class="cimg a"></div><b>갤럭시 Z폴드 8 울트라</b><small>예상 청구 금액</small><em>999,999원/월</em><small>그라파이트 | 512G</small><span class="curtag">현재 선택한 상품</span><div class="fgb">자세히 보기</div></div><div><div class="cimg b"></div><b>iPhone 17e</b><small>예상 청구 금액</small><em>999,999원/월</em><small>그라파이트 | 512G</small><div class="fgb">자세히 보기</div></div></div></div></div>';
}
function renderPreview(anim){
  $('pvcnt').textContent=stages.length?(sname(cur)+' · '+(cur+1)+'/'+stages.length):'';
  $('foProg').innerHTML=stages.length?stages.map(function(s,i){return '<span'+(i<cur?' class="on"':(i===cur?' class="on now"':''))+'></span>'}).join(''):'<span></span>';
  $('foStepNo').textContent=stages.length?((cur+1)+' / '+stages.length):'';$('foStepNm').textContent=stages.length?sname(cur):'화면 없음';
  var h;
  if(!stages.length || !cs().length) h='<div class="fo-ph">코너 구성 시<br>미리보기가 표시됩니다.</div>';
  else{
    var hasInfo=cs().some(function(x){return x.epc&&x.k==='info'});
    h=(cur===0?(hasInfo?'':prodHTML()):'<div class="fo-pghead"><span>‹</span><b>'+esc(sname(cur))+'</b></div>')+cs().map(foCorner).join('')+(cur===0?tailHTML():'');
  }
  $('sg').innerHTML=h;
  var last=cur===stages.length-1;
  $('foBottom').innerHTML=(stages.length&&cur===0)?'<div class="fo-ins">40대 남성 고객님의 45%가 '+esc(P().colors[0].n)+'를 선택했어요</div><div class="fo-bt"><span class="tlogo">T</span><span class="go">상품 주문하기</span></div>':'<div class="fo-bt"><span class="go">'+(last?'완료':'다음')+'</span></div>';
  if(anim){var g=$('sg');g.classList.remove('slide');void g.offsetWidth;g.classList.add('slide');}
}

/* ---------- right ---------- */
var pk=null;
function posLabel(x){return sname(x.si)+' · '+(stages[x.si].corners.indexOf(x.c)+1)+'번째'}
function condRow(c,ctx,gi,ci,cd,p){
  var sx=byId(cd.src), sp=posOf(cd.src), bad=!sx||sp>=p, vals=sx?sx.c.sv:[];
  var h='<div class="cb-row'+(bad?' bad':'')+'"><div class="cb-name"><span class="cb-cat">선행 코너 선택값</span><b>'+esc(sx?sx.c.n:'(템플릿에 없는 코너)')+'</b>'+(sx?'<span class="cb-pos">'+esc(posLabel(sx))+'</span>':'')+'<button class="mini" type="button" data-act="delc" data-ctx="'+ctx+'" data-g="'+gi+'" data-ci="'+ci+'">삭제</button></div>';
  if(bad){ h+='<p class="cb-err">'+(sx?'선행 코너가 아닙니다. 현재 코너보다 앞에 있는 코너만 사용할 수 있습니다.':'템플릿에 없는 코너입니다.')+' 조건을 삭제하고 다시 설정해주세요.</p></div>'; return h; }
  h+='<div class="cb-f top"><span class="cb-fl">선택값</span><div class="chk">'+vals.map(function(v){return '<label><input type="checkbox" data-f="val" data-ctx="'+ctx+'" data-g="'+gi+'" data-ci="'+ci+'" data-v="'+esc(v)+'"'+(cd.vals.indexOf(v)>-1?' checked':'')+'>'+esc(v)+'</label>'}).join('')+'</div></div>';
  if(!cd.vals.length) h+='<p class="cb-err">선택값을 1개 이상 선택해주세요.</p>';
  return h+'</div>';
}
function pickerHTML(c,g,p,f){
  var used=g.conds.map(function(x){return x.src});
  var items=f.filter(function(x){return x.c!==c&&x.c.sv&&x.c.sv.length&&f.indexOf(x)<p});
  var h='<div class="cb-picker"><input type="search" class="cb-q" id="cbq" placeholder="선행 코너 검색 (예: 가입유형 선택)" value="'+esc(pk.q||'')+'" autocomplete="off"><p class="cb-note">조건은 순서상 앞에 있는 코너의 선택값으로만 만들 수 있어요.</p><div class="cb-list">';
  items.forEach(function(x){
    var after=f.indexOf(x)>p, dup=used.indexOf(x.c.id)>-1, why=after?'이 코너보다 뒤에 있어 사용할 수 없어요':(dup?'이미 추가된 조건이에요':'');
    h+='<button class="cb-opt" type="button" data-act="pick" data-src="'+x.c.id+'" data-n="'+esc(x.c.n)+'"'+(why?' disabled':'')+'><b>'+esc(x.c.n)+'</b><small>'+esc(posLabel(x))+' · '+esc(x.c.sv.join(' / '))+(why?' · '+why:'')+'</small></button>';
  });
  if(!items.length) h+='<p class="cb-note">선택값을 가진 코너가 없어요.</p>';
  return h+'</div><div class="cb-pfoot"><button class="btn sm" type="button" data-act="closepk">닫기</button></div></div>';
}
function cbHTML(c,ctx){
  var groups=groupsOf(c,ctx), f=flat(), p=-1; f.forEach(function(x,i){if(x.c===c)p=i});
  var h='<div class="cb">';
  groups.forEach(function(g,gi){
    if(gi>0) h+='<div class="cb-or"><span>OR</span></div>';
    h+='<div class="cbg"><div class="cbg-h"><span class="kw if">'+(gi?'OR IF':'IF')+'</span><span class="cbg-t">조건 그룹 '+(gi+1)+'</span><span class="cbg-s">그룹 안의 조건을 모두 충족</span>'+(groups.length>1?'<button class="mini" type="button" data-act="delg" data-ctx="'+ctx+'" data-g="'+gi+'">그룹 삭제</button>':'')+'</div><div class="cbg-b">';
    g.conds.forEach(function(cd,ci){if(ci) h+='<div class="cb-and"><span>AND</span></div>'; h+=condRow(c,ctx,gi,ci,cd,p)});
    if(!g.conds.length) h+='<p class="cb-empty">추가된 조건이 없어요.</p>';
    h+='<button class="btn sm" type="button" data-act="addc" data-ctx="'+ctx+'" data-g="'+gi+'">+ 조건 추가</button>';
    if(pk&&pk.ctx===ctx&&pk.g===gi) h+=pickerHTML(c,g,p,f);
    h+='</div></div>';
  });
  h+='<button class="addg" type="button" data-act="addg" data-ctx="'+ctx+'">+ 조건 그룹 추가</button>';
  var t=condText(groups);
  h+='<div class="cb-sent"><span>미리보기</span><p>'+(t?esc(t):'-')+'</p></div></div>';
  return h;
}
function optChecks(c,arr,t){
  var h='<div class="chk">'+c.opts.map(function(o,i){return '<label><input type="checkbox" data-f="opt" data-t="'+t+'" data-i="'+i+'"'+(arr[i]?' checked':'')+'>'+esc(o)+'</label>'}).join('')+'</div>';
  if(!arr.some(Boolean)) h+='<p class="cb-err" style="margin-top:6px">노출할 선택지를 1개 이상 선택해주세요.</p>';
  return h;
}
function renderDetail(){
  if(RO) return renderDetailRO();
  var d=$('detail');
  if(!sel){ d.innerHTML='<div class="dempty">코너를 선택하면<br>상세 설정이 이곳에 표시됩니다.</div>'; return; }
  if(pk&&pk.u!==sel.u) pk=null;
  var c=sel, idx=cs().indexOf(c);
  var h='<div class="dsec"><h4>코너 정보</h4><div class="kv"><div class="k">코너명</div><div class="v">'+esc(c.n)+'</div></div><div class="kv"><div class="k">코너 구분</div><div class="v">'+tp(c)+'</div></div><div class="kv"><div class="k">코너 ID</div><div class="v">'+c.id+'</div></div><div class="kv"><div class="k">화면 내 순서</div><div class="v">'+(idx+1)+'번째/총 '+cs().length+'개</div></div>'+(c.screens?'<div class="kv"><div class="k">연결 화면</div><div class="v">'+c.screens.length+'개</div></div>':'')+'</div>';
  if(c.epc) h+=epcPanel(c);
  /* 옵션 노출 */
  if(c.nv) h+='<div class="dsec"><h4>노출 옵션 설정</h4><p class="hint">옵션 설정 대상이 아닙니다.</p></div>';
  else if(!c.opts) h+='<div class="dsec"><h4>노출 옵션 설정</h4><p class="hint">옵션 설정 대상이 아닙니다.</p></div>';
  if(c.opts){
    h+='<div class="dsec" id="optsec"><h4>노출 옵션 설정<small class="d">'+'코너 안의 선택지 중 무엇을 보여줄지 정합니다.'+'</small></h4><div class="sel selfull"><select id="omode"><option value="always"'+(c.omode==='always'?' selected':'')+'>항상 노출</option><option value="cond"'+(c.omode==='cond'?' selected':'')+'>조건 설정 후 노출</option></select></div>'+(c.epc?'<p class="hint tbd">[TBD] 상품 코너의 조건별 노출 적용 가능 여부, 불러온 상품 옵션 값과 조건 규칙 선택값의 연동 여부는 검토 후 확정합니다.</p>':'');
    if(c.omode==='always') h+='<p class="hint">'+'코너에 기본 설정된 선택지'+'('+esc(c.opts.join(', '))+')가 모두 노출됩니다.</p><p class="hint">예) 가입 방식 선택이 \'신규가입\'이면 일시불만 노출하려면 \'조건 설정 후 노출\'을 선택하세요.</p>';
    else{
      h+='<p class="hint">규칙은 위에서부터 순서대로 판단하며, 처음으로 조건이 맞는 규칙의 선택지만 노출합니다. 어느 규칙에도 해당하지 않으면 코너에 기본 설정된 선택지가 모두 노출됩니다.</p>';
      c.rules.forEach(function(r,ri){
        h+='<div class="rule"><div class="rule-h"><span>규칙 '+(ri+1)+'</span><button class="mini" type="button" data-act="delrule" data-r="'+ri+'">규칙 삭제</button></div>'+cbHTML(c,'r'+ri)+'<div class="res"><span class="kw then">THEN</span><span>아래 선택지<b>만</b> 노출합니다.</span>'+optChecks(c,r.opts,'r'+ri)+'</div></div>';
      });
      h+='<button class="addg" type="button" data-act="addrule" style="width:100%">+ 규칙 추가</button>';
    }
    h+='</div>';
  }
  if(c.screens){
    h+='<div class="dsec"><h4>연결 화면<small>(조회 전용)</small></h4><div class="rolist"><ol>'+c.screens.map(function(x,i){return '<li class="'+(i===c.p?'cur':'')+'">'+esc(x)+'</li>'}).join('')+'</ol><div class="cap">연결 화면은 코너 관리에서 등록합니다.</div></div></div>';
  }
  var keep=d.scrollTop; d.innerHTML=h;
}
/* detail events (delegated) */
function dtGroup(el){return groupsOf(sel,el.getAttribute('data-ctx'))[+el.getAttribute('data-g')]}
$('detail').addEventListener('click',function(e){
  var b=e.target.closest('[data-act]'); if(!b||!sel) return;
  var a=b.getAttribute('data-act'), c=sel;
  if(a==='addc'){ pk={u:c.u,ctx:b.getAttribute('data-ctx'),g:+b.getAttribute('data-g'),q:''}; }
  else if(a==='closepk'){ pk=null; }
  else if(a==='gotoopt'){ var o=document.getElementById('optsec'); if(o) o.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  else if(a==='pick'){ if(b.disabled) return; var g=groupsOf(c,pk.ctx)[pk.g]; g.conds.push({src:b.getAttribute('data-src'),ex:false,vals:[]}); pk=null; dirty(); }
  else if(a==='delc'){ dtGroup(b).conds.splice(+b.getAttribute('data-ci'),1); dirty(); }
  else if(a==='addg'){ groupsOf(c,b.getAttribute('data-ctx')).push({conds:[]}); dirty(); }
  else if(a==='delg'){ groupsOf(c,b.getAttribute('data-ctx')).splice(+b.getAttribute('data-g'),1); pk=null; dirty(); }
  else if(a==='addrule'){ c.rules.push({groups:[{conds:[]}],opts:c.opts.map(function(){return false})}); dirty(); }
  else if(a==='delrule'){ c.rules.splice(+b.getAttribute('data-r'),1); pk=null; dirty(); }
  else return;
  renderDetail(); renderList();
});
$('detail').addEventListener('change',function(e){
  var t=e.target, c=sel; if(!c) return;
  if(t.id==='mode'){ c.mode=t.value; if(c.mode==='cond'&&!c.cg.length) c.cg=[{conds:[]}]; pk=null; dirty(); renderDetail(); renderList(); return; }
  if(t.id==='omode'){ c.omode=t.value; if(c.omode==='cond'&&!c.rules.length) c.rules=[{groups:[{conds:[]}],opts:c.opts.map(function(){return false})}]; pk=null; dirty(); renderDetail(); renderList(); return; }
  var f=t.getAttribute('data-f'); if(!f) return;
  if(f==='val'){ var cd2=dtGroup(t).conds[+t.getAttribute('data-ci')], v=t.getAttribute('data-v'), k=cd2.vals.indexOf(v); if(t.checked&&k<0)cd2.vals.push(v); if(!t.checked&&k>-1)cd2.vals.splice(k,1); var src=byId(cd2.src); if(src) cd2.vals.sort(function(x,y){return src.c.sv.indexOf(x)-src.c.sv.indexOf(y)}); }
  else if(f==='opt'){ var tt=t.getAttribute('data-t'), arr=tt==='else'?c.oelse:c.rules[+tt.slice(1)].opts; arr[+t.getAttribute('data-i')]=t.checked; }
  dirty(); renderDetail();
});
$('detail').addEventListener('input',function(e){
  if(e.target.id!=='cbq'||!pk) return;
  pk.q=e.target.value; var q=pk.q.trim().toLowerCase();
  [].slice.call($('detail').querySelectorAll('.cb-opt')).forEach(function(x){x.style.display=(!q||x.getAttribute('data-n').toLowerCase().indexOf(q)>-1)?'':'none'});
});
function all(anim){renderLeft();renderPreview(anim);renderDetail();}
function pick(c,noScroll){
  if(sel!==c) pk=null;
  sel=c; renderList(); renderPreview(false); renderDetail();
  var el=$('sg').querySelector('.fo-corner[data-u="'+c.u+'"]'); if(el&&!noScroll) $('scroll').scrollTo({top:Math.max(0,el.offsetTop-8),behavior:'smooth'});
}
function byU(u){return cs().filter(function(c){return c.u===+u})[0]}

/* ---------- events ---------- */
$('leftCard').addEventListener('click',function(e){
  var del=e.target.closest('.tdel');
  if(del){
    e.stopPropagation();
    var i=+del.getAttribute('data-d');
    if(stages.length<=1){toast('마지막 화면(단계)은 삭제할 수 없습니다.');return}
    function doDel(){stages.splice(i,1); if(cur>=stages.length) cur=stages.length-1; else if(i<cur) cur--; sel=null; dirty(); all(true);}
    if(stages[i].corners.length) showAlert({title:'화면(단계)을 삭제하시겠습니까?',body:'화면(단계) 내 코너 '+stages[i].corners.length+'개도 함께 삭제됩니다.',cancel:true,onOk:doDel});
    else doDel();
    return;
  }
  var t=e.target.closest('.tab');
  if(t){var i2=+t.getAttribute('data-s'); if(i2!==cur){cur=i2;sel=null;$('scroll').scrollTop=0;all(true)} return;}
  var row=e.target.closest('.crow');
  if(row){
    var c=byU(row.getAttribute('data-u')), b=e.target.closest('button[data-a]');
    if(b){
      var a=cs(), i3=a.indexOf(c);
      if(b.getAttribute('data-a')==='del'){
        var deps=dependents(c.id);
        if(deps.length){ showAlert({title:'코너를 삭제할 수 없습니다',body:'후행 코너를 먼저 삭제해주세요.'}); return; }
        a.splice(i3,1); if(sel===c) sel=null;
        dirty(); renderList(); renderPreview(false); renderDetail(); document.querySelector('#leftCard .cnt b').textContent=cs().length;
      }
      return;
    }
    pick(c);
  }
});
/* 노출 순서 drag & drop */
var dragU=null;
function clearDrop(){[].slice.call(document.querySelectorAll('.crow.dropa,.crow.dropb,.crow.dragging')).forEach(function(x){x.classList.remove('dropa','dropb','dragging')})}
$('leftCard').addEventListener('dragstart',function(e){
  var r=e.target.closest&&e.target.closest('.crow'); if(!r) return;
  dragU=r.getAttribute('data-u'); e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',dragU)}catch(_){}
  setTimeout(function(){r.classList.add('dragging')},0);
});
$('leftCard').addEventListener('dragover',function(e){
  var r=e.target.closest&&e.target.closest('.crow'); if(!r||dragU==null) return;
  e.preventDefault(); e.dataTransfer.dropEffect='move';
  [].slice.call(document.querySelectorAll('.crow.dropa,.crow.dropb')).forEach(function(x){x.classList.remove('dropa','dropb')});
  var rc=r.getBoundingClientRect(); r.classList.add(e.clientY>rc.top+rc.height/2?'dropa':'dropb');
});
$('leftCard').addEventListener('drop',function(e){
  var r=e.target.closest&&e.target.closest('.crow'); if(!r||dragU==null) return;
  e.preventDefault();
  var rc=r.getBoundingClientRect(), after=e.clientY>rc.top+rc.height/2, tu=r.getAttribute('data-u'), du=dragU;
  clearDrop(); dragU=null;
  if(tu===du) return;
  var a=cs(), c=byU(du), t=byU(tu), old=a.slice();
  a.splice(a.indexOf(c),1); a.splice(a.indexOf(t)+(after?1:0),0,c);
  if(old.every(function(x,i){return x===a[i]})) return;
  var v=orderViolation();
  if(v){ a.length=0; old.forEach(function(x){a.push(x)}); renderList(); showAlert({title:'순서를 변경할 수 없습니다',body:'선행 코너는 항상 앞에 위치해야 합니다.'}); return; }
  dirty(); renderList(); renderPreview(false); renderDetail(); toast('노출 순서가 변경되었습니다.');
});
$('leftCard').addEventListener('dragend',function(){clearDrop();dragU=null});
$('sg').addEventListener('click',function(e){
  var box=e.target.closest('.fo-corner'); if(!box) return; var c=byU(box.getAttribute('data-u'));
  var b=e.target.closest('button[data-p]');
  if(b){ var n=c.p+(+b.getAttribute('data-p')); c.p=Math.max(0,Math.min(c.screens.length-1,n)); var keep=$('scroll').scrollTop; renderPreview(false); $('scroll').scrollTop=keep; if(sel===c) renderDetail(); return; }
  pick(c);
});

/* ---------- 체크박스 전체 선택 (공통) ---------- */
function bindAll(a0,a1,a2,fn){
  $(a0).onchange=function(){ $(a1).checked=this.checked; $(a2).checked=this.checked; fn(); };
  $(a1).onchange=$(a2).onchange=function(){ $(a0).checked=$(a1).checked&&$(a2).checked; fn(); };
}

/* ---------- 템플릿 복사하기 popup (PU02) ---------- */
var copyPage=1;
function filtered(){
  var kd=$('fType').value, k=$('fKey').value.trim().toLowerCase();
  return DATA.filter(function(d){
    if(!k) return true;
    var a=d.n.toLowerCase().indexOf(k)>-1, b=d.id.toLowerCase().indexOf(k)>-1;
    return kd==='n'?a:(kd==='i'?b:(a||b));
  });
}
function renderRows(){
  var list=filtered(), tb=$('rows'); tb.innerHTML='';
  if(copySel && !list.some(function(d){return d.id===copySel})) copySel=null;
  var tp=Math.max(1,Math.ceil(list.length/PS)); if(copyPage>tp) copyPage=tp;
  list.slice((copyPage-1)*PS,copyPage*PS).forEach(function(d){
    var tr=document.createElement('tr'); if(copySel===d.id) tr.className='sel';
    tr.innerHTML='<td><span class="rd"></span></td><td>'+d.cat+'</td><td>'+d.id+'</td><td class="l">'+d.n+'</td>';
    tr.onclick=function(){copySel=d.id;renderRows()};
    tb.appendChild(tr);
  });
  $('cnt2').innerHTML='검색 결과 <b>'+list.length+'</b>건';
  $('emptyMsg').hidden=!!list.length;
  $('copyPager').innerHTML=pagerHTML(list.length,copyPage);
  $('copyOk').disabled=!copySel;
}
function openCopy(){copySel=null;copyPage=1;$('fType').value='';$('fKey').value='';renderRows();show('addDim',false);show('copyDim',true)}
function closeCopy(){show('copyDim',false)}
function applyCopy(){
  var d=DATA.filter(function(x){return x.id===copySel})[0];
  stages=d.mk(); cur=0; sel=null; closeCopy(); syncEpc(); dirty(); all(true);
  if(stages[0].corners.length) pick(stages[0].corners[0],true);
  toast('화면(단계)·코너가 복사되었습니다. 기본 정보는 유지됩니다.');
}
$('fBtn').onclick=function(){copyPage=1;renderRows()};
$('copyReset').onclick=function(){$('fType').value='';$('fKey').value='';copySel=null;copyPage=1;renderRows()};
$('fKey').addEventListener('keydown',function(e){if(e.key==='Enter'){copyPage=1;renderRows()}});
bindPager('copyPager',function(g){copyPage=g;renderRows()});
$('copyX').onclick=closeCopy; $('copyCancel').onclick=closeCopy;
$('copyOk').onclick=function(){
  if($('copyOk').disabled) return;
  if(hasContent()) showAlert({title:'현재 구성이 대체됩니다.',body:'선택한 템플릿 구성으로 현재 화면(단계)과 코너가 모두 대체됩니다.\n계속하시겠습니까?',cancel:true,onOk:applyCopy});
  else applyCopy();
};

/* ---------- 코너 추가하기 popup (PU01) ---------- */
var addSel={}, addPage=1;
function addUsed(){var u={};stages.forEach(function(s){s.corners.forEach(function(c){u[c.id]=1})});return u}
function addFiltered(){
  var used=addUsed(), kd=$('aKind').value, k=$('aKey').value.trim().toLowerCase();
  return POOL.map(function(c,i){return {c:c,i:i,used:!!used[c.id]}}).filter(function(x){
    if(x.used?!$('aS1').checked:!$('aS2').checked) return false;
    if(!k) return true;
    var a=x.c.n.toLowerCase().indexOf(k)>-1, b=x.c.id.toLowerCase().indexOf(k)>-1;
    return kd==='n'?a:(kd==='i'?b:(a||b));
  });
}
function renderAdd(){
  var list=addFiltered(), tb=$('aRows'); tb.innerHTML='';
  var tp=Math.max(1,Math.ceil(list.length/PS)); if(addPage>tp) addPage=tp;
  list.slice((addPage-1)*PS,addPage*PS).forEach(function(x){
    var tr=document.createElement('tr'); if(x.used) tr.className='dis';
    tr.innerHTML='<td><input type="checkbox" data-i="'+x.i+'"'+(x.used?' disabled':'')+(addSel[x.i]?' checked':'')+'></td><td>'+x.c.id+'</td><td class="l">'+esc(x.c.n)+'</td><td>'+tp_(x.c)+'</td><td><span class="pill '+(x.used?'p-grey':'p-blue')+'">'+(x.used?'추가됨':'미추가')+'</span></td>';
    tb.appendChild(tr);
  });
  $('aCnt').innerHTML='검색 결과 <b>'+list.length+'</b>건';
  $('aEmpty').hidden=!!list.length;
  $('aPager').innerHTML=pagerHTML(list.length,addPage);
}
var tp_=tp;
function openAdd(){
  addSel={}; addPage=1; $('aS0').checked=$('aS1').checked=$('aS2').checked=true; $('aKind').value=''; $('aKey').value='';
  renderAdd(); show('addDim',true);
}
$('aRows').addEventListener('change',function(e){var t=e.target; if(t.type==='checkbox') addSel[t.getAttribute('data-i')]=t.checked});
bindAll('aS0','aS1','aS2',function(){addPage=1;renderAdd()});
$('aBtn').onclick=function(){addPage=1;renderAdd()};
$('aReset').onclick=function(){$('aS0').checked=$('aS1').checked=$('aS2').checked=true;$('aKind').value='';$('aKey').value='';addPage=1;renderAdd()};
$('aKey').addEventListener('keydown',function(e){if(e.key==='Enter'){addPage=1;renderAdd()}});
bindPager('aPager',function(g){addPage=g;renderAdd()});
$('addX').onclick=$('addCancel').onclick=function(){show('addDim',false)};
$('addOk').onclick=function(){
  var ids=Object.keys(addSel).filter(function(k){return addSel[k]});
  if(!ids.length){toast('추가할 코너를 선택해주세요.');return}
  var last; ids.forEach(function(k){last=cl(POOL[+k]);resetCond(last);cs().push(last)});
  show('addDim',false); dirty(); all(false); pick(last); toast('코너 '+ids.length+'개가 추가되었습니다.');
};

/* ---------- basic info ---------- */
[].slice.call(document.querySelectorAll('.clr')).forEach(function(b){b.onclick=function(){var i=$(b.getAttribute('data-clr'));i.value='';i.focus()}});

/* ---------- action bar ---------- */
$('bCancel').onclick=function(){showAlert({title:'취소하시겠습니까?',body:(MODE==='edit'?'수정한 내용은 저장되지 않습니다. 취소하고 상세 화면으로 이동하시겠습니까?':'입력한 내용은 저장되지 않습니다. 취소하고 목록 화면으로 이동하시겠습니까?'),cancel:true,onOk:function(){ if(MODE==='edit'&&curT) openForm('detail',curT); else openList(); }})};
$('bVerify').onclick=function(){ if(!requiredOk()) return; runVerify(); $('vsec').scrollIntoView({behavior:'smooth',block:'center'}); };
$('bSave').onclick=function(){
  if(vstate==='ok'){ showAlert({title:'저장하시겠습니까?',body:'저장 시 승인 요청이 진행됩니다. 저장하시겠습니까?',cancel:true,onOk:doSave}); }
  else if(vstate==='fail'){ showAlert({title:'검증에 실패했습니다',body:'검증에 실패하여 저장이 불가합니다'}); }
  else if(vstate==='recheck'){ showAlert({title:'검증을 재진행해주세요',body:'구성이 변경되어 재검증이 필요합니다.'}); }
  else { showAlert({title:'전체 구성 검증을 진행해주세요',body:'구성 검증 완료 시 저장 가능합니다.'}); }
};

/* ---------- EPC 상품 조회 popup (PU03) ---------- */
var ePage=1;
function efiltered(){
  var kd=$('eKind').value, k=$('eKey').value.trim().toLowerCase();
  return PRODS.filter(function(p){
    if(p.st==='전시중'?!$('eS1').checked:!$('eS2').checked) return false;
    if(!k) return true;
    var a=p.n.toLowerCase().indexOf(k)>-1, b=p.id.toLowerCase().indexOf(k)>-1;
    return kd==='n'?a:(kd==='i'?b:(a||b));
  });
}
function renderEpcRows(){
  var list=efiltered(), tb=$('eRows'); tb.innerHTML='';
  if(epcSel&&!list.some(function(p){return p.id===epcSel})) epcSel=null;
  var tp=Math.max(1,Math.ceil(list.length/PS)); if(ePage>tp) ePage=tp;
  list.slice((ePage-1)*PS,ePage*PS).forEach(function(p){
    var tr=document.createElement('tr'); if(epcSel===p.id) tr.className='sel';
    tr.innerHTML='<td><span class="rd"></span></td><td>'+p.id+'</td><td class="l">'+esc(p.n)+'</td><td>'+p.type+'</td><td><span class="stat '+(p.st==='전시중'?'ok':'wait')+'">'+p.st+'</span></td>';
    tr.onclick=function(){epcSel=p.id;renderEpcRows()};
    tb.appendChild(tr);
  });
  $('eCnt').innerHTML='검색 결과 <b>'+list.length+'</b>건';
  $('eEmpty').hidden=!!list.length;
  $('ePager').innerHTML=pagerHTML(list.length,ePage);
  $('eOk').disabled=!PRODS.some(function(p){return p.id===epcSel});
}
function resetEpc(){$('eS0').checked=$('eS1').checked=$('eS2').checked=true;$('eKind').value='';$('eKey').value='';ePage=1}
function openEpc(){resetEpc();epcSel=loadedProd?loadedProd.id:null;renderEpcRows();show('addDim',false);show('copyDim',false);show('epcDim',true)}
function closeEpc(){show('epcDim',false)}
$('bEpc').onclick=openEpc; $('epcX').onclick=closeEpc; $('eCancel').onclick=closeEpc;
$('eBtn').onclick=function(){ePage=1;renderEpcRows()}; $('eReset').onclick=function(){resetEpc();epcSel=null;renderEpcRows()};
$('eKey').addEventListener('keydown',function(e){if(e.key==='Enter'){ePage=1;renderEpcRows()}});
bindAll('eS0','eS1','eS2',function(){ePage=1;renderEpcRows()});
bindPager('ePager',function(g){ePage=g;renderEpcRows()});
$('eOk').onclick=function(){
  var p=PRODS.filter(function(x){return x.id===epcSel})[0]; if(!p) return;
  loadedProd=p; closeEpc(); applyProd(); toast(p.n+' 정보를 불러왔어요. 미리보기에만 반영되며 저장되지 않습니다.');
};
$('fProd').addEventListener('change',function(){ if(loadedProd&&loadedProd.type!==this.value){ loadedProd=null; applyProd(); toast('연결 대상 상품 유형이 변경되어 미리보기 상품을 해제했어요.'); } });


/* ===== v20: 등록 / 상세 / 수정 (목록은 order1.html) ===== */
function setView(){document.body.classList.toggle('ro-mode',RO);window.scrollTo(0,0)}
function tById(id){return DATA.filter(function(d){return d.id===id})[0]}
function openList(q){location.href=LIST+(q||'')}
// 지금 화면을 주소에 남겨 새로고침·공유해도 같은 화면이 열린다
function syncUrl(){
  var q=MODE==='reg'?'':'?id='+encodeURIComponent(curT.id)+(MODE==='edit'?'&mode=edit':'');
  history.replaceState(null,'',location.pathname+q);
}

/* --- 등록 / 수정 / 상세 --- */
function setUse(u,canY,msg){$('uY').disabled=!canY;$('uY').checked=!!u;$('uN').checked=!u;$('uHint').textContent=msg}
function openForm(mode,t,copy){
  MODE=mode;curT=t||null;RO=mode==='detail';
  var T0={reg:'템플릿 등록',edit:'템플릿 수정',detail:'템플릿 상세'}[mode];
  $('crCur').textContent=T0;$('pgTitle').textContent=T0;
  $('ptabs').hidden=!RO;$('secBasic').hidden=RO;$('secDInfo').hidden=!RO;$('vsec').hidden=RO;
  $('footForm').hidden=RO;$('footDet').hidden=!RO;$('bEpc').hidden=RO;$('pvprod').hidden=RO;
  $('hCat').hidden=$('hProd').hidden=mode!=='edit';
  if(mode==='reg'){
    $('fCat').value='전시 상품 템플릿';$('fProd').value='기기서비스';$('fName').value='';$('fDesc').value='';$('fId').textContent='등록 시 자동채번';
    setUse(false,false,'등록 시 N 고정 · 승인 완료 후 Y 선택 가능');
  }else{
    $('fCat').value=t.cat;$('fProd').value=t.pt;$('fName').value=t.n;$('fDesc').value=t.desc||'';$('fId').textContent=t.id;
    var can=t.ap==='승인 완료';
    setUse(t.u,can,can?'승인 완료된 템플릿은 Y / N 선택 가능':'승인 완료 전에는 N 고정 · 승인 완료 후 Y 선택 가능');
    if(RO) $('dInfo').innerHTML=[['카테고리',t.cat],['연결 대상 상품 유형',t.pt],['템플릿 ID',t.id],['템플릿명',esc(t.n)],['설명',esc(t.desc||'-')],['연결된 상품 수',t.cnt+'건'],['사용 여부',t.u?'Y':'N'],['승인 상태',apBadge(t.ap)]].map(function(x){return '<div class="th"><span>'+x[0]+'</span></div><div class="td">'+x[1]+'</div>'}).join('');
  }
  stages=mode==='reg'?(copy?copy.mk():[]):t.mk();
  cur=0;sel=null;vstate='before';vissues=[];loadedProd=null;pk=null;copySel=null;
  renderVerify();renderPvProd();all(false);
  var c0=stages[0]&&stages[0].corners;
  if(c0&&c0.length) pick(RO?(c0.filter(function(c){return c.n==='기기 납부 방식 선택'})[0]||c0[0]):c0[0],true);
  setTab('info');setView();syncUrl();document.title=T0+' | 주문 템플릿 관리';
  if(copy) toast('"'+copy.n+'"의 화면(단계)·코너를 복사했어요. 기본 정보는 새로 입력해주세요.');
}
function setTab(k){
  [].forEach.call(document.querySelectorAll('#ptabs .ptab'),function(b){b.classList.toggle('on',b.getAttribute('data-t')===k)});
  $('paneMain').hidden=k!=='info';$('paneHist').hidden=k!=='hist';
  if(k==='hist') renderHist();
}

/* --- 읽기 전용 (상세) --- */
function renderLeftRO(){
  var h='<div class="card-h"><h3>코너 설정</h3><span class="cnt">총 <b>'+cs().length+'</b>건</span></div>';
  if(!stages.length){$('leftCard').innerHTML=h+'<p class="hint">구성된 화면(단계)이 없습니다.</p>';return}
  h+='<div class="tabs">'+stages.map(function(s,i){return '<div class="tab'+(i===cur?' on':'')+'" data-s="'+i+'"><span class="tn">'+esc(sname(i))+'</span></div>'}).join('')+'</div>';
  h+='<p class="flbl">화면명</p><div class="ro" style="width:100%;margin-bottom:12px">'+esc(sname(cur))+'</div><p class="flbl">코너 설정</p><div id="list"></div>';
  $('leftCard').innerHTML=h; renderList();
}
function renderDetailRO(){
  var d=$('detail');
  if(!sel){d.innerHTML='<div class="dempty">코너를 선택하면<br>상세 설정이 이곳에 표시됩니다.</div>';return}
  var c=sel, idx=cs().indexOf(c);
  var h='<div class="dsec"><h4>코너 정보</h4><div class="kv"><div class="k">코너명</div><div class="v">'+esc(c.n)+'</div></div><div class="kv"><div class="k">코너 구분</div><div class="v">'+tp(c)+'</div></div><div class="kv"><div class="k">코너 ID</div><div class="v">'+c.id+'</div></div><div class="kv"><div class="k">화면 내 순서</div><div class="v">'+(idx+1)+'번째/총 '+cs().length+'개</div></div>'+(c.screens?'<div class="kv"><div class="k">연결 화면</div><div class="v">'+c.screens.length+'개</div></div>':'')+'</div>';
  h+='<div class="dsec"><h4>노출 옵션 설정</h4>';
  if(c.nv||!c.opts) h+='<p class="hint">옵션 설정 대상이 아닙니다.</p>';
  else if(c.omode!=='cond') h+='<div class="ro" style="width:100%">항상 노출</div><p class="hint">코너에 기본 설정된 선택지('+esc(c.opts.join(', '))+')가 모두 노출됩니다.</p>';
  else{
    h+='<div class="ro" style="width:100%">조건 설정 후 노출</div>';
    c.rules.forEach(function(r,ri){
      var on=c.opts.filter(function(o,i){return r.opts[i]});
      h+='<div class="rule"><div class="rule-h"><span>조건 그룹 '+(ri+1)+'</span></div><div class="rule-b"><div class="ifrow"><span class="kw if">IF</span><div class="cb-sent" style="border:0;padding:0"><p>'+esc(condText(r.groups)||'-')+'</p></div></div><div class="ifrow"><span class="kw then">THEN</span><div><p class="thenlbl" style="margin:3px 0 8px">아래 선택지만 노출합니다.</p><div style="display:flex;gap:6px;flex-wrap:wrap">'+(on.length?on.map(function(o){return '<span class="chip">'+esc(o)+'</span>'}).join(''):'<span class="hint" style="margin:0">선택된 선택지 없음</span>')+'</div></div></div></div></div>';
    });
    h+='<p class="hint">조건 설정 내용은 읽기 전용입니다. 변경하려면 수정 화면에서 진행해주세요.</p>';
  }
  h+='</div>';
  if(c.screens) h+='<div class="dsec"><h4>연결 화면<small>(조회 전용)</small></h4><div class="rolist"><ol>'+c.screens.map(function(x,i){return '<li class="'+(i===c.p?'cur':'')+'">'+esc(x)+'</li>'}).join('')+'</ol></div></div>';
  d.innerHTML=h;
}

/* --- 변경/승인 이력 --- */
function histOf(t){
  if(t.hist) return t.hist;
  var AP='정지솔(SSP12344)', R='신규 템플릿 등록 요청입니다.', rd=t.dt+':11', h=[];
  if(t.id==='CTN-ORD-001') h=[
    {st:'승인완료',req:'김지훈(SSP2332)',rd:'2026.10.08 10:12:06',rs:'노출 옵션 조건 수정 요청입니다.',ap:AP,pd:'2026.10.08 10:30:21',pr:'',ver:'V.2'},
    {st:'반려',req:'김지훈(SSP2332)',rd:'2026.10.05 11:20:41',rs:'코너 순서 변경 요청입니다.',ap:AP,pd:'2026.10.05 14:02:10',pr:'추가 수정사항 발생',ver:''},
    {st:'승인완료',req:'김지훈(SSP2332)',rd:'2026.09.29 09:10:03',rs:R,ap:AP,pd:'2026.09.29 09:40:55',pr:'',ver:'V.1'}];
  else if(t.ap==='승인 완료') h=[{st:'승인완료',req:'김지훈(SSP2332)',rd:rd,rs:R,ap:AP,pd:t.dt+':40',pr:'',ver:'V.1'}];
  else if(t.ap==='승인 대기') h=[{st:'승인요청',req:'김지훈(SSP2332)',rd:rd,rs:R,ap:AP,pd:'',pr:'',ver:''}];
  else if(t.ap==='반려') h=[{st:'반려',req:'김지훈(SSP2332)',rd:rd,rs:R,ap:AP,pd:t.dt+':40',pr:'코너 간 순서 변경이 필요합니다.',ver:''}];
  else if(t.ap==='요청 취소') h=[{st:'요청취소',req:'김지훈(SSP2332)',rd:rd,rs:R,ap:AP,pd:t.dt+':40',pr:'-',ver:''}];
  t.hist=h; return h;
}
function hBadge(s){var m={'승인요청':'tmp','승인완료':'ok','반려':'rej','요청취소':'can'};return '<span class="stat '+m[s]+'">'+s+'</span>'}
function renderHist(){
  var h=histOf(curT);
  $('hBody').innerHTML=h.map(function(r,i){
    return '<tr><td>'+(h.length-i)+'</td><td>'+hBadge(r.st)+'</td><td>'+r.req+'</td><td>'+r.rd+'</td><td class="l">'+esc(r.rs)+'</td><td>'+r.ap+'</td><td>'+(r.st==='승인요청'?'<button class="btn sm" type="button" data-hc="'+i+'">요청 취소</button>':r.pd)+'</td><td class="l">'+esc(r.pr)+'</td><td><button class="btn sm" type="button" data-hd="'+i+'">상세보기</button></td><td>'+(r.ver?'<a data-hv="'+r.ver+'">'+r.ver+'</a>':'')+'</td></tr>';
  }).join('');
  $('hEmpty').hidden=!!h.length;
  $('hPager').innerHTML=h.length?pagerHTML(h.length,1):'';
}

/* --- 저장 --- */
function snap(t){t.stages=JSON.parse(JSON.stringify(stages));delete t.mkKey;withMk(t)}
function doSave(){
  var name=$('fName').value.trim(), cat=$('fCat').value, pt=$('fProd').value, desc=$('fDesc').value.trim();
  if(MODE==='reg'){
    var mx=0;DATA.forEach(function(d){mx=Math.max(mx,+d.id.slice(-3))});
    var t={id:'CTN-ORD-'+('00'+(mx+1)).slice(-3),n:name,cat:cat,pt:pt,t:pt,cnt:0,ap:'승인 대기',u:false,dt:NOW,by:BY,desc:desc,hist:null};
    snap(t); t.hist=null; DATA.push(t); histOf(t);
    saveTemplates(DATA); openList('?saved='+encodeURIComponent(t.id));
  }else if(MODE==='edit'&&curT){
    var t2=curT; t2.n=name;t2.cat=cat;t2.pt=pt;t2.desc=desc;t2.u=$('uY').checked;t2.ap='승인 대기';t2.dt=NOW;t2.by=BY;
    snap(t2); var h=histOf(t2).slice(); h.unshift({st:'승인요청',req:'김지훈(SSP2332)',rd:NOW+':00',rs:'템플릿 수정 요청입니다.',ap:'정지솔(SSP12344)',pd:'',pr:'',ver:''}); t2.hist=h;
    saveTemplates(DATA); openForm('detail',t2); toast('저장되었습니다. 승인 요청이 진행됩니다.');
  }
}

/* --- 이벤트 --- */
$('bToList').onclick=function(){openList()};
$('bEdit').onclick=function(){openForm('edit',curT)};
[].forEach.call(document.querySelectorAll('#ptabs .ptab'),function(b){b.onclick=function(){setTab(b.getAttribute('data-t'))}});
$('hBody').addEventListener('click',function(e){
  var c=e.target.closest('button[data-hc]');
  if(c){var i=+c.getAttribute('data-hc');showAlert({title:'승인 요청을 취소하시겠습니까?',body:'취소하면 상태가 \'요청 취소\'로 변경됩니다.',cancel:true,onOk:function(){var r=histOf(curT)[i];r.st='요청취소';r.pd=NOW+':00';r.pr='-';curT.ap='요청 취소';curT.u=false;saveTemplates(DATA);renderHist();toast('승인 요청을 취소했어요.')}});return}
  if(e.target.closest('button[data-hd]')){toast('변경 내용 상세 노출 방식(팝업/화면)은 확인 필요 (TBD)');return}
  if(e.target.closest('a[data-hv]')){toast('버전 링크 동작은 확인 필요 (TBD)')}
});
renderVerify(); syncEpc(); renderPvProd(); all(false);

/* --- 시작: 주소로 화면 결정 --- */
(function(){
  var q=new URLSearchParams(location.search), id=q.get('id'), cp=q.get('copy');
  if(id){
    var t=tById(id);
    if(!t){ showAlert({title:'템플릿을 찾을 수 없습니다.',body:'목록 화면으로 이동합니다.',onOk:function(){openList()}}); return; }
    openForm(q.get('mode')==='edit'?'edit':'detail',t);
  }else openForm('reg',null,cp?tById(cp):null);
})();
