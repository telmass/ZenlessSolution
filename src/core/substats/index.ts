import { substats } from '@/core/panel/data'
import type { SubStatRule } from '@/core/panel/types'

export type SubstatTier = 'effective' | 'small' | 'invalid'

export interface SubstatProfile {
  effective: string[]
  small: string[]
}

export interface SubstatCountRow {
  id: string
  label: string
  rolls: number
  tier: SubstatTier
  rule: SubStatRule
}

export interface SubstatAnalysis {
  rows: SubstatCountRow[]
  effective: number
  small: number
  invalid: number
  total: number
  budget: number
  overBudget: boolean
  includePenValue: boolean
}

/**
 * 41 有效 + 12 小 + 1 无效 的展示白名单。
 *
 * 仅用于图鉴/配装的展示与高亮；禁止进入面板、伤害或优化权重。
 */
export const PHOENIX_PROFILE: SubstatProfile = {
  effective: ['anomaly_proficiency', 'atk_pct'],
  small: ['atk_flat', 'pen_value'],
}

/**
 * 单件驱动盘的词条数 = 存储值 / S 级单条步长。
 * 必须是 1–6 的整数；不满足则返回 null（不猜测）。
 */
export function countRolls(value: number, step: number): number | null {
  if (step <= 0) return null
  const ratio = value / step
  const rolls = Math.round(ratio)
  if (Math.abs(ratio - rolls) > 1e-6) return null
  if (rolls < 1 || rolls > 6) return null
  return rolls
}

export function analyzeSubstats(
  counts: Record<string, number>,
  profile: SubstatProfile = PHOENIX_PROFILE,
  options: { includePenValue?: boolean; budget?: number } = {},
): SubstatAnalysis {
  const includePenValue = options.includePenValue ?? false
  const budget = options.budget ?? 54
  const effective = new Set(profile.effective)
  const small = new Set(profile.small)

  const rows: SubstatCountRow[] = []
  let effectiveTotal = 0
  let smallTotal = 0
  let invalidTotal = 0

  for (const rule of substats) {
    const rolls = Math.max(0, counts[rule.id] ?? 0)
    if (rolls === 0) continue

    let tier: SubstatTier = 'invalid'
    if (effective.has(rule.id) || (includePenValue && rule.id === 'pen_value')) {
      tier = 'effective'
      effectiveTotal += rolls
    } else if (small.has(rule.id)) {
      tier = 'small'
      smallTotal += rolls
    } else {
      invalidTotal += rolls
    }

    rows.push({ id: rule.id, label: rule.label, rolls, tier, rule })
  }

  const total = effectiveTotal + smallTotal + invalidTotal
  return {
    rows,
    effective: effectiveTotal,
    small: smallTotal,
    invalid: invalidTotal,
    total,
    budget,
    overBudget: total > budget,
    includePenValue,
  }
}
