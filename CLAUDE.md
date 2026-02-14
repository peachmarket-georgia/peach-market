# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

피치마켓 - 조지아 한인 커뮤니티 중고거래 플랫폼. 회원제 기반으로, 비회원은 랜딩페이지에서 더미 매물만 확인 가능하고 실제 기능은 로그인 후 접근.

**PRD**: `.claude/docs/peachmarket-prd-v1.1.md`

## Development Commands

```bash
# Start all apps (web on :3000, api on :4000)
pnpm dev

# Build all apps
pnpm build

# Lint and type check
pnpm lint                    # All apps
pnpm lint:web                # Web only
pnpm lint:api                # API only
pnpm check-types

# Format code
pnpm format                  # Format all files
pnpm format:check            # Check without writing

# Run single app
pnpm dev --filter=@peachmarket/web
pnpm dev --filter=@peachmarket/api
```

### Database (PostgreSQL via Docker)

```bash
docker compose up -d          # Start
docker compose down           # Stop
docker compose down -v        # Reset (deletes data)
```

### Prisma (in apps/api)

```bash
npx prisma migrate dev --name <description>
npx prisma generate
npx prisma studio
```

### API Testing (in apps/api)

```bash
pnpm test              # Unit tests
pnpm test:watch        # Watch mode
pnpm test:e2e          # E2E tests
```

## Architecture

Turborepo monorepo with pnpm workspaces:

- **apps/web**: Next.js 16 (React 19, Tailwind CSS 4, shadcn/ui)
- **apps/api**: NestJS 11 with Prisma ORM, Socket.IO (채팅)
- **packages/shared**: 공유 TypeScript 타입 (`@peachmarket/shared`)
- **packages/eslint-config**: ESLint configurations
- **packages/typescript-config**: TypeScript configurations

### Web App Routing (Next.js App Router)

```
app/
├─ (marketing)/     # 비회원 - 랜딩페이지
├─ (app)/           # 회원 - 메인 앱
│  ├─ marketplace/  # 매물 리스트
│  └─ ...
└─ api/             # API routes
```

**접근 제어**: 비회원은 `(marketing)` 만 접근, 회원은 `(app)` 접근 가능. 미들웨어로 리다이렉트 처리.

### Database Models

`apps/api/prisma/schema.prisma` 참조:

- **User**: 사용자 (Google OAuth)
- **Product**: 게시글 (상태: SELLING/RESERVED/SOLD)
- **ChatRoom/Message**: 1:1 채팅
- **Review**: 거래 후기
- **Favorite**: 찜

## MVP Features (우선순위)

### P0 (필수)

- Google OAuth + 프로필 온보딩
- 게시글 CRUD (이미지 최대 5장)
- 거래 상태: 판매중 / 예약중 / 판매완료 / 드림(무료)
- 검색/필터 (카테고리, 가격대, 지역)
- 1:1 채팅 (Socket.IO)

### P1

- 프로필/거래 내역
- 찜(북마크)

### 카테고리 (10종)

가구/인테리어, 유아/아동, 의류/잡화, 도서/교육, 생활용품, 전자기기, 운동/레저, 식품, 자동차, 기타

### 지역 (데이터 기반 정렬)

Suwanee, Duluth, Buford, Sugar Hill, Johns Creek, Alpharetta, Lawrenceville, Atlanta, Doraville, Brookhaven

## Design System

Pantone 2024 "Peach Fuzz" 컬러 (`apps/web/app/globals.css`):

- Primary: `#FFBE98`
- Secondary: `#FED5BC`
- Accent: `#FEE7D8`

shadcn/ui "new-york" style:

```bash
cd apps/web && npx shadcn@latest add <component>
```

## Git Hooks

Pre-commit (Husky + lint-staged):

- TypeScript/JavaScript: ESLint fix + Prettier
- JSON, Markdown, CSS, YAML: Prettier

## Environment Setup

Copy `apps/api/.env.example` to `apps/api/.env`. Database runs on port 5433.
