import { describe, expect, it } from 'vitest'
import graceData from '@/data/agents/grace.json'
import type { Agent } from '@/types/agent'
import { specFromGraduation } from '@/core/panel/presets'
import { analyzeSubstats } from '@/core/substats'

const agent = graceData as unknown as Agent

describe('grace substat profile', () => {
  it('treats small attack and pen value as small, like the other anomaly agents', () => {
    expect(agent.substatProfile.effective).toEqual(['atk_pct', 'anomaly_proficiency'])
    expect(agent.substatProfile.small).toEqual(['atk_flat', 'pen_value'])
  })

  it('counts 38 effective / 12 small / 4 invalid on the 54-roll spec', () => {
    const spec = specFromGraduation(agent, agent.guide.graduation!)
    const result = analyzeSubstats(spec.substats, agent.substatProfile, { budget: spec.budget })
    expect(result.effective).toBe(38)
    expect(result.small).toBe(12)
    expect(result.invalid).toBe(4)
  })

  it('counts 23 effective / 7 small / 0 invalid on the 30-roll spec', () => {
    const spec = specFromGraduation(agent, agent.guide.graduationAlt!)
    const result = analyzeSubstats(spec.substats, agent.substatProfile, { budget: spec.budget })
    expect(result.effective).toBe(23)
    expect(result.small).toBe(7)
    expect(result.invalid).toBe(0)
  })
})
