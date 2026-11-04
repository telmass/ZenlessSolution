<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import phoenix from '@/data/agents/phoenix.json'
import type { Agent } from '@/types/agent'
import AgentHero from '@/components/AgentHero.vue'
import OverviewSection from '@/components/OverviewSection.vue'
import SkillsSection from '@/components/SkillsSection.vue'
import CinemasSection from '@/components/CinemasSection.vue'
import GuideSection from '@/components/GuideSection.vue'
import PanelSection from '@/components/PanelSection.vue'

const route = useRoute()
const router = useRouter()

const agent = phoenix as unknown as Agent

const tabs = [
  { id: 'overview', label: '概览', en: 'OVERVIEW' },
  { id: 'skills', label: '技能', en: 'SKILLS' },
  { id: 'cinemas', label: '影画', en: 'CINEMA' },
  { id: 'guide', label: '攻略', en: 'GUIDE' },
  { id: 'build', label: '配装', en: 'BUILD' },
] as const

type TabId = (typeof tabs)[number]['id']

const active = computed<TabId>(() => {
  const tab = route.query.tab
  return tabs.some((item) => item.id === tab) ? (tab as TabId) : 'overview'
})

function setTab(id: TabId) {
  const query = { ...route.query }
  if (id === 'overview') delete query.tab
  else query.tab = id
  router.replace({ query, hash: '' })
}

const notFound = computed(() => route.params.slug !== 'phoenix')
</script>

<template>
  <div v-if="!notFound" class="agent-page">
    <AgentHero :agent="agent" />

    <div class="tabs">
      <div class="tabs__inner container" role="tablist" aria-label="代理人内容">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="tabs__item"
          :class="{ 'is-active': active === tab.id }"
          role="tab"
          :aria-selected="active === tab.id"
          @click="setTab(tab.id)"
        >
          <span class="tabs__index num">0{{ index + 1 }}</span>
          <span class="tabs__label">{{ tab.label }}</span>
          <span class="tabs__en">{{ tab.en }}</span>
        </button>
      </div>
    </div>

    <div class="container agent-page__body">
      <OverviewSection v-if="active === 'overview'" :agent="agent" />
      <SkillsSection v-else-if="active === 'skills'" :agent="agent" />
      <CinemasSection v-else-if="active === 'cinemas'" :agent="agent" />
      <GuideSection v-else-if="active === 'guide'" :agent="agent" />
      <PanelSection v-else :agent="agent" />
    </div>
  </div>

  <div v-else class="container empty">
    <p class="eyebrow">Agent Not Found</p>
    <h1>该代理人尚未接入</h1>
    <p>当前先行复刻的是菲欧妮，其余代理人会在数据管线跑通后陆续开放。</p>
    <RouterLink to="/agents/phoenix" class="empty__link">查看菲欧妮 →</RouterLink>
  </div>
</template>

<style scoped>
.agent-page {
  min-height: 60vh;
}

.tabs {
  position: sticky;
  top: var(--header-h);
  z-index: 40;
  background: rgba(8, 8, 11, 0.9);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(12px);
}

.tabs__inner {
  display: flex;
  gap: 30px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs__inner::-webkit-scrollbar {
  display: none;
}

.tabs__item {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 16px 0 14px;
  color: var(--muted);
  white-space: nowrap;
  transition: color 0.15s ease;
}

.tabs__item:hover {
  color: var(--text-2);
}

.tabs__item.is-active {
  color: var(--text);
}

.tabs__item.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
}

.tabs__index {
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.1em;
  opacity: 0.7;
}

.tabs__label {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.06em;
}

.tabs__en {
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.18em;
}

.agent-page__body {
  padding-top: 34px;
}

.empty {
  padding: 120px 0;
}

.empty h1 {
  margin: 14px 0 10px;
  font-family: var(--font-display);
  font-size: 40px;
}

.empty p {
  max-width: 46ch;
  color: var(--muted);
}

.empty__link {
  display: inline-block;
  margin-top: 20px;
  color: var(--accent);
}

@media (max-width: 620px) {
  .tabs__inner {
    gap: 20px;
  }

  .tabs__en {
    display: none;
  }
}
</style>
