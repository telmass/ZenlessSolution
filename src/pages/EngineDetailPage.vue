<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import enginesData from '@/data/codex/engines.json'
import type { EngineDetail } from '@/types/codex'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'
import { setPageMeta } from '@/lib/seo'

const route = useRoute()
const engines = enginesData as unknown as EngineDetail[]
const engine = computed(() => engines.find((item) => item.id === route.params.id))
const refinement = ref(1)

watchEffect(() => {
  if (engine.value) setPageMeta(engine.value.name, engine.value.effect.text.slice(0, 120))
})

const effectText = computed(() => {
  const effect = engine.value?.effect
  if (!effect) return ''
  return effect.refinements.find((item) => item.level === refinement.value)?.text || effect.text
})

const hasRefinements = computed(() => (engine.value?.effect.refinements.length ?? 0) > 0)
</script>

<template>
  <div class="detail container">
    <template v-if="engine">
      <nav class="crumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/engines">音擎</RouterLink>
        <span>/</span>
        <b>{{ engine.name }}</b>
      </nav>

      <header class="detail-hero">
        <div class="detail-hero__icon">
          <img :src="media(`engine:${engine.id}:icon`)" :alt="engine.name" />
        </div>
        <div>
          <p class="detail-hero__kicker">{{ engine.trait }} · {{ engine.rank }} 级音擎</p>
          <h1>{{ engine.name }}</h1>
          <div class="detail-hero__badges">
            <span class="tag tag--accent">{{ engine.rank }}</span>
            <span class="tag">{{ engine.trait }}</span>
          </div>
          <div class="detail-stats">
            <div class="detail-stat">
              <span>基础攻击力</span>
              <b class="num">{{ engine.baseAtk }}</b>
            </div>
            <div v-if="engine.baseDef" class="detail-stat">
              <span>基础防御力</span>
              <b class="num">{{ engine.baseDef }}</b>
            </div>
            <div v-if="engine.subStat" class="detail-stat">
              <span>高级属性</span>
              <b class="num">
                {{ engine.subStat.label }}
                {{ engine.subStat.kind === 'pct' ? `${engine.subStat.value}%` : `+${engine.subStat.value}` }}
              </b>
            </div>
          </div>
        </div>
      </header>

      <section class="detail-section">
        <div class="detail-section__head">
          <h2>音擎特效</h2>
          <div v-if="hasRefinements" class="refine-control">
            <span>精炼</span>
            <div class="refinements" role="group" aria-label="精炼阶数">
              <button
                v-for="level in [1, 2, 3, 4, 5]"
                :key="level"
                :class="{ 'is-active': refinement === level }"
                @click="refinement = level"
              >
                R{{ level }}
              </button>
            </div>
          </div>
        </div>

        <p class="effect-name">{{ engine.effect.name }}</p>
        <RichText :text="effectText" class="detail-prose" />
        <p class="detail-note">
          音擎特效仅在局内生效；基础攻击力与高级属性计入局外面板。精炼提升特效数值，不改变白值与高级属性。
        </p>
      </section>

      <section class="detail-section">
        <h2>获取方式</h2>
        <p class="detail-note">{{ engine.acquisition || '暂无记录' }}</p>
        <p class="detail-note">
          <a :href="engine.source" target="_blank" rel="noreferrer">官方 WIKI 条目 ↗</a>
        </p>
      </section>
    </template>

    <div v-else class="empty-state">
      <p class="eyebrow">Not Found</p>
      <p class="empty-state__title">没有找到该音擎</p>
      <p class="empty-state__copy">该链接可能已失效，或音擎尚未收录。返回图鉴重新选择。</p>
      <div class="empty-state__actions">
        <RouterLink to="/engines" class="empty-state__link">返回音擎图鉴 →</RouterLink>
      </div>
    </div>
  </div>
</template>
