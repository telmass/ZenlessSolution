# ZenlessSolution

绝区零（Zenless Zone Zero）**官方图鉴复刻 + 代理人攻略 + 面板/配置对比**。

> 当前：**菲欧妮（Phoenix）先行复刻**。重建计划见 [docs/00-rebuild-plan.md](docs/00-rebuild-plan.md)。

## 当前进度

| 模块 | 状态 |
| --- | --- |
| 站点骨架 / 设计令牌 / 响应式布局 | ✅ |
| 菲欧妮 · 概览（档案、60 级面板、核心技 A–F、关键影画） | ✅ |
| 菲欧妮 · 技能（6 类 / 18 招式 / 1–16 级成长 / 全等级表） | ✅ |
| 菲欧妮 · 影画（1–6，关键影画 1 / 6） | ✅ |
| 菲欧妮 · 攻略（加点、音擎、驱动盘、毕业面板、队伍、文字攻略） | ✅ |
| 本地 WebP 资产（18 个媒体键，0.56 MiB） | ✅ |
| 面板计算器（任意代理人） | ⏳ 下一步 |
| 有效词条 / 0+1 配置对比 / 伤害引擎 | ⏳ 计划中 |
| 其余 60 位代理人与音擎 / 驱动盘 / 邦布图鉴 | ⏳ 计划中 |

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 静态产物 dist/
pnpm preview
```

要求 Node.js ≥ 20；数据脚本需要 Python 3.11+ 与 Pillow。

## 数据与资产

```bash
pnpm data:build    # 从旧项目抓取产物生成 src/data/agents/phoenix.json + media.json
pnpm assets:sync   # 下载源图 → 本地 WebP → src/data/media-manifest.json
pnpm assets:check  # 离线校验：清单 ↔ 文件 ↔ 数据引用、预算、孤儿文件
```

- `src/data/agents/phoenix.json`：生成物，勿手改。
- `public/assets/media/`：本地 WebP（内容 hash 命名），随站点发布。
- `.cache/assets/originals/`：原图缓存，不入库。

## 目录结构

```text
src/
├─ pages/          首页 / 代理人列表 / 代理人详情
├─ components/     Hero、技能、影画、攻略、成长表、富文本
├─ data/           生成的 JSON（agent / media manifest）
├─ lib/            media 解析
├─ styles/         tokens.css / base.css
└─ types/          数据契约
tools/
├─ import_phoenix.py   旧项目 → 新数据契约
├─ sync_assets.py      图片下载 + WebP 转码 + manifest
└─ check_assets.py     资产校验
docs/
└─ 00-rebuild-plan.md  重建计划
```

## 数据来源

- 官方 WIKI：<https://baike.mihoyo.com/zzz/wiki/content/2216/detail>
- 官方玩法合集：<https://baike.mihoyo.com/zzz/wiki/channel/map/66/68>
- 三方素材（立绘/背景）：<https://zzz.nanoka.cc/>、<https://zzz.gachabase.net/>

> 非商业资料整理；游戏素材版权归 miHoYo 所有。
