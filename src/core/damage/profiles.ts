import type { Agent } from '@/types/agent'

export interface DamageConfigSpec {
  id: string
  label: string
  cinema: number
  engineId: string
  refinement: number
  /** Which graduation spec (54 or 30 rolls) the config runs on. */
  budget: number
  note: string
  /** 局内 effect 文案，音擎对比表用。 */
  engineEffect: string
  kind: 'cinema' | 'engine' | 'budget'
}

export interface DamageHighlight {
  eventId: string
  label: string
  mode: 'perHit' | 'total'
}

export interface DamageProfile {
  singleTitle: string
  axisLabel: string
  singleMetricLabel: string
  axisTotalLabel: string
  critNote: string
  /** Whether the single-hit card exposes 期望/必暴/不暴. */
  critModes: boolean
  /** Footnote for the engine comparison table. */
  engineNote: string
  highlight: DamageHighlight
  attribution: { from: string; to: string; label: string }[]
  configs: DamageConfigSpec[]
}

function config(
  id: string,
  label: string,
  cinema: number,
  engineId: string,
  refinement: number,
  budget: number,
  note: string,
  engineEffect: string,
  kind: DamageConfigSpec['kind'],
): DamageConfigSpec {
  return { id, label, cinema, engineId, refinement, budget, note, engineEffect, kind }
}

const PHOENIX: DamageProfile = {
  singleTitle: '单次焚罪异放 · 失衡 1.5×',
  axisLabel: '20s 参考轴',
  singleMetricLabel: '单次异放',
  axisTotalLabel: '轴总伤',
  critNote: '灼蚀与异放暴击按期望计',
  critModes: true,
  engineNote: '100% 覆盖上限；朔月裁霜的冰伤/异放增伤对火属性不触发，壳中之灵的以太增伤同样不触发。',
  highlight: { eventId: 'sear-tick', label: '灼蚀 tick', mode: 'total' },
  attribution: [
    { from: '0+1', to: '1+1', label: 'C1' },
    { from: '1+1', to: '2+1', label: 'C2' },
    { from: '2+1', to: '4+1', label: 'C4' },
    { from: '4+1', to: '6+1', label: 'C6' },
  ],
  configs: [
    config('0+1', '0+1', 0, 'ep-2259', 1, 54, '0 影画 + 专武精 1', '+90 精通 / +40% 火伤', 'cinema'),
    config('1+1', '1+1', 1, 'ep-2259', 1, 54, '关键影画 C1', '+90 精通 / +40% 火伤', 'cinema'),
    config('2+1', '2+1', 2, 'ep-2259', 1, 54, '主流毕业 C2', '+90 精通 / +40% 火伤', 'cinema'),
    config('4+1', '4+1', 4, 'ep-2259', 1, 54, 'C4 额外异放', '+90 精通 / +40% 火伤', 'cinema'),
    config('6+1', '6+1', 6, 'ep-2259', 1, 54, '上限 C6', '+90 精通 / +40% 火伤', 'cinema'),
    config('0+0', '0+0', 0, 'ep-1883', 1, 54, '壳中之灵，无专武', '+90 精通', 'engine'),
    config('0+1 朔月', '0+1 朔月', 0, 'ep-1964', 1, 54, '朔月裁霜，限定下位', '无生效效果', 'engine'),
    config('A5', 'A5', 0, 'ep-212', 5, 54, '双生泣星精 5', '+192 精通（4 层）', 'engine'),
    config('0+1 嵌合', '0+1 嵌合', 0, 'ep-214', 3, 54, '嵌合编译器精 3', '+111 精通（3 层）/ +18% 攻击', 'engine'),
    config('0+1 平民', '0+1 平民', 0, 'ep-2259', 1, 30, '30 词条', '+90 精通 / +40% 火伤', 'budget'),
  ],
}

const VIVIAN: DamageProfile = {
  singleTitle: '单次异放 · 失衡 1.5×',
  axisLabel: '20s 参考轴',
  singleMetricLabel: '单次异放',
  axisTotalLabel: '轴总伤',
  critNote: '异放不吃暴击',
  critModes: false,
  engineNote: '专武的 +40% 积蓄效率未折算成额外异常次数，专武收益被低估；双生泣星需维持 4 层、触电唇彩需目标处于异常。',
  highlight: { eventId: 'corruption', label: '侵蚀 tick', mode: 'perHit' },
  attribution: [
    { from: '0+1', to: '1+1', label: 'C1' },
    { from: '1+1', to: '2+1', label: 'C2' },
    { from: '2+1', to: '4+1', label: 'C4' },
    { from: '4+1', to: '6+1', label: 'C6' },
  ],
  configs: [
    config('0+1', '0+1', 0, 'ep-1277', 1, 54, '0 影画 + 专武精 1', '+120 精通（6 层）/ 积蓄 +40%', 'cinema'),
    config('1+1', '1+1', 1, 'ep-1277', 1, 54, 'C1 异常与紊乱增伤', '+120 精通（6 层）/ 积蓄 +40%', 'cinema'),
    config('2+1', '2+1', 2, 'ep-1277', 1, 54, 'C2 异放收益与抗性无视', '+120 精通（6 层）/ 积蓄 +40%', 'cinema'),
    config('4+1', '4+1', 4, 'ep-1277', 1, 54, 'C4 必暴与攻击加成', '+120 精通（6 层）/ 积蓄 +40%', 'cinema'),
    config('6+1', '6+1', 6, 'ep-1277', 1, 54, 'C6 以太增伤与特殊异放', '+120 精通（6 层）/ 积蓄 +40%', 'cinema'),
    config('0+1 嵌合', '0+1 嵌合', 0, 'ep-214', 1, 54, '嵌合编译器精 1', '+75 精通（3 层）/ +12% 攻击 / 穿透 24%', 'engine'),
    config('0+1 壳中', '0+1 壳中', 0, 'ep-1883', 1, 54, '壳中之灵精 1', '+90 精通 / 以太目标增伤 20% / 异常·紊乱 +10%', 'engine'),
    config('0+0 双生', '0+0 双生', 0, 'ep-212', 5, 54, '双生泣星精 5', '+192 精通（4 层）', 'engine'),
    config('0+0 唇彩', '0+0 唇彩', 0, 'ep-210', 5, 54, '触电唇彩精 5', '+75 精通 / +16% 攻击 / 对异常目标 +25% 增伤', 'engine'),
    config('0+1 平民', '0+1 平民', 0, 'ep-1277', 1, 30, '30 词条', '+120 精通（6 层）/ 积蓄 +40%', 'budget'),
  ],
}

