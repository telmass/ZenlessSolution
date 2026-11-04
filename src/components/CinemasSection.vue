<script setup lang="ts">
import type { Agent } from '@/types/agent'
import RichText from '@/components/RichText.vue'

defineProps<{ agent: Agent }>()
</script>

<template>
  <div class="cinemas">
    <header class="cinemas__intro">
      <p class="cinemas__note">
        {{ agent.guide.cinemaPriority.note || '影画 1–6，标注为关键节点的是收益最高的档位。' }}
      </p>
    </header>

    <div class="cinemas__grid">
      <article
        v-for="cinema in agent.cinemas"
        :id="`cinema-${cinema.level}`"
        :key="cinema.level"
        class="cinema card"
        :class="{ 'is-key': cinema.keyLevel }"
      >
        <div class="cinema__mark">
          <span class="cinema__level num">L{{ cinema.level }}</span>
          <small>CINEMA</small>
          <span v-if="cinema.keyLevel" class="cinema__key">关键影画</span>
        </div>

        <div class="cinema__body">
          <h3>{{ cinema.name }}</h3>
          <RichText :text="cinema.effect" class="cinema__effect" />
          <details v-if="cinema.story" class="cinema__story">
            <summary>影画故事</summary>
            <p>{{ cinema.story }}</p>
          </details>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.cinemas__intro {
  margin-bottom: 18px;
}

.cinemas__note {
  color: var(--muted);
  font-size: 13px;
}

.cinemas__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.cinema {
  overflow: hidden;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
}

.cinema.is-key {
  border-color: rgba(242, 225, 76, 0.35);
  box-shadow: 0 0 0 1px rgba(242, 225, 76, 0.08), var(--shadow);
}

.cinema__mark {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 16px;
  border-right: 1px solid var(--line);
  background:
    linear-gradient(160deg, rgba(255, 106, 61, 0.16), rgba(242, 225, 76, 0.03) 55%),
    var(--surface-3);
}

.cinema__mark::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    180deg,
    transparent 0 6px,
    rgba(0, 0, 0, 0.16) 6px 8px
  );
  opacity: 0.35;
  pointer-events: none;
}

.cinema__level {
  position: relative;
  z-index: 1;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
}

.cinema__mark small {
  position: relative;
  z-index: 1;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 9px;
  letter-spacing: 0.24em;
}

.cinema__key {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  padding: 3px 7px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.cinema__body {
  padding: 20px 22px;
}

.cinema__body h3 {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.03em;
}

.cinema__effect {
  margin-top: 8px;
}

.cinema__story {
  margin-top: 14px;
  border-top: 1px dashed var(--line);
  padding-top: 10px;
}

.cinema__story summary {
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  list-style: none;
}

.cinema__story summary::-webkit-details-marker {
  display: none;
}

.cinema__story summary::before {
  content: "＋";
  margin-right: 6px;
  color: var(--accent);
}

.cinema__story[open] summary::before {
  content: "－";
}

.cinema__story p {
  margin-top: 8px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.9;
  white-space: pre-line;
}

@media (max-width: 820px) {
  .cinemas__grid {
    grid-template-columns: 1fr;
  }

  .cinema {
    grid-template-columns: 1fr;
  }

  .cinema__mark {
    flex-direction: row;
    align-items: center;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    padding: 12px 16px;
  }

  .cinema__level {
    font-size: 26px;
  }
}
</style>
