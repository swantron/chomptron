# Chomptron

AI-powered recipe generator that transforms ingredients into delicious recipes using Google Gemini AI. Deployed on Google Cloud Run at chomptron.com.

## What It Does

Enter ingredients you have in your kitchen, and Chomptron generates creative, practical recipes complete with measurements, instructions, cooking time, and serving sizes.

## Local Development

```bash
npm install
export GEMINI_API_KEY="your-api-key-here"
export GEMINI_MODEL="gemini-2.5-flash-lite"  # Optional, defaults to gemini-2.5-flash-lite
npm start
```

Visit http://localhost:8080

Get API key: https://makersuite.google.com/app/apikey

### Model Configuration

The Gemini model can be configured via the `GEMINI_MODEL` environment variable:

**Recommended Models (as of December 2025):**

- **`gemini-2.5-flash-lite`** (default) - **Best free tier limits**: 15 RPM, 1,000 RPD
- **`gemini-2.5-flash`** - 10 RPM, 250 RPD
- **`gemini-2.0-flash`** - 10 RPM, 200 RPD (⚠️ unstable quota, often shows `limit: 0`)
- **`gemini-1.5-flash`** - Legacy model, may have better limits than 2.0

**December 2025 Quota Shift:**

Google overhauled free tier quotas in December 2025:
- `gemini-2.0-flash` was removed from fully unauthenticated free tier
- Many accounts see `limit: 0` errors for newer models without billing enabled
- Free tier quotas don't automatically reset monthly

**Fixing "Limit: 0" Errors:**

If you're seeing quota errors with `limit: 0`:
1. **Switch to `gemini-2.5-flash-lite`** - Best free tier model currently available
2. **Enable billing (Pay-As-You-Go)** - Linking a credit card (even if you don't spend) moves you from "Limited Free" to "Tier 1" and unlocks promised free quotas
3. **Check your region** - EEA, UK, and Switzerland have restricted free tier access
4. **Monitor usage** - Visit `/api/usage` endpoint or https://ai.dev/usage

**Free Tier Limits (as of Dec 2025):**

| Model | Requests/Minute | Requests/Day | Best For |
|------|----------------|--------------|----------|
| **gemini-2.5-flash-lite** | **15** | **1,000** | **High-volume apps** |
| gemini-2.5-flash | 10 | 250 | General use |
| gemini-2.0-flash | 10 | 200 | Legacy (unstable) |
| gemini-2.5-pro | 2 | 50 | Complex reasoning |

## Testing

```bash
npm test
```

Tests validate:

- File structure and dependencies
- Docker and Cloud Build configurations
- Health check endpoints (`/health`, `/ready`)
- Recipe generation API
- Frontend functionality
- Recipe history and favorites features (40+ static tests)

### Browser-Based History Tests

For interactive testing of the Recipe History & Favorites feature:

```bash
npm start
# Visit http://localhost:8080/test-history.html
```

The browser test suite includes:
- localStorage persistence testing
- Recipe save/load operations
- Favorite toggle functionality
- Recipe name extraction
- 100-recipe limit validation
- Data structure validation
- Automatic backup/restore of existing data

## API Endpoints

- **`GET /health`** - Liveness check, returns service status
- **`GET /ready`** - Readiness check, verifies AI configuration and shows current model
- **`GET /api/usage`** - Usage statistics (total requests, quota errors, model info)
- **`POST /api/generate-recipe`** - Main recipe generation endpoint

## Architecture

Chomptron is built as a **serverless application** on Google Cloud Run for cost efficiency and automatic scaling.

**Tech Stack:**

- **Backend:** Node.js 20 + Express
- **AI:** Google Gemini (configurable model, defaults to gemini-1.5-flash)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Platform:** Google Cloud Run (serverless)
- **CI/CD:** Cloud Build
- **Domain:** chomptron.com

**Why Serverless?**

- **Scales to zero** when idle → $0 cost (vs. $5-50/month traditional hosting)
- **Auto-scales** from 0 to 1000+ instances based on traffic
- **Zero maintenance** - no servers to manage, patch, or configure
- **Perfect for AI workloads** - handles burst traffic and CPU-intensive recipe generation efficiently

## Monitoring

Health checks:

```bash
curl https://chomptron.com/health
curl https://chomptron.com/ready
```

View logs:

```bash
# Recent logs
gcloud run logs read chomptron --region us-central1 --limit 50

# Live stream
gcloud run logs tail chomptron --region us-central1
```

**Console dashboards:**

- [Cloud Run Service](https://console.cloud.google.com/run)
- [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)
- [Artifact Registry](https://console.cloud.google.com/artifacts)

## Features

- ✨ AI-powered recipe generation
- 🍳 Creative recipe names and instructions
- 📏 Precise measurements and serving sizes
- ⏱️ Cooking time estimates
- 🎨 Clean, responsive UI
- ⚡ Serverless, auto-scaling infrastructure
- 🔍 Health monitoring and readiness checks
- 🔎 SEO optimized with meta tags, Open Graph, Twitter Cards, and structured data
- 📱 PWA support with manifest.json
- 🤖 robots.txt and sitemap.xml for search engine indexing
- 📚 Recipe history with localStorage persistence
- ⭐ Favorites system to mark and filter beloved recipes
- 🔍 Search and filter through saved recipes
- 💾 Export recipes to JSON or text format
- 📋 Quick access to past recipes via sidebar panel

## SEO Features

Optimized for search engines and social sharing with meta tags, Open Graph, Twitter Cards, structured data (JSON-LD), sitemap, robots.txt, and PWA support.

## License

MIT
