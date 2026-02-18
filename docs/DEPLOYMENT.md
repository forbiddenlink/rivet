# Deploying RIVET Dashboard to Vercel

## Quick Start

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

## Environment Variables

The dashboard uses OpenAI for AI-powered explanations. Set this in Vercel:

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get from https://platform.openai.com/api-keys)
   - **Environment**: Production, Preview, Development

The dashboard will work without the API key, but AI explanations will use mock fallbacks.

## Configuration

The deployment is configured via [`vercel.json`](../vercel.json):

```json
{
  "buildCommand": "pnpm build --filter=@rivet/web",
  "devCommand": "pnpm dev --filter=@rivet/web",
  "installCommand": "pnpm install",
  "framework": null,
  "outputDirectory": "apps/web/.next"
}
```

## Vercel Project Settings

- **Root Directory**: Leave as root (monorepo setup)
- **Framework Preset**: None (uses custom build command)
- **Build Command**: Automatically uses `vercel.json` config
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

## Monorepo Considerations

RIVET uses **Turborepo** with pnpm workspaces. The build process:

1. Vercel runs `pnpm install` (installs all workspace dependencies)
2. Turbo builds dependencies first (parsers → core → engines)
3. Finally builds `@rivet/web` with all dependencies available

The `--filter=@rivet/web` flag ensures Turborepo only builds the web package and its dependencies.

## Testing Locally

Before deploying, test the production build:

```bash
# Build
pnpm build --filter=@rivet/web

# Preview production build
cd apps/web
pnpm start
```

Open http://localhost:3000

## Deployment Commands

```bash
# Production deployment
vercel --prod

# Preview deployment (for testing)
vercel

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

## Troubleshooting

### Build Fails with "Cannot find module"

**Cause**: Turborepo dependencies not built in correct order  
**Fix**: Ensure `turbo.json` has proper dependency chains

### API Routes Return 404

**Cause**: Next.js not configured for API routes  
**Fix**: Verify `output: 'export'` is commented out in `next.config.js`

### Large Bundle Size Warning

**Cause**: All 7 analysis engines included in bundle  
**Fix**: Expected behavior - engines use dynamic imports to reduce initial load

### Environment Variable Not Working

**Cause**: Variable not set in Vercel project settings  
**Fix**: Add `OPENAI_API_KEY` in Vercel dashboard → Settings → Environment Variables

## Post-Deployment Testing

After deployment, verify:

1. ✅ Dashboard loads at your Vercel URL
2. ✅ File upload works
3. ✅ Code analysis returns results (try the example code)
4. ✅ Configuration modal opens
5. ✅ Export buttons appear after analysis
6. ✅ JSON/HTML downloads work
7. ✅ AI explanations appear (if API key configured)

## Example Test Code

Paste this to verify all engines work:

```typescript
// Security issue
const apiKey = "sk-1234567890abcdef";

// Performance issue
function slowLoop() {
  for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < 1000; j++) {
      console.log(i * j);
    }
  }
}

// Code smell
function godObject() {
  // Long method with many responsibilities
  const data = fetchData();
  const processed = processData(data);
  const validated = validateData(processed);
  const saved = saveData(validated);
  const notified = notifyUsers(saved);
  return notified;
}
```

Expected results:
- 🔴 1 critical security issue (hardcoded API key)
- 🟠 1 high performance issue (O(n²) complexity)
- 🟡 Multiple code smells

## Production URL

After deployment, your dashboard will be available at:
- Production: `https://rivet-[your-project].vercel.app`
- Custom domain: Configure in Vercel settings

Share the URL for demos and testing!
