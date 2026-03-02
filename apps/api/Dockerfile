# ============================================
# Stage 1: Install Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install dependencies needed for native modules (bcrypt, sharp)
RUN apk add --no-cache python3 make g++ vips-dev

# Copy package.json (no lockfile in this sub-package)
COPY package.json ./
COPY prisma ./prisma/

# Install all dependencies (need devDeps for build)
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

# Verify build output
RUN if [ ! -f dist/main.js ]; then echo "ERROR: dist/main.js not found!" && exit 1; fi

# ============================================
# Stage 3: Production Dependencies
# ============================================
FROM node:22-alpine AS prod-deps

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN pnpm install --prod

# Generate Prisma client
RUN pnpm exec prisma generate

# ============================================
# Stage 4: Production Runner
# ============================================
FROM node:22-alpine AS runner

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

USER nestjs

# Railway injects PORT env variable
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3003}/api/health || exit 1

CMD ["node", "dist/main.js"]
