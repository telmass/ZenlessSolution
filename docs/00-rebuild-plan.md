# ZenlessSolution 重建计划

> **版本**：v1.0 · 2026-11-04
> **状态**：方案已确认（D1 纯静态 / D3 基准 0+1 / D4 轴 + 单点卡 / D7 本地 WebP），待启动实现
> **实现进度**（2026-11-05）：M0 骨架、M1 菲欧妮数据与本地资产、M2 代理人档案/技能/影画/攻略、M3 局外面板计算器、M5 有效词条、M6 伤害与 0+1 对比、单页档案流、三类图鉴、攻略卡导出、M7 发布打磨（404/加载/错误/a11y/SEO/部署/运维文档）均已落地；构建代理人流程沉淀为 `.agents/skills/zzz-agent-builder`。下一步：批量接入其余 60 位代理人。
> **范围**：官方图鉴复刻 + 代理人攻略 + 菲欧妮（phoenix）配置对比
> **原则**：一个数据源、一套计算核心、一个前端；先窄后深，先正确后完整。

---

## 0. 执行摘要

- **建什么**：一个静态的「绝区零官方图鉴 + 代理人攻略」站；v1 只把菲欧妮的攻略与配置对比做深，其余 60 人先有图鉴与面板。
- **怎么建**：`data/`（抓取快照 + 人工 TOML）→ Python 校验/生成为只读 JSON → Vue 3 静态站；`core/` 用纯 TS 统一承担面板、词条、伤害，前端只渲染。
- **关键取舍**：砍掉后端、账号、优化器、导入、全角色伤害；保留并强化三件旧项目真正有价值的东西——**全量图鉴数据、面板规则、攻略编辑契约**。
- **核心增量**：把开源①的「有效词条三层」与开源②的「乘区公式」合成一条可验证链路：`面板 → 词条口径 → 单次伤害 → 参考轴 → 配置对比`，并补上两家都没做的「灼蚀覆盖率 / 燔焰循环」假设。
- **工期**：约 25 人日（1 人 + AI 辅助，5 周）；关键路径 M1 数据 → M3 面板 → M5 词条 → M6 伤害。
- **先做哪三件事**：① 迁移四类图鉴数据并跑通校验；② 用旧项目 spec 复现菲欧妮面板；③ 用开源①的 oracle 复现单次异放 36,894.06。
- **已拍板**：D1 纯静态、D3 基准 0+1、D4 轴 + 单点卡、D7 图片本地化（WebP 为主，`full` 变体 AVIF）。

---

## 1. 背景与目标

### 1.1 旧项目要解决的问题

`C:\code\zzz-panelAndstrategy` 已经能跑通「面板计算 + 61 人攻略 + 三类图鉴」，但同时积累了明显的结构性问题（引自 `plan.txt`）：

| # | 问题 | 具体表现 |
| --- | --- | --- |
| 1 | 双端重复实现 | 面板公式同时存在于 Python `core/` 与前端 `usePanelCalc.ts`，靠对拍维持一致 |
| 2 | 数据形态混乱 | 抓取 JSON、人工 JSON、TOML、`_bundled_data.py` 并存，同一事实多处登记 |
| 3 | 布局/样式分散 | 攻略页、图鉴页、计算器各有一套卡片与间距，`strategy.css` 之外还有组件内样式 |
| 4 | 运行时太重 | FastAPI + Cloudflare Worker + 打包脚本，静态内容却依赖后端 |
| 5 | 编辑链路长 | 改攻略 TOML 需重启服务；毕业面板需脚本回写 |
| 6 | 范围膨胀 | 账号、导入、优化器、伤害引擎、部署审计等能力与「图鉴 + 攻略」主线混杂 |
| 7 | 历史包袱 | 旧原生计算器夹具、legacy 页面、多版本 schema 同时保留 |

### 1.2 新仓库的定位

`C:\code\ZenlessSolution` 不是旧项目的迁移，而是**按产品重新切分**：

- **官方图鉴**是主体：代理人 / 音擎 / 邦布 / 驱动盘，字段与官方 WIKI 对齐，可检索、可筛选、可深链。
- **攻略**是代理人详情页的一等公民，不是独立的一套页面模板。
- **计算**是攻略与图鉴的支撑能力：局外面板 → 有效词条 → 配置对比 → 单角色伤害估算。
- **数据与呈现分离**：所有事实来自 `data/`，`src/` 只消费编译产物；人工编辑只碰 TOML。

### 1.3 成功标准（v1 验收）

1. 四类图鉴均可浏览、搜索、筛选，字段与官方 WIKI 对得上（抽查 10 个条目）。
2. 菲欧妮详情页包含：基础面板、六个技能组与 1–16 级成长、六个影画、完整攻略、配装与对比。
3. 面板计算器对任意代理人可用，菲欧妮的毕业面板复现旧项目数值（攻击 2538.1 / 异常精通 510 / 异常掌控 255.4，误差 ≤ 0.05）。
4. 有效词条计数复现「41 有效 + 12 小词条 + 1 无效」，并支持含/不含穿透值两种口径。
5. 伤害对比能在同一参考轴下给出 0+1 / 1+1 / 2+1 / 6+1 等配置的总伤与相对差，且至少 3 个单点数值与开源实现逐位对齐。
6. 首屏无后端依赖；`pnpm build` 产出可直接静态托管；CI 全绿。
7. 图片全部本地化：页面无运行时外链图；仓库资产 ≤ 45 MB；首屏图片 ≤ 1.2 MB；`pnpm assets:check` 通过。

---

## 2. 范围

### 2.1 v1 必须做（Must）

| 模块 | 内容 |
| --- | --- |
| 图鉴·代理人 | 列表（元素/职业/评级/阵营筛选、搜索）+ 详情（档案、基础面板、技能、影画、核心技、额外能力、攻略入口） |
| 图鉴·音擎 | 列表 + 详情（基础攻击、副词条、精炼 1–5 特效、适配说明） |
| 图鉴·驱动盘 | 套装列表 + 详情（2/4 件套、主词条表、适配角色） |
| 图鉴·邦布 | 列表 + 详情（技能、适配队伍） |
| 攻略·菲欧妮 | 加点、音擎（含精炼）、驱动盘 4+2、主词条、副词条优先级、毕业面板、队伍、文字攻略、影画要点 |
| 计算·面板 | 通用/命破/锋御三模式；音擎、核心、驱动盘主副词条、4+2；逐项来源明细 |
| 计算·有效词条 | 词条步长、有效/小/无效口径、毕业 spec、预算 30/36/45/54 |
| 计算·伤害 | 仅菲欧妮：直伤、灼蚀 tick、火异常、异放、紊乱；事件表 + 参考轴 |
| 对比 | 影画 0–6 × 精炼 1–5 × 音擎 × 词条预算的预设矩阵，表 + 增量归因 |
| 工程 | 数据校验 CLI、单元测试、CI、静态部署、文档 |

### 2.2 v1 明确不做（Won't）

- 账号系统、云存档、Enka/Scanner 导入、库存管理、优化器。
- 多语言（仅简中；数据结构预留 `locale` 字段）。
- 实时战斗模拟（能量、喧响值、失衡条、异常积蓄、逐帧动作）。
- 全角色伤害；除菲欧妮外只做面板。
- PNG 攻略图导出（v1 先保证页面；导出在 M7 之后评估）。
- 后台管理界面（编辑走 TOML + 校验脚本）。
- 运行时图片代理或自建 CDN（图片在构建期本地化为 WebP/AVIF，见 §6.4）。

### 2.3 后续版本（Later）

| 版本 | 内容 |
| --- | --- |
| v1.1 | 第二个角色伤害模型（验证引擎可扩展性）、攻略图导出、更多毕业预算 |
| v1.2 | 词条边际收益（每多 1 条词条的 ΔDPS）、音擎/驱动盘横向对比 |
| v2.0 | 全角色伤害模板化、队伍级伤害、版本环境 Buff |

---

## 3. 参考项目结论

### 3.1 开源项目 ①：`ZztIsolation/zzz_calculator`

**它是什么**：Vue 3 + 共享 `core/`（纯 JS）+ Node 服务；面板、伤害事件、优化器、账号/扫描器导入俱全。数据规模：`agents.json` 451 KB、`agent_skills.json` 598 KB、`combat_buffs.json` 281 KB、`w_engines.json` 303 KB。但注意它**只覆盖 20 名角色（可见 17）且没有邦布 catalog**——它是「计算器」，不是「全量图鉴」；全量数据仍以旧项目为准。

**必须学的：有效词条规则**（`webapp/src/utils/driveDiscSubstats.ts`）

- 每个副词条的「条数」= 存储值 ÷ S 级单条步长；必须接近整数（误差 ≤ 1e-6）、且 1–6 条，否则不认定。
- 代理人有一份 `importantSubStats` 白名单；只有白名单内的词条计入「有效」。
- 穿透值单独统计，输出 `total` / `withoutPenFlat` / `includesPenFlat` 三个口径。
- **最关键的工程约束**：`importantSubStats` / 有效词条数**只用于展示、高亮与选盘排序**，明令禁止进入伤害计算、优化器或任何权重（其回归契约 §288 原文如此）。把「有效词条数」当优化目标，会选出「词条多但伤害低」的配装。
- 真正的词条权重不是静态表，而是**边际伤害**：`Δ(轮转总伤害) / 1 个基础步长`，由 `analyzeDriveDiscStatDiffs` 现算；可进一步给出「去掉 A 换 B」的替换矩阵。
- 结论：**三层要分开——白名单（展示） / 条数（可验证） / 边际收益（伤害函数）**。v1 实现前两层，第三层放 v1.2，且只能由伤害引擎计算，不能手填权重。

**值得借鉴的其他设计**

| 设计 | 说明 | 本项目取舍 |
| --- | --- | --- |
| `core/` 纯函数、浏览器内计算 | 无服务端依赖，便于测试与静态部署 | ✅ 直接采用（TS 重写） |
| `skillRef` 事件模型 | 事件指向 `agentSkillId/categoryId/moveId/rowId`，倍率来自表 | ✅ 采用 |
| 异常/异放/紊乱/乱流独立结算类型 | `anomalySettlement` 概念清晰 | ✅ 采用（v1 只做前四类中的菲欧妮相关） |
| `anomalyReleaseProfiles` | 异放「来源/触发者」归属显式建模 | ✅ 采用菲欧妮两份 profile |
| 数据版本化 + 维护校验 | 结构化字段而非解析描述文本 | ✅ 采用校验，不做维护后台 |
| 优化器/账号/Enka/多云部署 | 规模大、与主线无关 | ❌ 不搬 |
| 单个 `calculator-core.js` 482 KB | 巨型文件，难维护 | ❌ 拆模块重写 |
| Buff 覆盖率为手填、非模拟 | 需大量人工维护 | ⚠️ v1 只做菲欧妮少量 Buff，显式写死假设 |

