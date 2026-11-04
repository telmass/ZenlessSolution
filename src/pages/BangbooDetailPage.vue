<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import bangbooData from '@/data/codex/bangboo.json'
import type { BangbooDetail } from '@/types/codex'
import { media } from '@/lib/media'

const route = useRoute()
const bangboo = bangbooData as unknown as BangbooDetail[]
const item = computed(() => bangboo.find((entry) => entry.slug === route.params.slug))

const stats = computed(() => {
  if (!item.value) return []
  const raw = item.value.stats
  return [
    { label: '生命值', value: raw.hp, unit: '' },
    { label: '攻击力', value: raw.atk, unit: '' },
    { label: '防御力', value: raw.def, unit: '' },
    { label: '冲击力', value: raw.impact, unit: '' },
    { label: '暴击率', value: raw.critRate, unit: '%' },
    { label: '暴击伤害', value: raw.critDmg, unit: '%' },
    { label: '穿透率', value: raw.penRatio, unit: '%' },
    { label: '异常精通', value: raw.anomalyProficiency, unit: '' },
  ]
})

function rankClass(value: string) {
  return value === 'A' ? 'rank-tag--a' : value === 'B' ? 'rank-tag--b' : ''
}
</script>

<template>
  <div class="detail container">
    <template v-if="item">
      <nav class="crumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/bangboo">邦布</RouterLink>
        <span>/</span>
        <b>{{ item.name }}</b>
      </nav>

      <header class="detail-hero">
        <div class="detail-hero__icon">
          <img
            v-if="media(`bangboo:${item.slug}:icon`)"
            :src="media(`bangboo:${item.slug}:icon`)"
            :alt="item.name"
          />
          <span v-else class="codex-card__fallback">{{ item.name.slice(0, 1) }}</span>
        </div>
        <div>
          <p class="detail-hero__kicker">{{ item.codename }} · {{ item.rank }} 级邦布</p>
          <h1>{{ item.name }}</h1>
          <div class="detail-hero__badges">
            <span class="tag tag--accent" :class="rankClass(item.rank)">{{ item.rank }}</span>
            <span class="tag">{{ item.en }}</span>
          </div>
          <p class="detail-note" lang="en">{{ item.description || '暂无档案描述。' }}</p>
        </div>
      </header>

      <section class="detail-section">
        <h2>基础属性</h2>
        <div class="bangboo-stats">
          <div v-for="stat in stats" :key="stat.label">
            <span>{{ stat.label }}</span>
            <b class="num">{{ stat.value }}{{ stat.unit }}</b>
          </div>
        </div>
        <p class="detail-note">邦布属性为图鉴基础值，不随代理人面板变化。</p>
      </section>

      <section class="detail-section">
        <h2>技能与档案</h2>
        <p class="detail-note">
          邦布的主动技能与中文档案仍在与官方 WIKI 条目做映射；当前展示基础属性与英文档案描述，技能文本待补。
        </p>
      </section>
    </template>

    <div v-else class="codex-empty">
      <p>没有找到该邦布。</p>
      <RouterLink to="/bangboo">返回邦布图鉴 →</RouterLink>
    </div>
  </div>
</template>
