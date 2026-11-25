// @ts-nocheck
// product-v011.html: 목록 · 등록 한 파일 관리 (src/unify.ts). 목록 = src/product-list.ts, 등록 = src/product-create.ts
import { unify, editByEditOrNew } from "./unify";
unify({ isEdit: editByEditOrNew, edit: () => import("./product-create"), list: () => import("./product-list") });
