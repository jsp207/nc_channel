// @ts-nocheck
// 주문 코너 등록 v0.2.1: ref/order_mockup_1029.html(코너 유형 관리 목록 · 조회 전용 상세)을 product-v022.html 화면 스타일로 옮긴 버전.
// 코너 · 화면 · 주문 프로세스 데이터와 FO 미리보기 렌더러는 목업 그대로, 목록/상세 화면은 공통 LNB · list.css 목록 규칙을 따른다.
import "./style.css";
import "./list.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

// ---------- 코너 데이터 (FO SB 질문+선택 영역 기준) ----------
const PAGES = { P1: { n: '상품상세_기기상품_메인', s: 'NC-PRD-005-0' }, P2: { n: '상품상세_기기상품_선택 상품 선택', s: 'NC-PRD-030-0' }, P3: { n: '기기 가입하기', s: 'NC-ORD-031-0' }, P4: { n: '기기 최종 약관 동의', s: 'NC-PAY-021-0' }, P5: { n: '주문 완료', s: 'NC-ORD-033-0' } };
// 세부 항목 코드(it): T 타이틀 · S 서브타이틀 · I 툴팁 · A 전체보기 · D 선택지 설명 · P 가격 · B 배지 · M 이미지 · L 자세히 보기 · N 미선택 옵션 · R 더보기
const o = (n, d, p, b, x) => ({ n, d: d || '', p: p || '', b: b || '', x: x || '' });
const CORNERS = [
 {id:'CN-PRD-0005',n:'단말 상품 기본 정보',t:'상품 연동',ui:'pinfo',pg:'P1',q:'iPhone 18 Pro',sub:'한층 더 강력해진 성능과 카메라',sel:'단일 선택',it:'TSBM',src:'단말 상품 마스터',qs:['원하는 색상을 골라 주세요','필요한 용량을 선택해 주세요'],
  opts:[],note:''},
 {id:'CN-ORD-0001',n:'배송 옵션 선택',t:'주문',ui:'list',pg:'P1',q:'휴대폰을 수령할 방법을 선택해 주세요',sel:'단일 선택',it:'TID',
  opts:[o('바로도착','평일 18시까지 주문 시 원하는 시간에 배송해 드려요'),o('행복배송','평일 15시까지 주문 시 전문가가 개통까지 도와드려요'),o('일반배송','월~토 14시까지 주문 시 다음날 배송해 드려요'),o('바로픽업','주문하고 가까운 대리점에서 바로 찾아갈 수 있어요')],screens:['배송방법 선택','고객주소 입력','배송가능여부 확인']},
 {id:'CN-ORD-0002',n:'대리 가입 여부 선택',t:'주문',ui:'list',pg:'P1',q:'어떤 분이 사용할 휴대폰인가요?',sel:'단일 선택',it:'TD',
  opts:[o('직접 사용','가입자(본인)의 정보만 있으면 돼요'),o('다른 사람이 사용','주문하시는 분의 정보를 함께 확인해야 해요')]},
 {id:'CN-ORD-0003',n:'가입 방식 선택',t:'주문',ui:'list',pg:'P1',q:'어떻게 가입할까요?',sel:'단일 선택',it:'TD',
  opts:[o('신규가입','SKT에 새로운 번호로 가입해요'),o('번호이동','지금 번호 그대로 다른 통신사에서 SKT로 이동해요'),o('기기변경','지금 번호 그대로 기기만 바꿔요')]},
 {id:'CN-ORD-0004',n:'기기 납부 방식 선택',t:'주문',ui:'list',pg:'P1',q:'단말기는 몇 달 동안 납부할까요?',sel:'단일 선택',it:'TR',more:3,
  opts:[o('24개월 동안 납부'),o('30개월 동안 납부'),o('일시불로 납부'),o('6개월 동안 납부'),o('12개월 동안 납부'),o('18개월 동안 납부'),o('36개월 동안 납부'),o('48개월 동안 납부')]},
 {id:'CN-ORD-0005',n:'요금제 선택',t:'상품 연동',ui:'card',pg:'P1',q:'요금제를 선택해 주세요',sel:'단일 선택',it:'TADPBLR',src:'요금제 마스터',moreBtn:'나에게 맞는 요금제 더보기',
  opts:[o('베스트 Pro','무제한 · 테더링/공유 120GB · T 멤버십 VIP 혜택','월 99,999원','이용중'),o('다이렉트 69 5G','무제한 · 테더링/공유 120GB · T 멤버십 VIP 혜택','월 99,999원','BEST'),o('5GX 프라임','무제한 · 스마트 기기 2회선 이용 요금 무료','월 89,000원')]},
 {id:'CN-ORD-0084',n:'할인 방법 선택',t:'주문',ui:'card',pg:'P1',q:'어떤 할인 방법을 사용하시겠어요?',sel:'단일 선택',it:'TDPB',
  opts:[o('공통지원금','공통지원금과 추가지원금으로 휴대폰 가격을 할인 받아요','총 534,600원 할인','최대할인'),o('선택약정 24개월','534,600에서 매달 25% 할인받아요 · 월 -22,275원','총 534,600원 할인'),o('선택약정 12개월','534,600에서 매달 25% 할인받아요 · 월 -22,275원','총 534,600원 할인'),o('무약정 요금제','약정 없이 최대 30% 저렴하게 · 요금에 할인이 이미 반영되어 있어요')]},
 {id:'CN-ORD-0006',n:'SIM 유형 선택',t:'주문',ui:'list',pg:'P1',q:'어떤 SIM으로 개통하시겠어요?',sel:'단일 선택',it:'TIDP',
  opts:[o('eSIM','칩 없이 QR로 바로 개통해요','2,750 원'),o('새 USIM 구매','택배로 받아 끼우면 바로 개통돼요','7,700 원'),o('가지고 있는 USIM 사용','쓰던 USIM을 그대로 사용해요'),o('내장 USIM 사용','쓰던 USIM을 그대로 사용해요')]},
 {id:'CN-ORD-0007',n:'T 기프트 선택',t:'상품 연동',ui:'grid',pg:'P1',q:'T 기프트 하나를 선택해 주세요',sub:'원하는 단말 사은품 하나를 지정한 주소로 보내드려요',sel:'단일 선택',it:'TSAMDL',src:'사은품 마스터',
  opts:[o('NEW 휴대용 미니 공기청정기 allo AP500','알로'),o('Galaxy Buds Live Pro 16','삼성전자')]},
 {id:'CN-ORD-0008',n:'티다팩 쿠폰 선택',t:'상품 연동',ui:'card',pg:'P1',q:'원하는 티다팩 쿠폰을 골라 주세요',sub:'12개월간 할인 쿠폰 1가지를 매월 발송해드려요',sel:'단일 선택',it:'TSADBMLN',src:'티다팩 제휴처 마스터',logo:1,
  opts:[o('다이소','매월 10,000원 할인 쿠폰','','AI PICK'),o('무신사머니','매월 10,000원 할인 쿠폰','','AI PICK'),o('올리브영','매월 10,000원 할인 쿠폰','','추천'),o('티다팩 없이 주문 진행','','','','none')]},
 {id:'CN-PRD-0004',n:'동일 조건 단말기 비교',t:'상품 연동',ui:'hscroll',pg:'P1',q:'동일한 조건으로 비교한 다른 기기도 확인해 보세요',sub:'5G 프리미엄 · 선택약정 · 24개월 조건으로 적용했어요',sel:'선택 없음(상품 이동)',it:'TSMP',src:'단말 상품 마스터',
  opts:[o('iPhone 18 Pro','그라파이트 · 512G','999,999원/월','현재 선택한 상품'),o('iPhone 18 Pro Max','그라파이트 · 512G','999,999원/월'),o('갤럭시 Z 폴드8','라벤더 · 512G','999,999원/월')]},
 {id:'CN-ORD-0009',n:'바로 보상 신청',t:'주문',ui:'list',pg:'P2',q:'바로보상 신청하고 보상금을 받아보세요',sub:'쓰던 폰 반납하면 바로 현금으로 보상해드려요.',sel:'단일 선택',it:'TSADN',link:'바로보상이란?',
  opts:[o('바로보상 신청','쓰던 휴대폰 모델과 상태로 예상 보상금을 확인해요'),o('신청 없이 주문 진행','','','','none')]},
 {id:'CN-ORD-0010',n:'단말 보험 선택',t:'주문',ui:'card',pg:'P2',q:'소중한 휴대폰, 보험으로 지켜 보세요',sub:'떨어뜨리거나 잃어버릴 걱정 없이 쓸 수 있어요',sel:'단일 선택',it:'TSADPBN',
  opts:[o('T ALL케어 플러스 파손형','분실·파손 최대 200만원 보상 · 연 2회 · 자기부담금 30%','월 9,100 원','AI PICK'),o('T ALL케어 플러스 분실파손형','분실·파손 최대 200만원 보상 · 연 2회 · 자기부담금 30%','월 9,100 원','AI PICK'),o('보험 없이 주문 진행','','','','none')]},
 {id:'CN-ORD-0011',n:'보험 외 부가서비스 선택',t:'주문',ui:'card',pg:'P2',q:'원하는 부가서비스를 더해 보세요',sub:'콘텐츠·데이터 등 자주 쓰는 혜택을 추가할 수 있어요',sel:'단일 선택',selTbd:1,it:'TSADPBMLN',logo:1,
  opts:[o('Wavve 앤 데이터','Wavve 무제한 감상 + 매달 데이터','월 9,900 원','AI PICK'),o('FLO 앤 데이터','FLO 무제한 감상 + 매달 데이터','월 9,900 원','AI PICK'),o('V 컬러링','통화 연결음 대신 영상을 보여줘요','월 3,300 원'),o('부가서비스 없이 주문 진행','','','','none')]},
 {id:'CN-PAY-0001',n:'제휴카드 선택',t:'주문',ui:'list',pg:'P2',q:'혜택있는 제휴카드를 확인해 보세요',sub:'자동이체 등록 시 매월 할인 혜택을 받을 수 있어요',sel:'단일 선택',it:'TSBN',chev:1,
  opts:[o('요금 할인 카드','','','Label'),o('휴대폰 할인 카드','','','Label'),o('제휴카드 없이 주문 진행','','','','none')]},
 {id:'CN-PAY-0002',n:'추가 할인 수단 영역',t:'주문',ui:'list',pg:'P2',q:'쿠폰과 포인트로 추가 할인을 적용해 보세요',sel:'단일 선택',it:'TN',chev:1,
  opts:[o('쿠폰·이용권 선택','','로그인 후 조회'),o('T 모아 제휴 포인트 적용','','조회'),o('추가 할인 없이 주문 진행','','','','none')],screens:['쿠폰·포인트 선택','쿠폰번호 직접 입력']},
 {id:'CN-ORD-0340',n:'기기 주문 정보',t:'주문',ui:'sum',pg:'P3',q:'주문 상품',sel:'선택 없음',it:'TMP',
  opts:[o('보험','T 올케어+6 파손'),o('부가서비스','V컬러링'),o('티기프트','듀오 무선 충전기 블랙'),o('티다팩','다이소 10,000원 쿠폰')],note:'앞 단계에서 선택한 값을 모아 보여주는 요약 영역입니다.'},
 {id:'CN-ORD-0049',n:'배송 정보 입력',t:'주문',ui:'form',pg:'P3',q:'배송 정보를 입력해 주세요',sel:'입력',it:'T',
  opts:[o('받는 분','홍길동'),o('받는 분 연락처','010-1234-5678'),o('주소','우편번호 찾기'),o('상세주소','상세주소 (예시 : 6층, 601호)'),o('가입자 정보와 동일한 주소로 받을게요','','','','check')]},
 {id:'CN-ORD-0071',n:'통합 청구 선택',t:'주문',ui:'chip',pg:'P3',q:'요금을 통합해서 납부하시겠어요?',sub:'사용 중인 SK텔레콤 번호로 한 번에 납부할 수 있어요',sel:'단일 선택',it:'TS',
  opts:[o('네','사용 중인 번호 입력 후 확인'),o('아니요','')]},
 {id:'CN-PAY-0004',n:'요금 납부 수단 등록',t:'주문',ui:'list',pg:'P3',q:'매달 요금을 납부할 방식을 선택해 주세요',sel:'단일 선택',it:'TDB',
  opts:[o('기존 납부 수단 유지','신용/체크카드 · 농협 1234-****-****-****'),o('계좌이체','','','분실·만료 걱정없는'),o('체크/신용카드','')]},
 {id:'CN-PAY-0032',n:'결제수단',t:'주문',ui:'radio',pg:'P3',q:'결제 수단을 선택해 주세요',sel:'단일 선택',it:'TBM',
  opts:[o('11pay','','','최근 사용'),o('신용·체크카드'),o('계좌이체'),o('카카오페이'),o('네이버페이'),o('가상 계좌','주문 후 24시간 이내 미입금 시 주문이 자동 취소됩니다.')]},
 {id:'CN-PAY-0033',n:'결제 증빙 수단',t:'주문',ui:'radio',pg:'P3',q:'현금영수증 신청 여부를 선택해 주세요',sel:'단일 선택',it:'TD',
  opts:[o('개인소득공제용','휴대폰 번호 또는 현금영수증 카드 번호 입력'),o('사업자지출증빙용','사업자 번호 입력'),o('미신청')]},
 {id:'CN-PAY-0006',n:'최종 금액 확인',t:'주문',ui:'sum',pg:'P3',q:'최종 결제 금액을 확인하세요',sel:'선택 없음',it:'TP',
  opts:[o('오늘 결제 금액','월 999,999원'),o('총 예상 납부 금액','월 999,999원'),o('휴대폰 출고가','9,999,999원'),o('총 할인 금액','- 999,999원'),o('최종 결제 금액','9,999,999원')],note:'선택한 상품·할인·결제 값을 계산해 보여주는 요약 영역입니다.'},
 {id:'CN-PAY-0020',n:'주문 최종 약관',t:'주문',ui:'terms',pg:'P4',q:'안전한 진행을 위해 약관 동의가 필요해요',sel:'다중 선택(동의)',it:'TL',
  opts:[o('[필수] 구매 내역 확인'),o('[필수] 개인정보 수집·이용'),o('[필수] 만 14세 이상 확인'),o('[필수] 개인정보 제3자 제공 동의'),o('[필수] 11pay 개인정보 제3자 제공'),o('[필수] 제휴사 개인정보 제공'),o('[선택] 개인정보 수집 동의')]},
 {id:'CN-ORD-0052',n:'주문 완료 확인',t:'주문',ui:'done',pg:'P5',q:'주문이 완료되었어요',sub:'택배로 빠르고 안전하게 배송해 드릴게요.',sel:'선택 없음',it:'TSM',
  opts:[o('내역 확인하기','주문 내역 화면으로 이동'),o('홈으로 가기','홈 화면으로 이동')]}
];
// 단말 상품 기본 정보에 묶인 하위 영역 (상품 정보 연동)
const PSUB = [
 {id:'CN-PRD-0002',n:'기기 색상 옵션 선택',t:'상품 연동',ui:'color',pg:'P1',q:'원하는 색상을 골라 주세요',sel:'단일 선택',it:'T',src:'단말 상품 마스터(색상·재고)',
  opts:[o('라벤더','','','','#d9d6ea'),o('실버','','','','#eceae2'),o('색상 3','','','일시품절','#c9ccd3'),o('색상 4','','','품절','#a9adb6')]},
 {id:'CN-PRD-0003',n:'기기 용량 옵션 선택',t:'상품 연동',ui:'list',pg:'P1',q:'필요한 용량을 선택해 주세요',sel:'단일 선택',it:'TDPB',src:'단말 상품 마스터(용량·가격·재고)',
  opts:[o('256G','사진 약 51,200장을 저장할 수 있어요','1,684,000 원'),o('512G','사진 약 102,400장을 저장할 수 있어요','1,988,000 원'),o('1T','사진 약 204,800장을 저장할 수 있어요','2,557,000 원','품절'),o('2T','사진 약 409,600장을 저장할 수 있어요','2,985,000 원','일시품절')]}
];
const KIND_D = { '주문': '주문 정보를 선택하거나 입력받는 코너입니다.', '상품 연동': '상품·요금제·사은품 등 상품 데이터를 불러와 노출하는 코너입니다.' };

