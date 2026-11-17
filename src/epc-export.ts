// @ts-nocheck
// EPC 상품 한 건을 조회 목록 행 · 내려받기(JSON)용 레코드로 만든다. epc-list.ts(EPC 상품 조회)가 쓰고,
// export/epc-products-sample.json도 같은 함수로 만든다(scripts/export-epc.mjs).
// 구성: LV1(상품) > LV2(서비스 도메인) > LV3(서비스 유형) > Product Spec > PO > Delivery type(PS) · Price policy
import { LV2S, LV3S, TYPES, ST_SALE, epcOf, selPS, hasSel } from "./data/epc";
import { seedNum, poTpls, tplBy } from "./display-data";

export const ST_LIST = Object.keys(ST_SALE);
// 최종등록(수정)일시: 상품명으로 정해 새로고침해도 같게 둔다
const stamp = name => { const h = seedNum(name), p = n => String(n).padStart(2, '0'); return `2026.${p(1 + h % 10)}.${p(1 + h % 28)} ${p(h % 24)}:${p(h % 60)}:${p((h >>> 3) % 60)}`; };

// 조회 목록 한 행: EPC 상품ID · 버전 · EPC 상품명 · LV2 · LV3 · Product Spec · EPC 상태 · 최종등록일시 (+ 검색용 PO ID · Spec ID)
export const epcRow = p => { const x = epcOf(p); return { p, x, epc: p.epc, ver: p.ver, name: p.name, lv2: x.lv2, lv3: x.lv3, spec: x.spec, specId: `SPEC-${p.epc}`, st: p.st, po: p.id, at: stamp(p.name) }; };

// 내려받기 레코드: 앞쪽은 조회 목록 컬럼과 같은 순서, 뒤쪽은 상세 스펙(PO · 계약 속성 · 가격 · PS 구성 · 템플릿 · 이미지)
export function epcRecord(r) {
  const p = r.p, x = r.x, add = selPS(p).flatMap(s => s.cands.map(c => c.add));
  return {
    epcProductId: r.epc,
    version: r.ver,
    epcProductName: r.name,
    lv1: '상품',
    lv2: r.lv2,
    lv3: r.lv3,
    productSpecId: r.specId,
    productSpec: r.spec,
    status: r.st,
    updatedAt: r.at,
    saleStatus: p.sale,
    productOffering: { id: p.id, type: p.type, category: p.cat ?? null, description: p.desc },
    contractAttributes: {
      contractType: x.contract, lineRequired: x.line, provider: x.provider,
      lineKind: x.lineKind, lineState: x.lineState, existingSubscription: x.exist,
      duplicateSubscription: x.dup, productCombination: x.combo,
    },
    pricePolicy: { currency: 'KRW', basePrice: p.base, optionalSurcharge: add.length ? { min: Math.min(...add), max: Math.max(...add) } : null },
    deliveryType: p.dt.map(ps => ps.req
      ? { psId: ps.id, name: ps.name, selection: '필수', description: ps.desc }
      : { psId: ps.id, name: ps.name, selection: '선택', minSelect: ps.min, maxSelect: ps.max, candidates: ps.cands.map((c, i) => ({ seq: i + 1, name: c.n, surcharge: c.add })) }),
    hasSelectablePS: hasSel(p),
    // 요금프로그램그룹: PO에 따로 붙는 혜택(MP). 고르면 가격이 그대로다
    mpGroups: (p.mpg || []).map(g => ({ groupId: g.id, name: g.name, minSelect: g.min, maxSelect: g.max,
      mps: g.mps.map(m => ({ mpId: m.id, name: m.name, sourceServiceCode: m.svc, description: m.desc, validFrom: m.from, validTo: m.to })) })),
    templates: poTpls(p).map(id => { const t = tplBy(id); return { id, name: t?.n, type: t?.t, version: t?.v }; }),
    images: p.img,
  };
}

// 내려받기 파일 전체. rows = 조회 목록 행(epcRow), filter = 내려받을 때 적용한 조회 조건
export const epcExport = (rows, filter = null) => ({
  meta: {
    source: 'EPC 상품 조회 (src/data/epc-products.json · epc-codes.json)',
    exportedAt: new Date().toISOString(),
    note: 'EPC에서 내려오는 값으로 가정한 프로토타입 샘플. 금액 · 일부 LV3 속성(회선종류 · 회선상태 · 기존 가입상품 · 중복가입 · 상품 조합)은 화면 확인용 가정값',
    hierarchy: 'LV1(상품) > LV2(서비스 도메인) > LV3(서비스 유형) > Product Spec > Product Offering(PO) > Delivery type(PS) · Price policy',
    filter,
    count: rows.length,
  },
  codes: { lv2: LV2S, lv3: LV3S, productTypes: TYPES, status: ST_SALE },
  products: rows.map(epcRecord),
});

// CSV 내려받기: 상품 한 건 = 한 줄. 앞쪽은 조회 목록 컬럼, 뒤쪽은 JSON과 같은 상세 스펙을 펼친 값
// PS 구성 · 템플릿 · 이미지처럼 여러 값인 칸은 ' | '로 잇는다
const CSV_COLS = [
  ['EPC 상품ID', d => d.epcProductId], ['버전', d => d.version], ['EPC 상품명', d => d.epcProductName],
  ['LV1', d => d.lv1], ['LV2', d => d.lv2], ['LV3', d => d.lv3], ['Product Spec ID', d => d.productSpecId], ['Product Spec', d => d.productSpec],
  ['EPC 상태', d => d.status], ['판매상태', d => d.saleStatus], ['최종등록일시', d => d.updatedAt],
  ['PO ID', d => d.productOffering.id], ['상품 구분', d => d.productOffering.type], ['상품유형', d => d.productOffering.category], ['상품 설명', d => d.productOffering.description],
  ['계약유형', d => d.contractAttributes.contractType], ['회선필수', d => d.contractAttributes.lineRequired], ['제공주체', d => d.contractAttributes.provider],
  ['회선종류', d => d.contractAttributes.lineKind], ['회선상태', d => d.contractAttributes.lineState], ['기존 가입상품', d => d.contractAttributes.existingSubscription],
  ['중복가입', d => d.contractAttributes.duplicateSubscription], ['상품 조합', d => d.contractAttributes.productCombination],
  ['기본가(원)', d => d.pricePolicy.basePrice], ['선택 추가금 최소(원)', d => d.pricePolicy.optionalSurcharge?.min], ['선택 추가금 최대(원)', d => d.pricePolicy.optionalSurcharge?.max],
  ['선택 PS 여부', d => d.hasSelectablePS ? 'Y' : 'N'],
  ['PS 구성', d => d.deliveryType.map(s => s.selection === '필수' ? `${s.psId} ${s.name}(필수): ${s.description}` : `${s.psId} ${s.name}(선택 ${s.minSelect}~${s.maxSelect}개, 후보 ${s.candidates.length}개)`).join(' | ')],
  ['MP(요금프로그램그룹)', d => d.mpGroups.map(g => `${g.name}(${g.minSelect}~${g.maxSelect}): ${g.mps.map(m => m.name).join(' · ')}`).join(' | ')],
  ['템플릿', d => d.templates.map(t => t.name || t.id).join(' | ')],
  ['이미지', d => d.images.join(' | ')],
];
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const epcCsv = rows => [CSV_COLS.map(([h]) => h), ...rows.map(epcRecord).map(d => CSV_COLS.map(([, f]) => f(d)))]
  .map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
