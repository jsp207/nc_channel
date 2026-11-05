// @ts-nocheck
// 주문 정책서 페이지(order-corner-group-policy-v02.html) : 상품 기준(policy.html)과 같은 공통 스타일 · 로그인 · 왼쪽 메뉴만 쓴다.
// policy.html의 main.ts는 상품 기준 화면 계산(마스터 정책 · 단품 조회 · 번들)까지 돌기 때문에 따로 둔다
import "./style.css";
import { requireAuthentication } from "./auth";

requireAuthentication();
