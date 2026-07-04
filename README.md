# RapidRead

News tailored just for you. RapidRead is a personalized news feed that ranks articles by your topic and country preferences, explains why each article was recommended, and learns from your feedback over time.

The app runs entirely on your machine for local development — no AWS account required.

## Features

- Topic and country onboarding on first visit
- Personalized feed with explainable ranking signals
- Like, dislike, save, hide source, and mute topic controls
- Article detail pages with summaries, topics, entities, and sentiment
- Profile dashboard showing your preferences and interaction history
- Settings page to update topics and countries anytime
- Optional live RSS ingestion from major news sources
- Optional AWS deployment with DynamoDB, S3, Lambda, and CloudFront

## Requirements

- Node.js 20 or later
- npm (included with Node.js)
- Git

AWS account and credentials are only needed if you deploy to AWS or enable Bedrock enrichment.

## Quick start (local)

### 1. Clone the repository

```bash
git clone https://github.com/mattarithwik/RapidRead.git
cd RapidRead
```

### 2. Install dependencies

```bash
npm install
```

### 3. (Optional) Copy environment config

Defaults work out of the box, but you can customize settings:

```bash
cp .env.example .env.local
```

### 4. Seed demo data

```bash
npm run seed-demo-data
```

This creates `.data/news-store.json` with realistic multi-country articles so you can explore the app immediately.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On your first visit, pick topics and countries in the onboarding flow. Your personalized feed appears right after.

## Optional: ingest live news

Fetch articles from configured RSS feeds into local storage:

```bash
npm run ingest
npm run enrich
```

Or trigger ingestion while the dev server is running:

```
GET http://localhost:3000/api/admin/ingest
```

By default, enrichment uses a local fallback. To use Amazon Bedrock instead, set `ENABLE_BEDROCK=true` in `.env.local` and configure AWS credentials.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run seed-demo-data` | Reset local store with demo articles |
| `npm run ingest` | Fetch RSS feeds into local storage |
| `npm run enrich` | Enrich pending articles |
| `npm test` | Run unit tests |
| `npm run cdk:deploy` | Deploy to AWS (requires CDK bootstrap) |

## Storage backends

**Local (default):** articles are stored in `.data/news-store.json`. No AWS needed.

**AWS:** set these in `.env.local` after deploying with CDK:

```bash
STORAGE_BACKEND=aws
NEWS_TABLE_NAME=<from CDK output>
RAW_ARTICLES_BUCKET=<from CDK output>
AWS_REGION=us-east-1
```

## Environment variables

Copy `.env.example` to `.env.local` for the full list. Common options:

| Variable | Default | Purpose |
|----------|---------|---------|
| `STORAGE_BACKEND` | `local` | `local` or `aws` |
| `ENABLE_BEDROCK` | `false` | Use Amazon Bedrock for AI enrichment |
| `AWS_REGION` | `us-east-1` | AWS region for SDK clients |
| `INGEST_MAX_ARTICLES` | `200` | Cap articles per ingestion run |

## How ranking works

Normal scoring weights:

```
0.30 topicMatch + 0.20 semanticSimilarity + 0.15 countryMatch +
0.15 recency + 0.10 feedback + 0.05 sourceDiversity + 0.05 popularity
```

Cold start (fewer than 5 interactions) uses topic and country match more heavily. Hidden sources, muted topics, and disliked articles are filtered out.

## AWS deployment

After `npm install` and [CDK bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html):

```bash
npm run cdk:deploy
```

This builds the Next.js app with OpenNext and deploys two stacks: data infrastructure (DynamoDB, S3, Lambdas) and the web app (Lambda + CloudFront). EventBridge schedules are disabled by default; enable with:

```bash
npm run cdk deploy -- --all -c enableSchedules=true
```

## Project structure

```
RapidRead/
├── app/                  # Next.js pages and API routes
├── components/           # React UI components
├── lib/                  # Storage, ingestion, enrichment, ranking
├── scripts/              # CLI tools for seed, ingest, enrich
├── lambda/               # AWS Lambda handlers
├── infra/                # AWS CDK stacks
└── tests/                # Vitest unit tests
```

## Troubleshooting

**Empty feed:** run `npm run seed-demo-data` and refresh the page.

**Port 3000 in use:** stop the other process or run `npm run dev -- -p 3001`.

**Ingest fails:** check your network connection; RSS feeds require outbound HTTP access.