// 주문 프로세스(역참조용): 주문 프로세스 관리 v46 목록 기준. 구성(STR)은 화면별 코너 순서
const STR = {
 full:[['P1',['CN-PRD-0005','CN-ORD-0001','CN-ORD-0002','CN-ORD-0003','CN-ORD-0004','CN-ORD-0005','CN-ORD-0084','CN-ORD-0006','CN-ORD-0007','CN-ORD-0008','CN-PRD-0004']],['P2',['CN-ORD-0009','CN-ORD-0010','CN-ORD-0011','CN-PAY-0001','CN-PAY-0002']],['P3',['CN-ORD-0340','CN-ORD-0049','CN-ORD-0071','CN-PAY-0004','CN-PAY-0032','CN-PAY-0033','CN-PAY-0006']],['P4',['CN-PAY-0020']],['P5',['CN-ORD-0052']]],
 tab:[['P1',['CN-PRD-0005','CN-ORD-0005','CN-ORD-0006','CN-ORD-0004']],['P3',['CN-ORD-0340','CN-ORD-0049','CN-PAY-0006']],['P5',['CN-ORD-0052']]],
 sim:[['USIM 가입하기',['CN-ORD-0006','CN-ORD-0005']],['P5',['CN-ORD-0052']]]
};
const PROCS = [
 ['TP-ORD-010','단말','아이폰 18 pro max 전용 프로세스','승인 완료','Y','full'],
 ['TP-ORD-009','단말','아이폰 18 전용 프로세스','승인 완료','Y','full'],
 ['TP-ORD-008','커머스','커머스 기본 프로세스','승인 완료','Y','tab'],
 ['TP-ORD-007','부가서비스','부가서비스 기본 프로세스','승인 완료','Y','sim'],
 ['TP-ORD-006','요금제','요금제 기본 프로세스','임시 저장','Y','sim'],
 ['TP-ORD-005','단말','단말 기기변경 기본 프로세스','임시 저장','Y','full'],
 ['TP-ORD-004','단말','단말 번호이동 기본 프로세스','임시 저장','Y','full'],
 ['TP-ORD-003','단말','단말 신규가입 기본 프로세스','반려','N','full'],
 ['TP-ORD-002','단말','단말 기본 프로세스','반려','N','full'],
 ['TP-ORD-001','단말','아이폰 18 pro 전용 프로세스','반려','N','full']
];
// 선·후행 코너: rel=관계 설명, src=근거(req 요청 반영 · v46 조건 예시 · tbd 가안)
const LINKS = [
 {a:'CN-ORD-0003',b:'CN-ORD-0004',rel:'가입 방식 값에 따라 선택 가능한 납부 방식이 달라짐 (예: 신규가입이면 일시불)',src:'req'},
 {a:'CN-PRD-0005',b:'CN-ORD-0005',rel:'단말 모델에 따라 노출할 요금제와 순서가 달라짐',src:'v46'},
 {a:'CN-ORD-0005',b:'CN-ORD-0084',rel:'선택한 요금제에 따라 할인 방법별 할인 금액이 달라짐',src:'tbd'},
 {a:'CN-PAY-0032',b:'CN-PAY-0033',rel:'선택한 결제 수단에 따라 현금영수증 신청 영역 노출이 달라짐',src:'tbd'}
];
// 선택지가 있는 미리보기 유형 (선택 항목 표시 대상)
const SELUI = ['list', 'card', 'grid', 'chip', 'radio', 'color', 'nv'];

