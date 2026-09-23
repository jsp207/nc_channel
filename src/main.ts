// @ts-nocheck
import "./style.css";

async function requireAuthentication() {
  const response = await fetch('/api/session', { credentials: 'include' });
  const session = response.ok ? await response.json() : { authenticated: false };
  if (session.authenticated === true) {
    document.body.classList.add('authenticated');
    return;
  }

  const gate = document.createElement('section');
  gate.className = 'auth-gate';
  gate.innerHTML = `<div class="auth-card"><h1>NC-Channel Product Admin</h1><p>관리자 비밀번호를 입력하세요.</p><form class="auth-form"><label for="authPassword">비밀번호</label><input id="authPassword" name="password" type="password" autocomplete="current-password" required><p class="auth-error" aria-live="polite"></p><button class="btn primary" type="submit">입장</button></form></div>`;
  document.body.appendChild(gate);

  const form = gate.querySelector('form');
  const input = gate.querySelector('input');
  const error = gate.querySelector('.auth-error');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const login = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: input.value }),
    });
    if (login.ok) {
      gate.remove();
      document.body.classList.add('authenticated');
      return;
    }
    input.value = '';
    error.textContent = '비밀번호가 올바르지 않습니다.';
    input.focus();
  });
  input.focus();
}

requireAuthentication();

// ---------- 마스터 정책 ----------
const POLICY = [
 {area:'기기서비스',type:'약정형',line:['이동전화','태블릿','웨어러블','IoT','데이터전용'],solo:false,key:'기기모델(소재·사이즈 제외)',max:1,ex:'Galaxy S26, iPhone 18'},
 {area:'기기서비스',type:'액세서리형',line:['무관'],solo:true,key:'브랜드+시리즈',max:'N',ex:'보호필름, 케이스, 충전기'},
 {area:'이동전화',type:'요금제형',line:['이동전화','태블릿','웨어러블','IoT','데이터전용'],solo:true,key:'상품계열',max:1,ex:'5G 프리미엄, LTE 베이직'},
 {area:'부가서비스',type:'월정액형',line:['이동전화','태블릿','웨어러블'],solo:true,key:'상품계열',max:1,ex:'V 컬러링, FLO 앤 데이터'},
 {area:'부가서비스',type:'무료형',line:['이동전화','태블릿','웨어러블'],solo:true,key:'상품계열',max:1,ex:'콜키퍼, 발신번호표시'},
 {area:'부가서비스',type:'종량/충전형',line:['이동전화','태블릿','웨어러블'],solo:true,key:'상품계열',max:'N',ex:'데이터 리필'},
 {area:'부가서비스',type:'제휴 보험형',line:['이동전화','태블릿','웨어러블'],solo:true,key:'상품계열',max:1,ex:'T 올케어+6'},
 {area:'부가서비스',type:'제휴 클럽형',line:['이동전화','태블릿','웨어러블'],solo:true,key:'상품계열',max:1,ex:'T 갤럭시 클럽'},
 {area:'로밍',type:'로밍 요금제형',line:['이동전화','태블릿'],solo:true,key:'상품계열',max:1,ex:'baro, OnePass'},
 {area:'로밍',type:'로밍 옵션형',line:['이동전화','태블릿'],solo:true,key:'상품계열',max:1,ex:'T 기내 Wi-Fi'},
 {area:'로밍',type:'로밍 충전형',line:['이동전화','태블릿'],solo:true,key:'상품계열',max:'N',ex:'baro 데이터 리필'},
 {area:'플랫폼(T우주)',type:'단일 구독형',line:['무관'],solo:true,key:'상품계열',max:1,ex:'동일 서비스 중 1개만'},
 {area:'플랫폼(T우주)',type:'결합 구독형',line:['무관'],solo:true,key:'상품계열',max:1,ex:'월간/연간 중 1개만'},
 {area:'플랫폼(T우주)',type:'이용권형',line:['무관'],solo:true,key:'상품계열',max:'N',ex:'이용권은 여러 개 가능'},
];
const AREAS = ['기기서비스','이동전화','부가서비스','로밍','플랫폼(T우주)'];
const pol = t => POLICY.find(p=>p.type===t);

