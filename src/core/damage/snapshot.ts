import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import type { BuildSpec } from '@/core/panel/presets'
import { searCritRate } from './zones'
import type { CombatStats } from './types'

const CORE_LEVELS: BuildSpec['coreLevel'][] = ['none', 'A', 'B', 'C', 'D', 'E', 'F']
const NIRVANA = 'ep-2259'

interface EngineEffect {
  ap: number
  fireDmg: number
  atkPct: number
}

function engineEffect(engineId: string | null, refinement: number): EngineEffect {
  const index = Math.min(4, Math.max(0, refinement - 1))
  const apByLevel = (values: number[]) => values[index] ?? values[0]
  if (engineId === NIRVANA) {
    return { ap: apByLevel([90, 99, 108, 117, 126]), fireDmg: [40, 44, 48, 52, 56][index] ?? 40, atkPct: 0 }
  }
  if (engineId === 'ep-1883') {
    // 壳中之灵：以太专属增伤不触发，但 90/103/117/130/144 异常精通对所有装备者生效。
    return { ap: apByLevel([90, 103, 117, 130, 144]), fireDmg: 0, atkPct: 0 }
  }
  if (engineId === 'ep-212') {
    // 双生泣星：每层异常精通 30/34/38/42/48，最多 4 层，按 100% 覆盖。
    return { ap: apByLevel([30, 34, 38, 42, 48]) * 4, fireDmg: 0, atkPct: 0 }
  }
  if (engineId === 'ep-214') {
    // 嵌合编译器：攻击力 12/15/18/21/24%，异常精通 25/31/37/43/50 × 3 层。
    return {
      ap: apByLevel([25, 31, 37, 43, 50]) * 3,
      fireDmg: 0,
      atkPct: [12, 15, 18, 21, 24][index] ?? 12,
    }
  }
  // 朔月裁霜的冰伤/异放增伤对火属性菲欧妮不生效。
  return { ap: 0, fireDmg: 0, atkPct: 0 }
}

export interface DamageBuild {
  cinema: number
  refinement: number
  coreLevel: BuildSpec['coreLevel']
  engineId: string | null
  /** 局内 4 件套提供的攻击力%。官方规则：按局外最终面板攻击相乘。 */
  set4AtkPct?: number
}

function coreIndex(level: BuildSpec['coreLevel']): number {
  return CORE_LEVELS.indexOf(level)
}

/**
 * 官方文本的 A–F 数组带一个额外的末位（F = 85 / 25 / 50），
 * 与 `coreBonus` 的 6 项不是同一索引：A–E 取 index-1，F 取末位。
 */
export function coreValue(values: number[], index: number): number {
  if (index <= 0) return 0
  if (index >= 6) return values[values.length - 1] ?? 0
  return values[index - 1] ?? 0
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
  const amFlat = coreValue(agent.corePassive.amFlat, index)
  const coreCritDmg = coreValue(agent.corePassive.critDmg, index)
  const cinema = Math.min(6, Math.max(0, build.cinema))
  const effect = engineEffect(build.engineId, build.refinement)

  const searCritDmg = (coreCritDmg + 15 + (cinema >= 1 ? 25 : 0)) / 100
  const releaseCritDmg = searCritDmg + 0.4
  const dmgBonus = 1 + (panel.dmgBonus + effect.fireDmg + (cinema >= 2 ? 30 : 0)) / 100
  // 官方规则：局内百分比攻击按「局外最终面板」相乘，而不是角色+音擎基础攻击。
  const inCombatAtkPct = effect.atkPct + (build.set4AtkPct ?? 0)
  const atk = panel.atk * (1 + inCombatAtkPct / 100)

  return {
    atk,
    dmgBonus,
    penRatio: panel.penRatio,
    penValue: panel.penValue,
    ap: panel.anomalyProficiency + amFlat + effect.ap,
    anomalyMastery: panel.anomalyMastery,
    critRate: panel.critRate,
    critDmg: panel.critDmg,
    searCritRate: searCritRate(panel.anomalyMastery),
    searCritDmg,
    releaseCritDmg,
    resPen: cinema >= 6 ? 0.15 : 0,
  }
}
