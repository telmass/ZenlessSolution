<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Agent } from '@/types/agent'
import type { PanelResult } from '@/core/panel/types'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation, type BuildSpec } from '@/core/panel/presets'
import {
  computeAgentDamage,
  computeAgentSingle,
  damageProfileFor,
  enemies,
  enemyById,
  type AgentDamage,
  type CritMode,
  type DamageBuild,
  type DamageConfigSpec,
} from '@/core/damage'

const props = defineProps<{ agent: Agent }>()

interface DamageConfig extends DamageConfigSpec {
  spec: BuildSpec
}

interface ComputedConfig extends DamageConfig {
  panel: PanelResult
  build: DamageBuild
  damage: AgentDamage
}

const profile = damageProfileFor(props.agent)
const graduation54 = specFromGraduation(props.agent, props.agent.guide.graduation!)
const graduation30 = props.agent.guide.graduationAlt?.panel
  ? specFromGraduation(props.agent, props.agent.guide.graduationAlt)
  : graduation54

const CONFIGS: DamageConfig[] = profile.configs.map((item) => ({
  ...item,
  spec: item.budget === 30 ? graduation30 : graduation54,
}))

const selected = ref(['0+1', '2+1', '4+1', '6+1'])
const enemyId = ref('standard')
const singleMode = ref<CritMode>('expected')
const copied = ref(false)

const enemy = computed(() => enemyById(enemyId.value))

const all = computed<ComputedConfig[]>(() =>
  CONFIGS.map((config) => {
    const spec = { ...config.spec, engineId: config.engineId }
    const panel = computePanel(inputFromSpec(props.agent, spec))
    const build: DamageBuild = {
      cinema: config.cinema,
      refinement: config.refinement,
      coreLevel: spec.coreLevel,
      engineId: config.engineId,
      // 4 件套的局内攻击% 不在本轴启用；如需（例如激素朋克 4 件）在这里计入。
      set4AtkPct: 0,
    }
    return {
      ...config,
      panel,
      build,
      damage: computeAgentDamage(props.agent, panel.stats, build, enemy.value),
    }
  }),
)

const baseline = computed(
  () => all.value.find((item) => item.id === '0+1') ?? all.value[0]!,
)
const visible = computed(
  () =>
    selected.value
      .map((id) => all.value.find((item) => item.id === id))
      .filter(Boolean) as ComputedConfig[],
)
const singleConfig = computed(() => visible.value[0] ?? baseline.value)

const ENGINE_NAMES: Record<string, string> = {
  'ep-2259': '涅槃初翎',
  'ep-1277': '飞鸟星梦',
  'ep-1883': '壳中之灵',
  'ep-1964': '朔月裁霜',
  'ep-212': '双生泣星',
  'ep-214': '嵌合编译器',
  'ep-210': '触电唇彩',
}

function engineName(item: ComputedConfig) {
  return ENGINE_NAMES[item.engineId] ?? item.label
}

const single = computed(() =>
  computeAgentSingle(
    props.agent,
    singleConfig.value.panel.stats,
    singleConfig.value.build,
    enemy.value,
    singleMode.value,
  ),
)

function toggle(id: string) {
  if (selected.value.includes(id)) {
    if (selected.value.length === 1) return
    selected.value = selected.value.filter((item) => item !== id)
    return
  }
  if (selected.value.length < 6) selected.value = [...selected.value, id]
}

function format(value: number, digits = 0) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function total(item: ComputedConfig) {
  return item.damage.axis.total
}

function relative(item: ComputedConfig) {
  return total(item) / total(baseline.value)
}

function highlightValue(item: ComputedConfig) {
  const event = item.damage.axis.events.find((entry) => entry.id === profile.highlight.eventId)
  if (!event) return 0
  return profile.highlight.mode === 'perHit' ? event.perHit : event.total
}

