# 运维手册（抓取 / 校验 / 发布 / 回滚）

日期：2026-11-05

## 1. 日常校验

```bash
pnpm verify        # data:check + assets:check + test + typecheck + build
```

- `data:check`：代理人数/技能/影画/毕业 spec/图鉴数量/敌人预设/引用一致性。
- `assets:check`：媒体清单 ↔ 文件 ↔ 数据引用、单张与总量预算、孤儿文件。
- `test`：面板对拍、词条口径、伤害 oracle、图鉴、章节结构、排版守卫。
- `build`：`vue-tsc --noEmit` + `vite build`。

## 2. 数据更新

```bash
pnpm data:build     # 菲欧妮 + 图鉴 + 敌人 + 面板规则
pnpm assets:sync    # 下载/转码图片 → public/assets/media + manifest
pnpm assets:check   # 离线校验
```

- 新增/修改代理人走 `.agents/skills/zzz-agent-builder` 的完整流程。
- `data/`、`src/data/`、`public/assets/media/` 是生成物；人工只编辑 `data/guides/*.toml` 与 `data/rules/*.toml`。

## 3. 部署

静态部署，无后端、无环境变量。构建产物在 `dist/`。

- **Cloudflare Pages**：构建命令 `pnpm build`，输出目录 `dist`。
  - `public/_headers`：资产长缓存、`index.html` 不缓存、`nosniff`。
  - `public/_redirects`：`/* → /index.html 200` SPA 回退。
- 也可部署到任意静态托管（Netlify / Vercel / Nginx），直接上传 `dist/`。
- 缓存约定：`index.html` no-cache；hash 资源与 `/assets/`、`/fonts/` immutable。

## 4. 发布检查单

- [ ] `pnpm verify` 全绿
- [ ] `pnpm preview` 抽查：首页 / 代理人 / 音擎 / 驱动盘 / 邦布 / 404
- [ ] 移动端 390px 无横向溢出；`#damage`、`#guide`、`?tab=` 深链定位正确
- [ ] 无 console error；导航 aria-current 正确；键盘可跳正文
- [ ] `docs/changelog.md` 已更新

## 5. 回滚

- 静态回滚 = 重新发布上一个 commit 的 `dist/`，或回退 git commit 后重新构建。
- 图片回滚：内容 hash 命名保证新旧共存；`assets:prune` 之后再清理孤儿文件。

## 6. 已知边界

- 部署域名以实际 Pages 项目为准；`public/sitemap.xml` 中的域名需要按项目替换。
- 抓取脚本依赖外网；`data/`、`src/data/`、`public/assets/` 已入库，构建与部署不再依赖外网。
