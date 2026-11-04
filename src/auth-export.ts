// @ts-nocheck
// 외부 검토용 내보내기(vite.export.config.ts)에서 auth.ts 대신 쓴다. 서버 없이 열리도록 로그인 확인을 건너뛴다.
import "./lnb";
export async function requireAuthentication() {
  document.body.classList.add('authenticated');
}
