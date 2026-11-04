# data

本目录是数据真源，`src/data/` 与 `public/assets/` 都是生成物。

| 路径 | 内容 | 维护方式 |
| --- | --- | --- |
| `sources/phoenix.json` | 官方 WIKI 代理人页抓取快照（技能、影画、档案、素材 URL） | 抓取脚本产物，人工不改 |
| `sources/agents.json` | 基础面板与核心技档位的目录子集 | 从旧目录抽取 |
| `sources/engines.json` | 音擎目录（101 把） | 从旧目录抽取 |
| `sources/engine-icons.json` | 音擎 id → 官方图标 URL | 从旧目录抽取 |
| `sources/drive-sets.json` | 驱动盘套装（30 套，含二件套效果 id） | 从旧目录抽取 |
| `sources/bangboo.json` | 邦布（42 只，中文名 / 代号 / 属性 / 图标） | 从 gachabase + 旧目录合并 |
| `sources/bangboo-wiki.json` | 邦布技能（主动/额外/连携）与中文档案（41 只） | `refresh_bangboo_wiki.py` 产物 |
| `guides/phoenix.toml` | 攻略人工编辑源（加点、音擎、驱动盘、队伍、文字、毕业 spec） | **人工维护** |
| `rules/panel.toml` | 面板规则（10 副词条、17 主词条、12 种二件套、固定值） | **人工维护** |
| `rules/enemies.toml` | 伤害页敌人预设（标准 / 弱点 / 失衡 / 高抗） | **人工维护** |

## 生成链路

```bash
python tools/import_phoenix.py   # data/ -> src/data/agents/phoenix.json + media.json
python tools/import_codex.py     # 音擎/驱动盘/邦布 -> src/data/codex + 媒体键
python tools/import_enemies.py   # rules/enemies.toml -> src/data/enemies.json
python tools/refresh_bangboo_wiki.py  # 官方 WIKI 邦布技能/中文档案（手动联网）
python tools/import_panel.py     # rules + sources -> src/data/panel.json
python tools/sync_assets.py      # media.json -> public/assets/media/*.webp + manifest
python tools/check_data.py       # 数据契约校验
python tools/check_assets.py     # 资产清单 / 引用 / 预算校验
```

约定：

- 不要手改 `src/data/`；改攻略只改 `guides/phoenix.toml`。
- 媒体键（`agent:phoenix:avatar` 等）由 `import_phoenix.py` 生成，图片由 `sync_assets.py` 本地化。
- 旧数据缺字段时在导入脚本里显式修复，并在输出 `repairs` 中留痕；禁止静默默认值。
