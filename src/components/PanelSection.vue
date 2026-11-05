<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Agent } from '@/types/agent'
import type { StatId } from '@/core/panel/types'
import { computePanel } from '@/core/panel/compute'
import { engines, mainStatsFor, panelRules, sets, STAT_LABELS, STAT_UNITS, substats } from '@/core/panel/data'
import { formatStat } from '@/core/panel/format'
import { coreBonusFor, presetsFor, type BuildSpec } from '@/core/panel/presets'
import {
  MAX_ROLLS_PER_LINE,
  ROLLS_PER_DISC,
  canUpgrade,
  conflictsWithMain,
  discRolls,
  fromCounts,
  maxRollsFor,
  emptyDiscs,
  toCounts,
  totalRolls as sumDiscRolls,
  type Disc,
  type MainStatInfo,
} from '@/core/panel/discs'
import { analyzeSubstats } from '@/core/substats'
import { media } from '@/lib/media'

const props = defineProps<{ agent: Agent }>()

const coreLevels: BuildSpec['coreLevel'][] = ['A', 'B', 'C', 'D', 'E', 'F']

const rawPresets = presetsFor(props.agent)
const startSpec = rawPresets[0]
if (!startSpec) throw new Error(`${props.agent.slug}: no graduation preset`)

const spec = reactive<BuildSpec>({
  ...startSpec,
  mainStats: { ...startSpec.mainStats },
  substats: { ...startSpec.substats },
})

const mains = computed<MainStatInfo[]>(() => {
  const out: MainStatInfo[] = []
  for (const slot of [4, 5, 6] as const) {
    const rule = mainStatsFor(slot).find((item) => item.id === spec.mainStats[slot])
    if (rule) out.push({ slot, stat: rule.stat, kind: rule.kind })
  }
  return out
})

const presetList = computed(() =>
  rawPresets.filter((preset) => {
    try {
      fromCounts(preset.substats, substats, mains.value)
      return true
    } catch {
      return false
    }
  }),
)

let initialDiscs: Disc[] = emptyDiscs()
let initialError = ''
try {
  initialDiscs = fromCounts(startSpec.substats, substats, mains.value)
} catch (error) {
  initialError =
    `该毕业预算无法按「每盘选满 4 条副词条后再强化」展开：` +
    `${error instanceof Error ? error.message : String(error)}。` +
    '已切换为手动分配，请按 4 条/盘 自行选择。'
}

const presetError = ref(initialError)

function mainFor(slot: number) {
  return mains.value.find((item) => item.slot === slot)
}

function mainLabel(slot: number) {
  if (slot === 1) return `生命值 +${panelRules.discFixed.hp}`
  if (slot === 2) return `攻击力 +${panelRules.discFixed.atk}`
  if (slot === 3) return `防御力 +${panelRules.discFixed.def}`
  const key = slot as 4 | 5 | 6
  const rule = mainStatsFor(key).find((item) => item.id === spec.mainStats[key])
  return rule?.label ?? '未选择'
}

const discs = ref<Disc[]>(initialDiscs)

// 单盘分配是编辑口径，面板计算仍吃聚合条数。
watch(
  discs,
  (value) => {
    spec.substats = toCounts(value)
  },
  { deep: true, immediate: true },
)

// 换主词条后，清掉与该盘主词条冲突的副词条（游戏里两者不能同名）。
watch(
  () => [spec.mainStats[4], spec.mainStats[5], spec.mainStats[6]],
  () => {
    for (const disc of discs.value) {
      const main = mainFor(disc.slot)
      if (!main) continue
      disc.lines = disc.lines.filter((line) => {
        const rule = substats.find((item) => item.id === line.id)
        return !(rule && conflictsWithMain(rule, main))
      })
      if (disc.lines.length < 4) {
        for (const line of disc.lines) line.rolls = 1
      }
    }
  },
)

const profile = computed(() => props.agent.substatProfile)