// ---------- 공통 ----------
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2400);
}
// 목업 샘플 값: 사용여부 · 최근 수정일시
CORNERS.forEach((c, i) => {
  c.use = 'Y';
  c.dt = `2026-10-${26 - (i % 5)} ${String(9 + i % 8).padStart(2, '0')}:${String(i * 7 % 60).padStart(2, '0')}`;
});
const cById = id => CORNERS.find(c => c.id === id) || null;
const pgName = k => PAGES[k] ? PAGES[k].n : k;
const pgScr = k => PAGES[k] ? PAGES[k].s : '';

// 역참조: 코너 ID → 이 코너를 쓰는 프로세스 · 화면 · 화면 안 순서
const REF = {};
PROCS.forEach(([pid, cat, pn, ap, u, str]) => {
  STR[str].forEach(([pg, ids]) => ids.forEach((cid, ix) => {
    (REF[cid] = REF[cid] || []).push({ pid, cat, pn, ap, u, page: pgName(pg), scr: pgScr(pg), pos: ix + 1, tot: ids.length });
  }));
});
const refsOf = id => REF[id] || [];
const procCnt = id => new Set(refsOf(id).map(r => r.pid)).size;
const preOf = id => LINKS.filter(l => l.b === id);
const postOf = id => LINKS.filter(l => l.a === id);

