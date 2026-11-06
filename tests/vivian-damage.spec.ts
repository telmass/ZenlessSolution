import { describe, expect, it } from 'vitest'
import vivianData from '@/data/agents/vivian.json'
import type { Agent } from '@/types/agent'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation } from '@/core/panel/presets'
import {
  computeVivianDamage,
  enemyById,
  vivianReleaseCoef,
  vivianReleaseMultiplier,
  vivianReleaseScale,
  buildVivianStats,
  CORRUPTION_DISORDER,
  CORRUPTION_UNIT,
} from '@/core/damage'
import { graduationTotals } from '@/lib/graduation'
import { analyzeSubstats } from '@/core/substats'
import { damageProfileFor } from '@/core/damage/profiles'
import panelData from '@/data/panel.json'

const agent = vivianData as unknown as Agent
const standard = enemyById('standard')

const spec = specFromGraduation(agent, agent.guide.graduation!)
const panel = computePanel(inputFromSpec(agent, spec))

const build = {
  cinema: 0,
  refinement: 1,
  coreLevel: 'F' as const,
  engineId: 'ep-1277',
}

describe('vivian damage model', () => {
  it('keeps the official release coefficient curve (none → F)', () => {
    expect(vivianReleaseCoef('none')).toBeCloseTo(3.07, 2)
    expect(vivianReleaseCoef('F')).toBeCloseTo(6.15, 2)
  })

  it('reproduces the open-source release ratio oracle at 328 AP', () => {
    expect(vivianReleaseScale(328, 'F', 0)).toBeCloseTo(2.0172, 4)
    expect(vivianReleaseScale(328, 'F', 2)).toBeCloseTo(2.62236, 5)
    expect(vivianReleaseMultiplier(328, 'F', 0)).toBeCloseTo(0.625 * 2.0172, 6)
  })

  it('uses the corruption unit and disorder formula', () => {
    expect(CORRUPTION_UNIT).toBe(0.625)
    expect(CORRUPTION_DISORDER).toBeCloseTo(4.5 + 20 * 0.625, 6)
  })

  it('adds the signature six-stack AP in combat, not in the panel', () => {
    const stats = buildVivianStats(panel.stats, agent, build)
    expect(panel.stats.anomalyProficiency).toBe(600)
    expect(stats.ap).toBe(600 + 120)
    // 异放/侵蚀不吃暴击。
    expect(stats.searCritRate).toBe(0)
    expect(stats.releaseCritDmg).toBe(0)
  })

  it('produces a monotonic axis across cinemas', () => {
    const totals = [0, 1, 2, 4, 6].map(
      (cinema) =>
        computeVivianDamage(agent, panel.stats, { ...build, cinema }, standard).axis.total,
    )
    for (let index = 1; index < totals.length; index += 1) {
      expect(totals[index]).toBeGreaterThan(totals[index - 1])
    }
  })

  it('models the C2 release bonus and resistance ignore', () => {
    const c0 = buildVivianStats(panel.stats, agent, build)
    const c2 = buildVivianStats(panel.stats, agent, { ...build, cinema: 2 })
    expect(c2.releaseResPen).toBeCloseTo(0.15, 6)
    expect(c2.releaseDamageBonus).toBeCloseTo(c0.releaseDamageBonus!, 6)
    expect(vivianReleaseScale(c2.ap, 'F', 2)).toBeCloseTo(
      vivianReleaseScale(c0.ap, 'F', 0) * 1.3,
      6,
    )
  })

  it('matches the anomaly/disorder bonuses from the additional ability and C1', () => {
    const c0 = buildVivianStats(panel.stats, agent, build)
    const c1 = buildVivianStats(panel.stats, agent, { ...build, cinema: 1 })
    expect(c0.anomalyDamageBonus).toBeCloseTo(1.12, 6)
    expect(c1.anomalyDamageBonus).toBeCloseTo(1.28, 6)
    expect(c0.disorderDamageBonus).toBeCloseTo(1.12, 6)
  })

  it('exposes a runnable axis with the documented events', () => {
    const result = computeVivianDamage(agent, panel.stats, build, standard)
    const ids = result.axis.events.map((event) => event.id)
    expect(ids).toEqual([
      'special',
      'chain',
      'ultimate',
      'luoyu',
      'xuanluo',
      'prophecy',
      'release',
      'corruption',
      'disorder',
    ])
    expect(result.axis.duration).toBe(20)
    expect(result.axis.dps).toBeCloseTo(result.axis.total / 20, 6)
    expect(result.single.total).toBeGreaterThan(0)
    expect(result.axis.total).toBeGreaterThan(result.single.total)
    const corruption = result.axis.events.find((event) => event.id === 'corruption')!
    expect(corruption.count).toBe(20)
    expect(corruption.multiplier).toBeCloseTo(0.625, 6)
  })

  it('keeps every comparison config selectable in the panel', () => {
    const profile = damageProfileFor(agent)
    const panelEngines = new Set(
      (panelData as unknown as { engines: { id: string }[] }).engines.map((engine) => engine.id),
    )
    for (const config of profile.configs) {
      expect(panelEngines.has(config.engineId)).toBe(true)
      expect([54, 30]).toContain(config.budget)
    }
    const ids = new Set(profile.configs.map((config) => config.id))
    for (const step of profile.attribution) {
      expect(ids.has(step.from)).toBe(true)
      expect(ids.has(step.to)).toBe(true)
    }
  })

  it('matches the 41-effective / 12-small / 1-invalid allocation', () => {
    const analysis = analyzeSubstats(spec.substats, agent.substatProfile, { budget: 54 })
    expect(analysis.effective).toBe(41)
    expect(analysis.small).toBe(11)
    expect(analysis.invalid).toBe(2)
  })

  it('marks C2 / C6 as key cinemas and lists all three mastery 2-piece sets', () => {
    expect(agent.guide.cinemaPriority.keyLevels).toEqual([2, 6])
    expect(agent.cinemas.filter((cinema) => cinema.keyLevel).map((cinema) => cinema.level)).toEqual([
      2, 6,
    ])
    const build = agent.guide.builds[0]
    const names = build.set2.map((item) => item.name)
    expect(names).toEqual(expect.arrayContaining(['自由蓝调', '混沌爵士']))
  })

  it('splits the core-passive element table into separate lines', () => {
    const core = agent.skills.find((skill) => skill.key === 'core')!
    const lines = core.moves[0].text.split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(8)
    expect(core.moves[0].text).not.toContain('6.15%/3.2%')
    expect(lines).toContain('以太 6.15%')
    expect(lines).toContain('火 8%')
  })

  it('computes graduation totals from the panel spec', () => {
    const totals = graduationTotals(agent, agent.guide.graduation!)
    expect(totals[0].value).toBeGreaterThan(2000)
    expect(totals[1].value).toBe(600)
  })
})