/** Engines this agent's guide actually recommends, in guide order. */
const engineOptions = computed(() => {
  const order = new Map<string, number>()
  const add = (id: string) => {
    if (id && !order.has(id)) order.set(id, order.size)
  }
  for (const tier of props.agent.guide.weapons) for (const item of tier.items) add(item.engineId)
  for (const graduation of [props.agent.guide.graduation, props.agent.guide.graduationAlt]) {
    if (graduation?.panel) add(graduation.panel.engineId)
  }
  add(spec.engineId ?? '')
  return engines
    .filter((engine) => order.has(engine.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
})

const profileRows = computed(() =>
  substats
    .filter((rule) => profile.value.effective.includes(rule.id))
    .map((rule) => rule.label),
)

const smallRows = computed(() =>
  substats.filter((rule) => profile.value.small.includes(rule.id)).map((rule) => rule.label),
)

const coreHint = computed(() =>
  props.agent.corePassive.effects.map((effect) => effect.label).join(' · ') || 'A–F 逐级提升',
)

const expanded = ref<StatId | null>(null)
const includePenValue = ref(false)

const effective = computed(() =>
  analyzeSubstats(spec.substats, profile.value, {
    includePenValue: includePenValue.value,
    budget: spec.budget || 54,
  }),
)

function tierFor(id: string) {
  const row = effective.value.rows.find((item) => item.id === id)
  if (row) return row.tier
  if (profile.value.effective.includes(id)) return 'effective'
  if (profile.value.small.includes(id)) return 'small'
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
  try {
    discs.value = fromCounts(preset.substats, substats, mains.value)
    presetError.value = ''
  } catch (error) {
    presetError.value = error instanceof Error ? error.message : String(error)
  }
}

function lineAt(discIndex: number, lineIndex: number) {
  return discs.value[discIndex]?.lines[lineIndex]
}

function usedRolls(disc: Disc) {
  return discRolls(disc)
}

function lineRoom(disc: Disc, lineIndex: number) {
  const line = disc.lines[lineIndex]
  if (!line) return 0
  if (!canUpgrade(disc)) return 1
  const used = usedRolls(disc) - line.rolls
  return Math.min(MAX_ROLLS_PER_LINE, ROLLS_PER_DISC - used)
}

function countStat(id: string) {
  return discs.value.reduce(
    (sum, disc) =>
      sum + Math.max(0, disc.lines.find((line) => line.id === id)?.rolls ?? 0),
    0,
  )
}

function optionsFor(disc: Disc, lineIndex: number) {
  const current = disc.lines[lineIndex]?.id
  const main = mainFor(disc.slot)
  return substats.filter((rule) => {
    if (rule.id !== current && disc.lines.some((line) => line.id === rule.id)) return false
    if (conflictsWithMain(rule, main)) return false
    if (rule.id !== current && countStat(rule.id) + 1 > maxRollsFor(rule.id, substats, mains.value)) {
      return false
    }
    return true
  })
}

function setStat(discIndex: number, lineIndex: number, event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const disc = discs.value[discIndex]
  if (!disc) return
  if (!id) {
    disc.lines.splice(lineIndex, 1)
    return
  }
  const existing = disc.lines[lineIndex]
  if (existing) {
    existing.id = id
    existing.rolls = Math.min(existing.rolls, lineRoom(disc, lineIndex))
    return
  }
  if (disc.lines.length >= 4 || usedRolls(disc) >= ROLLS_PER_DISC) return
  if (countStat(id) + 1 > maxRollsFor(id, substats, mains.value)) return
  disc.lines.push({ id, rolls: 1 })
}

function bumpRolls(discIndex: number, lineIndex: number, delta: number) {
  const disc = discs.value[discIndex]
  const line = disc?.lines[lineIndex]
  if (!disc || !line) return
  if (delta > 0) {
    if (!canUpgrade(disc)) return
    if (countStat(line.id) + delta > maxRollsFor(line.id, substats, mains.value)) return
  }
  line.rolls = Math.max(1, Math.min(lineRoom(disc, lineIndex), line.rolls + delta))
}

function clearLine(discIndex: number, lineIndex: number) {
  const disc = discs.value[discIndex]
  if (!disc) return
  disc.lines.splice(lineIndex, 1)
  // 少于 4 条时不允许保留强化：全部退回基础 1 条。
  if (disc.lines.length < 4) {
    for (const line of disc.lines) line.rolls = 1
  }
}

const totalRolls = computed(() => sumDiscRolls(discs.value))

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

const summaryStats = computed(() =>
  keyStats.flatMap((id) => {
    const row = result.value.breakdown.find((item) => item.stat === id)
    return row ? [row] : []
  }),
)
</script>

<template>
  <div class="panel-section">
    <div class="panel-toolbar">
      <p class="panel-note">
        只计算基础面板、核心技基础属性、音擎基础值与高级属性、驱动盘的二件套；其余等局内效果不计入。
      </p>
      <div class="presets">
        <button
          v-for="preset in presetList"
          :key="preset.id"
          class="presets__item"
          :class="{ 'is-active': spec.id === preset.id }"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
    <p v-if="presetError" class="preset-error">{{ presetError }}</p>

    <div class="panel-summary" aria-label="关键面板">
      <div v-for="stat in summaryStats" :key="stat.stat" class="panel-summary__item">
        <span>{{ stat.label }}</span>
        <b class="num">{{ formatStat(stat.value, stat.unit) }}</b>
      </div>
      <a class="panel-summary__link" href="#panel-result">完整结果 ↓</a>
    </div>

    <div class="panel-section__grid">
      <div class="form">
        <section class="form__group">
          <header class="form__head">
            <h3>核心技</h3>
            <span class="form__hint">{{ coreHint }}</span>
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
              v-for="engine in engineOptions"
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
            <h3>副词条（逐件盘）</h3>
            <span class="form__hint">
              合计 <b class="num" :class="{ 'is-over': totalRolls > 54 }">{{ totalRolls }}</b> / 54 条
            </span>
          </header>

          <div class="discs">
            <article v-for="(disc, discIndex) in discs" :key="disc.slot" class="disc">
              <header class="disc__head">
                <b>{{ disc.slot }} 号位</b>
                <span class="num" :class="{ 'is-over': usedRolls(disc) > 9 }">
                  {{ usedRolls(disc) }} / 9 条
                </span>
              </header>
              <p class="disc__main">主词条 · {{ mainLabel(disc.slot) }}</p>
              <p v-if="!canUpgrade(disc)" class="disc__hint">
                还差 {{ 4 - disc.lines.length }} 条副词条 · 选满后才能强化
              </p>

              <label v-for="slot in 4" :key="slot" class="disc__line">
                <select
                  :value="lineAt(discIndex, slot - 1)?.id ?? ''"
                  @change="setStat(discIndex, slot - 1, $event)"
                >
                  <option value="">未选择</option>
                  <option v-for="rule in optionsFor(disc, slot - 1)" :key="rule.id" :value="rule.id">
                    {{ rule.label }}
                  </option>
                </select>
                <span v-if="lineAt(discIndex, slot - 1)" class="disc__rolls">
                  <button
                    type="button"
                    :aria-label="`减少${disc.slot}号位第${slot}条词条`"
                    :disabled="lineAt(discIndex, slot - 1)!.rolls <= 1"
                    @click="bumpRolls(discIndex, slot - 1, -1)"
                  >
                    −
                  </button>
                  <b class="num">{{ lineAt(discIndex, slot - 1)!.rolls }}</b>
                  <button
                    type="button"
                    :aria-label="`增加${disc.slot}号位第${slot}条词条`"
                    :disabled="
                      !canUpgrade(disc) ||
                      lineAt(discIndex, slot - 1)!.rolls >= lineRoom(disc, slot - 1)
                    "
                    :title="canUpgrade(disc) ? '强化 1 次' : '先选满 4 条副词条才能强化'"
                    @click="bumpRolls(discIndex, slot - 1, 1)"
                  >
                    ＋
                  </button>
                  <button
                    type="button"
                    class="disc__remove"
                    :aria-label="`清除${disc.slot}号位第${slot}条词条`"
                    @click="clearLine(discIndex, slot - 1)"
                  >
                    ×
                  </button>
                </span>
              </label>
            </article>
          </div>

          <p class="discs__note">
            副词条必须**选满 4 条**才能开始强化：先选 4 种词条（各 1 条），再分配 5 次强化（每条最多 6 条）。
            同盘副词条不能与主词条相同；同名词条的全局上限 =（6 − 主词条占用盘数）× 6，例如 4 号位主词条为异常精通时，异常精通副词条上限 30 条。
          </p>
        </section>
      </div>

      <aside id="panel-result" class="result">
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
            <summary>词条判定</summary>
            <ul>
              <li v-for="row in effective.rows" :key="row.id">
                <span>{{ row.label }} × {{ row.rolls }}</span>
                <small class="cap">上限 {{ maxRollsFor(row.id, substats, mains) }}</small>
                <em :class="`sub__tier--${row.tier}`">{{ tierLabel(row.id) }}</em>
              </li>
            </ul>
            <p>
              有效：{{ profileRows.join('、') }}；小词条：{{ smallRows.join('、') || '无' }}；其余无效。
              穿透值可切换计入有效。该判定只用于展示，不进入面板或伤害计算。
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
          <p class="result__sources-title">{{ STAT_LABELS[expanded] }} · 加成明细</p>
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
  font-size: var(--fs-14);
  line-height: 1.7;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.presets__item {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: var(--fs-14);
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

.panel-summary {
  display: none;
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
  font-size: var(--fs-18);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.form__hint {
  color: var(--muted);
  font-size: var(--fs-12);
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
  width: 36px;
  height: 36px;
  border: 1px solid var(--line-control);
  border-radius: 2px;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: var(--fs-14);
}

.pills__item:hover {
  color: var(--text);
  border-color: var(--text-2);
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
  border: 1px solid var(--line-control);
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
  font-size: var(--fs-14);
  font-weight: 500;
}

.engine__body small {
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.5;
}

.engine:hover {
  border-color: var(--text-2);
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
  font-size: var(--fs-12);
}

.field select {
  width: 100%;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid var(--line-control);
  border-radius: 2px;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-size: var(--fs-14);
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
  font-size: var(--fs-14);
  line-height: 1.6;
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
  padding: 6px 0;
  border-bottom: 1px solid var(--line);
}

.sub__label {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: start;
  align-items: baseline;
  column-gap: 6px;
}

.sub__label b {
  font-size: var(--fs-14);
  font-weight: 500;
}

.sub__tier {
  padding: 0 4px;
  border: 1px solid var(--line-control);
  color: var(--muted);
  font-size: var(--fs-12);
  font-style: normal;
  line-height: 1.5;
}

.sub__tier--effective {
  border-color: rgba(240, 223, 78, 0.45);
  color: var(--accent);
}

.sub__tier--small {
  border-color: rgba(143, 183, 255, 0.35);
  color: var(--info);
}

.sub__tier--invalid {
  color: var(--muted);
}

.sub__label small {
  grid-column: 1 / -1;
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.5;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
}

.stepper button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--line-control);
  color: var(--muted);
  font-size: var(--fs-14);
  line-height: 1;
}

.stepper button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.stepper span {
  min-width: 28px;
  text-align: center;
  font-size: var(--fs-16);
}

.result {
  position: sticky;
  top: calc(var(--header-h) + var(--chapter-nav-h) + 16px);
  padding: var(--s5);
  border: 1px solid var(--line);
  background: var(--surface);
  scroll-margin-top: calc(var(--header-h) + var(--chapter-nav-h) + 132px);
}

.result__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--s3);
  border-bottom: 1px solid var(--line);
}