// 배지 (list.css .lb)
const kindBadge = t => `<span class="lb ${t === '상품 연동' ? 'ok' : 'live'}">${esc(t)}</span>`;
const useBadge = u => `<span class="lb ${u === 'Y' ? 'ok' : 'off'}">${u === 'Y' ? '사용' : '미사용'}</span>`;
const apBadge = a => `<span class="lb ${a === '승인 완료' ? 'live' : a === '반려' ? 'stop' : 'off'}">${esc(a)}</span>`;

// ---------- FO 미리보기 렌더러 (목업 그대로) ----------
const IC = {
 tip:'<svg class="fo-ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01" stroke-linecap="round"/></svg>',
 chev:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
 img:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>',
 chk:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>'
};
const has = (c, k) => c.it.includes(k);
function foHead(c) {
  if (!c.q) return '';
  let h = `<div class="fo-h"><div><b>${esc(c.q)}${has(c, 'I') ? IC.tip : ''}</b>${c.sub && has(c, 'S') ? `<p>${esc(c.sub)}</p>` : ''}</div>`;
  if (has(c, 'A')) h += '<a class="fo-all">전체보기</a>'; else if (c.link) h += `<a class="fo-all">${esc(c.link)}</a>`;
  return h + '</div>';
}
function foBadge(b) {
  if (!b) return '';
  const cls = b === 'BEST' ? 'bd-pu' : (b === '이용중' || b === '최근 사용' || b === '최대할인') ? 'bd-dk' : (b === 'AI PICK' || b === '추천') ? 'bd-sk' : 'bd-gy';
  return `<span class="fo-bd ${cls}">${esc(b)}</span>`;
}
function logoBox(n) {
  const col = ['#e5242b', '#1b1b1b', '#4bb04f', '#1f46d9'];
  return `<span class="fo-logo" style="background:${col[n.charCodeAt(0) % 4]}">${esc(n.slice(0, 2))}</span>`;
}
function foBody(c) {
  const O = c.opts;
  switch (c.ui) {
  case 'info':
    return `<div class="fo-pimg"><div class="fo-phone"></div></div><div class="fo-note">해당 상품은 11월 16일 이후 신규 가입 중단될 예정입니다.</div><div class="fo-pinfo"><p class="fo-cp">${esc(c.sub)}</p><b class="fo-pn">${esc(c.q)}</b><div class="fo-tags"><span class="fo-bd bd-dk">장기고객 혜택</span><span class="fo-bd bd-sk">신규</span><span class="fo-bd bd-gy">바로보상</span><span class="fo-bd bd-gy">무료배송</span></div><div class="fo-warn">만 18세 이상 만 34세 미만의 고객님만 가입할 수 있는 상품이에요</div></div>`;
  case 'pinfo':
    return foBody({ ui: 'info', q: c.q, sub: c.sub, opts: [], it: c.it }) + PSUB.map(x => '<div class="fo-div"></div>' + foBody(x)).join('');
  case 'color':
    return foHead(c) + `<p class="fo-sm">${esc(O[0].n)}</p><div class="fo-sw">` + O.map((x, i) => `<i class="${i ? '' : 'on'}${x.b ? ' so' : ''}" style="background:${x.x}" title="${esc(x.n + (x.b ? ` (${x.b})` : ''))}"></i>`).join('') + '</div>';
  case 'list': {
    const lim = c.more || 99;
    return foHead(c) + '<div class="fo-ls">' + O.map((x, i) => {
      if (i >= lim) return '';
      const none = x.x === 'none', sold = x.b === '품절' || x.b === '일시품절';
      return `<div class="fo-op${i === 0 && !c.chev ? ' on' : ''}${sold ? ' sold' : ''}${none ? ' none' : ''}${c.chev ? ' row' : ''}"><div class="fo-l"><b>${esc(x.n)}${c.chev && x.b ? ` <span class="fo-lb">${esc(x.b)}</span>` : ''}${!c.chev && x.b && !sold ? ' ' + foBadge(x.b) : ''}</b>${x.p && !c.chev ? `<strong>${esc(x.p)}</strong>` : ''}${x.d ? `<small>${esc(x.d)}</small>` : ''}</div>${sold ? `<span class="fo-sold">${esc(x.b)}</span>` : ''}${c.chev ? `<span class="fo-r">${x.p ? `<small>${esc(x.p)}</small>` : ''}${none ? '' : IC.chev}</span>` : ''}</div>`;
    }).join('') + (O.length > lim ? '<div class="fo-op more">더보기</div>' : '') + '</div>';
  }
  case 'card':
    return foHead(c) + '<div class="fo-ls">' + O.map((x, i) => {
      if (x.x === 'none') return `<div class="fo-op none"><div class="fo-l"><b>${esc(x.n)}</b></div></div>`;
      return `<div class="fo-op card${i === 0 ? ' on' : ''}"><div class="fo-l">${foBadge(x.b)}<b>${esc(x.n)}</b>${x.d ? `<small>${esc(x.d)}</small>` : ''}${x.p ? `<strong>${esc(x.p)}</strong>` : ''}${has(c, 'L') ? '<a class="fo-lk">자세히 보기</a>' : ''}</div>${c.logo ? logoBox(x.n) : ''}</div>`;
    }).join('') + (c.moreBtn ? `<div class="fo-morebtn">${esc(c.moreBtn)}</div>` : '') + '</div>';
  case 'grid':
    return foHead(c) + '<div class="fo-gd">' + O.map(x => `<div class="fo-gi"><div class="fo-gimg"><i class="fo-rd"></i>${IC.img}</div><small>${esc(x.d)}</small><b>${esc(x.n)}</b><span class="fo-gb">자세히 보기</span></div>`).join('') + '</div>';
  case 'hscroll':
    return foHead(c) + '<div class="fo-hs">' + O.map(x => `<div class="fo-hi"><div class="fo-gimg">${IC.img}</div><b>${esc(x.n)}</b><strong>${esc(x.p)}</strong><small>${esc(x.d)}</small>${x.b ? `<span class="fo-bd bd-gy">${esc(x.b)}</span>` : ''}</div>`).join('') + '</div>';
  case 'chip':
    return foHead(c) + '<div class="fo-ch">' + O.map((x, i) => `<span class="${i ? '' : 'on'}">${esc(x.n)}</span>`).join('') + '</div><p class="fo-sm">사용 중인 번호</p><div class="fo-in">010-1234-5678<em>확인</em></div>';
  case 'radio':
    return foHead(c) + '<div class="fo-rl">' + O.map((x, i) => `<div class="fo-ri"><i class="${i ? '' : 'on'}"></i><span>${esc(x.n)}</span>${foBadge(x.b)}</div>${x.d && has(c, 'D') ? `<p class="fo-rd2">${esc(x.d)}</p>` : ''}`).join('') + '</div>';
  case 'form':
    return foHead(c) + O.map(x => {
      if (x.x === 'check') return `<p class="fo-ck">${IC.chk}${esc(x.n)}</p>`;
      return `<p class="fo-sm">${esc(x.n)}</p><div class="fo-in${x.n === '주소' || x.n === '상세주소' ? ' ph' : ''}">${esc(x.d)}${x.n === '주소' ? '<em>우편번호 찾기</em>' : ''}</div>`;
    }).join('');
  case 'sum':
    return foHead(c) + '<div class="fo-sum">' + (c.id === 'CN-ORD-0340' ? '<div class="fo-sp"><i></i><b>iPhone 17 Pro</b><strong>999,999원</strong></div>' : '') + O.map((x, i) => {
      const last = i === O.length - 1 && c.id !== 'CN-ORD-0340';
      return `<div class="fo-sr${last ? ' tot' : ''}"><span>${esc(x.n)}</span><em>${esc(x.d)}</em></div>`;
    }).join('') + '</div>';
  case 'terms':
    return `<div class="fo-sheet"><div class="fo-h"><div><b>${esc(c.q)}</b></div><span class="fo-x">✕</span></div><p class="fo-ck all"><i></i>전체 동의</p>` + O.map(x => `<p class="fo-tl">${IC.chk}<span>${esc(x.n)}</span>${IC.chev}</p>`).join('') + '<button type="button" class="fo-btn pri">동의하고 주문하기</button></div>';
  case 'done':
    return `<div class="fo-done"><span class="fo-ok">${IC.chk}</span><b>${esc(c.q)}</b><p>${esc(c.sub)}</p><div class="fo-pimg sm"><div class="fo-phone"></div></div><div class="fo-ch">` + O.map((x, i) => `<span class="${i ? 'pri' : ''}">${esc(x.n)}</span>`).join('') + '</div></div>';
  }
  return '';
}
const foCard = c => `<div class="fo${c.ui === 'terms' ? ' bs' : ''}">${foBody(c)}</div>`;

