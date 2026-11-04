import type { PanelStats } from '@/core/panel/types'

export interface EnemyPreset {
  id: string
  label: string
  level: number
  defense: number
  resistance: number
  stunned: boolean
  note: string
}

export type DamageType = 'direct' | 'anomaly' | 'release' | 'disorder'
export type CritMode = 'expected' | 'crit' | 'none'

export interface CombatStats {
  atk: number
  dmgBonus: number
  penRatio: number
  penValue: number
  ap: number
  anomalyMastery: number
  critRate: number
  critDmg: number
  searCritRate: number
  searCritDmg: number
  releaseCritDmg: number
  resPen: number
}

export interface DamageZones {
  dmgBonus: number
  defZone: number
  resZone: number
  stunZone: number
  critZone: number
  apZone: number
  levelZone: number
  anomalyCritZone: number
  releaseCritZone: number
}

export interface DamageEventResult {
  id: string
  label: string
  type: DamageType
  count: number
  multiplier: number
  perHit: number
  total: number
  zones: DamageZones
}

export interface DamageResult {
  events: DamageEventResult[]
  total: number
  dps: number
  duration: number
  assumptions: string[]
}

export interface DamageOptions {
  stunned?: boolean
  critMode?: CritMode
  defIgnore?: number
}

export type DamagePanel = PanelStats
