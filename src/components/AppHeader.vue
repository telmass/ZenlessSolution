<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isAgent = computed(() => route.path.startsWith('/agents'))
const headerLabel = computed(() => {
  if (route.path === '/agents/phoenix') return 'PHOENIX'
  if (isAgent.value) return 'AGENTS'
  return 'PREVIEW'
})

const nav = [
  { label: '首页', to: '/', match: (p: string) => p === '/' },
  { label: '代理人', to: '/agents', match: (p: string) => p.startsWith('/agents') },
  { label: '音擎', to: '/engines', match: (p: string) => p.startsWith('/engines') },
  { label: '驱动盘', to: '/drives', match: (p: string) => p.startsWith('/drives') },
  { label: '邦布', to: '/bangboo', match: (p: string) => p.startsWith('/bangboo') },
  { label: '计算器', to: '/calculator', soon: true },
]
</script>

<template>
  <header class="header">
    <div class="header__inner container">
      <RouterLink to="/" class="brand" aria-label="ZenlessSolution 首页">
        <span class="brand__mark" aria-hidden="true"></span>
        <span class="brand__text">
          <b>ZENLESS</b>
          <i>SOLUTION</i>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <template v-for="item in nav" :key="item.label">
          <RouterLink
            v-if="!item.soon"
            :to="item.to"
            class="nav__link"
            :class="{ 'is-active': item.match?.(route.path) }"
          >
            {{ item.label }}
          </RouterLink>
          <span v-else class="nav__link is-soon" :title="`${item.label} · 建设中`">
            {{ item.label }}
            <em>soon</em>
          </span>
        </template>
      </nav>

      <div class="header__meta">
        <span class="dot" aria-hidden="true"></span>
        <span>{{ headerLabel }}</span>
        <b>v0.1</b>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(8, 8, 11, 0.78);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: 36px;
  height: var(--header-h);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand__mark {
  width: 22px;
  height: 22px;
  background: var(--accent);
  clip-path: polygon(0 0, 100% 0, 100% 62%, 62% 100%, 0 100%);
  box-shadow: 0 0 22px rgba(242, 225, 76, 0.35);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand__text b {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.16em;
}

.brand__text i {
  color: var(--muted);
  font-size: 9px;
  font-style: normal;
  letter-spacing: 0.34em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 26px;
  flex: 1;
}

.nav__link {
  position: relative;
  padding: 6px 0;
  color: var(--text-2);
  font-size: 14px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.nav__link:hover {
  color: var(--text);
}

.nav__link.is-active {
  color: var(--text);
}

.nav__link.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -19px;
  height: 2px;
  background: var(--accent);
}

.nav__link.is-soon {
  color: #5d5d68;
  cursor: not-allowed;
}

.nav__link.is-soon em {
  margin-left: 4px;
  font-size: 9px;
  font-style: normal;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.header__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.14em;
}

.header__meta b {
  color: var(--accent);
  font-weight: 600;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--fire);
  box-shadow: 0 0 10px var(--fire);
}

@media (max-width: 900px) {
  .nav {
    gap: 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav::-webkit-scrollbar {
    display: none;
  }

  .header__meta {
    display: none;
  }
}

@media (max-width: 620px) {
  .header__inner {
    gap: 12px;
  }

  .nav {
    gap: 12px;
  }

  .brand__text i {
    display: none;
  }

  .nav__link {
    font-size: 12px;
  }

  .nav__link.is-soon {
    display: none;
  }
}

@media (max-width: 420px) {
  .header__inner {
    gap: 10px;
  }

  .nav {
    gap: 9px;
  }

  .nav__link {
    font-size: 11px;
  }

  .brand__text b {
    font-size: 13px;
  }
}
</style>
