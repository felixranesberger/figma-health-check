<script setup lang="ts">
import type { FlatColorGroup } from '../lib/color-tree'

defineProps<{
  groups: FlatColorGroup[]
}>()
</script>

<template>
  <div class="space-y-4">
    <div v-for="(group, i) in groups" :key="i">
      <div v-if="group.path.length > 0" class="mb-2 text-[12px] font-semibold text-(--color-text)">
        <template v-for="(seg, j) in group.path" :key="j">
          <span v-if="j > 0" class="mx-1 text-(--color-text-muted)" style="opacity: 0.4">&rsaquo;</span>
          <span :class="j < group.path.length - 1 ? 'text-(--color-text-muted)' : ''">{{ seg }}</span>
        </template>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <div
          v-for="c in group.colors"
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
    </div>
  </div>
</template>
