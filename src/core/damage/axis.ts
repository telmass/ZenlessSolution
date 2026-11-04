import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import { buildCombatStats, type DamageBuild } from './snapshot'
import { moveMultiplier } from './skills'
import {
  damageAnomaly,
  damageDirect,
  damageDisorder,
  damageRelease,
} from './zones'
import type {
  CombatStats,
  CritMode,
  DamageEventResult,
  DamageOptions,
  DamageResult,
  DamageType,
  EnemyPreset,
} from './types'

const AXIS_DURATION = 20
const SKILL_LEVEL = 12

function event(
  id: string,
  label: string,
  type: DamageType,
  count: number,
  multiplier: number,
  stats: CombatStats,
  enemy: EnemyPreset,
  options: DamageOptions = {},
): DamageEventResult {
  const calc =
    type === 'direct'
      ? damageDirect(stats, multiplier, enemy, options)
      : type === 'anomaly'
        ? damageAnomaly(stats, multiplier, enemy, options)
        : type === 'release'
          ? damageRelease(stats, multiplier, enemy, options)
          : damageDisorder(stats, multiplier, enemy, options)
  return {
    id,
    label,
    type,
    count,
    multiplier,
    perHit: calc.perHit,
    total: calc.perHit * count,
    zones: calc.zones,
  }
}

export interface PhoenixDamage {
  axis: DamageResult
  single: DamageResult
  stats: CombatStats
  build: DamageBuild
}

function singleRelease(
  agent: Agent,
  stats: CombatStats,
  enemy: EnemyPreset,
  cinema: number,
  critMode: CritMode,
): DamageResult {
  const singleEvent = event(
    'single-release',
    '单次焚罪异放（失衡）',
    'release',
    1,
    moveMultiplier(agent, 'basic', '普通攻击：焚罪', '异放倍率', '异放倍率', SKILL_LEVEL),
    stats,
    enemy,
    { stunned: true, defIgnore: cinema >= 6 ? 0.4 : 0, critMode },
  )
  return {
    events: [singleEvent],
    total: singleEvent.total,
    dps: singleEvent.total,
    duration: 1,
    assumptions: ['单次焚罪异放，按失衡 1.5 倍计算，与开源默认预设一致。'],
  }
}

export function computeSingleRelease(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
  critMode: CritMode = 'expected',
): DamageResult {
  return singleRelease(agent, buildCombatStats(panel, agent, build), enemy, build.cinema, critMode)
}

/**
 * 20s 参考轴，不是战斗模拟。
 * 事件次数来自 docs/00 §9.5 草案；技能等级固定 12，核心 F。
 */
export function computePhoenixDamage(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
): PhoenixDamage {
  const stats = buildCombatStats(panel, agent, build)
  const cinema = build.cinema
  const baseOptions: DamageOptions = { stunned: enemy.stunned }
  const releaseOptions: DamageOptions = {
    stunned: enemy.stunned,
    defIgnore: cinema >= 6 ? 0.4 : 0,
  }

  const events: DamageEventResult[] = []
  const push = (item: DamageEventResult) => events.push(item)

  push(
    event(
      'liaozhan',
      '强化特殊技：燎斩',
      'direct',
      2,
      moveMultiplier(agent, 'special', '强化特殊技：燎斩', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    event(
      'zhuiyang',
      '强化特殊技：坠阳',
      'direct',
      1,
      moveMultiplier(agent, 'special', '强化特殊技：坠阳', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    event(
      'wansi',
      '终结技：万死重明',
      'direct',
      1,
      moveMultiplier(agent, 'chain', '终结技：万死重明', '伤害倍率', '伤害倍率', SKILL_LEVEL),
      stats,
      enemy,
      baseOptions,
    ),
  )
  push(
    event(
      'soul-release',
      '终结技：烬火追魂（异放）',
      'release',
      1,
      moveMultiplier(agent, 'chain', '终结技：烬火追魂', '异放倍率', '异放倍率', SKILL_LEVEL),
      stats,
      enemy,
      releaseOptions,
    ),
  )
  push(
    event(
      'purifying-release',
      '普通攻击：焚罪（异放）',
      'release',
      3,
      moveMultiplier(agent, 'basic', '普通攻击：焚罪', '异放倍率', '异放倍率', SKILL_LEVEL),
      stats,
      enemy,
      releaseOptions,
    ),
  )

  const coreIndex = ['none', 'A', 'B', 'C', 'D', 'E', 'F'].indexOf(build.coreLevel)
  const tickPct = coreIndex > 0 ? (agent.corePassive.tickAtkPct[coreIndex - 1] ?? 0) : 0
  if (tickPct > 0) {
    push(event('sear-tick', '灼蚀 tick', 'direct', 2, tickPct / 100, stats, enemy, baseOptions))
  }

  const burnTicks = 20 + (cinema >= 2 ? 4 : 0)
  push(event('burn', '火属性异常（灼烧）', 'anomaly', 1, 0.5 * burnTicks, stats, enemy, baseOptions))
  push(event('disorder', '紊乱', 'disorder', 1, 4.5 + burnTicks * 0.5, stats, enemy, baseOptions))

  if (cinema >= 4) {
    // C4：烬火追魂 1 次 + 焚罪终结一击 3 次，各额外触发 600% 异放。
    push(event('c4-release', 'C4 额外异放 ×4', 'release', 4, 6, stats, enemy, releaseOptions))
  }

  const total = events.reduce((sum, item) => sum + item.total, 0)
  const axis: DamageResult = {
    events,
    total,
    dps: total / AXIS_DURATION,
    duration: AXIS_DURATION,
    assumptions: [
      '20s 参考轴，事件次数是假设，不是战斗模拟结果。',
      '技能等级固定 12，核心固定 F；0+1 / 6+1 对比不随影画抬等级。',
      '伤害结算的异常精通 = 局外面板 + 核心被动 + 专武被动；表格里的异常精通行显示局外值。',
      '专武火伤、自由蓝调 4 件套、灼蚀按 100% 覆盖。',
      '自由蓝调 4 件套只降低异常积蓄抗性，不改伤害，未进乘区。',
      'C2 灼烧 +2s 按 +4 跳计入灼烧倍率，紊乱倍率 14.5 → 16.5。',
      cinema >= 4 ? 'C4 额外异放按 1 次烬火追魂 + 3 次焚罪终结一击共 4 次计。' : 'C4 未启用。',
    ],
  }

  const singleEvent = event(
    'single-release',
    '单次焚罪异放（失衡）',
    'release',
    1,
    moveMultiplier(agent, 'basic', '普通攻击：焚罪', '异放倍率', '异放倍率', SKILL_LEVEL),
    stats,
    enemy,
    { stunned: true, defIgnore: cinema >= 6 ? 0.4 : 0 },
  )
  const single: DamageResult = {
    events: [singleEvent],
    total: singleEvent.total,
    dps: singleEvent.total,
    duration: 1,
    assumptions: ['单次焚罪异放，按失衡 1.5 倍计算，与开源默认预设一致。'],
  }

  return { axis, single, stats, build }
}

export { AXIS_DURATION, SKILL_LEVEL }