// ---------- 목록 ----------
const PS = 10;
const Q = { use: '', kind: '', key: 'n', kw: '', page: 1 };
function readForm() {
  Q.use = ($('input[name=fUse]:checked') || {}).value || '';
  Q.kind = $('#fKind').value; Q.key = $('#fKey').value; Q.kw = $('#fKw').value.trim().toLowerCase(); Q.page = 1;
}
const filtered = () => CORNERS.filter(c =>
  (!Q.use || c.use === Q.use) && (!Q.kind || c.t === Q.kind) && (!Q.kw || String(Q.key === 'i' ? c.id : c.n).toLowerCase().includes(Q.kw)));
function linkCell(id) {
  const a = preOf(id).length, b = postOf(id).length;
  if (!a && !b) return '<span class="faint">-</span>';
  return `<span class="lks">${a ? `<span class="lb new">선행 ${a}</span>` : ''}${b ? `<span class="lb chk">후행 ${b}</span>` : ''}</span>`;
}
// 페이지 번호 (display-list2와 같은 모양)
const ARR = { prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>', next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>' };
function pagerHtml(page, pages) {
  let h = `<button type="button" data-p="${page - 1}" aria-label="이전 페이지"${page <= 1 ? ' disabled' : ''}>${ARR.prev}</button>`;
  for (let i = 1; i <= pages; i++) h += `<button type="button" data-p="${i}"${i === page ? ' aria-current="page"' : ''}>${i}</button>`;
  return h + `<button type="button" data-p="${page + 1}" aria-label="다음 페이지"${page >= pages ? ' disabled' : ''}>${ARR.next}</button>`;
}
function renderList() {
  const L = filtered(), pages = Math.max(1, Math.ceil(L.length / PS));
  if (Q.page > pages) Q.page = pages;
  const off = (Q.page - 1) * PS;
  $('#cCount').textContent = L.length;
  $('#tabCnt').textContent = CORNERS.length;
  $('#cWrap').hidden = !L.length;
  $('#cEmpty').hidden = !!L.length;
  $('#cBody').innerHTML = L.slice(off, off + PS).map((c, i) => {
    const pc = procCnt(c.id);
    return `<tr data-id="${c.id}"><td class="c">${off + i + 1}</td><td class="c"><div class="thumb">${foCard(c)}</div></td><td class="c">${kindBadge(c.t)}</td><td class="c mono">${c.id}</td><td><span class="cn">${esc(c.n)}</span></td><td class="c">${linkCell(c.id)}</td><td class="c">${pc ? `<span class="pcnt">${pc}</span>` : '<span class="faint">0</span>'}</td><td class="c">${c.use}</td><td class="c dt">${c.dt}</td></tr>`;
  }).join('');
  $('#pager').innerHTML = L.length ? pagerHtml(Q.page, pages) : '';
}

