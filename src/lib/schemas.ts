import { z } from 'zod'

// ─── Figma API Zod Schemas ────────────────────────────────

const figmaColorSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
  a: z.number(),
})

const figmaFillSchema = z.object({
  type: z.string(),
  visible: z.boolean().optional(),
  color: figmaColorSchema.optional(),
}).passthrough()

export type FigmaNode = {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  style?: {
    fontSize?: number
    fontFamily?: string
    fontWeight?: number
    lineHeightPx?: number
    letterSpacing?: number
    textCase?: string
    textDecoration?: string
    paragraphSpacing?: number
    textAlignHorizontal?: string
  }
  styles?: Record<string, string>
  layoutMode?: string
  itemSpacing?: number
  counterAxisSpacing?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  fills?: Array<{ type: string; visible?: boolean; color?: { r: number; g: number; b: number; a: number } }>
  strokes?: Array<{ type: string; visible?: boolean; color?: { r: number; g: number; b: number; a: number } }>
  strokeWeight?: number
  cornerRadius?: number
  topLeftRadius?: number
  topRightRadius?: number
  bottomLeftRadius?: number
  bottomRightRadius?: number
  layoutSizingHorizontal?: string
  layoutSizingVertical?: string
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

const figmaNodeSchema: z.ZodType<FigmaNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    children: z.array(figmaNodeSchema).optional(),
    style: z.object({
      fontSize: z.number().optional(),
      fontFamily: z.string().optional(),
      fontWeight: z.number().optional(),
      lineHeightPx: z.number().optional(),
      letterSpacing: z.number().optional(),
      textCase: z.string().optional(),
      textDecoration: z.string().optional(),
      paragraphSpacing: z.number().optional(),
      textAlignHorizontal: z.string().optional(),
    }).optional(),
    styles: z.record(z.string(), z.string()).optional(),
    layoutMode: z.string().optional(),
    itemSpacing: z.number().optional(),
    counterAxisSpacing: z.number().optional(),
    paddingTop: z.number().optional(),
    paddingRight: z.number().optional(),
    paddingBottom: z.number().optional(),
    paddingLeft: z.number().optional(),
    fills: z.array(figmaFillSchema).optional(),
    strokes: z.array(figmaFillSchema).optional(),
    strokeWeight: z.number().optional(),
    cornerRadius: z.number().optional(),
    topLeftRadius: z.number().optional(),
    topRightRadius: z.number().optional(),
    bottomLeftRadius: z.number().optional(),
    bottomRightRadius: z.number().optional(),
    layoutSizingHorizontal: z.string().optional(),
    layoutSizingVertical: z.string().optional(),
    minWidth: z.number().optional(),
    maxWidth: z.number().optional(),
    minHeight: z.number().optional(),
    maxHeight: z.number().optional(),
  }).passthrough(),
)

const figmaStyleMetaSchema = z.object({
  key: z.string(),
  name: z.string(),
  styleType: z.enum(['FILL', 'TEXT', 'EFFECT', 'GRID']),
  description: z.string().optional(),
}).passthrough()

export type FigmaStyleMeta = z.infer<typeof figmaStyleMetaSchema>

export const FRAME_TYPES = new Set(['FRAME', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET', 'SECTION'])

export const figmaFileResponseSchema = z.object({
  name: z.string(),
  document: z.object({
    children: z.array(figmaNodeSchema),
  }).passthrough(),
  styles: z.record(z.string(), figmaStyleMetaSchema).optional(),
}).passthrough()

export const figmaStylesResponseSchema = z.object({
  meta: z.object({
    styles: z.array(z.unknown()),
  }).passthrough(),
}).passthrough()

export type FigmaFileResponse = z.infer<typeof figmaFileResponseSchema>
export type FigmaStylesResponse = z.infer<typeof figmaStylesResponseSchema>