const ALICE: DamageProfile = {
  singleTitle: '单次极性强击 · 失衡 1.5×',
  axisLabel: '默认机制口径（单轮）',
  singleMetricLabel: '极性强击',
  axisTotalLabel: '默认总伤',
  critNote: '异常伤害不吃暴击',
  critModes: false,
  engineNote: '对齐 zzz_calculator 的 Alice 默认机制：1 次极性强击 + 10 次核心追击 + 1 次满持续物理紊乱；C6 追加 6 次决胜追击。',
  highlight: { eventId: 'assault', label: '极性强击', mode: 'total' },
  attribution: [
    { from: '0+1', to: '1+1', label: 'C1' },
    { from: '1+1', to: '2+1', label: 'C2' },
    { from: '2+1', to: '4+1', label: 'C4' },
    { from: '4+1', to: '6+1', label: 'C6' },
  ],
  configs: [
    config('0+1', '0+1', 0, 'ep-1503', 1, 54, '0 影画 + 专武精 1', '异常掌控 +60 / 强击物伤 +20%', 'cinema'),
    config('1+1', '1+1', 1, 'ep-1503', 1, 54, 'C1 减防 20%', '异常掌控 +60 / 强击物伤 +20%', 'cinema'),
    config('2+1', '2+1', 2, 'ep-1503', 1, 54, 'C2 强击与紊乱 +15%', '异常掌控 +60 / 强击物伤 +20%', 'cinema'),
    config('4+1', '4+1', 4, 'ep-1503', 1, 54, 'C4 物理抗性无视 10%', '异常掌控 +60 / 强击物伤 +20%', 'cinema'),
    config('6+1', '6+1', 6, 'ep-1503', 1, 54, 'C6 决胜追击 6 次', '异常掌控 +60 / 强击物伤 +20%', 'cinema'),
    config('0+1 平民', '0+1 平民', 0, 'ep-1503', 1, 28, '28 有效词条', '异常掌控 +60 / 强击物伤 +20%', 'budget'),
  ],
}

const ARIA: DamageProfile = {
  singleTitle: '单次侵蚀异放 · 失衡 1.5×',
  axisLabel: '默认机制口径（单轮）',
  singleMetricLabel: '侵蚀异放',
  axisTotalLabel: '默认总伤',
  critNote: '异放暴击按期望计（C1 25% + 掌控转化）',
  critModes: false,
  engineNote: '对齐 zzz_calculator 的 Aria 默认设置：1 次失衡期侵蚀异放；异放比例用局外异常掌控 × 核心以太系数 × 1.5。',
  highlight: { eventId: 'release', label: '侵蚀异放', mode: 'total' },
  attribution: [
    { from: '0+1', to: '1+1', label: 'C1' },
    { from: '1+1', to: '2+1', label: 'C2' },
    { from: '2+1', to: '6+1', label: 'C6' },
  ],
  configs: [
    config('0+1', '0+1', 0, 'ep-1883', 1, 54, '0 影画 + 专武精 1', '异常精通 +90 / 异常目标增伤 20%', 'cinema'),
    config('1+1', '1+1', 1, 'ep-1883', 1, 54, 'C1 异放暴击', '异常精通 +90 / 异常目标增伤 20%', 'cinema'),
    config('2+1', '2+1', 2, 'ep-1883', 1, 54, 'C2 减防 24%', '异常精通 +90 / 异常目标增伤 20%', 'cinema'),
    config('4+1', '4+1', 4, 'ep-1883', 1, 54, 'C4 能量/喧响，不影响单次异放', '异常精通 +90 / 异常目标增伤 20%', 'cinema'),
    config('6+1', '6+1', 6, 'ep-1883', 1, 54, 'C6 以太伤害 +40%', '异常精通 +90 / 异常目标增伤 20%', 'cinema'),
    config('0+1 平民', '0+1 平民', 0, 'ep-1883', 1, 30, '30 词条', '异常精通 +90 / 异常目标增伤 20%', 'budget'),
  ],
}

export function damageProfileFor(agent: Agent): DamageProfile {
  if (agent.damageModel === 'aria') return ARIA
  if (agent.damageModel === 'alice') return ALICE
  if (agent.damageModel === 'vivian') return VIVIAN
  if (agent.damageModel === 'phoenix') return PHOENIX
  throw new Error(`${agent.slug}: no damage model`)
}
