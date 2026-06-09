# Chomptron

[![watchtron](https://img.shields.io/endpoint?url=https%3A%2F%2Fwatch.swantron.com%2Fbadge%2Fchomptron)](https://watch.swantron.com/)

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

### Environment Variables

- **`GEMINI_API_KEY`** (required) - Your Google Gemini API key
- **`GEMINI_MODEL`** (optional) - Model to use, defaults to `gemini-2.5-flash-lite`
- **`PORT`** (optional) - Server port, defaults to 8080

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

- **Modular File Structure**: Verification of external `styles.css` and `app.js` linking
- **CI/CD & DevOps**: Docker and Cloud Build configurations
- **API Integrity**: Health check endpoints (`/health`, `/ready`) and recipe generation
- **Feature Robustness**: Recipe history, scaling logic, and favorites (70+ comprehensive tests)

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
  - **Request Body:**
    ```json
    {
      "ingredients": "chicken, tomatoes, garlic",
      "dietaryPreferences": {
        "vegan": false,
        "vegetarian": false,
        "glutenFree": false,
        "dairyFree": false,
        "nutFree": false,
        "shellfishFree": false,
        "eggFree": false,
        "soyFree": false
      }
    }
    ```
  - **Response:**
    ```json
    {
      "success": true,
      "recipe": "**Recipe Name:** ...",
      "cached": false
    }
    ```

## Architecture

Chomptron is built as a **serverless application** on Google Cloud Run for cost efficiency and automatic scaling.

**Tech Stack:**

- **Backend:** Node.js 22 + Express
- **AI:** Google Gemini (configurable model, defaults to gemini-2.5-flash-lite)
- **Frontend:** Modular Vanilla HTML/CSS/JavaScript (Clean separation of concerns)
- **Storage:** Browser localStorage for recipe history
- **Platform:** Google Cloud Run (serverless)
- **CI/CD:** Cloud Build
- **Domain:** chomptron.com

**Why Serverless?**

- **Scales to zero** when idle → $0 cost (vs. $5-50/month traditional hosting)
- **Auto-scales** from 0 to 1000+ instances based on traffic
- **Zero maintenance** - no servers to manage, patch, or configure
- **Perfect for AI workloads** - handles burst traffic and CPU-intensive recipe generation efficiently

**Performance Optimizations:**

- **In-Memory Caching**: Per-instance recipe cache (24-hour TTL, max 100 recipes)
- **Structured Recipe Parsing**: Extracts recipe components for better display and scaling
- **Client-Side Rate Limiting**: Prevents excessive API calls
- **Smart Retry Logic**: Handles quota errors gracefully with exponential backoff

## Usage Guide

### Generating Recipes

1. Enter your ingredients in the text area
2. (Optional) Select dietary preferences/allergies
3. Click "Generate Recipe ✨"
4. View your structured recipe with:
   - Recipe name and metadata
   - Scaled ingredients list
   - Step-by-step instructions
   - Cooking tips

### Recipe Features

- **Scale Servings**: Use +/- buttons to adjust serving size (0.25x to 4x)
- **Rate Recipes**: Click stars to rate recipes (1-5 stars)
- **Add Notes**: Type personal notes in the notes field
- **Favorite**: Click the star button to favorite recipes
- **Print**: Click print button for print-friendly view
- **Share**: Click share button to generate shareable URL

### Recipe History

- Click the 📚 button (top-right) to open recipe history
- Search recipes by name, ingredients, or content
- Filter by favorites
- Export all recipes as JSON or text
- Click any recipe to reload it

### Dark Mode

- Click the 🌙 button (top-left) to toggle dark/light mode
- Preference is saved automatically

## Monitoring

Health checks:

```bash
curl https://chomptron.com/health
curl https://chomptron.com/ready
curl https://chomptron.com/api/usage  # View usage statistics
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

### Core Functionality
- ✨ AI-powered recipe generation using Google Gemini
- 🍳 Creative recipe names and instructions
- 📏 Precise measurements and serving sizes
- ⏱️ Cooking time estimates (prep, cook, total time)
- 🎨 **Modern Visual Polish**: Glassmorphism design with staggered entrance animations
- 🔠 **Premium Typography**: Outfit and Inter fonts for a contemporary feel
- ⚡ Serverless, auto-scaling infrastructure on Google Cloud Run

### Recipe Management
- 📚 Recipe history with localStorage persistence (up to 100 recipes)
- ⭐ Favorites system to mark and filter beloved recipes
- 🔍 Search and filter through saved recipes
- 💾 Export recipes to JSON or text format
- 📋 Quick access to past recipes via sidebar panel
- 📝 Add personal notes to each recipe
- ⭐ Rate recipes with 5-star rating system

### Recipe Customization
- 🥗 **Dietary Preferences & Allergies**: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Nut-Free, Shellfish-Free, Egg-Free, Soy-Free
- 📊 **Recipe Scaling**: Adjust serving sizes from 0.25x to 4x with automatic ingredient scaling
- 🖨️ **Print-Friendly View**: Clean print layout optimized for printing recipes
- 🔗 **Shareable URLs**: Generate shareable links for recipes (Web Share API support)

### Recipe Display
- 📋 **Structured Recipe Format**: Parsed display with organized sections:
  - Recipe name
  - Serving size and timing information
  - Ingredients list
  - Step-by-step instructions
  - Cooking tips
- 🎨 **Dark/Light Mode**: Toggle between themes with persistent preference

### Performance & Optimization
- 💾 **Recipe Caching**: In-memory cache reduces API calls for similar ingredient combinations
- 🔄 **Smart Retry Logic**: Automatic retry with exponential backoff for quota errors
- ⚡ **Rate Limiting**: Client-side rate limiting prevents excessive API calls

### Technical Features
- 🔍 Health monitoring and readiness checks
- 🔎 SEO optimized with meta tags, Open Graph, Twitter Cards, and structured data
- 📱 PWA support with manifest.json
- 🤖 robots.txt and sitemap.xml for search engine indexing

## Recipe Data Structure

Recipes are stored in browser localStorage with the following structure:

```json
{
  "id": "timestamp",
  "ingredients": "chicken, tomatoes, garlic",
  "recipe": "Full recipe text...",
  "recipeName": "Extracted recipe name",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "favorite": false,
  "rating": 0,
  "notes": "",
  "servingSize": 4,
  "dietaryPreferences": {
    "vegan": false,
    "vegetarian": false,
    "glutenFree": false,
    "dairyFree": false,
    "nutFree": false,
    "shellfishFree": false,
    "eggFree": false,
    "soyFree": false
  }
}
```

## Caching Strategy

The application uses in-memory caching on the server side:

- **Cache Key**: Normalized ingredients + dietary preferences
- **TTL**: 24 hours
- **Max Size**: 100 recipes per instance
- **Scope**: Per-instance (serverless instances are ephemeral)
- **Benefits**: Reduces API calls for similar requests hitting the same instance

## SEO Features

Optimized for search engines and social sharing with meta tags, Open Graph, Twitter Cards, structured data (JSON-LD), sitemap, robots.txt, and PWA support.

## Buildkite Pipeline

This repo includes a Buildkite pipeline at `.buildkite/pipeline.yml` that runs on a self-hosted GCP agent provisioned by [buildkite-gcp-agent](https://github.com/swantron/buildkite-gcp-agent).

### Pipeline structure

```
Push / PR
  └── Three steps dispatched in parallel:
        ├── :prettier: Format check   (npm run format -- --check)
        ├── :eslint:   Lint           (npm run lint)
        └── :nodejs:   Tests          (npm test)
  └── Annotate — consolidated pass/fail surfaced in the Buildkite UI
```

The key difference from the GitHub Actions workflow, which runs format → lint → test sequentially in a single job: these three steps have no dependencies on each other and run simultaneously. On a pool of agents this distributes the work; even on a single agent the explicit dependency graph documents intent and makes the pipeline trivially scalable.

The deploy stage is intentionally omitted — Cloud Run deployments are handled by the existing GHA workflow which holds the production GCP credentials. CI (fast feedback) and CD (production access) are kept in separate systems as a security boundary.

### Pipeline setup

Connect the repo via Buildkite → New Pipeline → point at `github.com/swantron/chomptron`. Buildkite reads `.buildkite/pipeline.yml` automatically on each push.

### Agent targeting

All steps run on the `gcp` queue:

```yaml
agents:
  queue: gcp
```

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT

