<script setup lang="ts">
import { ref } from 'vue'
import { useHealthCheck } from './composables/useHealthCheck'
import type { LinkMode } from './composables/useHealthCheck'
import ConfigPanel from './components/ConfigPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import TokensPanel from './components/TokensPanel.vue'

const {
  token,
  fileUrl,
  loading,
  progress,
  result,
  error,
  typeFilter,
  severityFilter,
  spacingInput,
  saveToken,
  pages,
  selectedPageIds,
  togglePage,
  toggleAllPages,
  fetchPages,
  fileKey,
  linkMode,
  tokens,
  filteredIssues,
  errorCount,
  warningCount,
  infoCount,
  score,
  scoreColor,
  runCheck,
} = useHealthCheck()

const canFetch = () => !loading.value && token.value && fileUrl.value
const canRun = () => !loading.value && selectedPageIds.value.size > 0
const activeTab = ref<'issues' | 'tokens'>('issues')

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && canFetch()) fetchPages()
}

const hasResults = () => result.value && score.value !== null
</script>

<template>
  <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-(--color-accent) focus:px-4 focus:py-2 focus:text-white">
    Skip to main content
  </a>
  <main id="main-content" class="mx-auto max-w-[860px] px-5 py-8">
    <!-- Header -->
    <header class="mb-8">
      <div class="mb-1.5 flex items-center gap-2.5">
        <span class="text-[26px]" aria-hidden="true" style="line-height: 1">&#x2B21;</span>
        <h1 class="text-[22px] font-extrabold" style="letter-spacing: -0.03em">
          Figma Design Health Check
        </h1>
      </div>
      <p class="text-[13px] leading-normal text-(--color-text-muted)">
        Checks that your Figma file consistently uses its defined design system — styles, spacing tokens &amp; auto-layout.
      </p>
    </header>

    <!-- Input -->
    <section aria-label="Configuration" class="mb-5 rounded-xl border border-(--color-border-strong) bg-(--color-surface-raised) p-5">
      <div class="flex flex-col gap-3">
        <!-- Token input -->
        <div>
          <label for="figma-token" class="mb-1.5 block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
            Figma Personal Access Token
          </label>
          <input
            id="figma-token"
            v-model="token"
            type="password"
            name="token"
            autocomplete="off"
            placeholder="figd_xxxxxxxxxxxxxxxxxxxx"
            class="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 font-mono text-[13px] text-(--color-text) outline-none"
            @keydown="onKeyDown"
          />
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-(--color-text-muted)">
            <label class="flex cursor-pointer select-none items-center gap-1.5">
              <input
                v-model="saveToken"
                type="checkbox"
                class="accent-(--color-accent)"
              />
              Remember token in localStorage
            </label>
            <a
              href="https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              class="text-(--color-accent) hover:underline"
            >How to generate a token &nearr;</a>
            <span class="mx-1 opacity-30">|</span>
            <label class="inline-flex items-center gap-1.5">
              Open links in
              <select
                :value="linkMode"
                class="rounded border border-(--color-border) bg-(--color-surface) px-1.5 py-0.5 text-[11px] text-(--color-text)"
                @change="linkMode = ($event.target as HTMLSelectElement).value as LinkMode"
              >
                <option value="web">Browser</option>
                <option value="desktop">Desktop app</option>
                <option value="desktop-fallback">Desktop app, fallback to browser</option>
              </select>
            </label>
          </div>
        </div>

        <!-- File URL input -->
        <div>
          <label for="figma-file-url" class="mb-1.5 block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
            Figma File URL or Key
          </label>
          <input
            id="figma-file-url"
            v-model="fileUrl"
            type="url"
            name="fileUrl"
            autocomplete="url"
            aria-describedby="file-url-hint"
            placeholder="https://www.figma.com/design/aBcDeFg..."
            class="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 font-mono text-[13px] text-(--color-text) outline-none"
            @keydown="onKeyDown"
          />
          <p id="file-url-hint" class="mt-1.5 text-[11px] text-(--color-text-muted)">
            Open any Figma file and copy the URL from your browser address bar.
          </p>
        </div>

        <!-- Config panel -->
        <ConfigPanel
          v-model:spacing-input="spacingInput"
        />

        <!-- Fetch pages button -->
        <button
          v-if="pages.length === 0"
          :disabled="!canFetch()"
          class="rounded-lg border-none px-6 py-3 text-[13px] font-bold transition-all duration-200"
          :class="canFetch()
            ? 'cursor-pointer bg-(--color-accent) text-white hover:bg-(--color-accent-hover)'
            : 'cursor-not-allowed bg-(--color-border) text-(--color-text-muted)'"
          style="letter-spacing: 0.01em"
          @click="fetchPages"
        >
          {{ loading ? (progress || 'Fetching\u2026') : 'Fetch Pages' }}
        </button>
      </div>
    </section>

    <!-- Page selection -->
    <section v-if="pages.length > 0 && !hasResults()" aria-label="Page selection" class="mb-5 rounded-xl border border-(--color-border-strong) bg-(--color-surface-raised) p-5">
      <div class="mb-3 flex items-center justify-between">
        <label class="block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
          Select Pages to Analyze
        </label>
        <button
          class="cursor-pointer border-none bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
          @click="toggleAllPages"
        >
          {{ selectedPageIds.size === pages.length ? 'Deselect All' : 'Select All' }}
        </button>
      </div>
      <div class="flex flex-col gap-1.5">
        <label
          v-for="page in pages"
          :key="page.id"
          class="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150"
          :class="selectedPageIds.has(page.id) ? 'bg-(--color-surface)' : 'opacity-50'"
        >
          <input
            type="checkbox"
            :checked="selectedPageIds.has(page.id)"
            class="accent-(--color-accent)"
            @change="togglePage(page.id)"
          />
          {{ page.name }}
        </label>
      </div>
      <button
        :disabled="!canRun()"
        class="mt-4 w-full rounded-lg border-none px-6 py-3 text-[13px] font-bold transition-all duration-200"
        :class="canRun()
          ? 'cursor-pointer bg-(--color-accent) text-white hover:bg-(--color-accent-hover)'
          : 'cursor-not-allowed bg-(--color-border) text-(--color-text-muted)'"
        style="letter-spacing: 0.01em"
        @click="runCheck"
      >
        {{ loading ? (progress || 'Running\u2026') : `Run Health Check (${selectedPageIds.size} page${selectedPageIds.size === 1 ? '' : 's'})` }}
      </button>
    </section>

    <!-- Status announcements for screen readers -->
    <div aria-live="polite" class="sr-only">
      {{ loading ? (progress || 'Running health check\u2026') : '' }}
    </div>

    <!-- Error -->
    <div
      role="alert"
      class="mb-5 rounded-lg border border-[rgba(255,59,48,0.3)] bg-[rgba(255,59,48,0.12)] px-[18px] py-3.5 font-mono text-[13px] text-[#FF6961]"
      :class="{ hidden: !error }"
    >
      {{ error }}
    </div>

    <!-- Tabs -->
    <div v-if="hasResults() || tokens" role="tablist" aria-label="Results" class="mb-5 flex gap-1 border-b border-(--color-border)">
      <button
        id="tab-issues"
        role="tab"
        :aria-selected="activeTab === 'issues'"
        aria-controls="tabpanel-issues"
        class="cursor-pointer border-none bg-transparent px-4 py-2.5 text-[13px] font-semibold transition-colors duration-150"
        :class="activeTab === 'issues'
          ? 'border-b-2 border-(--color-accent) text-(--color-accent)'
          : 'text-(--color-text-muted) hover:text-(--color-text)'"
        :style="activeTab === 'issues' ? 'margin-bottom: -1px; border-bottom: 2px solid var(--color-accent)' : ''"
        @click="activeTab = 'issues'"
      >
        Issues
        <span v-if="result" class="ml-1 font-mono text-[11px]">({{ result.issues.length }})</span>
      </button>
      <button
        id="tab-tokens"
        role="tab"
        :aria-selected="activeTab === 'tokens'"
        aria-controls="tabpanel-tokens"
        class="cursor-pointer border-none bg-transparent px-4 py-2.5 text-[13px] font-semibold transition-colors duration-150"
        :class="activeTab === 'tokens'
          ? 'border-b-2 border-(--color-accent) text-(--color-accent)'
          : 'text-(--color-text-muted) hover:text-(--color-text)'"
        :style="activeTab === 'tokens' ? 'margin-bottom: -1px; border-bottom: 2px solid var(--color-accent)' : ''"
        @click="activeTab = 'tokens'"
      >
        Design Tokens
        <span v-if="tokens" class="ml-1 font-mono text-[11px]">({{ tokens.colors.length + tokens.textStyles.length }})</span>
      </button>
    </div>

    <!-- Issues tab -->
    <div v-if="hasResults() && activeTab === 'issues'" id="tabpanel-issues" role="tabpanel" aria-labelledby="tab-issues">
      <ResultsPanel
        :result="result!"
        :score="score!"
        :score-color="scoreColor"
        :error-count="errorCount"
        :warning-count="warningCount"
        :info-count="infoCount"
        :filtered-issues="filteredIssues"
        :file-key="fileKey"
        :link-mode="linkMode"
        v-model:type-filter="typeFilter"
        v-model:severity-filter="severityFilter"
      />
    </div>

    <!-- Tokens tab -->
    <div v-if="tokens && activeTab === 'tokens'" id="tabpanel-tokens" role="tabpanel" aria-labelledby="tab-tokens">
      <TokensPanel :tokens="tokens" />
    </div>

    <!-- Empty state -->
    <div v-if="!result && !error && !loading" class="px-5 py-12 text-center text-(--color-text-muted)">
      <div class="mb-3 text-[32px] opacity-40" aria-hidden="true">&#x2B21;</div>
      <p class="mb-4 text-[13px]" style="line-height: 1.6">
        Paste your Figma token and file URL to get started.
      </p>
      <div class="mx-auto inline-block max-w-[520px] text-left text-[11px]" style="line-height: 1.8">
        <strong class="text-(--color-text)">Health checks:</strong><br />
        <span class="text-(--color-error)">&#x25CF;</span> Every text node uses a defined typography style<br />
        <span class="text-(--color-error)">&#x25CF;</span> Auto-layout gaps use valid spacing tokens<br />
        <span class="text-(--color-warning)">&#x25CF;</span> Padding values match spacing scale<br />
        <span class="text-(--color-warning)">&#x25CF;</span> Fill colors use a defined color style<br />
        <span class="text-(--color-warning)">&#x25CF;</span> Components use responsive sizing (FILL/HUG, not FIXED)<br />
        <span class="text-(--color-warning)">&#x25CF;</span> FILL-sized elements have min/max constraints<br />
        <span class="text-(--color-info)">&#x25CF;</span> Frames with children use auto-layout<br />
        <span class="text-(--color-info)">&#x25CF;</span> Nesting depth does not exceed 8<br />
        <br />
        <strong class="text-(--color-text)">Token extraction:</strong><br />
        Colors and typography from defined Figma styles (named styles only, not raw values).<br />
        Spacing values from Auto-Layout frames (gap, padding) &mdash; Figma has no spacing styles, so these are the actual values set on frames with Auto-Layout enabled.
      </div>
    </div>
  </main>
</template>
