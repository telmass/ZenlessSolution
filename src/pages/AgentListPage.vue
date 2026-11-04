<script setup lang="ts">
import { computed, ref } from 'vue'
import index from '@/data/agents/index.json'
import type { AgentIndexItem } from '@/types/agent'
import AgentCodexCard from '@/components/AgentCodexCard.vue'

const agents = index as unknown as AgentIndexItem[]

const ELEMENT_ORDER = ['物理', '火', '冰', '电', '以太', '风', '烈霜', '玄墨', '流明', '凛刃']
const SPECIALTY_ORDER = ['强攻', '击破', '异常', '支援', '防护', '命破', '锋御']
const RARITY_ORDER = ['S', 'A', 'B']
const STATUS_OPTIONS = [
  { value: '全部', label: '全部' },
  { value: 'open', label: '已开放' },
  { value: 'locked', label: '施工中' },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value']

const search = ref('')
const element = ref('全部')
const specialty = ref('全部')
const rarity = ref('全部')
const faction = ref('全部')
const status = ref<StatusFilter>('全部')

const openCount = computed(() => agents.filter((agent) => agent.available).length)
const lockedCount = computed(() => agents.length - openCount.value)

const elements = [
  '全部',
  ...ELEMENT_ORDER.filter((value) => agents.some((agent) => agent.element === value)),
]
const specialties = [
  '全部',
  ...SPECIALTY_ORDER.filter((value) => agents.some((agent) => agent.specialty === value)),
]
const rarities = [
  '全部',
  ...RARITY_ORDER.filter((value) => agents.some((agent) => agent.rarity === value)),
]
const factions = [
  '全部',
  ...Array.from(new Set(agents.map((agent) => agent.faction))).sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  ),
]

const hasFilter = computed(
  () =>
    search.value.trim() !== '' ||
    element.value !== '全部' ||
    specialty.value !== '全部' ||
    rarity.value !== '全部' ||
    faction.value !== '全部' ||
    status.value !== '全部',
)

const filtered = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return agents.filter((agent) => {
    if (element.value !== '全部' && agent.element !== element.value) return false
    if (specialty.value !== '全部' && agent.specialty !== specialty.value) return false
    if (rarity.value !== '全部' && agent.rarity !== rarity.value) return false
    if (faction.value !== '全部' && agent.faction !== faction.value) return false
    if (status.value === 'open' && !agent.available) return false
    if (status.value === 'locked' && agent.available) return false
    if (!keyword) return true
    return `${agent.name} ${agent.fullName} ${agent.en} ${agent.slug}`
      .toLowerCase()
      .includes(keyword)
  })
})

function reset() {
  search.value = ''
  element.value = '全部'
  specialty.value = '全部'
  rarity.value = '全部'
  faction.value = '全部'
  status.value = '全部'
}
</script>

<template>
  <div class="codex container">
    <header class="codex-head codex-head--agents">
      <div class="agents-title">
        <p class="eyebrow">Agent Codex</p>
        <h1>代理人</h1>
        <p class="agents-title__lede">
          官方图鉴复刻进行中。已收录 <b>{{ agents.length }}</b> 位代理人，当前仅
          <b>菲欧妮</b> 开放完整档案；灰色条目为施工中，暂不可进入。
        </p>
      </div>

      <div class="agents-meta">
        <div class="codex-head__count num">
          {{ agents.length }}
          <small>AGENTS</small>
        </div>
        <p class="agents-meta__open num">
          OPEN {{ String(openCount).padStart(2, '0') }} / {{ agents.length }}
        </p>
      </div>
    </header>

    <section class="filter-board" aria-label="代理人筛选">
      <div class="filter-board__top">
        <label class="codex-search">
          <span class="sr-only">搜索代理人</span>
          <input v-model="search" type="search" placeholder="搜索名称 / 英文名 / 代号…" />
        </label>

        <p class="filter-board__result" role="status" aria-live="polite">
          匹配 <b class="num">{{ filtered.length }}</b> / {{ agents.length }} 位
        </p>

        <button v-if="hasFilter" type="button" class="filter-reset" @click="reset">
          清除筛选
        </button>
      </div>

      <div class="filter-board__rows">
        <div class="filter-row">
          <span class="filter-label">属性</span>
          <div class="chips" role="group" aria-label="属性筛选">
            <button
              v-for="item in elements"
              :key="item"
              type="button"
              class="chip"
              :class="{ 'is-active': element === item }"
              :aria-pressed="element === item"
              @click="element = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="filter-row">
          <span class="filter-label">职业</span>
          <div class="chips" role="group" aria-label="职业筛选">
            <button
              v-for="item in specialties"
              :key="item"
              type="button"
              class="chip"
              :class="{ 'is-active': specialty === item }"
              :aria-pressed="specialty === item"
              @click="specialty = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="filter-row">
          <span class="filter-label">评级</span>
          <div class="chips" role="group" aria-label="评级筛选">
            <button
              v-for="item in rarities"
              :key="item"
              type="button"
              class="chip"
              :class="{ 'is-active': rarity === item }"
              :aria-pressed="rarity === item"
              @click="rarity = item"
            >
              {{ item }}
            </button>
          </div>

          <span class="filter-divider" aria-hidden="true" />

          <span class="filter-label filter-label--inline">状态</span>
          <div class="chips" role="group" aria-label="开放状态筛选">
            <button
              v-for="item in STATUS_OPTIONS"
              :key="item.value"
              type="button"
              class="chip"
              :class="{ 'is-active': status === item.value }"
              :aria-pressed="status === item.value"
              @click="status = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="filter-row filter-row--select">
          <span class="filter-label">阵营</span>
          <label class="filter-select">
            <span class="sr-only">阵营筛选</span>
            <select v-model="faction">
              <option v-for="item in factions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
          <span class="filter-hint">已开放 {{ openCount }} · 施工中 {{ lockedCount }}</span>
        </div>
      </div>
    </section>

    <div v-if="filtered.length" class="agent-grid">
      <AgentCodexCard
        v-for="agent in filtered"
        :key="agent.slug"
        :agent="agent"
        :index="agents.indexOf(agent)"
      />
    </div>

    <div v-else class="agents-empty">
      <p class="eyebrow">No Match</p>
      <p class="agents-empty__title">没有匹配的代理人</p>
      <p class="agents-empty__copy">试试更换属性、职业或阵营，或清除全部筛选条件。</p>
      <button type="button" class="filter-reset" @click="reset">清除全部筛选</button>
    </div>
  </div>
