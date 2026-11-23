// @ts-nocheck
// EPC 상품조회 상세 (epc-detail.html?epc=EPC 상품ID): EPC에서 받은 값을 보여 주는 읽기 전용 상세.
// 레이아웃은 결제관리 v0.2.3 상세(payment2.css · payment4.css의 .ph · .sec · .ft · .foot)를 그대로 쓴다.
// 수정할 수 있는 값은 공제항목 반영 ON/OFF 하나뿐이다. 기본 OFF, 바꾸면 바로 저장하고 변경 이력(처리 정보)을 남긴다(sessionStorage).
import "./admin-shell.css";
import "./payment2.css";
import "./payment4.css";
import "./payment5.css";
import "./list-unified.css";
import { requireAuthentication } from "./auth";
import { PO, epcOf, selPS } from "./data/epc";
import { poTpls, tplBy, nowStamp } from "./display-data";
import { epcRow } from "./epc-export";

requireAuthentication();

const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = n => Number(n).toLocaleString('ko-KR');
const USER = '김상품(P000020)';
const LIST = 'epc-list.html';
const KEY = 'nova-epc-deduct';
const TONE = { 운영: 'ok', 출시: 'ac', 검증: 'ac', 가입중단: 'warn', 퇴출: 'gray' };

const badge = (t, tone = TONE[t] ?? '') => `<span class="bdg ${tone}">${esc(t)}</span>`;
const chips = a => a.length ? `<span class="p5-chips">${a.map(x => `<span class="p5-chip gray">${esc(x)}</span>`).join('')}</span>` : '<span class="dim-t">-</span>';
const crumb = a => `<nav class="crumb" aria-label="현재 위치">${['홈', '상품 관리', ...a].map((c, i, all) => i === all.length - 1 ? `<b>${esc(c)}</b>` : esc(c)).join('<span aria-hidden="true">›</span>')}</nav>`;
const ph = (title, right = '') => `<div class="ph"><h1 class="h1">${title}</h1><div class="ph-r">${right}</div></div>`;
const sec = (t, body, hint = '') => `<section class="sec"><div class="sec-h"><h3>${t}</h3>${hint ? `<span class="hint">${hint}</span>` : ''}</div>${body}</section>`;
const ft = rows => `<table class="ft"><colgroup><col class="k"><col><col class="k"><col></colgroup><tbody>${rows}</tbody></table>`;
const tr2 = (k1, v1, k2, v2) => `<tr><th>${k1}</th><td>${v1}</td><th>${k2}</th><td>${v2}</td></tr>`;
const tr1 = (k, v) => `<tr><th>${k}</th><td colspan="3">${v}</td></tr>`;
const val = v => v == null || v === '' ? '-' : esc(v);

// 공제항목 반영 저장값: { [EPC 상품ID]: { on, at, by } }
const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; } };
const DED = load();
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(DED)); } catch { /* 저장 실패해도 화면은 동작 */ } };

const epcId = new URLSearchParams(location.search).get('epc');
const p = PO.find(x => x.epc === epcId);

// 탭: 상품상세(detail) · 변경이력조회(hist). URL ?tab=hist 로 바로 열 수 있다.
const TABS = [['detail', '상품상세'], ['hist', '변경이력조회']];
let TAB = new URLSearchParams(location.search).get('tab') === 'hist' ? 'hist' : 'detail';
let PAGE = 1;
const PER = 10;

// 변경이력 목업(SB 첨부 화면 기준). 상태 · 변경사항 · 미리보기 컬럼은 이 화면에서 제외함.
const HIST = [
  { ver: '', req: '김지훈 (SSP2332)', reqAt: '2026.07.28 11:24:11', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '', doneWhy: '' },
  { ver: '', req: '', reqAt: '', reqWhy: '이번 캠페인 공지입니다', apr: '', doneAt: '', doneWhy: '' },
  { ver: 'V.2', req: '김지훈 (SSP2332)', reqAt: '2026.07.25 10:10:06', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '2026.07.25 10:10:06', doneWhy: '이미지가 깨집니다' },
  { ver: '', req: '김지훈 (SSP2332)', reqAt: '2026.07.25 10:10:06', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '2026.07.25 10:10:06', doneWhy: '이미지가 깨집니다' },
  { ver: '', req: '김지훈 (SSP2332)', reqAt: '2026.07.23 15:22:03', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '2026.07.23 15:22:03', doneWhy: '재업로드 예정' },
  { ver: 'V.1', req: '김지훈 (SSP2332)', reqAt: '2026.07.22 10:21:04', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '2026.07.22 10:21:04', doneWhy: '' },
  { ver: '', req: '김지훈 (SSP2332)', reqAt: '2026.06.30 08:30:08', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '2026.06.30 08:30:08', doneWhy: '이미지가 깨집니다' },
  { ver: '', req: '김지훈 (SSP2332)', reqAt: '2026.06.30 08:30:08', reqWhy: '이번 캠페인 공지입니다', apr: '정지솔 (SSP12344)', doneAt: '2026.06.30 08:30:08', doneWhy: '' },
  { ver: '', req: '김지훈 (SSP2332)', reqAt: '2026.06.30 08:30:08', reqWhy: '', apr: '정지솔 (SSP12344)', doneAt: '2026.06.30 08:30:08', doneWhy: '' },
];

