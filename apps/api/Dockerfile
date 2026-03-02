# ============================================
# Stage 1: Install Dependencies
# ============================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

# ============================================
# Stage 2: Build NestJS
# ============================================
FROM deps AS build

WORKDIR /app

COPY . .

RUN npm run build && ls -la dist/ && echo "Build output verified"

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

    WORKDIR /app

    ENV NODE_ENV=production
    ENV PORT=3003

    COPY --from=build /app/dist ./dist
    COPY --from=deps /app/node_modules ./node_modules
    COPY --from=deps /app/prisma ./prisma
    COPY --from=build /app/package.json ./package.json

    RUN ls -la dist/ && echo "Dist verified in runner stage"

    USER nestjs

    EXPOSE 3003

    CMD ["node", "dist/main.js"]
