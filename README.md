# Chomptron

AI-powered recipe generator that transforms ingredients into delicious recipes using Google Gemini AI. Deployed on Google Cloud Run at chomptron.com.

## What It Does

Enter ingredients you have in your kitchen, and Chomptron generates creative, practical recipes complete with measurements, instructions, cooking time, and serving sizes.

## Local Development

```bash
npm install
export GEMINI_API_KEY="your-api-key-here"
export GEMINI_MODEL="gemini-1.5-flash"  # Optional, defaults to gemini-1.5-flash
npm start
```

Visit http://localhost:8080

Get API key: https://makersuite.google.com/app/apikey

### Model Configuration

The Gemini model can be configured via the `GEMINI_MODEL` environment variable:

- **`gemini-1.5-flash`** (default, recommended) - Best free tier limits, fast and efficient
- **`gemini-1.5-flash-latest`** - Latest 1.5 flash model
- **`gemini-2.0-flash`** - Newer model but stricter free tier limits

**Free Tier Quota Issues?**

If you're hitting quota limits:
1. **Switch to `gemini-1.5-flash`** - It typically has better free tier limits than 2.0
2. **Check your usage** - Visit `/api/usage` endpoint or https://ai.dev/usage
3. **Enable billing** - Free tier quotas don't reset monthly; paid tier has higher limits
4. **Monitor usage** - The app tracks requests and quota errors in logs

**Quota Limits:**
- Free tier has daily and per-minute request limits
- Limits vary by model (1.5-flash usually has better limits)
- Quotas don't automatically reset - you may need to enable billing for higher limits

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
