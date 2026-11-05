import { describe, expect, it } from 'vitest'
import {
  DISC_SLOTS,
  MAX_LINES_PER_DISC,
  MAX_ROLLS_PER_LINE,
  ROLLS_PER_DISC,
  discRolls,
  emptyDiscs,
  fromCounts,
  maxRollsFor,
  toCounts,
  totalRolls,
  canUpgrade,
  validateDiscs,
  type Disc,
} from '@/core/panel/discs'
import { substats } from '@/core/panel/data'
import type { MainStatInfo } from '@/core/panel/discs'

const PHOENIX_54 = {
  anomaly_proficiency: 30,
  atk_pct: 11,
  atk_flat: 6,
  pen_value: 6,
  hp_pct: 1,
}

const PHOENIX_30 = {
  anomaly_proficiency: 15,
  atk_pct: 14,
  atk_flat: 1,
}

// 4 号位异常精通 / 5 号位属性伤害 / 6 号位异常掌控
const MAINS: MainStatInfo[] = [
  { slot: 4, stat: 'anomalyProficiency', kind: 'flat' },
  { slot: 5, stat: 'dmgBonus', kind: 'flat' },
  { slot: 6, stat: 'anomalyMastery', kind: 'pct' },
]

describe('per-disc substat allocation', () => {
  it('starts with six empty discs', () => {
    const discs = emptyDiscs()
    expect(discs.map((disc) => disc.slot)).toEqual([...DISC_SLOTS])
    expect(totalRolls(discs)).toBe(0)
    expect(toCounts(discs)).toEqual({})
  })

  it('round-trips the 54-roll graduation spec', () => {
    const discs = fromCounts(PHOENIX_54, substats, MAINS)
    expect(totalRolls(discs)).toBe(54)
    expect(toCounts(discs)).toEqual(PHOENIX_54)
    for (const disc of discs) {
      expect(discRolls(disc)).toBe(ROLLS_PER_DISC)
      expect(disc.lines.length).toBeLessThanOrEqual(MAX_LINES_PER_DISC)
      expect(new Set(disc.lines.map((line) => line.id)).size).toBe(disc.lines.length)
      for (const line of disc.lines) {
        expect(line.rolls).toBeGreaterThanOrEqual(1)
        expect(line.rolls).toBeLessThanOrEqual(MAX_ROLLS_PER_LINE)
      }
    }
  })

  it('rejects a 30-roll budget that cannot fill four substats per disc', () => {
    expect(() => fromCounts(PHOENIX_30, substats, MAINS)).toThrow(/选满 4 条/)
  })

  it('fails loudly when the aggregate cannot fit six discs', () => {
    expect(() => fromCounts({ anomaly_proficiency: 40 })).toThrow()
  })

  it('blocks a substat on the disc where it is the main stat', () => {
    const discs = fromCounts(PHOENIX_54, substats, MAINS)
    const slot4 = discs.find((disc) => disc.slot === 4)!
    expect(slot4.lines.some((line) => line.id === 'anomaly_proficiency')).toBe(false)
    for (const disc of discs) {
      if (disc.slot === 4) continue
      expect(disc.lines.some((line) => line.id === 'anomaly_proficiency')).toBe(true)
    }
  })

  it('caps the same substat at (6 - main occurrences) * 6', () => {
    expect(maxRollsFor('anomaly_proficiency', substats, MAINS)).toBe(30)
    expect(maxRollsFor('atk_pct', substats, MAINS)).toBe(36)
    const doubleAtkMain: MainStatInfo[] = [
      ...MAINS,
      { slot: 5, stat: 'atk', kind: 'pct' },
      { slot: 6, stat: 'atk', kind: 'pct' },
    ]
    expect(maxRollsFor('atk_pct', substats, doubleAtkMain)).toBe(24)
    expect(() => fromCounts({ anomaly_proficiency: 31 }, substats, MAINS)).toThrow()
  })

  it('only allows upgrades after all four substats are selected', () => {
    const partial: Disc[] = emptyDiscs()
    partial[0].lines.push({ id: 'anomaly_proficiency', rolls: 6 }, { id: 'atk_pct', rolls: 3 })
    expect(canUpgrade(partial[0])).toBe(false)
    expect(validateDiscs(partial, substats, MAINS).some((error) => error.includes('未选满'))).toBe(
      true,
    )
    partial[0].lines.push({ id: 'atk_flat', rolls: 1 }, { id: 'pen_value', rolls: 1 })
    expect(canUpgrade(partial[0])).toBe(true)
  })

  it('rejects a substat that duplicates the disc main stat', () => {
    const discs = emptyDiscs()
    discs[3].lines.push({ id: 'anomaly_proficiency', rolls: 6 })
    expect(validateDiscs(discs, substats, MAINS).some((error) => error.includes('与主词条重复'))).toBe(
      true,
    )
  })

  it('validates per-disc limits', () => {
    const over: Disc[] = emptyDiscs()
    over[0].lines.push({ id: 'atk_pct', rolls: 6 }, { id: 'atk_flat', rolls: 4 })
    expect(validateDiscs(over, substats).some((error) => error.includes('超过 9'))).toBe(true)

    const duplicate: Disc[] = emptyDiscs()
    duplicate[0].lines.push({ id: 'atk_pct', rolls: 3 }, { id: 'atk_pct', rolls: 3 })
    expect(validateDiscs(duplicate, substats).some((error) => error.includes('重复'))).toBe(true)

    const tooManyLines: Disc[] = emptyDiscs()
    tooManyLines[0].lines.push(
      { id: 'atk_pct', rolls: 1 },
      { id: 'atk_flat', rolls: 1 },
      { id: 'pen_value', rolls: 1 },
      { id: 'hp_pct', rolls: 1 },
      { id: 'def_pct', rolls: 1 },
    )
    expect(validateDiscs(tooManyLines, substats).some((error) => error.includes('超过 4'))).toBe(
      true,
    )
  })
})