### 3.2 开源项目 ②：`Nie7bai/ZZZ-HP`

**它是什么**：Vue 3 前端 + Express + MySQL；以「配装方案 / 技能流程 / 伤害记录」为中心，根目录 `CALCULATOR_FORMULAS.md` 是完整公式核查表。数据侧 `zzz-hp-calculator-buffs.json` 约 9.6 MB。

**必须学的：乘区公式**（文档 §5–§7，与实现 `zzz-hp/src/utils/damageCalc.ts` 对应）

```text
基础伤害（攻击型） = 局内攻击
增伤区 = 1 + 增伤% / 100
暴击期望区 = 1 + clamp(暴击率,0,1) × clamp(暴伤,0,20)
穿透率 = clamp(穿透率%,0,95)
有效防御 = max(0, 敌防 × (1 - 无视防御 - 减防) × (1 - 穿透率) - 穿透值)
防御区 = 794 / (794 + 有效防御)
抗性区 = 1 - 敌方抗性 + 抗性穿透
失衡区 = 失衡 ? 1.5 + 失衡易伤 : 1 + 全局失衡易伤
异常基础 = 通用乘区 × 精通区(AP/100) × 等级区(1+(Lv-1)/59) × 非直伤易伤
异常伤害 = 异常基础 × 异常增伤 × 异常倍率 × 异常暴击区
异放伤害 = 异常基础 × (1 + 异放增伤 + 异常增伤) × 异放倍率 × 综合暴击区
紊乱/乱流 = 异常基础 × 增伤 × (基础倍率 + 有效持续时间 × 补偿倍率)
```

- 直伤与异常**共用防御/抗性/失衡区**，但暴击区与增伤区不同。
- 异放的暴击率/暴伤是「异常 + 异放」两套数值相加，不是取其一。
- 乱流有风属性参与限制；耀变绑定蕾米埃尔流程——v1 只做菲欧妮相关（直伤/异常/异放/紊乱），乱流/耀变不实现。

**能力边界（正是新项目的机会）**：后端零计算，全部在前端 `damageCalc.ts`；没有时间轴、能量/喧响、Buff 覆盖率与持续时间——触发型效果一律按 100% 常驻。菲欧妮的「灼蚀」在它的数据里被拍平成常驻暴击 Buff（暴击率 30 + 掌控转模、暴伤 25 + 15 + 25 + 40），灼蚀 DoT、燔焰/升变/枯荣与能量循环**完全没有建模**。因此它只能做「单次伤害/面板对比」，做不了「循环对比」；而菲欧妮的强弱恰恰取决于灼蚀覆盖与燔焰循环，这是我们要补的差异化能力。

**另一个必须记住的细节**：影画会抬高技能等级上限（3 影 → 14 级，5 影 → 16 级）。对比 0+1 与 1+1 时必须在两侧**固定技能等级**，否则把「技能 +2」重复计入影画收益。

**值得借鉴的其他设计**

| 设计 | 说明 | 本项目取舍 |
| --- | --- | --- |
| 公式文档与实现一一对应、可核查 | 每个乘区注明字段来源 | ✅ 文档 + 代码注释同源 |
| 双版本展示（暴击/不暴击） | 异常伤害给「期望 / 必暴 / 不暴」 | ✅ 单点卡片采用 |
| 技能流程（skill flow） | 把一套连招拆成有序事件 | ✅ 简化成「参考轴」 |
| MySQL + 后台维护 | 部署重、数据不可版本化 | ❌ 改为 JSON/TOML + Git |
| 9.6 MB 单体 Buff JSON | 难审查、难合并 | ❌ 按角色拆文件、只保留用到的 |
| 大量 OCR/截图识别 | 与主线无关 | ❌ 不做 |

### 3.3 旧项目 `zzz-panelAndstrategy`

**审计结论（独立复核）**：数据完整度 > 95%，61 名代理人（S 48 / A 13；通用 55 / 命破 5 / 锋御 1）、101 把音擎（S 48 / A 37 / B 16）、30 套驱动盘（18 套二件套可算，12 套 `effect2 = null` 属正常）、42 只邦布（`bb-` 前缀，描述为英文）；62 条 slug 映射中有 1 条未上线（severian）。计算核是真正的资产：用菲欧妮 spec 独立复算，满配 2538.05 / 510 / 255.36，与记录 2538.1 / 510 / 255.4 一致；非满配 2585.7 / 375 完全一致。

**同时发现三个必须在迁移时修掉的洞**：

1. `graduationPanelAlt.spec` 缺 `core` 字段，直接复算会得到异常掌控 194.88（应为 255.36）；旧渲染层不重算所以看不出来。
2. `calc_graduation_panel.py` 在缺参时回落到「叶瞬光默认值」并原样写回——这是旧项目最危险的约定，新项目**禁止任何静默默认值**。
3. `refresh_disc_presets.py` 仍会下载图片并把 `image` 写成不存在的 `/images/discs/*.webp`，且不产出 `effect2`；抓取脚本要当「待修代码」，不是已验证代码。

**可直接继承的资产**

| 资产 | 位置 | 用法 |
| --- | --- | --- |
| 61 代理人基础面板 + 核心技 A–F | `data/catalog/agents.json` | 迁移并补 `faction`、`skills`、`cinemas` |
| 101 音擎（基础/副词条/特效/精炼） | `data/catalog/weapons.json` | 规范化后迁移 |
| 30 套驱动盘（2/4 件套） | `data/catalog/drive-discs.json` | 迁移，补图标与主词条表 |
| 42 邦布 | `data/catalog/bangboo.json` | 迁移，补技能文本与图标 |
| 面板规则（含三模式） | `docs/design/calculation-rules.md` | 作为面板引擎的行为基准 |
| 菲欧妮抓取内容（技能 16 级成长、影画文本、立绘） | `strategy/phoenix/data/phoenix.json` | 迁移为图鉴数据 |
| 菲欧妮攻略（加点/音擎/驱动盘/队伍/文字/毕业 spec） | `strategy/phoenix/data/phoenix.strategy.toml` | 改写为 v3 schema |
| 官方 WIKI 抓取脚本 | `.github/skills/zzz-wiki-sync/scripts/` | 抽取为 `tools/zzzsync`，去 skill 化 |
| 设计令牌 | `frontend/src/assets/styles/tokens.css` | 重做为新视觉基线 |

**不要继承的**

- Python 与 TS 两套面板实现并存；新项目只保留 TS。
- `_bundled_data.py`、Worker 打包、`datasets.toml` 多级登记。
- 61 个攻略页共用一套巨型 `StrategyPage.vue` 的隐式契约；新项目用显式区块模型。
- 旧伤害引擎残留、`.kilo/.dev/.tmp`、legacy 夹具与多版本 schema。
- 需要重启才能生效的 TOML 链路。

### 3.4 数据源与可信度

| 来源 | 用途 | 可信度 | 备注 |
| --- | --- | --- | --- |
| `baike.mihoyo.com/zzz/wiki/...` | 四类图鉴主数据、技能/影画文本、玩法合集 | 官方 | Nuxt SPA，需走接口；见 §6.3 |
| `zzz.mihoyo.com/character` | 阵营、角色介绍、KV | 官方 | 作为阵营字段补充 |
| `zzz.nanoka.cc` | 立绘/影画特写/图标、前瞻内容 | 三方（高） | 资源 URL 稳定，适合补图 |
| `zzz.gachabase.net` | 前瞻角色/音擎、交叉校验 | 三方 | 用于「官方未公开」条目，UI 需标注 |
| 米游社玩法合集 | 攻略口径（定位/循环/配装） | 官方邀请作者 | 攻略文字的事实校对源 |

> 规则：**官方优先、三方补位、冲突留痕**。每条数据带 `sources[]`；三方内容在前端显示「前瞻/三方」标记。

---

## 4. 产品信息架构

### 4.1 路由表

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `/` | 首页 | 版本信息、四类图鉴入口、菲欧妮攻略推荐、最近更新 |
| `/agents` | 代理人图鉴 | 卡片网格；筛选：元素/职业/评级/阵营/版本；搜索 |
| `/agents/:slug` | 代理人详情 | 概览 / 技能 / 影画 / 攻略 / 配装 / 对比（Tab） |
| `/agents/:slug?tab=build` | 攻略·配装 | 深链 |
| `/agents/:slug?tab=compare` | 配置对比 | 深链，可带 `?cfg=1+1,2+1` |
| `/engines` | 音擎图鉴 | 筛选：评级/类型/副词条 |
| `/engines/:slug` | 音擎详情 | 精炼表、适配角色 |
| `/drives` | 驱动盘图鉴 | 套装卡片，2/4 件套摘要 |
| `/drives/:slug` | 驱动盘详情 | 4 件套、主词条、适配角色 |
| `/bangboo` | 邦布图鉴 | 筛选：评级/阵营 |
| `/bangboo/:slug` | 邦布详情 | 技能、适配队伍 |
| `/calculator` | 面板计算器 | 独立入口；代理人详情内嵌同一组件 |
| `/about` | 关于/数据来源 | 版本、抓取时间、免责声明 |

### 4.2 代理人详情页信息层级

