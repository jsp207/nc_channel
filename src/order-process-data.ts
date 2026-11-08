// @ts-nocheck
// 주문 프로세스 목록: 주문 프로세스 관리 v0.2.4(order6-create.html)와 상품 전시 관리 v0.2.4(product-v024.html)가 함께 쓴다.
// order6-create.html이 열리면 지금 목록(등록 · 수정 반영)을 이 브라우저 저장소(PROC_KEY)에 남기고, 저장할 때마다 다시 남긴다(src/order6-create.ts).
// 상품 전시는 저장소 값을 먼저 읽고, 아직 없으면 아래 샘플을 쓴다. 샘플은 order6-create.html 인라인 스크립트의 PROC_LIST와 같다. 그쪽 샘플을 바꾸면 여기도 함께 바꾼다.
// 저장소 키 이름은 예전(order5) 그대로 둔다. order5-create.html(v0.2.3)은 더 이상 남기지 않는다
// 프로세스 값: id · n(프로세스명) · cat(주문 유형 = 상품 유형 LV3 조합) · ap(승인 상태) · u(사용 여부) · cnt(전시 수) · dt · by · stages
// stages = 컨테이너 목록 [{name, scr(화면 ID), corners:[{id, n, t(주문 | 상품 연동), o:[선택지], off:[꺼진 선택지 번호], grp?(코너 그룹)}]}]
export const PROC_KEY = 'nova.order5.processes';

// 주문 유형 (order5 CAT_T와 같다)
export const PROC_CATS = ['이동전화 요금제형', '휴대폰형 + 이동전화 요금제형', '이동전화 요금제형 + 이동전화 base 옵션형', '휴대폰형 + 이동전화 요금제형 + 이동전화 base 옵션형', '휴대폰형',
 '태블릿형 + 이동전화 요금제형', '웨어러블형 + 이동전화 요금제형', '이동전화 base 옵션형', '이동전화 base 제휴형', '플랫폼형', '로밍형'];
export const PROC_APS = ['임시 저장', '승인 대기', '승인 완료', '반려', '요청 취소'];

