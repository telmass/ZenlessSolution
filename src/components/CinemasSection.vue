<script setup lang="ts">
import { computed } from 'vue'
import type { Agent, AgentCinema } from '@/types/agent'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'

const props = defineProps<{ agent: Agent }>()

interface CinemaGroup {
  key: string
  showcase: string
  first: number
  last: number
  image: string
  items: AgentCinema[]
}

// L1-L3 share the official "意象影画 02" backdrop, L4-L6 share "03".
const groups = computed<CinemaGroup[]>(() => {
  const out: CinemaGroup[] = []
  for (const cinema of props.agent.cinemas) {
    const last = out[out.length - 1]
    if (last && last.image === cinema.image) {
      last.items.push(cinema)
      last.last = cinema.level
      continue
    }
    out.push({
      key: `${cinema.image || 'level'}-${cinema.level}`,
      showcase: (cinema.image.split(':').pop() || '').padStart(2, '0'),
      first: cinema.level,
      last: cinema.level,
      image: cinema.image,
      items: [cinema],
    })
  }
  return out
})
</script>

<template>
  <div class="cinema-timeline">
    <div v-for="group in groups" :key="group.key" class="cinema-group">
      <div
        v-if="media(group.image)"
        class="cinema-group__bg"
        :style="{ backgroundImage: `url('${media(group.image)}')` }"
        aria-hidden="true"
      />

      <div class="cinema-group__head">
        <span class="cinema-group__label">意象影画 {{ group.showcase }}</span>
        <span class="cinema-group__range">L{{ group.first }} – L{{ group.last }}</span>
      </div>

      <ol class="cinema-list">
        <li
          v-for="cinema in group.items"
          :id="`cinema-${cinema.level}`"
          :key="cinema.level"
          class="cinema"
          :class="{ 'is-key': cinema.keyLevel }"
        >
          <div class="cinema__marker">
            <span class="cinema__level num">L{{ cinema.level }}</span>
            <img
              v-if="media(agent.assets.film)"
              class="cinema__film"
              :src="media(agent.assets.film)"
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
          </div>

          <div class="cinema__body">
            <header class="cinema__head">
              <h3>{{ cinema.name }}</h3>
              <span v-if="cinema.keyLevel" class="cinema__key">关键</span>
            </header>
            <RichText :text="cinema.effect" class="cinema__effect" />
          </div>

          <aside v-if="cinema.story" class="cinema__story">
            <span class="cinema__story-label">影画故事</span>
            <p>{{ cinema.story }}</p>
          </aside>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.cinema-timeline {
  display: grid;
  gap: var(--s6);
}

.cinema-group {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

/* 整组共用官方意象影画：全幅低透明度铺底，向右淡出，正文保持可读。 */
.cinema-group__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-repeat: no-repeat;
  background-position: center 24%;
  background-size: cover;
  opacity: 0.14;
  filter: blur(5px) brightness(0.6) saturate(0.62);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 7%, #000 93%, transparent 100%);
  pointer-events: none;
}

.cinema-group__bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(7, 7, 9, 0.15) 0%,
    rgba(7, 7, 9, 0.5) 55%,
    rgba(7, 7, 9, 0.9) 100%
  );
}

.cinema-group__head {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: var(--s3);
  padding: var(--s4) 0 var(--s2);
}

.cinema-group:first-child .cinema-group__head {
  padding-top: 0;
}

.cinema-group__label {
  color: var(--text-2);
  font-family: var(--font-display);
  font-size: var(--fs-11);
  letter-spacing: 0.14em;
  text-shadow: 0 1px 8px rgba(7, 7, 9, 0.9);
}

.cinema-group__range {
  color: var(--line-strong);
  font-size: var(--fs-11);
  letter-spacing: 0.08em;
}

.cinema-list {
  position: relative;
  display: grid;
}

.cinema-list::before {
  content: "";
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 47px;
  width: 1px;
  background: var(--line);
}

.cinema {
  display: grid;
  grid-template-columns: 96px minmax(0, 1.05fr) minmax(0, 1fr);
  gap: var(--s5);
  padding: var(--s5) 0;
  border-bottom: 1px solid var(--line);
}

.cinema__marker {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cinema__level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 56px;
  background: var(--bg);
  color: var(--line-strong);
  font-size: var(--fs-28);
  font-weight: 700;
  line-height: 1;
}

.cinema.is-key .cinema__level {
  color: var(--accent);
}

.cinema__film {
  width: 30px;
  height: 30px;
  margin-top: 4px;
  object-fit: contain;
  opacity: 0.45;
  filter: saturate(0.8);
  transform: rotate(-8deg);
}

.cinema.is-key .cinema__film {
  opacity: 0.8;
}

.cinema__body {
  max-width: 92ch;
  padding-top: 2px;
}

.cinema__head {
  display: flex;
  align-items: baseline;
  gap: var(--s3);
}

.cinema__head h3 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.03em;
}

.cinema__key {
  padding: 1px 6px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: var(--fs-11);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.cinema__effect {
  margin-top: var(--s2);
}

.cinema__story {
  padding-left: var(--s5);
  border-left: 1px solid var(--line);
}

.cinema__story-label {
  color: var(--muted);
  font-size: var(--fs-11);
  letter-spacing: 0.12em;
}

.cinema__story p {
  margin-top: 6px;
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.9;
  white-space: pre-line;
}

@media (max-width: 1100px) {
  .cinema {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .cinema__story {
    grid-column: 2;
    padding-left: 0;
    border-left: 0;
    margin-top: var(--s3);
  }
}

@media (max-width: 720px) {
  .cinema-list::before {
    left: 27px;
  }

  .cinema {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: var(--s4);
  }

  .cinema__level {
    min-width: 44px;
    height: 44px;
    font-size: var(--fs-22);
  }

  .cinema__film {
    display: none;
  }

  .cinema__head h3 {
    font-size: var(--fs-18);
  }
}
</style>
