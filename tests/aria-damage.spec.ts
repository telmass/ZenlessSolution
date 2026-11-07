import { describe, expect, it } from 'vitest'
import ariaData from '@/data/agents/aria.json'
import type { Agent } from '@/types/agent'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation } from '@/core/panel/presets'
import { computeAgentDamage, enemyById } from '@/core/damage'
import { ariaReleaseScale, ARIA_RELEASE_COEF_ETHER } from '@/core/damage/aria'
import type { DamageBuild } from '@/core/damage/snapshot'

const agent = ariaData as unknown as Agent
const spec = specFromGraduation(agent, agent.guide.graduation!)
const panel = computePanel(inputFromSpec(agent, spec))
const enemy = enemyById('standard')

function run(cinema: number) {
  const build: DamageBuild = {
    cinema,
    refinement: 1,
    coreLevel: 'F',
    engineId: 'ep-1883',
    set4AtkPct: 0,
  }
  return computeAgentDamage(agent, panel.stats, build, enemy)
}

describe('aria damage model', () => {
  it('uses the ether release coefficient and 1.5x stun multiplier', () => {
    expect(ARIA_RELEASE_COEF_ETHER.at(-1)).toBe(27.5)
    expect(ariaReleaseScale(196.3, 'F', true)).toBeCloseTo(8.097375, 6)
    const event = run(0).axis.events[0]
    expect(event.id).toBe('release')
    expect(event.multiplier).toBeCloseTo(0.625 * ariaReleaseScale(panel.stats.anomalyMastery, 'F', true), 6)
  })

  it('adds core proficiency to the in-combat AP used by damage', () => {
    expect(run(0).stats.ap).toBeGreaterThan(panel.stats.anomalyProficiency)
  })

  it('applies C1/C2/C6 in order', () => {
    const c0 = run(0).axis.total
    const c1 = run(1).axis.total
    const c2 = run(2).axis.total
    const c6 = run(6).axis.total
    expect(c1).toBeGreaterThan(c0)
    expect(c2).toBeGreaterThan(c1)
    expect(c6).toBeGreaterThan(c2)
  })
})
