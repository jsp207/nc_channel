# 어드민

React 없이 HTML, TypeScript, Tailwind CSS v4로 구성한 Vite 다중 페이지 앱입니다.

## 화면 수정

각 HTML의 `<main>` 안에서 제목, 설명, 입력 항목, 화면 배치를 직접 수정할 수 있습니다.

| 파일 | 화면 |
| --- | --- |
| `index.html` | 기준·정책·단품 조회 |
| `bundle-create.html` | 번들 생성 |
| `bundle-create2.html` | 번들 생성: 대표 변형 검색·체크박스 선택 |
| `bundle-create3.html` | 번들 생성: 실제 상품 1,549개, 대표 변형 검색·체크, 추가 상품별 선택 수(최소~최대). 스크립트는 `src/bundle-create3.ts` |
| `bundle-create4.html` | 번들 생성 4: 번들 생성 3을 복사해 시작한 화면. 스크립트는 `src/bundle-create4.ts` |
| `bundle-list.html` | 번들 목록 |
| `display-list.html` | 전시 목록 + 카테고리(자동) |
| `display-create.html` | 전시 생성하기 |
| `product-create.html` | 상품등록: ref/product-admin-prototype-v4-2.html 기반. 기본정보(전시유형·상품명·노출채널·카테고리·노출·전시상태)·기준 단품(디바이스 옵션목록·EPC 매칭)·슬롯·이미지(대표·추가)·상세설명(이미지 업로드/HTML/전시빌더)·유의사항을 한 화면에서 구성. 임시저장은 검사 없이 목록에 임시저장 상태로 남는다. `?edit=<id>`로 열면 수정. 스크립트는 `src/product-create.ts` |
| `product-list.html` | 상품목록: 유형·채널·상태 필터, 수정은 등록 화면으로 이동. 스크립트는 `src/product-list.ts`. 두 화면이 같이 쓰는 데이터·저장소는 `src/product-display-store.ts` |

공통 디자인은 `src/style.css`, 데이터와 버튼 동작 및 목록 행 생성은 `src/main.ts`에서 수정합니다. JavaScript가 사용하는 `id`는 유지하세요. 공통 메뉴는 각 HTML의 `<nav>`에 있으므로 메뉴 변경 시 모든 페이지에 반영하세요.

저장한 번들과 전시는 현재 브라우저의 localStorage에 보관되어 페이지 이동과 새로고침 후에도 유지됩니다. 다른 브라우저·기기와는 공유되지 않으며, 브라우저 사이트 데이터를 삭제하면 초기 예시 데이터로 돌아갑니다.

PowerShell에서 `npm.ps1` 실행 정책 오류가 나면 `npm.cmd run dev`로 실행하세요. HTML은 파일을 직접 여는 대신 개발 서버 주소에서 확인하세요.

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

미리보기는 인증 서버도 함께 실행합니다. 접속 주소는 `http://localhost:4173`입니다. 개발 서버와 미리보기는 인증 서버의 4000 포트를 공유하므로 동시에 실행하지 마세요.

빌드 결과를 인증 서버로 실행하려면:

```powershell
npm run build
npm start
```

`http://localhost:4000`에서 빌드한 화면과 인증 API를 함께 제공합니다.

원본 단일 파일은 `product-admin-prototype-simple.html`로 보존되어 있습니다.
