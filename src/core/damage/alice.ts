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

/** 物理强击基础倍率（zzz_calculator / anomaly_effects.json）。 */
export const ASSAULT_MULTIPLIER = 7.13
/** 畏缩紊乱：4.5 + 10 跳 × 0.075。 */
export const FLINCH_DISORDER_BASE = 4.5 + 10 * 0.075
/** 核心被动：10 层 × 18% 紊乱倍率。 */
export const ALICE_DISORDER_BONUS = 1.8
/** 核心追击：10 次 × 强击伤害 2.5%。 */
export const ALICE_FOLLOWUP_RATIO = 0.025
/** C6 决胜追击：3300% 异常精通 × 6，必暴。 */
export const ALICE_C6_MULTIPLIER = 33

/** 局外异常掌控 → 局内异常精通：超过 140 的部分每点 +1.6（向下取整）。 */
export function aliceMasteryConversion(mastery: number): number {
  if (mastery <= 140) return 0
  return Math.floor((Math.floor(mastery) - 140) * 1.6)
}

export function buildAliceStats(
  panel: PanelStats,
  agent: Agent,
  build: DamageBuild,
): CombatStats {
  const cinema = Math.min(6, Math.max(0, build.cinema))
  const ap = panel.anomalyProficiency + aliceMasteryConversion(panel.anomalyMastery)
  const assaultBonus = cinema >= 2 ? 1.15 : 1
  return {
    atk: panel.atk,
    dmgBonus: 1 + panel.dmgBonus / 100,
    penRatio: panel.penRatio,
    penValue: panel.penValue,
    ap,
    anomalyMastery: panel.anomalyMastery,
    critRate: panel.critRate,
    critDmg: panel.critDmg,
    searCritRate: 0,
    searCritDmg: 0,
    releaseCritDmg: 0,
    resPen: cinema >= 4 ? 0.1 : 0,
    anomalyDamageBonus: assaultBonus,
    disorderDamageBonus: assaultBonus,
    releaseDamageBonus: 1,
  }
}

const AXIS_DURATION = 1

/**
 * 爱丽丝默认机制口径（对齐 zzz_calculator 的 Alice 事件）：
 * - 1 次极性强击（= 1 次强击的基础倍率）；
 * - 核心被动 10 次追击，每次 2.5% 强击；
 * - 1 次满持续物理紊乱（4.5 + 10 × 0.075 + 10 层 × 18%）；
 * - C6 追加 6 次决胜追击（3300% 异常精通，必暴）。
 */
export function computeAliceDamage(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
): AgentDamage {
  const stats = buildAliceStats(panel, agent, build)
  const cinema = build.cinema
  const defIgnore = cinema >= 1 ? 0.2 : 0
  const options = { stunned: true, defIgnore }
  const events: DamageEventResult[] = []

  const assault = makeEvent(
    'assault',
    '极性强击',
    'anomaly',
    1,
    ASSAULT_MULTIPLIER,
    stats,
    enemy,
    options,
  )
  events.push(assault)

  events.push(
    makeEvent(
      'core-followup',
      '核心被动·物理异常追击',
      'anomaly',
      10,
      ASSAULT_MULTIPLIER * ALICE_FOLLOWUP_RATIO,
      stats,
      enemy,
      options,
    ),
  )

  events.push(
    makeEvent(
      'physical-disorder',
      '物理紊乱（满持续）',
      'disorder',
      1,
      FLINCH_DISORDER_BASE + ALICE_DISORDER_BONUS,
      stats,
      enemy,
      options,
    ),
  )

  if (cinema >= 6) {
    events.push(
      makeEvent(
        'winning-state-followup',
        '决胜状态·额外攻击',
        'direct',
        6,
        (ALICE_C6_MULTIPLIER * stats.ap) / stats.atk,
        stats,
        enemy,
        { ...options, critMode: 'crit' },
      ),
    )
  }

  const total = events.reduce((sum, event) => sum + event.total, 0)
  const axis: DamageResult = {
    events,
    total,
    dps: total / AXIS_DURATION,
    duration: AXIS_DURATION,
    assumptions: [
      '默认机制口径：1 次极性强击 + 10 次核心追击 + 1 次满持续物理紊乱',
      '核心 F、C6 额外 6 次决胜追击（必暴）',
      '物理紊乱按 10 秒满持续 + 核心 10 层 180% 倍率',
      '异常精通按局外精通 + 异常掌控 >140 的 1.6 倍转化',
      '非逐帧模拟；失衡、异常积蓄与能量循环不建模',
    ],
  }

  const single = computeAliceSingle(agent, panel, build, enemy, 'none')
  return { axis, single, stats, build }
}

export function computeAliceSingle(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
  _critMode: CritMode = 'none',
): DamageResult {
  const stats = buildAliceStats(panel, agent, build)
  const defIgnore = build.cinema >= 1 ? 0.2 : 0
  const event = makeEvent(
    'polarized-assault',
    '极性强击',
    'anomaly',
    1,
    ASSAULT_MULTIPLIER,
    stats,
    enemy,
    { stunned: true, defIgnore },
  )
  return {
    events: [event],
    total: event.total,
    dps: event.total,
    duration: AXIS_DURATION,
    assumptions: ['单次极性强击；强击倍率 7.13，计入核心/影画加成'],
  }
}
