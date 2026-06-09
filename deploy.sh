#!/bin/bash
# Deploy script - run this after Cloud Build completes

set -e

echo "Deploying chomptron to Cloud Run..."

# To set the model (recommended: gemini-2.5-flash-lite for best free tier limits), add:
#   --set-env-vars GEMINI_MODEL=gemini-2.5-flash-lite
# Or update via Cloud Console: Cloud Run > chomptron > Edit & Deploy > Variables & Secrets

# watchtron white-box tracing: the bearer token lives in Secret Manager (like the
# Gemini key). Create it once before the first deploy with this wiring:
#   printf '%s' "<WATCHTRON_TOKEN>" | gcloud secrets create watchtron-token --data-file=-
# Rotate later with:
#   printf '%s' "<NEW_TOKEN>" | gcloud secrets versions add watchtron-token --data-file=-
# WATCHTRON_SERVICE_NAME must match the registry's expectedServiceName (chomptron-web).

gcloud run deploy chomptron \
  --image us-central1-docker.pkg.dev/chomptron/chomptron-repo/chomptron:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account 774854504205-compute@developer.gserviceaccount.com \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest,WATCHTRON_TOKEN=watchtron-token:latest \
  --update-env-vars WATCHTRON_OTLP_ENDPOINT=https://watch.swantron.com,WATCHTRON_SERVICE_NAME=chomptron-web \
  --quiet

echo "✓ Deployment complete!"
gcloud run services describe chomptron --region us-central1 --format='value(status.url)'
