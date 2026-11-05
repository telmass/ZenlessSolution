import { describe, expect, it } from 'vitest'
import phoenixData from '@/data/agents/phoenix.json'
import { analyzeSubstats, countRolls } from '@/core/substats'
import { specFromGraduation } from '@/core/panel/presets'
import type { Agent } from '@/types/agent'

const agent = phoenixData as unknown as Agent
const PHOENIX_PROFILE = agent.substatProfile
const graduation54 = specFromGraduation(agent, agent.guide.graduation!)
const graduation30 = specFromGraduation(agent, agent.guide.graduationAlt!)

describe('substat rolls', () => {
  it('accepts only integral 1–6 rolls', () => {
    expect(countRolls(9, 9)).toBe(1)
    expect(countRolls(54, 9)).toBe(6)
    expect(countRolls(4.5, 9)).toBeNull()
    expect(countRolls(63, 9)).toBeNull()
    expect(countRolls(0, 9)).toBeNull()
  })
})

describe('phoenix effective substats', () => {
  it('reproduces 41 effective + 12 small + 1 invalid', () => {
    const result = analyzeSubstats(graduation54.substats, PHOENIX_PROFILE, { budget: 54 })
    expect(result.effective).toBe(41)
    expect(result.small).toBe(12)
    expect(result.invalid).toBe(1)
    expect(result.total).toBe(54)
    expect(result.overBudget).toBe(false)
  })

  it('moves pen value into effective when toggled', () => {
    const result = analyzeSubstats(graduation54.substats, PHOENIX_PROFILE, {
      budget: 54,
      includePenValue: true,
    })
    expect(result.effective).toBe(47)
    expect(result.small).toBe(6)
    expect(result.invalid).toBe(1)
  })

  it('handles the 30-roll budget', () => {
    const result = analyzeSubstats(graduation30.substats, PHOENIX_PROFILE, { budget: 30 })
    expect(result.effective).toBe(29)
    expect(result.small).toBe(1)
    expect(result.invalid).toBe(0)
    expect(result.total).toBe(30)
  })

  it('flags over-budget counts', () => {
    const result = analyzeSubstats({ anomaly_proficiency: 31, atk_pct: 24 }, PHOENIX_PROFILE, {
      budget: 54,
    })
    expect(result.total).toBe(55)
    expect(result.overBudget).toBe(true)
  })
})
