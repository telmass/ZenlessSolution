import raw from '@/data/panel.json'
import type { PanelEngine, PanelRules, PanelSet, StatId } from './types'

export const panelRules = raw as unknown as PanelRules

export const STAT_LABELS: Record<StatId, string> = {
  hp: '生命值',
  atk: '攻击力',
  def: '防御力',
  impact: '冲击力',
  critRate: '暴击率',
  critDmg: '暴击伤害',
  dmgBonus: '属性伤害加成',
  penRatio: '穿透率',
  penValue: '穿透值',
  anomalyProficiency: '异常精通',
  anomalyMastery: '异常掌控',
  energyRegen: '能量自动回复',
}

export const STAT_UNITS: Record<StatId, string> = {
  hp: '',
  atk: '',
  def: '',
  impact: '',
  critRate: '%',
  critDmg: '%',
  dmgBonus: '%',
  penRatio: '%',
  penValue: '',
  anomalyProficiency: '',
  anomalyMastery: '',
  energyRegen: '%',
}

export const STAT_ORDER: StatId[] = [
  'hp',
  'atk',
  'def',
  'impact',
  'critRate',
  'critDmg',
  'anomalyProficiency',
  'anomalyMastery',
  'penRatio',
  'penValue',
  'dmgBonus',
  'energyRegen',
]

export const engines: PanelEngine[] = [...panelRules.engines].sort((a, b) => {
  const order = ['ep-2259', 'ep-1883', 'ep-1964', 'ep-212']
  return order.indexOf(a.id) - order.indexOf(b.id)
})
export const sets: PanelSet[] = panelRules.sets
export const substats = panelRules.substats
export const mainStats = panelRules.mainStats

export function mainStatsFor(slot: 4 | 5 | 6) {
  return mainStats.filter((item) => item.slot === slot)
}