// ---------- 샘플 (order6-create.html PROC_LIST와 같은 목록) ----------
const PAYOPTS = ['24개월', '30개월', '일시불', '6개월', '12개월', '18개월', '36개월', '48개월'];
const C = (n, id, t, o) => ({ id, n, t, o: o || [], off: [] });
const cDeliv = () => C('배송 옵션 선택', 'CN-ORD-0001', '주문', ['바로도착', '행복배송', '일반배송', '바로픽업']);
const cPre = () => C('대리 가입 여부 선택', 'CN-ORD-0002', '주문', ['직접 사용', '다른 사람이 사용']);
const cJoin = () => C('가입 방식 선택', 'CN-ORD-0003', '주문', ['신규가입', '번호이동', '기기변경']);
const cPay = () => C('기기 납부 방식 선택', 'CN-ORD-0004', '주문', PAYOPTS.slice());
const cPlan = () => C('요금제 선택', 'CN-ORD-0005', '상품 연동', ['5GX 프라임', '5GX 플래티넘', '무제한 베스트 Pro', '0 청년 69', '0 청년 89', '5GX 레귤러', '슬림', '컴팩트']);
const cCont = () => C('할인 방법 선택', 'CN-ORD-0084', '주문', ['공통지원금', '선택 약정 24개월', '선택 약정 12개월', '무약정 요금제']);
const cSim = () => C('SIM 유형 선택', 'CN-ORD-0006', '주문', ['eSIM', '새 USIM 구매', '가지고 있는 USIM', '내장 USIM']);
const cGift = () => C('T 기프트 선택', 'CN-ORD-0007', '상품 연동', ['알로 휴대용 미니 공기청정기', 'Galaxy Buds Live Pro 16']);
const cTda = () => C('티다팩 쿠폰 선택', 'CN-ORD-0008', '상품 연동', ['다이소', '무신사 머니', '올리브영', '티다팩 없이 주문 진행']);
const cCmp = () => C('동일 조건 단말기 비교', 'CN-PRD-0004', '상품 연동');
const cRew = () => C('바로 보상 신청', 'CN-ORD-0009', '주문', ['바로보상 신청', '신청 없이 주문 진행']);
const cIns = () => C('단말 보험 선택', 'CN-ORD-0010', '주문', ['T ALL케어 플러스 파손형', 'T ALL케어 플러스 분실파손형', '보험 없이 주문 진행']);
const cAddv = () => C('보험 외 부가서비스 선택', 'CN-ORD-0011', '주문', ['Wavve 앤 데이터', 'FLO 앤 데이터', 'V 컬러링', '부가서비스 없이 주문 진행']);
const cCard = () => C('제휴카드 선택', 'CN-PAY-0001', '주문', ['요금 할인 카드', '휴대폰 할인 카드', '제휴카드 없이 주문 진행']);
const cDisc = () => C('추가 할인 수단 영역', 'CN-PAY-0002', '주문', ['쿠폰·이용권 선택', 'T 모아 제휴 포인트', '추가 할인 없이 주문 진행']);
const cOrdInfo = () => C('기기 주문 정보', 'CN-ORD-0340', '주문');
const cShip = () => C('배송 정보 입력', 'CN-ORD-0049', '주문');
const cBill = () => C('통합 청구 선택', 'CN-ORD-0071', '주문');
const cPm = () => C('요금 납부 수단 등록', 'CN-PAY-0004', '주문', ['기존 납부 수단 유지', '계좌이체', '체크/신용카드']);
const cPg = () => C('결제수단', 'CN-PAY-0032', '주문', ['11pay', '신용·체크카드', '계좌이체', '카카오페이', '네이버페이', '가상 계좌']);
const cRcpt = () => C('결제 증빙 수단', 'CN-PAY-0033', '주문', ['개인소득공제용', '사업자지출증빙용', '미신청']);
const cTot = () => C('최종 금액 확인', 'CN-PAY-0006', '주문');
const cTerm = () => C('주문 최종 약관', 'CN-PAY-0020', '주문');
const cDone = () => C('주문 완료 확인', 'CN-ORD-0052', '주문');
const S = (name, scr, corners) => ({ name, scr: scr || '', corners });
const mkTab = () => [S('상품상세_기기상품_메인', 'NC-PRD-005-0', [cPlan(), cSim(), cPay()]), S('기기 가입하기', 'NC-ORD-031-0', [cOrdInfo(), cShip(), cTot()]), S('주문 완료', 'NC-ORD-033-0', [cDone()])];
const mkWear = () => [S('상품상세_기기상품_메인', 'NC-PRD-005-0', [cPlan(), cSim()]), S('주문 완료', 'NC-ORD-033-0', [cDone()])];
// 2026-11-08 전수 정리 : 주문 유형마다 1개 (order6-create.html PROC_LIST와 같은 이름 · 구성). 그룹 전용 코너(바로 보상 신청 · 결제 증빙 수단)는 단독으로 넣지 않는다
const TERM = () => S('최종 약관 동의', 'NC-PAY-021-0', [cTerm()]), DONE = () => S('주문 완료', 'NC-ORD-033-0', [cDone()]);
const mkDev = () => [
 S('상품상세_기기상품_메인', 'NC-PRD-005-0', [cDeliv(), cPre(), cJoin(), cPay(), cPlan(), cCont(), cSim(), cGift(), cTda(), cCmp()]),
 S('상품상세_기기상품_선택 상품 선택', 'NC-PRD-030-0', [cCard(), cDisc()]),
 S('기기 가입하기', 'NC-ORD-031-0', [cOrdInfo(), cShip(), cBill(), cPm(), cPg(), cTot()]), TERM(), DONE()];
const mkDevOpt = () => { const st = mkDev(); st[1].corners.unshift(cIns(), cAddv()); return st; };
const mkDevKeep = () => [S('상품상세_기기상품_메인', 'NC-PRD-005-0', [cDeliv(), cPay(), cSim(), cGift(), cTda(), cCmp()]), S('기기 가입하기', 'NC-ORD-031-0', [cOrdInfo(), cShip(), cPg(), cTot()]), TERM(), DONE()];
const mkPlan = () => [S('요금제 가입하기', '', [cPre(), cJoin(), cPlan(), cCont(), cSim()]), S('가입 정보 입력', '', [cShip(), cBill(), cPm(), cTot()]), TERM(), DONE()];
const mkPlanOpt = () => { const st = mkPlan(); st[0].corners.push(cAddv()); return st; };
const mkAdd = (nm, cs) => () => [S(nm, '', cs()), TERM(), DONE()];
// 상세 샘플(TP-ORD-002) : 신규가입일 때만 일시불 노출 (조건 노출 예시)
const mkDetail = () => { const st = mkDev(), pay = st[0].corners.find(c => c.id === 'CN-ORD-0004'); pay.cond = '신규가입일 때만 일시불 노출'; return st; };
const PROC_LIST = [
 ['TP-ORD-001', 0, '이동전화 요금제 가입 프로세스', mkPlan, 86, '2026.10.30 10:20'],
 ['TP-ORD-002', 1, '휴대폰 + 요금제 가입 프로세스', mkDetail, 124, '2026.10.29 14:10'],
 ['TP-ORD-003', 2, '요금제 + 부가서비스 가입 프로세스', mkPlanOpt, 41, '2026.10.28 11:00'],
 ['TP-ORD-004', 3, '휴대폰 + 요금제 + 부가서비스 가입 프로세스', mkDevOpt, 97, '2026.10.27 16:40'],
 ['TP-ORD-005', 4, '휴대폰 기기변경 프로세스 (요금제 유지)', mkDevKeep, 38, '2026.10.26 09:30'],
 ['TP-ORD-006', 5, '태블릿 + 데이터 요금제 가입 프로세스', mkTab, 22, '2026.10.24 15:20'],
 ['TP-ORD-007', 6, '웨어러블 + 요금제 가입 프로세스 (모회선 연결)', mkWear, 15, '2026.10.23 13:50'],
 ['TP-ORD-008', 7, '부가서비스 가입 프로세스 (사용 중 회선)', mkAdd('부가서비스 가입하기', () => [cAddv(), cPm(), cTot()]), 33, '2026.10.22 10:10'],
 ['TP-ORD-009', 8, '제휴 서비스 가입 프로세스 (사용 중 회선)', mkAdd('제휴 서비스 가입하기', () => [cIns(), cPm(), cTot()]), 12, '2026.10.21 17:00'],
 ['TP-ORD-010', 9, 'T우주 구독 가입 프로세스', mkAdd('구독 가입하기', () => [cCard(), cPg(), cTot()]), 9, '2026.10.20 11:30'],
 ['TP-ORD-011', 10, '로밍 상품 가입 프로세스 (사용 중 회선)', mkAdd('로밍 가입하기', () => [cPm(), cTot()]), 6, '2026.10.19 14:00']];
