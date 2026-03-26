import { FRAME_TYPES } from './schemas'
import type { FigmaNode, FigmaFileResponse, FigmaStylesResponse } from './schemas'

// ─── Types ────────────────────────────────────────────────

export type Severity = 'error' | 'warning' | 'info'
export type IssueType = 'typography' | 'spacing' | 'layout' | 'color' | 'responsive'

export interface Issue {
  type: IssueType
  severity: Severity
  node: string
  path: string
  linkedPath: string
  message: string
  detail: string
  nodeId: string
}

export interface AnalysisStats {
  totalTextNodes: number
  styledTextNodes: number
  unstyledTextNodes: number
  totalFrames: number
  autoLayoutFrames: number
  freeformFrames: number
  unstyledFills: number
  deepNestings: number
  fixedSizingIssues: number
  missingConstraints: number
}

export interface AnalysisConfig {
  spacingTokens: readonly number[]
  tolerance: number
}

export interface AnalysisResult {
  issues: Issue[]
  stats: AnalysisStats
  fileName: string
}

// ─── Helpers ──────────────────────────────────────────────

function isValidSpacing(value: number, tokens: readonly number[], tolerance: number): boolean {
  return tokens.some(s => Math.abs(value - s) <= tolerance)
}

function nearestToken(value: number, tokens: readonly number[]): number {
  return tokens.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a))
}

const MAX_NESTING_DEPTH = 8

// ─── Node Walker ──────────────────────────────────────────

function analyzeNode(
  node: FigmaNode,
  path: string,
  issues: Issue[],
  stats: AnalysisStats,
  config: AnalysisConfig,
  depth: number,
  linkedPath: string,
): void {
  const currentPath = path ? `${path} → ${node.name}` : node.name
  // Nodes with compound IDs (inside component instances) can't be deep-linked.
  // Track the last path segment that has a simple navigable ID.
  const currentLinkedPath = node.id.includes(';') ? linkedPath : currentPath
  const { spacingTokens, tolerance } = config

  // ── Nesting depth ──
  if (FRAME_TYPES.has(node.type) && depth > MAX_NESTING_DEPTH) {
    stats.deepNestings++
    issues.push({
      type: 'layout',
      severity: 'info',
      node: node.name,
      path: currentPath,
      message: `Nesting depth ${depth} exceeds ${MAX_NESTING_DEPTH}`,
      detail: 'Deep nesting creates complex CSS — consider flattening',
      nodeId: node.id,
      linkedPath: currentLinkedPath,
    })
  }

  // ── Text nodes: must use a defined text style ──
  if (node.type === 'TEXT') {
    stats.totalTextNodes++
    const fontSize = node.style?.fontSize
    const fontFamily = node.style?.fontFamily
    const fontWeight = node.style?.fontWeight

    if (!node.styles?.text) {
      stats.unstyledTextNodes++
      issues.push({
        type: 'typography',
        severity: 'error',
        node: node.name,
        path: currentPath,
        message: 'Text node has no typography style applied',
        detail: `Font: ${fontFamily || '?'} ${fontWeight || '?'}, Size: ${fontSize ?? '?'}px`,
        nodeId: node.id,
        linkedPath: currentLinkedPath,
      })
    } else {
      stats.styledTextNodes++
    }
  }

  // ── Frames / Components ──
  if (FRAME_TYPES.has(node.type)) {
    stats.totalFrames++

    // Auto-layout spacing checks
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      stats.autoLayoutFrames++

      const gap = node.itemSpacing ?? 0
      if (!isValidSpacing(gap, spacingTokens, tolerance)) {
        issues.push({
          type: 'spacing',
          severity: 'error',
          node: node.name,
          path: currentPath,
          message: `Auto-layout gap ${gap}px is not a valid spacing token`,
          detail: `Nearest valid: ${nearestToken(gap, spacingTokens)}px`,
          nodeId: node.id,
          linkedPath: currentLinkedPath,
        })
      }

      // Counter-axis spacing (wrap gap)
      if (node.counterAxisSpacing !== undefined && node.counterAxisSpacing > 0) {
        if (!isValidSpacing(node.counterAxisSpacing, spacingTokens, tolerance)) {
          issues.push({
            type: 'spacing',
            severity: 'error',
            node: node.name,
            path: currentPath,
            message: `Counter-axis spacing ${node.counterAxisSpacing}px is not a valid spacing token`,
            detail: `Nearest valid: ${nearestToken(node.counterAxisSpacing, spacingTokens)}px`,
            nodeId: node.id,
            linkedPath: currentLinkedPath,
          })
        }
      }

      const paddings: Array<{ label: string; value: number }> = [
        { label: 'top', value: node.paddingTop! },
        { label: 'right', value: node.paddingRight! },
        { label: 'bottom', value: node.paddingBottom! },
        { label: 'left', value: node.paddingLeft! },
      ].filter((p): p is { label: string; value: number } => p.value !== undefined && p.value !== null)

      for (const pad of paddings) {
        if (!isValidSpacing(pad.value, spacingTokens, tolerance)) {
          issues.push({
            type: 'spacing',
            severity: 'warning',
            node: node.name,
            path: currentPath,
            message: `Padding-${pad.label} ${pad.value}px is not a valid token`,
            detail: `Nearest valid: ${nearestToken(pad.value, spacingTokens)}px`,
            nodeId: node.id,
            linkedPath: currentLinkedPath,
          })
        }
      }

    } else if (node.children && node.children.length > 1) {
      stats.freeformFrames++
      issues.push({
        type: 'layout',
        severity: 'info',
        node: node.name,
        path: currentPath,
        message: `Frame has ${node.children.length} children without auto-layout`,
        detail: 'Consider using auto-layout for consistent spacing',
        nodeId: node.id,
        linkedPath: currentLinkedPath,
      })
    }

    // Responsive: top-level component/frame with fixed width
    if ((node.type === 'COMPONENT' || node.type === 'FRAME') && node.layoutSizingHorizontal === 'FIXED') {
      stats.fixedSizingIssues++
      issues.push({
        type: 'responsive',
        severity: 'warning',
        node: node.name,
        path: currentPath,
        message: 'Component uses fixed width instead of FILL or HUG',
        detail: 'layoutSizingHorizontal: FIXED — consider using FILL for responsive behavior',
        nodeId: node.id,
        linkedPath: currentLinkedPath,
      })
    }

    // Responsive: FILL without min/max constraints
    if (node.layoutSizingHorizontal === 'FILL' && node.minWidth === undefined && node.maxWidth === undefined) {
      stats.missingConstraints++
      issues.push({
        type: 'responsive',
        severity: 'warning',
        node: node.name,
        path: currentPath,
        message: 'FILL-sized element has no min/max width constraints',
        detail: 'Add minWidth/maxWidth to prevent element from stretching or shrinking too much',
        nodeId: node.id,
        linkedPath: currentLinkedPath,
      })
    }

    // Fill must use a defined color style or variable
    if (node.fills && node.fills.length > 0) {
      const hasFillStyle = node.styles?.fill || node.styles?.fills || node.boundVariables?.fills
      const solidFills = node.fills.filter(f =>
        f.type === 'SOLID' && f.visible !== false && (!f.color || f.color.a > 0)
        && !f.boundVariables?.color
      )

      if (!hasFillStyle && solidFills.length > 0) {
        stats.unstyledFills++
        issues.push({
          type: 'color',
          severity: 'warning',
          node: node.name,
          path: currentPath,
          message: 'Fill color has no color style applied',
          detail: 'Raw color value — use a design token instead',
          nodeId: node.id,
          linkedPath: currentLinkedPath,
        })
      }
    }
  }

  // ── Recurse ──
  if (node.children) {
    const nextDepth = FRAME_TYPES.has(node.type) ? depth + 1 : depth
    for (const child of node.children) {
      analyzeNode(child, currentPath, issues, stats, config, nextDepth, currentLinkedPath)
    }
  }
}

