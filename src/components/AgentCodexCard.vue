<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { AgentIndexItem } from '@/types/agent'
import { media, mediaColor } from '@/lib/media'

const props = defineProps<{
  agent: AgentIndexItem
  index: number
}>()

const isOpen = computed(() => props.agent.available)
const tint = computed(() => (isOpen.value ? mediaColor(props.agent.avatar) : 'var(--surface-3)'))
const label = computed(() => `#${String(props.index + 1).padStart(2, '0')}`)
const initial = computed(() => props.agent.name.replace(/^[「『【\s]+/, '').slice(0, 1))
</script>

<template>
  <component
    :is="isOpen ? RouterLink : 'div'"
    :to="isOpen ? `/agents/${agent.slug}` : undefined"
    class="agent-card"
    :class="isOpen ? 'agent-card--open' : 'agent-card--locked'"
    :style="{ '--tint': tint }"
    :aria-disabled="isOpen ? undefined : 'true'"
    :title="isOpen ? undefined : `${agent.name} · 未开放`"
  >
    <div class="agent-card__media">
      <span class="agent-card__rank num">{{ agent.rarity }}</span>
      <span class="agent-card__index num" aria-hidden="true">{{ label }}</span>

      <template v-if="isOpen">
        <span class="agent-card__floor" aria-hidden="true" />
        <img
          :src="media(agent.full) || media(agent.avatar)"
          :alt="`${agent.fullName} 全身立绘`"
          loading="lazy"
        />
        <span class="agent-card__state">已开放</span>
      </template>

      <template v-else>
        <span class="agent-card__frame" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span class="agent-card__initial" aria-hidden="true">{{ initial }}</span>
        <span class="agent-card__locked">
          <b aria-hidden="true">+</b>
          <em>未开放</em>
        </span>
      </template>

      <span class="agent-card__element">{{ agent.element }}</span>
    </div>

    <div class="agent-card__body">
      <div class="agent-card__name">
        <h2>{{ agent.name }}</h2>
        <span>{{ agent.specialty }}</span>
      </div>
      <p class="agent-card__full">{{ agent.fullName }}</p>
      <p class="agent-card__faction">{{ agent.faction }}</p>
    </div>
  </component>
</template>

<style scoped>
.agent-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0;
  transition:
    transform var(--dur) var(--ease-out),
    border-color var(--dur) var(--ease-out);
}

.agent-card--open:hover {
  transform: translateY(-3px);
  border-color: var(--line-control);
}

.agent-card--open:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.agent-card--locked {
  border-color: var(--line);
  cursor: default;
}

.agent-card--locked:hover {
  border-color: var(--line-control);
}

.agent-card__media {
  position: relative;
  aspect-ratio: 5 / 6;
  overflow: hidden;
  background-color: var(--surface);
  background:
    radial-gradient(
      78% 52% at 50% 32%,
      color-mix(in srgb, var(--tint) 42%, transparent),
      transparent 72%
    ),
    linear-gradient(180deg, var(--surface-2), var(--surface));
}

.agent-card--locked .agent-card__media {
  background:
    repeating-linear-gradient(
      135deg,
      rgba(243, 241, 234, 0.014) 0 1px,
      transparent 1px 9px
    ),
    linear-gradient(180deg, var(--surface-2), var(--surface));
}

.agent-card__media::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, transparent 58%, rgba(7, 7, 9, 0.55) 100%),
    linear-gradient(90deg, rgba(7, 7, 9, 0.18), transparent 22%, transparent 78%, rgba(7, 7, 9, 0.18));
  pointer-events: none;
}

.agent-card--locked .agent-card__media::after {
  background: linear-gradient(180deg, transparent 72%, rgba(7, 7, 9, 0.5) 100%);
}

.agent-card__media img {
  position: absolute;
  inset: 5% 2% 0;
  z-index: 1;
  width: 96%;
  height: 96%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 18px 22px rgba(0, 0, 0, 0.5));
  transition: transform 420ms var(--ease-out);
}

.agent-card--open:hover .agent-card__media img {
  transform: translateY(-4px) scale(1.02);
}