```text
┌ Header：全身立绘（右侧渐隐） + 头像 + 名称/称号 + 阵营 + 元素/职业/评级徽章
│          + 版本/上线日期 + 「加入对比」按钮
├ Tabs：概览 | 技能 | 影画 | 攻略 | 配装 | 对比
│
├ 概览
│   ├ 档案（阵营、生日、身高、CV、简介、角色 TAG）
│   ├ 基础面板（60 级、核心 A–F 切换；生命/攻击/防御/冲击/暴击/暴伤/异常精通/掌控/穿透/回能）
│   ├ 核心技 + 额外能力（等级滑杆，文本随等级变化）
│   └ 快捷攻略摘要（加点优先级、首选音擎、首选驱动盘）
│
├ 技能
│   ├ 左侧：六类技能 Tab（普攻/闪避/支援/特殊/连携/核心）
│   ├ 中部：招式列表（名称、说明、标签：燃烧攻击/异放/升变…）
│   └ 右侧：等级 1–16 成长表（伤害倍率/失衡倍率/能量/异常积蓄），行可折叠
│
├ 影画
│   └ 1–6 卡：名称、效果文本、故事文本、特写图；标注「关键影画」
│
├ 攻略
│   ├ 定位与关键词
│   ├ 技能加点（顺序 + 关键等级）
│   ├ 音擎推荐（档位：首选/限定下位/常驻/免费；精炼；差距说明）
│   ├ 驱动盘（4+2 方案、主词条、副词条优先级与有效口径）
│   ├ 毕业面板（多预算：54/45/36/30；来源明细可展开）
│   ├ 队伍（3 套，成员 + 套装 + 备注）
│   └ 文字攻略（出招表、注意事项、影画要点）
│
├ 配装（交互）
│   └ 面板计算器：代理人/音擎/核心/主词条/副词条/4+2 → 最终面板 + 明细
│
└ 对比
    ├ 配置选择（影画 0–6、音擎、精炼、词条预算）
    ├ 指标表（面板、单次异放、灼蚀 tick、参考轴总伤、DPS、相对基准）
    ├ 增量归因（C0→C1→C2→… 的边际贡献瀑布）
    └ 口径声明（敌人等级/防御/抗性/失衡/暴击期望）
```

### 4.3 图鉴列表的统一范式

- **卡片**：主图 + 名称 + 徽章（元素/职业/评级）+ 一行关键信息（音擎显示副词条；驱动盘显示 2 件套）。
- **筛选栏**：左对齐胶囊，单选/多选；URL query 持久化，可分享。
- **空状态**：插画 + 清除筛选。
- **详情页**：左栏「资料卡」+ 右栏「内容区」，移动端折叠为顶部卡片。

### 4.4 导航与搜索

- 顶部导航：Logo｜代理人｜音擎｜驱动盘｜邦布｜计算器｜关于。
- 全局搜索（`Ctrl/Cmd+K`）：本地索引（61+101+30+42 条目，内存过滤即可），结果分组跳转。
- 面包屑：`图鉴 / 代理人 / 菲欧妮`。
- 页脚：数据版本、抓取时间、来源链接、免责声明。

---

### 4.5 官方图鉴字段映射（复刻验收用）

| 官方 WIKI 区块 | 我们的字段 | 呈现位置 | 验收方式 |
| --- | --- | --- | --- |
| 代理人列表（头像/名称/星级/属性/职业） | `agents.index` | `/agents` 卡片 | 与官方列表逐屏对照（数量、排序、筛选） |
| 档案（阵营/生日/身高/CV/简介/TAG） | `profile` | 概览·档案 | 抽查 10 人，字段逐项对照 |
| 基础属性（60 级） | `base` | 概览·基础面板 | 数值精确一致 |
| 技能（6 类，各招式 1–16 级） | `skills[]` | 技能 Tab | 每个招式至少核对首/末级倍率 |
| 核心技（A–F） | `core` | 概览 + 技能·核心 | 六档数值与文本一致 |
| 额外能力 | `additionalAbility` | 技能·核心 | 触发条件 + 文本 |
| 影画（1–6） | `cinemas[]` | 影画 Tab | 名称/效果/故事/特写齐全 |
| 音擎（基础攻击/副词条/精炼 1–5） | `engines[]` | `/engines` | 特效文本随精炼变化 |
| 驱动盘（2/4 件套） | `driveSets[]` | `/drives` | 套装效果逐字一致 |
| 邦布（技能/属性） | `bangboo[]` | `/bangboo` | 技能文本一致 |
| 玩法合集（官方邀请作者） | `guide.text` | 攻略 Tab | 定位/循环/配装逐条对照，冲突留痕 |

> 图鉴的「复刻」标准不是像素级抄版式，而是**信息不缺失、数值不错误、层级可预期**；版式采用 ZZZ 气质重做（见 §12）。



## 5. 技术方案

### 5.1 选型对比

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| A. 纯静态 Vue 3 + Vite + TS（数据构建期生成） | 零后端、部署简单、计算在浏览器、测试快 | 大数据需拆包；抓取需本地跑 | ✅ **已确认** |
| B. 沿用 Vue + FastAPI + Worker | 可服务端计算、可做后台 | 双端重复、部署复杂、与「图鉴站」定位不符 | ❌ |
| C. Next.js/Nuxt SSR | SEO 好 | 引入服务端与框架复杂度，收益有限 | ❌ |
| D. 纯 HTML/JS 无框架 | 极简 | 图鉴/攻略交互多，维护差 | ❌ |

**为什么静态足够**：v1 无账号、无实时数据、无服务端计算；61 个角色的技能数据按需动态 import，首屏只加载索引与当前页。伤害计算是纯函数，单次 < 1 ms。

### 5.2 分层架构

```text
┌──────────────────────────────────────────────────────────┐
│ pages/ + features/        Vue 视图、路由、交互状态         │
├──────────────────────────────────────────────────────────┤
│ core/                     纯 TS，无 Vue/DOM 依赖            │
│  ├ panel/                 面板计算（模式、累加器、明细）    │
│  ├ damage/                乘区、事件、结算、参考轴          │
│  ├ substats/              词条步长、有效口径、毕业 spec     │
│  └ format/                数值格式化（单一实现）            │
├──────────────────────────────────────────────────────────┤
│ data/ (generated)         只读 JSON + 类型                  │
└──────────────────────────────────────────────────────────┘
             ▲ 构建期生成、校验
┌──────────────────────────────────────────────────────────┐
│ tools/zzzsync (Python)    抓取 → 规范化 → 校验 → 生成       │
└──────────────────────────────────────────────────────────┘
```

**硬约束**：`core/` 不得 import Vue、路由、store、`window`；`features/` 不得直接读 `data/raw`；`data/generated` 不得手改。

### 5.3 目录结构

```text
ZenlessSolution/
├─ package.json                 # 单包，无 workspace
├─ vite.config.ts
├─ tsconfig.json
├─ index.html
├─ public/assets/               # 本地化图片（WebP/AVIF + manifest，提交进 Git）
├─ .cache/assets/               # 原图下载缓存（gitignore，可重建）
├─ src/
│  ├─ main.ts
│  ├─ app/                      # App.vue、router、layout、providers
│  ├─ pages/                    # home / agents / agent-detail / engines / drives / bangboo / calculator / about
│  ├─ features/
│  │  ├─ codex/                 # 列表、筛选、卡片、详情壳
│  │  ├─ agent/                 # 概览、技能表、影画、档案
│  │  ├─ guide/                 # 攻略区块渲染器
│  │  ├─ calculator/            # 面板表单、结果、明细
│  │  └─ compare/               # 配置矩阵、对比表、归因
│  ├─ core/
│  │  ├─ panel/                 # types.ts / constants.ts / compute.ts / breakdown.ts / modes.ts
│  │  ├─ damage/                # types.ts / zones.ts / events.ts / anomaly.ts / release.ts / rotation.ts
│  │  ├─ substats/              # steps.ts / effective.ts / graduation.ts
│  │  └─ format/                # number.ts
│  ├─ data/                     # generated JSON（勿手改）+ index.ts
│  ├─ components/               # 通用 UI：Card、Stat、Badge、Tabs、Table、Chart…
│  ├─ styles/                   # tokens.css / base.css / utilities.css
│  └─ assets/
├─ data/                        # 真源（人工 + 抓取快照）
│  ├─ raw/<date>/               # 官方接口原始快照（可追溯）
│  ├─ codex/                    # 规范化中间层（agents/engines/drives/bangboo）
│  ├─ guides/phoenix.toml       # 攻略人工唯一源
│  ├─ rules/                    # substats.toml / mainstats.toml / sets.toml / enemies.toml
│  ├─ media/urls.toml           # 资源键 → 源 URL（构建期本地化）
│  └─ overrides/                # 字段级人工修正（带原因与日期）
├─ tools/
│  ├─ zzzsync/                  # CLI：fetch / normalize / validate / build
│  └─ tests/
├─ tests/                       # Vitest（core + 组件）
├─ docs/
│  ├─ 00-rebuild-plan.md        # 本文
│  ├─ 01-data-contract.md
│  ├─ 02-panel-rules.md
│  ├─ 03-damage-rules.md
│  ├─ 04-guide-schema.md
│  └─ 05-operations.md
└─ .github/workflows/ci.yml
```

### 5.4 依赖清单（刻意精简）

| 类别 | 依赖 | 理由 |
| --- | --- | --- |
| 框架 | `vue@3.5`、`vue-router@4` | 生态成熟、团队熟悉 |
| 状态 | `pinia@2`（仅 compare/calculator 两个 store） | 避免 prop drilling |
| 构建 | `vite@6`、`typescript@5.7`、`@vitejs/plugin-vue` | 标准组合 |
| 样式 | 原生 CSS + `tokens.css` | 图鉴视觉需要定制，不引 UI 库 |
| 图表 | 轻量自绘 SVG（柱/瀑布） | 只为对比服务，避免 ECharts 体积 |
| 图片 | Python Pillow（当前）；`sharp`（可选，后续需要 AVIF 批量时） | 下载后转 WebP、生成主色与尺寸 |
| 测试 | `vitest`、`@vue/test-utils`、`jsdom` | 与旧项目一致 |
| Lint | `eslint` + `@typescript-eslint` + `prettier` | 统一风格 |
| 工具链 | Python 3.13 + `httpx`、`beautifulsoup4`、`pydantic`、`tomli-w`、`pytest` | 抓取/校验 |

> 不引入 naive-ui / Element Plus / Tailwind。理由：图鉴的视觉一致性优先，组件数量可控（≈20 个）；避免主题覆盖成本。

### 5.5 构建与部署

```bash
pnpm install
pnpm data:check        # Python 校验 data/ 与生成物一致
pnpm assets:check      # 图片清单 ↔ 文件 ↔ 引用校验（离线）
pnpm assets:sync       # 首次/更新时下载并转码（需要网络）
pnpm dev               # Vite 5173
pnpm test              # Vitest
pnpm build             # 静态产物 dist/
pnpm preview
```

- 部署：Cloudflare Pages / 任意静态托管；`dist/` 直接上传。
- 环境变量：无。
- 图片：`public/assets/` 本地 WebP/AVIF（见 §6.4）；不依赖 Worker，也不依赖运行时外链。
- 缓存：`index.html` no-cache；hash 资源 `immutable`；图片长缓存。

