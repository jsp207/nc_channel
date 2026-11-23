// @ts-nocheck
// 공통 정책서(common-policy.html): 내용은 src/common-policy-data.ts에서 그립니다.
import "./style.css";
import { requireAuthentication } from "./auth";
import { CASE_GROUPS } from "./common-policy-data";

requireAuthentication();

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/\n/g, '<br>');
const caseId = (g, ci) => `${g.id}-${String(ci + 1).padStart(2, '0')}`;
const total = CASE_GROUPS.reduce((n, g) => n + g.cases.length, 0);
const open = CASE_GROUPS.reduce((n, g) => n + g.cases.filter(c => c.status === '미확정').length, 0);

document.getElementById('cpCount').textContent = `케이스 그룹 ${CASE_GROUPS.length}개 · 케이스 ${total}개${open ? ` · 미확정 ${open}개` : ''}`;

document.getElementById('cpToc').innerHTML = CASE_GROUPS.map(g =>
  `<li><a href="#${g.id}">${g.id} ${esc(g.group)} <span class="cp-n">${g.cases.length}</span></a></li>`).join('');

document.getElementById('cpBody').innerHTML = CASE_GROUPS.map(g => `
  <section id="${g.id}">
    <h2><span class="np-no">${g.id}</span>${esc(g.group)}</h2>
    ${g.cases.length ? g.cases.map((c, ci) => `
      <article class="cp-case" id="${caseId(g, ci)}">
        <h3><span class="cp-no">${caseId(g, ci)}</span><span>${esc(c.q)}</span>${c.status ? `<span class="cp-open">${c.status}</span>` : ''}</h3>
        <dl>
          <dt>정책</dt><dd>${esc(c.a)}</dd>
          <dt>SB 필요사항</dt><dd>${c.sb ? esc(c.sb) : '<span class="cp-none">없음</span>'}</dd>
        </dl>
      </article>`).join('') : '<p class="cp-none">등록된 케이스가 없습니다</p>'}
  </section>`).join('');
