import type { CombatStats, DamageEventResult, DamageOptions, DamageType, EnemyPreset } from './types'
import { damageAnomaly, damageDirect, damageDisorder, damageRelease } from './zones'

/** Build one row of a damage axis with the matching zone function. */
export function makeEvent(
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
