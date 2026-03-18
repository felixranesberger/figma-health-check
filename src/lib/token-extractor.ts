import { FRAME_TYPES } from './schemas'
import type { FigmaFileResponse, FigmaNode, FigmaStyleMeta } from './schemas'

// ─── Types ────────────────────────────────────────────────

export interface ExtractedColor {
  styleId: string
  styleName: string
  leafName: string
  cssVar: string
  r: number
  g: number
  b: number
  a: number
  hex: string
  hsl: string
}

export interface ExtractedTextStyle {
  styleId: string
  styleName: string
  cssVar: string
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeightRatio: number
  letterSpacingEm: number
  textCase: string
  textDecoration: string
  paragraphSpacing: number
  textAlignHorizontal: string
}

export interface ExtractedTokens {
  fileName: string
  colors: ExtractedColor[]
  textStyles: ExtractedTextStyle[]
  spacingValues: number[]
  fontFamilies: string[]
  fontWeights: number[]
  lineHeightRatios: number[]
  css: string
}

// ─── Helpers ──────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

function toKebab(name: string): string {
  return name
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function dedup(arr: number[]): number[] {
  return [...new Set(arr)].sort((a, b) => a - b)
}

function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round(n * f) / f
}

const TEXT_CASE_CSS: Record<string, string> = {
  UPPER: 'uppercase',
  LOWER: 'lowercase',
  TITLE: 'capitalize',
}

const TEXT_DECORATION_CSS: Record<string, string> = {
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'line-through',
}

const TEXT_ALIGN_CSS: Record<string, string> = {
  RIGHT: 'right',
  CENTER: 'center',
  JUSTIFIED: 'justify',
}

// ─── Node Walker ──────────────────────────────────────────

interface CollectedTextProps {
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeightPx: number
  letterSpacing: number
  textCase: string
  textDecoration: string
  paragraphSpacing: number
  textAlignHorizontal: string
}

interface CollectedData {
  colorsByStyleId: Map<string, { r: number; g: number; b: number; a: number }>
  textByStyleId: Map<string, CollectedTextProps>
  spacingValues: number[]
}

function collectStyleColor(
  styleId: string | undefined,
  paints: FigmaNode['fills'],
  map: Map<string, { r: number; g: number; b: number; a: number }>,
): void {
  if (!styleId || map.has(styleId)) return
  const solid = paints?.find(f => f.type === 'SOLID' && f.visible !== false && f.color)
  if (solid?.color) map.set(styleId, solid.color)
}

function walkNode(node: FigmaNode, data: CollectedData): void {
  // Collect color styles (fill + stroke)
  collectStyleColor(node.styles?.fill ?? node.styles?.fills, node.fills, data.colorsByStyleId)
  collectStyleColor(node.styles?.stroke, node.strokes, data.colorsByStyleId)

  // Collect text styles
  if (node.type === 'TEXT' && node.styles?.text && node.style) {
    const styleId = node.styles.text
    if (!data.textByStyleId.has(styleId) && node.style.fontSize) {
      data.textByStyleId.set(styleId, {
        fontFamily: node.style.fontFamily ?? '',
        fontWeight: node.style.fontWeight ?? 400,
        fontSize: node.style.fontSize,
        lineHeightPx: node.style.lineHeightPx ?? node.style.fontSize,
        letterSpacing: node.style.letterSpacing ?? 0,
        textCase: node.style.textCase ?? 'ORIGINAL',
        textDecoration: node.style.textDecoration ?? 'NONE',
        paragraphSpacing: node.style.paragraphSpacing ?? 0,
        textAlignHorizontal: node.style.textAlignHorizontal ?? 'LEFT',
      })
    }
  }

  // Collect spacing values from auto-layout frames
  if (FRAME_TYPES.has(node.type) && node.layoutMode && node.layoutMode !== 'NONE') {
    for (const v of [node.itemSpacing, node.counterAxisSpacing, node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]) {
      if (v !== undefined && v > 0) data.spacingValues.push(v)
    }
  }

  if (node.children) {
    for (const child of node.children) {
      walkNode(child, data)
    }
  }
}

// ─── CSS Generator ────────────────────────────────────────

