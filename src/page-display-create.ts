// @ts-nocheck
// display-create.html: 목록 · 등록 한 파일 관리 (src/unify.ts). 목록 = src/main.ts, 등록 = src/main.ts
import { unify, editByNew } from "./unify";
unify({ isEdit: editByNew, edit: () => import("./main"), list: () => import("./main") });
