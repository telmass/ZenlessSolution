import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * GitHub Pages 没有 SPA rewrite：把 index.html 复制成 404.html，
 * 深链（/agents/phoenix、/engines/ep-211）才会落到应用壳，再由前端路由按
 * location.pathname 渲染。其它静态托管（Cloudflare Pages）继续用 _redirects。
 */
function spaFallback404(): Plugin {
  let outDir = ''
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = join(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, join(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  // GitHub Pages 项目页由 CI 注入 /<repo>/；本地开发与根路径部署保持 /。
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue(), spaFallback404()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '.agents/**', '.cache/**'],
  },
})
