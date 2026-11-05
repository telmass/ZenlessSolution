import type { SubStatRule } from './types'

/** 每件驱动盘满级 9 条：3 初始 + 5 强化 + 1 补足。 */
export const ROLLS_PER_DISC = 9
/** 单条副词条最多 6 次（1 初始 + 5 强化）。 */
export const MAX_ROLLS_PER_LINE = 6
/** 一件盘最多 4 条副词条。 */
export const MAX_LINES_PER_DISC = 4
export const DISC_SLOTS = [1, 2, 3, 4, 5, 6] as const

export interface DiscLine {
  id: string
  rolls: number
}

export interface Disc {
  slot: number
  lines: DiscLine[]
}

export function emptyDiscs(): Disc[] {
  return DISC_SLOTS.map((slot) => ({ slot, lines: [] }))
}

export function discRolls(disc: Disc): number {
  return disc.lines.reduce((sum, line) => sum + Math.max(0, line.rolls), 0)
}

export function totalRolls(discs: Disc[]): number {
  return discs.reduce((sum, disc) => sum + discRolls(disc), 0)
}

/** 每件盘 → 聚合条数（面板计算使用的口径）。 */
export function toCounts(discs: Disc[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const disc of discs) {
    for (const line of disc.lines) {
      if (!line.id || line.rolls <= 0) continue
      counts[line.id] = (counts[line.id] ?? 0) + line.rolls
    }
  }
  return counts
}

export function discOfLine(discs: Disc[], statId: string): number[] {
  return discs
    .filter((disc) => disc.lines.some((line) => line.id === statId))
    .map((disc) => disc.slot)
}

/**
 * 把聚合条数还原成 6 件盘的分配。
 *
 * 规则：每盘 ≤9 条、≤4 条副词条；同名副词条每盘最多 1 条、每条 ≤6 次。
 * 先按条数从多到少填，每次选剩余空间最大的盘；分配完必须能精确还原，
 * 否则直接报错（不静默兜底）。
 */
export function fromCounts(counts: Record<string, number>): Disc[] {
  const discs = emptyDiscs()
  const entries = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  for (const [id, count] of entries) {
    let remaining = count
    while (remaining > 0) {
      const candidates = discs
        .filter(
          (disc) =>
            discRolls(disc) < ROLLS_PER_DISC &&
            disc.lines.length < MAX_LINES_PER_DISC &&
            !disc.lines.some((line) => line.id === id),
        )
        .sort(
          (a, b) =>
            discRolls(a) - discRolls(b) || a.lines.length - b.lines.length || a.slot - b.slot,
        )
      const target = candidates[0]
      if (!target) {
        throw new Error(
          `cannot distribute ${count} rolls of ${id}: no disc has room (remaining ${remaining})`,
        )
      }
      const room = ROLLS_PER_DISC - discRolls(target)
      const rolls = Math.min(MAX_ROLLS_PER_LINE, room, remaining)
      target.lines.push({ id, rolls })
      remaining -= rolls
    }
  }
  return discs
}

/** 校验单件盘的合法分配；返回错误列表（空 = 合法）。 */
export function validateDiscs(discs: Disc[], rules: SubStatRule[]): string[] {
  const ids = new Set(rules.map((rule) => rule.id))
  const errors: string[] = []
  const slots = new Set<number>()
  for (const disc of discs) {
    if (slots.has(disc.slot)) errors.push(`重复的 ${disc.slot} 号位`)
    slots.add(disc.slot)
    const seen = new Set<string>()
    for (const line of disc.lines) {
      if (!ids.has(line.id)) errors.push(`${disc.slot} 号位存在未知词条 ${line.id}`)
      if (seen.has(line.id)) errors.push(`${disc.slot} 号位重复词条 ${line.id}`)
      seen.add(line.id)
      if (line.rolls < 1 || line.rolls > MAX_ROLLS_PER_LINE) {
        errors.push(`${disc.slot} 号位 ${line.id} 条数 ${line.rolls} 不在 1–6`)
      }
    }
    if (disc.lines.length > MAX_LINES_PER_DISC) {
      errors.push(`${disc.slot} 号位有 ${disc.lines.length} 条副词条，超过 4`)
    }
    if (discRolls(disc) > ROLLS_PER_DISC) {
      errors.push(`${disc.slot} 号位共 ${discRolls(disc)} 条，超过 9`)
    }
  }
  return errors
}
