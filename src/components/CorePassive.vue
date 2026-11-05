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
const extra = computed(() => coreSkill.value?.moves[1])
const passive = computed(() => props.agent.corePassive)

// Core ranks A-F map to passive levels 2-7; level 1 (43) is the no-core state.
const passiveIndex = computed(() => levelIndex.value + 1)
const hasPhoenixMechanics = computed(() => Boolean(passive.value.amFlat))
const coreRows = computed(() =>
  passive.value.effects.map((effect) => ({
    label: effect.label,
    value: effect.values[levelIndex.value],
  })),
)
</script>

<template>
  <section class="core-passive">
    <header class="core-passive__head">
      <h4>{{ passive.name }}</h4>
      <div class="core-passive__levels" role="group" aria-label="核心技等级">
        <button
          v-for="item in coreLevels"
          :key="item"
          class="core-passive__level"
          :class="{ 'is-active': item === level }"
          :aria-pressed="item === level"
          @click="level = item"
        >
          {{ item }}
        </button>
      </div>
    </header>

    <div class="core-passive__body">
      <RichText :text="coreText" class="core-passive__text" />

      <aside class="core-passive__scaling">
        <p class="core-passive__scaling-title num">{{ level }} 级数值</p>
        <dl>
          <template v-if="hasPhoenixMechanics">
            <div>
              <dt>异常精通</dt>
              <dd class="num">+{{ passive.amFlat![passiveIndex] }}</dd>
            </div>
            <div>
              <dt>灼蚀暴击伤害</dt>
              <dd class="num">{{ passive.critDmg![passiveIndex] }}%</dd>
            </div>
            <div>
              <dt>灼蚀周期伤害</dt>
              <dd class="num">{{ passive.tickAtkPct![passiveIndex] }}% 攻击</dd>
            </div>
          </template>
          <div v-for="row in coreRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd class="num">{{ row.value.includes('%') ? row.value : `+${row.value}` }}</dd>
          </div>
        </dl>
      </aside>
    </div>

    <div v-if="extra" class="core-passive__extra">
      <h4>{{ extra.title }}</h4>
      <RichText :text="extra.text" />
    </div>
  </section>
</template>

<style scoped>
.core-passive {
  display: grid;
  gap: var(--s5);
  padding-top: var(--s2);
}

.core-passive__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s5);
}

.core-passive__head h4 {
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.core-passive__levels {
  display: flex;
  gap: 4px;
}

.core-passive__level {
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

.core-passive__level:hover {
  color: var(--text);
  border-color: var(--text-2);
}

.core-passive__level.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}

.core-passive__body {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.75fr);
  gap: var(--s9);
}

.core-passive__scaling-title {
  color: var(--accent);
  font-size: var(--fs-12);
  letter-spacing: 0.08em;
}

.core-passive__scaling dl {
  margin-top: var(--s3);
  border-top: 1px solid var(--line);
}

.core-passive__scaling dl > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s3);
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.core-passive__scaling dt {
  color: var(--muted);
  font-size: var(--fs-12);
}

.core-passive__scaling dd {
  margin: 0;
  color: var(--text);
  font-size: var(--fs-18);
  font-weight: 600;
}

.core-passive__extra {
  display: grid;
  gap: var(--s2);
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.core-passive__extra h4 {
  font-family: var(--font-display);
  font-size: var(--fs-18);
  font-weight: 600;
}

@media (max-width: 980px) {
  .core-passive__body {
    grid-template-columns: 1fr;
  }
}
</style>
