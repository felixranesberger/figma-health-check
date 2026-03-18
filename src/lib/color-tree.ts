import type { ExtractedColor } from './token-extractor'

export interface ColorTreeNode {
  name: string
  colors: ExtractedColor[]
  children: Map<string, ColorTreeNode>
}

export interface FlatColorGroup {
  path: string[]
  colors: ExtractedColor[]
}

export function buildColorTree(colors: ExtractedColor[]): ColorTreeNode {
  const root: ColorTreeNode = { name: '', colors: [], children: new Map() }
  for (const c of colors) {
    const segments = c.styleName.split('/')
    let current = root
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]
      if (!current.children.has(seg)) {
        current.children.set(seg, { name: seg, colors: [], children: new Map() })
      }
      current = current.children.get(seg)!
    }
    current.colors.push(c)
  }
  return root
}

export function flattenTree(node: ColorTreeNode, path: string[] = []): FlatColorGroup[] {
  const groups: FlatColorGroup[] = []
  const currentPath = node.name ? [...path, node.name] : path

  if (node.colors.length > 0) {
    groups.push({ path: currentPath, colors: node.colors })
  }

  for (const child of node.children.values()) {
    groups.push(...flattenTree(child, currentPath))
  }

  return groups
}
