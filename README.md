# StudentReach

StudentReach is a polished frontend-first web app for high school students who want to find the right professors faster, understand what those professors actually work on, and write more thoughtful outreach emails without spending hours decoding faculty pages one by one.

This repository intentionally stops at the frontend and mock-service boundary. It does not implement the real backend, database, ingestion pipeline, or external API integrations yet.

## Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component setup
- Framer Motion
- React Hook Form + Zod
- TanStack Query
- Supabase-ready auth integration with demo/local fallback
- Mock service layer + seeded data

## Product Coverage

This build includes:

- Landing page with real product preview
- Login and signup
- Demo/guest mode for local testing
- Lightweight multi-step onboarding
- Discover/search flow
- Professor detail page
- Email drafting workspace with coaching
- Shortlist page
- Drafts page
- Profile page
- Mock dataset covering 50+ major US research universities across 7 fields

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

If you do not provide Supabase credentials, StudentReach still runs end-to-end with local demo auth and seeded mock data.

## Environment Variables

Only these frontend auth variables are expected in this phase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If both are blank, auth automatically falls back to a local demo session.

## Architecture Notes

### 1. Frontend-first service boundary

All product surfaces talk to a clean `StudentReachService` interface in `src/types/index.ts`.

The current implementation lives in:

- `src/services/mock/studentreach-mock-service.ts`

That mock adapter handles:

- professor search
- professor detail lookups
- shortlist persistence
- draft generation
- outreach feedback analysis
- onboarding/profile persistence

This makes it straightforward to replace the mock adapter with real backend endpoints in Prompt 2 without rewriting the UI.

### 2. Search is intentionally lightweight

Search results render from a fast list-oriented shape. Heavier “understand this professor” work happens on the professor detail page and in the drafts workspace.

That mirrors the intended production architecture:

- `/discover` should stay fast
- richer AI-backed analysis should happen after a user clicks into a professor

### 3. Demo auth and Supabase-ready auth

The auth provider in `src/providers/auth-provider.tsx` supports:

- Supabase email/password auth when public credentials are available
- demo/local fallback when they are not

That means the app is usable immediately while still preserving a clean path to real session handling later.

## Seed Data

Professor seed content lives in:

- `src/data/mock/professors.ts`
- `src/data/mock/profile.ts`

The seeded professor dataset covers:

- Computer Science / AI
- Biology / Biotech
- Physics
- Engineering
- Psychology / Neuroscience
- Economics / Social Science
- Chemistry

The UI markets around “professors,” but seeded results naturally include assistant professors in both search and filtering.

## Project Structure

```text
src/
  app/
    (app)/
    (auth)/
    page.tsx
  components/
    discover/
    drafts/
    landing/
    layout/
    onboarding/
    professors/
    profile/
    shortlist/
    shared/
    ui/
  data/mock/
  hooks/
  lib/
  providers/
  services/mock/
  types/
```

## Validation

Before handing this phase off, run:

```bash
npm run lint
npm run build
```

## Important Scope Boundary

This repository is intentionally limited to:

- polished frontend UX
- route structure
- component system
- mock data
- clean service layer

It intentionally does not yet include:

- a real database schema
- ingestion pipelines
- real professor enrichment jobs
- production search indexing
- external API integrations
- backend persistence beyond local mock storage

That next layer should be implemented only after Prompt 2 defines the backend and data architecture.
