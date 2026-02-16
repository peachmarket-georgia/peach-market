# 🍑 Peach Market (피치마켓)

조지아 한인 커뮤니티를 위한 중고거래 플랫폼

## 📋 프로젝트 개요

피치마켓은 미국 조지아주 거주 한인들을 위한 신뢰할 수 있는 중고거래 플랫폼입니다. 카카오톡과 페이스북에 흩어져 있던 중고거래를 하나의 플랫폼에 모아, 체계적인 거래 관리와 안전한 거래 환경을 제공합니다.

## 🛠 기술 스택

### Monorepo 구조

- **Turborepo** + **pnpm workspace**

### Frontend ([apps/web](apps/web/README.md))

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui (Radix UI)
- @tabler/icons-react

### Backend ([apps/api](apps/api/README.md))

- NestJS 11
- TypeScript
- PostgreSQL 17
- Prisma 7
- Socket.io
- JWT + OAuth 2.0

### Deployment

- Frontend: Vercel
- Backend/DB: Railway
- Storage: Supabase Storage
- Analytics: Mixpanel, Google Analytics 4

## 🚀 Quick Start

### 사전 요구사항

- Node.js 18 이상
- pnpm 9.0.0
- Docker & Docker Compose (로컬 개발 시)

### 설치

```bash
# 저장소 클론
git clone https://github.com/peachmarket-georgia/peach-market.git
cd peach-market

# 의존성 설치
pnpm install

# 환경변수 설정
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 로컬 개발 환경 실행

#### 1. 개발 서버 실행

```bash
# 루트 디렉토리에서 모든 앱 동시 실행
pnpm dev

# 또는 개별 실행
pnpm dev --filter=@peachmarket/web    # Frontend (포트 3000)
pnpm dev --filter=@peachmarket/api    # Backend (포트 3003)
```

### 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:3003
- PostgreSQL: localhost:5433

## 📁 프로젝트 구조

```
peach-market/
├── apps/
│   ├── web/              # Next.js 프론트엔드
│   └── api/              # NestJS 백엔드
├── packages/
│   ├── shared/           # 공유 타입 및 유틸리티
│   ├── eslint-config/    # ESLint 공유 설정
│   └── typescript-config/# TypeScript 공유 설정
├── docker/
│   └── docker-compose.local.yml  # 로컬 개발용 Docker 설정
├── .claude/
│   └── PRD.md            # Product Requirements Document
├── CLAUDE.md             # Claude AI 작업 가이드
├── package.json          # 루트 패키지 설정
├── pnpm-workspace.yaml   # pnpm workspace 설정
└── turbo.json            # Turborepo 설정
```

## 🎨 컬러 팔레트 (Pantone Peach Fuzz)

| 역할           | 색상        | Hex       |
| -------------- | ----------- | --------- |
| Primary        | 피치 오렌지 | `#FF6B35` |
| Secondary      | 라이트 피치 | `#FFB347` |
| Success        | 그린        | `#4CAF50` |
| Warning        | 옐로우      | `#FFC107` |
| Muted          | 그레이      | `#9E9E9E` |
| Background     | 오프화이트  | `#FAFAFA` |
| Surface        | 화이트      | `#FFFFFF` |
| Text Primary   | 블랙        | `#212121` |
| Text Secondary | 그레이      | `#757575` |

## 📐 반응형 브레이크포인트

| 디바이스      | 브레이크포인트 | 우선순위   |
| ------------- | -------------- | ---------- |
| 모바일 (세로) | 320px - 767px  | **최우선** |
| 태블릿        | 768px - 1023px | 중간       |
| 데스크톱      | 1024px 이상    | 하         |

## 📖 문서

- [PRD (Product Requirements Document)](.claude/PRD.md)
- [Frontend README](apps/web/README.md)
- [Backend README](apps/api/README.md)
- [Claude AI 작업 가이드](CLAUDE.md)

---

**최종 업데이트**: 2026-02-15
**버전**: Phase 1 v1.0
