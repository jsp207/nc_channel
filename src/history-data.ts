// 히스토리 원본 데이터: 메뉴 › 버전 › 화면 파일 한 곳에서 관리합니다.
// - menu: LNB(src/lnb.ts MENU)의 메뉴 label과 똑같이 씁니다. LNB에 없는 메뉴는 LEGACY_MENUS에 적습니다.
// - 같은 버전에 화면(목록·상세·등록 …)이 여러 개면 파일마다 한 줄씩 씁니다.
// - 제목은 `${menu} v${ver} · ${screen}`로 자동으로 만들고, 각 HTML의 <title>도 같은 문자열로 맞춥니다
//   (node scripts/check-history.mjs 로 확인, --fix 로 <title> 일괄 수정).
// - Latest는 직접 적지 않습니다. LNB 메뉴 href 파일의 버전과 같은 버전의 화면·정책이 자동으로 Latest가 됩니다.

export type Tab = 'prod' | 'order' | 'pay' | 'common';

export interface Screen {
  menu: string;
  ver: string;      // '0.3', '0.2.4' (앞의 v는 빼고 씁니다)
  screen: string;   // 목록, 상세, 등록, 목록·등록 …
  file: string;
  date: string;     // 처음 만든 날
  note?: string;
}

export interface Policy {
  name: string;     // 정책서 이름(버전 제외)
  ver: string;      // 정책서 자체 버전
  file: string;
  date: string;
  for: { menu: string; ver: string }[]; // 이 정책서가 기준이 되는 화면 버전(공통 정책서는 비워 둡니다)
  note?: string;
}

export const TABS: { key: Tab; label: string; group: string }[] = [
  { key: 'prod', label: '상품', group: '상품관리' },
  { key: 'order', label: '주문', group: '주문관리' },
  { key: 'pay', label: '결제', group: '결제관리' },
  { key: 'common', label: '공통', group: '' }, // 상품 · 주문 · 결제 공통 정책만 둡니다
];

// LNB에 없는(메뉴에서 빠진) 메뉴. 히스토리에서는 탭 뒤쪽에 '메뉴 없음'으로 보여 줍니다.
export const LEGACY_MENUS: Record<Tab, string[]> = {
  prod: ['번들 관리'],
  order: ['주문 코너 그룹 관리'],
  pay: [],
  common: [],
};

