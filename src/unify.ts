// @ts-nocheck
// 상품 전시 관리: 버전별로 목록 · 등록을 한 파일에서 관리한다(11-25). 버전 파일마다 src/page-*.ts가 이 함수를 부른다.
// HTML 규칙
//  - 등록 화면에만 쓰는 노드 · 스타일: data-mode="edit" (목록 화면에서는 지운다)
//  - 목록 마크업: <template data-list="main"> 은 <main> 안에, <template data-list="body"> 는 <body> 끝에 꺼내 붙인다
//    data-body-class 가 있으면 목록 화면에서 <body>에 그 클래스를 붙인다
// 두 화면은 스타일 · id가 겹치므로(.btn · #toast 등) 한쪽만 그린다. 등록 화면에서는 템플릿을 꺼내지 않는다(화면에 그려지지 않음)
// 목록 · 등록 스크립트는 isUnified()로 통합 파일 안에서 열렸는지 보고, 이동 주소를 같은 파일(SELF)로 만든다

/** 지금 열린 파일 이름 (예: product-v022.html) */
export const SELF = () => location.pathname.split('/').pop() || '';
/** 목록 · 등록 통합 파일 안에서 열렸는지 */
export const isUnified = () => document.body.dataset.unified === '1';

export function unify({ isEdit, edit, list }) {
  const qs = new URLSearchParams(location.search);
  document.body.dataset.unified = '1';
  if (isEdit(qs)) { edit(); return; }
  document.querySelectorAll('[data-mode="edit"]').forEach(n => n.remove());
  document.querySelector('.app-nav')?.removeAttribute('data-auto-collapse');
  const main = document.querySelector('.app>main');
  document.querySelectorAll('template[data-list]').forEach(t => {
    (t.dataset.list === 'body' ? document.body : main).append(t.content.cloneNode(true));
    if (t.dataset.bodyClass) document.body.classList.add(...t.dataset.bodyClass.split(' '));
  });
  list();
}

/** 등록 화면 조건: 상품 전시 v0.2.1~ (?view=new 등록, ?id=N 상세 · 수정) */
export const editByIdOrNew = qs => qs.get('view') === 'new' || (qs.has('id') && qs.get('view') !== 'list');
/** 등록 화면 조건: v0.1.1~v0.1.3 (?view=new 등록, ?edit=ID 수정) */
export const editByEditOrNew = qs => qs.get('view') === 'new' || qs.has('edit');
/** 등록 화면 조건: v0.1 (?view=new 등록) */
export const editByNew = qs => qs.get('view') === 'new';
