# ============================================
# Stage 1: Install Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package.json (no lockfile in this sub-package)
COPY package.json ./
COPY prisma ./prisma/

# Install all dependencies (need devDeps for build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# ============================================
# Stage 2: Build
# ============================================
FROM deps AS build

WORKDIR /app

# Copy source code
COPY . .

# Build NestJS
RUN npm run build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:22-alpine AS runner

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

    WORKDIR /app

    ENV NODE_ENV=production
    ENV PORT=3003

    # Copy only necessary files from build stages
    COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
    COPY --from=deps --chown=nestjs:nodejs /app/prisma ./prisma
    COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
    COPY --from=build --chown=nestjs:nodejs /app/package.json ./package.json

    USER nestjs

    EXPOSE 3003

    # Health check
    HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
      CMD wget --no-verbose --tries=1 --spider http://localhost:3003/api/health || exit 1

      CMD ["node", "dist/main"]
