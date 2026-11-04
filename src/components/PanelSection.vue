<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { Agent } from '@/types/agent'
import type { StatId } from '@/core/panel/types'
import { computePanel } from '@/core/panel/compute'
import { engines, mainStatsFor, sets, STAT_LABELS, STAT_UNITS, substats } from '@/core/panel/data'
import { formatStat } from '@/core/panel/format'
import { coreBonusFor, graduation54, presets, type BuildSpec } from '@/core/panel/presets'
import { analyzeSubstats, PHOENIX_PROFILE } from '@/core/substats'
import { media } from '@/lib/media'

const props = defineProps<{ agent: Agent }>()

const coreLevels: BuildSpec['coreLevel'][] = ['A', 'B', 'C', 'D', 'E', 'F']

const spec = reactive<BuildSpec>({
  ...graduation54,
  mainStats: { ...graduation54.mainStats },
  substats: { ...graduation54.substats },
})

const expanded = ref<StatId | null>(null)
const includePenValue = ref(false)

const effective = computed(() =>
  analyzeSubstats(spec.substats, PHOENIX_PROFILE, {
    includePenValue: includePenValue.value,
    budget: spec.budget || 54,
  }),
)

function tierFor(id: string) {
  const row = effective.value.rows.find((item) => item.id === id)
  if (row) return row.tier
  if (PHOENIX_PROFILE.effective.includes(id)) return 'effective'
  if (PHOENIX_PROFILE.small.includes(id)) return 'small'
  return 'invalid'
}

function tierLabel(id: string) {
  return { effective: '有效', small: '小', invalid: '无效' }[tierFor(id)]
}

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
    <div class="panel-toolbar">
      <p class="panel-note">
        只计算基础面板、核心技基础属性、音擎基础值与高级属性、驱动盘的二件套；其余等局内效果不计入。
      </p>
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
        <section class="form__group">
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

        <section class="form__group">
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

        <section class="form__group">
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

        <section class="form__group">
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
                <em class="sub__tier" :class="`sub__tier--${tierFor(rule.id)}`">{{ tierLabel(rule.id) }}</em>
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

      <aside class="result">
        <header class="result__head">
          <h3>计算结果</h3>
          <span class="result__tag">局外</span>
        </header>

        <section class="result__effective">
          <header class="effective__head">
            <h4>有效词条</h4>
            <label class="effective__toggle">
              <input v-model="includePenValue" type="checkbox" />
              穿透值计入
            </label>
          </header>

          <div class="effective__nums">
            <div>
              <b class="num">{{ effective.effective }}</b>
              <span>有效</span>
            </div>
            <div>
              <b class="num">{{ effective.small }}</b>
              <span>小词条</span>
            </div>
            <div>
              <b class="num">{{ effective.invalid }}</b>
              <span>无效</span>
            </div>
            <div>
              <b class="num">{{ effective.total }}</b>
              <span>总条数</span>
            </div>
          </div>

          <div class="effective__bar" aria-hidden="true">
            <span
              class="effective__bar-effective"
              :style="{ width: `${(effective.effective / Math.max(1, effective.total)) * 100}%` }"
            ></span>
            <span
              class="effective__bar-small"
              :style="{ width: `${(effective.small / Math.max(1, effective.total)) * 100}%` }"
            ></span>
            <span
              class="effective__bar-invalid"
              :style="{ width: `${(effective.invalid / Math.max(1, effective.total)) * 100}%` }"
            ></span>
          </div>

          <p class="effective__note">
            {{ effective.effective }} 有效 + {{ effective.small }} 小 + {{ effective.invalid }} 无效 · 共
            {{ effective.total }} / {{ effective.budget }} 条
          </p>
          <p v-if="effective.overBudget" class="effective__warn">
            超出 {{ effective.budget }} 条预算
          </p>

          <details class="effective__detail">
            <summary>口径与分配</summary>
            <ul>
              <li v-for="row in effective.rows" :key="row.id">
                <span>{{ row.label }} × {{ row.rolls }}</span>
                <em :class="`sub__tier--${row.tier}`">{{ tierLabel(row.id) }}</em>
              </li>
            </ul>
            <p>
              有效：异常精通、攻击力%；小词条：攻击力、穿透值；其余无效。穿透值可切换计入有效。该口径只用于展示，
              不进入面板或伤害计算。
            </p>
          </details>
        </section>

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
  gap: var(--s5);
}