// ---------- 상세 (조회 전용) ----------
const EXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
const SEP = '<span class="sep">/</span>';
const row = (k, v) => `<div class="ft-row"><div class="ft-l">${k}</div><div class="ft-v">${v}</div></div>`;
const none = '<span class="faint">없음</span>';
const tbd = t => `<span class="tbd">${t || '미확정'}</span>`;
function optText(c) {
  const J = opts => opts.map(x => esc(x.n)).join(SEP);
  if (c.ui === 'pinfo') return `<div class="og">${PSUB.map(x => `<div><span class="ogl">${x.ui === 'color' ? '색상' : '용량'}</span>${J(x.opts)}</div>`).join('')}<div class="faint">${esc(c.src)} 연동, 예시 값</div></div>`;
  if (!SELUI.includes(c.ui) || !c.opts.length) return none;
  return `<span>${J(c.opts)}${c.t === '상품 연동' ? `<span class="faint"> · ${esc(c.src)} 연동, 예시 값</span>` : ''}</span>`;
}
// 선·후행 코너는 새 탭으로 그 코너 상세를 연다 (주소 #코너ID)
function linkChips(ls, key) {
  if (!ls.length) return none;
  return '<div class="chips">' + ls.map(l => {
    const x = cById(l[key]);
    return `<a class="lc" href="#${x.id}" target="_blank" rel="noopener" title="${esc(l.rel)}"><span class="mono">${x.id}</span>${esc(x.n)}${l.src === 'tbd' ? '<span class="prov">가안</span>' : ''}${EXT}</a>`;
  }).join('') + '</div>';
}
function procChips(id) {
  const seen = new Map();
  refsOf(id).forEach(r => { if (!seen.has(r.pid)) seen.set(r.pid, r); });
  if (!seen.size) return none;
  return '<div class="chips">' + [...seen.values()].map(r => `<button type="button" class="lc" data-pid="${r.pid}"><span class="mono">${r.pid}</span>${esc(r.pn)}${EXT}</button>`).join('') + '</div>';
}
function phraseText(c) {
  if (c.qs) return c.qs.map(esc).join(SEP);
  if (c.q && c.ui !== 'info') return esc(c.q) + (c.sub ? `<p class="kd">${esc(c.sub)}</p>` : '');
  return none;
}
function useTable(id) {
  const R = refsOf(id);
  if (!R.length) return '<div class="empty">이 코너를 쓰는 주문 프로세스가 없습니다.</div>';
  return '<div class="tw"><table class="utbl"><thead><tr><th>프로세스 ID</th><th>구분</th><th>프로세스명</th><th>승인 상태</th><th>사용여부</th><th>노출 화면</th><th>화면 안 순서</th></tr></thead><tbody>'
    + R.map(r => `<tr><td class="mono">${r.pid}</td><td>${esc(r.cat)}</td><td class="l">${esc(r.pn)}</td><td>${apBadge(r.ap)}</td><td>${r.u}</td><td class="l">${esc(r.page)}${r.scr ? ` <span class="faint mono">${r.scr}</span>` : ''}</td><td><span class="ord">${r.pos}<small> / ${r.tot}</small></span></td></tr>`).join('')
    + '</tbody></table></div>';
}
function renderDetail(c) {
  $('#dName').textContent = c.n;
  $('#dId').textContent = c.id;
  $('#dBadges').innerHTML = kindBadge(c.t) + useBadge(c.use);
  $('#dPv').innerHTML = foCard(c);
  $('#dInfo').innerHTML =
    row('코너명', `<b>${esc(c.n)}</b>`) +
    row('코너 ID', `<span class="mono">${c.id}</span>`) +
    row('구분', kindBadge(c.t) + `<span class="kd1">${KIND_D[c.t]}</span>`) +
    row('표시 문구', phraseText(c)) +
    row('선택 항목', optText(c)) +
    row('선행 코너', linkChips(preOf(c.id), 'a')) +
    row('후행 코너', linkChips(postOf(c.id), 'b')) +
    row('사용 프로세스', procChips(c.id)) +
    (c.t === '상품 연동' ? row('연동 데이터', `${esc(c.src)} ${tbd('연동 방식 미확정')}`) : '') +
    (c.screens ? row('연결 화면', c.screens.map(esc).join('<span class="sep">→</span>')) : '');
  $('#dUse').innerHTML = useTable(c.id);
}

