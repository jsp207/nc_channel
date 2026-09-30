# 어드민

React 없이 HTML, TypeScript, Tailwind CSS v4로 구성한 Vite 다중 페이지 앱입니다.

## 실행

Node.js 22.12 이상이 필요합니다. 이 Mac에 준비한 프로젝트 전용 Node.js를 사용하려면 터미널에서 먼저 실행하세요.

```sh
export PATH="$PWD/.local/node-v22.23.3-darwin-arm64/bin:$PATH"
```

프로젝트 루트 디렉터리에서 실행해야 하며, 새 터미널을 열 때 다시 적용하세요. 다른 환경에서는 Node.js를 별도로 설치하면 됩니다.

```powershell
npm ci
npm run dev
```

`npm run dev`는 인증 서버와 Vite를 함께 실행합니다. 브라우저에서 `http://localhost:5173`을 열면 서버 인증 후 화면에 진입할 수 있습니다.

로컬 기본 비밀번호는 `3355`입니다. 인증 서버는 `http://127.0.0.1:4000`에서 실행되며 Vite가 `/api` 요청을 전달합니다. 종료하려면 터미널에서 `Ctrl+C`를 누르세요.

비밀번호 검증은 Express 서버에서 bcrypt 해시로 처리하며, 비밀번호 원문은 클라이언트 코드에 포함하지 않습니다. 세션은 서버 메모리에 저장되므로 운영 환경에서는 Redis 등의 세션 저장소와 HTTPS를 사용해야 합니다.

## 빌드

```powershell
npm run build
npm run preview
```

미리보기는 인증 서버도 함께 실행합니다. 접속 주소는 `http://localhost:4173`입니다. 개발 서버와 미리보기는 인증 서버의 4000 포트를 공유하므로 동시에 실행하지 마세요.

빌드 결과를 인증 서버로 실행하려면:

```powershell
npm run build
npm start
```

`http://localhost:4000`에서 빌드한 화면과 인증 API를 함께 제공합니다.

원본 단일 파일은 `product-admin-prototype-simple.html`로 보존되어 있습니다.
