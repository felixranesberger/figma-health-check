<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { DEFAULT_SPACING_TOLERANCE } from '../lib/analyzer'

defineProps<{
  spacingInput: string
}>()

const emit = defineEmits<{
  'update:spacingInput': [value: string]
}>()
</script>

<template>
  <details>
    <summary class="flex cursor-pointer items-center gap-1 text-xs font-semibold text-(--color-accent)">
      <ChevronRight class="chevron size-3.5 shrink-0" aria-hidden="true" />
      Configure Rules
    </summary>
    <div class="mt-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3.5">
      <label for="spacing-tokens" class="mb-1.5 block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
        Valid Spacing Tokens (px, comma-separated)
      </label>
      <input
        id="spacing-tokens"
        type="text"
        name="spacingTokens"
        :value="spacingInput"
        class="w-full rounded-lg border border-(--color-border) bg-(--color-surface-raised) px-3 py-2.5 font-mono text-[13px] text-(--color-text) outline-none"
        @input="emit('update:spacingInput', ($event.target as HTMLInputElement).value)"
      />
      <p class="mt-1.5 text-[10px] text-(--color-text-muted)">
        Tolerance: &plusmn;{{ DEFAULT_SPACING_TOLERANCE }}px per value
      </p>
    </div>
  </details>
</template>
