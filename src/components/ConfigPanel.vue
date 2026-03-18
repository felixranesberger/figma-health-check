<script setup lang="ts">
import { DEFAULT_SPACING_TOLERANCE } from '../lib/analyzer'

defineProps<{
  configOpen: boolean
  spacingInput: string
}>()

const emit = defineEmits<{
  'update:configOpen': [value: boolean]
  'update:spacingInput': [value: string]
}>()
</script>

<template>
  <div>
    <button
      class="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-(--color-accent)"
      @click="emit('update:configOpen', !configOpen)"
    >
      <span
        class="inline-block text-[10px] transition-transform duration-200"
        :class="configOpen ? 'rotate-90' : ''"
      >&#x25B6;</span>
      Configure Rules
    </button>
    <div v-if="configOpen" class="mt-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3.5">
      <label class="mb-1.5 block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
        Valid Spacing Tokens (px, comma-separated)
      </label>
      <input
        type="text"
        :value="spacingInput"
        class="w-full rounded-lg border border-(--color-border) bg-(--color-surface-raised) px-3 py-2.5 font-mono text-[13px] text-(--color-text) outline-none"
        @input="emit('update:spacingInput', ($event.target as HTMLInputElement).value)"
      />
      <p class="mt-1.5 text-[10px] text-(--color-text-muted)">
        Tolerance: &plusmn;{{ DEFAULT_SPACING_TOLERANCE }}px per value
      </p>
    </div>
  </div>
</template>
