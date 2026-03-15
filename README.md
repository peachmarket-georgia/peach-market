# 🍑 Peach Market (피치마켓)

조지아 한인 커뮤니티를 위한 중고거래 플랫폼

## 📋 프로젝트 개요

피치마켓은 미국 조지아주 거주 한인들을 위한 신뢰할 수 있는 중고거래 플랫폼입니다. 카카오톡과 페이스북에 흩어져 있던 중고거래를 하나의 플랫폼에 모아, 체계적인 거래 관리와 안전한 거래 환경을 제공합니다.

### 주요 기능

- **회원제 마켓플레이스** — 이메일/비밀번호 및 Google OAuth 2.0 로그인, 비회원은 랜딩페이지만 접근
- **상품 등록/관리** — 이미지 최대 5장 업로드, 카테고리/상태 관리, 무한 스크롤
- **실시간 1:1 채팅** — Socket.io 기반, 읽음/안읽음 표시, 타이핑 인디케이터
- **검색 및 필터** — 한국어 키워드 검색, 카테고리/상태/정렬 필터
- **거래 예약 시스템** — 판매중 → 예약중 → 판매완료 상태 관리
- **찜(북마크)** — 관심 상품 저장 및 목록 조회
- **신고 시스템** — 게시글/사용자 신고, 관리자 검토 및 조치
- **관리자 대시보드** — 사용자/상품/신고 관리
- **푸시 알림** — 웹 푸시 기반 새 메시지/거래 상태 알림

## 🛠 기술 스택

### Monorepo 구조

- **Turborepo** + **pnpm workspace**

### Frontend ([apps/web](apps/web/README.md))

| 기술                | 버전 | 용도                        |
| ------------------- | ---- | --------------------------- |
| Next.js             | 16   | App Router, Turbopack       |
| React               | 19   | UI 라이브러리               |
| TypeScript          | -    | 타입 안정성                 |
| Tailwind CSS        | 4    | 스타일링                    |
| shadcn/ui           | -    | UI 컴포넌트 (Radix UI 기반) |
| @tabler/icons-react | 3    | 아이콘                      |
| Socket.io Client    | 4    | 실시간 채팅                 |

### Backend ([apps/api](apps/api/README.md))

| 기술             | 버전 | 용도             |
| ---------------- | ---- | ---------------- |
| NestJS           | 11   | 서버 프레임워크  |
| TypeScript       | -    | 타입 안정성      |
| PostgreSQL       | 17   | 데이터베이스     |
| Prisma           | 7    | ORM              |
| Socket.io        | 4    | 실시간 채팅      |
| JWT + bcrypt     | -    | 인증/보안        |
| Passport         | -    | Google OAuth 2.0 |
| Supabase Storage | -    | 이미지 저장소    |
| Resend           | -    | 이메일 발송      |
| Jest             | 30   | 테스트           |

### Mobile ([apps/mobile](apps/mobile/))

| 기술         | 버전 | 용도              |
| ------------ | ---- | ----------------- |
| React Native | 0.81 | 모바일 프레임워크 |
| Expo         | 54   | 개발 도구         |
| Expo Router  | 6    | 네비게이션        |

> WebView 기반으로 Next.js 웹앱을 로드하는 구조

### Deployment

| 서비스     | 플랫폼           | 용도                  |
| ---------- | ---------------- | --------------------- |
| Frontend   | Vercel           | 웹 호스팅             |
| Backend/DB | Railway          | API 서버 + PostgreSQL |
| Storage    | Supabase         | 이미지 저장           |
| Analytics  | Mixpanel + GA4   | 사용자 행동 분석      |
| Monitoring | Vercel Analytics | 성능 모니터링         |

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

### 환경변수 설정

#### Backend (`apps/api/.env`)

| 변수                                | 설명                       | 필수       |
| ----------------------------------- | -------------------------- | ---------- |
| `DATABASE_URL`                      | PostgreSQL 연결 문자열     | O          |
| `JWT_SECRET`                        | JWT 서명 키 (32자 이상)    | O          |
| `FRONTEND_URL`                      | 프론트엔드 URL (CORS)      | O          |
| `API_SECRET_KEY`                    | 프록시 인증 키             | O          |
| `GOOGLE_CLIENT_ID`                  | Google OAuth 클라이언트 ID | O          |
| `GOOGLE_CLIENT_SECRET`              | Google OAuth 시크릿        | O          |
| `GOOGLE_CALLBACK_URL`               | OAuth 콜백 URL             | O          |
| `RESEND_API_KEY`                    | 이메일 발송 API 키         | O          |
| `SUPABASE_URL`                      | Supabase 프로젝트 URL      | O          |
| `SUPABASE_SERVICE_ROLE_KEY`         | Supabase 서비스 키         | O          |
| `SWAGGER_USER` / `SWAGGER_PASSWORD` | Swagger 보호               | 선택       |
| `COOKIE_DOMAIN`                     | 프로덕션 쿠키 도메인       | 프로덕션만 |

