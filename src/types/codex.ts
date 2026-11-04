export interface CodexSubStat {
  label: string
  value: number
  kind: 'pct' | 'flat'
  to: string
}

export interface EngineIndexItem {
  id: string
  name: string
  rank: string
  trait: string
  baseAtk: number
  baseDef: number
  subStat: CodexSubStat | null
}

export interface EngineRefinement {
  level: number
  text: string
}

export interface EngineDetail extends EngineIndexItem {
  effect: { name: string; text: string; refinements: EngineRefinement[] }
  acquisition: string
  source: string
  iconUrl: string
}

export interface DriveSetIndexItem {
  id: string
  name: string
  effect2: string
  effect4: string
  effect2Id: string | null
}

export interface DriveSetDetail extends DriveSetIndexItem {
  source: string
  iconUrl: string
}

export interface BangbooIndexItem {
  id: string
  slug: string
  name: string
  en: string
  rank: string
  description: string
  descriptionZh: string
}

export interface BangbooSkill {
  tab: string
  title: string
  desc: string
  detail: string
  levels: number
}

export interface BangbooStats {
  hp: number
  atk: number
  def: number
  impact: number
  critRate: number
  critDmg: number
  penRatio: number
  anomalyMastery: number
}

export interface BangbooDetail extends BangbooIndexItem {
  codename: string
  iconUrl: string
  wikiId: number | null
  descriptionZh: string
  skills: BangbooSkill[]
  stats: BangbooStats
}
