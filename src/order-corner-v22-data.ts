// @ts-nocheck
// 주문 코너 원본 데이터와 FO 미리보기 렌더러. 주문 코너 관리(order-corner-v22.ts)와 주문 코너 그룹 관리(order-corner-group-v22.ts · v23.ts)가 함께 쓴다.
// 코너를 바꾸면 그룹의 코너 추가 목록 · 구성 코너 · 미리보기에도 그대로 반영된다.
// 주문 코너 관리 목록 · 상세의 최근 수정자 (등록 · 수정 저장 시에도 이 값)
export const CORNER_EDITOR='김코너 (P000300)';

var PAGES={P1:{n:'상품상세_기기상품_메인',s:'NC-PRD-005-0'},P2:{n:'상품상세_기기상품_선택 상품 선택',s:'NC-PRD-030-0'},P3:{n:'기기 가입하기',s:'NC-ORD-031-0'},P4:{n:'기기 최종 약관 동의',s:'NC-PAY-021-0'},P5:{n:'주문 완료',s:'NC-ORD-033-0'}};
var UI={info:'상품 정보형',ai:'추천 요약형',color:'컬러칩 선택형',list:'리스트 선택형',card:'카드 선택형',grid:'이미지 그리드형',hscroll:'가로 스크롤형',chip:'버튼 선택형',radio:'라디오 선택형',form:'입력 폼형',sum:'정보 요약형',terms:'약관 동의형',done:'결과 안내형',nv:'비화면'};
var KIND_D_OLD={'주문':'주문 정보를 선택하거나 입력받는 코너입니다.','상품 연동':'상품·요금제·사은품 등 상품 데이터를 불러와 노출하는 코너입니다.','비화면':'화면 없이 분기 조건 값만 제공하는 코너입니다.'};
/* 세부 항목 코드 */
var ITEMS=[['T','타이틀'],['S','서브타이틀'],['I','툴팁'],['A','전체보기'],['D','선택지 설명'],['P','가격'],['B','배지'],['M','이미지'],['L','자세히 보기'],['N','미선택 옵션'],['R','더보기']];
function o(n,d,p,b,x){return {n:n,d:d||'',p:p||'',b:b||'',x:x||''}}
var CORNERS=[
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
/* 주문 프로세스(역참조용) : 주문 프로세스 관리 v46 목록 기준 */
var STR={
 full:[['P1',['CN-PRD-0005','CN-ORD-0001','CN-ORD-0002','CN-ORD-0003','CN-ORD-0004','CN-ORD-0005','CN-ORD-0084','CN-ORD-0006','CN-ORD-0007','CN-ORD-0008','CN-PRD-0004']],['P2',['CN-ORD-0009','CN-ORD-0010','CN-ORD-0011','CN-PAY-0001','CN-PAY-0002']],['P3',['CN-ORD-0340','CN-ORD-0049','CN-ORD-0071','CN-PAY-0004','CN-PAY-0032','CN-PAY-0033','CN-PAY-0006']],['P4',['CN-PAY-0020']],['P5',['CN-ORD-0052']]],
 tab:[['P1',['CN-PRD-0005','CN-ORD-0005','CN-ORD-0006','CN-ORD-0004']],['P3',['CN-ORD-0340','CN-ORD-0049','CN-PAY-0006']],['P5',['CN-ORD-0052']]],
 sim:[['USIM 가입하기',['CN-ORD-0006','CN-ORD-0005']],['P5',['CN-ORD-0052']]]
};
var PROCS=[
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
/* 노출 조건 참조 : 주문 프로세스 관리 v46 상세(TP-ORD-001) 예시 */
var CONDREF=[{proc:'TP-ORD-001',src:'CN-ORD-0003',dst:'CN-ORD-0004',v:'신규가입'},{proc:'TP-ORD-001',src:'CN-PRD-0005',dst:'CN-ORD-0005',v:'iPhone Pro Max 18'}];

/* 코너 구성 : 디바이스_코너구성_261023.xlsx */
var COMP={"CN-PRD-0005": "상품 섬네일-디폴트(ThumbnailFull), 공지사항 배너(NoticeBanner), 상품상세 정보 타이틀-단말기(TextProductGroup), 대상 회선/고객 안내 문구 그룹(조회 대상 회선 설정 CellRightTable, 고객 안내 문구 NoticeAlert)", "CN-PRD-0001": "주문 조합 프리셋-펼침(AiAlert)", "CN-PRD-0002": "옵션 선택 타이틀(TitleGroupSection), 색상 옵션 리스트(색상명 CellDescription, 색상 칩 SelectChip 4: 일반 2, 일시 품절, 품절)", "CN-PRD-0003": "옵션 선택 타이틀, 용량 옵션 리스트(SelectCard 4: 기본, 미선택, 품절, 임시품절)", "CN-ORD-0001": "옵션 선택 타이틀, 배송옵션 리스트(SelectCard 4: 바로도착, 행복배송, 일반배송, 바로픽업)", "CN-ORD-0002": "옵션 선택 타이틀, 대리가입 선택(SelectCard 2: 직접 사용, 다른 사람이 사용)", "CN-ORD-0003": "옵션 선택 타이틀, 가입 방식 리스트(SelectCard 3: 신규가입, 번호이동, 기기변경)", "CN-ORD-0004": "옵션 선택 타이틀, 할부 방식 리스트(RadioCard 9: 24개월, 30개월, 일시불, 더보기, 6·12·18·36·48개월)", "CN-ORD-0005": "옵션 선택 타이틀, 요금제 카드(SelectCard 5: 이용 중, 기본, 다이렉트 플랜, 사전예약, 추천), 요금제 더보기(Button)", "CN-ORD-0084": "옵션 선택 타이틀, 할인 방법 리스트(SelectCard 4: 공통지원금, 선택 약정 24개월, 선택 약정 12개월, 무약정 요금제)", "CN-ORD-0006": "옵션 선택 타이틀, SIM 옵션 리스트(SelectCard 4: eSIM, 새 USIM 구매, 가지고 있는 USIM, 내장 USIM)", "CN-ORD-0007": "옵션 선택 타이틀, T 기프트 리스트(SelectProduct 4)", "CN-ORD-0008": "옵션 선택 타이틀, 티다팩 옵션 리스트(SelectCard 4: 옵션 1~3, 미선택)", "CN-PRD-0004": "타이틀(TitleGroupSection), 비교 상품군 리스트(Carousel)", "CN-ORD-0009": "옵션 선택 타이틀, 바로보상 신청 / 미신청(SelectCard 2)", "CN-ORD-0010": "옵션 선택 타이틀, 부가서비스_보험(SelectCard 2), 보험 미선택(RadioCard)", "CN-ORD-0011": "옵션 선택 타이틀, 부가서비스(SelectCard 3), 부가서비스 없이 주문 진행(RadioCard)", "CN-PAY-0001": "타이틀, 제휴카드 선택 옵션(SelectCard 7: 요금 할인·휴대폰 할인 카드 각 default / 선택-미보유 / 선택-보유, 제휴카드 없이 주문 진행)", "CN-PAY-0002": "타이틀, 쿠폰·이용권 선택(SelectCard 4: 비로그인, 로그인·쿠폰 없음, 로그인·쿠폰 있음, 선택됨), T 모아 제휴 포인트(SelectCard 2: default, 선택됨), 추가 할인 없이 주문 진행(SelectCard)", "CN-ORD-0340": "주문 상품 타이틀(Accordion)", "CN-ORD-0049": "배송 정보 영역 타이틀(TitleGroupSection), 수령자 이름·연락처·주소 입력(Input 3), 가입자 정보와 동일주소 체크(CellSelect)", "CN-ORD-0071": "타이틀, 통합 청구 선택 버튼(ButtonGroup), 통합 청구 번호 입력(Input), 통합 청구 완료 안내(Alert)", "CN-PAY-0004": "납부 수단 등록 안내 타이틀, 납부 수단 정보 입력 그룹(기존 납부 수단 유지 SelectCard + Alert, 계좌이체·체크/신용카드 SelectCard 4: 각 default / 선택됨)", "CN-PAY-0032": "결제 수단 타이틀, Banner, 결제 수단(CellPayment 6: 11pay, 신용·체크카드, 계좌이체, 카카오페이, 네이버페이, 가상 계좌), 안내(Alert)", "CN-PAY-0033": "타이틀, 현금영수증 신청(CellSelect), 등록된 현금영수증 수단(Card), 개인소득공제용(CellSelect, 증빙 수단 Select, 전화번호·카드번호 Input), 사업자지출증빙용(CellSelect, Select, Input 2), 다음에도 사용·미신청(CellSelect 2)", "CN-PAY-0006": "타이틀, 최종 결제 금액·월 예상 납부 금액·제휴카드 미적용 시 월 예상 납부 금액(CellRightTable 3), 디바이더, 금액 상세(Accordion 4: 휴대폰 일시불, 휴대폰 할부금, 통신 요금, 부가서비스 요금)", "CN-PAY-0020": "전체 약관 동의(CellSelect), 필수 동의 그룹(타이틀 CellTitle, 전체 동의, 개별 약관 CellSelect 5), 그룹 밖 개별 약관(CellSelect 1), 선택 약관 그룹(타이틀, 전체 동의, 개별 약관 CellSelect 3), 디바이더 2", "CN-ORD-0052": "완료 안내(주문 완료 타이틀 TitleGroupComplete), 주문 정보 요약(주문 상품 카드 Card)"};
/* 선·후행 코너 : rel=관계 설명, src=근거 */
var LINKS=[
 {a:'CN-ORD-0003',b:'CN-ORD-0004',rel:'가입 방식 값에 따라 선택 가능한 납부 방식이 달라짐 (예: 신규가입이면 일시불)',src:'req'},
 {a:'CN-PRD-0005',b:'CN-ORD-0005',rel:'단말 모델에 따라 노출할 요금제와 순서가 달라짐',src:'v46'},
 {a:'CN-ORD-0005',b:'CN-ORD-0084',rel:'선택한 요금제에 따라 할인 방법별 할인 금액이 달라짐',src:'tbd'},
 {a:'CN-PAY-0032',b:'CN-PAY-0033',rel:'선택한 결제 수단에 따라 현금영수증 신청 영역 노출이 달라짐',src:'tbd'}
];
var LSRC={req:['요청 반영','p-pu'],v46:['v46 조건 예시','p-bl'],tbd:['가안','p-or']};

/* 단말 상품 기본 정보에 묶인 하위 영역 (상품 정보 연동) */
var PSUB=[{id:'CN-PRD-0002',n:'기기 색상 옵션 선택',t:'상품 연동',ui:'color',pg:'P1',q:'원하는 색상을 골라 주세요',sel:'단일 선택',it:'T',src:'단말 상품 마스터(색상·재고)',
  opts:[o('라벤더','','','','#d9d6ea'),o('실버','','','','#eceae2'),o('색상 3','','','일시품절','#c9ccd3'),o('색상 4','','','품절','#a9adb6')]},
 {id:'CN-PRD-0003',n:'기기 용량 옵션 선택',t:'상품 연동',ui:'list',pg:'P1',q:'필요한 용량을 선택해 주세요',sel:'단일 선택',it:'TDPB',src:'단말 상품 마스터(용량·가격·재고)',
  opts:[o('256G','사진 약 51,200장을 저장할 수 있어요','1,684,000 원'),o('512G','사진 약 102,400장을 저장할 수 있어요','1,988,000 원'),o('1T','사진 약 204,800장을 저장할 수 있어요','2,557,000 원','품절'),o('2T','사진 약 409,600장을 저장할 수 있어요','2,985,000 원','일시품절')]}];
var KIND_D={'주문':'주문 정보를 선택하거나 입력받는 코너입니다.','상품 연동':'상품·요금제·사은품 등 상품 데이터를 불러와 노출하는 코너입니다.'};

/* ===== 통합안 추가 데이터 (샘플) ===== */
/* 사용 위치 목록이 늘어나는 경우를 보기 위한 샘플 프로세스 추가 */
PROCS.push(
 ['TP-ORD-016','단말','키즈폰 전용 프로세스','승인 대기','N','full'],
 ['TP-ORD-015','커머스','커머스 액세서리 프로세스','임시 저장','Y','tab'],
 ['TP-ORD-014','USIM','USIM 단독 가입 프로세스','승인 완료','Y','sim'],
 ['TP-ORD-013','단말','단말 중고폰 보상 프로세스','임시 저장','Y','full'],
 ['TP-ORD-012','단말','갤럭시 Z 폴드8 전용 프로세스','승인 완료','Y','full'],
 ['TP-ORD-011','단말','갤럭시 S26 전용 프로세스','승인 완료','Y','full']
);
PROCS.sort(function(a,b){return a[0]<b[0]?1:-1});

/* 코너 그룹 : 기존 선·후행 설정 예시를 그룹으로 표기 (정의 중) */
var GROUPS=[
 {id:'CG-PRD-0001',n:'단말 옵션 선택 그룹',t:'코너 그룹',members:['CN-PRD-0005','CN-PRD-0002','CN-PRD-0003'],desc:'단말 상품 기본 정보 아래에 색상, 용량 선택을 붙여 한 영역으로 노출',use:'Y',dt:'2026-10-27 10:20',ver:'v0.1',mby:CORNER_EDITOR},
 {id:'CG-ORD-0001',n:'요금제·할인 방법 묶음',t:'코너 그룹',members:['CN-ORD-0005','CN-ORD-0084'],desc:'요금제 선택 바로 다음에 할인 방법 선택을 이어서 노출',use:'Y',dt:'2026-10-27 11:05',ver:'v0.1',mby:CORNER_EDITOR}
];
/* 데이터 소스 : 상품 연동은 상품 시스템, 그 외 직접 입력. 앞 단계 값을 모아 보여주는 코너는 주문 정보 */
var DS_OVR={};
var CAT={PRD:'상품',ORD:'주문',PAY:'결제'};
var SORTS=['운영자 지정 순서','상품 시스템 기본 순서','추천순 (CVM)','가격 낮은 순','가격 높은 순'];
/* 조건 기준 : 상품 정보 */
var PKEYS={ordertype:{l:'상품 상세에서 선택한 주문 유형',s:'주문 유형',v:['단말+회선','USIM/eSIM+회선','유선','요금제·부가서비스','구독','커머스']},
           epc:{l:'상품 상세에서 선택한 EPC 상품',s:'선택한 EPC 상품',v:['iPhone 18 Pro','iPhone 18 Pro Max','갤럭시 Z 폴드8','갤럭시 S26']}};
CORNERS.forEach(function(c,i){
  var linked=!DS_OVR[c.id]&&c.t==='상품 연동';
  c.opts.forEach(function(x){x.lk=linked&&x.x!=='none'});
  var nl=c.opts.filter(function(x){return x.lk}).length;
  c.ds=DS_OVR[c.id]||(c.t==='상품 연동'?(nl&&nl<c.opts.length?'혼합':'상품 시스템'):'직접 입력');
  c.ver='v1.'+(i%4); c.mby=CORNER_EDITOR;
  c.opts.forEach(function(x,j){x.k=c.id+'-'+j});
  c.sort=SORTS[c.id==='CN-ORD-0005'?2:1];c.lim=c.opts.length||3;
  c.cond={mode:'none',list:[]};
});
(function(){
  function set(id,list){CORNERS.forEach(function(c){if(c.id===id)c.cond={mode:'cond',list:list}})}
  set('CN-ORD-0001',[{kind:'product',key:'ordertype',values:['단말+회선','USIM/eSIM+회선']}]);
  set('CN-ORD-0005',[{kind:'product',key:'ordertype',values:['단말+회선','USIM/eSIM+회선']}]);
  set('CN-ORD-0006',[{kind:'product',key:'ordertype',values:['단말+회선','USIM/eSIM+회선']}]);
  // 코너 원본에는 상품 정보 조건만 둔다. 코너끼리의 흐름(앞 코너 선택값에 따라 나오는 코너)은 코너 그룹 분기형에서 정한다 (정책서 v0.2)
  //  - 바로 보상 신청 : 가입 방식 = 기기변경 → CG-ORD-0008 가입 방식별 추가 선택
  //  - 결제 증빙 수단 : 결제수단 = 계좌이체 · 가상 계좌 → CG-PAY-0001 결제 정보 입력
  set('CN-ORD-0009',[{kind:'product',key:'ordertype',values:['단말+회선']}]);
  // 그룹 전용 코너 : 혼자 두면 흐름이 맞지 않아 주문 프로세스에 단독 배치할 수 없고 그룹으로만 배치한다
  CORNERS.forEach(function(c){if(c.id==='CN-ORD-0009'||c.id==='CN-PAY-0033')c.grpOnly=true});
})();

/* 구분 '결제' : 결제수단, 결제 증빙, 요금 납부 수단 코너 */
KIND_D['결제']='결제수단과 결제·납부 관련 정보를 선택받는 코너입니다.';
CORNERS.forEach(function(c){if(['CN-PAY-0032','CN-PAY-0033','CN-PAY-0004'].indexOf(c.id)>-1)c.t='결제'});

/* 단말 상품 기본 정보 : 하위 코너(색상, 용량)를 코너 안에 보관 */
CORNERS.forEach(function(c){if(c.ui==='pinfo'){c.subs=JSON.parse(JSON.stringify(PSUB));c.subs.forEach(function(x){x.sub=x.sub||'';x.opts.forEach(function(o,j){o.lk=true;o.k=x.id+'-'+j})})}});

/* v6 : 단말 상품 기본 정보 코너 삭제, 관련 코너 그룹 삭제 */
CORNERS=CORNERS.filter(function(c){return c.id!=='CN-PRD-0005'});
GROUPS=GROUPS.filter(function(g){return g.id!=='CG-PRD-0001'});
/* EPC 상품 (조회 팝업 샘플, LV2 이동전화) */
var EPC=[
 {id:'003379',v:'v1.0',n:'5GX 플래티넘',lv2:'이동전화',lv3:'이동전화 요금제형',spec:'5GX 플래티넘 Product Spec',st:'판매중',d:'무제한 · 테더링/공유 150GB · 스마트기기 2회선 무료',p:'월 125,000원'},
 {id:'003380',v:'v1.0',n:'5GX 프라임',lv2:'이동전화',lv3:'이동전화 요금제형',spec:'5GX 프라임 Product Spec',st:'판매중',d:'무제한 · 스마트 기기 2회선 이용 요금 무료',p:'월 89,000원'},
 {id:'003384',v:'v1.0',n:'FLO 앤 데이터',lv2:'이동전화',lv3:'이동전화 base 옵션형',spec:'데이터 Product Spec',st:'판매중',d:'FLO 무제한 감상 + 매달 데이터',p:'월 9,900원'},
 {id:'003392',v:'v1.0',n:'베스트 Max(Google AI)',lv2:'이동전화',lv3:'이동전화 요금제형',spec:'베스트 Max(Google AI) Product Spec',st:'판매중',d:'무제한 · Google AI 혜택 · T 멤버십 VIP',p:'월 109,000원'},
 {id:'003393',v:'v1.0',n:'베스트 Pro(넷플릭스)',lv2:'이동전화',lv3:'이동전화 요금제형',spec:'베스트 Pro(넷플릭스) Product Spec',st:'판매중',d:'무제한 · 테더링/공유 120GB · 넷플릭스 혜택',p:'월 99,999원'},
 {id:'003401',v:'v1.0',n:'baro 요금제',lv2:'이동전화',lv3:'로밍형',spec:'로밍 Product Spec',st:'판매중',d:'해외 로밍 데이터 · 음성 통화',p:'일 11,000원'}
];
function epcOpt(p){return {n:p.n,d:p.d,p:p.p,b:'',x:'',lk:false,epc:p.id,k:'epc-'+p.id}}
CORNERS.forEach(function(c){
  c.cta={on:false,label:''};
  if(c.moreBtn){c.cta={on:true,label:c.moreBtn};c.ctaOrig=1}
  if(c.id==='CN-ORD-0005'){
    c.epcMode=1;c.ds='직접 입력';c.lim=3;
    c.opts=['003393','003392','003380'].map(function(id){return epcOpt(EPC.filter(function(p){return p.id===id})[0])});
  }
});

/* v7 : 상품 추가형 코너, 고객 값 비활성, CTA 목록 */
var GIFT=[
 {id:'G-1001',n:'NEW 휴대용 미니 공기청정기 allo AP500',d:'알로',cat:'생활가전',st:'판매중'},
 {id:'G-1002',n:'Galaxy Buds Live Pro 16',d:'삼성전자',cat:'음향기기',st:'판매중'},
 {id:'G-1003',n:'듀오 무선 충전기 블랙',d:'벨킨',cat:'충전기',st:'판매중'},
 {id:'G-1004',n:'스마트 태그 2',d:'삼성전자',cat:'액세서리',st:'판매중'}
];
var TDP=[
 {id:'T-201',n:'다이소',d:'매월 10,000원 할인 쿠폰',cat:'생활',st:'제공중'},
 {id:'T-202',n:'무신사머니',d:'매월 10,000원 할인 쿠폰',cat:'패션',st:'제공중'},
 {id:'T-203',n:'올리브영',d:'매월 10,000원 할인 쿠폰',cat:'뷰티',st:'제공중'},
 {id:'T-204',n:'스타벅스',d:'매월 5,000원 할인 쿠폰',cat:'카페',st:'제공중'},
 {id:'T-205',n:'CU',d:'매월 5,000원 할인 쿠폰',cat:'편의점',st:'제공중'}
];
var DEVICE=[
 {id:'D-3001',n:'iPhone 18 Pro',d:'그라파이트 · 512G',p:'999,999원/월',cat:'Apple',st:'판매중'},
 {id:'D-3002',n:'iPhone 18 Pro Max',d:'그라파이트 · 512G',p:'999,999원/월',cat:'Apple',st:'판매중'},
 {id:'D-3003',n:'갤럭시 Z 폴드8',d:'라벤더 · 512G',p:'999,999원/월',cat:'삼성전자',st:'판매중'},
 {id:'D-3004',n:'갤럭시 S26',d:'블랙 · 256G',p:'899,999원/월',cat:'삼성전자',st:'판매중'}
];
var ADDON=[
 {id:'A-501',n:'Wavve 앤 데이터',d:'Wavve 무제한 감상 + 매달 데이터',p:'월 9,900 원',cat:'콘텐츠',st:'판매중'},
 {id:'A-502',n:'FLO 앤 데이터',d:'FLO 무제한 감상 + 매달 데이터',p:'월 9,900 원',cat:'콘텐츠',st:'판매중'},
 {id:'A-503',n:'V 컬러링',d:'통화 연결음 대신 영상을 보여줘요',p:'월 3,300 원',cat:'통화',st:'판매중'},
 {id:'A-504',n:'T 우주패스 mini',d:'구독 혜택 모음',p:'월 4,900 원',cat:'구독',st:'판매중'}
];
EPC.forEach(function(p){p.cat=p.lv3});
var CATS={
 epc:{t:'EPC 상품 조회',s:'LV1 · 상품 (고정)',f1:['LV2 · 서비스 도메인',['이동전화']],f2:'LV3 · 서비스 유형',ph:'상품명, EPC 상품ID, 상품 코드 또는 Product Spec 입력',cols:[['EPC 상품ID','id'],['버전','v'],['EPC 상품명','n'],['LV2','lv2'],['LV3','cat'],['Product Spec','spec'],['판매상태','st']],items:EPC,noInfo:1},
 gift:{t:'T 기프트 조회',s:'사은품',f1:['제공 구분',['T 기프트']],f2:'분류',ph:'상품명, 상품ID, 브랜드 입력',cols:[['상품ID','id'],['상품명','n'],['브랜드','d'],['분류','cat'],['판매상태','st']],items:GIFT,cta:1,noInfo:1},
 tdp:{t:'티다팩 제휴처 조회',s:'정기 쿠폰',f1:['제공 구분',['티다팩']],f2:'분류',ph:'제휴처명, 제휴처ID 입력',cols:[['제휴처ID','id'],['제휴처명','n'],['혜택','d'],['분류','cat'],['상태','st']],items:TDP,cta:1},
 device:{t:'단말 상품 조회',s:'LV1 · 상품 (고정)',f1:['LV2 · 서비스 도메인',['단말']],f2:'제조사',ph:'단말명, 상품ID 입력',cols:[['상품ID','id'],['단말명','n'],['제조사','cat'],['대표 옵션','d'],['판매상태','st']],items:DEVICE,noInfo:1},
 addon:{t:'부가서비스 조회',s:'LV1 · 상품 (고정)',f1:['LV2 · 서비스 도메인',['부가서비스']],f2:'분류',ph:'부가서비스명, 상품ID 입력',cols:[['상품ID','id'],['부가서비스명','n'],['분류','cat'],['월 요금','p'],['판매상태','st']],items:ADDON}
};
function catOpt(cat,p){var o={n:p.n,d:p.d||'',p:p.p||'',b:'',x:'',cid:p.id,k:cat+'-'+p.id};if(CATS[cat].cta)o.cl='자세히 보기';return o}
function pick(cat,ids){return ids.map(function(id){return catOpt(cat,CATS[cat].items.filter(function(p){return p.id===id})[0])})}
CORNERS.forEach(function(c){
  c.ctas=[c.moreBtn?{on:true,label:c.moreBtn,link:''}:{on:false,label:'',link:''}];
  delete c.cta;delete c.epcMode;
  var nones=c.opts.filter(function(o){return o.x==='none'}).map(function(o){o.lk=false;return o});
  var CM={'CN-ORD-0005':['epc',['003393','003392','003380']],'CN-ORD-0007':['gift',['G-1001','G-1002']],'CN-ORD-0008':['tdp',['T-201','T-202','T-203']],'CN-PRD-0004':['device',['D-3001','D-3002','D-3003']],'CN-ORD-0011':['addon',['A-501','A-502','A-503']]};
  if(CM[c.id]){c.cat=CM[c.id][0];c.opts=pick(c.cat,CM[c.id][1]).concat(nones);c.ds='직접 입력';c.lim=Math.max(3,c.opts.length-nones.length)}
  if(c.id==='CN-ORD-0340'||c.id==='CN-PAY-0006') c.opts.forEach(function(o){o.cv=true});
  if(c.id==='CN-ORD-0049'){c.opts[0].cv=true;c.opts[1].cv=true}
  if(c.id==='CN-ORD-0052'){c.ctas=[{on:true,label:'내역 확인하기',link:'주문 내역 화면'},{on:true,label:'홈으로 가기',link:'홈 화면'}];c.opts=[]}
  c.opts.forEach(function(o){o.lk=false});
  if(c.ds!=='직접 입력') c.ds='직접 입력';
});

/* CTA 버튼 유형 : 1단 기본, 주문 완료 확인은 2단 */
CORNERS.forEach(function(c){c.ctaType=c.id==='CN-ORD-0052'?2:(c.moreBtn?1:0);if(!c.ctaType)c.ctas=[]});

/* ===== 공통 ===== */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
CORNERS.forEach(function(c,i){
  c.use='Y';
  c.dt='2026-10-'+(26-(i%5))+' '+('0'+(9+i%8)).slice(-2)+':'+('0'+(i*7%60)).slice(-2);
});
CORNERS.forEach(function(c){if(c.id==='CN-PRD-0004'||c.id==='CN-PAY-0002')c.use='N'});
/* 필수 코너 : 그룹에서 숨길 수 없다 (주문 코너 그룹 관리 정책 V-05) */
CORNERS.forEach(function(c){if(c.id==='CN-PAY-0032'||c.id==='CN-PAY-0020')c.req=1});

/* ===== FO 미리보기 렌더러 ===== */
var IC={
 tip:'<svg class="fo-ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01" stroke-linecap="round"/></svg>',
 chev:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
 img:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/></svg>',
 chk:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>'
};
function has(c,k){return c.it.indexOf(k)>-1}
function foHead(c){
  if(!c.q) return '';
  var h='<div class="fo-h"><div><b>'+esc(c.q)+(has(c,'I')?IC.tip:'')+'</b>'+(c.sub&&has(c,'S')?'<p>'+esc(c.sub)+'</p>':'')+'</div>';
  if(has(c,'A')) h+='<a class="fo-all">전체보기</a>'; else if(c.link) h+='<a class="fo-all">'+esc(c.link)+'</a>';
  return h+'</div>';
}
function badge(b){
  if(!b) return '';
  var cls=b==='BEST'?'bd-pu':(b==='이용중'||b==='최근 사용'?'bd-dk':(b==='최대할인'?'bd-dk':(b==='AI PICK'||b==='추천'?'bd-sk':'bd-gy')));
  return '<span class="fo-bd '+cls+'">'+esc(b)+'</span>';
}
function logoBox(n){var col=['#e5242b','#1b1b1b','#4bb04f','#1f46d9'];var k=n.charCodeAt(0)%4;return '<span class="fo-logo" style="background:'+col[k]+'">'+esc(n.slice(0,2))+'</span>'}
function foBody(c){
  var h='',O=c.opts;
  switch(c.ui){
  case 'info':
    h='<div class="fo-pimg"><div class="fo-phone"></div></div><div class="fo-note">해당 상품은 11월 16일 이후 신규 가입 중단될 예정입니다.</div><div class="fo-pinfo"><p class="fo-cp">'+esc(c.sub)+'</p><b class="fo-pn">'+esc(c.q)+'</b><div class="fo-tags"><span class="fo-bd bd-dk">장기고객 혜택</span><span class="fo-bd bd-sk">신규</span><span class="fo-bd bd-gy">바로보상</span><span class="fo-bd bd-gy">무료배송</span></div><div class="fo-warn">만 18세 이상 만 34세 미만의 고객님만 가입할 수 있는 상품이에요</div></div>';
    return h;
  case 'pinfo':
    var b=foBody({ui:'info',q:c.q,sub:c.sub,opts:[],it:c.it});
    PSUB.forEach(function(x){b+='<div class="fo-div"></div>'+foBody(x)});
    return b;
  case 'ai':
    h='<div class="fo-ai"><b class="fo-ait">✦ '+esc(c.q)+'</b><p>'+esc(c.sub)+'</p><div class="fo-kv">'+O.map(function(x){return '<div><span>'+esc(x.n)+'</span><em>'+esc(x.d)+'</em></div>'}).join('')+'</div><button class="fo-btn">'+esc(c.btn)+'</button></div>';
    return h;
  case 'color':
    return foHead(c)+'<p class="fo-sm">'+esc(O[0].n)+'</p><div class="fo-sw">'+O.map(function(x,i){return '<i class="'+(i?'':'on')+(x.b?' so':'')+'" style="background:'+x.x+'" title="'+esc(x.n+(x.b?' ('+x.b+')':''))+'"></i>'}).join('')+'</div>';
  case 'list':
    var lim=c.more||99;
    h=foHead(c)+'<div class="fo-ls">'+O.map(function(x,i){
      if(i>=lim) return '';
      var none=x.x==='none', sold=x.b==='품절'||x.b==='일시품절';
      return '<div class="fo-op'+(i===0&&!c.chev?' on':'')+(sold?' sold':'')+(none?' none':'')+(c.chev?' row':'')+'"><div class="fo-l"><b>'+esc(x.n)+(c.chev&&x.b?' <span class="fo-lb">'+esc(x.b)+'</span>':'')+(!c.chev&&x.b&&!sold?' '+badge(x.b):'')+'</b>'+(x.p&&!c.chev?'<strong>'+esc(x.p)+'</strong>':'')+(x.d?'<small>'+esc(x.d)+'</small>':'')+'</div>'+(sold?'<span class="fo-sold">'+esc(x.b)+'</span>':'')+(c.chev?'<span class="fo-r">'+(x.p?'<small>'+esc(x.p)+'</small>':'')+(none?'':IC.chev)+'</span>':'')+'</div>';
    }).join('')+(O.length>lim?'<div class="fo-op more">더보기</div>':'')+'</div>';
    return h;
  case 'card':
    h=foHead(c)+'<div class="fo-ls">'+O.map(function(x,i){
      if(x.x==='none') return '<div class="fo-op none"><div class="fo-l"><b>'+esc(x.n)+'</b></div></div>';
      return '<div class="fo-op card'+(i===0?' on':'')+'"><div class="fo-l">'+(x.b?badge(x.b):'')+'<b>'+esc(x.n)+'</b>'+(x.d?'<small>'+esc(x.d)+'</small>':'')+(x.p?'<strong>'+esc(x.p)+'</strong>':'')+(has(c,'L')?'<a class="fo-lk">'+esc(x.cl||'자세히 보기')+'</a>':'')+'</div>'+(c.logo?logoBox(x.n):'')+'</div>';
    }).join('')+(c.moreBtn?'<div class="fo-morebtn">'+esc(c.moreBtn)+'</div>':'')+'</div>';
    return h;
  case 'grid':
    return foHead(c)+'<div class="fo-gd">'+O.map(function(x){return '<div class="fo-gi"><div class="fo-gimg"><i class="fo-rd"></i>'+IC.img+'</div><small>'+esc(x.d)+'</small><b>'+esc(x.n)+'</b><span class="fo-gb">'+esc(x.cl||'자세히 보기')+'</span></div>'}).join('')+'</div>';
  case 'hscroll':
    return foHead(c)+'<div class="fo-hs">'+O.map(function(x){return '<div class="fo-hi"><div class="fo-gimg">'+IC.img+'</div><b>'+esc(x.n)+'</b><strong>'+esc(x.p)+'</strong><small>'+esc(x.d)+'</small>'+(x.b?'<span class="fo-bd bd-gy">'+esc(x.b)+'</span>':'')+'</div>'}).join('')+'</div>';
  case 'chip':
    return foHead(c)+'<div class="fo-ch">'+O.map(function(x,i){return '<span class="'+(i?'':'on')+'">'+esc(x.n)+'</span>'}).join('')+'</div><p class="fo-sm">사용 중인 번호</p><div class="fo-in">010-1234-5678<em>확인</em></div>';
  case 'radio':
    return foHead(c)+'<div class="fo-rl">'+O.map(function(x,i){return '<div class="fo-ri"><i class="'+(i?'':'on')+'"></i><span>'+esc(x.n)+'</span>'+(x.b?badge(x.b):'')+(x.d&&i===0?'':'')+'</div>'+(x.d&&has(c,'D')?'<p class="fo-rd2">'+esc(x.d)+'</p>':'')}).join('')+'</div>';
  case 'form':
    return foHead(c)+O.map(function(x){
      if(x.x==='check') return '<p class="fo-ck">'+IC.chk+esc(x.n)+'</p>';
      return '<p class="fo-sm">'+esc(x.n)+'</p><div class="fo-in'+(x.n==='주소'||x.n==='상세주소'?' ph':'')+'">'+esc(x.d)+(x.n==='주소'?'<em>우편번호 찾기</em>':'')+'</div>';
    }).join('');
  case 'sum':
    return foHead(c)+'<div class="fo-sum">'+(c.id==='CN-ORD-0340'?'<div class="fo-sp"><i></i><b>iPhone 17 Pro</b><strong>999,999원</strong></div>':'')+O.map(function(x,i){var last=i===O.length-1&&c.id!=='CN-ORD-0340';return '<div class="fo-sr'+(last?' tot':'')+'"><span>'+esc(x.n)+'</span><em>'+esc(x.d)+'</em></div>'}).join('')+'</div>';
  case 'terms':
    return '<div class="fo-sheet"><div class="fo-h"><div><b>'+esc(c.q)+'</b></div><span class="fo-x">✕</span></div><p class="fo-ck all"><i></i>전체 동의</p>'+O.map(function(x){return '<p class="fo-tl">'+IC.chk+'<span>'+esc(x.n)+'</span>'+IC.chev+'</p>'}).join('')+'<button class="fo-btn pri">동의하고 주문하기</button></div>';
  case 'done':
    return '<div class="fo-done"><span class="fo-ok">'+IC.chk+'</span><b>'+esc(c.q)+'</b><p>'+esc(c.sub)+'</p><div class="fo-pimg sm"><div class="fo-phone"></div></div><div class="fo-ch">'+O.map(function(x,i){return '<span class="'+(i?'pri':'')+'">'+esc(x.n)+'</span>'}).join('')+'</div></div>';
  case 'nv':
    return '<div class="fo-nv"><b>'+esc(c.n)+' (비화면)</b><p>FO 화면에 노출되지 않습니다.</p><div class="fo-nvv">'+O.map(function(x){return '<span>'+esc(x.n)+'</span>'}).join('<i>또는</i>')+'</div><p>분기 조건 값으로만 사용합니다.</p></div>';
  }
  return '';
}
function foCard(c){return '<div class="fo'+(c.ui==='terms'?' bs':'')+(c.ui==='nv'?' nvw':'')+'">'+foBody(c)+'</div>'}
function ctaN(c){return c.ctaType===2?2:(c.ctaType===1?1:0)}
function ctaList(c){var n=ctaN(c),L=(c.ctas||[]).slice(0,n);while(L.length<n)L.push({on:true,label:'',link:''});return L}
function pvCorner(c){
  if(c.ui==='pinfo'&&c.subs){
    var b=foBody({ui:'info',q:c.q,sub:c.sub,opts:[],it:c.it});
    c.subs.forEach(function(x){var y={};for(var k in x)y[k]=x[k];if(y.sub&&y.it.indexOf('S')<0)y.it+='S';b+='<div class="fo-div"></div>'+foBody(y)});
    return '<div class="fo">'+b+'</div>';
  }
  var x={};for(var k in c)x[k]=c[k];
  x.opts=c.opts.slice();x.moreBtn='';
  if(c.cat&&c.lim) x.opts=x.opts.slice(0,c.lim);
  var on=ctaList(c).filter(function(a){return a.on&&a.label});
  if(c.ui==='done'){x.opts=c.ctaType===2?on.map(function(a){return {n:a.label,d:'',p:'',b:'',x:''}}):[]}
  var h=foCard(x),btn='';
  if(on.length&&!(c.ui==='done'&&c.ctaType===2)){
    btn=c.ctaType===2&&on.length===2?'<div class="fo-ch" style="margin-top:12px"><span>'+esc(on[0].label)+'</span><span class="pri">'+esc(on[1].label)+'</span></div>':on.map(function(a){return '<div class="fo-morebtn" style="margin-top:10px">'+esc(a.label)+'</div>'}).join('');
    h=h.replace(/<\/div>$/,btn+'</div>');
  }
  return h;
}

/* ===== 주문 코너 변경 저장 (브라우저 localStorage) =====
   주문 코너 관리에서 등록 · 수정 · 삭제한 코너를 저장해 두고, 이 데이터를 쓰는 화면(주문 코너 관리 · 주문 코너 그룹 관리의 코너 추가 팝업)이 열릴 때 다시 적용한다.
   처음부터 있던 코너는 바뀐 값(edited) · 삭제(deleted)로, 새로 등록한 코너는 통째로(added) 둔다. 저장소를 못 쓰면 이 화면 안에서만 반영된다 */
var LS_KEY='nova.orderCorner.v22';
var BASE_IDS={};CORNERS.forEach(function(c){BASE_IDS[c.id]=1});
function lsRead(){try{var v=JSON.parse(localStorage.getItem(LS_KEY)||'null');return v&&typeof v==='object'?v:null}catch(e){return null}}
function lsWrite(v){try{localStorage.setItem(LS_KEY,JSON.stringify(v))}catch(e){}}
function lsState(){var v=lsRead()||{};v.added=v.added||[];v.edited=v.edited||{};v.deleted=v.deleted||[];return v}
(function(){
  var v=lsRead();if(!v)return;
  (v.deleted||[]).forEach(function(id){var k=CORNERS.findIndex(function(c){return c.id===id});if(k>-1)CORNERS.splice(k,1)});
  Object.keys(v.edited||{}).forEach(function(id){var c=CORNERS.find(function(x){return x.id===id});if(c){Object.keys(c).forEach(function(k){delete c[k]});Object.assign(c,v.edited[id])}});
  (v.added||[]).slice().reverse().forEach(function(c){if(!CORNERS.some(function(x){return x.id===c.id}))CORNERS.unshift(c)});
})();
function persistCorner(c){
  var v=lsState(),o=JSON.parse(JSON.stringify(c));
  if(BASE_IDS[c.id])v.edited[c.id]=o;
  else{var k=v.added.findIndex(function(x){return x.id===c.id});if(k>-1)v.added[k]=o;else v.added.unshift(o)}
  lsWrite(v);
}
function forgetCorner(id){
  var v=lsState();
  if(BASE_IDS[id]){delete v.edited[id];if(v.deleted.indexOf(id)<0)v.deleted.push(id)}
  else v.added=v.added.filter(function(x){return x.id!==id});
  lsWrite(v);
}

export { PAGES, UI, KIND_D_OLD, ITEMS, o, CORNERS, STR, PROCS, CONDREF, COMP, LINKS, LSRC, PSUB, KIND_D, GROUPS, DS_OVR, CAT, SORTS, PKEYS, EPC, epcOpt, GIFT, TDP, DEVICE, ADDON, CATS, catOpt, pick, esc, IC, has, foHead, badge, logoBox, foBody, foCard, ctaN, ctaList, pvCorner, persistCorner, forgetCorner };
