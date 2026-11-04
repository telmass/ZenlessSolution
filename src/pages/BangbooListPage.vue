<script setup lang="ts">
import { computed, ref } from 'vue'
import index from '@/data/codex/bangboo.index.json'
import type { BangbooIndexItem } from '@/types/codex'
import { media } from '@/lib/media'

const bangboo = index as unknown as BangbooIndexItem[]

const search = ref('')
const rank = ref('全部')
const ranks = ['全部', 'S', 'A', 'B']

const filtered = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return bangboo.filter((item) => {
    if (rank.value !== '全部' && item.rank !== rank.value) return false
    if (!keyword) return true
    return `${item.name} ${item.en} ${item.id}`.toLowerCase().includes(keyword)
  })
})

function rankClass(value: string) {
  return value === 'A' ? 'rank-tag--a' : value === 'B' ? 'rank-tag--b' : ''
}
</script>

<template>
  <div class="codex container">
    <header class="codex-head">
      <div>
        <h1>邦布</h1>
        <p>邦布的基础属性、代号与档案描述。技能文本仍在与官方 WIKI 条目做映射。</p>
      </div>
      <div class="codex-head__count num">
        {{ bangboo.length }}
        <small>BANGBOO</small>
      </div>
    </header>

    <div class="codex-toolbar">
      <label class="codex-search">
        <span class="sr-only">搜索邦布</span>
        <input v-model="search" type="search" placeholder="搜索邦布名称…" />
      </label>

      <div class="chips" role="group" aria-label="评级筛选">
        <button
          v-for="item in ranks"
          :key="item"
          class="chip"
          :class="{ 'is-active': rank === item }"
          @click="rank = item"
        >
          {{ item }}
        </button>
      </div>
    </div>

    <div v-if="filtered.length" class="codex-grid">
      <RouterLink
        v-for="item in filtered"
        :key="item.slug"
        :to="`/bangboo/${item.slug}`"
        class="codex-card"
      >
        <div class="codex-card__icon">
          <img
            v-if="media(`bangboo:${item.slug}:icon`)"
            :src="media(`bangboo:${item.slug}:icon`)"
            :alt="item.name"
            loading="lazy"
          />
          <span v-else class="codex-card__fallback">{{ item.name.slice(0, 1) }}</span>
        </div>
        <div class="codex-card__body">
          <div class="codex-card__name">
            <b>{{ item.name }}</b>
            <span class="rank-tag num" :class="rankClass(item.rank)">{{ item.rank }}</span>
          </div>
          <p class="codex-card__meta">{{ item.en }}</p>
          <p class="codex-card__meta codex-card__meta--clamp">
            {{ item.description || '暂无档案描述。' }}
          </p>
        </div>
      </RouterLink>
    </div>

    <p v-else class="codex-empty">没有匹配的邦布。</p>
  </div>
</template>
