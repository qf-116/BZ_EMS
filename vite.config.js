import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' + singlefile：构建产物 dist/index.html 内联全部 JS/CSS，
// 可直接双击用浏览器打开（file:// 协议），无需启动服务器。
// stripDevRedirect：构建时剥离 dev.html 中仅用于开发入口的 file:// 跳转脚本，
// 否则 dist/index.html 会带着该脚本跳回自身形成死循环。
function stripDevRedirect() {
  return {
    name: 'strip-dev-redirect',
    transformIndexHtml(html) {
      return html.replace(/<!--file-redirect-start-->[\s\S]*?<!--file-redirect-end-->/, '');
    },
  };
}

// emitAsIndexName：Vite 的 HTML 产物名跟随入口文件名（dev.html → dist/dev.html），
// 在构建收尾时把产物重命名回 index.html，保证交付文件名始终是 dist/index.html。
function emitAsIndexName() {
  return {
    name: 'emit-as-index-html',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url));
      const from = path.join(dist, 'dev.html');
      const to = path.join(dist, 'index.html');
      if (fs.existsSync(from)) fs.renameSync(from, to);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile(), stripDevRedirect(), emitAsIndexName()],
  // 开发入口为 dev.html（已从 index.html 改名，避免与交付产物 dist/index.html 混淆）；
  // 构建入口指向 dev.html，构建后由 emitAsIndexName 重命名，产物仍为 dist/index.html。
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL('./dev.html', import.meta.url)),
    },
  },
  server: {
    open: '/dev.html',
  },
});