---

## 6. 数据层

### 6.1 实体与关键字段

**Agent**（`data/codex/agents/<slug>.json` + 索引）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 官方 `ep-2216`，全局主键 |
| `slug` | string | 路由用 `phoenix`，人工登记 |
| `name` | `{zh, full, en}` | 简中名、全名、英文 |
| `rarity` / `element` / `specialty` | enum | S/A；火/冰/电/物理/以太/风/烈霜/玄墨/凛刃/流明；强攻/击破/异常/支援/防护/命破/锋御 |
| `faction` | string | 阵营（官方站/档案） |
| `attackType` | enum[] | 斩击/打击/穿透 |
| `release` | `{version, date}` | 上线版本 |
| `profile` | object | 生日、身高、CV、简介、TAG、阵营介绍 |
| `base` | object | 60 级白板：hp/atk/def/impact/cr/cd/am/ac/pr/er |
| `core` | object | A–F 六档：基础值加成、被动数值、文本 |
| `skills` | `SkillCategory[]` | 六类；每类含 moves，每个 move 含 `rows[]`（倍率/失衡/能量/积蓄）与 16 级数值 |
| `cinemas` | `Cinema[6]` | 名称、效果、故事、特写图 |
| `additionalAbility` | object | 触发条件 + 效果 |
| `assets` | object | icon/portrait/tachie/full/cinema/film 的媒体键；运行时经 `assets/manifest.json` 解析为本地 WebP 路径 |
| `sources` | `Source[]` | 官方/三方 URL + 抓取时间 |
| `verified` | object | 人工核对状态、核对人、日期 |

**Engine**

`id/slug/name/rarity/type(强攻/击破/…)/baseAtk|baseDef/subStat{id,value}/passive{name,desc,refinementValues[5]}/acquisition/assets/sources`

**DriveDiscSet**

`id/slug/name/effects{two,four}/mainStats{slot4[],slot5[],slot6[]}/assets/sources`

**Bangboo**

`id/slug/name/rarity/faction/skill{name,desc}/stats/assets/sources`

**Guide**（`data/guides/phoenix.toml`）

见 §11。

**StatRules**（`data/rules/`）

- `substats.toml`：10 种副词条 + 单条步长 + 上限。
- `mainstats.toml`：4/5/6 号位候选与数值。
- `sets.toml`：二件套候选池。
- `enemies.toml`：敌人预设（等级、防御、抗性、失衡）。

### 6.2 标识与命名

| 维度 | 规则 | 示例 |
| --- | --- | --- |
| 主键 | 官方 entry id，永不复用 | `ep-2216` |
| 路由 | 人工 slug，短、稳定 | `phoenix` |
| 属性 ID | 统一 snake_case，与旧项目兼容 | `atk_pct`、`anomaly_mastery` |
| 媒体键 | `agent:<slug>:avatar` 等 | `agent:phoenix:full` |
| 版本 | `data/version.json`：`gameVersion`、`syncedAt`、`commit` | — |

> 属性 ID 全表见附录 A；任何新增属性必须同时更新 `core/panel/constants.ts`、`statRules` 与文档。

### 6.3 抓取管线

```text
官方接口/页面 ──fetch──▶ data/raw/<YYYY-MM-DD>/<entity>.json
                              │
                    normalize（Python，纯函数）
                              │
                    data/codex/<entity>.json（可人工 override）
                              │
                    validate（schema + 业务规则 + 覆盖率）
                              │
                    build → src/data/*.json（前端只读）
```

**要点**

1. **抓取与解析分离**：`fetch` 只保存原始响应（含 URL、时间、hash）；`parse` 可反复重跑，不重复请求。
2. **增量**：按 `entry id` + 内容 hash 判断；未变则跳过，变更写入 `data/raw/diff/`。
3. **人工修正**：`data/overrides/<entity>.toml` 按字段路径覆盖，必须写 `reason` 与 `date`；构建时应用并记录。
4. **字段来源**：技能/影画文本取官方；立绘/特写取 nanoka（官方缺失时）；前瞻角色取 gachabase 并标 `beta`。
5. **限速与重试**：并发 ≤ 4，指数退避；失败落 `data/raw/failed/`，下次续跑。
6. **可复现**：`pnpm data:build` 在无网络时可用已提交的 `data/raw` 重建全量产物。

**已知接口要点**（从旧脚本审计得出，M1 需先验证）

- 官方 WIKI 走 `entry_page_v2?entry_page_id=N`，请求头需 `User-Agent` / `Referer` / `x-rpc-wiki_app: zzz`；`data` 字段是**二次 JSON 编码的字符串**。
- 旧脚本用 1..2600 全量扫描 + 组件签名判定页面类型；无真增量，只有「幂等重写 + 人工字段回填 + `--check` 闸」。新项目改为「按图鉴列表页取 ID 集合 + 内容 hash 判断」。
- 解析器与抓取器分离后，旧的三个失真点（驱动盘图标写死本地路径、缺 `effect2`、docstring 引用已删除的 manifest）应自然消失；`validate` 必须能抓住「字段存在但指向不存在的资源」。
- 邦布在开源①中**没有 catalog**，旧项目的 42 条是唯一可用底稿；描述为英文，需补中文或标注原文。

**命令（草案）**

```bash
python -m zzzsync fetch agents --since 2026-10-01
python -m zzzsync parse agents
python -m zzzsync validate --all
python -m zzzsync build --out src/data
```

### 6.4 图片策略（本地化，WebP 为主）

**结论（已确认）**：不再直链官方 CDN。所有展示图在构建期下载、按用途生成多尺寸 WebP，随站点一起发布；仓库只提交衍生图 + 清单，原图放本地缓存（gitignore）。

**为什么改**

- 官方 CDN 有防盗链、过期、地区差异；直链在导出、离线、Lighthouse 与长期归档上都不稳。
- 远程图无法控制体积与缓存，首屏不可控。
- 本地化后才能做 `srcset`、主色占位、内容 hash 缓存与完整性校验。

**资产分级与预算**（WebP q≈80，单张目标）

| 变体 | 尺寸 | 用途 | 单张目标 | 数量级 |
| --- | --- | --- | --- | --- |
| `icon` | 96×96 | 头像/元素/职业/评级徽章 | ≤ 6 KB | ~260 |
| `card` | 400w | 图鉴卡片、队伍成员 | ≤ 25 KB | ~205 |
| `portrait` | 640w | 详情侧栏、攻略配图 | ≤ 60 KB | ~61 |
| `full` | 1280w | 详情 KV / 背景 | ≤ 200 KB | ~61 |
| `cinema` | 640w | 影画特写 | ≤ 45 KB | ~366 |

总量目标 **≤ 45 MB**（按上表估算约 40 MB，留 10% 余量）；单页首屏图片 **≤ 1.2 MB**；CI 超预算红灯。

**管线**

```text
data/media/urls.toml          key → 源 URL + 来源 + 抓取时间
        │  pnpm assets:sync
        ▼
.cache/assets/originals/<sha256>.<ext>        （gitignore，可重下）
        │  Pillow：resize + webp(q80)，full 额外 avif
        ▼
public/assets/media/<hash10>-<variant>.webp    （内容 hash 命名）
public/assets/manifest.json                    key → {src,width,height,hash,color}
```

- **源站变换优先**：米游社 OSS 支持 `?x-oss-process=image/resize,w_640/format,webp`，能直接取到已压缩图；取不到再本地转码（首切片用 Pillow，未引入 sharp 原生依赖）。
- **清单解耦**：文件按内容 hash 命名，`manifest.json` 负责 `媒体键 → 路径`；同一原图被多个键引用时只存一份。
- **格式**：WebP 为默认；`full` 变体规划额外产 AVIF（`<picture>` + WebP fallback）。首切片先只产 WebP，AVIF 在确认 Pillow/libavif 可用后接入；若 AVIF 相对 WebP 节省 < 25% 则放弃，避免文件翻倍。
- **透明图**：立绘 / tachie 保留 alpha，不铺白底。
- **命名**：内容 hash 后缀（不可变缓存，`Cache-Control: immutable`）；清单里的 `hash` 用于校验与失效。
- **占位**：sharp 取主色写入 manifest，加载前用纯色块 + `aspect-ratio`，避免 CLS。
- **降级**：缺图用元素色占位 + 名称首字；大图失败退 `card` 变体。

**命令**

```bash
pnpm assets:sync          # 增量下载 + 转码 + 写 manifest
pnpm assets:check         # 离线校验：清单 ↔ 文件 ↔ 数据引用
pnpm assets:prune         # 删除无引用文件（先 --dry-run）
```

**规则**

- `public/assets/` **提交进 Git**（部署自包含，不依赖构建机外网）；`.cache/` 不入库。
- 每个 key 必须登记来源 URL、来源类型（官方/三方）与抓取时间；三方图在 UI 上标注。
- 图片更新走同一 key → 新 hash；旧文件由 `assets:prune` 清理，避免仓库膨胀。
- 版权：页脚声明素材版权归 miHoYo；仅非商业展示，不二次分发原图包。
- 规模：约 1,000–1,200 个文件（含 61 张 AVIF），低于 Cloudflare Pages 的 20,000 文件上限；单文件均 < 1 MB。

**导出（Later）**：资产已同源，PNG 攻略图导出不再有 CORS 问题；用 `html-to-image` 或 canvas 即可。

### 6.5 版本与更新流程

1. 新版本上线 → `fetch` 增量 → `parse` → `validate`。
2. `validate` 输出：新增/变更/缺失清单（Markdown）。
3. 人工核对 10 条抽样 + 变更条目 → 写 `verified`。
4. `assets:sync`（只下载变更/新增图）→ `assets:check`（预算/引用/孤儿）。
5. `build` → 提交 `data/`、`src/data/`、`public/assets/` → 部署。
6. `data/version.json` 与页面页脚同步显示。

### 6.6 校验规则（必须失败即阻断）

