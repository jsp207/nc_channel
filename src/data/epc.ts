// @ts-nocheck
// EPC 상품 데이터 공용 진입점. 모든 메뉴(상품 전시 등록 · EPC 상품 조회 · 다운로드 등)는 EPC 상품을 이 파일에서 가져다 쓴다.
//
// 데이터는 아래 두 JSON 파일에서 관리한다. 상품을 추가하거나 고칠 때는 JSON만 고치면 모든 메뉴에 반영된다.
//  - epc-products.json : EPC 상품(PO) 목록. 상품 하나 = { } 한 덩어리
//  - epc-codes.json    : 코드표. LV2 목록 · LV3 속성(계약유형 · 회선 · 제공주체 등) · 상품 구분 · EPC 상태 → 판매상태
//
// epc-products.json 항목
//  epc   EPC 상품ID(6자리, 겹치면 안 됨)     id    PO ID(겹치면 안 됨)        name  EPC 상품명
//  ver   버전                               st    EPC 상태(출시 · 검증 · 운영 · 가입중단 · 퇴출)
//  type  상품 구분(codes.types 중 하나)      cat   상품유형(선택. 태블릿 · 웨어러블)
//  lv3   LV3 서비스유형(codes.lv3 이름)       provider  제공주체(선택. LV3 기본값과 다를 때만)
//  base  기본가(원)                         desc  상품 설명               img   이미지 파일명 목록
//  dt    PS 목록. 필수 PS = {id, name, req:true, desc}
//        선택 PS = {id, name, req:false, min, max, cands:[{n:후보명, add:추가금}]}
//  mpg   요금프로그램그룹(선택). PO에 따로 붙는 혜택(MP) 묶음 = {id, name, min, max, mps:[MP]}
//        MP = {id, name, svc:원천 서비스 코드, desc, from:유효 시작일, to:유효 종료일}. 고르면 가격이 그대로인 쪽이 MP다
// 판매상태(sale)는 st로 정해지므로 적지 않는다.
import PRODUCTS from "./epc-products.json";
import CODES from "./epc-codes.json";

export const LV2S = CODES.lv2;
export const LV3S = CODES.lv3;
export const TYPES = CODES.types;
// st = EPC 상품상태, sale = 전시 화면에 보이는 판매상태
export const ST_SALE = CODES.status;

// PO: 판매 단위. dt = Delivery type(PS 목록), base = Price policy 기본가, 후보 add = 추가금
export const PO = PRODUCTS.map(p => ({ ...p, sale: ST_SALE[p.st] }));
export const poBy = id => PO.find(p => p.id === id);
export const selPS = po => po.dt.filter(p => !p.req);
export const hasSel = po => selPS(po).length > 0;

// PS 개별 전시용: PO의 PS를 펼친 목록
export const PSLIST = PO.flatMap(po => po.dt.flatMap(ps => ps.req
  ? [{ key: po.id + '|' + ps.id, name: ps.name, desc: ps.desc, po, kind: '필수 PS' }]
  : ps.cands.map((c, ci) => ({ key: po.id + '|' + ps.id + '|' + ci, name: c.n, desc: `${ps.name} 후보 · ${c.add ? '+' + c.add.toLocaleString() + '원' : '추가금 없음'}`, po, kind: '선택 PS 후보' }))));
export const psBy = k => PSLIST.find(x => x.key === k);

// MP 고정 전시용: PO의 요금프로그램그룹(mpg) 안 MP를 펼친 목록. key = 'PO id|MP id'
export const MPLIST = PO.flatMap(po => (po.mpg || []).flatMap(g => g.mps.map(m => ({ ...m, key: po.id + '|' + m.id, po, group: g }))));
export const mpBy = k => MPLIST.find(x => x.key === k);
export const mpsOf = po => MPLIST.filter(x => x.po === po);

// 상품의 EPC 분류 · 계약 속성: LV3 속성표 + 상품별 값(제공주체 · Product Spec)
export const epcOf = p => {
  const s = LV3S[p.lv3];
  return { ...s, lv3: p.lv3, provider: p.provider || s.provider, spec: s.spec || `${p.name} Product Spec` };
};

// 데이터 점검: 잘못 적힌 값이 있으면 개발자 도구 콘솔에 알려 준다
(() => {
  const dup = k => PO.map(p => p[k]).filter((v, i, a) => a.indexOf(v) !== i);
  const errs = [
    ...dup('epc').map(v => `EPC 상품ID ${v}가 겹쳐요`),
    ...dup('id').map(v => `PO ID ${v}가 겹쳐요`),
    ...PO.filter(p => !LV3S[p.lv3]).map(p => `${p.id}: LV3 '${p.lv3}'가 epc-codes.json에 없어요`),
    ...PO.filter(p => !(p.st in ST_SALE)).map(p => `${p.id}: EPC 상태 '${p.st}'가 epc-codes.json에 없어요`),
    ...PO.filter(p => !TYPES.includes(p.type)).map(p => `${p.id}: 상품 구분 '${p.type}'가 epc-codes.json에 없어요`),
    ...MPLIST.map(m => m.key).filter((v, i, a) => a.indexOf(v) !== i).map(v => `MP ${v}가 겹쳐요`),
    ...MPLIST.filter(m => !m.from || !m.to || m.from > m.to).map(m => `${m.key}: MP 유효기간(from · to)을 확인하세요`),
  ];
  if (errs.length) console.warn('[EPC 데이터 점검]\n' + errs.join('\n'));
})();