const attribution = computed(() => {
  const map = new Map(all.value.map((item) => [item.id, item]))
  return profile.attribution.map((step) => {
    const before = map.get(step.from)
    const after = map.get(step.to)
    return {
      ...step,
      value: before && after ? total(after) / total(before) - 1 : 0,
    }
  })
})

const metricRows = computed(() =>
  visible.value.map((item) => ({
    id: item.id,
    atk: item.panel.stats.atk,
    ap: item.panel.stats.anomalyProficiency,
    am: item.panel.stats.anomalyMastery,
    single: item.damage.single.total,
    highlight: highlightValue(item),
    total: total(item),
    relative: relative(item),
  })),
)

const engineRows = computed(() =>
  [baseline.value, ...all.value.filter((item) => item.kind === 'engine')].map((item) => ({
    ...item,
    relative: total(item) / total(baseline.value),
  })),
)

function markdown() {
  const header = ['指标', ...visible.value.map((item) => item.label)]
  const rows = [
    ['攻击力', ...visible.value.map((item) => format(item.panel.stats.atk, 1))],
    ['异常精通', ...visible.value.map((item) => format(item.panel.stats.anomalyProficiency, 1))],
    ['异常掌控', ...visible.value.map((item) => format(item.panel.stats.anomalyMastery, 1))],
    ['单次异放', ...visible.value.map((item) => format(item.damage.single.total))],
    [profile.highlight.label, ...visible.value.map((item) => format(highlightValue(item)))],
    ['轴总伤', ...visible.value.map((item) => format(total(item)))],
    ['相对基准', ...visible.value.map((item) => percent(relative(item)))],
  ]
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(markdown())
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1600)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div class="damage">
    <div class="damage-toolbar">
      <span class="damage-axis">20s 参考轴</span>
      <label class="damage-enemy">
        <span>敌人</span>
        <select v-model="enemyId">
          <option v-for="item in enemies" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </label>
    </div>

    <div class="damage-presets" role="group" aria-label="对比配置">
      <button
        v-for="config in CONFIGS"
        :key="config.id"
        class="damage-chip"
        :class="{ 'is-active': selected.includes(config.id) }"
        @click="toggle(config.id)"
      >
        {{ config.label }}
      </button>
      <button class="damage-copy" @click="copyMarkdown">{{ copied ? '已复制' : '复制 Markdown' }}</button>
    </div>

    <section class="damage-single">
      <div class="damage-single__head">
        <div>
          <span class="damage-kicker">{{ profile.singleTitle }}</span>
          <b class="num">{{ format(single.total) }}</b>
        </div>
        <div v-if="profile.critModes" class="damage-modes" role="group" aria-label="暴击计算方式">
          <button
            v-for="mode in (['expected', 'crit', 'none'] as const)"
            :key="mode"
            :class="{ 'is-active': singleMode === mode }"
            @click="singleMode = mode"
          >
            {{ mode === 'expected' ? '期望' : mode === 'crit' ? '必暴' : '不暴' }}
          </button>
        </div>
      </div>
      <p class="damage-meta">
        {{ singleConfig.label }} · {{ enemy.label }} ·
        {{ profile.critModes
          ? singleMode === 'expected'
            ? '期望'
            : singleMode === 'crit'
              ? '必暴'
              : '不暴'
          : '异放不吃暴击' }}
      </p>
    </section>

    <section class="damage-engines">
      <div class="damage-engines__head">
        <h3>音擎对比</h3>
        <span>专武精 1 = 100%</span>
      </div>
      <div class="damage-table-wrap">
        <table class="damage-table">
          <thead>
            <tr>
              <th>音擎</th>
              <th>局内 effect</th>
              <th class="num">单次异放</th>
              <th class="num">轴总伤</th>
              <th class="num">相对专武</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in engineRows" :key="item.id" :class="{ 'is-total': item.id === '0+1' }">
              <th>
                {{ engineName(item) }}
                <small>精 {{ item.refinement }}</small>
              </th>
              <td class="effect-cell">{{ item.engineEffect }}</td>
              <td class="num">{{ format(item.damage.single.total) }}</td>
              <td class="num">{{ format(total(item)) }}</td>
              <td class="num">{{ percent(item.relative) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="damage-note">{{ profile.engineNote }}</p>
    </section>

    <div class="damage-table-wrap">
      <table class="damage-table">
        <thead>
          <tr>
            <th>指标</th>
            <th v-for="item in visible" :key="item.id">
              {{ item.label }}
              <small>{{ item.note }}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>攻击力</th>
            <td v-for="item in metricRows" :key="item.id" class="num">{{ format(item.atk, 1) }}</td>
          </tr>
          <tr>
            <th>异常精通</th>
            <td v-for="item in metricRows" :key="item.id" class="num">{{ format(item.ap, 1) }}</td>
          </tr>
          <tr>
            <th>异常掌控</th>
            <td v-for="item in metricRows" :key="item.id" class="num">{{ format(item.am, 1) }}</td>
          </tr>
          <tr>
            <th>单次异放<small>失衡 1.5×</small></th>
            <td v-for="item in metricRows" :key="item.id" class="num">{{ format(item.single) }}</td>
          </tr>
          <tr>
            <th>{{ profile.highlight.label }}</th>
            <td v-for="item in metricRows" :key="item.id" class="num">
              {{ format(item.highlight) }}
            </td>
          </tr>
          <tr class="is-total">
            <th>轴总伤</th>
            <td v-for="item in metricRows" :key="item.id" class="num">{{ format(item.total) }}</td>
          </tr>
          <tr>
            <th>相对基准</th>
            <td v-for="item in metricRows" :key="item.id" class="num">
              {{ percent(item.relative) }}
              <em v-if="item.id !== '0+1'">+{{ ((item.relative - 1) * 100).toFixed(1) }}%</em>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="damage-attribution">
      <h3>影画增量归因</h3>
      <div class="damage-steps">
        <div v-for="step in attribution" :key="step.from">
          <span>{{ step.label }} · {{ step.from }} → {{ step.to }}</span>
          <b class="num" :class="{ 'is-negative': step.value < 0 }">
            {{ step.value >= 0 ? '+' : '' }}{{ (step.value * 100).toFixed(1) }}%
          </b>
        </div>
      </div>
    </section>

    <section class="damage-assumptions">
      <h3>口径</h3>
      <ul>
        <li v-for="line in baseline.damage.axis.assumptions" :key="line">{{ line }}</li>
      </ul>
    </section>

    <details class="damage-events">
      <summary>基准 0+1 事件明细与乘区</summary>
      <div class="damage-table-wrap">
        <table class="damage-table">
          <thead>
            <tr>
              <th>事件</th>
              <th>次</th>
              <th>单次</th>
              <th>小计</th>
              <th>倍率</th>
              <th>防御区</th>
              <th>暴击区</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in baseline.damage.axis.events" :key="event.id">
              <td>{{ event.label }}</td>
              <td class="num">{{ event.count }}</td>
              <td class="num">{{ format(event.perHit) }}</td>
              <td class="num">{{ format(event.total) }}</td>
              <td class="num">{{ (event.multiplier * 100).toFixed(1) }}%</td>
              <td class="num">{{ event.zones.defZone.toFixed(4) }}</td>
              <td class="num">
                {{ (event.type === 'release' ? event.zones.releaseCritZone : event.type === 'anomaly' ? event.zones.anomalyCritZone : event.zones.critZone).toFixed(3) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<style scoped>
.damage {
  display: grid;
  gap: var(--s5);
  min-width: 0;
}

.damage-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s4);
  padding-bottom: var(--s4);
  border-bottom: 1px solid var(--line);
}

.damage-axis {
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.damage-enemy {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  color: var(--muted);
  font-size: var(--fs-14);
}

.damage-enemy select {
  min-height: 40px;
  padding: 7px 10px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--fs-14);
}

.damage-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.damage-chip,
.damage-copy {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 7px 12px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--fs-14);
  transition:
    color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out);
}