function generateCSS(tokens: {
  fileName: string
  colors: ExtractedColor[]
  textStyles: ExtractedTextStyle[]
  fontFamilies: string[]
  fontWeights: number[]
  lineHeightRatios: number[]
  spacingValues: number[]
}): string {
  const { fileName, colors, textStyles, fontFamilies, fontWeights, lineHeightRatios, spacingValues } = tokens
  const lines: string[] = []
  const I = '  '

  lines.push(`/* ================================================`)
  lines.push(`   DESIGN TOKENS — extracted from "${fileName}"`)
  lines.push(`   ================================================ */`)
  lines.push('')

  // ── Primitive Size Tokens (font sizes + spacing values) ──
  const allSizes = dedup([
    ...textStyles.map(t => t.fontSize),
    ...spacingValues,
  ]).filter(v => v > 0)
  if (allSizes.length > 0) {
    lines.push(`/* ── Primitive Size Tokens ── */`)
    lines.push(`:root {`)
    lines.push(`${I}--size-base: 16;`)
    lines.push(`${I}--size-1: calc(1 / var(--size-base) * 1rem);`)
    for (const v of allSizes) {
      lines.push(`${I}--size-${v}: calc(${v} * var(--size-1));`)
    }
    lines.push(`}`)
    lines.push('')
  }

  // ── Color Tokens (grouped by first "/" segment) ──
  if (colors.length > 0) {
    lines.push(`/* ── Color Tokens ── */`)
    lines.push(`:root {`)
    let lastGroup = ''
    for (const c of colors) {
      const slashIdx = c.styleName.indexOf('/')
      const group = slashIdx > 0 ? c.styleName.substring(0, slashIdx) : ''
      if (group && group !== lastGroup) {
        if (lastGroup) lines.push('')
        lines.push(`${I}/* ${group} */`)
        lastGroup = group
      }
      lines.push(`${I}${c.cssVar}: ${c.hsl}; /* ${c.hex} */`)
    }
    lines.push(`}`)
    lines.push('')
  }

  // ── Typography ──
  if (textStyles.length > 0) {
    lines.push(`/* ── Typography Tokens ── */`)
    lines.push(`:root {`)

    if (fontFamilies.length > 0) {
      for (let i = 0; i < fontFamilies.length; i++) {
        const suffix = fontFamilies.length === 1 ? '' : `-${i + 1}`
        lines.push(`${I}--font-family${suffix}: '${fontFamilies[i]}', sans-serif;`)
      }
      lines.push('')
    }

    if (fontWeights.length > 0) {
      for (const w of fontWeights) {
        lines.push(`${I}--font-weight-${w}: ${w};`)
      }
      lines.push('')
    }

    if (lineHeightRatios.length > 0) {
      for (const r of lineHeightRatios) {
        lines.push(`${I}--font-leading-${String(r).replace('.', '_')}: ${r};`)
      }
      lines.push('')
    }

    for (const ts of textStyles) {
      const slug = ts.cssVar.replace('--font-', '')
      const sizeRef = allSizes.includes(ts.fontSize) ? `var(--size-${ts.fontSize})` : `${ts.fontSize}px`
      const leadingRef = `var(--font-leading-${String(ts.lineHeightRatio).replace('.', '_')})`
      const weightRef = `var(--font-weight-${ts.fontWeight})`
      const familyRef = fontFamilies.length <= 1 ? 'var(--font-family)' : `var(--font-family-${fontFamilies.indexOf(ts.fontFamily) + 1})`

      lines.push(`${I}/* ${ts.styleName} */`)
      lines.push(`${I}--font-${slug}-size: ${sizeRef};`)
      lines.push(`${I}--font-${slug}-lineheight: ${leadingRef};`)
      lines.push(`${I}--font-${slug}-weight: ${weightRef};`)
      if (Math.abs(ts.letterSpacingEm) > 0.001) {
        lines.push(`${I}--font-${slug}-letter-spacing: ${ts.letterSpacingEm}em;`)
      }
      if (ts.textCase in TEXT_CASE_CSS) {
        lines.push(`${I}--font-${slug}-text-transform: ${TEXT_CASE_CSS[ts.textCase]};`)
      }
      if (ts.textDecoration in TEXT_DECORATION_CSS) {
        lines.push(`${I}--font-${slug}-text-decoration: ${TEXT_DECORATION_CSS[ts.textDecoration]};`)
      }
      if (ts.paragraphSpacing > 0) {
        lines.push(`${I}--font-${slug}-paragraph-spacing: ${ts.paragraphSpacing}px;`)
      }
      if (ts.textAlignHorizontal in TEXT_ALIGN_CSS) {
        lines.push(`${I}--font-${slug}-text-align: ${TEXT_ALIGN_CSS[ts.textAlignHorizontal]};`)
      }
      lines.push(`${I}--font-${slug}: var(--font-${slug}-weight) var(--font-${slug}-size) / var(--font-${slug}-lineheight) ${familyRef};`)
      lines.push('')
    }

    lines.push(`}`)
    lines.push('')
  }

  // ── Spacing Tokens ──
  if (spacingValues.length > 0) {
    lines.push(`/* ── Spacing Tokens ── */`)
    lines.push(`:root {`)
    for (const v of spacingValues) {
      lines.push(`${I}--space-${v}: var(--size-${v});`)
    }
    lines.push(`}`)
  }

  return lines.join('\n')
}