| 规则 | 例子 |
| --- | --- |
| Schema | 必填字段、枚举、URL 格式 |
| 引用完整性 | 攻略里 `engineId`/`set4Id` 必须存在 |
| 数值范围 | 暴击率 0–100、词条条数 0–6、技能等级 1–16 |
| 唯一性 | slug 唯一、媒体键唯一 |
| 资产 | 每个媒体键在 manifest 中有文件；单张 ≤ 预算；无孤儿文件；运行时无外链图 |
| 覆盖率 | 每个 agent 至少 6 类技能、6 影画、1 张立绘 |
| 口径 | 毕业面板 spec 的词条总数 = 预算；主词条不与副词条重复 |
| 一致性 | 面板 spec 实算结果 = 攻略展示值（容差 0.05） |

---

## 7. 面板计算引擎（局外）

### 7.1 公式（继承旧项目，作为行为基准）

| 属性 | 公式 |
| --- | --- |
| 生命/攻击/防御 | `(基础 + 基础加成 + 音擎基础) × (1 + 百分比) + 固定值` |
| 冲击力/异常掌控/能量回复 | `(基础 + 固定加成) × (1 + 百分比)` |
| 暴击率/暴击伤害/增伤/穿透率/异常精通/穿透值 | 纯加法 |
| 异常掌控 | 计算后 `floor` 取整（全属性唯一取整项） |
| 命破·贯穿力 | `0.3 × 最终攻击 + 0.1 × 最终生命` |
| 锋御·实际暴击率 | `最终暴伤 × 35% + 最终暴击率` |
| 锋御·锐暴伤害 | 固定 150%（不参与其他计算） |

**顺序**：核心 → 音擎副词条 → 驱动盘 1/2/3 固定 → 4/5/6 主词条 → 副词条 → 二件套。明细按此顺序列来源。

> **基期注意**：开源①把攻击%拆成两个基期——`乘基础攻击`（角色 + 音擎 + 核心）与`乘局外面板`（局内 Buff 的 +X% 攻击）。旧项目只实现前者。v1 的「局外面板」沿用旧项目（所有百分比都乘基础攻击）；等到伤害页引入局内攻击 Buff 时，必须显式区分来源，不能一把梭。这条写进 `docs/02-panel-rules.md` 的「已知简化」。

### 7.2 输入模型

```ts
interface PanelInput {
  agentId: string;              // ep-2216
  level: 60;
  coreLevel: 'none' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  engine: { id: string; refinement: 1|2|3|4|5; level: 60 } | null;
  discs: {
    slot4: MainStatId; slot5: MainStatId; slot6: MainStatId;
    set4: SetId | null; set2: SetId | null;
  };
  substats: Partial<Record<SubStatId, number>>; // 条数，0–36
  setBonuses?: SetBonusId[];    // 二件套候选（0–2）
}
```

### 7.3 输出

```ts
interface PanelResult {
  stats: Record<StatId, number>;       // 最终值
  base: { agent: Stats; core: Stats; engine: Stats };
  breakdown: BreakdownRow[];            // { stat, total, sources[] }
  mode: 'standard' | 'rupture' | 'armorer';
  warnings: string[];                   // 超上限、非法组合、缺失数据
}
```

- 数值格式化只在一处：`core/format/number.ts`（千分位、两位小数、百分比）。
- 明细行由 `sources[]` 生成，前端只渲染，不重算。

### 7.4 三模式

| 模式 | 判定 | 影响 |
| --- | --- | --- |
| `standard` | 默认 | 12 行 |
| `rupture`（命破） | 职业=命破 | 隐藏穿透率/回能，显示贯穿力、闪能累积；攻/命为基 |
| `armorer`（锋御） | 职业=锋御 | 显示实际暴击率、锐暴伤害；回能文案替换为「锐能自动累积」 |

> 三模式在 v1 全量支持（影响所有代理人的面板页），伤害只用 `standard`。

### 7.5 对拍与验收

- **对旧项目**：抽 12 个代理人 × 3 套配置，输出 JSON 快照，逐字段比对（容差 0.01）。旧项目的 `backend/tests` 已有 445 条用例，可提取为 fixtures。
- **对 zzz_calculator**：菲欧妮 60 级白板（HP 7673 / ATK 797 / DEF 612 / 冲击 86 / 暴击 5 / 暴伤 50 / 精通 118 / 掌控 116 / 回能 120）必须一致。
- **手算**：毕业面板 2538.1 / 510 / 255.4。

---

## 8. 有效词条规则

### 8.1 定义

| 概念 | 定义 |
| --- | --- |
| 条（roll） | 一次副词条强化；S 级单条数值固定 |
| 有效词条 | 落在该代理人 `effectiveStats` 白名单内的条数 |
| 小词条 | 固定生命/攻击/防御、穿透值等「有收益但非核心」的条数 |
| 无效词条 | 既非有效也非小词条（如菲欧妮的生命%） |
| 预算 | 一件满级盘 = 9 条（3 初始 + 5 强化 + 1 补足）；6 件 = 54 条上限 |

> **口径声明**：有效词条数只用于展示、高亮与选盘排序，**不进入面板计算、伤害计算或任何权重**（沿用开源①的硬约束）。毕业面板的实算永远按完整词条走，展示时才拆分口径。

### 8.2 词条步长（S 级）

| 词条 | 单条 | 词条 | 单条 |
| --- | --- | --- | --- |
| 生命% | 3% | 暴击率 | 2.4% |
| 生命 | 112 | 暴击伤害 | 4.8% |
| 攻击% | 3% | 穿透值 | 9 |
| 攻击 | 19 | 异常精通 | 9 |
| 防御% | 4.8% | 异常掌控 | 3% |
| 防御 | 15 | | |

- 单条上限 6 次（6 件盘各 1 条同名副词条）；总上限 54。
- **计数算法**：`rolls = round(value / step)`，必须 `|value/step - rolls| < 1e-6` 且 `1 ≤ rolls ≤ 6`，否则不计（与开源①一致）。

### 8.3 代理人权重表

每个代理人维护：

```toml
# data/codex/agents/phoenix.toml 片段
effectiveStats = ["anomaly_proficiency", "atk_pct"]
smallStats     = ["atk_flat", "pen_value"]
# 其余为无效
```

- **有效条数** = Σ `effectiveStats` 的 rolls。
- **小词条数** = Σ `smallStats` 的 rolls。
- **展示口径**：`41 有效 + 12 小词条 + 1 无效`；另有「含穿透值」开关（把 `pen_value` 计入有效）。
- 权重仅用于 v1.2 的边际收益，v1 不做 0.5/0.25 这类主观权重，避免无法验证。

### 8.4 毕业面板 spec

```toml
[graduation."54"]
label = "满配 54 词条"
budget = 54
statRule = "effective_plus_small"
build = { engine = "ep-2259", refinement = 1, core = "F",
          set4 = "ep-191", set2 = "ep-1194",
          main = { slot4 = "am_92", slot5 = "dmg_30_fire", slot6 = "ac_pct_30" } }
substats = [
  { id = "anomaly_proficiency", count = 30 },
  { id = "atk_pct", count = 11 },
  { id = "atk_flat", count = 6 },
  { id = "pen_value", count = 6 },
  { id = "hp_pct", count = 1 },
]
```

- 构建时用面板引擎实算，写入 `src/data/guides/phoenix.json` 的 `panelPreview`；页面展示值必须来自实算，不允许手填。
- `build` 必须显式包含 `core`（等级 A–F）；缺参直接报错，**禁止回落到任何角色默认值**（旧项目 `calc_graduation_panel.py` 的教训）。
- 提供 54 / 45 / 36 / 30 四档；菲欧妮先做 54 与 30（旧项目已有）。
- 校验：`Σ count = budget`；主词条与副词条不重复；词条步长合法；实算值与攻略展示值差 ≤ 0.05。

### 8.5 与旧项目对齐

旧项目菲欧妮：`异常精通 30 + 攻击% 11 = 41 有效`，`攻击 6 + 穿透 6 = 12 小`，`生命% 1 = 无效`。新规则必须逐条复现；测试用固定 fixture 锁定。

---

## 9. 伤害引擎（仅菲欧妮）

### 9.1 设计原则

1. **事件 + 快照，不是模拟器**：不做能量/时间/失衡条模拟；每个事件显式给出次数、倍率、是否失衡、暴击口径。
2. **面板与伤害同源**：伤害读取 `PanelResult.stats`，不另建一套面板。
3. **每个乘区可解释**：UI 展示每个乘区的数值与来源；不能出现「黑箱系数」。
4. **假设显式**：参考轴、Buff 覆盖率、敌人预设写在攻略 TOML 与页面「口径」区。
5. **可验证**：每个机制至少一个手算或开源对拍用例。

### 9.2 乘区实现

```ts
interface DamageZones {
  base: number;            // 攻击力（异常强度提供者）
  dmgBonus: number;        // 1 + 增伤%
  defZone: number;         // 794 / (794 + 有效防御)
  resZone: number;         // 1 - 抗性 + 抗性穿透
  stunZone: number;        // 失衡 ? 1.5 : 1（+ 易伤）
  critZone: number;        // 1 + clamp(CR) × clamp(CD)
  anomalyProficiency: number; // AP / 100
  levelZone: number;       // 1 + (60-1)/59 = 2
  anomalyDmgBonus: number; // 1 + 异常增伤%
  anomalyMult: number;     // 倍率%
  anomalyCritZone: number; // 1 + 异常暴击率 × 异常暴伤
  releaseDmgBonus: number; // 1 + 异放增伤% + 异常增伤%
  releaseMult: number;
}
```

- 防御区常量 794、敌人 60 级防御 953（与开源②一致）；穿透率上限 95%。
- 暴击口径默认「期望」；单点卡片可切「必暴 / 不暴」。

**直伤**

```text
damage = base × skillMult × dmgBonus × defZone × resZone × stunZone × critZone
```

**属性异常**

```text
damage = base × dmgBonus × defZone × resZone × stunZone
       × (AP/100) × levelZone × anomalyMult × (1 + anomalyDmgBonus) × anomalyCritZone
```

- **火异常（灼烧）的 `anomalyMult` 不是 4.45**：它是「单跳倍率 0.5 × 20 跳 = 10」。4.45 是焚罪异放的固定倍率，两者不能混。
- 灼烧延长 2 秒要换算成 **+4 跳**（0.5s 一跳），再进倍率，不能把最终伤害 ×1.2。
- 异常暴击区只在菲欧妮的「灼蚀」条件下存在（见 §9.4），普通直伤不受影响。

**异放（Release）**

```text
damage = base × (1 + releaseDmgBonus + anomalyDmgBonus) × releaseMult
       × defZone × resZone × stunZone
       × (AP/100) × levelZone
       × (1 + (anomalyCritRate + releaseCritRate) × (anomalyCritDmg + releaseCritDmg))
```

