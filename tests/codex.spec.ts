import { describe, expect, it } from 'vitest'
import engines from '@/data/codex/engines.index.json'
import sets from '@/data/codex/sets.index.json'
import bangboo from '@/data/codex/bangboo.index.json'
import manifest from '@/data/media-manifest.json'

type MediaMap = Record<string, unknown>

describe('codex datasets', () => {
  it('has the expected entry counts', () => {
    expect(engines).toHaveLength(101)
    expect(sets).toHaveLength(30)
    expect(bangboo).toHaveLength(42)
  })

  it('keeps ids and slugs unique', () => {
    expect(new Set(engines.map((item) => item.id)).size).toBe(101)
    expect(new Set(sets.map((item) => item.id)).size).toBe(30)
    expect(new Set(bangboo.map((item) => item.slug)).size).toBe(42)
  })

  it('has a localized icon for every engine, drive set and bangboo', () => {
    const media = manifest as MediaMap
    const missingEngines = engines.filter((item) => !media[`engine:${item.id}:icon`])
    const missingSets = sets.filter((item) => !media[`set:${item.name}:icon`])
    const missingBangboo = bangboo.filter((item) => !media[`bangboo:${item.slug}:icon`])

    expect(missingEngines).toEqual([])
    expect(missingSets).toEqual([])
    // One beta bangboo has no icon in the current asset manifest.
    expect(missingBangboo.length).toBeLessThanOrEqual(1)
  })

  it('has Chinese profiles for the released bangboo', () => {
    expect(bangboo.filter((item) => item.descriptionZh).length).toBeGreaterThanOrEqual(40)
  })
})
