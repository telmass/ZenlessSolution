# Changelog

按日期记录，最新在上。提交信息遵循 `feat|fix|data|docs|refactor|test(scope): 摘要`。

## 2026-11-05

### GitHub Pages 部署

- 新增 `.github/workflows/deploy.yml`：push `master` → `pnpm build` → GitHub Pages（项目页子路径）。
- `vite.config.ts` 支持 `VITE_BASE`（默认 `/`）；`createWebHistory(import.meta.env.BASE_URL)` 与 `src/lib/url.ts` 让图片 / 字体 / 技能图标跟随 base，修复子路径部署 404。
- 构建时把 `index.html` 复制为 `404.html`，GitHub Pages 深链回退到 SPA。
- 新增 `tests/url.spec.ts` 覆盖 base 拼接与重复前缀。
- `public/sitemap.xml` 的 6 条 `<loc>` 改为 `https://telmass.github.io/ZenlessSolution/`。

### 异常代理人全量接入（13 / 13）

- 新增 12 位异常代理人档案：薇薇安、爱丽丝、格莉丝、爱芮、普罗米娅、维琳娜、蕾米埃尔、简、柏妮思、月城柳、星见雅、派派；图鉴开放 13 / 61。
- 数据管线从「单角色 import_phoenix」改为「`tools/import_agents.py` 按源清单批量生成」：`data/sources/<slug>.json` + `data/guides/<slug>.toml` → `src/data/agents/<slug>.json`，索引与媒体清单同源生成。
- 面板引擎支持全部核心技加成字段（异常掌控 / 基础攻击 / 异常精通 / 基础能量回复）；音擎与驱动盘候选改为按攻略引用集合生成，配装页按当前代理人的推荐列表过滤。
- 毕业面板改为按 spec 实时实算后展示（攻击 / 异常精通 / 异常掌控），旧 TOML 的 `totals` 只作审计留痕；攻略卡同步实算。
- 详情页按 slug 动态加载，无伤害模型的代理人自动隐藏「06 伤害」章节；新增元素图标（以太 / 电 / 冰 / 风 / 烈霜 / 流明 / 玄墨 / 凛刃）与 A 级徽章。
- 迁移脚本 `tools/migrate_anomaly_agents.py` 记录全部显式修复：`graduationPanelAlt.spec` 重建、4/2 件套同套纠正、旧口径说明更正、「影画要点」补齐。
- 格莉丝与派派的旧攻略是叶瞬光模板的复制件（音擎 / 队伍 / 文字全部错位），已整体重写并标记 `authored = true`，迁移脚本不再覆盖；同时修正薇薇安 / 柏妮思 / 月城柳关于二件套「未建模」的过期说明。
- 校验与测试：数据契约、资产清单、面板/毕业面板对拍全部按 13 位代理人遍历；新增 `tests/graduation.spec.ts`。

### M7 发布打磨

- 新增 404 页；`/:pathMatch(.*)*` 不再重定向到首页。
- 路由切换顶部进度条；渲染期错误捕获为可恢复占位。
- SEO：`index.html` OG/Twitter/Robots；每路由 `document.title`；动态详情页按实体名设置标题。
- a11y：全局跳正文链接、路由后焦点管理、主导航 `aria-current="page"`。
- 部署：Cloudflare Pages `_headers` / `_redirects`，`robots.txt`、`sitemap.xml`。
- 文档：`docs/05-operations.md`（抓取 / 校验 / 发布 / 回滚）。
- 沉淀构建代理人流程为 `.agents/skills/zzz-agent-builder`。

### 攻略卡导出

- 新增保存 / 复制攻略卡（Canvas 数据驱动 PNG）；浅色横版、左侧全身立绘、主词条备选。

### 伤害与对比（M6）

- 20s 参考轴、单次焚罪异放、0+1/2+1/4+1/6+1 对比与影画归因。
- 五把推荐音擎局内 effect 计入；局内百分比按最终面板相乘。

### 有效词条（M5）

- 41 有效 + 12 小 + 1 无效；含穿透开关；毕业卡实算。

## 2026-11-04

- 单页档案流重构、三类图鉴（音擎 / 驱动盘 / 邦布）、面板计算器、菲欧妮全量数据。
