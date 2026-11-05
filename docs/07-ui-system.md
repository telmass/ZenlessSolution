# UI 与排版系统

日期：2026-11-05
范围：全站（首页、代理人档案流、三类图鉴列表与详情、共享壳）

本文件是 `docs/03-agent-page-redesign.md` 的补充：视觉方向（Industrial Editorial Dossier）不变，这里是可执行的 token 与排版约束。改 UI 前先读这里。

## 1. 方向

```yaml
visual-language: Industrial Editorial Dossier
audience: 桌面为主、移动端查阅的绝区零玩家
density: 8
motion: 3
brand-fidelity: 9
mode: redesign-preserve
```

保留：黑底、危险黄、火橙、Barlow Condensed 数字 + Noto Sans SC、发丝线账本、结构面 0 圆角、2 族字体、1400 容器。
不引入：新字体、浅色主题、Tailwind、组件库、额外依赖。

## 2. 字号：九档

唯一允许的字号集合（`src/styles/tokens.css`）：

| Token | 值 | 用途 |
| --- | --- | --- |
| `--fs-12` | 12px | 标签、元信息、表格表头、词条 tier |
| `--fs-14` | 14px | 密集 UI、表格正文、卡片标题（codex） |
| `--fs-16` | 16px | 正文、章节导语、卡片标题（agent） |
| `--fs-18` | 18px | 卡片/移动标题、结果值、面板值 |
| `--fs-22` | 22px | 块标题、详情 section、结果面板标题 |
| `--fs-28` | 28px | 二级标题、攻略角色定位、空状态标题 |
| `--fs-36` | 36px | 章节 H2、移动页 H1、章节序号 |
| `--fs-52` | 52px | 页面 H1、详情 H1、章节序号 |
| `--fs-72` | 72px | 首页展示级 H1 |

规则：

- **不再出现 <12px 的字号。** 旧 9/9.5/10/11px 全部并入 12。
- 不用 `em` 定义字号（`clamp()` 的端点也必须来自上表）。
- 大标题用 `clamp()` 时端点取上表 token，例如 `clamp(var(--fs-36), 4vw, var(--fs-52))`。
- 字重只用 400 / 500 / 600 / 700；Barlow Condensed 只加载 600/700，禁止 800 伪粗体。
- 行高：72→1.02、52→1.06/1.08、36→1.15、28→1.2、22→1.3、18→1.4、16→1.7（正文）/1.6（UI）、14→1.6、12→1.5。
- 中文标题 `letter-spacing: 0.01em`；全大写标签 0.14–0.18em；数字 `tabular-nums`。

## 3. 行宽

- `--measure: 34em`：正文段落（≈34 个汉字 / 68 个拉丁字符）。
- `--measure-wide: 40em`：说明性备注、表格式说明。
- 所有正文容器显式约束；`RichText` 继承字号，由容器决定 16/14，段落默认 `max-width: var(--measure)`。
- 详情页容器 `--maxw-detail: 1080px`；列表与档案页 `--maxw: 1400px`。

## 4. 颜色角色

| Token | 值 | 对 `--surface` 对比度 | 用途 |
| --- | --- | --- | --- |
| `--text` | `#f3f1ea` | 16.8:1 | 主文字 |
| `--text-2` | `#c3c0b6` | 10.4:1 | 次文字 |
| `--muted` | `#8f8c82` | 5.6:1 | 第三级/标签 |
| `--accent` | `#f0df4e` | 13.9:1 | 品牌强调、链接 |
| `--fire` | `#ff6a3d` | 6.7:1 | 火元素语义 |
| `--danger` | `#ff5a5f` | 6.2:1 | 错误/超预算 |
| `--info` | `#8fb7ff` | 9.4:1 | 小词条等语义 |
| `--text-disabled` | `#6f6c64` | 3.6:1 | 仅禁用/装饰，不承载信息 |

- `--line-strong` 只做边框，**绝不做文字**。
- 控件边框用 `--line-control: #646472`（对 surface-2 3.12:1），满足 WCAG 1.4.11；装饰发丝线仍用 `--line` / `--line-strong`。
- 不再硬编码 `#77746c` / `#3a3a45` 作为文字颜色。

## 5. 间距、形状、动效

- 4px 基准；章节 64（移动 40）；容器 gutter 24（移动 20）；卡片网格 gap 16（移动 12/10）。
- 结构面（卡片、面板、矩阵）圆角 0；控件（按钮、输入、chip、tag）2px；头像 50%。
- 不新增阴影层级；现有 `--shadow` / `--shadow-nav` 保留。
- 动效 140/200ms + `--ease-out`；所有 hover 位移在 `prefers-reduced-motion` 下关闭。

## 6. 响应式

| 断点 | 变化 |
| --- | --- |
| 1160 | 代理人网格 5→4 |
| 1080 | 配装结果改为单列；显示移动端关键面板吸顶摘要 |
| 980 | 概览双栏 → 单栏 |
| 900 | 章节导航/头部导航间距收紧；网格 4→3 |
| 760 | 代理人 3→2 列；筛选面板「更多筛选」折叠；配装表单单列 |
| 640 | codex 网格 2 列；详情 hero 堆叠；全局 gutter 20 |
| 460 | 代理人保持 2 列（不再退化为 1 列） |

移动端触控：主导航/章节导航 ≥44px；chip 44px；核心技 44px；等级按钮 40px；步进器 40px；页脚/面包屑/正文链接 44px。

## 7. 状态与语义

- 空状态统一 `.empty-state`（标题 + 说明 + 操作）；图鉴空状态提供「清除筛选」。
- 详情 404 提供返回图鉴入口。
- 筛选用 `aria-pressed`；面板摘要 `aria-label="关键面板"`；页面只保留一个 `<main>`。
- 不使用 `scrollIntoView`；锚点落点由 header + 章节导航 + 16px 计算。

## 8. 回归守卫

`tests/typography.spec.ts` 会扫描 `src/**/*.vue` 与 `src/styles/*.css`：

- 拒绝非九档的 `font-size`、<12px 字号、`--fs-11/13/15`；
- 拒绝 `color: var(--line-strong)` / `#77746c` / `#3a3a45`；
- 校验九个 token 都存在。

视觉验证：`pnpm typecheck && pnpm test && pnpm build`；浏览器 1440/1280/768/390 检查 `scrollWidth === clientWidth`、字号集合、正文 ≤40em、移动触控 ≥44px。
