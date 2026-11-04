<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Agent } from '@/types/agent'
import RichText from '@/components/RichText.vue'

const props = defineProps<{ agent: Agent }>()

const coreLevels = ['A', 'B', 'C', 'D', 'E', 'F'] as const
const level = ref<(typeof coreLevels)[number]>('F')
const levelIndex = computed(() => coreLevels.indexOf(level.value))

const coreSkill = computed(() => props.agent.skills.find((skill) => skill.key === 'core'))
const coreText = computed(() => coreSkill.value?.moves[0]?.text ?? '')
const passive = props.agent.corePassive
const bonus = computed(() => passive.coreBonus[levelIndex.value])
// Core ranks A-F map to passive levels 2-7; level 1 (43) is the no-core state.
const passiveIndex = computed(() => levelIndex.value + 1)

const stats = computed(() => [
  { label: '生命值', value: props.agent.base.hp, unit: '' },
  { label: '攻击力', value: props.agent.base.atk, unit: '' },
  { label: '防御力', value: props.agent.base.def, unit: '' },
  { label: '冲击力', value: props.agent.base.impact, unit: '' },
  { label: '暴击率', value: props.agent.base.critRate, unit: '%' },
  { label: '暴击伤害', value: props.agent.base.critDmg, unit: '%' },
  { label: '异常精通', value: props.agent.base.anomalyProficiency, unit: '' },
  { label: '异常掌控', value: props.agent.base.anomalyMastery, unit: '' },
  { label: '穿透率', value: props.agent.base.penRatio, unit: '%' },
  { label: '能量自动回复', value: props.agent.base.energyRegen * 100, unit: '%' },
])

const keyCinemas = computed(() =>
  props.agent.cinemas.filter((cinema) => cinema.keyLevel),
)
</script>

<template>
  <div class="overview">
    <div class="overview__grid">
      <section class="card panel profile">
        <header class="panel__head">
          <h3>档案</h3>
          <span>PROFILE</span>
        </header>
        <dl class="profile__list">
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
            <dd class="num">{{ agent.profile.height || '—' }} cm</dd>
          </div>
          <div>
            <dt>属性</dt>
            <dd>{{ agent.element }}</dd>
          </div>
          <div>
            <dt>职业</dt>
            <dd>{{ agent.specialty }}</dd>
          </div>
          <div>
            <dt>评级</dt>
            <dd>{{ agent.rarity }}</dd>
          </div>
        </dl>
        <p class="profile__intro">{{ agent.intro }}</p>
        <ul class="profile__tags">
          <li v-for="tag in agent.tags" :key="tag" class="tag">{{ tag }}</li>
        </ul>
      </section>

      <section class="card panel stats">
        <header class="panel__head">
          <h3>基础面板</h3>
          <span>Lv.60 · BASE</span>
        </header>
        <div class="stats__grid">
          <div v-for="stat in stats" :key="stat.label" class="stats__item">
            <span>{{ stat.label }}</span>
            <b class="num">{{ stat.value }}{{ stat.unit }}</b>
          </div>
        </div>
        <p class="panel__note">
          60 级白板，未计入核心技、音擎、驱动盘与影画加成；异常掌控按游戏规则取整展示。
        </p>
      </section>
    </div>

    <section class="card panel core">
      <header class="panel__head">
        <h3>核心技 · {{ passive.name }}</h3>
        <div class="core__levels" role="tablist" aria-label="核心技等级">
          <button
            v-for="(item, index) in coreLevels"
            :key="item"
            class="core__level"
            :class="{ 'is-active': item === level }"
            role="tab"
            :aria-selected="item === level"
            @click="level = item"
          >
            {{ item }}
          </button>
        </div>
      </header>

      <div class="core__body">
        <RichText :text="coreText" class="core__text" />

        <aside class="core__scaling">
          <p class="core__scaling-title">本等级数值（{{ level }}）</p>
          <dl>
            <div>
              <dt>异常精通</dt>
              <dd class="num">+{{ passive.amFlat[passiveIndex] }}</dd>
            </div>
            <div>
              <dt>灼蚀暴击伤害</dt>
              <dd class="num">{{ passive.critDmg[passiveIndex] }}%</dd>
            </div>
            <div>
              <dt>灼蚀周期伤害</dt>
              <dd class="num">{{ passive.tickAtkPct[passiveIndex] }}% 攻击</dd>
            </div>
            <div>
              <dt>核心属性</dt>
              <dd class="num">
                掌控 +{{ bonus.ac }} / 基础攻击 +{{ bonus.atkBase }}
              </dd>
            </div>
          </dl>
          <p class="core__hint">
            上方文本为 F 级（满级）描述，切换等级后以右侧「本等级数值」为准。核心 A–F 每级提升「核心被动」等级；
            A/C/E 提供异常掌控，B/D/F 提供基础攻击力。
          </p>
        </aside>
      </div>
    </section>

    <section v-if="keyCinemas.length" class="key-cinemas">
      <div class="section-title">
        <h2>关键影画</h2>
        <small>KEY CINEMA</small>
      </div>
      <div class="key-cinemas__grid">
        <RouterLink
          v-for="cinema in keyCinemas"
          :key="cinema.level"
          :to="{ path: '/agents/phoenix', query: { tab: 'cinemas' }, hash: `#cinema-${cinema.level}` }"
          class="key-cinema card"
        >
          <span class="key-cinema__level num">L{{ cinema.level }}</span>
          <div>
            <h4>{{ cinema.name }}</h4>
            <p>{{ cinema.effect.split('\n')[0] }}</p>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  gap: 22px;
}