// ---------- 단품 (실제 상품명 발췌) ----------
// svc: 서비스 키(정책 6 판정), inc: 포함 서비스, dev: 기종, net: 네트워크
let ITEMS = [];
const add = (arr, area, type, line, key, net, extra={}) => arr.forEach(n=>ITEMS.push(Object.assign({name:n,area,type,line,key,net},extra)));
add(['iPhone 18 Pro / 256G / 실버','iPhone 18 Pro / 512G / 실버','iPhone 18 Pro / 256G / 블랙','iPhone 18 Pro / 1T / 블랙'],'기기서비스','약정형','이동전화','iPhone 18 Pro','5G',{dev:'iphone'});
add(['갤럭시 Z 플립8 / 256G / 크림','갤럭시 Z 플립8 / 512G / 크림','갤럭시 Z 플립8 / 256G / 핑크','갤럭시 Z 플립8 / 512G / 핑크','갤럭시 Z 플립8 / 256G / 블루'],'기기서비스','약정형','이동전화','갤럭시 Z 플립8','5G',{dev:'flip'});
add(['갤럭시 S26 / 256G / 블랙','갤럭시 S26 / 512G / 블랙','갤럭시 S26 / 256G / 화이트'],'기기서비스','약정형','이동전화','갤럭시 S26','5G',{dev:'galaxy'});
add(['갤럭시 A17 / 128G / 블랙','갤럭시 A17 / 128G / 블루'],'기기서비스','약정형','이동전화','갤럭시 A17','LTE',{dev:'galaxy'});
add(['갤럭시 탭 S11 / 256G / 그레이','갤럭시 탭 S11 / 512G / 그레이'],'기기서비스','약정형','태블릿','갤럭시 탭 S11','5G',{dev:'galaxy'});
add(['Apple Watch Series 12 / 알루미늄 46mm / 블랙','Apple Watch Series 12 / 티타늄 46mm / 슬레이트'],'기기서비스','약정형','웨어러블','Apple Watch Series 12','LTE',{dev:'iphone'});
add(['[Z플립8] SLBS 케이스 모노라인','[Z플립8] SLBS 케이스 포켓몬 네임택','[Z플립8] SLBS 케이스 패턴','[Z플립8] SLBS 케이스 인덱스'],'기기서비스','액세서리형','무관','SLBS Z플립8 케이스','-');
add(['삼성전자 갤럭시 Z폴드8 보호필름','삼성전자 갤럭시 Z플립8 보호필름','삼성 마그넷 무선 충전기 (25W)'],'기기서비스','액세서리형','무관','삼성정품','-');
add(['라이트 79','라이트 69','라이트 55','라이트 49'],'이동전화','요금제형','이동전화','라이트','5G');
add(['라이트 59','라이트 59 (13GB업)','라이트 59 (30GB업)','라이트 59 (75GB업)'],'이동전화','요금제형','이동전화','라이트 59 계열','5G');
add(['다이렉트5G 76(넷플릭스)'],'이동전화','요금제형','이동전화','다이렉트5G 76','5G',{inc:['netflix']});
add(['다이렉트5G 76(유튜브 프리미엄)'],'이동전화','요금제형','이동전화','다이렉트5G 76','5G',{inc:['youtube']});
add(['T플랜 세이브','베이직'],'이동전화','요금제형','이동전화','T플랜','LTE');
add(['ZEM플랜 퍼펙트','ZEM플랜 베스트'],'이동전화','요금제형','이동전화','ZEM플랜','LTE',{seg:'키즈'});
add(['T Tab 18','5G Tab 4GB(단독)'],'이동전화','요금제형','태블릿','태블릿 요금제','5G');
add(['LTE Watch(단독)','LTE Watch(공유II)'],'이동전화','요금제형','웨어러블','LTE Watch','LTE');
add(['V 컬러링','V 컬러링 플러스','V 컬러링 라이트'],'부가서비스','월정액형','이동전화','V 컬러링','-',{svc:'coloring'});
add(['컬러링슬림팩'],'부가서비스','월정액형','이동전화','컬러링','-',{svc:'coloring'});
add(['스마트 콜키퍼','안심클라우드','PASS 오피스도우미'],'부가서비스','월정액형','이동전화','편의','-');
add(['FLO 앤 데이터'],'부가서비스','월정액형','이동전화','FLO 앤 데이터','-',{svc:'flo'});
add(['Wavve 앤 데이터'],'부가서비스','월정액형','이동전화','Wavve 앤 데이터','-',{svc:'wavve'});
add(['라이트 59 데이터 충전 13GB','라이트 59 데이터 충전 30GB'],'부가서비스','종량/충전형','이동전화','라이트 59 데이터 충전','-',{req:'라이트 59 계열'});
add(['T 올케어+6 i일반(온라인)','T 올케어+6 i고급(온라인)'],'부가서비스','제휴 보험형','이동전화','T 올케어+6','-',{dev:'iphone',svc:'ins'});
add(['T 올케어+6 스위치 플립(온라인)','분실파손6 플립(온라인)'],'부가서비스','제휴 보험형','이동전화','T 올케어+6 스위치','-',{dev:'flip',svc:'ins'});
add(['T 올케어+6 일반(온라인)','T 올케어+6 고급(온라인)'],'부가서비스','제휴 보험형','이동전화','T 올케어+6','-',{dev:'galaxy',svc:'ins'});
add(['T나는 폰교체 AI클럽','인피니티 클럽'],'부가서비스','제휴 클럽형','이동전화','클럽','-',{svc:'club'});
add(['baro 요금제'],'로밍','로밍 요금제형','이동전화','baro','-',{svc:'roamplan'});
add(['OnePass 500 기본형','OnePass 500 기간형'],'로밍','로밍 요금제형','이동전화','OnePass 500','-',{svc:'roamplan'});
add(['T 기내 Wi-Fi','로밍 콜 무제한'],'로밍','로밍 옵션형','이동전화','로밍 옵션','-');
add(['baro 1GB 충전','baro 2GB 충전','baro 3GB 충전'],'로밍','로밍 충전형','이동전화','baro 충전','-',{req:'baro'});
add(['Netflix 광고형 스탠다드','Netflix 스탠다드','Netflix 프리미엄'],'플랫폼(T우주)','단일 구독형','무관','Netflix','-',{svc:'netflix'});
add(['Disney+ 스탠다드','Disney+ 프리미엄'],'플랫폼(T우주)','단일 구독형','무관','Disney+','-',{svc:'disney'});
add(['YouTube Premium','YouTube Premium Lite'],'플랫폼(T우주)','단일 구독형','무관','YouTube Premium','-',{svc:'youtube'});
add(['티빙 스탠다드','Melon 스트리밍클럽','밀리의서재 이용권','교보문고 sam 이용권','FLO 콘텐츠 팩'],'플랫폼(T우주)','단일 구독형','무관','개별 구독','-');
ITEMS.find(i=>i.name==='FLO 콘텐츠 팩').svc='flo';
add(['T 우주패스 편의점&카페 (월간)','T 우주패스 편의점&카페 (연간)'],'플랫폼(T우주)','결합 구독형','무관','T 우주패스 편의점&카페','-',{svc:'pass_cvs'});
add(['T 우주패스 미디어'],'플랫폼(T우주)','결합 구독형','무관','T 우주패스 미디어','-',{inc:['netflix','wavve']});
add(['배스킨라빈스 쿠폰','배달의민족 쿠폰팩','CU 할인','투썸플레이스 할인','스타벅스 할인'],'플랫폼(T우주)','이용권형','무관','쿠폰/할인','-');
ITEMS.forEach((it,i)=>{it.id='I'+i; it.solo=pol(it.type).solo; it.max=pol(it.type).max;});


