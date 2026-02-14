# 🍑 Peach Market - Frontend (Web)

Next.js 16 기반 피치마켓 프론트엔드 애플리케이션

## 🛠 기술 스택

- **Framework**: Next.js 16.1.5 (App Router, Turbopack)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS 4.1.18
- **Component Library**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## 📁 프로젝트 구조

```
apps/web/
├── src/
│   ├── app/                  # Next.js App Router 페이지
│   │   ├── (auth)/          # 인증 관련 페이지 그룹
│   │   ├── (main)/          # 메인 페이지 그룹
│   │   ├── layout.tsx       # 루트 레이아웃
│   │   └── page.tsx         # 홈 페이지
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── ui/             # shadcn/ui 컴포넌트
│   │   └── ...             # 커스텀 컴포넌트
│   ├── lib/                # 유틸리티 함수
│   ├── hooks/              # 커스텀 React Hooks
│   ├── stores/             # 상태 관리 (Zustand 등)
│   └── types/              # TypeScript 타입 정의
├── public/                 # 정적 파일
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 시작하기

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# API 서버 URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Google OAuth 2.0 (선택)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Analytics (선택)
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-ga-id
```

### 개발 서버 실행

```bash
# 개발 모드 실행 (Turbopack)
pnpm dev

# 포트 지정
pnpm dev -- --port 3000

# 빌드
pnpm build

# 프로덕션 모드 실행
pnpm start

# 타입 체크
pnpm check-types

# 린트
pnpm lint
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 📱 주요 페이지

### 인증 페이지

- `/login` - 로그인
- `/signup` - 회원가입
- `/auth/google/callback` - Google OAuth 콜백
- `/auth/onboarding` - OAuth 사용자 온보딩
- `/forgot-password` - 비밀번호 재설정

### 메인 페이지

- `/` - 랜딩 페이지 (비회원) / 홈 (회원)
- `/listings` - 매물 목록
- `/listings/[id]` - 매물 상세
- `/listings/new` - 매물 등록
- `/listings/[id]/edit` - 매물 수정
- `/chat` - 채팅 목록
- `/chat/[id]` - 채팅방
- `/profile` - 마이페이지
- `/profile/[id]` - 타 사용자 프로필
- `/search` - 검색 결과

## 🎨 디자인 시스템

### 컬러 팔레트 (Pantone Peach Fuzz)

Tailwind CSS 설정에 정의된 커스텀 컬러:

```css
primary: #FF6B35      /* 피치 오렌지 */
secondary: #FFB347    /* 라이트 피치 */
success: #4CAF50      /* 그린 */
warning: #FFC107      /* 옐로우 */
muted: #9E9E9E        /* 그레이 */
```

### 타이포그래피

- **헤딩**:
  - H1: 2rem (32px) / font-bold
  - H2: 1.5rem (24px) / font-semibold
  - H3: 1.25rem (20px) / font-semibold
- **본문**: 1rem (16px) / font-normal
- **작은 텍스트**: 0.875rem (14px)

### 브레이크포인트

```js
sm: '640px' // 모바일 가로
md: '768px' // 태블릿
lg: '1024px' // 데스크톱
xl: '1280px' // 대형 데스크톱
```

**모바일 퍼스트**: 모든 컴포넌트는 모바일 화면(320px~767px)을 최우선으로 최적화합니다.

## 🧩 shadcn/ui 컴포넌트

shadcn/ui를 사용하여 일관된 UI 컴포넌트를 제공합니다.

### 컴포넌트 추가

```bash
# shadcn/ui 컴포넌트 추가
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add card
```

### 사용 예시

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function MyComponent() {
  return (
    <Card>
      <Input placeholder="이메일" />
      <Button variant="default">로그인</Button>
    </Card>
  )
}
```

## 🔌 API 통신

### Fetch 래퍼 (예시)

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // httpOnly 쿠키 전송
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}
```

### 사용 예시

```typescript
// Server Component
async function getListings() {
  return fetchAPI('/listings?limit=20')
}

// Client Component
;('use client')

async function createListing(data: ListingData) {
  return fetchAPI('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

## 🔐 인증 처리

### JWT 쿠키 기반 인증

- Access Token: httpOnly cookie (15분)
- Refresh Token: httpOnly cookie (7일)
- 자동 갱신: API 레이어에서 처리

### 인증 체크 예시

```typescript
// middleware.ts (예시)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')

  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/listings/new', '/chat/:path*', '/profile'],
}
```

## 📊 상태 관리

### Local State

- `useState`, `useReducer` (React Hooks)

### Server State

- Server Components (Next.js App Router 기본)
- `fetch` with caching

### Global State (선택)

- Zustand 또는 Context API 사용 권장

## 🎯 성능 최적화

### 이미지 최적화

```tsx
import Image from 'next/image'
;<Image
  src="/hero.jpg"
  alt="피치마켓"
  width={1200}
  height={600}
  priority // LCP 이미지는 priority
/>
```

### 코드 스플리팅

```tsx
import dynamic from 'next/dynamic'

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // 클라이언트 전용
})
```

### 폰트 최적화

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## 🧪 테스트 (추후 추가)

```bash
# 단위 테스트 (Jest)
pnpm test

# E2E 테스트 (Playwright)
pnpm test:e2e
```

## 📦 빌드 및 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 환경변수 설정 (Vercel)

Vercel 대시보드에서 다음 환경변수를 설정하세요:

- `NEXT_PUBLIC_API_URL`: 프로덕션 API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `NEXT_PUBLIC_MIXPANEL_TOKEN`: Mixpanel 토큰
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics ID

## 🔧 트러블슈팅

### Turbopack 오류

Turbopack에서 특정 패키지 오류 발생 시:

```bash
# Webpack으로 전환
pnpm dev -- --no-turbopack
```

### 타입 오류

```bash
# 타입 체크
pnpm check-types

# node_modules 재설치
rm -rf node_modules .next
pnpm install
```

### 환경변수 인식 안됨

- `NEXT_PUBLIC_` 접두사 확인
- 서버 재시작 필수

## 📚 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [React 19 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

---

**메인테이너**: Peach Market Team
**최종 업데이트**: 2026-02-15
