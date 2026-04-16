# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================
FROM oven/bun:1.3.11 AS dependencies

WORKDIR /app

COPY package.json bun.lock* ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================
FROM oven/bun:1.3.11 AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Dummy build-time env vars to satisfy Zod validation during next build.
# These are NOT carried over to the runner stage; real values come from docker-compose.
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ARG DISCORD_CLIENT_ID=placeholder
ARG DISCORD_CLIENT_SECRET=placeholder
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ENV DATABASE_URL=$DATABASE_URL
ENV DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
ENV DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Generate Prisma client
RUN bunx prisma generate

RUN bun run build

# ============================================
# Stage 3: Minimal Prisma dependencies for migrations
# ============================================
FROM oven/bun:1.3.11-slim AS prisma-deps

WORKDIR /prisma-deps

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun add prisma@7.4.0 dotenv@17.3.1

# ============================================
# Stage 4: Run Next.js application
# ============================================
FROM oven/bun:1.3.11-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy Prisma schema and migrations for runtime migrate
COPY --from=builder --chown=bun:bun /app/prisma ./prisma
COPY --from=builder --chown=bun:bun /app/prisma.config.ts ./prisma.config.ts

# Copy production assets
COPY --from=builder --chown=bun:bun /app/public ./public

RUN mkdir .next
RUN chown bun:bun .next

# Copy standalone output and static files
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Copy generated Prisma client (needed at runtime)
COPY --from=builder --chown=bun:bun /app/generated ./generated

# Copy only minimal node_modules needed for prisma migrate
COPY --from=prisma-deps --chown=bun:bun /prisma-deps/node_modules ./node_modules

# Copy entrypoint script
COPY --from=builder --chown=bun:bun /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

USER bun

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "server.js"]