// ---------- 화면 전환: 주소 #코너ID면 상세, 아니면 목록 ----------
function route() {
  const c = cById(decodeURIComponent(location.hash.slice(1)));
  $('#v-list').classList.toggle('on', !c);
  $('#v-detail').classList.toggle('on', !!c);
  if (c) renderDetail(c); else renderList();
  window.scrollTo(0, 0);
}
const openDetail = id => { location.hash = id; };
const openList = () => { history.pushState(null, '', location.pathname + location.search); route(); };
window.addEventListener('hashchange', route);

// ---------- 이벤트 ----------
$('#cFilter').addEventListener('submit', e => { e.preventDefault(); readForm(); renderList(); });
// 초기화: 폼 값이 기본값으로 돌아간 뒤 조회
$('#cFilter').addEventListener('reset', () => setTimeout(() => { $('#bClr').hidden = true; readForm(); renderList(); }));
$('#fKw').addEventListener('input', e => { $('#bClr').hidden = !e.target.value; });
$('#fKey').addEventListener('change', e => { $('#fKw').placeholder = e.target.value === 'i' ? '코너 ID를 입력하세요' : '코너명을 입력하세요'; });
$('#bClr').addEventListener('click', () => { $('#fKw').value = ''; $('#bClr').hidden = true; $('#fKw').focus(); });
$('#pager').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b || b.disabled) return; Q.page = +b.dataset.p; renderList(); });
$('#cBody').addEventListener('click', e => { const tr = e.target.closest('tr[data-id]'); if (tr) openDetail(tr.dataset.id); });
$('#topTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tt]');
  if (b && b.dataset.tt !== '상품') toast(`${b.dataset.tt} 탭은 전시팀 목업에서 관리합니다. 통합 시 연결됩니다.`);
});
$('#dInfo').addEventListener('click', e => {
  const p = e.target.closest('[data-pid]');
  if (p) toast(`주문 프로세스 관리 상세(${p.dataset.pid})를 새 탭으로 엽니다.`);
});
$('#bBack').addEventListener('click', openList);
$('#bList').addEventListener('click', openList);

route();
