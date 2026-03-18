import { ref, computed, watch } from 'vue'
import { fetchFigmaFile, fetchFigmaStyles, extractFileKey } from '../lib/figma-api'
import { analyzeFile, DEFAULT_SPACING_TOKENS, DEFAULT_SPACING_TOLERANCE } from '../lib/analyzer'
import type { AnalysisResult, IssueType, Severity } from '../lib/analyzer'
import { extractTokens } from '../lib/token-extractor'
import type { ExtractedTokens } from '../lib/token-extractor'

const STORAGE_KEY = 'figma-hc-token'
const FILE_URL_KEY = 'figma-hc-file-url'

export function useHealthCheck() {
  const token = ref((() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })())
  const fileUrl = ref((() => {
    try { return localStorage.getItem(FILE_URL_KEY) || '' } catch { return '' }
  })())
  const loading = ref(false)
  const progress = ref('')
  const result = ref<AnalysisResult | null>(null)
  const tokens = ref<ExtractedTokens | null>(null)
  const error = ref<string | null>(null)
  const typeFilter = ref<IssueType | 'all'>('all')
  const severityFilter = ref<Severity | 'all'>('all')
  const spacingInput = ref(DEFAULT_SPACING_TOKENS.join(', '))
  const saveToken = ref(!!localStorage.getItem(STORAGE_KEY))
  const fileKey = computed(() => {
    if (!fileUrl.value) return ''
    return extractFileKey(fileUrl.value)
  })

  watch([saveToken, token], () => {
    try {
      if (saveToken.value && token.value) localStorage.setItem(STORAGE_KEY, token.value)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  })

  watch(fileUrl, (url) => {
    try {
      if (url) localStorage.setItem(FILE_URL_KEY, url)
      else localStorage.removeItem(FILE_URL_KEY)
    } catch { /* ignore */ }
  })

  const filteredIssues = computed(() => {
    if (!result.value) return []
    return result.value.issues.filter(i => {
      if (typeFilter.value !== 'all' && i.type !== typeFilter.value) return false
      if (severityFilter.value !== 'all' && i.severity !== severityFilter.value) return false
      return true
    })
  })

  const issueCounts = computed(() => {
    const counts = { error: 0, warning: 0, info: 0 }
    if (result.value) {
      for (const i of result.value.issues) counts[i.severity]++
    }
    return counts
  })
  const errorCount = computed(() => issueCounts.value.error)
  const warningCount = computed(() => issueCounts.value.warning)
  const infoCount = computed(() => issueCounts.value.info)

  const score = computed(() => {
    if (!result.value) return null
    return Math.max(0, Math.round(100 - errorCount.value * 5 - warningCount.value * 2 - infoCount.value * 0.5))
  })

  const scoreColor = computed(() => {
    const s = score.value
    if (s === null) return ''
    if (s >= 80) return 'var(--color-success)'
    if (s >= 50) return 'var(--color-warning)'
    return 'var(--color-error)'
  })

  async function runCheck() {
    loading.value = true
    error.value = null
    result.value = null
    tokens.value = null
    try {
      const fileKey = extractFileKey(fileUrl.value)
      if (!fileKey) throw new Error('Invalid Figma file URL or key')

      progress.value = 'Fetching file from Figma API…'
      const [fileData, stylesData] = await Promise.all([
        fetchFigmaFile(fileKey, token.value),
        fetchFigmaStyles(fileKey, token.value),
      ])

      progress.value = 'Analyzing node tree…'
      await new Promise(r => setTimeout(r, 80))

      const spacingTokens = spacingInput.value
        .split(',')
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n))

      const analysis = analyzeFile(fileData, stylesData, {
        spacingTokens: spacingTokens.length > 0 ? spacingTokens : DEFAULT_SPACING_TOKENS,
        tolerance: DEFAULT_SPACING_TOLERANCE,
      })

      progress.value = 'Extracting design tokens…'
      await new Promise(r => setTimeout(r, 40))

      tokens.value = extractTokens(fileData)

      result.value = analysis
      progress.value = ''
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      progress.value = ''
    }
    loading.value = false
  }

  return {
    token,
    fileUrl,
    loading,
    progress,
    result,
    tokens,
    error,
    typeFilter,
    severityFilter,
    spacingInput,
    saveToken,
    fileKey,
    filteredIssues,
    errorCount,
    warningCount,
    infoCount,
    score,
    scoreColor,
    runCheck,
  }
}
