# Chomptron

AI-powered recipe generator that transforms ingredients into delicious recipes using Google Gemini AI. Deployed on Google Cloud Run at chomptron.com.

## What It Does

Enter ingredients you have in your kitchen, and Chomptron generates creative, practical recipes complete with measurements, instructions, cooking time, and serving sizes.

## Local Development

```bash
npm install
export GEMINI_API_KEY="your-api-key-here"
npm start
```

Visit http://localhost:8080

Get API key: https://makersuite.google.com/app/apikey

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

## Health Checks

- **`GET /health`** - Liveness check, returns service status
- **`GET /ready`** - Readiness check, verifies AI configuration
- **`POST /api/generate-recipe`** - Main recipe generation endpoint

## Deployment

See [TODO.md](TODO.md) for complete deployment checklist.

## Architecture

- **Backend:** Node.js 20 + Express  
- **AI:** Google Gemini 2.0 Flash (via `@google/generative-ai`)
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Container:** Docker  
- **Platform:** Cloud Run (fully managed, serverless)
- **CI/CD:** Cloud Build + GitHub Actions  
- **Registry:** Artifact Registry (us-central1)
- **Domain:** chomptron.com (AI recipe app)

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

## SEO Features

Chomptron includes comprehensive SEO features similar to tronswan.com:

- **Meta Tags:** Title, description, keywords, author
- **Open Graph:** Facebook and social media sharing optimization
- **Twitter Cards:** Enhanced Twitter sharing with images
- **Structured Data:** JSON-LD schema.org markup for search engines
- **PWA Support:** Web app manifest for mobile installation
- **Robots.txt:** Search engine crawler instructions
- **Sitemap.xml:** URL structure for search engine indexing
- **Canonical URLs:** Prevent duplicate content issues
- **Performance:** Preconnect hints and DNS prefetching

## License


MIT
