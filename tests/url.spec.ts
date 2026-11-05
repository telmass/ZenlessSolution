import { describe, expect, it } from 'vitest'
import { joinBase, publicUrl } from '@/lib/url'
import { media } from '@/lib/media'

describe('public asset urls', () => {
  it('keeps the root base unchanged', () => {
    expect(joinBase('/', '/assets/media/a.webp')).toBe('/assets/media/a.webp')
    expect(joinBase('/', 'assets/media/a.webp')).toBe('/assets/media/a.webp')
  })

  it('prefixes project-page base for GitHub Pages', () => {
    expect(joinBase('/ZenlessSolution/', '/assets/media/a.webp')).toBe(
      '/ZenlessSolution/assets/media/a.webp',
    )
    expect(joinBase('/ZenlessSolution/', '/assets/ui/skills/basic.webp')).toBe(
      '/ZenlessSolution/assets/ui/skills/basic.webp',
    )
    expect(joinBase('/ZenlessSolution', '/assets/media/a.webp')).toBe(
      '/ZenlessSolution/assets/media/a.webp',
    )
  })

  it('never double-prefixes and leaves external urls alone', () => {
    expect(joinBase('/ZenlessSolution/', '/ZenlessSolution/assets/media/a.webp')).toBe(
      '/ZenlessSolution/assets/media/a.webp',
    )
    expect(joinBase('/ZenlessSolution/', 'https://cdn.example.com/a.webp')).toBe(
      'https://cdn.example.com/a.webp',
    )
    expect(joinBase('/ZenlessSolution/', '//cdn.example.com/a.webp')).toBe(
      '//cdn.example.com/a.webp',
    )
    expect(joinBase('/ZenlessSolution/', 'data:image/png;base64,AAAA')).toBe(
      'data:image/png;base64,AAAA',
    )
    expect(joinBase('/ZenlessSolution/', '')).toBe('')
    expect(joinBase('/ZenlessSolution/', undefined)).toBe('')
  })

  it('resolves media keys through the current base', () => {
    const url = media('agent:phoenix:avatar')
    expect(url.startsWith(import.meta.env.BASE_URL)).toBe(true)
    expect(publicUrl('/assets/x.webp').startsWith(import.meta.env.BASE_URL)).toBe(true)
  })
})
