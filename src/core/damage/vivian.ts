import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import { moveMultiplier } from './skills'
import { makeEvent } from './events'
import { coreValue, type DamageBuild } from './snapshot'
import type {
  AgentDamage,
  CombatStats,
  CritMode,
  DamageEventResult,
  DamageOptions,
  DamageResult,
  EnemyPreset,
} from './types'

/**
 * 以太属性异常「侵蚀」：单跳倍率 0.625，10 秒 20 跳。
 * 与官方异常表 / 开源实现一致（见 docs/06-damage.md）。
 */
export const CORRUPTION_UNIT = 0.625
export const CORRUPTION_TICKS = 20

/**
 * 异放比例：每 10 点异常精通对应的百分比，核心等级 none→F。
 * 官方核心被动文本：以太 3.07/3.59/4.11/4.63/5.15/5.65/6.15%。
 * 异放倍率 = 0.625 ×（精通 / 10 × 系数%）。
 */
export const RELEASE_COEF_ETHER = [3.07, 3.59, 4.11, 4.63, 5.15, 5.65, 6.15]
const CORE_LEVELS: DamageBuild['coreLevel'][] = ['none', 'A', 'B', 'C', 'D', 'E', 'F']

/** 侵蚀紊乱：固定 4.5 + 剩余跳数 × 0.625。 */
export const CORRUPTION_DISORDER = 4.5 + CORRUPTION_TICKS * CORRUPTION_UNIT

interface VivianEngineEffect {
  ap: number
  atkPct: number
  /** 面板增伤之外的局内增伤%。 */
  dmgBonus: number
  /** 属性异常 / 紊乱伤害提升%。 */
  anomalyDmg: number
}

function pick(values: number[], refinement: number): number {
  return values[Math.min(4, Math.max(0, refinement - 1))] ?? values[0]
}

function vivianEngine(engineId: string | null, refinement: number): VivianEngineEffect {
  if (engineId === 'ep-1277') {
    // 飞鸟星梦：造成以太伤害时叠 6 层精通，精 1 每层 20 点。
    return { ap: pick([20, 23, 26, 29, 32], refinement) * 6, atkPct: 0, dmgBonus: 0, anomalyDmg: 0 }
  }
  if (engineId === 'ep-1883') {
    // 壳中之灵：精通 90–144；对异常目标增伤 20–32%，异常/紊乱伤害 +10–16%。
    return {
      ap: pick([90, 103, 117, 130, 144], refinement),
      atkPct: 0,
      dmgBonus: pick([20, 23, 26, 29, 32], refinement),
      anomalyDmg: pick([10, 11.5, 13, 14.5, 16], refinement),
    }
  }
  if (engineId === 'ep-212') {
    // 双生泣星：每层 30–48 精通，4 层。
    return { ap: pick([30, 34, 38, 42, 48], refinement) * 4, atkPct: 0, dmgBonus: 0, anomalyDmg: 0 }
  }
  if (engineId === 'ep-214') {
    // 嵌合编译器：攻击 12–24%，特殊技叠 3 层精通 25–50。
    return {
      ap: pick([25, 31, 37, 43, 50], refinement) * 3,
      atkPct: pick([12, 15, 18, 21, 24], refinement),
      dmgBonus: 0,
      anomalyDmg: 0,
    }
  }
  if (engineId === 'ep-210') {
    // 触电唇彩：异常目标在场时攻击 +10–16%、增伤 +15–25%，按 100% 覆盖。
    return {
      ap: 0,
      atkPct: pick([10, 11.5, 13, 14.5, 16], refinement),
      dmgBonus: pick([15, 17.5, 20, 22.5, 25], refinement),
      anomalyDmg: 0,
    }
  }
  return { ap: 0, atkPct: 0, dmgBonus: 0, anomalyDmg: 0 }
}

export function vivianReleaseCoef(coreLevel: DamageBuild['coreLevel']): number {
  const index = CORE_LEVELS.indexOf(coreLevel)
  return RELEASE_COEF_ETHER[index] ?? RELEASE_COEF_ETHER[0]
}

