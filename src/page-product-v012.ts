// @ts-nocheck
// product-v012.html: 목록 · 등록 한 파일 관리 (src/unify.ts). 목록 = src/product-list.ts, 등록 = src/product-create2.ts
import { unify, editByEditOrNew } from "./unify";
unify({ isEdit: editByEditOrNew, edit: () => import("./product-create2"), list: () => import("./product-list") });
