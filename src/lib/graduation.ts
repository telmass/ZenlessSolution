import type { Agent, GuideGraduation } from '@/types/agent'
import { computePanel } from '@/core/panel/compute'
import { inputFromSpec, specFromGraduation } from '@/core/panel/presets'

export interface GraduationTotal {
  label: string
  value: number
  unit: string
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Graduation totals are computed from the guide's panel spec at render time —
 * never hand-filled. The stored `totals` in the TOML are kept only as an audit
 * trail of the legacy calculator output.
 */
export function graduationTotals(agent: Agent, graduation: GuideGraduation): GraduationTotal[] {
  if (!graduation.panel) return graduation.totals
  const { stats } = computePanel(inputFromSpec(agent, specFromGraduation(agent, graduation)))
  return [
    { label: '攻击力', value: round(stats.atk, 1), unit: '' },
    { label: '异常精通', value: Math.round(stats.anomalyProficiency), unit: '' },
    { label: '异常掌控', value: round(stats.anomalyMastery, 1), unit: '' },
  ]
}
