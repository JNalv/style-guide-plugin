# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Figma plugin that lets designers select frames and receive AI-powered style guide compliance feedback. Two-part architecture: a **Figma plugin** (Preact/Vite) and an **Express backend** (deployed on Railway) that calls Claude's vision API to analyze exported frame screenshots against a markdown style guide corpus.

## Build & Dev Commands

### Backend (`backend/`)
```bash
npm run dev          # Start dev server with tsx watch (port 3001)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled server (dist/server.js)
```

### Plugin (`plugin/`)
```bash
npm run dev          # Vite watch mode (rebuilds on change)
npm run build        # Production build to dist/
npm run typecheck    # TypeScript check without emit
```

### Local Development Workflow
1. `cd backend && npm run dev` — starts API on localhost:3001
2. `cd plugin && npm run dev` — rebuilds plugin on file changes
3. In Figma Desktop: Import plugin via `plugin/manifest.json`, run from Development menu

### Environment
Backend requires `ANTHROPIC_API_KEY` in `backend/.env` (see `backend/.env.example`).

## Architecture

### Communication Flow
1. User selects frames in Figma → plugin main thread (`code.ts`) exports each as 2x PNG (max 4096px) + extracts metadata (text nodes, colors, dimensions)
2. Main thread sends `frames-ready` message with `FrameData[]` to UI iframe via `postMessage`
3. UI (`ui.tsx`) POSTs to backend `/api/analyze` with base64 images + metadata
4. Backend loads style guide corpus from `backend/corpus/*.md`, calls Claude vision API per frame
5. Returns `AnalysisResult[]` (score 0-100, categorized issues with severity, recommendations)
6. UI renders results; "Locate in Figma" sends `locate-node` message back to main thread

### Plugin Dual-Thread Model
- **`plugin/src/code.ts`** — Main thread with Figma API access. Handles frame export, metadata extraction, node selection. Cannot make network requests.
- **`plugin/src/ui.tsx`** — UI iframe (Preact). Handles HTTP requests to backend and result display. No direct Figma API access.
- Communication between threads is via `figma.ui.postMessage()` / `parent.postMessage()`.

### Backend Services
- **`routes/analyze.ts`** — POST `/api/analyze`, validates 1-10 frames, orchestrates analysis
- **`services/anthropic.ts`** — Builds system/user prompts, sends base64 PNG to Claude vision API (`claude-sonnet-4-5-20250514`), parses structured JSON response
- **`services/styleGuide.ts`** — Reads and concatenates all `.md`/`.txt` files from `backend/corpus/` with 1-minute TTL cache
- **`types/index.ts`** — Shared type definitions (`FrameData`, `AnalysisResult`, `DesignIssue`, etc.)

### Style Guide Corpus
Markdown files in `backend/corpus/` are concatenated and sent as context to Claude. Add/edit files there to change what the AI reviews against. Changes take effect within 1 minute (cache TTL).

## Key Technical Details

- Plugin UI is bundled into a single HTML file via `vite-plugin-singlefile`
- Backend CORS is set to `origin: '*'` (required for Figma iframe requests)
- JSON body limit is 50MB to accommodate base64 images
- `BACKEND_URL` in `ui.tsx` switches between localhost:3001 (dev) and Railway URL (prod) via `import.meta.env.DEV`
- Plugin network access domains must be configured in `plugin/manifest.json` (`networkAccess.allowedDomains` for prod, `devAllowedDomains` for dev)
- Backend health check: `GET /health`
- Frames are analyzed sequentially (not in parallel) by the Claude API
- Issue severity levels: high (brand-breaking), medium (noticeable deviation), low (polish)
- Issue categories: typography, color, spacing, component, hierarchy

## Deployment

Railway auto-deploys the backend from GitHub pushes to `main`. The plugin itself is loaded locally in Figma Desktop from the built `plugin/dist/` files.
