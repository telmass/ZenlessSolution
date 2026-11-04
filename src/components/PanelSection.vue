<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Agent } from '@/types/agent'
import type { StatId } from '@/core/panel/types'
import { computePanel } from '@/core/panel/compute'
import { engines, mainStatsFor, sets, STAT_LABELS, STAT_UNITS, substats } from '@/core/panel/data'
import { formatStat } from '@/core/panel/format'
import { coreBonusFor, graduation54, presets, type BuildSpec } from '@/core/panel/presets'
import { media } from '@/lib/media'

const props = defineProps<{ agent: Agent }>()

const coreLevels: BuildSpec['coreLevel'][] = ['A', 'B', 'C', 'D', 'E', 'F']

const spec = reactive<BuildSpec>({
  ...graduation54,
  mainStats: { ...graduation54.mainStats },
  substats: { ...graduation54.substats },
})

const expanded = ref<StatId | null>(null)

function applyPreset(preset: BuildSpec) {
  spec.id = preset.id
  spec.label = preset.label
  spec.budget = preset.budget
  spec.coreLevel = preset.coreLevel
  spec.engineId = preset.engineId
  spec.set4 = preset.set4
  spec.set2 = preset.set2
  spec.mainStats = { ...preset.mainStats }
  spec.substats = { ...preset.substats }
}

function setCount(id: string, delta: number) {
  const current = spec.substats[id] ?? 0
  spec.substats[id] = Math.min(36, Math.max(0, current + delta))
}

const totalRolls = computed(() =>
  Object.values(spec.substats).reduce((total, count) => total + Math.max(0, count), 0),
)

const result = computed(() =>
  computePanel({
    base: { ...props.agent.base },
    coreLevel: spec.coreLevel,
    coreBonus: coreBonusFor(props.agent, spec.coreLevel),
    engineId: spec.engineId || null,
    mainStats: { ...spec.mainStats },
    set4: spec.set4 || null,
    set2: spec.set2 || null,
    substats: { ...spec.substats },
  }),
)

const selectedSet4 = computed(() => sets.find((item) => item.id === spec.set4))
const selectedSet2 = computed(() => sets.find((item) => item.id === spec.set2))
const selectedEngine = computed(() => engines.find((item) => item.id === spec.engineId))

function toggleRow(stat: StatId) {
  expanded.value = expanded.value === stat ? null : stat
}

const keyStats: StatId[] = ['atk', 'anomalyProficiency', 'anomalyMastery']
</script>

