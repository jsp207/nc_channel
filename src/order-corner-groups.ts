// @ts-nocheck
// 주문 코너 그룹 원본 데이터. 주문 코너 그룹 관리 v0.2.3(order-corner-group-v23.ts)와 주문 프로세스 관리 v0.2.4(order6-create)가 함께 쓴다.
// 코너는 주문 코너 관리 원본(order-corner-v22-data)을 [코너 ID + 참조 버전]으로 참조한다
import { CORNERS } from "./order-corner-v22-data";
import { loadProcs } from "./order-process-data";

export const GROUP_EDITOR='김태리 (P000100)';   // 최근 수정자 : 목록 · 상세 모두 이 값
const EDITOR=GROUP_EDITOR;
const C=id=>CORNERS.find(c=>c.id===id);

export function prevVer(v){const p=v.slice(1).split('.');return +p[1]>0?'v'+p[0]+'.'+(+p[1]-1):v;}
/* 참조 버전은 코너 최신 버전으로 둔다. 'old'면 한 단계 이전 버전을 참조하는 예시 (최신 버전 적용 안내 확인용) */
const M=(cid,cv,show,title)=>{const c=C(cid),v=c?c.ver:'v1.0';return {cid:cid,cv:cv==='old'?prevVer(v):v,show:show!==false,title:title||''};};
export const GROUPS=[
{id:'CG-ORD-0001',live:{ver:'v1.1',n:'요금제·할인 방법 묶음',desc:'요금제 선택 바로 다음에 할인 방법 선택을 이어서 노출',use:'Y',members:[M('CN-ORD-0005',''),M('CN-ORD-0084','')]},procs:[['TP-ORD-012','v1.1'],['TP-ORD-011','v1.1'],['TP-ORD-010','v1.0'],['TP-ORD-006','v1.0']],dt:'2026-10-30 14:20',mby:EDITOR},
{id:'CG-ORD-0002',live:{ver:'v1.2',n:'가입 조건 선택',desc:'사용자, 가입 방식, 단말 납부 기간을 한 영역에서 받는다',use:'Y',members:[M('CN-ORD-0002',''),M('CN-ORD-0003','old'),M('CN-ORD-0004','')]},procs:[['TP-ORD-010','v1.2'],['TP-ORD-009','v1.2'],['TP-ORD-005','v1.1'],['TP-ORD-004','v1.1'],['TP-ORD-013','v1.2']],dt:'2026-10-29 10:05',mby:EDITOR},
{id:'CG-ORD-0003',live:{ver:'v1.0',n:'배송·개통 옵션',desc:'배송 방법과 SIM 유형을 연속 노출',use:'Y',members:[M('CN-ORD-0001','old'),M('CN-ORD-0006','')]},procs:[['TP-ORD-014','v1.0'],['TP-ORD-007','v1.0']],dt:'2026-10-21 16:40',mby:EDITOR},
{id:'CG-ORD-0004',live:{ver:'v1.0',n:'단말 혜택 선택',desc:'T 기프트, 티다팩을 한 묶음으로 노출 (바로 보상은 가입 방식 분기 CG-ORD-0008로 이동)',use:'Y',members:[M('CN-ORD-0007','old'),M('CN-ORD-0008','')]},procs:[['TP-ORD-010','v1.0'],['TP-ORD-009','v1.0'],['TP-ORD-013','v1.0']],dt:'2026-11-03 15:20',mby:EDITOR},
{id:'CG-ORD-0005',live:{ver:'v1.0',n:'단말 부가 상품 선택',desc:'단말 보험과 부가서비스를 이어서 노출',use:'Y',members:[M('CN-ORD-0010',''),M('CN-ORD-0011','',true,'함께 쓰면 좋은 부가서비스')]},procs:[['TP-ORD-012','v1.0'],['TP-ORD-011','v1.0']],dt:'2026-10-18 11:10',mby:EDITOR},
{id:'CG-ORD-0006',live:{ver:'v1.0',n:'주문 확인·약관 동의',desc:'최종 금액 확인 후 약관 동의를 노출',use:'Y',members:[M('CN-PAY-0006',''),M('CN-PAY-0020','')]},procs:[['TP-ORD-008','v1.0'],['TP-ORD-015','v1.0']],dt:'2026-11-02 11:00',mby:EDITOR},
{id:'CG-ORD-0007',disc:true,live:{ver:'v1.1',n:'구 배송 정보 묶음',desc:'배송 정보 입력과 통합 청구 (2026.09 주문서 개편 전)',use:'N',members:[M('CN-ORD-0049',''),M('CN-ORD-0071','')]},procs:[],dt:'2026-10-02 09:30',mby:EDITOR},
{id:'CG-PAY-0001',live:{ver:'v1.2',n:'결제 정보 입력',desc:'요금 납부, 결제수단을 노출하고 계좌이체 · 가상 계좌일 때 증빙 수단을 이어서 노출',use:'Y',kind:'branch',rep:'CN-PAY-0032',members:[M('CN-PAY-0004',''),M('CN-PAY-0032','old'),Object.assign(M('CN-PAY-0033',''),{when:['계좌이체','가상 계좌']})]},procs:[['TP-ORD-012','v1.2'],['TP-ORD-011','v1.2'],['TP-ORD-010','v1.1'],['TP-ORD-009','v1.2'],['TP-ORD-008','v1.2'],['TP-ORD-014','v1.1']],dt:'2026-10-27 13:00',mby:EDITOR},
// 분기형 예시 : 대표 코너(가입 방식 선택)의 선택값에 따라 이어지는 코너가 달라진다. when 비우면 항상 노출
{id:'CG-ORD-0008',live:{ver:'v1.0',n:'가입 방식별 추가 선택',desc:'가입 방식에 따라 대리 가입 · 바로 보상 코너를 이어서 노출 (분기형 예시)',use:'Y',kind:'branch',rep:'CN-ORD-0003',members:[M('CN-ORD-0003',''),Object.assign(M('CN-ORD-0002',''),{when:['신규가입','번호이동']}),Object.assign(M('CN-ORD-0009',''),{when:['기기변경']})]},procs:[],dt:'2026-11-05 10:00',mby:EDITOR},
{id:'CG-PAY-0002',live:null,draft:{ver:'v1.0',st:'임시 저장',data:{n:'추가 할인 수단',desc:'제휴카드와 쿠폰·포인트 할인을 묶어 노출',use:'Y',members:[M('CN-PAY-0001',''),M('CN-PAY-0002','')]}},procs:[],dt:'2026-11-04 09:40',mby:EDITOR}
];

