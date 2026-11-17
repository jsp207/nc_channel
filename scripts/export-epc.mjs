// EPC 상품 조회 샘플 전체를 export/epc-products-sample.json · .csv로 내보낸다. 실행: npm run export:epc
// 화면의 [다운로드]와 같은 함수(src/epc-export.ts)를 써서, 조회 조건 없이 전체 목록을 담는다.
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const root = new URL('../', import.meta.url);
const { outputFiles } = await build({
  stdin: {
    contents: `import { PO } from './src/data/epc'; import { epcRow, epcExport, epcCsv } from './src/epc-export'; const rows = PO.map(epcRow); export default { doc: epcExport(rows), csv: epcCsv(rows) };`,
    resolveDir: fileURLToPath(root),
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'warning',
});
const { doc, csv } = (await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'))).default;
mkdirSync(new URL('export/', root), { recursive: true });
writeFileSync(new URL('export/epc-products-sample.json', root), JSON.stringify(doc, null, 2) + '\n');
writeFileSync(new URL('export/epc-products-sample.csv', root), '﻿' + csv); // BOM: 엑셀에서 한글이 깨지지 않게
console.log(`export/epc-products-sample.json · .csv: ${doc.products.length}건`);