- 异放是**替换异常倍率基底**（固定倍率 4.45 / 5.97 等），不是「原异常伤害再乘一个系数」。
- 基底（ATK / AP / 等级）来自异常强度提供者，暴击与专属增伤来自触发者；菲欧妮自触发时两者同一面板，但代码结构要保留这个区分。

**紊乱**

```text
damage = base × dmgBonus × defZone × resZone × stunZone
       × (AP/100) × levelZone × (4.5 + remainingTicks × 0.5)
```

- 灼烧 10s：`4.5 + 20 × 0.5 = 14.5`；C2 延长 2s 后 `16.5`。
- 紊乱**不吃异常暴击**，增伤走独立桶（`disorderDamageBonus`）。

### 9.3 敌人与环境预设（`data/rules/enemies.toml`）

| 预设 | 等级 | 防御 | 抗性 | 失衡 |
| --- | --- | --- | --- | --- |
| 标准木桩 | 60 | 953 | 0% | 否 |
| 弱点木桩 | 60 | 953 | -20% | 否 |
| 失衡爆发 | 60 | 953 | 0% | 是（1.5） |
| 高抗 | 60 | 953 | 40% | 否 |

- v1 只用「标准木桩 + 失衡爆发」两档；UI 可切。
- 抗性按元素；菲欧妮为火。

### 9.4 菲欧妮机制拆解

| 机制 | 数值 | 来源 | 实现 |
| --- | --- | --- | --- |
| 核心被动·涅槃 | 异常精通 +43/50/57/64/71/78/85（A–F） | 核心技 | 面板 flat |
| 灼蚀 | 任意属性异常伤害使敌人进入，20s | 核心被动 | 状态标记，Buff 生效条件 |
| 灼蚀暴击率 | `clamp(30 + max(AM-155,0)×0.7, 0, 100)%` | 核心被动 | 异常暴击区 |
| 灼蚀暴伤 | 12.5%–25%（随核心等级）+15%（额外能力）+25%（C1）+40%（异放专属） | 多处 | 分来源累加 |
| 灼蚀 tick | 每 8s，25%–50% 攻击力，视为强化特殊技 | 核心被动 | 直伤事件，火属性 |
| 额外能力 | 队伍有异常/同阵营：灼蚀目标异常暴伤 +15% | 额外能力 | 条件 Buff |
| C1 | 异常暴伤 +25%；进场 +1 升变；燔焰效率 +15% | 影画 | 暴伤 + 启动假设 |
| C2 | 灼烧持续 +2s；对灼蚀目标伤害 +30% | 影画 | 增伤区；异常持续时间 |
| C4 | 终结技/焚罪终结一击额外触发 600% 异放 | 影画 | 额外事件 |
| C6 | 无视 15% 全抗；强化特殊技：眩焰获得 1 点升变；异放无视 40% 防御 | 影画 | 抗性区/防御区；循环次数 |
| 专武·涅槃初翎 | 异常精通 +90（精 1）→ +126（精 5）；队友异常暴击后火伤 +40% → +56%（20s） | 音擎 | 面板 + 增伤 Buff（假设覆盖） |

### 9.5 参考轴（草案，M6 与需求方确认）

| # | 事件 | 倍率来源 | 次数 | 备注 |
| --- | --- | --- | --- | --- |
| 1 | 强化特殊技：燎斩 | 特殊技 12 级 | 2 | 蓄力/非蓄力需确认 |
| 2 | 强化特殊技：坠阳 | 特殊技 12 级 | 1 | 消耗升变 |
| 3 | 终结技：万死重明 | 连携 12 级 | 1 | |
| 4 | 终结技：烬火追魂（异放） | 300/597/705%（1/12/16） | 1 | 固定倍率 |
| 5 | 普通攻击：焚罪（异放） | 225/445/525% | 3 | 固定倍率 |
| 6 | 灼蚀 tick | 25%–50% 攻击 | 2 | 8s 一次 |
| 7 | 火属性异常（灼烧） | 单跳 0.5 × 20 跳 = 10 | 1 | 异常精通/异常暴击 |
| 8 | 紊乱 | 4.5 + 20 × 0.5 = 14.5（C2 为 16.5） | 1 | 与维琳娜配合 |

- 轴长 20s；DPS = 总伤 / 20。
- 次数是**假设**，不是模拟结果；页面必须显示「参考轴，非实战」。
- **技能等级固定为 12**（三影/五影会抬高上限，但 0+1 与 6+1 对比时必须同等级，否则重复计算影画收益）；影画只改数值，不改等级。
- 提供「只算单次异放」模式，避开轴假设，便于横向比较。

### 9.6 输出

```ts
interface DamageResult {
  events: Array<{ id, label, count, perHit, total, zones }>;
  total: number;
  dps: number;
  duration: number;
  assumptions: string[];
  warnings: string[];
}
```

- 对比表只展示 6 个指标：攻击、异常精通、异常掌控、单次异放、灼蚀 tick、轴总伤。
- 每个数字可点开「乘区明细」。

### 9.7 精度与假设

- 所有中间值保留双精度；展示两位小数；**不用展示值反算**。
- 暴击默认期望（`1 + CR×CD`），同时给出「必暴」上限。
- Buff 覆盖率：专武火伤、自由蓝调 4 件套、灼蚀默认 100%（20s 轴内可维持）。
- C2 的「灼烧持续 +2s」必须换算成 **+4 跳**（0.5s 一跳），紊乱倍率 14.5 → 16.5；不能按最终伤害 ×1.2。
- 失衡：默认非失衡；「失衡爆发」档把全部事件设为失衡，仅作上限参考。
- 抗性：默认 0%；弱点 -20% 作为可选档。

### 9.8 验收基准

1. **开源①对拍（异放，非异常）**：复现 `tests/fioni-damage.test.js` 的独立 oracle：
   `ATK × 4.45 × 794/(794+953) × 1.5 × (AP/100) × 2 × (1 + 0.615×0.8)`。
   在开源①的固定输入（雨林饕客、无驱动盘、`ATK=1466`、`AP=278`）下：初始掌控 200 应得 **36,894.0602371975**；掌控 152 应得 **30,662.6237896279**，误差 < 1e-8。
2. **阈值**：AM=154/155/155.5/200/254.9/255/256 时，灼蚀暴击率为 `0.3 / 0.3 / 0.3035 / 0.615 / 0.9993 / 1 / 1`。
3. **影画**：C1 暴伤 +25%、C2 增伤 +30%、C6 抗性/防御参数生效；C4 的额外异放只在 4 影存在时可选。
4. **异放倍率**：焚罪 225/445/525、烬火追魂 300/597/705（1/12/16 级）。
5. **独立手算**：任取一套 0+1 配置，用 Excel/手算复核单次异放与轴总伤，误差 < 0.1%。

---

## 10. 配置对比

### 10.1 配置维度

| 维度 | 取值 | 默认 |
| --- | --- | --- |
| 影画 | 0–6 | 0 |
| 音擎 | 专武 / 限定下位 / 常驻 / A 级 | 专武 |
| 精炼 | 1–5 | 1（A 级默认 5） |
| 核心技 | A–F | F |
| 技能等级 | 1–16 | 12（按加点） |
| 驱动盘 | 4+2 方案 | 自由蓝调 + 法厄同 |
| 主词条 | 4/5/6 | 精通/火伤/掌控 |
| 词条预算 | 54 / 45 / 36 / 30 | 54 |

### 10.2 预设矩阵（v1）

| 代号 | 影画 | 音擎 | 精炼 | 词条 | 用途 |
| --- | --- | --- | --- | --- | --- |
| `0+1` | 0 | 涅槃初翎 | 1 | 54 | **基准** |
| `1+1` | 1 | 涅槃初翎 | 1 | 54 | 关键影画 |
| `2+1` | 2 | 涅槃初翎 | 1 | 54 | 主流毕业 |
| `6+1` | 6 | 涅槃初翎 | 1 | 54 | 上限 |
| `0+0` | 0 | 壳中之灵 | 1 | 54 | 无专武 |
| `0+1 平民` | 0 | 涅槃初翎 | 1 | 30 | 词条差距 |
| `A5` | 0 | 双生泣星 | 5 | 54 | 零氪 |

- 「0+1」定义写进 UI tooltip：**0 影画 + 专武精炼 1**。
- 允许用户自由增删列（最多 6 列），默认展示 0+1 / 2+1 / 6+1。
- **技能等级固定 12、核心固定 F、驱动盘与主词条固定**——只让影画/精炼/词条预算变化；任何「影画顺带抬等级」的情况都要在对比中排除，否则归因会飘。

### 10.3 对比视图

```text
┌ 配置选择（多选 chips）──────────────────────────────┐
├ 指标表 ────────────────────────────────────────────┤
│ 指标        0+1      1+1      2+1      6+1          │
│ 攻击力      2538.1   …        …        …            │
│ 异常精通    510      …        …        …            │
│ 单次异放    123,456  +8.2%    +15.6%   +42.1%       │
│ 灼蚀 tick   8,765    +0%      +30.0%   +30.0%       │
│ 轴总伤      1,234,567 …       …        …            │
│ 相对基准    100%     108.2%   115.6%   142.1%       │
├ 增量归因（C0→C1→C2→C6 瀑布）───────────────────────┤
└ 口径与假设（可展开）────────────────────────────────┘
```

- **相对基准**：`config.total / baseline.total`，基准固定 `0+1`。
- **归因**：只做「同一词条预算下，影画逐级增加」的边际贡献；音擎/词条差异单独标注为「非影画因素」。
- **颜色**：增益绿、减益红、持平灰；同时用 `+/-` 文本，避免只靠颜色。
- **导出**：v1 提供「复制对比表为 Markdown」；图片导出 Later。

### 10.4 防误导

- 页面固定展示：敌人预设、轴长、事件次数、暴击口径、Buff 覆盖假设。
- 文案禁用「最强」「必抽」；改为「相对 0+1 提升 X%」。
- 前瞻角色/数据标注来源与时间。

---

## 11. 攻略内容模型

### 11.1 TOML v3（比旧 v2 更扁平）

