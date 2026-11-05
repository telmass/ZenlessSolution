// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { AGENT_SECTIONS, resolveSection } from '@/constants/sections'

const mockRoute = {
  params: { slug: 'phoenix' },
  hash: '',
  query: {} as Record<string, string>,
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' },
}))

import AgentPage from '@/pages/AgentPage.vue'

describe('agent page structure', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve() },
    })
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('renders every chapter at once and no page-level tablist', async () => {
    mockRoute.params.slug = 'phoenix'
    const wrapper = shallowMount(AgentPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    await vi.waitFor(() => expect(wrapper.find('section#overview').exists()).toBe(true))
    const ids = wrapper.findAll('section[id]').map((section) => section.attributes('id'))
    expect(ids).toEqual(AGENT_SECTIONS.map((section) => section.id))
    expect(wrapper.findAll('[role="tablist"]')).toHaveLength(0)
    expect(wrapper.find('.tabs').exists()).toBe(false)
  })

  it('drops the damage chapter for agents without a damage model', async () => {
    mockRoute.params.slug = 'vivian'
    const wrapper = shallowMount(AgentPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await flushPromises()

    await vi.waitFor(() => expect(wrapper.find('section#overview').exists()).toBe(true))
    const ids = wrapper.findAll('section[id]').map((section) => section.attributes('id'))
    expect(ids).toEqual(['overview', 'skills', 'cinemas', 'guide', 'build'])
  })
})

describe('section deep links', () => {
  it('maps chapter ids, legacy tabs and cinema sub-anchors', () => {
    expect(resolveSection('#skills')).toBe('skills')
    expect(resolveSection('cinema-4')).toBe('cinemas')
    expect(resolveSection('build')).toBe('build')
    expect(resolveSection('damage')).toBe('damage')
    expect(resolveSection('unknown')).toBeNull()
  })
})