// ─── Public API ───────────────────────────────────────────

export function extractTokens(fileData: FigmaFileResponse): ExtractedTokens {
  const styleMetas: Map<string, FigmaStyleMeta> = new Map()
  if (fileData.styles) {
    for (const [id, meta] of Object.entries(fileData.styles)) {
      styleMetas.set(id, meta)
    }
  }

  const data: CollectedData = {
    colorsByStyleId: new Map(),
    textByStyleId: new Map(),
    spacingValues: [],
  }

  if (fileData.document?.children) {
    for (const page of fileData.document.children) {
      walkNode(page, data)
    }
  }

  // Build extracted colors
  const colors: ExtractedColor[] = []
  for (const [styleId, rgba] of data.colorsByStyleId) {
    const meta = styleMetas.get(styleId)
    if (!meta || meta.styleType !== 'FILL') continue
    const slug = toKebab(meta.name)
    const hsl = rgbToHsl(rgba.r, rgba.g, rgba.b)
    const lastSlash = meta.name.lastIndexOf('/')
    colors.push({
      styleId,
      styleName: meta.name,
      leafName: lastSlash > 0 ? meta.name.substring(lastSlash + 1) : meta.name,
      cssVar: `--color-${slug}`,
      r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a,
      hex: rgbToHex(rgba.r, rgba.g, rgba.b),
      hsl: `hsl(${hsl.h}deg ${hsl.s}% ${hsl.l}%)`,
    })
  }
  colors.sort((a, b) => a.styleName.localeCompare(b.styleName))

  // Build extracted text styles
  const textStyles: ExtractedTextStyle[] = []
  for (const [styleId, props] of data.textByStyleId) {
    const meta = styleMetas.get(styleId)
    if (!meta || meta.styleType !== 'TEXT') continue
    const slug = toKebab(meta.name)
    const lhRatio = props.fontSize > 0 ? roundTo(props.lineHeightPx / props.fontSize, 2) : 1
    const lsEm = props.fontSize > 0 ? roundTo(props.letterSpacing / props.fontSize, 3) : 0
    textStyles.push({
      styleId,
      styleName: meta.name,
      cssVar: `--font-${slug}`,
      fontFamily: props.fontFamily,
      fontWeight: props.fontWeight,
      fontSize: props.fontSize,
      lineHeightRatio: lhRatio,
      letterSpacingEm: lsEm,
      textCase: props.textCase,
      textDecoration: props.textDecoration,
      paragraphSpacing: props.paragraphSpacing,
      textAlignHorizontal: props.textAlignHorizontal,
    })
  }
  textStyles.sort((a, b) => b.fontSize - a.fontSize)

  const spacingValues = dedup(data.spacingValues)
  const fontFamilies = [...new Set(textStyles.map(t => t.fontFamily))].sort()
  const fontWeights = dedup(textStyles.map(t => t.fontWeight))
  const lineHeightRatios = dedup(textStyles.map(t => t.lineHeightRatio))

  const css = generateCSS({
    fileName: fileData.name, colors, textStyles,
    fontFamilies, fontWeights, lineHeightRatios, spacingValues,
  })

  return {
    fileName: fileData.name,
    colors, textStyles, spacingValues,
    fontFamilies, fontWeights, lineHeightRatios,
    css,
  }
}
