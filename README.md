# ResuMaker

ResuMaker is a Next.js resume builder. It has email and password accounts, a section-based editor with starter templates, and API routes that use Google Gemini to parse resume text into structured JSON and to suggest edits.

Live site: https://resumaker.aprameyakannan.com

## Status

Some parts work end to end and some are only partly wired up:

- Working: sign up, sign in, and sign out at `/auth`; the editor and templates at `/create`; the Gemini API routes listed below when they are called with JSON.
- Not wired up: `/upload` sends the PDF as multipart form data, but `/api/parse-resume` expects a JSON body with the resume text, so uploads fail. `/tailor` posts to `/api/tailor-resume`, which does not exist. The "Preview & Export" button on `/create` links to `/preview`, which does not exist.
- Not persisted: editor content lives only in React state. The Prisma schema defines `Resume` and `JobDescription` tables, but no code reads or writes them. `lib/userTracking.ts` is a stub that only logs to the console.
- Several components in `app/components/` (for example `AIResumeEditor`, `JobDescriptionAnalyzer`, `ResumeOptimizer`, and `ResumeExporter`) are not used by any page.

## Features

- Accounts: passwords hashed with bcrypt, JWTs signed with `JWT_SECRET`, and session rows stored in Postgres through Prisma. Sign-up and sign-in also write a `UserAction` row.
- Resume editor at `/create`: add, edit, and delete sections, starting from one of five templates (Professional, Technical, Academic, Minimalist, Executive)
- Gemini routes (`gemini-3.8-flash` via `@google/generative-ai`), each validating its input with zod:
  - `POST /api/parse-resume` and `POST /api/upload`: `{ content }` resume text to `{ summary, education, experience, skills, projects }`
  - `POST /api/generate`: `{ content, type }` to rewrite suggestions, rate-limited per IP
  - `POST /api/analyze-content`: `{ section, content }` to suggestions for one section
  - `POST /api/analyze-job-description`: `{ description }` to essential and preferred requirements, skills, and industry keywords
  - `POST /api/optimize`: `{ content, keywords }` to rewritten content plus a list of changes, each with an explanation
- `GET /api/health` for uptime checks

Example:

```bash
curl -X POST http://localhost:3001/api/parse-resume \
  -H "Content-Type: application/json" \
  -d '{"content": "Jane Doe. Software Engineer at Acme, 2021-2024. Built billing APIs in Go. B.S. Computer Science, State University."}'
```

## Tech stack

- Next.js 15 (App Router, route handlers), React 18, TypeScript
- Prisma 6 with PostgreSQL
- Google Gemini through `@google/generative-ai`
- `bcryptjs`, `jsonwebtoken`, `zod`, and `lru-cache` for the in-memory rate limiter

## Getting started

Prerequisites: Node.js 20 (`.nvmrc` pins 20.11.1), a PostgreSQL database, and a Gemini API key.

```bash
npm install
npm run setup        # writes .env.local from a template with a generated JWT_SECRET
```

Edit `.env.local` and set these variables:

- Required: `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_AI_API_KEY`
- Optional: `NEXT_PUBLIC_APP_URL`, `JWT_EXPIRES_IN`, `NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE` (default 10), `NEXT_PUBLIC_MAX_CONTENT_LENGTH`

`env.example` also lists Google OAuth, Redis, analytics, and Sentry variables. The current code does not read them.

The Prisma CLI reads `.env`, not `.env.local`. Put `DATABASE_URL` in `.env` as well, or export it, before you create the tables:

```bash
npm run db:migrate   # prisma migrate dev; creates the tables from prisma/schema.prisma
npm run dev          # http://localhost:3001
```

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run db:generate`, and `npm run db:studio`.

There are no automated tests. CI runs `npm ci` and `npm run build`.

## How it works

- `app/`: App Router pages (`page.tsx` landing, `auth/`, `create/`, `upload/`, `tailor/`) and `app/api/*/route.ts` handlers
- `app/api/auth/*` and `lib/auth.ts`: sign-up, sign-in, sign-out, and token verification
- `contexts/AuthContext.tsx`: client-side auth state. The `create`, `upload`, and `tailor` pages redirect to `/auth` when you are signed out.
- `lib/database.ts` and `prisma/schema.prisma`: Prisma client and schema
- `app/lib/rate-limiter.ts`: per-IP limit backed by an LRU cache with a one-minute window, used by `/api/generate`
- `app/constants.ts`: section types and shared environment and response constants

## Contributing

Issues and pull requests are welcome. Fixing the gaps under Status is a good place to start. Before you open a PR, run `npm run lint` and `npm run build`.

## License

MIT. See [LICENSE](LICENSE).
