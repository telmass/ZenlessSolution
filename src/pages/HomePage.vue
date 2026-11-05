<script setup lang="ts">
import phoenix from '@/data/agents/phoenix.json'
import agentIndex from '@/data/agents/index.json'
import engineIndex from '@/data/codex/engines.index.json'
import setIndex from '@/data/codex/sets.index.json'
import bangbooIndex from '@/data/codex/bangboo.index.json'
import type { Agent } from '@/types/agent'
import { media, mediaColor } from '@/lib/media'

const agent = phoenix as unknown as Agent
const agents = agentIndex as unknown[]
const openAgents = (agentIndex as { available?: boolean }[]).filter((item) => item.available).length
const counts = {
  agents: agents.length,
  engines: (engineIndex as unknown[]).length,
  sets: (setIndex as unknown[]).length,
  bangboo: (bangbooIndex as unknown[]).length,
}
</script>

<template>
  <div class="home">
    <section class="masthead container">
      <div class="masthead__copy">
        <p class="eyebrow">Zenless Solution</p>
        <h1>
          代理人、图鉴与配装
          <span>一页查完。</span>
        </h1>
        <p class="masthead__lede">
          给绝区零玩家的静态资料库：官方图鉴复刻、代理人档案、攻略与配装计算，
          所有数据本地化，打开即读。
        </p>

        <div class="masthead__actions">
          <RouterLink to="/agents" class="btn btn--primary">
            进入代理人
            <span class="num">{{ String(counts.agents).padStart(2, '0') }}</span>
          </RouterLink>
          <RouterLink to="/agents/phoenix#build" class="btn btn--ghost">
            打开面板计算器
          </RouterLink>
        </div>

        <dl class="masthead__ledger">
          <div>
            <dt>音擎</dt>
            <dd class="num">{{ counts.engines }}</dd>
          </div>
          <div>
            <dt>驱动盘</dt>
            <dd class="num">{{ counts.sets }}</dd>
          </div>
          <div>
            <dt>邦布</dt>
            <dd class="num">{{ counts.bangboo }}</dd>
          </div>
          <div>
            <dt>图鉴条目</dt>
            <dd class="num">
              {{ counts.agents + counts.engines + counts.sets + counts.bangboo }}
            </dd>
          </div>
        </dl>
      </div>

      <aside class="spotlight" :style="{ '--tint': mediaColor(agent.assets.avatar) }">
        <div class="spotlight__top">
          <span>当前档案</span>
          <b class="num">01 / 61</b>
        </div>
        <div class="spotlight__art">
          <img
            :src="media(agent.assets.full)"
            :alt="`${agent.fullName} 全身立绘`"
            fetchpriority="high"
          />
        </div>
        <div class="spotlight__body">
          <p class="eyebrow">Phoenix</p>
          <h2>菲欧妮 <span class="num">S</span></h2>
          <p>火属性 · 异常 · 坎卜斯黑枝</p>
          <RouterLink to="/agents/phoenix" class="spotlight__link">
            打开档案 <span aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </aside>
    </section>

    <section class="home-section container">
      <header class="section-head">
        <h2>快速入口</h2>
        <span>4 个入口</span>
      </header>

      <div class="directory">
        <RouterLink to="/agents" class="entry">
          <span class="entry__index num">01</span>
          <b class="entry__count num">{{ String(counts.agents).padStart(2, '0') }}</b>
          <h3>代理人</h3>
          <p>档案 / 技能 / 影画 / 攻略 / 配装</p>
          <span class="entry__arrow" aria-hidden="true">→</span>
        </RouterLink>

        <RouterLink to="/engines" class="entry">
          <span class="entry__index num">02</span>
          <b class="entry__count num">{{ counts.engines }}</b>
          <h3>音擎</h3>
          <p>评级 / 基础攻击 / 高级属性 / 精炼 1–5</p>
          <span class="entry__arrow" aria-hidden="true">→</span>
        </RouterLink>

        <RouterLink to="/drives" class="entry">
          <span class="entry__index num">03</span>
          <b class="entry__count num">{{ counts.sets }}</b>
          <h3>驱动盘</h3>
          <p>二件套 / 四件套 / 主词条池</p>
          <span class="entry__arrow" aria-hidden="true">→</span>
        </RouterLink>

        <RouterLink to="/bangboo" class="entry">
          <span class="entry__index num">04</span>
          <b class="entry__count num">{{ counts.bangboo }}</b>
          <h3>邦布</h3>
          <p>评级 / 基础属性 / 技能与档案</p>
          <span class="entry__arrow" aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </section>

    <section class="workspace container">
      <div class="dossier">
        <header class="section-head">
          <h2>菲欧妮 · 当前复刻</h2>
          <span>菲欧妮 · 5 章</span>
        </header>

        <p class="dossier__lede">
          首个完整接入的代理人：从 60 级白板、核心技 A–F，到影画 1–6、
          加点、音擎、驱动盘、队伍与毕业面板。
        </p>

        <nav class="dossier__links" aria-label="菲欧妮档案章节">
          <RouterLink to="/agents/phoenix#overview" class="dossier__link">
            <span class="num">01</span>
            <b>概览</b>
            <small>面板 / 核心技</small>
          </RouterLink>
          <RouterLink to="/agents/phoenix#skills" class="dossier__link">
            <span class="num">02</span>
            <b>技能</b>
            <small>18 招式 / 倍率</small>
          </RouterLink>
          <RouterLink to="/agents/phoenix#cinemas" class="dossier__link">
            <span class="num">03</span>
            <b>影画</b>
            <small>L1–L6 / 关键 1·6</small>
          </RouterLink>
          <RouterLink to="/agents/phoenix#guide" class="dossier__link">
            <span class="num">04</span>
            <b>攻略</b>
            <small>音擎 / 驱动盘 / 队伍</small>
          </RouterLink>
          <RouterLink to="/agents/phoenix#build" class="dossier__link">
            <span class="num">05</span>
            <b>配装</b>
            <small>计算器 / 词条</small>
          </RouterLink>
        </nav>
      </div>

      <aside class="tools">
        <header class="section-head">
          <h2>工具</h2>
          <span>2 个工具</span>
        </header>

        <RouterLink to="/agents/phoenix#build" class="tool">
          <span class="tool__state">可用</span>
          <b>面板计算器</b>
          <small>核心 / 音擎 / 驱动盘 / 主副词条</small>
        </RouterLink>
        <RouterLink to="/agents/phoenix#guide" class="tool">
          <span class="tool__state">41 + 12 + 1</span>
          <b>有效词条</b>
          <small>异常精通 / 攻击力%</small>
        </RouterLink>
      </aside>
    </section>

    <section class="status container">
      <div>
        <span>数据更新</span>
        <b>{{ agent.updatedAt }}</b>
      </div>
      <div>
        <span>图鉴条目</span>
        <b class="num">{{ counts.agents + counts.engines + counts.sets + counts.bangboo }}</b>
      </div>
      <div>
        <span>已接入</span>
        <b class="num">{{ openAgents }} / {{ counts.agents }}</b>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding-bottom: 0;
}

