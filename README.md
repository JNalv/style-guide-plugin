# Figma Design Review Plugin with Claude AI

A Figma plugin that enables designers to select frames and receive AI-powered feedback on style guide compliance. The plugin sends design screenshots to a backend service (hosted on Railway) which calls Anthropic's Claude API to analyze designs against a corpus of style guidance documents.

## Project Overview

### Core User Flow

1. Designer selects one or more frames in Figma (named sequentially, e.g., `step-1`, `step-2`, `step-3`)
2. Designer activates the plugin
3. Plugin exports frames as PNG images and extracts design metadata
4. Plugin UI sends data to Railway backend
5. Backend loads style guide corpus, calls Claude API with images + context
6. Claude analyzes designs against style guidelines
7. Feedback is displayed in the plugin UI
8. (Future) "Improve" buttons allow navigation to problematic elements or automated fixes

## Project Structure

```
figma-design-reviewer/
├── plugin/                          # Figma plugin
│   ├── manifest.json                # Plugin configuration
│   ├── src/
│   │   ├── code.ts                 # Main thread (Figma API access)
│   │   ├── ui.tsx                  # UI iframe (React + fetch)
│   │   ├── ui.html                 # HTML entry point
│   │   └── ui.css                  # Styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                         # Railway backend service
│   ├── src/
│   │   ├── server.ts               # Express server entry point
│   │   ├── routes/
│   │   │   └── analyze.ts          # POST /api/analyze endpoint
│   │   ├── services/
│   │   │   ├── anthropic.ts       # Claude API integration
│   │   │   └── styleGuide.ts       # Load and concatenate corpus
│   │   └── types/
│   │       └── index.ts            # Shared TypeScript types
│   ├── corpus/                     # Style guide documents
│   │   ├── typography.md
│   │   ├── colors.md
│   │   ├── spacing.md
│   │   └── components.md
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md
```

## Initial Setup

### 1. Create Railway Project and Connect to GitHub

1. Go to [Railway](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `style-guide-plugin` repository
4. Railway will automatically detect the backend and set up deployment
5. Set the root directory to `backend` in the service settings

**Note**: Railway will automatically deploy whenever you push to the `main` branch on GitHub.

### 2. Set Environment Variables in Railway

- Go to your Railway project dashboard
- Select your service → Variables tab
- Add: `ANTHROPIC_API_KEY` = your Anthropic API key
- Railway will automatically redeploy with the new variable

### 3. Get Railway Domain

- Settings → Networking → Generate Domain
- Copy the `*.up.railway.app` URL

### 4. Create Figma Plugin

- Open Figma Desktop → Plugins → Development → New Plugin
- Choose "With UI"
- This generates your plugin ID in manifest.json

### 5. Update Plugin Configuration

- Update `plugin/manifest.json` with your Railway domain in `networkAccess.allowedDomains`
- Update `plugin/src/ui.tsx` with your Railway URL (replace `your-app.up.railway.app`)

## Local Development

### Terminal 1 - Backend:

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
# Runs on http://localhost:3001
```

### Terminal 2 - Plugin:

```bash
cd plugin
npm install
npm run dev
# Watches and rebuilds on changes
```

### Figma:

- Plugins → Development → Import plugin from manifest
- Select your plugin's `manifest.json`
- Run plugin: Plugins → Development → Design Style Checker

## Testing

1. Create a test Figma file with intentional style violations
2. Select frames and run the plugin
3. Verify feedback accuracy against your style guide
4. Iterate on prompts in `backend/src/services/anthropic.ts` for better results

## Deployment

### Backend (Railway):

Railway automatically deploys when you push changes to GitHub:

```bash
git add .
git commit -m "Update backend with new features"
git push origin main
```

Railway will:
1. Detect the push to the `main` branch
2. Automatically build and deploy the backend
3. Show deployment logs in the Railway dashboard
4. Make the new version live at your Railway domain

**No manual deployment steps needed** - just push to GitHub!

### Plugin (Local Development):

- No deployment or submission needed — Figma allows home-made plugins for local use
- Load the plugin locally via manifest import in Figma Desktop
- Developers can share the `plugin/` folder with teammates for manual installation

## Cost Estimates

### Anthropic API

| Usage | Calculation | Monthly Cost |
|-------|-------------|--------------|
| 100 frames analyzed | 100 × ~2,000 input tokens × $3/MTok | ~$0.60 |
| Image tokens | 100 × ~1,500 tokens × $3/MTok | ~$0.45 |
| Output tokens | 100 × ~1,000 tokens × $15/MTok | ~$1.50 |
| **Total** | | **~$2.55/month** |

### Railway

- Hobby plan: $5/month base
- Usage for this service: ~$0.50-2/month additional
- **Total: ~$5.50-7/month**

## Troubleshooting

### "Network request failed" in plugin:
- Check that Railway domain is in `manifest.json` `allowedDomains`
- Verify backend is running (`/health` endpoint)
- Check browser console for CORS errors

### "Failed to parse analysis response":
- Claude sometimes returns markdown-wrapped JSON
- Code already handles this with cleanup: `text.replace(/```json\n?|\n?```/g, '')`
- Check Anthropic API rate limits

### Frames not exporting:
- Ensure frames are visible (not hidden)
- Check for extremely large frames (>4096px)
- Try reducing export scale

### Plugin not appearing in Figma:
- Must use Figma Desktop app (not browser)
- Re-import manifest after changes
- Check for TypeScript/build errors

## Future Enhancements

### Phase 2: "Improve" Button Functionality
- Parse Claude's recommendations into actionable fixes
- Implement `figma.loadFontAsync()` + property updates for typography fixes
- Add confirmation dialog before modifying documents

### Phase 3: Sequential Flow Analysis
- Detect frames named with patterns like `step-1`, `step-2`
- Analyze user flow continuity (consistency between screens)
- Check transition patterns and progressive disclosure

### Phase 4: Private Organization Plugin
- If leadership approves, publish privately to Figma Organization
- No review required for private plugins
- Automatically available to all org members

## Reference Links

- [Figma Plugin API Reference](https://www.figma.com/plugin-docs/api/api-reference/)
- [Figma Plugin Manifest](https://www.figma.com/plugin-docs/manifest/)
- [Anthropic Vision Documentation](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [Railway Express Deployment](https://docs.railway.com/guides/express)
