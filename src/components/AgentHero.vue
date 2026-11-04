<script setup lang="ts">
import { computed } from 'vue'
import type { Agent } from '@/types/agent'
import { media, mediaColor } from '@/lib/media'

const props = defineProps<{ agent: Agent }>()

const elementIcon = computed(() => {
  const map: Record<string, string> = {
    火: 'fire',
    冰: 'ice',
    电: 'electric',
    物理: 'physical',
    以太: 'ether',
    风: 'wind',
  }
  return `/assets/ui/elements/${map[props.agent.element] ?? 'physical'}.webp`
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
  return `/assets/ui/traits/${map[props.agent.specialty] ?? 'anomaly'}.webp`
})

const rankIcon = `/assets/ui/ranks/${props.agent.rarity.toLowerCase()}.webp`
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
        </div>
      </div>

      <dl class="hero__meta">
        <div>
          <dt>阵营</dt>
          <dd>{{ agent.faction }}</dd>
        </div>
        <div>
          <dt>生日</dt>
          <dd class="num">{{ agent.profile.birthday || '—' }}</dd>
        </div>
        <div>
          <dt>身高</dt>
          <dd class="num">{{ agent.profile.height || '—' }}<small>cm</small></dd>
        </div>
        <div>
          <dt>属性 / 职业</dt>
          <dd>{{ agent.element }} · {{ agent.specialty }}</dd>
        </div>
        <div>
          <dt>影画关键</dt>
          <dd class="num">1 / 6</dd>
        </div>
      </dl>
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
  padding: 28px 0 34px;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.06em;
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
  margin-top: 46px;
}

.hero__avatar {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
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
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.hero__text h1 {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin: 8px 0 14px;
  font-family: var(--font-display);
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;
}

.hero__text h1 span {
  color: var(--text-2);
  font-size: clamp(15px, 1.6vw, 20px);
  font-weight: 400;
  letter-spacing: 0.28em;
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
  padding: 3px 10px 3px 6px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  background: rgba(17, 17, 23, 0.7);
  color: var(--text-2);
  font-size: 12px;
  letter-spacing: 0.06em;
}

.badge img {
  width: 16px;
  height: 16px;
}

.badge--element {
  border-color: rgba(255, 106, 61, 0.5);
  color: #ffb59d;
}

.badge--rank {
  border-color: rgba(242, 225, 76, 0.5);
  color: var(--accent);
}

.hero__intro {
  max-width: 62ch;
  margin-top: 16px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.85;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.hero__meta {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
  margin: 38px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgba(58, 58, 72, 0.5);
}

.hero__meta dt {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.hero__meta dd {
  margin: 3px 0 0;
  color: var(--text-2);
  font-size: 13px;
}

.hero__meta dd small {
  margin-left: 2px;
  color: var(--muted);
  font-size: 10px;
}

@media (max-width: 900px) {
  .hero__meta {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero__content {
    margin-top: 30px;
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

  .hero__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