// ─── Public API ───────────────────────────────────────────

export const DEFAULT_SPACING_TOKENS = [
  0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 15, 16, 18, 20, 22, 24, 25,
  28, 30, 32, 35, 36, 40, 42, 45, 48, 50, 55, 56, 60, 64, 65,
  70, 72, 80, 96, 100, 120, 128, 144, 160,
] as const

export const DEFAULT_SPACING_TOLERANCE = 1

export function analyzeFile(
  fileData: FigmaFileResponse,
  _stylesData: FigmaStylesResponse,
  userConfig: Partial<AnalysisConfig> = {},
): AnalysisResult {
  const config: AnalysisConfig = {
    spacingTokens: userConfig.spacingTokens ?? DEFAULT_SPACING_TOKENS,
    tolerance: userConfig.tolerance ?? DEFAULT_SPACING_TOLERANCE,
  }

  const issues: Issue[] = []
  const stats: AnalysisStats = {
    totalTextNodes: 0,
    styledTextNodes: 0,
    unstyledTextNodes: 0,
    totalFrames: 0,
    autoLayoutFrames: 0,
    freeformFrames: 0,
    unstyledFills: 0,
    deepNestings: 0,
    fixedSizingIssues: 0,
    missingConstraints: 0,
  }

  if (fileData.document?.children) {
    for (const page of fileData.document.children) {
      // Only analyze nodes inside top-level frames (artboards).
      // Loose nodes at the page level (comments, test elements) are skipped.
      if (page.children) {
        for (const topLevel of page.children) {
          if (FRAME_TYPES.has(topLevel.type)) {
            analyzeNode(topLevel, page.name, issues, stats, config, 0, page.name)
          }
        }
      }
    }
  }

  return { issues, stats, fileName: fileData.name }
}