```toml
schema = 3
agentId = "ep-2216"
slug = "phoenix"
updatedAt = "2026-11-04"
sources = ["https://baike.mihoyo.com/zzz/wiki/content/2216/detail", "..."]

[identity]
role = "火属性异常主C"
tags = ["异常暴击", "驻场", "异放"]
oneLiner = "以灼蚀放大全队异常伤害，靠异放结算爆发。"

[priority]                      # 技能加点
order = ["core", "chain", "basic", "special", "assist", "dodge"]
levels = { core = 7, chain = 12, basic = 12, special = 12, assist = 12, dodge = 7 }

[[engines]]                     # 音擎档位
tier = "首选"
note = "..."
[[engines.items]]
engineId = "ep-2259"
refinement = 1
why = "专武；异常精通 +90，火伤 +40%"

[[builds]]                      # 驱动盘方案
name = "4 自由蓝调 + 2 法厄同之歌"
set4 = "ep-191"
set2 = "ep-1194"
main = { slot4 = "am_92", slot5 = "dmg_30_fire", slot6 = "ac_pct_30" }
subPriority = ["anomaly_proficiency", "atk_pct", "atk_flat", "pen_value"]
effective = ["anomaly_proficiency", "atk_pct"]
small = ["atk_flat", "pen_value"]

[graduation."54"]               # 毕业面板（见 §8.4）
...

[[teams]]
name = "菲欧妮 + 维琳娜 + 蕾米埃尔"
[[teams.members]]
agentId = "ep-2216"
note = "..."
set4 = "ep-191"

[[text]]
title = "出招表"
blocks = [
  { type = "steps", items = ["① ...", "② ..."] },
  { type = "callout", tone = "tip", text = "..." },
]

[compare]                       # 对比预设（可选，缺省用全局）
baseline = "0+1"
presets = ["0+1", "1+1", "2+1", "6+1"]
```

### 11.2 渲染区块

| 区块 | 组件 | 说明 |
| --- | --- | --- |
| 加点 | `PriorityBlock` | 顺序 + 图标 + 等级 |
| 音擎 | `EngineTierBlock` | 档位、精炼、差距说明 |
| 驱动盘 | `BuildBlock` | 4+2、主词条、副词条优先级、有效口径 |
| 毕业面板 | `PanelPreviewBlock` | 实算数值 + 来源明细 |
| 队伍 | `TeamBlock` | 成员卡、套装、备注 |
| 文字 | `RichTextBlock` | steps / callout / table / list，禁止原始 HTML |
| 影画要点 | `CinemaNotesBlock` | 1–6 逐条 |

### 11.3 菲欧妮内容迁移清单

- [ ] 技能 6 类 × 招式文本 + 16 级成长（来自 `phoenix.json`）。
- [ ] 6 影画：名称/效果/故事/特写。
- [ ] 核心技 A–F 数值与文本。
- [ ] 加点、音擎 4 档、驱动盘 1 套、毕业 54/30、队伍 2 套、文字 3 篇。
- [ ] 与官方玩法合集逐条对照（旧项目 `_meta.preAudit` 已有一轮结论，沿用并复核）。
- [ ] 图片键补全（头像/立绘/tachie/影画/film/音擎图标）。

### 11.4 编辑工作流

1. 改 `data/guides/phoenix.toml`。
2. `pnpm guide:check` → schema + 引用 + 实算校验。
3. `pnpm dev` 下 Vite 监听 TOML/生成物，热更新（不做运行时 TOML 解析）。
4. 提交；CI 再跑一次校验。

> 不做「重启服务才生效」的链路；也不做后台编辑器。

---

## 12. 设计系统与交互

### 12.1 视觉方向

- **关键词**：街头、印刷、硬边、霓虹黄、做旧纸张。
- **色板**：`--bg #0b0b0f`、`--surface #14141a`、`--accent #f5e663`（ZZZ 黄）、`--danger #ff4d4f`；元素色：火 `#ff6b3d`、冰 `#5ad1ff`、电 `#4d7cff`、物理 `#d8d8d8`、以太 `#c46bff`、风 `#4dd6a8`。
- **字体**：正文 `Noto Sans SC`；标题用较窄字重 + 字距；数字 `DIN`/`Barlow Condensed`（本地字体或系统回退）。
- **形状**：小圆角（2–6px）+ 斜切角（`clip-path`）用于标签；细描边 + 半调纹理。
- **动效**：进入 120–200ms；Tab 切换淡入；对比数字滚动；尊重 `prefers-reduced-motion`。

### 12.2 布局

| 断点 | 布局 |
| --- | --- |
| ≥1440 | 12 栏，内容最大 1360px；详情页左 320px 资料栏 + 右内容 |
| 1024–1439 | 10 栏；左栏 280px |
| 768–1023 | 单栏 + 顶部资料卡；Tab 横向滚动 |
| <768 | 单栏；筛选抽屉；对比表横向滚动 + 首列固定 |

- 首屏高度不超过 100vh；列表卡片 4/3/2 列自适应。

### 12.3 组件清单（约 22 个）

`AppShell`、`TopNav`、`Breadcrumb`、`SearchCommand`、`FilterBar`、`CodexCard`、`AgentHero`、`StatGrid`、`Badge`、`Tabs`、`Section`、`DataTable`、`GrowthTable`、`CinemaCard`、`PriorityBlock`、`EngineTierBlock`、`BuildBlock`、`TeamBlock`、`RichTextBlock`、`PanelForm`、`PanelResult`、`CompareTable`、`Waterfall`、`Callout`、`EmptyState`、`Skeleton`、`Footer`。

### 12.4 可访问性与性能

- 语义化标题层级；Tab 用 `role="tablist"` + 键盘左右；对比表首列 `scope="row"`。
- 对比度 ≥ 4.5:1（黄色文字用深底）；焦点环可见。
- 图片 `alt` 用「角色名 + 类型」；装饰图 `alt=""`。
- 首屏 JS ≤ 180 KB gzip；角色技能数据按路由动态 import。
- 图片用 `srcset`/`<picture>`（AVIF → WebP）与固定 `width/height`；卡片懒加载，详情 KV 预加载；主色占位避免 CLS。
- 第三方脚本为零；字体子集化或系统回退。
- Lighthouse：Performance ≥ 90、Accessibility ≥ 95。

### 12.5 攻略图导出（Later）

- 图片已本地同源，`html-to-image` 可直接导出，不再有 CORS 黑块问题。
- v1 只提供「复制 Markdown 表格」与打印样式（`@media print`）。

---

## 13. 工程质量

### 13.1 规范

- TS `strict`；禁止 `any`（除第三方边界）；`core/` 纯函数、不可变输入。
- 命名：组件 PascalCase、函数 camelCase、类型 PascalCase、常量 UPPER_SNAKE、数据键 snake_case。
- 单文件 ≤ 300 行；`core/damage` 每个文件单一职责。
- 提交信息：`feat|fix|data|docs|refactor|test(scope): 摘要`。
- 每个 PR 必须更新 `docs/changelog.md` 对应条目。

### 13.2 测试金字塔

| 层 | 工具 | 覆盖 |
| --- | --- | --- |
| 单元 | Vitest | 面板每类属性、词条计数、乘区、事件结算 |
| 对拍 | Vitest + fixtures | 旧项目面板快照、开源①菲欧妮数值 |
| 数据 | pytest | schema、引用、覆盖率、毕业 spec 实算 |
| 资产 | `pnpm assets:check` | 清单 ↔ 文件 ↔ 数据引用、单张/总量预算、孤儿文件 |
| 组件 | Vitest + jsdom | 列表筛选、Tab、对比表渲染 |
| 端到端 | Playwright（可选） | 首页 → 代理人 → 攻略 → 对比 主链路 |

- 目标：`core/` 行覆盖 ≥ 90%；数据校验 0 错误；无 skip 测试。

### 13.3 CI

```yaml
jobs:
  web:
    - pnpm install
    - pnpm lint
    - pnpm typecheck
    - pnpm test
    - pnpm assets:check
    - pnpm build
  data:
    - python -m zzzsync validate --all
    - pytest tools/tests
```

- 主分支保护：CI 全绿 + 1 次自审。
- 部署：`main` 合并后自动构建并发布到 Pages（可选）。

### 13.4 文档

| 文档 | 内容 |
| --- | --- |
| `docs/00-rebuild-plan.md` | 本文 |
| `docs/01-data-contract.md` | 实体字段、ID、覆盖规则 |
| `docs/02-panel-rules.md` | 公式、顺序、模式、对拍 |
| `docs/03-damage-rules.md` | 乘区、事件、参考轴、假设 |
| `docs/04-guide-schema.md` | TOML v3 字段与示例 |
| `docs/05-operations.md` | 抓取、校验、发布、回滚 |
| `docs/changelog.md` | 按日期 |

---

## 14. 里程碑

> 人日按「1 名开发者 + AI 辅助」估算；不含等待数据/确认。

| 里程碑 | 目标 | 主要任务 | 产出 | 验收 | 估算 |
| --- | --- | --- | --- | --- | --- |
| **M0** 骨架 | 可运行的空站 | Vite/Vue/TS、路由、tokens、CI、目录 | 首页 + 空图鉴页 + 文档 | `pnpm dev/build/test` 通过；CI 绿 | 1d |
| **M1** 数据管线 | 四类图鉴数据可用 | 抽取旧抓取脚本；fetch/parse/validate/build；补 skills/cinemas/faction；图片下载/转码/manifest | `data/` + `src/data/` + `public/assets/` + 校验报告 | 61 角色/101 音擎/30 套/42 邦布；0 校验错误；`assets:check` 通过且资产 ≤ 45 MB | 5d |
| **M2** 图鉴前端 | 四类图鉴可浏览 | 列表/筛选/搜索/详情；图片降级；响应式 | 8 个页面 | 抽查 10 条与官方一致；Lighthouse ≥ 90 | 4d |
| **M3** 面板引擎 | 任意角色可算 | 三模式、累加器、明细、格式化；对拍 | `core/panel` + 计算器页 | 12 组 fixture 误差 ≤ 0.01；菲欧妮毕业值复现 | 3d |
| **M4** 攻略与菲欧妮页 | 攻略闭环 | TOML v3、渲染区块、内容迁移、热更新 | 菲欧妮详情页全 Tab | 六个区块齐全；内容核对清单完成 | 3d |
| **M5** 有效词条 | 口径可解释 | 步长表、计数、含穿透开关、毕业 spec、实算回写 | 词条面板 + 毕业卡 | 41+12+1 复现；四档预算通过 | 2d |
| **M6** 伤害与对比 | 配置差异可见 | 乘区、事件、菲欧妮机制、参考轴、预设矩阵、归因 | 对比页 + 单点卡 | 3 个 oracle 数值对齐；0+1/2+1/6+1 可切换 | 5d |
| **M7** 打磨发布 | 可公开 | 空状态/加载/错误、a11y、SEO、文档、部署 | 线上站点 | 无 console 错误；移动端可用；文档齐 | 2d |

