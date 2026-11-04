import { describe, expect, it } from 'vitest'
import phoenixData from '@/data/agents/phoenix.json'
import type { Agent } from '@/types/agent'
import { computePanel } from '@/core/panel/compute'
import { graduation54, inputFromSpec } from '@/core/panel/presets'
import {
  buildCombatStats,
  computePhoenixDamage,
  damageAnomaly,
  damageDisorder,
  damageRelease,
  enemyById,
  searCritRate,
  type CombatStats,
} from '@/core/damage'

const agent = phoenixData as unknown as Agent
const standard = enemyById('standard')

const oracleStats: CombatStats = {
  atk: 1466,
  dmgBonus: 1,
  penRatio: 0,
  penValue: 0,
  ap: 278,
  anomalyMastery: 200,
  critRate: 5,
  critDmg: 50,
  searCritRate: 0.615,
  searCritDmg: 0.8,
  releaseCritDmg: 0.8,
  resPen: 0,
}

describe('damage zones', () => {
  it('reproduces the independent release oracle', () => {
    const expected =
      1466 * 4.45 * (794 / (794 + 953)) * 1.5 * (278 / 100) * 2 * (1 + 0.615 * 0.8)
    const result = damageRelease(oracleStats, 4.45, standard, { stunned: true })
    expect(result.perHit).toBeCloseTo(expected, 8)
    expect(result.perHit).toBeCloseTo(36894.0602371975, 8)
  })

  it('reproduces the second independent release oracle', () => {
    const expected = 1466 * 4.45 * (794 / (794 + 953)) * 1.5 * (278 / 100) * 2 * (1 + 0.3 * 0.8)
    const result = damageRelease({ ...oracleStats, searCritRate: 0.3, releaseCritDmg: 0.8 }, 4.45, standard, {
      stunned: true,
    })
    expect(result.perHit).toBeCloseTo(expected, 8)
    expect(result.perHit).toBeCloseTo(30662.6237896279, 8)
  })

  it('reproduces the sear crit thresholds', () => {
    expect(searCritRate(154)).toBeCloseTo(0.3, 10)
    expect(searCritRate(155.5)).toBeCloseTo(0.3035, 10)
    expect(searCritRate(200)).toBeCloseTo(0.615, 10)
    expect(searCritRate(254.9)).toBeCloseTo(0.9993, 10)
    expect(searCritRate(255)).toBe(1)
    expect(searCritRate(256)).toBe(1)
  })

  it('uses the burn / disorder tick multipliers', () => {
    const burn = damageAnomaly(oracleStats, 10, standard, { stunned: false })
    const c2Burn = damageAnomaly(oracleStats, 12, standard, { stunned: false })
    const disorder = damageDisorder(oracleStats, 14.5, standard, { stunned: false })
    const c2Disorder = damageDisorder(oracleStats, 16.5, standard, { stunned: false })
    expect(c2Burn.perHit / burn.perHit).toBeCloseTo(1.2, 8)
    expect(c2Disorder.perHit / disorder.perHit).toBeCloseTo(16.5 / 14.5, 8)
  })
})

describe('weapon in-combat effects', () => {
  const panel = computePanel(inputFromSpec(agent, graduation54))

  it('adds shell and moonlight AP effects without double-counting panel stats', () => {
    const shell = buildCombatStats(panel.stats, agent, {
      cinema: 0,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-1883',
    })
    const moonlight = buildCombatStats(panel.stats, agent, {
      cinema: 0,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-1964',
    })
    expect(shell.ap).toBe(510 + 85 + 90)
    expect(moonlight.ap).toBe(510 + 85)
    expect(shell.ap).toBeGreaterThan(moonlight.ap)
  })

  it('adds dual-star stacks and compiler ATK%', () => {
    const dual = buildCombatStats(panel.stats, agent, {
      cinema: 0,
      refinement: 5,
      coreLevel: 'F',
      engineId: 'ep-212',
    })
    const compiler = buildCombatStats(panel.stats, agent, {
      cinema: 0,
      refinement: 3,
      coreLevel: 'F',
      engineId: 'ep-214',
    })
    expect(dual.ap).toBe(510 + 85 + 192)
    expect(compiler.ap).toBe(510 + 85 + 111)
    expect(compiler.atk).toBeCloseTo(panel.stats.atk * 1.18, 8)
  })

  it('applies 4-piece ATK% on the final out-of-combat panel', () => {
    const set4 = buildCombatStats(panel.stats, agent, {
      cinema: 0,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-2259',
      set4AtkPct: 10,
    })
    expect(set4.atk).toBeCloseTo(panel.stats.atk * 1.1, 8)
  })
})

describe('phoenix 20s axis', () => {
  const panel = computePanel(inputFromSpec(agent, graduation54))

  it('produces baseline events and a single release', () => {
    const result = computePhoenixDamage(agent, panel.stats, {
      cinema: 0,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-2259',
    }, standard)
    expect(result.axis.duration).toBe(20)
    expect(result.axis.events).toHaveLength(8)
    expect(result.single.total).toBeGreaterThan(0)
    expect(result.axis.total).toBeGreaterThan(result.single.total)
    expect(result.axis.dps).toBeCloseTo(result.axis.total / 20, 8)
  })

  it('adds C2 burn ticks, C4 extra release and C6 penetration', () => {
    const c2 = computePhoenixDamage(agent, panel.stats, {
      cinema: 2,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-2259',
    }, standard)
    const burn = c2.axis.events.find((item) => item.id === 'burn')
    const disorder = c2.axis.events.find((item) => item.id === 'disorder')
    expect(burn?.multiplier).toBe(12)
    expect(disorder?.multiplier).toBe(16.5)

    const c4 = computePhoenixDamage(agent, panel.stats, {
      cinema: 4,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-2259',
    }, standard)
    expect(c4.axis.events.some((item) => item.id === 'c4-release')).toBe(true)

    const c6 = computePhoenixDamage(agent, panel.stats, {
      cinema: 6,
      refinement: 1,
      coreLevel: 'F',
      engineId: 'ep-2259',
    }, standard)
    expect(c6.stats.resPen).toBe(0.15)
  })
})


