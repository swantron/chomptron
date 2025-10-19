# Chomptron - Recipe Rover

AI-powered recipe generator deployed on Google App Engine with automated CI/CD via GitHub Actions.

## Quick Start

### Local Development

```bash
npm install
export GEMINI_API_KEY="your-api-key-here"
npm start
# Visit http://localhost:8080
```

Get API key: https://makersuite.google.com/app/apikey

### Run Tests

```bash
npm test
```

## Deploy to Google App Engine with GitHub Actions

### One-Time Setup

#### 1. Create Google Cloud Project

```bash
gcloud projects create chomptron --name="Chomptron"
gcloud config set project chomptron
```

#### 2. Enable APIs

```bash
gcloud services enable appengine.googleapis.com
```

#### 3. Create App Engine Application

```bash
gcloud app create --region=us-central
```

#### 4. Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="GitHub Actions deployer" \
  --display-name="GitHub Actions"

# Grant App Engine deployment permissions
gcloud projects add-iam-policy-binding chomptron \
  --member="serviceAccount:github-actions@chomptron.iam.gserviceaccount.com" \
  --role="roles/appengine.deployer"

gcloud projects add-iam-policy-binding chomptron \
  --member="serviceAccount:github-actions@chomptron.iam.gserviceaccount.com" \
  --role="roles/appengine.serviceAdmin"

gcloud projects add-iam-policy-binding chomptron \
  --member="serviceAccount:github-actions@chomptron.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding chomptron \
  --member="serviceAccount:github-actions@chomptron.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Create and download service account key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@chomptron.iam.gserviceaccount.com
```

#### 5. Configure GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | `chomptron` |
| `GCP_SA_KEY` | (paste entire contents of github-actions-key.json) |

To copy the key content:
```bash
cat ~/github-actions-key.json
# Copy the entire JSON output
```

#### 6. Update API Key in app.yaml

Edit `app.yaml` and replace `your-api-key-here` with your actual Gemini API key.

**Important:** For production, use Secret Manager instead:

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Store API key in Secret Manager
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant App Engine access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:chomptron@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Then update `app.yaml`:
```yaml
runtime: nodejs20

automatic_scaling:
  min_instances: 0
  max_instances: 5
```

And update `server.js` to fetch from Secret Manager instead of environment variable.

### Automated Deployment

Once configured, the workflow is:

1. **Make changes** and commit to a feature branch
2. **Create pull request** → Tests run automatically
3. **Merge to main** → Tests run, then auto-deploy to App Engine
4. **Visit:** `https://chomptron.appspot.com`

### Manual Deployment (Optional)

```bash
gcloud app deploy
```

## Custom Domain (chomptron.com)

```bash
gcloud app domain-mappings create chomptron.com
```

Update DNS at your registrar with the provided A/AAAA records. SSL certificate is automatically provisioned.

## Project Structure

```
chomptron/
├── server.js                    # Node.js/Express server
├── index.html                   # Frontend
├── test.js                      # Test suite
├── package.json                 # Node dependencies
├── app.yaml                     # App Engine config
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── .gcloudignore               # Deployment exclusions
└── README.md
```

## CI/CD Pipeline

`.github/workflows/deploy.yml` defines two jobs:

1. **Test Job:** Runs `npm test` on every push to main
2. **Deploy Job:** Deploys to App Engine when tests pass (runs after test job)

The workflow is triggered on push to `main` branch.

## Technology Stack

- **Backend:** Node.js 20 + Express
- **AI:** Google Gemini Pro
- **Frontend:** Vanilla HTML/CSS/JS
- **Deployment:** Google App Engine (Node.js runtime)
- **CI/CD:** GitHub Actions

## Cost

With `min_instances: 0`:
- **Idle:** ~$0/month (scales to zero)
- **Active:** ~$0.05/hour when serving traffic
- **Gemini API:** Free tier (60 requests/minute)

## Monitoring

View logs:
```bash
gcloud app logs tail
```

View in Console:
- [App Engine Dashboard](https://console.cloud.google.com/appengine)
- [GitHub Actions](https://github.com/YOUR-USERNAME/chomptron/actions)

## Security Notes

- Service account key is stored as GitHub secret (encrypted at rest)
- Use Secret Manager for production API keys (not hardcoded in app.yaml)
- Remove local service account key after setup: `rm ~/github-actions-key.json`
- Never commit service account keys to the repository

## Troubleshooting

**GitHub Actions failing?**
- Check that secrets are set correctly in repository settings
- Verify service account has all required permissions
- Check workflow logs in Actions tab

**Deployment failing?**
- Ensure App Engine application is created
- Verify app.yaml is valid
- Check that all APIs are enabled

## License

MIT
