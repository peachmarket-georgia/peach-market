# ============================================
# Stage 1: Install Dependencies
# ============================================
FROM node:22.14-alpine AS deps

WORKDIR /app

RUN npm install -g pnpm@9.0.0

# Copy workspace config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json for each workspace package (needed for pnpm workspace resolution)
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build
# ============================================
FROM deps AS build

WORKDIR /app

# Build args for NEXT_PUBLIC vars (baked in at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_MIXPANEL_TOKEN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_MIXPANEL_TOKEN=$NEXT_PUBLIC_MIXPANEL_TOKEN

# Copy source code
COPY apps/web ./apps/web
COPY packages ./packages

# Build Next.js
RUN pnpm --filter @peachmarket/web build

# ============================================
# Stage 3: Production Runner (standalone)
# ============================================
FROM node:22.14-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# outputFileTracingRoot = repo root 이므로 standalone 구조:
#   apps/web/.next/standalone/
#     ├── node_modules/
#     ├── apps/web/server.js
#     └── package.json
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
