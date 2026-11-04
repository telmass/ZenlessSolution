import { describe, expect, it } from 'vitest'
import index from '@/data/agents/index.json'
import source from '../data/sources/agents-index.json'
import type { AgentIndexItem } from '@/types/agent'

const agents = index as unknown as AgentIndexItem[]

describe('agent codex index', () => {
  it('matches the checked-in roster source', () => {
    expect(agents).toEqual(source)
  })

  it('lists the full 61-agent roster with only Phoenix open', () => {
    expect(agents).toHaveLength(61)
    expect(agents.filter((agent) => agent.available)).toHaveLength(1)
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
