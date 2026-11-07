import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import { makeEvent } from './events'
import type {
  AgentDamage,
  CombatStats,
  CritMode,
  DamageEventResult,
  DamageResult,
  EnemyPreset,
} from './types'
import type { DamageBuild } from './snapshot'

/** 侵蚀单跳基础倍率（与薇薇安模型同源）。 */
export const CORRUPTION_UNIT = 0.625

/** 核心被动：A–F 的以太异放系数（每 10 点局外异常掌控）。 */
export const ARIA_RELEASE_COEF_ETHER = [16.0, 18.3, 20.6, 22.9, 25.2, 27.5]
/** 核心被动：A–F 的异常精通固定值。 */
export const ARIA_CORE_AP = [52, 60, 67, 75, 82, 90]
const CORE_LEVELS: DamageBuild['coreLevel'][] = ['none', 'A', 'B', 'C', 'D', 'E', 'F']

function pick(values: number[], refinement: number): number {
  return values[Math.min(4, Math.max(0, refinement - 1))] ?? values[0]
}

function coreIndex(coreLevel: DamageBuild['coreLevel']): number {
  return Math.min(5, Math.max(0, CORE_LEVELS.indexOf(coreLevel) - 1))
}

/** 壳中之灵：异常精通 +90…144；对异常目标增伤 20…32%，异常/紊乱 +10…16%。 */
function ariaEngine(engineId: string | null, refinement: number): {
  ap: number
  dmgBonus: number
  releaseDmg: number
} {
  if (engineId === 'ep-1883') {
    return {
      ap: pick([90, 103, 117, 130, 144], refinement),
      dmgBonus: pick([20, 23, 26, 29, 32], refinement),
      releaseDmg: pick([10, 11.5, 13, 14.5, 16], refinement),
    }
  }
  return { ap: 0, dmgBonus: 0, releaseDmg: 0 }
}

export function ariaReleaseScale(
  anomalyMastery: number,
  coreLevel: DamageBuild['coreLevel'],
  stunned: boolean,
): number {
  const coefficient = ARIA_RELEASE_COEF_ETHER[coreIndex(coreLevel)] / 100
  return (anomalyMastery / 10) * coefficient * (stunned ? 1.5 : 1)
}

export function buildAriaStats(
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
): CombatStats {
  const cinema = Math.min(6, Math.max(0, build.cinema))
  const engine = ariaEngine(build.engineId, build.refinement)
  const ap = panel.anomalyProficiency + ARIA_CORE_AP[coreIndex(build.coreLevel)] + engine.ap
  const dmgBonus = 1 + (panel.dmgBonus + engine.dmgBonus + (cinema >= 6 ? 40 : 0)) / 100
  const critRate = cinema >= 1
    ? Math.min(100, 25 + Math.max(0, Math.floor(panel.anomalyMastery) - 100) * 0.5) / 100
    : 0
  return {
    atk: panel.atk,
    dmgBonus,
    penRatio: panel.penRatio,
    penValue: panel.penValue,
    ap,
    anomalyMastery: panel.anomalyMastery,
    critRate: panel.critRate,
    critDmg: panel.critDmg,
    searCritRate: critRate,
    searCritDmg: cinema >= 1 ? 0.25 : 0,
    releaseCritDmg: cinema >= 1 ? 0.25 : 0,
    resPen: 0,
    anomalyDamageBonus: 1,
    disorderDamageBonus: 1,
    releaseDamageBonus: 1 + engine.releaseDmg / 100,
  }
}

const AXIS_DURATION = 1

/** 爱芮默认口径：1 次失衡期侵蚀异放（参考项目默认事件）。 */
export function computeAriaDamage(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
): AgentDamage {
  const stats = buildAriaStats(panel, build, enemy)
  const stunned = true
  const scale = ariaReleaseScale(panel.anomalyMastery, build.coreLevel, stunned)
  const multiplier = CORRUPTION_UNIT * scale
  const defIgnore = build.cinema >= 2 ? 0.24 : 0
  const event = makeEvent(
    'release',
    '侵蚀异放（失衡）',
    'release',
    1,
    multiplier,
    stats,
    enemy,
    { stunned, defIgnore },
  )
  const total = event.total
  const axis: DamageResult = {
    events: [event],
    total,
    dps: total / AXIS_DURATION,
    duration: AXIS_DURATION,
    assumptions: [
      '默认机制口径：1 次失衡期侵蚀异放（参考项目 defaultCalculationConfig）',
      '异放比例 = 局外异常掌控 / 10 × 核心以太系数 × 失衡 1.5',
      'C1 异放暴击：25% + 局外异常掌控超过 100 的部分 ×0.5%，暴伤 25%',
      'C2 减防 24%（16% + 妄想时刻 8%）；C6 以太伤害 +40%',
      '非逐帧模拟；能量、喧响与异常积蓄不建模',
    ],
  }
  const single = computeAriaSingle(agent, panel, build, enemy, 'expected')
  return { axis, single, stats, build }
}

export function computeAriaSingle(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
  _critMode: CritMode = 'expected',
): DamageResult {
  const stats = buildAriaStats(panel, build, enemy)
  const scale = ariaReleaseScale(panel.anomalyMastery, build.coreLevel, true)
  const defIgnore = build.cinema >= 2 ? 0.24 : 0
  const event = makeEvent(
    'release',
    '侵蚀异放（失衡）',
    'release',
    1,
    CORRUPTION_UNIT * scale,
    stats,
    enemy,
    { stunned: true, defIgnore },
  )
  return { events: [event], total: event.total, dps: event.total, duration: AXIS_DURATION, assumptions: [] }
}
