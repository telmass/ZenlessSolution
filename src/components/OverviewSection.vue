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
</script>
<template>
  <div class="overview">
    <div class="overview__grid">
      <section class="dossier">
        <h3 class="block-title">档案</h3>
        <dl class="dossier__list">
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
            <dt>属性 / 职业</dt>
            <dd>{{ agent.element }} · {{ agent.specialty }}</dd>
          </div>
          <div>
            <dt>评级</dt>
            <dd>{{ agent.rarity }}</dd>
          </div>
        </dl>
      </section>

      <section class="stats">
        <header class="stats__head">
          <h3 class="block-title">基础面板</h3>
          <span class="num">Lv.60</span>
        </header>
        <div class="stats__grid">
          <div v-for="stat in stats" :key="stat.label" class="stats__row">
            <span>{{ stat.label }}</span>
            <b class="num">{{ stat.value }}{{ stat.unit }}</b>
          </div>
        </div>
        <p class="stats__note">
          60 级白板，未计入核心技、音擎、驱动盘与影画加成；异常掌控按游戏规则展示。
        </p>
      </section>
    </div>

    <section class="core">
      <header class="core__head">
        <div>
          <p class="core__kicker">核心技</p>
          <h3>{{ passive.name }}</h3>
        </div>
        <div class="core__levels" role="tablist" aria-label="核心技等级">
          <button
            v-for="item in coreLevels"
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
          <p class="core__scaling-title num">{{ level }} 级数值</p>
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
              <dd class="num">掌控 +{{ bonus.ac }} / 基础攻击 +{{ bonus.atkBase }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  gap: var(--s9);
}

.overview__grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: var(--s10);
  align-items: start;
}

.block-title {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.dossier__list {
  margin-top: var(--s4);
  border-top: 1px solid var(--line);
}

.dossier__list > div {
  display: flex;
  justify-content: space-between;
  gap: var(--s4);
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.dossier__list dt {
  color: var(--muted);
  font-size: var(--fs-12);
}

.dossier__list dd {
  margin: 0;
  color: var(--text-2);
  font-size: var(--fs-14);
}

.stats__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s4);
}

.stats__head span {
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.stats__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: var(--s8);
  margin-top: var(--s4);
  border-top: 1px solid var(--line);
}

.stats__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s3);
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}

.stats__row span {
  color: var(--muted);
  font-size: var(--fs-12);
}

.stats__row b {
  color: var(--text);
  font-size: var(--fs-18);
  font-weight: 600;
}

.stats__note {
  max-width: var(--measure-wide);
  margin-top: var(--s4);
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

.core {
  padding-top: var(--s7);
  border-top: 1px solid var(--line);
}

.core__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s5);
  margin-bottom: var(--s5);
}

.core__kicker {
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.core__head h3 {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: var(--fs-28);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.core__levels {
  display: flex;
  gap: 4px;
}

.core__level {
  width: 36px;
  height: 36px;
  border: 1px solid var(--line-control);
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-family: var(--font-display);
  font-size: var(--fs-14);
  transition:
    background var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
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
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.75fr);
  gap: var(--s9);
}

.core__scaling {
  padding-top: var(--s1);
}

.core__scaling-title {
  color: var(--accent);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.core__scaling dl {
  margin-top: var(--s3);
  border-top: 1px solid var(--line);
}

.core__scaling dl > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s3);
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.core__scaling dt {
  color: var(--muted);
  font-size: var(--fs-12);
}

.core__scaling dd {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-18);
  font-weight: 600;
}

@media (max-width: 980px) {
  .overview__grid,
  .core__body {
    grid-template-columns: 1fr;
  }

  .overview__grid {
    gap: var(--s7);
  }
}

@media (max-width: 560px) {
  .overview__grid {
    gap: var(--s6);
  }

  .core__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .core__level {
    width: 44px;
    height: 44px;
  }

  .stats__grid {
    column-gap: var(--s4);
  }

  .stats__row {
    gap: var(--s2);
  }

  .core__scaling {
    max-width: 420px;
  }

  .key-link a {
    display: inline-flex;
    align-items: flex-start;
    min-height: 44px;
    padding-top: 8px;
  }
}
</style>
