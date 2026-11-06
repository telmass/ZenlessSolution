import { describe, expect, it } from 'vitest'
import aliceData from '@/data/agents/alice.json'
import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation } from '@/core/panel/presets'
import { computeAgentDamage, enemyById } from '@/core/damage'
import { aliceMasteryConversion, ASSAULT_MULTIPLIER } from '@/core/damage/alice'
import type { DamageBuild } from '@/core/damage/snapshot'

const agent = aliceData as unknown as Agent
const spec = specFromGraduation(agent, agent.guide.graduation!)
const panel = computePanel(inputFromSpec(agent, spec))
const enemy = enemyById('standard')

function run(cinema: number) {
  const build: DamageBuild = {
    cinema,
    refinement: 1,
    coreLevel: 'F',
    engineId: 'ep-1503',
    set4AtkPct: 0,
  }
  return computeAgentDamage(agent, panel.stats, build, enemy)
}

describe('alice damage model', () => {
  it('uses the physical assault multiplier and core follow-ups', () => {
    const result = run(0)
    const assault = result.axis.events.find((event) => event.id === 'assault')!
    const followup = result.axis.events.find((event) => event.id === 'core-followup')!
    expect(assault.multiplier).toBeCloseTo(ASSAULT_MULTIPLIER, 6)
    expect(followup.count).toBe(10)
    expect(followup.total / assault.perHit).toBeCloseTo(0.25, 6)
    expect(result.axis.events.map((event) => event.id)).not.toContain('winning-state-followup')
  })

  it('converts mastery above 140 into proficiency for damage', () => {
    const expected = panel.stats.anomalyProficiency + aliceMasteryConversion(panel.stats.anomalyMastery)
    expect(run(0).stats.ap).toBe(expected)
    expect(run(0).stats.ap).toBeGreaterThan(panel.stats.anomalyProficiency)
  })

  it('applies cinema 1/2/4/6 in order', () => {
    const c0 = run(0).axis.total
    const c1 = run(1).axis.total
    const c2 = run(2).axis.total
    const c4 = run(4).axis.total
    const c6 = run(6).axis.total
    expect(c1).toBeGreaterThan(c0)
    expect(c2 / c1).toBeCloseTo(1.15, 6)
    expect(c4).toBeGreaterThan(c2)
    expect(c6).toBeGreaterThan(c4)
    expect(run(6).axis.events.find((event) => event.id === 'winning-state-followup')?.count).toBe(6)
  })

  it('C6 follow-up scales with proficiency, not attack', () => {
    const c6 = run(6)
    const followup = c6.axis.events.find((event) => event.id === 'winning-state-followup')!
    const lowAtk: PanelStats = { ...panel.stats, atk: panel.stats.atk * 0.8 }
    const highAtk: PanelStats = { ...panel.stats, atk: panel.stats.atk * 1.2 }
    const build: DamageBuild = {
      cinema: 6,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-1503',
      set4AtkPct: 0,
    }
    const low = computeAgentDamage(agent, lowAtk, build, enemy).axis.events.find(
      (event) => event.id === 'winning-state-followup',
    )!
    const high = computeAgentDamage(agent, highAtk, build, enemy).axis.events.find(
      (event) => event.id === 'winning-state-followup',
    )!
    expect(low.perHit).toBeCloseTo(followup.perHit, 6)
    expect(high.perHit).toBeCloseTo(followup.perHit, 6)
  })
})
