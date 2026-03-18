<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Issue } from '../lib/analyzer'
import SeverityBadge from './SeverityBadge.vue'
import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  issue: Issue
  index: number
  fileKey: string
}>()

const open = ref(false)

const figmaUrl = computed(() => {
  if (!props.fileKey || !props.issue.nodeId) return ''
  // Figma URLs use "-" instead of ":" in node IDs, and semicolons need encoding
  const nodeId = props.issue.nodeId.replaceAll(':', '-')
  return `https://www.figma.com/design/${props.fileKey}?node-id=${encodeURIComponent(nodeId)}`
})
</script>

<template>
  <div
    class="cursor-pointer border-b border-(--color-border) px-4 py-3 transition-colors duration-150"
    :class="open ? 'bg-(--color-surface-raised)' : 'hover:bg-(--color-surface-raised)'"
    @click="open = !open"
  >
    <div class="flex flex-wrap items-center gap-2">
      <span class="min-w-7 font-mono text-[10px] text-(--color-text-muted)">
        #{{ index + 1 }}
      </span>
      <SeverityBadge :severity="issue.severity" />
      <TypeBadge :type="issue.type" />
      <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--color-text)">
        {{ issue.message }}
      </span>
      <span
        class="text-[10px] text-(--color-text-muted) transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      >
        &#x25BC;
      </span>
    </div>
    <div v-if="open" class="mt-2.5 pl-9">
      <div class="mb-1.5 break-all font-mono text-xs text-(--color-text-muted)">
        <span class="opacity-50">Path:</span>
        <a
          v-if="figmaUrl"
          :href="figmaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-(--color-accent) hover:underline"
          @click.stop
        >
          {{ issue.path }}
        </a>
        <span v-else>{{ issue.path }}</span>
      </div>
      <div class="rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 font-mono text-xs text-(--color-text)">
        {{ issue.detail }}
      </div>
      <div v-if="issue.nodeId" class="mt-1 font-mono text-[10px] text-(--color-text-muted)">
        Node ID:
        <a
          v-if="figmaUrl"
          :href="figmaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-(--color-accent) hover:underline"
          @click.stop
        >
          {{ issue.nodeId }}
        </a>
        <span v-else>{{ issue.nodeId }}</span>
      </div>
    </div>
  </div>
</template>
