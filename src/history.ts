// @ts-nocheck
// 히스토리(index.html): 작업한 화면 파일 목록. 데이터는 src/history-data.ts 한 곳에서 관리합니다.
// 탭 = LNB 메뉴 그룹(상품 / 주문 / 결제), 구분 버튼 = LNB 메뉴(+ 메뉴에서 빠진 메뉴) + 정책
// Latest = LNB 메뉴 href에 연결된 버전(같은 버전의 다른 화면·그 버전의 정책 포함)
import "./style.css";
import { requireAuthentication } from "./auth";
import { MENU } from "./lnb";
import { TABS, LEGACY_MENUS, SCREENS, POLICIES, screenTitle, policyTitle, cmpVer, latestVersions } from "./history-data";

requireAuthentication();

const hrefs = {};
MENU.forEach(g => g.items.forEach(it => { hrefs[it.label] = it.href; }));
const latest = latestVersions(hrefs);
const isLatest = (menu, ver) => latest[menu] === ver;

const LATEST = '<span class="h-latest">Latest</span>';
const link = (file, text) => `<a href="${file}">${text}</a>`;
const note = n => n ? ` <span class="h-note">${n}</span>` : '';
const EMPTY = cols => `<tr><td colspan="${cols}" class="h-empty">등록된 화면이 없습니다</td></tr>`;

// 정책 Latest: Latest 버전 화면을 대상으로 하는 정책(대상이 없는 공통 정책 포함) 중, 같은 이름에서 가장 높은 버전
function latestPolicies(list) {
  const hit = list.filter(p => !p.for.length || p.for.some(f => isLatest(f.menu, f.ver)));
  return new Set(hit.filter(p => !hit.some(q => q.name === p.name && cmpVer(q.ver, p.ver) > 0)));
}

function menuTable(menu, policies) {
  const rows = SCREENS.filter(s => s.menu === menu)
    .map((s, i) => ({ s, i }))
    .sort((a, b) => cmpVer(b.s.ver, a.s.ver) || a.i - b.i)
    .map(x => x.s);
  let prev = '';
  const body = rows.map(s => {
    const pol = policies.filter(p => p.for.some(f => f.menu === s.menu && f.ver === s.ver));
    const first = s.ver !== prev; prev = s.ver;
    return `<tr class="${first ? 'h-vstart' : ''}">
      <td>${isLatest(s.menu, s.ver) ? LATEST : ''}</td>
      <td class="h-ver">v${s.ver}</td>
      <td>${s.screen}</td>
      <td>${link(s.file, screenTitle(s))}${note(s.note)}</td>
      <td class="h-file">${s.file}</td>
      <td>${s.date}</td>
      <td>${pol.length ? pol.map(p => link(p.file, policyTitle(p))).join('<br>') : '<span class="h-none">—</span>'}</td>
    </tr>`;
  }).join('');
  return { count: rows.length, html: `<table>
    <thead><tr><th style="width:80px">상태</th><th style="width:72px">버전</th><th style="width:130px">화면</th><th>제목</th><th>파일명</th><th style="width:100px">날짜</th><th>정책</th></tr></thead>
    <tbody>${body || EMPTY(7)}</tbody></table>` };
}

function policyTable(list) {
  const on = latestPolicies(list);
  const rows = [...list].sort((a, b) => b.date.localeCompare(a.date) || cmpVer(b.ver, a.ver));
  const body = rows.map(p => `<tr>
    <td>${on.has(p) ? LATEST : ''}</td>
    <td class="h-ver">v${p.ver}</td>
    <td>${p.for.length ? p.for.map(f => `${f.menu} v${f.ver}`).join('<br>') : '상품 · 주문 · 결제 공통'}</td>
    <td>${link(p.file, policyTitle(p))}${note(p.note)}</td>
    <td class="h-file">${p.file}</td>
    <td>${p.date}</td>
  </tr>`).join('');
  return { count: rows.length, html: `<table>
    <thead><tr><th style="width:80px">상태</th><th style="width:72px">버전</th><th>대상 화면</th><th>제목</th><th>파일명</th><th style="width:100px">날짜</th></tr></thead>
    <tbody>${body || EMPTY(6)}</tbody></table>` };
}

// 탭·구분 버튼 그리기
const tabBar = document.querySelector('.h-tabs');
const host = document.getElementById('historyPanels');
TABS.forEach(t => {
  const policies = POLICIES[t.key] || [];
  const lnbMenus = (MENU.find(g => g.label === t.group)?.items || []).map(it => it.label);
  const segs = [
    ...lnbMenus.map(m => ({ label: m, ...menuTable(m, policies) })),
    ...(LEGACY_MENUS[t.key] || []).map(m => ({ label: m, legacy: true, ...menuTable(m, policies) })),
    { label: '정책', ...policyTable(policies) },
  ];
  const total = segs.reduce((n, s) => n + s.count, 0);
  tabBar.insertAdjacentHTML('beforeend', `<button type="button" role="tab" id="tab-${t.key}" aria-controls="panel-${t.key}" data-tab="${t.key}">${t.label} <span class="h-cnt">${total}</span></button>`);
  host.insertAdjacentHTML('beforeend', `<div role="tabpanel" id="panel-${t.key}" aria-labelledby="tab-${t.key}" hidden>
    <div class="seg h-seg" role="group" aria-label="${t.label} 메뉴 구분">
      ${segs.map((s, i) => `<button type="button" data-i="${i}">${s.label}${s.legacy ? ' <span class="h-tag">메뉴 없음</span>' : ''} <span class="h-cnt">${s.count}</span></button>`).join('')}
    </div>
    ${segs.map((s, i) => `<div class="tw" data-i="${i}" hidden>${s.html}</div>`).join('')}
  </div>`);
});

// 구분 버튼: 처음에는 첫 버튼
document.querySelectorAll('#historyPanels [role="tabpanel"]').forEach(panel => {
  const btns = [...panel.querySelectorAll('.h-seg button')];
  const views = [...panel.querySelectorAll('.tw[data-i]')];
  const show = i => {
    btns.forEach(b => { const on = b.dataset.i === i; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    views.forEach(v => { v.hidden = v.dataset.i !== i; });
  };
  btns.forEach(b => b.addEventListener('click', () => show(b.dataset.i)));
  show('0');
});

// 상품 / 주문 / 결제 탭. 고른 탭은 주소(#order, #pay)에 남겨 새로고침·공유해도 유지된다.
const tabs = [...tabBar.querySelectorAll('[role="tab"]')];
function showTab(k) {
  tabs.forEach(t => { const on = t.dataset.tab === k; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !on; });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => { showTab(t.dataset.tab); history.replaceState(null, '', t.dataset.tab === 'prod' ? location.pathname : '#' + t.dataset.tab); });
  t.addEventListener('keydown', e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.click(); n.focus(); });
});
showTab(tabs.some(t => '#' + t.dataset.tab === location.hash) ? location.hash.slice(1) : 'prod');
