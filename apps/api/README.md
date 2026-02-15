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
│   ├── migrations/          # 데이터베이스 마이그레이션
│   └── seed.ts              # 초기 데이터 시드
├── test/                    # E2E 테스트
├── .env                     # 환경 변수 (git ignore)
├── .env.example             # 환경 변수 예시
├── Dockerfile.local         # 로컬 개발용 Docker 이미지
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

### Repository 구현 예시

```typescript
// chat/chat-rooms.repository.ts
@Injectable()
export class ChatRoomsRepository implements BaseRepository<
  ChatRoom,
  Prisma.ChatRoomCreateInput,
  Prisma.ChatRoomUpdateInput
> {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({ where: { id } })
  }

  // 기본 메서드 외 도메인 특화 메서드 추가
  async findByUserId(userId: string): Promise<ChatRoom[]> {
    return this.prisma.chatRoom.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    })
  }
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

# PostgreSQL 설정
POSTGRES_DB=peachmarket
POSTGRES_USER=peachmarket
POSTGRES_PASSWORD=peachmarket123
TZ=Asia/Seoul
PGTZ=Asia/Seoul

# Database URL (Prisma)
DATABASE_URL=postgresql://peachmarket:peachmarket123@localhost:95432/peachmarket

# JWT 인증 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth 2.0 (추후 추가)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Supabase Storage (추후 추가)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
SUPABASE_BUCKET=peachmarket-images

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3000
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

개발 서버가 [http://localhost:4000](http://localhost:4000)에서 실행됩니다.

## 📡 API 엔드포인트

### 구현 완료

#### 채팅 (Chat)

```
GET    /chat/rooms               # 채팅방 목록
GET    /chat/rooms/:id           # 채팅방 조회 (메시지 포함)
POST   /chat/rooms               # 채팅방 생성
GET    /chat/rooms/:id/messages  # 메시지 목록
POST   /chat/rooms/:id/messages  # 메시지 전송
PATCH  /chat/rooms/:id/read      # 메시지 읽음 처리
```

### 구현 예정

#### 인증 (Auth)

```
POST   /auth/signup              # 회원가입
POST   /auth/login               # 로그인
POST   /auth/logout              # 로그아웃
POST   /auth/refresh             # Access Token 갱신
GET    /auth/me                  # 현재 사용자 정보
GET    /auth/google              # Google OAuth 로그인
```

#### 사용자 (Users)

```
GET    /users/:id                # 사용자 프로필 조회
PATCH  /users/me                 # 내 프로필 수정
```

#### 게시글 (Listings)

```
GET    /listings                 # 게시글 목록
GET    /listings/:id             # 게시글 상세
POST   /listings                 # 게시글 작성
PATCH  /listings/:id             # 게시글 수정
DELETE /listings/:id             # 게시글 삭제
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

### 스키마 예시 (`prisma/schema.prisma`)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String?  // OAuth 사용자는 null
  nickname     String   @unique
  profileImage String?
  location     String
  provider     String?  // 'email' | 'google'
  providerId   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  listings     Listing[]
  bookmarks    Bookmark[]
  chatRooms    ChatRoomParticipant[]
  messages     Message[]
  notifications Notification[]
}

model Listing {
  id          String   @id @default(cuid())
  title       String
  description String
  price       Int      // 센트 단위
  category    String
  location    String
  images      String[] // URL 배열
  status      String   @default("SELLING") // SELLING | RESERVED | SOLD
  viewCount   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId      String
  user        User     @relation(fields: [userId], references: [id])
  bookmarks   Bookmark[]
  chatRooms   ChatRoom[]
}
```

## 🔐 인증 및 인가

### JWT 인증 플로우

1. **로그인** → Access Token (15분) + Refresh Token (7일) 발급
2. **API 요청** → `Authorization: Bearer {accessToken}` 헤더
3. **Access Token 만료** → `/auth/refresh`로 갱신
4. **Refresh Token 만료** → 재로그인 필요

### Guards 사용 예시

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { CurrentUser } from './auth/decorators/current-user.decorator'

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: User) {
    return user
  }
}
```

### Google OAuth 2.0 플로우

1. 프론트엔드 → `GET /auth/google` 호출
2. Google 로그인 화면 표시
3. 사용자 인증 후 → `GET /auth/google/callback`
4. 신규 사용자 → 온보딩 페이지로 리다이렉트
5. 기존 사용자 → JWT 발급 및 로그인 완료

## 🛡️ 보안

### Rate Limiting

```typescript
// main.ts
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60초
        limit: 100, // 100번 요청
      },
    ]),
  ],
})
export class AppModule {}
```

### CORS 설정

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // httpOnly 쿠키 허용
})
```

### Validation Pipe

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common'

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // DTO에 없는 속성 제거
    forbidNonWhitelisted: true, // 허용되지 않은 속성 시 에러
    transform: true, // 자동 타입 변환
  })
)
```

### DTO 예시

```typescript
// dto/create-listing.dto.ts
import { IsString, IsInt, IsArray, MaxLength, Min } from 'class-validator'

export class CreateListingDto {
  @IsString()
  @MaxLength(50)
  title: string

  @IsString()
  @MaxLength(2000)
  description: string

  @IsInt()
  @Min(0)
  price: number

  @IsString()
  category: string

  @IsArray()
  @IsString({ each: true })
  images: string[]

  @IsString()
  location: string
}
```

## 🧪 테스트

### 단위 테스트

```bash
# 모든 테스트 실행
pnpm test

# watch 모드
pnpm test:watch

# 커버리지
pnpm test:cov
```

### E2E 테스트

```bash
# E2E 테스트 실행
pnpm test:e2e
```

### 테스트 예시

```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
```

## 📦 배포 (Railway)

### Railway CLI 배포

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
railway init

# 배포
railway up
```

### 환경변수 설정 (Railway)

Railway 대시보드에서 다음 환경변수를 설정하세요:

- `DATABASE_URL`: PostgreSQL 연결 문자열 (자동 생성)
- `JWT_SECRET`: 프로덕션 JWT Secret (강력한 랜덤 문자열)
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL`: `https://api.peachmarket.com/auth/google/callback`
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`
- `CORS_ORIGIN`: `https://peachmarket.com`

## 🔧 트러블슈팅

### Prisma Client 오류

```bash
# Prisma Client 재생성
pnpm prisma generate

# node_modules 재설치
rm -rf node_modules
pnpm install
```

### 데이터베이스 연결 오류

- `.env` 파일의 `DATABASE_URL` 확인
- PostgreSQL 서버 실행 확인
- 포트 충돌 확인 (95432)

### 마이그레이션 오류

```bash
# 마이그레이션 상태 확인
pnpm prisma migrate status

# 마이그레이션 리셋 (주의: 데이터 삭제)
pnpm prisma migrate reset
```

## 📚 참고 자료

- [NestJS 문서](https://docs.nestjs.com)
- [Prisma 문서](https://www.prisma.io/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs)
- [Socket.io 문서](https://socket.io/docs)
- [Passport.js 문서](http://www.passportjs.org/docs)

---

**메인테이너**: Peach Market Team
**최종 업데이트**: 2026-02-15
