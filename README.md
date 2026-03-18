# Figma Design Health Check

Validates Figma files against your design system rules: typography presets, spacing tokens, auto-layout usage, and color styles.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## How it works

The Vite dev server proxies `/figma-api/*` → `https://api.figma.com/*`, so your Figma token never leaves your machine and there are no CORS issues.

### Getting a Figma Token

1. Go to **Figma → Settings → Personal Access Tokens**
2. Create a new token with **File content (Read-only)** scope
3. Paste it into the app

### Checks

| Severity | Check |
|----------|-------|
| Error    | Text node has no typography style applied |
| Error    | Auto-layout gap is not a valid spacing token |
| Warning  | Padding value is not a valid spacing token |
| Warning  | Font size outside any preset range |
| Warning  | Fill color has no color style |
| Warning  | Line-height ratio outside 1.1–2.0 |
| Info     | Frame with children but no auto-layout |

### Configurable

- **Spacing tokens**: Edit the comma-separated list under "Configure Rules" (default: 4/8px scale)
- **Typography presets**: Edit `src/analyzer.js` → `DEFAULT_TYPOGRAPHY_PRESETS`
- **Tolerance**: ±1px by default

## Build for production

```bash
npm run build
npm run preview
```

Note: The Figma API proxy only works in dev mode. For production, you'd need a small backend or serverless function to proxy the requests.
