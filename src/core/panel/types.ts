export type StatId =
  | 'hp'
  | 'atk'
  | 'def'
  | 'impact'
  | 'critRate'
  | 'critDmg'
  | 'dmgBonus'
  | 'penRatio'
  | 'penValue'
  | 'anomalyProficiency'
  | 'anomalyMastery'
  | 'energyRegen'

export type ModKind = 'pct' | 'flat'

export interface StatMod {
  stat: StatId
  value: number
  kind: ModKind
}

export interface PanelEngine {
  id: string
  name: string
  rank: string
  baseAtk: number
  baseDef: number
  subStat: (StatMod & { label: string }) | null
  icon: string | null
}

export interface PanelSet {
  id: string
  name: string
  effect2: (StatMod & { id: string; label: string }) | null
  effect2Text: string
  icon: string | null
}

export interface SubStatRule {
  id: string
  label: string
  stat: StatId
  value: number
  kind: ModKind
}

export interface MainStatRule {
  id: string
  slot: 4 | 5 | 6
  label: string
  stat: StatId
  value: number
  kind: ModKind
}

export interface PanelRules {
  discFixed: Record<'hp' | 'atk' | 'def', number>
  substats: SubStatRule[]
  mainStats: MainStatRule[]
  setEffects: { id: string; stat: StatId; value: number; kind: ModKind; label: string }[]
  engines: PanelEngine[]
  sets: PanelSet[]
}

export interface PanelInput {
  base: {
    hp: number
    atk: number
    def: number
    impact: number
    critRate: number
    critDmg: number
    anomalyProficiency: number
    anomalyMastery: number
    penRatio: number
    energyRegen: number
  }
  coreLevel: 'none' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  coreBonus: { ac: number; atkBase: number }
  engineId: string | null
  mainStats: { 4: string; 5: string; 6: string }
  set4: string | null
  set2: string | null
  substats: Record<string, number>
}

export interface ModSource {
  label: string
  text: string
}

export interface BreakdownRow {
  stat: StatId
  label: string
  value: number
  unit: string
  sources: ModSource[]
}

export interface PanelStats {
  hp: number
  atk: number
  def: number
  impact: number
  critRate: number
  critDmg: number
  dmgBonus: number
  penRatio: number
  penValue: number
  anomalyProficiency: number
  anomalyMastery: number
  energyRegen: number
}

export interface PanelResult {
  stats: PanelStats
  breakdown: BreakdownRow[]
  warnings: string[]
  totalSubstatRolls: number
}
