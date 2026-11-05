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
pnpm data:build     # 面板规则 → 全部已登记代理人 → 图鉴 → 敌人
pnpm assets:sync    # 下载/转码图片 → public/assets/media + manifest
pnpm assets:check   # 离线校验
```

- 新增/修改代理人走 `.agents/skills/zzz-agent-builder` 的完整流程。
- `data/`、`src/data/`、`public/assets/media/` 是生成物；人工只编辑 `data/guides/*.toml` 与 `data/rules/*.toml`。

## 3. 部署

静态部署，无运行时后端；只有构建期可选变量 `VITE_BASE`（默认 `/`）。构建产物在 `dist/`。

- **Cloudflare Pages**：构建命令 `pnpm build`，输出目录 `dist`。
  - `public/_headers`：资产长缓存、`index.html` 不缓存、`nosniff`。
  - `public/_redirects`：`/* → /index.html 200` SPA 回退。
- **GitHub Pages（项目页）**：`.github/workflows/deploy.yml` 已配好。
  - 仓库 Settings → Pages → Source 选 **GitHub Actions**；push `master` 或手动 `workflow_dispatch` 触发。
  - 访问地址 `https://<user>.github.io/<repo>/`；CI 注入 `VITE_BASE=/${{ github.event.repository.name }}/`，`createWebHistory`、图片、字体都挂在该子路径下。
  - 深链（`/agents/phoenix`、`/engines/ep-211`）：构建时把 `index.html` 复制成 `404.html`，Pages 对未知路径返回它，前端路由按 `location.pathname` 渲染。代价是该响应 HTTP 状态是 404（Pages 不支持 rewrite）；要 200 深链请用 Cloudflare Pages 或自定义域名 + 反向代理。
  - 本地验证子路径：`VITE_BASE=/<repo>/ pnpm build`，再 `VITE_BASE=/<repo>/ pnpm preview` 打开 `http://localhost:4173/<repo>/`。
  - 仓库必须是 public（或账号支持私有 Pages）；默认分支若不是 `master`，改 workflow 的 `on.push.branches`。
- 也可部署到任意静态托管（Netlify / Vercel / Nginx），直接上传 `dist/`；根路径部署无需设置 `VITE_BASE`。
- 缓存约定：`index.html` no-cache；hash 资源与 `/assets/`、`/fonts/` immutable。
- `public/sitemap.xml` 已指向 `https://telmass.github.io/ZenlessSolution/`；换账号 / 仓库名 / 自定义域名时同步修改这 6 条 `<loc>`。

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