/** 异放比例 = 精通 / 10 × 核心系数% ×（C2 的 130%）。 */
export function vivianReleaseScale(
  ap: number,
  coreLevel: DamageBuild['coreLevel'],
  cinema: number,
): number {
  const coef = vivianReleaseCoef(coreLevel) / 100
  return (ap / 10) * coef * (cinema >= 2 ? 1.3 : 1)
}

/** 单次异放的倍率：一个侵蚀单位 × 异放比例。 */
export function vivianReleaseMultiplier(
  ap: number,
  coreLevel: DamageBuild['coreLevel'],
  cinema: number,
): number {
  return CORRUPTION_UNIT * vivianReleaseScale(ap, coreLevel, cinema)
}

/**
 * 局外面板 → Vivian 的伤害快照。
 * 只在伤害侧补：专武/音擎的精通与增伤、核心被动、影画 1/2/4/6。
 */
export function buildVivianStats(
  panel: PanelStats,
  agent: Agent,
  build: DamageBuild,
): CombatStats {
  const cinema = Math.min(6, Math.max(0, build.cinema))
  const effect = vivianEngine(build.engineId, build.refinement)
  const coreIndex = CORE_LEVELS.indexOf(build.coreLevel)
  const coreAp = coreValue(agent.corePassive.amFlat ?? [], coreIndex)

  const anomalyDmg = 12 + (cinema >= 1 ? 16 : 0) + effect.anomalyDmg
  const releaseDmg = 12 + effect.anomalyDmg
  const dmgBonus = 1 + (panel.dmgBonus + effect.dmgBonus + (cinema >= 6 ? 40 : 0)) / 100
  const atk = panel.atk * (1 + (effect.atkPct + (cinema >= 4 ? 12 : 0)) / 100)

  return {
    atk,
    dmgBonus,
    penRatio: panel.penRatio,
    penValue: panel.penValue,
    ap: panel.anomalyProficiency + coreAp + effect.ap,
    anomalyMastery: panel.anomalyMastery,
    critRate: panel.critRate,
    critDmg: panel.critDmg,
    searCritRate: 0,
    searCritDmg: 0,
    releaseCritDmg: 0,
    resPen: 0,
    anomalyDamageBonus: 1 + anomalyDmg / 100,
    disorderDamageBonus: 1 + anomalyDmg / 100,
    releaseDamageBonus: 1 + releaseDmg / 100,
    releaseResPen: cinema >= 2 ? 0.15 : 0,
  }
}

const AXIS_DURATION = 20
const SKILL_LEVEL = 12

/**
 * Vivian 的 20s 参考轴（假设，不是模拟）：
 * - 2 次强化特殊技、1 次连携、1 次终结技、6 次落羽生花、3 次悬落；
 * - 6 次异放（异放只在敌人处于属性异常时触发）；
 * - 1 次完整侵蚀（20 跳） + 1 次侵蚀紊乱；
 * - 预言 DoT 按 20 秒全覆盖，0.55 秒一跳共 36 跳。
 */
