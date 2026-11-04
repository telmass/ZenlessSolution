import { onBeforeUnmount, onMounted, ref } from 'vue'

interface SectionSpyOptions {
  ids: string[]
  offset?: number
}

/**
 * Keeps the active chapter in sync with the viewport using an
 * IntersectionObserver band just below the sticky header + chapter nav.
 * Programmatic scrolling can hold the lock so the indicator does not
 * flicker while a smooth scroll is in flight.
 */
export function useSectionSpy({ ids, offset = 132 }: SectionSpyOptions) {
  const active = ref(ids[0] ?? '')
  let observer: IntersectionObserver | null = null
  let lockedUntil = 0

  function setActive(id: string) {
    if (ids.includes(id)) active.value = id
  }

  function hold(ms = 700) {
    lockedUntil = performance.now() + ms
  }

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < lockedUntil) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      {
        rootMargin: `-${offset}px 0px -52% 0px`,
        threshold: 0,
      },
    )

    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { active, setActive, hold }
}
