# StudentReach

StudentReach is a production-oriented full-stack web app for high school students who want to find the right professors faster, understand what those professors actually work on, and write stronger outreach emails without spending hours jumping between faculty pages.

The product keeps search fast and database-driven, while pushing slower AI-backed work to the detail and drafting flows after a student clicks into a result.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component system
- Framer Motion
- React Hook Form + Zod
- TanStack Query
- Supabase Auth
- Supabase Postgres
- pgvector-ready schema
- OpenAlex-backed ingestion pipeline
- OpenAI-backed generation with caching and grounded fallbacks

## What Prompt 2 Adds

This repository now includes the backend and data architecture layer:

- Supabase/Postgres schema and migration
- API routes for search, detail, saved researchers, drafts, and profile data
- Repository layer with real Postgres integration
- Local development repository fallback for seeded demo mode
- OpenAlex ingestion pipeline and normalization
- Targeted faculty-directory enrichment for public faculty pages and public emails
- AI generation and caching for profile insights, draft generation, and feedback
- Tests for normalization, ingestion transforms, and repository behavior

## Product Coverage

- Landing page
- Login, signup, and demo mode
- Lightweight onboarding
- Fast discover/search flow
- Professor detail page
- Draft workspace with Outreach Feedback and Pre-Send Check
- Shortlist
- Drafts
- Profile

## Architecture Overview

### Search path

StudentReach uses a two-stage architecture:

1. Fast DB-backed search
- Search reads from `universities`, `researchers`, `researcher_keywords`, and a generated `tsvector` search document.
- Ranking blends text relevance, field match, assistant-professor boost, and activity signals.
- Radius filtering uses stored lat/lon coordinates plus a `miles_between(...)` SQL helper.
- Search results do not wait on LLM generation.

2. Slower click-in enrichment
- Professor detail, fit guidance, breakdowns, draft generation, and outreach feedback are generated after user interaction.
- AI responses are cached in `ai_cache_entries`.
- If OpenAI credentials are unavailable, the app falls back to deterministic grounded heuristics instead of failing.

### Repository boundary

Frontend components now talk to real HTTP APIs through:

- `src/services/api-studentreach-service.ts`

Those routes delegate to a repository abstraction:

- `src/server/repositories/postgres-repository.ts`
- `src/server/repositories/local-dev-repository.ts`

Runtime selection is automatic:

- If Supabase server credentials and a database URL are present, the app uses Postgres.
- If they are not present, the app uses the local seeded repository and persists user data in `.data/studentreach-local.json`.

### Data sources

- OpenAlex is the structured discovery backbone for institutions, authors, and works.
- StudentReach stores normalized, app-owned records in Postgres.
- Optional faculty-directory enrichment can fill in public faculty page URLs and public emails when available.
- Missing public email stays `null` in storage and empty in the UI. The app does not fabricate contact data.

## Database Schema

Migration:

- [supabase/migrations/202604120001_studentreach_core.sql](supabase/migrations/202604120001_studentreach_core.sql)

Core tables:

- `universities`
- `researchers`
- `researcher_keywords`
- `publications`
- `student_profiles`
- `saved_researchers`
- `email_drafts`
- `search_events`
- `generation_jobs`
- `ai_cache_entries`
- `source_snapshots`

Notable schema decisions:

- `researchers.search_document` is a generated `tsvector` for fast full-text search.
- `researchers.embedding` and `student_profiles.embedding` are pgvector-ready for semantic ranking later.
- `saved_researchers`, `email_drafts`, and `student_profiles` have row-level security enabled.
- `generation_jobs` and `ai_cache_entries` separate queued work from durable cached outputs.
- `source_snapshots` stores provenance for OpenAlex and faculty-directory enrichment.

## API Surface

Search and researcher routes:

- `GET /api/search/researchers`
- `GET /api/researchers/:id`
- `GET /api/researchers/:id/publications`
- `GET /api/researchers/:id/breakdown`
- `GET /api/researchers/:id/fit`
- `POST /api/researchers/:id/save`

User and drafting routes:

- `GET /api/profile/upsert`
- `POST /api/profile/upsert`
- `GET /api/profile/onboarding`
- `POST /api/profile/onboarding`
- `POST /api/drafts/generate`
- `POST /api/drafts/feedback`
- `GET /api/user/drafts`
- `POST /api/user/drafts/save`
- `GET /api/user/saved`

Auth support routes:

- `POST /api/auth/demo`
- `POST /api/auth/logout`

All mutating routes validate payloads with Zod.

## Ingestion Pipeline

Entry points:

- [scripts/seed-universities.ts](scripts/seed-universities.ts)
- [scripts/run-ingestion.ts](scripts/run-ingestion.ts)
- [scripts/refresh-researcher.ts](scripts/refresh-researcher.ts)

Pipeline stages:

1. Seed 50+ major US research universities into `universities`
2. Map each university to an OpenAlex institution id
3. Pull institution works by tracked field keywords
4. Expand authors via OpenAlex author lookups
5. Normalize titles and identify professors and assistant professors
6. Derive keyword summaries, current focus, and past themes from recent works
7. Optionally enrich from public faculty directory pages for faculty URL and public email
8. Upsert researchers, publications, keywords, and source snapshots

The pipeline is idempotent at the record level through `upsert` patterns on university slugs, OpenAlex author ids, and `(researcher_id, openalex_work_id)` publication keys.

## AI Generation and Caching

AI-backed features are intentionally limited to:

- What They Actually Work On
- Research Breakdown
- Why This Might Be a Fit
- draft generation
- Outreach Feedback
- Pre-Send Check

Implementation:

- `src/server/ai/generation-service.ts`
- `src/server/cache/keying.ts`

Rules:

- The initial search list never waits on generation.
- Cache keys are based on researcher id plus the relevant student/profile context.
- Prompts are grounded in stored researcher/profile/publication data only.
- If OpenAI is unavailable or returns invalid output, StudentReach falls back to deterministic copy grounded in existing stored data.

## Auth and User Data

Authentication modes:

- Supabase auth when environment credentials are available
- demo-mode auth cookie fallback for local development

Implementation:

- `src/providers/auth-provider.tsx`
- `src/server/auth/request-user.ts`
- `src/server/db/supabase.ts`

User-owned tables protected with RLS:

- `student_profiles`
- `saved_researchers`
- `email_drafts`

The frontend attaches either a Supabase bearer token or a demo user header, and the API resolves the current user server-side before performing protected actions.

## Local Development Modes

### 1. Full backend mode

Use this when you have a Supabase project and Postgres connection ready.

1. Install dependencies

```bash
npm install
```

2. Copy the environment file

```bash
cp .env.example .env.local
```

3. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STUDENTREACH_DATABASE_URL=
STUDENTREACH_OPENALEX_EMAIL=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
STUDENTREACH_AI_CACHE_TTL_HOURS=168
STUDENTREACH_ENABLE_AI_FALLBACK=true
STUDENTREACH_DEMO_MODE=true
```

4. Run the SQL migration in your Supabase project

You can apply [supabase/migrations/202604120001_studentreach_core.sql](supabase/migrations/202604120001_studentreach_core.sql) using the Supabase SQL editor or your normal migration flow.

5. Seed universities

```bash
npm run db:seed:universities
```

6. Run ingestion

```bash
npm run db:ingest
```

7. Start the app

```bash
npm run dev
```

### 2. Local seeded fallback mode

If you do not provide the backend env vars, StudentReach still runs end to end:

- search uses the local repository
- saved researchers, profile state, onboarding, and drafts persist in `.data/studentreach-local.json`
- AI-backed features use grounded local fallbacks unless `OPENAI_API_KEY` and `OPENAI_MODEL` are set

This mode is useful for frontend work, demos, and fast iteration.

## Search and Ranking Notes

Search behavior lives across:

- `src/app/api/search/researchers/route.ts`
- `src/server/search/field-mapping.ts`
- `src/server/search/geocode.ts`
- `src/server/ranking/normalization.ts`
- `src/server/repositories/postgres-repository.ts`

Current rank blend:

- full-text relevance against the generated `search_document`
- field match bonus
- optional assistant-professor boost
- works count and citation signals
- geographic radius filtering

The schema is ready for semantic embeddings, but the current app already delivers a fast DB-driven search experience without making semantic search mandatory for local development.

## Testing

Run:

```bash
npm run lint
npm run test
npm run build
```

Current tests cover:

- normalization and ranking helpers
- local repository behavior
- ingestion normalization logic

Test files:

- [tests/ranking-normalization.test.ts](tests/ranking-normalization.test.ts)
- [tests/local-repository.test.ts](tests/local-repository.test.ts)
- [tests/ingestion-normalize.test.ts](tests/ingestion-normalize.test.ts)

## Project Structure

```text
scripts/
  refresh-researcher.ts
  run-ingestion.ts
  seed-universities.ts
src/
  app/
    (app)/
    (auth)/
    api/
  components/
  data/
    mock/
    seed/
  hooks/
  lib/
  providers/
  server/
    ai/
    api/
    auth/
    cache/
    db/
    ingestion/
    jobs/
    ranking/
    repositories/
    search/
  services/
  types/
supabase/
  migrations/
tests/
```

## Operational Notes

- Search is designed to stay fast even if AI is slow or unavailable.
- The app never sends email for the student. Drafts are copy-and-send only.
- No runtime browser scraping is used for user search requests.
- Faculty enrichment is targeted and optional, and only stores public metadata when found.
- The readiness layer is supportive and skippable, and its outputs are stored separately from core search records.

## Validation Status

This repo currently passes:

- `npm run lint`
- `npm run test`
- `npm run build`
