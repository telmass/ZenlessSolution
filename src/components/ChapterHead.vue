<script setup lang="ts">
defineProps<{
  index: string
  title: string
  lede?: string
  titleId?: string
}>()
</script>

<template>
  <header class="chapter-head">
    <span class="chapter-head__index num" aria-hidden="true">{{ index }}</span>
    <div class="chapter-head__body">
      <h2 :id="titleId">{{ title }}</h2>
      <p v-if="lede">{{ lede }}</p>
    </div>
  </header>
</template>

<style scoped>
.chapter-head__body h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 3vw, 2.75rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: var(--lh-tight);
}

.chapter-head__body p {
  max-width: var(--measure);
  margin-top: var(--s3);
  color: var(--muted);
  font-size: var(--fs-15);
}
</style>

