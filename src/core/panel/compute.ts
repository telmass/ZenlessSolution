import { engines, mainStats, panelRules, sets, substats, STAT_LABELS, STAT_ORDER, STAT_UNITS } from './data'
import { trimNumber } from './format'
import type {
  BreakdownRow,
  ModKind,
  PanelInput,
  PanelResult,
  PanelStats,
  StatId,
} from './types'

interface Accumulator {
  pct: Partial<Record<StatId, number>>
  flat: Partial<Record<StatId, number>>
  sources: Partial<Record<StatId, { label: string; text: string }[]>>
}

function createAccumulator(): Accumulator {
  return { pct: {}, flat: {}, sources: {} }
}

function record(
  acc: Accumulator,
  stat: StatId,
  value: number,
  kind: ModKind,
  label: string,
  rawText: string,
): void {
  if (!value) return
  const bucket = kind === 'pct' ? acc.pct : acc.flat
  bucket[stat] = (bucket[stat] ?? 0) + value
  const list = (acc.sources[stat] ??= [])
  list.push({ label, text: rawText })
}

function addSource(acc: Accumulator, stat: StatId, label: string, text: string): void {
  const list = (acc.sources[stat] ??= [])
  list.push({ label, text })
}

export function computePanel(input: PanelInput): PanelResult {
  const acc = createAccumulator()
  const warnings: string[] = []

  const base = input.base
  const core = input.coreBonus

  // Base values are tracked as the first source of each row.
  const baseSources: Partial<Record<StatId, { label: string; text: string }>> = {
    hp: { label: '角色基础', text: `基础 ${trimNumber(base.hp, 0)}` },
    atk: { label: '角色基础', text: `基础 ${trimNumber(base.atk, 0)}` },
    def: { label: '角色基础', text: `基础 ${trimNumber(base.def, 0)}` },
    impact: { label: '角色基础', text: `基础 ${trimNumber(base.impact, 0)}` },
    critRate: { label: '角色基础', text: `基础 ${trimNumber(base.critRate, 1)}%` },
    critDmg: { label: '角色基础', text: `基础 ${trimNumber(base.critDmg, 1)}%` },
    anomalyProficiency: { label: '角色基础', text: `基础 ${base.anomalyProficiency}` },
    anomalyMastery: { label: '角色基础', text: `基础 ${base.anomalyMastery}` },
    penRatio: { label: '角色基础', text: `基础 ${trimNumber(base.penRatio, 1)}%` },
    energyRegen: { label: '角色基础', text: `基础 ${trimNumber(base.energyRegen * 100, 0)}%` },
  }

  // Core skill: flat mastery + base ATK (the core passive itself is in-combat).
  if (core.ac) {
    addSource(acc, 'anomalyMastery', '核心技', `核心 ${input.coreLevel} 异常掌控 +${core.ac}`)
  }
  if (core.atkBase) {
    addSource(acc, 'atk', '核心技', `核心 ${input.coreLevel} 基础攻击 +${core.atkBase}`)
  }

  // W-Engine: base ATK/DEF enter the base pool; the advanced stat is a modifier.
  const engine = input.engineId ? engines.find((item) => item.id === input.engineId) : undefined
  let engineBaseAtk = 0
  let engineBaseDef = 0
  if (engine) {
    engineBaseAtk = engine.baseAtk
    engineBaseDef = engine.baseDef
    if (engine.baseAtk) {
      addSource(acc, 'atk', engine.name, `${engine.name} 基础攻击 +${engine.baseAtk}`)
    }
    if (engine.baseDef) {
      addSource(acc, 'def', engine.name, `${engine.name} 基础防御 +${engine.baseDef}`)
    }
    if (engine.subStat) {
      record(
        acc,
        engine.subStat.stat,
        engine.subStat.value,
        engine.subStat.kind,
        engine.name,
        `${engine.name} 高级属性 ${engine.subStat.label} +${engine.subStat.value}${engine.subStat.kind === 'pct' ? '%' : ''}`,
      )
    }
  }

  // Drive discs: fixed slots 1/2/3.
  record(acc, 'hp', panelRules.discFixed.hp, 'flat', '驱动盘 1 号位', `固定生命 +${panelRules.discFixed.hp}`)
  record(acc, 'atk', panelRules.discFixed.atk, 'flat', '驱动盘 2 号位', `固定攻击 +${panelRules.discFixed.atk}`)
  record(acc, 'def', panelRules.discFixed.def, 'flat', '驱动盘 3 号位', `固定防御 +${panelRules.discFixed.def}`)

  // Drive discs: 4/5/6 main stats.
  for (const slot of [4, 5, 6] as const) {
    const id = input.mainStats[slot]
    const rule = mainStats.find((item) => item.slot === slot && item.id === id)
    if (!rule) {
      warnings.push(`${slot} 号位主词条未选择`)
      continue
    }
    record(
      acc,
      rule.stat,
      rule.value,
      rule.kind,
      `驱动盘 ${slot} 号位`,
      `${slot} 号位 ${rule.label}`,
    )
  }

  // 4-piece and 2-piece set bonuses (2pc effect only; 4pc is in-combat).
  const set4 = input.set4 ? sets.find((item) => item.id === input.set4) : undefined
  const set2 = input.set2 ? sets.find((item) => item.id === input.set2) : undefined
  if (set4 && set2 && set4.id === set2.id) {
    warnings.push('4 件套与 2 件套不能是同一套驱动盘')
  }
  for (const [set, label] of [
    [set4, '4 件套'],
    [set2, '2 件套'],
  ] as const) {
    if (!set) continue
    if (!set.effect2) {
      warnings.push(`${set.name} 的 2 件套效果不计入局外面板`)
      continue
    }
    record(
      acc,
      set.effect2.stat,
      set.effect2.value,
      set.effect2.kind,
      `${label} ${set.name}`,
      `${label} ${set.name} ${set.effect2.label}`,
    )
  }

  // Substats: count x per-roll value.
  let totalSubstatRolls = 0
  for (const rule of substats) {
    const count = Math.max(0, Math.floor(input.substats[rule.id] ?? 0))
    if (!count) continue
    totalSubstatRolls += count
    if (count > 36) warnings.push(`${rule.label} 条数 ${count} 超过单条上限 36`)
    record(
      acc,
      rule.stat,
      count * rule.value,
      rule.kind,
      '副词条',
      `副词条 ${rule.label} ×${count} = +${trimNumber(count * rule.value, 2)}${rule.kind === 'pct' ? '%' : ''}`,
    )
  }
  if (totalSubstatRolls > 54) warnings.push(`副词条总数 ${totalSubstatRolls} 超过 54 条上限`)

  const pct = (stat: StatId) => acc.pct[stat] ?? 0
  const flat = (stat: StatId) => acc.flat[stat] ?? 0

  const stats: PanelStats = {
    hp: (base.hp * (1 + pct('hp') / 100)) + flat('hp'),
    atk: (base.atk + core.atkBase + engineBaseAtk) * (1 + pct('atk') / 100) + flat('atk'),
    def: (base.def + engineBaseDef) * (1 + pct('def') / 100) + flat('def'),
    impact: base.impact * (1 + pct('impact') / 100) + flat('impact'),
    critRate: base.critRate + pct('critRate') + flat('critRate'),
    critDmg: base.critDmg + pct('critDmg') + flat('critDmg'),
    dmgBonus: pct('dmgBonus') + flat('dmgBonus'),
    penRatio: base.penRatio + pct('penRatio') + flat('penRatio'),
    penValue: pct('penValue') + flat('penValue'),
    anomalyProficiency: base.anomalyProficiency + pct('anomalyProficiency') + flat('anomalyProficiency'),
    anomalyMastery: (base.anomalyMastery + core.ac) * (1 + pct('anomalyMastery') / 100) + flat('anomalyMastery'),
    energyRegen: (base.energyRegen + flat('energyRegen')) * (1 + pct('energyRegen') / 100) * 100,
  }

  const breakdown: BreakdownRow[] = STAT_ORDER.map((stat) => {
    const sources = [...(acc.sources[stat] ?? [])]
    const baseSource = baseSources[stat]
    if (baseSource) sources.unshift(baseSource)
    return {
      stat,
      label: STAT_LABELS[stat],
      value: stats[stat],
      unit: STAT_UNITS[stat],
      sources,
    }
  })

  return { stats, breakdown, warnings, totalSubstatRolls }
}
