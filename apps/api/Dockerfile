# ============================================
# Stage 1: Install Dependencies
# ============================================
FROM node:22.14-alpine AS deps

WORKDIR /app

# Install pnpm and node-gyp globally (node-gyp needed for bcrypt/sharp native builds)
RUN npm install -g pnpm@9.0.0 node-gyp

# Install dependencies needed for native modules (bcrypt, sharp)
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package.json (no lockfile in this sub-package)
COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install

# Generate Prisma client
RUN pnpm exec prisma generate

# ============================================
# Stage 2: Build
# ============================================
FROM deps AS build

WORKDIR /app

# Copy source code
COPY . .

# Build NestJS
RUN pnpm run build

# Verify build output (NestJS outputs to dist/src/)
RUN if [ ! -f dist/src/main.js ]; then echo "ERROR: dist/src/main.js not found!" && exit 1; fi

# ============================================
# Stage 3: Production Dependencies
# ============================================
FROM node:22.14-alpine AS prod-deps

WORKDIR /app

# Install pnpm and node-gyp globally (node-gyp needed for bcrypt/sharp native builds)
RUN npm install -g pnpm@9.0.0 node-gyp

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install
RUN pnpm exec prisma generate
RUN pnpm prune --prod

# ============================================
# Stage 4: Production Runner
# ============================================
FROM node:22.14-alpine AS runner

WORKDIR /app

# Runtime dependencies for sharp
RUN apk add --no-cache vips

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

ENV NODE_ENV=production

# Copy only necessary files from build stages
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

# prisma CLI is devDependency (removed by pnpm prune --prod), copy from deps stage for migrate deploy
COPY --from=deps --chown=nestjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=deps --chown=nestjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nestjs

# Railway injects PORT env variable
EXPOSE 3003

# Health check (start-period accounts for prisma migrate + NestJS bootstrap time)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3003}/api/health/live || exit 1

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
