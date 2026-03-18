<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  total: number
  color?: string
}>()

const pct = computed(() => (props.total ? Math.round((props.value / props.total) * 100) : 0))
const c = computed(() => props.color ?? 'var(--color-text)')
</script>

<template>
  <div class="min-w-0 flex-1 rounded-lg border border-(--color-border-strong) bg-(--color-surface-raised) p-4" style="flex-basis: 140px">
    <div class="font-mono text-[28px] font-extrabold leading-none" :style="{ color: c }">
      {{ value }}
    </div>
    <div class="mt-1 text-[11px] font-medium text-(--color-text-muted)" style="letter-spacing: 0.02em">
      {{ label }}
    </div>
    <div v-if="total > 0" class="mt-2 h-[3px] overflow-hidden rounded-sm bg-(--color-border)">
      <div
        class="h-full rounded-sm transition-[width] duration-600"
        :style="{ width: `${pct}%`, background: c }"
        style="transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1)"
      />
    </div>
  </div>
</template>