/* masthead */
.masthead {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) 360px;
  gap: clamp(32px, 5vw, 72px);
  align-items: center;
  padding: var(--s8) 0;
  border-bottom: 1px solid var(--line);
}

.masthead__copy h1 {
  margin: var(--s4) 0 0;
  font-family: var(--font-display);
  font-size: clamp(var(--fs-36), 5.6vw, var(--fs-72));
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: var(--lh-display);
}

.masthead__copy h1 span {
  display: block;
  margin-top: 10px;
  color: var(--muted);
  font-size: clamp(var(--fs-22), 2vw, var(--fs-28));
  font-weight: 400;
  letter-spacing: 0.12em;
}

.masthead__lede {
  max-width: var(--measure);
  margin-top: var(--s4);
  color: var(--text-2);
  font-size: var(--fs-16);
  line-height: 1.8;
}

.masthead__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: var(--s5);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-14);
  font-weight: 600;
  letter-spacing: 0.04em;
  transition:
    transform var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--primary {
  background: var(--accent);
  color: var(--accent-ink);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%);
}

.btn--primary:hover {
  background: var(--accent-hover);
}

.btn--ghost {
  border: 1px solid var(--line-control);
  color: var(--text);
}

.btn--ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.masthead__ledger {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s4);
  margin: var(--s6) 0 0;
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.masthead__ledger dt {
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
}

.masthead__ledger dd {
  margin: 3px 0 0;
  font-size: var(--fs-22);
  font-weight: 600;
  line-height: 1.1;
}

/* spotlight */
.spotlight {
  position: relative;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
}

.spotlight__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
}

.spotlight__top b {
  color: var(--text-2);
  font-weight: 500;
  letter-spacing: 0.06em;
}

.spotlight__art {
  position: relative;
  flex: 1;
  min-height: 300px;
  background:
    radial-gradient(
      70% 52% at 50% 34%,
      color-mix(in srgb, var(--tint) 44%, transparent),
      transparent 72%
    ),
    linear-gradient(180deg, var(--surface-2), var(--surface));
}

.spotlight__art::after {
  content: "";
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 6%;
  height: 24px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55), transparent 70%);
  filter: blur(6px);
}

.spotlight__art img {
  position: absolute;
  inset: 4% 4% 0;
  width: 92%;
  height: 96%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 22px 28px rgba(0, 0, 0, 0.55));
  z-index: 1;
}

.spotlight__body {
  padding: var(--s4);
  border-top: 1px solid var(--line);
}

