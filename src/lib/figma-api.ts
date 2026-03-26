import { figmaFileResponseSchema, figmaStylesResponseSchema } from './schemas'
import type { FigmaFileResponse, FigmaStylesResponse } from './schemas'

const BASE = 'https://api.figma.com'

export async function fetchFigmaFile(fileKey: string, token: string, opts?: { depth?: number; ids?: string[] }): Promise<FigmaFileResponse> {
  const params = new URLSearchParams()
  if (opts?.depth === undefined) params.set('geometry', 'paths')
  if (opts?.depth !== undefined) params.set('depth', String(opts.depth))
  if (opts?.ids?.length) params.set('ids', opts.ids.join(','))
  const res = await fetch(`${BASE}/v1/files/${fileKey}?${params}`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Figma API ${res.status}: ${res.statusText}${body ? ` — ${body}` : ''}`)
  }
  const data = await res.json()
  return figmaFileResponseSchema.parse(data)
}

export async function fetchFigmaStyles(fileKey: string, token: string): Promise<FigmaStylesResponse> {
  const res = await fetch(`${BASE}/v1/files/${fileKey}/styles`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!res.ok) return { meta: { styles: [] } }
  const data = await res.json()
  return figmaStylesResponseSchema.parse(data)
}

export function extractFileKey(url: string): string {
  const clean = url.split('?')[0].split('#')[0]
  const match = clean.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[1] : clean.trim()
}
