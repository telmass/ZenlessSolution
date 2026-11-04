<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { AgentSection } from '@/constants/sections'

const props = defineProps<{
  sections: AgentSection[]
  active: string
  progress: number
}>()

defineEmits<{ navigate: [id: string] }>()

const links = ref<HTMLElement | null>(null)

watch(
  () => props.active,
  async () => {
    await nextTick()
    const container = links.value
    if (!container || container.scrollWidth <= container.clientWidth) return
    const item = container.querySelector<HTMLElement>(`[data-id="${props.active}"]`)
    if (!item) return
    container.scrollTo({
      left: Math.max(0, item.offsetLeft - 24),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  },
)
</script>

<template>
  <nav class="section-nav" aria-label="章节">
    <div class="section-nav__inner container">
      <div ref="links" class="section-nav__links">
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
          :data-id="section.id"
          class="section-nav__item"
          :class="{ 'is-active': active === section.id }"
          :aria-current="active === section.id ? 'location' : undefined"
          @click.prevent="$emit('navigate', section.id)"
        >
          <span class="section-nav__index num">{{ section.index }}</span>
          <span class="section-nav__label">{{ section.label }}</span>
        </a>
      </div>

      <span class="section-nav__count num" aria-hidden="true">
        {{ sections.find((section) => section.id === active)?.index ?? '01' }}
        <i>/ {{ String(sections.length).padStart(2, '0') }}</i>
      </span>
    </div>

    <span
      class="section-nav__progress"
      :style="{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }"
      aria-hidden="true"
    ></span>
  </nav>
</template>

<style scoped>
.section-nav {
  position: sticky;
  top: var(--header-h);
  z-index: 40;
  height: var(--chapter-nav-h);
  background: rgba(7, 7, 9, 0.9);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.section-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: var(--s5);
}

.section-nav__links {
  display: flex;
  align-items: stretch;
  gap: var(--s6);
  height: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.section-nav__links::-webkit-scrollbar {
  display: none;
}

.section-nav__item {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 0;
  color: var(--muted);
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease-out);
}

.section-nav__item:hover {
  color: var(--text-2);
}

.section-nav__item.is-active {
  color: var(--text);
}

.section-nav__item.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--accent);
}

.section-nav__index {
  color: var(--accent);
  font-size: var(--fs-11);
  font-weight: 600;
  letter-spacing: 0.08em;
  opacity: 0.55;
}

.section-nav__item.is-active .section-nav__index {
  opacity: 1;
}

.section-nav__label {
  font-size: var(--fs-15);
  letter-spacing: 0.04em;
}

.section-nav__count {
  flex-shrink: 0;
  color: var(--text-2);
  font-size: var(--fs-13);
  letter-spacing: 0.08em;
}

.section-nav__count i {
  color: var(--muted);
  font-style: normal;
}

.section-nav__progress {
  position: absolute;
  left: 0;
  top: -1px;
  width: 100%;
  height: 2px;
  background: var(--accent);
  transform-origin: left center;
  opacity: 0.35;
}

@media (max-width: 900px) {
  .section-nav__links {
    gap: var(--s5);
  }

  .section-nav__count {
    display: none;
  }

  .section-nav__label {
    font-size: var(--fs-13);
  }
}
</style>
