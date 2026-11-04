<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import enginesData from '@/data/codex/engines.json'
import type { EngineDetail } from '@/types/codex'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'

const route = useRoute()
const engines = enginesData as unknown as EngineDetail[]
const engine = computed(() => engines.find((item) => item.id === route.params.id))
const refinement = ref(1)

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
          <div v-if="hasRefinements" class="refinements" role="group" aria-label="精炼阶数">
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

        <p class="effect-name">{{ engine.effect.name }}</p>
        <RichText :text="effectText" class="detail-prose" />
        <p v-if="!hasRefinements" class="detail-note">
          该音擎的官方文本未按精炼拆分，上方为 1–5 阶合并描述。
        </p>
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

    <div v-else class="codex-empty">
      <p>没有找到该音擎。</p>
      <RouterLink to="/engines">返回音擎图鉴 →</RouterLink>
    </div>
  </div>
</template>
