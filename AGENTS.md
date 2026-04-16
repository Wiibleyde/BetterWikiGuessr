# AGENTS.md — WikiGuessr

## Project Overview

WikiGuessr is a daily word-guessing game built with Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, Prisma 7, Supabase Auth, and Bun. Players reveal a masked Wikipedia article by guessing words. The application also supports image hints, authenticated progress persistence, leaderboards, profile stats, and article history.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Client state | Jotai |
| Authentication | Supabase Auth with Discord OAuth |
| Database | PostgreSQL via Prisma 7 and `@prisma/adapter-pg` |
| Data fetching | SWR |
| Linter / Formatter | Biome 2.2 |
| Testing | Bun test |
| Package manager | Bun |

## Repository Structure

```text
src/
├── app/                          # App Router pages, metadata files, API routes
│   ├── layout.tsx                # Root layout (Navbar, Footer, Providers)
│   ├── page.tsx                  # Home page
│   ├── error.tsx                 # Global app error UI
│   ├── loading.tsx               # Global loading UI
│   ├── not-found.tsx             # 404 page
│   ├── robots.ts                 # robots.txt generation
│   ├── sitemap.ts                # sitemap generation
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/[provider]/route.ts  # Supabase OAuth code exchange
│   │   ├── game/
│   │   │   ├── route.ts                    # GET masked article
│   │   │   ├── guess/route.ts              # POST guess validation
│   │   │   ├── complete/route.ts           # POST save result
│   │   │   ├── state/route.ts              # GET/PUT authenticated game state
│   │   │   ├── reveal/route.ts             # POST reveal all after verified win
│   │   │   ├── yesterday/route.ts          # GET yesterday title
│   │   │   ├── hint/route.ts               # POST unlock image hint
│   │   │   └── hint/image/route.ts         # GET obfuscated hint image
│   │   ├── historic/route.ts               # GET historic articles
│   │   ├── leaderboard/route.ts            # GET leaderboard data
│   │   └── profile/stats/route.ts          # GET authenticated profile stats
│   ├── historic/page.tsx          # Historic page
│   ├── leaderboard/page.tsx       # Leaderboard page
│   └── profile/page.tsx           # Profile page
├── atom/
│   └── game.ts                    # Jotai atoms for client game state
├── components/
│   ├── Game.tsx                   # Main game composition
│   ├── GameHeader.tsx             # Guess form and progress UI
│   ├── ArticleView.tsx            # Render masked article sections
│   ├── GuessList.tsx              # Guess history panel
│   ├── ImageHint.tsx              # Image hint UI
│   ├── Navbar.tsx                 # Top-level navigation
│   ├── Footer.tsx                 # App footer
│   ├── YesterdayWord.tsx          # Yesterday title card
│   ├── article/                   # Article-specific presentation
│   ├── historic/                  # Historic page components
│   ├── leaderboard/               # Leaderboard page components
│   ├── navbar/                    # Desktop/mobile/auth navbar pieces
│   ├── profile/                   # Profile page components
│   └── ui/                        # Shared UI primitives and messages
├── constants/                     # Game and rate-limit constants
├── contexts/                      # React contexts
├── controllers/                   # HTTP request validation and response shaping
├── hooks/                         # Client hooks for article, guesses, auth, db sync
├── lib/
│   ├── auth/                      # Rate limiting (auth handled by Supabase)
│   ├── supabase/                  # Supabase SSR client (browser + server)
│   ├── game/                      # Core game logic, normalization, daily wiki, wiki fetch
│   ├── repositories/              # Prisma-backed repositories
│   ├── prisma.ts                  # Prisma singleton
│   ├── db-check.ts                # Startup DB connectivity check
│   ├── leaderboard.ts             # Leaderboard computation
│   ├── historic.ts                # Historic article helpers
│   └── queries.ts                 # Shared query helpers
├── providers/                     # Global providers
├── services/                      # Domain-level application services
├── test/                          # Bun test suites
├── types/                         # Shared domain types
├── utils/                         # Response helpers, handlers, styling, image processing
├── env.ts                         # Runtime env validation with Zod
├── instrumentation.ts             # Startup DB check and daily article bootstrap
└── proxy.ts                       # Request ID header injection + Supabase session refresh
prisma/
├── schema.prisma                  # Prisma schema
└── migrations/                    # Migration history
generated/prisma/                  # Generated Prisma client (do not edit)
```

## Coding Conventions

### General

