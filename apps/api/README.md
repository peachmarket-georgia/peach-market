# 🍑 Peach Market - Backend (API)

NestJS 11 기반 피치마켓 백엔드 API 서버

## 🚀 시작하기

### 환경 변수 설정

```bash
cp .env.example .env
```

### 개발 서버 실행

```bash
# 1. PostgreSQL 실행 (Docker Compose)
cd ../../  # 루트 디렉토리로 이동
docker-compose -f docker/docker-compose.local.yml up -d

# 2. 데이터베이스 마이그레이션
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate

# 3. 개발 모드 실행 (watch 모드)
pnpm dev

# 4. 프로덕션 빌드
pnpm build

# 5. 프로덕션 모드 실행
pnpm start:prod

# 타입 체크
pnpm check-types

# 린트
pnpm lint

# 테스트
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:e2e
```

## 🗄️ 데이터베이스 (Prisma)

### Prisma CLI 명령어

```bash
# 마이그레이션 생성 및 적용
pnpm prisma migrate dev --name init

# 프로덕션 마이그레이션 적용
pnpm prisma migrate deploy

# Prisma Client 생성
pnpm prisma generate

# Prisma Studio (DB GUI)
pnpm prisma studio

# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
pnpm prisma migrate reset

# 시드 데이터 추가
pnpm prisma db seed
```
