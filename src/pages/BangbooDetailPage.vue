<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import bangbooData from '@/data/codex/bangboo.json'
import type { BangbooDetail } from '@/types/codex'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'
import { setPageMeta } from '@/lib/seo'

const route = useRoute()
const bangboo = bangbooData as unknown as BangbooDetail[]
const item = computed(() => bangboo.find((entry) => entry.slug === route.params.slug))

watchEffect(() => {
  if (item.value) setPageMeta(item.value.name, item.value.descriptionZh || item.value.description)
})

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
    { label: '异常掌控', value: raw.anomalyMastery, unit: '' },
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
          <p v-if="item.descriptionZh" class="detail-note">{{ item.descriptionZh }}</p>
          <p v-else class="detail-note" lang="en">{{ item.description || '暂无档案描述。' }}</p>
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
        <p class="detail-note">邦布属性为图鉴初始值，不随代理人面板变化。</p>
      </section>

      <section v-if="item.skills.length" class="detail-section">
        <h2>技能</h2>
        <div class="bangboo-skills">
          <article v-for="(skill, index) in item.skills" :key="index" class="bangboo-skill">
            <header class="bangboo-skill__head">
              <span class="skill-tab">{{ skill.tab }}</span>
              <h3>{{ skill.title || item.name }}</h3>
            </header>
            <RichText :text="skill.desc" class="detail-prose" />
            <div v-if="skill.detail" class="skill-detail">
              <span class="skill-detail__label">Lv.1 详细数据</span>
              <p v-for="line in skill.detail.split('\n')" :key="line">{{ line }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="detail-section">
        <h2>档案</h2>
        <p v-if="item.description" class="detail-note detail-note--en" lang="en">{{ item.description }}</p>
        <p v-if="item.wikiId" class="detail-note">
          <a
            :href="`https://baike.mihoyo.com/zzz/wiki/content/${item.wikiId}/detail?mhy_presentation_style=fullscreen`"
            target="_blank"
            rel="noreferrer"
          >
            官方 WIKI 条目 ↗
          </a>
        </p>
      </section>
    </template>

    <div v-else class="empty-state">
      <p class="eyebrow">Not Found</p>
      <p class="empty-state__title">没有找到该邦布</p>
      <p class="empty-state__copy">该链接可能已失效，或邦布尚未收录。返回图鉴重新选择。</p>
      <div class="empty-state__actions">
        <RouterLink to="/bangboo" class="empty-state__link">返回邦布图鉴 →</RouterLink>
      </div>
    </div>
  </div>
</template>
