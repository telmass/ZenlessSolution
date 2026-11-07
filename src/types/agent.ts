export interface MediaEntry {
  src: string
  width: number
  height: number
  color: string
  source?: string
  variant?: string
}

export interface GrowthRow {
  label: string
  values: string[]
}

export interface GrowthGroup {
  name: string
  rows: GrowthRow[]
}

export interface GrowthTable {
  levels: string[]
  groups: GrowthGroup[]
}

export interface CoreRank {
  level: string
  lines: string[]
}

export interface CoreTable {
  levels: CoreRank[]
}

export interface AgentMove {
  title: string
  text: string
  table: GrowthTable | CoreTable | null
}

export interface AgentSkill {
  key: string
  name: string
  icon: string
  moves: AgentMove[]
}

export interface AgentCinema {
  level: number
  name: string
  effect: string
  story: string
  image: string
  keyLevel: boolean
}

export interface GuideWeapon {
  name: string
  stats: string
  engineId: string
  refinement: number
  icon: string
}

export interface GuideWeaponTier {
  tier: string
  note: string
  items: GuideWeapon[]
}

export interface GuidePriorityItem {
  key: string
  label: string
  level: number
  maxLevel: number
  next: string
}

export interface GuideMainStat {
  slot: string
  main: string
  alt: string
  note: string
}

export interface GuideSetRef {
  name: string
  label?: string
  icon: string
}

export interface GuideBuild {
  name: string
  subPriority: { label: string; next: string; id: string }[]
  mainStats: GuideMainStat[]
  set4: { name: string; label: string; effect4: string; scene: string; icon: string }
  set2: GuideSetRef[]
}

export interface GuideTeamMember {
  agentId: string
  name: string
  role: string
  note: string
  avatar: string
  set4: GuideSetRef[]
}

export interface GuideTeam {
  name: string
  members: GuideTeamMember[]
}

export interface GuideText {
  title: string
  lines: string[]
}

export interface GuideGraduation {
  title: string
  statRule: string
  totals: { label: string; value: number; unit: string }[]
  note: string
  computedAt: string
  build: Record<string, string | number>
  /** Ready-to-run panel spec: panel ids, no legacy aliases. */
  panel: BuildPanelSpec | null
  spec: {
    subStats?: { id: string; count: number }[]
    budget?: number
    [key: string]: unknown
  }
}

export interface BuildPanelSpec {
  engineId: string
  set4: string
  set2: string
  mainStats: Record<'4' | '5' | '6', string>
  substats: Record<string, number>
  budget: number
  coreLevel: 'none' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
}

export interface AgentGuide {
  role: string
  tags: string[]
  oneLiner: string
  cinemaPriority: { keyLevels: number[]; note: string }
  skillPriority: GuidePriorityItem[]
  weapons: GuideWeaponTier[]
  builds: GuideBuild[]
  teams: GuideTeam[]
  texts: GuideText[]
  graduation: GuideGraduation | null
  graduationAlt: GuideGraduation | null
  officialGuide: string
}

export interface AgentBase {
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

export interface Agent {
  id: string
  slug: string
  name: string
  fullName: string
  rarity: string
  element: string
  specialty: string
  faction: string
  tags: string[]
  intro: string
  profile: { birthday: string; height: string; cv: string }
  base: AgentBase
  corePassive: {
    name: string
    levels: string[]
    /** Cumulative per-rank stat bonus, A–F. */
    coreBonus: Record<string, number>[]
    /** Per-rank display rows for the overview (label + one value per rank). */
    effects: { label: string; values: string[] }[]
    /** Core-passive scaling rows (Phoenix/Alice); other agents leave these undefined. */
    amFlat?: number[]
    critDmg?: number[]
    tickAtkPct?: number[]
    /** Alice：物理异常积蓄效率（核心等级 1–7）。 */
    buildupEfficiencyPct?: number[]
  }
  /** Display-only substat whitelist; never enters panel/damage math. */
  substatProfile: { effective: string[]; small: string[] }
  /** Which damage model this agent owns. */
  damageModel: 'phoenix' | 'vivian' | 'alice' | 'aria' | null
  skills: AgentSkill[]
  cinemas: AgentCinema[]
  assets: { avatar: string; tachie: string; full: string; film?: string }
  /** Optional 2.5 potential activation block (e.g. Grace). */
  potential?: {
    name: string
    summary: string
    effects: string[]
    note?: string
  }
  guide: AgentGuide
  sources: { label: string; url: string }[]
  repairs?: string[]
  updatedAt: string
}

export interface AgentIndexItem {
  id: string
  slug: string
  en: string
  name: string
  fullName: string
  rarity: string
  element: string
  specialty: string
  faction: string
  /** Whether this agent has a completed dossier and clickable detail page. */
  available: boolean
  avatar: string
  full: string
  tags: string[]
}
