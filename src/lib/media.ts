import manifest from '@/data/media-manifest.json'
import type { MediaEntry } from '@/types/agent'

const mediaMap = manifest as Record<string, MediaEntry>

export function media(key?: string | null): string {
  return key ? (mediaMap[key]?.src ?? '') : ''
}

export function mediaEntry(key?: string | null): MediaEntry | undefined {
  return key ? mediaMap[key] : undefined
}

export function mediaColor(key?: string | null): string {
  return key ? (mediaMap[key]?.color ?? '#17171f') : '#17171f'
}
