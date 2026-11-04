<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Agent, CoreTable, GrowthTable as GrowthTableData } from '@/types/agent'
import { movePreview } from '@/core/skills/preview'
import GrowthTable from '@/components/GrowthTable.vue'
import RichText from '@/components/RichText.vue'

const props = defineProps<{ agent: Agent }>()

const openKey = ref('basic:0')
const levelIndex = ref(11)
const coreRankIndex = ref(5)
const matrix = ref(false)

function toggle(categoryKey: string, index: number) {
  const key = `${categoryKey}:${index}`
  openKey.value = openKey.value === key ? '' : key
  matrix.value = false
}

function isOpen(categoryKey: string, index: number) {
  return openKey.value === `${categoryKey}:${index}`
}

function growthOf(move: (typeof props.agent.skills)[number]['moves'][number], isCore: boolean) {
  if (!move.table) return null
  if (isCore && 'levels' in move.table) return move.table as CoreTable
  if (!isCore && 'groups' in move.table) return move.table as GrowthTableData
  return null
}

const categories = computed(() => props.agent.skills)
</script>

<template>
  <div class="skill-categories">
    <section
      v-for="(category, categoryIndex) in categories"
      :key="category.key"
      class="skill-category"
    >
      <header class="skill-category__head">
        <img :src="category.icon" alt="" aria-hidden="true" />
        <h3>{{ category.name }}</h3>
        <span class="skill-category__count num">{{ category.moves.length }} 式</span>
        <span class="skill-category__index num" aria-hidden="true">
          {{ String(categoryIndex + 1).padStart(2, '0') }}
        </span>
      </header>

      <ul class="move-list">
        <li
          v-for="(move, moveIndex) in category.moves"
          :key="move.title"
          class="move"
          :class="{ 'is-open': isOpen(category.key, moveIndex) }"
        >
          <button
            class="move__row"
            :aria-expanded="isOpen(category.key, moveIndex)"
            :aria-controls="`move-${category.key}-${moveIndex}`"
            @click="toggle(category.key, moveIndex)"
          >
            <span class="move__title">{{ move.title }}</span>

            <span v-if="!isOpen(category.key, moveIndex)" class="move__preview">
              <template v-if="movePreview(move).damage">
                <span>伤害 <b class="num">{{ movePreview(move).damage }}</b></span>
                <span v-if="movePreview(move).hits"> · {{ movePreview(move).hits }} 段</span>
              </template>
              <template v-if="movePreview(move).impact">
                <span>失衡 <b class="num">{{ movePreview(move).impact }}</b></span>
              </template>
            </span>

            <span class="move__toggle num" aria-hidden="true">
              {{ isOpen(category.key, moveIndex) ? '−' : '+' }}
            </span>
          </button>

          <div
            v-if="isOpen(category.key, moveIndex)"
            :id="`move-${category.key}-${moveIndex}`"
            class="move__detail"
            :class="{ 'has-growth': Boolean(growthOf(move, category.key === 'core')) }"
          >
            <div class="move__copy">
              <RichText :text="move.text" class="move__text" />
              <p class="move__note">
                1–16 级为图鉴成长表；实战等级上限受影画影响（3 影 +2、5 影 +2，对应类别上限 14 / 16）。
              </p>
            </div>

            <div v-if="growthOf(move, category.key === 'core')" class="move__growth">
              <div class="move__toolbar">
                <template v-if="category.key !== 'core'">
                  <div class="levels" role="group" aria-label="技能等级">
                    <button
                      v-for="(level, index) in (growthOf(move, false) as GrowthTableData).levels"
                      :key="level"
                      class="levels__item num"
                      :class="{ 'is-active': index === levelIndex }"
                      @click="levelIndex = index"
                    >
                      {{ level }}
                    </button>
                  </div>
                  <button class="matrix-toggle" :class="{ 'is-active': matrix }" @click="matrix = !matrix">
                    {{ matrix ? '单级视图' : '全等级表' }}
                  </button>
                </template>

                <div v-else class="levels" role="group" aria-label="核心技等级">
                  <button
                    v-for="(row, index) in (growthOf(move, true) as CoreTable).levels"
                    :key="row.level"
                    class="levels__item num"
                    :class="{ 'is-active': index === coreRankIndex }"
                    @click="coreRankIndex = index"
                  >
                    {{ row.level }}
                  </button>
                </div>
              </div>

              <div class="move__table">
                <GrowthTable
                  v-if="category.key !== 'core'"
                  :table="growthOf(move, false) as GrowthTableData"
                  :level-index="levelIndex"
                  :matrix="matrix"
                />
                <ul v-else class="core-lines">
                  <li
                    v-for="(line, index) in (growthOf(move, true) as CoreTable).levels[coreRankIndex]?.lines"
                    :key="index"
                  >
                    {{ line }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.skill-categories {
  display: grid;
  gap: var(--s9);
}

.skill-category__head {
  display: flex;
  align-items: baseline;
  gap: var(--s3);
  padding-bottom: var(--s3);
  border-bottom: 1px solid var(--line);
}

.skill-category__head img {
  width: 22px;
  height: 22px;
  opacity: 0.75;
  transform: translateY(3px);
}

.skill-category__head h3 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.skill-category__count {
  color: var(--muted);
  font-size: var(--fs-12);
}

.skill-category__index {
  margin-left: auto;
  color: var(--line-strong);
  font-size: var(--fs-18);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.move-list {
  display: grid;
}

.move {
  border-bottom: 1px solid var(--line);
}

.move__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 28px;
  align-items: baseline;
  gap: var(--s4);
  width: 100%;
  padding: 14px 0;
  text-align: left;
}

.move__title {
  color: var(--text-2);
  font-size: var(--fs-15);
  transition: color var(--dur-fast) var(--ease-out);
}

.move__row:hover .move__title,
.move.is-open .move__title {
  color: var(--text);
}

.move__preview {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: var(--fs-12);
  white-space: nowrap;
}

.move__preview b {
  color: var(--text-2);
  font-weight: 600;
}

.move__toggle {
  color: var(--line-strong);
  font-size: var(--fs-18);
  line-height: 1;
  text-align: right;
}

.move.is-open .move__toggle {
  color: var(--accent);
}

.move__detail {
  padding: 0 0 var(--s6);
}

.move__copy,
.move__growth {
  min-width: 0;
}

@media (min-width: 1200px) {
  .move__detail.has-growth {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: var(--s8);
    align-items: start;
  }

  .move__detail.has-growth .move__toolbar {
    margin-top: 0;
  }

  .move__copy {
    max-width: 60ch;
  }
}

.move__text {
  max-width: var(--measure);
}

.move__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s4);
  margin-top: var(--s4);
  padding: var(--s3) 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
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
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--fs-11);
  transition: all var(--dur-fast) var(--ease-out);
}

.levels__item:hover {
  border-color: var(--line-strong);
  color: var(--text);
}

.levels__item.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

.matrix-toggle {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: var(--fs-11);
  letter-spacing: 0.06em;
}

.matrix-toggle:hover,
.matrix-toggle.is-active {
  border-color: var(--accent);
  color: var(--accent);
}

.move__table {
  margin-top: var(--s4);
}

.core-lines {
  display: grid;
  gap: 6px;
}

.core-lines li {
  padding-left: 12px;
  border-left: 1px solid var(--line);
  color: var(--text-2);
  font-size: var(--fs-13);
  line-height: 1.7;
}

.move__note {
  margin-top: var(--s4);
  color: var(--muted);
  font-size: var(--fs-11);
}

@media (max-width: 720px) {
  .move__row {
    grid-template-columns: minmax(0, 1fr) 24px;
    row-gap: 3px;
  }

  .move__title {
    grid-column: 1;
  }

  .move__preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    grid-column: 1;
    font-size: var(--fs-11);
    white-space: normal;
  }

  .move__toggle {
    grid-column: 2;
    grid-row: 1;
  }

  .move__toolbar {
    flex-direction: column;
  }
}
</style>