</template>

<style scoped>
.codex-head--agents {
  align-items: flex-start;
}

.agents-title h1 {
  margin-top: 6px;
}

.agents-title__lede {
  max-width: 60ch;
  margin-top: 10px;
  color: var(--muted);
  font-size: var(--fs-13);
  line-height: 1.8;
}

.agents-title__lede b {
  color: var(--text-2);
  font-weight: 500;
}

.agents-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.agents-meta__open {
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}

.filter-board {
  margin: var(--s5) 0 var(--s4);
  padding: 14px 16px 6px;
  border: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 62%),
    var(--bg-soft);
}

.filter-board__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s4);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.filter-board__result {
  margin-left: auto;
  color: var(--muted);
  font-size: var(--fs-12);
  letter-spacing: 0.03em;
}

.filter-board__result b {
  color: var(--text);
  font-weight: 600;
}

.filter-reset {
  flex-shrink: 0;
  padding: 5px 10px;
  border: 1px solid var(--line-strong);
  color: var(--muted);
  font-size: var(--fs-11);
  letter-spacing: 0.04em;
  transition: color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.filter-reset:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.filter-board__rows {
  display: grid;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(35, 35, 44, 0.62);
}

.filter-row:last-child {
  border-bottom: 0;
  padding-bottom: 10px;
}

.filter-label {
  flex-shrink: 0;
  width: 34px;
  margin-right: 0;
  color: var(--muted);
  font-size: var(--fs-11);
  letter-spacing: 0.1em;
}

.filter-label--inline {
  width: auto;
  margin-left: 4px;
}

.filter-divider {
  width: 1px;
  height: 14px;
  margin: 0 4px;
  background: var(--line);
}

.filter-row .chip {
  padding: 4px 10px;
  font-size: var(--fs-11);
}

.filter-row--select {
  gap: 10px;
}

.filter-select {
  position: relative;
  min-width: 190px;
  max-width: 280px;
  flex: 0 1 280px;
}

.filter-select select {
  width: 100%;
  padding: 6px 28px 6px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-2);
  font: inherit;
  font-size: var(--fs-12);
  appearance: none;
  cursor: pointer;
}

.filter-select select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.filter-select::after {
  content: "▾";
  position: absolute;
  top: 50%;
  right: 10px;
  color: var(--muted);
  font-size: 10px;
  pointer-events: none;
  transform: translateY(-50%);
}

.filter-hint {
  color: #77746c;
  font-size: var(--fs-11);
  letter-spacing: 0.05em;
}

.agent-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.agents-empty {
  padding: 72px 0 56px;
  border-top: 1px solid var(--line);
  text-align: center;
}

.agents-empty__title {
  margin-top: 12px;
  font-family: var(--font-display);
  font-size: var(--fs-28);
  font-weight: 600;
  letter-spacing: 0.03em;
}

.agents-empty__copy {
  margin: 6px auto 16px;
  color: var(--muted);
  font-size: var(--fs-12);
}

@media (max-width: 1160px) {
  .agent-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .agent-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .codex-head--agents {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s4);
  }

  .agents-meta {
    flex-direction: row;
    align-items: baseline;
    gap: 14px;
  }

  .agents-meta__open {
    margin-top: 0;
  }
}

@media (max-width: 760px) {
  .agent-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .filter-board {
    padding-inline: 12px;
  }

  .filter-board__top {
    align-items: flex-start;
  }

  .filter-board__result {
    order: 3;
    width: 100%;
    margin-left: 0;
  }

  .filter-label {
    width: 100%;
  }

  .filter-divider {
    display: none;
  }

  .filter-label--inline {
    width: 100%;
    margin-left: 0;
  }

  .filter-row .chips {
    margin-left: 0;
  }

  .filter-hint {
    display: none;
  }
}

@media (max-width: 460px) {
  .agent-grid {
    grid-template-columns: 1fr;
  }

  .filter-select {
    max-width: none;
    flex-basis: 100%;
  }
}
</style>
