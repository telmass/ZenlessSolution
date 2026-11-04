import { describe, expect, it } from 'vitest'
import agentJson from '@/data/agents/phoenix.json'
import { computePanel } from '@/core/panel/compute'
import { graduation30, graduation54, inputFromSpec } from '@/core/panel/presets'
import type { Agent } from '@/types/agent'

const agent = agentJson as unknown as Agent

describe('out-of-combat panel engine', () => {
  it('reproduces the legacy 54-roll graduation panel', () => {
    const result = computePanel(inputFromSpec(agent, graduation54))

    expect(result.stats.atk).toBeCloseTo(2538.05, 2)
    expect(result.stats.anomalyProficiency).toBe(510)
    expect(result.stats.anomalyMastery).toBeCloseTo(255.36, 2)
    expect(result.stats.hp).toBeCloseTo(10103.19, 2)
    expect(result.stats.def).toBe(796)
    expect(result.stats.impact).toBe(86)
    expect(result.stats.critRate).toBe(5)
    expect(result.stats.critDmg).toBe(50)
    expect(result.stats.dmgBonus).toBe(30)
    expect(result.stats.penValue).toBe(54)
    expect(result.stats.energyRegen).toBeCloseTo(120, 2)
    expect(result.totalSubstatRolls).toBe(54)
    expect(result.warnings).toEqual([])
  })

  it('reproduces the legacy 30-roll graduation panel', () => {
    const result = computePanel(inputFromSpec(agent, graduation30))

    expect(result.stats.atk).toBeCloseTo(2585.7, 2)
    expect(result.stats.anomalyProficiency).toBe(375)
    expect(result.stats.anomalyMastery).toBeCloseTo(255.36, 2)
    expect(result.totalSubstatRolls).toBe(30)
    expect(result.warnings).toEqual([])
  })

  it('keeps core and engine base bonuses in the base pool (no double counting)', () => {
    const input = inputFromSpec(agent, graduation54)
    const result = computePanel(input)
    const atkSources = result.breakdown.find((row) => row.stat === 'atk')?.sources ?? []
    const labels = atkSources.map((source) => source.label)

    expect(labels).toContain('核心技')
    expect(labels).toContain('涅槃初翎')
    // 1585 base x 1.33 + (316 + 114) = 2538.05, not 1585 + 713 + ...
    expect(result.stats.atk).toBeLessThan(2600)
  })

  it('flags over-budget substats', () => {
    const input = inputFromSpec(agent, graduation54)
    input.substats = { ...input.substats, atk_flat: 7 }
    const result = computePanel(input)
    expect(result.totalSubstatRolls).toBe(55)
    expect(result.warnings.some((warning) => warning.includes('54'))).toBe(true)
  })

  it('warns when 4pc and 2pc are the same set', () => {
    const input = inputFromSpec(agent, graduation54)
    input.set2 = 'ep-191'
    const result = computePanel(input)
    expect(result.warnings.some((warning) => warning.includes('同一套'))).toBe(true)
  })
})
