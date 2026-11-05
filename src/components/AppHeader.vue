<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const nav = [
  { label: '首页', to: '/', match: (p: string) => p === '/' },
  { label: '代理人', to: '/agents', match: (p: string) => p.startsWith('/agents') },
  { label: '音擎', to: '/engines', match: (p: string) => p.startsWith('/engines') },
  { label: '驱动盘', to: '/drives', match: (p: string) => p.startsWith('/drives') },
  { label: '邦布', to: '/bangboo', match: (p: string) => p.startsWith('/bangboo') },
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
        <RouterLink
          v-for="item in nav"
          :key="item.label"
          :to="item.to"
          class="nav__link"
          :class="{ 'is-active': item.match(route.path) }"
          :aria-current="item.match(route.path) ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(8, 8, 11, 0.82);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.header__inner {
  display: flex;
  align-items: stretch;
  gap: 32px;
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
  box-shadow: 0 0 22px var(--accent-glow);
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.brand__text b {
  font-family: var(--font-display);
  font-size: var(--fs-16);
  letter-spacing: 0.14em;
}

.brand__text i {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
  font-style: normal;
  letter-spacing: 0.14em;
}

.nav {
  display: flex;
  align-items: stretch;
  gap: 24px;
  flex: 1;
  min-width: 0;
}

.nav__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--text-2);
  font-size: var(--fs-14);
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
  bottom: 0;
  height: 2px;
  background: var(--accent);
}

@media (max-width: 900px) {
  .header__inner {
    gap: 20px;
  }

  .nav {
    gap: 16px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 620px) {
  .header__inner {
    gap: 12px;
  }

  .nav {
    gap: 14px;
  }

  .brand__text i {
    display: none;
  }

  .nav__link {
    font-size: var(--fs-14);
  }
}

@media (max-width: 420px) {
  .header__inner {
    gap: 10px;
  }

  .nav {
    gap: 10px;
  }
}
</style>
