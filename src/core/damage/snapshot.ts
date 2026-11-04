import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import type { BuildSpec } from '@/core/panel/presets'
import { searCritRate } from './zones'
import type { CombatStats } from './types'

const CORE_LEVELS: BuildSpec['coreLevel'][] = ['none', 'A', 'B', 'C', 'D', 'E', 'F']
const WEAPON_AP = [90, 99, 108, 117, 126]
const WEAPON_FIRE_DMG = [40, 44, 48, 52, 56]
const NIRVANA = 'ep-2259'

export interface DamageBuild {
  cinema: number
  refinement: number
  coreLevel: BuildSpec['coreLevel']
  engineId: string | null
}

function coreIndex(level: BuildSpec['coreLevel']): number {
  return CORE_LEVELS.indexOf(level)
}

/**
 * 局外面板 → 伤害快照。
 *
 * 只在这里补充「面板不算、伤害要算」的部分：
 * - 核心被动 A–F 的异常精通
 * - 专武的精通与火伤（100% 覆盖假设）
 * - C1/C2/C6 的暴伤、增伤、抗性穿透
 */
export function buildCombatStats(
  panel: PanelStats,
  agent: Agent,
  build: DamageBuild,
): CombatStats {
  const index = coreIndex(build.coreLevel)
  const amFlat = index > 0 ? (agent.corePassive.amFlat[index - 1] ?? 0) : 0
  const coreCritDmg = index > 0 ? (agent.corePassive.critDmg[index - 1] ?? 0) : 0
  const cinema = Math.min(6, Math.max(0, build.cinema))
  const weapon = build.engineId === NIRVANA
  const weaponAp = weapon ? (WEAPON_AP[build.refinement - 1] ?? WEAPON_AP[0]) : 0
  const weaponFire = weapon ? (WEAPON_FIRE_DMG[build.refinement - 1] ?? WEAPON_FIRE_DMG[0]) : 0

  const searCritDmg = (coreCritDmg + 15 + (cinema >= 1 ? 25 : 0)) / 100
  const releaseCritDmg = searCritDmg + 0.4
  const dmgBonus = 1 + (panel.dmgBonus + weaponFire + (cinema >= 2 ? 30 : 0)) / 100

  return {
    atk: panel.atk,
    dmgBonus,
    penRatio: panel.penRatio,
    penValue: panel.penValue,
    ap: panel.anomalyProficiency + amFlat + weaponAp,
    anomalyMastery: panel.anomalyMastery,
    critRate: panel.critRate,
    critDmg: panel.critDmg,
    searCritRate: searCritRate(panel.anomalyMastery),
    searCritDmg,
    releaseCritDmg,
    resPen: cinema >= 6 ? 0.15 : 0,
  }
}
