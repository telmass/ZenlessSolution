import type { Agent } from '@/types/agent'

const LEVEL_INDEX: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  12: 11,
  13: 12,
  14: 13,
  15: 14,
  16: 15,
}

/**
 * Read a level-12 multiplier from the official growth table.
 * Values are stored as strings like "761.1%"; return a fraction (7.611).
 */
export function moveMultiplier(
  agent: Agent,
  categoryKey: string,
  moveTitle: string,
  groupName: string,
  rowLabel: string,
  level = 12,
): number {
  const category = agent.skills.find((skill) => skill.key === categoryKey)
  if (!category) throw new Error(`missing skill category ${categoryKey}`)
  const move = category.moves.find((item) => item.title === moveTitle)
  if (!move) throw new Error(`missing move ${moveTitle}`)
  const table = move.table
  if (!table || !('groups' in table)) {
    throw new Error(`missing growth table for ${moveTitle}`)
  }
  const group = table.groups.find((item) => item.name === groupName)
  if (!group) throw new Error(`missing group ${groupName} in ${moveTitle}`)
  const row = group.rows.find((item) => item.label === rowLabel)
  if (!row) throw new Error(`missing row ${rowLabel} in ${moveTitle}`)
  const index = LEVEL_INDEX[level]
  if (index === undefined || !row.values[index]) {
    throw new Error(`missing level ${level} for ${moveTitle}/${rowLabel}`)
  }
  return Number.parseFloat(row.values[index].replace('%', '')) / 100
}
