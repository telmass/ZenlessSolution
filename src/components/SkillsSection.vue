<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Agent, CoreTable, GrowthTable as GrowthTableData } from '@/types/agent'
import GrowthTable from '@/components/GrowthTable.vue'
import RichText from '@/components/RichText.vue'

const props = defineProps<{ agent: Agent }>()

const activeCategory = ref('basic')
const activeMove = ref(0)
const levelIndex = ref(11)
const coreRankIndex = ref(5)
const matrix = ref(false)

const category = computed(
  () => props.agent.skills.find((skill) => skill.key === activeCategory.value) ?? props.agent.skills[0],
)
const move = computed(() => category.value.moves[activeMove.value] ?? category.value.moves[0])
const isCore = computed(() => activeCategory.value === 'core')

const growth = computed<GrowthTableData | null>(() =>
  !isCore.value && move.value.table && 'groups' in move.value.table
    ? (move.value.table as GrowthTableData)
    : null,
)
const coreTable = computed<CoreTable | null>(() =>
  isCore.value && move.value.table && 'levels' in move.value.table
    ? (move.value.table as CoreTable)
    : null,
)

watch(activeCategory, () => {
  activeMove.value = 0
  matrix.value = false
})

const ranks = ['A', 'B', 'C', 'D', 'E', 'F']
</script>

<template>
  <div class="skills">
    <aside class="rail" aria-label="技能分类">
      <button
        v-for="skill in agent.skills"
        :key="skill.key"
        class="rail__item"
        :class="{ 'is-active': skill.key === activeCategory }"
        @click="activeCategory = skill.key"
      >
        <img :src="skill.icon" alt="" aria-hidden="true" />
        <span>{{ skill.name }}</span>
        <em>{{ skill.moves.length }}</em>
      </button>
    </aside>

    <div class="skills__body">
      <div class="moves" role="tablist" :aria-label="`${category.name}招式`">
        <button
          v-for="(item, index) in category.moves"
          :key="item.title"
          class="moves__item"
          :class="{ 'is-active': index === activeMove }"
          role="tab"
          :aria-selected="index === activeMove"
          @click="activeMove = index"
        >
          {{ item.title }}
        </button>
      </div>

      <article class="card detail">
        <header class="detail__head">
          <div>
            <p class="detail__kicker">{{ category.name }}</p>
            <h3>{{ move.title }}</h3>
          </div>
          <span v-if="!isCore" class="detail__level num">
            Lv.{{ levelIndex + 1 }}<small>/16</small>
          </span>
        </header>

        <RichText :text="move.text" class="detail__text" />

        <div v-if="!isCore && growth" class="detail__toolbar">
          <div class="levels" role="group" aria-label="技能等级">
            <button
              v-for="(item, index) in growth.levels"
              :key="item"
              class="levels__item num"
              :class="{ 'is-active': index === levelIndex }"
              @click="levelIndex = index"
            >
              {{ item }}
            </button>
          </div>
          <button class="toggle" :class="{ 'is-active': matrix }" @click="matrix = !matrix">
            {{ matrix ? '单级视图' : '全等级表' }}
          </button>
        </div>

        <div v-if="isCore && coreTable" class="detail__toolbar">
          <div class="levels" role="group" aria-label="核心技等级">
            <button
              v-for="(item, index) in coreTable.levels"
              :key="item.level"
              class="levels__item num"
              :class="{ 'is-active': index === coreRankIndex }"
              @click="coreRankIndex = index"
            >
              {{ item.level }}
            </button>
          </div>
        </div>

        <div class="detail__table">
          <GrowthTable
            v-if="growth"
            :table="growth"
            :level-index="levelIndex"
            :matrix="matrix"
          />
          <div v-else-if="coreTable" class="core-lines">
            <p
              v-for="(line, index) in coreTable.levels[coreRankIndex]?.lines"
              :key="index"
              class="core-lines__item"
            >
              <span class="core-lines__bullet" aria-hidden="true"></span>
              {{ line }}
            </p>
          </div>
          <p v-else class="detail__empty">该招式没有数值成长。</p>
        </div>

        <p class="detail__note">
          1–16 级为图鉴成长表；实战等级上限受影画影响（3 影 +2、5 影 +2，对应类别上限 14 / 16）。
        </p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.skills {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.rail {
  position: sticky;
  top: calc(var(--header-h) + 70px);
  display: grid;
  gap: 4px;
}

.rail__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-left: 2px solid transparent;
  color: var(--muted);
  font-size: 13px;
  text-align: left;
  transition: all 0.15s ease;
}

.rail__item img {
  width: 22px;
  height: 22px;
  opacity: 0.65;
}

.rail__item em {
  margin-left: auto;
  font-size: 10px;
  font-style: normal;
  opacity: 0.6;
}

.rail__item:hover {
  color: var(--text-2);
  background: var(--surface);
}

.rail__item.is-active {
  border-left-color: var(--accent);
  background: linear-gradient(90deg, var(--accent-soft), transparent);
  color: var(--text);
}

.rail__item.is-active img {
  opacity: 1;
}

.skills__body {
  min-width: 0;
}

.moves {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.moves__item {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 2px;
  color: var(--muted);
  font-size: 12px;
  transition: all 0.15s ease;
}

.moves__item:hover {
  border-color: var(--line-strong);
  color: var(--text-2);
}

.moves__item.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.detail {
  padding: 26px;
}

.detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.detail__kicker {
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.detail__head h3 {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.03em;
}

.detail__level {
  color: var(--accent);
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.detail__level small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}

.detail__text {
  margin: 18px 0;
}

.detail__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px dashed var(--line);
  border-bottom: 1px dashed var(--line);
}

.levels {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.levels__item {
  min-width: 28px;
  height: 26px;
  padding: 0 5px;
  border: 1px solid var(--line);
  border-radius: 2px;
  color: var(--muted);
  font-size: 11px;
  transition: all 0.12s ease;
}

.levels__item:hover {
  color: var(--text);
  border-color: var(--line-strong);
}

.levels__item.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

.toggle {
  flex-shrink: 0;
  padding: 5px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  color: var(--text-2);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.toggle:hover,
.toggle.is-active {
  border-color: var(--accent);
  color: var(--accent);
}

.detail__table {
  margin-top: 18px;
}

.core-lines {
  display: grid;
  gap: 8px;
}

.core-lines__item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 2px;
  background: var(--bg-soft);
  color: var(--text-2);
  font-size: 13px;
}

.core-lines__bullet {
  width: 4px;
  height: 4px;
  margin-top: 9px;
  flex-shrink: 0;
  background: var(--accent);
}

.detail__empty {
  color: var(--muted);
  font-size: 13px;
}

.detail__note {
  margin-top: 16px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .skills {
    grid-template-columns: 1fr;
  }

  .rail {
    position: static;
    display: flex;
    overflow-x: auto;
    gap: 6px;
    padding-bottom: 4px;
  }

  .rail__item {
    flex: 0 0 auto;
    border-left: 0;
    border-bottom: 2px solid transparent;
  }

  .rail__item.is-active {
    border-left: 0;
    border-bottom-color: var(--accent);
    background: transparent;
  }
}
</style>
