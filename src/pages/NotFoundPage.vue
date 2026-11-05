<script setup lang="ts">
import { onMounted } from 'vue'
import { setPageMeta } from '@/lib/seo'

onMounted(() => setPageMeta('页面未找到'))
</script>

<template>
  <div class="notfound container">
    <p class="notfound__code num">404</p>
    <h1>页面未找到</h1>
    <p class="notfound__hint">你访问的页面不存在，或已被移动。</p>
    <RouterLink to="/" class="notfound__link">返回首页 →</RouterLink>
  </div>
</template>

<style scoped>
.notfound {
  display: grid;
  justify-items: start;
  gap: var(--s3);
  padding: var(--s10) 0 var(--s12);
}

.notfound__code {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-52);
  font-weight: 700;
  line-height: 1;
}

.notfound h1 {
  font-family: var(--font-display);
  font-size: var(--fs-28);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.notfound__hint {
  color: var(--muted);
  font-size: var(--fs-14);
}

.notfound__link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--accent);
  font-size: var(--fs-14);
  border-bottom: 1px solid rgba(240, 223, 78, 0.4);
}
</style>
