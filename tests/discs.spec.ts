import { describe, expect, it } from 'vitest'
import {
  DISC_SLOTS,
  MAX_LINES_PER_DISC,
  MAX_ROLLS_PER_LINE,
  ROLLS_PER_DISC,
  discRolls,
  emptyDiscs,
  fromCounts,
  toCounts,
  totalRolls,
  validateDiscs,
  type Disc,
} from '@/core/panel/discs'
import { substats } from '@/core/panel/data'

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

describe('per-disc substat allocation', () => {
  it('starts with six empty discs', () => {
    const discs = emptyDiscs()
    expect(discs.map((disc) => disc.slot)).toEqual([...DISC_SLOTS])
    expect(totalRolls(discs)).toBe(0)
    expect(toCounts(discs)).toEqual({})
  })

  it('round-trips the 54-roll graduation spec', () => {
    const discs = fromCounts(PHOENIX_54)
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

  it('round-trips the 30-roll reference', () => {
    const discs = fromCounts(PHOENIX_30)
    expect(totalRolls(discs)).toBe(30)
    expect(toCounts(discs)).toEqual(PHOENIX_30)
    for (const disc of discs) expect(discRolls(disc)).toBeLessThanOrEqual(ROLLS_PER_DISC)
  })

  it('fails loudly when the aggregate cannot fit six discs', () => {
    expect(() => fromCounts({ anomaly_proficiency: 40 })).toThrow()
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
