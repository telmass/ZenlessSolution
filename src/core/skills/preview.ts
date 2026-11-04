import type { AgentMove, GrowthTable } from '@/types/agent'

export interface MovePreview {
  damage?: string
  impact?: string
  hits?: number
}

function groupValue(move: AgentMove, name: string, levelIndex: number) {
  if (!move.table || !('groups' in move.table)) return undefined
  const table = move.table as GrowthTable
  const group = table.groups.find((item) => item.name.includes(name))
  return group?.rows
}

/**
 * First damage / impact row at the requested level. Multi-hit moves expose
 * the number of hit rows so the index can show "3 段" without expanding.
 */
export function movePreview(move: AgentMove, levelIndex = 11): MovePreview {
  const damageRows = groupValue(move, '伤害倍率', levelIndex)
  const impactRows = groupValue(move, '失衡倍率', levelIndex)

  const damage = damageRows?.[0]?.values[levelIndex]
  const impact = impactRows?.[0]?.values[levelIndex]
  const hits = damageRows && damageRows.length > 1 ? damageRows.length : undefined

  return {
    damage: damage || undefined,
    impact: impact || undefined,
    hits,
  }
}
