# ZenlessSolution

绝区零（Zenless Zone Zero）**官方图鉴复刻 + 代理人攻略 + 面板/配置对比**。

> 当前：**菲欧妮（Phoenix）先行复刻**。重建计划 [docs/00-rebuild-plan.md](docs/00-rebuild-plan.md) · 面板规则 [docs/02-panel-rules.md](docs/02-panel-rules.md) · 图鉴说明 [docs/04-codex.md](docs/04-codex.md)。

## 当前进度

| 模块 | 状态 |
| --- | --- |
| 单页档案流：概览 → 技能 → 影画 → 攻略 → 配装，章节锚点导航 | ✅ |
| 菲欧妮 · 概览（档案、60 级面板、核心技 A–F） | ✅ |
| 菲欧妮 · 技能（6 类全展开 / 18 招式手风琴 / 1–16 级成长） | ✅ |
| 菲欧妮 · 影画（L1–L6 时间轴，关键影画 1 / 6，film 图标） | ✅ |
| 菲欧妮 · 攻略（加点、音擎、驱动盘、毕业面板、队伍、文字攻略） | ✅ |
| 代理人图鉴（61 位全量 / 菲欧妮已开放，其余施工中 / 属性·职业·评级·阵营筛选） | ✅ |
| 音擎图鉴（101 把 / 精炼 1–5 / 筛选） | ✅ |
| 驱动盘图鉴（30 套 / 2·4 件套 / 主词条池） | ✅ |
| 邦布图鉴（42 只 / 基础属性 / 41 只中文档案与技能） | ✅ |
| 局外面板计算器（核心 / 音擎 / 4+2 / 主副词条 / 来源明细） | ✅ |
| 本地 WebP 资产（182 个媒体键，1.70 MiB）与自托管展示字体 | ✅ |
| 有效词条（41 有效 + 12 小 + 1 无效 / 含穿透 / 预算提示） | ✅ |
| 20s 伤害参考轴、单次异放、0+1 / 2+1 / 4+1 / 6+1 对比 | ✅ |
| 发布打磨（M7：空状态 / a11y / SEO / 部署） | ⏳ 下一步 |
| 其余 60 位代理人档案 | ⏳ 施工中（图鉴条目已收录） |

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # Vitest：面板 / 词条 / 伤害 / 图鉴 / 页面结构（30 条）
pnpm build      # 静态产物 dist/
pnpm preview
```

要求 Node.js ≥ 20；数据脚本需要 Python 3.11+ 与 Pillow。

## 页面与深链

- `/agents`：代理人图鉴全量名单（61 位），支持属性 / 职业 / 评级 / 阵营 / 开放状态筛选与搜索；仅菲欧妮条目可进入档案。
- `/agents/phoenix`：整页连续阅读，顶部章节导航只负责跳转，不再用 Tab 隐藏内容。
- 章节锚点：`#overview`、`#skills`、`#cinemas`、`#guide`、`#build`、`#damage`；影画子锚点 `#cinema-1..6` 仍可用。
- 旧链接 `?tab=skills|cinemas|guide|build|damage` 会自动改写为对应 hash，不刷新页面。
- `#skills` 默认展开「普通攻击：裁生」；其余招式点击行内展开，全等级表可切换。

## 数据与资产

```bash
pnpm data:build    # data/ → agent / codex / panel / enemies 与媒体清单
pnpm data:check    # 数据契约校验（技能 / 影画 / 毕业 spec / 图鉴 / 敌人）
pnpm assets:sync   # 下载源图 → 本地 WebP → src/data/media-manifest.json
pnpm assets:check  # 离线校验：清单 ↔ 文件 ↔ 数据引用、预算、孤儿文件
pnpm verify        # data:check + assets:check + test + typecheck + build
```

- `data/sources/`：抓取快照与目录子集（phoenix / agents / agents-index / engines / engine-icons / drive-sets / bangboo）。
- `data/guides/phoenix.toml`：攻略人工编辑的唯一源。
- `data/rules/panel.toml`：主副词条、二件套、驱动盘固定值的规则表。
- `data/rules/enemies.toml`：伤害页的敌人预设（标准 / 弱点 / 失衡 / 高抗）。
- `src/data/`：生成物（agent / codex / panel / enemies / media manifest），勿手改；`src/data/agents/index.json` 由 `data/sources/agents-index.json` 生成，是 61 人名单与开放状态登记表。
- `src/data/codex/`：音擎 101、驱动盘 30、邦布 42 的列表与详情 JSON。
- `public/assets/media/`：本地 WebP（内容 hash 命名）；`public/fonts/`：Barlow Condensed（OFL）。
- `.cache/assets/originals/`：原图缓存，不入库。

## 目录结构

```text
src/
├─ pages/          首页 / 代理人 / 音擎 / 驱动盘 / 邦布
├─ components/     Hero、章节导航、概览、技能、影画、攻略、配装、伤害
├─ composables/    useSectionSpy（章节滚动高亮）
├─ constants/      sections（章节清单与旧 tab 映射）
├─ core/panel/     纯 TS 面板引擎
├─ core/substats/  有效词条计数
├─ core/damage/    乘区、20s 轴、单次异放
├─ core/skills/    招式预览提取
├─ data/           生成的 JSON（agent / codex / panel / enemies / media manifest）
├─ lib/            media 解析
├─ styles/         fonts / tokens / base / codex
└─ types/          数据契约
tools/
├─ import_phoenix.py   抓取快照 + 攻略 TOML → 图鉴数据
├─ import_codex.py     音擎 / 驱动盘 / 邦布 → codex JSON + 媒体键
├─ import_enemies.py   敌人预设 → enemies.json
├─ import_panel.py     规则表 + 目录子集 → panel.json
├─ sync_assets.py      图片下载 + WebP 转码 + manifest
├─ check_data.py       数据契约校验
└─ check_assets.py     资产校验
tests/
├─ panel.spec.ts           面板引擎与旧计算器对拍
├─ skills-preview.spec.ts  招式 12 级预览
├─ codex.spec.ts           图鉴数量 / id / 图标键
├─ substats.spec.ts        41+12+1 / 含穿透 / 预算
├─ damage.spec.ts          异放 oracle / 灼蚀阈值 / 20s 轴
├─ agents-index.spec.ts    61 人名单与开放状态
└─ agent-sections.spec.ts  六章节同时渲染 / 深链映射
docs/
├─ 00-rebuild-plan.md        重建计划
├─ 02-panel-rules.md         局外面板计算规则
├─ 03-agent-page-redesign.md 单页档案流与视觉系统
├─ 04-codex.md               音擎 / 驱动盘 / 邦布图鉴数据与页面
├─ 05-substats.md            有效词条 41+12+1 口径与页面
└─ 06-damage.md              20s 参考轴、伤害乘区与 0+1 对比
```

## 数据来源

- 官方 WIKI：<https://baike.mihoyo.com/zzz/wiki/content/2216/detail>
- 官方玩法合集：<https://baike.mihoyo.com/zzz/wiki/channel/map/66/68>
- 三方素材（立绘 / 背景 / film 图标）：<https://zzz.nanoka.cc/>、<https://zzz.gachabase.net/>

> 非商业资料整理；游戏素材版权归 miHoYo 所有。


