<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import phoenix from '@/data/agents/phoenix.json'
import index from '@/data/agents/index.json'
import type { Agent, AgentIndexItem } from '@/types/agent'
import { AGENT_SECTIONS, SECTION_IDS, resolveSection } from '@/constants/sections'
import { useSectionSpy } from '@/composables/useSectionSpy'
import AgentHero from '@/components/AgentHero.vue'
import SectionNav from '@/components/SectionNav.vue'
import ChapterHead from '@/components/ChapterHead.vue'
import OverviewSection from '@/components/OverviewSection.vue'
import SkillsSection from '@/components/SkillsSection.vue'
import CinemasSection from '@/components/CinemasSection.vue'
import GuideSection from '@/components/GuideSection.vue'
import PanelSection from '@/components/PanelSection.vue'
import DamageSection from '@/components/DamageSection.vue'

const route = useRoute()
const agent = phoenix as unknown as Agent

const { active, setActive, hold } = useSectionSpy({ ids: SECTION_IDS, offset: 132 })
const progress = ref(0)
const showTop = ref(false)
let ticking = false
let initialAlignCancelled = false
const alignTimers: number[] = []

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function anchorOffset(): number {
  const header = document.querySelector<HTMLElement>('.header')
  const nav = document.querySelector<HTMLElement>('.section-nav')
  return (header?.offsetHeight ?? 64) + (nav?.offsetHeight ?? 52) + 16
}

function scrollToSection(
  id: string,
  options: { animate?: boolean; activeId?: string; initial?: boolean } = {},
) {
  const element = document.getElementById(id)
  if (!element) return

  if (!options.initial) initialAlignCancelled = true

  const sectionId = options.activeId ?? (id.startsWith('cinema-') ? 'cinemas' : id)
  if (SECTION_IDS.includes(sectionId as (typeof SECTION_IDS)[number])) {
    setActive(sectionId)
    hold(1200)
  }

  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - anchorOffset())
  const instant = options.animate === false || reducedMotion()
  if (instant) {
    const root = document.documentElement
    const previous = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.scrollTo({ top, behavior: 'auto' })
    requestAnimationFrame(() => {
      root.style.scrollBehavior = previous
    })
  } else {
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const nextHash = `#${id}`
  if (window.location.hash !== nextHash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
  }
}

function onHashChange() {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  if (id) scrollToSection(id)
}

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    if (Math.abs(next - progress.value) > 0.002) progress.value = next
    showTop.value = window.scrollY > 640
    ticking = false
  })
}

function toTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
}

onMounted(async () => {
  window.addEventListener('hashchange', onHashChange)
  window.addEventListener('scroll', onScroll, { passive: true })

  const cancelAlign = () => {
    initialAlignCancelled = true
  }
  window.addEventListener('wheel', cancelAlign, { passive: true, once: true })
  window.addEventListener('touchstart', cancelAlign, { passive: true, once: true })
  window.addEventListener('keydown', cancelAlign, { once: true })

  await nextTick()

  const hash = decodeURIComponent(route.hash.replace(/^#/, ''))
  const tab = typeof route.query.tab === 'string' ? route.query.tab : ''
  let target: string | null = null

  if (hash && resolveSection(hash)) {
    target = hash
  } else if (tab && resolveSection(tab)) {
    target = resolveSection(tab)
    if (target) history.replaceState(null, '', `${window.location.pathname}#${target}`)
  }

  if (target) {
    // Fonts and the first paint can change section heights; re-align a few
    // times until the page settles, unless the user has already scrolled.
    const align = () => {
      if (!initialAlignCancelled && target) {
        scrollToSection(target, { animate: false, initial: true })
      }
    }
    align()
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => undefined)
    }
    align()
    requestAnimationFrame(align)
    for (const delay of [200, 600, 1200]) {
      alignTimers.push(window.setTimeout(align, delay))
    }
    window.addEventListener('load', align, { once: true })
  }

  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', onHashChange)
  window.removeEventListener('scroll', onScroll)
  for (const timer of alignTimers) window.clearTimeout(timer)
})

const notFound = computed(() => route.params.slug !== 'phoenix')
const requested = computed(() =>
  (index as unknown as AgentIndexItem[]).find((item) => item.slug === route.params.slug),
)
</script>