export const SCREENS: Screen[] = [
  // ── 상품 ──────────────────────────────────────────
  { menu: 'EPC 상품조회', ver: '0.1', screen: '상세', file: 'epc-detail.html', date: '2026-11-23' },
  { menu: 'EPC 상품조회', ver: '0.1', screen: '목록', file: 'epc-list.html', date: '2026-10-31' },

  { menu: '상품 전시 관리', ver: '0.3.1', screen: '목록·등록', file: 'product-v031.html', date: '2026-11-25' },
  { menu: '상품 전시 관리', ver: '0.3', screen: '목록·등록', file: 'product-v030.html', date: '2026-11-11' },
  { menu: '상품 전시 관리', ver: '0.2.4', screen: '목록·등록', file: 'product-v024.html', date: '2026-11-03' },
  { menu: '상품 전시 관리', ver: '0.2.3', screen: '목록·등록', file: 'product-v023.html', date: '2026-11-02' },
  { menu: '상품 전시 관리', ver: '0.2.2', screen: '목록·등록', file: 'product-v022.html', date: '2026-10-27' },
  { menu: '상품 전시 관리', ver: '0.2.1', screen: '목록·등록', file: 'product-v021.html', date: '2026-10-17' },
  { menu: '상품 전시 관리', ver: '0.2', screen: '일괄 목록', file: 'product-display-bulk.html', date: '2026-10-26' },
  { menu: '상품 전시 관리', ver: '0.2', screen: '목록·등록', file: 'product-v020.html', date: '2026-10-10' },
  { menu: '상품 전시 관리', ver: '0.1.3', screen: '목록·등록', file: 'product-v013.html', date: '2026-10-03' },
  { menu: '상품 전시 관리', ver: '0.1.2', screen: '목록·등록', file: 'product-v012.html', date: '2026-10-02' },
  { menu: '상품 전시 관리', ver: '0.1.1', screen: '목록·등록', file: 'product-v011.html', date: '2026-09-29' },
  { menu: '상품 전시 관리', ver: '0.1', screen: '목록·등록', file: 'display-create.html', date: '2026-09-27' },

  { menu: '상품 콘텐츠 관리', ver: '0.2', screen: '변경이력조회', file: 'product-content-v02-history.html', date: '2026-11-18' },
  { menu: '상품 콘텐츠 관리', ver: '0.2', screen: '목록·상세', file: 'product-content-v02.html', date: '2026-11-17' },
  { menu: '상품 콘텐츠 관리', ver: '0.1', screen: '목록·상세', file: 'product-content.html', date: '2026-10-26' },

  { menu: '번들 관리', ver: '0.1.4', screen: '등록', file: 'bundle-create4.html', date: '2026-09-29' },
  { menu: '번들 관리', ver: '0.1.3', screen: '등록', file: 'bundle-create3.html', date: '2026-09-28' },
  { menu: '번들 관리', ver: '0.1.2', screen: '등록', file: 'bundle-create2.html', date: '2026-09-27' },
  { menu: '번들 관리', ver: '0.1.1', screen: '등록', file: 'bundle-create.html', date: '2026-09-27' },
  { menu: '번들 관리', ver: '0.1', screen: '목록', file: 'bundle-list.html', date: '2026-09-27' },


  // ── 주문 ──────────────────────────────────────────
  { menu: '주문 프로세스 관리', ver: '0.3', screen: '목록·등록', file: 'order7-create.html', date: '2026-11-09' },
  { menu: '주문 프로세스 관리', ver: '0.2.4', screen: '목록·등록', file: 'order6-create.html', date: '2026-11-05' },
  { menu: '주문 프로세스 관리', ver: '0.2.3', screen: '목록·등록', file: 'order5-create.html', date: '2026-11-02' },
  { menu: '주문 프로세스 관리', ver: '0.2.2', screen: '목록·등록', file: 'order4-create.html', date: '2026-10-26' },
  { menu: '주문 프로세스 관리', ver: '0.2.1', screen: '상세', file: 'order3-create.html', date: '2026-10-17' },
  { menu: '주문 프로세스 관리', ver: '0.2', screen: '상세', file: 'order2-create.html', date: '2026-10-13' },
  { menu: '주문 프로세스 관리', ver: '0.2', screen: '화면 시안 A/B/C', file: 'order_container_layout.html', date: '2026-10-13' },
  { menu: '주문 프로세스 관리', ver: '0.1', screen: '목록', file: 'order1.html', date: '2026-10-12' },
  { menu: '주문 프로세스 관리', ver: '0.1', screen: '등록', file: 'order1-create.html', date: '2026-10-12' },

  { menu: '주문 코너 관리', ver: '0.3', screen: '목록·등록', file: 'order-corner-v30.html', date: '2026-11-09' },
  { menu: '주문 코너 관리', ver: '0.2.2', screen: '목록·등록', file: 'order-corner-v22.html', date: '2026-11-03' },
  { menu: '주문 코너 관리', ver: '0.2.1', screen: '목록·등록', file: 'order-corner-v21.html', date: '2026-10-30' },
  { menu: '주문 코너 관리', ver: '0.1', screen: '목록·등록', file: 'order-corner-create.html', date: '2026-10-20' },

  { menu: '주문 코너 유형 관리', ver: '0.3', screen: '목록·등록', file: 'order-corner-type-v30.html', date: '2026-11-10' },

  { menu: '주문 코너 그룹 관리', ver: '0.3', screen: '목록·등록', file: 'order-corner-group-v30.html', date: '2026-11-09' },
  { menu: '주문 코너 그룹 관리', ver: '0.2.3', screen: '목록·등록', file: 'order-corner-group-v23.html', date: '2026-11-05' },
  { menu: '주문 코너 그룹 관리', ver: '0.2.2', screen: '목록·등록', file: 'order-corner-group-v22.html', date: '2026-11-04' },

  // ── 결제 ──────────────────────────────────────────
  { menu: '결제수단 기준정보 관리', ver: '0.2.3', screen: '목록', file: 'payment-method5.html', date: '2026-11-21' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.3', screen: '상세', file: 'payment-method5-detail.html', date: '2026-11-21' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '목록', file: 'payment-method4.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '결제수단 상세', file: 'payment-method4-detail.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '가맹점 상세', file: 'payment-method4-merchant.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '등록', file: 'payment-method4-create.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.1', screen: '목록', file: 'payment-method3.html', date: '2026-11-01' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.1', screen: '등록', file: 'payment-method3-create.html', date: '2026-11-01' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.1', screen: '계약 상세', file: 'payment-method3-detail.html', date: '2026-11-01' },
  { menu: '결제수단 기준정보 관리', ver: '0.2', screen: '목록', file: 'payment-method2.html', date: '2026-10-13' },
  { menu: '결제수단 기준정보 관리', ver: '0.2', screen: '등록', file: 'payment-method2-create.html', date: '2026-10-13' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '통합 시안', file: 'payment1.html', date: '2026-10-04' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '가맹점 정보', file: 'payment-merchant.html', date: '2026-10-04' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '가맹점 상품', file: 'payment-merchant-product.html', date: '2026-10-04' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '노출 우선순위', file: 'payment-exposure.html', date: '2026-10-04' },

  { menu: '결제 이력 관리', ver: '0.2.3', screen: '목록', file: 'payment-history5.html', date: '2026-11-21' },
  { menu: '결제 이력 관리', ver: '0.2.3', screen: '상세', file: 'payment-history5-detail.html', date: '2026-11-21' },
  { menu: '결제 이력 관리', ver: '0.2.2', screen: '목록', file: 'payment-history4.html', date: '2026-11-03' },
  { menu: '결제 이력 관리', ver: '0.2.2', screen: '상세', file: 'payment-history4-detail.html', date: '2026-11-03' },
  { menu: '결제 이력 관리', ver: '0.2.1', screen: '목록', file: 'payment-history3.html', date: '2026-11-01' },
  { menu: '결제 이력 관리', ver: '0.2.1', screen: '상세', file: 'payment-history3-detail.html', date: '2026-11-01' },
  { menu: '결제 이력 관리', ver: '0.2', screen: '목록', file: 'payment-history2.html', date: '2026-10-13' },
  { menu: '결제 이력 관리', ver: '0.1', screen: '목록', file: 'payment-history.html', date: '2026-10-04' },

  { menu: '결제 거래내역 대사관리', ver: '0.2.3', screen: '목록', file: 'payment-recon5.html', date: '2026-11-21' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.3', screen: '상세', file: 'payment-recon5-detail.html', date: '2026-11-23' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.2', screen: '승인대사·입금대사', file: 'payment-recon4.html', date: '2026-11-03' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.1', screen: '목록', file: 'payment-recon3.html', date: '2026-11-03' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.1', screen: '상세', file: 'payment-recon3-detail.html', date: '2026-11-03' },
  { menu: '결제 거래내역 대사관리', ver: '0.2', screen: '수수료·정산 대사', file: 'payment-reconciliation2.html', date: '2026-10-13' },

  { menu: 'PG 수수료 조회', ver: '0.2.3', screen: '목록', file: 'payment-fee5.html', date: '2026-11-21' },
  { menu: 'PG 수수료 조회', ver: '0.2.3', screen: '상세', file: 'payment-fee5-detail.html', date: '2026-11-21' },
  { menu: 'PG 수수료 조회', ver: '0.2.2', screen: '목록', file: 'payment-fee4.html', date: '2026-11-03' },
  { menu: 'PG 수수료 조회', ver: '0.2.2', screen: '상세', file: 'payment-fee4-detail.html', date: '2026-11-09' },
  { menu: 'PG 수수료 조회', ver: '0.1', screen: '수수료·정산 관리', file: 'payment-settlement.html', date: '2026-10-04' },

  { menu: 'PG 관리', ver: '0.2.3', screen: '목록', file: 'payment-pg5.html', date: '2026-11-21' },
  { menu: 'PG 관리', ver: '0.2.3', screen: '상세', file: 'payment-pg5-detail.html', date: '2026-11-21' },
  { menu: 'PG 관리', ver: '0.2.3', screen: '등록·수정', file: 'payment-pg5-form.html', date: '2026-11-21' },
  { menu: 'PG 관리', ver: '0.2.2', screen: '목록', file: 'payment-pg4.html', date: '2026-11-03' },
  { menu: 'PG 관리', ver: '0.2.2', screen: '상세', file: 'payment-pg4-detail.html', date: '2026-11-09' },
  { menu: 'PG 관리', ver: '0.2.2', screen: '등록·수정', file: 'payment-pg4-form.html', date: '2026-11-03' },
];

