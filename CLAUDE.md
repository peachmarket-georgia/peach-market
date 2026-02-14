# Claude AI 작업 가이드

이 문서는 Claude가 피치마켓(Peach Market) 프로젝트를 작업할 때 참고해야 하는 핵심 지침입니다.

## 📋 프로젝트 개요

**피치마켓**은 미국 조지아주 거주 한인들을 위한 중고거래 플랫폼입니다. 카카오톡과 페이스북에 흩어져 있던 거래를 하나의 플랫폼에 모아 신뢰할 수 있는 거래 환경을 제공합니다.

### 핵심 원칙

- **회원제 기반**: 비회원은 랜딩페이지만, 회원은 실제 거래 기능 사용
- **모바일 퍼스트**: 모든 기능은 모바일 화면(320px~767px)에서 최우선 최적화
- **보안 우선**: JWT 인증, Rate Limiting, 입력 검증 필수
- **성능 중시**: Lighthouse 90점 이상, Core Web Vitals 통과

## 🎯 작업 시 필수 확인 사항

### 1. PRD 참조

모든 기능 구현 전 [docs/PRD.md](docs/PRD.md)를 **반드시 확인**하세요:

- 요구사항 (Requirements)
- 수락 기준 (Acceptance Criteria)
- 기술 스택
- 보안 체크리스트
- 개발 공통 체크리스트

### 2. 브랜딩 및 디자인

#### 컬러 팔레트 (Pantone Peach Fuzz 기반)

**모든 UI 컴포넌트에 일관되게 적용**해야 합니다:

| 역할           | 색상        | Hex       | Tailwind 클래스  | 용도                |
| -------------- | ----------- | --------- | ---------------- | ------------------- |
| Primary        | 피치 오렌지 | `#FF6B35` | `bg-primary`     | CTA 버튼, 강조 요소 |
| Secondary      | 라이트 피치 | `#FFB347` | `bg-secondary`   | 보조 요소, 호버     |
| Success        | 그린        | `#4CAF50` | `bg-success`     | 판매중 상태         |
| Warning        | 옐로우      | `#FFC107` | `bg-warning`     | 예약중 상태         |
| Muted          | 그레이      | `#9E9E9E` | `bg-muted`       | 판매완료 상태       |
| Background     | 오프화이트  | `#FAFAFA` | `bg-background`  | 페이지 배경         |
| Surface        | 화이트      | `#FFFFFF` | `bg-surface`     | 카드 배경           |
| Text Primary   | 블랙        | `#212121` | `text-primary`   | 제목, 본문          |
| Text Secondary | 그레이      | `#757575` | `text-secondary` | 보조 텍스트         |

#### 반응형 디자인 우선순위

| 디바이스      | 브레이크포인트 | 우선순위   | Tailwind 접두사     |
| ------------- | -------------- | ---------- | ------------------- |
| 모바일 (세로) | 320px - 767px  | **최우선** | (기본, 접두사 없음) |
| 태블릿        | 768px - 1023px | 중간       | `md:`               |
| 데스크톱      | 1024px 이상    | 하         | `lg:`, `xl:`        |

**중요**: 모든 컴포넌트는 모바일 화면에서 먼저 디자인하고, 이후 태블릿/데스크톱으로 확장합니다.

#### UI 컴포넌트

- **shadcn/ui** 사용 권장 (Radix UI 기반)
- 일관된 디자인 시스템 유지
- 아이콘: Lucide React

### 3. 보안 체크리스트 (필수)

**모든 API 엔드포인트와 기능 구현 시 필수 확인:**

#### 인증/인가

- [ ] JWT 검증 (NestJS Guard)
- [ ] Refresh Token 로테이션 (재사용 감지)
- [ ] httpOnly 쿠키 사용 (XSS 방지)
- [ ] SameSite=Strict 쿠키 설정 (CSRF 방지)
- [ ] 비밀번호 해싱 (bcrypt, salt rounds: 10)

#### 입력 검증

- [ ] NestJS DTO + class-validator (모든 요청 검증)
- [ ] SQL Injection 방지 (Prisma parameterized queries)
- [ ] XSS 방지 (React 자동 이스케이프 + 사용자 입력 검증)
- [ ] 파일 업로드 검증 (MIME 타입, 크기 제한, 파일명 sanitization)

#### Rate Limiting

- [ ] 로그인 시도: 5회/분 (IP 기준)
- [ ] 회원가입: 3회/시간 (IP 기준)
- [ ] API 요청: 100회/분 (사용자 기준)
- [ ] 채팅 메시지: 30회/분 (사용자 기준)

#### CORS

- [ ] 허용 도메인 화이트리스트
- [ ] credentials: true (쿠키 전송 허용)

## 🏗️ 아키텍처 및 기술 스택

### Monorepo 구조

```
peach-market/
├── apps/
│   ├── web/              # Next.js 16 (React 19, Tailwind CSS 4)
│   └── api/              # NestJS 11 (PostgreSQL, Prisma 7)
├── packages/
│   ├── shared/           # 공유 타입 및 유틸리티
│   ├── eslint-config/    # ESLint 공유 설정
│   └── typescript-config/# TypeScript 공유 설정
├── docker/
│   └── docker-compose.local.yml
├── docs/
│   └── PRD.md            # Product Requirements Document
└── CLAUDE.md             # 이 파일
```

### Frontend (apps/web)

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Component Library**: shadcn/ui (Radix UI)
- **Icons**: Lucide React

### Backend (apps/api)

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: PostgreSQL 17
- **ORM**: Prisma 7
- **Real-time**: Socket.io (실시간 채팅)
- **Authentication**: JWT + bcrypt, Google OAuth 2.0
- **File Storage**: Supabase Storage
- **Testing**: Jest

