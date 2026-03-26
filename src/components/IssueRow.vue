<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import type { Issue } from '../lib/analyzer'
import type { LinkMode } from '../composables/useHealthCheck'
import SeverityBadge from './SeverityBadge.vue'
import TypeBadge from './TypeBadge.vue'

const props = defineProps<{
  issue: Issue
  index: number
  fileKey: string
  fileName: string
  linkMode: LinkMode
}>()

const isInstanceChild = computed(() => props.issue.nodeId.includes(';'))

const manualPath = computed(() => {
  if (!isInstanceChild.value) return ''
  return props.issue.path.slice(props.issue.linkedPath.length)
})

const figmaNodeId = computed(() => {
  let nodeId = props.issue.nodeId.replaceAll(':', '-')
  // Compound instance-child IDs (e.g. I1810:4911;3487:26829) can't be navigated
  // via URL — fall back to the parent instance node.
  if (nodeId.includes(';')) {
    nodeId = nodeId.replace(/^I/, '').split(';')[0]
  }
  return nodeId
})

const figmaUrl = computed(() => {
  if (!props.fileKey || !props.issue.nodeId) return ''
  const url = new URL(`https://www.figma.com/design/${props.fileKey}/${props.fileName.replace(/\s+/g, '-')}`)
  url.searchParams.set('node-id', figmaNodeId.value)
  return url.toString()
})

function buildNativeUrl() {
  const url = new URL(`figma://file/${props.fileKey}/${props.fileName.replace(/\s+/g, '-')}`)
  url.searchParams.set('node-id', figmaNodeId.value)
  return url.toString()
}

let pendingFallback: ReturnType<typeof setTimeout> | null = null

function handleLinkClick(e: MouseEvent) {
  if (props.linkMode === 'web') return

  e.preventDefault()
  const native = buildNativeUrl()

  if (props.linkMode === 'desktop') {
    window.location.href = native
    return
  }

  // desktop-fallback: try native, fall back to web
  if (pendingFallback) clearTimeout(pendingFallback)

  let handled = false
  const markHandled = () => { handled = true }

  window.addEventListener('blur', markHandled, { once: true })
  document.addEventListener('visibilitychange', markHandled, { once: true })
  window.location.href = native

  pendingFallback = setTimeout(() => {
    pendingFallback = null
    window.removeEventListener('blur', markHandled)
    document.removeEventListener('visibilitychange', markHandled)
    if (!handled) {
      window.open(figmaUrl.value, '_blank')
    }
  }, 1500)
}
</script>

<template>
  <details class="border-b border-(--color-border) transition-colors duration-150 open:bg-(--color-surface-raised) hover:bg-(--color-surface-raised)">
    <summary class="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
      <span class="min-w-7 font-mono text-[10px] text-(--color-text-muted)">
        #{{ index + 1 }}
      </span>
      <SeverityBadge :severity="issue.severity" />
      <TypeBadge :type="issue.type" />
      <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--color-text)">
        {{ issue.message }}
      </span>
      <ChevronRight class="chevron ml-auto size-4 shrink-0 text-(--color-text-muted)" aria-hidden="true" />
    </summary>
    <div class="px-4 pb-3 pl-13">
      <div class="mb-1.5 break-all font-mono text-xs text-(--color-text-muted)">
        <span class="opacity-50">Path:</span>
        <template v-if="figmaUrl && manualPath">
          <a
            :href="figmaUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-(--color-accent) hover:underline"
            @click="handleLinkClick"
          >{{ issue.linkedPath }}</a><span class="opacity-50">{{ manualPath }}</span>
        </template>
        <a
          v-else-if="figmaUrl"
          :href="figmaUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-(--color-accent) hover:underline"
          @click="handleLinkClick"
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
          @click="handleLinkClick"
        >
          {{ issue.nodeId }}
        </a>
        <span v-else>{{ issue.nodeId }}</span>
        <span v-if="isInstanceChild" class="ml-1 opacity-60">(links to parent instance)</span>
      </div>
    </div>
  </details>
</template>