const tabBar = () => `<div class="tabs" role="tablist" aria-label="EPC 상품 상세 탭">${TABS.map(([k, l]) =>
  `<button type="button" role="tab" data-tab="${k}" class="${TAB === k ? 'on' : ''}" aria-selected="${TAB === k}">${l}</button>`).join('')}</div>`;

function histView() {
  const total = HIST.length, pages = Math.max(1, Math.ceil(total / PER));
  PAGE = Math.min(Math.max(1, PAGE), pages);
  const rows = HIST.slice((PAGE - 1) * PER, PAGE * PER).map((h, i) => {
    const no = total - (PAGE - 1) * PER - i;
    return `<tr><td>${no}</td><td>${val(h.ver)}</td><td>${val(h.req)}</td><td class="mid">${val(h.reqAt)}</td><td class="l">${val(h.reqWhy)}</td>
      <td>${val(h.apr)}</td><td class="mid">${val(h.doneAt)}</td><td class="l">${val(h.doneWhy)}</td></tr>`;
  }).join('');
  const nav = (a, label, aria, dis) => `<button type="button" data-pg="${a}" aria-label="${aria}" ${dis ? 'disabled' : ''}>${label}</button>`;
  const pager = `<nav class="pager" aria-label="페이지">${nav(1, '«', '처음', PAGE === 1)}${nav(PAGE - 1, '‹', '이전', PAGE === 1)}
    ${Array.from({ length: pages }, (_, i) => `<button type="button" data-pg="${i + 1}" class="${PAGE === i + 1 ? 'on' : ''}" ${PAGE === i + 1 ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('')}
    ${nav(PAGE + 1, '›', '다음', PAGE === pages)}${nav(pages, '»', '마지막', PAGE === pages)}</nav>`;
  return `<section class="sec"><div class="tw"><table class="tbl"><thead><tr><th>No.</th><th>Ver.</th><th>승인 요청자</th><th>요청 일시</th><th class="l">요청 사유</th><th>승인 담당자</th><th>처리 일시</th><th class="l">처리 사유</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8">변경 이력이 없습니다.</td></tr>'}</tbody></table></div>${pager}</section>`;
}