.damage-chip:hover,
.damage-copy:hover {
  border-color: var(--text-2);
  color: var(--text);
}

.damage-chip.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.damage-copy {
  margin-left: auto;
  border-color: var(--line-control);
}

.damage-single {
  display: grid;
  gap: 4px;
  padding: var(--s4) var(--s5);
  border: 1px solid var(--line);
  background:
    linear-gradient(120deg, rgba(240, 223, 78, 0.05), transparent 55%),
    var(--surface);
}

.damage-single__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s4);
}

.damage-kicker {
  display: block;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.damage-single b {
  display: block;
  margin-top: 2px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-52);
  font-weight: 700;
  line-height: 1;
}

.damage-modes {
  display: flex;
  gap: 4px;
}

.damage-modes button {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 4px 10px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--fs-14);
}

.damage-modes button.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.damage-meta {
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

.damage-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--line);
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.damage-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: var(--fs-14);
}

.damage-table th,
.damage-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.damage-table th.num,
.damage-table td.num {
  text-align: right;
}

.damage-table thead th {
  color: var(--muted);
  font-size: var(--fs-12);
  font-weight: 500;
}

.damage-table thead th small {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
  font-weight: 400;
}

.damage-table tbody th {
  color: var(--text-2);
  font-weight: 500;
}