<template>
  <div class="panel-section">
    <div class="panel-section__head">
      <div>
        <p class="eyebrow">Out-of-combat Panel</p>
        <h2>局外面板计算</h2>
        <p class="panel-section__sub">
          只计算基础面板、核心技基础属性、音擎基础值与高级属性、驱动盘与二件套；音擎特效、核心被动与四件套等局内效果不计入。
        </p>
      </div>
      <div class="presets">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="presets__item"
          :class="{ 'is-active': spec.id === preset.id }"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <div class="panel-section__grid">
      <div class="form">
        <section class="card form__card">
          <header class="form__head">
            <h3>核心技</h3>
            <span class="form__hint">A/C/E 异常掌控 · B/D/F 基础攻击</span>
          </header>
          <div class="pills">
            <button
              v-for="level in coreLevels"
              :key="level"
              class="pills__item"
              :class="{ 'is-active': spec.coreLevel === level }"
              @click="spec.coreLevel = level"
            >
              {{ level }}
            </button>
          </div>
        </section>

        <section class="card form__card">
          <header class="form__head">
            <h3>音擎</h3>
            <span class="form__hint">精炼不影响局外面板</span>
          </header>
          <div class="engines">
            <button
              v-for="engine in engines"
              :key="engine.id"
              class="engine"
              :class="{ 'is-active': spec.engineId === engine.id }"
              @click="spec.engineId = engine.id"
            >
              <img v-if="media(engine.icon)" :src="media(engine.icon)" :alt="engine.name" loading="lazy" />
              <span class="engine__body">
                <b>{{ engine.name }}</b>
                <small>
                  {{ engine.rank }} · 攻击 {{ engine.baseAtk }}
                  <template v-if="engine.subStat">· {{ engine.subStat.label }}{{ engine.subStat.kind === 'pct' ? ` ${engine.subStat.value}%` : ` +${engine.subStat.value}` }}</template>
                </small>
              </span>
            </button>
            <button
              class="engine engine--none"
              :class="{ 'is-active': !spec.engineId }"
              @click="spec.engineId = null"
            >
              <span class="engine__body">
                <b>不装备音擎</b>
                <small>白板对比用</small>
              </span>
            </button>
          </div>
        </section>

        <section class="card form__card">
          <header class="form__head">
            <h3>驱动盘</h3>
            <span class="form__hint">只支持 4 + 2</span>
          </header>

          <div class="field-grid">
            <label class="field">
              <span>4 件套</span>
              <select v-model="spec.set4">
                <option :value="null">不选择</option>
                <option v-for="set in sets" :key="set.id" :value="set.id">{{ set.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>2 件套</span>
              <select v-model="spec.set2">
                <option :value="null">不选择</option>
                <option v-for="set in sets" :key="set.id" :value="set.id">{{ set.name }}</option>
              </select>
            </label>
          </div>

          <div class="set-summary">
            <p v-if="selectedSet4">
              <b>{{ selectedSet4.name }}</b>
              <span>{{ selectedSet4.effect2 ? selectedSet4.effect2.label : '4 件套效果仅在局内生效' }}</span>
            </p>
            <p v-if="selectedSet2">
              <b>{{ selectedSet2.name }}</b>
              <span>{{ selectedSet2.effect2 ? selectedSet2.effect2.label : selectedSet2.effect2Text || '2 件套效果不计入面板' }}</span>
            </p>
          </div>

          <div class="field-grid field-grid--mains">
            <label v-for="slot in ([4, 5, 6] as const)" :key="slot" class="field">
              <span>{{ slot }} 号位主词条</span>
              <select v-model="spec.mainStats[slot]">
                <option v-for="rule in mainStatsFor(slot)" :key="rule.id" :value="rule.id">
                  {{ rule.label }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="card form__card">
          <header class="form__head">
            <h3>副词条</h3>
            <span class="form__hint">
              合计 <b class="num" :class="{ 'is-over': totalRolls > 54 }">{{ totalRolls }}</b> / 54 条
            </span>
          </header>

          <div class="subs">
            <div v-for="rule in substats" :key="rule.id" class="sub">
              <div class="sub__label">
                <b>{{ rule.label }}</b>
                <small>+{{ rule.value }}{{ rule.kind === 'pct' ? '%' : '' }}/条</small>
              </div>
              <div class="stepper">
                <button :aria-label="`减少${rule.label}`" @click="setCount(rule.id, -1)">−</button>
                <span class="num">{{ spec.substats[rule.id] ?? 0 }}</span>
                <button :aria-label="`增加${rule.label}`" @click="setCount(rule.id, 1)">＋</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="result card">
        <header class="result__head">
          <h3>计算结果</h3>
          <span class="result__tag">局外</span>
        </header>

        <div class="result__stats">
          <button
            v-for="stat in result.breakdown"
            :key="stat.stat"
            class="result__row"
            :class="{ 'is-key': keyStats.includes(stat.stat), 'is-open': expanded === stat.stat }"
            @click="toggleRow(stat.stat)"
          >
            <span class="result__label">
              {{ stat.label }}
              <i v-if="stat.sources.length" aria-hidden="true">{{ expanded === stat.stat ? '−' : '+' }}</i>
            </span>
            <b class="num">{{ formatStat(stat.value, stat.unit) }}</b>
          </button>
        </div>

        <div v-if="expanded" class="result__sources">
          <p class="result__sources-title">{{ STAT_LABELS[expanded] }} · 来源明细</p>
          <ul>
            <li v-for="(source, index) in result.breakdown.find((row) => row.stat === expanded)?.sources" :key="index">
              <span>{{ source.text }}</span>
              <em>{{ source.label }}</em>
            </li>
          </ul>
        </div>

        <ul v-if="result.warnings.length" class="result__warnings">
          <li v-for="warning in result.warnings" :key="warning">{{ warning }}</li>
        </ul>

        <p class="result__note">
          当前选择：{{ selectedEngine?.name ?? '无音擎' }} · 核心 {{ spec.coreLevel }} ·
          {{ selectedSet4?.name ?? '无 4 件套' }} + {{ selectedSet2?.name ?? '无 2 件套' }}
        </p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.panel-section {
  display: grid;
  gap: 22px;
}

.panel-section__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.panel-section__head h2 {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: clamp(30px, 4vw, 42px);
  letter-spacing: 0.03em;
}

.panel-section__sub {
  max-width: 68ch;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.presets__item {
  padding: 8px 14px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: 12px;
}

.presets__item:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.presets__item.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.panel-section__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 20px;
  align-items: start;
}

.form {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.form__card {
  padding: 20px 22px;
}

.form__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.form__head h3 {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.04em;
}

.form__hint {
  color: var(--muted);
  font-size: 11px;
}

.form__hint b {
  color: var(--accent);
}

.form__hint b.is-over {
  color: var(--danger);
}

.pills {
  display: flex;
  gap: 6px;
}

.pills__item {
  width: 34px;
  height: 30px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 12px;
}

.pills__item:hover {
  color: var(--text);
}

.pills__item.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

.engines {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.engine {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 240px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  background: var(--bg-soft);
  text-align: left;
}

.engine img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.engine__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.engine__body b {
  font-size: 13px;
  font-weight: 500;
}

.engine__body small {
  color: var(--muted);
  font-size: 10px;
}

.engine:hover {
  border-color: var(--line-strong);
}

.engine.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.engine--none {
  flex: 1 1 160px;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-grid--mains {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.field > span {
  color: var(--muted);
  font-size: 11px;
}

.field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-size: 12px;
}

.field select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.set-summary {
  display: grid;
  gap: 4px;
  margin-top: 12px;
  padding: 10px 12px;
  border-left: 2px solid var(--fire);
  background: rgba(255, 106, 61, 0.04);
}

.set-summary p {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.set-summary b {
  flex-shrink: 0;
  color: var(--text-2);
  font-weight: 500;
}

.set-summary span {
  color: var(--muted);
}

.subs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 18px;
}

.sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(38, 38, 49, 0.5);
}

.sub__label {
  display: flex;
  flex-direction: column;
}

.sub__label b {
  font-size: 12px;
  font-weight: 500;
}

.sub__label small {
  color: var(--muted);
  font-size: 10px;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stepper button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
  line-height: 1;
}

.stepper button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.stepper span {
  min-width: 26px;
  text-align: center;
  font-size: 13px;
}

.result {
  position: sticky;
  top: calc(var(--header-h) + 74px);
  padding: 20px 22px;
}

.result__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.result__head h3 {
  font-family: var(--font-display);
  font-size: 16px;
}

.result__tag {
  padding: 2px 7px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.1em;
}

.result__stats {
  margin-top: 6px;
}

.result__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 2px;
  border-bottom: 1px solid rgba(38, 38, 49, 0.55);
  text-align: left;
}

.result__row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.result__label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
}

.result__label i {
  color: var(--line-strong);
  font-size: 10px;
  font-style: normal;
}

.result__row b {
  color: var(--text-2);
  font-size: 15px;
  font-weight: 600;
}

.result__row.is-key b {
  color: var(--accent);
  font-size: 17px;
}

.result__row.is-open {
  background: var(--accent-soft);
}

.result__sources {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--bg-soft);
}

.result__sources-title {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.result__sources ul {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.result__sources li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
  color: var(--text-2);
}

.result__sources em {
  flex-shrink: 0;
  color: var(--muted);
  font-style: normal;
  font-size: 10px;
}

.result__warnings {
  display: grid;
  gap: 5px;
  margin-top: 12px;
  padding: 10px 12px;
  border-left: 2px solid var(--danger);
  background: rgba(255, 77, 79, 0.06);
}

.result__warnings li {
  color: #ffb3b4;
  font-size: 11px;
}

.result__note {
  margin-top: 14px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .panel-section__grid {
    grid-template-columns: 1fr;
  }

  .result {
    position: static;
  }
}

@media (max-width: 760px) {
  .panel-section__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .subs,
  .field-grid,
  .field-grid--mains {
    grid-template-columns: 1fr;
  }
}
</style>
