import raw from '@/data/enemies.json'
import type { EnemyPreset } from './types'

export const enemies = raw as unknown as EnemyPreset[]

export function enemyById(id: string): EnemyPreset {
  const found = enemies.find((item) => item.id === id)
  if (!found) throw new Error(`unknown enemy preset: ${id}`)
  return found
}

export * from './types'
export * from './zones'
export * from './snapshot'
export * from './skills'
export * from './axis'
export * from './events'
export * from './vivian'
export * from './models'
export * from './profiles'
