export interface AgentSection {
  id: 'overview' | 'skills' | 'cinemas' | 'guide' | 'build' | 'damage'
  index: string
  label: string
  lede: string
}

export const AGENT_SECTIONS: AgentSection[] = [
  {
    id: 'overview',
    index: '01',
    label: '概览',
    lede: '档案、基础面板与核心机制。',
  },
  {
    id: 'skills',
    index: '02',
    label: '技能',
    lede: '六类招式，1–16 级倍率与核心技 A–F 数值全部展开。',
  },
  {
    id: 'cinemas',
    index: '03',
    label: '影画',
    lede: '从 L1 到 L6 按解锁顺序阅读；1 与 6 为关键节点。',
  },
  {
    id: 'guide',
    index: '04',
    label: '攻略',
    lede: '加点、音擎、驱动盘、毕业面板、队伍与实战笔记。',
  },
  {
    id: 'build',
    index: '05',
    label: '配装',
    lede: '局外面板计算：核心、音擎、4+2、主副词条。',
  },
  {
    id: 'damage',
    index: '06',
    label: '伤害',
    lede: '参考轴与单次伤害：0+1 / 2+1 / 4+1 / 6+1 相同条件对比。',
  },
]

export const SECTION_IDS = AGENT_SECTIONS.map((section) => section.id)

/** Legacy `?tab=` deep links map onto the new chapter anchors. */
export const LEGACY_TAB_MAP: Record<string, AgentSection['id']> = {
  overview: 'overview',
  skills: 'skills',
  cinemas: 'cinemas',
  guide: 'guide',
  build: 'build',
  damage: 'damage',
}

export function resolveSection(hashOrTab?: string | null): AgentSection['id'] | null {
  if (!hashOrTab) return null
  const value = hashOrTab.replace(/^#/, '')
  if (value.startsWith('cinema-')) return 'cinemas'
  if (SECTION_IDS.includes(value as AgentSection['id'])) return value as AgentSection['id']
  return LEGACY_TAB_MAP[value] ?? null
}

