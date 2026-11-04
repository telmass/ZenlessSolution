import type { Agent } from '@/types/agent'
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

export function coreBonusFor(agent: Agent, level: PanelInput['coreLevel']): { ac: number; atkBase: number } {
  const index = CORE_LEVELS.indexOf(level)
  if (index <= 0) return { ac: 0, atkBase: 0 }
  return agent.corePassive.coreBonus[index - 1] ?? { ac: 0, atkBase: 0 }
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

export const graduation54: BuildSpec = {
  id: 'graduation-54',
  label: '满配毕业 · 54 词条',
  budget: 54,
  coreLevel: 'F',
  engineId: 'ep-2259',
  set4: 'ep-191',
  set2: 'ep-1194',
  mainStats: { 4: 'anomaly_proficiency_92', 5: 'dmg_bonus_30', 6: 'anomaly_mastery_30' },
  substats: {
    anomaly_proficiency: 30,
    atk_pct: 11,
    atk_flat: 6,
    pen_value: 6,
    hp_pct: 1,
  },
}

export const graduation30: BuildSpec = {
  id: 'graduation-30',
  label: '小毕业 · 30 词条',
  budget: 30,
  coreLevel: 'F',
  engineId: 'ep-2259',
  set4: 'ep-191',
  set2: 'ep-1194',
  mainStats: { 4: 'anomaly_proficiency_92', 5: 'dmg_bonus_30', 6: 'anomaly_mastery_30' },
  substats: {
    anomaly_proficiency: 15,
    atk_pct: 14,
    atk_flat: 1,
  },
}

export const defaultSpec: BuildSpec = {
  id: 'default',
  label: '默认配装',
  budget: 0,
  coreLevel: 'F',
  engineId: 'ep-2259',
  set4: 'ep-191',
  set2: 'ep-1194',
  mainStats: { 4: 'anomaly_proficiency_92', 5: 'dmg_bonus_30', 6: 'anomaly_mastery_30' },
  substats: {},
}

export const presets = [graduation54, graduation30]