#### Frontend (`apps/web/.env`)

| 변수                              | 설명                        | 필수 |
| --------------------------------- | --------------------------- | ---- |
| `API_URL`                         | 서버사이드 API URL          | O    |
| `API_SECRET_KEY`                  | 프록시 인증 키 (API와 동일) | O    |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API 키          | O    |
| `NEXT_PUBLIC_GA_ID`               | Google Analytics 4 ID       | 선택 |
| `NEXT_PUBLIC_MIXPANEL_TOKEN`      | Mixpanel 토큰               | 선택 |

### 로컬 개발 환경 실행

```bash
# 루트 디렉토리에서 모든 앱 동시 실행 (Docker + Turbopack)
pnpm dev

# 또는 개별 실행
pnpm dev --filter=@peachmarket/web    # Frontend (포트 3000)
pnpm dev --filter=@peachmarket/api    # Backend (포트 3003)
```

### 데이터베이스 초기 설정

```bash
# Prisma 마이그레이션 적용
cd apps/api
pnpm prisma migrate dev

# 시드 데이터 생성 (테스트 사용자 + 상품 + 채팅)
pnpm prisma db seed
```

**시드 데이터 계정:**

| 이메일                  | 비밀번호            | 역할   |
| ----------------------- | ------------------- | ------ |
| `admin@peachmarket.app` | `P3ach!Adm1n@2026#` | 관리자 |
| `test1@peachmarket.com` | `peach1234!`        | 판매자 |
| `test2@peachmarket.com` | `peach1234!`        | 구매자 |

### 접속

| 서비스                 | URL                               |
| ---------------------- | --------------------------------- |
| Frontend               | http://localhost:3000             |
| Backend API            | http://localhost:3003             |
| API 문서 (Swagger)     | http://localhost:3003/api/docs    |
| Prisma Studio (DB GUI) | `pnpm prisma studio` 실행 후 접속 |
| PostgreSQL             | localhost:5433                    |

## 🔧 개발 스크립트

### 빌드 및 실행

```bash
pnpm dev              # Docker + 전체 개발 서버 실행
pnpm build            # 전체 프로덕션 빌드
```

### 코드 품질

```bash
pnpm lint             # ESLint 검사
pnpm format           # Prettier 자동 포맷
pnpm format:check     # 포맷 검사 (CI용)
pnpm check-types      # TypeScript 타입 검사
```

### 테스트

```bash
pnpm test             # 전체 테스트 실행
pnpm test:api         # API 유닛 테스트
pnpm test:api:cov     # API 테스트 + 커버리지
pnpm test:api:e2e     # API E2E 테스트
```

### 데이터베이스

```bash
cd apps/api
pnpm prisma migrate dev         # 마이그레이션 생성 및 적용
pnpm prisma migrate deploy      # 프로덕션 마이그레이션 적용
pnpm prisma generate            # Prisma Client 생성
pnpm prisma studio              # DB GUI 실행
pnpm prisma db seed             # 시드 데이터 생성
pnpm prisma migrate reset       # DB 초기화 (주의: 데이터 삭제)
```

### 타입 생성

```bash
# Swagger → TypeScript 타입 자동 생성 (API 서버 실행 필요)
pnpm swagger-to-type --url "http://localhost:3003/api/docs-json" -o ./apps/web/src/types/api.ts
```

## 📁 프로젝트 구조

