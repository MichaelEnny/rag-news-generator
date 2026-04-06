# AI News Desk

This repository now contains a Vercel-native web application that replaces the original Python-only batch pipeline with a publishable `Next.js` product surface. The legacy Python code is still present for reference, but the new app is built around server-rendered pages, Vercel cron endpoints, hosted Postgres, Clerk authentication, and transactional email delivery.

## Current Stack

- `Next.js 15` with App Router and TypeScript
- `Clerk` for authentication and user identity
- `pg` for Vercel Postgres access
- `OpenAI` for digesting and ranking
- `Resend` for email delivery
- `rss-parser`, `cheerio`, and `youtube-transcript` for source ingestion

## Product Surface

- `/` ultramodern public landing page
- `/dashboard` authenticated workspace with metrics, run pulse, digest grid, and email preview for the signed-in user
- `/sources` source management
- `/pipeline` manual run controls and job history
- `/profile` profile, delivery email, and ranking preference editor
- `/sign-in` and `/sign-up` powered by Clerk
- `/api/cron/ingest`, `/api/cron/digest`, `/api/cron/email` for scheduled execution
- `/api/health` for quick runtime checks

## Local Setup

1. Install Node dependencies:

```powershell
npm install --cache .npm-cache
```

2. Copy environment variables:

```powershell
Copy-Item .env.example .env
```

3. Set the required values:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

4. Run the database migration:

```powershell
npm run db:migrate
```

5. Start the app:

```powershell
npm run dev
```

6. Open [http://localhost:3000/sign-up](http://localhost:3000/sign-up) and create a user. That Clerk user becomes the owner of the saved profile, manual pipeline runs, and personalized email delivery history.

## Verification

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

## Vercel Deployment Notes

- `vercel.json` already defines cron jobs for ingestion, digest generation, and email preparation.
- The cron routes require `Authorization: Bearer <CRON_SECRET>`.
- If `DATABASE_URL` is missing, the UI falls back to sample data so the interface still renders.
- If `OPENAI_API_KEY` is missing, digesting and ranking fall back to deterministic summaries and recency ordering.
- If `RESEND_API_KEY` or `EMAIL_FROM` are missing, the app stores preview-only email issues instead of sending.
- Delivery is user-scoped. Each signed-in Clerk user owns their own profile, delivery email, manual runs, and preview history.

## Design Documentation

See [design-documentation/README.md](/C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/design-documentation/README.md) for the design system, accessibility guidance, and feature implementation notes.
