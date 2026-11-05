import type { ModKind, StatId, SubStatRule } from './types'

/** 每件驱动盘满级 9 条：4 条副词条各 1 条基础 + 5 次强化。 */
export const ROLLS_PER_DISC = 9
/** 单条副词条最多 6 次（1 基础 + 5 强化）。 */
export const MAX_ROLLS_PER_LINE = 6
/** 一件盘最多 4 条副词条；必须选满 4 条才能开始强化。 */
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

export function emptyDiscs(): Disc[] {
  return DISC_SLOTS.map((slot) => ({ slot, lines: [] }))
}

export function discRolls(disc: Disc): number {
  return disc.lines.reduce((sum, line) => sum + Math.max(0, line.rolls), 0)
}

export function totalRolls(discs: Disc[]): number {
  return discs.reduce((sum, disc) => sum + discRolls(disc), 0)
}

/** 只有选满 4 条副词条之后才允许强化（rolls > 1）。 */
export function canUpgrade(disc: Disc): boolean {
  return disc.lines.length === MAX_LINES_PER_DISC
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

function allowedSlots(rule: SubStatRule, mains: MainStatInfo[]): number[] {
  return DISC_SLOTS.filter((slot) => {
    const main = mains.find((item) => item.slot === slot)
    return !conflictsWithMain(rule, main)
  })
}

/**
 * 把「满配 54 条」的聚合条数还原成 6 件盘。
 *
 * 硬规则：副词条必须选满 4 条才能开始强化。因此一套 54 条一定是
 * 6 盘 ×（4 条基础 + 5 次强化）。分配时同时满足：
 * - 同盘不能与主词条同名；同名每条 ≤6 次、全局 ≤(6-主词条盘数)×6；
 * - 每盘 4 条、共 9 条（4 基础 + 5 强化）。
 *
 * 不足 54 条的预算（例如旧攻略的 30 条参考）不是「选满 4 条再强化」的合法
 * 盘面，会直接报错；调用方应跳过或另行补全。
 */
export function fromCounts(
  counts: Record<string, number>,
  rules: SubStatRule[] = [],
  mains: MainStatInfo[] = [],
): Disc[] {
  const total = Object.values(counts).reduce((sum, value) => sum + Math.max(0, value), 0)
  const discs = emptyDiscs()
  if (total === 0) return discs
  if (total !== ROLLS_PER_DISC * DISC_SLOTS.length) {
    throw new Error(
      `预算 ${total} 条不是满配 54 条：副词条必须选满 4 条后才能强化，无法还原成合法盘面`,
    )
  }

  const entries = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  for (const [id, count] of entries) {
    const rule = rules.find((item) => item.id === id)
    if (!rule) continue
    const cap = maxRollsFor(id, rules, mains)
    if (count > cap) {
      throw new Error(
        `${id} 需要 ${count} 条，超过上限 ${cap}（主词条占用的盘不能再出同名词条）`,
      )
    }
  }

  // 1) 决定每种词条占几条副词条槽位；槽位总数必须 = 4 × 6 = 24。
  const lineCounts = new Map<string, number>()
  for (const [id, count] of entries) {
    lineCounts.set(id, Math.max(1, Math.ceil(count / MAX_ROLLS_PER_LINE)))
  }
  let slots = [...lineCounts.values()].reduce((sum, value) => sum + value, 0)
  while (slots < DISC_SLOTS.length * MAX_LINES_PER_DISC) {
    const candidates = entries
      .filter(([id, count]) => {
        const rule = rules.find((item) => item.id === id)
        const used = lineCounts.get(id) ?? 0
        if (!rule) return false
        if (used >= MAX_ROLLS_PER_LINE) return false
        if (used >= allowedSlots(rule, mains).length) return false
        return count > used
      })
      .sort((a, b) => b[1] / (lineCounts.get(b[0]) ?? 1) - a[1] / (lineCounts.get(a[0]) ?? 1))
    const next = candidates[0]
    if (!next) break
    lineCounts.set(next[0], (lineCounts.get(next[0]) ?? 0) + 1)
    slots += 1
  }
  if (slots !== DISC_SLOTS.length * MAX_LINES_PER_DISC) {
    throw new Error(`无法把 ${entries.length} 种词条铺满 24 条副词条槽位（当前 ${slots}）`)
  }

  // 2) 槽位分到 6 件盘：同名每盘最多 1 条、每盘最多 4 条、避开主词条盘。
  for (const [id] of [...lineCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const rule = rules.find((item) => item.id === id)
    if (!rule) continue
    let remaining = lineCounts.get(id) ?? 0
    const allowed = allowedSlots(rule, mains)
    while (remaining > 0 && allowed.length) {
      const disc = discs
        .filter(
          (item) =>
            allowed.includes(item.slot) &&
            item.lines.length < MAX_LINES_PER_DISC &&
            !item.lines.some((line) => line.id === id),
        )
        .sort((a, b) => a.lines.length - b.lines.length || a.slot - b.slot)[0]
      if (!disc) break
      disc.lines.push({ id, rolls: 1 })
      remaining -= 1
    }
    if (remaining > 0) throw new Error(`${id} 还有 ${remaining} 条槽位放不下`)
  }

  // 3) 分配强化次数：每条最多 +5，每盘正好 5 次。
  const upgrades = new Map<number, number>(DISC_SLOTS.map((slot) => [slot, 5]))
  for (const [id, count] of entries) {
    let need = count - (lineCounts.get(id) ?? 0)
    const withStat = discs.filter((disc) => disc.lines.some((line) => line.id === id))
    for (const disc of withStat) {
      const line = disc.lines.find((item) => item.id === id)!
      const roomByLine = MAX_ROLLS_PER_LINE - line.rolls
      const roomByDisc = upgrades.get(disc.slot) ?? 0
      const add = Math.min(need, roomByLine, roomByDisc)
      if (add <= 0) continue
      line.rolls += add
      need -= add
      upgrades.set(disc.slot, roomByDisc - add)
    }
    if (need > 0) throw new Error(`${id} 还有 ${need} 次强化分配不出去`)
  }

  const errors = validateDiscs(discs, rules, mains)
  if (errors.length) throw new Error(errors.join('; '))
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
    if (disc.lines.length < MAX_LINES_PER_DISC) {
      const upgraded = disc.lines.find((line) => line.rolls > 1)
      if (upgraded) {
        errors.push(`${disc.slot} 号位未选满 4 条副词条，不能强化 ${upgraded.id}`)
      }
    }
    if (discRolls(disc) > ROLLS_PER_DISC) {
      errors.push(`${disc.slot} 号位共 ${discRolls(disc)} 条，超过 9`)
    }
  }
  for (const rule of rules) {
    const total = discs.reduce(
      (sum, disc) =>
        sum + disc.lines.filter((line) => line.id === rule.id).reduce((n, line) => n + line.rolls, 0),
      0,
    )
    const cap = maxRollsFor(rule.id, rules, mains)
    if (total > cap) errors.push(`${rule.id} 共 ${total} 条，超过上限 ${cap}`)
  }
  return errors
}
