# Changelog

按日期记录，最新在上。提交信息遵循 `feat|fix|data|docs|refactor|test(scope): 摘要`。

## 2026-11-05

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