.result__head h3 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
}

.result__tag {
  padding: 2px 7px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--fs-12);
  letter-spacing: 0.06em;
}

.result__stats {
  margin-top: 6px;
}

.result__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 2px;
  border-bottom: 1px solid var(--line);
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
  font-size: var(--fs-14);
}

.result__label i {
  color: var(--muted);
  font-size: var(--fs-12);
  font-style: normal;
}

.result__row b {
  color: var(--text-2);
  font-size: var(--fs-18);
  font-weight: 600;
}

.result__row.is-key b {
  color: var(--accent);
  font-size: var(--fs-22);
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
  font-size: var(--fs-18);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.effective__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  color: var(--muted);
  font-size: var(--fs-12);
  cursor: pointer;
}

.effective__toggle input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.effective__bar {
  display: flex;
  height: 8px;
  margin: var(--s3) 0;
  background: var(--line);
}

.effective__bar-effective {
  background: var(--accent);
}

.effective__bar-small {
  background: var(--info);
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
  font-size: var(--fs-28);
  font-weight: 600;
  line-height: 1;
}

.result__effective .effective__nums b {
  font-size: var(--fs-28);
}

.effective__nums span {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
}

.effective__note {
  margin-top: var(--s2);
  color: var(--text-2);
  font-size: var(--fs-14);
  line-height: 1.6;
}