.agent-card__rank {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: var(--fs-14);
  font-weight: 700;
  clip-path: polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%);
}

.agent-card--locked .agent-card__rank {
  background: var(--surface-3);
  color: var(--muted);
}

.agent-card__index {
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 0;
  color: rgba(243, 241, 234, 0.055);
  font-size: var(--fs-36);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

.agent-card--locked .agent-card__index {
  color: rgba(243, 241, 234, 0.035);
}

.agent-card__element {
  position: absolute;
  right: 10px;
  bottom: 9px;
  z-index: 2;
  color: var(--text-2);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.agent-card--locked .agent-card__element {
  color: var(--muted);
}

.agent-card__floor {
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 4%;
  z-index: 0;
  height: 20px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55), transparent 68%);
  filter: blur(5px);
}

.agent-card__state {
  position: absolute;
  left: 10px;
  bottom: 8px;
  z-index: 2;
  padding: 1px 6px;
  border: 1px solid rgba(240, 223, 78, 0.42);
  color: var(--accent);
  font-size: var(--fs-12);
  letter-spacing: 0.06em;
}

.agent-card__frame {
  position: absolute;
  inset: 18% 15%;
  z-index: 1;
  border: 1px dashed rgba(243, 241, 234, 0.14);
  transition: border-color var(--dur) var(--ease-out);
}

.agent-card--locked:hover .agent-card__frame {
  border-color: rgba(243, 241, 234, 0.26);
}

.agent-card__frame i {
  position: absolute;
  width: 13px;
  height: 13px;
  border: 0 solid rgba(243, 241, 234, 0.34);
}

.agent-card__frame i:nth-child(1) {
  top: -1px;
  left: -1px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.agent-card__frame i:nth-child(2) {
  top: -1px;
  right: -1px;
  border-top-width: 2px;
  border-right-width: 2px;
}

.agent-card__frame i:nth-child(3) {
  bottom: -1px;
  left: -1px;
  border-bottom-width: 2px;
  border-left-width: 2px;
}

.agent-card__frame i:nth-child(4) {
  right: -1px;
  bottom: -1px;
  border-right-width: 2px;
  border-bottom-width: 2px;
}

.agent-card__initial {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: grid;
  place-items: center;
  color: rgba(243, 241, 234, 0.065);
  font-family: var(--font-display);
  font-size: clamp(var(--fs-36), 6vw, var(--fs-72));
  font-weight: 700;
  line-height: 1;
  user-select: none;
}

.agent-card__locked {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 7px;
  padding: 12px 16px;
  border: 1px solid rgba(243, 241, 234, 0.12);
  background: rgba(7, 7, 9, 0.62);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(3px);
}

.agent-card__locked b {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--line-control);
  color: var(--muted);
  font-size: var(--fs-16);
  font-weight: 400;
  line-height: 1;
}

.agent-card__locked em {
  color: var(--muted);
  font-size: var(--fs-12);
  font-style: normal;
  letter-spacing: 0.12em;
  line-height: 1;
}

.agent-card__body {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--line);
}

.agent-card--locked .agent-card__body {
  border-top-color: var(--line);
}

.agent-card__name {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
}

.agent-card__name h2 {
  min-width: 0;
  overflow-wrap: break-word;
  font-family: var(--font-display);
  font-size: var(--fs-18);
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.agent-card--locked .agent-card__name h2 {
  color: var(--text-2);
}

.agent-card__name span {
  flex-shrink: 0;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.04em;
}

.agent-card__full {
  margin-top: 2px;
  overflow: hidden;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-card__faction {
  margin-top: 1px;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.02em;
  line-height: 1.5;
}

.agent-card--locked .agent-card__full,
.agent-card--locked .agent-card__faction {
  color: var(--muted);
}

@media (max-width: 640px) {
  .agent-card__body {
    padding: 8px 10px 10px;
  }

  .agent-card__element {
    right: 8px;
    bottom: 8px;
  }

  .agent-card__state {
    left: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .agent-card--open:hover {
    transform: none;
  }

  .agent-card--open:hover .agent-card__media img {
    transform: none;
  }
}
</style>
