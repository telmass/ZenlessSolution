# ZenlessSolution

绝区零（Zenless Zone Zero）**官方图鉴复刻 + 代理人攻略 + 面板/配置对比**。

> 当前：**菲欧妮（Phoenix）先行复刻**。重建计划见 [docs/00-rebuild-plan.md](docs/00-rebuild-plan.md)，面板规则见 [docs/02-panel-rules.md](docs/02-panel-rules.md)。

## 当前进度

| 模块 | 状态 |
| --- | --- |
| 站点骨架 / 设计令牌 / 响应式布局 | ✅ |
| 菲欧妮 · 概览（档案、60 级面板、核心技 A–F、关键影画） | ✅ |
| 菲欧妮 · 技能（6 类 / 18 招式 / 1–16 级成长 / 全等级表） | ✅ |
| 菲欧妮 · 影画（1–6，关键影画 1 / 6，film 图标） | ✅ |
| 菲欧妮 · 攻略（加点、音擎、驱动盘、毕业面板、队伍、文字攻略） | ✅ |
| 局外面板计算器（核心 / 音擎 / 4+2 / 主副词条 / 来源明细） | ✅ |
| 本地 WebP 资产（19 个媒体键，0.57 MiB） | ✅ |
| 有效词条 / 0+1 配置对比 / 伤害引擎 | ⏳ 下一步 |
| 其余 60 位代理人与音擎 / 驱动盘 / 邦布图鉴 | ⏳ 计划中 |

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # Vitest：面板引擎对拍
pnpm build      # 静态产物 dist/
pnpm preview
```

要求 Node.js ≥ 20；数据脚本需要 Python 3.11+ 与 Pillow。

## 数据与资产

```bash
pnpm data:build    # data/ → src/data/agents/phoenix.json + panel.json + media.json
pnpm data:check    # 数据契约校验（技能 / 影画 / 毕业 spec / 媒体引用）
pnpm assets:sync   # 下载源图 → 本地 WebP → src/data/media-manifest.json
pnpm assets:check  # 离线校验：清单 ↔ 文件 ↔ 数据引用、预算、孤儿文件
pnpm verify        # data:check + assets:check + test + typecheck + build
```

- `data/sources/`：抓取快照与目录子集（phoenix / agents / engines / drive-sets）。
- `data/guides/phoenix.toml`：攻略人工编辑的唯一源。
- `data/rules/panel.toml`：主副词条、二件套、驱动盘固定值的规则表。
- `src/data/`：生成物（agent / panel / media manifest），勿手改。
- `public/assets/media/`：本地 WebP（内容 hash 命名），随站点发布。
- `.cache/assets/originals/`：原图缓存，不入库。

## 目录结构

```text
src/
├─ pages/          首页 / 代理人列表 / 代理人详情
├─ components/     Hero、技能、影画、攻略、配装、成长表、富文本
├─ core/panel/     纯 TS 面板引擎（类型 / 数据 / 计算 / 毕业预设）
├─ data/           生成的 JSON（agent / panel / media manifest）
├─ lib/            media 解析
├─ styles/         tokens.css / base.css
└─ types/          数据契约
tools/
├─ import_phoenix.py   抓取快照 + 攻略 TOML → 图鉴数据
├─ import_panel.py     规则表 + 目录子集 → panel.json
├─ sync_assets.py      图片下载 + WebP 转码 + manifest
├─ check_data.py       数据契约校验
└─ check_assets.py     资产校验
tests/
└─ panel.spec.ts       面板引擎与旧计算器对拍
docs/
├─ 00-rebuild-plan.md  重建计划
└─ 02-panel-rules.md   局外面板计算规则
```

## 数据来源

- 官方 WIKI：<https://baike.mihoyo.com/zzz/wiki/content/2216/detail>
- 官方玩法合集：<https://baike.mihoyo.com/zzz/wiki/channel/map/66/68>
- 三方素材（立绘 / 背景 / film 图标）：<https://zzz.nanoka.cc/>、<https://zzz.gachabase.net/>

> 非商业资料整理；游戏素材版权归 miHoYo 所有。
