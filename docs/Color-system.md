# PeachMarket Color System

조지아 로컬 중고거래 서비스를 위한 컬러 시스템.

마켓플레이스에서 주인공은 상품 사진이기 때문에, 브랜드 컬러 하나만 강하게 가져가고 나머지는 뉴트럴로 구성합니다.

---

## Brand

메인 컬러는 `#EE6E42`. 당근마켓 `#FF6F0F`가 순수 오렌지라면, 이건 빨간기가 살짝 섞인 코럴-피치 톤입니다.

복숭아라고 인식되면서도 당근과 확실히 구별됩니다.

| Token         | Hex       | Usage                                      |
| ------------- | --------- | ------------------------------------------ |
| peach         | `#EE6E42` | CTA 버튼, 로고, FAB, 하단 네비 활성 아이콘 |
| peach-hover   | `#D4572F` | 버튼 호버, 브랜드 텍스트 링크              |
| peach-pressed | `#B94A28` | 프레스 / 액티브 상태                       |
| peach-subtle  | `#FDF0EC` | 뱃지 배경, 선택된 카테고리 하이라이트      |
| peach-muted   | `#FCDDD3` | "New" 뱃지, 선택 상태 배경                 |

---

## Foreground

| Token        | Hex       | Usage                       |
| ------------ | --------- | --------------------------- |
| fg-default   | `#171717` | 제목, 본문 텍스트           |
| fg-secondary | `#737373` | 보조 텍스트, 설명           |
| fg-tertiary  | `#A3A3A3` | 플레이스홀더, 비활성 아이콘 |
| fg-inverse   | `#FFFFFF` | 버튼 위 텍스트              |
| fg-brand     | `#D4572F` | 브랜드 컬러 텍스트, 링크    |

---

## Background

| Token        | Hex       | Usage                |
| ------------ | --------- | -------------------- |
| bg-primary   | `#FFFFFF` | 카드, 모달           |
| bg-secondary | `#F5F5F5` | 인풋 배경, 섹션 구분 |
| bg-tertiary  | `#E5E5E5` | 디바이더, 스켈레톤   |
| bg-page      | `#FAFAFA` | 페이지 배경          |

---

## Border

| Token          | Hex       | Usage             |
| -------------- | --------- | ----------------- |
| border-default | `#E5E5E5` | 카드, 인풋 테두리 |
| border-subtle  | `#F0F0F0` | 은은한 구분선     |
| border-strong  | `#D4D4D4` | 포커스 링         |

---

## Status

| Token          | Hex       | Usage            |
| -------------- | --------- | ---------------- |
| success        | `#16A34A` | 거래완료, 인증됨 |
| success-subtle | `#F0FDF4` | 성공 배경        |
| error          | `#DC2626` | 에러, 삭제       |
| error-subtle   | `#FEF2F2` | 에러 배경        |
| warning        | `#D97706` | 예약중, 주의     |
| warning-subtle | `#FFFBEB` | 주의 배경        |
| info           | `#2563EB` | 정보, 링크       |
| info-subtle    | `#EFF6FF` | 정보 배경        |

---

## Tailwind Config

```tsx
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        peach: {
          DEFAULT: '#EE6E42',
          hover: '#D4572F',
          pressed: '#B94A28',
          subtle: '#FDF0EC',
          muted: '#FCDDD3',
        },
        fg: {
          DEFAULT: '#171717',
          secondary: '#737373',
          tertiary: '#A3A3A3',
          inverse: '#FFFFFF',
          brand: '#D4572F',
        },
        surface: {
          primary: '#FFFFFF',
          secondary: '#F5F5F5',
          tertiary: '#E5E5E5',
          page: '#FAFAFA',
        },
        border: {
          DEFAULT: '#E5E5E5',
          subtle: '#F0F0F0',
          strong: '#D4D4D4',
        },
        success: {
          DEFAULT: '#16A34A',
          subtle: '#F0FDF4',
        },
        error: {
          DEFAULT: '#DC2626',
          subtle: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#D97706',
          subtle: '#FFFBEB',
        },
        info: {
          DEFAULT: '#2563EB',
          subtle: '#EFF6FF',
        },
      },
    },
  },
}

export default config
```

---

## CSS Variables

```css
:root {
  /* Brand */
  --color-peach: #ee6e42;
  --color-peach-hover: #d4572f;
  --color-peach-pressed: #b94a28;
  --color-peach-subtle: #fdf0ec;
  --color-peach-muted: #fcddd3;

  /* Foreground */
  --color-fg: #171717;
  --color-fg-secondary: #737373;
  --color-fg-tertiary: #a3a3a3;

  /* Background */
  --color-bg: #ffffff;
  --color-bg-page: #fafafa;
  --color-bg-secondary: #f5f5f5;

  /* Border */
  --color-border: #e5e5e5;
  --color-border-subtle: #f0f0f0;
  --color-border-strong: #d4d4d4;

  /* Status */
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #d97706;
  --color-info: #2563eb;
}
```
