import { figmaFileResponseSchema, figmaStylesResponseSchema } from './schemas'
import type { FigmaFileResponse, FigmaStylesResponse } from './schemas'

const BASE = 'https://api.figma.com'

export async function fetchFigmaFile(fileKey: string, token: string): Promise<FigmaFileResponse> {
  const res = await fetch(`${BASE}/v1/files/${fileKey}?geometry=paths`, {
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
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[1] : url.trim()
}
