# AGENTS.md — WikiGuessr

## Project Overview

WikiGuessr is a daily word-guessing game built with **Next.js 16** (App Router), **React 19**, **TypeScript 5**, **Tailwind CSS 4**, and **Prisma 7** (PostgreSQL). Players guess words to progressively reveal a masked Wikipedia article. A new article is selected each day.

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 16 (App Router)             |
| UI           | React 19 with React Compiler        |
| Language     | TypeScript 5 (strict mode)          |
| Styling      | Tailwind CSS 4                      |
| Database     | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Linter       | Biome 2.2                           |
| Package Mgr  | npm                                 |

## Repository Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── layout.tsx          # Root layout (lang="fr")
│   ├── page.tsx            # Home page — renders <Game />
│   ├── globals.css         # Global styles (Tailwind)
│   └── api/
│       ├── game/
│       │   ├── route.ts    # GET  → returns masked article
│       │   ├── guess/
│       │   │   └── route.ts # POST → checks a word guess
│       │   └── complete/
│       │       └── route.ts # POST → saves game result (auth required)
│       ├── auth/
│       │   ├── login/
│       │   │   └── route.ts # GET  → redirects to Discord OAuth2
│       │   ├── callback/
│       │   │   └── route.ts # GET  → handles OAuth2 callback
│       │   ├── me/
│       │   │   └── route.ts # GET  → returns current user
│       │   └── logout/
│       │       └── route.ts # POST → clears auth cookie
│       ├── profile/
│       │   └── stats/
│       │       └── route.ts # GET  → returns user game stats
│       └── daily-wiki/
│           └── route.ts    # GET  → returns the full daily wiki page
├── components/             # React client components
│   ├── Game.tsx            # Main game orchestrator
│   ├── GameHeader.tsx      # Header with input, progress bar, stats
│   ├── ArticleView.tsx     # Renders masked/revealed article sections
│   ├── TokenList.tsx       # Renders token sequences (words & punctuation)
│   └── GuessList.tsx       # Sidebar list of past guesses
├── hooks/
│   ├── useGameState.ts     # Core game state hook (guesses, reveals, cache)
│   └── useAuth.ts          # Authentication state hook (Discord OAuth2)
├── lib/
│   ├── game.ts             # Server-side game logic (tokenization, guess checking)
│   ├── wiki.ts             # Wikipedia API integration
│   ├── daily-wiki.ts       # Daily page selection & caching (DB + in-memory)
│   ├── prisma.ts           # Prisma client singleton
│   ├── jwt.ts              # JWT sign/verify (HMAC-SHA256 via node:crypto)
│   └── auth.ts             # Auth helpers (session, cookies)
├── types/
│   ├── game.ts             # Shared game type definitions
│   └── auth.ts             # Auth & profile type definitions
└── instrumentation.ts      # Next.js instrumentation (daily cron bootstrap)
prisma/
├── schema.prisma           # Database schema
└── migrations/             # Prisma migration files
generated/prisma/           # Generated Prisma client (do not edit)
```

## Coding Conventions

### General

- **Language**: TypeScript with `strict: true`. Never use `any` — prefer `unknown` and narrow with type guards.
- **Indent**: 4 spaces (configured in Biome).
- **Imports**: Use the `@/*` path alias for all imports from `src/`. Biome auto-organizes imports — do not manually reorder.
- **Naming**:
  - Files: `PascalCase` for React components (`GameHeader.tsx`), `camelCase` for everything else (`game.ts`, `useGameState.ts`).
  - Functions/variables: `camelCase`.
  - Types/interfaces: `PascalCase`.
  - Constants: `UPPER_SNAKE_CASE` for true constants (regex patterns, threshold values, etc.).
- **Exports**: Prefer `export default` for React components. Use named exports for utility functions, types, and hooks.
- **No default exports** for non-component modules (libs, types, hooks return objects).

### TypeScript

- Always type function parameters and return types explicitly for exported functions.
- Use `interface` for object shapes; use `type` for unions, intersections, and aliases.
- Prefer `type` imports (`import type { ... }`) when importing only types.
- Avoid enums — use string literal union types or `as const` objects instead.

### React & Next.js

- All components in `src/components/` are **client components** (`"use client"` directive).
- Pages and layouts are **server components** by default — keep them thin (no business logic).
- API routes use the Next.js App Router convention (`route.ts` with exported `GET`/`POST` functions).
- Mark API routes with `export const dynamic = "force-dynamic"` when they must not be cached.
- Props interfaces are defined in the same file as the component, named `<ComponentName>Props`.
- Use `RefObject` from React for ref typing — never use `React.MutableRefObject`.
- Avoid `useEffect` for derived state — leverage React Compiler and let values compute inline.

### Styling

- **Tailwind CSS only** — no CSS modules, no inline `style` objects (except for dynamic values like `width`).
- Use conditional class joining with array `.join(" ")` pattern (no `clsx`/`classnames` library).
- Follow the existing color palette: `stone-50` (backgrounds), `gray-*` (text), `emerald-*` (success/found), `red-*` (error), `amber-*` (close match), `blue-*` (primary actions).

### State Management

- Game state lives in `useGameState` hook — no global state library.
- Client-side persistence uses `localStorage` with the `wikiguessr-` key prefix.
- Old caches are automatically cleaned when a new day starts.

### API Design

- API routes return `NextResponse.json(...)`.
- Errors follow the pattern: `{ error: string }` with appropriate HTTP status codes.
- Input validation happens at the API route level before calling into `lib/` functions.
- All errors are caught and logged to console with a `[context]` prefix (e.g., `[api/game]`).

## Database & Prisma

- Schema lives in `prisma/schema.prisma`. Generated client outputs to `generated/prisma/`.
- **Never edit files in `generated/`** — they are auto-generated.
- The Prisma client singleton is in `src/lib/prisma.ts` — always import from there, never instantiate directly.
- In development, the client is cached on `globalThis` to survive HMR.
- Use the PostgreSQL adapter (`@prisma/adapter-pg`) — the connection string comes from `DATABASE_URL` env var.
- After schema changes:
  1. Create a migration: `npx prisma migrate dev --name <description>`
  2. Regenerate the client: `npx prisma generate`

## Linting & Formatting

- **Biome** is the single tool for both linting and formatting.
- Run `npm run lint` to check for issues.
- Run `npm run format` to auto-format all files.
- Biome rules: recommended rules enabled, plus `next` and `react` domains.
- `noUnknownAtRules` is disabled (for Tailwind `@apply`, `@theme`, etc.).
- Always run lint before committing.

## Branching & Workflow

- Default branch: `main`.
- Development branch: `develop`.
- Work on feature branches off `develop`, merge back via pull request.

## Application Architecture

### Daily Page Lifecycle

1. On server startup (`instrumentation.ts`), `ensureDailyWikiPage()` fetches and stores today's Wikipedia article if not already in the database.
2. A cron interval (`startDailyCron`) checks every 60 seconds for day rollover.
3. The article is cached in-memory (server-side) and in PostgreSQL for persistence.

### Game Flow

1. Client calls `GET /api/game` → receives a `MaskedArticle` (tokenized, no revealed words).
2. Player submits a word → `POST /api/game/guess` with `{ word: string }`.
3. Server normalizes the word (lowercase, NFD decomposition, diacritics stripped) and checks against article tokens.
4. Fuzzy matching (Levenshtein distance) is used for near-matches when word length ≥ 4.
5. Response includes `found`, `positions`, `occurrences`, and `similarity` score.
6. Client updates `RevealedMap` and stores progress in `localStorage`.
7. Win condition: all words in the article title are revealed.
8. If the user is authenticated, the win is automatically saved to the database via `POST /api/game/complete`.

### Authentication (Optional)

1. User clicks "Connexion Discord" → `GET /api/auth/login` redirects to Discord OAuth2 with CSRF state cookie.
2. Discord redirects back to `/api/auth/callback` with an authorization code.
3. Server exchanges code for access token, fetches Discord user info, upserts `User` in DB.
4. Server signs a JWT (HMAC-SHA256 via `node:crypto`) and sets it as an `httpOnly` cookie (30 days).
5. Client calls `GET /api/auth/me` on mount to check auth state.
6. Authentication is optional — the game is fully playable without a Discord account.
7. Authenticated users get their game results saved in `GameResult` table and can view stats at `/profile`.

### Key Concepts

- **Token**: Either a `WordToken` (guessable) or `PunctuationToken` (always visible).
- **RevealedMap**: `Record<string, string>` mapping position keys (`section:part:wordIndex`) to display text.
- **Normalization**: All comparisons use NFD-normalized, lowercased, diacritics-stripped strings.
- **Similarity threshold**: Words with similarity ≥ 0.8 are auto-revealed; ≥ 0.55 shown as "close".

## Environment Variables

| Variable               | Required | Description                                                    |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                                   |
| `DISCORD_CLIENT_ID`    | No       | Discord OAuth2 application client ID                           |
| `DISCORD_CLIENT_SECRET`| No       | Discord OAuth2 application client secret                       |
| `DISCORD_REDIRECT_URI` | No       | Discord OAuth2 callback URL (e.g. `http://localhost:3000/api/auth/callback`) |
| `JWT_SECRET`           | No       | Secret key for signing JWT tokens (required if auth is used)   |

## Common Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Check linting (Biome)
npm run format     # Auto-format (Biome)
npx prisma migrate dev    # Run migrations
npx prisma generate       # Regenerate Prisma client
npx prisma studio         # Open Prisma Studio (DB GUI)
```

## Do's and Don'ts

### Do

- Keep components small and focused — extract into new components when exceeding ~100 lines.
- Type all function parameters and return values for exported functions.
- Use `type` imports for type-only imports.
- Validate API inputs at the route handler level.
- Log errors with contextual prefixes (`[module-name]`).
- Use the `@/*` alias for imports.
- Keep server logic in `lib/`, UI logic in `components/` and `hooks/`.
- Run `npm run lint` and `npm run format` before committing.

### Don't

- Don't add `"use client"` to pages or layouts unless absolutely necessary.
- Don't import from `generated/prisma/` directly — use `@/lib/prisma`.
- Don't use `any` — use `unknown` and type-narrow.
- Don't install additional CSS libraries (stick to Tailwind).
- Don't use `React.FC` — use plain function declarations with typed props.
- Don't mutate state directly — always use setter functions.
- Don't store secrets or API keys in code — use environment variables.
- Don't commit `generated/` changes manually — they are auto-generated.
