<script setup lang="ts">
import { computed, ref } from 'vue'
import index from '@/data/codex/sets.index.json'
import type { DriveSetIndexItem } from '@/types/codex'
import { media } from '@/lib/media'

const sets = index as unknown as DriveSetIndexItem[]

const search = ref('')
const panelOnly = ref(false)

const filtered = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return sets.filter((item) => {
    if (panelOnly.value && !item.effect2Id) return false
    if (!keyword) return true
    return `${item.name} ${item.effect2} ${item.effect4}`.toLowerCase().includes(keyword)
  })
})
</script>

<template>
  <div class="codex container">
    <header class="codex-head">
      <div>
        <h1>驱动盘</h1>
        <p>2 件套与 4 件套效果。标记「面板可计」的套装，其二件套会进入局外面板。</p>
      </div>
      <div class="codex-head__count num">
        {{ sets.length }}
        <small>DRIVE DISCS</small>
      </div>
    </header>

    <div class="codex-toolbar">
      <label class="codex-search">
        <span class="sr-only">搜索驱动盘</span>
        <input v-model="search" type="search" placeholder="搜索套装名称或效果…" />
      </label>

      <div class="chips">
        <button class="chip" :class="{ 'is-active': panelOnly }" @click="panelOnly = !panelOnly">
          仅看面板可计
        </button>
      </div>
    </div>

    <div v-if="filtered.length" class="codex-grid">
      <RouterLink
        v-for="item in filtered"
        :key="item.id"
        :to="`/drives/${item.id}`"
        class="codex-card"
      >
        <div class="codex-card__icon">
          <img
            v-if="media(`set:${item.name}:icon`)"
            :src="media(`set:${item.name}:icon`)"
            :alt="item.name"
            loading="lazy"
          />
          <span v-else class="codex-card__fallback">◈</span>
        </div>
        <div class="codex-card__body">
          <div class="codex-card__name">
            <b>{{ item.name }}</b>
            <span v-if="item.effect2Id" class="panel-tag">面板</span>
          </div>
          <p class="codex-card__meta codex-card__meta--clamp">{{ item.effect2 || '二件套为条件/增伤效果' }}</p>
        </div>
      </RouterLink>
    </div>

    <p v-else class="codex-empty">没有匹配的驱动盘。</p>
  </div>
</template>
