# 代理人页重构：单页档案流 + 章节导航

日期：2026-11-04
范围：`/agents/phoenix` 的页面结构、视觉系统与阅读路径；数据与计算逻辑未改。

## 1. Design Read

```yaml
artifact: 角色档案 / 攻略 / 配装计算器（长文参考页）
audience: 桌面端为主、移动端查阅的绝区零玩家
visual-language: 工业编辑风档案（Industrial Editorial Dossier）
  窄体海报字、发丝线账本、危险黄强调、火橙角色色
mode: redesign-preserve
visual-variance: 6
motion-intensity: 3
information-density: 8
asset-dependence: 7
brand-fidelity: 8
```

## 2. Before / After

| | Before | After |
| --- | --- | --- |
| 阅读路径 | 5 个页面级 Tab，一次只能看一块 | 5 个章节连续滚动，顶部锚点导航 |
| 导航 | Tab 切换会替换内容 | 锚点只滚动/定位，不隐藏内容 |
| 深链 | `?tab=skills` | `#skills`；旧 `?tab=` 自动改写 |
| 排版 | 卡片 + 左描边 + 英文微标签 | 发丝线账本、章节数字、少量真实元信息 |
| 技能 | 分类 rail + 招式按钮 + 单详情 | 6 类全部展开、逐行手风琴详情 |
| 影画 | 6 张卡片 | 纵向胶片时间轴 L1–L6 |
| 字体 | Bahnschrift（仅 Windows） | 自托管 Barlow Condensed 600/700 + 中文回退 |

## 3. 章节与锚点

| 顺序 | id | 内容 |
| --- | --- | --- |
| 01 | `overview` | 档案、60 级基础面板、核心技 A–F |
| 02 | `skills` | 6 类 18 招式，默认展开「普通攻击：裁生」 |
| 03 | `cinemas` | L1–L6 时间轴；`#cinema-1..6` 保留 |
| 04 | `guide` | 加点、音擎、驱动盘、毕业面板、队伍、文字攻略、来源 |
| 05 | `build` | 局外面板计算器（预设 / 表单 / sticky 结果） |

- 章节导航 `SectionNav` 固定在 header 下：桌面 52px、移动 48px；底部 1px 阅读进度线在顶部边缘，避免与 active 下划线冲突。
- 点击导航用 `window.scrollTo`，落点 = 章节顶 −（header + nav + 16）；**不使用 `scrollIntoView`**。
- `useSectionSpy` 用 `IntersectionObserver`（`-132px 0px -52% 0px`）维护 active；程序化滚动时锁 1200ms，避免高亮抖动。
- 直接打开 `#build` 时，先按当前布局对齐，再在 `fonts.ready`、`load` 与 200/600/1200ms 复对齐；用户一旦滚动/按键即停止复对齐。
- 旧 `?tab=overview|skills|cinemas|guide|build` 会改写为对应 hash，不刷新页面。

## 4. 视觉系统变更

- 色板：`#070709` 底、`#101015` 面、`#23232c` 发丝线、`#f3f1ea` 正文、`#8f8c82` 次要、`#f0df4e` 品牌、`#ff6a3d` 角色元素色。
- 字体：Barlow Condensed 600/700（Latin/数字）+ Noto Sans SC（中文），全局 ≤ 2 族；`public/fonts/` 自托管，OFL 许可。
- 字号：12/14/16/18/22/28/36/52/72（九档；>2026-11-05 由 11/12/13/15/16/18/22/28/36/52 迁移，见 [`07-ui-system.md`](07-ui-system.md)）；正文 16px / 1.75；正文行宽 34em。
- 宽度：内容容器 1240 → **1400px**，减少宽屏两侧空带；详情页 1080px；章节 padding 80 → **64px**（移动 40px）。
- 间距：4px 基准；章节 padding 64（移动 40），章节间距 64。
- 形状：结构面 0 圆角、控件 2px、头像圆形；移除卡片 12px 圆角与大面积阴影。
- 去掉了 `PROFILE / KEY CINEMA / PRIORITY / W-ENGINE / REFERENCE PANEL` 等装饰性英文微标签，只保留 `Lv.60`、`54 词条`、`精 1` 这类真实元信息。

## 5. 组件改动

| 文件 | 变更 |
| --- | --- |
| `pages/AgentPage.vue` | 删除 tab 状态；五 section 常驻；hash/legacy 对齐；skip link；back-to-top |
| `components/SectionNav.vue` | 新增：锚点导航、active 下划线、阅读进度、移动端自动居中 |
| `composables/useSectionSpy.ts` | 新增：IntersectionObserver + 程序化滚动锁 |
| `constants/sections.ts` | 新增：章节清单、旧 tab 映射、`resolveSection` |
| `components/ChapterHead.vue` | 新增：章节数字 + 标题 + 导语；无英文微标签 |
| `components/AgentHero.vue` | 删除重复 meta；增加攻略/配装锚点；降低高度 |
| `components/OverviewSection.vue` | 去卡片：档案定义表 + 面板账本 + 核心机制块 |
| `components/SkillsSection.vue` | 重写：6 类全展开 + 单招式手风琴 + 12 级预览；≥1200px 时说明与成长表两栏 |
| `core/skills/preview.ts` | 新增：从成长表提取 12 级伤害/失衡/段数 |
| `components/CinemasSection.vue` | 重写：纵向时间轴 + 右侧影画故事栏；保留 `cinema-N` |
| `components/GuideSection.vue` | 去卡片/去内部编号；音擎推荐改 2×2 规格格，长文/表格填满宽度 |
| `components/PanelSection.vue` | 4 张表单卡改为分组发丝线；结果面板 sticky 偏移更新 |
| `styles/tokens.css` / `base.css` / `fonts.css` | 新 token、章节壳、字体、reduced-motion |

## 6. 可访问性与响应式

- `main#content` 可聚焦；章节导航 `aria-label="章节"`、`aria-current="location"`。
- 手风琴按钮 `aria-expanded` / `aria-controls`；影画故事使用原生 `<details>`。
- `prefers-reduced-motion` 关闭平滑滚动与过渡。
- 断点：1160 / 1080 / 980 / 900 / 820 / 760 / 640 / 460；移动端导航横向滚动，页面无横向溢出（390px 实测 `scrollWidth = 390`）。字号与触控约束见 [`07-ui-system.md`](07-ui-system.md)。

## 7. 验证

- `tests/agent-sections.spec.ts`：五 section 同时存在、页面级无 `role=tablist`、`?tab`/hash 映射。
- `tests/skills-preview.spec.ts`：12 级首行倍率、段数、无表返回空。
- `tests/panel.spec.ts`：既有 5 条面板对拍（2538.1 / 510 / 255.4）。
- `pnpm verify` 通过；1440 与 390 截图检查：无 Tab、无横向溢出、锚点落点 133px（导航下沿 116 + 16）。
- 已知取舍：整页较长；远距离章节跳转使用平滑滚动；移动端右下角“回到顶部”会覆盖少量内容，可接受。