.effective__warn {
  margin-top: 2px;
  color: var(--danger);
  font-size: var(--fs-14);
}

.effective__detail {
  margin-top: var(--s2);
}

.effective__detail summary {
  min-height: 32px;
  color: var(--muted);
  font-size: var(--fs-12);
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
  font-size: var(--fs-12);
}

.effective__detail em {
  font-style: normal;
}

.effective__detail p {
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
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
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
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
  font-size: var(--fs-14);
  color: var(--text-2);
}

.result__sources em {
  flex-shrink: 0;
  color: var(--muted);
  font-style: normal;
  font-size: var(--fs-12);
}

.result__warnings {
  display: grid;
  gap: 5px;
  margin-top: var(--s3);
  padding-top: var(--s3);
  border-top: 1px solid var(--danger);
}

.result__warnings li {
  color: var(--danger-ink);
  font-size: var(--fs-14);
}

.result__note {
  margin-top: var(--s4);
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .panel-section__grid {
    grid-template-columns: 1fr;
  }

  .result {
    position: static;
  }

  .panel-summary {
    position: sticky;
    top: calc(var(--header-h) + var(--chapter-nav-h) + 8px);
    z-index: 35;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    margin-bottom: var(--s3);
    padding: 8px 12px;
    border: 1px solid var(--line-control);
    background: rgba(16, 16, 21, 0.94);
    backdrop-filter: blur(10px);
  }

  .panel-summary__item {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .panel-summary__item span {
    color: var(--muted);
    font-size: var(--fs-12);
  }

  .panel-summary__item b {
    color: var(--text);
    font-family: var(--font-display);
    font-size: var(--fs-16);
    font-weight: 600;
  }

  .panel-summary__link {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    margin-left: auto;
    color: var(--accent);
    font-size: var(--fs-12);
  }
}

@media (max-width: 760px) {
  .panel-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .presets {
    width: 100%;
  }

  .presets__item {
    flex: 1 1 auto;
    justify-content: center;
    min-height: 44px;
  }

  .subs,
  .field-grid,
  .field-grid--mains {
    grid-template-columns: 1fr;
  }

  .pills__item {
    width: 44px;
    height: 44px;
  }

  .stepper button {
    width: 44px;
    height: 44px;
  }

  .field select {
    min-height: 44px;
  }

  .effective__detail summary {
    min-height: 44px;
  }

  .result {
    padding: var(--s4);
  }

  .panel-summary__link {
    margin-left: 0;
    min-height: 44px;
  }
}

.discs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.disc {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--line);
  background: var(--surface-2);
}

