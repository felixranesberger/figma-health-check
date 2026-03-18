<script setup lang="ts">
import { computed } from 'vue'
import type { Severity } from '../lib/analyzer'

const props = defineProps<{ severity: Severity }>()

const colors: Record<Severity, { bg: string; text: string }> = {
  error: { bg: '#FF3B30', text: '#fff' },
  warning: { bg: '#FF9500', text: '#fff' },
  info: { bg: '#636366', text: '#fff' },
}

const c = computed(() => colors[props.severity] ?? colors.info)
</script>

<template>
  <span
    class="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
    :style="{ background: c.bg, color: c.text, letterSpacing: '0.05em' }"
  >
    {{ severity }}
  </span>
</template>
