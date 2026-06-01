# Deployment Guide - PropFlow AI

## 1. Zero-Funding Production Stack
To minimize deployment costs while preserving high-availability, we structure our multi-tenant SaaS deployment using standard free-tier hosting solutions:

| Component | Target Hosting Platform | Deployment Strategy |
|---|---|---|
| **Frontend** | **Vercel** | Edge-optimized React server rendering, direct integration with Next.js |
| **Backend API** | **Render** | Dockerized container setup or native Node.js runtime instances |
| **Database** | **Neon PostgreSQL** | Serverless SQL scaling down to zero when idle to conserve database costs |
| **Asset Storage** | **Cloudinary** | Rich CDN serving images and PDFs, secure SDK upload signing |

---

## 2. CI/CD Pipeline Automations (GitHub Actions)

### Build & Deploy Pipeline
Create a pipeline at `.github/workflows/deploy.yml` that compiles all packages and deploys them:
```yaml
name: CI/CD Build & Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run build --workspaces --if-present
```

---

## 3. Environment Secrets Setup
Configure the following secrets in your GitHub repository and hosting dashboards:
- `DATABASE_URL`: Connection string to Neon PostgreSQL database.
- `JWT_SECRET`: Secure cryptographic token seed.
- `GEMINI_API_KEY`: API access token for AI capabilities.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Media storage keys.
