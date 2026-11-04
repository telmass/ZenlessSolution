<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Agent } from '@/types/agent'
import type { PanelResult } from '@/core/panel/types'
import { computePanel } from '@/core/panel/compute'
import { graduation30, graduation54, inputFromSpec, type BuildSpec } from '@/core/panel/presets'
import {
  computePhoenixDamage,
  computeSingleRelease,
  enemies,
  enemyById,
  type CritMode,
  type DamageBuild,
  type PhoenixDamage,
} from '@/core/damage'

const props = defineProps<{ agent: Agent }>()

interface DamageConfig {
  id: string
  label: string
  cinema: number
  engineId: string
  refinement: number
  spec: BuildSpec
  note: string
}

interface ComputedConfig extends DamageConfig {
  panel: PanelResult
  build: DamageBuild
  damage: PhoenixDamage
}

const CONFIGS: DamageConfig[] = [
  {
    id: '0+1',
    label: '0+1',
    cinema: 0,
    engineId: 'ep-2259',
    refinement: 1,
    spec: graduation54,
    note: '0 影画 + 专武精 1',
  },
  {
    id: '1+1',
    label: '1+1',
    cinema: 1,
    engineId: 'ep-2259',
    refinement: 1,
    spec: graduation54,
    note: '关键影画 C1',
  },
  {
    id: '2+1',
    label: '2+1',
    cinema: 2,
    engineId: 'ep-2259',
    refinement: 1,
    spec: graduation54,
    note: '主流毕业 C2',
  },
  {
    id: '4+1',
    label: '4+1',
    cinema: 4,
    engineId: 'ep-2259',
    refinement: 1,
    spec: graduation54,
    note: 'C4 额外异放',
  },
  {
    id: '6+1',
    label: '6+1',
    cinema: 6,
    engineId: 'ep-2259',
    refinement: 1,
    spec: graduation54,
    note: '上限 C6',
  },
  {
    id: '0+0',
    label: '0+0',
    cinema: 0,
    engineId: 'ep-1883',
    refinement: 1,
    spec: graduation54,
    note: '壳中之灵，无专武',
  },
  {
    id: '0+1 朔月',
    label: '0+1 朔月',
    cinema: 0,
    engineId: 'ep-1964',
    refinement: 1,
    spec: graduation54,
    note: '朔月裁霜，限定下位',
  },
  {
    id: '0+1 平民',
    label: '0+1 平民',
    cinema: 0,
    engineId: 'ep-2259',
    refinement: 1,
    spec: graduation30,
    note: '30 词条',
  },
  {
    id: 'A5',
    label: 'A5',
    cinema: 0,
    engineId: 'ep-212',
    refinement: 5,
    spec: graduation54,
    note: '双生泣星精 5',
  },
]

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
    }
    return {
      ...config,
      panel,
      build,
      damage: computePhoenixDamage(props.agent, panel.stats, build, enemy.value),
    }
  }),
)

const baseline = computed(() => all.value.find((item) => item.id === '0+1')!)
const visible = computed(() =>
  selected.value.map((id) => all.value.find((item) => item.id === id)).filter(Boolean) as ComputedConfig[],
)
const singleConfig = computed(() => visible.value[0] ?? baseline.value)
const ENGINE_NAMES: Record<string, string> = {
  'ep-2259': '涅槃初翎',
  'ep-1883': '壳中之灵',
  'ep-1964': '朔月裁霜',
  'ep-212': '双生泣星',
}

function engineName(item: ComputedConfig) {
  return ENGINE_NAMES[item.engineId] ?? item.label
}

