<script setup lang="ts">
import index from '@/data/agents/index.json'
import type { AgentIndexItem } from '@/types/agent'
import { media, mediaColor } from '@/lib/media'

const agents = index as unknown as AgentIndexItem[]
</script>

<template>
  <div class="list container">
    <header class="list__head">
      <p class="eyebrow">Agent Codex</p>
      <h1>代理人</h1>
      <p class="list__sub">
        官方图鉴复刻进行中。当前完整接入 <b>{{ agents.length }}</b> 位代理人，其余角色将随数据管线逐步补齐。
      </p>
    </header>

    <div class="grid">
      <RouterLink
        v-for="agent in agents"
        :key="agent.slug"
        :to="`/agents/${agent.slug}`"
        class="agent-card card"
      >
        <div class="agent-card__media" :style="{ background: mediaColor(agent.avatar) }">
          <img :src="media(agent.avatar)" :alt="agent.name" loading="lazy" />
          <span class="agent-card__rank num">{{ agent.rarity }}</span>
        </div>
        <div class="agent-card__body">
          <h2>{{ agent.name }}</h2>
          <p class="agent-card__full">{{ agent.fullName }}</p>
          <div class="agent-card__meta">
            <span class="tag tag--fire">{{ agent.element }}</span>
            <span class="tag">{{ agent.specialty }}</span>
            <span class="muted">{{ agent.faction }}</span>
          </div>
        </div>
      </RouterLink>

      <div class="agent-card agent-card--soon card">
        <div class="agent-card__soon">
          <span class="num">+</span>
          <p>更多代理人接入中</p>
          <small>音擎 / 驱动盘 / 邦布图鉴同步建设中</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list {
  padding-top: 54px;
}

.list__head h1 {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 64px);
  letter-spacing: 0.03em;
}

.list__sub {
  max-width: 60ch;
  margin-top: 10px;
  color: var(--muted);
}

.list__sub b {
  color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 40px;
}

.agent-card {
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.agent-card:hover {
  transform: translateY(-3px);
  border-color: var(--line-strong);
}

.agent-card__media {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.agent-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.agent-card:hover .agent-card__media img {
  transform: scale(1.04);
}

.agent-card__rank {
  position: absolute;
  top: 10px;
  left: 10px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 14px;
  font-weight: 800;
  clip-path: polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%);
}

.agent-card__body {
  padding: 16px 18px 18px;
}

.agent-card__body h2 {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.04em;
}

.agent-card__full {
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.agent-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 11px;
}

.agent-card--soon {
  display: grid;
  place-items: center;
  min-height: 320px;
  border-style: dashed;
  background: transparent;
}

.agent-card__soon {
  padding: 30px;
  text-align: center;
}

.agent-card__soon span {
  color: var(--line-strong);
  font-size: 48px;
  line-height: 1;
}

.agent-card__soon p {
  margin-top: 10px;
  color: var(--muted);
  font-size: 13px;
}

.agent-card__soon small {
  display: block;
  margin-top: 4px;
  color: #5d5d68;
  font-size: 11px;
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