```
peach-market/
├── apps/
│   ├── web/              # Next.js 프론트엔드
│   ├── api/              # NestJS 백엔드
│   └── mobile/           # React Native (Expo) 모바일 앱
├── packages/
│   ├── shared/           # 공유 타입 및 유틸리티
│   ├── eslint-config/    # ESLint 공유 설정
│   └── typescript-config/# TypeScript 공유 설정
├── docker/
│   └── docker-compose.local.yml  # 로컬 개발용 Docker 설정
├── docs/
│   ├── PRD.md            # Product Requirements Document
│   └── Color-system.md   # 컬러 시스템 가이드
├── CLAUDE.md             # Claude AI 작업 가이드
├── package.json          # 루트 패키지 설정
├── pnpm-workspace.yaml   # pnpm workspace 설정
└── turbo.json            # Turborepo 설정
```

### API 모듈 구조

| 모듈         | 경로                    | 설명                                                  |
| ------------ | ----------------------- | ----------------------------------------------------- |
| Auth         | `modules/auth/`         | 회원가입, 로그인, OAuth, 이메일 인증, 비밀번호 재설정 |
| Users        | `modules/users/`        | 프로필 관리, 중복 체크                                |
| Products     | `modules/products/`     | 상품 CRUD, 검색, 찜                                   |
| Reservations | `modules/reservations/` | 거래 예약, 확인, 취소                                 |
| Chat         | `chat/`                 | 채팅방 관리, 실시간 메시지 (WebSocket Gateway)        |
| Upload       | `modules/upload/`       | 이미지 업로드 (Supabase Storage)                      |
| Push         | `modules/push/`         | 웹 푸시 알림                                          |
| Reports      | `modules/reports/`      | 게시글/사용자 신고                                    |
| Admin        | `modules/admin/`        | 관리자 대시보드                                       |
| Health       | `core/health/`          | 서버 상태 체크                                        |

### 프론트엔드 라우트 구조

| 경로                                          | 설명            | 접근        |
| --------------------------------------------- | --------------- | ----------- |
| `/`                                           | 랜딩페이지      | 공개        |
| `/login`, `/signup`                           | 인증            | 공개        |
| `/forgot-password`, `/reset-password/[token]` | 비밀번호 재설정 | 공개        |
| `/verify-email/[token]`                       | 이메일 인증     | 공개        |
| `/marketplace`                                | 상품 목록       | 로그인 필요 |
| `/marketplace/[id]`                           | 상품 상세       | 로그인 필요 |
| `/marketplace/new`, `/marketplace/[id]/edit`  | 상품 등록/수정  | 로그인 필요 |
| `/chat`, `/chat/[roomId]`                     | 채팅            | 로그인 필요 |
| `/mypage`                                     | 마이페이지      | 로그인 필요 |
| `/admin/**`                                   | 관리자 대시보드 | 관리자 전용 |

## 🎨 컬러 팔레트

| 역할           | 색상        | Hex       |
| -------------- | ----------- | --------- |
| Primary        | 피치        | `#f97272` |
| Peach Hover    | 피치 호버   | `#D4572F` |
| Success        | 그린        | `#16A34A` |
| Warning        | 옐로우      | `#D97706` |
| Error          | 레드        | `#DC2626` |
| Background     | 페이지 배경 | `#FAFAFA` |
| Surface        | 카드 배경   | `#FFFFFF` |
| Text Primary   | 본문        | `#171717` |
| Text Secondary | 보조 텍스트 | `#737373` |

> 전체 컬러 시스템은 [docs/Color-system.md](docs/Color-system.md) 참조

## 📐 반응형 브레이크포인트

| 디바이스      | 브레이크포인트 | 우선순위   |
| ------------- | -------------- | ---------- |
| 모바일 (세로) | 320px - 767px  | **최우선** |
| 태블릿        | 768px - 1023px | 중간       |
| 데스크톱      | 1024px 이상    | 하         |

## 🌿 브랜치 전략

| 브랜치       | 용도                 |
| ------------ | -------------------- |
| `main`       | 프로덕션 배포 브랜치 |
| `develop`    | 개발 통합 브랜치     |
| `feat/*`     | 새 기능 개발         |
| `fix/*`      | 버그 수정            |
| `refactor/*` | 리팩토링             |
| `chore/*`    | 설정/환경 변경       |

PR은 `develop` → `main` 방향으로 생성합니다.

## 📖 문서

- [PRD (Product Requirements Document)](docs/PRD.md)
- [컬러 시스템](docs/Color-system.md)
- [Frontend README](apps/web/README.md)
- [Backend README](apps/api/README.md)
- [Claude AI 작업 가이드](CLAUDE.md)

---

**최종 업데이트**: 2026-03-15
**버전**: Phase 1 v2.1
