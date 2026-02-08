/**
 * 더미 데이터
 */

export type ProductStatus = "판매중" | "예약중" | "판매완료";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: ProductStatus;
  imageUrl: string;
  images: string[];
  location: string;
  timeAgo: string;
  seller: {
    name: string;
    profileImage: string;
    rating: number;
    reviewCount: number;
  };
  viewCount: number;
  chatCount: number;
  likeCount: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "애플워치 울트라 2 거의 새것",
    description:
      "작년 12월에 구매한 애플워치 울트라 2입니다. 사용감 거의 없고 박스, 충전기 모두 포함입니다. 직거래 선호하며 둘루스 H마트 근처에서 만나요.",
    price: 650000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop",
    ],
    location: "둘루스",
    timeAgo: "3분 전",
    seller: {
      name: "김민수",
      profileImage: "https://i.pravatar.cc/150?u=1",
      rating: 4.8,
      reviewCount: 23,
    },
    viewCount: 45,
    chatCount: 3,
    likeCount: 12,
  },
  {
    id: "2",
    name: "삼성 갤럭시 버즈3 프로 미개봉",
    description:
      "회사에서 받은 선물인데 이미 에어팟이 있어서 판매합니다. 미개봉 새상품이고 영수증도 있습니다.",
    price: 180000,
    status: "예약중",
    imageUrl:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
    ],
    location: "스와니",
    timeAgo: "15분 전",
    seller: {
      name: "이지영",
      profileImage: "https://i.pravatar.cc/150?u=2",
      rating: 5.0,
      reviewCount: 8,
    },
    viewCount: 89,
    chatCount: 7,
    likeCount: 24,
  },
  {
    id: "3",
    name: "다이슨 에어랩 컴플리트",
    description:
      "1년 정도 사용했습니다. 구성품 모두 있고 상태 양호합니다. 이사 가면서 정리합니다.",
    price: 350000,
    status: "판매완료",
    imageUrl:
      "https://images.unsplash.com/photo-1522338242042-2d1c2665861a?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1522338242042-2d1c2665861a?w=800&h=800&fit=crop",
    ],
    location: "존스크릭",
    timeAgo: "1시간 전",
    seller: {
      name: "박서연",
      profileImage: "https://i.pravatar.cc/150?u=3",
      rating: 4.9,
      reviewCount: 31,
    },
    viewCount: 156,
    chatCount: 12,
    likeCount: 45,
  },
  {
    id: "4",
    name: "아이폰 15 Pro Max 256GB 블랙",
    description:
      "사용한 지 3개월 됐습니다. 케이스 끼고 사용해서 기스 없습니다. 배터리 성능 99%입니다. 박스, 충전기 포함.",
    price: 1200000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop",
    ],
    location: "둘루스",
    timeAgo: "2시간 전",
    seller: {
      name: "최준혁",
      profileImage: "https://i.pravatar.cc/150?u=4",
      rating: 4.7,
      reviewCount: 15,
    },
    viewCount: 234,
    chatCount: 8,
    likeCount: 67,
  },
  {
    id: "5",
    name: "맥북 프로 14인치 M3 Pro 실버",
    description:
      "2024년 1월 구매. 업무용으로 사용했고 집에서만 사용해서 상태 최상입니다. AppleCare+ 2025년 12월까지 남아있습니다.",
    price: 2800000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop",
    ],
    location: "알파레타",
    timeAgo: "3시간 전",
    seller: {
      name: "정다은",
      profileImage: "https://i.pravatar.cc/150?u=5",
      rating: 5.0,
      reviewCount: 42,
    },
    viewCount: 312,
    chatCount: 15,
    likeCount: 89,
  },
  {
    id: "6",
    name: "닌텐도 스위치 OLED + 게임 5개",
    description:
      "스위치 OLED 화이트 모델입니다. 젤다, 마리오카트, 동물의 숲 등 게임 5개 포함. 프로컨트롤러도 같이 드립니다.",
    price: 280000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&h=800&fit=crop",
    ],
    location: "둘루스",
    timeAgo: "5시간 전",
    seller: {
      name: "한소희",
      profileImage: "https://i.pravatar.cc/150?u=6",
      rating: 4.6,
      reviewCount: 11,
    },
    viewCount: 98,
    chatCount: 4,
    likeCount: 23,
  },
  {
    id: "7",
    name: "LG 스탠바이미 27인치",
    description:
      "이동식 TV로 정말 편합니다. 구매한 지 6개월 됐고 상태 좋습니다. 직거래만 가능합니다.",
    price: 450000,
    status: "예약중",
    imageUrl:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop",
    ],
    location: "스와니",
    timeAgo: "6시간 전",
    seller: {
      name: "윤재민",
      profileImage: "https://i.pravatar.cc/150?u=7",
      rating: 4.9,
      reviewCount: 28,
    },
    viewCount: 187,
    chatCount: 9,
    likeCount: 56,
  },
  {
    id: "8",
    name: "소니 WH-1000XM5 헤드폰",
    description:
      "노이즈캔슬링 최고입니다. 8개월 사용했고 케이스, 충전케이블 포함입니다.",
    price: 220000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=800&fit=crop",
    ],
    location: "버포드",
    timeAgo: "8시간 전",
    seller: {
      name: "송민아",
      profileImage: "https://i.pravatar.cc/150?u=8",
      rating: 4.8,
      reviewCount: 19,
    },
    viewCount: 76,
    chatCount: 2,
    likeCount: 18,
  },
  {
    id: "9",
    name: "발뮤다 토스터 화이트",
    description:
      "발뮤다 토스터 화이트입니다. 토스트 정말 맛있게 구워집니다. 박스 있습니다.",
    price: 85000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1585237017125-24baf8d7406f?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1585237017125-24baf8d7406f?w=800&h=800&fit=crop",
    ],
    location: "둘루스",
    timeAgo: "1일 전",
    seller: {
      name: "임수진",
      profileImage: "https://i.pravatar.cc/150?u=9",
      rating: 4.5,
      reviewCount: 7,
    },
    viewCount: 54,
    chatCount: 1,
    likeCount: 9,
  },
  {
    id: "10",
    name: "캠핑 텐트 4인용 + 타프 세트",
    description:
      "코베아 텐트와 타프 세트입니다. 5번 정도 사용했고 상태 좋습니다. 캠핑 그만두면서 정리합니다.",
    price: 150000,
    status: "판매중",
    imageUrl:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&h=800&fit=crop",
    ],
    location: "로렌스빌",
    timeAgo: "1일 전",
    seller: {
      name: "강동원",
      profileImage: "https://i.pravatar.cc/150?u=10",
      rating: 4.7,
      reviewCount: 14,
    },
    viewCount: 123,
    chatCount: 5,
    likeCount: 34,
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find((p) => p.id === id);
};
