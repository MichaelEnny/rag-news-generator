# AI News Desk End-to-End User Guide

## Overview

This guide walks through the full local workflow for the Vercel-native AI News Desk app:

1. Install dependencies
2. Start PostgreSQL
3. Configure environment variables
4. Configure Clerk authentication
5. Run database migrations
6. Start the web app
7. Create an account and sign in
8. Save your personalized profile
9. Run the pipeline end to end
10. Troubleshoot common issues

This guide assumes you are running on Windows PowerShell in the project root:

`C:\Users\wisdo\OneDrive\Desktop\codex_projects\RAG-news-generator`

## Prerequisites

You need:

- Node.js 22+
- npm 10+
- Docker Desktop
- Internet access for RSS feeds, YouTube transcripts, OpenAI, Clerk, and Resend

Optional but recommended:

- An OpenAI account with API access
- A Clerk account and application
- A Resend account
- A domain you control for production email sending

## Project Files You Will Use

- [`.env.example`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/.env.example)
- [`docker/docker-compose.yml`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/docker/docker-compose.yml)
- [`scripts/migrate.mjs`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/scripts/migrate.mjs)
- [`vercel.json`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/vercel.json)
- [`README.md`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/README.md)

## Step 1: Install Dependencies

Run:

```powershell
npm install --cache .npm-cache
```

This installs the Next.js app dependencies, including Clerk.

## Step 2: Create Your Environment File

Create `.env` from the example:

```powershell
Copy-Item .env.example .env
```

Open [`.env`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/.env) and fill it in.

## Step 3: Configure Environment Variables

### Minimum local setup

If you want a local database, sign-in, and manual pipeline testing:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_news_aggregator
CRON_SECRET=your-random-secret
OPENAI_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
YOUTUBE_CHANNELS=UCawZsQWqfGSbCI5yjkdVkTA
```

### Full local setup

If you want real digest generation and real email sending:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_news_aggregator
CRON_SECRET=your-random-secret
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
EMAIL_FROM=digest@your-verified-domain.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
YOUTUBE_CHANNELS=UCawZsQWqfGSbCI5yjkdVkTA
```

### What each variable does

`DATABASE_URL`

- PostgreSQL connection string
- Required for persisted app data
- For local Docker Postgres, use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_news_aggregator
```

`CRON_SECRET`

- Protects the cron endpoints
- Required for production-safe scheduled execution
- Can be any random 16+ character string

`OPENAI_API_KEY`

- Enables real digest generation and ranking
- If blank, the app falls back to deterministic summaries and recency ordering

`RESEND_API_KEY`

- Enables actual email sending
- If blank, the app creates preview-only email runs

`EMAIL_FROM`

- Sender email address
- Must be a valid email address
- For production sending, it must be on a Resend-verified domain

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

- Clerk frontend key
- Required for sign-in and sign-up pages to render

`CLERK_SECRET_KEY`

- Clerk server key
- Required for route protection and server-side user lookup

`NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

- Route hints used by Clerk components
- The defaults in this repo are correct for local and Vercel use

`YOUTUBE_CHANNELS`

- Comma-separated YouTube channel IDs
- The default project value is:

```env
YOUTUBE_CHANNELS=UCawZsQWqfGSbCI5yjkdVkTA
```

## Step 4: Configure Clerk

Create a Clerk application before you start the app:

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com/)
2. Create an application
3. Choose email-based sign-in
4. Open the app API keys page
5. Copy the publishable key and secret key into [`.env`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/.env)

Example:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

What Clerk changes in this app:

- every signed-in user gets their own profile row
- manual pipeline runs are recorded against that Clerk user
- email previews and sends are scoped to the signed-in user
- manual sends default to the email address used to sign in with Clerk
- the profile delivery email acts as the persisted fallback for scheduled delivery

## Step 5: Start PostgreSQL

Start the local database:

```powershell
docker compose -f docker/docker-compose.yml up -d
```

What this does:

- starts a `postgres:17` container
- exposes the DB on local port `5433`
- creates the database `ai_news_aggregator`

To confirm Docker is up:

