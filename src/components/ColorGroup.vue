<script setup lang="ts">
import type { ExtractedColor } from '../lib/token-extractor'

export interface ColorTreeNode {
  name: string
  colors: ExtractedColor[]
  children: Map<string, ColorTreeNode>
}

defineProps<{
  node: ColorTreeNode
  depth?: number
}>()
</script>

<template>
  <div :class="depth ? 'ml-4' : ''">
    <div
      v-if="node.name"
      class="mb-1.5 text-[11px] font-semibold text-(--color-text)"
      :class="depth === 0 ? 'text-[12px]' : ''"
      style="letter-spacing: 0.02em"
    >
      {{ node.name }}
    </div>

    <!-- Leaf colors at this level -->
    <div v-if="node.colors.length > 0" class="mb-2 flex flex-wrap gap-1.5">
      <div
        v-for="c in node.colors"
        :key="c.styleId"
        class="flex items-center gap-1.5 rounded-md border border-(--color-border) bg-(--color-surface-raised) px-2 py-1"
      >
        <span
          class="inline-block h-3.5 w-3.5 rounded-sm border border-(--color-border)"
          :style="{ background: c.hex }"
        />
        <span class="font-mono text-[10px] text-(--color-text-muted)">{{ c.leafName }}</span>
        <span class="font-mono text-[10px] text-(--color-text)" style="opacity: 0.5">{{ c.hex }}</span>
      </div>
    </div>

    <!-- Nested groups -->
    <ColorGroup
      v-for="[key, child] in node.children"
      :key="key"
      :node="child"
      :depth="(depth ?? 0) + 1"
    />
  </div>
</template>
