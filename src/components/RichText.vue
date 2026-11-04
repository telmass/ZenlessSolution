<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

const lines = computed(() => props.text.split('\n').map((line) => line.trim()).filter(Boolean))

function segments(line: string) {
  const out: { text: string; tag: boolean }[] = []
  const re = /\[([^\]]+)\]/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(line))) {
    if (match.index > last) out.push({ text: line.slice(last, match.index), tag: false })
    out.push({ text: match[1], tag: true })
    last = match.index + match[0].length
  }
  if (last < line.length) out.push({ text: line.slice(last), tag: false })
  return out
}

const parsed = computed(() => lines.value.map(segments))
</script>

<template>
  <div class="rich">
    <p v-for="(line, index) in parsed" :key="index">
      <template v-for="(seg, segIndex) in line" :key="segIndex">
        <span v-if="seg.tag" class="rich__tag">{{ seg.text }}</span>
        <template v-else>{{ seg.text }}</template>
      </template>
    </p>
  </div>
</template>

<style scoped>
.rich {
  display: grid;
  gap: 8px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.8;
}

.rich__tag {
  color: var(--accent);
  font-weight: 500;
}
</style>
