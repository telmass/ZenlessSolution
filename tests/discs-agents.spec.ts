import { describe, expect, it } from 'vitest'
import index from '@/data/agents/index.json'
import panelData from '@/data/panel.json'
import { substats } from '@/core/panel/data'
import {
  discRolls,
  fromCounts,
  toCounts,
  totalRolls,
  validateDiscs,
  type MainStatInfo,
} from '@/core/panel/discs'
import type { Agent, AgentIndexItem } from '@/types/agent'

const modules = import.meta.glob<{ default: Agent }>('../src/data/agents/*.json', { eager: true })
const agents = Object.entries(modules)
  .filter(([path]) => !path.endsWith('/index.json'))
  .map(([, module]) => module.default)

const panel = panelData as unknown as {
  mainStats: { slot: number; id: string; stat: string; kind: 'pct' | 'flat' }[]
}

function mainsFor(agent: Agent): MainStatInfo[] {
  const spec = agent.guide.graduation!.panel!
  const out: MainStatInfo[] = []
  for (const slot of [4, 5, 6] as const) {
    const rule = panel.mainStats.find(
      (item) => item.slot === slot && item.id === spec.mainStats[String(slot) as '4' | '5' | '6'],
    )
    if (rule) out.push({ slot, stat: rule.stat as MainStatInfo['stat'], kind: rule.kind })
  }
  return out
}

describe('every shipped 54-roll graduation spec', () => {
  it('covers all open agents', () => {
    const open = (index as unknown as AgentIndexItem[]).filter((item) => item.available)
    expect(agents).toHaveLength(open.length)
  })

  for (const agent of agents) {
    it(`${agent.slug}: expands into six legal discs`, () => {
      const spec = agent.guide.graduation!.panel!
      const mains = mainsFor(agent)
      const maxLines = Object.keys(spec.substats).reduce((sum, id) => {
        const rule = substats.find((item) => item.id === id)
        if (!rule) return sum
        const allowed = 6 - mains.filter((main) => main.stat === rule.stat && main.kind === rule.kind).length
        return sum + Math.min(6, allowed)
      }, 0)
      if (maxLines < 24) {
        // 少于 4 种可用词条时，54 条无法铺满 6×4 条副词条槽位（数据本身不是合法盘面）。
        expect(() => fromCounts(spec.substats, substats, mains)).toThrow()
        return
      }
      const discs = fromCounts(spec.substats, substats, mains)
      expect(totalRolls(discs)).toBe(54)
      expect(toCounts(discs)).toEqual(spec.substats)
      for (const disc of discs) {
        expect(disc.lines).toHaveLength(4)
        expect(discRolls(disc)).toBe(9)
      }
      expect(validateDiscs(discs, substats, mains)).toEqual([])
    })
  }
})