.panel-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s5);
  padding-bottom: var(--s4);
  border-bottom: 1px solid var(--line);
}

.panel-note {
  max-width: none;
  color: var(--muted);
  font-size: var(--fs-13);
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
  font-size: var(--fs-12);
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
  gap: var(--s7);
  align-items: start;
}

.form {
  display: grid;
  min-width: 0;
}

.form__group {
  padding: var(--s5) 0;
  border-top: 1px solid var(--line);
}

.form__group:first-child {
  padding-top: 0;
  border-top: 0;
}

.form__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s4);
  margin-bottom: var(--s4);
}

.form__head h3 {
  font-family: var(--font-display);
  font-size: var(--fs-16);
  font-weight: 600;
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
  margin-top: var(--s3);
  padding-top: var(--s3);
  border-top: 1px solid var(--line);
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
  display: grid;
  grid-template-columns: auto auto;
  justify-content: start;
  align-items: baseline;
  column-gap: 6px;
}

.sub__label b {
  font-size: 12px;
  font-weight: 500;
}

.sub__tier {
  padding: 0 3px;
  border: 1px solid var(--line-strong);
  color: var(--muted);
  font-size: 9px;
  font-style: normal;
  line-height: 1.5;
}

.sub__tier--effective {
  border-color: rgba(240, 223, 78, 0.45);
  color: var(--accent);
}

.sub__tier--small {
  border-color: rgba(143, 183, 255, 0.35);
  color: #8fb7ff;
}

.sub__tier--invalid {
  color: var(--line-strong);
}

.sub__label small {
  grid-column: 1 / -1;
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
  top: calc(var(--header-h) + var(--chapter-nav-h) + 16px);
  padding: var(--s5);
  border: 1px solid var(--line);
  background: var(--surface);
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

.result__effective {
  margin: var(--s3) 0 var(--s2);
  padding: var(--s3) 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.effective__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
}

.effective__head h4 {
  font-family: var(--font-display);
  font-size: var(--fs-16);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.effective__toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--muted);
  font-size: 10px;
  cursor: pointer;
}

.effective__toggle input {
  width: 12px;
  height: 12px;
  accent-color: var(--accent);
}

.effective__bar {
  display: flex;
  height: 6px;
  margin: var(--s3) 0;
  background: var(--line);
}

.effective__bar-effective {
  background: var(--accent);
}

.effective__bar-small {
  background: #6d7688;
}

.effective__bar-invalid {
  background: var(--line-strong);
}

.effective__nums {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.effective__nums b {
  display: block;
  color: var(--text);
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  line-height: 1;
}

.result__effective .effective__nums b {
  font-size: var(--fs-18);
}

.effective__nums span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
}

.effective__note {
  margin-top: var(--s2);
  color: var(--text-2);
  font-size: var(--fs-11);
}

.effective__warn {
  margin-top: 2px;
  color: var(--danger);
  font-size: var(--fs-11);
}

.effective__detail {
  margin-top: var(--s2);
}

.effective__detail summary {
  color: var(--muted);
  font-size: 10px;
  cursor: pointer;
}

.effective__detail ul {
  display: grid;
  gap: 3px;
  margin: var(--s2) 0;
}

.effective__detail li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  font-size: 10px;
}

.effective__detail em {
  font-style: normal;
}

.effective__detail p {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
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
  margin-top: var(--s3);
  padding-top: var(--s3);
  border-top: 1px solid var(--danger);
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
  .panel-toolbar {
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