```powershell
docker compose -f docker/docker-compose.yml ps
```

## Step 6: Run Database Migrations

Run:

```powershell
npm run db:migrate
```

What this does:

- creates web-app tables if they do not exist
- adds compatibility columns for older Python-era tables
- adds Clerk user scoping columns
- preserves existing data where possible

Expected output:

```powershell
Migration applied: ...001_initial.sql
Migration applied: ...002_legacy_digest_compat.sql
Migration applied: ...003_clerk_user_scope.sql
```

## Step 7: Start the App

Run:

```powershell
npm run dev
```

Expected output includes:

- `Local: http://localhost:3000`

Open:

[http://localhost:3000](http://localhost:3000)

What you should see first:

- a public marketing landing page
- sign-in and sign-up entry points
- product highlights and live source metrics

## Step 8: Create an Account and Sign In

Open:

[http://localhost:3000/sign-up](http://localhost:3000/sign-up)

Actions:

1. Create a Clerk user
2. Sign in
3. Open the dashboard

What to expect:

- protected pages such as `/dashboard`, `/profile`, `/sources`, and `/pipeline` require sign-in
- the app uses your Clerk identity to create or load your personal profile
- the top-right user menu shows the signed-in session

## Step 9: First App Check

Open the dashboard:

[http://localhost:3000/dashboard](http://localhost:3000/dashboard)

You should see:

- top navigation
- metrics cards
- latest system activity
- email preview panel
- ranked digest area

If `DATABASE_URL` is set and migration succeeded, the app should use the database.

If `DATABASE_URL` is missing, it will render sample data instead.

## Step 10: Save Profile Settings

Open:

[http://localhost:3000/profile](http://localhost:3000/profile)

Actions:

1. Review the existing profile
2. Optionally update:
   - name
   - title
   - background
   - interests
   - delivery email
   - digest window
   - top N
3. Click `Save profile`

Expected result:

- the page reloads without an error
- values persist in the database for the current signed-in Clerk user
- future digests and email delivery use this saved profile

## Step 11: Check Sources

Open:

[http://localhost:3000/sources](http://localhost:3000/sources)

You should see the configured sources:

- OpenAI RSS
- Anthropic RSS
- YouTube source(s)

You can:

- pause a source
- reactivate a source

Click the source action button while signed in.

## Step 12: Run the Pipeline Manually

Open:

[http://localhost:3000/pipeline](http://localhost:3000/pipeline)

You have four main options:

- `Run full pipeline`
- `Run ingestion only`
- `Generate digests`
- `Prepare delivery`

### Recommended first-run order

Run in this order:

1. `Run ingestion only`
2. `Generate digests`
3. `Prepare delivery`

For each action, click `Run` while signed in.

### What each stage does

`Run ingestion only`

- pulls RSS content
- pulls YouTube feed entries
- attempts transcript extraction
- writes articles into the DB

`Generate digests`

- finds articles without digests
- uses OpenAI if `OPENAI_API_KEY` is present
- otherwise generates fallback summaries

`Prepare delivery`

- ranks digests
- builds an email preview
- sends email to the signed-in user's Clerk email for manual runs
- scheduled sends use the saved profile delivery email
- stores preview or send result in the DB

`Run full pipeline`

- performs all stages in one action

## Step 13: Verify Results

After running the pipeline:

### Dashboard

Return to:

[http://localhost:3000/dashboard](http://localhost:3000/dashboard)

You should see:

- updated job history
- updated metrics
- digests in the ranked grid
- an updated email preview

### Pipeline page

On:

[http://localhost:3000/pipeline](http://localhost:3000/pipeline)

You should see:

- recent jobs listed
- each job with status
- summary JSON for each run

### Email behavior

If `RESEND_API_KEY` and `EMAIL_FROM` are blank:

- email stays in preview-only mode

If they are configured correctly:

- the app attempts to send a real email to the email used to authenticate for manual runs

## Step 14: Test Health Endpoint

Open:

[http://localhost:3000/api/health](http://localhost:3000/api/health)

Expected response:

```json
{
  "ok": true,
  "database": true
}
```

If `database` is `false`, your app is running without a working database connection.

## Step 15: Cron Endpoint Testing

The project defines cron routes in [vercel.json](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/vercel.json):

- `/api/cron/ingest`
- `/api/cron/digest`
- `/api/cron/email`

These routes require:

```http
Authorization: Bearer <CRON_SECRET>
```

You usually do not need to test them manually in the browser. They are intended for Vercel scheduled execution.

## Step 16: OpenAI Setup Guide

To enable real summaries and ranking:

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign in
3. Open your project settings
4. Create a secret API key
5. Copy it once
6. Paste it into `.env`:

```env
OPENAI_API_KEY=sk-...
```

Then restart the dev server:

```powershell
npm run dev
```

## Step 17: Resend Setup Guide

To enable real email sending:

1. Go to [resend.com](https://resend.com/)
2. Create or sign into your account
3. Add a domain in the Resend dashboard
4. Add the DNS records Resend provides
5. Wait until the domain is verified
6. Create a Resend API key
7. Set:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=digest@your-verified-domain.com
```

Then restart the dev server:

```powershell
npm run dev
```

## Step 18: Validation Commands

Use these to confirm the project is healthy:

```powershell
npm run lint
npx tsc --noEmit
npm run build
```

If all three pass, the source code is in a good local state.

## Troubleshooting

### Error: `DATABASE_URL must be set before running migrations`

Cause:

- `.env` is missing `DATABASE_URL`
- or the migration script could not read the file

Fix:

- ensure [`.env`](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/.env) contains:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_news_aggregator
```

Then rerun:

```powershell
npm run db:migrate
```

### Error: `column d.generated_title does not exist`

Cause:

- your DB was created from the earlier Python schema

Fix:

Run migrations again:

```powershell
npm run db:migrate
```

This applies the compatibility migration that adds `generated_title`.

### Error: `__webpack_modules__[moduleId] is not a function`

Cause:

- stale `.next` dev cache after a server/runtime failure

Fix:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

Then hard refresh the browser with `Ctrl+Shift+R`.

### Protected pages throw `Unauthorized`

Cause:

- Clerk env vars are missing or invalid
- you are not signed in

Fix:

- confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set
- restart `npm run dev`
- sign in at [http://localhost:3000/sign-in](http://localhost:3000/sign-in)

### App starts but homepage shows sample data

Cause:

- `DATABASE_URL` is missing
- or DB connection failed

Check:

- [http://localhost:3000/api/health](http://localhost:3000/api/health)

### Pipeline works but summaries are generic

Cause:

- `OPENAI_API_KEY` is blank

Fix:

- add a valid OpenAI API key
- restart the dev server

### Email preview works but no email is sent

Cause:

- `RESEND_API_KEY` or `EMAIL_FROM` is missing
- or your sender domain is not verified
- or the signed-in user profile has no delivery email

Fix:

- configure Resend and sender env vars
- verify the sending domain in Resend
- save a `Delivery email` on `/profile`

## Recommended Local Test Plan

Run this exact sequence:

1. `docker compose -f docker/docker-compose.yml up -d`
2. `npm run db:migrate`
3. `npm run dev`
4. open `/sign-up`
5. create an account and sign in
6. open `/profile` and save your delivery email and interests
7. open `/sources` and confirm feeds exist
8. open `/pipeline`
9. run `Run ingestion only`
10. run `Generate digests`
11. run `Prepare delivery`
12. return to `/dashboard`
13. confirm dashboard metrics, digests, and email preview updated

## Production Notes

When deploying to Vercel:

- copy these variables into Vercel project settings
- keep `CRON_SECRET` the same value in the project env
- add the Clerk publishable and secret keys to the Vercel project
- Vercel cron jobs will call your cron routes automatically
- you can use `vercel env pull` to sync env vars locally

## Related Documentation

- [README.md](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/README.md)
- [design-documentation/README.md](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/design-documentation/README.md)
- [vercel.json](C:/Users/wisdo/OneDrive/Desktop/codex_projects/RAG-news-generator/vercel.json)
