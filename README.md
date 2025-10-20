# Chomptron

AI-powered recipe generator using Google Gemini, deployed on Cloud Run.

## Local Development

```bash
npm install
export GEMINI_API_KEY="your-api-key-here"
npm start
```

Visit http://localhost:8080

Get API key: https://makersuite.google.com/app/apikey

## Deployment

See [TODO.md](TODO.md) for complete deployment checklist.

## Architecture

- **Backend:** Node.js 20 + Express  
- **AI:** Google Gemini Pro  
- **Container:** Docker  
- **Platform:** Cloud Run (fully managed)  
- **CI/CD:** Cloud Build + GitHub Actions  
- **Registry:** Artifact Registry

## Monitoring

```bash
# View recent logs
gcloud run logs read chomptron --region us-central1 --limit 50

# Stream logs in real-time
gcloud run logs tail chomptron --region us-central1
```

**Console dashboards:**
- [Cloud Run](https://console.cloud.google.com/run)
- [Cloud Build](https://console.cloud.google.com/cloud-build/builds)
- [Artifact Registry](https://console.cloud.google.com/artifacts)

## License


MIT
