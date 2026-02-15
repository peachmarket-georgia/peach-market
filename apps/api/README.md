# 🍑 Peach Market - Backend (API)

NestJS 11 기반 피치마켓 백엔드 API 서버

## 🛠 기술 스택

- **Framework**: NestJS 11.0.1
- **Language**: TypeScript 5.7.3
- **Database**: PostgreSQL 17
- **ORM**: Prisma 7.3.0
- **Real-time**: Socket.io (추후 추가)
- **Authentication**: JWT + bcrypt, Google OAuth 2.0 (Passport.js)
- **File Upload**: Multer + Supabase Storage (추후 추가)
- **Testing**: Jest 30.0.0

## 📁 프로젝트 구조

```
apps/api/
├── src/
│   ├── main.ts              # 앱 엔트리포인트
│   ├── app.module.ts        # 루트 모듈
│   ├── common/              # 공통 모듈
│   │   └── repositories/    # Repository 패턴 베이스
│   │       └── base.repository.ts
│   ├── chat/                # 채팅 모듈
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat-rooms.repository.ts
│   │   └── messages.repository.ts
│   └── prisma/              # Prisma 서비스
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── prisma/
│   ├── schema.prisma        # Prisma 스키마
│   └── migrations/          # 데이터베이스 마이그레이션
├── test/                    # E2E 테스트
├── .env                     # 환경 변수 (git ignore)
├── .env.example             # 환경 변수 예시
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🏛️ 아키텍처: Repository 패턴

이 프로젝트는 **Repository 패턴**을 사용하여 데이터 접근 로직을 분리합니다.

### 레이어 구조

```
Controller → Service → Repository → Prisma (DB)
```

- **Controller**: HTTP 요청/응답 처리
- **Service**: 비즈니스 로직
- **Repository**: 데이터 접근 로직 (Prisma 쿼리 캡슐화)

### BaseRepository 인터페이스

모든 Repository는 `BaseRepository` 인터페이스를 구현합니다:

```typescript
// common/repositories/base.repository.ts
export interface BaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: CreateInput): Promise<T>
  update(id: string, data: UpdateInput): Promise<T>
  delete(id: string): Promise<T>
}
```

### 새 모듈 추가 시 구조

```
src/[module-name]/
├── [module-name].module.ts       # 모듈 정의
├── [module-name].controller.ts   # HTTP 엔드포인트
├── [module-name].service.ts      # 비즈니스 로직
└── [model-name].repository.ts    # 데이터 접근
```

## 🚀 시작하기

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# 서버 포트
PORT=4000

# Database URL (Prisma)
DATABASE_URL=postgresql://peachmarket:peachmarket123@localhost:95432/peachmarket

# JWT 인증 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 개발 서버 실행

```bash
# PostgreSQL 실행 (Docker Compose)
docker-compose -f docker/docker-compose.local.yml up -d

# 데이터베이스 마이그레이션
pnpm prisma migrate dev
pnpm prisma generate

# 개발 모드 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 모드 실행
pnpm start:prod

# 타입 체크
pnpm check-types

# 린트
pnpm lint
```

개발 서버가 [http://localhost:4000](http://localhost:4000)에서 실행됩니다.

## 📡 API 엔드포인트

### 채팅 (Chat) - Repository 구현됨

```
GET    /chat/rooms               # 채팅방 목록
GET    /chat/rooms/:id           # 채팅방 조회 (메시지 포함)
POST   /chat/rooms               # 채팅방 생성
GET    /chat/rooms/:id/messages  # 메시지 목록
POST   /chat/rooms/:id/messages  # 메시지 전송
PATCH  /chat/rooms/:id/read      # 메시지 읽음 처리
```

## 🗄️ 데이터베이스 (Prisma)

### Prisma CLI 명령어

```bash
# 마이그레이션 생성 및 적용
pnpm prisma migrate dev --name init

# Prisma Client 생성
pnpm prisma generate

# Prisma Studio (DB GUI)
pnpm prisma studio

# 마이그레이션 리셋 (주의: 데이터 삭제)
pnpm prisma migrate reset
```

## 🛡️ 보안

### Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
```

### CORS 설정

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
})
```

## 🧪 테스트 (추후 추가)

```bash
# 단위 테스트
pnpm test

# E2E 테스트
pnpm test:e2e
```

## 📦 배포 (Railway)

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 배포
railway up
```

### 환경변수 설정 (Railway)

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: 프로덕션 JWT Secret
- `CORS_ORIGIN`: 프론트엔드 URL

## 🔧 트러블슈팅

### Prisma Client 오류

```bash
pnpm prisma generate
```

### 데이터베이스 연결 오류

- `.env` 파일의 `DATABASE_URL` 확인
- PostgreSQL 서버 실행 확인

## 📚 참고 자료

- [NestJS 문서](https://docs.nestjs.com)
- [Prisma 문서](https://www.prisma.io/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs)

---

**메인테이너**: Peach Market Team
**최종 업데이트**: 2026-02-15
