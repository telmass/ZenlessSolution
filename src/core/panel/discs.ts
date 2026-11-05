import type { ModKind, StatId, SubStatRule } from './types'

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

/** 4/5/6 号位的当前主词条，用来判定副词条冲突与上限。 */
export interface MainStatInfo {
  slot: number
  stat: StatId
  kind: ModKind
}

export function conflictsWithMain(rule: SubStatRule, main?: MainStatInfo): boolean {
  return Boolean(main && main.stat === rule.stat && main.kind === rule.kind)
}

/**
 * 同名词条的全局上限 = (6 - 该词条作为主词条的盘数) × 6。
 *
 * 例：4 号位主词条是异常精通，则异常精通只能出现在另外 5 件盘上，
 * 每盘最多 6 条 → 上限 30 条。
 */
export function maxRollsFor(
  statId: string,
  rules: SubStatRule[],
  mains: MainStatInfo[],
): number {
  const rule = rules.find((item) => item.id === statId)
  if (!rule) return 0
  const blocked = mains.filter(
    (main) => main.stat === rule.stat && main.kind === rule.kind,
  ).length
  return Math.max(0, DISC_SLOTS.length - blocked) * MAX_ROLLS_PER_LINE
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
export function fromCounts(
  counts: Record<string, number>,
  rules: SubStatRule[] = [],
  mains: MainStatInfo[] = [],
): Disc[] {
  const discs = emptyDiscs()
  const entries = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  for (const [id, count] of entries) {
    if (rules.length && count > maxRollsFor(id, rules, mains)) {
      throw new Error(
        `${id} 需要 ${count} 条，超过上限 ${maxRollsFor(id, rules, mains)}（主词条占用的盘不能再出同名词条）`,
      )
    }
    let remaining = count
    while (remaining > 0) {
      const rule = rules.find((item) => item.id === id)
      const candidates = discs
        .filter(
          (disc) =>
            discRolls(disc) < ROLLS_PER_DISC &&
            disc.lines.length < MAX_LINES_PER_DISC &&
            !disc.lines.some((line) => line.id === id) &&
            !(rule && conflictsWithMain(rule, mains.find((item) => item.slot === disc.slot))),
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
export function validateDiscs(
  discs: Disc[],
  rules: SubStatRule[],
  mains: MainStatInfo[] = [],
): string[] {
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
      const rule = rules.find((item) => item.id === line.id)
      if (rule && conflictsWithMain(rule, mains.find((item) => item.slot === disc.slot))) {
        errors.push(`${disc.slot} 号位 ${line.id} 与主词条重复`)
      }
    }
    if (disc.lines.length > MAX_LINES_PER_DISC) {
      errors.push(`${disc.slot} 号位有 ${disc.lines.length} 条副词条，超过 4`)
    }
    if (discRolls(disc) > ROLLS_PER_DISC) {
      errors.push(`${disc.slot} 号位共 ${discRolls(disc)} 条，超过 9`)
    }
  }
  for (const rule of rules) {
    const total = discs.reduce(
      (sum, disc) => sum + disc.lines.filter((line) => line.id === rule.id).reduce((n, line) => n + line.rolls, 0),
      0,
    )
    const cap = maxRollsFor(rule.id, rules, mains)
    if (total > cap) errors.push(`${rule.id} 共 ${total} 条，超过上限 ${cap}`)
  }
  return errors
}
