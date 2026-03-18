<script setup lang="ts">
import { useHealthCheck } from './composables/useHealthCheck'
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
  configOpen,
  fileKey,
  tokens,
  filteredIssues,
  errorCount,
  warningCount,
  infoCount,
  score,
  scoreColor,
  runCheck,
} = useHealthCheck()

const canRun = () => !loading.value && token.value && fileUrl.value

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && canRun()) runCheck()
}
</script>

<template>
  <div class="mx-auto max-w-[860px] px-5 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="mb-1.5 flex items-center gap-2.5">
        <span class="text-[26px]" style="line-height: 1">&#x2B21;</span>
        <h1 class="text-[22px] font-extrabold" style="letter-spacing: -0.03em">
          Figma Design Health Check
        </h1>
      </div>
      <p class="text-[13px] leading-normal text-(--color-text-muted)">
        Checks that your Figma file consistently uses its defined design system — styles, spacing tokens &amp; auto-layout.
      </p>
    </div>

    <!-- Input -->
    <div class="mb-5 rounded-xl border border-(--color-border-strong) bg-(--color-surface-raised) p-5">
      <div class="flex flex-col gap-3">
        <!-- Token input -->
        <div>
          <label class="mb-1.5 block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
            Figma Personal Access Token
          </label>
          <input
            v-model="token"
            type="password"
            placeholder="figd_xxxxxxxxxxxxxxxxxxxx"
            class="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 font-mono text-[13px] text-(--color-text) outline-none"
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
          </div>
        </div>

        <!-- File URL input -->
        <div>
          <label class="mb-1.5 block text-[11px] font-bold uppercase text-(--color-text-muted)" style="letter-spacing: 0.06em">
            Figma File URL or Key
          </label>
          <input
            v-model="fileUrl"
            type="text"
            placeholder="https://www.figma.com/design/aBcDeFg..."
            class="w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2.5 font-mono text-[13px] text-(--color-text) outline-none"
            @keydown="onKeyDown"
          />
          <p class="mt-1.5 text-[11px] text-(--color-text-muted)">
            Open any Figma file and copy the URL from your browser address bar.
          </p>
        </div>

        <!-- Config panel -->
        <ConfigPanel
          v-model:config-open="configOpen"
          v-model:spacing-input="spacingInput"
        />

        <!-- Run button -->
        <button
          :disabled="!canRun()"
          class="rounded-lg border-none px-6 py-3 text-[13px] font-bold transition-all duration-200"
          :class="canRun()
            ? 'cursor-pointer bg-(--color-accent) text-white hover:bg-(--color-accent-hover)'
            : 'cursor-not-allowed bg-(--color-border) text-(--color-text-muted)'"
          style="letter-spacing: 0.01em"
          @click="runCheck"
        >
          {{ loading ? (progress || 'Running\u2026') : 'Run Health Check' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-5 rounded-lg border border-[rgba(255,59,48,0.3)] bg-[rgba(255,59,48,0.12)] px-[18px] py-3.5 font-mono text-[13px] text-[#FF6961]"
    >
      {{ error }}
    </div>

    <!-- Results -->
    <ResultsPanel
      v-if="result && score !== null"
      :result="result"
      :score="score"
      :score-color="scoreColor"
      :error-count="errorCount"
      :warning-count="warningCount"
      :info-count="infoCount"
      :filtered-issues="filteredIssues"
      :file-key="fileKey"
      v-model:type-filter="typeFilter"
      v-model:severity-filter="severityFilter"
    />

    <!-- Extracted Tokens -->
    <TokensPanel v-if="tokens" :tokens="tokens" />

    <!-- Empty state -->
    <div v-if="!result && !error && !loading" class="px-5 py-12 text-center text-(--color-text-muted)">
      <div class="mb-3 text-[32px] opacity-40">&#x2B21;</div>
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
  </div>
</template>
