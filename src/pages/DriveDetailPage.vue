<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import setsData from '@/data/codex/sets.json'
import type { DriveSetDetail } from '@/types/codex'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'
import { mainStatsFor } from '@/core/panel/data'

const route = useRoute()
const sets = setsData as unknown as DriveSetDetail[]
const set = computed(() => sets.find((item) => item.id === route.params.id))
const slots = [4, 5, 6] as const
</script>

<template>
  <div class="detail container">
    <template v-if="set">
      <nav class="crumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/drives">驱动盘</RouterLink>
        <span>/</span>
        <b>{{ set.name }}</b>
      </nav>

      <header class="detail-hero">
        <div class="detail-hero__icon">
          <img :src="media(`set:${set.name}:icon`)" :alt="set.name" />
        </div>
        <div>
          <p class="detail-hero__kicker">驱动盘套装</p>
          <h1>{{ set.name }}</h1>
          <div class="detail-hero__badges">
            <span v-if="set.effect2Id" class="tag tag--accent">二件套计入面板</span>
            <span v-else class="tag">二件套为条件/增伤</span>
            <span class="tag">4 + 2</span>
          </div>
        </div>
      </header>

      <section class="detail-section">
        <h2>套装效果</h2>
        <div class="detail-block">
          <p class="effect-name">2 件套</p>
          <RichText :text="set.effect2 || '该套装没有可计入局外面板的二件套效果。'" class="detail-note" />
        </div>
        <div class="detail-block">
          <p class="effect-name">4 件套</p>
          <RichText :text="set.effect4 || '暂无记录。'" class="detail-note" />
        </div>
        <p class="detail-note">
          4 件套效果默认只在局内生效；局外面板只计二件套中属于面板属性的部分。
        </p>
      </section>

      <section class="detail-section">
        <div class="detail-section__head">
          <h2>主词条池</h2>
          <span>1–3 号位固定：生命 +2200 / 攻击 +316 / 防御 +184</span>
        </div>
        <div class="mainstat-grid">
          <div v-for="slot in slots" :key="slot">
            <p class="effect-name">{{ slot }} 号位</p>
            <table class="detail-table">
              <tbody>
                <tr v-for="rule in mainStatsFor(slot)" :key="rule.id">
                  <td>{{ rule.label }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="detail-note">
          <RouterLink to="/agents/phoenix#build">去菲欧妮配装计算器 →</RouterLink>
        </p>
        <p v-if="set.source" class="detail-note">
          <a :href="set.source" target="_blank" rel="noreferrer">官方 WIKI 条目 ↗</a>
        </p>
      </section>
    </template>

    <div v-else class="codex-empty">
      <p>没有找到该驱动盘套装。</p>
      <RouterLink to="/drives">返回驱动盘图鉴 →</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.detail-block {
  padding: 14px 0;
  border-top: 1px solid var(--line);
}

.detail-block:last-of-type {
  border-bottom: 1px solid var(--line);
}

.mainstat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s6);
}

@media (max-width: 820px) {
  .mainstat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
