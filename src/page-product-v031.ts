// @ts-nocheck
// product-v031.html: 목록 · 등록 한 파일 관리 (src/unify.ts). 목록 = src/display-list2.ts, 등록 = src/display-create-v31.ts
import { unify, editByIdOrNew } from "./unify";
unify({ isEdit: editByIdOrNew, edit: () => import("./display-create-v31"), list: () => import("./display-list2") });
