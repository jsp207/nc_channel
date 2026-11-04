import { defineConfig, type Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// 외부 검토용 단일 HTML 내보내기: npm run export:corner-group
// 서버 로그인 없이 열리도록 ./auth를 auth-export.ts로 바꾸고, 빌드된 JS·CSS를 HTML 안에 넣는다.
const page = 'order-corner-group-v22.html';

function inlineAssets(): Plugin {
  return {
    name: 'inline-assets',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle[page];
      if (!html || html.type !== 'asset') return;
      let src = String(html.source);
      for (const [name, item] of Object.entries(bundle)) {
        if (item.type === 'chunk') {
          const tag = new RegExp(`<script type="module" crossorigin src="[^"]*${name}"></script>`);
          src = src.replace(tag, () => `<script type="module">\n${item.code}</script>`);
          delete bundle[name];
        } else if (name.endsWith('.css')) {
          const tag = new RegExp(`<link rel="stylesheet" crossorigin href="[^"]*${name}">`);
          src = src.replace(tag, () => `<style>\n${item.source}</style>`);
          delete bundle[name];
        }
      }
      html.source = src;
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), inlineAssets()],
  resolve: {
    alias: [{ find: /^\.\/auth$/, replacement: fileURLToPath(new URL('./src/auth-export.ts', import.meta.url)) }],
  },
  build: {
    outDir: 'export',
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: { orderCornerGroupV22: page } },
  },
});