- Language: TypeScript with `strict` mode.
- Indent: 4 spaces.
- Imports: use the `@/*` alias for imports from `src/`.
- Naming:
  - Components: `PascalCase`
  - Hooks, utilities, services, controllers: `camelCase`
  - Types and interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE` for true constants
- Exports:
  - Prefer default exports for React components
  - Prefer named exports for hooks, services, utilities, and types

### TypeScript

- Do not use `any`.
- Type exported function parameters and return values explicitly.
- Use `type` imports where appropriate.
- Use `interface` for object shapes and `type` for unions or aliases.
- Never edit files in `generated/`, but importing generated Prisma types for type-only usage is acceptable when the codebase already does so.

### React and Next.js

- App Router pages and layouts stay thin and server-first unless a page genuinely needs client behavior.
- Keep business logic in hooks, services, and `lib/` modules, not inside pages.
- Route handlers are thin wrappers over controllers and usually compose `withErrorHandler`, `withAuth`, or `withRateLimit`.
- Global shell concerns live in `src/app/layout.tsx`, `src/providers/`, and `src/components/Navbar.tsx`.
- Client game state is centralized in `src/atom/game.ts` and orchestrated by `useWikiGuessr`, `useArticle`, `useGame`, `useGuess`, and `useDb`.

### Styling

- Tailwind CSS only.
- Prefer the shared `cn()` helper from `src/utils/cn.ts` for conditional classes.
- Stay within the established palette built around `stone`, `gray`, `emerald`, `amber`, `red`, and `blue` tokens unless the task clearly requires expanding it.

### Architecture Boundaries

- `controllers/`: validate request payloads and translate service results into HTTP responses.
- `services/`: domain use cases and orchestration.
- `lib/repositories/`: database access.
- `lib/game/`: pure game logic, wiki fetching, daily article rotation.
- `utils/handler.ts`: shared wrappers for auth, error handling, and rate limiting.

## Authentication

- Authentication is handled through Supabase Auth (GoTrue) with `@supabase/ssr`.
- The Supabase server client lives in `src/lib/supabase/server.ts`.
- The Supabase browser client lives in `src/lib/supabase/client.ts`.
- Discord is the configured social provider.
- Session refresh is handled in `src/proxy.ts` (Next.js 16 proxy file).
- OAuth callback is handled by `src/app/api/auth/callback/[provider]/route.ts`.
- The `User` table in Prisma is a profile table synced from `auth.users` via a PostgreSQL trigger.
- Authenticated endpoints currently include:
  - `GET /api/game/state`
  - `PUT /api/game/state`
  - `POST /api/game/complete`
  - `GET /api/profile/stats`

## Database and Prisma

- Prisma schema is in `prisma/schema.prisma`.
- The generated client output is `generated/prisma/`.
- Always use the Prisma singleton from `src/lib/prisma.ts` for database access.
- The `User` model is a profile table synced from Supabase `auth.users` via a DB trigger.
- Current application models include:
  - `User` (profile, synced from Supabase auth)
  - `DailyWikiPage`
  - `GameResult`
  - `GameState`

## Testing and Quality

- Use Biome for linting and formatting.
- Use Bun for unit tests.
- Existing tests live in `src/test/`, currently including game and normalization coverage.
- Recommended verification after non-trivial changes:
  1. `bun run lint`
  2. `bun run test`
  3. `bun run build` for changes affecting routing, env handling, or production bundling

## Application Flow

### Daily Article Lifecycle

1. `src/instrumentation.ts` verifies the database connection on server startup.
2. The same bootstrap ensures today’s wiki page exists.
3. `startDailyCron()` keeps the daily article fresh after rollover.

### Game Flow

1. The client loads the current article through `GET /api/game`.
2. Client hooks populate Jotai atoms for article, guesses, revealed words, hint state, and win state.
3. Word guesses are sent to `POST /api/game/guess`.
4. Server logic normalizes input and evaluates exact or fuzzy matches.
5. Image hints are unlocked through `POST /api/game/hint` and delivered through `GET /api/game/hint/image`.
6. Authenticated players can sync state with `GET/PUT /api/game/state`.
7. Verified wins are persisted through `POST /api/game/complete`.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (for admin operations) |
| `DISCORD_CLIENT_ID` | Yes for Discord auth | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | Yes for Discord auth | Discord OAuth client secret |
| `GAME_TIMEZONE` | No | Daily game timezone, defaults to `Europe/Paris` |

## Common Commands

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run format
bun run test
bun run test:watch
bun run test:coverage
bun run test:e2e
bun run db:generate
bun run db:migrate
```

## Do and Don't

### Do

- Keep API routes thin and push logic into controllers and services.
- Preserve the current layering between controllers, services, repositories, and pure game logic.
- Reuse `withErrorHandler`, `withAuth`, `withRateLimit`, `ok`, and `err` helpers instead of open-coding route boilerplate.
- Keep edits focused and consistent with the existing TypeScript and Tailwind style.
- Update tests or docs when behavior changes.

### Don't

- Do not edit `generated/prisma/`.
- Do not instantiate Prisma clients ad hoc.
- Do not bypass service and repository layers for new server-side features unless there is a clear reason.
- Do not document the old Better Auth or JWT cookie auth flow; the project now uses Supabase Auth.
- Do not describe `POST /api/game/state` or legacy Discord callback routes; they are no longer the current API surface.