// ---------- 공통 ----------
const $ = s=>document.querySelector(s);
const el = (t,c,h)=>{const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e;};
function toast(m){const t=$('#toast'); t.textContent=m; t.classList.add('on'); setTimeout(()=>t.classList.remove('on'),1800);}
function showView(name){
  const view=document.getElementById('v-'+name);
  if(!view) return;
  document.querySelectorAll('nav button[data-v]').forEach(b=>{
    const active=b.dataset.v===name;
    b.classList.toggle('on',active);
    if(active) b.setAttribute('aria-current','page');
    else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v===view));
  window.scrollTo(0,0);
}
document.querySelectorAll('button[data-v]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.v)));
showView('base');
const joinKey = i => i.line==='무관' ? '무관' : (i.net && i.net!=='-' ? `${i.line}-${i.net}` : i.line);
const variants = i => ITEMS.filter(x=>x.area===i.area && x.key===i.key && x.type===i.type);

// ---------- 번들 데이터 ----------
let BUNDLES=[];
// 자동 생성: 단독 주문 가능한 단품 → 모델 키별 대표만 있는 번들 1개
(function(){
  const seen=new Set();
  ITEMS.filter(i=>i.solo).forEach(i=>{
    const k=i.area+'|'+i.key+'|'+i.type; if(seen.has(k)) return; seen.add(k);
    const v=variants(i);
    BUNDLES.push({id:'A'+BUNDLES.length,name:v.length>1?i.key:i.name,head:i,slots:[],auto:true,status:'live'});
  });
})();
function addBundle(name,head,slots,status){ BUNDLES.unshift({id:'M'+Date.now()+Math.random(),name,head,slots,auto:false,status}); }
const byName=n=>ITEMS.find(i=>i.name===n);
addBundle('갤럭시 Z 플립8 개통 번들', byName('갤럭시 Z 플립8 / 256G / 크림'), [
 {type:'필수',area:'이동전화',sel:['라이트 79','라이트 69','라이트 59'].map(byName)},
 {type:'선택',area:'부가서비스',sel:['T 올케어+6 스위치 플립(온라인)','분실파손6 플립(온라인)'].map(byName)},
 {type:'필수',area:'기기서비스',sel:[byName('삼성전자 갤럭시 Z플립8 보호필름')]}], 'live');
addBundle('라이트 59 데이터 팩', byName('라이트 59'), [
 {type:'선택',area:'부가서비스',sel:['V 컬러링','스마트 콜키퍼','안심클라우드'].map(byName)},
 {type:'선택',area:'로밍',sel:['baro 요금제','OnePass 500 기본형'].map(byName)}], 'live');
addBundle('편의점&카페 콘텐츠 팩', byName('T 우주패스 편의점&카페 (월간)'), [
 {type:'필수',area:'플랫폼(T우주)',sel:['Melon 스트리밍클럽','밀리의서재 이용권','교보문고 sam 이용권'].map(byName)},
 {type:'선택',area:'플랫폼(T우주)',sel:['배스킨라빈스 쿠폰','배달의민족 쿠폰팩'].map(byName)}], 'wait');

function poRange(b){ const must=b.slots.filter(s=>s.type==='필수').length, opt=b.slots.filter(s=>s.type==='선택').length; return opt? `${1+must}~${1+must+opt}` : String(1+must); }
function slotLabel(s){ return `${s.type} · ${s.area} ${s.sel.length}${s.sel.length===1?' (자동 포함)':''}`; }

// ---------- 기준 화면 ----------
(function(){
  const tb=$('#policyTable tbody'); let last='';
  POLICY.forEach(p=>{const tr=el('tr',p.area!==last?'lv2':''); tr.innerHTML=`<td>${p.area!==last?p.area:''}</td><td><b>${p.type}</b></td><td>${p.line.map(l=>`<span class="chip">${l}</span>`).join('')}</td><td>${p.solo?'가능':'<span class="tag bad">불가</span>'}</td><td>${p.key}</td><td style="color:var(--muted)">${p.ex}</td>`; tb.appendChild(tr); last=p.area;});
  const fa=$('#fArea'); AREAS.forEach(a=>fa.appendChild(new Option(a,a)));
  function render(){
    const q=$('#fQ').value.trim(); const tb=$('#itemTable tbody'); tb.innerHTML='';
    const list=ITEMS.filter(i=>(!fa.value||i.area===fa.value)&&(!q||i.name.includes(q)));
    list.forEach(i=>{const auto=BUNDLES.find(b=>b.auto&&b.head.area===i.area&&b.head.key===i.key&&b.head.type===i.type); const tr=el('tr'); tr.innerHTML=`<td>${i.name}</td><td>${i.area}</td><td>${i.type}</td><td><span class="chip">${joinKey(i)}</span></td><td style="color:var(--muted)">${i.key}</td><td>${i.solo?'가능':'<span class="tag bad">불가</span>'}</td><td style="color:var(--muted)">${auto?auto.name:'없음 (운영자 번들 필요)'}</td>`; tb.appendChild(tr);});
    $('#itemCount').textContent=`${list.length}개 (발췌 ${ITEMS.length}개)`;
  }
  fa.addEventListener('change',render); $('#fQ').addEventListener('input',render); render();
})();

// ---------- 번들 빌더 ----------
const B={head:null,slots:[]};
const bArea=$('#bArea'), bHead=$('#bHead');
AREAS.forEach(a=>bArea.appendChild(new Option(a,a)));
function fillHeads(){
  bHead.innerHTML=''; const seen=new Set();
  ITEMS.filter(i=>i.area===bArea.value).forEach(i=>{ const k=i.key+'|'+i.type; const v=variants(i); const label=v.length>1?`${i.key} (${v.length}종 자동 펼침)`:i.name; if(v.length>1&&seen.has(k)) return; seen.add(k); bHead.appendChild(new Option(label,i.id)); });
  B.head=ITEMS.find(i=>i.id===bHead.value); onHead();
}
bArea.addEventListener('change',fillHeads); bHead.addEventListener('change',()=>{B.head=ITEMS.find(i=>i.id===bHead.value); onHead();});
function onHead(){
  const h=B.head; const v=variants(h);
  $('#bHeadInfo').innerHTML=`${h.type} · 결합 키 <span class="chip">${joinKey(h)}</span>${h.solo?'':' · <span class="tag bad">단독 주문 불가</span> → 정책 1: 요금제 슬롯 자동 고정'}`;
  const vb=$('#bVariants'); vb.innerHTML=''; if(v.length>1) v.forEach(x=>vb.appendChild(el('div','cand off',`<span>${x.name}<small>고객 선택지 (자동)</small></span>`)));
  B.slots=[]; if(!h.solo) B.slots.push({type:'필수',area:'이동전화',sel:new Set(),locked:true});
  renderSlots(); check();
}
$('#addSlot').addEventListener('click',()=>{ B.slots.push({type:'선택',area:B.head.area==='기기서비스'?'부가서비스':'플랫폼(T우주)',sel:new Set()}); renderSlots(); check(); });
function candidates(si){
  const h=B.head, s=B.slots[si];
  const others=B.slots.filter((x,i)=>i!==si).flatMap(x=>[...x.sel]);
  return ITEMS.filter(i=>i.area===s.area).map(o=>{
    let off='';
    if(o.id===h.id||(o.key===h.key&&o.type===h.type&&o.area===h.area)) off='대표와 같은 모델';
    else if(o.svc&&h.svc&&o.svc===h.svc) off='정책 4: 대표와 같은 서비스';
    else if(h.inc&&o.svc&&h.inc.includes(o.svc)) off='정책 4: 대표에 이미 포함';
    else if(o.inc&&h.svc&&o.inc.includes(h.svc)) off='정책 4: 대표를 포함하는 결합 상품';
    else if(o.type==='요금제형'&&h.type==='약정형'){ if(o.line!==h.line) off=`정책 2: 결합 키 불일치 (${joinKey(o)} ≠ ${joinKey(h)})`; else if(h.net==='LTE'&&o.net==='5G') off='정책 2: LTE 단말에는 LTE 요금제만'; else if(o.seg==='키즈'&&!/ZEM|키즈/.test(h.name)) off='키즈 요금제는 키즈폰만'; }
    else if(o.svc==='ins'&&h.dev&&o.dev&&o.dev!==h.dev) off='보험 대상 기종 불일치';
    else if(o.req){ const ok=[h,...others].some(x=>x.key===o.req||x.name===o.req); if(!ok) off=`전제: ${o.req} 가 같은 번들에 있어야 함`; }
    if(!off&&others.some(x=>(x.svc&&o.svc&&x.svc===o.svc)||(x.inc&&o.svc&&x.inc.includes(o.svc)))) off='정책 4: 다른 슬롯 선택값과 같은 서비스';
    return {o,off};
  });
}
function renderSlots(){
  const box=$('#slots'); box.innerHTML='';
  B.slots.forEach((s,i)=>{
    const st=el('div','step');
    st.innerHTML=`<header><span class="n">${i+2}</span><b>추가 슬롯 ${i+1}</b><span class="why">${s.locked?'정책 1: 요금제·필수 (변경 불가)':'후보 중 고객이 1개 선택'}</span></header><div class="body"><div class="row"><label>유형</label><span class="seg"><button data-t="필수" class="${s.type==='필수'?'on':''}" ${s.locked?'disabled':''}>필수</button><button data-t="선택" class="${s.type==='선택'?'on':''}" ${s.locked?'disabled':''}>선택</button></span><label>영역</label><select ${s.locked?'disabled':''}></select>${s.locked?'':'<button class="btn sm" style="margin-left:auto">슬롯 삭제</button>'}</div><div class="cands"></div></div>`;
    const sel=st.querySelector('select'); AREAS.forEach(a=>sel.appendChild(new Option(a,a))); sel.value=s.area;
    sel.addEventListener('change',()=>{s.area=sel.value;s.sel.clear();renderSlots();check();});
    st.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ if(b.disabled)return; s.type=b.dataset.t; renderSlots(); check(); }));
    const del=st.querySelector('.btn.sm'); if(del) del.addEventListener('click',()=>{B.slots.splice(i,1);renderSlots();check();});
    const c=st.querySelector('.cands');
    candidates(i).forEach(({o,off})=>{ const d=el('label','cand'+(off?' off':'')); d.innerHTML=`<input type="checkbox" ${off?'disabled':''} ${s.sel.has(o)?'checked':''}><span>${o.name}<small>${off?'<span style="color:var(--bad)">'+off+'</span>':o.type}</small></span>`; d.querySelector('input').addEventListener('change',e=>{e.target.checked?s.sel.add(o):s.sel.delete(o); renderSlots(); check();}); c.appendChild(d); });
    box.appendChild(st);
  });
}
function check(){
  const h=B.head; const rules=[]; const R=(ok,t,d)=>rules.push({ok,t,d});
  if(!h.solo){ const s=B.slots[0]; const ok=s&&s.type==='필수'&&[...s.sel].some(o=>o.type==='요금제형'); R(ok,'정책 1 · 약정형 대표는 요금제 슬롯 필수',ok?'요금제 후보 있음':'슬롯 1에 요금제 후보를 체크하세요'); }
  B.slots.forEach((s,i)=>R(s.sel.size>0,`추가 슬롯 ${i+1} 후보 1개 이상`,`${s.sel.size}개 체크${s.sel.size===1?' · 고객에게 묻지 않고 자동 포함':''}`));
  R(true,'정책 2 · 결합 키','안 맞는 후보는 회색');
  R(true,'정책 3 · 후보는 단품만','후보 목록에 단품만 표시');
  R(true,'정책 4 · 같은 서비스·포함 상품 제외','해당 후보는 회색');
  const tmp={slots:B.slots.map(s=>({type:s.type}))}; $('#poCount').innerHTML=poRange(tmp)+'<small>PO</small>';
  $('#bSummary').innerHTML=`<div><span>대표</span>${variants(h).length>1?h.key+' ('+variants(h).length+'종)':h.name}</div>${B.slots.map((s,i)=>`<div><span>슬롯 ${i+1}</span>${s.type} · ${s.area} · 후보 ${s.sel.size}</div>`).join('')}${B.slots.length?'':'<div><span>슬롯</span>없음 (대표만 판매)</div>'}`;
  const ul=$('#ruleList'); ul.innerHTML=''; rules.forEach(r=>{const li=el('li'); li.innerHTML=`<span class="m ${r.ok?'ok':'bad'}">${r.ok?'O':'X'}</span><span class="t">${r.t}<span class="d">${r.d}</span></span>`; ul.appendChild(li);});
  $('#bSave').disabled=!rules.every(r=>r.ok);
}
$('#bReset').addEventListener('click',onHead);
$('#bSave').addEventListener('click',()=>{ const h=B.head; addBundle(`${variants(h).length>1?h.key:h.name} 번들`,h,B.slots.map(s=>({type:s.type,area:s.area,sel:[...s.sel]})),'wait'); $('#bFilter').value=''; renderBundles(); fillDisplayObjs(); renderCats(); onHead(); showView('bundle-list'); toast('번들을 저장했습니다. 목록에서 확인하세요'); });
function renderBundles(){
  const f=$('#bFilter').value; const tb=$('#bundleTable tbody'); tb.innerHTML='';
  const list=BUNDLES.filter(b=>!f||(f==='auto'?b.auto:!b.auto));
  list.forEach(b=>{const tr=el('tr'); tr.innerHTML=`<td><b>${b.name}</b></td><td>${b.head.name}${variants(b.head).length>1?' <span class="chip">'+variants(b.head).length+'종</span>':''}</td><td>${b.slots.length?b.slots.map(slotLabel).join('<br>'):'<span style="color:var(--muted)">없음</span>'}</td><td>${poRange(b)}</td><td>${b.auto?'<span class="chip">자동</span>':'<span class="chip acc">운영자</span>'}</td><td><span class="status ${b.status}"></span>${b.status==='live'?'전시 중':'전시 대기'}</td>`; tb.appendChild(tr);});
  $('#bCount').textContent=`${list.length}개 (자동 ${BUNDLES.filter(b=>b.auto).length}, 운영자 ${BUNDLES.filter(b=>!b.auto).length})`;
}
$('#bFilter').addEventListener('change',renderBundles);
fillHeads(); renderBundles();

