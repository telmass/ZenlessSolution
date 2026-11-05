<script setup lang="ts">
import { computed, ref } from 'vue'
import index from '@/data/codex/engines.index.json'
import type { EngineIndexItem } from '@/types/codex'
import { media } from '@/lib/media'

const engines = index as unknown as EngineIndexItem[]

const search = ref('')
const rank = ref('全部')
const trait = ref('全部')

const ranks = ['全部', 'S', 'A', 'B']
const traits = ['全部', ...Array.from(new Set(engines.map((item) => item.trait))).filter(Boolean)]

const filtered = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return engines.filter((item) => {
    if (rank.value !== '全部' && item.rank !== rank.value) return false
    if (trait.value !== '全部' && item.trait !== trait.value) return false
    if (!keyword) return true
    return `${item.name} ${item.id}`.toLowerCase().includes(keyword)
  })
})

function rankClass(value: string) {
  return value === 'A' ? 'rank-tag--a' : value === 'B' ? 'rank-tag--b' : ''
}

function substatText(item: EngineIndexItem) {
  if (!item.subStat) return '无副词条'
  return `${item.subStat.label} ${item.subStat.kind === 'pct' ? `${item.subStat.value}%` : `+${item.subStat.value}`}`
}

function reset() {
  search.value = ''
  rank.value = '全部'
  trait.value = '全部'
}
</script>

<template>
  <div class="codex container">
    <header class="codex-head">
      <div>
        <h1>音擎</h1>
        <p>基础攻击、高级属性与精炼特效。点击查看 1–5 阶完整描述。</p>
      </div>
      <div class="codex-head__count num">
        {{ engines.length }}
        <small>W-ENGINES</small>
      </div>
    </header>

    <div class="codex-toolbar">
      <label class="codex-search">
        <span class="sr-only">搜索音擎</span>
        <input v-model="search" type="search" placeholder="搜索音擎名称…" />
      </label>

      <div class="chips" role="group" aria-label="评级筛选">
        <span class="filter-label">评级</span>
        <button
          v-for="item in ranks"
          :key="item"
          class="chip"
          :class="{ 'is-active': rank === item }"
          :aria-pressed="rank === item"
          @click="rank = item"
        >
          {{ item }}
        </button>
      </div>

      <div class="chips" role="group" aria-label="职业筛选">
        <span class="filter-label">职业</span>
        <button
          v-for="item in traits"
          :key="item"
          class="chip"
          :class="{ 'is-active': trait === item }"
          :aria-pressed="trait === item"
          @click="trait = item"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <div v-if="filtered.length" class="codex-grid">
      <RouterLink
        v-for="item in filtered"
        :key="item.id"
        :to="`/engines/${item.id}`"
        class="codex-card"
      >
        <div class="codex-card__icon">
          <img
            v-if="media(`engine:${item.id}:icon`)"
            :src="media(`engine:${item.id}:icon`)"
            :alt="item.name"
            loading="lazy"
          />
          <span v-else class="codex-card__fallback num">{{ item.rank }}</span>
        </div>
        <div class="codex-card__body">
          <div class="codex-card__name">
            <b>{{ item.name }}</b>
            <span class="rank-tag num" :class="rankClass(item.rank)">{{ item.rank }}</span>
          </div>
          <p class="codex-card__meta">
            {{ item.trait }} · 基础攻击 {{ item.baseAtk }}
          </p>
          <p class="codex-card__meta">{{ substatText(item) }}</p>
        </div>
      </RouterLink>
    </div>

    <div v-else class="codex-empty">
      <p class="eyebrow">No Match</p>
      <p class="empty-state__title">没有匹配的音擎</p>
      <p class="empty-state__copy">换个关键词，或清除评级 / 职业筛选。</p>
      <button type="button" class="filter-reset" @click="reset">清除筛选</button>
    </div>
  </div>
</template>