export const POLICIES: Record<Tab, Policy[]> = {
  prod: [
    { name: '상품 기준·정책', ver: '0.1', file: 'policy.html', date: '2026-09-23',
      for: [{ menu: '상품 전시 관리', ver: '0.1' }, { menu: '번들 관리', ver: '0.1' }] },
  ],
  order: [
    { name: '주문 코너 그룹 관리 정책서', ver: '0.2.1', file: 'order-corner-group-policy-v021.html', date: '2026-11-06',
      for: [{ menu: '주문 코너 그룹 관리', ver: '0.2.3' }, { menu: '주문 프로세스 관리', ver: '0.2.4' }] },
    { name: '주문 코너 그룹 관리 정책서', ver: '0.2', file: 'order-corner-group-policy-v02.html', date: '2026-11-05',
      for: [{ menu: '주문 코너 그룹 관리', ver: '0.2.3' }, { menu: '주문 프로세스 관리', ver: '0.2.4' }] },
    { name: '주문 코너 그룹 관리 정책서', ver: '0.1', file: 'order-corner-group-policy.html', date: '2026-11-04',
      for: [{ menu: '주문 코너 그룹 관리', ver: '0.2.2' }] },
  ],
  pay: [
    { name: '결제관리 정책서 / IA', ver: '0.2.2', file: 'payment-policy4.html', date: '2026-11-03',
      for: ['결제수단 기준정보 관리', '결제 이력 관리', '결제 거래내역 대사관리', 'PG 수수료 조회', 'PG 관리'].map(menu => ({ menu, ver: '0.2.2' })) },
    { name: '결제 정책', ver: '0.1', file: 'payment-policy.html', date: '2026-10-04',
      for: ['결제수단 기준정보 관리', '결제 이력 관리', 'PG 수수료 조회'].map(menu => ({ menu, ver: '0.1' })) },
  ],
  common: [
    { name: '공통 정책서', ver: '0.1', file: 'common-policy.html', date: '2026-11-23', for: [] },
  ],
};

export const screenTitle = (s: Screen) => `${s.menu} v${s.ver} · ${s.screen}`;
export const policyTitle = (p: Policy) => `${p.name} v${p.ver}`;

// 버전 비교: '0.2.4' < '0.3'
export function cmpVer(a: string, b: string) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}

// 메뉴별 현재(Latest) 버전: LNB 메뉴 href 파일의 버전. hrefs는 { 메뉴 label: href }
export function latestVersions(hrefs: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const [menu, href] of Object.entries(hrefs)) {
    const s = href && SCREENS.find(r => r.menu === menu && r.file === href);
    if (s) out[menu] = s.ver;
  }
  return out;
}
