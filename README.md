# PropFlow AI

PropFlow AI is a high-fidelity, production-grade, multi-tenant property and rental management SaaS platform.

## Architecture Highlights
- **Frameworks**: Next.js 15 (Frontend) & NestJS (Backend)
- **Monorepo Strategy**: Managed via native Node/npm workspaces
- **Database**: PostgreSQL (Neon) and Prisma ORM with Multi-Tenant Row-Level Security principles
- **AI Stack**: Gemini API for Lease Intelligence, Property Health Scores, and Analytics
- **Storage**: Cloudinary for lease docs and property assets

## Setup & Getting Started

### 1. Prerequisites
- Node.js (v22+)
- Docker & Docker Compose (for local database & caching infrastructure)

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
npm install
```

### 3. Local Infrastructure
Boot up local Postgres and Redis database servers via Docker:
```bash
docker-compose up -d
```

### 4. Running the Project
```bash
# Start backend and frontend simultaneously in development mode
npm run dev
```
