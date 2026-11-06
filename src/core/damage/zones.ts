import type { CombatStats, CritMode, DamageOptions, DamageType, EnemyPreset } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** 灼蚀暴击率：30% + 超过 155 点掌控的部分 × 0.7%，上限 100%。 */
export function searCritRate(anomalyMastery: number): number {
  return clamp(30 + Math.max(anomalyMastery - 155, 0) * 0.7, 0, 100) / 100
}

export function effectiveDefense(
  enemy: EnemyPreset,
  stats: CombatStats,
  defIgnore = 0,
): number {
  const penRatio = clamp(stats.penRatio, 0, 95) / 100
  return Math.max(
    0,
    enemy.defense * (1 - clamp(defIgnore, 0, 1)) * (1 - penRatio) - stats.penValue,
  )
}

export function defenseZone(enemy: EnemyPreset, stats: CombatStats, defIgnore = 0): number {
  return 794 / (794 + effectiveDefense(enemy, stats, defIgnore))
}

export function resistanceZone(
  enemy: EnemyPreset,
  stats: CombatStats,
  extraResPen = 0,
): number {
  return 1 - enemy.resistance / 100 + stats.resPen + extraResPen
}

export function stunZone(enemy: EnemyPreset, stunned?: boolean): number {
  return (stunned ?? enemy.stunned) ? 1.5 : 1
}

export function directCritZone(stats: CombatStats, mode: CritMode = 'expected'): number {
  const cr = clamp(stats.critRate / 100, 0, 1)
  const cd = clamp(stats.critDmg / 100, 0, 20)
  if (mode === 'crit') return 1 + cd
  if (mode === 'none') return 1
  return 1 + cr * cd
}

export function anomalyCritZone(stats: CombatStats, mode: CritMode = 'expected'): number {
  const cr = clamp(stats.searCritRate, 0, 1)
  const cd = clamp(stats.searCritDmg, 0, 20)
  if (mode === 'crit') return 1 + cd
  if (mode === 'none') return 1
  return 1 + cr * cd
}

export function releaseCritZone(stats: CombatStats, mode: CritMode = 'expected'): number {
  const cr = clamp(stats.searCritRate, 0, 1)
  const cd = clamp(stats.releaseCritDmg, 0, 20)
  if (mode === 'crit') return 1 + cd
  if (mode === 'none') return 1
  return 1 + cr * cd
}

interface SharedOptions {
  type: DamageType
  mode: CritMode
  enemy: EnemyPreset
  options: DamageOptions
}

function commonZones({ type, mode, enemy, options }: SharedOptions, stats: CombatStats) {
  const defIgnore = options.defIgnore ?? 0
  const extraResPen = type === 'release' ? (stats.releaseResPen ?? 0) : 0
  return {
    dmgBonus: stats.dmgBonus,
    defZone: defenseZone(enemy, stats, defIgnore),
    resZone: resistanceZone(enemy, stats, extraResPen),
    stunZone: stunZone(enemy, options.stunned),
    apZone: stats.ap / 100,
    levelZone: 2,
    critZone: directCritZone(stats, mode),
    anomalyCritZone: anomalyCritZone(stats, mode),
    releaseCritZone: releaseCritZone(stats, mode),
  }
}

export function damageDirect(
  stats: CombatStats,
  multiplier: number,
  enemy: EnemyPreset,
  options: DamageOptions = {},
): { perHit: number; zones: ReturnType<typeof commonZones> } {
  const mode = options.critMode ?? 'expected'
  const zones = commonZones({ type: 'direct', mode, enemy, options }, stats)
  const perHit =
    stats.atk *
    multiplier *
    zones.dmgBonus *
    zones.defZone *
    zones.resZone *
    zones.stunZone *
    zones.critZone
  return { perHit, zones }
}

export function damageAnomaly(
  stats: CombatStats,
  multiplier: number,
  enemy: EnemyPreset,
  options: DamageOptions = {},
): { perHit: number; zones: ReturnType<typeof commonZones> } {
  const mode = options.critMode ?? 'expected'
  const zones = commonZones({ type: 'anomaly', mode, enemy, options }, stats)
  const perHit =
    stats.atk *
    zones.dmgBonus *
    zones.defZone *
    zones.resZone *
    zones.stunZone *
    zones.apZone *
    zones.levelZone *
    multiplier *
    (stats.anomalyDamageBonus ?? 1) *
    zones.anomalyCritZone
  return { perHit, zones }
}

export function damageRelease(
  stats: CombatStats,
  multiplier: number,
  enemy: EnemyPreset,
  options: DamageOptions = {},
): { perHit: number; zones: ReturnType<typeof commonZones> } {
  const mode = options.critMode ?? 'expected'
  const zones = commonZones({ type: 'release', mode, enemy, options }, stats)
  const perHit =
    stats.atk *
    zones.dmgBonus *
    zones.defZone *
    zones.resZone *
    zones.stunZone *
    zones.apZone *
    zones.levelZone *
    multiplier *
    (stats.releaseDamageBonus ?? 1) *
    zones.releaseCritZone
  return { perHit, zones }
}

export function damageDisorder(
  stats: CombatStats,
  multiplier: number,
  enemy: EnemyPreset,
  options: DamageOptions = {},
): { perHit: number; zones: ReturnType<typeof commonZones> } {
  const zones = commonZones({ type: 'disorder', mode: 'none', enemy, options }, stats)
  const perHit =
    stats.atk *
    zones.dmgBonus *
    zones.defZone *
    zones.resZone *
    zones.stunZone *
    zones.apZone *
    zones.levelZone *
    multiplier *
    (stats.disorderDamageBonus ?? 1)
  return { perHit, zones }
}
