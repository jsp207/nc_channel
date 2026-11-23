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
  prod: ['번들 관리', '상품 목록'],
  order: ['주문 코너 그룹 관리'],
  pay: [],
  common: [],
};

export const SCREENS: Screen[] = [
  // ── 상품 ──────────────────────────────────────────
  { menu: 'EPC 상품조회', ver: '0.1', screen: '상세', file: 'epc-detail.html', date: '2026-11-23', note: '읽기 전용, 공제항목 반영 ON/OFF만 수정' },
  { menu: 'EPC 상품조회', ver: '0.1', screen: '목록', file: 'epc-list.html', date: '2026-10-31' },

  { menu: '상품 전시 관리', ver: '0.3.2', screen: '등록', file: 'product-v032.html', date: '2026-11-19', note: '공통 속성 BSS Override, 채널별 노출 제어(가입유형 · 할부 · 기프트/티다팩)' },
  { menu: '상품 전시 관리', ver: '0.3.1', screen: '등록', file: 'product-v031.html', date: '2026-11-18', note: '공통 · 통합 앱 전용 영역 구분, 채널 관리 항목 노출 체크' },
  { menu: '상품 전시 관리', ver: '0.3', screen: '등록', file: 'product-v030.html', date: '2026-11-11', note: '연관 및 유사 상품 수급 방식' },
  { menu: '상품 전시 관리', ver: '0.3', screen: '목록', file: 'display-list2.html', date: '2026-10-27', note: '전시 목록 + 일괄 관리 통합' },
  { menu: '상품 전시 관리', ver: '0.2.4', screen: '등록', file: 'product-v024.html', date: '2026-11-03', note: '주문 프로세스 연동' },
  { menu: '상품 전시 관리', ver: '0.2.3', screen: '등록', file: 'product-v023.html', date: '2026-11-02' },
  { menu: '상품 전시 관리', ver: '0.2.2', screen: '등록', file: 'product-v022.html', date: '2026-10-27' },
  { menu: '상품 전시 관리', ver: '0.2.1', screen: '목록·등록', file: 'product-v021.html', date: '2026-10-17' },
  { menu: '상품 전시 관리', ver: '0.2', screen: '일괄 목록', file: 'product-display-bulk.html', date: '2026-10-26' },
  { menu: '상품 전시 관리', ver: '0.2', screen: '목록·등록', file: 'product-v020.html', date: '2026-10-10', note: '1차 개발리뷰' },
  { menu: '상품 전시 관리', ver: '0.1.3', screen: '등록', file: 'product-v013.html', date: '2026-10-03' },
  { menu: '상품 전시 관리', ver: '0.1.2', screen: '등록', file: 'product-v012.html', date: '2026-10-02' },
  { menu: '상품 전시 관리', ver: '0.1.1', screen: '등록', file: 'product-v011.html', date: '2026-09-29' },
  { menu: '상품 전시 관리', ver: '0.1', screen: '목록', file: 'display-list.html', date: '2026-09-27' },
  { menu: '상품 전시 관리', ver: '0.1', screen: '등록', file: 'display-create.html', date: '2026-09-27' },

  { menu: '상품 콘텐츠 관리', ver: '0.2', screen: '변경이력조회', file: 'product-content-v02-history.html', date: '2026-11-18', note: '템플릿 상세 변경이력 탭' },
  { menu: '상품 콘텐츠 관리', ver: '0.2', screen: '목록·상세', file: 'product-content-v02.html', date: '2026-11-17', note: '안내 템플릿 적용 상품유형' },
  { menu: '상품 콘텐츠 관리', ver: '0.1', screen: '목록·상세', file: 'product-content.html', date: '2026-10-26' },

  { menu: '번들 관리', ver: '0.1.4', screen: '등록', file: 'bundle-create4.html', date: '2026-09-29' },
  { menu: '번들 관리', ver: '0.1.3', screen: '등록', file: 'bundle-create3.html', date: '2026-09-28' },
  { menu: '번들 관리', ver: '0.1.2', screen: '등록', file: 'bundle-create2.html', date: '2026-09-27' },
  { menu: '번들 관리', ver: '0.1.1', screen: '등록', file: 'bundle-create.html', date: '2026-09-27' },
  { menu: '번들 관리', ver: '0.1', screen: '목록', file: 'bundle-list.html', date: '2026-09-27' },

  { menu: '상품 목록', ver: '0.1', screen: '목록', file: 'product-list.html', date: '2026-09-29' },

  // ── 주문 ──────────────────────────────────────────
  { menu: '주문 프로세스 관리', ver: '0.3', screen: '목록·등록', file: 'order7-create.html', date: '2026-11-09' },
  { menu: '주문 프로세스 관리', ver: '0.2.4', screen: '목록·등록', file: 'order6-create.html', date: '2026-11-05' },
  { menu: '주문 프로세스 관리', ver: '0.2.3', screen: '목록·등록', file: 'order5-create.html', date: '2026-11-02' },
  { menu: '주문 프로세스 관리', ver: '0.2.2', screen: '목록·등록', file: 'order4-create.html', date: '2026-10-26' },
  { menu: '주문 프로세스 관리', ver: '0.2.1', screen: '상세', file: 'order3-create.html', date: '2026-10-17' },
  { menu: '주문 프로세스 관리', ver: '0.2', screen: '상세', file: 'order2-create.html', date: '2026-10-13', note: '주문 컨테이너 관리 2차' },
  { menu: '주문 프로세스 관리', ver: '0.2', screen: '화면 시안 A/B/C', file: 'order_container_layout.html', date: '2026-10-13' },
  { menu: '주문 프로세스 관리', ver: '0.1', screen: '목록', file: 'order1.html', date: '2026-10-12', note: '주문 템플릿 관리 1차' },
  { menu: '주문 프로세스 관리', ver: '0.1', screen: '등록', file: 'order1-create.html', date: '2026-10-12', note: '주문 템플릿 관리 1차' },

  { menu: '주문 코너 관리', ver: '0.3', screen: '목록·등록', file: 'order-corner-v30.html', date: '2026-11-09' },
  { menu: '주문 코너 관리', ver: '0.2.2', screen: '목록·등록', file: 'order-corner-v22.html', date: '2026-11-03' },
  { menu: '주문 코너 관리', ver: '0.2.1', screen: '목록·등록', file: 'order-corner-v21.html', date: '2026-10-30' },
  { menu: '주문 코너 관리', ver: '0.1', screen: '목록·등록', file: 'order-corner-create.html', date: '2026-10-20' },

  { menu: '주문 코너 유형 관리', ver: '0.3', screen: '목록·등록', file: 'order-corner-type-v30.html', date: '2026-11-10' },

  { menu: '주문 코너 그룹 관리', ver: '0.3', screen: '목록·등록', file: 'order-corner-group-v30.html', date: '2026-11-09' },
  { menu: '주문 코너 그룹 관리', ver: '0.2.3', screen: '목록·등록', file: 'order-corner-group-v23.html', date: '2026-11-05' },
  { menu: '주문 코너 그룹 관리', ver: '0.2.2', screen: '목록·등록', file: 'order-corner-group-v22.html', date: '2026-11-04' },

  // ── 결제 ──────────────────────────────────────────
  { menu: '결제수단 기준정보 관리', ver: '0.2.3', screen: '목록', file: 'payment-method5.html', date: '2026-11-21', note: '계약 단위 목록. 계약 · 결제수단 등록은 PG 관리로 이동' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.3', screen: '상세', file: 'payment-method5-detail.html', date: '2026-11-21', note: '가맹점(MID) · 결제 프로모션 등록, 입금계좌 · 대사 URL 계약정보 사용' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '목록', file: 'payment-method4.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '결제수단 상세', file: 'payment-method4-detail.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '가맹점 상세', file: 'payment-method4-merchant.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.2', screen: '등록', file: 'payment-method4-create.html', date: '2026-11-03' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.1', screen: '목록', file: 'payment-method3.html', date: '2026-11-01' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.1', screen: '등록', file: 'payment-method3-create.html', date: '2026-11-01' },
  { menu: '결제수단 기준정보 관리', ver: '0.2.1', screen: '계약 상세', file: 'payment-method3-detail.html', date: '2026-11-01' },
  { menu: '결제수단 기준정보 관리', ver: '0.2', screen: '목록', file: 'payment-method2.html', date: '2026-10-13' },
  { menu: '결제수단 기준정보 관리', ver: '0.2', screen: '등록', file: 'payment-method2-create.html', date: '2026-10-13' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '통합 시안', file: 'payment1.html', date: '2026-10-04', note: '결제 1차' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '가맹점 정보', file: 'payment-merchant.html', date: '2026-10-04' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '가맹점 상품', file: 'payment-merchant-product.html', date: '2026-10-04' },
  { menu: '결제수단 기준정보 관리', ver: '0.1', screen: '노출 우선순위', file: 'payment-exposure.html', date: '2026-10-04' },

  { menu: '결제 이력 관리', ver: '0.2.3', screen: '목록', file: 'payment-history5.html', date: '2026-11-21', note: 'PG 관리 · 결제수단 기준정보와 같은 데이터(계약 · MID) 기준으로 재구성' },
  { menu: '결제 이력 관리', ver: '0.2.3', screen: '상세', file: 'payment-history5-detail.html', date: '2026-11-21' },
  { menu: '결제 이력 관리', ver: '0.2.2', screen: '목록', file: 'payment-history4.html', date: '2026-11-03' },
  { menu: '결제 이력 관리', ver: '0.2.2', screen: '상세', file: 'payment-history4-detail.html', date: '2026-11-03' },
  { menu: '결제 이력 관리', ver: '0.2.1', screen: '목록', file: 'payment-history3.html', date: '2026-11-01' },
  { menu: '결제 이력 관리', ver: '0.2.1', screen: '상세', file: 'payment-history3-detail.html', date: '2026-11-01' },
  { menu: '결제 이력 관리', ver: '0.2', screen: '목록', file: 'payment-history2.html', date: '2026-10-13' },
  { menu: '결제 이력 관리', ver: '0.1', screen: '목록', file: 'payment-history.html', date: '2026-10-04' },

  { menu: '결제 거래내역 대사관리', ver: '0.2.3', screen: '목록', file: 'payment-recon5.html', date: '2026-11-21', note: '월별 조회(대사월 × PG사), 행별 다운로드' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.3', screen: '상세', file: 'payment-recon5-detail.html', date: '2026-11-23', note: 'MID별 승인 · 입금대사, 엑셀 업로드 · 오프라인 대사 상태 변경 이력' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.2', screen: '승인대사·입금대사', file: 'payment-recon4.html', date: '2026-11-03' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.1', screen: '목록', file: 'payment-recon3.html', date: '2026-11-03' },
  { menu: '결제 거래내역 대사관리', ver: '0.2.1', screen: '상세', file: 'payment-recon3-detail.html', date: '2026-11-03' },
  { menu: '결제 거래내역 대사관리', ver: '0.2', screen: '수수료·정산 대사', file: 'payment-reconciliation2.html', date: '2026-10-13' },

  { menu: 'PG 수수료 조회', ver: '0.2.3', screen: '목록', file: 'payment-fee5.html', date: '2026-11-21', note: '정산월 × MID, MID 수수료 조건 기준' },
  { menu: 'PG 수수료 조회', ver: '0.2.3', screen: '상세', file: 'payment-fee5-detail.html', date: '2026-11-21' },
  { menu: 'PG 수수료 조회', ver: '0.2.2', screen: '목록', file: 'payment-fee4.html', date: '2026-11-03' },
  { menu: 'PG 수수료 조회', ver: '0.2.2', screen: '상세', file: 'payment-fee4-detail.html', date: '2026-11-09' },
  { menu: 'PG 수수료 조회', ver: '0.1', screen: '수수료·정산 관리', file: 'payment-settlement.html', date: '2026-10-04' },

  { menu: 'PG 관리', ver: '0.2.3', screen: '목록', file: 'payment-pg5.html', date: '2026-11-21', note: 'ref v5 반영: PG사 › 계약 › 결제수단 › MID 구조' },
  { menu: 'PG 관리', ver: '0.2.3', screen: '상세', file: 'payment-pg5-detail.html', date: '2026-11-21' },
  { menu: 'PG 관리', ver: '0.2.3', screen: '등록·수정', file: 'payment-pg5-form.html', date: '2026-11-21', note: '계약번호 자동 채번, 제공 결제수단 원천 코드' },
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
    { name: '주문 코너 그룹 관리 정책서', ver: '0.2.1', file: 'order-corner-group-policy-v021.html', date: '2026-11-06', note: '프로세스 조건 허용',
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
    { name: '공통 정책서', ver: '0.1', file: 'common-policy.html', date: '2026-11-23', note: '상품 · 주문 · 결제 공통 케이스', for: [] },
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
