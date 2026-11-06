import { describe, expect, it } from 'vitest'
import index from '@/data/agents/index.json'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation } from '@/core/panel/presets'
import { analyzeSubstats } from '@/core/substats'
import type { Agent, AgentIndexItem } from '@/types/agent'

const roster = index as unknown as AgentIndexItem[]
const modules = import.meta.glob<{ default: Agent }>('../src/data/agents/*.json', { eager: true })
const agents = Object.entries(modules)
  .filter(([path]) => !path.endsWith('/index.json'))
  .map(([, module]) => module.default)

describe('every shipped dossier', () => {
  it('ships exactly the open anomaly agents', () => {
    const open = roster.filter((item) => item.available)
    expect(agents).toHaveLength(open.length)
    expect(new Set(agents.map((agent) => agent.slug))).toEqual(
      new Set(open.map((item) => item.slug)),
    )
  })

  for (const agent of agents) {
    it(`${agent.slug}: graduation specs are runnable and on budget`, () => {
      const graduations = [agent.guide.graduation, agent.guide.graduationAlt].filter(
        (item): item is NonNullable<typeof item> => Boolean(item),
      )
      expect(graduations.length).toBeGreaterThan(0)
      for (const graduation of graduations) {
        expect(graduation.panel).toBeTruthy()
        const spec = specFromGraduation(agent, graduation)
        const result = computePanel(inputFromSpec(agent, spec))
        const unexpected = result.warnings.filter(
          (warning) => !warning.includes('2 件套效果不计入局外面板'),
        )
        expect(unexpected).toEqual([])
        expect(result.totalSubstatRolls).toBe(spec.budget)
        expect(result.stats.atk).toBeGreaterThan(0)
        expect(result.stats.anomalyProficiency).toBeGreaterThan(0)

        const analysis = analyzeSubstats(spec.substats, agent.substatProfile, {
          budget: spec.budget,
        })
        expect(analysis.total).toBe(spec.budget)
      }
    })

    it(`${agent.slug}: guide sections are complete`, () => {
      expect(agent.skills.map((skill) => skill.key)).toEqual([
        'basic',
        'dodge',
        'assist',
        'special',
        'chain',
        'core',
      ])
      expect(agent.cinemas.map((cinema) => cinema.level)).toEqual([1, 2, 3, 4, 5, 6])
      expect(agent.guide.weapons.length).toBeGreaterThan(0)
      expect(agent.guide.builds.length).toBeGreaterThan(0)
      expect(agent.guide.teams.length).toBeGreaterThan(0)
      expect(agent.guide.texts.some((text) => text.title === '影画要点')).toBe(true)
      expect(agent.guide.role).toBeTruthy()
      expect(agent.guide.oneLiner).toBeTruthy()
    })
  }

  it('reproduces the legacy phoenix graduation oracle', () => {
    const phoenix = agents.find((agent) => agent.slug === 'phoenix')!
    const spec = specFromGraduation(phoenix, phoenix.guide.graduation!)
    const result = computePanel(inputFromSpec(phoenix, spec))
    expect(result.stats.atk).toBeCloseTo(2519.05, 2)
    expect(result.stats.anomalyProficiency).toBe(510)
    expect(result.stats.anomalyMastery).toBeCloseTo(255.36, 2)
  })
})