const BY = '김프로(P000200)';
function seedProcs() {
 return PROC_LIST.map(r => ({ id: r[0], n: r[2], cat: PROC_CATS[r[1]], cnt: r[4], ap: '승인 완료', u: true, dt: r[5], by: BY, ver: 'V.1', stages: r[3]() }));
}

// ---------- 읽기 · 쓰기 ----------
// 저장소 값이 깨졌거나 없으면 샘플을 쓴다. live = order5-create에서 남긴 값인지
export function loadProcs() {
 try { const o = JSON.parse(localStorage.getItem(PROC_KEY) || 'null'); if (o && Array.isArray(o.rows) && o.rows.length) return { rows: o.rows, at: o.at || '', live: true }; } catch {}
 return { rows: seedProcs(), at: '', live: false };
}
// order5-create.ts가 부른다: 인라인 스크립트의 DATA(구성은 mk()로 만든다)를 저장소 형식으로 바꿔 남긴다
export function publishProcs(data, at) {
 const corner = c => { const o = (c.sv || c.opts || []).slice(), vis = c.oelse || [];
  return { id: c.id, n: c.n, t: c.t, o, off: o.map((_, i) => i).filter(i => vis[i] === false), ...(c.omode === 'cond' && c.rules && c.rules.length ? { cond: '조건에 따라 선택지 노출' } : {}),
   ...(c.grp ? { grp: { gid: c.grp.gid, ver: c.grp.ver, n: c.grp.n || '', k: c.grp.k || c.grp.gid, kind: c.grp.kind || 'seq' } } : {}) }; };   // 코너 그룹으로 배치한 코너 (주문 코너 그룹 관리의 사용 위치 · 상품 전시의 그룹 상자)
 const rows = data.map(d0 => { const d = d0.det ? Object.assign({}, d0, d0.det) : d0;
  let st = []; try { st = d.mk ? d.mk() : []; } catch {}
  return { id: d0.id, n: d.n, cat: d.cat, cnt: d.cnt, ap: d.ap, u: !!d.u, dt: d.dt || d0.dt, by: d.by || d0.by || '', ver: d.ver || '',
   stages: st.map(s => ({ name: s.name || '컨테이너명', scr: s.scr || '', corners: (s.corners || []).filter(c => !c.epc).map(corner) })) }; });
 try { localStorage.setItem(PROC_KEY, JSON.stringify({ at, rows })); return true; } catch { return false; }
}

// ---------- 상품 전시에서 쓰는 도움 함수 ----------
export const procUsable = p => !!p && p.ap === '승인 완료' && p.u;
export const procCorners = p => (p && p.stages || []).flatMap(s => s.corners);
export const procCornerCnt = p => procCorners(p).length;
// 주문 유형 비교: 'A + B'의 순서와 관계없이 같은 LV3 조합이면 같다
const parts = s => String(s || '').split('+').map(x => x.trim()).filter(Boolean).sort();
export const sameCat = (a, b) => { const x = parts(a), y = parts(b); return x.length > 0 && x.length === y.length && x.every((v, i) => v === y[i]); };
