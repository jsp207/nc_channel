// @ts-nocheck
// 구조도(BO 개발 리뷰 Intro): ref/BO_Intro_20261014.html을 옮긴 화면. 탭(구조도 · IA · 거버넌스)은 라디오 + CSS로 전환합니다.
import "./admin-shell.css";
import { requireAuthentication } from "./auth";

requireAuthentication();

// 주소(#structure, #ia, #gov) 또는 마지막으로 본 탭을 엽니다.
const map = { structure: 'r-structure', ia: 'r-ia', gov: 'r-gov' };
let id = map[location.hash.slice(1)];
if (!id) { try { id = localStorage.getItem('bo-intro-tab2'); } catch {} }
const el = id && document.getElementById(id);
if (el) el.checked = true;
document.querySelectorAll('.tab-r').forEach(r => {
  r.addEventListener('change', () => { try { localStorage.setItem('bo-intro-tab2', r.id); } catch {} });
});