**关键路径**：M1 → M3 → M5 → M6。M2 可在 M1 后半段并行；M4 依赖 M3 的实算能力。

**周计划（建议）**

- 第 1 周：M0 + M1（数据管线打通，先跑通菲欧妮全量）。
- 第 2 周：M2 + M3（图鉴与面板）。
- 第 3 周：M4 + M5（攻略与词条）。
- 第 4 周：M6（伤害与对比）。
- 第 5 周：M7 + 缓冲。

**每日可验证产出**：每天结束必须有一个可点开的页面或一个通过的测试，不做「纯底层」的黑箱周。

---

## 15. 风险登记册

| # | 风险 | 影响 | 概率 | 缓解 |
| --- | --- | --- | --- | --- |
| R1 | 官方 WIKI 接口变更/反爬 | 数据断更 | 中 | 原始快照 + 解析器隔离 + 三方兜底 + 人工 override |
| R2 | 本地图片体积膨胀 / 上游换图 | 仓库变大、构建变慢、旧图残留 | 中 | 变体预算 + CI 红灯；内容 hash 增量更新；`assets:prune` 清理孤儿 |
| R11 | 图片转码质量/透明通道问题 | 立绘边缘发黑、细节糊 | 低 | 固定 q80 抽检；alpha 不铺底；保留原图可重转 |
| R3 | 伤害模型争议（轴/覆盖率） | 数字不可信 | 高 | 假设显式化、单次事件模式、手算复核、标注「非实战」 |
| R4 | 菲欧妮机制理解偏差（异放/灼蚀） | 结论错误 | 中 | 对照官方文本 + 开源①测试 + 需求方确认 |
| R5 | 数据量导致首屏变慢 | 体验差 | 中 | 索引/详情拆分、动态 import、图片懒加载 |
| R6 | 范围蔓延（全角色伤害/优化器） | 延期 | 高 | v1 Won't 清单；新需求进 Later |
| R7 | 三方前瞻数据与正式服冲突 | 误导 | 中 | `beta` 标记 + 来源时间 + 正式上线后复核 |
| R8 | 单人维护成本 | 停更 | 中 | 数据管线自动化、校验阻断、文档即契约 |
| R9 | 静默回落/默认值（旧 `calc_graduation_panel.py` 式） | 错误数值被当成正确 | 中 | 缺参直接抛错；spec 必填 `core`；校验阻断 |
| R10 | 把「有效词条数」误用为权重/优化目标 | 配装越选越弱 | 中 | 硬约束：只做展示；权重必须由伤害引擎现算 |

---

## 16. 决策记录

| # | 问题 | 选项 | 结论/推荐 | 影响 |
| --- | --- | --- | --- | --- |
| D1 | 运行时形态 | A 纯静态 Vue；B 保留 FastAPI；C SSR | ✅ **A（已确认）** | 决定 §5 全部 |
| D2 | 图鉴深度 | A 61 人全量技能/影画；B 先做菲欧妮 + 列表 | **A**（M1 一次做全，避免二次抓取） | 数据量与 M1 工期 |
| D3 | 对比基准 | A `0+1`；B `0+0`；C 可切换 | ✅ **A（已确认）**，UI 允许切基准 | 文案与默认列 |
| D4 | 参考轴 | A 20s 固定轴；B 只做单次事件；C 两者都给 | ✅ **C（已确认）** | 伤害页复杂度 |
| D5 | 视觉 | A 贴近官方图鉴；B ZZZ 街头风原创；C 折中 | **C**（结构像官方、气质像 ZZZ） | 设计工作量 |
| D6 | 是否保留 PNG 导出 | A v1 不做；B 做 | **A**（本地图已同源，Later 成本低） | 省 2–3 天 |
| D7 | 图片格式 | A 全 WebP；B WebP + full 变体 AVIF | ✅ **B（已确认）**：WebP 默认，`full` 规划 AVIF；首切片先 WebP | 资产体积与编码时间 |

> D1/D3/D4/D7 已确认；D2/D5/D6 仍按推荐值推进，有异议随时叫停。

---

## 17. 附录

### A. 属性 ID 对照（节选）

| ID | 中文 | 类型 |
| --- | --- | --- |
| `hp` / `hp_pct` | 生命 / 生命% | base+pct |
| `atk` / `atk_pct` | 攻击 / 攻击% | base+pct |
| `def` / `def_pct` | 防御 / 防御% | base+pct |
| `impact` / `impact_pct` | 冲击力 / 冲击力% | base+pct |
| `crit_rate` / `crit_dmg` | 暴击率 / 暴击伤害 | additive |
| `pen_ratio` / `pen_value` | 穿透率 / 穿透值 | additive |
| `anomaly_proficiency` | 异常精通 | additive |
| `anomaly_mastery` | 异常掌控 | base+pct |
| `energy_regen` | 能量自动回复 | base+pct |
| `dmg_bonus` | 属性伤害加成 | additive |
| `sheer_force` | 贯穿力 | derived |
| `sharpen_crit` / `sharpen_dmg` | 锐暴伤害 / 锐化伤害 | derived |

### B. 公式速查

```text
面板：ATK = (base_agent + base_core + base_engine) × (1 + Σpct) + Σflat
防御区 = 794 / (794 + max(0, 敌防 × (1 - 无视防御 - 减防) × (1 - 穿透率) - 穿透值))
异常 = ATK × 增伤 × 防御 × 抗性 × 失衡 × (AP/100) × 等级区 × 异常倍率 × (1+异常增伤) × 异常暴击
异放 = ATK × (1 + 异放增伤 + 异常增伤) × 异放倍率 × 防御 × 抗性 × 失衡 × (AP/100) × 等级区 × 综合暴击
紊乱 = 异常基础 × (4.5 + 剩余跳数 × 0.5)
```

### C. 数据源清单

- 代理人图鉴：https://baike.mihoyo.com/zzz/wiki/channel/map/2/43
- 音擎图鉴：https://baike.mihoyo.com/zzz/wiki/channel/map/2/45
- 邦布图鉴：https://baike.mihoyo.com/zzz/wiki/channel/map/2/44
- 驱动盘图鉴：https://baike.mihoyo.com/zzz/wiki/channel/map/2/46
- 阵营/角色介绍：https://zzz.mihoyo.com/character?id=166519
- 官方玩法合集：https://baike.mihoyo.com/zzz/wiki/channel/map/66/68
- 三方前瞻：https://zzz.gachabase.net/ 、https://zzz.nanoka.cc/

### D. 参考代码索引（本地克隆）

| 主题 | 文件 |
| --- | --- |
| 有效词条计数 | `C:\code\_zzz_research\zzz_calculator\webapp\src\utils\driveDiscSubstats.ts` |
| 菲欧妮伤害测试（oracle） | `...\zzz_calculator\tests\fioni-damage.test.js` |
| 菲欧妮结构化数据 | `...\zzz_calculator\data\agents.json`（`id=fioni`） |
| 异放模型 | `...\zzz_calculator\core\anomalyRelease.js` |
| 乘区公式文档 | `C:\code\_zzz_research\zzz-hp\CALCULATOR_FORMULAS.md` §5–§7 |
| 伤害实现 | `...\zzz-hp\zzz-hp\src\utils\damageCalc.ts` |
| 旧面板规则 | `C:\code\zzz-panelAndstrategy\docs\design\calculation-rules.md` |
| 旧菲欧妮攻略 | `...\strategy\phoenix\data\phoenix.strategy.toml` |
| 旧抓取脚本 | `...\.github\skills\zzz-wiki-sync\scripts\refresh_*.py`、`agent-strategy\scripts\scrape_agent_guide.py` |

### E. 第一天行动清单

1. `git init`、`pnpm create vite`（vue-ts）、提交 M0 骨架。
2. 建 `docs/` 并提交本文与 `01-data-contract.md` 草稿。
3. 抽取旧项目 `agents.json` + `weapons.json` + `drive-discs.json` + `bangboo.json` 到 `data/codex/`，写最小校验器。
4. 迁移 `phoenix.json` 到新 schema，跑通「菲欧妮详情页」静态渲染。
5. 用菲欧妮的 8 个媒体键跑通 `assets:sync → assets:check`，确认 WebP 质量、体积与透明通道。
6. 用旧项目毕业面板 spec 手算一次，确认面板引擎输入输出。

### F. 术语表

| 术语 | 含义 |
| --- | --- |
| 0+1 | 影画 0 级 + 专武精炼 1 阶；「1+1」即 1 影 1 精 |
| 有效词条 | 落在角色 `effectiveStats` 白名单内的副词条条数，仅用于展示 |
| 小词条 | 固定生命/攻击/防御、穿透值等有收益但非核心的条数 |
| 灼蚀 | 菲欧妮核心被动施加的减益：使敌人受到的属性异常伤害可暴击 |
| 异放（Release） | 用固定倍率替换异常倍率基底的结算类型 |
| 紊乱（Disorder） | 在已有异常上触发另一种异常时的结算，倍率随时间补偿 |
| 参考轴 | 人工编排的 20s 事件序列，用于横向比较，不是战斗模拟 |
| 局外面板 | 不含战斗内 Buff 的最终面板，即角色详情页展示的面板 |

### G. 参考报告（本轮调研产物）

| 报告 | 内容 |
| --- | --- |
| `C:\code\_zzz_research\reports\01-zzz-calculator.md` | 有效词条三层、面板两基期、伤害/异放/紊乱、菲欧妮对拍数值 |
| `C:\code\_zzz_research\reports\02-zzz-hp.md` | 乘区公式、FlowEntry、Buff 模型、菲欧妮数据拍平问题 |
| `C:\code\_zzz_research\reports\03-old-project.md` | 数据资产、抓取接口、攻略契约、18 条「不要继承」 |

---

> **一句话总结**：用静态 Vue 重建「官方图鉴 + 菲欧妮攻略」，以 `data/` 单一真源和 `core/` 单一计算核心支撑「面板 → 有效词条 → 伤害 → 配置对比」，把旧项目的双端重复、运行时依赖和混乱数据形态全部砍掉。
