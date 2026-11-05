import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'

/** 应用里可直达的路由（列表页 + 已开放详情页），用于预生成静态入口。 */
function staticRoutes(root: string): string[] {
  const routes = new Set(['/agents', '/engines', '/drives', '/bangboo'])
  const read = (file: string): unknown => JSON.parse(readFileSync(join(root, file), 'utf8'))

  try {
    const agents = read('src/data/agents/index.json') as Array<{ slug: string; available?: boolean }>
    for (const agent of agents) if (agent.available) routes.add(`/agents/${agent.slug}`)

    const engines = read('src/data/codex/engines.index.json') as Array<{ id: string }>
    for (const engine of engines) routes.add(`/engines/${engine.id}`)

    const sets = read('src/data/codex/sets.index.json') as Array<{ id: string }>
    for (const set of sets) routes.add(`/drives/${set.id}`)

    const bangboo = read('src/data/codex/bangboo.index.json') as Array<{ slug: string }>
    for (const item of bangboo) routes.add(`/bangboo/${item.slug}`)
  } catch (error) {
    console.warn('[pages-static-export] 详情页数据不可用，跳过详情入口：', error)
  }

  return [...routes].filter((route) => /^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(route))
}

/**
 * GitHub Pages 没有 SPA rewrite：
 * - 每个已知路由写一份 index.html，深链（含详情页）直接返回 200；
 * - 未知路径才落到 404.html（内容仍是应用壳，前端渲染 404 页）。
 */
function pagesStaticExport(): Plugin {
  let root = ''
  let outDir = ''

  return {
    name: 'pages-static-export',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = join(outDir, 'index.html')
      if (!existsSync(index)) return

      copyFileSync(index, join(outDir, '404.html'))

      const html = readFileSync(index)
      let count = 0
      for (const route of staticRoutes(root)) {
        const dir = join(outDir, ...route.split('/').filter(Boolean))
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'index.html'), html)
        count += 1
      }
      console.log(`[pages-static-export] 已预生成 ${count} 条路由入口`)
    },
  }
}

export default defineConfig({
  // GitHub Pages 项目页由 CI 注入 /<repo>/；本地开发与根路径部署保持 /。
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue(), pagesStaticExport()],
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
