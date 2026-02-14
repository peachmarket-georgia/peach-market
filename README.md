# 🍑 피치마켓 (Peach Market)

조지아 한인 커뮤니티의 신뢰할 수 있는 중고거래 플랫폼

> 카카오톡방, 페이스북에 흩어진 매물을 한곳에서

## 해결하는 문제

- 거래 히스토리 추적 불가
- 거래 상태(판매중/예약중/완료) 관리 불가
- 게시글이 대화에 묻힘
- 외부 채널(개인톡)로 전환 필요

## Tech Stack

| Category     | Technology                                      |
| ------------ | ----------------------------------------------- |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Backend**  | NestJS 11, Prisma ORM, PostgreSQL               |
| **Chat**     | Socket.IO (예정)                                |
| **Auth**     | NextAuth.js (Google OAuth)                      |
| **Infra**    | Turborepo, pnpm, Docker, Vercel (FE), GCP (BE)  |

## Project Structure

```
peachmarket/
├── apps/
│   ├── web/                 # Next.js 프론트엔드 (:3000)
│   │   ├── app/
│   │   │   ├── (marketing)/ # 랜딩페이지 (비회원)
│   │   │   └── (app)/       # 메인 앱 (회원)
│   │   └── components/
│   └── api/                 # NestJS 백엔드 (:4000)
│       ├── src/
│       └── prisma/
├── packages/
│   ├── shared/              # 공유 TypeScript 타입
│   ├── eslint-config/
│   └── typescript-config/
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Docker Desktop

### Installation

```bash
# 의존성 설치
pnpm install

# 환경변수 설정
cp apps/api/.env.example apps/api/.env

# DB 실행
docker compose up -d

# Prisma 마이그레이션
cd apps/api && npx prisma migrate dev

# 개발 서버 실행
pnpm dev
```

## Development

```bash
pnpm dev              # 전체 앱 실행
pnpm build            # 빌드
pnpm lint             # 린트
pnpm format           # 코드 포맷팅
pnpm check-types      # 타입 체크
```

### Database

```bash
docker compose up -d      # DB 시작
docker compose down       # DB 중지
docker compose down -v    # DB 초기화

# Prisma
cd apps/api
npx prisma studio         # DB GUI
npx prisma migrate dev    # 마이그레이션
```

### Testing (API)

```bash
cd apps/api
pnpm test             # 단위 테스트
pnpm test:e2e         # E2E 테스트
```

## MVP Features

### P0 (필수)

- Google OAuth 로그인 + 프로필 온보딩
- 게시글 CRUD (이미지 최대 5장)
- 거래 상태: 판매중 / 예약중 / 판매완료 / 드림(무료)
- 카테고리 10종: 가구, 유아/아동, 의류, 도서/교육, 생활용품, 전자기기, 운동/레저, 식품, 자동차, 기타
- 검색 및 필터 (카테고리, 가격대, 지역)
- 1:1 채팅

### P1

- 프로필 및 거래 내역
- 찜(북마크) 기능
- 드림(무료) 태그/필터

## Target Regions

스와니, 둘루스, 뷰포드, 슈가힐, 존스크릭, 알파레타, 로렌스빌, 애틀랜타, 도라빌, 브룩헤이븐

## Design System

Pantone 2024 "Peach Fuzz" 컬러 팔레트

- Primary: `#FFBE98`
- Secondary: `#FED5BC`
- Accent: `#FEE7D8`

## Documentation

- [PRD v1.1](.claude/docs/peachmarket-prd-v1.1.md)

## License

Private