.disc__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-2);
  font-size: var(--fs-12);
}

.disc__head .num {
  color: var(--muted);
}

.disc__hint {
  color: var(--accent);
  font-size: var(--fs-12);
  line-height: 1.4;
}

.disc__rolls button:disabled {
  color: var(--text-disabled);
  border-color: var(--line);
  cursor: not-allowed;
}

.preset-error {
  margin-top: 6px;
  color: var(--danger-ink);
  font-size: var(--fs-12);
  line-height: 1.6;
}

.disc__main {
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.4;
}

.disc__head .num.is-over {
  color: var(--danger);
}

.disc__line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
  align-items: center;
}

.disc__line select {
  min-height: 34px;
  padding: 4px 8px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--fs-12);
}

.cap {
  margin-left: auto;
  color: var(--text-disabled);
  font-size: var(--fs-12);
}

.disc__rolls {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.disc__rolls button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--fs-12);
}

.disc__rolls button:hover {
  color: var(--text);
  border-color: var(--text-2);
}

.disc__rolls b {
  min-width: 18px;
  color: var(--text);
  font-size: var(--fs-14);
  text-align: center;
}

.disc__remove {
  margin-left: 2px;
  border-color: transparent !important;
}

.discs__note {
  margin-top: 8px;
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .discs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .discs {
    grid-template-columns: 1fr;
  }
}
</style>

