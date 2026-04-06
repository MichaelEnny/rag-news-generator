# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Setup

This project uses `uv` for dependency management and requires Python 3.12+.

```bash
# Install dependencies
uv sync

# Copy and fill in environment variables
cp app/example.env .env
```

Required `.env` variables:
- `OPENAI_API_KEY` — used by all three agents (DigestAgent, CuratorAgent, EmailAgent)
- `MY_EMAIL` / `APP_PASSWORD` — Gmail credentials for sending the digest email
- `POSTGRES_*` — PostgreSQL connection settings (defaults work with Docker Compose)

## Commands

```bash
# Start the database
docker compose -f docker/docker-compose.yml up -d

# Initialize database tables (run once)
python -m app.database.create_tables

# Run the full pipeline
python main.py                   # defaults: 24h window, top 10 articles
python main.py 48 5              # custom hours and top_n

# Run individual pipeline stages
python -m app.runner                          # scrape only
python -m app.services.process_anthropic     # fetch Anthropic article markdown
python -m app.services.process_youtube       # fetch YouTube transcripts
python -m app.services.process_digest        # generate AI digests
python -m app.services.process_email         # rank, generate, and send email
```

## Architecture

The pipeline runs in five sequential stages defined in `app/daily_runner.py`:

1. **Scrape** (`app/runner.py`) — fetches new content from three sources:
   - `app/scrapers/anthropic.py` — RSS feed for Anthropic blog articles
   - `app/scrapers/openai.py` — RSS feed for OpenAI blog articles
   - `app/scrapers/youtube.py` — YouTube Data API for channels listed in `app/config.py`
   
2. **Process Anthropic markdown** (`app/services/process_anthropic.py`) — uses `docling` to convert Anthropic article HTML to markdown and stores it on the DB record (needed for richer digest context).

3. **Process YouTube transcripts** (`app/services/process_youtube.py`) — fetches transcripts via `youtube-transcript-api`; marks unavailable ones as `__UNAVAILABLE__`.

4. **Generate digests** (`app/services/process_digest.py`) — for every article without a digest, calls `DigestAgent` (GPT-4o-mini) to produce a short title + 2-3 sentence summary stored in the `digests` table.

5. **Send email** (`app/services/process_email.py`) — orchestrates `CuratorAgent` (GPT-4.1) to rank recent digests by relevance to the user profile, then `EmailAgent` (GPT-4o-mini) to write a personalized intro, and finally sends HTML email via Gmail SMTP.

### Database

SQLAlchemy + PostgreSQL. Four tables (defined in `app/database/models.py`):
- `youtube_videos` — scraped videos with optional `transcript`
- `openai_articles` — scraped OpenAI blog posts
- `anthropic_articles` — scraped Anthropic blog posts with optional `markdown`
- `digests` — AI-generated summaries; primary key is `article_type:article_id`

`Repository` (`app/database/repository.py`) is the single data-access layer. All writes are idempotent (skip-if-exists).

### AI Agents

All agents use the OpenAI SDK with structured output via `client.responses.parse()` and Pydantic models:

- `DigestAgent` — GPT-4o-mini, generates title + summary per article
- `CuratorAgent` — GPT-4.1, ranks a list of digests against the user profile with relevance scores
- `EmailAgent` — GPT-4o-mini, writes the personalized email greeting/intro

### User Profile

Edit `app/profiles/user_profile.py` to change the recipient name, interests, and preferences used by CuratorAgent and EmailAgent for personalization.

### Adding a new content source

1. Create a scraper in `app/scrapers/` returning a list of dataclass objects
2. Add storage logic in `app/runner.py` using `Repository`
3. Add a processing step in `app/services/` if the source needs content enrichment before digesting
4. Wire the new stage into `app/daily_runner.py`