.spotlight__body h2 {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: var(--fs-28);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.05;
}

.spotlight__body h2 span {
  margin-left: 6px;
  color: var(--accent);
  font-size: var(--fs-14);
  vertical-align: 0.25em;
}

.spotlight__body p:not(.eyebrow) {
  margin-top: 3px;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.04em;
}

.spotlight__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  margin-top: var(--s2);
  color: var(--accent);
  font-size: var(--fs-14);
  letter-spacing: 0.04em;
}

.spotlight__link:hover {
  color: var(--text);
}

/* shared section head */
.home-section {
  padding-top: var(--s9);
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s4);
  padding-bottom: var(--s3);
  border-bottom: 1px solid var(--line);
}

.section-head h2 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.section-head span {
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.06em;
}

/* directory */
.directory {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s4);
  margin-top: var(--s4);
}

.entry {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 180px;
  padding: var(--s4);
  background: var(--surface);
  border: 1px solid var(--line);
  transition:
    transform var(--dur) var(--ease-out),
    border-color var(--dur) var(--ease-out);
}

.entry:hover {
  transform: translateY(-2px);
  border-color: var(--line-control);
}

.entry__index {
  position: absolute;
  top: 12px;
  right: 14px;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.entry__count {
  color: var(--accent);
  font-size: var(--fs-36);
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 0.95;
}

.entry h3 {
  margin-top: auto;
  font-family: var(--font-display);
  font-size: var(--fs-18);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.entry p {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.02em;
  line-height: 1.6;
}

.entry__arrow {
  position: absolute;
  right: 14px;
  bottom: 16px;
  color: var(--muted);
  font-size: var(--fs-16);
  transition:
    color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

.entry:hover .entry__arrow {
  color: var(--accent);
  transform: translateX(3px);
}

/* workspace */
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: clamp(32px, 4vw, 64px);
  padding-top: var(--s9);
}

.dossier__lede {
  max-width: var(--measure);
  margin-top: var(--s3);
  color: var(--text-2);
  font-size: var(--fs-16);
  line-height: 1.8;
}

.dossier__links {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: var(--s5);
  border-top: 1px solid var(--line);
}

.dossier__link {
  display: grid;
  gap: 2px;
  padding: var(--s3) 12px var(--s3) 0;
  border-bottom: 1px solid var(--line);
}

.dossier__link + .dossier__link {
  padding-left: 12px;
  border-left: 1px solid var(--line);
}

.dossier__link span {
  color: var(--accent);
  font-size: var(--fs-12);
  letter-spacing: 0.06em;
}

.dossier__link b {
  font-size: var(--fs-14);
  font-weight: 500;
}

.dossier__link small {
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.5;
}

.dossier__link:hover b {
  color: var(--accent);
}

/* tools */
.tools {
  padding-left: var(--s5);
  border-left: 1px solid var(--line);
}

.tools .section-head {
  padding-bottom: var(--s3);
}

.tool {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  padding: var(--s3) 0;
  border-bottom: 1px solid var(--line);
}

.tool b {
  font-size: var(--fs-14);
  font-weight: 500;
}

.tool small {
  grid-column: 1;
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.5;
}

.tool__state {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-12);
  letter-spacing: 0.06em;
}

a.tool:hover b {
  color: var(--accent);
}

/* status */
.status {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--s4) var(--s8);
  margin-top: var(--s9);
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.status div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status span {
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.status b {
  font-family: var(--font-display);
  font-size: var(--fs-14);
  font-weight: 600;
  letter-spacing: 0.02em;
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .tools {
    padding-left: 0;
    padding-top: var(--s6);
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  .tool {
    max-width: 480px;
  }
}

@media (max-width: 860px) {
  .masthead {
    grid-template-columns: 1fr;
  }

  .spotlight {
    max-width: 420px;
  }

  .directory {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dossier__links {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dossier__link:nth-child(4) {
    border-left: 0;
    padding-left: 0;
  }

  .dossier__link:nth-child(n + 4) {
    border-top: 1px solid var(--line);
  }
}

@media (max-width: 640px) {
  .masthead {
    padding-top: var(--s6);
  }

  .masthead__ledger {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--s3);
  }

  .directory {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s3);
  }

  .spotlight__link {
    min-height: 44px;
  }

  .entry {
    min-height: 150px;
    padding: var(--s3);
  }

  .workspace {
    padding-top: var(--s8);
  }

  .dossier__links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dossier__link:nth-child(3),
  .dossier__link:nth-child(5) {
    border-left: 0;
    padding-left: 0;
  }

  .dossier__link:nth-child(4) {
    border-left: 1px solid var(--line);
    padding-left: 12px;
  }

  .status {
    align-items: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .entry:hover,
  .btn:hover {
    transform: none;
  }
}
</style>