/* ===== 그룹 변경 저장 (브라우저 localStorage) =====
   주문 코너 그룹 관리 v0.2.3에서 등록 · 수정 · 승인 · 폐기 · 삭제한 그룹을 통째로 저장해 두고, 이 원본을 쓰는 화면이 열릴 때 다시 적용한다 */
const GROUP_KEY='nova.orderCornerGroup.v23';
(function(){
  try{const v=JSON.parse(localStorage.getItem(GROUP_KEY)||'null');if(Array.isArray(v)&&v.length)GROUPS.splice(0,GROUPS.length,...v);}catch(e){}
})();
export function persistGroups(){try{localStorage.setItem(GROUP_KEY,JSON.stringify(GROUPS));}catch(e){}}

/* 그룹 전용 코너 : 주문 프로세스에 단독 배치할 수 없는 코너 ID (코너 원본 grpOnly) */
export function groupOnlyIds(){return CORNERS.filter(c=>c.grpOnly).map(c=>c.id);}

/* 실제 사용 위치 : 주문 프로세스 관리가 저장소에 남긴 프로세스 목록에서 그룹으로 배치한 코너를 찾는다.
   저장소 값이 없으면 null (예시 사용 위치를 그대로 쓴다). {map: 그룹 ID → [{pid, ver}], names: 프로세스 ID → [구분, 프로세스명]} */
export function groupUsage(){
  const P=loadProcs();if(!P.live)return null;
  const map={},names={};
  P.rows.forEach(p=>{names[p.id]=[p.cat||'-',p.n||p.id];const seen={};
    (p.stages||[]).forEach(s=>(s.corners||[]).forEach(c=>{if(c.grp&&!seen[c.grp.gid]){seen[c.grp.gid]=1;(map[c.grp.gid]=map[c.grp.gid]||[]).push({pid:p.id,ver:c.grp.ver});}}));});
  return {map,names};
}

/* 주문 프로세스에 배치할 수 있는 그룹 : 운영 버전이 있고(발행됨) 폐기되지 않았고 사용 여부 Y. 숨김 멤버는 빼고 노출 순서대로.
   kind seq 순차형 | branch 분기형(rep 대표 코너 ID, 멤버 when = 대표 코너 선택값 목록, 비우면 항상) */
export function placeableGroups(){
  return GROUPS.filter(g=>g.live&&!g.disc&&g.live.use==='Y').map(g=>({id:g.id,ver:g.live.ver,n:g.live.n,desc:g.live.desc,
    kind:g.live.kind==='branch'&&g.live.rep?'branch':'seq',rep:g.live.kind==='branch'?g.live.rep||'':'',
    vals:g.live.kind==='branch'&&C(g.live.rep)?(C(g.live.rep).opts||[]).filter(o=>o.x!=='none').map(o=>o.n):[],
    members:g.live.members.filter(m=>m.show).map(m=>({cid:m.cid,cv:m.cv,title:m.title,when:g.live.kind==='branch'&&m.cid!==g.live.rep?(m.when||[]).slice():[]}))}));
}
