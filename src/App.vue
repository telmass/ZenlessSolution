<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { navigation } from '@/lib/navigation'

const fatalError = ref<string | null>(null)

onErrorCaptured((error) => {
  // 渲染期错误兜底：显示可恢复占位，避免整页白屏。
  fatalError.value = error instanceof Error ? error.message : String(error)
  console.error(error)
  return false
})
</script>

<template>
  <div class="app">
    <div v-show="navigation.pending" class="route-progress" aria-hidden="true"></div>
    <AppHeader />

    <main id="content" class="app__main" tabindex="-1">
      <template v-if="!fatalError">
        <RouterView />
      </template>
      <div v-else class="app__error container" role="alert">
        <h1>页面渲染失败</h1>
        <p>{{ fatalError }}</p>
        <button type="button" class="app__reload" @click="fatalError = null">重试</button>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app__main {
  flex: 1;
}

.app__main:focus {
  outline: none;
}

.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  width: 100%;
  height: 2px;
  background: var(--accent);
  transform-origin: left;
  animation: route-progress 1.2s ease-in-out infinite;
}

@keyframes route-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.app__error {
  display: grid;
  gap: var(--s3);
  padding: var(--s10) 0;
}

.app__error h1 {
  font-family: var(--font-display);
  font-size: var(--fs-28);
  font-weight: 700;
}

.app__error p {
  color: var(--muted);
  font-size: var(--fs-14);
}

.app__reload {
  justify-self: start;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: var(--fs-14);
}
</style>
