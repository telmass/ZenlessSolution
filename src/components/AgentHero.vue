<script setup lang="ts">
import { computed } from 'vue'
import type { Agent } from '@/types/agent'
import { media, mediaColor } from '@/lib/media'
import { publicUrl } from '@/lib/url'
import GuideCardActions from '@/components/GuideCardActions.vue'

const props = defineProps<{ agent: Agent }>()

defineEmits<{ jump: [id: string] }>()

const elementIcon = computed(() => {
  const map: Record<string, string> = {
    火: 'fire',
    冰: 'ice',
    电: 'electric',
    物理: 'physical',
    以太: 'ether',
    风: 'wind',
    烈霜: 'frost',
    流明: 'lumiflux',
    玄墨: 'auric-ink',
    凛刃: 'honed-edge',
  }
  return publicUrl(`/assets/ui/elements/${map[props.agent.element] ?? 'physical'}.webp`)
})

const specialtyIcon = computed(() => {
  const map: Record<string, string> = {
    异常: 'anomaly',
    强攻: 'attack',
    击破: 'stun',
    支援: 'support',
    防护: 'defense',
    命破: 'rupture',
    锋御: 'armorer',
  }
  return publicUrl(`/assets/ui/traits/${map[props.agent.specialty] ?? 'anomaly'}.webp`)
})

const rankIcon = publicUrl(`/assets/ui/ranks/${props.agent.rarity.toLowerCase()}.webp`)
</script>

<template>
  <section class="hero">
    <div
      class="hero__bg"
      :style="{ backgroundImage: `url(${media(agent.assets.full)})` }"
      aria-hidden="true"
    ></div>
    <div class="hero__fade" aria-hidden="true"></div>

    <div class="hero__inner container">
      <nav class="crumbs" aria-label="面包屑">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <RouterLink to="/agents">代理人</RouterLink>
        <span>/</span>
        <b>{{ agent.name }}</b>
      </nav>

      <div class="hero__content">
        <div class="hero__avatar" :style="{ background: mediaColor(agent.assets.avatar) }">
          <img :src="media(agent.assets.avatar)" :alt="agent.name" />
        </div>

        <div class="hero__text">
          <p class="hero__faction">{{ agent.faction }} · {{ agent.rarity }} 级代理人</p>
          <h1>
            {{ agent.name }}
            <span>{{ agent.fullName.split('·')[1] ?? '' }}</span>
          </h1>

          <div class="hero__badges">
            <span class="badge badge--element">
              <img :src="elementIcon" alt="" aria-hidden="true" />
              {{ agent.element }}
            </span>
            <span class="badge">
              <img :src="specialtyIcon" alt="" aria-hidden="true" />
              {{ agent.specialty }}
            </span>
            <span class="badge badge--rank">
              <img :src="rankIcon" alt="" aria-hidden="true" />
              {{ agent.rarity }}
            </span>
          </div>

          <p class="hero__intro">{{ agent.intro }}</p>

          <ul class="hero__tags">
            <li v-for="tag in agent.tags" :key="tag" class="tag">{{ tag }}</li>
          </ul>

          <div class="hero__actions">
            <a href="#guide" class="hero__jump" @click.prevent="$emit('jump', 'guide')">
              查看攻略
              <span aria-hidden="true">↓</span>
            </a>
            <a
              href="#build"
              class="hero__jump hero__jump--muted"
              @click.prevent="$emit('jump', 'build')"
            >
              打开配装
              <span aria-hidden="true">↓</span>
            </a>
            <GuideCardActions :agent="agent" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  isolation: isolate;
  border-bottom: 1px solid var(--line);
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-size: cover;
  background-position: center 18%;
  transform: scale(1.04);
  filter: saturate(0.9);
}

.hero__fade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(8, 8, 11, 0.98) 0%, rgba(8, 8, 11, 0.9) 34%, rgba(8, 8, 11, 0.35) 68%, rgba(8, 8, 11, 0.6) 100%),
    linear-gradient(180deg, rgba(8, 8, 11, 0.5), rgba(8, 8, 11, 0.95) 92%);
}

.hero__inner {
  padding: var(--s5) 0 var(--s8);
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.04em;
}

.crumbs a {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
}

.crumbs a:hover {
  color: var(--accent);
}

.crumbs b {
  color: var(--text-2);
  font-weight: 500;
}

.hero__content {
  display: flex;
  gap: 26px;
  align-items: flex-start;
  margin-top: var(--s8);
}

.hero__avatar {
  flex-shrink: 0;
  width: 88px;
  height: 88px;
  overflow: hidden;
  border: 1px solid var(--line-control);
  border-radius: 50%;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}

.hero__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__faction {
  color: var(--fire);
  font-size: var(--fs-12);
  letter-spacing: 0.1em;
}

.hero__text h1 {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 14px;
  margin: 10px 0 14px;
  font-family: var(--font-display);
  font-size: clamp(var(--fs-36), 4.2vw, var(--fs-52));
  font-weight: 700;
  line-height: var(--lh-title);
  letter-spacing: 0.01em;
}

.hero__text h1 span {
  color: var(--text-2);
  font-size: var(--fs-18);
  font-weight: 400;
  letter-spacing: 0.24em;
}

.hero__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 3px 10px 3px 6px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  background: rgba(17, 17, 23, 0.7);
  color: var(--text-2);
  font-size: var(--fs-14);
  letter-spacing: 0.04em;
}

.badge img {
  width: 16px;
  height: 16px;
}

.badge--element {
  border-color: rgba(255, 106, 61, 0.5);
  color: var(--fire-ink);
}

.badge--rank {
  border-color: rgba(240, 223, 78, 0.5);
  color: var(--accent);
}

.hero__intro {
  max-width: var(--measure);
  margin-top: var(--s4);
  color: var(--text-2);
  font-size: var(--fs-16);
  line-height: 1.8;
  overflow-wrap: break-word;
}

.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--s3);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s5);
  margin-top: var(--s5);
}

.hero__jump {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 44px;
  padding-top: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(240, 223, 78, 0.4);
  color: var(--accent);
  font-size: var(--fs-14);
  letter-spacing: 0.04em;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}

.hero__jump span {
  color: var(--accent);
  font-family: var(--font-display);
}

.hero__jump:hover {
  border-color: var(--accent);
}

.hero__jump--muted {
  border-color: var(--line-control);
  color: var(--text-2);
}

.hero__jump--muted span {
  color: var(--muted);
}

.hero__jump--muted:hover {
  border-color: var(--text-2);
  color: var(--text);
}

@media (max-width: 900px) {
  .hero__content {
    margin-top: var(--s6);
  }

  .hero__avatar {
    width: 72px;
    height: 72px;
  }
}

@media (max-width: 620px) {
  .hero__content {
    flex-direction: column;
    gap: 16px;
  }

  .crumbs a {
    min-height: 44px;
  }

  .hero__text h1 {
    gap: 10px;
  }

  .hero__text h1 span {
    font-size: var(--fs-14);
    letter-spacing: 0.16em;
  }

  .hero__intro {
    font-size: var(--fs-14);
  }
}
</style>
