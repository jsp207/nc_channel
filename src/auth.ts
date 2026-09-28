// @ts-nocheck
// 모든 페이지 공통: 서버 세션을 확인하고, 없으면 비밀번호 입력 화면을 띄웁니다.
export async function requireAuthentication() {
  const response = await fetch('/api/session', { credentials: 'include' });
  const session = response.ok ? await response.json() : { authenticated: false };
  if (session.authenticated === true) {
    document.body.classList.add('authenticated');
    return;
  }

  const gate = document.createElement('section');
  gate.className = 'auth-gate';
  gate.innerHTML = `<div class="auth-card"><h1>NC-Channel Product Admin</h1><p>관리자 비밀번호를 입력하세요.</p><form class="auth-form"><label for="authPassword">비밀번호</label><input id="authPassword" name="password" type="password" autocomplete="current-password" required><p class="auth-error" aria-live="polite"></p><button class="btn primary" type="submit">입장</button></form></div>`;
  document.body.appendChild(gate);

  const form = gate.querySelector('form');
  const input = gate.querySelector('input');
  const error = gate.querySelector('.auth-error');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const login = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: input.value }),
    });
    if (login.ok) {
      gate.remove();
      document.body.classList.add('authenticated');
      return;
    }
    input.value = '';
    error.textContent = '비밀번호가 올바르지 않습니다.';
    input.focus();
  });
  input.focus();
}