.overview__grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 22px;
}

.panel {
  padding: 24px 26px;
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.panel__head h3 {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.04em;
}

.panel__head > span {
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.2em;
}

.panel__note {
  margin-top: 16px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.profile__list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.profile__list > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
}

.profile__list dt {
  color: var(--muted);
  font-size: 12px;
}

.profile__list dd {
  margin: 0;
  color: var(--text-2);
  font-size: 13px;
}

.profile__intro {
  margin-top: 18px;
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.85;
}

.profile__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.stats__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
}

.stats__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  background: var(--surface);
}

.stats__item span {
  color: var(--muted);
  font-size: 12px;
}

.stats__item b {
  font-size: 17px;
  font-weight: 600;
}

.core__levels {
  display: flex;
  gap: 4px;
}

.core__level {
  width: 30px;
  height: 28px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 12px;
  transition: all 0.15s ease;
}

.core__level:hover {
  color: var(--text);
  border-color: var(--text-2);
}

.core__level.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

.core__body {
  display: grid;
  grid-template-columns: 1.5fr 0.8fr;
  gap: 30px;
}

.core__scaling {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-soft);
}

.core__scaling-title {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.14em;
}

.core__scaling dl {
  margin-top: 10px;
}

.core__scaling dl > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(38, 38, 49, 0.7);
  font-size: 12px;
}

.core__scaling dt {
  color: var(--muted);
}

.core__scaling dd {
  margin: 0;
  color: var(--text);
  font-weight: 600;
}

.core__hint {
  margin-top: 12px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

.key-cinemas__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.key-cinema {
  display: flex;
  gap: 16px;
  padding: 18px 20px;
  border-left: 2px solid var(--accent);
}

.key-cinema__level {
  color: var(--accent);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.key-cinema h4 {
  font-size: 14px;
  font-weight: 600;
}

.key-cinema p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 980px) {
  .overview__grid,
  .core__body {
    grid-template-columns: 1fr;
  }

  .key-cinemas__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .panel {
    padding: 18px;
  }

  .panel__head {
    flex-wrap: wrap;
    gap: 10px;
  }

  .panel__head h3 {
    white-space: nowrap;
  }

  .profile__list,
  .stats__grid {
    grid-template-columns: 1fr;
  }
}
</style>