.damage-table tbody th small {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
  font-weight: 400;
}

.damage-table td {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.damage-table tr.is-total td,
.damage-table tr.is-total th {
  color: var(--accent);
  font-weight: 600;
}

.damage-table td em {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
  font-style: normal;
}

.damage-attribution,
.damage-engines {
  display: grid;
  gap: 6px;
}

.damage-engines__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s4);
}

.damage-engines__head h3 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.damage-engines__head span {
  color: var(--muted);
  font-size: var(--fs-12);
}

.damage-engines .damage-table {
  min-width: 820px;
}

.effect-cell {
  color: var(--text-2) !important;
  font-size: var(--fs-12);
}

.damage-attribution h3 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.damage-steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--s6);
  border-top: 1px solid var(--line);
}

.damage-steps > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 12px 0;
  border-bottom: 1px solid var(--line);
}

.damage-steps span {
  color: var(--muted);
  font-size: var(--fs-12);
}

.damage-steps b {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-28);
  font-weight: 600;
}

.damage-steps b.is-negative {
  color: var(--danger);
}

.damage-note {
  margin-top: 8px;
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

.damage-assumptions {
  padding: var(--s4) var(--s5);
  border: 1px solid var(--line);
  background: var(--surface);
}

.damage-assumptions h3 {
  margin-bottom: var(--s2);
  font-family: var(--font-display);
  font-size: var(--fs-18);
  font-weight: 600;
}

.damage-assumptions ul {
  display: grid;
  gap: 4px;
  max-width: var(--measure-wide);
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

.damage-events summary {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  color: var(--muted);
  font-size: var(--fs-14);
  cursor: pointer;
}

.damage-events[open] summary {
  margin-bottom: var(--s3);
}

@media (max-width: 820px) {
  .damage-toolbar {
    flex-direction: column;
  }

  .damage-single__head {
    align-items: flex-start;
  }

  .damage-single b {
    font-size: var(--fs-36);
  }

  .damage-steps {
    grid-template-columns: 1fr;
  }

  .damage-copy {
    margin-left: 0;
  }

  .damage-chip,
  .damage-copy,
  .damage-enemy select {
    min-height: 44px;
  }

  .damage-modes button {
    min-height: 44px;
  }

  .damage-events summary {
    min-height: 44px;
  }
}
</style>
