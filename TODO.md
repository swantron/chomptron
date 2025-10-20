# Cloud Run Deployment Checklist

## 0. Install and Configure gcloud CLI

### Install gcloud
**macOS:**
```bash
# Using Homebrew
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download installer from https://cloud.google.com/sdk/docs/install

### Initialize and Login
```bash
# Login to your Google account
gcloud auth login

# Set your project
gcloud config set project chomptron

# Verify your configuration
gcloud config list

# Configure Docker authentication for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## 1. Enable Google Cloud APIs
```bash
gcloud config set project chomptron
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

## 2. Create Artifact Registry Repository
```bash
gcloud artifacts repositories create chomptron-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Chomptron container images"
```

## 3. Set Up Secret Manager for API Key
```bash
# Enable Secret Manager
gcloud services enable secretmanager.googleapis.com

# Store your Gemini API key
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:$(gcloud projects describe chomptron --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 4. Update cloudbuild.yaml to Use Secret Manager
Edit `cloudbuild.yaml` and change the env vars section to:
```yaml
- '--update-secrets'
- 'GEMINI_API_KEY=gemini-api-key:latest'
```

## 5. Set Up Cloud Build Trigger

### Option A: Via Console (Recommended)
1. Go to https://console.cloud.google.com/cloud-build/triggers
2. Click "Connect Repository"
3. Follow wizard to connect your GitHub repo
4. Create trigger:
   - Event: Push to branch
   - Branch: `^main$`
   - Configuration: `cloudbuild.yaml`

### Option B: Manual First Deploy
```bash
# Build and push
gcloud builds submit --tag us-central1-docker.pkg.dev/chomptron/chomptron-repo/chomptron

# Deploy to Cloud Run
gcloud run deploy chomptron \
  --image us-central1-docker.pkg.dev/chomptron/chomptron-repo/chomptron \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest
```

## 6. Test Your Deployment
After deployment completes, Cloud Run will give you a URL like:
`https://chomptron-XXXXXX-uc.a.run.app`

Test it in your browser!

## 7. Set Up Custom Domain
```bash
# Map chomptron.com to Cloud Run
gcloud run domain-mappings create \
  --service chomptron \
  --domain chomptron.com \
  --region us-central1
```

Follow the DNS instructions provided by the command output.

## 8. Update DNS at Your Registrar
Copy the DNS records from step 7 and update them at your domain registrar (where you bought chomptron.com).

## 9. Wait for DNS Propagation
Can take 5 minutes to 48 hours. Check status:
```bash
gcloud run domain-mappings describe chomptron.com \
  --region us-central1 \
  --platform managed
```

## 10. Clean Up Old Infrastructure
- Shut down DigitalOcean droplet
- Remove old DNS records pointing to DigitalOcean
- Delete any unused App Engine services (if you had them)

---

## Quick Commands Reference

**View logs:**
```bash
gcloud run logs tail chomptron --region us-central1
```

**List deployments:**
```bash
gcloud run services list --region us-central1
```

**View service details:**
```bash
gcloud run services describe chomptron --region us-central1
```

**Test locally with Docker:**
```bash
docker build -t chomptron .
docker run -p 8080:8080 -e PORT=8080 -e GEMINI_API_KEY=your-key chomptron
```
