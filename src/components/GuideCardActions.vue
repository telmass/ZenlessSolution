<script setup lang="ts">
import { ref } from 'vue'
import type { Agent } from '@/types/agent'
import { copyGuideCard, saveGuideCard } from '@/lib/guide-card'

const props = defineProps<{ agent: Agent }>()
const busy = ref(false)
const message = ref('')

async function run(action: 'save' | 'copy') {
  if (busy.value) return
  busy.value = true
  message.value = action === 'save' ? '正在生成攻略卡…' : '正在复制攻略卡…'
  try {
    if (action === 'save') {
      await saveGuideCard(props.agent)
      message.value = '攻略卡已保存'
    } else {
      const copied = await copyGuideCard(props.agent)
      message.value = copied ? '攻略卡已复制' : '剪贴板不可用，已改为下载'
    }
  } catch (error) {
    message.value = error instanceof Error ? error.message : '生成攻略卡失败'
  } finally {
    busy.value = false
    window.setTimeout(() => {
      if (!busy.value) message.value = ''
    }, 2600)
  }
}
</script>

<template>
  <div class="guide-card-actions">
    <button type="button" class="guide-card-actions__save" :disabled="busy" @click="run('save')">
      保存攻略卡
    </button>
    <button type="button" class="guide-card-actions__copy" :disabled="busy" @click="run('copy')">
      复制攻略卡
    </button>
    <span class="guide-card-actions__status" role="status" aria-live="polite">{{ message }}</span>
  </div>
</template>

<style scoped>
.guide-card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.guide-card-actions button {
  min-height: 38px;
  padding: 7px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-size: var(--fs-12);
  transition: all var(--dur-fast) var(--ease-out);
}

.guide-card-actions button:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.guide-card-actions__save {
  border-color: rgba(240, 223, 78, 0.45) !important;
  color: var(--accent) !important;
}

.guide-card-actions button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.guide-card-actions__status {
  color: var(--muted);
  font-size: var(--fs-12);
}
</style>