function view() {
  if (!p) return `${crumb(['EPC 상품 조회', '상세'])}<div class="emptybox">EPC 상품을 찾을 수 없습니다.</div><div class="foot"><a class="btn lg" href="${LIST}">목록</a></div>`;
  const head = `${crumb(['EPC 상품 조회', '상세'])}${ph('EPC 상품 상세')}${tabBar()}`;
  if (TAB === 'hist') return `${head}${histView()}<div class="foot pm3h-foot"><a class="btn lg" href="${LIST}">목록</a></div>`;
  const r = epcRow(p), x = epcOf(p), add = selPS(p).flatMap(s => s.cands.map(c => c.add));
  const d = DED[p.epc] || { on: false };
  const psRows = p.dt.map(ps => ps.req
    ? `<tr><td class="mid">${esc(ps.id)}</td><td class="l">${esc(ps.name)}</td><td>${badge('필수', 'ac')}</td><td>-</td><td class="l">${esc(ps.desc)}</td></tr>`
    : `<tr><td class="mid">${esc(ps.id)}</td><td class="l">${esc(ps.name)}</td><td>${badge('선택')}</td><td>${ps.min} ~ ${ps.max}개</td>
       <td class="l"><div class="dim-t">후보 ${ps.cands.length}개</div>${chips(ps.cands.map(c => `${c.n} (${c.add ? '+' + won(c.add) + '원' : '추가금 없음'})`))}</td></tr>`).join('');
  const mpRows = (p.mpg || []).flatMap(g => g.mps.map(m => `<tr><td class="l">${esc(g.name)} <span class="dim-t">(${g.min} ~ ${g.max}개)</span></td>
    <td class="mid">${esc(m.id)}</td><td class="l">${esc(m.name)}</td><td class="mid">${esc(m.svc)}</td><td>${m.from} ~ ${m.to}</td></tr>`)).join('');

  return `${head}
  ${sec('상품 기본 정보', ft(
    tr2('EPC 상품ID', `<span class="mid">${p.epc}</span>`, '버전', esc(p.ver))
    + tr2('EPC 상품명', esc(p.name), 'PO ID', `<span class="mid">${esc(p.id)}</span>`)
    + tr2('상품 구분', esc(p.type), '상품유형', val(p.cat))
    + tr2('EPC 상태', badge(p.st), '판매상태', esc(p.sale))
    + tr1('상품 설명', val(p.desc))
    + tr1('이미지', chips(p.img || []))
    + tr1('안내 템플릿', chips(poTpls(p).map(id => tplBy(id)?.n || id)))
    + tr1('최종등록일시', r.at)))}
  ${sec('EPC 분류', ft(
    tr2('LV1', '상품', 'LV2', esc(x.lv2))
    + tr2('LV3', esc(x.lv3), 'Product Spec ID', `<span class="mid">${r.specId}</span>`)
    + tr1('Product Spec', esc(x.spec))))}
  ${sec('계약 속성', ft(
    tr2('계약유형', val(x.contract), '회선필수', val(x.line))
    + tr2('제공주체', val(x.provider), '회선종류', val(x.lineKind))
    + tr1('회선상태', val(x.lineState))
    + tr1('기존 가입상품', val(x.exist))
    + tr2('중복가입', val(x.dup), '상품 조합', val(x.combo))))}
  ${sec('가격 정책', ft(
    tr2('기본가', `${won(p.base)}원`, '선택 추가금', add.length ? `${won(Math.min(...add))}원 ~ ${won(Math.max(...add))}원` : '-')
    + tr1('공제항목 반영', `<span class="p5-line"><button type="button" class="tgl ${d.on ? 'on' : ''}" role="switch" aria-checked="${d.on}" aria-label="공제항목 반영" data-a="deduct"></button><b>${d.on ? 'ON' : 'OFF'}</b>
      <span class="dim-t">${d.on ? '고객 화면 금액을 공제항목(할인)을 뺀 납부 예정 금액으로 노출함' : 'EPC Price policy의 정상가를 노출함'}</span></span>`)))}
  ${sec('PS 구성', `<div class="tw"><table class="tbl"><thead><tr><th>PS ID</th><th class="l">PS명</th><th>구분</th><th>선택 개수</th><th class="l">구성 · 후보(추가금)</th></tr></thead><tbody>${psRows}</tbody></table></div>`)}
  ${mpRows ? sec('요금프로그램그룹(MP)', `<div class="tw"><table class="tbl"><thead><tr><th class="l">그룹(선택 개수)</th><th>MP ID</th><th class="l">MP명</th><th>원천 서비스 코드</th><th>유효기간</th></tr></thead><tbody>${mpRows}</tbody></table></div>`) : ''}
  ${sec('처리 정보', ft(tr2('공제항목 반영 변경일시', d.at || '-', '변경자', val(d.by))))}
  <div class="foot pm3h-foot"><a class="btn lg" href="${LIST}">목록</a></div>`;
}

function toast(msg) {
  const root = $('#toast-root'); root.innerHTML = `<div class="toast" role="status"><span>${esc(msg)}</span></div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => root.innerHTML = '', 4000);
}
function render() { $('#view').innerHTML = view(); }

$('#view').addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    if (tab.dataset.tab === TAB) return;
    TAB = tab.dataset.tab; PAGE = 1;
    const u = new URL(location.href);
    TAB === 'hist' ? u.searchParams.set('tab', 'hist') : u.searchParams.delete('tab');
    history.replaceState(null, '', u);
    render(); return;
  }
  const pg = e.target.closest('[data-pg]');
  if (pg && !pg.disabled) { PAGE = Number(pg.dataset.pg); render(); return; }
  if (!e.target.closest('[data-a="deduct"]')) return;
  const on = !(DED[p.epc]?.on);
  DED[p.epc] = { on, at: nowStamp(), by: USER };
  save(); render();
  toast(`공제항목 반영을 ${on ? 'ON' : 'OFF'}으로 변경했습니다.`);
});

render();
