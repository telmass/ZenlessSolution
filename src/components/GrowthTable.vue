<script setup lang="ts">
import { computed } from 'vue'
import type { GrowthTable } from '@/types/agent'

const props = defineProps<{
  table: GrowthTable
  levelIndex: number
  matrix: boolean
}>()

const groupsAtLevel = computed(() =>
  props.table.groups
    .map((group) => ({
      name: group.name,
      rows: group.rows
        .map((row) => ({ label: row.label, value: row.values[props.levelIndex] ?? '' }))
        .filter((row) => row.value !== ''),
    }))
    .filter((group) => group.rows.length > 0),
)

const levelCount = computed(() => props.table.levels.length)
</script>

<template>
  <div v-if="!matrix" class="growth">
    <section v-for="group in groupsAtLevel" :key="group.name" class="growth__group">
      <h4>{{ group.name }}</h4>
      <dl>
        <div v-for="row in group.rows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd class="num">{{ row.value }}</dd>
        </div>
      </dl>
    </section>
    <p v-if="groupsAtLevel.length === 0" class="growth__empty">该等级没有可展示的数值。</p>
  </div>

  <div v-else class="matrix" role="region" aria-label="全等级成长表" tabindex="0">
    <table>
      <thead>
        <tr>
          <th class="matrix__label">技能</th>
          <th
            v-for="(level, index) in table.levels"
            :key="level"
            class="num"
            :class="{ 'is-active': index === levelIndex }"
          >
            {{ level }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in table.groups" :key="group.name">
          <tr class="matrix__group">
            <th :colspan="levelCount + 1">{{ group.name }}</th>
          </tr>
          <tr v-for="row in group.rows" :key="row.label">
            <th class="matrix__label">{{ row.label }}</th>
            <td
              v-for="(value, index) in row.values"
              :key="index"
              class="num"
              :class="{ 'is-active': index === levelIndex }"
            >
              {{ value }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.growth {
  display: grid;
  gap: 18px;
}

.growth__group h4 {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.growth__group dl {
  border-top: 1px solid var(--line);
}

.growth__group dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 2px;
  border-bottom: 1px solid rgba(38, 38, 49, 0.6);
}

.growth__group dt {
  color: var(--text-2);
  font-size: 13px;
}

.growth__group dd {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.growth__empty {
  color: var(--muted);
  font-size: 13px;
}

.matrix {
  overflow: auto;
  max-height: 520px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.matrix table {
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}

.matrix th,
.matrix td {
  padding: 7px 10px;
  border-bottom: 1px solid rgba(38, 38, 49, 0.55);
  text-align: right;
}

.matrix thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--surface-3);
  color: var(--muted);
  font-weight: 500;
}

.matrix__label {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 140px;
  background: var(--surface-2);
  color: var(--text-2);
  text-align: left;
  font-weight: 400;
}

.matrix thead .matrix__label {
  z-index: 3;
  background: var(--surface-3);
}

.matrix__group th {
  padding-top: 14px;
  background: transparent;
  color: var(--accent);
  text-align: left;
  font-size: 11px;
  letter-spacing: 0.14em;
}

.matrix .is-active {
  background: rgba(242, 225, 76, 0.1);
  color: var(--accent);
}
</style>