// ---------- 전시 ----------
const DISPLAY=[
 {name:'Z 플립8 개통',b:'갤럭시 Z 플립8 개통 번들',ch:'T다이렉트샵',sec:'카테고리 5G 휴대폰',period:'상시',status:'live'},
 {name:'라이트 59 데이터 팩',b:'라이트 59 데이터 팩',ch:'T월드',sec:'요금제 변경',period:'상시',status:'live'},
 {name:'편의점&카페 콘텐츠 팩',b:'편의점&카페 콘텐츠 팩',ch:'T우주',sec:'기획전',period:'2026-10-01 ~ 상시',status:'wait'},
];
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
function renderCats(){ const tb=$('#catTable tbody'); tb.innerHTML=''; CATS.forEach(c=>{const m=BUNDLES.filter(b=>c.cond(b.head)); const tr=el('tr'); tr.innerHTML=`<td>${c.ch}</td><td><b>${c.name}</b></td><td style="color:var(--muted)">${c.cond.toString().replace(/^h=>/,'').replace(/h\./g,'').replace(/===/g,'=').replace(/&&/g,' · ').replace(/'/g,'')}</td><td>${m.length} 개 <span style="color:var(--muted)">(자동 ${m.filter(b=>b.auto).length}, 운영자 ${m.filter(b=>!b.auto).length})</span></td>`; tb.appendChild(tr);}); }
function fillDisplayObjs(){ const s=$('#dObj'); s.innerHTML=''; BUNDLES.forEach(b=>s.appendChild(new Option(b.name+(b.auto?' (자동)':''),b.id))); dPreview(); }
function curB(){ return BUNDLES.find(b=>b.id===$('#dObj').value); }
function dPreview(){
  const b=curB(); if(!b) return; const title=$('#dTitle').value.trim()||b.name; const v=variants(b.head);
  const steps=[`대표: ${v.length>1?b.head.key+' 변형 '+v.length+'종 중 1개 선택':b.head.name+' (선택 없음)'}`,...b.slots.map((s,i)=>`슬롯 ${i+1} (${s.type}): ${s.sel.length===1?s.sel[0].name+' 자동 포함':s.sel.length+'개 중 '+(s.type==='필수'?'1개 선택':'0~1개 선택')}`)];
  const ch=$('#dCh').value; const rules=[];
  rules.push([!(ch==='T우주'&&b.head.area!=='플랫폼(T우주)'),'채널 적합',ch==='T우주'&&b.head.area!=='플랫폼(T우주)'?'T우주 채널에는 T우주 상품만':'채널과 영역이 맞는다']);
  rules.push([b.status!=='off','번들 상태','전시 가능']);
  $('#dPreview').innerHTML=`<div><span>전시명</span><b>${title}</b></div><div><span>PO</span>${poRange(b)}</div><div><span>위치</span>${ch} · ${$('#dSection').value} · ${$('#dOrder').value}번째</div><div><span>기간</span>${$('#dFrom').value} ~ ${$('#dTo').value||'상시'}</div><div><span>고객 동작</span>${steps.join('<br>')}</div>`;
  const ul=$('#dRules'); ul.innerHTML=''; rules.forEach(([ok,t,d])=>{const li=el('li'); li.innerHTML=`<span class="m ${ok?'ok':'bad'}">${ok?'O':'X'}</span><span class="t">${t}<span class="d">${d}</span></span>`; ul.appendChild(li);});
  $('#dSave').disabled=!rules.every(r=>r[0]);
}
function renderDisplay(){ const tb=$('#displayTable tbody'); tb.innerHTML=''; DISPLAY.filter(d=>!$('#dChannel').value||d.ch===$('#dChannel').value).forEach(d=>{ const b=BUNDLES.find(x=>x.name===d.b); const act=b?(b.slots.length?'대표 선택 → 슬롯 순서대로 선택 → 담기':(variants(b.head).length>1?'변형 선택 후 담기':'바로 담기')):'-'; const tr=el('tr'); tr.innerHTML=`<td><b>${d.name}</b></td><td>${d.b}</td><td>${d.ch}</td><td>${d.sec}</td><td>${d.period}</td><td>${act}</td><td><span class="status ${d.status}"></span>${d.status==='live'?'전시 중':d.status==='wait'?'전시 예약':'종료'}</td>`; tb.appendChild(tr);}); }
['#dObj','#dCh','#dSection'].forEach(s=>$(s).addEventListener('change',dPreview)); ['#dTitle','#dOrder','#dFrom','#dTo'].forEach(s=>$(s).addEventListener('input',dPreview));
$('#dChannel').addEventListener('change',renderDisplay);
$('#dSave').addEventListener('click',()=>{ const b=curB(); const from=$('#dFrom').value,to=$('#dTo').value; DISPLAY.unshift({name:$('#dTitle').value.trim()||b.name,b:b.name,ch:$('#dCh').value,sec:$('#dSection').value,period:`${from} ~ ${to||'상시'}`,status:from>'2026-09-22'?'wait':'live'}); renderDisplay(); toast('전시를 저장했습니다'); });
renderCats(); fillDisplayObjs(); renderDisplay();