function engineNote(item: ComputedConfig) {
  if (item.id === '0+1') return '专武基准'
  if (item.id === '0+0') return '无专武 · 白板'
  if (item.id === '0+1 朔月') return '限定下位 · 纯白板'
  if (item.id === 'A5') return 'A 级 · 零氪'
  return item.note
}
const single = computed(() =>
  computeSingleRelease(props.agent, singleConfig.value.panel.stats, singleConfig.value.build, enemy.value, singleMode.value),
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

function tick(item: ComputedConfig) {
  return item.damage.axis.events.find((event) => event.id === 'sear-tick')?.total ?? 0
}

const attribution = computed(() => {
  const map = new Map(all.value.map((item) => [item.id, item]))
  return [
    { from: '0+1', to: '1+1', label: 'C1' },
    { from: '1+1', to: '2+1', label: 'C2' },
    { from: '2+1', to: '4+1', label: 'C4' },
    { from: '4+1', to: '6+1', label: 'C6' },
  ].map((step) => {
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
    tick: tick(item),
    total: total(item),
    relative: relative(item),
  })),
)

const engineRows = computed(() => {
  const ids = ['0+1', '0+0', '0+1 朔月', 'A5']
  return ids
    .map((id) => all.value.find((item) => item.id === id))
    .filter((item): item is ComputedConfig => Boolean(item))
    .map((item) => ({
      ...item,
      relative: total(item) / total(baseline.value),
    }))
})

function markdown() {
  const header = ['指标', ...visible.value.map((item) => item.label)]
  const rows = [
    ['攻击力', ...visible.value.map((item) => format(item.panel.stats.atk, 1))],
    ['异常精通', ...visible.value.map((item) => format(item.panel.stats.anomalyProficiency, 1))],
    ['异常掌控', ...visible.value.map((item) => format(item.panel.stats.anomalyMastery, 1))],
    ['单次异放', ...visible.value.map((item) => format(item.damage.single.total))],
    ['灼蚀 tick', ...visible.value.map((item) => format(tick(item)))],
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
      <p class="damage-note">
        20 秒参考轴，技能固定 12 级、核心 F、驱动盘与主词条固定。轴长与事件次数是假设，不是实战模拟。
      </p>
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
        :title="config.note"
        @click="toggle(config.id)"
      >
        {{ config.label }}
      </button>
      <button class="damage-copy" @click="copyMarkdown">{{ copied ? '已复制' : '复制 Markdown' }}</button>
    </div>

    <section class="damage-single">
      <div class="damage-single__head">
        <div>
          <span class="damage-kicker">单次焚罪异放 · 失衡 1.5×</span>
          <b class="num">{{ format(single.total) }}</b>
        </div>
        <div class="damage-modes" role="group" aria-label="暴击口径">
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
      <p class="damage-meta" :title="enemy.note">
        {{ singleConfig.label }} · {{ enemy.label }} · {{ singleMode === 'expected' ? '期望' : singleMode === 'crit' ? '必暴' : '不暴' }}
      </p>
    </section>

    <section class="damage-engines">
      <div class="damage-engines__head">
        <h3>音擎对比</h3>
        <span>仅攻略推荐音擎 · 专武精 1 = 100%</span>
      </div>
      <div class="damage-table-wrap">
        <table class="damage-table">
          <thead>
            <tr>
              <th>音擎</th>
              <th>单次异放</th>
              <th>轴总伤</th>
              <th>相对专武</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in engineRows" :key="item.id" :class="{ 'is-total': item.id === '0+1' }">
              <th>
                {{ engineName(item) }}
                <small>精 {{ item.refinement }} · {{ engineNote(item) }}</small>
              </th>
              <td class="num">{{ format(item.damage.single.total) }}</td>
              <td class="num">{{ format(total(item)) }}</td>
              <td class="num">{{ percent(item.relative) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="damage-meta">
        同为 0 影画、54 词条、标准木桩、20s 参考轴；不带入其他未推荐音擎。
      </p>
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
            <th>灼蚀 tick</th>
            <td v-for="item in metricRows" :key="item.id" class="num">{{ format(item.tick) }}</td>
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
      <p class="damage-meta">同一 54 词条预算、技能 12 级；音擎/词条差异不计入影画归因。</p>
      <div class="damage-steps">
        <div v-for="step in attribution" :key="step.from">
          <span>{{ step.label }} · {{ step.from }} → {{ step.to }}</span>
          <b class="num" :class="{ 'is-negative': step.value < 0 }">
            {{ step.value >= 0 ? '+' : '' }}{{ (step.value * 100).toFixed(1) }}%
          </b>
        </div>
      </div>
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

    <div class="damage-assumptions">
      <h3>口径与假设</h3>
      <ul>
        <li v-for="item in baseline.damage.axis.assumptions" :key="item">{{ item }}</li>
        <li>{{ enemy.label }}：{{ enemy.note }}</li>
      </ul>
    </div>
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

.damage-note {
  max-width: 76ch;
  color: var(--muted);
  font-size: var(--fs-13);
  line-height: 1.75;
}

.damage-enemy {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  color: var(--muted);
  font-size: var(--fs-12);
}

.damage-enemy select {
  padding: 7px 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--fs-12);
}

.damage-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.damage-chip,
.damage-copy {
  padding: 7px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--fs-12);
  transition: all var(--dur-fast) var(--ease-out);
}

.damage-chip:hover,
.damage-copy:hover {
  border-color: var(--line-strong);
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
  border-color: var(--line-strong);
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
  font-size: var(--fs-11);
  letter-spacing: 0.08em;
}

.damage-single b {
  display: block;
  margin-top: 2px;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-36);
  font-weight: 700;
  line-height: 1;
}

.damage-modes {
  display: flex;
  gap: 4px;
}

.damage-modes button {
  padding: 4px 9px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--fs-11);
}

.damage-modes button.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.damage-meta {
  color: var(--muted);
  font-size: var(--fs-11);
  line-height: 1.7;
}

.damage-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--line);
}

.damage-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: var(--fs-12);
}

.damage-table th,
.damage-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.damage-table thead th {
  color: var(--muted);
  font-size: var(--fs-11);
  font-weight: 500;
}

.damage-table thead th small {
  display: block;
  margin-top: 2px;
  color: var(--line-strong);
  font-size: 9px;
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
  font-size: 9px;
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
  font-size: 9px;
  font-style: normal;
}

.damage-attribution,
.damage-assumptions,
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
  font-size: var(--fs-18);
  font-weight: 600;
}

.damage-engines__head span {
  color: var(--muted);
  font-size: var(--fs-11);
}

.damage-attribution h3,
.damage-assumptions h3 {
  font-family: var(--font-display);
  font-size: var(--fs-18);
  font-weight: 600;
}

.damage-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--line);
}

.damage-steps > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px 10px 0;
  border-bottom: 1px solid var(--line);
}

.damage-steps span {
  color: var(--muted);
  font-size: var(--fs-11);
}

.damage-steps b {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
}

.damage-steps b.is-negative {
  color: var(--danger);
}

.damage-events summary {
  color: var(--muted);
  font-size: var(--fs-12);
  cursor: pointer;
}

.damage-events[open] summary {
  margin-bottom: var(--s3);
}

.damage-assumptions ul {
  display: grid;
  gap: 4px;
  padding-left: 16px;
  color: var(--muted);
  font-size: var(--fs-11);
  line-height: 1.7;
}

@media (max-width: 820px) {
  .damage-toolbar {
    flex-direction: column;
  }

  .damage-single__head {
    align-items: flex-start;
  }

  .damage-steps {
    grid-template-columns: 1fr;
  }

  .damage-copy {
    margin-left: 0;
  }
}
</style>
