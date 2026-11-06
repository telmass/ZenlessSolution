import { describe, expect, it } from 'vitest'
import aliceData from '@/data/agents/alice.json'
import type { Agent } from '@/types/agent'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation } from '@/core/panel/presets'
import { analyzeSubstats } from '@/core/substats'
import { graduationTotals } from '@/lib/graduation'

const agent = aliceData as unknown as Agent

describe('alice panel references', () => {
  it('keeps the full build near 3000 ATK and maxes anomaly proficiency', () => {
    const full = agent.guide.graduation!
    const totals = graduationTotals(agent, full)
    const byLabel = Object.fromEntries(totals.map((item) => [item.label, item.value]))
    expect(byLabel['攻击力']).toBeCloseTo(3007.6, 1)
    expect(byLabel['异常精通']).toBe(480)
    // 4 号位主词条是异常精通 → 副词条上限 30，满配必须吃满。
    expect(full.panel!.substats['anomaly_proficiency']).toBe(30)

    const panel = computePanel(inputFromSpec(agent, specFromGraduation(agent, full)))
    expect(panel.warnings.filter((line) => !line.includes('2 件套'))).toEqual([])
  })

  it('matches the 28-effective low reference (~320 AP)', () => {
    const alt = agent.guide.graduationAlt!
    const totals = graduationTotals(agent, alt)
    const byLabel = Object.fromEntries(totals.map((item) => [item.label, item.value]))
    expect(byLabel['攻击力']).toBeCloseTo(3151.5, 1)
    expect(byLabel['异常精通']).toBe(318)
    expect(alt.panel!.budget).toBe(28)
    const counts = alt.panel!.substats
    expect(counts['anomaly_proficiency'] + counts['atk_pct']).toBe(28)
  })

  it('counts 41 effective / 11 small / 2 invalid on the full build', () => {
    const spec = specFromGraduation(agent, agent.guide.graduation!)
    const analysis = analyzeSubstats(spec.substats, agent.substatProfile, { budget: 54 })
    expect(analysis.effective).toBe(41)
    expect(analysis.small).toBe(11)
    expect(analysis.invalid).toBe(2)
  })
})
