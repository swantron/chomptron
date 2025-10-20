#!/bin/bash
# Deploy script - run this after Cloud Build completes

set -e

echo "Deploying chomptron to Cloud Run..."

gcloud run deploy chomptron \
  --image us-central1-docker.pkg.dev/chomptron/chomptron-repo/chomptron:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account 774854504205-compute@developer.gserviceaccount.com \
  --update-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --quiet

echo "✓ Deployment complete!"
gcloud run services describe chomptron --region us-central1 --format='value(status.url)'