### Deployment

- Frontend: Vercel
- Backend/DB: Railway
- Storage: Supabase Storage
- Analytics: Mixpanel, Google Analytics 4

## 📝 코딩 규칙

### 1. TypeScript

- **타입 안정성**: `any` 사용 금지 (불가피한 경우 `unknown` 사용)
- **인터페이스 vs 타입**: 확장 가능한 경우 `interface`, 유니온/인터섹션은 `type`
- **Shared Types**: 공통 타입은 `packages/shared`에 정의

```typescript
// ✅ Good
interface User {
  id: string
  email: string
  nickname: string
}

type Status = 'SELLING' | 'RESERVED' | 'SOLD'

// ❌ Bad
const user: any = {...}
```

### 2. 네이밍 컨벤션

- **파일명**: kebab-case (`user-profile.tsx`, `auth.service.ts`)
- **컴포넌트**: PascalCase (`UserProfile`, `LoginForm`)
- **함수/변수**: camelCase (`getUserProfile`, `isLoggedIn`)
- **상수**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_URL`)
- **Private 필드**: `_`로 시작 (`_handleClick`, `_userId`)

### 3. 컴포넌트 구조 (React)

```tsx
// ✅ Good: Server Component (기본)
import { getListings } from '@/lib/api'

export default async function ListingsPage() {
  const listings = await getListings()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

// Client Component는 'use client' 명시
;('use client')

import { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')

  return <form>...</form>
}
```

### 4. API 레이어 (NestJS)

```typescript
// ✅ Good: DTO 사용
import { IsString, IsInt, MaxLength, Min } from 'class-validator'

export class CreateListingDto {
  @IsString()
  @MaxLength(50)
  title: string

  @IsInt()
  @Min(0)
  price: number
}

// Controller
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateListingDto, @CurrentUser() user: User) {
    return this.listingsService.create(dto, user.id)
  }
}
```

### 5. Prisma 스키마

```prisma
// ✅ Good: 명확한 관계 정의
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  nickname     String   @unique
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  listings     Listing[]
  bookmarks    Bookmark[]
}

model Listing {
  id          String   @id @default(cuid())
  title       String
  price       Int      // 센트 단위
  status      String   @default("SELLING")
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

## 🧪 테스트 (추후 추가)

### Frontend (Jest + React Testing Library)

```tsx
// ✅ Good
import { render, screen } from '@testing-library/react'
import LoginForm from './login-form'

describe('LoginForm', () => {
  it('renders email and password inputs', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })
})
```

### Backend (Jest)

```typescript
// ✅ Good
describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should hash password correctly', async () => {
    const password = 'test1234'
    const hashed = await service.hashPassword(password)

    expect(hashed).not.toBe(password)
    expect(await bcrypt.compare(password, hashed)).toBe(true)
  })
})
```

## 🚫 안티패턴 (피해야 할 것들)

### 1. 보안

```typescript
// ❌ Bad: 비밀번호 평문 저장
user.password = req.body.password

// ✅ Good: bcrypt 해싱
user.password = await bcrypt.hash(req.body.password, 10)

// ❌ Bad: SQL Injection 위험
const users = await db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ Good: Prisma 사용 (자동 parameterized queries)
const users = await prisma.user.findUnique({ where: { email } })
```

### 2. 성능

```typescript
// ❌ Bad: N+1 쿼리 문제
const listings = await prisma.listing.findMany()
for (const listing of listings) {
  listing.user = await prisma.user.findUnique({ where: { id: listing.userId } })
}

// ✅ Good: include로 한 번에 조회
const listings = await prisma.listing.findMany({
  include: { user: true }
})

// ❌ Bad: 클라이언트에서 큰 이미지 전송
<img src="/huge-image.jpg" />

// ✅ Good: Next.js Image 최적화
<Image src="/huge-image.jpg" width={800} height={600} alt="..." />
```

### 3. 타입 안정성

```typescript
// ❌ Bad: any 사용
function processData(data: any) {
  return data.name.toUpperCase() // 런타임 에러 위험
}

// ✅ Good: 명확한 타입
interface User {
  name: string
}

function processData(data: User) {
  return data.name.toUpperCase() // 타입 안전
}
```

## 📚 추가 참고 자료

- [PRD 문서](docs/PRD.md) - **가장 중요**
- [Frontend README](apps/web/README.md)
- [Backend README](apps/api/README.md)
- [Root README](README.md)

## 🤖 Claude 작업 팁

### 기능 구현 순서

1. **PRD 확인** → 요구사항 및 수락 기준 읽기
2. **타입 정의** → `packages/shared`에 인터페이스 작성
3. **백엔드 구현** → Prisma 스키마 → DTO → Service → Controller
4. **프론트엔드 구현** → UI 컴포넌트 → API 통신 → 상태 관리
5. **보안 체크** → 인증/인가, 입력 검증, Rate Limiting 확인
6. **테스트** → 단위 테스트, E2E 테스트 (추후)
7. **반응형 확인** → 모바일, 태블릿, 데스크톱 동작 확인

### 커밋 메시지

```bash
# ✅ Good
git commit -m "feat: Add user authentication with JWT"
git commit -m "fix: Resolve listing pagination bug"
git commit -m "docs: Update API endpoints in README"

# ❌ Bad
git commit -m "update"
git commit -m "fix bug"
```

### 질문할 때

- 요구사항이 불명확하면 **PRD를 참조**하거나 명확히 질문하세요
- 보안/성능 관련 트레이드오프는 사용자에게 선택지를 제시하세요
- 디자인 결정 사항은 PRD의 컬러 팔레트와 브랜딩 가이드를 따르세요

---

**최종 업데이트**: 2026-02-15
**문서 버전**: 1.0