<template>
  <div v-if="!notFound" class="agent-page">
    <a class="skip-link" href="#content">跳到正文</a>

    <AgentHero :agent="agent" @jump="scrollToSection" />
    <SectionNav
      :sections="AGENT_SECTIONS"
      :active="active"
      :progress="progress"
      @navigate="scrollToSection"
    />

    <div id="content" class="container agent-body" tabindex="-1">
      <section id="overview" class="chapter chapter--overview" aria-labelledby="overview-title">
        <h2 id="overview-title" class="sr-only">概览</h2>
        <OverviewSection :agent="agent" />
      </section>

      <section id="skills" class="chapter" aria-labelledby="skills-title">
        <ChapterHead
          index="02"
          title="技能"
          title-id="skills-title"
          :lede="AGENT_SECTIONS[1].lede"
        />
        <SkillsSection :agent="agent" />
      </section>

      <section id="cinemas" class="chapter" aria-labelledby="cinemas-title">
        <ChapterHead
          index="03"
          title="影画"
          title-id="cinemas-title"
        />
        <CinemasSection :agent="agent" />
      </section>

      <section id="guide" class="chapter" aria-labelledby="guide-title">
        <ChapterHead
          index="04"
          title="攻略"
          title-id="guide-title"
          :lede="AGENT_SECTIONS[3].lede"
        />
        <GuideSection :agent="agent" />
      </section>

      <section id="build" class="chapter" aria-labelledby="build-title">
        <ChapterHead
          index="05"
          title="配装"
          title-id="build-title"
          :lede="AGENT_SECTIONS[4].lede"
        />
        <PanelSection :agent="agent" />
      </section>

      <section id="damage" class="chapter" aria-labelledby="damage-title">
        <ChapterHead
          index="06"
          title="伤害"
          title-id="damage-title"
          :lede="AGENT_SECTIONS[5].lede"
        />
        <DamageSection :agent="agent" />
      </section>
    </div>

    <Transition name="fade">
      <button
        v-if="showTop && active !== 'build'"
        class="to-top"
        aria-label="回到顶部"
        @click="toTop"
      >
        ↑
      </button>
    </Transition>
  </div>

  <div v-else class="container empty">
    <p class="eyebrow">Agent · Locked</p>
    <h1>{{ requested ? `「${requested.name}」未开放` : '该代理人尚未接入' }}</h1>
    <p v-if="requested">
      {{ requested.fullName }} 已在图鉴中登记，但完整档案尚未开放。
      当前先行开放的是菲欧妮。
    </p>
    <p v-else>当前先行开放的是菲欧妮，其余代理人会在数据补齐后陆续开放。</p>
    <div class="empty__actions">
      <RouterLink to="/agents" class="empty__link">返回代理人图鉴 →</RouterLink>
      <RouterLink v-if="requested" to="/agents/phoenix" class="empty__link">
        查看菲欧妮 →
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.agent-page {
  min-height: 60vh;
}

.skip-link {
  position: fixed;
  top: -80px;
  left: var(--gutter);
  z-index: 100;
  padding: 10px 16px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: var(--fs-14);
  font-weight: 600;
  transition: top var(--dur-fast) var(--ease-out);
}

.skip-link:focus {
  top: 12px;
}

.agent-body {
  padding-bottom: var(--s12);
}

.agent-body:focus {
  outline: none;
}

.chapter--overview {
  padding-top: var(--s9);
}

.to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 45;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line-control);
  background: rgba(16, 16, 21, 0.9);
  color: var(--text-2);
  font-family: var(--font-display);
  font-size: var(--fs-22);
  backdrop-filter: blur(8px);
  transition:
    color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.to-top:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dur) var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.empty {
  padding: 120px 0;
}

.empty h1 {
  margin: 14px 0 10px;
  font-family: var(--font-display);
  font-size: var(--fs-36);
  line-height: var(--lh-title);
}

.empty p {
  max-width: var(--measure);
  color: var(--muted);
  font-size: var(--fs-16);
  line-height: 1.7;
}

.empty__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: var(--s4);
  color: var(--accent);
  font-size: var(--fs-14);
}

.empty__link + .empty__link {
  color: var(--muted);
}

.empty__link + .empty__link:hover {
  color: var(--accent);
}

.empty__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

@media (max-width: 600px) {
  .to-top {
    right: 16px;
    bottom: 16px;
    width: 40px;
    height: 40px;
  }
}
</style>

