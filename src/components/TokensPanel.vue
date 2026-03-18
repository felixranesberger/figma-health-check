<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ExtractedTokens } from '../lib/token-extractor'
import { buildColorTree, flattenTree } from '../lib/color-tree'
import ColorGroup from './ColorGroup.vue'

const props = defineProps<{
  tokens: ExtractedTokens
}>()

const copied = ref(false)

async function copyCSS(css: string) {
  await navigator.clipboard.writeText(css)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const stats = computed(() => [
  { label: 'color styles', value: props.tokens.colors.length },
  { label: 'text styles', value: props.tokens.textStyles.length },
  { label: 'font families', value: props.tokens.fontFamilies.length },
  { label: 'spacing values', value: props.tokens.spacingValues.length },
].filter(s => s.value > 0))

const colorGroups = computed(() => flattenTree(buildColorTree(props.tokens.colors)))
</script>

<template>
  <div>
    <div class="mb-4 text-[11px] text-(--color-text-muted)">{{ tokens.fileName }}</div>

    <!-- Summary stats -->
    <div class="mb-4 flex flex-wrap gap-3">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-lg border border-(--color-border) bg-(--color-surface-raised) px-3 py-2"
      >
        <span class="font-mono text-[18px] font-bold text-(--color-accent)">{{ s.value }}</span>
        <span class="ml-1.5 text-[11px] text-(--color-text-muted)">{{ s.label }}</span>
      </div>
    </div>

    <!-- Color swatches -->
    <div v-if="tokens.colors.length > 0" class="mb-8">
      <h2 class="mb-2 text-[13px] font-semibold text-(--color-text-muted)">Colors</h2>
      <p class="mb-3 text-[10px] text-(--color-text-muted)">
        Extracted from defined color styles in the Figma file. Only colors applied via a named style are included &mdash; raw hex values on individual nodes are not captured.
      </p>
      <ColorGroup :groups="colorGroups" />
    </div>

    <!-- Text styles -->

    <div v-if="tokens.textStyles.length > 0" class="mb-8">
      <h2 class="mb-2 text-[13px] font-semibold text-(--color-text-muted)">Typography</h2>
      <p class="mb-2 text-[10px] text-(--color-text-muted)">
        Extracted from defined text styles in the Figma file. Shows font family, weight, size, line-height ratio, and additional properties like text-transform or decoration when set.
      </p>
      <div class="overflow-hidden rounded-lg border border-(--color-border)">
        <div
          v-for="ts in tokens.textStyles"
          :key="ts.styleId"
          class="flex flex-wrap items-center gap-3 border-b border-(--color-border) px-3 py-2 last:border-b-0"
        >
          <span class="min-w-[140px] font-mono text-[11px] font-medium text-(--color-text)">{{ ts.styleName }}</span>
          <span class="font-mono text-[10px] text-(--color-text-muted)">
            {{ ts.fontFamily }} {{ ts.fontWeight }} / {{ ts.fontSize }}px / {{ ts.lineHeightRatio }}
            <span v-if="Math.abs(ts.letterSpacingEm) > 0.001"> / ls {{ ts.letterSpacingEm }}em</span>
            <span v-if="ts.textCase !== 'ORIGINAL'"> / {{ ts.textCase.toLowerCase() }}</span>
            <span v-if="ts.textDecoration !== 'NONE'"> / {{ ts.textDecoration.toLowerCase() }}</span>
            <span v-if="ts.textAlignHorizontal !== 'LEFT'"> / {{ ts.textAlignHorizontal.toLowerCase() }}</span>
            <span v-if="ts.paragraphSpacing > 0"> / p-spacing {{ ts.paragraphSpacing }}px</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Spacing values in use -->
    <div v-if="tokens.spacingValues.length > 0" class="mb-8">
      <h2 class="mb-2 text-[13px] font-semibold text-(--color-text-muted)">Spacing Values in Use</h2>
      <p class="mb-2 text-[10px] text-(--color-text-muted)">
        Collected from Auto-Layout frames only (gap, padding, counter-axis spacing).
        Figma has no "spacing styles" &mdash; these are the actual values designers set on frames with Auto-Layout enabled.
        Frames without Auto-Layout use free positioning, so their spacing is not captured.
      </p>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="val in tokens.spacingValues"
          :key="val"
          class="rounded-md border border-(--color-border) bg-(--color-surface-raised) px-2 py-1 font-mono text-[11px] text-(--color-text)"
        >
          {{ val }}px
        </span>
      </div>
    </div>

    <!-- No tokens message -->
    <div
      v-if="tokens.colors.length === 0 && tokens.textStyles.length === 0 && tokens.spacingValues.length === 0"
      class="mb-4 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-6 text-center text-[13px] text-(--color-text-muted)"
    >
      No color or text styles defined in this file. Define styles in Figma to extract tokens.
    </div>

    <!-- Generated CSS -->
    <div v-if="tokens.css">
      <div class="mb-2 flex items-center gap-3">
        <h2 class="text-[13px] font-semibold text-(--color-text-muted)">Generated CSS</h2>
        <button
          class="cursor-pointer rounded-md border border-(--color-border) bg-(--color-surface-raised) px-2.5 py-1 text-[11px] font-semibold text-(--color-accent)"
          @click="copyCSS(tokens.css)"
        >
          {{ copied ? 'Copied!' : 'Copy CSS' }}
        </button>
        <span aria-live="polite" class="sr-only">{{ copied ? 'Copied to clipboard' : '' }}</span>
      </div>
      <pre class="max-h-[400px] overflow-auto rounded-xl border border-(--color-border-strong) bg-(--color-surface) p-4 font-mono text-[11px] leading-relaxed text-(--color-text)">{{ tokens.css }}</pre>
    </div>
  </div>
</template>
