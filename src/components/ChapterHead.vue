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
  font-size: clamp(var(--fs-28), 2.6vw, var(--fs-36));
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: var(--lh-title);
}

.chapter-head__body p {
  max-width: var(--measure);
  margin-top: var(--s3);
  color: var(--muted);
  font-size: var(--fs-16);
  line-height: 1.7;
}

@media (max-width: 900px) {
  .chapter-head__body p {
    font-size: var(--fs-14);
  }
}
</style>

