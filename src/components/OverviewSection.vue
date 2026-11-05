<script setup lang="ts">
import { computed } from 'vue'
import type { Agent } from '@/types/agent'

const props = defineProps<{ agent: Agent }>()

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

@media (max-width: 980px) {
  .overview__grid {
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
