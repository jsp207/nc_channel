// @ts-nocheck
// product-v013.html: 목록 · 등록 한 파일 관리 (src/unify.ts). 목록 = src/product-list.ts, 등록 = src/product-create3.ts
import { unify, editByEditOrNew } from "./unify";
unify({ isEdit: editByEditOrNew, edit: () => import("./product-create3"), list: () => import("./product-list") });
