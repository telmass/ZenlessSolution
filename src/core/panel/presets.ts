import type { Agent, BuildPanelSpec, GuideGraduation } from '@/types/agent'
import type { PanelInput } from './types'

export interface BuildSpec {
  id: string
  label: string
  budget: number
  coreLevel: PanelInput['coreLevel']
  engineId: string | null
  set4: string | null
  set2: string | null
  mainStats: { 4: string; 5: string; 6: string }
  substats: Record<string, number>
}

const CORE_LEVELS: PanelInput['coreLevel'][] = ['none', 'A', 'B', 'C', 'D', 'E', 'F']

export function coreBonusFor(
  agent: Agent,
  level: PanelInput['coreLevel'],
): Record<string, number> {
  const index = CORE_LEVELS.indexOf(level)
  if (index <= 0) return {}
  return agent.corePassive.coreBonus[index - 1] ?? {}
}

export function inputFromSpec(agent: Agent, spec: BuildSpec): PanelInput {
  return {
    base: { ...agent.base },
    coreLevel: spec.coreLevel,
    coreBonus: coreBonusFor(agent, spec.coreLevel),
    engineId: spec.engineId,
    mainStats: { ...spec.mainStats },
    set4: spec.set4,
    set2: spec.set2,
    substats: { ...spec.substats },
  }
}

function fromPanel(
  panel: BuildPanelSpec,
  id: string,
  label: string,
): BuildSpec {
  return {
    id,
    label,
    budget: panel.budget,
    coreLevel: panel.coreLevel,
    engineId: panel.engineId,
    set4: panel.set4,
    set2: panel.set2,
    mainStats: {
      4: panel.mainStats['4'],
      5: panel.mainStats['5'],
      6: panel.mainStats['6'],
    },
    substats: { ...panel.substats },
  }
}

/** Turn a guide's graduation card into a runnable panel preset. */
export function specFromGraduation(agent: Agent, graduation: GuideGraduation): BuildSpec {
  if (!graduation.panel) {
    throw new Error(`${agent.slug}: graduation ${graduation.title} has no panel spec`)
  }
  const label = graduation.panel.budget === 54 ? '满配 · 54 词条' : `${graduation.panel.budget} 词条参考`
  return fromPanel(graduation.panel, `graduation-${graduation.panel.budget}`, label)
}

/** Presets offered by the build calculator: full graduation, alt, then bare build. */
export function presetsFor(agent: Agent): BuildSpec[] {
  const list: BuildSpec[] = []
  const graduation = agent.guide.graduation
  const alt = agent.guide.graduationAlt
  if (graduation) list.push(specFromGraduation(agent, graduation))
  if (alt?.panel) list.push(specFromGraduation(agent, alt))
  const base = list[0]
  if (base) {
    list.push({
      ...base,
      id: 'bare',
      label: '无副词条',
      substats: {},
    })
  }
  return list
}
