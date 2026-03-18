<script setup lang="ts">
import { computed } from 'vue'
import type { Severity } from '../lib/analyzer'

const props = defineProps<{ severity: Severity }>()

const styles: Record<Severity, { bg: string; text: string; icon: string }> = {
  error: { bg: '#FF3B30', text: '#fff', icon: '\u2716' },
  warning: { bg: '#FF9500', text: '#fff', icon: '\u26A0' },
  info: { bg: '#636366', text: '#fff', icon: '\u2139' },
}

const s = computed(() => styles[props.severity] ?? styles.info)
</script>

<template>
  <span
    class="inline-block rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
    :style="{ background: s.bg, color: s.text, letterSpacing: '0.05em' }"
  >
    <span aria-hidden="true">{{ s.icon }}</span> {{ severity }}
  </span>
</template>
