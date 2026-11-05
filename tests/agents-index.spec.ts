import { describe, expect, it } from 'vitest'
import index from '@/data/agents/index.json'
import source from '../data/sources/agents-index.json'
import type { AgentIndexItem } from '@/types/agent'

const agents = index as unknown as AgentIndexItem[]

describe('agent codex index', () => {
  it('derives from the checked-in roster source', () => {
    expect(agents.map((agent) => agent.slug)).toEqual(source.map((agent) => agent.slug))
    agents.forEach((agent, index) => {
      const row = source[index]
      expect(agent.id).toBe(row.id)
      // Locked entries are copied verbatim; open ones gain media keys/tags.
      if (!agent.available) expect(agent).toEqual(row)
    })
  })

  it('lists the full 61-agent roster with every Anomaly agent open', () => {
    expect(agents).toHaveLength(61)
    const open = agents.filter((agent) => agent.available)
    expect(open).toHaveLength(13)
    expect(open.every((agent) => agent.specialty === '异常')).toBe(true)
    expect(agents[0].slug).toBe('phoenix')
    expect(agents[0].available).toBe(true)
  })

  it('keeps slugs and wiki ids unique', () => {
    expect(new Set(agents.map((agent) => agent.slug)).size).toBe(61)
    expect(new Set(agents.map((agent) => agent.id)).size).toBe(61)
  })

  it('provides every field the list filters and cards rely on', () => {
    for (const agent of agents) {
      expect(agent.name).toBeTruthy()
      expect(agent.fullName).toBeTruthy()
      expect(agent.en).toBeTruthy()
      expect(agent.rarity).toBeTruthy()
      expect(agent.element).toBeTruthy()
      expect(agent.specialty).toBeTruthy()
      expect(agent.faction).toBeTruthy()
      expect(typeof agent.available).toBe('boolean')
    }
  })

  it('keeps locked agents free of detail-page media references', () => {
    const locked = agents.filter((agent) => !agent.available)
    expect(locked.every((agent) => agent.avatar === '' && agent.full === '')).toBe(true)
  })
})
