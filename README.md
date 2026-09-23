# Nova 상품 운영 어드민

React 없이 HTML, TypeScript, Tailwind CSS v4로 구성한 Vite SPA입니다.

## 실행

```powershell
npm install
npm run dev
```

`npm run dev`는 인증 서버와 Vite를 함께 실행합니다. 브라우저에서 `http://localhost:5173`을 열면 서버 인증 후 화면에 진입할 수 있습니다.

비밀번호 검증은 Express 서버에서 bcrypt 해시로 처리하며, 비밀번호 원문은 클라이언트 코드에 포함하지 않습니다. 세션은 서버 메모리에 저장되므로 운영 환경에서는 Redis 등의 세션 저장소와 HTTPS를 사용해야 합니다.

## Vercel 배포

Vercel에서는 `api/` 아래의 Serverless Function이 인증을 처리합니다. Vercel 프로젝트 Settings > Environment Variables에 다음 값을 설정하세요.

- `PASSWORD_HASH`: `node -e "console.log(require('bcryptjs').hashSync('3355', 12))"` 결과
- `SESSION_SECRET`: 충분히 긴 무작위 문자열

환경변수 저장 후 Vercel에서 재배포해야 적용됩니다. Vercel은 HTTPS를 사용하므로 인증 쿠키가 정상적으로 동작합니다.

## 빌드

```powershell
npm run build
npm run preview
```

빌드 결과를 인증 서버로 실행하려면:

```powershell
npm run build
npm start
```

원본 단일 파일은 `product-admin-prototype-simple.html`로 보존되어 있습니다.
