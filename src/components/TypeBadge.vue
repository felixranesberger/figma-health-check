<script setup lang="ts">
import { computed } from 'vue'
import type { IssueType } from '../lib/analyzer'

const props = defineProps<{ type: IssueType }>()

const icons: Record<string, string> = {
  typography: 'Aa',
  spacing: '\u229E',
  layout: '\u2610',
  color: '\u25C9',
  responsive: '\u2194',
}

const icon = computed(() => icons[props.type] ?? '?')
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded border border-(--color-border) bg-(--color-surface-raised) px-2 py-0.5 font-mono text-[10px] font-semibold text-(--color-text-muted)"
    style="letter-spacing: 0.03em"
  >
    <span class="text-xs" aria-hidden="true">{{ icon }}</span>{{ type }}
  </span>
</template>