export function computeVivianDamage(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
): AgentDamage {
  const stats = buildVivianStats(panel, agent, build)
  const cinema = build.cinema
  const baseOptions: DamageOptions = { stunned: enemy.stunned }
  const releaseOptions: DamageOptions = { stunned: enemy.stunned }
  const releaseMultiplier = vivianReleaseMultiplier(stats.ap, build.coreLevel, cinema)

  const events: DamageEventResult[] = []
  const push = (item: DamageEventResult) => events.push(item)

  push(
    makeEvent(
      'special',
      '强化特殊技：堇花悼亡',
      'direct',
      2,
      moveMultiplier(agent, 'special', '强化特殊技：堇花悼亡', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    makeEvent(
      'chain',
      '连携技：星羽和声',
      'direct',
      1,
      moveMultiplier(agent, 'chain', '连携技：星羽和声', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    makeEvent(
      'ultimate',
      '终结技：飞鸟鸣颂',
      'direct',
      1,
      moveMultiplier(agent, 'chain', '终结技：飞鸟鸣颂', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    makeEvent(
      'luoyu',
      '普通攻击：落羽生花',
      'direct',
      6,
      moveMultiplier(agent, 'basic', '普通攻击：落羽生花', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      { ...baseOptions, critMode: cinema >= 4 ? 'crit' : undefined },
    ),
  )
  push(
    makeEvent(
      'xuanluo',
      '普通攻击：裙裾浮游·悬落',
      'direct',
      3,
      moveMultiplier(agent, 'basic', '普通攻击：裙裾浮游·悬落', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      { ...baseOptions, critMode: cinema >= 4 ? 'crit' : undefined },
    ),
  )
  push(
    makeEvent('prophecy', '薇薇安的预言（DoT）', 'direct', 36, 0.55, stats, enemy, baseOptions),
  )
  push(makeEvent('release', '异放', 'release', 6, releaseMultiplier, stats, enemy, releaseOptions))
  push(
    makeEvent(
      'corruption',
      '以太属性异常（侵蚀）',
      'anomaly',
      CORRUPTION_TICKS,
      CORRUPTION_UNIT,
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    makeEvent(
      'disorder',
      '侵蚀紊乱',
      'disorder',
      1,
      CORRUPTION_DISORDER,
      stats,
      enemy,
      baseOptions,
    ),
  )
  if (cinema >= 6) {
    // C6：悬落消耗 5 点护羽触发特殊异放，比例最高 5 倍；轴内按 1 次计。
    push(makeEvent('c6-release', 'C6 特殊异放（5×）', 'release', 1, releaseMultiplier * 5, stats, enemy, releaseOptions))
  }

  const total = events.reduce((sum, item) => sum + item.total, 0)
  const axis: DamageResult = {
    events,
    total,
    dps: total / AXIS_DURATION,
    duration: AXIS_DURATION,
    assumptions: [
      '20s 参考轴，事件次数是假设，不是战斗模拟结果。',
      '技能等级固定 12、核心固定 F；影画只改数值，不改技能等级。',
      '异放倍率 = 0.625 ×（精通 / 10 × 核心系数%）；核心 F 时以太系数 6.15%，C2 再 ×1.3。',
      '侵蚀按完整 20 跳计（0.625 × 20）；侵蚀紊乱 = 4.5 + 20 × 0.625。',
      '预言 DoT 按 20 秒全覆盖（0.55 秒一跳，共 36 跳）。',
      'C1 的 +16% 只作用于属性异常与紊乱；C2 的 15% 抗性无视只作用于异放；C6 特殊异放按 1 次 5 倍计。',
      '专武的 6 层精通、壳中之灵/触电唇彩的增伤按 100% 覆盖。',
      '音擎只对比面板与增伤/精通；异常积蓄效率（专武 +40%）未折算成额外异常次数，专武的实战收益被低估。',
    ],
  }

  const singleEvent = makeEvent(
    'single-release',
    '单次异放（失衡）',
    'release',
    1,
    releaseMultiplier,
    stats,
    enemy,
    { stunned: true },
  )
  const single: DamageResult = {
    events: [singleEvent],
    total: singleEvent.total,
    dps: singleEvent.total,
    duration: 1,
    assumptions: ['单次异放，按失衡 1.5 倍计算；异放不吃暴击。'],
  }

  return { axis, single, stats, build }
}

export function computeVivianSingle(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
  critMode: CritMode = 'expected',
): DamageResult {
  void critMode
  const stats = buildVivianStats(panel, agent, build)
  const multiplier = vivianReleaseMultiplier(stats.ap, build.coreLevel, build.cinema)
  const event = makeEvent('single-release', '单次异放（失衡）', 'release', 1, multiplier, stats, enemy, {
    stunned: true,
    critMode: 'none',
  })
  return {
    events: [event],
    total: event.total,
    dps: event.total,
    duration: 1,
    assumptions: ['单次异放，按失衡 1.5 倍计算；异放不吃暴击。'],
  }
}
