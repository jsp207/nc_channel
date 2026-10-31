// @ts-nocheck
// 모든 페이지 공통 LNB: .app 안의 <nav class="app-nav">에 메뉴를 그립니다.
// 메뉴 항목은 MENU 한 곳에서 관리합니다. href가 비어 있으면 아직 화면이 없는 메뉴입니다.
import "./lnb.css";

const ICONS = {
  map: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v3a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
  display: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  bulk: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9.5 1.5 1.5L11 8.5M7 15l1.5 1.5L11 14M14 10h4M14 15.5h4"/>',
  content: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.8"/><path d="m21 15-4.5-4.5L6 21"/>',
  policy: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  process: '<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h5a3 3 0 0 1 3 3v4"/>',
  corner: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  reconcile: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  fee: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 9.5 12 15l3.5-5.5M8 12.5h8"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
  collapse: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M9 3.5v17M15.5 9.5 13 12l2.5 2.5"/>',
};

// match: 같은 메뉴로 표시할 다른 화면 파일(등록 화면, 이전 버전 등)
const MENU = [
  { items: [{ label: '구조도', icon: 'map', href: 'bo-intro.html' }] },
  { label: '상품관리', items: [
    { label: 'EPC 상품조회', icon: 'search', href: 'epc-list.html' },
    // 상품 전시 일괄 관리는 상품 전시 목록(display-list2.html)에 합쳤다
    { label: '상품 전시 관리', icon: 'display', href: 'display-list2.html', match: ['product-v021.html', 'product-v022.html', 'product-display-bulk.html'] },
    { label: '상품 콘텐츠 관리', icon: 'content', href: 'product-content.html' },
    { label: '정책', icon: 'policy', href: 'policy.html' },
  ] },
  { label: '주문관리', items: [
    { label: '주문 프로세스 관리', icon: 'process', href: 'order4-create.html', match: ['order3-create.html'] },
    { label: '주문 코너 관리', icon: 'corner', href: 'order-corner-v21.html', match: ['order-corner-create.html'] },
    { label: '정책', icon: 'policy', href: '' },
  ] },
  { label: '결제관리', items: [
    { label: '결제수단 기준정보 관리', icon: 'card', href: 'payment-method2.html', match: ['payment-method2-create.html'] },
    { label: '결제 이력 관리', icon: 'history', href: 'payment-history2.html' },
    { label: '거래내역 대사관리', icon: 'reconcile', href: 'payment-reconciliation2.html' },
    { label: '수수료 조회', icon: 'fee', href: '' },
    { label: '정책', icon: 'policy', href: 'payment-policy.html' },
  ] },
];
const BACKUP = { label: '백업', items: [{ label: '히스토리', icon: 'archive', href: 'index.html' }] };

const LOGO = '<svg class="app-nav-logo-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lnbLogoGrad" x1="3" y1="29" x2="29" y2="3" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3fd6f0"/><stop offset=".5" stop-color="#4f7cf7"/><stop offset="1" stop-color="#b48cff"/></linearGradient></defs><g fill="url(#lnbLogoGrad)">'
  + [[8.2, 18, 1.05], [10.6, 24, 1.2], [13, 30, 1.3]].map(([r, n, s]) => Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle cx="${(16 + r * Math.cos(a)).toFixed(2)}" cy="${(16 + r * Math.sin(a)).toFixed(2)}" r="${s}"/>`;
  }).join('')).join('')
  + '</g></svg>';

const STORE_KEY = 'app-nav-collapsed';
const current = location.pathname.split('/').pop() || 'index.html';
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

function item(it) {
  const label = `${svg(it.icon)}<span class="app-nav-text">${it.label}</span>`;
  if (!it.href) return `<li><a class="app-nav-item" href="#" data-pending title="${it.label}">${label}</a></li>`;
  const on = it.href === current || (it.match || []).includes(current);
  return `<li><a class="app-nav-item${on ? ' on' : ''}" href="${it.href}" title="${it.label}"${on ? ' aria-current="page"' : ''}>${label}</a></li>`;
}

function group(g) {
  const head = g.label ? `<p class="app-nav-group">${g.label}</p>` : '';
  return `<div class="app-nav-section">${head}<ul>${g.items.map(item).join('')}</ul></div>`;
}

function readCollapsed() {
  try { return localStorage.getItem(STORE_KEY) === '1'; } catch { return false; }
}
function saveCollapsed(v) {
  try { localStorage.setItem(STORE_KEY, v ? '1' : '0'); } catch {}
}

function renderLnb(nav) {
  const app = nav.closest('.app');
  nav.innerHTML = `
    <div class="app-nav-head">
      <a class="app-nav-brand" href="index.html" title="히스토리">${LOGO}<span class="app-nav-text">ADMIN</span></a>
      <button class="app-nav-toggle" type="button" aria-expanded="true" aria-label="메뉴 접기" aria-keyshortcuts="Control+Backquote" title="메뉴 접기/펼치기 (Ctrl + ~)">${svg('collapse')}</button>
    </div>
    <div class="app-nav-body">
      <div class="app-nav-menu">${MENU.map(group).join('')}</div>
      <div class="app-nav-backup">${group(BACKUP)}</div>
    </div>
    <p class="app-nav-foot"><span class="app-nav-text">NC-Channel Admin</span></p>`;

  // 아직 화면이 없는 메뉴는 이동하지 않고 안내만 띄웁니다.
  nav.querySelectorAll('[data-pending]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    alert('준비중입니다.');
  }));

  const btn = nav.querySelector('.app-nav-toggle');
  const mobile = matchMedia('(max-width:900px)');
  const set = collapsed => {
    app?.classList.toggle('app-nav-collapsed', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.setAttribute('aria-label', collapsed ? '메뉴 펼치기' : '메뉴 접기');
  };
  app?.classList.add('with-lnb');
  // <nav data-auto-collapse="1440">처럼 폭을 주면 그 폭 이하 화면에서 자동으로 접습니다(넓어지면 저장된 상태로 돌아감).
  // 자동으로 접힌 동안 직접 펼치거나 접은 것은 저장하지 않습니다.
  const autoW = +nav.dataset.autoCollapse || 0;
  const narrow = autoW ? matchMedia(`(max-width:${autoW}px)`) : null;
  const auto = () => mobile.matches || !!narrow?.matches;
  // 모바일은 처음에 접어 두고, 저장된 접힘 상태는 데스크톱에만 적용합니다.
  set(auto() || readCollapsed());
  narrow?.addEventListener('change', () => { if (!mobile.matches) set(narrow.matches || readCollapsed()); });
  btn.addEventListener('click', () => {
    const next = !app.classList.contains('app-nav-collapsed');
    set(next);
    if (!auto()) saveCollapsed(next);
  });
  // Ctrl + ` (~ 키)로도 접기/펼치기
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.altKey && !e.metaKey && e.code === 'Backquote') {
      e.preventDefault();
      btn.click();
    }
  });
}

document.querySelectorAll('.app > nav.app-nav').forEach(renderLnb);
