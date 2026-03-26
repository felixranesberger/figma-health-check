<script setup lang="ts">
import type { AnalysisResult, Issue, IssueType, Severity } from '../lib/analyzer'
import type { LinkMode } from '../composables/useHealthCheck'
import StatCard from './StatCard.vue'
import IssueRow from './IssueRow.vue'

const props = defineProps<{
  result: AnalysisResult
  score: number
  scoreColor: string
  errorCount: number
  warningCount: number
  infoCount: number
  filteredIssues: Issue[]
  fileKey: string
  linkMode: LinkMode
  typeFilter: IssueType | 'all'
  severityFilter: Severity | 'all'
}>()

const emit = defineEmits<{
  'update:typeFilter': [value: IssueType | 'all']
  'update:severityFilter': [value: Severity | 'all']
}>()

const severityOptions: Array<Severity | 'all'> = ['all', 'error', 'warning', 'info']
const typeOptions: Array<IssueType | 'all'> = ['all', 'typography', 'spacing', 'layout', 'color', 'responsive']

function severityLabel(s: Severity | 'all') {
  if (s === 'all') return 'All'
  if (s === 'error') return `error (${props.errorCount})`
  if (s === 'warning') return `warning (${props.warningCount})`
  return `info (${props.infoCount})`
}
</script>

<template>
  <!-- Score + Stats -->
  <div class="mb-5 flex flex-wrap gap-4">
    <div class="min-w-[120px] rounded-xl border border-(--color-border-strong) bg-(--color-surface-raised) p-5 text-center">
      <div class="font-mono text-5xl font-extrabold leading-none" :style="{ color: scoreColor }">
        {{ score }}
      </div>
      <div class="mt-1 text-[11px] font-semibold uppercase text-(--color-text-muted)" style="letter-spacing: 0.08em">
        Health Score
      </div>
      <div class="mt-0.5 text-[11px] text-(--color-text-muted)">
        {{ result.fileName }}
      </div>
    </div>
    <div class="flex flex-1 flex-wrap gap-2.5">
      <StatCard label="Text Styled" :value="result.stats.styledTextNodes" :total="result.stats.totalTextNodes" color="var(--color-success)" />
      <StatCard label="Missing Style" :value="result.stats.unstyledTextNodes" :total="result.stats.totalTextNodes" color="var(--color-error)" />
      <StatCard label="Auto-Layout" :value="result.stats.autoLayoutFrames" :total="result.stats.totalFrames" color="var(--color-accent)" />
      <StatCard label="Unstyled Fills" :value="result.stats.unstyledFills" :total="0" color="var(--color-warning)" />
    </div>
  </div>

  <!-- Severity filters -->
  <div class="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by severity">
    <span class="text-[13px] font-bold">{{ result.issues.length }} issues</span>
    <span class="flex-1" />
    <button
      v-for="s in severityOptions"
      :key="s"
      :aria-pressed="severityFilter === s"
      class="cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-semibold capitalize"
      :class="severityFilter === s
        ? 'border-(--color-accent) bg-[rgba(10,132,255,0.15)] text-(--color-accent)'
        : 'border-(--color-border) bg-transparent text-(--color-text-muted)'"
      @click="emit('update:severityFilter', s)"
    >
      {{ severityLabel(s) }}
    </button>
  </div>

  <!-- Type filters -->
  <div class="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
    <button
      v-for="t in typeOptions"
      :key="t"
      :aria-pressed="typeFilter === t"
      class="cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-semibold capitalize"
      :class="typeFilter === t
        ? 'border-(--color-accent) bg-[rgba(10,132,255,0.15)] text-(--color-accent)'
        : 'border-(--color-border) bg-transparent text-(--color-text-muted)'"
      @click="emit('update:typeFilter', t)"
    >
      {{ t === 'all' ? 'All Types' : t }}
    </button>
  </div>

  <!-- Issues list -->
  <div class="overflow-hidden rounded-xl border border-(--color-border-strong) bg-(--color-surface)">
    <div v-if="filteredIssues.length === 0" class="px-5 py-10 text-center text-[13px] text-(--color-text-muted)">
      {{ result.issues.length === 0 ? '\u2713 No issues \u2014 clean file!' : 'No issues match current filters.' }}
    </div>
    <template v-else>
      <IssueRow
        v-for="(issue, i) in filteredIssues.slice(0, 200)"
        :key="`${issue.nodeId}-${i}`"
        :issue="issue"
        :index="i"
        :file-key="fileKey"
        :file-name="result.fileName"
        :link-mode="linkMode"
      />
    </template>
    <div
      v-if="filteredIssues.length > 200"
      class="border-t border-(--color-border) p-3 text-center text-xs text-(--color-text-muted)"
    >
      Showing 200 of {{ filteredIssues.length }}. Fix top errors first.
    </div>
  </div>
</template>
