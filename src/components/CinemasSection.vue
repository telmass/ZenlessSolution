<script setup lang="ts">
import type { Agent } from '@/types/agent'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'

defineProps<{ agent: Agent }>()
</script>

<template>
  <div class="cinema-timeline">
    <ol class="cinema-list">
      <li
        v-for="cinema in agent.cinemas"
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
</template>

<style scoped>
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

.cinema:first-child {
  border-top: 1px solid var(--line);
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
